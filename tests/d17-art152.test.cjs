'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/d17-art152.js'),C=require('../src/core.js');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'assets/art152/PROVENANCE.json'),'utf8'));
const support=(type,extra={})=>{const d=C.BUILDINGS[type],w=d.size[0],h=d.size[1],x=300,y=320;return{id:18,type,def:d,w,h,x,y,left:x-w*16,top:y-h*16,right:x+w*16,bottom:y+h*16,completed:true,progress:1,health:d.health,maxHealth:d.health,dead:false,powered:true,rotation:0,...extra};};
const context=()=>createCanvas(700,700).getContext('2d');
const recorder=()=>{const calls=[];return{calls,images:Object.fromEntries(Object.keys(A.ASSETS).map(id=>[id,{}])),blit(c,atlas,r,...d){calls.push({atlas,r,d,filter:c.filter});return true;}};};

test('152 art: four original native PNGs match provenance bytes, RGBA dimensions and 28 complete paid-support cuts',async()=>{
 assert.equal(meta.images.length,4);assert.equal(meta.spriteCount,28);assert.equal(meta.pixelEdits,false);assert.equal(Object.keys(A.SPRITES).length,28);
 for(const item of meta.images){const file=path.join(root,item.runtime),bytes=fs.readFileSync(file),im=await loadImage(file),s=A.ASSETS[item.id];
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.equal(bytes.length,item.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.deepEqual([im.width,im.height],item.dimensions);assert.equal(im.width,s.width);assert.equal(im.height,s.height);assert.equal(item.pixelEdits,false);assert.equal(item.alpha_extrema[0],0);
  for(const[id,rect]of Object.entries(item.sprites)){assert.ok(Object.hasOwn(C.BUILDINGS,id));assert.deepEqual(A.SPRITES[id],{atlas:item.id,rect});}
 }
});

test('152 art: measured source gutters contain every significant alpha pixel and leave all cut borders empty',async()=>{
 for(const item of meta.images){const im=await loadImage(path.join(root,item.runtime)),c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);const p=c.getImageData(0,0,im.width,im.height).data,covered=new Uint8Array(im.width*im.height);
  for(const r of Object.values(item.sprites)){const[x,y,w,h]=r;assert.ok(x>=0&&y>=0&&x+w<=im.width&&y+h<=im.height);let solid=0;
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const at=row*im.width+col;assert.equal(covered[at],0,'No cut overlaps a neighbouring silhouette.');covered[at]=1;if(p[at*4+3]>8){solid++;assert.ok(row>y&&row<y+h-1&&col>x&&col<x+w-1,'No source edge clips alpha.');}}
   assert.ok(solid>1000,'A real isolated silhouette, not a transparent file.');
  }
  for(let at=0;at<covered.length;at++)if(p[at*4+3]>8)assert.equal(covered[at],1,item.id+' source fragment outside the cuts.');
 }
});

test('152 art: actual support shapes retain uniform scale and real footprints in all four rotations without model changes',()=>{
 for(const id of Object.keys(A.SPRITES))for(let rotation=0;rotation<4;rotation++){const b=support(id,{rotation});if(rotation%2)[b.w,b.h]=[b.h,b.w];b.left=b.x-b.w*16;b.top=b.y-b.h*16;b.right=b.x+b.w*16;b.bottom=b.y+b.h*16;
  const before=JSON.stringify(b),m=A.measure(b),[x,y,w,h]=m.destination;assert.ok(m.destination.every(Number.isFinite));assert.ok(x>=b.left+3-1e-9&&x+w<=b.right-3+1e-9);assert.ok(y>=b.top-m.rise+3-1e-9);assert.ok(Math.abs(y+h-b.bottom+3)<1e-9);assert.ok(Math.abs(w/h-m.source[2]/m.source[3])<1e-9);assert.equal(JSON.stringify(b),before);
 }
 for(const extra of[{x:NaN},{y:Infinity},{w:0},{h:-1}])assert.equal(A.measure(support('fieldKitchen',extra)),null);
 for(const id of['house','constructor','__proto__'])assert.equal(A.spriteFor(id),null);
});

test('152 art: each selected PNG actually renders nontransparent architecture with the installed painter',async()=>{
 const art={images:{},blit(c,key,r,...d){c.drawImage(this.images[key],...r,...d);return true;}};
 for(const[id,s]of Object.entries(A.ASSETS))art.images[id]=await loadImage(path.join(root,s.url));
 for(const id of Object.keys(A.SPRITES)){const c=context(),b=support(id),before=JSON.stringify(b),g={art:{...art,drawBuilding(){assert.fail('A valid native cut fell back.');}},powerGrid:{charge(){return 0;}}};A.install(g);assert.equal(g.art.drawBuilding(c,b),true);
  const p=c.getImageData(0,0,700,700).data;let solid=0;for(let i=3;i<p.length;i+=4)if(p[i]>8)solid++;assert.ok(solid>150,id+' has visible source architecture.');assert.equal(JSON.stringify(b),before);
 }
});

test('152 art: offline states dim original art and restore caller alpha, filter and transform',()=>{
 const c=context(),art=recorder();c.translate(8,13);c.scale(.7,.7);c.globalAlpha=.4;c.filter='contrast(1.2)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter;
 for(const extra of[{powered:false},{siegeOffline:true},{territoryOffline:true},{gridOffline:true},{dayOffline:true}]){const b=support(extra.dayOffline?'dayGreenhouse':'radioRelay',extra),before=JSON.stringify(b);assert.equal(A.drawBuilding(c,art,b),true);assert.equal(art.calls.at(-1).filter,'brightness(.50) saturate(.55)');assert.equal(c.filter,filter);assert.equal(c.globalAlpha,alpha);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(JSON.stringify(b),before);}
});

test('152 art: battery indicators read only their real owner and retain zero, partial, full and clamped charge',()=>{
 const c=context(),art=recorder(),reads=[],old=[],g={art:{...art,drawBuilding(_c,b){old.push(b.type);return true;}},powerGrid:{charge(id){reads.push(id);return currentCharge;}}};let currentCharge=0;
 Object.defineProperty(g.powerGrid,'snapshot',{get(){assert.fail('No snapshot during drawing.');}});Object.defineProperty(g,'serialize',{get(){assert.fail('No save during drawing.');}});const api=A.install(g);assert.equal(A.install(g),api);
 const rects=[],fill=c.fillRect.bind(c);c.fillRect=(...a)=>{rects.push(a);return fill(...a);};
 for(const id of['batteryCabinet','batteryStation','batteryComplex']){const b=support(id),before=JSON.stringify(b),capacity=b.def.battery.capacity;for(const charge of[0,capacity/2,capacity,capacity*2,-1,NaN]){currentCharge=charge;const n=reads.length;g.art.drawBuilding(c,b);assert.equal(reads.length,n+1);const ratio=Number.isFinite(charge)?Math.max(0,Math.min(1,charge/capacity)):0;assert.equal(rects.at(-1)[2],(b.w*32-10)*ratio);assert.equal(JSON.stringify(b),before);}}
 const n=reads.length;g.art.drawBuilding(c,support('batteryCabinet',{completed:false}));assert.equal(reads.length,n);assert.deepEqual(old,['batteryCabinet']);g.art.drawBuilding(c,support('house'));assert.deepEqual(old,['batteryCabinet','house']);
});

test('152 art: lamp direction follows its actual rotation, with no light source or operational state fabricated',()=>{
 const c=context(),art=recorder(),rotations=[],rotate=c.rotate.bind(c);c.rotate=a=>{rotations.push(a);rotate(a);};
 for(const id of['searchlight','districtSearchlight'])for(let rotation=0;rotation<4;rotation++){const b=support(id,{rotation}),before=JSON.stringify(b),matrix=c.getTransform().toJSON();assert.equal(A.drawBuilding(c,art,b),true);assert.equal(rotations.at(-1),rotation*Math.PI/2);assert.equal(JSON.stringify(b),before);assert.deepEqual(c.getTransform().toJSON(),matrix);}
 for(const id of A.LIGHTS){const b=support(id,{powered:false}),before=JSON.stringify(b);assert.equal(A.drawBuilding(c,art,b),true);assert.equal(JSON.stringify(b),before);}
});

test('152 art: missing assets, unfinished or lost supports retain historical painters and paid construction stages',()=>{
 const c=context(),art=recorder(),old=[],g={art:{...art,drawBuilding(_c,b){old.push(b.type);return true;}}};A.install(g);
 for(const extra of[{completed:false,progress:.5},{dead:true},{health:0}])assert.equal(A.drawBuilding(c,art,support('fieldKitchen',extra)),false);
 assert.equal(A.drawBuilding(c,{images:{}},support('fieldKitchen')),false);g.art.images={};assert.equal(g.art.drawBuilding(c,support('fieldKitchen')),true);assert.deepEqual(old,['fieldKitchen']);
});

test('152 art: territory ownership reads its scalar owner once and redoubt barrel retains the actual target heading',()=>{
 const c=context(),art=recorder(),colors=[],fill=c.fillRect.bind(c),reads=[],g={art:{...art,drawBuilding(){return true;}},territories:{presentationStatus(b){reads.push(b.id);return state;}}};let state=null;
 Object.defineProperty(g.territories,'snapshot',{get(){assert.fail('No territory snapshot while drawing.');}});A.install(g);
 c.fillRect=(...args)=>{colors.push({color:c.fillStyle,args});fill(...args);};const b=support('sectorPost'),before=JSON.stringify(b);
 for(state of['held','contested','neutral','lost','evacuated',null]){const n=reads.length;g.art.drawBuilding(c,b);assert.equal(reads.length,n+1);assert.equal(colors.at(-1).color,['held','contested'].includes(state)?'#a6bb92':'#bc9a7b');assert.deepEqual(colors.at(-1).args,[b.x-24,b.y+13,45,7]);assert.equal(JSON.stringify(b),before);}
 const n=reads.length;g.art.drawBuilding(c,support('sectorPost',{completed:false}));g.art.drawBuilding(c,support('house'));assert.equal(reads.length,n);
 const lines=[],line=c.lineTo.bind(c);c.lineTo=(...args)=>{lines.push(args);line(...args);};const matrix=c.getTransform().toJSON();
 for(const turretAngle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const r=support('fallbackRedoubt',{turretAngle}),saved=JSON.stringify(r),m=A.measure(r),x=m.destination[0]+m.destination[2]*163/323,y=m.destination[1]+m.destination[3]*94/340;assert.equal(g.art.drawBuilding(c,r),true);assert.deepEqual(lines.at(-1),[x+Math.cos(turretAngle)*35,y+Math.sin(turretAngle)*35]);assert.equal(JSON.stringify(r),saved);assert.deepEqual(c.getTransform().toJSON(),matrix);}
});

test('152 art: cistern water reads its scalar owner once and retains empty, partial, full and clamped stock indicators',()=>{
 const c=context(),art=recorder(),reads=[],rects=[],fill=c.fillRect.bind(c),g={art:{...art,drawBuilding(){return true;}},siege:{presentationWaterRatio(b){reads.push(b.id);return current;}}};let current=0;
 Object.defineProperty(g.siege,'snapshot',{get(){assert.fail('No tank snapshot during drawing.');}});A.install(g);c.fillRect=(...args)=>{rects.push(args);fill(...args);};const b=support('fireCistern'),saved=JSON.stringify(b);
 for(current of[0,.5,1,2,-1,NaN]){const n=reads.length;assert.equal(g.art.drawBuilding(c,b),true);assert.equal(reads.length,n+1);const ratio=Number.isFinite(current)?Math.max(0,Math.min(1,current)):0;assert.deepEqual(rects.at(-1),[b.x+23,b.y+21-ratio*42,8,ratio*42]);assert.equal(JSON.stringify(b),saved);}
 const n=reads.length;g.art.drawBuilding(c,support('fireCistern',{completed:false}));g.art.drawBuilding(c,support('house'));assert.equal(reads.length,n);
});
