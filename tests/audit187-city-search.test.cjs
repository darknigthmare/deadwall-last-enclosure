'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const fixtures=import('../scripts/browser-city-fixtures150.mjs');
async function campaign(){
 const F=await fixtures,{g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);
 F.prepareAge150(10);F.prepareSupports150();return{g,F};
}
function witness(g,insideSix){
 const def=DeadwallCore.BUILDINGS.casemate150,core=g.core(),point=g.fieldcraft.service(g.player,core),Building=core.constructor;
 for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++){
  const ring=Math.max(Math.abs(dx),Math.abs(dy));
  if(!ring||(insideSix?ring>=6:ring<6||dx%2===0&&dy%2===0))continue;
  const gx=core.gx+dx,gy=core.gy+dy;
  if(!g.world.placement(def,gx,gy,0).valid)continue;
  const b=new Building(g.nextId,def.id,gx,gy,0,0);
  if([g.player,...g.units].some(a=>{const m=a===g.player?0:37;return a.x+a.radius+m>b.left&&a.x-a.radius-m<b.right&&a.y+a.radius+m>b.top&&a.y-a.radius-m<b.bottom;}))continue;
  if(Math.hypot(b.x-point.x,b.y-point.y)>def.range-80||!g.hostileLineClear(b,point))continue;
  if(point.x+g.player.radius>b.left&&point.x-g.player.radius<b.right&&point.y+g.player.radius>b.top&&point.y-g.player.radius<b.bottom)continue;
  const service=g.fieldcraft.service(g.player,b);
  if(!service||!g.friendlyPositionClear(g.player,service.x,service.y))continue;
  return{gx,gy,point};
 }
 throw Error('No independently verified real casemate witness');
}
for(const inner of [true,false])test('187 construction searches '+(inner?'legal cells inside the old six-cell exclusion':'odd-grid legal cells skipped by the old two-cell stride'),async()=>{
 const {g,F}=await campaign(),site=witness(g,inner),world=g.world,placement=world.placement,before=JSON.parse(JSON.stringify(g.serialize()));
 // Model additional unavailable parcels, never grant legality. The sole admitted
 // witness is independently valid in the untouched native world. Actors stay put.
 world.placement=function(def,x,y,r){const actual=placement.call(this,def,x,y,r);return x===site.gx&&y===site.gy?actual:{...actual,valid:false};};
 let result;try{result=F.prepareConstruction150({type:'casemate150',protectCore:true});}finally{world.placement=placement;}
 assert.deepEqual(result.site,{gx:site.gx,gy:site.gy,type:'casemate150'});assert.deepEqual(result.protectedPoint,site.point);
 const after=JSON.parse(JSON.stringify(g.serialize()));for(const key of ['timestamp','phase','phaseTime'])after[key]=before[key];after.player.x=before.player.x;after.player.y=before.player.y;
 assert.deepEqual(after,before,'no field outside declared viewpoint/clock changes');
});
test('187 an unavailable protected construction scene still fails without any partial saved changes',async()=>{
 const {g,F}=await campaign(),world=g.world,placement=world.placement,before=JSON.parse(JSON.stringify(g.serialize()));
 world.placement=()=>({valid:false,reason:'Unavailable test parcel'});
 try{assert.throws(()=>F.prepareConstruction150({type:'casemate150',protectCore:true}),/No legal empty physical site/);}finally{world.placement=placement;}
 const after=JSON.parse(JSON.stringify(g.serialize()));after.timestamp=before.timestamp;assert.deepEqual(after,before);
});
