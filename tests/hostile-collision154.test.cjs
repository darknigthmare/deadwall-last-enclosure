'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() {
  const g = bootGame().game;
  g.startNew('standard', '17117');
  for (const node of g.world.nodes) { node.amount = 0; node.depleted = true; }
  g.units = []; g.player.dead = true;
  g.random.chance = () => false; g.flow.direction = () => ({ x: 1, y: 0 });
  g.daylight = () => 1; g.weather = 0;
  return g;
}
function structure(g, type = 'woodWall', gx = 40, gy = 40, rotation = 0) {
  const b = new (g.core().constructor)(g.nextId++, type, gx, gy, rotation, 1);
  g.world.add(b); return b;
}
function enemy(g, kind, x, y) {
  assert.equal(g.spawnZombie(kind), true);
  const z = g.zombies.at(-1);
  Object.assign(z, { x, y, lastX: x, lastY: y }); return z;
}

test('collision154 : les neuf profils ordinaires ne traversent plus un angle de palissade avec leur rayon', () => {
  for (const kind of Object.keys(C.ENEMIES).filter(kind => kind !== 'charger')) {
    const g = fresh(), wall = structure(g), z = enemy(g, kind, wall.left - 24, wall.top - 5);
    assert.equal(g.hostilePositionClear(z, z.x, z.y), true, kind + ' commence dehors');
    const health = wall.health;
    for (let i = 0; i < 70; i++) {
      g.updateZombies(.04);
      assert.equal(g.hostilePositionClear(z, z.x, z.y), true, kind + ' conserve une pose extérieure');
    }
    assert.ok(wall.health < health, kind + ' attaque l’obstacle physique au contact');
  }
});

test('collision154 : un pas long reste borné et ne saute pas la collision au coin', () => {
  const g = fresh(), wall = structure(g), z = enemy(g, 'runner', wall.left - 24, wall.top - 5);
  g.updateZombies(2);
  assert.equal(g.hostilePositionClear(z, z.x, z.y), true);
  assert.ok(z.x < wall.left); assert.ok(wall.health < wall.maxHealth);
});

test('collision154 : la séparation de foule ne pousse plus un errant à travers le rempart', () => {
  const g = fresh(), wall = structure(g);
  const radius = C.ENEMIES.walker.radius, z = enemy(g, 'walker', wall.left - radius - .1, wall.y);
  enemy(g, 'walker', z.x - 1, z.y);
  g.flow.direction = () => ({ x: 0, y: 0 }); g.random.chance = () => true; g.rebuildBuckets();
  const before = { x: z.x, y: z.y };
  assert.equal(g.hostilePositionClear(z, z.x, z.y), true);
  g.updateZombies(.04);
  assert.deepEqual({ x: z.x, y: z.y }, before);
  assert.equal(g.hostilePositionClear(z, z.x, z.y), true);
});

test('collision154 : le détour de foule reste possible sur une route libre', () => {
  const g = fresh(), z = enemy(g, 'walker', 1000, 1000);
  enemy(g, 'walker', 999, 1000);
  g.flow.direction = () => ({ x: 0, y: 0 }); g.random.chance = () => true; g.rebuildBuckets();
  g.updateZombies(.04); assert.ok(Math.abs(z.x - 1000.15) < 1e-8);
});

test('collision154 : les portes auto et verrouillées arrêtent le corps, la porte ouverte reste praticable', () => {
  for (const mode of ['auto', 'closed', 'open']) {
    const g = fresh(), gate = structure(g, 'gate', 40, 40, 1);
    gate.gateMode = mode;
    const z = enemy(g, 'walker', gate.left - 25, gate.y), health = gate.health;
    for (let i = 0; i < 110; i++) g.updateZombies(.04);
    if (mode === 'open') { assert.ok(z.x > gate.right); assert.equal(gate.health, health); }
    else { assert.ok(z.x + z.radius < gate.left); assert.ok(gate.health < health); }
  }
});

test('collision154 : seules les rampes de cadavres admissibles laissent franchir le mur', () => {
  for (const kind of ['runner', 'crawler', 'walker', 'armored']) {
    const g = fresh(), wall = structure(g), z = enemy(g, kind, wall.left - 25, wall.y);
    wall.corpseLoad = 100;
    for (let i = 0; i < 100; i++) g.updateZombies(.04);
    if (kind === 'runner' || kind === 'crawler') assert.ok(z.x > wall.right, kind + ' utilise la rampe');
    else assert.ok(z.x + z.radius < wall.left, kind + ' reste dehors');
  }
});
