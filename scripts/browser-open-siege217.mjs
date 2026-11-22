// Harnais de navigateur hors jeu (specs/monde-sans-bord/ouverture.md, O7) : partie lancée par le menu public, une vague
// jouée sur la carte plate, puis monde remplacé par la carte de 192 m de la graine 17117 (modules hors jeu injectés
// dans la page, jamais servis par le serveur public) : vague 5 annoncée et jouée, fronts est et ouest, masse lointaine,
// ligne de lecture de siège. La génération 12 reste refusée par le jeu.
// Usage : PORT=8744 node scripts/server.mjs &  puis  node scripts/browser-open-siege217.mjs <port> <dossier>
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = createRequire('/')('playwright');
const { buildTerrainGame217 } = require('../tests/helpers/terrain-game217.cjs');
const [port = '8744', out = join(root, 'reports', 'open-siege217')] = process.argv.slice(2);
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
// Carte plate : une vague forcée, jouée 12 s ; aucun chemin du siège adossé.
const flat = await page.evaluate(async () => {
  const g = DEADWALL; g.phaseTime = .5; const t0 = performance.now();
  await new Promise(r => setTimeout(r, 12000));
  return { phase: g.phase, fronts: g.fronts.slice(), zombies: g.zombies.length, siege: g.openSiege217 === undefined ? null : 'présent', line: document.getElementById('siegeReadoutFronts') ? 'présente' : null, ms: Math.round(performance.now() - t0) };
});
await page.screenshot({ path: join(out, 'plate-17117.png') });
const before = errors.length;
for (const file of ['src/world-cantons217.js', 'src/world-canton-gen217.js', 'src/world-local217.js', 'src/terrain-art217.js'])
  await page.addScriptTag({ content: readFileSync(join(root, file), 'utf8') });
await page.evaluate(source => { globalThis.buildTerrainGame217 = (0, eval)('(' + source + ')'); }, buildTerrainGame217.toString());
// Terrain 17117 : quartiers fictifs autour du cœur (le moteur des chantiers lit les quartiers G1–G11) et sauvegarde
// coupée, comme le harnais de test ; vague 5 annoncée par le directeur, puis jouée en temps réel.
const terrain = await page.evaluate(async () => {
  const g = DEADWALL, notes = [], notify = g.notify;
  const built = buildTerrainGame217(g, DeadwallWorldLocal217.describe, 17117, { zoom: .32 });
  const themes = [...new Set(DeadwallCore.Dayworks.SITES.map(s => s.theme))];
  built.world.sites = themes.map((theme, k) => ({ id: 'harnais-' + k, theme, x: built.core.x + 1400 * Math.cos(k), y: built.core.y + 1400 * Math.sin(k) }));
  g.save = () => false;
  g.notify = function (text, ...rest) { notes.push(String(text)); return notify.call(this, text, ...rest); };
  g.wave = 5; g.phase = 'calm'; g.phaseTime = .2; g.paused = false;
  await new Promise(r => setTimeout(r, 1500));
  const warning = { phase: g.phase, fronts: g.fronts.slice(), intel: g.ui.waveIntel?.textContent || '', line: document.getElementById('siegeReadoutFronts')?.textContent || null };
  g.siegeReadout?.render?.(); warning.line = document.getElementById('siegeReadoutFronts')?.textContent || null;
  const horizon = g.hordeHorizon217?.horizon?.();
  return { warning, horizon: horizon ? horizon.fronts.slice() : null, notes: notes.filter(t => /Migration/.test(t)), core: { x: built.core.x, y: built.core.y }, sides: Object.fromEntries(Object.entries(built.description.sides).map(([k, s]) => [k, s.status + ' ' + s.width])) };
});
// Vue : le Commandant (que la caméra suit) posé près d'un bord, le temps d'une capture, puis rendu au centre.
const look = async (x, y, zoom, file) => {
  const home = await page.evaluate(([x, y, zoom]) => { const g = DEADWALL, p = { x: g.player.x, y: g.player.y }; g.player.x = x; g.player.y = y; g.dayClock = .5; Object.assign(g.camera, { x, y, zoom }); return p; }, [x, y, zoom]);
  await page.waitForTimeout(1200); await page.screenshot({ path: join(out, file) });
  await page.evaluate(p => { DEADWALL.player.x = p.x; DEADWALL.player.y = p.y; }, home);
};
const size = await page.evaluate(() => DEADWALL.local.size);
await look(size - 700, size / 2, .45, 'terrain-17117-alerte-est.png');
const assault = await page.evaluate(async () => {
  const g = DEADWALL; await new Promise(r => setTimeout(r, 14000));
  const T = DeadwallCore.TILE, sides = g.world.terrain217.sides, borders = { north: 0, east: 0, south: 0, west: 0, inside: 0 };
  for (const z of g.zombies) { if (z.x < 6 * T) borders.west++; else if (z.x > g.local.size - 6 * T) borders.east++; else if (z.y < 6 * T) borders.north++; else if (z.y > g.local.size - 6 * T) borders.south++; else borders.inside++; }
  return { phase: g.phase, zombies: g.zombies.length, borders, siege: g.openSiege217 && { fronts: g.openSiege217.fronts, emitted: g.openSiege217.emitted, folded: g.openSiege217.folded }, line: document.getElementById('siegeReadoutFronts')?.textContent || null, closed: Object.keys(sides).filter(k => sides[k].status === 'clos') };
});
await look(size - 700, size / 2, .45, 'terrain-17117-assaut-est.png');
await look(700, size / 2, .45, 'terrain-17117-assaut-ouest.png');
await look(size / 2, 500, .45, 'terrain-17117-falaise-nord.png');
const report = { port, flat, terrain, assault, errorsBeforeHarness: errors.slice(0, before), errors };
writeFileSync(join(out, 'rapport.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
