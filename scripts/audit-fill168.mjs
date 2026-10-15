import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js');
const {createAuditScope}=require('./codex-audit-scope162.cjs'),audit=createAuditScope();
const output=path.resolve(process.env.DEADWALL_QA_OUTPUT||'artifacts/qa/fill168-audit');fs.mkdirSync(output,{recursive:true});
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const report={scope:'Isolated authored recipe comparison, one seed, selected compatible native model floors; G10 contextual furnishings belong to revision11. Counts include inherited variants; not independent architecture or sprite counts.',seed:17117,fromRevision:5,toRevision:6,programmes:0,compatible:0,floors:0,added:0,missingBefore:0,missingAfter:0,unmaterialized:0,exteriorSimplifications:0,newLootRecords:0,types:{},families:{}};
const out=fs.openSync(path.join(output,'comparisons.jsonl'),'w');
try{for(const rec of audit.records){report.programmes++;if(!audit.visit(rec))continue;report.compatible++;
 for(const z of audit.levelsFor(rec)){audit.floor(rec,z);const before=P.inspect(rec.id,17117,z,5),after=P.inspect(rec.id,17117,z,6);
  assert.equal(hash(after.p),hash(before.p),rec.id+' parcel changed');assert.equal(hash(after.plan),hash(before.plan),rec.id+' source floor changed');
  assert.equal(hash(after.details.outdoor),hash(before.details.outdoor),rec.id+' old exterior changed');
  assert.equal(hash(after.details.interior.filter(o=>!o.fill168)),hash(before.details.interior),rec.id+' old furniture changed');
  const a=C.compare(before),b=C.compare(after),extras=after.details.interior.filter(o=>o.fill168),counts=after.details.fill168;
  assert.equal(b.totals.newLootRecords,0);assert.ok(b.totals.furnitureBelowMinimum<=a.totals.furnitureBelowMinimum,rec.id+' source shortage increased');
  assert.equal(b.totals.unmaterialized,a.totals.unmaterialized);assert.equal(b.totals.exteriorSimplifications,a.totals.exteriorSimplifications);
  for(const o of extras){assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);report.types[o.kind]=(report.types[o.kind]||0)+1;}
  const row={id:rec.id,parent:rec.parent,family:rec.family,z,added:extras.length,before:a.totals.furnitureBelowMinimum,after:b.totals.furnitureBelowMinimum,navigationChecked:counts.navigationChecked,remaining:counts.requests.filter(r=>r.unplaced>0).map(r=>({room:r.name,kind:r.kind,missing:r.unplaced,reason:r.reason}))};
  fs.writeSync(out,JSON.stringify(row)+'\n');report.floors++;report.added+=extras.length;report.missingBefore+=row.before;report.missingAfter+=row.after;report.unmaterialized+=b.totals.unmaterialized;report.exteriorSimplifications+=b.totals.exteriorSimplifications;
  if(!report.families[rec.family])report.families[rec.family]={floors:0,added:0,missingBefore:0,missingAfter:0};const f=report.families[rec.family];f.floors++;f.added+=row.added;f.missingBefore+=row.before;f.missingAfter+=row.after;
 }
}}finally{fs.closeSync(out);}
report.audit=audit.finish(report);if(report.audit.selection==='complete-catalogue')assert.ok(report.added>0&&report.missingAfter<report.missingBefore);
report.shortageReduction=report.missingBefore-report.missingAfter;report.pass=true;
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('FILL168_AUDIT '+JSON.stringify(report));
