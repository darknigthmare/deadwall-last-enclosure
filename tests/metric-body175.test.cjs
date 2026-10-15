'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/metric-contract174.js'),G=require('../src/frontier-geometry.js'),C=require('../src/core.js');
const body=(a=0)=>({x:1000,y:1000,w:332.8,h:81.6,a});
test('175 every vehicle keeps its physical rectangle at eight orientations and two domains',()=>{
 let cases=0;for(const p of Object.values(C.WorldEvolution.RULES.vehicles))for(const domain of ['local','region'])for(let i=0;i<8;i++){
  const size=M.vehicle(p,{domain,metric:true}),b={x:1000,y:1000,w:size.w,h:size.h,a:i*Math.PI/4},bounds=M.bodyBounds(b),corners=M.bodyCorners(b);cases++;
  assert.equal(corners.length,4);assert.ok(bounds.w>=Math.min(b.w,b.h)-1e-8);assert.ok(corners.every(p=>p.x>=bounds.x-1e-8&&p.x<=bounds.x+bounds.w+1e-8));
  assert.equal(M.bodyDistance(b,{x:b.x,y:b.y}),0);assert.equal(M.bodyOverlap(b,b),true);
 }assert.equal(cases,144);
});
test('175 rectangle narrow phase agrees with independent native SAT for 2000 seeded body pairs',()=>{
 const random=G.rng(175);for(let i=0;i<2000;i++){const a={x:random()*30,y:random()*30,w:1+random()*12,h:1+random()*3,a:random()*Math.PI*2},b={x:random()*30,y:random()*30,w:1+random()*12,h:1+random()*3,a:random()*Math.PI*2};assert.equal(M.bodyOverlap(a,b),G.obb(a,b));assert.equal(M.bodyOverlap(a,b),M.bodyOverlap(b,a));}
});
test('175 ground footprint does not inherit the empty corners of its circumscribed circle',()=>{
 const b=body(),p={x:1000,y:1090};assert.ok(Math.hypot(p.x-b.x,p.y-b.y)<Math.hypot(b.w,b.h)/2);assert.equal(M.bodyCircle(b,p,12),false);assert.equal(M.bodyCircle(body(Math.PI/2),p,12),true);
 assert.equal(M.bodyOverlap(b,{x:1000,y:1100,w:600,h:20,a:0}),false);assert.equal(M.bodyOverlap(body(Math.PI/2),{x:1000,y:1100,w:600,h:20,a:0}),true);
});
test('175 rotation sweep rejects a thin intermediate obstruction even with clear endpoints',()=>{
 const a=body(0),b=body(Math.PI/2),wall={x:1105,y:1105,w:.05,h:.05,a:0};assert.equal(M.bodyOverlap(a,wall),false);assert.equal(M.bodyOverlap(b,wall),false);
 let steps=0;assert.equal(M.sweepBody(a,b,(o,pad)=>{steps++;return !M.bodyOverlap({...o,w:o.w+2*pad,h:o.h+2*pad},wall);}),false);assert.ok(steps>1);
});
test('175 translation sweep cannot tunnel through a subpixel barrier; refused turn is read only',()=>{
 const a={x:0,y:0,w:.2,h:.2,a:0},b={...a,x:8},wall={x:3.07,y:0,w:.01,h:5,a:0},before=JSON.stringify([a,b]);assert.equal(M.sweepBody(a,b,(o,pad)=>!M.bodyOverlap({...o,w:o.w+2*pad,h:o.h+2*pad},wall)),false);assert.equal(JSON.stringify([a,b]),before);
 assert.equal(M.sweepBody(a,{...b,x:1e8},()=>true),false);assert.equal(M.sweepBody(a,{...b,w:3},()=>true),false);
});
test('175 malformed geometry fails closed instead of admitting an unmeasured sprite',()=>{
 for(const value of [NaN,Infinity,'4',null]){assert.equal(M.bodyValid({...body(),w:value}),false);assert.equal(M.bodyOverlap({...body(),a:value},body()),true);}
 assert.equal(M.bodyCircle(body(),{x:NaN,y:0},4),true);assert.throws(()=>M.bodyCorners({...body(),h:0}));assert.equal(M.sweepBody(body(),body(),null),false);
});
