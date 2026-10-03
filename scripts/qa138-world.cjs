'use strict';
// Production HTML order under a simulated DOM. Long approaches are prepared at
// physically clear points; steering, interactions and persistence are real.
const assert=require('node:assert/strict');
const {bootDocument134}=require('./qa-startup134.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
function start(type){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();const C=globalThis.DeadwallCore,c=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(c.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);break;}
 assert.ok(garage);g.refreshMetrics(true);g.tier={id:4};g.resources.wood=g.resources.scrap=500;
 assert.equal(g.worldEvolution.selectVehicle(type),true);const before=copy(g.resources),result=g.expeditions.buildCar();assert.equal(result.ok,true,result.reason);
 for(const[k,n]of Object.entries(C.WorldEvolution.RULES.vehicles[type].cost))assert.equal(g.resources[k],before[k]-n);
 return g;
}
function ticks(g,key,n,stop=()=>false){g.input.keys.clear();if(key)g.input.keys.add(key);for(let i=0;i<n&&!stop();i++){g.update(.04);g.input.pressed.clear();}g.input.keys.clear();}
function stage(g,domain,q,a=0,driving=true){
 const raw=g.serialize(),v=raw.expeditions.vehicle;
 // Finite cargo and fuel are prepared as a late-campaign travel fixture.
 v.fuel=10;v.cargo.food=3.125;v.driving=domain==='local'&&driving;v.angle=a;
 if(domain==='local'){Object.assign(v,q);Object.assign(raw.player,q);Object.assign(raw.frontier,{active:false,anchor:null,z:0,inside:null,car:null});}
 else Object.assign(raw.frontier,{active:true,anchor:{x:raw.player.x,y:raw.player.y},...q,z:0,inside:null,a,car:{id:v.id,...q,a,driving}});
 assert.equal(g.restoreSave(raw),true);return g.expeditions.car();
}
function persisted(g){const f=g.frontier.position(),v=copy(g.expeditions.car()),bag=copy(g.player.carry);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.frontier.position(),f);assert.deepEqual(g.expeditions.car().cargo,v.cargo);assert.equal(g.expeditions.car().fuel,v.fuel);assert.equal(g.expeditions.car().id,v.id);assert.deepEqual(g.player.carry,bag);}
function seam(type,observe=false,side='east',generation=7){
 const g=start(type);if(generation===6)require('../tests/helpers/generation141.cjs').legacy(g,6);else if(generation<6)require('../tests/helpers/legacy-region135.cjs').pinLegacyRegion(g,generation);const w=g.frontier.world(),vp=g.worldEvolution.vehicleProfile(),axis=side==='north'||side==='south'?'y':'x',max=side==='east'||side==='south',origin={x:2048,y:2048,[axis]:max?3950:146},outKey={east:'KeyD',west:'KeyA',north:'KeyW',south:'KeyS'}[side],backKey={east:'KeyA',west:'KeyD',north:'KeyS',south:'KeyW'}[side],angle={east:0,west:Math.PI,north:-Math.PI/2,south:Math.PI/2}[side],edge=axis==='x'?(max?w.home.maxX:w.home.minX):(max?w.home.maxY:w.home.minY),arrival={x:w.home.x,y:w.home.y,[axis]:edge+(max?4:-4)};
 assert.equal(w.generation,generation,'The prepared scenario must use its stated world generation.');
 assert.equal(g.expeditions.carClear(origin.x,origin.y),true,'Local fixture starts in a physically free vehicle footprint.');
 assert.equal(w.vehicleClear(arrival.x,arrival.y,angle,vp.w,vp.h),true,'Regional arrival footprint is clear.');
 const v=stage(g,'local',origin,angle),id=v.id;ticks(g,outKey,160,()=>g.frontier.active());
 const departed=g.frontier.active(),stopped={x:g.player.x,y:g.player.y};
 if(observe)return{scenario:type+'-seam',generation:w.generation,departed,stopped,manualEnter:g.frontier.enter(),radius:g.player.radius};
 assert.equal(departed,true,'The real vehicle must reach the regional transition through movement input.');
 assert.equal(g.frontier.position().car.id,id);ticks(g,outKey,30);persisted(g);
 const remote=g.frontier.position();assert.ok((remote[axis]-edge)*(max?1:-1)>8);assert.equal(g.frontier.world().vehicleClear(remote.x,remote.y,remote.car.a,vp.w,vp.h),true);
 ticks(g,backKey,100,()=>!g.frontier.active());assert.equal(g.frontier.active(),false);assert.equal(g.expeditions.driving(),true);assert.equal(g.expeditions.car().id,id);assert.equal(g.expeditions.car().cargo.food,3.125);
 assert.equal(g.expeditions.carClear(g.player.x,g.player.y),true,'Returning vehicle fits the local arrival.');const returned=g.player[axis];ticks(g,backKey,20);assert.ok((g.player[axis]-returned)*(max?-1:1)>5);persisted(g);
 return{scenario:type+'-seam',status:'passed',browser:false,departed,localStart:origin,remote,side,generation:w.generation,localReturn:{x:g.player.x,y:g.player.y,[axis]:returned},finalLocal:{x:g.player.x,y:g.player.y},id,fuel:g.expeditions.car().fuel,cargo:g.expeditions.car().cargo};
}
function doors(type,observe=false){
 const g=start(type),w=g.frontier.world(),vp=g.worldEvolution.vehicleProfile(),q={x:w.home.maxX+30,y:w.home.y};assert.equal(w.vehicleClear(q.x,q.y,0,vp.w,vp.h),true);stage(g,'region',q);const G=globalThis.DeadwallFrontierGeometry;
 const before=g.frontier.position();assert.equal(g.frontier.board(),true);const after=g.frontier.position(),local=G.local({...after.car,w:vp.w,h:vp.h},after.x,after.y),overlap=G.circleRect(local.x,local.y,.32,{x:0,y:0,w:vp.w,h:vp.h});
 if(observe)return{scenario:type+'-doors',before,after,overlap};
 assert.equal(overlap,false,'Disembarkation clears the vehicle body including the physical foot radius.');assert.equal(w.blocked(after.x,after.y,.32),false);persisted(g);
 ticks(g,'KeyS',6);assert.ok(g.frontier.position().y>after.y+.3,'Actual walking after disembarkation is possible.');assert.equal(g.frontier.board(),true);assert.equal(g.frontier.position().car.driving,true);persisted(g);
 return{scenario:type+'-doors',status:'passed',browser:false,overlap,exit:after,restoredAndReboarded:true};
}
function destroyed(observe=false){
 const g=start('bus'),w=g.frontier.world(),vp=g.worldEvolution.vehicleProfile(),q={x:w.home.maxX+30,y:w.home.y};assert.equal(w.vehicleClear(q.x,q.y,0,vp.w,vp.h),true);stage(g,'region',q);g.player.invulnerable=0;g.frontier.damage(10000);const after=g.frontier.position();ticks(g,'KeyS',20);const end=g.frontier.position(),distance=Math.hypot(end.x-after.x,end.y-after.y);
 if(observe)return{scenario:'destroyed',after,end,distance};
 assert.equal(g.expeditions.car().health,0);assert.equal(after.car.driving,false);assert.ok(distance>.5,'A destroyed regional vehicle must not imprison its driver.');persisted(g);
 const old=g.serialize();Object.assign(old.frontier,{x:old.frontier.car.x,y:old.frontier.car.y});const oldCopy=copy(old);assert.equal(g.restoreSave(old),true);assert.deepEqual(old,oldCopy);ticks(g,'KeyS',20);
 const escaped=g.frontier.position(),G=globalThis.DeadwallFrontierGeometry,overlap=f=>{const local=G.local({...f.car,w:vp.w,h:vp.h},f.x,f.y);return G.circleRect(local.x,local.y,.32,{x:0,y:0,w:vp.w,h:vp.h});};assert.equal(overlap(escaped),false,'Legacy save trapped inside a destroyed vehicle can walk out.');persisted(g);ticks(g,'KeyW',25);assert.equal(overlap(g.frontier.position()),false,'The wreck keeps its collision when approached from outside.');
 return{scenario:'destroyed',status:'passed',browser:false,after,end,distance,legacyEscape:escaped,wreckRemainsSolid:true};
}
function district(observe=false){
 const g=start('bus'),G=globalThis.DeadwallFrontierGeometry,w=g.frontier.world(),vp=g.worldEvolution.vehicleProfile();g.resources.stone=500;
 assert.equal(g.worldEvolution.claimDistrict('north'),true);assert.equal(g.worldEvolution.buildDistrict('north','housing'),true);
 const d=g.worldEvolution.overview().districts.find(d=>d.id==='north'),shape={x:d.pos.x-12,y:d.pos.y-17.5,a:d.pos.a,w:20,h:9};assert.equal(d.pos.a,0);
 let q,key;
 for(const side of [-1,1]){const point={x:shape.x+side*(shape.w/2+vp.w/2+.8),y:shape.y};if(Array.from({length:40},(_,i)=>i*.1).every(n=>w.vehicleClear(point.x-side*n,point.y,side>0?Math.PI:0,vp.w,vp.h))){q=point;key=side>0?'KeyA':'KeyD';break;}}
 assert.ok(q,'Annexe fixture has a real unobstructed approach for the bus.');stage(g,'region',q,key==='KeyD'?0:Math.PI);assert.equal(G.obb({...q,a:0,w:vp.w,h:vp.h},shape),false);
 ticks(g,key,35);const after=g.frontier.position(),overlap=G.obb({...after,w:vp.w,h:vp.h},shape);
 if(observe)return{scenario:'district',district:d.id,shape,start:q,after,overlap};
 assert.equal(overlap,false,'The full bus nose must stop at the annex facade.');assert.ok(Math.hypot(after.x-q.x,after.y-q.y)>.1,'The bus actually approached before colliding.');persisted(g);
 const fuel=g.expeditions.car().fuel;ticks(g,key,10);assert.equal(g.expeditions.car().fuel,fuel,'Collision alone does not consume fuel.');const atWall=g.frontier.position();ticks(g,key==='KeyD'?'KeyA':'KeyD',10);assert.ok(Math.hypot(g.frontier.position().x-atWall.x,g.frontier.position().y-atWall.y)>.5,'Actual reverse movement leaves the facade.');
 const parallel={x:shape.x-shape.w/2-vp.h/2-.2,y:shape.y};assert.equal(w.vehicleClear(parallel.x,parallel.y,Math.PI/2,vp.w,vp.h),true);assert.equal(G.obb({...parallel,a:Math.PI/2,w:vp.w,h:vp.h},shape),false);stage(g,'region',parallel,Math.PI/2);const beforeTurn=g.frontier.position(),turnFuel=g.expeditions.car().fuel;ticks(g,'KeyD',3);assert.deepEqual(g.frontier.position(),beforeTurn,'A blocked rotation must not place the bus nose inside the annex.');assert.equal(g.expeditions.car().fuel,turnFuel);persisted(g);
 return{scenario:'district',status:'passed',browser:false,district:d.id,shape,start:q,after,overlap,blockedTurn:parallel};
}
const scenarios={'bus-north':o=>seam('bus',o,'north'),'bus-west':o=>seam('bus',o,'west'),'bus-south':o=>seam('bus',o,'south'),'bus-g5':o=>seam('bus',o,'east',5),'bus-g6':o=>seam('bus',o,'east',6),'bus-seam':o=>seam('bus',o),'truck-seam':o=>seam('truck',o),'bus-doors':o=>doors('bus',o),'truck-doors':o=>doors('truck',o),destroyed,district};
module.exports={scenarios};
if(require.main===module){try{const name=process.argv[2];if(!scenarios[name])throw Error('Unknown scenario '+name);process.stdout.write(JSON.stringify(scenarios[name](process.argv.includes('--observe')))+'\n');}catch(e){console.error(e.stack);process.exitCode=1;}}
