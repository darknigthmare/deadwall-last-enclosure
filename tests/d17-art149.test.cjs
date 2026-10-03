'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/d17-art149.js'),Art=require('../src/art.js'),C=require('../src/core.js'),Urban=require('../src/urban-art.js');
const root=path.resolve(__dirname,'..'),provenance=JSON.parse(fs.readFileSync(path.join(root,'assets/art149/PROVENANCE.json'),'utf8'));
const support=(type,extra={})=>{const def=C.BUILDINGS[type],w=def.size[0],h=def.size[1],x=400,y=450;return {id:45,type,def,w,h,x,y,left:x-w*16,top:y-h*16,right:x+w*16,bottom:y+h*16,completed:true,dead:false,health:def.health,maxHealth:def.health,powered:true,rotation:0,...extra};};
const images=()=>Object.fromEntries(Object.keys(A.ASSETS).map(key=>[key,{}]));
const recorder=()=>{const calls=[];return {calls,art:{images:images(),blit(c,key,rect,...dest){calls.push({key,rect,dest,filter:c.filter});return true;}}};};
const context=()=>createCanvas(1000,1000).getContext('2d');

test('149 art: six original native images retain their exact bytes, alpha and tracked origin',async()=>{
 assert.equal(provenance.images.length,6);assert.equal(provenance.spriteCount,17);assert.equal(provenance.textureCount,1);assert.equal(provenance.pixelEdits,false);
 for(const item of provenance.images){const buf=fs.readFileSync(path.join(root,item.runtime)),spec=A.ASSETS[item.id],image=await loadImage(path.join(root,item.runtime));
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),item.sha256);
  assert.equal(buf.length,item.bytes);assert.equal(image.width,spec.width);assert.equal(image.height,spec.height);assert.equal(Art.ASSETS[item.id],spec);assert.equal(spec.matte,'none');assert.equal(item.pixelEdits,false);
  if(item.id!=='d17Yard149'){assert.equal(buf[25],6);assert.equal(item.alpha_extrema[0],0);assert.ok(item.alpha_extrema[1]>=254);}
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes(item.runtime));
 }
});

test('149 art: seventeen measured source cutouts fit their atlas without borrowing a neighbour',()=>{
 assert.equal(Object.keys(A.SPRITES).length,17);
 for(const [name,s]of Object.entries(A.SPRITES)){const [x,y,w,h]=s.rect,a=A.ASSETS[s.atlas];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=a.width&&y+h<=a.height,name);
  for(const [other,q]of Object.entries(A.SPRITES)){if(other===name||q.atlas!==s.atlas)continue;const [l,t,r,b]=q.rect;assert.ok(x+w<=l||l+r<=x||y+h<=t||t+b<=y,name+' / '+other);}
 }
 assert.ok(A.SPRITES.manufacture.rect[0]+A.SPRITES.manufacture.rect[2]>512,'Measured first hall crosses the nominal cell.');
 assert.ok(A.SPRITES.housingTower.rect[1]<512,'The complete tall housing crosses the nominal row.');
});

test('149 art: every real D17 age maps to an existing command-centre visual without changing the support',()=>{
 assert.equal(C.CITY_TIERS.length,11);const b=support('core'),before=JSON.stringify(b),c=context(),r=recorder();
 for(const tier of C.CITY_TIERS){assert.ok(A.SPRITES[A.coreSprite(tier.id)]);assert.equal(A.drawCore(c,r.art,b,tier.id),true);assert.equal(r.calls.at(-1).key,'d17Core149');}
 assert.equal(A.coreSprite(0),'coreRefuge');assert.equal(A.coreSprite(2),'coreSteel');assert.equal(A.coreSprite(10),'coreConcrete');assert.equal(JSON.stringify(b),before);
});

test('149 art: every implemented housing height keeps its own silhouette; all late service families have a sprite',()=>{
 const expected={rowHomes:'housingLow',apartment:'housingApartment',residentialTower:'housingBlock',housingComplex:'housingComplex',megaHousing:'housingFortified',megaTower:'housingTower'};
 for(const [id,name]of Object.entries(expected))assert.equal(A.urbanSprite(C.BUILDINGS[id]),name);
 for(const def of Object.values(C.Urban.BUILDINGS)){
  if(['lamp','solar'].includes(def.urbanKind)){assert.equal(A.urbanSprite(def),null);continue;}
  assert.ok(A.SPRITES[A.urbanSprite(def)],def.id);
 }
});

test('149 art: a uniform cutout remains anchored inside each real footprint and old maximum visual height',()=>{
 for(const def of Object.values(C.Urban.BUILDINGS)){const type=A.urbanSprite(def);if(!type)continue;const b=support(def.id),rise=def.urbanKind==='housing'?Math.min(108,def.floors*5):def.urbanKind==='hospital'?38:18;
  const m=A.measure(type,b,{rise}),[x,y,w,h]=m.destination;assert.ok(x>=b.left+3-1e-9&&x+w<=b.right-3+1e-9,def.id);assert.ok(y>=b.top-rise+3-1e-9,def.id);assert.ok(Math.abs(y+h-(b.bottom-3))<1e-9,def.id);
  assert.ok(Math.abs(w/h-m.source[2]/m.source[3])<1e-9,'Native aspect ratio retained: '+def.id);
 }
});

test('149 art: real power and siege states darken generated service artwork without changing lighting or energy',()=>{
 const c=context(),r=recorder();c.filter='contrast(1.2)';const original=c.filter;
 for(const extra of [{powered:true},{powered:false},{powered:true,siegeOffline:true},{powered:true,territoryOffline:true}]){const b=support('hospital',extra),before=JSON.stringify(b);assert.equal(A.drawUrban(c,r.art,b),true);assert.equal(JSON.stringify(b),before);assert.equal(c.filter,original);assert.equal(r.calls.at(-1).filter,extra.powered&&!extra.siegeOffline&&!extra.territoryOffline?original:'brightness(.50) saturate(.55)');}
});

test('149 art: generated foundations follow paid progress only; walls, traps and directed lamps keep their painters',()=>{
 const c=context(),r=recorder(),stages=[[0,'foundation'],[.339,'foundation'],[.34,'frame'],[.719,'frame'],[.72,'scaffold'],[.999,'scaffold']];
 for(const [progress,name]of stages){const b=support('house',{completed:false,progress}),before=JSON.stringify(b);assert.equal(A.constructionSprite(progress),name);assert.equal(A.drawConstruction(c,r.art,b),true);assert.equal(r.calls.at(-1).rect,A.SPRITES[name].rect);assert.equal(JSON.stringify(b),before);}
 for(const type of ['woodWall','gate','spikes','streetlight','searchlight'])assert.equal(A.drawConstruction(c,r.art,support(type,{completed:false,progress:.5})),false,type);
 assert.equal(A.drawConstruction(c,r.art,support('house')),false);assert.equal(A.drawConstruction(c,r.art,support('house',{completed:false,progress:NaN})),false);
});

test('149 art: missing images and bad coordinates retain the established architecture and construction painters',()=>{
 const c=context(),b=support('hospital');assert.equal(A.drawUrban(c,{images:{}},b),false);assert.equal(A.drawCore(c,{images:{}},support('core')),false);assert.equal(A.drawConstruction(c,{images:{}},support('house',{completed:false,progress:.5})),false);
 assert.equal(A.measure('constructor',b),null);assert.equal(A.measure('hospital',{...b,x:NaN}),null);assert.equal(A.measure('hospital',{...b,w:0}),null);
 assert.equal(Urban.draw(c,b,{images:{}}),true,'Existing procedural hospital remains available.');
});

test('149 art: paints preserve caller transforms, alpha and scene state and never query simulation snapshots',()=>{
 const c=context(),r=recorder(),b=support('core'),calls=[];delete r.art.images.d17Yard149;c.translate(31,47);c.scale(.5,.5);c.globalAlpha=.37;const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha;
 const g={art:{...r.art,drawBuilding(){calls.push('old-building');return true;}},tier:{id:10},world:{buildings:new Map([[b.id,b]])},drawBuilding(){calls.push('old-game');},drawGround(){calls.push('old-ground');}};
 Object.defineProperty(g,'citadel',{get(){assert.fail('Rendering must not query mutable Citadel state.');}});
 const installed=A.install(g);assert.equal(A.install(g),installed);assert.equal(g.art.drawBuilding(c,b),true);g.drawBuilding(c,b);g.drawGround(c,{left:0,top:0,right:1000,bottom:1000});
 assert.deepEqual(calls,['old-game','old-ground']);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);
});

test('149 art: original work-yard pattern stays clipped to existing supports, cached and independent from camera',async()=>{
 const c=context(),image=await loadImage(path.join(root,A.ASSETS.d17Yard149.url)),art={images:{d17Yard149:image},diagnostics:{draws:{}}},b=support('centralStore'),before=JSON.stringify(b);
 let patterns=0;const create=c.createPattern.bind(c);c.createPattern=(...args)=>{patterns++;return create(...args);};c.globalAlpha=.42;const alpha=c.globalAlpha;
 for(let i=0;i<3;i++)assert.equal(A.drawSurface(c,art,b),true);
 assert.equal(patterns,1);assert.equal(c.globalAlpha,alpha);assert.equal(art.diagnostics.draws.d17Yard149,3);assert.equal(JSON.stringify(b),before);
 const pixels=c.getImageData(0,0,1000,1000).data;assert.equal(pixels[((b.top-2)*1000+b.left-2)*4+3],0,'Ground does not extend outside the building footprint.');
});
