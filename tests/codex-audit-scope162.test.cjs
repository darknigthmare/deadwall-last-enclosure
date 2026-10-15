'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createAuditScope}=require('../scripts/codex-audit-scope162.cjs');
const selected=['--programme','DW-0001','--programme','DW-3001','--programme','DW-0300'];
function complete(audit){
 const actual={programmes:0,compatible:0,floors:0};
 for(const rec of audit.records){actual.programmes++;if(!audit.visit(rec))continue;actual.compatible++;for(const z of audit.levelsFor(rec)){audit.floor(rec,z);actual.floors++;}}
 return{actual,report:audit.finish(actual)};
}
test('162 audit accounting retains all4000 identities and separates historical recipes, independent records and G10 exclusions',()=>{
 const audit=createAuditScope(),counts=audit.expected;
 assert.equal(counts.programmes,4000);assert.equal(counts.compatible,3374);assert.equal(counts.floors,4426);
 const {report}=complete(audit);
 assert.deepEqual(report.auditedGroups.historical,{programmes:3000,catalogueCompatible:3000,compatible:2374,floors:2951});
 assert.deepEqual(report.auditedGroups.independent,{programmes:1000,catalogueCompatible:1000,compatible:1000,floors:1475});
 assert.equal(report.excludedContextualProgrammes.length,626);assert.equal(report.selection,'complete-catalogue');
});
test('162 explicit native, independent and G10 samples keep their actual scope instead of claiming a whole catalogue run',()=>{
 const audit=createAuditScope(selected),{report}=complete(audit);
 assert.equal(report.selection,'explicit-programmes');assert.equal(report.catalogueProgrammes,4000);
 assert.deepEqual(report.requestedProgrammes,['DW-0001','DW-3001','DW-0300']);assert.deepEqual(report.excludedContextualProgrammes,['DW-0300']);
 assert.equal(report.auditedGroups.historical.programmes,2);assert.equal(report.auditedGroups.historical.compatible,1);assert.equal(report.auditedGroups.independent.compatible,1);
});
test('162 source coverage can inspect G10 while older furnishing audits exclude its revision11-only layer',()=>{
 const audit=createAuditScope(selected,{includeContext:true}),{report}=complete(audit);
 assert.equal(report.auditedGroups.historical.compatible,2);assert.deepEqual(report.excludedContextualProgrammes,[]);
 assert.equal(report.exclusionReason,null);
});
test('162 incomplete old3000-only totals or omitted programme/floor cannot certify the4000 catalogue',()=>{
 const audit=createAuditScope();assert.throws(()=>audit.finish({programmes:3000,compatible:2374,floors:2951}),/divergents|incomplet/);
 const partial=createAuditScope(['--programme','DW-0001']),rec=partial.records[0];assert.ok(partial.visit(rec));
 assert.throws(()=>partial.finish({programmes:1,compatible:1,floors:0}),/incomplet/);
 assert.throws(()=>partial.visit(rec),/deux fois/);partial.floor(rec,partial.levelsFor(rec)[0]);assert.throws(()=>partial.floor(rec,partial.levelsFor(rec)[0]),/deux fois/);
});
test('162 programme filters reject unknown, duplicated and malformed selections before model generation',()=>{
 for(const args of [['--programme'],['--programme','DW-9999'],['--programme','../DW-0001'],['--programme','DW-0001','--programme','DW-0001'],['--limit','0'],['--all-models']])assert.throws(()=>createAuditScope(args));
 const audit=createAuditScope(['--all-models',...selected],{allowAllModels:true,includeContext:true});assert.ok(audit.flags.has('--all-models'));
});
