'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

// Opt-in logic endurance, never a balance, rendering, FPS or real-player benchmark.
// A synthetic safety bot removes nearby enemies so both sessions can run to the end.
test('endurance technique : deux cartes, 30 minutes simulées, sauvegardes et plafond de horde', {
  skip: process.env.DEADWALL_SOAK !== '1'
}, t => {
  const C = require('../src/core.js');
  const P = require('../src/profile.js');
  const Save = require('../src/save.js');
  const { bootGame } = require('./helpers/browser.cjs');
  const started = performance.now(), reports = [];

  function add(game, type, x, y, rotation = 0) {
    const building = new (game.core().constructor)(game.nextId++, type, x, y, rotation, 1);
    assert.ok(game.world.cells(building).every(cell => !game.world.atCell(cell.x, cell.y)), 'fixture sans chevauchement');
    game.world.add(building); return building;
  }

  function setup(game, enclosed) {
    let gate, target;
    if (enclosed) {
      for (let x = 58; x <= 70; x++) { add(game, 'woodWall', x, 58); add(game, 'woodWall', x, 70); }
      for (let y = 59; y < 70; y++) {
        add(game, 'woodWall', 58, y);
        if (y !== 64 && y !== 65) { const wall = add(game, 'woodWall', 70, y); if (y === 63) target = wall; }
      }
      gate = add(game, 'gate', 70, 64, 1);
    } else target = add(game, 'woodWall', 71, 64);
    add(game, 'warehouse', 59, 59); add(game, 'farm', 59, 66);
    add(game, 'house', 66, 66); add(game, 'generator', 66, 60);
    game.refreshMetrics(true);
    assert.equal(game.getEnclosureStatus().enclosed, enclosed);
    return { gateId: gate?.id, targetId: target.id };
  }

  function invariant(game, report) {
    for (const [key, value] of Object.entries(game.resources)) {
      assert.ok(Number.isFinite(value) && value >= -1e-8 && value <= game.storage + 1e-8, `stock ${key}: ${value}`);
    }
    for (const [key, value] of Object.entries(game.stats)) assert.ok(Number.isFinite(value) && value >= 0, `stat ${key}`);
    assert.ok(game.core() && !game.gameOver, 'le scénario technique doit atteindre sa durée entière');
    assert.ok(game.zombies.length <= C.PERFORMANCE_LIMITS.zombies);
    assert.ok(game.corpses.length <= C.PERFORMANCE_LIMITS.corpses);
    assert.ok(game.particles.length <= C.PERFORMANCE_LIMITS.particles);
    assert.ok(game.spawnQueue.length <= C.STRATEGY_RULES.spawnBatch);
    assert.ok(Number.isInteger(game.world.navigationVersion) && game.world.navigationVersion >= 0);
    assert.ok(game.navigationBudget >= 0 && game.navigationBudget <= C.STRATEGY_RULES.pathQueriesPerUpdate);
    for (const count of Object.values(game.pendingSpawns)) assert.ok(Number.isSafeInteger(count) && count >= 0);
    for (const unit of [game.player, ...game.units, ...game.zombies]) {
      assert.ok(Number.isFinite(unit.x) && Number.isFinite(unit.y));
      assert.ok(unit.x >= 0 && unit.x <= C.WORLD_SIZE && unit.y >= 0 && unit.y <= C.WORLD_SIZE);
      assert.ok(Number.isFinite(unit.health) && unit.health >= 0);
      if (unit.kind === 'worker') {
        assert.ok(Number.isFinite(unit.carry) && unit.carry >= 0 && unit.carry <= unit.maxCarry + 1e-8);
        assert.ok(!unit.navigation || unit.navigation.version <= game.world.navigationVersion);
        assert.ok(!unit.blockedJobs || unit.blockedJobs.size <= 32);
      }
    }
    for (const building of game.world.buildings.values()) {
      assert.ok(Number.isFinite(building.health) && building.health > 0 && building.health <= building.maxHealth);
      assert.ok(Number.isFinite(building.corpseLoad) && building.corpseLoad >= 0);
      for (const cell of game.world.cells(building)) assert.equal(game.world.atCell(cell.x, cell.y), building);
    }
    for (const node of game.world.nodes) assert.ok(Number.isFinite(node.amount) && node.amount >= 0);
    report.maxZombies = Math.max(report.maxZombies, game.zombies.length);
    report.maxCorpses = Math.max(report.maxCorpses, game.corpses.length);
    report.maxParticles = Math.max(report.maxParticles, game.particles.length);
    report.checks++;
  }

  function checkpoint(game, report) {
    const before = Save.validate(game.serialize()), remaining = game.remainingAssault;
    assert.equal(game.save(false), true, 'checkpoint écrit');
    assert.equal(game.profileStatus.persisted, true, 'records persistés');
    assert.equal(game.load(), true, 'checkpoint réellement rechargé');
    const after = Save.validate(game.serialize());
    for (const key of ['runId', 'worldSeed', 'difficulty', 'workerOrder', 'phase', 'wave', 'elapsed']) assert.equal(after[key], before[key], key);
    assert.deepEqual(after.resources, before.resources);
    assert.deepEqual(after.stats, before.stats);
    assert.deepEqual(after.buildings, before.buildings);
    assert.deepEqual(after.nodes, before.nodes);
    assert.equal(game.remainingAssault, remaining, 'file compacte + vivants conservés');
    assert.deepEqual(after.units.map(unit => [unit.id, unit.kind, unit.x, unit.y, unit.health, unit.carry, unit.carryType]),
      before.units.map(unit => [unit.id, unit.kind, unit.x, unit.y, unit.health, unit.carry, unit.carryType]));
    assert.equal(game.profile.get().summary.retainedRuns, 1, 'recharger ne crée pas une nouvelle campagne');
    P.validate(game.profile.get());
    report.maxSaveCharacters = Math.max(report.maxSaveCharacters, JSON.stringify(after).length);
    report.checkpoints++;
  }

  for (const [difficulty, seed, enclosed] of [['story', '17117', false], ['standard', '903145', true]]) {
    const { game } = bootGame(); game.startNew(difficulty, seed);
    // Fix non-map random inputs only inside the test for repeatable fixture actors/director.
    game.random = new C.Random(Number(seed));
    game.units.forEach((unit, index) => { unit.offset = { x: 80 + index * 6, y: 10 + index * 6 }; });
    const ids = setup(game, enclosed), report = {
      difficulty, seed: Number(seed), enclosed, simulatedSeconds: 900, frameStep: .04,
      syntheticSafetyKills: 0, cleanupSteps: 0, retreatArrivalSteps: 0, checkpoints: 0, checks: 0,
      maxZombies: 0, maxCorpses: 0, maxParticles: 0, maxSaveCharacters: 0
    };
    for (let step = 0; step < 22500; step++) {
      const cycle = step % 3000;
      if ([0, 1500, 2250].includes(cycle)) {
        const order = cycle === 0 ? 'clear' : cycle === 1500 ? 'retreat' : 'harvest';
        assert.equal(game.setWorkerOrder(order), true);
        for (const worker of game.units.filter(unit => unit.kind === 'worker')) assert.equal(worker.navigation, null, 'ordre invalide les routes');
        if (cycle === 0) game.world.buildings.get(ids.targetId).corpseLoad = 12;
      }
      if (ids.gateId && (cycle === 0 || cycle === 625)) {
        const gate = game.world.buildings.get(ids.gateId), version = game.world.navigationVersion;
        const mode = cycle === 0 ? 'closed' : 'auto', previous = gate.gateMode;
        const changed = game.setGateMode(mode, gate);
        if (changed && mode !== previous) assert.ok(game.world.navigationVersion > version);
        else assert.equal(game.world.navigationVersion, version, 'une fermeture occupée ne modifie pas la navigation');
        assert.equal(game.getEnclosureStatus().enclosed, true);
      }
      // Artificial test assistance, not normal gameplay: remove approaching enemies.
      // Real movement, spawning, economy, orders, deaths, corpse decay and autosaves still run.
      for (const zombie of game.zombies) if (!zombie.dead && (C.dist(zombie, game.core()) < 560 || game.units.some(unit => C.dist(zombie, unit) < 160))) {
        game.killZombie(zombie, false); report.syntheticSafetyKills++;
      }
      const pressureBefore = game.world.buildings.get(ids.targetId).corpseLoad;
      game.update(.04);
      if (pressureBefore - game.world.buildings.get(ids.targetId).corpseLoad > C.WORKER_RULES.passiveDecayPerSecond * .04 + 1e-8) report.cleanupSteps++;
      if (game.workerOrder === 'retreat' && game.units.some(unit => unit.kind === 'worker' && C.dist(unit, game.core()) <= C.WORKER_RULES.retreatRadius)) report.retreatArrivalSteps++;
      if ((step + 1) % 100 === 0) invariant(game, report);
      if ((step + 1) % 1500 === 0) checkpoint(game, report);
    }
    assert.ok(Math.abs(game.elapsed - 900) < 1e-6);
    assert.ok(game.stats.wavesSurvived > 0 && report.syntheticSafetyKills > 0, 'directeur et éliminations réellement exercés');
    assert.ok(report.cleanupSteps > 0 && report.retreatArrivalSteps > 0, 'nettoyage local et repli réellement exercés');
    assert.equal(game.profile.get().summary.retainedRuns, 1);

    // Separate late-wave pressure probe, not part of the 900-second session evidence.
    game.wave = 1000; game.phase = 'assault'; game.prepareWave(); game.startAssault();
    game.zombies = []; game.spawnTimer = -1000;
    const expected = game.wavePlan.total;
    game.update(.04);
    assert.equal(game.zombies.length, C.PERFORMANCE_LIMITS.zombies, 'plafond atteint réellement');
    assert.equal(game.remainingAssault, expected, 'le plafonnement ne perd aucun ennemi');
    for (let step = 0; step < 40; step++) game.update(.04);
    assert.equal(game.remainingAssault, expected, 'horde en attente conservée au plafond');
    invariant(game, report); checkpoint(game, report);
    assert.equal(game.zombies.length, C.PERFORMANCE_LIMITS.zombies);
    report.lateWavePending = game.remainingAssault - game.zombies.length;
    reports.push(report);
  }
  t.diagnostic(JSON.stringify({ kind: 'synthetic-logic-endurance', wallMilliseconds: Math.round(performance.now() - started), reports }));
});
