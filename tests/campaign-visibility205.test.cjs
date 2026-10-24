'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js'),A=require('../src/codex-campaign205.js'),V=require('../src/visibility146.js');
// Prepared observer fixtures on actual seeded G11 geometry. No campaign
// travel, device performance or human play time is inferred from these rays.
const world=W.create(17117,11,{detailVersion:13,ecologyVersion:1,hydrologyVersion:1});
const site=world.pois.find(p=>p.campaign205),plan=world.plan(site,0);
function observerAt(point,{inside=null,player=true,companions=[],night=false}={}){
 const f={active:true,generation:11,...point,z:0,inside,a:0};
 const game={world:{seed:world.seed,buildings:new Map()},elapsed:0,player:{health:player?100:0,dead:!player},units:[],daylight:()=>night?0:1,
  frontier:{position:()=>({...f}),active:()=>true,world:()=>world},
  worldEvolution:{overview:()=>({companions,districts:[]}),structureDestroyed:()=>false}};
 V.install(game);return game;
}
const enemy=(point,inside=site.id)=>({id:'qa-target205',...point,z:0,poi:inside,hp:30,dead:false});
function gate(){const e=A.template(site.type).base.entry;return{a:G.global(site,e.x,-1),b:G.global(site,e.x,1)};}
function doorway(){
 for(const volume of plan.volumes160)for(const distance of [.6,.8,1,1.2]){
  const a=G.global(site,volume.entry.x,volume.entry.y-distance),b=G.global(site,volume.entry.x,volume.entry.y+distance);
  if(!world.blocked(a.x,a.y,.32)&&!world.blocked(b.x,b.y,.32)&&world.movementLine(a,b,0,null,null,.32)&&world.line(a,b,0,null,null,.015))return{a,b};
 }
 assert.fail('A real building doorway must admit the native foot disc and sight ray.');
}

test('205 physical sight crosses the open site gate and a real building doorway without a parcel-roof barrier',()=>{
 for(const {a,b}of[gate(),doorway()]){
  assert.equal(world.line(a,b,0,null,null,.015),true);assert.equal(world.movementLine(a,b,0,null,null,.32),true);
  const game=observerAt(a),before=JSON.stringify(game.world),frame=game.visibility.frame();
  assert.equal(frame.canSeeRegional(enemy(b)),true);assert.equal(frame.snapshot().observers,1);
  assert.equal(frame.canSeeRegional({...enemy(b),z:1}),false);assert.equal(frame.canSeeRegional({...enemy(b),hp:0}),false);
  assert.equal(JSON.stringify(game.world),before);game.player.health=0;assert.equal(frame.canSeeRegional(enemy(b)),false);
 }
});

test('205 real opaque walls still hide contacts even inside the same compound',()=>{
 let pair;
 for(const wall of plan.walls){
  const vertical=wall.w<wall.h,x=wall.x+wall.w/2,y=wall.y+wall.h/2;
  const a=G.global(site,x-(vertical?.8:0),y-(vertical?0:.8)),b=G.global(site,x+(vertical?.8:0),y+(vertical?0:.8));
  if(!world.blocked(a.x,a.y,.1)&&!world.blocked(b.x,b.y,.1)&&!world.line(a,b,0,null,null,.015)){pair={a,b};break;}
 }
 assert.ok(pair,'Use a genuine solid wall with free points on both sides.');
 assert.equal(observerAt(pair.a).visibility.canSeeRegional(enemy(pair.b)),false);
});

test('205 a living allied observer sees through the open gate; physical light alone never observes',()=>{
 const {a,b}=gate(),ally={id:'lea',...a,z:0,inside:null,health:100,dead:false,riding:false};
 const game=observerAt(a,{player:false,companions:[ally]});assert.equal(game.visibility.canSeeRegional(enemy(b)),true);
 ally.health=0;assert.equal(game.visibility.canSeeRegional(enemy(b)),false);
 const dark=observerAt(a,{player:false,night:true});dark.nightGear={lights:()=>[{...a,z:0,inside:null,r:30,angle:0,half:Math.PI}]};
 const frame=dark.visibility.frame();assert.ok(frame.snapshot().lights>0);assert.equal(frame.snapshot().observers,0);assert.equal(frame.canSeeRegional(enemy(b)),false);
});
