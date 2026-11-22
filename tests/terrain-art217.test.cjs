'use strict';
// Monde sans bord, tranche O8a (specs/monde-sans-bord/ouverture.md) : rendu 2D/2,5D des falaises, rampes, eau et
// routes d'une cité de génération 12. Présentation seule, hors jeu : atteinte par un harnais qui remplace le monde
// d'une partie par une carte née de la description locale. En G1–G11, aucun appel de dessin ne change.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, T = C.TILE, Lw = require('../src/world-local217.js'), A = require('../src/terrain-art217.js');
const Game = g.constructor, minimap = () => g.renderMinimap();
// Constructeur des infectés pris sur la partie d'origine.
g.spawnZombie('walker'); const Zombie = g.zombies.at(-1).constructor; g.zombies.pop();
const descs = new Map(), describe = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const snap = () => { const d = g.serialize(); delete d.timestamp; return JSON.stringify(d); };

// Contexte factice qui enregistre chaque appel et chaque réglage (nombres arrondis, objets par leur nature).
function recorder() {
  const log = [], gradient = { addColorStop: (...a) => log.push(['stop', ...a]) };
  const norm = v => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v && typeof v === 'object' ? (v === gradient ? 'gradient' : v.constructor?.name || 'objet') : typeof v === 'function' ? 'fonction' : v;
  const target = { canvas: { width: 1280, height: 900 } };
  const ctx = new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k]; if (typeof k === 'symbol') return undefined;
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern' || k === 'createConicGradient') return (...a) => { log.push([k, ...a.map(norm)]); return gradient; };
      if (k === 'measureText') return s => ({ width: String(s).length * 7 });
      if (k === 'getImageData' || k === 'createImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return (...a) => { log.push([k, ...a.map(norm)]); };
    },
    set(t, k, v) { log.push(['=' + String(k), norm(v)]); t[k] = v; return true; }
  });
  return { ctx, log };
}
// Copie espionnée du module (le module est gelé) : `enter` et `leave` encadrent chaque appel.
const wrapModule = (enter, leave) => Object.fromEntries(Object.entries(A).map(([k, f]) => [k, typeof f === 'function' ? (...a) => { enter(); try { return f(...a); } finally { leave(); } } : f]));
function recordFrame(view) {
  const main = recorder(), mini = recorder(), keep = [g.ctx, g.mctx];
  g.ctx = main.ctx; g.mctx = mini.ctx;
  try { g.render(); minimap(); } finally { [g.ctx, g.mctx] = keep; }
  return { main: main.log, mini: mini.log, view };
}

test('O8a : module de présentation isolé — sans tirage, horloge ni écriture ; hors index.html, sw.js et build ; appels gardés par le terrain', () => {
  const source = read('src/terrain-art217.js'), code = source.replace(/\/\/.*$/gm, '');
  assert.ok(!/Math\.random|Date\.now|performance\.|setTimeout|setInterval|requestAnimationFrame|localStorage|crypto|\.elapsed|\.random\b|Random\(/.test(code), 'ni tirage ni horloge');
  // Aucune écriture dans la partie, le monde ou le terrain : ni affectation, ni incrément, ni méthode qui modifie.
  assert.ok(!/\b(game|world|g|t|terrain)(\.[\w$]+|\[[^\]]+\])+\s*(=(?!=)|\+=|-=|\*=|\/=|\+\+|--)/.test(code), 'aucune affectation sur la partie ou le terrain');
  assert.ok(!/\b(game|world|g|t)\.[\w$.]*\.(push|splice|set|add|delete|fill|sort|pop|shift|unshift)\(/.test(code), 'aucune mutation de collection de la partie');
  assert.ok(!/WorldLocal217|world-local217|WorldRelief217|CantonGen217|WorldCantons217/.test(source), 'ne nomme pas les modules du monde');
  for (const file of ['index.html', 'sw.js', 'scripts/server.mjs', 'scripts/build.mjs', 'scripts/public-manifest183.cjs', 'src/expansion-kit.js', 'src/expansion-ui.js'])
    assert.ok(!read(file).includes('terrain-art217'), file);
  const dist = path.join(ROOT, 'dist');
  if (fs.existsSync(dist)) {
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
    for (const file of walk(dist)) assert.ok(!/terrain-art217/.test(file), file);
  }
  // Les points d'appel du jeu ne lisent le module que sur un monde de terrain.
  for (const file of ['src/game.js', 'src/exploration-125.js', 'src/visibility146.js']) for (const line of read(file).split('\n'))
    if (/DeadwallTerrainArt217|sightClear217\(localPoint/.test(line)) assert.match(line, /terrain217/, file + ' : appel non gardé');
  assert.equal((read('src/game.js').match(/DeadwallTerrainArt217/g) || []).length, 3);
  const R = C.TerrainArt217Rules; assert.ok(Object.isFrozen(R));
  assert.deepEqual({ ...R }, { version: 1, cliffMetres: 4, bevel: .35, bankMaxCells: 4, edgeFadeMetres: 6, grain: 7 });
  assert.equal(C.CityGeometry202.presentation.projectedHeightUnitsPerMetre, 16);
  assert.equal(C.WorldSave217Rules.open, false, 'génération 12 toujours fermée');
});

test('O8a : en G1–G11, mêmes appels de dessin (sol, profondeur, minicarte) avec ou sans le module', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  assert.equal(g.world.terrain217, null);
  Object.assign(g.camera, { x: g.player.x, y: g.player.y, zoom: .75, shake: 0 }); g.dayClock = .44; g.weather = 0; g.settings.reducedMotion = true;
  const before = snap(), keep = globalThis.DeadwallTerrainArt217;
  // Un espion à la place du module : jamais appelé sur une carte plate.
  let calls = 0; const spy = wrapModule(() => calls++, () => {});
  try {
    recordFrame(); // caches de présentation chauds
    globalThis.DeadwallTerrainArt217 = spy; const withModule = recordFrame();
    delete globalThis.DeadwallTerrainArt217; const without = recordFrame();
    globalThis.DeadwallTerrainArt217 = spy; const again = recordFrame();
    assert.ok(withModule.main.length > 500, 'rendu complet enregistré : ' + withModule.main.length);
    assert.equal(hash(JSON.stringify(withModule)), hash(JSON.stringify(without)), 'séquence identique');
    assert.equal(hash(JSON.stringify(again)), hash(JSON.stringify(without)));
    // Le cadre de la carte plate est toujours peint ; aucune image de terrain.
    assert.ok(without.main.some(([k, ...a]) => k === 'strokeRect' && a[0] === 3 && a[2] === g.local.size - 6), 'cadre');
    assert.ok(!withModule.main.some(([k, ...a]) => k === 'drawImage' && a[3] === 192), 'aucune image de terrain');
  } finally { globalThis.DeadwallTerrainArt217 = keep; }
  assert.equal(calls, 0, 'module jamais appelé en G1–G11');
  assert.ok(g.depthEntries(g.viewBounds()).every(e => e.kind !== 8));
  assert.equal(snap(), before, 'partie inchangée');
});

test('O8a : falaise du côté bas, hauteur projetée comme les étages, rebords arrière dans la file de profondeur', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const { world } = buildTerrainGame217(g, describe, 17117, { zoom: .7 }), t = world.terrain217, N = t.tiles;
  const p = A.prepare(t), H = C.TerrainArt217Rules.cliffMetres * C.CityGeometry202.presentation.projectedHeightUnitsPerMetre;
  assert.equal(A.prepare(t), p, 'données préparées une fois par terrain');
  assert.equal(H, 64);
  assert.ok(p.faces.length >= 10 && p.backs.length >= 10 && p.sides.length >= 10, JSON.stringify(A.summary(world)));
  // Chaque face visible : palier haut au nord, bas au sud, aucune rampe ; chaque rebord arrière : l'inverse.
  const count = (list, sign) => { let n = 0; for (const f of list) for (let x = f.x0; x < f.x1; x++) {
    const a = t.levels[(f.y - 1) * N + x], b = t.levels[f.y * N + x]; assert.equal(Math.sign(a - b), sign); assert.equal(Math.abs(a - b), f.drop); assert.equal(t.passes[(f.y - 1) * N + x] & 2, 0); n++; } return n; };
  let cliffs = 0;
  for (let y = 0; y < N - 1; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (t.levels[i] !== t.levels[i + N] && !(t.passes[i] & 2)) cliffs++; }
  assert.equal(count(p.faces, 1) + count(p.backs, -1), cliffs, 'toutes les arêtes nord-sud de falaise, une fois');
  for (const s of p.sides) for (let y = s.y0; y < s.y1; y++) { const a = t.levels[y * N + s.x - 1], b = t.levels[y * N + s.x]; assert.equal(a > b, s.highWest); assert.equal(t.passes[y * N + s.x - 1] & 1, 0); }
  // Tri : un infecté du contrebas juste derrière un rebord est peint avant lui (masqué), un infecté du plateau après.
  const back = p.backs.filter(b => b.x1 - b.x0 >= 4).sort((a, b) => Math.hypot(a.x0 - 96, a.y - 96) - Math.hypot(b.x0 - 96, b.y - 96))[0];
  const mx = (back.x0 + 2) * T, ey = back.y * T;
  const behind = new Zombie(g.nextId++, 'walker', mx, ey - 24, g.difficulty, g.wave, g.local), above = new Zombie(g.nextId++, 'walker', mx, ey + 30, g.difficulty, g.wave, g.local);
  g.zombies.push(behind, above); Object.assign(g.camera, { x: mx, y: ey });
  assert.ok(world.terrainAt217(behind.x, behind.y).level < world.terrainAt217(above.x, above.y).level);
  assert.equal(A.hiddenBehind(g, behind), true); assert.equal(A.hiddenBehind(g, above), false);
  const entries = g.depthEntries(g.viewBounds()), at = e => entries.findIndex(x => x.entity === e);
  const lip = entries.findIndex(e => e.kind === 8 && e.depth === ey && e.entity.x >= back.x0 * T && e.entity.x <= back.x1 * T);
  assert.ok(lip >= 0 && at(behind) < lip && lip < at(above), 'derrière < rebord < dessus');
  assert.equal(typeof entries[lip].draw, 'function');
  // Le rebord peint la bande projetée au-dessus de l'arête.
  const rec = recorder(); entries[lip].draw(rec.ctx);
  assert.ok(rec.log.some(([k, x, y]) => k === 'lineTo' && Math.abs(y - (ey - back.drop * H)) < 1e-6), 'crête à la hauteur projetée');
  // Sol : image du terrain, faces sous l'arête (du côté bas), ni croix fixe ni cadre.
  const frame = recordFrame(), c = g.local.size / 2;
  assert.ok(frame.main.some(([k, ...a]) => k === 'drawImage' || (k === 'fillRect' && a[2] >= T)), 'base du terrain');
  assert.ok(!frame.main.some(([k, ...a]) => k === 'fillRect' && a[0] === 0 && a[1] === c - 66), 'pas de croix fixe');
  assert.ok(!frame.main.some(([k, ...a]) => k === 'strokeRect' && a[0] === 3 && a[1] === 3), 'bord adouci au lieu du cadre');
  const faces = frame.main.filter(([k]) => k === 'createLinearGradient').length; assert.ok(faces > 3);
  // Le plan fixe d'exploration ne peint ni routes ni stations sur un monde de terrain.
  assert.ok(entries.every(e => e.id !== -125));
  g.zombies.length = 0;
});

test('O8a : rampes lisibles, eau avec son lit, routes de la grille, minicarte du terrain', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  // Graine 0 : falaise et deux rampes de col de 12 m.
  let { world } = buildTerrainGame217(g, describe, 0);
  let s = A.summary(world);
  assert.equal(s.ramps.length, 2); for (const r of s.ramps) { assert.equal(r.cells, 144); assert.equal(r.axis, 'y'); }
  const p0 = A.prepare(world.terrain217);
  for (const r of p0.ramps) assert.ok(r.crossings >= 12, 'la rampe franchit l’arête');
  // Le dessin d'une rampe : marches perpendiculaires à la pente et chevrons vers le haut.
  const r0 = p0.ramps[0]; Object.assign(g.camera, { x: (r0.left + r0.right) / 2 * T, y: (r0.top + r0.bottom) / 2 * T, zoom: .7 });
  const rf = recordFrame();
  assert.ok(rf.main.filter(([k, x0, y0]) => k === 'moveTo' && y0 > r0.top * T && y0 < r0.bottom * T && x0 >= r0.left * T && x0 <= r0.right * T).length >= 3 * 144, 'trois marches par case');
  // Routes : couleur de route sur chaque case de route hors eau, teinte de palier ailleurs.
  const t0 = world.terrain217, N = t0.tiles;
  for (let i = 0; i < N * N; i += 37) { const c = A.colourAt(world, i % N, Math.floor(i / N)); if (t0.roads[i] && !t0.water[i]) assert.ok([[74, 72, 64], [82, 78, 66], [92, 84, 66]].some(r => r.join() === c.join()), 'route ' + c); }
  // Teinte par palier : plus claire en haut.
  const lum = c => c[0] + c[1] + c[2], plain = level => { for (let i = 0; i < N * N; i++) if (t0.levels[i] === level && !t0.roads[i] && !t0.water[i] && t0.kinds[i] !== 2) return lum(A.colourAt(world, i % N, Math.floor(i / N))); };
  assert.ok(plain(2) < plain(3) && plain(3) < plain(4));
  // Graine 46 : lac, rivière (lit et berge), rampes.
  ({ world } = buildTerrainGame217(g, describe, 46)); s = A.summary(world);
  const t = world.terrain217, M = t.tiles; let river = 0, bank = 0;
  assert.ok(s.waterCells > 9000 && s.ramps.length >= 2);
  for (let i = 0; i < M * M; i++) {
    const c = A.colourAt(world, i % M, Math.floor(i / M));
    if (t.water[i] === 3 && !t.roads[i]) { river++; assert.ok(c[2] > c[0], 'eau bleutée'); }
    if (!t.water[i] && !t.roads[i] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => t.water[i + dx + dy * M] === 3)) { bank++; const flat = A.colourAt({ terrain217: { ...t, water: new Uint8Array(t.water.length) } }, i % M, Math.floor(i / M)); assert.notDeepEqual(c, flat, 'berge du lit'); }
  }
  assert.ok(river > 400 && bank > 40);
  // Minicarte : terrain peint (image ou bandes), traits de falaise, rampes ; sans la grille fixe de la carte plate.
  const mini = recordFrame().mini;
  assert.ok(mini.some(([k]) => k === 'drawImage') || mini.filter(([k]) => k === 'fillRect').length > 500, 'terrain sur la minicarte');
  assert.ok(mini.some(([k, v]) => k === '=strokeStyle' && v === 'rgba(14,14,12,.85)'), 'falaises sur la minicarte');
  assert.ok(!mini.some(([k, v]) => k === '=strokeStyle' && v === 'rgba(255,255,255,.035)'), 'pas de grille fixe');
});

test('O8a : D-O1 dans la visibilité — une falaise coupe la vue vers le haut, pas vers le bas', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const { world } = buildTerrainGame217(g, describe, 17117), p = A.prepare(world.terrain217);
  g.dayClock = .44; g.weather = 0; g.units.length = 0;
  const back = p.backs.filter(b => b.x1 - b.x0 >= 4).sort((a, b) => Math.hypot(a.x0 - 96, a.y - 96) - Math.hypot(b.x0 - 96, b.y - 96))[0];
  const x = (back.x0 + 2) * T + 16, low = back.y * T - 3 * T, high = back.y * T + 3 * T;
  for (const b of [...world.buildings.values()]) if (b.type !== 'core') world.remove(b);
  const z = new Zombie(g.nextId++, 'walker', x, high, g.difficulty, g.wave, g.local); g.zombies.push(z);
  const look = () => { g.visibility.invalidate(); return g.visibility.frame().canSeeLocal(z); };
  // La base : sans falaise entre eux (même palier), l'infecté est vu à cette distance.
  Object.assign(g.player, { x, y: high + 4 * T }); assert.equal(world.sightClear217(g.player, z), true); assert.equal(look(), true, 'même palier : vu');
  // D'en bas : coupé.
  Object.assign(g.player, { x, y: low }); assert.equal(world.sightClear217(g.player, z), false); assert.equal(look(), false, 'd’en bas : pas vu');
  // D'en haut : vu.
  Object.assign(z, { x, y: low }); Object.assign(g.player, { x, y: high }); assert.equal(look(), true, 'd’en haut : vu');
  // Infecté géant (lancer de rayon en hauteur de la citadelle) : la même règle, lue avant ce chemin.
  const giant = { id: 9175, kind: 'colossus', x, y: high, health: 1500, yaw: 0 }; g.zombies.length = 0;
  assert.ok(C.VerticalCitadel175.siege.kinds[giant.kind]);
  const lookGiant = () => { g.visibility.invalidate(); return g.visibility.frame().canSeeLocal(giant); };
  Object.assign(g.player, { x, y: high + 4 * T }); assert.equal(lookGiant(), true, 'géant, même palier : vu');
  Object.assign(g.player, { x, y: low }); assert.equal(lookGiant(), false, 'géant d’en haut, vu d’en bas : coupé');
  Object.assign(giant, { x, y: low }); Object.assign(g.player, { x, y: high }); assert.equal(lookGiant(), true, 'géant en contrebas : vu');
  g.zombies.length = 0;
});

test('O8a : sonde — 600 images sans tirage, horloge ni écriture : état, monde et flux régional inchangés', () => {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  for (const seed of [17117, 46]) {
    const { world } = buildTerrainGame217(g, describe, seed, { zoom: .55 }), t = world.terrain217, p = A.prepare(t);
    const back = p.backs[0]; g.zombies.push(new Zombie(g.nextId++, 'walker', (back.x0 + .5) * T, back.y * T - 20, g.difficulty, g.wave, g.local));
    g.settings.reducedMotion = false;
    const region = g.frontier?.world?.(), stats = () => JSON.stringify(region?.streamStats?.() ?? null);
    // Sauvegarde complète (extensions de quartier comprises depuis le préalable O9 (a)).
    const base = () => { const d = g.serialize(); delete d.timestamp; return JSON.stringify(d); };
    const print = () => hash(JSON.stringify([base(), g.random, g.nextId, g.resources, [...world.occupancy], world.nodes, [...world.buildings.keys()], ['levels', 'passes', 'water', 'roads', 'kinds', 'deep', 'ford'].map(k => [...t[k]]), g.zombies.map(z => [z.x, z.y, z.health]), g.units.map(u => [u.x, u.y]), g.player.x, g.player.y, g.elapsed, g.camera]));
    const before = print(), stream = stats();
    // Module espionné : tout tirage, horloge ou lecture du temps de simulation pendant ses appels est compté.
    const keep = globalThis.DeadwallTerrainArt217, clock = [Math.random, Date.now, performance.now];
    let inside = 0, forbidden = 0, calls = 0;
    Math.random = function () { if (inside) forbidden++; return clock[0].call(Math); };
    Date.now = function () { if (inside) forbidden++; return clock[1].call(Date); };
    performance.now = function () { if (inside) forbidden++; return clock[2].call(performance); };
    globalThis.DeadwallTerrainArt217 = wrapModule(() => { inside++; calls++; }, () => inside--);
    try {
      for (let i = 0; i < 600; i++) {
        const a = i / 600 * Math.PI * 2;
        Object.assign(g.camera, { x: g.player.x + Math.cos(a) * 1500, y: g.player.y + Math.sin(a) * 1500, zoom: .3 + (i % 7) * .2 });
        g.render(); if (i % 10 === 0) minimap();
      }
    } finally { globalThis.DeadwallTerrainArt217 = keep; [Math.random, Date.now, performance.now] = clock; }
    assert.ok(calls >= 600 * 2, 'peintres appelés : ' + calls);
    assert.equal(forbidden, 0, 'aucun tirage ni horloge');
    assert.equal(stats(), stream, 'flux régional inchangé');
    // La caméra est réglée par le harnais ; tout le reste est identique.
    Object.assign(g.camera, { x: g.player.x, y: g.player.y, zoom: .55 });
    assert.equal(print(), before, 'état inchangé après 600 images (graine ' + seed + ')');
    g.zombies.length = 0;
  }
});
