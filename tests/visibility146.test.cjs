'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { boot127 } = require('./helpers/expansions127.cjs');
const C = require('../src/core.js'), G = require('../src/frontier-geometry.js'), P = require('../src/atlas-projection.js');
const V = require('../src/visibility146.js');
const localEnemy = p => ({ id: 9146, ...p, health: 60, dead: false });
const regionalEnemy = (p, z = 0, poi = null) => ({ id: 'vision146', ...p, hp: 60, z, poi });
const stable = g => { const value = g.serialize(); delete value.timestamp; return JSON.stringify(value); };
function fresh() {
  const { game: g } = boot127(); V.install(g); g.startNew('standard', '903145');
  g.units = []; g.daylight = () => 1; return g;
}
function solePlayer(g) { for (const b of g.world.buildings.values()) b.siegeOffline = true; }
function clearRun(g, metres = 24) {
  const length = metres * C.AtlasRules.unitsPerMetre;
  for (let y = 700; y < 3500; y += 64) for (let x = 700; x < 4000 - length; x += 64) {
    const a = { x, y }, b = { x: x + length, y };
    if (g.friendlyPositionClear({ radius: 13 }, x, y) && g.friendlyPositionClear({ radius: 13 }, b.x, b.y) && g.hostileLineClear(a, b, false)) return { a, b };
  }
  assert.fail('Un rayon réel libre de 24 mètres doit être disponible.');
}
function regionalPose(g, p, z = 0, inside = null) {
  if (!g.frontier.active()) { g.player.x = 4058; g.player.y = 2048; assert.equal(g.frontier.enter(), true); }
  const raw = g.serialize(); Object.assign(raw.frontier, p, { z, inside });
  if (inside) raw.frontier.seen = [...new Set([...raw.frontier.seen, inside])];
  g.restoreSave(raw);
}
function freePair(w, poi, z = 0) {
  for (let y = 1; y < poi.h - 1; y += .7) for (let x = 1; x < poi.w - 2; x += .7) {
    const a = G.global(poi, x, y), b = G.global(poi, x + .8, y);
    if (!w.blocked(a.x, a.y, .32, z, poi.id) && !w.blocked(b.x, b.y, .32, z, poi.id) && w.line(a, b, z, poi.id, null, .015)) return { a, b };
  }
  assert.fail('Deux points proches dans une vraie pièce libre.');
}

test('map visibility: current player range uses physical metres, not camera zoom, and rejects dead/nonfinite contacts', () => {
  const g = fresh(); solePlayer(g); const { a } = clearRun(g); Object.assign(g.player, a);
  const near = localEnemy({ x: a.x + 19 * 32, y: a.y }), far = localEnemy({ x: a.x + 21 * 32, y: a.y });
  assert.equal(g.visibility.canSeeLocal(near), true); assert.equal(g.visibility.canSeeLocal(far), false);
  g.camera.zoom = .2; g.camera.x = far.x; g.camera.y = far.y;
  assert.equal(g.visibility.canSeeLocal(far), false); assert.equal(g.visibility.canSeeLocal(near), true);
  assert.equal(g.visibility.canSeeLocal({ ...near, health: 0 }), false);
  assert.equal(g.visibility.canSeeLocal({ ...near, dead: true }), false);
  assert.equal(g.visibility.canSeeLocal({ ...near, x: NaN }), false);
});

test('map visibility: living workers and soldiers observe their real surroundings, then death removes their vision immediately', () => {
  const g = fresh(); solePlayer(g); g.player.regionAbsent = true; const { a } = clearRun(g);
  const u = { id: 70, kind: 'worker', ...a, health: 100, dead: false }; g.units = [u];
  const close = localEnemy({ x: a.x + 9 * 32, y: a.y }), far = localEnemy({ x: a.x + 15 * 32, y: a.y });
  assert.equal(g.visibility.canSeeLocal(close), true); assert.equal(g.visibility.canSeeLocal(far), false);
  u.kind = 'soldier'; assert.equal(g.visibility.canSeeLocal(far), true);
  const frame = g.visibility.frame(); u.health = 0;
  assert.equal(frame.canSeeLocal(close), false); assert.equal(g.visibility.canSeeLocal(close), false);
  u.health = 100; u.regionAbsent = true; assert.equal(g.visibility.canSeeLocal(close), false);
});

test('map visibility: completed defensive posts see outside their own footprint, while foundations, blacked-out posts and lamps cannot observe', () => {
  const g = fresh(), Building = g.core().constructor; solePlayer(g); g.player.regionAbsent = true;
  const { a } = clearRun(g), b = new Building(g.nextId++, 'watchtower', Math.floor(a.x / 32), Math.floor(a.y / 32), 0, 0); g.world.add(b);
  const enemy = localEnemy({ x: b.x + 18 * 32, y: b.y });
  assert.equal(g.visibility.canSeeLocal(enemy), false); b.progress = 1; b.health = b.maxHealth;
  assert.equal(g.visibility.canSeeLocal(enemy), true, 'Le rayon ne bute pas sur le poste source.');
  for (const flag of ['siegeOffline', 'territoryOffline', 'gridOffline', 'dayOffline']) {
    b[flag] = true; assert.equal(g.visibility.canSeeLocal(enemy), false, flag); b[flag] = false;
  }
  b.dead = true; assert.equal(g.visibility.canSeeLocal(enemy), false);
  const lamp = new Building(g.nextId++, 'streetlight', Math.floor(a.x / 32) + 4, Math.floor(a.y / 32), 0, 1); g.world.add(lamp);
  assert.equal(g.visibility.canSeeLocal(enemy), false, 'Un lampadaire n’est pas un survivant ni un poste de veille.');
});

test('map visibility: real closed and automatic gates occlude contacts, open gates reveal them, and closing invalidates the next paint', () => {
  const g = fresh(), Building = g.core().constructor; solePlayer(g); const { a } = clearRun(g);
  const gate = new Building(g.nextId++, 'gate', Math.floor(a.x / 32) + 4, Math.floor(a.y / 32), 0, 1); g.world.add(gate);
  Object.assign(g.player, { x: gate.left - 40, y: gate.y }); const enemy = localEnemy({ x: gate.right + 40, y: gate.y });
  gate.gateMode = 'closed'; assert.equal(g.visibility.canSeeLocal(enemy), false);
  gate.gateMode = 'auto'; assert.equal(g.visibility.canSeeLocal(enemy), false);
  gate.gateMode = 'open'; assert.equal(g.visibility.canSeeLocal(enemy), true);
  const frame = g.visibility.frame(); gate.gateMode = 'closed'; assert.equal(frame.canSeeLocal(enemy), false);
  gate.dead = true; gate.health = 0; assert.equal(g.visibility.canSeeLocal(enemy), true);
});

test('map visibility: actual thin station walls and furniture in the G4 collision index block a nearby contact', () => {
  const g = fresh(); solePlayer(g); let pair = null;
  for (const wall of g.exploration125.plan.solids.filter(s => s.kind === 'station-wall')) {
    const vertical = wall.w < wall.h, centre = { x: wall.x + wall.w / 2, y: wall.y + wall.h / 2 };
    const a = { x: centre.x - (vertical ? 40 : 0), y: centre.y - (vertical ? 0 : 40) }, b = { x: centre.x + (vertical ? 40 : 0), y: centre.y + (vertical ? 0 : 40) };
    if (g.friendlyPositionClear({ radius: 13 }, a.x, a.y) && g.friendlyPositionClear({ radius: 13 }, b.x, b.y) && !g.hostileLineClear(a, b, false)) { pair = { a, b }; break; }
  }
  assert.ok(pair); Object.assign(g.player, pair.a);
  assert.equal(g.visibility.canSeeLocal(localEnemy(pair.b)), false);
});

test('map visibility: night contracts sight and a powered, aligned physical projector reveals only a reachable lit contact', () => {
  const g = fresh(), Building = g.core().constructor; solePlayer(g); const { a } = clearRun(g);
  Object.assign(g.player, a); g.daylight = () => 0;
  const enemy = localEnemy({ x: a.x + 8 * 32, y: a.y });
  assert.equal(g.visibility.canSeeLocal(enemy), false);
  const b = new Building(g.nextId++, 'searchlight', Math.floor(a.x / 32) - 2, Math.floor(a.y / 32), 0, 1); g.world.add(b); g.nightwatch.invalidate();
  assert.equal(g.visibility.canSeeLocal(enemy), true);
  b.rotation = 2; g.nightwatch.invalidate(); assert.equal(g.visibility.canSeeLocal(enemy), false);
  b.rotation = 0; b.powered = false; g.nightwatch.invalidate(); assert.equal(g.visibility.canSeeLocal(enemy), false);
  assert.equal(g.visibility.canSeeLocal(localEnemy({ x: a.x + 3 * 32, y: a.y })), true, 'La vision ambiante de proximité reste disponible.');
});

test('map visibility: a genuinely illuminated contact beyond an observer’s absolute range remains hidden even in neighboring index cells', () => {
  const g = fresh(), Building = g.core().constructor; solePlayer(g); const { a } = clearRun(g); Object.assign(g.player, a); g.daylight = () => 0;
  const b = new Building(g.nextId++, 'districtSearchlight', Math.floor(a.x / 32) + 16, Math.floor(a.y / 32) - 2, 0, 1); g.world.add(b); g.nightwatch.invalidate();
  const enemy = localEnemy({ x: a.x + 21 * 32, y: a.y });
  assert.equal(g.nightwatch.lit(enemy, g.nightwatch.sources(false)), true, 'Le vrai projecteur éclaire la cible.');
  assert.equal(g.hostileLineClear(g.player, enemy, false), true, 'La ligne du commandant est réellement libre.');
  assert.equal(g.visibility.canSeeLocal(enemy), false, 'Les vingt mètres du commandant sont une borne absolue, même sous éclairage.');
});

test('map visibility: the D-17 garrison projects real local metres into the current regional seed while an absent player does not observe from home', () => {
  const g = fresh(); solePlayer(g); const h = P.home(g), local = { x: 4000, y: 2048 };
  let u = { id: 71, kind: 'soldier', ...local, health: 100, dead: false }; g.units = [u];
  regionalPose(g, { x: h.maxX + 80, y: h.y });
  u = g.units.find(v => v.id === u.id);
  const enemy = regionalEnemy({ x: h.maxX + 5, y: h.y });
  assert.equal(g.player.regionAbsent, true); assert.equal(g.visibility.canSeeRegional(enemy), true);
  const Building = g.core().constructor, gate = new Building(g.nextId++, 'gate', 126, 63, 1, 1); g.world.add(gate);
  gate.gateMode = 'closed'; assert.equal(g.visibility.canSeeRegional(enemy), false, 'La projection conserve la vraie porte D-17 traversée par ce rayon.');
  gate.gateMode = 'open'; assert.equal(g.visibility.canSeeRegional(enemy), true);
  u.health = 0; assert.equal(g.visibility.canSeeRegional(enemy), false);
  assert.equal(g.visibility.canSeeLocal(localEnemy(local)), false);
});

test('map visibility: actual regional walls and a closed roof occlude outside observers even through a physically open entrance', () => {
  const g = fresh(); solePlayer(g); g.player.x = 4058; g.player.y = 2048; assert.ok(g.frontier.enter());
  const w = g.frontier.world(); let wallPair = null, doorPair = null;
  for (const poi of w.pois) {
    for (const wall of w.plan(poi, 0).walls) {
      const vertical = wall.w < wall.h, c = { x: wall.x + wall.w / 2, y: wall.y + wall.h / 2 };
      const a = G.global(poi, c.x - (vertical ? .8 : 0), c.y - (vertical ? 0 : .8)), b = G.global(poi, c.x + (vertical ? .8 : 0), c.y + (vertical ? 0 : .8));
      if (!wallPair && !w.blocked(a.x, a.y, .32, 0, null) && !w.blocked(b.x, b.y, .32, 0, null) && !w.line(a, b, 0, null, null, .015)) wallPair = { a, b, poi };
    }
    if (poi.type === 'ruin') continue;
    const a = G.global(poi, poi.w / 2, -.8), b = G.global(poi, poi.w / 2, .8);
    if (!doorPair && !w.blocked(a.x, a.y, .32) && !w.blocked(b.x, b.y, .32) && w.line(a, b, 0, null, null, .015)) doorPair = { a, b, poi };
    if (wallPair && doorPair) break;
  }
  assert.ok(wallPair); regionalPose(g, wallPair.a); assert.equal(g.visibility.canSeeRegional(regionalEnemy(wallPair.b, 0, wallPair.poi.id)), false);
  assert.ok(doorPair); regionalPose(g, doorPair.a); assert.equal(g.visibility.canSeeRegional(regionalEnemy(doorPair.b, 0, doorPair.poi.id)), false, 'Le toit du bâtiment fermé cache son intérieur à la carte.');
  regionalPose(g, doorPair.b, 0, doorPair.poi.id); assert.equal(g.visibility.canSeeRegional(regionalEnemy(doorPair.b, 0, doorPair.poi.id)), true);
});

test('map visibility: floors and POI identities stay separated; real companions observe from their own position and an uninstantiated assignment does not', () => {
  const g = fresh(); solePlayer(g); g.player.x = 4058; g.player.y = 2048; assert.ok(g.frontier.enter());
  const w = g.frontier.world(), poi = w.pois.find(p => p.type === 'duplex'), pair = freePair(w, poi, 1);
  regionalPose(g, pair.a, 1, poi.id);
  assert.equal(g.visibility.canSeeRegional(regionalEnemy(pair.b, 1, poi.id)), true);
  assert.equal(g.visibility.canSeeRegional(regionalEnemy(pair.b, 0, poi.id)), false);
  assert.equal(g.visibility.canSeeRegional(regionalEnemy(pair.b, 1, 'P9999')), false);
  const original = g.worldEvolution, overview = original.overview(); g.player.dead = true; g.player.health = 0;
  // Explicit physical companion fixture; assignment without x/y cannot produce a lookout.
  const c = { id: 'lea', ...pair.a, z: 1, inside: poi.id, health: 100, riding: false };
  g.worldEvolution = { ...original, overview: () => ({ ...overview, companions: [c] }) };
  assert.equal(g.visibility.canSeeRegional(regionalEnemy(pair.b, 1, poi.id)), true);
  c.health = 0; assert.equal(g.visibility.canSeeRegional(regionalEnemy(pair.b, 1, poi.id)), false);
  delete c.x; c.health = 100; assert.equal(g.visibility.canSeeRegional(regionalEnemy(pair.b, 1, poi.id)), false);
});

test('map visibility: the existing rotated annex footprint grants sight only after completion and occludes through other physical foundations', () => {
  const g = fresh(); solePlayer(g); const original = g.worldEvolution, overview = original.overview();
  const d = { ...overview.districts.find(value => value.id === 'east'), level: 1, buildings: [{ type: 'watch', slot: 0, progress: 0 }] };
  g.worldEvolution = { ...original, overview: () => ({ ...overview, companions: [], districts: [d] }) };
  const shape = C.VisibilityRules146.districtGeometry, pose = { ...d.pos, w: 0, h: 0 };
  const enemy = regionalEnemy(G.global(pose, shape.left + shape.width / 2, shape.top + shape.rowStep + shape.height + 1));
  assert.equal(g.visibility.canSeeRegional(enemy), false);
  d.buildings[0].progress = 1; assert.equal(g.visibility.canSeeRegional(enemy), true, 'Le poste source ne masque pas son propre rayon.');
  d.buildings.push({ type: 'depot', slot: shape.columns, progress: 0 });
  assert.equal(g.visibility.canSeeRegional(enemy), false, 'L’emprise de l’autre fondation suit districtBlocked, pas son futur score.');
});

test('map visibility: regional night and directional torch use the existing physical light range and cannot track an enemy behind the player', () => {
  const g = fresh(), h = P.home(g), a = { x: h.maxX + 65, y: h.y }; regionalPose(g, a);
  const w = g.frontier.world(), front = regionalEnemy({ x: a.x + 5, y: a.y }), back = regionalEnemy({ x: a.x - 5, y: a.y });
  assert.ok(w.line(a, front, 0, null, null, .015)); assert.ok(w.line(a, back, 0, null, null, .015));
  g.daylight = () => 0; assert.equal(g.visibility.canSeeRegional(front), false);
  const urban = g.urban; g.urban = { ...urban, lightingState: () => ({ ...urban.lightingState(), flashlight: true }) };
  assert.equal(g.visibility.canSeeRegional(front), true); assert.equal(g.visibility.canSeeRegional(back), false);
  assert.equal(g.visibility.canSeeRegional(regionalEnemy({ x: a.x + 8, y: a.y })), false);
});

test('map visibility: reading maps changes no stock, seed RNG, combat or save state; Continue and a new seed retain no last contact', () => {
  const g = fresh(), { a } = clearRun(g); Object.assign(g.player, a); const enemy = localEnemy({ x: a.x + 40, y: a.y });
  const before = stable(g), frame = g.visibility.frame(); assert.equal(frame.canSeeLocal(enemy), true);
  for (let i = 0; i < 20; i++) frame.canSeeLocal(enemy);
  assert.equal(stable(g), before); assert.equal(g.visibility.snapshot().rememberedContacts, 0);
  g.elapsed += .04; assert.equal(frame.canSeeLocal(enemy), false, 'L’index d’un paint ne survit pas à un pas de simulation.');
  assert.equal(g.visibility.canSeeLocal(enemy), true);
  assert.equal(g.save(false), true); g.returnToMenu(); assert.equal(g.load(), true);
  assert.equal(frame.canSeeLocal(enemy), false, 'Une frame ne survit pas à la restauration.');
  assert.equal(g.visibility.canSeeLocal(enemy), true);
  g.startNew('standard', '17117'); assert.equal(g.visibility.snapshot().rememberedContacts, 0);
  assert.equal(g.visibility.canSeeLocal(enemy), false);
});

test('map visibility: saved regional domains G1 through G7 keep their original version and seed when deriving contacts', () => {
  const g = fresh(), { a } = clearRun(g); Object.assign(g.player, a);
  for (let generation = 1; generation <= 7; generation++) {
    // Explicit compatibility fixture, not a terrain redistribution or a player-facing generation switch.
    const raw = g.serialize(), h = P.home({ worldSeed: raw.worldSeed, generation });
    Object.assign(raw.frontier, { generation, x: h.maxX + 2, y: h.y }); g.restoreSave(raw);
    const before = stable(g); assert.equal(g.visibility.canSeeLocal(localEnemy({ x: a.x + 32, y: a.y })), true);
    assert.equal(stable(g), before); assert.equal(g.serialize().version, 20); assert.equal(g.frontier.position().generation, generation);
    assert.ok(!Object.hasOwn(g.serialize(), 'visibility'));
  }
});

test('map visibility: one paint indexes observers once and rejects hundreds of out-of-range contacts without geometry scans or hidden coordinates in diagnostics', () => {
  let scans = 0, rays = 0;
  const g = { world: { seed: 1234, buildings: { values() { scans++; return []; }, get() { return null; } } },
    player: { x: 2048, y: 2048, health: 100, dead: false }, units: [], daylight: () => 1,
    frontier: { position: () => ({ active: false, generation: 3 }), world: () => { throw Error('Le monde régional distant ne doit pas être demandé.'); } },
    hostileLineClear() { rays++; return true; } };
  V.install(g); const frame = g.visibility.frame();
  for (let i = 0; i < C.PERFORMANCE_LIMITS.zombies; i++) assert.equal(frame.canSeeLocal(localEnemy({ x: 4090, y: 3 + i })), false);
  assert.equal(scans, 1); assert.equal(rays, 0); assert.equal(frame.snapshot().queries, 720);
  assert.equal(frame.snapshot().observerCandidates, 0); assert.equal(frame.snapshot().rays, 0);
  assert.ok(!Object.hasOwn(frame.snapshot(), 'contacts')); assert.ok(!JSON.stringify(frame.snapshot()).includes('9146'));
});
