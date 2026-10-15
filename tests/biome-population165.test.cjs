'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),P=require('../src/biome-population165.js'),W=require('../src/frontier-world.js');
const fake=(options={})=>({seed:17117,size:24576,generation:8,hydrologyVersion:1,home:{x:12000,y:12000},hydrology:{sample:()=>({water:false,movementBlocked:false,salinity:'fresh',distanceToWater:12,...options.water})},
 biomeAt:()=>({id:options.biome||'meadow'}),nearestRoad:()=>options.road||null,nearPOI:()=>options.pois||[],blocked:()=>options.blocked||false,
 biomes:{enemyProfile:()=>({...C.BiomeRules135.enemies.walker,kind:'walker',biome:options.biome||'meadow'})}});
function sample(w,kind,count=80){const out=[];for(let cy=0;cy<8;cy++)for(let cx=0;cx<10;cx++)for(let i=0;i<(kind==='animal'?2:1);i++){const q=P[kind](w,cx,cy,i);if(q)out.push(q);}return out.slice(0,count);}

test('165 population supports browser loading before both core and geometry',()=>{
 const sandbox=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/biome-population165.js'),'utf8'),sandbox);
 assert.ok(sandbox.DeadwallBiomePopulation165);sandbox.DeadwallCore=C;sandbox.DeadwallFrontierGeometry=G;
 assert.ok(sandbox.DeadwallBiomePopulation165.animal(fake(),2,0,0));
});

test('165 candidates are deterministic, finite, diverse and never advance ambient RNG',()=>{
 const w=fake(),before=Math.random;Math.random=()=>{throw Error('Ambient RNG is forbidden');};try{
  const a=sample(w,'animal'),n=sample(w,'contact');assert.ok(a.length>30&&n.length>15);assert.deepEqual(a,sample(fake(),'animal'));assert.deepEqual(n,sample(fake(),'contact'));
  assert.equal(new Set(a.map(q=>q.species)).size,5);assert.deepEqual([...new Set(a.map(q=>q.variant))].sort(),[0,1,2,3]);
  for(const q of[...a,...n]){assert.equal(q.z,0);assert.equal(q.poi,null);assert.ok(Object.isFrozen(q));assert.equal(P.candidate(w,q.id),q);assert.ok(Math.hypot(q.x-w.home.x,q.y-w.home.y)>=C.BiomePopulation165Rules.homeExclusion);}
  for(const q of n)assert.deepEqual(q.profile,{...C.BiomeRules135.enemies.walker,kind:'walker',biome:'meadow',name:'Errant des berges'});
 }finally{Math.random=before;}
});

test('165 waterbirds match nearby water salinity and dry-bank reach, with no fauna in open water',()=>{
 for(const salinity of['fresh','salt']){const rows=sample(fake({biome:'brownfield',water:{salinity}}),'animal');assert.ok(rows.length>20);for(const q of rows)assert.ok((salinity==='fresh'?['duck','heron']:['gull']).includes(q.species));}
 assert.deepEqual(sample(fake({biome:'brownfield',water:{salinity:'fresh',distanceToWater:90}}),'animal'),[]);
 for(const field of['water','movementBlocked']){const w=fake({water:{[field]:true}});assert.deepEqual(sample(w,'animal'),[]);assert.deepEqual(sample(w,'contact'),[]);}
 const rows=sample(fake({water:{distanceToWater:200}}),'animal');assert.deepEqual([...new Set(rows.map(q=>q.species))].sort(),['boar','hare','roeDeer']);
});

test('165 mutable parcel and collision admission cannot change an encounter identity or resurrect it',()=>{
 const dry=fake(),blocked=fake({blocked:true}),parcel=fake({pois:[{reserve:{l:0,t:0,r:24000,b:24000}}]}),q=P.animal(dry,2,0,0);assert.ok(q);
 assert.deepEqual(P.animal(blocked,2,0,0),q);assert.deepEqual(P.animal(parcel,2,0,0),q);assert.equal(P.admitted(dry,q),true);assert.equal(P.admitted(blocked,q),false);assert.equal(P.admitted(parcel,q),false);
 const road=fake({road:{d:1,road:{width:6}}});assert.deepEqual(sample(road,'animal'),[]);assert.deepEqual(sample(road,'contact'),[]);
 const legacy={...dry,hydrologyVersion:0};assert.deepEqual(P.around(legacy,600,200),{animals:[],contacts:[]});assert.equal(P.candidate(legacy,q.id),null);
});

test('165 candidate LRU stays bounded and reconstructs byte-identical descriptors after eviction',()=>{
 const w=fake(),first=P.animal(w,2,0,0);assert.ok(first);for(let cy=0;cy<32;cy++)for(let cx=0;cx<32;cx++)for(let i=0;i<2;i++)P.animal(w,cx,cy,i);
 assert.equal(P.cacheSize(w),C.BiomePopulation165Rules.candidateCache);assert.deepEqual(P.animal(w,2,0,0),first);assert.notEqual(P.animal(w,2,0,0),first);
});

test('165 real encounter origins remain identical through G8, G9, G10 and furniture revisions',()=>{
 const worlds=[W.create(17117,8,{ecologyVersion:1,hydrologyVersion:1}),W.create(17117,9,{ecologyVersion:1,hydrologyVersion:1,detailVersion:12}),W.create(17117,10,{ecologyVersion:1,hydrologyVersion:1,detailVersion:13})];
 for(const id of['A165_2_0_0','N165_2_0_0']){const expected=P.candidate(worlds[0],id);assert.ok(expected);for(const w of worlds.slice(1))assert.deepEqual(P.candidate(w,id),expected);}
 for(const w of worlds)for(const q of P.around(w,610,180,200).animals)if(P.admitted(w,q))assert.equal(w.blocked(q.x,q.y,q.radius,0,null),false);
});
