'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {createCanvas} = require('@napi-rs/canvas');
const Art = require('../src/codex-plan-art204.js');
const Furniture = require('../src/codex-furnishings2026.js');
const kinds = Object.keys(Furniture.CATALOGUE);
const hash = data => createHash('sha256').update(data).digest('hex');

function idFor(kind, variant) {
  for(let i=0;i<100;i++) {
    const id='raster204:'+kind+':'+i;
    if(Art.variantFor({id,kind})===variant) return id;
  }
  throw Error('Une variante visuelle manque : '+kind+'/'+variant);
}
function render(kind, options = {}) {
  const canvas = createCanvas(320,320), ctx = canvas.getContext('2d');
  const scale = options.scale ?? 40, size = Furniture.CATALOGUE[kind] ? Furniture.shape(kind) : {w:1.8,h:1.2};
  const prop = Object.freeze({x:1.25,y:1.5,w:size.w,h:size.h,rotationRad:0,kind,
    id:options.id||idFor(kind,0),...options.prop});
  ctx.scale(scale,scale);
  const accepted = Art.drawProp(ctx,prop,scale);
  const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
  return {canvas,ctx,prop,scale,accepted,data,hash:hash(data)};
}
function assertContained(image) {
  const {canvas,data,prop:p,scale:s} = image;
  // A boundary pixel can contain a fractional covered part. Every pixel wholly
  // beyond the declared world-space footprint must remain transparent.
  const left=Math.floor(p.x*s+1e-8),top=Math.floor(p.y*s+1e-8);
  const right=Math.ceil((p.x+p.w)*s-1e-8),bottom=Math.ceil((p.y+p.h)*s-1e-8);
  let visible=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++) {
    const alpha=data[(y*canvas.width+x)*4+3];
    if(x<left||x>=right||y<top||y>=bottom) assert.equal(alpha,0,`${p.kind}: dessin hors emprise à ${x},${y}`);
    else if(alpha) visible++;
  }
  assert.ok(visible>0,p.kind+': aucun pictogramme');
}

test('every existing furniture kind receives visible original art inside its actual metric footprint', () => {
  for(const kind of kinds) {
    assert.notEqual(Art.categoryFor(kind),'generic',kind+': catalogue non couvert');
    const image=render(kind);assert.equal(image.accepted,true);assertContained(image);
  }
});

test('each furniture kind has three genuinely different deterministic cosmetic variants', () => {
  for(const kind of kinds) {
    const pictures=[0,1,2].map(v=>render(kind,{id:idFor(kind,v)}));
    assert.equal(new Set(pictures.map(p=>p.hash)).size,3,kind+': variantes identiques');
    for(const p of pictures) assert.equal(render(kind,{id:p.prop.id}).hash,p.hash,kind+': instable');
  }
});

test('beds, seating, tables, stores, utilities and specialised machinery have distinguishable silhouettes and details', () => {
  const representatives=['bed','chair','table','shelf','sink','toilet','medical','electricalRack','pump','growingBed','conveyor'];
  const images=representatives.map(kind=>render(kind,{prop:{w:1.8,h:1.2}}));
  assert.equal(new Set(images.map(p=>p.hash)).size,representatives.length);
});

test('closely related equipment retains purpose-specific differences at equal scale and matching cosmetic variant', () => {
  for(const pair of [['wardrobe','smallCabinet'],['shelf','dishRack'],['dishRack','curingRack'],['milkVat','wineVat'],['growingBed','growingBench'],['dosingUnit','foodMixer'],['foodMixer','materialMixer'],['metalSaw','millingMachine']]) {
    const [a,b]=pair.map(kind=>render(kind,{prop:{w:1.8,h:1.2}}));
    assert.notEqual(a.hash,b.hash,pair.join('/'));
  }
});

test('quarter-turns preserve the final footprint and move the actual pillow to the expected side', () => {
  function brightness(image, side) {
    const {prop:p,scale:s,data,canvas} = image;
    let sum=0,count=0;
    for(let y=.12;y<.88;y+=.025)for(let x=.12;x<.88;x+=.025) {
      if(!(side==='north'?y<.32:side==='south'?y>.68:side==='west'?x<.32:x>.68))continue;
      const px=Math.floor((p.x+p.w*x)*s),py=Math.floor((p.y+p.h*y)*s),i=(py*canvas.width+px)*4;
      sum+=(data[i]+data[i+1]+data[i+2])/3;count++;
    }
    return sum/count;
  }
  for(const [quarter,head,foot] of [[0,'north','south'],[1,'east','west'],[2,'south','north'],[3,'west','east']]) {
    const image=render('bed',{prop:{w:quarter%2?1.2:2,h:quarter%2?2:1.2,rotationRad:quarter*Math.PI/2}});
    assert.equal(image.accepted,true);assertContained(image);
    assert.ok(brightness(image,head)>brightness(image,foot)+8,'orientation de la tête du lit '+quarter);
  }
});

test('unfamiliar future kinds remain visible as neutral pictograms, with no misleading known-device classification', () => {
  const image=render('future-unknown-device');assert.equal(Art.categoryFor(image.prop.kind),'generic');
  assert.equal(image.accepted,true);assertContained(image);
  assert.notEqual(image.hash,render('pump',{prop:{w:1.8,h:1.2}}).hash);
});

test('low zoom draws bounded silhouettes and adds readable equipment details only when space permits', () => {
  function calls(scale) {
    const canvas=createCanvas(160,160),target=canvas.getContext('2d'),counts={};target.scale(scale,scale);
    const ctx=new Proxy(target,{get(object,key){const value=object[key];if(typeof value!=='function')return value;return (...args)=>{counts[key]=(counts[key]||0)+1;return value.apply(object,args);};},set(object,key,value){object[key]=value;return true;}});
    assert.equal(Art.drawProp(ctx,{id:'zoom-sink',kind:'sink',x:1,y:1,w:1.2,h:.8},scale),true);
    return counts;
  }
  const near=calls(40),far=calls(2);
  assert.ok(near.ellipse>0);assert.equal(far.ellipse||0,0);assert.equal(far.fillRect,1);
});

test('invalid geometry, identity, scale and non-quarter rotations leave the canvas untouched', () => {
  const canvas=createCanvas(80,80),ctx=canvas.getContext('2d');ctx.fillStyle='#385546';ctx.fillRect(0,0,80,80);
  const before=hash(ctx.getImageData(0,0,80,80).data),base={x:10,y:10,w:20,h:30,rotationRad:0,id:'invalid204',kind:'bed'};
  for(const patch of [{w:0},{h:-1},{x:NaN},{y:Infinity},{rotationRad:Math.PI/3},{rotationRad:1e100},{id:''},{kind:''},{id:4},{kind:null},{x:Number.MAX_VALUE,w:Number.MAX_VALUE}]) {
    assert.equal(Art.drawProp(ctx,{...base,...patch},1),false);
    assert.equal(hash(ctx.getImageData(0,0,80,80).data),before);
  }
  for(const scale of [0,-1,NaN,Infinity,Number.MAX_VALUE]) assert.equal(Art.drawProp(ctx,base,scale),false);
  assert.equal(Art.drawProp(null,base,1),false);assert.equal(Art.drawProp({},base,1),false);assert.equal(Art.drawProp(ctx,null,1),false);
  assert.equal(hash(ctx.getImageData(0,0,80,80).data),before);
});

test('painting preserves caller transforms, styles, dash state and immutable prop data without using randomness', () => {
  const canvas=createCanvas(240,180),ctx=canvas.getContext('2d');ctx.translate(7,11);ctx.scale(32,32);
  ctx.fillStyle='#f09030';ctx.strokeStyle='#acf';ctx.lineWidth=.14;ctx.globalAlpha=.6;ctx.setLineDash([.12,.07]);ctx.shadowBlur=4;
  const state=()=>({matrix:['a','b','c','d','e','f'].map(k=>ctx.getTransform()[k]),fill:ctx.fillStyle,stroke:ctx.strokeStyle,line:ctx.lineWidth,alpha:ctx.globalAlpha,dash:ctx.getLineDash(),shadow:ctx.shadowBlur});
  const before=state(),prop=Object.freeze({id:'immutable204',kind:'electricalRack',x:1,y:1,w:1.2,h:.8,rotationRad:Math.PI/2});
  const text=JSON.stringify(prop),random=Math.random;
  try {Math.random=()=>{throw Error('Le dessin ne doit pas utiliser le hasard.');};assert.equal(Art.drawProp(ctx,prop,32),true);}
  finally {Math.random=random;}
  assert.deepEqual(state(),before);assert.equal(JSON.stringify(prop),text);
});

test('the standalone UMD module works without require, DOM, game globals, RAF or file access', () => {
  const sandbox={module:{exports:{}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/codex-plan-art204.js'),'utf8'),sandbox);
  assert.equal(typeof sandbox.DeadwallCodexPlanArt204.drawProp,'function');
  assert.equal(sandbox.module.exports.scope,'author-inspection-pictograms-not-campaign');
  const canvas=createCanvas(80,80),ctx=canvas.getContext('2d');ctx.scale(20,20);
  assert.equal(sandbox.module.exports.drawProp(ctx,{id:'umd204',kind:'bed',x:1,y:1,w:2,h:1},20),true);
  assert.ok(ctx.getImageData(0,0,80,80).data.some((v,i)=>i%4===3&&v));
  assert.equal(sandbox.document,undefined);assert.equal(sandbox.requestAnimationFrame,undefined);assert.equal(sandbox.DEADWALL,undefined);
});
