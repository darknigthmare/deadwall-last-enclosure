'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const C = require('../src/core.js'), G = require('../src/frontier-geometry.js');
const F = require('../src/biome-forage193.js');
const copy = value => JSON.parse(JSON.stringify(value));
function field(options = {}) {
  return {
    seed: 17117, size: C.GeographyRules135.size, generation: 8,
    ecologyVersion: 1, hydrologyVersion: 1, landscape189: 'classic',
    home: { x: 12000, y: 12000 },
    hydrology: {
      sample: () => ({ water: false, movementBlocked: false, crossing: null, distanceToWater: 1000 }),
      blockedCircle: () => false
    },
    biomeAt: () => ({ id: 'bocage' }), nearestRoad: () => null,
    nearPOI: () => [], drivewayAt: () => null, blocked: () => false,
    ...options
  };
}
function potentials(w, width = 12, height = 8) {
  const rows = [];
  for (let cy = 0; cy < height; cy++) for (let cx = 0; cx < width; cx++) {
    for (let slot = 0; slot < C.Forage193Rules.candidates; slot++) {
      const q = F.candidate(w, 'F193_' + cx + '_' + cy + '_' + slot);
      if (q) rows.push(q);
    }
  }
  return rows;
}
const first = w => {
  const q = potentials(w, 3, 3)[0];
  assert.ok(q, 'The prepared dry field contains an ordinary potential site.');
  return q;
};

test('193 forage descriptors load before Core and geometry, then use the current rules owner', () => {
  const sandbox = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/biome-forage193.js'), 'utf8'), sandbox);
  assert.ok(sandbox.DeadwallBiomeForage193);
  assert.throws(() => sandbox.DeadwallBiomeForage193.species(), /Règles/);
  sandbox.DeadwallCore = C; sandbox.DeadwallFrontierGeometry = G;
  const q = first(field());
  assert.deepEqual(copy(sandbox.DeadwallBiomeForage193.candidate(field(), q.id)), copy(q));
  const replacement = { ...C.Forage193Rules, species: { ...C.Forage193Rules.species } };
  sandbox.DeadwallCore = { ...C, Forage193Rules: replacement };
  assert.equal(sandbox.DeadwallBiomeForage193.species(), replacement.species);
});

test('193 finite botanical sites cover all sixteen habitats and keep useful metric ground silhouettes', () => {
  const expected = ['blackberry', 'blackthorn', 'rosehip', 'hazelnut', 'walnut', 'chestnut',
    'apple', 'pear', 'plum', 'raspberry', 'blueberry', 'wildStrawberry',
    'chanterelle', 'bolete', 'fallenBranch', 'flint'];
  assert.deepEqual(Object.keys(F.species()).sort(), expected.sort());
  const encountered = new Set();
  for (const biome of [...C.BiomeRules135.defs, ...C.EcologyRules164.defs]) {
    const rows = potentials(field({ biomeAt: () => ({ id: biome.id }) }));
    assert.ok(rows.length > 60, biome.id + ' has a finite useful field sample.');
    for (const q of rows) {
      const d = F.species()[q.species]; encountered.add(q.species);
      assert.ok(d.biomes[biome.id] > 0, q.species + ' actually belongs in ' + biome.id);
      assert.equal(q.resource, d.resource); assert.equal(q.family, d.family);
      assert.equal(q.name, d.name); assert.equal(q.seconds, d.seconds);
      assert.ok(['food', 'wood', 'stone'].includes(q.resource));
      assert.ok(Number.isInteger(q.amount) && q.amount >= d.amount[0] && q.amount <= d.amount[1]);
      assert.ok(q.radius > 0 && q.radius <= .5 && q.length > 0 && q.length <= .8 && q.width > 0 && q.width <= 1);
      assert.ok(Object.isFrozen(q));
    }
  }
  assert.deepEqual([...encountered].sort(), expected);
  for (const id of ['hazelnut', 'walnut', 'chestnut', 'apple', 'pear', 'plum']) {
    assert.ok(F.species()[id].radius <= .25, id + ' is fallen produce, not an uncollidable tree.');
  }
});

test('193 seed and landscape produce stable finite identities without consuming ambient or gameplay RNG', () => {
  const w = field(), saved = copy({ seed: w.seed, home: w.home, profile: w.landscape189 });
  w.random = { state: 4927, next() { throw Error('Gameplay RNG must not be used'); } };
  const old = Math.random; Math.random = () => { throw Error('Ambient RNG must not be used'); };
  try {
    const rows = potentials(w);
    assert.deepEqual(potentials(field()), rows);
    assert.equal(new Set(rows.map(q => q.id)).size, rows.length);
    assert.deepEqual([...new Set(rows.map(q => q.variant))].sort(), [0, 1, 2, 3]);
    assert.notDeepEqual(potentials(field({ seed: 42 })), rows);
    for (const landscape189 of ['balanced', 'large', 'patchwork']) {
      const changed = potentials(field({ landscape189 }));
      assert.notDeepEqual(changed, rows, landscape189 + ' changes positions and variants.');
      assert.deepEqual(potentials(field({ landscape189 })), changed);
    }
    for (const q of rows.slice().reverse()) assert.deepEqual(F.candidate(w, q.id), q);
    F.around(w, rows[0].x, rows[0].y, 600);
    assert.equal(w.random.state, 4927);
    assert.deepEqual({ seed: w.seed, home: w.home, profile: w.landscape189 }, saved);
  } finally { Math.random = old; }
});

test('193 historical revisions and malformed IDs never create sites or reinterpret an old world', () => {
  const poison = () => { throw Error('Unsupported worlds must not read geometry.'); };
  for (const revision of [
    { generation: 7 }, { generation: 11 }, { ecologyVersion: 0 }, { hydrologyVersion: 0 },
    { landscape189: 'unknown' }, { seed: -1 }, { seed: 1.5 }, { size: Infinity }
  ]) {
    const w = field({ ...revision, biomeAt: poison, nearestRoad: poison });
    assert.equal(F.candidate(w, 'F193_2_2_0'), null);
    assert.deepEqual(F.chunk(w, 2, 2), []); assert.deepEqual(F.around(w, 500, 500, 30), []);
  }
  const w = field();
  for (const id of [null, '', 'F193_01_2_0', 'F193_1_-1_0', 'F193_96_0_0',
    'F193_0_96_0', 'F193_0_0_16', 'F193_0_0_00', 'F193_0_0_1junk', 'A193_0_0_0']) {
    assert.equal(F.candidate(w, id), null, String(id));
  }
  for (const [cx, cy] of [[-1, 0], [0, -1], [96, 0], [0, 96], [.5, 0], [0, NaN]]) {
    assert.deepEqual(F.chunk(w, cx, cy), []);
  }
  for (const [x, y, range] of [[NaN, 0, 5], [0, Infinity, 5], [10, 10, -1], [-1, 10, 5], [10, 10, Infinity]]) {
    assert.deepEqual(F.around(w, x, y, range), []);
  }
});

test('193 water, bridge decks, whole radii, home and real public-road width veto potential sites', () => {
  const w = field(), q = first(w);
  for (const flags of [{ water: true }, { movementBlocked: true }, { crossing: 'bridge' }]) {
    const altered = field({ hydrology: { ...w.hydrology, sample: () => flags } });
    assert.equal(F.candidate(altered, q.id), null);
  }
  const bank = field({ hydrology: {
    sample: () => ({ water: false, movementBlocked: false, crossing: null }),
    blockedCircle(x, y, radius) { return x + radius > q.x + q.radius / 2; }
  } });
  assert.equal(bank.hydrology.blockedCircle(q.x, q.y, 0), false);
  assert.equal(F.candidate(bank, q.id), null, 'A dry centre cannot put half its footprint into water.');
  const width = 8, edge = width / 2 + C.Forage193Rules.roadClearance + q.radius;
  assert.equal(F.candidate(field({ nearestRoad: () => ({ d: edge - .01, road: { width } }) }), q.id), null);
  assert.deepEqual(F.candidate(field({ nearestRoad: () => ({ d: edge + .01, road: { width } }) }), q.id), q);
  assert.equal(F.candidate(field({ home: { x: q.x, y: q.y } }), q.id), null);
});

test('193 new parcels, long approaches and current obstacles hide sites while preserving their harvested identity', () => {
  const w = field(), q = first(w), original = copy(q);
  assert.equal(F.admitted(w, q), true);
  w.blocked = () => true;
  assert.deepEqual(F.candidate(w, q.id), original); assert.equal(F.admitted(w, q), false);
  assert.equal(F.chunk(w, 0, 0).some(p => p.id === q.id), false);
  w.blocked = () => false;
  w.nearPOI = () => [{ reserve: { l: q.x - 2, t: q.y - 2, r: q.x + 2, b: q.y + 2 } }];
  assert.deepEqual(F.candidate(w, q.id), original); assert.equal(F.admitted(w, q), false);
  w.nearPOI = () => [];
  w.drivewayAt = () => ({ id: 'added-later', width: 4 });
  assert.deepEqual(F.candidate(w, q.id), original); assert.equal(F.admitted(w, q), false);
  w.drivewayAt = () => null;
  w.nearPOI = () => [{ drive: { a: { x: q.x - 300, y: q.y }, b: { x: q.x + 300, y: q.y }, width: 4 } }];
  assert.equal(F.admitted(w, q), false, 'An approach outside its parcel is still pavement.');
  w.nearPOI = () => [];
  assert.equal(F.admitted(w, q), true);
  assert.deepEqual(F.candidate(w, q.id), original);
  assert.equal(F.admitted(w, { ...q, x: q.x + 1 }), false, 'A fabricated pose cannot move an existing resource identity.');
});

test('193 streamed chunks agree with exact range queries without duplicate boundary sites', () => {
  const w = field(), rows = potentials(w, 3, 3), centre = { x: 256, y: 256 }, range = 255;
  const expected = rows.filter(q => Math.hypot(q.x - centre.x, q.y - centre.y) <= range)
    .sort((a, b) => Math.hypot(a.x - centre.x, a.y - centre.y) - Math.hypot(b.x - centre.x, b.y - centre.y) || a.id.localeCompare(b.id));
  assert.ok(expected.length > 0);
  assert.deepEqual(F.around(w, centre.x, centre.y, range), expected);
  assert.deepEqual(F.around(w, rows[0].x, rows[0].y, 0), [rows[0]]);
  assert.deepEqual(F.around(w, centre.x, centre.y, range).map(q => q.id), expected.map(q => q.id));
});

test('193 static-origin LRU stays bounded, invalidates changed geographic owners and never caches current collision admission', () => {
  let reads = 0;
  const w = field({biomes: {id: 'bocage'}});
  w.biomeAt = () => { reads++; return w.biomes; };
  const q = first(w), n = reads;
  assert.equal(F.candidate(w, q.id), q); assert.equal(reads, n, 'Repeated origins do not resample climate.');
  w.blocked = () => true;
  assert.equal(F.candidate(w, q.id), q);
  assert.equal(F.admitted(w, q), false, 'A positive origin cache never grants permission through a newly added solid.');
  w.blocked = () => false;
  assert.equal(F.admitted(w, q), true);
  w.biomes = {id: 'orchard'};
  assert.equal(F.candidate(w, q.id).biome, 'orchard', 'Changing the provider invalidates the same-world cache.');
  w.biomes = {id: 'bocage'};
  const restored = F.candidate(w, q.id); assert.deepEqual(restored, q);
  const sample = w.hydrology.sample;
  w.hydrology.sample = () => ({water: true});
  assert.equal(F.candidate(w, q.id), null);
  w.hydrology.sample = sample;
  assert.deepEqual(F.candidate(w, q.id), q, 'Replacing a method on the same provider also invalidates a cached null.');
  const beforeEviction = F.candidate(w, q.id);
  for (let cx = 0; cx < 80; cx++) for (let slot = 0; slot < C.Forage193Rules.candidates; slot++) {
    F.candidate(w, 'F193_' + cx + '_0_' + slot);
  }
  const afterReads = reads, rebuilt = F.candidate(w, q.id);
  assert.ok(reads > afterReads, 'More than 1024 distinct slots evict an old cached origin.');
  assert.notEqual(rebuilt, beforeEviction); assert.deepEqual(rebuilt, q);
  const sandbox = vm.createContext({DeadwallCore: C, DeadwallFrontierGeometry: G});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/biome-forage193.js'), 'utf8'), sandbox);
  const api = sandbox.DeadwallBiomeForage193; assert.ok(api.candidate(w, q.id));
  sandbox.DeadwallCore = {...C, Forage193Rules: {...C.Forage193Rules, chance: 0}};
  assert.equal(api.candidate(w, q.id), null, 'Replacing the rules owner invalidates previously present origins.');
  sandbox.DeadwallCore = C; assert.deepEqual(copy(api.candidate(w, q.id)), copy(q));
  assert.ok(potentials(field()).some(p => Number(p.id.split('_')[3]) >= 2), 'The denser field exposes real canonical slots 2–15.');
});

test('193 actual hydrology, roads, parcels and collision admit useful forage with stable G8 G9 G10 identities', () => {
  const W = require('../src/frontier-world.js'), options = { ecologyVersion: 1, hydrologyVersion: 1 };
  const worlds = [W.create(17117, 8, options), W.create(17117, 9, options),
    W.create(17117, 10, { ...options, detailVersion: 13 })];
  const initial = potentials(worlds[0], 8, 8);
  assert.ok(initial.length > 25, 'A real seed has finite sites beyond empty synthetic fields.');
  let admitted = 0;
  for (const q of initial) {
    for (const w of worlds.slice(1)) assert.deepEqual(F.candidate(w, q.id), q, q.id + ' survives appended programmes.');
    for (const w of worlds) if (F.admitted(w, F.candidate(w, q.id))) {
      admitted++;
      assert.equal(w.hydrology.sample(q.x, q.y).water, false);
      assert.equal(w.hydrology.blockedCircle(q.x, q.y, q.radius), false);
      assert.equal(w.blocked(q.x, q.y, q.radius, 0, null), false);
      assert.equal(w.drivewayAt(q.x, q.y, q.radius + C.Forage193Rules.roadClearance), null);
    }
  }
  assert.ok(admitted > 15, 'Physical admission leaves useful sites in the real landscape.');
});
