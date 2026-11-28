// Harnais de navigateur de l'atlas sans bord (specs/monde-sans-bord/ouverture.md, O10 ; tasks.md, T6). Campagne
// « Sans bord — expérimental » : courte sortie à pied et retour (libellé de la minicarte dans la cité), garage et voiture,
// KM kilomètres en voiture plein est par les routes des cantons, puis atlas (fenêtre des cantons vus, brouillard, rayon
// d'action), sonde E9 (ouvrir l'atlas ne génère aucun canton), repère lointain et GPS par le graphe des coutures, minicarte,
// sauvegarde et reprise (tracé approché des cantons non relevés). Captures dans <dossier>.
// Le harnais pilote : boucle du jeu suspendue (images pas à pas), voiture posée sur la voie d'entrée est, réservoir rempli
// et caisse réparée pendant le trajet (le carburant est remis à une valeur connue avant l'atlas) ; aucune règle remplacée.
// Usage : PORT=8753 node scripts/server.mjs &  puis  node scripts/browser-openworld217-atlas.mjs <port> <dossier> [km]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire('/')('playwright');
const [port = '8753', out = join(root, 'reports', 'openworld217-atlas'), kmText = '10'] = process.argv.slice(2);
const KM = Number(kmText);
mkdirSync(out, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e?.stack || e?.message || e).slice(0, 600)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 600)); });
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__hold217 = false;
  window.requestAnimationFrame = cb => raf(t => { if (window.__hold217) window.requestAnimationFrame(cb); else cb(t); });
});
await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => globalThis.DEADWALL && typeof globalThis.DEADWALL.startNew === 'function' && globalThis.DeadwallOpenWorld217Atlas);
await page.waitForTimeout(600);
const shot = async name => { await page.screenshot({ path: join(out, name + '.png') }); log('capture', name); };
const shotOf = async (selector, name) => { const el = await page.$(selector); if (el) { await el.screenshot({ path: join(out, name + '.png') }); log('capture', name); } };

// 1. Campagne sans bord.
await page.evaluate(() => { globalThis.confirm = () => true; DEADWALL.startNew('standard', '17117', 'classic', 'balanced', true, undefined, true); DEADWALL.campaignIntro132?.skip?.(); });
await page.waitForFunction(() => DEADWALL.state === 'playing');
await page.waitForTimeout(1200);
await page.evaluate(() => {
  window.__hold217 = true;
  const g = DEADWALL, O = globalThis.DeadwallOpenWorld217;
  const DIRS = [['KeyD'], ['KeyD', 'KeyS'], ['KeyS'], ['KeyA', 'KeyS'], ['KeyA'], ['KeyA', 'KeyW'], ['KeyW'], ['KeyD', 'KeyW']];
  const H = O.home(g.world.seed), inHome = p => p.x > H.minX - 8 && p.x < H.maxX + 8 && p.y > H.minY - 8 && p.y < H.maxY + 8;
  const S = globalThis.__atlas217 = { tick: 0, frames: [], stuck: 0, prev: null, fill: true, H };
  S.frame = keys => {
    for (const k of DIRS.flat()) g.input.keys.delete(k); for (const k of keys || []) g.input.keys.add(k);
    const t = performance.now(); g.update(1 / 30); if (S.tick++ % 2 === 0) g.render(); const ms = performance.now() - t; S.frames.push(ms);
    const v = g.expeditions.car(); if (v && S.fill) { S.carHealth ??= v.health; if (v.health > 0) { v.fuel = 24; v.health = Math.max(v.health, S.carHealth); } }
    if (g.phase === 'calm') g.phaseTime = Math.max(g.phaseTime, 600);
    return ms;
  };
  S.goTo = (target, max) => {
    for (let i = 0; i < max; i++) {
      const f = g.frontier.position(); if (!f.active) return 'cité';
      if (Math.hypot(target.x - f.x, target.y - f.y) < 6) return 'atteint';
      let idx = ((Math.round(Math.atan2(target.y - f.y, target.x - f.x) / (Math.PI / 4)) % 8) + 8) % 8; if (S.stuck > 8) idx = (idx + (S.stuck > 20 ? 7 : 1)) % 8;
      S.frame(DIRS[idx]); const q = g.frontier.position();
      if (S.prev && Math.hypot(q.x - S.prev.x, q.y - S.prev.y) < .05) S.stuck++; else S.stuck = Math.max(0, S.stuck - 1); S.prev = { x: q.x, y: q.y };
      if (S.stuck > 60) { S.stuck = 0; return 'bloqué'; }
    }
    return 'temps';
  };
  S.leg = (goalX, y0, budget) => {
    const w = g.frontier.world(), from = g.frontier.position(), to = { x: Math.min(goalX, from.x + 2500), y: y0 }, r = w.route(from, to);
    const path = r ? r.path.slice(1).filter(p => !inHome(p)) : [to]; let state = 'atteint', fails = 0;
    for (const p of path) { state = S.goTo(p, budget); if (state === 'atteint') { fails = 0; continue; } if ((state === 'bloqué' || state === 'temps') && ++fails < 4) continue; break; }
    if ((state === 'bloqué' || state === 'temps') && fails < 4) state = 'atteint';
    return { routed: !!r, metres: r ? Math.round(r.metres) : null, state, at: Math.round(g.frontier.position().x) };
  };
  S.label = () => document.getElementById('minimapWrap')?.querySelector('.minimap-label')?.textContent;
});

// 2. Courte sortie à pied par le passage est, puis retour par la même porte : libellé de la minicarte dans la cité.
const label = await page.evaluate(() => {
  const g = DEADWALL, S = globalThis.__atlas217, H = S.H, lane = g.world.terrain217.sides.east.entries[0], y = H.minY + (lane.from + lane.to) / 2;
  const before = S.label(); const size = g.local.size;
  let spot = null; for (let ty = 0; ty < 192 && !spot; ty++) { const px = size - 50, py = ty * 32 + 16; if (g.world.reach217(px, py) && g.friendlyPositionClear(g.player, px, py)) spot = { x: px, y: py }; }
  g.player.x = spot.x; g.player.y = spot.y; const entered = g.frontier.enter();
  for (let i = 0; i < 30; i++) S.frame([]); g.renderMinimap(); const outside = S.label();
  let r = S.goTo({ x: H.maxX + 12, y }, 900); if (r === 'atteint') r = S.goTo({ x: H.maxX + 1.5, y }, 900);
  let frames = 0, immediate = null; for (; frames < 300 && g.frontier.active(); frames++) { S.frame(['KeyA']); if (!g.frontier.active()) immediate = S.label(); }
  g.renderMinimap(); return { before, entered, outside, r, frames, back: !g.frontier.active(), immediate, after: S.label() };
});
log('libellé', JSON.stringify(label));
await page.evaluate(() => { const g = DEADWALL; g.camera.x = g.player.x; g.camera.y = g.player.y; g.render(); g.renderMinimap(); });
await shotOf('#minimapWrap', '01-minicarte-cite-apres-retour');

// 3. Garage, voiture, sortie au volant par le passage est, puis KM kilomètres plein est.
const prep = await page.evaluate(() => {
  const g = DEADWALL, S = globalThis.__atlas217;
  const d = g.serialize(); d.urban.peakScore = 2200; d.urban.progression151 = { version: 1, age: 10 }; d.resources = { wood: 5000, scrap: 5000, stone: 5000, food: 5000, fuel: 2000, ammo: 5000, medicine: 50 }; g.restoreSave(d);
  const core = g.core();
  const build = type => { const def = g.world.definition(type); if (def.requires && !g.world.has(def.requires)) build(def.requires); for (let r = 6; r < 45; r++) for (let x = core.gx - r; x <= core.gx + r; x++) for (const y of [core.gy - r, core.gy + r]) if (g.world.placement(def, x, y, 0).valid && g.placeOne(type, x, y)) { const b = g.world.atCell(x, y); b.progress = 1; b.health = b.maxHealth; g.completeBuilding?.(b); g.refreshMetrics(true); return b; } return null; };
  const garage = build('expeditionGarage'); g.player.x = core.x + 20; g.player.y = core.bottom + 60;
  const built = g.expeditions.buildCar(), v = g.expeditions.car(); v.fuel = 24; g.player.x = v.x; g.player.y = v.y + 30;
  const board = g.expeditions.board(), size = g.local.size; let spot = null;
  for (let y = 0; y < 192 && !spot; y++) { const px = size - 260, py = y * 32 + 16; if (!g.world.reach217(px, py) || !g.expeditions.carClear(px, py)) continue; let ok = true; for (let x = px; x < size - 70; x += 32) if (!g.expeditions.carClear(x, py)) ok = false; if (ok) spot = { x: px, y: py }; }
  v.x = g.player.x = spot.x; v.y = g.player.y = spot.y; v.angle = 0;
  for (let i = 0; i < 600 && !g.frontier.active(); i++) S.frame(['KeyD']);
  return { garage: !!garage, built: built?.ok ?? built, board: board?.ok ?? board, active: g.frontier.active(), pos: g.frontier.position() };
});
log('sortie', JSON.stringify(prep));
const legs = [];
await page.evaluate(() => { const S = globalThis.__atlas217; S.goTo({ x: DEADWALL.frontier.position().x + 30, y: DEADWALL.frontier.position().y }, 900); });
for (let leg = 0; leg < 30; leg++) {
  const r = await page.evaluate(([goal, y]) => globalThis.__atlas217.leg(goal, y, 1500), [prep.pos.x + KM * 1000, prep.pos.y]);
  legs.push(r); log('aller', JSON.stringify(r));
  if (r.state !== 'atteint' || r.at >= prep.pos.x + KM * 1000 - 10) break;
}
await page.evaluate(() => { const g = DEADWALL, S = globalThis.__atlas217, v = g.expeditions.car(); S.fill = false; v.fuel = 14; v.cargo.fuel = 4; for (let i = 0; i < 6; i++) S.frame([]); g.renderMinimap(); });
await shot('02-route-10km');
await shotOf('#minimapWrap', '03-minicarte-10km');

// 4. Atlas : fenêtre des cantons vus, sonde E9.
const atlas = await page.evaluate(() => {
  const g = DEADWALL, w = g.frontier.world(), keys = s => ({ generated: s.generated, misses: s.misses, size: s.size, routes: s.routes, evictions: s.evictions });
  const before = keys(w.streamStats()), t = performance.now(); const opened = g.frontierUI.open(); g.frontierUI.atlas.fit(); const ms = performance.now() - t; const after = keys(w.streamStats());
  const v = g.frontier.overview(), win = g.openAtlas217.window(v), range = g.openAtlas217.range(v);
  return { opened, ms: Math.round(ms), before, after, same: JSON.stringify(before) === JSON.stringify(after), cantons: v.cantons.length, pos: { x: Math.round(v.x), y: Math.round(v.y) }, window: win, range: { reach: Math.round(range.reach), back: range.back, gap: Math.round(range.gap), fuel: range.fuel }, provenance: document.getElementById('atlasWorld')?.textContent, memory: g.openAtlas217.memory(), camera: g.frontierUI.atlas.position() };
});
log('atlas', JSON.stringify(atlas));
await page.evaluate(() => document.getElementById('frontierMap')?.scrollIntoView({ block: 'center' }));
await shot('04-atlas-fenetre-cantons-vus');
await page.evaluate(() => { DEADWALL.frontierUI.atlas.locate(); DEADWALL.frontierUI.atlas.zoom(1 / 3); document.getElementById('frontierMap')?.scrollIntoView({ block: 'center' }); });
await shot('05-atlas-joueur-rayon');
const pan = await page.evaluate(() => { const a = DEADWALL.frontierUI.atlas; a.fit(); a.pan(-100000, 0); const east = a.position(); a.pan(200000, 0); const west = a.position(); return { east: Math.round(east.x), west: Math.round(west.x) }; });
log('butées de la fenêtre', JSON.stringify(pan));

// 5. Repère lointain (au-delà de 25 cantons) : GPS par le graphe des coutures.
const gps = await page.evaluate(() => {
  const g = DEADWALL, w = g.frontier.world(), p = g.frontier.position(); let target = null;
  for (let k = 30; k < 40 && !target; k++) { const s = w.nearestSite(p.x + k * 1024, p.y, () => true, 1024); if (s) target = w.site(s.id); }
  g.frontier.revealSites([target.id]); const pinned = g.frontier.pin(target.id);
  const times = []; let r = null, calls = 0; do { const t = performance.now(); r = g.frontier.guidance(); times.push(+(performance.now() - t).toFixed(1)); calls++; } while (r?.macro === 'preparing' && calls < 600);
  g.renderMinimap(); g.frontierUI.refresh(true); g.frontierUI.atlas.fit();
  return { target: target.id, straight: Math.round(Math.hypot(target.x - p.x, target.y - p.y)), pinned, calls, maxMs: Math.max(...times), medianMs: times.slice().sort((a, b) => a - b)[times.length >> 1], status: r?.macro, metres: Math.round(r?.metres || 0), name: r?.name, seams: r?.seams, detailed: r?.detailed, points: r?.path?.length, readout: g.frontierUI.navigation() };
});
log('gps', JSON.stringify(gps));
await page.evaluate(() => document.getElementById('frontierMap')?.scrollIntoView({ block: 'center' }));
await shot('06-atlas-gps-coutures');
await page.evaluate(() => { DEADWALL.showCommand?.(false); DEADWALL.recon?.close?.(); DEADWALL.render(); DEADWALL.renderMinimap(); });
await shotOf('#minimapWrap', '07-minicarte-gps');

// 6. Sauvegarde et reprise : atlas après reprise (cantons vus non relevés : tracé approché).
const resumed = await page.evaluate(() => {
  const g = DEADWALL, ok = g.save(true), raw = localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY), back = g.restoreSave(globalThis.DeadwallSave.parse(raw));
  const w = g.frontier.world(), keys = s => JSON.stringify([s.generated, s.misses, s.size, s.routes]), before = keys(w.streamStats());
  g.frontierUI.open(); g.frontierUI.atlas.fit(); const same = keys(w.streamStats()) === before;
  return { ok, bytes: raw?.length, back, active: g.frontier.active(), memory: g.openAtlas217.memory(), same, hasAtlasKey: raw.includes('openAtlas217') };
});
log('reprise', JSON.stringify(resumed));
await page.evaluate(() => document.getElementById('frontierMap')?.scrollIntoView({ block: 'center' }));
await shot('08-atlas-apres-reprise');
const frames = await page.evaluate(() => { const S = globalThis.__atlas217, ms = S.frames.slice().sort((a, b) => a - b), q = p => +ms[Math.min(ms.length - 1, Math.floor(p * ms.length))].toFixed(1); return { count: ms.length, median: q(.5), p95: q(.95), max: +ms.at(-1).toFixed(1) }; });
const report = { km: KM, label, prep, legs, atlas, pan, gps, resumed, frames, errors };
writeFileSync(join(out, 'openworld217-atlas.json'), JSON.stringify(report, null, 1));
log(JSON.stringify({ label, atlas: { same: atlas.same, cantons: atlas.cantons, window: atlas.window && [atlas.window.x0, atlas.window.x1, atlas.window.y0, atlas.window.y1] }, gps, resumed, frames, errors: errors.length }, null, 1));
await browser.close();
if (errors.length) { console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
