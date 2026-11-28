'use strict';
// Décor des six quartiers de la cité de terrain (génération 12 « sans bord », src/quarter-decor218.js ; GAME_BIBLE §2.1,
// §7.13, réserve « quartiers sans décor propre » du préalable O9 (a)). Règles gelées dans `C.QuarterDecor218Rules` ;
// module d'extension actif dans les seules campagnes sans bord neuves ; plan, fonction pure de la graine et du terrain,
// posé sur le terrain atteint (jamais eau, rampe, route ni plateau inaccessible) ; pièces pleines lues par fieldcraft
// comme le décor métrique (pas, flux, pose, véhicule) ; aucune case atteinte coupée ; parcelles qui acceptent une maison ;
// reprise identique ; ancienne campagne inactive ; peintres sans effet de bord.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { g } = bootDocument134();
const C = globalThis.DeadwallCore, Q = globalThis.DeadwallQuarterDecor218, R = C.QuarterDecor218Rules, T = C.TILE;
const open = (seed = '17117') => { const r = g.startNew('standard', seed, 'classic', 'balanced', true, undefined, true); g.campaignIntro132?.skip?.(); return r; };
const flat = (seed = '17117') => { const r = g.startNew('standard', seed); g.campaignIntro132?.skip?.(); return r; };
const json = v => JSON.parse(JSON.stringify(v));
const cellsOf = p => { const out = []; for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) out.push([x, y]); return out; };
// Champ de flux reconstruit, avec ou sans les corps du décor (global remplacé le temps du calcul).
function flowValues(withDecor) {
  const real = globalThis.DeadwallQuarterDecor218;
  if (!withDecor) globalThis.DeadwallQuarterDecor218 = { solids: () => [] };
  try { g.world.navigationVersion++; g.world.flowDirty = true; g.flow.rebuild(g.world, g.core()); return g.flow.values.slice(); }
  finally { globalThis.DeadwallQuarterDecor218 = real; g.world.navigationVersion++; g.world.flowDirty = true; g.flow.rebuild(g.world, g.core()); }
}

test('Q1 : règles gelées dans le cœur, script public après le registre, liste blanche et index des opérations', () => {
  assert.ok(Object.isFrozen(R) && Object.isFrozen(R.kinds) && Object.isFrozen(R.themes) && Object.isFrozen(R.parcel) && Object.isFrozen(R.alley));
  assert.equal(R.generation, 12); assert.equal(R.version, 1);
  // Six thèmes : ceux des secteurs (C.TERRITORY_SECTORS), chacun avec des pièces connues et au moins un étal ou abri.
  assert.deepEqual(Object.keys(R.themes).sort(), C.TERRITORY_SECTORS.map(s => s.id).sort());
  for (const [theme, list] of Object.entries(R.themes)) { assert.ok(list.length >= 4, theme); for (const [k] of list) assert.ok(R.kinds[k], theme + ':' + k); }
  for (const k of Object.values(R.kinds)) assert.ok(Number.isInteger(k.w) && Number.isInteger(k.h) && k.height > 0 && k.name);
  // Une parcelle accueille une maison de la géométrie métrique dans le sens de la place.
  const house = C.CityGeometry202.sizes.house; assert.ok(R.parcel.sizes.every(([w, h]) => w >= house[0] && h >= house[1]));
  const html = read('index.html'), at = f => html.indexOf('<script src="src/' + f + '.js"></script>');
  assert.ok(at('quarter-decor218') > 0 && at('expansion-kit') < at('quarter-decor218') && at('game') < at('quarter-decor218') && at('openworld217') < at('quarter-decor218') && at('fieldcraft') < at('quarter-decor218'));
  assert.ok(read('sw.js').includes('"src/quarter-decor218.js"'));
  { const kit = read('src/expansion-kit.js'); assert.ok(kit.includes("'quarterDecor218'") && kit.indexOf("'quarterDecor218'") < kit.indexOf("'balance217','breach217']")); }
  for (const name of ['ORDER', 'GROUPS', 'API_NAMES', 'LABELS']) assert.ok(new RegExp(name + '\\s*=\\s*[\\s\\S]*?quarterDecor218').test(read('src/expansion-ui.js')), name);
  assert.ok(g.expansions.get('quarterDecor218'), 'module enregistré au chargement');
  assert.deepEqual(Q.validate(undefined), Q.initial()); assert.deepEqual(Q.initial(), { version: 1, active: false, digest: null });
});

test('Q1 : campagne à région finie — module inactif, aucun corps, forme inactive écrite dans la sauvegarde', () => {
  assert.notEqual(flat(), false); assert.equal(g.world.terrain217, null);
  assert.equal(g.quarterDecor218.active(), false); assert.equal(g.quarterDecor218.plan(), null); assert.deepEqual(Q.solids(g), []);
  assert.deepEqual(Q.boxesFor(g, globalThis.DeadwallTerrainFPS217), []);
  const d = g.serialize(); assert.deepEqual(d.expansions127.modules.quarterDecor218, Q.initial());
  assert.equal(g.restoreSave(json(d)), true); assert.equal(g.quarterDecor218.active(), false);
});

test('Q1 : campagne sans bord neuve — six quartiers décorés sur le terrain atteint, jamais eau, rampe, route ni autre palier', () => {
  for (const seed of ['17117', '42', '3']) {
    assert.notEqual(open(seed), false);
    const t = g.world.terrain217, N = t.tiles, plan = g.quarterDecor218.plan();
    assert.ok(t && plan, seed); assert.equal(g.quarterDecor218.active(), true);
    assert.equal(plan.quarters.length, 6, seed);
    assert.deepEqual(plan.quarters.map(q => q.theme), g.world.sites.map(s => s.theme));
    assert.deepEqual(plan.quarters.map(q => q.name), g.world.sites.map(s => s.name));
    assert.ok(plan.pieces >= 12, seed + ' : décor fourni (' + plan.pieces + ')'); assert.ok(plan.parcels >= 3, seed + ' : parcelles');
    const used = new Set();
    for (const q of plan.quarters) {
      for (const p of [...q.pieces, ...q.parcels]) for (const [x, y] of cellsOf(p)) {
        const i = y * N + x; assert.ok(!used.has(i), 'chevauchement ' + p.id); used.add(i);
        assert.equal(t.reach[i], 1, p.id + ' hors du terrain atteint'); assert.equal(t.water[i], 0, p.id + ' dans l’eau');
        assert.notEqual(t.kinds[i], 2, p.id + ' sur une rampe'); assert.equal(t.roads[i], 0, p.id + ' sur une route'); assert.equal(t.levels[i], q.level, p.id + ' sur un autre palier');
      }
      for (const p of q.pieces) assert.ok(R.themes[q.theme].some(([k]) => k === p.kind), p.id);
      for (const a of q.alleys) { assert.deepEqual(a.at(-1), [q.x, q.y], 'ruelle menée à la place'); for (const [x, y] of a) { const i = y * N + x; assert.ok(t.reach[i] && !t.water[i] && t.levels[i] === q.level); } }
    }
  }
});

test('Q1 : pièces lues comme le décor métrique — pas, infectés, champ de flux, pose ; aucune case atteinte coupée ; parcelle constructible', () => {
  open('17117');
  const plan = g.quarterDecor218.plan(), N = g.local.tiles, bodies = Q.solids(g), house = g.world.definition('house');
  assert.equal(bodies.length, plan.pieces);
  for (const b of bodies) { assert.equal(b.metric202, 1); assert.equal(b.fixture, true); const r = g.fieldcraft.rect(b); assert.ok(r.r - r.l === b.body202.w && r.b - r.t === b.body202.h); }
  const piece = plan.quarters.flatMap(q => q.pieces)[0], cx = (piece.x + piece.w / 2) * T, cy = (piece.y + piece.h / 2) * T;
  assert.equal(g.friendlyPositionClear(g.player, cx, cy), false, 'le commandant ne traverse pas une maison');
  const z = { ...g.player, x: cx - piece.w * T, y: cy, radius: 12 };
  assert.equal(g.hostilePositionClear(z, cx, cy), false, 'un infecté ne traverse pas une maison');
  assert.ok(g.fieldcraft.props(cx, cy, 4).size >= 1);
  const refused = g.world.placement(g.world.definition('woodWall'), piece.x, piece.y, 0);
  assert.equal(refused.valid, false); assert.match(refused.reason, /Décor/);
  // Champ de flux : chaque case d'une pièce est infranchissable ; aucune autre case atteinte n'est perdue.
  const before = flowValues(false), after = flowValues(true), solid = new Set(plan.quarters.flatMap(q => q.pieces.flatMap(p => cellsOf(p).map(([x, y]) => y * N + x))));
  for (const i of solid) assert.ok(after[i] >= 0x3fffffff, 'case de pièce franchie');
  let lost = 0; for (let i = 0; i < N * N; i++) if (before[i] < 0x3fffffff && after[i] >= 0x3fffffff && !solid.has(i)) lost++;
  assert.equal(lost, 0, 'case atteinte coupée par le décor');
  // Les quatre bords ouverts restent reliés au cœur.
  for (let t = 0; t < N; t++) for (const i of [t, (N - 1) * N + t, t * N, t * N + N - 1]) if (before[i] < 0x3fffffff) assert.ok(after[i] < 0x3fffffff, 'entrée du bord coupée');
  // Parcelles : une maison s'y pose (règle normale de pose, terrain compris), et y est construite.
  let posed = 0;
  for (const q of plan.quarters) for (const p of q.parcels) {
    const x = p.x + Math.floor((p.w - house.size[0]) / 2), y = p.y + Math.floor((p.h - house.size[1]) / 2), rot = p.w >= house.size[0] && p.h >= house.size[1] ? 0 : 1;
    const ok = g.world.placement(house, rot ? p.x + Math.floor((p.w - house.size[1]) / 2) : x, rot ? p.y + Math.floor((p.h - house.size[0]) / 2) : y, rot);
    assert.equal(ok.valid, true, p.id + ' : ' + ok.reason); posed++;
  }
  assert.ok(posed >= 3);
  const p = plan.quarters.find(q => q.parcels.length).parcels[0];
  g.resources = { ...g.resources, wood: 9999, scrap: 9999, stone: 9999 };
  assert.ok(g.world.placement(house, p.x, p.y, 0).valid);
});

test('Q1 : plan pur et reproductible — mêmes entrées, même plan ; ni tirage, ni horloge ; reprise identique ; ancienne campagne inactive', () => {
  open('42');
  const plan = g.quarterDecor218.plan(), input = Q.inputOf(g), random = Math.random, state = g.random.state;
  Math.random = () => { throw Error('tirage interdit'); };
  let again; try { again = Q.layout(input); } finally { Math.random = random; }
  assert.equal(again.digest, plan.digest); assert.deepEqual(json(again), json(plan)); assert.equal(g.random.state, state);
  const snap = g.serialize().expansions127.modules.quarterDecor218; assert.deepEqual(snap, { version: 1, active: true, digest: plan.digest });
  // Reprise : même plan, mêmes corps, même empreinte.
  const d = json(g.serialize()); assert.equal(g.restoreSave(d), true);
  assert.equal(g.quarterDecor218.plan().digest, plan.digest); assert.deepEqual(json(Q.solids(g)), json(Q.bodiesOf(plan)));
  // Ancienne campagne sans bord (sauvegarde sans le module) : inactive, aucun corps, terrain intact.
  const old = json(g.serialize()); delete old.expansions127.modules.quarterDecor218;
  assert.equal(g.restoreSave(old), true); assert.equal(g.quarterDecor218.active(), false); assert.deepEqual(Q.solids(g), []);
  assert.ok(g.world.terrain217); assert.deepEqual(g.serialize().expansions127.modules.quarterDecor218, Q.initial());
  // Une nouvelle partie à région finie ensuite reste inactive.
  flat(); assert.equal(g.quarterDecor218.active(), false);
});

test('Q1 : validation de la forme sauvegardée', () => {
  const ok = { version: 1, active: true, digest: 'a1b2c3d4' };
  assert.deepEqual(Q.validate(ok, { frontier: { generation: 12 } }), ok);
  assert.deepEqual(Q.validate({ version: 1, active: true, digest: null }), { version: 1, active: true, digest: null });
  for (const bad of [null, [], { version: 2, active: true, digest: null }, { version: 1, active: 'oui', digest: null }, { version: 1, active: true }, { version: 1, active: true, digest: 'zz' }, { version: 1, active: false, digest: 'a1b2c3d4' }, { ...ok, extra: 1 }])
    assert.throws(() => Q.validate(bad), /Décor|Empreinte/, JSON.stringify(bad));
  assert.throws(() => Q.validate(ok, { frontier: { generation: 4 } }), /sans terrain/);
});

test('Q1 : peintres 2,5D et FPS sans stock, dégât, tirage ni horloge', () => {
  open('17117');
  // Contexte du jeu (harnais) : on compte les dessins sans rien changer d'autre.
  const calls = [], ctx = g.ctx, fill = ctx.fillRect; ctx.fillRect = function (...a) { calls.push('fillRect'); return fill.apply(this, a); };
  const before = json({ resources: g.resources, elapsed: g.elapsed, random: g.random.state, zombies: g.zombies.length, nodes: g.world.nodes.map(n => n.amount) });
  const view = { left: 0, top: 0, right: g.local.size, bottom: g.local.size };
  const random = Math.random; Math.random = () => { throw Error('tirage interdit'); };
  try {
    g.drawGround(ctx, view); const entries = g.depthEntries(view), mine = entries.filter(e => e.id > 218000 && e.id < 219000 && typeof e.draw === 'function');
    assert.equal(mine.length, g.quarterDecor218.plan().pieces); for (const e of mine) e.draw(ctx);
    for (let k = 1; k < entries.length; k++) assert.ok(entries[k - 1].depth <= entries[k].depth, 'file triée');
  } finally { Math.random = random; ctx.fillRect = fill; }
  assert.ok(calls.includes('fillRect'));
  const boxes = Q.boxesFor(g, globalThis.DeadwallTerrainFPS217);
  assert.ok(boxes.length > g.quarterDecor218.plan().pieces);
  for (const { box, tint } of boxes) { assert.ok(['x', 'y', 'z', 'w', 'h', 'd'].every(k => Number.isFinite(box[k])) && box.w > 0 && box.h > 0 && box.d > 0); assert.ok(tint.every(Number.isFinite)); }
  assert.equal(Q.boxesFor(g, globalThis.DeadwallTerrainFPS217), boxes, 'boîtes gardées par plan');
  assert.deepEqual(json({ resources: g.resources, elapsed: g.elapsed, random: g.random.state, zombies: g.zombies.length, nodes: g.world.nodes.map(n => n.amount) }), before);
  const ov = g.expansions.get('quarterDecor218').overview(); assert.equal(ov.rows.length, 6); assert.match(ov.summary, /parcelles/);
});
