'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const fixtures=import('../scripts/browser-city-fixtures150.mjs');
const saved=g=>{const {timestamp,...s}=g.serialize();return JSON.parse(JSON.stringify(s));};
async function campaign(){const F=await fixtures,{g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);F.prepareAge150(10);F.prepareSupports150();return{g,F};}

function alternateWitness(g){
 const C=DeadwallCore,def=C.BUILDINGS.casemate150,core=g.core(),original=g.fieldcraft.service(g.player,core),Building=core.constructor;
 const span=core.right-core.left,anchors=[{x:core.x,y:core.top-span},{x:core.x,y:core.bottom+span},{x:core.left-span,y:core.y},{x:core.right+span,y:core.y}];
 for(const anchor of anchors){
  const point=g.fieldcraft.service({...g.player,...anchor},core);
  if(!point||Math.hypot(point.x-original.x,point.y-original.y)<1||!g.workerCanWorkAt({...g.player,...point},core,100))continue;
  for(let gy=core.gy-10;gy<=core.gy+10;gy++)for(let gx=core.gx-10;gx<=core.gx+10;gx++){
   if(!g.world.placement(def,gx,gy,0).valid)continue;
   const b=new Building(g.nextId,def.id,gx,gy,0,0);
   if(Math.hypot(b.x-original.x,b.y-original.y)<=def.range-80)continue;
   if(Math.hypot(b.x-point.x,b.y-point.y)>def.range-80||!g.hostileLineClear(b,point))continue;
   if(point.x+g.player.radius>b.left&&point.x-g.player.radius<b.right&&point.y+g.player.radius>b.top&&point.y-g.player.radius<b.bottom)continue;
   const occupants=[g.player,...g.units].some(a=>{const margin=a===g.player?0:37;return a.x+a.radius+margin>b.left&&a.x-a.radius-margin<b.right&&a.y+a.radius+margin>b.top&&a.y-a.radius-margin<b.bottom;});
   if(occupants)continue;
   const service=g.fieldcraft.service(g.player,b);if(!service||!g.friendlyPositionClear(g.player,service.x,service.y))continue;
   return{original,point,gx,gy};
  }
 }
 throw Error('No independently legal alternate-face casemate witness');
}

test('192 construction finds a real alternate core work face when only its firing parcel remains available',async()=>{
 const {g,F}=await campaign(),witness=alternateWitness(g),world=g.world,placement=world.placement,before=saved(g);
 // Other parcels are unavailable; this wrapper never grants a native-invalid
 // parcel. The witness is independently legal but cannot defend the first face.
 world.placement=function(def,gx,gy,...rest){const actual=placement.call(this,def,gx,gy,...rest);return gx===witness.gx&&gy===witness.gy?actual:{valid:false,reason:'Other diagnostic parcels unavailable'};};
 let result;try{result=F.prepareConstruction150({type:'casemate150',protectCore:true});}finally{world.placement=placement;}
 assert.deepEqual(result.site,{gx:witness.gx,gy:witness.gy,type:'casemate150'});assert.deepEqual(result.initialProtectedPoint,witness.original);
 assert.notDeepEqual(result.protectedPoint,witness.original);assert.ok(result.constructionSearch.length>1);assert.equal(result.constructionSearch[0].selected,undefined);
 assert.ok(result.constructionSearch[0].rejected.range>0);assert.ok(result.constructionSearch[0].rejected.placement>0);
 const b=new (g.core().constructor)(g.nextId,'casemate150',result.site.gx,result.site.gy,0,0);
 assert.ok(Math.hypot(b.x-result.protectedPoint.x,b.y-result.protectedPoint.y)<=b.def.range-80);assert.ok(g.hostileLineClear(b,result.protectedPoint));
 assert.ok(g.friendlyPositionClear(g.player,result.protectedPoint.x,result.protectedPoint.y));assert.ok(g.workerCanWorkAt({...g.player,...result.protectedPoint},g.core(),100));
 const after=saved(g);after.player.x=before.player.x;after.player.y=before.player.y;after.phase=before.phase;after.phaseTime=before.phaseTime;
 assert.deepEqual(after,before,'only the existing declared viewpoint/clock preparation changes; units, resources, buildings and RNG stay intact');
});

test('192 a wholly unavailable defence reports each attempted face and changes no saved owner',async()=>{
 const {g,F}=await campaign(),world=g.world,placement=world.placement,before=saved(g);world.placement=()=>({valid:false,reason:'Every parcel unavailable'});
 let error;try{F.prepareConstruction150({type:'casemate150',protectCore:true});}catch(e){error=e;}finally{world.placement=placement;}
 assert.match(error?.message||'',/No legal empty physical site for casemate150/);const attempts=error.deadwallConstruction150.attempts;
 assert.ok(attempts.length>1);assert.ok(attempts.every(a=>a.protectedPoint&&a.rejected.placement>0&&!a.selected));
 assert.ok(attempts.every(a=>a.examples.some(e=>e.reason==='placement'&&e.detail==='Every parcel unavailable')));
 assert.deepEqual(saved(g),before);
});
