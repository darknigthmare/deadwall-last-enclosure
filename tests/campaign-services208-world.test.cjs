'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const C = require('../src/core.js');
const G = require('../src/frontier-geometry.js');
const W = require('../src/frontier-world.js');
const A = require('../src/codex-campaign205.js');
const Services = require('../src/campaign-services208.js');
const Audit = require('../scripts/audit-campaign-services208.cjs');
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const effects = {detailVersion: 13, ecologyVersion: 1, hydrologyVersion: 1};
const intact = {structureDestroyed: () => false};
let records, seededWorld;
const allModels = () => records ||= A.types.flatMap(type => Array.from({length: 50}, (_, n) => Audit.auditVariant208(type, n + 1)));
const nativeWorld = () => seededWorld ||= W.create(17117, 11, effects);
const poseAt = (p, support) => ({active: true, generation: 11, ...support.anchor, inside: p.id, a: 0, car: null});
const requestFor = support => ({siteId: support.siteId, supportId: support.supportId, action: support.action});
function prepared(type = 'EXT-MONDE-T047', action = 'meal') {
  const model = Audit.makeModel(type, 1), world = Audit.modelWorld(model);
  const support = Services.supportsFor(model.p, model.plan, model.details).find(row => row.action === action);
  assert.ok(support, type + ':' + action);
  return {...model, world, support, pose: poseAt(model.p, support), request: requestFor(support)};
}

test('208 seed witnesses cannot duplicate, omit or substitute a releasedM reference', () => {
  assert.deepEqual(Audit.validateSeeds([0, 17117, 967313470]), [0, 17117, 967313470]);
  for (const seeds of [[0, 0, 0], [0, 17117], [1, 17117, 967313470], [0, 17117, 967313470, 0]]) assert.throws(() => Audit.validateSeeds(seeds), /trois graines distinctes/);
});

test('208 independent world QA preserves every releasedM plan, prop, ID and finite stock across200 authored models', t => {
  const golden = Audit.baseline(), rows = allModels();
  assert.equal(golden.baseCommit, '8780075f305e405e5aa94e593a70d11391b16e20');
  assert.equal(golden.baseTree, 'ac2f82aef75e8f4d942977bf68a4b43ff7796764');
  assert.equal(golden.sourceStable, true);
  assert.equal(rows.length, 200);
  for (const row of rows) {
    assert.equal(row.pass, true, row.authorPlanId + ' ' + JSON.stringify(row.refusals));
    assert.equal(row.geometryUnchanged, true, row.authorPlanId);
    assert.equal(row.readsPure, true, row.authorPlanId);
    assert.equal(row.supportIdentitiesUnique, true, row.authorPlanId);
    assert.equal(row.anchorsOffered, row.supports.length);
    assert.equal(row.anchorsOffered - row.anchorsValid, row.refusals.length);
    assert.equal(row.modelScope, 'isolated-authored-model-geometry-not-a-seeded-instance');
    for (const support of row.supports) {
      assert.ok(Audit.ACTIONS.includes(support.action));
      if (!support.accessible) assert.ok(typeof support.reason === 'string' && support.reason.length > 0);
    }
  }
  t.diagnostic(JSON.stringify({scope: '200isolatedmodelcanonicalfaces', ...Audit.summary(rows)}));
});

test('208 actual furniture capabilities keep T045 toolbox maintenance distinct from an invented workshop', () => {
  for (const row of allModels()) {
    if (row.typologyId === 'EXT-MONDE-T045') {
      const maintenance = row.supports.filter(support => support.action === 'service');
      assert.ok(maintenance.length > 0);
      assert.ok(maintenance.every(support => support.supportKind === 'toolbox'), row.authorPlanId);
      assert.equal(row.supportCountsByAction.medicalCare, 0);
    }
    if (row.typologyId !== 'EXT-MONDE-T047') assert.equal(row.supportCountsByAction.medicalCare, 0);
    else assert.ok(row.supports.some(support => support.action === 'medicalCare' && support.supportKind === 'medical'));
  }
});

test('208 static support reads reject wrong provenance, generation, floor and nonphysical substitutes', () => {
  const {p, plan, details} = Audit.makeModel('EXT-MONDE-T047', 1);
  assert.deepEqual(Services.supportsFor({...p, generation: 10}, plan, details), []);
  assert.deepEqual(Services.supportsFor({...p, campaign205: {...p.campaign205, variant: 50}}, plan, details), []);
  assert.deepEqual(Services.supportsFor(p, {...plan, campaign205: {...plan.campaign205, authorPlanId: 'fake'}}, details), []);
  const combined = [...plan.objects, ...details.interior], oven = combined.find(prop => prop.kind === 'oven');
  assert.ok(oven);
  for (const patch of [{level: 1}, {solid: false}, {kind: '__proto__'}, {access: {x: -1, y: 0, w: 1, h: 1}}]) {
    const alteredPlan = copy(plan), alteredDetails = copy(details);
    for (const prop of [...alteredPlan.objects, ...alteredDetails.interior]) if (prop.id === oven.id) Object.assign(prop, patch);
    assert.ok(Services.supportsFor(p, alteredPlan, alteredDetails).every(row => row.supportId !== oven.id));
  }
});

test('208 the nearest real service face remains discoverable beyond35m from its parcel centre', () => {
  const world = nativeWorld(); let witness;
  for (const p of world.pois.filter(place => place.campaign205)) {
    for (const support of Services.supportsFor(p, world.plan(p, 0), world.detailAt(p, 0))) {
      if (Math.hypot(support.anchor.x - p.x, support.anchor.y - p.y) <= C.CampaignServices208Rules.nearbyRadius) continue;
      const pose = poseAt(p, support), resolved = Services.resolve(world, pose, requestFor(support), [p.id], intact);
      if (resolved.ok) { witness = {p, support, pose}; break; }
    }
    if (witness) break;
  }
  assert.ok(witness, 'A real G11 far-corner support is required; no position injection into a live game is implied.');
  const rows = Services.list(world, witness.pose, [witness.p.id], intact);
  assert.ok(rows.length <= C.CampaignServices208Rules.maxActions);
  assert.ok(rows.some(row => row.ok && row.supportId === witness.support.supportId && row.action === witness.support.action));
});

test('208 discovery and destruction are read live after the geometry cache has been warmed', () => {
  const {p, world, pose, request} = prepared('EXT-MONDE-T047', 'medicalCare');
  let destroyed = false, reads = 0;
  const options = {structureDestroyed: () => { reads++; return destroyed; }};
  assert.equal(Services.resolve(world, pose, request, [p.id], options).ok, true);
  assert.ok(Services.list(world, pose, [p.id], options).length > 0);
  destroyed = true;
  assert.equal(Services.resolve(world, pose, request, [p.id], options).ok, false);
  assert.ok(Services.list(world, pose, [p.id], options).every(row => !row.ok));
  destroyed = false;
  assert.equal(Services.resolve(world, pose, request, [], options).ok, false);
  assert.deepEqual(Services.list(world, pose, [], options), []);
  assert.equal(Services.resolve(world, pose, request, [p.id], {}).ok, false);
  assert.equal(Services.resolve(world, pose, request, [p.id], options).ok, true);
  assert.ok(reads >= 4);
});

test('208 exact requests reject foreign IDs, unsupported actions, floors, driving and future generations', () => {
  const {p, world, pose, request} = prepared();
  for (const bad of [{...request, siteId: 'P0000'}, {...request, supportId: 'P0000:0:1'}, {...request, action: '__proto__'}, {...request, action: 'medicalCare'}])
    assert.equal(Services.resolve(world, pose, bad, [p.id], intact).ok, false);
  for (const badPose of [{...pose, active: false}, {...pose, generation: 10}, {...pose, generation: 12}, {...pose, z: 1}, {...pose, car: {driving: true}}, {...pose, x: pose.x + C.CampaignServices208Rules.reach + .01}])
    assert.equal(Services.resolve(world, badPose, request, [p.id], intact).ok, false);
  assert.equal(Services.resolve({...world, generation: 10}, pose, request, [p.id], intact).ok, false);
  const forged = {...request, anchor: {x: pose.x + 100, y: pose.y + 100, z: 0}, supportKind: 'medical'};
  const resolved = Services.resolve(world, pose, forged, [p.id], intact);
  assert.equal(resolved.ok, true);
  assert.equal(resolved.supportKind, 'oven');
  assert.deepEqual(resolved.anchor, {x: pose.x, y: pose.y, z: 0});
});

test('208 walls and neighbouring solids retain authority within the nominal reach', () => {
  const {p, world, plan, details} = prepared(); let witness;
  for (const support of Services.supportsFor(p, plan, details)) {
    for (let dx = -2; dx <= 2 && !witness; dx += .25) for (let dy = -2; dy <= 2 && !witness; dy += .25) {
      if (Math.hypot(dx, dy) > C.CampaignServices208Rules.reach || Math.hypot(dx, dy) < .5) continue;
      const pose = {...poseAt(p, support), x: support.anchor.x + dx, y: support.anchor.y + dy};
      if (!world.blocked(pose.x, pose.y, C.CampaignServices208Rules.actorRadius) && !world.movementLine(pose, support.anchor, 0, p.id, null, C.CampaignServices208Rules.actorRadius)) witness = {pose, support};
    }
    if (witness) break;
  }
  assert.ok(witness, 'A free actor position separated by real geometry is required.');
  assert.equal(Services.resolve(world, witness.pose, requestFor(witness.support), [p.id], intact).ok, false);
});

test('208 transparent pool geometry never substitutes an optical ray for the physical service gesture', () => {
  const real = nativeWorld(); let poolWitness;
  for (const p of real.pois.filter(place => place.campaign205)) {
    const pool = real.detailAt(p, 0).outdoor.find(prop => prop.kind === 'closed-pool');
    if (pool) { poolWitness = {p, pool}; break; }
  }
  assert.ok(poolWitness);
  const {p: poolSite, pool} = poolWitness;
  const a = G.global(poolSite, pool.x + pool.w / 2 - .2, pool.y + pool.h / 2), b = G.global(poolSite, pool.x + pool.w / 2 + .2, pool.y + pool.h / 2);
  assert.equal(real.line(a, b, 0, poolSite.id, null, .05), true);
  assert.equal(real.movementLine(a, b, 0, poolSite.id, null, .05), false);
  const {p, world, pose, request} = prepared(); let physicalReads = 0;
  const blockedGesture = {...world, line: () => true, movementLine: (from, to, z, inside, ignore, radius) => {
    physicalReads++;
    if (ignore === request.supportId) { assert.equal(radius, C.CampaignServices208Rules.actorRadius); return false; }
    return world.movementLine(from, to, z, inside, ignore, radius);
  }};
  assert.equal(Services.resolve(blockedGesture, pose, request, [p.id], intact).ok, false);
  assert.ok(physicalReads >= 2, 'The final own-support gesture must use the physical owner as well as approach movement.');
});

test('208 pure reads and per-world caches preserve actual model ownership and rotated support positions', () => {
  const first = prepared(), p2 = {...first.p, x: 4000, y: 5000, a: Math.PI / 2};
  const secondModel = {...first, p: p2, plan: A.plan(p2), details: A.details(p2)};
  const secondWorld = Audit.modelWorld(secondModel), secondSupport = Services.supportsFor(p2, secondModel.plan, secondModel.details).find(row => row.supportId === first.support.supportId && row.action === first.support.action);
  assert.ok(secondSupport);
  assert.notDeepEqual(secondSupport.anchor, first.support.anchor);
  const discoveries = [first.p.id], before = hash({p: first.p, plan: first.plan, details: first.details, pose: first.pose, discoveries});
  const random = Math.random;
  Math.random = () => assert.fail('A pure service lookup consumed simulation randomness.');
  try {
    for (let i = 0; i < 3; i++) {
      assert.equal(Services.resolve(first.world, first.pose, first.request, discoveries, intact).ok, true);
      const rows = Services.list(secondWorld, poseAt(p2, secondSupport), [p2.id], intact);
      assert.ok(rows.some(row => row.ok && row.supportId === secondSupport.supportId && row.action === secondSupport.action));
    }
  } finally { Math.random = random; }
  assert.equal(hash({p: first.p, plan: first.plan, details: first.details, pose: first.pose, discoveries}), before);
});

for (const seed of [0, 17117, 967313470]) test('208 seeded canonical service poses preserve releasedG11 world' + seed, () => {
  const witness = Audit.auditWorld208(seed), golden = Audit.baseline().worldSeeds.find(row => row.seed === seed);
  assert.equal(witness.pass, true, JSON.stringify(witness.sites.filter(site => !site.pass)));
  assert.equal(witness.geometryUnchanged, true);
  assert.equal(witness.readsPure, true);
  assert.equal(witness.scope, 'canonical-native-poses-not-traversals');
  assert.deepEqual(witness.geometryFingerprint, {poisSha256: golden.poisSha256, roadsSha256: golden.roadsSha256, coverageSha256: golden.coverageSha256});
  for (const site of witness.sites) {
    const original = golden.sites.find(row => row.id === site.siteId);
    assert.deepEqual(site.geometryFingerprint, {planSha256: original.planSha256, detailsSha256: original.detailsSha256});
  }
});
