'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const Guards = require('../scripts/codex-tracker-xlsx-guards2026.cjs');
const proof = 'docs/codex/suivi-monde2026/INSPECTION_PHYSIQUE_2026.md';
const previous = 'docs/codex/suivi-monde2026/LACUSTRE_2026.md';
const expected = {id: 'EXT-MONDE-T001/architecture', status: 'En cours', owner: 'Production Codex', evidence: proof};
const row = () => [expected.id, '', '', '', '', '', 'À faire', 'Non affecté', '', ''];
test('un ancien état géré peut progresser ; preuves sur branche ou commit sont reconnues', () => {
  const proofs = new Set([previous, proof]);
  Guards.task(row(), expected, proofs);
  for (const ref of ['feat/codex-world-extension-20261021', '7ec448a552c6ad65cc3b167e9e4974d7f8772585']) {
    const r = row(); r[6] = 'En cours'; r[7] = 'Production Codex';
    r[9] = 'https://github.com/darknigthmare/deadwall-last-enclosure/blob/' + ref + '/' + previous;
    Guards.task(r, expected, proofs);
  }
});
test('ni validation, ni preuve, ni affectation manuelles ne sont écrasées', () => {
  for (const edit of [r => {r[6] = 'Validé';}, r => {r[7] = 'Artiste';}, r => {r[9] = 'note personnelle';},
    r => {r[6] = 'En cours'; r[9] = 'https://example.com/' + previous;}]) {
    const r = row(); edit(r); const before = JSON.stringify(r);
    assert.throws(() => Guards.task(r, expected, new Set([previous, proof])), /conservée/);
    assert.equal(JSON.stringify(r), before);
  }
});
test('les paramètres de campagne ou états externes des variantes sont conservés par refus', () => {
  const v = {id: 'EXT-MONDE-T001-V01', playable: false, status: 'Inspection physique', spawnWeight: null};
  const r = ['', '', '', '', 1, 'À concevoir', '', '', 'À équilibrer', 'Non'];
  Guards.variant(r, v);
  for (const [index, value] of [[5, 'Travail externe'], [8, 12], [9, 'Oui']]) {
    const changed = [...r]; changed[index] = value;
    assert.throws(() => Guards.variant(changed, v), /conservée/);
  }
});
