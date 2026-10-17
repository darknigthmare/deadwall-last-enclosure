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
test('191 rebuilding a real generated enclosure preserves finite processed products and survives a full save round trip',()=>{
 const {g,q,pen}=captured(),a=g.husbandry191.view().animals[0];assert.ok(g.husbandry191.begin('slaughter',pen.id,a.id).ok);finish(g);
 const raw=g.serialize(),record=raw.expansions127.modules.husbandry191;record.pens[0].health=0;assert.equal(g.restoreSave(raw),true);g.paused=false;g.activeOverlay=null;supplies(g);
 const before=g.husbandry191.view(),bag={...g.player.carry};assert.ok(g.husbandry191.begin('rebuild',pen.id).ok);finish(g);
 const after=g.husbandry191.view();assert.equal(after.next,before.next);assert.equal(after.pens.length,1);assert.deepEqual(after.animals,before.animals);
 for(const key of ['id','x','y','food','water','meat','hides','leather'])assert.equal(after.pens[0][key],before.pens[0][key],key);
 assert.equal(after.pens[0].health,DeadwallCore.Husbandry191Rules.health);assert.equal(g.player.carry.wood,bag.wood-10);assert.equal(g.player.carry.scrap,bag.scrap-6);
 assert.equal(g.frontier.wildlifeStatus165(q.a.id).hp,0);assert.equal(g.wildHarvest190.quote('harvest',q.a.id).ok,false);
 const saved=g.serialize();assert.doesNotThrow(()=>DeadwallSave.validate(saved));assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.husbandry191.view(),after);
 const invalid=copy(saved);invalid.expansions127.modules.husbandry191.pens[0].health=0;invalid.expansions127.modules.husbandry191.animals[0].status='held';invalid.expansions127.modules.husbandry191.animals[0].health=100;
 const identity=g.world;assert.throws(()=>g.restoreSave(invalid));assert.equal(g.world,identity);assert.deepEqual(g.husbandry191.view(),after);
});
test('191 a real regional injury cancels the paid intervention before same-frame healing and ignores an invulnerable hit',()=>{
 const {g,pen,q}=build();assert.ok(g.husbandry191.begin('capture',pen.id,q.a.id).ok);
 g.player.invulnerable=1;assert.equal(g.frontier.damage(1),false);assert.ok(g.husbandry191.busy());
 g.player.invulnerable=0;const health=g.player.health;assert.equal(g.frontier.damage(1),true);g.player.health=health;
 assert.equal(g.husbandry191.busy(),false);assert.equal(g.husbandry191.view().animals.length,0);assert.equal(g.husbandry191.view().pens.length,1);
});
test('191 stranded originals round-trip through full saves and a paid reconstruction never rejuvenates them',()=>{
 const {g,pen}=captured(),raw=g.serialize(),record=raw.expansions127.modules.husbandry191;
 record.pens[0].health=0;record.pens[0].food=10;record.pens[0].water=10;record.animals[0].status='stranded';record.animals[0].health=72;
 assert.doesNotThrow(()=>DeadwallSave.validate(raw));assert.equal(g.restoreSave(raw),true);g.paused=false;g.activeOverlay=null;supplies(g);
 const before=g.husbandry191.view();assert.equal(g.frontier.wildlife165().some(a=>a.id===before.animals[0].source),false);assert.ok(g.husbandry191.begin('rebuild',pen.id).ok);finish(g);
 const after=g.husbandry191.view();assert.equal(after.animals[0].status,'held');assert.equal(after.animals[0].health,72);assert.ok(after.animals[0].age>before.animals[0].age);assert.equal(after.animals[0].source,before.animals[0].source);
 const saved=g.serialize();assert.doesNotThrow(()=>DeadwallSave.validate(saved));assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.husbandry191.view(),after);
 const impossible=copy(saved);impossible.expansions127.modules.husbandry191.animals[0].status='stranded';const identity=g.world;assert.throws(()=>g.restoreSave(impossible));assert.equal(g.world,identity);
});
test('191 an actual second enclosure blocks release at the saved origin until its fence is removed, without duplicating custody',()=>{
 const {g,pen,q}=captured(),origin=g.frontier.wildlifeStatus165(q.a.id),w=g.frontier.world(),R=DeadwallCore.Husbandry191Rules;
 let obstacle=null;
 for(let i=0;i<64&&!obstacle;i++)for(const radius of [1.2,1.4]){
  const a=i*Math.PI/32,p={x:origin.x+Math.cos(a)*radius,y:origin.y+Math.sin(a)*radius};if(Math.hypot(p.x-pen.x,p.y-pen.y)<R.spacing)continue;
  const road=w.nearestRoad(p);if(road&&road.d<road.road.width/2+R.penSize)continue;
  if([-1.5,-1,-.5,0,.5,1,1.5].some(dx=>[-1.5,-1,-.5,0,.5,1,1.5].some(dy=>w.blocked(p.x+dx,p.y+dy,.35,0,null)||w.hydrology.sample(p.x+dx,p.y+dy).water)))continue;
  obstacle=p;break;
 }
 assert.ok(obstacle,'bounded fixture needs a second physically dry enclosure covering the retained origin');
 const raw=g.serialize(),book=raw.expansions127.modules.husbandry191,obstacleId=book.next++;
 book.pens.push({...book.pens[0],...obstacle,id:obstacleId,food:0,water:0,meat:0,hides:0,leather:0,breed:0,meatAge:0,hideAge:0});
 Object.assign(raw.frontier,g.husbandry191.access(pen));assert.equal(g.restoreSave(raw),true);g.paused=false;g.activeOverlay=null;
 assert.equal(g.frontier.world().blocked(origin.x,origin.y,origin.radius,0,null),true);const before=g.husbandry191.view(),bag=copy(g.player.carry);
 assert.equal(g.husbandry191.begin('release',pen.id,before.animals[0].id).ok,false);assert.deepEqual(g.husbandry191.view(),before);assert.deepEqual(g.player.carry,bag);assert.equal(g.frontier.wildlife165().some(a=>a.id===q.a.id),false);
 const cleared=g.serialize();cleared.expansions127.modules.husbandry191.pens.find(p=>p.id===obstacleId).health=0;assert.equal(g.restoreSave(cleared),true);g.paused=false;g.activeOverlay=null;
 assert.ok(g.husbandry191.begin('release',pen.id,before.animals[0].id).ok);g.update(.01);
 assert.equal(g.husbandry191.claimed(q.a.id),false);assert.equal(g.husbandry191.view().animals.filter(a=>a.source===q.a.id).length,1);assert.equal(g.frontier.wildlife165().filter(a=>a.id===q.a.id).length,1);assert.deepEqual(g.player.carry,bag);
 assert.doesNotThrow(()=>DeadwallSave.validate(g.serialize()));
});
