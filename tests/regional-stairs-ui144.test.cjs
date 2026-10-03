'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { fixture, pose } = require('./helpers/navigation130.cjs');
const G = require('../src/frontier-geometry.js');
function setup() {
  const env = fixture({ ui: true }), { g } = env, world = g.frontier.world();
  const building = world.pois.find(p => p.type === 'duplex'), pad = world.plan(building, 0).stairs[0];
  const approach = G.global(building, pad.x + pad.w / 2, pad.y + pad.h / 2);
  let away;
  for (let y = .6; y < building.h - .6 && !away; y += .5) for (let x = .6; x < building.w - .6; x += .5) {
    const q = G.global(building, x, y);
    if (Math.hypot(q.x - approach.x, q.y - approach.y) > 3 && !world.blocked(q.x, q.y, .32, 0, building.id)) { away = q; break; }
  }
  assert.ok(away); return { ...env, building, approach, away };
}
// Explicit physically free pose fixtures; the UI neither moves the player nor grants stock.
test('regional stairs HUD: modern and legacy controls disable an unreachable staircase and show the same actual approach', () => {
  const { g, doc, building, away } = setup(); pose(g, away, { inside: building.id });
  g.frontierUI.refresh(true); g.worldEvolutionUI.refresh(true);
  for (const id of ['frontierUp', 'dockUp']) {
    const control = doc.getElementById(id); assert.equal(control.disabled, true);
    assert.match(control.getAttribute('aria-label'), /Escalier : \d+\.\d m (?:E|SE|S|SO|O|NO|N|NE) · Rejoignez l’escalier/);
  }
  assert.equal(doc.getElementById('fieldDockStairs').textContent, doc.getElementById('frontierStairs').textContent);
  assert.equal(doc.getElementById('fieldDockStairs').getAttribute('role'), 'status');
});
test('regional stairs HUD: actual clear access enables the modern button, which follows the shared vertical controller', () => {
  const { g, doc, building, approach } = setup(); pose(g, approach, { inside: building.id });
  g.worldEvolutionUI.refresh(true); const up = doc.getElementById('dockUp'); assert.equal(up.disabled, false);
  const before = g.frontier.position(), bag = { ...g.player.carry }, stocks = { ...g.resources };
  // This fake DOM does not dispatch onclick properties; real DOM clicks are covered in Chromium.
  up.onclick(); const after = g.frontier.position(); assert.equal(after.z, 1); assert.equal(after.x, before.x); assert.equal(after.y, before.y);
  assert.deepEqual(g.player.carry, bag); assert.deepEqual(g.resources, stocks);
  g.worldEvolutionUI.refresh(true); assert.equal(doc.getElementById('dockDown').disabled, false);
});
test('regional stairs HUD: refresh moves focus from a newly unreachable floor action to the available map control', () => {
  const { g, doc, building, approach, away } = setup(); pose(g, approach, { inside: building.id });
  g.worldEvolutionUI.refresh(true); doc.getElementById('dockUp').focus();
  pose(g, away, { inside: building.id }); g.worldEvolutionUI.refresh(true);
  assert.equal(doc.activeElement.id, 'fieldDockMap'); assert.equal(doc.getElementById('dockUp').disabled, true);
});
