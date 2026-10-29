'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const material = ({ timestamp, ...data }) => data;

function currentWalker() {
  const { g } = bootDocument134();
  assert.notEqual(g.startNew('standard', '17117', 'classic', 'balanced', true), false);
  g.campaignIntro132.skip();
  g.togglePause(true);
  assert.equal(g.world.cityGeometry202, 1);
  assert.equal(g.exploration125.layoutRevision, 4);
  assert.equal(g.spawnZombie('walker'), true);
  const node = g.world.nodes.find(n => n.id === 168), walker = g.zombies.at(-1);
  assert.equal(node.metric202, 1);
  assert.deepEqual(node.body202, { w: 147.2, h: 59.2 });
  return { g, node, walker, Save: globalThis.DeadwallSave, F: globalThis.DeadwallFieldcraft };
}

function stored(g, Save) {
  assert.equal(g.save(true), true);
  return Save.parse(localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY));
}

test('216 metric Continue preserves an admitted saved hostile pose before physical recovery', () => {
  const { g, node, walker, Save, F } = currentWalker();
  // Declared fixture: a native walker beside the real body of vehicle node 168.
  // The same pose overlaps the temporary, non-metric collider rebuilt by WorldMap.
  const radius = walker.radius * .7, point = { x: node.x, y: g.fieldcraft.rect(node).t - radius - .01 };
  Object.assign(walker, point);
  const raw = new g.world.constructor(g.world.seed, 1).nodes.find(n => n.id === node.id);
  Object.assign(raw, { x: node.x, y: node.y });
  assert.equal(F.collides(node, point.x, point.y, radius), false);
  assert.equal(F.collides(raw, point.x, point.y, radius), true);
  assert.equal(g.hostilePositionClear(walker, point.x, point.y), true);
  const before = stored(g, Save), geometry = copy(node.body202);

  assert.equal(g.restoreSave(before), true);
  const after = Save.validate(g.serialize());
  assert.deepEqual(after.zombies, before.zombies, 'Continue must not relocate a physically valid saved actor');
  assert.deepEqual(material(after), material(before), 'positions, IDs, finite stocks, possessions and RNG remain authoritative');
  assert.deepEqual(g.world.nodes.find(n => n.id === node.id).body202, geometry);
  const restored = g.zombies.find(z => z.id === walker.id);
  assert.equal(g.hostilePositionClear(restored, restored.x, restored.y), true);
});

test('216 metric Continue still recovers a hostile inside a real solid without changing other saved state', () => {
  const { g, node, walker, Save, F } = currentWalker();
  // Deliberately invalid fixture: the centre of the same real solid must recover.
  Object.assign(walker, { x: node.x, y: node.y });
  assert.equal(F.collides(node, walker.x, walker.y, walker.radius * .7), true);
  assert.equal(g.hostilePositionClear(walker, walker.x, walker.y), false);
  const before = stored(g, Save);

  assert.equal(g.restoreSave(before), true);
  const after = Save.validate(g.serialize()), restored = g.zombies.find(z => z.id === walker.id);
  assert.notDeepEqual({ x: restored.x, y: restored.y }, { x: walker.x, y: walker.y });
  assert.equal(g.hostilePositionClear(restored, restored.x, restored.y), true);
  const withoutPose = ({ x, y, ...actor }) => actor;
  assert.deepEqual(after.zombies.map(withoutPose), before.zombies.map(withoutPose));
  const { zombies: beforeActors, ...beforeWorld } = material(before), { zombies: afterActors, ...afterWorld } = material(after);
  assert.deepEqual(afterWorld, beforeWorld, 'recovery changes only the invalid actor position');
});

test('216 CommonJS metric preparation leaves historical revisions and non-metric worlds intact', () => {
  const { game: g } = require('./helpers/browser.cjs').bootGame();
  const E = require('../src/exploration-125.js');
  assert.equal(E.install(g, document), true);
  assert.equal(typeof g.exploration125.prepareMetricScenery202, 'function');
  const originalWorld = g.world;
  try {
    g.world = new originalWorld.constructor(17117, 1);
    const originalNodes = copy(g.world.nodes);
    for (const revision of [undefined, 1, 2, 3]) {
      g.exploration125.prepareMetricScenery202(revision);
      assert.deepEqual(copy(g.world.nodes), originalNodes, 'historical layout ' + revision);
    }
    g.world.cityGeometry202 = 0;
    g.exploration125.prepareMetricScenery202(4);
    assert.deepEqual(copy(g.world.nodes), originalNodes, 'non-metric city');
    g.world.cityGeometry202 = 1;
    g.exploration125.prepareMetricScenery202(4);
    const withoutDerived = ({ metric202, body202, renderSize, ...node }) => node;
    assert.deepEqual(g.world.nodes.map(withoutDerived), originalNodes.map(withoutDerived));
    assert.deepEqual(g.world.nodes.find(n => n.id === 168).body202, { w: 147.2, h: 59.2 });
  } finally { g.world = originalWorld; }
});
