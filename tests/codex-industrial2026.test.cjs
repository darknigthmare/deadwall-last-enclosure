'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../scripts/codex-industrial2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=v=>JSON.parse(JSON.stringify(v));
const make=()=>clone(M.build(M.TYPES[0],1));

test('industrie : 200 plans distincts et reproductibles, sans hasard ni attribution de campagne',()=>{
 const random=Math.random;Math.random=()=>{throw Error('Unexpected campaign randomness');};
 try{
  for(const type of M.TYPES){
   const signatures=new Set();
   for(let n=1;n<=50;n++){
    const p=M.build(type,n);assert.deepEqual(p,M.build(type,n));assert.equal(M.audit(p).ok,true,p.id);
    assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.buildings)&&Object.isFrozen(p.processFlow));
    signatures.add(JSON.stringify([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide])]));
    assert.equal(p.playable,false);assert.deepEqual(p.sourceIds,[]);assert.equal(p.heightOrigin,'author-design');
    assert.ok(p.network.externalPorts.every(port=>port.connectedToWorld===false));
    assert.ok(Object.values(p.operations).every(v=>v===0));
   }
   assert.equal(signatures.size,50,type);
  }
 }finally{Math.random=random;}
 assert.equal(M.auditAll().variants,200);
});

test('industrie : tous les sites et leurs cinq étapes de procédé sont physiquement reliés',()=>{
 for(const type of M.TYPES)for(let n=1;n<=50;n++){
  const p=M.build(type,n),s=Physical.build(p),a=Physical.audit(s);assert.equal(a.ok,true,p.id+': '+JSON.stringify(a.errors));
  assert.equal(p.buildings.length,9);assert.equal(s.levels.length,1);
  assert.deepEqual(p.processFlow.stages.map(v=>v.role),['receiving','preparation','production','finishing','dispatch']);
  for(const link of p.processFlow.links){
   assert.equal(link.operational,false);assert.equal(link.mode,'pedestrian-inspection');
   for(let i=1;i<link.route.length;i++){
    const from=s.nodes.find(v=>v.id===link.route[i-1]),to=s.nodes.find(v=>v.id===link.route[i]);
    assert.ok(from&&to);assert.equal(Physical.segmentClear(s,from,to,0,.32),true,p.id+' '+link.from);
   }
  }
 }
});

test('industrie : les quatre activités utilisent des programmes et emprises propres',()=>{
 const plans=M.TYPES.map(t=>M.build(t,1));
 assert.equal(new Set(plans.map(p=>p.configuration.process)).size,4);
 assert.equal(new Set(plans.map(p=>JSON.stringify(p.buildings.filter(b=>['preparation','production','finishing'].includes(b.role)).map(b=>[b.kind,b.w,b.h,b.rooms.map(r=>r.name)])))).size,4);
 for(const p of plans){assert.equal(p.outdoorAreas.length,2);assert.equal(p.reservedAreas.length,2);}
});

test('industrie : mobilier aux dimensions déclarées et faces de service libres aux tailles et orientations extrêmes',()=>{
 for(const type of M.TYPES)for(const number of [1,10,41,50]){
  const p=M.build(type,number),f=Furniture.build(p),a=Furniture.audit(p,f);
  assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.equal(f.summary.unknownUses,0);
  assert.equal(f.summary.unplaced,0,p.id);assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
  assert.equal(Physical.audit(Physical.withProps(Physical.build(p),f.props)).ok,true,p.id);
 }
});

test('industrie : machines distinctes pour dosage, usinage, textile et matériaux',()=>{
 const required={
  'EXT-MONDE-T053':['conveyor','dosingUnit','foodMixer','heatChamber','inspectionBench'],
  'EXT-MONDE-T054':['metalSaw','lathe','millingMachine','assemblyStation','inspectionBench'],
  'EXT-MONDE-T055':['loom','sewingStation','cuttingTable','inspectionBench'],
  'EXT-MONDE-T056':['dosingUnit','materialMixer','formingPress','curingRack','inspectionBench']
 };
 for(const [type,kinds]of Object.entries(required)){
  const f=Furniture.build(M.build(type,1));
  for(const kind of kinds){
   assert.ok(f.props.some(p=>p.kind===kind),type+' missing '+kind);
   const shape=Furniture.shape(kind);assert.equal(shape.lootEligible,false);assert.match(shape.sourceDimensions,/author-design:/);
   assert.ok(shape.w>0&&shape.h>0&&shape.heightM>0);
  }
 }
});

test('industrie : fermer une porte du site bloque réellement le passage',()=>{
 const p=make(),port=p.network.nodes.find(n=>n.id===p.network.externalPorts[0].node),s=Physical.build(p);
 assert.equal(Physical.segmentClear(s,{x:port.x,y:.5},{x:port.x,y:8},0,.32),true);
 p.structures.push({id:p.id+':closed-gate',kind:'site-fence',x:port.x-4,y:2,w:8,h:.18,maxHeightM:1.8,heightOrigin:'author-design',lootAssigned:false,utilityConnected:false});
 assert.equal(M.audit(p).ok,false);assert.equal(Physical.segmentClear(Physical.build(p),{x:port.x,y:.5},{x:port.x,y:8},0,.32),false);
});

test('industrie : une séquence inventée ou un raccourci absent du réseau est refusé',()=>{
 for(const mutate of [p=>p.processFlow.stages[0].role='production',p=>p.processFlow.links[0].route=['invented','missing'],p=>p.processFlow.links[0].route.splice(1,1),p=>p.processFlow.recipesActive=true]){
  const p=make();mutate(p);assert.equal(M.audit(p).ok,false);
 }
});

test('industrie : cours et réservations ne peuvent recouvrir les bâtiments ou sortir du site',()=>{
 for(const mutate of [p=>Object.assign(p.outdoorAreas[0],{x:p.buildings[0].x,y:p.buildings[0].y}),p=>p.outdoorAreas[0].x=-1,p=>Object.assign(p.reservedAreas[0],{x:p.buildings[1].x,y:p.buildings[1].y})]){
  const p=make();mutate(p);assert.equal(M.audit(p).ok,false);
 }
});

test('industrie : aucune création fictive de production, de stock ou de service',()=>{
 const mutations=[p=>p.playable=true,p=>p.sourceIds.push('UNVERIFIED_STANDARD'),p=>p.operations.outputCreated=1,p=>p.operations.newOutput=0,p=>p.processFlow.links[0].operational=true];
 for(const field of ['structures','reservedAreas','outdoorAreas'])for(const [key,value]of [['lootAssigned',true],['utilityConnected',true],['amount',0],['resource','food']])mutations.push(p=>p[field][0][key]=value);
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('industrie : identités et documents invalides restent refusés',()=>{
 for(const type of [null,undefined,'T053','EXT-MONDE-T052','__proto__'])assert.throws(()=>M.build(type,1));
 for(const n of [0,51,-1,NaN,Infinity,1.5,'1'])assert.throws(()=>M.build(M.TYPES[0],n));
 for(const value of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(value).ok,false);
});

test('industrie : le cœur navigateur est pur et reproduit le générateur auteur',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../scripts/codex-industrial2026.cjs'),'utf8');
 const body=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
 assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
 const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+body+';globalThis.Industrial={TYPES,build,audit};})(Reference);',context);
 for(const type of M.TYPES)for(const n of [1,26,50]){assert.deepEqual(clone(context.Industrial.build(type,n)),clone(M.build(type,n)));assert.equal(context.Industrial.audit(context.Industrial.build(type,n)).ok,true);}
});
