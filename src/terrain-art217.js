// Rendu 2D/2,5D du terrain de la cité de génération 12 (specs/monde-sans-bord/ouverture.md, tranche O8a).
// Présentation seule : lit la grille gardée par le monde (`world.terrain217` : paliers, arêtes franchissables,
// eau, routes, natures) et ne crée ni stock, ni dégât, ni tirage aléatoire, ni horloge. Aucune écriture dans la
// partie ni dans le monde : les données de peinture sont dérivées une fois par terrain et gardées dans une table
// faible de ce module.
// Hors jeu : non chargé par index.html ; atteint seulement par un harnais qui construit une partie avec le
// terrain. Une carte plate (G1–G11) n'a pas de terrain et ne passe jamais ici.
// Projection : chaque palier est peint à sa vraie position (les acteurs y marchent), la falaise se dessine du côté
// bas. Face visible (palier haut au nord) : paroi de hauteur projetée sous l'arête, comme les étages de
// `CityGeometry202.presentation`. Arête arrière (palier haut au sud) : le rebord du plateau masque, sur la même
// hauteur projetée, le contrebas situé derrière lui ; cette bande entre dans la file de profondeur des acteurs.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeadwallTerrainArt217 = api;
})(globalThis, function (root) {
  'use strict';
  const C = root.DeadwallCore || (typeof require === 'function' ? require('./core.js') : null);
  const R = C.TerrainArt217Rules, TILE = C.TILE;
  // Codes de la grille (mêmes valeurs que le monde : eau 1 mer, 2 lac, 3 rivière, 4 ruisseau ; nature 2 = rampe).
  const WATER = Object.freeze({ 1: 'sea', 2: 'lake', 3: 'river', 4: 'stream' }), RAMP = 2;
  const PAINT = new WeakMap();
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a = 1) => a === 1 ? 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')' : 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')';
  // Hachage entier pur d'une case : grain du sol et des strates, jamais un flux de tirage.
  function grain(x, y, salt) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(salt | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  // Teinte par palier : contrebas humide et sombre, plateaux plus secs et plus clairs.
  const LOW = [42, 56, 41], MID = [74, 79, 55], HIGH = [114, 108, 80];
  const ROCK_TOP = [112, 104, 88], ROCK_FOOT = [44, 42, 38];
  const WATER_RGB = { sea: [30, 54, 64], lake: [35, 60, 63], river: [44, 70, 69], stream: [58, 82, 74] };
  const BED_RGB = [76, 68, 50], ROAD_RGB = [[74, 72, 64], [82, 78, 66], [92, 84, 66]], BRIDGE_RGB = [98, 90, 72];
  function tint(level, min, max) {
    const t = max > min ? (level - min) / (max - min) : .5;
    return t < .5 ? mix(LOW, MID, t * 2) : mix(MID, HIGH, (t - .5) * 2);
  }
  // Lit de l'eau : berge de la largeur de `Hydrology165Rules.kinds` (mètres = cases), bornée par `bankMaxCells`.
  function bankWidth(kind) {
    const k = C.Hydrology165Rules?.kinds?.[kind];
    return clamp(Math.round(k?.bankWidth ?? 1), 1, R.bankMaxCells);
  }
  // Projection d'un cran de falaise en unités de la carte (16 unités par mètre, comme les étages).
  const projected = () => R.cliffMetres * C.CityGeometry202.presentation.projectedHeightUnitsPerMetre;

  // --- Données de peinture, dérivées une fois par terrain -----------------------------------------
  function prepare(t) {
    let p = PAINT.get(t); if (p) return p;
    const N = t.tiles, cells = N * N, L = t.levels;
    let min = 255, max = 0; for (let i = 0; i < cells; i++) { if (L[i] < min) min = L[i]; if (L[i] > max) max = L[i]; }
    // Berges : distance (cases, voisinage à huit) à l'eau la plus proche, dans la largeur du lit de cette eau.
    const bed = new Uint8Array(cells), queue = [], reach = new Int8Array(cells).fill(-1);
    for (let i = 0; i < cells; i++) if (t.water[i]) { reach[i] = bankWidth(WATER[t.water[i]]); queue.push(i); }
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q], x = i % N, y = (i - x) / N, left = reach[i] - 1; if (left < 0) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const j = ny * N + nx; if (t.water[j] || left <= reach[j]) continue;
        reach[j] = left; bed[j] = 1; queue.push(j);
      }
    }
    // Couleur de chaque case : base sans grain (repli par bandes) et pixels avec grain (image adoucie).
    const flat = new Uint32Array(cells), pixels = new Uint8ClampedArray(cells * 4);
    for (let i = 0; i < cells; i++) {
      const x = i % N, y = (i - x) / N, w = t.water[i], road = t.roads[i];
      let c = tint(L[i], min, max);
      if (t.kinds[i] === RAMP) c = mix(c, [120, 112, 90], .22);
      if (bed[i] && !w) c = mix(c, BED_RGB, .55);
      if (w) c = WATER_RGB[WATER[w]] || WATER_RGB.lake;
      if (road) c = w ? BRIDGE_RGB : ROAD_RGB[clamp(road, 1, 3) - 1];
      const r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]);
      flat[i] = (r << 16) | (g << 8) | b;
      const n = w ? 0 : (grain(x, y, t.seed) - .5) * R.grain;
      pixels[i * 4] = r + n; pixels[i * 4 + 1] = g + n; pixels[i * 4 + 2] = b + n * .7; pixels[i * 4 + 3] = 255;
    }
    // Arêtes de falaise (changement de palier hors rampe), regroupées en traits continus.
    const faces = [], backs = [], sides = [];
    for (let y = 0; y < N - 1; y++) {
      let run = null;
      for (let x = 0; x <= N; x++) {
        const i = y * N + x, j = i + N, ok = x < N && L[i] !== L[j] && !(t.passes[i] & 2);
        const drop = ok ? L[i] - L[j] : 0, key = ok ? drop : 0;
        if (run && run.key === key && ok) { run.x1 = x + 1; continue; }
        if (run) (run.key > 0 ? faces : backs).push({ x0: run.x0, x1: run.x1, y: y + 1, drop: Math.abs(run.key) });
        run = ok ? { key, x0: x, x1: x + 1 } : null;
      }
    }
    for (let x = 0; x < N - 1; x++) {
      let run = null;
      for (let y = 0; y <= N; y++) {
        const i = y * N + x, k = i + 1, ok = y < N && L[i] !== L[k] && !(t.passes[i] & 1);
        const key = ok ? L[i] - L[k] : 0;
        if (run && run.key === key && ok) { run.y1 = y + 1; continue; }
        if (run) sides.push({ x: x + 1, y0: run.y0, y1: run.y1, drop: Math.abs(run.key), highWest: run.key > 0 });
        run = ok ? { key, y0: y, y1: y + 1 } : null;
      }
    }
    // Rampes : composantes connexes de cases de rampe ; sens de la pente par les arêtes franchies qui changent de palier.
    const ramps = [], seen = new Uint8Array(cells);
    for (let s = 0; s < cells; s++) {
      if (seen[s] || t.kinds[s] !== RAMP) continue;
      const list = [s]; seen[s] = 1; let ax = 0, ay = 0, l = N, r = 0, top = N, bottom = 0;
      for (let q = 0; q < list.length; q++) {
        const i = list[q], x = i % N, y = (i - x) / N;
        l = Math.min(l, x); r = Math.max(r, x + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
        if (x < N - 1 && L[i] !== L[i + 1] && t.passes[i] & 1) ax++;
        if (y < N - 1 && L[i] !== L[i + N] && t.passes[i] & 2) ay++;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const j = ny * N + nx;
          if (!seen[j] && t.kinds[j] === RAMP) { seen[j] = 1; list.push(j); }
        }
      }
      const axis = ax >= ay ? 'x' : 'y';
      // Côté haut : moyenne des paliers de la première et de la dernière moitié le long de l'axe.
      let lowSum = 0, lowN = 0, highSum = 0, highN = 0; const mid = axis === 'x' ? (l + r) / 2 : (top + bottom) / 2;
      for (const i of list) { const x = i % N, y = (i - x) / N, v = (axis === 'x' ? x + .5 : y + .5) < mid; if (v) { lowSum += L[i]; lowN++; } else { highSum += L[i]; highN++; } }
      const rising = (highN ? highSum / highN : 0) >= (lowN ? lowSum / lowN : 0);
      ramps.push(Object.freeze({ cells: Object.freeze(list), axis, rising, left: l, right: r, top, bottom, crossings: ax + ay }));
    }
    p = Object.freeze({ tiles: N, min, max, flat, pixels, faces: Object.freeze(faces), backs: Object.freeze(backs), sides: Object.freeze(sides), ramps: Object.freeze(ramps), image: undefined, mini: undefined });
    PAINT.set(t, p); return p;
  }
  // Image d'un pixel par case (adoucie à l'agrandissement) ; `null` sans canevas utilisable (DOM factice).
  const IMAGES = new WeakMap();
  function image(p) {
    if (IMAGES.has(p)) return IMAGES.get(p);
    let out = null;
    try {
      const doc = root.document, canvas = typeof root.OffscreenCanvas === 'function' ? new root.OffscreenCanvas(p.tiles, p.tiles) : doc?.createElement?.('canvas');
      if (canvas) {
        canvas.width = p.tiles; canvas.height = p.tiles;
        const c = canvas.getContext?.('2d'), data = c?.createImageData?.(p.tiles, p.tiles);
        if (data?.data?.length === p.pixels.length) { data.data.set(p.pixels); c.putImageData(data, 0, 0); out = canvas; }
      }
    } catch { out = null; }
    IMAGES.set(p, out); return out;
  }
  const terrainOf = game => game?.world?.terrain217 || null;
  const cellsIn = (v, N) => ({ x0: clamp(Math.floor(v.left / TILE) - 1, 0, N), x1: clamp(Math.ceil(v.right / TILE) + 1, 0, N), y0: clamp(Math.floor(v.top / TILE) - 3, 0, N), y1: clamp(Math.ceil(v.bottom / TILE) + 1, 0, N) });

  // --- Sol ---------------------------------------------------------------------------------------
  function drawBase(ctx, p, box) {
    const img = image(p), N = p.tiles;
    if (img) {
      ctx.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, N, N, 0, 0, N * TILE, N * TILE); return;
    }
    // Repli : bandes de même couleur par rangée, dans la vue.
    for (let y = box.y0; y < box.y1; y++) {
      let x = box.x0;
      while (x < box.x1) {
        const c = p.flat[y * N + x]; let e = x + 1; while (e < box.x1 && p.flat[y * N + e] === c) e++;
        ctx.fillStyle = 'rgb(' + (c >>> 16 & 255) + ',' + (c >>> 8 & 255) + ',' + (c & 255) + ')'; ctx.fillRect(x * TILE, y * TILE, (e - x) * TILE + .5, TILE + .5); x = e;
      }
    }
  }
  function drawRamps(ctx, p, box, t) {
    for (const ramp of p.ramps) {
      if (ramp.right < box.x0 || ramp.left > box.x1 || ramp.bottom < box.y0 || ramp.top > box.y1) continue;
      const N = p.tiles, along = ramp.axis === 'x';
      const a0 = (along ? ramp.left : ramp.top) * TILE, a1 = (along ? ramp.right : ramp.bottom) * TILE;
      const lowEnd = ramp.rising ? a0 : a1, highEnd = ramp.rising ? a1 : a0;
      const shade = along ? ctx.createLinearGradient(lowEnd, 0, highEnd, 0) : ctx.createLinearGradient(0, lowEnd, 0, highEnd);
      shade.addColorStop(0, 'rgba(24,26,22,.26)'); shade.addColorStop(1, 'rgba(214,200,160,.16)');
      ctx.fillStyle = shade;
      for (const i of ramp.cells) { const x = i % N, y = (i - x) / N; ctx.fillRect(x * TILE, y * TILE, TILE + .5, TILE + .5); }
      // Marches : traits perpendiculaires à la pente, trois par case.
      ctx.strokeStyle = 'rgba(28,27,23,.34)'; ctx.lineWidth = 2; ctx.beginPath();
      for (const i of ramp.cells) {
        const x = i % N, y = (i - x) / N;
        for (let k = 1; k <= 3; k++) {
          if (along) { const sx = x * TILE + k * TILE / 3 - TILE / 6; ctx.moveTo(sx, y * TILE + 3); ctx.lineTo(sx, (y + 1) * TILE - 3); }
          else { const sy = y * TILE + k * TILE / 3 - TILE / 6; ctx.moveTo(x * TILE + 3, sy); ctx.lineTo((x + 1) * TILE - 3, sy); }
        }
      }
      ctx.stroke();
      // Chevrons vers le haut de la pente, au milieu de la rampe.
      const cx = (ramp.left + ramp.right) / 2 * TILE, cy = (ramp.top + ramp.bottom) / 2 * TILE, dir = ramp.rising ? 1 : -1, s = TILE * .9;
      ctx.strokeStyle = 'rgba(226,212,166,.5)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      for (const k of [-1, 1]) {
        const o = k * s * .7;
        if (along) { ctx.moveTo(cx + o - dir * s * .5, cy - s); ctx.lineTo(cx + o + dir * s * .5, cy); ctx.lineTo(cx + o - dir * s * .5, cy + s); }
        else { ctx.moveTo(cx - s, cy + o - dir * s * .5); ctx.lineTo(cx, cy + o + dir * s * .5); ctx.lineTo(cx + s, cy + o - dir * s * .5); }
      }
      ctx.stroke(); ctx.lineCap = 'butt';
    }
  }
  // Face visible : paroi sous l'arête, extrémités biseautées (adoucissement : la collision reste à la case).
  function drawFace(ctx, f, h, seed) {
    const x0 = f.x0 * TILE, x1 = f.x1 * TILE, y = f.y * TILE, bevel = Math.min(TILE * R.bevel, (x1 - x0) / 3);
    const rock = ctx.createLinearGradient(0, y, 0, y + h); rock.addColorStop(0, css(ROCK_TOP)); rock.addColorStop(1, css(ROCK_FOOT));
    // Ombre portée au pied.
    const foot = ctx.createLinearGradient(0, y + h, 0, y + h + TILE * .8); foot.addColorStop(0, 'rgba(10,12,10,.42)'); foot.addColorStop(1, 'rgba(10,12,10,0)');
    ctx.fillStyle = foot; ctx.fillRect(x0 + bevel, y + h, x1 - x0 - bevel * 2, TILE * .8);
    ctx.fillStyle = rock; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1 - bevel, y + h); ctx.lineTo(x0 + bevel, y + h); ctx.closePath(); ctx.fill();
    // Strates verticales, placées par hachage de la case.
    ctx.strokeStyle = 'rgba(20,20,18,.28)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = f.x0; x < f.x1; x++) for (let k = 0; k < 2; k++) {
      const sx = (x + .15 + grain(x, f.y, seed + k) * .7) * TILE; if (sx < x0 + bevel || sx > x1 - bevel) continue;
      const top = y + h * grain(x, k, f.y) * .3; ctx.moveTo(sx, top); ctx.lineTo(sx + (grain(k, x, f.y) - .5) * 4, y + h * (.7 + grain(x + k, f.y, 3) * .3));
    }
    ctx.stroke();
    // Crête éclairée.
    ctx.strokeStyle = 'rgba(226,214,170,.42)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + 1, y); ctx.lineTo(x1 - 1, y); ctx.stroke(); ctx.lineCap = 'butt';
  }
  function drawSide(ctx, s, h) {
    const x = s.x * TILE, y0 = s.y0 * TILE, y1 = s.y1 * TILE, w = Math.min(TILE * .45, h * .22), dir = s.highWest ? 1 : -1;
    const shade = ctx.createLinearGradient(x, 0, x + dir * w, 0); shade.addColorStop(0, 'rgba(14,15,13,.5)'); shade.addColorStop(1, 'rgba(14,15,13,0)');
    ctx.fillStyle = shade; ctx.fillRect(Math.min(x, x + dir * w), y0, w, y1 - y0);
    ctx.strokeStyle = 'rgba(210,198,156,.3)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y0 + 2); ctx.lineTo(x, y1 - 2); ctx.stroke(); ctx.lineCap = 'butt';
  }
  // Rebord arrière : le plateau masque le contrebas situé derrière lui sur la hauteur projetée.
  function drawBack(ctx, p, b, h) {
    const x0 = b.x0 * TILE, x1 = b.x1 * TILE, y = b.y * TILE, bevel = Math.min(TILE * R.bevel, (x1 - x0) / 3);
    const top = tint(b.level ?? p.max, p.min, p.max), lip = ctx.createLinearGradient(0, y - h, 0, y);
    lip.addColorStop(0, css(mix(top, ROCK_TOP, .35))); lip.addColorStop(.25, css(top)); lip.addColorStop(1, css(top));
    ctx.fillStyle = lip; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + bevel, y - h); ctx.lineTo(x1 - bevel, y - h); ctx.lineTo(x1, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,218,176,.4)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + bevel, y - h); ctx.lineTo(x1 - bevel, y - h); ctx.stroke(); ctx.lineCap = 'butt';
  }
  // Bord de la carte adouci : un fondu remplace le cadre (aucune incidence sur la collision).
  function drawEdges(ctx, size, v) {
    const w = R.edgeFadeMetres * TILE, dark = 'rgba(12,15,13,.55)', clear = 'rgba(12,15,13,0)';
    for (const [x, y, ww, hh, gx0, gy0, gx1, gy1] of [[0, 0, size, w, 0, 0, 0, w], [0, size - w, size, w, 0, size, 0, size - w], [0, 0, w, size, 0, 0, w, 0], [size - w, 0, w, size, size, 0, size - w, 0]]) {
      if (x > v.right || x + ww < v.left || y > v.bottom || y + hh < v.top) continue;
      const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, dark); g.addColorStop(1, clear); ctx.fillStyle = g; ctx.fillRect(x, y, ww, hh);
    }
  }
  function drawGround(ctx, view, game) {
    const t = terrainOf(game); if (!t || !ctx || !view) return false;
    const p = prepare(t), N = p.tiles, box = cellsIn(view, N), H = projected();
    ctx.save();
    drawBase(ctx, p, box);
    drawRamps(ctx, p, box, t);
    for (const s of p.sides) if (s.x >= box.x0 && s.x <= box.x1 && s.y1 >= box.y0 && s.y0 <= box.y1) drawSide(ctx, s, s.drop * H);
    for (const f of p.faces) if (f.x1 >= box.x0 && f.x0 <= box.x1 && f.y + f.drop * H / TILE >= box.y0 && f.y <= box.y1) drawFace(ctx, f, f.drop * H, t.seed);
    drawEdges(ctx, N * TILE, view);
    ctx.restore();
    return true;
  }
  // --- File de profondeur : rebords arrière triés avec les acteurs ---------------------------------
  // Profondeur = l'arête : un acteur du contrebas juste derrière (au nord) est peint avant et masqué ;
  // un acteur sur le plateau (plus au sud) est peint après.
  function backEntries(game, view) {
    const t = terrainOf(game); if (!t) return [];
    const p = prepare(t), H = projected(), N = p.tiles, out = [];
    for (const b of p.backs) {
      const x0 = b.x0 * TILE, x1 = b.x1 * TILE, y = b.y * TILE, h = b.drop * H;
      if (x1 < view.left || x0 > view.right || y < view.top || y - h > view.bottom) continue;
      const level = t.levels[b.y * N + b.x0];
      out.push({ kind: 8, entity: { x: (x0 + x1) / 2, y, id: -217, dead: false }, depth: y, id: -217, draw: ctx => { ctx.save(); drawBack(ctx, p, { ...b, level }, h); ctx.restore(); } });
    }
    return out;
  }
  function depthEntries(game, view, entries) {
    if (!Array.isArray(entries)) return entries;
    for (const e of backEntries(game, view)) { e.order = entries.length; entries.push(e); }
    return entries;
  }
  // Acteur masqué par un rebord : sur un palier plus bas, dans la bande projetée derrière l'arête.
  function hiddenBehind(game, actor) {
    const t = terrainOf(game); if (!t || !Number.isFinite(actor?.x) || !Number.isFinite(actor?.y)) return false;
    const p = prepare(t), H = projected(), gx = Math.floor(actor.x / TILE);
    for (const b of p.backs) if (gx >= b.x0 && gx < b.x1 && actor.y < b.y * TILE && actor.y >= b.y * TILE - b.drop * H) return true;
    return false;
  }
  // --- Minicarte ---------------------------------------------------------------------------------
  function drawMinimap(ctx, game, w, h) {
    const t = terrainOf(game); if (!t || !ctx) return false;
    const p = prepare(t), N = p.tiles, sx = w / N, sy = h / N, img = image(p);
    ctx.save();
    if (img) { ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, N, N, 0, 0, w, h); }
    else drawBase({ set fillStyle(v) { ctx.fillStyle = v; }, fillRect(x, y, ww, hh) { ctx.fillRect(x / TILE * sx, y / TILE * sy, ww / TILE * sx, hh / TILE * sy); } }, p, { x0: 0, x1: N, y0: 0, y1: N });
    ctx.strokeStyle = 'rgba(14,14,12,.85)'; ctx.lineWidth = Math.max(1, sx * 1.2); ctx.beginPath();
    for (const f of [...p.faces, ...p.backs]) { ctx.moveTo(f.x0 * sx, f.y * sy); ctx.lineTo(f.x1 * sx, f.y * sy); }
    for (const s of p.sides) { ctx.moveTo(s.x * sx, s.y0 * sy); ctx.lineTo(s.x * sx, s.y1 * sy); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(226,210,160,.55)';
    for (const r of p.ramps) ctx.fillRect(r.left * sx, r.top * sy, Math.max(1, (r.right - r.left) * sx), Math.max(1, (r.bottom - r.top) * sy));
    ctx.restore();
    return true;
  }
  // Relevé de peinture pour les tests et le harnais : rien d'écrit, tableaux copiés.
  function summary(world) {
    const t = world?.terrain217; if (!t) return null;
    const p = prepare(t), H = projected();
    return { tiles: p.tiles, levels: [p.min, p.max], faces: p.faces.length, backs: p.backs.length, sides: p.sides.length, ramps: p.ramps.map(r => ({ axis: r.axis, rising: r.rising, cells: r.cells.length, box: [r.left, r.top, r.right, r.bottom] })), faceHeight: H, waterCells: t.water.reduce((n, v) => n + (v ? 1 : 0), 0), roadCells: t.roads.reduce((n, v) => n + (v ? 1 : 0), 0) };
  }
  return Object.freeze({ version: 1, prepare, drawGround, depthEntries, backEntries, hiddenBehind, drawMinimap, summary, colourAt: (world, gx, gy) => { const t = world?.terrain217; if (!t) return null; const p = prepare(t), c = p.flat[gy * p.tiles + gx]; return [c >>> 16 & 255, c >>> 8 & 255, c & 255]; } });
});
