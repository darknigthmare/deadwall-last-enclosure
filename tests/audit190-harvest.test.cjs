'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ready,arrive,dead,finish,clone}=require('./helpers/wildlife190.cjs');
test('190 paid knife, finite corpse, wear, backpack, normal save and no duplicate reward',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190,before=clone(g.player.carry),kills=g.frontier.snapshot().kills,tool=g.arsenal134.snapshot().carried.find(i=>i.id==='knife');
 const offer=h.quote('harvest',q.id);assert.equal(offer.ok,true,offer.reason);assert.equal(h.begin('harvest',q.id).ok,true);finish(g);
 assert.equal(g.player.carry.food,before.food+offer.amount);assert.equal(h.taken(q.id),offer.amount);
 assert.equal(g.frontier.snapshot().kills,kills);assert.ok(g.arsenal134.snapshot().carried.find(i=>i.uid===tool.uid).condition<tool.condition);
 assert.equal(g.save(false),true);const saved=g.serialize();g.returnToMenu();assert.equal(g.load(),true);assert.equal(h.taken(q.id),offer.amount);assert.equal(g.player.carry.food,before.food+offer.amount);
 assert.equal(g.restoreSave(saved),true);g.paused=false;g.activeOverlay=null;
 while(h.quote('harvest',q.id).ok){assert.equal(h.begin('harvest',q.id).ok,true);finish(g);}
 assert.equal(h.taken(q.id),DeadwallCore.WildlifeHarvest190Rules.yields[q.species]);assert.match(h.quote('harvest',q.id).reason,/épuisée/);
 const bag=clone(g.player.carry);assert.equal(h.begin('harvest',q.id).ok,false);assert.deepEqual(g.player.carry,bag);assert.equal(g.save(false),true);
 const status=g.frontier.wildlifeStatus165(q.id);status.hp=80;assert.equal(g.frontier.wildlifeStatus165(q.id).hp,0,'readers cannot revive saved animals');
});
test('190 insufficient space gives only the available portion and preserves the unclaimed share',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190,C=DeadwallCore;
 g.player.carry.wood+=g.player.carryCapacity-C.bagTotal(g.player.carry)-.25;
 assert.equal(h.begin('harvest',q.id).ok,true);finish(g);assert.equal(h.taken(q.id),.25);assert.equal(C.bagTotal(g.player.carry),g.player.carryCapacity);
 const bag=clone(g.player.carry);assert.equal(h.begin('harvest',q.id).ok,false);assert.deepEqual(g.player.carry,bag);assert.ok(h.remains().some(x=>x.id===q.id));
});
test('190 live game fish, real shore and finite consumables commit exactly once',()=>{
 const {g}=ready(),q=arrive(g,'fish'),h=g.wildHarvest190,C=DeadwallCore,before=clone(g.player.carry),kills=g.frontier.snapshot().kills;
 const offer=h.quote('fish',q.id);assert.equal(offer.ok,true,offer.reason);assert.equal(h.begin('fish',q.id).ok,true);
 for(const k of ['wood','scrap','food'])assert.equal(g.player.carry[k],before[k]-C.WildlifeHarvest190Rules.fishingCost[k]);
 const hooked=g.frontier.wildlifeStatus165(q.id);for(let i=0;i<5;i++)g.update(.1);assert.equal(g.frontier.wildlifeStatus165(q.id).x,hooked.x);assert.equal(g.frontier.wildlifeStatus165(q.id).y,hooked.y);
 assert.equal(h.hooked(q.id),true);finish(g,{simulation:true});assert.equal(h.hooked(q.id),false);assert.equal(g.frontier.wildlifeStatus165(q.id).hp,0);
 assert.equal(g.player.carry.food,before.food-C.WildlifeHarvest190Rules.fishingCost.food+offer.amount);assert.equal(h.taken(q.id),offer.amount);assert.equal(g.frontier.snapshot().kills,kills);
 assert.equal(h.begin('fish',q.id).ok,false);assert.equal(h.begin('harvest',q.id).ok,false);assert.equal(g.save(false),true);const harvested=h.snapshot();g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(h.snapshot(),harvested);
});
test('190 cancelled or restored fishing never refunds costs, kills fish or resumes free work',()=>{
 const {g}=ready(),q=arrive(g,'fish'),h=g.wildHarvest190;assert.equal(h.begin('fish',q.id).ok,true);
 const paid=clone(g.player.carry),raw=g.serialize();assert.equal(h.cancel(),true);assert.deepEqual(g.player.carry,paid);assert.equal(h.taken(q.id),0);assert.ok(g.frontier.wildlifeStatus165(q.id).hp>0);
 assert.equal(g.restoreSave(raw),true);assert.equal(h.busy(),false);assert.equal(h.hooked(q.id),false);assert.deepEqual(g.player.carry,paid);assert.equal(h.taken(q.id),0);
});
test('190 move/shoot interrupts before the ordinary action, while a true pause consumes no work',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190;assert.equal(h.begin('harvest',q.id).ok,true);g.paused=true;const before=h.overview().task.elapsed;h.step(10);assert.equal(h.overview().task.elapsed,before);
 g.paused=false;g.input.keys.add('KeyW');g.update(.1);assert.equal(h.busy(),false);assert.equal(h.taken(q.id),0);g.input.keys.clear();
 assert.equal(h.begin('harvest',q.id).ok,true);g.input.mouseDown=true;g.update(.1);assert.equal(h.busy(),false);assert.equal(h.taken(q.id),0);
});
test('190 wounds, missing knives and busy hands prevent reward without changing the corpse',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190;assert.equal(h.begin('harvest',q.id).ok,true);const before=clone(g.player.carry);g.player.health-=1;h.step(.1);assert.equal(h.busy(),false);assert.deepEqual(g.player.carry,before);
 const a=g.arsenal134.snapshot(),pistol=a.carried.find(i=>i.id==='pistol');assert.equal(g.arsenal134.equip(pistol.uid).ok,true);assert.equal(h.begin('harvest',q.id).ok,false);assert.match(h.quote('harvest',q.id).reason,/couteau/);
});
test('190 invalid harvest records and mismatched profile are refused atomically',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190;assert.equal(h.begin('harvest',q.id).ok,true);finish(g);const raw=clone(g.serialize());
 for(const mutate of [d=>d.frontier.wildlife165[q.id].hp=1,d=>d.expansions127.modules.wildlife190.harvested[q.id]=99,d=>d.expansions127.modules.wildlife190.harvested[q.id]=-1,d=>d.expansions127.modules.wildlife190.harvested['A189_00_0_0']=1,d=>delete d.frontier.landscape189]){
  const invalid=clone(raw),world=g.world,bag=clone(g.player.carry),book=h.snapshot();mutate(invalid);assert.throws(()=>g.restoreSave(invalid));assert.equal(g.world,world);assert.deepEqual(g.player.carry,bag);assert.deepEqual(h.snapshot(),book);
 }
 const world=g.world,book=h.snapshot();assert.equal(g.startNew('standard','other-invalid-seed'),false);assert.equal(g.world,world);assert.deepEqual(h.snapshot(),book);
 assert.equal(g.startNew('standard','17','classic','bogus'),false);assert.equal(g.world,world);assert.deepEqual(h.snapshot(),book);
});
test('190 menu queries, quote and forbidden actions have no resource, RNG or saved-state side effects',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190;const clean=()=>{const {timestamp,...d}=g.serialize();return d;},before=clean(),rng=g.random.state;
 for(let n=0;n<4;n++){h.overview();h.actions();h.choices();h.remains();h.quote('harvest',q.id);}assert.deepEqual(clean(),before);assert.equal(g.random.state,rng);
 const old=g.frontier.world().movementLine;g.frontier.world().movementLine=()=>false;assert.equal(h.begin('harvest',q.id).ok,false);g.frontier.world().movementLine=old;assert.deepEqual(clean(),before);
});
test('190 visibility distinguishes a dead observed point from a live enemy and invalidates stale frames',()=>{
 const {g}=ready(),q=dead(g),corpse=g.frontier.wildlifeStatus165(q.id),frame=g.visibility.frame();
 assert.equal(frame.canSeeRegional(corpse),false);assert.equal(frame.canSeeRegionalPoint(corpse),true);assert.equal(frame.canSeeRegionalPoint({...corpse,x:NaN}),false);assert.equal(frame.canSeeRegionalPoint({...corpse,z:2}),false);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(frame.canSeeRegionalPoint(corpse),false);assert.equal(g.visibility.frame().canSeeRegionalPoint(corpse),true);
});
test('190 native HUD entry and operation buttons preserve modal exclusivity and allow real work',()=>{
 const {g,doc}=ready(),q=dead(g);g.updateUI();assert.ok(g.wildHarvestUI190);const button=g.wildHarvestUI190.button,terrain=doc.getElementById('fieldDockTerrain');assert.equal(doc.body.contains(button),true);assert.equal(button.hidden,false);
 assert.equal(terrain.contains(button),true,'the shortcut belongs to the current regional drawer');assert.equal(doc.getElementById('frontierHud').contains(button),false,'the retired HUD remains hidden');terrain.open=true;button.click();assert.equal(terrain.open,false);
 assert.equal(doc.querySelector('.field-dock-actions').children.length,5,'the contextual shortcut preserves the bounded five-button action shelf');
 assert.equal(g.activeOverlay,g.ui.commandModal);assert.ok(doc.getElementById('expansionTab-wildlife190'));
 const action=doc.getElementById('expansionAction-wildlife190-harvest:'+q.id);assert.equal(doc.body.contains(action),true);assert.equal(action.disabled,false);action.click();assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(g.wildHarvest190.busy(),true);
 finish(g);assert.ok(g.wildHarvest190.taken(q.id)>0);
});
test('190 missing bait and a blocked shore line reject fishing without spending or hooking',()=>{
 const {g}=ready(),q=arrive(g,'fish'),h=g.wildHarvest190;
 const old=g.frontier.world().wildlifeWaterLine,before=clone(g.player.carry);g.frontier.world().wildlifeWaterLine=()=>false;
 assert.equal(h.begin('fish',q.id).ok,false);assert.deepEqual(g.player.carry,before);assert.equal(h.hooked(q.id),false);g.frontier.world().wildlifeWaterLine=old;
 g.player.carry.food=0;const empty=clone(g.player.carry);assert.equal(h.begin('fish',q.id).ok,false);assert.deepEqual(g.player.carry,empty);assert.equal(h.busy(),false);
});
test('190 no reward after a broken tool or a newly obstructed access, and invalid deltas cannot advance work',()=>{
 const {g}=ready(),q=dead(g),h=g.wildHarvest190;assert.equal(h.begin('harvest',q.id).ok,true);
 for(const dt of [NaN,Infinity,-1,0])h.step(dt);assert.equal(h.overview().task.elapsed,0);
 const before=clone(g.player.carry),line=g.frontier.world().movementLine;g.frontier.world().movementLine=()=>false;h.step(.1);assert.equal(h.busy(),false);assert.deepEqual(g.player.carry,before);g.frontier.world().movementLine=line;
 const raw=g.serialize(),a=raw.expansions127.modules.arsenal134;assert.ok(a);const item=a.carried.find(i=>i.id==='knife');item.condition=.0001;
 assert.equal(g.restoreSave(raw),true);g.paused=false;g.activeOverlay=null;assert.equal(h.begin('harvest',q.id).ok,true);h.step(.1);h.step(.1);assert.equal(h.busy(),false);assert.equal(h.taken(q.id),0);assert.deepEqual(g.player.carry,before);
});
test('190 genuine projectiles spend ammunition, kill generated wildlife and lead to a paid-tool harvest without zombie credit',()=>{
 const {g}=ready(),q=arrive(g,'land'),a=g.arsenal134.snapshot(),pistol=a.carried.find(i=>i.id==='pistol'),knife=a.carried.find(i=>i.id==='knife');
 assert.equal(g.arsenal134.equip(pistol.uid).ok,true);const rounds=g.player.magazine.pistol,kills=g.frontier.snapshot().kills;let shots=0;
 for(let n=0;n<20&&g.frontier.wildlifeStatus165(q.id).hp>0;n++){
  const animal=g.frontier.wildlifeStatus165(q.id),p=g.frontier.position(),angle=Math.atan2(animal.y-p.y,animal.x-p.x);
  g.input.mouseX=g.width/2+Math.cos(angle)*100;g.input.mouseY=g.height/2+Math.sin(angle)*100;
  for(let i=0;i<4;i++)g.update(.1);if(g.frontier.shoot())shots++;g.update(.1);
 }
 assert.equal(g.frontier.wildlifeStatus165(q.id).hp,0);assert.ok(shots>0);assert.equal(g.player.magazine.pistol,rounds-shots);assert.equal(g.frontier.snapshot().kills,kills);
 const corpse=g.frontier.wildlifeStatus165(q.id);
 for(let n=0;n<120;n++){
  const p=g.frontier.position(),dx=corpse.x-p.x,dy=corpse.y-p.y;g.input.keys.clear();if(Math.hypot(dx,dy)<1.5)break;
  if(Math.abs(dx)>.2)g.input.keys.add(dx>0?'KeyD':'KeyA');if(Math.abs(dy)>.2)g.input.keys.add(dy>0?'KeyS':'KeyW');g.update(.1);
 }
 g.input.keys.clear();assert.equal(g.arsenal134.equip(knife.uid).ok,true);const stocks=clone(g.resources);assert.equal(g.wildHarvest190.begin('harvest',q.id).ok,true,g.wildHarvest190.quote('harvest',q.id).reason);finish(g);
 assert.ok(g.wildHarvest190.taken(q.id)>0);assert.deepEqual(g.resources,stocks,'food enters the bag, never the distant depot');assert.equal(g.frontier.snapshot().kills,kills);
});
