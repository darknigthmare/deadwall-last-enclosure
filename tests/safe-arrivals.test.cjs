'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const T = require('../src/tactics.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() {
  const env = bootGame(); env.game.startNew('standard', '17117'); return env;
}
function wallColumn(game) {
  const Building = game.core().constructor, walls = [];
  for (let y = 61; y <= 66; y++) {
    const wall = new Building(game.nextId++, 'woodWall', 66, y, 0, 1);
    game.world.add(wall); walls.push(wall);
  }
  game.refreshMetrics(true); return walls;
}
function injury(game) {
  game.activeCrisis = { id: 'injury', wave: 3, status: 'pending', remaining: 45, targetId: 0, choice: null };
}

test('arrivées : les positions historiques restent inchangées lorsqu’elles sont dégagées', () => {
  const { game } = fresh(), core = game.core(), randomState = game.random.state;
  for (const entity of [game.player, game.units[0]]) {
    const preferred = { x: core.x + 80, y: core.y };
    assert.deepEqual(game.coreArrivalPosition(entity, preferred), preferred);
  }
  assert.equal(game.random.state, randomState, 'la recherche ne consomme pas le RNG de campagne');
  game.damagePlayer(1000); game.updatePlayer(8);
  assert.equal(game.player.x, core.x + 80); assert.equal(game.player.y, core.y);
});

test('réanimation : un rempart adjacent ne capture plus le commandant, qui repart depuis le centre', () => {
  const { game } = fresh(), core = game.core(), walls = wallColumn(game);
  game.player.carry.wood = 20; game.damagePlayer(1000); game.updatePlayer(8.02);
  assert.equal(game.player.dead, false);
  assert.deepEqual({ x: game.player.x, y: game.player.y }, { x: core.x, y: core.y });
  assert.equal(game.player.carry.wood, 10); assert.equal(game.player.invulnerable, 3);
  assert.ok(game.friendlyPositionClear(game.player, game.player.x, game.player.y));
  assert.ok(walls.every(wall => !T.overlapsBuilding(wall, game.player)));
  game.input.keys.add('KeyA'); game.updatePlayer(.04);
  assert.ok(game.player.x < core.x, 'le retour conserve un personnage effectivement mobile');
  assert.equal(game.player.carry.wood, 10, 'la pénalité ne se répète pas');
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  assert.ok(game.friendlyPositionClear(game.player, game.player.x, game.player.y));
});

test('accueil : un ouvrier payé une fois apparaît dans le centre si la palissade bloque son arrivée', () => {
  const { game } = fresh(), core = game.core(), walls = wallColumn(game);
  game.random.range = (min, max) => (min + max) / 2;
  injury(game);
  const before = { food: game.resources.food, medicine: game.resources.medicine, count: game.units.length };
  assert.equal(game.resolveCrisis('A'), true);
  const unit = game.units.at(-1), id = unit.id;
  assert.deepEqual({ x: unit.x, y: unit.y }, { x: core.x, y: core.y });
  assert.ok(walls.every(wall => !T.overlapsBuilding(wall, unit)));
  assert.equal(game.resources.food, before.food - 12); assert.equal(game.resources.medicine, before.medicine - 6);
  assert.equal(game.units.length, before.count + 1); assert.equal(game.resolveCrisis('A'), false);
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  const restored = game.units.find(candidate => candidate.id === id);
  assert.ok(restored); assert.ok(game.friendlyPositionClear(restored, restored.x, restored.y));
  assert.equal(game.units.length, before.count + 1);
  assert.equal(game.resources.food, before.food - 12); assert.equal(game.resources.medicine, before.medicine - 6);
  game.setWorkerOrder('retreat');
  for (let step = 0; step < 100; step++) { game.elapsed += .05; game.updateUnits(.05); }
  assert.ok(game.friendlyPositionClear(restored, restored.x, restored.y));
  assert.ok(C.dist(restored, game.core()) <= C.WORKER_RULES.retreatRadius);
});

test('accueil : sans obstacle, le décalage historique et la variation verticale restent conservés', () => {
  const { game } = fresh(), core = game.core();
  game.random.range = min => min;
  injury(game); assert.equal(game.resolveCrisis('A'), true);
  const unit = game.units.at(-1);
  assert.equal(unit.x, core.x + 70); assert.equal(unit.y, core.y - 25);
});

test('arrivées : le rayon entier, y compris au coin d’un mur, est vérifié avant le repli intérieur', () => {
  const { game } = fresh(), core = game.core(), Building = core.constructor;
  const wall = new Building(game.nextId++, 'woodWall', 66, 64, 0, 1); game.world.add(wall);
  for (const preferred of [{ x: wall.left - 5, y: wall.y }, { x: wall.left - 6, y: wall.top - 6 }]) {
    assert.equal(game.world.solidForFriendly(preferred.x, preferred.y), null, 'le seul centre de la silhouette serait accepté');
    assert.ok(T.overlapsBuilding(wall, { ...preferred, radius: game.player.radius }));
    assert.deepEqual(game.coreArrivalPosition(game.player, preferred), { x: core.x, y: core.y });
  }
});

test('arrivées : une porte verrouillée bloque l’arrivée, une porte alliée ou ouverte la conserve', () => {
  const { game } = fresh(), core = game.core(), Building = core.constructor;
  const gate = new Building(game.nextId++, 'gate', 66, 64, 0, 1); game.world.add(gate);
  const preferred = { x: gate.x, y: gate.y };
  gate.gateMode = 'closed';
  assert.deepEqual(game.coreArrivalPosition(game.player, preferred), { x: core.x, y: core.y });
  for (const mode of ['auto', 'open']) {
    gate.gateMode = mode; assert.deepEqual(game.coreArrivalPosition(game.player, preferred), preferred);
  }
});

test('arrivées : les coordonnées hors monde se replient au centre sans traverser une enceinte', () => {
  const { game } = fresh(), core = game.core();
  for (const preferred of [{ x: -1, y: core.y }, { x: core.x, y: C.WORLD_SIZE + 1 }, { x: 1, y: core.y }]) {
    assert.deepEqual(game.coreArrivalPosition(game.player, preferred), { x: core.x, y: core.y });
  }
});
