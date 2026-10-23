'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const P = require('../src/codex-physical2026.js');
const M = require('../scripts/codex-maritime2026.cjs');
const F = require('../scripts/codex-world-foundations2026.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const ship = (type = 'EXT-MONDE-T006', number = 1) => P.build(M.build(type, number));
const terrain = (type = 'EXT-MONDE-T065', number = 1) => P.build(F.build(type, number));

test('the 400 historical authored layouts retain physically connected rooms at the player radius', () => {
  let variants = 0, rooms = 0, levels = 0, transitions = 0;
  for (const [lib, types] of [[M, Object.keys(M.PROFILES)], [F, F.TYPES]]) for (const type of types) for (let n = 1; n <= 50; n++) {
    const author = lib.build(type, n), before = JSON.stringify(author), scene = P.build(author), report = P.audit(scene);
    assert.equal(report.ok, true, scene.id + ' ' + JSON.stringify(report.errors.slice(0, 4)));
    assert.equal(JSON.stringify(author), before);
    assert.ok(Object.isFrozen(scene) && Object.isFrozen(scene.walls) && Object.isFrozen(scene.entry));
    assert.equal(scene.playable, false); assert.equal(scene.scope, 'physical-inspection-not-campaign');
    assert.equal(scene.entry.connectedToWorld, false);
    variants++; rooms += report.rooms; levels += report.levels; transitions += report.transitions;
  }
  assert.deepEqual({ variants, rooms, levels, transitions }, { variants: 400, rooms: 12880, levels: 1300, transitions: 900 });
});

test('a door is a real cut through its wall and admits the 0.64 m character', () => {
  for (const scene of [ship(), ship('EXT-MONDE-T008'), terrain()]) {
    const door = scene.portals[0], room = scene.rooms.find(r => r.id === door.to), corridor = scene.rooms.find(r => r.id === door.from);
    const a = door.axis === 'x' ? { x: door.x, y: corridor.y + corridor.h / 2 } : { x: corridor.x + corridor.w / 2, y: door.y };
    const b = { x: room.x + room.w / 2, y: room.y + room.h / 2 };
    assert.equal(P.blocked(scene, door.x, door.y, door.level), false);
    assert.equal(P.segmentClear(scene, a, b, door.level), true);
    const moved = P.move(scene, { ...a, level: door.level }, b.x - a.x, b.y - a.y);
    assert.equal(moved.blocked, false); assert.ok(Math.hypot(moved.pose.x - b.x, moved.pose.y - b.y) < 1e-7);
    const offset = door.widthM / 2 + .25;
    assert.equal(P.blocked(scene, door.x + (door.axis === 'x' ? offset : 0), door.y + (door.axis === 'y' ? offset : 0), door.level), true);
  }
});

test('large and diagonal movements cannot tunnel through compartment walls', () => {
  const scene = ship(), room = scene.rooms.find(r => r.kind === 'compartment');
  const pose = { x: room.x + room.w / 2, y: room.y + room.h / 2, level: room.level };
  const horizontal = P.move(scene, pose, 100, 0);
  assert.equal(horizontal.ok, true); assert.equal(horizontal.blocked, true);
  assert.ok(horizontal.pose.x <= room.x + room.w - P.DEFAULT_RADIUS + 1e-8);
  const diagonal = P.move(scene, pose, 100, -100);
  assert.equal(diagonal.blocked, true); assert.equal(P.blocked(scene, diagonal.pose.x, diagonal.pose.y, diagonal.pose.level), false);
  assert.equal(P.move(scene, pose, 1001, 0).ok, false);
});

test('deck indices remain integers while actual elevations retain keel and waterline datums', () => {
  const author = M.build('EXT-MONDE-T006', 17), scene = P.build(author);
  assert.equal(scene.levels.length, author.levels.length);
  for (let i = 0; i < author.levels.length; i++) {
    assert.equal(scene.levels[i].index, i);
    assert.equal(scene.levels[i].elevationM, author.levels[i].elevationM);
    assert.ok(Number.isInteger(scene.levels[i].index));
  }
  assert.ok(scene.levels.some(l => l.elevationM < 0 && !Number.isInteger(l.elevationM)));
});

test('stairs require the correct landing, a reachable destination and pedestrian mode', () => {
  const scene = ship(), stair = scene.transitions[0], from = { ...stair.a };
  const next = P.transition(scene, from, stair.id);
  assert.equal(next.ok, true); assert.deepEqual(next.pose, stair.b);
  assert.deepEqual(P.transition(scene, next.pose, stair.id).pose, from);
  assert.equal(P.transition(scene, { ...from, x: from.x + 2 }, stair.id).ok, false);
  assert.equal(P.transition(scene, { ...from, mode: 'vehicle' }, stair.id).ok, false);
  assert.equal(P.transition(scene, { ...from, level: 999 }, stair.id).ok, false);
  const blocked = { ...scene, solids: [...scene.solids, { id: 'new-obstacle', x: stair.b.x - .5, y: stair.b.y - .5, w: 1, h: 1, level: stair.to }] };
  assert.equal(P.transition(blocked, from, stair.id).reason, 'destination-blocked');
});

test('the submarine hatch has a supported small landing without granting a walkable sea', () => {
  const scene = ship('EXT-MONDE-T008', 50), pose = scene.entry;
  assert.equal(scene.levels.length, 2); assert.equal(scene.transitions[0].kind, 'ladder');
  assert.equal(P.blocked(scene, pose.x, pose.y, pose.level), false);
  assert.equal(P.blocked(scene, pose.x + 1, pose.y, pose.level), true);
  const moved = P.move(scene, pose, 20, 0);
  assert.equal(moved.blocked, true); assert.ok(moved.pose.x - pose.x < .3);
  assert.equal(P.transition(scene, pose, scene.transitions[0].id).ok, true);
  assert.equal(P.transition(scene, pose, scene.transitions[0].id, .4).reason, 'transition-too-narrow');
});

test('a hull envelope, cargo hold, tank or offshore work deck never supplies an implicit floor', () => {
  for (const type of ['EXT-MONDE-T005', 'EXT-MONDE-T006', 'EXT-MONDE-T011']) {
    const scene = ship(type), closed = scene.reservations[0];
    assert.ok(closed && closed.walkable === false && closed.connected === false);
    for (const l of scene.levels) assert.equal(P.blocked(scene, closed.x + closed.w / 2, closed.y + closed.h / 2, l.index), true);
    for (const l of scene.levels) assert.equal(P.blocked(scene, 1, 1, l.index), true);
  }
});

test('the stadium pitch can be reached through the corner gap while stands remain closed', () => {
  for (const type of ['EXT-MONDE-T065', 'EXT-MONDE-T066']) {
    const scene = terrain(type, 50), field = scene.nodes.find(n => n.id.endsWith(':pitch-centre'));
    assert.ok(field); assert.equal(P.blocked(scene, field.x, field.y, 0), false);
    for (const solid of scene.solids.filter(s => s.kind === 'stand')) assert.equal(P.blocked(scene, solid.x + solid.w / 2, solid.y + solid.h / 2, 0), true);
    const access = scene.edges.filter(e => e.id.includes(':pitch-access-'));
    assert.equal(access.length, 3);
    for (const edge of access) {
      const a = scene.nodes.find(n => n.id === edge.from), b = scene.nodes.find(n => n.id === edge.to);
      const moved = P.move(scene, a, b.x - a.x, b.y - a.y);
      assert.equal(moved.blocked, false); assert.ok(Math.hypot(moved.pose.x - b.x, moved.pose.y - b.y) < 1e-6);
    }
  }
});

test('wind turbine rotor sweep is not a ground collider and service stops do not enter the base', () => {
  const author = F.build('EXT-MONDE-T060', 50), scene = P.build(author);
  for (const tower of author.structures) {
    const node = scene.nodes.find(n => n.id === tower.id);
    assert.equal(node.y, tower.y - .5); assert.equal(P.blocked(scene, node.x, node.y, 0), false);
    assert.equal(P.blocked(scene, tower.x + tower.w / 2, tower.y + tower.h / 2, 0), true);
    assert.equal(P.blocked(scene, tower.x + tower.w + 3, tower.y + tower.h / 2, 0), false);
  }
});

function outdoorFixture(horizontal = false) {
  const bounds = { x: 10, y: 20, w: 20, h: 16 };
  return { id: 'physical-outdoor-fixture', units: 'm', playable: false, scope: 'author-metric-layout-not-live-world',
    bounds, maxHeightM: 2.8, buildings: [], structures: [],
    reservedAreas: [{ id: 'fixture-garden', kind: 'vegetable-garden', x: 12, y: 23, w: 4, h: 4, level: 0,
      origin: 'author-design', lootAssigned: false, utilityConnected: false }],
    outdoorAreas: [{ id: 'fixture-terrace', kind: 'terrace', name: 'Terrasse commune', x: 23, y: 24, w: 4, h: 5,
      level: 0, walkable: true, origin: 'author-design', lootAssigned: false, utilityConnected: false }],
    network: {
      nodes: [
        { id: 'fixture-entry', x: horizontal ? 10 : 20, y: horizontal ? 28 : 20, z: 0 },
        { id: 'fixture-centre', x: 20, y: 28, z: 0 },
        { id: 'fixture-exit', x: horizontal ? 30 : 20, y: horizontal ? 28 : 36, z: 0 }
      ],
      edges: [
        { id: 'fixture-access', from: 'fixture-entry', to: 'fixture-centre', widthM: 1.2, mode: 'pedestrian', level: 0 },
        { id: 'fixture-service', from: 'fixture-centre', to: 'fixture-exit', widthM: 1.2, mode: 'pedestrian', level: 0 }
      ],
      externalPorts: [
        { node: 'fixture-entry', requires: 'local-road', connectedToWorld: false },
        { node: 'fixture-exit', requires: 'service-road', connectedToWorld: false }
      ]
    }
  };
}

for (const horizontal of [false, true]) test('every ' + (horizontal ? 'west/east' : 'north/south') + ' boundary port admits the body without moving author coordinates', () => {
  const author = outdoorFixture(horizontal), before = JSON.stringify(author), scene = P.build(author), report = P.audit(scene);
  assert.equal(report.ok, true, JSON.stringify(report.errors));
  assert.equal(JSON.stringify(author), before);
  const first = scene.nodes.find(n => n.id === 'fixture-entry'), last = scene.nodes.find(n => n.id === 'fixture-exit');
  assert.deepEqual([first.x, first.y, last.x, last.y], horizontal ? [10.5, 28, 29.5, 28] : [20, 20.5, 20, 35.5]);
  for (const source of author.network.externalPorts) {
    const node = scene.nodes.find(n => n.id === source.node), original = author.network.nodes.find(n => n.id === source.node);
    assert.equal(P.blocked(scene, node.x, node.y, node.level), false, source.node);
    const adaptation = scene.adaptations.find(a => a.kind === 'external-port-inside-boundary' && a.node === source.node);
    assert.ok(adaptation, source.node); assert.equal(adaptation.offsetM, .5);
    assert.deepEqual(adaptation.sourcePosition, { x: original.x, y: original.y });
    assert.equal(source.connectedToWorld, false);
  }
  assert.deepEqual([scene.entry.x, scene.entry.y], [first.x, first.y]);
  const moved = P.move(scene, first, last.x - first.x, last.y - first.y);
  assert.equal(moved.ok, true); assert.equal(moved.blocked, false);
  assert.ok(Math.hypot(moved.pose.x - last.x, moved.pose.y - last.y) < 1e-8);
  const returned = P.move(scene, last, first.x - last.x, first.y - last.y);
  assert.equal(returned.blocked, false); assert.ok(Math.hypot(returned.pose.x - first.x, returned.pose.y - first.y) < 1e-8);
});

test('reserved gardens and outdoor terraces remain labelled inspection areas without new resources or colliders', () => {
  const author = outdoorFixture(true), before = JSON.stringify(author), scene = P.build(author), emptyAuthor = clone(author);
  emptyAuthor.reservedAreas = []; emptyAuthor.outdoorAreas = [];
  const emptyScene = P.build(emptyAuthor);
  assert.equal(scene.areas.length, 2); assert.ok(Object.isFrozen(scene.areas) && scene.areas.every(Object.isFrozen));
  for (const source of [...author.reservedAreas, ...author.outdoorAreas]) {
    const area = scene.areas.find(a => a.id === source.id);
    assert.deepEqual(area, { ...source, name: source.name || source.kind, level: 0, inspectionOnly: true });
    assert.equal(area.lootAssigned, false); assert.equal(area.utilityConnected, false);
    for (const quantity of ['amount', 'quantity', 'resources', 'inventory']) assert.equal(Object.hasOwn(area, quantity), false);
  }
  for (const geometry of ['surfaces', 'walls', 'solids', 'nodes', 'edges']) assert.deepEqual(scene[geometry], emptyScene[geometry]);
  assert.equal(Object.hasOwn(scene, 'resources'), false); assert.equal(Object.hasOwn(scene, 'inventory'), false);
  assert.equal(scene.playable, false); assert.equal(P.audit(scene).ok, true);
  assert.equal(P.segmentClear(scene, { x: 21, y: 28 }, { x: 28, y: 28 }, 0), true, 'a walkable terrace does not create an invisible obstacle');
  assert.equal(JSON.stringify(author), before);
});

test('outdoor author rectangles, levels and identifiers are checked across both area collections', () => {
  for (const [label, mutate] of [
    ['not an array', a => { a.outdoorAreas = {}; }],
    ['zero width', a => { a.outdoorAreas[0].w = 0; }],
    ['non-finite height', a => { a.outdoorAreas[0].h = NaN; }],
    ['outside the west bound', a => { a.outdoorAreas[0].x = 9.9; }],
    ['outside the east bound', a => { a.outdoorAreas[0].x = 29.9; }],
    ['wrong ground level', a => { a.outdoorAreas[0].level = 1; }],
    ['missing kind', a => { delete a.outdoorAreas[0].kind; }],
    ['duplicate outdoor ID', a => { a.outdoorAreas.push(clone(a.outdoorAreas[0])); }],
    ['duplicate ID across reserved and outdoor areas', a => { a.outdoorAreas[0].id = a.reservedAreas[0].id; }],
    ['malformed reserved area', a => { a.reservedAreas[0].h = -1; }]
  ]) {
    const author = outdoorFixture(); mutate(author); const before = JSON.stringify(author);
    assert.throws(() => P.build(author), undefined, label); assert.equal(JSON.stringify(author), before, label);
  }
});

test('corrupt scene areas fail audit when bounds, uniqueness, levels or inspection scope are lost', () => {
  const good = P.build(outdoorFixture());
  for (const [label, mutate] of [
    ['negative area', s => { s.areas[0].w = -1; }],
    ['outside area', s => { s.areas[0].y = 19; }],
    ['duplicate area', s => { s.areas.push(clone(s.areas[0])); }],
    ['unknown level', s => { s.areas[0].level = 9; }],
    ['lost inspection-only scope', s => { s.areas[0].inspectionOnly = false; }]
  ]) {
    const scene = clone(good); mutate(scene); const report = P.audit(scene);
    assert.equal(report.ok, false, label); assert.ok(report.errors.some(e => e.code === 'invalid-outdoor-area'), label);
  }
  const badCollection = clone(good); badCollection.areas = {};
  assert.equal(P.audit(badCollection).ok, false);
});

test('support checks catch a one-centimetre unsupported gap between two floors', () => {
  const scene = { bounds: { x: 0, y: 0, w: 10, h: 10 }, levels: [{ index: 0 }], walls: [], solids: [],
    surfaces: [{ x: 0, y: 0, w: 5, h: 10, level: 0 }, { x: 5.01, y: 0, w: 4.99, h: 10, level: 0 }] };
  assert.equal(P.blocked(scene, 4, 5, 0), false); assert.equal(P.blocked(scene, 5, 5, 0), true);
  assert.equal(P.segmentClear(scene, { x: 4, y: 5 }, { x: 6, y: 5 }, 0), false);
  const moved = P.move(scene, { x: 4, y: 5, level: 0 }, 2, 0);
  assert.equal(moved.blocked, true); assert.ok(moved.pose.x < 5);
  const joined = { ...scene, surfaces: [scene.surfaces[0], { x: 5, y: 0, w: 5, h: 10, level: 0 }] };
  assert.equal(P.segmentClear(joined, { x: 4, y: 5 }, { x: 6, y: 5 }, 0), true);
});

test('collision uses round corners instead of an oversized expanded rectangle', () => {
  const scene = { bounds: { x: 0, y: 0, w: 10, h: 10 }, levels: [{ index: 0 }], walls: [],
    surfaces: [{ x: 0, y: 0, w: 10, h: 10, level: 0 }], solids: [{ x: 5, y: 5, w: 1, h: 1, level: 0 }] };
  assert.equal(P.blocked(scene, 4.75, 4.75, 0), false);
  assert.equal(P.blocked(scene, 4.8, 4.8, 0), true);
  assert.equal(P.segmentClear(scene, { x: 4, y: 4.8 }, { x: 6, y: 4.8 }, 0), false);
});

test('invalid source geometry and corrupted scenes fail closed without mutating inputs', () => {
  for (const bad of [null, {}, { playable: true }, { units: 'cm', playable: false }]) assert.throws(() => P.build(bad));
  for (const mutate of [a => { a.rooms[0].x = NaN; }, a => { a.portals[0].widthM = .2; }, a => { a.boarding[0].connectedToWorld = true; }, a => { a.links[0].modes = ['vehicle']; }]) {
    const source = clone(M.build('EXT-MONDE-T006', 1)); mutate(source); assert.throws(() => P.build(source));
  }
  const good = ship();
  for (const mutate of [s => { s.rooms[0].level = 99; }, s => { s.entry.connectedToWorld = true; }, s => { s.portals[0].x += 4; }, s => { s.transitions[0].b.x += 4; }, s => { s.nodes.push({ ...s.nodes[0] }); }]) {
    const scene = clone(good); mutate(scene); assert.equal(P.audit(scene).ok, false);
  }
  for (const args of [[NaN, 1, 0], [1, Infinity, 0], [1, 1, '0'], [1, 1, 0, -1]]) assert.equal(P.blocked(good, ...args), true);
  assert.equal(P.audit(null).ok, false);
});

test('furniture composition preserves immutable geometry and rejects blocked circulation', () => {
  const scene = terrain(), room = scene.rooms.find(r => r.kind === 'compartment');
  const prop = { id: 'test-cabinet', roomId: room.id, kind: 'shelf', x: room.x + .08, y: room.y + .08, w: .5, h: .5, level: room.level, solid: true };
  const before = JSON.stringify(scene), next = P.withProps(scene, [prop]);
  assert.equal(JSON.stringify(scene), before); assert.ok(Object.isFrozen(next) && Object.isFrozen(next.props));
  assert.equal(next.solids.length, scene.solids.length + 1);
  assert.equal(P.blocked(next, prop.x + .25, prop.y + .25, prop.level), true);
  assert.throws(() => P.withProps(scene, [prop, prop]));
  assert.throws(() => P.withProps(scene, [{ ...prop, level: 99 }]));
  assert.throws(() => P.withProps(scene, [{ ...prop, x: room.x + room.w / 2 - .5, y: room.y + room.h / 2 - .5, w: 1, h: 1 }]));
  assert.throws(() => P.withProps(scene, [{ ...prop, access: { x: prop.x, y: prop.y, w: .5, h: .5 } }]));
});

test('the browser build runs without require, fs, document or campaign state', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../src/codex-physical2026.js'), 'utf8'), context);
  assert.equal(typeof context.DeadwallCodexPhysical2026.build, 'function');
  const author = M.build('EXT-MONDE-T008', 12), browser = context.DeadwallCodexPhysical2026.build(author), node = P.build(author);
  assert.equal(JSON.stringify(browser), JSON.stringify(node));
  assert.equal(context.DeadwallCodexPhysical2026.audit(browser).ok, true);
  assert.equal(Object.hasOwn(context, 'DEADWALL'), false);
});
