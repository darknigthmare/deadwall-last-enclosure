'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const Detail=require('../src/seed-detail157.js'),A=require('../src/seed-detail-art157.js'),P=require('../src/world-props-art153.js');
const N=require('../src/nature-art153.js'),I=require('../src/interior-art153.js');
const repo=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let images;
test.before(async()=>{
 images={};for(const[key,s]of Object.entries({...P.ASSETS,...N.ASSETS,...I.ASSETS}))images[key]=await loadImage(path.join(repo,s.url));
});
const art=()=>({images,blit(c,key,r,...d){c.drawImage(images[key],...r,...d);return true;}});
const item=(kind,extra={})=>{const[w,h,solid]=Detail.objects[kind]||[2,.3,true];return Object.freeze({id:'detail157:'+kind,kind,x:0,y:0,w,h,z:0,solid,surface:!solid,...extra});};
function solidBounds(canvas){const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let l=canvas.width,t=canvas.height,r=-1,b=-1,n=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(p[(y*canvas.width+x)*4+3]>8){n++;l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return{l,t,r,b,n};}

test('157 detail art: both original PNG dimensions and all 32 measured cuts contain full separate silhouettes',()=>{
 assert.equal(Object.keys(P.ASSETS157).length,2);assert.equal(Object.keys(P.FAMILIES157).length,16);
 for(const[key,s]of Object.entries(P.ASSETS157)){
  const bytes=fs.readFileSync(path.join(repo,s.url)),im=images[key];assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.deepEqual([im.width,im.height],[s.width,s.height]);
  const c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);const p=c.getImageData(0,0,im.width,im.height).data,covered=new Uint8Array(im.width*im.height);
  for(const r of P.CUTS157[key]){
   const[x,y,w,h]=r;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=im.width&&y+h<=im.height);let solid=0;
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const at=yy*im.width+xx;if(p[at*4+3]<=8)continue;assert.equal(covered[at],0,'Neighbour source fragment shared');covered[at]=1;solid++;assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1,'A measured cut clips a silhouette');}
   assert.ok(solid>1000,'A complete model is actually present');
  }
  for(let at=0;at<covered.length;at++)if(p[at*4+3]>8)assert.equal(covered[at],1,'Original visible source pixel outside the cuts');
 }
});

test('157 detail art: each of 16 new model pairs paints two distinct original pixel compositions',()=>{
 for(const[family,forms]of Object.entries(P.FAMILIES157)){
  assert.equal(forms.length,2);const digests=new Set();
  for(let variant=0;variant<2;variant++){
   const canvas=createCanvas(160,160),c=canvas.getContext('2d');assert.equal(P.drawSprite(c,art(),family,'pair',80,80,144,144,{variant}),true);
   const b=solidBounds(canvas);assert.ok(b.n>1000,family+' visible model');assert.ok(b.l>=8&&b.t>=8&&b.r<=152&&b.b<=152,'Uniform source fit');
   digests.add(sha(c.getImageData(0,0,160,160).data));
  }
  assert.equal(digests.size,2,family+' is not the same source drawn twice');
 }
});

test('157 detail art: all 47 real feature kinds plus boundary fence have named image or specific Canvas owners',()=>{
 for(const kind of [...Object.keys(Detail.objects),'fence']){
  const spec=A.presentationFor(kind);assert.ok(spec,kind);assert.equal(Object.isFrozen(spec),true);
  if(spec.owner==='props')assert.ok(P.FAMILIES[spec.family],kind);
  if(spec.owner==='nature')assert.ok(N.FAMILIES[spec.family],kind);
  if(spec.owner==='furniture')assert.ok(I.FURNITURE[spec.family],kind);
  const canvas=createCanvas(260,240),c=canvas.getContext('2d');c.translate(20,20);c.scale(30,30);const o=item(kind),before=JSON.stringify(o);
  assert.equal(A.draw(c,o,{art:art(),seed:17117}),true,kind);assert.equal(JSON.stringify(o),before,'Pictures modify physical data');assert.ok(solidBounds(canvas).n>15,kind+' has real visible output');
 }
 for(const kind of ['barbecue','sign','cart','canopy','bollard','tv','toolbox'])assert.equal(A.presentationFor(kind).owner,'props',kind+' no longer a generic rectangle');
 for(const kind of ['__proto__','constructor','missing'])assert.equal(A.presentationFor(kind),null);
});

test('157 detail art: sprite and fallback pixels retain each actual owner rectangle at four parcel rotations and each floor',()=>{
 for(const native of[true,false])for(const kind of[...Object.keys(Detail.objects),'fence'])for(let turn=0;turn<4;turn++){
  const o=item(kind,{z:turn-1}),canvas=createCanvas(320,320),c=canvas.getContext('2d'),scale=35;
  c.translate(160,160);c.rotate(turn*Math.PI/2);c.scale(scale,scale);c.translate(-o.w/2,-o.h/2);
  assert.equal(A.draw(c,o,{art:native?art():{images:{}},seed:903145}),true);
  const b=solidBounds(canvas),halfW=(turn%2?o.h:o.w)*scale/2,halfH=(turn%2?o.w:o.h)*scale/2;
  assert.ok(b.n>1,kind);assert.ok(b.l>=Math.floor(160-halfW)&&b.r<=Math.ceil(160+halfW)&&b.t>=Math.floor(160-halfH)&&b.b<=Math.ceil(160+halfH),kind+' visible intrusion beyond generated blocker');
 }
});

test('157 detail art: seeds and stable IDs select both forms without RNG, scene/floor/collider or economy mutations',()=>{
 const o=item('pool',{z:1}),before=JSON.stringify(o),seen=new Set(),oldRandom=Math.random;
 Math.random=()=>assert.fail('Presentation must not consume ambient RNG');
 try{
  for(let seed=0;seed<32;seed++){
   const draws=[],record={images,blit(c,key,r,...d){draws.push({key,r,d});return true;}},canvas=createCanvas(120,100),c=canvas.getContext('2d');
   assert.equal(A.draw(c,o,{art:record,seed}),true);const first=JSON.stringify(draws.at(-1));
   assert.equal(A.draw(c,{...o},{art:record,seed}),true);assert.equal(JSON.stringify(draws.at(-1)),first);
   seen.add(first);assert.equal(JSON.stringify(o),before);
  }
 }finally{Math.random=oldRandom;}
 assert.equal(seen.size,2,'Both original forms are reachable');
});

test('157 detail art: missing images still draw every named detail and retain caller transform, alpha, filter and clip',()=>{
 const canvas=createCanvas(320,250),c=canvas.getContext('2d');c.translate(14,19);c.scale(30,30);c.globalAlpha=.4;c.filter='contrast(1.1)';
 const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter;
 for(const kind of [...Object.keys(Detail.objects),'fence']){
  const o=item(kind),before=JSON.stringify(o);assert.equal(A.draw(c,o,{art:{images:{}},seed:42}),true,kind);
  assert.equal(JSON.stringify(o),before);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);
 }
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.filter='none';c.clearRect(0,0,320,250);c.fillStyle='#ffffff';c.fillRect(0,0,320,250);
 assert.equal(solidBounds(canvas).n,320*250,'A leaked feature clip truncates the next paint');
});

test('157 detail art: invalid supports and inherited kinds are rejected without painting or entering canvas state',()=>{
 const c=createCanvas(100,100).getContext('2d'),before=c.getImageData(0,0,100,100).data;
 for(const changes of[{kind:'constructor'},{kind:'__proto__'},{kind:'unknown'},{x:NaN},{w:0},{h:-1},{y:Infinity}])assert.equal(A.draw(c,item('pool',changes),{art:art()}),false);
 assert.equal(A.draw(c,null),false);assert.equal(A.draw(null,item('pool')),false);assert.deepEqual(c.getImageData(0,0,100,100).data,before);
});

test('157 detail art: repeated images allocate no new canvas and preserve the original atlas bytes',()=>{
 const priorDocument=global.document,sourceHashes=Object.fromEntries(Object.entries(P.ASSETS157).map(([key,s])=>[key,sha(fs.readFileSync(path.join(repo,s.url)))]));
 const c=createCanvas(100,100).getContext('2d');global.document={createElement(){assert.fail('No per-frame surface allocation');}};
 try{for(let n=0;n<30;n++)for(const kind of['pool','chair','bench','playset','tv','planter','tree'])assert.equal(A.draw(c,item(kind),{art:art(),seed:42}),true);}finally{global.document=priorDocument;}
 for(const[key,s]of Object.entries(P.ASSETS157))assert.equal(sha(fs.readFileSync(path.join(repo,s.url))),sourceHashes[key]);
});
