'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { g } = bootDocument134(), C = globalThis.DeadwallCore, G = globalThis.DeadwallFrontierGeometry;

function wreckScene() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  g.player.x = 4058; g.player.y = 2048; assert.equal(g.frontier.enter(), true);
  const w = g.frontier.world();
  for (const p of w.pois) for (const v of p.parking) for (const side of [-1, 1]) {
    const stance = G.global(v, v.w / 2, side < 0 ? -.75 : v.h + .75);
    if (w.blocked(stance.x, stance.y, .32, 0, null) || !w.line(stance, globalThis.DeadwallFrontierSurvey.edge(stance, v), 0, null, v.id, .025)) continue;
    let threat;
    for (let i = 0; i < 32 && !threat; i++) {
      const a = i * Math.PI / 16, q = { x: stance.x + Math.cos(a) * 3, y: stance.y + Math.sin(a) * 3 };
      if (!w.blocked(q.x, q.y, C.FrontierTacticsRules.enemyRadius, 0, null) && w.line(stance, q, 0, null, null, .05)) threat = q;
    }
    if (!threat) continue;
    const raw = g.serialize();
    Object.assign(raw.frontier, stance, { z: 0, inside: null, seen: [p.id] }); raw.frontier.taken[v.id] = v.amount;
    for (const site of w.nearPOI(stance.x, stance.y, 220)) for (let i = 0; i < w.threatCount(site); i++) raw.frontier.enemies[site.id + ':e' + i] = 0;
    raw.frontier.kills = Object.values(raw.frontier.enemies).filter(h => h === 0).length;
    g.restoreSave(raw); g.paused = false; g.activeOverlay = null; g.player.carry.scrap = 1;
    if (g.travel131.preview('dismantle', v.id).ok) return { w, stance, threat, v };
  }
  assert.fail('A real emptied wreck has an accessible stance and a nearby free regional threat position.');
}
function visit(p) {
  const raw = g.serialize();
  Object.assign(raw.frontier, p, { active: true, anchor: { x: g.player.x, y: g.player.y }, z: 0, inside: null, car: null });
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null;
}
function inventory() { return { carry: { ...g.player.carry }, resources: { ...g.resources }, recovered: g.travel131.snapshot(), gathered: g.stats.gathered, rng: g.random.state }; }
function waitingCorpse() {
  const { w, stance, threat, v } = wreckScene(); visit(threat);
  g.player.invulnerable = 0; g.frontier.damage(1000);
  assert.equal(g.succession133.select('builder'), true); visit(stance);
  const raw = g.serialize(), body = raw.succession133.remains.at(-1).body;
  // Controlled reanimation timing; the death, corpse and contact owners remain native.
  Object.assign(body, { phase: 'waiting', roll: 0, left: .01 });
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null;
  g.player.carry.scrap = 1;
  return { w, stance, v };
}

test('154: a physical reanimated survivor refuses wreck work before payment and enables the same finite work after neutralization', () => {
  const { w, stance, v } = waitingCorpse(); g.succession133.step(.1);
  const contact = g.succession133.contacts()[0];
  assert.ok(contact && contact.hp > 0 && contact.z === 0);
  assert.ok(Math.hypot(contact.x - stance.x, contact.y - stance.y) < C.Travel131Rules.danger);
  assert.equal(w.line(stance, contact, 0, null, null, .05), true);
  const before = inventory();
  assert.equal(g.travel131.preview('dismantle', v.id).ok, false);
  assert.equal(g.travel131.begin('dismantle', v.id).ok, false);
  assert.equal(g.travel131.actions().find(a => a.id === 'dismantle').disabled, true);
  assert.deepEqual(inventory(), before); assert.equal(g.travel131.busy(), false);
  assert.equal(g.succession133.hit(contact.x, contact.y, contact.hp, 0, null, contact.id), true);
  assert.equal(g.travel131.begin('dismantle', v.id).ok, true);
  for (let left = C.Travel131Rules.dismantleSeconds; left > 1e-8; left -= .04) g.travel131.step(Math.min(.04, left));
  const amount = Math.min(C.Travel131Rules.dismantleBatch, globalThis.DeadwallExploration131.wreckReserve(g.world.seed, v.id));
  assert.equal(g.player.carry.scrap, amount, 'The one paid scrap becomes the existing finite batch after the threat dies.');
  assert.equal(g.travel131.wreckStatus(v.id).recovered, amount); assert.equal(g.frontier.takenAmount(v.id), v.amount);
  const checkpoint = g.serialize(); g.restoreSave(checkpoint);
  assert.deepEqual(g.travel131.snapshot(), checkpoint.expansions127.modules.exploration131);
  assert.equal(g.succession133.remains().at(-1).body.phase, 'neutralized');
});

test('154: reanimation during paid wreck work cancels before consuming the tool or finite mechanical reserve', () => {
  const { v } = waitingCorpse();
  assert.equal(g.succession133.contacts().length, 0);
  assert.equal(g.travel131.begin('dismantle', v.id).ok, true); g.travel131.step(.1);
  assert.ok(g.travel131.busy());
  const before = inventory(); g.succession133.step(.1);
  assert.equal(g.succession133.contacts().length, 1);
  g.travel131.step(.1);
  assert.equal(g.travel131.busy(), false); assert.deepEqual(inventory(), before);
  assert.equal(g.frontier.takenAmount(v.id), v.amount, 'The emptied loot compartment remains distinct from the unpaid mechanics.');
});
