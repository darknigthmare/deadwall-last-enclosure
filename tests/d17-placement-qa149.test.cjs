'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const stable = g => { const { timestamp, ...data } = g.serialize(); return structuredClone(data); };

function prepared() {
  const { g, doc } = bootDocument134({ search: '?tools=1&fixture=legacy' });
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  const Building = g.core().constructor;
  // Declared geometry from the failing CI receipt, not a replay of its elapsed campaign.
  for (const [type, gx, gy] of [['house', 65, 68], ['warehouse', 68, 66]]) g.world.add(new Building(g.nextId++, type, gx, gy, 0, 1));
  Object.assign(g.player, { x: 2150.3940000000025, y: 2155.2212879999993 });
  Object.assign(g.camera, { x: g.player.x, y: g.player.y, zoom: 1 }); g.width = 390; g.height = 844;
  // Node has no CSS layout. This explicit portrait safe frame tests the view
  // constraint; the real mobile runner must supply actual layout and hit tests.
  g.hud135 = { measure: () => ({ left: 76, right: 363, top: 333, bottom: 580 }) };
  doc.elementFromPoint = () => doc.getElementById('game');
  return { g, doc };
}

test('149 placement QA: native legal terrain outside the portrait frame becomes selectable by native zoom without a campaign grant', async () => {
  const { inspectPlacement149 } = await import('../scripts/browser-d17-placement149.mjs');
  const { g, doc } = prepared(), before = stable(g);
  let observed = inspectPlacement149('warehouse');
  assert.equal(observed.site, null); assert.ok(observed.unoccupied > 0); assert.ok(observed.rejected.outsideSafeFrame > 0);
  let steps = 0;
  while (!observed.site && steps < 16) { g.zoomView(1 / 1.15); steps++; observed = inspectPlacement149('warehouse'); }
  assert.ok(observed.site); assert.ok(steps > 0 && steps < 16); assert.deepEqual(stable(g), before);
  const site = observed.site, def = g.world.definition('warehouse');
  assert.equal(g.world.placement(def, site.gx, site.gy, 0).valid, true); assert.deepEqual(site.cost, def.cost);
  assert.equal(doc.elementFromPoint(site.screen.x, site.screen.y), doc.getElementById('game'));
  // A covered canvas can never become a candidate merely because its geometry is legal.
  doc.elementFromPoint = () => doc.getElementById('pauseButton');
  const covered = inspectPlacement149('warehouse'); assert.equal(covered.site, null); assert.ok(covered.rejected.coveredByUI > 0);
  assert.deepEqual(stable(g), before);
});

test('149 placement QA: bounded view search retains every refusal and never writes campaign state', async () => {
  const { choosePlacement149 } = await import('../scripts/browser-d17-placement149.mjs');
  const { g } = prepared(), before = stable(g); let inspections = 0, zooms = 0, drawerOpen = false;
  // A controlled page boundary makes every proposed ground click occluded;
  // its zoom command still uses the native clamp. No browser/layout claim.
  const page = {
    evaluate: async fn => fn.name === 'inspectPlacement149'
      ? (inspections++, { site: null, unoccupied: 1, camera: { zoom: g.camera.zoom }, rejected: { coveredByUI: 1 }, nativeReasons: {}, safe: { left: 76, right: 363, top: 333, bottom: 580 } })
      : g.camera.zoom,
    locator: selector => ({ evaluate: async () => drawerOpen, tap: async () => { if (selector.endsWith('summary')) drawerOpen = !drawerOpen; else { zooms++; g.zoomView(1 / 1.15); } } })
  };
  await assert.rejects(choosePlacement149(page, true, 'warehouse'), error => {
    assert.match(error.message, /native zoom limit/); assert.equal(error.deadwallPlacement.inspections.length, inspections);
    assert.equal(error.deadwallPlacement.zooms.length, zooms); assert.ok(inspections <= 16); assert.ok(zooms <= 15);
    assert.equal(error.deadwallPlacement.zooms.at(-1).before, error.deadwallPlacement.zooms.at(-1).after);
    assert.ok(error.deadwallPlacement.inspections.every(p => p.rejected.coveredByUI === 1)); return true;
  });
  assert.equal(drawerOpen, false); assert.deepEqual(stable(g), before);
  const blocked = { ...page, evaluate: async () => ({ site: null, unoccupied: 0, rejected: { native: 529 }, nativeReasons: { 'Native placement refused': 529 } }) };
  const oldZooms = zooms;
  await assert.rejects(choosePlacement149(blocked, true, 'warehouse'), /native terrain or actor occupancy/);
  assert.equal(zooms, oldZooms); assert.deepEqual(stable(g), before);
});
