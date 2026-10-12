'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
// The default backend is the pinned project dependency; an explicit alternative
// supports portable raster verification without changing the package/lockfile.
const moduleName=process.env.DEADWALL_CANVAS_MODULE||'@napi-rs/canvas',backend=require(moduleName);
const createCanvas=(w,h)=>backend.createCanvas?backend.createCanvas(w,h):new backend.Canvas(w,h);
const I=require('../src/codex-infill169.js'),A=require('../src/seed-detail-art157.js'),Painter=require('../src/codex-infill169-art.js');
console.log('INFILL169_RASTER_BACKEND '+moduleName);
test('169 five original silhouettes draw entirely inside the rotated collision rectangle and retain state',()=>{
 for(const kind of Painter.KINDS)for(const turn of [0,1,2,3]){
  const [w,h]=I.SHAPES[kind],pose=I.freePose(4,4,w,h,turn,.9,kind==='stretcher'),o={...pose,kind,id:'raster-'+kind,infill169:true,z:0,solid:true,surface:false},before=JSON.stringify(o);
  const canvas=createCanvas(700,700),c=canvas.getContext('2d');c.scale(70,70);assert.equal(A.draw(c,o,{art:null}),true);assert.equal(JSON.stringify(o),before);
  const image=c.getImageData(0,0,700,700).data;let count=0;
  for(let y=0;y<700;y++)for(let x=0;x<700;x++)if(image[(y*700+x)*4+3]){count++;assert.ok(x>=Math.floor(o.x*70)-1&&x<=Math.ceil((o.x+o.w)*70)+1);assert.ok(y>=Math.floor(o.y*70)-1&&y<=Math.ceil((o.y+o.h)*70)+1);}
  assert.ok(count>80,kind+' invisible');
 }
});
test('169 malformed or unsupported props do not paint or leak drawing state',()=>{
 const c=createCanvas(20,20).getContext('2d');for(const o of [{kind:'unknown',x:0,y:0,w:1,h:1},{kind:'bin',x:0,y:0,w:-1,h:1},{kind:'locker',x:NaN,y:0,w:1,h:1}])assert.equal(Painter.draw(c,o),false);
 assert.equal(A.draw(c,{infill169:true,kind:'bin',x:0,y:0,w:1,h:1,angle169:NaN,spriteWidth169:1,spriteHeight169:1}),false);
 assert.equal(c.getImageData(0,0,20,20).data.some(v=>v!==0),false);
});
