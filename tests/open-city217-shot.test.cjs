'use strict';
// Monde sans bord, préalable O9 (b), point 1 (specs/monde-sans-bord/ouverture.md ; décisions D-O1, D-O3 ; revue de la
// PR #39) : dans la vue FPS sur un terrain, le peintre lève l'œil, les boîtes et les acteurs de leur palier ; le tir
// (`raycast`), la visée (`sightQuery`, `aimPoint`) et la visée de la vue classique appliquent les mêmes décalages à la
// géométrie d'intersection, sans changer les hauteurs stockées. Viser un infecté peint sur un autre palier le touche ;
// une cible cachée d'en bas reste ni vue ni touchée (D-O1). Carte plate : aucun appel au relief.
// Toujours hors jeu : la partie de terrain est construite par un harnais (la génération 12 reste refusée).
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');
const { armTerrainCitadel217, aimTerrainFps217 } = require('./helpers/terrain-fps217.cjs');

const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, S = globalThis.DeadwallVertical175State, RV = C.VerticalCitadel175;
const Lw = require('../src/world-local217.js'), F = require('../src/terrain-fps217.js');
const T = C.TILE, N = 192;
g.spawnZombie('walker'); const Zombie = g.zombies.at(-1).constructor; g.zombies.pop();
const descs = new Map(), describe = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const walker = p => { const z = new Zombie(g.nextId++, 'walker', p.x, p.y, g.difficulty, 1, g.local); z.health = z.maxHealth = 1e6; return z; };
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

function advanced() {
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const d = g.serialize(); d.urban.peakScore = 2200; d.urban.progression151 = { version: 1, age: 10 };
  d.resources = { wood: 3000, scrap: 3000, stone: 3000, food: 3000, fuel: 2000, ammo: 3000, medicine: 50 };
  assert.equal(g.restoreSave(d), true);
}
// Partie 17117 de terrain, citadelle sur le palier demandé, sentinelle possédée ; équipe retirée, plein jour.
// `near` : point de départ de la recherche d'emprise (cases) ; la carte 17117 a un plateau 2 au nord, un contrebas 1 au
// centre et un plateau 3 au sud (falaise vers y = 128).
function armed(level, spot) {
  advanced(); const { world: w } = buildTerrainGame217(g, describe, 17117, {}), t = w.terrain217;
  const { building: b } = armTerrainCitadel217(g, spot, { level, radius: 40 });
  g.units.length = 0; g.daylight = () => 1; g.zombies = []; g.buckets.clear();
  const V = g.vertical175, q = V.moduleRef(V.presentation().controlled);
  return { w, t, b, V, q, muzzle: V.muzzle(q), id: q.m.id, level: t.levels[b.gy * N + b.gx] };
}
// Les quartiers et le bilan de la cité ne savent pas encore vivre sur un monde de terrain (moteur de quartiers).
function quiet(fn) { const own = ['cancelPlacement', 'refreshMetrics'].map(k => [k, Object.getOwnPropertyDescriptor(g, k)]); g.cancelPlacement = () => {}; g.refreshMetrics = () => {}; try { return fn(); } finally { for (const [k, o] of own) { if (o) Object.defineProperty(g, k, o); else delete g[k]; } } }
// Point peint d'un infecté (même calcul que le peintre : pose simulée levée de `actorFloor`, visée à 0,9 m).
function painted(w, V, e) { const p = V.enemyPose(e); return { x: e.x / T, y: e.y / T, z: .9 + p.z + F.actorFloor(w, e, p, w.buildings, F.linkFloors(w, V.network.presentation().links)) }; }

test('O9 (b) : d’en haut, viser dans la vue FPS un infecté peint en contrebas le touche (17117, support au palier 3)', () => {
  const { w, t, b, V, q, muzzle, id, level } = armed(3, { x: 96, y: 140 });
  assert.equal(level, 3);
  const see = V.sightQuery(muzzle, q.def.range, id);
  // Infecté du contrebas, à portée, visible d'en haut (D-O1) ; on garde le plus éloigné trouvé jusqu'à 40 m.
  let target = null;
  for (let r = 10; r < 40; r++) for (let k = 0; k < 32; k++) {
    const a = k * Math.PI / 16, x = Math.floor(muzzle.x + Math.cos(a) * r), y = Math.floor(muzzle.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const i = y * N + x; if (t.levels[i] >= level || t.water[i] || t.kinds[i] === 2) continue;
    const z = walker({ x: (x + .5) * T, y: (y + .5) * T }); g.zombies = [z]; if (see(z)) target = z;
  }
  assert.ok(target, 'contrebas visible d’en haut');
  g.zombies = [target];
  const drop = F.siteFloor(w, b) - F.elevation(w, target.x, target.y); assert.ok(drop >= 4, 'au moins un palier plus bas (' + drop + ' m)');
  // Visée FPS : depuis l'œil levé vers le point peint ; la hauteur stockée de l'infecté ne change pas.
  const zBefore = V.enemyPose(target).z, a = aimTerrainFps217(g, painted(w, V, target), painted(w, V, target).z);
  const ray = V.raycast(muzzle, a.yaw, a.pitch, q.def.range, id);
  assert.equal(ray.type, 'zombie', 'le tir touche l’infecté peint (avant : sol du plan z = 0)'); assert.equal(ray.entity, target);
  assert.equal(V.enemyPose(target).z, zBefore, 'hauteur stockée inchangée');
  // Point visé dans le repère d'une origine (gardes de palier de `vertical-population181`) : même écart que dans la vue.
  const eye = F.eye(w, muzzle, b), seenAt = painted(w, V, target);
  assert.ok(near(V.aimPoint(target, muzzle).z - muzzle.z, seenAt.z - eye.z, 1e-9));
  // Point d'impact rendu dans le repère de la bouche : au niveau de l'infecté, sous la bouche d'au moins un palier.
  assert.ok(ray.point.z < muzzle.z - 3, 'impact plus bas que la bouche');
  // Sans relief (module absent), l'ancien comportement : le tir s'arrête sur le plan du sol du support.
  const own = globalThis.DeadwallTerrainFPS217; globalThis.DeadwallTerrainFPS217 = null;
  const Module = require('module'), load = Module._load; Module._load = function (r, ...rest) { if (/terrain-fps217/.test(r)) return null; return load.call(this, r, ...rest); };
  let old; try { old = V.raycast(muzzle, a.yaw, a.pitch, q.def.range, id); } finally { Module._load = load; globalThis.DeadwallTerrainFPS217 = own; }
  assert.notEqual(old.type, 'zombie', 'reproduction de la revue : sans les décalages, le tir passe à côté (' + old.type + ')');
  // Tir réel par la commande du joueur : munition dépensée, dégâts sur l'infecté.
  const m = V.moduleRef(id).m; m.ammo = 40; m.cooldown = 0; const h0 = target.health;
  assert.equal(V.fire(), true); assert.equal(m.ammo, 40 - q.def.ammoPerShot); assert.ok(target.health < h0, 'touché par le tir possédé');
  // Visée automatique : même direction que la visée FPS vers le point peint, puis tir et touche.
  V.release(); m.cooldown = 0; m.ammo = 40; const h1 = target.health;
  for (let k = 0; k < 30; k++) V.step(1 / 30);
  const auto = V.moduleRef(id).m;
  assert.ok(near(Math.atan2(Math.sin(auto.yaw - a.yaw), Math.cos(auto.yaw - a.yaw)), 0, 1e-6) && near(auto.pitch, a.pitch, 1e-6), 'visée automatique = visée FPS vers le point peint');
  assert.ok(auto.ammo < 40 && target.health < h1, 'l’affût automatique tire et touche');
  // Vue classique : la souris posée sur l'infecté (projection 2D de sa pose simulée) vise le même point.
  quiet(() => assert.equal(V.possess(id).ok, true)); V.setView('classic');
  Object.assign(g.input, { mouseWorldX: target.x, mouseWorldY: target.y - .9 * RV.projectedHeight, mouseDown: false, touchFire: false });
  V.step(1 / 30); const classic = V.moduleRef(id).m, cr = V.raycast(muzzle, classic.yaw, classic.pitch, q.def.range, id);
  assert.equal(cr.type, 'zombie', 'vue classique : le tir touche aussi');
  // Sol du contrebas : sans l'infecté, le même tir continue et tombe sur le relief du contrebas, derrière lui (et non
  // sur un plan prolongé du palier 3).
  g.zombies = []; const fr = V.raycast(muzzle, a.yaw, a.pitch, q.def.range, id), fz = F.elevation(w, fr.point.x * T, fr.point.y * T);
  assert.equal(fr.type, 'ground', JSON.stringify(fr.point));
  assert.ok(fr.distance > ray.distance, 'impact derrière l’infecté');
  assert.ok(near(fr.point.z + F.siteFloor(w, b), fz, .05), 'impact sur la surface du relief');
  assert.ok(fz < F.siteFloor(w, b) - 3, 'au contrebas');
  delete g.daylight; V.release();
});

test('O9 (b) : d’en bas, une cible cachée par la falaise n’est ni vue, ni visée, ni touchée (D-O1 conservée)', () => {
  const { w, t, V, q, muzzle, id, level } = armed(1, { x: 96, y: 116 });
  const see = V.sightQuery(muzzle, q.def.range, id), eye = F.eye(w, muzzle, V.moduleRef(id).b);
  let hidden = null;
  for (let r = 6; r < 50 && !hidden; r++) for (let k = 0; k < 32 && !hidden; k++) {
    const a = k * Math.PI / 16, x = Math.floor(muzzle.x + Math.cos(a) * r), y = Math.floor(muzzle.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const i = y * N + x; if (t.levels[i] <= level || t.water[i] || t.kinds[i] === 2) continue;
    const z = walker({ x: (x + .5) * T, y: (y + .5) * T }); g.zombies = [z];
    if (!w.sightClear217({ x: muzzle.x * T, y: muzzle.y * T }, z, level)) hidden = z;
  }
  assert.ok(hidden, 'plateau caché à portée');
  g.zombies = [hidden];
  assert.equal(see(hidden), false, 'non vu');
  assert.equal(F.sightClear(w, eye, hidden, level), false, 'non peint');
  // Visée FPS vers l'endroit où il serait peint : la falaise arrête le tir.
  const a = aimTerrainFps217(g, painted(w, V, hidden), painted(w, V, hidden).z), ray = V.raycast(muzzle, a.yaw, a.pitch, q.def.range, id);
  assert.notEqual(ray.type, 'zombie'); assert.equal(hidden.health, 1e6);
  // Affût automatique : aucune cible, aucune munition.
  V.release(); const m = V.moduleRef(id).m; m.ammo = 40;
  for (let k = 0; k < 60; k++) V.step(1 / 30);
  assert.equal(V.moduleRef(id).m.ammo, 40, 'aucune munition'); assert.equal(hidden.health, 1e6);
  delete g.daylight;
});

test('O9 (b) : même palier sur un terrain — tir, visée et vue concordent comme sur la carte plate', () => {
  const { w, t, b, V, q, muzzle, id, level } = armed(1, { x: 96, y: 80 });
  let target = null;
  const see = V.sightQuery(muzzle, q.def.range, id);
  for (let r = 10; r < 30 && !target; r++) for (let k = 0; k < 32 && !target; k++) {
    const a = k * Math.PI / 16, x = Math.floor(muzzle.x + Math.cos(a) * r), y = Math.floor(muzzle.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const i = y * N + x; if (t.levels[i] !== level || t.water[i] || t.kinds[i] === 2) continue;
    const z = walker({ x: (x + .5) * T, y: (y + .5) * T }); g.zombies = [z]; if (see(z)) target = z;
  }
  assert.ok(target, 'cible sur le même palier');
  g.zombies = [target];
  const flat = S.lookAt(muzzle, V.aimPoint(target)), fps = aimTerrainFps217(g, painted(w, V, target), painted(w, V, target).z);
  assert.ok(near(flat.yaw, fps.yaw, 1e-9) && near(flat.pitch, fps.pitch, 1e-9), 'même palier : décalage nul');
  assert.equal(V.raycast(muzzle, fps.yaw, fps.pitch, q.def.range, id).entity, target);
  assert.ok(F.siteFloor(w, b) > 0);
  delete g.daylight; V.release();
});

test('O9 (b) : carte plate — tir, visée et vue sans aucun appel au relief', () => {
  advanced();
  const poison = new Proxy({}, { get: () => { throw Error('relief lu sur une carte plate'); } });
  const own = globalThis.DeadwallTerrainFPS217; globalThis.DeadwallTerrainFPS217 = poison;
  try {
    const V = g.vertical175; assert.equal(g.world.terrain217 ?? null, null);
    const origin = { x: g.player.x / T, y: g.player.y / T, z: RV.eyeHeight }, z = walker({ x: g.player.x + 12 * T, y: g.player.y });
    g.zombies = [z]; g.buckets.clear();
    const a = S.lookAt(origin, V.aimPoint(z)), r = V.raycast(origin, a.yaw, a.pitch, 40);
    assert.equal(r.type, 'zombie'); assert.equal(r.floor217, undefined, 'aucun champ de plus');
    assert.equal(V.sightQuery(origin, 40)(z), true);
    assert.deepEqual(V.aimPoint(z, origin), V.aimPoint(z), 'origine ignorée sur une carte plate');
    const down = V.raycast(origin, 0, -.3, 40); assert.equal(down.type, 'ground'); assert.ok(near(down.point.z, 0, 1e-9));
    for (let k = 0; k < 30; k++) V.step(1 / 30);
  } finally { globalThis.DeadwallTerrainFPS217 = own; g.zombies = []; }
});

test('O9 (b) : un tir au torse d’un géant sur un autre palier n’est pas compté comme un point faible (revue PR #40)', () => {
  const { w, t, b, V, q, muzzle, id, level } = armed(3, { x: 96, y: 140 });
  const d = RV.siege.kinds.breaker, see = V.sightQuery(muzzle, q.def.range, id);
  // Case du contrebas, à portée, visible d'en haut (même recherche que pour l'infecté).
  let spot = null;
  for (let r = 12; r < 40 && !spot; r++) for (let k = 0; k < 32 && !spot; k++) {
    const a = k * Math.PI / 16, x = Math.floor(muzzle.x + Math.cos(a) * r), y = Math.floor(muzzle.y + Math.sin(a) * r); if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const i = y * N + x; if (t.levels[i] >= level || t.water[i] || t.kinds[i] === 2) continue;
    const z = walker({ x: (x + .5) * T, y: (y + .5) * T }); g.zombies = [z]; if (see(z)) spot = { x: (x + .5) * T, y: (y + .5) * T };
  }
  assert.ok(spot, 'contrebas visible d’en haut'); g.zombies = [];
  const giants = V.presentation().giants; giants.length = 0;
  const giant = { id: 9001, kind: 'breaker', x: spot.x, y: spot.y, health: d.health, maxHealth: d.health }; giants.push(giant);
  assert.ok(F.siteFloor(w, b) - F.elevation(w, giant.x, giant.y) >= 4, 'au moins un palier plus bas');
  // Visée au milieu du torse peint (sol du géant + moitié de sa hauteur), hors des deux bandes de point faible.
  aimTerrainFps217(g, { x: giant.x / T, y: giant.y / T }, F.elevation(w, giant.x, giant.y) + d.height * .5);
  const m = V.moduleRef(id).m; m.ammo = 40; m.cooldown = 0;
  assert.equal(V.fire(), true);
  assert.ok(near(d.health - giant.health, q.def.damage, 1e-9), 'dégâts ordinaires au torse : ' + (d.health - giant.health) + ' au lieu de ' + q.def.damage);
  giants.length = 0; delete g.daylight; V.release();
});
