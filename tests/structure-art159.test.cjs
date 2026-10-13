'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/structure-art159.js'),G=require('../src/frontier-geometry.js'),World=require('../src/frontier-world.js'),Nature=require('../src/nature-art153.js');
const repo=path.resolve(__dirname,'..'),digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let images;
test.before(async()=>{images={};for(const[key,spec]of Object.entries(A.ASSETS))images[key]=await loadImage(path.join(repo,spec.url));});
const art=()=>({images,blit(c,key,rect,...target){c.drawImage(this.images[key],...rect,...target);return true;}});
const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
function bounds(canvas){const data=pixels(canvas);let l=canvas.width,t=canvas.height,r=-1,b=-1,n=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>8){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);n++;}return{l,t,r,b,n};}

test('159 structures : six dessins originaux isolés, alpha réel et copie exacte de provenance',()=>{
 assert.equal(Object.keys(A.ASSETS).length,1);const specification=A.ASSETS.art159Structures,image=images.art159Structures,raw=fs.readFileSync(path.join(repo,specification.url)),provenance=JSON.parse(fs.readFileSync(path.join(repo,'assets/art159/STRUCTURE_PROVENANCE.json'),'utf8'));
 assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(digest(raw),provenance.sha256);assert.deepEqual([image.width,image.height],[specification.width,specification.height]);assert.equal(raw[25],6);
 const canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');c.drawImage(image,0,0);const data=pixels(canvas),covered=new Uint8Array(image.width*image.height);let transparent=0;
 for(const choices of Object.values(A.FAMILIES)){assert.equal(choices.length,3);for(const sprite of choices){const[x,y,w,h]=sprite.rect;let ink=0;assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(data[(yy*image.width+xx)*4+3]>8){const index=yy*image.width+xx;assert.equal(covered[index],0,'Une découpe ne capture pas sa voisine');covered[index]=1;ink++;assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1,'La silhouette complète conserve une gouttière');}assert.ok(ink>10000);}}
 for(let i=0;i<covered.length;i++){if(data[i*4+3]===0)transparent++;if(data[i*4+3]>8)assert.equal(covered[i],1,'Aucun fragment source inexpliqué');}assert.ok(transparent>covered.length*.5);
});

test('159 structures : graine et identité stables, trois variantes distinctes, cage cohérente entre étages',()=>{
 const oldRandom=Math.random;Math.random=()=>assert.fail('La présentation ne consomme pas la RNG');
 try{for(const family of Object.keys(A.FAMILIES)){const selected=new Set();for(let i=0;i<60;i++){const sprite=A.select(family,'P'+i,{seed:17117,floor:2});assert.equal(sprite,A.select(family,'P'+i,{seed:17117,floor:2}));selected.add(sprite.material);}assert.equal(selected.size,3);}
  for(const floor of[-1,0,1,2])assert.equal(A.select('stair','P04000:stairs',{seed:84329,floor}),A.select('stair','P04000:stairs',{seed:84329,floor:0}));
  for(const family of['__proto__','constructor','not-a-structure'])assert.equal(A.select(family,'P1'),null);for(const variant of[-1,3,1.1])assert.equal(A.select('stair','P1',{variant}),null);
 }finally{Math.random=oldRandom;}
});

test('159 escaliers : chaque matériau épouse son rectangle physique, sans changer niveaux ni source',()=>{
 const signatures=new Set(),stair=Object.freeze({id:'P4000:stairs',x:20,y:20,w:50,h:70,levels:Object.freeze([-1,0,1])}),before=JSON.stringify(stair);
 for(let variant=0;variant<3;variant++){const canvas=createCanvas(110,130),c=canvas.getContext('2d');assert.equal(A.drawStair(c,art(),stair,{seed:17117,poiId:'P4000',floor:1,variant}),true);const b=bounds(canvas);assert.ok(b.n>2000);assert.ok(b.l>=20&&b.r<70&&b.t>=20&&b.b<90);signatures.add(digest(Buffer.from(pixels(canvas))));}
 assert.equal(signatures.size,3);assert.equal(JSON.stringify(stair),before);assert.equal(A.drawStair(createCanvas(100,100).getContext('2d'),{images:{}},stair),false);
});

test('159 cloisons : répétition horizontale et verticale limitée au collider exact',()=>{
 for(let variant=0;variant<3;variant++)for(const wall of[{x:20,y:20,w:120,h:8},{x:20,y:20,w:8,h:120}]){
  Object.freeze(wall);const canvas=createCanvas(180,180),c=canvas.getContext('2d'),before=JSON.stringify(wall);assert.equal(A.drawPartition(c,art(),wall,{poiId:'P4000',seed:17117,floor:1,variant}),true);const b=bounds(canvas);assert.ok(b.n>500);assert.ok(b.l>=wall.x&&b.t>=wall.y&&b.r<wall.x+wall.w&&b.b<wall.y+wall.h);assert.equal(JSON.stringify(wall),before);
 }
});

test('159 ouvertures : les portes entre segments restent transparentes et franchissables',()=>{
 const canvas=createCanvas(190,100),c=canvas.getContext('2d'),walls=[{x:15,y:40,w:50,h:8},{x:100,y:40,w:50,h:8}];for(const wall of walls)assert.equal(A.drawPartition(c,art(),wall,{seed:3,poiId:'door-fixture',floor:1}),true);
 const data=pixels(canvas);for(let y=39;y<=49;y++)for(let x=66;x<100;x++)assert.equal(data[(y*canvas.width+x)*4+3],0,'La texture ne relie pas deux murs à travers une porte');assert.ok(bounds(canvas).n>400);
});

test('159 cloisons : orientation de parcelle, restauration contexte et borne de répétition',()=>{
 for(let turn=0;turn<4;turn++){const canvas=createCanvas(220,220),c=canvas.getContext('2d');c.translate(110,110);c.rotate(turn*Math.PI/2);const before=c.getTransform();assert.equal(A.drawPartition(c,art(),{x:-70,y:-4,w:140,h:8},{variant:2}),true);assert.deepEqual(c.getTransform(),before);const b=bounds(canvas),halfW=turn%2?4:70,halfH=turn%2?70:4;assert.ok(b.l>=109-halfW&&b.r<=111+halfW&&b.t>=109-halfH&&b.b<=111+halfH);}
 const calls=[],limitedArt={images,blit(_c,_key,_rect,...target){calls.push(target);return true;}};assert.equal(A.drawPartition(createCanvas(50,50).getContext('2d'),limitedArt,{x:0,y:0,w:10000,h:.001},{variant:0}),true);assert.equal(calls.length,256,'Le peintre reste borné même pour un segment exceptionnel');
 for(const wall of[null,{x:0,y:0,w:0,h:1},{x:0,y:NaN,w:1,h:1},{x:0,y:0,w:1,h:-1}])assert.equal(A.drawPartition(createCanvas(50,50).getContext('2d'),art(),wall),false);
});

test('159 propriétaires : vrais plans G9, escaliers et murs à chaque étage, géométrie et profondeur conservées',()=>{
 globalThis.DeadwallFrontierGeometry=G;require('../src/frontier-art.js');const Frontier=globalThis.DeadwallFrontierArt,world=World.create(17117,9),poi=world.pois.find(p=>p.generation===9&&p.levels.length>1&&world.plan(p,p.levels[0]).stairs.length);assert.ok(poi);
 const oldGlobal=globalThis.DEADWALL,originalStair=A.drawStair,originalPartition=A.drawPartition,calls=[];const game={art:art(),world:{seed:world.seed},worldEvolution:{structureDestroyed:()=>false}};globalThis.DEADWALL=game;
 A.drawStair=(c,a,s,o)=>{calls.push({kind:'stair',id:s.id,floor:o.floor,poi:o.poiId});return originalStair(c,a,s,o);};A.drawPartition=(c,a,w,o)=>{calls.push({kind:'wall',floor:o.floor,poi:o.poiId});return originalPartition(c,a,w,o);};
 try{for(const floor of poi.levels){const plan=world.plan(poi,floor),before=JSON.stringify(plan),canvas=createCanvas(800,800),c=canvas.getContext('2d'),v={world,inside:poi.id,z:floor,taken:{}};c.translate(400,400);c.scale(6,6);c.translate(-poi.x,-poi.y);Frontier.lotFloor(c,poi,v,game);const entries=Frontier.lotEntries(game,poi,v),walls=entries.filter(e=>e.kind==='wall');assert.equal(walls.length,plan.walls.length);for(const wall of walls)wall.draw(c);assert.equal(calls.filter(a=>a.kind==='stair'&&a.floor===floor).length,plan.stairs.length);assert.equal(calls.filter(a=>a.kind==='wall'&&a.floor===floor).length,plan.walls.length);assert.ok(calls.every(a=>a.poi===poi.id));assert.equal(JSON.stringify(plan),before);assert.ok(bounds(canvas).n>100);}
 }finally{A.drawStair=originalStair;A.drawPartition=originalPartition;globalThis.DEADWALL=oldGlobal;}
});

test('159 débris et grumes : réemploi des morphologies nature153 avec quantités finies inchangées',async()=>{
 assert.ok(Nature.FAMILIES.logs.length>=3);assert.ok(Nature.FAMILIES.rubble.length>=3);globalThis.DeadwallFrontierGeometry=G;require('../src/frontier-art.js');const Frontier=globalThis.DeadwallFrontierArt,old=globalThis.DeadwallNatureArt153,oldGame=globalThis.DEADWALL,calls=[];
 const nativeImages={};for(const key of new Set(['logs','rubble'].flatMap(kind=>Nature.FAMILIES[kind].map(sprite=>sprite.atlas))))nativeImages[key]=await loadImage(path.join(repo,Nature.ASSETS[key].url));globalThis.DEADWALL={art:{images:nativeImages},world:{seed:17117}};
 globalThis.DeadwallNatureArt153={...Nature,drawSprite(...args){calls.push({kind:args[2],id:args[3],seed:args[8].seed});return Nature.drawSprite(...args);}};
 try{for(const kind of['logs','rubble']){const item=Object.freeze({id:'physical:'+kind,kind,x:1,y:1,w:2,h:1,amount:12}),before=JSON.stringify(item),canvas=createCanvas(100,100),c=canvas.getContext('2d');c.scale(30,30);Frontier.object(c,item,6,0,{game:globalThis.DEADWALL,seed:84329,floor:0});assert.equal(JSON.stringify(item),before);assert.deepEqual(calls.at(-1),{kind,id:item.id,seed:84329});assert.ok(bounds(canvas).n>100);}}finally{globalThis.DeadwallNatureArt153=old;globalThis.DEADWALL=oldGame;}
});
