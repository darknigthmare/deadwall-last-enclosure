'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const {fixture}=require('./helpers/husbandry199.cjs');
const bank={x:21002.346637659346,y:4420.794241197583},water={x:21002.58378213169,y:4418.61208916364};
let cachedWorld;
function setup(){
 // Declared placement at an actual generated river bank; no natural journey is claimed.
 cachedWorld||=W.create(17117,8,{detailVersion:13,ecologyVersion:1,hydrologyVersion:1,landscape189:'balanced'});
 const f=fixture(),engine=new C.Siege.Engine();Object.assign(f.world,cachedWorld);Object.assign(f.position,bank);
 f.g.siege={toolActive:()=>false,carriedWater199:()=>engine.state.playerWater,
  transferFieldWater199:(direction,amount)=>engine.fieldWater(direction,amount,{running:!f.g.paused&&!f.g.activeOverlay,accessible:true,secure:true,dead:false})};
 return{...f,engine,nativeWorld:cachedWorld};
}
const state=f=>JSON.stringify({bag:f.g.player.carry,bucket:f.engine.snapshot(),enclosures:f.read()});
function assertRefused(f){const before=state(f);assert.equal(f.g.husbandry191.begin('fill-bucket').ok,false);assert.equal(state(f),before);assert.equal(f.g.husbandry191.busy(),false);}
function finish(f){for(let i=0;i<100&&f.g.husbandry191.busy();i++)f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false);}
function wall(f){
 const obstacle={x:bank.x-2.3,y:bank.y-.85,w:4.6,h:.15},native=f.nativeWorld.wildlifeWaterLine;
 // A declared solid uses the same native segment/rectangle intersection as regional walls.
 f.world.wildlifeWaterLine=(a,b,r)=>native(a,b,r)&&!G.segmentRect(a,b,{x:obstacle.x-r,y:obstacle.y-r,w:obstacle.w+r*2,h:obstacle.h+r*2});
}
test('201 a real river within 2.2m fills the existing bucket even between the old radial directions',()=>{
 const f=setup(),h=f.world.hydrology,before=JSON.parse(state(f));
 assert.equal(h.sample(bank.x,bank.y).water,false);assert.equal(f.world.blocked(bank.x,bank.y,.32,0,null),false);
 assert.equal(h.sample(water.x,water.y).water,true);assert.equal(h.sample(water.x,water.y).salinity,'fresh');
 assert.ok(Math.hypot(bank.x-water.x,bank.y-water.y)<C.Husbandry191Rules.reach);assert.equal(f.world.wildlifeWaterLine(bank,water,.05),true);
 assert.equal(f.g.husbandry191.begin('fill-bucket').ok,true);
 f.g.paused=true;for(let i=0;i<100;i++)f.g.husbandry191.step(.1);assert.equal(f.engine.state.playerWater,0);f.g.paused=false;
 finish(f);assert.equal(f.engine.state.playerWater,C.Husbandry191Rules.waterPortion);assert.equal(f.engine.state.stats.waterProduced,C.Husbandry191Rules.waterPortion);
 assert.deepEqual(f.g.player.carry,before.bag);assert.deepEqual(JSON.parse(JSON.stringify(f.read())),before.enclosures);assert.equal(f.engine.state.stats.waterUsed,0);
});
test('201 a real enclosed freshwater basin within reach is also usable from dry ground',()=>{
 const f=setup(),h=f.world.hydrology;let found=null;
 for(const body of h.features.filter(a=>a.shape==='polygon'&&a.salinity==='fresh')){
  if(found)break;
  for(let i=0;i<body.points.length&&!found;i++){
   const a=body.points[i],b=body.points[(i+1)%body.points.length],length=Math.hypot(b.x-a.x,b.y-a.y);if(!length)continue;
   const nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length,middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
   for(const sign of[-1,1]){
    const p={x:middle.x+nx*sign*2.19,y:middle.y+ny*sign*2.19},q={x:middle.x-nx*sign*.005,y:middle.y-ny*sign*.005};
    if(!h.sample(p.x,p.y).water&&h.sample(q.x,q.y).bodyId===body.id&&h.sample(q.x,q.y).water&&!h.sample(q.x,q.y).crossing&&!f.world.blocked(p.x,p.y,.32,0,null)&&f.world.wildlifeWaterLine(p,q,.05)){found={p,q,kind:body.kind};break;}
   }
  }
 }
 assert.ok(found,'A real basin has a physically clear reachable bank in this seed');assert.ok(['lake','pond','pool'].includes(found.kind));
 Object.assign(f.position,found.p);assert.equal(f.g.husbandry191.begin('fill-bucket').ok,true);finish(f);assert.equal(f.engine.state.playerWater,C.Husbandry191Rules.waterPortion);
});
test('201 a source beyond the unchanged reach cannot fill the bucket',()=>{
 const f=setup(),d=Math.hypot(bank.x-water.x,bank.y-water.y);f.position.x+=(bank.x-water.x)/d*.04;f.position.y+=(bank.y-water.y)/d*.04;
 assert.ok(f.world.hydrology.sample(f.position.x,f.position.y).distanceToWater>C.Husbandry191Rules.reach);assertRefused(f);
});
test('201 nearby real sea water is refused without changing the shared water owner',()=>{
 const f=setup(),h=f.world.hydrology,c=h.coast;let shore=null;
 for(const v of[4000,6000,8000,10000,14000,18000,22000]){
  const p=c.toWorld(c.inlandAt(v)+1,v),q=c.toWorld(c.inlandAt(v)-.01,v);
  if(!f.world.blocked(p.x,p.y,.32,0,null)&&h.sample(p.x,p.y).salinity==='salt'&&h.sample(q.x,q.y).water&&f.world.wildlifeWaterLine(p,q,.05)&&!h.featuresIn({x:p.x-2.2,y:p.y-2.2,w:4.4,h:4.4}).some(a=>a.salinity==='fresh')){shore={p,q};break;}
 }
 assert.ok(shore,'A real accessible salt-water bank exists in this seeded world');Object.assign(f.position,shore.p);assertRefused(f);
});
test('201 a physical wall between the real bank and water still prevents collection',()=>{
 const f=setup();wall(f);assert.equal(f.world.wildlifeWaterLine(bank,water,.05),false);assertRefused(f);
});
test('201 water below a real bridge deck is not offered as an exposed bank source',()=>{
 const f=setup(),d=Math.hypot(bank.x-water.x,bank.y-water.y),ux=(water.x-bank.x)/d,uy=(water.y-bank.y)/d;
 f.world.hydrology=f.nativeWorld.hydrology.withRoads([{id:'declared-bank-bridge201',a:{x:bank.x-ux*5,y:bank.y-uy*5},b:{x:water.x+ux*15,y:water.y+uy*15},width:6}]);
 assert.ok(f.world.hydrology.sample(water.x,water.y).crossing);assertRefused(f);
});
test('201 adding a real solid during the timed fill cancels without granting water',()=>{
 const f=setup();assert.equal(f.g.husbandry191.begin('fill-bucket').ok,true);f.g.husbandry191.step(.1);wall(f);finish(f);
 assert.equal(f.engine.state.playerWater,0);assert.equal(f.engine.state.stats.waterProduced,0);
});
