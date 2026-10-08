'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
let g, C, G;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; G = globalThis.DeadwallFrontierGeometry; });
const clone = value => JSON.parse(JSON.stringify(value));
function upstairs({ due = false } = {}) {
  g.startNew('standard', '17117'); g.campaignIntro132.skip(); g.phaseTime = 999;
  const w = g.frontier.world(); let scene;
  for (const place of w.pois.filter(p => p.levels.includes(1))) {
    const stair = w.plan(place, 0).stairs[0]; if (!stair) continue;
    const point = G.global(place, stair.x + stair.w / 2, stair.y + stair.h / 2);
    const road = w.nearestRoad(point).road, center = G.nearest(point, road.a, road.b);
    if (center.d < 75 && Math.hypot(center.x - w.home.x, center.y - w.home.y) > C.WorldEvolution.RULES.homeExclusion + 300 &&
      !w.blocked(center.x, center.y, .32, 0, null) && !w.blocked(point.x, point.y, .32, 0, place.id) && !w.blocked(point.x, point.y, .32, 1, place.id)) { scene = { place, point, road, center }; break; }
  }
  assert.ok(scene, 'A real stair has clear ground and upper landings.');
  const save = g.serialize();
  Object.assign(save.frontier, { active: true, anchor: { x: g.player.x, y: g.player.y }, ...scene.point, z: 0, inside: scene.place.id });
  save.frontier.seen = [scene.place.id];
  for (const place of w.nearPOI(scene.point.x, scene.point.y, 150)) for (let i = 0; i < w.threatCount(place); i++) save.frontier.enemies[place.id + ':e' + i] = 0;
  save.frontier.kills = Object.values(save.frontier.enemies).filter(n => n === 0).length;
  const { road, center } = scene;
  const contact = { ...center, z: 0, a: Math.atan2(road.b.y - road.a.y, road.b.x - road.a.x), mode: 'idle', ttl: 0, gx: center.x, gy: center.y, cool: 0 };
  Object.assign(save.worldEvolution, { serial: 1, clock: 10, nextHorde: due ? 10.08 : 10000,
    groups: [{ id: 'W0000', kind: 'migrating', count: 80, lost: 0, wound: 0, ...center, a: contact.a, seen: false, contacts: { 0: contact } }] });
  assert.equal(g.restoreSave(save), true);
  assert.equal(g.frontier.stairsStatus(1).ok, true); assert.equal(g.frontier.stairs(1), true);
  assert.equal(g.frontier.position().z, 1); assert.equal(g.worldEvolution.groupMembers().length, 0);
  return { w, ...scene };
}
function step(seconds) { for (let left = seconds; left > 1e-7; left -= .04) { g.update(Math.min(.04, left)); g.input.pressed.clear(); } }
function resources() { return { carry: { ...g.player.carry }, stock: { ...g.resources }, taken: g.frontier.snapshot().taken, seen: g.frontier.discoveries() }; }
function returnDown() { assert.equal(g.frontier.stairsStatus(-1).ok, true); assert.equal(g.frontier.stairs(-1), true); assert.equal(g.frontier.position().z, 0); }

test('153 world floors: a native stair does not freeze the exterior migration clock, while pause and Save/Continue retain their normal boundaries', () => {
  upstairs(); const before = g.worldEvolution.snapshot(), held = resources(), health = g.player.health;
  step(1); const advanced = g.worldEvolution.snapshot();
  assert.ok(Math.abs(advanced.clock - before.clock - 1) < 1e-7);
  assert.ok(Math.hypot(advanced.groups[0].x - before.groups[0].x, advanced.groups[0].y - before.groups[0].y) > .5);
  assert.equal(g.worldEvolution.groupMembers().length, 0); assert.equal(g.player.health, health);
  assert.deepEqual(g.player.carry, held.carry); assert.deepEqual(g.frontier.snapshot().taken, held.taken);
  const saved = g.serialize(), rng = g.random.state;
  assert.equal(g.save(false), true); assert.equal(g.load(), true);
  assert.deepEqual(g.worldEvolution.snapshot(), advanced); assert.equal(g.random.state, rng);
  assert.equal(g.frontier.position().z, 1); assert.deepEqual(g.player.carry, saved.player.carry);
  g.togglePause(true); const paused = clone(g.worldEvolution.snapshot()); step(.5);
  assert.deepEqual(g.worldEvolution.snapshot(), paused); assert.equal(g.worldEvolution.groupMembers().length, 0);
  g.togglePause(false); returnDown(); const clock = g.worldEvolution.snapshot().clock;
  step(.04); assert.ok(Math.abs(g.worldEvolution.snapshot().clock - clock - .04) < 1e-7);
  const contacts = g.worldEvolution.groupMembers(); assert.ok(contacts.length > 0);
  assert.ok(contacts.every(e => e.z === 0));
  assert.deepEqual(g.frontier.snapshot().taken, held.taken); assert.deepEqual(g.player.carry, held.carry);
});

test('153 world floors: an exterior horde event due while upstairs spawns outdoors without exposing contacts or damaging the upper-floor actor', () => {
  const { w } = upstairs({ due: true }), health = g.player.health, held = resources(), before = g.worldEvolution.snapshot();
  step(.12); const after = g.worldEvolution.snapshot();
  assert.equal(after.groups.length, before.groups.length + 1);
  assert.equal(after.serial, before.serial + 1); assert.ok(after.nextHorde > after.clock);
  assert.equal(g.worldEvolution.groupMembers().length, 0); assert.equal(g.frontier.position().z, 1);
  assert.equal(g.player.health, health); assert.deepEqual(g.player.carry, held.carry);
  assert.deepEqual(g.frontier.snapshot().taken, held.taken);
  const spawned = after.groups.at(-1);
  assert.ok(Math.hypot(spawned.x - w.home.x, spawned.y - w.home.y) > C.WorldEvolution.RULES.homeExclusion);
  assert.ok(Object.values(spawned.contacts).every(e => e.z === 0));
  assert.equal(globalThis.DeadwallSave.validate(g.serialize()).version, 20);
  returnDown(); step(.04); const contacts = g.worldEvolution.groupMembers(); assert.ok(contacts.length > 0);
  assert.ok(contacts.every(e => e.z === 0));
});
