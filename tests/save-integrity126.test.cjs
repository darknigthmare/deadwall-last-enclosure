'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const C = require('../src/core.js');
const Save = require('../src/save.js');
const clone = value => JSON.parse(JSON.stringify(value));

function fresh() {
  const env = bootGame();
  env.game.startNew('standard', '17117');
  return env;
}

test('persistance 1.26 : gisement dupliqué refusé sans choisir silencieusement une quantité', () => {
  const { game, storage } = fresh();
  const snapshot = clone(game.serialize()), world = game.world;
  const primary = storage.get(C.SAVE_KEY);
  for (const version of [1, 2, C.SAVE_VERSION]) {
    const bad = clone(snapshot);
    bad.version = version;
    bad.nodes.push([bad.nodes[0][0], 0]);
    const bytes = JSON.stringify(bad);
    assert.throws(() => Save.parse(bytes), /gisement dupliqué/);
    assert.throws(() => game.restoreSave(bad), /gisement dupliqué/);
    assert.equal(game.world, world);
    assert.equal(storage.get(C.SAVE_KEY), primary);
    assert.equal(JSON.stringify(bad), bytes);
  }
});

test('persistance 1.26 : annexes incompatibles et équipe tronquée refusées avant mutation', () => {
  const { game, storage } = fresh();
  const snapshot = clone(game.serialize()), world = game.world, primary = storage.get(C.SAVE_KEY);
  const changes = [
    s => { s.districts.east = { level: 1, buildings: [{ type: 'housing', slot: 0, progress: 1 }, { type: 'depot', slot: 0, progress: .5 }] }; },
    s => { s.districts.east.buildings = [{ type: 'housing', slot: 0, progress: 1 }]; },
    s => { s.companions = ['lea', 'samir', 'ines'].map(id => ({ id, health: 100, order: 'follow' })); },
    s => { s.companions = { lea: { health: 100 } }; }
  ];
  for (const change of changes) {
    const bad = clone(snapshot);
    change(bad.worldEvolution);
    assert.throws(() => game.restoreSave(bad), /annexe|Équipe/);
    assert.equal(game.world, world);
    assert.equal(storage.get(C.SAVE_KEY), primary);
    assert.deepEqual(game.worldEvolution.snapshot(), snapshot.worldEvolution);
  }
});

test('persistance 1.26 : dégâts et IDs des hordes restent compatibles avec le compteur sauvegardé', () => {
  const { game } = fresh();
  assert.equal(game.worldEvolution.enableWorld4(), true);
  game.player.x = 4058; game.player.y = 2048;
  assert.equal(game.frontier.enter(), true);
  game.update(.04);
  const snapshot = clone(game.serialize()), world = game.world;
  assert.ok(snapshot.worldEvolution.groups.length);
  for (const change of [
    s => { s.serial = 0; },
    s => { s.groups[0].id = 'W0018'; },
    s => { s.groups[0].wound = NaN; },
    s => { s.groups[0].lost = NaN; },
    s => { s.structures.P9999 = .5; }
  ]) {
    const bad = clone(snapshot);
    change(bad.worldEvolution);
    assert.throws(() => game.restoreSave(bad), /Horde|Évolution|Structure régionale/);
    assert.equal(game.world, world);
  }
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.deepEqual(game.worldEvolution.snapshot(), snapshot.worldEvolution);
});

test('persistance 1.26 : deux constructions distinctes et structures régionales endommagées sont conservées', () => {
  const { game } = fresh();
  assert.equal(game.worldEvolution.enableWorld4(), true);
  const snapshot = clone(game.serialize());
  snapshot.worldEvolution.districts.east = { level: 1, buildings: [
    { type: 'housing', slot: 0, progress: 1 }, { type: 'depot', slot: 1, progress: .5 }
  ] };
  const poi = game.frontier.world().pois[0];
  snapshot.worldEvolution.structures[poi.id] = .35;
  game.restoreSave(snapshot);
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.deepEqual(game.worldEvolution.snapshot(), snapshot.worldEvolution);
  assert.equal(game.worldEvolution.districtEffects().housing, 8);
  assert.equal(game.worldEvolution.districtEffects().storage, 0, 'un chantier annexe ne fournit pas encore sa capacité');
});
