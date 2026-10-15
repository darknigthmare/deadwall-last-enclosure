import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js');
const {createAuditScope}=require('./codex-audit-scope162.cjs'),audit=createAuditScope();
const seed=17117,output=path.resolve(process.env.DEADWALL_QA_OUTPUT||'artifacts/qa/gardens171-audit');fs.mkdirSync(output,{recursive:true});const file=fs.openSync(path.join(output,'models.jsonl'),'w');
const out={scope:'Isolated Codex recipes; garden kits, not extra authored furniture minima or unique architectures.',seed,programmes:0,compatible:0,floors:0,added:0,groups:0,completeKits:0,missingKitParts:0,newLoot:0,kinds:{},profiles:{},refusals:{},examples:[]};
try{for(const rec of audit.records){out.programmes++;if(!audit.visit(rec))continue;out.compatible++;
 for(const z of audit.levelsFor(rec)){audit.floor(rec,z);const a=P.inspect(rec.id,seed,z,8),stamp=JSON.stringify([a.p,a.plan,a.details]);const b=R.gardens({seed,p:a.p,z,plan:a.plan,detail:a.details,programme:rec.id});
  assert.equal(JSON.stringify([a.p,a.plan,a.details]),stamp);assert.deepEqual(b.interior,a.details.interior);assert.deepEqual(b.outdoor.filter(o=>!o.garden171),a.details.outdoor);
  const layer=b.gardens171;out.floors++;out.added+=layer.added;out.groups+=layer.groups.length;
  for(const o of b.outdoor.filter(o=>o.garden171)){out.kinds[o.kind]=(out.kinds[o.kind]||0)+1;assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.functional171,false);}
  for(const g of layer.groups){out.profiles[g.profile]=(out.profiles[g.profile]||0)+1;if(g.complete)out.completeKits++;}
  for(const r of layer.requests)if(r.unplaced){out.missingKitParts+=r.unplaced;out.refusals[r.reason]=(out.refusals[r.reason]||0)+r.unplaced;}
  if(layer.added&&out.examples.length<12)out.examples.push({id:rec.id,seed,z,added:layer.added,profiles:layer.groups.map(g=>g.profile)});
  if(layer.groups.length)fs.writeSync(file,JSON.stringify({id:rec.id,parent:rec.parent,family:rec.family,z,layer})+'\n');
 }
 if(out.programmes%300===0)console.log('GARDENS171_PROGRESS '+JSON.stringify({programmes:out.programmes,floors:out.floors,added:out.added}));
}}finally{fs.closeSync(file);}
out.audit=audit.finish(out);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(out,null,2)+'\n');console.log('GARDENS171_COMPLETE '+JSON.stringify(out));
