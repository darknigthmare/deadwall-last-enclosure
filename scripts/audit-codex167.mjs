import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('../src/codex-coverage167.js'),P=require('../src/codex-plan165.js'),{createAuditScope}=require('./codex-audit-scope162.cjs');
const audit=createAuditScope(process.argv.slice(2),{includeContext:true,allowAllModels:true});
const all=audit.flags.has('--all-models'),output=path.resolve(process.env.DEADWALL_QA_OUTPUT||'artifacts/qa/codex-coverage167');fs.mkdirSync(output,{recursive:true});
const summary=C.catalogue();fs.writeFileSync(path.join(output,'catalogue.json'),JSON.stringify(summary,null,2)+'\n');
const sourceFile=fs.openSync(path.join(output,'source-gaps.jsonl'),'w'),modelFile=fs.openSync(path.join(output,'model-gaps.jsonl'),'w');
const chosen=new Set(),counts={programmes:0,compatible:0,models:0,sourceFamilies:summary.families.length,unmaterialized:0,exteriorSimplifications:0,furnitureBelowMinimum:0,newLootRecords:0};
try{
 for(const rec of audit.records){const eligible=audit.visit(rec),s=C.source(rec.id);counts.programmes++;
  fs.writeSync(sourceFile,JSON.stringify({id:s.id,parent:s.parent,family:s.family,contextCompatible:s.contextCompatible,axes:s.axes,sourceGaps:s.sourceGaps})+'\n');
  if(!eligible)continue;counts.compatible++;
  if(!all&&chosen.has(s.family))continue;chosen.add(s.family);
  for(const z of audit.levelsFor(rec)){const report=C.compare(P.inspect(rec.id,17117,z));audit.floor(rec,z);counts.models++;
   for(const k of ['unmaterialized','exteriorSimplifications','furnitureBelowMinimum','newLootRecords'])counts[k]+=report.totals[k];
   fs.writeSync(modelFile,JSON.stringify({id:rec.id,seed:17117,z,detailVersion:5,totals:report.totals,issues:report.issues,layers:report.layers})+'\n');
  }
 }
}finally{fs.closeSync(sourceFile);fs.closeSync(modelFile);}
if(counts.newLootRecords)throw Error('New loot in decorative layers');
const metadata=audit.finish({programmes:counts.programmes,compatible:counts.compatible,floors:counts.models},{sampledModels:!all});
const result={scope:`Source coverage for ${counts.programmes} selected catalogue records; ${all?'all eligible model floors':'one eligible programme per source family'} inspected. Isolated recipe audit, not independent native architecture counts.`,...metadata,...counts};
fs.writeFileSync(path.join(output,'run.json'),JSON.stringify(result,null,2)+'\n');
console.log('AUDIT167 '+JSON.stringify(result));
