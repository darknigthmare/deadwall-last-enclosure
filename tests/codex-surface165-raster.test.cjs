'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas');
const S=require('../src/codex-dressing160.js'),Art=require('../src/seed-detail-art157.js'),G=require('../src/frontier-geometry.js');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
test('165 raster: new contents paint above their furniture, inside all four rotated collision rectangles',()=>{
 const previous=globalThis.DeadwallCodexDressing160;let changed=0;
 try{for(const kind of ['desk','bed','shelf','workbench','medical'])for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
  const [sw,sh]=G.SHAPES[kind],rotated=Math.abs(Math.sin(angle))>.5;
  const o={id:'raster:'+kind,kind,room:'Bureau',x:1,y:1,w:rotated?sh:sw,h:rotated?sw:sh,spriteWidth160:sw,spriteHeight160:sh,angle160:angle,anchored160:true,solid:true,z:0},stamp=hash(o);
  const render=enabled=>{globalThis.DeadwallCodexDressing160=enabled?S:{surfaceItems165:()=>[]};const canvas=createCanvas(240,240),c=canvas.getContext('2d');c.scale(40,40);assert.equal(Art.draw(c,o,{art:null,seed:42}),true);return c.getImageData(0,0,240,240).data;};
  const base=render(false),next=render(true);let delta=0;
  for(let y=0;y<240;y++)for(let x=0;x<240;x++){const k=(y*240+x)*4;if(next[k]!==base[k]||next[k+1]!==base[k+1]||next[k+2]!==base[k+2]||next[k+3]!==base[k+3]){
   delta++;assert.ok(x>=Math.floor(o.x*40)&&x<=Math.ceil((o.x+o.w)*40)&&y>=Math.floor(o.y*40)&&y<=Math.ceil((o.y+o.h)*40),kind+' contents outside collider');
  }}assert.ok(delta>5,kind+' contents not painted');changed+=delta;assert.equal(hash(o),stamp);
 }}finally{globalThis.DeadwallCodexDressing160=previous;}
 console.log('RASTER165 '+JSON.stringify({orientations:4,kinds:5,changedPixels:changed}));
});
