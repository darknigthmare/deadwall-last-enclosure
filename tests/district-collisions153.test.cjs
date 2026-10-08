'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
let g, C, G;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; G = globalThis.DeadwallFrontierGeometry; });
function fresh(seed = '17117', generation = 7) {
  g.startNew('standard', seed); g.campaignIntro132.skip();
  if (generation !== 7) { const raw = g.serialize(); Object.assign(raw.frontier, { generation, x: 4096, y: 4096, z: 0, inside: null }); assert.equal(g.restoreSave(raw), true); }
  g.tier = { id: 4 }; for (const key of C.RESOURCE_KEYS) g.resources[key] = 10000;
}
function point(id, x, y) { const p = g.worldEvolution.overview().districts.find(d => d.id === id).pos; return { ...G.global({ ...p, w: 0, h: 0 }, x, y), a: p.a }; }
function hit(p, vehicle = null) { return g.worldEvolution.districtBlocked(p.x, p.y, .32, vehicle); }
function build(id, count = 1) { assert.equal(g.worldEvolution.claimDistrict(id), true); for (let i = 0; i < count; i++) assert.equal(g.worldEvolution.buildDistrict(id, i % 2 ? 'watch' : 'housing'), true); }

test('153 district collision: planned annex foundations reserve their actual footprint immediately while the central passage remains accessible', () => {
  fresh(); const left = point('east', -12, -17.5), right = point('east', 16, -17.5), gap = point('east', 2, -17.5);
  assert.equal(hit(left), false); assert.equal(hit(right), false);
  assert.equal(g.worldEvolution.claimDistrict('east'), true); assert.equal(hit(left), false);
  assert.equal(g.worldEvolution.buildDistrict('east', 'housing'), true); assert.equal(hit(left), true); assert.equal(hit(right), false);
  assert.equal(g.worldEvolution.buildDistrict('east', 'watch'), true); assert.equal(hit(right), true);
  assert.equal(hit(gap), false); assert.equal(hit(gap, { a: gap.a, w: 4.6, h: 1.85 }), false);
  assert.equal(hit(left, { a: left.a + Math.PI / 4, w: 4.6, h: 1.85 }), true);
  const before = g.worldEvolution.snapshot(), rng = g.random.state;
  for (let i = 0; i < 100; i++) { assert.equal(hit(left), true); assert.equal(hit(gap), false); }
  assert.deepEqual(g.worldEvolution.snapshot(), before); assert.equal(g.random.state, rng);
});

test('153 district collision: all five annex orientations preserve pedestrian and vehicle boundaries in generations 4 and 7', () => {
  for (const generation of [4, 7]) {
    fresh('17117', generation);
    for (const id of ['east', 'west', 'north', 'south', 'outer']) {
      build(id, 8);
      for (const [x, y] of [[-12, -17.5], [16, -17.5], [-12, 21.5], [16, 21.5]]) {
        const p = point(id, x, y); assert.equal(hit(p), true);
        for (const turn of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) assert.equal(hit(p, { a: p.a + turn, w: 4.6, h: 1.85 }), true);
      }
      assert.equal(hit(point(id, -30, -17.5)), false); assert.equal(hit(point(id, 2, -17.5)), false);
    }
  }
});

test('153 district collision: restoring an older plan, changing seed and starting again replace the physical blockers without stale geometry', () => {
  fresh(); const before = g.serialize(), p = point('east', -12, -17.5);
  assert.equal(hit(p), false); build('east'); assert.equal(hit(p), true);
  assert.equal(g.restoreSave(before), true); assert.equal(hit(p), false);
  g.tier = { id: 4 }; build('east'); const after = g.serialize(), rng = g.random.state;
  assert.equal(g.restoreSave(after), true); assert.equal(hit(p), true); assert.equal(g.random.state, rng);
  fresh('84329'); const next = point('east', -12, -17.5);
  assert.ok(Math.hypot(next.x - p.x, next.y - p.y) > 100); assert.equal(hit(p), false); assert.equal(hit(next), false);
  build('east'); assert.equal(hit(next), true); assert.equal(hit(p), false);
  fresh('84329'); assert.equal(hit(next), false);
});
