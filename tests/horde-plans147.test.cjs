'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),F=C.Siege,D=C.Dayworks,B=require('../src/battlefield.js'),mirror=require('./deadwall-siege/siege.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

test('hordes147 : every pressure weight names a real shipped enemy, including the Briseur',()=>{
 for(const profile of F.PROFILES)for(const kind of Object.keys(profile.weights))assert.ok(Object.hasOwn(C.ENEMIES,kind),profile.id+' has an unknown pressure weight '+kind);
 assert.equal(F.PROFILE_BY_ID.breakers.weights.breacher,2.8);
 assert.equal(F.PROFILE_BY_ID.breakers.weights.breaker,undefined);
 assert.deepEqual(mirror.PROFILES,F.PROFILES,'Historical balancing mirror and shipped catalogue agree');
});
test('hordes147 : the reproduced G7 seed17117 wave8 pressure really increases breachers without new HP or contacts',()=>{
 const catalogue=structuredClone(C.ENEMIES),base=C.wavePlan(8,C.DIFFICULTIES.standard,120),original=structuredClone(base),adapted=F.adaptPlan(base,C.ENEMIES,17117);
 assert.equal(adapted.profile.id,'breakers');assert.equal(base.total,157);assert.equal(base.composition.breacher,8);
 assert.ok(adapted.plan.composition.breacher>=base.composition.breacher*2,'The announced breacher pressure must be effective');
 assert.equal(Object.values(adapted.plan.composition).reduce((sum,n)=>sum+n,0),base.total);assert.equal(adapted.plan.fronts,base.fronts);
 assert.deepEqual(base,original);assert.deepEqual(C.ENEMIES,catalogue);
});
test('hordes147 : real catalogues preserve thresholds, totals and deterministic plans in all difficulties',()=>{
 const catalogue=structuredClone(C.ENEMIES);
 for(const difficulty of Object.values(C.DIFFICULTIES))for(const seed of[0,17117,0xffffffff])for(const wave of[1,2,3,4,5,6,7,8,9,24,200]){
  const base=C.wavePlan(wave,difficulty,288),prior=structuredClone(base),a=F.adaptPlan(base,C.ENEMIES,seed);
  assert.deepEqual(a,F.adaptPlan(base,C.ENEMIES,seed));assert.equal(a.plan.total,base.total);assert.equal(a.plan.fronts,base.fronts);
  assert.equal(Object.values(a.plan.composition).reduce((sum,n)=>sum+n,0),base.total);
  for(const[k,n]of Object.entries(a.plan.composition)){assert.ok(Number.isInteger(n)&&n>=0);if(wave<C.ENEMIES[k].unlockWave)assert.equal(n,0);}
  if(wave<3){assert.equal(a.plan,base);assert.equal(a.profile,null);}else assert.ok(a.profile.minWave<=wave);
  assert.deepEqual(base,prior);
 }
 assert.deepEqual(C.ENEMIES,catalogue);
});
test('hordes147 : real prepareWave keeps the profile provenance and an existing warning save without changing enemy HP',()=>{
 const {g}=bootDocument134();
 for(const difficulty of Object.keys(C.DIFFICULTIES)){
  g.startNew(difficulty,'17117');g.campaignIntro132.skip();g.wave=8;g.phase='calm';g.phaseTime=0;
  const real=globalThis.DeadwallCore,base=real.wavePlan(g.wave,g.difficulty,g.signature),health=real.ENEMIES.breacher.health;
  g.updateDirector(.04);assert.equal(g.phase,'warning');assert.equal(g.siege.snapshot().lastWave.id,'breakers');
  assert.equal(g.siege.snapshot().lastWave.wave,8);assert.ok(g.wavePlan.composition.breacher>base.composition.breacher);
  assert.equal(g.wavePlan.total,base.total);assert.equal(g.wavePlan.fronts,base.fronts);assert.equal(real.ENEMIES.breacher.health,health);
  const saved=g.serialize(),plan=structuredClone(saved.wavePlan),profile=structuredClone(saved.siege.lastWave),rng=saved.randomState;
  assert.equal(saved.version,20);g.restoreSave(saved);assert.deepEqual(g.wavePlan,plan);assert.deepEqual(g.siege.snapshot().lastWave,profile);assert.equal(g.random.state,rng);
  assert.equal(g.spawnZombie('breacher'),true);const z=g.zombies.at(-1);
  assert.equal(z.maxHealth,health*g.difficulty.enemyHealth*real.enemyHealthScale(g.wave));assert.equal(z.health,z.maxHealth);
 }
});
test('hordes147 : the two new profiles keep base composition/cadence and only become eligible with four fronts',()=>{
 assert.equal(F.PROFILE_BY_ID.pincer.minWave,10);assert.equal(F.PROFILE_BY_ID.flank.minWave,13);
 for(const difficulty of Object.values(C.DIFFICULTIES))for(const seed of[0,17117,0xffffffff])for(let wave=3;wave<40;wave++){
  const base=C.wavePlan(wave,difficulty,288),adapted=F.adaptPlan(base,C.ENEMIES,seed);
  if(adapted.profile.frontPattern){assert.ok(wave>=adapted.profile.minWave);assert.equal(base.fronts,4);assert.deepEqual(adapted.plan.composition,base.composition);assert.equal(adapted.plan.spawnInterval,base.spawnInterval);}
 }
 assert.deepEqual(F.PROFILES.filter(p=>!p.frontPattern).map(p=>p.id),['compact','rush','breakers','hunters','burden','attrition']);
});
function permutations(items){return items.length?items.flatMap((item,i)=>permutations(items.filter((_,j)=>j!==i)).map(rest=>[item,...rest])):[[]];}
test('hordes147 : physical pincer/flank fronts share one pure resolver for every saved cardinal order and echelon',()=>{
 const compass=['north','east','south','west'];
 for(const fronts of permutations(compass)){
  const primary=compass.indexOf(fronts[0]),at=offset=>compass[(primary+offset)%4],n=D.beginNight(18,90,fronts);
  for(const[pattern,expected]of Object.entries({pincer:[[at(0),at(2)],[at(1),at(3)],[at(0),at(1),at(2),at(3)]],flank:[[at(0)],[at(1),at(3)],[at(2)]]}))for(let stage=0;stage<3;stage++){
   n.emitted=stage*30;n.pauses=stage;const old=structuredClone(n),actual=D.frontGroup(n,pattern);
   assert.deepEqual(actual,expected[stage]);assert.deepEqual(n,old);actual.push('fake');assert.deepEqual(D.frontGroup(n,pattern),expected[stage]);
   const sample={contacts:0,sectors:B.DIRECTIONS.map(f=>({...f,contacts:0}))},status=B.assaultStatus(sample,n.total-n.emitted,n.fronts,n,6,pattern);
   assert.deepEqual(status.nextFronts.map(f=>f.id).sort(),expected[stage].slice().sort(),'HUD uses the same physical front contract');
  }
 }
});
test('hordes147 : absent/invalid patterns and older front counts preserve the exact historical sequence',()=>{
 const compass=['north','east','south','west'];
 for(let count=1;count<=4;count++)for(let stage=0;stage<3;stage++){
  const n=D.beginNight(18,90,compass.slice(0,count));n.emitted=stage*30;n.pauses=stage;
  const expected=stage===2&&count>2?n.fronts.slice(2):[n.fronts[stage%count]];
  for(const pattern of[undefined,null,'legacy','compact','__proto__','constructor','toString',false,7,{},...(count<4?['pincer','flank']:[])])assert.deepEqual(D.frontGroup(n,pattern),expected);
 }
 assert.equal(D.frontGroup(null,'pincer'),null);
});
function directorFields(g){const s=g.serialize();return structuredClone({version:s.version,wave:s.wave,phase:s.phase,phaseTime:s.phaseTime,spawnTimer:s.spawnTimer,randomState:s.randomState,nextId:s.nextId,fronts:s.fronts,spawnQueue:s.spawnQueue,pendingSpawns:s.pendingSpawns,wavePlan:s.wavePlan,lastWave:s.siege.lastWave,night:s.dayworks.night,zombies:s.zombies});}
function nextSpawn(g,expectedFronts){
 const old=g.zombies.length,pick=g.random.pick;if(expectedFronts)g.random.pick=function(items){assert.deepEqual(items,expectedFronts,'Actual director uses the announced physical fronts');return pick.call(this,items);};
 try{g.updateDirector(g.spawnTimer+.001);}finally{g.random.pick=pick;}
 assert.equal(g.zombies.length,old+1);const z=g.zombies.at(-1);return{id:z.id,kind:z.kind,x:z.x,y:z.y,health:z.health,randomState:g.random.state};
}
for(const[id,wave]of[['pincer',17],['flank',18]])test('hordes147 : real '+id+' warning and every assault echelon resume exact fronts/counters/timer/RNG in save20',()=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.wave=wave;g.phase='calm';g.phaseTime=0;g.updateDirector(.04);
 assert.equal(g.phase,'warning');assert.equal(g.siege.snapshot().lastWave.id,id);assert.equal(g.siege.assaultPattern(),id);
 const warning=g.serialize(),prior=directorFields(g);g.restoreSave(warning);assert.deepEqual(directorFields(g),prior);assert.equal(g.siege.assaultPattern(),id);
 g.phase='assault';g.startAssault();const total=g.dayworks.snapshot().night.total;
 for(let stage=0;stage<3;stage++){
  const threshold=Math.ceil(total*stage/3);while(g.dayworks.snapshot().night.emitted<threshold){g.spawnTimer=0;g.updateDirector(.04);}
  const saved=g.serialize(),before=directorFields(g),stock=structuredClone(g.resources),pattern=g.siege.assaultPattern(),n=saved.dayworks.night;
  assert.equal(pattern,id);assert.equal(n.emitted,threshold);assert.equal(Object.hasOwn(n,'pattern'),false,'Only the existing Siege profile ID is persisted');
  assert.equal(g.remainingAssault,total);assert.equal(n.total-n.emitted,saved.spawnQueue.length+C.spawnCount(saved.pendingSpawns));
  if(stage)assert.ok(g.spawnTimer>=D.RULES.echelonPause);
  g.restoreSave(saved);assert.deepEqual(directorFields(g),before);assert.equal(g.siege.assaultPattern(),id);assert.deepEqual(g.resources,stock);
  const fronts=globalThis.DeadwallCore.Dayworks.frontGroup(n,pattern),sample=globalThis.DeadwallBattlefield.inspect(g.core(),g.zombies,g.world.buildings.values());
  const status=globalThis.DeadwallBattlefield.assaultStatus(sample,total-threshold,g.fronts,n,g.spawnTimer,pattern);
  assert.deepEqual(status.nextFronts.map(f=>f.id).sort(),fronts.slice().sort());
  const stable=directorFields(g),rng=g.random.state;for(let i=0;i<100;i++){assert.equal(g.siege.assaultPattern(),id);globalThis.DeadwallBattlefield.assaultText(globalThis.DeadwallBattlefield.assaultStatus(sample,total-threshold,g.fronts,n,g.spawnTimer,g.siege.assaultPattern()));}
  assert.deepEqual(directorFields(g),stable);assert.equal(g.random.state,rng);
  const a=nextSpawn(g,fronts);g.restoreSave(saved);assert.deepEqual(nextSpawn(g,fronts),a,'First resumed physical spawn and campaign RNG match');
  assert.equal(g.random.state,a.randomState);assert.ok(g.zombies.length<=C.PERFORMANCE_LIMITS.zombies);assert.ok(g.spawnQueue.length<=C.STRATEGY_RULES.spawnBatch);
 }
});
test('hordes147 : existing profiles keep their paid warning plans and historical assault fronts after load',()=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.wave=18;g.phase='calm';g.phaseTime=0;g.updateDirector(.04);
 const warning=g.serialize();
 for(const id of['compact','rush','breakers','hunters','burden','attrition']){
  const saved=structuredClone(warning);saved.siege.lastWave={wave:18,id,bonus:0};
  g.restoreSave(saved);assert.equal(g.siege.assaultPattern(),undefined);assert.deepEqual(g.wavePlan,saved.wavePlan);assert.deepEqual(g.siege.snapshot().lastWave,saved.siege.lastWave);
  const expected=directorFields(g);g.restoreSave(g.serialize());assert.deepEqual(directorFields(g),expected);
  g.phase='assault';g.startAssault();const n=g.dayworks.snapshot().night,fronts=D.frontGroup(n),assault=structuredClone(g.serialize()),before=directorFields(g),a=nextSpawn(g,fronts);
  g.restoreSave(assault);assert.deepEqual(directorFields(g),before);assert.equal(g.siege.assaultPattern(),undefined);assert.deepEqual(nextSpawn(g,fronts),a);
 }
});
test('hordes147 : oversized inherited spawn queues still compact, while the current bounded buffer resumes in order',()=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.wave=2;g.phase='warning';g.prepareWave();const saved=g.serialize();
 const kinds=Object.keys(C.ENEMIES);saved.spawnQueue=Array.from({length:C.STRATEGY_RULES.spawnBatch+1},(_,i)=>kinds[i%kinds.length]);saved.pendingSpawns=C.normalizeSpawnCounts({walker:7,runner:2});
 const expected=C.normalizeSpawnCounts(saved.pendingSpawns,saved.spawnQueue),rng=saved.randomState,timer=saved.spawnTimer;
 g.restoreSave(saved);assert.deepEqual(g.spawnQueue,[]);assert.deepEqual(g.pendingSpawns,expected);assert.equal(g.random.state,rng);assert.equal(g.spawnTimer,timer);
 for(const queue of[[],['runner','walker','runner'],Array(C.STRATEGY_RULES.spawnBatch).fill('walker')]){
  const d=g.serialize();d.spawnQueue=queue;d.pendingSpawns=C.normalizeSpawnCounts({walker:2,runner:3});g.restoreSave(d);
  assert.deepEqual(g.spawnQueue,queue);assert.notEqual(g.spawnQueue,queue);assert.deepEqual(g.pendingSpawns,d.pendingSpawns);
 }
 const before=directorFields(g),invalid=g.serialize();invalid.spawnQueue=['fantasy'];assert.throws(()=>g.restoreSave(invalid));assert.deepEqual(directorFields(g),before);
});
test('hordes147 : new front pressure respects the real simultaneous cap and finite pending budget',()=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.wave=49;g.phase='calm';g.phaseTime=0;g.updateDirector(.04);
 assert.equal(g.siege.assaultPattern(),'pincer');g.phase='assault';g.startAssault();const total=g.wavePlan.total;
 assert.ok(total>C.PERFORMANCE_LIMITS.zombies);let guard=0;
 while(g.zombies.length<C.PERFORMANCE_LIMITS.zombies){g.spawnTimer=0;g.updateDirector(.04);assert.ok(++guard<=C.PERFORMANCE_LIMITS.zombies);}
 const count=g.zombies.length,emitted=g.dayworks.snapshot().night.emitted;g.spawnTimer=0;g.updateDirector(.04);
 assert.equal(g.zombies.length,C.PERFORMANCE_LIMITS.zombies);assert.equal(count,emitted);assert.equal(g.dayworks.snapshot().night.emitted,emitted);assert.equal(g.remainingAssault,total);
 assert.ok(g.spawnQueue.length<=C.STRATEGY_RULES.spawnBatch);assert.equal(Object.keys(g.pendingSpawns).length,Object.keys(C.ENEMIES).length);
 const before=directorFields(g),saved=g.serialize();g.restoreSave(saved);assert.deepEqual(directorFields(g),before);assert.equal(g.remainingAssault,total);
});
