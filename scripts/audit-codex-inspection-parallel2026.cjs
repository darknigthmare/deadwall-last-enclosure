'use strict';
// QA parallelism changes scheduling only. Every accepted row still comes from
// the unchanged author/furniture/physical inspection in auditTypes().
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {fork}=require('node:child_process');
const Registry=require('./codex-generators2026.cjs');
const Audit=require('./audit-codex-inspection2026.cjs');
const ROOT=path.resolve(__dirname,'..');
const DEFAULT_CACHE='artifacts/qa/codex-inspection2026-parallel';
const SHA=/^[a-f0-9]{64}$/;
const PROOFS=['sourcePlanUnchanged','furnishingAudit','physicalAudit','serviceFrontsReachable','entryToRoomsReachable'];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function sameSources(actual,expected){
 if(!Array.isArray(actual)||actual.length!==expected.length)throw Error('Inventaire de sources incomplet.');
 for(let i=0;i<expected.length;i++){
  const a=actual[i],b=expected[i];
  if(!a||a.path!==b.path||!SHA.test(a.sha256)||a.sha256!==b.sha256||!Number.isInteger(a.bytes)||a.bytes!==b.bytes)throw Error('Source périmée ou modifiée : '+b.path);
 }
 return true;
}
function atomicJSON(destination,value){
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 const temporary=destination+'.tmp-'+process.pid;
 fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');fs.renameSync(temporary,destination);
}
function partFile(folder,type){
 if(!/^EXT-MONDE-T\d{3}$/.test(type))throw Error('Identifiant de partie invalide.');
 return path.join(folder,type+'.json');
}
function validatePart(part,{type,sourceHash,sources,jobId,variants=Registry.VARIANTS_PER_TYPE}){
 if(!part||part.version!==1||part.kind!=='inspection-audit-part'||part.jobId!==jobId||part.type!==type||part.complete!==true)throw Error('Partie absente, incomplète ou étrangère : '+type);
 const r=part.report;
 if(!r||r.version!==1||r.partial!==true||r.scope!=='inspection-only'||r.campaignPlayable!==0||r.actorRadiusM!==.32||r.sourceHash!==sourceHash||!Array.isArray(r.failures)||r.failures.length||!Array.isArray(r.records)||r.records.length!==variants)throw Error('Rapport partiel incomplet, périmé ou en échec : '+type);
 sameSources(r.sources,sources);
 const seen=new Set();
 for(const row of r.records){
  if(!row||row.typologyId!==type||!Number.isInteger(row.number)||row.number<1||row.number>variants||row.id!==type+'-V'+String(row.number).padStart(2,'0')||seen.has(row.id))throw Error('Variante partielle absente ou dupliquée : '+type);
  seen.add(row.id);
  if(row.pass!==true||!Array.isArray(row.errors)||row.errors.length||PROOFS.some(key=>row[key]!==true)||!SHA.test(row.authorPlanSha256)||!/^[a-f0-9]{8}$/.test(row.geometryFingerprint))throw Error('Contrôle partiel refusé : '+row.id);
  for(const key of Audit.SUM_FIELDS)if(!Number.isInteger(row[key])||row[key]<0)throw Error('Mesure partielle invalide : '+row.id+'/'+key);
  if(row.scope!=='inspection-only'||row.campaignPlayable!==0||row.unknownUses!==0||row.lootContainersCreated!==0||row.connectedServices!==0||row.rooms<1||row.props<1||row.levels<1||row.furnishedRooms>row.rooms||row.requested!==row.props+row.refused)throw Error('Périmètre partiel invalide : '+row.id);
 }
 for(let number=1;number<=variants;number++)if(!seen.has(type+'-V'+String(number).padStart(2,'0')))throw Error('Variante manquante : '+type+'/'+number);
 return r.records;
}
function aggregateParts(parts,{types,sourceHash,sources,jobId,variants=Registry.VARIANTS_PER_TYPE}){
 if(!Array.isArray(types)||!types.length||new Set(types).size!==types.length||types.some(t=>!/^EXT-MONDE-T\d{3}$/.test(t)))throw Error('Inventaire cible invalide.');
 if(!Array.isArray(parts)||parts.length!==types.length)throw Error('Inventaire de parties incomplet.');
 const byType=new Map();
 for(const part of parts){
  if(!part||!types.includes(part.type)||byType.has(part.type))throw Error('Partie inconnue ou dupliquée.');
  byType.set(part.type,validatePart(part,{type:part.type,sourceHash,sources,jobId,variants}));
 }
 const records=types.flatMap(type=>{
  const rows=byType.get(type);if(!rows)throw Error('Type non audité : '+type);
  return [...rows].sort((a,b)=>a.number-b.number);
 });
 // Never trust a worker summary or silently remove duplicate records.
 return {version:1,generatedAt:new Date().toISOString(),scope:'inspection-only',campaignPlayable:0,
  actorRadiusM:.32,sourceHash,sources,
  summary:{types:types.length,...Audit.aggregate(records),campaignPlayable:0},
  types:types.map(type=>({typologyId:type,...Audit.aggregate(byType.get(type))})),records,failures:[]};
}
function runWorker(config){
 return new Promise((resolve,reject)=>{
  const child=fork(path.join(__dirname,'audit-codex-inspection-worker2026.cjs'),[JSON.stringify(config)],{cwd:ROOT,stdio:['ignore','inherit','inherit','ipc']});
  child.once('error',reject);
  child.once('exit',(code,signal)=>code===0?resolve():reject(Error('Audit worker '+config.index+' interrompu : '+(signal||code))));
 });
}
async function runParallel({write=true,output=Audit.OUTPUT,workers=4,cacheRoot=DEFAULT_CACHE}={}){
 if(!Number.isInteger(workers)||workers<1||workers>4)throw Error('L’audit accepte de un à quatre processus.');
 const Layouts=require('../src/codex-layouts2026.js'),{sourceHash:compiledHash}=require('./compile-codex-inspection2026.cjs');
 const types=Registry.generators().flatMap(g=>g.types),sourceHash=Layouts.sourceHash,sourceInventory=Audit.sources();
 if(sourceHash!==compiledHash(ROOT)||Layouts.count!==types.length*Registry.VARIANTS_PER_TYPE||JSON.stringify([...Layouts.types].sort())!==JSON.stringify([...types].sort()))throw Error('Compilation ou couverture périmée.');
 const jobId=sha(JSON.stringify({version:1,sourceHash,sources:sourceInventory,types}));
 const folder=path.resolve(ROOT,cacheRoot,jobId),count=Math.min(workers,types.length);
 fs.mkdirSync(folder,{recursive:true});
 atomicJSON(path.join(folder,'job.json'),{version:1,jobId,sourceHash,sources:sourceInventory,types,workers:count,expectedPlans:types.length*Registry.VARIANTS_PER_TYPE});
 const configs=Array.from({length:count},(_,index)=>({index,jobId,folder,sourceHash,sources:sourceInventory,types:types.filter((_,i)=>i%count===index)}));
 console.log(JSON.stringify({event:'inspection-audit-start',types:types.length,plans:types.length*Registry.VARIANTS_PER_TYPE,workers:count,folder}));
 const results=await Promise.allSettled(configs.map(runWorker));
 const failed=results.filter(r=>r.status==='rejected');
 if(failed.length)throw Error(failed.map(r=>r.reason.message).join('; '));
 sameSources(Audit.sources(),sourceInventory);
 const parts=types.map(type=>JSON.parse(fs.readFileSync(partFile(folder,type),'utf8')));
 const report=aggregateParts(parts,{types,sourceHash,sources:sourceInventory,jobId});
 report.execution={kind:'isolated-processes',workers:count,jobId,parts:types.map(type=>{const data=fs.readFileSync(partFile(folder,type));return {type,sha256:sha(data),bytes:data.length};})};
 sameSources(Audit.sources(),sourceInventory);
 if(write)atomicJSON(path.resolve(ROOT,output),report);
 return report;
}
module.exports={runParallel,aggregateParts,validatePart,sameSources,atomicJSON,partFile};
