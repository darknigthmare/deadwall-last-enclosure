'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {setup,build,captured,supplies,finish,candidate}=require('./helpers/husbandry191.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
test('191 physical paid enclosure, live capture, persistent custody and no duplicate wild target',()=>{
 const {g,q,pen}=captured(),farm=g.husbandry191.view();assert.equal(farm.animals.length,1);assert.equal(farm.animals[0].status,'held');assert.ok(g.frontier.wildlifeStatus165(q.a.id).hp>0);
 assert.equal(g.frontier.wildlife165().some(a=>a.id===q.a.id),false);assert.equal(g.frontier.hitWildlife165(q.a.id,100),false);assert.equal(g.wildHarvest190.quote('harvest',q.a.id).ok,false);
 assert.ok(g.frontier.world().blocked(pen.x,pen.y,.32,0,null));const before=copy(g.serialize());assert.equal(g.restoreSave(before),true);assert.deepEqual(g.husbandry191.view().animals,farm.animals);assert.equal(g.husbandry191.quote('capture',pen.id,q.a.id).ok,false);
});
test('191 capture costs are paid once; pause does not progress and interruption cannot claim an animal',()=>{
 const {g,q,pen}=build();const before=copy(g.player.carry);assert.ok(g.husbandry191.begin('capture',pen.id,q.a.id).ok);g.paused=true;for(let i=0;i<100;i++)g.husbandry191.step(.1);assert.equal(g.husbandry191.view().task.progress,0);g.paused=false;
 assert.ok(g.husbandry191.cancel());assert.equal(g.husbandry191.view().animals.length,0);assert.equal(g.player.carry.food,before.food-1);assert.equal(g.player.carry.scrap,before.scrap-1);assert.ok(g.frontier.wildlifeStatus165(q.a.id).hp>0);
});
test('191 feed is physically local and uses the bag, never a remote depot; readers are detached',()=>{
 const {g,pen}=captured();const before=g.player.carry.food;assert.ok(g.husbandry191.begin('feed',pen.id).ok);assert.equal(g.player.carry.food,before-4);const v=g.husbandry191.view();v.pens[0].food=999;assert.equal(g.husbandry191.view().pens[0].food,4);
 const doc=g.serialize();doc.frontier.x+=20;g.restoreSave(doc);g.paused=false;g.activeOverlay=null;assert.equal(g.husbandry191.quote('feed',pen.id).ok,false);
});
test('191 slaughter stores finite raw products locally, cooking uses fuel and the backpack, tanning needs water',()=>{
 const {g,q,pen}=captured(),a=g.husbandry191.view().animals[0],bagBefore=g.player.carry.food;
 assert.ok(g.husbandry191.begin('slaughter',pen.id,a.id).ok);finish(g);let p=g.husbandry191.view().pens[0];assert.equal(p.meat,2);assert.equal(p.hides,1);assert.equal(g.player.carry.food,bagBefore);assert.equal(g.frontier.wildlifeStatus165(q.a.id).hp,0);
 assert.equal(g.husbandry191.quote('slaughter',pen.id,a.id).ok,false);assert.equal(g.wildHarvest190.quote('harvest',q.a.id).ok,false);assert.equal(g.husbandry191.quote('tan',pen.id).ok,false);
 const fuel=g.player.carry.fuel;assert.ok(g.husbandry191.begin('cook',pen.id).ok);finish(g);p=g.husbandry191.view().pens[0];assert.equal(p.meat,0);assert.equal(g.player.carry.food,bagBefore+2);assert.equal(g.player.carry.fuel,fuel-.5);assert.equal(g.husbandry191.quote('cook',pen.id).ok,false);
 assert.doesNotThrow(()=>DeadwallSave.validate(g.serialize()));
});
test('191 releasing a hungry captive preserves its reduced health rather than healing the original',()=>{
 const {g,q,pen}=captured(),a=g.husbandry191.view().animals[0];const native=g.frontier.wildlifeStatus165(q.a.id).hp;
 for(let i=0;i<100;i++)g.husbandry191.step(.1);assert.ok(g.husbandry191.view().animals[0].health<100);
 assert.ok(g.husbandry191.begin('release',pen.id,a.id).ok);assert.ok(g.frontier.wildlifeStatus165(q.a.id).hp<native);assert.equal(g.husbandry191.claimed(q.a.id),false);
 assert.doesNotThrow(()=>DeadwallSave.validate(g.serialize()));
});
test('191 invalid source, duplicate custody and overlapping pens are refused before a restore mutates the campaign',()=>{
 const {g}=captured(),raw=g.serialize(),identity=g.world;
 for(const change of [d=>d.expansions127.modules.husbandry191.animals[0].source='A189_95_95_7',d=>d.expansions127.modules.husbandry191.pens[0].food=-1,d=>d.expansions127.modules.husbandry191.pens.push({...d.expansions127.modules.husbandry191.pens[0]})]){
  const bad=copy(raw);change(bad);assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,identity);
 }
});
