'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { standAt } = require('./helpers/physical-fixtures.cjs');
let g, C;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; });
const clone = value => JSON.parse(JSON.stringify(value));

// Explicit campaign fixture: the existing medical access is discovered and
// cleared, then actors are restored at geometrically valid points. Prices,
// intervention time, individual contacts and delivery use production owners.
function field() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  standAt(g, g.player, g.core()); g.resources.scrap = 100;
  assert.equal(g.loadout.transfer('depot', 'sac', 'scrap', 2).amount, 2);
  const w = g.frontier.world(), raw = g.serialize();
  raw.frontier.seen = w.pois.map(p => p.id);
  assert.equal(g.restoreSave(raw), true); standAt(g, g.player, g.core());
  const started = g.campaignPack.start('medical'); assert.equal(started.ok, true, started.reason);
  const point = g.campaignPack.overview().target, save = g.serialize();
  Object.assign(save.frontier, { active: true, anchor: { x: g.player.x, y: g.player.y }, ...point, z: 0, inside: null });
  for (const poi of w.nearPOI(point.x, point.y, 130)) for (let i = 0; i < w.threatCount(poi); i++) save.frontier.enemies[poi.id + ':e' + i] = 0;
  save.frontier.kills = Object.values(save.frontier.enemies).filter(n => n === 0).length;
  assert.equal(g.restoreSave(save), true);
  assert.equal(w.blocked(point.x, point.y, C.FrontierTacticsRules.footRadius || .32, 0, null), false);
  assert.equal(g.campaignPack.previewWork().ok, true);
  return { w, point };
}
function openPoint(w, p, { blocked = false, min = 2, max = 17 } = {}) {
  for (let r = min; r <= max; r += .3) for (let a = 0; a < Math.PI * 2; a += .12) {
    const q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
    if (!w.blocked(q.x, q.y, C.FrontierTacticsRules.enemyRadius, 0, null) && w.line(p, q, 0, null, null, .015) === !blocked) return q;
  }
  assert.fail('A physical free contact point exists with the required line of sight.');
}
function horde(center, contact) {
  const save = g.serialize();
  save.worldEvolution.serial = 1; save.worldEvolution.nextHorde = 10000;
  save.worldEvolution.groups = [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0, ...center, a: 0, seen: false,
    contacts: { 0: { ...contact, z: 0, a: 0, mode: 'pursuit', ttl: 12, gx: contact.x, gy: contact.y, cool: 1 } } }];
  assert.equal(g.restoreSave(save), true);
  const member = g.worldEvolution.groupMembers()[0]; assert.ok(member && member.hp > 0);
  return member;
}
function possessions() { return { carry: clone(g.player.carry), resources: clone(g.resources), campaign: g.campaignPack.snapshot(), rng: g.random.state, taken: g.frontier.snapshot().taken }; }
function work(seconds) { for (let left = seconds; left > 1e-7; left -= .04) g.update(Math.min(.04, left)); }

test('153 campaign: a pursuing wild contact near the medical access refuses work even when the group centre is remote', () => {
  const { w, point } = field(), contact = openPoint(w, point, { max: 3 }), center = openPoint(w, point, { min: 55, max: 70 });
  const member = horde(center, contact);
  assert.ok(Math.hypot(center.x - point.x, center.y - point.y) > C.CampaignPackRules.danger + g.worldEvolution.groupRadius(member.group));
  assert.equal(g.frontier.visibleEnemy(member), true);
  const before = possessions(); assert.equal(g.campaignPack.previewWork().ok, false);
  assert.equal(g.campaignPack.begin().ok, false); assert.deepEqual(possessions(), before);
  assert.equal(g.campaignPack.busy(), false);
  assert.equal(g.worldEvolution.hitContact(member.x, member.y, 100, member.id), true);
  assert.equal(g.campaignPack.previewWork().ok, true);
  assert.equal(g.save(false), true); assert.equal(g.load(), true);
  assert.equal(g.campaignPack.previewWork().ok, true);
  assert.deepEqual(g.player.carry, before.carry); assert.deepEqual(g.resources, before.resources);
});

test('153 campaign: a real facade hides nearby wild contacts without an invisible group blocking the medical access', () => {
  const { w, point } = field(), contact = openPoint(w, point, { blocked: true }), member = horde(contact, contact);
  assert.ok(Math.hypot(member.x - point.x, member.y - point.y) < C.CampaignPackRules.danger);
  assert.equal(g.frontier.visibleEnemy(member), false);
  const before = possessions(); assert.equal(g.campaignPack.previewWork().ok, true);
  assert.equal(g.campaignPack.begin().ok, true); assert.equal(g.campaignPack.busy(), true);
  assert.deepEqual(g.player.carry, before.carry); assert.deepEqual(g.resources, before.resources);
  assert.equal(g.campaignPack.cancel(), true); assert.deepEqual(possessions(), before);
});

test('153 campaign: a newly materialized nearby wild contact interrupts paid field work without consuming the final field supplies', () => {
  const { w, point } = field(), center = openPoint(w, point, { max: 2.2 }), save = g.serialize();
  save.worldEvolution.serial = 1; save.worldEvolution.nextHorde = 10000;
  save.worldEvolution.groups = [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0, ...center, a: 0, seen: false, contacts: {} }];
  assert.equal(g.restoreSave(save), true); assert.equal(g.worldEvolution.groupMembers().length, 0);
  const before = possessions(); assert.equal(g.campaignPack.begin().ok, true);
  g.player.invulnerable = 100; work(.04);
  assert.ok(g.worldEvolution.groupMembers().some(e => g.frontier.visibleEnemy(e) && Math.hypot(e.x - point.x, e.y - point.y) < C.CampaignPackRules.danger));
  assert.equal(g.campaignPack.busy(), false); assert.deepEqual(g.player.carry, before.carry);
  assert.deepEqual(g.resources, before.resources); assert.deepEqual(g.campaignPack.snapshot(), before.campaign);
  assert.equal(g.campaignPack.snapshot().active.stage, 'field');
  assert.equal(g.save(false), true); assert.equal(g.load(), true);
  assert.equal(g.campaignPack.busy(), false); assert.equal(g.campaignPack.begin().ok, false);
});
