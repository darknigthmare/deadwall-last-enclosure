'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() {
  const g = bootGame().game; g.startNew('standard', '17117');
  const Unit = g.units[0].constructor;
  for (const node of g.world.nodes) { node.amount = 0; node.depleted = true; }
  g.units = []; g.zombies = []; g.weather = 0; g.daylight = () => 1;
  g.random.chance = () => false; g.flow.direction = () => ({ x: -1, y: 0 });
  Object.assign(g.player, { x: 1150, y: 1000 });
  assert.equal(g.spawnZombie('stalker'), true);
  const z = g.zombies[0]; Object.assign(z, { x: 1000, y: 1000, lastX: 1000, lastY: 1000, huntThink: 0 });
  return { g, z, Unit };
}
function restore(g, saved) {
  const random = Math.random;
  // Deliberately choose a different constructor delay: it must not replace the saved decision.
  Math.random = () => .9;
  try { g.restoreSave(structuredClone(saved)); } finally { Math.random = random; }
  g.random.chance = () => false; g.flow.direction = () => ({ x: -1, y: 0 });
  g.daylight = () => 1; g.weather = 0;
}

for (const target of ['player', 'worker']) test('Traqueur154 : la chasse ' + target + ' reprend sur la même personne avec sa prochaine avancée', () => {
  const { g, z, Unit } = fresh();
  let prey = g.player;
  if (target === 'worker') {
    Object.assign(g.player, { x: 300, y: 300 });
    prey = new Unit(g.nextId++, 'worker', 1150, 1000); g.units.push(prey);
  }
  g.updateZombies(.04); assert.equal(z.prey, prey);
  const saved = structuredClone(g.serialize()), rng = g.random.state;
  g.updateZombies(.04);
  const expected = { x: z.x, y: z.y, huntThink: z.huntThink };
  restore(g, saved);
  const resumed = g.zombies[0];
  assert.equal(resumed.prey, target === 'player' ? g.player : g.units[0]);
  assert.equal(g.random.state, rng);
  g.updateZombies(.04);
  assert.deepEqual({ x: resumed.x, y: resumed.y, huntThink: resumed.huntThink }, expected);
});

test('Traqueur154 : une proie morte ou absente est immédiatement abandonnée après reprise', () => {
  for (const condition of ['dead', 'regionAbsent']) {
    const { g, z } = fresh(); g.updateZombies(.04);
    const saved = structuredClone(g.serialize()); restore(g, saved);
    g.player[condition] = true;
    const resumed = g.zombies[0], start = resumed.x;
    let scans = 0; const scan = g.findStalkerPrey.bind(g);
    g.findStalkerPrey = (...args) => { scans++; return scan(...args); };
    g.updateZombies(.04);
    assert.equal(resumed.prey, null); assert.ok(resumed.x < start);
    assert.equal(scans, 0, 'l’invalidation ne crée pas une recherche hors budget');
    assert.equal(z.dead, false);
  }
});

test('Traqueur154 : les champs historiques absents gardent la reprise antérieure et les ressources', () => {
  const { g } = fresh(); g.updateZombies(.04);
  const saved = structuredClone(g.serialize()); delete saved.zombies[0].preyId; delete saved.zombies[0].huntThink;
  restore(g, saved);
  assert.equal(g.zombies[0].prey, null);
  assert.ok(g.zombies[0].huntThink > 0 && g.zombies[0].huntThink <= C.ENEMY_RULES.stalkThinkSeconds);
  assert.equal(g.random.state, saved.randomState); assert.deepEqual(g.resources, saved.resources);
});

test('Traqueur154 : horloge et références illégales sont rejetées avant de remplacer le monde', () => {
  const { g } = fresh(); g.updateZombies(.04);
  const saved = structuredClone(g.serialize()), world = g.world;
  for (const [field, value] of [['huntThink', -1], ['huntThink', Infinity], ['huntThink', .51], ['huntThink', '0'], ['preyId', -1], ['preyId', 999999], ['preyId', 1.5], ['preyId', '0']]) {
    const invalid = structuredClone(saved); invalid.zombies[0][field] = value;
    assert.throws(() => g.restoreSave(invalid), /Sauvegarde invalide/);
    assert.equal(g.world, world); assert.equal(g.random.state, saved.randomState);
    assert.deepEqual(g.serialize().zombies, saved.zombies);
  }
});

test('Traqueur154 : une recherche retardée par le budget reprend comme échue sans prétendre une durée négative', () => {
  const { g, z } = fresh(); z.huntThink = -.2;
  const saved = g.serialize(); assert.equal(saved.zombies[0].huntThink, 0);
  restore(g, saved); g.updateZombies(.04); assert.equal(g.zombies[0].prey, g.player);
});
