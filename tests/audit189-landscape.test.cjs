'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),B=require('../src/biomes135.js'),E=require('../src/biomes164.js'),L=require('../src/landscape189.js'),S=require('../src/frontier-state.js');
const profile=(seed,preset)=>E.create({base:L.create({base:B,seed,preset}),seed});
for(const preset of ['balanced','large','patchwork'])test('189 '+preset+' fields are continuous, reproducible and independent of sample order',()=>{
 const a=profile(0,preset),b=profile(0,preset),points=Array.from({length:160},(_,i)=>({x:(i*117.713)%20000,y:(i*370.43)%24000}));
 const before=points.map(p=>a.sample(0,p.x,p.y,true));for(const p of [...points].reverse())b.sample(0,p.x,p.y,true);
 assert.deepEqual(before,points.map(p=>b.sample(0,p.x,p.y,true)));
 for(const x of [256,512,2048,8192,16384]){const p=a.climate(0,x-.001,7000),q=a.climate(0,x+.001,7000);for(const k of ['temperature','moisture','elevation'])assert.ok(Math.abs(p[k]-q[k])<.001,'no chunk edge jump');}
 for(const v of before){assert.ok(Object.values(v.weights).every(n=>Number.isFinite(n)&&n>=0));assert.ok(Math.abs(Object.values(v.weights).reduce((s,n)=>s+n,0)-1)<1e-10);}
});
test('189 historical provider is not wrapped, reordered or modified',()=>{const before=JSON.stringify(B.sample(42,100,200));assert.equal(L.create({base:B,seed:42,preset:'classic'}),B);profile(42,'large').sample(42,100,200);assert.equal(JSON.stringify(B.sample(42,100,200)),before);});
test('189 different seeds and sizes change biomes while retaining broad neighbourhoods',()=>{
 const a=profile(42,'balanced'),b=profile(17117,'balanced'),large=profile(42,'large');let changed=0,sizeChanged=0,neighbours=0,total=0;const biomes=new Set();
 for(let y=300;y<24000;y+=600)for(let x=300;x<24000;x+=600){const id=a.sample(42,x,y,false).id;biomes.add(id);changed+=id!==b.sample(17117,x,y,false).id;sizeChanged+=id!==large.sample(42,x,y,false).id;neighbours+=id===a.sample(42,x+10,y,false).id;total++;}
 assert.ok(changed/total>.4);assert.ok(sizeChanged/total>.4);assert.ok(neighbours/total>.9);assert.ok(biomes.size>=13);
});
test('189 invalid profiles/seeds fail instead of silently regenerating a historical world',()=>{
 for(const preset of [null,'',true,1,{},'infinite'])assert.throws(()=>L.normalize(preset));for(const seed of [-1,2**32,.5,'42'])assert.throws(()=>L.create({base:B,seed,preset:'balanced'}));
 const old={...S.initial(),generation:8,ecologyVersion:1,hydrologyVersion:1};assert.equal(S.normalize(old).landscape189,undefined);
 for(const landscape189 of ['balanced','large','patchwork'])assert.equal(S.normalize({...old,landscape189}).landscape189,landscape189);
 for(const landscape189 of [null,false,{},'unknown'])assert.throws(()=>S.normalize({...old,landscape189}));
 assert.throws(()=>S.normalize({...old,landscape189:'balanced',hydrologyVersion:0}));
});
