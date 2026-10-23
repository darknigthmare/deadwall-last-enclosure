'use strict';
// Reproducible integration evidence. Does not close campaign acceptance tasks.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const Registry=require('./codex-generators2026.cjs');
const {sourceHash}=require('./compile-codex-inspection2026.cjs');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT='docs/codex/suivi-monde2026/inspection-20261023.json';
const SOURCE_FILES=Object.freeze([
  ...Registry.COMPILATION_SOURCES,
  'src/codex-layouts2026.js',
  'src/codex-physical2026.js',
  'src/codex-furnishings2026.js',
  'src/codex-inspection2026.js',
  'src/frontier-geometry.js',
  'src/seed-detail157.js',
  'src/core.js'
]);
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const sources=()=>SOURCE_FILES.map(name=>{
  const data=fs.readFileSync(path.join(ROOT,name));
  return {path:name,sha256:sha256(data),bytes:data.length};
});
const SUM_FIELDS=['rooms','furnishedRooms','props','requested','refused','unknownUses','levels','walls','transitions','lootContainersCreated','connectedServices'];
function aggregate(records){
  return {plans:records.length,passed:records.filter(r=>r.pass).length,
    ...Object.fromEntries(SUM_FIELDS.map(key=>[key,records.reduce((sum,r)=>sum+(r[key]||0),0)]))};
}
function auditAll({write=false,output=OUTPUT}={}){
  const before=sources();
  const Layouts=require('../src/codex-layouts2026.js');
  const Service=require('../src/codex-inspection2026.js');
  const Physical=require('../src/codex-physical2026.js');
  const Furniture=require('../src/codex-furnishings2026.js');
  const generators=Registry.generators();
  const types=generators.flatMap(g=>g.types),records=[],failures=[];
  const compiledHash=sourceHash(ROOT);
  if(Layouts.sourceHash!==compiledHash)failures.push({code:'stale-compiled-layouts',expected:compiledHash,actual:Layouts.sourceHash});
  for(const type of types)for(let number=1;number<=50;number++){
    const record={id:type+'-V'+String(number).padStart(2,'0'),typologyId:type,number,scope:'inspection-only',campaignPlayable:0,pass:false,errors:[]};
    try{
      const generator=generators.find(g=>g.types.includes(type)).api;
      const source=generator.build(type,number),sourceJson=JSON.stringify(source);
      assert.equal(generator.audit(source).ok,true,'Author layout rejected by its generator.');
      const session=Service.create(type,number),{author,scene,furnishing}=session;
      record.id=author.id;
      assert.equal(JSON.stringify(author),sourceJson,'Compiled author plan differs from its source generator.');
      record.authorPlanSha256=sha256(sourceJson);
      const furnishingAudit=Furniture.audit(author,furnishing),physicalAudit=Physical.audit(scene);
      assert.equal(furnishingAudit.ok,true,JSON.stringify(furnishingAudit.errors));
      assert.equal(physicalAudit.ok,true,JSON.stringify(physicalAudit.errors));
      assert.equal(JSON.stringify(author),sourceJson,'Inspection mutated the author plan.');
      assert.equal(furnishing.summary.unknownUses,0,'Undocumented room use.');
      assert.equal(furnishing.summary.requested,furnishing.props.length+furnishing.unplaced.length,'Unaccounted furniture request.');
      assert.equal(furnishing.summary.lootContainersCreated,0);
      assert.equal(furnishing.summary.connectedServices,0);
      assert.equal(author.playable,false);assert.equal(scene.playable,false);assert.equal(furnishing.playable,false);
      assert.ok(Object.isFrozen(author)&&Object.isFrozen(scene)&&Object.isFrozen(furnishing));
      assert.ok(Object.isFrozen(furnishing.props));
      assert.ok(furnishing.props.every(p=>Object.isFrozen(p)&&p.lootAssigned===false&&p.utilityConnected===false));
      for(const room of furnishing.rooms){
        const items=furnishing.props.filter(p=>p.roomId===room.id);
        assert.ok(items.length<=Furniture.RULES.maxPerRoom);
        if(items.length)assert.equal(Furniture.accessibility(room,items).ok,true,room.id+' service front inaccessible');
      }
      const metrics={rooms:physicalAudit.rooms,furnishedRooms:furnishing.summary.furnishedRooms,
        props:furnishing.props.length,requested:furnishing.requests.length,refused:furnishing.unplaced.length,
        unknownUses:furnishing.summary.unknownUses,levels:scene.levels.length,walls:scene.walls.length,
        transitions:scene.transitions.length,lootContainersCreated:0,connectedServices:0};
      assert.equal(metrics.rooms,furnishing.rooms.length,'Circulation incorrectly counted as a furnished room.');
      assert.ok(metrics.props>0);
      Object.assign(record,metrics,{pass:true,sourcePlanUnchanged:true,furnishingAudit:true,physicalAudit:true,
        serviceFrontsReachable:true,entryToRoomsReachable:true,geometryFingerprint:session.state.geometry});
    }catch(error){
      record.errors.push(String(error.message));
      failures.push({id:record.id,code:'inspection-failed',errors:record.errors});
    }
    records.push(record);
  }
  const after=sources();
  for(let i=0;i<before.length;i++)if(before[i].sha256!==after[i].sha256)failures.push({code:'source-changed-during-audit',path:before[i].path});
  const report={version:1,generatedAt:new Date().toISOString(),scope:'inspection-only',campaignPlayable:0,
    actorRadiusM:Physical.DEFAULT_RADIUS,sourceHash:Layouts.sourceHash,sources:after,
    summary:{types:types.length,...aggregate(records),campaignPlayable:0},
    types:types.map(type=>({typologyId:type,...aggregate(records.filter(r=>r.typologyId===type))})),records,failures};
  if(write){
    const destination=path.resolve(ROOT,output);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
  }
  return report;
}
if(require.main===module){
  const report=auditAll({write:true});
  console.log(JSON.stringify({scope:report.scope,...report.summary,failures:report.failures.length,output:OUTPUT}));
  if(report.failures.length)process.exitCode=1;
}
module.exports={auditAll,OUTPUT,SOURCE_FILES};
