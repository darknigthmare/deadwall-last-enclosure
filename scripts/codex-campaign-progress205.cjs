'use strict';
// Campaign eligibility has its own evidence. It never promotes an inspection
// plan to a playable variant or guarantees a site in any particular seed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Inventory = require('./campaign-sources205.cjs');

const REPORT = 'docs/codex/suivi-monde2026/campagne205-eligibilite.json';
const PROOF = 'docs/codex/suivi-monde2026/CAMPAGNE_G11_2026.md';
const SCOPE = 'campaign205-eligibility-audit';
const COVERAGE_SCOPE = 'eligible-not-guaranteed-placement';
const TYPES = Object.freeze(['EXT-MONDE-T045', 'EXT-MONDE-T046', 'EXT-MONDE-T047', 'EXT-MONDE-T048']);
const CHECKS = Object.freeze(['planAudit', 'propsAudit', 'finiteLoot', 'doorsReachable']);
const SHEET = 'Campagne G11';
const TABLE = 'CampagneG11205';
const MAX_SITES_PER_TYPE = 2;
const MAX_SITES_PER_SEED = TYPES.length * MAX_SITES_PER_TYPE;
const clone = value => JSON.parse(JSON.stringify(value));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw Error('Suivi campagne G11 : ' + message); };
const alias = (type, number) => 'campaign205-' + type.slice(-3) + '-' + String(number).padStart(2, '0');
const authorId = (type, number) => type + '-V' + String(number).padStart(2, '0');

function validateReport(report, readSource, expectedSources = Inventory.sourceNames()) {
  if (!report || report.version !== 1 || report.scope !== SCOPE || report.generation !== 11
      || report.pass !== true || report.sourceStable !== true
      || !Array.isArray(report.records) || report.records.length !== TYPES.length * 50
      || !Array.isArray(report.sources) || report.campaignPlayable !== undefined && report.campaignPlayable !== 0
      || report.guaranteedSitesPerSeed !== undefined && report.guaranteedSitesPerSeed !== 0
      || report.eligibleVariants !== undefined && report.eligibleVariants !== TYPES.length * 50
      || report.maximumSites !== undefined && report.maximumSites !== MAX_SITES_PER_SEED) fail('rapport absent ou périmètre invalide');
  if (JSON.stringify(report.sourcesAfter) !== JSON.stringify(report.sources)) fail('captures de sources avant/après différentes');
  if (JSON.stringify(report.sources.map(source => source?.path)) !== JSON.stringify(expectedSources)) fail('inventaire de sources incomplet ou différent');
  const sources = new Set();
  for (const source of report.sources) {
    if (!source || typeof source.path !== 'string' || !source.path
        || path.isAbsolute(source.path) || /[\\\x00-\x1f]/.test(source.path)
        || source.path.split('/').some(part => !part || part === '.' || part === '..')
        || sources.has(source.path) || !Number.isSafeInteger(source.bytes) || source.bytes < 0
        || !/^[a-f0-9]{64}$/.test(source.sha256 || '')) fail('provenance de campagne invalide');
    sources.add(source.path);
    const bytes = readSource(source.path);
    if (!Buffer.isBuffer(bytes) || bytes.length !== source.bytes || digest(bytes) !== source.sha256) fail('preuve périmée : ' + source.path);
  }
  const records = new Map();
  for (const record of report.records) {
    if (!record || !TYPES.includes(record.typologyId) || !Number.isInteger(record.number)
        || record.number < 1 || record.number > 50 || record.id !== authorId(record.typologyId, record.number)
        || record.campaignType !== alias(record.typologyId, record.number) || records.has(record.id)
        || record.pass !== true || CHECKS.some(key => record[key] !== true)
        || record.playable === true || record.guaranteed === true) fail('preuve de variante invalide : ' + record?.id);
    records.set(record.id, record);
  }
  for (const type of TYPES) for (let number = 1; number <= 50; number++) {
    if (!records.has(authorId(type, number))) fail('variante éligible manquante');
  }
  const placements = report.placements === undefined ? [] : report.placements;
  if (!Array.isArray(placements)) fail('témoins de placement invalides');
  const seeds = new Set(), placed = new Map();
  let observedSites = 0;
  for (const witness of placements) {
    if (!witness || !Number.isSafeInteger(witness.seed) || witness.seed < 0 || witness.seed > 0xffffffff
        || seeds.has(witness.seed) || witness.generation !== 11 || witness.pass !== true
        || witness.historicalPrefixUnchanged !== true || !Array.isArray(witness.sites)
        || witness.sites.length > MAX_SITES_PER_SEED) fail('témoin de graine invalide');
    seeds.add(witness.seed);
    const ids = new Set(), types = new Map();
    for (const site of witness.sites) {
      const record = records.get(site?.authorPlanId);
      if (!record || site.campaignType !== record.campaignType || (types.get(record.typologyId) || 0) >= MAX_SITES_PER_TYPE
          || !(typeof site.id === 'string' && site.id || Number.isSafeInteger(site.id) && site.id > 0)
          || ids.has(site.id) || !Number.isFinite(site.x) || !Number.isFinite(site.y)
          || site.physicalAudit !== true) fail('implantation observée invalide');
      ids.add(site.id); types.set(record.typologyId, (types.get(record.typologyId) || 0) + 1); observedSites++;
      if (!placed.has(record.id)) placed.set(record.id, []);
      placed.get(record.id).push({seed: witness.seed, siteId: site.id});
    }
  }
  return {records, placements, placed, summary: {types: TYPES.length, eligibleVariants: records.size,
    passedVariants: records.size, guaranteedSitesPerSeed: 0, observedSeeds: seeds.size,
    observedSites, observedVariants: placed.size}};
}

function checkedReport(root = path.resolve(__dirname, '..')) {
  const sourceBefore = Inventory.capture(root);
  const bytes = fs.readFileSync(path.join(root, REPORT));
  const report = JSON.parse(bytes);
  const checked = validateReport(report, name => {
    const filename = path.join(root, name);
    const stat = fs.lstatSync(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) fail('source non régulière : ' + name);
    return fs.readFileSync(filename);
  }, sourceBefore.map(source => source.path));
  const sourceAfter = Inventory.capture(root);
  if (JSON.stringify(sourceBefore) !== JSON.stringify(sourceAfter)) fail('sources de campagne modifiées pendant la vérification');
  return {report, reportSha256: digest(bytes), ...checked};
}

function variantCoverage(record, reportSha256, observations) {
  return {version: 1, scope: COVERAGE_SCOPE, generation: 11, campaignType: record.campaignType,
    eligible: true, ...Object.fromEntries(CHECKS.map(key => [key, true])),
    observations: observations.map(value => ({...value})), observedSeeds: [...new Set(observations.map(value => value.seed))],
    observedInstances: observations.length,
    report: REPORT, evidence: PROOF, reportSha256};
}

function patch(data, root = path.resolve(__dirname, '..')) {
  const checked = checkedReport(root), out = clone(data);
  const byId = new Map(out.variants.map(variant => [variant.id, variant]));
  for (const [id, record] of checked.records) {
    const variant = byId.get(id);
    if (!variant || variant.typologyId !== record.typologyId || variant.number !== record.number
        || variant.status !== 'Inspection physique' || variant.playable !== false
        || variant.architecture !== null || variant.spawnWeight !== null) fail('inspection modifiée : ' + id);
    const coverage = variantCoverage(record, checked.reportSha256, checked.placed.get(id) || []);
    if (variant.campaign205 && JSON.stringify(variant.campaign205) !== JSON.stringify(coverage)) fail('édition de campagne conservée : ' + id);
    variant.campaign205 = coverage;
  }
  const started = ['loot', ...(checked.summary.observedSites ? ['seed'] : [])];
  for (const task of out.tasks) {
    if (!TYPES.includes(task.typologyId) || !started.includes(task.stage)) continue;
    if (!(task.status === 'À faire' && !task.evidence && task.owner === 'Non affecté'
        || task.status === 'En cours' && task.evidence === PROOF && task.owner === 'Production Codex')) fail('édition de tâche conservée : ' + task.id);
    task.status = 'En cours'; task.owner = 'Production Codex'; task.evidence = PROOF;
    task.progress = task.stage === 'loot'
      ? 'Budgets finis des 50 modèles G11 contrôlés ; récolte, services et parcours complets restent des preuves distinctes.'
      : 'Éligibilité des 50 modèles G11 et implantations témoins contrôlées ; aucune quantité de lieux garantie par graine.';
  }
  const coverage = {version: 1, scope: COVERAGE_SCOPE, generation: 11,
    report: REPORT, evidence: PROOF, reportSha256: checked.reportSha256,
    summary: {...checked.summary}, startedStages: started, witnessSeeds: checked.placements.map(witness => witness.seed),
    records: [...checked.records.values()].map(record => ({id: record.id, typologyId: record.typologyId,
      number: record.number, ...variantCoverage(record, checked.reportSha256, checked.placed.get(record.id) || [])}))};
  if (out.campaign205 && JSON.stringify(out.campaign205) !== JSON.stringify(coverage)) fail('édition des totaux conservée');
  out.campaign205 = coverage;
  validateCoverage(out);
  return {data: out, changes: {eligibleAdded: checked.records.size, playableAdded: 0,
    inProgress: out.tasks.filter(task => TYPES.includes(task.typologyId) && started.includes(task.stage)).map(task => task.id)}};
}

function validateCoverage(data) {
  const coverage = data.campaign205;
  const covered = data.variants.filter(variant => variant.campaign205);
  if (!coverage) { if (covered.length) fail('références de campagne orphelines'); return null; }
  if (coverage.version !== 1 || coverage.scope !== COVERAGE_SCOPE || coverage.generation !== 11
      || coverage.report !== REPORT || coverage.evidence !== PROOF || !/^[a-f0-9]{64}$/.test(coverage.reportSha256 || '')
      || !Array.isArray(coverage.records) || coverage.records.length !== TYPES.length * 50
      || covered.length !== coverage.records.length || !Array.isArray(coverage.startedStages)
      || coverage.startedStages.some(stage => !['seed', 'loot'].includes(stage))
      || new Set(coverage.startedStages).size !== coverage.startedStages.length
      || !coverage.startedStages.includes('loot') || !Array.isArray(coverage.witnessSeeds)
      || new Set(coverage.witnessSeeds).size !== coverage.witnessSeeds.length
      || coverage.witnessSeeds.some(seed => !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)) fail('couverture de campagne invalide');
  const byId = new Map(data.variants.map(variant => [variant.id, variant]));
  const seen = new Set(), witnessSeeds = new Set(coverage.witnessSeeds), placedTypes = new Map(), placedIds = new Map();
  let observedSites = 0, observedVariants = 0;
  for (const row of coverage.records) {
    const variant = byId.get(row.id);
    if (!TYPES.includes(row.typologyId) || !Number.isInteger(row.number) || row.number < 1 || row.number > 50
        || row.id !== authorId(row.typologyId, row.number) || seen.has(row.id) || !variant
        || variant.typologyId !== row.typologyId || variant.number !== row.number
        || variant.playable !== false || variant.architecture !== null || variant.spawnWeight !== null
        || row.campaignType !== alias(row.typologyId, row.number) || row.eligible !== true
        || row.playable === true || row.guaranteed === true
        || CHECKS.some(key => row[key] !== true) || row.version !== 1 || row.scope !== COVERAGE_SCOPE
        || row.generation !== 11 || row.report !== REPORT || row.evidence !== PROOF
        || row.reportSha256 !== coverage.reportSha256 || !Array.isArray(row.observedSeeds)
        || new Set(row.observedSeeds).size !== row.observedSeeds.length || !Array.isArray(row.observations)
        || row.observedSeeds.some(seed => !witnessSeeds.has(seed))
        || row.observedInstances !== row.observations.length) fail('couverture de variante invalide : ' + row?.id);
    const {id, typologyId, number, ...expected} = row;
    if (JSON.stringify(variant.campaign205) !== JSON.stringify(expected)) fail('référence de variante différente : ' + row.id);
    seen.add(row.id);
    const observedSeeds = new Set();
    for (const observation of row.observations) {
      const {seed, siteId} = observation || {};
      if (!witnessSeeds.has(seed) || !(typeof siteId === 'string' && siteId || Number.isSafeInteger(siteId) && siteId > 0)) fail('observation de campagne invalide');
      if (!placedTypes.has(seed)) { placedTypes.set(seed, new Map()); placedIds.set(seed, new Set()); }
      const count = placedTypes.get(seed).get(row.typologyId) || 0;
      if (count >= MAX_SITES_PER_TYPE || placedIds.get(seed).has(siteId)) fail('instances dupliquées ou limite de témoin dépassée');
      placedTypes.get(seed).set(row.typologyId, count + 1); placedIds.get(seed).add(siteId); observedSeeds.add(seed);
    }
    if (JSON.stringify([...observedSeeds]) !== JSON.stringify(row.observedSeeds)) fail('graines de variante différentes');
    observedSites += row.observedInstances; observedVariants += row.observedInstances > 0 ? 1 : 0;
  }
  const summary = {types: TYPES.length, eligibleVariants: seen.size, passedVariants: seen.size,
    guaranteedSitesPerSeed: 0, observedSeeds: witnessSeeds.size, observedSites, observedVariants};
  if (Object.keys(summary).some(key => coverage.summary?.[key] !== summary[key])
      || coverage.startedStages.includes('seed') !== (observedSites > 0)) fail('totaux de campagne différents');
  for (const task of data.tasks) if (TYPES.includes(task.typologyId) && coverage.startedStages.includes(task.stage)) {
    if (task.status !== 'En cours' || task.evidence !== PROOF) fail('étape de campagne indûment validée : ' + task.id);
  }
  return summary;
}

module.exports = {REPORT, PROOF, SCOPE, COVERAGE_SCOPE, TYPES, get SOURCE_FILES() { return Inventory.sourceNames(); }, CHECKS, SHEET, TABLE, MAX_SITES_PER_TYPE, MAX_SITES_PER_SEED,
  alias, authorId, validateReport, checkedReport, patch, validateCoverage};
