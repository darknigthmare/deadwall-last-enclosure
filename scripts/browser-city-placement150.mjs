// Browser-serializable QA readers: each function keeps its dependencies inside
// its own body because Playwright sends it to the page without module imports.
// The inventory matches inspectConstructionWork150. These readers never move,
// remove or heal actors and never replace the native placement/payment owner.

export function inspectPlannedPlacement150({ type, site }) {
  const g = DEADWALL, def = DeadwallCore.BUILDINGS[type], safe = g.hud135.measure();
  const placement = g.world.placement(def, site.gx, site.gy, 0);
  const bounds = { left: site.gx * 32, top: site.gy * 32, right: (site.gx + def.size[0]) * 32, bottom: (site.gy + def.size[1]) * 32 };
  const overlaps = (actor, margin) => actor.x + (actor.radius || 12) + margin > bounds.left && actor.x - (actor.radius || 12) - margin < bounds.right && actor.y + (actor.radius || 12) + margin > bounds.top && actor.y - (actor.radius || 12) - margin < bounds.bottom;
  const physicalActors = [{ entity: g.player, kind: 'player' }, ...g.units.map(entity => ({ entity, kind: entity.kind })),
    ...g.zombies.map(entity => ({ entity, kind: 'infected' })), { entity: g.expeditions.entity(), kind: 'vehicle' },
    ...(g.territories?.truckEntities() || []).map(entity => ({ entity, kind: 'truck' }))];
  const actors = physicalActors.filter(({ entity: actor }) => actor && !actor.dead && (actor.health === undefined || actor.health > 0) && overlaps(actor, 5))
    .map(({ entity: actor, kind }) => ({ id: actor.id, kind, x: actor.x, y: actor.y, radius: actor.radius || 12, dead: actor.dead, health: actor.health, state: actor.state, bodyOverlap: overlaps(actor, 0), safetyMarginOverlap: true }));
  const screen = { x: (site.gx * 32 + 16 - g.camera.x) * g.camera.zoom + g.width / 2, y: (site.gy * 32 + 16 - g.camera.y) * g.camera.zoom + g.height / 2 };
  const hit = document.elementFromPoint(screen.x, screen.y), screenClear = screen.x >= safe.left + 10 && screen.x <= safe.right - 10 && screen.y >= safe.top + 10 && screen.y <= safe.bottom - 10;
  const withinSearch = Math.abs(site.gx - Math.floor(g.player.x / 32)) <= 12 && Math.abs(site.gy - Math.floor(g.player.y / 32)) <= 12;
  return { type, site, bounds, placement: { valid: placement.valid, reason: placement.reason }, actors, screen, safe: { ...safe }, screenClear, hit: { id: hit?.id, tag: hit?.tagName, className: hit?.className },
    camera: { ...g.camera }, player: { id: g.player.id, x: g.player.x, y: g.player.y, radius: g.player.radius, health: g.player.health, dead: g.player.dead }, workerOrder: g.workerOrder,
    withinSearch, selectedBuild: g.selectedBuild, valid: placement.valid && !actors.length && screenClear && hit?.id === 'game' && withinSearch };
}

export function findVisiblePlacement150({ type, plannedSite }) {
  const game = DEADWALL, def = DeadwallCore.BUILDINGS[type], safe = game.hud135.measure(), candidates = [];
  const actors = [game.player, ...game.units, ...game.zombies, game.expeditions.entity(), ...(game.territories?.truckEntities() || [])]
    .filter(actor => actor && !actor.dead && (actor.health === undefined || actor.health > 0));
  const origin = { gx: Math.floor(game.player.x / 32), gy: Math.floor(game.player.y / 32) };
  for (let gy = origin.gy - 12; gy <= origin.gy + 12; gy++) for (let gx = origin.gx - 12; gx <= origin.gx + 12; gx++) {
    if (plannedSite && (gx !== plannedSite.gx || gy !== plannedSite.gy)) continue;
    if (!game.world.placement(def, gx, gy, 0).valid) continue;
    const left = gx * 32, top = gy * 32, right = (gx + def.size[0]) * 32, bottom = (gy + def.size[1]) * 32;
    if (actors.some(actor => actor.x + (actor.radius || 12) + 5 > left && actor.x - (actor.radius || 12) - 5 < right && actor.y + (actor.radius || 12) + 5 > top && actor.y - (actor.radius || 12) - 5 < bottom)) continue;
    const x = (gx + .5) * 32, y = (gy + .5) * 32;
    const screen = { x: (x - game.camera.x) * game.camera.zoom + game.width / 2, y: (y - game.camera.y) * game.camera.zoom + game.height / 2 };
    if (screen.x < safe.left + 10 || screen.x > safe.right - 10 || screen.y < safe.top + 10 || screen.y > safe.bottom - 10) continue;
    if (document.elementFromPoint(screen.x, screen.y)?.id !== 'game') continue;
    candidates.push({ gx, gy, screen, cost: def.cost, distance: Math.hypot((left + right) / 2 - game.player.x, (top + bottom) / 2 - game.player.y) });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.gy - b.gy || a.gx - b.gx);
  if (!candidates.length) throw Error('No valid visible unoccupied placement for ' + type);
  return candidates[0];
}

export function observeConstructionPayment150({ method, type }) {
  const g = DEADWALL, original = g[method]; globalThis.__CITY150_PAYMENT__ = null;
  g[method] = function (...args) {
    const before = { ...g.resources }, rng = g.random.state;
    let placement = null;
    if (method === 'placeOne') {
      const [id, gx, gy, rotation = 0] = args, def = DeadwallCore.BUILDINGS[id], width = rotation % 2 ? def.size[1] : def.size[0], height = rotation % 2 ? def.size[0] : def.size[1];
      const bounds = { left: gx * 32, top: gy * 32, right: (gx + width) * 32, bottom: (gy + height) * 32 };
      const physicalActors = [{ entity: g.player, kind: 'player' }, ...g.units.map(entity => ({ entity, kind: entity.kind })),
        ...g.zombies.map(entity => ({ entity, kind: 'infected' })), { entity: g.expeditions.entity(), kind: 'vehicle' },
        ...(g.territories?.truckEntities() || []).map(entity => ({ entity, kind: 'truck' }))];
      const actors = physicalActors.filter(({ entity: a }) => a && !a.dead && (a.health === undefined || a.health > 0) && a.x + (a.radius || 12) + 5 > bounds.left && a.x - (a.radius || 12) - 5 < bounds.right && a.y + (a.radius || 12) + 5 > bounds.top && a.y - (a.radius || 12) - 5 < bounds.bottom)
        .map(({ entity: a, kind }) => ({ id: a.id, kind, x: a.x, y: a.y, radius: a.radius || 12 }));
      placement = { type: id, gx, gy, rotation, valid: g.world.placement(def, gx, gy, rotation).valid, actors };
    }
    const result = original.apply(this, args);
    if (!type || args[0] === type) { globalThis.__CITY150_PAYMENT__ = { before, after: { ...g.resources }, rng, afterRNG: g.random.state, result, placement }; g[method] = original; }
    return result;
  };
}
