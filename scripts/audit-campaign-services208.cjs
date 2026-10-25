'use strict';

// Model inspection, seeded poses and paid gameplay transactions are distinct
// proofs. This producer certifies the first two and never invents the third.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../src/core.js');
const G = require('../src/frontier-geometry.js');
const W = require('../src/frontier-world.js');
const A = require('../src/codex-campaign205.js');
const P = require('../src/codex-physical2026.js');
const Services = require('../src/campaign-services208.js');
const Sources = require('./campaign-services-sources208.cjs');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_FILE = 'tests/fixtures/campaign-services208-g11-M-golden.json';
const BASELINE_SHA256 = '214ae75c6e3dfbd36adf4fa4a249ba6309d85a0424ae74e4b66da8a574f62b13';
const ACTIONS = Object.freeze(['meal', 'restSheltered', 'service', 'medicalCare']);
const EFFECTS = Object.freeze({detailVersion: 13, ecologyVersion: 1, hydrologyVersion: 1});
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hash = value => sha(JSON.stringify(value));
const copy = value => JSON.parse(JSON.stringify(value));
const finitePoint = point => point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.z === 0;

function baseline() {
  const raw = fs.readFileSync(path.join(ROOT, BASELINE_FILE));
  if (sha(raw) !== BASELINE_SHA256) throw Error('Empreinte du témoin G11 publié modifiée.');
  const result = JSON.parse(raw);
  if (result.baseCommit !== '8780075f305e405e5aa94e593a70d11391b16e20' || !result.sourceStable || result.models.length !== 200 || result.worldSeeds.length !== 3) throw Error('Témoin G11 publié incomplet.');
  return result;
}

function fingerprints(p, plan, details) {
  const props = [...plan.objects, ...details.interior];
  return {planSha256: hash(plan), detailsSha256: hash(details), propsSha256: hash(props),
    objectIdsSha256: hash(props.map(prop => prop.id)), stockSha256: hash(plan.objects)};
}

function makeModel(typology, number) {
  const type = A.typeFor(typology, number), preset = A.preset(type);
  if (!preset) throw Error('Modèle de service208 inconnu.');
  const p = {...preset, type, id: 'P' + (9000 + A.types.indexOf(typology) * 50 + number - 1),
    x: 1000, y: 2000, a: 0, generation: 11};
  const template = A.template(type), plan = A.plan(p), details = A.details(p);
  return {p, template, plan, details};
}

// This isolated facade uses the real authored swept-disc geometry. It is not a
// seeded region, and its successful poses are never counted as world instances.
function modelWorld(model) {
  const {p, template, plan, details} = model;
  const byId = new Map([...plan.objects, ...details.interior].map(prop => [prop.id, prop]));
  const scene = (ignore, optical) => ({...template.scene, solids: template.scene.solids.filter(solid =>
    solid.id !== byId.get(ignore)?.authorObjectId && !(optical && solid.kind === 'closed-pool'))});
  const local = point => G.local(p, point.x, point.y);
  const clear = (a, b, z, ignore, radius, optical) => z === 0 && P.segmentClear(scene(ignore, optical), local(a), local(b), 0, radius);
  return Object.freeze({generation: 11, seed: 0, size: W.sizeForGeneration(11), pois: [p],
    geometryScope: 'isolated-authored-model-geometry',
    nearPOI: (x, y, radius) => {
      const q = G.local(p, x, y), distance = Math.hypot(Math.max(-q.x, 0, q.x - p.w), Math.max(-q.y, 0, q.y - p.h));
      return distance <= radius ? [p] : [];
    },
    plan: (place, z = 0) => { if (place.id !== p.id || z !== 0) throw Error('Plan isolé absent.'); return plan; },
    detailAt: (place, z = 0) => { if (place.id !== p.id || z !== 0) throw Error('Détails isolés absents.'); return details; },
    blocked: (x, y, radius = P.DEFAULT_RADIUS, z = 0, inside = null, ignore = null) => !clear({x, y}, {x, y}, z, ignore, radius, false),
    line: (a, b, z = 0, inside = null, ignore = null, radius = .05) => clear(a, b, z, ignore, radius, true),
    movementLine: (a, b, z = 0, inside = null, ignore = null, radius = .05) => clear(a, b, z, ignore, radius, false),
    coveredAt205: (x, y, z = 0) => z === 0 && A.insideBuilding(p, {x, y})});
}

function capabilityMatches(p, prop, action) {
  return action === 'meal' ? prop.kind === 'oven' :
    action === 'restSheltered' ? prop.kind === 'singleBunk' :
    action === 'service' ? ['workbench', 'toolbox'].includes(prop.kind) :
    action === 'medicalCare' ? prop.kind === 'medical' && p.campaign205.typology === 'EXT-MONDE-T047' : false;
}

function inspectSupport(world, p, plan, details, support) {
  const props = [...plan.objects, ...details.interior], prop = props.find(candidate => candidate.id === support.supportId);
  const item = {supportId: support.supportId, action: support.action, supportKind: support.supportKind,
    ...(support.anchor ? {anchor: copy(support.anchor)} : {}), accessible: false};
  const reject = reason => ({...item, reason});
  if (support.siteId !== p.id || !prop || prop.kind !== support.supportKind || !capabilityMatches(p, prop, support.action)) return reject('support-or-capability-mismatch');
  if (!finitePoint(support.anchor) || !finitePoint(support.workTarget) || !prop.access) return reject('invalid-canonical-service-face');
  const expectedAnchor = G.global(p, prop.access.x + prop.access.w / 2, prop.access.y + prop.access.h / 2);
  if (Math.hypot(expectedAnchor.x - support.anchor.x, expectedAnchor.y - support.anchor.y) > 1e-8) return reject('anchor-is-not-the-authored-service-face');
  const localAnchor = G.local(p, support.anchor.x, support.anchor.y);
  const expectedWorkTarget = G.global(p, Math.max(prop.x, Math.min(prop.x + prop.w, localAnchor.x)), Math.max(prop.y, Math.min(prop.y + prop.h, localAnchor.y)));
  if (Math.hypot(expectedWorkTarget.x - support.workTarget.x, expectedWorkTarget.y - support.workTarget.y) > 1e-8) return reject('work-target-is-not-the-physical-support');
  const radius = P.DEFAULT_RADIUS;
  if (world.blocked(support.anchor.x, support.anchor.y, radius, 0, p.id)) return reject('canonical-pose-blocked');
  if (!world.movementLine(support.anchor, support.workTarget, 0, p.id, support.supportId, radius)) return reject('canonical-gesture-blocked');
  if (support.action === 'restSheltered' && world.coveredAt205(support.anchor.x, support.anchor.y, 0, p.id) !== true) return reject('canonical-bed-not-sheltered');
  const pose = {active: true, generation: 11, ...support.anchor, inside: p.id, a: 0, car: null};
  const resolved = Services.resolve(world, pose, {siteId: p.id, supportId: support.supportId, action: support.action}, [p.id], {structureDestroyed: () => false});
  if (!resolved.ok || resolved.supportId !== support.supportId || resolved.action !== support.action) return reject(resolved.reason || 'canonical-helper-resolution-refused');
  return {...item, accessible: true};
}

function supportTotals(supports) {
  const supportCountsByAction = Object.fromEntries(ACTIONS.map(action => [action, supports.filter(row => row.action === action).length]));
  return {supportCountsByAction, anchorsOffered: supports.length, anchorsValid: supports.filter(row => row.accessible).length,
    refusals: supports.filter(row => !row.accessible).map(({supportId, action, reason}) => ({supportId, action, reason}))};
}

function auditVariant208(typology, number) {
  const model = makeModel(typology, number), {p, plan, details} = model;
  const reference = baseline().models.find(row => row.authorPlanId === p.campaign205.authorPlanId);
  const before = fingerprints(p, plan, details), geometryUnchanged = Object.keys(before).every(key => before[key] === reference?.[key]);
  const stateBefore = hash({p, plan, details});
  const offered = Services.supportsFor(p, plan, details), keys = offered.map(row => row.supportId + ':' + row.action);
  const world = modelWorld(model), supports = offered.map(row => inspectSupport(world, p, plan, details, row));
  const totals = supportTotals(supports), after = fingerprints(p, plan, details);
  const pure = stateBefore === hash({p, plan, details}), unique = new Set(keys).size === keys.length;
  const invalidCapability = supports.some(row => ['support-or-capability-mismatch', 'invalid-canonical-service-face', 'anchor-is-not-the-authored-service-face', 'work-target-is-not-the-physical-support'].includes(row.reason));
  return {authorPlanId: p.campaign205.authorPlanId, typologyId: typology, number, campaignType: p.type,
    pass: geometryUnchanged && pure && unique && !invalidCapability && totals.anchorsValid > 0,
    modelScope: 'isolated-authored-model-geometry-not-a-seeded-instance', geometryUnchanged,
    geometryFingerprint: after, readsPure: pure, supportIdentitiesUnique: unique, supports, ...totals};
}

function auditWorld208(seed) {
  const reference = baseline().worldSeeds.find(row => row.seed === seed);
  if (!reference) throw Error('Graine sans témoin M enregistré : ' + seed);
  const world = W.create(seed, 11, EFFECTS), before = hash({pois: world.pois, roads: world.roads, coverage: world.campaignCoverage205});
  const geometryFingerprint = {poisSha256: hash(world.pois), roadsSha256: hash(world.roads), coverageSha256: hash(world.campaignCoverage205)};
  let geometryUnchanged = world.pois.length === reference.pois && Object.keys(geometryFingerprint).every(key => geometryFingerprint[key] === reference[key]);
  const sites = world.pois.filter(p => p.campaign205).map(p => {
    const plan = world.plan(p, 0), details = world.detailAt(p, 0), old = reference.sites.find(row => row.id === p.id);
    const siteFingerprint = {planSha256: hash(plan), detailsSha256: hash(details)};
    const retained = !!old && old.type === p.type && Object.keys(siteFingerprint).every(key => siteFingerprint[key] === old[key]);
    geometryUnchanged &&= retained;
    const supports = Services.supportsFor(p, plan, details).map(row => inspectSupport(world, p, plan, details, row)), totals = supportTotals(supports);
    return {siteId: p.id, authorPlanId: p.campaign205.authorPlanId, campaignType: p.type,
      pass: retained && totals.anchorsValid > 0, geometryUnchanged: retained, geometryFingerprint: siteFingerprint, supports, ...totals};
  });
  const pure = before === hash({pois: world.pois, roads: world.roads, coverage: world.campaignCoverage205});
  return {seed, generation: 11, pass: geometryUnchanged && pure && sites.every(row => row.pass), geometryUnchanged, geometryFingerprint, readsPure: pure,
    scope: 'canonical-native-poses-not-traversals', sites};
}

function summary(records) {
  const supports = records.flatMap(row => row.supports);
  return {types: new Set(records.map(row => row.typologyId)).size, models: records.length,
    offered: supports.length, valid: supports.filter(row => row.accessible).length, refused: supports.filter(row => !row.accessible).length,
    modelsWithAccessibleSupport: records.filter(row => row.anchorsValid > 0).length,
    modelsWithoutAccessibleSupport: records.filter(row => row.anchorsValid === 0).length,
    byAction: Object.fromEntries(ACTIONS.map(action => {
      const rows = supports.filter(row => row.action === action), valid = rows.filter(row => row.accessible).length;
      return [action, {offered: rows.length, valid, refused: rows.length - valid}];
    }))};
}

function validateSeeds(seeds) {
  const expected = baseline().worldSeeds.map(row => row.seed);
  if (!Array.isArray(seeds) || seeds.length !== expected.length || new Set(seeds).size !== expected.length || seeds.some(seed => !expected.includes(seed))) throw Error('Les trois graines distinctes du témoin M sont requises.');
  return [...seeds];
}

function run(options = {}) {
  const seeds = validateSeeds(options.seeds || baseline().worldSeeds.map(row => row.seed));
  const sources = Sources.capture(ROOT), records = A.types.flatMap(type => Array.from({length: 50}, (_, index) => auditVariant208(type, index + 1)));
  const worldWitnesses = seeds.map(auditWorld208);
  const sourcesAfter = Sources.capture(ROOT), sourceStable = JSON.stringify(sources) === JSON.stringify(sourcesAfter);
  const geometryUnchanged = records.every(row => row.geometryUnchanged) && worldWitnesses.every(row => row.geometryUnchanged);
  return {version: 1, scope: 'campaign-services208-audit', generation: 11,
    pass: sourceStable && records.length === 200 && records.every(row => row.pass) && worldWitnesses.length === 3 && worldWitnesses.every(row => row.pass),
    sourceStable, sources, sourcesAfter, geometryBaseline: {file: BASELINE_FILE, sha256: BASELINE_SHA256,
      baseCommit: baseline().baseCommit, baseTree: baseline().baseTree, models: records.length, worldSeeds: worldWitnesses.length, unchanged: geometryUnchanged},
    records, summary: summary(records), worldWitnesses, transactions: [], transactionScope: 'not-qualified-by-support-audit',
    scopeLimit: '200 isolated model service-face checks and three seeded canonical-pose witnesses. No complete route, paid transaction, human campaign or physical phone performance is inferred.'};
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--output') args.shift();
  const output = args.shift(), seeds = args.map(Number);
  if (!output || output.startsWith('--') || seeds.some(seed => !Number.isInteger(seed))) throw Error('Usage: node scripts/audit-campaign-services208.cjs --output OUTPUT.json [baseline seeds]');
  const report = run(seeds.length ? {seeds} : {});
  fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({pass: report.pass, summary: report.summary, worldWitnesses: report.worldWitnesses.map(row => ({seed: row.seed, sites: row.sites.length, pass: row.pass})), output}));
  if (!report.pass) process.exitCode = 1;
}

module.exports = {ACTIONS, BASELINE_FILE, BASELINE_SHA256, baseline, fingerprints, makeModel, modelWorld, inspectSupport, supportTotals, auditVariant208, auditWorld208, summary, validateSeeds, run};
