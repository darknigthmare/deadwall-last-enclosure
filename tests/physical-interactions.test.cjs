'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() {
  const env = bootGame(); env.game.startNew('standard', '17117');
  env.Node = env.game.world.nodes[0].constructor; env.game.world.nodes = [];
  env.game.random.chance = () => false; env.game.random.range = (low, high) => (low + high) / 2;
  return env;
}
function add(game, type, gx, gy, rotation = 0, progress = 1) {
  const result = new (game.core().constructor)(game.nextId++, type, gx, gy, rotation, progress);
  game.world.add(result); return result;
}
function spawn(game, kind, x, y) {
  assert.equal(game.spawnZombie(kind), true);
  const zombie = game.zombies.at(-1); zombie.x = zombie.lastX = x; zombie.y = zombie.lastY = y;
  return zombie;
}
function corner(env) {
  const { game, Node } = env, wall = add(game, 'woodWall', 70, 70);
  Object.assign(game.player, { x: wall.left - 14, y: wall.top + 24 });
  const node = new Node(999, 'wood', wall.left + 24, wall.top - 23, 100, 17, 0);
  game.world.nodes = [node]; game.input.keys.add('KeyE');
  return { wall, node };
}
function shot(game, targets) {
  Object.assign(game.player, { x: 1000, y: 1000, facing: 0 });
  const zombies = targets.map(([kind, x, y = 1000]) => spawn(game, kind, x, y));
  game.rebuildBuckets(); game.shootPlayer(); return { zombies, projectile: game.projectiles[0] };
}
function crisis(game, id = 'blackout') {
  game.activeCrisis = { id, wave: 5, status: 'pending', remaining: 45, targetId: 0, choice: null };
}

test('interaction : une ressource proche derrière un coin de rempart reste inaccessible', () => {
  const env = fresh(), { wall, node } = corner(env), { game } = env;
  assert.ok(C.dist(game.player, node) < 62); assert.ok(node.y + node.radius < wall.top - 4);
  assert.equal(game.hostileLineClear(game.player, node), false);
  game.updateInteraction(.1);
  assert.equal(node.amount, 100); assert.equal(game.player.carry.wood, 0); assert.equal(game.stats.gathered, 0);
});

test('interaction : une cible inaccessible ne masque pas une ressource accessible un peu plus loin', () => {
  const env = fresh(), { node } = corner(env), { game, Node } = env;
  const accessible = new Node(1000, 'scrap', game.player.x - 61, game.player.y, 100, 17, 0);
  game.world.nodes.push(accessible); game.updateInteraction(.1);
  assert.equal(node.amount, 100); assert.equal(accessible.amount, 99); assert.equal(game.player.carry.scrap, 1);
});

test('interaction : ni construction ni dépôt ne traversent un rempart solide', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 70, 70);
  Object.assign(game.player, { x: wall.left - 14, y: wall.y }); game.input.keys.add('KeyE');
  const site = add(game, 'woodWall', 71, 70, 0, 0); game.updateInteraction(.1);
  assert.equal(site.progress, 0);
  game.world.remove(site); add(game, 'warehouse', 71, 69); game.player.carry.wood = 10;
  const before = game.resources.wood; game.updateInteraction(.1);
  assert.equal(game.resources.wood, before); assert.equal(game.player.carry.wood, 10); assert.equal(game.depositedResources, 0);
});

test('interaction : portes auto et ouvertes autorisent la récolte, une porte fermée la bloque', () => {
  for (const mode of ['auto', 'open', 'closed']) {
    const { game, Node } = fresh(), gate = add(game, 'gate', 70, 70, 1); gate.gateMode = mode;
    Object.assign(game.player, { x: gate.left - 14, y: gate.y });
    const node = new Node(999, 'wood', gate.right + 15, gate.y, 100, 13, 0);
    game.world.nodes = [node]; game.input.keys.add('KeyE'); game.updateInteraction(.1);
    assert.equal(node.amount, mode === 'closed' ? 100 : 99, mode);
  }
});

test('interaction : le relevé narratif ne prend la main que sans action concurrente', () => {
  const { game, Node } = fresh(); let surveyed = 0;
  game.updateNarrativeSurvey = dt => { surveyed += dt; }; game.input.keys.add('KeyE');
  Object.assign(game.player, { x: 1000, y: 1000 }); game.updateInteraction(.1); assert.equal(surveyed, .1);
  game.world.nodes = [new Node(999, 'wood', 1020, 1000, 100, 13, 0)];
  game.updateInteraction(.1); assert.equal(surveyed, .1); assert.equal(game.player.carry.wood, 1);
});

test('interaction et mêlée : pause, menu et commandant à terre ne permettent aucune action directe', () => {
  for (const state of ['paused', 'menu', 'dead', 'gameOver']) {
    const { game, Node } = fresh(); Object.assign(game.player, { x: 1000, y: 1000, facing: 0 });
    const node = new Node(999, 'wood', 1020, 1000, 100, 13, 0), zombie = spawn(game, 'armored', 1030, 1000);
    game.world.nodes = [node]; game.rebuildBuckets(); game.input.keys.add('KeyE');
    if (state === 'paused') game.paused = true;
    if (state === 'menu') game.state = 'menu';
    if (state === 'dead') game.player.dead = true;
    if (state === 'gameOver') game.gameOver = true;
    const health = zombie.health; game.updateInteraction(.1); game.melee();
    assert.equal(node.amount, 100, state); assert.equal(zombie.health, health, state); assert.equal(game.player.meleeCooldown, 0, state);
  }
});

test('projectiles : un tir traversant une cible touche autant à 25 Hz qu’à 50 Hz', () => {
  for (const kind of Object.keys(C.ENEMIES)) for (const dt of [.04, .02]) {
    const { game } = fresh(), { zombies: [zombie] } = shot(game, [[kind, 1041]]), health = zombie.health;
    game.updateProjectiles(dt);
    assert.equal(zombie.health, health - C.WEAPONS.pistol.damage, `${kind} ${dt}`);
    assert.equal(game.projectiles.length, 0); assert.equal(game.stats.shots, 1); assert.equal(game.player.magazine.pistol, 11);
  }
});

test('projectiles : seul le premier impact physique compte, indépendamment de l’ordre des infectés', () => {
  const { game } = fresh(), { zombies: [far, near] } = shot(game, [['walker', 1049], ['walker', 1041]]);
  const healthFar = far.health, healthNear = near.health; game.updateProjectiles(.04);
  assert.equal(far.health, healthFar); assert.equal(near.health, healthNear - C.WEAPONS.pistol.damage);
  assert.equal(game.projectiles.length, 0);
});

test('projectiles : la portée coupe le trajet sans supprimer les impacts avant sa limite', () => {
  for (const [x, hit] of [[1050, true], [1070, false]]) {
    const { game } = fresh(), { zombies: [zombie], projectile } = shot(game, [['walker', x]]), health = zombie.health;
    projectile.range = 15; game.updateProjectiles(.04);
    assert.equal(zombie.health, health - (hit ? C.WEAPONS.pistol.damage : 0)); assert.equal(game.projectiles.length, 0);
    assert.ok(projectile.travelled <= 15);
  }
});

test('projectiles : les tirs de défense conservent leur politique historique au-dessus des remparts', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 70, 70);
  Object.assign(game.player, { x: wall.left - 70, y: wall.y, facing: 0 });
  const zombie = spawn(game, 'armored', wall.right + 20, wall.y), health = zombie.health;
  game.rebuildBuckets(); game.shootPlayer();
  for (let i = 0; i < 4; i++) game.updateProjectiles(.04);
  assert.equal(zombie.health, health - C.WEAPONS.pistol.damage);
});

test('projectiles : une cible derrière la bouche du canon ou hors du corridor n’est pas touchée', () => {
  const { game } = fresh(), { zombies } = shot(game, [['walker', 1000], ['walker', 1041, 1017]]);
  const health = zombies.map(zombie => zombie.health); game.updateProjectiles(.04);
  assert.deepEqual(zombies.map(zombie => zombie.health), health); assert.equal(game.projectiles.length, 1);
});

test('projectiles : 720 cibles et tirs simultanés gardent un voisinage spatial local et les effets plafonnés', () => {
  const { game } = fresh(), kinds = Object.keys(C.ENEMIES), health = [];
  for (let i = 0; i < C.PERFORMANCE_LIMITS.zombies; i++) {
    const zombie = spawn(game, kinds[i % kinds.length], 200 + (i % 24) * 100, 200 + Math.floor(i / 24) * 100);
    health.push(zombie.health); game.fireFriendly(zombie.x - 60, zombie.y, 0, 42, 100, '#ffe0a0');
  }
  game.rebuildBuckets(); let queries = 0, largestQuery = 0; const nearby = game.nearbyZombies.bind(game);
  game.nearbyZombies = (x, y, radius) => { queries++; largestQuery = Math.max(largestQuery, radius); return nearby(x, y, radius); };
  game.updateProjectiles(.04);
  assert.equal(queries, C.PERFORMANCE_LIMITS.zombies); assert.ok(largestQuery <= 40);
  game.zombies.forEach((zombie, index) => assert.equal(zombie.health, health[index] - 42));
  assert.equal(game.projectiles.length, 0); assert.equal(game.stats.headshots, 0);
  game.updateEffects(.04); assert.ok(game.particles.length <= C.PERFORMANCE_LIMITS.particles);
});

test('mêlée : le recul s’arrête avant le rempart sans y enfoncer la cible', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 70, 70);
  Object.assign(game.player, { x: wall.left - 60, y: wall.y, facing: 0 });
  const zombie = spawn(game, 'armored', wall.left - 20, wall.y), health = zombie.health;
  game.rebuildBuckets(); game.melee();
  assert.equal(zombie.health, health - 36); assert.ok(zombie.x > wall.left - 20);
  assert.equal(game.hostilePositionClear(zombie, zombie.x, zombie.y), true); assert.ok(zombie.x + zombie.radius <= wall.left);
});

test('mêlée : aucun coup ne traverse un coin de mur et une porte ouverte garde son passage', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 70, 70);
  Object.assign(game.player, { x: wall.left - 14, y: wall.top + 24 });
  const hidden = spawn(game, 'armored', wall.left + 20, wall.top - 14), health = hidden.health;
  game.player.facing = Math.atan2(hidden.y - game.player.y, hidden.x - game.player.x);
  game.rebuildBuckets(); game.melee(); assert.equal(hidden.health, health);
  game.world.remove(wall); const gate = add(game, 'gate', 70, 70, 1); gate.gateMode = 'open';
  Object.assign(game.player, { x: gate.left - 60, y: gate.y, facing: 0, meleeCooldown: 0 });
  hidden.x = gate.left - 20; hidden.y = gate.y; game.rebuildBuckets(); game.melee();
  assert.equal(hidden.health, health - 36); assert.equal(hidden.x, gate.left); assert.equal(game.hostilePositionClear(hidden, hidden.x, hidden.y), true);
});

test('mêlée : le recul reste dans le monde et un infecté mort ne prend pas un second coup', () => {
  const { game } = fresh(); Object.assign(game.player, { x: 38, y: 1000, facing: Math.PI });
  const zombie = spawn(game, 'armored', 20, 1000); game.rebuildBuckets(); game.melee();
  assert.ok(zombie.x >= zombie.radius + 3); assert.ok(zombie.x <= C.WORLD_SIZE - zombie.radius - 3);
  const health = zombie.health; zombie.dead = true; game.player.meleeCooldown = 0; game.melee(); assert.equal(zombie.health, health);
});

test('crises : les clés héritées et choix inconnus sont refusés sans exception ni effet', () => {
  const { game } = fresh(); crisis(game); const before = { ...game.resources };
  for (const choice of ['constructor', '__proto__', 'toString', '', 'C', null, undefined, 1, {}]) {
    assert.equal(game.canResolveCrisis(choice), false); assert.equal(game.resolveCrisis(choice), false);
    assert.deepEqual(game.resources, before); assert.equal(game.activeCrisis.status, 'pending');
  }
});

test('soldat : une attaque sans munitions ne traverse pas le coin d’un mur', () => {
  const { game } = fresh(), wall = add(game, 'woodWall', 70, 70);
  const soldier = new (game.units[0].constructor)(game.nextId++, 'soldier', wall.left - 10, wall.top + 8);
  game.units = [soldier]; game.player.dead = true; game.resources.ammo = 0;
  const zombie = spawn(game, 'crawler', wall.left + 12, wall.top - 9), health = zombie.health;
  assert.equal(game.friendlyPositionClear(soldier, soldier.x, soldier.y), true);
  assert.equal(game.hostilePositionClear(zombie, zombie.x, zombie.y), true);
  assert.equal(game.hostileLineClear(soldier, zombie), false); assert.ok(C.dist(soldier, zombie) < 28);
  game.rebuildBuckets(); game.updateUnits(.04); assert.equal(zombie.health, health); assert.equal(soldier.fireCooldown, 0);
  game.world.remove(wall); game.updateUnits(.04); assert.equal(zombie.health, health - 18);
  assert.equal(soldier.fireCooldown, .7); assert.equal(game.resources.ammo, 0);
});

test('clinique : les soins exigent un contact accessible et conservent les débits historiques', () => {
  for (const mode of ['wall', 'auto', 'open', 'closed']) {
    const { game } = fresh(), barrier = add(game, mode === 'wall' ? 'woodWall' : 'gate', 70, 70, 1);
    if (mode !== 'wall') barrier.gateMode = mode;
    const clinic = add(game, 'clinic', 71, 69); clinic.powered = true;
    const unit = game.units[0]; game.units = [unit];
    for (const actor of [game.player, unit]) Object.assign(actor, { x: barrier.left - 14, y: C.world(70), health: 20 });
    const resources = { ...game.resources }; game.updateBuildings(1);
    const accessible = mode === 'auto' || mode === 'open';
    assert.equal(game.player.health, accessible ? 21.6 : 20, mode); assert.equal(unit.health, accessible ? 22.2 : 20, mode);
    assert.deepEqual(game.resources, resources, 'aucun coût ou munitions ajoutés aux soins passifs');
  }
});

test('clinique : sans courant aucun soin ; aucun mort ou commandant à terre n’est ressuscité', () => {
  const { game } = fresh(), clinic = add(game, 'clinic', 74, 74), unit = game.units[0]; game.units = [unit];
  for (const actor of [game.player, unit]) Object.assign(actor, { x: clinic.x, y: clinic.y, health: 20 });
  clinic.powered = false; game.updateBuildings(1); assert.equal(unit.health, 20); assert.equal(game.player.health, 20);
  clinic.powered = true;
  for (const dead of [true, false]) {
    for (const actor of [game.player, unit]) Object.assign(actor, { health: 0, dead });
    game.player.downTimer = 4; game.updateBuildings(1);
    assert.equal(unit.health, 0); assert.equal(game.player.health, 0); assert.equal(game.player.downTimer, 4);
  }
});

test('crises : un ordre du commandement en pause est appliqué exactement une fois', () => {
  const { game } = fresh(); crisis(game); const before = { ...game.resources };
  game.paused = true; game.activeOverlay = game.ui.commandModal;
  assert.equal(game.resolveCrisis('A'), true); assert.equal(game.resolveCrisis('A'), false);
  assert.equal(game.resources.fuel, before.fuel - 12); assert.equal(game.resources.scrap, before.scrap - 8);
  assert.equal(game.stats.crisesResolved, 1); assert.equal(game.paused, true);
});

test('crises : le temps et les réponses automatiques sont gelés derrière toute pause', () => {
  for (const overlay of ['commandModal', 'pauseMenu', 'helpModal', 'settingsModal']) {
    const { game } = fresh(); crisis(game, 'ammo'); const before = { ...game.resources };
    game.paused = true; game.activeOverlay = game.ui[overlay];
    game.updateCrisis(45); assert.equal(game.activeCrisis.remaining, 45, overlay);
    assert.equal(game.resolveCrisis('B', true), false, overlay);
    if (overlay !== 'commandModal') assert.equal(game.resolveCrisis('B'), false, overlay);
    assert.deepEqual(game.resources, before, overlay);
  }
});
