'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../src/codex3000-live-data.js');
const G=require('../src/frontier-geometry.js');
const R=require('../src/codex3000-runtime.js');
const W=require('../src/frontier-world.js');
const Codex=require('../src/world-codex.js');
test('Codex 3000 canonical compilation: 1,000 parents + 2,000 contextual variants, linked and unique',()=>{
 assert.equal(data.version,1);assert.equal(data.count,3000);
 assert.equal(data.programmes.length,3000);assert.equal(Object.keys(data.parents).length,1000);
 assert.equal(R.records.length,3000);assert.equal(new Set(R.records.map(x=>x.id)).size,3000);
 assert.ok(R.summary().families>=30);assert.ok(R.summary().modules>=59);assert.equal(R.summary().states,8);
 for(let i=0;i<3000;i++){
  const r=R.records[i];assert.equal(r.id,'DW-'+String(i+1).padStart(4,'0'));
  assert.ok(R.parentFor(r),r.id);assert.equal(r.original,i<1000);
  if(i>=1000){assert.ok(r.module&&r.state,r.id);assert.equal(R.get(r.parent).original,true);}
 }
});
test('All 3,000 programme cards are queryable and never disguised as already placed POIs',()=>{
 const entries=Codex.entries.filter(e=>e.id.startsWith('programme-DW-'));
 assert.equal(entries.length,3000);
 assert.ok(entries.every(e=>e.status==='programme'));
 assert.ok(Codex.query({text:'DW-3000',status:'programme'}).some(e=>e.id==='programme-DW-3000'));
 assert.equal(Codex.query({status:'terrain'}).some(e=>e.id==='programme-DW-1001'),false);
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
