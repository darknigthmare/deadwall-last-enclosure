'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
function sample(queue) {
  return { runId: 'restore-test', spawnQueue: queue, pendingSpawns: C.normalizeSpawnCounts({ runner: 2 }), zombies: [{ id: 5, health: 72 }],
    randomState: 45321, resources: { ammo: 11, wood: 37 }, player: { x: 130, y: 241 }, wavePlan: { total: queue.length + 3 }, dayworks: { night: { emitted: 1, pauses: 1 } } };
}
async function compare(expected, restored) {
  const { persistentRestoreComparison } = await import('../scripts/browser-qa-common144.mjs');
  return persistentRestoreComparison({ material: JSON.stringify(expected), cp: { runId: expected.runId } },
    { DeadwallCore: C, DEADWALL: { runId: expected.runId, campaignIntro132: { isOpen: () => false } }, __DEADWALL_QA_RESTORED_144__: restored });
}

test('reprise QA147 : le buffer moderne et sa partition sont exacts jusqu’à 64 entrées', async () => {
  const before = sample(Array.from({ length: C.STRATEGY_RULES.spawnBatch }, (_, i) => i % 2 ? 'runner' : 'walker'));
  let result = await compare(before, clone(before));
  assert.equal(result.pass, true); assert.deepEqual(result.normalizedFields, []); assert.equal(result.expectedRemaining, 67);
  const reordered = clone(before); [reordered.spawnQueue[0], reordered.spawnQueue[1]] = [reordered.spawnQueue[1], reordered.spawnQueue[0]];
  result = await compare(before, reordered); assert.equal(result.pass, false); assert.deepEqual(result.changedKeys, ['spawnQueue']);
  const folded = clone(before); folded.pendingSpawns = C.normalizeSpawnCounts(folded.pendingSpawns, folded.spawnQueue); folded.spawnQueue = [];
  result = await compare(before, folded); assert.equal(result.pass, false); assert.ok(result.changedKeys.includes('spawnQueue')); assert.ok(result.changedKeys.includes('pendingSpawns'));
  assert.equal(result.expectedRemaining, result.restoredRemaining, 'Un budget égal ne masque pas une partition altérée');
});

test('reprise QA147 : seule une file héritée supérieure au buffer autorise la migration déclarée', async () => {
  const before = sample(Array.from({ length: C.STRATEGY_RULES.spawnBatch + 1 }, (_, i) => i % 2 ? 'runner' : 'walker'));
  const migrated = clone(before); migrated.pendingSpawns = C.normalizeSpawnCounts(migrated.pendingSpawns, migrated.spawnQueue); migrated.spawnQueue = [];
  let result = await compare(before, migrated); assert.equal(result.pass, true); assert.deepEqual(result.normalizedFields, ['spawnQueue', 'pendingSpawns']);
  migrated.pendingSpawns.walker--; migrated.pendingSpawns.runner++;
  result = await compare(before, migrated); assert.equal(result.pass, false); assert.ok(result.changedKeys.includes('pendingSpawns'));
});

test('reprise QA147 : ressources, personnage, RNG et nuit restent stricts pendant une migration héritée', async () => {
  const before = sample(Array(C.STRATEGY_RULES.spawnBatch + 1).fill('walker'));
  for (const [key, mutate] of [['resources', r => r.resources.ammo--], ['player', r => r.player.x++], ['randomState', r => r.randomState++], ['dayworks', r => r.dayworks.night.emitted++]]) {
    const changed = clone(before); changed.pendingSpawns = C.normalizeSpawnCounts(changed.pendingSpawns, changed.spawnQueue); changed.spawnQueue = []; mutate(changed);
    const result = await compare(before, changed); assert.equal(result.pass, false); assert.ok(result.changedKeys.includes(key));
  }
});

test('reprise QA147 : l’observation campagne conserve son plan séparé et les mêmes comparaisons strictes', async () => {
  const { persistentRestoreComparison } = await import('../scripts/browser-qa-common144.mjs');
  const before = sample(['walker', 'runner']), observation = clone(before); delete observation.wavePlan;
  const input = { material: JSON.stringify(before), cp: { runId: before.runId, seed: 54831, generation: 7, buildings: 3 },
    observationKey: 'campaignObservation', wavePlanObservationKey: 'campaignPlan' };
  const runtime = { DeadwallCore: C, DEADWALL: { runId: before.runId, world: { seed: 54831, buildings: new Map([[1, {}], [2, {}], [3, {}]]) },
    frontier: { snapshot: () => ({ generation: 7 }) }, campaignIntro132: { isOpen: () => false } }, campaignObservation: observation, campaignPlan: clone(before.wavePlan) };
  let result = persistentRestoreComparison(input, runtime); assert.equal(result.pass, true); assert.deepEqual(result.normalizedFields, []);
  runtime.campaignPlan.total++; result = persistentRestoreComparison(input, runtime); assert.equal(result.pass, false); assert.deepEqual(result.changedKeys, ['wavePlan']);
  runtime.campaignPlan = clone(before.wavePlan); runtime.campaignObservation.spawnQueue.reverse(); result = persistentRestoreComparison(input, runtime);
  assert.equal(result.pass, false); assert.deepEqual(result.changedKeys, ['spawnQueue']);
});

test('assaut QA147 : la fixture maximum utilise de vrais postes, des contacts existants et une ligne de vue physique', async () => {
  const { maximumObservedAssaultFixture } = await import('../scripts/browser-assault-fixtures147.mjs');
  const { g } = bootDocument134(); g.startNew('standard', '54831'); g.campaignIntro132.skip();
  g.wave = 8; g.phase = 'warning'; g.wavePlan = { ...C.wavePlan(8, g.difficulty, g.signature), total: 24, fronts: 4,
    composition: Object.fromEntries(Object.entries(C.ENEMIES).map(([kind,def]) => [kind,def.unlockWave<=8?3:0])) }; g.fronts = ['north', 'east', 'south', 'west'];
  assert.equal(Object.values(g.wavePlan.composition).filter(n=>n===3).length,8);assert.equal(C.spawnCount(g.wavePlan.composition),24);
  for(const[kind,def]of Object.entries(C.ENEMIES))if(def.unlockWave>8)assert.equal(g.wavePlan.composition[kind],0);
  g.phase = 'assault'; g.startAssault(); for (let i = 0; i < 8; i++) g.spawnZombie(g.spawnQueue.pop()); g.togglePause(true);
  const ids = g.zombies.map(z => z.id), health = g.zombies.map(z => z.health), rng = g.random.state;
  assert.equal(g.battlefieldUI.snapshot().observedContacts, 0, 'Les arrivées nord sont réellement hors de vue');
  const fixture = maximumObservedAssaultFixture(), observed = g.battlefieldUI.snapshot();
  assert.equal(fixture.posts.length, 4); assert.ok(fixture.changed.every(change => change.observed));
  assert.ok(observed.sectors.every(sector => sector.contacts > 0)); assert.ok(observed.innerContacts > 0); assert.ok(observed.observedContacts >= 5);
  assert.deepEqual(g.zombies.map(z => z.id), ids); assert.deepEqual(g.zombies.map(z => z.health), health); assert.equal(g.random.state, rng);
  assert.doesNotThrow(() => globalThis.DeadwallSave.validate(g.serialize()), 'La fixture garde une sauvegarde cohérente');
});
