'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),F=require('../src/biome-forage193.js'),P=require('../src/codex-plan165.js');

test('205 G11 direct ecology keeps the G10 habitat and finite species profiles',()=>{
 for(const seed of [0,42,17117,4294967295])for(const [x,y] of [[320,480],[3940,5120],[18000,19000]]){
  const previous=B.sample(seed,x,y,true,{generation:10}),current=B.sample(seed,x,y,true,{generation:11});
  assert.ok(previous.habitat);assert.deepEqual(current,previous);
  assert.deepEqual(B.pickTree(seed,x,y,'witness205',{generation:11}),B.pickTree(seed,x,y,'witness205',{generation:10}));
  assert.deepEqual(B.pickRock(seed,x,y,'witness205',{generation:11}),B.pickRock(seed,x,y,'witness205',{generation:10}));
  assert.deepEqual(B.enemyProfile(seed,x,y,'witness205',{generation:11}),B.enemyProfile(seed,x,y,'witness205',{generation:10}));
  assert.equal(B.sample(seed,x,y,true,{generation:6}).habitat,undefined);
 }
});

test('205 G11 forage preserves finite origins while new parcels only veto current admission',()=>{
 const field=generation=>({seed:17117,size:C.GeographyRules135.size,generation,ecologyVersion:1,hydrologyVersion:1,landscape189:'classic',
  home:{x:12000,y:12000},hydrology:{sample:()=>({water:false,movementBlocked:false,crossing:null,distanceToWater:1000}),blockedCircle:()=>false},
  biomeAt:()=>({id:'bocage'}),nearestRoad:()=>null,nearPOI:()=>[],drivewayAt:()=>null,blocked:()=>false});
 const previous=field(10),current=field(11),rows=[],ruleBefore=JSON.stringify(C.Forage193Rules),random=Math.random;
 Math.random=()=>{throw Error('Read-only forage must not consume ambient randomness');};
 try{
  for(let cy=0;cy<3;cy++)for(let cx=0;cx<3;cx++)for(let slot=0;slot<C.Forage193Rules.candidates;slot++){
   const id='F193_'+cx+'_'+cy+'_'+slot,a=F.candidate(previous,id),b=F.candidate(current,id);assert.deepEqual(b,a);if(b)rows.push(b);
  }
  assert.ok(rows.length>0);const q=rows[0];assert.ok(q.amount>0&&Object.isFrozen(q));assert.equal(F.admitted(current,q),true);
  current.nearPOI=()=>[{reserve:{l:q.x-1,r:q.x+1,t:q.y-1,b:q.y+1}}];
  assert.equal(F.admitted(current,q),false);assert.deepEqual(F.candidate(current,q.id),q);
  current.nearPOI=()=>[];assert.equal(F.admitted(current,q),true);assert.equal(F.candidate(current,q.id).amount,q.amount);
  const unknown=field(12);unknown.biomeAt=()=>{throw Error('Unknown generation must be rejected before geography');};
  assert.equal(F.candidate(unknown,q.id),null);assert.deepEqual(F.around(unknown,q.x,q.y,10),[]);
  assert.equal(JSON.stringify(C.Forage193Rules),ruleBefore);
 }finally{Math.random=random;}
});

test('205 G11 legacy plan inspection preserves the actual G10 owner, geometry and contents',()=>{
 for(const id of ['DW-0266','DW-0268','DW-0294','DW-0300','DW-1204']){
  const previous=P.inspect(id,17117,0,13,10),current=P.inspect(id,17117,0,13,11);
  assert.equal(current.supported,true);assert.equal(current.p.generation,10);assert.deepEqual(current,previous);
 }
 for(const generation of [7,12,255,NaN,'11'])assert.throws(()=>P.inspect('DW-0266',17117,0,13,generation),/Génération/);
});

test('205 completed G10 work validates in separate G10/G11 caches and rejects future worlds or new-site impostors',()=>{
 const calls=[],context=vm.createContext({DeadwallCore:C,DeadwallFrontierGeometry:require('../src/frontier-geometry.js'),
  DeadwallFrontierWorld:{create(seed,generation,effects){
   calls.push({seed,generation,effects});return{pois:[{id:'P0001',generation:seed===42?11:10,
    context160:{operations:[{key:'access',kind:'restoreAccess'}]}}]};
  }}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/context-operations160.js'),'utf8'),context);
 const O=context.DeadwallContextOperations160,record={version:1,completed:['P0001:160:access']},full=generation=>({worldSeed:17117,
  frontier:{generation,detailVersion:13,ecologyVersion:1,hydrologyVersion:1,landscape189:'balanced',seen:['P0001']}});
 for(const generation of [10,11,10,11])assert.equal(O.normalize(record,full(generation)).completed.join(','),record.completed.join(','));
 assert.deepEqual(calls.map(row=>row.generation),[10,11]);
 for(const row of calls){assert.equal(row.effects.detailVersion,13);assert.equal(row.effects.ecologyVersion,1);assert.equal(row.effects.hydrologyVersion,1);assert.equal(row.effects.landscape189,'balanced');}
 assert.throws(()=>O.normalize(record,full(12)),/invalide/);assert.equal(calls.length,2);
 assert.throws(()=>O.normalize(record,{...full(11),worldSeed:42}),/invalide/,'The new G11 site cannot impersonate a historical operation owner.');
 assert.equal(calls.length,3);
});
