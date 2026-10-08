'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
let g, C;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; });
function fresh() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  assert.ok(g.population >= C.WorldEvolution.RULES.companionRules.minimumPopulation);
  assert.equal(g.worldEvolution.assignCompanion('samir'), true);
  assert.equal(g.companionsPack.fill('samir').ok, true);
}
function possessions() { return { world: g.worldEvolution.snapshot(), companions: g.companionsPack.snapshot(), resources: { ...g.resources }, carry: { ...g.player.carry }, rng: g.random.state, saved: localStorage.getItem(C.SAVE_KEY) }; }

test('153 world command: an absent companion refuses removal without mutation or a replacement save', () => {
  fresh(); const before = possessions();
  assert.equal(g.worldEvolution.removeCompanion('malik'), false);
  assert.equal(g.worldEvolution.removeCompanion('constructor'), false);
  assert.deepEqual(possessions(), before);
});
test('153 world command: removing a companion waits through a real pause or return to menu', () => {
  for (const menu of [false, true]) {
    fresh(); menu ? g.returnToMenu() : g.togglePause(true);
    assert.equal(g.canIssueCommand(), false); const before = possessions();
    assert.equal(g.worldEvolution.removeCompanion('samir'), false); assert.deepEqual(possessions(), before);
  }
});
test('153 world command: destroying the real command centre prevents subsequent team mutation or reserve refund', () => {
  fresh(); const core = g.core(); g.damageBuilding(core, core.health + 1);
  assert.equal(g.gameOver, true); assert.equal(g.core(), null); assert.equal(g.canIssueCommand(), false);
  const before = possessions(); assert.equal(g.worldEvolution.removeCompanion('samir'), false);
  assert.deepEqual(possessions(), before);
  assert.equal(g.worldEvolution.overview().companions.some(c => c.id === 'samir'), true);
});
test('153 world command: retirement still succeeds once from the actual paused command modal and preserves paid sacoche reserves', () => {
  fresh(); g.showCommand(true); assert.equal(g.paused, true); assert.equal(g.activeOverlay, g.ui.commandModal);
  assert.equal(g.canIssueCommand(), true); const before = possessions();
  assert.equal(g.worldEvolution.removeCompanion('samir'), true);
  assert.equal(g.worldEvolution.overview().companions.some(c => c.id === 'samir'), false);
  assert.deepEqual(g.companionsPack.snapshot(), before.companions); assert.deepEqual(g.resources, before.resources);
  const after = possessions(); assert.equal(g.worldEvolution.removeCompanion('samir'), false);
  assert.deepEqual(possessions(), after);
});
