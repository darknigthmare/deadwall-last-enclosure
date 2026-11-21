'use strict';
// Monde sans bord T5, volet B : accesseurs de taille de la carte locale, sans effet en jeu.
// La carte reste de 128 cases (4 096 unités) ; les accesseurs rendent exactement les valeurs
// historiques et les lecteurs convertis donnent le même état, octet pour octet.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../src/core.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('carte locale par défaut : mêmes valeurs que les constantes historiques', () => {
  const L = C.LOCAL_MAP217;
  assert.ok(Object.isFrozen(L));
  assert.equal(L.tiles, C.WORLD_TILES);
  assert.equal(L.tiles, 128);
  assert.equal(L.size, C.WORLD_SIZE);
  assert.equal(L.size, 4096);
  assert.equal(L.tile, C.TILE);
  assert.equal(L.cells, C.WORLD_TILES * C.WORLD_TILES);
  assert.deepEqual(L.extent(), { x: 0, y: 0, w: 4096, h: 4096 });
  assert.deepEqual(L.centre(), { x: C.WORLD_SIZE / 2, y: C.WORLD_SIZE / 2 });
  assert.notEqual(L.centre(), L.centre(), 'centre() rend un objet neuf que l’appelant peut modifier');
  assert.equal(L.centreCell(), C.WORLD_TILES / 2);
  assert.throws(() => C.localMap217(0), RangeError);
  assert.throws(() => C.localMap217(12.5), RangeError);
  // La fabrique est paramétrée pour la tranche d'ouverture, mais le jeu n'en lit qu'une.
  assert.equal(C.localMap217(192).size, 192 * C.TILE);
  assert.equal(C.localMap217().size, C.WORLD_SIZE);
});

test('prédicats et bornes identiques aux calculs historiques (10 000 points, bords, NaN, infinis)', () => {
  const L = C.LOCAL_MAP217, S = C.WORLD_SIZE, T = C.WORLD_TILES;
  let seed = 217;
  const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296;
  const values = [NaN, Infinity, -Infinity, 0, -0, S, -1e-9, S + 1e-9, 3, 26, S - 26, S - 3, 2048, -64, S + 64, 0.5, S - 0.5];
  for (let i = 0; i < 10000; i++) values.push((next() * 1.2 - 0.1) * S);
  const pads = [0, 3, 26, 26.5, 13 + 4, 80, 4.000000001];
  let checked = 0;
  for (let i = 0; i < values.length; i++) {
    const x = values[i], y = values[(i * 7 + 3) % values.length];
    for (const pad of pads) {
      assert.equal(L.contains(x, y, pad), x >= pad && y >= pad && x <= S - pad && y <= S - pad);
      assert.equal(L.outside(x, y, pad), x < pad || y < pad || x > S - pad || y > S - pad);
      assert.equal(L.outsideOpen(x, y, pad), x <= pad || y <= pad || x >= S - pad || y >= S - pad);
      assert.ok(Object.is(L.clampAxis(x, pad), C.clamp(x, pad, S - pad)));
      const c = L.clampInside(x, y, pad);
      assert.ok(Object.is(c.x, C.clamp(x, pad, S - pad)) && Object.is(c.y, C.clamp(y, pad, S - pad)));
      assert.equal(L.axisMax(pad), S - pad);
      checked++;
    }
    assert.equal(L.contains(x, y), x >= 0 && y >= 0 && x <= S && y <= S);
    assert.equal(L.outside(x, y), x < 0 || y < 0 || x > S || y > S);
    assert.equal(L.outsideOpen(x, y), x <= 0 || y <= 0 || x >= S || y >= S);
    assert.ok(Object.is(L.cellOf(x), C.grid(x)));
  }
  for (let gy = -2; gy <= T + 1; gy++) for (let gx = -2; gx <= T + 1; gx++) {
    assert.equal(L.cellInside(gx, gy), !(gx < 0 || gy < 0 || gx >= T || gy >= T));
    assert.equal(L.index(gx, gy), C.index(gx, gy));
  }
  assert.equal(L.cellInside(NaN, 3), false);
  assert.ok(checked >= 70000);
});

test('propriétaire en jeu : WorldMap#local et Game#local, repli pour un faux monde', () => {
  const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
  const { g } = bootDocument134();
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const world = g.world, proto = Object.getPrototypeOf(world);
  assert.equal(world.local, globalThis.DeadwallCore.LOCAL_MAP217);
  const L = world.local;
  assert.equal(L.size, 4096); assert.equal(L.tiles, 128);
  assert.equal(typeof Object.getOwnPropertyDescriptor(proto, 'local')?.get, 'function', 'accesseur porté par le prototype');
  assert.equal(Object.hasOwn(world, 'local'), false, 'aucune propriété propre ajoutée au monde');
  assert.equal(Object.keys(world).includes('local'), false);
  assert.equal(world.occupancy.length, C.WORLD_TILES * C.WORLD_TILES);
  assert.equal(g.flow.values.length, C.WORLD_TILES * C.WORLD_TILES);
  assert.equal(g.local, L);
  const getter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g), 'local').get;
  assert.equal(getter.call({ world: {} }), globalThis.DeadwallCore.LOCAL_MAP217, 'faux monde sans accesseur : carte par défaut');
  assert.equal(getter.call({}), globalThis.DeadwallCore.LOCAL_MAP217, 'monde absent : carte par défaut');
  assert.equal(Object.keys(g).includes('local'), false);
  // Bornes lues sur la carte : mêmes verdicts que l'ancienne carte fixe.
  assert.equal(world.atCell(-1, 0), null);
  assert.equal(world.atCell(128, 5), null);
  assert.equal(world.placement(world.definition('woodWall'), 126, 40).reason, 'Hors de la zone');
  assert.equal(world.placement(world.definition('woodWall'), 0, 40).reason, 'Hors de la zone');
});

function boot(variant) {
  // Horloge et hasard figés : deux parcours ne diffèrent que par la variante d'accesseur.
  let s = 0x2170217 >>> 0, clock = 1700000000000;
  const random = Math.random, now = Date.now;
  Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  Date.now = () => clock;
  const perf = globalThis.performance, perfNow = perf.now;
  perf.now = () => clock - 1700000000000;
  let uuid = 0; const uuidBefore = globalThis.crypto.randomUUID;
  globalThis.crypto.randomUUID = () => '00000000-0000-4000-8000-' + String(++uuid).padStart(12, '0');
  try {
    delete require.cache[require.resolve('../scripts/qa-startup134.cjs')];
    const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
    const { g } = bootDocument134();
    const D = globalThis.DeadwallCore, proto = Object.getPrototypeOf(g.world);
    // « copie » : la carte vient d'un autre objet de mêmes dimensions (le propriétaire est bien lu) ;
    // « repli » : la partie ignore le monde, comme devant un faux monde sans accesseur.
    const copy = D.localMap217(D.WORLD_TILES);
    if (variant === 'copie') Object.defineProperty(proto, 'local', { configurable: true, get() { return copy; } });
    if (variant === 'repli') Object.defineProperty(Object.getPrototypeOf(g), 'local', { configurable: true, get() { return D.LOCAL_MAP217; } });
    g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
    const start = JSON.stringify(g.serialize());
    g.phaseTime = 2;
    const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
    for (let i = 0; i < 30 * 70; i++) {
      clock += 33;
      if (i % 150 === 0) { g.input.keys.clear(); g.input.keys.add(keys[(i / 150) % 4]); }
      g.update(1 / 30);
      if (i % 6 === 0) g.render();
    }
    const state = JSON.stringify(g.serialize());
    const wave = { phase: g.phase, zombies: g.zombies.length };
    assert.equal(g.restoreSave(JSON.parse(state)), true);
    const reloaded = JSON.stringify(g.serialize());
    return { start, state, wave, reloaded };
  } finally {
    Math.random = random; Date.now = now; perf.now = perfNow; globalThis.crypto.randomUUID = uuidBefore;
  }
}

test('parcours déterministe avec vague : état sérialisé identique quelle que soit la source de l’accesseur', () => {
  const reference = boot('monde');
  assert.equal(reference.wave.phase, 'assault');
  assert.ok(reference.wave.zombies > 0, 'la vague est sur la carte');
  for (const variant of ['copie', 'repli']) {
    const other = boot(variant);
    assert.equal(other.start, reference.start, variant + ' : départ');
    assert.equal(other.state, reference.state, variant + ' : état après 70 s et une vague');
    assert.equal(other.reloaded, reference.reloaded, variant + ' : reprise');
  }
  assert.equal(reference.reloaded.length > 0, true);
});

test('lecteurs convertis : plus de lecture en dur de la taille de la carte locale', () => {
  const none = ['src/save.js', 'src/squads.js', 'src/tactics.js', 'src/linecare.js', 'src/linecare-ui.js', 'src/narrative.js',
    'src/departure130.js', 'src/frontier.js', 'src/expeditions.js', 'src/expeditions-ui.js', 'src/fieldcraft.js', 'src/recon.js',
    'src/abominations217.js', 'src/content-ui.js', 'src/command-presentation129.js', 'src/return-routes.js', 'src/earthworks217.js',
    'src/world-content.js'];
  for (const file of none) assert.doesNotMatch(read(file), /WORLD_(SIZE|TILES)/, file);
  // Repli local quand le cœur passé en argument est simulé par un test.
  for (const file of ['src/fallback-order.js', 'src/districts.js']) assert.match(read(file), /C\.LOCAL_MAP217\?\.tiles\?\?C\.WORLD_TILES/, file);
  const game = read('src/game.js');
  const left = game.split('\n').map((line, i) => [i + 1, line]).filter(([, line]) => /WORLD_(SIZE|TILES)/.test(line));
  // Restent : la déstructuration du cœur, l'orientation d'un infecté à sa création (sans carte),
  // et la voirie, qui a sa propre grille (`C.InfrastructureRules`).
  assert.ok(left.length <= 3, left.map(([n, l]) => n + ': ' + l.slice(0, 80)).join('\n'));
});

// --- Tranche O5 : taille de la carte de la cité portée par la campagne, 128 partout ---

test('O5 : règles, accesseur de campagne et repli', () => {
  const R = C.LocalMap217Rules;
  assert.ok(Object.isFrozen(R) && Object.isFrozen(R.generationTiles));
  assert.equal(R.defaultTiles, C.WORLD_TILES);
  assert.deepEqual({ ...R.generationTiles }, { 12: 192 }, 'seule la génération 12, encore refusée, nomme une autre taille');
  assert.equal(C.localMapOf217(undefined), C.LOCAL_MAP217);
  assert.equal(C.localMapOf217({}), C.LOCAL_MAP217, 'localTiles absent = carte par défaut');
  assert.equal(C.localMapOf217({ localTiles: 128 }), C.LOCAL_MAP217);
  const big = C.localMapOf217({ localTiles: 192 });
  assert.equal(big, C.localMapOf217({ localTiles: 192 }), 'une instance par taille');
  assert.equal(big.size, 6144); assert.equal(big.cells, 36864);
  const own = C.localMap217(192);
  assert.equal(C.localMapOf217(own), own, 'une carte passée telle quelle');
  assert.throws(() => C.localMapOf217({ localTiles: 'abc' }), RangeError);
  assert.equal(C.campaignLocal217({ worldSeed: 1 }), C.LOCAL_MAP217);
  assert.equal(C.campaignLocal217({ localTiles: 192 }), big);
  // Aides du cœur : carte en argument, carte par défaut en repli, valeurs historiques sans argument.
  for (const v of [-5, 0, 31.9, 2048, 4095, 4096, 5000, 6143, 9000]) {
    assert.equal(C.grid(v), C.clamp(Math.floor(v / 32), 0, 127));
    assert.equal(C.grid(v, big), C.clamp(Math.floor(v / 32), 0, 191));
  }
  assert.equal(C.index(5, 7), 7 * 128 + 5); assert.equal(C.index(5, 7, big), 7 * 192 + 5);
  const far = C.wallLine({ x: 0, y: 0 }, { x: 191, y: 3 }, big), near = C.wallLine({ x: 0, y: 0 }, { x: 191, y: 3 });
  assert.equal(far[far.length - 1].x, 191, 'tracé complet sur une carte de 192 cases');
  assert.ok(near.length <= far.length);
  // Sans partie chargée (la voirie d'une partie remplace `findFriendlyPath` et la borne à sa carte).
  const live = globalThis.DEADWALL; delete globalThis.DEADWALL;
  try {
    const path = C.findFriendlyPath({ x: 2, y: 2 }, { x: 189, y: 189 }, () => false, 192, 192, 1e6);
    assert.equal(path.length, 374, 'chemin ami sur 192 cases');
    assert.equal(C.findFriendlyPath({ x: 2, y: 2 }, { x: 189, y: 189 }, () => false), null, 'carte par défaut : hors grille');
  } finally { if (live !== undefined) globalThis.DEADWALL = live; }
});

test('O5 : lecteurs restés en clair convertis (cœur, cité, voirie, validateurs, vue FPS, présentation)', () => {
  // Chaque lecteur lit la carte de la campagne ; le repli historique reste derrière `??` ou `||`.
  const files = {
    'src/succession133.js': /C\.campaignLocal217\?\.\(full\)\?\.size\?\?C\.WORLD_SIZE/,
    'src/arsenal134.js': /C\.campaignLocal217\?\.\(full\)\?\.size\?\?C\.WORLD_SIZE/,
    'src/fortification-pack.js': /C\.campaignLocal217\?\.\(full\)\?\.size\?\?C\.WORLD_SIZE/,
    'src/exploration-pack.js': /C\.campaignLocal217\?\.\(full\)\?\.size\?\?\(C\.WORLD_SIZE\|\|4096\)/,
    'src/vertical-citadel175-state.js': /C\.campaignLocal217\?\.\(full\)\?\?\{size:C\.WORLD_SIZE,tiles:C\.WORLD_TILES\}/,
    'src/vertical-network179.js': /C\.campaignLocal217\?\.\(full\)\?\.size\?\?C\.WORLD_SIZE/,
    'src/vertical-population181.js': /C\.campaignLocal217\?\.\(full\)\?\.size \?\? C\.WORLD_SIZE/,
    'src/essential-state.js': /campaignLocal217\?\.\(data\)\?\.size\?\?4096/,
    'src/night-gear.js': /campaignLocal217\?\.\(data\)\?\.size\?\?4096/,
    'src/survival-pack.js': /campaignLocal217\?\.\(full\)\?\.size\?\?4096/,
    'src/frontier-state.js': /campaignLocal217\?\.\(data\)\?\.size\?\?4096/,
    'src/vertical-citadel175.js': /W=\(g\.local\|\|C\.LOCAL_MAP217\)\.size/,
    'src/vertical-citadel175-render.js': /w:\(g\.local\|\|C\.LOCAL_MAP217\)\.size\/R\.tile/,
    'src/barricades134.js': /createFeaturePlan\(full\.worldSeed,C\.campaignLocal217\?\.\(full\)\?\.size\?\?C\.WORLD_SIZE/,
    'src/exploration-125.js': /const size = game\.local\?\.size \?\? plan\.worldSize;/,
    'src/recon.js': /findPath\(start,goal,blocked,g\.local\.tiles,g\.local\.tiles/,
    'src/fieldcraft.js': /const S217=g\.local\.size,c217=S217\/2/,
    'src/frontier.js': /Math\.abs\(p\.y-\(g\.local\|\|C\.LOCAL_MAP217\)\.size\/2\)/,
    'src/atlas-projection.js': /function exitSide\(p,context\)\{const S=context\?\.local\?\.size\?\?R\.localUnits/,
    'src/recon-ui.js': /const S217=\(\)=>\(g\.local\|\|C\?\.LOCAL_MAP217\)\?\.size\?\?4096;/,
    'src/seed-card217.js': /local\?\.size\|\|C\?\.WORLD_SIZE\|\|4096/,
    'src/horde-horizon217.js': /g\?\.local\?\.size\|\|C\?\.WORLD_SIZE\|\|4096/,
    'src/exploration-needs217.js': /g\.local\?\.size\?\?C\.WORLD_SIZE/,
    'src/atlas-render.js': /drawRoads\(c,\{left:0,top:0,right:\(g\.local\|\|C\.LOCAL_MAP217\)\.size/
  };
  for (const [file, pattern] of Object.entries(files)) assert.match(read(file), pattern, file);
  // Plus de lecture nue : constante en position de borne, 4 096 ou centre 2 048 en clair.
  const bare = {
    'src/succession133.js': /'local'\?C\.WORLD_SIZE/, 'src/arsenal134.js': /R\.postRadius,C\.WORLD_SIZE/,
    'src/fortification-pack.js': /num\(d\.[xywh],[01],C\.WORLD_SIZE\)/, 'src/vertical-network179.js': /finite\(crate\.[xy],0,C\.WORLD_SIZE\)/,
    'src/vertical-population181.js': /finite\(t\.start[XY], 0, C\.WORLD_SIZE\)/, 'src/vertical-citadel175-state.js': /finite\([ec]\.[a-z]+,[^,]+,C\.WORLD_(SIZE|TILES)\)/,
    'src/essential-state.js': /axisMax\(\):4096/, 'src/night-gear.js': /'local'\?4096/, 'src/survival-pack.js': /'local'\?4096/,
    'src/frontier-state.js': /anchor\.[xy],0,4096/, 'src/frontier.js': /-2048\)/, 'src/atlas-projection.js': /4040|-2048\)/,
    'src/recon-ui.js': /cx=cy=2048|Math\.min\(4096,|\/4096\*zoom|fillRect\(0,0,4096/, 'src/fieldcraft.js': /4058|2100|1996|-2048|Math\.min\(127|>=128|\*128\+/,
    'src/recon.js': /128,128/, 'src/atlas-render.js': /right:4096/, 'src/vertical-citadel175.js': /W=C\.WORLD_SIZE/,
    'src/vertical-citadel175-render.js': /w:C\.WORLD_SIZE/, 'src/barricades134.js': /createFeaturePlan\(full\.worldSeed,C\.WORLD_SIZE/
  };
  for (const [file, pattern] of Object.entries(bare)) assert.doesNotMatch(read(file), pattern, file);
  const game = read('src/game.js');
  assert.match(game, /class WorldMap \{[\s\S]{0,200}get local\(\) \{ return WORLD_LOCAL217\.get\(this\) \|\| C\.LOCAL_MAP217; \}/);
  assert.match(game, /this\.facing=Math\.atan2\(local\.size\/2-y,local\.size\/2-x\)/, 'orientation d’un infecté : centre de sa carte');
  assert.match(game, /new WorldMap\(data\.worldSeed, data\.cityGeometry202 \|\| 0, C\.localMapOf217\(data\)\)/);
  assert.match(game, /localTiles: this\.local\.tiles/);
  assert.match(game, /Math\.min\(g\.local\.tiles-1,Math\.floor\(bottom\/tile\)\)/, 'voirie : emprise bornée par la carte');
  assert.match(game, /right:g\.local\.size,bottom:g\.local\.size/);
  assert.doesNotMatch(game, /WORLD_(SIZE|TILES)/, 'game.js ne lit plus les constantes de taille');
  const core = read('src/core.js');
  assert.match(core, /const key=\(x,y,local\)=>y\*tilesOf\(local\)\+x;/);
  assert.match(core, /finite\(t\.x,0,localSize217\(local\)\)/);
  assert.match(core, /num\(v\.x,26,C\.campaignLocal217\(data\)\.size-26\)/);
  assert.doesNotMatch(core, /finite\(t\.[xy],0,4096\)|finite\(ctx\.origin\?\.[xy],0,4096\)|integer\(p\.x,1,126\)|at\(x,y\)\{if\(!finite\(x,0,4096\)|const key=\(x,y\)=>y\*RULES\.worldTiles\+x/);
});

test('O5 : sauvegarde — aucun champ à 128, refus hors de la génération qui nomme la taille', () => {
  const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
  const { g } = bootDocument134();
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const data = g.serialize();
  assert.equal(Object.hasOwn(data, 'localTiles'), false, 'campagne de 128 cases : rien d’écrit');
  const S = globalThis.DeadwallSave;
  assert.equal(Object.hasOwn(S.validate(JSON.parse(JSON.stringify(data))), 'localTiles'), false);
  for (const value of [128, 192, 64, '192', null, 191.5]) {
    assert.throws(() => S.validate({ ...JSON.parse(JSON.stringify(data)), localTiles: value }), /taille de carte locale|Taille de carte locale|invalide/i, String(value));
  }
  // 192 n'est nommée que par la génération 12, que le registre régional refuse toujours.
  const g12 = JSON.parse(JSON.stringify(data)); g12.localTiles = 192; g12.frontier = { ...g12.frontier, generation: 12 };
  assert.throws(() => S.validate(g12));
  assert.equal(g.local.tiles, 128);
});

test('O5 : fumée hors jeu à 192 m — carte, champ de flux et validateurs sans hypothèse de 128', () => {
  const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
  const { g } = bootDocument134();
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
  const D = globalThis.DeadwallCore, L = D.localMap217(192);
  const snap = () => { const d = g.serialize(); delete d.timestamp; return JSON.stringify(d); }, before = snap();
  // Carte : construite à part, jamais branchée sur la partie.
  const World = g.world.constructor, Flow = g.flow.constructor;
  const map = new World(17117, 0, L);
  assert.equal(map.local, L);
  assert.equal(Object.hasOwn(map, 'local'), false);
  assert.equal(map.occupancy.length, 36864);
  assert.ok(map.nodes.some(n => n.x > 4096 || n.y > 4096), 'gisements répartis sur toute la carte');
  assert.ok(map.nodes.every(n => n.x <= L.size - 70 && n.y <= L.size - 70));
  assert.equal(map.atCell(191, 191), null); assert.equal(map.atCell(192, 5), null);
  assert.equal(map.placement(map.definition('woodWall'), 180, 180).valid, true, 'construction au-delà de 128 cases');
  assert.equal(map.placement(map.definition('woodWall'), 190, 40).reason, 'Hors de la zone');
  assert.equal(map.line({ x: 10, y: 150 }, { x: 185, y: 150 }).length, 176);
  // Champ de flux : dimensionné par la carte, toute case atteinte, direction vers la cible.
  const flow = new Flow(), target = L.centre();
  flow.rebuild(map, target);
  assert.equal(flow.local, L); assert.equal(flow.values.length, 36864);
  assert.equal(flow.values.some(v => v === 0x3fffffff), false);
  const d = flow.direction(6000, 6000, 0, 0);
  assert.ok(d.x < 0 && d.y <= 0 || d.y < 0 && d.x <= 0, 'depuis le coin sud-est, vers le centre');
  // Coût du champ de flux (préparation de D-O5) : mesuré, consigné, borné large pour ne pas dépendre de la machine.
  const time = (m, n) => { const f = new Flow(), t0 = process.hrtime.bigint(); for (let i = 0; i < n; i++) f.rebuild(m, m.local.centre()); return Number(process.hrtime.bigint() - t0) / 1e6 / n; };
  const empty128 = new World(17117, 0), city192 = new World(17117, 0, L);
  for (const b of g.world.buildings.values()) city192.add(Object.create(b));
  for (const m of [empty128, map, g.world, city192]) time(m, 3);
  const e128 = time(empty128, 30), e192 = time(map, 30), c128 = time(g.world, 30), c192 = time(city192, 30);
  console.log(`# champ de flux (moyenne de 30 reconstructions) : vide ${e128.toFixed(2)} ms à 128 cases, ${e192.toFixed(2)} ms à 192 (×${(e192 / e128).toFixed(2)}) ; partie 17117 ${c128.toFixed(2)} ms à 128, ${c192.toFixed(2)} ms recopiée sur 192 (×${(c192 / c128).toFixed(2)})`);
  assert.ok(e192 < 250 && c192 < 250);
  // Voirie et territoires : grille dérivée de la carte.
  const I = globalThis.DeadwallInfrastructure, T = globalThis.DeadwallTerritories;
  const roads = new I.Engine({ ...I.create(), roads: [{ x: 150, y: 170, progress: 1 }] }, L);
  assert.ok(roads.road(150, 170)); assert.equal(roads.road(150 + 192 * 0, 170).x, 150);
  assert.ok(roads.at(150 * 32 + 5, 170 * 32 + 5));
  assert.deepEqual(I.line({ x: 150, y: 10 }, { x: 160, y: 10 }, L).length, 11);
  assert.equal(I.line({ x: 150, y: 10 }, { x: 160, y: 10 }), null, 'carte par défaut : hors carte');
  assert.ok(I.findRoute({ x: 1, y: 1 }, { x: 190, y: 190 }, () => false, () => 1, 192, 192, 16384, 1, 192));
  assert.equal(I.findRoute({ x: 1, y: 1 }, { x: 190, y: 190 }, () => false, () => 1, 192, 192, 16384, 1), null, 'plafond historique sans carte');
  const truck = { id: 1, theme: 'housing', phase: 'returning', x: 5000, y: 300, health: 100, food: 0, cargo: 0, angle: 0, recalled: false };
  const sectors = { ...T.create(), trucks: [truck], nextTruckId: 2 };
  assert.equal(T.normalize(sectors, L).trucks[0].x, 5000);
  assert.throws(() => T.normalize(sectors));
  assert.equal(new T.Engine(undefined, L).dispatchStatus('housing', {}).ok, false);
  // Validateurs du domaine « local » : même entrée admise à 192, refusée sur la carte par défaut.
  const big = { localTiles: 192 }, x = 5000;
  const cases = {
    bivouac: d => require('../src/survival-pack.js').normalize({ version: 1, serial: 2, camps: [{ id: 1, domain: 'local', x, y: 300, z: 0, inside: null, left: 10, cover: 0 }], meal: { left: 0, budget: 0 }, dressing: { left: 0, remaining: 0 } }, d),
    débris: d => require('../src/fortification-pack.js').normalize({ version: 1, fittings: [], debris: [{ id: 5, type: 'woodWall', x, y: 300, w: 32, h: 32, remaining: {} }] }, { ...(d || {}), nextId: 100 }),
    ancre: d => { const F = require('../src/frontier-state.js'), s = F.initial(); s.anchor = { x, y: 300 }; return F.normalize(s, d || { worldSeed: 1 }); },
    véhicule: d => { const s = D.Expeditions.normalize(undefined); s.vehicle = { id: 1, x, y: 300, health: 100, fuel: 10, angle: 0, driving: false, cargo: D.makeBag() }; return D.Expeditions.normalize(s, d || { worldSeed: 1 }); },
    décor: d => D.Fieldcraft.normalize({ version: 1, nodes: [[1, x, 300]], opacity: null, attempt: false, outcome: '' }, d || { worldSeed: 1 }),
    ralliement: d => globalThis.DeadwallSquads.normalize(undefined, { x, y: 300 }, undefined, D.localMapOf217(d)),
    éclairage: d => { const t = D.NightGearRules.types.campfire; return require('../src/night-gear.js').normalize({ version: 1, serial: 2, devices: [{ id: 1, kind: 'campfire', location: 'placed', left: t.duration, on: false, used: false, domain: 'local', x, y: 300, z: 0, inside: null, angle: 0 }] }, d || { worldSeed: 1 }); }
  };
  for (const [name, check] of Object.entries(cases)) {
    assert.doesNotThrow(() => check(big), name + ' à 192');
    assert.throws(() => check(undefined), name + ' à 128');
  }
  assert.equal(snap(), before, 'la partie en cours n’a pas bougé');
  assert.equal(g.local, D.LOCAL_MAP217);
});
