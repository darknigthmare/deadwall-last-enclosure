'use strict';
// Monde sans bord, tranche O6c (specs/monde-sans-bord/ouverture.md ; décision D-O1) : dettes de falaise soldées avant
// O9 — choix de cible des tireurs 2D (tourelle, fusilier, caisson local, visée tactile), visée et tirs des affûts de
// la citadelle (vue FPS), entrée d'un support de citadelle sur le palier de son emprise, `fieldcraft` sur un monde de
// terrain (eau profonde, gisements replacés, dégagement d'un acteur), repli d'un infecté hors d'atteinte contre un
// décor. Toujours hors jeu : la partie de terrain est construite par un harnais (la génération 12 reste refusée) ;
// sur une carte plate, aucun de ces chemins ne lit le terrain.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');
const { armTerrainCitadel217 } = require('./helpers/terrain-fps217.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, S = globalThis.DeadwallVertical175State, Lw = require('../src/world-local217.js');
const T = C.TILE, N = 192, FAR = 0x3fffffff, Game = g.constructor, World = g.world.constructor;
const Building = g.core().constructor, Unit = g.units[0].constructor;
const Zombie = (() => { g.fronts = ['north']; g.spawnZombie('walker'); return g.zombies.pop().constructor; })();
const descs = new Map(), describe = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const at = (i, k = .5) => ({ x: (i % N + k) * T, y: (Math.floor(i / N) + k) * T });
const deep = (d, i) => d.water[i] === 1 || d.water[i] === 2 || (d.water[i] === 3 && !d.roads[i]);
const walker = p => new Zombie(g.nextId++, 'walker', p.x, p.y, g.difficulty, 1, g.local);
const reset = () => { g.startNew('standard', '17117'); g.campaignIntro132?.skip?.(); };
// Arêtes de falaise (changement de palier sans rampe) : `i` bas, `j` haut, `dx`/`dy` du bas vers le haut.
function cliffs(d) {
  const out = [];
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) for (const [dx, dy, bit] of [[1, 0, 1], [0, 1, 2]]) {
    const i = y * N + x, j = (y + dy) * N + x + dx;
    if (d.levels[i] === d.levels[j] || deep(d, i) || deep(d, j) || d.passes[i] & bit) continue;
    out.push(d.levels[i] < d.levels[j] ? { i, j, dx, dy } : { i: j, j: i, dx: -dx, dy: -dy });
  }
  return out;
}
// Arête sèche sur `k` cases de chaque côté, loin du bord de la carte.
function dryCliff(d, k, kHigh = k) {
  return cliffs(d).find(c => {
    const s = c.dx + c.dy * N, x = c.i % N, y = Math.floor(c.i / N); if (x < 20 || y < 20 || x > N - 20 || y > N - 20) return false;
    for (let n = 0; n < k; n++) { const a = c.i - n * s; if (d.levels[a] !== d.levels[c.i] || d.water[a] || d.kinds[a] === 2) return false; }
    for (let n = 0; n < kHigh; n++) { const b = c.j + n * s; if (d.levels[b] !== d.levels[c.j] || d.water[b] || d.kinds[b] === 2) return false; }
    return true;
  });
}
// Partie de terrain (quartiers posés sur le terrain depuis le préalable O9 (a)) ; `fieldcraft` relu si demandé.
function terrain(seed, options = {}) {
  g.startNew('standard', String(seed)); g.campaignIntro132?.skip?.();
  const built = buildTerrainGame217(g, describe, seed, {});
  if (options.setup) g.fieldcraft.setup();
  g.zombies.length = 0; g.projectiles.length = 0; g.buckets.clear();
  return { ...built, w: built.world, d: built.description };
}

test('O6c : carte plate — choix de cible inchangé, points d’appel gardés', () => {
  reset();
  // `fireTarget217` délègue au choix existant (veille nocturne, arcs de tir, plus proche) sans filtre sur une carte plate.
  g.phaseTime = 1; for (let k = 0; k < 600; k++) g.update(1 / 30);
  assert.ok(g.zombies.length > 0, 'infectés présents');
  const c = g.core();
  for (const range of [200, 600, 2000]) {
    const own = g.nightwatch ? g.nightwatch.target(c.x, c.y, range) : g.nearestZombie(c.x, c.y, range);
    assert.equal(g.fireTarget217(c.x, c.y, range, c.x, c.y - 3), own);
  }
  assert.equal(g.world.terrain217, null);
  // Sources : tourelle, fusilier, visée tactile et caisson local passent par le même choix ; affûts gardés par le terrain.
  const game = read('src/game.js');
  for (const call of ['this.fireTarget217(b.x,b.y,b.def.range,b.x,b.y-3)', 'this.fireTarget217(u.x,u.y,rules.range)', 'this.fireTarget217(p.x,p.y,720)'])
    assert.ok(game.includes(call), call);
  assert.equal((game.match(/this\.nightwatch\?this\.nightwatch\.target\(/g) || []).length, 1, 'seul `fireTarget217` garde l’ancien choix');
  assert.match(read('src/fortification-pack.js'), /g\.fireTarget217\?g\.fireTarget217\(b\.x,b\.y,b\.def\.range,b\.x,b\.y-3\)/);
  const v = read('src/vertical-citadel175.js');
  assert.match(v, /const terrain=g\.world\?\.terrain217\?g\.world:null/);
  assert.match(v, /if\(g\.world\?\.terrain217&&\(dir\.x\|\|dir\.y\)\)/);
  reset();
});

test('O6c : tourelle et fusilier — aucune cible cachée par une falaise, aucune munition dépensée', () => {
  for (const seed of [17117, 42]) {
    const { w, d } = terrain(seed), e = dryCliff(d, 12, 5); assert.ok(e, seed + ' : falaise sèche');
    const s = e.dx + e.dy * N, low = at(e.i - 3 * s), high = at(e.j + 2 * s), far = at(e.i - 10 * s);
    assert.ok(w.terrainAt217(low.x, low.y).level < w.terrainAt217(high.x, high.y).level);
    assert.equal(w.terrainAt217(far.x, far.y).level, w.terrainAt217(low.x, low.y).level);
    const zHigh = walker(high), zFar = walker(far); g.zombies = [zHigh, zFar]; g.rebuildBuckets();
    assert.ok(Math.hypot(zHigh.x - low.x, zHigh.y - low.y) < Math.hypot(zFar.x - low.x, zFar.y - low.y), 'le caché est le plus proche');
    assert.equal(g.nearestZombie(low.x, low.y, 600), zHigh, 'le choix brut retiendrait le caché');
    assert.equal(g.fireTarget217(low.x, low.y, 600), zFar, seed + ' : d’en bas, la cible est le visible');
    // D'en haut, le contrebas reste visible (D-O1) : le plus proche est retenu.
    const top = at(e.j + 3 * s); assert.equal(g.fireTarget217(top.x, top.y, 600), g.nearestZombie(top.x, top.y, 600));
    // Après le choix, aucun filtre ne reste posé.
    assert.equal(g.nearbyZombies(low.x, low.y, 600).length, 2);
    // Fusilier au pied de la falaise, seul infecté à portée caché : il ne tire pas.
    g.ensureSquads(); const soldier = new Unit(g.nextId++, 'soldier', low.x, low.y); soldier.squad = globalThis.DeadwallSquads.nextGroup([]);
    g.units = [soldier]; g.zombies = [zHigh]; g.rebuildBuckets(); g.resources.ammo = 100; g.projectiles = [];
    for (let k = 0; k < 30; k++) { soldier.x = low.x; soldier.y = low.y; g.updateUnits(1 / 30); }
    assert.equal(g.resources.ammo, 100, seed + ' : fusilier, aucune munition'); assert.equal(g.projectiles.length, 0);
    // Le même fusilier sur le plateau tire en contrebas.
    const zLow = walker(at(e.i - 2 * s)); g.zombies = [zLow]; g.rebuildBuckets();
    for (let k = 0; k < 30; k++) { soldier.x = top.x; soldier.y = top.y; g.updateUnits(1 / 30); }
    assert.ok(g.resources.ammo < 100, seed + ' : d’en haut, le fusilier tire');
    // Tourelle alimentée au pied de la falaise : rien à portée sinon le caché, aucune munition.
    const gx = (e.i - 4 * s) % N - 1, gy = Math.floor((e.i - 4 * s) / N) - 1, def = w.definition('turret');
    const tur = new Building(g.nextId++, 'turret', gx, gy, 0, 1, w.cityGeometry202); tur.health = tur.maxHealth; tur.powered = true; w.add(tur);
    assert.equal(w.terrainAt217(tur.x, tur.y - 3).level, d.levels[e.i]); assert.ok(Math.hypot(zHigh.x - tur.x, zHigh.y - tur.y) < def.range);
    g.units = []; g.zombies = [zHigh]; g.rebuildBuckets(); g.resources.ammo = 100; g.projectiles = []; tur.fireCooldown = 0;
    Game.prototype.updateBuildings.call(g, 1 / 30);
    assert.equal(g.resources.ammo, 100, seed + ' : tourelle, aucune munition'); assert.equal(tur.fireCooldown, 0);
    g.zombies = [zHigh, zFar]; g.rebuildBuckets(); Game.prototype.updateBuildings.call(g, 1 / 30);
    assert.ok(g.resources.ammo < 100, 'la tourelle tire sur le visible'); assert.ok(Math.abs(tur.turretAngle - Math.atan2(zFar.y - tur.y, zFar.x - tur.x)) < 1e-9);
  }
  reset();
});

test('O6c : affûts de la citadelle — visée automatique et tir arrêtés par la falaise d’en bas, pas d’en haut', () => {
  const advanced = () => {
    g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
    const data = g.serialize(); data.urban.peakScore = 2200; data.urban.progression151 = { version: 1, age: 10 };
    data.resources = { wood: 3000, scrap: 3000, stone: 3000, food: 3000, fuel: 2000, ammo: 3000, medicine: 50 }; assert.equal(g.restoreSave(data), true);
  };
  advanced(); const { world: w } = buildTerrainGame217(g, describe, 17117, {}), V = g.vertical175, t = w.terrain217;
  const { building: b } = armTerrainCitadel217(g, { x: 96, y: 96 }), level = t.levels[b.gy * N + b.gx];
  const q = V.moduleRef(V.presentation().controlled), muzzle = V.muzzle(q), id = q.m.id;
  g.units.length = 0; g.daylight = () => 1;
  const flat = fn => { Object.defineProperty(w, 'terrain217', { value: null, configurable: true }); try { return fn(); } finally { delete w.terrain217; } };
  const flatAim = flat(() => V.sightQuery(muzzle, q.def.range, id)), aim = V.sightQuery(muzzle, q.def.range, id);
  // Plateau au-dessus du support, à portée et sans boîte devant : caché par la falaise seule.
  const probe = walker({ x: 0, y: 0 });
  let up = null;
  for (let r = 4; r < 80 && !up; r++) for (let k = 0; k < 32 && !up; k++) {
    const a = k * Math.PI / 16, x = Math.floor(muzzle.x + Math.cos(a) * r), y = Math.floor(muzzle.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const i = y * N + x; Object.assign(probe, { x: (x + .5) * T, y: (y + .5) * T });
    if (t.levels[i] > level && !t.water[i] && flatAim(probe) && !aim(probe)) up = { x: probe.x, y: probe.y };
  }
  assert.ok(up, 'plateau caché à portée');
  const zHigh = walker(up); zHigh.health = zHigh.maxHealth = 1e6;
  assert.equal(w.sightClear217({ x: muzzle.x * T, y: muzzle.y * T }, zHigh), false);
  // Tir dirigé vers lui : arrêté par la falaise avant l'infecté ; terrain masqué, il touche.
  g.zombies = [zHigh]; const look = S.lookAt(muzzle, V.aimPoint(zHigh));
  const ray = V.raycast(muzzle, look.yaw, look.pitch, q.def.range, id), flatRay = flat(() => V.raycast(muzzle, look.yaw, look.pitch, q.def.range, id));
  assert.equal(flatRay.type, 'zombie', 'sans terrain, le tir touche');
  assert.equal(ray.type, 'terrain217', 'le tir s’arrête sur la falaise'); assert.ok(ray.distance < flatRay.distance);
  assert.equal(t.levels[Math.floor(ray.point.y) * N + Math.floor(ray.point.x)], level, 'point d’impact au pied, sur le palier de la bouche');
  // Affût automatique (contrôle rendu) : aucune cible, aucune munition.
  V.release(); const m = () => V.snapshot().sites.find(s => s.id === b.id).decks[0].modules.find(x => x.id === id);
  V.moduleRef(id).m.ammo = 40; const ammo = m().ammo; assert.equal(ammo, 40);
  for (let k = 0; k < 60; k++) V.step(1 / 30);
  assert.equal(m().ammo, ammo, 'affût automatique : aucune munition sur le plateau caché'); assert.equal(zHigh.health, 1e6);
  // Depuis le plateau, un affût vise et touche en contrebas.
  advanced(); const { world: w2 } = buildTerrainGame217(g, describe, 17117, {}), t2 = w2.terrain217;
  const { building: hb } = armTerrainCitadel217(g, { x: up.x / T, y: up.y / T }, { level: t2.levels[Math.floor(up.y / T) * N + Math.floor(up.x / T)], radius: 50 });
  const hq = V.moduleRef(V.presentation().controlled), hm = V.muzzle(hq), hl = t2.levels[hb.gy * N + hb.gx], see = V.sightQuery(hm, hq.def.range, hq.m.id);
  g.units.length = 0; g.daylight = () => 1;
  let below = null;
  for (let r = 6; r < 60 && !below; r++) for (let k = 0; k < 32 && !below; k++) {
    const a = k * Math.PI / 16, x = Math.floor(hm.x + Math.cos(a) * r), y = Math.floor(hm.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const i = y * N + x; if (t2.levels[i] >= hl || t2.water[i]) continue; const z = walker({ x: (x + .5) * T, y: (y + .5) * T }); if (see(z)) below = z;
  }
  assert.ok(below, 'contrebas visible d’en haut');
  below.health = below.maxHealth = 1e6; g.zombies = [below]; V.release(); V.moduleRef(hq.m.id).m.ammo = 40;
  const hm0 = V.snapshot().sites.find(s => s.id === hb.id).decks[0].modules.find(x => x.id === hq.m.id).ammo;
  for (let k = 0; k < 60; k++) V.step(1 / 30);
  assert.ok(V.snapshot().sites.find(s => s.id === hb.id).decks[0].modules.find(x => x.id === hq.m.id).ammo < hm0, 'l’affût du plateau tire');
  assert.ok(below.health < 1e6, 'et touche en contrebas');
  g.zombies.length = 0; delete g.daylight; reset();
});

test('O6c : support de citadelle refusé dès la pose quand son entrée tombe sur l’autre palier', () => {
  for (const seed of [17117, 0]) {
    const { w } = terrain(seed), t = w.terrain217, def = w.definition('verticalFoundation6');
    let refused = 0, admitted = 0, sample = null;
    for (let y = 4; y < N - 12; y += 2) for (let x = 4; x < N - 12; x += 2) for (const rotation of [0, 1, 2, 3]) {
      const q = w.placement(def, x, y, rotation), probe = { type: 'verticalFoundation6', gx: x, gy: y, rotation }, door = S.entrance(probe), [bw, bh] = rotation % 2 ? [def.size[1], def.size[0]] : def.size;
      const clear = w.local.contains(door.x, door.y) && w.stepClear217((x + bw / 2) * T, (y + bh / 2) * T, door.x, door.y);
      if (q.valid) { admitted++; assert.ok(clear, 'emprise admise : escalier praticable'); continue; }
      if (!/Entrée de la citadelle/.test(q.reason)) continue;
      refused++; assert.equal(clear, false); sample ??= { x, y, rotation, reason: q.reason };
      // Le reste du terrain admettait l'emprise : un seul palier, à sec, hors rampe.
      const level = t.levels[y * N + x];
      for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) { const i = (y + yy) * N + x + xx; assert.equal(t.levels[i], level); assert.equal(t.water[i], 0); }
    }
    assert.ok(refused > 0 && admitted > 0, seed + ' : ' + refused + ' refus, ' + admitted + ' admises');
    assert.match(sample.reason, /falaise ou l’eau couperait l’escalier/);
    // Un bâtiment ordinaire posé au même endroit n'est pas concerné.
    assert.doesNotMatch(String(w.placement(w.definition('warehouse'), sample.x, sample.y, 0).reason || ''), /Entrée de la citadelle/);
  }
  reset();
});

test('O6c : `fieldcraft` sur un monde de terrain — eau profonde, gisements replacés, acteur dégagé', () => {
  const { w, d } = terrain(46);
  let pool = -1; for (let i = 20 * N; i < (N - 20) * N && pool < 0; i++) if (i % N > 20 && i % N < N - 20 && [0, 1, -1, N, -N].every(k => deep(d, i + k))) pool = i;
  assert.ok(pool >= 0, 'eau profonde sur 46');
  const p = at(pool), before = w.nodes.map(n => [n.x, n.y]);
  // Unités posées dans un gisement au pied d'une falaise : le dégagement ne franchit ni falaise ni eau.
  const e = dryCliff(d, 2), probes = [];
  for (const n of w.nodes) { const c = w.terrainAt217(n.x, n.y); if (c && !c.deep) probes.push({ x: n.x, y: n.y }); if (probes.length >= 24) break; }
  g.units = probes.map(q => Object.assign(new Unit(g.nextId++, 'worker', q.x, q.y), { navigation: null }));
  g.fieldcraft.setup();
  // Eau profonde : obstacle ami du monde (enveloppe du terrain conservée) et position refusée.
  assert.ok(w.solidForFriendly(p.x, p.y), 'eau profonde solide après `setup`');
  assert.equal(g.friendlyPositionClear(g.player, p.x, p.y), false, 'eau profonde refusée');
  assert.equal(w._fieldcraft, true);
  // Gisements replacés : un seul palier, à sec, hors rampe, reliés à leur place sans falaise.
  let moved = 0;
  w.nodes.forEach((n, k) => {
    if (n.x === before[k][0] && n.y === before[k][1]) return; moved++;
    const r = g.fieldcraft.reserveRect(n);
    assert.ok(w.footprintClear217(r.l, r.t, r.r - r.l, r.b - r.t), 'gisement ' + n.id + ' sur un seul palier, à sec');
    assert.ok(w.stepClear217(before[k][0], before[k][1], n.x, n.y), 'gisement ' + n.id + ' sans franchir de falaise');
  });
  assert.ok(moved > 0, 'des gisements replacés');
  // Les unités dégagées restent reliées sans falaise à leur point de départ (index des décors relu après le replacement).
  let freed = 0;
  g.units.forEach((u, k) => { const q = probes[k]; if (u.x !== q.x || u.y !== q.y) freed++; assert.ok(w.stepClear217(q.x, q.y, u.x, u.y), 'unité ' + k); assert.ok(g.friendlyPositionClear(u, u.x, u.y)); });
  assert.ok(freed > 0, 'des unités dégagées');
  assert.ok(e, 'falaise sèche');
  reset();
});

test('O6c : repli d’un infecté hors d’atteinte contre un décor — ni défait, ni répété', () => {
  const { w, d } = terrain(17117, { setup: true }), f = g.flow;
  let pocket = -1; for (let i = 0; i < N * N; i++) if (d.cost[i] < 0 && !d.water[i] && i % N > 20 && i % N < N - 20) { pocket = i; break; }
  assert.ok(pocket >= 0 && f.values[pocket] === FAR);
  const p = at(pocket), spot = f.fallback217(p.x, p.y, C.OpenCity217Rules.fallbackRing, (x, y) => !w.atCell(x, y)); assert.ok(spot);
  // Un gisement posé exactement sur la case de repli (index des décors relu par la version de navigation).
  const node = w.nodes.find(n => !n.depleted && n.type === 'scrap'); node.x = spot.x; node.y = spot.y; w.navigationVersion++;
  const z = walker(p); g.zombies = [z]; g.rebuildBuckets();
  const hits = () => [...g.fieldcraft.props(z.x, z.y, z.radius)].some(n => C.Fieldcraft && globalThis.DeadwallFieldcraft.collides(n, z.x, z.y, z.radius * .7));
  g.updateZombies(1 / 30);
  assert.equal(z.fallback217, 1);
  let cell = [Math.floor(z.x / T), Math.floor(z.y / T)];
  assert.ok(f.values[cell[1] * N + cell[0]] < FAR, 'case atteinte après le premier pas (repli non défait)');
  assert.equal(hits(), false, 'dégagé du décor');
  for (let k = 0; k < 60; k++) { g.rebuildBuckets(); g.updateZombies(1 / 30); const n = [Math.floor(z.x / T), Math.floor(z.y / T)]; assert.ok(w.canStep(cell[0], cell[1], n[0], n[1])); cell = n; }
  assert.equal(z.fallback217, 1, 'un seul repli');
  reset();
});
