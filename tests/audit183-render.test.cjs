'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {VertexBuffer,cube,humanoid,createMotionSampler,createStaticMesh,createFPS}=require('../src/vertical-citadel175-render.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
test('183 mesh buffer grows without losing vertices and reuses its allocation',()=>{
 const out=new VertexBuffer();for(let i=0;i<10000;i++)out.push(i,i+1);assert.equal(out.length,20000);assert.equal(out.data[19999],10000);
 const allocation=out.data;out.reset();cube(out,{x:1,y:2,z:3,w:2,h:3,d:4},[1,.5,0]);assert.equal(out.length,216);assert.equal(out.data,allocation);
 for(let i=0;i<out.length;i++)assert.ok(Number.isFinite(out.data[i]));
});
test('183 humanoid yaw rotates the complete silhouette about its actual position',()=>{
 const a=[],b=[];humanoid(a,10,20,1.8,.3,0,.8,false,6);humanoid(b,10,20,1.8,.3,Math.PI/2,.8,false,6);
 assert.equal(a.length,1296);assert.notDeepEqual(a,b);
 for(let i=0;i<a.length;i+=6){near(b[i],10-(a[i+1]-20));near(b[i+1],20+(a[i]-10));near(b[i+2],a[i+2]);assert.deepEqual(b.slice(i+3,i+6),a.slice(i+3,i+6));}
});
test('183 gait follows travelled distance, not an idle clock; repeated frames are stable',()=>{
 const sample=createMotionSampler(),actor={x:0,y:0};assert.equal(sample(actor,0),0);assert.equal(sample(actor,.1),0);
 actor.x=3.2;const stride=sample(actor,.2);assert.ok(stride>0);assert.equal(sample(actor,.2),stride);assert.equal(sample(actor,.3),0);
 const snapshot=JSON.stringify(actor);sample(actor,.4);assert.equal(JSON.stringify(actor),snapshot);
});
test('183 gait history does not cross teleport, restore, reduced motion or hidden intervals',()=>{
 const sample=createMotionSampler(),a={x:0,y:0};sample(a,1);a.x=3.2;assert.notEqual(sample(a,1.1),0);
 a.x=1000;assert.equal(sample(a,1.2),0);a.x+=2;assert.equal(sample(a,.5),0);a.x+=2;assert.equal(sample(a,10),0);
 a.x+=2;assert.equal(sample(a,10.1,0,true),0);assert.equal(sample({...a},10.2),0);
 const frozen=Object.freeze({x:0,y:0});assert.equal(sample(frozen,20),0);assert.equal(sample(frozen,20.1),0);
});
test('183 static mesh invalidation tracks geometry, tint, removal and empty scenes',()=>{
 const cache=createStaticMesh(),box={x:0,y:1,z:0,w:3,h:4,d:2},tint=[1,.5,.2];
 assert.equal(cache.update([{box,tint}]),true);const buffer=cache.mesh.data;
 assert.equal(cache.update([{box:{...box},tint:[...tint]}]),false);assert.equal(cache.mesh.data,buffer);
 for(const key of ['x','y','z','w','h','d']){box[key]+=.5;assert.equal(cache.update([{box,tint}]),true);}
 tint[0]=.4;assert.equal(cache.update([{box,tint}]),true);assert.equal(cache.update([]),true);assert.equal(cache.mesh.length,0);assert.equal(cache.update([]),false);
});
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
test('183 WebGL reuses static uploads, detects changed solids and depleted vegetation',()=>{
 const {g,box,canvas,calls}=scene(),fps=createFPS(canvas);assert.equal(fps.draw(g),true);assert.equal(fps.diagnostics().staticUploads,1);
 const allocations=calls.filter(c=>c[0]==='bufferData').length;for(let i=0;i<20;i++)fps.draw(g);
 assert.equal(fps.diagnostics().staticUploads,1);assert.equal(calls.filter(c=>c[0]==='bufferData').length,allocations);
 box.d=1;fps.draw(g);assert.equal(fps.diagnostics().staticUploads,2);
 const tree={type:'wood',x:10,y:10,amount:1,depleted:false};g.world.nodes.push(tree);fps.draw(g);assert.equal(fps.diagnostics().staticUploads,3);
 tree.depleted=true;fps.draw(g);assert.equal(fps.diagnostics().staticUploads,4);
 const before=JSON.stringify({box,nodes:g.world.nodes});fps.draw(g);assert.equal(JSON.stringify({box,nodes:g.world.nodes}),before);
 fps.dispose();assert.equal(calls.filter(c=>c[0]==='deleteBuffer').length,2);
});
test('183 lost WebGL context stops drawing without mutating the simulation',()=>{
 const {g,canvas,listeners}=scene(),fps=createFPS(canvas);fps.draw(g);let prevented=false;
 listeners.get('webglcontextlost')({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(fps.lost,true);assert.equal(fps.draw(g),false);fps.dispose();assert.equal(listeners.size,0);
});
