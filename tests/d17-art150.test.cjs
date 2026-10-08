'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/d17-art150.js'),A149=require('../src/d17-art149.js'),Art=require('../src/art.js'),C=require('../src/core.js'),Urban=require('../src/urban-art.js');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'assets/art150/PROVENANCE.json'),'utf8'));
const support=(type,extra={})=>{const def=C.BUILDINGS[type],w=def.size[0],h=def.size[1],x=400,y=450;return {id:18,type,def,w,h,x,y,left:x-w*16,top:y-h*16,right:x+w*16,bottom:y+h*16,completed:true,progress:1,dead:false,health:def.health,maxHealth:def.health,powered:true,rotation:0,turretAngle:.6,flash:0,...extra};};
const ctx=()=>createCanvas(1000,1000).getContext('2d');
const recorder=()=>{const calls=[];return {calls,art:{images:Object.fromEntries(Object.keys(A.ASSETS).map(k=>[k,{}])),blit(c,atlas,r,...d){calls.push({atlas,r,d,filter:c.filter,alpha:c.globalAlpha});return true;}}};};

test('150 art: four native original PNGs have exact tracked bytes and decoded dimensions, transparency and loader entries',async()=>{
 assert.equal(meta.images.length,4);assert.equal(meta.spriteCount,20);assert.equal(meta.pixelEdits,false);assert.equal(Object.keys(A.ASSETS).length,4);assert.deepEqual(Object.keys(A.ASSETS).sort(),meta.images.map(item=>item.id).sort());
 for(const item of meta.images){const p=path.join(root,item.runtime),buf=fs.readFileSync(p),im=await loadImage(p),spec=A.ASSETS[item.id];
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(buf[25],6);assert.equal(buf.length,item.bytes);assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),item.sha256);
  assert.equal(im.width,spec.width);assert.equal(im.height,spec.height);assert.equal(Art.ASSETS[item.id],spec);assert.equal(spec.url,item.runtime);assert.equal(spec.matte,'none');assert.equal(item.pixelEdits,false);assert.equal(item.alpha_extrema[0],0);assert.ok(item.alpha_extrema[1]>=254);
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes(item.runtime));
 }
});

test('150 art: every paid catalogue ID has a unique isolated source rectangle and no historical sprite is replaced',()=>{
 assert.deepEqual(Object.keys(A.SPRITES).sort(),Object.keys(C.CityContent150.BUILDINGS).sort());
 for(const [id,s]of Object.entries(A.SPRITES)){const [x,y,w,h]=s.rect,spec=A.ASSETS[s.atlas];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=spec.width&&y+h<=spec.height,id);
  assert.equal(Art.PROCEDURAL_BUILDINGS[id],'CityContent150');assert.equal(A.spriteFor(id),s);assert.equal(A.spriteFor(C.BUILDINGS[id]),s);
  for(const [other,r]of Object.entries(A.SPRITES)){if(other===id||r.atlas!==s.atlas)continue;const [l,t,a,b]=r.rect;assert.ok(x+w<=l||l+a<=x||y+h<=t||t+b<=y,id+' / '+other);}
 }
 assert.equal(A.spriteFor('house'),null);assert.equal(A.spriteFor('constructor'),null);assert.equal(A.spriteFor('__proto__'),null);assert.equal(Art.BUILDINGS.core[0],0);
});

test('150 art: measured gutters contain every significant alpha component and keep all source borders empty',async()=>{
 for(const item of meta.images){const im=await loadImage(path.join(root,item.runtime)),c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);const p=c.getImageData(0,0,im.width,im.height).data,covered=new Uint8Array(im.width*im.height);
  for(const r of Object.values(item.sprites)){const [x,y,w,h]=r;let solid=0;
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const at=row*im.width+col;covered[at]=1;if(p[at*4+3]>8){solid++;assert.ok(col>x&&col<x+w-1&&row>y&&row<y+h-1,'No cropped alpha at border.');}}
   assert.ok(solid>1000,'Real isolated source silhouette.');
  }
  for(let at=0;at<covered.length;at++)if(p[at*4+3]>8)assert.equal(covered[at],1,item.id+' has a source fragment outside the declared cuts.');
 }
});

test('150 art: all twenty actual support shapes keep finite uniform scale and their own footprint in every real rotation',()=>{
 for(const def of Object.values(C.CityContent150.BUILDINGS))for(let rotation=0;rotation<4;rotation++){
  const b=support(def.id,{rotation});if(rotation%2)[b.w,b.h]=[b.h,b.w];b.left=b.x-b.w*16;b.top=b.y-b.h*16;b.right=b.x+b.w*16;b.bottom=b.y+b.h*16;
  const before=JSON.stringify(b),m=A.measure(b),[x,y,w,h]=m.destination;assert.ok(m.destination.every(Number.isFinite));assert.ok(x>=b.left+3-1e-9&&x+w<=b.right-3+1e-9);assert.ok(y>=b.top-m.rise+3-1e-9);assert.ok(Math.abs(y+h-b.bottom+3)<1e-9);assert.ok(Math.abs(w/h-m.source[2]/m.source[3])<1e-9);assert.equal(JSON.stringify(b),before);
 }
 for(const extra of [{x:NaN},{y:Infinity},{w:0},{h:-1}])assert.equal(A.measure(support('casemate150',extra)),null);
});

test('150 art: each completed support actually blits its own PNG cut and real offline states restore caller context',()=>{
 const c=ctx(),r=recorder();c.translate(7,12);c.scale(.6,.6);c.globalAlpha=.4;c.filter='contrast(1.2)';const alpha=c.globalAlpha,matrix=c.getTransform().toJSON(),filter=c.filter;
 for(const def of Object.values(C.CityContent150.BUILDINGS)){const b=support(def.id),before=JSON.stringify(b);assert.equal(A.drawBuilding(c,r.art,b),true);assert.equal(r.calls.at(-1).r,A.SPRITES[def.id].rect);assert.equal(JSON.stringify(b),before);assert.equal(c.globalAlpha,alpha);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.filter,filter);}
 for(const extra of [{powered:false},{siegeOffline:true},{territoryOffline:true},{gridOffline:true}]){assert.equal(A.drawBuilding(c,r.art,support('sterilizationLab150',extra)),true);assert.equal(r.calls.at(-1).filter,'brightness(.50) saturate(.55)');assert.equal(c.filter,filter);}
});

test('150 art: in-progress, destroyed and unknown supports retain their previous painters and paid 149 construction phases',()=>{
 const c=ctx(),r=recorder();
 for(const extra of [{completed:false,progress:.3},{dead:true},{health:0}])assert.equal(A.drawBuilding(c,r.art,support('medicalComplex150',extra)),false);
 assert.equal(A.drawBuilding(c,r.art,support('house')),false);assert.equal(A.drawBuilding(c,{images:{}},support('medicalComplex150')),false);
 const b=support('electricCannery150',{completed:false,progress:.5});assert.equal(A149.eligibleSite(b),true);assert.equal(A149.constructionSprite(b.progress),'frame');
});

test('150 art: missing native sheets keep the catalogue-selected 149 fallback and old solar architecture',()=>{
 const c=ctx(),r=recorder();r.art.images=Object.fromEntries(Object.keys(A149.ASSETS).map(k=>[k,{}]));
 for(const def of Object.values(C.CityContent150.BUILDINGS)){const b=support(def.id);if(!def.sprite149){assert.equal(def.id,'solarPark150');assert.equal(Urban.draw(c,b,{images:{}}),true);continue;}
  const before=JSON.stringify(b);assert.equal(A.drawFallback(c,r.art,b),true);assert.equal(r.calls.at(-1).r,A149.SPRITES[def.sprite149].rect);assert.equal(JSON.stringify(b),before);
 }
 const filter=c.filter;assert.equal(A.drawFallback(c,r.art,support('medicalComplex150',{powered:false})),true);assert.equal(r.calls.at(-1).filter,'brightness(.50) saturate(.55)');assert.equal(c.filter,filter);
});

test('150 art: native batteries render only the exact existing owner charge without filling or saving them',()=>{
 const c=ctx(),r=recorder(),b=support('frontBattery150'),before=JSON.stringify(b),rects=[],fill=c.fillRect.bind(c);c.fillRect=(...args)=>{rects.push(args);return fill(...args);};
 for(const charge of [0,750,1500,3000,-1,NaN]){assert.equal(A.drawBuilding(c,r.art,b,{charge}),true);const bar=rects.at(-1),ratio=Number.isFinite(charge)?Math.max(0,Math.min(1,charge/1500)):0;assert.equal(bar[2],(b.w*32-10)*ratio);assert.equal(JSON.stringify(b),before);}
});

test('150 art: single and twin guns use real aim and actual firing flash only, without changing ammunition or orientation',()=>{
 const c=ctx(),r=recorder(),effects=[];r.art.drawEffect=(...a)=>{effects.push(a);return true;};
 for(const [type,count]of Object.entries(A.GUNS))for(const flash of [0,.06]){const b=support(type,{turretAngle:1.2,flash}),before=JSON.stringify(b),start=effects.length,matrix=c.getTransform().toJSON();
  assert.equal(A.drawGun(c,r.art,b),true);assert.equal(effects.length-start,flash>0?count:0);assert.equal(JSON.stringify(b),before);assert.deepEqual(c.getTransform().toJSON(),matrix);
 }
 assert.equal(A.drawGun(c,r.art,support('aidStation150')),false);assert.equal(A.drawGun(c,r.art,support('casemate150',{completed:false})),false);assert.equal(A.drawGun(c,r.art,support('casemate150',{turretAngle:NaN})),false);
});

test('150 art: final installation overrides the old battery painter once, reads only charge and keeps every historical painter',()=>{
 const c=ctx(),r=recorder(),old=[],reads=[],g={art:{...r.art,drawBuilding(c,b){old.push(b.type);return true;},drawTurret(c,b){old.push('gun:'+b.type);return true;}},powerGrid:{charge(id){reads.push(id);return 375;}}};
 Object.defineProperty(g.powerGrid,'snapshot',{get(){assert.fail('No power snapshot during paint.');}});Object.defineProperty(g,'serialize',{get(){assert.fail('No serialization during paint.');}});
 const api=A.install(g);assert.equal(A.install(g),api);g.art.drawBuilding(c,support('frontBattery150'));assert.deepEqual(reads,[18]);assert.deepEqual(old,[]);
 g.art.drawBuilding(c,support('medicalComplex150'));assert.deepEqual(reads,[18]);g.art.drawBuilding(c,support('house'));assert.deepEqual(old,['house']);g.art.drawTurret(c,support('watchtower'));assert.deepEqual(old,['house','gun:watchtower']);
});
