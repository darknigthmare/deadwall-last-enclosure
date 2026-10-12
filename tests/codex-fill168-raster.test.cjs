'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const F=require('../src/codex-fill168.js'),A=require('../src/codex-anchors160.js'),G=require('../src/frontier-geometry.js'),Art=require('../src/seed-detail-art157.js');
const Interior=require('../src/interior-art153.js'),Props=require('../src/world-props-art153.js'),Nature=require('../src/nature-art153.js');
const output=path.resolve('artifacts/qa/fill168-raster');
test('168 raster: all fifteen equipment types are visible inside their source-sized rotated collider, with real atlases and fallback',async()=>{
 const images={},assets={...Interior.ASSETS,...Props.ASSETS,...Nature.ASSETS};
 for(const [key,spec] of Object.entries(assets))images[key]=await loadImage(spec.url);
 let blits=0;const art={images,blit(c,key,source,...destination){if(!images[key])return false;blits++;c.drawImage(images[key],...source,...destination);return true;}};
 const room={x:.4,y:.4,w:9.2,h:9.2},supports=[{side:'north',index:0,wall:{x:0,y:0,w:10,h:.24}},{side:'east',index:1,wall:{x:9.76,y:0,w:.24,h:10}},{side:'south',index:2,wall:{x:0,y:9.76,w:10,h:.24}},{side:'west',index:3,wall:{x:0,y:0,w:.24,h:10}}];
 fs.mkdirSync(output,{recursive:true});let frames=0,pixels=0;
 for(const mode of ['fallback','atlases'])for(const kind of F.TYPES)for(const s of supports){
  const [width,depth]=G.SHAPES[kind],pose=A.pose(s,room,width,depth,.5,1),o={...pose,id:'raster168:'+kind+':'+s.side,kind,z:0,solid:true,surface:false,decor157:true,anchored160:true,fill168:true};
  const before=JSON.stringify(o),canvas=createCanvas(480,480),c=canvas.getContext('2d');c.scale(48,48);const previousBlits=blits;
  assert.equal(Art.draw(c,o,{art:mode==='atlases'?art:null,seed:42}),true,kind+' '+s.side+' '+mode);assert.equal(JSON.stringify(o),before);
  if(mode==='atlases')assert.ok(blits>previousBlits,kind+' did not use its decoded sprite');
  const p=c.getImageData(0,0,480,480).data;let visible=0;
  for(let y=0;y<480;y++)for(let x=0;x<480;x++)if(p[(y*480+x)*4+3]){
   visible++;assert.ok(x>=Math.floor(o.x*48)-1&&x<=Math.ceil((o.x+o.w)*48)+1&&y>=Math.floor(o.y*48)-1&&y<=Math.ceil((o.y+o.h)*48)+1,kind+' painted outside collider');
  }
  assert.ok(visible>100,kind+' invisible');pixels+=visible;frames++;
  if(mode==='atlases'&&['counter','fridge','sink','bench'].includes(kind))fs.writeFileSync(path.join(output,kind+'-'+s.side+'.png'),canvas.toBuffer('image/png'));
 }
 const report={scope:'Actual sprite and fallback raster, fifteen authored equipment kinds, four orientations. Not a campaign or manual visual review.',frames,kinds:F.TYPES.length,orientations:4,decodedAtlases:Object.keys(images).length,blits,visiblePixels:pixels,pass:true};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('RASTER168 '+JSON.stringify(report));
});
