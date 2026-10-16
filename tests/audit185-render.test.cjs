'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createFPS}=require('../src/vertical-citadel175-render.js');
function scene(){
 const calls=[],listeners=new Map();let sequence=0;
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,DYNAMIC_DRAW:6,FLOAT:7,TRIANGLES:8,COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,DEPTH_TEST:9,CULL_FACE:10,
  createShader:()=>({}),createProgram:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,createBuffer:()=>({id:++sequence}),getAttribLocation:()=>0,getUniformLocation:()=>({}),isContextLost:()=>false};
 for(const name of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','deleteProgram','deleteBuffer','bindBuffer','bufferData','bufferSubData','enableVertexAttribArray','vertexAttribPointer','drawArrays','viewport','clearColor','clear','enable','disable','useProgram','uniform3f','uniform2f','uniform1f'])gl[name]=(...args)=>calls.push([name,...args]);
 const canvas={width:0,height:0,getContext:()=>gl,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:(e,f)=>listeners.set(e,f),removeEventListener:e=>listeners.delete(e)};
 const box={x:3,y:4,z:0,w:2,h:2,d:5,type:'structure',owner:1};
 const g={elapsed:0,settings:{reducedMotion:false},world:{buildings:new Map(),nodes:[]},units:[],zombies:[],daylight:()=>1,
 vertical175:{presentation:()=>({sites:[],giants:[],controlled:2}),moduleRef:()=>({m:{id:2,yaw:0,pitch:0},def:{range:100}}),muzzle:()=>({x:0,y:0,z:3}),geometry:()=>[box],pressure:()=>[],sightQuery:()=>()=>true,network:{presentation:()=>({crates:[]})},population:{pose:()=>({z:0})}}};
 return {g,box,canvas,gl,calls,listeners};
}

test('185 FPS eye and authoritative sight query use exactly the firing origin',()=>{
 const {g,canvas,calls}=scene();const origin=Object.freeze({x:12.25,y:-3.75,z:19.625});let observed;
 g.vertical175.muzzle=()=>origin;g.vertical175.sightQuery=p=>{observed=p;return()=>true;};
 const fps=createFPS(canvas);assert.ok(fps);try{assert.equal(fps.draw(g),true);
  assert.deepEqual(calls.find(c=>c[0]==='uniform3f').slice(2),[origin.x,origin.y,origin.z]);assert.equal(observed,origin);
 }finally{fps.dispose();}
});
for(const nth of [1,2])test('185 partial GPU allocation failure '+nth+' refuses FPS and releases completed allocations',()=>{
 const {canvas,gl,calls,listeners}=scene();let count=0;const original=gl.createBuffer;
 gl.createBuffer=()=>++count===nth?null:original();
 const renderer=createFPS(canvas);assert.equal(renderer,null);assert.equal(listeners.size,0);
 assert.equal(calls.filter(c=>c[0]==='deleteBuffer').length,nth-1);assert.equal(calls.filter(c=>c[0]==='deleteProgram').length,1);
 assert.equal(calls.filter(c=>c[0]==='deleteShader').length,2);
});
for(const fail of ['vertex','fragment','link','attribute','uniform'])test('185 GPU initialization cleans up on '+fail+' failure',()=>{
 const {canvas,gl,calls,listeners}=scene();let count=0;
 if(fail==='vertex'||fail==='fragment')gl.getShaderParameter=()=>++count!==(fail==='vertex'?1:2);
 if(fail==='link')gl.getProgramParameter=()=>false;
 if(fail==='attribute')gl.getAttribLocation=()=>-1;
 if(fail==='uniform')gl.getUniformLocation=()=>null;
 gl.getShaderInfoLog=gl.getProgramInfoLog=()=>'test failure';
 assert.equal(createFPS(canvas),null);assert.equal(listeners.size,0);
 assert.equal(calls.filter(c=>c[0]==='deleteProgram').length,1);
 const released=calls.filter(c=>c[0]==='deleteShader').map(c=>c[1]);assert.equal(new Set(released).size,released.length);
});
test('185 disposal is idempotent and a disposed renderer never touches the GPU again',()=>{
 const {g,canvas,calls,listeners}=scene(),fps=createFPS(canvas);fps.draw(g);fps.dispose();const n=calls.length;
 fps.dispose();assert.equal(calls.length,n);assert.equal(fps.draw(g),false);assert.equal(calls.length,n);assert.equal(listeners.size,0);
});
test('185 synchronous context loss is detected even before its event',()=>{
 const {g,canvas,gl,calls}=scene(),fps=createFPS(canvas);fps.draw(g);gl.isContextLost=()=>true;const n=calls.length;
 assert.equal(fps.draw(g),false);assert.equal(calls.length,n);assert.equal(fps.lost,true);fps.dispose();
});
test('185 denied WebGL context is a clean refusal',()=>{
 const {canvas}=scene();canvas.getContext=()=>{throw Error('denied');};assert.equal(createFPS(canvas),null);
});
