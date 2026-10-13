'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const B=require('../src/biomes135.js');
// Captured from the source before adding G10 to sample's exact whitelist.
// Each receipt hashes samples/species/health at two seeds and three positions,
// plus a complete finite tree/rock/decor chunk. No world or game is created.
const legacyDigests={
 1:'30a66f194b95f3a03d4308447cebe66129a160250c1ec7fdebd2891a63417fb1',
 2:'30a66f194b95f3a03d4308447cebe66129a160250c1ec7fdebd2891a63417fb1',
 3:'30a66f194b95f3a03d4308447cebe66129a160250c1ec7fdebd2891a63417fb1',
 4:'30a66f194b95f3a03d4308447cebe66129a160250c1ec7fdebd2891a63417fb1',
 5:'30a66f194b95f3a03d4308447cebe66129a160250c1ec7fdebd2891a63417fb1',
 6:'30a66f194b95f3a03d4308447cebe66129a160250c1ec7fdebd2891a63417fb1',
 7:'2a9a047265fdd6fe769c703c67ae3061b2dffa2ceccacb4f1c5ae100ba11bf98',
 8:'2a9a047265fdd6fe769c703c67ae3061b2dffa2ceccacb4f1c5ae100ba11bf98',
 9:'2a9a047265fdd6fe769c703c67ae3061b2dffa2ceccacb4f1c5ae100ba11bf98'
};
for(let generation=1;generation<=9;generation++)test('G'+generation+': historical ecology, species, health and finite chunk remain identical',()=>{
 const samples=[];for(const seed of [17117,84329])for(const[x,y]of [[255.99,256.01],[8192,7904],[19000,23888]]){
  const options={generation},key='legacy160';samples.push({sample:B.sample(seed,x,y,true,options),tree:B.pickTree(seed,x,y,key,options),rock:B.pickRock(seed,x,y,key,options),enemy:B.enemyProfile(seed,x,y,key,options)});
 }
 const chunk=B.scatter(17117,30,30,{generation}),digest=createHash('sha256').update(JSON.stringify({samples,chunk})).digest('hex');assert.equal(digest,legacyDigests[generation]);
});
test('G10 direct readers retain exactly the G9 habitat, palette, tree/rock species and enemy profiles',()=>{
 const random=Math.random;Math.random=()=>{throw Error('Biome readers must not use ambient or gameplay RNG');};
 try{for(const seed of [0,17117,84329,4294967295])for(const[x,y]of [[.001,.002],[255.99,256.01],[8192,7904],[19000,23888],[24575,24575]]){
  const options9={generation:9},options10={generation:10};for(const palette of [true,false]){const actual=B.sample(seed,x,y,palette,options10);assert.ok(actual.habitat?.decorPool);assert.deepEqual(actual,B.sample(seed,x,y,palette,options9));}
  for(const reader of ['pickTree','pickRock','enemyProfile'])assert.deepEqual(B[reader](seed,x,y,'same160',options10),B[reader](seed,x,y,'same160',options9),reader);
 }}finally{Math.random=random;}
});
test('G10 finite scatter provider generates exactly the G9 trees, rocks, decor, IDs and quantities',()=>{
 for(const seed of [0,17117,84329,4294967295])for(const[cx,cy]of [[1,1],[30,30]]){
  const actual=B.scatter(seed,cx,cy,{generation:10});assert.deepEqual(actual,B.scatter(seed,cx,cy,{generation:9}));
  for(const item of [...actual.trees,...actual.rocks])assert.ok(Number.isFinite(item.amount)&&item.amount>0&&typeof item.habitat==='string');
 }
 const clear=(x,y,pad)=>x<7750-pad||y>7800+pad;
 assert.deepEqual(B.scatter(17117,30,30,{generation:10,clear}),B.scatter(17117,30,30,{generation:9,clear}));
});
test('Adding G10 does not silently enable unknown generations or change the legacy default sampler',()=>{
 for(const generation of [undefined,0,1,2,3,4,5,6,6.5,10.5,11,999,Infinity])assert.equal(B.sample(17117,8000,8200,true,{generation}).habitat,undefined,String(generation));
 assert.equal(B.sample(17117,8000,8200).habitat,undefined);assert.ok(B.sample(17117,8000,8200,true,{generation:10}).habitat);
});
