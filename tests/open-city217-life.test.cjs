'use strict';
// Monde sans bord, préalable O9 (a) (specs/monde-sans-bord/ouverture.md) : quartiers, chantiers de jour et systèmes de
// cité sur un monde de terrain. Une partie construite sur la carte de 192 m née de la description locale (harnais) tourne
// sans contournement : quartiers et haltes posés sur le terrain atteint, points de terrain, `fieldcraft` (routes du
// terrain, place atteinte), travaux de terrain sur 192 cases, plan de la carte plate absent, construction, mise en
// service, bilan, minicarte et plan complets, vague complète, sauvegarde et reprise de la cité. Toujours hors jeu : la
// génération 12 reste refusée (registre régional fermé) ; une carte plate ne prend aucun de ces chemins.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, T = C.TILE, N = 192, Lw = require('../src/world-local217.js');
const M = require('../src/world-save217.js'), Sites = require('../src/world-sites217.js'), E = require('../src/earthworks217.js');
const Game = g.constructor, World = g.world.constructor, MAP = C.localMap217(N);
const descs = new Map(), describe = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const strip = d => { const c = JSON.parse(JSON.stringify(d)); delete c.timestamp; return c; };
const reset = () => { g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); };
// Partie de terrain : harnais O8a, puis l'entrée ordinaire d'un monde neuf dans la cité (décor, points de terrain,
// bilan, menu de construction). Aucune méthode du jeu n'est remplacée.
function life(seed) {
  g.startNew('standard', String(seed)); g.campaignIntro132?.skip?.();
  const random = g.random.state, r = buildTerrainGame217(g, describe, seed);
  g.fieldcraft.setup(); g.refreshMetrics(true); g.cancelPlacement();
  return { ...r, random };
}
// Contexte factice qui garde les textes écrits.
function recorder() {
  const texts = [], target = { canvas: { width: 800, height: 800 } };
  const ctx = new Proxy(target, {
    get(t, k) { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; if (k === 'measureText') return s => ({ width: String(s).length * 7 }); if (k === 'fillText' || k === 'strokeText') return s => texts.push(String(s)); if (/^create/.test(k)) return () => ({ addColorStop() {} }); return () => {}; },
    set(t, k, v) { t[k] = v; return true; }
  });
  return { ctx, texts };
}

test('O9 (a) : règles gelées, quartiers et haltes nés du terrain sans tirage', () => {
  const R = C.OpenCityLife217Rules; assert.ok(Object.isFrozen(R) && Object.isFrozen(R.quarters) && Object.isFrozen(R.halts));
  assert.deepEqual(JSON.parse(JSON.stringify(R)), { version: 1, generation: 12, clear: 2, quarters: { target: 45, near: 28, far: 72, spacing: 22 }, halts: { spacing: 8 } });
  assert.equal(C.WorldSave217Rules.open, true, 'O9 : la génération 12 s’ouvre par l’option de menu');
  const themes = C.TERRITORY_SECTORS.map(s => s.id), catalogue = C.Expeditions.sitesFor({ cityGeometry202: 0 });
  for (const seed of [17117, 0, 46]) {
    const d = describe(seed), a = new World(seed, 0, MAP, d), b = new World(seed, 0, MAP, d);
    assert.deepEqual(a.sites, b.sites, seed + ' : fonction pure de la graine et de la description');
    assert.deepEqual(a.sites.map(s => s.theme), themes, seed + ' : six quartiers, un par thème');
    for (const s of a.sites) {
      assert.equal(a.reach217(s.x, s.y), true, seed + ' : quartier atteint depuis le centre (' + s.theme + ')');
      assert.equal(a.footprintClear217(s.x - 2.5 * T, s.y - 2.5 * T, 5 * T, 5 * T), true, seed + ' : quartier sur un seul palier, à sec');
      assert.ok(a.sites.every(o => o === s || Math.hypot(o.x - s.x, o.y - s.y) >= R.quarters.spacing * T), seed + ' : quartiers espacés');
    }
    const halts = a.halts217(catalogue);
    assert.equal(halts, a.halts217(catalogue), 'haltes gardées par terrain');
    assert.deepEqual(halts.map(h => h.id), catalogue.map(h => h.id));
    for (const h of halts) { assert.equal(a.reach217(h.x, h.y), true, seed + ' : halte atteinte ' + h.id); assert.equal(h.name, catalogue.find(c => c.id === h.id).name); }
  }
  // Carte plate : quartiers du contenu généré, haltes du catalogue, tout point atteint.
  const flat = new World(17117, 0, C.LOCAL_MAP217);
  assert.equal(flat.halts217(catalogue), catalogue); assert.equal(flat.reach217(-1e6, 1e6), true);
  assert.deepEqual(flat.sites, globalThis.DeadwallWorldContent.generate(17117).sites);
});

test('O9 (a) : une partie de terrain vit sans contournement — chantiers de jour, construction, bilan, vague complète', () => {
  for (const seed of [17117, 46]) {
    const r = life(seed), w = r.world;
    assert.equal(g.random.state, r.random, seed + ' : aucun tirage de la partie pour poser la cité');
    // Chantiers de jour : 18 points de terrain sur le terrain atteint, dans la carte de 192 m.
    const day = g.dayworks.snapshot();
    assert.equal(day.sites.length, 18, seed + ' : points de terrain');
    for (const s of day.sites) { assert.equal(w.reach217(s.x, s.y), true, seed + ' : point atteint ' + s.id); assert.ok(s.x >= 48 && s.x <= N * T - 48 && s.y >= 48 && s.y <= N * T - 48); }
    assert.ok(day.sites.some(s => s.x > 4048 || s.y > 4048), seed + ' : la carte de 192 m est utilisée au-delà de 4 048');
    // Haltes du module des expéditions, lues par les repères.
    assert.deepEqual(g.expeditions.sites(), w.halts217(C.Expeditions.sitesFor({ cityGeometry202: w.cityGeometry202 })));
    // Plan de la carte plate absent : ni butin de station, ni solide invisible.
    assert.ok(!w.nodes.some(n => n.__exploration125Loot), seed + ' : aucun butin de station du plan plat');
    assert.equal(g.exploration125.firstObstruction({ x: 10, y: 10 }, { x: N * T - 10, y: N * T - 10 }), null);
    assert.equal(g.exploration125.drawMap(recorder().ctx, .1, .1), false);
    // Construction par le menu : chantier posé, bâti par les ouvriers, mis en service, bilan rafraîchi.
    Object.assign(g.resources, { wood: 900, scrap: 900, stone: 900 });
    const core = r.core, type = 'warehouse';
    let site = null;
    for (let k = 0; k < 900 && !site; k++) {
      const gx = core.gx - 15 + (k % 30), gy = core.gy - 15 + Math.floor(k / 30);
      if (Math.abs(gx - core.gx) < 5 && Math.abs(gy - core.gy) < 5) continue;
      if (w.placement(w.definition(type), gx, gy).valid && g.placeOne(type, gx, gy)) site = [...w.buildings.values()].at(-1);
    }
    assert.ok(site && site.type === type && !site.completed, seed + ' : chantier posé par placeOne');
    const score = g.metrics?.score ?? null;
    g.workerOrder = 'build'; for (const u of g.units) Object.assign(u, { x: core.x, y: core.bottom + 40, navigation: null, state: 'idle', think: 0 });
    g.paused = false; g.phase = 'calm'; g.phaseTime = 600;
    for (let f = 0; f < 30 * 120 && !site.completed; f++) g.update(1 / 30);
    assert.ok(site.completed, seed + ' : bâtiment mis en service');
    if (score !== null) assert.ok(g.metrics.score >= score, seed + ' : bilan rafraîchi');
    g.cancelPlacement(); g.refreshMetrics(true);
    // Minicarte complète et plan de la cité : aucun nom du plan plat, quartiers nommés.
    g.renderMinimap();
    const plan = recorder(); g.exploration125.renderMap(plan.ctx, 800, 800);
    for (const s of g.exploration125.plan.settlements || []) assert.ok(!plan.texts.includes(s.name.toUpperCase()), seed + ' : hameau du plan plat absent ' + s.name);
    assert.ok(!plan.texts.includes('ESSENCE'), seed + ' : station du plan plat absente');
    for (const s of w.sites) assert.ok(plan.texts.includes(s.name.toUpperCase()), seed + ' : quartier nommé ' + s.name);
    // Vague complète : annonce, apparitions, assaut, défense (infectés abattus), aube.
    // Sauvegarde automatique laissée au jeu : refusée proprement tant que le registre régional G12 est fermé.
    g.phaseTime = .1; let assault = false, spawned = 0;
    for (let f = 0; f < 30 * 600 && !(assault && g.phase === 'calm'); f++) {
      const n = g.zombies.length; g.update(1 / 30); spawned += Math.max(0, g.zombies.length - n);
      if (g.phase === 'assault') assault = true;
      if (f % 60 === 0) for (const z of g.zombies) if (!z.dead && z.health > 0) { z.health = 0; g.killZombie(z, false); }
    }
    assert.ok(assault, seed + ' : assaut'); assert.equal(g.phase, 'calm', seed + ' : aube revenue'); assert.equal(g.wave, 2);
    assert.ok(spawned > 5, seed + ' : infectés apparus'); assert.equal(g.gameOver, false);
    assert.equal(g.lastSaveStatus.ok, false, seed + ' : sauvegarde refusée, partie poursuivie');
  }
  reset();
});

test('O9 (a) : fieldcraft lit les routes du terrain, place atteinte ; carte plate inchangée', () => {
  for (const seed of [17117, 0]) {
    g.startNew('standard', String(seed)); g.campaignIntro132?.skip?.();
    const r = buildTerrainGame217(g, describe, seed), w = r.world, t = w.terrain217, start = new Map(w.nodes.map(n => [n.id, [n.x, n.y]]));
    g.fieldcraft.setup();
    const ring = { x: t.centre.x * T + 16, y: t.centre.y * T + 16 }; let moved = 0;
    for (const n of w.nodes) {
      const [x, y] = start.get(n.id); if (n.x === x && n.y === y) continue; moved++;
      const b = g.fieldcraft.reserveRect(n);
      for (let gy = Math.floor(b.t / T); gy <= Math.floor(b.b / T); gy++) for (let gx = Math.floor(b.l / T); gx <= Math.floor(b.r / T); gx++) assert.equal(t.roads[gy * N + gx], 0, seed + ' : gisement replacé hors des routes du terrain');
      assert.ok(Math.hypot(n.x - ring.x, n.y - ring.y) >= 270, seed + ' : hors de l’anneau central');
      if (w.reach217(x, y)) assert.equal(w.reach217(n.x, n.y), true, seed + ' : place nouvelle atteinte');
    }
    assert.ok(moved > 0, seed + ' : des gisements sont replacés');
  }
  // Carte plate : la croix et l'anneau de la carte plate, aucun accesseur du terrain lu (parcours empoisonné).
  reset();
  const proto = World.prototype, keep = ['reach217', 'halts217'].map(k => [k, proto[k]]);
  for (const [k] of keep) proto[k] = () => { throw Error('chemin du terrain sur une carte plate : ' + k); };
  try { g.fieldcraft.setup(); g.expeditions.sites(); g.dayworks.snapshot(); g.renderMinimap(); g.exploration125.renderMap(recorder().ctx, 800, 800); for (let f = 0; f < 120; f++) g.update(1 / 30); }
  finally { for (const [k, v] of keep) proto[k] = v; }
  reset();
});

test('O9 (a) : bornes des registres lues sur la carte de la campagne', () => {
  const D = C.Dayworks, flat = { version: 20 }, wide = { localTiles: 192, frontier: { generation: 12 } };
  const one = x => ({ version: 1, initialized: true, sites: D.SITES.map((s, k) => ({ id: s.id, x: k === 0 ? x : 100 + k, y: 100, seen: false, survey: 0, remaining: s.amount })), day: { wave: 1, duration: 10 }, braces: [], night: null, stats: { surveyed: 0, salvaged: 0, plans: 0, bonusWork: 0, foodSpent: 0, braced: 0, absorbed: 0 } });
  assert.doesNotThrow(() => D.normalize(one(4048), flat)); assert.throws(() => D.normalize(one(4049), flat));
  assert.doesNotThrow(() => D.normalize(one(6096), wide)); assert.throws(() => D.normalize(one(6097), wide));
  assert.throws(() => D.normalize(one(4049), { localTiles: 77 }), 'taille inconnue : borne historique');
  // Génération des points : même résultat qu'avant sur la carte de 128 m (borne par défaut 4 048).
  const sites = globalThis.DeadwallWorldContent.generate(17117).sites;
  assert.deepEqual(new D.Engine().initialize(17117, sites) && 1, 1);
  const e1 = new D.Engine(), e2 = new D.Engine(); e1.initialize(17117, sites); e2.initialize(17117, sites, () => true, 4048);
  assert.deepEqual(e1.state.sites, e2.state.sites);
  // Travaux de terrain : cases au-delà de 128 admises sur la carte de 192 m, clés distinctes.
  const ditch = (x, y) => ({ x, y, dug: 0, fill: 0, wet: false, back: null }), raw = { version: 2, active: true, earth: 0, ditches: [ditch(130, 0 + 1), ditch(2, 2)], banks: [] };
  assert.throws(() => E.validate(raw, flat)); assert.equal(E.validate(raw, wide).ditches.length, 2);
  assert.throws(() => E.validate({ ...raw, ditches: [ditch(190, 5)] }, wide)); assert.equal(E.validate({ ...raw, ditches: [ditch(189, 5)] }, wide).ditches.length, 1);
  assert.equal(E.validate({ ...raw, ditches: [ditch(125, 5)] }, flat).ditches.length, 1);
});

test('O9 (a) : sauvegarde et reprise de la cité de terrain ; sans la marque expérimentale, refus propre', () => {
  const seed = 17117; life(seed);
  g.paused = false; for (let f = 0; f < 300; f++) g.update(1 / 30);
  // Harnais sans l'option de menu (O9) : registre G12 neuf, mais aucune marque « expérimental » ; la sauvegarde est refusée
  // proprement, la partie continue. Une carte de 192 m sans registre G12 reste refusée par la taille de carte.
  const status = g.lastSaveStatus;
  assert.equal(g.save(false), false); assert.equal(g.lastSaveStatus.code, 'invalid-state'); assert.ok(g.world.terrain217);
  assert.equal(g.serialize().frontier.generation, 12, 'registre G12 neuf sur un monde de terrain');
  assert.throws(() => globalThis.DeadwallSave.validate(g.serialize()), /marque expérimentale/);
  assert.throws(() => globalThis.DeadwallSave.validate({ ...g.serialize(), frontier: C.Frontier.initial() }), /taille de carte locale/);
  // Ouverte (simulée ici seulement, comme tests/world-save217.test.cjs) : registre G12 neuf, carte locale exposée.
  const ownM = globalThis.DeadwallWorldSave217, ownL = globalThis.DeadwallWorldLocal217;
  globalThis.DeadwallWorldSave217 = { ...M, opened: () => true }; globalThis.DeadwallWorldLocal217 = Lw;
  try {
    const d = g.serialize(); d.frontier = M.initial(Sites.create(seed).home); d.expansions127.modules.openworld217 = globalThis.DeadwallOpenWorld217.fresh();
    assert.equal(d.localTiles, N);
    assert.doesNotThrow(() => globalThis.DeadwallSave.validate(JSON.parse(JSON.stringify(d))));
    const old = g.world; assert.equal(g.restoreSave(JSON.parse(JSON.stringify(d))), true);
    assert.notEqual(g.world, old); assert.ok(g.world.terrain217, 'reprise sur le terrain de la graine');
    assert.deepEqual(g.world.sites, old.sites);
    assert.deepEqual(strip(g.serialize()), strip(d), 'reprise identique (sections de la cité comprises)');
    g.render(); g.renderMinimap();
    // Préparations G5–G11 sans objet en G12 : seul le registre vide passe.
    const bad = JSON.parse(JSON.stringify(d)); bad.expansions127.modules.world131 = { version: 1, relays: {}, secured: ['P0001'], opened: [], surveyed: [] };
    assert.throws(() => globalThis.DeadwallSave.validate(bad), /régions lointaines/);
    // Sans la carte locale, une campagne G12 ne se reprend pas sur une carte plate.
    globalThis.DeadwallWorldLocal217 = undefined;
    assert.throws(() => g.restoreSave(JSON.parse(JSON.stringify(d))), /Carte locale de génération 12 absente/);
  } finally { globalThis.DeadwallWorldSave217 = ownM; globalThis.DeadwallWorldLocal217 = ownL; g.lastSaveStatus = status; }
  reset();
  // Sauvegarde d'une carte plate inchangée : aucun champ ajouté.
  const flat = g.serialize(); assert.equal(flat.localTiles, undefined); assert.doesNotThrow(() => globalThis.DeadwallSave.validate(flat));
});

test('O9 (a) : modules G12 chargés par le jeu depuis O9, chemins gardés par le terrain', () => {
  const html = read('index.html');
  for (const f of ['world-local217.js', 'world-open217.js', 'world-save217.js', 'terrain-art217.js', 'terrain-fps217.js']) assert.ok(html.includes('<script src="src/' + f + '"></script>'), f + ' chargé par le jeu (O9)');
  const game = read('src/game.js');
  assert.ok(game.includes('this.sites = quarters217(t);'));
  assert.ok(/clearLocation\(x,y\)\{if\(g\.world\.terrain217&&!g\.world\.reach217\(x,y\)\)return false;/.test(game));
  assert.ok(read('src/expeditions.js').includes('g.world.terrain217?g.world.halts217('));
  assert.ok(read('src/exploration-125.js').includes('function planOn(game) { return isGeneration4(game) && !game.world?.terrain217; }'));
  assert.ok(read('src/world-pack131.js').includes('if(full?.frontier?.generation===12)'));
});
