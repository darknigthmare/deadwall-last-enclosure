'use strict';
// Monde sans bord, tranche O7 (specs/monde-sans-bord/ouverture.md) : siège adossé — fronts tirés parmi les côtés non
// clos, apparitions dans les entrées du côté, repli des effectifs (D-O2 : même effectif, jamais plus de points de vie),
// contrainte de passage d'une cité à un seul front, enceintes adossées à la falaise, rampe barrée, brèche sans effet sur
// une falaise, fossé refusé sur une rampe, masse lointaine sur les seuls côtés ouverts. Toujours hors jeu : la partie de
// terrain est construite par le harnais (la génération 12 reste refusée) ; une carte plate ne prend aucun de ces chemins.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');

const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, T = require('../src/tactics.js'), Lw = require('../src/world-local217.js');
const Districts = require('../src/districts.js'), Fallback = require('../src/fallback-order.js'), Linecare = require('../src/linecare.js');
const Breach = require('../src/breach217.js'), Horizon = require('../src/horde-horizon217.js'), Readout = require('../src/siege-readout.js');
const O = C.OpenSiege217, R = C.OpenSiege217Rules;
const World = g.world.constructor, Game = g.constructor, MAP = C.localMap217(192), N = 192, TILE = C.TILE;
const Building = [...g.world.buildings.values()].find(b => b.type === 'core').constructor;
const SIDES = ['north', 'east', 'south', 'west'];
const descs = new Map(), desc = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
// Partie de terrain jouable : harnais O8a. Depuis le préalable O9 (a), le monde de terrain porte ses quartiers (posés sur
// le terrain atteint) et la sauvegarde automatique est laissée au jeu, qui la refuse proprement tant que le registre
// régional G12 est fermé (tests/open-city217-life.test.cjs) : plus de quartiers fictifs ni de sauvegarde coupée.
function terrainGame(seed, d = desc(seed)) {
  restoreFlat();
  return buildTerrainGame217(g, () => d, seed);
}
// Gisements retirés : les enceintes de ces tests se posent sans « ressource à déblayer ».
function cleared(r) { r.world.nodes.length = 0; return r;
}
function restoreFlat() {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
}
// Partie minimale (prototype du jeu) : assez pour `prepareWave` et `spawnZombie`, sans modules.
function bare(seed, d = desc(seed)) {
  const f = Object.create(Game.prototype);
  Object.assign(f, { world: new World(seed, 0, MAP, d), random: new C.Random(seed), wave: 1, difficulty: C.DIFFICULTIES.standard, signature: 0, balance217: null, fronts: [], zombies: [], nextId: 1 });
  return f;
}
// Côté et case de bord d'une apparition : la coordonnée vers l'intérieur est la marge exacte (18 unités) du jeu.
function borderOf(z) {
  const size = MAP.size, gx = Math.floor(z.x / TILE), gy = Math.floor(z.y / TILE);
  if (z.x === 18) return { side: 'west', t: gy }; if (z.x === size - 18) return { side: 'east', t: gy };
  if (z.y === 18) return { side: 'north', t: gx }; if (z.y === size - 18) return { side: 'south', t: gx };
  return null;
}
const inEntries = (s, t) => s.entries.some(e => t >= e.from && t < e.to);
const wallAt = (w, type, gx, gy) => { const b = new Building(g.nextId++, type, gx, gy, 0, 1, w.cityGeometry202); b.health = b.maxHealth; w.add(b); return b; };
// Anneau carré de rayon `r` (cases) autour du centre : murs sur les cases de l'anneau qu'on atteint depuis l'intérieur
// sans franchir de falaise. Les arêtes de falaise ferment le reste : c'est l'enceinte adossée.
function ring(w, r) {
  const c = N / 2, inside = new Uint8Array(N * N), queue = [c * N + c], cells = new Set(); inside[c * N + c] = 1;
  const cheb = (x, y) => Math.max(Math.abs(x - c), Math.abs(y - c));
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], x = i % N, y = (i - x) / N;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (!w.canStep(x, y, nx, ny)) continue;
      const j = ny * N + nx, d = cheb(nx, ny);
      if (d === r) cells.add(j); else if (d < r && !inside[j]) { inside[j] = 1; queue.push(j); }
    }
  }
  const all = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (cheb(x, y) === r) all.push(y * N + x); }
  return { cells: [...cells].sort((a, b) => a - b), all };
}

test('O7 : règles gelées, fonctions pures, et le repli est l’identité en G1–G11 (vagues 1 à 60, trois difficultés)', () => {
  assert.ok(Object.isFrozen(R) && Object.isFrozen(R.foldShares) && Object.isFrozen(R.passRate) && Object.isFrozen(O));
  assert.deepEqual(JSON.parse(JSON.stringify(R)), { version: 1, generation: 12, foldShares: { basis: 'width', minShare: .1 }, passRate: { perMetre: .25, min: 1, max: 1.5 }, minFronts: 1 });
  assert.equal(C.WorldSave217Rules.open, true, 'O9 : génération 12 ouverte derrière l’option de menu');
  const four = Object.fromEntries(SIDES.map(s => [s, { status: 'ouvert', width: 128, entries: [{ from: 0, to: 128, width: 128 }], passages: [] }]));
  let plans = 0;
  for (const key of Object.keys(C.DIFFICULTIES)) for (let wave = 1; wave <= 60; wave++) {
    const plan = C.wavePlan(wave, C.DIFFICULTIES[key], 0), copy = JSON.stringify(plan);
    for (const sides of [null, four]) {
      // Même mélange et mêmes tirages que la carte plate : `dirs` mélangé puis tronqué.
      const a = new C.Random(wave * 977 + plans), b = new C.Random(wave * 977 + plans);
      const dirs = ['north', 'east', 'south', 'west']; a.shuffle(dirs);
      const fold = O.fold(plan.fronts, sides, list => b.shuffle(list));
      assert.deepEqual([...fold.fronts], dirs.slice(0, plan.fronts));
      assert.equal(a.state, b.state, 'même nombre de tirages');
      assert.equal(fold.folded, false);
      const q = O.quotas(plan.total, fold.shares);
      assert.equal(Object.values(q).reduce((n, v) => n + v, 0), plan.total);
      assert.ok(Object.values(fold.shares).every(v => Math.abs(v - 1 / plan.fronts) < 1e-12), 'parts égales');
      assert.equal(O.gap(plan.spawnInterval, fold.fronts, sides), plan.spawnInterval, 'aucun plafond de passage');
    }
    assert.equal(JSON.stringify(plan), copy, 'plan non modifié'); plans++;
  }
  assert.equal(plans, 180);
  // `prepareWave` d'une partie plate : mêmes fronts que l'algorithme d'origine, aucun état de siège.
  restoreFlat();
  for (let wave = 1; wave <= 60; wave++) {
    g.wave = wave; const r = new C.Random(g.random.state), dirs = ['north', 'east', 'south', 'west']; r.shuffle(dirs);
    g.prepareWave(); assert.deepEqual(g.fronts, dirs.slice(0, g.wavePlan.fronts)); assert.equal(g.random.state, r.state);
  }
  assert.equal(g.openSiege217, undefined);
  // Fonctions pures : repli d'un plan de quatre fronts sur deux côtés, parts au prorata de la largeur, plancher.
  const two = { north: { status: 'clos', width: 0 }, east: { status: 'ouvert', width: 96 }, south: { status: 'clos', width: 0 }, west: { status: 'passage', width: 12, passages: [{ kind: 'col', width: 12 }] } };
  const f = O.fold(4, two); assert.deepEqual([...f.fronts], ['east', 'west']); assert.equal(f.folded, true);
  assert.ok(Math.abs(f.shares.east - 96 / 108) < 1e-12 && Math.abs(f.shares.west - 12 / 108) < 1e-12, JSON.stringify(f.shares));
  assert.deepEqual(O.quotas(1000, f.shares), { east: Math.round(1000 * f.shares.east), west: 1000 - Math.round(1000 * f.shares.east) });
  assert.equal(O.rate(['west'], two), 3); assert.equal(O.gap(.1, ['west'], two), 1 / 3); assert.equal(O.gap(.5, ['west'], two), .5);
  // Décision du 22 novembre 2026 : la même rampe, seul côté non clos de la cité, est bornée par le plafond absolu.
  const alone = { ...two, east: { status: 'clos', width: 0 } }, cap = Math.min(3, R.passRate.max);
  assert.equal(O.rate(['west'], alone), cap); assert.equal(O.gap(.1, ['west'], alone), 1 / cap);
  assert.equal(O.phrase(['east', 'west'], two), 'l’est et la rampe de l’ouest');
  assert.equal(O.label('north', { status: 'passage', passages: [{ kind: 'col' }, { kind: 'col' }] }), 'les deux rampes du nord');
  assert.equal(O.label('south', { status: 'passage', passages: [{ kind: 'pont' }] }), 'le pont du sud');
  assert.equal(O.label('east', { status: 'ralenti', passages: [] }), 'le gué de l’est');
  assert.throws(() => O.fold(2, { north: { status: 'clos' }, east: { status: 'clos' }, south: { status: 'clos' }, west: { status: 'clos' } }), /aucun siège/);
});

test('O7 : une carte plate ne prend aucun chemin du siège adossé (parcours empoisonné de 20 s)', () => {
  restoreFlat();
  const poison = [[Game.prototype, ['prepareFronts217', 'openSiegeState217', 'spawnGap217', 'siegeApproach217', 'spawnZombie217']], [T, []]];
  const kept = poison[0][1].map(n => Game.prototype[n]), grid = T.terrainGrid217;
  for (const n of poison[0][1]) Game.prototype[n] = function () { throw new Error(n + ' appelé sur une carte plate'); };
  try {
    assert.equal(T.terrainGrid217(g.world), null);
    g.phaseTime = 1;
    for (let k = 0; k < 600; k++) { if (k % 10 === 0) { const z = g.zombies.find(z => !z.dead); if (z) g.player.facing = Math.atan2(z.y - g.player.y, z.x - g.player.x); g.shootPlayer(); } g.update(1 / 30); }
    assert.ok(g.zombies.length > 0 && g.fronts.length > 0, 'vague lancée');
    assert.equal(g.getEnclosureStatus().exteriorCells + g.getEnclosureStatus().interiorCells + g.getEnclosureStatus().barrierCells, 128 * 128);
  } finally { poison[0][1].forEach((n, k) => { Game.prototype[n] = kept[k]; }); assert.equal(T.terrainGrid217, grid); }
  assert.equal(g.openSiege217, undefined);
  if (g.siegeReadout) assert.equal(g.siegeReadout.fronts(), '', 'aucune ligne de fronts sur une carte plate');
  restoreFlat();
});

test('O7 : 1 000 vagues sur 50 graines — fronts jamais tirés sur un côté clos, apparitions dans les entrées', () => {
  const seeds = []; let closedSeeds = 0, folded = 0, spawned = 0;
  // Les 50 premières graines qui ont au moins un côté clos (une sur deux environ).
  for (let s = 0; seeds.length < 50; s++) { const d = desc(s), n = O.open(d.sides).length; if (n >= 1 && n < 4) { seeds.push(s); closedSeeds++; } }
  assert.equal(closedSeeds, 50);
  for (const s of seeds) {
    const d = desc(s), f = bare(s), open = O.open(d.sides);
    for (let wave = 1; wave <= 20; wave++) {
      f.wave = wave; f.prepareWave();
      const plan = C.wavePlan(wave, f.difficulty, 0);
      assert.equal(f.wavePlan.total, plan.total, 'même effectif');
      assert.ok(f.fronts.every(x => open.includes(x)), s + ' vague ' + wave + ' : ' + f.fronts);
      assert.equal(f.fronts.length, Math.min(plan.fronts, open.length));
      assert.equal(f.openSiege217.folded, plan.fronts > open.length); if (f.openSiege217.folded) folded++;
      for (let k = 0; k < 12; k++) {
        assert.equal(f.spawnZombie('walker'), true); const z = f.zombies[f.zombies.length - 1], b = borderOf(z);
        assert.ok(b && f.fronts.includes(b.side) && d.sides[b.side].status !== 'clos' && inEntries(d.sides[b.side], b.t), s + ' : apparition hors entrée ' + JSON.stringify(b));
        assert.ok(f.world.terrainAt217(z.x, z.y) && !f.world.terrainAt217(z.x, z.y).deep);
        spawned++;
      }
      f.zombies.length = 0;
    }
  }
  assert.equal(seeds.length * 20, 1000); assert.equal(spawned, 12000); assert.ok(folded > 100, folded + ' vagues repliées');
});

test('O7 : repli des effectifs — somme conservée, parts au prorata de la largeur, jamais plus de points de vie', () => {
  // 17117 : couloir est-ouest (est 96 m, ouest 32 m), nord et sud clos par la falaise. Vague 10 : quatre fronts demandés.
  const d = desc(17117), f = bare(17117); f.wave = 10; f.prepareWave();
  assert.deepEqual([...f.fronts].sort(), ['east', 'west']); assert.equal(f.openSiege217.folded, true); assert.equal(f.openSiege217.asked, 4);
  assert.equal(f.fronts[0], 'east', 'le côté le plus large mène les échelons');
  const total = f.wavePlan.total, q = O.quotas(total, f.openSiege217.shares);
  assert.equal(q.east + q.west, total);
  assert.ok(Math.abs(f.openSiege217.shares.east - .75) < 1e-9 && Math.abs(f.openSiege217.shares.west - .25) < 1e-9);
  for (let k = 0; k < total; k++) f.spawnZombie(k % 7 ? 'walker' : 'runner');
  const count = { east: 0, west: 0 }; for (const z of f.zombies) count[borderOf(z).side]++;
  assert.equal(count.east + count.west, total); assert.ok(Math.abs(count.east - q.east) <= 1 && Math.abs(count.west - q.west) <= 1, JSON.stringify({ count, q }));
  // Points de vie : ceux de la carte plate, pour le même profil, la même vague, la même difficulté.
  restoreFlat(); g.wave = 10; g.fronts = ['north'];
  for (const kind of ['walker', 'runner']) {
    g.spawnZombie(kind); const ref = g.zombies.pop(), z = f.zombies.find(z => z.kind === kind);
    assert.equal(z.maxHealth, ref.maxHealth); assert.equal(z.health, ref.health);
  }
  restoreFlat();
});

test('O7 : contrainte de passage d’une cité à un seul front, mesurée sur le directeur', () => {
  // Graine 714 : un seul côté non clos (nord, 32 m). Version à passage : même grille, côté réduit à une rampe de 12 m.
  const base = desc(714); assert.deepEqual(O.open(base.sides), ['north']);
  const north = base.sides.north, narrow = Object.freeze({ ...base, sides: Object.freeze({ ...base.sides, north: Object.freeze({ ...north, status: 'passage', width: 12, passages: Object.freeze([Object.freeze({ kind: 'col', x: 96, y: 4, width: 12, low: 0, high: 1, col: null, cut: false })]) }) }) });
  const spawnsIn = (d, seconds) => {
    terrainGame(714, d); g.wave = 30; g.phase = 'warning'; g.prepareWave(); g.phase = 'assault'; g.startAssault();
    const before = g.nextId; let n = 0;
    for (let k = 0; k < seconds * 30; k++) { const z = g.zombies.length; g.updateDirector(1 / 30); n += g.zombies.length - z; }
    return { n, gap: g.spawnGap217(), interval: g.wavePlan.spawnInterval, fronts: g.fronts.slice(), text: g.siegeReadout?.fronts?.() || null, before };
  };
  const wide = spawnsIn(base, 10), tight = spawnsIn(narrow, 10);
  assert.deepEqual(wide.fronts, ['north']); assert.deepEqual(tight.fronts, ['north']);
  // Plafond de passage pour toute cité à un seul côté (décision du 22 novembre 2026) : 32 m ne laisse plus passer
  // 8 infectés par seconde, mais au plus `passRate.max` ; la rampe de 12 m, au plus min(3, `passRate.max`).
  const max = R.passRate.max, ramp = Math.min(3, max);
  assert.equal(wide.gap, Math.max(wide.interval, 1 / Math.min(8, max)), '32 m : plafond absolu');
  assert.equal(tight.gap, Math.max(tight.interval, 1 / ramp), 'rampe de 12 m');
  assert.ok(tight.n <= Math.ceil(10 * ramp) + 1 && tight.n >= Math.floor(9.8 * ramp) - 1, tight.n + ' arrivées en 10 s');
  assert.ok(wide.n <= Math.ceil(10 * Math.min(8, max)) + 1, wide.n + ' arrivées en 10 s sur 32 m');
  // Le reste attend au pied : la file n'est pas perdue.
  assert.equal(g.spawnQueue.length + C.spawnCount(g.pendingSpawns) + g.zombies.length, g.wavePlan.total);
  restoreFlat();
});

test('O7 : enceinte adossée à la falaise reconnue par tous les lecteurs ; brèche sans effet sur la falaise', () => {
  const { world: w, core } = cleared(terrainGame(17117)), r = ring(w, 40);
  assert.ok(r.cells.length > 20 && r.cells.length < r.all.length / 2, r.cells.length + ' murs sur ' + r.all.length + ' cases d’anneau');
  for (const i of r.cells) { assert.equal(w.placement(w.definition('woodWall'), i % N, Math.floor(i / N)).valid, true); wallAt(w, 'woodWall', i % N, Math.floor(i / N)); }
  g.flow.rebuild(w, core);
  const grid = T.terrainGrid217(w); assert.equal(grid.tiles, 192);
  const status = T.analyzeEnclosure({ buildings: w.buildings.values(), target: core, grid });
  assert.equal(status.enclosed, true, 'falaises au nord et au sud, murs à l’est et à l’ouest');
  assert.equal(g.getEnclosureStatus().enclosed, true);
  assert.equal(Districts.survey(C, T, w.buildings.values(), grid).rings.length, 1);
  assert.equal(Fallback.innerZone(C, T, w.buildings.values(), grid).closed, true);
  assert.equal(Linecare.traceAccess(w.buildings.values(), core, 192, 192, grid).reachable, false);
  // Les mêmes murs sans la grille d'arêtes : la carte plate de 128 cases ne sait pas lire 192 (refus explicite).
  assert.throws(() => T.analyzeEnclosure({ buildings: w.buildings.values(), target: core, width: 192, height: 192 }), /Grille tactique invalide/);
  // Brèche : un pan fragile de l'est cède d'un coup ; la falaise ne cède jamais et reste une arête fermée.
  const before = Buffer.from(w.terrain217.levels).toString('base64') + Buffer.from(w.terrain217.passes).toString('base64');
  const cliffs = []; for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (w.terrain217.levels[y * N + x] !== w.terrain217.levels[(y + 1) * N + x] && !(w.terrain217.passes[y * N + x] & 2)) cliffs.push([x, y]);
  assert.ok(cliffs.length > 100);
  assert.ok(g.breach217?.active(), 'brèche active pour une campagne neuve');
  const east = [...w.buildings.values()].filter(b => b.type === 'woodWall' && b.gx > N / 2).sort((a, b) => a.gy - b.gy || a.gx - b.gx);
  const column = east.filter(b => b.gx === east[Math.floor(east.length / 2)].gx);
  for (const b of column) b.health = b.maxHealth * .1;
  g.breach217.tick(); g.elapsed += 1; g.breach217.tick();
  const pans = g.breach217.threatened(); assert.ok(pans.length >= 1, 'pan relevé');
  const destroyed = [], kept = Object.getOwnPropertyDescriptor(g, 'destroyBuilding'), destroy = g.destroyBuilding;
  g.destroyBuilding = function (b, ...rest) { destroyed.push(b); return destroy.call(this, b, ...rest); };
  try { g.destroyBuilding(column[Math.floor(column.length / 2)]); } finally { if (kept) Object.defineProperty(g, 'destroyBuilding', kept); else delete g.destroyBuilding; }
  assert.ok(column.filter(b => b.dead).length > 1, 'rupture du pan');
  assert.ok(column.filter(b => b.dead).length <= C.Breach217Rules.maxCollapse);
  assert.ok(destroyed.length > 1 && destroyed.every(b => b.type === 'woodWall'), 'seuls des ouvrages tombent');
  assert.equal(Buffer.from(w.terrain217.levels).toString('base64') + Buffer.from(w.terrain217.passes).toString('base64'), before, 'terrain intact');
  assert.ok(cliffs.every(([x, y]) => !w.canStep(x, y, x, y + 1)), 'toutes les arêtes de falaise restent fermées');
  assert.equal(T.analyzeEnclosure({ buildings: w.buildings.values(), target: core, grid }).enclosed, false, 'la brèche ouvre l’enceinte');
  // L'obstacle d'eau profonde du terrain n'est jamais un ouvrage pour la brèche.
  const { world: w46 } = terrainGame(46); let block = null;
  for (let i = 0; i < N * N && !block; i++) if (w46.terrain217.deep[i]) block = w46.solidForFriendly((i % N + .5) * TILE, (Math.floor(i / N) + .5) * TILE);
  assert.equal(block?.type, 'terrain217');
  assert.deepEqual(Breach.survey([block, block, block, block, block], null), []);
  restoreFlat();
});

test('O7 : rampe barrée = porte ; ouverte, le front l’est aussi ; fossé refusé sur une rampe', () => {
  // Graines dont un côté n'entre que par une rampe : un anneau qui coupe la rampe la barre de murs (mur posé sur ses cases).
  let done = null;
  for (const s of [12, 14, 16, 24, 48, 62]) {
    const d = desc(s), { world: w, core } = cleared(terrainGame(s, d));
    for (let r = 14; r <= 70 && !done; r++) {
      const ringed = ring(w, r), ramp = ringed.cells.filter(i => w.terrain217.kinds[i] === 2);
      if (ramp.length < 12 || ringed.cells.some(i => !w.placement(w.definition('woodWall'), i % N, Math.floor(i / N)).valid)) continue;
      // Porte de deux cases sur la rampe, murs ailleurs.
      const row = ramp.filter(i => Math.floor(i / N) === Math.floor(ramp[5] / N)).sort((a, b) => a - b);
      const gateAt = row.length >= 6 ? row[4] : null;
      if (gateAt === null || !row.includes(gateAt + 1) || !w.placement(w.definition('gate'), gateAt % N, Math.floor(gateAt / N)).valid) continue;
      for (const i of ringed.cells) if (i !== gateAt && i !== gateAt + 1) wallAt(w, 'woodWall', i % N, Math.floor(i / N));
      const gate = wallAt(w, 'gate', gateAt % N, Math.floor(gateAt / N)); gate.gateMode = 'closed';
      const grid = T.terrainGrid217(w);
      const shut = T.analyzeEnclosure({ buildings: w.buildings.values(), target: core, grid });
      gate.gateMode = 'open';
      const opened = T.analyzeEnclosure({ buildings: w.buildings.values(), target: core, grid });
      done = { s, r, ramp: ramp.length, shut, opened };
    }
    if (done) {
      assert.equal(done.shut.enclosed, true, 'rampe barrée : enceinte fermée');
      assert.equal(done.shut.gates, 1); assert.equal(done.opened.openGates, 1);
      assert.equal(done.opened.enclosed, false, 'porte ouverte sur la rampe : front ouvert');
      // Fossé : refusé sur une case de rampe, accepté à côté sur le plat (même terrain qu'un mur d'une case).
      const E = g.earthworks217; assert.ok(E?.active(), 'travaux de terrain actifs');
      let rampCell = -1, flatCell = -1;
      for (let y = 96 - 40; y < 96 + 40; y++) for (let x = 96 - 40; x < 96 + 40; x++) {
        const i = y * N + x, k = w.terrain217.kinds[i]; if (w.buildingAt?.(x, y)) continue;
        if (k === 2 && rampCell < 0 && w.placement(w.definition('woodWall'), x, y).valid) rampCell = i;
        if (k === 0 && flatCell < 0 && Math.abs(x - 96) > 6 && w.placement(w.definition('woodWall'), x, y).valid && !w.occupancy[i]) flatCell = i;
      }
      if (rampCell >= 0) { const q = E.quote(rampCell % N, Math.floor(rampCell / N)); assert.equal(q.ok, false); assert.match(q.reason, /rampe/); }
      const q2 = E.quote(flatCell % N, Math.floor(flatCell / N)); assert.doesNotMatch(q2.reason || '', /rampe/);
      break;
    }
  }
  assert.ok(done, 'une graine à rampe barrable');
  restoreFlat();
});

test('O7 : masse lointaine, annonce et lecture de siège sur les seuls côtés ouverts — vague 5 sur 17117', () => {
  const { world: w } = terrainGame(17117);
  g.wave = 5; g.phase = 'calm'; g.phaseTime = .01; const notes = [], notify = g.notify;
  g.notify = function (text, ...rest) { notes.push(String(text)); return notify.call(this, text, ...rest); };
  try { for (let k = 0; k < 3; k++) g.update(1 / 30); } finally { g.notify = notify; }
  assert.equal(g.phase, 'warning');
  assert.deepEqual([...g.fronts].sort(), ['east', 'west'], 'deux fronts, est et ouest');
  assert.ok(notes.some(t => /Migration détectée — \d+ contacts estimés, par l’est et l’ouest\./.test(t)), notes.join(' | '));
  const sentence = Readout.frontsSentence(C, g); assert.match(sentence, /^Vague 5 par l’est \(96 m\) et l’ouest \(32 m\)\.$/);
  // La masse : jamais au nord ni au sud, même si l'on force un front clos dans la liste.
  g.fronts = ['north', 'east', 'south', 'west'];
  const h = Horizon.horizon(g); assert.deepEqual([...h.fronts], ['east', 'west']);
  const list = Horizon.silhouettes(g, { state: h });
  assert.ok(list.length > 50); const e = w.terrain217.sides;
  for (const s of list) { const t = Math.floor(s.y / TILE); assert.ok(['east', 'west'].includes(s.front) && e[s.front].entries.some(x => t >= x.from - 1 && t <= x.to + 1), JSON.stringify([s.front, t])); }
  g.phase = 'calm'; assert.match(Readout.frontsSentence(C, g), /^Côtés à tenir : l’est \(96 m\) et l’ouest \(32 m\) ; clos : nord \(falaise\) et sud \(falaise\)\.$/);
  // Assaut : les arrivées entrent par l'est et l'ouest, dans les tronçons joints au centre.
  g.phase = 'warning'; g.prepareWave(); g.startAssault();
  for (let k = 0; k < 30 * 20; k++) g.updateDirector(1 / 30);
  assert.ok(g.zombies.length > 20);
  let entered = 0; for (const z of g.zombies) { const b = borderOf(z); if (b) { entered++; assert.ok(['east', 'west'].includes(b.side) && inEntries(e[b.side], b.t)); } }
  assert.ok(entered > 0, 'arrivées encore au bord');
  // Ligne de lecture : créée sur le terrain, dans la carte de signature.
  g.siegeReadout?.render?.(); const node = document.getElementById?.('siegeReadoutFronts');
  if (g.siegeReadout) { assert.ok(node && !node.hidden); assert.match(node.textContent, /par l’est \(96 m\) et l’ouest \(32 m\)/); }
  restoreFlat();
});

test('O7 : mesures d’équilibrage consignées (12 graines) dans le suivi de la tranche', () => {
  const tasks = fs.readFileSync(path.join(__dirname, '../specs/monde-sans-bord/tasks.md'), 'utf8');
  const section = tasks.slice(tasks.indexOf('## O7'));
  assert.ok(tasks.includes('## O7') && /mesures/i.test(section) && /à un passage/.test(section), 'section O7 et mesures');
  assert.ok(fs.existsSync(path.join(__dirname, '../scripts/measure-open-siege217.cjs')), 'script de mesure');
});
