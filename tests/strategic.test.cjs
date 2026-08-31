'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');

function freshGame() {
  const env = bootGame(); env.game.startNew('standard');
  return env;
}
function building(game, type, x, y, rotation = 0) {
  const Building = game.core().constructor;
  const result = new Building(game.nextId++, type, x, y, rotation, 1);
  game.world.add(result);
  return result;
}
function crisis(game, id, targetId = 0) {
  game.activeCrisis = { id, wave: 5, status: 'pending', remaining: 45, targetId, choice: null };
}

test('logistique: un ouvrier remplit son sac avant de revenir, sans perdre sa spécialité', () => {
  const { game } = freshGame(), worker = game.units[0], Node = game.world.nodes[0].constructor;
  const node = new Node(999, 'wood', game.core().x + 320, game.core().y, 50, 20, 0);
  game.world.nodes = [node]; game.units = [worker]; worker.x = node.x; worker.y = node.y;
  worker.state = 'gather'; worker.targetNode = node.id; worker.think = 20;
  for (let step = 0; step < 12; step++) game.updateUnits(.25);
  assert.equal(worker.carry, worker.maxCarry);
  assert.equal(worker.carryType, 'wood');
  assert.ok(Math.abs(node.amount - 40) < 1e-6);
  assert.equal(worker.state, 'return');
});

test('logistique: un dépôt plein conserve le reliquat porté et accepte ensuite seulement la place libérée', () => {
  const { game } = freshGame(), worker = game.units[0]; game.units = [worker];
  worker.x = game.core().x; worker.y = game.core().y; worker.carry = 10; worker.carryType = 'wood'; worker.state = 'return';
  game.resources.wood = game.storage - 1; const before = game.depositedResources;
  game.updateUnits(.1);
  assert.equal(worker.carry, 9); assert.equal(worker.carryType, 'wood'); assert.equal(game.resources.wood, game.storage);
  game.resources.wood -= 5; game.updateUnits(.1);
  assert.equal(worker.carry, 4); assert.equal(game.depositedResources - before, 6);
  assert.equal(worker.state, 'return');
});

test('logistique: les récolteurs disponibles évitent une ressource déjà saturée', () => {
  const { game } = freshGame(), worker = game.units[0], Node = game.world.nodes[0].constructor;
  game.units = [worker]; worker.state = 'idle'; worker.think = 0;
  const full = new Node(901, 'wood', worker.x + 10, worker.y, 50, 20, 0), useful = new Node(902, 'scrap', worker.x + 30, worker.y, 50, 20, 0);
  game.world.nodes = [full, useful]; game.resources.wood = game.storage;
  game.updateUnits(.1);
  assert.equal(worker.targetNode, useful.id); assert.equal(full.amount, 50);
});

test('industrie: les munitions pleines ne consomment pas la ferraille ; une place partielle produit proportionnellement', () => {
  const { game } = freshGame(); game.world.nodes = [];
  building(game, 'ammoFactory', 72, 72); game.refreshMetrics(true);
  game.resources.ammo = game.storage; game.resources.scrap = 100;
  game.economyTick(1); assert.equal(game.resources.scrap, 100);
  game.resources.ammo = game.storage - .09; game.economyTick(1);
  assert.equal(game.resources.ammo, game.storage);
  assert.ok(Math.abs(game.resources.scrap - 99.989) < 1e-6);
});

test('alliés: deux enceintes restent franchissables par leurs portes opposées, puis se ferment sans téléportation', () => {
  const { game } = freshGame(); game.world.nodes = [];
  const ring = (left, right, top, bottom, side) => {
    for (let x = left; x <= right; x++) { building(game, 'woodWall', x, top); building(game, 'woodWall', x, bottom); }
    for (let y = top + 1; y < bottom; y++) for (const x of [left, right]) if (!(x === side && [64, 65].includes(y))) building(game, 'woodWall', x, y);
    return building(game, 'gate', side, 64, 1);
  };
  const outerGate = ring(55, 75, 55, 75, 75); ring(59, 70, 59, 70, 59);
  const worker = game.units[0], target = { x: C.world(78), y: C.world(64) };
  worker.x = C.world(64); worker.y = C.world(64); worker.navigation = null;
  let usedInnerGate = false, usedOuterGate = false;
  for (let step = 0; step < 1600 && C.dist(worker, target) > 18; step++) {
    game.elapsed += .05; game.moveUnitToward(worker, target, .05, 80);
    assert.ok(game.friendlyPositionClear(worker, worker.x, worker.y), 'un allié ne traverse jamais un mur fermé');
    if (C.grid(worker.x) === 59 && [64, 65].includes(C.grid(worker.y))) usedInnerGate = true;
    if (C.grid(worker.x) === 75 && [64, 65].includes(C.grid(worker.y))) usedOuterGate = true;
  }
  assert.ok(C.dist(worker, target) <= 18, 'la cible au-delà des deux enceintes doit être atteinte');
  assert.ok(usedInnerGate && usedOuterGate, 'les deux portes opposées doivent réellement être empruntées');
  game.world.remove(outerGate); building(game, 'woodWall', 75, 64); building(game, 'woodWall', 75, 65);
  worker.x = C.world(64); worker.y = C.world(64);
  game.moveUnitToward(worker, target, .05);
  assert.equal(worker.x, C.world(64)); assert.equal(worker.y, C.world(64));
  assert.equal(worker.navigation.cells, null, 'un itinéraire obsolète doit être invalidé après fermeture');
});

test('hordes: la vague 1000 conserve sa composition avec une file mémoire et sauvegarde bornées', () => {
  const { game } = freshGame(); game.wave = 1000; game.signature = 1000; game.prepareWave(); game.startAssault();
  assert.ok(game.wavePlan.total > 100000);
  assert.equal(game.remainingAssault, game.wavePlan.total);
  assert.ok(game.spawnQueue.length <= C.STRATEGY_RULES.spawnBatch);
  assert.ok(JSON.stringify({ queue: game.spawnQueue, counts: game.pendingSpawns }).length < 1500);
  game.phase = 'assault'; game.updateDirector(.5);
  assert.equal(game.remainingAssault, game.wavePlan.total);
  const save = game.serialize();
  assert.equal(C.spawnCount(C.normalizeSpawnCounts(save.pendingSpawns, save.spawnQueue)) + save.zombies.length, game.wavePlan.total);
  game.wave = 9; game.prepareWave(); game.startAssault();
  const actual = C.normalizeSpawnCounts();
  while (game.spawnQueue.length || C.spawnCount(game.pendingSpawns)) { game.refillSpawnQueue(); actual[game.spawnQueue.pop()]++; }
  assert.deepEqual(actual, game.wavePlan.composition);
});

test('crises: le choix coûte exactement son prix, respecte logements/réserves et ne peut être appliqué deux fois', () => {
  const { game } = freshGame(); crisis(game, 'injury');
  const before = { medicine: game.resources.medicine, food: game.resources.food, workers: game.units.length };
  assert.equal(game.resolveCrisis('A'), true);
  assert.equal(game.resources.medicine, before.medicine - 6); assert.equal(game.resources.food, before.food - 12);
  assert.equal(game.units.length, before.workers + 1); assert.equal(game.resolveCrisis('A'), false);
  crisis(game, 'injury'); game.housing = game.population;
  const resources = { ...game.resources }; assert.equal(game.resolveCrisis('A'), false); assert.deepEqual(game.resources, resources);
  crisis(game, 'ammo'); game.resources.fuel = 0;
  assert.equal(game.resolveCrisis('A'), false); assert.equal(game.activeCrisis.status, 'pending');
});

test('crises: délai, délestage temporaire et pression des corps ont des conséquences réellement simulées', () => {
  const { game } = freshGame(); game.world.nodes = [];
  building(game, 'scrapyard', 72, 72); game.refreshMetrics(true); game.resources.scrap = 100;
  crisis(game, 'blackout'); assert.equal(game.resolveCrisis('B'), true);
  game.economyTick(1); assert.ok(Math.abs(game.resources.scrap - 100.18) < 1e-6);
  game.updateCrisis(60); assert.equal(game.activeCrisis, null);
  game.economyTick(1); assert.ok(Math.abs(game.resources.scrap - 100.54) < 1e-6);
  crisis(game, 'ammo'); const ammo = game.resources.ammo; game.updateCrisis(45);
  assert.equal(game.resources.ammo, ammo - 18); assert.equal(game.activeCrisis, null);
  const wall = building(game, 'woodWall', 70, 70); wall.corpseLoad = 25; const health = wall.health;
  crisis(game, 'breach', wall.id); game.resolveCrisis('B');
  assert.equal(wall.corpseLoad, 7); assert.ok(Math.abs(wall.health - (health - wall.maxHealth * .12)) < 1e-6);
});

test('construction: perdre le palier interdit un ancien outil de tracé encore sélectionné', () => {
  const { game } = freshGame(); game.world.nodes = []; game.resources.scrap = 200; game.resources.stone = 200;
  const before = { ...game.resources }, count = game.world.buildings.size;
  game.placeWallLine('concreteWall', [{ x: 70, y: 70 }, { x: 72, y: 70 }]);
  assert.deepEqual(game.resources, before); assert.equal(game.world.buildings.size, count);
});

test('reprise stratégique: horde compacte, délai de crise et récolte partielle survivent à une sauvegarde validée', () => {
  const { game, storage } = freshGame();
  game.wave = 1000; game.signature = 1000; game.prepareWave(); game.startAssault(); game.phase = 'assault';
  crisis(game, 'ammo'); game.activeCrisis.remaining = 23;
  const worker = game.units[0], node = game.world.nodes[0];
  worker.carry = 3; worker.carryType = node.type; worker.state = 'gather'; worker.targetNode = node.id;
  const total = game.remainingAssault; game.save(false);
  const raw = JSON.parse(storage.get(C.SAVE_KEY));
  assert.ok(raw.spawnQueue.length <= 64); assert.equal(raw.activeCrisis.remaining, 23);
  game.activeCrisis = null; game.pendingSpawns = C.normalizeSpawnCounts(); game.spawnQueue = [];
  assert.equal(game.load(), true);
  assert.equal(game.remainingAssault, total); assert.equal(game.activeCrisis.remaining, 23); assert.equal(game.activeCrisis.status, 'pending');
  const restored = game.units.find(unit => unit.id === worker.id);
  assert.equal(restored.carry, 3); assert.equal(restored.carryType, node.type); assert.equal(restored.state, 'gather'); assert.equal(restored.targetNode, node.id);
  const ammo = game.resources.ammo; game.updateCrisis(22);
  assert.equal(game.resources.ammo, ammo); game.updateCrisis(1); assert.equal(game.resources.ammo, ammo - 18);
  game.save(false); assert.equal(game.load(), true); assert.equal(game.stats.crisesResolved, 1);
  raw.spawnQueue = ['walker', 'runner', 'runner']; delete raw.pendingSpawns; raw.activeCrisis = { id: 'ammo', title: 'ancienne pénalité' };
  storage.set(C.SAVE_KEY, JSON.stringify(raw));
  assert.equal(game.load(), true); assert.equal(game.remainingAssault, 3); assert.equal(game.activeCrisis, null);
});

test('crises UI: aucune décision ne passe pendant la pause et un refus ne consomme rien', () => {
  const { game, elements } = freshGame(); crisis(game, 'blackout'); game.updateCrisisUI();
  const before = { ...game.resources }; game.togglePause(true);
  elements.get('crisisChoiceA').dispatch('click'); assert.deepEqual(game.resources, before); assert.equal(game.activeCrisis.status, 'pending');
  game.togglePause(false); elements.get('crisisChoiceA').dispatch('click');
  assert.equal(game.resources.fuel, before.fuel - 12); assert.equal(game.resources.scrap, before.scrap - 8); assert.equal(game.activeCrisis, null);
});
