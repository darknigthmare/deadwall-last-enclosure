'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const G=require('../src/frontier-geometry.js');
const D=require('../src/seed-detail157.js');
const Art=require('../src/seed-detail-art157.js');
const W=require('../src/frontier-world.js');
const Codex=require('../src/world-codex.js');
const rect=o=>({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h});
const overlaps=(a,b,margin=0)=>a.l<b.r+margin&&a.r>b.l-margin&&a.t<b.b+margin&&a.b>b.t-margin;
function parcel(d,id='TEST_'+d.id){
 const p={id,type:d.id,x:400,y:400,a:.12,w:d.w,h:d.h,levels:d.levels,generation:7};
 p.parking=G.parking(p);p.outdoor=G.outdoor(p);return p;
}
test('seed157: precisely all 62 actual visitable presets have valid seeded programs and codex entries',()=>{
 const check=D.validCatalogue();assert.equal(check.complete,true);assert.deepEqual(check.missing,[]);
 assert.equal(G.PRESETS.length,62);assert.equal(check.types,62);assert.ok(check.variants>=80);
 const entries=Codex.entries.filter(e=>e.id.startsWith('seed157-'));
 assert.equal(entries.length,62);
 for(const p of G.PRESETS){
  const entry=entries.find(e=>e.id==='seed157-'+p.id);assert.ok(entry,p.id);
  assert.equal(entry.status,'pilote');
  assert.match(entry.source,/G7/);
  for(const key of ['summary','layout','access','supplies','risks','night','variants','interactions','qa'])assert.ok(entry[key].length>15,key+' '+p.id);
 }
});
test('seed157: every floor has stable dimensions, unique IDs, no loot, preserved historical plans',()=>{
 let exterior=0,interior=0;
 for(const d of G.PRESETS){
  const p=parcel(d);
  for(const z of d.levels){
   const original=JSON.stringify(G.plan(p,z));
   const a=D.make(17117,p,z,G.plan(p,z)),b=D.make(17117,p,z,G.plan(p,z));
   assert.deepEqual(a,b,d.id+':'+z);
   assert.equal(JSON.stringify(G.plan(p,z)),original,'historical floor mutated '+d.id);
   const all=[...a.interior,...a.outdoor];assert.equal(new Set(all.map(o=>o.id)).size,all.length);
   for(const o of all){
    assert.ok(o.decor157 && Number.isFinite(o.x+o.y+o.w+o.h));
    assert.ok(o.w>0&&o.h>0);
    assert.equal(o.amount,undefined,'new free loot detected');
    if(z!==0)assert.equal(a.outdoor.length,0,'cour on a raised floor');
   }
   for(const o of a.interior){
    assert.ok(o.x>=.3&&o.y>=.3&&o.x+o.w<=p.w-.3&&o.y+o.h<=p.h-.3,d.id+' interior bounds');
    for(const base of [...G.plan(p,z).walls,...G.plan(p,z).objects,...G.plan(p,z).stairs])if(o.solid)assert.equal(overlaps(rect(o),rect(base),.06),false,'collision with historic object');
   }
   exterior+=a.outdoor.length;interior+=a.interior.length;
  }
 }
 assert.ok(exterior>250,'outdoor layer unexpectedly sparse');assert.ok(interior>350,'interior layer unexpectedly sparse');
});
test('seed157: gardens, gates, fences and pool variants keep the walking route open',()=>{
 for(const type of ['house','familyHouse','villa','farmhouse','cottageSmall','apartments','school','marketgarden']){
  const d=G.BY[type],p=parcel(d),plan=G.plan(p,0);
  for(const seed of [0,1,16,42,17117]){
   const detail=D.make(seed,p,0,plan),solid=detail.outdoor.filter(o=>o.solid);
   for(const o of solid){
    const corridor={x:p.w/2-1.8,y:p.h-.5,w:3.6,h:26};
    assert.equal(overlaps(rect(o),rect(corridor),.29),false,type+' rear exit blocked');
   }
   for(const o of solid)for(const parked of p.parking){
    const q=G.local(p,parked.x,parked.y),radius=Math.hypot(parked.w,parked.h)/2+.5;
    assert.equal(overlaps(rect(o),{l:q.x-radius,r:q.x+radius,t:q.y-radius,b:q.y+radius},.1),false,type+' parking blocked');
   }
  }
 }
 const villa=parcel(G.BY.villa,'PD_villa');let count=0;
 for(let seed=0;seed<120;seed++){
  const d=D.make(seed,villa,0,G.plan(villa,0));
  if(d.variant==='piscine-privee'){count++;assert.equal(d.outdoor.filter(o=>o.kind==='pool').length,1,'more than one pool on one estate');}
 }
 assert.ok(count>3,'no pool variant ever generated');
});
test('seed157: only drawn road wear, original roads and route network untouched',()=>{
 let shapes=0;const c=new Proxy({}, {get(_,k){if(['save','restore','translate','rotate','beginPath','stroke','fill','strokeRect','fillRect','ellipse','moveTo','lineTo','quadraticCurveTo','arc'].includes(k))return()=>{shapes++;};return undefined;},set(){return true;}});
 const road={id:'r-test',a:{x:100,y:100},b:{x:310,y:100},width:7};
 assert.ok(D.drawRoads(c,[road],{l:110,r:290,t:80,b:130},42)>0);
 for(const kind of Object.keys(D.objects))assert.equal(Art.draw(c,{x:0,y:0,w:2,h:2,kind,solid:true,id:'fixture'}),true,kind);
 assert.ok(shapes>60);
});
test('seed157: G7 collision uses new fixed props, without adding loot or changing POIs and plans',()=>{
 const w=W.create(17117,7,{detailVersion:1}),before=JSON.stringify(w.pois);
 const p=w.pois.find(p=>p.type==='villa')||w.pois.find(p=>p.type==='house')||w.pois[0];
 const saved=JSON.stringify(w.plan(p,0)),a=w.detailAt(p,0),b=w.detailAt(p,0);
 assert.strictEqual(a,b,'cached layer replaced while active');
 const solid=a.outdoor.find(o=>o.solid&&!o.surface);
 assert.ok(solid,'site has no physical detail');
 const center=G.global(p,solid.x+solid.w/2,solid.y+solid.h/2);
 assert.equal(w.blocked(center.x,center.y,.05),true,'new prop missing from physical collision');
 assert.equal(JSON.stringify(w.pois),before,'legacy POIs mutated');
 assert.equal(JSON.stringify(w.plan(p,0)),saved,'legacy plans mutated');
 assert.ok(!p.outdoor.some(o=>o.id.includes(':detail157:')));
 assert.ok(!w.plan(p,0).objects.some(o=>o.id.includes(':detail157:')));
 for(const q of w.pois.slice(0,70))w.detailAt(q,0);
 assert.deepEqual(w.detailAt(p,0),a,'cache eviction changed deterministic layout');
});
