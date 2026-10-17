'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),H=require('../src/wildlife-harvest190.js'),W=require('../src/wildlife189.js');
test('190 finite game yields explicitly cover the complete roster without promising harvestable protected species',()=>{
 assert.deepEqual(Object.keys(C.WildlifeHarvest190Rules.yields).sort(),Object.keys(W.species()).sort());
 assert.ok(Object.isFrozen(C.WildlifeHarvest190Rules));assert.ok(Object.isFrozen(C.WildlifeHarvest190Rules.yields));
 for(const [id,n]of Object.entries(C.WildlifeHarvest190Rules.yields)){assert.ok(Number.isInteger(n)&&n>=0&&n<=22,id);}
 assert.equal(C.WildlifeHarvest190Rules.yields.heron,0);assert.equal(C.WildlifeHarvest190Rules.yields.owl,0);
 for(const id of ['knife','machete'])assert.ok(C.Arsenal134Rules.catalog[id].workBonuses.butcher>1);
});
const invalid=[null,[],{}, {version:2,harvested:{}},{version:1,harvested:{},extra:1},{version:1,harvested:[]},
 {version:1,harvested:{A189_0_0_0:0}},{version:1,harvested:{A189_0_0_0:-1}},{version:1,harvested:{A189_0_0_0:NaN}},
 {version:1,harvested:{A189_0_0_0:Infinity}},{version:1,harvested:{A189_0_0_0:'1'}},{version:1,harvested:{A189_0_0_0:23}},
 {version:1,harvested:{A189_0_0_8:1}},{version:1,harvested:{A189_00_0_0:1}},{version:1,harvested:{A189_0_1000_0:1}},
 JSON.parse('{"version":1,"harvested":{"__proto__":1}}')];
for(const [i,raw]of invalid.entries())test('190 strict harvest record rejects malformed or forged structural input '+i,()=>assert.throws(()=>H.validate(raw),/invalide/));
test('190 absent module is an empty migration and readers cannot mutate an accepted ledger',()=>{
 assert.deepEqual(H.validate(undefined),{version:1,harvested:{}});const raw={version:1,harvested:{A189_2_0_0:.25}},out=H.validate(raw);out.harvested.A189_2_0_0=1;assert.equal(raw.harvested.A189_2_0_0,.25);
 assert.throws(()=>H.validate(raw,{worldSeed:17117,frontier:{hydrologyVersion:0,wildlife165:{A189_2_0_0:{hp:0}}}}));
 assert.throws(()=>H.validate(raw,{worldSeed:17117,frontier:{hydrologyVersion:1,wildlife165:{A189_2_0_0:{hp:1}}}}));
});
test('190 both runtime files are loaded once, after the armory, and precached offline',()=>{
 const {scripts}=require('../scripts/public-manifest183.cjs').readPublicEntries(process.cwd());
 const text=fs.readFileSync('sw.js','utf8'),raw=/const ASSETS = (\[[^\n]+\]);/.exec(text);assert.ok(raw);const cached=JSON.parse(raw[1]);
 for(const name of ['src/wildlife-harvest190.js','src/wildlife-harvest190-ui.js']){
  assert.equal(scripts.filter(p=>p===name).length,1);assert.equal(cached.filter(p=>p===name).length,1);
  assert.ok(scripts.indexOf(name)>scripts.indexOf('src/arsenal-ui134.js'));
 }
});
test('190 dead silhouettes are explicit, remain motionless and preserve context and actor state',()=>{
 globalThis.DeadwallCore=C;const A=require('../src/wildlife-art165.js');const {createCanvas}=require('@napi-rs/canvas');
 const draw=(a,options)=>{const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');ctx.translate(128,128);ctx.scale(45,45);const transform=ctx.getTransform(),alpha=ctx.globalAlpha;
  assert.equal(A.drawAnimal(ctx,a,options),true);assert.equal(ctx.globalAlpha,alpha);assert.deepEqual(ctx.getTransform(),transform);return canvas.toBuffer('image/png');};
 for(const species of ['roeDeer','trout','pigeon']){
  const profile=W.species()[species],a={id:'A189_2_0_0',species,x:0,y:0,a:.3,hp:0,moving:true,stride165:1,length:profile.length,width:profile.width,variant:0},before=JSON.stringify(a);
  const canvas=createCanvas(32,32);assert.equal(A.drawAnimal(canvas.getContext('2d'),a),false);
  assert.deepEqual(draw(a,{corpse:true}),draw({...a,stride165:4},{corpse:true}));assert.equal(JSON.stringify(a),before);
 }
});
test('190 cast rendering is bounded and observational, without changing hook or canvas state',()=>{
 const A=require('../src/wildlife-art165.js'),{createCanvas}=require('@napi-rs/canvas');const ctx=createCanvas(256,256).getContext('2d');ctx.translate(60,120);ctx.scale(28,28);const transform=ctx.getTransform();
 const work={id:'A189_1_1_0',kind:'fish',x:0,y:0,target:{x:4,y:1},progress:.4},before=JSON.stringify(work);
 assert.equal(A.drawHarvest(ctx,work),true);assert.equal(JSON.stringify(work),before);assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,1);
 for(const bad of [null,{...work,x:NaN},{...work,kind:'bad'},{...work,target:{x:Infinity,y:0}},{...work,target:{x:9,y:1}}])assert.equal(A.drawHarvest(ctx,bad),false);
});
test('190 a dead fish cannot be remotely harvested with the free seven-metre casting reach',()=>{
 const pos={active:true,z:0,x:0,y:0,hydrologyVersion:1},animal={id:'A189_1_1_0',x:4,y:0,z:0,hp:0,species:'trout',profile:W.species().trout};
 const world={blocked:()=>false,line:()=>true,movementLine:()=>true,wildlifeWaterLine:()=>true,hydrology:{sample:(x)=>({water:x>0,crossing:null})}};
 const g={state:'playing',world:{},player:{dead:false,health:100,carry:{wood:4,scrap:4,food:0},carryCapacity:30,reload:0},input:{keys:new Set(),pressed:new Set()},
  expansions:{canAct:()=>true,busy:()=>false,register(){}},frontier:{position:()=>pos,world:()=>world,contacts:()=>[],wildlifeStatus165:()=>({...animal}),wildlife165:()=>[]},
  visibility:{frame:()=>({canSeeRegionalPoint:()=>true})},update(){},startNew(){},returnToMenu(){}};
 const harvest=H.install(g);assert.equal(harvest.quote('harvest',animal.id).ok,false);assert.match(harvest.quote('harvest',animal.id).reason,/Rapprochez/);
 animal.x=1.5;assert.equal(harvest.quote('harvest',animal.id).ok,true);animal.hp=animal.profile.health;assert.equal(harvest.quote('harvest',animal.id).ok,false);
});
