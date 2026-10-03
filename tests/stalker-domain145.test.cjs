'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { boot127 } = require('./helpers/expansions127.cjs');

function fresh() {
  const { game } = boot127();
  game.startNew('standard', '17117');
  const Unit = game.units[0].constructor;
  game.world.nodes.forEach(node => { node.amount = 0; node.depleted = true; });
  game.units = []; game.zombies = [];
  Object.assign(game.player, { x: 4058, y: 2048 });
  game.flow.rebuild(game.world, game.core());
  return { game, Unit };
}

function stalker(game, x = 3908, y = 2048) {
  assert.equal(game.spawnZombie('stalker'), true);
  const zombie = game.zombies.at(-1);
  Object.assign(zombie, { x, y, lastX: x, lastY: y, huntThink: 0 });
  return zombie;
}

test('145 Traqueur : une entrée régionale réelle invalide immédiatement la proie locale absente', () => {
  const { game } = fresh(), zombie = stalker(game);
  game.updateZombies(.04);
  assert.equal(zombie.prey, game.player);
  assert.ok(zombie.huntThink > .04);
  assert.equal(game.frontier.enter(), true);
  assert.equal(game.frontier.active(), true);
  assert.equal(game.player.regionAbsent, true);
  const before = { x: zombie.x, y: zombie.y }, health = game.player.health;
  let scans = 0;
  const find = game.findStalkerPrey.bind(game);
  game.findStalkerPrey = (...args) => { scans++; return find(...args); };
  game.updateZombies(.04);
  assert.equal(zombie.prey, null);
  assert.ok(zombie.x < before.x, 'le champ de flux reprend sa direction vers le centre');
  assert.equal(scans, 0, 'invalidation simple, aucun nouveau scan dans ce tick');
  assert.equal(game.player.health, health);
});

test('145 Traqueur : toutes les proies absentes sont abandonnées sans contourner le budget des scans', () => {
  const { game } = fresh();
  for (let i = 0; i < 12; i++) stalker(game, 3908, 2048 + i);
  game.updateZombies(.04); game.updateZombies(.04);
  assert.equal(game.zombies.filter(zombie => zombie.prey === game.player).length, 12);
  assert.equal(game.frontier.enter(), true);
  let scans = 0;
  const find = game.findStalkerPrey.bind(game);
  game.findStalkerPrey = (...args) => { scans++; return find(...args); };
  game.updateZombies(.04);
  assert.equal(game.zombies.some(zombie => zombie.prey === game.player), false);
  assert.equal(scans, 0);
});

test('145 Traqueur : la cible locale vivante reste poursuivie entre deux scans', () => {
  const { game } = fresh(), zombie = stalker(game);
  game.updateZombies(.04);
  const before = zombie.x;
  game.updateZombies(.04);
  assert.equal(zombie.prey, game.player);
  assert.ok(zombie.x > before);
});

test('145 Traqueur : quitter D-17 ne masque pas un ouvrier qui reste réellement sur place', () => {
  const { game, Unit } = fresh(), worker = new Unit(game.nextId++, 'worker', 3800, 2048);
  game.units.push(worker);
  const zombie = stalker(game, 3650, 2048);
  game.updateZombies(.04);
  assert.equal(zombie.prey, worker);
  assert.equal(game.frontier.enter(), true);
  const before = zombie.x;
  game.updateZombies(.04);
  assert.equal(zombie.prey, worker);
  assert.ok(zombie.x > before);
});
