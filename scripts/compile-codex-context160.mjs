import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require=createRequire(import.meta.url),root=fileURLToPath(new URL('..',import.meta.url));
const historical=require('../src/codex3000-runtime.js');
export const EXCLUDED_IDS_SHA256='98406f09cccc33595dfbe557dd94d5780353a71323cb29781fdd6665a301c7bf';
export const CONTEXT_MODULES=Object.freeze(['camp-allie','camp-hostile','foret-profonde','gare-fret','hopital-soins','lac','montagne','plage','port','routes-coutures','terre-aride']);
const sha=text=>createHash('sha256').update(text).digest('hex');
const slug=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{1,79}$/.test(value);
const fail=message=>{throw Error('Codex 1.60 : '+message);};
const operationIds=Object.freeze(['restoreAccess','pumpBasin','switchTrack','medicalCare']);
const forbidden=new Set(['name','title','family','rooms','resources','sourceMin','sourceMax','sourceLevels','w','h','levels']);
function noHistoricalCopies(value,at){
 if(!value||typeof value!=='object')return;
 for(const [key,child]of Object.entries(value)){
  if(forbidden.has(key))fail('donnée historique dupliquée '+at+'.'+key);
  noHistoricalCopies(child,at+'.'+key);
 }
}
export function validateManifest(manifest,R=historical){
 if(!manifest||manifest.schemaVersion!==1||manifest.version!=='1.60.0'||manifest.generation!==10)fail('version du manifeste invalide');
 const ids=manifest.ids;
 if(!Array.isArray(ids)||ids.length!==626||new Set(ids).size!==626||ids.some(id=>!/^DW-\d{4}$/.test(id)||!R.get(id)))fail('626 identifiants historiques uniques requis');
 if(ids.some((id,index)=>index>0&&id<=ids[index-1]))fail('ordre des identifiants non canonique');
 if(sha(JSON.stringify(ids))!==EXCLUDED_IDS_SHA256)fail('les626 identifiants figés ont changé');
 if(manifest.baseline?.idListSha256!==EXCLUDED_IDS_SHA256)fail('empreinte des identifiants absente');
 const noPreset=ids.map(id=>R.get(id)).filter(record=>!R.preset('codex3000-'+record.id.slice(3)));
 if(noPreset.length!==300)fail('300 programmes historiques sans preset requis');
 const parents=[...new Set(noPreset.map(record=>record.parent))].sort(),profiles=manifest.specialParents;
 if(!profiles||typeof profiles!=='object'||Array.isArray(profiles)||Object.keys(profiles).sort().join(',')!==parents.join(',')||parents.length!==100)fail('profils explicites des100 parents spéciaux requis');
 for(const [id,profile]of Object.entries(profiles)){
  if(!['open','building','cluster'].includes(profile.mode)||!slug(profile.archetype)||!['roads','rail','water','port','district'].includes(profile.context160))fail('profil physique invalide '+id);
  if(!profile.geometry||typeof profile.geometry!=='object'||Array.isArray(profile.geometry))fail('géométrie du profil absente '+id);
  if(!Array.isArray(profile.requirements)||!profile.requirements.length||profile.requirements.some(value=>!slug(value)))fail('prérequis physiques absents '+id);
  if(!Array.isArray(profile.interactionContract)||!profile.interactionContract.length||profile.interactionContract.some(value=>typeof value!=='string'||value.length<8))fail('contrat de parcours absent '+id);
  const operations=profile.geometry.operationCandidates||[];
  if(!Array.isArray(operations)||new Set(operations).size!==operations.length||operations.some(value=>!operationIds.includes(value)))fail('opération du profil non déclarée '+id);
  noHistoricalCopies(profile,'specialParents.'+id);
 }
 const contexts=manifest.contexts;
 if(!contexts||Object.keys(contexts).sort().join(',')!==CONTEXT_MODULES.join(','))fail('les11 contextes spécialisés explicites sont requis');
 for(const [id,profile]of Object.entries(contexts)){
  if(profile.context160!==id||profile.abandoned!==true||!slug(profile.terrain)||!profile.geometry||typeof profile.geometry!=='object')fail('contexte physique invalide '+id);
  if(!Array.isArray(profile.requirements)||!profile.requirements.length||profile.requirements.some(value=>!slug(value)))fail('prérequis de contexte absents '+id);
  if(!Array.isArray(profile.operations)||new Set(profile.operations).size!==profile.operations.length||profile.operations.some(value=>!operationIds.includes(value)))fail('opération de contexte non déclarée '+id);
  if(!Array.isArray(profile.runtimeScope)||!profile.runtimeScope.length||profile.runtimeScope.some(value=>typeof value!=='string'||value.length<8))fail('portée réelle du contexte absente '+id);
  noHistoricalCopies(profile,'contexts.'+id);
 }
 for(const id of ids){
  const record=R.get(id),parent=R.parentFor(record),template=R.template(id);
  if(!parent||!template||!template.reference.min.every(value=>Number.isFinite(value)&&value>0))fail('référence géométrique originale absente '+id);
  if(!profiles[record.parent]&&!contexts[record.module])fail('contrat de contexte manquant '+id);
 }
 return manifest;
}
export function compileData(manifest,R=historical){
 validateManifest(manifest,R);
 // Author names, dimensions, rooms and resources remain in liveData. This
 // module contains only permanent references and the new physical contracts.
 return {schemaVersion:1,version:manifest.version,generation:manifest.generation,ids:manifest.ids,
  idListSha256:manifest.baseline.idListSha256,specialParents:manifest.specialParents,contexts:manifest.contexts,
  scope:manifest.scope,adaptationPolicy:manifest.adaptationPolicy};
}
export function renderModule(data){
 return '/* Generated only from Codex 1.60 physical contracts; author data stay in liveData. */\n'+
  '(function(root){"use strict";const freeze=v=>{if(v&&typeof v==="object"){for(const c of Object.values(v))freeze(c);Object.freeze(v);}return v;};const data=freeze('+JSON.stringify(data).replace(/</g,'\\u003c')+');root.DeadwallCodexContext160Data=data;if(typeof module==="object"&&module.exports)module.exports=data;})(typeof globalThis!=="undefined"?globalThis:this);\n';
}
export function compile({manifestFile=path.join(root,'codex-3000/addendum-1.60/CONTRATS.json'),destination=path.join(root,'src/codex-context160-data.js')}={}){
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')),data=compileData(manifest),text=renderModule(data);
 if(!fs.existsSync(destination)||fs.readFileSync(destination,'utf8')!==text)fs.writeFileSync(destination,text);
 return {programmes:data.ids.length,specialParents:Object.keys(data.specialParents).length,contexts:Object.keys(data.contexts).length,bytes:Buffer.byteLength(text),sha256:sha(text)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Codex context160 : '+JSON.stringify(compile()));
