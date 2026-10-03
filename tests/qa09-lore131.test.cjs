'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { boot131 } = require('./helpers/expansions131.cjs');
const { standAt } = require('./helpers/physical-fixtures.cjs');
const C = require('../src/core.js'), D = require('../src/chronicles131-data.js');
const Lore = require('../src/chronicles131.js');
const R = C.Chronicles131Rules;

function fresh(seed = '17117', ui = false) {
  const env = boot131({ seed, ui }); env.g.phaseTime = 9999;
  standAt(env.g, env.g.player, env.g.core()); return env;
}
function ticks(g, n) { for (let i = 0; i < n; i++) { g.update(.04); g.input.pressed.clear(); } }
function supplies(g) {
  const out = { ...g.resources };
  for (const k of C.RESOURCE_KEYS) out[k] += g.player.carry[k];
  for (const u of g.units) if (u.carryType) out[u.carryType] += u.carry;
  for (const n of g.world.nodes) out[n.type] += n.amount;
  return out;
}
function collect(g, id) {
  const stock = supplies(g), objective = g.objectiveIndex, before = g.chronicles131.snapshot().collected.length;
  const q = g.chronicles131.begin(id); assert.ok(q.ok, id + ': ' + q.reason);
  ticks(g, 74); assert.equal(g.chronicles131.snapshot().collected.length, before, id + ' attend trois secondes');
  ticks(g, 2); assert.ok(g.chronicles131.snapshot().collected.includes(id), id);
  assert.equal(g.chronicles131.snapshot().read.includes(id), false, 'Relevé distinct de la lecture');
  // The normal deposit objective can finish while workers continue working.
  const earned = C.OBJECTIVES.slice(objective, g.objectiveIndex);
  for (const k of C.RESOURCE_KEYS) assert.ok(supplies(g)[k] <= stock[k] + earned.reduce((n, o) => n + (o.reward[k] || 0), 0) + 1e-6, id + ': aucun ' + k + ' créé par la trace');
}
function walk(g, target) {
  const origin = g.frontier.position();
  for (let i = 0; i < 650; i++) {
    const p = g.frontier.position(), dx = target.x - p.x, dy = target.y - p.y;
    if (Math.hypot(dx, dy) < .28) { g.input.keys.clear(); return Math.hypot(p.x - origin.x, p.y - origin.y); }
    g.input.keys.clear();
    if (Math.abs(dx) > .12) g.input.keys.add(dx > 0 ? 'KeyD' : 'KeyA');
    if (Math.abs(dy) > .12) g.input.keys.add(dy > 0 ? 'KeyS' : 'KeyW');
    ticks(g, 1);
  }
  assert.fail('Accès physique bloqué : ' + JSON.stringify({ origin, target, current: g.frontier.position() }));
}
// Scène préparée à la jonction routière, après nettoyage des résidents voisins.
// Aucun document, lecture, choix ou lieu découvert n'est injecté. L'approche finale
// traverse le vrai moteur de mouvement, collision, découverte et chronométrage.
function approach(g, id) {
  const marker = g.chronicles131.location(id), w = g.frontier.world();
  const poi = w.pois.find(p => p.id === marker.poi), s = g.serialize();
  Object.assign(s.frontier, { active: true, anchor: { x: s.player.x, y: s.player.y }, x: poi.drive.a.x, y: poi.drive.a.y, z: 0, inside: null, car: null });
  for (const p of w.nearPOI(marker.x, marker.y, 150)) for (let i = 0; i < w.threatCount(p); i++) {
    s.frontier.enemies[p.id + ':e' + i] = 0; delete s.frontier.tracks[p.id + ':e' + i];
  }
  s.frontier.kills = Object.values(s.frontier.enemies).filter(h => h === 0).length;
  s.worldEvolution.groups = s.worldEvolution.groups.filter(h => Math.hypot(h.x - marker.x, h.y - marker.y) > 300);
  g.restoreSave(s);
  assert.equal(g.chronicles131.preview(id).ok, false, 'La jonction ne permet pas de relever à distance');
  const metres = walk(g, marker);
  assert.ok(metres > 15, 'Approche réelle depuis la route');
  assert.ok(g.frontier.discoveries().includes(marker.poi), 'Découverte par la simulation');
  assert.ok(g.chronicles131.preview(id).ok, id);
  return marker;
}
function home(g) {
  if (g.frontier.active()) {
    const s = g.serialize(); Object.assign(s.frontier, { x: C.AtlasRules.homeMax - 1, y: 4096, z: 0, inside: null, car: null });
    g.restoreSave(s); assert.ok(g.frontier.leave());
  }
  standAt(g, g.player, g.core());
}
function select(g, id) { while (D.arcs[g.chronicles131.snapshot().selected].id !== id) g.chronicles131.actions().find(a => a.id === 'next-arc').run(); }

test('QA09 : huit enquêtes lisibles, sources historiques, trois transcriptions honnêtes et deux décisions éditoriales', () => {
  assert.equal(R.readSeconds, 3); assert.equal(R.sceneSeconds, 10);
  assert.equal(D.arcs.length, 8); assert.equal(D.records.length, 24);
  assert.equal(new Set(D.records.map(r => r.id)).size, 24);
  assert.equal(D.arcs.filter(a => a.choice).length, 2);
  for (const a of D.arcs) assert.equal(a.records.length, 3);
  for (const r of D.records) {
    assert.ok(r.source.length > 10); const words = r.text.split(/\s+/).length;
    assert.ok(words >= 25 && words <= 75, r.id + ': une seule page courte');
  }
  assert.equal(D.records.filter(r => r.kind === 'transcription').length, 3);
  assert.match(D.records.find(r => r.id === 'radio-1').text, /proposition passée.*aucun refuge actuel/);
  assert.match(D.records.find(r => r.id === 'road-2').text, /ne disent rien de la route aujourd’hui/);
  assert.match(D.records.find(r => r.id === 'care-2').text, /Ce n’est pas la même chose/);
  assert.match(D.records.find(r => r.id === 'water-0').text, /plein n’est pas une garantie/);
  assert.ok(D.arcs.find(a => a.id === 'neighbors').mission.includes('sans déclarer ses auteurs sauvés'));
});

test('QA09 G5 : trois graines, seize accès distincts et une vraie largeur piétonne jusqu’aux pochettes lointaines', () => {
  const mappings = [];
  for (const seed of ['17117', '913109', '1']) {
    const { g } = fresh(seed), w = g.frontier.world(), places = g.chronicles131.placements();
    assert.equal(w.generation, 5); assert.equal(places.size, 16);
    assert.equal(new Set([...places.values()].map(p => p.poi)).size, 16);
    assert.ok([...places.values()].some(p => p.x > 18000 || p.y > 18000));
    for (const [id, p] of places) {
      const poi = w.pois.find(q => q.id === p.poi), r = D.records.find(r => r.id === id);
      assert.ok(r.types.includes(poi.type)); assert.equal(w.blocked(p.x, p.y, .38, 0, null), false);
      assert.ok(w.line(poi.drive.a, p, 0, null, null, .32), id + ' largeur du personnage');
      assert.ok(w.nearestRoad(poi.drive.a).d < .05, id + ' raccord à la route');
    }
    assert.ok(g.save(false)); assert.ok(g.load()); assert.deepEqual(g.chronicles131.placements(), places);
    mappings.push([...places.values()].map(p => p.poi).join(','));
  }
  assert.equal(new Set(mappings).size, 3);
});

test('QA09 G5 : parcours des 24 traces, approches physiques, lecture en pause, deux choix uniques et reprise', () => {
  const { g, doc } = fresh('17117', true);
  for (const a of D.arcs) collect(g, a.id + '-0');
  for (const a of D.arcs) for (const index of [1, 2]) {
    const id = a.id + '-' + index; approach(g, id); collect(g, id);
    assert.ok(g.save(false)); assert.ok(g.load()); assert.ok(g.chronicles131.snapshot().collected.includes(id));
    assert.ok(g.chronicles131.read(id).ok);
    const overview = g.chronicles131.overview(); assert.equal(overview.record.id, id);
    assert.equal(overview.rows.filter(row => D.records.some(r => row.value === r.text)).length, 1);
    if (overview.record.kind === 'transcription') assert.ok(overview.rows.some(r => r.label === 'Copie écrite · aucun son conservé'));
  }
  assert.equal(g.chronicles131.snapshot().collected.length, 24);
  assert.equal(g.chronicles131.choose('doors', 'public').ok, false, 'Retour physique au dépôt requis');
  home(g); const branch = g.serialize(); select(g, 'doors'); g.expansionUI.open('lore131');
  doc.getElementById('expansionAction-lore131-page-0').click();
  const elapsed = g.elapsed, phase = g.phaseTime, stock = supplies(g);
  g.lastFrame = 1000; for (let i = 1; i <= 80; i++) g.loop(1000 + i * 40);
  assert.equal(g.elapsed, elapsed); assert.equal(g.phaseTime, phase); assert.deepEqual(supplies(g), stock);
  doc.getElementById('expansionAction-lore131-choice-public').click();
  assert.equal(g.chronicles131.snapshot().choices.doors, 'public');
  assert.equal(g.chronicles131.choose('doors', 'reserve').ok, false);
  select(g, 'radio'); g.expansionUI.refresh(true);
  doc.getElementById('expansionAction-lore131-choice-facts').click();
  assert.equal(g.chronicles131.choose('radio', 'uncertain').ok, false);
  assert.deepEqual(supplies(g), stock, 'Choix et lecture sans récompense');
  const expected = g.chronicles131.snapshot(); g.expansionUI.close(); assert.ok(g.save(false)); assert.ok(g.load());
  assert.deepEqual(g.chronicles131.snapshot(), expected);
  for (const id of ['neighbors', 'radio']) { select(g, id); assert.match(g.chronicles131.overview().summary, /masquer les noms/); }
  for (const id of ['road', 'care', 'radio']) { select(g, id); assert.match(g.chronicles131.overview().summary, /faits datés/); }
  assert.equal(g.chronicles131.actions().some(a => /audio|écouter|jouer.*voix/i.test(a.label)), false);
  // Rejouer la sauvegarde réellement gagnée exerce les deux autres branches.
  g.restoreSave(branch); assert.ok(g.chronicles131.choose('doors', 'reserve').ok); assert.ok(g.chronicles131.choose('radio', 'uncertain').ok);
  assert.ok(g.save(false)); assert.ok(g.load());
  for (const id of ['road', 'care', 'radio']) { select(g, id); assert.match(g.chronicles131.overview().summary, /colonne séparée/); }
  select(g, 'neighbors'); assert.match(g.chronicles131.overview().summary, /documents nominatifs au registre/);
});

test('QA09 G4→G5 : lieux déjà annoncés, lectures et choix restent ancrés après extension et rechargement', () => {
  const { g } = fresh(); const legacy = g.serialize(); legacy.frontier.generation = 4;
  delete legacy.expansions127.modules.lore131.siteGeneration; g.restoreSave(legacy);
  const places = g.chronicles131.placements();
  collect(g, 'doors-0');
  for (const id of ['doors-1', 'doors-2']) { approach(g, id); collect(g, id); assert.ok(g.chronicles131.read(id).ok); }
  home(g); assert.ok(g.chronicles131.choose('doors', 'reserve').ok);
  const before = g.chronicles131.snapshot(), known = g.frontier.discoveries();
  assert.ok(g.worldOps131.expand().ok); assert.equal(g.frontier.position().generation, 5);
  assert.equal(g.chronicles131.snapshot().siteGeneration, 4);
  assert.deepEqual(g.chronicles131.placements(), places);
  assert.deepEqual(g.chronicles131.snapshot(), { ...before, siteGeneration: 4 });
  assert.deepEqual(g.frontier.discoveries(), known);
  assert.ok(g.save(false)); assert.ok(g.load()); assert.deepEqual(g.chronicles131.placements(), places);
  select(g, 'neighbors'); assert.match(g.chronicles131.overview().summary, /documents nominatifs au registre/);
  assert.notEqual(g.startNew('standard', '17117'), false);
  assert.equal(g.chronicles131.snapshot().siteGeneration, null);
  assert.ok([...g.chronicles131.placements().values()].some(p => p.x > 8192 || p.y > 8192));
  for (const value of [0, 3, 8, '4', {}, []]) assert.throws(() => Lore.normalize({ ...Lore.initial(), siteGeneration: value }));
});

test('QA09 : compagnon mort ou retiré ne devient jamais une parole présente ni un auteur ressuscité', () => {
  const { g } = fresh(); collect(g, 'doors-0'); collect(g, 'care-0');
  assert.equal(g.chronicles131.speak('malik').ok, false);
  assert.ok(g.worldEvolution.assignCompanion('malik')); assert.ok(g.chronicles131.speak('malik').ok);
  assert.ok(g.worldEvolution.assignCompanion('samir'));
  let s = g.serialize(); s.worldEvolution.companions.forEach(c => { c.health = 0; }); g.restoreSave(s);
  for (const id of ['malik', 'samir']) assert.equal(g.chronicles131.speak(id).ok, false);
  select(g, 'doors'); assert.ok(g.chronicles131.overview().rows.some(r => r.label.startsWith('Propos recueillis auparavant · Malik')));
  assert.ok(g.worldEvolution.snapshot().companions.every(c => c.health === 0));
  s = g.serialize(); s.worldEvolution.companions = []; g.restoreSave(s);
  assert.ok(g.chronicles131.overview().rows.some(r => r.label.startsWith('Propos recueillis auparavant · Malik')));
  assert.equal(g.chronicles131.actions().some(a => a.id === 'talk-malik'), false);
  assert.ok(g.save(false)); assert.ok(g.load()); assert.deepEqual(g.worldEvolution.snapshot().companions, []);
});

test('QA09 : prologue, retour, sortie et migration tenue déclenchent des liaisons courtes puis des souvenirs persistants', () => {
  const { g } = fresh('913109', true);
  assert.ok(g.chronicles131.startPrologue().ok);
  const node = g.world.nodes.filter(n => !n.depleted && g.fieldcraft.service(g.player, n))
    .sort((a, b) => Math.hypot(a.x - g.player.x, a.y - g.player.y) - Math.hypot(b.x - g.player.x, b.y - g.player.y))[0];
  standAt(g, g.player, node); g.input.keys.add('KeyE'); ticks(g, 25); g.input.keys.clear();
  assert.equal(g.chronicles131.snapshot().prologue.stage, 1);
  home(g); g.input.keys.add('KeyE'); ticks(g, 1); g.input.keys.clear();
  assert.equal(g.chronicles131.snapshot().prologue.stage, 2);
  assert.equal(g.chronicles131.scene().id, 'return'); assert.equal(g.activeOverlay, null); assert.equal(g.paused, false);
  const start = g.elapsed; ticks(g, 126); assert.ok(g.elapsed > start + 5);
  assert.ok(g.chronicles131.scene().progress > .5, 'La seconde phrase arrive pendant la vraie simulation');
  g.expansionUI.open('lore131'); g.chronicles131UI.refresh();
  assert.ok(g.chronicles131UI.element.classList.contains('hidden'));
  const scene = g.chronicles131.scene(); g.lastFrame = 1000; for (let i = 1; i <= 50; i++) g.loop(1000 + i * 40);
  assert.deepEqual(g.chronicles131.scene(), scene);
  g.expansionUI.close(); ticks(g, 125); assert.equal(g.chronicles131.scene(), null);
  Object.assign(g.player, { x: 4058, y: 2048 }); assert.ok(g.frontier.enter()); ticks(g, 1);
  assert.equal(g.chronicles131.scene().id, 'road'); assert.ok(g.chronicles131.dismissScene()); home(g);
  // Fin d'assaut préparée : le directeur constate réellement l'absence de
  // contacts restants. Le compteur de vagues et la scène ne sont pas injectés.
  const waves = g.stats.wavesSurvived; g.phase = 'assault'; g.spawnQueue = []; g.pendingSpawns = {};
  ticks(g, 1); assert.equal(g.phase, 'aftermath'); assert.equal(g.stats.wavesSurvived, waves + 1);
  assert.equal(g.chronicles131.scene().id, 'dawn');
  assert.ok(g.save(false)); assert.ok(g.load()); ticks(g, 1); assert.equal(g.chronicles131.scene(), null);
  assert.deepEqual([...g.chronicles131.snapshot().scenes].sort(), ['dawn', 'return', 'road']);
  assert.ok(g.chronicles131.skipPrologue().ok); assert.equal(g.chronicles131.snapshot().prologue.status, 'skipped');
});
