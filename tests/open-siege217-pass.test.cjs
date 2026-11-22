'use strict';
// Monde sans bord, siège adossé (specs/monde-sans-bord/ouverture.md, O7 ; décision du 22 novembre 2026, D-O2 inchangée) :
// - le plafond de passage s'applique à toute cité à un seul côté ouvert, quelle que soit sa largeur
//   (`C.OpenSiege217Rules.passRate.max` arrivées par seconde au plus) ;
// - la Meneuse et son escorte, déjà sur la carte à l'assaut, entrent dans ce même débit : la file attend leur passage
//   (`C.OpenSiege217.lead`) ; même effectif total, jamais plus de points de vie, vague plus longue.
// Toujours hors jeu : la partie de terrain est construite par le harnais (la génération 12 reste refusée par le jeu et
// par la sauvegarde) ; une carte plate et une cité à plusieurs fronts ne prennent aucun de ces chemins.
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { buildTerrainGame217 } = require('./helpers/terrain-game217.cjs');

const { g } = bootDocument134();
g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
const C = globalThis.DeadwallCore, Lw = require('../src/world-local217.js'), SAVE = globalThis.DeadwallSave;
const O = C.OpenSiege217, R = C.OpenSiege217Rules, P = R.passRate, DT = 1 / 30;
const descs = new Map(), desc = s => { if (!descs.has(s)) descs.set(s, Lw.describe(s)); return descs.get(s); };
const copy = v => JSON.parse(JSON.stringify(v));
const ownSave = Object.getOwnPropertyDescriptor(g, 'save');
const one = (width, status = 'ouvert') => ({ north: { status: 'clos', width: 0 }, east: { status: 'clos', width: 0 }, south: { status: 'clos', width: 0 }, west: { status, width, entries: [{ from: 0, to: width, width }], passages: [] } });

function restoreFlat() {
  if (ownSave) Object.defineProperty(g, 'save', ownSave); else delete g.save;
  g.startNew('standard', '17117'); g.campaignIntro132?.skip?.();
}
// Harnais O8a ; sauvegarde automatique coupée (refusée tant que G12 est fermée) pour ne pas bruiter les journaux.
function terrainGame(seed) {
  restoreFlat();
  const r = buildTerrainGame217(g, () => desc(seed), seed);
  Object.defineProperty(g, 'save', { value: () => false, writable: true, configurable: true });
  return r;
}
// Vague menée suivante, Meneuse et escorte postées au calme, puis alerte et assaut.
function ledAssault() {
  const api = g.abominations217, wave = api.next(); assert.ok(wave, 'vague menée');
  g.wave = wave; g.phase = 'calm'; g.phaseTime = 30; g.update(DT);
  const escort = api.escort(), onSite = g.zombies.filter(z => !z.dead).length;
  g.phase = 'warning'; g.prepareWave(); const announced = g.wavePlan.total;
  g.phase = 'assault'; g.phaseTime = 0; g.startAssault();
  return { api, wave, escort, onSite, announced };
}
const queued = () => g.spawnQueue.length + C.spawnCount(g.pendingSpawns);

test('siège adossé : plafond de passage gelé, appliqué à toute largeur d’un seul côté, jamais à plusieurs fronts', () => {
  assert.ok(Object.isFrozen(R) && Object.isFrozen(P));
  assert.deepEqual(JSON.parse(JSON.stringify(P)), { perMetre: .25, min: 1, max: 1.5 });
  assert.ok(Number.isFinite(P.max) && P.max >= P.min && P.max < 3, 'plafond absolu sous l’ancien débit d’une rampe de 12 m');
  assert.equal(C.WorldSave217Rules.open, false, 'la génération 12 reste fermée');
  // Une cité à un seul côté : min(plafond absolu, débit par mètre), au moins `min`, quelle que soit la largeur.
  for (const width of [2, 4, 12, 32, 48, 64, 96, 142, 192]) {
    const sides = one(width), expected = Math.max(P.min, Math.min(P.max, P.perMetre * width));
    assert.equal(O.rate(['west'], sides), expected, width + ' m');
    for (const interval of [.075, .088, .15, .289, .358, .426, .502]) assert.equal(O.gap(interval, ['west'], sides), Math.max(interval, 1 / expected));
  }
  for (const width of [32, 48, 64, 96, 142]) assert.equal(O.rate(['west'], one(width)), P.max, width + ' m : le plafond absolu mord');
  // Plusieurs fronts, carte plate : aucun plafond, aucune attente.
  const two = { ...one(32), east: { status: 'ouvert', width: 96, entries: [{ from: 0, to: 96, width: 96 }], passages: [] } };
  assert.equal(O.rate(['east', 'west'], two), Infinity); assert.equal(O.gap(.2, ['east', 'west'], two), .2);
  // Cité à plusieurs côtés dont la vague n'en prend qu'un : débit par mètre seul, comme avant (pas de plafond absolu).
  assert.equal(O.rate(['east'], two), 24); assert.equal(O.rate(['west'], two), 8);
  const four = Object.fromEntries(['north', 'east', 'south', 'west'].map(s => [s, { status: 'ouvert', width: 128, entries: [], passages: [] }]));
  assert.equal(O.gap(.496, ['north'], four), .496, 'quatre côtés ouverts, un seul front : aucun plafond nouveau');
  assert.equal(O.rate(['west'], undefined), Infinity); assert.equal(O.gap(.2, ['west'], undefined), .2);
  // Attente de la file pour la Meneuse et son escorte : une place du débit chacun, seulement sur un seul front.
  assert.equal(O.lead(7, .5, ['west'], one(64)), 3.5);
  assert.equal(O.lead(0, .5, ['west'], one(64)), 0);
  assert.equal(O.lead(7, .5, ['east', 'west'], two), 0);
  assert.equal(O.lead(7, .5, ['west'], undefined), 0);
  for (const bad of [NaN, -1, Infinity, 0, '0,5', null]) assert.equal(O.lead(7, bad, ['west'], one(64)), 0, String(bad));
  assert.equal(O.lead(-3, .5, ['west'], one(64)), 0); assert.equal(O.lead(2.9, .5, ['west'], one(64)), 1);
});

test('siège adossé : une cité à un seul côté de 32 et de 64 m est plafonnée sur le directeur, même effectif, mêmes points de vie', () => {
  const health = [];
  for (const [seed, metres] of [[714, 32], [450, 64]]) {
    const sides = desc(seed).sides; assert.deepEqual(O.open(sides).map(f => sides[f].width), [metres]);
    for (const wave of [6, 18, 36]) {
      terrainGame(seed); g.wave = wave; g.phase = 'warning'; g.prepareWave(); g.phase = 'assault'; g.startAssault();
      const plan = g.wavePlan, total = plan.total, gap = g.spawnGap217();
      assert.equal(gap, Math.max(plan.spawnInterval, 1 / P.max), seed + '/' + wave);
      assert.ok(gap > plan.spawnInterval, seed + '/' + wave + ' : le plafond mord (' + plan.spawnInterval + ' s au plan)');
      let n = 0; for (let k = 0; k < 10 * 30; k++) { const before = g.zombies.length; g.updateDirector(DT); n += g.zombies.length - before; }
      assert.ok(n <= Math.ceil((10 - .2) * P.max) + 1 && n >= Math.floor((10 - .2) * P.max) - 1, seed + '/' + wave + ' : ' + n + ' arrivées en 10 s');
      // Le reste attend au pied : rien n'est perdu ni ajouté.
      assert.equal(queued() + g.zombies.length, total, 'même effectif');
      health.push(...g.zombies.map(z => [wave, z.kind, z.maxHealth]));
    }
  }
  // Mêmes points de vie qu'une apparition de carte plate à la même vague.
  restoreFlat();
  for (const [wave, kind, max] of health) { g.wave = wave; g.spawnZombie(kind); assert.equal(g.zombies.pop().maxHealth, max, kind + ' vague ' + wave); }
  restoreFlat();
});

test('siège adossé : la Meneuse et son escorte entrent dans le même débit (cité à un seul côté, 450)', () => {
  terrainGame(450);
  const { api, escort, onSite, announced } = ledAssault();
  assert.ok(escort && escort.size > 0 && onSite === escort.size + 1, JSON.stringify(escort) + ' / ' + onSite);
  const after = api.escort(), plan = g.wavePlan, gap = g.spawnGap217();
  assert.equal(after.woken, true); assert.equal(after.taken, escort.size, 'escorte prise sur l’effectif');
  // Attente : 0,2 s du moteur, puis une place du débit pour la Meneuse et chacun des membres debout.
  assert.ok(Math.abs(g.spawnTimer - (.2 + onSite * gap)) < 1e-9, g.spawnTimer + ' s');
  // Même effectif total : sur place (Meneuse comprise) + à entrer = plan annoncé + rassemblement.
  const gain = Math.floor(announced * C.Abominations217Rules.gatherShare + 1e-9);
  assert.equal(queued() + after.taken, announced + gain, 'effectif de la vague menée');
  assert.equal(plan.total, queued());
  // Aucune arrivée de la file tant que la Meneuse et l'escorte passent ; ensuite, au plus le débit du passage.
  const ids = new Set(g.zombies.map(z => z.id)); let first = null, entered = 0;
  for (let k = 0; k < 40 * 30; k++) {
    g.updateDirector(DT);
    for (const z of g.zombies) if (!ids.has(z.id)) { ids.add(z.id); entered++; if (first === null) first = (k + 1) * DT; }
    const t = (k + 1) * DT;
    // La Meneuse et l'escorte occupent les `onSite` premières places : la k-ième arrivée de la file vient au plus tôt à
    // 0,2 + (onSite + k) × intervalle.
    assert.ok(entered <= Math.max(0, Math.floor((t - .2) / gap + 1e-9) - onSite + 1), t.toFixed(2) + ' s : ' + entered + ' arrivées de la file');
  }
  assert.ok(first >= .2 + onSite * gap - DT - 1e-9, 'première arrivée à ' + first + ' s');
  assert.ok(entered > 0 && queued() + entered === plan.total, 'la file continue au débit du passage');
  // Lecture de siège : le plafond est écrit à la française.
  const Readout = require('../src/siege-readout.js');
  g.phase = 'assault'; assert.match(Readout.frontsSentence(C, g), /entrée plafonnée à 1,5 par seconde, le reste attend au pied\.$/);
  restoreFlat();
});

test('siège adossé : aucune attente sur une cité à deux côtés (17117) ni sur une carte plate (lecture empoisonnée)', () => {
  terrainGame(17117);
  const a = ledAssault(); assert.ok(a.escort && a.onSite > 1);
  assert.equal(g.fronts.length > 0, true); assert.equal(g.spawnTimer, .2, 'deux côtés : aucune attente');
  // Carte plate : la Meneuse et son escorte, mêmes réglages qu'avant ; le siège adossé n'est jamais lu.
  restoreFlat();
  const real = O.lead, realRate = O.rate; let calls = 0;
  const poisoned = Object.freeze({ ...O, lead: (...a) => { calls++; return real(...a); }, rate: (...a) => { calls++; return realRate(...a); } });
  Object.defineProperty(C, 'OpenSiege217', { value: poisoned, configurable: true, writable: true });
  try {
    const flat = ledAssault(); assert.ok(flat.escort && flat.onSite > 1);
    assert.equal(g.spawnTimer, .2, 'carte plate : départ du moteur inchangé');
    for (let k = 0; k < 10 * 30; k++) g.updateDirector(DT);
    assert.equal(calls, 0, 'carte plate : aucune lecture du siège adossé');
    assert.equal(g.openSiege217, undefined);
  } finally { Object.defineProperty(C, 'OpenSiege217', { value: O, configurable: true, writable: true }); }
  restoreFlat();
});

test('siège adossé : l’attente de l’escorte est portée par la sauvegarde et jamais rejouée à la reprise', () => {
  terrainGame(450);
  const { onSite } = ledAssault(), lead = g.spawnTimer, gap = g.spawnGap217();
  assert.ok(lead > 1);
  for (let k = 0; k < 15; k++) g.updateDirector(DT);
  const data = copy(g.serialize()), left = g.spawnTimer;
  assert.ok(Math.abs(data.spawnTimer - left) < 1e-9 && Math.abs(left - (lead - 15 * DT)) < 1e-9, 'cadence sauvegardée');
  assert.equal(data.version, 20); assert.ok(data.openSiege217, 'siège adossé sauvegardé');
  // Reprise : la garde de taille de carte refuse encore la génération 12 ; le bloc du siège passe par sa validation.
  const real = SAVE.validate;
  SAVE.validate = raw => (raw.openSiege217 === undefined ? { ...raw } : { ...raw, openSiege217: O.normalize(raw.openSiege217, raw) });
  try { assert.equal(g.restoreSave(data), true); } finally { SAVE.validate = real; }
  assert.ok(Math.abs(g.spawnTimer - left) < 1e-9, 'aucune attente de plus à la reprise');
  assert.ok(onSite * gap > 0);
  restoreFlat();
});
