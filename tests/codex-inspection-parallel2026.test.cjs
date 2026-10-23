'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const A=require('../scripts/audit-codex-inspection2026.cjs');
const P=require('../scripts/audit-codex-inspection-parallel2026.cjs');
const {sourceHash}=require('../scripts/compile-codex-inspection2026.cjs');
const Layouts=require('../src/codex-layouts2026.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const types=['EXT-MONDE-T001','EXT-MONDE-T002'],sources=[{path:'a.js',sha256:'a'.repeat(64),bytes:12}],hash='b'.repeat(64),jobId='c'.repeat(64);
const options={types,sourceHash:hash,sources,jobId};
function row(type,number){return {id:type+'-V'+String(number).padStart(2,'0'),typologyId:type,number,scope:'inspection-only',campaignPlayable:0,pass:true,errors:[],
 authorPlanSha256:'d'.repeat(64),geometryFingerprint:'01234567',sourcePlanUnchanged:true,furnishingAudit:true,physicalAudit:true,serviceFrontsReachable:true,entryToRoomsReachable:true,
 rooms:2,furnishedRooms:2,props:4,requested:5,refused:1,unknownUses:0,levels:1,walls:12,transitions:0,lootContainersCreated:0,connectedServices:0};}
function part(type){return {version:1,kind:'inspection-audit-part',jobId,type,complete:true,report:{version:1,partial:true,scope:'inspection-only',campaignPlayable:0,actorRadiusM:.32,sourceHash:hash,sources:clone(sources),records:Array.from({length:50},(_,i)=>row(type,i+1)),failures:[],summary:{props:999999},types:[]}};}
const parts=()=>types.map(part);

test('parallel inspection recomputes totals and exact order without trusting worker summaries',()=>{
 const value=parts(),before=JSON.stringify(value),report=P.aggregateParts([...value].reverse(),options);
 assert.equal(report.records.length,100);assert.equal(report.summary.types,2);assert.equal(report.summary.props,400);assert.equal(report.summary.refused,100);assert.equal(report.summary.requested,500);assert.equal(report.summary.passed,100);
 assert.equal(report.records[0].id,types[0]+'-V01');assert.equal(report.records[99].id,types[1]+'-V50');
 assert.equal(report.partial,undefined);assert.equal(report.campaignPlayable,0);assert.deepEqual(report.sources,sources);assert.equal(JSON.stringify(value),before);
 for(const type of types)assert.deepEqual(report.types.find(t=>t.typologyId===type),{typologyId:type,...A.aggregate(value.find(p=>p.type===type).report.records)});
});

test('parallel inspection rejects missing types, duplicate parts and duplicate or absent rows',()=>{
 assert.throws(()=>P.aggregateParts(parts().slice(0,1),options),/incomplet/);
 assert.throws(()=>P.aggregateParts([part(types[0]),part(types[0])],options),/dupliquée/);
 for(const mutate of [p=>p[0].report.records.pop(),p=>p[0].report.records[1]=p[0].report.records[0],p=>p[0].report.records[0].number=0,p=>p[0].report.records[0].typologyId=types[1],p=>p[0].type='EXT-MONDE-T999']){
  const value=parts();mutate(value);assert.throws(()=>P.aggregateParts(value,options));
 }
});

test('parallel inspection rejects interrupted, stale, failed and falsely accepted receipts',()=>{
 const mutations=[p=>p.complete=false,p=>p.jobId='foreign',p=>p.report.sourceHash='old',p=>p.report.sources[0].sha256='f'.repeat(64),p=>p.report.sources[0].bytes++,p=>p.report.sources=[],p=>p.report.failures.push({code:'failure'}),
  p=>p.report.records[0].pass=false,p=>p.report.records[0].errors.push('blocked'),p=>p.report.records[0].physicalAudit=false,p=>p.report.records[0].sourcePlanUnchanged=false,p=>p.report.records[0].authorPlanSha256='missing',
  p=>p.report.records[0].props=-1,p=>p.report.records[0].props++,p=>p.report.records[0].connectedServices=1,p=>p.report.records[0].scope='campaign',p=>p.report.records[0].furnishedRooms=99];
 for(const mutate of mutations){const value=parts();mutate(value[0]);assert.throws(()=>P.aggregateParts(value,options));}
});

test('parallel inspection includes its executable algorithms in the exact byte provenance',()=>{
 for(const file of ['scripts/audit-codex-inspection2026.cjs','scripts/audit-codex-inspection-parallel2026.cjs','scripts/audit-codex-inspection-worker2026.cjs','scripts/compile-codex-inspection2026.cjs'])assert.ok(A.SOURCE_FILES.includes(file),file);
 const inventory=A.sources();assert.equal(P.sameSources(inventory,A.sources()),true);
 const modified=clone(inventory);modified[0].bytes++;assert.throws(()=>P.sameSources(modified,inventory),/modifiée/);
 assert.equal(Layouts.sourceHash,sourceHash(path.resolve(__dirname,'..')));
});

test('parallel checkpoints are atomic JSON, keep interrupted progress and refuse unsafe IDs',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-audit-part-'));
 try{
  const file=P.partFile(folder,types[0]);P.atomicJSON(file,{complete:false,progress:{plans:4}});assert.equal(JSON.parse(fs.readFileSync(file)).progress.plans,4);
  P.atomicJSON(file,part(types[0]));assert.equal(P.validatePart(JSON.parse(fs.readFileSync(file)),{...options,type:types[0]}).length,50);
  assert.deepEqual(fs.readdirSync(folder),[types[0]+'.json']);
  assert.throws(()=>P.partFile(folder,'../outside'));assert.throws(()=>P.partFile(folder,'EXT-MONDE-T001/file'));
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});

test('partial audit is explicit and never silently filters auditAll',()=>{
 assert.throws(()=>A.auditTypes(),/explicite/);assert.throws(()=>A.auditTypes({types:[]}),/Sélection/);assert.throws(()=>A.auditTypes({types:['EXT-MONDE-T999']}),/Sélection/);
 const body=fs.readFileSync(require.resolve('../scripts/audit-codex-inspection2026.cjs'),'utf8');
 assert.match(body,/function auditAll\(\{write=false,output=OUTPUT\}=\{\}\)\{return auditSelection\(\{write,output\}\);\}/);
 assert.match(body,/runParallel\(\)/);assert.doesNotMatch(body,/skip|onlyPassing/);
});

test('audit CLI exports its API before the parallel runner resolves the circular require',async()=>{
 const vm=require('node:vm'),{createRequire}=require('node:module');
 const filename=require.resolve('../scripts/audit-codex-inspection2026.cjs'),realRequire=createRequire(filename),entry={exports:{}};
 let started=false;
 const mockRequire=name=>name==='./audit-codex-inspection-parallel2026.cjs'?{runParallel:()=>{
  started=true;assert.equal(typeof entry.exports.sources,'function');assert.equal(typeof entry.exports.auditTypes,'function');
  return Promise.resolve({scope:'inspection-only',summary:{types:0},failures:[]});
 }}:realRequire(name);
 mockRequire.main=entry;
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),{require:mockRequire,module:entry,__dirname:path.dirname(filename),console:{log(){},error(){}},process:{exitCode:0}},{filename});
 await Promise.resolve();assert.equal(started,true);
});
