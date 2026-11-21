'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const fixtures=import('../scripts/browser-city-fixtures150.mjs');
const readers=import('../scripts/browser-city-placement150.mjs');
const saved=g=>{const {timestamp,...raw}=g.serialize();return JSON.parse(JSON.stringify(raw));};
// Playwright serializes these exported functions without their module scope.
const inPage=(fn,arg)=>new Function('arg','return ('+fn.toString()+')(arg);')(arg);
async function campaign(){
 const F=await fixtures,{g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);
 F.prepareAge150(10);F.prepareSupports150();return {g,F};
}
function sameExceptViewpoint(before,after){
 after.player.x=before.player.x;after.player.y=before.player.y;after.phase=before.phase;after.phaseTime=before.phaseTime;
 assert.deepEqual(after,before,'selection preserves every saved field except its four declared viewpoint fields');
}
test('188 prepared construction rejects a live infected footprint without moving the threat or changing saved state',async()=>{
 const {g,F}=await campaign(),type='continuityArsenal150',start=saved(g),first=F.prepareConstruction150(type);
 g.restoreSave(DeadwallSave.validate(start));g.togglePause(true);
 // Explicit negative setup: a native spawned runner occupies the first choice.
 g.spawnZombie('runner');const z=g.zombies.at(-1),def=DeadwallCore.BUILDINGS[type];
 z.x=(first.site.gx+def.size[0]/2)*32;z.y=(first.site.gy+def.size[1]/2)*32;
 const before=saved(g),selected=F.prepareConstruction150(type),after=saved(g);
 assert.notDeepEqual(selected.site,first.site,'the occupied first choice must be rejected');
 const b=new(g.core().constructor)(g.nextId,type,selected.site.gx,selected.site.gy,0,0);
 assert.ok(!g.zombies.some(a=>!a.dead&&a.health>0&&DeadwallFieldcraft.collides(b,a.x,a.y,a.radius||12)));
 assert.ok(selected.constructionSearch.some(s=>s.rejected.actors>0),'the occupied candidate is rejected rather than cleared');
 assert.ok(g.world.placement(def,selected.site.gx,selected.site.gy,0).valid);
 sameExceptViewpoint(before,after);
});

// Small observation fixture isolates body enumeration and synchronous payment
// instrumentation; it does not stand in for native placement or browser layout.
function observationFixture(){
 const old={DEADWALL:globalThis.DEADWALL,DeadwallCore:globalThis.DeadwallCore,document:globalThis.document};
 const bodies=['player','worker','infected','vehicle','truck'].map((kind,i)=>({id:i+1,kind,x:200,y:200,radius:10,health:100,dead:false}));
 const [player,worker,zombie,vehicle,truck]=bodies,site={gx:10,gy:10},type='fixture',cost={wood:3};
 const g={player,units:[worker],zombies:[zombie],expeditions:{entity:()=>vehicle},territories:{truckEntities:()=>[truck]},
  world:{placement:(_d,gx,gy)=>({valid:gx===site.gx&&gy===site.gy})},hud135:{measure:()=>({left:0,top:0,right:600,bottom:500})},
  camera:{x:336,y:336,zoom:1},width:600,height:500,resources:{wood:20},random:{state:17},selectedBuild:type,workerOrder:'retreat'};
 globalThis.DEADWALL=g;globalThis.DeadwallCore={BUILDINGS:{fixture:{size:[5,4],cost}}};
 globalThis.document={elementFromPoint:()=>({id:'game',tagName:'CANVAS',className:''})};
 return {g,bodies,site,type,cost,restore(){Object.assign(globalThis,old);delete globalThis.__CITY150_PAYMENT__;}};
}
test('188 placement readers reject all five live body kinds and their five-unit margins without mutation',async()=>{
 const R=await readers,f=observationFixture();
 try{
  for(const body of f.bodies)for(const pose of [{x:400,y:380},{x:492,y:380}]){
   Object.assign(body,pose);const before=JSON.stringify(f.g);
   const result=inPage(R.inspectPlannedPlacement150,{type:f.type,site:f.site});
   assert.equal(result.valid,false,body.kind+' cannot be called an empty site');
   assert.deepEqual(result.actors.map(a=>({id:a.id,kind:a.kind})),[{id:body.id,kind:body.kind}]);
   assert.equal(result.actors[0].bodyOverlap,pose.x===400);
   assert.throws(()=>inPage(R.findVisiblePlacement150,{type:f.type,plannedSite:f.site}),/No valid visible unoccupied placement/);
   assert.equal(JSON.stringify(f.g),before,'inspection and candidate search are read-only');
   Object.assign(body,{x:200,y:200});
  }
  assert.equal(inPage(R.inspectPlannedPlacement150,{type:f.type,site:f.site}).valid,true);
  assert.deepEqual(inPage(R.findVisiblePlacement150,{type:f.type,plannedSite:f.site}).gx,f.site.gx);
 }finally{f.restore();}
});
test('188 placement readers distinguish removed bodies from live actors and retain the missing-radius fallback',async()=>{
 const R=await readers,f=observationFixture();
 try{
  const z=f.g.zombies[0];Object.assign(z,{x:400,y:380,dead:true});
  assert.equal(inPage(R.inspectPlannedPlacement150,{type:f.type,site:f.site}).valid,true);
  z.dead=false;z.health=0;assert.equal(inPage(R.inspectPlannedPlacement150,{type:f.type,site:f.site}).valid,true);
  z.health=100;delete z.radius;
  const observed=inPage(R.inspectPlannedPlacement150,{type:f.type,site:f.site});
  assert.equal(observed.valid,false);assert.equal(observed.actors[0].radius,12);
 }finally{f.restore();}
});
test('188 payment observer samples newly entering non-workers at the actual call and preserves owner behavior',async()=>{
 const R=await readers,f=observationFixture();
 try{
  for(const kind of ['infected','vehicle','truck']){
   const body=f.bodies.find(a=>a.kind===kind),calls=[];
   const owner=function(...args){calls.push({receiver:this,args});this.resources.wood-=f.cost.wood;return true;};
   f.g.placeOne=owner;const before={...f.g.resources},rng=f.g.random.state;
   inPage(R.observeConstructionPayment150,{method:'placeOne',type:f.type});
   Object.assign(body,{x:400,y:380}); // Entry after instrumentation, before payment.
   assert.equal(f.g.placeOne(f.type,f.site.gx,f.site.gy),true);
   assert.equal(calls.length,1);assert.equal(calls[0].receiver,f.g);assert.deepEqual(calls[0].args,[f.type,f.site.gx,f.site.gy]);
   assert.equal(f.g.placeOne,owner,'the original owner is restored after the matching call');
   const payment=globalThis.__CITY150_PAYMENT__;
   assert.deepEqual(payment.placement.actors.map(a=>({id:a.id,kind:a.kind})),[{id:body.id,kind}]);
   assert.deepEqual(payment.before,before);assert.equal(payment.after.wood,before.wood-f.cost.wood);
   assert.equal(payment.rng,rng);assert.equal(payment.afterRNG,rng);assert.equal(body.x,400);assert.equal(body.health,100);
   Object.assign(body,{x:200,y:200});
  }
 }finally{f.restore();}
});
test('188 payment instrumentation leaves a genuine paid native foundation identical to an unobserved call',async()=>{
 const {g,F}=await campaign(),R=await readers,type='continuityArsenal150',prepared=F.prepareConstruction150(type),site=prepared.site,before=saved(g);
 const expected=g.placeOne(type,site.gx,site.gy),after=saved(g);assert.equal(expected,true);
 g.restoreSave(DeadwallSave.validate(before));g.togglePause(true);const owner=g.placeOne;
 inPage(R.observeConstructionPayment150,{method:'placeOne',type});
 assert.equal(g.placeOne(type,site.gx,site.gy),expected);assert.equal(g.placeOne,owner);
 assert.deepEqual(saved(g),after,'observation adds no stock, progress, actor, RNG or persistence change');
 const payment=globalThis.__CITY150_PAYMENT__;assert.equal(payment.result,true);assert.equal(payment.placement.actors.length,0);
 assert.deepEqual(payment.before,before.resources);assert.deepEqual(payment.after,after.resources);
 for(const [key,cost] of Object.entries(DeadwallCore.BUILDINGS[type].cost))assert.equal(payment.after[key],payment.before[key]-cost);
 delete globalThis.__CITY150_PAYMENT__;
});
