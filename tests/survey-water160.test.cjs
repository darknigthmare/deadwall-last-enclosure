'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),Q=require('../src/frontier-survey.js');
const Context=require('../src/codex-context160.js'),Geometry=require('../src/codex-geometry160.js');

function bridgeFixture(){
 const record=Context.get('DW-0265'),p={...Context.preset('codex160-0265'),id:'P9000',context160:record,programme160:record.id,x:0,y:0,a:0};
 const plan=Geometry.plan(p,17117,0),water=plan.terrain160.find(o=>o.kind==='water'&&o.blocked),
  start={x:p.w/2-10,y:water.y-2,z:0,a:0,poi:p.id},goal={x:p.w/2-10,y:water.y+water.h+2,z:0,inside:null,quiet:false},calls={optical:0,movement:0};
 const solids=[...plan.walls,...plan.objects],blocked=(x,y)=>x<.32||y<.32||x>p.w-.32||y>p.h-.32||
  Geometry.terrainMovement(p,plan,x,y,.32)||solids.some(o=>G.circleRect(x,y,.32,o));
 function sweep(a,b,r,optical){
  const list=[...solids,...Geometry.rects(plan,{}, {optical})],n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.1));
  for(let i=0;i<=n;i++)if(list.some(o=>G.circleRect(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r,o)))return false;
  return true;
 }
 const world={blocked,line(a,b,z,inside,ignore,r=.015){assert.equal(this,world);calls.optical++;return sweep(a,b,r,true);},
  movementLine(a,b,z,inside,ignore,r=.32){assert.equal(this,world);calls.movement++;return sweep(a,b,r,false);}};
 return{p,plan,start,goal,world,blocked,calls};
}

test('regional AI sees and hears across real water, but routes its body through the real bridge',()=>{
 const f=bridgeFixture(),rules={...C.FrontierTacticsRules,pathCell:1,pathMargin:12,pathNodes:2400},e={...f.start,hp:65,cool:0},budget={left:2};
 assert.equal(f.blocked(e.x,e.y),false);assert.equal(f.blocked(f.goal.x,f.goal.y),false);
 assert.equal(f.world.line(e,f.goal,0,null,null,.015),true,'water itself is not an optical wall');
 assert.equal(f.world.movementLine(e,f.goal,0,null,null,rules.enemyRadius),false,'the same direct trajectory is physically impassable');
 Q.hear(f.world,[e],f.goal,20,rules);assert.equal(e.mode,'investigate','hearing retains the optical reader across water');
 const path=Q.path(f.world,e,f.goal,rules,f.blocked);
 assert.ok(path&&path.length>2,'bounded pathfinding finds the actual bridge detour');
 assert.ok(path.some(point=>point.x>f.p.w/2-5),'the route reaches the dry bridge, not a water shortcut');
 let previous=e;for(const point of path){assert.equal(f.blocked(point.x,point.y),false);assert.equal(f.world.movementLine(previous,point,0,null,null,rules.enemyRadius),true);previous=point;}
 for(let i=0;i<500&&Math.hypot(e.x-f.goal.x,e.y-f.goal.y)>.7;i++){
  Q.step(f.world,e,f.goal,.04,rules,budget,f.blocked);assert.equal(f.blocked(e.x,e.y),false,'every live actor step stays outside the water and piers');
  budget.left=2;
 }
 assert.ok(Math.hypot(e.x-f.goal.x,e.y-f.goal.y)<=.7,'native pursuit actually reaches the opposite bank');
 assert.ok(f.calls.optical>0&&f.calls.movement>0,'vision/hearing and movement exercise their separate readers');
});

test('regional AI preserves the historical line fallback when no movement reader is supplied',()=>{
 const rules={...C.FrontierTacticsRules,pathCell:1,pathMargin:3,pathNodes:400},e={x:5,y:5,z:0,a:0},goal={x:8,y:5,z:0,quiet:false};
 let calls=0;const world={line(){assert.equal(this,world);calls++;return true;}};
 assert.ok(Q.path(world,e,goal,rules,()=>false)?.length>0);
 Q.step(world,e,goal,.04,rules,{left:1},()=>false);
 assert.ok(e.x>5&&calls>0,'the legacy world still uses its native physical line and progresses');
});
