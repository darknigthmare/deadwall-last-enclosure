'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { g } = bootDocument134(), C = globalThis.DeadwallCore, G = globalThis.DeadwallFrontierGeometry;

function pose(point) {
  const raw = g.serialize();
  Object.assign(raw.frontier, point, { active: true, z: 0, inside: null, car: null, anchor: { x: g.player.x, y: g.player.y } });
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null; g.releaseInputs();
}
function scene() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  const w = g.frontier.world();
  for (const p of w.pois) {
    if (p.occupation !== 'allied' || p.generation < 5) continue;
    const stance = G.global(p, p.w / 2, -2);
    if (w.blocked(stance.x, stance.y, C.Frontier.RULES.footRadius, 0, null)) continue;
    let threat;
    for (let i = 0; i < 32 && !threat; i++) {
      const a = i * Math.PI / 16, q = { x: stance.x + Math.cos(a) * 3, y: stance.y + Math.sin(a) * 3 };
      if (!w.blocked(q.x, q.y, C.FrontierTacticsRules.enemyRadius, 0, null) && w.line(stance, q, 0, null, null, .05)) threat = q;
    }
    if (!threat) continue;
    pose(stance); g.player.carry = C.makeBag({ wood: 8, scrap: 4, food: 8, medicine: 4 });
    if (!g.worldOps131.preview('relay', p.id).ok) continue;
    assert.equal(g.worldOps131.begin('relay', p.id).ok, true);
    for (let i = 0; i < Math.ceil(C.WorldOpsRules131.relay.seconds / .1) + 2; i++) g.worldOps131.step(.1);
    assert.ok(g.worldOps131.snapshot().relays[p.id]);
    return { w, p, stance, threat };
  }
  assert.fail('A native allied relay has an accessible entrance and nearby free threat position.');
}
function inventory() { return { bag: { ...g.player.carry }, stock: g.worldOps131.snapshot(), city: { ...g.resources }, rng: g.random.state, gathered: g.stats.gathered, deposited: g.depositedResources }; }
function corpseWaiting({ stance, threat }) {
  pose(threat); g.player.invulnerable = 0; g.frontier.damage(1000);
  assert.equal(g.succession133.select('builder'), true); pose(stance);
  const raw = g.serialize(); Object.assign(raw.succession133.remains.at(-1).body, { phase: 'waiting', roll: 0, left: .01 });
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null;
}
function reanimate(state) {
  corpseWaiting(state); g.succession133.step(.1);
  assert.equal(g.succession133.contacts().length, 1);
  return g.succession133.contacts()[0];
}

test('155: relay transfers and their controls wait for a real reload without altering supplies', () => {
  const { p } = scene();
  g.player.carry.ammo = 12;
  g.player.magazine.pistol = 0; g.startReload(); assert.ok(g.player.reload > 0);
  const before = inventory();
  assert.equal(g.worldOps131.transfer(p.id, 'store').ok, false);
  assert.equal(g.worldOps131.transfer(p.id, 'take').ok, false);
  for (const direction of ['store', 'take']) {
    const action = g.worldOps131.actions().find(a => a.id === direction);
    assert.equal(action.disabled, true); assert.match(action.reason, /rechargement/);
  }
  assert.deepEqual(inventory(), before);
  for (let i = 0; i < 100 && g.player.reload > 0; i++) g.updatePlayer(.04);
  assert.equal(g.player.reload, 0);
  const bag = { ...g.player.carry };
  assert.equal(g.worldOps131.transfer(p.id, 'store').ok, true);
  assert.equal(C.bagTotal(g.player.carry), 0); assert.deepEqual(g.worldOps131.snapshot().relays[p.id], bag);
  assert.equal(g.worldOps131.transfer(p.id, 'take').ok, true); assert.deepEqual(g.player.carry, bag);
  assert.deepEqual(g.resources, before.city); assert.equal(g.depositedResources, before.deposited);
});

test('155: native reanimation prevents relay transfers and field work until the physical threat is neutralized', () => {
  const state = scene();
  assert.equal(g.worldOps131.transfer(state.p.id, 'store').ok, true);
  const contact = reanimate(state); g.player.carry.food = 2; g.player.carry.scrap = 1;
  assert.ok(Math.hypot(contact.x - state.stance.x, contact.y - state.stance.y) < C.WorldOpsRules131.danger);
  assert.equal(state.w.line(state.stance, contact, 0, null, null, .05), true);
  const before = inventory();
  assert.equal(g.worldOps131.preview('survey', state.p.id).ok, false);
  assert.equal(g.worldOps131.begin('survey', state.p.id).ok, false);
  assert.equal(g.worldOps131.transfer(state.p.id, 'take').ok, false);
  assert.equal(g.worldOps131.actions().find(a => a.id === 'take').disabled, true);
  assert.deepEqual(inventory(), before);
  assert.equal(g.succession133.hit(contact.x, contact.y, contact.hp, 0, null, contact.id), true);
  assert.equal(g.worldOps131.transfer(state.p.id, 'take').ok, true);
  assert.equal(g.worldOps131.preview('survey', state.p.id).ok, true);
  const saved = g.serialize(); g.restoreSave(saved);
  assert.deepEqual(g.worldOps131.snapshot(), saved.expansions127.modules.world131);
  assert.equal(g.succession133.remains().at(-1).body.phase, 'neutralized');
});

test('155: relay quotes conserve fractional supplies and revalidate storage and bag capacity before transfer', () => {
  const { p } = scene(), raw = g.serialize();
  raw.expansions127.modules.world131.relays[p.id] = C.makeBag({ wood: C.WorldOpsRules131.relayCapacity - .5 });
  raw.player.carry = C.makeBag({ scrap: 2, food: 1.25 });
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null;
  const before = inventory(), quote = g.worldOps131.previewTransfer(p.id, 'store');
  assert.equal(quote.ok, true); assert.equal(quote.total, .5); assert.equal(quote.amounts.scrap, .5);
  assert.deepEqual(inventory(), before, 'A quote is a read, not an inventory transaction.');
  quote.amounts.scrap = 1000;
  assert.equal(g.worldOps131.transfer(p.id, 'store').ok, true);
  assert.equal(g.player.carry.scrap, 1.5); assert.equal(g.player.carry.food, 1.25);
  assert.equal(C.bagTotal(g.worldOps131.snapshot().relays[p.id]), C.WorldOpsRules131.relayCapacity);
  assert.equal(g.worldOps131.previewTransfer(p.id, 'store').ok, false);
  assert.equal(g.worldOps131.actions().find(a => a.id === 'store').disabled, true);
  g.player.carry = C.makeBag({ stone: g.player.carryCapacity - .25 });
  const take = g.worldOps131.previewTransfer(p.id, 'take');
  assert.equal(take.ok, true); assert.equal(take.total, .25);
  assert.equal(g.worldOps131.transfer(p.id, 'take').ok, true);
  assert.equal(g.player.carry.wood, .25); assert.equal(C.bagTotal(g.player.carry), g.player.carryCapacity);
  assert.equal(C.bagTotal(g.worldOps131.snapshot().relays[p.id]), C.WorldOpsRules131.relayCapacity - .25);
  const after = inventory();
  assert.equal(g.worldOps131.transfer(p.id, 'take').ok, false); assert.deepEqual(inventory(), after);
  assert.deepEqual(after.city, before.city); assert.equal(after.rng, before.rng); assert.equal(after.gathered, before.gathered); assert.equal(after.deposited, before.deposited);
  const checkpoint = g.serialize(); g.restoreSave(checkpoint);
  assert.deepEqual(g.worldOps131.snapshot(), checkpoint.expansions127.modules.world131);
  assert.deepEqual(g.player.carry, checkpoint.player.carry);
});

test('155: reanimation during a sector survey cancels work before paying or revealing the sector', () => {
  const state = scene(); corpseWaiting(state);
  g.player.carry = C.makeBag({ food: 1, scrap: 1 });
  assert.equal(g.worldOps131.begin('survey', state.p.id).ok, true); g.worldOps131.step(.1);
  assert.equal(g.worldOps131.busy(), true);
  const before = inventory(), known = g.frontier.discoveries();
  g.succession133.step(.1); assert.equal(g.succession133.contacts().length, 1);
  g.worldOps131.step(.1);
  assert.equal(g.worldOps131.busy(), false); assert.deepEqual(inventory(), before);
  assert.deepEqual(g.frontier.discoveries(), known); assert.equal(g.worldOps131.snapshot().surveyed.includes(state.p.sector), false);
});

test('155: a living risen contact behind a real building wall does not forbid a clear exterior relay', () => {
  const state = scene(); reanimate(state);
  let hidden;
  for (let y = .7; y < Math.min(state.p.h - .6, 8) && !hidden; y += .5) for (let x = .7; x < state.p.w - .6 && !hidden; x += .5) {
    const q = G.global(state.p, x, y);
    if (Math.hypot(q.x - state.stance.x, q.y - state.stance.y) >= C.WorldOpsRules131.danger) continue;
    if (!state.w.blocked(q.x, q.y, C.FrontierTacticsRules.enemyRadius, 0, null) && !state.w.line(state.stance, q, 0, null, null, .05)) hidden = q;
  }
  assert.ok(hidden, 'The native parcel has a free interior position physically separated from its exterior entrance.');
  const raw = g.serialize(); Object.assign(raw.succession133.remains.at(-1).body, hidden);
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null; g.player.carry = C.makeBag({ food: 1, scrap: 1 });
  const contact = g.succession133.contacts()[0];
  assert.ok(contact.hp > 0 && Math.hypot(contact.x - state.stance.x, contact.y - state.stance.y) < C.WorldOpsRules131.danger);
  assert.equal(state.w.line(state.stance, contact, 0, null, null, .05), false);
  const before = inventory();
  assert.equal(g.worldOps131.preview('survey', state.p.id).ok, true);
  assert.equal(g.worldOps131.previewTransfer(state.p.id, 'store').ok, true);
  assert.deepEqual(inventory(), before, 'Safety reads neither relocate nor reveal the hidden living body.');
});
