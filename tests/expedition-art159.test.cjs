'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/expedition-sprites159.js'),E=require('../src/expedition-art.js'),C=require('../src/core.js');
const spec=A.ASSETS.expeditionSites159;let promise;
const artwork=()=>promise??=loadImage(path.join(__dirname,'..',spec.url)).then(image=>({images:{expeditionSites159:image},blit(c,k,r,...d){c.drawImage(this.images[k],...r,...d);return true;}}));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');

test('159 every real expedition site maps to one of six original families with two distinct compositions and isolated alpha cuts',async()=>{
 const art=await artwork(),image=art.images.expeditionSites159;assert.equal(image.width,spec.width);assert.equal(image.height,spec.height);assert.equal(C.Expeditions.SITES.length,12);
 assert.deepEqual(Object.keys(A.FAMILIES),['fuel','garage','supply','archives','medical','ammo']);
 for(const d of C.Expeditions.SITES){assert.ok(A.select(d.kind,d.id,17117),d.id);assert.equal(A.FAMILIES[d.kind].length,2);}
 const c=createCanvas(image.width,image.height).getContext('2d');c.drawImage(image,0,0);const data=c.getImageData(0,0,image.width,image.height).data;let count=0;
 for(const [x,y,w,h]of A.CUTS){assert.ok(x>0&&y>0&&x+w<image.width&&y+h<image.height);let cut=0;
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(data[(yy*image.width+xx)*4+3]>8){cut++;assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1);}
  assert.ok(cut>400);count+=cut;
 }
 let total=0;for(let i=3;i<data.length;i+=4)if(data[i]>8)total++;assert.equal(count,total,'no neighbouring pixels lost or duplicated');
});

test('159 native site picture, owner finite/report state, labels and selection use the real site painter; failed image retains procedural fallback',async()=>{
 const art=await artwork(),c=createCanvas(220,180).getContext('2d'),d={...C.Expeditions.SITES[0],x:100,y:95},s={reported:false,stock:{fuel:10}},saved=JSON.stringify({d,s});
 const calls=[],previous=art.blit;art.blit=function(ctx,k,r,...dest){calls.push({k,r,dest,alpha:ctx.globalAlpha});return previous.call(this,ctx,k,r,...dest);};
 E.site(c,d,s,true,{art,seed:17117});assert.equal(calls.length,1);assert.equal(calls[0].k,'expeditionSites159');assert.ok(calls[0].dest[2]<=76&&calls[0].dest[3]<=52);
 assert.equal(JSON.stringify({d,s}),saved);
 const healthy=sha(c.getImageData(0,0,220,180).data);c.clearRect(0,0,220,180);s.reported=true;E.site(c,d,s,true,{art,seed:17117});assert.ok(Math.abs(calls.at(-1).alpha-.84)<=1/255);assert.notEqual(sha(c.getImageData(0,0,220,180).data),healthy);
 c.clearRect(0,0,220,180);s.stock.fuel=0;E.site(c,d,s,true,{art,seed:17117});assert.ok(Math.abs(calls.at(-1).alpha-.52)<=1/255);
 c.clearRect(0,0,220,180);E.site(c,d,s,true,{art:{images:{}},seed:17117});assert.notEqual(sha(c.getImageData(0,0,220,180).data),sha(Buffer.alloc(220*180*4)),'fallback still paints site and label');
 assert.equal(A.draw(c,{images:{}},d,s),false);assert.equal(A.select('constructor','anything'),null);
 c.font='bold 11px sans-serif';for(const site of C.Expeditions.SITES){const lines=E.siteLabel(c,site.name);assert.equal(lines.join(' '),site.name);assert.ok(lines.every(line=>c.measureText(line).width<=108),'site labels fit their bounded world support');}
});

test('159 site identity and seed pick stable true variants without rerolling on reported/empty state, frame clock or reload',async()=>{
 const art=await artwork(),c=createCanvas(150,120).getContext('2d'),old=Math.random;
 Math.random=()=>{throw Error('Presentation must not consume simulation RNG');};try{for(const kind of Object.keys(A.FAMILIES)){
  const d={id:'stable-'+kind,kind,x:75,y:65},saved=JSON.stringify(d),selected=A.select(kind,d.id,17117);
  A.draw(c,art,d,{reported:true,stock:{scrap:0}},{seed:17117});assert.equal(JSON.stringify(d),saved);
  assert.strictEqual(A.select(kind,JSON.parse(saved).id,17117),selected);
  assert.equal(new Set(Array.from({length:40},(_,i)=>A.select(kind,i,17117).variant)).size,2);
 }}finally{Math.random=old;}
});
