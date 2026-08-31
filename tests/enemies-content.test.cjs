'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const Save = require('../src/save.js');
const { bootGame } = require('./helpers/browser.cjs');

const originalKinds = ['walker', 'runner', 'armored', 'crawler', 'howler'];
const newKinds = ['breacher', 'stalker', 'bloated'];
const kinds = [...originalKinds, ...newKinds];
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
function fresh() {
  const env = bootGame(); env.game.startNew('standard'); env.game.world.nodes = [];
  env.game.player.dead = true; env.game.random.chance = () => false;
  return env;
}
function add(game, type, gx, gy, rotation = 0) {
  const building = new (game.core().constructor)(game.nextId++, type, gx, gy, rotation, 1);
  game.world.add(building); return building;
}
function spawn(game, kind, x = C.world(74), y = C.world(70)) {
  assert.equal(game.spawnZombie(kind), true);
  const zombie = game.zombies.at(-1); zombie.x = zombie.lastX = x; zombie.y = zombie.lastY = y;
  zombie.huntThink = 0; zombie.howl = 20; return zombie;
}
function gateBarrier(game) {
  for (let y = 0; y < C.WORLD_TILES; y++) if (y !== 70 && y !== 71) add(game, 'woodWall', 70, y);
  return add(game, 'gate', 70, 70, 1);
}

test('infectés : huit profils documentés, les cinq historiques gardent leurs statistiques', () => {
  assert.deepEqual(Object.keys(C.ENEMIES), kinds);
  const previous = [[72,35,16,.75,11,1],[54,72,12,1.2,10,2],[175,27,25,.6,13,4],[44,55,9,1.55,8,5],[110,43,14,.9,12,7]];
  originalKinds.forEach((kind,index) => assert.deepEqual(['health','speed','damage','attackRate','radius','unlockWave'].map(field=>C.ENEMIES[kind][field]),previous[index]));
  for (const [kind, profile] of Object.entries(C.ENEMIES)) {
    assert.equal(profile.id, kind); assert.ok(profile.description.length > 30); assert.ok(profile.weakness.length > 30);
    assert.ok(profile.health <= C.ENEMIES.armored.health); assert.ok(profile.structureDamage >= 1); assert.ok(profile.corpseLoad > 0);
    assert.equal('explosive' in profile, false); assert.equal('explosion' in profile, false);
  }
  assert.equal(C.ENEMIES.breacher.name, 'Briseur'); assert.equal(C.ENEMIES.stalker.name, 'Traqueur'); assert.equal(C.ENEMIES.bloated.name, 'Engorgé');
});

test('hordes : introductions 3/6/8, total historique strict et huit compteurs bornés jusqu’à la vague 1000000', () => {
  for (const difficulty of Object.values(C.DIFFICULTIES)) for (const signature of [0, 360, 1000]) {
    for (const wave of [1,2,3,4,5,6,7,8,20,100,1000,1000000]) {
      const plan = C.wavePlan(wave, difficulty, signature);
      const expected = Math.max(8,Math.floor((10+wave*5+wave**1.62*2.35)*difficulty.enemyCount*(1+C.clamp(signature/360,0,.8))));
      assert.equal(plan.total, expected); assert.equal(C.spawnCount(plan.composition), expected);
      assert.deepEqual(Object.keys(plan.composition), kinds);
      assert.ok(plan.composition.walker >= plan.total*(1-C.ENEMY_RULES.specialShare)-1e-6);
      for (const [kind, count] of Object.entries(plan.composition)) {
        assert.ok(Number.isSafeInteger(count) && count >= 0);
        if (wave < C.ENEMIES[kind].unlockWave) assert.equal(count, 0, `${kind} avant déblocage`);
        if (wave === C.ENEMIES[kind].unlockWave) assert.ok(count > 0, `${kind} absent de sa première vague ${difficulty.id}`);
      }
      for (const kind of newKinds) assert.ok(plan.composition[kind] <= Math.ceil(plan.total*C.ENEMY_RULES.waveWeights[kind].maximum));
    }
  }
});

test('hordes : les vagues 1 et 2 conservent exactement leurs anciens profils et effectifs', () => {
  for (const wave of [1,2]) {
    const plan=C.wavePlan(wave),runner=wave===2?Math.floor(plan.total*(.08+wave*.018)):0;
    assert.deepEqual(plan.composition,{walker:plan.total-runner,runner,armored:0,crawler:0,howler:0,breacher:0,stalker:0,bloated:0});
  }
});

test('infectés : aucune nouvelle santé de boss, même en Brutal à très longue durée', () => {
  const {game}=fresh(); game.difficulty=C.DIFFICULTIES.brutal; game.wave=1000000;
  for(const kind of kinds){const z=spawn(game,kind);near(z.maxHealth,C.ENEMIES[kind].health*C.DIFFICULTIES.brutal.enemyHealth*1.34);}
  const armored=game.zombies.find(z=>z.kind==='armored');
  for(const zombie of game.zombies) assert.ok(zombie.maxHealth <= armored.maxHealth);
});

test('hordes : huit compteurs tirés sans perte et sans accepter un identifiant inconnu', () => {
  const counts=C.normalizeSpawnCounts(Object.fromEntries(kinds.map((kind,i)=>[kind,i+1])),['breacher','bloated','constructor']);
  const expected={...counts}, actual=C.normalizeSpawnCounts();
  while(C.spawnCount(counts)){const kind=C.takeSpawnKind(counts,.731);assert.ok(kinds.includes(kind));actual[kind]++;}
  assert.deepEqual(actual,expected);assert.equal(C.spawnCount(counts),0);assert.equal(C.takeSpawnKind(counts,1),null);
  const {game}=fresh(),nextId=game.nextId;
  for(const kind of ['inconnu','constructor','__proto__',null])assert.equal(game.spawnZombie(kind),false);
  assert.equal(game.nextId,nextId);assert.equal(game.zombies.length,0);
});

test('sauvegarde : huit profils actifs et file compacte gardent santé, cadence et effectifs', () => {
  const {game,storage}=fresh(); game.player.dead=false; game.wave=12; game.phase='assault';
  game.wavePlan=C.wavePlan(12); game.pendingSpawns=C.normalizeSpawnCounts(Object.fromEntries(kinds.map((kind,i)=>[kind,100+i]))); game.spawnQueue=['breacher','stalker','bloated'];
  for(const kind of kinds){const z=spawn(game,kind);z.health-=7;z.attackCooldown=.4;}
  const before=game.zombies.map(z=>({kind:z.kind,health:z.health,attackCooldown:z.attackCooldown})),remaining=game.remainingAssault;
  assert.equal(game.save(false),true);const raw=JSON.parse(storage.get(C.SAVE_KEY));assert.equal(raw.version,2);assert.equal(raw.spawnQueue.length,3);
  assert.equal(game.load(),true);assert.equal(game.remainingAssault,remaining);assert.equal(game.spawnQueue.length,0);
  assert.deepEqual(game.zombies.map(z=>({kind:z.kind,health:z.health,attackCooldown:z.attackCooldown})),before);
  assert.ok(game.zombies.every(z=>z.prey===null),'la cible fugitive est réévaluée, jamais un objet obsolète sérialisé');
});

test('sauvegarde : anciens jeux à cinq profils et anciennes files restent chargeables sans ajout d’ennemis', () => {
  for(const version of [1,2]){
    const {game}=fresh(); game.player.dead=false;
    for(const kind of originalKinds)spawn(game,kind);
    const raw=game.serialize(),legacy={walker:20,runner:4,armored:2,crawler:1,howler:1};raw.version=version;raw.wave=8;raw.pendingSpawns=legacy;raw.spawnQueue=originalKinds.slice();
    raw.wavePlan={wave:8,total:28,fronts:3,spawnInterval:.4,composition:legacy};
    assert.equal(game.restoreSave(raw),true);assert.equal(game.remainingAssault,38);
    for(const kind of newKinds)assert.equal(game.pendingSpawns[kind],0);
    assert.deepEqual(game.zombies.map(z=>z.kind),originalKinds);
  }
});

test('sauvegarde : profils inconnus refusés dans infectés, migration compacte et file historique', () => {
  const {game}=fresh(),raw=game.serialize();
  assert.throws(()=>Save.validate({...raw,zombies:[{id:9999,kind:'spectre',x:30,y:30,health:1}]}),/type infecté/);
  assert.throws(()=>Save.validate({...raw,pendingSpawns:{constructor:1}}),/migration inconnue/);
  assert.throws(()=>Save.validate({...raw,spawnQueue:['spectre']}),/migration inconnue/);
});

test('Briseur : bonus uniquement sur structures en contact, jamais sur les alliés ou une cible distante', () => {
  const {game}=fresh(),wall=add(game,'woodWall',70,70);game.units=[];
  const z=spawn(game,'breacher',wall.left-20,wall.y),before=wall.health;game.flow.direction=()=>({x:1,y:0});
  game.updateZombies(.1);near(before-wall.health,C.ENEMIES.breacher.damage*1.8);
  const remote=add(game,'woodWall',74,70),remoteHealth=remote.health;
  assert.equal(game.damageZombieBuilding(z,remote,100),false);assert.equal(remote.health,remoteHealth);
  game.player.dead=false;game.player.health=100;game.player.x=z.x-20;game.player.y=z.y;z.attackCooldown=0;
  game.updateZombies(.1);near(game.player.health,82);
});

test('corps-à-corps : chaque profil respecte aussi le mince angle d’un mur', () => {
  for(const kind of kinds){
    const {game}=fresh(),wall=add(game,'woodWall',70,70),worker=game.units[0];game.units=[worker];
    const z=spawn(game,kind,wall.left-3,wall.top+1);worker.x=wall.left+20;worker.y=wall.top-3;
    assert.ok(C.dist(z,worker)<34);assert.equal(game.hostileLineClear(z,worker),false);
    const health=worker.health;game.flow.direction=()=>({x:-1,y:0});game.updateZombies(.01);assert.equal(worker.health,health,kind);
  }
});

test('Traqueur : chasse un allié isolé visible, abandonne une cible morte et ignore les groupes', () => {
  const {game}=fresh(),worker=game.units[0],other=game.units[1];game.units=[worker];worker.x=C.world(74);worker.y=C.world(70);
  const z=spawn(game,'stalker',worker.x+150,worker.y);game.flow.direction=()=>({x:1,y:0});const start=z.x;
  game.updateZombies(.1);assert.equal(z.prey,worker);assert.ok(z.x<start);
  other.x=worker.x+30;other.y=worker.y;game.units.push(other);z.huntThink=0;const grouped=z.x;
  game.updateZombies(.1);assert.equal(z.prey,null);assert.ok(z.x>grouped);
  other.dead=true;z.huntThink=0;game.updateZombies(.1);assert.equal(z.prey,worker);
  worker.dead=true;const abandoned=z.x;game.updateZombies(.1);assert.equal(z.prey,null);assert.ok(z.x>abandoned);
});

test('Traqueur : portes auto/closed et murs masquent les proies ; open permet la chasse puis se referme', () => {
  for(const mode of ['auto','closed','open']){
    const {game}=fresh(),gate=gateBarrier(game),worker=game.units[0];game.units=[worker];
    worker.x=gate.left-60;worker.y=gate.y;const z=spawn(game,'stalker',gate.right+60,gate.y);game.flow.direction=()=>({x:1,y:0});
    assert.equal(game.setGateMode(mode,gate),true);const before=z.x;game.updateZombies(.1);
    assert.equal(z.prey===worker,mode==='open');assert.equal(z.x<before,mode==='open');
    if(mode==='open'){assert.equal(game.setGateMode('closed',gate),true);const closing=z.x;game.updateZombies(.1);assert.equal(z.prey,null);assert.ok(z.x>closing);}
  }
});

test('Traqueur : rayon physique interdit un raccourci au bord du rempart', () => {
  const {game}=fresh(),wall=add(game,'woodWall',70,70),worker=game.units[0];game.units=[worker];
  worker.x=wall.right+45;worker.y=wall.top-5;const z=spawn(game,'stalker',wall.left-45,wall.top-5);
  assert.equal(game.hasLineOfSight(z,worker),true);assert.equal(game.stalkerCorridorClear(z,worker),false);
  game.flow.direction=()=>({x:-1,y:0});game.updateZombies(.1);assert.equal(z.prey,null);assert.ok(z.x<wall.left-45);
});

test('Traqueur : la chasse traverse physiquement une porte ouverte avant le contact, sans endommager la porte', () => {
  const {game}=fresh(),gate=gateBarrier(game),worker=game.units[0];game.units=[worker];
  worker.x=gate.left-60;worker.y=gate.y;const z=spawn(game,'stalker',gate.right+60,gate.y);game.flow.direction=()=>({x:1,y:0});
  assert.equal(game.setGateMode('open',gate),true);const health=gate.health;
  for(let step=0;step<70;step++){const previous={x:z.x,y:z.y};game.updateZombies(.05);assert.ok(C.dist(previous,z)<=C.ENEMIES.stalker.speed*1.1*.05+1e-6);assert.equal(game.hostilePositionClear(z,z.x,z.y),true);}
  assert.ok(z.x<gate.left-10);assert.equal(gate.health,health);assert.ok(worker.health<worker.maxHealth);
});

test('Traqueur : scans plafonnés par actualisation, un seul index d’isolement et reprise des retardataires', () => {
  const {game}=fresh();game.units=[];game.flow.direction=()=>({x:0,y:0});
  for(let index=0;index<80;index++)spawn(game,'stalker');
  let scans=0,indices=0;const scan=game.findStalkerPrey.bind(game),index=game.isolatedStalkerTargets.bind(game);
  game.findStalkerPrey=(...args)=>{scans++;return scan(...args);};game.isolatedStalkerTargets=()=>{indices++;return index();};
  game.updateZombies(.01);assert.equal(scans,C.ENEMY_RULES.stalkQueriesPerUpdate);assert.equal(indices,1);
  for(let step=0;step<9;step++)game.updateZombies(.01);
  assert.equal(scans,80);assert.equal(indices,10);assert.ok(game.zombies.every(z=>z.huntThink>0));
});

test('Engorgé : charge de corps forte sans explosion ni dégât de zone, sanitaire conservé et mort idempotente', () => {
  const {game}=fresh(),wall=add(game,'woodWall',70,70);game.units=[];
  const z=spawn(game,'bloated',wall.left-15,wall.y),nearby=spawn(game,'walker',z.x-10,z.y),health=nearby.health,wallHealth=wall.health,particles=game.particles.length;
  game.killZombie(z,false);near(wall.corpseLoad,3.4);assert.equal(nearby.health,health);assert.equal(wall.health,wallHealth);assert.equal(game.particles.length,particles);
  const corpses=game.corpses.length,kills=game.stats.kills;game.killZombie(z,false);assert.equal(game.corpses.length,corpses);assert.equal(game.stats.kills,kills);
  game.research.completed.push('sanitation');const next=spawn(game,'bloated',z.x,z.y);game.killZombie(next,false);near(wall.corpseLoad,4.05);
  game.player.dead=false;assert.equal(game.save(false),true);assert.equal(game.load(),true);near(game.world.buildings.get(wall.id).corpseLoad,4.05);
});

test('Traqueur : le plafond de 720 profils importés ne prive jamais les derniers du budget de chasse', () => {
  const {game}=fresh();game.units=[];game.flow.direction=()=>({x:0,y:0});
  for(let index=0;index<C.PERFORMANCE_LIMITS.zombies;index++)spawn(game,'stalker');
  const seen=new Set();let perFrame=0;game.findStalkerPrey=z=>{seen.add(z.id);perFrame++;return null;};
  for(let step=0;step<90;step++){perFrame=0;game.updateZombies(.04);assert.ok(perFrame<=C.ENEMY_RULES.stalkQueriesPerUpdate);}
  assert.equal(seen.size,C.PERFORMANCE_LIMITS.zombies);
});

test('nouveaux profils : aucune escalade ajoutée, les rampes restent propres aux récents et rampants', () => {
  for(const kind of newKinds){
    const {game}=fresh(),gate=gateBarrier(game);game.units=[];gate.corpseLoad=100;game.flow.direction=()=>({x:-1,y:0});
    const z=spawn(game,kind,gate.right+35,gate.y),before=gate.health;
    for(let step=0;step<80;step++)game.updateZombies(.05);
    assert.ok(z.x>gate.right,kind);assert.ok(gate.health<before,kind);assert.equal(gate.dead,false);
  }
});

test('horde mixte : 30 secondes simulées au plafond, huit profils, flux réel et reprise sans perte de compteurs', () => {
  const {game}=fresh();game.units=[];game.player.dead=false;game.random=new C.Random(17117);
  game.wave=1000;game.phase='assault';game.prepareWave();game.startAssault();game.spawnTimer=-1000;
  const expected={...game.wavePlan.composition},seen=new Set();game.update(.04);
  assert.equal(game.zombies.length,C.PERFORMANCE_LIMITS.zombies);
  for(let step=0;step<750;step++){
    // Synthetic removals exercise recycling and keep this a bounded logic probe, not a balance claim.
    for(const z of game.zombies)if(!z.dead&&(C.dist(z,game.core())<600||(step%75===0&&!seen.has(z.kind)))){seen.add(z.kind);expected[z.kind]--;game.killZombie(z,false);}
    game.update(.04);
    assert.ok(!game.gameOver);assert.ok(game.zombies.length<=C.PERFORMANCE_LIMITS.zombies);assert.ok(game.spawnQueue.length<=C.STRATEGY_RULES.spawnBatch);
    assert.ok(game.corpses.length<=C.PERFORMANCE_LIMITS.corpses);assert.ok(game.particles.length<=C.PERFORMANCE_LIMITS.particles);
    if(step%50===0){
      const actual=C.normalizeSpawnCounts(game.pendingSpawns,game.spawnQueue);
      for(const z of game.zombies){actual[z.kind]++;assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.y)&&z.health>0);}
      assert.deepEqual(actual,expected);assert.equal(game.remainingAssault,C.spawnCount(expected));
    }
  }
  assert.equal(seen.size,kinds.length);assert.equal(game.save(false),true);assert.equal(game.load(),true);
  const restored=C.normalizeSpawnCounts(game.pendingSpawns,game.spawnQueue);for(const z of game.zombies)restored[z.kind]++;
  assert.deepEqual(restored,expected);assert.equal(game.remainingAssault,C.spawnCount(expected));
});
