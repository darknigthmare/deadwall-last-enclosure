'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { legacyAge } = require('./helpers/legacy-city.cjs');
let g, C, G;
test.before(() => { ({ g } = bootDocument134()); C = globalThis.DeadwallCore; G = globalThis.DeadwallFrontierGeometry; });

// Prepared historical knowledge and finite depot stocks isolate the existing
// paid annex commands. These fixtures make no organic campaign-time claim.
function fresh(generation = 8, seed = '17117') {
  g.startNew('standard', seed); g.campaignIntro132.skip(); g.phaseTime = 999;
  if (generation !== g.frontier.position().generation) {
    const raw = g.serialize(); Object.assign(raw.frontier, { generation, x: 4096, y: 4096, z: 0, inside: null });
    g.restoreSave(raw);
  }
  assert.equal(g.frontier.position().generation, generation);
  legacyAge(g, 1850);
  for (const key of C.RESOURCE_KEYS) g.resources[key] = 2000;
  return g.frontier.world();
}
function point(id, x, y) {
  const pose = g.worldEvolution.overview().districts.find(d => d.id === id).pos;
  return { ...G.global({ ...pose, w: 0, h: 0 }, x, y), a: pose.a };
}
function build(id, type = 'housing') {
  if (!g.worldEvolution.snapshot().districts[id].level) assert.equal(g.worldEvolution.claimDistrict(id), true);
  const before = { ...g.resources }, q = g.worldEvolution.previewDistrictBuild(id, type);
  assert.equal(q.ok, true); assert.equal(g.worldEvolution.buildDistrict(id, type), true);
  for (const key of C.RESOURCE_KEYS) assert.equal(g.resources[key], before[key] - (q.cost[key] || 0));
}
function state() { return { stock: { ...g.resources }, bag: { ...g.player.carry }, taken: g.frontier.snapshot().taken, rng: g.random.state, annexes: g.worldEvolution.snapshot() }; }
function visit(w, p) {
  const raw = g.serialize();
  Object.assign(raw.frontier, p, { active: true, z: 0, inside: null, car: null, anchor: { x: g.player.x, y: g.player.y } });
  for (const place of w.nearPOI(p.x, p.y, 220)) for (let i = 0; i < w.threatCount(place); i++) raw.frontier.enemies[place.id + ':e' + i] = 0;
  raw.frontier.kills = Object.values(raw.frontier.enemies).filter(n => n === 0).length;
  g.restoreSave(raw); g.paused = false; g.activeOverlay = null; g.releaseInputs();
}

test('156 exploration: paid annex footprints block the shared regional collider and swept rays in every existing rotation', () => {
  for (const generation of [4, 7]) {
    const w = fresh(generation);
    for (const id of ['east', 'west', 'north', 'south', 'outer']) {
      build(id);
      const centre = point(id, -12, -17.5), a = point(id, -12, -24), b = point(id, -12, -11), gap = point(id, 2, -17.5);
      assert.equal(g.worldEvolution.districtBlocked(centre.x, centre.y, .32), true);
      assert.equal(w.blocked(centre.x, centre.y, .32, 0, null), true, 'The native world collider must include the paid ' + id + ' annex.');
      assert.equal(w.line(a, b, 0, null, null, .015), false, id + ' shell must occlude a ground ray.');
      assert.equal(w.line(a, b, 0, null, null, .32), false, id + ' shell must occlude a swept contact path.');
      assert.equal(w.vehicleClear(centre.x, centre.y, centre.a, 4.6, 1.85), false);
      assert.equal(w.blocked(gap.x, gap.y, .32, 0, null), false, 'The existing passage between the columns stays open.');
    }
  }
});

test('156 exploration: foundations occlude immediately, completion grants no new footprint and geometry queries preserve paid stocks', () => {
  const w = fresh(), a = point('east', -12, -24), b = point('east', -12, -11), centre = point('east', -12, -17.5);
  assert.equal(w.blocked(centre.x, centre.y, .32), false); assert.equal(w.line(a, b), true);
  build('east'); assert.equal(g.frontier.world(), w);
  const before = state();
  for (let i = 0; i < 30; i++) { assert.equal(w.blocked(centre.x, centre.y, .32), true); assert.equal(w.line(a, b), false); }
  assert.deepEqual(state(), before);
  const raw = g.serialize(); raw.worldEvolution.districts.east.buildings[0].progress = 1;
  assert.equal(g.restoreSave(raw), true); assert.equal(g.frontier.world(), w);
  assert.equal(w.blocked(centre.x, centre.y, .32), true); assert.equal(w.line(a, b), false);
  assert.deepEqual(g.player.carry, raw.player.carry); assert.deepEqual(g.frontier.snapshot().taken, raw.frontier.taken);
});

test('156 exploration: a source annex ignores only its own exact footprint while another paid foundation still intercepts its ray', () => {
  const w = fresh(); build('east', 'watch');
  const source = point('east', -12, -17.5), outside = point('east', -12, -5);
  assert.equal(w.line(source, outside, 0, null, null, .015), false);
  assert.equal(w.line(source, outside, 0, null, 'annex:east:0', .015), true);
  assert.equal(w.line(source, outside, 0, null, 'annex:west:0', .015), false);
  build('east', 'housing'); build('east', 'depot');
  assert.equal(w.line(source, outside, 0, null, 'annex:east:0', .015), false, 'Only the watch foundation can be ignored, never the following depot.');
  const before = state();
  assert.equal(w.blocked(source.x, source.y, .32, 0, null, 'annex:east:0'), false);
  assert.equal(w.blocked(source.x, source.y, .32, 0, null, 'annex:east:2'), true);
  assert.deepEqual(state(), before);
});

test('156 exploration: restore and a new seed invalidate only live annex colliders while keeping regional geometry and finite harvest ledgers', () => {
  const w = fresh(), before = g.serialize(), a = point('east', -12, -24), b = point('east', -12, -11);
  build('east'); const paid = g.serialize();
  assert.equal(w.line(a, b), false);
  assert.equal(g.restoreSave(before), true); assert.equal(g.frontier.world(), w); assert.equal(w.line(a, b), true);
  assert.equal(g.restoreSave(paid), true); assert.equal(g.frontier.world(), w); assert.equal(w.line(a, b), false);
  assert.deepEqual(g.frontier.snapshot().taken, paid.frontier.taken); assert.equal(g.random.state, paid.randomState);
  const next = fresh(7, '84329'); assert.notEqual(next, w);
  const other = point('east', -12, -17.5); assert.ok(Math.hypot(other.x - a.x, other.y - a.y) > 100);
  assert.equal(next.blocked(other.x, other.y, .32), false);
  assert.deepEqual(g.frontier.snapshot().taken, {}); assert.equal(globalThis.DeadwallSave.validate(g.serialize()).version, 20);
});

test('156 exploration: a real regional shot is consumed at an annex foundation while retaining its normal magazine and equipment cost', () => {
  const w = fresh(); build('east'); const source = point('east', -12, -23), target = point('east', -12, -12);
  visit(w, source); assert.equal(w.blocked(source.x, source.y, .32), false);
  const before = state(), shots = g.stats.shots, magazine = g.player.magazine.pistol, items = g.arsenal134.snapshot();
  assert.equal(g.player.weapon, 'pistol');
  const angle = Math.atan2(target.y - source.y, target.x - source.x);
  g.input.mouseX = g.width / 2 + Math.cos(angle) * 100; g.input.mouseY = g.height / 2 + Math.sin(angle) * 100;
  g.input.mouseDown = true; g.updatePlayer(.1); g.input.mouseDown = false;
  assert.equal(g.stats.shots, shots + 1); assert.equal(g.player.magazine.pistol, magazine - 1);
  assert.equal(g.frontier.overview().bullets.length, 0, 'The physical shot hits the first paid shell, instead of advancing through it.');
  assert.deepEqual(g.resources, before.stock); assert.deepEqual(g.player.carry, before.bag); assert.deepEqual(g.frontier.snapshot().taken, before.taken);
  const weapon = items.carried.find(i => i.uid === items.equipped);
  assert.equal(g.arsenal134.snapshot().carried.find(i => i.uid === items.equipped).condition, weapon.condition - C.Arsenal134Rules.catalog[weapon.id].wear);
});

test('156 exploration: a pursuing contact and companion path use the same live foundation sweep and the existing free passage', () => {
  const w = fresh(); build('east'); const Survey = globalThis.DeadwallFrontierSurvey, rules = C.FrontierTacticsRules;
  const a = point('east', -20, -24), b = point('east', -20, -11);
  const enemy = { id: 'fixture156', ...a, z: 0, poi: null, mode: 'pursuit', ttl: rules.memory, gx: b.x, gy: b.y, cool: 0, repath: 0 };
  const blocked = (x, y) => w.blocked(x, y, rules.enemyRadius, 0, null);
  const path = Survey.path(w, enemy, { ...b, z: 0, inside: null }, rules, blocked);
  assert.ok(path?.length > 1, 'The shared path planner can go around the physical foundation.');
  for (let i = 1; i < path.length; i++) assert.equal(w.line(path[i - 1], path[i], 0, null, null, rules.enemyRadius), true);
  assert.ok(path.some(p => G.local({ ...g.worldEvolution.overview().districts.find(d => d.id === 'east').pos, w: 0, h: 0 }, p.x, p.y).x < -22 - rules.enemyRadius));
  Survey.step(w, enemy, { ...b, z: 0, inside: null }, .1, rules, { left: rules.pathBudget }, blocked);
  assert.equal(blocked(enemy.x, enemy.y), false); assert.ok(enemy.path?.length > 0);
  const before = state();
  const companion = { ...a, z: 0, poi: null };
  assert.ok(Survey.path(w, companion, b, rules, (x, y) => w.blocked(x, y, C.WorldEvolution.RULES.companionRules.radius, 0, null))?.length > 1);
  assert.deepEqual(state(), before);
});

test('156 exploration: a paid completed annex observes past its own shell, and another actual foundation hides the same outdoor contact', () => {
  fresh(); build('east', 'watch');
  for (const building of g.world.buildings.values()) building.siegeOffline = true;
  const enemy = { id: 'annex-vision156', ...point('east', -12, -5), z: 0, poi: null, hp: 60 };
  assert.equal(g.visibility.canSeeRegional(enemy), false, 'The paid unfinished watch has no lookout yet.');
  const raw = g.serialize(); raw.worldEvolution.districts.east.buildings[0].progress = 1;
  assert.equal(g.restoreSave(raw), true);
  const before = state(); assert.equal(g.visibility.canSeeRegional(enemy), true, 'The actual completed lookout ignores its own exact footprint.');
  assert.deepEqual(state(), before, 'Observation creates no discoveries, resources or RNG advance.');
  build('east', 'housing'); assert.equal(g.visibility.canSeeRegional(enemy), true, 'The other column does not mask this physical ray.');
  build('east', 'depot'); assert.equal(g.visibility.canSeeRegional(enemy), false, 'The unfinished depot in the next row already blocks the line.');
});
