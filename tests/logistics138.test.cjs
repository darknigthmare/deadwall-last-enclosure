'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
let g,C,doc;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();standAt(g,g.player,g.core());}
function unlock(kind,belt=1){
 const target=g.essentials.targets().find(t=>t.family===kind),raw=g.serialize();
 raw.frontier.seen=[...new Set([...raw.frontier.seen,target.poi])];
 raw.essentials.jobs[target.id]={stage:'delivered'};raw.essentials.belt[kind]=belt;raw.essentials.stock[kind]=1;
 assert.equal(g.restoreSave(raw),true);standAt(g,g.player,g.core());return target;
}
function put(type,accept=()=>true){
 const core=g.core();
 for(let r=4;r<25;r++)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){
  const x=core.gx+dx,y=core.gy+dy;if(!g.world.placement(C.BUILDINGS[type],x,y,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);if(!accept(b)){g.world.remove(b);continue;}g.refreshMetrics(true);return b;
 }
 throw Error('No physically free fixture placement.');
}
test('138 soins régionaux : une seule dose réelle et annoncée, reprise sans duplication',()=>{
 start();unlock('aid',2);Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);
 g.player.health=10;const before=g.essentials.snapshot(),stock={...g.resources};
 const r=g.essentials.use('aid');assert.equal(r.ok,true,r.reason);
 assert.equal(g.player.health,10+C.Essentials.RULES.kits.aid.heal);
 assert.equal(r.amount,C.Essentials.RULES.kits.aid.heal);
 assert.equal(g.essentials.snapshot().belt.aid,before.belt.aid-1);assert.deepEqual(g.resources,stock);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);
 assert.equal(g.player.health,50);assert.equal(g.essentials.snapshot().belt.aid,1);
});
test('138 soins locaux : les bâtiments physiques bloquent une trousse, sans dépense',()=>{
 start();unlock('aid');const u=g.units[0],b=put('house',b=>g.friendlyPositionClear(g.player,b.left-g.player.radius-4,b.y)&&g.friendlyPositionClear(u,b.right+u.radius+4,b.y));
 const p={x:b.left-g.player.radius-4,y:b.y},q={x:b.right+u.radius+4,y:b.y};
 assert.equal(g.friendlyPositionClear(g.player,p.x,p.y),true);assert.equal(g.friendlyPositionClear(u,q.x,q.y),true);
 Object.assign(g.player,p);Object.assign(u,q);u.health=10;
 assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<C.Essentials.RULES.kits.aid.radius);
 assert.equal(g.nightGear.localLineClear(p,q),false);
 assert.equal(g.essentials.use('aid').ok,false);assert.equal(u.health,10);assert.equal(g.essentials.snapshot().belt.aid,1);
 // The same casualty on the commander's free side is healable.
 Object.assign(u,{x:p.x,y:p.y+20});assert.equal(g.friendlyPositionClear(u,u.x,u.y),true);
 assert.equal(g.essentials.use('aid').amount,40);assert.equal(u.health,50);
});
test('138 inventaire : recharge active refuse le transfert puis le permet sans perte',()=>{
 start();g.player.magazine.pistol=0;g.startReload();assert.ok(g.player.reload>0);
 const before={...g.resources},bag={...g.player.carry};
 assert.equal(g.loadout.transfer('depot','sac','scrap',3.125).ok,false);
 assert.deepEqual(g.resources,before);assert.deepEqual(g.player.carry,bag);
 const time=g.elapsed;for(let i=0;i<100&&g.player.reload>0;i++)g.update(.04);
 assert.ok(g.elapsed>time);assert.equal(g.player.reload,0);
 const current=g.resources.scrap;assert.equal(g.loadout.transfer('depot','sac','scrap',3.125).amount,3.125);
 assert.equal(g.resources.scrap,current-3.125);assert.equal(g.player.carry.scrap,3.125);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.player.carry.scrap,3.125);
});
test('138 services : une recharge ne peut commencer simultanément un assemblage ou un soin',()=>{
 start();unlock('aid');g.player.health=20;g.player.magazine.pistol=0;g.startReload();assert.ok(g.player.reload>0);
 const before=g.essentials.snapshot(),resources={...g.resources};
 assert.equal(g.essentials.begin('craft','aid').ok,false);assert.equal(g.essentials.use('aid').ok,false);
 assert.deepEqual(g.essentials.snapshot(),before);assert.deepEqual(g.resources,resources);assert.equal(g.player.health,20);
});
test('138 réimplantation : un devis ne peut être confirmé pendant un travail manuel concurrent',()=>{
 start();unlock('aid');const b=put('house');standAt(g,g.player,b);
 assert.equal(g.fieldcraft.beginMove(b),true);let q;
 for(let x=b.gx+2;x<b.gx+10&&!q;x++)for(let y=b.gy-4;y<b.gy+5;y++){const p=g.fieldcraft.plan(x,y);if(p.ok){q=p;break;}}
 assert.ok(q,'An accessible structure has a physically free relocation destination.');
 // A paid workshop operation is started at the depot after the preview; the
 // current command must be checked before committing the old quotation.
 standAt(g,g.player,g.core());assert.equal(g.essentials.begin('craft','aid').ok,true);
 const before={...g.resources};assert.equal(g.fieldcraft.commit(),false);assert.deepEqual(g.resources,before);
 g.essentials.cancel();
});
function vehicle(){
 put('expeditionGarage');standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;
 assert.equal(g.expeditions.buildCar().ok,true);const v=g.expeditions.car();
 for(let i=0;i<32;i++){
  const angle=i*Math.PI/16,p={x:v.x+Math.cos(angle)*48,y:v.y+Math.sin(angle)*48};
  if(!g.friendlyPositionClear(g.player,p.x,p.y))continue;Object.assign(g.player,p);
  if(!g.loadout.access({id:'car:'+v.id})&&g.loadout.atHome()&&g.expeditions.overview().atHome)return v;
 }
 throw Error('No shared physical depot/trunk access.');
}
test('138 coffre : les commandes exposées refusent une recharge sans consommer de cargaison ou de carburant',()=>{
 start();unlock('aid');const v=vehicle();g.player.carry.scrap=3;v.cargo.wood=4;v.health-=20;g.player.magazine.pistol=0;g.startReload();assert.ok(g.player.reload>0);
 g.expeditionsUI.open();g.expeditionsUI.refresh(true);
 const before={resources:{...g.resources},bag:{...g.player.carry},cargo:{...v.cargo},fuel:v.fuel,health:v.health};
 for(const id of ['expCargo','expUnload','expRefuel','expRepair']){
  const b=doc.getElementById(id);assert.ok(doc.body.contains(b));assert.equal(b.disabled,false);b.click();
  assert.deepEqual({resources:{...g.resources},bag:{...g.player.carry},cargo:{...v.cargo},fuel:v.fuel,health:v.health},before,id+' must recheck free hands at execution.');
 }
 g.showCommand(false);
 for(let i=0;i<100&&g.player.reload>0;i++)g.update(.04);
 assert.equal(g.player.reload,0);assert.equal(g.essentials.begin('craft','aid').ok,true);g.expeditionsUI.open();
 const busy={resources:{...g.resources},bag:{...g.player.carry},cargo:{...v.cargo},fuel:v.fuel,health:v.health};
 for(const id of ['expCargo','expUnload','expRefuel','expRepair']){
  doc.getElementById(id).click();assert.deepEqual({resources:{...g.resources},bag:{...g.player.carry},cargo:{...v.cargo},fuel:v.fuel,health:v.health},busy);
 }
 g.showCommand(false);g.essentials.cancel();
});
test('138 coffre et dépôt : capacité, reliquat fractionnaire et destruction restent conservés à la reprise',()=>{
 start();let v=vehicle();v.cargo.wood=79;g.player.carry.scrap=3;
 assert.equal(g.expeditions.transfer().ok,true);assert.equal(v.cargo.scrap,1);assert.equal(g.player.carry.scrap,2);assert.equal(C.bagTotal(v.cargo),80);
 g.resources.wood=g.storage;g.resources.scrap=g.storage-.25;const deposits=g.depositedResources;
 assert.equal(g.expeditions.unload().ok,true);assert.equal(v.cargo.wood,79);assert.equal(v.cargo.scrap,.75);assert.equal(g.resources.scrap,g.storage);assert.equal(g.depositedResources,deposits+.25);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);v=g.expeditions.car();
 assert.equal(v.cargo.scrap,.75);assert.equal(g.player.carry.scrap,2);assert.equal(g.expeditions.refuel().ok,true);assert.ok(v.fuel>0);
 g.expeditions.damage(999);assert.equal(v.health,0);assert.equal(v.fuel,0);assert.equal(C.bagTotal(v.cargo),0);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(C.bagTotal(g.expeditions.car().cargo),0);assert.equal(g.player.carry.scrap,2);
});
test('138 atelier : devis revalidé, temps actif, pause et reprise conservent les coûts engagés',()=>{
 start();unlock('aid');const before=g.essentials.snapshot(),medicine=g.resources.medicine,food=g.resources.food,time=g.elapsed;
 assert.equal(g.essentials.begin('craft','aid').ok,true);
 for(let i=0;i<60;i++)g.update(.04);
 assert.equal(g.essentials.snapshot().stock.aid,before.stock.aid);assert.equal(g.resources.medicine,medicine);
 assert.ok(g.elapsed>time);assert.ok(g.resources.food<food,'The colony keeps consuming its own rations during work.');
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.essentials.busy(),false);
 assert.equal(g.essentials.snapshot().stock.aid,before.stock.aid);assert.equal(g.resources.medicine,medicine);
 assert.equal(g.essentials.begin('craft','aid').ok,true);
 for(let i=0;i<126;i++)g.update(.04);
 assert.equal(g.essentials.snapshot().stock.aid,before.stock.aid+1);assert.equal(g.resources.medicine,medicine-C.Essentials.RULES.kits.aid.cost.medicine);
 const stock=g.essentials.snapshot().stock.aid;assert.equal(g.essentials.begin('craft','aid').ok,true);
 // Another consumer exhausts the shared medicine reserve before completion.
 g.resources.medicine=0;g.update(.04);assert.equal(g.essentials.busy(),false);
 assert.equal(g.essentials.snapshot().stock.aid,stock);assert.equal(g.resources.medicine,0);
});
