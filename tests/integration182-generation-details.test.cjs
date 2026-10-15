'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js');
const copy=value=>JSON.parse(JSON.stringify(value));

test('182 regional generation and optional detail revision remain independent save axes',()=>{
 for(let generation=1;generation<=10;generation++)for(let detailVersion=0;detailVersion<=9;detailVersion++){
  const saved={...S.initial(),generation,detailVersion};
  const normalized=S.normalize(saved);
  assert.equal(normalized.generation,generation);assert.equal(normalized.detailVersion,detailVersion);
  assert.deepEqual(saved,{...S.initial(),generation,detailVersion});
 }
 for(const generation of [0,11,1.5,'10',null])assert.throws(()=>S.normalize({...S.initial(),generation}));
 for(const detailVersion of [-1,11,1.5,'9',null,true])assert.throws(()=>S.normalize({...S.initial(),detailVersion}));
 assert.equal(S.normalize({...S.initial(),generation:10,detailVersion:undefined}).detailVersion,0);
});

test('182 native G9 furniture stays solid with historical detail revision zero',()=>{
 const a=W.create(17117,9,{detailVersion:0}),b=W.create(17117,9,{detailVersion:1});
 assert.deepEqual(a.pois,b.pois);assert.deepEqual(a.roads,b.roads);
 let checked=0;
 for(const p of a.pois.filter(p=>p.generation===9)){
  const other=b.pois.find(q=>q.id===p.id),prior=a.detailAt(p,0),next=b.detailAt(other,0);
  assert.deepEqual(prior,next,'Opting out of historical G7 details cannot desolidify native G9 furniture');
  checked+=prior.interior.filter(o=>o.solid).length+prior.outdoor.filter(o=>o.solid).length;
  if(checked>=5)break;
 }
 assert.ok(checked>=5,'The regression must inspect genuinely solid native G9 detail objects');
});

test('182 depot detail upgrade preserves G10 completed works in its actual candidate and continued save',()=>{
 const Ops=require('../src/world-pack131.js'),ContextOps=require('../src/context-operations160.js');
 const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);ContextOps.install(g);g.startNew('standard','17117');
 standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 assert.equal(g.worldOps131.activateTerritories160().ok,true);
 const site=g.frontier.world().contextSites160().find(p=>p.context160.operations.some(o=>o.kind==='pumpBasin'));
 assert.ok(site);const operation=site.context160.operations.find(o=>o.kind==='pumpBasin'),key=site.id+':160:'+operation.key;
 // Explicit late-state fixture: a valid saved, discovered and completed work.
 // This test covers migration of that state; it does not claim to play its acquisition.
 const data=copy(g.serialize());data.frontier.seen.push(site.id);
 data.expansions127.modules.context160={version:1,completed:[key]};
 assert.equal(g.restoreSave(data),true);standAt(g,g.player,g.core());
 const snapshot=()=>{const s=copy(g.serialize());delete s.timestamp;return s;};
 const before=snapshot(),create=W.create,candidates=[];
 W.create=function(seed,generation,effects){
  const world=create(seed,generation,effects);
  if(generation===10&&effects?.detailVersion===9&&typeof effects.contextCompleted160==='function')candidates.push(world);
  return world;
 };
 try{const result=g.worldOps131.upgradeDetails159(9);assert.equal(result.ok,true,result.reason);}
 finally{W.create=create;}
 assert.equal(candidates.length,1);assert.equal(candidates[0].contextCompleted160(key),true);
 const after=snapshot();assert.equal(after.frontier.generation,10);assert.equal(after.frontier.detailVersion,9);
 assert.equal(g.frontier.world().contextCompleted160(key),true);
 after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);
 assert.equal(g.restoreSave(copy(g.serialize())),true);assert.equal(g.frontier.world().contextCompleted160(key),true);
});
