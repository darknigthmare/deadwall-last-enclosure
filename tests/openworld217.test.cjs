'use strict';
// Ouverture « Sans bord — expérimental » (specs/monde-sans-bord/ouverture.md, tranche O9 ; tasks.md, T5) : option de menu,
// campagne de génération 12 (cité de 192 m adossée, monde régional sans bord, sauvegarde creuse), module d'extension
// `openworld217` (marque expérimentale et révision du générateur, D-O4 « évoluer, puis geler »), fiche de graine, façade
// régionale (un canton préparé par image, routes et relief autour de la vue). Une campagne lancée sans l'option ne lit
// aucun module de la génération 12 (globales empoisonnées) et garde une sauvegarde sans clé de plus.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
const C = globalThis.DeadwallCore, O = globalThis.DeadwallOpenWorld217, K = globalThis.DeadwallWorldCantons217, M = globalThis.DeadwallWorldSave217;
const MODULES = ['world-cantons217', 'world-canton-gen217', 'world-local217', 'world-open217', 'world-sites217', 'world-save217', 'terrain-art217', 'terrain-fps217'];
const GLOBALS = ['DeadwallOpenWorld217', 'DeadwallWorldCantons217', 'DeadwallWorldCantonGen217', 'DeadwallWorldLocal217', 'DeadwallWorldOpen217', 'DeadwallWorldSites217', 'DeadwallWorldSave217', 'DeadwallTerrainArt217', 'DeadwallTerrainFPS217'];
const strip = d => { const c = JSON.parse(JSON.stringify(d)); delete c.timestamp; return c; };
const notes = []; { const n = g.notify.bind(g); g.notify = (t, k) => { notes.push(String(t)); return n(t, k); }; }
const steps = n => { for (let i = 0; i < n; i++) g.update(1 / 30); };
function openStart(seed = '17117') { const r = g.startNew('standard', seed, 'classic', 'balanced', true, undefined, true); g.campaignIntro132?.skip?.(); return r; }
// Point libre du passage ouvert est, atteint depuis le centre (le commandant y marche).
function eastSpot() { const S = g.local.size; for (let y = 0; y < 192; y++) { const px = S - 50, py = y * C.TILE + 16; if (g.world.reach217(px, py) && g.friendlyPositionClear(g.player, px, py)) return { x: px, y: py }; } return null; }

test('O9 : règles gelées, option de menu (région finie par défaut), scripts publics dans l’ordre, registre des opérations', () => {
  const R = C.OpenWorld217Rules; assert.ok(Object.isFrozen(R) && Object.isFrozen(R.prefetch) && Object.isFrozen(R.lookAhead) && Object.isFrozen(R.exitSearch));
  assert.deepEqual(JSON.parse(JSON.stringify(R)), { version: 1, generation: 12, frame: 192, prefetch: { perFrame: 1, radius: 1 }, lookAhead: { foot: 3, car: 45 }, exitSearch: { step: 2, reach: 40 }, revision: 1 });
  assert.equal(R.frame, C.LocalMap217Rules.generationTiles[12]); assert.equal(C.WorldSave217Rules.open, true);
  const html = read('index.html'), at = f => html.indexOf('<script src="src/' + f + '.js"></script>');
  assert.match(html, /<select id="worldOpen217"[^>]*><option value="finite" selected>Région finie \(défaut\)<\/option><option value="open">Sans bord — expérimental<\/option><\/select>/);
  assert.match(read('index.html'), /id="worldOpenHint217"[^>]*>[^<]*générateur peut encore changer[^<]*« monde révisé »[^<]*pas convertible/);
  // Ordre : cœur, cantons, générateur, carte locale, monde ouvert, lieux, sauvegarde ; module d'extension après le registre et les relais.
  for (let i = 1; i < 6; i++) assert.ok(at(MODULES[i - 1]) < at(MODULES[i]), MODULES[i]);
  assert.ok(at('core') < at('world-cantons217') && at('world-spawns131') < at('world-sites217') && at('expansion-kit') < at('openworld217') && at('world-pack131') < at('openworld217'));
  const sw = read('sw.js'); for (const f of [...MODULES, 'openworld217']) assert.ok(sw.includes('"src/' + f + '.js"'), f);
  assert.ok(read('src/expansion-kit.js').includes("'openworld217','balance217','breach217']"));
  for (const name of ['ORDER', 'GROUPS', 'API_NAMES', 'LABELS']) assert.ok(new RegExp(name + '\\s*=\\s*[\\s\\S]*?openworld217').test(read('src/expansion-ui.js')), name);
  assert.ok(g.expansions.get('openworld217'), 'module d’extension enregistré au chargement');
  assert.deepEqual(O.validate(undefined), O.initial()); assert.deepEqual(O.initial(), { version: 1, active: false, revision: null });
  assert.deepEqual(O.fresh().revision, O.revision()); assert.deepEqual(Object.keys(O.revision()), ['open', 'canton', 'relief', 'sites', 'local']);
});

test('O9 : partie sans l’option — aucun module de la génération 12 lu, sauvegarde sans clé de plus, sortie régionale historique', () => {
  const own = Object.fromEntries(GLOBALS.map(k => [k, globalThis[k]])), touched = [];
  const poison = name => new Proxy({}, { get(_, key) { if (typeof key === 'string') touched.push(name + '.' + key); throw Error('module G12 lu sans l’option : ' + name + '.' + String(key)); } });
  try {
    for (const k of GLOBALS) globalThis[k] = poison(k);
    assert.notEqual(g.startNew('standard', '17117'), false); g.campaignIntro132?.skip?.();
    assert.equal(g.world.terrain217, null); assert.equal(g.local.size, 4096); assert.notEqual(g.frontier.position().generation, 12);
    g.phaseTime = .5; steps(240); g.render(); g.renderMinimap();
    const d = g.serialize(); assert.equal(d.expansions127.modules.openworld217, undefined, 'aucune clé openworld217'); assert.equal(d.localTiles, undefined);
    assert.equal(g.openWorld217.active(), false); assert.equal(g.expansionUI ? g.expansions.get('openworld217').available() : false, false, 'module inactif (l’index des opérations l’affiche comme région finie)');
    // Sortie régionale par le bord est (monde régional fini) et retour.
    g.player.x = g.local.size - 50; g.player.y = g.local.size / 2; assert.equal(g.frontier.enter(), true); steps(30); g.render();
    assert.notEqual(g.frontier.world().unbounded, true);
    assert.doesNotThrow(() => globalThis.DeadwallSave.validate(JSON.parse(JSON.stringify(g.serialize()))));
    assert.equal(g.restoreSave(JSON.parse(JSON.stringify(g.serialize()))), true);
    assert.deepEqual(touched, []);
  } finally { for (const k of GLOBALS) globalThis[k] = own[k]; }
});

test('O9 : départ avec l’option — génération 12, cité de 192 m adossée, marque expérimentale, sauvegarde et reprise identiques', () => {
  const random = Math.random; let draws = 0; Math.random = () => { draws++; return random(); };
  try { assert.notEqual(openStart(), false); } finally { Math.random = random; }
  assert.ok(g.world.terrain217, 'cité de terrain'); assert.equal(g.local.size, 192 * C.TILE); assert.equal(g.world.cityGeometry202, 1);
  const pos = g.frontier.position(); assert.equal(pos.generation, 12); assert.equal(pos.detailVersion, C.WorldSites217Rules.detailVersion); assert.equal(pos.active, false);
  assert.deepEqual(g.openWorld217.snapshot(), { version: 1, active: true, revision: O.revision() }); assert.equal(g.openWorld217.revised(), false);
  const core = g.core(), d17 = globalThis.DeadwallWorldLocal217.describe(17117);
  assert.equal(Math.round(core.x / C.TILE), d17.centre.x); assert.equal(Math.round((core.y + core.h * C.TILE / 2) / C.TILE) > 0, true);
  assert.deepEqual(Object.values(g.world.terrain217.sides).map(s => s.status), Object.values(d17.sides).map(s => s.status));
  // Cadre régional de la cité : 192 m autour du site de fondation de K0_0 ; le registre G12 commence au centre du cadre.
  const h = O.home(17117); assert.equal(h.size, 192); assert.equal(h.canton, 'K0_0'); assert.deepEqual([g.frontier.snapshot().x, g.frontier.snapshot().y], [h.x, h.y]);
  assert.equal(globalThis.DeadwallAtlasProjection.home(g), h);
  assert.equal(g.lastSaveStatus.ok, true, 'sauvegarde automatique du départ acceptée');
  const saved = globalThis.DeadwallSave.parse(localStorage.getItem(C.SAVE_KEY));
  assert.equal(saved.frontier.generation, 12); assert.equal(saved.localTiles, 192); assert.deepEqual(saved.expansions127.modules.openworld217, g.openWorld217.snapshot());
  // Vague à fronts ouverts (vague 5, comme le harnais d'O7) : effectif et fronts parmi les côtés non clos.
  g.wave = 5; g.phaseTime = .5; steps(150);
  const open = Object.values(g.world.terrain217.sides).filter(s => s.status !== 'clos').map(s => s.side);
  assert.ok(g.fronts.length >= 1 && g.fronts.every(f => open.includes(f)), 'fronts parmi les côtés ouverts : ' + g.fronts);
  // Siège adossé sauvegardé pendant la vague seulement : un état lu au calme n'entre pas dans la sauvegarde (refusée sinon).
  assert.ok(g.serialize().openSiege217); const phase = g.phase; g.phase = 'calm'; assert.equal(g.serialize().openSiege217, undefined); g.phase = phase;
  const d = g.serialize(), back = g.restoreSave(JSON.parse(JSON.stringify(d)));
  assert.equal(back, true); assert.deepEqual(strip(g.serialize()), strip(d), 'reprise identique'); assert.ok(g.world.terrain217);
  // Rejouer la carte : nouvelle campagne sans bord, même graine.
  assert.notEqual(g.replayCurrentMap(), false); assert.equal(g.frontier.position().generation, 12); assert.equal(g.world.seed, 17117); assert.equal(g.openWorld217.active(), true);
  assert.equal(draws > 0, true, 'le départ tire comme avant (équipe) ; aucune règle ajoutée ne tire');
});

test('O9 : sortie à pied par un passage ouvert, cantons vus, sauvegarde et reprise en pleine sortie, retour ; bord fermé refusé', () => {
  openStart(); const spot = eastSpot(); assert.ok(spot, 'passage est atteint');
  g.player.x = spot.x; g.player.y = spot.y; assert.equal(g.frontier.enter(), true);
  const h = O.home(17117), f = g.frontier.position(); assert.equal(f.active, true); assert.ok(Math.abs(f.x - (h.maxX + 4)) < 1e-6, 'sortie au bord est du cadre');
  const w = g.frontier.world(); assert.equal(w.unbounded, true); assert.equal(w.home, h);
  g.input.keys.add('KeyD'); steps(90); g.input.keys.delete('KeyD'); g.render(); g.renderMinimap();
  const moved = g.frontier.position(); assert.ok(moved.x > f.x + 5, 'marche vers l’est');
  // Hordes régionales tirées sur les routes des cantons (pickRoad, sans liste globale), hors de la cité.
  const groups = g.serialize().worldEvolution.groups;
  assert.ok(groups.length > 0); for (const q of groups) assert.ok(Number.isFinite(q.x) && Number.isFinite(q.y) && Math.hypot(q.x - h.x, q.y - h.y) > C.WorldEvolution.RULES.homeExclusion, q.id);
  const snap = g.frontier.snapshot(), c = K.at(moved.x, moved.y); assert.ok(snap.cantons.includes(K.id(c.cx, c.cy)), 'canton du commandant vu');
  assert.ok(w.prefetchStats().prefetched >= 1 && w.prefetchStats().prefetched <= w.prefetchStats().frames, 'au plus un canton préparé par image');
  // Sauvegarde et reprise en pleine sortie : même position, même registre.
  assert.equal(g.save(true), true); const raw = localStorage.getItem(C.SAVE_KEY), before = JSON.stringify(g.frontier.snapshot());
  assert.equal(g.restoreSave(globalThis.DeadwallSave.parse(raw)), true); assert.equal(JSON.stringify(g.frontier.snapshot()), before); assert.equal(g.frontier.active(), true);
  // Retour : vers l'ouest jusqu'à la porte est de la cité.
  g.input.keys.add('KeyA'); for (let i = 0; i < 300 && g.frontier.active(); i++) g.update(1 / 30); g.input.keys.delete('KeyA');
  assert.equal(g.frontier.active(), false, 'de retour dans la cité'); assert.ok(g.world.reach217(g.player.x, g.player.y), 'arrivée atteinte depuis le centre');
  // Bord fermé (falaise au nord pour 17117) : registre posé à la porte nord, le retour est refusé avec un message clair.
  const north = g.serialize(); Object.assign(north.frontier, { active: true, x: h.x, y: h.minY + 1, anchor: { x: g.player.x, y: g.player.y } });
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(north))), true); notes.length = 0;
  assert.equal(g.frontier.leave(), false); assert.ok(notes.some(t => /fermé par le relief/.test(t)), notes.join(' | '));
});

test('O9 : D-O4 « évoluer, puis geler » — campagne d’une autre révision jouable et signalée ; refus croisés', () => {
  openStart(); const d = g.serialize();
  const old = JSON.parse(JSON.stringify(d)); old.expansions127.modules.openworld217.revision.canton = O.revision().canton - 1; old.frontier.reliefVersion = O.revision().relief - 1;
  notes.length = 0; assert.equal(g.restoreSave(old), true); assert.equal(g.openWorld217.revised(), true);
  assert.ok(notes.some(t => /^Monde révisé/.test(t)), 'message clair à la reprise');
  assert.ok(g.openWorld217.overview().rows.some(r => /monde révisé/.test(r.value)));
  assert.equal(g.serialize().frontier.reliefVersion, O.revision().relief - 1, 'la campagne garde la révision de sa création');
  assert.equal(M.lastValidation().revised, true, 'registre vérifié sur sa forme');
  steps(30); g.render();
  // Refus croisés : G12 sans marque, marque sur une région finie, marque mal formée.
  const bare = JSON.parse(JSON.stringify(d)); delete bare.expansions127.modules.openworld217;
  assert.throws(() => globalThis.DeadwallSave.validate(bare), /sans marque expérimentale/);
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); const flat = g.serialize();
  assert.throws(() => globalThis.DeadwallSave.validate({ ...flat, expansions127: { ...flat.expansions127, modules: { ...flat.expansions127.modules, openworld217: O.fresh() } } }), /région finie/);
  for (const bad of [{ version: 1, active: true }, { ...O.fresh(), revision: { ...O.revision(), open: 0 } }, { ...O.fresh(), extra: 1 }, { version: 1, active: false, revision: O.revision() }])
    assert.throws(() => O.validate(bad, d), /invalide/);
  assert.deepEqual(O.validate({ version: 1, active: false, revision: null }, flat), O.initial(), 'forme inactive admise sur une région finie');
});

test('O9 : fiche de graine sans bord — côtés fermés, passages, mention expérimentale ; aperçu pur', () => {
  openStart(); const card = globalThis.DeadwallSeedCard217.describe(globalThis.DeadwallSeedCard217.inputs(g));
  assert.match(card.title, /Sans bord — expérimental/); const facts = Object.fromEntries(card.lines);
  assert.match(facts['Côtés fermés'], /Nord \(falaise\), sud \(falaise\)/); assert.match(facts.Passages, /Est 96 m · ouest 32 m/); assert.match(facts.Monde, /générateur peut encore changer/);
  assert.match(card.advice, /2 fronts ouverts/);
  const S = globalThis.DeadwallSeedCard217, random = Math.random; let draws = 0; Math.random = () => { draws++; return random(); };
  try { const a = S.preview({ seedText: '714', open217: true }), b = S.preview({ seedText: '714', open217: true }); assert.deepEqual(a, b); assert.match(a.advice, /Un seul front/); assert.equal(a.preview, true); }
  finally { Math.random = random; }
  assert.equal(draws, 0, 'aperçu sans tirage');
  assert.ok(S.WORKER_SCRIPTS.indexOf('world-local217.js') > S.WORKER_SCRIPTS.indexOf('core.js'));
});

test('O9 : façade régionale — un canton préparé par appel, route la plus proche exacte, routes et relief de la vue bornés', () => {
  const w = O.region(17117), h = O.home(17117);
  assert.equal(w.unbounded, true); assert.equal(w.home, h); assert.equal(w.hydrologyAt(1, 1), null); assert.equal(w.landscape189, 'classic');
  const counts = []; for (let i = 0; i < 11; i++) counts.push(w.prefetch(h.x, h.y));
  assert.deepEqual(counts, [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], 'anneau de 3 × 3 cantons, un par appel');
  assert.equal(w.prefetch(NaN, 0), 0);
  // Route la plus proche : même distance que le parcours complet des tracés des cantons voisins.
  const brute = p => { const c = K.at(p.x, p.y); let best = Infinity; for (let cy = c.cy - 1; cy <= c.cy + 1; cy++) for (let cx = c.cx - 1; cx <= c.cx + 1; cx++) for (const r of w.canton(cx, cy).roads) { const q = r.points || []; for (let i = 1; i < q.length; i++) { const a = q[i - 1], b = q[i], dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0; best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t)); } } return best; };
  for (let i = 0; i < 120; i++) { const p = { x: -600 + (i * 37) % 2200, y: -300 + (i * 53) % 1400 }, r = w.nearestRoad(p); assert.ok(Math.abs(r.d - brute(p)) < 1e-9, JSON.stringify(p)); assert.ok(r.road.a && r.road.b && r.road.width > 0); }
  const view = { l: h.maxX, t: h.y - 40, r: h.maxX + 80, b: h.y + 40 };
  assert.ok(w.roadsIn(view).every(s => s.a && s.b && s.width > 0)); assert.deepEqual(w.roadsIn({ l: 0, t: 0, r: 9000, b: 10 }), [], 'vue démesurée refusée');
  assert.ok(w.biomeAt(h.x, h.y)?.palette, 'milieu de maille lisible par le sol');
  // Segment plus long que la borne du monde sans bord : ligne obstruée (la boucle régionale ne lève jamais d'erreur).
  for (const f of ['line', 'movementLine', 'lineOfSight', 'wildlifeWaterLine']) assert.equal(w[f]({ x: h.maxX + 5, y: h.y }, { x: h.maxX + 1500, y: h.y }, 0), false, f);
  // Peinture : lit les cantons, n'écrit rien, ne tire rien.
  const calls = []; const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (...a) => calls.push(k), set: (t, k, v) => { t[k] = v; return true; } });
  const random = Math.random; Math.random = () => { throw Error('tirage'); };
  try { assert.equal(O.paint(ctx, w, view), true); assert.equal(O.paint(ctx, { unbounded: false }, view), false); } finally { Math.random = random; }
  assert.ok(calls.includes('fillRect'));
  // Itinéraire du GPS : délégué au monde sans bord, prolongé par l'allée du lieu.
  const site = w.nearPOI(h.maxX + 300, h.y, 900)[0], R = globalThis.DeadwallFrontierRouting;
  if (site) { const r = R.route(w, { x: h.maxX + 5, y: h.y }, site); assert.ok(!r || r.metres > 0 && r.path.length > 1); }
});

test('O9 : une campagne à région finie relue par la sauvegarde native n’a pas de clé openworld217 (même document que serialize)', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const before = strip(g.serialize());
  assert.equal('openworld217' in before.expansions127.modules, false);
  // Chemin de `browser-metric174` : le document stocké est relu par DeadwallSave.parse (validateurs des modules).
  const parsed = strip(globalThis.DeadwallSave.parse(JSON.stringify(g.serialize())));
  assert.equal('openworld217' in parsed.expansions127.modules, false, 'aucune clé ajoutée par la relecture');
  assert.deepEqual(parsed.expansions127, before.expansions127);
  assert.equal(g.restoreSave(parsed), true); assert.equal(g.openWorld217.active(), false);
  assert.deepEqual(strip(g.serialize()).expansions127, before.expansions127);
});
