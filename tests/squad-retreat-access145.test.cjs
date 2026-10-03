'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { boot127 } = require('./helpers/expansions127.cjs');

function fresh() {
  const { game } = boot127();
  game.startNew('standard', '17117');
  const Unit = game.units[0].constructor;
  game.world.nodes.forEach(node => { node.amount = 0; node.depleted = true; });
  game.units = []; game.zombies = [];
  return { game, Unit };
}

function add(game, type, gx, gy, rotation = 0) {
  const building = new (game.core().constructor)(game.nextId++, type, gx, gy, rotation, 1);
  game.world.add(building);
  return building;
}

function tick(game, count = 1) {
  for (let step = 0; step < count; step++) {
    const positions = game.units.map(unit => ({ unit, x: unit.x, y: unit.y,
      maxStep: unit.speed * .04 * (game.infrastructure?.speed(unit.x, unit.y) || 1) }));
    game.elapsed += .04;
    game.updateUnits(.04);
    for (const before of positions) {
      assert.ok(C.dist(before, before.unit) <= before.maxStep + 1e-7, 'déplacement physique borné par la vitesse existante');
      assert.equal(game.friendlyPositionClear(before.unit, before.unit.x, before.unit.y), true);
    }
  }
}

// The redoubt placement is valid in the generated plan. The native wreck
// road-wreck-11 obstructs its south face; no obstacle or route is injected.
function wreckFixture() {
  const { game, Unit } = fresh();
  assert.equal(game.world.placement(C.BUILDINGS.fallbackRedoubt, 83, 35, 0).valid, true);
  const redoubt = add(game, 'fallbackRedoubt', 83, 35);
  const soldier = new Unit(game.nextId++, 'soldier', 2704, 1252);
  soldier.squad = 0; soldier.offset = { x: 0, y: 0 }; game.units.push(soldier);
  assert.equal(game.friendlyPositionClear(soldier, soldier.x, soldier.y), true);
  assert.equal(game.fieldcraft.distance(soldier, redoubt), C.SQUAD_RULES.retreatRadius);
  assert.equal(game.workerCanWorkAt(soldier, redoubt, C.SQUAD_RULES.retreatRadius), false);
  return { game, redoubt, soldier };
}

test('145 repli : une section à portée contourne réellement une épave avant son arrivée', () => {
  const { game, redoubt, soldier } = wreckFixture(), before = { x: soldier.x, y: soldier.y };
  const stocks = { ...game.resources };
  assert.equal(game.retreatSquad(0, redoubt), true);
  tick(game, 50);
  assert.notDeepEqual({ x: soldier.x, y: soldier.y }, before);
  assert.equal(game.workerCanWorkAt(soldier, redoubt, C.SQUAD_RULES.retreatRadius), true);
  assert.equal(game.friendlyPositionClear(soldier, soldier.x, soldier.y), true);
  assert.deepEqual(game.resources, stocks);
  const arrived = { x: soldier.x, y: soldier.y }; tick(game, 25);
  assert.deepEqual({ x: soldier.x, y: soldier.y }, arrived);
});

test('145 repli : le diagnostic garde un échec de route si la portée masque un accès bloqué', () => {
  const { game, redoubt, soldier } = wreckFixture();
  assert.equal(game.retreatSquad(0, redoubt), true);
  // Failed-route state is the existing navigator contract, not a new order.
  soldier.navigation = { cells: null };
  assert.equal(game.getSquadSummary()[0].blocked, 1);
  Object.assign(soldier, game.fieldcraft.service(soldier, redoubt));
  assert.equal(game.workerCanWorkAt(soldier, redoubt, C.SQUAD_RULES.retreatRadius), true);
  assert.equal(game.getSquadSummary()[0].blocked, 0);
});

test('145 repli : la reprise retrouve le détour physique sans gains ni déplacement au chargement', () => {
  const { game, redoubt, soldier } = wreckFixture();
  assert.equal(game.retreatSquad(0, redoubt), true);
  const saved = JSON.parse(JSON.stringify(game.serialize()));
  assert.equal(game.restoreSave(saved), true);
  const restored = game.units.find(unit => unit.id === soldier.id);
  const destination = game.world.buildings.get(redoubt.id);
  assert.deepEqual({ x: restored.x, y: restored.y }, { x: soldier.x, y: soldier.y });
  assert.deepEqual(game.resources, saved.resources);
  assert.equal(game.squads.groups[0].retreatBuildingId, redoubt.id);
  assert.equal(game.workerCanWorkAt(restored, destination, C.SQUAD_RULES.retreatRadius), false);
  tick(game, 50);
  assert.equal(game.workerCanWorkAt(restored, destination, C.SQUAD_RULES.retreatRadius), true);
  assert.deepEqual(game.resources, saved.resources);
});

test('145 repli : le centre reste derrière la porte verrouillée puis est rejoint par son accès automatique', () => {
  const { game, Unit } = fresh(), core = game.core(), column = core.gx + core.w + 2;
  for (let y = 0; y < C.WORLD_TILES; y++) if (y !== core.gy && y !== core.gy + 1) add(game, 'woodWall', column, y);
  const gate = add(game, 'gate', column, core.gy, 1); gate.gateMode = 'closed';
  const soldier = new Unit(game.nextId++, 'soldier', C.world(column + 2), gate.y);
  soldier.squad = 0; soldier.offset = { x: 0, y: 0 }; game.units.push(soldier);
  assert.equal(game.retreatSquad(0, core), true);
  const before = { x: soldier.x, y: soldier.y }; tick(game, 50);
  assert.deepEqual({ x: soldier.x, y: soldier.y }, before);
  assert.equal(game.getSquadSummary()[0].blocked, 1);
  assert.equal(game.setGateMode('auto', gate), true);
  for (let step = 0; step < 500 && !game.workerCanWorkAt(soldier, core, C.SQUAD_RULES.retreatRadius); step++) {
    tick(game);
    assert.equal(game.friendlyPositionClear(soldier, soldier.x, soldier.y), true);
  }
  assert.ok(soldier.x < gate.left);
  assert.equal(game.workerCanWorkAt(soldier, core, C.SQUAD_RULES.retreatRadius), true);
});
