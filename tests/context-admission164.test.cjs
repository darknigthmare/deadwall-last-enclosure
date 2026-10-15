'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const Geometry = require('../src/codex-geometry160.js');
const Context = require('../src/codex-context160.js');
const Biomes = require('../src/biomes135.js');

const roads = Object.freeze([
  { id: 'audit-r1', a: { x: 1000, y: 1200 }, b: { x: 1700, y: 1300 }, width: 7 },
  { id: 'audit-r2', a: { x: 2300, y: 800 }, b: { x: 2100, y: 1750 }, width: 5.8 },
  { id: 'audit-approach', a: { x: 900, y: 1000 }, b: { x: 1000, y: 1200 }, width: 7, roadClass: 'approach' }
]);
const aliases = Object.freeze({
  alluvialTerrace: ['alluvialTerrace', 'riparian', 'bocage'],
  agriculturalPlateau: ['agriculturalPlateau', 'meadow', 'orchard'],
  sandyPine: ['sandyPine', 'conifer', 'heath'],
  peatland: ['peatland', 'wetland', 'riparian']
});
const facade = Object.freeze({ ecologyVersion: 1, aliasesFor: id => aliases[id] || [id] });
const profile = id => ({ id, def: Biomes.BY[id] });
const admit = (id, biome, reader = facade) => Geometry.ecologyAdmission164(Context.get(id), biome, reader);

function rejectedPopulation(seed, biomes) {
  const digest = createHash('sha256'), offers = new Map();
  let calls = 0;
  const coverage = Geometry.populate({
    seed, roads, contracts: Context, biomes, sectors: [], home: { x: 1200, y: 1200 },
    spawn: { roll() { assert.fail('A refused physical installation cannot create an occupation.'); } },
    install(type, x, y, angle, road) {
      calls++; offers.set(type, (offers.get(type) || 0) + 1);
      digest.update(JSON.stringify([type, x, y, angle, road.id]) + '\n');
      return false;
    }
  });
  digest.update(JSON.stringify(coverage));
  return { coverage, calls, offers, sha256: digest.digest('hex') };
}

test('164 admission: historical G10 keeps all 60,096 installation attempts and exact source-captured ordering', () => {
  // Captured from f686070: the original Geometry.populate, full 626 contracts,
  // these roads, all physical installations refused, and no ecological reader.
  const expected = new Map([
    [0, '5ec0573f6d342b1161e655e64525ff20e863cbb9b49be0fb401a955f75950c84'],
    [17117, 'd254ef48625b1e25777f5eb2094817ddaaa84c24157c82024a66d3913f8afc9d'],
    [4294967295, '72a75a222471d9229fe1d50bd08a9e6ce008111db39651ccb652dc8c61b31ef4']
  ]);
  for (const [seed, sha256] of expected) for (const ecologyVersion of [undefined, 0]) {
    const result = rejectedPopulation(seed, {
      ecologyVersion, sample() { assert.fail('Historical refused installs never sample ecology.'); }
    });
    assert.equal(result.calls, 60096);
    assert.equal(result.sha256, sha256, 'The old coordinates, IDs offered, ordering and coverage remain unchanged.');
    assert.equal(result.coverage.ecology164, undefined);
  }
});

test('164 admission: explicit working landscapes follow their environmental requirements, not variant prose', () => {
  assert.equal(admit('DW-0263', profile('conifer')).allowed, true, 'A forest rest stop belongs in woodland.');
  assert.equal(admit('DW-0263', profile('meadow')).allowed, false);
  assert.equal(admit('DW-0275', profile('bocage')).allowed, true, 'A farm road belongs beside cultivated parcels.');
  assert.equal(admit('DW-0275', profile('conifer')).allowed, false);
  assert.equal(admit('DW-1802', profile('rockyHighland')).allowed, true, 'A mountain mine needs an extraction landscape.');
  assert.equal(admit('DW-1802', profile('meadow')).allowed, false);
  assert.equal(admit('DW-1724', profile('limestone')).allowed, true, 'Dry agricultural variants can use cultivated limestone ground.');
  assert.equal(admit('DW-1724', profile('riparian')).allowed, false);
  assert.equal(admit('DW-0359', profile('riparian')).allowed, true, 'Forest capture belongs in wet woodland.');
  assert.equal(admit('DW-0359', profile('conifer')).allowed, false, 'Dry conifers alone do not imply a water source.');
  assert.deepEqual(Geometry.naturalRequirements164(Context.get('DW-1523')), [],
    'The roundabout variant mentioning mountains keeps its actual road archetype.');
  assert.equal(admit('DW-1523', profile('meadow')).allowed, true);
});

test('164 admission: the four new temperate profiles retain their declared ecological compatibility', () => {
  const alluvial = { id: 'alluvialTerrace', def: { ...Biomes.BY.riparian,
    buildings: { ...Biomes.BY.riparian.buildings, ...Biomes.BY.bocage.buildings } } };
  const plateau = { id: 'agriculturalPlateau', def: Biomes.BY.orchard };
  const pine = { id: 'sandyPine', def: Biomes.BY.conifer };
  const peat = { id: 'peatland', def: { ...Biomes.BY.wetland, spawnBiome: 'forest' } };
  assert.equal(admit('DW-0359', alluvial).allowed, true);
  assert.equal(admit('DW-0275', alluvial).allowed, true);
  assert.equal(admit('DW-1724', plateau).allowed, true);
  assert.equal(admit('DW-0276', pine).allowed, true);
  assert.equal(admit('DW-1804', pine).allowed, true);
  assert.equal(admit('DW-0359', peat).allowed, true);
  assert.equal(admit('DW-0275', peat).allowed, false, 'Bog woodland is not a cultivated farm landscape.');
  assert.equal(admit('DW-1802', plateau).allowed, false, 'An agricultural name alone does not supply mineral extraction.');
});

test('164 admission: artificial hydraulic domains and dry ports remain available without inventing a river', () => {
  const dry = profile('heath');
  for (const id of ['DW-0341', 'DW-0343', 'DW-0344', 'DW-0346', 'DW-0352', 'DW-0358', 'DW-0438']) {
    assert.equal(admit(id, dry).allowed, true, id);
  }
  const card = Context.get('DW-0343'), p = { ...Context.preset(Context.typeFor(card.id)),
    id: 'admission164-treatment', type: Context.typeFor(card.id), x: 0, y: 0, a: 0,
    programme160: card.id, context160: card };
  const plan = Geometry.plan(p, 17117, 0, 12);
  assert.ok(plan.terrain160.some(terrain => terrain.kind === 'water' && terrain.blocked),
    'The treatment installation has its own actual forbidden water domain.');
  assert.equal(dry.def.id, 'heath', 'Admission does not relabel the climate or its surface as a river.');
});

test('164 admission: incompatible candidates are refused before installation and omissions name the real cause', () => {
  const reader = { ...facade, sample: () => profile('meadow') };
  const before = JSON.stringify(Context.records), result = rejectedPopulation(17117, reader);
  assert.equal(result.offers.get('codex160-0263'), undefined, 'No forest candidate consumes an installation attempt/ID.');
  assert.equal(result.offers.get('codex160-0359'), undefined);
  assert.equal(result.offers.get('codex160-0275'), 96, 'Compatible farm candidates still face physical placement.');
  assert.equal(result.offers.get('codex160-0343'), 96, 'An artificial basin keeps all physical placement attempts.');
  const coverage = result.coverage, ecology = coverage.ecology164;
  assert.equal(coverage.eligible, 626);
  assert.equal(coverage.placed, 0);
  assert.equal(coverage.missing.length, 626, 'Every described contract remains counted.');
  assert.equal(result.calls + ecology.rejectedCandidates, 60096);
  assert.ok(ecology.screenedProgrammes > 0 && ecology.ecologicalOmissions > 0);
  assert.equal(ecology.omissions.length, coverage.missing.length);
  const forest = ecology.omissions.find(row => row.id === 'DW-0263');
  assert.equal(forest.reason, 'no-compatible-environment');
  assert.equal(forest.ecologicalRejects, 96);
  assert.equal(forest.placementRejects, 0);
  assert.equal(forest.compatibleCandidates, 0);
  const farm = ecology.omissions.find(row => row.id === 'DW-0275');
  assert.equal(farm.reason, 'placement-unavailable');
  assert.equal(farm.ecologicalRejects, 0);
  assert.equal(farm.placementRejects, 96);
  assert.equal(farm.compatibleCandidates, 96);
  assert.ok(Object.isFrozen(ecology) && Object.isFrozen(ecology.omissions) && Object.isFrozen(forest));
  assert.equal(JSON.stringify(Context.records), before);
});

test('164 admission: multi-seed filters and their coverage are deterministic without gameplay RNG', () => {
  const ambient = Math.random;
  Math.random = () => assert.fail('Environmental admission cannot consume ambient/gameplay RNG.');
  try {
    const receipts = [];
    for (const seed of [0, 17117, 84329, 4294967295]) {
      const reader = { ...facade, sample: (s, x, y) => Biomes.sample(s, x, y, false, { generation: 9 }) };
      const first = rejectedPopulation(seed, reader), second = rejectedPopulation(seed, reader);
      assert.equal(first.sha256, second.sha256);
      assert.equal(first.calls + first.coverage.ecology164.rejectedCandidates, 60096);
      receipts.push(first.sha256);
    }
    assert.equal(new Set(receipts).size, receipts.length, 'Distinct seeds retain distinct candidate geography.');
  } finally { Math.random = ambient; }
});
