'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const G=require('../src/frontier-geometry.js'),R=require('../src/codex3000-runtime.js'),Q=require('../src/codex3000-recipes159.js'),D=require('../src/seed-detail157.js'),W=require('../src/frontier-world.js'),Data=require('../src/codex3000-live-data.js');
const S=require('../src/frontier-state.js');
const original=JSON.parse(fs.readFileSync('codex-3000/originaux/DEADWALL_CODEX_1.22/CATALOGUE_500.json')).fiches;
const supplement=JSON.parse(fs.readFileSync('codex-3000/originaux/DEADWALL_CODEX_SUPPLEMENT_1.23/CATALOGUE_501_1000.json')).fiches;
const bySource=new Map([...original,...supplement].map(p=>[p.id,p]));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
test('159: all 3,000 detailed programmes retain every authored room, exterior and prop without truncation',()=>{
 let rooms=0,props=0;for(const record of R.records){const d=R.describe(record.id),p=bySource.get(record.parent),source=p.espaces||p.zones;
 assert.equal(d.rooms.length,source.length,record.id);assert.equal(d.parent,record.parent);assert.equal(d.name,record.name);
 for(let i=0;i<source.length;i++){const s=source[i],r=d.rooms[i];assert.equal(r.name,s.nom??s.zone);assert.deepEqual(r.authoredProps,s.props||[],record.id+' exact props');if(s.exterieur!==undefined)assert.equal(r.exterior,s.exterieur);assert.ok(r.kit.id&&r.kit.inventory.length>=4);rooms++;props+=r.authoredProps.length;}
 assert.deepEqual(d.access,p.graphe_acces||[]);assert.deepEqual(d.loot,p.loot||null);
 if(record.state)assert.ok(d.causal&&typeof d.causal.cause==='string');
 }
 assert.equal(rooms,13680);assert.equal(props,18117);assert.equal(Object.keys(Q.KITS).length,27);assert.equal(Q.GARDENS.length,12);
});
test('159: deduplicated instructions are lossless and original source files remain unchanged',()=>{
 const states=JSON.parse(fs.readFileSync('codex-3000/source/ETATS.json'));
 const raw=Q.compile([...original,...supplement],states),packed=Q.compact(raw);
 assert.deepEqual(packed.metrics,raw.metrics);assert.ok(JSON.stringify(packed).length<JSON.stringify(raw).length*.8);
 const data={...Data,details159:packed},r=Q.describe('DW-1001',data,R);
 assert.deepEqual(r.rooms[0].authoredProps,original[0].espaces[0].props);assert.deepEqual(r.causal,states.find(s=>s.id===r.state));
 assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.rooms[0]));
 assert.throws(()=>Q.describe('DW-9999',data,R));
});
test('159: all supported types gain deterministic bounded furnishing, clear access and no free loot',()=>{
 let added=0,checked=0,solids=0;
 for(const seed of [0,42,17117])for(const d of G.PRESETS){const p={id:'P0250',type:d.id,codex:d.codex,w:d.w,h:d.h,levels:d.levels,x:100,y:200,a:.3,generation:7};p.parking=G.parking(p);p.outdoor=G.outdoor(p);
 for(const z of p.levels){const plan=G.plan(p,z),detail=D.make(seed,p,z,plan),before=hash([p,plan,detail]);
 const enriched=R.enrich({seed,p,z,plan,detail,programme:p.codex,shapes:D.objects});
 assert.deepEqual(enriched,R.enrich({seed,p,z,plan,detail,programme:p.codex,shapes:D.objects}));assert.equal(hash([p,plan,detail]),before);
 assert.deepEqual(enriched.interior.slice(0,detail.interior.length),detail.interior);assert.deepEqual(enriched.outdoor.slice(0,detail.outdoor.length),detail.outdoor);
 const extra=[...enriched.interior,...enriched.outdoor].filter(o=>o.recipe159);added+=extra.length;solids+=extra.filter(o=>o.solid).length;
 assert.ok(extra.length<=Q.RULES.maxExtra);assert.equal(new Set(extra.map(o=>o.id)).size,extra.length);
 for(const o of extra){assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.ok(Number.isFinite(o.x+o.y+o.w+o.h));assert.equal(o.z,z);}
 if(z!==0)assert.equal(enriched.outdoor.length,0);
 const base=Q.accessGrid(p,z,plan,detail),anchors=Q.anchorCells(p,z,plan,base),after=Q.accessGrid(p,z,plan,enriched);
 if(base?.baseline){assert.ok(after.baseline);assert.ok(anchors.every(i=>after.reachable[i]),d.id+' access severed');checked++;}
 const pools=enriched.outdoor.filter(o=>o.kind==='pool');assert.ok(pools.length<=1,d.id+' duplicate pool');
 }}
 assert.ok(added>1000&&checked>100&&solids>50,JSON.stringify({added,checked,solids}));
});
test('159: detail version 2 preserves G8 floor plans, real container amounts, roads and site geometry',()=>{
 const before=W.create(17117,8,{detailVersion:1}),after=W.create(17117,8,{detailVersion:2});
 assert.equal(hash(before.pois),hash(after.pois));assert.equal(hash(before.roads),hash(after.roads));let changes=0;
 for(const p of after.pois.slice(0,20)){const old=before.pois.find(q=>q.id===p.id);for(const z of p.levels){assert.deepEqual(after.plan(p,z),before.plan(old,z));const next=after.detailAt(p,z);assert.equal(next.recipe159.version,2);changes+=next.recipe159.added;}}
 assert.ok(changes>0);const p=after.pois[0],expected=after.detailAt(p,0);for(const q of after.pois.slice(1,75))after.detailAt(q,0);assert.deepEqual(after.detailAt(p,0),expected,'LRU must not reroll');
 const state=S.initial();state.generation=8;state.detailVersion=2;assert.equal(S.normalize(state).detailVersion,2);for(const v of [0,1,2,3,4,5,6])assert.equal(S.normalize({...state,detailVersion:v}).detailVersion,v);for(const v of [8,-1,1.5,'6',true,null,NaN,Infinity])assert.throws(()=>S.normalize({...state,detailVersion:v}));
});
