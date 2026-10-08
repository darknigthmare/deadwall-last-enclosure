'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas'),V=require('../src/vehicle-art152.js'),C=require('../src/core.js');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'assets/art152/PROVENANCE_VEHICLES.json'),'utf8')),item=meta.images[0],file=path.join(root,item.runtime);
const art=async()=>({images:{d17Vehicles152:await loadImage(file)},blit(c,key,r,...d){c.drawImage(this.images[key],...r,...d);return true;}});
const ink=c=>{const data=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>8)count++;return count;};

test('152 vehicles: one original native-alpha atlas contains exactly five complete isolated measured profiles',async()=>{
 const bytes=fs.readFileSync(file),image=await loadImage(file);assert.equal(meta.spriteCount,5);assert.equal(meta.pixelEdits,false);assert.equal(item.pixelEdits,false);assert.equal(bytes[25],6);assert.equal(bytes.length,item.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.deepEqual([image.width,image.height],item.dimensions);assert.equal(item.alpha_extrema[0],0);
 const c=createCanvas(image.width,image.height).getContext('2d');c.drawImage(image,0,0);const p=c.getImageData(0,0,image.width,image.height).data,covered=new Uint8Array(image.width*image.height);
 for(const[id,sprite]of Object.entries(V.SPRITES)){assert.ok(C.WorldEvolution.RULES.vehicles[id]);assert.deepEqual(sprite.rect,item.sprites[id]);const[x,y,w,h]=sprite.rect;assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height);let visible=0;
  for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const at=row*image.width+col;assert.equal(covered[at],0,'Separate cuts never overlap.');covered[at]=1;if(p[at*4+3]>8){visible++;assert.ok(col>x&&col<x+w-1&&row>y&&row<y+h-1,'Complete wheels and frame retain empty border.');}}
  assert.ok(visible>1000);
 }
 for(let at=0;at<covered.length;at++)if(p[at*4+3]>8)assert.equal(covered[at],1,'No stray significant source fragment.');
});

test('152 vehicles: the five regional and local physical rectangles retain aspect, centre and caller rotations',async()=>{
 const a=await art();for(const type of Object.keys(V.SPRITES)){const p=C.WorldEvolution.RULES.vehicles[type],before=JSON.stringify(p);
  for(const factor of[1,44/4.6]){const w=p.w*factor,h=p.h*factor,m=V.measure(type,w,h),[x,y,dw,dh]=m.destination;assert.ok(dw<=w+1e-9&&dh<=h+1e-9);assert.equal(x,-dw/2);assert.equal(y,-dh/2);assert.ok(Math.abs(dw/dh-m.source[2]/m.source[3])<1e-9);
   for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const c=createCanvas(600,600).getContext('2d');c.translate(300,300);c.rotate(angle);c.scale(60/factor,60/factor);const matrix=c.getTransform().toJSON();assert.equal(V.drawVehicle(c,a,type,w,h,{hp:p.health}),true);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.ok(ink(c)>50);}
  }assert.equal(JSON.stringify(p),before);
 }
});

test('152 vehicles: real closed, opened, dismantled, exhausted, wrecked and active states paint distinct cues without owner mutation',async()=>{
 const a=await art(),hashes=[];for(const state of[{}, {opened:true}, {dismantled:true}, {dismantled:true,exhausted:true}, {hp:0}, {active:true}]){
  const c=createCanvas(400,220).getContext('2d'),p=C.WorldEvolution.RULES.vehicles.break,owned={hp:p.health,...state},before=JSON.stringify(owned);c.translate(200,110);c.scale(55,55);c.globalAlpha=.8;c.filter='contrast(1.1)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter;
  assert.equal(V.drawVehicle(c,a,'break',p.w,p.h,owned),true);assert.equal(JSON.stringify(owned),before);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);assert.deepEqual(c.getTransform().toJSON(),matrix);hashes.push(crypto.createHash('sha256').update(c.getImageData(0,0,400,220).data).digest('hex'));
 }assert.equal(new Set(hashes).size,hashes.length);
 // Human powered profiles receive no invented headlamp, cargo hatch or engine hood.
 for(const type of['skate','bike']){const p=C.WorldEvolution.RULES.vehicles[type],render=state=>{const c=createCanvas(400,220).getContext('2d');c.translate(200,110);c.scale(90,90);V.drawVehicle(c,a,type,p.w,p.h,{hp:p.health,...state});return Buffer.from(c.getImageData(0,0,400,220).data);};assert.deepEqual(render({}),render({active:true,opened:true,dismantled:true,exhausted:true}));}
});

test('152 vehicles: absent native art and all historical profiles preserve the existing fallback route',()=>{
 const c=createCanvas(400,220).getContext('2d');for(const type of['bus','truck','van','buggy','constructor','__proto__'])assert.equal(V.drawVehicle(c,{images:{d17Vehicles152:{}}},type,4.6,1.85),false);
 for(const type of Object.keys(V.SPRITES)){const p=C.WorldEvolution.RULES.vehicles[type];assert.equal(V.drawVehicle(c,{images:{}},type,p.w,p.h),false);for(const[w,h]of[[NaN,1],[1,Infinity],[0,1],[1,-1]])assert.equal(V.measure(type,w,h),null);}
 assert.equal(ink(c),0);
});
