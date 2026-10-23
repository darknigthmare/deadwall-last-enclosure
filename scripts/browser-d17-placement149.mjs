import { activate, holdInput } from './browser-qa-common144.mjs';

/** Read native placement and current DOM geometry without changing the campaign. */
export function inspectPlacement149(request) {
  const { type, planView = false } = typeof request === 'string' ? { type: request } : request;
  const g = globalThis.DEADWALL, core = g.core(), def = g.world.definition(type);
  if (!def) throw Error('Unknown placement model: ' + type);
  const safe = g.hud135.measure(), canvas = document.getElementById('game'), candidates = [], available = [];
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
    available.push({ gx, gy, x, y, left, top, right, bottom });
    const screen = { x: (x - g.camera.x) * g.camera.zoom + g.width / 2, y: (y - g.camera.y) * g.camera.zoom + g.height / 2 };
    if (screen.x < safe.left + 10 || screen.x > safe.right - 10 || screen.y < safe.top + 10 || screen.y > safe.bottom - 10) { rejected.outsideSafeFrame++; continue; }
    if (document.elementFromPoint(screen.x, screen.y) !== canvas) { rejected.coveredByUI++; continue; }
    candidates.push({ gx, gy, screen, cost: { ...def.cost }, distance: Math.hypot((left + right) / 2 - g.player.x, (top + bottom) / 2 - g.player.y) });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.gy - b.gy || a.gx - b.gx);
  const observation = { type, site: candidates[0] || null, scanned, unoccupied, visible: candidates.length, rejected, nativeReasons,
    safe: { ...safe }, camera: { x: g.camera.x, y: g.camera.y, zoom: g.camera.zoom }, viewport: { width: g.width, height: g.height } };
  if (!planView || observation.site || !available.length) return observation;
  // At the real zoom clamp, a shallow landscape frame may lie entirely above
  // the camera centre. Zoom cannot bring a southern footprint into that frame.
  // Plan an ordinary walk to a viewpoint, sampling native collision rules;
  // the proposed view is only a prediction and must be inspected again after it.
  const actor = g.player, spacing = 16, radius = 16, maximumSteps = 32, maximumCells = (radius * 2 + 1) ** 2;
  const start = { x: actor.x, y: actor.y }, key = cell => cell.x + ':' + cell.y;
  const queue = [{ x: 0, y: 0, steps: 0 }], parents = new Map([[key(queue[0]), null]]);
  const at = cell => ({ x: start.x + cell.x * spacing, y: start.y + cell.y * spacing });
  const viewpoint = point => available.find(site => {
    if (point.x + actor.radius + 5 > site.left && point.x - actor.radius - 5 < site.right && point.y + actor.radius + 5 > site.top && point.y - actor.radius - 5 < site.bottom) return false;
    const x = (site.x - point.x) * g.camera.zoom + g.width / 2, y = (site.y - point.y) * g.camera.zoom + g.height / 2;
    return x >= safe.left + 18 && x <= safe.right - 18 && y >= safe.top + 18 && y <= safe.bottom - 18 && document.elementFromPoint(x, y) === canvas;
  });
  let found, proposed, searchedCells = 0;
  for (let head = 0; head < queue.length && head < maximumCells; head++) {
    const cell = queue[head], point = at(cell); searchedCells++;
    if (cell.steps > 0 && g.friendlyPositionClear(actor, point.x, point.y) && (proposed = viewpoint(point))) { found = cell; break; }
    if (cell.steps >= maximumSteps) continue;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const next = { x: cell.x + dx, y: cell.y + dy, steps: cell.steps + 1 };
      if (Math.abs(next.x) > radius || Math.abs(next.y) > radius || parents.has(key(next))) continue;
      const destination = at(next);
      if (![.25, .5, .75, 1].every(t => g.friendlyPositionClear(actor, point.x + (destination.x - point.x) * t, point.y + (destination.y - point.y) * t))) continue;
      parents.set(key(next), cell); queue.push(next);
    }
  }
  const segments = [];
  if (found) {
    const cells = [];
    for (let cell = found; cell; cell = parents.get(key(cell))) cells.push(cell);
    cells.reverse();
    for (let i = 1; i < cells.length; i++) {
      const previous = cells[i - 1], cell = cells[i], direction = cell.x > previous.x ? 'right' : cell.x < previous.x ? 'left' : cell.y > previous.y ? 'down' : 'up';
      if (segments.at(-1)?.direction === direction) segments.at(-1).target = at(cell);
      else segments.push({ direction, target: at(cell) });
    }
  }
  observation.viewRoute = { start, spacing, radius, maximumSteps, maximumCells, searchedCells,
    target: found ? at(found) : null, proposedSite: proposed ? { gx: proposed.gx, gy: proposed.gy } : null, segments };
  return observation;
}

/** The bounded fallback only changes the ordinary view through real player controls. */
export async function choosePlacement149(page, touch, type) {
  const search = { type, maximumInspections: 16, maximumViewWalks: 3, inspections: [], zooms: [], walks: [] };
  let zoomExhausted = false;
  function refuse(reason) {
    const error = Error('No valid visible unoccupied placement for ' + type + ': ' + reason);
    error.deadwallPlacement = { ...search, reason }; throw error;
  }
  for (let attempt = 0; attempt < search.maximumInspections; attempt++) {
    const observation = await page.evaluate(inspectPlacement149, { type, planView: zoomExhausted }); search.inspections.push(observation);
    if (observation.site) return { ...observation.site, placementSearch: search };
    if (!observation.unoccupied) refuse('native terrain or actor occupancy leaves no candidate');
    if (attempt === search.maximumInspections - 1) refuse('bounded view search exhausted');
    if (zoomExhausted) {
      if (search.walks.length >= search.maximumViewWalks) refuse('bounded native viewpoint walks exhausted');
      if (!observation.viewRoute?.target || !observation.viewRoute.segments.length) refuse('native zoom limit and no collision-safe visible viewpoint');
      const walk = { control: touch ? 'held-touch-directions' : 'held-keyboard-directions', route: observation.viewRoute, completed: false };
      search.walks.push(walk);
      try {
        const keys = { up: 'w', down: 's', left: 'a', right: 'd' };
        for (const segment of walk.route.segments) {
          const axis = ['left', 'right'].includes(segment.direction) ? 'x' : 'y', sign = ['left', 'up'].includes(segment.direction) ? -1 : 1;
          await holdInput(page, page.context(), touch, keys[segment.direction], '#touchControls [data-dir="' + segment.direction + '"]', () =>
            page.waitForFunction(({ axis, sign, target }) => sign * (DEADWALL.player[axis] - target[axis]) >= -2,
              { axis, sign, target: segment.target }, { timeout: 10000 }));
        }
        await page.waitForFunction(() => DEADWALL.input.keys.size === 0 && Math.hypot(DEADWALL.camera.x - DEADWALL.player.x, DEADWALL.camera.y - DEADWALL.player.y) < 1,
          null, { timeout: 5000 });
        walk.after = await page.evaluate(() => ({ player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, camera: { ...DEADWALL.camera } }));
        walk.completed = true;
      } catch (error) {
        walk.error = String(error.message || error); error.deadwallPlacement ||= { ...search, reason: 'native viewpoint walk failed' }; throw error;
      }
      continue;
    }
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
    if (!(zoom.after < before)) zoomExhausted = true;
  }
  refuse('bounded view search exhausted');
}
