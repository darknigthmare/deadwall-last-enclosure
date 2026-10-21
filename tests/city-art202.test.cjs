'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const C=require('../src/core.js'),V=require('../src/building-variants157.js'),A149=require('../src/d17-art149.js'),A150=require('../src/d17-art150.js'),A152=require('../src/d17-art152.js'),Interior=require('../src/interior-art153.js');
const support=(type,{rotation=0,id=18,revision=1,...extra}={})=>{
 const def=C.CityGeometry202.definition(type,revision),[w,h]=rotation%2?[def.size[1],def.size[0]]:def.size,x=1000,y=1280;
 return{id,type,def,geometryVersion202:revision,w,h,x,y,left:x-w*16,top:y-h*16,right:x+w*16,bottom:y+h*16,rotation,completed:true,progress:1,dead:false,health:def.health,maxHealth:def.health,powered:true,turretAngle:.6,flash:0,...extra};
};
const context=()=>createCanvas(2048,2048).getContext('2d');
const digest=c=>crypto.createHash('sha256').update(c.getImageData(0,0,c.canvas.width,c.canvas.height).data).digest('hex');
const blankArt=()=>({images:{},blit(){assert.fail('Metric buildings must not stretch an old silhouette into the physical footprint.');}});
let nativeArt;
async function textures(){
 if(nativeArt)return nativeArt;
 const keys=['habitatResidential153','habitatServices153','habitatRoofs157'],images={};
 for(const key of keys)images[key]=await loadImage(path.join(__dirname,'..',Interior.ASSETS[key].url));
 return nativeArt={images,blit(c,key,rect,...destination){c.drawImage(images[key],...rect,...destination);return true;}};
}

test('202 city art: every paid body uses exactly the authoritative metre footprint in all quarter turns',()=>{
 const units=C.Frontier.RULES.metreUnits;assert.equal(units,32);
 for(const type of Object.keys(C.CityGeometry202.sizes))for(let rotation=0;rotation<4;rotation++){
  const b=support(type,{rotation}),before=JSON.stringify(b),f=V.metricFrame202(b,{seed:17117});
  assert.ok(f,type);assert.deepEqual(f.ground,{x:b.left,y:b.top,w:b.w*units,h:b.h*units},type);
  assert.deepEqual(f.destination,[b.left,b.top-f.rise,b.w*units,b.h*units],type);assert.deepEqual(f.contact,[b.x,b.bottom]);
  assert.equal(f.angle,0,'Gravity never rotates with the roof plan.');assert.equal(f.rotation,rotation);
  assert.equal(f.door.w,32,'A one metre entrance exceeds the player physical diameter of26units.');assert.equal(f.door.h,33.6);
  assert.equal(f.rise,['crops','solar','yard'].includes(f.profile.kind)?0:(b.def.floors||1)*48,type);
  assert.equal(JSON.stringify(b),before);
 }
 const tower=V.metricFrame202(support('megaTower'));assert.equal(tower.floors,20);assert.equal(tower.rise,960);assert.ok(tower.bounds.y<support('megaTower').top-900);
});

test('202 city art: native texture pixels stay inside projected bounds in all rotations, including the highest tower',async()=>{
 const art=await textures(),c=context();let roofDraws=0;const blit=art.blit;
 const counted={images:art.images,blit(...args){roofDraws++;return blit(...args);}};
 for(const type of ['house','warehouse','apartment','megaTower'])for(let rotation=0;rotation<4;rotation++){
  c.clearRect(0,0,2048,2048);const b=support(type,{rotation}),f=V.metricFrame202(b,{seed:17117}),before=JSON.stringify(b);
  assert.equal(V.drawMetricBuilding202(c,counted,b,{seed:17117}),true);const pixels=c.getImageData(0,0,2048,2048).data;let opaque=0;
  for(let y=0;y<2048;y++)for(let x=0;x<2048;x++)if(pixels[(y*2048+x)*4+3]>8){
   opaque++;assert.ok(x>=Math.floor(f.bounds.x)-1&&x<=Math.ceil(f.bounds.x+f.bounds.w)+1,type+' lateral bound');
   assert.ok(y>=Math.floor(f.bounds.y)-1&&y<=Math.ceil(f.bounds.y+f.bounds.h)+1,type+' vertical bound');
  }
  assert.ok(opaque>b.w*b.h*500,type+' has a real roof and facade, rather than a miniature in an empty support.');assert.equal(JSON.stringify(b),before);
 }
 assert.ok(roofDraws>=16,'Real native roof textures are used, with a measured plan clip.');
});

test('202 city art: four stable identities create visibly different roof forms without RNG or source assets',()=>{
 const c=context(),hashes=new Set(),originalRandom=Math.random;Math.random=()=>assert.fail('No simulation or ambient RNG while painting.');
 try{for(let id=100;id<104;id++){
  const b=support('house',{id}),before=JSON.stringify(b),f=V.metricFrame202(b,{seed:17117});c.clearRect(0,0,2048,2048);
  assert.equal(V.drawMetricBuilding202(c,blankArt(),b,{seed:17117}),true);hashes.add(digest(c));assert.equal(JSON.stringify(b),before);
  assert.deepEqual(V.metricFrame202(b,{seed:17117}),f);
 }}finally{Math.random=originalRandom;}
 assert.equal(hashes.size,4,'The forms differ through roof geometry, not just atlas labels.');
});

test('202 city art: quarter turns move the one metre entrance to the real side without a false south door',()=>{
 const c=context(),rects=[],fill=c.fillRect.bind(c);c.fillRect=(...r)=>{rects.push({r,color:c.fillStyle});return fill(...r);};
 for(let rotation=0;rotation<4;rotation++){
  const b=support('restShelter',{rotation}),f=V.metricFrame202(b),point=rotation===0?{x:b.x,y:b.bottom}:rotation===1?{x:b.left,y:b.y}:rotation===2?{x:b.x,y:b.top}:{x:b.right,y:b.y};
  assert.deepEqual(f.door.ground,point);assert.equal(f.door.side,['south','west','north','east'][rotation]);assert.equal(f.door.visibleFacade,rotation===0);
  assert.equal(f.door.w,32);assert.equal(f.door.h,33.6);rects.length=0;V.drawMetricBuilding202(c,blankArt(),b);
  const door=rects.filter(q=>q.color==='#28372e');assert.equal(door.length,rotation===0?1:0,'A hidden entrance does not become a second south door.');
  const threshold=rects.find(q=>q.color==='#9b957e');assert.equal(!!threshold,rotation!==2,'The north threshold stays occluded by the volume.');
  if(threshold&&rotation%2){assert.equal(threshold.r[1],point.y-16);assert.equal(threshold.r[3],32);assert.equal(threshold.r[0],point.x-(rotation===1?f.wall:0));}
 }
});

test('202 city art: every completed150/152 support and every urban149 family renders without its former atlas',()=>{
 const c=context(),art=blankArt();c.translate(17,21);c.scale(.4,.4);c.globalAlpha=.43;c.filter='contrast(1.2)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter;
 for(const type of [...Object.keys(A150.SPRITES),...Object.keys(A152.SPRITES),...Object.keys(C.Urban.BUILDINGS),'core']){
  const b=support(type),before=JSON.stringify(b);let drawn;
  if(A150.spriteFor(type))drawn=A150.drawBuilding(c,art,b,{seed:17117});
  else if(A152.spriteFor(type))drawn=A152.drawBuilding(c,art,b,{seed:17117});
  else if(type==='core')drawn=A149.drawCore(c,art,b,10,{seed:17117});
  else if(A149.urbanSprite(b.def))drawn=A149.drawUrban(c,art,b,{seed:17117});else continue;
  assert.equal(drawn,true,type);assert.equal(JSON.stringify(b),before,type);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);
 }
 assert.equal(V.metricFrame202(support('fireScreen')).profile.kind,'wall');assert.equal(V.metricFrame202(support('turret')).profile.kind,'platform');
});

test('202 city art: charge, water, sector state, real gun aim and directed light remain owned overlays',()=>{
 const c=context(),art=blankArt(),rects=[],translations=[],rotations=[],fill=c.fillRect.bind(c),translate=c.translate.bind(c),rotate=c.rotate.bind(c);
 c.fillRect=(...r)=>{rects.push({r,color:c.fillStyle});return fill(...r);};c.translate=(...xy)=>{translations.push(xy);return translate(...xy);};c.rotate=angle=>{rotations.push(angle);return rotate(angle);};
 for(const type of ['frontBattery150','batteryStation']){
  const b=support(type),before=JSON.stringify(b),owner=type==='frontBattery150'?A150:A152;
  for(const ratio of [0,.5,1]){owner.drawBuilding(c,art,b,{charge:b.def.battery.capacity*ratio});assert.equal(rects.at(-1).r[2],(b.w*32-10)*ratio);}
  assert.equal(JSON.stringify(b),before);
 }
 const tank=support('fireCistern'),f=V.metricFrame202(tank);A152.drawBuilding(c,art,tank,{waterRatio:.5});const water=rects.at(-1).r;
 assert.ok(water[0]>=f.destination[0]&&water[0]+water[2]<=f.destination[0]+f.destination[2]);assert.ok(water[3]>0);
 for(const type of ['casemate150','twinGun150','watchtower','turret','heavyTurret']){
  const b=support(type),m=V.metricFrame202(b);translations.length=0;rotations.length=0;assert.equal(A150.drawGun(c,art,b),true);
  assert.deepEqual(translations[0],[b.x,b.y-m.rise]);assert.equal(rotations[0],b.turretAngle);
 }
 const light=support('searchlight',{rotation:3});translations.length=0;rotations.length=0;A152.drawLightState(c,light,V.metricFrame202(light));
 assert.deepEqual(translations[0],[light.x,light.y-V.metricFrame202(light).rise]);assert.equal(rotations[0],Math.PI*1.5);
 const post=support('sectorPost');A152.drawTerritoryState(c,post,'held',V.metricFrame202(post));assert.equal(rects.at(-1).color,'#a6bb92');
 const redoubt=support('fallbackRedoubt'),before=JSON.stringify(redoubt);A152.drawTerritoryState(c,redoubt,null,V.metricFrame202(redoubt));assert.equal(JSON.stringify(redoubt),before);
});

test('202 city art: the installed metric painters read existing owners once even when native sheets are absent',()=>{
 const c=context(),reads=[],g={world:{seed:17117},art:{...blankArt(),drawBuilding(){assert.fail('The metric renderer should handle its paid type.');},drawTurret(){return false;}},powerGrid:{charge(id){reads.push(['charge',id]);return 400;}},territories:{presentationStatus(b){reads.push(['sector',b.id]);return'held';}},siege:{presentationWaterRatio(b){reads.push(['water',b.id]);return.5;}}};
 A150.install(g);A152.install(g);
 for(const type of ['frontBattery150','batteryStation','sectorPost','fireCistern'])assert.equal(g.art.drawBuilding(c,support(type)),true);
 assert.deepEqual(reads,[['charge',18],['charge',18],['sector',18],['water',18]]);
});

test('202 city art: three paid construction stages remain incomplete and preserve exact progress bars',()=>{
 const c=context(),hashes=new Set(),rects=[],fill=c.fillRect.bind(c);c.fillRect=(...r)=>{rects.push(r);return fill(...r);};
 for(const progress of [.1,.5,.9]){
  c.clearRect(0,0,2048,2048);const b=support('house',{completed:false,progress}),before=JSON.stringify(b);
  assert.equal(A149.drawConstruction(c,blankArt(),b),true);hashes.add(digest(c));assert.equal(JSON.stringify(b),before);
  assert.equal(rects.at(-1)[2],b.w*32*progress);assert.equal(V.drawBuilding(c,blankArt(),b,{seed:17117}),false);
 }
 assert.equal(hashes.size,3);
});

test('202 city art: historical campaigns retain their source aspect, fit, contact and missing-image fallback',()=>{
 const c=context(),b=support('house',{revision:0});delete b.geometryVersion202;
 const s=V.spriteFor(b),f=V.measure(b),scale=Math.min((b.w*32-6)/s.rect[2],(b.h*32+12)/s.rect[3]);
 assert.equal(V.metricFrame202(b),null);assert.deepEqual(f.destination,[-s.rect[2]*scale/2,b.h*16-3-s.rect[3]*scale,s.rect[2]*scale,s.rect[3]*scale]);
 assert.equal(V.drawBuilding(c,{images:{}},b),false);assert.equal(A149.drawCore(c,{images:{}},support('core',{revision:0})),false);
 assert.equal(A150.drawBuilding(c,{images:{}},support('casemate150',{revision:0})),false);assert.equal(A152.drawBuilding(c,{images:{}},support('fireCistern',{revision:0})),false);
});
