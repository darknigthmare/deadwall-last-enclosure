'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const native=require('@napi-rs/canvas'),Raster=require('../src/render-cache153.js'),Art=require('../src/art.js');
const canvas=()=>native.createCanvas(1,1),cache=options=>Raster.create({canvas,...options});
const context=()=>native.createCanvas(300,300).getContext('2d');
function source(color='#928267'){
  const image=native.createCanvas(512,512),c=image.getContext('2d');
  c.fillStyle=color;c.fillRect(64,64,384,384);return image;
}

test('raster153: actual DPR, scale, rotation, reflection and smoothing choose sufficient source resolution',()=>{
  const c=context(),r=[0,0,512,512];
  assert.equal(Raster.levelFor(c,r,55,55),2);
  c.scale(2,2);assert.equal(Raster.levelFor(c,r,55,55),1);
  c.rotate(.71);assert.equal(Raster.levelFor(c,r,55,55),1);
  c.scale(-1,1);assert.equal(Raster.levelFor(c,r,55,55),1);
  c.scale(2,2);assert.equal(Raster.levelFor(c,r,55,55),0);
  c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;assert.equal(Raster.levelFor(c,r,55,55),0);
  assert.equal(Raster.levelFor({},r,55,55),0);
  c.imageSmoothingEnabled=true;
  for(const bad of [[0,0,0,512],[0,0,512,Infinity],[-1,0,512,512]])assert.equal(Raster.levelFor(c,bad,55,55),0);
});

test('raster153: image replacement, source rectangle and quality scales cannot reuse stale pixels',()=>{
  const c=context(),r=[0,0,512,512],a=source(),b=source('#735353'),memo=cache();
  const first=memo.get(c,'atlas',a,r,55,55);assert.ok(first);assert.equal(first.width,128);
  assert.equal(memo.get(c,'atlas',a,r,55,55),first);
  assert.notEqual(memo.get(c,'atlas',b,r,55,55),first);
  const cut=memo.get(c,'atlas',b,[64,64,384,384],55,55);assert.ok(cut);assert.notEqual(cut,first);
  c.scale(2,2);const large=memo.get(c,'atlas',b,r,55,55);assert.ok(large);assert.equal(large.width,256);
  assert.equal(memo.items.size,3);assert.equal(memo.stats.hits,1);
  memo.clear();assert.equal(memo.bytes,0);assert.equal(memo.items.size,0);
});

test('raster153: LRU memory and entry budgets stay bounded across repeated maps and many atlas frames',()=>{
  const c=context(),image=source(),memo=cache({bytes:130000,entries:2}),r=[0,0,512,512];
  const first=memo.get(c,'first',image,r,55,55);assert.ok(first);
  for(let i=0;i<1000;i++){
    assert.ok(memo.get(c,'atlas-'+i,image,r,55,55));
    assert.ok(memo.bytes<=130000);assert.ok(memo.items.size<=2);
  }
  assert.ok(memo.stats.evictions>=999);assert.equal(memo.items.has('first:0,0,512,512:2'),false);
  const rejected=cache({bytes:100,entries:1});assert.equal(rejected.get(c,'large',image,r,55,55),null);assert.equal(rejected.bytes,0);
});

test('raster153: unavailable canvas and unscaled or unsupported paints retain the original source path',()=>{
  const c=context(),image=source(),memo=cache({canvas:()=>null}),r=[0,0,512,512];
  assert.equal(memo.get(c,'missing',image,r,55,55),null);
  assert.equal(memo.get(c,'full',image,r,512,512),null);
  assert.equal(memo.get(c,'overflow',image,[400,0,512,512],55,55),null);
  assert.equal(memo.get(c,'missing',null,r,55,55),null);
  assert.equal(memo.items.size,0);
});

test('raster153: native immutable sources preserve alpha footprint, colour, transform and live context effects',()=>{
  const image=source(),r=[0,0,512,512],memo=cache(),before=Buffer.from(image.getContext('2d').getImageData(0,0,512,512).data);
  const paint=cached=>{
    const c=context();c.translate(150.37,150.61);c.rotate(.7);c.scale(1.1,.9);c.globalAlpha=.61;c.filter='brightness(.7)';
    const matrix=c.getTransform().toJSON(),filter=c.filter,alpha=c.globalAlpha;
    const s=cached&&memo.get(c,'immutable',image,r,55,55);
    if(s)c.drawImage(s.image,0,0,s.width,s.height,-27.5,-27.5,55,55);else c.drawImage(image,...r,-27.5,-27.5,55,55);
    assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.filter,filter);assert.equal(c.globalAlpha,alpha);
    return c.getImageData(0,0,300,300).data;
  };
  const direct=paint(false),reduced=paint(true);let union=0,intersection=0,sumA=0,sumB=0;
  for(let i=0;i<direct.length;i+=4){const a=direct[i+3]>10,b=reduced[i+3]>10;if(a||b)union++;if(a&&b)intersection++;sumA+=direct[i+3];sumB+=reduced[i+3];}
  assert.ok(intersection/union>.96);assert.ok(Math.abs(sumB/sumA-1)<.02);
  assert.deepEqual(Buffer.from(image.getContext('2d').getImageData(0,0,512,512).data),before);
});

test('raster153: every native actor pose keeps its limbs, alpha mass and measured pivot at horde scale',async()=>{
  const memo=cache(),images={};
  for(const[key,spec]of Object.entries(Art.ASSETS).filter(([key])=>['survivors','infected','infectedExpansion','specialists'].includes(key))){
    const source=await native.loadImage(path.join(__dirname,'..',spec.url)),image=native.createCanvas(source.width,source.height),c=image.getContext('2d');
    c.drawImage(source,0,0);const data=c.getImageData(0,0,image.width,image.height);Art.decodeMatte(data.data,image.width,image.height,spec.matte);c.putImageData(data,0,0);images[key]=image;
  }
  for(const[kind,[key,row]]of Object.entries(Art.ACTORS))for(let frame=0;frame<8;frame++)for(const scale of[.52,1]){
    const image=images[key],rect=Art.frameRect(key,row,frame),size=kind==='crawler'?49:55,side=100;
    const paint=cached=>{
      const c=native.createCanvas(side,side).getContext('2d');c.translate(side/2+.37,side/2+.61);c.rotate(.7);c.scale(scale,scale);
      const r=cached&&memo.get(c,key,image,rect,size,size);
      if(r)c.drawImage(r.image,0,0,r.width,r.height,-size/2,-size/2,size,size);else c.drawImage(image,...rect,-size/2,-size/2,size,size);
      return c.getImageData(0,0,side,side).data;
    };
    const direct=paint(false),reduced=paint(true),mass=p=>{let total=0,x=0,y=0;for(let i=0;i<p.length;i+=4){const alpha=p[i+3];total+=alpha;x+=(i/4%side)*alpha;y+=Math.floor(i/4/side)*alpha;}return{total,x:x/total,y:y/total};},a=mass(direct),b=mass(reduced);
    assert.deepEqual(reduced,direct,kind+'/'+frame+' retains the original native pose pixels');
    assert.ok(Math.abs(b.total/a.total-1)<.05,kind+'/'+frame+' preserves alpha mass');
    assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<.4,kind+'/'+frame+' keeps the pose pivot');
    for(const[from,to]of[[direct,reduced],[reduced,direct]])for(let i=0;i<from.length;i+=4){
      if(from[i+3]<24)continue;const x=i/4%side,y=Math.floor(i/4/side);let near=false;
      for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<side&&y+dy>=0&&y+dy<side&&to[((y+dy)*side+x+dx)*4+3]>=8){near=true;break;}
      assert.ok(near,kind+'/'+frame+' has no omitted limb or new stray silhouette');
    }
  }
});

test('raster153: art integration counts actual paint and reads no gameplay, saved state or RNG',async()=>{
  const previous=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};
  let art;try{art=Art.create();await art.ready;}finally{globalThis.Image=previous;}
  const image=await native.loadImage(path.join(__dirname,'../assets/art149/core-atlas.png'));
  art.images.d17Core149=image;art.renderCache153=cache();
  const c=context(),random=Math.random;Math.random=()=>{throw Error('Painter consumed RNG');};
  try{
    const r=Object.freeze([13,205,488,599]);
    assert.equal(art.blit(c,'d17Core149',r,20,20,80,100),true);
    assert.equal(art.blit(c,'d17Core149',r,30,25,80,100),true);
    assert.equal(art.diagnostics.draws.d17Core149,2);assert.equal(art.renderCache153.stats.hits,1);
    assert.equal(art.blit(c,'notLoaded',r,0,0,80,100),false);
  }finally{Math.random=random;}
});
