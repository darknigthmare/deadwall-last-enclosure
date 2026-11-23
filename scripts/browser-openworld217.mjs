// Harnais de navigateur de l'ouverture « Sans bord — expérimental » (specs/monde-sans-bord/ouverture.md, O9 ; tasks.md,
// T5.6). Parcours joueur par le menu public : option « MONDE : Sans bord — expérimental », fiche de graine (côtés fermés,
// passages), départ dans la cité de 192 m adossée, vague à fronts ouverts, garage et voiture, sortie par un passage
// ouvert, KM kilomètres en voiture plein est par les routes des cantons, sauvegarde, reprise, retour à D-17 par le même
// chemin, sauvegarde et reprise dans la cité. Mesures : empreinte de chaque canton traversé aux deux passages (identiques),
// temps des images (mise à jour et rendu) et image la plus lente à moins de 40 m d'une couture de cantons.
// Le harnais pilote : boucle du jeu suspendue (images pas à pas), voiture posée sur la voie d'entrée est et réservoir
// rempli et caisse réparée à chaque image (ni le carburant ni le combat ne sont l'objet de la mesure ; calme prolongé dans la cité), touches de direction choisies vers le prochain
// point de l'itinéraire ; aucune règle du jeu n'est remplacée.
// Usage : PORT=8751 node scripts/server.mjs &  puis  node scripts/browser-openworld217.mjs <port> <dossier> [km]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire('/')('playwright');
const [port = '8751', out = join(root, 'reports', 'openworld217'), kmText = '20'] = process.argv.slice(2);
const KM = Number(kmText);
mkdirSync(out, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e?.stack || e?.message || e).slice(0, 600)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 600)); });
// Boucle du jeu suspendable : tant que `__hold217` est vrai, la boucle du jeu attend ; le harnais avance image par image.
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__hold217 = false;
  window.requestAnimationFrame = cb => raf(t => { if (window.__hold217) window.requestAnimationFrame(cb); else cb(t); });
});
await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => globalThis.DEADWALL && typeof globalThis.DEADWALL.startNew === 'function' && document.getElementById('worldOpen217'));
await page.waitForTimeout(600);
const shot = async name => { await page.screenshot({ path: join(out, name + '.png') }); log('capture', name); };

// 1. Menu : option et fiche de graine (aperçu sans tirage de jeu).
const menu = await page.evaluate(() => {
  const d = document.getElementById('campaignMap132'); if (d) d.open = true;
  const select = document.getElementById('worldOpen217'); select.value = 'open'; select.dispatchEvent(new Event('change'));
  const seed = document.getElementById('mapSeed'); seed.value = '17117'; seed.dispatchEvent(new Event('input'));
  select.scrollIntoView?.({ block: 'center' });
  return { options: [...select.options].map(o => o.value + ':' + o.textContent), hint: document.getElementById('worldOpenHint217')?.textContent };
});
await shot('00-menu-option-monde');
await page.evaluate(() => document.getElementById('seedCard217PreviewButton')?.click());
await page.waitForFunction(() => { const b = document.getElementById('seedCard217Preview'); return b && !b.hidden && document.getElementById('seedCard217PreviewFacts')?.children.length > 0; }, null, { timeout: 60000 });
const card = await page.evaluate(() => ({ title: document.getElementById('seedCard217PreviewTitle').textContent, facts: [...document.getElementById('seedCard217PreviewFacts').children].map(n => n.textContent), advice: document.getElementById('seedCard217PreviewAdvice').textContent }));
await page.evaluate(() => document.getElementById('seedCard217Preview')?.scrollIntoView());
await shot('01-menu-option-fiche');

// 2. Départ par le bouton du menu.
await page.evaluate(() => { globalThis.confirm = () => true; document.getElementById('newGameButton').click(); });
await page.waitForFunction(() => DEADWALL.state === 'playing');
await page.evaluate(() => DEADWALL.campaignIntro132?.skip?.());
await page.waitForTimeout(1500);
// Vue d'ensemble : boucle suspendue le temps d'une image dézoomée sur la cité entière (falaises, passages).
const overview = async (name, at, zoom) => { await page.evaluate(([at, zoom]) => { window.__hold217 = true; const g = DEADWALL, c = { ...g.camera }; Object.assign(g.camera, { x: at?.x ?? g.local.size / 2, y: at?.y ?? g.local.size / 2, zoom }); g.render(); g.renderMinimap?.(); window.__camera217 = c; }, [at, zoom]); await shot(name); await page.evaluate(() => { Object.assign(DEADWALL.camera, window.__camera217); window.__hold217 = false; }); };
await page.evaluate(() => { window.__start217 = JSON.stringify(DEADWALL.serialize()); });
const start = await page.evaluate(() => { const g = DEADWALL; return { generation: g.frontier.position().generation, tiles: g.local.size / 32, terrain: !!g.world.terrain217, open: g.openWorld217?.snapshot(), save: g.lastSaveStatus?.ok, sides: Object.values(g.world.terrain217?.sides || {}).map(s => s.side + ':' + s.status + ':' + s.width) }; });
await shot('02-cite-192m-depart');
await overview('02b-cite-192m-ensemble', null, .17);

// 3. Vague à fronts ouverts, en temps réel (boucle du jeu).
// Vague 5 (premier plan à plusieurs fronts, comme le harnais d'O7) annoncée et jouée.
await page.evaluate(() => { const g = DEADWALL; g.wave = 5; g.phaseTime = .5; });
await page.waitForFunction(() => DEADWALL.phase === 'assault' || DEADWALL.phase === 'warning', null, { timeout: 30000 });
await page.waitForTimeout(16000);
const wave = await page.evaluate(() => { const g = DEADWALL; const sides = {}; for (const z of g.zombies) { const s = g.local.size, k = z.x > s * .75 ? 'est' : z.x < s * .25 ? 'ouest' : z.y < s * .25 ? 'nord' : z.y > s * .75 ? 'sud' : 'centre'; sides[k] = (sides[k] || 0) + 1; } return { phase: g.phase, wave: g.wave, fronts: g.wavePlan?.fronts || g.fronts, zombies: g.zombies.length, where: sides, line: document.getElementById('siegeReadoutFronts')?.textContent || null }; });
await shot('03-vague-fronts-ouverts');
await overview('03b-vague-ensemble', null, .17);

// 4. Garage, voiture, sortie par le passage est (harnais : boucle suspendue, voiture posée sur la voie d'entrée).
const prep = await page.evaluate(() => {
  window.__hold217 = true; const g = DEADWALL;
  // Reprise de la sauvegarde du départ (avant la vague), à l'âge 10 et avec des réserves : garage et voiture au calme.
  const d = JSON.parse(window.__start217); d.urban.peakScore = 2200; d.urban.progression151 = { version: 1, age: 10 }; d.resources = { wood: 5000, scrap: 5000, stone: 5000, food: 5000, fuel: 2000, ammo: 5000, medicine: 50 }; g.restoreSave(d);
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
await page.evaluate(() => DEADWALL.render());
await shot('04-voiture-voie-est');

// Pas à pas : n images, touches de direction vers une cible, mesures par image.
await page.evaluate(() => {
  const g = DEADWALL, K = globalThis.DeadwallWorldCantons217, O = globalThis.DeadwallOpenWorld217;
  const DIRS = [['KeyD'], ['KeyD', 'KeyS'], ['KeyS'], ['KeyA', 'KeyS'], ['KeyA'], ['KeyA', 'KeyW'], ['KeyW'], ['KeyD', 'KeyW']];
  const H = O.home(g.world.seed), inHome = p => p.x > H.minX - 8 && p.x < H.maxX + 8 && p.y > H.minY - 8 && p.y < H.maxY + 8;
  const S = globalThis.__run217 = { tick: 0, frames: [], prints: { aller: {}, retour: {} }, trail: [], pass: 'aller', stuck: 0, prev: null };
  const near = (x, y) => { const c = K.at(x, y), b = K.bounds(c.cx, c.cy); return Math.min(x - b.x, b.x + b.w - x, y - b.y, b.y + b.h - y); };
  S.frame = keys => {
    for (const k of DIRS.flat()) g.input.keys.delete(k); for (const k of keys || []) g.input.keys.add(k);
    // Rendu une image sur deux (le temps du harnais) : la mesure garde la mise à jour seule ou la mise à jour et le rendu.
    const t = performance.now(); g.update(1 / 30); if (S.tick++ % 2 === 0) g.render(); const ms = performance.now() - t;
    const f = g.frontier.position(); const v = g.expeditions.car();
    // Réservoir plein et caisse remise à neuf (les hordes régionales l'endommagent) : ni le carburant ni le combat ne sont mesurés ici.
    if (v) { S.carHealth ??= v.health; if (v.health > 0) { v.fuel = 24; v.health = Math.max(v.health, S.carHealth); } }
    // La cité n'est pas l'objet de la mesure : le calme est prolongé pendant la sortie (sinon la vague suivante l'attaque sans défense).
    if (g.phase === 'calm') g.phaseTime = Math.max(g.phaseTime, 600);
    if (f.active) { const c = K.at(f.x, f.y), id = K.id(c.cx, c.cy), w = g.frontier.world(); if (!(id in S.prints[S.pass])) { const k = w.canton(c.cx, c.cy); S.prints[S.pass][id] = k.digest + ':' + w.placesOf(c.cx, c.cy).map(p => p.id + '@' + p.x.toFixed(2) + ',' + p.y.toFixed(2)).join(';'); }
      S.frames.push([ms, near(f.x, f.y), S.pass === 'aller' ? 1 : 2]); }
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
  // Une étape d'itinéraire vers l'est : jusqu'à 2,5 km, par le graphe routier des cantons.
  S.leg = (goalX, y0, budget) => {
    const w = g.frontier.world(), from = g.frontier.position(), to = { x: Math.min(goalX, from.x + 2500), y: y0 }, r = w.route(from, to);
    const path = r ? r.path.slice(1).filter(p => !inHome(p)) : [to]; let state = 'atteint', n = 0;
    let fails = 0; for (const p of path) { state = S.goTo(p, budget); n++; if (state === 'atteint') { S.trail.push({ x: p.x, y: p.y }); fails = 0; continue; } if ((state === 'bloqué' || state === 'temps') && ++fails < 4) continue; break; }
    if ((state === 'bloqué' || state === 'temps') && fails < 4) state = 'atteint';
    return { routed: !!r, metres: r ? Math.round(r.metres) : null, state, at: Math.round(g.frontier.position().x), points: n };
  };
  // Une étape vers un point quelconque (retour) : jusqu'à 2,5 km dans sa direction, par le graphe routier.
  S.legToward = (goal, budget) => {
    const w = g.frontier.world(), from = g.frontier.position(), d = Math.hypot(goal.x - from.x, goal.y - from.y), k = Math.min(1, 2500 / Math.max(d, 1)), to = { x: from.x + (goal.x - from.x) * k, y: from.y + (goal.y - from.y) * k }, r = w.route(from, to);
    const path = r ? r.path.slice(1).filter(p => !inHome(p)) : [to]; let state = 'atteint', fails = 0;
    for (const p of path) { state = S.goTo(p, budget); if (state === 'atteint') { fails = 0; continue; } if ((state === 'bloqué' || state === 'temps') && ++fails < 4) continue; break; }
    if ((state === 'bloqué' || state === 'temps') && fails < 4) state = 'atteint';
    return { routed: !!r, state, at: Math.round(g.frontier.position().x), left: Math.round(Math.hypot(goal.x - g.frontier.position().x, goal.y - g.frontier.position().y)) };
  };
  S.inHome = inHome;
});
const exitState = await page.evaluate(() => { const S = globalThis.__run217; for (let i = 0; i < 600 && !DEADWALL.frontier.active(); i++) S.frame(['KeyD']); return { active: DEADWALL.frontier.active(), pos: DEADWALL.frontier.position() }; });
log('sortie', JSON.stringify(exitState));
await page.evaluate(() => { for (let i = 0; i < 8; i++) DEADWALL.render(); });
await shot('05-sortie-region');
// 5. Aller : KM kilomètres plein est.
const outbound = { legs: [], startX: exitState.pos.x };
await page.evaluate(() => { const S = globalThis.__run217; S.goTo({ x: DEADWALL.frontier.position().x + 30, y: DEADWALL.frontier.position().y }, 900); });
for (let leg = 0; leg < 40; leg++) {
  const r = await page.evaluate(([goal, y]) => globalThis.__run217.leg(goal, y, 1500), [outbound.startX + KM * 1000, exitState.pos.y]);
  outbound.legs.push(r); log('aller', JSON.stringify(r));
  writeFileSync(join(out, 'partiel.json'), JSON.stringify({ outbound, prints: await page.evaluate(() => globalThis.__run217.prints) }));
  if (r.state !== 'atteint' || r.at >= outbound.startX + KM * 1000 - 10) break;
  if (leg === 3) await shot('06-route-sans-bord');
}
const far = await page.evaluate(() => ({ pos: DEADWALL.frontier.position(), cantons: DEADWALL.frontier.snapshot().cantons.length, stats: DEADWALL.frontier.world().streamStats(), prefetch: DEADWALL.frontier.world().prefetchStats() }));
await shot('07-loin-est');
// 6. Sauvegarde et reprise en pleine sortie.
const saved = await page.evaluate(() => {
  const g = DEADWALL, ok = g.save(true), raw = localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY);
  const before = JSON.stringify(g.frontier.snapshot()), t = performance.now(), back = g.restoreSave(globalThis.DeadwallSave.parse(raw)), ms = performance.now() - t;
  return { ok, bytes: raw?.length, restored: back, ms: Math.round(ms), same: JSON.stringify(g.frontier.snapshot()) === before, active: g.frontier.active(), status: g.lastSaveStatus?.message };
});
log('reprise', JSON.stringify(saved));
await page.evaluate(() => { const S = globalThis.__run217; S.pass = 'retour'; S.stuck = 0; S.prev = null; });
// 7. Retour par le même chemin, jusqu'au bord est de D-17 (la porte de la cité ramène le commandant).
const back = { steps: [] };
const goalBack = { x: exitState.pos.x + 20, y: exitState.pos.y };
for (let i = 0; i < 40; i++) {
  const r = await page.evaluate(([goal]) => ({ ...globalThis.__run217.legToward(goal, 1500), active: DEADWALL.frontier.active() }), [goalBack]);
  back.steps.push(r); log('retour', JSON.stringify(r)); if (!r.active || r.state !== 'atteint' || r.left < 15) break;
}
const gate = await page.evaluate(() => { const S = globalThis.__run217, g = DEADWALL, H = globalThis.DeadwallOpenWorld217.home(g.world.seed); const target = { x: H.maxX + 1, y: g.frontier.position().y }; const lane = g.world.terrain217.sides.east.entries[0], laneY = H.minY + (lane.from + lane.to) / 2; let r = 'cité';
  // Porte est : milieu du passage ouvert (la voiture y tient), longé depuis l'extérieur du cadre.
  if (g.frontier.active()) { r = S.goTo({ x: H.maxX + 12, y: laneY }, 3000); if (r === 'atteint') r = S.goTo({ x: H.maxX + 1.5, y: laneY }, 3000); } const msgs = [], notify = g.notify; g.notify = (t, k) => { msgs.push(String(t)); return notify.call(g, t, k); };
  for (let i = 0; i < 300 && g.frontier.active(); i++) S.frame(['KeyA']); g.notify = notify; return { r, active: g.frontier.active(), player: { x: Math.round(g.player.x), y: Math.round(g.player.y) }, messages: msgs.slice(-3) }; });
log('retour', JSON.stringify(back.steps.slice(-2)), JSON.stringify(gate));
await page.evaluate(() => { const g = DEADWALL; g.camera.x = g.player.x; g.camera.y = g.player.y; for (let i = 0; i < 4; i++) g.render(); });
await shot('08-retour-cite');
// 8. Sauvegarde et reprise dans la cité.
const home = await page.evaluate(() => { const g = DEADWALL, ok = g.save(true), d = g.serialize(); const back = g.restoreSave(JSON.parse(JSON.stringify(d))); return { ok, back, generation: g.frontier.position().generation, active: g.frontier.active(), terrain: !!g.world.terrain217, open: g.openWorld217.active(), cantons: g.frontier.snapshot().cantons.length }; });
// Mesures : empreintes aux deux passages, temps des images.
const result = await page.evaluate(() => {
  const S = globalThis.__run217, a = S.prints.aller, r = S.prints.retour, both = Object.keys(a).filter(k => k in r), differ = both.filter(k => a[k] !== r[k]);
  const ms = S.frames.map(f => f[0]).sort((x, y) => x - y), q = p => +ms[Math.min(ms.length - 1, Math.floor(p * ms.length))].toFixed(1);
  const seam = S.frames.filter(f => f[1] < 40), off = S.frames.filter(f => f[1] >= 40), max = l => l.length ? +Math.max(...l.map(f => f[0])).toFixed(1) : null;
  return { cantonsAller: Object.keys(a).length, cantonsRetour: Object.keys(r).length, both: both.length, differ, frames: ms.length, median: q(.5), p95: q(.95), p99: q(.99), max: max(S.frames), seamMax: max(seam), seamFrames: seam.length, offMax: max(off),
    slowest: S.frames.slice().sort((x, y) => y[0] - x[0]).slice(0, 8).map(f => ({ ms: +f[0].toFixed(1), seam: Math.round(f[1]), pass: f[2] })) };
});
await page.evaluate(() => { window.__hold217 = false; });
await page.waitForTimeout(1500);
await shot('09-cite-apres-reprise');
const report = { km: KM, menu, card, start, wave, prep, exitState, outbound, far, saved, back, gate, home, result, errors };
writeFileSync(join(out, 'openworld217.json'), JSON.stringify(report, null, 1));
log(JSON.stringify({ start, wave, far: { x: far.pos.x, cantons: far.cantons }, saved, gate, home, result, errors: errors.length }, null, 1));
await browser.close();
if (errors.length) { console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
