'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument133 } = require('./helpers/document133.cjs');
const copy = value => JSON.parse(JSON.stringify(value));

function click(button) {
  assert.ok(document.body.contains(button));
  assert.equal(button.disabled, false);
  assert.equal(button.closest('[inert], .hidden'), null);
  button.click();
}

function archiveIds(g) {
  const profile = g.profile.get();
  const stored = globalThis.DeadwallProfile.load(localStorage).profile;
  assert.deepEqual(stored, profile, 'Campaign history is durable');
  return profile.recentRuns.map(run => run.runId).sort();
}

test('campaign identity: every initial autosave uses one ID, and replaying the seed adds exactly one campaign', t => {
  const env = bootDocument133(); env.ready();
  const g = env.g, C = globalThis.DeadwallCore, P = globalThis.DeadwallProfile;
  const writes = [], store = localStorage, setItem = store.setItem;
  store.setItem = (key, value) => {
    if (key === C.SAVE_KEY) writes.push(JSON.parse(value).runId);
    return setItem(key, value);
  };
  document.getElementById('mapSeed').value = '17117';
  try { click(g.ui.newGameButton); }
  finally { store.setItem = setItem; }
  const first = g.runId;
  assert.equal(writes.length, 1, 'The integrated campaign persists once after every initializer has completed');
  assert.deepEqual([...new Set(writes)], [first], 'World activation must not rename a campaign after its first autosave');
  assert.deepEqual(archiveIds(g), [first]);
  assert.equal(g.profile.get().summary.retainedRuns, 1);
  assert.equal(g.exploration125.generation, 4); assert.equal(g.exploration125.layoutRevision, 4);
  assert.equal(g.frontier.position().generation, 10); assert.equal(g.frontier.position().detailVersion, 13); assert.equal(g.frontier.position().ecologyVersion, 1);
  click(g.campaignIntro132.element.querySelector('#campaignIntro132Skip'));
  for (let i = 0; i < 3; i++) assert.equal(g.save(false), true);
  g.returnToMenu(); click(g.ui.continueButton);
  assert.equal(g.runId, first); assert.deepEqual(archiveIds(g), [first]);

  // Prepare the defeat through the real damage controller, then use Rejouer.
  g.damageBuilding(g.core(), g.core().health);
  assert.equal(g.gameOver, true); click(document.getElementById('restartButton'));
  const second = g.runId;
  assert.notEqual(second, first); assert.equal(g.world.seed, 17117);
  assert.deepEqual(archiveIds(g), [first, second].sort());
  assert.equal(g.profile.get().recentRuns.find(run => run.runId === first).ended, true);
  assert.equal(g.profile.get().summary.retainedRuns, 2);
  assert.equal(g.frontier.position().generation, 10); assert.equal(g.frontier.position().detailVersion, 13); assert.equal(g.frontier.position().ecologyVersion, 1);
  click(g.campaignIntro132.element.querySelector('#campaignIntro132Skip')); g.returnToMenu();

  const previousConfirm = Object.getOwnPropertyDescriptor(globalThis, 'confirm');
  t.after(() => { if (previousConfirm) Object.defineProperty(globalThis, 'confirm', previousConfirm); else delete globalThis.confirm; });
  globalThis.confirm = () => false;
  const before = new Map(env.storage), world = g.world;
  click(g.ui.newGameButton);
  assert.equal(g.world, world); assert.equal(g.runId, second);
  assert.deepEqual(env.storage, before, 'Cancelling replacement preserves saves and every history byte');
  assert.deepEqual(archiveIds(g), [first, second].sort());
  assert.equal(P.load(localStorage).profile.summary.retainedRuns, 2);
});

test('campaign identity: historical marked G4 and G8 saves keep their IDs and existing archive rows', () => {
  const source = bootDocument133(); source.ready();
  source.g.startNew('standard', '17117'); source.g.campaignIntro132.skip();
  const raw = copy(source.g.serialize()), profile = source.g.profile.get();
  const row = profile.recentRuns.find(run => run.runId === source.g.runId);
  for (const generation of [4, 8]) {
    const marked = 'run:historical-' + generation + ':g4', unmarked = marked.slice(0, -3), saved = copy(raw);
    saved.runId = marked; saved.frontier.generation = generation;
    // These archived saves predate the explicit ecological revision.
    delete saved.frontier.ecologyVersion;delete saved.frontier.hydrologyVersion;
    if (generation === 4) { saved.frontier.x = 4162; saved.frontier.y = 4096; }
    const ids = generation === 8 ? [unmarked, marked] : [marked];
    const historical = globalThis.DeadwallProfile.validate({ ...profile, recentRuns: ids.map(runId => ({ ...row, runId })) });
    const env = bootDocument133({ storageEntries: [
      [globalThis.DeadwallCore.SAVE_KEY, JSON.stringify(saved)],
      [globalThis.DeadwallProfile.PROFILE_KEY, JSON.stringify(historical)]
    ] }); env.ready();
    const g = env.g;
    click(g.ui.continueButton);
    assert.equal(g.runId, marked); assert.equal(g.frontier.position().generation, generation);
    assert.equal(g.frontier.position().ecologyVersion, 0, 'An absent historical flag must remain ecology zero');
    assert.equal(g.exploration125.generation, 4); assert.equal(g.exploration125.layoutRevision, 3);
    assert.equal(g.save(false), true);
    assert.deepEqual(archiveIds(g), ids.sort(), 'Loading cannot rename or merge historical campaign identities');
    const persisted = globalThis.DeadwallSave.parse(env.storage.get(globalThis.DeadwallCore.SAVE_KEY));
    assert.equal(persisted.runId, marked); assert.equal(persisted.frontier.ecologyVersion, 0);
    const previousRows = g.profile.get().recentRuns;
    g.startNew('standard', '17117');
    assert.equal(g.frontier.position().ecologyVersion, 1, 'The subsequent real new G8 campaign selects the current ecology');
    assert.deepEqual(archiveIds(g), [...ids, g.runId].sort());
    assert.deepEqual(g.profile.get().recentRuns.filter(run => ids.includes(run.runId)), previousRows,
      'A new game preserves existing records, including historical duplicate-looking IDs');
  }
});

test('campaign identity: legacy generation markers remain readable without an explicit exploration register', () => {
  const X = require('../src/exploration-125.js');
  const historical = { runId: 'run:legacy:g4', player: {}, exploration125: {} };
  X.applyExplorationState(historical);
  assert.equal(historical.runId, 'run:legacy:g4'); assert.equal(historical.exploration125.generation, 4);
  assert.equal(historical.exploration125.layoutRevision, 1);
  const current = { runId: 'run:current', player: {}, exploration125: {} };
  X.applyExplorationState(current, { generation: 4, layoutRevision: 3 });
  assert.equal(current.runId, 'run:current'); assert.equal(current.exploration125.generation, 4);
  assert.equal(current.exploration125.layoutRevision, 3);
  for (const generation of [3, 4, 8]) {
    const regional = { runId: 'run:unmarked-' + generation, player: {}, frontier: { snapshot: () => ({ generation }) } };
    X.applyExplorationState(regional);
    assert.equal(regional.runId, 'run:unmarked-' + generation);
    assert.equal(regional.exploration125.generation, generation >= 4 ? 4 : 3);
    assert.equal(regional.exploration125.layoutRevision, 1);
  }
});
