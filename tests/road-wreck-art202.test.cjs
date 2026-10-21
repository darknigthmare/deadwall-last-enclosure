'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas'),Art=require('../src/art.js'),E=require('../src/exploration-125.js');
// Exercise the shipped painter itself; its closure depends only on the global
// Art owner. This fixture does not replace placement, loot or collision logic.
const source=fs.readFileSync(path.join(__dirname,'../src/exploration-125.js'),'utf8'),start=source.indexOf('  function drawWreck('),end=source.indexOf('\n  function drawRoadProp(',start),painter=source.slice(start,end).trim();assert.ok(start>=0&&end>start);
const shipped=scope=>vm.runInNewContext('('+painter+')',{globalThis:scope,Math});
const digest=c=>crypto.createHash('sha256').update(c.getImageData(0,0,c.canvas.width,c.canvas.height).data).digest('hex');
let native;
async function art(){
 if(native)return native;const im=await loadImage(path.join(__dirname,'..',Art.ASSETS.props.url)),canvas=createCanvas(im.width,im.height),c=canvas.getContext('2d');c.drawImage(im,0,0);const pixels=c.getImageData(0,0,im.width,im.height);Art.decodeMatte(pixels.data,im.width,im.height,'magenta');c.putImageData(pixels,0,0);
 const draws=[],calls=[],api={images:{props:canvas},blit(c,key,r,...d){draws.push({key,r,d,m:c.getTransform().toJSON()});c.drawImage(this.images[key],...r,...d);return true;},drawMetricScenery202(c,n,seed){calls.push({node:n,seed});return Art.drawMetricScenery202(c,this,n,{seed});}};
 return native={api,draws,calls};
}

test('202 road wrecks: all twelve real R4 plans use painted skins at their unchanged rotated physical body',async()=>{
 const a=await art(),plan=E.createFeaturePlan(17117,4096,4),draw=shipped({DEADWALL:{art:a.api,world:{seed:17117}},DeadwallArt:Art});assert.equal(plan.wrecks.length,12);const beforePlan=JSON.stringify(plan),originalRandom=Math.random;Math.random=()=>assert.fail('No random draws while painting a seeded wreck.');
 try{for(const wreck of plan.wrecks){
  const c=createCanvas(1000,1000).getContext('2d');c.translate(500-wreck.x,500-wreck.y);c.globalAlpha=.83;c.filter='contrast(1.1)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter;a.draws.length=0;a.calls.length=0;
  draw(c,wreck);assert.equal(a.calls.length,1);const view=a.calls[0].node;assert.equal(view.x,0);assert.equal(view.y,0);assert.deepEqual(view.body202,wreck.body202);assert.equal(view.id,wreck.id);assert.equal(view.variant,wreck.kind==='van'?2:1);assert.equal(a.calls[0].seed,17117);assert.equal(a.draws[0].key,'props');
  const q=a.draws[0],[x,y,w,h]=q.d,m=q.m,points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>({x:m.a*px+m.c*py+m.e,y:m.b*px+m.d*py+m.f})),solid=E.orientedSolid134(500,500,wreck.body202.w,wreck.body202.h,wreck.angle||0);
  for(const[actual,expected]of[[Math.min(...points.map(p=>p.x)),solid.x],[Math.max(...points.map(p=>p.x)),solid.x+solid.w],[Math.min(...points.map(p=>p.y)),solid.y],[Math.max(...points.map(p=>p.y)),solid.y+solid.h]])assert.ok(Math.abs(actual-expected)<.001,'One world rotation is shared; native Canvas matrix rounding stays below one thousandth of a unit.');
  const p=c.getImageData(Math.floor(solid.x),Math.floor(solid.y),Math.ceil(solid.w),Math.ceil(solid.h)).data,colours=new Set();for(let i=0;i<p.length;i+=4)if(p[i+3]>128)colours.add(p[i]*65536+p[i+1]*256+p[i+2]);assert.ok(colours.size>400,'Painted rust, glass and seams replace flat rectangles.');
  assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);
 }}finally{Math.random=originalRandom;}assert.equal(JSON.stringify(plan),beforePlan,'Painting changes no finite loot, seed, ID, position or physical solid.');
});

test('202 road wrecks: finite looted marks remain visible over the native plan and the global Art API works',async()=>{
 const a=await art(),provider={images:a.api.images,blit:a.api.blit},draw=shipped({DEADWALL:{art:provider,world:{seed:42}},DeadwallArt:Art}),wreck={id:'road-wreck-proof',x:200,y:200,size:147.2,body202:{w:147.2,h:59.2},kind:'car',angle:.42,looted:false},before=JSON.stringify(wreck),hashes=[];
 for(const looted of[false,true]){const c=createCanvas(400,400).getContext('2d');a.draws.length=0;draw(c,wreck,looted);assert.equal(a.draws.length,1,'The real global Art API paints the skin once.');hashes.push(digest(c));}
 assert.notEqual(hashes[0],hashes[1]);assert.equal(JSON.stringify(wreck),before,'An open visual hatch never grants cargo or changes the looted flag.');
});

test('202 road wrecks: R1–R3 without body202 retain the exact pre-change pixels and never read Art',()=>{
 const scope={};Object.defineProperty(scope,'DEADWALL',{get(){assert.fail('Legacy wrecks retain their historical painter.');}});const draw=shipped(scope),expected={
  'car:false':'160f8fc0c61fa8cd55a21e8e02b4cc19e2093e0482fa427db6318d421e1505fd',
  'car:true':'2ba68e89c5a99b08c4b77c322d5315c3899a6b9554b4311607d6a3b7ed4c132a',
  'van:false':'84eeef9e2a194f5552e61084118a78e44dba4b846df3223f0744058a3fcbdbb5',
  'van:true':'6656faa2af4d337b46b4a861e254f1b614485428421b40cc704e8b4d38c1cae5'
 };
 for(const kind of['car','van'])for(const looted of[false,true]){const c=createCanvas(400,400).getContext('2d'),wreck={id:'old',kind,x:200,y:200,size:kind==='car'?58:72,angle:.31,looted},before=JSON.stringify(wreck);draw(c,wreck);assert.equal(digest(c),expected[kind+':'+looted]);assert.equal(JSON.stringify(wreck),before);}
});
