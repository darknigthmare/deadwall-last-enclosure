'use strict';
// Monde sans bord, tranche O6a (specs/monde-sans-bord/ouverture.md) : carte de la cité de 192 m née de
// `world-local217` — terrain et gisements —, construite hors jeu par un harnais. La génération 12 reste
// refusée partout ; aucune partie G1–G11 ne prend ce chemin.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, Lw = require('../src/world-local217.js');
const World = g.world.constructor, Flow = g.flow.constructor, Game = g.constructor, MAP = C.localMap217(192), N = 192, T = C.TILE;
// 17117 : couloir est-ouest, falaises au nord et au sud ; 42 : rampes ; 46 : rampes et eau profonde.
const SEEDS = [17117, 42, 46];
const descs = new Map(), desc = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const build = s => new World(s, 0, MAP, desc(s));
const centre = { x: MAP.size / 2, y: MAP.size / 2 };
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const snap = () => { const d = g.serialize(); delete d.timestamp; return JSON.stringify(d); };
// Partie factice : méthodes du jeu appelées sur un monde de terrain, sans enveloppe ni partie.
const harness = world => Object.assign(Object.create(Game.prototype), { world });
const deep = (d, i) => d.water[i] === 1 || d.water[i] === 2 || (d.water[i] === 3 && !d.roads[i]);
// Arêtes est-ouest : falaise (changement de palier sans rampe) ou rampe (changement de palier par la rampe).
function edges(d, ramp) {
  const out = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N - 1; x++) {
    const i = y * N + x, j = i + 1;
    if (d.levels[i] === d.levels[j] || deep(d, i) || deep(d, j)) continue;
    if (Boolean(d.passes[i] & 1) === ramp) out.push({ x, y, i, j });
  }
  return out;
}
const sideCell = (side, t) => side === 'north' ? [t, 0] : side === 'south' ? [t, N - 1] : side === 'west' ? [0, t] : [N - 1, t];
const flatDesc = (tiles, seed) => { const n = tiles * tiles; return { generation: 12, frame: tiles, tile: 1, unit: T, seed, version: 0, digest: 'plat', levels: new Uint8Array(n).fill(1), passes: new Uint8Array(n), water: new Uint8Array(n), roads: new Uint8Array(n), kinds: new Uint8Array(n), deposits: [] }; };

test('O6a : chemin de construction séparé — terrain et gisements de la description, rien de la génération G1–G11', () => {
  const before = snap();
  // `generateNodes` n'est pas appelé ; le contenu généré (gelé, non espionnable) non plus : aucun lieu, aucune pièce de décor.
  const keep = World.prototype.generateNodes;
  World.prototype.generateNodes = () => { throw new Error('generateNodes appelé en G12'); };
  let worlds;
  try { worlds = SEEDS.map(build); } finally { World.prototype.generateNodes = keep; }
  assert.ok(Object.isFrozen(globalThis.DeadwallWorldContent));
  for (const [k, w] of worlds.entries()) {
    const d = desc(SEEDS[k]), t = w.terrain217;
    assert.equal(w.local, MAP); assert.equal(w.occupancy.length, 36864); assert.ok(Object.isFrozen(t));
    assert.equal(t.digest, d.digest); assert.deepEqual([...t.levels], [...d.levels]); assert.deepEqual([...t.passes], [...d.passes]);
    assert.notEqual(t.levels, d.levels, 'copie propre : la description reste à son module');
    // Gisements candidats posés tels quels (mètres → unités), identifiants gardés.
    assert.equal(w.nodes.length, d.deposits.length);
    for (const [n, dep] of d.deposits.entries()) {
      const node = w.nodes[n];
      assert.equal(node.depositId, dep.id); assert.equal(node.type, dep.type); assert.equal(node.x, dep.x * T); assert.equal(node.y, dep.y * T);
      assert.equal(node.amount, dep.amount); assert.equal(node.radius, dep.radius * T); assert.ok(node.variant >= 0 && node.variant < 4);
      const i = Math.floor(dep.y) * N + Math.floor(dep.x);
      assert.ok(d.cost[i] >= 0 && !d.water[i] && d.kinds[i] !== Lw.KIND.ramp, 'gisement à portée, à sec, hors rampe');
    }
    assert.deepEqual([...new Set(w.nodes.map(n => n.type))].sort(), ['scrap', 'stone', 'wood']);
    assert.deepEqual(w.sites, []);
    // Rien d'énuméré en plus d'une carte plate : enveloppes et terrain sont hors des propriétés.
    assert.deepEqual(Object.keys(w).sort(), Object.keys(new World(SEEDS[k], 0, MAP)).sort());
  }
  // Refus : autre graine, autre taille, autre génération, tableau tronqué.
  assert.throws(() => new World(42, 0, MAP, desc(17117)), /autre graine/);
  assert.throws(() => new World(17117, 0, C.LOCAL_MAP217, desc(17117)), /Terrain de la cité invalide/);
  assert.throws(() => new World(17117, 0, MAP, { ...desc(17117), generation: 11 }), /Terrain de la cité invalide/);
  assert.throws(() => new World(17117, 0, MAP, { ...desc(17117), levels: desc(17117).levels.subarray(1) }), /Terrain de la cité invalide/);
  // Toujours hors jeu : la partie n'a pas de terrain, la génération 12 n'est pas ouverte, le module n'est pas chargé.
  assert.equal(g.world.terrain217, null); assert.equal(C.WorldSave217Rules.open, false);
  // Surcoûts du terrain dans le jeu : gelés dans le cœur, égaux aux coûts de chemin de la carte locale.
  const R = C.CityTerrain217Rules; assert.ok(Object.isFrozen(R)); assert.equal(R.generation, 12);
  assert.deepEqual([R.rampCost, R.fordCost], [C.WorldLocal217Rules.costs.ramp, C.WorldLocal217Rules.costs.ford]);
  assert.doesNotMatch(read('index.html'), /world-local217\.js/);
  assert.equal(snap(), before, 'la partie en cours ne bouge pas');
});

test('O6a : déterminisme — même graine, même monde, même champ de flux', () => {
  const field = w => { const f = new Flow(); f.rebuild(w, centre); return f.values; };
  const a = build(17117), b = new World(17117, 0, MAP, Lw.describe(17117)), c = build(42);
  const nodes = w => JSON.stringify(w.nodes.map(n => [n.id, n.type, n.x, n.y, n.amount, n.radius, n.variant, n.depositId]));
  assert.equal(nodes(a), nodes(b)); assert.notEqual(nodes(a), nodes(c));
  assert.equal(hash(Buffer.from(field(a).buffer)), hash(Buffer.from(field(b).buffer)));
  assert.notEqual(hash(Buffer.from(field(a).buffer)), hash(Buffer.from(field(c).buffer)));
});

test('O6a : falaise infranchissable — arêtes, déplacements, champ de flux et chemins', () => {
  for (const s of SEEDS) {
    const d = desc(s), w = build(s), h = harness(w), cliffs = edges(d, false);
    assert.ok(cliffs.length > 50, s + ' : des arêtes de falaise');
    const f = new Flow(); f.rebuild(w, centre);
    for (const e of cliffs.filter((_, k) => k % 7 === 0)) {
      assert.equal(w.canStep(e.x, e.y, e.x + 1, e.y), false); assert.equal(w.canStep(e.x + 1, e.y, e.x, e.y), false);
      const a = { x: (e.x + .5) * T, y: (e.y + .5) * T }, b = { x: (e.x + 1.5) * T, y: (e.y + .5) * T };
      assert.equal(w.stepClear217(a.x, a.y, b.x, b.y), false);
      // Ami : le pas qui franchit l'arête est refusé ; infecté : la position de l'autre côté n'est pas libre.
      const unit = { x: (e.x + 1) * T - 2, y: a.y, radius: 4 }; h.moveFriendly(unit, 5, 0);
      assert.equal(Math.floor(unit.x / T), e.x, 'ami arrêté par la falaise');
      assert.equal(h.hostilePositionClear({ x: unit.x, y: unit.y, radius: 4 }, (e.x + 1) * T + 2, a.y), false);
      // Champ de flux : le coût d'une case ne vient jamais de sa voisine derrière la falaise.
      const vi = f.values[e.i], vj = f.values[e.j];
      if (vi < 0x3fffffff && vj < 0x3fffffff) assert.ok(Math.abs(vi - vj) > 0 || d.levels[e.i] !== d.levels[e.j]);
      const dir = f.direction(a.x, a.y, 0, 0), next = [Math.floor((a.x + dir.x * T) / T), Math.floor((a.y + dir.y * T) / T)];
      if (vi < 0x3fffffff && vi > 0) assert.ok(w.canStep(e.x, e.y, next[0], next[1]), 'la direction ne pointe pas à travers la falaise');
    }
    // Un pas d'un palier à l'autre n'est permis que par une rampe : relu sur 4 000 pas tirés par hachage.
    for (let k = 0; k < 4000; k++) {
      const x = Math.floor(C.seededHash(k, s, 1) * (N - 1)), y = Math.floor(C.seededHash(k, s, 2) * (N - 1)), dx = k & 1, dy = 1 - dx;
      const i = y * N + x, j = (y + dy) * N + x + dx, ok = !deep(d, j) && (d.levels[i] === d.levels[j] || Boolean(d.passes[i] & (dx ? 1 : 2)));
      assert.equal(w.canStep(x, y, x + dx, y + dy), ok);
    }
    // Cases hors d'atteinte du champ de flux = cases hors d'atteinte de la description.
    for (let i = 0; i < N * N; i++) assert.equal(f.values[i] === 0x3fffffff, d.cost[i] < 0);
  }
});

test('O6a : rampe franchissable — pas, déplacement ami et chemin ami par la rampe', () => {
  let walked = 0;
  for (const s of [42, 46]) {
    const d = desc(s), w = build(s), h = harness(w), ramps = edges(d, true);
    assert.ok(ramps.length >= 2, s + ' : des rampes');
    for (const e of ramps) {
      assert.equal(w.canStep(e.x, e.y, e.x + 1, e.y), true); assert.equal(w.canStep(e.x + 1, e.y, e.x, e.y), true);
      const unit = { x: (e.x + 1) * T - 2, y: (e.y + .5) * T, radius: 4 }; h.moveFriendly(unit, 5, 0);
      assert.equal(Math.floor(unit.x / T), e.x + 1, 'ami passé par la rampe');
    }
    // Chemin ami d'un palier à l'autre : il passe par une arête de rampe, jamais par une falaise.
    const e = ramps[0], a = { x: e.x - 3, y: e.y }, b = { x: e.x + 4, y: e.y };
    const path = C.findFriendlyPath(a, b, () => false, N, N, undefined, (x, y, nx, ny) => w.canStep(x, y, nx, ny));
    assert.ok(path && path.length >= 7);
    let prev = a; for (const p of path) { assert.ok(w.canStep(prev.x, prev.y, p.x, p.y)); prev = p; }
    // Parcours d'un survivant (harnais) : du bas de la falaise au haut, par la rampe, sans jamais franchir une falaise.
    const cliff = edges(d, false).find(c => c.y === e.y + 20 && Math.abs(c.x - e.x) < 3 && d.levels[c.i] === d.levels[e.i] && d.levels[c.j] === d.levels[e.j]);
    if (cliff) {
      const h2 = harness(w), unit = { x: (cliff.x - 1.5) * T, y: (cliff.y + .5) * T, radius: 4, speed: 90 }, goal = { x: (cliff.x + 3.5) * T, y: (cliff.y + .5) * T };
      let cell = [Math.floor(unit.x / T), Math.floor(unit.y / T)], arrived = false;
      for (let k = 0; k < 2400 && !arrived; k++) {
        arrived = h2.moveUnitToward(unit, goal, 1 / 30); const next = [Math.floor(unit.x / T), Math.floor(unit.y / T)];
        assert.ok(w.canStep(cell[0], cell[1], next[0], next[1]), 'aucun pas à travers la falaise'); cell = next;
      }
      assert.ok(arrived, s + ' : arrivé en haut par la rampe'); walked++;
    }
  }
  assert.ok(walked >= 1, 'au moins un parcours par la rampe');
  // Sans prédicat d'arête, le chemin ami historique est inchangé.
  assert.equal(C.findFriendlyPath({ x: 1, y: 1 }, { x: 5, y: 1 }, x => x === 3, 7, 7), null);
});

test('O6a : centre atteignable depuis chaque côté ouvert, aucun depuis un côté clos', () => {
  for (const s of SEEDS) {
    const d = desc(s), w = build(s), f = new Flow(); f.rebuild(w, centre);
    const target = (N / 2) * N + N / 2; assert.equal(f.values[target], 0);
    const siege = Lw.siege(d); assert.ok(siege.ok);
    for (const side of Lw.SIDES) {
      const st = d.sides[side], border = [];
      for (let t = 0; t < N; t++) { const [x, y] = sideCell(side, t); if (f.values[y * N + x] < 0x3fffffff) border.push([x, y]); }
      if (st.status === 'clos') { assert.equal(border.length, 0, s + ' ' + side + ' clos'); continue; }
      assert.ok(border.length > 0, s + ' ' + side + ' ouvert');
      // Descente du champ par pas permis, depuis le milieu de chaque tronçon d'entrée, jusqu'au centre.
      for (const e of st.entries) {
        let [x, y] = sideCell(side, Math.floor((e.from + e.to - 1) / 2)), steps = 0;
        while (f.values[y * N + x] > 0 && steps < 4 * N) {
          let best = null;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!w.canStep(x, y, nx, ny)) continue; if (!best || f.values[ny * N + nx] < f.values[best[1] * N + best[0]]) best = [nx, ny]; }
          assert.ok(best && f.values[best[1] * N + best[0]] < f.values[y * N + x], 'pente du champ');
          [x, y] = best; steps++;
        }
        assert.equal(y * N + x, target, s + ' ' + side + ' : centre atteint');
      }
    }
    assert.deepEqual(siege.fronts.map(fr => fr.side), Lw.SIDES.filter(side => d.sides[side].status !== 'clos'));
  }
});

test('O6a : construction refusée à cheval sur deux paliers, sur l’eau, sur une rampe (sauf mur et porte)', () => {
  const w = build(42), d = desc(42), wall = w.definition('woodWall'), tower = w.definition('watchtower'), gate = w.definition('gate');
  assert.equal(w.placement(wall, 96, 96).valid, true, 'plat de la cité');
  const cliff = edges(d, false).find(e => e.x > 4 && e.y > 4 && e.x < N - 6 && e.y < N - 6 && w.placement(wall, e.x, e.y).valid && w.placement(wall, e.x + 1, e.y).valid);
  assert.ok(cliff);
  assert.match(w.placement(tower, cliff.x, cliff.y - 1).reason, /deux paliers/);
  const ramp = []; for (let i = 0; i < N * N; i++) if (d.kinds[i] === Lw.KIND.ramp) ramp.push([i % N, Math.floor(i / N)]);
  const [rx, ry] = ramp.find(([x, y]) => x > 4 && y > 4 && x < N - 6 && y < N - 6 && d.levels[y * N + x] === d.levels[y * N + x + 1] && d.kinds[y * N + x + 1] === Lw.KIND.ramp && w.placement(wall, x, y).valid);
  assert.match(w.placement(w.definition('turret'), rx, ry).reason, /rampe/);
  assert.equal(w.placement(wall, rx, ry).valid, true, 'un mur barre la rampe');
  const wet = build(46), dw = desc(46); let at = -1; for (let i = 0; i < N * N; i++) { const x = i % N, y = Math.floor(i / N); if (deep(dw, i) && x > 4 && y > 4 && x < N - 6 && y < N - 6) { at = i; break; } }
  assert.ok(at >= 0); assert.match(wet.placement(wall, at % N, Math.floor(at / N)).reason, /eau/);
  assert.equal(w.placement(gate, rx, ry).valid, true, 'une porte barre la rampe');
  // Eau profonde : aussi un obstacle pour les amis.
  assert.ok(wet.solidForFriendly((at % N + .5) * T, (Math.floor(at / N) + .5) * T));
});

test('O6a : D-O1 — la falaise arrête la vue d’en bas, pas d’en haut', () => {
  const w = build(17117), d = desc(17117), h = harness(w);
  const e = edges(d, false).find(e => Math.abs(e.y - N / 2) < 60 && Math.abs(e.x - N / 2) < 80) || edges(d, false)[0];
  const lowLeft = d.levels[e.i] < d.levels[e.j], low = { x: (e.x + (lowLeft ? -2.5 : 3.5)) * T, y: (e.y + .5) * T }, high = { x: (e.x + (lowLeft ? 3.5 : -2.5)) * T, y: (e.y + .5) * T };
  assert.ok(w.terrainAt217(low.x, low.y).level < w.terrainAt217(high.x, high.y).level);
  assert.equal(w.sightClear217(high, low), true, 'd’en haut on voit en contrebas');
  assert.equal(w.sightClear217(low, high), false, 'd’en bas la falaise cache le haut');
  assert.ok(w.sightObstruction217(low, high) > 0 && w.sightObstruction217(low, high) < 1, 'fraction de l’obstacle, prête pour les projectiles');
  assert.equal(h.hasLineOfSight(high, low), true); assert.equal(h.hasLineOfSight(low, high), false);
  assert.equal(h.hostileLineClear(high, low, false), true); assert.equal(h.hostileLineClear(low, high, false), false);
  // Carte plate : la vue ne change pas.
  const flat = new World(17117, 0, MAP); assert.equal(flat.sightClear217(low, high), true); assert.equal(flat.canStep(3, 3, 4, 3), true); assert.equal(flat.terrain217, null);
});

test('O6a : champ de flux — résultat identique octet pour octet sur les cartes actuelles, coût mesuré à 192 m', () => {
  // Les cartes actuelles ne prennent pas le chemin du terrain ; on prouve en plus que ce chemin (coût lu une
  // fois par case, arêtes) rend le même champ que l'historique sur un terrain plat, enveloppes de la partie comprises.
  for (const seed of ['17117', '42', '84329']) {
    g.startNew('standard', seed); g.campaignIntro132?.skip?.();
    const core = g.core(), plain = new Flow(); plain.rebuild(g.world, core);
    assert.equal(plain.terrain217, null);
    const twin = new World(g.world.seed, 0, C.LOCAL_MAP217, flatDesc(128, g.world.seed)); twin.movementCost = (x, y) => g.world.movementCost(x, y);
    const fast = new Flow(); fast.rebuild(twin, core);
    assert.ok(fast.terrain217);
    assert.equal(Buffer.compare(Buffer.from(plain.values.buffer), Buffer.from(fast.values.buffer)), 0, 'champ identique, graine ' + seed);
    for (let k = 0; k < 200; k++) { const x = 40 + C.seededHash(k, 1, 3) * 4000, y = 40 + C.seededHash(k, 1, 4) * 4000; assert.deepEqual(fast.direction(x, y, k, k / 7), plain.direction(x, y, k, k / 7)); }
  }
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  // Coût (médiane de 15 reconstructions) : enveloppes de la partie déléguées sur le monde de 128, ordre de grandeur.
  const med = a => a.sort((x, y) => x - y)[a.length >> 1];
  const time = m => { const f = new Flow(), out = []; for (let i = 0; i < 18; i++) { const t0 = process.hrtime.bigint(); f.rebuild(m, m.local.centre()); out.push(Number(process.hrtime.bigint() - t0) / 1e6); } return med(out.slice(3)); };
  const env = m => { const own = m.movementCost.bind(m); m.movementCost = (x, y) => Math.max(own(x, y), g.world.movementCost(x % 128, y % 128)); return m; };
  const game128 = time(g.world), flat192 = time(env(new World(17117, 0, MAP))), terrain = SEEDS.map(s => time(env(build(s))));
  console.log(`# champ de flux (médiane) : partie 17117 à 128 cases ${game128.toFixed(1)} ms ; carte plate 192 avec enveloppes ${flat192.toFixed(1)} ms ; terrain G12 192 avec enveloppes ${terrain.map(v => v.toFixed(1)).join(' / ')} ms (${SEEDS.join(', ')})`);
  assert.ok(terrain.every(v => v < 250));
});
