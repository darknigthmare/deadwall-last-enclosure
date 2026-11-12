'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { g } = bootDocument134();
const C = globalThis.DeadwallCore, Survey = globalThis.DeadwallFrontierSurvey;

function fresh() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  return g.frontier.world();
}
function workSite(w) {
  const h = w.home;
  for (const chunk of w.around(h.maxX + 150, h.y, 300)) for (const tree of chunk.trees) {
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8, p = { x: tree.x + Math.cos(angle) * (tree.r + .7), y: tree.y + Math.sin(angle) * (tree.r + .7), z: 0, inside: null };
      if (w.blocked(p.x, p.y, .32) || Survey.targets(w, p, {}, 1.6)[0]?.id !== tree.id) continue;
      for (let k = 0; k < 32; k++) {
        const a = k * Math.PI / 16, enemy = { x: p.x + Math.cos(a) * 2.6, y: p.y + Math.sin(a) * 2.6 };
        if (!w.blocked(enemy.x, enemy.y, C.FrontierTacticsRules.enemyRadius) && w.line(p, enemy, 0, null, null, .015)) return { p, enemy, tree };
      }
    }
  }
  assert.fail('A native tree has a free harvest access and a physical nearby threat point.');
}
function visit(w, p) {
  const save = g.serialize();
  Object.assign(save.frontier, p, { active: true, z: 0, inside: null, car: null, anchor: { x: g.player.x, y: g.player.y } });
  for (const place of w.nearPOI(p.x, p.y, 220)) for (let i = 0; i < w.threatCount(place); i++) save.frontier.enemies[place.id + ':e' + i] = 0;
  save.frontier.kills = Object.values(save.frontier.enemies).filter(v => v === 0).length;
  g.restoreSave(save); g.paused = false; g.activeOverlay = null;
}
function gathered() { return { carry: { ...g.player.carry }, taken: { ...g.frontier.snapshot().taken }, gathered: g.stats.gathered, rng: g.random.state }; }
function harvest() { g.input.keys.add('KeyE'); g.updatePlayer(.1); g.input.keys.clear(); }
function groupAt(enemy) {
  const save = g.serialize();
  Object.assign(save.worldEvolution, { serial: 1, nextHorde: 10000, groups: [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0, ...enemy, a: 0, seen: true,
    contacts: { 0: { ...enemy, z: 0, a: 0, mode: 'idle', ttl: 0, gx: enemy.x, gy: enemy.y, cool: 0 } } }] });
  g.restoreSave(save); g.paused = false; g.activeOverlay = null;
  return g.worldEvolution.groupMembers()[0];
}

test('152: a streamed wild infected at a real harvest access refuses manual regional gathering before loot or tool payment', () => {
  const w = fresh(), { p, enemy, tree } = workSite(w); visit(w, p);
  const contact = groupAt(enemy);
  assert.ok(contact && contact.hp > 0 && w.line(p, contact, 0, null, null, .015));
  const before = gathered(); harvest();
  assert.deepEqual(gathered(), before, 'The existing 5.5 metre threat rule includes the real streamed member.');
  assert.match(g.interactionText, /infectés/);
  assert.ok(g.worldEvolution.hitContact(contact.x, contact.y, 100, contact.id));
  harvest(); assert.ok(g.frontier.takenAmount(tree.id) > 0, 'The same finite tree remains harvestable after the physical contact dies.');
  const saved = g.serialize(); g.restoreSave(saved);
  assert.deepEqual(g.frontier.snapshot().taken, saved.frontier.taken); assert.deepEqual(g.player.carry, saved.player.carry);
});

test('152: a real trunk occluding a wild contact and a distant clear contact retain the existing physical harvest limit', () => {
  for (const blocked of [true, false]) {
    const w = fresh(), { p, tree } = workSite(w); visit(w, p);
    let enemy;
    if (blocked) enemy = { x: 2 * tree.x - p.x, y: 2 * tree.y - p.y };
    else for (let i = 0; i < 32 && !enemy; i++) {
      const a = i * Math.PI / 16, point = { x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6 };
      if (!w.blocked(point.x, point.y, C.FrontierTacticsRules.enemyRadius) && w.line(p, point, 0, null, null, .015)) enemy = point;
    }
    assert.ok(enemy); assert.equal(w.blocked(enemy.x, enemy.y, C.FrontierTacticsRules.enemyRadius), false);
    assert.equal(w.line(p, enemy, 0, null, null, .015), !blocked);
    const contact = groupAt(enemy); assert.ok(contact && contact.hp > 0);
    const before = gathered(); harvest();
    assert.ok(g.frontier.takenAmount(tree.id) > 0); assert.equal(g.random.state, before.rng);
    assert.ok(Math.abs(g.player.carry.wood - before.carry.wood - .3) < 1e-8, 'No harvest yield or danger radius changed.');
  }
});

test('152: a reanimated regional survivor beside a real harvest access interrupts gathering without duplicating the lost bag', () => {
  const w = fresh(), { p, enemy, tree } = workSite(w); visit(w, enemy);
  g.player.invulnerable = 0; g.frontier.damage(1000);
  assert.equal(g.succession133.select('builder'), true); visit(w, p);
  const save = g.serialize(), body = save.succession133.remains.at(-1).body;
  Object.assign(body, { phase: 'waiting', roll: 0, left: .01 });
  g.restoreSave(save); g.paused = false; g.activeOverlay = null; g.succession133.step(.1);
  const contact = g.succession133.contacts()[0];
  assert.ok(contact && contact.hp > 0 && Math.hypot(contact.x - p.x, contact.y - p.y) > C.SuccessionRules.reach);
  assert.ok(w.line(p, contact, 0, null, null, .015));
  const remains = g.succession133.remains(), before = gathered(); harvest();
  assert.deepEqual(gathered(), before); assert.deepEqual(g.succession133.remains(), remains);
  assert.match(g.interactionText, /infectés/);
  assert.ok(g.succession133.hit(contact.x, contact.y, 100, 0, null, contact.id));
  harvest(); assert.ok(g.frontier.takenAmount(tree.id) > 0);
  assert.equal(g.succession133.remains().at(-1).body.phase, 'neutralized'); assert.equal(g.save(false), true);
});

test('152: E cancels a real regional barricade before harvesting the finite container without construction payment', () => {
  const w = fresh(); let scene;
  for (const place of w.pois) {
    for (const opening of globalThis.DeadwallBarricades134.regionTargets(w, place, 0)) {
      for (const offset of [-.8, .8, -1.2, 1.2]) for (const along of [0, -.5, .5]) {
        const p = { x: opening.x + Math.cos(opening.angle) * along - Math.sin(opening.angle) * offset,
          y: opening.y + Math.sin(opening.angle) * along + Math.cos(opening.angle) * offset, z: 0, inside: null };
        if (w.blocked(p.x, p.y, .32)) continue;
        const loot = Survey.targets(w, p, {}, 1.6)[0];
        if (loot && loot.left > 0 && !g.interventions134.blocksLoot(loot)) { scene = { p, opening, loot }; break; }
      }
      if (scene) break;
    }
    if (scene) break;
  }
  assert.ok(scene, 'A generated doorway has a real accessible finite container beside its work stance.');
  visit(w, scene.p); g.units = []; g.player.carry.wood = 10; g.player.carry.scrap = 4;
  assert.equal(g.barricades134.begin('build', scene.opening.id, 'planks').ok, true);
  assert.equal(g.expansions.busy(), true);
  const before = gathered(), stock = { ...g.resources }, bag = g.player.carry, resource = scene.loot.resource, credits = [];
  let carried = bag[resource];
  // Observe the actual inventory credit while retaining the real harvest controller.
  Object.defineProperty(bag, resource, { configurable: true, enumerable: true, get: () => carried, set: next => {
    if (next > carried) credits.push({ amount: next - carried, barricade: g.barricades134.busy(), busy: g.expansions.busy() });
    carried = next;
  } });
  try { g.input.keys.add('KeyE'); g.update(.04); }
  finally { g.input.keys.clear(); Object.defineProperty(bag, resource, { configurable: true, enumerable: true, writable: true, value: carried }); }
  const amount = Math.min(scene.loot.left, C.Frontier.RULES.lootRate * .04 * g.difficulty.resourceYield);
  assert.equal(credits.length, 1); assert.equal(credits[0].barricade, false, 'The owner cancels before the actual harvest credit.');
  assert.equal(credits[0].busy, false, 'The shared hands guard admits only the cancelled, free-handed interaction.');
  assert.ok(Math.abs(credits[0].amount - amount) < 1e-8);
  assert.deepEqual(g.player.carry, { ...before.carry, [resource]: before.carry[resource] + amount }, 'No construction wood or scrap is spent.');
  assert.deepEqual(g.frontier.snapshot().taken, { ...before.taken, [scene.loot.id]: (before.taken[scene.loot.id] || 0) + amount });
  assert.ok(Math.abs(g.stats.gathered - before.gathered - amount) < 1e-8, 'Finite container loss equals bag and gathered gains.');
  assert.deepEqual(g.resources, stock); assert.equal(g.random.state, before.rng);
  assert.equal(g.barricades134.busy(), false); assert.deepEqual(g.barricades134.snapshot().records, []);
});
