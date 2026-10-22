'use strict';
// Dimensions are authored assumptions. Inspection alone never validates the
// dimensions/reference stage or a campaign implementation.
const Agriculture = require('./codex-agriculture2026.cjs');
const Residential = require('./codex-residential2026.cjs');
const Industrial = require('./codex-industrial2026.cjs');
const GROUPS = Object.freeze([
  {api: Agriculture, source: 'scripts/codex-agriculture2026.cjs', proof: 'docs/codex/suivi-monde2026/AGRICULTURE_2026.md'},
  {api: Residential, source: 'scripts/codex-residential2026.cjs', proof: 'docs/codex/suivi-monde2026/RESIDENTIEL_2026.md'},
  {api: Industrial, source: 'scripts/codex-industrial2026.cjs', proof: 'docs/codex/suivi-monde2026/INDUSTRIE_2026.md'}
]);
function patch(data) {
  const result = JSON.parse(JSON.stringify(data)), records = new Map();
  const changes = {inProgress: [], landVariants: [], closed: [], playableAdded: 0};
  for (const group of GROUPS) for (const type of group.api.TYPES) {
    const plans = Array.from({length: 50}, (_, i) => group.api.build(type, i + 1));
    for (const plan of plans) {
      const verdict = group.api.audit(plan);
      if (!verdict.ok) throw Error('Composition terrestre invalide : ' + plan.id);
      records.set(plan.id, {group, plan});
    }
    const typology = result.typologies.find(t => t.id === type);
    if (!typology || !['À concevoir', 'Avant-projet terrestre'].includes(typology.status)) throw Error('Typologie modifiée ailleurs : ' + type);
    typology.status = 'Avant-projet terrestre';
    typology.referencePlan = group.proof.split('/').pop();
    const range = get => [Math.min(...plans.map(get)), Math.max(...plans.map(get))];
    typology.dimensions_m = {widthRange: range(p => p.bounds.w), lengthRange: range(p => p.bounds.h),
      maxHeightRange: range(p => p.maxHeightM), unit: 'm', scope: 'choix de composition auteur ; dimensions réelles à documenter'};
    typology.scope = 'Parcelles, locaux et accès composés. Cotes auteur, raccords aux seeds et qualification de campagne encore ouverts.';
    for (const stage of ['dimensions', 'architecture']) {
      const task = result.tasks.find(t => t.id === type + '/' + stage);
      if (!task || !(task.status === 'À faire' && !task.evidence || task.status === 'En cours' && task.evidence === group.proof)) throw Error('Édition concurrente conservée : ' + type + '/' + stage);
      task.status = 'En cours'; task.owner = 'Production Codex'; task.evidence = group.proof;
      changes.inProgress.push(task.id);
    }
  }
  for (const variant of result.variants) {
    const row = records.get(variant.id); if (!row) continue;
    const {group, plan} = row;
    if (!(variant.status === 'À concevoir' || variant.status === 'Avant-projet terrestre' && variant.evidence === group.proof)) throw Error('Variante modifiée ailleurs : ' + variant.id);
    variant.status = 'Avant-projet terrestre';
    variant.dimensions_m = {width: plan.bounds.w, length: plan.bounds.h, height: plan.maxHeightM, unit: 'm', heightOrigin: 'author-design'};
    variant.metricDraft = {generator: group.source, type: plan.type, number: plan.number, scope: plan.scope};
    variant.architecture = null; variant.playable = false; variant.spawnWeight = null; variant.evidence = group.proof;
    variant.note = 'Composition auteur de pièces, cours et parcelles. Les cotes réelles, raccords aux réseaux, stocks et services restent à qualifier.';
    changes.landVariants.push(variant.id);
  }
  if (changes.landVariants.length !== records.size) throw Error('Variantes terrestres absentes ou dupliquées.');
  return {data: result, changes};
}
module.exports = {GROUPS, patch};
