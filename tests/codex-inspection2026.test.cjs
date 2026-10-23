'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const L = require('../src/codex-layouts2026.js');
const P = require('../src/codex-physical2026.js');
const H = require('../src/codex-furnishings2026.js');
const I = require('../src/codex-inspection2026.js');
const F = require('../scripts/codex-world-foundations2026.cjs');
const M = require('../scripts/codex-maritime2026.cjs');
const Registry = require('../scripts/codex-generators2026.cjs');
const TYPE = 'EXT-MONDE-T008';
const clone = value => JSON.parse(JSON.stringify(value));
const source = name => fs.readFileSync(require.resolve('../src/' + name), 'utf8');
let initial;
const submarine = () => initial || (initial = I.create(TYPE, 1));
const descend = () => I.transition(submarine(), submarine().scene.transitions[0].id).session;
function enterFirstRoom() {
  let session = descend();
  const portal = session.scene.portals[0], room = session.scene.rooms.find(r => r.id === portal.to);
  // Follow the clear corridor to the doorway, in service-sized steps, then enter.
  const dx = (portal.x - session.state.pose.x) / 2;
  for (let i = 0; i < 2; i++) {
    const result = I.move(session, dx, 0);
    assert.equal(result.blocked, false); session = result.session;
  }
  const result = I.move(session, 0, room.y + room.h / 2 - session.state.pose.y);
  assert.equal(result.blocked, false);
  return { session: result.session, room };
}

test('the compiled browser generator reproduces every authoritative author plan exactly', () => {
  const reference = F.refs(), generators = Registry.generators(), types = generators.flatMap(g => g.types);
  assert.deepEqual([...L.types].sort(), [...types].sort());
  let plans = 0;
  for (const type of types) for (let n = 1; n <= 50; n++) {
    const authoritative = generators.find(g => g.types.includes(type)).api;
    assert.deepEqual(L.build(type, n), authoritative.build(type, n, reference), type + '-V' + n);
    plans++;
  }
  assert.equal(plans, types.length * Registry.VARIANTS_PER_TYPE);
  assert.equal(L.count, plans);
  // Collision and furnishing qualification have their own exhaustive suite;
  // this pass compares only the compiler with its source algorithms.
});

test('the catalog distinguishes the produced types from remaining targets and returns independent references', () => {
  assert.equal(L.typologies.length, 80);
  assert.equal(L.typologies.filter(t => t.available).length, 80);
  assert.equal(L.typologies.filter(t => !t.available).length, 0);
  assert.ok(L.typologies.every(t => t.variants === 50));
  assert.equal(L.scope, 'authoring-not-campaign');
  assert.match(L.sourceHash, /^[0-9a-f]{64}$/);
  const original = L.reference(), changed = L.reference();
  changed.metrics[0].value = -1; changed.sources.length = 0;
  assert.deepEqual(L.reference(), original);
  const plan = L.build(TYPE, 1), expected = clone(plan);
  assert.throws(() => { plan.rooms[0].x += 100; }, TypeError);
  assert.deepEqual(L.build(TYPE, 1), expected);
});

test('unavailable typologies and invalid variant numbers never produce substitute sessions', () => {
  for (const type of [...L.typologies.filter(t => !t.available).map(t => t.id), '__proto__', 'constructor', 'EXT-MONDE-T999', null, undefined]) {
    assert.throws(() => I.create(type, 1), /Architecture encore à concevoir/);
  }
  for (const type of ['EXT-MONDE-T065', TYPE]) for (const n of [0, -1, 51, 1.5, NaN, Infinity, '1', null, undefined]) {
    assert.throws(() => I.create(type, n), /variante invalide/);
  }
});

test('an inspection session is deeply immutable and explicitly separate from campaign state', () => {
  const session = submarine();
  assert.equal(session.state.scope, I.SCOPE);
  assert.equal(session.state.planId, session.author.id);
  assert.equal(session.state.sourceHash, L.sourceHash);
  assert.equal(session.author.playable, false);
  assert.equal(session.scene.playable, false);
  assert.equal(session.scene.entry.connectedToWorld, false);
  assert.deepEqual(session.state.pose, { x: session.scene.entry.x, y: session.scene.entry.y, level: session.scene.entry.level });
  for (const value of [session, session.author, session.scene, session.furnishing, session.state, session.state.pose, session.state.visitedRooms, session.scene.walls, session.scene.portals, session.furnishing.props[0], session.limits]) {
    assert.equal(Object.isFrozen(value), true);
  }
  assert.throws(() => { session.state.pose.x++; }, TypeError);
  assert.throws(() => { session.state.visitedRooms.push('forged'); }, TypeError);
  assert.deepEqual(Object.keys(I.snapshot(session)).sort(), ['geometry', 'planId', 'pose', 'scope', 'sourceHash', 'version', 'visitedRooms']);
});

test('movement returns a new state and snapshots cannot modify the live or previous session', () => {
  const start = descend(), before = I.snapshot(start), result = I.move(start, .5, 0);
  assert.equal(result.blocked, false);
  assert.notEqual(result.session, start);
  assert.notEqual(result.session.state, start.state);
  assert.equal(result.session.scene, start.scene);
  assert.equal(result.session.author, start.author);
  assert.equal(result.session.furnishing, start.furnishing);
  assert.ok(Math.abs(result.session.state.pose.x - before.pose.x - .5) < 1e-9);
  assert.equal(result.session.state.pose.level, before.pose.level);
  assert.deepEqual(I.snapshot(start), before);
  const memory = I.snapshot(result.session), expected = I.snapshot(result.session);
  memory.pose.x += 100; memory.visitedRooms.push('external-change');
  assert.deepEqual(I.snapshot(result.session), expected);
  assert.equal(Object.isFrozen(result.session.state.pose), true);
});

test('a partially blocked physical step still advances the inspection pose when result.ok is true', () => {
  const start = submarine(), before = I.snapshot(start);
  const physical = P.move(start.scene, start.state.pose, 2, 0), result = I.move(start, 2, 0);
  assert.equal(physical.ok, true);
  assert.equal(physical.blocked, true);
  assert.ok(physical.moved > 0 && physical.moved < .3);
  assert.equal(result.blocked, true);
  assert.deepEqual(result.session.state.pose, physical.pose);
  assert.ok(result.session.state.pose.x > start.state.pose.x);
  assert.equal(result.session.state.pose.level, start.state.pose.level);
  assert.deepEqual(I.snapshot(start), before);
  assert.equal(P.blocked(start.scene, result.session.state.pose.x, result.session.state.pose.y, result.session.state.pose.level), false);
  for (const [dx, dy] of [[11, 0], [8, 8], [NaN, 0], [0, Infinity], ['1', 0]]) {
    assert.throws(() => I.move(start, dx, dy), /Pas de déplacement invalide/);
  }
});

test('levels change only through a local transition and failed transitions preserve the session', () => {
  const start = submarine(), passage = start.scene.transitions[0];
  assert.equal(passage.kind, 'ladder');
  assert.deepEqual(I.nearTransitions(start).map(t => t.id), [passage.id]);
  const down = I.transition(start, passage.id);
  assert.equal(down.blocked, false);
  assert.deepEqual(down.session.state.pose, passage.a);
  assert.notEqual(down.session.state.pose.level, start.state.pose.level);
  assert.equal(Number.isInteger(down.session.state.pose.level), true);
  assert.equal(I.move(down.session, 0, 0).session.state.pose.level, passage.a.level);
  const away = I.move(down.session, 2, 0).session;
  assert.deepEqual(I.nearTransitions(away), []);
  for (const [session, id] of [[away, passage.id], [start, 'missing-passage']]) {
    const failed = I.transition(session, id);
    assert.equal(failed.blocked, true);
    assert.equal(failed.session, session);
    assert.ok(failed.reason);
  }
  const back = I.transition(down.session, passage.id);
  assert.equal(back.blocked, false);
  assert.deepEqual(back.session.state.pose, start.state.pose);
  assert.equal(start.state.pose.level, passage.b.level);
});

test('entering a real room updates visited history and a restored snapshot is independent', () => {
  const { session, room } = enterFirstRoom();
  assert.deepEqual(session.state.visitedRooms, [room.id]);
  const memory = I.snapshot(session), before = clone(memory), restored = I.restore(TYPE, 1, memory);
  assert.deepEqual(I.snapshot(restored), before);
  assert.notEqual(restored, session);
  assert.notEqual(restored.state.pose, memory.pose);
  assert.equal(Object.isFrozen(restored.state.visitedRooms), true);
  assert.deepEqual(memory, before);
  memory.pose.x += 100; memory.visitedRooms.length = 0;
  assert.deepEqual(I.snapshot(restored), before);
  const missingCurrent = I.snapshot(session); missingCurrent.visitedRooms = [];
  assert.deepEqual(I.restore(TYPE, 1, missingCurrent).state.visitedRooms, [room.id]);
});

test('restore rejects altered identity, version, scope, source, geometry or extra campaign data', () => {
  const base = I.snapshot(submarine());
  const mutations = [
    s => { s.version = 2; }, s => { s.scope = 'campaign'; },
    s => { s.planId = 'EXT-MONDE-T008-V02'; }, s => { s.sourceHash = '0'.repeat(64); },
    s => { s.geometry = '00000000'; }, s => { s.campaign = {}; },
    s => { s.fuel = 100; }, s => { delete s.visitedRooms; }
  ];
  for (const mutate of mutations) {
    const raw = clone(base); mutate(raw);
    assert.throws(() => I.restore(TYPE, 1, raw), /État d’inspection incompatible/);
  }
  for (const raw of [null, [], 'snapshot']) assert.throws(() => I.restore(TYPE, 1, raw), /État d’inspection incompatible/);
  assert.throws(() => I.restore(TYPE, 2, base), /État d’inspection incompatible/);
});

test('restore rejects walls, furniture, unsupported sea, invalid floors and malformed coordinates', () => {
  const session = submarine(), base = I.snapshot(session), wall = session.scene.walls[0], prop = session.furnishing.props[0];
  const poses = [
    { x: wall.x + wall.w / 2, y: wall.y + wall.h / 2, level: wall.level },
    { x: prop.x + prop.w / 2, y: prop.y + prop.h / 2, level: prop.level },
    { ...base.pose, x: base.pose.x + 1 }, { ...base.pose, level: 999 },
    { ...base.pose, level: .5 }, { ...base.pose, x: NaN }, { ...base.pose, y: Infinity },
    { ...base.pose, x: String(base.pose.x) }, { ...base.pose, mode: 'vehicle' },
    Object.assign([], base.pose), null
  ];
  for (const pose of poses) {
    const raw = clone(base); raw.pose = pose;
    assert.throws(() => I.restore(TYPE, 1, raw), /Position d’inspection obstruée ou invalide/);
  }
});

test('restore rejects unknown, duplicated, non-room and sparse history without trusting serialization hooks', () => {
  const session = submarine(), base = I.snapshot(session);
  const room = session.scene.rooms.find(r => r.kind !== 'circulation'), corridor = session.scene.rooms.find(r => r.kind === 'circulation');
  for (const history of [['unknown-room'], [room.id, room.id], [corridor.id], [42], [null], new Array(1), 'rooms', null]) {
    const raw = clone(base); raw.visitedRooms = history;
    assert.throws(() => I.restore(TYPE, 1, raw), /Historique de pièces invalide/);
  }
  const raw = Object.assign(Object.create({ toJSON: () => ({ campaign: 'forged' }) }), clone(base));
  assert.deepEqual(I.snapshot(I.restore(TYPE, 1, raw)), base);
});

test('snapshot compatibility covers floor support, door geometry and entry position independently', () => {
  let revise = null;
  const physical = { ...P, build(author) {
    const scene = clone(P.build(author));
    if (revise) revise(scene);
    return scene;
  } };
  const context = vm.createContext({ DeadwallCodexLayouts2026: L, DeadwallCodexPhysical2026: physical, DeadwallCodexFurnishings2026: H });
  vm.runInContext(source('codex-inspection2026.js'), context);
  const isolated = context.DeadwallCodexInspection2026, memory = I.snapshot(submarine());
  assert.equal(isolated.create(TYPE, 1).state.geometry, memory.geometry);
  for (const mutate of [
    s => { s.surfaces.find(f => f.level === s.entry.level).w += .1; },
    s => { s.portals[0].widthM -= .01; },
    s => { s.entry.x += .05; }
  ]) {
    revise = mutate;
    // withProps validates each revised scene. Rejection must come from the
    // snapshot's stale geometry, not from a physically invalid fixture.
    assert.throws(() => isolated.restore(TYPE, 1, memory), /État d’inspection incompatible/);
  }
});

test('all inspection modules run as browser globals without DOM, storage or campaign access', () => {
  // The game already supplies these read-only furniture footprint catalogues.
  const sandbox = {
    DeadwallFrontierGeometry: require('../src/frontier-geometry.js'),
    DeadwallSeedDetail157: require('../src/seed-detail157.js'),
    DeadwallCore: require('../src/core.js')
  };
  const existing = Object.keys(sandbox);
  for (const key of ['document', 'localStorage', 'game', 'world', 'requestAnimationFrame']) {
    Object.defineProperty(sandbox, key, { get() { throw Error('Unexpected environment access: ' + key); } });
  }
  const context = vm.createContext(sandbox);
  for (const name of ['codex-layouts2026.js', 'codex-physical2026.js', 'codex-furnishings2026.js', 'codex-inspection2026.js']) {
    vm.runInContext(source(name), context, { filename: name });
  }
  const browser = context.DeadwallCodexInspection2026, session = browser.create(TYPE, 1);
  assert.deepEqual(clone(browser.snapshot(session)), I.snapshot(submarine()));
  const descended = browser.transition(session, session.scene.transitions[0].id).session;
  const moved = browser.move(descended, .5, 0);
  assert.equal(moved.blocked, false);
  const memory = browser.snapshot(moved.session), restored = browser.restore(TYPE, 1, memory);
  assert.deepEqual(clone(browser.snapshot(restored)), clone(memory));
  assert.equal(context.require, undefined);
  assert.deepEqual(Object.keys(context).sort(), [...existing, 'DeadwallCodexFurnishings2026', 'DeadwallCodexInspection2026', 'DeadwallCodexLayouts2026', 'DeadwallCodexPhysical2026'].sort());
});
