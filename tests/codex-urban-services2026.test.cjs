'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../scripts/codex-urban-services2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const sample=type=>clone(M.build(type,25));
function assertFunctionalDwelling(plan,building,furniture){
 const programme=[
  ['séjour familial',['sofa','table','chair']],
  ['chambre parentale',['bed','wardrobe']],
  ['chambre enfant',['singleBunk','wardrobe']],
  ['cuisine familiale',['sink','oven','fridge']],
  ['sanitaires du logement',['toilet','sink']],
  ['douches du logement',['shower','sink']]
 ];
 for(const [name,kinds]of programme){
  const room=building.rooms.find(r=>r.name===name);assert.ok(room,plan.id+' missing functional room '+name);
  assert.ok(building.portals.some(d=>d.from===building.rooms[0].id&&d.to===room.id),plan.id+' missing private access '+name);
  for(const kind of kinds){
   const prop=furniture.props.find(p=>p.roomId===room.id&&p.kind===kind);
   assert.ok(prop,plan.id+' '+building.id+' '+name+' missing placed '+kind);
   assert.equal(prop.level,room.level);assert.equal(prop.utilityConnected,false);
   const dimensions=Furniture.shape(kind);
   assert.deepEqual(prop.footprintM,{w:dimensions.w,h:dimensions.h},plan.id+' scaled '+kind);
   assert.ok(!furniture.unplaced.some(p=>p.roomId===room.id&&p.kind===kind),plan.id+' refused essential '+kind);
  }
 }
}

test('HLM et égouts : 400 plans immuables et déterministes, avec 50 géométries par type',()=>{
 const random=Math.random;Math.random=()=>{throw Error('No simulation RNG is available to authoring.');};
 try{
  for(const type of M.TYPES){const geometries=new Set();
   for(let number=1;number<=50;number++){
    const p=M.build(type,number),a=M.audit(p);
    assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.deepEqual(p,M.build(type,number));
    // Plot margins and labels alone cannot distinguish two architectural variants.
    geometries.add(JSON.stringify([p.buildings.map(b=>[b.x,b.y,b.w,b.h,b.levels,b.rooms.map(r=>[r.x,r.y,r.w,r.h])]),
     p.structures.map(s=>[s.x,s.y,s.w,s.h,s.level]),p.surfaceAreas.map(s=>[s.x,s.y,s.w,s.h,s.level])]));
    assert.equal(p.playable,false);assert.equal(p.heightOrigin,'author-design');assert.deepEqual(p.sourceIds,[]);
    assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.levels)&&Object.isFrozen(p.network.transitions)&&Object.isFrozen(p.buildings[0].rooms));
    assert.ok(p.network.externalPorts.every(port=>port.connectedToWorld===false));
    assert.ok(Object.values(p.operations).every(value=>value===0));
   }
   assert.equal(geometries.size,50,type);
  }
 }finally{Math.random=random;}
 assert.equal(M.TYPES.length*50,400);
});

test('HLM et égouts : 40 scènes meublées respectent le niveau physique, les accès et la limite de props',()=>{
 let maxProps=0,rooms=0,transitions=0,wet=0;
 for(const type of M.TYPES)for(const number of [1,10,25,40,50]){
  const p=M.build(type,number),f=Furniture.build(p),fa=Furniture.audit(p,f),scene=Physical.withProps(Physical.build(p),f.props),a=Physical.audit(scene);
  assert.equal(fa.ok,true,p.id+': '+fa.errors.join(','));assert.equal(a.ok,true,p.id+': '+a.errors.map(x=>JSON.stringify(x)).join(','));
  assert.equal(f.summary.unknownUses,0,p.id);assert.equal(f.summary.furnishedRooms,f.summary.rooms,p.id+' unfurnished room');
  assert.equal(f.summary.requested,f.props.length+f.unplaced.length,p.id+' missing refusal');
  assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
  assert.ok(f.props.length<M.RULES.maxHousingProps,p.id+' exceeds inspection prop bound');maxProps=Math.max(maxProps,f.props.length);
  assert.equal(scene.levels.length,p.levels.length,p.id+' lost levels');
  for(const level of p.levels){
   assert.equal(scene.levels[level.index].elevationM,level.elevationM);
   if(level.index!==0)assert.equal(Physical.blocked(scene,1,1,level.index,.32),true,p.id+' invented global upstairs floor');
  }
  for(const s of p.structures.filter(s=>s.water)){
   const solid=scene.solids.find(c=>c.id===s.id);assert.ok(solid,p.id+' missing channel collider');assert.equal(solid.level,s.level);
   assert.equal(Physical.blocked(scene,s.x+s.w/2,s.y+s.h/2,s.level,.32),true,p.id+' walkable water');wet++;
  }
  for(const t of scene.transitions){
   assert.ok(Math.abs(scene.levels[t.from].elevationM-scene.levels[t.to].elevationM)<=4.8);
   const crossed=Physical.transition(scene,{x:t.a.x,y:t.a.y,level:t.from},t.id,.32);
   assert.equal(crossed.ok,true,p.id+' transition '+t.id);assert.equal(crossed.pose.level,t.to);transitions++;
  }
  rooms+=f.summary.rooms;
 }
 assert.ok(rooms>3000);assert.ok(maxProps>500&&maxProps<5000);assert.ok(transitions>100);assert.ok(wet>50);
});

test('HLM : logements privés complets, hauteurs distinctes et caves reliées aux mêmes cages',()=>{
 const housing=M.TYPES.filter(type=>M.PROFILES[type].family==='housing');
 assert.equal(new Set(housing.map(type=>M.build(type,1).housing.form)).size,4);
 for(const type of housing){const p=M.build(type,50),h=p.housing;
  assert.ok(h.blocks.length>=1&&h.units.length>=12);assert.equal(p.levels[h.basementLevel].elevationM,-3);
  for(const unit of h.units){
   const b=p.buildings.find(b=>b.id===unit.id);assert.equal(b.rooms.length,7);assert.equal(unit.occupantsAssigned,false);
   assert.ok(unit.areaM2>=123&&unit.areaM2<=136);assert.equal(unit.areaBasis,'gross-author-footprint');
   for(const r of b.rooms.filter(r=>/^(sanitaires|douches) du logement$/.test(r.name)))assert.ok(Math.abs(r.h-2.46)<1e-8,p.id+' wet room grows with variant depth');
   assert.ok(b.portals.every(d=>d.from===unit.privateHall&&unit.rooms.includes(d.to)));
   const hall=p.surfaceAreas.find(s=>s.kind==='common-corridor'&&s.level===unit.level&&s.x<=b.x&&s.x+s.w>=b.x+b.w&&
    (Math.abs(s.y-b.y-b.h)<1e-8||Math.abs(s.y+s.h-b.y)<1e-8));
   assert.ok(hall,p.id+' missing collective hall beside private entry');
  }
  for(const shaft of h.stairCores){assert.equal(shaft.w,8);assert.equal(shaft.h,7);assert.ok(shaft.landings.some(l=>l.level===h.basementLevel));}
 }
 const tower=M.build('EXT-MONDE-T042',50);assert.ok(tower.maxHeightM>30);assert.ok(tower.maxHeightM<40);
 const mixed=M.build('EXT-MONDE-T044',50);assert.ok(new Set(mixed.housing.blocks.map(b=>b.floors)).size>1);
 assert.ok(mixed.buildings.some(b=>b.role==='common-services'));
});

test('HLM et égouts : les 400 variantes possèdent leurs sanitaires et les logements sont équipés pour leurs usages',()=>{
 let dwellings=0,staffBlocks=0,toilets=0,showers=0;
 for(const type of M.TYPES)for(let number=1;number<=50;number++){
  const p=M.build(type,number),f=Furniture.build(p);
  const programmes=p.housing?p.buildings.filter(b=>b.role==='dwelling'):p.buildings.filter(b=>b.role==='sewer-surface-services');
  assert.ok(programmes.length,p.id+' has no housing or staff programme');
  for(const b of programmes){
   const wc=b.rooms.find(r=>/^sanitaires (?:du logement|du personnel)$/.test(r.name)),shower=b.rooms.find(r=>/^douches (?:du logement|du personnel)$/.test(r.name));
   assert.ok(wc&&shower&&wc.id!==shower.id,p.id+' missing separate welfare rooms');
   assert.ok(b.portals.some(d=>d.to===wc.id)&&b.portals.some(d=>d.to===shower.id),p.id+' welfare room has no physical door');
   const toiletProp=f.props.find(item=>item.roomId===wc.id&&item.kind==='toilet');
   const showerProp=f.props.find(item=>item.roomId===shower.id&&item.kind==='shower');
   assert.ok(toiletProp,p.id+' '+b.id+' has no placed toilet');
   assert.ok(showerProp,p.id+' '+b.id+' has no placed shower');
   assert.equal(toiletProp.level,wc.level);assert.equal(showerProp.level,shower.level);
   assert.equal(toiletProp.utilityConnected,false);assert.equal(showerProp.utilityConnected,false);
   assert.ok(!f.unplaced.some(item=>item.roomId===wc.id&&item.kind==='toilet'));
   assert.ok(!f.unplaced.some(item=>item.roomId===shower.id&&item.kind==='shower'));
   for(const room of[wc,shower])assert.ok(f.props.some(item=>item.roomId===room.id&&item.kind==='sink'),p.id+' '+room.name+' has no placed hand-washing sink');
   if(p.housing)assertFunctionalDwelling(p,b,f);
   toilets++;showers++;if(p.housing)dwellings++;else staffBlocks++;
  }
  if(p.housing)assert.equal(f.unplaced.length,0,p.id+' refused furnishing: '+JSON.stringify(f.unplaced));
 }
 assert.ok(dwellings>5000);assert.equal(staffBlocks,200);assert.equal(toilets,dwellings+staffBlocks);assert.equal(showers,toilets);
});

test('HLM : une chambre sans lit ou une cuisine sans four échoue même si chaque pièce possède du mobilier',()=>{
 for(const [name,kind]of[['chambre parentale','bed'],['cuisine familiale','oven']]){
  const p=sample('EXT-MONDE-T042'),b=p.buildings.find(b=>b.role==='dwelling'),r=b.rooms.find(r=>r.name===name);
  r.h=1.5;b.portals.find(d=>d.to===r.id).y=r.y+r.h/2;
  const f=Furniture.build(p);
  assert.equal(Furniture.audit(p,f).ok,true,'generic furniture audit records the refusal');
  assert.ok(f.props.some(prop=>prop.roomId===r.id),'room still has at least one placed prop');
  assert.ok(f.unplaced.some(prop=>prop.roomId===r.id&&prop.kind===kind),'essential furniture really fails to fit');
  assert.throws(()=>assertFunctionalDwelling(p,b,f),/missing placed/);
 }
});

test('égouts : branches et jonctions dirigées, pluie distincte et relevage explicitement inactif',()=>{
 for(const type of M.TYPES.filter(type=>M.PROFILES[type].family==='sewer')){
  const p=M.build(type,10),s=p.sewer,f=s.hydraulicFlow;
  assert.equal(p.depthM,M.PROFILES[type].depths*3);assert.equal(s.depthDatum,'deepest-dry-gallery-floor');assert.equal(f.operational,false);assert.equal(f.potable,false);
  assert.equal(s.accessShafts.length,2);assert.equal(s.dryGalleries.length,M.PROFILES[type].depths);
  const nodes=new Map(f.nodes.map(n=>[n.id,n]));
  for(const e of f.links){const from=nodes.get(e.from),to=nodes.get(e.to);assert.equal(e.operational,false);
   if(e.kind!=='pump-riser')assert.ok(from.invertElevationM>=to.invertElevationM);
   else{assert.equal(type,'EXT-MONDE-T040');assert.ok(from.invertElevationM<to.invertElevationM);}
  }
  assert.equal(f.outfalls.length,1);assert.equal(f.outfalls[0].connectedToWorld,false);
 }
 assert.equal(M.build('EXT-MONDE-T039',1).sewer.medium,'stormwater');
 assert.equal(M.build('EXT-MONDE-T038',1).sewer.medium,'combined-wastewater');
 assert.ok(M.build('EXT-MONDE-T038',1).sewer.hydraulicFlow.links.some(e=>e.kind==='gravity-drop'));
 assert.equal(M.build('EXT-MONDE-T040',1).sewer.hydraulicFlow.links.filter(e=>e.kind==='pump-riser').length,1);
});

test('HLM : appartements incomplets, faux occupants et étages ou cages incohérents sont refusés',()=>{
 const mutations=[p=>p.housing.campaignOccupantsCreated=1,p=>p.housing.units[0].occupantsAssigned=true,
  p=>p.housing.units[0].privateHall=p.housing.units[1].privateHall,p=>p.housing.units[0].rooms.pop(),
  p=>p.housing.blocks[0].unitIds.pop(),p=>p.housing.stairCores[0].landings.pop(),
  p=>p.buildings.find(b=>b.role==='dwelling').rooms[1].name='chambre sans cuisine',
  p=>p.buildings.find(b=>b.role==='dwelling').levels=[999],p=>p.housing.blocks[0].heightM=1,
  p=>p.surfaceAreas.find(s=>s.level>0).level=0];
 for(const mutate of mutations){const p=sample('EXT-MONDE-T042');mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('égouts : eau traversable, débit inventé, gravité montante et exutoire non raccordé sont refusés',()=>{
 const mutations=[p=>p.structures[0].walkable=true,p=>p.structures[0].water=false,p=>p.structures[0].level=0,
  p=>p.sewer.hydraulicFlow.operational=true,p=>p.sewer.hydraulicFlow.potable=true,
  p=>p.sewer.hydraulicFlow.outfalls[0].connectedToWorld=true,
  p=>p.sewer.hydraulicFlow.links[0].to='absent',p=>p.sewer.hydraulicFlow.links.pop(),
  p=>p.sewer.hydraulicFlow.nodes[0].invertElevationM=-100,p=>p.sewer.hydraulicFlow.nodes[0].x=0,
  p=>p.sewer.accessShafts.pop(),p=>p.sewer.dryGalleries[0].waterSeparated=false,
  p=>p.buildings.find(b=>b.role==='sewer-surface-services').rooms.find(r=>r.name==='sanitaires du personnel').name='réserve générale',
  p=>p.buildings.find(b=>b.role==='sewer-surface-services').rooms.find(r=>r.name==='douches du personnel').name='rangement général'];
 for(const mutate of mutations){const p=sample('EXT-MONDE-T037');mutate(p);assert.equal(M.audit(p).ok,false);}
 const p=sample('EXT-MONDE-T040');p.sewer.hydraulicFlow.links.find(e=>e.kind==='pump-riser').kind='gravity';assert.equal(M.audit(p).ok,false);
});

test('HLM et égouts : escaliers décalés, paliers hors pièce et raccourcis entre niveaux sont refusés',()=>{
 for(const type of ['EXT-MONDE-T037','EXT-MONDE-T042']){
  for(const mutate of [p=>p.network.nodes.find(n=>n.id===p.network.transitions[0].to).x+=2,
   p=>p.network.nodes.find(n=>n.id===p.network.transitions[0].to).z+=1,
   p=>p.network.transitions[0].widthM=.2,p=>p.network.transitions[0].kind='teleport',
   p=>p.network.nodes.find(n=>n.roomId).roomId='unbuilt-circulation',
   p=>p.network.edges[0].level=999,p=>p.levels[1].elevationM=30]){
   const p=sample(type);mutate(p);assert.equal(M.audit(p).ok,false);
  }
 }
});

test('HLM et égouts : scope de campagne, ressources et accès extérieurs ne sont pas créés par les plans',()=>{
 for(const type of M.TYPES)for(const mutate of [p=>p.playable=true,p=>p.sourceIds.push('invented-survey'),
  p=>p.operations.outputCreated=1,p=>p.operations.connectedServices=1,p=>p.network.externalPorts[0].connectedToWorld=true,
  p=>p.surfaceAreas[0].lootAssigned=true,p=>p.surfaceAreas[0].utilityConnected=true]){
  const p=sample(type);mutate(p);assert.equal(M.audit(p).ok,false);
 }
});

test('HLM et égouts : documents tronqués et identités invalides échouent sans exception',()=>{
 for(const type of [null,undefined,'EXT-MONDE-T045','__proto__'])assert.throws(()=>M.build(type,1));
 for(const n of [0,51,1.5,'1',NaN,Infinity])assert.throws(()=>M.build(M.TYPES[0],n));
 for(const bad of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(bad).ok,false);
 for(const mutate of [p=>p.number=51,p=>p.levels=null,p=>p.buildings[0].rooms.push(null),p=>p.network.nodes[0].x=NaN]){
  const p=sample('EXT-MONDE-T041');mutate(p);assert.equal(M.audit(p).ok,false);
 }
});

test('HLM et égouts : le cœur compilable produit les mêmes plans et audits sans module Node',()=>{
 const source=fs.readFileSync(require.resolve('../scripts/codex-urban-services2026.cjs'),'utf8');
 const body=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
 assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
 const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+body+';globalThis.Urban={TYPES,build,audit};})(Reference);',context);
 for(const type of M.TYPES)for(const n of [1,26,50]){
  const p=context.Urban.build(type,n);assert.deepEqual(clone(p),clone(M.build(type,n)));assert.equal(context.Urban.audit(p).ok,true);
 }
});
