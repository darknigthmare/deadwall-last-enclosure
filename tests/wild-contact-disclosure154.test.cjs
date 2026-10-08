'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { boot127 } = require('./helpers/expansions127.cjs');
const V = require('../src/visibility146.js'), C = require('../src/core.js');

function fresh() {
  const { game: g } = boot127(); V.install(g);
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  // Map seeds reproduce terrain; this prepared director sequence avoids Date.now().
  g.random = new C.Random(17117);
  g.daylight = () => 1;
  for (const b of g.world.buildings.values()) b.siegeOffline = true;
  const messages = []; g.notify = (message, type) => messages.push({ message, type });
  return { g, messages };
}
function noPosts(g) { for (const b of g.world.buildings.values()) b.siegeOffline = true; }
function born(g) { return g.serialize().zombies; }

test('154: an unobserved wild band reveals neither its settlement nor its hidden count through notifications', () => {
  const { g, messages } = fresh(); g.units = [];
  const checkpoint = g.serialize();
  assert.equal(g.exploration125.spawnWildHorde(), true);
  assert.equal(g.zombies.length, 2); assert.equal(g.exploration125.wildHordes, 1);
  assert.deepEqual(g.zombies.map(z => g.visibility.canSeeLocal(z)), [false, false]);
  assert.deepEqual(messages, [], 'The actual daylight observer sees neither generated contact.');
  const expected = born(g), rng = g.random.state;
  g.restoreSave(checkpoint); noPosts(g); messages.length = 0;
  assert.equal(g.exploration125.spawnWildHorde(), true);
  assert.deepEqual(born(g), expected); assert.equal(g.random.state, rng, 'Observation consumes no gameplay RNG.');
  assert.deepEqual(messages, []);
  const saved = g.serialize(); g.restoreSave(saved);
  assert.deepEqual(born(g), saved.zombies); assert.equal(g.exploration125.wildHordes, 1);
  assert.deepEqual(messages, [], 'Continue does not announce previously hidden contacts.');
});

test('154: a real nearby worker observes one member at night without disclosing the other member', () => {
  const { g, messages } = fresh(); g.daylight = () => 0;
  const worker = g.units[0]; g.units = [worker];
  const checkpoint = g.serialize();
  assert.equal(g.exploration125.spawnWildHorde(), true);
  const expected = born(g), rng = g.random.state, first = g.zombies[0];
  let stance;
  for (let i = 0; i < 16 && !stance; i++) {
    const a = i * Math.PI / 8, p = { x: first.x + Math.cos(a) * 28, y: first.y + Math.sin(a) * 28 };
    if (g.friendlyPositionClear(worker, p.x, p.y) && g.hostileLineClear(p, first, false)) stance = p;
  }
  assert.ok(stance, 'A generated contact has a physically accessible nearby lookout stance.');
  g.restoreSave(checkpoint); noPosts(g); Object.assign(g.units[0], stance); messages.length = 0;
  assert.equal(g.exploration125.spawnWildHorde(), true);
  assert.deepEqual(g.zombies.map(z => g.visibility.canSeeLocal(z)), [true, false]);
  assert.deepEqual(born(g), expected); assert.equal(g.random.state, rng);
  assert.equal(messages.length, 1); assert.equal(messages[0].type, 'danger');
  assert.match(messages[0].message, /Bande errante observée.*1 contact observé\./);
  assert.doesNotMatch(messages[0].message, /2 contacts/);
});

test('154: lack of a visibility service never supplies director knowledge as an enemy observation', () => {
  const { g, messages } = fresh(); delete g.visibility;
  assert.equal(g.exploration125.spawnWildHorde(), true);
  assert.equal(g.zombies.length, 2); assert.equal(g.exploration125.wildHordes, 1);
  assert.deepEqual(messages, []);
});
