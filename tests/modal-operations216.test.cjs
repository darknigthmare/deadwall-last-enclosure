'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { prepare, freeCell } = require('./helpers/city-content150.cjs');
const { build: support, ascend } = require('./helpers/vertical177.cjs');

function setup() {
  const env = bootDocument134(), { g } = env;
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  g.render = () => {}; g.setBuildCollapsed(true);
  for (const drawer of g.ui.hud.querySelectorAll('details')) drawer.open = false;
  g.canvas.focus();
  return env;
}

function escape(env, repeat = false) {
  const event = env.dispatchWindow('keydown', { code: 'Escape', key: 'Escape', repeat, target: env.doc.activeElement });
  assert.equal(event.defaultPrevented, true);
  if (!repeat) env.dispatchWindow('keyup', { code: 'Escape', key: 'Escape', target: env.doc.activeElement });
}

function settingsFromPause(env) {
  const { g, doc } = env;
  doc.getElementById('pauseButton').click();
  assert.ok(g.activeOverlay === g.ui.pauseMenu);
  const button = doc.getElementById('pauseSettingsButton'); button.focus(); button.click();
  assert.ok(g.activeOverlay === g.ui.settingsModal);
}

function atBuilding(g, building) {
  const point = g.fieldcraft.service(g.player, building);
  assert.ok(point, 'la fixture possède un vrai accès de service');
  Object.assign(g.player, point);
}

test('216 Échap ferme les menus avant de quitter le mirador ou la réimplantation, et annule le devis visible', () => {
  const env = setup(), { g, doc } = env;
  // Declared fixture: completed buildings on positions accepted by the existing
  // placement owner; their manual control, quote and cancellation stay native.
  const tower = prepare(g, 'watchtower'); atBuilding(g, tower);
  assert.equal(g.fieldcraft.control(tower), true);
  const stock = JSON.stringify(g.resources), elapsed = g.elapsed;
  settingsFromPause(env); escape(env);
  assert.ok(g.activeOverlay === g.ui.pauseMenu, 'Échap ferme Paramètres avant toute opération de terrain');
  assert.equal(g.paused, true); assert.equal(g.fieldcraft.context().mounted, tower.id);
  assert.equal(doc.activeElement.id, 'pauseSettingsButton');
  for (let i = 0; i < 3; i++) escape(env, true);
  assert.ok(g.activeOverlay === g.ui.pauseMenu); assert.equal(g.fieldcraft.context().mounted, tower.id);
  escape(env);
  assert.equal(g.activeOverlay?.id || null, null); assert.equal(g.paused, false);
  assert.equal(g.fieldcraft.context().mounted, tower.id, 'Reprendre conserve le poste manuel');
  g.canvas.focus(); escape(env);
  assert.equal(g.fieldcraft.context().mounted, null, 'sur le terrain, Échap rend toujours le poste à son propriétaire');
  assert.equal(g.activeOverlay?.id || null, null); assert.equal(g.elapsed, elapsed); assert.equal(JSON.stringify(g.resources), stock);

  const house = prepare(g, 'house'); atBuilding(g, house);
  assert.equal(g.fieldcraft.beginMove(house), true);
  const moving = g.fieldcraft.context().moving;
  settingsFromPause(env); escape(env);
  assert.ok(g.activeOverlay === g.ui.pauseMenu); assert.equal(g.fieldcraft.context().moving, moving);
  escape(env); assert.equal(g.fieldcraft.context().moving, moving);
  const destination = freeCell(g, 'house'), quote = g.fieldcraft.plan(destination.gx, destination.gy);
  assert.equal(quote.ok, true, quote.reason);
  const before = JSON.stringify(g.resources), origin = [house.gx, house.gy, house.rotation];
  g.fieldcraftUI.showBuilding(house, quote);
  const review = doc.getElementById('buildingReview14');
  assert.ok(g.ui.commandModal.contains(review)); assert.ok(!review.closest('.hidden, [inert]'), 'le devis est visible dans son panneau');
  // A higher menu must not consume the command post's pending quote.
  g.showHelp(true); escape(env);
  assert.ok(g.activeOverlay === g.ui.commandModal); assert.ok(g.fieldcraft.context().quote);
  escape(env);
  assert.ok(g.activeOverlay === g.ui.commandModal, 'le devis visible conserve son annulation dans le carnet');
  assert.equal(g.fieldcraft.context().quote, null); assert.equal(g.fieldcraft.context().moving, null);
  assert.equal(review.classList.contains('hidden'), true);
  assert.deepEqual([house.gx, house.gy, house.rotation], origin); assert.equal(JSON.stringify(g.resources), before);
  escape(env); assert.equal(g.activeOverlay?.id || null, null);
  assert.equal(g.fieldcraft.beginMove(house), true); g.canvas.focus(); escape(env);
  assert.equal(g.fieldcraft.context().moving, null, 'sur le terrain, Échap annule encore le déplacement');
  assert.equal(JSON.stringify(g.resources), before);
});

test('216 Échap ferme Paramètres puis Pause sans interrompre un escalier ni un chantier vertical financé', () => {
  const env = setup(), { g } = env;
  // Existing advanced fixture: prepared age/resources, native paid support
  // placement, explicit support completion. Travel and module work remain native.
  const data = g.serialize(); data.urban.peakScore = 2200; data.urban.progression151 = { version: 1, age: 10 };
  data.resources = { wood: 3000, scrap: 3000, stone: 3000, food: 3000, fuel: 2000, ammo: 3000, medicine: 50 };
  assert.equal(g.restoreSave(data), true);
  const building = support(g);
  // Restoring the prepared world opens its map drawer. Close that actual HUD
  // owner first so the later field Escape is specifically testing the operation.
  const map = g.hud135.regions().map;
  if (map.open) { map.querySelector('summary').focus(); escape(env); }
  assert.equal(map.open, false); g.canvas.focus();
  assert.equal(g.vertical175.access(building.id).ok, true); g.vertical175.step(.5);
  const start = g.vertical175.pose(), stock = JSON.stringify(g.resources);
  assert.ok(start.travel && start.z > 0);
  settingsFromPause(env); escape(env);
  assert.ok(g.activeOverlay === g.ui.pauseMenu, 'Échap ferme Paramètres sans supprimer le trajet');
  assert.equal(g.paused, true); assert.equal(g.vertical175.busy(), true);
  g.vertical175.step(2);
  assert.deepEqual(g.vertical175.pose(), start, 'la pause conserve exactement le palier et la progression du trajet');
  for (let i = 0; i < 3; i++) escape(env, true);
  assert.deepEqual(g.vertical175.pose(), start); assert.ok(g.activeOverlay === g.ui.pauseMenu);
  escape(env);
  assert.equal(g.activeOverlay?.id || null, null); assert.equal(g.paused, false); assert.equal(g.vertical175.busy(), true);
  g.vertical175.step(.5); assert.ok(g.vertical175.pose().z > start.z, 'le même trajet reprend au temps actif');
  g.canvas.focus(); escape(env);
  assert.equal(g.vertical175.busy(), false); assert.equal(g.vertical175.pose().z, 0);
  assert.equal(g.vertical175.pose().travel, null); assert.equal(JSON.stringify(g.resources), stock);

  ascend(g, building); Object.assign(g.player, { x: building.x, y: building.y });
  assert.equal(g.vertical175.buildModule('quarters', 0).ok, true); g.vertical175.step(.5);
  const module = () => g.vertical175.snapshot().sites.find(site => site.id === building.id).decks[0].modules[0];
  const initial = module(), paid = JSON.stringify(g.resources);
  assert.ok(initial.progress > 0 && initial.progress < 1);
  settingsFromPause(env); escape(env);
  assert.ok(g.activeOverlay === g.ui.pauseMenu); assert.equal(g.vertical175.busy(), true);
  g.vertical175.step(2); assert.deepEqual(module(), initial);
  escape(env); assert.equal(g.activeOverlay?.id || null, null); assert.equal(g.vertical175.busy(), true);
  g.vertical175.step(.5); const continued = module(); assert.ok(continued.progress > initial.progress);
  g.canvas.focus(); escape(env);
  assert.equal(g.vertical175.busy(), false); assert.deepEqual(module(), continued, 'l’annulation terrain conserve le chantier financé');
  assert.equal(JSON.stringify(g.resources), paid, 'la navigation et la reprise ne paient pas une deuxième fois');
});
