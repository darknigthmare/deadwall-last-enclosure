// Harnais de navigateur hors jeu (specs/monde-sans-bord/ouverture.md, O8a) : partie lancée par le menu public,
// puis monde remplacé par une carte de 192 m née de la description locale de génération 12 (modules hors jeu
// injectés dans la page, jamais servis par le serveur public). Captures du rendu 2D/2,5D : falaises, rampes,
// eau, routes, minicarte. La génération 12 reste refusée par le jeu.
// Usage : PORT=8743 node scripts/server.mjs &  puis  node scripts/browser-terrain-art217.mjs <port> <dossier> [graines…]
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = createRequire('/')('playwright');
const { buildTerrainGame217 } = require('../tests/helpers/terrain-game217.cjs');
const [port = '8743', out = join(root, 'reports', 'terrain-art217'), ...seedArgs] = process.argv.slice(2);
const seeds = seedArgs.length ? seedArgs.map(Number) : [17117, 0, 46];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e?.message || e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load' });
await page.waitForFunction(() => globalThis.DEADWALL && typeof globalThis.DEADWALL.startNew === 'function');
await page.evaluate(() => { DEADWALL.startNew('standard', '17117'); DEADWALL.campaignIntro132?.skip?.(); });
await page.waitForTimeout(800);
const before = errors.length;
for (const file of ['src/world-cantons217.js', 'src/world-canton-gen217.js', 'src/world-local217.js', 'src/terrain-art217.js'])
  await page.addScriptTag({ content: readFileSync(join(root, file), 'utf8') });
await page.evaluate(source => { globalThis.buildTerrainGame217 = (0, eval)('(' + source + ')'); }, buildTerrainGame217.toString());

const report = { port, seeds: [], errorsBeforeHarness: errors.slice(0, before) };
for (const seed of seeds) {
  // Points de vue tirés de la grille (lecture seule) : centre, première face de falaise, rampes, eau.
  const views = await page.evaluate(seed => {
    const g = DEADWALL; g.paused = true;
    // Constructeur des infectés pris sur la partie d'origine (le monde de terrain n'a pas de quartiers à bâtir).
    if (!globalThis.Zombie217) { g.spawnZombie('walker'); globalThis.Zombie217 = g.zombies.at(-1).constructor; }
    const built = buildTerrainGame217(g, DeadwallWorldLocal217.describe, seed, { zoom: .55 });
    const A = DeadwallTerrainArt217, t = g.world.terrain217, p = A.prepare(t), T = DeadwallCore.TILE, N = p.tiles, out = [];
    out.push({ name: 'centre', x: g.player.x, y: g.player.y, zoom: .55 });
    out.push({ name: 'ensemble', x: N * T / 2, y: N * T / 2, zoom: .3 });
    const near = list => list.slice().sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - 96, a.y - 96) - Math.hypot((b.x0 + b.x1) / 2 - 96, b.y - 96))[0];
    const face = near(p.faces.filter(f => f.x1 - f.x0 >= 6)) || near(p.faces); if (face) out.push({ name: 'falaise', x: (face.x0 + face.x1) / 2 * T, y: face.y * T, zoom: .7 });
    const back = near(p.backs.filter(f => f.x1 - f.x0 >= 6)) || near(p.backs); if (back) out.push({ name: 'rebord', x: (back.x0 + back.x1) / 2 * T, y: back.y * T, zoom: .7 });
    for (const [k, r] of p.ramps.filter(r => r.cells.length >= 100).slice(0, 2).entries()) out.push({ name: 'rampe' + (k + 1), x: (r.left + r.right) / 2 * T, y: (r.top + r.bottom) / 2 * T, zoom: .7 });
    let wx = 0, wy = 0, wn = 0; for (let i = 0; i < t.water.length; i++) if (t.water[i] === 3) { wx += i % N; wy += Math.floor(i / N); wn++; }
    if (wn) out.push({ name: 'riviere', x: (wx / wn + .5) * T, y: (wy / wn + .5) * T, zoom: .55 });
    // Deux infectés témoins près d'un rebord arrière : l'un derrière (masqué), l'autre sur le plateau.
    if (back) {
      const mx = (back.x0 + back.x1) / 2 * T, z = g.zombies;
      for (const [x, y] of [[mx - 30, back.y * T - 24], [mx + 30, back.y * T + 30]]) z.push(new Zombie217(g.nextId++, 'walker', x, y, g.difficulty, g.wave, g.local));
      out.witnesses = z.slice(-2).map(e => ({ x: e.x, y: e.y, hidden: A.hiddenBehind(g, e) }));
    }
    return { views: out, witnesses: out.witnesses || [], summary: A.summary(g.world), core: { x: built.core.x, y: built.core.y } };
  }, seed);
  const shots = [];
  for (const v of views.views) {
    await page.evaluate(v => {
      const g = DEADWALL; Object.assign(g.camera, { x: v.x, y: v.y, zoom: v.zoom, shake: 0 }); g.dayClock = .44; g.weather = 0;
      g.render(); Object.getPrototypeOf(g).renderMinimap.call(g);
    }, v);
    const file = join(out, 'o8a-' + seed + '-' + v.name + '.png');
    await page.locator('#game').screenshot({ path: file });
    shots.push(file);
  }
  const mini = join(out, 'o8a-' + seed + '-minicarte.png');
  await page.locator('#minimap').screenshot({ path: mini }).then(() => shots.push(mini), () => {});
  report.seeds.push({ seed, summary: views.summary, witnesses: views.witnesses, shots });
}
report.errors = errors.slice(before);
writeFileSync(join(out, 'o8a-rapport.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ seeds: report.seeds.map(s => ({ seed: s.seed, shots: s.shots.length, faces: s.summary.faces, ramps: s.summary.ramps.length, water: s.summary.waterCells, witnesses: s.witnesses })), errorsBefore: report.errorsBeforeHarness.length, errors: report.errors.slice(0, 8), errorCount: report.errors.length }, null, 1));
await browser.close();
