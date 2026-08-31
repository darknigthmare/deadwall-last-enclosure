'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const Save = require('../src/save.js');
const { bootGame } = require('./helpers/browser.cjs');

function fresh() {
  const env = bootGame(); env.game.startNew('standard', '17117');
  env.game.input.keys.add('KeyE');
  return env;
}
function closeTo(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-8, actual + ' / ' + expected); }
function atCore(game, dx = 0, dy = 0) {
  game.player.x = game.core().x + dx; game.player.y = game.core().y + dy;
}
function add(game, type, gx, gy, progress = 1) {
  const building = new (game.core().constructor)(game.nextId++, type, gx, gy, 0, progress);
  game.world.add(building); game.refreshMetrics(true); return building;
}

test('tutoriel : la récolte non déposée ne fait jamais monter puis retomber le compteur', () => {
  const { game } = fresh(), node = game.world.nodes.find(candidate => candidate.type === 'wood');
  // Isolate manual collection; this is a feedback fixture, not a campaign balance test.
  game.units = []; game.player.x = node.x; game.player.y = node.y;
  for (let step = 0; step < 51; step++) {
    game.update(.04);
    assert.equal(game.depositedResources, 0);
    assert.equal(game.objectiveProgress, 0);
    assert.equal(game.ui.objectiveCounter.textContent, '0 / 30');
  }
  closeTo(game.player.carry.wood, 20.4); closeTo(game.stats.gathered, 20.4);
  atCore(game); game.updateInteraction(.04); game.updateObjective(); game.updateUI();
  closeTo(game.depositedResources, 20.4); closeTo(game.objectiveProgress, 20.4);
  assert.equal(game.ui.objectiveCounter.textContent, '20 / 30');
  const saved = Save.validate(game.serialize()); assert.equal(saved.objectiveIndex, 0); closeTo(saved.objectiveProgress, 20.4);
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  closeTo(game.objectiveProgress, 20.4); closeTo(game.depositedResources, 20.4);
});

test('tutoriel : le dépôt valide la première récompense une seule fois sans récompenser le portage', () => {
  const { game } = fresh(); atCore(game); game.player.carry.wood = 30;
  const before = { ...game.resources };
  game.updateObjective(); assert.equal(game.objectiveIndex, 0); assert.equal(game.objectiveProgress, 0);
  game.updateInteraction(.04); game.updateObjective();
  assert.equal(game.objectiveIndex, 1); assert.equal(game.player.carry.wood, 0);
  assert.equal(game.resources.wood, before.wood + 30 + C.OBJECTIVES[0].reward.wood);
  assert.equal(game.resources.scrap, before.scrap + C.OBJECTIVES[0].reward.scrap);
  const rewarded = { ...game.resources }; game.updateObjective(); game.updateInteraction(.04);
  assert.deepEqual(game.resources, rewarded);
});

test('dépôt partiel : le libellé annonce la place réelle et le sac conserve les excédents de chaque ressource', () => {
  const { game } = fresh(); atCore(game);
  game.resources.wood = game.storage; game.resources.scrap = game.storage - 3; game.resources.stone = game.storage - 2;
  game.player.carry.wood = 10; game.player.carry.scrap = 8; game.player.carry.stone = 2;
  game.input.keys.delete('KeyE'); game.updateInteraction(.04);
  assert.equal(game.interactionText, 'Déposer 5 unités');
  assert.equal(game.player.carry.scrap, 8, 'le simple aperçu ne transfère rien');
  game.input.keys.add('KeyE'); game.updateInteraction(.04);
  assert.equal(game.resources.scrap, game.storage); assert.equal(game.resources.stone, game.storage);
  assert.equal(game.player.carry.wood, 10); assert.equal(game.player.carry.scrap, 5); assert.equal(game.player.carry.stone, 0);
  assert.equal(game.depositedResources, 5);
  for (let step = 0; step < 5; step++) game.updateInteraction(.04);
  assert.equal(game.depositedResources, 5); assert.equal(game.player.carry.wood, 10); assert.equal(game.player.carry.scrap, 5);
  assert.match(game.interactionText, /^Stockage plein/);
  game.resources.wood -= 4; game.updateInteraction(.04);
  assert.equal(game.player.carry.wood, 6); assert.equal(game.depositedResources, 9);
  const saved = Save.validate(game.serialize());
  assert.equal(saved.player.carry.wood, 6); assert.equal(saved.player.carry.scrap, 5);
});

test('dépôt fractionnaire : moins d’une unité reste transférable sans afficher zéro unité', () => {
  const { game } = fresh(); atCore(game); game.resources.wood = game.storage - .25; game.player.carry.wood = 1;
  game.updateInteraction(.04);
  assert.equal(game.interactionText, 'Déposer moins d’une unité');
  closeTo(game.player.carry.wood, .75); closeTo(game.depositedResources, .25); assert.equal(game.resources.wood, game.storage);
  game.updateInteraction(.04); assert.match(game.interactionText, /^Stockage plein/);
});

test('dépôt plein : un chantier accessible reste constructible sans devoir quitter le rayon du centre', () => {
  const { game } = fresh(); assert.equal(game.placeOne('woodWall', 66, 64), true);
  const site = [...game.world.buildings.values()].find(building => building.type === 'woodWall');
  game.resources.wood = game.storage; game.player.carry.wood = 10; atCore(game, 80);
  game.updateInteraction(.04);
  assert.match(game.interactionText, /^Construire Palissade/); assert.ok(site.progress > 0);
  assert.equal(game.resources.wood, game.storage); assert.equal(game.player.carry.wood, 10); assert.equal(game.depositedResources, 0);
});

test('dépôt plein : une ressource accessible reste récoltable et ne crédite pas le tutoriel', () => {
  const { game } = fresh(), Node = game.world.nodes[0].constructor; atCore(game, 80);
  game.resources.wood = game.storage; game.player.carry.wood = 10;
  const node = new Node(99999, 'scrap', game.player.x + 20, game.player.y, 100, 17, 0); game.world.nodes = [node];
  game.updateInteraction(.04);
  assert.match(game.interactionText, /^Récolter/); closeTo(game.player.carry.scrap, .4);
  assert.equal(game.player.carry.wood, 10); assert.equal(game.depositedResources, 0); assert.equal(game.objectiveProgress, 0);
});

test('dépôt plein : un entrepôt saturé ne masque pas un vrai relevé narratif sur place', () => {
  const { game } = fresh(), site = game.world.sites[0];
  // Put a completed warehouse at a sector in this isolated spatial fixture.
  // No survey stub: the ordinary narrative eligibility/progress code is exercised.
  const warehouse = add(game, 'warehouse', Math.floor(site.x / C.TILE), Math.floor(site.y / C.TILE));
  game.world.nodes = []; game.player.x = site.x; game.player.y = site.y;
  assert.ok(C.dist(game.player, warehouse) < 100);
  game.resources.wood = game.storage; game.player.carry.wood = 10;
  const before = game.narrative.sectors[site.theme].survey; game.updateInteraction(.04);
  assert.match(game.interactionText, /^Relever les traces/);
  closeTo(game.narrative.sectors[site.theme].survey - before, .04);
  assert.equal(game.player.carry.wood, 10); assert.equal(game.depositedResources, 0);
});

test('dépôt utile : il conserve sa priorité historique puis cède la main au chantier', () => {
  const { game } = fresh(); assert.equal(game.placeOne('woodWall', 66, 64), true);
  const site = [...game.world.buildings.values()].find(building => building.type === 'woodWall');
  atCore(game, 80); game.player.carry.wood = 5; const before = game.resources.wood;
  game.updateInteraction(.04);
  assert.equal(game.interactionText, 'Déposer 5 unités'); assert.equal(site.progress, 0);
  assert.equal(game.resources.wood, before + 5); assert.equal(game.player.carry.wood, 0);
  game.updateInteraction(.04); assert.match(game.interactionText, /^Construire/); assert.ok(site.progress > 0);
});
