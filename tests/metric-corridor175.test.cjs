'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{prepareMetricVehicle174}=require('../scripts/metric174-fixtures.cjs');
const {prepareMetricCorridor175}=require('../scripts/metric175-fixtures.cjs');
const {g}=bootDocument134(),C=globalThis.DeadwallCore,M=globalThis.DeadwallMetric174;
function snapshot(){const s=g.serialize();delete s.timestamp;return s;}
function parking(fractionY,{walls=true}={}){
 g.startNew('standard','17117');g.campaignIntro132.skip();prepareMetricVehicle174(g,'bus');assert.ok(g.expeditions.activateMetricScale174().ok);
 const car=g.expeditions.car(),origin={x:car.x,y:car.y,angle:car.angle},tileY=Math.floor(car.y/32),
  offsets=[0,...Array.from({length:8},(_,i)=>[i+1,-i-1]).flat()],actors=[g.player,...g.units,...g.zombies].filter(u=>!u.dead),
  maxBoost=Math.max(1,...Object.values(C.Infrastructure.SURFACES).map(s=>s.truckSpeed)),
  forward=C.Expeditions.RULES.acceleration*.05*.05*(1+2+3+4)*maxBoost;
 let selected=null;
 // Time-seeded workers change the first native parking pose. Choose an explicit
 // free test pose in both dimensions, preserving the requested fractional Y.
 // Only this purchased vehicle is positioned; no actor, obstacle or clock moves.
 search:for(const dx of offsets)for(const dy of offsets){
  const x=origin.x+dx*32,y=(tileY+dy)*32+(fractionY??origin.y%32),body=g.expeditions.vehicleBody175(x,y,0),
   foot={x,y:y+body.h/2+21},side={x,y:y+body.h/2+15};
  Object.assign(car,{x,y,angle:0});
  if(!g.expeditions.bodyClear175(body)||actors.some(u=>M.bodyCircle(body,u,u.radius||12))||
   ![foot,side].every(p=>g.friendlyPositionClear(g.player,p.x,p.y)&&g.hostileLineClear(p,car))||
   !(g.nightGear?.localLineClear(car,foot)??g.hostileLineClear(car,foot,false)))continue;
  // refuel must transfer exactly the declared bag, without a depot top-up.
  if(Math.hypot(foot.x-g.core().x,foot.y-g.core().y)<=C.Expeditions.RULES.homeRange)continue;
  const planned=[];
  if(walls){
   for(const gy of [Math.floor(y/32)-4,Math.ceil(y/32)+3])for(let gx=Math.floor(x/32)-5;gx<=Math.floor(x/32)+5;gx++){
    const b={x:gx*32+16,y:gy*32+16,w:32,h:32,a:0};
    if(g.world.placement(C.BUILDINGS.woodWall,gx,gy).valid&&!actors.some(u=>M.bodyCircle(b,u,(u.radius||12)+1)))planned.push(b);
   }
   if(planned.length<12||!planned.some(b=>M.bodyOverlap({...body,a:Math.PI/2},b))||
    !planned.some(b=>M.bodyCircle(b,body,Math.hypot(body.w,body.h)/2))||
    planned.some(b=>[foot,side].some(p=>M.bodyCircle(b,p,g.player.radius))))continue;
  }
  // Reserve all four real KeyD steps, including the sweep's conservative pad,
  // before constructing walls. A free starting rectangle alone is insufficient.
  const clear=(p,pad)=>{
   const q={...p,w:p.w+2*pad,h:p.h+2*pad};
   return g.expeditions.bodyClear175(p,pad)&&!planned.some(b=>M.bodyOverlap(q,b))&&!actors.some(u=>M.bodyCircle(q,u,u.radius||12));
  };
  if(!M.sweepBody(body,{...body,x:x+forward},clear,{step:C.MetricRules175.sweepStep,maxSteps:C.MetricRules175.maxSweepSteps}))continue;
  selected={car,foot,side,forward};break search;
 }
 if(!selected)Object.assign(car,origin);
 assert.ok(selected,'a bounded native clear parking pose, two free feet, real corridor walls and forward sweep');
 return selected;
}
function corridor(fractionY){
 const {car}=parking(fractionY),fixture=prepareMetricCorridor175(g),rows=fixture.walls.map(id=>g.world.buildings.get(id));
 assert.ok(rows.length>=12,'insufficient real wall fixture');
 assert.equal(g.expeditions.carClear(car.x,car.y),true);
 assert.equal(g.friendlyPositionClear({id:car.id,radius:g.expeditions.vehicleRadius174()/.9},car.x,car.y),false,'old circle would not fit');
 return {car,rows,fixture};
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
 const T=globalThis.DeadwallTactics,near={type:'woodWall',gx:Math.floor(car.x/32),gy:Math.ceil((body.y+body.h/2)/32),rotation:0};
 assert.equal(T.overlapsBuilding(near,g.player),false,'empty beside a bus must stay empty');
 const centre={...near,gy:Math.floor(car.y/32)};assert.equal(T.overlapsBuilding(centre,g.player),true);
 assert.equal(M.ownerBody175(g.player).w,body.w);assert.equal(Object.hasOwn(g.serialize().player,'physicalBody175'),false);
 assert.ok(g.expeditions.board().ok);assert.equal(M.ownerBody175(g.player),null);
});

test('175 shared browser corridor fixture uses finite native fuel transfer and no actor-overlapping walls',()=>{
 const {fixture}=corridor();
 assert.ok(fixture.walls.length>=12);assert.ok(g.expeditions.car().fuel>=3);assert.equal(g.player.carry.fuel,0);
 const before=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),before);
});

for(const fractionY of [0,.001,16,23.199,23.2,23.201,24,28.199,28.2,28.201,30,31.999])test('175 prepared corridor reserves the native boarding and exit flank at fractional Y '+fractionY,()=>{
 const {car,fixture}=corridor(fractionY);
 assert.ok(Math.abs(car.y%32-fractionY)<1e-9,'the prepared pose retains the requested Y fraction');
 const body=g.expeditions.vehicleBody175();
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
 const {car}=parking(undefined,{walls:false}),S=globalThis.DeadwallVertical175State,type='lookout2a177';
 // Native paid support placement, with declared finite materials and completion.
 // Keep terrain, actors and the prepared purchased vehicle in their positions.
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
