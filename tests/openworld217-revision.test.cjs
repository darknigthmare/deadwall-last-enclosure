'use strict';
// D-O4 tranché « le visité reste » (specs/monde-sans-bord/ouverture.md, section 3 ; tasks.md, O9 D-O4) : une campagne sans
// bord créée sous une révision du générateur et reprise sous une autre garde ses cantons vus et sa cité à l'identique (moteur
// de la révision d'origine conservé côte à côte, choisi canton par canton) ; seuls les cantons jamais vus suivent le
// générateur courant. Sauvegarde : bornes d'époques seulement. Couture entre révisions : marche d'un cran = rampe.
// La campagne d'origine est jouée de bout en bout dans un processus enfant sous une révision SIMULÉE (règles de relief
// modifiées, tests/helpers/open-engine217.cjs) ; elle note ce qu'elle a montré (cité, cantons vus). Le jeu de ce processus,
// à la révision courante, la reprend.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const H = require('./helpers/open-engine217.cjs');

const SEED = 17117, EXTRA = ['K1_1', 'K-1_0', 'K2_0', 'K0_1'];
const child = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'helpers', 'open-revision217-child.cjs'), String(SEED), EXTRA.join(',')], { cwd: path.resolve(__dirname, '..'), maxBuffer: 64 << 20 }).toString());
const { g } = bootDocument134();
const C = globalThis.DeadwallCore, O = globalThis.DeadwallOpenWorld217, K = globalThis.DeadwallWorldCantons217, S = globalThis.DeadwallWorldSites217;
const Gen = globalThis.DeadwallWorldCantonGen217, L = globalThis.DeadwallWorldLocal217;
const E = H.load();
const notes = []; { const n = g.notify.bind(g); g.notify = (t, k) => { notes.push(String(t)); return n(t, k); }; }
const copy = x => JSON.parse(JSON.stringify(x));
const strip = d => { const c = copy(d); delete c.timestamp; return c; };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };
const steps = n => { for (let i = 0; i < n; i++) g.update(1 / 30); };
const bytes = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
// Champs d'un lieu tirés de sa distance à D-17 (bande, occupation) : ceux d'un canton jamais vu se mesurent depuis la cité
// réelle de la campagne (gardée), et non depuis celle qu'aurait une campagne neuve.
const placeShape = list => JSON.stringify(list.map(p => { const q = copy(p); delete q.distanceBand; delete q.occupation; delete q.frontier131; return q; }));

test('D-O4 : règles gelées, moteur de révision enregistré côte à côte, refus d’un moteur incomplet ou déjà connu', () => {
  const R = C.WorldRevision217Rules; assert.ok(Object.isFrozen(R) && Object.isFrozen(R.seam));
  assert.deepEqual(copy(R), { version: 1, maxEras: 16, seam: { ramp: 1 } });
  assert.deepEqual(child.revision, { ...O.revision(), canton: O.revision().canton - 1, relief: O.revision().relief - 1 }, 'campagne d’origine sous une autre révision');
  assert.deepEqual(copy(E.revision), child.revision);
  assert.equal(O.engines.has(E.revision), false); assert.equal(O.engines.register(E), true); assert.equal(O.engines.has(E.revision), true);
  assert.throws(() => O.engines.register(E), /déjà connu/);
  assert.throws(() => O.engines.register({ ...E, revision: O.revision() }), /déjà connu/, 'le moteur courant ne s’enregistre pas');
  assert.throws(() => O.engines.register({ ...E, revision: { ...E.revision, canton: 1 }, Local: {} }), /incomplet/);
  assert.throws(() => O.engines.register({ ...E, revision: { ...E.revision, open: 0 } }), /invalide/);
  assert.deepEqual(O.engines.keys(), [Object.values(E.revision).join('.')]);
});

test('D-O4 : reprise sous la révision courante — cité et cantons vus identiques octet pour octet, cantons non vus régénérés', () => {
  const save = copy(child.save), seen = save.frontier.cantons;
  assert.deepEqual(seen.slice(0, 1), ['K0_0']); for (const id of EXTRA) assert.ok(seen.includes(id), id);
  notes.length = 0; assert.equal(g.restoreSave(copy(save)), true);
  assert.equal(g.openWorld217.revised(), true); assert.equal(g.openWorld217.kept(), true);
  assert.ok(notes.includes(O.KEPT_TEXT), notes.join(' | ')); assert.match(O.KEPT_TEXT, /^Monde révisé/);
  assert.deepEqual(g.openWorld217.binding(), { key: O.bindingKey(SEED), kept: seen.length, city: true, missing: [] });
  // Cité : carte locale de la révision d'origine (même empreinte, mêmes octets), différente de celle du générateur courant.
  const t = g.world.terrain217, own = E.Local.describe(SEED), now = L.describe(SEED);
  assert.equal(t.digest, child.city.digest); assert.equal(hash(Array.from(t.levels).join(',')), child.city.levels); assert.equal(hash(Array.from(t.roads).join(',')), child.city.roads);
  for (const k of ['levels', 'passes', 'water', 'roads', 'kinds']) assert.ok(bytes(t[k]).equals(bytes(own[k])), k);
  assert.notEqual(now.digest, own.digest, 'la révision courante bâtirait une autre cité');
  assert.deepEqual({ x: g.core().x, y: g.core().y }, child.city.core);
  assert.deepEqual({ ...O.home(SEED) }, child.home); assert.deepEqual({ ...globalThis.DeadwallAtlasProjection.home(g) }, child.home);
  // Monde régional : chaque canton vu (relief, routes, lieux, arbres et rochers) tel que la campagne d'origine l'a montré.
  const w = g.frontier.world(), live = S.create(SEED, {});
  assert.equal(w.binding217, O.bindingKey(SEED)); assert.deepEqual({ ...w.home }, child.home);
  let differ = 0;
  for (const id of seen) {
    const p = K.parse(id), c = w.canton(p.cx, p.cy), chunks = [];
    for (let j = 0; j < 16; j++) chunks.push(w.chunk(p.cx * 4 + j % 4, p.cy * 4 + (j >> 2)));
    assert.deepEqual({ digest: c.digest, places: hash(JSON.stringify(w.placesOf(p.cx, p.cy))), scenery: hash(JSON.stringify(chunks)) }, child.cantons[id], id);
    for (const k of ['levels', 'water', 'passes', 'biomes']) assert.ok(bytes(c[k]).equals(bytes(E.Gen.generate(SEED, p.cx, p.cy)[k])), id + ' ' + k);
    if (c.digest !== Gen.generate(SEED, p.cx, p.cy).digest) differ++;
  }
  assert.equal(differ, seen.length, 'la révision courante aurait changé chaque canton vu');
  // Cantons jamais vus : générateur courant (même canton, mêmes lieux hors distance à D-17, mêmes arbres et rochers).
  const unseen = []; for (let cy = -2; cy <= 2; cy++) for (let cx = -2; cx <= 3; cx++) if (!seen.includes(K.id(cx, cy))) unseen.push([cx, cy]);
  assert.ok(unseen.length >= 20);
  for (const [cx, cy] of unseen) {
    const c = w.canton(cx, cy); assert.equal(c.digest, Gen.generate(SEED, cx, cy).digest, K.id(cx, cy));
    assert.notEqual(c.digest, E.Gen.generate(SEED, cx, cy).digest);
    assert.equal(placeShape(w.placesOf(cx, cy)), placeShape(live.placesOf(cx, cy)), K.id(cx, cy));
  }
  steps(30); g.render(); g.renderMinimap();
});

test('D-O4 : sauvegarde creuse et bornée — une époque, reprise identique, canton vu ensuite resté à la révision courante', () => {
  const save = copy(child.save), n = save.frontier.cantons.length;
  assert.equal(g.restoreSave(copy(save)), true);
  const snap = g.openWorld217.snapshot();
  assert.deepEqual(snap, { version: 2, active: true, revision: child.revision, eras: [{ revision: O.revision(), from: n }] });
  const d = g.serialize(); assert.deepEqual(d.expansions127.modules.openworld217, snap);
  assert.ok(JSON.stringify(snap).length < 200, 'quelques octets : ' + JSON.stringify(snap).length);
  // Reprise de la sauvegarde écrite sous la révision courante : même document, même liaison.
  const key = O.bindingKey(SEED); notes.length = 0;
  assert.equal(g.restoreSave(globalThis.DeadwallSave.parse(JSON.stringify(d))), true); assert.deepEqual(strip(g.serialize()), strip(d));
  assert.equal(O.bindingKey(SEED), key); assert.ok(notes.includes(O.KEPT_TEXT));
  // Un canton vu après la reprise (rang ≥ from) est de la révision courante ; les anciens restent gardés.
  const later = copy(d); later.frontier.cantons.push('K3_0');
  assert.equal(g.restoreSave(later), true); assert.deepEqual(g.openWorld217.snapshot().eras, [{ revision: O.revision(), from: n }]);
  const w = g.frontier.world(); assert.equal(w.canton(3, 0).digest, Gen.generate(SEED, 3, 0).digest);
  assert.equal(w.canton(2, 0).digest, child.cantons.K2_0.digest); assert.equal(g.openWorld217.binding().kept, n);
  // Taille : 60 cantons vus ne changent rien à la marque (bornes seules) ; le registre ne garde que leurs identifiants.
  const many = copy(d); for (let i = 0; many.frontier.cantons.length < 60; i++) { const id = K.id(4 + i % 8, Math.floor(i / 8) - 3); if (!many.frontier.cantons.includes(id)) many.frontier.cantons.push(id); }
  assert.equal(g.restoreSave(many), true); const big = g.serialize();
  assert.equal(JSON.stringify(big.expansions127.modules.openworld217), JSON.stringify(snap));
  assert.equal(big.frontier.cantons.length, 60);
});

test('D-O4 : couture entre un canton gardé et un canton régénéré — une marche d’un cran est une rampe, routes jointes', () => {
  assert.equal(g.restoreSave(copy(child.save)), true);
  const w = g.frontier.world(), seen = new Set(g.frontier.snapshot().cantons), SIZE = K.SIZE, N = Gen.CELLS;
  let seams = 0, ramps = 0, roads = 0;
  for (const id of seen) {
    const p = K.parse(id);
    for (const [dx, dy, axis] of [[1, 0, 'v'], [0, 1, 'h'], [-1, 0, 'v'], [0, -1, 'h']]) {
      const q = K.id(p.cx + dx, p.cy + dy); if (seen.has(q)) continue; seams++;
      const a = dx + dy > 0 ? p : K.parse(q), b = dx + dy > 0 ? K.parse(q) : p, A = w.canton(a.cx, a.cy), B = w.canton(b.cx, b.cy);
      const line = axis === 'v' ? (b.cx) * SIZE : (b.cy) * SIZE;
      const edges = axis === 'v' ? w.edgesIn(line - 1, a.cy * SIZE, line + 1, a.cy * SIZE + SIZE - 1) : w.edgesIn(a.cx * SIZE, line - 1, a.cx * SIZE + SIZE - 1, line + 1);
      for (let k = 0; k < N; k++) {
        const i = axis === 'v' ? k * N + N - 1 : (N - 1) * N + k, j = axis === 'v' ? k * N : k, la = A.levels[i], lb = B.levels[j];
        if (la === lb) continue; const pass = A.passes[i] >> (axis === 'v' ? 0 : 1) & 1;
        const e = edges.find(x => x.axis === axis && (axis === 'v' ? x.a.x === line && x.gy === a.cy * N + k : x.a.y === line && x.gx === a.cx * N + k));
        assert.ok(e, id + ' arête ' + k);
        const want = pass ? 'ramp' : la > 0 && lb > 0 && Math.abs(la - lb) <= C.WorldRevision217Rules.seam.ramp ? 'ramp' : (la === 0 || lb === 0) && Math.abs(la - lb) === 1 ? 'shore' : 'cliff';
        assert.equal(e.kind, want, id + '→' + q + ' ' + k); if (!pass && want === 'ramp') ramps++;
      }
      // La couture garde un passage routier des deux côtés (même identifiant de couture).
      const seam = axis === 'v' ? 'Kv' + b.cx + '_' + a.cy : 'Kh' + a.cx + '_' + b.cy;
      if (A.roads.some(r => r.from === seam) && B.roads.some(r => r.from === seam)) roads++;
    }
  }
  assert.ok(seams >= 8 && ramps > 0 && roads > 0, JSON.stringify({ seams, ramps, roads }));
  // Monde courant sans liaison : une rampe n'est qu'un col du générateur (aucune rampe de raccord).
  const plain = S.create(SEED, {});
  for (const e of plain.edgesIn(SIZE - 1, 0, SIZE + 1, SIZE - 1)) if (e.axis === 'v' && e.a.x === SIZE && e.gy < N) assert.equal(e.kind === 'ramp', !!(plain.canton(0, 0).passes[e.gy * N + N - 1] & 1), 'rampe = col du générateur');
});

test('D-O4 : révision d’origine absente de cette version — repli signalé, tout le monde régional au générateur courant', () => {
  const save = copy(child.save); save.expansions127.modules.openworld217.revision.sites = 7;
  notes.length = 0; assert.equal(g.restoreSave(save), true);
  assert.equal(g.openWorld217.revised(), true); assert.equal(g.openWorld217.kept(), false);
  assert.ok(notes.some(t => t.startsWith(O.REVISED_TEXT) && /Révision d’origine absente/.test(t)), notes.join(' | '));
  assert.deepEqual(g.openWorld217.binding().missing, [Object.values({ ...child.revision, sites: 7 }).join('.')]);
  assert.equal(O.bindingKey(SEED), null); assert.equal(g.frontier.world().binding217, null);
  assert.equal(g.world.terrain217.digest, L.describe(SEED).digest, 'cité du générateur courant (comportement d’O9)');
  assert.equal(g.frontier.world().canton(2, 0).digest, Gen.generate(SEED, 2, 0).digest);
  assert.ok(g.openWorld217.overview().rows.some(r => /monde révisé/.test(r.value)));
  // Retour à une campagne neuve : aucune liaison, monde courant.
  assert.notEqual(g.startNew('standard', String(SEED), 'classic', 'balanced', true, undefined, true), false); g.campaignIntro132?.skip?.();
  assert.equal(g.openWorld217.binding(), null); assert.equal(g.openWorld217.revised(), false); assert.deepEqual(g.openWorld217.snapshot(), O.fresh());
  assert.equal(g.world.terrain217.digest, L.describe(SEED).digest); assert.equal(g.frontier.world().binding217, null);
});

test('D-O4 : époques — validation stricte, époque vide remplacée, retour à la révision précédente, plafond', () => {
  const cur = O.revision(), old = { ...child.revision }, other = { ...cur, local: cur.local + 5 }, full = n => ({ frontier: { generation: 12, cantons: Array.from({ length: n }, (_, i) => K.id(i, 0)) } });
  const v1 = { version: 1, active: true, revision: old };
  assert.deepEqual(O.validate(v1, full(3)), v1, 'forme 1 inchangée');
  const v2 = O.advance(v1, 3); assert.deepEqual(v2, { version: 2, active: true, revision: old, eras: [{ revision: cur, from: 3 }] });
  assert.deepEqual(O.validate(v2, full(3)), v2); assert.deepEqual(O.advance(v2, 5), v2, 'même révision : rien ne change');
  // Époque vide (aucun canton vu depuis la reprise) reprise sous une autre révision : remplacée ; retour à l'origine : retirée.
  assert.deepEqual(O.advance({ ...v2, eras: [{ revision: other, from: 3 }] }, 3), v2);
  assert.deepEqual(O.advance({ version: 2, active: true, revision: cur, eras: [{ revision: other, from: 2 }] }, 2), { version: 1, active: true, revision: cur });
  assert.deepEqual(O.advance({ ...v2, eras: [{ revision: other, from: 3 }] }, 4).eras, [{ revision: other, from: 3 }, { revision: cur, from: 4 }]);
  for (const bad of [
    { ...v2, eras: [] }, { ...v2, eras: [{ revision: cur, from: 0 }] }, { ...v2, eras: [{ revision: old, from: 2 }] },
    { ...v2, eras: [{ revision: other, from: 2 }, { revision: cur, from: 2 }] }, { ...v2, eras: [{ revision: cur, from: 2, x: 1 }] },
    { ...v2, eras: [{ revision: { ...cur, open: 0 }, from: 2 }] }, { ...v2, extra: 1 }, { version: 2, active: false, revision: null, eras: [] }
  ]) assert.throws(() => O.validate(bad, full(3)), /invalide/, JSON.stringify(bad));
  assert.throws(() => O.validate(v2, full(2)), /au-delà des cantons vus/);
  const many = { version: 2, active: true, revision: old, eras: Array.from({ length: C.WorldRevision217Rules.maxEras }, (_, i) => ({ revision: i % 2 ? other : cur, from: i + 1 })) };
  assert.deepEqual(O.validate(many, full(20)), many); assert.throws(() => O.validate({ ...many, eras: [...many.eras, { revision: old, from: 17 }] }, full(20)), /invalide/);
  assert.deepEqual(O.advance(many, 18), many, 'plafond : aucune époque ajoutée');
  // Liaison : cantons rangés par époque ; révision courante = rien de lié.
  const link = O.bind(O.advance(v1, 2), ['K0_0', 'K1_0', 'K2_0'], SEED);
  assert.deepEqual([...link.byCanton.keys()], ['K0_0', 'K1_0']); assert.ok(link.city); assert.equal(link.kept, 2);
  assert.equal(O.bind({ version: 1, active: true, revision: cur }, ['K0_0'], SEED), null);
  assert.equal(O.bind(O.initial(), ['K0_0'], SEED), null);
});
