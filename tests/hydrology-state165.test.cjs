'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const S=require('../src/frontier-state.js');
const copy=value=>JSON.parse(JSON.stringify(value));

function isolated({effects=false}={}){
 const calls=[],reads=[],rules={maxWildlifeRecords:24000,maxStride:Math.PI*2,animalAlarm:5,animalDrift:40,contactDrift:180};
 const descriptors={N165_3_3_0:{id:'N165_3_3_0',x:1000,y:1000,radius:.32,profile:{health:42}},
  A165_4_4_0:{id:'A165_4_4_0',x:1100,y:1100,radius:.2,profile:{health:15}}};
 const World={sizeForGeneration:()=>24576,create(seed,generation,effectsApi){calls.push({seed,generation,...effectsApi});return{seed,generation,...effectsApi,
  pois:[{id:'P0000',x:12,y:24,levels:[0]}],threatCount:()=>1,chunk:()=>({trees:[{id:'T3_3_0',amount:2}],rocks:[]}),
  blocked:(x,y)=>(x>1125&&x<1130&&y>1090&&y<1110)&&(!effects||!effectsApi.structureDestroyed('P0000')&&!effectsApi.contextCompleted160('P0000:160:gate'))||(x>1050&&x<1055&&y>990&&y<1010)&&(!effects||effectsApi.resourceTaken('T3_3_0')<2),
  biomes:{enemyProfile:()=>({health:effectsApi.hydrologyVersion?42:65})}};}};
 const Population={RULES:rules,candidate(w,id){reads.push({world:w,hydrologyVersion:w.hydrologyVersion,id});return w.hydrologyVersion===1?descriptors[id]||null:null;}};
 const sandbox={module:{exports:{}},DeadwallFrontierWorld:World,DeadwallFrontierGeometry:{},DeadwallBiomePopulation165:Population};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/frontier-state.js'),'utf8'),sandbox);
 return{api:sandbox.module.exports,calls,reads,descriptors,rules};
}
function record(api){return{...api.initial(),generation:8,ecologyVersion:1,hydrologyVersion:1,
 enemies:{N165_3_3_0:42},tracks:{N165_3_3_0:{x:1001,y:1000,z:0,a:0,mode:'idle',ttl:0,gx:1000,gy:1000,cool:0}},
 wildlife165:{A165_4_4_0:{x:1101,y:1100,a:0,hp:15,alarm:0,stride:.7}}};}

test('165 hydrology is explicit, absent means historical and unknown or incompatible revisions are rejected',()=>{
 assert.equal(S.initial().hydrologyVersion,0);assert.deepEqual(S.initial().wildlife165,{});
 const old={...S.initial(),generation:8,ecologyVersion:1};delete old.hydrologyVersion;delete old.wildlife165;
 assert.equal(S.normalize(old).hydrologyVersion,0);assert.deepEqual(S.normalize(old).wildlife165,{});
 for(let generation=1;generation<=10;generation++){
  assert.equal(S.normalize({...old,generation,ecologyVersion:0,hydrologyVersion:0}).hydrologyVersion,0);
  if(generation>=8)for(const detailVersion of [0,1,12,13])assert.equal(S.normalize({...old,generation,detailVersion,hydrologyVersion:1}).hydrologyVersion,1);
  else if(generation>=7)assert.throws(()=>S.normalize({...old,generation,hydrologyVersion:1}),/Hydrologie incompatible/);
 }
 assert.throws(()=>S.normalize({...old,ecologyVersion:0,hydrologyVersion:1}),/Hydrologie incompatible/);
 for(const hydrologyVersion of [-1,2,.5,'1',true,null,{},[]])assert.throws(()=>S.normalize({...old,hydrologyVersion}),/Hydrologie régionale/);
});

test('165 frontier validation caches independent hydrology worlds and keeps the exact profile authority',()=>{
 const{api,calls}=isolated(),raw={...api.initial(),generation:8,ecologyVersion:1,seen:['P0000'],enemies:{'P0000:e0':43}};
 assert.equal(api.validate({...raw,hydrologyVersion:0},{worldSeed:17117}).enemies['P0000:e0'],43);
 assert.throws(()=>api.validate({...raw,hydrologyVersion:1},{worldSeed:17117}),/profil/);
 assert.equal(api.validate({...raw,hydrologyVersion:1,enemies:{'P0000:e0':42}},{worldSeed:17117}).hydrologyVersion,1);
 assert.equal(api.validate({...raw,hydrologyVersion:0},{worldSeed:17117}).hydrologyVersion,0);
 assert.deepEqual(calls.map(q=>q.hydrologyVersion),[0,1]);
});

test('165 natural encounters and animals validate against candidates from their exact hydrology world',()=>{
 const{api,reads}=isolated(),raw=record(api),snapshot=copy(raw),saved=api.validate(raw,{worldSeed:42});
 assert.equal(saved.enemies.N165_3_3_0,42);assert.equal(saved.wildlife165.A165_4_4_0.hp,15);
 assert.deepEqual(copy(raw),snapshot,'Validation must not alter the input ledger');
 assert.ok(reads.length>=3);assert.ok(reads.every(q=>q.hydrologyVersion===1&&q.world.ecologyVersion===1));
 const deceased=copy(raw);deceased.enemies.N165_3_3_0=0;deceased.kills=1;delete deceased.tracks.N165_3_3_0;deceased.wildlife165.A165_4_4_0.hp=0;
 deceased.wildlife165.A165_4_4_0.x=1127;
 assert.equal(api.validate(deceased,{worldSeed:42}).wildlife165.A165_4_4_0.hp,0,'Dead animals and killed contacts stay depleted even under a later solid');
});

const invalid=[
 ['unknown animal member',s=>{s.wildlife165.A165_4_4_0.loot=1;}],
 ['animal health above species maximum',s=>{s.wildlife165.A165_4_4_0.hp=16;}],
 ['animal alarm above rule',s=>{s.wildlife165.A165_4_4_0.alarm=5.001;}],
 ['animation phase above period',s=>{s.wildlife165.A165_4_4_0.stride=Math.PI*2+.001;}],
 ['animal on a solid',s=>{s.wildlife165.A165_4_4_0.x=1127;}],
 ['animal beyond home range',s=>{s.wildlife165.A165_4_4_0.x=1140.001;}],
 ['nonexistent animal',s=>{s.wildlife165.A165_4_4_1=s.wildlife165.A165_4_4_0;delete s.wildlife165.A165_4_4_0;}],
 ['noncanonical animal ID',s=>{s.wildlife165.A165_04_4_0=s.wildlife165.A165_4_4_0;delete s.wildlife165.A165_4_4_0;}],
 ['natural contact above real profile',s=>{s.enemies.N165_3_3_0=43;}],
 ['natural contact beyond pursuit range',s=>{s.tracks.N165_3_3_0.x=1180.001;}],
 ['natural contact goal beyond pursuit range',s=>{s.tracks.N165_3_3_0.gx=1180.001;}],
 ['natural contact on a solid',s=>{s.tracks.N165_3_3_0.x=1052;}],
 ['natural contact on an upper floor',s=>{s.tracks.N165_3_3_0.z=1;}],
 ['nonexistent natural contact',s=>{s.enemies.N165_5_5_0=42;}],
 ['unknown contact slot',s=>{s.enemies.N165_3_3_1=42;}],
 ['dead natural contact with live pursuit',s=>{s.enemies.N165_3_3_0=0;s.kills=1;}],
 ['legacy hydrology with natural records',s=>{s.hydrologyVersion=0;}]
];
for(const[label,mutate]of invalid)test('165 save refuses '+label+' without mutating the supplied state',()=>{
 const{api}=isolated(),raw=record(api);mutate(raw);const before=copy(raw);
 assert.throws(()=>api.validate(raw,{worldSeed:42}));assert.deepEqual(copy(raw),before);
});

// Reusing geometry must never reuse a previous save's harvested resources or paid access changes.
test('165 cached collision references refresh resource, destruction and context effects for every save',()=>{
 const{api,calls}=isolated({effects:true}),raw=record(api);raw.tracks.N165_3_3_0.x=1052;raw.wildlife165.A165_4_4_0.x=1127;raw.taken.T3_3_0=2;
 const destroyed={worldSeed:42,worldEvolution:{structures:{P0000:0}}};
 assert.doesNotThrow(()=>api.validate(raw,{worldSeed:42},destroyed));
 const unharvested=copy(raw);unharvested.taken.T3_3_0=0;assert.throws(()=>api.validate(unharvested,{worldSeed:42},destroyed),/Poursuite naturelle/);
 assert.doesNotThrow(()=>api.validate(raw,{worldSeed:42},destroyed));
 assert.throws(()=>api.validate(raw,{worldSeed:42},{worldSeed:42,worldEvolution:{structures:{P0000:1}}}),/Animal absent/);
 const completed={worldSeed:42,worldEvolution:{structures:{P0000:1}},expansions127:{modules:{context160:{completed:['P0000:160:gate']}}}};
 assert.doesNotThrow(()=>api.validate(raw,{worldSeed:42},completed));
 assert.throws(()=>api.validate(raw,{worldSeed:42},{worldSeed:42}),/Animal absent/);
 assert.doesNotThrow(()=>api.validate(raw,{worldSeed:42},destroyed));
 assert.equal(calls.length,1,'All revisions use one geometry whose effect callbacks read the current candidate');
});
