'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const C = require('../src/core.js');
const Scenarios = require('../src/scenarios.js');
const Save = require('../src/save.js');
const { bootGame } = require('./helpers/browser.cjs');

// Logic-only, deliberately limited player policy, NOT a human balance or FPS test.
// No actor/stat/stock writes, teleports, free structures, damage injection, forced
// kills, healing or reanimation calls. Normal engine loot, rewards, production
// and automatic medical evacuation remain enabled and are reported honestly.
const SEED = 17117, STEP = .04, HORIZON = 600;
const PLAN = [
  'house', 'farm', 'watchtower', 'lumber', 'scrapyard', 'barracks',
  'watchtower', 'warehouse', 'generator', 'quarry', 'workshop',
  'ammoFactory', 'refinery', 'watchtower', 'house'
];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const roundedBag = bag => Object.fromEntries(Object.entries(bag).map(([key, value]) => [key, Math.round(value * 100) / 100]));

function affordableWithReserve(game, cost, reserve = {}) {
  return C.RESOURCE_KEYS.every(key => game.resources[key] + 1e-8 >= (cost[key] || 0) + (reserve[key] || 0));
}

function paidCommand(game, cost, command, report) {
  const before = { ...game.resources };
  assert.equal(command(), true, 'commande normale acceptée');
  for (const key of C.RESOURCE_KEYS) {
    assert.ok(Math.abs(game.resources[key] - Math.max(0, before[key] - (cost[key] || 0))) < 1e-7,
      'coût réellement payé : ' + key);
    report.spent[key] += cost[key] || 0;
  }
}

function constructionCell(game, type) {
  const def = C.BUILDINGS[type], core = game.core(), candidates = [];
  for (let y = 54; y <= 73; y++) for (let x = 54; x <= 73; x++) {
    const center = { x: (x + def.size[0] / 2) * C.TILE, y: (y + def.size[1] / 2) * C.TILE };
    candidates.push({ x, y, distance: distance(center, core) });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
  return candidates.find(cell => game.world.placement(def, cell.x, cell.y, 0).valid);
}

function managementPolicy(game, report) {
  const next = PLAN[report.planned.length], def = C.BUILDINGS[next];
  if (def && game.world.incomplete().length < 2 && def.unlockTier <= game.tier.id &&
      (!def.requires || game.world.has(def.requires)) && affordableWithReserve(game, def.cost)) {
    const cell = constructionCell(game, next);
    if (cell) {
      paidCommand(game, def.cost, () => game.placeOne(next, cell.x, cell.y), report);
      report.planned.push(next);
    }
  }
  // At most two purchased workers and three purchased soldiers. No replacing
  // casualties indefinitely, and the convoy must first finish a real dormitory.
  const workers = game.units.filter(unit => !unit.dead && unit.kind === 'worker').length;
  const soldiers = game.units.filter(unit => !unit.dead && unit.kind === 'soldier').length;
  const kind = workers < 5 && report.recruited.worker < 2 ? 'worker'
    : soldiers < 3 && report.recruited.soldier < 3 ? 'soldier' : null;
  if (kind && game.canRecruit(kind) && affordableWithReserve(game, C.SURVIVORS[kind].cost, { food: 35, ammo: 50 })) {
    paidCommand(game, C.SURVIVORS[kind].cost, () => game.recruit(kind), report);
    report.recruited[kind]++;
  }
}

function workTarget(game, report) {
  const player = game.player, carried = Object.values(player.carry).reduce((sum, value) => sum + value, 0);
  if (carried >= 30) return { entity: game.core(), reach: 72 };
  const unfinished = game.world.incomplete().sort((a, b) => distance(player, a) - distance(player, b))[0];
  if (unfinished) return { entity: unfinished, reach: 48 };
  const next = C.BUILDINGS[PLAN[report.planned.length]], wanted = next?.cost || { wood: 60, scrap: 60 };
  const nodes = game.world.nodes.filter(node => !node.depleted && distance(node, game.core()) < 650 &&
    game.resources[node.type] < game.storage - 1);
  const score = node => distance(player, node) *
    (game.resources[node.type] < (wanted[node.type] || 0) ? .3 : 1) *
    (node.type === 'food' && game.resources.food < 45 ? .3 : 1);
  nodes.sort((a, b) => score(a) - score(b) || a.id - b.id);
  return { entity: nodes[0] || game.core(), reach: nodes.length ? 40 : 72 };
}

function playerPolicy(game, report, step) {
  const player = game.player;
  game.input.keys.clear(); game.input.mouseDown = false;
  if (player.dead) return;
  const target = game.zombies.filter(zombie => !zombie.dead && distance(player, zombie) < 340)
    .sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id)[0];
  if (target) {
    game.input.mouseX = (target.x - game.camera.x) * game.camera.zoom + game.width / 2;
    game.input.mouseY = (target.y - game.camera.y) * game.camera.zoom + game.height / 2;
    game.input.mouseDown = true;
    // Melee remains an ordinary input and uses the game's facing/cooldown/reach.
    if (distance(player, target) < 48) game.input.pressed.add('Space');
  } else if (player.magazine[player.weapon] < 3) game.input.pressed.add('KeyR');

  if (step % 25 === 0 || !report.target || report.target.entity.dead || report.target.entity.depleted ||
      (report.target.entity.type && report.target.entity.type !== 'core' && report.target.entity.completed)) {
    report.target = workTarget(game, report);
  }
  let goal = report.target.entity, reach = report.target.reach;
  // A short retreat when a visible threat is close, using movement input only.
  if (target && distance(player, target) < 100) {
    goal = { x: player.x + (player.x - target.x), y: player.y + (player.y - target.y) };
    reach = 0; game.input.keys.add('ShiftLeft');
  }
  if (goal && distance(player, goal) > reach) {
    const dx = goal.x - player.x, dy = goal.y - player.y;
    if (Math.abs(dx) > 4) game.input.keys.add(dx < 0 ? 'KeyA' : 'KeyD');
    if (Math.abs(dy) > 4) game.input.keys.add(dy < 0 ? 'KeyW' : 'KeyS');
  }
  game.input.keys.add('KeyE');
}

function invariant(game, report) {
  report.maxStorage = Math.max(report.maxStorage, game.storage);
  for (const [key, value] of Object.entries(game.resources)) {
    // A destroyed warehouse may lower capacity between the .25s economy ticks.
    assert.ok(Number.isFinite(value) && value >= 0 && value <= report.maxStorage + 1e-7, 'stock borné : ' + key);
  }
  for (const [key, value] of Object.entries(game.stats)) assert.ok(Number.isFinite(value) && value >= 0, 'statistique finie : ' + key);
  for (const entity of [game.player, ...game.units, ...game.zombies].filter(entity => !entity.dead)) {
    assert.ok(Number.isFinite(entity.x) && Number.isFinite(entity.y), 'coordonnées finies');
    assert.ok(entity.x >= 0 && entity.x <= C.WORLD_SIZE && entity.y >= 0 && entity.y <= C.WORLD_SIZE, 'acteur dans le monde');
    assert.ok(Number.isFinite(entity.health) && entity.health > 0 && entity.health <= entity.maxHealth, 'santé native bornée');
  }
  for (const value of Object.values(game.player.carry)) assert.ok(Number.isFinite(value) && value >= 0, 'portage borné');
  assert.ok(Object.values(game.player.carry).reduce((sum, value) => sum + value, 0) <= game.player.carryCapacity + 1e-7);
  assert.ok(Number.isFinite(game.player.downTimer) && game.player.downTimer >= 0);
  for (const building of game.world.buildings.values()) {
    assert.ok(Number.isFinite(building.health) && building.health > 0 && building.health <= building.maxHealth);
    assert.ok(Number.isFinite(building.progress) && building.progress >= 0 && building.progress <= 1);
    for (const cell of game.world.cells(building)) assert.equal(game.world.atCell(cell.x, cell.y), building, 'occupation cohérente');
    if (building.completed) report.completed.add(building.type);
  }
  for (const node of game.world.nodes) assert.ok(Number.isFinite(node.amount) && node.amount >= 0);
  for (const count of Object.values(game.pendingSpawns)) assert.ok(Number.isSafeInteger(count) && count >= 0);
  assert.ok(game.zombies.length <= C.PERFORMANCE_LIMITS.zombies);
  assert.ok(game.corpses.length <= C.PERFORMANCE_LIMITS.corpses);
  assert.ok(game.particles.length <= C.PERFORMANCE_LIMITS.particles);
  assert.ok(game.spawnQueue.length <= C.STRATEGY_RULES.spawnBatch);
  assert.ok(game.navigationBudget >= 0 && game.navigationBudget <= C.STRATEGY_RULES.pathQueriesPerUpdate);
  report.maxZombies = Math.max(report.maxZombies, game.zombies.length);
  report.checks++;
}

function checkpoint(game, storage, report) {
  const before = Save.validate(game.serialize());
  assert.equal(game.save(false), true, 'campagne ordinaire sauvegardable');
  const saved = Save.parse(storage.get(C.SAVE_KEY));
  for (const key of ['scenarioId', 'worldSeed', 'difficulty', 'wave', 'phase', 'elapsed', 'randomState', 'runId'])
    assert.equal(saved[key], before[key], 'checkpoint : ' + key);
  for (const key of ['player', 'resources', 'buildings', 'units', 'zombies', 'nodes', 'stats', 'squads', 'narrative'])
    assert.deepEqual(saved[key], before[key], 'checkpoint : ' + key);
  report.checkpoints++;
}

test('campagnes sans assistance : quatre départs Standard, graine 17117, dix minutes ou défaite réelle', t => {
  const previousNow = Date.now, previousRandom = Math.random;
  Date.now = () => 1700000000000;
  try {
    for (const scenario of Scenarios.list()) {
      // Freeze only external entropy before boot. Keep the engine's seeded RNG,
      // actors, director, resources, health and ammunition entirely untouched.
      const entropy = new C.Random(814721); Math.random = () => entropy.next();
      const { game, storage } = bootGame(); game.startNew('standard', String(SEED), scenario.id);
      const report = {
        scenario: scenario.id, planned: [], recruited: { worker: 0, soldier: 0 },
        spent: Object.fromEntries(C.RESOURCE_KEYS.map(key => [key, 0])),
        target: null, completed: new Set(), checks: 0, checkpoints: 0,
        playerDowns: 0, nativeAutomaticRevivals: 0, maxZombies: 0, maxStorage: game.storage
      };
      checkpoint(game, storage, report);
      for (let step = 0; step < HORIZON / STEP && !game.gameOver; step++) {
        if (step % 50 === 0) managementPolicy(game, report);
        playerPolicy(game, report, step);
        const wasDown = game.player.dead;
        game.update(STEP); game.input.pressed.clear();
        if (!wasDown && game.player.dead) report.playerDowns++;
        if (wasDown && !game.player.dead) report.nativeAutomaticRevivals++;
        if (step % 25 === 0) invariant(game, report);
        if ((step + 1) % 750 === 0 && !game.gameOver) checkpoint(game, storage, report);
      }
      if (!game.gameOver) checkpoint(game, storage, report);
      const finalState = game.serialize();
      const result = {
        kind: 'unassisted-scripted-campaign-policy', scenario: scenario.id, seed: SEED, difficulty: 'standard',
        simulatedSeconds: Math.round(game.elapsed * 100) / 100,
        outcome: game.gameOver ? 'core-destroyed' : 'policy-horizon-reached',
        wave: game.wave, wavesSurvived: game.stats.wavesSurvived, kills: game.stats.kills, shots: game.stats.shots,
        gathered: Math.round(game.stats.gathered), deposited: Math.round(game.depositedResources),
        buildingsLost: game.stats.buildingsLost, unitsLost: game.stats.unitsLost,
        playerDowns: report.playerDowns, nativeAutomaticRevivals: report.nativeAutomaticRevivals,
        coreHealth: Math.round(game.core()?.health || 0), population: game.population, tier: game.tier.id,
        planned: report.planned, completedTypes: [...report.completed].sort(), recruited: report.recruited,
        spent: report.spent, resources: roundedBag(game.resources), checks: report.checks,
        checkpoints: report.checkpoints, maxZombies: report.maxZombies,
        fingerprint: crypto.createHash('sha256').update(JSON.stringify({
          ...finalState, runId: undefined, timestamp: undefined
        })).digest('hex')
      };
      t.diagnostic(JSON.stringify(result));
      assert.ok(report.planned.length > 0 && report.completed.has('house'), 'un vrai premier chantier peut aboutir : ' + scenario.id);
      assert.ok(game.depositedResources > 0 && game.stats.gathered > 0, 'récolte et dépôt normaux : ' + scenario.id);
      assert.ok(report.checkpoints >= 2, 'sauvegardes réellement exercées en campagne : ' + scenario.id);
      assert.ok(game.gameOver || Math.abs(game.elapsed - HORIZON) < 1e-6);
      if (game.gameOver) {
        assert.equal(game.core(), null, 'défaite causée par le centre détruit');
        assert.equal(storage.has(C.SAVE_KEY), false, 'aucune sauvegarde active après défaite');
      }
    }
  } finally { Date.now = previousNow; Math.random = previousRandom; }
  t.diagnostic('Stratégie scriptée bornée ; aucune conclusion sur l’équilibrage humain, le rendu ou les FPS. Les réanimations éventuelles sont exclusivement la règle native du moteur.');
});
