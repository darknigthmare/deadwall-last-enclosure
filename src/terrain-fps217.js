// Relief de la cité de génération 12 dans la vue à la première personne (specs/monde-sans-bord/ouverture.md, tranche
// O8b, décisions D-O1 et D-O3). Présentation seule : lit la grille gardée par le monde (`world.terrain217` : paliers,
// arêtes franchissables, eau, routes, natures) et ne crée ni stock, ni dégât, ni tirage aléatoire, ni horloge. Aucune
// écriture dans la partie ni dans le monde : le maillage est dérivé une fois par terrain et gardé dans une table faible.
// Hors jeu : non chargé par index.html ; atteint seulement par un harnais qui construit une partie avec le terrain. Une
// carte plate (G1–G11) n'a pas de terrain et ne passe jamais ici (le peintre FPS garde son sol plat).
// Unités : celles de la vue FPS (une case = un mètre = `VerticalCitadel175.tile` unités de la carte), z vers le haut.
// Champ de hauteur : palier × `TerrainRelief217Rules.stepMetres` ; une rampe est un plan incliné d'un palier à l'autre
// le long de son axe ; l'eau est abaissée de `waterDrop`. Toute arête entre deux surfaces de hauteur différente reçoit
// une paroi verticale (falaise, flanc de rampe, rive). La simulation garde ses hauteurs relatives au sol local : seule
// la peinture ajoute le palier (camera, citadelles, infectés, équipe, caisses, gisements).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeadwallTerrainFPS217 = api;
})(globalThis, function (root) {
  'use strict';
  const C = root.DeadwallCore || (typeof require === 'function' ? require('./core.js') : null);
  const R = C.TerrainRelief217Rules, TILE = C.VerticalCitadel175.tile;
  // Codes de la grille (mêmes valeurs que le monde : eau 1 mer, 2 lac, 3 rivière, 4 ruisseau ; nature 2 = rampe).
  const RAMP = 2, EPS = 1e-4;
  const MESH = new WeakMap();
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // Hachage entier pur d'une case : grain du sol et des strates, jamais un flux de tirage.
  function grain(x, y, salt) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(salt | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  // Teintes (0…1, avant l'éclairage du nuanceur) : contrebas sombre et humide, plateaux plus secs ; mêmes familles que O8a.
  const LOW = [.19, .25, .18], MID = [.29, .31, .22], HIGH = [.42, .40, .30];
  const ROCK = [.43, .40, .34], ROCK_DARK = [.30, .28, .25], BANK = [.30, .27, .20];
  const WATER_RGB = { 1: [.11, .20, .25], 2: [.13, .23, .25], 3: [.16, .26, .27], 4: [.21, .31, .28] };
  const ROAD_RGB = [[.29, .28, .25], [.32, .30, .26], [.36, .33, .26]], BRIDGE_RGB = [.39, .35, .28], RAMP_RGB = [.45, .42, .34];
  // Orientation des parois (même lecture que les faces des boîtes du peintre : nord .68, sud .83, ouest .6, est .75).
  const FACING = { north: .68, south: .83, west: .6, east: .75 };
  const terrainOf = world => world?.terrain217 || null;

  // --- Champ de hauteur ----------------------------------------------------------------------------
  // Hauteurs des quatre coins de chaque case (nord-ouest, nord-est, sud-est, sud-ouest), en mètres.
  function corners(t) {
    const N = t.tiles, cells = N * N, L = t.levels, out = new Float32Array(cells * 4);
    for (let i = 0; i < cells; i++) { const h = L[i] * R.stepMetres - (t.water[i] ? R.waterDrop : 0); out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = out[i * 4 + 3] = h; }
    // Rampes : composantes connexes de cases de rampe ; axe et sens par les arêtes franchies qui changent de palier ;
    // plan incliné du palier bas au palier haut sur toute la longueur de la composante.
    const seen = new Uint8Array(cells), ramps = [];
    for (let s = 0; s < cells; s++) {
      if (seen[s] || t.kinds[s] !== RAMP) continue;
      const list = [s]; seen[s] = 1; let ax = 0, ay = 0, l = N, r = 0, top = N, bottom = 0, lo = 255, hi = 0;
      for (let q = 0; q < list.length; q++) {
        const i = list[q], x = i % N, y = (i - x) / N;
        l = Math.min(l, x); r = Math.max(r, x + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
        lo = Math.min(lo, L[i]); hi = Math.max(hi, L[i]);
        if (x < N - 1 && L[i] !== L[i + 1] && t.passes[i] & 1) ax++;
        if (y < N - 1 && L[i] !== L[i + N] && t.passes[i] & 2) ay++;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const j = ny * N + nx;
          if (!seen[j] && t.kinds[j] === RAMP) { seen[j] = 1; list.push(j); }
        }
      }
      const axis = ax >= ay ? 'x' : 'y', start = axis === 'x' ? l : top, end = axis === 'x' ? r : bottom, mid = (start + end) / 2;
      let lowSum = 0, lowN = 0, highSum = 0, highN = 0;
      for (const i of list) { const x = i % N, y = (i - x) / N, first = (axis === 'x' ? x + .5 : y + .5) < mid; if (first) { lowSum += L[i]; lowN++; } else { highSum += L[i]; highN++; } }
      const rising = (highN ? highSum / highN : 0) >= (lowN ? lowSum / lowN : 0), h0 = lo * R.stepMetres, h1 = hi * R.stepMetres;
      const at = v => { const f = clamp((v - start) / Math.max(1, end - start), 0, 1); return rising ? h0 + (h1 - h0) * f : h1 - (h1 - h0) * f; };
      for (const i of list) {
        const x = i % N, y = (i - x) / N, k = i * 4;
        if (axis === 'x') { out[k] = out[k + 3] = at(x); out[k + 1] = out[k + 2] = at(x + 1); }
        else { out[k] = out[k + 1] = at(y); out[k + 2] = out[k + 3] = at(y + 1); }
      }
      ramps.push(Object.freeze({ axis, rising, left: l, right: r, top, bottom, cells: list.length, low: lo, high: hi }));
    }
    return { heights: out, ramps };
  }

  // --- Maillage (x, y, z, r, g, b par sommet ; triangles) -----------------------------------------
  class Mesh {
    constructor() { this.data = new Float32Array(1 << 16); this.length = 0; }
    vertex(x, y, z, c) {
      if (this.length + 6 > this.data.length) { const next = new Float32Array(this.data.length * 2); next.set(this.data); this.data = next; }
      const d = this.data, i = this.length; d[i] = x; d[i + 1] = y; d[i + 2] = z; d[i + 3] = c[0]; d[i + 4] = c[1]; d[i + 5] = c[2]; this.length += 6;
    }
    // Quadrilatère a-b-c-d (sommets [x, y, z]) en deux triangles.
    quad(a, b, c, d, colour) { for (const p of [a, b, c, a, c, d]) this.vertex(p[0], p[1], p[2], colour); }
  }
  function colourOf(t, i, x, y, min, max) {
    const w = t.water[i], road = t.roads[i];
    if (road) return w ? BRIDGE_RGB : ROAD_RGB[clamp(road, 1, 3) - 1];
    if (w) return WATER_RGB[w] || WATER_RGB[2];
    const f = max > min ? (t.levels[i] - min) / (max - min) : .5, base = f < .5 ? mix(LOW, MID, f * 2) : mix(MID, HIGH, (f - .5) * 2);
    const n = (grain(Math.floor(x / R.block), Math.floor(y / R.block), t.seed) - .5) * .05;
    return t.kinds[i] === RAMP ? mix(base, RAMP_RGB, .5) : [base[0] + n, base[1] + n, base[2] + n * .7];
  }
  function build(t) {
    const N = t.tiles, cells = N * N, L = t.levels, field = corners(t), H = field.heights, out = new Mesh();
    let min = 255, max = 0; for (let i = 0; i < cells; i++) { if (L[i] < min) min = L[i]; if (L[i] > max) max = L[i]; }
    const flat = i => H[i * 4] === H[i * 4 + 1] && H[i * 4] === H[i * 4 + 2] && H[i * 4] === H[i * 4 + 3];
    const B = R.block, colours = new Array(cells);
    for (let i = 0; i < cells; i++) { const x = i % N; colours[i] = colourOf(t, i, x, (i - x) / N, min, max); }
    const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    // Sol : un bloc uniforme (même hauteur plate, même teinte) devient un seul quadrilatère, sinon une case par case.
    let blocks = 0, slopes = 0;
    for (let by = 0; by < N; by += B) for (let bx = 0; bx < N; bx += B) {
      const i0 = by * N + bx, x1 = Math.min(N, bx + B), y1 = Math.min(N, by + B); let uniform = true;
      for (let y = by; y < y1 && uniform; y++) for (let x = bx; x < x1; x++) { const i = y * N + x; if (!flat(i) || H[i * 4] !== H[i0 * 4] || !same(colours[i], colours[i0])) { uniform = false; break; } }
      if (uniform) { const z = H[i0 * 4]; out.quad([bx, by, z], [x1, by, z], [x1, y1, z], [bx, y1, z], colours[i0]); blocks++; continue; }
      for (let y = by; y < y1; y++) for (let x = bx; x < x1; x++) {
        const i = y * N + x, k = i * 4; let c = colours[i];
        // Rampe : trois marches par case le long de la pente, comme la peinture O8a.
        if (t.kinds[i] === RAMP && !flat(i)) { c = (x + y) % 2 ? c : mix(c, ROCK_DARK, .18); slopes++; }
        out.quad([x, y, H[k]], [x + 1, y, H[k + 1]], [x + 1, y + 1, H[k + 2]], [x, y + 1, H[k + 3]], c);
      }
    }
    // Parois : arête est (x + 1) et arête sud (y + 1) de chaque case ; bords de la carte en jupe jusqu'au pied.
    const foot = min * R.stepMetres - R.skirtMetres; let walls = 0;
    function wall(p, q, a0, a1, b0, b1, facing, salt, water) {
      // a : hauteurs du côté haut aux deux extrémités p et q ; b : celles du côté bas.
      const drop = Math.max(a0 - b0, a1 - b1); if (drop < EPS) return;
      const shade = FACING[facing], rock = water || drop < 1 ? BANK : ROCK; walls++;
      if (Math.abs(a0 - a1) < EPS && Math.abs(b0 - b1) < EPS && drop > R.strataMetres) {
        // Strates : bandes horizontales d'un mètre, teinte par hachage de l'arête et de la bande.
        for (let z = b0, n = 0; z < a0 - EPS; z += R.strataMetres, n++) {
          const top = Math.min(a0, z + R.strataMetres), v = grain(salt, n, t.seed), c = mix(rock, ROCK_DARK, .15 + v * .35 + (z === b0 ? .25 : 0));
          out.quad([p[0], p[1], top], [q[0], q[1], top], [q[0], q[1], z], [p[0], p[1], z], [c[0] * shade, c[1] * shade, c[2] * shade]);
        }
        return;
      }
      out.quad([p[0], p[1], a0], [q[0], q[1], a1], [q[0], q[1], b1], [p[0], p[1], b0], [rock[0] * shade, rock[1] * shade, rock[2] * shade]);
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, k = i * 4;
      if (x < N - 1) {
        const j = i + 1, m = j * 4, ia = H[k + 1], ib = H[k + 2], ja = H[m], jb = H[m + 3], wet = !!(t.water[i] || t.water[j]);
        // Le côté haut regarde vers le côté bas : paroi tournée vers l'est si la case ouest est plus haute.
        if (ia + ib >= ja + jb) wall([x + 1, y], [x + 1, y + 1], ia, ib, ja, jb, 'east', i * 2, wet);
        else wall([x + 1, y], [x + 1, y + 1], ja, jb, ia, ib, 'west', i * 2, wet);
      }
      if (y < N - 1) {
        const j = i + N, m = j * 4, ia = H[k + 3], ib = H[k + 2], ja = H[m], jb = H[m + 1], wet = !!(t.water[i] || t.water[j]);
        if (ia + ib >= ja + jb) wall([x, y + 1], [x + 1, y + 1], ia, ib, ja, jb, 'south', i * 2 + 1, wet);
        else wall([x, y + 1], [x + 1, y + 1], ja, jb, ia, ib, 'north', i * 2 + 1, wet);
      }
      if (x === 0) wall([0, y], [0, y + 1], H[k], H[k + 3], foot, foot, 'west', -1 - y, false);
      if (x === N - 1) wall([N, y], [N, y + 1], H[k + 1], H[k + 2], foot, foot, 'east', -1000 - y, false);
      if (y === 0) wall([x, 0], [x + 1, 0], H[k], H[k + 1], foot, foot, 'north', -2000 - x, false);
      if (y === N - 1) wall([x, N], [x + 1, N], H[k + 3], H[k + 2], foot, foot, 'south', -3000 - x, false);
    }
    const data = out.data.slice(0, out.length);
    return Object.freeze({ tiles: N, min, max, heights: H, ramps: Object.freeze(field.ramps), data, length: data.length, vertices: data.length / 6, blocks, slopes, walls });
  }
  // Maillage du terrain (une fois par terrain) ; `null` sans terrain.
  function mesh(world) {
    const t = terrainOf(world); if (!t) return null;
    let m = MESH.get(t); if (!m) { m = build(t); MESH.set(t, m); } return m;
  }

  // --- Lectures des hauteurs (mètres) ----------------------------------------------------------------
  // Surface sous un point de la carte (unités) : interpolation dans la case (plan incliné d'une rampe, eau abaissée).
  function elevation(world, x, y) {
    const m = mesh(world); if (!m || !Number.isFinite(x) || !Number.isFinite(y)) return 0;
    const N = m.tiles, fx = clamp(x / TILE, 0, N - 1e-6), fy = clamp(y / TILE, 0, N - 1e-6), gx = Math.floor(fx), gy = Math.floor(fy), u = fx - gx, v = fy - gy, k = (gy * N + gx) * 4, H = m.heights;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + 3] * (1 - u) + H[k + 2] * u) * v;
  }
  // Palier d'un bâtiment (son emprise tient sur un seul palier : `placement` du terrain) : sol plat de la case d'origine.
  function siteFloor(world, b) {
    const t = terrainOf(world); if (!t || !b || !Number.isFinite(b.gx) || !Number.isFinite(b.gy)) return 0;
    const N = t.tiles, gx = clamp(b.gx | 0, 0, N - 1), gy = clamp(b.gy | 0, 0, N - 1);
    return t.levels[gy * N + gx] * R.stepMetres;
  }
  // Sol d'un acteur peint : son support (citadelle, passerelle) s'il en a un, la surface sous ses pieds sinon.
  // `pose` : la pose simulée (relative au sol local) de `siege.enemyPose`, `population.pose` ou d'une caisse.
  function actorFloor(world, e, pose, buildings = world?.buildings, links = null) {
    if (!terrainOf(world)) return 0;
    if (pose?.bridge != null && links?.has(pose.bridge)) return links.get(pose.bridge);
    if (pose?.site != null) { const b = buildings?.get?.(pose.site); if (b) return siteFloor(world, b); }
    return elevation(world, e.x, e.y);
  }
  // Sol des boîtes de la géométrie partagée (citadelles, bâtiments, passerelles), par propriétaire.
  function boxFloor(world, box, links = null) {
    if (!terrainOf(world)) return 0;
    if (box.link != null && links?.has(box.link)) return links.get(box.link);
    if (box.owner != null) { const b = world.buildings?.get?.(box.owner); if (b) return siteFloor(world, b); }
    return elevation(world, (box.x + box.w / 2) * TILE, (box.y + box.h / 2) * TILE);
  }
  // Sol de chaque passerelle : celui de son premier support (les deux supports sont sur le même palier, `linkQuote`).
  function linkFloors(world, links) {
    const out = new Map(); if (!terrainOf(world)) return out;
    for (const { link } of links || []) { const b = world.buildings?.get?.(link?.a?.site); if (b) out.set(link.id, siteFloor(world, b)); }
    return out;
  }
  // D-O1 dans la vue : depuis l'œil posé sur le palier de son support, un acteur au-dessus d'une falaise montante est
  // caché ; d'en haut, le contrebas reste visible. Même accesseur que le jeu (`sightClear217`), aucune écriture.
  function sightClear(world, eye, e, level) {
    if (!terrainOf(world)) return true;
    return world.sightClear217({ x: eye.x * TILE, y: eye.y * TILE }, { x: e.x, y: e.y }, level);
  }
  function levelOf(world, b) {
    const t = terrainOf(world); if (!t || !b) return undefined;
    const N = t.tiles; return t.levels[clamp(b.gy | 0, 0, N - 1) * N + clamp(b.gx | 0, 0, N - 1)];
  }
  // Œil de la vue : la bouche de l'arme (relative au sol local) levée du palier de son support. Le support tient sur un
  // seul palier, et la bouche reste dans son emprise : l'œil ne passe jamais au-dessus d'une autre case que celle du
  // palier qui le porte (`canStep` vrai entre la case de la bouche et celle du support, vérifié par le test).
  function eye(world, muzzle, b) {
    const z = siteFloor(world, b); return z ? { x: muzzle.x, y: muzzle.y, z: muzzle.z + z } : muzzle;
  }
  function summary(world) {
    const m = mesh(world); if (!m) return null;
    return { tiles: m.tiles, min: m.min, max: m.max, stepMetres: R.stepMetres, vertices: m.vertices, blocks: m.blocks, slopes: m.slopes, walls: m.walls, ramps: m.ramps.map(r => ({ ...r })) };
  }
  return Object.freeze({ mesh, elevation, siteFloor, actorFloor, boxFloor, linkFloors, sightClear, levelOf, eye, summary, rules: R });
});
