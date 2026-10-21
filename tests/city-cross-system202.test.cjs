'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),T=require('../src/tactics.js');
const F=require('../src/fortification-pack.js'),S=require('../src/vertical-citadel175-state.js'),N=require('../src/vertical-network179.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs'),{legacyAge}=require('./helpers/legacy-city.cjs');
const ReturnRoutes=require('../src/return-routes.js');
const clone=value=>JSON.parse(JSON.stringify(value));
function fresh(metric=true){const{g}=bootDocument134();g.startNew('standard','17117','classic','classic',metric);g.campaignIntro132.skip();return g;}
function site(g,type,rotation=0){const d=g.world.definition(type);for(let y=2;y<126;y++)for(let x=2;x<126;x++)if(g.world.placement(d,x,y,rotation).valid)return{x,y};throw Error('No legal physical site for '+type);}
function completedFixture(g,type,rotation=0,clearFinite=false){
 // Upper-ray fixtures clear finite harvestable deposits without crediting stocks;
 // roads, natural walls, parcels and other immutable geometry remain intact.
 if(clearFinite)for(const node of g.world.nodes)if(node.maxAmount>0)node.harvest(node.amount);
 const p=site(g,type,rotation),b=new(g.core().constructor)(g.nextId++,type,p.x,p.y,rotation,1);g.world.add(b);g.refreshMetrics(true);g.prepareWave();return b;
}

test('202 tactical and vertical bodies share metric rotated footprints while historical bodies remain exact',()=>{
 for(const revision of[0,1])for(const rotation of[0,1,2,3]){
  const b={type:'house',gx:10,gy:12,rotation,geometryVersion202:revision,progress:1,health:100},size=C.CityGeometry202.definition('house',revision).size,[w,h]=rotation%2?[size[1],size[0]]:size;
  assert.deepEqual(T.footprint(b),{x:10,y:12,width:w,height:h});assert.deepEqual(S.bounds(b),{x:10,y:12,w,h});
  const actor={x:(10+w-.1)*32,y:(12+h-.1)*32,radius:2};assert.equal(T.overlapsBuilding(b,actor),true);actor.x=(10+w)*32+3;assert.equal(T.overlapsBuilding(b,actor),false);
 }
 assert.equal(C.CityGeometry202.structureHeight(C.CityGeometry202.definition('megaTower',1)),60);
 assert.equal(C.CityGeometry202.structureHeight(C.BUILDINGS.megaTower),C.VerticalCitadel175.structureHeight);
 assert.equal(C.CityGeometry202.structureHeight(C.CityGeometry202.definition('woodWall',1)),3);
 for(const def of Object.values(C.VerticalCitadel175.bases))assert.equal(C.CityGeometry202.structureHeight(def,1),def.height);
});

test('202 finite debris validates only against its campaign footprint and keeps original yield ceilings',()=>{
 const record={id:1,type:'house',x:500,y:500,w:320,h:256,remaining:{wood:1,scrap:0,stone:0}},raw={version:1,fittings:[],debris:[record]},full={cityGeometry202:1,nextId:2,buildings:[]};
 assert.deepEqual(F.normalize(raw,full),raw);assert.throws(()=>F.normalize(raw),/empreinte/);
 const legacy=clone(raw);legacy.debris[0].w=C.BUILDINGS.house.size[0]*32;legacy.debris[0].h=C.BUILDINGS.house.size[1]*32;assert.deepEqual(F.normalize(legacy),legacy);assert.throws(()=>F.normalize(legacy,full),/empreinte/);
 const excessive=clone(raw);excessive.debris[0].remaining.wood=Math.floor(C.BUILDINGS.house.cost.wood*C.FortificationPackRules.debrisFactor)+1;assert.throws(()=>F.normalize(excessive,full),/réserve/);
});

test('202 destroyed rotated structures keep their real debris through repeated native Continue',()=>{
 const g=fresh(),b=completedFixture(g,'house',1),resources={...g.resources},size=[b.w*32,b.h*32];
 g.destroyBuilding(b);const debris=g.fortificationPack.snapshot();assert.equal(debris.debris.length,1);assert.deepEqual([debris.debris[0].w,debris.debris[0].h],size);
 assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(g.serialize()));assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.fortificationPack.snapshot(),debris);assert.deepEqual(g.resources,resources);
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.fortificationPack.snapshot(),debris);
 const wrong=g.serialize(),world=g.world;wrong.expansions127.modules.fortification.debris[0].w=C.BUILDINGS.house.size[0]*32;assert.throws(()=>g.restoreSave(wrong),/empreinte/);assert.equal(g.world,world);assert.deepEqual(g.fortificationPack.snapshot(),debris);
});

test('202 placement rejects vehicles in the enlarged corner for all rotations even with a historical definition argument',()=>{
 for(const rotation of[0,1,2,3]){
  const g=fresh(),p=site(g,'house',rotation),d=g.world.definition('house'),[w,h]=rotation%2?[d.size[1],d.size[0]]:d.size,raw=g.serialize();
  // Declared parked-vehicle fixture inside a currently free future footprint.
  raw.expeditions.vehicle={id:raw.nextId++,x:(p.x+w-1)*32,y:(p.y+h-1)*32,health:320,fuel:0,angle:0,driving:false,cargo:C.makeBag()};raw.expeditions.stats.built++;
  assert.equal(g.restoreSave(raw),true);const before={...g.resources},q=g.world.placement(C.BUILDINGS.house,p.x,p.y,rotation);assert.equal(q.valid,false);assert.match(q.reason,/Véhicule/);assert.equal(g.placeOne('house',p.x,p.y,rotation),false);assert.deepEqual(g.resources,before);
 }
});

function networkFixture(type='lookout2a177'){
 const d=C.VerticalCitadel175.bases[type],a={id:1,type,gx:20,gy:20,rotation:0,health:d.health,progress:1},b={...a,id:2,gx:20+d.size[0]+20},sites=[S.siteInitial(1),S.siteInitial(2)],network=N.initial();
 network.nextId=2;network.links=[{id:1,kind:'link10',a:{site:1,level:0},b:{site:2,level:0},progress:1,health:C.VerticalNetwork179.links[10].health}];return{a,b,sites,network};
}
test('202 bridge validation and new construction use enlarged ordinary bodies without changing historical corridors',()=>{
 const f=networkFixture(),q=N.shape(f.network.links[0],new Map([[1,f.a],[2,f.b]]),f.sites);assert.ok(q);
 const house={id:3,type:'house',gx:29,gy:Math.floor(q.y)-7,rotation:0,health:100,progress:1},full={cityGeometry202:1,buildings:[f.a,f.b,house],nodes:[]};
 assert.throws(()=>N.normalize(f.network,full,{sites:f.sites}),/géométrie/);assert.doesNotThrow(()=>N.normalize(f.network,{...full,cityGeometry202:0},{sites:f.sites}));
 const g={world:{cityGeometry202:1,buildings:new Map([[1,f.a],[2,f.b]]),definition(type){return C.CityGeometry202.definition(type,this.cityGeometry202);}}},n=N.create(g,{S,state:()=>({network:f.network,sites:f.sites})});
 assert.equal(n.blocksConstruction('house',house.gx,house.gy),true);g.world.cityGeometry202=0;assert.equal(n.blocksConstruction('house',house.gx,house.gy),false);
});

test('202 bridge clearance respects real building height as well as its ground footprint',()=>{
 const f=networkFixture('verticalFoundation6'),q=N.shape(f.network.links[0],new Map([[1,f.a],[2,f.b]]),f.sites);assert.ok(q);assert.equal(q.z,6);
 const g={world:{cityGeometry202:1,buildings:new Map([[1,f.a],[2,f.b]]),definition(type){return C.CityGeometry202.definition(type,this.cityGeometry202);}}},n=N.create(g,{S,state:()=>({network:f.network,sites:f.sites})}),x=33,y=Math.floor(q.y)-7;
 assert.equal(n.blocksConstruction('house',x,y),false,'three-metre house fits below a six-metre bridge');
 assert.equal(n.blocksConstruction('megaTower',x,y),true,'sixty-metre tower crosses the same upper corridor');g.world.cityGeometry202=0;assert.equal(n.blocksConstruction('megaTower',x,y),false,'historical towers retain their four-metre collider');
});

test('202 twenty-storey buildings obstruct real upper rays across their complete footprint',()=>{
 const g=fresh(),b=completedFixture(g,'megaTower',0,true),box=g.vertical175.geometry().find(q=>q.owner===b.id&&q.type==='structure');assert.deepEqual({x:box.x,y:box.y,w:box.w,h:box.h,z:box.z,d:box.d},{x:b.gx,y:b.gy,w:b.w,h:b.h,z:0,d:60});
 const origin={x:b.left/32-1,y:b.y/32,z:30},blocked=g.vertical175.raycast(origin,0,0,b.w+2);assert.equal(blocked.type,'structure');assert.equal(blocked.entity.owner,b.id);assert.equal(blocked.distance,1);
 assert.equal(g.vertical175.raycast({...origin,z:61},0,0,b.w+2).type,'miss');
 const before=g.vertical175.geometry();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.vertical175.geometry(),before);
 const old=fresh(false),legacy=completedFixture(old,'megaTower'),legacyBox=old.vertical175.geometry().find(q=>q.owner===legacy.id);assert.equal(legacyBox.d,C.VerticalCitadel175.structureHeight);assert.deepEqual([legacyBox.w,legacyBox.h],C.BUILDINGS.megaTower.size);
});

test('202 expedition parcels retain all twelve identities, stocks and contracts outside the city expansion plot',()=>{
 const old=C.Expeditions.SITES,metric=C.Expeditions.sitesFor({cityGeometry202:1});assert.equal(C.Expeditions.sitesFor(),old);assert.equal(metric.length,old.length);assert.ok(Object.isFrozen(metric));
 for(const s of metric){const original=C.Expeditions.BY_ID[s.id],p=clone(s);delete p.metric202;p.x=original.x;p.y=original.y;assert.deepEqual(p,original);assert.equal(C.Expeditions.siteFor(s.id,{cityGeometry202:1}),s);}
 assert.deepEqual(metric.filter(s=>s.metric202===1).map(s=>[s.id,s.x,s.y]),[['clinique',3904,1152],['poste',3904,2784]]);
 for(const id of['clinique','poste']){const s=C.Expeditions.siteFor(id,{cityGeometry202:1});assert.ok(s.x-45>3552&&s.x+45<4096);assert.equal(C.Expeditions.siteFor(id),C.Expeditions.BY_ID[id]);}
 assert.throws(()=>C.Expeditions.sitesFor({cityGeometry202:2}));
});

test('202 native vehicle purchase, finite refuelling, driving and Continue use a clear metric depot service area',()=>{
 const g=fresh();assert.ok(Math.hypot(g.player.x-g.core().x,g.player.y-g.core().y)>C.Expeditions.RULES.homeRange);assert.equal(g.expeditions.overview().atHome,true);
 legacyAge(g,1850);completedFixture(g,'expeditionGarage');completedFixture(g,'expeditionOffice');for(const k of['wood','scrap','food'])g.resources[k]=300;g.resources.fuel=50;
 assert.equal(g.worldEvolution.selectVehicle('break'),true);const profile=C.WorldEvolution.RULES.vehicles.break,before={...g.resources},purchase=g.expeditions.buildCar();assert.ok(purchase.ok,purchase.reason);const v=g.expeditions.car();assert.equal(v.metric174,1);assert.equal(v.fuel,0);assert.equal(C.bagTotal(v.cargo),0);
 for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],before[k]-(profile.cost[k]||0));assert.equal(g.expeditions.carClear(v.x,v.y),true);assert.ok(v.x-g.core().right>0||g.core().left-v.x>0||v.y-g.core().bottom>0||g.core().top-v.y>0);
 const body=g.expeditions.vehicleBody175();for(const actor of[g.player,...g.units,...g.zombies])assert.equal(globalThis.DeadwallMetric174.bodyCircle(body,actor,actor.radius),false,'paid parking preserves each physical actor');
 const residualView={left:v.x+50,right:v.x+300,top:v.y-100,bottom:v.y+100};assert.ok(body.x+body.w/2>residualView.left);assert.ok(g.depthEntries(residualView).some(entry=>entry.kind===6&&entry.entity.id===v.id),'a partially visible metric car remains in the render queue');
 // Find a real free standing point which is both near the car and within the depot service range.
 let service=null;for(let i=0;i<72&&!service;i++){const a=i*Math.PI/36,r=g.expeditions.vehicleRadius174()+g.player.radius+8,p={x:v.x+Math.cos(a)*r,y:v.y+Math.sin(a)*r};if(!g.friendlyPositionClear(g.player,p.x,p.y))continue;Object.assign(g.player,p);const o=g.expeditions.overview();if(o.nearCar&&o.atHome)service=p;}assert.ok(service,'reachable car/depot service pose');
 const fuelTotal=g.resources.fuel+v.fuel,refuelling=g.expeditions.refuel();assert.ok(refuelling.ok,refuelling.reason);assert.equal(v.fuel,profile.tank);assert.equal(g.resources.fuel+v.fuel,fuelTotal);
 const board=g.expeditions.board();assert.ok(board.ok,board.reason);const start={x:v.x,y:v.y,fuel:v.fuel};g.input.keys.add('KeyD');for(let i=0;i<5;i++)g.expeditions.drive(.1);g.input.keys.clear();assert.ok(Math.hypot(v.x-start.x,v.y-start.y)>0);assert.ok(v.fuel<start.fuel);assert.equal(g.expeditions.carClear(v.x,v.y),true);
 const car=clone(v),resources={...g.resources};assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.expeditions.car(),car);assert.deepEqual(g.resources,resources);assert.equal(g.player.radius,g.expeditions.vehicleRadius174());assert.equal(g.expeditions.board().ok,true);
 const search=ReturnRoutes.createSearch(g,'car'),returning=search.find(g.expeditions.car());assert.equal(returning.status,'connected');for(let i=1;i<returning.path.length;i++)assert.equal(search.segment(returning.path[i-1],returning.path[i]),true);
 // The moved medical stop still owns the same finite physical work and loot.
 const raw=g.serialize();raw.expeditions.intel=6;assert.equal(g.restoreSave(raw),true);standAt(g,g.player,g.core());const departure=g.expeditions.select('clinique');assert.ok(departure.ok,departure.reason);const target=g.expeditions.overview().sites.find(s=>s.id==='clinique');assert.deepEqual([target.x,target.y],[3904,1152]);
 standAt(g,g.player,{...target,renderSize:86,fixture:true});g.input.keys.add('KeyE');for(let i=0;i<30;i++)g.expeditions.work(.25);g.input.keys.clear();const medical=g.expeditions.snapshot().sites.find(s=>s.id==='clinique');assert.equal(medical.reported,true);assert.ok(C.bagTotal(g.player.carry)>0);assert.equal(medical.stock.fuel+g.player.carry.fuel,target.fuel);
});

test('202 return searches reach the physical depot edge for foot and metric vehicles',()=>{
 const core={x:2048,y:2048,left:1888,right:2208,top:1888,bottom:2208,health:100,dead:false},radius=80,g={world:{cityGeometry202:1},core:()=>core,expeditions:{vehicleRadius174:()=>radius,carClear:()=>true},friendlyPositionClear:()=>true,fieldcraft:{workAt(p,b,reach){const edge=Math.hypot(p.x-C.clamp(p.x,b.left,b.right),p.y-C.clamp(p.y,b.top,b.bottom));return edge<=reach&&edge>p.radius;}}};
 for(const[mode,start]of[['foot',{x:core.right+30,y:core.y}],['car',{x:core.right+radius+20,y:core.y}]]){assert.ok(Math.hypot(start.x-core.x,start.y-core.y)>150);const found=ReturnRoutes.createSearch(g,mode).find(start);assert.equal(found.status,'connected');assert.equal(found.units,0);assert.deepEqual(found.path,[start]);}
});
