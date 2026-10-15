'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),I=require('../src/codex-infill169.js'),G=require('../src/frontier-geometry.js');
const Q=require('../src/codex3000-recipes159.js'),A=require('../src/codex-anchors160.js'),W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js'),C=require('../src/codex-coverage167.js');
const hash=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
const over=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
const within=(a,b)=>a.x>=b.x-1e-9&&a.y>=b.y-1e-9&&a.x+a.w<=b.x+b.w+1e-9&&a.y+a.h<=b.y+b.h+1e-9;
function fixture(kind='locker'){
 const p={id:'P0888',w:20,h:18,x:500,y:700,a:.37,levels:[0],parking:[],outdoor:[]};
 const room={name:'Local de travail',x:.4,y:.4,w:19.2,h:17.2};
 const plan={rooms:[room],objects:[],stairs:[],walls:[{x:0,y:0,w:8.4,h:.24},{x:11.6,y:0,w:8.4,h:.24},{x:0,y:17.76,w:8.4,h:.24},{x:11.6,y:17.76,w:8.4,h:.24},{x:0,y:0,w:.24,h:18},{x:19.76,y:0,w:.24,h:18}]};
 const shape=I.SHAPES[kind]||[1.8,.65,true];const source={id:'room-source',name:room.name,exterior:false,levels:[0],kit:Q.KITS.technical,authoredProps:[{asset:kind,nom:kind,gabarit_m:{longueur:shape[0],largeur:shape[1],hauteur:1.2},quantite_par_espace:[2,2],degagement_min_m:.9}]};
 return{seed:42,p,z:0,plan,detail:{interior:[],outdoor:[]},description:{id:'DW-0004',rooms:[source]},geometry:G,recipes:Q,anchors:A};
}
test('169 valid and invalid quantities are bounded without fractional counts or random-state consumption',()=>{
 for(const bad of [null,[],[-1,2],[3,1],[1.5,2],[0,Infinity]])assert.equal(I.requestedCount(bad,42),null);
 assert.equal(I.requestedCount([0,0],42),0);assert.equal(I.requestedCount([9,20],42),3);
 assert.equal(I.requestedCount([1,3],42),I.requestedCount([1,3],42));
});
test('169 all new physical families place without altering source props, economy or old details',()=>{
 for(const kind of Object.keys(I.SHAPES)){
  const a=fixture(kind),before=hash(a),d=I.enrich(a);assert.equal(hash(a),before);assert.ok(d.infill169.added>0,kind+' not placed');
  assert.deepEqual(d,I.enrich(a));assert.strictEqual(d,I.enrich({...a,detail:d}));
  for(const o of d.interior){assert.equal(o.kind,kind);assert.ok(o.solid&&o.infill169);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.functional169,false);
   assert.equal(o.spriteWidth169,I.SHAPES[kind][0]);assert.equal(o.spriteHeight169,I.SHAPES[kind][1]);
   assert.ok([...a.plan.walls,...d.interior.filter(p=>p!==o)].every(p=>!over(o,p,.02)));
   assert.ok(o.fronts169.every(f=>[...a.plan.walls,...d.interior].every(p=>!over(f,p,p===o?0:.02))));
   if(kind==='stretcher')assert.equal(o.fronts169.length,2);
   if(o.support169.type==='wall'){const wall=a.plan.walls[o.support169.wall];assert.ok(wall);assert.equal(o.support169.gap,.04);}
  }
  const beforeGrid=Q.accessGrid(a.p,0,a.plan,a.detail),afterGrid=Q.accessGrid(a.p,0,a.plan,d);
  assert.ok(Q.anchorCells(a.p,0,a.plan,beforeGrid).every(i=>afterGrid.reachable[i]));
 }
});
test('169 preexisting source occurrences count once, never move and are not relabelled',()=>{
 const a=fixture(),old={id:'historic',kind:'locker',x:1,y:1,w:.45,h:.5,solid:true,resource:'scrap',amount:6};a.plan.objects.push(old);const d=I.enrich(a);
 assert.equal(d.infill169.requests[0].existing,1);assert.equal(d.infill169.added,1);assert.equal(old.amount,6);assert.equal(d.infill169.claims[0].id,'historic');
 assert.ok(d.interior.every(o=>!over(o,old,.03)));assert.ok(!('source169' in old));
});
test('169 source constraints fail closed for wrong levels, ambiguous rooms, no walls, closed entry and unsupported size',()=>{
 const wrong=fixture();wrong.description.rooms[0].levels=[1];assert.equal(I.enrich(wrong).infill169.added,0);
 const ambiguous=fixture();ambiguous.description.rooms.push({...ambiguous.description.rooms[0],id:'other'});assert.equal(I.enrich(ambiguous).infill169.added,0);
 const noWall=fixture();noWall.plan.walls=[];assert.equal(I.enrich(noWall).infill169.added,0);
 const closed=fixture();closed.plan.walls.push({x:8,y:-2,w:4,h:2.3});const blocked=I.enrich(closed);assert.equal(blocked.infill169.added,0);assert.equal(blocked.infill169.navigationChecked,false);
 for(const kind of ['width','clearance']){const a=fixture(),spec=a.description.rooms[0].authoredProps[0];if(kind==='width')spec.gabarit_m.longueur=99;else spec.degagement_min_m=3;
  const out=I.enrich(a);assert.equal(out.infill169.added,0);assert.match(out.infill169.requests[0].reason,/unsupported-source/);}
 for(const seed of [-1,1.1,'42',NaN,4294967296])assert.throws(()=>I.enrich({...fixture(),seed}));
});
test('169 yards are real disjoint reserved areas with source minima, never a replacement waterway or roof garden',()=>{
 const a=fixture('bin');a.plan.rooms=[];const room=a.description.rooms[0];Object.assign(room,{name:'cour',exterior:true,area:[100,1000]});
 const d=I.enrich(a);assert.ok(d.infill169.zones.length===1&&d.outdoor.length>0);
 for(const o of d.outdoor){assert.equal(o.zone169,d.infill169.zones[0].id);assert.equal(o.source169,room.id);assert.ok(o.y>a.p.h);assert.ok(within(o,d.infill169.zones[0]));}
 const center=G.global(a.p,a.p.w/2-2,a.p.h+10);a.p.parking.push({id:'car',...center,w:18,h:20,a:a.p.a+.5});assert.equal(I.enrich(a).infill169.added,0,'rotated car reservation');
 for(const name of ['ponton','parking','jardins suspendus','route','quai'])assert.equal(I.yardUse({...room,name}),null);
 const small={...a.p,w:8};assert.equal(I.zonesFor(small,{rooms:[{...room,area:[900,1000]}]}).zones.length,0);
 const z=I.zonesFor(a.p,{rooms:[room,{...room,id:'two'},{...room,id:'three'}]});assert.equal(z.zones.length,2);assert.ok(!over(z.zones[0],z.zones[1]));assert.ok(z.refusals.length===1);
});
test('169 legacy revision five stays byte-identical to the pristine downloaded source',()=>{
 const fs=require('node:fs'),path=require('node:path');const file=path.join(__dirname,'fixtures/codex169-baseline167.json');const baseline=JSON.parse(fs.readFileSync(file));
 for(const [seed,prior] of Object.entries(baseline)){const w=W.create(Number(seed),8,{detailVersion:5});assert.equal(hash(w.pois),prior.pois);assert.equal(hash(w.roads),prior.roads);
  const samples=prior.sites.map(([id,levels])=>{const p=w.pois.find(p=>p.id===id);return{id,levels:levels.map(z=>({z,plan:hash(w.plan(p,z)),detail:hash(w.detailAt(p,z))}))};});assert.equal(hash(samples),prior.samplesDigest,'every sampled original plan and detail retained');
 }
});
test('169 all programme references in native families keep old geometry and append only with strict physical clearance',()=>{
 let added=0,levels=0,yards=0;const kinds=new Set();
 const ids=[...new Set(G.PRESETS.map(p=>p.codex))];
 for(const seed of [42,17117])for(const id of ids){const old=P.inspect(id,seed,0,6,8);if(!old.supported)continue;
  for(const z of old.levels){const previous=z?P.inspect(id,seed,z,6,8):old,next=P.inspect(id,seed,z,7,8);levels++;
   assert.deepEqual(next.p,previous.p);assert.deepEqual(next.plan,previous.plan);assert.deepEqual(next.details.interior.filter(o=>!o.infill169),previous.details.interior);assert.deepEqual(next.details.outdoor.filter(o=>!o.infill169),previous.details.outdoor);
   const list=[...next.details.interior,...next.details.outdoor],solids=[...next.plan.walls,...next.plan.objects,...next.p.outdoor,...list.filter(o=>o.solid)];
   assert.equal(new Set(list.map(o=>o.id)).size,list.length);assert.ok(next.details.infill169.added<=I.RULES.maxAdded);
   for(const o of list.filter(o=>o.infill169)){added++;kinds.add(o.kind);if(o.plane169==='outdoor')yards++;
    assert.ok(solids.filter(s=>s!==o).every(s=>!over(o,s,.02)),id+' overlaps');assert.equal(o.resource,undefined);assert.equal(o.amount,undefined);
    for(const f of o.fronts169)assert.ok(solids.every(s=>!over(f,s,s===o?0:.02)),id+' service blocked');
   }
   if(z)assert.equal(next.details.outdoor.length,0);
  }
 }
 assert.ok(added>100&&yards>10);console.log('INFILL169_PRESETS '+JSON.stringify({seeds:2,programmes:ids.length,levels,added,yards,kinds:[...kinds]}));
});
test('169 revision seven uses world collision, visibility and streaming while preserving old loot',()=>{
 const old=W.create(17117,8,{detailVersion:6}),next=W.create(17117,8,{detailVersion:7});assert.equal(hash(old.pois),hash(next.pois));assert.equal(hash(old.roads),hash(next.roads));
 let checked=0,sample;for(const p of next.pois){const d=next.detailAt(p,0);if(!d.infill169.added)continue;sample??=p;
  for(const o of [...d.interior,...d.outdoor].filter(o=>o.infill169)){
   const point=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.equal(next.blocked(point.x,point.y,.05,0,p.id),true);
   const left=G.global(p,o.x-.05,o.y+o.h/2),right=G.global(p,o.x+o.w+.05,o.y+o.h/2);assert.equal(next.line(left,right,0,p.id),false);checked++;
   for(const face of o.fronts169){const at=G.global(p,face.x+face.w/2,face.y+face.h/2);assert.equal(next.blocked(at.x,at.y,.32,0,p.id),false,'service face in actual world');}
   assert.deepEqual(next.containers(point.x,point.y,5,0,p.id),old.containers(point.x,point.y,5,0,p.id));
  }if(checked>150)break;
 }
 assert.ok(checked>150);const before=hash(next.detailAt(sample,0));for(const p of next.pois.slice(-70))next.detailAt(p,0);assert.equal(hash(next.detailAt(sample,0)),before);
 console.log('INFILL169_WORLD '+JSON.stringify({physicalChecks:checked}));
});
test('169 save acceptance is explicit and migration changes no other field or player possession',()=>{
 for(const detailVersion of [0,1,2,3,4,5,6,7,8,9,10])assert.equal(S.normalize({...S.initial(),detailVersion}).detailVersion,detailVersion);
 for(const v of [-1,12,1.5,NaN,Infinity,'6',null,true])assert.throws(()=>S.normalize({...S.initial(),detailVersion:v}));
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snap=()=>{const data=g.serialize();delete data.timestamp;return data;},before=snap(),restore=g.restoreSave;
 g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(7).ok,false);assert.deepEqual(snap(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(7).ok,false);g.player.reload=0;
 const action=g.worldOps131.actions().find(a=>a.id==='sourceComplements169');assert.ok(action&&!action.disabled);assert.equal(action.run().ok,true);
 const after=snap();assert.equal(after.frontier.detailVersion,7);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);
 assert.equal(g.worldOps131.upgradeDetails159(7).ok,false);const stored=g.serialize();assert.equal(g.restoreSave(stored),true);assert.equal(g.frontier.snapshot().detailVersion,7);
});
test('169 report separates real outdoor placements from unsolved historical shell architecture',()=>{
 const previous=P.inspect('DW-0002',42,0,6,8),next=P.inspect('DW-0002',42,0,7,8),report=C.compare(next),prior=C.compare(previous);
 assert.ok(report.complements169.outdoor>0);assert.ok(report.totals.exteriorSimplifications>0);assert.ok(report.totals.furnitureBelowMinimum<=prior.totals.furnitureBelowMinimum);
 assert.equal(report.totals.newLootRecords,0);assert.equal(C.source('DW-0004').sourceGaps.unmappedKinds.includes('cabinet'),false);
});
