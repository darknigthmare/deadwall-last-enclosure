'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/frontier-world.js'),Ops=require('../src/world-pack131.js');
require('../src/codex-context160.js');
const{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const checkpoint=g=>{const data=copy(g.serialize());delete data.timestamp;return data;};
function campaign(seed='17117'){const{game:g}=boot127();Ops.install(g);g.startNew('standard',seed);standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();return g;}
function fixture(g){
 const w=g.frontier.world(),p=w.pois.find(p=>w.plan(p,0).objects.some(o=>o.amount>0)),object=p&&w.plan(p,0).objects.find(o=>o.amount>0);assert.ok(object);
 const cx=Math.floor(w.home.x/256),cy=Math.floor(w.home.y/256);let node;
 for(let d=1;d<=8&&!node;d++)for(const[dx,dy]of[[d,0],[-d,0],[0,d],[0,-d]]){const chunk=w.chunk(cx+dx,cy+dy);node=[...chunk.trees,...chunk.rocks].find(n=>n.amount>1);if(node)break;}
 assert.ok(node);const saved=copy(g.serialize());saved.frontier.seen=[p.id];saved.frontier.taken[object.id]=object.amount;saved.frontier.taken[node.id]=Math.min(2,node.amount);
 assert.equal(g.restoreSave(saved),true);return{object,node};
}

test('165 a real new G8 selects water while Continue of an empty old G8 remains exactly historical',()=>{
 const g=campaign();assert.equal(g.frontier.position().hydrologyVersion,1);const water=g.frontier.world();assert.equal(water.hydrologyVersion,1);assert.ok(water.hydrology);
 const historical=copy(g.serialize());delete historical.frontier.hydrologyVersion;delete historical.frontier.wildlife165;
 assert.equal(g.restoreSave(historical),true);const dry=g.frontier.world();assert.equal(g.frontier.position().hydrologyVersion,0);assert.equal(dry.hydrologyVersion,0);assert.equal(dry.hydrology,null);assert.notEqual(dry,water);
 const before=checkpoint(g);assert.equal(g.restoreSave(copy(g.serialize())),true);assert.equal(g.frontier.world(),dry);assert.deepEqual(checkpoint(g),before);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.frontier.position().hydrologyVersion,0);assert.equal(g.frontier.world().hydrology,null);
 g.startNew('standard','42');assert.equal(g.frontier.position().hydrologyVersion,1);assert.equal(g.frontier.world().hydrologyVersion,1);
});

test('165 unknown or incompatible water revisions reject a whole save atomically',()=>{
 const g=campaign(),before=checkpoint(g),world=g.world,regional=g.frontier.world();
 for(const change of [s=>{s.frontier.hydrologyVersion=2;},s=>{s.frontier.hydrologyVersion=null;},s=>{s.frontier.generation=7;},s=>{s.frontier.ecologyVersion=0;}]){
  const corrupt=copy(g.serialize());change(corrupt);assert.throws(()=>g.restoreSave(corrupt),/Hydrologie/);
  assert.equal(g.world,world);assert.equal(g.frontier.world(),regional);assert.deepEqual(checkpoint(g),before);
 }
});

for(const hydrologyVersion of [0,1])test('165 finite contents and resources survive G9 G10 detail13 and Continue with water revision '+hydrologyVersion,()=>{
 const g=campaign(),raw=copy(g.serialize());raw.frontier.hydrologyVersion=hydrologyVersion;assert.equal(g.restoreSave(raw),true);
 const owned=fixture(g),before=checkpoint(g),create=W.create,candidates=[];
 W.create=function(seed,generation,effects){const w=create(seed,generation,effects);candidates.push({generation,effects,hydrologyVersion:w.hydrologyVersion});return w;};
 try{
  const g9=g.worldOps131.actions().find(a=>a.id==='expandCodex4000');assert.ok(g9&&!g9.disabled);assert.equal(g9.run().ok,true);
  const g10=g.worldOps131.activateTerritories160();assert.equal(g10.ok,true,g10.reason);
  for(const detailVersion of [12,13]){const result=g.worldOps131.upgradeDetails159(detailVersion);assert.equal(result.ok,true,result.reason);}
  assert.equal(g.frontier.position().hydrologyVersion,hydrologyVersion);assert.equal(g.frontier.world().hydrologyVersion,hydrologyVersion);
  const after=checkpoint(g);assert.deepEqual(after.frontier.taken,before.frontier.taken);
  for(const key of ['resources','nodes','player','randomState','expeditions'])assert.deepEqual(after[key],before[key],key+' must not be gifted or replaced by an extension');
  assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),after);
  assert.equal(g.frontier.takenAmount(owned.object.id),owned.object.amount);assert.equal(g.frontier.takenAmount(owned.node.id),Math.min(2,owned.node.amount));
  assert.ok(candidates.some(c=>c.generation===9));assert.ok(candidates.some(c=>c.generation===10));
  assert.ok(candidates.every(c=>c.effects.hydrologyVersion===hydrologyVersion&&c.hydrologyVersion===hydrologyVersion),'Every live and validation candidate must use the saved water revision');
 }finally{W.create=create;}
});
