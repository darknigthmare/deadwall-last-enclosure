'use strict';
const fs=require('node:fs');
const Audit=require('./audit-codex-inspection2026.cjs');
const Parallel=require('./audit-codex-inspection-parallel2026.cjs');
const Registry=require('./codex-generators2026.cjs');
function work(config){
 const allowed=Registry.generators().flatMap(g=>g.types);
 if(!config||!Number.isInteger(config.index)||!Array.isArray(config.types)||!config.types.length||new Set(config.types).size!==config.types.length||config.types.some(type=>!allowed.includes(type)))throw Error('Affectation de processus invalide.');
 Parallel.sameSources(Audit.sources(),config.sources);
 for(const type of config.types){
  const destination=Parallel.partFile(config.folder,type);
  if(fs.existsSync(destination)){
   const prior=JSON.parse(fs.readFileSync(destination,'utf8'));
   if(prior.complete===true){Parallel.validatePart(prior,{...config,type});console.log(JSON.stringify({event:'inspection-audit-resumed',type,plans:prior.report.records.length}));continue;}
  }
  const partial=progress=>Parallel.atomicJSON(destination,{version:1,kind:'inspection-audit-part',jobId:config.jobId,type,complete:false,progress:{plans:progress.records.length,expectedPlans:Registry.VARIANTS_PER_TYPE,lastId:progress.record.id},report:{sourceHash:progress.sourceHash,sources:progress.sources,records:progress.records}});
  const report=Audit.auditTypes({types:[type],onRecord:partial});
  Parallel.sameSources(Audit.sources(),config.sources);
  const part={version:1,kind:'inspection-audit-part',jobId:config.jobId,type,complete:true,report};
  Parallel.atomicJSON(destination,part);
  Parallel.validatePart(part,{...config,type});
  console.log(JSON.stringify({event:'inspection-audit-type-complete',worker:config.index,type,...report.summary}));
 }
}
if(require.main===module){
 const abandoned=()=>process.exit(1);process.once('disconnect',abandoned);
 try{work(JSON.parse(process.argv[2]));process.removeListener('disconnect',abandoned);if(process.connected)process.disconnect();}
 catch(error){console.error(error.stack||error);process.exitCode=1;process.removeListener('disconnect',abandoned);if(process.connected)process.disconnect();}
}
module.exports={work};
