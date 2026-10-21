'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/exploration-125.js'),H=require('./helpers/city-content150.cjs');
const plan=roads=>({roads,settlements:[]});
const stable=g=>structuredClone(H.stable(g));

test('202 carriageway uses the whole footprint, real width and finite butt ends',()=>{
 const p=plan([{axis:'h',y:100,length:200,width:20}]),before=JSON.stringify(p);
 assert.equal(E.roadFootprint202(p,{x:30,y:82,w:40,h:10}),true,'edge reaches asphalt while its centre remains outside');
 assert.equal(E.roadFootprint202(p,{x:30,y:60,w:40,h:20}),false);
 assert.equal(E.roadFootprint202(p,{x:201,y:95,w:5,h:5}),false,'no imagined continuation beyond the drawn endpoint');
 assert.equal(E.roadFootprint202(p,{x:199,y:95,w:5,h:5}),true);
 assert.equal(E.roadFootprint202(p,{x:30,y:80,w:40,h:10}),false,'edge contact without positive area');
 assert.equal(E.roadFootprint202(p,{x:30,y:80,w:40,h:10},1),true,'declared setback');
 assert.equal(JSON.stringify(p),before,'geometry queries are read-only');
});

test('202 an oblique carriageway does not reserve its empty bounding-box corners',()=>{
 const p=plan([{axis:'line',x1:0,y1:0,x2:100,y2:100,width:10}]);
 assert.equal(E.roadFootprint202(p,{x:45,y:45,w:10,h:10}),true);
 assert.equal(E.roadFootprint202(p,{x:0,y:85,w:10,h:10}),false);
 assert.equal(E.roadFootprint202(p,{x:85,y:0,w:10,h:10}),false);
});

test('202 settlement streets, connectors and replaced road arrays share the same veto',()=>{
 const p={roads:[],settlements:[{street:{x1:0,y1:50,x2:100,y2:50,width:10},connector:{x1:100,y1:50,x2:100,y2:100,width:6}}]};
 assert.equal(E.roadFootprint202(p,{x:20,y:47,w:5,h:5}),true);
 assert.equal(E.roadFootprint202(p,{x:98,y:80,w:5,h:5}),true);
 assert.equal(E.roadFootprint202(p,{x:20,y:150,w:5,h:5}),false);
 p.roads=[{axis:'h',y:150,length:200,width:10}];
 assert.equal(E.roadFootprint202(p,{x:20,y:150,w:5,h:5}),true,'new geometry identity invalidates the transient index');
 assert.throws(()=>E.roadFootprint202(p,{x:0,y:0,w:0,h:1}),/invalide/);
 assert.throws(()=>E.roadFootprint202(p,{x:0,y:0,w:1,h:1},NaN),/invalide/);
});

test('202 rotated and world-resolved physical definitions veto the edge, not only the anchor',()=>{
 const C=require('../src/core.js');assert.ok(C.CityRoadRules202);
 const p=plan([{axis:'v',x:180,length:500,width:12}]),g={state:'playing',exploration125:{generation:4},world:{placement:()=>({valid:true,reason:''}),definition:()=>({...C.BUILDINGS.house,size:[4,1]})}};
 E.patchWorldPlacement(g,p);
 assert.equal(g.world.placement(C.BUILDINGS.house,2,2,0).valid,false,'resolved4m width reaches the road');
 assert.equal(g.world.placement(C.BUILDINGS.house,2,2,1).valid,true,'a quarter turn moves the complete footprint clear');
});

test('202 historical vertical supports retain their natural-road contract while paid roads and metric supports stay reserved',()=>{
 const C=require('../src/core.js'),support=C.VerticalCitadel175.bases.megaDeck36a177,ordinary=C.BUILDINGS.house;
 assert.equal(support.vertical175,true);assert.deepEqual(support.size,[24,24]);
 function quote(def,geometry,paid=false){
  const p=plan([{axis:'v',x:180,length:1000,width:112}]),g={state:'playing',exploration125:{generation:4},infrastructure:{roadFootprint202:()=>paid},
   world:{cityGeometry202:geometry,placement:()=>({valid:true,reason:''}),definition:()=>def}};
  E.patchWorldPlacement(g,p);return g.world.placement(def,2,2,0);
 }
 assert.equal(quote(support,0).valid,true,'old district keeps its native foundation progression');
 assert.equal(quote(support,undefined).valid,true,'an absent save flag is historical');
 assert.equal(quote(support,0,true).valid,false,'funded roads are always reserved');
 assert.equal(quote(support,1).valid,false,'the metric district applies the complete road rule');
 assert.equal(quote(ordinary,0).valid,false,'ordinary historical houses cannot use this compatibility rule');
});

test('202 projected bounds reuse the pure metric frame through the CommonJS fallback without image loading',()=>{
 const C=require('../src/core.js'),d=C.CityGeometry202.definition('house',1),saved=globalThis.DeadwallBuildingVariants157;delete globalThis.DeadwallBuildingVariants157;
 try{
  const bounds=E.projectedBuildingBounds202(d,67,17),V=require('../src/building-variants157.js');
  const frame=V.metricFrame202({type:'house',def:d,gx:67,gy:17,rotation:0,geometryVersion202:1,w:10,h:8,x:72*C.TILE,y:21*C.TILE});
  assert.deepEqual(bounds,frame.bounds);assert.deepEqual(d.size,[10,8]);assert.equal(C.CityGeometry202.presentation.projectedHeightUnitsPerMetre,16);
 }finally{if(saved)globalThis.DeadwallBuildingVariants157=saved;else delete globalThis.DeadwallBuildingVariants157;}
});

test('202 every tested seeded district preserves an immutable-road-clear plot for all twenty storeys',()=>{
 const C=require('../src/core.js'),d=C.CityGeometry202.definition('megaTower',1),coreDef=C.CityGeometry202.definition('core',1),core=E.buildingFootprint(coreDef,(C.WORLD_TILES-coreDef.size[0])/2,(C.WORLD_TILES-coreDef.size[1])/2);
 for(let seed=0;seed<512;seed++){
  const p=E.createFeaturePlan(seed,C.WORLD_TILES*C.TILE,4),clear=(x,y,rotation)=>{
   const body=E.buildingFootprint(d,x,y,rotation);return !E.roadFootprint202(p,body,C.CityRoadRules202.clearance)&&!E.roadFootprint202(p,E.projectedBuildingBounds202(d,x,y,rotation))&&!E.obstacleFootprint202(p,body)&&!E.rectsOverlap(body,core);
  };
  let available=clear(74,47,0);
  for(const rotation of [0,1]){
   const [w,h]=rotation%2?[d.size[1],d.size[0]]:d.size;
   for(let y=1;y<C.WORLD_TILES-1-h&&!available;y++)for(let x=1;x<C.WORLD_TILES-1-w&&!available;x++)available=clear(x,y,rotation);
  }
  assert.equal(available,true,'seed '+seed+' keeps a complete final-age plot after finite harvests; no immutable prop is removed');
 }
});

test('202 the reproduced seed17117 house is refused before native payment, IDs or save state change',()=>{
 const {g,C}=H.fresh();H.advanced(g);const before=stable(g),check=g.world.placement(C.BUILDINGS.house,34,10);
 assert.equal(g.exploration125.layoutRevision,3,'declared historical district fixture');
 assert.equal(check.valid,false);assert.match(check.reason,/Chaussée|voie financée/);
 assert.equal(g.placeOne('house',34,10),false);assert.deepEqual(H.stable(g),before);
});

test('202 native house anchors and quarter turns revalidate the complete physical footprint before payment',()=>{
 const {g,C}=H.fresh();H.advanced(g);let at;
 for(let y=10;y<118&&!at;y++)for(let x=10;x<118&&!at;x++){
  const flat=g.world.placement(C.BUILDINGS.house,x,y,0),turned=g.world.placement(C.BUILDINGS.house,x,y,1);
  if(!flat.valid&&/Chaussée|voie financée/.test(flat.reason)&&turned.valid)at={x,y};
 }
 assert.ok(at,'a lawful quarter-turn beside an existing road exists');
 const before=stable(g);assert.equal(g.placeOne('house',at.x,at.y,0),false);assert.deepEqual(H.stable(g),before);
 assert.equal(g.placeOne('house',at.x,at.y,1),true);const b=g.world.atCell(at.x,at.y),physical=g.world.definition('house');
 assert.equal(b.rotation,1);assert.equal(b.w,physical.size[1]);assert.equal(b.h,physical.size[0]);
 assert.equal(E.roadFootprint202(g.exploration125.plan,{x:b.left,y:b.top,w:b.right-b.left,h:b.bottom-b.top},C.CityRoadRules202.clearance),false);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before.resources[key]-(physical.cost[key]||0));
});

test('202 the reproduced Relais quote cannot finance its warehouse or shelter across the collector',()=>{
 const {g,C}=H.fresh();H.advanced(g);H.prepare(g,'planningOffice');
 for(const i of C.Dayworks.footprint('returnService201',0,0))if(C.BUILDINGS[i.type].requires)H.prepare(g,C.BUILDINGS[i.type].requires);
 for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(5000,g.storage);
 const before=stable(g);assert.equal(g.dayworks.beginPlan('returnService201'),true);
 const quote=g.dayworks.anchorPlan('returnService201',34,14);assert.equal(quote.ok,false);assert.match(quote.reason,/Chaussée|voie financée/);
 assert.equal(g.dayworks.commitPlan(),false);assert.deepEqual(H.stable(g),before);
});

test('202 complete native plan search finds lawful service grounds while the collector stays protected',()=>{
 for(const id of ['powerCourt201','siegeSupply201']){
  const {g,C}=H.fresh();H.advanced(g);H.prepare(g,'planningOffice');
  for(const i of C.Dayworks.footprint(id,0,0))if(C.BUILDINGS[i.type].requires)H.prepare(g,C.BUILDINGS[i.type].requires);
  g.refreshMetrics(true);for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(5000,g.storage);
  const before=stable(g),at=H.planPosition(g,id),historical=at.x>=10&&at.x<104&&at.x%2===0&&at.y>=10&&at.y<104&&at.y%2===0;
  assert.equal(historical,false,id+' requires an anchor outside the old fixture scan');assert.equal(at.q.ok,true);assert.equal(g.dayworks.planStatus(id,at.x,at.y).ok,true);
  const road=g.world.placement(C.BUILDINGS.house,34,10);assert.equal(road.valid,false);assert.match(road.reason,/Chaussée|voie financée/);assert.deepEqual(H.stable(g),before,'searching a lawful ensemble never clears the existing collector');
 }
});

test('202 native gates, walls and finite traps can still defend a road; ordinary towers stand off it',()=>{
 const {g,C}=H.fresh();H.advanced(g);
 for(const id of ['woodWall','steelWall','concreteWall','gate','armoredGate','spikes'])assert.equal(g.world.placement(C.BUILDINGS[id],35,10).valid,true,id+' deliberate road defence');
 for(const id of ['house','warehouse','watchtower','turret']){const q=g.world.placement(C.BUILDINGS[id],35,10);assert.equal(q.valid,false,id+' is a solid building');assert.match(q.reason,/Chaussée|voie financée/);}
});

test('202 paid unfinished infrastructure is reserved, pure reads avoid reconciliation, Continue and a fresh map stay separate',()=>{
 const {g,C}=H.fresh();H.advanced(g);H.prepare(g,'planningOffice');let at;
 for(let y=10;y<104&&!at;y++)for(let x=10;x<104&&!at;x++)if(g.world.placement(C.BUILDINGS.house,x,y).valid&&g.infrastructure.plan({x,y},{x,y}).ok)at={x,y};
 assert.ok(at);const area={x:at.x*C.TILE,y:at.y*C.TILE,w:C.BUILDINGS.house.size[0]*C.TILE,h:C.BUILDINGS.house.size[1]*C.TILE};
 assert.equal(g.infrastructure.roadFootprint202(area),false,'unpaid preview creates no persistent reservation');
 const paid=g.infrastructure.commit();assert.equal(paid.ok,true);
 const initial=g.infrastructure.snapshot();assert.equal(initial.roads[0].progress,0);const before=stable(g);
 const units=Object.getOwnPropertyDescriptor(g,'units');Object.defineProperty(g,'units',{configurable:true,get(){throw Error('road query must not reconcile workers');}});
 try{assert.equal(g.infrastructure.roadFootprint202(area),true);}finally{Object.defineProperty(g,'units',units);}
 assert.equal(g.world.placement(C.BUILDINGS.house,at.x,at.y).valid,false);assert.equal(g.placeOne('house',at.x,at.y),false);assert.deepEqual(H.stable(g),before);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.infrastructure.roadFootprint202(area),true);assert.deepEqual(g.infrastructure.snapshot(),initial);
 g.startNew('standard','42');g.campaignIntro132.skip();assert.equal(g.infrastructure.roadFootprint202(area),false,'no stale funded cells from the former campaign');
});

test('202 a historically funded house on asphalt keeps its exact position and identity when restored',()=>{
 const {g}=H.fresh(),b=new(g.core().constructor)(g.nextId++,'house',34,10,0,1);g.world.add(b);g.refreshMetrics(true);
 // This is an explicitly prepared old legal placement, not a new paid build.
 const before=stable(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(H.stable(g),before);
 const restored=g.world.buildings.get(b.id);assert.equal(restored.gx,34);assert.equal(restored.gy,10);assert.equal(restored.w,b.w);assert.equal(restored.h,b.h);
 g.destroyBuilding(restored);g.refreshMetrics(true);const ruined=stable(g),quote=g.infrastructure.rebuild(restored.id);
 assert.equal(quote.ok,false);assert.match(quote.reason,/Chaussée|voie financée/);assert.equal(g.infrastructure.confirmRebuild(restored.id).ok,false);assert.deepEqual(H.stable(g),ruined,'a fresh replacement on that road must be refused without losing the ruin');
});

test('202 new metric houses leave their projected roof off public asphalt before native payment',()=>{
 const {g,C}=H.fresh();g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();const d=g.world.definition('house'),p=g.exploration125.plan;
 let bad,good;for(let y=1;y<C.WORLD_TILES-1-d.size[1]&&(!bad||!good);y++)for(let x=1;x<C.WORLD_TILES-1-d.size[0]&&(!bad||!good);x++){
  const physical=E.buildingFootprint(d,x,y),projected=E.projectedBuildingBounds202(d,x,y),check=g.world.placement(d,x,y);
  if(!good&&check.valid)good={x,y};
  if(!bad&&!check.valid&&/Chaussée|voie financée/.test(check.reason)&&!E.roadFootprint202(p,physical,C.CityRoadRules202.clearance)&&E.roadFootprint202(p,projected)&&![...p.solids,...p.buildExclusions].some(b=>E.rectsOverlap(physical,b)))bad={x,y,physical,projected};
 }
 assert.ok(bad,'a body-clear anchor with only its projected roof on asphalt exists');assert.ok(good,'a legal roof-clear house anchor remains');const before=stable(g);
 assert.equal(E.roadFootprint202(p,bad.physical,C.CityRoadRules202.clearance),false);assert.equal(E.roadFootprint202(p,bad.projected),true);
 assert.equal(g.world.placement(d,bad.x,bad.y).valid,false);assert.equal(g.placeOne('house',bad.x,bad.y),false);assert.deepEqual(H.stable(g),before);
 assert.equal(g.placeOne('house',good.x,good.y),true);const b=g.world.atCell(good.x,good.y);
 assert.equal(b.progress,0);assert.equal(b.w,10);assert.equal(b.h,8);assert.equal(E.roadFootprint202(p,E.projectedBuildingBounds202(b.def,b.gx,b.gy,b.rotation)),false);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before.resources[key]-(d.cost[key]||0));
});

test('202 a funded unfinished road reserves the metric roof volume while its physical body remains clear',()=>{
 const {g,C}=H.fresh();g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();require('./helpers/legacy-city.cjs').legacyAge(g,85);H.prepare(g,'planningOffice');g.refreshMetrics(true);
 const d=g.world.definition('house');let at;
 for(let y=4;y<118&&!at;y++)for(let x=1;x<118&&!at;x++)if(g.world.placement(d,x,y).valid){
  const physical=E.buildingFootprint(d,x,y),projected=E.projectedBuildingBounds202(d,x,y),cell={x:x+2,y:y-2};
  if(cell.x*C.TILE>=projected.x&&cell.x*C.TILE<projected.x+projected.w&&cell.y*C.TILE+C.TILE>projected.y&&g.infrastructure.plan(cell,cell).ok)at={x,y,physical,projected,cell};
 }
 assert.ok(at);assert.equal(g.infrastructure.commit().ok,true);assert.equal(g.infrastructure.snapshot().roads[0].progress,0);
 assert.equal(g.infrastructure.roadFootprint202(at.physical,C.CityRoadRules202.clearance),false);assert.equal(g.infrastructure.roadFootprint202(at.projected,0),true);
 const before=stable(g);assert.equal(g.world.placement(d,at.x,at.y).valid,false);assert.equal(g.placeOne('house',at.x,at.y),false);assert.deepEqual(H.stable(g),before);
});

test('202 new roads cannot be financed through an immutable natural house, while a historical funded cell survives Continue',()=>{
 const {g,C}=H.fresh();g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();require('./helpers/legacy-city.cjs').legacyAge(g,85);H.prepare(g,'planningOffice');g.refreshMetrics(true);
 const house=g.exploration125.plan.settlements[0].buildings[0],l=house.x-house.w/2,t=house.y-house.h/2;let cell;
 for(let y=Math.ceil(t/C.TILE);y<Math.floor((t+house.h)/C.TILE)&&!cell;y++)for(let x=Math.ceil(l/C.TILE);x<Math.floor((l+house.w)/C.TILE)&&!cell;x++){
  const oldBlocked=g.world.atCell(x,y)||(g.world.nodes||[]).some(n=>!n.depleted&&n.amount>0&&n.x+(n.radius||0)>x*C.TILE&&n.x-(n.radius||0)<(x+1)*C.TILE&&n.y+(n.radius||0)>y*C.TILE&&n.y-(n.radius||0)<(y+1)*C.TILE);
  if(!oldBlocked)cell={x,y};
 }
 assert.ok(cell,'the natural house has a cell with no city building or harvest node');assert.equal(E.obstacleFootprint202(g.exploration125.plan,{x:cell.x*C.TILE,y:cell.y*C.TILE,w:C.TILE,h:C.TILE}),true);
 const before=stable(g);assert.equal(g.infrastructure.plan(cell,cell).ok,false);assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(H.stable(g),before);
 let sceneryCell;for(const node of g.world.nodes){
  if(sceneryCell||node.depleted||node.amount<=0||node.metric202!==1||!node.body202)continue;const box=g.fieldcraft.reserveRect(node);
  for(let y=Math.ceil(box.t/C.TILE);y<Math.floor(box.b/C.TILE)&&!sceneryCell;y++)for(let x=Math.ceil(box.l/C.TILE);x<Math.floor(box.r/C.TILE)&&!sceneryCell;x++){
   const area={x:x*C.TILE,y:y*C.TILE,w:C.TILE,h:C.TILE},oldBlocked=g.world.atCell(x,y)||g.world.nodes.some(n=>!n.depleted&&n.amount>0&&n.x+(n.radius||0)>area.x&&n.x-(n.radius||0)<area.x+area.w&&n.y+(n.radius||0)>area.y&&n.y-(n.radius||0)<area.y+area.h);
   if(!oldBlocked&&!E.obstacleFootprint202(g.exploration125.plan,area))sceneryCell={x,y};
  }
 }
 assert.ok(sceneryCell,'a finite metric scenery end extends beyond the old resource radius');assert.equal(g.infrastructure.plan(sceneryCell,sceneryCell).ok,false);assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(H.stable(g),before);
 const historical=stable(g);historical.infrastructure.roads.push({...cell,progress:.37});assert.equal(g.restoreSave(historical),true);
 assert.deepEqual(H.stable(g),historical,'restoring a declared historical funded-road fixture neither erases it nor changes resources');assert.equal(g.infrastructure.snapshot().roads[0].progress,.37);
});

test('202 a new road also respects an already financed metric roof, and can still pass beneath a gate',()=>{
 const {g,C}=H.fresh();g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();require('./helpers/legacy-city.cjs').legacyAge(g,85);H.prepare(g,'planningOffice');g.refreshMetrics(true);
 const d=g.world.definition('house');let at;
 for(let y=4;y<118&&!at;y++)for(let x=1;x<118&&!at;x++)if(g.world.placement(d,x,y).valid){
  const projected=E.projectedBuildingBounds202(d,x,y),cell={x:x+2,y:y-2};
  if(cell.x*C.TILE>=projected.x&&cell.x*C.TILE<projected.x+projected.w&&cell.y*C.TILE+C.TILE>projected.y&&g.infrastructure.plan(cell,cell).ok)at={x,y,cell};
 }
 assert.ok(at);g.infrastructure.cancel();assert.equal(g.placeOne('house',at.x,at.y),true);assert.equal(g.world.atCell(at.x,at.y).progress,0);
 const before=stable(g);assert.equal(g.world.atCell(at.cell.x,at.cell.y),null,'the road cell lies beyond the ground footprint');assert.equal(g.infrastructure.plan(at.cell,at.cell).ok,false);assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(H.stable(g),before);
 const gate=H.prepare(g,'gate'),crossing={x:gate.gx,y:gate.gy};assert.equal(g.infrastructure.plan(crossing,crossing).ok,true,'a deliberate gate crossing stays possible');assert.equal(g.infrastructure.commit().ok,true);
});

test('202 a twenty-storey tower remains placeable after declared resource clearing with its full unchanged projected height',()=>{
 const {g,C}=H.fresh();g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();let cleared=0;
 for(const n of g.world.nodes)if(!n.depleted&&n.amount>0){n.amount=0;n.depleted=true;cleared++;}g.world.navigationVersion++;g.world.flowDirty=true;
 const d=g.world.definition('megaTower'),p=g.exploration125.plan,before=stable(g);let at;
 for(const rotation of [0,1]){
  const [w,h]=rotation%2?[d.size[1],d.size[0]]:d.size;
  for(let y=1;y<C.WORLD_TILES-1-h&&!at;y++)for(let x=1;x<C.WORLD_TILES-1-w&&!at;x++){
   const physical=E.buildingFootprint(d,x,y,rotation),projected=E.projectedBuildingBounds202(d,x,y,rotation);
   if(!E.roadFootprint202(p,physical,C.CityRoadRules202.clearance)&&!E.roadFootprint202(p,projected)&&g.world.placement(d,x,y,rotation).valid)at={x,y,rotation,physical,projected};
  }
 }
 assert.ok(cleared>0,'explicit advanced terrain fixture, not a human harvest claim');assert.equal(d.floors,20);assert.deepEqual(d.size,[16,14]);assert.equal(C.CityGeometry202.presentation.projectedHeightUnitsPerMetre,16);
 assert.ok(at,'the last age retains a native position for all twenty projected storeys');assert.equal(E.roadFootprint202(p,at.physical,C.CityRoadRules202.clearance),false);assert.equal(E.roadFootprint202(p,at.projected,0),false);
 assert.equal(g.world.placement(d,at.x,at.y,at.rotation).valid,true);assert.deepEqual(H.stable(g),before,'checking the full height changes no campaign fields');
});

test('202 metric ruin access, rotated guide and newly paid reconstruction use the world physical definition',()=>{
 const {g,C}=H.fresh();g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();
 const def=g.world.definition('house'),rotation=1,[w,h]=[def.size[1],def.size[0]];let at;
 for(let y=10;y<118&&!at;y++)for(let x=10;x<118&&!at;x++){
  const point={x:(x+w)*C.TILE+g.player.radius+2,y:(y+h/2)*C.TILE};
  if(g.world.placement(def,x,y,rotation).valid&&g.friendlyPositionClear(g.player,point.x,point.y))at={x,y,point};
 }
 assert.ok(at);const b=new(g.core().constructor)(g.nextId++,'house',at.x,at.y,rotation,1);g.world.add(b);g.refreshMetrics(true);
 Object.assign(g.player,at.point);assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);g.destroyBuilding(b);g.refreshMetrics(true);
 const quote=g.infrastructure.rebuild(b.id);assert.equal(quote.ok,true,quote.reason);assert.equal(quote.confirm,true);
 assert.equal(g.infrastructure.mark(b.id),true);const outlines=[];
 g.infrastructure.drawGuide({save(){},restore(){},setLineDash(){},strokeRect(...args){outlines.push(args);},fillText(){}});
 assert.deepEqual(outlines,[[at.x*C.TILE,at.y*C.TILE,w*C.TILE,h*C.TILE]],'ruin guide covers the body that will actually be rebuilt');
 // Marking closes the command panel and deliberately invalidates its old quote.
 assert.equal(g.infrastructure.rebuild(b.id).ok,true);
 const stock={...g.resources},paid=g.infrastructure.confirmRebuild(b.id);assert.equal(paid.ok,true,paid.reason);const next=g.world.atCell(at.x,at.y);
 assert.notEqual(next.id,b.id);assert.equal(next.progress,0);assert.equal(next.rotation,rotation);assert.equal(next.w,w);assert.equal(next.h,h);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(def.cost[key]||0));
});
