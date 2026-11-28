'use strict';
// Atlas et minicarte d'un monde sans bord (specs/monde-sans-bord/ouverture.md, tranche O10 ; tasks.md, T6) : fenêtre glissante
// des cantons vus (caméra sans étendue fixe), brouillard ailleurs, rayon d'action du véhicule, graphe macro des coutures pour
// un GPS au-delà de 25 cantons (fonction pure de la graine, préparé par tranches), libellé de la minicarte au retour dans la
// cité. Présentation seule : aucune clé de sauvegarde, aucun canton généré par la peinture, rien de lu sans l'option.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
const document = globalThis.document;
const C = globalThis.DeadwallCore, OA = globalThis.DeadwallOpenWorld217Atlas, P = globalThis.DeadwallAtlasProjection, K = globalThis.DeadwallWorldCantons217, G = globalThis.DeadwallWorldCantonGen217;
const LAYERS = { terrain: true, roads: true, city: true, places: true, labels: true, gates: true, relays: true, units: true, routes: true, travelled: false, intelligence: true, tours: true, biomes: true };
const steps = n => { for (let i = 0; i < n; i++) g.update(1 / 30); };
// Contexte de dessin enregistreur (aucun canvas réel sous Node).
function recorder() { const calls = []; const ctx = new Proxy({ calls }, { get(t, k) { if (k in t) return t[k]; if (k === 'measureText') return () => ({ width: 40 }); if (k === 'getTransform') return () => ({ a: 1, b: 0 }); return (...a) => { calls.push([k, ...a]); }; }, set(t, k, v) { t[k] = v; return true; } }); return ctx; }
const loading = w => { const s = w.streamStats(); return JSON.stringify([s.generated, s.misses, s.size, s.evictions, s.routes]); };
function openStart(seed = '17117') { const r = g.startNew('standard', seed, 'classic', 'balanced', true, undefined, true); g.campaignIntro132?.skip?.(); return r; }
function eastSpot() { const S = g.local.size; for (let y = 0; y < 192; y++) { const px = S - 50, py = y * C.TILE + 16; if (g.world.reach217(px, py) && g.friendlyPositionClear(g.player, px, py)) return { x: px, y: py }; } return null; }
function goOut() { const e = eastSpot(); g.player.x = e.x; g.player.y = e.y; assert.equal(g.frontier.enter(), true); steps(20); }

test('O10 : règles gelées, script public après le module d’ouverture, module pur (ni tirage, ni horloge, ni stock)', () => {
  const R = C.OpenAtlas217Rules;
  assert.ok(Object.isFrozen(R) && Object.isFrozen(R.window) && Object.isFrozen(R.macro) && Object.isFrozen(R.range) && Object.isFrozen(R.detailed));
  assert.deepEqual(JSON.parse(JSON.stringify(R)), { version: 1, generation: 12, window: { margin: 1, max: 15 }, rasters: 8, summaries: 256, places: 1024, macro: { margin: 4, maxSpan: 160, maxNodes: 24000, perCall: 6, plans: 4 }, range: { detour: 1.25 }, detailed: { margin: 1, maxCantons: 25 } });
  assert.equal(R.detailed, C.WorldOpen217Rules.route, 'itinéraire borné du monde');
  assert.equal(R.range.detour, C.FieldSupplies.RULES.detourFactor, 'même détour que le plan de sortie');
  const html = read('index.html'), at = f => html.indexOf('<script src="src/' + f + '.js"></script>');
  assert.ok(at('openworld217') >= 0 && at('openworld217') < at('openworld217-atlas'));
  assert.ok(at('atlas-projection') < at('openworld217-atlas') && at('atlas-render') < at('openworld217-atlas') && at('frontier-ui') < at('openworld217-atlas'));
  assert.ok(read('sw.js').includes('"src/openworld217-atlas.js"'));
  const code = read('src/openworld217-atlas.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/Math\.random|Date\.now|performance\.|setTimeout|setInterval|localStorage|requestAnimationFrame/.test(code), 'ni tirage ni horloge');
  assert.ok(!/resources\.|carry\.[a-z]+\s*[-+*]?=[^=]|\.fuel\s*[-+*]?=[^=]|health\s*[-+*]?=[^=]|g\.save\(|serialize|restoreSave|K\.rng|K\.stream|\.generate\(/.test(code), 'ni stock, ni dégât, ni sauvegarde, ni flux de génération');
  assert.ok(globalThis.DeadwallOpenWorld217Atlas === OA && g.openAtlas217, 'installé au chargement');
});

test('O10 : caméra de l’atlas bornée par une fenêtre, comportement inchangé sans fenêtre', () => {
  const ops = cam => { cam.fit(100, 200, 500); cam.pan(-9000, 4000); const a = cam.snapshot(); cam.zoomAt(1e-6); const b = cam.snapshot(); cam.set(-50, 99999, 3); return [a, b, cam.snapshot()]; };
  const plain = ops(P.camera(800, 600)), again = P.camera(800, 600); again.window(null); assert.deepEqual(ops(again), plain, 'sans fenêtre : identique');
  assert.equal(plain[2].x, 0); assert.equal(plain[2].y, P.RULES.regionSize);
  const cam = P.camera(800, 600), box = { minX: -3072, minY: -1024, maxX: 12288, maxY: 2048 };
  assert.deepEqual(cam.window(box), box);
  cam.set(-99999, 99999, 1e-9); const s = cam.snapshot(); assert.equal(s.x, box.minX); assert.equal(s.y, box.maxY);
  assert.ok(Math.abs(s.zoom - P.RULES.regionSize / (box.maxX - box.minX)) < 1e-12, 'zoom minimal : la fenêtre entière');
  cam.pan(1e9, -1e9); assert.equal(cam.snapshot().x, box.minX); assert.equal(cam.snapshot().y, box.maxY);
  assert.deepEqual(cam.window({ minX: 0, minY: 0, maxX: 0, maxY: 5 }), box, 'fenêtre vide refusée');
  assert.equal(cam.window(null), null); cam.set(-5, -5); assert.equal(cam.snapshot().x, 0);
});

test('O10 : graphe macro des coutures — fonction pure de la graine, coût borné, chemin de passages contigus', () => {
  const run = seed => { const p = OA.plan(seed, { x: 580, y: 576 }, { x: 30500, y: 700 }); let n = 0; while (p.status === 'preparing' && n++ < 2000) OA.advance(p); return { p, n }; };
  const a = run(17117), b = run(17117);
  assert.equal(a.p.status, 'ready'); assert.deepEqual(b.p.result, a.p.result, 'même graine, même plan');
  assert.ok(a.n > 1, 'préparé en plusieurs tranches');
  const seams = a.p.result.seams; assert.ok(seams.length >= 29, 'au moins un passage par canton traversé');
  const cantonsOf = id => { const e = K.parseEdge(id); return e.axis === 'v' ? [[e.x - 1, e.y], [e.x, e.y]] : [[e.x, e.y - 1], [e.x, e.y]]; };
  for (let i = 1; i < seams.length; i++) assert.ok(cantonsOf(seams[i].id).some(([x, y]) => cantonsOf(seams[i - 1].id).some(([u, v]) => u === x && v === y)), 'passages consécutifs dans un même canton');
  for (const s of seams) { const [x, y] = cantonsOf(s.id)[1], side = K.parseEdge(s.id).axis === 'v' ? 'west' : 'north', q = G.seam(17117, x, y, side); assert.equal(q.edge, s.id); assert.ok(q.road && q.road.x === s.x && q.road.y === s.y, 'passage routier réel de la couture'); }
  assert.ok(a.p.result.metres >= Math.hypot(30500 - 580, 700 - 576) && a.p.result.metres < 1.6 * Math.hypot(30500 - 580, 700 - 576));
  const far = OA.plan(17117, { x: 0, y: 0 }, { x: (C.OpenAtlas217Rules.macro.maxSpan + 2) * 1024, y: 0 }); assert.equal(far.status, 'too-far');
  // Autre graine : autre réseau, même contrat.
  const other = run(42); assert.equal(other.p.status, 'ready'); assert.notDeepEqual(other.p.result.seams.map(s => s.id), seams.map(s => s.id));
});

test('O10 : campagne sans bord — fenêtre des cantons vus, brouillard, peinture sans chargement de canton, rayon d’action', () => {
  openStart(); goOut();
  const v = g.frontier.overview(), w = v.world, k0 = K.at(v.x, v.y), id0 = K.id(k0.cx, k0.cy);
  assert.equal(w.unbounded, true); assert.ok(v.cantons.includes(id0));
  assert.deepEqual(g.openAtlas217.memory().summaries, [id0], 'canton du commandant relevé');
  const win = OA.window(g, v); assert.ok(win.minX <= v.x && v.x < win.maxX && win.minY <= v.y && v.y < win.maxY);
  assert.equal(win.w, (1 + 2 * C.OpenAtlas217Rules.window.margin) * K.SIZE, 'un canton vu, une marge de chaque côté');
  // Fenêtre glissante : beaucoup de cantons vus → côté borné, centré sur le joueur.
  const wide = OA.window(g, { ...v, cantons: Array.from({ length: 40 }, (_, i) => K.id(i, 0)) }); assert.equal(wide.x1 - wide.x0 + 1, C.OpenAtlas217Rules.window.max); assert.ok(wide.x0 <= k0.cx && k0.cx <= wide.x1);
  // Peinture de l'atlas : aucune lecture de canton par la couche G12 (même les compteurs de lecture), aucun chargement en tout.
  g.renderMinimap(); g.frontier.guidance();
  const cam = P.camera(900, 600); cam.window(win); cam.fit(win.x, win.y, win.size);
  const hits = w.streamStats().hits, before = loading(w), ctx = recorder();
  const terrain = OA.drawTerrain(ctx, g, v, cam, LAYERS, win), roads = OA.drawRoads(ctx, g, v, cam, LAYERS, win); OA.drawRange(ctx, g, v, cam); OA.provenance(g, v, win); OA.biomeText(v, v.x, v.y);
  assert.equal(w.streamStats().hits, hits, 'couche G12 : aucun canton lu');
  assert.equal(terrain.seen, 1); assert.equal(terrain.fog, 8, 'brouillard sur les huit cantons non parcourus');
  assert.equal(roads.exact, 1); assert.ok(roads.segments > 0);
  globalThis.DeadwallAtlasRender.render(recorder(), g, v, cam, LAYERS, null);
  assert.equal(loading(w), before, 'ouvrir l’atlas ne génère ni ne charge aucun canton (E9)');
  assert.match(OA.biomeText(v, v.x + 1024, v.y), /brouillard/); assert.ok(OA.biome(v, v.x, v.y)?.name);
  assert.equal(OA.biome(v, v.x, v.y).id, G.BIOMES[w.cantonAt(v.x, v.y).biomes[Math.floor((v.y - k0.cy * 1024) / 32) * 32 + Math.floor((v.x - k0.cx * 1024) / 32)]], 'milieu pur identique au canton');
  // Relief pur identique aux paliers du canton.
  assert.deepEqual([...OA.levels(w.seed, k0.cx, k0.cy)], [...w.canton(k0.cx, k0.cy).levels]);
  // Rayon d'action : à pied sans véhicule, puis avec une voiture et du carburant.
  assert.equal(OA.range(g, v).vehicle, false); assert.match(OA.rangeText(OA.range(g, v)), /à pied/);
  // Partie vue par le rayon d'action (lecture seule) : voiture de 10 au réservoir, 4 au coffre, 1 au sac.
  const fake = { id: 99, x: 100, y: 100, fuel: 10, health: 50, cargo: { fuel: 4 }, regionAway: true };
  const view = { world: g.world, frontier: g.frontier, expeditions: { car: () => fake }, worldEvolution: g.worldEvolution, player: { carry: { fuel: 1, food: 2 } }, fieldSupplies: g.fieldSupplies, travel131: g.travel131 };
  const at = { ...v, car: { x: v.x + 300, y: v.y }, active: true }, r = OA.range(view, at), rate = g.worldEvolution?.vehicleProfile()?.fuel ?? C.Frontier.RULES.fuelPerMetre;
  assert.equal(r.vehicle, true); assert.equal(r.fuel, 15); assert.equal(r.x, v.x + 300);
  const expect = g.travel131.fuelDistance(15 - (g.fieldSupplies.snapshot().reserve || 0), rate, 99) / 1.25;
  assert.ok(Math.abs(r.reach - expect) < 1e-6); assert.equal(r.back, r.reach >= r.gap); assert.match(OA.rangeText(r), /Rayon d’action : .* à vol d’oiseau/); assert.match(OA.rangeText(r), /vivres au sac : 2\.0/);
  const ctx2 = recorder(); OA.drawRange(ctx2, view, at, cam); assert.ok(ctx2.calls.some(c => c[0] === 'arc' && Math.abs(c[3] - r.reach) < 1e-6), 'cercle du rayon d’action');
  if (r.back) assert.ok(ctx2.calls.some(c => c[0] === 'ellipse'), 'ellipse du retour à D-17');
  assert.equal(OA.range({ ...view, expeditions: { car: () => ({ ...fake, health: 0 }) } }, at).vehicle, false);
});

test('O10 : GPS au-delà de 25 cantons — préparation par tranches puis premier tronçon détaillé et tracé approché ; guidage gardé à l’arrêt', () => {
  const v = g.frontier.overview(), w = v.world;
  let target = null; for (let cx = 34; cx < 44 && !target; cx++) { const s = w.nearestSite((cx + .5) * 1024, 640, () => true, 1024); if (s) target = w.site(s.id); }
  assert.ok(target, 'lieu lointain');
  assert.equal(globalThis.DeadwallFrontierRouting.route(w, { x: v.x, y: v.y }, target), null, 'itinéraire borné du monde : hors de portée');
  g.frontier.revealSites([target.id]); assert.equal(g.frontier.pin(target.id), true);
  // Carnet et atlas : les lieux vus sont des lieux complets (nom, niveaux), pas les candidats du monde d'O1.
  const listed = w.seenSites(g.frontier.overview().seen); assert.ok(listed.length >= 1 && listed.every(p => typeof p.name === 'string' && Array.isArray(p.levels) && p.levels.length >= 1));
  assert.deepEqual(w.seenSites([target.id, target.id, 'K0_0:site:999999']).map(p => p.id), [target.id]);
  let r = g.frontier.guidance(), n = 0; assert.equal(r.macro, 'preparing'); assert.match(r.name, /itinéraire en préparation/);
  while (r?.macro === 'preparing' && n++ < 400) r = g.frontier.guidance();
  assert.equal(r.macro, 'ready'); assert.equal(r.detailed, true); assert.match(r.name, /tracé approché au-delà de 25 cantons/);
  assert.ok(r.metres >= Math.hypot(target.x - v.x, target.y - v.y)); assert.ok(r.path.length > r.seams); assert.ok(Number.isFinite(r.fuel));
  const end = r.path.at(-1), drive = w.connectionFor(target); assert.deepEqual(end, { x: drive.b.x, y: drive.b.y });
  // À l'arrêt, une nouvelle lecture (atlas, minicarte, bandeau) ne relance aucune recherche.
  const routes = w.streamStats().routes; g.frontier.guidance(); g.renderMinimap(); assert.equal(w.streamStats().routes, routes);
  const ctx = recorder(); const cam = P.camera(900, 600); const win = OA.window(g, g.frontier.overview()); cam.window(win); cam.fit(win.x, win.y, win.size);
  globalThis.DeadwallAtlasRender.render(ctx, g, g.frontier.overview(), cam, LAYERS, null); assert.equal(w.streamStats().routes, routes);
  // Repère proche : itinéraire borné du monde inchangé (aucune note).
  const near = w.seenSites(g.frontier.overview().seen).find(p => p.id !== target.id);
  if (near) { g.frontier.pin(near.id); const q = g.frontier.guidance(); if (q) assert.equal(q.macro, undefined); }
  g.frontier.pin(null);
});

test('O10 : libellé de la minicarte au retour, atlas après reprise (tracé approché des cantons non relevés), aucune clé de sauvegarde', () => {
  openStart(); goOut();
  const label = document.getElementById('minimapWrap')?.querySelector('.minimap-label');
  assert.ok(label, 'libellé de la minicarte'); const original = 'SECTEUR D-17';
  g.renderMinimap(); assert.match(label.textContent, /^GPS RÉGIONAL/, 'GPS régional en sortie');
  // Sauvegarde : aucune clé ni valeur du module.
  const d = g.serialize(), text = JSON.stringify(d); assert.ok(!text.includes('atlas217') && !text.includes('openAtlas217') && !text.includes('summaries'));
  // Reprise en sortie, puis atlas : aucun canton chargé par la peinture.
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(d))), true); steps(1);
  const v = g.frontier.overview(), w = v.world, k0 = K.at(v.x, v.y);
  const cam = P.camera(900, 600), win = OA.window(g, v); cam.window(win); cam.fit(win.x, win.y, win.size);
  const before = loading(w); globalThis.DeadwallAtlasRender.render(recorder(), g, v, cam, LAYERS, null); assert.equal(loading(w), before);
  // Canton vu mais pas relevé dans cette session (cas d'une reprise loin de lui) : passages de couture reliés au centre.
  const other = K.id(k0.cx + 1, k0.cy), seen = { ...v, cantons: [...v.cantons, other] };
  assert.ok(!g.openAtlas217.memory().summaries.includes(other));
  const hits = w.streamStats().hits, roads = OA.drawRoads(recorder(), g, seen, cam, LAYERS, OA.window(g, seen));
  assert.equal(w.streamStats().hits, hits); assert.ok(roads.exact >= 1 && roads.approx === 1 && roads.sketch === OA.seamsOf(w.seed, k0.cx + 1, k0.cy).length);
  // Retour dans la cité (campagne sans bord, sortie terminée) : le libellé du GPS régional ne reste pas sur la carte de la cité.
  openStart(); assert.equal(g.frontier.active(), false); assert.equal(g.frontier.position().generation, 12);
  label.textContent = 'GPS RÉGIONAL · M'; steps(1); assert.equal(label.textContent, original, 'libellé de la cité rétabli dès la première image');
  label.textContent = 'GPS RÉGIONAL · M'; g.renderMinimap(); assert.equal(label.textContent, original);
});
test('O10 : campagne à région finie — module jamais lu, atlas et minicarte inchangés', () => {
  const own = globalThis.DeadwallOpenWorld217Atlas, touched = [];
  globalThis.DeadwallOpenWorld217Atlas = new Proxy({}, { get(_, key) { touched.push(String(key)); throw Error('module O10 lu sans l’option : ' + String(key)); } });
  try {
    assert.notEqual(g.startNew('standard', '17117'), false); g.campaignIntro132?.skip?.();
    steps(30); g.render(); g.renderMinimap();
    g.player.x = g.local.size - 50; g.player.y = g.local.size / 2; assert.equal(g.frontier.enter(), true); steps(30); g.render(); g.renderMinimap();
    const v = g.frontier.overview(); assert.notEqual(v.world.unbounded, true);
    const cam = P.camera(900, 600); cam.fit(v.x, v.y, 420); globalThis.DeadwallAtlasRender.render(recorder(), g, v, cam, LAYERS, null);
    g.frontier.guidance(); g.frontierUI?.atlas?.fit?.(); g.frontierUI?.atlas?.locate?.();
    assert.ok(!JSON.stringify(g.serialize()).includes('atlas217'));
    assert.deepEqual(touched, []);
  } finally { globalThis.DeadwallOpenWorld217Atlas = own; }
  // Le module installé n'agit que sur un monde sans bord.
  assert.equal(OA.drawMinimap(g), null); assert.equal(g.openAtlas217.capture(), false); assert.equal(g.openAtlas217.relabel(), false);
});
