import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),R=require('../src/codex3000-runtime.js'),C=require('../src/codex-coverage167.js'),P=require('../src/codex-plan165.js');
const args=process.argv.slice(2),all=args.includes('--all-models'),output=path.resolve('artifacts/qa/codex-coverage167');fs.mkdirSync(output,{recursive:true});
const summary=C.catalogue();fs.writeFileSync(path.join(output,'catalogue.json'),JSON.stringify(summary,null,2)+'\n');
const sourceFile=fs.openSync(path.join(output,'source-gaps.jsonl'),'w'),modelFile=fs.openSync(path.join(output,'model-gaps.jsonl'),'w');
const chosen=new Set(),counts={programmes:0,models:0,sourceFamilies:summary.families.length,unmaterialized:0,exteriorSimplifications:0,furnitureBelowMinimum:0,newLootRecords:0};
try{
 for(const rec of R.records){const s=C.source(rec.id);counts.programmes++;
  fs.writeSync(sourceFile,JSON.stringify({id:s.id,parent:s.parent,family:s.family,contextCompatible:s.contextCompatible,axes:s.axes,sourceGaps:s.sourceGaps})+'\n');
  if(!s.contextCompatible||!all&&chosen.has(s.family))continue;chosen.add(s.family);
  for(const z of R.template(rec.id).levels){const report=C.compare(P.inspect(rec.id,17117,z));counts.models++;
   for(const k of ['unmaterialized','exteriorSimplifications','furnitureBelowMinimum','newLootRecords'])counts[k]+=report.totals[k];
   fs.writeSync(modelFile,JSON.stringify({id:rec.id,seed:17117,z,detailVersion:5,totals:report.totals,issues:report.issues,layers:report.layers})+'\n');
  }
 }
}finally{fs.closeSync(sourceFile);fs.closeSync(modelFile);}
if(counts.programmes!==3000||counts.newLootRecords)throw Error('Incomplete catalogue or new loot in decorative layers');
fs.writeFileSync(path.join(output,'run.json'),JSON.stringify({scope:'Source coverage for all 3000 cards; isolated recipe audit, not 3000 native architectures.',allModels:all,...counts},null,2)+'\n');
console.log('AUDIT167 '+JSON.stringify({allModels:all,...counts}));
