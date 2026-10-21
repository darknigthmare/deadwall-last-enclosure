'use strict';
/* Explicit authoring progress patch. Does not install game content or edit a save. */
const fs=require('node:fs'),path=require('node:path'),M=require('./codex-world-foundations2026.cjs');
const PREFIX='docs/codex/suivi-monde2026/',SHIP_TYPES=['EXT-MONDE-T005','EXT-MONDE-T006','EXT-MONDE-T007','EXT-MONDE-T008','EXT-MONDE-T011'];
const PROOF=PREFIX+'FONDATIONS_METRIQUES_2026.md';
const clone=v=>JSON.parse(JSON.stringify(v));
function patch(data){
 const result=clone(data),audit=M.auditAll(),models=new Map(audit.records.map(r=>[r.id,r]));
 const changes={closed:[],inProgress:[],metricVariants:[],playableAdded:0};
 for(const task of result.tasks){
  const dimension=M.TYPES.includes(task.typologyId)&&task.stage==='dimensions';
  const partial=M.TYPES.includes(task.typologyId)&&task.stage==='architecture'||SHIP_TYPES.includes(task.typologyId)&&task.stage==='dimensions';
  if(!dimension&&!partial)continue;
  const desired=dimension?'Validé':'En cours';
  if(task.status!=='À faire'&&!(task.status===desired&&task.evidence.startsWith(PROOF)))throw Error('Édition concurrente conservée : '+task.id);
  task.status=desired;task.owner='Production Codex';task.evidence=PROOF+(dimension?'#dimensions-auteur-validees':SHIP_TYPES.includes(task.typologyId)?'#navires-cotes-partielles':'#architecture-encore-ouverte');
  (dimension?changes.closed:changes.inProgress).push(task.id);
 }
 if(changes.closed.length!==3||changes.inProgress.length!==8)throw Error('Tâches cibles absentes ou dupliquées');
 for(const t of result.typologies)if(M.TYPES.includes(t.id)){
  t.status='Gabarit métrique';t.referencePlan='references-metriques2026.json';t.scope='Cotes auteur validées ; architecture et intégration encore ouvertes.';
  const rows=audit.records.filter(r=>r.type===t.id);t.dimensions_m={widthRange:[Math.min(...rows.map(r=>r.widthM)),Math.max(...rows.map(r=>r.widthM))],lengthRange:[Math.min(...rows.map(r=>r.lengthM)),Math.max(...rows.map(r=>r.lengthM))],maxHeightRange:[Math.min(...rows.map(r=>r.heightM)),Math.max(...rows.map(r=>r.heightM))],unit:'m',scope:'emprise auteur, non relevé complet d’un lieu réel'};
 }
 for(const v of result.variants){const r=models.get(v.id);if(!r)continue;
  if(v.status!=='À concevoir'&&!(v.status==='Gabarit métrique'&&v.evidence===PROOF))throw Error('Variante modifiée ailleurs : '+v.id);
  v.status='Gabarit métrique';v.dimensions_m={width:r.widthM,length:r.lengthM,height:r.heightM,unit:'m',heightOrigin:r.heightOrigin};
  v.metricDraft={generator:'scripts/codex-world-foundations2026.cjs',type:r.type,number:v.number,scope:'author-metric-layout-not-live-world'};
  v.architecture=null;v.playable=false;v.spawnWeight=null;v.evidence=PROOF;
  v.note='Plan métrique auteur généré et testé ; murs, étages, contenu interactif, réseau du seed et campagne non intégrés.';changes.metricVariants.push(v.id);
 }
 if(changes.metricVariants.length!==150)throw Error('Variantes cibles absentes');
 return {data:result,changes};
}
if(require.main===module){
 const root=path.resolve(__dirname,'..'),folder=path.join(root,PREFIX),read=n=>JSON.parse(fs.readFileSync(path.join(folder,n),'utf8'));
 const out=patch({typologies:read('typologies-cibles.json'),variants:read('variantes-a-concevoir.json'),tasks:read('chantiers.json')});
 if(process.argv.includes('--apply'))for(const[key,file]of [['typologies','typologies-cibles.json'],['variants','variantes-a-concevoir.json'],['tasks','chantiers.json']])fs.writeFileSync(path.join(folder,file),JSON.stringify(out.data[key],null,2)+'\n');
 console.log(JSON.stringify(out.changes,null,2));
}
module.exports={patch,PROOF,SHIP_TYPES};
