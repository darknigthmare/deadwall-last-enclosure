'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../scripts/codex-maritime-sites2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const make=(type='EXT-MONDE-T013')=>clone(M.build(type,1));

test('sites maritimes : les onze types manquants ont chacun 50 compositions métriques déterministes',()=>{
 assert.deepEqual(M.TYPES,['EXT-MONDE-T009','EXT-MONDE-T010','EXT-MONDE-T012','EXT-MONDE-T013','EXT-MONDE-T014','EXT-MONDE-T015','EXT-MONDE-T016','EXT-MONDE-T077','EXT-MONDE-T078','EXT-MONDE-T079','EXT-MONDE-T080']);
 const random=Math.random;Math.random=()=>{throw Error('No campaign randomness in author composition');};
 try{
  for(const type of M.TYPES){
   const signatures=new Set();
   for(let n=1;n<=50;n++){
    const p=M.build(type,n),a=M.audit(p);assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.deepEqual(p,M.build(type,n));
    assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.support)&&Object.isFrozen(p.structures));
    signatures.add(JSON.stringify([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide]),p.support]));
    assert.equal(p.units,'m');assert.equal(p.playable,false);assert.deepEqual(p.sourceIds,[]);
    assert.equal(p.buildings.length,8);assert.ok(p.network.externalPorts.every(q=>q.connectedToWorld===false));
    for(const b of p.buildings.filter(b=>b.kind==='island-house'))assert.deepEqual([b.w,b.h,b.heightM],[12,12,3.2]);
    assert.ok(Object.values(p.operations).every(n=>n===0));
   }
   assert.equal(signatures.size,50,type);
  }
 }finally{Math.random=random;}
 assert.equal(new Set(M.TYPES.map(t=>M.PROFILES[t].intent)).size,11);
 for(const profile of Object.values(M.PROFILES))for(const building of profile.facilities)for(const name of building.rooms){
  if(name==='réserve matériel'||name==='stockage matériel')assert.equal(Furniture.classify(name),'stores','Une réserve doit recevoir du rangement, pas un poste de garde.');
 }
});

test('sites maritimes : les 550 plans sont meublés à taille réelle et gardent leurs accès libres',()=>{
 let rooms=0,props=0,refused=0;
 for(const type of M.TYPES)for(let n=1;n<=50;n++){
  const p=M.build(type,n),before=JSON.stringify(p),f=Furniture.build(p),a=Furniture.audit(p,f);
  assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.equal(f.summary.unknownUses,0,p.id);
  const expectedRooms=M.PROFILES[type].facilities.reduce((sum,b)=>sum+b.rooms.length,0);
  assert.equal(f.summary.rooms,expectedRooms);assert.equal(f.summary.furnishedRooms,expectedRooms,p.id);
  assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
  const s=Physical.withProps(Physical.build(p),f.props),check=Physical.audit(s);
  assert.equal(check.ok,true,p.id+': '+check.errors.join(','));assert.equal(s.levels.length,1);assert.equal(s.transitions.length,0);
  assert.equal(JSON.stringify(p),before);assert.ok(f.props.every(q=>q.lootAssigned===false&&q.utilityConnected===false));
  rooms+=f.summary.rooms;props+=f.props.length;refused+=f.unplaced.length;
 }
 assert.equal(rooms,18000);assert.ok(props>50000);assert.equal(refused,0);
});

test('sites maritimes : les relèves ont une vraie restauration et les sites isolés leurs pièces de soins',()=>{
 const required={
  'EXT-MONDE-T009':{crew:{kitchen:['sink','oven','fridge'],dining:['table','chair']}},
  'EXT-MONDE-T010':{staff:{kitchen:['sink','oven','fridge'],dining:['table','chair'],pantry:['shelf']}},
  'EXT-MONDE-T012':{welcome:{medical:['medical','sink']}},
  'EXT-MONDE-T079':{staff:{medical:['medical','sink']}}
 };
 for(const [type,roles]of Object.entries(required))for(let number=1;number<=50;number++){
  const p=M.build(type,number),f=Furniture.build(p);
  for(const [role,uses]of Object.entries(roles)){
   const building=p.buildings.find(b=>b.role===role);assert.ok(building,p.id+' '+role);
   for(const [usage,kinds]of Object.entries(uses)){
    const rooms=building.rooms.filter(r=>Furniture.classify(r.name)===usage);assert.ok(rooms.length,p.id+' '+role+' '+usage);
    for(const room of rooms){
     assert.ok(room.w>=8&&room.h>=8,p.id+' real-sized service room');
     assert.ok(building.portals.some(portal=>portal.to===room.id),p.id+' independent room access');
     const props=f.props.filter(q=>q.roomId===room.id);
     for(const kind of kinds)assert.ok(props.some(q=>q.kind===kind),p.id+' '+room.name+' missing '+kind);
    }
   }
  }
 }
 const removed=make('EXT-MONDE-T012');removed.buildings.find(b=>b.role==='welcome').rooms.find(r=>r.name==='salle de soins').name='bureau soins';
 assert.equal(M.audit(removed).ok,false,'A generic office must not replace a dedicated medical room.');
});

test('sites maritimes : les jetées soutiennent réellement la marche et leurs côtés restent de l’eau',()=>{
 for(const type of M.TYPES)for(const n of [1,26,50]){
  const p=M.build(type,n),s=Physical.build(p),D=p.support.dryArea;
  for(const pier of p.support.piers){
   const y=pier.y+pier.h/2,start={x:pier.x+1,y},end={x:pier.x+pier.w-1,y};
   assert.equal(Physical.segmentClear(s,start,end,0,.32),true,p.id+' jetty support');
   const x=p.configuration.domain==='port'?D.x+D.w+20:pier.x+4;
   assert.equal(Physical.blocked(s,x,pier.y-1,0,.32),true,p.id+' water beside jetty');
   assert.equal(Physical.segmentClear(s,{x,y},{x,y:pier.y-1},0,.32),false,p.id+' no transverse water crossing');
   const moved=Physical.move(s,{x,y,level:0},0,-10,.32);
   assert.ok(moved.pose.y>=pier.y+.32-1e-6,p.id+' no walking off jetty');
  }
  for(const id of p.water.parts){const w=p.structures.find(q=>q.id===id);assert.equal(Physical.blocked(s,w.x+w.w/2,w.y+w.h/2,0,.32),true,p.id+' water cell');}
  for(const f of p.structures.filter(q=>!p.water.parts.includes(q.id)))assert.equal(Physical.blocked(s,f.x+f.w/2,f.y+f.h/2,0,.32),true,p.id+' closed device');
 }
});

test('sites maritimes : raccourcis sur eau, pontons flottants et sauts de niveau sont refusés',()=>{
 const p=make(),water=p.structures.find(q=>p.water.parts.includes(q.id));
 p.network.nodes.push({id:p.id+':wet-shortcut',x:water.x+water.w/2,y:water.y+water.h/2,z:0});
 p.network.edges.push({id:p.id+':wet-link',from:p.network.nodes[0].id,to:p.id+':wet-shortcut',widthM:1.4,mode:'pedestrian',level:0});
 assert.equal(M.audit(p).ok,false);
 const q=make();q.support.surfaces[1].w=2;assert.equal(M.audit(q).ok,false);
 const r=make();r.network.nodes[0].z=1;assert.equal(M.audit(r).ok,false);
 const t=make();t.structures.find(s=>t.water.parts.includes(s.id)).w-=1;assert.equal(M.audit(t).ok,false);
});

test('sites maritimes : aucune cote ou opération fermée ne devient une production ou une preuve réelle',()=>{
 const mutations=[p=>p.playable=true,p=>p.sourceIds.push('UNVERIFIED'),p=>p.water.depthM=30,
  p=>p.water.walkable=true,p=>p.water.navigationDelivered=true,p=>p.operations.outputCreated=1,
  p=>p.operations.newService=0,p=>p.support.piers[0].walkable=false,p=>p.unresolved=[],
  p=>p.network.externalPorts[0].connectedToWorld=true,p=>p.configuration.arrangement=50,
  p=>p.structures.find(s=>s.role==='ice').maxHeightM=.7];
 for(const [key,value]of [['walkable',true],['utilityConnected',true],['lootAssigned',true],['resource','fuel'],['amount',0]])mutations.push(p=>p.structures[0][key]=value);
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
 const offshore=make('EXT-MONDE-T009');offshore.deckDatum.elevationAboveSeaM=20;assert.equal(M.audit(offshore).ok,false);
 const floating=make('EXT-MONDE-T010');floating.deckDatum.stabilitySimulated=true;assert.equal(M.audit(floating).ok,false);
 const island=make('EXT-MONDE-T080');island.island.naturalReliefDelivered=true;assert.equal(M.audit(island).ok,false);
 const house=make('EXT-MONDE-T077');house.buildings.find(b=>b.kind==='island-house').w=6;assert.equal(M.audit(house).ok,false);
 const scale=make('EXT-MONDE-T080');scale.support.dryArea.w=82.4;assert.equal(M.audit(scale).ok,false);
});

test('sites maritimes : documents incomplets et variantes hors domaine sont rejetés sans casser l’audit du lot',()=>{
 for(const type of [null,undefined,'T009','EXT-MONDE-T011','__proto__','constructor'])assert.throws(()=>M.build(type,1));
 for(const n of [0,-1,51,1.5,NaN,Infinity,'1'])assert.throws(()=>M.build(M.TYPES[0],n));
 for(const p of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(p).ok,false);
});

test('sites maritimes : le cœur compilable dans le navigateur reproduit la géométrie Node',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../scripts/codex-maritime-sites2026.cjs'),'utf8');
 const body=text.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
 const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+body+';globalThis.Sites={TYPES,build,audit};})(Reference);',context);
 for(const type of M.TYPES)for(const number of [1,26,50]){const p=context.Sites.build(type,number);assert.deepEqual(clone(p),clone(M.build(type,number)));assert.equal(context.Sites.audit(p).ok,true);}
});
