'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/art.js');

async function decoded(atlas){
  const spec=A.ASSETS[atlas],image=await loadImage(path.join(__dirname,'..',spec.url));
  const canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');c.drawImage(image,0,0);
  const data=c.getImageData(0,0,image.width,image.height);A.decodeMatte(data.data,image.width,image.height,spec.matte);c.putImageData(data,0,0);
  return {canvas,pixels:data.data,width:image.width,height:image.height};
}

function components(pixels,width,height){
  const labels=new Int32Array(width*height),queue=new Int32Array(labels.length),parts=[];
  for(let at=0;at<labels.length;at++){
    if(labels[at]||pixels[at*4+3]<48)continue;
    const id=parts.length+1;let head=0,tail=1,sumX=0,sumY=0,left=width,right=0;labels[at]=id;queue[0]=at;
    const visit=n=>{if(n<0||n>=labels.length||labels[n]||pixels[n*4+3]<48)return;labels[n]=id;queue[tail++]=n;};
    while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);sumX+=x;sumY+=y;left=Math.min(left,x);right=Math.max(right,x);if(x)visit(p-1);if(x+1<width)visit(p+1);visit(p-width);visit(p+width);}
    parts.push({id,pixels:tail,left,right,row:Math.floor(sumY/tail/(height/4)),frame:Math.floor(sumX/tail/(width/8))});
  }
  return {labels,parts};
}

test('crops154: every corrected pose contains its entire native body and weapon, without a neighbouring silhouette',async()=>{
  let recovered=0;
  for(const [key,cuts]of Object.entries(A.ACTOR_FRAME_CUTS154)){
    const [atlas,rowText]=key.split(':'),row=Number(rowText),{pixels,width,height}=await decoded(atlas),{labels,parts}=components(pixels,width,height);
    const main=new Map(parts.filter(p=>p.pixels>500).map(p=>[p.id,p]));assert.equal(main.size,32,'Every atlas has 32 separate complete native silhouettes.');
    const rowParts=[...main.values()].filter(p=>p.row===row).sort((a,b)=>a.frame-b.frame);
    const edges=[0,...rowParts.slice(0,7).map((p,i)=>Math.round((p.right+rowParts[i+1].left)/2)),width];
    for(let frame=0;frame<8;frame++){
      const own=[...main.values()].find(p=>p.row===row&&p.frame===frame),r=cuts[frame],nominal=A.frameRect(atlas,row,frame),[x,y,w,h]=r;
      assert.ok(own);assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);assert.ok(Object.isFrozen(r));let included=0,lostBefore=0;
      for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
        const at=yy*width+xx,id=labels[at];
        if(main.has(id))assert.equal(id,own.id,key+'/'+frame+' cannot include a neighbouring body, hand or gun');
        if(id===own.id){included++;if(xx<nominal[0]||xx>=nominal[0]+nominal[2]||yy<nominal[1]||yy>=nominal[1]+nominal[3])lostBefore++;}
        if(pixels[at*4+3]>8)assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1,key+'/'+frame+' retains transparent gutters');
      }
      // The muzzle is sometimes a separate alpha component. Retain every visible
      // pixel up to the empty gap between bodies, rather than only the large body.
      for(let yy=nominal[1];yy<nominal[1]+nominal[3];yy++)for(let xx=edges[frame];xx<edges[frame+1];xx++){
        if(pixels[(yy*width+xx)*4+3]>8)assert.ok(xx>=x&&xx<x+w&&yy>=y&&yy<y+h,key+'/'+frame+' includes detached original muzzle pixels');
      }
      assert.equal(included,own.pixels,key+'/'+frame+' captures every original connected body/weapon pixel');recovered+=lostBefore;
    }
  }
  assert.ok(recovered>40,'The corrected cuts recover real finger and muzzle pixels outside old cells.');
});

test('crops154: native scale and pelvis pivot survive cropping, rotations, reflections and reduced motion',async()=>{
  const savedImage=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};
  let art;try{art=A.create();await art.ready;}finally{globalThis.Image=savedImage;}
  const ctx=createCanvas(180,180).getContext('2d'),calls=[];ctx.scale(-1,1);
  art.blit=(_c,atlas,source,...destination)=>{calls.push({atlas,source,destination});return true;};
  for(const atlas of ['infected','specialists'])art.images[atlas]=(await decoded(atlas)).canvas;
  for(const kind of ['crawler','soldierAlt'])for(let frame=0;frame<8;frame++)for(const facing of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const spec=A.ACTORS[kind],size=kind==='crawler'?49:55,nominal=A.frameRect(spec[0],spec[1],frame),actor=Object.freeze({id:0,x:90,y:90,facing,visualMoving:true});
    const before=ctx.getTransform().toJSON();assert.equal(art.drawActor(ctx,actor,kind,(frame+.1)/9,false,false),true);
    const draw=calls.at(-1),[dx,dy,w,h]=draw.destination;
    assert.deepEqual(draw.source,A.actorFrameRect(spec[0],spec[1],frame));
    assert.ok(Math.abs(w/draw.source[2]-size/nominal[2])<1e-12);assert.ok(Math.abs(h/draw.source[3]-size/nominal[3])<1e-12);
    assert.ok(Math.abs(dx+(nominal[0]+nominal[2]/2-draw.source[0])*size/nominal[2])<1e-12);
    assert.ok(Math.abs(dy+(nominal[1]+nominal[3]/2-draw.source[1])*size/nominal[3])<1e-12);
    assert.deepEqual(ctx.getTransform().toJSON(),before);
    assert.equal(art.drawActor(ctx,actor,kind,4,true,false),true);assert.deepEqual(calls.at(-1).source,A.actorFrameRect(spec[0],spec[1],0));
  }
});

test('crops154: other original rows and raster-cache actor exclusions retain their historical source path',()=>{
  const cache=require('../src/render-cache153.js');
  for(const atlas of ['survivors','infected','infectedExpansion','specialists'])for(let row=0;row<4;row++)for(let frame=0;frame<8;frame++){
    if(Object.hasOwn(A.ACTOR_FRAME_CUTS154,atlas+':'+row))continue;
    assert.deepEqual(A.actorFrameRect(atlas,row,frame),A.frameRect(atlas,row,frame));
  }
  assert.deepEqual(cache.NATIVE_ACTORS,['survivors','infected','infectedExpansion','specialists']);
});
