'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/building-variants157.js'),Art=require('../src/art.js'),C=require('../src/core.js');
const file=path.resolve(__dirname,'..',A.ASSETS.d17Buildings157.url),digest=data=>crypto.createHash('sha256').update(data).digest('hex');
let image;
test.before(async()=>{image=await loadImage(file);});
function support(type,rotation=0,id=18){const def=C.BUILDINGS[type],[w,h]=rotation%2?[def.size[1],def.size[0]]:def.size,x=250,y=250;return{id,type,def,rotation,w,h,x,y,left:x-w*16,top:y-h*16,right:x+w*16,bottom:y+h*16,completed:true,progress:1,dead:false,health:def.health,maxHealth:def.health,powered:true};}
function recorder(){const calls=[];return{calls,images:{d17Buildings157:image},blit(c,atlas,source,...destination){calls.push({atlas,source,destination,matrix:c.getTransform().toJSON()});c.drawImage(this.images[atlas],...source,...destination);return true;}};}

test('157 building art: sixteen complete transparent cuts contain the native PNG and visibly distinct architecture within each family',()=>{
 const bytes=fs.readFileSync(file),spec=A.ASSETS.d17Buildings157;assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.deepEqual([image.width,image.height],[spec.width,spec.height]);assert.equal(Art.ASSETS.d17Buildings157,spec);
 const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height).data,covered=new Uint8Array(image.width*image.height);
 for(const[family,sprites]of Object.entries(A.FAMILIES)){
  assert.equal(sprites.length,4);const sourceHashes=new Set(),masks=[];
  for(const sprite of sprites){const[x,y,w,h]=sprite.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=image.width&&y+h<=image.height);let solid=0;
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const at=row*image.width+col;assert.equal(covered[at],0,'Native cuts never borrow a neighbour.');covered[at]=1;if(pixels[at*4+3]>8){solid++;assert.ok(col>x&&col<x+w-1&&row>y&&row<y+h-1,'Silhouette is not cropped.');}}
   assert.ok(solid>1000,family+' has real architecture.');sourceHashes.add(digest(ctx.getImageData(x,y,w,h).data));
   const sample=createCanvas(64,64).getContext('2d'),scale=Math.min(60/w,60/h);sample.drawImage(image,x,y,w,h,(64-w*scale)/2,62-h*scale,w*scale,h*scale);const data=sample.getImageData(0,0,64,64).data;masks.push(Uint8Array.from({length:4096},(_,i)=>data[i*4+3]>64?1:0));
  }
  assert.equal(sourceHashes.size,4,family+' variants contain four different native drawings.');
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){let different=0;for(let i=0;i<4096;i++)different+=masks[a][i]!==masks[b][i];assert.ok(different>40,family+' variants change structure, beyond a palette recolour.');}
 }
 for(let i=0;i<covered.length;i++)if(pixels[i*4+3]>8)assert.equal(covered[i],1,'No significant original fragment lies outside its measured cut.');
});

test('157 building art: seed and real identity determine appearance across copies, repaint and seed changes without RNG or model writes',()=>{
 const random=Math.random;Math.random=()=>assert.fail('Rendering cannot consume simulation randomness.');
 try{
  for(const family of Object.keys(A.FAMILIES)){
   const seen=new Set(),seeds=new Set();for(let id=0;id<128;id++){const b=support(family,0,id),before=JSON.stringify(b),one=A.spriteFor(b,17117);assert.equal(A.spriteFor({...b},17117),one);assert.equal(A.spriteFor(b,17117),one);seen.add(one.index);assert.equal(JSON.stringify(b),before);}
   assert.equal(seen.size,4);assert.equal(new Set([18,19,20,21].map(id=>A.select(family,id,17117).index)).size,4,'Four consecutively built copies show the four forms.');const b=support(family);for(let seed=0;seed<128;seed++){seeds.add(A.spriteFor(b,seed).index);assert.equal(A.spriteFor(b,seed),A.spriteFor({...b},seed));}assert.equal(seeds.size,4);
  }
  for(const type of['generator','watchtower','core','constructor','__proto__'])assert.equal(A.select(type,18,0),null);
 }finally{Math.random=random;}
});

test('157 building art: real quarter turns retain uniform scale, local contact, context and owner footprint in all sixteen architecture choices',()=>{
 const c=createCanvas(600,600).getContext('2d');c.translate(5,11);c.globalAlpha=.4;c.filter='contrast(1.2)';const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,filter=c.filter,art=recorder();
 for(const family of Object.keys(A.FAMILIES))for(let rotation=0;rotation<4;rotation++)for(let index=0;index<4;index++){
  let id=0;while(A.select(family,id,17117).index!==index)id++;const b=support(family,rotation,id),before=JSON.stringify(b),m=A.measure(b,17117),[x,y,w,h]=m.destination;
  const localWidth=(rotation%2?b.h:b.w)*32,localHeight=(rotation%2?b.w:b.h)*32;
  assert.ok(x>=-localWidth/2+3-1e-9&&x+w<=localWidth/2-3+1e-9);assert.ok(y>=-localHeight/2-m.rise+3-1e-9);assert.ok(Math.abs(y+h-(localHeight/2-3))<1e-9);assert.ok(Math.abs(w/h-m.source[2]/m.source[3])<1e-9);
  assert.equal(A.drawBuilding(c,art,b,{seed:17117}),true);const q=art.calls.at(-1),angle=rotation*Math.PI/2;assert.ok(Math.abs(q.matrix.a-Math.cos(angle))<1e-9);assert.ok(Math.abs(q.matrix.b-Math.sin(angle))<1e-9);assert.equal(q.source,A.select(family,id,17117).rect);
  assert.equal(JSON.stringify(b),before);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,filter);
 }
 for(const patch of[{rotation:NaN},{rotation:4},{x:Infinity},{w:0}])assert.equal(A.measure({...support('house'),...patch},17117),null);
});

test('157 building art: the live Art painter uses the new sheet and keeps historical art for unloaded, unfinished and unrelated supports',async()=>{
 const previous=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};let art;try{art=Art.create();await art.ready;}finally{globalThis.Image=previous;}
 art.images.d17Buildings157=image;const c=createCanvas(600,600).getContext('2d'),calls=[];art.blit=(_c,atlas,r,...d)=>{calls.push({atlas,r,d});return true;};
 assert.equal(art.drawBuilding(c,support('house'),{seed:17117}),true);assert.equal(calls.at(-1).atlas,'d17Buildings157');
 for(const patch of[{completed:false,progress:.3},{dead:true},{health:0}])assert.equal(A.drawBuilding(c,art,{...support('house'),...patch},{seed:17117}),false);
 delete art.images.d17Buildings157;art.images.buildings={};art.rects['buildings:house']=Art.BUILDINGS.house;assert.equal(art.drawBuilding(c,support('house'),{seed:17117}),true);assert.equal(calls.at(-1).atlas,'buildings');
 art.rects['buildings:generator']=Art.BUILDINGS.generator;assert.equal(art.drawBuilding(c,support('generator'),{seed:17117}),true);assert.equal(calls.at(-1).atlas,'buildings');
});

test('157 building art: native painting a real campaign keeps collisions, finite stock, RNG and saved ownership, then restore selects the same architecture',()=>{
 const {game:g}=require('./helpers/browser.cjs').bootGame();g.startNew('standard','17117');const Building=g.core().constructor,prepared=[];
 // Prepared existing models isolate presentation; no campaign-time or free construction claim.
 for(const[i,type]of Object.keys(A.FAMILIES).entries()){const b=new Building(g.nextId++,type,20+i*7,20,i,1);g.world.add(b);prepared.push(b);}g.refreshMetrics(true);
 const c=createCanvas(4096,4096).getContext('2d'),art=recorder(),saved=g.serialize();delete saved.timestamp;const choices=prepared.map(b=>A.spriteFor(b,g.world.seed));
 for(let repaint=0;repaint<3;repaint++)for(const b of prepared){assert.equal(A.drawBuilding(c,art,b,g.world),true);assert.equal(g.world.at(b.x,b.y),b);}
 const after=g.serialize();delete after.timestamp;assert.deepEqual(after,saved);g.restoreSave(after);
 for(const[i,b]of prepared.entries()){const restored=g.world.buildings.get(b.id);assert.equal(A.spriteFor(restored,g.world.seed),choices[i]);assert.equal(g.world.at(restored.x,restored.y),restored);}
 assert.ok(!Object.hasOwn(after,'buildingVariants157'),'Cosmetic selection adds no save schema or paid services.');
});

test('157 building art: regional annex depth painters use exact district-slot identity and preserve rotated 20 by 9 foundations and fallback',()=>{
 globalThis.DeadwallCore=C;const regional=require('../src/world-evolution-art.js'),c=createCanvas(300,300).getContext('2d'),art=recorder();art.images.buildings=image;art.rects=Object.fromEntries(Object.entries(Art.BUILDINGS).map(([id,r])=>['buildings:'+id,r]));
 const types=Object.keys(C.WorldEvolution.RULES.districtBuildings),districts=['east','west'].map((id,n)=>({id,level:1,pos:{x:60+n*100,y:70,a:Math.PI/3},buildings:types.map((type,slot)=>({type,slot,progress:1}))})),overview={districts,companions:[],groups:[]},g={world:{seed:17117},art,worldEvolution:{overview:()=>overview}},v={z:0},view={l:0,r:300,t:0,b:300},before=JSON.stringify(overview);
 const entries=regional.depthEntries(g,v,view,overview);assert.equal(entries.length,12);for(const e of entries)e.draw(c);
 for(const[dIndex,district]of districts.entries())for(const[slot,b]of district.buildings.entries()){
  const q=art.calls[dIndex*6+slot],sprite=A.annexSprite(b.type,'annex:'+district.id+':'+slot,17117),x=-22+slot%2*28,y=-22+Math.floor(slot/2)*13;
  const native=sprite&&art.images[sprite.atlas];assert.equal(q.atlas,native?sprite.atlas:'buildings');if(native)assert.equal(q.source,sprite.rect);
  const[left,top,w,h]=q.destination;assert.ok(left>=x-1e-9&&left+w<=x+20+1e-9&&top>=y-4-1e-9);assert.ok(Math.abs(top+h-(y+9))<1e-9);
 }
 assert.equal(JSON.stringify(overview),before);const first=art.calls.slice();art.calls.length=0;regional.draw(c,g,v,view);assert.deepEqual(art.calls,first,'Shared depth and historical projection paint exactly the same selections.');
 districts[0].buildings[0].progress=.5;art.calls.length=0;for(const e of regional.depthEntries(g,v,view,overview))e.draw(c);assert.equal(art.calls.length,11);delete art.images.d17Buildings157;art.calls.length=0;for(const e of regional.depthEntries(g,v,view,overview))e.draw(c);assert.ok(art.calls.every(q=>q.atlas==='buildings'));v.z=1;assert.equal(regional.depthEntries(g,v,view,overview).length,0);
});
