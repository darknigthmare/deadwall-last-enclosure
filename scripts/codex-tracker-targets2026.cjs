'use strict';
/* Compact, reproducible production targets. Does not create playable content. */
const spec=require('../docs/codex/suivi-monde2026/OBJECTIFS80.json');
function generate(){
 const typologies=[],variants=[],tasks=[];
 for(const group of spec.groups)for(const name of group.names){
  const id='EXT-MONDE-T'+String(typologies.length+1).padStart(3,'0');
  const t={id,domain:group.domain,name,targetVariants:50,requiredSpaces:[...group.requiredSpaces],requiredNetworks:[...group.requiredNetworks],placementRule:group.placementRule,dimensions_m:null,referencePlan:null,status:'À concevoir',scope:'objectif de production, non implémenté'};typologies.push(t);
  for(let number=1;number<=50;number++)variants.push({id:id+'-V'+String(number).padStart(2,'0'),typologyId:id,domain:t.domain,typology:name,number,status:'À concevoir',architecture:null,dimensions_m:null,spawnWeight:null,playable:false,evidence:null,note:'Emplacement de suivi : aucune variante détaillée ou géométrie produite.'});
  for(const s of spec.stages)tasks.push({id:id+'/'+s.stage,typologyId:id,domain:t.domain,name,stage:s.stage,deliverable:s.deliverable,priority:s.priority,status:'À faire',owner:'Non affecté',evidence:'',acceptance:s.stage==='seed'?t.placementRule:s.acceptance});
 }
 if(typologies.length!==80||variants.length!==4000||tasks.length!==800)throw Error('Cibles incomplètes');
 return {typologies,variants,tasks};
}
module.exports={generate};
