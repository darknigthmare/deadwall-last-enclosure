'use strict';
// Prepared overlap probes, using the real regional queue and painters. These
// deliberately overlap ground footprints to expose paint order, not navigation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),Art=require('../src/art.js');
globalThis.DeadwallCore=require('../src/core.js');
globalThis.DeadwallFrontierGeometry=require('../src/frontier-geometry.js');
require('../src/frontier-art.js');
const A=globalThis.DeadwallFrontierArt,root=path.resolve(__dirname,'..'),out=path.join(root,'reports/1.30.0/captures');
globalThis.Image=class{set src(_){this.onerror?.();}};
const art=Art.create(),side=320,scale=70;
const raster=draw=>{const c=createCanvas(side,side),ctx=c.getContext('2d');ctx.translate(side/2,side/2);ctx.scale(scale,scale);draw(ctx);return c;};
const bytes=c=>c.getContext('2d').getImageData(0,0,side,side).data;
(async()=>{
 await art.ready;art.images.commanderRig=await loadImage(path.join(root,Art.ASSETS.commanderRig.url));
 const sheet=createCanvas(1000,820),ctx=sheet.getContext('2d');ctx.fillStyle='#18251e';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.fillStyle='#efe6c8';ctx.font='22px sans-serif';ctx.fillText('PROFONDEUR · COMPARAISON DES PIXELS RÉELS',22,34);ctx.font='13px sans-serif';ctx.fillText('Contacts forcés pour isoler l’occlusion · peintres et tri du moteur · Canvas natif, sans navigateur',22,60);
 const results=[];
 for(const [column,kind]of ['furniture','car','rock'].entries())for(const [row,front]of [false,true].entries()){
  const p={id:'qa-room',type:'house',x:0,y:0,w:10,h:8,a:0,outdoor:[],parking:[],generation:4},object={id:'qa-desk',kind:'desk',x:4,y:3,w:2,h:1,amount:30},rock={id:'qa-rock',kind:'rock',x:0,y:0,r:1,a:Math.PI/4,amount:30};
  const world={nearPOI:()=>[],around:()=>kind==='rock'?[{trees:[],rocks:[rock]}]:[],plan:()=>({objects:kind==='furniture'?[object]:[],walls:[],stairs:[],rooms:[]})};
  const depth=kind==='car'?.925:kind==='rock'?Math.SQRT2:0,v={x:0,y:depth+(front?.18:-.18),z:0,a:front?-Math.PI/2:Math.PI/2,inside:p.id,world,taken:{},seen:[],car:kind==='car'?{x:0,y:0,a:0}:null};
  const g={art,elapsed:0,player:{health:100},settings:{reducedMotion:true},expeditions:{car:()=>({health:320})},actorPresentation:{player:e=>({id:0,x:e.x*32,y:e.y*32,facing:e.a,visualArticulated:true,visualUpperFacing:e.a,visualLowerFacing:e.a,visualMoving:false,visualMotionReset:true})}};
  const entries=A.depthEntries(g,v,{l:-5,r:5,t:-5,b:5},kind==='furniture'?[p]:[]),actor=entries.find(e=>e.kind==='player'),prop=entries.find(e=>e.kind===kind);
  assert.ok(actor&&prop);const a=raster(c=>actor.draw(c)),b=raster(c=>prop.draw(c)),actual=raster(c=>entries.forEach(e=>e.draw(c))),ad=bytes(a),bd=bytes(b),rd=bytes(actual);
  const wanted=bytes(raster(c=>{(front?prop:actor).draw(c);(front?actor:prop).draw(c);})),other=bytes(raster(c=>{(front?actor:prop).draw(c);(front?prop:actor).draw(c);}));
  let overlap=0,distinct=0,correct=0;
  for(let i=0;i<rd.length;i+=4)if(ad[i+3]===255&&bd[i+3]===255){overlap++;if(Math.abs(wanted[i]-other[i])+Math.abs(wanted[i+1]-other[i+1])+Math.abs(wanted[i+2]-other[i+2])>25){distinct++;if(rd[i]===wanted[i]&&rd[i+1]===wanted[i+1]&&rd[i+2]===wanted[i+2]&&rd[i+3]===255)correct++;assert.notDeepEqual([...rd.slice(i,i+3)],[...other.slice(i,i+3)],'opaque crossing must not show the hidden layer');}}
  assert.ok(distinct>30,kind+' requires real overlapping sprite pixels');assert.equal(correct,distinct,kind+' has an incorrect visible layer');
  const x=14+column*330,y=88+row*357;ctx.fillStyle='#536b48';ctx.fillRect(x,y,side,side);ctx.drawImage(actual,x,y);ctx.fillStyle='#eee3c0';ctx.font='15px sans-serif';ctx.fillText(({furniture:'Meuble',car:'Véhicule',rock:'Rocher tourné'})[kind]+' · '+(front?'devant':'derrière'),x+10,y+23);ctx.font='12px sans-serif';ctx.fillText(correct+' pixels opaques vérifiés',x+10,y+side-13);
  results.push({kind,front,position:{x:v.x,y:v.y,aim:v.a},actorDepth:actor.depth,propDepth:prop.depth,overlap,distinct,correct});
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'plans-occlusion-pixels-130.png'),sheet.toBuffer('image/png'));fs.writeFileSync(path.join(out,'occlusion130.json'),JSON.stringify({renderer:'DeadwallFrontierArt.depthEntries plus actual drawActor/car/object/scenery painters',browser:false,preparedOverlaps:true,navigationValidated:false,cases:results},null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
