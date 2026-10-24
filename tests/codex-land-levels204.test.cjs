'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Reference = require('../scripts/codex-world-foundations2026.cjs');
const Physical = require('../src/codex-physical2026.js');
const Furniture = require('../src/codex-furnishings2026.js');
const clone = value => JSON.parse(JSON.stringify(value));

// Two authored floors reuse a real reference annex's room/door dimensions.
// The independent outdoor landing is supported by an explicit raised walkway.
// No runtime campaign, compiler or save fixture is involved.
function site(elevationM = 3.2) {
  const source = clone(Reference.build('EXT-MONDE-T065', 1));
  const building = source.buildings[0];
  const originalRooms = building.rooms;
  const originalPortals = building.portals;
  const upperId = id => id + ':upper';
  building.x = 10; building.y = 10;
  building.heightM = elevationM > 0 ? 6.4 : 3.2;
  building.levels = [0, 1];
  building.rooms = [...originalRooms, ...originalRooms.map(room => ({
    ...clone(room), id: upperId(room.id), level: 1,
    ...(room.slots ? {slots: room.slots.map(slot => ({...clone(slot), id: upperId(slot.id), z: elevationM}))} : {}),
  }))];
  building.portals = [...originalPortals, ...originalPortals.map(portal => ({
    ...clone(portal), id: upperId(portal.id), from: upperId(portal.from),
    to: upperId(portal.to), widthM: 2.4,
  }))];
  const groundCorridor = originalRooms.find(room => room.kind === 'circulation' || room.name === 'circulation');
  const plan = {
    id: 'land-levels204-fixture', type: 'EXT-MONDE-T065', number: 1,
    version: 1, units: 'm', scope: 'author-metric-layout-not-live-world', playable: false,
    bounds: {x: 0, y: 0, w: 40, h: 40}, maxHeightM: building.heightM,
    heightOrigin: 'author-design', buildings: [building], structures: [], reservedAreas: [],
    levels: [
      {id: 'ground', index: 0, elevationM: 0, clearHeightM: 2.8},
      {id: 'upper', index: 1, elevationM, clearHeightM: 2.8},
    ],
    surfaceAreas: [{id: 'upper-walkway', kind: 'raised-walkway', x: 28.5, y: 8.5,
      w: 3, h: 11, level: 1, walkable: true}],
    network: {
      nodes: [
        {id: 'gate', x: 17, y: 0, z: 0, level: 0},
        {id: 'entry', x: 17, y: 10, z: 0, level: 0},
        {id: 'stairs-ground', x: 17, y: 13, z: 0, level: 0, roomId: groundCorridor.id},
        {id: 'stairs-upper', x: 17, y: 13, z: elevationM, level: 1, roomId: upperId(groundCorridor.id)},
        {id: 'junction', x: 30, y: 5, z: 0, level: 0},
        {id: 'walkway-ground', x: 30, y: 10, z: 0, level: 0},
        {id: 'walkway-upper', x: 30, y: 10, z: elevationM, level: 1},
        {id: 'walkway-end', x: 30, y: 18, z: elevationM, level: 1},
      ],
      edges: [
        ['gate-entry', 'gate', 'entry', 0],
        ['entry-stairs', 'entry', 'stairs-ground', 0],
        ['gate-junction', 'gate', 'junction', 0],
        ['junction-walkway', 'junction', 'walkway-ground', 0],
        ['walkway-path', 'walkway-upper', 'walkway-end', 1],
      ].map(([id, from, to, level]) => ({id, from, to, level, mode: 'pedestrian', widthM: 1.2})),
      transitions: [
        {id: 'indoor-stairs', from: 'stairs-ground', to: 'stairs-upper', kind: 'stairs', widthM: 1.2},
        {id: 'walkway-stairs', from: 'walkway-ground', to: 'walkway-upper', kind: 'stairs', widthM: 1.2},
      ],
      externalPorts: [{node: 'gate', requires: 'pedestrian-access', connectedToWorld: false}],
    },
  };
  return plan;
}

function rejected(plan, sourceError, physicalError) {
  const result = Reference.audit(plan);
  assert.equal(result.ok, false, 'Author audit must reject malformed levels');
  assert.ok(result.errors.includes(sourceError), JSON.stringify(result.errors));
  assert.throws(() => Physical.build(plan), physicalError);
}

test('a two-level land site has a connected, immutable physical inspection and reversible stairs', () => {
  const author = site(), before = clone(author);
  assert.equal(Reference.audit(author).ok, true, JSON.stringify(Reference.audit(author).errors));
  const scene = Physical.build(author);
  assert.equal(Physical.audit(scene).ok, true, JSON.stringify(Physical.audit(scene).errors));
  assert.equal(scene.levels.length, 2);
  assert.equal(scene.transitions.length, 2);
  assert.equal(scene.playable, false);
  assert.equal(scene.entry.connectedToWorld, false);
  assert.ok(Object.isFrozen(scene));
  const approach = Physical.move(scene, scene.entry, 0, 13 - scene.entry.y);
  assert.equal(approach.blocked, false);
  assert.ok(Math.abs(approach.pose.y - 13) < 1e-8);
  const up = Physical.transition(scene, approach.pose, 'indoor-stairs');
  assert.equal(up.ok, true);
  assert.deepEqual(up.pose, {...approach.pose, x: 17, y: 13, level: 1});
  const along = Physical.move(scene, up.pose, 0, 2);
  assert.equal(along.blocked, false);
  assert.equal(along.pose.level, 1);
  const returned = Physical.move(scene, along.pose, 0, -2);
  const down = Physical.transition(scene, returned.pose, 'indoor-stairs');
  assert.equal(down.ok, true);
  assert.equal(down.pose.level, 0);
  assert.equal(down.pose.x, 17); assert.equal(down.pose.y, 13);
  assert.deepEqual(author, before);
});

test('matching XY doors use the correct floor, including different opening widths', () => {
  const author = site(), scene = Physical.build(author);
  const lowerDoor = scene.portals[0], upperDoor = scene.portals.find(portal => portal.id === lowerDoor.id + ':upper');
  assert.equal(lowerDoor.level, 0); assert.equal(upperDoor.level, 1);
  assert.equal(lowerDoor.widthM, 1.2); assert.equal(upperDoor.widthM, 2.4);
  const a = {x: 17, y: lowerDoor.y + .8}, b = {x: 13, y: lowerDoor.y + .8};
  assert.equal(Physical.segmentClear(scene, a, b, 0), false);
  assert.equal(Physical.segmentClear(scene, a, b, 1), true);
  const forged = site();
  forged.buildings[0].portals[4].to = forged.buildings[0].portals[0].to;
  rejected(forged, 'bad-portal', /Porte physique invalide/);
});

test('an offset door keeps jamb collisions strict and reaches its furnished room through an interior turn on each floor', () => {
  const author = site(), legacy = Physical.build(author);
  // Centred legacy doors retain their original two nodes and direct room link.
  assert.equal(legacy.nodes.length, 26); assert.equal(legacy.edges.length, 26);
  assert.equal(legacy.nodes.some(node => node.id.endsWith(':inside-turn')), false);
  for (const door of legacy.portals) {
    assert.deepEqual(legacy.edges.find(edge => edge.id === door.id + ':room-link'), {
      id: door.id + ':room-link', from: door.id + ':approach', to: door.to + ':center',
      kind: 'walk', widthM: door.widthM, modes: ['pedestrian'],
    });
  }
  const building = author.buildings[0], lowerId = building.portals[0].id;
  const doorIds = [lowerId, lowerId + ':upper'];
  for (const id of doorIds) {
    const door = building.portals.find(portal => portal.id === id);
    const room = building.rooms.find(room => room.id === door.to);
    // A valid 90 cm opening offset by 20% of the room height reproduces the
    // jamb obstruction without enlarging the opening or reducing actor radius.
    door.y = room.y + .3 * room.h; door.widthM = .9;
  }
  const before = clone(author), sourceAudit = Reference.audit(author);
  assert.equal(sourceAudit.ok, true, JSON.stringify(sourceAudit.errors));
  const scene = Physical.build(author), furniture = Furniture.build(author);
  assert.equal(Physical.audit(scene).ok, true, JSON.stringify(Physical.audit(scene).errors));
  assert.equal(Furniture.audit(author, furniture).ok, true);
  const furnished = Physical.withProps(scene, furniture.props);
  assert.equal(Physical.audit(furnished).ok, true);
  let pose = {...furnished.entry};
  const walkTo = target => {
    const movement = Physical.move(furnished, pose, target.x - pose.x, target.y - pose.y);
    assert.equal(movement.ok, true); assert.equal(movement.blocked, false);
    assert.ok(Math.hypot(movement.pose.x - target.x, movement.pose.y - target.y) < 1e-8);
    assert.equal(movement.pose.level, target.level); pose = movement.pose;
  };
  for (const id of doorIds) {
    const door = scene.portals.find(portal => portal.id === id);
    const approach = scene.nodes.find(node => node.id === id + ':approach');
    const centre = scene.nodes.find(node => node.id === door.to + ':center');
    const turn = scene.nodes.find(node => node.id === id + ':inside-turn');
    assert.deepEqual(turn, {id: id + ':inside-turn', x: centre.x, y: door.y, level: door.level});
    assert.equal(Physical.segmentClear(scene, approach, centre, door.level), false,
      'The direct diagonal must still collide with the jamb at the normal actor radius');
    // An explicitly false graph link remains rejected by the independent
    // physical audit; the valid authored source itself needs no weakened guard.
    const diagonalGraph = clone(scene);
    diagonalGraph.edges.find(edge => edge.id === id + ':room-link').to = centre.id;
    const rejectedDiagonal = Physical.audit(diagonalGraph);
    assert.equal(rejectedDiagonal.ok, false);
    assert.ok(rejectedDiagonal.errors.some(error => error.code === 'edge-not-traversable' && error.id === id + ':room-link'));
    assert.equal(scene.edges.find(edge => edge.id === id + ':room-link').to, turn.id);
    assert.deepEqual(scene.edges.find(edge => edge.id === id + ':room-center-link'), {
      id: id + ':room-center-link', from: turn.id, to: centre.id,
      kind: 'walk', widthM: door.widthM, modes: ['pedestrian'],
    });
    const props = furniture.props.filter(prop => prop.roomId === door.to);
    assert.ok(props.length > 0, 'The offset room must actually remain furnished');
    assert.ok(props.every(prop => prop.level === door.level && prop.elevationM === author.levels[door.level].elevationM));
    walkTo(approach); walkTo(turn); walkTo(centre);
    walkTo(turn); walkTo(approach);
    walkTo({x: 17, y: 13, level: door.level});
    const stair = Physical.transition(furnished, pose, 'indoor-stairs');
    assert.equal(stair.ok, true); pose = stair.pose;
  }
  assert.equal(pose.level, 0);
  assert.deepEqual(author, before);
});

test('furniture keeps its room floor and elevation without duplicated ground-floor colliders', () => {
  const author = site(), result = Furniture.build(author), scene = Physical.build(author);
  assert.equal(Furniture.audit(author, result).ok, true);
  assert.equal(result.summary.rooms, 8);
  assert.equal(result.summary.unknownUses, 0);
  assert.ok(result.props.some(prop => prop.level === 0));
  assert.ok(result.props.some(prop => prop.level === 1));
  for (const prop of result.props) {
    const room = scene.rooms.find(room => room.id === prop.roomId);
    assert.equal(prop.level, room.level);
    assert.equal(prop.elevationM, author.levels[prop.level].elevationM);
    assert.equal(prop.lootAssigned, false); assert.equal(prop.utilityConnected, false);
  }
  const furnished = Physical.withProps(scene, result.props);
  assert.equal(Physical.audit(furnished).ok, true);
  const forged = clone(result);
  forged.props.find(prop => prop.level === 1).level = 0;
  assert.ok(Furniture.audit(author, forged).errors.includes('level'));
  assert.throws(() => Physical.withProps(scene, forged.props), /sans niveau/);
});

test('raised walkways have their own supports and never turn the whole parcel into an upper floor', () => {
  const scene = Physical.build(site());
  assert.equal(Physical.blocked(scene, 25, 25, 0), false);
  assert.equal(Physical.blocked(scene, 25, 25, 1), true);
  assert.equal(Physical.blocked(scene, 30, 15, 1), false);
  const step = Physical.move(scene, {x: 30, y: 15, level: 1}, 3, 0);
  assert.equal(step.ok, true); assert.equal(step.blocked, true);
  assert.ok(step.moved > 0 && step.moved < 1.2);
  assert.equal(Physical.move(scene, {x: 30, y: 15, level: 0}, 3, 0).blocked, false);
  const missing = site(); missing.surfaceAreas = [];
  const unsupported = Physical.build(missing);
  assert.equal(Physical.audit(unsupported).ok, false);
  const denied = Physical.transition(unsupported, {x: 30, y: 10, level: 0}, 'walkway-stairs');
  assert.equal(denied.ok, false); assert.equal(denied.reason, 'destination-blocked');
});

test('a negative-elevation basement remains a distinct floor reachable only through declared stairs', () => {
  const author = site(-3.2);
  assert.equal(Reference.audit(author).ok, true);
  const scene = Physical.build(author), result = Furniture.build(author);
  assert.equal(Physical.audit(Physical.withProps(scene, result.props)).ok, true);
  assert.ok(result.props.some(prop => prop.level === 1 && prop.elevationM === -3.2));
  const down = Physical.transition(scene, {x: 17, y: 13, level: 0}, 'indoor-stairs');
  assert.equal(down.ok, true); assert.equal(down.pose.level, 1);
  assert.equal(scene.levels[down.pose.level].elevationM, -3.2);
  assert.equal(Physical.transition(scene, down.pose, 'indoor-stairs').pose.level, 0);
});

test('the above-ground upper-room ceiling fits the declared authored building height', () => {
  const author = site();
  author.buildings[0].heightM = 3.2;
  const verdict = Reference.audit(author);
  assert.equal(verdict.ok, false,
    'An upper floor at 3.2 m with 2.8 m clear height cannot fit a 3.2 m building envelope');
});

test('mismatched node elevations, misaligned landings, skipped floors and high external gates are rejected', () => {
  const wrongZ = site(); wrongZ.network.nodes.find(node => node.id === 'stairs-upper').z = 0;
  rejected(wrongZ, 'invalid-node', /réseau de site incohérent/);
  const misaligned = site(); misaligned.network.nodes.find(node => node.id === 'stairs-upper').x += .2;
  rejected(misaligned, 'invalid-transition', /Passage vertical de site invalide/);
  const wrongRoom = site();
  wrongRoom.network.nodes.find(node => node.id === 'stairs-upper').roomId = wrongRoom.network.nodes.find(node => node.id === 'stairs-ground').roomId;
  assert.throws(() => Physical.build(wrongRoom), /Palier hors circulation/);
  const skipped = site();
  skipped.levels.push({id: 'intermediate', index: 2, elevationM: 1.6, clearHeightM: 2.8});
  rejected(skipped, 'invalid-transition', /Passage sautant un niveau/);
  const highGate = site(); highGate.network.externalPorts[0].node = 'stairs-upper';
  rejected(highGate, 'false-external-link', /Raccord extérieur hors surface/);
});

test('duplicate or unbuilt floor declarations and an obstructed corridor cannot qualify as accessible', () => {
  const sameElevation = site(); sameElevation.levels[1].elevationM = 0;
  rejected(sameElevation, 'invalid-levels', /Niveaux de site invalides/);
  assert.throws(() => Furniture.build(sameElevation), /Niveaux de site invalides/);
  const sameId = site(); sameId.levels[1].id = 'ground';
  rejected(sameId, 'invalid-levels', /Niveau physique invalide/);
  const unbuilt = site(); unbuilt.buildings[0].rooms[1].level = 2;
  rejected(unbuilt, 'invalid-room', /Pièce hors niveau du bâtiment/);
  assert.throws(() => Furniture.build(unbuilt), /Pièce sans niveau de site/);
  const blocked = site();
  blocked.structures.push({id: 'corridor-obstruction', kind: 'closed-plant', x: 16, y: 11.5,
    w: 2, h: .8, level: 0, maxHeightM: 1, heightOrigin: 'author-design'});
  assert.equal(Reference.audit(blocked).ok, false);
  const scene = Physical.build(blocked), verdict = Physical.audit(scene);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.errors.some(error => error.code === 'edge-not-traversable'));
  const approach = Physical.move(scene, scene.entry, 0, 13 - scene.entry.y);
  assert.equal(approach.blocked, true);
  assert.ok(approach.pose.y < 11.5);
});
