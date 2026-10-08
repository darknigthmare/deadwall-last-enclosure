'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

test('152: physical siege flames illuminate a contact for a living observer even while the burning support is offline', () => {
  const { g } = bootDocument134(); g.startNew('standard', '17117'); g.campaignIntro132.skip();
  const C = globalThis.DeadwallCore, Building = g.core().constructor;
  let scene;
  for (let y = 700; y < 3500 && !scene; y += 96) for (let x = 700; x < 3400; x += 96) {
    const player = { x, y }, enemy = { x: x + 5 * 32, y, health: 60, dead: false }, gx = Math.floor(enemy.x / 32), gy = Math.floor(enemy.y / 32) + 2;
    if (!g.world.placement(C.BUILDINGS.house, gx, gy, 0).valid || !g.friendlyPositionClear(g.player, x, y) || !g.friendlyPositionClear({ radius: 10 }, enemy.x, enemy.y) || !g.hostileLineClear(player, enemy)) continue;
    const b = new Building(g.nextId++, 'house', gx, gy, 0, 1); g.world.add(b);
    if (Math.hypot(b.x - enemy.x, b.y - enemy.y) * 1.0 < 100 && g.hostileLineClear(player, enemy)) { scene = { player, enemy, b }; break; }
    g.world.remove(b);
  }
  assert.ok(scene, 'A real house and clear observer ray fit the existing fire light radius.');
  Object.assign(g.player, scene.player); g.units = []; g.daylight = () => 0;
  for (const b of g.world.buildings.values()) b.siegeOffline = true;
  g.nightwatch.invalidate(); assert.equal(g.visibility.canSeeLocal(scene.enemy), false);
  const save = g.serialize();
  save.siege.fires = [{ id: scene.b.id, heat: C.Siege.RULES.initialHeat, age: 0, spread: 0, origin: 'spread' }];
  save.siege.stats.ignitions = 1;
  g.restoreSave(save); g.units = []; g.daylight = () => 0;
  for (const b of g.world.buildings.values()) if (b.id !== scene.b.id) b.siegeOffline = true;
  g.nightwatch.invalidate();
  const burning = g.world.buildings.get(scene.b.id), light = g.nightwatch.sources(false).find(s => s.id === burning.id);
  assert.equal(burning.siegeOffline, true); assert.ok(light); assert.equal(light.fire, true);
  assert.ok(g.nightwatch.lit(scene.enemy, [light]), 'The existing night painter physically illuminates the contact.');
  assert.equal(g.visibility.canSeeLocal(scene.enemy), true, 'Flames are physical light while the building service remains offline.');
  let fireReads = 0; const siege = g.siege;
  g.siege = { ...siege, snapshot() { fireReads++; return siege.snapshot(); } };
  g.nightwatch.invalidate(); const frame = g.visibility.frame();
  for (let i = 0; i < C.PERFORMANCE_LIMITS.zombies; i++) assert.equal(frame.canSeeLocal(scene.enemy), true);
  assert.ok(fireReads <= 2, 'A map paint reads the bounded fire ledger once besides collecting its light sources.');
  g.siege = siege;
  const before = g.serialize(), rng = g.random.state;
  for (let i = 0; i < 10; i++) assert.equal(g.visibility.canSeeLocal(scene.enemy), true);
  const after = g.serialize(); delete before.timestamp; delete after.timestamp;
  assert.deepEqual(after, before); assert.equal(g.random.state, rng);
  g.player.health = 0; g.player.dead = true;
  assert.equal(g.visibility.canSeeLocal(scene.enemy), false, 'Flames never replace an observer.');
  before.siege.fires = []; g.restoreSave(before); g.units = []; g.daylight = () => 0;
  for (const b of g.world.buildings.values()) b.siegeOffline = true;
  g.nightwatch.invalidate();
  assert.equal(g.nightwatch.sources(false).some(s => s.fire === true), false);
  assert.equal(g.visibility.canSeeLocal(scene.enemy), false, 'Removing the physical fire removes its light from the next map paint.');
});
