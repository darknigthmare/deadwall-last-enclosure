'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const E=require('../src/exploration-125.js'),Interior=require('../src/interior-art153.js');
const path=require('node:path');
let images;
test.before(async()=>{images={};for(const [key,value]of Object.entries(Interior.ASSETS))images[key]=await loadImage(path.join(__dirname,'..',value.url));globalThis.DeadwallInteriorArt153=Interior;globalThis.DEADWALL={world:{seed:17117},art:{images}};});
test.after(()=>{delete globalThis.DEADWALL;delete globalThis.DeadwallInteriorArt153;});
const building=()=>({x:220,y:210,w:180,h:108,kind:'bungalow',id:33});
function surface({scale=.8,x=.3,y=.7,alpha=1,background='#31473b'}={}){const image=createCanvas(700,600),c=image.getContext('2d',{alpha:false});c.fillStyle=background;c.fillRect(0,0,700,600);c.setTransform(scale,0,0,scale,x,y);c.globalAlpha=alpha;return{image,c};}
function pixels(image){return image.getContext('2d').getImageData(0,0,image.width,image.height).data;}
function exact(a,b,label='native fallback'){assert.ok(Buffer.from(pixels(a)).equals(Buffer.from(pixels(b))),label);}
function rounded(a,b,label){const actual=pixels(a),native=pixels(b);let maxRGB=0,maxAlpha=0;for(let i=0;i<actual.length;i+=4){for(let j=0;j<3;j++)maxRGB=Math.max(maxRGB,Math.abs(actual[i+j]-native[i+j]));maxAlpha=Math.max(maxAlpha,Math.abs(actual[i+3]-native[i+3]));}assert.ok(maxRGB<=3,label+' RGB rounding '+maxRGB);assert.equal(maxAlpha,0,label+' alpha');}
function cache(options={}){return E.createBuildingShellCache155({canvas:()=>createCanvas(1,1),...options});}

test('155 shell raster: opaque unclipped native roofs preserve physical scale, phase and alpha within three RGB rounding levels',()=>{
  for(const kind of ['bungalow','twoStorey','rowHouse','shop','clinic'])for(const scale of [.52,1,1.65])for(const background of ['#31473b','#010204','#fdfcf9']){
    const b={...building(),kind},r=cache(),settings={scale,background};let result;
    for(let frame=0;frame<3;frame++){result=surface(settings);r.paint(result.c,b,c=>E.drawBuildingShell134(c||result.c,b,kind!=='shop'&&kind!=='clinic'),[],true);}
    const native=surface(settings);E.drawBuildingShell134(native.c,b,kind!=='shop'&&kind!=='clinic');
    rounded(result.image,native.image,kind+'/'+scale+'/'+background);
  }
});

test('155 shell raster: a stable camera stops repeated painting; fractional movement stays native and never allocates a new canvas per frame',()=>{
  const b=building();let allocations=0,paints=0;const r=cache({canvas:()=>{allocations++;return createCanvas(1,1);}});
  for(const x of [.1,.2,.3,.4,.5]){const {c}=surface({x});r.paint(c,b,out=>{paints++;E.drawBuildingShell134(out||c,b,true);},[],true);}
  assert.equal(allocations,0);assert.equal(paints,5);
  for(let frame=0;frame<4;frame++){const {c}=surface({x:.5});r.paint(c,b,out=>{paints++;E.drawBuildingShell134(out||c,b,true);},[],true);}
  assert.equal(allocations,1);assert.equal(paints,6);
});

test('155 shell raster: building shape, loaded art and scene revision invalidate the picture before it can be reused',()=>{
  const b=building(),r=cache();let revision=images,paints=0;
  const render=()=>{const s=surface();r.paint(s.c,b,c=>{paints++;E.drawBuildingShell134(c||s.c,b,true);},[revision],true);return s;};
  render();render();render();assert.equal(paints,2);
  b.w+=26;render();assert.equal(paints,3);render();assert.equal(paints,4);
  b.variant=1;render();assert.equal(paints,5);render();assert.equal(paints,6);
  revision={};const changed=render(),native=surface();E.drawBuildingShell134(native.c,b,true);exact(changed.image,native.image);assert.equal(paints,7);
});

test('155 shell raster: transparency, unknown clipping and integer camera translation use an exact native fallback',()=>{
  const b=building(),r=cache();
  for(const alpha of [1,.35])for(const x of [.3,.3,10.3,10.3]){
    const s=surface({x,alpha}),native=surface({x,alpha});
    for(const c of [s.c,native.c]){c.beginPath();c.rect(170,170,85,85);c.clip();}
    const before=s.c.getTransform(),beforeAlpha=s.c.globalAlpha;assert.equal(r.paint(s.c,b,c=>E.drawBuildingShell134(c||s.c,b,true)),false);E.drawBuildingShell134(native.c,b,true);
    exact(s.image,native.image);assert.deepEqual(s.c.getTransform(),before);assert.equal(s.c.globalAlpha,beforeAlpha);
  }
});

test('155 shell raster: memory remains bounded; unsupported rotation, reflection and oversize rendering use the original painter',()=>{
  const r=cache({bytes:180000,entries:2});
  for(let i=0;i<12;i++){const b={...building(),id:i,w:70,h:40};for(let frame=0;frame<3;frame++){const {c}=surface();r.paint(c,b,out=>E.drawBuildingShell134(out||c,b,true),[],true);}assert.ok(r.stats().bytes<=180000);assert.ok(r.stats().entries<=2);}
  assert.equal(r.stats().entries,2);
  for(const angle of [.3,Math.PI]){const {c}=surface();c.rotate(angle);let count=0;assert.equal(r.paint(c,building(),()=>count++),false);assert.equal(count,1);}
  const {c}=surface();let count=0;assert.equal(r.paint(c,{...building(),w:10000},()=>count++),false);assert.equal(count,1);
  r.clear();assert.equal(r.stats().bytes,0);assert.equal(r.stats().entries,0);
});


test('155 shell raster: the shipped wrapper keeps clipped regional projections native; transparent local contexts cannot opt in',()=>{
  const b=building(),owner=globalThis.DEADWALL;let allocations=0;
  globalThis.document={createElement:()=>{allocations++;return createCanvas(1,1);}};
  try{
    owner.frontier={active:()=>true};
    for(let frame=0;frame<4;frame++){
      const actual=surface(),native=surface();
      for(const c of [actual.c,native.c]){c.beginPath();c.rect(170,170,85,85);c.clip();}
      E.drawCachedBuildingShell155(actual.c,b,true);E.drawBuildingShell134(native.c,b,true);exact(actual.image,native.image,'regional clip fallback');
    }
    assert.equal(allocations,0);
    const r=cache({canvas:()=>{allocations++;return createCanvas(1,1);}});
    for(let frame=0;frame<3;frame++){const actual=surface({alpha:.35}),native=surface({alpha:.35});assert.equal(r.paint(actual.c,b,c=>E.drawBuildingShell134(c||actual.c,b,true),[],true),false);E.drawBuildingShell134(native.c,b,true);exact(actual.image,native.image);}
    assert.equal(allocations,0);
  }finally{delete owner.frontier;delete globalThis.document;}
});


test('155 shell raster: transparent surfaces are rejected even when global alpha is one and the caller opts in',()=>{
  const b=building(),r=cache();let calls=0;
  for(let i=0;i<4;i++){
    const a=createCanvas(700,600),n=createCanvas(700,600),c=a.getContext('2d'),native=n.getContext('2d');
    c.setTransform(.8,0,0,.8,.3,.7);native.setTransform(.8,0,0,.8,.3,.7);
    assert.equal(r.paint(c,b,out=>{calls++;E.drawBuildingShell134(out||c,b,true);},[],true),false);
    E.drawBuildingShell134(native,b,true);exact(a,n);
  }
  assert.equal(calls,4);assert.equal(r.stats().bytes,0);
});
