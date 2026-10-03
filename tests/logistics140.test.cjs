'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const source=process.env.DEADWALL_LOGISTICS_ROOT||path.resolve(__dirname,'..');
const {bootDocument134}=require(path.join(source,'scripts/qa-startup134.cjs'));
const {standAt}=require(path.join(source,'tests/helpers/physical-fixtures.cjs'));
let g,C,doc;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(seed='17117'){g.startNew('standard',seed);g.campaignIntro132.skip();}
function button(id){const b=doc.getElementById(id);assert.ok(doc.body.contains(b),'Mounted shipped button: '+id);return b;}
function supplyHeal(){g.fieldSuppliesUI.open();g.fieldSuppliesUI.refresh(true);return button('supplyHeal');}
function returnTo(point){const d=g.serialize();Object.assign(d.frontier,{active:true,x:point.x+1.5,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});assert.equal(g.restoreSave(d),true);}
function dieAt(point){const d=g.serialize();Object.assign(d.frontier,{active:true,...point,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});assert.equal(g.restoreSave(d),true);g.player.invulnerable=0;g.frontier.damage(10000);assert.equal(g.successionUI133.choose('porter'),true);button('succession133Confirm').click();}
function harvest(){
 start();const n=g.world.nodes.find(n=>!n.depleted&&n.type==='wood'&&g.fieldcraft.service(g.player,n));assert.ok(n);standAt(g,g.player,n);
 g.input.keys.add('KeyE');for(let i=0;i<8;i++)g.updateInteraction(.1);g.input.keys.clear();g.chronicles131.tick(.04);
 assert.equal(g.player.carry.wood,8);assert.equal(g.stats.gathered,8);assert.equal(g.chronicles131.snapshot().prologue.stage,1);standAt(g,g.player,g.core());
}
function assertDepositSaved(amount,carry,stock){
 assert.equal(g.depositedResources,amount);assert.equal(g.chronicles131.snapshot().prologue.deposited,amount);assert.equal(g.player.carry.wood,carry);assert.equal(g.resources.wood,stock);
 const stored=g.serialize();assert.equal(g.save(false),true);assert.equal(g.restoreSave(stored),true);
 assert.equal(g.depositedResources,amount);assert.equal(g.chronicles131.snapshot().prologue.deposited,amount);assert.equal(g.player.carry.wood,carry);assert.equal(g.resources.wood,stock);
 assert.equal(g.chronicles131.scene(),null);assert.equal(g.chronicles131.snapshot().scenes.filter(id=>id==='return').length,1);g.chronicles131.tick(.04);
 assert.equal(g.chronicles131.snapshot().prologue.stage,2);assert.equal(g.chronicles131.scene(),null);
}
test('140 ancien soin : un vrai relevé désactive le bouton sans coût, puis soin unique après neutralisation',()=>{
 start('6');const w=g.frontier.world(),home=globalThis.DeadwallAtlasProjection.home(w);let point;
 for(let dy=130;dy<300&&!point;dy+=10)for(let dx=0;dx<300;dx+=10){const p={x:home.x+dx,y:home.y+dy},q={x:p.x+1.5,y:p.y};if(!w.blocked(p.x,p.y,.32,0,null)&&!w.blocked(q.x,q.y,.32,0,null)&&w.line(p,q,0,null,null,.05)){point=p;break;}}
 assert.ok(point);dieAt(point);for(let i=0;i<1501;i++)g.succession133.step(.1);returnTo(point);
 const e=g.succession133.contacts()[0];assert.equal(e.hp,C.SuccessionRules.health);assert.equal(g.frontier.visibleEnemy(e),true);
 g.player.health=40;g.player.carry.medicine=2;const resources={...g.resources},bag={...g.player.carry};
 assert.equal(supplyHeal().disabled,true);button('supplyHeal').click();assert.equal(g.fieldSupplies.busy(),false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,resources);assert.equal(g.player.health,40);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(supplyHeal().disabled,true);assert.equal(g.fieldSupplies.begin('heal').ok,false);
 assert.equal(g.succession133.hit(e.x,e.y,C.SuccessionRules.health,0,null,e.id),true);g.showCommand(false);
 assert.equal(supplyHeal().disabled,false);button('supplyHeal').click();assert.equal(g.fieldSupplies.busy(),true);assert.equal(g.paused,false);
 for(let i=0;i<50;i++)g.update(.04);assert.equal(g.player.health,40);assert.equal(g.player.carry.medicine,2);
 const elapsed=g.fieldSupplies.overview().task.elapsed;g.togglePause(true);for(let i=0;i<50;i++)g.loop(g.lastFrame+40);assert.equal(g.fieldSupplies.overview().task.elapsed,elapsed);assert.equal(g.player.carry.medicine,2);g.togglePause(false);
 for(let i=0;i<50;i++)g.update(.04);assert.equal(g.fieldSupplies.busy(),false);assert.equal(g.player.health,75);assert.equal(g.player.carry.medicine,0);assert.equal(g.resources.medicine,resources.medicine);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.player.health,75);assert.equal(g.player.carry.medicine,0);assert.equal(g.fieldSupplies.begin('heal').ok,false);
});
test('140 ancien soin : les vrais membres de horde sauvage bloquent aussi avant le premier tick de reprise',()=>{
 start();Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);g.update(.04);const w=g.frontier.world();let point;
 for(const h of g.worldEvolution.snapshot().groups){for(let dy=0;dy<20&&!point;dy++)for(let dx=0;dx<20;dx++){const p={x:h.x+dx,y:h.y+dy},q={x:p.x+1.5,y:p.y};if(!w.blocked(p.x,p.y,.32,0,null)&&!w.blocked(q.x,q.y,.32,0,null)&&w.line(p,q,0,null,null,.05)){point=p;break;}}if(point)break;}
 assert.ok(point);dieAt(point);returnTo(point);g.update(.04);g.player.health=40;g.player.carry.medicine=2;
 const nearby=()=>g.worldEvolution.groupMembers().filter(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-point.x-1.5,e.y-point.y)<C.FieldSupplies.RULES.safeRadius&&g.frontier.visibleEnemy(e));
 assert.ok(nearby().length>0);assert.equal(g.succession133.contacts().length,0);assert.equal(g.frontier.contacts().filter(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-point.x-1.5,e.y-point.y)<C.FieldSupplies.RULES.safeRadius).length,0);
 const bag={...g.player.carry},resources={...g.resources};assert.equal(supplyHeal().disabled,true);button('supplyHeal').click();assert.equal(g.fieldSupplies.busy(),false);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.ok(nearby().length>0);assert.equal(supplyHeal().disabled,true);assert.equal(g.fieldSupplies.begin('heal').ok,false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,resources);assert.equal(g.player.health,40);
});
test('140 ancien dépôt : récolte et bouton de ravitaillement valident le geste personnel exact une seule fois',()=>{
 harvest();const before=g.resources.wood;g.fieldSuppliesUI.open();doc.getElementById('supplyEndpoint').value='depot';doc.getElementById('supplyQuantity').value='max';g.fieldSuppliesUI.refresh(true);
 assert.equal(button('supplyDeposit-wood').disabled,false);button('supplyDeposit-wood').click();assertDepositSaved(8,0,before+8);
 g.fieldSuppliesUI.open();doc.getElementById('supplyEndpoint').value='depot';g.fieldSuppliesUI.refresh(true);assert.equal(button('supplyDeposit-wood').disabled,true);button('supplyDeposit-wood').click();assert.equal(g.depositedResources,8);assert.equal(g.chronicles131.snapshot().prologue.deposited,8);g.showCommand(false);
 // Existing direct interaction and worker deposit each have their own owner.
 g.player.carry.wood=.25;g.input.keys.add('KeyE');g.updateInteraction(.04);g.input.keys.clear();assert.equal(g.depositedResources,8.25);assert.equal(g.chronicles131.snapshot().prologue.deposited,8.25);
 const u=g.units[0];standAt(g,u,g.core());u.carryType='wood';u.carry=.5;g.depositWorker(u,g.core(),.04);assert.equal(g.depositedResources,8.75);assert.equal(g.chronicles131.snapshot().prologue.deposited,8.25);assert.equal(g.resources.wood,before+8.75);
});
test('140 inventaire : dépôt fractionnaire limité au stockage, reprise et refus plein sans double observation',()=>{
 harvest();g.player.carry.wood=.25+g.player.carry.wood;g.resources.wood=g.storage-8.125;const before=g.resources.wood;
 assert.equal(g.loadoutUI.open(),true);const item=doc.querySelectorAll('button').find(b=>b.dataset.container==='sac'&&b.dataset.item==='wood:0');assert.ok(item);item.click();
 const transfer=()=>doc.querySelectorAll('button').find(b=>b.dataset.action==='TRANSFÉRER →');assert.ok(transfer());assert.equal(transfer().disabled,false);transfer().click();assert.equal(g.depositedResources,8);transfer().click();
 assertDepositSaved(8.125,.125,before+8.125);assert.equal(g.loadout.transfer('sac','depot','wood',.125).ok,false);assert.equal(g.depositedResources,8.125);assert.equal(g.chronicles131.snapshot().prologue.deposited,8.125);assert.equal(g.player.carry.wood,.125);assert.equal(g.resources.wood,g.storage);
});
