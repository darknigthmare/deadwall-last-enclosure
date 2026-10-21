'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const Targets=require('../scripts/codex-tracker-targets2026.cjs'),Foundation=require('../scripts/codex-progress2026.cjs'),Maritime=require('../scripts/codex-maritime-progress2026.cjs'),Inspection=require('../scripts/codex-inspection-progress2026.cjs');
const root=path.resolve(__dirname,'..'),base=Maritime.patch(Foundation.patch(Targets.generate()).data).data;
test('le suivi ouvre seulement les chantiers effectivement commencés, sans fermer la campagne',()=>{
 const before=JSON.stringify(base),out=Inspection.patch(base,root);
 assert.equal(JSON.stringify(base),before);assert.equal(out.changes.inProgress.length,32);assert.equal(out.changes.inspectionVariants.length,400);assert.equal(out.changes.closed.length,0);assert.equal(out.changes.playableAdded,0);
 assert.deepEqual(Inspection.patch(out.data,root).data,out.data);
 for(const v of out.data.variants)if(v.inspection){assert.equal(v.playable,false);assert.equal(v.architecture,null);assert.equal(v.spawnWeight,null);assert.ok(v.inspection.rooms>0);}else assert.deepEqual(v,base.variants.find(o=>o.id===v.id));
 for(const task of out.data.tasks)if(!['architecture','props','sauvegarde','qa'].includes(task.stage))assert.deepEqual(task,base.tasks.find(o=>o.id===task.id));
});
test('une modification concurrente de statut est conservée par refus du patch',()=>{
 const data=JSON.parse(JSON.stringify(base));data.tasks.find(t=>t.typologyId==='EXT-MONDE-T065'&&t.stage==='props').status='Validé';
 assert.throws(()=>Inspection.patch(data,root),/concurrente/);
});
test('une preuve ancienne ou un identifiant dupliqué est refusé avant de modifier le suivi',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-inspection-proof-'));
 try{
  const original=JSON.parse(fs.readFileSync(path.join(root,Inspection.REPORT),'utf8'));
  for(const source of original.sources){const dest=path.join(folder,source.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,source.path),dest);}
  const output=path.join(folder,Inspection.REPORT);fs.mkdirSync(path.dirname(output),{recursive:true});
  const bad=JSON.parse(JSON.stringify(original));bad.records[1]=bad.records[0];fs.writeFileSync(output,JSON.stringify(bad));assert.throws(()=>Inspection.checkedReport(folder),/invalide/);
  const incomplete=JSON.parse(JSON.stringify(original));incomplete.sources.pop();fs.writeFileSync(output,JSON.stringify(incomplete));assert.throws(()=>Inspection.checkedReport(folder),/incomplète/);
  fs.writeFileSync(output,JSON.stringify(original));fs.appendFileSync(path.join(folder,original.sources[0].path),'\n// mutation de contrôle\n');assert.throws(()=>Inspection.checkedReport(folder),/périmée/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
