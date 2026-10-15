import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js');
const {createAuditScope}=require('./codex-audit-scope162.cjs'),audit=createAuditScope();
const output=path.resolve(process.env.DEADWALL_QA_OUTPUT||'artifacts/qa/infill169');fs.mkdirSync(output,{recursive:true});
const records=fs.openSync(path.join(output,'models.jsonl'),'w');
const summary={scope:'Isolated recipes, seed 17117, revisions 6 and 7. Counts include inherited variants, not independent assets or real-world site population.',seed:17117,programmes:0,compatible:0,floors:0,added:0,interior:0,outdoor:0,zones:0,unplaced:0,sourceMinimumBefore:0,sourceMinimumAfter:0,exteriorShellBefore:0,exteriorShellAfter:0,newLoot:0,kinds:{},families:{},refusals:{}};
try{
 for(const rec of audit.records){summary.programmes++;if(!audit.visit(rec))continue;summary.compatible++;
  for(const z of audit.levelsFor(rec)){audit.floor(rec,z);const before=P.inspect(rec.id,17117,z,6,rec.independent?9:8),after=P.inspect(rec.id,17117,z,7,rec.independent?9:8),layer=after.details.infill169;
   assert.deepEqual(after.p,before.p);assert.deepEqual(after.plan,before.plan);assert.deepEqual(after.details.interior.filter(o=>!o.infill169),before.details.interior);assert.deepEqual(after.details.outdoor.filter(o=>!o.infill169),before.details.outdoor);
   const old=C.compare(before),now=C.compare(after);assert.equal(now.totals.newLootRecords,0);assert.ok(now.totals.furnitureBelowMinimum<=old.totals.furnitureBelowMinimum);
   summary.floors++;summary.added+=layer.added;summary.zones+=layer.zones.length;summary.unplaced+=layer.requests.reduce((n,r)=>n+r.unplaced,0);summary.sourceMinimumBefore+=old.totals.furnitureBelowMinimum;summary.sourceMinimumAfter+=now.totals.furnitureBelowMinimum;summary.exteriorShellBefore+=old.totals.exteriorSimplifications;summary.exteriorShellAfter+=now.totals.exteriorSimplifications;
   for(const [part,list] of [['interior',after.details.interior],['outdoor',after.details.outdoor]])for(const o of list.filter(o=>o.infill169)){summary[part]++;summary.kinds[o.kind]=(summary.kinds[o.kind]||0)+1;summary.families[rec.family]=(summary.families[rec.family]||0)+1;assert.equal(o.resource,undefined);assert.equal(o.amount,undefined);}
   for(const r of layer.requests)if(r.unplaced)summary.refusals[r.reason]=(summary.refusals[r.reason]||0)+r.unplaced;
   fs.writeSync(records,JSON.stringify({id:rec.id,parent:rec.parent,family:rec.family,z,added:layer.added,zones:layer.zones,requests:layer.requests,sourceMinimumBefore:old.totals.furnitureBelowMinimum,sourceMinimumAfter:now.totals.furnitureBelowMinimum,unsolvedExteriorShell:now.totals.exteriorSimplifications})+'\n');
  }
 }
}finally{fs.closeSync(records);}
summary.audit=audit.finish(summary);assert.equal(summary.exteriorShellBefore,summary.exteriorShellAfter);
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log('INFILL169_AUDIT '+JSON.stringify(summary));
