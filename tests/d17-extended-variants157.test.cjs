'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const V=require('../src/d17-extended-variants157.js'),A150=require('../src/d17-art150.js'),A152=require('../src/d17-art152.js'),C=require('../src/core.js');
const root=path.resolve(__dirname,'..'),seed=17117,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashes={d17ExtendedC157:'d416e9a8a0d89bdcd0b2ee521bc39e59e78e3802cec5b69046fe7b65aeba9710',d17ExtendedD157:'eadf0f120a1a61641e205833a4a54e0d7f7f442a5c6cec867ab3d7172da314e3',d17ExtendedE157:'37d12d734cd8a5a6b589a02003736060b923b7ca84f93c86a4903d76af7973c7'};
const owner=type=>Object.hasOwn(A150.SPRITES,type)?A150:A152;
function support(type,extra={}){const def=C.BUILDINGS[type],[w,h]=def.size,x=300,y=300;return{id:0,type,def,w,h,x,y,left:x-w*16,right:x+w*16,top:y-h*16,bottom:y+h*16,completed:true,progress:1,dead:false,health:def.health,maxHealth:def.health,powered:true,rotation:0,turretAngle:.75,flash:0,...extra};}
function selected(type,index){for(let id=0;id<128;id++)if(V.variant(id,seed,type)===index)return support(type,{id});assert.fail('Unreachable image '+type+' / '+index);}
function noRandom(run){const previous=Math.random;Math.random=()=>assert.fail('Simulation RNG consumed by a cosmetic variant');try{return run();}finally{Math.random=previous;}}
let ready;async function artwork(){if(!ready)ready=Promise.all(Object.entries({...A150.ASSETS,...A152.ASSETS,...V.ASSETS}).map(async([key,s])=>[key,await loadImage(path.join(root,s.url))])).then(Object.fromEntries);const images=await ready,calls=[];return{images,calls,blit(c,key,r,...d){calls.push({key,r,d,filter:c.filter});c.drawImage(images[key],...r,...d);return true;}};}
function context(){return createCanvas(600,600).getContext('2d');}

test('157 extended: three byte-preserved RGBA atlases contain 48 complete, unique and separated silhouettes',async()=>{
 const art=await artwork(),pixelHashes=new Set();assert.equal(Object.keys(V.SPRITES).length,48);assert.equal(Object.keys(V.ASSETS).length,3);
 assert.deepEqual(Object.keys(V.SPRITES).sort(),[...Object.keys(A150.SPRITES),...Object.keys(A152.SPRITES)].sort());
 for(const[key,spec]of Object.entries(V.ASSETS)){const buf=fs.readFileSync(path.join(root,spec.url)),im=art.images[key],c=createCanvas(im.width,im.height).getContext('2d');assert.equal(sha(buf),hashes[key]);assert.equal(buf[25],6);assert.deepEqual([im.width,im.height],[spec.width,spec.height]);assert.equal(spec.matte,'none');c.drawImage(im,0,0);
  const data=c.getImageData(0,0,im.width,im.height).data,covered=new Uint8Array(im.width*im.height);let transparent=0,visible=0;
  const sprites=Object.values(V.SPRITES).filter(s=>s.atlas===key);assert.equal(sprites.length,16);
  for(const s of sprites){const[x,y,w,h]=s.rect;assert.ok(x>=0&&y>=0&&x+w<=im.width&&y+h<=im.height);let solid=0;
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const at=row*im.width+col;assert.equal(covered[at],0,'No neighbour enters another cut');covered[at]=1;if(data[at*4+3]>8){solid++;assert.ok(row>y&&row<y+h-1&&col>x&&col<x+w-1,'Complete source has empty alpha borders');}}
   assert.ok(solid>5000,s.family);pixelHashes.add(sha(c.getImageData(x,y,w,h).data));
  }
  for(let at=0;at<covered.length;at++){const alpha=data[at*4+3];if(alpha===0)transparent++;if(alpha>8){visible++;assert.equal(covered[at],1,'No source fragment sits outside its cut');}}
  assert.ok(transparent>im.width*im.height*.2);assert.ok(visible>100000);
 }
 assert.equal(pixelHashes.size,48);
});

test('157 extended: every existing model reaches both drawings without mutating its identity, simulation or save',()=>{
 for(const type of Object.keys(V.SPRITES)){const choices=new Set();for(let id=0;id<128;id++)choices.add(noRandom(()=>V.variant(id,seed,type)));assert.deepEqual([...choices].sort(),[0,1]);
  for(const index of[0,1]){const b=selected(type,index),before=JSON.stringify(b),s=noRandom(()=>V.spriteFor(b,seed));assert.equal(!!s,index===1);assert.strictEqual(V.spriteFor(JSON.parse(before),seed),s);
   for(const rotation of[0,1,2,3])assert.strictEqual(noRandom(()=>V.spriteFor({...b,x:900,y:-900,gx:77,gy:99,rotation,powered:false,charge:0,health:5,generation:8,camera:{x:500,zoom:2}},seed)),s);
   assert.equal(JSON.stringify(b),before);assert.strictEqual(V.select(type,b.id,seed),s);
  }
 }
 assert.equal(V.select('__proto__',5,seed),null);assert.equal(V.select('constructor',5,seed),null);assert.equal(V.spriteFor(null),null);
});

test('157 extended: real installed owners draw both images for all 48 supports in four physical rotations',async()=>{
 const art=await artwork(),g={world:{seed},art:{...art,drawBuilding(){assert.fail('A loaded completed support fell back');},drawTurret(){assert.fail('Known gun fell back');}},powerGrid:{charge(){return 0;}},territories:{presentationStatus(){return 'held';}},siege:{presentationWaterRatio(){return .5;}}};A150.install(g);A152.install(g);
 for(const type of Object.keys(V.SPRITES))for(const index of[0,1])for(let rotation=0;rotation<4;rotation++){
  const b=selected(type,index);b.rotation=rotation;if(rotation%2)[b.w,b.h]=[b.h,b.w];b.left=b.x-b.w*16;b.right=b.x+b.w*16;b.top=b.y-b.h*16;b.bottom=b.y+b.h*16;
  const saved=JSON.stringify(b),a=owner(type),frame=a.measure(b,{seed,art:g.art}),source=index?V.SPRITES[type]:a.SPRITES[type],[x,y,w,h]=frame.destination;
  assert.equal((a===A150?A152:A150).measure(b,{seed,art:g.art}),null,'A shared atlas cannot steal another catalogue owner');
  assert.equal(frame.sprite,source);assert.equal(frame.source,source.rect);assert.ok(frame.destination.every(Number.isFinite));assert.ok(x>=b.left+3-1e-8&&x+w<=b.right-3+1e-8);assert.ok(y>=b.top-frame.rise+3-1e-8);assert.ok(Math.abs(y+h-b.bottom+3)<1e-8);assert.ok(Math.abs(w/h-source.rect[2]/source.rect[3])<1e-8);
  const c=context();c.globalAlpha=.75;c.filter='contrast(1.1)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter;assert.equal(noRandom(()=>g.art.drawBuilding(c,b)),true);
  const call=art.calls.at(-1);assert.equal(call.key,source.atlas);assert.equal(call.r,source.rect);assert.deepEqual(call.d,frame.destination);
  let solid=0;const pixels=c.getImageData(Math.max(0,Math.floor(x)),Math.max(0,Math.floor(y)),Math.min(599-Math.max(0,Math.floor(x)),Math.ceil(w)+2),Math.min(599-Math.max(0,Math.floor(y)),Math.ceil(h)+2)).data;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>8)solid++;
  assert.ok(solid>150,type+' visible '+index+'/'+rotation);assert.equal(JSON.stringify(b),saved);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);
 }
});

test('157 extended: absent new images retain the exact old cut, while a loaded selected alternate needs no old sheet',async()=>{
 const art=await artwork(),c=context();for(const type of Object.keys(V.SPRITES)){const a=owner(type),b=selected(type,1),original=a.SPRITES[type],alternate=V.SPRITES[type],oldOnly={...art,images:{[original.atlas]:art.images[original.atlas]}},newOnly={...art,images:{[alternate.atlas]:art.images[alternate.atlas]}};
  assert.equal(a.measure(b,{seed,art:oldOnly}).source,original.rect);assert.equal(a.drawBuilding(c,oldOnly,b,{seed}),true);assert.equal(a.measure(b,{seed,art:newOnly}).source,alternate.rect);assert.equal(a.drawBuilding(c,newOnly,b,{seed}),true);
  for(const extra of[{completed:false,progress:.5},{dead:true},{health:0}])assert.equal(a.drawBuilding(c,art,{...b,...extra},{seed}),false);assert.equal(a.drawBuilding(c,{images:{}},b,{seed}),false);
 }
});

test('157 extended: all four live guns keep measured alternate pivots, real aim and true single/twin flashes',async()=>{
 const art=await artwork(),c=context(),translations=[],rotations=[],effects=[],translate=c.translate.bind(c),rotate=c.rotate.bind(c);c.translate=(...a)=>{translations.push(a);translate(...a);};c.rotate=a=>{rotations.push(a);rotate(a);};art.drawEffect=(...a)=>effects.push(a);
 for(const[type,count]of Object.entries(A150.GUNS))for(const flash of[0,.07]){const b={...selected(type,1),flash,turretAngle:1.2},saved=JSON.stringify(b),m=A150.measure(b,{seed,art}),pivot=m.sprite.gunPivot,n=effects.length;
  assert.equal(noRandom(()=>A150.drawGun(c,art,b,{seed})),true);assert.deepEqual(translations.at(-1),[m.destination[0]+m.destination[2]*pivot[0],m.destination[1]+m.destination[3]*pivot[1]]);assert.equal(rotations.at(-1),b.turretAngle);assert.equal(effects.length-n,flash>0?count:0);assert.equal(JSON.stringify(b),saved);
 }
 const b=selected('casemate150',1);assert.equal(A150.drawGun(c,{...art,images:{}},b,{seed}),true);assert.deepEqual(translations.at(-1),[b.x,b.y-3],'Missing alternate restores historical gun mount');
});

test('157 extended: utility overlays follow alternate fittings and read real scalar owners exactly once',async()=>{
 const art=await artwork(),c=context(),reads=[],fallback=[],g={world:{seed},art:{...art,drawBuilding(_c,b){fallback.push(b.type);return true;}},powerGrid:{charge(id){reads.push(['charge',id]);return charge;}},siege:{presentationWaterRatio(b){reads.push(['water',b.id]);return water;}},territories:{presentationStatus(b){reads.push(['territory',b.id]);return 'held';}}};let charge=0,water=0;
 for(const service of[g.powerGrid,g.siege,g.territories])Object.defineProperty(service,'snapshot',{get(){assert.fail('Presentation requested a whole simulation snapshot');}});
 A150.install(g);A152.install(g);const rects=[],lines=[],translations=[],rotations=[],fill=c.fillRect.bind(c),line=c.lineTo.bind(c),translate=c.translate.bind(c),rotate=c.rotate.bind(c);c.fillRect=(...a)=>{rects.push(a);fill(...a);};c.lineTo=(...a)=>{lines.push(a);line(...a);};c.translate=(...a)=>{translations.push(a);translate(...a);};c.rotate=a=>{rotations.push(a);rotate(a);};
 for(const type of['frontBattery150','batteryCabinet','batteryStation','batteryComplex']){const b=selected(type,1),saved=JSON.stringify(b);for(charge of[0,b.def.battery.capacity/2,b.def.battery.capacity,b.def.battery.capacity*2,-1,NaN]){const n=reads.length;g.art.drawBuilding(c,b);assert.equal(reads.length,n+1);assert.deepEqual(reads.at(-1),['charge',b.id]);const ratio=Number.isFinite(charge)?Math.max(0,Math.min(1,charge/b.def.battery.capacity)):0;assert.equal(rects.at(-1)[2],(b.w*32-10)*ratio);assert.equal(JSON.stringify(b),saved);}const n=reads.length;g.art.drawBuilding(c,{...b,completed:false});assert.equal(reads.length,n);}
 const tank=selected('fireCistern',1),frame=A152.measure(tank,{seed,art}),[dx,dy,dw,dh]=frame.destination,[gx,gy,gw,gh]=frame.sprite.waterGauge,w=dw*gw,h=dh*gh,inset=Math.min(1,w/4,h/4);
 for(water of[0,.5,1,2,-1,NaN]){const n=reads.length,saved=JSON.stringify(tank);g.art.drawBuilding(c,tank);assert.equal(reads.length,n+1);const ratio=Number.isFinite(water)?Math.max(0,Math.min(1,water)):0;assert.deepEqual(rects.at(-1),[dx+dw*gx+inset,dy+dh*gy+h-inset-ratio*(h-2*inset),w-2*inset,ratio*(h-2*inset)]);assert.equal(JSON.stringify(tank),saved);}
 for(const type of['searchlight','districtSearchlight'])for(let rotation=0;rotation<4;rotation++){const b={...selected(type,1),rotation},m=A152.measure(b,{seed,art}),p=m.sprite.directionPivot;g.art.drawBuilding(c,b);assert.deepEqual(translations.at(-1),[m.destination[0]+m.destination[2]*p[0],m.destination[1]+m.destination[3]*p[1]]);assert.equal(rotations.at(-1),rotation*Math.PI/2);}
 const redoubt=selected('fallbackRedoubt',1),m=A152.measure(redoubt,{seed,art}),p=m.sprite.turretPivot,x=m.destination[0]+m.destination[2]*p[0],y=m.destination[1]+m.destination[3]*p[1];for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){g.art.drawBuilding(c,{...redoubt,turretAngle:angle});assert.deepEqual(lines.at(-1),[x+Math.cos(angle)*35,y+Math.sin(angle)*35]);}
 const post=selected('sectorPost',1),n=reads.length;g.art.drawBuilding(c,post);assert.equal(reads.length,n+1);assert.deepEqual(reads.at(-1),['territory',post.id]);assert.deepEqual(rects.at(-1),[post.x-24,post.y+13,45,7]);
});
