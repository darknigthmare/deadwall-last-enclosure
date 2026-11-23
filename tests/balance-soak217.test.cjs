'use strict';
// Banc d'équilibrage 217 (scripts/balance-soak217.cjs), version courte : une graine, quatre vagues, stratégie « rempart ».
// Il ne juge pas l'équilibrage : il vérifie que le banc tourne, qu'il ne touche à aucune règle du cœur et que ses
// indicateurs restent dans des bornes raisonnables en début de campagne.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core.js');
const Bench = require('../scripts/balance-soak217.cjs');
const WAVES = 4;
const rulesOf = () => JSON.stringify(Object.fromEntries(Object.keys(C).filter(k => /2(15|17)Rules$/.test(k)).map(k => [k, C[k]])));

test('banc 217 : stratégies et graines de référence déclarées, gelées', () => {
  assert.deepEqual(Bench.SEEDS, ['0', '1', '42', '17117', '84329', '967313470', '1947648717', '4294967295']);
  assert.deepEqual(Object.keys(Bench.STRATEGIES), ['rempart', 'negligee', 'sortie']);
  for (const s of Object.values(Bench.STRATEGIES)) assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(Bench.BOT) && Object.isFrozen(Bench.PLAN));
  assert.equal(Bench.BOT.step, C.SIMULATION_RULES.maxStepSeconds, 'le banc avance au pas physique maximal du jeu');
  assert.throws(() => Bench.runSoak({ strategy: 'inconnue' }), /Stratégie inconnue/);
});

test('banc 217 : quatre vagues sur 17117, indicateurs dans des bornes raisonnables, aucune règle touchée', { timeout: 240000 }, () => {
  const before = rulesOf(), random = Math.random, now = Date.now, seen = [];
  const report = Bench.runSoak({ seed: '17117', waves: WAVES, strategy: 'rempart', onWave: r => seen.push(r.wave) });
  assert.equal(Math.random, random, 'Math.random rendu'); assert.equal(Date.now, now, 'Date.now rendu');
  assert.equal(rulesOf(), before, 'aucune règle C.*215/217Rules modifiée');
  assert.equal(report.fell, false); assert.equal(report.reached, WAVES); assert.deepEqual(seen, [1, 2, 3, 4]);
  assert.equal(report.records.length, WAVES);
  for (const r of report.records) {
    assert.equal(r.outcome, 'repoussée', 'vague ' + r.wave);
    // Durées de phase : le calme du moteur, 10 s d'alerte, un assaut réel, 8 s de sécurisation.
    assert.ok(r.phases.calm >= 38 && r.phases.calm <= 260, 'calme ' + r.phases.calm);
    assert.ok(Math.abs(r.phases.warning - 10) < .1 && Math.abs(r.phases.aftermath - 8) < .1);
    assert.ok(r.phases.assault > 0 && r.phases.assault < 900, 'assaut ' + r.phases.assault);
    // Début de campagne : pas de maladie, pas de pénurie d'eau, moral haut, la cité vit.
    assert.ok(!r.sickness || r.sickness.stageMax < 2, 'pas de maladie dès la vague ' + r.wave);
    // Corps comptés par la maladie (charge des murs en part pendant l'assaut) : jamais plus que les corps laissés.
    if (r.sickness) assert.ok(Number.isFinite(r.sickness.countedMax) && r.sickness.countedMax >= 0 && r.sickness.countedMax <= r.sickness.leftMax + 1e-9, 'comptés ' + r.sickness.countedMax);
    assert.ok(!r.water || r.water.stageMax === 0, 'pas de pénurie d’eau');
    assert.ok(r.moraleMin >= 40, 'moral ' + r.moraleMin);
    assert.ok(r.population >= 3 && r.population <= r.housing + 1);
    assert.ok(r.balance.departs === 0, 'aucun départ pour moral');
    for (const n of [r.walls.loadMax, r.walls.standing, r.plan.total, r.balance.signature, r.balance.attraction]) assert.ok(Number.isFinite(n) && n >= 0);
    assert.ok(r.plan.total >= 8 && r.plan.fronts >= 1 && r.plan.fronts <= 4);
    assert.equal(r.led, null, 'aucune vague menée avant la vague 12');
    assert.equal(r.siege, null, 'aucune abomination du siège avant la vague 14');
  }
  // La difficulté monte par le nombre : chaque vague annonce plus d'infectés que la précédente.
  for (let i = 1; i < WAVES; i++) assert.ok(report.records[i].plan.total > report.records[i - 1].plan.total);
  // Pas de rupture à chaque vague.
  assert.ok(report.records.filter(r => r.walls.ruptures > 0).length < WAVES);
  // Aides de banc déclarées et comptées.
  for (const k of ['ammoAid', 'guardKills', 'strayKills']) assert.ok(Number.isFinite(report.counters[k]) && report.counters[k] >= 0, k);
  const s = Bench.summarize(report);
  assert.equal(s.reached, WAVES); assert.equal(s.sickFirstWave, null); assert.equal(s.ruptureWaves < WAVES, true);
});
