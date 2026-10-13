'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Context = require('../src/codex-context160.js');
const Geometry = require('../src/codex-geometry160.js');
const Runtime = require('../src/codex3000-runtime.js');
const G = require('../src/frontier-geometry.js');
const World = require('../src/frontier-world.js');
const Core = require('../src/core.js');
const Biomes = require('../src/biomes135.js');

const SEED = 17117;
const FOOT_RADIUS = .32;
const RESOURCE_KEYS = new Set(Core.RESOURCE_KEYS);
const historicalContexts = Biomes.defs.flatMap(biome => ['', ...Object.keys(Core.WorldTownRules141.required), 'cite-industrielle']
  .map(townKind => ({ biome: biome.id, townKind })));
const expectedIds = Runtime.records.filter(record => !Runtime.preset('codex3000-' + record.id.slice(3))
  || !historicalContexts.some(context => Runtime.enabled(record, context))).map(record => record.id);

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function parcel(id) {
  const record = Context.get(id), type = 'codex160-' + id.slice(3), preset = Context.preset(type);
  assert.ok(record && preset, id + ': a real contextual preset is required');
  return freeze({ ...preset, id: 'geometry160:' + id, type, x: 0, y: 0, a: 0,
    generation: 10, context160: record, programme160: id });
}

function finiteRectangle(rect, label) {
  assert.ok(rect && [rect.x, rect.y, rect.w, rect.h].every(Number.isFinite), label + ': finite rectangle');
  assert.ok(rect.w > 0 && rect.h > 0, label + ': positive physical dimensions');
}

function staticBlocked(p, plan, point, radius = FOOT_RADIUS, effects = {}) {
  if (plan.z !== undefined && plan.z !== 0 && (point.x < radius || point.y < radius
    || point.x > p.w - radius || point.y > p.h - radius)) return true;
  if (Geometry.terrainMovement(p, plan, point.x, point.y, radius, false, effects)) return true;
  return [...plan.walls, ...plan.objects].some(rect => G.circleRect(point.x, point.y, radius, rect));
}

function segmentFree(p, plan, from, to, radius = FOOT_RADIUS, effects = {}) {
  // Sample more finely than the physical diameter; a thin wall cannot fall
  // between the tested discs. No scene position or simulation is changed.
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / .12));
  for (let i = 0; i <= steps; i++) {
    const point = { x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps };
    if (staticBlocked(p, plan, point, radius, effects)) return false;
  }
  return true;
}

function servicePoints(object, radius = FOOT_RADIUS) {
  const gap = radius + .06, midX = object.x + object.w / 2, midY = object.y + object.h / 2;
  return [{ x: object.x - gap, y: midY }, { x: object.x + object.w + gap, y: midY },
    { x: midX, y: object.y - gap }, { x: midX, y: object.y + object.h + gap }];
}

function reachableContainer(p, plan, object, z) {
  const room = plan.rooms.find(candidate => object.x >= candidate.x - .01 && object.y >= candidate.y - .01
    && object.x + object.w <= candidate.x + candidate.w + .01 && object.y + object.h <= candidate.y + candidate.h + .01);
  if (!room) return false;
  const volume = (plan.volumes160 || []).find(candidate => object.x >= candidate.x && object.y >= candidate.y
    && object.x + object.w <= candidate.x + candidate.w && object.y + object.h <= candidate.y + candidate.h);
  const corridor = { x: p.w / 2, y: room.y + room.h / 2 };
  // A non-ground floor is entered through its actual staircase landing. Its
  // exterior doors and a room-specific virtual corridor are not entry points.
  const anchors = z === 0 ? (volume ? [volume.entry, volume.exit] : [corridor]) : plan.stairs
    .filter(stair => Array.isArray(stair.levels) && stair.levels.includes(z) && stair.levels.some(level => level !== z))
    .map(stair => ({ x: stair.x + stair.w / 2, y: stair.y + stair.h / 2 }));
  if (z === 0) anchors.push(plan.entry, plan.exit);
  const points = servicePoints(object).filter(point => !staticBlocked(p, plan, point));
  for (const from of anchors) for (const to of points) {
    if (segmentFree(p, plan, from, to)) return true;
    for (const turn of [{ x: from.x, y: to.y }, { x: to.x, y: from.y }]) {
      if (segmentFree(p, plan, from, turn) && segmentFree(p, plan, turn, to)) return true;
    }
  }
  // Local search proves access when furniture needs more than one turn. It
  // reads actual rectangles and admits no diagonal corner shortcut or warp.
  const solids = [...plan.walls, ...plan.objects, ...Geometry.rects(plan, {}, { optical: false })];
  const clear = point => !solids.some(rect => G.circleRect(point.x, point.y, FOOT_RADIUS, rect));
  const distance = point => Math.hypot(point.x - Math.max(object.x, Math.min(object.x + object.w, point.x)),
    point.y - Math.max(object.y, Math.min(object.y + object.h, point.y)));
  for (const from of anchors) {
    const bounds = { l: Math.min(from.x, room.x) - 2, r: Math.max(from.x, room.x + room.w) + 2,
      t: Math.min(from.y, room.y) - 2, b: Math.max(from.y, room.y + room.h) + 2 };
    if (z !== 0) { bounds.l = Math.max(bounds.l, FOOT_RADIUS); bounds.r = Math.min(bounds.r, p.w - FOOT_RADIUS);
      bounds.t = Math.max(bounds.t, FOOT_RADIUS); bounds.b = Math.min(bounds.b, p.h - FOOT_RADIUS); }
    const queue = [{ x: 0, y: 0 }], seen = new Set(['0:0']), spacing = .5;
    const position = cell => ({ x: from.x + cell.x * spacing, y: from.y + cell.y * spacing });
    if (!clear(from) || z !== 0 && (from.x < FOOT_RADIUS || from.y < FOOT_RADIUS
      || from.x > p.w - FOOT_RADIUS || from.y > p.h - FOOT_RADIUS)) continue;
    for (let head = 0; head < queue.length && head < 24000; head++) {
      const cell = queue[head], point = position(cell);
      if (distance(point) <= .75) return true;
      for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0], [0, 1]]) {
        const next = { x: cell.x + dx, y: cell.y + dy }, key = next.x + ':' + next.y, to = position(next);
        if (seen.has(key) || to.x < bounds.l || to.x > bounds.r || to.y < bounds.t || to.y > bounds.b) continue;
        if (![.25, .5, .75, 1].every(t => clear({ x: point.x + (to.x - point.x) * t, y: point.y + (to.y - point.y) * t }))) continue;
        seen.add(key); queue.push(next);
      }
    }
  }
  return false;
}

test('G10 context catalogue targets exactly the 626 previously unsupported complete contexts, without replacing the 4,000 records', () => {
  assert.equal(expectedIds.length, 626);
  assert.equal(Context.ids.length, 626);
  assert.equal(Context.records.length, 626);
  assert.equal(new Set(Context.ids).size, 626);
  assert.deepEqual([...Context.ids].sort(), [...expectedIds].sort());
  assert.equal(Runtime.records.length, 4000);
  for (const id of Context.ids) {
    assert.match(id, /^DW-\d{4}$/);
    assert.ok(Runtime.get(id), id + ': source programme remains present');
    assert.ok(Context.get(id), id + ': contextual data exists');
    assert.ok(Context.preset('codex160-' + id.slice(3)), id + ': executable contextual plan exists');
  }
  assert.equal(Context.get('DW-9999'), null);
  assert.equal(Context.preset('codex160-9999'), null);
});

for (const id of Context.ids) test('G10 contextual geometry ' + id + ': source footprint, deterministic floors, public return and finite independent containers', () => {
  const p = parcel(id), source = Runtime.parentFor(Runtime.get(id))[4], parcelBefore = JSON.stringify(p);
  const contract = Context.get(id), historical = Runtime.template(id, SEED, p.id);
  assert.deepEqual(contract.sourceMin, source.sourceMin, id + ': authored minimum remains explicit provenance');
  assert.deepEqual(contract.reference.min, source.sourceMin, id + ': source reference cannot be rewritten to hide adaptation');
  if (contract.profile) {
    assert.ok(p.w >= source.sourceMin[0] && p.h >= source.sourceMin[1], id + ': each of the 300 newly physical profiles respects its authored minimum');
    assert.equal(contract.adaptation.footprint, 'authored-minimum');
  } else {
    assert.deepEqual([p.w, p.h], [historical.w, historical.h], id + ': each of the 326 contextual interiors retains its declared historical metric plan');
    assert.deepEqual(p.levels, historical.levels);
    assert.equal(contract.adaptation.footprint, 'historical-metric-plan');
    assert.equal(contract.adaptation.sourceWasAdaptedInHistoricalTemplate, historical.adapted,
      id + ': inherited source adaptation stays disclosed, including the 90m source programmes adapted to 78m historically');
  }
  assert.ok(Array.isArray(p.levels) && p.levels.includes(0), id + ': reachable ground level');
  assert.equal(new Set(p.levels).size, p.levels.length, id + ': unique floors');
  const objectIds = new Set(), plans = [];
  for (const z of p.levels) {
    const random = Math.random;
    let plan;
    try {
      Math.random = () => { throw Error(id + ': geometry must not draw from simulation/cosmetic Math.random'); };
      plan = Geometry.plan(p, SEED, z);
      assert.deepEqual(Geometry.plan(p, SEED, z), plan, id + ': seed and identity reconstruct the same geometry');
    } finally { Math.random = random; }
    const before = JSON.stringify(plan);
    for (const key of ['walls', 'objects', 'stairs', 'rooms', 'terrain160', 'movement160', 'gates160', 'visuals160', 'operations160']) {
      assert.ok(Array.isArray(plan[key]), id + ': explicit ' + key + ' contract');
    }
    assert.deepEqual(plan.entry, { x: p.w / 2, y: -1 }, id + ': public entrance');
    assert.deepEqual(plan.exit, { x: p.w / 2, y: p.h + 1 }, id + ': public return');
    const from = z === 0 ? plan.entry : { x: p.w / 2, y: .6 };
    const to = z === 0 ? plan.exit : { x: p.w / 2, y: p.h - .6 };
    assert.ok(segmentFree(p, plan, from, to), id + ': public circulation cannot be closed by water, cliff, gate, wall or prop at floor ' + z);
    assert.ok(plan.objects.length > 0, id + ': accessible floor cannot replace finite content with an empty shell');
    const budget = objects => objects.map(object => ({ id: object.id, kind: object.kind, resource: object.resource,
      amount: object.amount, w: object.w, h: object.h })).sort((a, b) => a.id.localeCompare(b.id));
    assert.deepEqual(budget(plan.objects), budget(Runtime.floor(id, SEED, z, p.id).objects),
      id + ': extra surfaces and buildings redistribute exactly the parent finite budget, not a new stock');
    for (const object of plan.objects) {
      finiteRectangle(object, id + ': container ' + object.id);
      assert.equal(typeof object.id, 'string');
      assert.ok(object.id.length && !objectIds.has(object.id), id + ': container ID is unique across every floor');
      objectIds.add(object.id);
      assert.ok(RESOURCE_KEYS.has(object.resource), id + ': container uses an existing resource owner');
      assert.ok(Number.isFinite(object.amount) && object.amount > 0, id + ': finite positive reserve');
      assert.ok(object.x >= 0 && object.y >= 0 && object.x + object.w <= p.w && object.y + object.h <= p.h,
        id + ': container is in its real footprint');
      assert.ok(servicePoints(object).some(point => point.x >= FOOT_RADIUS && point.y >= FOOT_RADIUS
        && point.x <= p.w - FOOT_RADIUS && point.y <= p.h - FOOT_RADIUS && !staticBlocked(p, plan, point)),
      id + ': finite container has a free physical working face at floor ' + z);
      assert.ok(reachableContainer(p, plan, object, z), id + ': public circulation reaches finite container ' + object.id
        + ' without crossing solids (local search limit 24,000 positions per anchor)');
    }
    for (const stair of plan.stairs) {
      finiteRectangle(stair, id + ': stair');
      assert.ok(Array.isArray(stair.levels) && stair.levels.includes(z), id + ': staircase belongs to the active floor');
      const centre = { x: stair.x + stair.w / 2, y: stair.y + stair.h / 2 };
      assert.ok(segmentFree(p, plan, { x: p.w / 2, y: centre.y }, centre), id + ': staircase approach remains physical');
      assert.equal(staticBlocked(p, plan, centre), false, id + ': staircase landing must be clear');
    }
    if (contract.mode === 'cluster') {
      assert.ok(Array.isArray(plan.volumes160), id + ': explicit compound volumes');
      const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const district = /quartier|agglomeration/.test(normalize(contract.family));
      const authoredClosedUse = contract.parentRooms.some(room => /sanitaire|restauration|maintenance|local|cabine|vitrine|entrepot|halle|commande|technique|gestion|capitain|atelier|criee|voiture.*amenage/.test(normalize(room.name)));
      if (district) assert.ok(plan.volumes160.length >= 2,
        id + ': a real district contains distinct inhabited/service volumes rather than one generic shell');
      else if (authoredClosedUse) assert.ok(plan.volumes160.length >= 1,
        id + ': an authored closed service use has its own physical volume');
      for (let index = 0; index < plan.volumes160.length; index++) {
        const volume = plan.volumes160[index];
        finiteRectangle(volume, id + ': compound volume ' + volume.id);
        const usage = plan.rooms.find(room => room.id === volume.id);
        if (usage) assert.ok(!/^(parking|chausse[eé]|trottoir|quai|pontons?|rue|cour|bassin|friche|liaison|voie d.acces)(\b| )/.test(normalize(usage.name)),
          id + ': open road, quay, yard or water use is not turned into an unrelated enclosed building');
        assert.ok(volume.x >= 0 && volume.y >= 0 && volume.x + volume.w <= p.w && volume.y + volume.h <= p.h,
          id + ': compound volume cannot escape its authored envelope');
        for (const other of plan.volumes160.slice(index + 1)) assert.equal(G.overlap(
          { l: volume.x, r: volume.x + volume.w, t: volume.y, b: volume.y + volume.h },
          { l: other.x, r: other.x + other.w, t: other.y, b: other.y + other.h }), false,
        id + ': distinct buildings cannot occupy one another');
        assert.equal(staticBlocked(p, plan, volume.entry), false, id + ': volume entry is a real clear doorway');
        assert.equal(staticBlocked(p, plan, volume.exit), false, id + ': volume return is a real clear doorway');
        assert.ok(segmentFree(p, plan, { x: p.w / 2, y: volume.entry.y }, volume.entry),
          id + ': public street reaches each separate building entry');
      }
      assert.ok(segmentFree(p, plan, { x: FOOT_RADIUS, y: p.h / 2 }, { x: p.w - FOOT_RADIUS, y: p.h / 2 }),
        id + ': transverse district street has a physical return through the whole quarter');
    }
    assert.equal(JSON.stringify(plan), before, id + ': physical reads must not change containers or geometry');
    plans.push(plan);
  }
  if (p.levels.length > 1) {
    for (let index = 1; index < p.levels.length; index++) {
      const below = p.levels[index - 1], above = p.levels[index];
      for (const level of [below, above]) assert.ok(plans[p.levels.indexOf(level)].stairs.some(stair => stair.levels.includes(below) && stair.levels.includes(above)),
        id + ': both sides of each floor transition have an actual staircase');
    }
  }
  assert.equal(JSON.stringify(p), parcelBefore, id + ': generation cannot mutate its parcel, preset or source context');
});

test('G10 real water and relief block bodies while leaving non-opaque terrain optically clear; bridge corridors remain continuous', () => {
  let water = 0, relief = 0;
  for (const id of Context.ids) {
    const p = parcel(id), plan = Geometry.plan(p, SEED, 0);
    const rects = Geometry.rects(plan, {}, { optical: false });
    for (const rect of rects) {
      if (!/water|basin|cliff|relief|escarp/i.test(rect.kind)) continue;
      finiteRectangle(rect, id + ': terrain collider');
      const point = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
      assert.equal(Geometry.terrainMovement(p, plan, point.x, point.y, .02), true, id + ': visible terrain denies a physical foot body');
      assert.equal(Geometry.terrainMovement(p, plan, point.x, point.y, .02, true), true, id + ': forbidden terrain does not admit a vehicle');
      if (rect.opaque === false) assert.equal(Geometry.optical(p, plan, point.x, point.y, .02), false,
        id + ': movement-only terrain must not manufacture an optical wall');
      if (/water|basin/i.test(rect.kind)) water++;
      if (/cliff|relief|escarp/i.test(rect.kind)) relief++;
    }
  }
  assert.ok(water > 0, 'the catalogue must contain actual physical water, not only names');
  assert.ok(relief > 0, 'the catalogue must contain actual physical relief, not only shadows');
});

test('G10 terrain collision respects circle corners and the full oriented vehicle footprint', () => {
  const p = { id: 'geometry160:collision', x: 0, y: 0, a: 0, w: 20, h: 20, levels: [0], generation: 10 };
  const rect = freeze({ id: p.id + ':cliff', kind: 'cliff', x: 8, y: 4, w: 2, h: 2, z: 0, opaque: false });
  const plan = freeze({ terrain160: [], movement160: [rect], gates160: [], visuals160: [] });
  assert.equal(Geometry.terrainMovement(p, plan, 7.7, 3.7, .4), false, 'a square margin cannot block the free rounded corner');
  assert.equal(Geometry.terrainMovement(p, plan, 7.8, 3.8, .4), true, 'a real circle touching the cliff corner is blocked');
  assert.equal(Geometry.terrainMovement(p, plan, 5.9, 5, .32), false, 'pedestrian centre remains physically clear');
  assert.equal(Geometry.terrainMovement(p, plan, 5.9, 5, .32, { x: 5.9, y: 5, a: 0, w: 4.6, h: 1.85 }), true,
    'a real chassis nose cannot be replaced by its clear centre or a pedestrian disc');
  assert.equal(Geometry.terrainMovement(p, plan, 5.9, 5, .32, { x: 5.9, y: 5, a: Math.PI / 2, w: 4.6, h: 1.85 }), false,
    'rotating the same chassis changes its actual terrain contact');
  assert.equal(Geometry.optical(p, plan, 9, 5, .02), false, 'this particular relief boundary is explicitly movement-only');
});

test('G10 optional gates require their exact completed-operation key without opening unrelated colliders or changing a budget', () => {
  const p = { id: 'geometry160:gate', x: 0, y: 0, a: 0, w: 20, h: 20, levels: [0], generation: 10 };
  const gate = freeze({ id: p.id + ':gate', kind: 'gate', x: 3, y: 3, w: 2, h: .3, z: 0, opaque: true, completedKey: p.id + ':open-gate' });
  const other = freeze({ id: p.id + ':other', kind: 'barrier', x: 8, y: 3, w: 2, h: .3, z: 0, opaque: true });
  const plan = freeze({ terrain160: [], movement160: [other], gates160: [gate], visuals160: [] });
  const resources = freeze({ wood: 8, scrap: 6 }), before = JSON.stringify({ plan, resources }), reads = [];
  const incomplete = { contextCompleted160: key => { reads.push(key); return false; } };
  const wrong = { contextCompleted160: key => key === 'foreign-site:open-gate' };
  const completed = { contextCompleted160: key => key === gate.completedKey };
  assert.equal(Geometry.terrainMovement(p, plan, 4, 3.15, .05, false, incomplete), true);
  assert.equal(Geometry.terrainMovement(p, plan, 4, 3.15, .05, false, wrong), true);
  assert.equal(Geometry.terrainMovement(p, plan, 4, 3.15, .05, false, completed), false);
  assert.equal(Geometry.optical(p, plan, 4, 3.15, .05, incomplete), true);
  assert.equal(Geometry.optical(p, plan, 4, 3.15, .05, completed), false);
  assert.equal(Geometry.terrainMovement(p, plan, 9, 3.15, .05, false, completed), true, 'another permanent barrier cannot be removed');
  assert.ok(reads.includes(gate.completedKey), 'the real owning operation key is queried');
  assert.equal(JSON.stringify({ plan, resources }), before, 'reading completed state grants or spends no stock and rewrites no collider');
});

test('G10 rail parents 0281–0300 stay dry unless an authored coastal supplement or exact pump owns the water; original dry port 0438 has real rail without waterfront', () => {
  const records = Context.records.filter(record => {
    const parent = Number(record.parent.slice(3));
    return parent >= 281 && parent <= 300;
  });
  assert.equal(new Set(records.map(record => record.parent)).size, 20, 'every authored rail parent is checked');
  const declaredKinds = record => (record.profile?.operations || record.contextProfile?.operations || record.operations || [])
    .map(operation => typeof operation === 'string' ? operation : operation.kind);
  const coastalModules = new Set(['port', 'plage', 'lac']);
  function waterContract(record, p, plan, z) {
    const waters = plan.terrain160.filter(terrain => terrain.kind === 'water');
    const bands = waters.filter(water => water.serviceBasin !== true);
    const coastalSupplement = coastalModules.has(record.module) && Boolean(record.contextProfile);
    assert.equal(bands.length, z === 0 && coastalSupplement ? 1 : 0,
      record.id + ': only an explicitly authored coastal supplement may add exactly one secondary water band');
    for (const water of waters) {
      finiteRectangle(water, record.id + ': declared water');
      assert.equal(water.blocked, true, record.id + ': declared water has an actual physical boundary');
      assert.equal(water.opaque, false, record.id + ': an impassable water surface is not an optical wall');
      const centre = { x: water.x + water.w / 2, y: water.y + water.h / 2 };
      assert.equal(Geometry.terrainMovement(p, plan, centre.x, centre.y, .02), true,
        record.id + ': declared water really denies a physical foot body');
      if (water.serviceBasin === true) {
        assert.ok(declaredKinds(record).includes('pumpBasin'), record.id + ': a basin requires the authored pump operation');
        const pump = plan.operations160.find(operation => operation.kind === 'pumpBasin' && operation.barrierId === water.id);
        assert.ok(pump, record.id + ': the declared pump owns this exact water obstacle');
        assert.equal(water.completedKey, p.id + ':160:' + pump.key, record.id + ': basin removal is tied to the exact site operation');
      } else {
        assert.ok(coastalSupplement, record.id + ': a rail name or transport family cannot invent water');
        assert.equal(water.contextSource160, record.module, record.id + ': water cites the exact authored supplemental context');
        assert.ok(water.x >= p.w, record.id + ': secondary coastal water lies to the right of the parent footprint');
      }
    }
    return waters;
  }
  for (const record of records) {
    const p = parcel(record.id);
    for (const z of p.levels) {
      const plan = Geometry.plan(p, SEED, z);
      if (z === 0) assert.ok(plan.terrain160.some(terrain => terrain.kind === 'rail' && terrain.w > 0 && terrain.h > 0),
        record.id + ': a rail context carries a real finite physical rail alignment');
      waterContract(record, p, plan, z);
    }
  }
  const dryPorts = Context.records.filter(record => record.parent === 'DW-0438');
  assert.ok(dryPorts.length > 0, 'the authored dry port and its inherited programmes are checked');
  for (const record of dryPorts) {
    const p = parcel(record.id), plan = Geometry.plan(p, SEED, 0);
    const waters = waterContract(record, p, plan, 0);
    if (record.id === 'DW-0438') assert.equal(waters.length, 0, record.id + ': the original dry port has no invented waterfront');
    assert.ok(plan.terrain160.some(terrain => terrain.kind === 'rail' && terrain.w > 0 && terrain.h > 0), record.id + ': dry port retains an actual rail connection');
  }
});

test('G10 roundabout 0262 has a real drivable annulus, two tangent arms and an island that denies cars without closing the public foot return', () => {
  const records = Context.records.filter(record => record.parent === 'DW-0262');
  assert.ok(records.length > 0, 'the authored roundabout and inherited programmes are checked');
  for (const record of records) {
    const p = parcel(record.id), plan = Geometry.plan(p, SEED, 0), roundabout = plan.roundabout160;
    assert.ok(roundabout, record.id + ': roundabout geometry is explicitly published');
    const ring = plan.terrain160.find(terrain => terrain.kind === 'road' && terrain.shape === 'annulus');
    assert.ok(ring && ring.innerRx > 0 && ring.innerRy > 0, record.id + ': an annular road is not a filled intersection');
    const centre = roundabout.centre, outer = roundabout.outer, inner = roundabout.inner;
    assert.deepEqual(centre, { x: p.w / 2, y: p.h / 2 });
    assert.deepEqual(inner, { rx: ring.innerRx, ry: ring.innerRy });
    assert.deepEqual(outer, { rx: ring.w / 2, ry: ring.h / 2 });
    assert.ok(outer.rx > inner.rx && outer.ry > inner.ry, record.id + ': positive usable ring width');
    assert.equal(roundabout.tangentArms, 2);
    const roadWidth = outer.rx - inner.rx, offset = (outer.rx + inner.rx) / 2;
    const arms = plan.terrain160.filter(terrain => terrain.kind === 'road' && terrain.shape !== 'annulus');
    const near = (a, b) => Math.abs(a - b) < 1e-7;
    const north = arms.find(arm => near(arm.x + arm.w / 2, centre.x + offset) && near(arm.w, roadWidth)
      && arm.y < 0 && arm.y + arm.h >= centre.y);
    const south = arms.find(arm => near(arm.x + arm.w / 2, centre.x - offset) && near(arm.w, roadWidth)
      && arm.y <= centre.y && arm.y + arm.h > p.h);
    assert.ok(north && south && north.id !== south.id, record.id + ': two actual tangent approach rectangles join opposite ring sides');
    assert.equal(arms.some(arm => centre.x > arm.x && centre.x < arm.x + arm.w
      && centre.y > arm.y && centre.y < arm.y + arm.h), false, record.id + ': no drivable radial shortcut crosses the island');
    const islands = Geometry.rects(plan, {}, { vehicle: true }).filter(rect => rect.vehicleOnly === true);
    assert.ok(islands.length > 0, record.id + ': the vehicle island has actual colliders');
    assert.ok(islands.every(rect => rect.opaque === false), record.id + ': this vehicle-only island does not manufacture an optical wall');
    assert.equal(Geometry.rects(plan).some(rect => rect.vehicleOnly === true), false, record.id + ': car restrictions do not become pedestrian walls');
    const centreCar = { ...centre, a: 0, w: 4.6, h: 1.85 };
    assert.equal(Geometry.terrainMovement(p, plan, centre.x, centre.y, FOOT_RADIUS, centreCar), true, record.id + ': full car chassis cannot traverse the island');
    assert.equal(Geometry.terrainMovement(p, plan, centre.x, centre.y, FOOT_RADIUS), false, record.id + ': the declared pedestrian island crossing remains open');
    assert.equal(Geometry.optical(p, plan, centre.x, centre.y, .05), false, record.id + ': island stays optically clear');
    assert.ok(segmentFree(p, plan, plan.entry, plan.exit), record.id + ': public foot route and return remain physically continuous');
    const point = roundabout.carPoint;
    assert.ok(point && [point.x, point.y, point.a].every(Number.isFinite), record.id + ': an actual drivable ring point is declared');
    assert.ok(near(point.x, centre.x + offset) && near(point.y, centre.y) && near(point.a, Math.PI / 2),
      record.id + ': the declared car aligns tangentially with the ring');
    const car = { ...point, w: 4.6, h: 1.85 };
    for (const [x, y] of [[-car.w / 2, -car.h / 2], [-car.w / 2, car.h / 2], [car.w / 2, -car.h / 2], [car.w / 2, car.h / 2]]) {
      const dx = car.x + x * Math.cos(car.a) - y * Math.sin(car.a) - centre.x;
      const dy = car.y + x * Math.sin(car.a) + y * Math.cos(car.a) - centre.y;
      assert.ok((dx / outer.rx) ** 2 + (dy / outer.ry) ** 2 < 1, record.id + ': every chassis corner stays inside the outer ring');
      assert.ok((dx / inner.rx) ** 2 + (dy / inner.ry) ** 2 > 1, record.id + ': no chassis corner shortcuts across the island');
    }
    assert.equal(Geometry.terrainMovement(p, plan, point.x, point.y, FOOT_RADIUS, car), false,
      record.id + ': the declared ring route truly admits the full oriented car');
  }
});

for (const seed of [17117, 42]) test('G10 world ' + seed + ': exact G9 prefix, contextual plans and historical resource tombstones survive the extension', () => {
  const previous = World.create(seed, 9), next = World.create(seed, 10);
  assert.deepEqual(next.home, previous.home);
  assert.deepEqual(next.roads.slice(0, previous.roads.length), previous.roads, 'every historical road, width, identity and endpoint stays exact');
  assert.deepEqual(next.pois.slice(0, previous.pois.length), previous.pois, 'every historical parcel and finite prop owner stays exact');
  const sites = next.contextSites160();
  assert.ok(Array.isArray(sites) && sites.length > 0 && sites.length <= Context.ids.length);
  assert.equal(new Set(sites.map(p => p.id)).size, sites.length);
  for (const p of sites) {
    assert.equal(p.generation, 10);
    assert.ok(Context.ids.includes(p.programme160), p.id + ': native context site keeps its authored programme');
    assert.equal(next.pois.includes(p), true, p.id + ': context is an actual world parcel');
    assert.strictEqual(next.contextPlan160(p, 0), next.plan(p, 0), p.id + ': contextual alias shares the authoritative physical plan');
  }
  const roundaboutSite = sites.find(p => p.context160?.parent === 'DW-0262');
  assert.ok(roundaboutSite, 'this actual G10 world contains a physically placed authored roundabout');
  const roundaboutPlan = next.contextPlan160(roundaboutSite, 0), roundabout = roundaboutPlan.roundabout160;
  assert.ok(roundabout, roundaboutSite.id + ': native world publishes the actual roundabout geometry');
  const { centre, outer, inner } = roundabout;
  const islands = Geometry.rects(roundaboutPlan, {}, { vehicle: true }).filter(rect => rect.vehicleOnly === true);
  assert.equal(islands.length, 1, roundaboutSite.id + ': one physical elliptical island, not a stack of rectangular approximations');
  const island = islands[0];
  assert.equal(island.shape, 'ellipse');
  assert.equal(island.w, inner.rx * 2);
  assert.equal(island.h, inner.ry * 2);
  const angle = Math.PI / 4, extent = (4.6 + 1.85) / (2 * Math.sqrt(2));
  const point = { x: centre.x + inner.rx + extent - .8, y: centre.y + inner.ry + extent - .8 };
  const chassis = { ...point, a: angle, w: 4.6, h: 1.85 };
  assert.equal(G.obb(chassis, { ...centre, a: 0, w: inner.rx * 2, h: inner.ry * 2 }), true,
    roundaboutSite.id + ': the chassis really overlaps the island bounding box, so the free corner cannot be faked');
  for (const [x, y] of [[-chassis.w / 2, -chassis.h / 2], [-chassis.w / 2, chassis.h / 2],
    [chassis.w / 2, -chassis.h / 2], [chassis.w / 2, chassis.h / 2]]) {
    const dx = chassis.x + x * Math.cos(angle) - y * Math.sin(angle) - centre.x;
    const dy = chassis.y + x * Math.sin(angle) + y * Math.cos(angle) - centre.y;
    assert.ok((dx / outer.rx) ** 2 + (dy / outer.ry) ** 2 < 1,
      roundaboutSite.id + ': every 45-degree chassis corner stays within the outer roadway');
    assert.ok((dx / inner.rx) ** 2 + (dy / inner.ry) ** 2 > 1,
      roundaboutSite.id + ': no 45-degree chassis corner enters the real elliptical island');
  }
  assert.equal(Geometry.terrainMovement(roundaboutSite, roundaboutPlan, point.x, point.y, FOOT_RADIUS, chassis), false,
    roundaboutSite.id + ': exact ellipse collision admits the real rotated chassis outside the island');
  const worldPoint = G.global(roundaboutSite, point.x, point.y);
  assert.equal(next.vehicleClear(worldPoint.x, worldPoint.y, roundaboutSite.a + angle, chassis.w, chassis.h), true,
    roundaboutSite.id + ': native world uses the same exact shape after transforming the full chassis into plot coordinates');
  const worldCentre = G.global(roundaboutSite, centre.x, centre.y);
  assert.equal(next.vehicleClear(worldCentre.x, worldCentre.y, roundaboutSite.a + angle, chassis.w, chassis.h), false,
    roundaboutSite.id + ': actual island remains impassable at its centre');
  const chunks = new Map();
  for (const p of [next.home, ...sites.slice(0, 12)]) {
    const cx = Math.floor(p.x / 256), cy = Math.floor(p.y / 256);
    chunks.set(cx + ':' + cy, [cx, cy]);
  }
  for (const [cx, cy] of chunks.values()) {
    const oldChunk = previous.chunk(cx, cy), newChunk = next.chunk(cx, cy);
    const historical = [...oldChunk.trees, ...oldChunk.rocks, ...(oldChunk.cleared || [])];
    const current = [...newChunk.trees, ...newChunk.rocks, ...(newChunk.cleared || [])];
    const byId = new Map(current.map(resource => [resource.id, resource]));
    assert.equal(byId.size, current.length, 'a cleared reserve must not be duplicated under the same resource ID');
    for (const resource of historical) assert.deepEqual(byId.get(resource.id), resource,
      seed + ':' + resource.id + ': extension clearing preserves the full historical reserve or its exact tombstone');
  }
});
