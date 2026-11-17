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
