'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const C = require('../src/core.js'), G = require('../src/frontier-geometry.js');
const A = require('../src/codex-campaign205.js'), S = require('../src/campaign-water-supports214.js');
const copy = value => JSON.parse(JSON.stringify(value));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' differs from ' + b);
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

// Permission tests deliberately control the geometry readers. The separate
// model/world audit receives actual seeded collisions and retains its refusals.
function fixture({id = 'P0001', x = 100, y = 200, a = 0, w = 40, h = 30, bx = 12, by = 9, count = 1} = {}) {
  const source = {version: 1, typology: 'EXT-MONDE-T045', variant: 1, authorPlanId: 'EXT-MONDE-T045-V01'};
  const p = {id, type: 'campaign205-045-01', generation: 11, x, y, a, w, h, name: 'Parc témoin', campaign205: source};
  const objects = Array.from({length: count}, (_, i) => ({id: id + ':205:static:' + (i + 2), kind: 'rain-barrel', name: 'Tonneau de pluie',
    x: bx + i * 2, y: by, w: .7, h: .7, level: 0, z: 0, rotationRad: 0, solid: true, campaign205: true, campaign205Structural: true}));
  const plan = {w, h, z: 0, campaign205: copy(source), static205: objects};
  const details = {campaign205: copy(source), outdoor: objects};
  const world = {generation: 11, pois: [p], plan: () => plan, detailAt: () => details,
    nearPOI: () => [p], blocked: () => false, movementLine: () => true};
  const support = S.supportsFor(p, plan, details)[0];
  const pose = {active: true, generation: 11, ...support.approaches[0].anchor, inside: null, car: null};
  const seen = [id], options = {structureDestroyed: () => false};
  return {p, plan, details, world, support, pose, seen, options, run: () => S.resolve(world, pose, support, seen, options)};
}

test('214 descriptors retain the actual barrel, four metric faces and immutable copied geometry', () => {
  const f = fixture({a: Math.PI / 2}), before = JSON.stringify([f.p, f.plan, f.details]);
  const all = S.supportsFor(f.p, f.plan, f.details), s = all[0], barrel = f.details.outdoor[0];
  assert.equal(all.length, 1, 'The plan/details mirror is not two collectors.');
  assert.equal(s.siteId, f.p.id); assert.equal(s.supportId, barrel.id); assert.equal(s.supportKind, 'rain-barrel');
  assert.deepEqual(s.localRect, {x: barrel.x, y: barrel.y, w: barrel.w, h: barrel.h});
  assert.deepEqual(s.approaches.map(x => x.face), ['south', 'east', 'north', 'west']);
  const center = G.local(f.p, s.center.x, s.center.y);
  close(center.x, barrel.x + barrel.w / 2); close(center.y, barrel.y + barrel.h / 2);
  for (const approach of s.approaches) {
    const anchor = G.local(f.p, approach.anchor.x, approach.anchor.y), target = G.local(f.p, approach.workTarget.x, approach.workTarget.y);
    assert.equal(approach.anchor.z, 0); assert.equal(approach.workTarget.z, 0);
    close(Math.hypot(anchor.x - target.x, anchor.y - target.y), C.CampaignWater214Rules.actorRadius + C.CampaignWater214Rules.approachClearance);
    assert.equal(G.circleRect(anchor.x, anchor.y, C.CampaignWater214Rules.actorRadius, barrel), false);
    assert.ok(Object.isFrozen(approach) && Object.isFrozen(approach.anchor) && Object.isFrozen(approach.workTarget));
  }
  assert.ok(Object.isFrozen(all) && Object.isFrozen(s) && Object.isFrozen(s.localRect) && Object.isFrozen(s.center));
  assert.equal(Object.isFrozen(barrel), false, 'Consulting geometry does not freeze the caller’s source.');
  assert.equal(JSON.stringify([f.p, f.plan, f.details]), before);
  assert.ok(!Object.hasOwn(s, 'water') && !Object.hasOwn(s, 'amount') && !Object.hasOwn(s, 'resource'));
});

test('214 one canonical face remains independent of the caller’s nearest side', () => {
  const f = fixture();
  for (const approach of f.support.approaches) {
    const q = S.resolve(f.world, {...f.pose, ...approach.anchor}, f.support, f.seen, f.options);
    assert.equal(q.ok, true, q.reason); assert.equal(q.face, 'south');
    assert.deepEqual(q.anchor, f.support.approaches[0].anchor);
  }
});

test('214 canonical faces fall back in physical south/east/north/west order on every call', () => {
  const f = fixture(), denied = new Set();
  Object.assign(f.pose, G.global(f.p, 13.25, 10.25));
  f.world.blocked = (x, y) => f.support.approaches.some(a => denied.has(a.face) && Math.hypot(x - a.anchor.x, y - a.anchor.y) < 1e-8);
  for (const face of ['south', 'east', 'north', 'west']) {
    const q = f.run(); assert.equal(q.ok, true, q.reason); assert.equal(q.face, face); denied.add(face);
  }
  assert.equal(f.run().ok, false); denied.clear(); assert.equal(f.run().face, 'south');
});

test('214 physical reads retain actor radius and ignore only the barrel during the work gesture', () => {
  const f = fixture({a: Math.PI / 3}), calls = [];
  f.world.blocked = (x, y, radius, z) => { assert.equal(radius, C.CampaignWater214Rules.actorRadius); assert.equal(z, 0); return false; };
  f.world.movementLine = (a, b, z, inside, ignore, radius) => { calls.push({a, b, ignore}); assert.equal(z, 0); assert.equal(radius, C.CampaignWater214Rules.actorRadius); return true; };
  assert.equal(S.resolve(f.world, f.pose, {...f.support, ignore: 'FOREIGN'}, f.seen, f.options).ok, true);
  assert.equal(calls.length, 2); assert.equal(calls[0].ignore, f.support.supportId); assert.equal(calls[1].ignore, null);
  assert.deepEqual(calls[0].b, f.support.approaches[0].workTarget);
  f.world.movementLine = (a, b, z, inside, ignore) => ignore === f.support.supportId;
  assert.equal(f.run().ok, false, 'A clear gesture does not allow a blocked walking segment.');
  f.world.movementLine = () => false; assert.equal(f.run().ok, false);
  f.world.movementLine = () => true; f.world.blocked = () => true; assert.equal(f.run().ok, false);
});

test('214 discovery, live destruction, foot position, floor and reach remain mandatory', () => {
  const f = fixture(); assert.equal(f.run().ok, true);
  assert.equal(S.resolve(f.world, f.pose, f.support, [], f.options).ok, false);
  assert.equal(S.resolve(f.world, f.pose, f.support, f.seen, {}).ok, false);
  for (const structureDestroyed of [() => true, () => undefined, () => 0]) {
    assert.equal(S.resolve(f.world, f.pose, f.support, f.seen, {structureDestroyed}).ok, false);
  }
  for (const patch of [{active: false}, {generation: 10}, {z: 1}, {z: -1}, {car: {driving: true}}, {x: NaN}, {x: f.pose.x + 20}]) {
    assert.equal(S.resolve(f.world, {...f.pose, ...patch}, f.support, f.seen, f.options).ok, false);
  }
  for (const key of ['blocked', 'movementLine']) {
    const old = f.world[key]; f.world[key] = null; assert.equal(f.run().ok, false); f.world[key] = old;
  }
  f.world.generation = 10; assert.equal(f.run().ok, false);
});

test('214 unsupported identifiers and malformed provenance never create a support', () => {
  const f = fixture();
  for (const id of ['P0001:205:static:02', 'P0001:205:static:-1', 'P0001:205:static:2x', 'P0002:205:static:2', 'P0001:0:2', '__proto__']) {
    assert.equal(S.resolve(f.world, f.pose, {siteId: f.p.id, supportId: id}, f.seen, f.options).ok, false, id);
  }
  const changes = [
    f => { f.p.generation = 10; }, f => { f.p.type = 'campaign205-046-01'; }, f => { f.p.campaign205.version = 2; },
    f => { f.plan.campaign205.variant = 2; }, f => { f.details.campaign205.authorPlanId = 'EXT-MONDE-T045-V02'; },
    f => { f.plan.w++; }, f => { f.plan.z = 1; }, f => { f.p.a = NaN; },
    f => { f.details.outdoor[0].kind = 'crate'; }, f => { f.details.outdoor[0].campaign205 = false; },
    f => { f.details.outdoor[0].campaign205Structural = false; }, f => { f.details.outdoor[0].solid = false; },
    f => { f.details.outdoor[0].z = 1; }, f => { f.details.outdoor[0].level = 1; },
    f => { f.details.outdoor[0].rotationRad = Math.PI / 4; }, f => { f.details.outdoor[0].w = 0; },
    f => { f.details.outdoor[0].x = -1; }, f => { f.details.outdoor[0].y = f.p.h; }
  ];
  for (const change of changes) { const x = fixture(); change(x); assert.deepEqual(S.supportsFor(x.p, x.plan, x.details), []); }
  for (const value of [null, undefined, {}, []]) assert.deepEqual(S.supportsFor(value, null, null), []);
});

test('214 conflicting duplicate static records fail closed rather than selecting an arbitrary copy', () => {
  const f = fixture(); f.details.outdoor = copy(f.details.outdoor);
  assert.equal(S.supportsFor(f.p, f.plan, f.details).length, 1);
  f.details.outdoor[0].x += .1; assert.deepEqual(S.supportsFor(f.p, f.plan, f.details), []);
  f.details.outdoor = copy(f.plan.static205); f.details.outdoor[0].kind = 'crate';
  assert.deepEqual(S.supportsFor(f.p, f.plan, f.details), []);
});

test('214 a collector must exist identically in both the plan and detail static sources', () => {
  const f = fixture();
  assert.deepEqual(S.supportsFor(f.p, {...f.plan, static205: []}, f.details), []);
  assert.deepEqual(S.supportsFor(f.p, f.plan, {...f.details, outdoor: []}), []);
  assert.deepEqual(S.supportsFor(f.p, {...f.plan, static205: [f.plan.static205[0], f.plan.static205[0]]}, {...f.details, outdoor: []}), []);
  assert.equal(S.supportsFor(f.p, f.plan, {...f.details, outdoor: copy(f.details.outdoor)}).length, 1);
});

test('214 hidden sites do not trigger geometry reads or acquire discoveries', () => {
  const f = fixture(), seen = [], before = JSON.stringify(seen);
  f.world.plan = () => assert.fail('Undiscovered geometry was read.');
  assert.deepEqual(S.list(f.world, f.pose, seen, f.options), []);
  assert.equal(S.resolve(f.world, f.pose, f.support, seen, f.options).ok, false);
  assert.equal(JSON.stringify(seen), before);
});

test('214 list searches the whole compound footprint and bounds sites and action rows', () => {
  const far = fixture({w: 220, h: 220, bx: 195, by: 190});
  assert.ok(Math.hypot(far.pose.x - far.p.x, far.pose.y - far.p.y) > C.CampaignWater214Rules.nearbyRadius);
  assert.ok(S.list(far.world, far.pose, far.seen, far.options).some(x => x.supportId === far.support.supportId));
  const fixtures = Array.from({length: 6}, (_, i) => fixture({id: 'P' + String(i + 1).padStart(4, '0'), count: 10}));
  const f = fixtures[0], sites = fixtures.map(x => x.p), byId = new Map(fixtures.map(x => [x.p.id, x])), calls = new Set();
  const world = {...f.world, pois: sites, nearPOI: () => [...sites, sites[0]],
    plan: p => { calls.add(p.id); return byId.get(p.id).plan; }, detailAt: p => byId.get(p.id).details};
  const rows = S.list(world, f.pose, sites.map(p => p.id), f.options);
  assert.equal(rows.length, C.CampaignWater214Rules.maxActions);
  assert.equal(new Set(rows.map(s => s.supportId)).size, rows.length);
  assert.equal(calls.size, C.CampaignWater214Rules.maxSites);
});

test('214 nearby refusal rows retain identities and the canonical work point respects the search radius', () => {
  const f = fixture();
  for (const [pose, options] of [[f.pose, {structureDestroyed: () => true}], [{...f.pose, z: 1}, f.options],
    [{...f.pose, car: {driving: true}}, f.options], [f.pose, {}]]) {
    const rows = S.list(f.world, pose, f.seen, options);
    assert.equal(rows.length, 1); assert.equal(rows[0].ok, false);
    assert.equal(rows[0].siteId, f.p.id); assert.equal(rows[0].supportId, f.support.supportId);
    assert.ok(Object.isFrozen(rows[0]) && Object.isFrozen(rows[0].localRect));
  }
  const center = G.local(f.p, f.support.center.x, f.support.center.y);
  const nearOtherSide = {...f.pose, ...G.global(f.p, center.x + C.CampaignWater214Rules.nearbyRadius, center.y)};
  assert.deepEqual(S.list(f.world, nearOtherSide, f.seen, f.options), [], 'A nearer east face must not expose a canonical south anchor beyond 35m.');
  const nearby = {...f.pose, ...G.global(f.p, center.x + C.CampaignWater214Rules.nearbyRadius - 1, center.y)};
  assert.equal(S.list(f.world, nearby, f.seen, f.options).length, 1);
});

test('214 caches retain immutable geometry only and re-read permissions and replaced source plans', () => {
  const f = fixture(); freeze(f.plan); freeze(f.details); assert.equal(f.run().ok, true);
  f.options.structureDestroyed = () => true; assert.equal(f.run().ok, false);
  f.options.structureDestroyed = () => false; f.world.blocked = () => true; assert.equal(f.run().ok, false);
  f.world.blocked = () => false; assert.equal(f.run().ok, true);
  f.world.plan = () => freeze({...f.plan, static205: []}); f.world.detailAt = () => freeze({...f.details, outdoor: []});
  assert.equal(f.run().ok, false);
  f.world.plan = () => f.plan; f.world.detailAt = () => f.details; assert.equal(f.run().ok, true);
  assert.equal(S.resolve({...f.world, pois: []}, f.pose, f.support, f.seen, f.options).ok, false);
  const mutable = fixture(); assert.equal(mutable.run().ok, true); mutable.details.outdoor[0].kind = 'crate'; assert.equal(mutable.run().ok, false);
  const shallow = fixture(); Object.freeze(shallow.plan.static205[0]); Object.freeze(shallow.plan.static205);
  Object.freeze(shallow.plan); Object.freeze(shallow.details); assert.equal(shallow.run().ok, true);
  shallow.plan.campaign205.variant = 2; assert.equal(shallow.run().ok, false, 'A frozen wrapper must not hide mutable source provenance.');
});

test('214 a virtual parcel boundary is not invented as a wall around a reachable work point', () => {
  const f = fixture({bx: .15}), local = G.local(f.p, f.pose.x, f.pose.y);
  Object.assign(f.pose, G.global(f.p, -.1, local.y));
  const q = f.run(); assert.equal(q.ok, true, q.reason);
  const selected = G.local(f.p, q.anchor.x, q.anchor.y);
  assert.ok(selected.x >= C.CampaignWater214Rules.actorRadius && selected.y >= C.CampaignWater214Rules.actorRadius);
});

test('214 edge candidates must support the complete actor disc inside the actual parcel', () => {
  const f = fixture({bx: 0, by: 0});
  // South/north have x=.35 and may fit, east has y=.35, while west is outside.
  // A narrower authored barrel has neither side-centre wide enough for north/south.
  f.details.outdoor[0].w = .3;
  const supports = S.supportsFor(f.p, f.plan, f.details), s = supports[0];
  const pose = {...f.pose, ...s.approaches[1].anchor};
  const q = S.resolve(f.world, pose, s, f.seen, f.options);
  assert.equal(q.ok, true, q.reason); assert.equal(q.face, 'east');
});

test('214 actual adapter barrels keep their source indices and geometry on two distinct models', () => {
  for (const [typology, variant] of [['EXT-MONDE-T045', 1], ['EXT-MONDE-T047', 9]]) {
    const type = A.typeFor(typology, variant), p = {...A.preset(type), id: 'P0182', type, x: 500, y: 800, a: Math.PI / 2, generation: 11};
    const plan = A.plan(p, 0), details = A.details(p, 0), before = JSON.stringify([plan, details]);
    const barrels = details.outdoor.filter(o => o.kind === 'rain-barrel'), descriptors = S.supportsFor(p, plan, details);
    assert.ok(barrels.length > 0); assert.equal(descriptors.length, barrels.length);
    for (const s of descriptors) {
      const barrel = barrels.find(o => o.id === s.supportId); assert.ok(barrel);
      assert.deepEqual(s.localRect, {x: barrel.x, y: barrel.y, w: barrel.w, h: barrel.h});
      assert.equal(s.approaches.length, 4);
    }
    assert.equal(JSON.stringify([plan, details]), before);
  }
});

test('214 consultation is pure, deterministic and works with late browser dependencies', () => {
  const f = fixture(), before = JSON.stringify([f.p, f.plan, f.details, f.pose, f.seen]), random = Math.random;
  Math.random = () => assert.fail('A support consultation consumed RNG.');
  try { for (let i = 0; i < 3; i++) { assert.equal(f.run().ok, true); assert.equal(S.list(f.world, f.pose, f.seen, f.options).length, 1); } }
  finally { Math.random = random; }
  assert.equal(JSON.stringify([f.p, f.plan, f.details, f.pose, f.seen]), before);
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/campaign-water-supports214.js'), 'utf8'), context);
  Object.assign(context, {DeadwallCore: C, DeadwallFrontierGeometry: G, DeadwallCodexCampaign205: A});
  assert.deepEqual(copy(context.DeadwallCampaignWaterSupports214.supportsFor(f.p, f.plan, f.details)), copy(S.supportsFor(f.p, f.plan, f.details)));
  const externalLabel = {label: 'Not a canonical site name'};
  const rows = S.supportsFor({...f.p, name: externalLabel}, f.plan, f.details);
  assert.equal(rows[0].siteName, f.p.id); assert.equal(Object.isFrozen(externalLabel), false);
});
