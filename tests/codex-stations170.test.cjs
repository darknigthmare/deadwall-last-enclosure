'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const M=require('../src/codex-stations170.js'),G=require('../src/frontier-geometry.js'),R=require('../src/codex3000-runtime.js'),Q=require('../src/codex3000-recipes159.js'),P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
function fixture(){
 const p={id:'P0750',codex:'DW-0001',x:200,y:300,a:.4,w:22,h:18,levels:[0,1],parking:[],outdoor:[]};
 const room={name:'Atelier',x:.4,y:.4,w:21.2,h:17.2};
 return {seed:42,p,z:0,plan:{rooms:[room],walls:[{x:0,y:0,w:9.4,h:.24},{x:12.6,y:0,w:9.4,h:.24},{x:0,y:17.76,w:9.4,h:.24},{x:12.6,y:17.76,w:9.4,h:.24},{x:0,y:0,w:.24,h:18},{x:21.76,y:0,w:.24,h:18}],objects:[],stairs:[]},detail:{interior:[],outdoor:[]},description:{id:'DW-0001',rooms:[{id:'room',name:'Atelier',levels:[0,1],exterior:false,kit:Q.KITS.workshop,authoredProps:[{asset:'machine',nom:'Machine',quantite_par_espace:[1,3],gabarit_m:{longueur:2.6,largeur:1.6,hauteur:1.7},degagement_min_m:1.2}]}]},geometry:G,recipes:Q};
}
test('170 machine: actual floor support, four accessible service faces and stable source dimensions',()=>{
 const a=fixture(),before=hash(a),b=M.enrich(a);assert.equal(b.stations170.added,1);assert.equal(hash(a),before);assert.deepEqual(b,M.enrich(a));assert.strictEqual(M.enrich({...a,detail:b}),b);
 const o=b.interior[0];assert.equal(o.kind,'machine');assert.equal(o.service170.length,4);assert.equal(o.spriteWidth170,2.6);assert.equal(o.spriteHeight170,1.6);assert.equal(o.sourceHeight170,1.7);
 assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.utilityConnected170,false);assert.ok(Object.isFrozen(o));
 const base=Q.accessGrid(a.p,0,a.plan,a.detail),next=Q.accessGrid(a.p,0,a.plan,b);assert.ok(Q.anchorCells(a.p,0,a.plan,base).every(i=>next.reachable[i]));for(const f of o.service170)for(const [x,y]of M.samples(f)){assert.ok(next.reachable[next.at(x,y)]);assert.ok(!hit(o,f));}
});
test('170 missing machine room, load-bearing upper floor and oversized sources are refused, never rescaled',()=>{
 const a=fixture();a.z=1;assert.equal(M.enrich(a).stations170.requests[0].reason,'load-bearing-enclosure-unverified');
 const b=fixture();b.description.rooms[0].authoredProps[0].gabarit_m.longueur=12;assert.equal(M.enrich(b).stations170.requests[0].reason,'unsupported-dimensions');
 const c=fixture();c.description.rooms.push({...c.description.rooms[0]});assert.equal(M.enrich(c).stations170.added,0);
 const d=fixture();d.description.rooms[0].authoredProps[0].quantite_par_espace=[-1,2];assert.equal(M.enrich(d).stations170.requests[0].reason,'invalid-source-quantity');
 const e=fixture();e.plan.walls.push({x:9.4,y:-2,w:3.2,h:3});assert.equal(M.enrich(e).stations170.added,0);
 for(const seed of [-1,1.2,NaN,4294967296])assert.throws(()=>M.enrich({...fixture(),seed}));
});
test('170 storage: use source minima once, retain old stock and service faces',()=>{
 const a=fixture();a.description.rooms[0].authoredProps=[{asset:'crate',nom:'Caisse',quantite_par_espace:[2,6],gabarit_m:{longueur:1.2,largeur:.8,hauteur:.9},degagement_min_m:.85}];
 const old={id:'old',kind:'crate',x:2,y:2,w:1.2,h:.8,amount:12,resource:'wood'};a.plan.objects.push(old);a.detail.interior.push({id:'locker',kind:'locker',x:6,y:1,w:1,h:.6,solid:true,fronts169:[{x:6,y:1.6,w:1,h:1}]});
 const b=M.enrich(a);assert.equal(b.stations170.added,1);assert.equal(old.amount,12);assert.strictEqual(b.interior[0],a.detail.interior[0]);assert.ok(b.interior.filter(o=>o.station170).every(o=>!hit(o,a.detail.interior[0].fronts169[0])));
 const e=fixture();e.description.rooms[0].authoredProps=[...a.description.rooms[0].authoredProps,...a.description.rooms[0].authoredProps];e.plan.objects.push(old);const v=M.enrich(e);assert.equal(v.stations170.requests.reduce((n,r)=>n+r.existing,0),1,'same old crate cannot satisfy two rows');
});
test('170 yards: only attributed service zones; never garden or unverified parked-vehicle ground',()=>{
 const a=fixture();a.description.rooms[0].exterior=true;a.description.rooms[0].levels=[0];a.description.rooms[0].authoredProps=[{asset:'pallet',quantite_par_espace:[1,3],gabarit_m:{longueur:1.2,largeur:.8,hauteur:.15},degagement_min_m:.85}];
 const zone={id:'zone',sourceIndex:0,source:'room',use:'service',name:'Cour',x:1,y:21,w:8,h:14};a.detail.infill169={zones:[zone]};const out=M.enrich(a);assert.equal(out.stations170.added,1);assert.equal(out.outdoor[0].zone170,'zone');
 a.detail.infill169={zones:[{...zone,use:'garden'}]};assert.equal(M.enrich(a).stations170.added,0);a.detail.infill169={zones:[{...zone,use:'service'}]};
 const c=G.global(a.p,5,28);a.p.parking.push({id:'v',...c,w:15,h:17,a:a.p.a+.3});assert.equal(M.enrich(a).stations170.added,0);
});
test('170 recipe audit: base geometries unchanged, source shortfalls never worsen on 250 parent examples',()=>{
 let models=0,added=0,resolved=0;const kinds={};
 for(const rec of R.records.filter(r=>r.original).slice(0,250)){if(!C.source(rec.id).contextCompatible)continue;const old=P.inspect(rec.id,17117,0,7),next=P.inspect(rec.id,17117,0,8);assert.deepEqual(next.p,old.p);assert.deepEqual(next.plan,old.plan);assert.deepEqual(next.details.interior.filter(o=>!o.station170),old.details.interior);assert.deepEqual(next.details.outdoor.filter(o=>!o.station170),old.details.outdoor);
  const before=C.compare(old),after=C.compare(next);assert.equal(after.totals.newLootRecords,0);assert.ok(after.totals.furnitureBelowMinimum<=before.totals.furnitureBelowMinimum);resolved+=before.totals.furnitureBelowMinimum-after.totals.furnitureBelowMinimum;
  for(const o of [...next.details.interior,...next.details.outdoor].filter(o=>o.station170)){added++;kinds[o.kind]=(kinds[o.kind]||0)+1;assert.ok(o.solid);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);}models++;
 }
 assert.ok(added>25&&resolved>25);assert.ok(kinds.machine>0&&kinds.pallet>0);console.log('STATIONS170_SAMPLE '+JSON.stringify({models,added,resolved,kinds}));
});
test('170 real world: physical objects block foot, LOS and vehicles without mutating historical POIs',()=>{
 const W=require('../src/frontier-world.js'),old=W.create(17117,8,{detailVersion:7}),next=W.create(17117,8,{detailVersion:8});assert.equal(hash(old.pois),hash(next.pois));assert.equal(hash(old.roads),hash(next.roads));let count=0,sampled=0;
 for(const p of next.pois){if(p.generation!==8)continue;sampled++;const before=old.detailAt(old.pois.find(q=>q.id===p.id),0),d=next.detailAt(p,0);assert.deepEqual(d.interior.filter(o=>!o.station170),before.interior);assert.deepEqual(d.outdoor.filter(o=>!o.station170),before.outdoor);
  for(const o of [...d.interior,...d.outdoor].filter(o=>o.station170)){count++;const c=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.equal(next.blocked(c.x,c.y,.05,0,p.id),true);const a=G.global(p,o.x-.2,o.y+o.h/2),b=G.global(p,o.x+o.w+.2,o.y+o.h/2);assert.equal(next.line(a,b,0,p.id),false);assert.equal(next.vehicleClear(c.x,c.y,p.a,.3,.3),false);
   for(const f of o.service170){const c=G.global(p,f.x+f.w/2,f.y+f.h/2);if(!old.blocked(c.x,c.y,.32,0,p.id))assert.equal(next.blocked(c.x,c.y,.32,0,p.id),false);}}
  if(sampled>=150||count>=15)break;
 }assert.ok(count>0);console.log('STATIONS170_PHYSICS '+JSON.stringify({sampled,newColliders:count}));
});
test('170 opt-in: original revision, failed restore and possessions persist; valid revisions 0 through 8 only',()=>{
 const S=require('../src/frontier-state.js');for(let v=0;v<=8;v++)assert.equal(S.normalize({...S.initial(),detailVersion:v}).detailVersion,v);for(const v of [10,-1,1.5,'8',null,true])assert.throws(()=>S.normalize({...S.initial(),detailVersion:v}));
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');const{game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snapshot=()=>{const d=g.serialize();delete d.timestamp;return d;},before=snapshot(),restore=g.restoreSave;g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(8).ok,false);assert.deepEqual(snapshot(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(8).ok,false);g.player.reload=0;const action=g.worldOps131.actions().find(a=>a.id==='stations170');assert.ok(action&&!action.disabled);const ok=action.run();assert.ok(ok.ok,ok.reason);const after=snapshot();assert.equal(after.frontier.detailVersion,8);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);assert.equal(action.run().ok,false);
});
