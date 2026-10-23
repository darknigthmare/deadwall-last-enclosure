'use strict';
// Dimensions are authored assumptions. Inspection alone never validates the
// dimensions/reference stage or a campaign implementation.
const Registry = require('./codex-generators2026.cjs');
function groups(registry = Registry) {
  return registry.generators().filter(spec => spec.proof).map(spec => {
    if (!/^docs\/codex\/suivi-monde2026\/[A-Z_0-9]+\.md$/.test(spec.proof)) throw Error('Preuve auteur invalide : ' + spec.path);
    return {...spec, source: spec.path};
  });
}
function unique(records, id, label) {
  const matches = records.filter(record => record.id === id);
  if (matches.length !== 1) throw Error(label + ' absent ou dupliqué : ' + id);
  return matches[0];
}
function patch(data, authorGroups = groups()) {
  const result = JSON.parse(JSON.stringify(data)), records = new Map();
  const changes = {inProgress: [], landVariants: [], closed: [], playableAdded: 0};
  for (const group of authorGroups) for (const type of group.types) {
    const plans = Array.from({length: Registry.VARIANTS_PER_TYPE}, (_, i) => group.api.build(type, i + 1));
    for (const plan of plans) {
      const verdict = group.api.audit(plan);
      if (!verdict.ok || plan.playable !== false || plan.type !== type || records.has(plan.id)) throw Error('Composition auteur invalide : ' + plan.id);
      records.set(plan.id, {group, plan});
    }
    const typology = unique(result.typologies, type, 'Typologie');
    if (!typology || !['À concevoir', 'Avant-projet terrestre'].includes(typology.status)) throw Error('Typologie modifiée ailleurs : ' + type);
    if (typology.status === 'À concevoir' && (typology.dimensions_m !== null || typology.referencePlan !== null)) throw Error('Typologie modifiée ailleurs : ' + type);
    if (typology.status === 'Avant-projet terrestre' && typology.referencePlan !== group.proof.split('/').pop()) throw Error('Typologie modifiée ailleurs : ' + type);
    typology.status = 'Avant-projet terrestre';
    typology.referencePlan = group.proof.split('/').pop();
    const range = get => [Math.min(...plans.map(get)), Math.max(...plans.map(get))];
    typology.dimensions_m = {widthRange: range(p => p.bounds.w), lengthRange: range(p => p.bounds.h),
      maxHeightRange: range(p => p.maxHeightM), unit: 'm', scope: 'choix de composition auteur ; dimensions réelles à documenter'};
    typology.scope = 'Parcelles, locaux et accès composés. Cotes auteur, raccords aux seeds et qualification de campagne encore ouverts.';
    for (const stage of ['dimensions', 'architecture']) {
      const task = unique(result.tasks, type + '/' + stage, 'Tâche');
      if (!task || !(task.status === 'À faire' && !task.evidence || task.status === 'En cours' && task.evidence === group.proof)) throw Error('Édition concurrente conservée : ' + type + '/' + stage);
      if (!['Non affecté', 'Production Codex'].includes(task.owner)) throw Error('Édition concurrente conservée : ' + task.id);
      task.status = 'En cours'; task.owner = 'Production Codex'; task.evidence = group.proof;
      changes.inProgress.push(task.id);
    }
  }
  for (const variant of result.variants) {
    const row = records.get(variant.id); if (!row) continue;
    const {group, plan} = row;
    if (!(variant.status === 'À concevoir' || variant.status === 'Avant-projet terrestre' && variant.evidence === group.proof)) throw Error('Variante modifiée ailleurs : ' + variant.id);
    if (variant.typologyId !== plan.type || variant.number !== plan.number || variant.playable !== false || variant.architecture !== null || variant.spawnWeight !== null || variant.status === 'À concevoir' && (variant.evidence || variant.dimensions_m !== null)) throw Error('Variante modifiée ailleurs : ' + variant.id);
    unique(result.variants, variant.id, 'Variante');
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
module.exports = {groups, patch};
