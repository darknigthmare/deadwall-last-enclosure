'use strict';
// Faune, épaves et migrations des cantons du monde sans bord (specs/monde-sans-bord/tasks.md T5.4 ; src/openlife217.js).
// Une campagne NOUVELLE créée avec l'option « Sans bord — expérimental » reçoit la faune régionale de la région finie (mêmes
// espèces, guildes, densités, dérive et alarme), tirée par un flux dérivé de la graine et du canton ; seuls les animaux abattus
// sont sauvegardés, par canton. Les épaves des lieux se démontent ; les migrations suivent les routes des cantons. Une campagne
// à région finie et une ancienne campagne sans bord ne lisent rien de ce module (forme inactive seule).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
const C = globalThis.DeadwallCore, O = globalThis.DeadwallOpenWorld217, K = globalThis.DeadwallWorldCantons217, L = globalThis.DeadwallOpenLife217;
const Wild = globalThis.DeadwallWildlife189, Gen = globalThis.DeadwallWorldCantonGen217, G = globalThis.DeadwallFrontierGeometry, Survey = globalThis.DeadwallFrontierSurvey;
const clone = v => JSON.parse(JSON.stringify(v));
const steps = n => { for (let i = 0; i < n; i++) g.update(1 / 30); };
function openStart(seed = '17117') { const r = g.startNew('standard', seed, 'classic', 'balanced', true, undefined, true); g.campaignIntro132?.skip?.(); g.phase = 'calm'; g.phaseTime = 9999; return r; }
// Registre régional posé en sortie au point donné (canton vu), comme une sortie réelle reprise.
function standIn(point, extra = {}) {
  const d = g.serialize(), c = K.at(point.x, point.y), id = K.id(c.cx, c.cy);
  Object.assign(d.frontier, { active: true, x: point.x, y: point.y, z: 0, inside: null, a: point.a ?? 0, anchor: { x: d.player.x, y: d.player.y }, ...extra });
  if (!d.frontier.cantons.includes(id)) d.frontier.cantons.push(id);
  assert.equal(g.restoreSave(d), true); g.paused = false; g.activeOverlay = null; g.input.keys.clear(); g.input.pressed.clear(); g.dayClock = .4;
}
// Animal terrestre admis à gibier (au moins 8 provisions), avec une place libre à 1,4 m et une ligne de mouvement jusqu'à lui.
function landCheckpoint(w) {
  const h = w.home, c = K.at(h.x, h.y);
  for (const q of K.ring(c.cx, c.cy, 1)) for (let i = 0; i < 128; i++) {
    const a = L.animal(w, q.cx, q.cy, i); if (!a || a.profile.mode !== 'land' || C.WildlifeHarvest190Rules.yields[a.species] < 8 || !L.admitted(w, a)) continue;
    for (let n = 0; n < 24; n++) { const p = { x: a.x + Math.cos(n / 24 * Math.PI * 2) * 1.4, y: a.y + Math.sin(n / 24 * Math.PI * 2) * 1.4 }; if (!w.blocked(p.x, p.y, .32, 0, null) && w.movementLine(p, a, 0, null, null, .05)) return { a, p: { ...p, a: Math.atan2(a.y - p.y, a.x - p.x) } }; }
  }
  throw Error('aucun gibier près de la cité');
}

test('T5.4 : règles gelées, script public après le monde sans bord, registre des opérations', () => {
  const R = C.OpenLife217Rules; assert.ok(Object.isFrozen(R));
  assert.deepEqual({ ...R }, { version: 1, generation: 12, kind: 'faune', waterSearch: 80, maxKills: 24000, strictCantons: 16, maxLive: 2048, pruneSeconds: 1 });
  // L'équilibrage de la faune est celui de la région finie : rien n'est recopié dans les règles du monde sans bord.
  for (const k of ['chance', 'groups', 'members', 'groupSpread']) assert.ok(!(k in R), k);
  assert.ok(R.waterSearch > Math.max(...Object.values(Wild.species()).map(d => d.bankRange || 0)), 'la recherche d’eau couvre la plus grande portée de berge');
  const html = read('index.html'), at = f => html.indexOf('<script src="src/' + f + '.js"></script>');
  for (const f of ['expansion-kit', 'frontier', 'exploration-pack131', 'openworld217']) assert.ok(at(f) >= 0 && at(f) < at('openlife217'), f);
  assert.ok(read('sw.js').includes('"src/openlife217.js"'));
  assert.ok(/'openlife217'[^\]]*'balance217','breach217'\]/.test(read('src/expansion-kit.js')));
  for (const name of ['ORDER', 'GROUPS', 'API_NAMES', 'LABELS']) assert.ok(new RegExp(name + '\\s*=\\s*[\\s\\S]*?openlife217').test(read('src/expansion-ui.js')), name);
  assert.ok(g.expansions.get('openlife217'), 'module enregistré au chargement');
  assert.deepEqual(L.validate(undefined), L.initial()); assert.deepEqual(L.initial(), { version: 1, active: false, revision: null, kills: {} });
});

test('T5.4 : descripteurs purs par canton — flux dérivé, espèces des guildes du milieu, eau du canton, aucun effet sur le monde', () => {
  const a = O.region(17117), b = O.region(17117), c = K.at(a.home.x, a.home.y), digest = a.canton(c.cx + 1, c.cy).digest;
  const rows = [], species = new Set();
  for (const q of K.ring(c.cx, c.cy, 1)) for (let i = 0; i < 128; i++) {
    const x = L.animal(a, q.cx, q.cy, i), y = L.animal(b, q.cx, q.cy, i);
    assert.deepEqual(x && { ...x, profile: x.profile.id }, y && { ...y, profile: y.profile.id }, 'même animal pour la même graine');
    if (!x) continue; rows.push(x); species.add(x.species);
    assert.equal(x.id, K.entityId(q.cx, q.cy, 'faune', i)); assert.ok(L.owns(x.id)); assert.deepEqual(L.candidate(a, x.id), x);
    // Morceau de 256 m du rang (groupe écarté de 5 m au plus), loin de la cité, hors des routes, dans son habitat.
    const j = Math.floor(i / 8), bx = q.cx * 1024 + (j % 4) * 256, by = q.cy * 1024 + Math.floor(j / 4) * 256;
    assert.ok(x.x > bx - 6 && x.x < bx + 262 && x.y > by - 6 && x.y < by + 262, x.id);
    assert.ok(Math.hypot(x.x - a.home.x, x.y - a.home.y) >= C.BiomePopulation165Rules.homeExclusion);
    assert.ok(Wild.habitat(x.profile, L.water(a, x.x, x.y)), x.id);
    const pool = Wild.pool(a.biomeAt(x.x, x.y), L.water(a, x.x, x.y)); assert.ok(x.species in pool || i % 4, 'chef de groupe dans la guilde de son milieu');
    const road = a.nearestRoad(x); assert.ok(!road || road.d >= road.road.width / 2 + C.BiomePopulation165Rules.roadClearance);
  }
  // Densité de la région finie : 2 groupes de 1 à 4 animaux par morceau de 256 m, présence 85 % (au plus 128 par km²).
  const perKm2 = rows.length / 9; assert.ok(perKm2 > 30 && perKm2 <= 128, String(perKm2)); assert.ok(species.size >= 8, [...species].join(','));
  assert.equal(L.animal(a, c.cx, c.cy, 128), null); assert.equal(L.candidate(a, 'A189_1_1_0'), null); assert.equal(L.candidate(a, 'K0_0:site:0'), null);
  // Aucun tirage dans un flux du monde : cantons et lieux identiques à ceux d'un monde qui n'a jamais lu sa faune.
  assert.equal(a.canton(c.cx + 1, c.cy).digest, digest); const fresh = O.region(17117);
  assert.equal(fresh.canton(c.cx + 1, c.cy).digest, digest);
  assert.deepEqual(fresh.placesOf(c.cx + 1, c.cy).map(p => p.id + p.x + p.y), a.placesOf(c.cx + 1, c.cy).map(p => p.id + p.x + p.y));
  assert.deepEqual(L.around(a, a.home.x, a.home.y, 145).contacts, []);
});

test('T5.4 : eau lue sur le canton — mer salée, lac et cours d’eau doux, pont non aquatique, terre ferme', () => {
  const w = O.region(1), c = K.at(w.home.x, w.home.y), W = Gen.WATER, found = {};
  for (const q of K.ring(c.cx, c.cy, 2)) {
    const k = w.canton(q.cx, q.cy);
    for (let i = 0; i < k.water.length; i++) {
      const v = k.water[i], x = k.bounds.x + (i % Gen.CELLS + .5) * Gen.CELL, y = k.bounds.y + (Math.floor(i / Gen.CELLS) + .5) * Gen.CELL;
      if ((v === W.sea || v === W.lake) && !found[v] && w.waterBlocked(x, y, 0)) found[v] = { x, y };
      if (!v && !found.land) { const s = L.water(w, x, y); if (s.distanceToWater > 70) found.land = { x, y }; }
    }
    for (const r of k.rivers) if (!found.river) { const p = r.points[Math.floor(r.points.length / 2)]; if (w.waterBlocked(p.x, p.y, 0)) found.river = { ...p, kind: r.kind }; }
  }
  const sea = L.water(w, found[W.sea].x, found[W.sea].y); assert.equal(sea.water, true); assert.equal(sea.salinity, 'salt'); assert.equal(sea.kind, 'sea'); assert.ok(sea.distanceToShore > 0);
  const lake = L.water(w, found[W.lake].x, found[W.lake].y); assert.equal(lake.water, true); assert.equal(lake.salinity, 0); assert.equal(lake.kind, 'lake');
  const river = L.water(w, found.river.x, found.river.y); assert.equal(river.water, true); assert.equal(river.kind, found.river.kind); assert.equal(river.salinity, 0);
  const land = L.water(w, found.land.x, found.land.y); assert.equal(land.water, false); assert.equal(land.crossing, false); assert.ok(land.distanceToWater > 65);
  // Espèces des berges : un goéland admis près de la mer, jamais loin de l'eau.
  assert.equal(Wild.habitat(Wild.species().gull, land), false); assert.equal(Wild.habitat(Wild.species().mullet, sea), sea.distanceToShore > Wild.species().mullet.radius);
  // Pont : de l'eau sous la route, mais pas un habitat aquatique ni un obstacle.
  let bridge = null; for (const q of K.ring(c.cx, c.cy, 3)) { for (const r of w.canton(q.cx, q.cy).roads) for (const p of r.points) { const s = L.water(w, p.x, p.y); if (s.crossing) { bridge = s; break; } } if (bridge) break; }
  if (bridge) { assert.equal(bridge.water, false); assert.equal(Wild.habitat(Wild.species().duck, bridge), false); }
  assert.equal(L.water({ unbounded: false }, 0, 0), null);
});

test('T5.4 : campagne à région finie et ancienne campagne sans bord — forme inactive, aucune faune de canton', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  assert.equal(g.openLife217.active(), false); assert.deepEqual(g.serialize().expansions127.modules.openlife217, L.initial());
  assert.equal(g.expansions.get('openlife217').available(), false);
  openStart(); assert.equal(g.openLife217.active(), true); const d = g.serialize();
  assert.deepEqual(d.expansions127.modules.openlife217, { version: 1, active: true, revision: 1, kills: {} });
  // Ancienne campagne sans bord (créée avant cette tranche) : pas de clé, faune absente, même en sortie près d'un gibier.
  const old = clone(d); delete old.expansions127.modules.openlife217; assert.equal(g.restoreSave(old), true); assert.equal(g.openLife217.active(), false);
  const { p } = landCheckpoint(g.frontier.world()); standIn(p); steps(3);
  assert.deepEqual(g.frontier.wildlife165(), []); assert.deepEqual(g.serialize().expansions127.modules.openlife217, L.initial());
  // Refus croisés : faune de canton sur une région finie, formes mal faites.
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); const flat = g.serialize();
  assert.throws(() => globalThis.DeadwallSave.validate({ ...flat, expansions127: { ...flat.expansions127, modules: { ...flat.expansions127.modules, openlife217: L.fresh() } } }), /région finie/);
  for (const bad of [{ version: 1, active: true, revision: 1 }, { ...L.fresh(), revision: 0 }, { ...L.fresh(), extra: 1 }, { ...L.initial(), revision: 1 }, { ...L.initial(), kills: { K0_0: { 1: [1, 1, 0] } } },
    { ...L.fresh(), kills: { 'K-0_0': { 1: [1, 1, 0] } } }, { ...L.fresh(), kills: { K0_0: { 128: [1, 1, 0] } } }, { ...L.fresh(), kills: { K0_0: { '01': [1, 1, 0] } } }, { ...L.fresh(), kills: { K0_0: { 1: [5000, 1, 0] } } }, { ...L.fresh(), kills: { K0_0: {} } }])
    assert.throws(() => L.validate(bad), /invalide|abattus/, JSON.stringify(bad));
});

test('T5.4 : rencontre, tir, dépouille gardée par canton, sauvegarde creuse et reprise identique, préparation du gibier', () => {
  // Couteau fabriqué et équipé à D-17 avant la sortie.
  openStart(); const stock = g.resources.scrap; assert.equal(g.arsenal134.begin('craft', 'knife').ok, true); for (let i = 0; i < 200 && g.arsenal134.busy(); i++) g.arsenal134.step(.1);
  assert.ok(g.resources.scrap < stock); const knife = g.arsenal134.snapshot().locker.find(i => i.id === 'knife');
  assert.equal(g.arsenal134.transfer(knife.uid, 'carried').ok, true); assert.equal(g.arsenal134.equip(knife.uid).ok, true);
  const w0 = g.frontier.world(), { a, p } = landCheckpoint(w0); standIn(p); steps(2);
  const live = g.frontier.wildlife165(); assert.ok(live.some(e => e.id === a.id), 'animal vivant présent autour du commandant');
  assert.ok(live.every(e => L.owns(e.id)), 'seuls des animaux de canton'); assert.ok(live.length <= C.BiomePopulation165Rules.animalBudget);
  // Les fiches vivantes ne sont jamais sauvegardées ; le registre régional G12 garde sa faune vide.
  let d = g.serialize(); assert.deepEqual(d.frontier.wildlife165, {}); assert.deepEqual(d.expansions127.modules.openlife217.kills, {});
  // Animal vu par les peintres (même silhouette que le catalogue élargi).
  const ctx = new Proxy({}, { get: (_, k) => k === 'globalAlpha' ? 1 : () => {}, set: () => true });
  assert.equal(globalThis.DeadwallWildlifeArt165.drawAnimal(ctx, live.find(e => e.id === a.id)), true);
  // Tir : l'animal tombe, sa dépouille reste à sa place.
  assert.equal(g.frontier.hitWildlife165(a.id, 500), true); const pose = g.frontier.wildlifeStatus165(a.id); assert.equal(pose.hp, 0);
  d = g.serialize(); const c = K.parseEntity(a.id), kills = d.expansions127.modules.openlife217.kills;
  assert.deepEqual(kills, { [c.canton]: { [String(c.index)]: [pose.x, pose.y, pose.a] } }, 'un seul écart : l’animal abattu');
  assert.ok(JSON.stringify(d.expansions127.modules.openlife217).length < 160, 'sauvegarde bornée');
  // Reprise : l'animal reste mort, sa dépouille au même endroit ; seconde écriture identique octet pour octet.
  assert.equal(g.save(true), true); const raw = localStorage.getItem(C.SAVE_KEY);
  assert.equal(g.restoreSave(globalThis.DeadwallSave.parse(raw)), true); g.paused = false; g.activeOverlay = null; steps(2);
  assert.ok(!g.frontier.wildlife165().some(e => e.id === a.id), 'pas de résurrection');
  const remains = g.frontier.wildlifeRemains165(30); assert.ok(remains.some(q => q.id === a.id && q.hp === 0 && q.x === pose.x && q.y === pose.y));
  const again = g.serialize(); assert.deepEqual(again.expansions127.modules.openlife217, d.expansions127.modules.openlife217);
  // Préparation au couteau : même récolte finie que la région finie, registre creux par identifiant de canton.
  for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0;
  const h = g.wildHarvest190, ready = h.quote('harvest', a.id); assert.equal(ready.ok, true, ready.reason);
  assert.equal(h.begin('harvest', a.id).ok, true); for (let n = 0; n < 150 && h.busy(); n++) h.step(.1);
  assert.equal(h.taken(a.id), ready.amount); assert.equal(g.player.carry.food, ready.amount);
  const saved = g.serialize(); assert.equal(saved.expansions127.modules.wildlife190.harvested[a.id], ready.amount);
  assert.equal(g.restoreSave(clone(saved)), true); assert.equal(g.wildHarvest190.taken(a.id), ready.amount);
  // Refus : animal abattu absent de la graine, part de gibier impossible, gibier de canton sur une région finie.
  const ghost = clone(saved); ghost.expansions127.modules.openlife217.kills[c.canton][String(c.index)] = [pose.x + 45, pose.y, 0];
  assert.throws(() => g.restoreSave(ghost), /absent|invalide/);
  const greedy = clone(saved); greedy.expansions127.modules.wildlife190.harvested[a.id] = C.WildlifeHarvest190Rules.yields[a.species] + 1;
  assert.throws(() => g.restoreSave(greedy), /invalide/);
  assert.equal(g.restoreSave(clone(saved)), true);
});

test('T5.4 : épave d’un lieu de canton — fouille, démontage fini, sauvegarde et reprise', () => {
  openStart(); const w = g.frontier.world(), h = w.home, c = K.at(h.x, h.y), R = C.Travel131Rules;
  let spot = null;
  outer: for (const q of K.ring(c.cx, c.cy, 1)) for (const p of w.placesOf(q.cx, q.cy)) for (const v of p.parking) {
    if (['bike', 'skate'].includes(v.type)) continue;
    for (const side of [-1, 1]) { const s = G.global(v, v.w / 2, side < 0 ? -.75 : v.h + .75); if (!w.blocked(s.x, s.y, .32, 0, null) && w.line(s, Survey.edge(s, v), 0, null, v.id, .025)) { spot = { p, v, s }; break outer; } }
  }
  assert.ok(spot, 'épave accessible près de la cité'); const { p, v, s } = spot;
  // Occupants du lieu et des voisins écartés (comme le test historique de la région finie).
  const enemies = {}; for (const near of w.nearPOI(s.x, s.y, 60)) for (let i = 0; i < w.threatCount(near); i++) enemies[near.id + ':e' + i] = 0;
  const pc = K.at(p.x, p.y), cantons = [...new Set([...g.serialize().frontier.cantons, K.id(pc.cx, pc.cy), ...w.nearPOI(s.x, s.y, 60).map(q => q.canton)])];
  standIn(s, { seen: [p.id], enemies, kills: Object.keys(enemies).length, cantons }); steps(1);
  // Fouille réelle du coffre (E), jusqu'au vide.
  for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0;
  for (let i = 0; i < 2000 && (g.frontier.snapshot().taken[v.id] || 0) < v.amount - 1e-7; i++) { g.input.keys.add('KeyE'); g.update(1 / 30); for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0; }
  g.input.keys.delete('KeyE'); assert.ok(g.frontier.snapshot().taken[v.id] >= v.amount - 1e-7, 'coffre de l’épave vidé');
  // Démontage : même réserve mécanique finie que la région finie.
  const total = globalThis.DeadwallExplorationPack131?.wreckReserve?.(g.world.seed, v.id) ?? g.travel131.wreckStatus(v.id).total;
  assert.equal(g.travel131.wreckStatus(v.id).total, total); let got = 0;
  for (let n = 0; n < 6 && g.travel131.wreckStatus(v.id).remaining; n++) {
    for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0; g.player.carry.scrap = 1;
    const r = g.travel131.begin('dismantle', v.id); assert.equal(r.ok, true, r.reason);
    for (let i = 0; i < Math.ceil(R.dismantleSeconds / .04) + 2; i++) { g.travel131.step(.04); g.input.pressed.clear(); }
    got += g.player.carry.scrap;
  }
  assert.equal(got, total); assert.equal(g.travel131.wreckStatus(v.id).remaining, 0);
  const d = g.serialize(); assert.deepEqual(d.expansions127.modules.exploration131.wrecks, [{ id: v.id, recovered: total }]);
  assert.equal(g.restoreSave(clone(d)), true); assert.equal(g.travel131.wreckStatus(v.id).remaining, 0);
  assert.ok(g.openLife217.overview().rows.some(r => r.label === 'Épaves démontées' && r.value === '1'));
  // Refus : épave d'un lieu jamais repéré, épave de canton sur une région finie.
  const unseen = clone(d); unseen.frontier.seen = []; unseen.frontier.notes = {}; unseen.frontier.pin = null; assert.throws(() => g.restoreSave(unseen));
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); const flat = g.serialize(); flat.expansions127.modules.exploration131.wrecks = [{ id: v.id, recovered: 1 }];
  assert.throws(() => globalThis.DeadwallSave.validate(flat), /invalide/);
});

test('T5.4 : migrations sur les routes des cantons — cap tenu le long de la route, bornées hors de la cité', () => {
  // Hordes régionales nées à la première sortie, tirées sur les routes des cantons proches de la cité.
  openStart(); const w = g.frontier.world(); standIn(landCheckpoint(w).p);
  steps(2); const before = clone(g.serialize().worldEvolution.groups); assert.ok(before.length >= 6);
  steps(300); const after = g.serialize().worldEvolution.groups, rule = C.WorldEvolution.RULES;
  let followed = 0;
  for (const q of after) {
    const o = before.find(b => b.id === q.id); if (!o) continue; const moved = Math.hypot(q.x - o.x, q.y - o.y), speed = rule.behaviours[q.kind].speed;
    assert.ok(moved <= speed * 10.2 + 1e-6, q.id + ' ' + moved); assert.ok(Math.hypot(q.x - w.home.x, q.y - w.home.y) >= rule.homeExclusion - speed * 10.2);
    if (q.kind !== 'migrating') continue; const r = w.nearestRoad(q); if (!r) continue;
    const road = Math.atan2(r.road.b.y - r.road.a.y, r.road.b.x - r.road.a.x), d = Math.abs(Math.sin(q.a - road));
    if (r.d < 60) { assert.ok(d < .35, q.id + ' cap ' + d); followed++; }
  }
  assert.ok(followed >= 1, 'au moins une migration suit une route de canton');
});

test('T5.4 : pêche depuis la berge d’une eau de canton — même ligne, même prise, poisson compté parmi les abattus', () => {
  openStart(); const w = g.frontier.world(), h = w.home, c = K.at(h.x, h.y); let spot = null;
  outer: for (const q of K.ring(c.cx, c.cy, 2)) for (let i = 0; i < 128; i++) {
    const a = L.animal(w, q.cx, q.cy, i); if (!a || a.profile.mode !== 'swim' || !L.admitted(w, a)) continue;
    for (const d of [1, 2, 3, 4, 5, 6]) for (let n = 0; n < 24; n++) {
      const p = { x: a.x + Math.cos(n / 24 * Math.PI * 2) * d, y: a.y + Math.sin(n / 24 * Math.PI * 2) * d };
      if (w.blocked(p.x, p.y, .32, 0, null) || L.water(w, p.x, p.y).water || !L.waterLine(w, p, a, .04)) continue;
      spot = { a, p: { ...p, a: Math.atan2(a.y - p.y, a.x - p.x) } }; break outer;
    }
  }
  assert.ok(spot, 'poisson visible depuis une berge près de la cité'); const { a, p } = spot;
  standIn(p); steps(1); assert.ok(g.frontier.wildlife165().some(e => e.id === a.id), 'poisson vivant présent');
  for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0; Object.assign(g.player.carry, { wood: 1, scrap: 1, food: .5 });
  const hv = g.wildHarvest190, offer = hv.quote('fish', a.id); assert.equal(offer.ok, true, offer.reason);
  assert.equal(hv.begin('fish', a.id).ok, true); for (let n = 0; n < 150 && hv.busy(); n++) hv.step(.1);
  assert.equal(hv.taken(a.id), C.WildlifeHarvest190Rules.yields[a.species]); assert.equal(g.frontier.wildlifeStatus165(a.id).hp, 0);
  const e = K.parseEntity(a.id), d = g.serialize(); assert.ok(d.expansions127.modules.openlife217.kills[e.canton][String(e.index)]);
  assert.equal(g.restoreSave(clone(d)), true); assert.match(g.wildHarvest190.quote('fish', a.id).reason, /épuisée|vivant/);
});
