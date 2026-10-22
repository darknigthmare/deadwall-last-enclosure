import { activate } from './browser-qa-common144.mjs';

/** Read native placement and current DOM geometry without changing the campaign. */
export function inspectPlacement149(type) {
  const g = globalThis.DEADWALL, core = g.core(), def = g.world.definition(type);
  if (!def) throw Error('Unknown placement model: ' + type);
  const safe = g.hud135.measure(), canvas = document.getElementById('game'), candidates = [];
  const rejected = { native: 0, occupied: 0, outsideSafeFrame: 0, coveredByUI: 0 }, nativeReasons = {};
  let scanned = 0, unoccupied = 0;
  for (let gy = core.gy - 9; gy <= core.gy + core.h + 9; gy++) for (let gx = core.gx - 9; gx <= core.gx + core.w + 9; gx++) {
    scanned++;
    const placement = g.world.placement(def, gx, gy, 0);
    if (!placement.valid) { rejected.native++; const reason = placement.reason || 'Native placement refused'; nativeReasons[reason] = (nativeReasons[reason] || 0) + 1; continue; }
    const left = gx * 32, top = gy * 32, right = (gx + def.size[0]) * 32, bottom = (gy + def.size[1]) * 32;
    if ([g.player, ...g.units].some(a => a.x + a.radius + 5 > left && a.x - a.radius - 5 < right && a.y + a.radius + 5 > top && a.y - a.radius - 5 < bottom)) { rejected.occupied++; continue; }
    unoccupied++;
    const x = (gx + .5) * 32, y = (gy + .5) * 32;
    const screen = { x: (x - g.camera.x) * g.camera.zoom + g.width / 2, y: (y - g.camera.y) * g.camera.zoom + g.height / 2 };
    if (screen.x < safe.left + 10 || screen.x > safe.right - 10 || screen.y < safe.top + 10 || screen.y > safe.bottom - 10) { rejected.outsideSafeFrame++; continue; }
    if (document.elementFromPoint(screen.x, screen.y) !== canvas) { rejected.coveredByUI++; continue; }
    candidates.push({ gx, gy, screen, cost: { ...def.cost }, distance: Math.hypot((left + right) / 2 - g.player.x, (top + bottom) / 2 - g.player.y) });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.gy - b.gy || a.gx - b.gx);
  return { type, site: candidates[0] || null, scanned, unoccupied, visible: candidates.length, rejected, nativeReasons,
    safe: { ...safe }, camera: { x: g.camera.x, y: g.camera.y, zoom: g.camera.zoom }, viewport: { width: g.width, height: g.height } };
}

/** The bounded fallback only changes the ordinary view through real player controls. */
export async function choosePlacement149(page, touch, type) {
  const search = { type, maximumInspections: 16, inspections: [], zooms: [] };
  function refuse(reason) {
    const error = Error('No valid visible unoccupied placement for ' + type + ': ' + reason);
    error.deadwallPlacement = { ...search, reason }; throw error;
  }
  for (let attempt = 0; attempt < search.maximumInspections; attempt++) {
    const observation = await page.evaluate(inspectPlacement149, type); search.inspections.push(observation);
    if (observation.site) return { ...observation.site, placementSearch: search };
    if (!observation.unoccupied) refuse('native terrain or actor occupancy leaves no candidate');
    if (attempt === search.maximumInspections - 1) refuse('bounded view search exhausted');
    const before = observation.camera.zoom;
    const zoom = { control: touch ? 'visible-touch-zoomOut' : 'canvas-wheel', before, after: null }; search.zooms.push(zoom);
    try {
      if (touch) {
        const drawer = page.locator('#touchCommandDrawer');
        if (!await drawer.evaluate(node => node.open)) await activate(page, '#touchCommandDrawer > summary', true);
        await activate(page, '#touchCommandDrawer [data-game-command="zoomOut"]', true);
        await activate(page, '#touchCommandDrawer > summary', true);
      } else {
        const point = { x: (observation.safe.left + observation.safe.right) / 2, y: (observation.safe.top + observation.safe.bottom) / 2 };
        const clear = await page.evaluate(p => document.elementFromPoint(p.x, p.y) === document.getElementById('game'), point);
        if (!clear) refuse('native wheel target is covered by the interface');
        await page.mouse.move(point.x, point.y); await page.mouse.wheel(0, 240);
      }
      zoom.after = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(DEADWALL.camera.zoom))));
    } catch (error) {
      zoom.error = String(error.message || error);
      error.deadwallPlacement ||= { ...search, reason: 'native view control failed' }; throw error;
    }
    if (!(zoom.after < before)) refuse('native zoom limit or unchanged control');
  }
  refuse('bounded view search exhausted');
}
