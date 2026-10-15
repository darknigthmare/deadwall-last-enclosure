'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/codex-plan165.js'),R=require('../src/codex3000-runtime.js'),Q=require('../src/codex3000-recipes159.js'),G=require('../src/frontier-geometry.js'),Pack=require('../src/codex-packing173.js'),S=require('../src/frontier-state.js');
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
test('173 packing: actual recipes preserve all old objects, budgets, obstacles and service access',()=>{
 let added=0;for(const seed of [42,17117])for(const id of ['DW-0001','DW-0020','DW-0123','DW-0221','DW-0501','DW-1001']){
  const a=P.inspect(id,seed,0,9,8),b=P.inspect(id,seed,0,10,8);assert.deepEqual(a.plan,b.plan);assert.deepEqual(a.p,b.p);assert.deepEqual(a.details.outdoor,b.details.outdoor);assert.deepEqual(a.details.interior,b.details.interior.filter(o=>!o.packing173));
  const fresh=b.details.interior.filter(o=>o.packing173),old=[...a.plan.walls,...a.plan.stairs,...a.plan.objects,...a.details.interior.filter(o=>!o.dressing160)];
  const before=Q.accessGrid(a.p,0,a.plan,a.details),after=Q.accessGrid(b.p,0,b.plan,b.details);if(before?.baseline)assert.ok(Q.anchorCells(a.p,0,a.plan,before).every(i=>after.reachable[i]));
  for(const o of fresh){added++;assert.equal(o.resource,undefined);assert.equal(o.amount,undefined);assert.ok([...old,...fresh.filter(x=>x!==o)].every(x=>!hit(o,x,.02)));assert.ok(old.flatMap(Pack.fronts).every(f=>!hit(o,f,.02)));assert.ok(Pack.fronts(o).every(f=>Pack.samples(f).every(([x,y])=>after.reachable[after.at(x,y)])));}
  assert.strictEqual(R.packing({seed,p:b.p,z:0,plan:b.plan,detail:b.details,programme:id}),b.details);
 }assert.ok(added>0);console.log('PACKING173_SAMPLE '+JSON.stringify({recipes:12,added}));
});
test('173 packing: all implemented revisions including ten survive normalization; wrong types and future revisions fail',()=>{
 for(let v=0;v<=12;v++)assert.equal(S.normalize({...S.initial(),detailVersion:v}).detailVersion,v);
 for(const v of [14,-1,1.5,NaN,Infinity,null,true,'10',{},[]])assert.throws(()=>S.normalize({...S.initial(),detailVersion:v}));
});
test('173 packing: real world coordinates use new colliders and LOS without introducing loot or replacing source plans',()=>{
 const W=require('../src/frontier-world.js'),old=W.create(17117,8,{detailVersion:9}),next=W.create(17117,8,{detailVersion:10});assert.deepEqual(old.pois,next.pois);assert.deepEqual(old.roads,next.roads);let added=0;
 for(const p of next.pois.slice(0,65)){const q=old.pois.find(x=>x.id===p.id);for(const z of p.levels){const a=old.detailAt(q,z),b=next.detailAt(p,z);assert.deepEqual(old.plan(q,z),next.plan(p,z));assert.deepEqual(b.interior.filter(o=>!o.packing173),a.interior);for(const o of b.interior.filter(o=>o.packing173)){added++;const c=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.ok(next.blocked(c.x,c.y,.05,z,p.id));assert.equal(next.line(c,{x:c.x+.1,y:c.y},z,p.id),false);assert.equal(next.containers(c.x,c.y,2,z,p.id).some(x=>x.id===o.id),false);}}}
 assert.ok(added>0);console.log('PACKING173_WORLD '+added);
});
test('173 packing: depot transaction only changes revision, failed restore or occupied hands does not mutate campaign',()=>{
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snap=()=>{const d=g.serialize();delete d.timestamp;return d;},before=snap(),restore=g.restoreSave;g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(10).ok,false);assert.deepEqual(snap(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(10).ok,false);g.player.reload=0;
 const action=g.worldOps131.actions().find(a=>a.id==='packing173');assert.ok(action&&!action.disabled);const r=action.run();assert.equal(r.ok,true,r.reason);const after=snap();assert.equal(after.frontier.detailVersion,10);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);assert.equal(action.run().ok,false);
});
