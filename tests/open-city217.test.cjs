'use strict';
// Monde sans bord, tranche O6b (specs/monde-sans-bord/ouverture.md) : arêtes de falaise dans la cité de 192 m —
// projectiles (D-O1), contrôles directs des ouvriers, voirie, repli d'un infecté hors d'atteinte, décor métrique,
// récolte par les rampes. Toujours hors jeu : la partie de terrain est construite par ce harnais (la génération 12
// reste refusée) ; une carte plate ne prend aucun de ces chemins.
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, D = globalThis.DeadwallInfrastructure, E = require('../src/exploration-125.js'), Lw = require('../src/world-local217.js');
const World = g.world.constructor, Flow = g.flow.constructor, Game = g.constructor, MAP = C.localMap217(192), N = 192, T = C.TILE, FAR = 0x3fffffff;
const Building = [...g.world.buildings.values()].find(b => b.type === 'core').constructor;
const Zombie = (() => { g.fronts = ['north']; g.spawnZombie('walker'); return g.zombies.pop().constructor; })();
const walker = p => new Zombie(g.nextId++, 'walker', p.x, p.y, g.difficulty, 1, MAP);
// 17117 : couloir est-ouest, poches fermées ; 42 : rampes ; 46 : rampes et eau profonde.
const SEEDS = [17117, 42, 46];
const descs = new Map(), desc = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const build = s => new World(s, 0, MAP, desc(s));
const centre = { x: MAP.size / 2, y: MAP.size / 2 };
const cellOf = e => [Math.floor(e.x / T), Math.floor(e.y / T)];
const at = (i, k = .5) => ({ x: (i % N + k) * T, y: (Math.floor(i / N) + k) * T });
const deep = (d, i) => d.water[i] === 1 || d.water[i] === 2 || (d.water[i] === 3 && !d.roads[i]);
// Arêtes de falaise (changement de palier sans rampe), sur les deux axes : `i` bas, `j` haut.
function cliffs(d) {
  const out = [];
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) for (const [dx, dy, bit] of [[1, 0, 1], [0, 1, 2]]) {
    const i = y * N + x, j = (y + dy) * N + x + dx;
    if (d.levels[i] === d.levels[j] || deep(d, i) || deep(d, j) || d.passes[i] & bit) continue;
    out.push(d.levels[i] < d.levels[j] ? { i, j, dx, dy } : { i: j, j: i, dx: -dx, dy: -dy });
  }
  return out;
}
// Partie de terrain : la partie du harnais reçoit le monde de génération 12, un centre au milieu, son champ de flux.
// Les modules qui ne savent pas encore lire ce monde (quartiers, chantiers) ne sont pas appelés : on joue les
// méthodes du jeu (unités, infectés, projectiles) comme le fait `update`.
function play(seed) {
  g.startNew('standard', String(seed)); g.campaignIntro132?.skip?.();
  const w = build(seed); g.world = w;
  const core = new Building(g.nextId++, 'core', N / 2 - 2, N / 2 - 2, 0, 1, w.cityGeometry202); core.health = core.maxHealth; w.add(core);
  g.flow.rebuild(w, core); g.zombies = []; g.projectiles = []; g.buckets.clear();
  return { w, d: desc(seed), core };
}
const reset = () => { g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); };
function frames(n, step) { for (let f = 0; f < n; f++) { g.navigationBudget = C.STRATEGY_RULES.pathQueriesPerUpdate; step(f); g.elapsed += 1 / 30; } }

test('O6b : règles gelées, et une carte plate ne prend aucun chemin du terrain (parcours empoisonné)', () => {
  const R = C.OpenCity217Rules; assert.ok(Object.isFrozen(R));
  assert.deepEqual({ ...R }, { version: 1, generation: 12, fallbackRing: 192, pathMaxExpanded: 16384 });
  assert.equal(C.WorldSave217Rules.open, false, 'la génération 12 reste fermée');
  // Accesseurs neutres sur une carte plate.
  const flat = new World(17117, 0, MAP);
  assert.equal(flat.footprintClear217(-50, -50, 1e6, 1e6), true);
  const f = new Flow(); f.rebuild(flat, centre); assert.equal(f.fallback217(10, 10, 192), null);
  // Voirie : sans prédicat d'arête, `findRoute` rend le même chemin ; avec, il contourne l'arête fermée.
  const free = () => false, a = { x: 1, y: 3 }, b = { x: 9, y: 3 };
  assert.deepEqual(D.findRoute(a, b, free, () => 1, 12, 12, 4096, 1, 12), D.findRoute(a, b, free, () => 1, 12, 12, 4096, 1, 12, null));
  const wall = (x, y, nx) => !((x === 4 && nx === 5) || (x === 5 && nx === 4)) || y === 9;
  const around = D.findRoute(a, b, free, () => 1, 12, 12, 4096, 1, 12, wall); let prev = a;
  for (const p of around) { assert.ok(wall(prev.x, prev.y, p.x, p.y)); prev = p; }
  assert.ok(around.some(p => p.y === 9));
  // Parcours de 20 s avec vague, tirs, ouvriers et infectés : chaque chemin du terrain jette s'il est appelé.
  reset();
  const poison = [[World.prototype, ['canStep', 'walk217', 'stepClear217', 'sightObstruction217', 'footprintClear217', 'terrainAt217']], [Flow.prototype, ['fallback217', 'rebuildTerrain217']], [Game.prototype, ['zombieFallback217']]];
  const kept = poison.map(([o, names]) => names.map(n => o[n]));
  for (const [o, names] of poison) for (const n of names) o[n] = function () { throw new Error(n + ' appelé sur une carte plate'); };
  try {
    g.phaseTime = 1;
    for (let k = 0; k < 600; k++) { if (k % 10 === 0) { const z = g.zombies.find(z => !z.dead); if (z) g.player.facing = Math.atan2(z.y - g.player.y, z.x - g.player.x); g.shootPlayer(); } g.update(1 / 30); }
    assert.ok(g.stats.shots > 0 && g.zombies.length > 0, 'tirs et infectés dans le parcours');
  } finally { poison.forEach(([o, names], k) => names.forEach((n, m) => { o[n] = kept[k][m]; })); }
  assert.ok(g.projectiles.every(p => !Object.hasOwn(p, 'level217')) && g.zombies.every(z => !Object.hasOwn(z, 'fallback217')), 'aucun champ de plus');
  assert.equal(g.world.terrain217, null);
  reset();
});

test('O6b : 10 000 pas aléatoires d’amis et d’infectés sans traverser une falaise, sur trois graines', () => {
  let ramps = 0;
  for (const s of SEEDS) {
    const { w, d } = play(s), dry = [];
    for (let i = 0; i < N * N; i += 7) if (d.cost[i] >= 0 && !d.water[i] && !w.atCell(i % N, Math.floor(i / N))) dry.push(i);
    // Départs au bord d'une rampe (arête franchissable entre deux paliers) un bloc sur deux : la marche y passe d'un palier à l'autre.
    const ramps217 = []; for (let i = 0; i < N * N - N - 1; i++) if (d.cost[i] >= 0 && ((d.passes[i] & 1 && d.levels[i] !== d.levels[i + 1]) || (d.passes[i] & 2 && d.levels[i] !== d.levels[i + N]))) ramps217.push(i);
    const starts = k => (k / 500) % 2 && ramps217.length ? ramps217 : dry;
    for (const kind of ['ami', 'infecté']) {
      let e = null, cell = null, moved = 0;
      for (let k = 0; k < 10000; k++) {
        if (k % 500 === 0) { const list = starts(k); e = { ...at(list[Math.floor(C.seededHash(k, s, kind.length) * list.length)]), radius: 6 }; cell = cellOf(e); }
        const dx = (C.seededHash(k, s, 11) - .5) * 24, dy = (C.seededHash(k, s, 12) - .5) * 24, ox = e.x, oy = e.y;
        if (kind === 'ami') g.moveFriendly(e, dx, dy);
        else { const nx = Math.min(MAP.size - 8, Math.max(8, e.x + dx)), ny = Math.min(MAP.size - 8, Math.max(8, e.y + dy)); if (g.hostilePositionClear(e, nx, ny)) { e.x = nx; e.y = ny; } }
        const next = cellOf(e);
        assert.ok(w.canStep(cell[0], cell[1], next[0], next[1]), `${s} ${kind} : pas ${k} à travers une falaise`);
        if (w.terrainAt217(ox, oy).level !== w.terrainAt217(e.x, e.y).level) ramps++;
        if (e.x !== ox || e.y !== oy) moved++; cell = next;
      }
      assert.ok(moved > 5000, `${s} ${kind} : les pas avancent`);
    }
    // Horde réelle (`updateZombies`) : 40 infectés posés à portée marchent 10 s vers le centre.
    const pool = Array.from({ length: 40 }, (_, k) => walker(at(dry[(k * 211) % dry.length]))); g.zombies = pool;
    const cells = new Map(pool.map(z => [z.id, cellOf(z)]));
    frames(300, () => { g.rebuildBuckets(); g.updateZombies(1 / 30); for (const z of pool) { if (z.dead) continue; const c = cells.get(z.id), n = cellOf(z); assert.ok(w.canStep(c[0], c[1], n[0], n[1]), s + ' : horde à travers une falaise'); cells.set(z.id, n); } });
  }
  console.log('# marches aléatoires : ' + ramps + ' pas d’un palier à l’autre, tous par une rampe');
  assert.ok(ramps > 0, 'des pas passent d’un palier à l’autre par une rampe');
  reset();
});

test('O6b : champ de flux contre `pathToCentre` de la carte locale', () => {
  for (const s of SEEDS) {
    const d = desc(s), w = build(s), f = new Flow(); f.rebuild(w, centre);
    const ramp = C.CityTerrain217Rules.rampCost;
    for (let i = 0; i < N * N; i++) {
      assert.equal(f.values[i] === FAR, d.cost[i] < 0);
      // Sur la carte nue : 20 par case (pas et coût de case) contre 10 ; la rampe compte 30 dans le champ, 40 + 40 dans la carte.
      if (d.cost[i] >= 0) { const gap = 2 * d.cost[i] - f.values[i]; assert.ok(gap >= 0 && gap % ramp === 0 && gap <= 8 * ramp, s + ' écart ' + gap); }
    }
    let paths = 0;
    for (let k = 0; k < 300; k++) {
      const x = Math.floor(C.seededHash(k, s, 5) * N), y = Math.floor(C.seededHash(k, s, 6) * N), p = Lw.pathToCentre(d, x, y);
      if (!p) { assert.equal(f.values[y * N + x], FAR); continue; }
      paths++; let crossings = 0;
      for (let j = 1; j < p.length; j++) {
        const a = p[j - 1], b = p[j];
        assert.ok(w.canStep(a % N, Math.floor(a / N), b % N, Math.floor(b / N)), 'pas permis');
        assert.ok(f.values[b] < f.values[a], 'le champ descend le long du chemin de la carte locale');
        if (d.levels[a] !== d.levels[b]) crossings++;
      }
      if (!crossings) assert.equal(f.values[p[0]], 2 * d.cost[p[0]], 'même coût sans rampe');
      assert.equal(p.at(-1), (N / 2) * N + N / 2);
    }
    assert.ok(paths > 50, s + ' : chemins comparés');
  }
});

test('O6b : D-O1 dans les projectiles — la falaise arrête le tir d’en bas, pas celui d’en haut', () => {
  for (const s of [17117, 42]) {
    const { w, d } = play(s);
    // Arête de falaise dont les deux côtés sont à sec et libres sur quatre cases.
    const e = cliffs(d).find(c => [-4, -3, -2, -1].every(k => { const i = c.i + k * (c.dx + c.dy * N); return d.levels[i] === d.levels[c.i] && !d.water[i]; }) && [0, 1, 2, 3].every(k => { const j = c.j + k * (c.dx + c.dy * N); return d.levels[j] === d.levels[c.j] && !d.water[j]; }));
    assert.ok(e, s + ' : falaise sèche');
    const step = e.dx + e.dy * N, low = at(e.i - 3 * step), high = at(e.j + 2 * step), angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
    assert.ok(w.terrainAt217(low.x, low.y).level < w.terrainAt217(high.x, high.y).level);
    const shoot = (from, to) => {
      const pool = Object.assign(walker(to), { health: 1e6, maxHealth: 1e6 }); g.zombies = [pool]; g.projectiles = [];
      g.fireFriendly(from.x, from.y, angle(from, to), 10, 900, '#fff');
      const shot = g.projectiles[0];
      for (let k = 0; k < 20 && g.projectiles.length; k++) { g.rebuildBuckets(); g.updateProjectiles(1 / 30); }
      return { hit: pool.health < 1e6, shot };
    };
    const up = shoot(low, high), down = shoot(high, low);
    assert.equal(up.hit, false, s + ' : d’en bas on ne touche pas le haut');
    assert.equal(up.shot.dead, true);
    assert.equal(w.terrainAt217(up.shot.x, up.shot.y).level, d.levels[e.i], 'le tir s’arrête au pied de la falaise');
    assert.equal(up.shot.level217, d.levels[e.i], 'palier du tireur capté au tir');
    assert.equal(down.hit, true, s + ' : d’en haut on touche en contrebas');
    // Bouche passée au-dessus de l'arête : le tir part du tireur, au pied de la falaise.
    const foot = at(e.i), close = { x: foot.x + e.dx * T * .35, y: foot.y + e.dy * T * .35 };
    const origin = g.projectileOrigin(close.x, close.y, angle(low, high), 22, 2);
    assert.deepEqual(origin, { x: close.x, y: close.y });
  }
  reset();
});

test('O6b : contrôles directs des ouvriers — ni travail, ni sortie, ni nettoyage par-dessus une falaise', () => {
  const { w, d } = play(42), e = cliffs(d).find(c => !d.water[c.i] && !d.water[c.j] && !d.water[c.i - (c.dx + c.dy * N)] && !d.water[c.j + c.dx + c.dy * N] && d.levels[c.i - (c.dx + c.dy * N)] === d.levels[c.i]);
  const step = e.dx + e.dy * N, unit = { ...at(e.i), radius: 6 }, above = at(e.j), below = at(e.i - step);
  assert.ok(Math.hypot(above.x - unit.x, above.y - unit.y) < 62);
  assert.equal(g.workerCanWorkAt(unit, above, 62), false, 'un gisement au-dessus de la falaise ne se récolte pas d’en bas');
  assert.equal(g.workerCanWorkAt(unit, below, 62), true, 'le même palier reste ouvert');
  // Sortie d'un chantier : jamais vers l'autre palier.
  const site = { left: unit.x - 8, right: unit.x + 8, top: unit.y - 8, bottom: unit.y + 8, id: 999 };
  for (let k = 0; k < 8; k++) {
    const exit = g.workerBuildExit(unit, site); if (!exit) break;
    assert.ok(w.stepClear217(unit.x, unit.y, exit.x, exit.y));
    (unit.blockedJobs ??= new Map()).set(exit.key, { version: w.navigationVersion, until: Infinity });
  }
  // Nettoyage : un mur dont la face extérieure tombe de l'autre côté d'une falaise n'est pas proposé.
  const gx = e.i % N, gy = Math.floor(e.i / N), wall = new Building(g.nextId++, 'woodWall', gx, gy, 0, 1, w.cityGeometry202);
  wall.corpseLoad = 5; w.add(wall);
  const point = g.workerCleanupPoint(unit, wall), ok = w.stepClear217(wall.x, wall.y, point.x, point.y);
  const target = g.workerCleanupTarget({ ...unit, x: wall.x + 40, y: wall.y + 40 });
  assert.equal(target === wall, ok && g.friendlyPositionClear(unit, point.x, point.y));
  reset();
});

test('O6b : voirie — `findRoute` et le chemin des véhicules lisent les arêtes du terrain', () => {
  const { w, d } = play(42), step = (x, y, nx, ny) => w.canStep(x, y, nx, ny), free = () => false;
  const e = cliffs(d).find(c => d.cost[c.i] >= 0 && d.cost[c.j] >= 0 && Math.abs(c.i % N - N / 2) < 60 && Math.abs(Math.floor(c.i / N) - N / 2) < 60);
  const a = { x: e.i % N, y: Math.floor(e.i / N) }, b = { x: e.j % N, y: Math.floor(e.j / N) };
  const naive = D.findRoute(a, b, free, () => 1, N, N, 16384, 1, N);
  assert.equal(naive.length, 1, 'sans arête, la voirie franchit la falaise');
  const route = D.findRoute(a, b, free, () => 1, N, N, 16384, 1, N, step);
  assert.ok(route && route.length > 3, 'avec arête, elle passe par une rampe');
  let prev = a; for (const p of route) { assert.ok(step(prev.x, prev.y, p.x, p.y)); prev = p; }
  // Chemin de la voirie de la partie (véhicules, reconnaissance) : prédicat du terrain par défaut.
  const path = g.infrastructure.findPath(a, b, free, N, N, 16384, 'truck');
  assert.ok(path && path.length > 3); prev = a; for (const p of path) { assert.ok(step(prev.x, prev.y, p.x, p.y)); prev = p; }
  reset();
});

test('O6b : repli d’un infecté posé sur une case hors d’atteinte du champ de flux', () => {
  const { w, d } = play(17117), f = g.flow;
  let pocket = -1; for (let i = 0; i < N * N; i++) if (d.cost[i] < 0 && !d.water[i] && i % N > 20 && i % N < N - 20) { pocket = i; break; }
  assert.ok(pocket >= 0 && f.values[pocket] === FAR);
  const p = at(pocket), spot = f.fallback217(p.x, p.y, C.OpenCity217Rules.fallbackRing);
  assert.ok(spot && f.values[spot.gy * N + spot.gx] < FAR, 'case atteinte');
  assert.deepEqual(f.fallback217(p.x, p.y, C.OpenCity217Rules.fallbackRing), spot, 'sans tirage : même case');
  // La case choisie est la plus proche des cases atteintes.
  let best = Infinity; for (let i = 0; i < N * N; i++) if (f.values[i] < FAR) best = Math.min(best, (at(i).x - p.x) ** 2 + (at(i).y - p.y) ** 2);
  assert.equal((spot.x - p.x) ** 2 + (spot.y - p.y) ** 2, best);
  assert.equal(f.fallback217(spot.x, spot.y, 192), null, 'une case atteinte ne se replie pas');
  // Dans la horde : l'infecté se replie une fois, puis marche sans franchir de falaise.
  const z = walker(p); g.zombies = [z];
  g.rebuildBuckets(); g.updateZombies(1 / 30);
  assert.equal(z.fallback217, 1); let cell = cellOf(z); assert.ok(f.values[cell[1] * N + cell[0]] < FAR);
  const start = f.values[cell[1] * N + cell[0]];
  frames(300, () => { g.rebuildBuckets(); g.updateZombies(1 / 30); const n = cellOf(z); assert.ok(w.canStep(cell[0], cell[1], n[0], n[1])); cell = n; });
  assert.equal(z.fallback217, 1, 'un seul repli');
  assert.ok(f.values[cell[1] * N + cell[0]] < start, 'il avance vers le centre');
  reset();
});

test('O6b : décor métrique replacé hors falaise, eau et rampe', () => {
  const plan = s => ({ layoutRevision: 4, seed: s, worldSize: MAP.size, roads: [], settlements: [], buildExclusions: [], buildableDistricts202: [], solids: [], stations: [] });
  for (const s of [42, 46]) {
    const d = desc(s), w = build(s), e = cliffs(d)[Math.floor(cliffs(d).length / 2)], c = at(e.j, 0);
    const piece = Object.assign(new (w.nodes[0].constructor)(9001, 'scrap', c.x, c.y, 40, 20, 0), { sceneryKind: 'carWreck', renderSize: 96 });
    w.nodes.push(piece);
    const b = () => ({ x: piece.x - 48, y: piece.y - 48, w: 96, h: 96 });
    assert.equal(w.footprintClear217(b().x, b().y, 96, 96), false, 'posé à cheval sur la falaise');
    E.packMetricScenery202({ world: w }, plan(s));
    assert.ok(w.footprintClear217(b().x, b().y, 96, 96), s + ' : replacé sur un seul palier, à sec, hors rampe');
    // Les cases couvertes le disent elles-mêmes.
    const cells = []; for (let y = Math.floor(b().y / T); y < Math.ceil((b().y + 96) / T); y++) for (let x = Math.floor(b().x / T); x < Math.ceil((b().x + 96) / T); x++) cells.push(y * N + x);
    assert.equal(new Set(cells.map(i => d.levels[i])).size, 1); assert.ok(cells.every(i => !d.water[i] && d.kinds[i] !== Lw.KIND.ramp));
    // Carte plate : la même pièce à la même place ne bouge pas.
    const flat = new World(s, 0, MAP), same = Object.assign(new (w.nodes[0].constructor)(9001, 'scrap', c.x, c.y, 40, 20, 0), { sceneryKind: 'carWreck', renderSize: 96 });
    flat.nodes = [same]; E.packMetricScenery202({ world: flat }, plan(s)); assert.deepEqual([same.x, same.y], [c.x, c.y]);
  }
});

test('O6b : parcours d’ouvriers — poser un mur, récolter un gisement sur l’autre palier par la rampe', () => {
  for (const s of [42, 46]) {
    const { w, core } = play(s), lvl = p => w.terrainAt217(p.x, p.y).level, home = lvl(core);
    // Mur : refusé à cheval sur deux paliers, admis sur le palier ; les ouvriers le bâtissent.
    const tower = w.definition('watchtower'), d = desc(s), e = cliffs(d).find(c => w.placement(tower, c.i % N, Math.floor(c.i / N) - 1).valid === false && /paliers/.test(w.placement(tower, c.i % N, Math.floor(c.i / N) - 1).reason));
    assert.ok(e, s + ' : chantier à cheval refusé');
    const wallAt = [core.gx - 3, core.gy + 7]; assert.equal(w.placement(w.definition('woodWall'), ...wallAt).valid, true);
    const wall = new Building(g.nextId++, 'woodWall', ...wallAt, 0, 0, w.cityGeometry202); w.add(wall); g.flow.rebuild(w, core);
    g.workerOrder = 'build'; for (const u of g.units) Object.assign(u, { x: core.x, y: core.bottom + 40, navigation: null, state: 'idle', think: 0 });
    // Mise en service par la méthode du jeu ; les quartiers et chantiers des modules ne lisent pas encore ce monde.
    // (bilan de la cité laissé de côté pendant ce parcours).
    const own = ['completeBuilding', 'refreshMetrics'].map(k => [k, Object.getOwnPropertyDescriptor(g, k)]);
    g.completeBuilding = Game.prototype.completeBuilding.bind(g); g.refreshMetrics = () => {};
    try { frames(30 * 90, () => { if (!wall.completed) g.updateUnits(1 / 30); }); } finally { for (const [k, o] of own) { if (o) Object.defineProperty(g, k, o); else delete g[k]; } }
    assert.ok(wall.completed, s + ' : mur bâti');
    // Gisement le plus proche sur l'autre palier ; les autres sont épuisés pour ce parcours.
    const node = w.nodes.filter(n => !n.depleted && lvl(n) !== home).sort((a, b) => Math.hypot(a.x - core.x, a.y - core.y) - Math.hypot(b.x - core.x, b.y - core.y))[0];
    for (const n of w.nodes) if (n !== node) n.depleted = true;
    const u = g.units[0]; g.units = [u]; Object.assign(u, { x: core.x, y: core.bottom + 40, navigation: null, state: 'idle', think: 0, carry: 0, carryType: null });
    g.workerOrder = 'harvest'; const before = g.depositedResources, amount = node.amount;
    let cell = cellOf(u), crossings = 0;
    frames(30 * 400, () => {
      if (g.depositedResources > before + 5) return;
      const was = lvl(u); g.updateUnits(1 / 30); const next = cellOf(u);
      assert.ok(w.canStep(cell[0], cell[1], next[0], next[1]), s + ' : ouvrier à travers une falaise'); cell = next;
      if (lvl(u) !== was) crossings++;
    });
    assert.ok(g.depositedResources > before + 5, s + ' : matériaux déposés au centre');
    assert.ok(node.amount < amount, s + ' : gisement entamé');
    assert.ok(crossings >= 2, s + ' : aller et retour par la rampe');
  }
  reset();
});

test('O6b : coût du champ de flux à 192 m (D-O5) — partie de terrain, centre compris', () => {
  const med = a => a.sort((x, y) => x - y)[a.length >> 1], out = [];
  for (const s of SEEDS) {
    const { w, core } = play(s), f = new Flow(), times = [];
    for (let i = 0; i < 18; i++) { w.flowDirty = true; const t0 = process.hrtime.bigint(); f.rebuild(w, core); times.push(Number(process.hrtime.bigint() - t0) / 1e6); }
    out.push(med(times.slice(3)));
  }
  reset(); const plain = new Flow(), base = [];
  for (let i = 0; i < 18; i++) { const t0 = process.hrtime.bigint(); plain.rebuild(g.world, g.core()); base.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  console.log(`# champ de flux (médiane de 15) : partie 17117 à 128 cases ${med(base.slice(3)).toFixed(1)} ms ; partie de terrain 192 ${out.map(v => v.toFixed(1)).join(' / ')} ms (${SEEDS.join(', ')})`);
  assert.ok(out.every(v => v < 250));
});
