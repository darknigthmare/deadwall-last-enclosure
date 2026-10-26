'use strict';
// Services and prepared presentation samples are separate from author plans,
// seeded placement and paid gameplay transactions.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Campaign = require('./codex-campaign-progress205.cjs');
const Inventory = require('./campaign-services-sources208.cjs');

const REPORT = 'docs/codex/suivi-monde2026/campagne208-services.json';
const ART_REPORT = 'docs/codex/suivi-monde2026/campagne208-art.json';
const PROOF = 'docs/codex/suivi-monde2026/SERVICES_G11_2026.md';
const ART_PROOF = PROOF + '#presentation-preparee';
const SHEET = 'Services G11';
const TABLE = 'ServicesG11208';
const SCOPE = 'campaign-services208-audit';
const ART_SCOPE = 'campaign-services208-art-audit';
const COVERAGE_SCOPE = 'service-supports-and-prepared-art-not-global-playability';
const TYPES = Campaign.TYPES;
const ACTIONS = Object.freeze(['meal', 'restSheltered', 'service', 'medicalCare']);
const ART_CHECKS = Object.freeze(['pixels', 'transform', 'clip', 'idle', 'active', 'pause',
  'cancel', 'reducedMotion', 'pure']);
const BASELINE = Object.freeze({
  file: 'tests/fixtures/campaign-services208-g11-M-golden.json',
  sha256: '214ae75c6e3dfbd36adf4fa4a249ba6309d85a0424ae74e4b66da8a574f62b13',
  baseCommit: '8780075f305e405e5aa94e593a70d11391b16e20',
  baseTree: 'ac2f82aef75e8f4d942977bf68a4b43ff7796764',
});
const FINGERPRINTS = Object.freeze(['planSha256', 'detailsSha256', 'propsSha256',
  'objectIdsSha256', 'stockSha256']);
const WORLD_SEEDS = Object.freeze([0, 17117, 967313470]);
const ART_BASELINE = Object.freeze({
  file: 'tests/fixtures/campaign208-idle-art.json',
  sha256: '5cff3e2da2832e5663dd339d0b6b572e0c8e079d4d6d31f10c1c5d41d1cc0228',
  version: '1.72.0', commit: BASELINE.baseCommit,
  sourceSha256: 'cb889c20a93d9551022f0d61ff50a82f3ae1f11bd48712484dc3600b89081634',
  samples: 1392,
});
const INSPECTION_PROOF = 'docs/codex/suivi-monde2026/INSPECTION_PHYSIQUE_2026.md';
const clone = value => JSON.parse(JSON.stringify(value));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const fail = message => { throw Error('Suivi services G11 : ' + message); };
const requireValue = (ok, message) => { if (!ok) fail(message); };
const recordId = (type, number) => Campaign.authorId(type, number);
const finiteAnchor = value => value && Number.isFinite(value.x) && Number.isFinite(value.y)
  && value.z === 0;
const capability = (action, kind, type) => action === 'meal' ? kind === 'oven'
  : action === 'restSheltered' ? kind === 'singleBunk'
    : action === 'service' ? ['workbench', 'toolbox'].includes(kind)
      : action === 'medicalCare' ? kind === 'medical' && type === 'EXT-MONDE-T047' : false;

function validateSources(report, readSource, expectedSources) {
  requireValue(report.sourceStable === true && Array.isArray(report.sources)
    && same(report.sourcesAfter, report.sources), 'captures avant/après absentes ou différentes');
  requireValue(same(report.sources.map(row => row?.path), expectedSources),
    'inventaire de sources incomplet ou différent');
  const seen = new Set();
  for (const row of report.sources) {
    requireValue(row && typeof row.path === 'string' && !path.isAbsolute(row.path)
      && !/[\\\x00-\x1f]/.test(row.path)
      && row.path.split('/').every(part => part && part !== '.' && part !== '..')
      && !seen.has(row.path) && Number.isSafeInteger(row.bytes) && row.bytes >= 0
      && hex(row.sha256), 'provenance de source invalide');
    seen.add(row.path);
    const bytes = readSource(row.path);
    requireValue(Buffer.isBuffer(bytes) && bytes.length === row.bytes
      && digest(bytes) === row.sha256, 'preuve périmée : ' + row.path);
  }
}

function baseline(readSource) {
  const bytes = readSource(BASELINE.file);
  requireValue(Buffer.isBuffer(bytes) && digest(bytes) === BASELINE.sha256,
    'témoin géométrique publié substitué');
  let value;
  try { value = JSON.parse(bytes); } catch { fail('témoin géométrique illisible'); }
  requireValue(value.baseCommit === BASELINE.baseCommit && value.baseTree === BASELINE.baseTree
    && value.sourceStable === true && Array.isArray(value.models) && value.models.length === 200
    && Array.isArray(value.worldSeeds) && value.worldSeeds.length === 3,
  'témoin géométrique incomplet');
  return value;
}

function identity(row) {
  requireValue(row && TYPES.includes(row.typologyId) && Number.isInteger(row.number)
    && row.number >= 1 && row.number <= 50
    && row.authorPlanId === recordId(row.typologyId, row.number)
    && row.campaignType === Campaign.alias(row.typologyId, row.number)
    && row.pass === true && row.playable !== true && row.guaranteed !== true,
  'identité de modèle ou périmètre invalide');
}

function supportTotals(row, type, siteId) {
  requireValue(Array.isArray(row.supports), 'supports absents');
  const keys = new Set();
  for (const support of row.supports) {
    const key = support?.supportId + ':' + support?.action;
    requireValue(support && typeof support.supportId === 'string'
      && /^P\d{4}:0:\d+$/.test(support.supportId)
      && (!siteId || support.supportId.startsWith(siteId + ':0:'))
      && ACTIONS.includes(support.action) && capability(support.action, support.supportKind, type)
      && !keys.has(key) && typeof support.accessible === 'boolean',
    'support dupliqué ou capacité incompatible');
    keys.add(key);
    requireValue(finiteAnchor(support.anchor), 'pose de service invalide');
    requireValue(support.accessible
      ? !Object.hasOwn(support, 'reason')
      : typeof support.reason === 'string' && support.reason.trim().length > 0,
    'refus de pose caché ou incohérent');
  }
  const totals = {
    supportCountsByAction: Object.fromEntries(ACTIONS.map(action =>
      [action, row.supports.filter(support => support.action === action).length])),
    anchorsOffered: row.supports.length,
    anchorsValid: row.supports.filter(support => support.accessible).length,
    refusals: row.supports.filter(support => !support.accessible)
      .map(({supportId, action, reason}) => ({supportId, action, reason})),
  };
  for (const key of Object.keys(totals)) {
    requireValue(same(row[key], totals[key]), 'compteur ou refus de support différent : ' + key);
  }
  return totals;
}

function summarize(records) {
  const supports = records.flatMap(row => row.supports);
  return {
    types: new Set(records.map(row => row.typologyId)).size,
    models: records.length,
    offered: supports.length,
    valid: supports.filter(row => row.accessible).length,
    refused: supports.filter(row => !row.accessible).length,
    modelsWithAccessibleSupport: records.filter(row => row.anchorsValid > 0).length,
    modelsWithoutAccessibleSupport: records.filter(row => row.anchorsValid === 0).length,
    byAction: Object.fromEntries(ACTIONS.map(action => {
      const rows = supports.filter(row => row.action === action);
      const valid = rows.filter(row => row.accessible).length;
      return [action, {offered: rows.length, valid, refused: rows.length - valid}];
    })),
  };
}

function checkWorlds(witnesses, records, originals) {
  requireValue(Array.isArray(witnesses) && witnesses.length === WORLD_SEEDS.length,
    'témoins de monde incomplets');
  const seeds = new Set();
  let observedSites = 0, offered = 0, valid = 0;
  for (const witness of witnesses) {
    const old = originals?.find(row => row.seed === witness?.seed);
    requireValue(witness && WORLD_SEEDS.includes(witness.seed) && (!originals || old)
      && !seeds.has(witness.seed) && witness.generation === 11
      && witness.pass === true && witness.geometryUnchanged === true && witness.readsPure === true
      && witness.scope === 'canonical-native-poses-not-traversals'
      && ['poisSha256', 'roadsSha256', 'coverageSha256'].every(key =>
        hex(witness.geometryFingerprint?.[key]) && (!old || witness.geometryFingerprint[key] === old[key]))
      && Array.isArray(witness.sites) && witness.sites.length <= Campaign.MAX_SITES_PER_SEED
      && (!old || witness.sites.length === old.sites.length),
    'témoin de monde absent, dupliqué ou substitué');
    seeds.add(witness.seed);
    const ids = new Set();
    for (const site of witness.sites) {
      const model = records.get(site?.authorPlanId);
      const oldSite = old?.sites.find(row => row.id === site?.siteId);
      requireValue(model && (!old || oldSite) && /^P\d{4}$/.test(site.siteId)
        && !ids.has(site.siteId) && site.pass === true && site.geometryUnchanged === true
        && site.campaignType === model.campaignType && (!oldSite || site.campaignType === oldSite.type)
        && ['planSha256', 'detailsSha256'].every(key => hex(site.geometryFingerprint?.[key])
          && (!oldSite || site.geometryFingerprint[key] === oldSite[key])),
      'site natif dupliqué ou modèle substitué');
      ids.add(site.siteId);
      const totals = supportTotals(site, model.typologyId, site.siteId);
      requireValue(totals.anchorsValid > 0, 'site natif sans support accessible');
      observedSites++; offered += totals.anchorsOffered; valid += totals.anchorsValid;
    }
  }
  return {seeds: seeds.size, sites: observedSites, offered, valid,
    refused: offered - valid, transactions: 0};
}

function validateReport(report, readSource, expectedSources = Inventory.sourceNames()) {
  requireValue(report && report.version === 1 && report.scope === SCOPE
    && report.generation === 11 && report.pass === true
    && report.campaignPlayable !== true && !report.campaignPlayable
    && Array.isArray(report.records) && report.records.length === 200
    && Array.isArray(report.worldWitnesses) && report.worldWitnesses.length === 3
    && Array.isArray(report.transactions) && report.transactions.length === 0
    && report.transactionScope === 'not-qualified-by-support-audit',
  'rapport de supports absent ou périmètre invalide');
  validateSources(report, readSource, expectedSources);
  const golden = baseline(readSource);
  requireValue(same(report.geometryBaseline, {...BASELINE, models: 200, worldSeeds: 3, unchanged: true}),
    'référence géométrique ou historique différente');
  const original = new Map(golden.models.map(row => [row.authorPlanId, row]));
  const records = new Map();
  for (const row of report.records) {
    identity(row);
    const old = original.get(row.authorPlanId);
    requireValue(!records.has(row.authorPlanId) && old && row.geometryUnchanged === true
      && row.readsPure === true && row.supportIdentitiesUnique === true
      && row.modelScope === 'isolated-authored-model-geometry-not-a-seeded-instance'
      && FINGERPRINTS.every(key => hex(row.geometryFingerprint?.[key])
        && row.geometryFingerprint[key] === old[key]),
    'modèle répété ou géométrie historique modifiée');
    const totals = supportTotals(row, row.typologyId, old.syntheticPose.id);
    requireValue(totals.anchorsValid > 0, 'modèle sans support accessible');
    records.set(row.authorPlanId, row);
  }
  for (const type of TYPES) for (let number = 1; number <= 50; number++) {
    requireValue(records.has(recordId(type, number)), 'modèle audité manquant');
  }
  const summary = summarize([...records.values()]);
  requireValue(same(report.summary, summary), 'totaux de modèles ou supports différents');
  return {records, summary, worldSummary: checkWorlds(report.worldWitnesses, records, golden.worldSeeds)};
}

function summarizeArt(records) {
  return {
    types: new Set(records.map(row => row.typologyId)).size,
    models: new Set(records.map(row => row.authorPlanId)).size,
    samples: records.length,
    actions: new Set(records.map(row => row.action)).size,
    passedSamples: records.filter(row => row.pass === true).length,
  };
}

function validateArtReport(report, readSource, expectedSources = Inventory.sourceNames()) {
  requireValue(report && report.version === 1 && report.scope === ART_SCOPE
    && report.generation === 11 && report.pass === true
    && report.presentationScope === 'prepared-activity-reads-not-transactions'
    && !report.campaignPlayable && !report.transactionsTested
    && Array.isArray(report.records) && report.records.length > 0,
  'rapport visuel absent ou périmètre invalide');
  validateSources(report, readSource, expectedSources);
  const idleBytes = readSource(ART_BASELINE.file);
  requireValue(Buffer.isBuffer(idleBytes) && digest(idleBytes) === ART_BASELINE.sha256,
    'témoin visuel publié substitué');
  const idle = JSON.parse(idleBytes);
  requireValue(idle.kind === 'campaign208-idle-art-baseline'
    && same(idle.baseline, {version: ART_BASELINE.version, commit: ART_BASELINE.commit,
      sourceSha256: ART_BASELINE.sourceSha256})
    && Array.isArray(idle.rows) && idle.rows.length === ART_BASELINE.samples,
  'témoin visuel incomplet');
  requireValue(same(report.idleBaseline, {version: ART_BASELINE.version, commit: ART_BASELINE.commit,
    sourceSha256: ART_BASELINE.sourceSha256, samples: ART_BASELINE.samples}),
  'référence visuelle historique différente');
  const seen = new Set();
  for (const row of report.records) {
    identity(row);
    const key = [row.authorPlanId, row.supportId, row.action].join(':');
    requireValue(row.number === 1 && !seen.has(key) && typeof row.supportId === 'string'
      && /^P\d{4}:0:\d+$/.test(row.supportId)
      && capability(row.action, row.supportKind, row.typologyId)
      && row.checks && ART_CHECKS.every(check => row.checks[check] === true)
      && ['idle', 'active', 'later', 'reduced'].every(key => hex(row.pictures?.[key]))
      && row.pictures.idle !== row.pictures.active,
    'échantillon visuel dupliqué, incompatible ou non contrôlé');
    seen.add(key);
  }
  const summary = summarizeArt(report.records);
  requireValue(same(report.summary, summary) && summary.types === 4 && summary.models === 4
    && summary.actions === ACTIONS.length, 'totaux ou couverture visuelle différents');
  return {records: report.records, summary};
}

function readRegular(root, name) {
  const filename = path.join(root, name), stat = fs.lstatSync(filename);
  requireValue(stat.isFile() && !stat.isSymbolicLink(), 'preuve non régulière : ' + name);
  return fs.readFileSync(filename);
}

function checkedReport(root = path.resolve(__dirname, '..')) {
  const sources = Inventory.capture(root);
  const bytes = readRegular(root, REPORT), report = JSON.parse(bytes);
  const checked = validateReport(report, name => readRegular(root, name), sources.map(row => row.path));
  const artExists = fs.existsSync(path.join(root, ART_REPORT));
  const artBytes = artExists ? readRegular(root, ART_REPORT) : null;
  const artReport = artExists ? JSON.parse(artBytes) : null;
  const art = artExists ? validateArtReport(artReport, name => readRegular(root, name),
    sources.map(row => row.path)) : null;
  requireValue(same(sources, Inventory.capture(root)), 'sources modifiées pendant la lecture');
  requireValue(digest(bytes) === digest(readRegular(root, REPORT))
    && artExists === fs.existsSync(path.join(root, ART_REPORT))
    && (!artExists || digest(artBytes) === digest(readRegular(root, ART_REPORT))),
  'rapport modifié pendant la lecture');
  return {report, reportSha256: digest(bytes), ...checked, art: art ? {...art,
    report: artReport, reportSha256: digest(artBytes)} : null};
}

function clarifyProgress(data) {
  if (!data.campaign205) return [];
  Campaign.validateCoverage(data);
  const changed = [];
  for (const task of data.tasks) {
    if (!TYPES.includes(task.typologyId)
      || !['architecture', 'sauvegarde', 'qa'].includes(task.stage)) continue;
    requireValue(task.status === 'En cours' && task.owner === 'Production Codex'
      && task.evidence === INSPECTION_PROOF, 'édition de tâche conservée : ' + task.id);
    const rows = data.campaign205.records.filter(row => row.typologyId === task.typologyId);
    const instances = rows.reduce((sum, row) => sum + row.observedInstances, 0);
    task.progress = {
      architecture: '50 modèles G11 éligibles, ' + instances + ' implantations témoins. '
        + 'Murs, portes et mobilier raccordés ; caravanes fermées et réseaux complets encore ouverts.',
      sauvegarde: 'Reprise auteur contrôlée ; migration G10→G11 et prélèvements persistants '
        + 'disposent de cas de campagne distincts. Tous les services et variantes restent à qualifier.',
      qa: 'Inspection des 50 variantes et parcours G11 préparés sur ordinateur/tactile documentés '
        + 'séparément ; couverture complète des services et campagne humaine encore ouvertes.',
    }[task.stage];
    changed.push(task.id);
  }
  return changed;
}

function variantCoverage(row, reportSha256, sampled) {
  return {version: 1, scope: COVERAGE_SCOPE, generation: 11,
    campaignType: row.campaignType, supportCountsByAction: clone(row.supportCountsByAction),
    offered: row.anchorsOffered, valid: row.anchorsValid, refused: row.refusals.length,
    report: REPORT, reportSha256, evidence: PROOF, artSampled: sampled};
}

function patch(data, root = path.resolve(__dirname, '..')) {
  const checked = checkedReport(root), out = clone(data);
  const clarified = clarifyProgress(out);
  requireValue(!!out.campaign205, 'services sans raccord G11 qualifié');
  const visual = new Set(checked.art?.records.map(row => row.authorPlanId) || []);
  const variants = new Map(out.variants.map(row => [row.id, row]));
  const covered = [];
  for (const [id, row] of checked.records) {
    const variant = variants.get(id);
    requireValue(variant && variant.typologyId === row.typologyId && variant.number === row.number
      && variant.status === 'Inspection physique' && variant.playable === false
      && variant.architecture === null && variant.spawnWeight === null && variant.campaign205?.eligible,
    'inspection modifiée ou raccord G11 absent : ' + id);
    const coverage = variantCoverage(row, checked.reportSha256, visual.has(id));
    requireValue(!variant.campaign208 || same(variant.campaign208, coverage),
      'édition de service conservée : ' + id);
    variant.campaign208 = coverage;
    covered.push(clone(row));
  }
  const stages = ['services', ...(checked.art ? ['art'] : [])], started = [];
  for (const task of out.tasks) {
    if (!TYPES.includes(task.typologyId) || !stages.includes(task.stage)) continue;
    const evidence = task.stage === 'art' ? ART_PROOF : PROOF;
    requireValue(task.status === 'À faire' && task.owner === 'Non affecté' && !task.evidence
      || task.status === 'En cours' && task.owner === 'Production Codex' && task.evidence === evidence,
    'édition de tâche conservée : ' + task.id);
    const rows = covered.filter(row => row.typologyId === task.typologyId);
    const offered = rows.reduce((sum, row) => sum + row.anchorsOffered, 0);
    const valid = rows.reduce((sum, row) => sum + row.anchorsValid, 0);
    task.status = 'En cours'; task.owner = 'Production Codex'; task.evidence = evidence;
    task.progress = task.stage === 'services'
      ? offered + ' supports proposés, ' + valid + ' poses de travail acceptées sur 50 modèles ; '
        + 'transactions et parcours complets ont leurs preuves distinctes, eau/réseaux non raccordés.'
      : 'Présentation native préparée sur le modèle V01 de cette famille ; '
        + 'activité, pause, interruption, emprise et lecture pure contrôlées, sans qualifier les 50 variantes.';
    if (task.stage === 'services' && task.typologyId === 'EXT-MONDE-T045') {
      task.progress += ' Aucun établi ajouté à l’atelier entretien historique ; outillage existant seulement.';
    }
    started.push(task.id);
  }
  const coverage = {version: 1, scope: COVERAGE_SCOPE, generation: 11, report: REPORT,
    evidence: PROOF, reportSha256: checked.reportSha256, geometryBaseline: clone(checked.report.geometryBaseline),
    summary: clone(checked.summary), worldSummary: clone(checked.worldSummary),
    worldWitnesses: clone(checked.report.worldWitnesses),
    records: covered, startedStages: stages, art: checked.art ? {
      report: ART_REPORT, evidence: ART_PROOF, reportSha256: checked.art.reportSha256,
      presentationScope: checked.art.report.presentationScope,
      idleBaseline: clone(checked.art.report.idleBaseline),
      records: clone(checked.art.records), summary: clone(checked.art.summary),
    } : null};
  requireValue(!out.campaign208 || same(out.campaign208, coverage), 'édition des totaux conservée');
  out.campaign208 = coverage;
  validateCoverage(out);
  return {data: out, changes: {inProgress: started, clarified, playableAdded: 0}};
}

function optionalPatch(data, root = path.resolve(__dirname, '..')) {
  if (fs.existsSync(path.join(root, REPORT))) return patch(data, root);
  requireValue(!data.campaign208 && !data.variants.some(row => row.campaign208)
    && !fs.existsSync(path.join(root, ART_REPORT)), 'preuve de service disparue ou visuel orphelin');
  const out = clone(data), clarified = clarifyProgress(out);
  return {data: out, changes: {inProgress: [], clarified, playableAdded: 0}};
}

function validateCoverage(data) {
  const coverage = data.campaign208, covered = data.variants.filter(row => row.campaign208);
  if (!coverage) {
    requireValue(covered.length === 0 && !data.tasks.some(task =>
      [PROOF, ART_PROOF].includes(task.evidence)), 'référence de services orpheline');
    return null;
  }
  requireValue(coverage.version === 1 && coverage.scope === COVERAGE_SCOPE && coverage.generation === 11
    && coverage.report === REPORT && coverage.evidence === PROOF && hex(coverage.reportSha256)
    && Array.isArray(coverage.records) && coverage.records.length === 200 && covered.length === 200
    && same(coverage.geometryBaseline, {...BASELINE, models: 200, worldSeeds: 3, unchanged: true}),
  'couverture de services invalide');
  const rows = new Map(), variants = new Map(covered.map(row => [row.id, row]));
  const visual = new Set(coverage.art?.records.map(row => row.authorPlanId) || []);
  for (const row of coverage.records) {
    identity(row);
    requireValue(!rows.has(row.authorPlanId) && row.geometryUnchanged === true
      && row.readsPure === true && row.supportIdentitiesUnique === true
      && row.modelScope === 'isolated-authored-model-geometry-not-a-seeded-instance'
      && FINGERPRINTS.every(key => hex(row.geometryFingerprint?.[key])),
    'modèle de service dupliqué ou altéré');
    supportTotals(row, row.typologyId);
    requireValue(row.anchorsValid > 0, 'modèle sans support accessible');
    const variant = variants.get(row.authorPlanId);
    requireValue(variant && variant.playable === false && variant.architecture === null
      && variant.spawnWeight === null && variant.status === 'Inspection physique'
      && same(variant.campaign208, variantCoverage(row, coverage.reportSha256, visual.has(row.authorPlanId))),
    'couverture de variante différente ou promue');
    rows.set(row.authorPlanId, row);
  }
  const summary = summarize([...rows.values()]);
  requireValue(same(coverage.summary, summary), 'totaux de services différents');
  requireValue(same(coverage.worldSummary, checkWorlds(coverage.worldWitnesses, rows)),
    'monde ou transactions extrapolés');
  const stages = ['services'];
  if (coverage.art) {
    requireValue(coverage.art.report === ART_REPORT && coverage.art.evidence === ART_PROOF
      && hex(coverage.art.reportSha256)
      && coverage.art.presentationScope === 'prepared-activity-reads-not-transactions'
      && same(coverage.art.idleBaseline, {version: ART_BASELINE.version, commit: ART_BASELINE.commit,
        sourceSha256: ART_BASELINE.sourceSha256, samples: ART_BASELINE.samples})
      && Array.isArray(coverage.art.records)
      && same(coverage.art.summary, summarizeArt(coverage.art.records)),
    'preuve visuelle différente');
    const seen = new Set();
    for (const row of coverage.art.records) {
      identity(row);
      const key = [row.authorPlanId, row.supportId, row.action].join(':');
      requireValue(row.number === 1 && !seen.has(key)
        && typeof row.supportId === 'string' && /^P\d{4}:0:\d+$/.test(row.supportId)
        && capability(row.action, row.supportKind, row.typologyId)
        && ART_CHECKS.every(check => row.checks?.[check] === true)
        && ['idle', 'active', 'later', 'reduced'].every(key => hex(row.pictures?.[key]))
        && row.pictures.idle !== row.pictures.active, 'présentation préparée altérée');
      seen.add(key);
    }
    requireValue(coverage.art.summary.types === 4 && coverage.art.summary.models === 4
      && coverage.art.summary.actions === 4, 'échantillons visuels extrapolés');
    stages.push('art');
  }
  requireValue(same(coverage.startedStages, stages), 'étapes de service différentes');
  for (const task of data.tasks) if (TYPES.includes(task.typologyId) && stages.includes(task.stage)) {
    requireValue(task.status === 'En cours' && task.owner === 'Production Codex'
      && task.evidence === (task.stage === 'art' ? ART_PROOF : PROOF),
    'étape globale indûment validée ou sans preuve');
  }
  requireValue(!data.tasks.some(task => [PROOF, ART_PROOF].includes(task.evidence)
    && (!TYPES.includes(task.typologyId) || !stages.includes(task.stage))),
  'preuve de tâche visuelle ou de service orpheline');
  return {...summary, worldSeeds: coverage.worldSummary.seeds,
    worldSites: coverage.worldSummary.sites, transactionsTested: 0,
    visualModels: coverage.art?.summary.models || 0, visualSamples: coverage.art?.summary.samples || 0};
}

module.exports = {REPORT, ART_REPORT, PROOF, ART_PROOF, SHEET, TABLE, SCOPE, ART_SCOPE, COVERAGE_SCOPE,
  TYPES, ACTIONS, ART_CHECKS, BASELINE, ART_BASELINE, FINGERPRINTS, WORLD_SEEDS, get SOURCE_FILES() { return Inventory.sourceNames(); },
  validateSources, validateReport, validateArtReport, checkedReport, summarize, summarizeArt,
  clarifyProgress, patch, optionalPatch, validateCoverage};
