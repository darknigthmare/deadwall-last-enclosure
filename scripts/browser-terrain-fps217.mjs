// Harnais de navigateur hors jeu (specs/monde-sans-bord/ouverture.md, O8b) : partie lancée par le menu public, puis
// monde remplacé par une carte de 192 m née de la description locale de génération 12 (modules hors jeu injectés dans
// la page, jamais servis par le serveur public). Une citadelle est posée près d'une falaise, d'une rampe ou de l'eau,
// le commandant y monte, construit une sentinelle et la possède ; captures de la vue FPS (WebGL natif) sur le relief.
// La génération 12 reste refusée par le jeu.
// Usage : PORT=8745 node scripts/server.mjs &  puis  node scripts/browser-terrain-fps217.mjs <port> <dossier> [graines…]
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = createRequire('/')('playwright');
const { buildTerrainGame217 } = require('../tests/helpers/terrain-game217.cjs');
const { armTerrainCitadel217, aimTerrainFps217 } = require('../tests/helpers/terrain-fps217.cjs');
const [port = '8745', out = join(root, 'reports', 'terrain-fps217'), ...seedArgs] = process.argv.slice(2);
const seeds = seedArgs.length ? seedArgs.map(Number) : [17117, 0, 46];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e?.message || e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load' });
await page.waitForFunction(() => globalThis.DEADWALL && typeof globalThis.DEADWALL.startNew === 'function');
await page.evaluate(() => { DEADWALL.startNew('standard', '17117'); DEADWALL.campaignIntro132?.skip?.(); });
await page.waitForTimeout(800);
const before = errors.length;
for (const file of ['src/world-cantons217.js', 'src/world-canton-gen217.js', 'src/world-local217.js', 'src/terrain-fps217.js'])
  await page.addScriptTag({ content: readFileSync(join(root, file), 'utf8') });
await page.evaluate(([a, b, c]) => {
  globalThis.buildTerrainGame217 = (0, eval)('(' + a + ')'); globalThis.armTerrainCitadel217 = (0, eval)('(' + b + ')'); globalThis.aimTerrainFps217 = (0, eval)('(' + c + ')');
  const g = DEADWALL; g.spawnZombie('walker'); globalThis.Zombie217 = g.zombies.at(-1).constructor; g.zombies.pop();
  const canvas = document.createElement('canvas'); canvas.id = 'o8bfps';
  Object.assign(canvas.style, { position: 'fixed', left: '0', top: '0', width: '1280px', height: '720px', zIndex: 99999 }); document.body.appendChild(canvas);
}, [buildTerrainGame217.toString(), armTerrainCitadel217.toString(), aimTerrainFps217.toString()]);

const report = { port, seeds: [], errorsBeforeHarness: errors.slice(0, before) };
for (const seed of seeds) {
  const result = await page.evaluate(seed => {
    const g = DEADWALL, C = DeadwallCore, F = DeadwallTerrainFPS217, T = C.TILE;
    // Partie neuve avancée (âge 10, stocks) : la citadelle et sa sentinelle passent par les contrôleurs de production.
    g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
    const d = g.serialize(); d.urban.peakScore = 2200; d.urban.progression151 = { version: 1, age: 10 };
    d.resources = { wood: 3000, scrap: 3000, stone: 3000, food: 3000, fuel: 2000, ammo: 3000, medicine: 50 }; g.restoreSave(d);
    g.paused = true;
    buildTerrainGame217(g, DeadwallWorldLocal217.describe, seed, {});
    const t = g.world.terrain217, N = t.tiles, L = t.levels, m = F.mesh(g.world);
    // Cible tirée de la grille (lecture seule) : rampe la plus longue (0, 46), rivière (46), sinon la falaise la plus proche du centre.
    let target = null, name = '';
    const ramp = m.ramps.filter(r => r.cells >= 72).sort((a, b) => b.cells - a.cells)[0];
    let wx = 0, wy = 0, wn = 0; for (let i = 0; i < t.water.length; i++) if (t.water[i] === 3) { wx += i % N; wy += Math.floor(i / N); wn++; }
    if (seed === 46 && wn) { target = { x: wx / wn + .5, y: wy / wn + .5 }; name = 'riviere'; }
    else if (ramp) { target = { x: (ramp.left + ramp.right) / 2, y: (ramp.top + ramp.bottom) / 2 }; name = 'rampe'; }
    else {
      let best = null; for (let y = 0; y < N - 1; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (L[i] !== L[i + N] && !(t.passes[i] & 2)) { const dd = (x - 96) ** 2 + (y + 1 - 96) ** 2; if (!best || dd < best.d) best = { x: x + .5, y: y + 1, d: dd }; } }
      target = best; name = 'falaise';
    }
    // Citadelle sur le palier bas de la cible, à une quarantaine de mètres de la cible.
    const lowAround = (() => { let lo = 255; for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) { const x = Math.floor(target.x) + dx, y = Math.floor(target.y) + dy; if (x >= 0 && y >= 0 && x < N && y < N && !t.water[y * N + x]) lo = Math.min(lo, L[y * N + x]); } return lo; })();
    // Citadelle à 34 m de la cible, du côté du centre de la carte.
    const cx = N / 2 - target.x, cy = N / 2 - target.y, cl = Math.hypot(cx, cy) || 1, spot = { x: target.x + cx / cl * 34, y: target.y + cy / cl * 34 };
    // Rivière : vue du plateau sud, par-dessus le palier bas et l'eau, vers les rampes du nord.
    if (name === 'riviere') { spot.x = target.x; spot.y = target.y + 34; }
    let armed; try { armed = armTerrainCitadel217(g, spot, name === 'riviere' ? { radius: 30 } : { level: lowAround, radius: 60 }); } catch { armed = armTerrainCitadel217(g, spot, { radius: 80 }); }
    const V = g.vertical175, q = V.moduleRef(V.presentation().controlled), eye = F.eye(g.world, V.muzzle(q), q.b);
    const zAt = (x, y) => F.elevation(g.world, x * T, y * T);
    // Deux infectés témoins vers la cible : l'un sur le palier de l'œil (visible), l'autre au-delà de la cible (D-O1).
    const dx = target.x - eye.x, dy = target.y - eye.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, witnesses = [];
    for (const f of [.45, 1.35]) { const x = (eye.x + dx * f) * T, y = (eye.y + dy * f) * T; const z = new Zombie217(g.nextId++, 'walker', x, y, g.difficulty, g.wave, g.local); z.facing = Math.atan2(-uy, -ux); g.zombies.push(z); witnesses.push({ x: x / T, y: y / T, ground: +zAt(x / T, y / T).toFixed(2), seen: F.sightClear(g.world, V.muzzle(q), z, F.levelOf(g.world, q.b)) }); }
    return { name, target, eye, building: { gx: armed.building.gx, gy: armed.building.gy, level: F.levelOf(g.world, armed.building) }, targetZ: zAt(target.x, target.y), witnesses, summary: F.summary(g.world) };
  }, seed);
  const shots = [];
  const views = [{ name: result.name, turn: 0, z: result.targetZ }, { name: 'panorama', turn: Math.PI / 2, z: result.eye.z - 6 }, { name: 'revers', turn: Math.PI, z: result.eye.z - 8 }];
  for (const v of views) {
    const stats = await page.evaluate(([v, r]) => {
      const g = DEADWALL; g.dayClock = .44; g.weather = 0;
      // Visée vers la cible, assiette bornée (le pont de la citadelle ne doit pas remplir l'image).
      const a = aimTerrainFps217(g, r.target, v.z); g.vertical175.aim(a.yaw + v.turn, Math.min(.08, Math.max(-.2, a.pitch)));
      globalThis.o8bRenderer ??= DeadwallVertical175Render.createFPS(document.getElementById('o8bfps'));
      const ok = globalThis.o8bRenderer.draw(g); return { ok, ...globalThis.o8bRenderer.diagnostics() };
    }, [v, result]);
    const file = join(out, 'o8b-' + seed + '-' + v.name + '.png');
    await page.locator('#o8bfps').screenshot({ path: file });
    shots.push({ file, ...stats });
  }
  report.seeds.push({ seed, ...result, shots });
}
report.errors = errors.slice(before);
writeFileSync(join(out, 'o8b-rapport.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ seeds: report.seeds.map(s => ({ seed: s.seed, view: s.name, eye: s.eye, building: s.building, witnesses: s.witnesses, vertices: s.summary.vertices, ramps: s.summary.ramps.length, shots: s.shots.map(x => x.ok) })), errorsBefore: report.errorsBeforeHarness.length, errors: report.errors.slice(0, 8), errorCount: report.errors.length }, null, 1));
await browser.close();
