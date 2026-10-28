'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const C = require('../src/core.js');
const P = require('../scripts/codex-campaign-water-progress214.cjs');
const Audit = require('../scripts/audit-campaign-water214.cjs');
const Services = require('../scripts/codex-campaign-services-progress208.cjs');
const Inventory208 = require('../scripts/campaign-services-sources208.cjs');
const ROOT = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// These temporary protocol fixtures exercise rejection and note preservation.
// Their one-support rows are not receipts of seeded gameplay or actual audits.
function fixture() {
  const names = Audit.sourceNames(), publicNames = Inventory208.sourceNames();
  const files = new Map(names.map((name, index) => [name, Buffer.from('protocol fixture ' + index)]));
  files.set('index.html', fs.readFileSync(path.join(ROOT, 'index.html')));
  const base = Services.BASELINE;
  files.set(base.file, fs.readFileSync(path.join(ROOT, base.file)));
  const golden = JSON.parse(files.get(base.file));
  const supports = id => [{supportId: id + ':205:static:0', supportKind: 'rain-barrel',
    accessible: true, face: 'south', center: {x: 1000, y: 2000, z: 0},
    workTarget: {x: 1000, y: 2000.35, z: 0},
    anchor: {x: 1000, y: 2000.35 + C.CampaignWater214Rules.actorRadius
      + C.CampaignWater214Rules.approachClearance, z: 0}, rainExposed: true}];
  const counts = row => Object.assign(row, Audit.totals(row.supports, row.supports.length));
  const records = golden.models.map(old => counts({authorPlanId: old.authorPlanId,
    typologyId: old.typologyId, number: old.number, campaignType: old.campaignType, pass: true,
    modelScope: 'isolated-authored-model-geometry-not-a-seeded-instance', geometryUnchanged: true,
    geometryFingerprint: Object.fromEntries(Audit.FINGERPRINTS.map(key => [key, old[key]])),
    readsPure: true, supportInventoryComplete: true, supports: supports(old.syntheticPose.id)}));
  const byType = new Map(records.map(row => [row.campaignType, row]));
  const worldWitnesses = golden.worldSeeds.map(old => ({seed: old.seed, generation: 11,
    pass: true, scope: 'canonical-native-poses-not-traversals', geometryUnchanged: true,
    geometryFingerprint: Object.fromEntries(['poisSha256', 'roadsSha256', 'coverageSha256'].map(key => [key, old[key]])),
    readsPure: true, sites: old.sites.map(site => {
      const model = byType.get(site.type);
      return counts({siteId: site.id, authorPlanId: model.authorPlanId, typologyId: model.typologyId,
        campaignType: site.type, pass: true, geometryUnchanged: true, readsPure: true,
        geometryFingerprint: {planSha256: site.planSha256, detailsSha256: site.detailsSha256},
        supportInventoryComplete: true, supports: supports(site.id)});
    })}));
  const sources = names.map(name => ({path: name, bytes: files.get(name).length, sha256: hash(files.get(name))}));
  const sites = worldWitnesses.flatMap(row => row.sites);
  const report = {version: 1, scope: Audit.SCOPE, generation: 11, pass: true,
    sourceBoundary: P.SOURCE_BOUNDARY, publicRuntimeIncluded: true, sourceStable: true,
    sources, sourcesAfter: clone(sources), geometryBaseline: {...base, models: 200, worldSeeds: 3, unchanged: true},
    records, summary: Audit.summary(records), worldWitnesses,
    worldSummary: {seeds: 3, sites: sites.length,
      ...Audit.totals(sites.flatMap(row => row.supports), sites.reduce((sum, row) => sum + row.barrelsPresent, 0))},
    transactions: [], transactionScope: 'not-qualified-by-support-audit', rules: clone(C.CampaignWater214Rules),
    scopeLimit: 'Protocol fixture. No installed collector, rainfall or paid action is inferred.'};
  return {names, publicNames, files, report, counts, read: name => files.get(name)};
}

const validate = f => P.validateReport(f.report, f.read, f.names, f.publicNames);
function withRoot(run, reportPresent = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deadwall-water-progress214-')), f = fixture();
  const write = report => {
    const file = path.join(root, P.REPORT);
    fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, JSON.stringify(report));
  };
  try {
    for (const [name, bytes] of f.files) {
      const file = path.join(root, name);
      fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, bytes);
    }
    if (reportPresent) write(f.report);
    return run(root, f, write);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
}

function sourceData() {
  return {variants: [{id: 'unchanged', playable: false}], tasks: [
    ...P.TYPES.map(typologyId => ({id: typologyId + '/services', typologyId, stage: 'services',
      status: 'En cours', owner: 'Production Codex', evidence: Services.PROOF,
      progress: 'Supports208 déjà contrôlés ; transactions et parcours complets ont leurs preuves distinctes, '
        + 'eau/réseaux non raccordés.' + (typologyId === P.TYPES[0] ? ' Outillage historique conservé.' : '')})),
    {id: 'other', typologyId: 'EXT-MONDE-T001', stage: 'services', status: 'À faire',
      owner: 'Non affecté', evidence: '', progress: ''}], campaign208: {unchanged: true}};
}

test('strict rain reader recounts four families, 200 model witnesses and three native pose worlds without transactions', () => {
  const f = fixture(), before = JSON.stringify(f.report), checked = validate(f);
  assert.equal(checked.summary.models, 200); assert.equal(checked.summary.types, 4);
  assert.equal(checked.summary.barrelsPresent, 200);
  assert.ok(P.TYPES.every(type => checked.summary.byType[type].models === 50));
  assert.equal(checked.worldSummary.seeds, 3); assert.ok(checked.worldSummary.sites > 0);
  assert.equal(checked.worldSummary.refusals.length, 0);
  assert.equal(f.report.transactions.length, 0); assert.equal(JSON.stringify(f.report), before);
  for (const file of ['scripts/codex-campaign-water-progress214.cjs',
    'tests/codex-campaign-water-progress214.test.cjs', ...Audit.RUNTIME_FILES]) {
    assert.ok(f.names.includes(file), file);
  }
});

test('rain evidence refuses stale sources, changed captures and an absent public owner', () => {
  for (const mutate of [
    f => {f.files.set('src/campaign-water214.js', Buffer.from('source drift'));},
    f => {f.report.sourcesAfter[0].bytes++;},
    f => {f.report.sources.pop();},
    f => {f.report.sources[0].path = '../outside';},
    f => {f.report.sourceStable = false;},
    f => {f.publicNames = f.publicNames.filter(name => name !== 'src/campaign-water214.js');},
  ]) {
    const f = fixture(); mutate(f); assert.throws(() => validate(f));
  }
});

test('rain model receipts reject changed geometry, zero supports, bad physical poses and invented paid claims', () => {
  for (const mutate of [
    r => {r.records.pop();},
    r => {r.records[1] = clone(r.records[0]);},
    r => {r.records[0].geometryFingerprint.stockSha256 = 'f'.repeat(64);},
    r => {r.records[0].supports = []; Object.assign(r.records[0], Audit.totals([], 0)); r.summary = Audit.summary(r.records);},
    r => {r.records[0].supports[0].supportId = 'P9000:0:0';},
    r => {r.records[0].supports[0].anchor.z = 1;},
    r => {r.records[0].supports[0].workTarget.x++;},
    r => {r.records[0].supports[0].rainExposed = false;},
    r => {r.records[0].supports[0].accessible = false;},
    r => {r.records[0].barrelsPresent++;},
    r => {r.summary.byType[P.TYPES[0]].accessible++;},
    r => {r.records[0].playable = true;},
    r => {r.records[0].supports[0].utilityConnected = true;},
    r => {r.transactions.push({action: 'prepare', completed: true});},
    r => {r.rules.prepare.cost.wood = 0;},
  ]) {
    const f = fixture(); mutate(f.report); assert.throws(() => validate(f));
  }
});

test('native worlds reject seed/site substitution, missing physical support identities and extrapolated totals', () => {
  for (const mutate of [
    r => {r.worldWitnesses.pop();},
    r => {r.worldWitnesses[1] = clone(r.worldWitnesses[0]);},
    r => {r.worldWitnesses[0].seed = 222;},
    r => {r.worldWitnesses[0].scope = 'human-playthrough';},
    r => {r.worldWitnesses[0].sites.pop();},
    r => {r.worldWitnesses[0].sites[0].authorPlanId = r.records[0].authorPlanId;},
    r => {r.worldWitnesses[0].sites[0].supports[0].supportId = r.worldWitnesses[0].sites[0].siteId + ':205:static:1';},
    r => {r.worldWitnesses[0].sites[0].geometryFingerprint.planSha256 = 'a'.repeat(64);},
    r => {r.worldSummary.supportsAccessible++;},
  ]) {
    const f = fixture(); mutate(f.report); assert.throws(() => validate(f));
  }
});

test('optional rain proof absence preserves input; checked proof enriches only four notes with derived counts and keeps status/evidence', () => {
  withRoot(root => {
    const data = sourceData(), before = JSON.stringify(data), patched = P.optionalPatch(data, root);
    assert.strictEqual(patched.data, data); assert.equal(JSON.stringify(data), before);
    assert.deepEqual(patched.changes.enriched, []);
  }, false);
  withRoot(root => {
    const data = sourceData(), before = JSON.stringify(data), patched = P.optionalPatch(data, root);
    assert.equal(JSON.stringify(data), before); assert.equal(patched.changes.enriched.length, 4);
    assert.equal(patched.changes.playableAdded, 0);
    for (let index = 0; index < 4; index++) {
      const old = data.tasks[index], task = patched.data.tasks[index];
      assert.deepEqual({...task, progress: old.progress}, old);
      assert.match(task.progress, /50 tonneaux physiques et 50 poses/);
      assert.ok(task.progress.includes(P.PROOF)); assert.ok(!task.progress.includes('eau/réseaux non raccordés'));
      assert.match(task.progress, /eau potable, assainissement et réseau électrique non raccordés/);
    }
    assert.match(patched.data.tasks[0].progress, /Outillage historique conservé/);
    assert.deepEqual(patched.data.variants, data.variants);
    assert.deepEqual(patched.data.campaign208, data.campaign208);
    assert.deepEqual(patched.data.tasks[4], data.tasks[4]);
    assert.deepEqual(P.optionalPatch(patched.data, root).data, patched.data);
    assert.match(P.checkedReport(root).reportSha256, /^[a-f0-9]{64}$/);
  });
});

test('present invalid proof and edited task ownership fail before touching input', () => {
  withRoot(root => {
    const file = path.join(root, P.REPORT);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.symlinkSync(path.join(root, 'missing-proof.json'), file);
    assert.throws(() => P.optionalPatch(sourceData(), root));
  }, false);
  withRoot((root, f, write) => {
    const data = sourceData(), before = JSON.stringify(data);
    f.report.transactions.push({action: 'draw'}); write(f.report);
    assert.throws(() => P.optionalPatch(data, root)); assert.equal(JSON.stringify(data), before);
  });
  withRoot(root => {
    const data = sourceData(); data.tasks[0].status = 'Validé';
    const before = JSON.stringify(data);
    assert.throws(() => P.optionalPatch(data, root), /édition de tâche/);
    assert.equal(JSON.stringify(data), before);
    fs.appendFileSync(path.join(root, 'src/campaign-water214.js'), 'drift');
    assert.throws(() => P.checkedReport(root), /preuve périmée/);
  });
});
