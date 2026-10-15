/* Existing survivors, inventories and navigation; no generated workforce or supplies. */
(function (root) {
  'use strict';
  const C = root.DeadwallCore || (typeof require === 'function' ? require('./core.js') : null);
  const R = C.VerticalCitadel175, P = C.VerticalPopulation181;
  const N = root.DeadwallVerticalNetwork179 || (typeof require === 'function' ? require('./vertical-network179.js') : null);
  const copy = value => JSON.parse(JSON.stringify(value));
  const live = value => value && !value.dead && value.health > 0;
  const address = value => value.site + ':' + value.level;
  const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
  const integer = (value, min, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
  const fields = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  const initial = () => ({ version: 1, members: [] });
  const floorZ = (building, level) => level < 0 ? 0 : R.bases[building.type].height + level * R.deckRise;
  function point(building, level, S) {
    if (level < 0) return S.entrance(building);
    const q = S.bounds(building);
    return { x: (q.x + q.w / 2) * R.tile, y: (q.y + q.h / 2) * R.tile };
  }
  function occupiedElsewhere(full) {
    return new Set([
      ...(full.territories?.withdrawing || []),
      ...Object.values(full.territories?.sectors || {}).map(s => s.workerId),
      ...(full.siege?.crew || []).map(s => s.id),
      ...(full.infrastructure?.crew || []).map(s => s.id),
      ...(full.salvage?.crews || []).map(s => s.id),
      ...(full.citadel?.calls || []).filter(s => ['follow', 'hold', 'return'].includes(s.status)).map(s => s.unitId),
      full.expeditions?.analyst?.id
    ].filter(Number.isSafeInteger));
  }
  function normalize(raw, full, vertical, S) {
    if (raw === undefined) return initial();
    const bad = reason => { throw Error('Personnel vertical invalide : ' + reason); };
    if (!fields(raw, ['version', 'members']) || raw.version !== 1 || !Array.isArray(raw.members) || raw.members.length > P.maxMembers) bad('registre');
    const units = new Map((full?.units || []).map(u => [u.id, u]));
    const buildings = new Map((full?.buildings || []).map(b => [b.id, b]));
    const sites = new Map((vertical?.sites || []).map(s => [s.id, s]));
    const ids = new Set(), busy = full ? occupiedElsewhere(full) : new Set();
    const validFloor = p => p && integer(p.site, 1) && integer(p.level, 0, R.maxDecks - 1) && (!full || buildings.get(p.site)?.progress === 1 && sites.get(p.site)?.decks[p.level]?.progress === 1);
    for (const m of raw.members) {
      if (!fields(m, ['id', 'home', 'site', 'level', 'bridge', 'travel', 'mode', 'recalled']) || !integer(m.id, 1) || ids.has(m.id) || typeof m.recalled !== 'boolean' || !['supply', 'outbound', 'duty', 'return'].includes(m.mode)) bad('affectation');
      ids.add(m.id);
      if(m.recalled&&m.mode!=='return'||m.site!==null&&m.mode==='supply'||m.travel!==null&&m.mode==='duty'||m.bridge!==null&&m.mode==='duty')bad('phase d’affectation');
      if (m.home !== null && (!fields(m.home, ['site', 'level']) || !validFloor(m.home))) bad('destination');
      if (m.home === null && (!m.recalled || m.mode !== 'return')) bad('destination absente');
      if (m.site === null ? m.level !== -1 || m.bridge !== null || m.travel !== null || m.mode === 'duty' : !integer(m.site, 1) || !integer(m.level, -1, R.maxDecks - 1)) bad('palier');
      if (m.bridge !== null && (!integer(m.bridge, 1) || m.site === null || m.level < 0 || m.travel !== null)) bad('passerelle');
      const b = buildings.get(m.site), u = units.get(m.id);
      if (full && (!u || !live(u) || !P.roles[u.kind] || busy.has(m.id))) bad('survivant absent ou déjà affecté');
      if (full) {
        const role = P.roles[u.kind];
        if (u.carry > role.capacity + P.epsilon || u.carryType !== null && u.carryType !== role.resource || role.resource === 'ammo' && !Number.isSafeInteger(u.carry)) bad('fournitures portées');
        if (m.site !== null && (!b || b.progress !== 1 || !sites.has(m.site))) bad('support absent');
      }
      if (m.travel !== null) {
        const t = m.travel;
        if (!fields(t, ['from', 'to', 'progress', 'startX', 'startY']) || m.site === null || m.bridge !== null || !integer(t.from, -1, R.maxDecks - 1) || !integer(t.to, -1, R.maxDecks - 1) || Math.abs(t.to - t.from) !== 1 || m.level !== t.from || !finite(t.progress, 0, 1) || !finite(t.startX, 0, C.WORLD_SIZE) || !finite(t.startY, 0, C.WORLD_SIZE)) bad('escalier');
        if (full) {
          for (const level of [t.from, t.to]) if (level >= 0 && !validFloor({ site: m.site, level })) bad('palier d’escalier');
          const start = point(b, t.from, S), end = point(b, t.to, S);
          if (Math.hypot(start.x - t.startX, start.y - t.startY) > P.entryTolerance * R.tile + P.epsilon) bad('entrée d’escalier');
          if (Math.hypot(u.x - (t.startX + (end.x - t.startX) * t.progress), u.y - (t.startY + (end.y - t.startY) * t.progress)) > P.saveTolerance * R.tile) bad('position dans l’escalier');
        }
      } else if (m.site !== null) {
        if (!validFloor(m)) bad('étage non construit');
        if (full) {
          const radius = C.SURVIVORS[u.kind].radius * C.VerticalRouting180.bodyRadiusFactor / R.tile;
          const refs = [{ site: m.site, level: m.level }];
          let bridge = null;
          if (m.bridge !== null) {
            bridge = vertical.network.links.find(l => l.id === m.bridge && l.progress === 1 && l.health > 0 && [l.a, l.b].some(p => address(p) === address(m)));
            if (!bridge) bad('liaison absente');
            refs.push(...[bridge.a, bridge.b].filter(p => p.site !== m.site));
          }
          if (!N.insideFloor(m, u, buildings, vertical.sites, radius) && !(bridge && N.onBridge({ ...vertical.network, cargo: null, links: [bridge] }, m, u, buildings, vertical.sites, radius))) bad('survivant hors sol porteur');
          for (const ref of refs) for (const module of sites.get(ref.site).decks[ref.level].modules) {
            const box = S.moduleBox(buildings.get(ref.site), module, 0), x = u.x / R.tile, y = u.y / R.tile;
            if (x + radius > box.x && x - radius < box.x + box.w && y + radius > box.y && y - radius < box.y + box.h) bad('survivant dans un équipement');
          }
        }
      }
    }
    return copy(raw);
  }
  function create(g, h) {
    const S = h.S, nav = h.navigation;
    const members = () => h.state().population.members;
    const member = id => members().find(m => m.id === id);
    const unit = id => g.units.find(u => u.id === id);
    const building = id => g.world.buildings.get(id);
    const site = id => h.state().sites.find(s => s.id === id);
    const validFloor = p => p && live(building(p.site)) && building(p.site).completed && site(p.site)?.decks[p.level]?.progress === 1;
    const running = () => g.state === 'playing' && !g.paused && !g.gameOver && !g.activeOverlay && !g.frontier?.active();
    const commanded = () => g.expansions.canAct() && !g.frontier?.active();
    const statuses = new Map(), services = new Map();
    let notice = '';
    function report(ok, reason) { notice = reason; g.notify?.(reason, ok ? 'good' : 'danger'); return { ok, reason }; }
    function pose(u) {
      const m = u && member(u.id), b = m && building(m.site);
      if (!m || !b) return { z: 0, site: null, level: -1, bridge: null, travel: null };
      const z = m.travel ? floorZ(b, m.travel.from) + (floorZ(b, m.travel.to) - floorZ(b, m.travel.from)) * m.travel.progress : floorZ(b, m.level);
      return { z, site: m.site, level: m.level, bridge: m.bridge, travel: m.travel ? copy(m.travel) : null };
    }
    function detached(id) {
      const t = g.territories?.snapshot();
      return !!(g.expeditions?.isAssigned(id) || g.salvage?.isAssigned(id) || g.infrastructure?.isAssigned(id) || g.siege?.isAssigned(id) || g.citadel?.isEscort(id) || t?.withdrawing?.includes(id) || Object.values(t?.sectors || {}).some(s => s.workerId === id));
    }
    function assign(id, siteId, level = 0) {
      const u = unit(id), home = { site: siteId, level };
      if (!commanded() || !live(u) || !P.roles[u.kind] || u.regionAbsent || !integer(siteId, 1) || !integer(level, 0, R.maxDecks - 1) || !validFloor(home)) return report(false, 'Survivant présent et palier achevé requis.');
      if (g.workerOrder === 'retreat' || u.kind === 'soldier' && g.squads?.groups[u.squad]?.order === 'retreat') return report(false, 'Le repli doit être levé avant cette affectation.');
      if (member(id) || detached(id) || u.carry > 0) return report(false, 'Ce survivant est déjà affecté ou porte une récolte.');
      if (members().length >= P.slots[g.tier.id]) return report(false, 'Capacité de personnel vertical atteinte pour cet âge.');
      members().push({ id, home, site: null, level: -1, bridge: null, travel: null, mode: 'supply', recalled: false });
      u.navigation = null; u.state = 'move'; u.targetNode = u.targetBuilding = u.targetUnit = -1;
      return report(true, 'Survivant affecté : retrait des fournitures au centre, puis trajet physique vers le palier.');
    }
    function retask(id, siteId, level = 0) {
      const m = member(id), home = { site: siteId, level };
      if (!commanded() || !m || m.recalled || !integer(siteId, 1) || !integer(level, 0, R.maxDecks - 1) || !validFloor(home)) return report(false, 'Personnel actif et destination construite requis.');
      m.home = home; if (m.mode === 'duty') m.mode = 'outbound'; services.delete(id); nav.forget(id);
      return report(true, 'Nouvelle affectation : les ponts et escaliers existants seront empruntés.');
    }
    function recall(id) {
      const m = member(id); if (!commanded() || !m) return report(false, 'Affectation introuvable.');
      m.recalled = true; m.mode = 'return'; services.delete(id); nav.forget(id);
      return report(true, 'Retour demandé : débarquement sûr, descente puis restitution au centre.');
    }
    function remove(id) {
      h.state().population.members = members().filter(m => m.id !== id);
      statuses.delete(id); services.delete(id); nav.forget(id);
      const u = unit(id); if (u) { u.navigation = null; u.state = u.carry > 0 ? 'return' : 'idle'; u.think = 0; u.supportActive = false; }
    }
    function traffic(u, x, y, z) {
      const radius = u.radius * C.VerticalRouting180.bodyRadiusFactor;
      for (const other of g.units) {
        if (other === u || !live(other) || !member(other.id)) continue;
        const p = pose(other);
        if (Math.abs(p.z - z) < P.separationZ && Math.hypot(other.x - x, other.y - y) < radius + other.radius * C.VerticalRouting180.bodyRadiusFactor) return false;
      }
      const player = h.pose();
      return !live(g.player) || Math.abs(player.z - z) >= P.separationZ || Math.hypot(g.player.x - x, g.player.y - y) >= radius + g.player.radius * C.VerticalRouting180.bodyRadiusFactor;
    }
    function clear(u, m, x, y) {
      const z = floorZ(building(m.site), m.level);
      return nav.walkable(m, x / R.tile, y / R.tile, u.radius * C.VerticalRouting180.bodyRadiusFactor / R.tile) && traffic(u, x, y, z);
    }
    function walk(u, m, goals, stamp, dt) {
      const z = floorZ(building(m.site), m.level);
      const speed = u.speed / R.tile * (u.carry > 0 ? P.loadedSpeed : 1);
      return nav.walk(u, m, goals, 'allied:' + stamp, dt, speed, p => traffic(u, p.x * R.tile, p.y * R.tile, z));
    }
    function graph() { return h.network().navigationGraph(); }
    function search(from, accept, net = graph()) {
      const start = address(from), queue = [start], previous = new Map([[start, null]]);
      if (!net.nodes.has(start)) return null;
      for (let i = 0; i < queue.length && queue.length <= C.VerticalNetwork179.routeNodeLimit; i++) {
        const key = queue[i], node = net.nodes.get(key);
        if (accept(node)) {
          let cursor = key, first = null;
          while (previous.get(cursor)) { const step = previous.get(cursor); first = step.edge; cursor = step.from; }
          return { node, first };
        }
        for (const edge of net.edges.get(key) || []) if (!previous.has(address(edge.to))) { previous.set(address(edge.to), { from: key, edge }); queue.push(address(edge.to)); }
      }
      return null;
    }
    function entryFor(from, u) {
      const net = graph(), core = g.core(), start = address(from);
      if (!core || !net.nodes.has(start)) return null;
      const queue = [start], visited = new Set(queue), candidates = [];
      for (let i = 0; i < queue.length && queue.length <= C.VerticalNetwork179.routeNodeLimit; i++) {
        const key = queue[i], node = net.nodes.get(key);
        if (node.level === 0) { const p = S.entrance(building(node.site)); if (!u || h.groundClear(u, p.x, p.y)) candidates.push(node); }
        for (const edge of net.edges.get(key) || []) if (!visited.has(address(edge.to))) { visited.add(address(edge.to)); queue.push(address(edge.to)); }
      }
      candidates.sort((a, b) => {
        const pa = S.entrance(building(a.site)), pb = S.entrance(building(b.site));
        return Math.hypot(pa.x - core.x, pa.y - core.y) - Math.hypot(pb.x - core.x, pb.y - core.y) || a.site - b.site;
      });
      return candidates[0] || null;
    }
    function beginStair(u, m, to) {
      const b = building(m.site), start = point(b, m.level, S), destination = point(b, to, S);
      if (Math.hypot(u.x - start.x, u.y - start.y) > P.entryTolerance * R.tile) return false;
      if (to >= 0 && (!validFloor({ site: m.site, level: to }) || !clear(u, { ...m, level: to }, destination.x, destination.y))) return false;
      if (to < 0 && !h.groundClear(u, destination.x, destination.y)) return false;
      // A single resident reserves a stair shaft until reaching its next landing.
      if (members().some(other => other !== m && other.site === m.site && other.travel)) return false;
      m.travel = { from: m.level, to, progress: 0, startX: u.x, startY: u.y }; nav.forget(u.id); return true;
    }
    function stair(u, m, dt) {
      const b = building(m.site), t = m.travel; if (!live(b) || !b.completed) { fall(u, m); return; }
      const end = point(b, t.to, S), rise = Math.abs(floorZ(b, t.to) - floorZ(b, t.from));
      const next = Math.min(1, t.progress + dt / (rise / P.stairSpeed + R.landingSeconds));
      if (next === 1 && (t.to < 0 ? !h.groundClear(u, end.x, end.y) || !traffic(u, end.x, end.y, 0) : !validFloor({ site: m.site, level: t.to }) || !clear(u, { ...m, level: t.to }, end.x, end.y))) { statuses.set(u.id, 'Sortie occupée : attente sur le trajet'); return; }
      t.progress = next; u.x = t.startX + (end.x - t.startX) * next; u.y = t.startY + (end.y - t.startY) * next;
      u.state = 'move'; statuses.set(u.id, 'Escalier · ' + pose(u).z.toFixed(1) + ' m');
      if (next === 1) { m.level = t.to; m.travel = null; if (m.level < 0) m.site = null; u.navigation = null; nav.forget(u.id); }
    }
    function traverse(u, m, edge, dt) {
      const b = building(m.site);
      if (edge.kind === 'stairs') {
        const goal = point(b, m.level, S); walk(u, m, [{ x: goal.x / R.tile, y: goal.y / R.tile }], 'stairs:' + address(edge.to), dt);
        beginStair(u, m, edge.to.level); return;
      }
      const found = h.network().presentation().links.find(item => item.link.id === edge.id && item.link.progress === 1), q = found?.shape;
      if (!q) { nav.forget(u.id); return; }
      if (members().some(other => other !== m && other.bridge === edge.id)) {
        statuses.set(u.id, 'Passerelle réservée : attente hors de l’accès'); waitingPosition(u, m, dt); return;
      }
      const source = address(q.link.a) === address(m) ? 0 : 1, goal = q.ports[source];
      walk(u, m, [goal], 'port:' + edge.id, dt);
      if (Math.hypot(u.x / R.tile - goal.x, u.y / R.tile - goal.y) > C.VerticalRouting180.arrivalMetres) return;
      if (members().some(other => other !== m && other.bridge === edge.id)) { statuses.set(u.id, 'Passerelle réservée : attente'); return; }
      m.bridge = edge.id; nav.forget(u.id);
    }
    function cross(u, m, dt) {
      const found = h.network().presentation().links.find(item => item.link.id === m.bridge && item.link.progress === 1), q = found?.shape;
      if (!q) { reconcile(); return; }
      const source = address(q.link.a) === address(m) ? 0 : 1, goal = q.ports[1 - source];
      walk(u, m, [goal], 'bridge:' + m.bridge, dt);
      statuses.set(u.id, 'Traversée de la passerelle ' + m.bridge); u.state = 'move';
      if (Math.hypot(u.x / R.tile - goal.x, u.y / R.tile - goal.y) <= C.VerticalRouting180.arrivalMetres) {
        const destination = source ? q.link.a : q.link.b; m.site = destination.site; m.level = destination.level; m.bridge = null; nav.forget(u.id);
      }
    }
    function routeTo(u, m, destination, dt) {
      const route = search(m, node => address(node) === address(destination));
      if (!route) { statuses.set(u.id, 'Réseau interrompu : attente et rappel disponibles'); return false; }
      if (route.first) traverse(u, m, route.first, dt);
      return !route.first;
    }
    function ground(u, m, dt) {
      const core = g.core(); if (!live(core)) return;
      if (m.mode === 'supply' || m.mode === 'return') {
        u.state = 'return'; statuses.set(u.id, m.recalled ? 'Retour au dépôt avant libération' : 'Réapprovisionnement au dépôt');
        if (!g.workerCanWorkAt(u, core, P.depotReach)) { g.moveUnitToward(u, core, dt); return; }
        const role = P.roles[u.kind];
        if (m.mode === 'return' && u.carry > P.epsilon) {
          const amount = Math.min(u.carry, Math.max(0, g.storage - g.resources[u.carryType]));
          g.resources[u.carryType] += amount; u.carry -= amount;
          // Restitution of already owned material is not harvesting or objective progress.
          if (u.carry > P.epsilon) { statuses.set(u.id, 'Dépôt plein : fournitures conservées'); return; }
          u.carry = 0; u.carryType = null;
        }
        if (m.recalled) { remove(u.id); return; }
        const amount = Math.min(role.capacity - u.carry, Math.max(0, g.resources[role.resource]));
        const taken = role.resource === 'ammo' ? Math.floor(amount) : amount;
        if (taken > 0) { g.resources[role.resource] -= taken; u.carry += taken; u.carryType = role.resource; }
        if (u.carry <= P.epsilon) { statuses.set(u.id, 'Pénurie au dépôt : ' + C.RESOURCE_META[role.resource].label); return; }
        m.mode = 'outbound'; u.navigation = null;
      }
      const entry = entryFor(m.home, u); if (!entry) { m.recalled = true; m.mode = 'return'; return; }
      const b = building(entry.site), goal = S.entrance(b);
      u.state = 'move'; statuses.set(u.id, 'Approche de l’accès au support ' + b.id);
      if (Math.hypot(u.x - goal.x, u.y - goal.y) > P.entryTolerance * R.tile) { g.moveUnitToward(u, goal, dt, u.speed * P.loadedSpeed); return; }
      m.site = b.id; m.level = -1;
      if (!beginStair(u, m, 0)) { m.site = null; statuses.set(u.id, 'Accès occupé : attente'); }
    }
    function targetGoals(u, b, module, z) {
      const box = S.moduleBox(b, module, z), margin = P.serviceReach * .65;
      return [{ x: box.x - margin, y: box.y + box.h / 2 }, { x: box.x + box.w + margin, y: box.y + box.h / 2 }, { x: box.x + box.w / 2, y: box.y - margin }, { x: box.x + box.w / 2, y: box.y + box.h + margin }];
    }
    function nearModule(u, q) {
      const z = pose(u).z, box = S.moduleBox(q.b, q.m, z), x = C.clamp(u.x / R.tile, box.x, box.x + box.w), y = C.clamp(u.y / R.tile, box.y, box.y + box.h);
      return Math.hypot(u.x / R.tile - x, u.y / R.tile - y) <= P.serviceReach && nav.line({ x: u.x / R.tile, y: u.y / R.tile, z: z + R.eyeHeight }, { x, y, z: z + R.eyeHeight }, q.m.id);
    }
    function waitingPosition(u, m, dt) {
      const b = building(m.site), box = S.bounds(b), x = box.x + box.w / 2, y = box.y + box.h / 2;
      const offsets = [[-1, -1], [1, -1], [-1, 1], [1, 1]], d = Math.min(P.waitOffset, box.w / 4, box.h / 4);
      const order = [...offsets.slice(u.id % 4), ...offsets.slice(0, u.id % 4)];
      const goals = order.map(([dx, dy]) => ({ x: x + dx * d, y: y + dy * d })).filter(p => clear(u, m, p.x * R.tile, p.y * R.tile));
      walk(u, m, goals, 'wait:' + address(m), dt); u.state = 'idle';
    }
    function duty(u, m, dt) {
      const b = building(m.site), deck = site(m.site).decks[m.level], z = pose(u).z;
      u.state = 'idle'; u.supportActive = false;
      const role = P.roles[u.kind];
      const danger = g.zombies.find(e => live(e) && Math.abs(h.enemyPose(e).z - z) < P.separationZ && Math.hypot(e.x - u.x, e.y - u.y) < P.dangerReach * R.tile && nav.line({ x: u.x / R.tile, y: u.y / R.tile, z: z + R.eyeHeight }, { x: e.x / R.tile, y: e.y / R.tile, z: z + R.eyeHeight }));
      if (danger && u.kind !== 'soldier') { m.mode = 'return'; services.delete(u.id); statuses.set(u.id, 'Menace proche : repli avec les fournitures'); return; }
      if (u.carry <= P.epsilon) { u.carry = 0; u.carryType = null; m.mode = 'return'; return; }
      if (u.kind === 'soldier') {
        const origin = { x: u.x / R.tile, y: u.y / R.tile, z: z + R.eyeHeight };
        const visible = h.sightQuery(origin, P.guardRange);
        const target = g.zombies.filter(live).filter(visible).sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y) || a.id - b.id)[0];
        if (target && u.fireCooldown <= 0 && u.carry >= 1) {
          const aim = S.lookAt(origin, h.aimPoint(target)), result = h.raycast(origin, aim.yaw, aim.pitch, P.guardRange);
          u.carry -= 1; u.fireCooldown = C.SQUAD_RULES.fireCooldown; u.facing = aim.yaw;
          h.hit(result, g.hasResearch('ballistics') ? C.SQUAD_RULES.researchedDamage : C.SQUAD_RULES.damage);
          h.trace(origin, result.point); g.audio?.noise?.(.035, .025, 1600); g.recordActorAction159?.(u, 'shoot', u.fireCooldown);
        }
        statuses.set(u.id, target ? 'Garde : engagement avec munitions portées' : 'Garde du palier');
        if (!target) waitingPosition(u, m, dt); return;
      }
      if (u.kind === 'medic') {
        const candidates = [g.player, ...g.units].filter(other => live(other) && !other.regionAbsent && other.health < other.maxHealth && Math.abs((other === g.player ? h.pose() : pose(other)).z - z) < P.separationZ);
        const target = candidates.sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth || a.id - b.id).find(other => Math.hypot(other.x - u.x, other.y - u.y) <= P.medicalSearch * R.tile && nav.line({ x: u.x / R.tile, y: u.y / R.tile, z: z + R.eyeHeight }, { x: other.x / R.tile, y: other.y / R.tile, z: z + R.eyeHeight }));
        if (target) {
          const distance = Math.hypot(target.x - u.x, target.y - u.y);
          if (distance > P.serviceReach * R.tile) walk(u, m, [{ x: target.x / R.tile, y: target.y / R.tile }], 'medic:' + (target.id || 0), dt);
          else { const amount = Math.min(target.maxHealth - target.health, C.NPC_RULES.healPerSecond * dt, u.carry / C.NPC_RULES.medicinePerHealth); target.health += amount; u.carry = Math.max(0, u.carry - amount * C.NPC_RULES.medicinePerHealth); u.state = 'repair'; u.supportActive = amount > 0; }
          statuses.set(u.id, 'Soins sur place : médicaments portés'); return;
        }
      } else {
        const candidates = deck.modules.filter(module => module.progress === 1 && module.health > 0 && !h.suspended(module.id) && (u.kind === 'worker' ? R.modules[module.kind].range && module.ammo < R.modules[module.kind].capacity : module.health < R.modules[module.kind].health));
        const module = candidates.sort((a, b) => a.id - b.id)[0];
        if (module) {
          const q = { b, m: module, def: R.modules[module.kind] };
          if (!nearModule(u, q)) { services.delete(u.id); walk(u, m, targetGoals(u, b, module, z), 'service:' + module.id, dt); u.state = 'move'; }
          else if (u.kind === 'engineer') {
            const amount = Math.min(q.def.health - module.health, P.repairRate * dt, u.carry / P.repairScrapPerHealth);
            module.health += amount; u.carry = Math.max(0, u.carry - amount * P.repairScrapPerHealth); u.state = 'repair'; u.supportActive = amount > 0;
          } else {
            let service = services.get(u.id);
            if (!service || service.id !== module.id || service.health !== u.health || service.moduleHealth !== module.health) { service = { id: module.id, elapsed: 0, health: u.health, moduleHealth: module.health }; services.set(u.id, service); }
            service.elapsed += dt; u.state = 'haul';
            if (service.elapsed + P.epsilon >= P.deliverySeconds) { const amount = Math.min(Math.floor(u.carry), q.def.capacity - module.ammo); module.ammo += amount; u.carry -= amount; services.delete(u.id); g.audio?.ui?.(); }
          }
          statuses.set(u.id, u.kind === 'worker' ? 'Livraison de cartouches au palier' : 'Réparation avec ferraille portée'); return;
        }
      }
      services.delete(u.id); statuses.set(u.id, 'En veille : ' + role.label); waitingPosition(u, m, dt);
    }
    function fall(u, m, previousHeight) {
      const altitude = previousHeight ?? pose(u).z;
      let landing = null;
      for (let radius = 0; !landing && radius <= P.landingSearch; radius += P.landingStep) for (let i = 0; i < (radius ? 8 : 1); i++) {
        const candidate = { x: u.x + Math.cos(i * Math.PI / 4) * radius * R.tile, y: u.y + Math.sin(i * Math.PI / 4) * radius * R.tile };
        if (h.groundClear(u, candidate.x, candidate.y)) { landing = candidate; break; }
      }
      m.site = null; m.level = -1; m.bridge = null; m.travel = null; m.mode = 'return'; services.delete(u.id); nav.forget(u.id); u.navigation = null;
      if (landing) Object.assign(u, landing);
      g.damageUnit(u, landing ? altitude * C.VerticalSiege176.fallDamagePerMetre : u.health);
      if (!live(u)) remove(u.id);
    }
    function reconcile(heights = new Map()) {
      for (const m of [...members()]) {
        const u = unit(m.id); if (!live(u)) { remove(m.id); continue; }
        if (m.home && !validFloor(m.home)) { m.home = null; m.recalled = true; m.mode = 'return'; }
        if (m.site === null) continue;
        if (!live(building(m.site)) || !building(m.site).completed || m.level >= 0 && !validFloor(m)) { fall(u, m, heights.get(u.id)); continue; }
        if (m.bridge !== null && !h.network().presentation().links.some(item => item.link.id === m.bridge && item.link.progress === 1)) {
          if (N.insideFloor(m, u, g.world.buildings, h.state().sites, u.radius * C.VerticalRouting180.bodyRadiusFactor / R.tile)) { m.bridge = null; nav.forget(u.id); } else fall(u, m);
        }
      }
    }
    function updateAssignedUnit(u, dt) {
      const m = member(u.id); if (!m) return false;
      if (!running() || !Number.isFinite(dt) || dt <= 0) return true;
      dt = Math.min(dt, R.step); u.fireCooldown=Math.max(0,u.fireCooldown-dt); reconcile(); if (!member(u.id) || !live(u)) return true;
      if (g.workerOrder === 'retreat' || u.kind === 'soldier' && g.squads?.groups[u.squad]?.order === 'retreat') { m.recalled = true; m.mode = 'return'; services.delete(u.id); }
      u.supportActive = false;
      if (m.travel) { stair(u, m, dt); return true; }
      if (m.bridge !== null) { cross(u, m, dt); return true; }
      if (m.site === null) { ground(u, m, dt); return true; }
      if (m.mode === 'return' || m.mode === 'supply') {
        const exit = entryFor(m, u); if (!exit) { statuses.set(u.id, 'Sortie interrompue : attente'); return true; }
        if (routeTo(u, m, exit, dt)) {
          const p = point(building(m.site), m.level, S); walk(u, m, [{ x: p.x / R.tile, y: p.y / R.tile }], 'ground-exit', dt); beginStair(u, m, -1);
        }
        u.state = 'return'; return true;
      }
      if (!validFloor(m.home)) { m.home = null; m.recalled = true; m.mode = 'return'; return true; }
      if (address(m) !== address(m.home)) {
        if (!search(m, node => address(node) === address(m.home))) { m.mode = 'return'; statuses.set(u.id, 'Réseau rompu : retour par une sortie construite'); }
        else routeTo(u, m, m.home, dt);
        u.state = 'move'; return true;
      }
      m.mode = 'duty'; duty(u, m, dt); return true;
    }
    const bridgeOccupied = id => members().some(m => m.bridge === id);
    const occupiesDeck = (id, level) => members().some(m => m.site === id && (m.level === level || m.travel?.to === level));
    function occupiesBox(box) {
      return members().some(m => {
        const u = unit(m.id); if (!live(u) || Math.abs(pose(u).z - box.z) > P.separationZ) return false;
        const x = u.x / R.tile, y = u.y / R.tile, radius = u.radius * C.VerticalRouting180.bodyRadiusFactor / R.tile;
        return x + radius > box.x && x - radius < box.x + box.w && y + radius > box.y && y - radius < box.y + box.h;
      });
    }
    function actions(siteId, level = 0) {
      const out = [], destination = { site: siteId, level };
      if (validFloor(destination)) for (const [kind, role] of Object.entries(P.roles)) {
        const candidate = g.units.filter(u => live(u) && !u.regionAbsent && u.kind === kind && !member(u.id) && !detached(u.id) && u.carry === 0).sort((a, b) => a.id - b.id)[0];
        if (candidate) out.push({ id: 'staff-assign-' + candidate.id, label: 'Affecter : ' + role.label + ' #' + candidate.id, close: true, description: 'Survivant existant, fournitures retirées au dépôt et transportées physiquement.', run: () => assign(candidate.id, siteId, level) });
      }
      for (const m of members()) {
        const u = unit(m.id); if (!live(u)) continue;
        out.push({ id: 'staff-recall-' + m.id, label: 'Rappeler #' + m.id + ' · ' + (statuses.get(m.id) || m.mode), close: true, description: 'Les fournitures restantes reviennent au dépôt avant réaffectation.', run: () => recall(m.id) });
        if (!m.recalled && validFloor(destination) && address(m.home) !== address(destination)) out.push({ id: 'staff-retask-' + m.id, label: 'Transférer #' + m.id + ' vers ce palier', close: true, run: () => retask(m.id, siteId, level) });
      }
      return out;
    }
    const api = { assign, retask, recall, pose, reconcile, updateAssignedUnit, isAssigned: id => !!member(id), bridgeOccupied, occupiesDeck, occupiesBox,
      unitsAt: (siteId, level) => members().filter(m => m.site === siteId && m.level === level && !m.travel).map(m => unit(m.id)).filter(live),
      actions, reset() { statuses.clear(); services.clear(); notice = ''; },
      overview: () => ({ label: 'Personnel et ravitaillement', value: members().length + ' / ' + P.slots[g.tier.id] + ' survivants affectés · ' + notice }),
      presentation: () => members().map(m => ({ ...copy(m), ...pose(unit(m.id)), kind: unit(m.id)?.kind, carry: unit(m.id)?.carry || 0, status: statuses.get(m.id) || m.mode })) };
    return Object.freeze(api);
  }
  const api = { initial, normalize, create };
  root.DeadwallVerticalPopulation181 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
