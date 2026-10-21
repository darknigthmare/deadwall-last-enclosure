'use strict';
const M=require('./codex-maritime2026.cjs'),F=require('./codex-progress2026.cjs');
const PROOF='docs/codex/suivi-monde2026/MARITIME_AUTEUR_2026.md';
function patch(data){
 const out=JSON.parse(JSON.stringify(data)),types=new Set(Object.keys(M.PROFILES));
 const checked=M.auditAll();if(checked.variants!==250||checked.playable!==0)throw Error('Audit maritime incomplet');
 const changes={inProgress:[],maritimeVariants:[],closed:[],playableAdded:0};
 for(const task of out.tasks){
  if(!types.has(task.typologyId)||!['dimensions','architecture'].includes(task.stage))continue;
  const previous=task.stage==='dimensions'?'En cours':'À faire';
  const oldEvidence=task.stage==='dimensions'?F.PROOF+'#navires-cotes-partielles':'';
  if(!(task.status===previous&&task.evidence===oldEvidence)&&!(task.status==='En cours'&&task.evidence===PROOF))throw Error('Édition concurrente conservée : '+task.id);
  task.status='En cours';task.owner='Production Codex';task.evidence=PROOF;changes.inProgress.push(task.id);
 }
 for(const t of out.typologies)if(types.has(t.id)){
  if(!['À concevoir','Avant-projet maritime'].includes(t.status))throw Error('Typologie modifiée ailleurs : '+t.id);
  const p=M.build(t.id,1);t.status='Avant-projet maritime';t.referencePlan='references-metriques2026.json';t.dimensions_m={length:p.reference.lengthM,width:p.reference.beamM,draft:p.reference.draftM,height:null,unit:'m',scope:'longueur/largeur/tirant sourcés ; hauteur totale réelle inconnue'};t.scope='Avant-projet de compartimentage auteur ; coque détaillée, hauteur réelle et intégration ouvertes.';
 }
 for(const v of out.variants)if(types.has(v.typologyId)){
  if(v.status!=='À concevoir'&&!(v.status==='Avant-projet maritime'&&v.evidence===PROOF))throw Error('Variante modifiée ailleurs : '+v.id);
  const p=M.build(v.typologyId,v.number);v.status='Avant-projet maritime';
  v.dimensions_m={length:p.reference.lengthM,width:p.reference.beamM,draft:p.reference.draftM,height:null,authorAirDraft:p.authorAirDraftM,unit:'m',heightOrigin:'author-design-not-measured-total-height'};
  v.maritimeDraft={generator:'scripts/codex-maritime2026.cjs',number:v.number,levels:p.levels.length,compartments:p.rooms.filter(r=>r.kind==='compartment').length,scope:p.scope};
  v.architecture=null;v.playable=false;v.spawnWeight=null;v.evidence=PROOF;v.note='Compartiments, portes et liaisons verticales auteur testés. Réserves cargo non visitables ; hauteur réelle, raccord au seed, interactions et campagne non intégrés.';changes.maritimeVariants.push(v.id);
 }
 if(changes.inProgress.length!==10||changes.maritimeVariants.length!==250)throw Error('Cibles maritimes absentes ou dupliquées');
 return {data:out,changes};
}
module.exports={patch,PROOF};
