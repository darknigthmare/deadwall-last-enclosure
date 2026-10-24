'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const P = require('../scripts/codex-campaign-progress205.cjs');
const clone = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const files = new Map(P.SOURCE_FILES.map((name, i) => [name, Buffer.from('original fixture source ' + i)]));
  files.set('index.html', fs.readFileSync(path.resolve(__dirname, '../index.html')));
  const report = {version: 1, scope: P.SCOPE, generation: 11, pass: true, sourceStable: true,
    sources: [...files].map(([name, bytes]) => ({path: name, bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex')})),
    records: P.TYPES.flatMap(typologyId => Array.from({length: 50}, (_, i) => ({
      id: P.authorId(typologyId, i + 1), typologyId, number: i + 1,
      campaignType: P.alias(typologyId, i + 1), pass: true,
      ...Object.fromEntries(P.CHECKS.map(key => [key, true])),
    }))),
    placements: [{seed: 42, generation: 11, pass: true, historicalPrefixUnchanged: true, sites: [{id: 'witness-site',
      authorPlanId: 'EXT-MONDE-T045-V01', campaignType: 'campaign205-045-01', x: 200, y: 300, physicalAudit: true}]},
    {seed: 101, generation: 11, pass: true, historicalPrefixUnchanged: true, sites: []}],
  };
  report.sourcesAfter = clone(report.sources);
  return {files, report, read: name => files.get(name)};
}

function sourceData() {
  const f = fixture(), stages = ['dimensions', 'architecture', 'seed', 'props', 'loot', 'rencontres', 'services', 'art', 'sauvegarde', 'qa'];
  return {variants: [...f.report.records.map(record => ({id: record.id, typologyId: record.typologyId,
    number: record.number, status: 'Inspection physique', architecture: null, playable: false, spawnWeight: null,
    inspection: {scope: 'inspection-only'}})), {id: 'EXT-MONDE-T001-V01', typologyId: 'EXT-MONDE-T001', number: 1, playable: false}],
  tasks: [...P.TYPES.flatMap(typologyId => stages.map(stage => ({id: typologyId + '/' + stage, typologyId, stage,
    status: 'À faire', owner: 'Non affecté', evidence: ''}))), {id: 'EXT-MONDE-T001/seed', typologyId: 'EXT-MONDE-T001', stage: 'seed', status: 'À faire', owner: 'Non affecté', evidence: ''}]};
}

function inTemporaryRoot(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deadwall-campaign-progress205-')), f = fixture();
  try {
    for (const [name, bytes] of f.files) { const filename = path.join(root, name); fs.mkdirSync(path.dirname(filename), {recursive: true}); fs.writeFileSync(filename, bytes); }
    const file = path.join(root, P.REPORT); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, JSON.stringify(f.report));
    return run(root, f);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
}

test('G11 tracking keeps 200 model eligibility proofs distinct from one observed site and an empty seed', () => {
  const f = fixture(), before = JSON.stringify(f.report), result = P.validateReport(f.report, f.read);
  assert.deepEqual(result.summary, {types: 4, eligibleVariants: 200, passedVariants: 200,
    guaranteedSitesPerSeed: 0, observedSeeds: 2, observedSites: 1, observedVariants: 1});
  assert.equal(JSON.stringify(f.report), before);
  assert.deepEqual(result.placed.get('EXT-MONDE-T045-V01'), [{seed: 42, siteId: 'witness-site'}]);
});

test('G11 evidence rejects stale or incomplete actual source fingerprints', () => {
  for (const change of [f => f.files.set(P.SOURCE_FILES[0], Buffer.from('changed source')),
    f => f.report.sources.pop(), f => {f.report.sources[0].path = '../outside';},
    f => {f.report.sources.push(clone(f.report.sources[0]));}]) {
    const f = fixture(); change(f); assert.throws(() => P.validateReport(f.report, f.read), /preuve périmée|sources|provenance/);
  }
});

test('G11 evidence rejects any missing, duplicated, untested or promoted eligible variant', () => {
  for (const change of [r => r.records.pop(), r => {r.records[1] = clone(r.records[0]);},
    r => {r.records[0].campaignType = 'campaign205-046-01';}, r => {r.records[0].pass = false;},
    r => {r.records[0].doorsReachable = false;}, r => {r.records[0].playable = true;},
    r => {r.campaignPlayable = 200;}, r => {r.guaranteedSitesPerSeed = 4;},
    r => {r.pass = false;}, r => {delete r.pass;},
    r => {r.sourceStable = false;}, r => {delete r.sourceStable;}]) {
    const f = fixture(); change(f.report); assert.throws(() => P.validateReport(f.report, f.read), /rapport|variante/);
  }
});

test('G11 evidence fingerprints hydrology, frontage, spawning and the delivered compiled runtime', () => {
  const sensitive = ['src/hydrology165.js', 'src/biomes164.js', 'src/frontage174.js',
    'src/world-spawns131.js', 'src/frontier-geometry.js', 'src/codex3000-live-data.js'];
  for (const name of sensitive) {
    const f = fixture(); assert.ok(f.files.has(name), name);
    f.files.set(name, Buffer.from('changed dependency'));
    assert.throws(() => P.validateReport(f.report, f.read), /preuve périmée/);
  }
  const changed = fixture(); changed.report.sourcesAfter[0].bytes++;
  assert.throws(() => P.validateReport(changed.report, changed.read), /avant\/après/);
});

test('G11 witnesses reject duplicate seeds, aliases and same-type substitutions', () => {
  for (const change of [r => {r.placements.push(clone(r.placements[0]));},
    r => {r.placements[0].pass = false;}, r => {delete r.placements[0].pass;},
    r => {r.placements[0].historicalPrefixUnchanged = false;}, r => {delete r.placements[0].historicalPrefixUnchanged;},
    r => {r.placements[0].sites[0].physicalAudit = false;},
    r => {r.placements[0].sites[0].authorPlanId = 'EXT-MONDE-T001-V01';},
    r => {r.placements[0].sites.push({...r.placements[0].sites[0], id: 'second'}); r.placements[0].sites.push({...r.placements[0].sites[0], id: 'third'});}]) {
    const f = fixture(); change(f.report); assert.throws(() => P.validateReport(f.report, f.read), /graine|implantation/);
  }
});

test('G11 witnesses count two physical instances of one model without counting two seeds', () => {
  const f = fixture(); f.report.placements[0].sites.push({...f.report.placements[0].sites[0], id: 'second-site', x: 700});
  const result = P.validateReport(f.report, f.read);
  assert.equal(result.summary.observedSites, 2); assert.equal(result.summary.observedVariants, 1);
  assert.equal(result.summary.observedSeeds, 2);
  assert.deepEqual(result.placed.get('EXT-MONDE-T045-V01'), [{seed: 42, siteId: 'witness-site'}, {seed: 42, siteId: 'second-site'}]);
});

test('G11 per-variant coverage and its workbook guard retain both repeated model instances', () => inTemporaryRoot((root, f) => {
  f.report.placements[0].sites.push({...f.report.placements[0].sites[0], id: 'second-site', x: 700});
  fs.writeFileSync(path.join(root, P.REPORT), JSON.stringify(f.report));
  const out = P.patch(sourceData(), root).data, row = out.campaign205.records[0];
  assert.equal(row.observedInstances, 2); assert.deepEqual(row.observedSeeds, [42]);
  assert.equal(require('../scripts/codex-tracker-xlsx-guards2026.cjs').campaign(out).observedSites, 2);
  assert.equal(P.validateCoverage(out).observedVariants, 1);
}));

test('G11 progress preserves inspection authority, unrelated work and all unqualified acceptance stages', () => inTemporaryRoot(root => {
  const source = sourceData(), before = JSON.stringify(source), out = P.patch(source, root);
  assert.equal(JSON.stringify(source), before);
  assert.equal(out.changes.playableAdded, 0); assert.equal(out.changes.inProgress.length, 8);
  assert.ok(out.data.variants.every(v => v.playable === false));
  assert.ok(out.data.tasks.every(t => t.status !== 'Validé'));
  assert.deepEqual(out.data.variants.at(-1), source.variants.at(-1));
  assert.deepEqual(out.data.tasks.at(-1), source.tasks.at(-1));
  assert.ok(out.data.tasks.filter(t => ['services', 'rencontres', 'art'].includes(t.stage)).every(t => t.status === 'À faire'));
  assert.deepEqual(P.patch(out.data, root).data, out.data);
  assert.deepEqual(P.validateCoverage(out.data), out.data.campaign205.summary);
}));

test('G11 coverage refuses forged counters, missing witnesses and completed global tasks', () => inTemporaryRoot(root => {
  const source = P.patch(sourceData(), root).data;
  for (const change of [d => {d.campaign205.summary.observedSeeds++;}, d => {d.campaign205.summary.eligibleVariants++;},
    d => {d.campaign205.witnessSeeds = [];}, d => {d.variants[0].campaign205.eligible = false;},
    d => {d.tasks.find(t => t.stage === 'seed').status = 'Validé';},
    d => {d.variants[0].playable = true;}]) {
    const changed = clone(source); change(changed); assert.throws(() => P.validateCoverage(changed), /campagne|variante|totaux/);
  }
}));

test('G11 refresh refuses to overwrite manual task proof or inspection promotion', () => inTemporaryRoot(root => {
  for (const change of [d => {d.tasks.find(t => t.stage === 'loot').status = 'Validé';},
    d => {d.tasks.find(t => t.stage === 'seed').owner = 'Auteur';},
    d => {d.tasks.find(t => t.stage === 'loot').evidence = 'preuve personnelle';},
    d => {d.variants[0].playable = true;}]) {
    const source = sourceData(); change(source); const before = JSON.stringify(source);
    assert.throws(() => P.patch(source, root), /conservée|modifiée/); assert.equal(JSON.stringify(source), before);
  }
}));
