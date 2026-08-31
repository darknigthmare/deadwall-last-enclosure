'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() {
  const env = bootGame(); env.game.startNew('standard');
  const worker = env.game.units[0], Node = env.game.world.nodes[0].constructor;
  env.game.units = [worker]; env.game.world.nodes = [];
  worker.x = env.game.core().x + 90; worker.y = env.game.core().y;
  return { ...env, worker, Node };
}
function structure(game, type, x, y, progress = 1, rotation = 0) {
  const Building = game.core().constructor, result = new Building(game.nextId++, type, x, y, rotation, progress);
  game.world.add(result); return result;
}
function tick(game, seconds, dt = .05) {
  for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += dt) { game.elapsed += dt; game.updateUnits(dt); }
}
function ring(game) {
  let target;
  for (let x = 58; x <= 70; x++) { structure(game, 'woodWall', x, 58); structure(game, 'woodWall', x, 70); }
  for (let y = 59; y < 70; y++) {
    structure(game, 'woodWall', 58, y);
    if (![64, 65].includes(y)) { const wall = structure(game, 'woodWall', 70, y); if (y === 63) target = wall; }
  }
  const gate = structure(game, 'gate', 70, 64, 1, 1);
  return { gate, target };
}

test('ordres ouvriers : validation, pause ordinaire refusée, commandement autorisé et soldats intacts', () => {
  const { game, worker } = fresh(), soldier = new worker.constructor(game.nextId++, 'soldier', worker.x, worker.y);
  game.units.push(soldier); soldier.state = 'move';
  assert.equal(game.workerOrder, 'auto');
  assert.equal(game.setWorkerOrder('unknown'), false); assert.equal(game.workerOrder, 'auto');
  game.paused = true; assert.equal(game.setWorkerOrder('clear'), false);
  game.activeOverlay = game.ui.commandModal; assert.equal(game.setWorkerOrder('clear'), true);
  game.paused = false; game.activeOverlay = null;
  assert.equal(soldier.state, 'move'); assert.equal(worker.state, 'idle');
  game.gameOver = true; assert.equal(game.setWorkerOrder('build'), false);
  game.gameOver = false; game.state = 'menu'; assert.equal(game.setWorkerOrder('build'), false);
});

test('ordres ouvriers : auto/chantiers respectent les priorités et récolte choisit les ressources avant les chantiers', () => {
  const { game, worker, Node } = fresh();
  const low = structure(game, 'woodWall', 69, 64, 0), high = structure(game, 'woodWall', 72, 67, 0);
  low.priority = 1; high.priority = 3;
  const node = new Node(901, 'wood', worker.x, worker.y, 100, 20, 0); game.world.nodes = [node];
  game.updateUnits(.1); assert.equal(worker.targetBuilding, high.id); assert.equal(worker.state, 'build');
  game.setWorkerOrder('harvest'); game.updateUnits(.1);
  assert.equal(worker.state, 'gather'); assert.equal(worker.targetNode, node.id); assert.ok(worker.carry > 0);
  const carried = worker.carry; game.setWorkerOrder('build');
  assert.equal(worker.state, 'return'); assert.equal(worker.carry, carried, 'le changement d’ordre ne détruit pas la récolte partielle');
  worker.x = game.core().x; worker.y = game.core().y; game.updateUnits(.1); game.updateUnits(.1);
  assert.equal(worker.state, 'build'); assert.equal(worker.targetBuilding, high.id);
});

test('ordres ouvriers : replis de tâche explicites, et le nettoyage détourne vraiment la main-d’œuvre', () => {
  const { game, worker, Node } = fresh();
  const job = structure(game, 'woodWall', 69, 64, 0);
  game.setWorkerOrder('harvest'); game.updateUnits(.1); assert.equal(worker.state, 'build', 'sans gisement utile, finir les chantiers');
  job.progress = 1;
  const node = new Node(902, 'wood', worker.x, worker.y, 100, 20, 0); game.world.nodes = [node];
  game.setWorkerOrder('build'); game.updateUnits(.1); assert.equal(worker.state, 'gather', 'sans chantier, collecter');
  worker.carry = 0; worker.carryType = null;
  game.setWorkerOrder('clear'); tick(game, 2);
  assert.equal(worker.state, 'idle'); assert.equal(worker.carry, 0); assert.ok(node.amount > 99, 'aucune collecte pendant le nettoyage dédié');
});

test('nettoyage : travail local progressif, cible extérieure et suppression graduelle des corps visibles', () => {
  const { game, worker } = fresh(), wall = structure(game, 'woodWall', 71, 64);
  wall.corpseLoad = 10; game.corpses = [{ x: wall.right + 5, y: wall.y }, { x: wall.right + 8, y: wall.y }];
  game.setWorkerOrder('clear'); game.updateUnits(.1); assert.equal(wall.corpseLoad, 10, 'aucun travail à distance');
  const point = game.workerCleanupPoint(worker, wall); assert.ok(point.x > wall.right);
  worker.x = point.x; worker.y = point.y; worker.navigation = null; worker.think = 0;
  game.updateUnits(.25);
  assert.ok(Math.abs(wall.corpseLoad - (10 - C.WORKER_RULES.cleanupPerSecond * .25)) < 1e-8);
  assert.equal(game.corpses.length, 2, 'un bref travail ne fait pas disparaître tous les corps');
  tick(game, 1.2); assert.ok(game.corpses.length < 2); assert.ok(wall.corpseLoad > 8);
  const summary = game.getWorkerSummary(); assert.equal(summary.clearing, 1); assert.equal(summary.assignedClear, 1);
});

test('nettoyage : une porte fermée bloque la sortie réelle ; ouverture puis cheminement permettent le travail', () => {
  const { game, worker } = fresh(), { gate, target } = ring(game); target.corpseLoad = 20;
  worker.x = C.world(68); worker.y = C.world(63); game.player.x = game.core().x; game.player.y = game.core().y;
  assert.equal(game.setGateMode('closed', gate), true);
  game.setWorkerOrder('clear'); tick(game, 3);
  assert.equal(target.corpseLoad, 20); assert.ok(worker.x < target.left, 'pas de téléportation à travers la porte');
  assert.equal(game.getWorkerSummary().clearing, 0);
  assert.equal(game.setGateMode('auto', gate), true);
  let crossed = false;
  for (let i = 0; i < 500 && target.corpseLoad === 20; i++) {
    game.elapsed += .05; game.updateUnits(.05);
    assert.ok(game.friendlyPositionClear(worker, worker.x, worker.y));
    if (C.grid(worker.x) === 70 && [64, 65].includes(C.grid(worker.y))) crossed = true;
  }
  assert.ok(crossed, 'la porte ouverte doit être réellement empruntée'); assert.ok(target.corpseLoad < 20);
});

test('contacts ouvriers : ni récolte ni construction à travers un mur même si la portée brute suffirait', () => {
  const { game, worker, Node } = fresh(), wall = structure(game, 'woodWall', 68, 64);
  const node = new Node(903, 'wood', wall.right + 5, wall.y, 100, 34, 0); game.world.nodes = [node];
  worker.x = wall.left - 9; worker.y = wall.y; worker.state = 'gather'; worker.targetNode = node.id; worker.think = 10;
  assert.ok(C.dist(worker, node) <= node.radius + 12);
  game.updateUnits(.1); assert.equal(node.amount, 100);
  const job = structure(game, 'woodWall', 69, 64, 0);
  worker.x = wall.left - 9; worker.y = wall.y; worker.state = 'build'; worker.targetBuilding = job.id; worker.think = 10;
  assert.ok(C.dist(worker, job) <= 62); game.updateUnits(.1); assert.equal(job.progress, 0);
});

test('repli : priorité au centre, arrêt des travaux extérieurs et cargaison partielle conservée à stock plein', () => {
  const { game, worker, Node } = fresh();
  game.world.nodes = [new Node(904, 'wood', worker.x, worker.y, 100, 20, 0)];
  const job = structure(game, 'woodWall', 69, 66, 0);
  worker.carry = 10; worker.carryType = 'wood'; game.resources.wood = game.storage - 3;
  const deposits = game.depositedResources; game.setWorkerOrder('retreat'); tick(game, 1);
  assert.equal(worker.carry, 7); assert.equal(game.resources.wood, game.storage); assert.equal(game.depositedResources - deposits, 3);
  tick(game, 1); assert.equal(worker.carry, 7); assert.equal(job.progress, 0); assert.equal(game.world.nodes[0].amount, 100);
  game.resources.wood -= 5; game.updateUnits(.1); assert.equal(worker.carry, 2);
  game.resources.wood -= 2; game.updateUnits(.1); assert.equal(worker.carry, 0); assert.equal(worker.carryType, null);
  assert.equal(worker.state, 'flee'); assert.ok(C.dist(worker, game.core()) <= C.WORKER_RULES.retreatRadius);
  assert.equal(game.getWorkerSummary().retreating, 1);
});

test('repli : un entrepôt extérieur plus proche ne détourne pas le retour au centre', () => {
  const { game, worker } = fresh(); structure(game, 'warehouse', 74, 62);
  worker.x = C.world(75); worker.y = C.world(64); worker.carry = 7; worker.carryType = 'wood';
  game.setWorkerOrder('retreat'); game.updateUnits(.1); assert.equal(worker.carry, 7, 'aucun dépôt extérieur avant le repli');
  tick(game, 9); assert.equal(worker.carry, 0); assert.ok(C.dist(worker, game.core()) <= C.WORKER_RULES.retreatRadius);
});

test('ouvriers : menace, mort et chantier disparu interrompent proprement le travail sans perdre le sac', () => {
  const { game, worker } = fresh(), wall = structure(game, 'woodWall', 71, 64);
  wall.corpseLoad = 5; const point = game.workerCleanupPoint(worker, wall); worker.x = point.x; worker.y = point.y;
  game.setWorkerOrder('clear'); game.updateUnits(.1); const pressure = wall.corpseLoad;
  const nearest = game.nearestZombie; game.nearestZombie = () => ({ x: worker.x + 20, y: worker.y });
  worker.carry = 2; worker.carryType = 'wood'; game.updateUnits(.1);
  assert.equal(worker.state, 'flee'); assert.equal(worker.carry, 2); assert.equal(wall.corpseLoad, pressure);
  game.nearestZombie = nearest; worker.carry = 0; worker.carryType = null; worker.state = 'clear'; worker.targetBuilding = wall.id; worker.think = 10;
  wall.dead = true; game.world.remove(wall); assert.doesNotThrow(() => game.updateUnits(.1)); assert.equal(worker.state, 'idle');
  worker.dead = true; game.updateUnits(.1); assert.equal(game.units.length, 0); assert.equal(game.getWorkerSummary().total, 0);
});

test('ouvriers : un groupe bloqué respecte le plafond de requêtes A* par pas', () => {
  const { game, worker } = fresh(), { gate, target } = ring(game); target.corpseLoad = 20;
  game.player.x = game.core().x; game.player.y = game.core().y; game.setGateMode('closed', gate);
  const Unit = worker.constructor;
  game.units = Array.from({ length: 20 }, () => new Unit(game.nextId++, 'worker', game.core().x, game.core().y));
  game.setWorkerOrder('clear'); game.updateUnits(.1);
  assert.equal(game.navigationBudget, 0);
  assert.equal(game.units.filter(unit => unit.navigation?.cells === null).length, C.STRATEGY_RULES.pathQueriesPerUpdate);
  assert.equal(target.corpseLoad, 20);
});

test('ouvriers : une récolte inaccessible est temporairement ignorée en faveur d’une route utile', () => {
  const { game, worker, Node } = fresh(), { gate } = ring(game);
  worker.x = C.world(68); worker.y = C.world(64); game.player.x = game.core().x; game.player.y = game.core().y;
  game.setGateMode('closed', gate);
  const outside = new Node(905, 'wood', C.world(72), C.world(64), 100, 20, 0), inside = new Node(906, 'wood', C.world(62), C.world(67), 100, 20, 0);
  game.world.nodes = [outside, inside]; game.setWorkerOrder('harvest'); game.updateUnits(.1);
  assert.equal(worker.targetNode, outside.id); assert.equal(worker.state, 'idle'); assert.equal(outside.amount, 100);
  game.updateUnits(.1); assert.equal(worker.targetNode, inside.id); assert.equal(worker.state, 'gather');
  tick(game, 6); assert.ok(inside.amount < 100); assert.equal(outside.amount, 100);
});

test('ouvriers : les tâches inaccessibles ne monopolisent pas le budget des premières unités', () => {
  const { game, worker } = fresh(), { gate } = ring(game), Unit = worker.constructor;
  game.player.x = game.core().x; game.player.y = game.core().y; game.setGateMode('closed', gate);
  for (const wall of game.world.buildings.values()) if (wall.def.wall) wall.corpseLoad = 20;
  game.units = Array.from({ length: 20 }, () => new Unit(game.nextId++, 'worker', game.core().x, game.core().y));
  game.setWorkerOrder('clear');
  for (let step = 0; step < Math.ceil(game.units.length / C.STRATEGY_RULES.pathQueriesPerUpdate); step++) {
    game.elapsed += .05; game.updateUnits(.05); assert.ok(game.navigationBudget >= 0);
  }
  assert.ok(game.units.every(unit => unit.blockedJobs?.size > 0), 'chaque ouvrier obtient son tour malgré les nombreuses cibles inaccessibles');
});

test('nettoyage : aucune main-d’œuvre distante n’accélère l’érosion passive des corps', () => {
  const { game, worker } = fresh(), wall = structure(game, 'woodWall', 90, 90), Unit = worker.constructor;
  game.units = Array.from({ length: 30 }, () => new Unit(game.nextId++, 'worker', game.core().x, game.core().y));
  wall.corpseLoad = 20; game.updateBuildings(1);
  assert.ok(Math.abs(wall.corpseLoad - (20 - C.WORKER_RULES.passiveDecayPerSecond)) < 1e-9);
});

test('ouvriers : sauvegarde/reprise conserve ordre, cible de nettoyage et pression sans travail instantané', () => {
  const { game, worker } = fresh(), wall = structure(game, 'woodWall', 71, 64);
  wall.corpseLoad = 10; const point = game.workerCleanupPoint(worker, wall); worker.x = point.x; worker.y = point.y;
  game.setWorkerOrder('clear'); game.updateUnits(.25); const pressure = wall.corpseLoad;
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  assert.equal(game.workerOrder, 'clear'); assert.equal(game.units[0].state, 'clear'); assert.equal(game.units[0].targetBuilding, wall.id);
  assert.equal(game.world.buildings.get(wall.id).corpseLoad, pressure);
  game.updateUnits(.25); assert.ok(Math.abs(game.world.buildings.get(wall.id).corpseLoad - (pressure - C.WORKER_RULES.cleanupPerSecond * .25)) < 1e-8);
});

test('construction : un ouvrier sort physiquement de l’empreinte avant que le mur se solidifie', () => {
  const { game, worker } = fresh(), wall = structure(game, 'woodWall', 70, 64, .999);
  worker.x = wall.x; worker.y = wall.y; worker.state = 'build'; worker.targetBuilding = wall.id; worker.think = 10;
  const origin = { x: worker.x, y: worker.y }; let moved = 0;
  for (let i = 0; i < 50 && !wall.completed; i++) {
    const before = { x: worker.x, y: worker.y }; game.elapsed += .05;
    game.updateBuildings(.05); game.updateUnits(.05);
    const distance = C.dist(before, worker); moved += distance;
    assert.ok(distance <= worker.speed * .05 + 1e-8, 'pas de téléportation ni déplacement hors budget de vitesse');
    if (wall.completed) assert.ok(game.friendlyPositionClear(worker, worker.x, worker.y), 'la collision ne se ferme jamais sur le constructeur');
  }
  assert.ok(wall.completed, 'le chantier finit une fois le constructeur sorti');
  assert.ok(moved > worker.radius); assert.ok(C.dist(origin, worker) > worker.radius);
});
