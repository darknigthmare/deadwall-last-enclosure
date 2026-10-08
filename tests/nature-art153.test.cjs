'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/nature-art153.js'),C=require('../src/core.js');
const repo=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(repo,'assets/art153/NATURE_PROVENANCE153.json'),'utf8'));
let loaded;
async function art(){
 if(!loaded){const images={};for(const[id,s]of Object.entries(A.ASSETS))images[id]=await loadImage(path.join(repo,s.url));loaded=images;}
 return{images:loaded,blit(c,key,r,...d){c.drawImage(this.images[key],...r,...d);return true;}};
}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const recorder=()=>{const calls=[];return{images:Object.fromEntries(Object.keys(A.ASSETS).map(k=>[k,{}])),calls,blit(c,key,source,...destination){calls.push({key,source,destination,alpha:c.globalAlpha,transform:c.getTransform().toJSON()});return true;}};};

test('153 nature: every authoritative tree, rock and decor family in all twelve biomes has four original morphology cuts',()=>{
 const R=C.BiomeRules135;assert.deepEqual([...A.TREES].sort(),Object.keys(R.trees).sort());assert.deepEqual([...A.ROCKS].sort(),Object.keys(R.rocks).sort());assert.equal(R.defs.length,12);
 const decor=[...new Set(R.defs.flatMap(d=>Object.keys(d.decor)))].sort();assert.deepEqual([...A.DECOR].sort(),decor);
 for(const family of [...A.TREES,...A.ROCKS,...A.DECOR,'stump','exhaustedRock','logs','burntTree']){assert.equal(A.FAMILIES[family].length,4,family);for(const sprite of A.FAMILIES[family])assert.ok(A.ASSETS[sprite.atlas]);}
 assert.equal(meta.spriteCount,100);assert.equal(meta.images.length,7);assert.equal(Object.values(A.FAMILIES).reduce((n,s)=>n+s.length,0),100);
});

test('153 nature: original native PNG bytes, alpha, dimensions, provenance and complete silhouette cuts agree',async()=>{
 assert.equal(meta.pixelEdits,false);const native=await art();
 for(const item of meta.images){const bytes=fs.readFileSync(path.join(repo,item.runtime)),image=native.images[item.id],spec=A.ASSETS[item.id];assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.bytes);assert.deepEqual([image.width,image.height],item.dimensions);assert.deepEqual([spec.width,spec.height],item.dimensions);assert.equal(item.alpha_extrema[0],0);assert.equal(item.pixelEdits,false);
  const c=createCanvas(image.width,image.height).getContext('2d');c.drawImage(image,0,0);const p=c.getImageData(0,0,image.width,image.height).data,covered=new Uint8Array(image.width*image.height);
  for(const[name,r]of Object.entries(item.sprites)){const[family,index]=name.split(':'),sprite=A.FAMILIES[family][Number(index)];assert.deepEqual(sprite.rect,r);assert.equal(sprite.atlas,item.id);const[x,y,w,h]=r;assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height);let solid=0;
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const at=row*image.width+col;covered[at]++;if(p[at*4+3]>8){solid++;assert.ok(row>y&&row<y+h-1&&col>x&&col<x+w-1,name+' full silhouette avoids crop border');}}
   assert.ok(solid>100,name+' contains physical art');
  }
  for(let at=0;at<covered.length;at++)if(p[at*4+3]>8)assert.equal(covered[at],1,item.id+' visible alpha belongs to exactly one source cut at '+at);
 }
});

test('153 nature: each family really has four distinct native silhouette masks, not rotations or recolors selected by randomness',async()=>{
 const native=await art(),previous=Math.random;Math.random=()=>assert.fail('Presentation must not consume RNG');
 try{for(const family of Object.keys(A.FAMILIES)){
  const hashes=new Set();for(let index=0;index<4;index++){const c=createCanvas(160,160).getContext('2d');assert.equal(A.drawSprite(c,native,family,'sample',80,80,140,140,{variant:index}),true);const p=c.getImageData(0,0,160,160).data,alpha=Buffer.alloc(160*160);let solid=0;for(let i=0;i<alpha.length;i++){alpha[i]=p[i*4+3]>128?255:0;solid+=!!alpha[i];}assert.ok(solid>20,family+' renders');hashes.add(sha(alpha));}assert.equal(hashes.size,4,family+' distinct physical silhouettes');
  const seen=new Set();for(const seed of[0,1,42,0xffffffff])for(let id=0;id<128;id++){const one=A.select(family,'item:'+id,seed),two=A.select(family,'item:'+id,seed);assert.equal(one,two);seen.add(one.index);}assert.equal(seen.size,4,family+' deterministic identities expose every variant');
 }}finally{Math.random=previous;}
});

test('153 nature: real owners keep their footprint, resources, rotation and state while art uses the common mip painter',()=>{
 const c=createCanvas(200,200).getContext('2d'),record=recorder();c.translate(12,17);c.scale(.8,.9);c.globalAlpha=.6;const before=c.getTransform().toJSON(),alpha=c.globalAlpha;
 for(const species of A.TREES){const t={id:'tree:'+species,x:20,y:30,r:.24,canopy:3,a:.4,species,amount:16,resource:'wood'},saved=JSON.stringify(t);assert.equal(A.drawTree(c,record,t,{seed:903145,alpha:.32}),true);assert.equal(JSON.stringify(t),saved);const draw=record.calls.at(-1),r=draw.source,d=draw.destination;assert.ok(Math.abs(d[2]/d[3]-r[2]/r[3])<1e-9);assert.ok(d[2]<=6&&d[3]<=6);assert.ok(Math.abs(draw.alpha-alpha*.32)<=1/255,'Native Canvas quantizes alpha to eight bits');assert.deepEqual(c.getTransform().toJSON(),before);assert.equal(c.globalAlpha,alpha);}
 for(const species of A.ROCKS){const t={id:'rock:'+species,x:20,y:30,r:.8,a:.7,species,amount:27,resource:'stone'},saved=JSON.stringify(t);assert.equal(A.drawRock(c,record,t,{seed:42}),true);assert.equal(JSON.stringify(t),saved);const d=record.calls.at(-1).destination;assert.ok(d[2]<=1.6+1e-9&&d[3]<=1.6+1e-9);}
 for(const kind of A.DECOR){const d={id:'decor:'+kind,x:20,y:30,r:.7,a:.4,kind,biome:'mixed'},saved=JSON.stringify(d);assert.equal(A.drawDecor(c,record,d,{seed:42}),true);assert.equal(JSON.stringify(d),saved);}
});

test('153 nature: spent trees and rocks retain their actual botanical bark and stone material, without restoring harvest amounts',()=>{
 const c=createCanvas(200,200).getContext('2d'),record=recorder();
 for(const species of A.TREES){const t={id:'spent:'+species,x:20,y:30,r:.24,canopy:3,a:.4,species,amount:0,resource:'wood'},saved=JSON.stringify(t);assert.equal(A.drawTree(c,record,t,{used:true,seed:42}),true);assert.equal(JSON.stringify(t),saved);const actual=record.calls.at(-1).source,index=species==='birch'?1:['pine','fir'].includes(species)?2:null;if(index!==null)assert.deepEqual(actual,A.FAMILIES.stump[index].rect);else assert.ok([A.FAMILIES.stump[0].rect,A.FAMILIES.stump[3].rect].some(r=>JSON.stringify(r)===JSON.stringify(actual)));assert.ok(record.calls.at(-1).destination[2]<=.18*2.8);}
 for(let index=0;index<A.ROCKS.length;index++){const t={id:'spent:'+index,x:20,y:30,r:.8,species:A.ROCKS[index],amount:0},saved=JSON.stringify(t);assert.equal(A.drawRock(c,record,t,{used:true}),true);assert.deepEqual(record.calls.at(-1).source,A.FAMILIES.exhaustedRock[index].rect);assert.equal(JSON.stringify(t),saved);}
});

test('153 nature: local grumes and recoverable burn/debris supports select honest sprites with no additional resources or collision',()=>{
 const c=createCanvas(200,200).getContext('2d'),record=recorder();
 for(const support of[{type:'wood',variant:2,radius:18},{sceneryKind:'burntTree',renderSize:90},{sceneryKind:'rubble',renderSize:72}]){const n={id:14,x:50,y:70,amount:4,maxAmount:16,...support},saved=JSON.stringify(n);assert.equal(A.drawSceneryNode(c,record,n,{seed:2}),true);assert.equal(JSON.stringify(n),saved);assert.ok(record.calls.at(-1).alpha<=.450001);}
 assert.equal(A.drawSceneryNode(c,record,{type:'wood',variant:0}),false);assert.equal(A.drawSceneryNode(c,record,{sceneryKind:'ambulance'}),false);
});

test('153 nature: unavailable or rejected images and malformed coordinates preserve caller state and allow historical fallback',()=>{
 const c=createCanvas(200,200).getContext('2d'),record=recorder();c.translate(9,11);c.globalAlpha=.4;const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha;
 const t={id:1,x:30,y:40,species:'oak',canopy:3};assert.equal(A.drawTree(c,{images:{}},t),false);assert.equal(A.drawTree(c,record,{...t,x:NaN}),false);assert.equal(A.drawTree(c,record,t,{size:-1}),false);assert.equal(A.drawSprite(c,record,'constructor',1,0,0,20,20),false);assert.equal(A.select('__proto__',1),null);assert.equal(A.select('unknown',1),null);
 record.blit=()=>false;assert.equal(A.drawTree(c,record,t),false);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);
});
