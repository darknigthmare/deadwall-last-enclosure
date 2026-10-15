'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),X=require('../src/codex-context160.js'),Geo=require('../src/codex-geometry160.js'),A=require('../src/codex-architecture163.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
const cards=X.records.filter(c=>c.implementation160?.fullyImplementedReference===false),hash=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
const parcel=(c,id='P0999')=>({...X.preset(X.typeFor(c.id)),id,type:X.typeFor(c.id),programme160:c.id,context160:c,x:c.w/2,y:c.h/2,a:0,outdoor:[],parking:[]});
const centre=o=>({x:o.x+o.w/2,y:o.y+o.h/2});
function blocked(p,pl,q,r=.32){return Geo.terrainMovement(p,pl,q.x,q.y,r)||[...pl.walls,...pl.objects].some(o=>G.circleRect(q.x,q.y,r,o));}
function freeSegment(p,pl,a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.12);for(let i=0;i<=n;i++){const t=n?i/n:0;if(blocked(p,pl,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}return true;}

test('163 architecture keeps the actual eighteen campaign sites byte-identical at revisions0..11',()=>{
 const effects={detailVersion:0},world=W.create(42,10,effects),ids=new Set(cards.map(c=>c.id)),sites=world.contextSites160().filter(p=>ids.has(p.programme160));
 assert.equal(sites.length,18);
 for(let revision=0;revision<=11;revision++){
  effects.detailVersion=revision;
  const records=sites.map(p=>({id:p.id,programme:p.programme160,w:p.w,h:p.h,levels:p.levels,pose:{x:p.x,y:p.y,a:p.a},placeSHA256:hash(p),plans:p.levels.map(z=>({z,planSHA256:hash(world.plan(p,z)),budgetSHA256:hash(world.plan(p,z).objects),detailSHA256:hash(world.detailAt(p,z))}))}));
  assert.equal(hash(records),'60f65cc2d9f47a529e79c890c0f3f5c31d9c76a629bf5941830808e1a8c42e5b','Frozen baseline revision '+revision);
 }
});

test('163 architecture adds one reachable pedestrian plane per reference, preserving every historical stock and operation',()=>{
 assert.equal(cards.length,18);
 for(const seed of [42,17117,4294967295])for(const card of cards){
  const original=hash(card),p=parcel(card),before=Geo.plan(p,seed,0,11);Geo.decorate(p,seed,12);
  assert.deepEqual(p.legacyLevels160,[0]);assert.deepEqual(card.sourceLevels,[0]);assert.equal(p.levels.length,2);
  const ground=Geo.plan(p,seed,0,12),z=p.levels.find(z=>z!==0),upper=Geo.plan(p,seed,z,12),stair=centre(ground.stairs[0]);
  assert.deepEqual(ground.objects,before.objects,card.id+' ground finite objects');assert.deepEqual(ground.operations160,before.operations160,card.id+' paid work');
  assert.equal(ground.stairs.length,1);assert.deepEqual(upper.stairs,ground.stairs);assert.equal(upper.objects.length,0);assert.equal(upper.operations160.length,0);
  assert.equal(blocked(p,ground,stair),false,card.id+' ground landing');assert.equal(blocked(p,upper,stair),false,card.id+' added landing');
  const turn={x:stair.x,y:p.h/2},end={x:C.ContextArchitectureRules163.walkWidth,y:p.h/2};
  assert.ok(freeSegment(p,upper,stair,turn)&&freeSegment(p,upper,turn,end),card.id+' physical inspection route');
  assert.equal(blocked(p,upper,{x:.33,y:.33}),true,card.id+' no unsupported walk outside the deck');
  assert.ok(upper.movement160.some(o=>o.kind==='inspectionRail'));assert.ok(upper.movement160.some(o=>o.kind==='unsupportedInspection'&&!o.opaque));
  assert.equal(p.context160.implementation160.fullyImplementedReference,false);assert.equal(p.context160.implementation160.sourceText160,card.implementation160.text);
  assert.match(p.context160.implementation160.text,/accessible à pied/);assert.equal(hash(card),original,'Frozen author contract unchanged');
  assert.deepEqual(Geo.plan(p,seed,z,12),upper,'Reconstruction has no RNG or hidden state');
 }
});

test('163 architecture refuses invalid levels and leaves other territorial programmes on their existing grammar',()=>{
 const card=X.get('DW-0266'),p=parcel(card);Geo.decorate(p,42,12);
 assert.throws(()=>Geo.plan(p,42,-1,12),/absent/);
 const ordinary=X.records.find(c=>!A.supports(c)),q=parcel(ordinary);Geo.decorate(q,42,12);
 assert.equal(q.architecture163,undefined);assert.equal(q.legacyLevels160,undefined);assert.deepEqual(q.levels,ordinary.levels);
});

test('163 actual campaign collision queries share every added stair and inspection support after rotation',()=>{
 const before=W.create(42,10,{detailVersion:11}),world=W.create(42,10,{detailVersion:12}),sites=world.contextSites160().filter(p=>p.architecture163);
 assert.equal(sites.length,18);
 for(const p of sites){
  const prior=before.pois.find(q=>q.id===p.id),ground=world.plan(p,0),z=p.levels.find(z=>z!==0),added=world.plan(p,z),local=centre(ground.stairs[0]),start=G.global(p,local.x,local.y),
   turn=G.global(p,local.x,p.h/2),end=G.global(p,C.ContextArchitectureRules163.walkWidth,p.h/2),outside=G.global(p,.33,.33);
  assert.deepEqual(ground.objects,before.plan(prior,0).objects,p.programme160+' actual IDs and amounts');assert.deepEqual(p.legacyLevels160,prior.levels);
  assert.equal(world.blocked(start.x,start.y,.32,0,p.id),false);assert.equal(world.blocked(start.x,start.y,.32,z,p.id),false);
  assert.ok(world.movementLine(start,turn,z,p.id,null,.32)&&world.movementLine(turn,end,z,p.id,null,.32),p.programme160+' actual world route');
  assert.equal(world.blocked(outside.x,outside.y,.32,z,p.id),true);assert.equal(world.movementLine(start,outside,z,p.id,null,.32),false);
  assert.deepEqual(added.stairs,ground.stairs);assert.equal(world.detailAt(p,z).interior.length,0);assert.equal(world.detailAt(p,z).outdoor.length,0);
  assert.throws(()=>{added.stairs[0].x+=1;},TypeError,'A preview cannot alter the shared staircase');
 }
});

test('163 specialized floor renderer draws the same measured stair in both planes without changing the plans',()=>{
 const {createCanvas}=require('@napi-rs/canvas');require('../src/frontier-art.js');
 const renderer=globalThis.DeadwallFrontierArt,card=X.get('DW-0348'),p=parcel(card);Geo.decorate(p,42,12);
 const before=hash(p),calls=[],old=globalThis.DeadwallStructureArt159;
 globalThis.DeadwallStructureArt159={...(old||{}),drawStair:(c,art,s,o)=>{calls.push({stair:structuredClone(s),floor:o.floor});return false;}};
 try{
  for(const z of p.levels){
   const canvas=createCanvas(600,400),ctx=canvas.getContext('2d'),pl=Geo.plan(p,42,z,12),snapshot=hash(pl);ctx.scale(12,12);
   renderer.lotFloor(ctx,p,{inside:p.id,z,world:{seed:42,plan:()=>pl}},{art:{images:{}},worldEvolution:{structureDestroyed:()=>false},serialize:()=>assert.fail('Painting is read only')});
   assert.ok(canvas.getContext('2d').getImageData(0,0,600,400).data.some((v,i)=>i%4===3&&v>0));assert.equal(hash(pl),snapshot);
  }
 }finally{globalThis.DeadwallStructureArt159=old;}
 assert.equal(calls.length,2);assert.deepEqual(calls[0].stair,calls[1].stair);assert.deepEqual(calls.map(o=>o.floor),[0,1]);assert.equal(hash(p),before);
});
