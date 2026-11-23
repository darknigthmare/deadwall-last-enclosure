'use strict';
// Monde sans bord, préalable O9 (b), points 2 et 3 (specs/monde-sans-bord/ouverture.md ; décisions D-O1, D-O2) :
// - la Meneuse (vagues menées) et l'abomination de siège (`src/abominations217.js`) ne prennent leur côté que parmi les
//   côtés ouverts d'un terrain, par le même hachage qu'avant (aucun tirage de plus) ; carte plate : identité ;
// - l'état du siège adossé (`openSiege217`) est porté par la sauvegarde de façon additive (version 20 inchangée ;
//   absent : reconstruit comme avant), et une reprise en pleine vague continue les parts là où elles en étaient.
// Toujours hors jeu : la partie de terrain est construite par le harnais (la génération 12 reste refusée par le jeu et
// par la sauvegarde) ; la reprise est rejouée en contournant la seule garde de taille de carte, puis en rendant le terrain.
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');

const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, Lw = require('../src/world-local217.js'), A = require('../src/abominations217.js');
const O = C.OpenSiege217, SAVE = globalThis.DeadwallSave, MAP = C.localMap217(192), SIDES = ['north', 'east', 'south', 'west'];
const World = g.world.constructor, Flow = g.flow.constructor, DT = 1 / 30;
const descs = new Map(), desc = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const THEMES = [...new Set(C.Dayworks.SITES.map(s => s.theme))];
const copy = v => JSON.parse(JSON.stringify(v));
const ownSave = Object.getOwnPropertyDescriptor(g, 'save');

function restoreFlat() {
  if (ownSave) Object.defineProperty(g, 'save', ownSave); else delete g.save;
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
}
// Même harnais que `open-siege217` : quartiers fictifs autour du cœur, sauvegarde automatique coupée.
function terrainGame(seed) {
  restoreFlat();
  const r = buildTerrainGame217(g, () => desc(seed), seed), c = r.core;
  r.world.sites = THEMES.map((theme, k) => ({ id: 'harnais-' + k, theme, x: c.x + 160 * Math.cos(k), y: c.y + 160 * Math.sin(k) }));
  Object.defineProperty(g, 'save', { value: () => false, writable: true, configurable: true });
  return r;
}
// Ancienne lecture du poste (avant O9 b) : côté parmi les quatre, bord de la carte par défaut.
function legacyPost(seed, wave) {
  const R = C.Abominations217Rules, h = A.hash(seed, wave), side = SIDES[h & 3], size = C.LOCAL_MAP217.size;
  const along = (R.spanMin + (R.spanMax - R.spanMin) * ((h >>> 8) % 1024) / 1023) * size, near = R.standoff, far = size - R.standoff;
  const at = side === 'north' ? { x: along, y: near } : side === 'south' ? { x: along, y: far } : side === 'east' ? { x: far, y: along } : { x: near, y: along };
  return { side, x: at.x, y: at.y };
}
const legacyEdge = (x, y, size) => { const d = { north: y, south: size - y, west: x, east: size - x }; return SIDES.reduce((a, b) => d[b] < d[a] ? b : a, 'north'); };

test('O9 (b) : poste de la Meneuse — carte plate identique, terrain parmi les seuls côtés ouverts, au bord de la carte', () => {
  // Carte plate : mêmes postes qu'avant, avec ou sans cadre vide.
  for (const seed of [0, 1, 42, 17117, 84329, 967313470]) for (let wave = 12; wave < 400; wave++) {
    const p = A.post(seed, wave), old = legacyPost(seed, wave);
    assert.equal(p.side, old.side); assert.equal(p.x, old.x); assert.equal(p.y, old.y);
    assert.deepEqual(A.post(seed, wave, undefined), p);
    assert.deepEqual(A.posts(seed, wave), A.posts(seed, wave, undefined));
  }
  // Terrain à quatre côtés ouverts : même côté que la carte plate (h modulo 4 = h & 3).
  const four = Object.fromEntries(SIDES.map(s => [s, { status: 'ouvert', width: 192, entries: [{ from: 0, to: 192, width: 192 }], passages: [] }]));
  for (let wave = 12; wave < 400; wave++) assert.equal(A.post(17117, wave, { sides: four, size: MAP.size }).side, A.post(17117, wave).side);
  // Cinquante graines du terrain : côté toujours ouvert, poste au bord de la carte de 192 m ; mêmes postes pour la même graine.
  let closedBefore = 0, posts = 0;
  for (let seed = 1; seed <= 50; seed++) {
    const sides = desc(seed).sides, open = O.open(sides), frame = { sides, size: MAP.size };
    assert.deepEqual(A.openSides(sides), open);
    for (let wave = 12; wave < 112; wave++) {
      const p = A.post(seed, wave, frame); posts++;
      assert.ok(open.includes(p.side), seed + '/' + wave + ' : ' + p.side + ' hors de ' + open);
      if (!open.includes(A.post(seed, wave).side)) closedBefore++;
      const R = C.Abominations217Rules, deep = p.side === 'north' ? p.y : p.side === 'south' ? MAP.size - p.y : p.side === 'west' ? p.x : MAP.size - p.x;
      assert.equal(deep, R.standoff, 'au bord de la carte de terrain');
      for (const q of A.posts(seed, wave, frame)) { assert.equal(q.side, p.side); assert.ok(q.x > 0 && q.y > 0 && q.x < MAP.size && q.y < MAP.size); }
      assert.deepEqual(A.post(seed, wave, frame), p, 'fonction pure');
    }
  }
  assert.equal(posts, 5000); assert.ok(closedBefore > 200, closedBefore + ' postes tombaient sur un côté clos');
});

test('O9 (b) : côté d’entrée de l’abomination de siège — carte plate identique, terrain parmi les côtés ouverts', () => {
  for (let k = 0; k < 2000; k++) {
    const x = (k * 7919) % 4096, y = (k * 104729) % 4096;
    assert.equal(A.edgeOf(x, y, 4096), legacyEdge(x, y, 4096)); assert.equal(A.edgeOf(x, y, 4096, undefined), legacyEdge(x, y, 4096));
  }
  // 17117 : couloir est-ouest, nord et sud clos. Un point près du bord nord revient au côté ouvert le plus proche.
  const sides = desc(17117).sides; assert.deepEqual(O.open(sides), ['east', 'west']);
  assert.equal(A.edgeOf(1000, 40, MAP.size, sides), 'west'); assert.equal(A.edgeOf(5000, 40, MAP.size, sides), 'east');
  assert.equal(A.edgeOf(5000, 6100, MAP.size, sides), 'east');
  for (let k = 0; k < 2000; k++) { const x = (k * 7919) % MAP.size, y = (k * 104729) % MAP.size; assert.ok(['east', 'west'].includes(A.edgeOf(x, y, MAP.size, sides))); }
  // Partie de terrain : Traîne-épave désignée parmi les entrées, côté ouvert ; aucun tirage de plus dans le flux du jeu.
  const { world: w, core } = terrainGame(17117), api = g.abominationsSiege217;
  assert.ok(api.active());
  const Building = core.constructor, wall = new Building(g.nextId++, 'woodWall', core.gx - 6, core.gy, 0, 1, w.cityGeometry202); wall.health = wall.maxHealth; w.add(wall);
  const wave = api.next('drag'); assert.ok(wave);
  g.wave = wave; g.phase = 'calm'; g.phaseTime = 0; g.update(DT); assert.equal(g.phase, 'warning');
  g.phaseTime = 0; g.update(DT); assert.equal(g.phase, 'assault');
  let mark = null;
  for (let k = 0; k < 30 * 90; k++) { g.update(DT); mark = api.mark(); if (mark?.side) break; } assert.ok(mark && mark.side, 'abomination entrée : ' + JSON.stringify(mark));
  assert.ok(['east', 'west'].includes(mark.side), mark.side);
  restoreFlat();
});

test('O9 (b) : Meneuse sur un terrain (17117) — postée sur un côté ouvert, au bord de la carte de 192 m', () => {
  const { world: w } = terrainGame(17117), api = g.abominations217;
  assert.ok(api.active());
  const wave = api.next(); assert.ok(wave);
  g.wave = wave; g.phase = 'calm'; g.phaseTime = 30; g.update(DT);
  const leader = api.leader(), f = api.forecast(), size = g.local.size;
  assert.equal(size, MAP.size);
  assert.ok(f && ['east', 'west'].includes(f.side), JSON.stringify(f));
  if (leader) {
    assert.ok(['east', 'west'].includes(leader.side));
    const deep = leader.side === 'west' ? leader.x : size - leader.x; assert.ok(deep <= C.Abominations217Rules.standoff + C.Abominations217Rules.post.step + 1, 'au bord : ' + deep);
  }
  // Repère de l'horizon de la horde : même côté, le long du bord de la carte de terrain.
  const p = A.post(w.seed, wave, A.frameOf(g)); assert.equal(p.side, f.side);
  restoreFlat();
});

test('O9 (b) : siège adossé sauvegardé — clé additive, version 20, validation, carte plate sans clé', () => {
  // Carte plate en pleine vague : aucune clé, validation inchangée.
  restoreFlat(); g.wave = 10; g.phase = 'warning'; g.prepareWave(); g.phase = 'assault'; g.startAssault();
  for (let k = 0; k < 90; k++) g.updateDirector(DT);
  const flat = copy(g.serialize()); assert.equal(flat.version, 20); assert.equal('openSiege217' in flat, false);
  const checked = SAVE.validate(flat); assert.equal('openSiege217' in checked, false); assert.equal(checked.version, 20);
  assert.equal(JSON.stringify(SAVE.validate(flat)), JSON.stringify(checked));
  // Bloc cohérent ajouté à une sauvegarde valide : porté tel quel ; incohérent : refusé.
  const fronts = flat.fronts.slice(0, 2), block = { wave: 10, asked: flat.wavePlan.fronts, folded: false, fronts, shares: Object.fromEntries(fronts.map(f => [f, 1 / fronts.length])), emitted: Object.fromEntries(fronts.map(f => [f, 1])) };
  if (fronts.length === 1) block.shares[fronts[0]] = 1;
  const kept = SAVE.validate({ ...flat, openSiege217: block });
  assert.deepEqual(kept.openSiege217, block); assert.equal(kept.version, 20);
  assert.deepEqual(SAVE.parse(JSON.stringify({ ...flat, openSiege217: block })).openSiege217, block);
  const bad = [
    { ...block, wave: 9 }, { ...block, fronts: ['north', 'north'] }, { ...block, extra: 1 }, { ...block, asked: 0 },
    { ...block, shares: { ...block.shares, [fronts[0]]: 2 } }, { ...block, emitted: { ...block.emitted, [fronts[0]]: -1 } },
    { ...block, emitted: { ...block.emitted, [fronts[0]]: 1e9 } }, { ...block, folded: true, asked: fronts.length },
    { ...block, fronts: SIDES.filter(s => !flat.fronts.includes(s)).slice(0, 1) }, null, [],
  ];
  for (const b of bad) assert.throws(() => SAVE.validate({ ...flat, openSiege217: b }), /Siège adossé sauvegardé invalide/, JSON.stringify(b));
  assert.throws(() => SAVE.validate({ ...flat, phase: 'calm', openSiege217: block }));
  assert.equal(O.normalize(undefined, flat), undefined);
  // Reprise d'une sauvegarde plate : aucun état de siège.
  assert.equal(g.restoreSave(flat), true); assert.equal(g.openSiege217, undefined);
  restoreFlat();
});

test('O9 (b) : sauvegarde et reprise en pleine vague sur un terrain — les parts continuent là où elles en étaient', () => {
  const START = 300, MORE = 600;
  const run = (mode) => {
    terrainGame(17117); g.wave = 10; g.phase = 'warning'; g.prepareWave(); g.phase = 'assault'; g.startAssault();
    for (let k = 0; k < START; k++) g.updateDirector(DT);
    const data = copy(g.serialize()), live = copy(g.openSiege217);
    if (mode !== 'continu') {
      if (mode === 'sans') delete data.openSiege217;
      // O9 : le monde de terrain du harnais porte le registre G12, qui exige la marque « expérimental » à la reprise.
      data.expansions127.modules.openworld217 = globalThis.DeadwallOpenWorld217.fresh();
      // Reprise : la garde de taille de carte refuse encore la génération 12 ; le bloc du siège passe par sa propre
      // validation, puis le monde de terrain est rendu (la reprise d'un monde G12 viendra avec O9).
      const real = SAVE.validate;
      SAVE.validate = raw => (raw.openSiege217 === undefined ? { ...raw } : { ...raw, openSiege217: O.normalize(raw.openSiege217, raw) });
      try { assert.equal(g.restoreSave(data), true); } finally { SAVE.validate = real; }
    }
    // Monde de terrain rendu (bâtiments repris), dans les trois parcours : les modules qui suivent le monde par son
    // identité (échelons de nuit des chantiers de jour) repartent de la même façon, seul le siège adossé diffère.
    const old = g.world, w = new World(17117, old.cityGeometry202, MAP, desc(17117));
    for (const b of old.buildings.values()) w.add(b);
    w.sites = THEMES.map((theme, k) => ({ id: 'harnais-' + k, theme, x: g.core().x + 160 * Math.cos(k), y: g.core().y + 160 * Math.sin(k) }));
    g.world = w; g.flow = new Flow(); g.flow.rebuild(w, g.core()); g.buckets.clear();
    const before = g.zombies.length;
    for (let k = 0; k < MORE; k++) g.updateDirector(DT);
    return { data, live, state: copy(g.openSiege217), spawned: g.zombies.slice(before).map(z => z.x === 18 ? 'west' : z.x === MAP.size - 18 ? 'east' : 'ailleurs') };
  };
  const a = run('continu'), b = run('reprise'), c = run('sans');
  assert.deepEqual(a.data.openSiege217, a.live, 'sauvegardé tel quel');
  assert.ok(a.live.emitted.east + a.live.emitted.west > 0, 'en pleine vague');
  assert.equal(a.data.version, 20);
  assert.deepEqual(b.state, a.state, 'reprise : mêmes parts que sans interruption');
  // Côtés des arrivées dans l'ordre (les types et les cases dépendent du flux du jeu, que la reprise de la file
  // d'apparition remet dans son ordre sauvegardé) : mêmes côtés, jamais un côté clos.
  assert.deepEqual(b.spawned, a.spawned, 'reprise : mêmes côtés, dans le même ordre');
  assert.ok(a.spawned.length > 20 && a.spawned.every(s => s !== 'ailleurs'));
  // Sans le bloc (comme avant O9 b) : reconstruit, compteurs à zéro — la reprise s'écarte.
  assert.notDeepEqual(c.state.emitted, a.state.emitted);
  restoreFlat();
});
