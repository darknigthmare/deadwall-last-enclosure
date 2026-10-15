/* Current map contacts are observed by physical allies, never remembered by a map. */
(function (root) {
  'use strict';
  const C = root.DeadwallCore || (typeof require === 'function' ? require('./core.js') : null);
  const P = root.DeadwallAtlasProjection || (typeof require === 'function' ? require('./atlas-projection.js') : null);
  const G = root.DeadwallFrontierGeometry || (typeof require === 'function' ? require('./frontier-geometry.js') : null);
  const finite = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const alive = p => Boolean(p && !p.dead && Number.isFinite(p.hp ?? p.health) && (p.hp ?? p.health) > 0);
  const operational = b => alive(b) && b.completed && !b.siegeOffline && !b.territoryOffline && !b.gridOffline && !b.dayOffline && (!b.def?.powerUse || b.powered);
  const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

  function install(g) {
    if (g.visibility) return g.visibility;
    const R = C.VisibilityRules146;
    if (!R || !P || !G) throw Error('Règles et projection de visibilité absentes.');
    let revision = 0, last = null;
    const invalidate = () => { revision++; last = null; };

    // Share this short-lived index only during one synchronous map paint.
    function frame() {
      const world = g.world, player = g.player, capturedRevision = revision, capturedElapsed = g.elapsed;
      const f = g.frontier?.position?.() || { active: false, z: 0, inside: null };
      const nativeUnits = new Set(g.units || []);
      const vertical = g.vertical175, verticalState = root.DeadwallVertical175State, verticalRules = C.VerticalCitadel175;
      const altitude = actor => actor === player ? vertical?.pose?.().z || 0 : nativeUnits.has(actor) && vertical?.population?.isAssigned?.(actor?.id) ? vertical.population.pose(actor).z : vertical?.enemyPose?.(actor)?.z || 0;
      let verticalBoxes = null;
      const home = P.home(g), observers = [], lights = [], observerIndex = new Map(), lightIndex = new Map();
      const roofs = new Map(), districts = [], metrics = { observers: 0, lights: 0, queries: 0, observerCandidates: 0, rays: 0, lightRays: 0, visible: 0 };
      const blackout = Boolean(g.nightwatch?.isBlackout?.());
      const daylight = blackout ? 0 : Math.max(0, Math.min(1, g.daylight?.() ?? 1));
      const ambient = R.nightFloor + (1 - R.nightFloor) * daylight;
      let region = null, fireIds = null, maxObserverRange = 0, maxLightRange = 0;
      const regionalWorld = () => region || (region = g.frontier?.world?.());
      const fireActive = id => {
        if (!fireIds) fireIds = new Set((g.siege?.snapshot?.().fires || []).map(f => f.id));
        return fireIds.has(id);
      };
      const localPoint = p => ({ x: (p.x - home.minX) * R.unitsPerMetre, y: (p.y - home.minY) * R.unitsPerMetre });
      const regionalPoint = p => ({ x: home.minX + p.x / R.unitsPerMetre, y: home.minY + p.y / R.unitsPerMetre });
      const bucket = p => Math.floor(p.x / R.indexCell) + ',' + Math.floor(p.y / R.indexCell);
      const put = (index, p) => { const key = bucket(p); if (!index.has(key)) index.set(key, []); index.get(key).push(p); };
      function observer(domain, p, range, valid, building = null, annex = null, physical = null) {
        if (!finite(p) || !Number.isFinite(range) || range <= 0 || !valid()) return;
        const q = domain === 'local' ? regionalPoint(p) : p;
        const value = { x: q.x, y: q.y, z: domain === 'local' ? 0 : p.z ?? 0, inside: p.inside ?? p.poi ?? null, range, valid, building, annex, local: domain === 'local', altitude: physical?.altitude ?? (domain === 'local' ? altitude(p) : 0), eye: physical?.eye ?? verticalRules?.eyeHeight ?? 1.65, module: physical?.module ?? null };
        observers.push(value); put(observerIndex, value); maxObserverRange = Math.max(maxObserverRange, range);
      }
      function light(domain, p, valid = () => true, physical = null) {
        if (!finite(p) || !Number.isFinite(p.r) || p.r <= 0 || !valid()) return;
        const q = domain === 'local' ? regionalPoint(p) : p;
        const building = domain === 'local' && Number.isInteger(p.id) ? world.buildings.get(p.id) : null;
        // A fire remains physical light while the burning support's services are offline.
        const sourceValid = building ? p.fire === true
          ? () => alive(building) && fireActive(building.id)
          : () => operational(building) : valid;
        const value = { x: q.x, y: q.y, z: domain === 'local' ? 0 : p.z ?? 0, inside: p.inside ?? null,
          range: p.r / (domain === 'local' ? R.unitsPerMetre : 1) * C.Urban.RULES.detectThreshold,
          angle: p.angle || 0, half: p.half ?? Math.PI, valid: sourceValid, building, local: domain === 'local', altitude: physical?.altitude ?? 0, eye: physical?.eye ?? verticalRules?.eyeHeight ?? 1.65, module: physical?.module ?? null };
        lights.push(value); put(lightIndex, value); maxLightRange = Math.max(maxLightRange, value.range);
      }

      if (alive(player)) {
        if (f.active) observer('region', f, R.player, () => alive(player) && Boolean(g.frontier?.active?.()));
        else if (!player.regionAbsent) observer('local', player, R.player, () => alive(player) && !player.regionAbsent);
      }
      for (const u of g.units || []) observer('local', u, R.units[u.kind], () => alive(u) && !u.regionAbsent);
      for (const b of world.buildings.values()) {
        const range = R.buildings[b.type] ?? C.CityContent150?.BUILDINGS?.[b.type]?.observerRange150;
        observer('local', b, range, () => operational(b), b);
      }

      // A completed elevated weapon observes from its real muzzle, with its existing targeting range.
      // Empty guns still have a physical lookout; an unfinished or offline installation does not.
      for (const site of vertical?.presentation?.().sites || []) {
        const support = world.buildings.get(site.id);
        if (!operational(support)) continue;
        for (let level = 0; level < site.decks.length; level++) for (const module of site.decks[level].modules) {
          const definition = verticalRules?.modules[module.kind];
          if (!definition || site.decks[level].progress !== 1 || module.progress !== 1 || module.health <= 0) continue;
          const muzzle = vertical.muzzle({ b: support, s: site, level, m: module, def: definition });
          const position = { x: muzzle.x * R.unitsPerMetre, y: muzzle.y * R.unitsPerMetre, id: null };
          const physical = { altitude: muzzle.z, eye: 0, module: module.id };
          const valid = () => operational(support) && module.progress === 1 && module.health > 0;
          observer('local', position, definition.range, valid, null, null, physical);
          if (ambient < 1 && definition.light > 0) light('local', { ...position, r: definition.light }, valid, physical);
        }
      }

      const evolution = g.worldEvolution?.overview?.();
      if (f.active) for (const c of evolution?.companions || []) {
        if (!c.riding) observer('region', c, R.companions[c.id], () => alive(c));
      }
      for (const d of evolution?.districts || []) {
        if (!d.level || !finite(d.pos)) continue;
        for (const b of d.buildings || []) {
          const shape = R.districtGeometry;
          const box = { x: shape.left + b.slot % shape.columns * shape.columnStep,
            y: shape.top + Math.floor(b.slot / shape.columns) * shape.rowStep, w: shape.width, h: shape.height };
          const annex = { id: 'annex:' + d.id + ':' + b.slot, pose: { ...d.pos, w: 0, h: 0 }, box, building: b };
          districts.push(annex);
          const p = G.global(annex.pose, box.x + box.w / 2, box.y + box.h / 2);
          observer('region', { ...p, z: 0, inside: null }, R.districts[b.type], () => b.progress >= 1, null, annex);
        }
      }
      if (ambient < 1) {
        for (const p of g.nightwatch?.sources?.(false) || []) {
          // The aggregate native light belongs to elevated modules, already positioned above.
          // A real siege fire on their support remains a separate physical source.
          if (verticalRules?.bases[world.buildings.get(p.id)?.type] && !p.fire) continue;
          light('local', p);
        }
        for (const p of [...(g.essentials?.lights?.('region') || []), ...(g.nightGear?.lights?.('region') || []), ...(g.interventions134?.lights?.() || [])]) light('region', p);
        if (f.active && alive(player)) {
          const vehicle = g.expeditions?.car?.(), driving = f.car?.driving && vehicle?.fuel > 0;
          const torch = Boolean(g.urban?.lightingState?.().flashlight);
          if (driving || torch) light('region', { ...f, r: driving ? R.regionalCarRange : R.regionalTorchRange,
            angle: f.a || 0, half: driving ? R.regionalCarHalfAngle : R.regionalTorchHalfAngle }, () => alive(player) && Boolean(g.frontier?.active?.()));
        }
      }
      metrics.observers = observers.length; metrics.lights = lights.length;

      function nearby(index, p, range) {
        const out = [];
        for (let y = Math.floor((p.y - range) / R.indexCell); y <= Math.floor((p.y + range) / R.indexCell); y++) {
          for (let x = Math.floor((p.x - range) / R.indexCell); x <= Math.floor((p.x + range) / R.indexCell); x++) {
            for (const value of index.get(x + ',' + y) || []) if ((value.x - p.x) ** 2 + (value.y - p.y) ** 2 <= value.range ** 2) out.push(value);
          }
        }
        return out;
      }
      function roof(p) {
        if (p.z !== 0) return p.inside ?? null;
        const key = p.x + ':' + p.y;
        if (roofs.has(key)) return roofs.get(key);
        // D-17 structures use the local collision model, not regional parcel roofs.
        if (p.x >= home.minX && p.x <= home.maxX && p.y >= home.minY && p.y <= home.maxY) return null;
        let id = null;
        for (const place of regionalWorld()?.nearPOI?.(p.x, p.y, 2) || []) {
          if (place.type === 'ruin' || g.worldEvolution?.structureDestroyed?.(place.id)) continue;
          const q = G.local(place, p.x, p.y);
          if (q.x > 0 && q.y > 0 && q.x < place.w && q.y < place.h) { id = place.id; break; }
        }
        roofs.set(key, id); return id;
      }
      function samePlane(a, b) {
        if (a.local && b.local) return true;
        if ((a.altitude || 0) !== 0 || (b.altitude || 0) !== 0) return false;
        if (a.z !== b.z || a.z !== 0 && (!a.inside || a.inside !== b.inside)) return false;
        return a.z !== 0 || roof(a) === roof(b);
      }
      function homeInterval(a, b) {
        let enter = 0, exit = 1;
        for (const [start, delta, low, high] of [[a.x, b.x - a.x, home.minX, home.maxX], [a.y, b.y - a.y, home.minY, home.maxY]]) {
          if (Math.abs(delta) < 1e-12) { if (start < low || start > high) return null; }
          else { const lo = (low - start) / delta, hi = (high - start) / delta; enter = Math.max(enter, Math.min(lo, hi)); exit = Math.min(exit, Math.max(lo, hi)); if (enter > exit) return null; }
        }
        return { enter, exit };
      }
      function clear(a, b) {
        metrics.rays++;
        if (a.local && b.local && (a.altitude !== 0 || b.altitude !== 0 || b.giant)) {
          if (!verticalState || !vertical?.geometry) return false;
          const from = { ...localPoint(a), z: (a.altitude || 0) + a.eye };
          const to = { ...localPoint(b), z: (b.altitude || 0) + b.eye };
          from.x /= R.unitsPerMetre; from.y /= R.unitsPerMetre;
          to.x /= R.unitsPerMetre; to.y /= R.unitsPerMetre;
          const distance = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
          if (distance < 1e-9) return true;
          const direction = { x: (to.x - from.x) / distance, y: (to.y - from.y) / distance, z: (to.z - from.z) / distance };
          verticalBoxes ||= vertical.geometry();
          return verticalBoxes.every(box => a.building && box.owner === a.building.id || box.module === a.module && a.module !== null || verticalState.rayBox(from, direction, box, Math.max(0, distance - .02)) === null);
        }
        if (a.z !== 0) return Boolean(regionalWorld()?.line?.(a, b, a.z, a.inside, null, R.lineRadius));
        for (const d of districts) {
          if (d === a.annex) continue;
          if (G.segmentRect(G.local(d.pose, a.x, a.y), G.local(d.pose, b.x, b.y), d.box)) return false;
        }
        const part = homeInterval(a, b), w = part?.enter === 0 && part.exit === 1 ? null : regionalWorld(), ignoredAnnex = a.annex?.id ?? null;
        if (!part) return Boolean(w?.line?.(a, b, 0, a.inside, ignoredAnnex, R.lineRadius));
        const at = t => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        const entry = at(part.enter), exit = at(part.exit);
        if (!g.hostileLineClear(localPoint(entry), localPoint(exit), false, a.building)) return false;
        if (part.enter > 0 && !w?.line?.(a, entry, 0, a.inside, ignoredAnnex, R.lineRadius)) return false;
        if (part.exit < 1 && !w?.line?.(exit, b, 0, b.inside, ignoredAnnex, R.lineRadius)) return false;
        return true;
      }
      function illuminated(p) {
        for (const l of nearby(lightIndex, p, maxLightRange)) {
          if (!l.valid() || !samePlane(l, p) || (l.x - p.x) ** 2 + (l.y - p.y) ** 2 + ((l.altitude || 0) - p.altitude) ** 2 > l.range ** 2) continue;
          if (l.half < Math.PI && Math.abs(angleDifference(Math.atan2(p.y - l.y, p.x - l.x), l.angle)) > l.half * R.beamDetectFraction) continue;
          metrics.lightRays++;
          if (clear(l, p)) return true;
        }
        return false;
      }
      function seen(enemy, domain) {
        metrics.queries++;
        if (capturedRevision !== revision || capturedElapsed !== g.elapsed || world !== g.world || player !== g.player || !finite(enemy) || !alive(enemy)) return false;
        const q = domain === 'local' ? regionalPoint(enemy) : enemy;
        const floorAltitude = domain === 'local' ? altitude(enemy) : 0;
        const targetEye = domain === 'local' && vertical?.aimPoint ? vertical.aimPoint(enemy).z - floorAltitude : .9;
        const p = { x: q.x, y: q.y, z: domain === 'local' ? 0 : enemy.z ?? 0, inside: enemy.inside ?? enemy.poi ?? null, local: domain === 'local', altitude: floorAltitude, eye: targetEye, giant: domain === 'local' && !!verticalRules?.siege.kinds[enemy.kind] };
        if (!Number.isFinite(p.altitude)) return false;
        if (!Number.isInteger(p.z) || p.z < -1 || p.z > 2) return false;
        const candidates = nearby(observerIndex, p, maxObserverRange);
        let lightKnown = false, lit = false;
        for (const o of candidates) {
          metrics.observerCandidates++;
          if (!o.valid() || !samePlane(o, p)) continue;
          const distanceSquared = (o.x - p.x) ** 2 + (o.y - p.y) ** 2 + ((o.altitude || 0) - p.altitude) ** 2;
          if (distanceSquared > o.range ** 2) continue;
          if (distanceSquared > (o.range * ambient) ** 2) {
            if (!lightKnown) { lit = illuminated(p); lightKnown = true; }
            if (!lit) continue;
          }
          if (clear(o, p)) { metrics.visible++; return true; }
        }
        return false;
      }
      const snapshot = () => ({ ...metrics, ambient, blackout, rememberedContacts: 0 });
      last = snapshot;
      return Object.freeze({ canSeeLocal: enemy => seen(enemy, 'local'), canSeeRegional: enemy => seen(enemy, 'region'), snapshot });
    }

    const api = Object.freeze({ frame, canSeeLocal: enemy => frame().canSeeLocal(enemy), canSeeRegional: enemy => frame().canSeeRegional(enemy),
      snapshot: () => last?.() || { observers: 0, lights: 0, queries: 0, observerCandidates: 0, rays: 0, lightRays: 0, visible: 0, rememberedContacts: 0 }, invalidate });
    for (const name of ['startNew', 'restoreSave', 'returnToMenu']) if (typeof g[name] === 'function') {
      const old = g[name].bind(g); g[name] = (...args) => { const result = old(...args); invalidate(); return result; };
    }
    g.visibility = api; return api;
  }
  const api = Object.freeze({ install }); root.DeadwallVisibility146 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.DEADWALL && root.document) install(root.DEADWALL);
})(globalThis);
