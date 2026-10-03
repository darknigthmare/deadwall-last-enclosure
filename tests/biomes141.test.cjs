'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),entries=require('../src/biomes-codex135.js');
const G7={generation:7},R=C.EcologyRules141;
test('141 : les générations historiques conservent échantillons, essences, contacts et gisements',()=>{
 const out=[];for(const seed of [0,17117,84329,4294967295])for(const p of [[.001,.002],[8192,7904],[19000,23888]])out.push({sample:B.sample(seed,...p),tree:B.pickTree(seed,...p,'before141'),rock:B.pickRock(seed,...p,'before141'),building:B.pickBuilding(seed,...p,'before141'),enemy:B.enemyProfile(seed,...p,'before141')});
 for(const seed of [0,17117,84329])for(const p of [[0,0],[31,30],[83,77]])out.push(B.scatter(seed,...p));
 assert.equal(createHash('sha256').update(JSON.stringify(out)).digest('hex'),'9f46bb53925210f459e275df6ffce26de51e14de924bd6dabd7d67612ac3f986');
 assert.equal(B.sample(17117,8000,8200).habitat,undefined);
});
test('141 : neuf communautés sont réellement présentes dans une région complète et décrites sans stock fictif',()=>{
 const present=new Set();for(let y=128;y<24576;y+=192)for(let x=128;x<24576;x+=192){const s=B.sample(17117,x,y,false,G7),h=s.habitat;present.add(h.id);assert.equal(h.name,R.habitats[h.id].name);assert.ok(Math.abs(Object.values(h.weights).reduce((a,b)=>a+b,0)-1)<1e-12);for(const n of [s.treeChance,s.rockChance,s.decorChance,h.openness,h.canopy,h.mineral,h.wetness,h.rowStrength])assert.ok(Number.isFinite(n)&&n>=0&&n<=1);}
 assert.deepEqual([...present].sort(),Object.keys(R.habitats).sort());
 for(const [id,d]of Object.entries(R.habitats)){const e=entries.find(e=>e.id==='habitat141-'+id);assert.equal(e.status,'jouable');assert.ok(e.layout.includes('×'+d.treeFactor));assert.match(e.supplies,/Aucun stock/);assert.match(e.source,/G7/);assert.match(e.qa,/G6 conserve/);}
});
test('141 : champs écologiques continus au bord des chunks, indépendants de la caméra et du RNG de simulation',()=>{
 const saved=Math.random;Math.random=()=>{throw Error('RNG de simulation interdit.');};try{for(let y=96;y<24576;y+=1024)for(let x=256;x<24576;x+=1024){const a=B.sample(17117,x-.001,y,false,G7),b=B.sample(17117,x+.001,y,false,G7);for(const id of Object.keys(R.habitats))assert.ok(Math.abs(a.habitat.weights[id]-b.habitat.weights[id])<.00025,id);for(const key of ['openness','canopy','mineral','wetness'])assert.ok(Math.abs(a.habitat[key]-b.habitat[key])<.00025,key);assert.deepEqual(a,B.sample(17117,x-.001,y,false,G7));assert.notDeepEqual(a,B.sample(84329,x-.001,y,false,G7));}}finally{Math.random=saved;}
});
test('141 : essences et minéraux sont cohérents par voisinage et restent dans leur biome déclaré',()=>{
 const species={};for(let i=0;i<100;i++){const t=B.pickTree(17117,7740,7920,'tree'+i,G7);species[t.species]=(species[t.species]||0)+1;assert.ok(B.BY[t.biome].trees[t.species]);const r=B.pickRock(17117,7740,7920,'rock'+i,G7);assert.ok(B.BY[r.biome].rocks[r.species]);}
 assert.ok(Math.max(...Object.values(species))>=R.speciesAffinity*90,'Un bosquet doit conserver une essence dominante.');
 for(const [x,y]of [[30,30],[55,46],[3,90],[83,77]])for(const t of [...B.scatter(17117,x,y,G7).trees,...B.scatter(17117,x,y,G7).rocks]){assert.ok(B.BY[t.biome][t.kind==='tree'?'trees':'rocks'][t.species],t.id+' : '+t.species);assert.ok(R.habitats[t.habitat]);}
});
test('141 : les clairières ouvrent réellement la forêt et les affleurements concentrent les roches',()=>{
 let opening=null,dense=null,stone=null,grass=null;for(let y=128;y<24576&&(!opening||!dense||!stone||!grass);y+=64)for(let x=128;x<24576;x+=64){const s=B.sample(17117,x,y,false,G7),h=s.habitat,forest=s.weights.deciduous+s.weights.mixed+s.weights.conifer;if(forest>.9&&h.weights.clearing>.88)opening=s;if(forest>.9&&h.weights.forestFloor>.9)dense=s;if(h.weights.stonefield>.9)stone=s;if(s.weights.limestone+s.weights.rockyHighland+s.weights.heath>.9&&h.weights.grassland>.75)grass=s;}
 assert.ok(opening&&dense&&stone&&grass,'Les communautés contrastées doivent être générées.');assert.ok(opening.treeChance<dense.treeChance*.3,'Une clairière doit avoir nettement moins de troncs.');assert.ok(stone.rockChance>grass.rockChance,'Les roches doivent suivre le sol minéral.');
});
test('141 : les rangs de verger modifient la présence réelle des arbres sans créer de fruits gratuits',()=>{
 let chosen=null;for(let y=128;y<24576&&!chosen;y+=256)for(let x=128;x<24576;x+=256){const s=B.sample(17117,x,y,false,G7);if(s.weights.orchard>.96){chosen=[Math.floor(x/256),Math.floor(y/256)];break;}}
 assert.ok(chosen);const c=B.scatter(17117,...chosen,G7);assert.ok(c.trees.length>20);const rowValues=c.trees.map(t=>{const s=B.sample(17117,t.x,t.y,false,G7);assert.equal(t.resource,'wood');return s.habitat.rowStrength/s.weights.orchard;});assert.ok(rowValues.reduce((a,b)=>a+b,0)/rowValues.length>.4,'Les arbres doivent se concentrer sur les rangs peints.');
 for(const t of c.trees){const d=C.BiomeRules135.trees[t.species];assert.ok(t.amount>=d.wood[0]&&t.amount<=d.wood[1]);assert.equal(t.food,undefined);}
});
test('141 : streaming, prélèvements et contraintes physiques restent cohérents en G7',()=>{
 const home={x:31*256,y:31*256,half:64},clear=(x,y,pad)=>Math.abs(x-(30*256+90))>7+pad&&Math.abs(y-(30*256+180))>9+pad,options={...G7,home,clear},a=B.scatter(17117,30,30,options);
 B.scatter(17117,84,66,G7);const b=B.scatter(17117,30,30,options);assert.deepEqual(a,b);assert.ok(a.trees.length&&a.rocks.length&&a.decor.length);
 const taken=Object.fromEntries([...a.trees,...a.rocks].map(t=>[t.id,t.amount]));assert.equal([...b.trees,...b.rocks].reduce((n,t)=>n+Math.max(0,t.amount-taken[t.id]),0),0);
 for(const t of [...a.trees,...a.rocks,...a.decor]){const pad=t.kind==='tree'?t.canopy+.6:t.kind==='rock'?t.r+.6:.4;assert.ok(clear(t.x,t.y,pad));assert.ok(!(Math.abs(t.x-home.x)<64+C.BiomeRules135.scatter.ecologicalClearance+pad&&Math.abs(t.y-home.y)<64+C.BiomeRules135.scatter.ecologicalClearance+pad));}
 for(const d of a.decor){assert.equal(d.resource,undefined);assert.equal(d.amount,undefined);assert.equal(d.collision,undefined);}
 assert.deepEqual(B.scatter(17117,30,30,{...G7,clear:()=>false}),{cx:30,cy:30,trees:[],rocks:[],decor:[]});
});
