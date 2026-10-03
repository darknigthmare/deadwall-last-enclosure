'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../src/world-spawns131.js'),C=require('../src/world-codex.js');
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/codex',name),'utf8'));
test('spawn 131: 24 milieux, 72 lignes normalisées, poids désactivés remis au vide',()=>{
 assert.equal(Object.keys(S.RULES.weights).length,24);
 for(const[biome,bands]of Object.entries(S.RULES.weights))for(const[band,weights]of Object.entries(bands)){
  assert.equal(weights.length,4);assert.equal(weights.reduce((a,b)=>a+b,0),100);assert.ok(weights.every(n=>Number.isInteger(n)&&n>=0));
  const distance={near:1000,middle:4000,far:8000}[band],p=S.profile(biome,distance);
  assert.deepEqual(p.weights,{empty:weights[0]+weights[3],infected:weights[1],allied:weights[2],hostile:0});
  assert.equal(Object.values(p.weights).reduce((a,b)=>a+b,0),100);
  assert.deepEqual(S.profile(biome,distance,{enabled:{allied:false,infected:false}}).weights,{empty:100,infected:0,allied:0,hostile:0});
 }
});
test('spawn 131: limites de distance, protection et exclusions sont explicites',()=>{
 for(const[d,band]of[[0,'near'],[1999.99,'near'],[2000,'middle'],[5999.99,'middle'],[6000,'far']])assert.equal(S.distanceBand(d),band);
 for(const d of[0,249,250])assert.deepEqual(S.profile('forest',d).weights,{empty:100,infected:0,allied:0,hostile:0});
 assert.ok(S.profile('forest',250.01).weights.infected>0);
 assert.deepEqual(S.profile('industrial',9000,{eligible:false}).weights,{empty:100,infected:0,allied:0,hostile:0});
 for(const distance of[-1,NaN,Infinity])assert.throws(()=>S.profile('forest',distance));
 for(const value of['unknown',null,''])assert.throws(()=>S.profile(value,6000));
 for(const seed of[-1,1.5,2**32,NaN])assert.throws(()=>S.roll({seed,id:'G5-1',biome:'rural',distance:7000}));
 for(const id of['',null,'x'.repeat(161)])assert.throws(()=>S.roll({seed:1,id,biome:'rural',distance:7000}));
});
test('spawn 131: tirage stable par site, indépendant du chargement et sans Math.random',()=>{
 const opts=Array.from({length:300},(_,i)=>({seed:2391,id:'G5-'+i,biome:['rural','forest','industrial','suburban'][i%4],distance:7000+i}));
 const saved=Math.random;Math.random=()=>{throw new Error('RNG de simulation consulté');};
 try{
  const a=opts.map(o=>S.roll(o));for(const o of[...opts].reverse())assert.deepEqual(S.roll(o),a[+o.id.slice(3)]);
  assert.ok(opts.filter((o,i)=>S.roll({...o,seed:2392}).kind!==a[i].kind).length>50);
  assert.equal(a.some(o=>o.kind==='hostile'),false);assert.ok(a.some(o=>o.kind==='allied'));assert.ok(a.some(o=>o.kind==='infected'));
 }finally{Math.random=saved;}
});
test('spawn 131: distribution déterministe mesurée sur des IDs distincts, sans relance favorable',()=>{
 const biome='industrial',distance=8000,count=20000,observed={empty:0,infected:0,allied:0,hostile:0},p=S.profile(biome,distance).weights;
 for(let i=0;i<count;i++)observed[S.roll({seed:131,id:'G5-site-'+i,biome,distance}).kind]++;
 for(const kind of S.KINDS)assert.ok(Math.abs(observed[kind]/count*100-p[kind])<1,kind+': '+observed[kind]);
});
test('spawn 131: emprises refusées dans eau, routes, bord et accès inadaptés',()=>{
 const b={x:20,y:20,w:20,h:10};assert.equal(S.placementAllowed(b).ok,true);
 assert.equal(S.placementAllowed(b,[],{water:true}).reason,'water');
 assert.equal(S.placementAllowed(b,[],{waters:[{x:39,y:10,w:8,h:30}]}).reason,'water');
 assert.equal(S.placementAllowed(b,[],{roads:[{a:{x:0,y:25},b:{x:100,y:25},width:6}]}).reason,'road');
 assert.equal(S.placementAllowed(b,[],{roads:[{a:{x:0,y:0},b:{x:100,y:0},width:6}]}).ok,true);
 assert.equal(S.placementAllowed(b,[],{bounds:{x:0,y:0,w:35,h:50}}).reason,'bounds');
 assert.equal(S.placementAllowed(b,[],{slope:.3}).reason,'slope');
 assert.equal(S.placementAllowed(b,[],{connected:false}).reason,'disconnected');
 assert.equal(S.placementAllowed(b,[],{entryWidth:1}).reason,'access');
 assert.equal(S.placementAllowed(b,[],{entryWidth:4,vehicle:true}).reason,'access');
 assert.equal(S.placementAllowed(b,[],{entryWidth:5,vehicle:true}).ok,true);
 assert.throws(()=>S.placementAllowed({x:0,y:0,w:-2,h:3}));
});
test('spawn 131: voisinage des emprises, marges de chaussée et données invalides',()=>{
 const b={x:20,y:20,w:20,h:10};
 assert.equal(S.placementAllowed(b,[{x:45,y:20,w:10,h:10}]).reason,'spacing');
 assert.equal(S.placementAllowed(b,[{x:46,y:20,w:10,h:10}]).ok,true);
 assert.equal(S.placementAllowed(b,[],{roads:[{a:{x:0,y:15},b:{x:100,y:15},width:6}]}).reason,'road');
 assert.equal(S.placementAllowed(b,[],{roads:[{a:{x:0,y:0},b:{x:50,y:50},width:2}]}).reason,'road');
 assert.throws(()=>S.placementAllowed(b,[],{roads:[{a:{x:0,y:0},b:{x:50,y:50},width:NaN}]}));
 assert.throws(()=>S.placementAllowed(b,[],{slope:NaN}));
 assert.throws(()=>S.placementAllowed(b,[],{entryWidth:NaN}));
});
test('codex 131: exports de probabilité et de placement ne divergent pas du runtime',()=>{
 const data=read('SPAWN_PROFILES_1_31.json');for(const[biome,v]of Object.entries(data.profiles))for(const[i,band]of['near','middle','far'].entries())assert.deepEqual(v[i+1],S.RULES.weights[biome][band]);
 assert.deepEqual(read('PLACEMENT_CONTRACTS_1_31.json'),S.COMPOSITION_CONTRACTS);
 for(const c of Object.values(S.COMPOSITION_CONTRACTS)){
  assert.equal(c.status,'design');assert.equal(c.modules.length,4);assert.equal(c.entry.returnRequired,true);
  assert.ok(c.footprintMetres.min.every((n,i)=>n>0&&n<=c.footprintMetres.max[i]));
  for(const id of c.modules){const entry=C.entries.find(e=>e.id===id);assert.ok(entry,id);assert.equal(entry.status,'plan');}
 }
});
test('codex 131: cent nouvelles fiches avec compositions distinctes et périmètre honnête',()=>{
 const additions=C.entries.filter(e=>e.id.includes('composition131-')||e.id.startsWith('spawn131-'));
 assert.equal(additions.length,100);assert.equal(additions.filter(e=>e.status==='plan').length,96);assert.equal(additions.filter(e=>e.status==='jouable').length,4);
 assert.equal(new Set(additions.map(e=>e.title)).size,100);assert.equal(new Set(additions.map(e=>e.layout)).size,100);
 const exported=read('COMPOSITIONS_1_31.json');assert.equal(exported.length,96);
 for(const e of exported)assert.deepEqual(e,C.entries.find(q=>q.id===e.id));
 assert.equal(C.query({status:'terrain',text:'composition131'}).length,0);
 assert.equal(Object.isFrozen(S.COMPOSITION_CONTRACTS['port'].footprintMetres.min),true);
 assert.equal(Object.isFrozen(S.RULES.weights.industrie.far),true);
});
