'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const P = require('../scripts/codex-campaign-services-progress208.cjs');
const Campaign = require('../scripts/codex-campaign-progress205.cjs');
const Sources205 = require('../scripts/campaign-sources205.cjs');
const Sources208 = require('../scripts/campaign-services-sources208.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ROOT = path.resolve(__dirname, '..');

// Protocol fixtures are confined to temporary roots. They are not receipts of
// gameplay, source qualification or browser transactions.
function fixture() {
  const names = Sources208.sourceNames();
  const files = new Map(names.map((name, i) => [name, Buffer.from('synthetic fixture source ' + i)]));
  files.set('index.html', fs.readFileSync(path.join(ROOT, 'index.html')));
  for (const file of [P.BASELINE.file, P.ART_BASELINE.file]) {
    files.set(file, fs.readFileSync(path.join(ROOT, file)));
  }
  const sourceRows = names.map(name => ({path: name, bytes: files.get(name).length,
    sha256: hash(files.get(name))}));
  const golden = JSON.parse(files.get(P.BASELINE.file));
  const propsFor = id => [{supportId: id + ':0:0', action: 'restSheltered', supportKind: 'singleBunk',
    anchor: {x: 1000, y: 2000, z: 0}, accessible: true}];
  const totals = row => {
    row.supportCountsByAction = Object.fromEntries(P.ACTIONS.map(action =>
      [action, row.supports.filter(support => support.action === action).length]));
    row.anchorsOffered = row.supports.length;
    row.anchorsValid = row.supports.filter(support => support.accessible).length;
    row.refusals = row.supports.filter(support => !support.accessible)
      .map(({supportId, action, reason}) => ({supportId, action, reason}));
  };
  const records = golden.models.map(old => {
    const row = {authorPlanId: old.authorPlanId, typologyId: old.typologyId,
      number: old.number, campaignType: old.campaignType, pass: true,
      modelScope: 'isolated-authored-model-geometry-not-a-seeded-instance',
      geometryUnchanged: true, geometryFingerprint: Object.fromEntries(P.FINGERPRINTS.map(key =>
        [key, old[key]])), readsPure: true, supportIdentitiesUnique: true,
      supports: propsFor(old.syntheticPose.id)};
    totals(row); return row;
  });
  const byType = new Map(records.map(row => [row.campaignType, row]));
  const worldWitnesses = golden.worldSeeds.map(old => ({
    seed: old.seed, generation: 11, pass: true, geometryUnchanged: true, readsPure: true,
    scope: 'canonical-native-poses-not-traversals',
    geometryFingerprint: Object.fromEntries(['poisSha256', 'roadsSha256', 'coverageSha256']
      .map(key => [key, old[key]])),
    sites: old.sites.map(site => {
      const model = byType.get(site.type);
      const row = {siteId: site.id, authorPlanId: model.authorPlanId, campaignType: site.type,
        pass: true, geometryUnchanged: true, supports: propsFor(site.id),
        geometryFingerprint: {planSha256: site.planSha256, detailsSha256: site.detailsSha256}};
      totals(row); return row;
    }),
  }));
  const summary = rows => {
    const all = rows.flatMap(row => row.supports);
    return {types: new Set(rows.map(row => row.typologyId)).size, models: rows.length,
      offered: all.length, valid: all.filter(row => row.accessible).length,
      refused: all.filter(row => !row.accessible).length,
      modelsWithAccessibleSupport: rows.filter(row => row.anchorsValid > 0).length,
      modelsWithoutAccessibleSupport: rows.filter(row => row.anchorsValid === 0).length,
      byAction: Object.fromEntries(P.ACTIONS.map(action => {
        const values = all.filter(row => row.action === action), valid = values.filter(row => row.accessible).length;
        return [action, {offered: values.length, valid, refused: values.length - valid}];
      }))};
  };
  const report = {version: 1, scope: P.SCOPE, generation: 11, pass: true, sourceStable: true,
    sources: sourceRows, sourcesAfter: clone(sourceRows), geometryBaseline: {
      ...P.BASELINE, models: 200, worldSeeds: 3, unchanged: true},
    records, summary: summary(records), worldWitnesses, transactions: [],
    transactionScope: 'not-qualified-by-support-audit'};
  const artRows = [];
  for (const type of P.TYPES) {
    const old = golden.models.find(row => row.typologyId === type && row.number === 1);
    for (const action of P.ACTIONS) {
      if (action === 'medicalCare' && type !== 'EXT-MONDE-T047') continue;
      const supportKind = {meal: 'oven', restSheltered: 'singleBunk', service: 'toolbox',
        medicalCare: 'medical'}[action];
      artRows.push({authorPlanId: old.authorPlanId, typologyId: type, number: 1,
        campaignType: old.campaignType, supportId: old.syntheticPose.id + ':0:' + P.ACTIONS.indexOf(action),
        action, supportKind, pass: true, checks: Object.fromEntries(P.ART_CHECKS.map(key => [key, true])),
        pictures: {idle: 'a'.repeat(64), active: 'b'.repeat(64), later: 'c'.repeat(64), reduced: 'd'.repeat(64)}});
    }
  }
  const art = {version: 1, scope: P.ART_SCOPE, generation: 11, pass: true, sourceStable: true,
    sources: clone(sourceRows), sourcesAfter: clone(sourceRows),
    presentationScope: 'prepared-activity-reads-not-transactions',
    idleBaseline: {version: P.ART_BASELINE.version, commit: P.ART_BASELINE.commit,
      sourceSha256: P.ART_BASELINE.sourceSha256, samples: P.ART_BASELINE.samples},
    records: artRows, summary: {types: 4, models: 4, samples: 13, actions: 4, passedSamples: 13}};
  return {names, files, report, art, golden, totals, summary,
    read: name => files.get(name)};
}

function sourceData() {
  const stages = ['dimensions', 'architecture', 'seed', 'props', 'loot', 'rencontres',
    'services', 'art', 'sauvegarde', 'qa'];
  return {
    variants: [...P.TYPES.flatMap(type => Array.from({length: 50}, (_, i) => ({
      id: Campaign.authorId(type, i + 1), typologyId: type, number: i + 1,
      status: 'Inspection physique', playable: false, architecture: null, spawnWeight: null,
      inspection: {version: 1, scope: 'inspection-only'},
    }))), {id: 'EXT-MONDE-T001-V01', typologyId: 'EXT-MONDE-T001', number: 1,
      playable: false, architecture: null, spawnWeight: null}],
    tasks: [...P.TYPES.flatMap(typologyId => stages.map(stage => {
      const inspected = ['architecture', 'props', 'sauvegarde', 'qa'].includes(stage);
      return {id: typologyId + '/' + stage, typologyId, stage,
        status: inspected ? 'En cours' : 'À faire', owner: inspected ? 'Production Codex' : 'Non affecté',
        evidence: inspected ? 'docs/codex/suivi-monde2026/INSPECTION_PHYSIQUE_2026.md' : '',
        progress: inspected ? 'Ancienne note auteur.' : ''};
    })), {id: 'EXT-MONDE-T001/services', typologyId: 'EXT-MONDE-T001', stage: 'services',
      status: 'À faire', owner: 'Non affecté', evidence: ''}],
  };
}

function withRoot(run, {supports = true, art = true} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deadwall-services-progress208-'));
  const f = fixture();
  try {
    for (const [name, bytes] of f.files) {
      const filename = path.join(root, name);
      fs.mkdirSync(path.dirname(filename), {recursive: true}); fs.writeFileSync(filename, bytes);
    }
    const write = (name, report) => {
      const file = path.join(root, name); fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, JSON.stringify(report));
    };
    const names205 = Sources205.sourceNames(root);
    const sources205 = names205.map(name => ({path: name, bytes: f.files.get(name).length,
      sha256: hash(f.files.get(name))}));
    const report205 = {version: 1, scope: Campaign.SCOPE, generation: 11,
      pass: true, sourceStable: true, sources: sources205, sourcesAfter: clone(sources205),
      records: f.report.records.map(row => ({id: row.authorPlanId, typologyId: row.typologyId,
        number: row.number, campaignType: row.campaignType, pass: true,
        ...Object.fromEntries(Campaign.CHECKS.map(key => [key, true]))})), placements: []};
    write(Campaign.REPORT, report205);
    const data = Campaign.patch(sourceData(), root).data;
    if (supports) write(P.REPORT, f.report);
    if (art) write(P.ART_REPORT, f.art);
    return run(root, f, data, write);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
}

test('support evidence separates 200 models, offered fixtures, three seeded pose witnesses and zero transactions', () => {
  const f = fixture(), before = JSON.stringify(f.report);
  const checked = P.validateReport(f.report, f.read, f.names);
  assert.equal(JSON.stringify(f.report), before);
  assert.equal(checked.summary.models, 200); assert.equal(checked.summary.offered, 200);
  assert.equal(checked.summary.valid, 200); assert.equal(checked.summary.refused, 0);
  assert.equal(checked.worldSummary.seeds, 3);
  assert.equal(checked.worldSummary.sites, f.golden.worldSeeds.reduce((sum, row) => sum + row.sites.length, 0));
  assert.equal(checked.worldSummary.transactions, 0);
});

test('evidence refuses missing, stale, duplicated or replaced actual source identities', () => {
  for (const mutate of [
    f => {f.files.set('src/survival-pack.js', Buffer.from('changed runtime'));},
    f => {f.report.sources.pop();},
    f => {f.report.sourcesAfter[0].bytes++;},
    f => {f.report.sources.push(clone(f.report.sources[0]));},
    f => {f.report.sources[0].path = '../outside';},
    f => {f.report.sourceStable = false;},
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => P.validateReport(f.report, f.read, f.names), /sources|preuve|capture/);
  }
  const boundary = Sources208.sourceNames();
  for (const name of ['src/frontier-world.js', 'src/night-gear.js', 'src/campaign-services208.js',
    'src/campaign-site-art205.js', 'src/hero-actions133.js', 'tests/helpers/campaign-services208.cjs',
    'scripts/audit-campaign-services208.cjs', 'scripts/audit-service-art208.cjs']) {
    assert.ok(boundary.includes(name), name);
  }
});

test('model receipts reject aliases, omissions, promotions and changed historical geometry', () => {
  for (const mutate of [
    r => {r.records.pop();},
    r => {r.records[1] = clone(r.records[0]);},
    r => {r.records[0].campaignType = 'campaign205-046-01';},
    r => {r.records[0].playable = true;},
    r => {r.campaignPlayable = 200;},
    r => {r.records[0].geometryUnchanged = false;},
    r => {r.records[0].geometryFingerprint.stockSha256 = 'f'.repeat(64);},
    r => {r.records[0].readsPure = false;},
    r => {r.geometryBaseline.baseCommit = 'a'.repeat(40);},
    r => {r.transactions.push({action: 'meal', completed: true});},
  ]) {
    const f = fixture(); mutate(f.report);
    assert.throws(() => P.validateReport(f.report, f.read, f.names), /rapport|modèle|identité|géométr/);
  }
});

test('known baseline bytes cannot be substituted even with edited source fingerprints', () => {
  const f = fixture(), value = clone(f.golden); value.models[0].planSha256 = 'f'.repeat(64);
  const bytes = Buffer.from(JSON.stringify(value)); f.files.set(P.BASELINE.file, bytes);
  const source = f.report.sources.find(row => row.path === P.BASELINE.file);
  source.bytes = bytes.length; source.sha256 = hash(bytes); f.report.sourcesAfter = clone(f.report.sources);
  assert.throws(() => P.validateReport(f.report, f.read, f.names), /témoin géométrique/);
});

test('offered supports retain explicit refusals and cannot claim untested access or utility services', () => {
  const f = fixture(), row = f.report.records[0];
  row.supports.push({supportId: f.golden.models[0].syntheticPose.id + ':0:1',
    action: 'meal', supportKind: 'oven', anchor: {x: 1001, y: 2001, z: 0},
    accessible: false, reason: 'canonical-pose-blocked'});
  f.totals(row); f.report.summary = f.summary(f.report.records);
  const checked = P.validateReport(f.report, f.read, f.names);
  assert.equal(checked.summary.offered, 201); assert.equal(checked.summary.valid, 200);
  assert.equal(checked.summary.refused, 1); assert.equal(checked.summary.byAction.meal.refused, 1);
  for (const mutate of [
    r => {r.supports.push(clone(r.supports[0]));},
    r => {r.supports[0].supportKind = 'toilet';},
    r => {r.supports[0].action = 'potableWater';},
    r => {r.supports[0].anchor.z = 1;},
    r => {r.supports[0].anchor.x = Infinity;},
    r => {delete r.supports[1].reason;},
    r => {r.anchorsValid++;},
    r => {r.refusals = [];},
    r => {r.supportCountsByAction.meal++;},
  ]) {
    const copy = clone(f.report), altered = copy.records[0]; mutate(altered);
    assert.throws(() => P.validateReport(copy, f.read, f.names), /support|pose|refus|compteur/);
  }
});

test('native pose witnesses require the same three baseline seeds, exact sites and geometric fingerprints', () => {
  for (const mutate of [
    r => {r.worldWitnesses.pop();},
    r => {r.worldWitnesses[1] = clone(r.worldWitnesses[0]);},
    r => {r.worldWitnesses[0].seed = 123456789;},
    r => {r.worldWitnesses[0].geometryFingerprint.roadsSha256 = 'a'.repeat(64);},
    r => {r.worldWitnesses[0].sites.pop();},
    r => {r.worldWitnesses[0].sites[0].authorPlanId = 'EXT-MONDE-T045-V50';},
    r => {r.worldWitnesses[0].sites[0].geometryFingerprint.planSha256 = 'a'.repeat(64);},
    r => {r.worldWitnesses[0].scope = 'human-traversal';},
  ]) {
    const f = fixture(); mutate(f.report);
    assert.throws(() => P.validateReport(f.report, f.read, f.names), /rapport|témoin|site/);
  }
});

test('art samples keep four V01 models and thirteen prepared reads separate from 200 service models', () => {
  const f = fixture(), checked = P.validateArtReport(f.art, f.read, f.names);
  assert.deepEqual(checked.summary, {types: 4, models: 4, samples: 13, actions: 4, passedSamples: 13});
  assert.ok(checked.records.every(row => row.number === 1));
  assert.equal(f.report.transactions.length, 0);
});

test('art evidence refuses exploratory output, missing frame checks and relabelled historical pixels', () => {
  for (const mutate of [
    r => {r.sourceStable = false;},
    r => {r.records[0].checks.cancel = false;},
    r => {delete r.records[0].checks.pure;},
    r => {r.records[0].pictures.active = r.records[0].pictures.idle;},
    r => {r.records[0].pictures.reduced = 'not-a-hash';},
    r => {r.records.push(clone(r.records[0]));},
    r => {r.records[0].number = 2;},
    r => {r.summary.models = 200;},
    r => {r.presentationScope = 'paid-transactions';},
    r => {r.transactionsTested = 13;},
    r => {r.idleBaseline.commit = 'a'.repeat(40);},
    r => {r.campaignPlayable = 200;},
  ]) {
    const f = fixture(); mutate(f.art);
    assert.throws(() => P.validateArtReport(f.art, f.read, f.names), /rapport|capture|échantillon|totaux|référence|identité/);
  }
});

test('absent new evidence clarifies obsolete G11 notes without starting services or art', () =>
  withRoot((root, f, data) => {
    const before = JSON.stringify(data), out = P.optionalPatch(data, root);
    assert.equal(JSON.stringify(data), before);
    assert.equal(out.changes.inProgress.length, 0); assert.equal(out.changes.clarified.length, 12);
    assert.equal(out.changes.playableAdded, 0); assert.equal(out.data.campaign208, undefined);
    assert.ok(out.data.tasks.filter(row => ['services', 'art'].includes(row.stage))
      .every(row => row.status === 'À faire'));
    const qa = out.data.tasks.find(row => row.id === 'EXT-MONDE-T045/qa');
    assert.match(qa.progress, /parcours G11 préparés/);
    assert.doesNotMatch(qa.progress, /non livré/);
    assert.deepEqual(out.data.variants, data.variants);
  }, {supports: false, art: false}));

test('current receipts start eight global tasks only in progress and preserve inspection playability', () =>
  withRoot((root, f, data) => {
    const before = JSON.stringify(data), out = P.patch(data, root);
    assert.equal(JSON.stringify(data), before);
    assert.equal(out.changes.inProgress.length, 8); assert.equal(out.changes.playableAdded, 0);
    assert.ok(out.data.variants.every(row => row.playable === false));
    assert.ok(out.data.tasks.every(row => row.status !== 'Validé'));
    assert.equal(out.data.variants.filter(row => row.campaign208?.artSampled).length, 4);
    assert.equal(out.data.variants.filter(row => row.campaign208).length, 200);
    assert.deepEqual(out.data.variants.at(-1), data.variants.at(-1));
    assert.deepEqual(out.data.tasks.at(-1), data.tasks.at(-1));
    assert.deepEqual(P.patch(out.data, root).data, out.data);
    const validated = P.validateCoverage(out.data);
    assert.equal(validated.models, 200); assert.equal(validated.transactionsTested, 0);
    assert.equal(validated.visualModels, 4); assert.equal(validated.visualSamples, 13);
    assert.match(out.data.tasks.find(row => row.id === 'EXT-MONDE-T045/services').progress, /Aucun établi ajouté/);
  }));

test('a service support audit without art never starts the visual task', () =>
  withRoot((root, f, data) => {
    const out = P.patch(data, root);
    assert.equal(out.changes.inProgress.length, 4);
    assert.equal(out.data.campaign208.art, null);
    assert.ok(out.data.tasks.filter(row => row.stage === 'art').every(row => row.status === 'À faire'));
    assert.equal(P.validateCoverage(out.data).visualModels, 0);
  }, {art: false}));

test('manual task evidence or promotion is preserved by refusing the refresh', () =>
  withRoot((root, f, data) => {
    for (const mutate of [
      d => {d.tasks.find(row => row.stage === 'services').status = 'Validé';},
      d => {d.tasks.find(row => row.stage === 'art').owner = 'Auteur';},
      d => {d.tasks.find(row => row.stage === 'services').evidence = 'preuve privée';},
      d => {d.variants[0].playable = true;},
      d => {d.tasks.find(row => row.stage === 'qa').evidence = 'preuve privée';},
    ]) {
      const candidate = clone(data); mutate(candidate); const before = JSON.stringify(candidate);
      assert.throws(() => P.patch(candidate, root), /conservée|inspection|modifiée|promu|couverture de variante invalide/i);
      assert.equal(JSON.stringify(candidate), before);
    }
  }));

test('coverage rejects inflated supports, inferred transactions, forged samples and completed global tasks', () =>
  withRoot((root, f, data) => {
    const source = P.patch(data, root).data;
    for (const mutate of [
      d => {d.campaign208.summary.valid++;},
      d => {d.campaign208.worldSummary.transactions = 1;},
      d => {d.campaign208.worldSummary.sites = 200;},
      d => {d.variants[1].campaign208.artSampled = true;},
      d => {d.tasks.find(row => row.stage === 'services').status = 'Validé';},
      d => {d.campaign208.art.summary.models = 200;},
      d => {d.campaign208.art.records[0].checks.pause = false;},
      d => {d.campaign208.records[0].refusals.push({supportId: 'fake', action: 'meal', reason: 'fake'});},
      d => {delete d.campaign208;},
    ]) {
      const candidate = clone(source); mutate(candidate);
      assert.throws(() => P.validateCoverage(candidate), /totaux|extrapol|variante|globale|présentation|visuel|support|orpheline|refus/);
    }
  }));

test('orphaned visual or missing current source evidence never silently produces gains', () =>
  withRoot((root, f, data) => {
    fs.rmSync(path.join(root, P.REPORT));
    assert.throws(() => P.optionalPatch(data, root), /orphelin|disparue/);
    fs.rmSync(path.join(root, P.ART_REPORT));
    assert.equal(P.optionalPatch(data, root).changes.inProgress.length, 0);
    const copied = clone(data); copied.variants[0].campaign208 = {valid: 1};
    assert.throws(() => P.optionalPatch(copied, root), /disparue|orphelin/);
  }));

test('the strict source reader rejects symbolic report replacement and partial source changes', () =>
  withRoot((root, f, data) => {
    const file = path.join(root, P.REPORT), saved = fs.readFileSync(file);
    fs.rmSync(file); fs.writeFileSync(path.join(root, 'separate-report.json'), saved);
    fs.symlinkSync(path.join(root, 'separate-report.json'), file);
    assert.throws(() => P.checkedReport(root), /non régulière/);
    fs.rmSync(file); fs.writeFileSync(file, saved);
    fs.writeFileSync(path.join(root, 'src/campaign-services208.js'), 'changed after audit');
    assert.throws(() => P.checkedReport(root), /périmée/);
  }));
