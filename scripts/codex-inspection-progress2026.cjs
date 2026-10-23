'use strict';
/* Record only the inspected subset. Campaign work keeps its own open stages. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Layouts=require('../src/codex-layouts2026.js');
const {SOURCE_FILES,OUTPUT:REPORT}=require('./audit-codex-inspection2026.cjs');
const Registry=require('./codex-generators2026.cjs');
const Foundation=require('./codex-progress2026.cjs'),Maritime=require('./codex-maritime-progress2026.cjs');
const PROOF='docs/codex/suivi-monde2026/INSPECTION_PHYSIQUE_2026.md';
const SCOPE='inspection-only';
const METRICS=['rooms','furnishedRooms','props','requested','refused','unknownUses','levels','walls','transitions','lootContainersCreated','connectedServices'];
function checkedReport(root){
 const report=JSON.parse(fs.readFileSync(path.join(root,REPORT),'utf8'));
 if(report.version!==1||report.scope!==SCOPE||report.campaignPlayable!==0||report.sourceHash!==Layouts.sourceHash||!Array.isArray(report.failures)||report.failures.length||!Array.isArray(report.records)||report.records.length!==Layouts.count)throw Error('Preuve d’inspection absente, incomplète ou périmée');
 if(!Array.isArray(report.sources)||JSON.stringify(report.sources.map(s=>s.path).sort())!==JSON.stringify([...SOURCE_FILES].sort()))throw Error('Provenance d’inspection incomplète');
 for(const source of report.sources){
  if(typeof source.path!=='string'||path.isAbsolute(source.path)||source.path.split(/[\\/]/).includes('..'))throw Error('Chemin de preuve invalide');
  const bytes=fs.readFileSync(path.join(root,source.path));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==source.sha256||bytes.length!==source.bytes)throw Error('Preuve périmée : '+source.path);
 }
 const records=new Map();
 for(const r of report.records){
  if(!Layouts.types.includes(r.typologyId)||!Number.isInteger(r.number)||r.number<1||r.number>50||r.id!==r.typologyId+'-V'+String(r.number).padStart(2,'0')||records.has(r.id)||r.pass!==true)throw Error('Variante inspectée invalide : '+r.id);
  for(const key of METRICS)if(!Number.isInteger(r[key])||r[key]<0)throw Error('Mesure d’inspection invalide : '+r.id+'/'+key);
  if(r.scope!==SCOPE||r.campaignPlayable!==0||r.unknownUses!==0||r.lootContainersCreated!==0||r.connectedServices!==0||r.furnishedRooms>r.rooms||r.props+r.refused!==r.requested||!Array.isArray(r.errors)||r.errors.length)throw Error('Périmètre d’inspection invalide : '+r.id);
  records.set(r.id,r);
 }
 const expected={types:Layouts.types.length,plans:records.size,passed:records.size,campaignPlayable:0,...Object.fromEntries(METRICS.map(key=>[key,[...records.values()].reduce((sum,r)=>sum+r[key],0)]))};
 for(const[key,value]of Object.entries(expected))if(report.summary?.[key]!==value)throw Error('Total d’inspection invalide : '+key);
 return {report,records};
}
function patch(data,root=path.resolve(__dirname,'..')){
 const {records}=checkedReport(root),out=JSON.parse(JSON.stringify(data)),types=new Set(Layouts.types);
 const authorProofs=new Set([Foundation.PROOF+'#architecture-encore-ouverte',Maritime.PROOF,...Registry.SPECS.map(spec=>spec.proof).filter(Boolean)]);
 const changes={inProgress:[],inspectionVariants:[],closed:[],playableAdded:0};
 for(const task of out.tasks){
  if(!types.has(task.typologyId)||!['architecture','props','sauvegarde','qa'].includes(task.stage))continue;
  const previous=task.stage==='architecture'?'En cours':'À faire';
  if(task.status!==previous&&!(task.status==='En cours'&&task.evidence===PROOF))throw Error('Édition concurrente conservée : '+task.id);
  if(task.stage==='architecture'&&task.evidence!==PROOF&&!authorProofs.has(task.evidence))throw Error('Édition concurrente conservée : '+task.id);
  if(task.stage!=='architecture'&&task.status==='À faire'&&task.evidence)throw Error('Preuve concurrente conservée : '+task.id);
  if(!['Non affecté','Production Codex'].includes(task.owner))throw Error('Édition concurrente conservée : '+task.id);
  task.status='En cours';task.owner='Production Codex';task.evidence=PROOF;
  task.progress={architecture:'Volumes décrits, murs et accès inspectables ; volumes réservés et raccord au monde encore ouverts.',props:'Mobilier à taille déclarée et passages contrôlés ; demandes refusées et interactions encore ouvertes.',sauvegarde:'Identités et reprise d’inspection contrôlées ; migration et persistance de campagne encore ouvertes.',qa:'Inspection physique des 50 variantes contrôlée ; parcours de campagne non livré.'}[task.stage];
  changes.inProgress.push(task.id);
 }
 for(const type of out.typologies)if(types.has(type.id)){
  if(!['Gabarit métrique','Avant-projet maritime','Avant-projet terrestre','Inspection physique'].includes(type.status))throw Error('Typologie modifiée ailleurs : '+type.id);
  if(type.status==='Inspection physique'&&type.inspectionEvidence!==PROOF)throw Error('Typologie modifiée ailleurs : '+type.id);
  type.status='Inspection physique';type.scope='50 plans inspectables dans le Guide auteur ; géométrie partielle et campagne encore ouvertes.';type.inspectionEvidence=PROOF;
 }
 for(const variant of out.variants){
  const record=records.get(variant.id);if(!record)continue;
  if(!['Gabarit métrique','Avant-projet maritime','Avant-projet terrestre','Inspection physique'].includes(variant.status)||variant.playable!==false||variant.spawnWeight!==null||variant.architecture!==null)throw Error('Variante modifiée ailleurs : '+variant.id);
  if(variant.status==='Inspection physique'&&variant.evidence!==PROOF)throw Error('Variante modifiée ailleurs : '+variant.id);
  variant.status='Inspection physique';variant.evidence=PROOF;
  variant.inspection={version:1,scope:SCOPE,report:REPORT,sourceHash:Layouts.sourceHash,rooms:record.rooms,furnishedRooms:record.furnishedRooms,props:record.props,refused:record.refused,levels:record.levels,walls:record.walls,transitions:record.transitions};
  // A partial physical inspection does not certify the complete architecture.
  variant.architecture=null;variant.playable=false;variant.spawnWeight=null;
  variant.note='Pièces décrites, murs, portes, niveaux et mobilier inspectables à l’échelle. Volumes réservés, raccord au seed, butin, rencontres et services de campagne restent à terminer.';
  changes.inspectionVariants.push(variant.id);
 }
 if(changes.inProgress.length!==Layouts.types.length*4||changes.inspectionVariants.length!==Layouts.count)throw Error('Cibles d’inspection absentes ou dupliquées');
 return {data:out,changes};
}
module.exports={patch,checkedReport,PROOF,REPORT,SCOPE};
