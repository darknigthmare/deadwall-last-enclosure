'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const G=require('../src/frontier-geometry.js'),R=require('../src/codex3000-runtime.js'),Q=require('../src/codex3000-recipes159.js'),A=require('../src/codex-anchors160.js'),F=require('../src/codex-quantities164.js');
const D=require('../src/seed-detail157.js'),W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
function synthetic(){
 const p={id:'P0777',type:'warehouse',w:20,h:14,x:500,y:500,a:.31,levels:[0],generation:8,outdoor:[],parking:[]};
 const walls=[{x:0,y:0,w:8.6,h:.24},{x:11.4,y:0,w:8.6,h:.24},{x:0,y:13.76,w:8.6,h:.24},{x:11.4,y:13.76,w:8.6,h:.24},{x:0,y:0,w:.24,h:14},{x:19.76,y:0,w:.24,h:14}];
 const room={name:'Réserve',x:.4,y:.4,w:19.2,h:13.2};
 const plan={rooms:[room],walls,objects:[],stairs:[]},detail={interior:[],outdoor:[]};
 const description={id:'DW-0221',rooms:[{name:'Réserve',exterior:false,kit:Q.KITS.storage,authoredProps:[{asset:'shelf',nom:'Rayonnage source',quantite_par_espace:[6,6],gabarit_m:{longueur:2.4,largeur:.7,hauteur:2.1},degagement_min_m:1.4}]}]};
 return {seed:42,p,z:0,plan,detail,description,geometry:G,recipes:Q,anchors:A};
}
test('164 quantities: valid bounded source ranges, including zero, are deterministic and invalid prescriptions are refused',()=>{
 for(const range of [null,[],[2],[3,1],[-1,2],[0,1.5],[0,Infinity]])assert.equal(F.requestedCount(range,42),null);
 assert.equal(F.requestedCount([0,0],123),0);assert.equal(F.requestedCount([100,200],123),8);
 const counts=new Set();for(let n=0;n<50;n++){const c=F.requestedCount([1,8],n);assert.ok(c>=1&&c<=8);counts.add(c);}assert.equal(counts.size,8);
});
test('164 quantities: aligned physical shelf series uses authored dimensions and preserves all existing service fronts',()=>{
 const args=synthetic(),before=digest(args),rich=F.enrich(args);assert.equal(rich.quantities164.added,6);assert.ok(rich.quantities164.navigationChecked);assert.equal(digest(args),before);
 assert.deepEqual(rich,F.enrich(args));assert.strictEqual(F.enrich({...args,detail:rich}),rich,'repeat must be idempotent');
 for(const o of rich.interior){assert.ok(o.anchored160&&o.quantity164&&o.solid);assert.equal(o.spriteWidth160,2.4);assert.equal(o.spriteHeight160,.7);assert.equal(o.front160.w===o.w?o.front160.h:o.front160.w,1.4);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.ok(rich.interior.filter(x=>x!==o).every(x=>!hit(o,x,.02)&&!hit(o,x.front160,.02)));}
 const old=rich.interior[0],more=synthetic();more.detail.interior=[old];const upgraded=F.enrich(more);assert.strictEqual(upgraded.interior[0],old);assert.equal(upgraded.quantities164.added,5);assert.ok(upgraded.interior.slice(1).every(o=>!hit(o,old.front160,.02)));
});
test('164 quantities: existing over-cap counts, exterior spaces, closed entry and unsupported clearance are never silently rewritten',()=>{
 const a=synthetic();a.description.rooms[0].exterior=true;assert.equal(F.enrich(a).quantities164.added,0);
 const b=synthetic();b.plan.walls.push({x:8.6,y:-1.5,w:2.8,h:2});const r=F.enrich(b);assert.equal(r.quantities164.added,0);assert.equal(r.quantities164.navigationChecked,false);
 const c=synthetic();c.description.rooms[0].authoredProps[0].degagement_min_m=3;assert.equal(F.enrich(c).quantities164.requests[0].reason,'unsupported-clearance');
 const d=synthetic();d.description.rooms[0].authoredProps[0].quantite_par_espace=[0,0];d.detail.interior=[{id:'historic',kind:'shelf',x:1,y:1,w:2.4,h:.7,solid:true}];const kept=F.enrich(d);assert.deepEqual(kept.interior,d.detail.interior);assert.equal(kept.quantities164.requests[0].reason,'already-present');
});
test('164 quantities: catalogue coverage retains every one of the 3000 recipes without inventing missing authored furniture',()=>{
 let eligible=0,rows=0,without=0;
 for(const record of R.records){const desc=R.describe(record.id);let n=0;
  for(const room of desc.rooms)for(const prop of room.authoredProps)if(F.TYPES.includes(prop.asset)){n++;rows++;assert.notEqual(F.requestedCount(prop.quantite_par_espace,0),null,record.id);}
  if(n)eligible++;else without++;
 }
 assert.equal(eligible+without,3000);assert.ok(eligible>1000&&without>0);console.log('CATALOGUE164 '+JSON.stringify({programmes:3000,eligible,withoutAuthoredRepeatableFurniture:without,authoredOccurrences:rows}));
});
test('164 quantities: all 62 native types and floors on two seeds keep source amounts, geometry and reachable anchors',()=>{
 let added=0,levels=0,places=0;const types=new Set();
 for(const seed of [42,17117])for(const spec of G.PRESETS){
  const p={...spec,id:'P0510',type:spec.id,x:500,y:700,a:.4,generation:7};p.parking=G.parking(p);p.outdoor=G.outdoor(p);places++;
  for(const z of p.levels){levels++;const plan=G.plan(p,z),base=R.enrich({seed,p,z,plan,detail:D.make(seed,p,z,plan),programme:p.codex,shapes:D.objects});const old=R.anchored({seed,p,z,plan,detail:base,programme:p.codex}),before=digest([p,plan,old]);
   const next=R.quantities({seed,p,z,plan,detail:old,programme:p.codex});assert.equal(digest([p,plan,old]),before);assert.deepEqual(next.outdoor,old.outdoor);assert.deepEqual(next.interior.slice(0,old.interior.length),old.interior);assert.deepEqual(next,R.quantities({seed,p,z,plan,detail:old,programme:p.codex}));
   const extra=next.interior.filter(o=>o.quantity164),solids=[...plan.walls,...plan.objects,...plan.stairs,...next.interior];assert.ok(extra.length<=F.RULES.maxAdded);assert.equal(new Set(next.interior.map(o=>o.id)).size,next.interior.length);
   for(const o of extra){added++;types.add(p.type);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.ok(solids.filter(s=>s!==o).every(s=>!hit(o,s,.02)));assert.ok(old.interior.filter(s=>s.front160).every(s=>!hit(o,s.front160,.02)));}
   const prior=Q.accessGrid(p,z,plan,old),after=Q.accessGrid(p,z,plan,next);if(prior?.baseline){assert.ok(after?.baseline);assert.ok(Q.anchorCells(p,z,plan,prior).every(i=>after.reachable[i]));}
  }
 }
 assert.ok(added>10);console.log('FURNITURE164 '+JSON.stringify({seeds:2,places,levels,added,types:[...types].sort()}));
});
test('164 quantities: opt-in revision leaves G8 sites, roads, old details and source stocks identical',()=>{
 const old=W.create(17117,8,{detailVersion:3}),next=W.create(17117,8,{detailVersion:4});assert.equal(digest(old.pois),digest(next.pois));assert.equal(digest(old.roads),digest(next.roads));let added=0;
 const native=new Set(G.PRESETS.map(p=>p.id)),selected=new Map();for(const p of next.pois)if(native.has(p.type)&&!selected.has(p.type))selected.set(p.type,p);
 const programmes=next.pois.filter(p=>p.generation===8);const samples=[...selected.values(),...Array.from({length:16},(_,i)=>programmes[Math.floor(i*programmes.length/16)])];
 for(const p of samples){const prior=old.pois.find(x=>x.id===p.id);for(const z of p.levels){const a=old.detailAt(prior,z),b=next.detailAt(p,z);assert.deepEqual(next.plan(p,z),old.plan(prior,z));assert.deepEqual(b.interior.filter(o=>!o.quantity164),a.interior);assert.deepEqual(b.outdoor,a.outdoor);for(const o of b.interior.filter(o=>o.quantity164)){added++;const q=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.equal(next.blocked(q.x,q.y,.05,z,p.id),true);}}}
 assert.ok(added>0);assert.equal(S.normalize({...S.initial(),generation:8,detailVersion:4}).detailVersion,4);assert.throws(()=>S.normalize({...S.initial(),detailVersion:7}));console.log('WORLD_QUANTITIES164 '+JSON.stringify({sampled:samples.length,added}));
});
test('164 quantities: depot activation changes only the revision and refuses failed restoration, repeat and occupied hands',()=>{
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snapshot=()=>{const d=g.serialize();delete d.timestamp;return d;},before=snapshot(),restore=g.restoreSave;
 assert.ok(g.worldOps131.actions().some(a=>a.id==='quantityDetails164'&&!a.disabled));g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(4).ok,false);assert.deepEqual(snapshot(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(4).ok,false);g.player.reload=0;
 const result=g.worldOps131.upgradeDetails159(4);assert.ok(result.ok,result.reason);const after=snapshot();assert.equal(after.frontier.detailVersion,4);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);
 assert.equal(g.worldOps131.upgradeDetails159(4).ok,false);assert.equal(g.worldOps131.upgradeDetails159(7).ok,false);
});
