'use strict';

// This reader advances four existing notes. Physical support evidence never
// changes task status, service ownership or the scope of the older receipts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../src/core.js');
const Campaign = require('./codex-campaign-progress205.cjs');
const Services = require('./codex-campaign-services-progress208.cjs');
const Audit = require('./audit-campaign-water214.cjs');
const Inventory208 = require('./campaign-services-sources208.cjs');

const ROOT = path.resolve(__dirname, '..');
const REPORT = 'docs/codex/suivi-monde2026/campagne214-eau.json';
const PROOF = 'docs/codex/suivi-monde2026/RECUPERATEURS_G11_2026.md';
const SOURCE_BOUNDARY = 'public-manifest-services208-and-water214-runtime-audit-tests';
const TYPES = Services.TYPES;
const clone = value => JSON.parse(JSON.stringify(value));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const finitePoint = value => value && Number.isFinite(value.x) && Number.isFinite(value.y) && value.z === 0;
const requireValue = (ok, message) => { if (!ok) throw Error('Suivi eau G11 : ' + message); };
const exactKeys = (value, names) => value && same(Object.keys(value).sort(), [...names].sort());
const RECORD_KEYS = Object.freeze(['authorPlanId', 'typologyId', 'number', 'campaignType', 'pass',
  'modelScope', 'geometryUnchanged', 'geometryFingerprint', 'readsPure', 'supportInventoryComplete',
  'supports', 'barrelsPresent', 'supportsOffered', 'supportsAccessible', 'rainExposed', 'refusals']);
const SITE_KEYS = Object.freeze(['siteId', 'authorPlanId', 'typologyId', 'campaignType', 'pass',
  'geometryUnchanged', 'readsPure', 'geometryFingerprint', 'supportInventoryComplete',
  'supports', 'barrelsPresent', 'supportsOffered', 'supportsAccessible', 'rainExposed', 'refusals']);
const SUPPORT_KEYS = Object.freeze(['supportId', 'supportKind', 'accessible', 'face', 'anchor',
  'workTarget', 'center', 'rainExposed']);

function supportTotals(row, siteId) {
  requireValue(Array.isArray(row.supports) && row.supports.length > 0
    && Number.isSafeInteger(row.barrelsPresent) && row.barrelsPresent > 0
    && row.supportInventoryComplete === true, 'inventaire de tonneaux absent ou vide');
  const ids = new Set();
  for (const support of row.supports) {
    requireValue(exactKeys(support, SUPPORT_KEYS) && typeof support.supportId === 'string'
      && new RegExp('^' + siteId + ':205:static:(0|[1-9]\\d*)$').test(support.supportId)
      && !ids.has(support.supportId) && support.supportKind === 'rain-barrel'
      && support.accessible === true && support.rainExposed === true
      && Audit.FACES.includes(support.face), 'support dupliqué, refusé ou identité incompatible');
    ids.add(support.supportId);
    requireValue([support.center, support.anchor, support.workTarget].every(value =>
      finitePoint(value) && exactKeys(value, ['x', 'y', 'z'])), 'pose physique invalide');
    const dx = support.workTarget.x - support.center.x, dy = support.workTarget.y - support.center.y;
    const ax = support.anchor.x - support.workTarget.x, ay = support.anchor.y - support.workTarget.y;
    const pad = C.CampaignWater214Rules.actorRadius + C.CampaignWater214Rules.approachClearance;
    requireValue(Math.hypot(dx, dy) > 0 && Math.hypot(dx, dy) < C.CampaignWater214Rules.reach
      && Math.abs(Math.hypot(ax, ay) - pad) < 1e-7
      && Math.abs(dx * ay - dy * ax) < 1e-7 && dx * ax + dy * ay > 0,
    'geste ou distance de pose physique invalide');
  }
  const totals = Audit.totals(row.supports, row.supports.length);
  for (const key of Object.keys(totals)) {
    requireValue(same(row[key], totals[key]), 'compteur de tonneaux ou refus différent : ' + key);
  }
  return totals;
}

function worldSummary(witnesses, records, golden) {
  requireValue(Array.isArray(witnesses) && witnesses.length === golden.worldSeeds.length,
    'témoins de monde incomplets');
  const seeds = new Set(), sites = [];
  for (const witness of witnesses) {
    const old = golden.worldSeeds.find(row => row.seed === witness?.seed);
    requireValue(old && !seeds.has(witness.seed) && exactKeys(witness,
      ['seed', 'generation', 'pass', 'scope', 'geometryUnchanged', 'geometryFingerprint', 'readsPure', 'sites'])
      && witness.generation === 11 && witness.pass === true && witness.geometryUnchanged === true
      && witness.readsPure === true && witness.scope === 'canonical-native-poses-not-traversals'
      && exactKeys(witness.geometryFingerprint, ['poisSha256', 'roadsSha256', 'coverageSha256'])
      && Object.keys(witness.geometryFingerprint).every(key => witness.geometryFingerprint[key] === old[key])
      && Array.isArray(witness.sites) && witness.sites.length === old.sites.length
      && witness.sites.length > 0 && witness.sites.length <= Campaign.MAX_SITES_PER_SEED,
    'témoin de monde absent, remplacé ou promu');
    seeds.add(witness.seed);
    const ids = new Set();
    for (const site of witness.sites) {
      const previous = old.sites.find(row => row.id === site?.siteId);
      const model = records.get(site?.authorPlanId);
      requireValue(previous && model && exactKeys(site, SITE_KEYS) && !ids.has(site.siteId)
        && /^P\d{4}$/.test(site.siteId) && site.pass === true && site.geometryUnchanged === true
        && site.readsPure === true && site.campaignType === previous.type
        && site.campaignType === model.campaignType && site.typologyId === model.typologyId
        && exactKeys(site.geometryFingerprint, ['planSha256', 'detailsSha256'])
        && Object.keys(site.geometryFingerprint).every(key => site.geometryFingerprint[key] === previous[key]),
      'site natif absent, dupliqué ou modèle substitué');
      ids.add(site.siteId); supportTotals(site, site.siteId);
      const indices = row => row.supports.map(support => support.supportId.split(':').at(-1)).sort();
      requireValue(same(indices(site), indices(model)), 'inventaire du site différent de son modèle auteur');
      sites.push(site);
    }
  }
  return {seeds: seeds.size, sites: sites.length, ...Audit.totals(sites.flatMap(row => row.supports),
    sites.reduce((sum, row) => sum + row.barrelsPresent, 0))};
}

function validateReport(report, readSource, expectedSources = Audit.sourceNames(), publicSources = Inventory208.sourceNames()) {
  requireValue(exactKeys(report, ['version', 'scope', 'generation', 'pass', 'sourceBoundary',
    'publicRuntimeIncluded', 'sourceStable', 'sources', 'sourcesAfter', 'geometryBaseline',
    'records', 'summary', 'worldWitnesses', 'worldSummary', 'transactions', 'transactionScope', 'rules', 'scopeLimit'])
    && report.version === 1 && report.scope === Audit.SCOPE && report.generation === 11 && report.pass === true
    && report.sourceBoundary === SOURCE_BOUNDARY && report.publicRuntimeIncluded === true
    && Audit.RUNTIME_FILES.every(name => publicSources.includes(name))
    && Array.isArray(report.records) && report.records.length === 200
    && Array.isArray(report.transactions) && report.transactions.length === 0
    && report.transactionScope === 'not-qualified-by-support-audit'
    && same(report.rules, C.CampaignWater214Rules) && typeof report.scopeLimit === 'string'
    && report.scopeLimit.includes('No installed collector'), 'rapport absent, règles ou périmètre invalide');
  Services.validateSources(report, readSource, expectedSources);
  const golden = Services.BASELINE, bytes = readSource(golden.file);
  requireValue(Buffer.isBuffer(bytes) && digest(bytes) === golden.sha256, 'témoin géométrique publié substitué');
  const baseline = JSON.parse(bytes);
  requireValue(baseline.baseCommit === golden.baseCommit && baseline.baseTree === golden.baseTree
    && baseline.sourceStable === true && baseline.models.length === 200 && baseline.worldSeeds.length === 3
    && same(report.geometryBaseline, {...golden, models: 200, worldSeeds: 3, unchanged: true}),
  'référence géométrique historique différente');
  const originals = new Map(baseline.models.map(row => [row.authorPlanId, row])), records = new Map();
  for (const row of report.records) {
    const old = originals.get(row?.authorPlanId);
    requireValue(old && exactKeys(row, RECORD_KEYS) && !records.has(row.authorPlanId)
      && TYPES.includes(row.typologyId) && row.typologyId === old.typologyId
      && Number.isInteger(row.number) && row.number === old.number
      && row.authorPlanId === Campaign.authorId(row.typologyId, row.number)
      && row.campaignType === old.campaignType && row.pass === true
      && row.modelScope === 'isolated-authored-model-geometry-not-a-seeded-instance'
      && row.geometryUnchanged === true && row.readsPure === true
      && exactKeys(row.geometryFingerprint, Audit.FINGERPRINTS)
      && Audit.FINGERPRINTS.every(key => hex(row.geometryFingerprint[key]) && row.geometryFingerprint[key] === old[key]),
    'modèle répété, promu ou géométrie historique modifiée');
    supportTotals(row, old.syntheticPose.id); records.set(row.authorPlanId, row);
  }
  for (const type of TYPES) for (let number = 1; number <= 50; number++) {
    requireValue(records.has(Campaign.authorId(type, number)), 'modèle audité manquant');
  }
  const summary = Audit.summary([...records.values()]);
  requireValue(same(report.summary, summary) && summary.types === 4 && summary.models === 200
    && summary.refused === 0 && summary.modelsWithoutBarrels === 0
    && summary.modelsWithAccessibleBarrel === 200
    && TYPES.every(type => summary.byType[type].models === 50 && summary.byType[type].accessible > 0),
  'totaux de modèles, de familles ou de supports différents');
  const worlds = worldSummary(report.worldWitnesses, records, baseline);
  requireValue(same(report.worldSummary, worlds), 'totaux de mondes différents');
  return {records, summary, worldSummary: worlds};
}

function readRegular(root, name) {
  const file = path.join(root, name), before = fs.lstatSync(file);
  requireValue(before.isFile() && !before.isSymbolicLink() && fs.realpathSync(file) === file,
    'preuve non régulière : ' + name);
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file);
  requireValue(before.size === after.size && before.mtimeMs === after.mtimeMs
    && before.mode === after.mode && bytes.length === after.size, 'preuve modifiée pendant sa lecture : ' + name);
  return bytes;
}

function checkedReport(root = ROOT) {
  const realRoot = fs.realpathSync(root), sources = Audit.capture(realRoot);
  const bytes = readRegular(realRoot, REPORT), report = JSON.parse(bytes);
  const checked = validateReport(report, name => readRegular(realRoot, name), sources.map(row => row.path),
    Inventory208.sourceNames(realRoot));
  requireValue(same(sources, Audit.capture(realRoot)), 'sources modifiées pendant la lecture');
  requireValue(digest(bytes) === digest(readRegular(realRoot, REPORT)), 'rapport modifié pendant la lecture');
  return {report, reportSha256: digest(bytes), ...checked};
}

function optionalPatch(data, root = ROOT) {
  let present;
  try { fs.lstatSync(path.join(root, REPORT)); present = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; present = false; }
  if (!present) {
    return {data, changes: {enriched: [], playableAdded: 0}};
  }
  const checked = checkedReport(root), out = clone(data), enriched = [];
  for (const type of TYPES) {
    const tasks = out.tasks.filter(task => task.typologyId === type && task.stage === 'services');
    requireValue(tasks.length === 1 && tasks[0].status === 'En cours'
      && tasks[0].owner === 'Production Codex' && tasks[0].evidence === Services.PROOF,
    'édition de tâche conservée : ' + type + '/services');
    const task = tasks[0], count = checked.summary.byType[type];
    const addition = ' Récupération de pluie214 : ' + count.barrelsPresent + ' tonneaux physiques et '
      + count.accessible + ' poses de travail contrôlés sur ' + count.models
      + ' modèles ; transactions natives et UI qualifiées séparément. Preuve de supports : ' + PROOF + '.';
    requireValue(typeof task.progress === 'string', 'note de service absente');
    if (!task.progress.endsWith(addition)) {
      requireValue(!task.progress.includes(PROOF) && task.progress.includes('eau/réseaux non raccordés.'),
        'édition de note conservée : ' + task.id);
      task.progress = task.progress.replace('eau/réseaux non raccordés.',
        'eau potable, assainissement et réseau électrique non raccordés.') + addition;
    }
    enriched.push(task.id);
  }
  return {data: out, changes: {enriched, playableAdded: 0}};
}

module.exports = {REPORT, PROOF, SOURCE_BOUNDARY, TYPES, RECORD_KEYS, SITE_KEYS, SUPPORT_KEYS,
  supportTotals, worldSummary, validateReport, checkedReport, optionalPatch};
