'use strict';
const fs=require('node:fs'),path=require('node:path');
const FAIL=msg=>{throw Error('Suivi Codex: '+msg);};
function unique(items,label){const ids=new Set();for(const item of items){if(!item||typeof item.id!=='string'||ids.has(item.id))FAIL('identifiant absent ou doublon '+label);ids.add(item.id);}return ids;}
function validate(data){
 const {catalogue,typologies,variants,tasks}=data;
 if(!Array.isArray(catalogue?.programmes)||catalogue.programmes.length!==4000)FAIL('catalogue existant incomplet');
 const programmes=unique(catalogue.programmes,'programme');
 for(const p of catalogue.programmes){if(!programmes.has(p.parent))FAIL('parent absent');if(!p.source||!/^[a-f0-9]{64}$/.test(p.sourceSha256))FAIL('provenance absente');if(!(p.model?.w>0&&p.model?.h>0))FAIL('emprise source invalide');}
 const parents=new Set(catalogue.programmes.map(p=>p.parent));
 if(parents.size!==2000)FAIL('parents incomplets');
 const rooms=unique(catalogue.rooms,'espace');unique(catalogue.props,'objet');
 for(const r of catalogue.rooms)if(!parents.has(r.parent))FAIL('espace orphelin');
 for(const p of catalogue.props){if(!parents.has(p.parent)||!rooms.has(p.roomId))FAIL('objet orphelin');
  if(p.size!==null&&Object.values(p.size).some(v=>!Number.isFinite(v)||v<=0))FAIL('dimension objet invalide');
  if(p.quantity!==null&&(!Array.isArray(p.quantity)||p.quantity.length!==2||p.quantity.some(v=>!Number.isSafeInteger(v)||v<0)||p.quantity[1]<p.quantity[0]))FAIL('quantité objet invalide');
 }
 if(!Array.isArray(typologies)||typologies.length!==80)FAIL('typologies incomplètes');
 const types=unique(typologies,'typologie');
 if(!Array.isArray(variants)||variants.length!==4000)FAIL('variantes cibles incomplètes');unique(variants,'variante');
 const byType=new Map(typologies.map(t=>[t.id,new Set()]));
 for(const v of variants){if(!types.has(v.typologyId))FAIL('variante orpheline');
  if(!Number.isInteger(v.number)||v.number<1||v.number>50||byType.get(v.typologyId).has(v.number))FAIL('numéro variante invalide');
  byType.get(v.typologyId).add(v.number);
  if(v.playable===true&&(!v.evidence||!v.architecture||!v.dimensions_m))FAIL('jouabilité sans preuve');
  if(v.status==='À concevoir'&&(v.playable!==false||v.architecture!==null||v.dimensions_m!==null||v.spawnWeight!==null))FAIL('objectif déclaré réalisé sans conception');
  if(v.status==='Inspection physique'&&(!v.inspection||v.inspection.scope!=='inspection-only'||v.inspection.version!==1||!v.inspection.report||!v.evidence||v.playable!==false||v.spawnWeight!==null||v.architecture!==null))FAIL('inspection confondue avec une architecture complète ou une variante jouable');
 }
 if([...byType.values()].some(v=>v.size!==50))FAIL('chaque type exige 50 cibles');
 if(tasks.length!==800)FAIL('tâches incomplètes');unique(tasks,'tâche');
 const allowed=new Set(['À faire','En cours','Bloqué','À vérifier','Validé']);
 for(const t of tasks){if(!types.has(t.typologyId)||!allowed.has(t.status))FAIL('statut ou type tâche invalide');if(t.status==='Validé'&&!t.evidence?.trim())FAIL('validation sans preuve');}
 for(const type of types){const group=tasks.filter(t=>t.typologyId===type);if(group.length!==10||new Set(group.map(t=>t.stage)).size!==10)FAIL('étapes de production incomplètes');}
 const campaign=require('./codex-campaign-progress205.cjs').validateCoverage(data);
 return {programmes:programmes.size,parents:parents.size,spaces:rooms.size,objectReferences:catalogue.props.length,typologies:types.size,
  variantTargets:variants.length,variantsDesigned:variants.filter(v=>v.architecture!==null).length,variantsInspectable:variants.filter(v=>v.status==='Inspection physique').length,variantsPlayable:variants.filter(v=>v.playable===true).length,tasks:tasks.length,validatedTasks:tasks.filter(t=>t.status==='Validé').length,
  ...(campaign?{campaignEligibleVariants:campaign.eligibleVariants,campaignObservedSeeds:campaign.observedSeeds,campaignObservedSites:campaign.observedSites}:{}),
  scope:'contrats de suivi ; pas une validation de jeu',published:false};
}
function load(root){const p=path.join(root,'docs/codex/suivi-monde2026'),read=n=>JSON.parse(fs.readFileSync(path.join(p,n),'utf8'));return {catalogue:read('catalogue-existant.json'),typologies:read('typologies-cibles.json'),variants:read('variantes-a-concevoir.json'),tasks:read('chantiers.json'),...(fs.existsSync(path.join(p,'campagne-g11.json'))?{campaign205:read('campagne-g11.json')}:{})};}
module.exports={validate,load};
if(require.main===module){const data=process.argv[2]?load(path.resolve(process.argv[2])):require('./build-codex-tracker2026.cjs').currentData();console.log(JSON.stringify(validate(data),null,2));}
