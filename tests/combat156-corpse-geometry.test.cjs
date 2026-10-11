'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { standAt } = require('./helpers/physical-fixtures.cjs');
let g, C;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; });
function fresh() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip(); g.phaseTime = 999;
  return g;
}
// Prepared completed structures and moved native actors. Placement, access,
// deaths, paid fitting transactions and save validation remain the game APIs.
function gateScene(rotation, type = 'gate', progress = 1) {
  const Building = g.core().constructor;
  for (let gy = 75; gy < 103; gy += 2) for (let gx = 75; gx < 103; gx += 2) {
    if (!g.world.placement(C.BUILDINGS[type], gx, gy, rotation).valid) continue;
    const b = new Building(g.nextId++, type, gx, gy, rotation, progress); g.world.add(b);
    const p = rotation % 2 ? { x: b.x, y: b.bottom + 30 } : { x: b.right + 30, y: b.y };
    const worker = g.units[0], work = g.workerCleanupPoint(worker, b);
    if (!g.hostilePositionClear({ radius: 10 }, p.x, p.y) || !g.friendlyPositionClear(worker, work.x, work.y) || !g.fieldcraft.service(g.player, b)) { g.world.remove(b); continue; }
    assert.equal(Math.hypot(p.x - b.x, p.y - b.y), 62);
    return { b, p, worker, work };
  }
  assert.fail('A real clear gate extremity and exterior cleanup access must fit the existing seed.');
}
function killAt(p, kind = 'walker') {
  assert.equal(g.spawnZombie(kind), true);
  const z = g.zombies.at(-1); Object.assign(z, p, { health: 0 });
  g.killZombie(z, false); return z;
}
for (const rotation of [0, 1]) test('156 corpse: a death beside gate extremity ' + rotation + ' creates real pressure and survives Continue once', () => {
  fresh(); const { b, p } = gateScene(rotation), kills = g.stats.kills;
  const z = killAt(p, 'bloated');
  assert.equal(b.corpseLoad, C.ENEMIES.bloated.corpseLoad, 'Thirty units from a gate surface remains within the existing 52-unit corpse range.');
  assert.equal(g.stats.kills, kills + 1); assert.equal(g.corpses.length, 1);
  g.killZombie(z, false); assert.equal(b.corpseLoad, C.ENEMIES.bloated.corpseLoad);
  const saved = g.serialize(); assert.equal(saved.version, 20); assert.equal(g.restoreSave(saved), true);
  assert.equal(g.world.buildings.get(b.id).corpseLoad, C.ENEMIES.bloated.corpseLoad);
  assert.equal(g.restoreSave(g.serialize()), true);
  assert.equal(g.world.buildings.get(b.id).corpseLoad, C.ENEMIES.bloated.corpseLoad);
});
for (const rotation of [0, 1]) test('156 corpse: paid finite net catches gate-end deaths ' + rotation + ' and saturates without regenerating', () => {
  fresh(); const { b, p } = gateScene(rotation); g.selectBuilding(b); standAt(g, g.player, b);
  const stock = { ...g.resources }; assert.equal(g.fortificationPack.equip('net', b.id).ok, true);
  for (const [k, amount] of Object.entries(C.FortificationPackRules.netCost)) assert.equal(g.resources[k], stock[k] - amount);
  for (let i = 0; i < C.FortificationPackRules.netCapacity + 1; i++) killAt(p);
  assert.equal(b.corpseLoad, 1); assert.equal(g.fortificationPack.snapshot().fittings.some(f => f.id === b.id), false);
  assert.equal(g.corpses.length, C.FortificationPackRules.netCapacity + 1);
  const raw = g.serialize(); assert.equal(g.restoreSave(raw), true);
  assert.equal(g.world.buildings.get(b.id).corpseLoad, 1);
  assert.equal(g.fortificationPack.snapshot().fittings.some(f => f.id === b.id), false);
});
for (const rotation of [0, 1]) test('156 corpse: exterior worker removes gate-end visual corpse ' + rotation + ' with the existing cleanup rate', () => {
  fresh(); const { b, p, worker, work } = gateScene(rotation); killAt(p);
  // Pressure is explicit here so the visual cleanup regression is independent
  // of the death-assignment regression above.
  b.corpseLoad = 1; Object.assign(worker, work);
  assert.equal(g.workerCanWorkAt(worker, work, C.WORKER_RULES.cleanupRange), true);
  const before = { ...g.resources }, removed = g.clearCorpsesWithWorker(worker, b, .25);
  assert.equal(removed, C.WORKER_RULES.cleanupPerSecond * .25);
  assert.equal(b.corpseLoad, 1 - removed); assert.equal(g.corpses.length, 1, 'Visual removal follows the existing integer pressure threshold.');
  for (let i = 0; i < 4; i++) g.clearCorpsesWithWorker(worker, b, .25);
  assert.equal(b.corpseLoad, 0); assert.equal(g.corpses.length, 0, 'The paid pressure owner and native cleanup agree on the same real footprint.');
  assert.deepEqual(g.resources, before);
});
test('156 corpse: pressure range, incomplete/dead supports and central crisis selection retain their existing contracts', () => {
  fresh(); const { b, p } = gateScene(0); p.x = b.right + 53; killAt(p); assert.equal(b.corpseLoad, 0);
  const previous = b.corpseLoad; b.progress = .5; p.x = b.right + 30; killAt(p); assert.equal(b.corpseLoad, previous);
  b.progress = 1; b.dead = true; killAt(p); assert.equal(b.corpseLoad, previous);
  b.dead = false;
  const expected = [...g.world.buildings.values()].filter(v => !v.dead && v.completed && v.def.wall)
    .sort((a, c) => Math.hypot(a.x - g.core().x, a.y - g.core().y) - Math.hypot(c.x - g.core().x, c.y - g.core().y))[0];
  const rng = g.random.state; assert.equal(g.nearestWall(g.core().x, g.core().y, C.WORLD_SIZE), expected); assert.equal(g.random.state, rng);
});
