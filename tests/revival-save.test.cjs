'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const C = require('../src/core.js');
const Save = require('../src/save.js');

function revive(game, step) {
  const limit = Math.ceil(game.player.downTimer / step) + 2;
  for (let tick = 0; game.player.dead && tick < limit; tick++) game.updatePlayer(step);
  assert.equal(game.player.dead, false);
  assert.equal(game.player.health, game.player.maxHealth);
  assert.equal(game.player.downTimer, 0, 'le dépassement du dernier pas ne fuit pas dans la sauvegarde');
}

test('réanimation : les pas réels non divisibles conservent sauvegarde et export valides', () => {
  for (const step of [.04, .017, 1 / 60]) {
    const { game, storage } = bootGame();
    game.startNew('standard', '17117');
    game.player.carry.wood = 20;
    game.damagePlayer(1000);
    revive(game, step);
    assert.equal(game.player.carry.wood, 10, 'une seule pénalité de réanimation');
    assert.doesNotThrow(() => Save.validate(game.serialize()));
    assert.equal(game.save(false), true);
    assert.equal(Save.parse(storage.get(C.SAVE_KEY)).player.downTimer, 0);
    assert.equal(game.load(), true);
    assert.equal(game.player.dead, false);
    for (let tick = 0; tick < 10; tick++) game.updatePlayer(step);
    assert.equal(game.player.carry.wood, 10, 'la reprise ne réapplique pas la pénalité');
    assert.equal(game.save(false), true);
  }
});

test('réanimation : checkpoint à terre repris puis dépassé reste enregistrable', () => {
  const { game } = bootGame();
  game.startNew('standard', '17117');
  game.damagePlayer(1000);
  game.player.downTimer = .023;
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.equal(game.player.dead, true);
  assert.equal(game.player.downTimer, .023);
  revive(game, .04);
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.equal(game.player.downTimer, 0);
  assert.equal(game.player.dead, false);
});

test('réanimation : export UI et retour menu utilisent la cité réanimée courante', async () => {
  const { game, elements, storage } = bootGame();
  delete require.cache[require.resolve('../src/ui.js')];
  require('../src/ui.js');
  game.startNew('standard', '17117');
  game.resources.wood = 17;
  game.damagePlayer(1000);
  revive(game, .04);
  game.showSettings(true);
  assert.equal(game.lastSaveStatus.ok, true);
  let exported;
  const create = URL.createObjectURL;
  URL.createObjectURL = blob => { exported = blob; return create(blob); };
  try { elements.get('settingsExport').click(); } finally { URL.createObjectURL = create; }
  assert.ok(exported, 'un vrai Blob exportable est créé depuis la mémoire courante');
  const data = Save.parse(await exported.text());
  assert.equal(data.resources.wood, 17);
  assert.equal(data.player.downTimer, 0);
  assert.equal(data.player.dead, false);
  game.showSettings(false);
  game.returnToMenu();
  assert.equal(game.state, 'menu');
  assert.equal(game.lastSaveStatus.ok, true);
  assert.equal(JSON.parse(storage.get(C.SAVE_KEY)).resources.wood, 17);
  assert.equal(game.load(), true);
  assert.equal(game.player.dead, false);
  assert.equal(game.player.downTimer, 0);
});
