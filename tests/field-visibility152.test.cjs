'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { fixture } = require('./helpers/navigation130.cjs');
const V = require('../src/visibility146.js');

function scene({ seen = true, distances = [80] } = {}) {
  const { g, doc } = fixture({ ui: true }); V.install(g);
  const w = g.frontier.world(); let point;
  for (const road of w.roads) {
    const p = { x: (road.a.x + road.b.x) / 2, y: (road.a.y + road.b.y) / 2 };
    if (Math.hypot(p.x - w.home.x, p.y - w.home.y) < 600) continue;
    if ([0, ...distances].every(d => !w.blocked(p.x + d, p.y, .32, 0, null)) &&
      distances.filter(d => d < 20).every(d => w.line(p, { x: p.x + d, y: p.y }, 0, null, null, .015))) { point = p; break; }
  }
  assert.ok(point, 'Reproducible clear regional road for real visibility queries');
  const saved = g.serialize();
  Object.assign(saved.frontier, point, { active: true, anchor: { x: g.player.x, y: g.player.y }, z: 0, inside: null });
  saved.worldEvolution.serial = 1;
  saved.worldEvolution.groups = [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0,
    x: point.x + 80, y: point.y, a: 0, seen, fallen: [], injuries: {},
    contacts: Object.fromEntries(distances.map((d, i) => [i, { x: point.x + d, y: point.y, z: 0, a: 0,
      mode: 'idle', ttl: 0, gx: point.x + d, gy: point.y, cool: 0 }])) }];
  g.restoreSave(saved); g.paused = true; g.daylight = () => 1;
  return { g, doc };
}
function stable(g) { const { timestamp, ...s } = g.serialize(); return JSON.stringify(s); }
function status(doc) { return doc.getElementById('fieldDock').children[0].textContent; }

test('regional HUD and dossier hide a previously discovered horde outside current allied vision', () => {
  const { g, doc } = scene(), before = stable(g);
  assert.equal(g.visibility.canSeeRegional(g.worldEvolution.groupMembers()[0]), false);
  g.worldEvolutionUI.refresh(true);
  assert.doesNotMatch(status(doc), /HORDE|CONTACTS|80/);
  g.worldEvolutionUI.open('world');
  assert.equal(doc.getElementById('evolutionPanel').querySelectorAll('.evo-card').length, 0);
  assert.equal(stable(g), before, 'Consultation neither discovers nor modifies saved contacts');
});

test('regional HUD reports only currently observed members at their actual nearest position', () => {
  const { g, doc } = scene({ seen: false, distances: [3, 8, 80] }), before = stable(g);
  assert.deepEqual(g.worldEvolution.groupMembers().map(e => g.visibility.canSeeRegional(e)), [true, true, false]);
  g.worldEvolutionUI.refresh(true);
  assert.match(status(doc), /CONTACTS 2 à 3 m/);
  assert.doesNotMatch(status(doc), /80/);
  g.worldEvolutionUI.open('world');
  const cards = doc.getElementById('evolutionPanel').querySelectorAll('.evo-card');
  assert.equal(cards.length, 1); assert.match(cards[0].children[0].textContent, /2 contacts observés/);
  assert.equal(stable(g), before, 'A new visible contact needs no historic seen flag or discovery mutation');
});

test('losing the regional observer removes contact information on the next refresh', () => {
  const { g, doc } = scene({ distances: [3] }); g.worldEvolutionUI.refresh(true);
  assert.match(status(doc), /CONTACTS 1 à 3 m/);
  g.player.health = 0; g.worldEvolutionUI.refresh(true);
  assert.doesNotMatch(status(doc), /CONTACTS|HORDE/);
  g.worldEvolutionUI.open('world');
  assert.equal(doc.getElementById('evolutionPanel').querySelectorAll('.evo-card').length, 0);
});
