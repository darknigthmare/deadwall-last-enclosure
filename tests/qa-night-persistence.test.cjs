'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const C = require('../src/core.js');
const N = require('../src/night-gear.js');
const G = require('../src/frontier-geometry.js');
const Save = require('../src/save.js');
const clone = value => JSON.parse(JSON.stringify(value));

function fresh() {
  const env = bootGame();
  N.install(env.game);
  env.game.startNew('standard', '17117');
  return env;
}

function lantern(id, location = 'belt') {
  return { id, kind: 'lantern', location, on: false, used: false, left: C.NightGearRules.types.lantern.duration };
}

function floorFixture(game) {
  game.player.x = 4058; game.player.y = 2048;
  assert.ok(game.frontier.enter());
  const world = game.frontier.world(), poi = world.pois.find(p => p.type === 'duplex');
  let point;
  for (let y = 1; y < poi.h - 1 && !point; y += .5) for (let x = 1; x < poi.w - 1 && !point; x += .5) {
    const q = G.global(poi, x, y);
    if (!world.blocked(q.x, q.y, .32, 1, poi.id)) point = q;
  }
  assert.ok(point, 'une position praticable à l’étage existe');
  const data = game.serialize();
  Object.assign(data.frontier, point, { z: 1, inside: poi.id, seen: [poi.id] });
  for (let i = 0; i < 1 + G.hash(data.worldSeed, poi.id, 'threat') % 4; i++) data.frontier.enemies[poi.id + ':e' + i] = 0;
  data.frontier.kills = Object.values(data.frontier.enemies).filter(h => h === 0).length;
  data.nightGear = { version: 1, serial: 2, devices: [{ ...lantern(1, 'placed'), ...point, domain: 'region', z: 1, inside: poi.id, angle: 0, left: 217.25, used: true, on: true }] };
  game.restoreSave(data);
  return { poi, point };
}

test('QA nuits : objets perdus lors de morts successives restent tous sauvegardables', () => {
  const { game } = fresh(), data = game.serialize();
  const oldDrops = C.NightGearRules.maxPlaced + C.NightGearRules.beltMax;
  const devices = Array.from({ length: oldDrops }, (_, i) => ({ ...lantern(i + 1, 'placed'), domain: 'local', x: 2250 + i % 8 * 35, y: 2300 + Math.floor(i / 8) * 35, z: 0, inside: null, angle: 0 }));
  for (let i = 0; i < C.NightGearRules.beltMax; i++) devices.push(lantern(devices.length + 1));
  data.nightGear = { version: 1, serial: devices.length + 1, devices };
  game.restoreSave(data);
  game.damagePlayer(1000);
  assert.equal(game.player.dead, true);
  game.nightGear.step(.04);
  const dropped = game.nightGear.snapshot();
  assert.equal(dropped.devices.length, oldDrops + C.NightGearRules.beltMax);
  assert.ok(dropped.devices.every(d => d.location === 'placed'));
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.deepEqual(game.nightGear.snapshot(), dropped);
});

test('QA nuits : étage, autonomie et position persistent ; récupération ne traverse pas les niveaux', () => {
  const { game } = fresh(), { poi, point } = floorFixture(game);
  const expected = clone(game.nightGear.snapshot());
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.deepEqual(game.nightGear.snapshot(), expected);
  assert.equal(game.nightGear.lights('local').filter(l => l.kind === 'lantern').length, 0);
  assert.ok(game.nightGear.lights('region').some(l => l.kind === 'lantern' && l.z === 1 && l.inside === poi.id && l.x === point.x));
  const ground = game.serialize(); ground.frontier.z = 0;
  game.restoreSave(ground);
  assert.equal(game.nightGear.pickup(1).ok, false);
  assert.deepEqual(game.nightGear.snapshot(), expected);
});

test('QA nuits : intérieur fictif et coordonnées hors étage refusés avant toute mutation', () => {
  const { game, storage } = fresh();
  floorFixture(game);
  const before = game.serialize(), world = game.world, primary = storage.get(C.SAVE_KEY);
  for (const change of [
    d => { d.z = 0; d.inside = 'P9999'; },
    d => { d.x = 1; d.y = 1; },
    d => { d.z = 2; }
  ]) {
    const bad = clone(before); change(bad.nightGear.devices[0]);
    assert.throws(() => Save.parse(JSON.stringify(bad)), /éclairage nocturne/);
    assert.throws(() => game.restoreSave(bad), /éclairage nocturne/);
    assert.equal(game.world, world);
    assert.deepEqual(game.nightGear.snapshot(), before.nightGear);
    assert.equal(storage.get(C.SAVE_KEY), primary);
  }
});

test('QA nuits : nouvelle partie et fichier historique effacent le matériel sans le recréer', () => {
  const { game } = fresh();
  floorFixture(game);
  const previous = game.serialize();
  game.startNew('standard', '42');
  assert.deepEqual(game.nightGear.snapshot(), N.initial());
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.deepEqual(game.nightGear.snapshot(), N.initial());
  const historical = clone(previous); delete historical.nightGear;
  game.restoreSave(historical);
  assert.deepEqual(game.nightGear.snapshot(), N.initial());
  assert.deepEqual(game.resources, previous.resources);
});
