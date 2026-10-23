'use strict';
// A source refresh must not silently erase an author's workbook edits.
const GITHUB = 'https://github.com/darknigthmare/deadwall-last-enclosure';
function proofPath(value) {
  const text = value || '';
  if (text.startsWith(GITHUB + '/blob/')) {
    const marker = text.indexOf('/docs/codex/');
    if (marker >= 0) return text.slice(marker + 1);
  }
  return text;
}
function task(row, expected, managedProofs) {
  const status = row[6], owner = row[7], proof = proofPath(row[9]);
  const rank = ['À faire', 'En cours', 'Validé'];
  if (!rank.includes(status) || rank.indexOf(status) > rank.indexOf(expected.status)
      || !['Non affecté', 'Production Codex', expected.owner].includes(owner)
      || status === 'À faire' && proof
      || status !== 'À faire' && proof !== expected.evidence && !managedProofs.has(proof)
      || status === 'Validé' && proof !== expected.evidence) {
    throw Error('Édition du classeur conservée : ' + expected.id);
  }
}
function variant(row, expected) {
  const allowed = ['À concevoir', 'Gabarit métrique', 'Avant-projet maritime', 'Avant-projet terrestre', 'Inspection physique'];
  if (!allowed.includes(row[5]) || row[9] !== (expected.playable ? 'Oui' : 'Non')
      || row[5] === 'Inspection physique' && expected.status !== 'Inspection physique'
      || row[8] !== 'À équilibrer' && row[8] !== expected.spawnWeight) {
    throw Error('Édition du classeur conservée : ' + expected.id);
  }
}
module.exports = {proofPath, task, variant};
