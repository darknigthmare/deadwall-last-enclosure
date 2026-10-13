'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../src/codex3000-live-data.js');
const G=require('../src/frontier-geometry.js');
const R=require('../src/codex3000-runtime.js');
const W=require('../src/frontier-world.js');
const Codex=require('../src/world-codex.js');
test('Codex canonical compilation: 3,000 archived cards + 1,000 independent new parents, linked and unique',()=>{
 assert.equal(data.version,1);assert.equal(data.count,4000);assert.equal(data.legacyCount,3000);
 assert.equal(data.programmes.length,4000);assert.equal(Object.keys(data.parents).length,2000);
 assert.equal(R.records.length,4000);assert.equal(new Set(R.records.map(x=>x.id)).size,4000);
 assert.ok(R.summary().families>=30);assert.ok(R.summary().modules>=59);assert.equal(R.summary().states,8);
 for(let i=0;i<3000;i++){
  const r=R.records[i];assert.equal(r.id,'DW-'+String(i+1).padStart(4,'0'));
  assert.ok(R.parentFor(r),r.id);assert.equal(r.original,i<1000);
  if(i>=1000){assert.ok(r.module&&r.state,r.id);assert.equal(R.get(r.parent).original,true);}
 }
});
test('Codex 3000 preserves original metric plot bounds and authored floor programmes',()=>{
 const house=R.template('DW-0001',0,'P1000');
 assert.deepEqual(house.reference.min,[12,10]);
 assert.deepEqual(house.reference.max,[28,24]);
 const supplement=R.template('DW-0501',0,'P1001');
 assert.deepEqual(supplement.reference.min,[10,9]);
 assert.ok(supplement.levels.includes(0)&&supplement.levels.includes(1));
 assert.equal(typeof supplement.adapted,'boolean');
 for(const [id,meta] of Object.entries(data.parents)){
  const authored=meta[4];
  assert.ok(authored&&authored.sourceMin.length===2&&authored.sourceMax.length===2,id);
  assert.ok(authored.sourceMin.every((n,i)=>n>0&&n<=authored.sourceMax[i]),id);
  assert.ok(authored.levels.length&&authored.levels.includes(0),id);
  assert.ok(authored.levels.every(z=>Number.isInteger(z)&&z>=-1&&z<=2),id);
 }
});
test('All 4,000 programme cards are queryable and never disguised as already placed POIs',()=>{
 const entries=Codex.entries.filter(e=>e.id.startsWith('programme-DW-'));
 assert.equal(entries.length,4000);
 assert.ok(entries.every(e=>e.status==='programme'));
 assert.ok(Codex.query({text:'DW-3000',status:'programme'}).some(e=>e.id==='programme-DW-3000'));
 assert.equal(Codex.query({status:'terrain'}).some(e=>e.id==='programme-DW-1001'),false);
});
test('Authored floors above the playable limit remain in provenance and are explicitly adapted',()=>{
 // DW-0023.md proposes floors 0 through 8; DW-0506.md specifies four levels.
 const tower=R.template('DW-0023'),block=R.template('DW-0506');
 assert.deepEqual(tower.reference.levels,[0,1,2,3,4,5,6,7,8]);
 assert.deepEqual(block.reference.levels,[0,1,2,3]);
 for(const plan of [tower,block]){
  assert.deepEqual(plan.levels,[0,1,2]);assert.equal(plan.adaptedLevels,true);assert.equal(plan.adapted,true);
  assert.throws(()=>R.floor(plan.id,0,3),/Niveau indisponible/,'unsupported floor was made playable');
 }
 let truncated=0;
 for(const row of R.records){const plan=R.template(row.id),source=R.parentFor(row)[4];
  assert.deepEqual(plan.reference.levels,source.sourceLevels,row.id);
  assert.ok(plan.reference.levels.every(Number.isInteger));
  if(plan.reference.levels.some(z=>z>2)){truncated++;assert.equal(plan.adaptedLevels,true,row.id);assert.equal(plan.adapted,true,row.id);}
  assert.ok(plan.levels.every(z=>z>=-1&&z<=2));
 }
 assert.ok(truncated>0,'authored high floors were silently discarded');
});
test('All 3,000 source blueprints generate bounded metric room plans, circulation and finite props',()=>{
 const positions=new Set();
 for(const row of R.records){
  const a=R.template(row.id,11531,'P2500'),b=R.template(row.id,11531,'P2500');
  assert.deepEqual(a,b,row.id);
  assert.ok(a.w>=17&&a.w<=78&&a.h>=18&&a.h<=75,row.id);
  assert.ok(a.rooms.length>=3,row.id);
  assert.ok(a.levels.includes(0)&&a.levels.every(z=>Number.isInteger(z)&&z>=-1&&z<=2));
  const fl=R.floor(row.id,11531,0,'P2500'),copy=R.floor(row.id,11531,0,'P2500');
  assert.deepEqual(fl,copy,row.id);
  assert.ok(fl.walls.length>=4&&fl.rooms.length>=1,row.id);
  assert.ok(fl.floor.w>0&&fl.floor.h>0);
  assert.ok(fl.entry.y<0&&fl.exit.y>a.h,row.id);
  const ids=fl.objects.map(o=>o.id);assert.equal(new Set(ids).size,ids.length);
  for(const o of fl.objects){
   assert.ok(Object.hasOwn(G.SHAPES,o.kind),row.id+' unknown kind '+o.kind);
   assert.ok(['wood','scrap','stone','food','fuel','ammo','medicine'].includes(o.resource));
   assert.ok(o.amount>0&&o.amount<=12);
   assert.ok(o.x>=.3&&o.y>=.3&&o.x+o.w<=a.w-.3&&o.y+o.h<=fl.floor.h+.3);
  }
  positions.add(JSON.stringify([a.w,a.h,a.rooms.map(r=>r.name)]));
 }
 assert.ok(positions.size>=400,'parent plans collapsed into a handful of generic shells');
});
test('Unsupported coast, water, grade-separated roads and human factions do not spawn on unsupported ground',()=>{
 const bad=['DW-0300'];assert.equal(R.enabled(R.get(bad[0]),{biome:'meadow'}),false);
 const rows=R.records.filter(x=>['port','plage','lac','riviere','montagne','camp-hostile','routes-coutures'].includes(x.module));
 assert.ok(rows.length>0);
 assert.ok(rows.every(row=>!R.enabled(row,{biome:'meadow',townKind:'grande-ville'})));
});
test('Existing G7 region assigns stable, matching programme family without replacing old POI or loot',()=>{
 const w=W.create(17117,7);
 const p=w.pois.find(q=>q.type==='house');
 assert.ok(p);
 const before=JSON.stringify([p,w.plan(p,0)]);
 const a=w.detailAt(p,0),b=w.detailAt(p,0);
 assert.equal(a,b);assert.ok(/^DW-\d{4}$/.test(a.programme3000));
 assert.equal(R.get(a.programme3000).family,R.get(p.codex).family);
 assert.equal(JSON.stringify([p,w.plan(p,0)]),before);
 assert.ok(a.outdoor.every(x=>x.amount===undefined), 'new story prop must not give loot');
});
test('Opt-in G8 adds physical programme sites without moving any existing G7 POI',()=>{
 const w7=W.create(17117,7),w8=W.create(17117,8);
 assert.ok(w8.codexCoverage);
 assert.equal(w8.codexCoverage.programmeCount,3000);
 assert.ok(w8.codexCoverage.placed>50,'no viable Codex 3000 sites were generated');
 assert.ok(w8.pois.length>w7.pois.length);
 const before=w7.pois.map(p=>[p.id,p.x,p.y,p.a,p.type,p.codex,p.w,p.h]);
 assert.deepEqual(w8.pois.slice(0,before.length).map(p=>[p.id,p.x,p.y,p.a,p.type,p.codex,p.w,p.h]),before);
 const extra=w8.pois.slice(before.length);
 assert.equal(new Set(extra.map(p=>p.id)).size,extra.length);
 for(const p of extra.slice(0,30)){
  assert.equal(p.generation,8);assert.ok(R.get(p.programme3000));
  assert.equal(p.codex,p.programme3000);
  assert.ok(p.levels.includes(0)&&w8.plan(p,0).rooms.length>0);
  assert.ok(w8.plan(p,0).objects.every(o=>o.amount>0));
  assert.ok(w8.detailAt(p,0).outdoor.every(o=>o.amount===undefined));
  assert.ok(w8.nearestRoad(p.drive.a).d<.15,p.id+' road disconnected');
 }
});
