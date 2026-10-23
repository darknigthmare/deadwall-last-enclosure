'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const C = require('../src/core.js'), E = require('../src/exploration-125.js');
const stable = g => { const { timestamp, ...data } = g.serialize(); return structuredClone(data); };
// Some shipped scenery nodes carry their harvest method as an own property.
// Compare their entire serializable state, including geometry and finite stock.
const nodeState = g => JSON.parse(JSON.stringify(g.world.nodes));
const roads = g => structuredClone({ natural: g.exploration125.plan.roads,
  local: g.exploration125.plan.settlements.map(s => ({ street: s.street, connector: s.connector })),
  funded: g.infrastructure.snapshot().roads });
function fresh() {
  const { g } = bootDocument134({ search: '?tools=1&fixture=legacy' });
  g.startNew('standard', '17117'); g.campaignIntro132.skip(); return g;
}

test('banc reconstruction144 : parcelle native légale, gisements/routes intacts et destruction réelle avant reconstruction payée', async () => {
  const { reconstructionFixture } = await import('../scripts/browser-reconstruction-fixture144.mjs');
  const g = fresh(), before = stable(g), natural = roads(g), nodes = nodeState(g);
  const oldPlot = g.world.placement(C.BUILDINGS.house, 74, 70, 0);
  assert.equal(oldPlot.valid, false); assert.match(oldPlot.reason, /Chaussée|voie financée/);
  const destroy = g.destroyBuilding; let destroyed = 0, randomBeforeDestruction, randomAfterDestruction;
  g.destroyBuilding = function (b) {
    destroyed++; randomBeforeDestruction = this.random.state;
    assert.equal(this.world.placement(b.def, b.gx, b.gy, b.rotation, b.id).valid, true);
    const result = destroy.call(this, b); randomAfterDestruction = this.random.state; return result;
  };
  let fixture;
  try { fixture = reconstructionFixture(); } finally { g.destroyBuilding = destroy; }
  assert.equal(destroyed, 1); assert.notDeepEqual([fixture.gx, fixture.gy], [74, 70]);
  assert.equal(randomBeforeDestruction, before.randomState); assert.notEqual(randomAfterDestruction, before.randomState);
  assert.equal(g.random.state, randomAfterDestruction);
  assert.equal(fixture.selection.randomBeforeSearch, before.randomState);
  assert.equal(fixture.selection.randomBeforeDestruction, randomBeforeDestruction);
  assert.equal(fixture.selection.randomAfterDestruction, randomAfterDestruction);
  assert.ok(fixture.selection.examined <= (2 * fixture.selection.maxRadius + 1) ** 2);
  assert.equal(fixture.exhaustedNodes, 0);
  assert.equal(g.world.placement(g.world.definition('house'), fixture.gx, fixture.gy, 0).valid, true);
  const footprint = E.buildingFootprint(g.world.definition('house'), fixture.gx, fixture.gy);
  assert.equal(E.roadFootprint202(g.exploration125.plan, footprint, C.CityRoadRules202.clearance), false);
  assert.equal(g.infrastructure.roadFootprint202(footprint, C.CityRoadRules202.clearance), false);
  assert.deepEqual(nodeState(g), nodes); assert.deepEqual(roads(g), natural);
  assert.equal(g.runId, before.runId); assert.equal(g.nextId, before.nextId + 1);
  for (const [key, amount] of Object.entries(g.resources)) {
    assert.equal(amount, ['wood', 'scrap', 'stone'].includes(key) ? 400 : before.resources[key]);
    assert.ok(Number.isFinite(amount) && amount >= 0);
  }
  assert.equal(g.world.atCell(fixture.gx, fixture.gy), null);
  assert.equal(g.friendlyPositionClear(g.player, g.player.x, g.player.y), true);
  assert.equal(fixture.debris.length, 1); assert.ok(C.bagTotal(fixture.debris[0].remaining) > 0);

  const beforeQuote = stable(g), quote = g.infrastructure.rebuild(fixture.id);
  assert.equal(quote.ok, true, quote.reason); assert.equal(quote.confirm, true); assert.deepEqual(stable(g), beforeQuote);
  assert.equal(g.infrastructure.cancelRebuild(), true); assert.deepEqual(stable(g), beforeQuote);
  assert.equal(g.infrastructure.rebuild(fixture.id).ok, true);
  g.player.reload = 1; const duringReload = stable(g);
  assert.equal(g.infrastructure.confirmRebuild(fixture.id).ok, false); assert.deepEqual(stable(g), duringReload);
  g.player.reload = 0; assert.equal(g.infrastructure.rebuild(fixture.id).ok, true);
  const placed = g.infrastructure.confirmRebuild(fixture.id); assert.equal(placed.ok, true, placed.reason);
  const b = g.world.atCell(fixture.gx, fixture.gy);
  assert.notEqual(b.id, fixture.id); assert.equal(b.progress, 0); assert.equal(b.priority, 3); assert.equal(g.housing, fixture.housing);
  for (const [key, amount] of Object.entries(fixture.resources)) assert.equal(g.resources[key], amount - (fixture.cost[key] || 0));
  assert.deepEqual(g.fortificationPack.snapshot().debris, fixture.debris);
  assert.deepEqual(nodeState(g), nodes); assert.deepEqual(roads(g), natural);
  g.showCommand(false); const point = g.fieldcraft.service(g.player, b);
  assert.ok(point); assert.equal(g.friendlyPositionClear(g.player, point.x, point.y), true);
  Object.assign(g.player, { x: point.x, y: point.y }); g.input.keys.add('KeyE');
  try { for (let n = 0; n < 500 && !b.completed; n++) g.updateInteraction(.1); } finally { g.input.keys.clear(); }
  assert.equal(b.completed, true); assert.equal(g.housing, fixture.housing + fixture.housingGain);
  assert.equal(g.infrastructure.snapshot().stats.reconstructed, fixture.reconstructedBefore + 1);
  assert.equal(g.save(false), true); const saved = g.serialize(), normalized = stable(g);
  assert.equal(g.restoreSave(saved), true); assert.deepEqual(stable(g), normalized);
});

test('banc reconstruction144 : une voie financée déplace la préparation sans effacer sa géométrie ni ses ressources', async () => {
  const { reconstructionFixture } = await import('../scripts/browser-reconstruction-fixture144.mjs');
  const g = fresh();
  // Historical knowledge and the prerequisite office are explicitly prepared.
  // The road itself is financed by the normal quote/commit transaction.
  require('./helpers/legacy-city.cjs').legacyAge(g, C.CITY_TIERS[1].requiredScore);
  require('./helpers/city-content150.cjs').prepare(g, 'planningOffice');
  const base = g.serialize(), first = reconstructionFixture();
  assert.equal(g.restoreSave(base), true); g.showCommand(false);
  const cell = { x: first.gx, y: first.gy }, quote = g.infrastructure.plan(cell, cell);
  assert.equal(quote.ok, true, quote.reason);
  const paid = g.infrastructure.commit(); assert.equal(paid.ok, true, paid.reason);
  const network = roads(g), nodes = nodeState(g), stock = { ...g.resources };
  assert.equal(network.funded.length, 1);
  assert.equal(stock.stone, base.resources.stone - C.Infrastructure.RULES.cost.stone);
  assert.equal(stock.scrap, base.resources.scrap - C.Infrastructure.RULES.cost.scrap);
  const fixture = reconstructionFixture(); assert.notDeepEqual([fixture.gx, fixture.gy], [first.gx, first.gy]);
  assert.deepEqual(roads(g), network); assert.deepEqual(nodeState(g), nodes);
  const footprint = E.buildingFootprint(g.world.definition('house'), fixture.gx, fixture.gy);
  assert.equal(g.infrastructure.roadFootprint202(footprint, C.CityRoadRules202.clearance), false);
  const status = g.infrastructure.reconstructionStatus(fixture.id); assert.equal(status.ok, true, status.reason);
});

test('banc reconstruction144 : absence de parcelle légale refusée avant toute mutation de campagne', async () => {
  const { reconstructionFixture } = await import('../scripts/browser-reconstruction-fixture144.mjs');
  const g = fresh(), before = stable(g), placement = g.world.placement; let examined = 0;
  g.world.placement = () => { examined++; return { valid: false, reason: 'Prepared fully blocked search' }; };
  try { assert.throws(() => reconstructionFixture(), /No legal, physically accessible reconstruction house/); }
  finally { g.world.placement = placement; }
  assert.equal(examined, 33 ** 2); assert.deepEqual(stable(g), before);
});
