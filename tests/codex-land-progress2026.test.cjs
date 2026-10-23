'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const Targets = require('../scripts/codex-tracker-targets2026.cjs');
const Land = require('../scripts/codex-land-progress2026.cjs');
const type = 'EXT-MONDE-T001', proof = 'docs/codex/suivi-monde2026/LACUSTRE_2026.md';
const group = {source: 'scripts/codex-lacustre2026.cjs', proof, types: [type], api: {
  build: (id, number) => ({id: id + '-V' + String(number).padStart(2, '0'), type: id, number,
    bounds: {w: 100 + number, h: 120}, maxHeightM: 6, playable: false, scope: 'author-metric-layout-not-live-world'}),
  audit: () => ({ok: true}),
}};
test('le registre sélectionne les familles auteur par leur preuve, sans seconde liste de types', () => {
  const registry = {generators: () => [{...group, path: group.source}, {path: 'legacy.cjs', types: ['OTHER']} ]};
  assert.deepEqual(Land.groups(registry).map(g => [g.source, g.types, g.proof]), [[group.source, [type], proof]]);
  assert.throws(() => Land.groups({generators: () => [{...group, path: group.source, proof: '../foreign.md'}]}), /Preuve auteur invalide/);
});
test('un avant-projet ne valide aucune étape et préserve les autres types et son entrée', () => {
  const input = Targets.generate(), before = JSON.stringify(input), out = Land.patch(input, [group]);
  assert.equal(JSON.stringify(input), before);
  assert.equal(out.changes.landVariants.length, 50);
  assert.equal(out.changes.inProgress.length, 2);
  assert.equal(out.changes.closed.length, 0);
  assert.deepEqual(Land.patch(out.data, [group]), out);
  for (const v of out.data.variants.filter(v => v.typologyId === type)) {
    assert.equal(v.playable, false); assert.equal(v.architecture, null); assert.equal(v.spawnWeight, null);
    assert.equal(v.dimensions_m.heightOrigin, 'author-design');
  }
  assert.deepEqual(out.data.variants.filter(v => v.typologyId !== type), input.variants.filter(v => v.typologyId !== type));
});
test('preuves, affectations et données de conception concurrentes ne sont pas écrasées', () => {
  const edits = [
    d => {d.tasks[0].evidence = 'travail-autre.md';},
    d => {d.tasks[0].owner = 'Équipe art';},
    d => {d.tasks[0].status = 'Validé';},
    d => {d.variants[0].playable = true;},
    d => {d.variants[0].architecture = {complete: true};},
    d => {d.variants[0].dimensions_m = {height: 8};},
    d => {d.typologies[0].referencePlan = 'autre.md';},
  ];
  for (const edit of edits) {
    const d = Targets.generate(); edit(d); const before = JSON.stringify(d);
    assert.throws(() => Land.patch(d, [group]), /concurrente|modifiée ailleurs/);
    assert.equal(JSON.stringify(d), before);
  }
});
test('identifiants cibles manquants ou dupliqués refusés', () => {
  for (const field of ['typologies', 'tasks', 'variants']) {
    for (const duplicate of [true, false]) {
      const d = Targets.generate();
      if (duplicate) d[field].push({...d[field][0]}); else d[field].shift();
      assert.throws(() => Land.patch(d, [group]), /absent|dupliqu/);
    }
  }
});
