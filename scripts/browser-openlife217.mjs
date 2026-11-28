// Harnais de navigateur de la faune et des épaves des cantons (specs/monde-sans-bord/tasks.md, T5.4 ; src/openlife217.js).
// Parcours joueur par le menu public : option « MONDE : Sans bord — expérimental », départ dans la cité adossée, garage et
// voiture, sortie au volant par le passage est, conduite jusqu’à la route la plus proche d’un gibier des cantons, descente, tir réel (visée à la souris,
// arme du commandant) jusqu'à l'animal abattu, sauvegarde et reprise (la dépouille reste), conduite jusqu'à une épave d'un
// lieu, fouille du coffre (E), démontage, sauvegarde et reprise en pleine sortie. Mesures : animaux vivants vus, temps des
// images (mise à jour et rendu), taille du bloc de sauvegarde de la faune, erreurs de page.
// Le harnais pilote : boucle du jeu suspendue (images pas à pas), voiture posée sur la voie d'entrée est, réservoir rempli,
// caisse et santé du commandant entretenues, calme prolongé dans la cité ; aucune règle du jeu n'est remplacée.
// Usage : PORT=8754 node scripts/server.mjs &  puis  node scripts/browser-openlife217.mjs <port> <dossier>
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire('/')('playwright');
const [port = '8754', out = join(root, 'reports', 'openlife217')] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e?.stack || e?.message || e).slice(0, 600)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 600)); });
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__hold217 = false;
  window.requestAnimationFrame = cb => raf(t => { if (window.__hold217) window.requestAnimationFrame(cb); else cb(t); });
});
await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => globalThis.DEADWALL && typeof globalThis.DEADWALL.startNew === 'function' && document.getElementById('worldOpen217'));
await page.waitForTimeout(600);
const shot = async name => { await page.screenshot({ path: join(out, name + '.png') }); log('capture', name); };

// 1. Menu : option « Sans bord — expérimental », départ par le bouton.
await page.evaluate(() => {
  const d = document.getElementById('campaignMap132'); if (d) d.open = true;
  const select = document.getElementById('worldOpen217'); select.value = 'open'; select.dispatchEvent(new Event('change'));
  const seed = document.getElementById('mapSeed'); seed.value = '17117'; seed.dispatchEvent(new Event('input'));
  globalThis.confirm = () => true; document.getElementById('newGameButton').click();
});
await page.waitForFunction(() => DEADWALL.state === 'playing');
await page.evaluate(() => DEADWALL.campaignIntro132?.skip?.());
await page.waitForTimeout(1200);
const start = await page.evaluate(() => { const g = DEADWALL; return { generation: g.frontier.position().generation, open: g.openWorld217?.active(), life: g.openLife217?.snapshot(), lifeModule: !!g.expansions.get('openlife217') }; });
log('départ', JSON.stringify(start));

// 2. Garage, voiture sur la voie d'entrée est, au volant (comme le harnais d'O9).
const prep = await page.evaluate(() => {
  window.__hold217 = true; const g = DEADWALL;
  const d = g.serialize(); d.urban.peakScore = 2200; d.urban.progression151 = { version: 1, age: 10 }; d.resources = { wood: 5000, scrap: 5000, stone: 5000, food: 5000, fuel: 2000, ammo: 5000, medicine: 50 }; g.restoreSave(d);
  const core = g.core();
  const build = type => { const def = g.world.definition(type); if (def.requires && !g.world.has(def.requires)) build(def.requires); for (let r = 6; r < 45; r++) for (let x = core.gx - r; x <= core.gx + r; x++) for (const y of [core.gy - r, core.gy + r]) if (g.world.placement(def, x, y, 0).valid && g.placeOne(type, x, y)) { const b = g.world.atCell(x, y); b.progress = 1; b.health = b.maxHealth; g.completeBuilding?.(b); g.refreshMetrics(true); return b; } return null; };
  const garage = build('expeditionGarage'); g.player.x = core.x + 20; g.player.y = core.bottom + 60;
  const built = g.expeditions.buildCar(), v = g.expeditions.car(); v.fuel = 24; g.player.x = v.x; g.player.y = v.y + 30;
  const board = g.expeditions.board();
  const S = g.local.size; let spot = null;
  for (let y = 0; y < 192 && !spot; y++) { const px = S - 260, py = y * 32 + 16; if (!g.world.reach217(px, py) || !g.expeditions.carClear(px, py)) continue; let ok = true; for (let x = px; x < S - 70; x += 32) if (!g.expeditions.carClear(x, py)) ok = false; if (ok) spot = { x: px, y: py }; }
  v.x = g.player.x = spot.x; v.y = g.player.y = spot.y; v.angle = 0; g.camera.x = spot.x; g.camera.y = spot.y;
  return { garage: !!garage, built: built?.ok ?? built, board: board?.ok ?? board, spot };
});
log('voiture', JSON.stringify(prep));

// Pas à pas : touches de direction vers une cible, mesures par image.
await page.evaluate(() => {
  const g = DEADWALL, O = globalThis.DeadwallOpenWorld217;
  const DIRS = [['KeyD'], ['KeyD', 'KeyS'], ['KeyS'], ['KeyA', 'KeyS'], ['KeyA'], ['KeyA', 'KeyW'], ['KeyW'], ['KeyD', 'KeyW']];
  const H = O.home(g.world.seed), inHome = p => p.x > H.minX - 8 && p.x < H.maxX + 8 && p.y > H.minY - 8 && p.y < H.maxY + 8;
  const S = globalThis.__life217 = { tick: 0, frames: [], seen: new Set(), stuck: 0, prev: null, inHome };
  S.frame = keys => {
    for (const k of DIRS.flat()) g.input.keys.delete(k); for (const k of keys || []) g.input.keys.add(k);
    const t = performance.now(); g.update(1 / 30); if (S.tick++ % 2 === 0) g.render(); const ms = performance.now() - t;
    const v = g.expeditions.car(); if (v) { S.carHealth ??= v.health; if (v.health > 0) { v.fuel = 24; v.health = Math.max(v.health, S.carHealth); } }
    S.hp ??= g.player.maxHealth || g.player.health; if (g.player.health > 0) g.player.health = Math.max(g.player.health, S.hp);
    if (g.phase === 'calm') g.phaseTime = Math.max(g.phaseTime, 600);
    if (g.frontier.active()) { S.frames.push(ms); for (const a of g.frontier.wildlife165()) S.seen.add(a.id + '|' + a.species); }
    return ms;
  };
  S.goTo = (target, max, reach = 6) => {
    for (let i = 0; i < max; i++) {
      const f = g.frontier.position(); if (!f.active) return 'cité';
      if (Math.hypot(target.x - f.x, target.y - f.y) < reach) return 'atteint';
      let idx = ((Math.round(Math.atan2(target.y - f.y, target.x - f.x) / (Math.PI / 4)) % 8) + 8) % 8; if (S.stuck > 8) idx = (idx + (S.stuck > 20 ? 7 : 1)) % 8;
      S.frame(DIRS[idx]); const q = g.frontier.position();
      if (S.prev && Math.hypot(q.x - S.prev.x, q.y - S.prev.y) < .05) S.stuck++; else S.stuck = Math.max(0, S.stuck - 1); S.prev = { x: q.x, y: q.y };
      if (S.stuck > 60) { S.stuck = 0; return 'bloqué'; }
    }
    return 'temps';
  };
  // Itinéraire par le graphe routier des cantons jusqu'au point, puis approche directe.
  S.route = (to, budget, reach) => {
    const w = g.frontier.world(), from = g.frontier.position(), r = w.route(from, to), path = r ? r.path.slice(1).filter(p => !inHome(p)) : [];
    let state = 'atteint'; for (const p of path) { state = S.goTo(p, budget); if (state === 'cité') break; }
    state = S.goTo(to, budget, reach); return { routed: !!r, state, at: { x: Math.round(g.frontier.position().x), y: Math.round(g.frontier.position().y) } };
  };
  S.dismount = () => { if (g.frontier.position().car?.driving) g.frontier.board(); for (let i = 0; i < 3; i++) S.frame([]); return !g.frontier.position().car?.driving; };
  S.mount = () => { if (!g.frontier.position().car?.driving) g.frontier.board(); return !!g.frontier.position().car?.driving; };
  // Visée à la souris (même calcul que le jeu : direction depuis le centre de l'écran) et tir de l'arme en main.
  S.fireAt = (id, tries) => {
    for (let i = 0; i < tries; i++) {
      const a = g.frontier.wildlife165().find(e => e.id === id); if (!a) return g.frontier.wildlifeStatus165(id)?.hp === 0 ? 'abattu' : 'perdu';
      // Gibier en fuite au-delà de 12 m : poursuite à pied (30 images) avant de viser.
      let f = g.frontier.position(); if (Math.hypot(a.x - f.x, a.y - f.y) > 12) { S.goTo(a, 30, 8); continue; }
      const ang = Math.atan2(a.y - f.y, a.x - f.x);
      g.input.mouseX = g.width / 2 + Math.cos(ang) * 120; g.input.mouseY = g.height / 2 + Math.sin(ang) * 120; S.frame([]);
      if (g.player.magazine[g.player.weapon] <= 0) { g.player.magazine[g.player.weapon] = 0; for (let k = 0; k < 120 && g.player.reload > 0; k++) S.frame([]); }
      g.frontier.shoot(); for (let k = 0; k < 8; k++) S.frame([]);
    }
    return g.frontier.wildlifeStatus165(id)?.hp === 0 ? 'abattu' : 'manqué';
  };
});
const exitState = await page.evaluate(() => { const S = globalThis.__life217; for (let i = 0; i < 600 && !DEADWALL.frontier.active(); i++) S.frame(['KeyD']); return { active: DEADWALL.frontier.active(), pos: DEADWALL.frontier.position() }; });
log('sortie', JSON.stringify({ active: exitState.active, x: exitState.pos.x, y: exitState.pos.y, car: exitState.pos.car?.driving }));
await page.evaluate(() => { for (let i = 0; i < 6; i++) DEADWALL.render(); });
await shot('01-sortie-volant');

// 3. Gibier : le plus proche animal terrestre de gibier, admis, près d'une route ; arrêt au bord de la route.
const target = await page.evaluate(() => {
  const g = DEADWALL, L = globalThis.DeadwallOpenLife217, w = g.frontier.world(), f = g.frontier.position(), Y = globalThis.DeadwallCore.WildlifeHarvest190Rules.yields;
  const list = L.around(w, f.x, f.y, 1400).animals.filter(a => a.profile.mode === 'land' && Y[a.species] >= 3 && L.admitted(w, a) && w.nearestRoad(a)?.d < 60);
  // Arrêt au point de route le plus proche de l'animal, puis approche à pied.
  const a = list[0]; if (!a) return null; const r = w.nearestRoad(a);
  return { id: a.id, species: a.species, name: a.profile.name, x: a.x, y: a.y, road: { x: r.x, y: r.y, d: r.d }, stop: { x: r.x, y: r.y }, candidates: list.length };
});
log('gibier', JSON.stringify(target));
const drive = await page.evaluate(t => globalThis.__life217.route(t.stop, 2400, 8), target);
log('conduite', JSON.stringify(drive));
const meet = await page.evaluate(t => {
  const g = DEADWALL, S = globalThis.__life217; S.dismount();
  // À pied jusqu'à 14 m de l'animal (au-delà de sa distance de fuite au repos).
  const f0 = g.frontier.position(), d0 = Math.hypot(t.x - f0.x, t.y - f0.y), goal = d0 > 14 ? { x: t.x + (f0.x - t.x) * 14 / d0, y: t.y + (f0.y - t.y) * 14 / d0 } : f0;
  const walk = S.goTo(goal, 900, 2);
  // Regard tourné vers l'animal (cône de vue du commandant) avant la capture.
  // Plein jour (harnais, comme les tests de la récolte : dayClock 0,45) pour que la capture montre l'animal.
  g.dayClock = .45; const f1 = g.frontier.position(), ang = Math.atan2(t.y - f1.y, t.x - f1.x); g.input.mouseX = g.width / 2 + Math.cos(ang) * 120; g.input.mouseY = g.height / 2 + Math.sin(ang) * 120; S.frame([]);
  const f = g.frontier.position(), live = g.frontier.wildlife165();
  g.camera.x = f.x; g.camera.y = f.y;
  g.render(); const seen = g.visibility?.frame?.()?.canSeeRegional?.(live.find(a => a.id === t.id)) ?? null;
  return { walk, distance: Math.hypot(t.x - f.x, t.y - f.y), live: live.length, present: live.some(a => a.id === t.id), visible: seen, species: [...new Set(live.map(a => a.species))] };
}, target);
log('rencontre', JSON.stringify(meet));
await page.evaluate(() => { for (let i = 0; i < 4; i++) DEADWALL.render(); });
await shot('02-rencontre-gibier');
const hunt = await page.evaluate(t => { const g = DEADWALL, r = globalThis.__life217.fireAt(t.id, 120); return { result: r, shots: g.stats.shots, status: g.frontier.wildlifeStatus165(t.id), kills: g.openLife217.kills() }; }, target);
log('tir', JSON.stringify(hunt));
await page.evaluate(() => { for (let i = 0; i < 4; i++) DEADWALL.render(); });
await shot('03-gibier-abattu');
// 4. Sauvegarde et reprise : la dépouille reste à sa place, l'animal ne revit pas.
const saved1 = await page.evaluate(t => {
  const g = DEADWALL, ok = g.save(true), raw = localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY), block = JSON.parse(raw).expansions127.modules.openlife217;
  const back = g.restoreSave(globalThis.DeadwallSave.parse(raw)); for (let i = 0; i < 3; i++) globalThis.__life217.frame([]);
  return { ok, bytes: raw.length, block, blockBytes: JSON.stringify(block).length, frontierWildlife: JSON.parse(raw).frontier.wildlife165, restored: back, alive: g.frontier.wildlife165().some(a => a.id === t.id), remains: g.frontier.wildlifeRemains165(60).filter(a => a.id === t.id).map(a => ({ x: a.x, y: a.y, hp: a.hp })) };
}, target);
log('reprise gibier', JSON.stringify(saved1));
await shot('04-reprise-depouille');

// 5. Épave : véhicule garé d'un lieu proche, coffre fouillé (E), démontage.
const wreck = await page.evaluate(() => {
  const g = DEADWALL, w = g.frontier.world(), f = g.frontier.position(), Gm = globalThis.DeadwallFrontierGeometry, Sv = globalThis.DeadwallFrontierSurvey, K = globalThis.DeadwallWorldCantons217;
  const rows = []; const c = K.at(f.x, f.y);
  for (const q of K.ring(c.cx, c.cy, 1)) for (const p of w.placesOf(q.cx, q.cy)) for (const v of p.parking) { if (['bike', 'skate'].includes(v.type)) continue; for (const side of [-1, 1]) { const s = Gm.global(v, v.w / 2, side < 0 ? -.75 : v.h + .75); if (!w.blocked(s.x, s.y, .32, 0, null) && w.line(s, Sv.edge(s, v), 0, null, v.id, .025)) { rows.push({ site: p.id, name: p.name, id: v.id, type: v.type, amount: v.amount, x: v.x, y: v.y, stand: s, d: Math.hypot(s.x - f.x, s.y - f.y) }); break; } } }
  rows.sort((a, b) => a.d - b.d); return rows[0] || null;
});
log('épave', JSON.stringify(wreck));
const toWreck = await page.evaluate(t => { const S = globalThis.__life217; S.mount(); const r = S.route({ x: t.stand.x, y: t.stand.y }, 2400, 10); S.dismount(); const a = S.goTo(t.stand, 900, .35); return { ...r, walk: a, d: Math.hypot(DEADWALL.frontier.position().x - t.stand.x, DEADWALL.frontier.position().y - t.stand.y) }; }, wreck);
log('vers l’épave', JSON.stringify(toWreck));
const search = await page.evaluate(t => {
  const g = DEADWALL, S = globalThis.__life217, C = globalThis.DeadwallCore; let frames = 0;
  // Occupants proches écartés par la santé entretenue ; le sac est vidé au dépôt fictif du harnais (capacité du sac seule).
  for (; frames < 3000 && (g.frontier.snapshot().taken[t.id] || 0) < t.amount - 1e-7; frames++) { S.frame(['KeyE']); for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0; }
  g.input.keys.delete('KeyE'); S.frame([]);
  const taken = g.frontier.snapshot().taken[t.id] || 0, seen = g.frontier.snapshot().seen.includes(t.site);
  let dismantled = 0, reasons = [];
  for (let n = 0; n < 6 && g.travel131.wreckStatus(t.id)?.remaining; n++) {
    for (const k of C.RESOURCE_KEYS) g.player.carry[k] = 0; g.player.carry.scrap = 1;
    const r = g.travel131.begin('dismantle', t.id); if (!r.ok) { reasons.push(r.reason); break; }
    for (let i = 0; i < Math.ceil(C.Travel131Rules.dismantleSeconds * 30) + 4 && g.travel131.busy(); i++) S.frame([]);
    dismantled += g.player.carry.scrap;
  }
  return { frames, taken, seen, dismantled, status: g.travel131.wreckStatus(t.id), reasons, interaction: g.interactionText };
}, wreck);
log('fouille et démontage', JSON.stringify(search));
await page.evaluate(() => { const g = DEADWALL, f = g.frontier.position(); g.camera.x = f.x; g.camera.y = f.y; for (let i = 0; i < 4; i++) g.render(); });
await shot('05-epave-demontee');
const saved2 = await page.evaluate(t => {
  const g = DEADWALL, ok = g.save(true), raw = localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY), d = JSON.parse(raw);
  const before = JSON.stringify(g.frontier.snapshot()), back = g.restoreSave(globalThis.DeadwallSave.parse(raw));
  return { ok, bytes: raw.length, restored: back, same: JSON.stringify(g.frontier.snapshot()) === before, wrecks: d.expansions127.modules.exploration131.wrecks, taken: d.frontier.taken[t.id], status: g.travel131.wreckStatus(t.id), kills: d.expansions127.modules.openlife217.kills, overview: g.openLife217.overview().rows };
}, wreck);
log('reprise épave', JSON.stringify(saved2));
const perf = await page.evaluate(() => { const S = globalThis.__life217, ms = S.frames.slice().sort((a, b) => a - b), q = p => +ms[Math.min(ms.length - 1, Math.floor(p * ms.length))].toFixed(1); return { frames: ms.length, median: q(.5), p95: q(.95), p99: q(.99), max: +ms.at(-1).toFixed(1), animalsSeen: S.seen.size, species: [...new Set([...S.seen].map(s => s.split('|')[1]))] }; });
await page.evaluate(() => { window.__hold217 = false; });
await page.waitForTimeout(1500);
await shot('06-apres-reprise');
const report = { start, prep, exitState, target, drive, meet, hunt, saved1, wreck, toWreck, search, saved2, perf, errors };
writeFileSync(join(out, 'openlife217.json'), JSON.stringify(report, null, 1));
log(JSON.stringify({ perf, hunt: hunt.result, kept: saved1.remains.length, alive: saved1.alive, dismantled: search.dismantled, errors: errors.length }));
await browser.close();
if (errors.length) { console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
