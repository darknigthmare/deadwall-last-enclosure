import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url),C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),D=require('../src/seed-detail157.js'),R=require('../src/codex3000-runtime.js'),Context=require('../src/codex-context160.js'),Geometry=require('../src/codex-geometry160.js'),M=require('../src/metric-contract174.js'),W=require('../src/frontier-world.js'),F=require('../src/frontage174.js'),V=require('../src/vehicle-art152.js'),H=require('../src/assets136.js'),A=require('../src/world-variants158.js');
const output=path.resolve('artifacts/qa/metric174');fs.mkdirSync(output,{recursive:true});
const definitions=[],record=(id,kind,w,h,source,role='ground',domain='region',extra={})=>{const row=M.diagnose({id,kind,bounds:{x:0,y:0,w,h},source,role,domain});definitions.push({...row,...extra});assert.equal(row.errors.length,0,id);return row;};
for(const [kind,p] of Object.entries(C.WorldEvolution.RULES.vehicles)){
 const source=V.SPRITES[kind]?.rect||H.VEHICLE_CUTS174[H.VEHICLE_SPRITES139[kind]||H.VEHICLE_SPRITES140[kind]],oldWidth=Math.min(p.w/source[2],p.h/source[3])*source[2];
 const alt=A.VEHICLES[kind].rect,altWidth=Math.min(p.w/alt[2],p.h/alt[3])*alt[2];
 record('vehicle:'+kind,kind,p.w,p.h,'core.WorldEvolution.RULES.vehicles','ground','region',{renderMode:'reviewed-plan-view',legacyVisibleWidths:[oldWidth,altWidth],correctedVisibleWidth:p.w,
  oldLocalMetres:{length:H.vehicleSize139(p,'local',false).w/32,width:H.vehicleSize139(p,'local',false).h/32},optInLocalMetres:{length:H.vehicleSize139(p,'local',true).w/32,width:H.vehicleSize139(p,'local',true).h/32}});
}
for(const [kind,shape] of Object.entries(G.SHAPES))record('prop:'+kind,kind,shape[0],shape[1],'frontier-geometry.SHAPES','upright','region',{pixelCalibration:'individual-upright-source-review-required',height:'not-encoded-in-this-2D-footprint'});
for(const [kind,shape] of Object.entries(D.objects))record('detail:'+kind,kind,shape[0],shape[1],'seed-detail157.objects',kind==='tree'?'canopy':shape[2]?'upright':'surface','region',{pixelCalibration:'ground-bounds-known; height-and-support-review-required'});
for(const p of G.PRESETS)record('native:'+p.id,p.id,p.w,p.h,'frontier-geometry.PRESETS','ground','region',{levels:p.levels});
for(const [id,p] of Object.entries(C.BUILDINGS))record('d17:'+id,id,p.size[0]*32,p.size[1]*32,'core.BUILDINGS.size × CELL','ground','local',{calibration:'existing-construction-footprint; human-architectural-realism-not-certified'});
const allKinds=new Set([...Object.keys(G.SHAPES),...Object.keys(D.objects)]),unknown=new Map();let totalFloors=0,totalProps=0,templateAdapted=0;
for(const rec of R.records){const context=Context.get(rec.id),base=context?Context.preset('codex160-'+rec.id.slice(3)):R.preset('codex3000-'+rec.id.slice(3));assert.ok(base,rec.id+' missing executable preset');
 const p={...base,id:'P0001',type:base.id,x:0,y:0,a:0,parking:[],outdoor:[],generation:context?10:9,...(context?{programme160:rec.id,context160:context}:{programme3000:rec.id})};
 const t=R.template(rec.id);if(t.adapted)templateAdapted++;
 record(rec.id,base.id,base.w,base.h,context?'codex-context160.preset':'codex3000-runtime.preset','ground','region',{family:rec.family,parent:rec.parent,levels:base.levels,adapted:t.adapted,sourceReference:t.reference});
 for(const z of p.levels){const pl=context?Geometry.plan(p,17117,z):R.floor(rec.id,17117,z,p.id);totalFloors++;
  for(const o of pl.objects){totalProps++;assert.ok(M.rectangle(o),rec.id+' invalid object '+o.id);if(!allKinds.has(o.kind)){if(!unknown.has(o.kind))unknown.set(o.kind,{kind:o.kind,count:0,example:rec.id});unknown.get(o.kind).count++;}}
 }
}
fs.writeFileSync(path.join(output,'definitions.json'),JSON.stringify({scope:'metre contract inventory, not independent artistic certification of all pixels',definitions,programmes:R.records.length,floors:totalFloors,objects:totalProps,templateAdapted,extraContextKinds:[...unknown.values()]},null,2)+'\n');
const frontages=[];
for(const seed of [0,42,17117]){const w=W.create(seed,10);let corrected=0,accepted=0;const refused=[];
 for(const p of w.pois){const result=w.frontageFor(p);if(!result.ok){refused.push(result);continue;}accepted++;if(result.corrected)corrected++;
  const r=w.roads.find(x=>x.id===result.roadId);assert.ok(r);assert.ok(Math.abs(G.nearest(result.surface.a,r.a,r.b).d-r.width/2)<1e-5,p.id+' not on near edge');
  assert.ok(result.removedLength>=0);assert.deepEqual(result.surface.b,p.drive.b);assert.equal(F.groupConflicts(result,p,w.nearPOI((result.surface.a.x+result.surface.b.x)/2,(result.surface.a.y+result.surface.b.y)/2,100)).length,0);
 }
 frontages.push({seed,sites:w.pois.length,accepted,corrected,refused});
}
fs.writeFileSync(path.join(output,'frontages.json'),JSON.stringify(frontages,null,2)+'\n');
const probe=directory=>{const p=spawnSync(process.execPath,['scripts/metric174-world-probe.cjs',directory],{encoding:'utf8',maxBuffer:4e6});if(p.status!==0)throw Error(p.stderr);return JSON.parse(p.stdout);};
const current=probe('.'),baselineIndex=process.argv.indexOf('--baseline'),baseline=baselineIndex<0?null:probe(process.argv[baselineIndex+1]);
if(baseline)assert.deepEqual(current,baseline,'Historical geometry, detail, finite containers or scatter changed');
fs.writeFileSync(path.join(output,'historical-fingerprints.json'),JSON.stringify({baselineVerified:!!baseline,current,baseline},null,2)+'\n');
const summary={programmes:R.records.length,definitionRecords:definitions.length,floors:totalFloors,objectOccurrences:totalProps,vehicleProfiles:9,nativeTypes:G.PRESETS.length,constructionTypes:Object.keys(C.BUILDINGS).length,
 frontageSeeds:frontages.length,sites:frontages.reduce((n,r)=>n+r.sites,0),connected:frontages.reduce((n,r)=>n+r.accepted,0),corrected:frontages.reduce((n,r)=>n+r.corrected,0),refused:frontages.reduce((n,r)=>n+r.refused.length,0),baselineVerified:!!baseline,
 scope:'Definition footprint inventory + actual source immutability + frontage geometry. Upright sprites and height/visual overlap remain separate artistic review.'};
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
