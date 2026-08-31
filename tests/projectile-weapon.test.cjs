const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');

function firingRange(weapon, roll = .1) {
  const { game } = bootGame();
  game.startNew('standard', '17117');
  Object.assign(game.player, { x: 500, y: 500, facing: 0, weapon });
  game.tier = { id: 2 };
  game.random.range = (low, high) => (low + high) / 2;
  game.spawnZombie('armored');
  const target = game.zombies.at(-1);
  Object.assign(target, { x: 580, y: 500, health: 1000 });
  const chances = [];
  game.random.chance = probability => { chances.push(probability); return roll < probability; };
  game.rebuildBuckets();
  return { game, target, chances };
}

for (const weapon of Object.keys(C.WEAPONS)) {
  for (const heldAtImpact of Object.keys(C.WEAPONS)) {
    test(weapon + ' projectile retains its headshot profile when holding ' + heldAtImpact, () => {
      const { game, target, chances } = firingRange(weapon);
      const definition = C.WEAPONS[weapon];
      const magazineBefore = game.player.magazine[weapon];
      const reserveBefore = game.resources.ammo;
      game.shootPlayer();
      assert.equal(game.projectiles.length, definition.pellets);
      assert.equal(chances.length, 0, 'no extra RNG draw at firing time');
      for (const projectile of game.projectiles) {
        assert.equal(projectile.headshotChance, definition.headshotChance);
        assert.equal(projectile.headshotMultiplier, definition.headshotMultiplier);
      }
      game.switchWeapon(heldAtImpact);
      assert.equal(game.player.weapon, heldAtImpact);
      game.updateProjectiles(.1);
      const critical = .1 < definition.headshotChance;
      assert.equal(1000 - target.health, definition.damage * definition.pellets * (critical ? definition.headshotMultiplier : 1));
      assert.equal(game.stats.headshots, critical ? definition.pellets : 0);
      assert.equal(game.stats.shots, 1);
      assert.equal(game.player.magazine[weapon], magazineBefore - 1);
      assert.equal(game.resources.ammo, reserveBefore);
      assert.deepEqual(chances, Array(definition.pellets).fill(definition.headshotChance));
      assert.equal(game.projectiles.length, 0);
    });
  }
}

test('shotgun pellets retain critical damage below their original threshold after switching', () => {
  const { game, target } = firingRange('shotgun', .01);
  game.shootPlayer();
  game.switchWeapon('pistol');
  game.updateProjectiles(.1);
  assert.equal(1000 - target.health, 18 * 8 * 1.75);
  assert.equal(game.stats.headshots, 8);
});

test('friendly fire remains non-critical and does not consume a headshot RNG draw', () => {
  const { game, target, chances } = firingRange('shotgun', 0);
  game.fireFriendly(500, 500, 0, 31, 520, '#ffe0a0');
  assert.equal(game.projectiles[0].headshotChance, 0);
  game.switchWeapon('pistol');
  game.updateProjectiles(.1);
  assert.equal(1000 - target.health, 31);
  assert.equal(game.stats.headshots, 0);
  assert.deepEqual(chances, []);
});

test('missing shots do not roll critical hits or persist transient projectile data in saves', () => {
  const { game, chances } = firingRange('pistol', 0);
  game.zombies.length = 0;
  game.rebuildBuckets();
  game.shootPlayer();
  const saved = game.serialize();
  assert.equal(Object.hasOwn(saved, 'projectiles'), false);
  game.updateProjectiles(1);
  assert.deepEqual(chances, []);
  assert.equal(game.stats.headshots, 0);
  assert.equal(game.projectiles.length, 0);
});
