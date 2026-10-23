'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../scripts/codex-littoral2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=v=>JSON.parse(JSON.stringify(v));
const make=()=>clone(M.build(M.TYPES[0],1));

test('littoral : 200 géométries déterministes, programmes distincts et dimensions domestiques conservées',()=>{
 const random=Math.random;Math.random=()=>{throw Error('Unexpected campaign randomness');};
 try{
  for(const type of M.TYPES){
   const signatures=new Set();
   for(let n=1;n<=50;n++){
    const p=M.build(type,n),check=M.audit(p);assert.equal(check.ok,true,p.id+': '+check.errors.join(','));
    assert.deepEqual(p,M.build(type,n));assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.buildings)&&Object.isFrozen(p.coast));
    signatures.add(JSON.stringify([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide]),p.structures]));
    assert.equal(p.playable,false);assert.equal(p.scope,'author-metric-layout-not-live-world');assert.deepEqual(p.sourceIds,[]);
    for(const b of p.buildings.filter(b=>b.kind==='coastal-house'))assert.deepEqual([b.w,b.h,b.heightM],[12,12,3.2]);
    assert.ok(p.network.externalPorts.every(q=>q.connectedToWorld===false));assert.ok(Object.values(p.operations).every(v=>v===0));
   }
   assert.equal(signatures.size,50,type);
  }
 }finally{Math.random=random;}
 const p=M.TYPES.map(type=>M.build(type,1));
 assert.equal(new Set(p.map(p=>p.configuration.intent)).size,4);
 assert.equal(new Set(p.map(p=>p.buildings.map(b=>b.kind).join('|'))).size,4);
});

test('littoral : les 200 plans ont 32 pièces meublées, des accès physiques libres et aucun service inventé',()=>{
 let rooms=0,props=0,refused=0;
 for(const type of M.TYPES)for(let n=1;n<=50;n++){
  const p=M.build(type,n),before=JSON.stringify(p),f=Furniture.build(p),fa=Furniture.audit(p,f);
  assert.equal(fa.ok,true,p.id+': '+fa.errors.join(','));assert.equal(f.summary.unknownUses,0,p.id);
  assert.equal(f.summary.rooms,32);assert.equal(f.summary.furnishedRooms,32,p.id);assert.equal(f.summary.unplaced,0,p.id);
  assert.equal(f.summary.connectedServices,0);assert.equal(f.summary.lootContainersCreated,0);
  const s=Physical.withProps(Physical.build(p),f.props),check=Physical.audit(s);
  assert.equal(check.ok,true,p.id+': '+check.errors.join(','));assert.equal(s.levels.length,1);
  assert.equal(JSON.stringify(p),before,'Inspection must not mutate its source');
  for(const item of f.props){assert.equal(item.lootAssigned,false);assert.equal(item.utilityConnected,false);}
  rooms+=f.summary.furnishedRooms;props+=f.props.length;refused+=f.unplaced.length;
 }
 assert.deepEqual({rooms,props,refused},{rooms:6400,props:23800,refused:0});
});

test('littoral : la mer et les appareils fermés sont vraiment infranchissables, même entre deux points terrestres',()=>{
 for(const type of M.TYPES)for(const n of [1,26,50]){
  const p=M.build(type,n),s=Physical.build(p),water=p.structures.find(s=>s.id===p.coast.waterId);
  const x=water.x+water.w/2,y=p.bounds.h/2;
  assert.equal(Physical.blocked(s,x,y,0,.32),true,p.id+' water centre');
  assert.equal(Physical.segmentClear(s,{x:water.x-1,y},{x:water.x+1,y},0,.32),false,p.id+' shoreline crossing');
  const moved=Physical.move(s,{x:water.x-1,y,level:0},5,0,.32);
  assert.ok(moved.pose.x<=water.x-.32+1e-6,p.id+' no walking over water');
  for(const solid of p.structures.filter(s=>s.role!=='sea')){
   assert.equal(Physical.blocked(s,solid.x+solid.w/2,solid.y+solid.h/2,0,.32),true,p.id+' '+solid.role);
   assert.ok(p.unresolved.length>0);assert.equal(s.transitions.length,0,'No invented tower stair or boat boarding');
  }
 }
});

test('littoral : un raccourci traversant la mer ou une fermeture de porte est refusé',()=>{
 const p=make(),water=p.structures.find(s=>s.id===p.coast.waterId),start=p.network.nodes[0],end=p.network.nodes[1];
 p.network.nodes.push({id:p.id+':water-checkpoint',x:water.x+3,y:water.h/2,z:0});
 p.network.edges.push({id:p.id+':water-shortcut',from:start.id,to:p.id+':water-checkpoint',widthM:1.4,mode:'pedestrian',level:0});
 assert.equal(M.audit(p).ok,false);
 const q=make(),b=q.buildings[0];
 q.structures.push({id:q.id+':door-block',kind:'sealed-door',role:'door-block',x:b.x+b.entry.x-1,y:b.y+b.entry.y-.2,w:2,h:.4,maxHeightM:2.2,heightOrigin:'author-design',walkable:false,interiorStatus:'closed-reservation',lootAssigned:false,utilityConnected:false});
 assert.equal(M.audit(q).ok,false);assert.equal(Physical.audit(Physical.build(q)).ok,false);
 assert.ok(end);
});

test('littoral : les domaines fermés et les limites ne deviennent jamais des stocks ou des services',()=>{
 const mutations=[p=>p.playable=true,p=>p.coast.waterWalkable=true,p=>p.coast.nauticalLink=true,p=>p.coast.waterId='missing',
  p=>p.sourceIds.push('UNVERIFIED'),p=>p.operations.outputCreated=1,p=>p.operations.newSystem=0,p=>p.unresolved=[],
  p=>p.buildings.find(b=>b.kind==='coastal-house').w=6,p=>p.buildings[0].rooms[1].name='Unrelated generic room'];
 for(const [key,value]of [['walkable',true],['lootAssigned',true],['utilityConnected',true],['amount',0],['resource','food']])mutations.push(p=>p.structures[0][key]=value);
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('littoral : les documents incomplets et les identités hors limites sont rejetés',()=>{
 for(const type of [null,undefined,'T017','EXT-MONDE-T021','__proto__'])assert.throws(()=>M.build(type,1));
 for(const n of [0,-1,51,1.5,NaN,Infinity,'1'])assert.throws(()=>M.build(M.TYPES[0],n));
 for(const p of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(p).ok,false);
});

test('littoral : le cœur navigateur est pur et reproduit exactement les plans Node',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../scripts/codex-littoral2026.cjs'),'utf8');
 const body=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
 assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
 const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+body+';globalThis.Littoral={TYPES,build,audit};})(Reference);',context);
 for(const type of M.TYPES)for(const number of [1,26,50]){
  const p=context.Littoral.build(type,number);assert.deepEqual(clone(p),clone(M.build(type,number)));assert.equal(context.Littoral.audit(p).ok,true);
 }
});
