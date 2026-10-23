import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The managed runtime already supplies the spreadsheet engine. Resolve it
// there when this repository has no local dependency; no installation needed.
let artifactTools;
try {
  artifactTools = await import('@oai/artifact-tool');
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND' || !process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  const runtimeRequire = createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'codex-artifact-loader.cjs'));
  artifactTools = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
}
const {FileBlob, SpreadsheetFile} = artifactTools;

// Run with the bundled primary Node runtime from a temporary directory whose
// node_modules link targets CODEX_PRIMARY_RUNTIME_NODE_MODULES. The committed
// workbook is the layout template; source data are derived from currentData.
const args = process.argv.slice(2);
function option(name, fallback) {
  const i = args.indexOf('--' + name);
  if (i < 0) return fallback;
  if (i + 1 >= args.length || args[i + 1].startsWith('--')) throw Error('Valeur manquante : ' + name);
  return args[i + 1];
}
const root = path.resolve(option('root', path.join(path.dirname(fileURLToPath(import.meta.url)), '..')));
const relative = 'docs/codex/suivi-monde2026/DEADWALL_CODEX_MONDE_SUIVI.xlsx';
const input = path.resolve(option('input', path.join(root, relative)));
const output = path.resolve(option('output', path.join(root, relative)));
const proofDir = path.resolve(option('proof-dir', path.join(root, 'artifacts/qa/codex-tracker-xlsx2026')));
const metaPath = option('metadata', '');
const meta = metaPath ? JSON.parse(await fs.readFile(path.resolve(metaPath), 'utf8')) : {};
const ref = option('ref', /^[0-9a-f]{40}$/i.test(meta.sourceCommit || '') ? meta.sourceCommit : 'feat/codex-world-extension-20261021');
const req = createRequire(path.join(root, 'package.json'));
const Guards = req('./scripts/codex-tracker-xlsx-guards2026.cjs');
const Registry = req('./scripts/codex-generators2026.cjs');
const managedProofs = new Set([
  req('./scripts/codex-progress2026.cjs').PROOF + '#dimensions-auteur-validees',
  req('./scripts/codex-progress2026.cjs').PROOF + '#architecture-encore-ouverte',
  req('./scripts/codex-progress2026.cjs').PROOF + '#navires-cotes-partielles',
  req('./scripts/codex-maritime-progress2026.cjs').PROOF,
  req('./scripts/codex-inspection-progress2026.cjs').PROOF,
  ...Registry.SPECS.map(spec => spec.proof).filter(Boolean),
]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function fileHash(file) {
  try { return digest(await fs.readFile(file)); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
const inputHash = await fileHash(input), outputHash = input === output ? inputHash : await fileHash(output);
if (!inputHash) throw Error('Classeur source absent : ' + input);
async function unchanged(file, hash, label) {
  if (await fileHash(file) !== hash) throw Error(label + ' a changé pendant la génération du classeur.');
}
const data = req('./scripts/build-codex-tracker2026.cjs').currentData(root);
const typesById = new Map(data.typologies.map(t => [t.id, t]));
const summary = req('./scripts/validate-codex-tracker2026.cjs').validate(data);
const inspectionModule = req('./scripts/codex-inspection-progress2026.cjs');
const inspectionReport = inspectionModule.checkedReport(root).report;
const inspectionReportSha256 = createHash('sha256').update(await fs.readFile(path.join(root, inspectionModule.REPORT))).digest('hex');
const github = 'https://github.com/darknigthmare/deadwall-last-enclosure';
const source = value => !value ? '' : /^https?:\/\//.test(value) ? value : github + '/blob/' + ref + '/' + value;
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
const sheet = name => workbook.worksheets.getItem(name);
const asText = value => value === null || value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value);
function stableRows(name, key, records, map, width, guard) {
  const tab = sheet(name);
  const ids = tab.getRange(`A6:A${records.length + 5}`).values.map(row => row[0]);
  const sourceMap = new Map(records.map(record => [record[key], record]));
  if (ids.length !== sourceMap.size || new Set(ids).size !== sourceMap.size || ids.some(id => !sourceMap.has(id))) {
    throw Error('Identifiants du classeur différents des sources : ' + name);
  }
  const ordered = ids.map(id => sourceMap.get(id));
  if (guard) {
    const previous = tab.getRangeByIndexes(5, 0, records.length, width).values;
    for (const [index, record] of ordered.entries()) guard(previous[index], record);
  }
  tab.getRangeByIndexes(5, 0, records.length, width).values = ordered.map(map);
  return ordered;
}
function dimensions(d, scope = d?.scope) {
  if (!d) return 'À rechercher';
  const provenance = scope ? ` ; ${scope}` : '';
  if (d.lengthRange && d.widthRange) {
    return `Emprise ${d.lengthRange.join('–')} × ${d.widthRange.join('–')} m ; hauteur ${(d.maxHeightRange || []).join('–')} m${provenance}.`;
  }
  const parts = [];
  if (d.length !== undefined) parts.push('L ' + d.length);
  if (d.width !== undefined) parts.push('l ' + d.width);
  if (d.height !== undefined) parts.push('hauteur ' + (d.height === null ? 'inconnue' : d.height));
  if (d.draft !== undefined) parts.push('tirant ' + d.draft);
  if (d.authorAirDraft !== undefined) parts.push('hauteur émergée auteur ' + d.authorAirDraft);
  return parts.length ? parts.join(' ; ') + ' m' + provenance : asText(d);
}
function architecture(v) {
  if (v.inspection) return `${v.inspection.levels} niveaux ; ${v.inspection.rooms} pièces ; ${v.inspection.walls} segments de mur ; ${v.inspection.transitions} transitions. Inspection physique ; architecture complète encore ouverte.`;
  if (v.architecture) return asText(v.architecture);
  if (v.maritimeDraft) return `${v.maritimeDraft.levels} niveaux ; ${v.maritimeDraft.compartments} compartiments. ${v.maritimeDraft.scope}`;
  if (v.metricDraft) return 'Composition métrique auteur ; architecture ouverte';
  return 'À définir';
}

stableRows('Catalogue existant', 'id', data.catalogue.programmes, p => [
  p.id, p.parent, p.origin, p.family, p.name, p.generation, p.sourceRooms,
  p.authoredProps + p.authoredSlots, p.qualification, source(p.source),
  `Source min ${p.reference?.min || '?'} m ; max ${p.reference?.max || '?'} m ; modèle ${p.model.w} × ${p.model.h} m ; niveaux ${(p.model.levels || []).join(', ')}. Détails dans catalogue-existant.json.`,
], 11);
const typologyRows = stableRows('Extension typologies', 'id', data.typologies, t => [
  t.id, t.domain, t.name, t.targetVariants, t.status, t.requiredSpaces.join('; '),
  t.requiredNetworks.join('; '), t.placementRule, dimensions(t.dimensions_m),
  t.referencePlan ? source('docs/codex/suivi-monde2026/' + t.referencePlan) : 'À documenter', t.scope,
], 11);
const variantRows = stableRows('Variantes à concevoir', 'id', data.variants, v => [
  v.id, v.typologyId, v.domain, v.typology, v.number, v.status, architecture(v),
  v.dimensions_m ? dimensions(v.dimensions_m, typesById.get(v.typologyId)?.dimensions_m?.scope) : 'À sourcer',
  v.spawnWeight === null ? 'À équilibrer' : v.spawnWeight,
  v.playable ? 'Oui' : 'Non', v.note,
], 11, Guards.variant);
// These new plans carry dimensions chosen by the author, not documented real
// measurements. Keep that provenance readable in the existing narrow columns.
for (const [name, records] of [['Extension typologies', typologyRows], ['Variantes à concevoir', variantRows]]) {
  for (const [i, record] of records.entries()) {
    const scope = typesById.get(record.typologyId || record.id)?.dimensions_m?.scope || '';
    if (!scope.includes('choix de composition auteur')) continue;
    const row = sheet(name).getRangeByIndexes(i + 5, 0, 1, 11);
    row.format.wrapText = true;
    row.format.rowHeight = 96;
  }
}
sheet('Variantes à concevoir').getRange('F6:F4005').dataValidation = {rule: {type: 'list', values: ['À concevoir', 'Gabarit métrique', 'Avant-projet maritime', 'Inspection physique', 'À vérifier']}};
const legend = sheet('Légende');
const inspectionLegend = legend.getRange('A27').values[0][0];
if (inspectionLegend && inspectionLegend !== 'Inspection physique') throw Error('La légende a été modifiée à la ligne 27.');
if (!inspectionLegend) {
  legend.getRange('A27:B27').copyFrom(legend.getRange('A26:B26'), 'all');
  legend.getRange('A27:B27').values = [['Inspection physique', 'Espaces décrits, murs, accès, niveaux et mobilier contrôlés en mode auteur ; volumes réservés et intégration en campagne encore ouverts.']];
  legend.getRange('A27:B27').format.rowHeight = 60;
}
stableRows('Chantiers', 'id', data.tasks, t => [
  t.id, t.typologyId, t.domain, t.name, t.deliverable, t.priority,
  t.status, t.owner, t.acceptance, source(t.evidence),
], 10, (row, task) => Guards.task(row, task, managedProofs));

const home = sheet('Accueil');
home.getRange('A3').values = [[meta.subtitle || 'Base 1.68 · PR #16 · Suivi actualisé depuis les sources du dépôt']];
home.getRange('A9').values = [['Suivi de la PR #16. Conception, contrôles et intégration en campagne gardent des statuts distincts.']];
home.getRange('C13:C14').values = [[data.catalogue.rooms.length], [data.catalogue.props.length]];
home.getRange('D16').values = [['Critères propres à chaque tâche']];
home.getRange('G16').values = [['Gabarits / plans documentés']];
home.getRange('K16').formulas = [['=COUNTA(\'Variantes à concevoir\'!A6:A4005)-COUNTIF(\'Variantes à concevoir\'!F6:F4005,"À concevoir")']];
home.getRange('G17').values = [['Variantes à concevoir']];
home.getRange('K17').formulas = [['=COUNTIF(\'Variantes à concevoir\'!F6:F4005,"À concevoir")']];
home.getRange('G18').values = [['Variantes jouables validées']];
home.getRange('K18').formulas = [['=C18']];
home.getRange('A23').values = [[meta.summary || 'Les tâches sont actualisées depuis les sources et les preuves de la PR. Les champs Validé concernent uniquement leur livrable.']];
home.getRange('A26').values = [[meta.details || 'Compartiments maritimes et gabarits métriques conservent leurs limites. Les variantes ne sont pas qualifiées jouables sans intégration et contrôle de campagne.']];
home.getRange('A29').values = [[meta.remaining || 'Les tâches ouvertes gardent leurs identifiants, leurs critères de réception et leurs dépendances. Les objets décoratifs ne créent pas de ressources supplémentaires.']];
home.getRange('A32').values = [[meta.metrics || 'Cotes publiques, choix de conception et dimensions inconnues sont distingués. Le contrôle du classeur ne valide pas le jeu entier.']];
// The artifact calculation engine may miss an empty-string COUNTIFS criterion.
// SUMPRODUCT handles both real blanks and empty strings and stays editable.
home.getRange('C17').formulas = [['=SUMPRODUCT((Chantiers!G6:G805="Validé")*(Chantiers!J6:J805=""))']];

const publication = sheet('Publication');
publication.getRange('A2').values = [['L’archive source initiale de Drive reste un instantané historique. Les contrôles ci-dessous décrivent le lot de reprise de la PR #16.']];
if (meta.baseCommit || meta.baseVersion) {
  publication.getRange('B6:E6').values = [[meta.baseCheckedAt || '2026-10-21', 'main', meta.baseCommit || '', 'DEADWALL ' + (meta.baseVersion || '—') + ' conservé']];
}
publication.getRange('B7:E7').values = [[meta.sourceCommit || ref, 'PR #16', github + '/pull/16', 'Sources de la reprise']];
publication.getRange('B9:E9').values = [[meta.workbookState || 'Préparé localement', 'Fichier XLSX', relative, meta.workbookDetail || 'Publication à vérifier sur la PR']];
publication.getRange('B10:E10').values = [[meta.targetedTests || 'Voir les journaux du commit', 'Contrôles ciblés', meta.targetedDetail || 'Contrats et suivi vérifiés indépendamment de la campagne', 'Voir les preuves']];
publication.getRange('B11:E11').values = [[meta.globalCheck || 'À vérifier sur le commit', 'npm run check', meta.globalDetail || 'Le succès global exige un journal complet du commit livré.', meta.globalState || 'Voir les preuves']];
publication.getRange('B12:E12').values = [[data.variants.filter(v => v.playable).length, 'Architecture / campagne', meta.integration || 'Aucun statut jouable déduit de la présence du catalogue.', 'Qualification explicite']];
publication.getRange('B13:E13').values = [['Inchangée', 'Fusion / déploiement', 'Travail dans la PR #16. Fusion et déploiement distincts.', 'PR en cours']];

const refsPath = path.join(root, 'docs/codex/suivi-monde2026/references-metriques2026.json');
const refsFile = JSON.parse(await fs.readFile(refsPath, 'utf8'));
const refs = Array.isArray(refsFile) ? refsFile : refsFile.sources || refsFile.references;
if (Array.isArray(refs)) {
  const tab = sheet('Références métriques');
  const rows = refs.map(r => [r.id, r.title || r.name || '', r.url || '', r.checkedAt || r.accessed || r.accessedAt || '2026-10-21', r.scope || r.limitations || r.note || '']);
  if (rows.length) tab.getRangeByIndexes(5, 0, rows.length, 5).values = rows;
}

function outputSheet(name) {
  try { return sheet(name); } catch { return workbook.worksheets.add(name); }
}
function styleTable(tab, title, explanation, headers, count, tableName, previousCount = count) {
  const cols = headers.length;
  const last = String.fromCharCode(64 + cols);
  const existing = tab.tables.items.find(t => t.name === tableName);
  if (existing && previousCount > count) throw Error('Le nouveau rapport retirerait des typologies inspectées : ' + tableName);
  // Keep the native table, its name, filters and style while extending its
  // covered rows. Cell writes alone do not extend the exported Excel table.
  if (existing && previousCount < count) existing.rows.add(null, Array.from({length: count - previousCount}, () => Array(cols).fill(null)));
  tab.showGridLines = false;
  tab.getRangeByIndexes(0, 0, count + 5, cols).format.font = {name: 'Arial', size: 10, color: '#243E37'};
  tab.getRangeByIndexes(0, 0, count + 5, cols).format.verticalAlignment = 'center';
  tab.getRangeByIndexes(0, 0, count + 5, cols).format.rowHeight = 26;
  tab.getRangeByIndexes(0, 0, count + 5, cols).format.columnWidth = 17;
  tab.getRange('A1:' + last + '2').merge();
  tab.getRange('A1').values = [[title]];
  tab.getRange('A1:' + last + '2').format = {fill: '#254E43', font: {name: 'Arial', size: 16, color: '#FFFFFF', bold: true}};
  tab.getRange('A3:' + last + '3').merge();
  tab.getRange('A3').values = [[explanation]];
  tab.getRange('A3:' + last + '3').format.fill = '#E8F0EB';
  tab.getRangeByIndexes(4, 0, 1, cols).values = [headers];
  tab.getRangeByIndexes(4, 0, 1, cols).format = {fill: '#254E43', font: {name: 'Arial', size: 10, color: '#FFFFFF', bold: true}, rowHeight: 38, wrapText: true};
  tab.getRangeByIndexes(5, 0, count, cols).format.fill = '#F5F8F6';
  tab.getRangeByIndexes(5, 0, count, cols).format.rowHeight = 34;
  tab.getRangeByIndexes(5, 1, count, 1).format.wrapText = true;
  tab.getRangeByIndexes(0, 0, count + 5, 1).format.columnWidth = 24;
  tab.getRangeByIndexes(0, 1, count + 5, 1).format.columnWidth = 35;
  tab.freezePanes.freezeRows(5);
  tab.freezePanes.freezeColumns(2);
  if (!existing) tab.tables.add(`A5:${last}${count + 5}`, true, tableName);
}
const progress = outputSheet('Avancement par type');
const stages = ['dimensions', 'architecture', 'seed', 'props', 'loot', 'rencontres', 'services', 'art', 'sauvegarde', 'qa'];
styleTable(progress, 'AVANCEMENT DES 80 TYPOLOGIES', 'Les étapes sont reliées aux 800 tâches. Un prototype inspectable ne termine pas automatiquement les étapes de campagne.', ['ID typologie', 'Typologie', 'Dimensions', 'Architecture', 'Seed', 'Objets', 'Butin', 'Rencontres', 'Services', 'Graphismes', 'Sauvegarde', 'QA', 'Validées', 'Restantes'], data.typologies.length, 'AvancementTypologies2026');
progress.getRange('A6:B85').values = data.typologies.map(t => [t.id, t.name]);
progress.getRange('C6:N85').formulas = data.typologies.map((t, i) => [
  ...stages.map(stage => `=INDEX(Chantiers!$G$6:$G$805,MATCH($A${i + 6}&"/${stage}",Chantiers!$A$6:$A$805,0))`),
  `=COUNTIF(C${i + 6}:L${i + 6},"Validé")`, `=COLUMNS(C${i + 6}:L${i + 6})-M${i + 6}`,
]);
progress.getRange('C6:L85').conditionalFormats.deleteAll();
progress.getRange('C6:L85').conditionalFormats.add('containsText', {text: 'En cours', format: {fill: '#FFF0CC', font: {color: '#805319'}}});
progress.getRange('C6:L85').conditionalFormats.add('containsText', {text: 'Validé', format: {fill: '#DCECE3', font: {color: '#245544', bold: true}}});
progress.getRange('A86:L86').merge();
progress.getRange('A86').values = [['TOTAL DES ÉTAPES VALIDÉES ET RESTANTES']];
progress.getRange('M86:N86').formulas = [['=SUM(M6:M85)', '=SUM(N6:N85)']];
progress.getRange('A86:N86').format = {fill: '#DCECE3', font: {name: 'Arial', size: 10, color: '#245544', bold: true}, rowHeight: 30};

// Recompute every typology aggregate from its individual proofs. A stale or
// partially applied progress patch must never produce a presentable workbook.
const inspected = new Map();
const variantsById = new Map(data.variants.map(v => [v.id, v]));
const inspectionKeys = ['rooms', 'furnishedRooms', 'props', 'refused', 'walls', 'transitions', 'levels'];
for (const record of inspectionReport.records) {
  const variant = variantsById.get(record.id);
  if (!variant || variant.status !== 'Inspection physique' || variant.playable !== false || !variant.inspection) throw Error('Progression d’inspection non appliquée : ' + record.id);
  for (const key of inspectionKeys) if (variant.inspection[key] !== record[key]) throw Error('Inspection différente du suivi : ' + record.id + '/' + key);
  if (!inspected.has(record.typologyId)) inspected.set(record.typologyId, {id: record.typologyId, plans: 0, passed: 0, playable: 0, ...Object.fromEntries(inspectionKeys.map(key => [key, 0]))});
  const total = inspected.get(record.typologyId);
  total.plans++;
  total.passed += record.pass === true ? 1 : 0;
  total.playable += variant.playable ? 1 : 0;
  for (const key of inspectionKeys) total[key] += record[key];
}
const inspectionRows = [...inspected.values()].sort((a, b) => a.id.localeCompare(b.id));
for (const key of ['plans', 'passed', ...inspectionKeys]) {
  if (inspectionRows.reduce((sum, row) => sum + row[key], 0) !== inspectionReport.summary[key]) throw Error('Total du rapport d’inspection incohérent : ' + key);
}
if (inspectionReport.summary.lootContainersCreated !== 0 || inspectionReport.summary.connectedServices !== 0) throw Error('Périmètre de campagne incompatible avec le suivi d’inspection.');
const inspection = outputSheet('Inspection');
const previousInspectionCount = inspection.getRange(`A6:A${data.typologies.length + 5}`).values.filter(([value]) => typeof value === 'string' && /^EXT-MONDE-T\d{3}$/.test(value)).length;
const inspectionLastDataRow = inspectionRows.length + 5;
const inspectionTotalRow = inspectionLastDataRow + 1;
const inspectionNotesRow = inspectionTotalRow + 2;
const inspectionProvenanceRow = inspectionTotalRow + 6;
const inspectionLastRow = inspectionProvenanceRow + 5;
const previousInspectionLastRow = previousInspectionCount + 17;
// Old totals and merged proof notes can occupy rows needed by the extended
// table. Clear only this derived section before rebuilding it below the data.
const inspectionBody = inspection.getRange(`A6:L${Math.max(inspectionLastRow, previousInspectionLastRow)}`);
inspectionBody.unmerge();
inspectionBody.clear({applyTo: 'all'});
styleTable(inspection, `INSPECTION PHYSIQUE — ${inspectionReport.records.length.toLocaleString('fr-FR')} PLANS`, 'Les contrôles portent sur les espaces décrits et le mobilier du mode auteur. Les étapes de campagne restent ouvertes.', ['ID typologie', 'Typologie', 'Plans inspectés', 'Pièces', 'Pièces meublées', 'Objets posés', 'Poses refusées', 'Segments de mur', 'Transitions', 'Niveaux cumulés', 'Contrôles réussis', 'Jouables en campagne'], inspectionRows.length, 'InspectionPhysique2026', previousInspectionCount);
inspection.getRangeByIndexes(5, 0, inspectionRows.length, 12).values = inspectionRows.map(r => [r.id, typesById.get(r.id).name, r.plans, r.rooms, r.furnishedRooms, r.props, r.refused, r.walls, r.transitions, r.levels, r.passed, r.playable]);
inspection.getRange(`C6:L${inspectionLastDataRow}`).setNumberFormat('#,##0');
inspection.getRange(`A${inspectionTotalRow}:B${inspectionTotalRow}`).merge();
inspection.getRange(`A${inspectionTotalRow}`).values = [['TOTAL DU RAPPORT']];
inspection.getRange(`C${inspectionTotalRow}:L${inspectionTotalRow}`).formulas = [[...Array.from({length: 10}, (_, i) => `=SUM(${String.fromCharCode(67 + i)}6:${String.fromCharCode(67 + i)}${inspectionLastDataRow})`)]];
inspection.getRange(`A${inspectionTotalRow}:L${inspectionTotalRow}`).format = {fill: '#DCECE3', font: {name: 'Arial', size: 10, color: '#245544', bold: true}, rowHeight: 30};
inspection.getRange(`C${inspectionTotalRow}:L${inspectionTotalRow}`).setNumberFormat('#,##0');
for (const [range, text] of [
  [`A${inspectionNotesRow}:L${inspectionNotesRow}`, 'PÉRIMÈTRE ET TRAVAUX RESTANTS'],
  [`A${inspectionNotesRow + 1}:L${inspectionNotesRow + 2}`, 'Les poses refusées restent visibles dans ce suivi. Les volumes réservés non construits, le raccord au monde, le butin, les rencontres et les services de campagne restent à terminer.'],
  [`A${inspectionProvenanceRow}:B${inspectionProvenanceRow}`, 'Rapport détaillé'], [`C${inspectionProvenanceRow}:L${inspectionProvenanceRow}`, source(inspectionModule.REPORT)],
  [`A${inspectionProvenanceRow + 1}:B${inspectionProvenanceRow + 1}`, 'Critères et limites'], [`C${inspectionProvenanceRow + 1}:L${inspectionProvenanceRow + 1}`, source(inspectionModule.PROOF)],
  [`A${inspectionProvenanceRow + 2}:B${inspectionProvenanceRow + 2}`, 'Empreinte des plans'], [`C${inspectionProvenanceRow + 2}:L${inspectionProvenanceRow + 2}`, inspectionReport.sourceHash],
  [`A${inspectionProvenanceRow + 3}:B${inspectionProvenanceRow + 3}`, 'Provenance'], [`C${inspectionProvenanceRow + 3}:L${inspectionProvenanceRow + 3}`, `${inspectionReport.sources.length} fichiers contrôlés par taille et SHA-256 avant export.`],
  [`A${inspectionProvenanceRow + 4}:B${inspectionProvenanceRow + 4}`, 'Stocks / services'], [`C${inspectionProvenanceRow + 4}:L${inspectionProvenanceRow + 4}`, `Conteneurs de butin créés : ${inspectionReport.summary.lootContainersCreated}. Services de campagne raccordés : ${inspectionReport.summary.connectedServices}.`],
  [`A${inspectionProvenanceRow + 5}:B${inspectionProvenanceRow + 5}`, 'Empreinte du rapport'], [`C${inspectionProvenanceRow + 5}:L${inspectionProvenanceRow + 5}`, inspectionReportSha256],
]) {
  inspection.getRange(range).merge();
  inspection.getRange(range.split(':')[0]).values = [[text]];
  inspection.getRange(range).format = {font: {name: 'Arial', size: 10, color: '#243E37'}, wrapText: true, verticalAlignment: 'center'};
}
inspection.getRange(`A${inspectionNotesRow}:L${inspectionNotesRow}`).format = {fill: '#254E43', font: {name: 'Arial', size: 11, color: '#FFFFFF', bold: true}, rowHeight: 30};
inspection.getRange(`A${inspectionNotesRow + 1}:L${inspectionNotesRow + 2}`).format.fill = '#FFF0CC';
inspection.getRange(`A${inspectionNotesRow + 1}:L${inspectionNotesRow + 2}`).format.rowHeight = 22;
inspection.getRange(`A${inspectionProvenanceRow}:L${inspectionLastRow}`).format.rowHeight = 28;
inspection.getRange(`C${inspectionProvenanceRow}:L${inspectionProvenanceRow + 1}`).format.font = {name: 'Arial', size: 10, color: '#245544'};

// Exercise a real input change, then restore it before the final calculation.
const taskSheet = sheet('Chantiers');
const rowToTest = data.tasks.findIndex(t => t.status === 'À faire') + 6;
const oldStatus = taskSheet.getRange('G' + rowToTest).values;
const oldProof = taskSheet.getRange('J' + rowToTest).values;
taskSheet.getRange('G' + rowToTest).values = [['Validé']];
taskSheet.getRange('J' + rowToTest).values = [['']];
workbook.recalculate();
const missingEvidenceDetected = home.getRange('C17').values[0][0] === 1;
taskSheet.getRange('G' + rowToTest).values = oldStatus;
taskSheet.getRange('J' + rowToTest).values = oldProof;
if (!missingEvidenceDetected) throw Error('Le compteur de preuves ne réagit pas à une validation sans preuve.');

// Preserve all other formulas, filters, tables, styles and pane positions.
// Recalculate after all edits, then inspect affected counts and errors.
workbook.recalculate();
const expected = {
  programmes: data.catalogue.programmes.length,
  parents: new Set(data.catalogue.programmes.map(p => p.parent)).size,
  typologies: data.typologies.length,
  variants: data.variants.length,
  tasks: data.tasks.length,
  pending: data.tasks.filter(t => t.status === 'À faire').length,
  underway: data.tasks.filter(t => t.status === 'En cours').length,
  validated: data.tasks.filter(t => t.status === 'Validé').length,
  playable: data.variants.filter(v => v.playable).length,
  inspectionPlans: inspectionReport.records.length,
  inspectionTypes: inspectionRows.length,
};
for (const [cell, n] of [['A6', expected.programmes], ['D6', expected.parents], ['G6', expected.typologies], ['J6', expected.variants], ['C15', expected.tasks], ['K13', expected.pending], ['K14', expected.underway], ['K15', expected.validated], ['C18', expected.playable]]) {
  const actual = home.getRange(cell).values[0][0];
  if (actual !== n) throw Error(`Résumé ${cell} : ${actual} au lieu de ${n}`);
}
const errors = await workbook.inspect({kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: {useRegex: true, maxResults: 100}, maxChars: 6000});
await fs.mkdir(proofDir, {recursive: true});
await fs.writeFile(path.join(proofDir, 'formulas.ndjson'), errors.ndjson || '');
await fs.writeFile(path.join(proofDir, 'expected.json'), JSON.stringify({summary, expected, ref, missingEvidenceDetected, inspection: inspectionRows, inspectionReportSha256}, null, 2) + '\n');
if (args.includes('--render')) {
  for (const [name, range, filename] of [['Accueil', 'A1:L34', 'accueil.png'], ['Extension typologies', 'A6:K13', 'typologies.png'], ['Extension typologies', 'A26:K33', 'typologies-agricoles.png'], ['Extension typologies', 'A50:K53', 'typologies-residentielles.png'], ['Chantiers', 'A46:J55', 'chantiers.png'], ['Publication', 'A1:E13', 'publication.png'], ['Avancement par type', 'A1:N17', 'avancement.png'], ['Inspection', `A1:L${inspectionLastRow}`, 'inspection.png']]) {
    const preview = await workbook.render({sheetName: name, range, scale: 1, format: 'png'});
    await fs.writeFile(path.join(proofDir, filename), new Uint8Array(await preview.arrayBuffer()));
  }
}
inspectionModule.checkedReport(root);
const reportAtExport = createHash('sha256').update(await fs.readFile(path.join(root, inspectionModule.REPORT))).digest('hex');
if (reportAtExport !== inspectionReportSha256) throw Error('Le rapport d’inspection a changé pendant la génération du classeur.');
await unchanged(input, inputHash, 'Le classeur source');
await unchanged(output, outputHash, 'Le classeur destination');
await fs.mkdir(path.dirname(output), {recursive: true});
const file = await SpreadsheetFile.exportXlsx(workbook);
const temporary = path.join(path.dirname(output), '.' + path.basename(output) + '.' + randomUUID() + '.xlsx');
try {
  await file.save(temporary);
  await unchanged(input, inputHash, 'Le classeur source');
  await unchanged(output, outputHash, 'Le classeur destination');
  inspectionModule.checkedReport(root);
  if (await fileHash(path.join(root, inspectionModule.REPORT)) !== inspectionReportSha256) throw Error('Le rapport d’inspection a changé pendant la génération du classeur.');
  await fs.rename(temporary, output);
  try { await fs.rename(temporary + '.inspect.ndjson', path.join(proofDir, 'export-inspection.ndjson')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
} finally {
  await fs.rm(temporary, {force: true});
  await fs.rm(temporary + '.inspect.ndjson', {force: true});
}
console.log(JSON.stringify({output, proofDir, ...expected}));
