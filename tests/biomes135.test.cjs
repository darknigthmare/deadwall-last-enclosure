'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),G=require('../src/frontier-geometry.js'),entries=require('../src/biomes-codex135.js');
const R=C.BiomeRules135,channels=['base','secondary','soil','accent','rock','grass','water'];
test('G6 ecology covers twelve implemented profiles and all existing place plans',()=>{
 assert.equal(B.defs.length,12);assert.equal(new Set(B.defs.map(d=>d.id)).size,12);
 const used=new Set();for(const d of B.defs){assert.ok(Object.isFrozen(d));assert.ok(['forest','rural','industrial','suburban'].includes(d.spawnBiome));assert.ok(['grass','mud','forest','gravel'].includes(d.surface));for(const k of channels)assert.match(d.palette[k],/^#[0-9a-f]{6}$/);
  for(const [field,registry]of [['buildings',G.BY],['trees',R.trees],['rocks',R.rocks],['enemies',R.enemies]])for(const [id,n]of Object.entries(d[field])){assert.ok(registry[id],d.id+':'+field+':'+id);assert.ok(n>0&&Number.isFinite(n));if(field==='buildings')used.add(id);}
 }
 assert.deepEqual([...used].sort(),G.PRESETS.map(p=>p.id).sort());
});
test('climate reproduces exactly without simulation RNG and changes with seed',()=>{
 const before=Math.random;Math.random=()=>{throw Error('Ambient random is prohibited.');};try{for(const p of [[0,0],[255.99,256],[12587.78,15002.12],[24575,24575]]){const a=B.sample(17117,...p);assert.deepEqual(a,B.sample(17117,...p));assert.notDeepEqual(a,B.sample(84329,...p));assert.ok(a.blend>=0&&a.blend<=.5);assert.ok(Math.abs(Object.values(a.weights).reduce((a,b)=>a+b,0)-1)<1e-12);for(const f of ['moisture','temperature','elevation','fertility','urban'])assert.ok(a[f]>=0&&a[f]<=1);}}finally{Math.random=before;}
});
test('climate and palette have continuous chunk seams and three-biome junctions',()=>{
 const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));let maxChannel=0,maxClimate=0;for(let y=0;y<=24576;y+=320)for(let x=0;x<=24576;x+=256){const a=B.sample(17117,x-.001,y),b=B.sample(17117,x+.001,y);for(const f of ['moisture','temperature','elevation'])maxClimate=Math.max(maxClimate,Math.abs(a[f]-b[f]));for(const k of channels){const aa=rgb(a.palette[k]),bb=rgb(b.palette[k]);for(let i=0;i<3;i++)maxChannel=Math.max(maxChannel,Math.abs(aa[i]-bb[i]));}}
 assert.ok(maxClimate<.00001);assert.ok(maxChannel<=1,'Palette seam '+maxChannel);
});
test('a representative complete territory contains every biome, without square sector labels',()=>{
 const ids=new Set(),perSector=new Map();for(let y=96;y<24576;y+=384)for(let x=96;x<24576;x+=384){const id=B.sample(17117,x,y,false).id;ids.add(id);const key=Math.floor(x/1024)+','+Math.floor(y/1024);if(!perSector.has(key))perSector.set(key,new Set());perSector.get(key).add(id);}
 assert.deepEqual([...ids].sort(),B.defs.map(d=>d.id).sort());assert.ok([...perSector.values()].filter(s=>s.size>1).length>100,'Biome boundaries must cross technical sectors.');
});
test('weighted site selection uses only known plans, and is reproducible',()=>{
 for(let n=0;n<200;n++){const x=400+n*103,y=2300+(n*617)%19000,key='parcel'+n;const p=B.pickBuilding(1337,x,y,key);assert.ok(G.BY[p]);assert.equal(p,B.pickBuilding(1337,x,y,key));}
 assert.throws(()=>B.weighted({},1,'empty'),/vide/);assert.throws(()=>B.buildingPool('invalid'),/inconnu/);
});
test('streamed ecology conserves IDs, quantities and geometry after another chunk is generated',()=>{
 const a=B.scatter(17117,30,30);B.scatter(17117,84,66);const b=B.scatter(17117,30,30);assert.deepEqual(a,b);assert.ok(a.trees.length&&a.rocks.length&&a.decor.length);assert.ok(a.trees.length<=R.scatter.treeCandidates&&a.rocks.length<=R.scatter.rockCandidates&&a.decor.length<=R.scatter.decorCandidates);
 for(const t of a.trees){assert.match(t.id,/^T30_30_\d+$/);assert.equal(t.resource,'wood');assert.ok(Number.isInteger(t.amount)&&t.amount>0);assert.ok(t.r<t.canopy);assert.ok(R.trees[t.species]);}
 for(const t of a.rocks){assert.match(t.id,/^R30_30_\d+$/);assert.equal(t.resource,'stone');assert.ok(Number.isInteger(t.amount)&&t.amount>0);assert.ok(R.rocks[t.species]);}
 for(const d of a.decor){assert.equal(d.resource,undefined);assert.equal(d.amount,undefined);assert.equal(d.collision,undefined);}
 const taken=Object.fromEntries([...a.trees,...a.rocks].map(t=>[t.id,t.amount]));assert.equal([...b.trees,...b.rocks].reduce((sum,t)=>sum+Math.max(0,t.amount-taken[t.id]),0),0);
});
test('road/parcel exclusion and D17 clearance apply to every generated object',()=>{
 const home={x:31*256,y:31*256,half:64},clear=(x,y,pad)=>Math.abs(x-(30*256+90))>7+pad&&Math.abs(y-(30*256+180))>9+pad;
 const c=B.scatter(17117,30,30,{clear,home});for(const t of [...c.trees,...c.rocks,...c.decor]){const pad=t.kind==='tree'?t.canopy+.6:t.kind==='rock'?t.r+.6:.4;assert.ok(clear(t.x,t.y,pad));assert.ok(!(Math.abs(t.x-home.x)<64+R.scatter.ecologicalClearance+pad&&Math.abs(t.y-home.y)<64+R.scatter.ecologicalClearance+pad));}
 assert.equal(B.scatter(17117,30,30,{clear:()=>false}).trees.length,0);assert.equal(B.scatter(17117,30,30,{clear:()=>false}).rocks.length,0);assert.equal(B.scatter(17117,30,30,{clear:()=>false}).decor.length,0);
});
test('tree spacing is deterministic across adjoining chunk borders',()=>{
 const chunks=[B.scatter(17117,20,20),B.scatter(17117,21,20),B.scatter(17117,20,21),B.scatter(17117,21,21)],trees=chunks.flatMap(c=>c.trees);for(let i=0;i<trees.length;i++)for(let j=i+1;j<trees.length;j++)assert.ok(Math.hypot(trees[i].x-trees[j].x,trees[i].y-trees[j].y)>=R.scatter.treeSpacing-1e-8,trees[i].id+' near '+trees[j].id);
});
test('biome contact types retain regional save health bounds and credible profiles',()=>{
 const kinds=new Set();for(let i=0;i<3000;i++){const p=B.enemyProfile(17117,(i*173)%24576,(i*537)%24576,'enemy'+i);assert.ok(C.ENEMIES[p.kind]);assert.ok(p.health>0&&p.health<=65);assert.ok(p.speed<=1.65&&p.damage<=10&&p.interval>=.95);kinds.add(p.kind);assert.deepEqual(p,B.enemyProfile(17117,(i*173)%24576,(i*537)%24576,'enemy'+i));}assert.equal(kinds.size,6);
});
test('codex derives all quantities and correctly separates decorative content',()=>{
 assert.equal(entries.length,115);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);for(const e of entries){for(const key of ['id','title','family','status','summary','layout','access','supplies','risks','night','variants','interactions','qa','source'])assert.ok(typeof e[key]==='string'&&e[key].length,e.id+':'+key);assert.equal(e.status,'jouable');}
 const historical=entries.filter(e=>!e.id.startsWith('habitat141-'));assert.equal(historical.length,106);for(const prefix of ['biome135-','tree135-','rock135-','decor135-','enemy135-','place135-'])assert.ok(historical.some(e=>e.id.startsWith(prefix)),prefix);
 assert.deepEqual(entries.filter(e=>e.id.startsWith('habitat141-')).map(e=>e.id.slice('habitat141-'.length)).sort(),Object.keys(C.EcologyRules141.habitats).sort());
 for(const [id,t]of Object.entries(R.trees))assert.ok(entries.find(e=>e.id==='tree135-'+id).supplies.includes(t.wood.join('–')));for(const e of entries.filter(e=>e.id.startsWith('decor135-')))assert.match(e.supplies,/Aucun stock/);
 assert.match(entries.find(e=>e.id==='ecology135-scope').risks,/Pas de nouvel océan/);
});
test('invalid seed coordinates fail rather than creating phantom ecology',()=>{
 for(const seed of [-1,NaN,Infinity,2**32,1.5])assert.throws(()=>B.sample(seed,0,0));for(const p of [[NaN,0],[0,Infinity]])assert.throws(()=>B.sample(1,...p));assert.deepEqual(B.scatter(1,-1,0),{cx:-1,cy:0,trees:[],rocks:[],decor:[]});
});
