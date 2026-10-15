'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const Garden=require('../src/codex-gardens171.js'),G=require('../src/frontier-geometry.js'),Q=require('../src/codex3000-recipes159.js'),D=require('../src/seed-detail157.js'),P=require('../src/codex-plan165.js'),W=require('../src/frontier-world.js');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
function fixture(profile='potager'){
 const p={id:'P0707',type:'house',w:24,h:18,x:500,y:600,a:.3,levels:[0,1],generation:8,outdoor:[],parking:[]};
 const source={id:'garden-source',name:'jardin',exterior:true,levels:[0],kit:Q.KITS.garden,area:[100,800],authoredProps:[]};
 const zone={id:'P0707:zone169:0',source:source.id,sourceIndex:0,name:'jardin',use:'garden',x:-7,y:20.5,w:16,h:18};
 return {seed:42,p,z:0,plan:{walls:[{x:0,y:0,w:10,h:.24},{x:14,y:0,w:10,h:.24},{x:0,y:17.76,w:10,h:.24},{x:14,y:17.76,w:10,h:.24},{x:0,y:0,w:.24,h:18},{x:23.76,y:0,w:.24,h:18}],objects:[],stairs:[],rooms:[{name:'Séjour',x:.4,y:.4,w:23.2,h:17.2}]},
 detail:{interior:[],outdoor:[],infill169:{revision:7,zones:[zone]}},description:{id:'DW-0001',rooms:[source],gardenOptions:Q.GARDENS},family:'residence',geometry:G,recipes:{...Q,GARDENS:Q.GARDENS.filter(g=>g.id===profile)},shapes:{...D.objects,...Q.EXTRA_SHAPES}};
}
test('171 all twelve garden profiles produce source-sized, accessible ground compositions without new loot',()=>{
 const profiles=new Set(),kinds=new Set();let added=0;
 for(const profile of Q.GARDENS){const a=fixture(profile.id),before=hash(a),out=Garden.enrich(a),layer=out.gardens171;
  assert.equal(hash(a),before);assert.deepEqual(out,Garden.enrich(a));assert.strictEqual(Garden.enrich({...a,detail:out}),out);
  assert.equal(layer.groups.length,1,profile.id);assert.equal(layer.groups[0].profile,profile.id);profiles.add(profile.id);assert.equal(layer.origin,'garden-kit-not-author-minima');
  assert.ok(layer.groups[0].complete,profile.id+' should fit this empty prepared zone');assert.equal(layer.added,profile.modules.length);assert.deepEqual(out.interior,a.detail.interior);
  const zone=a.detail.infill169.zones[0],grid=Q.accessGrid(a.p,0,a.plan,out);
  for(const o of out.outdoor){added++;kinds.add(o.kind);assert.ok(o.garden171);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.functional171,false);assert.equal(o.source171,'garden-source');
   assert.ok(o.x>=zone.x&&o.y>=zone.y&&o.x+o.w<=zone.x+zone.w&&o.y+o.h<=zone.y+zone.h);
   assert.equal(o.spriteWidth171,a.shapes[o.kind][0]);assert.equal(o.spriteHeight171,a.shapes[o.kind][1]);
   assert.ok(out.outdoor.filter(x=>x!==o).every(x=>!hit(o,x,.02)));assert.ok(o.service171.every(f=>Garden.samples(f).every(([x,y])=>grid.reachable[grid.at(x,y)])));
  }
 }
 assert.equal(profiles.size,12);console.log('GARDENS171_PROFILES '+JSON.stringify({profiles:profiles.size,added,kinds:[...kinds].sort()}));
});
test('171 reuse is attributed once; unique equipment elsewhere is not duplicated or credited to this zone',()=>{
 const a=fixture('piscine'),pool={id:'old-pool',kind:'pool',x:26,y:21,w:5.5,h:3.5,solid:true};a.detail.outdoor.push(pool);
 const out=Garden.enrich(a);assert.strictEqual(out.outdoor[0],pool);assert.equal(out.outdoor.filter(o=>o.kind==='pool').length,1);assert.ok(out.gardens171.requests.some(r=>r.kind==='pool'&&r.reason==='unique-equipment-elsewhere'&&r.unplaced===1));
 const b=fixture('potager');b.detail.outdoor.push({id:'old-barrel',kind:'waterButt',x:-5,y:35,w:.85,h:.8,solid:true});const rich=Garden.enrich(b);
 assert.ok(rich.gardens171.groups[0].existing.includes('old-barrel'));assert.equal(rich.outdoor.filter(o=>o.kind==='waterButt').length,1);assert.equal(new Set(rich.gardens171.groups.flatMap(g=>g.existing)).size,rich.gardens171.groups.flatMap(g=>g.existing).length);
});
test('171 refusals preserve closed boundaries, upper floors, specialized spaces and insufficient accessible ground',()=>{
 const upper=fixture();upper.z=1;assert.equal(Garden.enrich(upper).gardens171.reason,'ground-floor-only');
 const closed=fixture();const s=closed.detail.infill169.zones[0];closed.detail.outdoor=[{id:'top',kind:'fence',x:s.x,y:s.y,w:s.w,h:.3,solid:true},{id:'bottom',kind:'fence',x:s.x,y:s.y+s.h-.3,w:s.w,h:.3,solid:true},{id:'left',kind:'fence',x:s.x,y:s.y,w:.3,h:s.h,solid:true},{id:'right',kind:'fence',x:s.x+s.w-.3,y:s.y,w:.3,h:s.h,solid:true}];
 const before=hash(closed);assert.equal(Garden.enrich(closed).gardens171.added,0);assert.equal(hash(closed),before);
 for(const name of ['jardins suspendus','quai','cour de livraison','cour matériaux','parking']){const a=fixture();a.description.rooms[0].name=name;assert.equal(Garden.enrich(a).gardens171.added,0,name);}
 const tiny=fixture();tiny.detail.infill169.zones[0].w=1;assert.equal(Garden.enrich(tiny).gardens171.added,0);
 const enormous=fixture();enormous.detail.infill169.zones[0].w=1e9;assert.equal(Garden.enrich(enormous).gardens171.added,0);
 const absent=fixture();absent.detail.infill169.zones=[];assert.equal(Garden.enrich(absent).gardens171.reason,'no-attributed-ground-zone');
 for(const seed of [-1,4294967296,1.5,null,NaN])assert.throws(()=>Garden.enrich({...fixture(),seed}));
});
test('171 vehicles and previous service fronts remain free, including rotated parked cars and machines',()=>{
 const a=fixture('fleurs'),zone=a.detail.infill169.zones[0],c=G.global(a.p,zone.x+zone.w/2,zone.y+zone.h/2);a.p.parking.push({id:'car',...c,w:9,h:4,a:a.p.a+.6});
 const old={id:'station',kind:'machine',x:-5,y:32,w:2,h:1,solid:true,service170:[{x:-5,y:33.1,w:2,h:.9}]};a.detail.outdoor.push(old);
 const out=Garden.enrich(a);for(const o of out.outdoor.filter(o=>o.garden171)){
  assert.ok(old.service170.every(f=>!hit(o,f)));const q=G.local(a.p,c.x,c.y);assert.equal(G.obb({x:o.x+o.w/2,y:o.y+o.h/2,w:o.w,h:o.h,a:0},{x:q.x,y:q.y,w:9,h:4,a:.6}),false);
 }
 assert.deepEqual(out.outdoor[0],old);
});
test('171 actual recipes preserve all previous layers, source minima and budgets while fitting new garden kits',()=>{
 const C=require('../src/codex-coverage167.js');let added=0,groups=0;const kinds=new Set();
 for(const seed of [42,17117])for(const id of ['DW-0001','DW-0002','DW-0006','DW-0018','DW-0040','DW-0101','DW-0401','DW-0501','DW-1001']){
  const old=P.inspect(id,seed,0,8),next=P.inspect(id,seed,0,9);assert.deepEqual(next.p,old.p);assert.deepEqual(next.plan,old.plan);assert.deepEqual(next.details.interior,old.details.interior);assert.deepEqual(next.details.outdoor.filter(o=>!o.garden171),old.details.outdoor);
  const before=C.compare(old).totals,after=C.compare(next).totals;assert.equal(after.furnitureBelowMinimum,before.furnitureBelowMinimum);assert.equal(after.unmaterialized,before.unmaterialized);assert.equal(after.exteriorSimplifications,before.exteriorSimplifications);assert.equal(after.newLootRecords,0);
  const base=Q.accessGrid(old.p,0,old.plan,old.details),grid=Q.accessGrid(next.p,0,next.plan,next.details);if(base.baseline)assert.ok(Q.anchorCells(old.p,0,old.plan,base).every(i=>grid.reachable[i]));
  added+=next.details.gardens171.added;groups+=next.details.gardens171.groups.length;next.details.outdoor.filter(o=>o.garden171).forEach(o=>kinds.add(o.kind));
 }assert.ok(added>0&&groups>0);console.log('GARDENS171_RECIPES '+JSON.stringify({recipes:18,added,groups,kinds:[...kinds]}));
});
test('171 real world collision, LOS, old container budgets and streaming include the opt-in only',()=>{
 const a=W.create(17117,8,{detailVersion:8}),b=W.create(17117,8,{detailVersion:9});assert.equal(hash(a.pois),hash(b.pois));assert.equal(hash(a.roads),hash(b.roads));let added=0,solids=0,sites=0;let remembered=null;
 for(const p of b.pois){const old=a.pois.find(q=>q.id===p.id);const prior=a.detailAt(old,0),next=b.detailAt(p,0);sites++;
  assert.deepEqual(b.plan(p,0),a.plan(old,0));assert.deepEqual(next.interior,prior.interior);assert.deepEqual(next.outdoor.filter(o=>!o.garden171),prior.outdoor);
  for(const o of next.outdoor.filter(o=>o.garden171)){added++;const q=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.equal(b.containers(q.x,q.y,2,0,p.id).some(x=>x.id===o.id),false);if(o.solid){solids++;assert.equal(b.blocked(q.x,q.y,.05,0,p.id),true);assert.equal(b.line(q,{x:q.x+.1,y:q.y+.1},0,p.id),false);}remembered={p,hash:hash(next)};}
  if(sites>=65&&solids>0)break;
 }
 assert.ok(added>0&&solids>0);for(const p of b.pois.slice(65,140))b.detailAt(p,0);assert.equal(hash(b.detailAt(remembered.p,0)),remembered.hash);console.log('GARDENS171_WORLD '+JSON.stringify({sites,added,solids}));
});
test('171 depot activation preserves every persisted field, rejects failed restores and does not rerun',()=>{
 const Ops=require('../src/world-pack131.js'),S=require('../src/frontier-state.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snapshot=()=>{const d=g.serialize();delete d.timestamp;return d;},before=snapshot(),restore=g.restoreSave;
 g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(9).ok,false);assert.deepEqual(snapshot(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(9).ok,false);g.player.reload=0;
 const action=g.worldOps131.actions().find(a=>a.id==='gardens171');assert.ok(action&&!action.disabled);assert.equal(action.run().ok,true);const after=snapshot();assert.equal(after.frontier.detailVersion,9);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);
 assert.equal(g.worldOps131.upgradeDetails159(9).ok,false);for(let v=0;v<=9;v++)assert.equal(S.normalize({...S.initial(),detailVersion:v}).detailVersion,v);for(const v of [11,-1,1.5,'9',null,true])assert.throws(()=>S.normalize({...S.initial(),detailVersion:v}));
});
test('171 migration protects a placed lamp even when the new garden surface is traversable',()=>{
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const old=W.create(17117,8,{detailVersion:8}),next=W.create(17117,8,{detailVersion:9});let point;
 for(const p of next.pois){for(const o of next.detailAt(p,0).outdoor.filter(o=>o.garden171&&!o.solid)){
  const q=G.global(p,o.x+o.w/2,o.y+o.h/2);if(!old.blocked(q.x,q.y,.4,0,null)&&!next.blocked(q.x,q.y,.4,0,null)){point=q;break;}
 }if(point)break;}
 assert.ok(point,'explicit free fixture under a proposed non-blocking garden surface');
 const data=g.serialize();data.frontier.detailVersion=8;data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:60,on:false,used:true,domain:'region',...point,z:0,inside:null,angle:0}]};
 assert.equal(g.restoreSave(data),true);const snapshot=()=>{const s=g.serialize();delete s.timestamp;return s;},before=snapshot();
 const result=g.worldOps131.upgradeDetails159(9);assert.equal(result.ok,false);assert.match(result.reason,/équipement régional/);assert.deepEqual(snapshot(),before);
});
