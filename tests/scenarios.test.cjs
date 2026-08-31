'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../src/core.js');
const S = require('../src/scenarios.js');
const Save = require('../src/save.js');
const P = require('../src/profile.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh(id = 'classic', difficulty = 'standard') {
  const env = bootGame(); env.game.startNew(difficulty, '17117', id); return env;
}
function snapshot(id, extra = {}) {
  return { runId: 'scenario:' + id, seed: 17117, difficulty: 'standard', scenarioId: id, wavesSurvived: 3, kills: 42, playSeconds: 90, population: 4, buildings: 3, ended: false, ...extra };
}
function profileStore() {
  const store = new Map();
  return { store, getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) };
}

test('départs : catalogue immuable, IDs stricts et état initial indépendant sans RNG', () => {
  assert.deepEqual(S.list().map(s => s.id), ['classic', 'convoy', 'reconstruction', 'rearguard']);
  assert.deepEqual(P.SCENARIOS, S.list().map(s => s.id), 'le schéma autonome de profil suit le catalogue');
  assert.equal(S.normalize(), 'classic');
  for (const id of [null, '', 'constructor', '__proto__', {}, 1, 'future']) assert.throws(() => S.normalize(id), RangeError);
  assert.throws(() => S.initialState('classic', 'future'), RangeError);
  assert.throws(() => { C.START_SCENARIOS.convoy.resources.food = 999; }, TypeError);
  const state = S.initialState('convoy'); state.resources.food = 999; state.roster.length = 0;
  assert.equal(S.initialState('convoy').resources.food, 80);
  assert.equal(S.initialState('convoy').roster.length, 5);
  const sandbox = { DeadwallCore: C }; vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/scenarios.js'), 'utf8'), sandbox);
  assert.equal(sandbox.DeadwallScenarios.initialState('reconstruction').coreHealth, 1920);
});

test('départ classique : trois empreintes historiques conservent ressources, carte, unités, IDs et RNG', () => {
  const expected = {
    story: 'a4c7acc61e6b3a652e209a3c8135db8830975c9f508e6afcf52da1bac0a6d7a8',
    standard: '7da644fa8884841328b72e24d33d12d740aa8d65a286ab9f7adbcb5c82a0f683',
    brutal: 'b95f90908f2bb1d8baf9e72b3efe1c8f02749c50098312a8c0def5095b55214f'
  };
  const oldNow = Date.now, oldRandom = Math.random;
  Date.now = () => 1700000000000; Math.random = () => .25;
  try {
    for (const difficulty of Object.keys(expected)) for (const explicit of [false, true]) {
      const { game } = bootGame();
      if (explicit) game.startNew(difficulty, '17117', 'classic'); else game.startNew(difficulty, '17117');
      const saved = game.serialize();
      const units = saved.units.map(({ squad, ...legacyUnit }) => legacyUnit);
      const legacy = { resources: saved.resources, player: saved.player, units, buildings: saved.buildings, nodes: game.world.nodes.map(node => [node.id, node.type, node.x, node.y, node.amount]), phaseTime: saved.phaseTime, nextId: saved.nextId, randomState: saved.randomState, worldSeed: saved.worldSeed };
      assert.equal(crypto.createHash('sha256').update(JSON.stringify(legacy)).digest('hex'), expected[difficulty]);
      assert.deepEqual(game.resources, S.initialState('classic', difficulty).resources);
      assert.equal(game.random.state, 2340875910);
    }
  } finally { Date.now = oldNow; Math.random = oldRandom; }
});

for (const scenario of S.list()) for (const difficulty of Object.keys(C.DIFFICULTIES)) {
  test('départ jouable : ' + scenario.id + ' / ' + difficulty + ' conserve stocks, équipe, contraintes et reprise', () => {
    const { game } = fresh(scenario.id, difficulty), initial = S.initialState(scenario.id, difficulty);
    assert.equal(game.scenarioId, scenario.id); assert.deepEqual(game.resources, initial.resources);
    assert.deepEqual(game.units.map(unit => unit.kind), initial.roster);
    assert.equal(game.population, initial.roster.length + 1); assert.ok(game.population <= game.housing);
    assert.equal(game.core().health, initial.coreHealth); assert.equal(game.phaseTime, initial.calmSeconds);
    assert.equal(game.tier.id, 0); assert.equal(game.objectiveIndex, 0); assert.equal(game.research.insight, 0);
    assert.equal(game.research.completed.length, 0); assert.equal(game.world.buildings.size, 1);
    assert.equal(game.canRecruit('soldier'), false, 'un soldat initial ne débloque pas une caserne ou un palier');
    assert.ok(game.units.every(unit => game.friendlyPositionClear(unit, unit.x, unit.y)));
    game.resources.wood -= 7; game.core().health -= 9; game.phaseTime -= 2; game.units[0].health -= 3;
    const before = { resources: { ...game.resources }, coreHealth: game.core().health, phaseTime: game.phaseTime, health: game.units[0].health, id: game.runId };
    assert.equal(game.save(false), true); assert.equal(game.load(), true);
    assert.equal(game.scenarioId, scenario.id); assert.equal(game.runId, before.id);
    assert.deepEqual(game.resources, before.resources); assert.equal(game.core().health, before.coreHealth);
    assert.equal(game.phaseTime, before.phaseTime); assert.equal(game.units[0].health, before.health);
    assert.deepEqual(game.profile.get().recentRuns.map(run => run.scenarioId), [scenario.id]);
    assert.ok(game.profile.get().byScenario[scenario.id][difficulty].peakPopulation >= initial.roster.length + 1);
  });
}

test('départs : changer seulement le scénario ne modifie ni les gisements ni les secteurs de la graine', () => {
  let baseline;
  for (const scenario of S.list()) {
    const { game } = fresh(scenario.id);
    const world = JSON.stringify({ nodes: game.world.nodes.map(node => [node.id, node.type, node.x, node.y, node.amount]), sites: game.world.sites });
    if (baseline === undefined) baseline = world; else assert.equal(world, baseline);
  }
});

test('variantes : toutes peuvent récolter, déposer et terminer le premier dortoir sans cadeau de ressources', () => {
  for (const scenario of S.list()) {
    const { game } = fresh(scenario.id), node = game.world.nodes.find(node => node.type === 'wood'), before = game.resources.wood;
    Object.assign(game.player, { x: node.x, y: node.y }); game.input.keys.add('KeyE');
    for (let step = 0; step < 25; step++) game.updateInteraction(.04);
    assert.ok(game.player.carry.wood > 0); const carried = game.player.carry.wood;
    Object.assign(game.player, { x: game.core().x, y: game.core().y }); game.updateInteraction(.04);
    assert.equal(game.player.carry.wood, 0); assert.ok(Math.abs(game.resources.wood - before - carried) < 1e-8);
    let cell = null;
    for (let y = 55; y <= 72 && !cell; y++) for (let x = 55; x <= 72; x++) if (game.world.placement(C.BUILDINGS.house, x, y, 0).valid) { cell = { x, y }; break; }
    assert.ok(cell); const stock = { ...game.resources };
    assert.equal(game.placeOne('house', cell.x, cell.y), true);
    const house = [...game.world.buildings.values()].find(building => building.type === 'house');
    Object.assign(game.player, { x: house.x, y: house.y });
    for (let step = 0; step < 150 && !house.completed; step++) game.updateInteraction(.04);
    assert.equal(house.completed, true); assert.equal(game.resources.wood, stock.wood - 70);
    assert.equal(game.resources.scrap, stock.scrap - 20); assert.ok(game.housing > game.population);
    assert.equal(game.save(false), true);
  }
});

test('reconstruction : le centre endommagé est réparable avec une dépense réelle et sans saut de palier', () => {
  const { game } = fresh('reconstruction'), stock = game.resources.scrap, core = game.core();
  game.selectBuilding(core); game.repairSelected();
  assert.equal(core.health, core.maxHealth); assert.equal(game.resources.scrap, stock - 29);
  assert.equal(game.tier.id, 0); assert.equal(game.world.buildings.size, 1);
});

test('migration : anciennes sauvegardes v1/v2 deviennent classiques sans réappliquer un départ', () => {
  const { game } = fresh('classic'), saved = game.serialize(); delete saved.scenarioId;
  saved.resources.wood = 19; saved.buildings[0].health = 1700;
  for (const version of [1, 2]) {
    const candidate = { ...saved, version };
    assert.equal(Save.validate(candidate).scenarioId, 'classic');
    assert.equal(game.restoreSave(candidate), true);
    assert.equal(game.scenarioId, 'classic'); assert.equal(game.resources.wood, 19); assert.equal(game.core().health, 1700);
  }
});

test('validation : départ inconnu refuse nouvelle partie et import avant toute mutation', () => {
  const { game } = fresh('convoy'), world = game.world, saved = game.serialize(), resources = { ...game.resources }, runId = game.runId;
  for (const id of [null, '', 'constructor', '__proto__', 'future']) {
    assert.equal(game.startNew('standard', '99', id), false);
    assert.equal(game.world, world); assert.equal(game.runId, runId); assert.equal(game.scenarioId, 'convoy'); assert.deepEqual(game.resources, resources);
    assert.throws(() => game.restoreSave({ ...saved, scenarioId: id }), /Départ/);
    assert.equal(game.world, world); assert.deepEqual(game.resources, resources);
  }
});

test('relance : après défaite, la même carte ou une nouvelle conserve le scénario avec une nouvelle campagne', () => {
  const { game, elements } = fresh('rearguard'), runId = game.runId, seed = game.world.seed;
  game.triggerGameOver(); elements.get('restartButton').click();
  assert.equal(game.scenarioId, 'rearguard'); assert.equal(game.world.seed, seed); assert.notEqual(game.runId, runId);
  const nextId = game.runId, oldNow = Date.now; game.triggerGameOver();
  Date.now = () => 1700000000011;
  try { elements.get('gameOverNewMapButton').click(); } finally { Date.now = oldNow; }
  assert.equal(game.scenarioId, 'rearguard'); assert.notEqual(game.runId, nextId); assert.notEqual(game.world.seed, seed);
  assert.equal(game.units.filter(unit => unit.kind === 'soldier').length, 1);
});

test('records : les quatre départs et les difficultés ne se mélangent jamais', () => {
  const storage = profileStore(), profile = P.create(storage);
  for (let index = 0; index < S.list().length; index++) {
    const id = S.list()[index].id;
    assert.equal(profile.record(snapshot(id, { wavesSurvived: index + 2 })).persisted, true);
    assert.equal(profile.record(snapshot(id, { runId: id + ':brutal', difficulty: 'brutal', wavesSurvived: index + 10 })).persisted, true);
  }
  const restored = P.load(storage).profile;
  for (let index = 0; index < S.list().length; index++) {
    const id = S.list()[index].id;
    assert.equal(restored.byScenario[id].standard.wavesSurvived, index + 2);
    assert.equal(restored.byScenario[id].brutal.wavesSurvived, index + 10);
    assert.equal(restored.byScenario[id].story.wavesSurvived, 0);
  }
  assert.deepEqual(restored.byDifficulty, restored.byScenario.classic);
  assert.equal(restored.recentRuns.length, 8);
});

test('records : mêmes runId et graine ne peuvent changer de départ ni effacer un record ancien', () => {
  const storage = profileStore(), profile = P.create(storage);
  profile.record(snapshot('classic', { wavesSurvived: 200 }));
  const before = profile.get(), raw = storage.getItem(P.PROFILE_KEY);
  const result = profile.record(snapshot('convoy', { runId: 'scenario:classic', wavesSurvived: 999 }));
  assert.equal(result.error.code, 'invalid-snapshot'); assert.deepEqual(profile.get(), before); assert.equal(storage.getItem(P.PROFILE_KEY), raw);
  for (let i = 0; i < 15; i++) profile.record(snapshot('convoy', { runId: 'convoy:' + i, wavesSurvived: i === 0 ? 77 : 1 }));
  assert.equal(profile.get().recentRuns.length, 10);
  assert.equal(profile.get().byScenario.convoy.standard.wavesSurvived, 77);
  assert.equal(profile.get().byScenario.classic.standard.wavesSurvived, 200);
});

test('records : migration v1 sans scénario préserve exclusivement les anciens records classiques', () => {
  const storage = profileStore(), original = P.create(storage);
  original.record(snapshot('classic', { wavesSurvived: 31 }));
  const legacy = JSON.parse(storage.getItem(P.PROFILE_KEY));
  delete legacy.byScenario; for (const run of legacy.recentRuns) delete run.scenarioId;
  storage.setItem(P.PROFILE_KEY, JSON.stringify(legacy)); storage.store.delete(P.BACKUP_KEY);
  const loaded = P.load(storage);
  assert.equal(loaded.error, null); assert.equal(loaded.profile.byScenario.classic.standard.wavesSurvived, 31);
  for (const id of ['convoy', 'reconstruction', 'rearguard']) assert.equal(loaded.profile.byScenario[id].standard.wavesSurvived, 0);
  assert.equal(loaded.profile.recentRuns[0].scenarioId, 'classic');
  const controller = P.create(storage); controller.record(snapshot('convoy', { wavesSurvived: 50 }));
  const next = P.load(storage).profile; assert.equal(next.byDifficulty.standard.wavesSurvived, 31); assert.equal(next.byScenario.convoy.standard.wavesSurvived, 50);
});

test('records : migration ou identité de scénario inconnue est refusée sans écrasement', () => {
  const storage = profileStore(), profile = P.create(storage);
  profile.record(snapshot('classic')); const before = profile.get(), raw = storage.getItem(P.PROFILE_KEY);
  for (const scenarioId of ['future', null, 'constructor']) {
    assert.equal(profile.record(snapshot(scenarioId)).error.code, 'invalid-snapshot');
    assert.deepEqual(profile.get(), before); assert.equal(storage.getItem(P.PROFILE_KEY), raw);
    const bad = JSON.parse(raw); bad.recentRuns[0].scenarioId = scenarioId; assert.throws(() => P.validate(bad), RangeError);
  }
});

test('menu départ : aperçu actualisé sans mutation et nouvelle partie utilise les sélections confirmées', () => {
  const { game, elements } = bootGame(), menu = elements.get('mainMenu');
  for (const id of ['startScenario', 'startScenarioDescription', 'startScenarioFacts']) menu.appendChild(document.getElementById(id));
  const select = elements.get('startScenario'); select.tagName = 'SELECT';
  delete require.cache[require.resolve('../src/scenario-ui.js')]; require('../src/scenario-ui.js');
  assert.equal(select.value, 'classic'); assert.equal(select.children.length, 4);
  assert.equal(select.getAttribute('aria-describedby'), 'startScenarioDescription startScenarioFacts');
  let difficulty = 'standard'; game.selectedDifficulty = () => difficulty;
  select.value = 'convoy'; select.dispatch('change');
  assert.match(elements.get('startScenarioFacts').textContent, /5 ouvriers/);
  assert.match(elements.get('startScenarioFacts').textContent, /nourriture 80/);
  assert.equal(game.state, 'menu'); assert.equal(game.scenarioId, 'classic');
  difficulty = 'story'; elements.get('difficultyStory').dispatch('change');
  assert.match(elements.get('startScenarioFacts').textContent, /nourriture 130/);
  assert.match(elements.get('startScenarioFacts').textContent, /Calme initial 01:39/);
  document.getElementById('mapSeed').value = '17117';
  assert.equal(game.requestNewGame(), true); assert.equal(game.scenarioId, 'convoy'); assert.equal(game.difficulty.id, 'story');
  assert.equal(game.resources.food, 130); assert.equal(game.units.length, 5);
  select.value = 'reconstruction'; select.dispatch('change');
  assert.equal(game.scenarioId, 'convoy'); assert.equal(game.core().health, 3200, 'un aperçu ne modifie pas la cité en cours');
});

test('records : contrôleurs concurrents et backup conservent les scénarios divergents séparés', () => {
  const storage = profileStore(), first = P.create(storage), second = P.create(storage);
  first.load(); second.load();
  first.record(snapshot('convoy', { wavesSurvived: 19 }));
  second.record(snapshot('reconstruction', { wavesSurvived: 23 }));
  first.record(snapshot('convoy', { wavesSurvived: 20 }));
  const restored = P.load(storage).profile;
  assert.equal(restored.byScenario.convoy.standard.wavesSurvived, 20);
  assert.equal(restored.byScenario.reconstruction.standard.wavesSurvived, 23);
  assert.equal(restored.byDifficulty.standard.wavesSurvived, 0);
  assert.equal(restored.recentRuns.length, 2);
  const controller = P.create(storage), previousPrimary = storage.getItem(P.PROFILE_KEY), write = storage.setItem;
  storage.setItem = (key, value) => { if (key === P.PROFILE_KEY) throw new Error('quota'); return write(key, value); };
  const failed = controller.record(snapshot('rearguard', { wavesSurvived: 35 }));
  assert.equal(failed.persisted, false); assert.equal(storage.getItem(P.PROFILE_KEY), previousPrimary);
  assert.equal(P.load(storage).profile.byScenario.convoy.standard.wavesSurvived, 20);
  storage.setItem = write; assert.equal(controller.save().persisted, true);
  assert.equal(P.load(storage).profile.byScenario.rearguard.standard.wavesSurvived, 35);
  assert.equal(P.load(storage).profile.byDifficulty.standard.wavesSurvived, 0);
});

test('identité : fichiers sans runId séparent les départs et conservent l’ancien nom classique', () => {
  const { game } = fresh('classic'), data = game.serialize(); delete data.runId;
  for (const scenario of S.list()) {
    const saved = Save.validate({ ...data, scenarioId: scenario.id });
    const suffix = scenario.id === 'classic' ? '' : ':' + scenario.id;
    assert.equal(saved.runId, 'legacy:standard:17117' + suffix);
    const profile = P.create(profileStore());
    const result = profile.record(snapshot(scenario.id, { runId: undefined }));
    assert.equal(result.profile.recentRuns[0].runId, saved.runId);
  }
});
