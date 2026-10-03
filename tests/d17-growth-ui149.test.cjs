'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { standAt } = require('./helpers/physical-fixtures.cjs');

function warehouse(g) {
  const core = g.core();
  for (let radius = 6; radius < 35; radius++) {
    for (const [dx, dy] of [[radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
      const gx = core.gx + dx, gy = core.gy + dy;
      if (!g.world.placement(C.BUILDINGS.warehouse, gx, gy, 0).valid) continue;
      assert.equal(g.placeOne('warehouse', gx, gy), true);
      return g.world.atCell(gx, gy);
    }
  }
  throw new Error('No legal warehouse foundation');
}

test('D17 growth dossier explains a late storage bottleneck and follows completed and lost warehouses', () => {
  const { g, doc } = bootDocument134();
  g.startNew('standard', '17117');
  g.campaignIntro132.skip();
  g.units = [];
  // Explicit previously reached age fixture. It grants no building or materials.
  g.urban.attain(1200);
  g.refreshMetrics(true);
  const row = () => doc.getElementById('urbanCurrentModels').children.find(n => n.dataset.model === 'megaTower');
  const warning = () => row().children.find(n => n.dataset.storageWarning === 'megaTower');
  g.coordinationUI.open();
  g.urbanUI.refresh(true);
  assert.match(warning().textContent, /1600 par ressource nécessaires, 500 actuellement/);
  assert.match(warning().textContent, /Construisez et achevez du stockage/);
  const before = JSON.stringify(g.resources);
  g.urbanUI.refresh(true);
  assert.equal(JSON.stringify(g.resources), before, 'a diagnostic never pays for construction');

  const stores = [];
  for (const capacity of [1100, 1700]) {
    g.showCommand(false);
    const b = warehouse(g);
    stores.push(b);
    g.coordinationUI.open();
    g.urbanUI.refresh(true);
    assert.ok(warning(), 'a paid foundation does not provide capacity');
    g.showCommand(false);
    standAt(g, g.player, b);
    g.input.keys.add('KeyE');
    for (let i = 0; i < 1200 && !b.completed; i++) g.updateInteraction(.1);
    g.input.keys.clear();
    assert.equal(b.completed, true);
    g.refreshMetrics(true);
    assert.equal(g.storage, capacity);
    g.coordinationUI.open();
    g.urbanUI.refresh(true);
    if (capacity < 1600) assert.match(warning().textContent, /1100 actuellement/);
    else assert.equal(warning(), undefined, 'the actual completed capacity permits that cost');
  }
  g.showCommand(false);
  g.destroyBuilding(stores[1]);
  g.refreshMetrics(true);
  g.coordinationUI.open();
  g.urbanUI.refresh(true);
  assert.match(warning().textContent, /1600 par ressource nécessaires, 1100 actuellement/);
});
