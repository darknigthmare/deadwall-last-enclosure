'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{prepareMetricVehicle174}=require('../scripts/metric174-fixtures.cjs');
const {g}=bootDocument134(),C=globalThis.DeadwallCore,M=globalThis.DeadwallMetric174;
function snapshot(){const s=g.serialize();delete s.timestamp;return s;}
function corridor(){
 g.startNew('standard','17117');g.campaignIntro132.skip();prepareMetricVehicle174(g,'bus');assert.ok(g.expeditions.activateMetricScale174().ok);
 const car=g.expeditions.car();car.angle=0;
 // A completed pair of real walls is a declared test fixture. The world layout,
 // resources, neighbouring props and existing buildings are never removed.
 const gy=Math.floor(car.y/32),top=gy-4,bottom=gy+3,xx=Math.floor(car.x/32);
 const rows=[];for(const y of [top,bottom])for(let x=xx-5;x<=xx+5;x++){
  const can=g.world.placement(C.BUILDINGS.woodWall,x,y);if(!can.valid||[g.player,...g.units,...g.zombies].some(u=>!u.dead&&M.bodyCircle({x:x*32+16,y:y*32+16,w:32,h:32,a:0},u,(u.radius||12)+1)))continue;
  const b=new(g.core().constructor)(g.nextId++,'woodWall',x,y,0,1);g.world.add(b);rows.push(b);
 }
 g.refreshMetrics(true);
 assert.ok(rows.length>=12,'insufficient real wall fixture');
 assert.equal(g.expeditions.carClear(car.x,car.y),true);
 assert.equal(g.friendlyPositionClear({id:car.id,radius:g.expeditions.vehicleRadius174()/.9},car.x,car.y),false,'old circle would not fit');
 return {car,rows};
}
test('175 paid metric bus occupies only its oriented rectangle, not the empty corner of its radius',()=>{
 const {car}=corridor();const b=g.expeditions.vehicleBody175();assert.equal(b.w,10.4*32);assert.equal(b.h,2.55*32);
 assert.equal(g.expeditions.bodyClear175({...b,a:Math.PI/2}),false);
 const side={x:car.x,y:car.y+b.h/2+15};assert.equal(g.friendlyPositionClear(g.player,side.x,side.y),true);assert.equal(g.friendlyPositionClear(g.player,car.x,car.y),false);
 assert.equal(g.expeditions.overlapsVehicle175({x:car.x-8,y:car.y+100,w:16,h:16}),false);
 assert.equal(g.expeditions.overlapsVehicle175({x:car.x-8,y:car.y-8,w:16,h:16}),true);
});
test('175 real Continue preserves a narrow parking pose and every persisted field',()=>{
 corridor();assert.equal(g.save(false),true);const before=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),before);
 assert.equal(g.expeditions.carClear(g.expeditions.car().x,g.expeditions.car().y),true);
});
test('175 a blocked rotation changes neither pose nor finite fuel, then side exit succeeds',()=>{
 const {car}=corridor(),body=g.expeditions.vehicleBody175();
 Object.assign(g.player,{x:car.x,y:car.y+body.h/2+21});assert.ok(g.expeditions.board().ok);car.fuel=3;
 const before=JSON.stringify({x:car.x,y:car.y,a:car.angle,fuel:car.fuel,stats:g.expeditions.overview().stats});
 g.input.keys.clear();g.input.keys.add('KeyS');g.expeditions.drive(.1);g.input.keys.clear();
 assert.equal(JSON.stringify({x:car.x,y:car.y,a:car.angle,fuel:car.fuel,stats:g.expeditions.overview().stats}),before);
 const saved=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),saved);
 assert.ok(g.expeditions.board().ok);const v=g.expeditions.car();assert.equal(v.driving,false);
 assert.ok(M.bodyDistance(g.expeditions.vehicleBody175(),g.player)>g.player.radius);assert.ok(Math.abs(g.player.x-v.x)<1e-6,'exit next to the flank, not a circumscribed ring');
});
test('175 straight motion succeeds inside the corridor and charges only actual travel',()=>{
 const {car}=corridor(),body=g.expeditions.vehicleBody175();Object.assign(g.player,{x:car.x,y:car.y+body.h/2+21});assert.ok(g.expeditions.board().ok);car.fuel=3;
 const start={x:car.x,y:car.y,fuel:car.fuel};g.input.keys.add('KeyD');for(let i=0;i<4;i++)g.expeditions.drive(.05);g.input.keys.clear();
 assert.ok(car.x>start.x);assert.equal(car.y,start.y);assert.ok(car.fuel<start.fuel);assert.equal(g.expeditions.carClear(car.x,car.y),true);
});

test('175 native wall completion uses the driving body, not its circumscribed empty space',()=>{
 const {car}=corridor(),body=g.expeditions.vehicleBody175();
 Object.assign(g.player,{x:car.x,y:car.y+body.h/2+21});assert.ok(g.expeditions.board().ok);
 g.expeditions.overview();
 const T=globalThis.DeadwallTactics,near={type:'woodWall',gx:Math.floor(car.x/32),gy:Math.floor(car.y/32)+2,rotation:0};
 assert.equal(T.overlapsBuilding(near,g.player),false,'empty beside a bus must stay empty');
 const centre={...near,gy:Math.floor(car.y/32)};assert.equal(T.overlapsBuilding(centre,g.player),true);
 assert.equal(M.ownerBody175(g.player).w,body.w);assert.equal(Object.hasOwn(g.serialize().player,'physicalBody175'),false);
 assert.ok(g.expeditions.board().ok);assert.equal(M.ownerBody175(g.player),null);
});

test('175 shared browser corridor fixture uses finite native fuel transfer and no actor-overlapping walls',()=>{
 g.startNew('standard','17117');g.campaignIntro132.skip();prepareMetricVehicle174(g,'bus');assert.ok(g.expeditions.activateMetricScale174().ok);
 const {prepareMetricCorridor175}=require('../scripts/metric175-fixtures.cjs'),fixture=prepareMetricCorridor175(g);
 assert.ok(fixture.walls.length>=12);assert.ok(g.expeditions.car().fuel>=3);assert.equal(g.player.carry.fuel,0);
 const before=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),before);
});

for(const fractionY of [0,16,24,30,31.999])test('175 prepared corridor reserves the native boarding and exit flank at fractional Y '+fractionY,()=>{
 g.startNew('standard','17117');g.campaignIntro132.skip();prepareMetricVehicle174(g,'bus');assert.ok(g.expeditions.activateMetricScale174().ok);
 const car=g.expeditions.car(),tileY=Math.floor(car.y/32);let selected=null;
 // These are explicitly prepared, physically free poses, not removed obstacles.
 for(const offset of [0,1,-1,2,-2,3,-3]){
  const y=(tileY+offset)*32+fractionY,body=g.expeditions.vehicleBody175(car.x,y,0),foot={x:car.x,y:y+body.h/2+21};
  if(g.expeditions.carClear(car.x,y)&&g.friendlyPositionClear(g.player,foot.x,foot.y)&&![g.player,...g.units,...g.zombies].some(u=>!u.dead&&M.bodyCircle(body,u,u.radius||12))){selected={y,foot};break;}
 }
 assert.ok(selected,'a native clear parking pose and boarding point before test walls');car.y=selected.y;car.angle=0;
 const {prepareMetricCorridor175}=require('../scripts/metric175-fixtures.cjs'),fixture=prepareMetricCorridor175(g),body=g.expeditions.vehicleBody175();
 assert.ok(fixture.walls.length>=12);assert.equal(g.expeditions.bodyClear175(body),true);
 assert.equal(g.expeditions.bodyClear175({...body,a:Math.PI/2}),false,'the complete lower wall still refuses a quarter turn');
 assert.equal(g.friendlyPositionClear({id:car.id,radius:Math.hypot(body.w,body.h)/2/.9},car.x,car.y),false,'the former circular collider still cannot fit');
 assert.equal(g.friendlyPositionClear(g.player,fixture.foot.x,fixture.foot.y),true);
 assert.equal(g.friendlyPositionClear(g.player,car.x,car.y+body.h/2+15),true);
 const lower=fixture.walls.map(id=>g.world.buildings.get(id)).filter(b=>b.gy>car.y/32);
 assert.ok(lower.length>0);assert.ok(Math.min(...lower.map(b=>b.gy*32-fixture.foot.y))>g.player.radius,'the actual foot circle has a full margin from the lower wall');
 const before=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),before);
 assert.ok(g.expeditions.board().ok,'native boarding accepts the prepared flank');assert.ok(g.expeditions.board().ok,'native side exit succeeds');
 assert.equal(g.expeditions.driving(),false);assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);
 assert.ok(M.bodyDistance(g.expeditions.vehicleBody175(),g.player)>g.player.radius);assert.ok(Math.abs(g.player.x-g.expeditions.car().x)<1e-6);
});

test('182 boarding cannot take the commander away from a real active staircase',()=>{
 g.startNew('standard','17117');g.campaignIntro132.skip();prepareMetricVehicle174(g,'bus');assert.ok(g.expeditions.activateMetricScale174().ok);
 const car=g.expeditions.car(),S=globalThis.DeadwallVertical175State,type='lookout2a177';
 // Native paid support placement, with declared finite materials and completion.
 // Keep terrain, actors and the purchased vehicle in their existing positions.
 g.resources.wood=g.resources.scrap=g.resources.stone=500;let candidate=null;
 for(let y=Math.floor(car.y/32)-15;y<Math.floor(car.y/32)+15&&!candidate;y++)for(let x=Math.floor(car.x/32)-15;x<Math.floor(car.x/32)+15&&!candidate;x++)for(const rotation of [0,1,2,3]){
  const entrance=S.entrance({type,gx:x,gy:y,rotation});
  if(!g.world.placement(C.BUILDINGS[type],x,y,rotation).valid||!g.friendlyPositionClear(g.player,entrance.x,entrance.y)||Math.hypot(entrance.x-car.x,entrance.y-car.y)>230||!g.hostileLineClear(entrance,car))continue;
  candidate={x,y,rotation,entrance};break;
 }
 assert.ok(candidate,'a real staircase entrance within boarding range');
 assert.equal(g.placeOne(type,candidate.x,candidate.y,candidate.rotation),true);
 const support=g.world.atCell(candidate.x,candidate.y);support.progress=1;support.health=support.maxHealth;g.refreshMetrics(true);Object.assign(g.player,candidate.entrance);
 assert.equal(g.expeditions.overview().nearCar,true);assert.ok(g.vertical175.access(support.id).ok);
 for(const advance of [0,.1]){
  if(advance)g.vertical175.step(advance);
  assert.ok(g.vertical175.pose().travel);const before=snapshot();
  assert.equal(g.expeditions.board().ok,false,'stairs retain the commander even at their ground landing');
  assert.equal(g.expeditions.driving(),false);assert.deepEqual(snapshot(),before,'no vehicle, inventory, ID or persistent position changes');
 }
 for(let i=0;i<40;i++)g.vertical175.step(.1);
 assert.equal(g.vertical175.pose().site,support.id);assert.equal(g.vertical175.pose().z,2);
 const upstairs=snapshot();assert.equal(g.expeditions.board().ok,false);assert.deepEqual(snapshot(),upstairs);
 assert.ok(g.vertical175.access(support.id,-1).ok);
 for(let i=0;i<40;i++)g.vertical175.step(.1);
 assert.equal(g.vertical175.pose().site,null);assert.equal(g.vertical175.pose().travel,null);
 assert.ok(g.expeditions.board().ok,'boarding works again after the real descent');
});
