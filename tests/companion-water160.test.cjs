'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
require('../src/frontier-survey.js');
const Evolution=require('../src/world-evolution.js');
const Context=require('../src/codex-context160.js'),Geometry=require('../src/codex-geometry160.js');

test('Malik follows across the real G10 bridge without treating visible water as a walkable shortcut',()=>{
 const rules=C.WorldEvolution.RULES.companionRules,tactics=C.FrontierTacticsRules,
  ruleSnapshot=JSON.stringify({rules,tactics}),record=Context.get('DW-0265'),
  p={...Context.preset('codex160-0265'),id:'P9000',programme160:record.id,context160:record,x:0,y:0,a:0},
  plan=Geometry.plan(p,17117,0),water=plan.terrain160.find(o=>o.kind==='water'&&o.blocked),
  bridge=plan.terrain160.find(o=>o.kind==='bridge'),solids=[...plan.walls,...plan.objects];
 assert.ok(water&&bridge,'The authored bridge contains actual water and an actual dry deck.');
 const start={x:bridge.x-2,y:water.y-2,z:0,inside:null,a:0,repath:0,cool:0},
  f={active:false,generation:10,x:start.x,y:water.y+water.h+3.5,z:0,inside:null,a:0,car:null},
  desired={x:f.x-rules.followDistance,y:f.y-1.5},calls={optical:0,movement:0,resume:0,shots:0},positions=[];
 const blocked=(x,y,r=rules.radius)=>x<r||y<r||x>p.w-r||y>p.h-r||
  Geometry.terrainMovement(p,plan,x,y,r)||solids.some(o=>G.circleRect(x,y,r,o));
 function sweep(a,b,r,optical){
  const boxes=[...solids,...Geometry.rects(plan,{}, {optical})],parts=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.05));
  for(let i=0;i<=parts;i++){
   const x=a.x+(b.x-a.x)*i/parts,y=a.y+(b.y-a.y)*i/parts;
   if(x<r||y<r||x>p.w-r||y>p.h-r||boxes.some(o=>G.circleRect(x,y,r,o)))return false;
  }
  return true;
 }
 // World adapters expose the authoritative local rectangles; neither reader
 // changes actors, clocks, terrain, path budgets or the authored plan.
 const road={a:{x:p.w/2,y:p.h/2},b:{x:p.w/2+1,y:p.h/2},width:8},world={
  seed:17117,generation:10,size:24576,home:{x:p.w/2,y:p.h/2},pois:[p],roads:[road],
  nearPOI:()=>[],blocked,
  line(a,b,z,inside,ignore,r=.015){assert.equal(this,world);calls.optical++;return sweep(a,b,r,true);},
  movementLine(a,b,z,inside,ignore,r=rules.radius){assert.equal(this,world);calls.movement++;return sweep(a,b,r,false);}
 };
 const g={world:{seed:17117},state:'playing',paused:false,gameOver:false,activeOverlay:null,phase:'horde',
  elapsed:0,population:rules.minimumPopulation,resources:{food:100,ammo:20,scrap:30},
  player:{health:100,maxHealth:100,dead:false,carry:{ammo:8,medicine:2,scrap:3}},
  frontier:{world:()=>world,position:()=>f,snapshot:()=>({...f}),active:()=>f.active,discoveries:()=>[],
   companionShot(){calls.shots++;return false;}},
  canIssueCommand:()=>true,save:()=>true,serialize:()=>({}),restoreSave(){},startNew(){},refreshMetrics(){},
  update(dt){this.elapsed+=dt;return dt;},audio:{shot(){assert.fail('No target exists in this fixture.');}},
  companionsPack:{
   // This is a single restored starting position. All following positions are
   // produced exclusively by the installed native companionStep controller.
   resumePosition(id,frame){assert.equal(id,'malik');assert.equal(frame,f);calls.resume++;return{...start};},
   control(){return{};},
   record(id,point){assert.equal(id,'malik');positions.push({...point});}
  }
 };
 const api=Evolution.install(g),beforeAssignment=g.resources.food;
 assert.equal(api.assignCompanion('malik'),true,'Malik is assigned through the real command API.');
 assert.equal(g.resources.food,beforeAssignment-rules.assignmentFood);
 assert.deepEqual(api.snapshot().companions,[{id:'malik',health:100,order:'follow'}]);
 assert.deepEqual(g.companionsPack.control(),{},'The native follow command supplies the goal without any fixture override.');
 assert.equal(blocked(start.x,start.y),false);assert.equal(blocked(f.x,f.y),false);assert.equal(blocked(desired.x,desired.y),false);
 assert.equal(world.line(start,f,0,null,null,.015),true,'Vision crosses the actual water.');
 assert.equal(world.movementLine(start,f,0,null,null,rules.radius),false,'The visible direct shortcut is physically forbidden.');
 const budget={resources:{...g.resources},carry:{...g.player.carry},health:g.player.health},planSnapshot=JSON.stringify(plan);
 f.active=true;let previous=start,ticks=0,crossedDeck=false;
 const dt=.05;
 for(;ticks<800;ticks++){
  const count=positions.length;assert.equal(g.update(dt),dt);
  assert.equal(positions.length,count+1,'Every live update records the actual assigned companion.');
  const point=positions.at(-1);
  assert.equal(blocked(point.x,point.y),false,'Every live position remains outside water, piers, walls and furniture.');
  assert.equal(world.movementLine(previous,point,0,null,null,rules.radius),true,'Each complete body sweep is clear.');
  assert.ok(Math.hypot(point.x-previous.x,point.y-previous.y)<=rules.speed*dt+1e-9,'The native speed bounds every step.');
  if(point.y>water.y+rules.radius&&point.y<water.y+water.h-rules.radius){
   assert.ok(point.x>=bridge.x+rules.radius&&point.x<=bridge.x+bridge.w-rules.radius,'The crossing uses the physical dry deck.');
   crossedDeck=true;
  }
  previous=point;
  if(Math.hypot(point.x-desired.x,point.y-desired.y)<=.21){ticks++;break;}
 }
 assert.ok(ticks<800,'Native bounded pathfinding and companionStep reach the opposite bank.');
 assert.ok(crossedDeck,'Malik actually crosses the dry bridge instead of remaining stranded.');
 assert.ok(Math.hypot(previous.x-f.x,previous.y-f.y)<=Math.hypot(rules.followDistance,1.5)+.21,'Malik rejoins the commander at the native formation distance.');
 assert.equal(calls.resume,1,'Only the initial saved position is resumed; there is no synthetic repositioning.');
 assert.ok(calls.movement>0&&calls.optical>0&&calls.shots>0);
 assert.deepEqual({resources:g.resources,carry:g.player.carry,health:g.player.health},budget,'Following consumes no extra food, ammunition or health.');
 assert.deepEqual(api.snapshot().companions,[{id:'malik',health:100,order:'follow'}]);
 assert.ok(Math.abs(api.snapshot().clock-ticks*dt)<1e-9,'The installed simulation advances only by the supplied native timesteps.');
 assert.ok(Math.abs(g.elapsed-ticks*dt)<1e-9);
 assert.equal(JSON.stringify(plan),planSnapshot);assert.equal(JSON.stringify({rules,tactics}),ruleSnapshot);
 // Once on dry ground, the historical line-only world still receives its
 // native receiver and keeps the same bounded physical follow step.
 delete world.movementLine;const opticalBefore=calls.optical,positionCount=positions.length;
 g.update(dt);
 assert.ok(calls.optical>opticalBefore);assert.equal(positions.length,positionCount+1);
 assert.equal(blocked(positions.at(-1).x,positions.at(-1).y),false);
 assert.ok(Math.hypot(positions.at(-1).x-previous.x,positions.at(-1).y-previous.y)<=rules.speed*dt+1e-9);
 assert.deepEqual({resources:g.resources,carry:g.player.carry,health:g.player.health},budget);
 assert.equal(JSON.stringify(plan),planSnapshot);assert.equal(JSON.stringify({rules,tactics}),ruleSnapshot);
});
