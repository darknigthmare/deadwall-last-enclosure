'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fresh(){const env=bootDocument134(),g=env.g;g.startNew('standard','17117');g.campaignIntro132.skip();return env;}
function assault(g,wave=49){g.wave=wave;g.phase='calm';g.phaseTime=0;g.updateDirector(.04);g.phase='assault';g.startAssault();}
function fill(g){const C=globalThis.DeadwallCore;let steps=0;while(g.zombies.length<C.PERFORMANCE_LIMITS.zombies){g.updateDirector(.04);assert.ok(++steps<100000);}return steps;}
function remove(g,count){for(const z of g.zombies.slice(0,count))g.killZombie(z,false);g.zombies=g.zombies.filter(z=>!z.dead);}
function director(g){return structuredClone({plan:g.wavePlan,queue:g.spawnQueue,pending:g.pendingSpawns,timer:g.spawnTimer,rng:g.random.state,nextId:g.nextId,night:g.dayworks.snapshot().night,zombies:g.zombies.map(z=>[z.id,z.kind,z.x,z.y,z.health])});}
function rawState(g){const raw=structuredClone(g.serialize());delete raw.timestamp;return raw;}

test('survival151: a full attacker cap discards spawn debt and resumes the paid plan at its interval',()=>{
 const {g}=fresh(),C=globalThis.DeadwallCore;assault(g);fill(g);const total=g.wavePlan.total,emitted=g.dayworks.snapshot().night.emitted,rng=g.random.state;
 assert.equal(emitted,C.PERFORMANCE_LIMITS.zombies);assert.ok(total>emitted+120);
 for(let i=0;i<1500;i++)g.updateDirector(.04);
 assert.equal(g.spawnTimer,0);assert.equal(g.dayworks.snapshot().night.emitted,emitted);assert.equal(g.remainingAssault,total);assert.equal(g.random.state,rng);
 const saturated=g.serialize(),before=director(g);g.restoreSave(saturated);assert.deepEqual(director(g),before);
 remove(g,120);g.updateDirector(.04);assert.equal(g.dayworks.snapshot().night.emitted,emitted+1);assert.equal(g.zombies.length,emitted-119);
 g.updateDirector(.01);assert.equal(g.dayworks.snapshot().night.emitted,emitted+1,'A newly available slot does not erase the cadence');
 assert.ok(g.spawnTimer>0);assert.ok(g.spawnQueue.length<=C.STRATEGY_RULES.spawnBatch);assert.equal(g.remainingAssault,total-120);
 // A historic saturated save may already contain overdue time. Its first full-cap tick normalizes the debt.
 saturated.spawnTimer=-60;g.restoreSave(saturated);g.updateDirector(.04);assert.equal(g.spawnTimer,0);assert.equal(g.dayworks.snapshot().night.emitted,emitted);
});

test('survival151: saturation preserves echelon pauses and resumed emissions exhaust the exact budget once',()=>{
 const {g}=fresh(),C=globalThis.DeadwallCore;assault(g);fill(g);g.spawnTimer=C.Dayworks.RULES.echelonPause;
 g.updateDirector(.04);assert.ok(Math.abs(g.spawnTimer-(C.Dayworks.RULES.echelonPause-.04))<1e-8,'A positive arrival pause continues while capacity is full');
 for(let i=0;i<1500;i++)g.updateDirector(.04);remove(g,120);
 const saved=structuredClone(g.serialize()),expectedTotal=g.wavePlan.total,initial=g.dayworks.snapshot().night.emitted;
 function finish(){const times=[];let step=0,last=initial,pauses=g.dayworks.snapshot().night.pauses,pauseAt=null;remove(g,g.zombies.length);
  while(g.phase==='assault'){
   g.updateDirector(.04);step++;const night=g.dayworks.snapshot().night;
   assert.ok(g.zombies.length<=C.PERFORMANCE_LIMITS.zombies);assert.ok(g.spawnQueue.length<=C.STRATEGY_RULES.spawnBatch);
   if(night.emitted!==last){assert.equal(night.emitted,last+1);if(pauseAt!==null){assert.ok((step-pauseAt)*.04>=C.Dayworks.RULES.echelonPause-.04);pauseAt=null;}times.push([step,night.emitted,g.zombies[0]?.kind,g.random.state]);last=night.emitted;}
   if(night.pauses!==pauses){pauses=night.pauses;pauseAt=step;}
   remove(g,g.zombies.length);assert.ok(step<100000);
  }
  assert.equal(last,expectedTotal);assert.equal(g.spawnQueue.length,0);assert.equal(C.spawnCount(g.pendingSpawns),0);assert.equal(g.remainingAssault,0);assert.equal(g.phase,'aftermath');assert.equal(g.stats.wavesSurvived,1);
  return {times,final:director(g),insight:g.research.insight};
 }
 const first=finish();g.restoreSave(saved);const resumed=finish();assert.deepEqual(resumed,first,'The same saved timer, slots, RNG and contact budget produce the same next emission times and composition');
 const insight=g.research.insight;g.updateDirector(.04);assert.equal(g.stats.wavesSurvived,1);assert.equal(g.research.insight,insight);
});

function fatalFrame(region){
 const {g}=fresh(),raw=g.serialize(),light=g.essentials.targets().find(t=>t.family==='light');raw.essentials.jobs[light.id]={stage:'delivered'};raw.essentials.belt.light=1;raw.frontier.seen=[...new Set([...raw.frontier.seen,light.poi])];g.restoreSave(raw);assert.equal(g.essentials.use('light').ok,true);
 const core=g.core();g.world.nodes.forEach(n=>n.depleted=true);g.phase='assault';g.phaseTime=999;g.spawnQueue=[];g.pendingSpawns={};g.spawnTimer=999;g.economyTimer=.24;
 if(region){Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);}else Object.assign(g.player,{x:2280,y:1800,facing:0});
 const worker=g.units[0];g.units=[worker];Object.assign(worker,{x:2300,y:1800,health:1,think:999,state:'idle',carry:0});
 assert.equal(g.spawnZombie('walker'),true);assert.equal(g.spawnZombie('walker'),true);const [killer,later]=g.zombies;
 Object.assign(killer,{x:core.left-killer.radius-1,y:core.y,attackCooldown:0});Object.assign(later,{x:worker.x+20,y:worker.y,attackCooldown:0});core.health=1;g.rebuildBuckets();
 if(!region){later.health=1;g.player.shootCooldown=0;g.shootPlayer();assert.equal(g.projectiles.length,1);g.exploration125.wildNext=.001;}
 else{g.player.health=50;Object.assign(g.player.carry,globalThis.DeadwallCore.FieldSupplies.RULES.healCost);const care=g.fieldSupplies.begin('heal');assert.equal(care.ok,true,care.reason||'A real field-care task is active before the local core falls');}
 const observe=()=>structuredClone({workerHealth:worker.health,workerDead:worker.dead,unitsLost:g.stats.unitsLost,laterCooldown:later.attackCooldown,food:g.resources.food,playerHealth:g.player.health,bag:g.player.carry,kills:g.stats.kills,health:later.health,light:g.essentials.snapshot().effects,atlas:g.fieldAtlas.snapshot(),chronicles:g.chronicles131.snapshot(),care:g.fieldSupplies.snapshot(),careBusy:g.fieldSupplies.busy(),wildNext:g.exploration125.wildNext,wildHordes:g.exploration125.wildHordes,rng:g.random.state,raw:rawState(g),projectiles:g.projectiles.map(p=>({x:p.x,y:p.y,travelled:p.travelled,dead:p.dead})),elapsed:g.elapsed});
 let atDefeat;const original=g.triggerGameOver.bind(g);g.triggerGameOver=(...args)=>{const result=original(...args);atDefeat=observe();return result;};
 g.loop(g.lastFrame+40);assert.equal(g.gameOver,true);assert.equal(atDefeat.workerHealth,1);assert.equal(atDefeat.workerDead,false);assert.equal(atDefeat.unitsLost,0);assert.deepEqual(observe(),atDefeat,'No later actor, projectile, upkeep or portable effect advances after defeat is recorded');
 assert.equal(g.profile.get().recentRuns.find(r=>r.runId===g.runId).kills,g.stats.kills);assert.equal(g.citadel.snapshot().history.at(-1).metrics.unitsLost,g.stats.unitsLost);
 for(let i=0;i<30;i++)g.loop(g.lastFrame+40);assert.deepEqual(observe(),atDefeat);g.update(.04);assert.deepEqual(observe(),atDefeat,'Direct update cannot restart an ended campaign');
}
for(const region of [false,true])test('survival151: fatal frame freezes later damage, fired projectiles, resources and outer effects '+(region?'while outside D-17':'at home'),()=>fatalFrame(region));

test('survival151: a real generator explosion ignites two structures and fatal core fire stops the later fire',()=>{
 const {g}=fresh(),C=globalThis.DeadwallCore,core=g.core();g.phaseTime=999;g.units=[];
 // Prepared completed, legally separated buildings. Their real destruction adapter ignites the two neighboring fires.
 const generator=new(core.constructor)(g.nextId++,'generator',core.gx+4,core.gy,0,1),house=new(core.constructor)(g.nextId++,'house',core.gx+4,core.gy+2,0,1);
 for(const b of [generator,house]){assert.equal(g.world.placement(b.def,b.gx,b.gy,b.rotation).valid,true);g.world.add(b);}
 g.refreshMetrics(true);g.damageBuilding(generator,generator.health);
 assert.equal(generator.dead,true);assert.deepEqual(g.siege.snapshot().fires.map(f=>f.id),[core.id,house.id]);
 const ignitions=g.siege.snapshot().stats.ignitions;g.destroyBuilding(generator);g.damageBuilding(generator,100);assert.equal(g.siege.snapshot().stats.ignitions,ignitions,'An already destroyed generator cannot ignite a second blast');core.health=.001;
 const houseBefore={health:house.health,fire:structuredClone(g.siege.snapshot().fires.find(f=>f.id===house.id))};
 const observe=()=>structuredClone({resources:g.resources,stats:g.stats,house:{health:house.health,fire:g.siege.snapshot().fires.find(f=>f.id===house.id)},siege:g.siege.snapshot(),atlas:g.fieldAtlas.snapshot(),chronicles:g.chronicles131.snapshot(),wildNext:g.exploration125.wildNext,rng:g.random.state,raw:rawState(g)});
 let atDefeat;const original=g.triggerGameOver.bind(g);g.triggerGameOver=(...args)=>{const result=original(...args);atDefeat=observe();return result;};
 g.loop(g.lastFrame+40);assert.equal(g.gameOver,true);assert.deepEqual(observe(),atDefeat,'The fire callback stops all later fire work and outer simulation after recording defeat');
 assert.deepEqual(observe().house,houseBefore,'The second active fire neither burns, ages nor spreads after the core fire ends the campaign');
 for(let i=0;i<30;i++)g.loop(g.lastFrame+40);assert.deepEqual(observe(),atDefeat);
 const ended=g.profile.get().recentRuns.find(r=>r.runId===g.runId);assert.equal(ended.ended,true);assert.equal(ended.kills,g.stats.kills);assert.equal(g.citadel.snapshot().history.length,0,'A fire during calm does not create a fictitious night report');
 const e=new C.Siege.Engine(),a={id:1,type:'house',health:1000,completed:true,dead:false},b={id:2,type:'house',health:1000,completed:true,dead:false};e.ignite(a,'blast');e.ignite(b,'blast');let calls=0;
 e.step(.04,{buildings:[a,b],resources:{fuel:0},running:true,damage:()=>{calls++;}});assert.equal(calls,2,'Legacy undefined-return damage callbacks still process every fire');
});

test('survival151: destroying an unfinished machine does not ignite its neighbors',()=>{
 const {g}=fresh(),core=g.core(),generator=new(core.constructor)(g.nextId++,'generator',core.gx+4,core.gy,0,.5);
 assert.equal(g.world.placement(generator.def,generator.gx,generator.gy,generator.rotation).valid,true);g.world.add(generator);g.damageBuilding(generator,generator.health);
 assert.equal(generator.dead,true);assert.deepEqual(g.siege.snapshot().fires,[]);assert.equal(g.siege.snapshot().stats.ignitions,0);
});
