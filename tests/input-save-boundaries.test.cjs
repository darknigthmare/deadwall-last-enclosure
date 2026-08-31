'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const C = require('../src/core.js');
const Save = require('../src/save.js');
const clone = value => JSON.parse(JSON.stringify(value));
const MAX_ID = 0x7ffffffe;

function optionsGame() {
  const env = bootGame();
  delete require.cache[require.resolve('../src/ui.js')];
  require('../src/ui.js');
  env.game.startNew('standard', '17117');
  return env;
}

test('Échap : une pression ouvre la pause ; la répétition ne reprend ni ne sauvegarde de nouveau', () => {
  const { game, dispatchWindow } = optionsGame();
  let saves = 0;
  const save = game.save.bind(game);
  game.save = (...args) => { saves++; return save(...args); };
  const pressed = dispatchWindow('keydown', { code: 'Escape', repeat: false });
  assert.equal(pressed.defaultPrevented, true);
  assert.equal(game.paused, true);
  assert.equal(game.activeOverlay, game.ui.pauseMenu);
  for (let index = 0; index < 10; index++) {
    assert.equal(dispatchWindow('keydown', { code: 'Escape', repeat: true }).defaultPrevented, true);
    assert.equal(game.paused, true);
    assert.equal(game.activeOverlay, game.ui.pauseMenu);
  }
  assert.equal(saves, 1, 'une seule sauvegarde pour une pression maintenue');
  dispatchWindow('keyup', { code: 'Escape' });
  dispatchWindow('keydown', { code: 'Escape', repeat: false });
  assert.equal(game.paused, false);
  assert.equal(game.activeOverlay, null);
});

for (const overlay of ['settings', 'help']) {
  test('Échap : fermer ' + overlay + ' ne traverse pas la pause pendant la répétition', () => {
    const { game, dispatchWindow } = optionsGame();
    game.togglePause(true);
    if (overlay === 'settings') game.showSettings(true); else game.showHelp(true);
    dispatchWindow('keydown', { code: 'Escape', repeat: false });
    const focus = document.activeElement;
    assert.equal(game.paused, true);
    assert.equal(game.activeOverlay, game.ui.pauseMenu);
    for (let index = 0; index < 10; index++) dispatchWindow('keydown', { code: 'Escape', repeat: true });
    assert.equal(game.paused, true);
    assert.equal(game.activeOverlay, game.ui.pauseMenu);
    assert.equal(document.activeElement, focus);
    dispatchWindow('keyup', { code: 'Escape' });
    dispatchWindow('keydown', { code: 'Escape', repeat: false });
    assert.equal(game.paused, false);
  });
}

test('Échap : annuler un placement ne met pas la simulation en pause par répétition', () => {
  const { game, dispatchWindow } = optionsGame();
  game.selectBuild('house');
  dispatchWindow('keydown', { code: 'Escape', repeat: false });
  assert.equal(game.selectedBuild, null);
  for (let index = 0; index < 10; index++) dispatchWindow('keydown', { code: 'Escape', repeat: true });
  assert.equal(game.paused, false);
  assert.equal(game.activeOverlay, null);
  assert.equal(game.input.pressed.has('Escape'), false);
  assert.equal(game.input.keys.has('Escape'), false);
});

function exhaustedCandidates(snapshot) {
  const counter = clone(snapshot); counter.nextId = MAX_ID;
  const derivedCounter = clone(snapshot); derivedCounter.buildings[0].id = MAX_ID - 1; derivedCounter.nextId = 1;
  const exhaustedEntity = clone(snapshot); exhaustedEntity.units[0].id = MAX_ID; exhaustedEntity.nextId = 1;
  const zombie = clone(snapshot); zombie.zombies = [{id:MAX_ID - 1,kind:'walker',x:100,y:100,health:10,attackCooldown:0}]; zombie.nextId = 1;
  return [counter, derivedCounter, exhaustedEntity, zombie];
}

test('IDs : compteur épuisé ou déduit des entités refusé sans mutation, en v1 et v2', () => {
  const { game, storage } = optionsGame(), world = game.world, player = game.player;
  const original = clone(game.serialize()), primary = storage.get(C.SAVE_KEY);
  for (const candidate of exhaustedCandidates(original)) for (const version of [1, 2]) {
    candidate.version = version;
    const input = JSON.stringify(candidate);
    assert.throws(() => Save.parse(input), /prochain ID/);
    assert.throws(() => game.restoreSave(candidate), /prochain ID/);
    assert.equal(JSON.stringify(candidate), input, 'aucune réindexation silencieuse du fichier');
    assert.equal(game.world, world); assert.equal(game.player, player);
    assert.deepEqual(game.resources, original.resources);
    assert.equal(game.nextId, original.nextId);
    assert.equal(storage.get(C.SAVE_KEY), primary);
  }
});

test('IDs : import UI épuisé refusé avant aperçu, confirmation et remplacement du stockage', async () => {
  const { game, elements, storage } = optionsGame();
  game.showSettings(true);
  const original = clone(game.serialize()), world = game.world;
  const primary = storage.get(C.SAVE_KEY), backup = storage.get(C.SAVE_BACKUP_KEY);
  const input = elements.get('settingsImportFile'), read = input._listeners.get('change')[0];
  for (const candidate of exhaustedCandidates(original)) {
    candidate.worldSeed = 42;
    input.files = [{size:2048,text:async()=>JSON.stringify(candidate)}]; input.value = 'exhausted.json';
    await read({ target:input });
    assert.match(elements.get('settingsStatus').textContent, /Import refusé.*prochain ID.*partie actuelle reste intacte/);
    assert.equal(input.value, '');
    assert.equal(elements.get('settingsImportReview').classList.contains('hidden'), true);
    elements.get('settingsImportConfirm').dispatch('click');
    assert.equal(game.world, world); assert.equal(game.world.seed, 17117);
    assert.equal(storage.get(C.SAVE_KEY), primary); assert.equal(storage.get(C.SAVE_BACKUP_KEY), backup);
    assert.equal(game.activeOverlay, game.ui.settingsModal);
    assert.equal(game.paused, true);
  }
});

test('IDs : une reprise acceptée reste immédiatement sauvegardable, sans consommer le compteur', () => {
  const { game, storage } = optionsGame();
  const snapshot = clone(game.serialize());
  for (const nextId of [snapshot.nextId, 100000, MAX_ID - 1]) {
    game.restoreSave({ ...snapshot, nextId });
    for (let repeat = 0; repeat < 4; repeat++) {
      assert.equal(game.player.id, 0, 'identité réservée, non sérialisée, du commandant');
      assert.equal(game.nextId, nextId);
      assert.equal(game.save(false), true);
      const saved = Save.parse(storage.get(C.SAVE_KEY));
      assert.equal(saved.nextId, nextId);
      assert.deepEqual(Save.validate(saved), saved, 'validation idempotente à la borne acceptée');
      assert.deepEqual(saved.units, snapshot.units);
      assert.deepEqual(saved.buildings, snapshot.buildings);
      assert.deepEqual(saved.resources, snapshot.resources);
      assert.equal(saved.randomState, snapshot.randomState);
      assert.equal(game.load(), true);
    }
  }
});

test('IDs : compteur ordinaire conservé puis construction, recrutement, tir et apparition allouent sans collision', () => {
  const { game, storage } = optionsGame();
  const original = clone(game.serialize()), firstId = original.nextId;
  for (let repeat = 0; repeat < 3; repeat++) game.restoreSave(game.serialize());
  assert.equal(game.nextId, firstId);
  assert.equal(game.random.state, original.randomState, 'la reprise ne consomme pas le RNG de simulation');
  let cell = null;
  for (let y = 55; y <= 72 && !cell; y++) for (let x = 55; x <= 72; x++) {
    if (game.world.placement(C.BUILDINGS.woodWall, x, y, 0).valid) { cell = {x,y}; break; }
  }
  assert.ok(cell);
  const before = clone(game.resources);
  assert.equal(game.placeOne('woodWall', cell.x, cell.y), true);
  assert.equal(game.recruit('worker'), true);
  game.shootPlayer(); assert.equal(game.spawnZombie('walker'), true);
  assert.equal(game.nextId, firstId + 4);
  const all = [...game.world.buildings.values(), ...game.units, ...game.projectiles, ...game.zombies];
  assert.equal(new Set(all.map(entity=>entity.id)).size, all.length);
  assert.ok(all.every(entity=>entity.id>0));
  assert.equal(game.projectiles[0].id, firstId + 2);
  assert.equal(game.zombies[0].id, firstId + 3);
  assert.equal(game.player.magazine.pistol, original.player.magazine.pistol - 1);
  for (const key of C.RESOURCE_KEYS) assert.equal(game.resources[key], before[key] - (C.BUILDINGS.woodWall.cost[key] || 0) - (C.SURVIVORS.worker.cost[key] || 0));
  const beforeSave = Save.validate(game.serialize());
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  const saved = Save.parse(storage.get(C.SAVE_KEY));
  assert.equal(game.nextId, firstId + 4);
  assert.deepEqual(saved.units, beforeSave.units); assert.deepEqual(saved.buildings, beforeSave.buildings);
  assert.deepEqual(saved.zombies, beforeSave.zombies);
});
