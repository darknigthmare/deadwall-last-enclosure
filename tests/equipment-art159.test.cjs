'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const E=require('../src/equipment-art159.js');
const C=require('../src/core.js');
const A=require('../src/assets136.js');
const ROOT=path.resolve(__dirname,'..');
let artPromise;
function artwork(){return artPromise||(artPromise=(async()=>{const images={};for(const [key,spec]of Object.entries(E.ASSETS))images[key]=await loadImage(path.join(ROOT,spec.url));return{images};})());}
function pixels(canvas){return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;}
function digest(canvas){return crypto.createHash('sha256').update(pixels(canvas)).digest('hex');}
function opaque(canvas){const p=pixels(canvas);let ct=0;for(let i=3;i<p.length;i+=4)if(p[i]>=16)ct++;return ct;}
function state(ctx){return{transform:[ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f],alpha:ctx.globalAlpha,lineWidth:ctx.lineWidth,fillStyle:ctx.fillStyle,strokeStyle:ctx.strokeStyle,composite:ctx.globalCompositeOperation};}
function renderIcon(art,id,variant){const canvas=createCanvas(96,64);assert.equal(E.drawIcon(canvas.getContext('2d'),art,id,4,4,88,56,{variant}),true);return canvas;}
function fakeDocument(){return{createElement(tag){if(tag==='canvas'){const canvas=createCanvas(1,1);canvas.style={};canvas.tagName='canvas';return canvas;}return{tagName:tag,style:{},dataset:{},children:[],setAttribute(){},appendChild(node){this.children.push(node);}};},createElementNS(ns,tag){return this.createElement(tag);}};}

test('equipment 159 covers each real portable Arsenal model and no undeclared item',()=>{
 const catalog=Object.values(C.Arsenal134Rules.catalog),portable=catalog.filter(x=>x.category!=='deployed').map(x=>x.id).sort();
 assert.equal(portable.length,36);assert.deepEqual([...E.FIREARMS,...E.TOOLS].sort(),portable);
 for(const model of catalog){assert.equal(!!E.weaponSprite(model.id),model.category!=='deployed',model.id);}
 assert.equal(E.weaponSprite('nonexistent'),null);
 assert.deepEqual([...E.CORPSE_KINDS].sort(),Object.keys(C.ENEMIES).sort());
 assert.equal(Object.values(E.CROPS).reduce((n,rows)=>n+rows.length,0),130);
});

test('equipment 159 original PNGs are transparent and all measured source crops contain isolated native pixels',async()=>{
 const art=await artwork(),seen=new Set();
 for(const [atlas,spec]of Object.entries(E.ASSETS)){
  assert.equal(art.images[atlas].width,spec.width);assert.equal(art.images[atlas].height,spec.height);
  const canvas=createCanvas(spec.width,spec.height),ctx=canvas.getContext('2d');ctx.drawImage(art.images[atlas],0,0);
  const p=pixels(canvas);let transparent=0;for(let i=3;i<p.length;i+=4)if(p[i]===0)transparent++;
  assert.ok(transparent>spec.width*spec.height*.5,atlas+' mostly transparent');
  const file=path.basename(spec.url);
  for(const [index,r]of E.CROPS[file].entries()){
   assert.ok(r.every(Number.isFinite));assert.ok(r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=spec.width&&r[1]+r[3]<=spec.height);
   const crop=createCanvas(r[2],r[3]);crop.getContext('2d').drawImage(art.images[atlas],...r,0,0,r[2],r[3]);
   assert.ok(opaque(crop)>180,atlas+':'+index+' has actual illustration');
   const hash=digest(crop);assert.ok(!seen.has(hash),atlas+':'+index+' source differs');seen.add(hash);
   assert.equal(Object.isFrozen(r),true);
  }
 }
 assert.equal(seen.size,130);
});

test('all 36 native equipment icons and both forms are visibly distinct and preserve context state',async()=>{
 const art=await artwork(),doc=fakeDocument(),seen=new Set();
 for(const id of [...E.FIREARMS,...E.TOOLS]){
  const first=renderIcon(art,id,0),second=renderIcon(art,id,1);
  assert.ok(opaque(first)>100,id+' first visible');assert.ok(opaque(second)>100,id+' second visible');
  const a=digest(first),b=digest(second);assert.notEqual(a,b,id+' variants differ');assert.ok(!seen.has(a),id+' source identity differs');seen.add(a);
  const box=A.icon(doc,id,{art,category:C.Arsenal134Rules.catalog[id].category});
  assert.equal(box.dataset.equipment,id);assert.equal(box.children.length,1);assert.equal(box.children[0].tagName,'canvas');assert.ok(opaque(box.children[0])>100);
  const ctx=createCanvas(180,120).getContext('2d');ctx.translate(8,4);ctx.rotate(.2);ctx.globalAlpha=.42;ctx.fillStyle='#aaccff';ctx.lineWidth=7;
  const before=state(ctx);assert.equal(E.drawIcon(ctx,art,id,0,0,96,64,{variant:0}),true);assert.deepEqual(state(ctx),before);
 }
 assert.equal(seen.size,36);
});

test('native hand parts keep separate model silhouettes at the real hand pivot without sampling random state',async()=>{
 const art=await artwork(),oldRandom=Math.random;
 Math.random=()=>{throw Error('Presentation sampled random state');};
 try{
  for(const id of [...E.FIREARMS,...E.TOOLS]){
   const ctx=createCanvas(160,120).getContext('2d');ctx.translate(60,50);ctx.rotate(.7);ctx.globalAlpha=.63;ctx.lineWidth=6;
   const before=state(ctx),owner=Object.freeze({seed:17117,identity:'survivor:'+id,variant:0});
   assert.equal(E.drawHeld(ctx,art,id,9,8,0,owner),true);assert.deepEqual(state(ctx),before);assert.ok(opaque(ctx.canvas)>18,id+' held visible');
   const c=createCanvas(160,120),cc=c.getContext('2d');cc.translate(60,50);
   assert.equal(A.drawHeld(cc,id,art,owner),true);assert.ok(opaque(c)>18,id+' native Assets136 owner');
   assert.deepEqual(E.weaponSprite(id,owner),E.weaponSprite(id,owner));
   if(E.FIREARMS.includes(id)){assert.notEqual(E.weaponSprite(id,{held:true,variant:0}).atlas,E.weaponSprite(id,{held:false,variant:0}).atlas);}
  }
 }finally{Math.random=oldRandom;}
});

test('all 72 measured hand anchors touch opaque grip pixels, including asymmetric tonfa and receivers',async()=>{
 const art=await artwork();
 for(const id of [...E.FIREARMS,...E.TOOLS])for(const variant of [0,1]){
  const sprite=E.weaponSprite(id,{variant,held:true}),r=sprite.rect,[gx,gy]=sprite.anchor;
  assert.ok(gx>0&&gx<1&&gy>0&&gy<1);assert.equal(Object.isFrozen(sprite.anchor),true);
  const canvas=createCanvas(r[2],r[3]);canvas.getContext('2d').drawImage(art.images[sprite.atlas],...r,0,0,r[2],r[3]);
  const p=pixels(canvas),x=Math.floor(gx*r[2]),y=Math.floor(gy*r[3]);
  assert.ok(p[(y*r[2]+x)*4+3]>=100,id+' / '+variant+' actual hand contact');
 }
});

test('each real corpse profile has two native fallen positions with native rotation, scale and age fade',async()=>{
 const art=await artwork(),seen=new Set();
 for(const kind of E.CORPSE_KINDS){
  const c=Object.freeze({x:70,y:50,kind,age:0,rotation:.2,scale:1}),a=createCanvas(140,100),b=createCanvas(140,100);
  const ctx=a.getContext('2d');ctx.globalAlpha=.27;ctx.lineWidth=9;const before=state(ctx);
  assert.equal(E.drawCorpse(ctx,art,c,{seed:17117,variant:0}),true);assert.deepEqual(state(ctx),before);
  assert.equal(E.drawCorpse(b.getContext('2d'),art,c,{seed:17117,variant:1}),true);
  assert.ok(opaque(a)>100,kind+' corpse visible');assert.notEqual(digest(a),digest(b),kind+' fallen positions differ');
  assert.ok(!seen.has(digest(a)),kind+' native profile differs');seen.add(digest(a));
  const paused=createCanvas(140,100);E.drawCorpse(paused.getContext('2d'),art,c,{seed:17117,variant:0});
  assert.equal(digest(a),digest(paused),kind+' repeated paint stable');
  const faded=createCanvas(140,100);assert.equal(E.drawCorpse(faded.getContext('2d'),art,{...c,age:95},{variant:0}),true);assert.equal(opaque(faded),0,kind+' historical end age');
  const rotated=createCanvas(140,100);E.drawCorpse(rotated.getContext('2d'),art,{...c,rotation:1.7},{variant:0});assert.notEqual(digest(rotated),digest(a));
 }
 assert.equal(seen.size,10);
});

test('missing native images and invalid presentation owners return false without changing the canvas',async()=>{
 const art=await artwork(),ctx=createCanvas(140,100).getContext('2d');ctx.translate(7,8);ctx.rotate(.3);ctx.globalAlpha=.4;
 const before=state(ctx),original=digest(ctx.canvas),c={x:70,y:50,kind:'walker',age:0,rotation:0,scale:1};
 for(const result of [E.drawHeld(ctx,art,'madeUp'),E.drawHeld(ctx,{images:{}},'rifle'),E.drawHeld(ctx,art,'rifle',NaN,8),E.drawIcon(ctx,art,'rifle',0,0,-1,64),E.drawCorpse(ctx,{images:{}},c),E.drawCorpse(ctx,art,{...c,kind:'madeUp'}),E.drawCorpse(ctx,art,{...c,alive:true}),E.drawCorpse(ctx,art,{...c,dead:false}),E.drawCorpse(ctx,art,{...c,age:-1}),E.drawCorpse(ctx,art,{...c,scale:0})])assert.equal(result,false);
 assert.deepEqual(state(ctx),before);assert.equal(digest(ctx.canvas),original);
 const fallback=createCanvas(140,100);fallback.getContext('2d').translate(50,40);A.drawHeld(fallback.getContext('2d'),'hatchet',{images:{}});assert.ok(opaque(fallback)>20,'established vector fallback');
});

test('corpse selection cache observes identity changes and keeps live age outside cached presentation',()=>{
 const c={kind:'walker',x:12,y:18,rotation:.3,scale:1,age:0},first=E.corpseSprite(c,{seed:17117});
 c.age=74;assert.equal(E.corpseSprite(c,{seed:17117}),first,'aging does not reselect corpse artwork');
 c.kind='armored';const changed=E.corpseSprite(c,{seed:17117});assert.notEqual(changed,first);assert.equal(changed.id,'armored');
 assert.notEqual(E.corpseSprite(c,{seed:84329}),changed,'world seed invalidates selection');
 assert.equal(E.corpseSprite({...c,kind:'unknown'}),null);
});

test('equipment raw originals and declared provenance hashes agree without rewritten image bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/art159/EQUIPMENT_PROVENANCE.json'),'utf8'));
 assert.equal(manifest.originals.length,7);
 for(const row of manifest.originals){const bytes=fs.readFileSync(path.join(ROOT,row.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256,row.file);assert.equal(row.byteLength,bytes.length);}
});
