'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/core.js');const P=require('../src/atlas-projection.js'),Road=require('../src/region-roadkit.js'),Atlas=require('../src/atlas-render.js');
let native;try{native=require('@napi-rs/canvas');}catch{}
function fixture(dpr=1){
 globalThis.document={createElement:()=>native.createCanvas(1,1)};
 const world={seed:17117,generation:6,roads:[{a:{x:30,y:30},b:{x:210,y:170},width:7},{a:{x:210,y:170},b:{x:360,y:90},width:7}],pois:[{id:'P0',drive:{a:{x:210,y:170},b:{x:210,y:220},width:4}}]},v={world,seen:[]},cam=P.camera(481,321);cam.fit(220,150,420);
 const canvas=native.createCanvas(Math.ceil(cam.width*dpr),Math.ceil(cam.height*dpr)),c=canvas.getContext('2d');
 const position=()=>{c.setTransform(dpr*cam.scale,0,0,dpr*cam.scale,dpr*(cam.width/2-cam.x*cam.scale),dpr*(cam.height/2-cam.y*cam.scale));};
 const draw=(layers={places:true,city:false},cached=true)=>{c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);position();const transform=c.getTransform;if(!cached)c.getTransform=()=>null;Atlas.mapRoads(c,{},v,cam,layers,new Set(v.seen));c.getTransform=transform;return c.getImageData(0,0,canvas.width,canvas.height).data;};
 return{canvas,c,cam,v,draw};
}
test('atlas 1.36 : cached roads match the actual road painter at normal and fractional DPR',{skip:!native},()=>{for(const dpr of[1,1.25,2]){const f=fixture(dpr),direct=f.draw(undefined,false),cached=f.draw();assert.deepEqual(cached,direct);assert.deepEqual(f.draw(),direct);}});
test('atlas 1.36 : a fixed viewport reuses the raster without freezing discoveries or layers',{skip:!native},()=>{const f=fixture(),original=Road.drawNetwork;let calls=0;globalThis.DeadwallRoadKit={...Road,drawNetwork(...args){calls++;return original(...args);}};try{const undiscovered=f.draw();f.draw();assert.equal(calls,1);f.v.seen.push('P0');const discovered=f.draw();assert.equal(calls,2);assert.notDeepEqual(discovered,undiscovered);assert.deepEqual(f.draw(),discovered);assert.equal(calls,2);assert.notDeepEqual(f.draw({places:false,city:false}),discovered);assert.equal(calls,3);}finally{globalThis.DeadwallRoadKit=Road;}});
test('atlas 1.36 : pan, zoom, resize and world replacement invalidate the single viewport',{skip:!native},()=>{const f=fixture(),original=Road.drawNetwork;let calls=0;globalThis.DeadwallRoadKit={...Road,drawNetwork(...args){calls++;return original(...args);}};try{f.draw();f.cam.pan(30,10);f.draw();assert.equal(calls,2);f.cam.zoomAt(1.4);f.draw();assert.equal(calls,3);f.cam.resize(400,300);f.draw();assert.equal(calls,4);f.v.world={...f.v.world,seed:84329};f.draw();assert.equal(calls,5);f.draw();assert.equal(calls,5);}finally{globalThis.DeadwallRoadKit=Road;}});
test('atlas 1.36 : rebuilding the raster preserves world geometry and discovery state',{skip:!native},()=>{const f=fixture(),before=JSON.stringify(f.v);for(let i=0;i<30;i++){f.cam.pan(1,2);f.draw();}assert.equal(JSON.stringify(f.v),before);});
