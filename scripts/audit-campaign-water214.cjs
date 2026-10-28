'use strict';

// Physical rain-barrel poses are distinct from installation, rainfall, bucket
// transfers and traversals. This audit never creates an owner or a transaction.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../src/core.js');
const G = require('../src/frontier-geometry.js');
const W = require('../src/frontier-world.js');
const A = require('../src/codex-campaign205.js');
const P = require('../src/codex-physical2026.js');
const Supports = require('../src/campaign-water-supports214.js');
const Sources = require('./campaign-services-sources208.cjs');
const ServiceAudit = require('./audit-campaign-services208.cjs');

const ROOT = path.resolve(__dirname, '..');
const SCOPE = 'campaign-water214-support-audit';
const EFFECTS = Object.freeze({detailVersion: 13, ecologyVersion: 1, hydrologyVersion: 1});
const RUNTIME_FILES = Object.freeze(['src/campaign-water-supports214.js', 'src/campaign-water214.js']);
const EXTRA_SOURCES = Object.freeze(['scripts/audit-campaign-water214.cjs',
  'tests/audit-campaign-water214.test.cjs', 'tests/campaign-water214.test.cjs',
  'tests/campaign-water-supports214.test.cjs',
  'scripts/codex-campaign-water-progress214.cjs',
  'tests/codex-campaign-water-progress214.test.cjs', ...RUNTIME_FILES]);
const FINGERPRINTS = Object.freeze(['planSha256', 'detailsSha256', 'propsSha256', 'objectIdsSha256', 'stockSha256']);
const FACES = Object.freeze(['south', 'east', 'north', 'west']);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hash = value => sha(JSON.stringify(value));
const copy = value => JSON.parse(JSON.stringify(value));
const point = value => value && ['x', 'y'].every(key => Number.isFinite(value[key])) && value.z === 0;
const equalPoint = (a, b) => point(a) && point(b) && ['x', 'y', 'z'].every(key => Math.abs(a[key] - b[key]) < 1e-8);
let golden;
const baseline = () => golden || (golden = ServiceAudit.baseline());

function sourceNames(root = ROOT) {
  return [...new Set([...Sources.sourceNames(root), ...EXTRA_SOURCES])]
    .sort((a, b) => a.localeCompare(b));
}

function capture(root = ROOT) {
  const realRoot = fs.realpathSync(root);
  const rows = new Map(Sources.capture(realRoot).map(row => [row.path, row]));
  for (const name of EXTRA_SOURCES) {
    const file = path.join(realRoot, name), before = fs.lstatSync(file);
    if (!before.isFile() || before.isSymbolicLink() || fs.realpathSync(file) !== file) throw Error('Source214 non régulière : ' + name);
    const bytes = fs.readFileSync(file), after = fs.lstatSync(file);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.mode !== after.mode || bytes.length !== after.size) throw Error('Source214 modifiée pendant sa capture : ' + name);
    rows.set(name, {path: name, bytes: bytes.length, sha256: sha(bytes)});
  }
  return [...rows.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function physicalBarrels(details) {
  return details.outdoor.filter(object => object.kind === 'rain-barrel');
}

// Unlike the furniture facade208, this facade also maps each static campaign ID
// back to its actual authored solid. Only the addressed barrel can be ignored.
function modelWorld(model) {
  const {p, template, plan, details} = model;
  const sourceId = new Map([...plan.objects, ...details.interior].map(object => [object.id, object.authorObjectId]));
  for (let index = 0; index < details.outdoor.length; index++) {
    sourceId.set(details.outdoor[index].id, template.base.solids[index]?.id);
  }
  const local = value => G.local(p, value.x, value.y);
  const scene = (ignore, optical) => ({...template.scene, solids: template.scene.solids.filter(solid =>
    solid.id !== sourceId.get(ignore) && !(optical && solid.kind === 'closed-pool'))});
  const clear = (a, b, z, ignore, radius, optical) => z === 0 &&
    P.segmentClear(scene(ignore, optical), local(a), local(b), 0, radius);
  return Object.freeze({generation: 11, seed: 0, size: W.sizeForGeneration(11), pois: [p],
    geometryScope: 'isolated-authored-model-geometry',
    plan: (place, z = 0) => { if (place.id !== p.id || z !== 0) throw Error('Plan isolé214 absent.'); return plan; },
    detailAt: (place, z = 0) => { if (place.id !== p.id || z !== 0) throw Error('Détails isolés214 absents.'); return details; },
    blocked: (x, y, radius = P.DEFAULT_RADIUS, z = 0, inside = null, ignore = null) =>
      !clear({x, y}, {x, y}, z, ignore, radius, false),
    line: (a, b, z = 0, inside = null, ignore = null, radius = .05) => clear(a, b, z, ignore, radius, true),
    movementLine: (a, b, z = 0, inside = null, ignore = null, radius = .05) => clear(a, b, z, ignore, radius, false),
    coveredAt205: (x, y, z = 0) => z === 0 && A.insideBuilding(p, {x, y})});
}

function inspectSupport(world, p, details, descriptor) {
  const item = {supportId: descriptor?.supportId, supportKind: descriptor?.supportKind, accessible: false};
  const reject = reason => ({...item, reason});
  const object = physicalBarrels(details).find(candidate => candidate.id === descriptor?.supportId);
  if (!object || descriptor.siteId !== p.id || descriptor.supportKind !== 'rain-barrel' ||
      !/^P\d{4}:205:static:(0|[1-9]\d*)$/.test(object.id) ||
      object.campaign205 !== true || object.campaign205Structural !== true || object.solid !== true || object.z !== 0) {
    return reject('support-is-not-the-physical-rain-barrel');
  }
  const radius = P.DEFAULT_RADIUS, pad = C.CampaignWater214Rules.actorRadius + C.CampaignWater214Rules.approachClearance;
  const cx = object.x + object.w / 2, cy = object.y + object.h / 2;
  const at = (x, y) => ({...G.global(p, x, y), z: 0});
  const expectedFaces = [
    {anchor: at(cx, object.y + object.h + pad), workTarget: at(cx, object.y + object.h)},
    {anchor: at(object.x + object.w + pad, cy), workTarget: at(object.x + object.w, cy)},
    {anchor: at(cx, object.y - pad), workTarget: at(cx, object.y)},
    {anchor: at(object.x - pad, cy), workTarget: at(object.x, cy)}
  ];
  if (!descriptor.localRect || ['x', 'y', 'w', 'h'].some(key => descriptor.localRect[key] !== object[key]) ||
      !equalPoint(descriptor.center, {...G.global(p, object.x + object.w / 2, object.y + object.h / 2), z: 0}) ||
      !Array.isArray(descriptor.approaches) || descriptor.approaches.length !== FACES.length ||
      descriptor.approaches.some((face, index) => face.face !== FACES[index] ||
        !equalPoint(face.anchor, expectedFaces[index].anchor) || !equalPoint(face.workTarget, expectedFaces[index].workTarget))) {
    return reject('canonical-approaches-or-geometry-invalid');
  }
  const inside = anchor => {
    const q = G.local(p, anchor.x, anchor.y);
    return q.x >= radius && q.y >= radius && q.x <= p.w - radius && q.y <= p.h - radius;
  };
  const expected = descriptor.approaches.find(face => inside(face.anchor) &&
    !world.blocked(face.anchor.x, face.anchor.y, radius, 0, null) &&
    world.movementLine(face.anchor, face.workTarget, 0, null, object.id, radius));
  if (!expected) return reject('no-physically-accessible-work-face');
  const pose = {active: true, generation: 11, ...expected.anchor, inside: null, a: 0, car: null};
  const result = Supports.resolve(world, pose, {siteId: p.id, supportId: object.id}, [p.id], {structureDestroyed: () => false});
  if (!result.ok || result.siteId !== p.id || result.supportId !== object.id || result.face !== expected.face ||
      !equalPoint(result.anchor, expected.anchor) || !equalPoint(result.workTarget, expected.workTarget)) {
    return reject(result.reason || 'helper-does-not-resolve-the-first-practicable-face');
  }
  return {...item, accessible: true, face: result.face, anchor: copy(result.anchor),
    workTarget: copy(result.workTarget), center: copy(descriptor.center),
    rainExposed: world.coveredAt205(descriptor.center.x, descriptor.center.y, 0, null) === false};
}

function totals(supports, barrelsPresent) {
  return {barrelsPresent, supportsOffered: supports.length,
    supportsAccessible: supports.filter(row => row.accessible).length,
    rainExposed: supports.filter(row => row.accessible && row.rainExposed).length,
    refusals: supports.filter(row => !row.accessible).map(({supportId, reason}) => ({supportId, reason}))};
}

function auditModel214(typology, number) {
  const model = ServiceAudit.makeModel(typology, number), {p, plan, details} = model;
  const reference = baseline().models.find(row => row.authorPlanId === p.campaign205.authorPlanId);
  const before = ServiceAudit.fingerprints(p, plan, details), stateBefore = hash({p, plan, details});
  const geometryUnchanged = FINGERPRINTS.every(key => before[key] === reference?.[key]);
  const descriptors = Supports.supportsFor(p, plan, details), barrels = physicalBarrels(details);
  const ids = descriptors.map(row => row.supportId);
  const complete = new Set(ids).size === ids.length && hash([...ids].sort()) === hash(barrels.map(object => object.id).sort());
  const world = modelWorld(model), supports = descriptors.map(descriptor => inspectSupport(world, p, details, descriptor));
  const after = ServiceAudit.fingerprints(p, plan, details), readsPure = stateBefore === hash({p, plan, details});
  const result = totals(supports, barrels.length);
  return {authorPlanId: p.campaign205.authorPlanId, typologyId: typology, number, campaignType: p.type,
    pass: geometryUnchanged && readsPure && complete && result.refusals.length === 0,
    modelScope: 'isolated-authored-model-geometry-not-a-seeded-instance', geometryUnchanged,
    geometryFingerprint: after, readsPure, supportInventoryComplete: complete, supports, ...result};
}

function auditWorld214(seed) {
  const reference = baseline().worldSeeds.find(row => row.seed === seed);
  if (!reference) throw Error('Graine214 sans témoin géométrique publié : ' + seed);
  const world = W.create(seed, 11, EFFECTS), before = hash({pois: world.pois, roads: world.roads, coverage: world.campaignCoverage205});
  const geometryFingerprint = {poisSha256: hash(world.pois), roadsSha256: hash(world.roads), coverageSha256: hash(world.campaignCoverage205)};
  let geometryUnchanged = world.pois.length === reference.pois &&
    Object.keys(geometryFingerprint).every(key => geometryFingerprint[key] === reference[key]);
  const sites = world.pois.filter(p => p.campaign205).map(p => {
    const plan = world.plan(p, 0), details = world.detailAt(p, 0), old = reference.sites.find(row => row.id === p.id);
    const siteBefore = hash({p, plan, details});
    const fingerprint = {planSha256: hash(plan), detailsSha256: hash(details)};
    const retained = !!old && old.type === p.type && Object.keys(fingerprint).every(key => fingerprint[key] === old[key]);
    geometryUnchanged &&= retained;
    const descriptors = Supports.supportsFor(p, plan, details), barrels = physicalBarrels(details), ids = descriptors.map(row => row.supportId);
    const complete = new Set(ids).size === ids.length && hash([...ids].sort()) === hash(barrels.map(object => object.id).sort());
    const supports = descriptors.map(descriptor => inspectSupport(world, p, details, descriptor)), result = totals(supports, barrels.length);
    const readsPure = siteBefore === hash({p, plan, details});
    return {siteId: p.id, authorPlanId: p.campaign205.authorPlanId, typologyId: p.campaign205.typology, campaignType: p.type,
      pass: retained && readsPure && complete && result.refusals.length === 0, geometryUnchanged: retained, readsPure,
      geometryFingerprint: fingerprint, supportInventoryComplete: complete, supports, ...result};
  });
  const readsPure = before === hash({pois: world.pois, roads: world.roads, coverage: world.campaignCoverage205});
  return {seed, generation: 11, pass: geometryUnchanged && readsPure && sites.every(row => row.pass),
    scope: 'canonical-native-poses-not-traversals', geometryUnchanged, geometryFingerprint, readsPure, sites};
}

function summary(records) {
  const supports = records.flatMap(row => row.supports);
  return {types: new Set(records.map(row => row.typologyId)).size, models: records.length,
    barrelsPresent: records.reduce((sum, row) => sum + row.barrelsPresent, 0),
    supportsOffered: supports.length, supportsAccessible: supports.filter(row => row.accessible).length,
    rainExposed: supports.filter(row => row.accessible && row.rainExposed).length,
    refused: supports.filter(row => !row.accessible).length,
    modelsWithoutBarrels: records.filter(row => row.barrelsPresent === 0).length,
    modelsWithAccessibleBarrel: records.filter(row => row.supportsAccessible > 0).length,
    byType: Object.fromEntries(A.types.map(type => {
      const rows = records.filter(row => row.typologyId === type), objects = rows.flatMap(row => row.supports);
      return [type, {models: rows.length, barrelsPresent: rows.reduce((sum, row) => sum + row.barrelsPresent, 0),
        accessible: objects.filter(row => row.accessible).length, refused: objects.filter(row => !row.accessible).length}];
    }))};
}

function run(options = {}) {
  const seeds = ServiceAudit.validateSeeds(options.seeds || baseline().worldSeeds.map(row => row.seed));
  const sources = capture();
  const records = A.types.flatMap(type => Array.from({length: 50}, (_, index) => auditModel214(type, index + 1)));
  const worldWitnesses = seeds.map(auditWorld214), sourcesAfter = capture();
  const sourceStable = hash(sources) === hash(sourcesAfter);
  const publicRuntimeIncluded = RUNTIME_FILES.every(file => Sources.sourceNames(ROOT).includes(file));
  const unchanged = records.every(row => row.geometryUnchanged) && worldWitnesses.every(row => row.geometryUnchanged);
  return {version: 1, scope: SCOPE, generation: 11,
    pass: sourceStable && publicRuntimeIncluded && records.length === 200 && records.every(row => row.pass) &&
      worldWitnesses.length === 3 && worldWitnesses.every(row => row.pass),
    sourceBoundary: 'public-manifest-services208-and-water214-runtime-audit-tests', publicRuntimeIncluded,
    sourceStable, sources, sourcesAfter,
    geometryBaseline: {file: ServiceAudit.BASELINE_FILE, sha256: ServiceAudit.BASELINE_SHA256,
      baseCommit: baseline().baseCommit, baseTree: baseline().baseTree, models: 200, worldSeeds: 3, unchanged},
    records, summary: summary(records), worldWitnesses,
    worldSummary: {seeds: worldWitnesses.length, sites: worldWitnesses.reduce((sum, row) => sum + row.sites.length, 0),
      ...totals(worldWitnesses.flatMap(row => row.sites.flatMap(site => site.supports)),
        worldWitnesses.reduce((sum, row) => sum + row.sites.reduce((n, site) => n + site.barrelsPresent, 0), 0))},
    transactions: [], transactionScope: 'not-qualified-by-support-audit',
    rules: copy(C.CampaignWater214Rules),
    scopeLimit: '200 isolated authored models and three real G11 seed witnesses; canonical physical work poses only. No installed collector, rainfall balance, bucket transfer, completed traversal, UI payment, human campaign or physical-phone performance is inferred.'};
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.shift() !== '--output' || args.length !== 1 || !args[0] || args[0].startsWith('--')) {
    throw Error('Usage: node scripts/audit-campaign-water214.cjs --output NEW_OUTPUT.json');
  }
  const output = path.resolve(args[0]);
  if (fs.existsSync(output)) throw Error('Conserver le rapport existant ; choisissez une nouvelle sortie214.');
  const report = run();
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({pass: report.pass, summary: report.summary, worldSummary: report.worldSummary,
    worldWitnesses: report.worldWitnesses.map(row => ({seed: row.seed, sites: row.sites.length, pass: row.pass})), output}));
  if (!report.pass) process.exitCode = 1;
}

module.exports = {SCOPE, RUNTIME_FILES, EXTRA_SOURCES, FINGERPRINTS, FACES, baseline, sourceNames, capture, physicalBarrels,
  modelWorld, inspectSupport, totals, auditModel214, auditWorld214, summary, run};
