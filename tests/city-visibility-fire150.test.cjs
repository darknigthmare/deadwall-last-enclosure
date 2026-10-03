'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../src/core.js'), V = require('../src/visibility146.js');
const { boot127 } = require('./helpers/expansions127.cjs');
const enemy = p => ({ id: 9150, ...p, health: 60, dead: false });
const stable = g => { const s = g.serialize(); delete s.timestamp; return JSON.stringify(s); };

function towerFixture(type = 'concreteWatch150') {
  const { game: g } = boot127(); V.install(g); g.startNew('standard', '903145');
  // Explicit physical lookout fixture; no claim of a campaign-earned unlock.
  g.units = []; g.player.regionAbsent = true; g.daylight = () => 1;
  for (const b of g.world.buildings.values()) b.siegeOffline = true;
  let p;
  for (let y = 700; !p && y < 3500; y += 64) for (let x = 700; x < 2900; x += 64) {
    const a = { x, y }, z = { x: x + 31 * 32, y };
    if (g.friendlyPositionClear({ radius: 13 }, x, y) && g.friendlyPositionClear({ radius: 13 }, z.x, z.y) && g.hostileLineClear(a, z, false)) { p = a; break; }
  }
  assert.ok(p, 'Une vraie ligne dégagée de 31 m est disponible.');
  const b = new (g.core().constructor)(g.nextId++, type, Math.floor(p.x / 32), Math.floor(p.y / 32), 0, 0);
  g.world.add(b); b.powered = true;
  return { g, b, near: enemy({ x: b.x + 27 * 32, y: b.y }), far: enemy({ x: b.x + 29 * 32, y: b.y }) };
}

test('City150: la tour de veille respecte sa portée et perd sa vue dès la panne ou la destruction', () => {
  const { g, b, near, far } = towerFixture();
  assert.equal(g.visibility.canSeeLocal(near), false, 'Une fondation ne voit pas.');
  b.progress = 1; b.health = b.maxHealth;
  assert.equal(g.visibility.canSeeLocal(near), true);
  assert.equal(g.visibility.canSeeLocal(far), false);
  const frame = g.visibility.frame(); b.powered = false;
  assert.equal(frame.canSeeLocal(near), false); b.powered = true;
  for (const flag of ['siegeOffline', 'territoryOffline', 'gridOffline', 'dayOffline']) {
    b[flag] = true; assert.equal(g.visibility.canSeeLocal(near), false, flag); b[flag] = false;
  }
  b.dead = true; assert.equal(g.visibility.canSeeLocal(near), false);
});

test('City150: une vraie porte ferme le rayon de la nouvelle tour et les consultations ne changent pas la partie', () => {
  const { g, b } = towerFixture(); b.progress = 1; b.health = b.maxHealth;
  const gate = new (g.core().constructor)(g.nextId++, 'gate', b.gx + 5, b.gy, 0, 1); g.world.add(gate);
  const z = enemy({ x: gate.right + 40, y: gate.y });
  gate.gateMode = 'closed'; assert.equal(g.visibility.canSeeLocal(z), false);
  gate.gateMode = 'open'; assert.equal(g.visibility.canSeeLocal(z), true);
  const before = stable(g), rng = g.random.state;
  for (let i = 0; i < 30; i++) assert.equal(g.visibility.canSeeLocal(z), true);
  assert.equal(stable(g), before); assert.equal(g.random.state, rng);
  const frame = g.visibility.frame(); gate.gateMode = 'closed'; assert.equal(frame.canSeeLocal(z), false);
});

for (const type of ['casemate150', 'reinforcedCasemate150', 'twinGun150']) test('City150: le poste autonome observe uniquement à portée et par une vraie ligne — ' + type, () => {
  const { g, b } = towerFixture(type), range = b.def.observerRange150;
  const close = enemy({ x: b.x + (range - .5) * 32, y: b.y }), far = enemy({ x: b.x + (range + .5) * 32, y: b.y });
  assert.equal(g.visibility.canSeeLocal(close), false, 'La fondation ne détecte personne.');
  b.progress = 1; b.health = b.maxHealth; b.powered = false;
  assert.equal(g.visibility.canSeeLocal(close), true, 'Le poste autonome fonctionne sans courant.');
  assert.equal(g.visibility.canSeeLocal(far), false);
  const before = stable(g); g.visibility.canSeeLocal(close); assert.equal(stable(g), before);
  g.daylight = () => 0; assert.equal(g.visibility.canSeeLocal(close), false, 'La nuit réduit aussi la vue de ce poste.'); g.daylight = () => 1;
  const gate = new (g.core().constructor)(g.nextId++, 'gate', b.gx + 4, b.gy, 0, 1); g.world.add(gate);
  const z = enemy({ x: gate.right + 20, y: gate.y }); gate.gateMode = 'closed'; assert.equal(g.visibility.canSeeLocal(z), false);
  gate.gateMode = 'open'; assert.equal(g.visibility.canSeeLocal(z), true);
  const frame = g.visibility.frame(); b.dead = true; assert.equal(frame.canSeeLocal(z), false);
});

function building(id, type, progress = 1) {
  const def = C.BUILDINGS[type];
  return { id, type, def, x: 500, y: 500, w: def.size[0], h: def.size[1], health: def.health, maxHealth: def.health, progress, completed: progress >= 1, powered: true, dead: false };
}
for (const type of ['electricCannery150', 'equippedShelter150', 'continuityArsenal150', 'frontBattery150']) {
  test('City150: incendie, dégâts, extinction payée en eau et reprise exacte — ' + type, () => {
    const b = building(20, type), e = new C.Siege.Engine();
    assert.equal(e.ignite(b, 'blast'), true);
    const health = b.health;
    e.step(.25, { buildings: [b], resources: { fuel: 20 }, running: true, damage: (target, n) => { target.health -= n; } });
    assert.ok(b.health < health);
    const saved = e.snapshot(); assert.deepEqual(new C.Siege.Engine(saved).snapshot(), saved);
    e.state.playerWater = C.Siege.RULES.bucketCapacity;
    for (let i = 0; i < 30 && e.fire(b.id); i++) e.suppress(b.id, 0, .25, { running: true, accessible: true, secure: true });
    assert.equal(e.fire(b.id), undefined); assert.ok(e.state.stats.waterUsed > 0);
    assert.equal(e.ignite(b, 'blast'), false, 'Le délai humide interdit un rallumage immédiat.');
    assert.deepEqual(new C.Siege.Engine(e.snapshot()).snapshot(), e.snapshot());
  });
}
test('City150: béton défensif et fondations restent incombustibles', () => {
  const e = new C.Siege.Engine();
  for (const type of ['casemate150', 'reinforcedCasemate150', 'concreteWatch150']) assert.equal(e.ignite(building(30, type), 'blast'), false);
  assert.equal(e.ignite(building(31, 'continuityArsenal150', .5), 'blast'), false);
});
