'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Q=require('./helpers/collision-broadphase208.cjs'),G=require('../src/frontier-geometry.js');
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/collision-broadphase208-golden.json'),'utf8'));
let native;
const fixture=()=>native||=(Q.countingWorld208());

test('208 actual slow-route collision queries do not rebuild distant details after67plan/detail eviction cycles',()=>{
 const f=fixture(),before=Q.query208(f);assert.deepEqual(before,{blocked:false,optical:true,movement:true});
 for(let cycle=0;cycle<3;cycle++){
  const old=f.counts.details,sites=Q.churn208(f);assert.equal(sites.length,67);assert.ok(f.counts.details-old>=64,'The real detail LRU must actually churn, not a counter fixture.');
  const counts={...f.counts};assert.deepEqual(Q.query208(f),before);
  assert.equal(f.counts.details,counts.details,'A distant parcel must not rebuild after outdoor AABB warmup.');assert.equal(f.counts.enrich,counts.enrich,'The raster accessGrid enrichment chain must remain unused.');
  assert.ok(f.world.planCacheSize()<=48);assert.ok(f.world.cacheSize()<=25);
 }
});

test('208 native G11 broadphase keeps exact rotated/tangent/ignore/transparent and outside-footprint collision results',()=>{
 const f=fixture(),row=baseline.worlds.find(row=>row.generation===11),sample=Q.samples208(f.world);
 assert.deepEqual(sample.queries,row.queries);assert.ok(sample.queries.some(q=>q.opaque===false));assert.ok(sample.queries.some(q=>q.ignore));
 assert.ok(sample.sites.some(p=>p.a!==0));assert.deepEqual(sample.queries.map(q=>Q.evaluate208(f.world,q)),row.answers);
 Q.churn208(f);assert.deepEqual(sample.queries.map(q=>Q.evaluate208(f.world,q)),row.answers);
 assert.deepEqual(Q.geometry208(f.world,sample.sites),row.geometry,'Geometry, props, IDs and finite stocks keep their actual pre-fix hashes.');
});

test('208 legacy G7 collision and authored geometry retain their pre-fix native fingerprints',()=>{
 const row=baseline.worlds.find(row=>row.generation===7),f=Q.countingWorld208({generation:7,effects:row.effects}),sample=Q.samples208(f.world);
 assert.deepEqual(sample.queries,row.queries);assert.deepEqual(sample.queries.map(q=>Q.evaluate208(f.world,q)),row.answers);assert.deepEqual(Q.geometry208(f.world,sample.sites),row.geometry);
});

test('208 contextual160 outdoor geometry remains a live reader outside a warmed collider envelope',()=>{
 const f=fixture(),w=f.world;let witness;
 for(const p of w.pois.filter(p=>p.programme160&&p.context160?.profile)){
  const a=G.global(p,-12,-12),b=G.global(p,-11.99,-12),before=f.counts.context;w.line(a,b,0,p.id,null,.01);
  if(f.counts.context>before){witness={p,a,b};break;}
 }
 assert.ok(witness,'A real contextual160 reader must be reached.');const before=f.counts.context;w.line(witness.a,witness.b,0,witness.p.id,null,.01);assert.ok(f.counts.context>before,'Dynamic160 details must never be bypassed by static bounds.');
});

test('208 collider bounds belong to their world and read no RNG or save state',()=>{
 const f=fixture(),before=Q.geometry208(f.world,Q.samples208(f.world).sites),random=Math.random;Math.random=()=>assert.fail('Collision broadphase consumes ambient randomness.');
 try{for(let i=0;i<5;i++)assert.deepEqual(Q.query208(f),{blocked:false,optical:true,movement:true});}finally{Math.random=random;}
 assert.deepEqual(Q.geometry208(f.world,Q.samples208(f.world).sites),before);const other=Q.countingWorld208(),cold=other.counts.details;assert.deepEqual(Q.query208(other),{blocked:false,optical:true,movement:true});assert.ok(other.counts.details>cold,'A fresh world must establish its own exact outdoor envelope.');
});
