'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core.js'), { bootDocument134 } = require('../scripts/qa-startup134.cjs');

test('banc défenses148 : infrastructures légales et vrais accès, aucun équipement ou RNG offert', async () => {
  const { defenseCampFixture, defenseServiceFixture, defensePlanSiteFixture, defenseContactFixture, defenseHeldContactDepartureFixture } = await import('../scripts/browser-defenses-fixtures148.mjs');
  const { g } = bootDocument134(); g.startNew('standard', '903148'); g.campaignIntro132.skip(); g.togglePause(true);
  const rng = g.random.state, arsenal = g.arsenal134.snapshot(), nodes = g.serialize().nodes, identity = g.runId;
  const camp = defenseCampFixture(); assert.equal(camp.added.length, 4); assert.ok(g.tier.id >= 2);
  assert.equal(g.random.state, rng); assert.equal(g.runId, identity); assert.deepEqual(g.serialize().nodes, nodes);
  assert.deepEqual(g.arsenal134.snapshot(), arsenal); assert.deepEqual(g.fortificationPack.snapshot().fittings, []);
  for (const type of ['workshop', 'spikes', 'core']) {
    const fixture = defenseServiceFixture({ type, bag: type === 'spikes' ? C.FortificationPackRules.mechanisms.ankle.cost : null });
    const b = g.world.buildings.get(fixture.support);
    assert.ok(g.friendlyPositionClear(g.player, g.player.x, g.player.y)); assert.ok(g.workerCanWorkAt(g.player, b, C.Arsenal134Rules.homeReach));
    g.showCommand(true);
    if (type === 'workshop') assert.equal(g.arsenal134.preview('craft', 'assemblyHammer').ok, true);
    if (type === 'spikes') assert.equal(g.fortificationPack.previewMechanism('ankle', b.id).ok, true);
  }
  const before = g.world.buildings.size, stock = { ...g.resources };
  const site = defensePlanSiteFixture('maintenanceRedoubt'); assert.equal(site.site.items.length, 27);
  assert.deepEqual(site.site.cost, { scrap: 520, stone: 105, wood: 270, ammo: 40, fuel: 20 });
  assert.equal(g.world.buildings.size, before); assert.deepEqual(g.resources, stock); assert.equal(g.random.state, rng);
  defenseServiceFixture({ type: 'core' });
  const hidden = defenseContactFixture({ kind: 'shielded', hidden: true });
  assert.equal(hidden.observed, 0); assert.equal(g.zombies[0].health, C.ENEMIES.shielded.health);
  assert.equal(g.remainingAssault, 24); assert.equal(g.wavePlan.total, 24); assert.equal(C.spawnCount(g.wavePlan.composition), 24);
  assert.deepEqual(g.spawnQueue, ['walker', 'walker']); assert.equal(g.pendingSpawns.walker, 21);
  assert.equal(g.random.state, rng); assert.doesNotThrow(() => globalThis.DeadwallSave.validate(g.serialize()));
  assert.deepEqual(g.arsenal134.snapshot(), arsenal); assert.deepEqual(g.fortificationPack.snapshot().fittings, []);
  defenseServiceFixture({ type: 'core' });
  const walkers = defenseContactFixture({ kind: 'walker', count: 6 });
  assert.equal(walkers.count, 6); assert.equal(g.zombies.length, 6); assert.equal(C.spawnCount(g.wavePlan.composition), 24);
  assert.equal(g.wavePlan.composition.walker, 24); assert.equal(g.spawnQueue.length, 2); assert.equal(g.pendingSpawns.walker, 16);
  assert.equal(g.remainingAssault, 24); assert.doesNotThrow(() => globalThis.DeadwallSave.validate(g.serialize()));
  defenseServiceFixture({ type: 'core' }); const charging = defenseContactFixture({ kind: 'charger', trap: true });
  assert.equal(charging.count, 1); assert.equal(g.zombies[0].health, C.ENEMIES.charger.health);
  assert.equal(g.zombies[0].charge.stage, 'rush'); assert.equal(g.zombies[0].charge.timer, C.ENEMY_RULES.charge.rushSeconds);
  assert.deepEqual(charging.initialCharge, g.zombies[0].charge); assert.ok(g.hostilePositionClear(g.zombies[0], g.zombies[0].x, g.zombies[0].y));
  assert.doesNotThrow(() => globalThis.DeadwallSave.validate(g.serialize())); assert.equal(g.random.state, rng);
  defenseServiceFixture({ type: 'spikes', bag: C.FortificationPackRules.mechanisms.ankle.cost }); g.showCommand(true);
  assert.equal(g.fortificationPack.startMechanism('ankle', globalThis.__DEFENSE148_CAMP__.spikes).ok, true);
  g.showCommand(false); g.togglePause(false); for (let i = 0; i < 81; i++) g.fortificationPack.step(.1);
  assert.equal(g.fortificationPack.busy(), false); g.togglePause(true); defenseContactFixture({ kind: 'charger', trap: true });
  g.showCommand(false); g.togglePause(false); g.updateZombies(.04); g.togglePause(true);
  const held = g.fortificationPack.snapshot(), actor = g.serialize().zombies[0], nextRNG = g.random.state;
  const moved = defenseHeldContactDepartureFixture(); assert.equal(moved.moves.length, 1); assert.equal(g.random.state, nextRNG);
  assert.deepEqual(g.fortificationPack.snapshot(), held); const after = g.serialize().zombies[0];
  const { x, y, ...rest } = actor, { x: movedX, y: movedY, ...afterRest } = after;
  assert.deepEqual(afterRest, rest); assert.notDeepEqual({ x: movedX, y: movedY }, { x, y });
  assert.doesNotThrow(() => globalThis.DeadwallSave.validate(g.serialize()), 'Held identity survives its explicit position fixture');
});

test('banc défenses148 : préconditions de scène refusées sans changer la campagne', async () => {
  const { defenseCampFixture, defenseContactFixture, defenseServiceFixture } = await import('../scripts/browser-defenses-fixtures148.mjs');
  const { g } = bootDocument134(); g.startNew('standard', '903148'); g.campaignIntro132.skip();
  const stable = () => { const { timestamp, ...data } = g.serialize(); return JSON.stringify(data); };
  const before = stable();
  assert.throws(() => defenseCampFixture(), /paused/); assert.throws(() => defenseContactFixture({ kind: 'shielded' }), /Paused/);
  assert.equal(stable(), before); g.togglePause(true); const paused = stable();
  assert.throws(() => defenseContactFixture({ kind: 'constructor' }), /Paused/);
  assert.throws(() => defenseContactFixture({ kind: 'walker', count: 23 }), /finite/);
  assert.throws(() => defenseContactFixture({ kind: 'shielded', count: 2 }), /one contact/); assert.equal(stable(), paused);
  assert.throws(() => defenseServiceFixture({ type: 'workshop' }), /Missing/); assert.equal(stable(), paused);
});

test('banc défenses148 : vrai contact sans chevauchement acquis par l’IA pendant la recharge payée', async () => {
  const { defenseCampFixture, defenseServiceFixture, defenseContactFixture } = await import('../scripts/browser-defenses-fixtures148.mjs');
  const { g } = bootDocument134(); g.startNew('standard', '903148'); g.campaignIntro132.skip(); g.togglePause(true);
  defenseCampFixture(); defenseServiceFixture({ type: 'core' }); g.showCommand(true);
  const definition = C.Arsenal134Rules.catalog.singleShot, stock = { ...g.resources };
  assert.equal(g.arsenal134.begin('craft', 'singleShot').ok, true);
  g.showCommand(false); g.togglePause(false);
  for (let i = 0; i < 180; i++) g.arsenal134.step(.04);
  assert.equal(g.arsenal134.busy(), false);
  for (const [key, cost] of Object.entries(definition.cost)) assert.equal(g.resources[key], stock[key] - cost);
  const gun = g.arsenal134.snapshot().locker.find(i => i.id === 'singleShot'); assert.ok(gun); assert.equal(gun.rounds, 0);
  g.showCommand(true); assert.equal(g.arsenal134.transfer(gun.uid, 'carried').ok, true); assert.equal(g.arsenal134.equip(gun.uid).ok, true);
  g.showCommand(false); g.togglePause(true);
  const rng = g.random.state, health = g.player.health, fixture = defenseContactFixture({ kind: 'shielded' });
  assert.equal(g.random.state, rng); assert.equal(g.player.health, health); assert.equal(fixture.observed, 1); assert.equal(g.units.length, 0);
  const z = g.zombies[0], position = { x: z.x, y: z.y }, distance = Math.hypot(z.x - g.player.x, z.y - g.player.y);
  assert.ok(distance > g.player.radius + z.radius && distance < 34); assert.ok(Math.abs(distance - 30) < 1e-8);
  assert.ok(g.hostilePositionClear(z, z.x, z.y)); assert.ok(g.hostileLineClear(g.player, z));
  const ammo = g.playerOps131.reloadAvailable(); g.togglePause(false); g.startReload(); assert.equal(g.player.reload, definition.reload);
  for (let i = 0; i < 98; i++) {
    g.updatePlayer(.04); g.updateZombies(.04);
    assert.deepEqual({ x: z.x, y: z.y }, position, 'The real victim branch holds the contact rather than following flow to a building');
    assert.ok(z.attackCooldown > 0, 'The real living player is actually acquired and attacked');
    assert.equal(g.zombieBulletDamage(z, definition.damage, g.player), definition.damage * C.ENEMY_RULES.shield.damageMultiplier);
  }
  assert.equal(g.player.reload, 0); assert.equal(g.player.magazine.rifle, 1);
  assert.equal(g.playerOps131.reloadAvailable(), ammo - definition.ammoPerReload);
  assert.ok(g.player.health > 0 && g.player.health < health, 'Actual danger remains; no fixture healing or invulnerability extension');
  assert.equal(z.health, C.ENEMIES.shielded.health);
});
