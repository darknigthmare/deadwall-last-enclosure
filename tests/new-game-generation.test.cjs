'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument133 } = require('./helpers/document133.cjs');
const { legacy } = require('./helpers/generation141.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const checkpoint = g => { const value = copy(g.serialize()); delete value.timestamp; return value; };

function click(g, button) {
  assert.ok(document.body.contains(button), 'The shipped menu button is mounted');
  assert.equal(button.disabled, false);
  assert.equal(button.closest('[inert], .hidden'), null);
  button.click();
}

function currentRegion(env, seed) {
  const g = env.g, world = g.frontier.world();
  assert.equal(g.state, 'playing');
  assert.equal(g.frontier.position().generation, 8);
  assert.equal(world.generation, 8);
  assert.equal(g.world.seed, seed);
  assert.equal(world.seed, seed);
  assert.equal(globalThis.DeadwallCodex3000Runtime.summary().count, 3000);
  assert.ok(world.pois.some(p => p.generation === 8 && p.programme3000), 'Current Codex programme parcels must actually exist');
  assert.equal(g.worldOps131.actions().some(a => a.id === 'expandCodex3000'), false, 'New campaigns require no manual Codex activation');
  const saved = globalThis.DeadwallSave.parse(env.storage.get(globalThis.DeadwallCore.SAVE_KEY));
  assert.equal(saved.frontier.generation, 8, 'The first automatic save must already use G8');
  assert.equal(saved.worldSeed, seed);
  assert.equal(saved.runId, g.runId);
  return world;
}

function confirmReplacement(t, answer) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'confirm'), messages = [];
  globalThis.confirm = message => { messages.push(message); return answer; };
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, 'confirm', descriptor); else delete globalThis.confirm; });
  return messages;
}

function geometry(world) {
  return { home: copy(world.home), roads: copy(world.roads), sites: world.pois.map(p => [p.id, p.type, p.programme3000 || null, p.x, p.y, p.w, p.h, p.a, p.levels]) };
}

// Prepared exterior/interior position skips travel only. The container comes
// from the generated plan; collision, targeting, locks and the E harvest run
// through the existing controllers without changing their quantities or rules.
function harvestContainer(g, generation) {
  const w = g.frontier.world(), C = globalThis.DeadwallCore, G = globalThis.DeadwallFrontierGeometry, Survey = globalThis.DeadwallFrontierSurvey;
  let fixture;
  for (const p of w.pois.filter(p => p.generation === generation && p.occupation === 'empty')) {
    for (const object of w.plan(p, 0).objects) {
      if (object.amount > g.player.carryCapacity) continue;
      const center = G.global(p, object.x + object.w / 2, object.y + object.h / 2);
      for (let radius = .4; radius < 2.5 && !fixture; radius += .2) for (let angle = 0; angle < 16; angle++) {
        const point = { x: center.x + Math.cos(angle * Math.PI / 8) * radius, y: center.y + Math.sin(angle * Math.PI / 8) * radius, z: 0, inside: p.id };
        if (w.blocked(point.x, point.y, .32, 0, p.id)) continue;
        const item = Survey.targets(w, point, {}, C.Frontier.RULES.lootReach).find(o => o.id === object.id && o.amount > 0 && !g.interventions134.blocksLoot(o));
        if (item) { fixture = { point, item }; break; }
      }
      if (fixture) break;
    }
    if (fixture) break;
  }
  assert.ok(fixture, 'The generated region has a physically reachable, unlocked finite container');
  // Independent worker deposits must not be mistaken for duplicated container
  // loot while the full simulation runs this isolated player transaction.
  const workerOrder = g.workerOrder;
  assert.equal(g.setWorkerOrder('retreat'), true);
  const { point, item } = fixture, raw = g.serialize();
  Object.assign(raw.frontier, { ...point, active: true, anchor: { x: g.player.x, y: g.player.y } });
  assert.equal(g.restoreSave(raw), true);
  g.update(.04);
  for (let i = 0; i < 32 && g.frontier.overview().focus?.id !== item.id; i++) g.frontier.cycle();
  assert.equal(g.frontier.overview().focus?.id, item.id);
  const bag = g.player.carry[item.resource], stock = copy(g.resources);
  g.input.keys.add('KeyE');
  try { for (let i = 0; i < 600 && g.frontier.takenAmount(item.id) < item.amount; i++) g.update(.04); }
  finally { g.input.keys.clear(); assert.equal(g.setWorkerOrder(workerOrder), true); }
  assert.equal(g.frontier.takenAmount(item.id), item.amount, 'The real E interaction depletes the whole container');
  assert.equal(g.player.carry[item.resource], bag + item.amount);
  // Full simulation updates consume colony rations during the E action.
  // The recovered material must enter the bag without replenishing the depot.
  for (const key of C.RESOURCE_KEYS) assert.ok(g.resources[key] <= stock[key], key + ' was duplicated into the depot');
  assert.equal(g.save(false), true);
  return item;
}

test('Nouvelle partie: the shipped document starts current G8, and a different seed changes its map', t => {
  const env = bootDocument133(), g = env.g;
  const messages = confirmReplacement(t, true);
  assert.equal(g.startupReady, false);
  assert.equal(g.ui.newGameButton.disabled, true);
  g.ui.newGameButton.click();
  assert.equal(g.state, 'menu');
  env.ready();
  document.getElementById('mapSeed').value = '17117';
  click(g, g.ui.newGameButton);
  const initial = geometry(currentRegion(env, 17117)), run = g.runId;
  assert.equal(messages.length, 0, 'Fresh storage has no campaign to replace');
  assert.equal(g.campaignIntro132.isOpen(), true);
  g.campaignIntro132.skip();
  g.returnToMenu();
  document.getElementById('mapSeed').value = '84329';
  click(g, g.ui.newGameButton);
  const next = geometry(currentRegion(env, 84329));
  assert.equal(messages.length, 1);
  assert.notEqual(g.runId, run);
  assert.notDeepEqual(next.home, initial.home);
  assert.notDeepEqual(next.roads, initial.roads);
  assert.notDeepEqual(next.sites, initial.sites);
  g.campaignIntro132.skip();
  g.returnToMenu();
  document.getElementById('mapSeed').value = '';
  click(g, g.ui.newGameButton);
  assert.notEqual(g.world.seed, 84329, 'An empty seed field starts a fresh map');
  currentRegion(env, g.world.seed);
});

test('Nouvelle partie: finishing the introduction after focus loss keeps the same G8 campaign through Pause and Reprendre', () => {
  const env = bootDocument133(); env.ready();
  const g = env.g;
  document.getElementById('mapSeed').value = '84329'; click(g, g.ui.newGameButton);
  const region = currentRegion(env, 84329), local = g.world, expected = checkpoint(g), map = geometry(region);
  assert.equal(g.frontier.active(), false, 'Arrival is at the D-17 depot within the current region');
  assert.ok(g.world.nodes.some(n => !n.depleted && n.amount > 0));
  assert.ok(g.world.buildings.has(g.core().id));
  assert.equal(g.activeOverlay, g.campaignIntro132.element);
  assert.equal(g.ui.pauseMenu.classList.contains('hidden'), true);
  env.dispatchWindow('blur'); env.dispatchWindow('focus');
  assert.equal(g.campaignIntro132.isOpen(), true); assert.equal(g.paused, true);
  click(g, g.campaignIntro132.element.querySelector('#campaignIntro132Skip'));
  assert.equal(g.paused, false); assert.equal(g.activeOverlay, null);
  assert.equal(g.ui.pauseMenu.classList.contains('hidden'), true);
  click(g, document.getElementById('pauseButton'));
  assert.equal(g.activeOverlay, g.ui.pauseMenu);
  click(g, document.getElementById('resumeButton'));
  assert.equal(g.paused, false); assert.equal(g.activeOverlay, null);
  assert.equal(g.world, local); assert.equal(g.frontier.world(), region);
  assert.deepEqual(checkpoint(g), expected, 'Pause and Reprendre never replace, migrate or reset the new campaign');
  assert.deepEqual(geometry(g.frontier.world()), map);
  assert.equal(g.save(false), true);
  const saved = globalThis.DeadwallSave.parse(env.storage.get(globalThis.DeadwallCore.SAVE_KEY));
  assert.equal(saved.runId, expected.runId); assert.equal(saved.worldSeed, 84329); assert.equal(saved.frontier.generation, 8);
});

test('Continuer: current G8 keeps its seed, actual programme container depletion and carried loot after restarting the document', () => {
  const original = bootDocument133(); original.ready();
  const g = original.g;
  document.getElementById('mapSeed').value = '17117'; click(g, g.ui.newGameButton);
  currentRegion(original, 17117); g.campaignIntro132.skip();
  const item = harvestContainer(g, 8), expected = checkpoint(g), map = geometry(g.frontier.world());
  const restored = bootDocument133({ storageEntries: original.storage }); restored.ready();
  assert.equal(restored.g.state, 'menu');
  click(restored.g, restored.g.ui.continueButton);
  assert.equal(restored.g.state, 'playing');
  assert.equal(restored.g.campaignIntro132.isOpen(), false);
  assert.deepEqual(checkpoint(restored.g), expected);
  assert.deepEqual(geometry(restored.g.frontier.world()), map);
  assert.equal(restored.g.frontier.takenAmount(item.id), item.amount);
  const focus = globalThis.DeadwallFrontierSurvey.targets(restored.g.frontier.world(), restored.g.frontier.position(), restored.g.frontier.snapshot().taken).find(o => o.id === item.id);
  assert.ok(focus); assert.equal(focus.left, 0, 'A restored empty container does not refill');
});

test('G7 compatibility: Continuer and cancelled replacement preserve the old campaign; confirmed Nouvelle partie uses G8', t => {
  const original = bootDocument133(); original.ready();
  const old = original.g;
  document.getElementById('mapSeed').value = '17117'; click(old, old.ui.newGameButton); old.campaignIntro132.skip();
  legacy(old, 7);
  assert.equal(old.frontier.position().generation, 7);
  const item = harvestContainer(old, 7), expected = checkpoint(old), map = geometry(old.frontier.world());
  const restored = bootDocument133({ storageEntries: original.storage }); restored.ready();
  const g = restored.g, messages = confirmReplacement(t, false);
  click(g, g.ui.continueButton);
  assert.equal(messages.length, 0);
  assert.equal(g.frontier.position().generation, 7);
  assert.ok(g.worldOps131.actions().some(a => a.id === 'expandCodex3000'), 'Preserved G7 campaigns retain their manual extension action');
  assert.deepEqual(checkpoint(g), expected);
  assert.deepEqual(geometry(g.frontier.world()), map);
  assert.equal(g.frontier.takenAmount(item.id), item.amount);
  assert.equal(g.frontier.world().pois.some(p => p.generation === 8), false);
  g.returnToMenu();
  const world = g.world, unchanged = checkpoint(g), bytes = new Map(restored.storage);
  document.getElementById('mapSeed').value = '17117';
  click(g, g.ui.newGameButton);
  assert.equal(messages.length, 1); assert.match(messages[0], /Remplacer la campagne/);
  assert.equal(g.state, 'menu'); assert.equal(g.world, world);
  assert.deepEqual(checkpoint(g), unchanged);
  assert.deepEqual(restored.storage, bytes, 'Cancellation must not rewrite any saved campaign or profile');
  globalThis.confirm = () => true;
  click(g, g.ui.newGameButton);
  currentRegion(restored, 17117);
  assert.notEqual(g.runId, expected.runId);
  assert.equal(g.elapsed, 0);
  assert.deepEqual(g.frontier.snapshot().taken, {});
  assert.equal(globalThis.DeadwallCore.bagTotal(g.player.carry), 0);
});
