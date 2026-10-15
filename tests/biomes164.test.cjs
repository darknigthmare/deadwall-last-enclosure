'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),E=require('../src/biomes164.js'),G=require('../src/frontier-geometry.js');
const seed=17117,town={id:'audit164',x:12000,y:12000,radius:600,kind:'ville'},make=(settlements=[])=>E.create({base:B,seed,settlements});
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const legacyFixture=()=>[6,7,8,9,10].map(generation=>({generation,samples:[[0,0],[256,255.999],[12000,15000],[24575,24575]].map(p=>B.sample(seed,...p,true,{generation})),chunk:B.scatter(seed,30,30,{generation})}));

test('browser ecology can load before core and start its first campaign after core becomes available',()=>{
 const browser=vm.createContext({console});vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/biomes164.js'),'utf8'),browser,{filename:'biomes164.js'});
 assert.ok(browser.DeadwallBiomes164);assert.equal(browser.DeadwallCore,undefined);assert.equal(browser.DeadwallBiomes164.RULES,undefined);
 assert.throws(()=>browser.DeadwallBiomes164.create({base:B,seed}),/Règles/);
 browser.DeadwallCore=C;const provider=browser.DeadwallBiomes164.create({base:B,seed,settlements:[town]});assert.equal(browser.DeadwallBiomes164.RULES,C.EcologyRules164);
 assert.equal(provider.ecologyVersion,1);assert.equal(provider.sample(seed,12400,12000).id,'brownfield');assert.ok(provider.scatter(seed,30,30).trees.length>0);
 const nextCore={...C,EcologyRules164:{...C.EcologyRules164,revision:99}};browser.DeadwallCore=nextCore;assert.equal(browser.DeadwallBiomes164.RULES,nextCore.EcologyRules164);
});

test('ecology164 defines four distinct temperate biomes using real species, minerals and buildings',()=>{
 const p=make();assert.equal(p.ecologyVersion,1);assert.equal(p.defs.length,16);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.defs)&&Object.isFrozen(p.BY));
 for(const d of p.defs){assert.ok(Object.isFrozen(d));assert.equal(p.BY[d.id],d);assert.ok(p.aliasesFor(d.id).includes(d.id));for(const id of p.aliasesFor(d.id).slice(1))assert.ok(B.BY[id]);
  for(const[field,registry]of[['trees',B.TREES],['rocks',B.ROCKS],['buildings',G.BY],['enemies',B.RULES.enemies]])for(const[id,n]of Object.entries(d[field]))assert.ok(registry[id]&&n>0,d.id+':'+field+':'+id);
  for(const field of['description','risk'])assert.ok(d[field].length>30);for(const color of Object.values(d.palette))assert.match(color,/^#[0-9a-f]{6}$/);
 }
 assert.deepEqual(p.aliasesFor('sandyPine'),['sandyPine','conifer','heath']);assert.deepEqual(p.compatibleIds('peatland'),['peatland','wetland','riparian']);
 assert.equal(new Set(C.EcologyRules164.defs.map(d=>Object.keys(d.trees).sort().join(':'))).size,4);
});

test('constructing and exercising ecology164 preserves the exact historical G6 to G10 fixture',()=>{
 const expected='222fa46db6c45526241d48cd3c51fc770f107ab1e868290c8cbf40c2732a869f';assert.equal(digest(legacyFixture()),expected);
 const p=make([town]);p.scatter(seed,30,30,{generation:10});p.sample(seed,12000,12000);p.pickTree(seed,7000,8000,'proof');
 assert.equal(digest(legacyFixture()),expected);assert.equal(B.defs.length,12);assert.equal(B.ecologyVersion,undefined);
});

test('ecology164 samples are deterministic without ambient randomness and project normalized legacy material weights',()=>{
 const p=make([town]),old=Math.random;Math.random=()=>{throw Error('Ambient RNG is forbidden');};try{
  for(const[x,y]of[[0,0],[255.999,256],[12000,12000],[24575,24575]]){const a=p.sample(seed,x,y),b=make([town]).sample(seed,x,y);assert.deepEqual(a,b);assert.notDeepEqual(a,p.sample(seed+1,x,y));
   for(const weights of[a.weights,a.legacyWeights])assert.ok(Math.abs(Object.values(weights).reduce((n,v)=>n+v,0)-1)<1e-12);
   assert.deepEqual(Object.keys(a.legacyWeights),B.defs.map(d=>d.id));for(const field of['temperature','moisture','elevation','drainage','substrate','settlementInfluence','fertility','urban'])assert.ok(a[field]>=0&&a[field]<=1,field);
   assert.equal(a.ecology164.revision,1);assert.deepEqual(a.climate,{temperature:a.temperature,moisture:a.moisture,elevation:a.elevation});assert.equal(a.surface,p.surface(seed,x,y));
  }
 }finally{Math.random=old;}
});

test('ecological provinces form contiguous regions, cross chunk boundaries, and expose every implemented profile',()=>{
 const p=make([town]),grid=[],counts={};for(let y=128;y<24576;y+=256){const row=[];for(let x=128;x<24576;x+=256){const s=p.sample(seed,x,y,false);row.push(s.id);counts[s.id]=(counts[s.id]||0)+1;
   if(s.id==='alluvialTerrace')assert.ok(s.drainage>.22&&s.substrate<.88);
   if(s.id==='agriculturalPlateau')assert.ok(s.elevation>.35&&s.drainage<.72);
   if(s.id==='sandyPine')assert.ok(s.substrate>.43&&s.moisture<.65);
   if(s.id==='peatland')assert.ok(s.drainage>.28&&s.substrate>.38);
  }grid.push(row);}
 assert.deepEqual(Object.keys(counts).sort(),p.defs.map(d=>d.id).sort());for(const d of C.EcologyRules164.defs)assert.ok(counts[d.id]>30,d.id+' must form a region rather than isolated points');
 let adjacent=0,distant=0,total=0;for(let y=0;y<95;y++)for(let x=0;x<95;x++){adjacent+=+(grid[y][x]===grid[y][x+1]);adjacent+=+(grid[y][x]===grid[y+1][x]);distant+=+(grid[y][x]===grid[(y+37)%96][(x+49)%96]);total+=2;}
 assert.ok(adjacent/total>.75,'Nearby terrain must belong to broad provinces');assert.ok(distant/(total/2)<.3,'Distant terrain must offer regional variety');
});

test('climate, drainage, substrate and palette stay continuous at streaming seams and town-bin edges',()=>{
 const p=make([town]),rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));let maxClimate=0,maxColor=0;
 for(let y=0;y<=24576;y+=1024)for(let x=0;x<=24576;x+=256){const a=p.sample(seed,x-.0001,y),b=p.sample(seed,x+.0001,y);
  for(const f of['temperature','moisture','elevation','drainage','substrate','settlementInfluence'])maxClimate=Math.max(maxClimate,Math.abs(a[f]-b[f]));
  for(const k of Object.keys(a.palette)){const aa=rgb(a.palette[k]),bb=rgb(b.palette[k]);for(let i=0;i<3;i++)maxColor=Math.max(maxColor,Math.abs(aa[i]-bb[i]));}
 }
 assert.ok(maxClimate<.00001,maxClimate);assert.ok(maxColor<=1,maxColor);
});

test('brownfields follow real immutable settlements and disappear outside their geographic footprint',()=>{
 const source={...town},a=make(),b=make([source]);assert.ok(Object.isFrozen(b.settlements)&&Object.isFrozen(b.settlements[0]));
 const near=b.sample(seed,12400,12000),far=b.sample(seed,16000,12000);assert.equal(near.id,'brownfield');assert.ok(near.settlementInfluence>.8&&near.weights.brownfield>.5);
 assert.equal(a.sample(seed,12400,12000).weights.brownfield,0);assert.equal(far.settlementInfluence,0);assert.equal(far.weights.brownfield,0);
 source.x=0;source.radius=1400;assert.deepEqual(b.sample(seed,12400,12000),near);assert.equal(b.sample(seed+1,12400,12000).settlementInfluence,0);
 assert.equal(b.sample(seed,10000,12000).weights.brownfield,0);
});

test('trees and minerals use supported local transition pools and keep their finite historical yield ranges',()=>{
 const p=make([town]);for(let i=0;i<300;i++){const x=(i*173)%24576,y=(i*537)%24576,s=p.sample(seed,x,y,false);
  for(const[field,pick,registry]of[['trees',p.pickTree,B.TREES],['rocks',p.pickRock,B.ROCKS]]){const d=pick(seed,x,y,'item'+i);assert.ok(s.weights[d.biome]>=C.EcologyRules164.composition.speciesWeightFloor,d.biome+' outside its ecological range');assert.ok(p.BY[d.biome][field][d.species]);assert.ok(registry[d.species]);assert.deepEqual(d,pick(seed,x,y,'item'+i));}
 }
});

test('habitat composition adds an actual clearing flower even when the primary conifer profile has no flowers',()=>{
 const p=make(),c=p.scatter(seed,0,0),d=c.decor.find(o=>o.id==='D135_0_0_91');assert.ok(d);assert.equal(d.kind,'flowers');
 const s=p.sample(seed,d.x,d.y,false);assert.equal(s.id,'conifer');assert.equal(s.def.decor.flowers,undefined);assert.equal(s.habitat.id,'clearing');assert.ok(s.habitat.decorPool.flowers>1);
 for(const o of c.decor){assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.solid,undefined);assert.equal(o.collision,undefined);}
});

test('streaming rebuilds identical resource IDs and quantities without replenishing depleted stocks',()=>{
 const p=make([town]),a=p.scatter(seed,30,30,{generation:8});p.scatter(seed,84,66,{generation:10});const b=p.scatter(seed,30,30,{generation:8});assert.deepEqual(a,b);
 assert.ok(a.trees.length&&a.rocks.length&&a.decor.length);assert.ok(a.trees.length<=B.RULES.scatter.treeCandidates&&a.rocks.length<=B.RULES.scatter.rockCandidates&&a.decor.length<=B.RULES.scatter.decorCandidates);
 const taken=Object.fromEntries([...a.trees,...a.rocks].map(o=>[o.id,o.amount]));assert.equal([...b.trees,...b.rocks].reduce((n,o)=>n+Math.max(0,o.amount-taken[o.id]),0),0);
 for(const o of a.trees){assert.match(o.id,/^T30_30_\d+$/);const range=B.TREES[o.species].wood;assert.ok(Number.isInteger(o.amount)&&o.amount>=range[0]&&o.amount<=range[1]);}
 for(const o of a.rocks){assert.match(o.id,/^R30_30_\d+$/);const range=B.ROCKS[o.species].stone;assert.ok(Number.isInteger(o.amount)&&o.amount>=range[0]&&o.amount<=range[1]);}
});

test('roads, reservations, D17 clearance and tree spacing constrain every ecology164 chunk',()=>{
 const p=make(),home={x:31*256,y:31*256,half:64},clear=(x,y,pad)=>Math.abs(x-(30*256+90))>7+pad&&Math.abs(y-(30*256+180))>9+pad;
 const c=p.scatter(seed,30,30,{clear,home});for(const o of [...c.trees,...c.rocks,...c.decor]){const pad=o.kind==='tree'?o.canopy+.6:o.kind==='rock'?o.r+.6:.4;assert.ok(clear(o.x,o.y,pad));assert.ok(!(Math.abs(o.x-home.x)<64+B.RULES.scatter.ecologicalClearance+pad&&Math.abs(o.y-home.y)<64+B.RULES.scatter.ecologicalClearance+pad));}
 assert.deepEqual(p.scatter(seed,30,30,{clear:()=>false}),{cx:30,cy:30,trees:[],rocks:[],decor:[]});
 const trees=[[20,20],[21,20],[20,21],[21,21]].flatMap(([x,y])=>p.scatter(seed,x,y).trees);for(let i=0;i<trees.length;i++)for(let j=i+1;j<trees.length;j++)assert.ok(Math.hypot(trees[i].x-trees[j].x,trees[i].y-trees[j].y)>=B.RULES.scatter.treeSpacing-1e-8);
});

test('ecology164 retains known occupancy profiles and modest regional infected health',()=>{
 const p=make([town]),kinds=new Set();for(let i=0;i<1000;i++){const x=(i*173)%24576,y=(i*537)%24576,d=p.enemyProfile(seed,x,y,'contact'+i);assert.ok(C.ENEMIES[d.kind]);assert.ok(d.health<=65&&d.health>0);assert.ok(d.damage<=10&&d.speed<=1.65);assert.deepEqual(d,p.enemyProfile(seed,x,y,'contact'+i));kinds.add(d.kind);assert.ok(G.BY[p.pickBuilding(seed,x,y,'place'+i)]);}
 assert.equal(kinds.size,6);
});

test('malformed ecology contexts and invalid coordinates fail before creating a provider or objects',()=>{
 for(const bad of[-1,NaN,Infinity,2**32,1.5])assert.throws(()=>E.create({base:B,seed:bad}));assert.throws(()=>E.create({base:{},seed}));
 for(const settlements of[null,[null],[{x:0,y:0,radius:0}],[{x:NaN,y:0,radius:20}],[{x:1e308,y:0,radius:20}],[{x:-1,y:0,radius:20}],[{x:0,y:0,radius:Infinity}]])assert.throws(()=>E.create({base:B,seed,settlements}));
 const p=make();for(const v of[-1,NaN,2**32])assert.throws(()=>p.sample(v,0,0));assert.throws(()=>p.sample(seed,Infinity,0));assert.throws(()=>p.aliasesFor('missing'));assert.throws(()=>p.buildingPool('missing'));
 assert.deepEqual(p.scatter(seed,-1,0),{cx:-1,cy:0,trees:[],rocks:[],decor:[]});
});
