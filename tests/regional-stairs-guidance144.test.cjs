'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const G = require('../src/frontier-geometry.js');
function stable(g) { const data = g.serialize(); delete data.timestamp; return JSON.stringify(data); }
// Explicit building-position fixtures isolate guidance; they grant no inventory.
function fixture(generation = 3, atStairs = false) {
  const { game: g } = bootGame(); g.startNew('standard', '17117');
  const fresh = g.serialize(); fresh.frontier.generation = generation; g.restoreSave(fresh);
  g.player.x = 4058; g.player.y = 2048; assert.equal(g.frontier.enter(), true);
  const world = g.frontier.world(), building = world.pois.find(p => p.type === 'duplex');
  assert.ok(building); const stairs = world.plan(building, 0).stairs[0];
  const approach = G.global(building, stairs.x + stairs.w / 2, stairs.y + stairs.h / 2);
  let point = approach;
  if (!atStairs) {
    point = null;
    for (let y = .6; y < building.h - .6 && !point; y += .5) for (let x = .6; x < building.w - .6; x += .5) {
      const candidate = G.global(building, x, y);
      if (Math.hypot(candidate.x - approach.x, candidate.y - approach.y) > 3 && !world.blocked(candidate.x, candidate.y, .32, 0, building.id)) { point = candidate; break; }
    }
    assert.ok(point);
  }
  const data = g.serialize(); Object.assign(data.frontier, { x: point.x, y: point.y, inside: building.id, z: 0, seen: [building.id] });
  g.restoreSave(data); return { g, building, approach };
}
test('regional stairs: an out-of-reach floor action explains the actual stair access without changing the campaign', () => {
  const { g } = fixture(), before = stable(g);
  assert.equal(g.frontier.stairs(1), false);
  assert.match(g.notifications.at(-1).text, /Rejoignez l’escalier/i);
  assert.equal(stable(g), before);
});
test('regional stairs: one read-only diagnostic supplies the real destination and persists no guidance state', () => {
  const { g, approach } = fixture(), before = stable(g);
  const status = g.frontier.stairsStatus(1);
  assert.equal(status.ok, false); assert.equal(status.code, 'approach-required');
  assert.deepEqual(status.approach, approach); assert.ok(status.distance > 3); assert.equal(status.level, 1);
  status.approach.x = 0; assert.deepEqual(g.frontier.stairsStatus(1).approach, approach);
  assert.equal(stable(g), before);
});
for (const generation of [1,2,3,4,5,6,7]) test('regional stairs G'+generation+': ready diagnostics and actual vertical access agree without moving horizontally or granting loot', () => {
  const { g } = fixture(generation, true), before = g.frontier.position(), bag = { ...g.player.carry }, stocks = { ...g.resources };
  assert.equal(g.frontier.stairsStatus(1).ok, true); assert.equal(g.frontier.stairs(1), true);
  const after = g.frontier.position(); assert.equal(after.z, 1); assert.equal(after.x, before.x); assert.equal(after.y, before.y);
  assert.deepEqual(g.player.carry, bag); assert.deepEqual(g.resources, stocks);
  assert.equal(g.save(false), true); assert.equal(g.load(), true);
  assert.equal(g.frontier.stairsStatus(-1).ok, true); assert.equal(g.frontier.stairs(-1), true);
  assert.equal(g.frontier.position().z, 0); assert.deepEqual(g.player.carry, bag); assert.deepEqual(g.resources, stocks);
});
test('regional stairs: the shared diagnostic still refuses a blocked landing before any persistent mutation', () => {
  const { g } = fixture(3, true), world = g.frontier.world(), blocked = world.blocked.bind(world), before = stable(g);
  world.blocked = (...args) => args[3] === 1 || blocked(...args);
  try {
    assert.equal(g.frontier.stairsStatus(1).code, 'landing-blocked'); assert.equal(g.frontier.stairs(1), false);
    assert.equal(stable(g), before);
  } finally { world.blocked = blocked; }
});
