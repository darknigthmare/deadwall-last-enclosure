'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const T = require('../src/tactics.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() { globalThis.DeadwallTactics = T; const env = bootGame(); env.game.startNew(); return env; }
function raw(type, gx, gy, rotation = 0) { return { type, gx, gy, rotation, progress: 1, health: C.BUILDINGS[type].health, gateMode: 'auto', dead: false }; }
function add(game, type, gx, gy, rotation = 0) {
  const building = new (game.core().constructor)(game.nextId++, type, gx, gy, rotation, 1);
  game.world.add(building); return building;
}
function ring(left = 8, right = 20, top = 8, bottom = 20, gateX = 13) {
  const buildings = [];
  for (let x = left; x <= right; x++) {
    if (x < gateX || x > gateX + 1) buildings.push(raw('woodWall', x, top));
    buildings.push(raw('woodWall', x, bottom));
  }
  for (let y = top + 1; y < bottom; y++) buildings.push(raw('woodWall', left, y), raw('woodWall', right, y));
  const gate = raw('gate', gateX, top); buildings.push(gate);
  return { buildings, gate };
}
function barrier(game) {
  game.world.nodes = [];
  for (let y = 0; y < C.WORLD_TILES; y++) if (y !== 64 && y !== 65) add(game, 'woodWall', 70, y);
  return add(game, 'gate', 70, 64, 1);
}

test('portes : matrice des trois modes, état chantier et compatibilité des anciens champs', () => {
  const gate = raw('gate', 5, 5);
  for (const [mode, friendly, hostile] of [['auto', false, true], ['open', false, false], ['closed', true, true]]) {
    gate.gateMode = mode; assert.equal(T.blocksFriendly(gate), friendly); assert.equal(T.blocksEnclosure(gate), hostile);
  }
  delete gate.gateMode; assert.equal(T.gateMode(gate), 'auto'); assert.equal(T.blocksFriendly(gate), false);
  gate.gateMode = 'inconnu'; assert.equal(T.gateMode(gate), 'auto');
  gate.progress = .5; assert.equal(T.blocksEnclosure(gate), false); assert.equal(T.gateChangeAllowed(gate, 'closed'), false);
  gate.progress = 1; gate.dead = true; assert.equal(T.blocksFriendly(gate), false); assert.equal(T.blocksEnclosure(gate), false);
});

test('portes : fermeture occupée vérifiée avec rayons et rotation, sans déplacer les acteurs', () => {
  const gate = raw('gate', 5, 5, 1); gate.gateMode = 'open';
  const actor = { x: 5 * C.TILE - 5, y: 6 * C.TILE, radius: 11, dead: false };
  const before = { ...actor };
  assert.equal(T.gateChangeAllowed(gate, 'closed', [actor]), false);
  assert.equal(T.gateChangeAllowed(gate, 'auto', [actor]), false);
  assert.deepEqual(actor, before); assert.equal(T.isGateOccupied(gate, [actor]), true);
  actor.x -= 20; assert.equal(T.gateChangeAllowed(gate, 'closed', [actor]), true);
  actor.x = 5 * C.TILE + 16; actor.dead = true; assert.equal(T.gateChangeAllowed(gate, 'closed', [actor]), true);
  assert.equal(T.gateChangeAllowed(raw('house', 5, 5), 'closed'), false);
  assert.equal(T.gateChangeAllowed(gate, 'inconnu'), false);
});

test('périmètre : vrai floodfill extérieur, ni score ni simple nombre de segments', () => {
  const core = raw('core', 12, 12), { buildings, gate } = ring(); buildings.push(core);
  const analyze = () => T.analyzeEnclosure({ buildings, width: 32, height: 32 });
  const closed = analyze(); assert.equal(closed.enclosed, true); assert.equal(closed.coreReachable, false);
  assert.equal(closed.gates, 1); assert.equal(closed.openGates, 0); assert.ok(closed.interiorCells > 16);
  gate.gateMode = 'open'; assert.equal(analyze().enclosed, false); assert.equal(analyze().openGates, 1);
  gate.gateMode = 'closed'; assert.equal(analyze().enclosed, true);
  const missing = buildings.find(building => building.type === 'woodWall' && building.gx === 10 && building.gy === 8); missing.progress = .5; assert.equal(analyze().enclosed, false);
  missing.progress = 1; missing.dead = true; assert.equal(analyze().enclosed, false);
  missing.dead = false; missing.health = 0; assert.equal(analyze().enclosed, false);
  missing.health = C.BUILDINGS.woodWall.health; assert.equal(analyze().enclosed, true);
  const houses = buildings.map(building => building.type === 'woodWall' ? raw('house', building.gx, building.gy) : building);
  assert.equal(T.analyzeEnclosure({ buildings: houses, width: 32, height: 32 }).enclosed, false, 'les bâtiments civils ne forment pas une enceinte');
  assert.equal(T.analyzeEnclosure({ buildings: [core, ...Array.from({ length: 25 }, (_, x) => raw('woodWall', x, 3))], width: 32, height: 32 }).enclosed, false);
});

test('périmètre : poche éloignée et enceintes concentriques ne deviennent pas un faux compteur d’anneaux', () => {
  const distant = ring(2, 10, 2, 10, 4), core = raw('core', 20, 20);
  assert.equal(T.analyzeEnclosure({ buildings: [core, ...distant.buildings], width: 32, height: 32 }).enclosed, false);
  const outer = ring(2, 29, 2, 29, 14), inner = ring(8, 20, 8, 20, 13);
  const buildings = [raw('core', 12, 12), ...outer.buildings, ...inner.buildings]; outer.gate.gateMode = 'open';
  const status = T.analyzeEnclosure({ buildings, width: 32, height: 32 });
  assert.equal(status.enclosed, true, 'l’enceinte intérieure protège encore le centre malgré une porte extérieure ouverte');
  assert.equal(status.openGates, 1); assert.equal(status.gates, 2); assert.equal('rings' in status, false);
  inner.gate.gateMode = 'open'; assert.equal(T.analyzeEnclosure({ buildings, width: 32, height: 32 }).enclosed, false);
  assert.equal(T.analyzeEnclosure({ buildings: [] }).enclosed, false);
  const empty = T.analyzeEnclosure({ buildings: [raw('core', 62, 62)] });
  assert.equal(empty.exteriorCells, C.WORLD_TILES ** 2); assert.equal(empty.interiorCells, 0);
  assert.throws(() => T.analyzeEnclosure({ buildings: [], width: 10000 }), RangeError);
});

test('portes runtime : joueur et ouvrier traversent auto/open, jamais closed', () => {
  for (const mode of T.GATE_MODES) {
    const { game } = fresh(), gate = barrier(game), worker = game.units[0];
    assert.equal(game.setGateMode(mode, gate), true);
    const target = { x: gate.right + 50, y: gate.y };
    game.player.x = gate.left - 45; game.player.y = gate.y;
    for (let step = 0; step < 80; step++) game.moveFriendly(game.player, 2, 0);
    assert.equal(game.player.x > gate.right, mode !== 'closed', `joueur ${mode}`);
    worker.x = gate.left - 45; worker.y = gate.y;
    for (let step = 0; step < 100; step++) { game.elapsed += .05; game.moveUnitToward(worker, target, .05); }
    assert.equal(worker.x > gate.right, mode !== 'closed', `ouvrier ${mode}`);
    assert.equal(Boolean(game.world.solidForFriendly(gate.x, gate.y)), mode === 'closed');
  }
});

test('portes runtime : hordes traversent seulement open, coûts et ligne de vue suivent le mode', () => {
  for (const mode of T.GATE_MODES) {
    const { game } = fresh(), gate = barrier(game); game.units = []; game.player.dead = true;
    assert.equal(game.setGateMode(mode, gate), true); game.flow.rebuild(game.world, game.core());
    assert.equal(game.world.movementCost(gate.gx, gate.gy), mode === 'open' ? 10 : 48);
    assert.equal(game.hasLineOfSight({ x: gate.left - 25, y: gate.y }, { x: gate.right + 25, y: gate.y }), mode === 'open');
    game.spawnZombie('walker'); const zombie = game.zombies[0]; zombie.x = gate.right + 35; zombie.y = C.world(64);
    const originalHealth = gate.health;
    for (let step = 0; step < 90 && zombie.x > gate.left - 15; step++) game.updateZombies(.05);
    assert.equal(zombie.x < gate.left, mode === 'open', `infecté ${mode}`);
    assert.equal(gate.health < originalHealth, mode !== 'open', 'une porte ouverte ne doit pas être attaquée comme un obstacle');
  }
});

test('portes runtime : pause, invalidation des routes, fermeture occupée par chaque camp', () => {
  const { game } = fresh(), gate = barrier(game), originalVersion = game.world.navigationVersion;
  game.togglePause(true); assert.equal(game.setGateMode('open', gate), false); assert.equal(gate.gateMode, 'auto'); game.togglePause(false);
  assert.equal(game.setGateMode('open', gate), true); assert.ok(game.world.navigationVersion > originalVersion); assert.equal(game.world.flowDirty, true); assert.equal(game.flowTimer, 0);
  const actors = [game.player, game.units[0]]; game.spawnZombie('walker'); actors.push(game.zombies[0]);
  for (const actor of actors) {
    const original = { x: actor.x, y: actor.y }; actor.x = gate.x; actor.y = gate.y;
    const version = game.world.navigationVersion;
    assert.equal(game.setGateMode('closed', gate), false); assert.equal(gate.gateMode, 'open'); assert.equal(game.world.navigationVersion, version);
    assert.equal(actor.x, gate.x); assert.equal(actor.y, gate.y); assert.equal(game.setGateMode('auto', gate), false);
    Object.assign(actor, original);
  }
  assert.equal(game.setGateMode('closed', gate), true);
  assert.equal(game.setGateMode('open', game.core()), false); assert.equal(game.setGateMode('inconnu', gate), false);
  gate.progress = .5; assert.equal(game.setGateMode('open', gate), false);
});

test('portes runtime : auto et verrou fermé restent franchissables par les rampes de corps historiques', () => {
  for (const mode of ['auto', 'closed']) {
    const { game } = fresh(), gate = barrier(game); game.units = []; game.player.dead = true; game.setGateMode(mode, gate); gate.corpseLoad = 100;
    game.spawnZombie('runner'); const zombie = game.zombies[0]; zombie.x = gate.right + 18; zombie.y = gate.y; game.flow.direction = () => ({ x: -1, y: 0 });
    for (let step = 0; step < 40; step++) game.updateZombies(.025);
    assert.equal(zombie.x < gate.left, true, 'fermer le passage ne rend pas la porte invulnérable aux corps');
  }
});

test('portes runtime : ordres admis dans la pause tactique, refusés derrière les autres modales', () => {
  const { game } = fresh(), gate = add(game, 'gate', 74, 70);
  game.paused = true; game.activeOverlay = game.ui.commandModal;
  assert.equal(game.setGateMode('open', gate), true, 'le poste de commandement accepte un ordre explicite');
  for (const overlay of [game.ui.pauseMenu, game.ui.helpModal, game.ui.settingsModal, null]) {
    game.activeOverlay = overlay; assert.equal(game.setGateMode('closed', gate), false); assert.equal(gate.gateMode, 'open');
  }
  game.activeOverlay = game.ui.commandModal; game.gameOver = true; assert.equal(game.setGateMode('closed', gate), false);
  game.gameOver = false; game.state = 'menu'; assert.equal(game.setGateMode('closed', gate), false);
});

test('portes runtime : une route mémorisée est abandonnée au verrouillage puis réouverte sans téléportation', () => {
  const { game } = fresh(), gate = barrier(game), worker = game.units[0];
  worker.x = gate.left - 45; worker.y = gate.y; const target = { x: gate.right + 50, y: gate.y };
  game.moveUnitToward(worker, target, .05); const route = worker.navigation; assert.ok(route); assert.equal(route.direct, true);
  assert.equal(game.setGateMode('closed', gate), true); const before = { x: worker.x, y: worker.y };
  game.moveUnitToward(worker, target, .05); assert.notEqual(worker.navigation, route); assert.equal(worker.navigation.cells, null);
  assert.equal(worker.x, before.x); assert.equal(worker.y, before.y);
  assert.equal(game.setGateMode('auto', gate), true);
  for (let step = 0; step < 100; step++) { game.elapsed += .05; game.moveUnitToward(worker, target, .05); }
  assert.ok(worker.x > gate.right);
});

test('périmètre runtime : cache invalidé par mode, chantier, brèche et nouveau monde à version égale', () => {
  const { game } = fresh(); game.world.nodes = []; const enclosure = ring(58, 70, 58, 70, 63);
  let gate;
  for (const item of enclosure.buildings) { const building = add(game, item.type, item.gx, item.gy, item.rotation); if (item.type === 'gate') gate = building; }
  const status = game.getEnclosureStatus(); assert.equal(status.enclosed, true); assert.equal(game.getEnclosureStatus(), status, 'un résultat inchangé réutilise son cache');
  game.setGateMode('open', gate); const opened = game.getEnclosureStatus(); assert.notEqual(opened, status); assert.equal(opened.enclosed, false);
  game.setGateMode('auto', gate); assert.equal(game.getEnclosureStatus().enclosed, true);
  const wall = [...game.world.buildings.values()].find(building => building.type === 'woodWall' && building.gx === 60 && building.gy === 58); game.destroyBuilding(wall); assert.equal(game.getEnclosureStatus().enclosed, false);
  const replacement = add(game, 'woodWall', wall.gx, wall.gy); replacement.progress = .5; assert.equal(game.getEnclosureStatus().enclosed, false);
  game.completeBuilding(replacement); assert.equal(game.getEnclosureStatus().enclosed, true);
  const version = game.world.navigationVersion; game.startNew(); game.world.navigationVersion = version;
  assert.equal(game.getEnclosureStatus().enclosed, false, 'le cache ne survit pas à une nouvelle partie ayant la même version de navigation');
});

test('portes sauvegardées : les trois modes et les sauvegardes sans mode restent compatibles', () => {
  for (const mode of T.GATE_MODES) {
    const { game } = fresh(), gate = add(game, 'gate', 74, 70, 1); assert.equal(game.setGateMode(mode, gate), true);
    assert.equal(game.save(false), true); assert.equal(game.load(), true);
    const restored = game.world.buildings.get(gate.id); assert.equal(restored.gateMode, mode);
    assert.equal(Boolean(game.world.solidForFriendly(restored.x, restored.y)), mode === 'closed');
    const legacy = game.serialize(); delete legacy.buildings.find(building => building.id === gate.id).gateMode;
    game.restoreSave(legacy); assert.equal(game.world.buildings.get(gate.id).gateMode, 'auto');
  }
});

test('chantiers : travail manuel ne solidifie pas un mur autour du commandant', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 72, 64); wall.progress = .999;
  game.player.x = wall.x; game.player.y = wall.y; game.flow.rebuild(game.world, game.core());
  const version = game.world.navigationVersion, position = { x: game.player.x, y: game.player.y }, floaters = game.floaters.length;
  game.input.keys.add('KeyE'); game.updateInteraction(.1); game.input.keys.delete('KeyE');
  assert.equal(wall.completed, false); assert.equal(wall.progress, .999); assert.equal(wall.completionBlocked, true);
  assert.equal(game.world.navigationVersion, version); assert.equal(game.world.flowDirty, false); assert.equal(game.floaters.length, floaters);
  assert.equal(game.player.x, position.x); assert.equal(game.player.y, position.y); assert.equal(game.friendlyPositionClear(game.player, game.player.x, game.player.y), true);
  assert.equal(game.save(false), true, 'le chantier différé reste une sauvegarde valide');
});

test('chantiers : achèvement passif attend une sortie physique puis invalide la navigation une seule fois', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 72, 64); wall.progress = .999;
  game.player.x = wall.x; game.player.y = wall.y; const version = game.world.navigationVersion;
  game.updateBuildings(.1); assert.equal(wall.completed, false); const notifications = game.notifications.length;
  game.updateBuildings(.1); assert.equal(game.notifications.length, notifications, 'pas d’alerte répétée à chaque tentative');
  for (let step = 0; step < 30 && !wall.completed; step++) {
    const before = game.player.x; game.moveFriendly(game.player, 2, 0); assert.equal(game.player.x, before + 2);
    game.updateBuildings(.1);
  }
  assert.equal(wall.completed, true); assert.equal(wall.completionBlocked, false); assert.equal(game.world.navigationVersion, version + 1);
  assert.equal(game.friendlyPositionClear(game.player, game.player.x, game.player.y), true);
});

test('chantiers : chaque camp est protégé selon la future collision de la porte', () => {
  for (const mode of T.GATE_MODES) for (const kind of ['player', 'worker', 'zombie']) {
    const { game } = fresh(), gate = add(game, 'gate', 72, 64, 1); gate.gateMode = mode; gate.progress = .999;
    game.spawnZombie('walker'); const actor = kind === 'player' ? game.player : kind === 'worker' ? game.units[0] : game.zombies[0];
    actor.x = gate.x; actor.y = gate.y; const x = actor.x, y = actor.y, version = game.world.navigationVersion;
    assert.equal(gate.work(1), true, 'l’appelant franchit d’abord le seuil de progression');
    const closingOnActor = mode === 'closed' || (mode === 'auto' && kind === 'zombie');
    assert.equal(game.completeBuilding(gate), !closingOnActor, mode + ':' + kind);
    assert.equal(gate.completed, !closingOnActor); assert.equal(game.world.navigationVersion, version + (closingOnActor ? 0 : 1));
    assert.equal(actor.x, x); assert.equal(actor.y, y);
  }
});

test('chantiers : rayon chevauchant et infecté vivant retardent un mur, les acteurs morts non', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 72, 64), worker = game.units[0]; wall.progress = .999;
  worker.x = wall.left - 5; worker.y = wall.y; wall.work(1); assert.equal(game.completeBuilding(wall), false);
  worker.dead = true; game.spawnZombie('walker'); const zombie = game.zombies[0]; zombie.x = wall.x; zombie.y = wall.y;
  wall.work(1); assert.equal(game.completeBuilding(wall), false); zombie.dead = true;
  wall.work(1); assert.equal(game.completeBuilding(wall), true);
});
