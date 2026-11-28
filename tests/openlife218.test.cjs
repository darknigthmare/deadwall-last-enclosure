'use strict';
// Nature des cantons du monde sans bord, suite de la faune (specs/monde-sans-bord/tasks.md T5.5 ; src/openlife218.js).
// Une campagne NOUVELLE créée avec l'option « Sans bord — expérimental » reçoit les contacts naturels (errants isolés), la
// prédation, les enclos, la cueillette et l'écologie de la région finie, tirés de flux NOUVEAUX dérivés de la graine et du
// canton. Une campagne à région finie, et une campagne sans bord créée avant cette tranche (sans clé), ne lisent rien de ce
// module (forme inactive seule) ; les enclos de la génération 10 gardent leurs règles.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
const C = globalThis.DeadwallCore, O = globalThis.DeadwallOpenWorld217, K = globalThis.DeadwallWorldCantons217;
const L = globalThis.DeadwallOpenLife217, M = globalThis.DeadwallOpenLife218, H = globalThis.DeadwallHusbandry191, Fo = globalThis.DeadwallForage193;
const B = C.BiomePopulation165Rules, HR = C.Husbandry191Rules, FR = C.Forage193Rules;
const clone = v => JSON.parse(JSON.stringify(v));
const steps = n => { for (let i = 0; i < n; i++) g.update(1 / 30); };
const finish = owner => { for (let i = 0; i < 400 && owner.busy(); i++) owner.step(.1); };
function openStart(seed = '17117') { const r = g.startNew('standard', seed, 'classic', 'balanced', true, undefined, true); g.campaignIntro132?.skip?.(); g.phase = 'calm'; g.phaseTime = 9999; return r; }
function flatStart() { g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); g.phase = 'calm'; g.phaseTime = 9999; }
// Registre régional posé en sortie au point donné (canton vu), sac garni pour les travaux, comme une sortie reprise.
function standIn(point, extra = {}) {
  const d = g.serialize(), c = K.at(point.x, point.y), id = K.id(c.cx, c.cy);
  Object.assign(d.frontier, { active: true, x: point.x, y: point.y, z: 0, inside: null, a: point.a ?? -Math.PI / 2, quiet: true, anchor: { x: d.player.x, y: d.player.y }, ...extra });
  if (!d.frontier.cantons.includes(id)) d.frontier.cantons.push(id);
  d.player.carry = { ...d.player.carry, wood: 15, scrap: 10, food: 10, fuel: 4 };
  assert.equal(g.restoreSave(d), true); g.paused = false; g.activeOverlay = null; g.input.keys.clear(); g.input.pressed.clear(); g.dayClock = .4;
}
const free = (w, p) => !w.blocked(p.x, p.y, .32, 0, null);
// Point libre à `d` m d'un objet, avec une ligne de mouvement jusqu'à lui.
function near(w, q, d) { for (let n = 0; n < 48; n++) { const p = { x: q.x + Math.cos(n / 48 * Math.PI * 2) * d, y: q.y + Math.sin(n / 48 * Math.PI * 2) * d }; if (free(w, p) && w.movementLine(p, q, 0, null, null, .05)) return { ...p, a: Math.atan2(q.y - p.y, q.x - p.x) }; } return null; }
function contactSpot(w) {
  const h = w.home;
  for (const q of M.contactsAround(w, h.x, h.y, 1500)) { if (!M.contactAdmitted(w, q)) continue; const p = near(w, q, 30); if (p) return { q, p }; }
  throw Error('aucun errant près de la cité');
}
// Lapin de canton avec 3 m de sol sec et libre au nord (emprise de l'enclos), hors routes et lieux.
function rabbitSpot(w) {
  const c = K.at(w.home.x, w.home.y);
  for (const k of K.ring(c.cx, c.cy, 1)) for (let i = 0; i < 128; i++) {
    const a = L.animal(w, k.cx, k.cy, i); if (!a || a.species !== 'rabbit' || !L.admitted(w, a)) continue;
    const centre = { x: a.x, y: a.y - 3 }, road = w.nearestRoad(centre);
    if (L.around(w, a.x, a.y, 8).animals.some(n => n.id !== a.id && Math.abs(n.x - centre.x) < 2.1 + n.radius && Math.abs(n.y - centre.y) < 2.1 + n.radius)) continue;
    if (road && road.d < road.road.width / 2 + HR.penSize || w.nearPOI(a.x, a.y, 30).length) continue;
    const grid = [-1.5, -1, -.5, 0, .5, 1, 1.5];
    if (grid.some(dx => grid.some(dy => w.blocked(centre.x + dx, centre.y + dy, .35, 0, null) || L.water(w, centre.x + dx, centre.y + dy).water))) continue;
    return { a, point: { x: a.x, y: a.y + .4 } };
  }
  throw Error('aucun lapin de canton près de la cité');
}
function forageSpot(w) {
  for (const q of M.Forage.around(w, w.home.x, w.home.y, 700)) { if (!q.amount || q.amount > 6) continue; const p = near(w, q, 1.2); if (p) return { q, p }; }
  throw Error('aucun ramassage de canton près de la cité');
}

test('T5.5 : règles gelées, script public après ses propriétaires, registre des opérations', () => {
  const R = C.OpenLife218Rules; assert.ok(Object.isFrozen(R) && Object.isFrozen(R.contact) && Object.isFrozen(R.forage) && Object.isFrozen(R.ecology));
  assert.deepEqual(clone(R), { version: 1, generation: 12, contact: { kind: 'errant', bank: 50 }, forage: { kind: 'cueil' }, strictCantons: 16, ecology: { depleted: .5, rows: 6 } });
  // Densités, profils et plafonds : ceux de la région finie, lus et non recopiés.
  for (const k of ['contactChance', 'contactCandidates', 'chance', 'candidates', 'maxContactRecords', 'penSize']) assert.ok(!(k in R), k);
  const html = read('index.html'), at = f => html.indexOf('<script src="src/' + f + '.js"></script>');
  for (const f of ['expansion-kit', 'frontier', 'forage193', 'openworld217', 'openlife217', 'husbandry191']) assert.ok(at(f) >= 0 && at(f) < at('openlife218'), f);
  assert.ok(read('sw.js').includes('"src/openlife218.js"'));
  assert.ok(/'openlife218'[^\]]*'balance217','breach217'\]/.test(read('src/expansion-kit.js')));
  for (const name of ['ORDER', 'GROUPS', 'API_NAMES', 'LABELS']) assert.ok(new RegExp(name + '\\s*=\\s*[\\s\\S]*?openlife218').test(read('src/expansion-ui.js')), name);
  const kit = g.expansions.entries().map(d => d.id); assert.ok(kit.indexOf('openlife217') < kit.indexOf('husbandry191') && kit.indexOf('husbandry191') < kit.indexOf('openlife218'), 'restauré après la faune et les enclos');
  assert.deepEqual(M.validate(undefined), M.initial()); assert.deepEqual(M.initial(), { version: 1, active: false, revision: null, enemies: {}, tracks: {}, kills: 0 });
});

test('T5.5 : descripteurs purs — errants et ramassages par canton, flux neufs, aucun effet sur le monde', () => {
  const a = O.region(17117), b = O.region(17117), c = K.at(a.home.x, a.home.y), digest = a.canton(c.cx + 1, c.cy).digest, places = a.placesOf(c.cx + 1, c.cy).map(p => p.id + p.x + p.y);
  const contacts = [], kinds = new Set();
  for (const q of K.ring(c.cx, c.cy, 1)) for (let i = 0; i < 16; i++) {
    const x = M.contact(a, q.cx, q.cy, i), y = M.contact(b, q.cx, q.cy, i);
    assert.deepEqual(x, y, 'même errant pour la même graine'); if (!x) continue; contacts.push(x); kinds.add(x.profile.kind);
    assert.equal(x.id, K.entityId(q.cx, q.cy, 'errant', i)); assert.ok(M.ownsContact(x.id)); assert.equal(M.contactCandidate(a, x.id), x);
    const bx = q.cx * 1024 + (i % 4) * 256, by = q.cy * 1024 + Math.floor(i / 4) * 256;
    assert.ok(x.x >= bx + 20 && x.x <= bx + 236 && x.y >= by + 20 && x.y <= by + 236, x.id);
    assert.ok(Math.hypot(x.x - a.home.x, x.y - a.home.y) >= B.homeExclusion); assert.equal(L.water(a, x.x, x.y).water, false);
    const def = [...C.BiomeRules135.defs, ...C.EcologyRules164.defs].find(d => d.id === x.biome); assert.ok(x.profile.kind in def.enemies, x.id);
    assert.equal(x.profile.health, C.BiomeRules135.enemies[x.profile.kind].health); assert.equal(x.profile.name === 'Errant des berges', x.bank && x.profile.kind === 'walker');
    const road = a.nearestRoad(x); assert.ok(!road || road.d >= road.road.width / 2 + B.roadClearance);
  }
  // Densité de la région finie : un candidat par morceau de 256 m, présence 42 % (au plus 16 par km²).
  assert.ok(contacts.length / 9 > 2 && contacts.length / 9 <= 16, String(contacts.length)); assert.ok(kinds.has('walker'));
  const forage = [], species = new Set();
  for (let i = 0; i < 256; i++) {
    const x = M.forage(a, c.cx + 1, c.cy, i), y = M.forage(b, c.cx + 1, c.cy, i); assert.deepEqual(x && { ...x, profile: x.profile.id }, y && { ...y, profile: y.profile.id });
    if (!x) continue; forage.push(x); species.add(x.species); assert.ok(M.ownsForage(x.id)); assert.equal(M.Forage.candidate(a, x.id), x);
    const s = FR.species[x.species]; assert.ok(s.biomes[x.biome] > 0); assert.ok(x.amount >= s.amount[0] && x.amount <= s.amount[1]); assert.equal(L.water(a, x.x, x.y, true).water, false);
  }
  assert.ok(forage.length > 40 && forage.length <= 256, String(forage.length)); assert.ok(species.size >= 5, [...species].join(','));
  // Hors adressage : rangs, genres et anciens identifiants refusés.
  assert.equal(M.contact(a, c.cx, c.cy, 16), null); assert.equal(M.forage(a, c.cx, c.cy, 256), null);
  for (const id of ['N165_1_1_0', 'F193_1_1_0', 'K0_0:faune:0', 'K-0_0:errant:1', 'K0_0:errant:01']) { assert.equal(M.ownsContact(id), false, id); assert.equal(M.ownsForage(id), false, id); }
  assert.equal(M.contactCandidate({ unbounded: false }, 'K0_0:errant:0'), null);
  // Aucun tirage dans un flux du monde : cantons et lieux identiques à ceux d'un monde neuf.
  const fresh = O.region(17117); assert.equal(a.canton(c.cx + 1, c.cy).digest, digest); assert.equal(fresh.canton(c.cx + 1, c.cy).digest, digest);
  assert.deepEqual(fresh.placesOf(c.cx + 1, c.cy).map(p => p.id + p.x + p.y), places);
});

test('T5.5 : région finie et ancienne campagne sans bord — forme inactive, ni errant, ni enclos, ni cueillette de canton', () => {
  flatStart(); assert.equal(g.openLife218.active(), false); assert.deepEqual(g.serialize().expansions127.modules.openlife218, M.initial());
  assert.equal(g.expansions.get('openlife218').available(), false);
  openStart(); assert.equal(g.openLife218.active(), true); const d = g.serialize();
  assert.deepEqual(d.expansions127.modules.openlife218, M.fresh());
  // Campagne sans bord de T5.4 (sans clé) : rechargée telle quelle, sans les nouveautés, même près d'un errant.
  const old = clone(d); delete old.expansions127.modules.openlife218; assert.equal(g.restoreSave(old), true); assert.equal(g.openLife218.active(), false);
  assert.equal(g.openLife217.active(), true, 'la faune de T5.4 reste là');
  const w = g.frontier.world(), { p } = contactSpot(w); standIn(p); steps(3);
  assert.ok(!g.frontier.contacts().some(e => M.ownsContact(e.id)), 'aucun errant de canton');
  assert.match(g.husbandry191.quote('build').reason, /paysage naturel/); assert.equal(g.forage193.quote('K0_0:cueil:0').ok, false);
  const kept = g.serialize(); assert.deepEqual(kept.expansions127.modules.openlife218, M.initial()); assert.equal(kept.expansions127.modules.husbandry191.open218, undefined);
  // Refus croisés : module actif sur une région finie, formes mal faites.
  flatStart(); const flat = g.serialize();
  assert.throws(() => globalThis.DeadwallSave.validate({ ...flat, expansions127: { ...flat.expansions127, modules: { ...flat.expansions127.modules, openlife218: M.fresh() } } }), /région finie/);
  const t = { x: 1, y: 1, z: 0, a: 0, mode: 'idle', ttl: 0, gx: 1, gy: 1, cool: 0 };
  for (const bad of [{ ...M.fresh(), extra: 1 }, { ...M.fresh(), revision: 0 }, { ...M.initial(), kills: 1 }, { ...M.initial(), revision: 1 }, { ...M.fresh(), enemies: { 'K0_0:errant:16': 1 } },
    { ...M.fresh(), enemies: { 'K0_0:faune:1': 1 } }, { ...M.fresh(), enemies: { 'K0_0:errant:1': 0 } }, { ...M.fresh(), enemies: { 'K0_0:errant:1': 0 }, tracks: { 'K0_0:errant:1': t }, kills: 1 },
    { ...M.fresh(), tracks: { 'K0_0:errant:1': { ...t, mode: 'fly' } } }, { ...M.fresh(), tracks: { 'K0_0:errant:1': { ...t, x: 5000 } } }, { ...M.fresh(), tracks: { 'K0_0:errant:1': { ...t, z: 1 } } }])
    assert.throws(() => M.validate(bad), /invalide|Compteur|abattu|dérive/, JSON.stringify(bad));
});

test('T5.5 : errant de canton — rencontre, blessure, mort, poursuite gardées par le module, reprise identique', () => {
  openStart(); const w = g.frontier.world(), { q, p } = contactSpot(w); standIn(p); steps(3);
  const live = g.frontier.contacts().find(e => e.id === q.id); assert.ok(live, 'errant présent autour du commandant');
  assert.equal(live.natural165, q); assert.equal(live.hp, q.profile.health); assert.equal(live.kind, q.profile.kind);
  assert.ok(g.frontier.contacts().filter(e => M.ownsContact(e.id)).length <= B.contactBudget);
  // Blessure : gardée par le module, jamais dans le registre G12.
  assert.equal(g.frontier.hitEnemy(q.id, 10), true); assert.equal(g.frontier.enemyHealth(q.id), q.profile.health - 10);
  let d = g.serialize(); assert.deepEqual(d.frontier.enemies, {}); assert.deepEqual(d.frontier.tracks, {}); assert.equal(d.frontier.kills, 0);
  assert.equal(d.expansions127.modules.openlife218.enemies[q.id], q.profile.health - 10);
  // Mort : comptée par le module, l'errant ne revient pas à la reprise.
  assert.equal(g.frontier.hitEnemy(q.id, 500), true); d = g.serialize(); const m = d.expansions127.modules.openlife218;
  assert.equal(m.enemies[q.id], 0); assert.equal(m.kills, 1); assert.equal(m.tracks[q.id], undefined); assert.equal(d.frontier.kills, 0);
  assert.ok(JSON.stringify(m).length < 400, 'sauvegarde creuse');
  assert.equal(g.save(true), true); assert.equal(g.restoreSave(globalThis.DeadwallSave.parse(localStorage.getItem(C.SAVE_KEY))), true); g.paused = false; g.activeOverlay = null; steps(3);
  assert.ok(!g.frontier.contacts().some(e => e.id === q.id), 'pas de résurrection'); assert.deepEqual(g.serialize().expansions127.modules.openlife218, m);
  // Poursuite : un errant vivant quitté garde sa pose dans le module.
  const others = M.contactsAround(w, w.home.x, w.home.y, 1500).filter(e => e.id !== q.id && M.contactAdmitted(w, e));
  let other = null; for (const e of others) { const p2 = near(w, e, 25); if (!p2) continue; standIn(p2); steps(3); if (g.frontier.contacts().some(x => x.id === e.id)) { other = e; break; } }
  assert.ok(other, 'second errant rencontré'); steps(30); const live2 = g.frontier.contacts().find(e => e.id === other.id), d2 = g.serialize(), t = d2.expansions127.modules.openlife218.tracks[other.id];
  assert.ok(t && Object.keys(t).length === 9 && t.x === live2.x && t.y === live2.y, 'poursuite gardée par le module'); assert.deepEqual(d2.frontier.tracks, {});
  assert.equal(g.restoreSave(clone(d2)), true); g.paused = false; g.activeOverlay = null; steps(1);
  const back = g.frontier.contacts().find(e => e.id === other.id); assert.ok(back && Math.hypot(back.x - t.x, back.y - t.y) < 1, 'errant repris à sa pose');
  // Refus : errant absent de la graine, blessure supérieure au profil, errant de canton cité sur une région finie.
  const saved = g.serialize(), ghost = clone(saved), c = K.parseEntity(q.id);
  const absent = Array.from({ length: 16 }, (_, i) => K.entityId(c.cx, c.cy, 'errant', i)).find(id => !M.contactCandidate(w, id));
  if (absent) { ghost.expansions127.modules.openlife218.enemies[absent] = 0; ghost.expansions127.modules.openlife218.kills++; assert.throws(() => g.restoreSave(ghost), /absent/); }
  const strong = clone(saved); strong.expansions127.modules.openlife218.enemies[q.id] = q.profile.health + 1; strong.expansions127.modules.openlife218.kills--;
  assert.throws(() => g.restoreSave(strong), /profil/);
  assert.equal(g.restoreSave(clone(saved)), true);
});

test('T5.5 : enclos d’un animal de canton — construction, capture, sauvegarde, reprise, libération ; prédation ouverte', () => {
  openStart(); const w = g.frontier.world(), { a, point } = rabbitSpot(w); standIn(point); g.update(.01);
  const h = g.husbandry191; let q = h.quote('build'); assert.equal(q.ok, true, q.reason); assert.equal(h.begin('build').ok, true); finish(h);
  const pen = h.view().pens[0]; assert.ok(pen); assert.equal(h.view().open218, true, 'registre marqué au premier travail');
  assert.ok(g.frontier.wildlife165().some(e => e.id === a.id), 'lapin vivant près de l’enclos');
  q = h.quote('capture', pen.id, a.id); assert.equal(q.ok, true, q.reason); assert.equal(h.begin('capture', pen.id, a.id).ok, true); finish(h);
  const held = h.view().animals[0]; assert.equal(held.source, a.id); assert.equal(held.status, 'held'); assert.equal(held.species, 'rabbit');
  assert.ok(!g.frontier.wildlife165().some(e => e.id === a.id), 'le captif quitte la faune sauvage');
  // Sauvegarde : le registre des enclos porte l'identifiant de canton ; la faune de T5.4 ne garde que ses abattus.
  const d = g.serialize(); assert.equal(d.expansions127.modules.husbandry191.open218, true); assert.deepEqual(d.expansions127.modules.openlife217.kills, {});
  assert.equal(g.restoreSave(clone(d)), true); assert.deepEqual(h.view().animals, d.expansions127.modules.husbandry191.animals);
  g.paused = false; g.activeOverlay = null; steps(2); const status = g.frontier.wildlifeStatus165(a.id);
  assert.ok(status && status.hp > 0, 'fiche du captif retrouvée à sa place d’origine'); assert.equal(status.x, a.x); assert.equal(status.y, a.y);
  // Libération : l'animal retourne à la faune de son canton.
  q = h.quote('release', pen.id, held.id); assert.equal(q.ok, true, q.reason); assert.equal(h.begin('release', pen.id, held.id).ok, true); finish(h);
  assert.equal(h.view().animals[0].status, 'released'); steps(2); assert.ok(g.frontier.wildlife165().some(e => e.id === a.id));
  // Prédation : même option que la région finie, ouverte aux animaux de canton.
  assert.equal(h.quote('behaviors').ok, true); assert.equal(h.begin('behaviors').ok, true); assert.equal(h.view().behaviors, true);
  const fox = { id: K.entityId(0, 0, 'faune', 0), species: 'fox', x: a.x + 1, y: a.y, hp: 20, alarm: 0, radius: .2, profile: { ...globalThis.DeadwallWildlife189.species().fox, activity: 'day' } };
  const rabbit = g.frontier.wildlife165().find(e => e.id === a.id); fox.x = rabbit.x + 1; fox.y = rabbit.y;
  const intent = h.naturalIntent(fox); assert.ok(intent && intent.speed === HR.predatorSpeed, 'le renard de canton chasse le lapin');
  // Refus : registre marqué sur une région finie, captif de canton sans marque, marque fausse.
  const saved = g.serialize();
  const unmarked = clone(saved); delete unmarked.expansions127.modules.husbandry191.open218; assert.throws(() => g.restoreSave(unmarked), /enclos/);
  const wrong = clone(saved); wrong.expansions127.modules.husbandry191.open218 = false; assert.throws(() => g.restoreSave(wrong), /enclos/);
  const ghost = clone(saved); ghost.expansions127.modules.husbandry191.animals[0].species = 'duck'; assert.throws(() => g.restoreSave(ghost), /enclos/);
  assert.equal(g.restoreSave(clone(saved)), true);
  flatStart(); const flat = g.serialize(); flat.expansions127.modules.husbandry191 = clone(saved.expansions127.modules.husbandry191);
  assert.throws(() => globalThis.DeadwallSave.validate(flat), /enclos/);
  // Génération 10 : sans la marque, les bornes et les sources de la région finie sont inchangées.
  assert.throws(() => H.validate({ ...H.initial(), pens: [{ id: 1, x: -50, y: 40, health: 100, food: 0, water: 0, meat: 0, hides: 0, leather: 0, breed: 0, meatAge: 0, hideAge: 0 }], next: 2 }), /enclos/);
  assert.doesNotThrow(() => H.validate({ ...H.initial(), open218: true, pens: [{ id: 1, x: -50, y: 40, health: 100, food: 0, water: 0, meat: 0, hides: 0, leather: 0, breed: 0, meatAge: 0, hideAge: 0 }], next: 2 }));
  assert.throws(() => H.validate({ ...H.initial(), next: 3, pens: [{ id: 1, x: 50, y: 40, health: 100, food: 0, water: 0, meat: 0, hides: 0, leather: 0, breed: 0, meatAge: 0, hideAge: 0 }], animals: [{ id: 2, source: 'K0_0:faune:2', species: 'rabbit', pen: 1, sex: 'female', age: 900, health: 100, status: 'held', parents: [] }] }), /enclos/);
});

test('T5.5 : cueillette de canton — ramassage fini, sac, sauvegarde, reprise sans repousse', () => {
  openStart(); assert.equal(g.forage193.active(), true); const w = g.frontier.world(), { q, p } = forageSpot(w); standIn(p);
  for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0; g.player.stamina = 100; steps(1);
  assert.ok(g.forage193.visible().some(r => r.id === q.id), 'ramassage visible');
  const f = g.forage193; let quote = f.quote(q.id); assert.equal(quote.ok, true, quote.reason); assert.equal(quote.amount, q.amount);
  assert.equal(f.begin(q.id).ok, true); for (let i = 0; i < 200 && f.busy(); i++) f.step(.1);
  assert.equal(g.player.carry[q.resource], q.amount); const d = g.serialize(); assert.deepEqual(d.expansions127.modules.forage193.harvested, [q.id]);
  assert.equal(g.restoreSave(clone(d)), true); g.paused = false; g.activeOverlay = null; steps(1);
  assert.ok(!g.forage193.visible().some(r => r.id === q.id), 'aucune repousse'); assert.match(g.forage193.quote(q.id).reason, /épuisé/);
  // Refus : ramassage absent de la graine, ramassage de canton sur une région finie, identifiants mal formés.
  const c = K.parseEntity(q.id), absent = Array.from({ length: 256 }, (_, i) => K.entityId(c.cx, c.cy, 'cueil', i)).find(id => !M.Forage.candidate(w, id));
  const ghost = clone(d); ghost.expansions127.modules.forage193.harvested.push(absent); assert.throws(() => g.restoreSave(ghost), /cueillette/);
  for (const id of ['K0_0:cueil:256', 'K0_0:cueil:01', 'K0_0:faune:1']) assert.throws(() => Fo.validate({ version: 1, enabled: true, harvested: [id] }), /cueillette/, id);
  flatStart(); const flat = g.serialize(); flat.expansions127.modules.forage193.harvested = [q.id];
  assert.throws(() => globalThis.DeadwallSave.validate(flat), /cueillette/);
  // Région finie : F193 inchangé.
  assert.deepEqual(Fo.validate({ version: 1, enabled: true, harvested: ['F193_1_1_0'] }).harvested, ['F193_1_1_0']);
});

test('T5.5 : écologie des cantons — aucun renouvellement, canton chassé puis épuisé au carnet', () => {
  openStart(); const w = g.frontier.world(), c = K.at(w.home.x, w.home.y), target = K.ring(c.cx, c.cy, 1).find(k => k.cx !== c.cx || k.cy !== c.cy);
  const animals = Array.from({ length: 128 }, (_, i) => L.animal(w, target.cx, target.cy, i)).filter(Boolean);
  const d = g.serialize(), kills = {}; for (const a of animals.slice(0, Math.ceil(animals.length * C.OpenLife218Rules.ecology.depleted))) kills[K.parseEntity(a.id).index] = [a.x, a.y, 0];
  d.expansions127.modules.openlife217.kills = { [K.id(target.cx, target.cy)]: kills }; assert.equal(g.restoreSave(d), true);
  const eco = g.openLife218.ecology(); assert.equal(eco.length, 1); assert.equal(eco[0].id, K.id(target.cx, target.cy)); assert.equal(eco[0].total, animals.length); assert.equal(eco[0].depleted, true);
  assert.ok(g.openLife218.overview().rows.some(r => r.label === 'Canton ' + eco[0].id && /épuisé/.test(r.value)));
  // Lecture seule : ni sauvegarde ni monde touchés par le carnet.
  const before = JSON.stringify(g.serialize().expansions127.modules); g.openLife218.overview(); assert.equal(JSON.stringify(g.serialize().expansions127.modules), before);
});
