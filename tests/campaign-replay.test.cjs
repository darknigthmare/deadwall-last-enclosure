'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { bootDocument133 } = require('./helpers/document133.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function click(button) {
  assert.ok(document.body.contains(button));
  assert.equal(button.disabled, false);
  assert.equal(button.closest('[inert], .hidden'), null);
  button.click();
}

function versions(data) {
  const f = data.frontier, local = data.exploration125;
  return { generation:f.generation, detailVersion:f.detailVersion, ecologyVersion:f.ecologyVersion, hydrologyVersion:f.hydrologyVersion,
    landscape189:f.landscape189 || 'classic', cityGeometry202:data.cityGeometry202 || 0, explorationGeneration:local.generation, layoutRevision:local.layoutRevision || 1 };
}

function geometry(g) {
  const regional = g.frontier.world(), local = g.exploration125.plan;
  // Compare the actual roads, sites, local collision plans and finite containers,
  // including a regional plan from each generation that is present on this map.
  const samples = [...new Map(regional.pois.map(p => [p.generation, p])).values()];
  return {
    region: hash({ home:regional.home, roads:regional.roads, sites:regional.pois.map(p => [p.id,p.type,p.programme3000,p.x,p.y,p.w,p.h,p.a,p.levels]),
      plans:samples.map(p => [p.id, regional.plan(p, 0), p.outdoor]) }),
    local: hash(Object.fromEntries(['seed','layoutRevision','roads','stations','backyards','settlements','solids','buildExclusions','stationLoot','roadProps'].map(key => [key,local[key]])))
  };
}

const cases = [
  { generation:7, detailVersion:1, ecologyVersion:0, hydrologyVersion:0, landscape189:'classic', cityGeometry202:0, explorationGeneration:4, layoutRevision:2, scenario:'rearguard' },
  { generation:10, detailVersion:13, ecologyVersion:1, hydrologyVersion:1, landscape189:'large', cityGeometry202:0, explorationGeneration:4, layoutRevision:3, scenario:'convoy' },
  { generation:11, detailVersion:13, ecologyVersion:1, hydrologyVersion:1, landscape189:'balanced', cityGeometry202:1, explorationGeneration:4, layoutRevision:4, scenario:'classic' }
];

for (const {scenario, ...recipe} of cases) test(`Rejouer: loaded G${recipe.generation}/R${recipe.layoutRevision} keeps its map and starts a fresh campaign in one write`, () => {
  const source = bootDocument133(); source.ready();
  const g = source.g, C = globalThis.DeadwallCore;
  g.startNew('brutal', '17117', scenario, recipe.landscape189, recipe.cityGeometry202 === 1);
  g.campaignIntro132.skip();

  // Prepare a valid historical save, independently of the new replay argument.
  const historical = copy(g.serialize());
  for (const key of ['generation','detailVersion','ecologyVersion','hydrologyVersion']) historical.frontier[key] = recipe[key];
  historical.exploration125.layoutRevision = recipe.layoutRevision;
  if (recipe.generation === 7) historical.expansions127.modules.lore131.siteGeneration = 7;
  assert.equal(g.restoreSave(historical), true);
  const originalMap = geometry(g), initial = copy(g.serialize());
  assert.deepEqual(versions(initial), recipe);

  // This fixture represents a played campaign, including a depleted real
  // regional container. Replaying must reset its owners, not restore possessions.
  const world = g.frontier.world();
  let container, site;
  for (const p of world.pois) {
    container = world.plan(p, 0).objects.find(o => o.amount > 0);
    if (container) { site = p; break; }
  }
  assert.ok(container);
  const played = copy(initial);
  played.resources.wood = 1; played.player.carry.scrap = 5;
  played.research.insight = 9; played.objectiveIndex = 1; played.stats.kills = 14; played.elapsed = 123;
  played.frontier.seen = [site.id]; played.frontier.taken[container.id] = container.amount;
  assert.equal(g.restoreSave(played), true);
  const localStock = g.world.nodes.find(n => n.__exploration125Loot && n.amount > 0);
  assert.ok(localStock); localStock.harvest(localStock.amount);
  assert.equal(g.save(false), true);

  const env = bootDocument133({ storageEntries:[...source.storage] }); env.ready();
  const current = env.g;
  click(current.ui.continueButton);
  assert.deepEqual(versions(current.serialize()), recipe);
  assert.deepEqual(geometry(current), originalMap);
  assert.equal(current.frontier.takenAmount(container.id), container.amount);
  assert.equal(current.world.nodes.find(n => n.id === localStock.id).amount, 0);
  const oldId = current.runId;

  current.damageBuilding(current.core(), current.core().health);
  assert.equal(current.gameOver, true);
  const storage = globalThis.localStorage, setItem = storage.setItem, writes = [];
  storage.setItem = function(key, value) {
    if (key === C.SAVE_KEY) writes.push(JSON.parse(value));
    return setItem.call(this, key, value);
  };
  try { click(document.getElementById('restartButton')); }
  finally { storage.setItem = setItem; }

  assert.equal(writes.length, 1, 'Only the fully initialized replay is persisted');
  const saved = globalThis.DeadwallSave.parse(JSON.stringify(writes[0]));
  assert.deepEqual(versions(saved), recipe, 'The first autosave already has every original map revision');
  assert.equal(saved.worldSeed, 17117); assert.equal(saved.scenarioId, scenario); assert.equal(saved.difficulty, 'brutal');
  assert.notEqual(saved.runId, oldId); assert.equal(saved.runId, current.runId);
  assert.deepEqual(geometry(current), originalMap);
  assert.deepEqual(saved.resources, initial.resources); assert.deepEqual(saved.player.carry, initial.player.carry);
  assert.deepEqual(saved.research, initial.research); assert.equal(saved.objectiveIndex, 0); assert.equal(saved.stats.kills, 0); assert.equal(saved.elapsed, 0);
  assert.deepEqual(saved.frontier.taken, {}); assert.deepEqual(saved.frontier.seen, []);
  assert.deepEqual(saved.expansions127.modules.lore131.collected, []);
  assert.equal(current.world.nodes.find(n => n.id === localStock.id).amount, localStock.maxAmount);
  assert.equal(current.frontier.takenAmount(container.id), 0);
  assert.equal(current.campaignIntro132.isOpen(), true);
  assert.equal(Object.hasOwn(saved, 'mapRecipe'), false, 'The replay recipe is not a new save register');

  const resumed = bootDocument133({ storageEntries:[...env.storage] }); resumed.ready();
  click(resumed.g.ui.continueButton);
  assert.equal(resumed.g.runId, saved.runId);
  assert.deepEqual(versions(resumed.g.serialize()), recipe);
  assert.deepEqual(geometry(resumed.g), originalMap);
  assert.deepEqual(resumed.g.resources, initial.resources);
});

test('Rejouer: an invalid recipe is rejected before any campaign owner, intro, overlay or storage changes', () => {
  const env = bootDocument133(); env.ready();
  const g = env.g;
  g.startNew('standard', '84329', 'classic', 'balanced', true);
  g.player.carry.scrap = 3;
  const recipe = versions(g.serialize()), world = g.world, overlay = g.activeOverlay;
  const checkpoint = () => { const data = copy(g.serialize()); delete data.timestamp; return data; };
  const before = checkpoint(), stored = new Map(env.storage);
  const invalid = [null, {}, {...recipe, resources:{}}, {...recipe, generation:12}, {...recipe, detailVersion:14},
    {...recipe, ecologyVersion:0}, {...recipe, hydrologyVersion:0}, {...recipe, cityGeometry202:0},
    {...recipe, explorationGeneration:3}, {...recipe, layoutRevision:5}, {...recipe, landscape189:'large'},
    {...recipe, detailVersion:undefined}, {...recipe, cityGeometry202:undefined}];
  for (const value of invalid) {
    assert.equal(g.startNew('standard', '17117', 'classic', 'balanced', true, value), false);
    assert.equal(g.world, world); assert.equal(g.activeOverlay, overlay); assert.equal(g.campaignIntro132.isOpen(), true);
    assert.deepEqual(checkpoint(), before); assert.deepEqual(env.storage, stored);
  }
  assert.equal(g.save(false), true, 'A rejected recipe does not block the current campaign from saving');
});
