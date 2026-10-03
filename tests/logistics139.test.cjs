'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,C,doc;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();}
function corner(){
 const core=g.core();
 for(let r=4;r<25;r++)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){
  const x=core.gx+dx,y=core.gy+dy;if(!g.world.placement(C.BUILDINGS.house,x,y,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'house',x,y,0,1);g.world.add(b);
  const near={x:b.left-17,y:b.bottom-17},far={x:b.left+17,y:b.bottom+17};
  if(g.friendlyPositionClear(g.player,near.x,near.y)&&g.friendlyPositionClear(g.player,far.x,far.y)&&!g.nightGear.localLineClear(near,far))return {b,near,far};
  g.world.remove(b);
 }
 throw Error('No solid house corner with two free approaches.');
}
test('139 module tombé : un angle de bâtiment interdit le retrait, reprise et récupération unique',()=>{
 start();const {b,near,far}=corner(),target=g.essentials.targets()[0],prepared=g.serialize();
 // Prepare a module recovered earlier in the campaign; the drop itself uses
 // the real death/relief handlers, without inventing a second ground record.
 prepared.frontier.seen.push(target.poi);prepared.essentials.jobs[target.id]={stage:'player'};
 assert.equal(g.restoreSave(prepared),true);Object.assign(g.player,near);
 g.player.carry.scrap=3.125;g.player.invulnerable=0;g.damagePlayer(10000);
 assert.equal(g.successionUI133.isOpen(),true);assert.equal(g.essentials.snapshot().jobs[target.id].stage,'ground');
 assert.equal(g.successionUI133.choose('porter'),true);doc.getElementById('succession133Confirm').click();Object.assign(g.player,far);
 assert.equal(g.friendlyPositionClear(g.player,far.x,far.y),true);assert.equal(g.friendlyPositionClear(g.player,near.x,near.y),true);
 assert.ok(Math.hypot(near.x-far.x,near.y-far.y)<70);assert.equal(g.hostileLineClear(far,near),true,'The legacy enclosure-only ray misses this house.');
 assert.equal(g.nightGear.localLineClear(far,near),false);assert.equal(g.world.buildings.get(b.id).completed,true);
 const before=g.essentials.snapshot(),resources={...g.resources},bag={...g.player.carry},remains=g.succession133.remains();
 assert.equal(g.essentials.takeGround(target.id).ok,false);assert.deepEqual(g.essentials.snapshot(),before);
 assert.deepEqual(g.resources,resources);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.succession133.remains(),remains);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);
 assert.equal(g.essentials.takeGround(target.id).ok,false);assert.deepEqual(g.essentials.snapshot(),before);
 Object.assign(g.player,near);assert.equal(g.nightGear.localLineClear(g.player,before.jobs[target.id].point),true);
 assert.equal(g.essentials.takeGround(target.id).ok,true);assert.equal(g.essentials.snapshot().jobs[target.id].stage,'player');
 assert.equal(g.essentials.takeGround(target.id).ok,false);assert.deepEqual(g.resources,resources);assert.deepEqual(g.player.carry,bag);
 assert.equal(g.succession133.remains()[0].bag.scrap,3.125,'The separate corpse bag is untouched by module pickup.');
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);
 assert.equal(g.essentials.snapshot().jobs[target.id].stage,'player');assert.equal(g.essentials.takeGround(target.id).ok,false);
});
test('139 poste monté : assemblage, soin et manipulation de kits refusés sans coût puis permis après restitution',()=>{
 start();const target=g.essentials.targets().find(t=>t.family==='aid'),prepared=g.serialize();
 prepared.frontier.seen.push(target.poi);prepared.essentials.jobs[target.id]={stage:'delivered'};prepared.essentials.stock.aid=2;prepared.essentials.belt.aid=1;
 assert.equal(g.restoreSave(prepared),true);
 const core=g.core();let tower;
 search:for(let r=3;r<7;r++)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){
  const x=core.gx+dx,y=core.gy+dy;if(!g.world.placement(C.BUILDINGS.watchtower,x,y,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',x,y,0,1);g.world.add(b);
  for(let i=0;i<32;i++){
   Object.assign(g.player,{x:b.x+Math.cos(i*Math.PI/16)*55,y:b.y+Math.sin(i*Math.PI/16)*55});
   if(g.loadout.atHome()&&g.fieldcraft.control(b)){tower=b;break search;}
  }
  g.world.remove(b);
 }
 assert.ok(tower,'Free physical approach shared by depot and tower.');assert.equal(g.fieldcraft.context().mounted,tower.id);
 g.player.health=20;const before=g.essentials.snapshot(),resources={...g.resources},bag={...g.player.carry};
 assert.equal(g.essentials.preview('craft','aid').ok,false);assert.equal(g.essentials.begin('craft','aid').ok,false);
 assert.equal(g.essentials.use('aid').ok,false);assert.equal(g.essentials.transferKit('aid','equip').ok,false);
 assert.equal(g.essentials.transferKit('aid','store').ok,false);
 assert.equal(g.loadout.transfer('depot','sac','scrap',3.125).ok,false);assert.deepEqual(g.player.carry,bag);
 assert.deepEqual(g.essentials.snapshot(),before);assert.deepEqual(g.resources,resources);assert.equal(g.player.health,20);
 assert.equal(g.fieldcraft.context().mounted,tower.id,'Refusal does not silently release the post.');
 assert.equal(g.fieldcraft.control(),true);assert.equal(g.fieldcraft.context().mounted,null);
 assert.equal(g.loadout.transfer('depot','sac','scrap',3.125).amount,3.125);assert.equal(g.player.carry.scrap,3.125);assert.equal(g.resources.scrap,resources.scrap-3.125);
 assert.equal(g.essentials.use('aid').amount,40);assert.equal(g.player.health,60);assert.equal(g.essentials.snapshot().belt.aid,0);
 assert.equal(g.essentials.begin('craft','aid').ok,true);for(let i=0;i<126&&g.essentials.busy();i++)g.update(.04);
 assert.equal(g.essentials.busy(),false);assert.equal(g.essentials.snapshot().stock.aid,before.stock.aid+1);
 assert.equal(g.resources.medicine,resources.medicine-C.Essentials.RULES.kits.aid.cost.medicine);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.essentials.snapshot().stock.aid,3);
});
test('139 module régional : une dépouille réellement relevée interdit le retrait jusqu’à neutralisation',()=>{
 g.startNew('standard','6');g.campaignIntro132.skip();const w=g.frontier.world(),home=globalThis.DeadwallAtlasProjection.home(w);let point;
 for(let dy=130;dy<300&&!point;dy+=10)for(let dx=0;dx<300;dx+=10){
  const p={x:home.x+dx,y:home.y+dy},q={x:p.x+1.5,y:p.y};
  if(!w.blocked(p.x,p.y,.32,0,null)&&!w.blocked(q.x,q.y,.32,0,null)&&w.line(p,q,0,null,null,.05)){point=p;break;}
 }
 assert.ok(point);const target=g.essentials.targets()[0],prepared=g.serialize();
 prepared.frontier.seen.push(target.poi);prepared.essentials.jobs[target.id]={stage:'player'};
 Object.assign(prepared.frontier,{active:true,...point,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});
 assert.equal(g.restoreSave(prepared),true);g.player.invulnerable=0;g.frontier.damage(10000);
 assert.equal(g.essentials.snapshot().jobs[target.id].stage,'ground');assert.equal(g.succession133.remains()[0].body.phase,'waiting');
 assert.equal(g.successionUI133.choose('porter'),true);doc.getElementById('succession133Confirm').click();
 // Advance the actual bounded reanimation timer while the successor is at D-17.
 // A regional body cannot attack or move in this different domain.
 for(let i=0;i<1501;i++)g.succession133.step(.1);
 assert.equal(g.succession133.contacts()[0].id,'fallen:1');assert.equal(g.succession133.contacts()[0].hp,C.SuccessionRules.health);
 const returned=g.serialize();Object.assign(returned.frontier,{active:true,x:point.x+1.5,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});
 assert.equal(g.restoreSave(returned),true);const enemy=g.succession133.contacts()[0];assert.equal(g.frontier.visibleEnemy(enemy),true);
 assert.equal(g.frontier.overview().enemies.filter(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-point.x-1.5,e.y-point.y)<C.Essentials.RULES.danger).length,0);
 const before=g.essentials.snapshot(),bag={...g.player.carry},resources={...g.resources};
 assert.equal(g.essentials.takeGround(target.id).ok,false);assert.deepEqual(g.essentials.snapshot(),before);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,resources);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.essentials.takeGround(target.id).ok,false);
 assert.equal(g.succession133.hit(enemy.x,enemy.y,C.SuccessionRules.health,0,null,enemy.id),true);
 assert.equal(g.succession133.contacts().length,0);assert.equal(g.essentials.takeGround(target.id).ok,true);assert.equal(g.essentials.takeGround(target.id).ok,false);
 assert.equal(g.essentials.snapshot().jobs[target.id].stage,'player');assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,resources);
});
test('139 module régional : les vrais contacts d’une horde sauvage bloquent aussi le retrait, même juste après reprise',()=>{
 start();Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);g.update(.04);
 const w=g.frontier.world(),groups=g.worldEvolution.snapshot().groups;let point;
 for(const h of groups){
  for(let dy=0;dy<20&&!point;dy++)for(let dx=0;dx<20;dx++){
   const p={x:h.x+dx,y:h.y+dy},q={x:p.x+1.5,y:p.y};
   if(!w.blocked(p.x,p.y,.32,0,null)&&!w.blocked(q.x,q.y,.32,0,null)&&w.line(p,q,0,null,null,.05)){point=p;break;}
  }
  if(point)break;
 }
 assert.ok(point,'The real generated group has a free physical road approach.');
 const target=g.essentials.targets()[0],prepared=g.serialize();prepared.frontier.seen.push(target.poi);prepared.essentials.jobs[target.id]={stage:'player'};
 Object.assign(prepared.frontier,{active:true,...point,z:0,inside:null,car:null});assert.equal(g.restoreSave(prepared),true);
 g.player.invulnerable=0;g.frontier.damage(10000);assert.equal(g.succession133.remains()[0].body.phase,'rest');
 assert.equal(g.successionUI133.choose('porter'),true);doc.getElementById('succession133Confirm').click();
 const returned=g.serialize();Object.assign(returned.frontier,{active:true,x:point.x+1.5,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});assert.equal(g.restoreSave(returned),true);g.update(.04);
 const nearby=()=>g.worldEvolution.groupMembers().filter(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-point.x-1.5,e.y-point.y)<C.Essentials.RULES.danger&&g.frontier.visibleEnemy(e));
 assert.ok(nearby().length>0);assert.equal(g.succession133.contacts().length,0);
 assert.equal(g.frontier.contacts().filter(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-point.x-1.5,e.y-point.y)<C.Essentials.RULES.danger).length,0);
 const before=g.essentials.snapshot(),resources={...g.resources},bag={...g.player.carry};
 assert.equal(g.essentials.takeGround(target.id).ok,false);assert.deepEqual(g.essentials.snapshot(),before);assert.deepEqual(g.resources,resources);assert.deepEqual(g.player.carry,bag);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);
 assert.ok(nearby().length>0,'Saved group contacts remain dangerous before their next simulation tick.');
 assert.equal(g.essentials.takeGround(target.id).ok,false);assert.deepEqual(g.essentials.snapshot(),before);assert.deepEqual(g.resources,resources);assert.deepEqual(g.player.carry,bag);
});
