'use strict';
// Mesures d'équilibrage du siège adossé (specs/monde-sans-bord/ouverture.md, tranche O7, décision D-O2), hors jeu.
// Pour chaque graine et chaque âge, une partie de terrain de génération 12 est construite par le harnais
// (`tests/helpers/terrain-game217.cjs`), entourée d'une enceinte adossée (anneau carré de murs posé seulement là où
// l'on atteint l'anneau depuis l'intérieur : les falaises ferment le reste), défendue par des tourelles, puis une
// vague de l'âge est jouée par `g.update` jusqu'à sa fin (ou `--max` secondes). Relevés : temps de vague, cadavres
// par mètre de front ouvert, murs perdus, cœur debout.
// Réglages du harnais : quartiers du terrain (préalable O9 (a) ; plus de quartiers fictifs), sauvegarde coupée (refusée
// tant que le registre régional G12 est fermé : coupée pour ne pas bruiter les relevés), gisements retirés de l'emprise des murs.
// Variante « graine:catégorie:12 » : même grille, l'unique côté non clos réduit à une rampe de 12 m (aucune graine
// à un seul passage n'existe sur 3 000 graines de la version 2 de la carte locale ; mesure indicative du plafond).
// usage : node scripts/measure-open-siege217.cjs <sortie.json> <graine[:catégorie[:rampe]]>... [--ages=2,4,6] [--max=300] [--dt=0.1]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [out, ...list] = args.filter(a => !a.startsWith('--'));
if (!out || !list.length) { console.error('usage : node scripts/measure-open-siege217.cjs <sortie.json> <graine[:catégorie]>...'); process.exit(2); }
const AGES = (opt.ages || '2,4,6').split(',').map(Number), MAX = Number(opt.max || 300), DT = Number(opt.dt || .1);
// Âge de la cité → vague jouée, murs et tourelles disponibles à cet âge (`unlockTier` des bâtiments).
const PROFILE = Object.freeze({
  2: { wave: 6, wall: 'steelWall', turret: 'turret', turrets: 4, ring: 22 },
  4: { wave: 18, wall: 'concreteWall', turret: 'heavyTurret', turrets: 6, ring: 26 },
  6: { wave: 36, wall: 'concreteWall', turret: 'heavyTurret', turrets: 8, ring: 30 }
});
const { bootDocument134 } = require(path.join(root, 'scripts/qa-startup134.cjs'));
const { buildTerrainGame217 } = require(path.join(root, 'tests/helpers/terrain-game217.cjs'));
const Lw = require(path.join(root, 'src/world-local217.js'));
const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, T = globalThis.DeadwallTactics, N = 192;
const Building = g.core().constructor;
function ring(w, r) {
  const c = N / 2, inside = new Uint8Array(N * N), queue = [c * N + c], cells = new Set(); inside[c * N + c] = 1;
  const cheb = (x, y) => Math.max(Math.abs(x - c), Math.abs(y - c));
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], x = i % N, y = (i - x) / N;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (!w.canStep(x, y, nx, ny)) continue;
      const j = ny * N + nx; if (cheb(nx, ny) === r) cells.add(j); else if (cheb(nx, ny) < r && !inside[j]) { inside[j] = 1; queue.push(j); }
    }
  }
  return { cells: [...cells].sort((a, b) => a - b), inside };
}
function narrowed(d, metres) {
  const open = C.OpenSiege217.open(d.sides); if (open.length !== 1) throw new Error('Variante à passage : un seul côté non clos attendu.');
  const side = d.sides[open[0]], passage = Object.freeze({ kind: 'col', x: 96, y: 96, width: metres, low: 0, high: 1, col: null, cut: false });
  return Object.freeze({ ...d, sides: Object.freeze({ ...d.sides, [open[0]]: Object.freeze({ ...side, status: 'passage', width: metres, passages: Object.freeze([passage]) }) }) });
}
function run(seed, category, age, ramp) {
  const P = PROFILE[age], d = ramp ? narrowed(Lw.describe(seed), ramp) : Lw.describe(seed);
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const { world: w, core } = buildTerrainGame217(g, () => d, seed);
  Object.defineProperty(g, 'save', { value: () => false, writable: true, configurable: true });
  w.nodes.length = 0;
  // Ville de l'âge : le score de cité ne compte pas ici, seules la vague, les murs et les tourelles changent.
  const add = (type, gx, gy) => { const b = new Building(g.nextId++, type, gx, gy, 0, 1, w.cityGeometry202); b.health = b.maxHealth; w.add(b); return b; };
  const r = ring(w, P.ring), walls = [];
  let refused = 0;
  for (const i of r.cells) { const gx = i % N, gy = Math.floor(i / N); if (w.placement(w.definition(P.wall), gx, gy).valid) walls.push(add(P.wall, gx, gy)); else refused++; }
  const turrets = [];
  for (let k = 0; k < 64 && turrets.length < P.turrets; k++) {
    const a = k * 2.399963, rr = 6 + (k % 5) * 2, gx = Math.round(N / 2 + Math.cos(a) * rr), gy = Math.round(N / 2 + Math.sin(a) * rr);
    if (!r.inside[gy * N + gx] || !w.placement(w.definition(P.turret), gx, gy).valid) continue;
    const t = add(P.turret, gx, gy); t.powered = true; turrets.push(t);
  }
  g.flow.rebuild(w, core); w.flowDirty = true;
  g.storage = Math.max(g.storage || 0, 5000); g.resources.ammo = 5000; g.resources.fuel = 500;
  const enclosure = T.analyzeEnclosure({ buildings: w.buildings.values(), target: core, grid: T.terrainGrid217(w) });
  g.wave = P.wave; g.phase = 'warning'; g.prepareWave(); g.phase = 'assault'; g.phaseTime = 0; g.startAssault();
  const plan = g.wavePlan, siege = g.openSiegeState217(), fronts = g.fronts.slice(), width = fronts.reduce((n, f) => n + d.sides[f].width, 0);
  const t0 = g.elapsed; let error = null, steps = 0, peak = 0;
  const started = Date.now();
  try {
    while (g.phase === 'assault' && !g.gameOver && g.elapsed - t0 < MAX) {
      g.resources.ammo = Math.max(g.resources.ammo, 2000);
      g.update(DT); steps++; peak = Math.max(peak, g.zombies.length);
    }
  } catch (e) { error = String(e && e.message || e); }
  const lost = walls.filter(b => b.dead || w.buildings.get(b.id) !== b).length;
  const left = g.spawnQueue.length + C.spawnCount(g.pendingSpawns) + g.zombies.filter(z => !z.dead).length;
  return {
    seed, category, age, wave: P.wave, open: C.OpenSiege217.open(d.sides).map(f => f + ':' + d.sides[f].status + ':' + d.sides[f].width),
    fronts, asked: plan.fronts, folded: siege.folded, total: plan.total, frontWidth: width, ringWalls: walls.length, ringRefused: refused, turrets: turrets.length,
    enclosed: enclosure.enclosed, gap: Math.round(g.spawnGap217() * 1000) / 1000, interval: plan.spawnInterval,
    seconds: Math.round((g.elapsed - t0) * 10) / 10, finished: g.phase !== 'assault', left, kills: g.stats.kills, corpses: g.corpses.length,
    corpsesPerMetre: Math.round(g.stats.kills / Math.max(1, width) * 100) / 100, wallsLost: lost, coreAlive: !core.dead && core.health > 0, gameOver: g.gameOver,
    peak, steps, wallMs: Date.now() - started, error
  };
}
const results = [];
for (const item of list) {
  const [s, category = '', ramp = ''] = item.split(':'), seed = Number(s);
  for (const age of AGES) {
    const r = run(seed, category, age, Number(ramp) || 0); results.push(r);
    console.log(JSON.stringify(r));
    fs.writeFileSync(out, JSON.stringify(results, null, 1));
  }
}
