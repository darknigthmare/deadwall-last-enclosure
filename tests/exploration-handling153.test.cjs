'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { standAt } = require('./helpers/physical-fixtures.cjs');
let g, C;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; });
function possessions() { return { cache: g.explorationPack.snapshot(), carry: { ...g.player.carry }, resources: { ...g.resources }, rng: g.random.state, deposited: g.depositedResources }; }
function cacheAtTower() {
  g.startNew('standard', '17117'); g.campaignIntro132.skip(); g.phaseTime = 999;
  standAt(g, g.player, g.core());
  assert.equal(g.loadout.transfer('depot', 'sac', 'wood', 10).amount, 10);
  assert.equal(g.loadout.transfer('depot', 'sac', 'scrap', 5).amount, 5);
  const core = g.core(); let scene;
  for (let dy = -8; dy <= 8 && !scene; dy++) for (let dx = -8; dx <= 8 && !scene; dx++) {
    if (!g.world.placement(C.BUILDINGS.watchtower, core.gx + dx, core.gy + dy, 0).valid) continue;
    const b = new (core.constructor)(g.nextId++, 'watchtower', core.gx + dx, core.gy + dy, 0, 1); g.world.add(b);
    const p = g.fieldcraft.service(g.player, b);
    if (p) { Object.assign(g.player, p); if (g.loadout.atHome() && g.explorationPack.preview('cache').ok) scene = { b, p }; }
    if (!scene) g.world.remove(b);
  }
  assert.ok(scene, 'A real accessible tower and empty cache placement share the depot area.');
  g.refreshMetrics(true);
  assert.equal(g.explorationPack.placeCache().ok, true);
  for (let left = C.ExplorePackRules.cacheSeconds; left > 1e-7; left -= .04) g.explorationPack.step(Math.min(.04, left));
  const cache = g.explorationPack.snapshot().caches[0]; assert.ok(cache); assert.equal(C.bagTotal(cache.stock), 0);
  assert.equal(g.player.carry.wood, 4); assert.equal(g.player.carry.scrap, 2);
  return { ...scene, cache };
}
test('153 exploration: a cache transfer waits for a real reload and then moves the exact remaining bag without a deposit credit', () => {
  const { cache } = cacheAtTower();
  g.player.magazine.pistol = 0; g.startReload(); assert.ok(g.player.reload > 0);
  const before = possessions(); assert.equal(g.explorationPack.cacheTransfer(cache.id, 'store').ok, false);
  const blocked = g.explorationPack.actions().find(a => a.id === 'store-cache'); assert.equal(blocked.disabled, true); assert.match(blocked.reason, /rechargement/);
  assert.deepEqual(possessions(), before); assert.ok(g.player.reload > 0);
  for (let i = 0; i < 100 && g.player.reload > 0; i++) g.updatePlayer(.04);
  assert.equal(g.player.reload, 0); const bag = { ...g.player.carry }, total = C.bagTotal(bag);
  assert.equal(g.explorationPack.cacheTransfer(cache.id, 'store').ok, true);
  assert.equal(C.bagTotal(g.player.carry), 0); assert.deepEqual(g.explorationPack.snapshot().caches[0].stock, bag);
  assert.equal(g.depositedResources, before.deposited); assert.equal(C.bagTotal(g.explorationPack.snapshot().caches[0].stock), total);
  assert.equal(g.save(false), true); assert.equal(g.load(), true);
  assert.deepEqual(g.explorationPack.snapshot().caches[0].stock, bag);
});
test('153 exploration: taking and storing a real cache both refuse the mounted tower without releasing it or losing supplies', () => {
  const { b, cache } = cacheAtTower(), bag = { ...g.player.carry };
  assert.equal(g.explorationPack.cacheTransfer(cache.id, 'store').ok, true);
  assert.equal(g.fieldcraft.control(b), true); assert.equal(g.fieldcraft.context().mounted, b.id);
  const before = possessions(); assert.equal(g.explorationPack.cacheTransfer(cache.id, 'take').ok, false);
  const blocked = g.explorationPack.actions().find(a => a.id === 'take-cache'); assert.equal(blocked.disabled, true); assert.match(blocked.reason, /poste de tir/);
  assert.equal(g.explorationPack.cacheTransfer(cache.id, 'store').ok, false); assert.deepEqual(possessions(), before);
  assert.equal(g.fieldcraft.context().mounted, b.id);
  assert.equal(g.fieldcraft.control(), true); assert.equal(g.explorationPack.cacheTransfer(cache.id, 'take').ok, true);
  assert.deepEqual(g.player.carry, bag); assert.equal(C.bagTotal(g.explorationPack.snapshot().caches[0].stock), 0);
  assert.equal(g.depositedResources, before.deposited); assert.deepEqual(g.resources, before.resources);
});
