'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas'),C=require('../src/core.js'),Art=require('../src/art.js'),I=require('../src/interior-art153.js'),F=require('../src/fieldcraft.js');
const context=()=>createCanvas(1200,1000).getContext('2d'),hash=c=>crypto.createHash('sha256').update(c.getImageData(0,0,1200,1000).data).digest('hex');
function node(kind,extra={}){const[w,h]=C.CityGeometry202.sceneryMetres[kind].map(n=>n*32);return{id:'object:'+kind,type:C.SCENERY_DEFS[kind]?.resource||'scrap',sceneryKind:kind,x:600,y:550,metric202:1,body202:{w,h},renderSize:Math.max(w,h),radius:25,amount:40,maxAmount:40,flash:0,...extra};}
function resource(variant,type='scrap'){const profile=C.WorldEvolution.RULES.vehicles[type==='fuel'?'break':['','break','van','truck'][variant]],w=profile.w*32,h=profile.h*32;return{id:'vehicle:'+type+variant,type,variant,x:600,y:550,metric202:1,body202:{w,h},radius:22,amount:20,maxAmount:20,flash:0};}
let nativeArt;
async function textures(){if(nativeArt)return nativeArt;const images={},calls=[];for(const key of['habitatResidential153','habitatServices153','habitatRoofs157','habitatRuins153','interiorSurfaces153','art158Vehicles','art158HeavyVehicles','art139Bus','art139Truck','art140Van','worldPropsScenery153','worldPropsResources153','art138RoofMetal','art138InteriorConcrete'])images[key]=await loadImage(path.join(__dirname,'..',Art.ASSETS[key].url));
 const source=await loadImage(path.join(__dirname,'..',Art.ASSETS.props.url)),canvas=createCanvas(source.width,source.height),c=canvas.getContext('2d');c.drawImage(source,0,0);const rgba=c.getImageData(0,0,source.width,source.height);Art.decodeMatte(rgba.data,source.width,source.height,'magenta');c.putImageData(rgba,0,0);images.props=canvas;
 return nativeArt={images,calls,blit(c,key,r,...d){calls.push({key,r,d,matrix:c.getTransform().toJSON()});c.drawImage(images[key],...r,...d);return true;}};}
function noLoadArt(){const previous=globalThis.Image;globalThis.Image=class{set src(value){this.onerror?.();}};try{return Art.create();}finally{globalThis.Image=previous;}}

test('202 scenery: the physical plan is exactly the shared fieldcraft rectangle for every scenery and natural vehicle',()=>{
 for(const n of[...Object.keys(C.CityGeometry202.sceneryMetres).map(kind=>node(kind)),resource(1),resource(2),resource(3),resource(1,'fuel')]){
  const before=JSON.stringify(n),q=F.rect(n),f=Art.metricSceneryFrame202(n,{seed:17117,rect:q});assert.ok(f,n.sceneryKind||n.id);assert.deepEqual(f.body,q);assert.equal(f.w,n.body202.w);assert.equal(f.h,n.body202.h);
  assert.equal(F.collides(n,n.x,n.y,0),true);assert.equal(F.collides(n,q.r+1,n.y,0),false);assert.equal(F.collides(n,n.x,q.b+1,0),false);assert.equal(JSON.stringify(n),before);
  assert.equal(Art.metricSceneryFrame202(n,{rect:{...q,r:q.r+1}}),null,'Stale or unrelated collider dimensions cannot become an artwork footprint.');
 }
 assert.deepEqual(Art.metricSceneryFrame202(node('ruinedHouse')).body,{l:440,t:422,r:760,b:678});
 for(const kind of['bus','ambulance','utilityTruck','tanker']){const f=Art.metricSceneryFrame202(node(kind));assert.ok(f.w>f.h*2,'Vehicles retain a horizontal physical plan.');}
});

test('202 scenery: every metric object renders a substantial mass inside its actual projected bounds',async()=>{
 const art=await textures(),c=context();
 for(const n of[...Object.keys(C.CityGeometry202.sceneryMetres).map(kind=>node(kind)),resource(1),resource(2),resource(3),resource(1,'fuel')]){
  c.clearRect(0,0,1200,1000);const f=Art.metricSceneryFrame202(n),before=JSON.stringify(n);assert.equal(Art.drawMetricScenery202(c,art,n,{seed:17117,rect:F.rect(n)}),true);
  const pixels=c.getImageData(0,0,1200,1000).data;let opaque=0;
  for(let y=0;y<1000;y++)for(let x=0;x<1200;x++)if(pixels[(y*1200+x)*4+3]>8){opaque++;assert.ok(x>=Math.floor(f.bounds.x)&&x<=Math.ceil(f.bounds.x+f.bounds.w));assert.ok(y>=Math.floor(f.bounds.y)&&y<=Math.ceil(f.bounds.y+f.bounds.h));}
  assert.ok(opaque>f.w*f.h*.35,(n.sceneryKind||n.id)+' fills a physical object rather than a tiny icon.');assert.equal(JSON.stringify(n),before);
 }
});

test('202 scenery: ruined buildings use native roof fragments and at most three metre wall details',async()=>{
 const art=await textures(),c=context();
 for(const kind of['ruinedHouse','ruinedShop','warehouseShell']){
  art.calls.length=0;const n=node(kind),f=Art.metricSceneryFrame202(n);Art.drawMetricScenery202(c,art,n,{seed:17117});
  const roofs=art.calls.filter(q=>q.key.startsWith('habitat')&&q.key!=='habitatRuins153'),details=art.calls.filter(q=>q.key==='habitatRuins153');
  assert.ok(roofs.length>=2,kind+' has separately clipped roof fragments.');assert.equal(details.length,1);
  assert.ok(details[0].d[2]<=96&&details[0].d[3]<=96,'A perspective source is a small debris detail, never an inferred building footprint.');
  assert.ok(Math.abs(details[0].d[2]/details[0].d[3]-details[0].r[2]/details[0].r[3])<1e-9,'Small source fragments preserve their native proportions.');
  assert.ok(I.RUINS[kind].every(s=>details[0].r[2]<s.rect[2]*.5&&details[0].r[3]<s.rect[3]*.5),'Only cropped rubble is used: a complete mini house cannot stand on this floor.');
  assert.equal(f.doorWidth,32);assert.equal(f.doorHeight,33.6);assert.equal(f.w,kind==='ruinedHouse'?320:384);assert.equal(f.rise,48);
 }
});

test('202 scenery: the browser floor-material path paints a clipped native pattern at a metre-based pitch',async()=>{
 const art=await textures(),c=context(),previous=globalThis.OffscreenCanvas;let patterns=0;const pattern=c.createPattern.bind(c);c.createPattern=(...args)=>{patterns++;return pattern(...args);};
 globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
 try{for(const kind of['ruinedHouse','ruinedShop','warehouseShell'])assert.equal(Art.drawMetricScenery202(c,art,node(kind),{seed:42}),true);}finally{if(previous===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=previous;}
 assert.equal(patterns,3,'House planks, shop tiles and warehouse concrete retain separate native floor materials.');
});

test('202 scenery: identity and seed change visible damage and paint while repeated renders are stable and RNG free',()=>{
 const c=context(),art={images:{}},hashes=new Set(),beforeRandom=Math.random;Math.random=()=>assert.fail('Painting must not draw random numbers.');
 try{for(const seed of[17117,42])for(let id=1;id<=8;id++){
  const n=node('ambulance',{id}),before=JSON.stringify(n);c.clearRect(0,0,1200,1000);Art.drawMetricScenery202(c,art,n,{seed});const first=hash(c);hashes.add(first);
  c.clearRect(0,0,1200,1000);Art.drawMetricScenery202(c,art,n,{seed});assert.equal(hash(c),first);assert.equal(JSON.stringify(n),before);
 }}finally{Math.random=beforeRandom;}assert.equal(hashes.size,4,'Four actual paint and damage plans remain visibly distinct.');
});

test('202 scenery: resource depletion and interaction flash preserve transform, filter, alpha and owner data',async()=>{
 const c=context(),art=await textures();c.translate(13,17);c.scale(.7,.7);c.globalAlpha=.43;c.filter='contrast(1.2)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter,hashes=new Set();
 for(const extra of[{amount:40,flash:0},{amount:10,flash:0},{amount:0,flash:0},{amount:40,flash:.1}]){
  const n=node('ruinedHouse',extra),before=JSON.stringify(n);c.clearRect(-100,-100,2000,2000);assert.equal(Art.drawMetricScenery202(c,art,n,{seed:42}),true);hashes.add(hash(c));
  assert.equal(JSON.stringify(n),before);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);
 }assert.equal(hashes.size,3,'Partial and exhausted scenery share the historical minimum alpha; interaction flash remains distinct.');
});

test('202 scenery: the shipped Art routes scenery and natural wrecks before miniature atlas painters',()=>{
 const a=noLoadArt(),c=context(),game={world:{seed:17117},fieldcraft:{rect:F.rect}};
 for(const n of[node('ruinedHouse'),node('bus'),node('container'),resource(1),resource(2),resource(3),resource(1,'fuel')])assert.equal(a.drawNode(c,n,game),true,n.sceneryKind||n.id);
 assert.equal(a.drawWorldNode153(c,node('ruinedShop'),42,F.rect(node('ruinedShop'))),true);
 const legacy=node('ruinedHouse');delete legacy.metric202;assert.equal(a.drawWorldNode153(c,legacy,42,F.rect(legacy)),false);assert.equal(a.drawNode(c,legacy,game),false,'Missing legacy images retain their existing fallback.');
 for(const extra of[{metric202:0},{body202:{w:0,h:20}},{body202:{w:20,h:NaN}},{x:Infinity}])assert.equal(Art.drawMetricScenery202(c,a,node('bus',extra)),false);
 assert.equal(Art.drawMetricScenery202(c,a,{...node('rubble'),sceneryKind:'burntTree'}),false,'Existing botanical morphology remains with Nature153.');
});

test('202 scenery: painted orthographic vehicles retain the exact body and rotate only reviewed vertical source plans',async()=>{
 const art=await textures(),c=context(),legacyOnly={...art,images:{props:art.images.props},blit(c,key,r,...d){art.calls.push({key,r,d,matrix:c.getTransform().toJSON()});c.drawImage(this.images[key],...r,...d);return true;}},expected={sedan:[91,654,136,284],pickup:[393,650,150,302],van:[690,654,150,303],truck:[997,647,158,314]};
 for(const n of[resource(1),resource(2),resource(3),resource(1,'fuel')]){
  const before=JSON.stringify(n),f=Art.metricSceneryFrame202(n),skin=Art.metricVehicleSkin202(f,legacyOnly);assert.equal(skin.projection,'orthographic-owner-plan202');assert.deepEqual(skin.source,expected[f.kind]);assert.equal(skin.turn,f.kind==='van'?-Math.PI/2:Math.PI/2);
  c.clearRect(0,0,1200,1000);art.calls.length=0;assert.equal(Art.drawMetricScenery202(c,legacyOnly,n),true);const q=art.calls[0],m=q.matrix,[x,y,w,h]=q.d;
  assert.deepEqual(q.d,[-f.h/2,-f.w/2,f.h,f.w]);const points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>({x:m.a*px+m.c*py+m.e,y:m.b*px+m.d*py+m.f}));
  assert.ok(Math.abs(Math.min(...points.map(p=>p.x))-f.body.l)<1e-9);assert.ok(Math.abs(Math.max(...points.map(p=>p.x))-f.body.r)<1e-9);assert.ok(Math.abs(Math.min(...points.map(p=>p.y))-f.body.t)<1e-9);assert.ok(Math.abs(Math.max(...points.map(p=>p.y))-f.body.b)<1e-9);
  const p=c.getImageData(Math.floor(f.body.l),Math.floor(f.body.t),Math.ceil(f.w),Math.ceil(f.h)).data,colours=new Set();for(let i=0;i<p.length;i+=4)if(p[i+3]>128)colours.add(p[i]*65536+p[i+1]*256+p[i+2]);assert.ok(colours.size>400,'Real painted glazing, rust and body seams survive the projection.');assert.equal(JSON.stringify(n),before);
 }
});

test('202 scenery: heavy and medical vehicle skins keep painted plans, clipped material fragments and four identity styles',async()=>{
 const art=await textures(),c=context(),hashes=new Set();
 for(const kind of['bus','ambulance','utilityTruck','tanker']){
  const n=node(kind),before=JSON.stringify(n),body=F.rect(n);art.calls.length=0;c.clearRect(0,0,1200,1000);Art.drawMetricScenery202(c,art,n,{seed:17117});const plan=art.calls[0];
  assert.ok(['art139Bus','art139Truck','art140Van','art158Vehicles','art158HeavyVehicles'].includes(plan.key));assert.deepEqual(plan.d,[-n.body202.w/2,-n.body202.h/2,n.body202.w,n.body202.h]);assert.deepEqual(F.rect(n),body);assert.equal(JSON.stringify(n),before);
  if(kind==='ambulance'||kind==='tanker'){const material=art.calls.find(q=>q.key.startsWith('worldProps'));assert.ok(material);assert.ok(material.r[2]<200&&material.r[3]<80,'An isometric source supplies sheet material, never the full vehicle silhouette.');}
 }
 for(let id=1;id<=32;id++){const n=resource(1);n.id=id;c.clearRect(0,0,1200,1000);Art.drawMetricScenery202(c,art,n,{seed:42});hashes.add(hash(c));}assert.equal(hashes.size,4,'The native skins retain all four deterministic cosmetic forms.');
});
