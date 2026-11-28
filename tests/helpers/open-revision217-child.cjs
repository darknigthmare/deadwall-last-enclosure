'use strict';
// Processus enfant de tests/openworld217-revision.test.cjs : une campagne sans bord jouée de bout en bout sous une révision
// SIMULÉE du générateur (règles de relief modifiées dès le chargement du cœur, tests/helpers/open-engine217.cjs), qui sort à
// pied par le passage est, puis note ses cantons vus. Écrit sur la sortie standard la sauvegarde et les empreintes de ce que
// cette campagne a montré (cité, cantons vus : canton, lieux, arbres et rochers).
const fs = require('node:fs');
const path = require('node:path');
const H = require('./open-engine217.cjs');

const CORE = path.join('src', 'core.js');
const read = fs.readFileSync;
// Le cœur est évalué par le harnais à partir de son texte : le correctif de la révision simulée est posé juste après lui.
fs.readFileSync = function (file, ...rest) {
  const out = read.call(fs, file, ...rest);
  return typeof file === 'string' && file.endsWith(CORE) && typeof out === 'string' ? out + '\n;globalThis.__revision217?.(globalThis.DeadwallCore);' : out;
};
globalThis.__revision217 = C => H.patchCore(C);
const { bootDocument134 } = require('../../scripts/qa-startup134.cjs');
const { g } = bootDocument134();
fs.readFileSync = read;
const C = globalThis.DeadwallCore, K = globalThis.DeadwallWorldCantons217;
const seed = Number(process.argv[2] || 17117), extra = (process.argv[3] || '').split(',').filter(Boolean);
if (g.startNew('standard', String(seed), 'classic', 'balanced', true, undefined, true) === false) throw Error('départ refusé');
g.campaignIntro132?.skip?.();
// Sortie à pied par le passage est, quelques pas dans le canton voisin.
const S = g.local.size; let spot = null;
for (let y = 0; y < 192 && !spot; y++) { const px = S - 50, py = y * C.TILE + 16; if (g.world.reach217(px, py) && g.friendlyPositionClear(g.player, px, py)) spot = { x: px, y: py }; }
if (!spot || (g.player.x = spot.x, g.player.y = spot.y, g.frontier.enter()) !== true) throw Error('sortie impossible');
g.input.keys.add('KeyD'); for (let i = 0; i < 90; i++) g.update(1 / 30); g.input.keys.delete('KeyD');
// Cantons vus de plus (registre : identifiants seuls), puis reprise pour que la campagne les porte.
const forged = JSON.parse(JSON.stringify(g.serialize()));
for (const id of extra) if (!forged.frontier.cantons.includes(id)) forged.frontier.cantons.push(id);
if (g.restoreSave(forged) !== true) throw Error('reprise refusée');
const save = JSON.parse(JSON.stringify(g.serialize())), w = g.frontier.world(), h = w.home;
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };
const cantons = {};
for (const id of save.frontier.cantons) {
  const p = K.parse(id), c = w.canton(p.cx, p.cy), chunks = [];
  for (let j = 0; j < 16; j++) chunks.push(w.chunk(p.cx * 4 + j % 4, p.cy * 4 + (j >> 2)));
  cantons[id] = { digest: c.digest, places: hash(JSON.stringify(w.placesOf(p.cx, p.cy))), scenery: hash(JSON.stringify(chunks)) };
}
const t = g.world.terrain217;
process.stdout.write(JSON.stringify({ save, revision: g.openWorld217.revision(), home: { ...h }, city: { digest: t.digest, levels: hash(Array.from(t.levels).join(',')), roads: hash(Array.from(t.roads).join(',')), core: { x: g.core().x, y: g.core().y } }, cantons }));
