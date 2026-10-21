'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const E=require('../src/exploration-125.js'),C=require('../src/core.js');
const seeds=[0,1,4,42,73,17117,84329,998877,4294967295];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const buildings=p=>[...p.backyards.map(y=>y.house),...p.settlements.flatMap(s=>s.buildings)];
const ground=b=>({x:b.x-b.w/2,y:b.y-b.h/2,w:b.w,h:b.h});
const envelope=b=>{const q=E.buildingProjection134(b),o=q.roofOverhang;return{x:q.l-o,y:q.roofTop-o,w:b.w+o*2,h:q.b-q.roofTop+o*2};};

test('202 historical revisions retain the exact 27 seed plans captured before this change',()=>{
 const hashes=[];for(const revision of [1,2,3])for(const seed of seeds)hashes.push(hash(JSON.stringify(E.createFeaturePlan(seed,4096,revision))));
 assert.equal(hash(hashes.join('\n')),'db7f2c11dc6aa5406612c4db0764db4493bcbd1ecaada63915d328ff479c9c64');
});

test('202 metric parcels are deterministic, bounded and keep finite historical loot identities',()=>{
 const signatures=new Set();
 for(const seed of seeds){
  const p=E.createFeaturePlan(seed,4096,4);assert.deepEqual(E.createFeaturePlan(seed,4096,4),p);assert.equal(p.layoutRevision,4);
  assert.equal(p.stations.length,4);assert.equal(p.backyards.length,4);assert.equal(p.settlements.length,3);assert.equal(buildings(p).length,10);
  assert.equal(p.stationLoot.length,12);assert.deepEqual(p.stationLoot.map(n=>n.id),[900000010,900000011,900000012,900000020,900000021,900000022,900000030,900000031,900000032,900000040,900000041,900000042]);
  for(const n of p.stationLoot)assert.ok(n.type==='fuel'?n.amount>=12&&n.amount<=22:n.type==='food'?n.amount>=10&&n.amount<=19:n.amount>=2&&n.amount<=6);
  assert.equal(new Set(p.stationLoot.map(n=>n.id)).size,12);assert.equal(p.wrecks.length,12);assert.equal(p.roadEvents.length,18);assert.equal(p.decor.length,70);
  for(const b of buildings(p)){assert.deepEqual([b.w,b.h],[320,256]);assert.equal(b.metric202,1);const q=E.buildingProjection134(b);assert.equal(q.doorWidth,32);assert.equal(q.doorHeight,33.6);assert.equal(q.height,b.kind==='twoStorey'?96:48);const box=envelope(b);assert.ok(box.x>=32&&box.y>=32&&box.x+box.w<=4064&&box.y+box.h<=4064);}
  for(const s of p.stations){assert.deepEqual([s.w,s.h],[384,256]);assert.equal(s.door.width,38.4);assert.equal(s.windows[0].width,48);}
  for(const w of p.wrecks){assert.deepEqual([w.body202.w,w.body202.h],(w.kind==='van'?C.CityGeometry202.localParcels.vanMetres:C.CityGeometry202.localParcels.sedanMetres).map(n=>n*32));const body=E.physicalSolids134(p).find(b=>b.wreck===w.id);assert.equal(body.oriented.w,w.body202.w);assert.equal(body.oriented.h,w.body202.h);assert.equal(w.amount,undefined);}
  assert.ok(p.roadProps.every(n=>n.amount===undefined));assert.ok(p.decor.every(n=>n.amount===undefined));signatures.add(JSON.stringify(p.roads.map(r=>[r.x1,r.y1,r.x2,r.y2])));
 }
 assert.equal(signatures.size,seeds.length);
});

test('202 512 seeds keep every full roof and facade one metre clear of every carriageway',()=>{
 for(let seed=0;seed<512;seed++){
  const p=E.createFeaturePlan(seed,4096,4),all=buildings(p);
  for(const b of all){assert.equal(E.roadFootprint202(p,envelope(b),32),false,seed+'/'+b.id);for(const other of all)if(b!==other)assert.equal(E.rectsOverlap(envelope(b),envelope(other)),false,seed+'/'+b.id+'/'+other.id);}
  for(const s of p.stations)assert.equal(E.roadFootprint202(p,ground(s)),false,seed+'/'+s.id);
  for(const district of p.buildableDistricts202){assert.equal(E.roadFootprint202(p,district,8),false);assert.ok(p.solids.every(b=>!E.rectsOverlap(b,district)),seed+'/buildable district');}
  for(const yard of p.backyards){const gate=yard.gate;assert.ok(!yard.solids.some(b=>E.circleIntersectsRect(gate.x,gate.y,13,b)),seed+'/'+yard.id+'/gate');assert.ok(p.roads.some(r=>r.id.startsWith('yard-access-')&&E.roadContains(r,gate.x,gate.y,0)));}
 }
});

test('202 metric facade draws a one metre door at the actor ground plane',()=>{
 const house=E.createFeaturePlan(17117,4096,4).backyards[0].house,q=E.buildingProjection134(house),calls=[];
 const c=new Proxy({globalAlpha:1},{get:(o,k)=>k==='fillRect'?(...a)=>calls.push({color:o.fillStyle,args:a}):k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 E.drawBuildingShell134(c,house,true);const door=calls.find(r=>r.color==='#343831');assert.ok(door);assert.equal(door.args[2],32);assert.equal(door.args[3],33.6);assert.equal(door.args[1]+door.args[3],q.b);
});

test('202 seed134 retains a complete high-rise plot after permanent prop generation',()=>{
 const p=E.createFeaturePlan(134,4096,4),expected=E.projectedBuildingBounds202(C.CityGeometry202.definition('megaTower',1),74,47),reserve=p.highriseReserve202;
 assert.deepEqual({x:reserve.x,y:reserve.y,w:reserve.w,h:reserve.h},expected);
 assert.equal(reserve.y+reserve.h>p.buildableDistricts202[0].y+p.buildableDistricts202[0].h,true,'the tower needs the lower strip beyond the ordinary district');
 assert.equal(E.roadFootprint202(p,reserve),false);
 assert.ok(E.physicalSolids134(p).every(b=>!E.rectsOverlap(b,reserve)),'the former two benches cannot block every tower anchor');
 for(const prop of p.decor.filter(d=>['bench','marker','stump'].includes(d.kind)))assert.equal(E.circleIntersectsRect(prop.x,prop.y,prop.kind==='bench'?38:30,reserve),false);
 for(const event of p.roadEvents)assert.equal(E.circleIntersectsRect(event.x,event.y,60,reserve),false);
 assert.equal(p.decor.length,70);assert.equal(p.wrecks.length,12);assert.equal(p.roadEvents.length,18);
});

test('202 both largest service and high-rise frames retain a plot after permanent decoration across 512 seeds',()=>{
 const service=E.projectedBuildingBounds202(C.CityGeometry202.definition('megaReserve',1),33,70);
 for(let seed=0;seed<512;seed++){
  const p=E.createFeaturePlan(seed,4096,4),q=p.largeServiceReserve202;
  assert.deepEqual({x:q.x,y:q.y,w:q.w,h:q.h},service);
  for(const reserve of [p.highriseReserve202,q]){
   assert.equal(E.roadFootprint202(p,reserve),false,seed+'/road');
   assert.ok(E.physicalSolids134(p).every(b=>!E.rectsOverlap(b,reserve)),seed+'/permanent prop');
  }
 }
});

test('202 actual current campaign clears construction land, preserves stocks and keeps all station doors usable',()=>{
 const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{g}=bootDocument134();g.startNew('standard','17117','classic','balanced',true);g.campaignIntro132.skip();
 assert.equal(g.world.cityGeometry202,1);assert.equal(g.exploration125.layoutRevision,4);const p=g.exploration125.plan;
 const scenery=g.world.nodes.filter(n=>n.sceneryKind);assert.equal(scenery.length,48);for(const n of scenery)assert.equal(n.amount,n.maxAmount,'fresh finite scenery stock '+n.id);
 for(const node of g.world.nodes.filter(n=>n.metric202===1)){
  const b=g.fieldcraft.rect(node);assert.ok(Math.abs(b.r-b.l-node.body202.w)<1e-8&&Math.abs(b.b-b.t-node.body202.h)<1e-8);
  const size=C.CityGeometry202.sceneryMetres[node.sceneryKind];if(size)assert.deepEqual([node.body202.w,node.body202.h],size.map(n=>n*32));
  if(!node.depleted){const box={x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t};if(['ruinedHouse','ruinedShop','warehouseShell'].includes(node.sceneryKind)){box.x-=4.8;box.y-=52.8;box.w+=9.6;box.h+=57.6;}assert.equal(E.roadFootprint202(p,box,12),false,'real metric body '+node.id);}
 }
 for(const district of p.buildableDistricts202){for(const node of g.world.nodes.filter(n=>!n.depleted)){const b=g.fieldcraft.reserveRect(node);assert.equal(E.rectsOverlap(district,{x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t}),false,'finite deposit '+node.id);}}
 assert.equal(g.world.nodes.filter(n=>n.__exploration125Loot).length,12);
 let free=0;for(let y=18;y<42;y++)for(let x=68;x<100;x++)if(g.world.placement(g.world.definition('warehouse'),x,y).valid)free++;assert.ok(free>=100,'real 12×10m construction anchors');
 for(const station of p.stations){const dir=station.facing==='south'?1:-1;for(const d of [-20,20])assert.equal(g.friendlyPositionClear(g.player,station.door.x,station.door.y+d),true,station.id+'/physical door/'+d);for(const spec of p.stationLoot.filter(n=>n.stationId===station.id)){const node=g.world.nodes.find(n=>n.id===spec.id),point=g.fieldcraft.service(g.player,node);assert.ok(point,station.id+'/'+spec.type+'/service');assert.equal(g.friendlyPositionClear(g.player,point.x,point.y),true);}assert.ok(g.friendlyPositionClear(g.player,station.door.x,station.door.y-dir*26));}
 const source=g.world.nodes.find(n=>n.type==='wood'&&!n.depleted&&!n.sceneryKind);source.harvest(7);
 const snapshot=()=>g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount]),geometry=()=>g.world.nodes.filter(n=>n.metric202===1).map(n=>[n.id,n.body202,n.renderSize]);const before=snapshot(),bodies=geometry(),saved=g.serialize();assert.equal(saved.cityGeometry202,1);assert.equal(saved.exploration125.layoutRevision,4);g.restoreSave(saved);assert.deepEqual(snapshot(),before);assert.deepEqual(geometry(),bodies,'body metadata regenerated before restored fieldcraft consumers');g.exploration125.syncPlan();assert.deepEqual(snapshot(),before);
 const bad=structuredClone(saved),world=g.world;delete bad.cityGeometry202;assert.throws(()=>g.restoreSave(bad),/métrique/);assert.equal(g.world,world);assert.deepEqual(snapshot(),before);
});
