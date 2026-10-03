'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { makeClass, parseFactory, wallGuard, readPatch } = require('./deadwall-qa/methods.cjs');
const Case = makeClass();
function construction({ progress = 0, health = 120, dead = false } = {}) {
  return Object.assign(new Case(), { progress, health, dead, maxHealth: 1000, def: { buildTime: 10 }, get completed() { return this.progress >= 1; } });
}
// Object.assign would copy the getter's result; install the live property explicitly.
function building(options = {}) {
  const b = construction(options); Object.defineProperty(b, 'completed', { get() { return this.progress >= 1; } }); return b;
}
function node(amount = 10) { return Object.assign(new Case(), { amount, depleted: false, flash: 0 }); }
function scene() {
  return Object.assign(new Case(), {
    world: { nodes: [], buildings: new Map() }, units: [], zombies: [],
    player: { id: 0, x: 100, y: 100, dead: false },
    visible(x, y, radius, view) { return x + radius >= view.left && x - radius <= view.right && y + radius >= view.top && y - radius <= view.bottom; }
  });
}
const view = { left: 0, right: 500, top: 0, bottom: 500 };
const entity = (id, y, extra = {}) => ({ id, x: 100, y, dead: false, ...extra });

describe('QA 1 — Débutant : récolte et états de commande', () => {
  test('une récolte normale transfère exactement la quantité demandée', () => { const n = node(); assert.equal(n.harvest(3), 3); assert.equal(n.amount, 7); });
  test('un prélèvement supérieur au gisement ne crée aucune ressource', () => { const n = node(2); assert.equal(n.harvest(10), 2); assert.equal(n.amount, 0); assert.equal(n.depleted, true); });
  test('les prélèvements fractionnaires restent possibles', () => { const n = node(); assert.equal(n.harvest(.25), .25); assert.equal(n.amount, 9.75); });
  test('un gisement épuisé reste épuisé', () => { const n = node(); n.depleted = true; assert.equal(n.harvest(1), 0); assert.equal(n.amount, 10); });
  for (const amount of [0, -1, NaN, Infinity, -Infinity, '2', null, undefined]) {
    test(`récolte invalide ${String(amount)} : aucun changement`, () => { const n = node(); assert.equal(n.harvest(amount), 0); assert.equal(n.amount, 10); assert.equal(n.flash, 0); });
  }
  test('une ligne vide ne crée plus une palissade en 0,0', () => assert.equal(wallGuard()('woodWall', []), false));
  test('une ligne absente est refusée sans exception', () => assert.equal(wallGuard()('woodWall'), false));
  test('des cellules fractionnaires sont refusées', () => assert.equal(wallGuard()('woodWall', [{ x: .5, y: 2 }]), false));
  test('une ligne hors carte est refusée', () => assert.equal(wallGuard()('woodWall', [{ x: 128, y: 127 }]), false));
  test('un type hérité du prototype n’est pas un bâtiment', () => assert.equal(wallGuard()('constructor', [{ x: 2, y: 2 }]), null));
  test('une ligne valide parvient toujours à la logique existante', () => assert.equal(wallGuard()('woodWall', [{ x: 127, y: 127 }]).id, 'woodWall'));
});

describe('QA 2 — Stratège : intégrité et construction sous pression', () => {
  test('le chantier neuf conserve la progression historique', () => { const b = building(); assert.equal(b.work(5), false); assert.equal(b.progress, .5); assert.equal(b.health, 560); });
  test('terminer un chantier neuf atteint son intégrité maximum', () => { const b = building(); assert.equal(b.work(10), true); assert.equal(b.health, 1000); });
  test('les dégâts subis pendant le chantier ne disparaissent plus', () => { const b = building({ progress: .5, health: 360 }); b.work(1); assert.equal(b.progress, .6); assert.ok(Math.abs(b.health - 448) < 1e-9); });
  test('un chantier terminé conserve les dégâts de combat', () => { const b = building({ progress: .5, health: 360 }); b.work(5); assert.equal(b.health, 800); });
  test('les petits et gros pas donnent la même intégrité', () => { const a = building(), b = building(); a.work(8); for (let i = 0; i < 80; i++) b.work(.1); assert.ok(Math.abs(a.health - b.health) < 1e-8); });
  test('un ouvrage déjà terminé ne reçoit pas de réparation gratuite', () => { const b = building({ progress: 1, health: 700 }); assert.equal(b.work(5), false); assert.equal(b.health, 700); });
  test('une structure à zéro intégrité ne ressuscite pas', () => { const b = building({ health: 0 }); assert.equal(b.work(5), false); assert.equal(b.health, 0); });
  test('une structure détruite ne travaille plus', () => { const b = building({ dead: true }); assert.equal(b.work(5), false); assert.equal(b.progress, 0); });
  for (const amount of [0, -1, NaN, Infinity, -Infinity, '2', null, undefined]) {
    test(`travail invalide ${String(amount)} : état inchangé`, () => { const b = building({ progress: .5, health: 200 }); assert.equal(b.work(amount), false); assert.equal(b.progress, .5); assert.equal(b.health, 200); });
  }
  test('régression reproduite : l’ancienne fonction soignait même avec work(0)', () => {
    const Old = new Function('clamp', `return class { ${readPatch('construction', 'before')} }`)((x, a, b) => Math.max(a, Math.min(b, x)));
    const old = Object.assign(new Old(), { progress: .5, health: 200, maxHealth: 1000, def: { buildTime: 10 }, completed: false, dead: false });
    old.work(0); assert.equal(old.health, 560);
    const fixed = building({ progress: .5, health: 200 }); fixed.work(0); assert.equal(fixed.health, 200);
  });
});

describe('QA 3 — Explorateur : profondeur, visibilité et interruption', () => {
  test('les acteurs sont triés ensemble, indépendamment de leur faction', () => { const s = scene(); s.units = [entity(2, 250)]; s.zombies = [entity(3, 50)]; assert.deepEqual(s.depthEntries(view).map(e => e.entity.id), [3, 0, 2]); });
  test('un bâtiment masque un acteur derrière sa base', () => { const s = scene(); s.player.y = 150; s.world.buildings.set(9, entity(9, 130, { w: 3, h: 3, bottom: 178 })); assert.deepEqual(s.depthEntries(view).map(e => e.kind), [4, 1]); });
  test('un acteur devant la base est dessiné devant le bâtiment', () => { const s = scene(); s.player.y = 210; s.world.buildings.set(9, entity(9, 130, { w: 3, h: 3, bottom: 178 })); assert.deepEqual(s.depthEntries(view).map(e => e.kind), [1, 4]); });
  test('les décors participent au tri commun', () => { const s = scene(); s.world.nodes = [entity(8, 220, { radius: 15 })]; assert.deepEqual(s.depthEntries(view).map(e => e.entity.id), [0, 8]); });
  test('les gisements épuisés ne sont pas dessinés', () => { const s = scene(); s.world.nodes = [entity(8, 220, { radius: 15, depleted: true })]; assert.equal(s.depthEntries(view).length, 1); });
  test('les entités mortes sont exclues', () => { const s = scene(); s.player.dead = true; s.units = [entity(2, 100, { dead: true })]; assert.equal(s.depthEntries(view).length, 0); });
  test('les entités invisibles sont exclues', () => { const s = scene(); s.zombies = [entity(3, 900)]; assert.equal(s.depthEntries(view).length, 1); });
  test('une silhouette partiellement visible est conservée', () => { const s = scene(); s.units = [entity(2, 520)]; assert.equal(s.depthEntries(view).length, 2); });
  test('les égalités de profondeur sont stables par identifiant', () => { const s = scene(); s.player.dead = true; s.units = [entity(4, 100), entity(2, 100)]; assert.deepEqual(s.depthEntries(view).map(e => e.entity.id), [2, 4]); });
  test('la file réutilisée ne conserve pas d’entités fantômes', () => { const s = scene(); const q = s.depthEntries(view); s.player.dead = true; assert.equal(s.depthEntries(view), q); assert.equal(q.length, 0); });
  for (const state of [{ state: 'playing', paused: false, gameOver: false, expected: 1 }, { state: 'playing', paused: true, gameOver: false, expected: 0 }, { state: 'menu', paused: false, gameOver: false, expected: 0 }, { state: 'playing', paused: false, gameOver: true, expected: 0 }]) {
    test(`perte de focus : ${state.state}, pause=${state.paused}, défaite=${state.gameOver}`, () => {
      let calls = 0, releases = 0; const g = Object.assign(new Case(), state, { releaseInputs() { releases++; }, togglePause(flag) { assert.equal(flag, true); this.paused = true; calls++; } });
      g.suspendForFocusLoss(); assert.equal(calls, state.expected); assert.equal(releases, 1);
    });
  }
  test('deux notifications de perte de focus ne doublent pas la pause', () => { let calls = 0; const g = Object.assign(new Case(), { state: 'playing', paused: false, gameOver: false, releaseInputs() {}, togglePause() { this.paused = true; calls++; } }); g.suspendForFocusLoss(); g.suspendForFocusLoss(); assert.equal(calls, 1); });
});

describe('QA 4 — Robustesse : limites et paramètres', () => {
  const parse = parseFactory(), cap = 8 * 1024 * 1024;
  test('le garde-fou laisse un document ASCII normal au validateur métier', () => assert.deepEqual(parse('{"version":2}'), { version: 2 }));
  test('le garde-fou préserve les caractères français', () => assert.equal(parse('{"message":"Cité fortifiée"}').message, 'Cité fortifiée'));
  test('un document de exactement 8 Mio en UTF-8 passe le garde de taille', () => assert.equal(parse('"' + 'a'.repeat(cap - 2) + '"').length, cap - 2));
  test('un document ASCII trop long est refusé', () => assert.throws(() => parse('a'.repeat(cap + 1)), /volumineux/));
  test('UTF-8 multioctet : 3 millions de caractères peuvent dépasser 8 Mio', () => assert.throws(() => parse('"' + '界'.repeat(3_000_000) + '"'), /volumineux/));
  test('les accents sous la limite ne sont pas refusés', () => assert.equal(parse('"' + 'é'.repeat(1_000_000) + '"').length, 1_000_000));
  test('les objets ne contournent pas la fonction parse', () => assert.throws(() => parse({}), /volumineux/));
  test('le JSON syntaxiquement invalide reste refusé', () => assert.throws(() => parse('{'), SyntaxError));
  test('les options indiquent explicitement un échec de stockage', () => {
    const status = { textContent: '' }; const K = makeClass({ document: { getElementById() { return status; } }, localStorage: { setItem() { throw new Error('quota'); } } });
    const g = Object.assign(new K(), { settings: { muted: true } }); assert.equal(g.saveSettings(), false); assert.match(status.textContent, /session seulement/); assert.equal(g.settings.muted, true);
  });
  test('une sauvegarde de paramètres réussie renvoie true', () => {
    let stored; const K = makeClass({ localStorage: { setItem(key, value) { stored = [key, JSON.parse(value)]; } } });
    const g = Object.assign(new K(), { settings: { volume: .7 } }); assert.equal(g.saveSettings(), true); assert.equal(stored[0], 'deadwall-settings-v1'); assert.equal(stored[1].volume, .7);
  });
  test('720 infectés sont triés sans modifier leur tableau de simulation', () => {
    const s = scene(); s.zombies = Array.from({ length: 720 }, (_, i) => entity(i + 1, (i * 137) % 500)); const ids = s.zombies.map(z => z.id);
    const q = s.depthEntries(view); assert.equal(q.length, 721); for (let i = 1; i < q.length; i++) assert.ok(q[i].depth >= q[i - 1].depth); assert.deepEqual(s.zombies.map(z => z.id), ids);
  });
  test('500 scènes déterministes gardent tri, cardinalité et nombres finis', () => {
    for (let seed = 1; seed <= 500; seed++) { const s = scene(); s.units = Array.from({ length: 30 }, (_, i) => entity(i + 1, (seed * 97 + i * 43) % 500)); const q = s.depthEntries(view); assert.equal(q.length, 31); for (let i = 1; i < q.length; i++) assert.ok(Number.isFinite(q[i].depth) && q[i].depth >= q[i - 1].depth); }
  });
});
