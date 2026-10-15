'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas');
const F=require('../src/codex-fixtures164.js'),G=require('../src/frontier-geometry.js'),Q=require('../src/codex3000-recipes159.js'),D=require('../src/codex-density163.js'),Art=require('../src/seed-detail-art157.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rules={revision:13,maxPerSite:8,maxPerFloor:4,maxPerRoom:1,maxCandidates:72,maxGridAudits:48,minRoomArea:3,clearance:.9,collisionGap:.04,roomTolerance:.5,shapes:{toilet:[.70,.78],latrine:[.75,.85]}};
function fixture(){
 const p={id:'P0164',type:'warehouse',codex:'DW-0012',x:200,y:300,a:.4,w:10,h:9,levels:[0],parking:[],outdoor:[],generation:10};
 const room={name:'Sanitaires',x:.4,y:.4,w:9.2,h:8.2};
 const plan={rooms:[room],walls:[{x:0,y:0,w:3.4,h:.24},{x:6.6,y:0,w:3.4,h:.24},{x:0,y:8.76,w:3.4,h:.24},{x:6.6,y:8.76,w:3.4,h:.24},{x:0,y:0,w:.24,h:9},{x:9.76,y:0,w:.24,h:9}],stairs:[],objects:[{id:'finite-sink',kind:'sink',x:1,y:1,w:.8,h:.65,amount:7,resource:'scrap'}]};
 const description={id:'DW-0012',name:'Maison mobile en parc',rooms:[{name:room.name,levels:[0],exterior:false,authoredProps:[{asset:'sink'}]}]};
 return {seed:42,p,z:0,plan,detail:{interior:[],outdoor:[]},description,geometry:G,recipes:Q,detailVersion:13,rules};
}
function assertAccess(args,value){
 const safe=D.reservations(args.plan,1),plan={...args.plan,walls:[...args.plan.walls,...safe]},before=Q.accessGrid(args.p,args.z,plan,args.detail),after=Q.accessGrid(args.p,args.z,plan,value);
 assert.ok(before.baseline&&after.baseline);assert.ok(Q.anchorCells(args.p,args.z,plan,before).every(i=>after.reachable[i]));
 for(const o of value.interior.filter(o=>o.fixture164))for(const[x,y]of F.servicePoints(o)){const i=after.at(x,y);assert.ok(i>=0&&after.reachable[i]);}
 assert.ok(value.fixtures164.gridAudits<=rules.maxGridAudits);assert.ok(value.fixtures164.candidateChecks<=rules.maxCandidates*value.fixtures164.requests.length);
}
test('164 washroom fixtures: revision13 adds one visible, reachable WC without changing prior fixtures, stock or inputs',()=>{
 const args=fixture(),before=hash(args),value=F.enrich(args);assert.equal(hash(args),before);assert.equal(value.fixtures164.added,1);assert.equal(value.interior[0].kind,'toilet');
 const o=value.interior[0];assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.utilityConnected164,false);assert.equal(o.quantitySource164,'derived-use-not-author-minimum');
 assert.ok(Art.presentationFor(o.kind));assertAccess(args,value);assert.strictEqual(F.enrich({...args,detail:value}),value);assert.deepEqual(F.enrich(args),value);
 for(const revision of [0,5,11,12])assert.strictEqual(F.enrich({...args,detailVersion:revision}),args.detail);
});
test('164 washroom fixtures: sanitary goods, uncertain use, shower-only spaces and wrong floors never become toilets',()=>{
 for(const name of ['Stockage des modules sanitaires','Préparation des cartons sanitaires','Inspection des lots sanitaires','Chambre noire des bains','Douches','Atelier de toilettage animalier']){
  const args=fixture();args.plan.rooms[0].name=name;args.description.rooms[0].name=name;const value=F.enrich(args);assert.equal(value.fixtures164.added,0,name);assertAccess(args,value);
 }
 for(const change of [a=>a.description.rooms[0].exterior=true,a=>a.description.rooms[0].levels=[1],a=>{a.description.rooms[0].authoredProps=[];a.plan.objects=[];},a=>{a.description.rooms.push({...a.description.rooms[0],authoredProps:[]});a.plan.objects=[];}]){
  const args=fixture();change(args);assert.equal(F.enrich(args).fixtures164.added,0);
 }
});
test('164 washroom fixtures: actual fixtures prevent duplicates and explicit latrines retain their own physical kind',()=>{
 const args=fixture();args.plan.objects.push({id:'old-toilet',kind:'toilet',x:8,y:1,w:.7,h:.78,amount:3,resource:'scrap'});let value=F.enrich(args);assert.equal(value.fixtures164.added,0);assert.equal(value.fixtures164.requests[0].reason,'already-present');
 const latrine=fixture();latrine.plan.rooms[0].name=latrine.description.rooms[0].name='Latrines';latrine.description.rooms[0].authoredProps=[{asset:'latrine'}];value=F.enrich(latrine);assert.equal(value.fixtures164.added,1);assert.equal(value.interior[0].kind,'latrine');assertAccess(latrine,value);
});
test('164 washroom fixtures: context barriers, operation lanes and older service faces stay free',()=>{
 const args=fixture();args.plan.movement160=[{id:'context-blocker',x:7,y:2,w:2,h:2}];args.plan.operations160=[{kind:'restoreAccess',anchor:{x:4,y:4},supportId:'gate'}];args.plan.visuals160=[{id:'gate',x:2,y:4,w:1,h:.5}];
 args.detail.interior=[{id:'old-cabinet',kind:'smallCabinet',solid:true,x:7,y:6,w:1,h:.5,front160:{x:7,y:6.5,w:1,h:1},service173:[{x:8,y:6.5,w:1,h:1}]}];
 const value=F.enrich(args);assert.equal(value.fixtures164.added,1);assert.strictEqual(value.interior[0],args.detail.interior[0]);assertAccess(args,value);
 const barrier=fixture();barrier.plan.walls.push({x:3,y:-2,w:4,h:3});const refused=F.enrich(barrier);assert.equal(refused.fixtures164.added,0);assert.equal(refused.fixtures164.navigationChecked,false);assert.equal(refused.fixtures164.reason,'baseline-inaccessible');
 const limited=F.enrich({...fixture(),rules:{...rules,maxGridAudits:2}});assert.equal(limited.fixtures164.added,0);assert.ok(limited.fixtures164.gridAudits<=2);
 assert.throws(()=>F.enrich({...fixture(),p:{...fixture().p,w:Infinity}}),/Contrat de sanitaires164 invalide/);
 assert.throws(()=>F.enrich({...fixture(),rules:{...rules,maxGridAudits:1}}),/Budgets de sanitaires164 invalides/);
});
test('164 care presentation: only the explicit paid-care support is annotated and every physical field stays exact',()=>{
 const plan={objects:[{id:'care',kind:'bench',x:1,y:2,w:1.8,h:.65,amount:7,resource:'wood',metadata:{intact:true}},{id:'nearby',kind:'bed',x:4,y:2,w:2,h:1.6}],operations160:[{key:'care',kind:'medicalCare',supportId:'care',anchor:{x:2,y:3,z:0}}]},before=hash(plan);
 for(const revision of [0,11,12])assert.strictEqual(F.annotatePlan({plan,detailVersion:revision}),plan);
 const next=F.annotatePlan({plan,detailVersion:13});assert.equal(hash(plan),before);assert.equal(Object.isFrozen(plan.objects[0].metadata),false);assert.strictEqual(next.objects[1],plan.objects[1]);assert.strictEqual(next.operations160,plan.operations160);
 const {fixture164,...physical}=next.objects[0];assert.deepEqual(physical,plan.objects[0]);assert.equal(fixture164.kind,'firstAidRoll');assert.equal(next.fixtures164.careSupports,1);assert.strictEqual(F.annotatePlan({plan:next,detailVersion:13}),next);
});
test('164 care presentation: all55 actual G10 supports get a matching medical dressing without moving or granting resources',()=>{
 const X=require('../src/codex-context160.js'),CG=require('../src/codex-geometry160.js');let count=0;const kinds=new Set();
 for(const card of X.records){
  const p={id:'audit164-'+card.id,type:X.typeFor(card.id),codex:card.id,programme160:card.id,w:card.w,h:card.h,levels:card.levels,context160:card};
  const plan=CG.plan(p,42,0,12),ops=plan.operations160.filter(op=>op.kind==='medicalCare');if(!ops.length)continue;
  const before=hash(plan),next=F.annotatePlan({plan,detailVersion:13}),actual=CG.plan(p,42,0,13);assert.equal(hash(plan),before);assert.strictEqual(next.operations160,plan.operations160);assert.deepEqual(actual,next,'The real context plan routes revision13 through the same fixture owner');
  for(const op of ops){const old=plan.objects.find(o=>o.id===op.supportId),o=next.objects.find(o=>o.id===op.supportId);assert.ok(o.fixture164);const{fixture164,...physical}=o;assert.deepEqual(physical,old);assert.equal(fixture164.operationKey,op.key);kinds.add(fixture164.kind);count++;}
 }
 assert.equal(count,55);assert.deepEqual([...kinds].sort(),['careBed','firstAidRoll','medicalShelf','treatmentTray']);
});
test('164 medical and sanitary drawings: deterministic variants stay inside support with no RNG, mutation or canvas-state leak',()=>{
 const oldRandom=Math.random;Math.random=()=>assert.fail('No presentation RNG');
 try{for(const kind of ['toilet','latrine','careBed','medicalShelf','firstAidRoll','treatmentTray']){
  const digests=new Set(),geometries=new Set();for(let seed=0;seed<16;seed++){
   const canvas=createCanvas(200,180),native=canvas.getContext('2d'),calls=[];
   const c=new Proxy(native,{get(target,key){const value=Reflect.get(target,key,target);return typeof value==='function'?function(...args){if(['fillRect','strokeRect','ellipse','moveTo','lineTo'].includes(key))calls.push([key,...args]);return value.apply(target,args);}:value;},set(target,key,value){return Reflect.set(target,key,value,target);}});
   const o={id:'fixture-'+kind,kind:['toilet','latrine'].includes(kind)?kind:'bench',x:20,y:30,w:140,h:100,fixture164:{revision:13,kind}},before=hash(o),matrix=c.getTransform().toJSON();c.globalAlpha=.8;c.filter='contrast(1.1)';
   const paint=()=>['toilet','latrine'].includes(kind)?Art.draw(c,o,{art:{images:{}},seed}):Art.paintFixture164(c,o,{seed});assert.equal(paint(),true);assert.equal(hash(o),before);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,.8);assert.equal(c.filter,'contrast(1.1)');
   const data=c.getImageData(0,0,200,180).data;let ink=0;for(let y=0;y<180;y++)for(let x=0;x<200;x++)if(data[(y*200+x)*4+3]){ink++;assert.ok(x>=20&&x<160&&y>=30&&y<130,kind+' respects the physical support');}assert.ok(ink>1000);digests.add(hash([...data]));geometries.add(hash(calls));
  }assert.equal(digests.size,4,kind+' contains four visible stable variants');assert.equal(geometries.size,4,kind+' has four different forms or arrangements independently of palette');
 }}finally{Math.random=oldRandom;}
 assert.equal(Art.paintFixture164(createCanvas(10,10).getContext('2d'),null),false);
 assert.equal(Art.paintFixture164(null,{fixture164:{revision:13,kind:'careBed'}}),false);
});
test('164 real personal washrooms gain physical fixtures while spare-parts programmes stay untouched',()=>{
 const P=require('../src/codex-plan165.js'),R=require('../src/codex3000-runtime.js');let additions=0;
 for(const id of ['DW-0012','DW-0038','DW-0042','DW-0069','DW-0108','DW-0141','DW-0189','DW-0515']){
  const base=P.inspect(id,17117,0,12),args={seed:base.seed,p:base.p,z:0,plan:base.plan,detail:base.details,description:R.describe(id),geometry:G,recipes:Q,detailVersion:13,rules},before=hash(base),value=F.enrich(args);
  assert.equal(hash(base),before);assert.ok(value.fixtures164.requests.length>0,id+' has a real washroom');assertAccess(args,value);additions+=value.fixtures164.added;
 }
 assert.ok(additions>0,'Real source washrooms receive WC fixtures, rather than fixtures existing only in synthetic tests');
 for(const id of ['DW-3624','DW-3771','DW-3772','DW-3786','DW-3937']){
  const base=P.inspect(id,17117,0,12),value=F.enrich({seed:base.seed,p:base.p,z:0,plan:base.plan,detail:base.details,description:R.describe(id),geometry:G,recipes:Q,detailVersion:13,rules});assert.equal(value.fixtures164.added,0);assert.equal(value.fixtures164.requests.length,0);
 }
});
