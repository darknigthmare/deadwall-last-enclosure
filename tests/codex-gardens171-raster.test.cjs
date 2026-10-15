'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const backend=process.env.DEADWALL_CANVAS_BACKEND||'@napi-rs/canvas',canvas=require(backend),create=canvas.createCanvas||((w,h)=>new canvas.Canvas(w,h));
const Art=require('../src/seed-detail-art157.js'),Garden=require('../src/codex-gardens171.js'),D=require('../src/seed-detail157.js'),Q=require('../src/codex3000-recipes159.js');
const specs=Object.assign({},...['world-props-art153','interior-art153','nature-art153'].map(n=>require('../src/'+n+'.js').ASSETS));
test('171 actual garden atlases and fallback stay within every rotated footprint without mutating items',async()=>{
 const images={};for(const [name,spec]of Object.entries(specs))images[name]=await canvas.loadImage(path.resolve(spec.url));
 let blits=0,frames=0;const art={images,blit(c,key,source,...dest){if(!images[key])return false;blits++;c.drawImage(images[key],...source,...dest);return true;}};
 const kinds=[...new Set(Q.GARDENS.flatMap(g=>g.modules))],shapes={...D.objects,...Q.EXTRA_SHAPES};
 for(const kind of kinds)for(const turn of [0,1,2,3])for(const useAtlas of [true,false]){
  const [w,h]=shapes[kind],o={...Garden.pose(6,6,w,h,turn,.8,kind),id:'raster:'+kind+':'+turn,kind,garden171:true,solid:!!shapes[kind][2],surface:false},before=JSON.stringify(o),c=create(384,384),ctx=c.getContext('2d');ctx.scale(32,32);
  assert.equal(Art.draw(ctx,o,{art:useAtlas?art:null,seed:42}),true,kind);assert.equal(JSON.stringify(o),before);
  const data=ctx.getImageData(0,0,384,384).data;let painted=0;
  for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(data[(y*384+x)*4+3]){painted++;assert.ok(x>=Math.floor(o.x*32)-1&&x<=Math.ceil((o.x+o.w)*32)+1&&y>=Math.floor(o.y*32)-1&&y<=Math.ceil((o.y+o.h)*32)+1,kind+' painted outside collision');}
  assert.ok(painted>15,kind+' invisible');frames++;
 }
 console.log('GARDENS171_RASTER '+JSON.stringify({backend,kinds:kinds.length,orientations:4,frames,decodedAtlases:Object.keys(images).length,realBlits:blits}));assert.ok(blits>40);
});
