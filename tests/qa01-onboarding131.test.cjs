'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { boot131 } = require('./helpers/expansions131.cjs');
const { standAt } = require('./helpers/physical-fixtures.cjs');
const C = require('../src/core.js');

// DOM simulé, moteur intégré G5. Les déplacements longs sont préparés par
// standAt, qui impose un point physiquement libre ; aucune récompense ni
// progression de prologue n'est injectée dans ces parcours.
function fresh(seed = '913101', ui = false) { return boot131({ seed, ui }); }
function ticks(g, count) {
  for (let i = 0; i < count; i++) { g.update(.04); g.input.pressed.clear(); }
}
function act(g, count) {
  g.input.keys.add('KeyE'); ticks(g, count); g.input.keys.delete('KeyE');
}
function stable(g) { const s = g.serialize(); delete s.timestamp; return s; }
function actionReason(doc, button) {
  const ids = (button.getAttribute('aria-describedby') || '').trim().split(/\s+/).filter(Boolean);
  assert.ok(ids.length > 0, button.id + ' : références descriptives requises');
  const nodes = ids.map(id => {
    const node = doc.getElementById(id);
    assert.ok(node && node.id === id && doc.body.contains(node), button.id + ' : cible ARIA attachée ' + id);
    return node;
  });
  const reason = nodes.find(node => node.id === button.id + '-reason');
  assert.ok(reason, button.id + ' : motif du refus référencé séparément');
  assert.ok(reason.textContent.length > 5, button.id);
  return reason;
}
function site(g, type) {
  for (let x = 67; x < 82; x++) for (let y = 59; y < 77; y++)
    if (g.world.placement(C.BUILDINGS[type], x, y, 0).valid) return { x, y };
  assert.fail('Emplacement de test absent pour ' + type);
}
function build(g, type) {
  const p = site(g, type), before = { ...g.resources };
  assert.equal(g.placeOne(type, p.x, p.y), true, type);
  const b = [...g.world.buildings.values()].at(-1);
  for (const k of C.RESOURCE_KEYS) assert.equal(g.resources[k], before[k] - (b.def.cost[k] || 0), type + ':' + k);
  assert.equal(b.completed, false);
  standAt(g, g.player, b);
  g.input.keys.add('KeyE');
  for (let i = 0; i < 500 && !b.completed; i++) ticks(g, 1);
  g.input.keys.delete('KeyE');
  assert.equal(b.completed, true, 'Chantier réellement travaillé : ' + type);
  return b;
}
function gather(g, count = 25) {
  const node = g.world.nodes.filter(n => !n.depleted && g.fieldcraft.service(g.player, n))
    .sort((a, b) => Math.hypot(a.x - g.player.x, a.y - g.player.y) - Math.hypot(b.x - g.player.x, b.y - g.player.y))[0];
  assert.ok(node);
  standAt(g, g.player, node); const before = g.stats.gathered;
  act(g, count);
  assert.ok(g.stats.gathered - before >= 8);
  assert.ok(C.bagTotal(g.player.carry) >= 8);
  return node;
}

test('QA01 1.31 : cinq domaines visibles, dix familles conservées, consultation sans coût et pause réelle', () => {
  const { g, doc } = fresh('913101', true);
  assert.equal(g.frontier.position().generation, 5);
  assert.equal(g.activeOverlay, null);
  const before = stable(g);
  doc.getElementById('fieldOperations').click();
  assert.equal(g.expansionUI.isOpen(), true); assert.equal(g.paused, true);
  const groups = { defense: ['defense131', 'fortification'], exploration: ['exploration131', 'exploration'],
    player: ['player131', 'survival', 'companions'], world: ['world131', 'campaign'], lore: ['lore131'] };
  for (const [group, ids] of Object.entries(groups)) {
    const button = doc.getElementById('expansionGroup-' + group);
    assert.equal(button.hidden, false); button.click();
    assert.equal(g.expansionUI.section.dataset.domain, group);
    const tabs = g.expansionUI.section.querySelectorAll('button').filter(n => n.getAttribute('role') === 'tab');
    assert.deepEqual(tabs.map(n => n.id), ids.map(id => 'expansionTab-' + id));
    for (const id of ids) {
      doc.getElementById('expansionTab-' + id).click();
      const actions = g.expansionUI.section.querySelectorAll('button').filter(n => n.id.startsWith('expansionAction-'));
      assert.ok(actions.length > 0, id);
      for (const action of actions.filter(a => a.disabled)) {
        actionReason(doc, action);
      }
    }
  }
  // Pass through the production RAF gate: direct update() deliberately bypasses it.
  g.lastFrame = 1000; for (let i = 1; i <= 3; i++) g.loop(1000 + i * 40);
  assert.equal(g.elapsed, before.elapsed); assert.equal(g.phaseTime, before.phaseTime);
  doc.getElementById('expansionResume').click();
  assert.equal(g.paused, false); assert.equal(g.activeOverlay, null);
  assert.deepEqual(stable(g), before);
});

test('QA01 1.31 : parcours débutant récolte E → dépôt E → chantier payé → reprise, sans compteurs injectés', () => {
  const { g, doc } = fresh('913102', true);
  standAt(g, g.player, g.core());
  doc.getElementById('fieldOperations').click(); doc.getElementById('expansionGroup-lore').click();
  doc.getElementById('expansionAction-lore131-prologue').click();
  assert.equal(g.paused, false); assert.equal(g.chronicles131.snapshot().prologue.stage, 0);
  gather(g);
  assert.equal(g.chronicles131.snapshot().prologue.stage, 1);
  assert.ok(g.save(false)); assert.ok(g.load());
  assert.equal(g.chronicles131.snapshot().prologue.stage, 1);
  const carry = { ...g.player.carry }, stock = { ...g.resources };
  standAt(g, g.player, g.core()); act(g, 1);
  assert.equal(C.bagTotal(g.player.carry), 0);
  for (const k of C.RESOURCE_KEYS.filter(k => k !== 'food')) assert.equal(g.resources[k], stock[k] + carry[k]);
  assert.equal(g.chronicles131.snapshot().prologue.stage, 2);
  assert.equal(g.chronicles131.scene().id, 'return');
  assert.equal(g.activeOverlay, null); assert.equal(g.paused, false);
  build(g, 'house'); ticks(g, 1);
  assert.equal(g.chronicles131.snapshot().prologue.status, 'done');
  const before = stable(g), stage = g.chronicles131.snapshot().prologue;
  assert.ok(g.save(false)); assert.ok(g.load());
  assert.deepEqual(g.chronicles131.snapshot().prologue, stage);
  assert.deepEqual(g.resources, before.resources); assert.equal(g.phaseTime, before.phaseTime);
  assert.equal(g.chronicles131.scene(), null);
  assert.equal(g.chronicles131.startPrologue().ok, false);
});

test('QA01 1.31 : les ouvriers peuvent déposer sans accomplir les gestes personnels ni déclencher le premier retour', () => {
  const { g } = fresh('913103');
  standAt(g, g.player, g.core()); assert.ok(g.chronicles131.startPrologue().ok);
  // Les ouvriers initiaux utilisent leurs vraies récolte, route et livraison.
  for (let i = 0; i < 2000 && g.depositedResources < 8; i++) ticks(g, 1);
  assert.ok(g.depositedResources >= 8, 'Une livraison automatique réelle doit être observée');
  assert.equal(g.stats.gathered, 0); assert.equal(C.bagTotal(g.player.carry), 0);
  assert.equal(g.chronicles131.snapshot().prologue.stage, 0);
  assert.equal(g.chronicles131.snapshot().prologue.deposited, 0);
  assert.equal(g.chronicles131.scene(), null);
});

test('QA01 1.31 : préparation personnelle payée, délai suspendu par le menu et conservation à la reprise', () => {
  const { g, doc } = fresh('913104', true);
  standAt(g, g.player, g.core()); const stock = { ...g.resources };
  g.expansionUI.open('player131');
  const button = doc.getElementById('expansionAction-player131-ammo');
  assert.equal(button.disabled, false); button.click();
  assert.equal(g.playerOps131.busy(), true); assert.equal(g.paused, false);
  ticks(g, 20); g.expansionUI.open('lore131');
  const progress = g.playerOps131.overview().task.progress, time = g.phaseTime;
  g.lastFrame = 1000; for (let i = 1; i <= 4; i++) g.loop(1000 + i * 40);
  assert.equal(g.playerOps131.overview().task.progress, progress); assert.equal(g.phaseTime, time);
  const collect = doc.getElementById('expansionAction-lore131-collect');
  assert.equal(collect.disabled, true);
  g.expansionUI.close();
  for (let i = 0; i < 250 && g.playerOps131.busy(); i++) ticks(g, 1);
  const reserve = g.playerOps131.snapshot().reserve;
  assert.ok(reserve > 0); assert.equal(g.resources.ammo + reserve, stock.ammo);
  const before = stable(g); assert.ok(g.save(false)); assert.ok(g.load());
  assert.equal(g.playerOps131.snapshot().reserve, reserve); assert.deepEqual(g.resources, before.resources);
  assert.equal(g.frontier.position().generation, 5);
});

test('QA01 1.31 : bâtir, préparer un caisson et sortir laisse un tir autonome réellement financé et repris', () => {
  const { g } = fresh('913105');
  assert.equal(g.departure130.assess().noFire, true);
  build(g, 'house'); assert.ok(g.tier.id >= 1);
  const tower = build(g, 'watchtower');
  const beforeBox = { ...g.resources };
  assert.ok(g.fortificationPack.equip('ammo', tower.id).ok);
  for (const k of C.RESOURCE_KEYS) assert.equal(g.resources[k], beforeBox[k] - (C.FortificationPackRules.ammoCost[k] || 0));
  // La réserve commune est protégée par un ordre existant, pas supprimée.
  assert.equal(g.citadel.configure('reserve', Math.floor(g.resources.ammo)), true);
  const assessment = g.departure130.assess();
  assert.equal(assessment.localPosts, 1); assert.match(assessment.detail, /limités/);
  const x = C.WORLD_SIZE - 20, y = C.WORLD_SIZE / 2;
  Object.assign(g.player, { x, y });
  assert.equal(g.frontier.enter(), true); assert.equal(g.departure130.status().visible, true);
  assert.match(g.departure130.status().notice.advice, /peut tomber/);
  // Contact préparé pour exercer le vrai ciblage et projectile, sans attendre une nuit entière.
  g.spawnZombie('walker'); const z = g.zombies.at(-1); z.x = tower.x + 100; z.y = tower.y;
  g.rebuildBuckets(); const stock = g.resources.ammo, local = g.fortificationPack.snapshot().fittings[0].ammo;
  g.updateBuildings(.04);
  assert.equal(g.resources.ammo, stock); assert.ok(g.fortificationPack.snapshot().fittings[0].ammo < local);
  assert.ok(g.projectiles.length > 0); assert.equal(g.frontier.active(), true);
  // Le préavis lit la phase au début du tick ; il observe la transition au suivant.
  g.phaseTime = .02; ticks(g, 2);
  assert.equal(g.phase, 'warning'); assert.match(g.departure130.status().notice.clock, /Assaut dans/);
  const saved = stable(g); assert.ok(g.save(false)); assert.ok(g.load()); g.departure130.approach();
  assert.equal(g.frontier.active(), true); assert.equal(g.phaseTime, saved.phaseTime);
  assert.equal(g.departure130.status().visible, true); assert.deepEqual(g.resources, saved.resources);
  assert.equal(g.fortificationPack.snapshot().fittings[0].ammo, saved.expansions127.modules.fortification.fittings[0].ammo);
});

test('QA01 1.31 : les quatre sorties G5 préviennent et une nouvelle graine réinitialise le récit sans équipement offert', () => {
  const { g } = fresh('913106');
  for (const [seed, key, point] of [
    ['913107', 'ArrowRight', { x: C.WORLD_SIZE - 400, y: 2048 }],
    ['913108', 'ArrowLeft', { x: 400, y: 2048 }],
    ['913109', 'ArrowUp', { x: 2048, y: 400 }],
    ['913110', 'ArrowDown', { x: 2048, y: C.WORLD_SIZE - 400 }]
  ]) {
    assert.notEqual(g.startNew('standard', seed), false);
    assert.equal(g.world.seed, Number(seed)); assert.equal(g.frontier.position().generation, 5);
    assert.equal(g.chronicles131.snapshot().prologue.status, 'available');
    assert.equal(g.playerOps131.snapshot().reserve, 0); assert.equal(g.chronicles131.snapshot().collected.length, 0);
    const stock = { ...g.resources }; Object.assign(g.player, point); g.input.keys.add(key);
    g.departure130.approach(); g.input.keys.clear();
    assert.equal(g.departure130.status().visible, true, key);
    assert.equal(g.departure130.status().notice.noFire, true); assert.deepEqual(g.resources, stock);
    assert.equal(g.frontier.active(), false);
  }
});
