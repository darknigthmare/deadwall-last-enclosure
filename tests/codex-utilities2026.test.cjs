'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const M=require('../scripts/codex-utilities2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=v=>JSON.parse(JSON.stringify(v));
const make=()=>clone(M.build(M.TYPES[0],1));

test('eau-énergie : 350 plans déterministes aux géométries distinctes et sans hasard de campagne',()=>{
 const original=Math.random;Math.random=()=>{throw Error('Unexpected simulation RNG');};
 try{
  for(const type of M.TYPES){const signatures=new Set();
   for(let number=1;number<=50;number++){
    const p=M.build(type,number);assert.deepEqual(p,M.build(type,number));
    const a=M.audit(p);assert.equal(a.ok,true,p.id+': '+a.errors.join(','));
    signatures.add(JSON.stringify([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide]),p.structures.map(s=>[s.kind,s.x,s.y,s.w,s.h])]));
    assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.buildings[0].rooms)&&Object.isFrozen(p.processDiagram.links));
    assert.equal(p.playable,false);assert.equal(p.heightOrigin,'author-design');assert.deepEqual(p.sourceIds,[]);
    assert.ok(p.network.externalPorts.every(port=>port.connectedToWorld===false));
    assert.ok(Object.values(p.operations).every(value=>value===0));
   }
   assert.equal(signatures.size,50,type);
  }
 }finally{Math.random=original;}
 assert.equal(M.auditAll().variants,350);
});

test('eau-énergie : les 350 variantes meublées restent accessibles, et tous leurs bassins sont réellement infranchissables',()=>{
 let rooms=0,props=0,refused=0,wet=0;
 for(const type of M.TYPES)for(let number=1;number<=50;number++){
  const p=M.build(type,number),f=Furniture.build(p),fa=Furniture.audit(p,f);
  assert.equal(fa.ok,true,p.id+': '+fa.errors.join(','));assert.equal(f.summary.unknownUses,0,p.id);
  assert.equal(f.summary.furnishedRooms,f.summary.rooms,p.id+' empty room');
  assert.equal(f.summary.requested,f.props.length+f.unplaced.length,p.id+' unaccounted request');
  assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
  const s=Physical.withProps(Physical.build(p),f.props),a=Physical.audit(s);
  assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.equal(s.levels.length,1);
  for(const asset of p.structures){
   assert.equal(Physical.blocked(s,asset.x+asset.w/2,asset.y+asset.h/2,0,.32),true,p.id+' '+asset.kind+' has no closed collider');
   if(asset.water)wet++;
  }
  for(const link of p.processFlow.links)for(let i=1;i<link.route.length;i++){
   const from=s.nodes.find(n=>n.id===link.route[i-1]),to=s.nodes.find(n=>n.id===link.route[i]);
   assert.equal(Physical.segmentClear(s,from,to,0,.32),true,p.id+' service path crosses closed equipment or water');
  }
  rooms+=f.summary.rooms;props+=f.props.length;refused+=f.unplaced.length;
 }
 assert.equal(rooms,7700);assert.ok(props>0);assert.ok(wet>0);
 // Refusal remains an explicit outcome, never a silently rescaled fixture.
 assert.ok(refused>=0);
});

test('eau-énergie : activités, équipements et circuits distincts ; aucune production prétendue',()=>{
 const plans=M.TYPES.map(type=>M.build(type,1));
 assert.equal(new Set(plans.map(p=>p.configuration.process)).size,7);
 assert.equal(new Set(plans.map(p=>JSON.stringify(p.structures.map(s=>[s.kind,s.water,s.w,s.h])))).size,7);
 for(const p of plans){assert.equal(p.buildings.length,5);assert.equal(p.processFlow.recipesActive,false);assert.equal(p.processDiagram.operational,false);}
 const thermal=plans.find(p=>p.type==='EXT-MONDE-T057'),diagram=thermal.processDiagram.links;
 const fuel=thermal.structures.find(s=>s.kind==='fuel-storage'),boiler=thermal.structures.find(s=>s.kind==='boiler-block'),alternator=thermal.structures.find(s=>s.kind==='steam-turbine'),network=thermal.structures.find(s=>s.kind==='switchyard-transformer');
 assert.ok(diagram.some(e=>e.from===fuel.id&&e.to===boiler.id&&e.medium==='combustible'));
 assert.ok(diagram.some(e=>e.from===alternator.id&&e.to===network.id&&e.medium==='électricité'));
 assert.ok(!diagram.some(e=>e.from===fuel.id&&e.to===network.id));
});

test('eau-énergie : routes sur un bassin, appareils ouverts et procédés inventés sont refusés',()=>{
 const mutations=[p=>p.structures[0].walkable=true,p=>p.structures[0].water=!p.structures[0].water,
  p=>p.structures[0].interiorStatus='open',p=>p.processFlow.links[0].route=['invented','missing'],
  p=>p.processFlow.links[0].route.splice(1,1),p=>p.processFlow.recipesActive=true,
  p=>p.processDiagram.operational=true,p=>p.processDiagram.links[0].medium='unverified magic',
  p=>p.processDiagram.links[0].operational=true];
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
 const p=clone(M.build('EXT-MONDE-T061',1)),basin=p.structures.find(s=>s.water);
 const n=p.network.nodes[2];n.x=basin.x+basin.w/2;n.y=basin.y+basin.h/2;
 assert.equal(M.audit(p).ok,false);assert.equal(Physical.audit(Physical.build(p)).ok,false);
});

test('eau-énergie : aucun stock, appareil connecté ou rendement ne peut être ajouté au nom du décor',()=>{
 const mutations=[p=>p.playable=true,p=>p.sourceIds.push('unverified'),p=>p.operations.outputCreated=1,p=>p.operations.newOutput=0,p=>p.network.externalPorts[0].connectedToWorld=true];
 for(const [key,value]of [['lootAssigned',true],['utilityConnected',true],['amount',0],['resource','water']])mutations.push(p=>p.structures[0][key]=value);
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('eau-énergie : documents incomplets, identités et variantes invalides sont refusés',()=>{
 for(const type of [null,undefined,'T057','EXT-MONDE-T060','__proto__'])assert.throws(()=>M.build(type,1));
 for(const number of [0,51,-1,NaN,Infinity,1.5,'1'])assert.throws(()=>M.build(M.TYPES[0],number));
 for(const value of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(value).ok,false);
 const p=make();p.number=51;assert.equal(M.audit(p).ok,false);
});

test('eau-énergie : le cœur exportable au navigateur reproduit les sources sans dépendance Node',()=>{
 const source=fs.readFileSync(require.resolve('../scripts/codex-utilities2026.cjs'),'utf8');
 const body=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
 assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
 const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+body+';globalThis.Utilities={TYPES,build,audit};})(Reference);',context);
 for(const type of M.TYPES)for(const number of [1,26,50]){
  assert.deepEqual(clone(context.Utilities.build(type,number)),clone(M.build(type,number)));
  assert.equal(context.Utilities.audit(context.Utilities.build(type,number)).ok,true);
 }
});
