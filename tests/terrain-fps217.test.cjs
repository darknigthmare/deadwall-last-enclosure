'use strict';
// Monde sans bord, tranche O8b (specs/monde-sans-bord/ouverture.md ; décisions D-O1, D-O3) : relief de la cité de
// génération 12 dans la vue à la première personne (WebGL natif). Présentation seule, hors jeu : atteinte par un harnais
// qui remplace le monde d'une partie par une carte née de la description locale. En G1–G11, la vue FPS fait exactement
// les mêmes appels WebGL qu'avant la tranche (contexte factice enregistreur).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');
const { armTerrainCitadel217 } = require('./helpers/terrain-fps217.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, T = C.TILE, Lw = require('../src/world-local217.js'), F = require('../src/terrain-fps217.js');
const Render = require('../src/vertical-citadel175-render.js'), S = globalThis.DeadwallVertical175State, RV = C.VerticalCitadel175;
const RR = C.TerrainRelief217Rules, STEP = RR.stepMetres;
const Game = g.constructor;
g.spawnZombie('walker'); const Zombie = g.zombies.at(-1).constructor; g.zombies.pop();
const descs = new Map(), describe = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const N = 192;

// Partie avancée (âge 10, stocks) : citadelles et sentinelles passent par les contrôleurs de production.
function advanced() {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const d = g.serialize(); d.urban.peakScore = 2200; d.urban.progression151 = { version: 1, age: 10 };
  d.resources = { wood: 3000, scrap: 3000, stone: 3000, food: 3000, fuel: 2000, ammo: 3000, medicine: 50 };
  assert.equal(g.restoreSave(d), true);
}
function terrainGame(seed) { advanced(); return buildTerrainGame217(g, describe, seed, {}); }
// Contexte WebGL factice qui enregistre chaque appel ; les tampons envoyés sont résumés par leur empreinte.
function recorder() {
  const calls = [], listeners = new Map(); let sequence = 0;
  const norm = v => ArrayBuffer.isView(v) ? 'f32:' + v.length + ':' + hash(Buffer.from(v.buffer, v.byteOffset, v.byteLength)).slice(0, 16) : v && typeof v === 'object' ? 'objet' + (v.id ?? '') : v;
  const gl = { VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, DYNAMIC_DRAW: 6, FLOAT: 7, TRIANGLES: 8, COLOR_BUFFER_BIT: 1, DEPTH_BUFFER_BIT: 2, DEPTH_TEST: 9, CULL_FACE: 10, STATIC_DRAW: 11,
    createShader: () => ({}), createProgram: () => ({}), getShaderParameter: () => true, getProgramParameter: () => true, createBuffer: () => { calls.push(['createBuffer']); return { id: ++sequence }; },
    getAttribLocation: () => 0, getUniformLocation: () => ({}), isContextLost: () => false };
  const data = [];
  for (const name of ['shaderSource', 'compileShader', 'attachShader', 'linkProgram', 'deleteShader', 'deleteProgram', 'deleteBuffer', 'bindBuffer', 'bufferData', 'bufferSubData', 'enableVertexAttribArray', 'vertexAttribPointer', 'drawArrays', 'viewport', 'clearColor', 'clear', 'enable', 'disable', 'useProgram', 'uniform3f', 'uniform2f', 'uniform1f'])
    gl[name] = (...args) => { calls.push([name, ...args.map(norm)]); if (name === 'bufferSubData' || name === 'bufferData') data.push(args.find(a => ArrayBuffer.isView(a))); };
  const canvas = { width: 0, height: 0, getContext: () => gl, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: (e, f) => listeners.set(e, f), removeEventListener: e => listeners.delete(e) };
  return { gl, canvas, calls, data };
}
// Sommets (x, y, z) du dernier envoi du tampon dynamique (acteurs).
const lastDynamic = r => { const d = r.data.filter(Boolean).at(-1); const out = []; for (let i = 0; i < d.length; i += 6) out.push([d[i], d[i + 1], d[i + 2]]); return out; };

test('O8b : règle de hauteur du cran, alignée sur la peinture O8a et cohérente avec l’œil (D-O1, D-O3)', () => {
  assert.ok(Object.isFrozen(RR));
  assert.deepEqual({ ...RR }, { version: 1, stepMetres: 4, waterDrop: .45, strataMetres: 1, block: 4, skirtMetres: 6 });
  assert.equal(RR.stepMetres, C.TerrainArt217Rules.cliffMetres, 'hauteur jouée = hauteur peinte O8a');
  assert.equal(RR.stepMetres, RV.structureHeight, 'un cran = un étage de support');
  // D-O1 : d'en bas, l'œil (1,65 m) et la bouche d'une arme au sol restent sous le rebord.
  assert.ok(RV.eyeHeight * 2 < RR.stepMetres && RV.muzzleHeight < RR.stepMetres);
  // Rampe de 12 m (carte locale) : pente d'environ 18°.
  const slope = Math.atan(RR.stepMetres / C.WorldLocal217Rules.ramp) * 180 / Math.PI; assert.ok(slope > 15 && slope < 20, slope);
  assert.equal(C.WorldSave217Rules.open, false, 'génération 12 toujours fermée');
});

test('O8b : module de présentation isolé — sans tirage, horloge ni écriture ; hors index.html, sw.js et build ; appels gardés par le terrain', () => {
  const source = read('src/terrain-fps217.js'), code = source.replace(/\/\/.*$/gm, '');
  assert.ok(!/Math\.random|Date\.now|performance\.|setTimeout|setInterval|requestAnimationFrame|localStorage|crypto|\.elapsed|\.random\b|Random\(/.test(code), 'ni tirage ni horloge');
  assert.ok(!/\b(game|world|g|t|terrain|b|e|box|pose|muzzle)(\.[\w$]+|\[[^\]]+\])+\s*(=(?!=)|\+=|-=|\*=|\/=|\+\+|--)/.test(code), 'aucune affectation sur la partie, le monde ou les acteurs');
  assert.ok(!/\b(game|world|g|t|terrain)\.[\w$.]*\.(push|splice|set|add|delete|fill|sort|pop|shift|unshift)\(/.test(code), 'aucune mutation de collection de la partie');
  assert.ok(!/WorldLocal217|world-local217|WorldRelief217|CantonGen217|WorldCantons217/.test(source), 'ne nomme pas les modules du monde');
  for (const file of ['index.html', 'sw.js', 'scripts/server.mjs', 'scripts/build.mjs', 'scripts/public-manifest183.cjs', 'src/expansion-kit.js', 'src/expansion-ui.js'])
    assert.ok(!read(file).includes('terrain-fps217'), file);
  const dist = path.join(ROOT, 'dist');
  if (fs.existsSync(dist)) {
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
    for (const file of walk(dist)) assert.ok(!/terrain-fps217/.test(file), file);
  }
  // Points d'appel : le peintre FPS ne lit le module que sur un monde de terrain ; les gardes du commandant et des
  // passerelles sont neutres sans terrain.
  const render = read('src/vertical-citadel175-render.js');
  assert.equal((render.match(/DeadwallTerrainFPS217/g) || []).length, 1);
  assert.match(render, /const T=g\.world\?\.terrain217\?root\.DeadwallTerrainFPS217\|\|null:null/);
  assert.match(read('src/vertical-citadel175.js'), /const landing217=\(from,to\)=>!g\.world\?\.terrain217\|\|g\.world\.stepClear217\(/);
  assert.match(read('src/vertical-network179.js'), /if\(g\.world\?\.terrain217&&tier217\(f\.p\.site\)!==tier217\(toSite\)\)/);
  assert.equal(require('../src/vertical-citadel175-render.js'), Render);
});

test('O8b : champ de hauteur par palier — parois des falaises, plans inclinés des rampes, eau abaissée', () => {
  const World = g.world.constructor;
  for (const [seed, ramps] of [[17117, 0], [0, 2], [46, 6]]) {
    const w = new World(seed, 0, C.localMap217(192), describe(seed)), t = w.terrain217, m = F.mesh(w), H = m.heights;
    assert.equal(F.mesh(w), m, 'maillage dérivé une fois par terrain');
    assert.equal(m.ramps.length, ramps, seed + ' : rampes');
    let cliffs = 0, walks = 0, flanks = 0;
    // Hauteurs partagées par deux cases voisines sur leur arête commune (deux extrémités).
    const shared = (i, j, east) => east ? [[H[i * 4 + 1], H[j * 4]], [H[i * 4 + 2], H[j * 4 + 3]]] : [[H[i * 4 + 3], H[j * 4]], [H[i * 4 + 2], H[j * 4 + 1]]];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, k = i * 4;
      if (t.kinds[i] !== 2) { const h = t.levels[i] * STEP - (t.water[i] ? RR.waterDrop : 0); for (let c = 0; c < 4; c++) assert.equal(H[k + c], Math.fround(h)); }
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy; if (nx >= N || ny >= N) continue; const j = ny * N + nx, pairs = shared(i, j, dx === 1);
        // Pas franchissable : aucune marche ; seul le flanc d'une rampe, du côté de son propre palier (même palier, donc
        // franchissable en jeu), montre une marche d'au plus un demi-cran le long du plan incliné.
        if (w.canStep(x, y, nx, ny) && w.canStep(nx, ny, x, y) && !t.water[i] && !t.water[j]) {
          walks++; const flank = (t.kinds[i] === 2) !== (t.kinds[j] === 2);
          for (const [a, b] of pairs) if (flank) { assert.ok(Math.abs(a - b) <= STEP / 2 + 1e-4, seed + ' : flanc de rampe'); if (a !== b) flanks++; } else assert.equal(a, b, seed + ' : pas franchissable sans marche en ' + x + ',' + y);
        }
        if (t.levels[i] !== t.levels[j] && !(dx === 1 ? t.passes[i] & 1 : t.passes[i] & 2)) {
          cliffs++; for (const [a, b] of pairs) assert.ok(Math.abs(a - b) >= STEP - RR.waterDrop - 1e-4, seed + ' : paroi de falaise');
        }
      }
    }
    assert.ok(cliffs > 100 && walks > 30000, seed + ' : ' + cliffs + ' arêtes de falaise, ' + walks + ' pas');
    if (!ramps) assert.equal(flanks, 0);
    // Rampes : plan incliné monotone du palier bas au palier haut le long de l'axe ; pente d'un cran sur sa longueur.
    for (const r of m.ramps) {
      const len = r.axis === 'x' ? r.right - r.left : r.bottom - r.top; assert.ok(r.high - r.low <= 1 && len >= 2, JSON.stringify(r));
      // Composante de rampe posée sur un seul palier (46) : plate.
      if (r.high === r.low) { for (let y = r.top; y < r.bottom; y++) for (let x = r.left; x < r.right; x++) if (w.terrainAt217((x + .5) * T, (y + .5) * T).kind === 2) assert.equal(F.elevation(w, (x + .5) * T, (y + .5) * T), Math.fround(r.low * STEP)); continue; }
      assert.ok(len >= 6);
      const x = r.axis === 'x' ? r.left : Math.floor((r.left + r.right) / 2), y = r.axis === 'x' ? Math.floor((r.top + r.bottom) / 2) : r.top;
      const along = []; for (let s = 0; s < len; s++) { const cx = r.axis === 'x' ? x + s : x, cy = r.axis === 'x' ? y : y + s; along.push(F.elevation(w, (cx + .5) * T, (cy + .5) * T)); }
      const sign = Math.sign(along.at(-1) - along[0]); assert.ok(sign !== 0);
      for (let s = 1; s < len; s++) { const d = (along[s] - along[s - 1]) * sign; assert.ok(d > 0 && d <= STEP / len + 1e-4, seed + ' : pente de rampe'); }
      const ends = [along[0] - (STEP / len) / 2 * sign, along.at(-1) + (STEP / len) / 2 * sign];
      assert.ok(Math.abs(Math.min(...ends) - r.low * STEP) < 1e-3 && Math.abs(Math.max(...ends) - r.high * STEP) < 1e-3, seed + ' : rampe raccordée aux deux paliers');
    }
    // Maillage : triangles complets, valeurs finies, hauteurs bornées ; parois verticales présentes.
    assert.equal(m.data.length % 18, 0); let vertical = 0, minZ = Infinity, maxZ = -Infinity;
    for (let v = 0; v < m.data.length; v += 6) { assert.ok(Number.isFinite(m.data[v]) && Number.isFinite(m.data[v + 2]) && Number.isFinite(m.data[v + 5])); minZ = Math.min(minZ, m.data[v + 2]); maxZ = Math.max(maxZ, m.data[v + 2]); }
    for (let v = 0; v < m.data.length; v += 18) { const d = m.data; if (d[v] === d[v + 6] && d[v + 6] === d[v + 12] || d[v + 1] === d[v + 7] && d[v + 7] === d[v + 13]) if (d[v + 2] !== d[v + 8] || d[v + 8] !== d[v + 14]) vertical++; }
    assert.ok(vertical > cliffs, seed + ' : parois ' + vertical);
    assert.equal(maxZ, m.max * STEP); assert.equal(minZ, Math.fround(m.min * STEP - RR.skirtMetres));
    assert.ok(m.vertices < 140000, seed + ' : sommets ' + m.vertices);
    if (seed === 46) { let water = 0; for (let i = 0; i < N * N; i++) if (t.water[i] === 3) water++; assert.ok(water > 400, 'rivière'); }
  }
});

test('O8b : œil et commandant bornés par canStep — palier du support, entrée et sortie, chute', () => {
  for (const seed of [17117, 0]) {
    const { world: w } = terrainGame(seed), V = g.vertical175;
    const { building: b } = armTerrainCitadel217(g, { x: 96, y: 96 });
    const q = V.moduleRef(V.presentation().controlled), muzzle = V.muzzle(q), eye = F.eye(w, muzzle, b), level = F.levelOf(w, b);
    assert.equal(eye.z, muzzle.z + level * STEP, seed + ' : œil levé du palier du support');
    assert.deepEqual([eye.x, eye.y], [muzzle.x, muzzle.y]);
    assert.equal(w.terrainAt217(muzzle.x * T, muzzle.y * T).level, level, 'bouche au-dessus du palier du support');
    assert.ok(w.stepClear217(b.x, b.y, muzzle.x * T, muzzle.y * T), 'bouche reliée au support par canStep');
    // La vue envoie exactement cet œil ; la bouche simulée (requête de visée, tirs) reste relative au sol local.
    const r = recorder(), fps = Render.createFPS(r.canvas);
    try { assert.equal(fps.draw(g), true); } finally { fps.dispose(); }
    assert.deepEqual(r.calls.find(c => c[0] === 'uniform3f').slice(2), [eye.x, eye.y, eye.z]);
    assert.deepEqual(V.muzzle(q), muzzle);
  }
  // Entrée par l'escalier : refusée quand la falaise sépare l'entrée du support (emprise sur un palier, porte sur l'autre).
  // O6c : une telle emprise est désormais refusée dès la pose (`placement217`) ; le support est ajouté directement au
  // monde pour vérifier que la garde de l'escalier tient toujours (défense en profondeur).
  const { world: w } = terrainGame(17117), V = g.vertical175, def = w.definition('verticalFoundation6'), Building = g.core().constructor;
  let bad = null;
  for (let y = 4; y < N - 16 && !bad; y++) for (let x = 4; x < N - 16 && !bad; x++) {
    const q = w.placement(def, x, y, 0); if (q.valid || !/Entrée de la citadelle/.test(q.reason)) continue;
    const probe = new Building(0, 'verticalFoundation6', x, y, 0, 1, w.cityGeometry202), door = S.entrance(probe);
    if (!w.stepClear217(probe.x, probe.y, door.x, door.y) && g.friendlyPositionClear(g.player, door.x, door.y)) bad = { x, y };
  }
  assert.ok(bad, 'emprise dont la porte tombe sur l’autre palier, refusée dès la pose');
  const b = new Building(g.nextId++, 'verticalFoundation6', bad.x, bad.y, 0, 1, w.cityGeometry202); b.health = b.maxHealth; w.add(b);
  V.step(.1); const door = V.entrance(b); g.player.x = door.x; g.player.y = door.y;
  const refused = V.accessQuote(b.id, 0); assert.equal(refused.ok, false); assert.match(refused.reason, /falaise/);
  // Chute (support perdu) : jamais posé sur l'autre palier par-dessus la falaise, alors que la recherche d'origine l'aurait fait.
  let fall = null;
  for (const seed of [17117, 0, 46]) {
    const { world: w2 } = terrainGame(seed), t = w2.terrain217;
    // Support sur le palier bas, son bord est contre une falaise montante, porte sur son palier.
    const d2 = w2.definition('verticalFoundation6'); let spot = null;
    for (let y = 4; y < N - 16 && !spot; y++) for (let x = 4; x < N - 16 && !spot; x++) {
      const e = (y + 6) * N + x + 12, i = e - 1; if (!(t.levels[e] > t.levels[i]) || t.passes[i] & 1 || t.water[e] || !w2.placement(d2, x, y, 0).valid) continue;
      const probe = new Building(0, 'verticalFoundation6', x, y, 0, 1, w2.cityGeometry202), door2 = S.entrance(probe);
      if (w2.stepClear217(probe.x, probe.y, door2.x, door2.y) && g.friendlyPositionClear(g.player, door2.x, door2.y)) spot = { x, y };
    }
    if (!spot) continue;
    const { building: c } = armTerrainCitadel217(g, { x: spot.x + 6, y: spot.y + 6 }, { radius: 1 });
    assert.deepEqual([c.gx, c.gy], [spot.x, spot.y]);
    V.release(); g.player.x = c.x; g.player.y = c.y; g.moveFriendly(g.player, 5000, 0);
    const from = { x: g.player.x, y: g.player.y }, home = F.levelOf(w2, c);
    // Recherche d'origine (sans la garde) : premier point libre de l'anneau.
    let naive = null; c.health = 0;
    for (let r = T; r < T * 12 && !naive; r += T) for (let k = 0; k < 16; k++) { const p = { x: from.x + Math.cos(k * Math.PI / 8) * r, y: from.y + Math.sin(k * Math.PI / 8) * r }; if (Game.prototype.friendlyPositionClear.call(g, g.player, p.x, p.y)) { naive = p; break; } }
    V.step(.1);
    assert.equal(V.pose().site, null, 'commandant tombé');
    fall = { seed, naive: naive && w2.terrainAt217(naive.x, naive.y).level, landed: w2.terrainAt217(g.player.x, g.player.y).level, home };
    assert.ok(w2.stepClear217(from.x, from.y, g.player.x, g.player.y), seed + ' : chute bornée par canStep');
    assert.equal(fall.landed, home, seed + ' : posé sur le palier du support');
    if (fall.naive !== home) break;
  }
  assert.ok(fall, 'support contre une falaise');
  assert.notEqual(fall.naive, fall.home, 'sans la garde, la chute franchissait la falaise : ' + JSON.stringify(fall));
});

test('O8b : peinture — citadelles, infectés, équipe et gisements posés sur leur palier ; D-O1 dans la vue', () => {
  const { world: w } = terrainGame(17117), V = g.vertical175, t = w.terrain217;
  const { building: b } = armTerrainCitadel217(g, { x: 96, y: 96 }), level = F.levelOf(w, b), floor = level * STEP;
  const q = V.moduleRef(V.presentation().controlled), muzzle = V.muzzle(q);
  g.units.length = 0; g.daylight = () => 1;
  const draw = () => { const r = recorder(), fps = Render.createFPS(r.canvas); try { assert.equal(fps.draw(g), true); return { r, d: fps.diagnostics() }; } finally { fps.dispose(); } };
  const empty = draw();
  // Maillage du relief envoyé une fois, peint avant le décor ; aucun sol plat.
  assert.equal(empty.d.terrainVertices, F.mesh(w).vertices);
  assert.equal(empty.r.calls.filter(c => c[0] === 'bufferData' && String(c[2]).startsWith('f32:')).length, 1);
  // Boîtes de la géométrie partagée : la citadelle et ses dalles levées du palier.
  const geometry = V.geometry().filter(x => x.owner === b.id), statics = empty.r.data.filter(Boolean)[0];
  const zs = new Set(); for (let i = 2; i < statics.length; i += 6) zs.add(Math.round(statics[i] * 1000) / 1000);
  for (const box of geometry) assert.ok(zs.has(Math.round((box.z + floor) * 1000) / 1000), 'boîte levée ' + box.type);
  // Infecté sur le palier de l'œil : peint, pieds à la hauteur du sol ; au-delà d'une falaise montante : caché (D-O1).
  const probe = new Zombie(g.nextId++, 'walker', 0, 0, g.difficulty, g.wave, g.local), aim = V.sightQuery(muzzle, q.def.range, q.m.id);
  // Même requête, terrain masqué le temps de sa création (portée, boîtes et lumière seules) : sépare l'effet de D-O1.
  Object.defineProperty(w, 'terrain217', { value: null, configurable: true });
  let flatAim; try { flatAim = V.sightQuery(muzzle, q.def.range, q.m.id); } finally { delete w.terrain217; }
  const near = (() => { for (let r = 16; r < 60; r++) for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16; Object.assign(probe, { x: (muzzle.x + Math.cos(a) * r) * T, y: (muzzle.y + Math.sin(a) * r) * T }); const c = w.terrainAt217(probe.x, probe.y); if (c && c.level === level && !c.water && aim(probe)) return { x: probe.x, y: probe.y }; } return null; })();
  const up = (() => { for (let r = 4; r < 80; r++) for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16, x = Math.floor(muzzle.x + Math.cos(a) * r), y = Math.floor(muzzle.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = y * N + x; Object.assign(probe, { x: (x + .5) * T, y: (y + .5) * T }); if (t.levels[i] > level && !t.water[i] && flatAim(probe) && !w.sightClear217({ x: muzzle.x * T, y: muzzle.y * T }, probe, level)) return { x: probe.x, y: probe.y }; } return null; })();
  assert.ok(up, 'plateau au-dessus du support');
  assert.ok(near, 'infecté visible sur le palier de l’œil');
  const zLow = new Zombie(g.nextId++, 'walker', near.x, near.y, g.difficulty, g.wave, g.local), zHigh = new Zombie(g.nextId++, 'walker', up.x, up.y, g.difficulty, g.wave, g.local);
  assert.equal(w.terrainAt217(zLow.x, zLow.y).level, level); assert.equal(V.sightQuery(muzzle, q.def.range, q.m.id)(zLow), true);
  g.zombies.length = 0; g.zombies.push(zLow); const one = draw(), low = lastDynamic(one.r);
  assert.ok(low.length > 0); assert.equal(Math.min(...low.map(v => v[2])), Math.fround(F.elevation(w, zLow.x, zLow.y)), 'pieds sur le sol du palier');
  g.zombies.push(zHigh); const two = draw();
  assert.equal(two.d.dynamicVertices, one.d.dynamicVertices, 'infecté du plateau non peint depuis le contrebas (D-O1)');
  // O6c : la requête de visée simulée applique D-O1 comme la vue (réserve O8b soldée).
  assert.equal(flatAim(zHigh), true, 'à portée et sans boîte devant');
  assert.equal(aim(zHigh), false, 'la requête de visée simulée lit la falaise (D-O1)');
  // Depuis le plateau, le contrebas reste visible.
  const { world: w2 } = terrainGame(17117), t2 = w2.terrain217; g.daylight = () => 1; g.units.length = 0;
  const { building: hb } = armTerrainCitadel217(g, { x: up.x / T, y: up.y / T }, { level: t2.levels[Math.floor(up.y / T) * N + Math.floor(up.x / T)], radius: 50 });
  const hq = V.moduleRef(V.presentation().controlled), hm = V.muzzle(hq), hl = F.levelOf(w2, hb);
  const below = (() => { for (let r = 8; r < 80; r++) for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16, x = Math.floor(hm.x + Math.cos(a) * r), y = Math.floor(hm.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue; const i = y * N + x; if (t2.levels[i] < hl && !t2.water[i]) return { x: (x + .5) * T, y: (y + .5) * T }; } return null; })();
  assert.ok(below, 'contrebas sous le plateau');
  g.zombies.length = 0; const none = draw();
  g.zombies.push(new Zombie(g.nextId++, 'walker', below.x, below.y, g.difficulty, g.wave, g.local)); const seen = draw();
  if (V.sightQuery(hm, hq.def.range, hq.m.id)(g.zombies[0])) assert.ok(seen.d.dynamicVertices > none.d.dynamicVertices, 'contrebas visible d’en haut');
  g.zombies.length = 0;
});

test('O8b : passerelle refusée entre deux supports posés sur deux paliers ; neutre sans terrain', () => {
  // Garde lue après la forme de la passerelle et avant ses autres conditions de chantier.
  const source = read('src/vertical-network179.js'), at = source.indexOf('tier217(f.p.site)');
  assert.ok(at > source.indexOf("const q=linkShape(candidate)") && at < source.indexOf('if(!corridorFree(candidate,q))'));
  const { world: w } = terrainGame(17117), V = g.vertical175, t = w.terrain217, def = w.definition('verticalFoundation6'), Building = g.core().constructor;
  // Support A sur le palier bas, falaise montante au nord ; support B sur le plateau, aligné, à quelques mètres.
  const ok = (x, y) => { if (!w.placement(def, x, y, 0).valid) return false; const p = new Building(0, 'verticalFoundation6', x, y, 0, 1, w.cityGeometry202), d = S.entrance(p); return w.stepClear217(p.x, p.y, d.x, d.y) && g.friendlyPositionClear(g.player, d.x, d.y); };
  let pair = null;
  for (let y = 20; y < N - 16 && !pair; y++) for (let x = 4; x < N - 16 && !pair; x++) {
    const a = y * N + x; if (!ok(x, y)) continue;
    for (let gap = 2; gap <= 8 && !pair; gap++) { const by = y - 12 - gap; if (by < 2) break; if (t.levels[by * N + x] !== t.levels[a] + 1 || !ok(x, by)) continue; pair = { x, y, by }; }
  }
  assert.ok(pair, 'deux emprises alignées de part et d’autre d’une falaise');
  const { building: A } = armTerrainCitadel217(g, { x: pair.x + 6, y: pair.y + 6 }, { radius: 1, module: null });
  assert.deepEqual([A.gx, A.gy], [pair.x, pair.y]);
  const B = new Building(g.nextId++, 'verticalFoundation6', pair.x, pair.by, 0, 1, w.cityGeometry202); B.health = B.maxHealth; w.add(B); V.step(.1);
  assert.notEqual(F.levelOf(w, A), F.levelOf(w, B));
  g.player.x = A.x; g.player.y = A.top + 24;
  const q = V.network.linkQuote(B.id, 0); assert.equal(q.ok, false); assert.match(q.reason, /deux paliers/);
  // La forme de la passerelle (alignement, hauteur relative, portée) est admise : seule la garde du terrain refuse.
  assert.doesNotMatch(q.reason, /alignés/);
});

test('O8b : sonde — 600 images sans tirage, horloge ni écriture : état, monde et flux régional inchangés', () => {
  for (const seed of [17117, 0, 46]) {
    const { world } = terrainGame(seed), t = world.terrain217, V = g.vertical175;
    armTerrainCitadel217(g, { x: 96, y: 96 });
    const q = V.moduleRef(V.presentation().controlled), yaw = q.m.yaw, pitch = q.m.pitch;
    for (const [dx, dy] of [[0, -8], [6, -14], [-9, 10]]) g.zombies.push(new Zombie(g.nextId++, 'walker', g.player.x + dx * T, g.player.y + dy * T, g.difficulty, g.wave, g.local));
    g.settings.reducedMotion = false;
    const region = g.frontier?.world?.(), stats = () => JSON.stringify(region?.streamStats?.() ?? null);
    const base = () => { const d = g.serialize(); delete d.timestamp; return JSON.stringify(d); };
    const print = () => hash(JSON.stringify([base(), V.snapshot(), g.random, g.nextId, g.resources, [...world.occupancy], world.nodes, [...world.buildings.keys()], ['levels', 'passes', 'water', 'roads', 'kinds', 'deep', 'ford'].map(k => [...t[k]]), g.zombies.map(z => [z.x, z.y, z.health, z.facing]), g.units.map(u => [u.x, u.y]), g.player.x, g.player.y, g.elapsed]));
    const before = print(), stream = stats(), r = recorder(), fps = Render.createFPS(r.canvas);
    // Tout tirage ou lecture d'horloge pendant le tracé d'une image est compté (peintre et module du relief).
    const clock = [Math.random, Date.now, performance.now]; let inside = 0, forbidden = 0, frames = 0;
    Math.random = function () { if (inside) forbidden++; return clock[0].call(Math); };
    Date.now = function () { if (inside) forbidden++; return clock[1].call(Date); };
    performance.now = function () { if (inside) forbidden++; return clock[2].call(performance); };
    try {
      for (let i = 0; i < 600; i++) {
        V.aim(yaw + i / 600 * Math.PI * 2, pitch - .1 + (i % 7) * .03);
        inside++; try { if (fps.draw(g)) frames++; } finally { inside--; }
      }
    } finally { [Math.random, Date.now, performance.now] = clock; fps.dispose(); }
    assert.equal(frames, 600); assert.equal(forbidden, 0, 'aucun tirage ni horloge');
    assert.equal(r.calls.filter(c => c[0] === 'bufferData' && String(c[2]).startsWith('f32:')).length, 1, 'relief envoyé une fois');
    assert.equal(stats(), stream, 'flux régional inchangé');
    // La visée est réglée par le harnais ; tout le reste est identique.
    V.aim(yaw, pitch);
    assert.equal(print(), before, 'état inchangé après 600 images (graine ' + seed + ')');
    g.zombies.length = 0;
  }
});

// --- G1–G11 : séquence d'appels WebGL identique ------------------------------------------------------------
function flatScene() {
  advanced(); const V = g.vertical175, type = 'verticalFoundation6', def = g.world.definition(type), centre = C.WORLD_TILES / 2, spots = [];
  assert.equal(g.world.terrain217, null);
  for (let x = 0; x <= C.WORLD_TILES - def.size[0]; x++) for (let y = 0; y <= C.WORLD_TILES - def.size[1]; y++) spots.push({ x, y });
  spots.sort((a, b) => (a.x + 6 - centre) ** 2 + (a.y + 6 - centre) ** 2 - ((b.x + 6 - centre) ** 2 + (b.y + 6 - centre) ** 2) || a.x - b.x || a.y - b.y);
  let b = null; for (const { x, y } of spots) if (g.world.placement(def, x, y, 0).valid) { assert.equal(g.placeOne(type, x, y), true); b = g.world.atCell(x, y); break; }
  b.progress = 1; b.health = b.maxHealth; g.refreshMetrics(true);
  const step = s => { for (let n = 0; n < s - 1e-6; n += .1) V.step(Math.min(.1, s - n)); };
  const door = V.entrance(b); g.player.x = door.x; g.player.y = door.y; const qq = V.accessQuote(b.id, 0); assert.equal(qq.ok, true, qq.reason); V.access(b.id, 0); step(qq.seconds + .2);
  g.player.x = b.x; g.player.y = b.y; assert.equal(V.buildModule('sentry', 0).ok, true); step(RV.modules.sentry.seconds + .2);
  const m = V.snapshot().sites.find(s => s.id === b.id).decks[0].modules[0], p = S.slots(b)[0];
  g.player.x = p.x * T + (RV.modules.sentry.size[0] / 2) * T + 13; g.player.y = p.y * T; assert.equal(V.possess(m.id).ok, true);
  for (const [dx, dy] of [[0, -9], [4, -15], [-6, -20]]) g.zombies.push(new Zombie(g.nextId++, 'walker', b.x + dx * T, b.y + dy * T, g.difficulty, g.wave, g.local));
  g.daylight = () => .8; g.settings.reducedMotion = false;
  return V;
}
function flatFrames(createFPS) {
  const V = g.vertical175, q = V.moduleRef(V.presentation().controlled), yaw = q.m.yaw, elapsed = g.elapsed, r = recorder(), fps = createFPS(r.canvas);
  try { for (let i = 0; i < 24; i++) { V.aim(yaw - .6 + i * .05, -.05); g.elapsed = elapsed + i / 30; for (const z of g.zombies) z.x += 3; assert.equal(fps.draw(g), true); } }
  finally { fps.dispose(); V.aim(yaw, 0); g.elapsed = elapsed; for (const z of g.zombies) z.x -= 72; }
  return r.calls;
}
test('O8b : en G1–G11, la vue FPS fait la même séquence d’appels WebGL avec ou sans le module, et qu’avant la tranche', t => {
  flatScene(); const flatSave = () => { const d = Game.prototype.serialize.call(g); delete d.timestamp; return JSON.stringify(d); }, before = flatSave(), keep = globalThis.DeadwallTerrainFPS217;
  // Un espion à la place du module : jamais appelé sur une carte plate.
  let calls = 0; const spy = Object.fromEntries(Object.entries(F).map(([k, f]) => [k, typeof f === 'function' ? (...a) => { calls++; return f(...a); } : f]));
  let withModule, without;
  try {
    globalThis.DeadwallTerrainFPS217 = spy; withModule = flatFrames(Render.createFPS);
    delete globalThis.DeadwallTerrainFPS217; without = flatFrames(Render.createFPS);
  } finally { globalThis.DeadwallTerrainFPS217 = keep; }
  assert.equal(calls, 0, 'module jamais appelé en G1–G11');
  assert.ok(withModule.length > 300 && withModule.some(c => c[0] === 'drawArrays'), 'tracés enregistrés : ' + withModule.length);
  assert.equal(hash(JSON.stringify(withModule)), hash(JSON.stringify(without)), 'séquence identique avec ou sans le module');
  // Sol plat d'origine toujours envoyé (boîte de la carte à -0,2 m) ; trois tampons seulement.
  assert.equal(withModule.filter(c => c[0] === 'createBuffer').length, 2);
  // Avant la tranche : peintre de la base `8d7ea21` (si l'historique git est présent).
  let source = null; try { source = execFileSync('git', ['show', '8d7ea21:src/vertical-citadel175-render.js'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { source = null; }
  if (!source) { t.diagnostic('historique git absent : comparaison avec la base sautée'); }
  else {
    const keepRender = globalThis.DeadwallVertical175Render, mod = { exports: {} };
    try { new Function('module', 'require', source)(mod, () => C); } finally { globalThis.DeadwallVertical175Render = keepRender; }
    const old = flatFrames(mod.exports.createFPS);
    assert.equal(hash(JSON.stringify(old)), hash(JSON.stringify(without)), 'séquence identique à la base');
  }
  assert.equal(flatSave(), before, 'partie inchangée');
});
