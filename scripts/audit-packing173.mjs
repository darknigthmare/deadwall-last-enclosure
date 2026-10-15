import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js');
const output=path.resolve('artifacts/qa/packing173-audit');fs.mkdirSync(output,{recursive:true});const file=fs.openSync(path.join(output,'models.jsonl'),'w');
const out={scope:'Seed 17117; isolated recipes, not distinct native buildings or naturally explored sites.',seed:17117,programmes:0,compatible:0,floors:0,added:0,interior:0,outdoor:0,before:0,after:0,newLoot:0,kinds:{},refusals:{}};
try{for(const rec of R.records){out.programmes++;if(!C.source(rec.id).contextCompatible)continue;out.compatible++;
 for(const z of R.template(rec.id).levels){const a=P.inspect(rec.id,17117,z,9),b=P.inspect(rec.id,17117,z,10),layer=b.details.packing173;
  assert.deepEqual(a.p,b.p);assert.deepEqual(a.plan,b.plan);assert.deepEqual(b.details.interior.filter(o=>!o.packing173),a.details.interior);assert.deepEqual(b.details.outdoor.filter(o=>!o.packing173),a.details.outdoor);
  const before=C.compare(a).totals,after=C.compare(b).totals;assert.equal(after.newLootRecords,0);assert.equal(before.unmaterialized,after.unmaterialized);assert.equal(before.exteriorSimplifications,after.exteriorSimplifications);assert.ok(after.furnitureBelowMinimum<=before.furnitureBelowMinimum);
  out.floors++;out.added+=layer.added;out.before+=before.furnitureBelowMinimum;out.after+=after.furnitureBelowMinimum;
  for(const part of ['interior','outdoor'])for(const o of b.details[part].filter(o=>o.packing173)){out[part]++;out.kinds[o.kind]=(out.kinds[o.kind]||0)+1;assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);}
  for(const r of layer.requests)if(r.unplaced)out.refusals[r.reason]=(out.refusals[r.reason]||0)+r.unplaced;
  fs.writeSync(file,JSON.stringify({id:rec.id,parent:rec.parent,family:rec.family,z,added:layer.added,before:before.furnitureBelowMinimum,after:after.furnitureBelowMinimum,requests:layer.requests})+'\n');
 }
 if(out.programmes%300===0)console.log('AUDIT173_PROGRESS '+JSON.stringify({programmes:out.programmes,floors:out.floors,added:out.added}));
}}finally{fs.closeSync(file);}
assert.equal(out.programmes,3000);assert.equal(out.compatible,2374);assert.equal(out.floors,2951);out.resolved=out.before-out.after;fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(out,null,2)+'\n');console.log('AUDIT173_COMPLETE '+JSON.stringify(out));
