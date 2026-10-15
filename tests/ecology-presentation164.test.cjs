'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const {createCanvas}=require('@napi-rs/canvas'),C=require('../src/core.js'),B=require('../src/biomes135.js'),E=require('../src/biomes164.js'),Ground=require('../src/ground135.js'),N=require('../src/nature-art153.js'),P=require('../src/atlas-projection.js'),G=require('../src/frontier-geometry.js');
const ecology=()=>E.create({base:B,seed:42,settlements:[{id:'T164',x:8100,y:9200,r:360,kind:'village'}]});
const world=biomes=>({seed:42,generation:10,ecologyVersion:1,biomes,biomeAt(x,y){return this.biomes.sample(this.seed,x,y,true,{generation:this.generation});}});
function pixels(w,v={l:28,r:36,t:252,b:260},scale=16){const canvas=createCanvas(Math.round((v.r-v.l)*scale),Math.round((v.b-v.t)*scale)),c=canvas.getContext('2d');c.scale(scale,scale);c.translate(-v.l,-v.t);assert.equal(Ground.draw(c,w,v,{scale}),true);return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;}
function native(run){const old={document:globalThis.document,game:globalThis.DEADWALL};globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.DEADWALL={art:{images:{}}};Ground.reset();try{return run();}finally{globalThis.document=old.document;globalThis.DEADWALL=old.game;Ground.reset();}}
function load(name,globals={}){const file=path.join(__dirname,'../src',name),box={module:{exports:{}},require:createRequire(file),...globals};vm.runInNewContext(fs.readFileSync(file,'utf8'),box,{filename:file});return box.module.exports;}
const unpainted=()=>new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});

test('164 ground: four new biomes use their weighted native materials rather than an empty meadow fallback',()=>{
 const a=ecology();assert.equal(a.defs.length,16);
 for(const def of a.defs.filter(d=>!B.BY[d.id])){
  const legacyWeights=Object.fromEntries(B.defs.map(d=>[d.id,def.aliases.includes(d.id)?1/def.aliases.length:0]));
  const sample={id:def.id,weights:{[def.id]:1},legacyWeights,palette:def.palette};
  const w={seed:42,generation:10,ecologyVersion:1,biomeAt:()=>sample},projected={...w,biomeAt:()=>({...sample,weights:legacyWeights,legacyWeights:undefined})};
  assert.deepEqual(Ground.materialAt(w,832.25,1767.73),Ground.materialAt(projected,832.25,1767.73),def.id);
  assert.deepEqual(Ground.colorAt(w,832.25,1767.73),Ground.colorAt(projected,832.25,1767.73),def.id+' has the same physically named substrate');
 }
});
test('164 ground: provider ecology stays continuous at streaming and raster edges, independent of camera crop',()=>native(()=>{
 const w=world(ecology()),before=JSON.stringify(w.biomes.settlements);
 for(const edge of [0,32,128,256,512,4096])for(const [x,y]of [[edge,73.83],[91.26,edge]]){
  const a=Ground.colorAt(w,x-.001,y-.001),b=Ground.colorAt(w,x+.001,y+.001);assert.ok(a.every((n,i)=>Math.abs(n-b[i])<=1));
 }
 const a=pixels(w),large=pixels(w,{l:26,r:38,t:250,b:262}),crop=new Uint8ClampedArray(a.length);
 for(let y=0;y<128;y++)crop.set(large.subarray(((y+32)*192+32)*4,((y+32)*192+160)*4),y*128*4);
 assert.deepEqual(a,crop);for(let i=3;i<a.length;i+=4)assert.equal(a[i],255);assert.equal(JSON.stringify(w.biomes.settlements),before);
}));
test('164 ground: raster cache separates equal seeds with different contexts, ecology versions and providers',()=>native(()=>{
 const fixed=color=>({...B,sample:()=>({id:'meadow',palette:{...B.BY.meadow.palette,base:color,secondary:color,soil:color,grass:color,rock:color}})});
 const a=world(fixed('#224422')),b=world(fixed('#aa7722'));const first=pixels(a);assert.notDeepEqual(first,pixels(b));assert.deepEqual(first,pixels(a));
 a.biomes=fixed('#662244');const changed=pixels(a);assert.notDeepEqual(first,changed);assert.deepEqual(changed,pixels(a));
 a.ecologyVersion=0;a.biomeAt=()=>({id:'meadow',palette:B.BY.meadow.palette});const old=pixels(a);assert.notDeepEqual(changed,old);
 a.ecologyVersion=1;a.biomes=fixed('#224422');a.biomeAt=function(x,y){return this.biomes.sample(this.seed,x,y);};assert.deepEqual(pixels(a),first);assert.ok(Ground.cacheInfo().tiles<=64);
}));
test('164 local botany: D17 uses the regional provider once per world context and refreshes on ecology/provider changes',async()=>{
 const previous={Image:globalThis.Image,B:globalThis.DeadwallBiomes135,P:globalThis.DeadwallAtlasProjection};globalThis.Image=class{set src(_){this.onerror();}};
 try{
  const art=require('../src/art.js').create();await art.ready;globalThis.DeadwallAtlasProjection=P;
  let legacy=0,reads=0,resolutions=0;globalThis.DeadwallBiomes135={...B,pickTree(){legacy++;return{species:'oak'};}};
  const provider=species=>({...B,pickTree(seed,x,y,key,options){reads++;assert.equal(seed,42);assert.equal(key,'local:51');assert.equal(options.generation,10);assert.deepEqual({x,y},P.toRegion(node.x,node.y,game));return{species};}});
  const region={ecologyVersion:1,biomes:provider('pine')},pose={generation:10,ecologyVersion:1},game={world:{seed:42},frontier:{position:()=>pose,world:()=>{resolutions++;return region;}}};
  const node={id:51,type:'wood',x:715,y:1380,radius:28,variant:0,amount:30,maxAmount:60,flash:0},draws=[];
  for(const key of ['natureTreesConifer153','natureTreesBroad153'])art.images[key]={width:1536,height:1024};art.blit=(c,key,rect)=>{draws.push({key,rect});return true;};
  const before=JSON.stringify(node),paint=()=>{assert.equal(art.drawNode(unpainted(),node,game),true);return draws.at(-1);};
  assert.deepEqual(paint().rect,N.select('pine',node.id,42).rect);for(let n=0;n<20;n++)paint();assert.equal(reads,1);assert.equal(resolutions,1);assert.equal(legacy,0);
  region.biomes=provider('beech');assert.deepEqual(paint().rect,N.select('beech',node.id,42).rect);assert.equal(reads,2);assert.equal(resolutions,1);
  pose.ecologyVersion=0;paint();assert.equal(legacy,1);pose.ecologyVersion=1;paint();assert.equal(resolutions,2);assert.equal(reads,3);
  game.world={seed:42};paint();assert.equal(resolutions,3);assert.equal(reads,4);assert.equal(JSON.stringify(node),before);
 }finally{globalThis.Image=previous.Image;globalThis.DeadwallBiomes135=previous.B;globalThis.DeadwallAtlasProjection=previous.P;}
});
test('164 context trees: physical crowns and forest decoration use the same provider and global coordinates',()=>{
 const calls=[],trees=[],species=[],provider=kind=>({...B,pickTree(seed,x,y,key,opts){calls.push({seed,x,y,key,generation:opts.generation});return{species:kind};}});
 const A=load('context-art160.js',{DeadwallBiomes135:{...B,pickTree(){assert.fail('Revision1 painted with the legacy provider');}},DeadwallNatureArt153:{...N,drawTree(c,art,t){trees.push(t);return true;},drawSprite(c,art,kind){species.push(kind);return true;}}});
 const p={id:'P164',x:9300,y:7500,a:.47,w:78,h:70,context160:{mode:'open'}},o={id:'P164:tree',kind:'tree',x:3,y:7,w:.5,h:.5},w={seed:42,generation:10,ecologyVersion:1,biomes:provider('pine')},plan={visuals160:[o],terrain160:[{id:'P164:forest',kind:'forest',x:0,y:0,w:5,h:5,z:0}]};
 const c=unpainted(),point=G.global(p,o.x+.25,o.y+.25);A.drawVisual(c,{},p,plan,o,{world:w});A.drawVisual(c,{},p,plan,o,{world:w});
 assert.equal(calls.length,1);assert.equal(trees[0].species,'pine');assert.ok(Math.abs(calls[0].x-point.x)<1e-8&&Math.abs(calls[0].y-point.y)<1e-8);assert.equal(trees[0].r,.25);
 w.biomes=provider('willow');A.drawVisual(c,{},p,plan,o,{world:w});assert.equal(calls.length,2);assert.equal(trees.at(-1).species,'willow');
 A.drawTerrain(c,{},p,plan,{world:w});assert.ok(species.length>0);assert.ok(species.every(s=>s==='willow'));const count=calls.length;A.drawTerrain(c,{},p,plan,{world:w});assert.equal(calls.length,count);
});
test('164 movement surface: actual regional biome owns mud/forest while physical roads, yards and floors retain priority',()=>{
 const w={seed:42,generation:10,ecologyVersion:1,biomeAt:()=>({surface:'mud'}),nearestRoad:()=>null,nearPOI:()=>[],drivewayAt:()=>false};
 const api=load('world-evolution.js',{DeadwallCore:C,DeadwallBiomes135:{sample(){assert.fail('Revision1 movement sampled historical climate');}},DeadwallFrontierGeometry:G});
 const g={world:{seed:42},frontier:{world:()=>w},serialize(){},restoreSave(){},startNew(){},update(){},refreshMetrics(){}};api.install(g);
 const f={generation:10,z:0,x:8200,y:9400};assert.equal(g.worldEvolution.surface(f).key,'mud');w.biomeAt=()=>({surface:'forest'});assert.equal(g.worldEvolution.surface(f).key,'forest');
 assert.equal(g.worldEvolution.surface({...f,z:1}).key,'floor');w.drivewayAt=()=>true;assert.equal(g.worldEvolution.surface(f).key,'asphalt');w.drivewayAt=()=>false;w.nearPOI=()=>[{reserve:{l:8100,r:8300,t:9300,b:9500}}];assert.equal(g.worldEvolution.surface(f).key,'gravel');
});
