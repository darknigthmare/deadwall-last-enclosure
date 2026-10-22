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

function landscapeAtZoomLimit() {
  const env = bootDocument134({ search: '?tools=1&fixture=legacy' }), { g, doc } = env;
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  for (const b of [...g.world.buildings.values()]) if (b !== g.core()) g.world.remove(b);
  const Building = g.core().constructor;
  for (const [type, gx, gy] of [['house', 68, 65], ['warehouse', 59, 65]]) g.world.add(new Building(g.nextId++, type, gx, gy, 0, 1));
  // CI run39789163177: exact surviving footprints, camera/player and safe frame.
  // The report omits unit positions: this declared, native-clear worker pose
  // supplies the same absence of unoccupied northern sites, not an elapsed replay.
  Object.assign(g.player, { x: 2007.5075040000033, y: 2134.6602639999996 });
  Object.assign(g.units[0], { x: 2096, y: 2130 });
  assert.equal(g.friendlyPositionClear(g.units[0], g.units[0].x, g.units[0].y), true);
  Object.assign(g.camera, { x: g.player.x, y: g.player.y, zoom: 1 });
  for (let i = 0; i < 20; i++) g.zoomView(1 / 1.15);
  g.width = 844; g.height = 390;
  g.hud135 = { measure: () => ({ left: 76, right: 592, top: 122, bottom: 205 }) };
  doc.elementFromPoint = () => doc.getElementById('game');
  return env;
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

test('149 placement QA: the CI landscape zoom clamp has a collision-safe viewpoint outside the future paid footprint', async () => {
  const { inspectPlacement149 } = await import('../scripts/browser-d17-placement149.mjs');
  const { g, doc } = landscapeAtZoomLimit(), before = stable(g), minimum = g.camera.zoom;
  g.zoomView(1 / 1.15); assert.equal(g.camera.zoom, minimum);
  const observed = inspectPlacement149({ type: 'warehouse', planView: true });
  assert.equal(observed.site, null); assert.ok(observed.unoccupied > 0);
  assert.equal(observed.rejected.outsideSafeFrame, observed.unoccupied);
  assert.deepEqual(stable(g), before, 'Planning cannot modify stock, buildings, roads, resources, player or RNG');
  const route = observed.viewRoute;
  assert.ok(route.target && route.segments.length); assert.ok(route.searchedCells <= route.maximumCells);
  let previous = route.start, distance = 0;
  for (const segment of route.segments) {
    const length = Math.hypot(segment.target.x - previous.x, segment.target.y - previous.y); distance += length;
    for (let n = 0; n <= Math.ceil(length / 2); n++) {
      const t = n / Math.max(1, Math.ceil(length / 2));
      assert.equal(g.friendlyPositionClear(g.player, previous.x + (segment.target.x - previous.x) * t, previous.y + (segment.target.y - previous.y) * t), true);
    }
    previous = segment.target;
  }
  assert.ok(distance <= route.maximumSteps * route.spacing);
  assert.ok(Math.abs(route.target.x - route.start.x) <= route.radius * route.spacing);
  assert.ok(Math.abs(route.target.y - route.start.y) <= route.radius * route.spacing);
  const site = route.proposedSite, def = g.world.definition('warehouse'), r = g.player.radius + 5;
  assert.equal(g.world.placement(def, site.gx, site.gy, 0).valid, true);
  assert.ok(route.target.x + r <= site.gx * 32 || route.target.x - r >= (site.gx + def.size[0]) * 32 || route.target.y + r <= site.gy * 32 || route.target.y - r >= (site.gy + def.size[1]) * 32);
  doc.elementFromPoint = () => doc.getElementById('pauseButton');
  const covered = inspectPlacement149({ type: 'warehouse', planView: true });
  assert.equal(covered.viewRoute.target, null); assert.ok(covered.viewRoute.searchedCells <= covered.viewRoute.maximumCells);
  assert.deepEqual(stable(g), before, 'Even an exhausted route search is read-only');
});

test('149 placement QA: held movement releases on refusal, then native movement is revalidated without any construction or grant', async () => {
  const { choosePlacement149 } = await import('../scripts/browser-d17-placement149.mjs');
  const { g, doc, dispatchWindow } = landscapeAtZoomLimit();
  const before = stable(g), keys = { w: 'KeyW', s: 'KeyS', a: 'KeyA', d: 'KeyD' };
  let downs = 0, ups = 0, refuseMovement = true;
  // Controlled Playwright boundary: real keyboard handlers and native simulation,
  // with declared DOM geometry. Actual touch and CSS remain browser obligations.
  const page = {
    context: () => ({}),
    locator: () => ({ focus: async () => doc.getElementById('game').focus() }),
    mouse: { move: async () => {}, wheel: async () => g.zoomView(.9) },
    keyboard: {
      down: async key => { downs++; dispatchWindow('keydown', { code: keys[key], key, target: doc.getElementById('game') }); },
      up: async key => { ups++; dispatchWindow('keyup', { code: keys[key], key, target: doc.getElementById('game') }); }
    },
    evaluate: async (fn, argument) => fn.toString().includes('new Promise') ? g.camera.zoom : fn(argument),
    waitForFunction: async (fn, argument, options) => {
      assert.ok(options.timeout > 0 && options.timeout <= 10000);
      if (refuseMovement && argument?.axis) throw Error('Declared movement timeout');
      for (let frame = 0; frame < 500; frame++) { if (fn(argument)) return; g.update(.02); }
      throw Error('Native condition did not complete within controlled frames');
    }
  };
  await assert.rejects(choosePlacement149(page, false, 'warehouse'), error => {
    assert.match(error.message, /Declared movement timeout/);
    assert.equal(error.deadwallPlacement.reason, 'native viewpoint walk failed');
    assert.equal(error.deadwallPlacement.walks[0].completed, false); return true;
  });
  assert.equal(downs, ups); assert.equal(g.input.keys.size, 0); assert.deepEqual(stable(g), before);
  refuseMovement = false;
  const result = await choosePlacement149(page, false, 'warehouse');
  assert.ok(result.placementSearch.walks.length > 0 && result.placementSearch.walks.length <= result.placementSearch.maximumViewWalks);
  assert.ok(result.placementSearch.walks.every(walk => walk.completed));
  assert.equal(downs, ups); assert.equal(g.input.keys.size, 0);
  assert.ok(Math.hypot(g.player.x - before.player.x, g.player.y - before.player.y) > 0);
  assert.ok(result.placementSearch.inspections.at(-1).site);
  assert.equal(g.world.placement(g.world.definition('warehouse'), result.gx, result.gy, 0).valid, true);
  assert.equal(doc.elementFromPoint(result.screen.x, result.screen.y), doc.getElementById('game'));
  const after = stable(g);
  assert.deepEqual(after.buildings, before.buildings); assert.deepEqual(after.infrastructure, before.infrastructure);
  assert.equal(after.resources.wood, before.resources.wood); assert.equal(after.resources.scrap, before.resources.scrap);
  assert.ok(after.elapsed > before.elapsed, 'Only ordinary simulation time advances during held input');
});
