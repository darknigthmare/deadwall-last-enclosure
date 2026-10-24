/* Finite seed-local forage. Descriptors own no stock, discovery or random state. */
(function (root) {
  'use strict';
  const core = () => root.DeadwallCore || (typeof require === 'function' ? require('./core.js') : null);
  const geometry = () => root.DeadwallFrontierGeometry || (typeof require === 'function' ? require('./frontier-geometry.js') : null);
  const originCaches = new WeakMap();
  function rules() {
    const value = core()?.Forage193Rules;
    if (!value) throw Error('Règles de cueillette193 absentes.');
    return value;
  }
  const species = () => rules().species;
  const profile = w => w.landscape189 || 'classic';
  function enabled(w) {
    if (!w || !Number.isInteger(w.seed) || w.seed < 0 || w.seed > 0xffffffff ||
        !Number.isFinite(w.size) || w.size <= 0 || w.size > core().GeographyRules135.size ||
        !Number.isInteger(w.generation) || w.generation < 8 || w.generation > 11 ||
        w.ecologyVersion !== 1 || w.hydrologyVersion !== 1 ||
        !['classic', 'balanced', 'large', 'patchwork'].includes(profile(w))) return false;
    return !!w.hydrology && typeof w.hydrology.sample === 'function' &&
      typeof w.hydrology.blockedCircle === 'function' && typeof w.biomeAt === 'function' &&
      typeof w.nearestRoad === 'function' && Number.isFinite(w.home?.x) && Number.isFinite(w.home?.y);
  }
  function coordinates(w, cx, cy, slot) {
    if (!enabled(w) || ![cx, cy, slot].every(Number.isInteger)) return false;
    const R = rules(), limit = Math.ceil(w.size / R.chunk);
    return cx >= 0 && cy >= 0 && cx < limit && cy < limit && slot >= 0 && slot < R.candidates;
  }
  function originCache(w, R) {
    // These owners describe static geography only. Current solids and parcel
    // operations deliberately stay outside the cached identity calculation.
    const owners = [R, R.species, core().GeographyRules135, geometry(), geometry().hash, w.seed, w.size, w.generation,
      w.ecologyVersion, w.hydrologyVersion, w.detailVersion, profile(w), w.biomes,
      w.biomeAt, w.hydrology, w.hydrology.sample, w.hydrology.blockedCircle,
      w.nearestRoad, w.roads, w.roads?.length, w.home, w.home.x, w.home.y];
    let record = originCaches.get(w);
    if (!record || owners.some((value, i) => value !== record.owners[i])) {
      record = {owners, rows: new Map()}; originCaches.set(w, record);
    }
    return record.rows;
  }
  function candidate(w, id) {
    if (typeof id !== 'string') return null;
    const match = /^F193_(0|[1-9]\d{0,2})_(0|[1-9]\d{0,2})_(0|[1-9]\d*)$/.exec(id);
    if (!match) return null;
    const [cx, cy, slot] = match.slice(1).map(Number);
    if (!coordinates(w, cx, cy, slot)) return null;
    const R = rules(), cache = originCache(w, R);
    if (cache.has(id)) { const value = cache.get(id); cache.delete(id); cache.set(id, value); return value; }
    const keep = value => {
      cache.set(id, value);
      if (cache.size > R.candidateCache) cache.delete(cache.keys().next().value);
      return value;
    };
    const unit = key => geometry().hash(w.seed, 'forage193:' + profile(w) + ':' + id + ':' + key) / 4294967296;
    if (unit('presence') >= R.chance) return keep(null);
    const x = (cx + .08 + unit('x') * .84) * R.chunk,
      y = (cy + .08 + unit('y') * .84) * R.chunk,
      biome = w.biomeAt(x, y), choices = [];
    for (const d of Object.values(species())) {
      const weight = d.biomes[biome.id] || 0;
      if (weight > 0) choices.push([d, weight]);
    }
    if (!choices.length) return keep(null);
    let draw = unit('species') * choices.reduce((sum, row) => sum + row[1], 0), d = choices.at(-1)[0];
    for (const row of choices) { draw -= row[1]; if (draw < 0) { d = row[0]; break; } }
    const r = d.radius, water = w.hydrology.sample(x, y), road = w.nearestRoad({ x, y });
    if (x <= r || y <= r || x >= w.size - r || y >= w.size - r ||
        Math.hypot(x - w.home.x, y - w.home.y) < R.homeExclusion + r ||
        water.water || water.movementBlocked || water.crossing || w.hydrology.blockedCircle(x, y, r) ||
        road && road.d <= road.road.width / 2 + R.roadClearance + r) return keep(null);
    const amount = d.amount[0] + Math.floor(unit('amount') * (d.amount[1] - d.amount[0] + 1));
    return keep(Object.freeze({ id, x, y, z: 0, poi: null, species: d.id, family: d.family,
      resource: d.resource, amount, variant: Math.floor(unit('variant') * 4), a: unit('angle') * Math.PI * 2,
      radius: r, length: d.length, width: d.width, name: d.name, label: d.name, seconds: d.seconds, profile: d,
      biome: biome.id, landscape189: profile(w) }));
  }
  function admitted(w, q) {
    if (!q || !enabled(w) || typeof w.blocked !== 'function') return false;
    const canonical = candidate(w, q.id);
    if (!canonical || ['x', 'y', 'species', 'radius', 'amount'].some(key => q[key] !== canonical[key])) return false;
    const R = rules(), pad = q.radius + R.parcelClearance;
    // Parcels and their approaches can be added by a later world extension.
    // They veto presentation now, never the old finite harvest identity.
    if (w.drivewayAt?.(q.x, q.y, q.radius + R.roadClearance)) return false;
    for (const p of w.nearPOI?.(q.x, q.y, pad) || []) {
      const b = p.reserve;
      if (b && geometry().circleRect(q.x, q.y, pad, { x: b.l, y: b.t, w: b.r - b.l, h: b.b - b.t })) return false;
      const d = p.drive;
      if (d && geometry().nearest(q, d.a, d.b).d <= d.width / 2 + q.radius + R.roadClearance) return false;
    }
    return !w.blocked(q.x, q.y, q.radius, 0, null);
  }
  function chunk(w, cx, cy) {
    if (!coordinates(w, cx, cy, 0)) return [];
    const rows = [];
    for (let slot = 0; slot < rules().candidates; slot++) {
      const q = candidate(w, 'F193_' + cx + '_' + cy + '_' + slot);
      if (q && admitted(w, q)) rows.push(q);
    }
    return rows;
  }
  function around(w, x, y, range = rules().viewRange) {
    if (!enabled(w) || ![x, y, range].every(Number.isFinite) || range < 0 ||
        x < 0 || y < 0 || x > w.size || y > w.size) return [];
    const R = rules(), limit = Math.ceil(w.size / R.chunk) - 1, rows = [];
    for (let cy = Math.max(0, Math.floor((y - range) / R.chunk)); cy <= Math.min(limit, Math.floor((y + range) / R.chunk)); cy++) {
      for (let cx = Math.max(0, Math.floor((x - range) / R.chunk)); cx <= Math.min(limit, Math.floor((x + range) / R.chunk)); cx++) {
        for (const q of chunk(w, cx, cy)) if (Math.hypot(q.x - x, q.y - y) <= range) rows.push(q);
      }
    }
    return rows.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y) || a.id.localeCompare(b.id));
  }
  const api = Object.freeze({ species, candidate, chunk, around, admitted });
  root.DeadwallBiomeForage193 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
