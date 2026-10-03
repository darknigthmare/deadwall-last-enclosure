'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const C=require('../src/core.js'),Save=require('../src/save.js'),Art=require('../src/art.js');
const {bootGame}=require('./helpers/browser.cjs');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const oldKinds=['walker','runner','armored','crawler','howler','breacher','stalker','bloated'];
const additions=['shielded','charger'],allKinds=[...oldKinds,...additions];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const copy=value=>structuredClone(value),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Explicit contact fixtures exhaust existing nodes in place: restore keeps the
// same finite resource history and does not repopulate a deleted node list.
function fresh(){const env=bootGame(),g=env.game;g.startNew('standard','17117');for(const n of g.world.nodes){n.amount=0;n.depleted=true;}g.units=[];g.player.dead=true;g.random.chance=()=>false;g.random.range=(a,b)=>(a+b)/2;g.flow.direction=()=>({x:1,y:0});g.daylight=()=>1;g.weather=0;return env;}
function material(g){const s=copy(g.serialize());delete s.timestamp;return s;}
function spawn(g,kind,x=1000,y=1000){assert.equal(g.spawnZombie(kind),true);const z=g.zombies.at(-1);Object.assign(z,{x,y,lastX:x,lastY:y,facing:0});return z;}
function add(g,type,gx,gy,rotation=0){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,rotation,1);g.world.add(b);return b;}
function bullet(g,z,angle,owner='friendly',head=false){
 const start={x:z.x+Math.cos(angle)*70,y:z.y+Math.sin(angle)*70};g.fireFriendly(start.x,start.y,angle+Math.PI,40,150,'#ffe0a0');
 const p=g.projectiles.at(-1);p.owner=owner;p.headshotChance=head?1:0;p.headshotMultiplier=1.75;
 g.random.chance=chance=>head&&chance===1;g.rebuildBuckets();const before=z.health;g.updateProjectiles(.08);return before-z.health;
}

test('infectés148 : les huit anciens profils et 72 plans avant vague9 restent identiques aux octets147',()=>{
 assert.deepEqual(Object.keys(C.ENEMIES),allKinds);
 assert.equal(hash(Object.fromEntries(oldKinds.map(k=>[k,C.ENEMIES[k]]))),'2fd246366a6b87ddcd930b016d0132dc72e39f9d40102ae136a81e431ea4b8e5');
 const plans=[];for(const difficulty of Object.values(C.DIFFICULTIES))for(const signature of[0,360,1000])for(let wave=1;wave<=8;wave++){
  const p=C.wavePlan(wave,difficulty,signature);for(const k of additions)assert.equal(p.composition[k],0);
  plans.push({...p,composition:Object.fromEntries(oldKinds.map(k=>[k,p.composition[k]]))});
 }
 assert.equal(hash(plans),'fe7ab8269ba57c15739b185200b266a260b07118ddc7a9e7024e8499fb2872b2');
});
test('infectés148 : seuils9/11, poids bornés, total et cadence conservés dans tous les directeurs',()=>{
 assert.equal(C.ENEMIES.shielded.health,90);assert.equal(C.ENEMIES.charger.health,64);
 for(const difficulty of Object.values(C.DIFFICULTIES))for(const seed of[0,17117,0xffffffff])for(const wave of[1,8,9,10,11,13,49,100,1000000]){
  const base=C.wavePlan(wave,difficulty,360),a=C.Siege.adaptPlan(base,C.ENEMIES,seed);
  const total=Math.max(8,Math.floor((10+wave*5+wave**1.62*2.35)*difficulty.enemyCount*1.8));
  assert.equal(base.total,total);assert.equal(C.spawnCount(base.composition),total);assert.equal(C.spawnCount(a.plan.composition),total);
  assert.equal(base.spawnInterval,C.clamp(.52-wave*.012,.07,.52));assert.deepEqual(a,C.Siege.adaptPlan(base,C.ENEMIES,seed));
  for(const kind of additions){const d=C.ENEMIES[kind];if(wave<d.unlockWave){assert.equal(base.composition[kind],0);assert.equal(a.plan.composition[kind],0);}else{assert.ok(base.composition[kind]>0);assert.ok(base.composition[kind]<=Math.ceil(total*C.ENEMY_RULES.waveWeights[kind].maximum));}}
 }
 assert.equal(C.PERFORMANCE_LIMITS.zombies,720);assert.equal(C.STRATEGY_RULES.spawnBatch,64);
});
test('bouclier : protection pure dans le seul arc physique110°, orientations et limites incluses',()=>{
 const {game:g}=fresh(),z=spawn(g,'shielded'),r=C.ENEMY_RULES.shield,prior=material(g),rng=g.random.state;
 for(const facing of[-Math.PI,-1.3,0,1.8,Math.PI]){z.facing=facing;for(const [offset,scale]of[[0,.35],[r.halfAngle-1e-6,.35],[-r.halfAngle+1e-6,.35],[r.halfAngle+1e-6,1],[-r.halfAngle-1e-6,1],[Math.PI,1],[Math.PI/2,1]]){
  const a=facing+offset;near(g.zombieBulletDamage(z,40,{x:z.x+Math.cos(a)*70,y:z.y+Math.sin(a)*70}),40*scale);
 }}
 z.facing=0;near(g.zombieBulletDamage(z,40,{x:z.x,y:z.y}),40);assert.equal(g.random.state,rng);
 const after=material(g);after.zombies[0].facing=prior.zombies[0].facing;assert.deepEqual(after,prior);
});
test('bouclier : impacts balistiques réels frontal/flanc/dos, tirs alliés et headshot coûtent leurs balles',()=>{
 for(const [angle,expected,owner,head]of[[0,14,'friendly',false],[Math.PI/2,40,'friendly',false],[Math.PI,40,'player',false],[0,24.5,'player',true],[Math.PI,70,'player',true]]){
  const {game:g}=fresh(),z=spawn(g,'shielded');near(bullet(g,z,angle,owner,head),expected);assert.equal(g.projectiles.length,0);
  assert.equal(g.stats.headshots,head?1:0);assert.equal(z.shieldImpact>0,angle===0);assert.ok(g.particles.every(p=>p.kind===(angle===0?'spark':'blood')));
 }
});
test('bouclier : mêlée et hérisson conservent leurs dégâts et sa dépouille reste ordinaire',()=>{
 const {game:g}=fresh(),z=spawn(g,'shielded');g.player.dead=false;Object.assign(g.player,{x:z.x+30,y:z.y,facing:Math.PI});g.rebuildBuckets();const health=z.health;g.melee();near(health-z.health,36);
 g.player.dead=true;g.zombies=[];const trap=add(g,'spikes',70,70),caught=spawn(g,'shielded',trap.left-20,trap.y),before=caught.health;g.updateZombies(.1);near(before-caught.health,trap.def.trapDamage*.1);
 const wall=add(g,'woodWall',73,70),corpse=spawn(g,'shielded',wall.left-15,wall.y);g.killZombie(corpse,false);near(wall.corpseLoad,1);const count=g.stats.kills;g.killZombie(corpse,false);assert.equal(g.stats.kills,count);
});
test('fonceur : préparation immobile, ruée droite sans poursuite, fatigue réelle puis retour prêt',()=>{
 const {game:g}=fresh(),z=spawn(g,'charger'),r=C.ENEMY_RULES.charge,start={x:z.x,y:z.y};
 g.updateZombies(.04);assert.equal(z.charge.stage,'windup');assert.deepEqual({x:z.x,y:z.y},start);
 for(let i=0;i<16;i++)g.updateZombies(.04);assert.equal(z.charge.stage,'windup');assert.deepEqual({x:z.x,y:z.y},start);
 g.updateZombies(.04);assert.equal(z.charge.stage,'rush');near(z.x-start.x,C.ENEMIES.charger.speed*r.rushSpeed*.04);
 const rush={x:z.x,y:z.y};g.flow.direction=()=>({x:0,y:1});g.updateZombies(.04);assert.ok(z.x>rush.x);near(z.y,rush.y);
 for(let i=0;i<18;i++)g.updateZombies(.04);assert.equal(z.charge.stage,'recover');
 const tired={x:z.x,y:z.y};g.updateZombies(.04);near(z.x,tired.x);near(z.y-tired.y,C.ENEMIES.charger.speed*r.recoverySpeed*.04);
 for(let i=0;i<76;i++)g.updateZombies(.04);assert.ok(['ready','windup'].includes(z.charge.stage));
});
test('fonceur : la ruée respecte les portes auto/fermées et une porte libre laisse traverser',()=>{
 for(const mode of['auto','closed','open']){const {game:g}=fresh(),gate=add(g,'gate',40,40,1),z=spawn(g,'charger',gate.left-30,gate.y);gate.gateMode=mode;z.charge={stage:'rush',timer:.7,angle:0};z.facing=0;
  const before=gate.health;for(let i=0;i<24;i++){const p={x:z.x,y:z.y};g.updateZombies(.04);assert.ok(C.dist(p,z)<=C.ENEMIES.charger.speed*2.2*.04+1e-7);assert.equal(g.hostilePositionClear(z,z.x,z.y),true);}
  if(mode==='open'){assert.ok(z.x>gate.right);assert.equal(gate.health,before);}else{assert.ok(z.x+z.radius<=gate.left);assert.equal(z.charge.stage,'recover');assert.ok(gate.health<before);}
 }
});
test('fonceur : une porte refermée pendant sa préparation annule sans traverser ni attaque à distance',()=>{
 const {game:g}=fresh(),gate=add(g,'gate',40,40,1),z=spawn(g,'charger',gate.left-27,gate.y);gate.gateMode='open';g.updateZombies(.04);assert.equal(z.charge.stage,'windup');gate.gateMode='closed';const before={x:z.x,y:z.y},health=gate.health;
 g.updateZombies(.04);assert.equal(z.charge.stage,'recover');assert.equal(g.hostilePositionClear(z,z.x,z.y),true);assert.ok(z.x+z.radius<=gate.left);assert.ok(C.dist(before,z)<=C.ENEMIES.charger.speed*.55*.04+1e-7);assert.equal(gate.health,health);
});
test('fonceur : l’empreinte physique interdit les coins et les gros pas de simulation',()=>{
 const {game:g}=fresh(),wall=add(g,'woodWall',40,40),z=spawn(g,'charger',wall.left-50,wall.top-5);z.charge={stage:'rush',timer:.7,angle:0};
 g.updateZombies(.5);assert.equal(z.charge.stage,'recover');assert.equal(g.hostilePositionClear(z,z.x,z.y),true);assert.ok(z.x+z.radius<=wall.left);
});
test('fonceur : coups et entraves interrompent préparation/ruée, fatigue et ralentissement ne sont pas masqués',()=>{
 for(const stage of['windup','rush']){const {game:g}=fresh(),z=spawn(g,'charger');z.charge={stage,timer:.4,angle:0};z.stagger=2.5;z.attackCooldown=2.5;const x=z.x;
  g.updateZombies(.04);assert.equal(z.charge.stage,'recover');near(z.x-x,C.ENEMIES.charger.speed*.55*.35*.04);near(z.attackCooldown,2.46);near(z.stagger,2.46);
 }
});
test('fonceur : son contact conserve les dégâts/cadence ordinaires contre personnes et structures',()=>{
 const {game:g}=fresh(),z=spawn(g,'charger');z.charge={stage:'rush',timer:.7,angle:0};g.player.dead=false;g.player.x=z.x+25;g.player.y=z.y;const hp=g.player.health;g.updateZombies(.04);near(hp-g.player.health,13);near(z.attackCooldown,1/.9);assert.equal(z.charge.stage,'recover');
 g.player.dead=true;g.zombies=[];const wall=add(g,'woodWall',70,70),other=spawn(g,'charger',wall.left-20,wall.y),health=wall.health;other.charge={stage:'rush',timer:.7,angle:0};g.updateZombies(.04);near(health-wall.health,13);
});
test('reprise148 : anciens huit profils/plans/comptes gardés, deux compteurs absents deviennent0 sans tirage',()=>{
 const {game:g}=fresh();g.player.dead=false;g.wave=8;g.phase='assault';g.wavePlan=C.wavePlan(8);g.pendingSpawns=C.normalizeSpawnCounts({walker:5,runner:2});g.spawnQueue=['runner','walker'];g.spawnTimer=.19;
 for(const kind of oldKinds)spawn(g,kind);const saved=copy(g.serialize());for(const kind of additions){delete saved.pendingSpawns[kind];delete saved.wavePlan.composition[kind];}
 const old=copy(saved),rng=saved.randomState;g.restoreSave(saved);const restored=g.serialize();assert.equal(g.random.state,rng);assert.equal(restored.spawnTimer,.19);assert.deepEqual(restored.spawnQueue,old.spawnQueue);assert.deepEqual(restored.zombies,old.zombies);
 for(const kind of additions){assert.equal(restored.pendingSpawns[kind],0);assert.equal(restored.wavePlan.composition[kind],0);}
 for(const kind of oldKinds){assert.equal(restored.pendingSpawns[kind],old.pendingSpawns[kind]);assert.equal(restored.wavePlan.composition[kind],old.wavePlan.composition[kind]);}assert.equal(restored.wavePlan.total,old.wavePlan.total);
});
test('reprise148 : orientation, entrave, agitation et chaque phase de ruée restaurées exactement',()=>{
 for(const [stage,timer]of[['ready',0],['windup',.31],['rush',.42],['recover',2.7]]){const {game:g}=fresh();g.player.dead=false;g.wave=12;g.phase='assault';g.wavePlan=C.wavePlan(12);g.pendingSpawns=C.normalizeSpawnCounts({charger:7,shielded:5});g.spawnQueue=['shielded','charger'];g.spawnTimer=.27;
  const z=spawn(g,'charger'),shield=spawn(g,'shielded',1200,1000);z.charge={stage,timer,angle:.6};Object.assign(z,{facing:.6,stagger:.18,rage:1.2,attackCooldown:.7});Object.assign(shield,{facing:-1.3,stagger:.1,rage:.8});
  const saved=copy(g.serialize()),rng=g.random.state;g.restoreSave(saved);const restored=g.serialize();assert.deepEqual(restored.zombies,saved.zombies);assert.deepEqual(restored.wavePlan,saved.wavePlan);assert.deepEqual(restored.pendingSpawns,saved.pendingSpawns);assert.deepEqual(restored.spawnQueue,saved.spawnQueue);assert.equal(g.random.state,rng);near(g.spawnTimer,.27);assert.notEqual(g.zombies[0].charge,saved.zombies[0].charge);
 }
});
test('reprise148 : prochaine avancée de ruée est la même, sans réorientation ou RNG ajoutée au chargement',()=>{
 const {game:g}=fresh();g.player.dead=false;g.player.x=300;g.player.y=300;g.wave=12;const z=spawn(g,'charger');z.charge={stage:'rush',timer:.4,angle:.3};z.facing=.3;const saved=copy(g.serialize());g.updateZombies(.04);const expected=copy(g.serialize().zombies);g.restoreSave(saved);g.flow.direction=()=>({x:-1,y:0});g.random.chance=()=>false;g.daylight=()=>1;g.weather=0;g.updateZombies(.04);assert.deepEqual(g.serialize().zombies,expected);
});
test('directeur148 : vraies alertes9/11 et prochain nouveau contact physique reprennent le plan tiré, le buffer et le RNG',()=>{
 const {g}=bootDocument134();
 function director(){const s=g.serialize();return copy({version:s.version,wave:s.wave,phase:s.phase,phaseTime:s.phaseTime,wavePlan:s.wavePlan,spawnQueue:s.spawnQueue,pendingSpawns:s.pendingSpawns,spawnTimer:s.spawnTimer,fronts:s.fronts,randomState:s.randomState,nextId:s.nextId,lastWave:s.siege.lastWave,night:s.dayworks.night,zombies:s.zombies,resources:s.resources});}
 // The requested night is an explicit attained-wave fixture. Alert preparation,
 // seeded buffer draws and physical emissions use the actual G7 controllers.
 for(const [wave,kind]of[[9,'shielded'],[11,'charger']]){
  g.startNew('standard','17117');g.campaignIntro132.skip();g.wave=wave;g.phase='calm';g.phaseTime=0;
  const real=globalThis.DeadwallCore,base=real.wavePlan(wave,g.difficulty,g.signature),adapted=real.Siege.adaptPlan(base,real.ENEMIES,g.world.seed);g.updateDirector(.04);
  assert.equal(g.phase,'warning');assert.ok(g.wavePlan.composition[kind]>0);assert.equal(g.wavePlan.total,base.total);assert.deepEqual(g.wavePlan,adapted.plan);assert.equal(g.siege.snapshot().lastWave.id,adapted.profile.id);
  assert.equal(g.siege.snapshot().lastWave.wave,wave);const warning=copy(g.serialize()),prepared=director();g.restoreSave(warning);assert.deepEqual(director(),prepared);
  g.phaseTime=0;g.updateDirector(.04);assert.equal(g.phase,'assault');let found=false;
  function nextContact(){const count=g.zombies.length;let ticks=0;while(g.zombies.length===count){g.updateDirector(.04);assert.ok(++ticks<1000,'A finite echelon pause must end');}assert.equal(g.zombies.length,count+1);return g.zombies.at(-1);}
  // Refilling the bounded buffer can draw and immediately emit its newest
  // entry. Observe actual arrivals rather than predicting from its old tail.
  for(let guard=0;guard<g.wavePlan.total&&!found;guard++){
   const saved=copy(g.serialize()),before=director(),z=nextContact();
   if(z.kind!==kind)continue;found=true;const after=director();g.restoreSave(saved);assert.deepEqual(director(),before);assert.equal(nextContact().kind,kind);assert.deepEqual(director(),after);
  }
  assert.equal(found,true,'The finite prepared budget must emit the announced profile');
  assert.ok(g.spawnQueue.length<=C.STRATEGY_RULES.spawnBatch);assert.equal(g.remainingAssault,g.wavePlan.total);
 }
});
test('reprise148 : état absent a un défaut sûr, données de ruée invalides refusées atomiquement',()=>{
 const {game:g}=fresh();g.player.dead=false;g.wave=12;spawn(g,'charger');spawn(g,'shielded',1200,1000);const raw=copy(g.serialize());for(const z of raw.zombies){delete z.facing;delete z.stagger;delete z.rage;delete z.charge;}
 const normalized=Save.validate(raw);assert.equal(normalized.zombies[0].charge.stage,'ready');assert.equal(normalized.zombies[0].charge.timer,0);assert.ok(Number.isFinite(normalized.zombies[0].facing));g.restoreSave(raw);
 const valid=copy(g.serialize()),before=material(g);for(const mutate of[z=>z.facing=Infinity,z=>z.facing='0',z=>z.stagger=-1,z=>z.rage=NaN,z=>z.charge=null,z=>z.charge.stage='constructor',z=>z.charge.timer=.1,z=>z.charge.angle=4,z=>delete z.charge.timer]){
  const invalid=copy(valid);mutate(invalid.zombies[0]);assert.throws(()=>g.restoreSave(invalid),/Sauvegarde invalide/);assert.deepEqual(material(g),before);
 }
});
test('présentation148 : mêmes atlas licenciés, bouclier orienté et annonce de préparation sans mutation',async()=>{
 assert.deepEqual(Art.ACTORS.shielded,Art.ACTORS.armored);assert.deepEqual(Art.ACTORS.charger,Art.ACTORS.runner);
 const {game:g}=fresh(),shield=spawn(g,'shielded'),charger=spawn(g,'charger',1200,1000),oldImage=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};let a;try{a=Art.create();await a.ready;}finally{globalThis.Image=oldImage;}a.images.infected={};const before=material(g),rng=g.random.state,context=g.ctx;
 let shieldShapes=0,windupShapes=0;const ctx=new Proxy(context,{get(target,key){if(key==='fillRect')return(...args)=>{if(args.join(',')==='15,-7,3,14')shieldShapes++;};if(key==='moveTo')return(...args)=>{if(args.join(',')==='22,-7')windupShapes++;};return target[key];}});
 a.drawActor(ctx,shield,'shielded',0,true,false);charger.charge.stage='windup';charger.charge.timer=.3;a.drawActor(ctx,charger,'charger',0,true,false);charger.charge.stage='ready';charger.charge.timer=0;
 assert.ok(shieldShapes>0);assert.ok(windupShapes>0);assert.deepEqual(material(g),before);assert.equal(g.random.state,rng);
});
test('charge148 : 720 contacts gardent un coût spatial borné, sans scans d’alliés ou budget supplémentaire',()=>{
 const {game:g}=fresh();for(let i=0;i<720;i++)spawn(g,'charger',200+(i%24)*110,200+Math.floor(i/24)*100);g.phase='assault';g.pendingSpawns=C.normalizeSpawnCounts({charger:1});g.updateDirector(.04);assert.equal(g.zombies.length,720);assert.equal(C.spawnCount(g.pendingSpawns),1);
 let queries=0;const clear=g.hostilePositionClear.bind(g);g.hostilePositionClear=(...args)=>{queries++;return clear(...args);};const start=performance.now();for(let i=0;i<45;i++)g.updateZombies(.04);const ms=performance.now()-start;
 assert.ok(queries<=720*45*7,`${queries} excessive local probes`);assert.equal(g.zombies.length,720);assert.ok(g.zombies.every(z=>Number.isFinite(z.x)&&Number.isFinite(z.y)&&Number.isFinite(z.charge.timer)));assert.equal(g.units.length,0);
 process.stdout.write(JSON.stringify({fixture:'720 charger contacts; ordinary zombie updates with deterministic crowd-separation disabled equally',steps:45,secondsSimulated:1.8,localCollisionQueries:queries,cpuMs:ms})+'\n');
});
