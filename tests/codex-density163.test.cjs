'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),H=require('../src/codex-density163.js'),G=require('../src/frontier-geometry.js'),Q=require('../src/codex3000-recipes159.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hit=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w>b.x-gap&&a.y<b.y+b.h+gap&&a.y+a.h>b.y-gap;
const extras=detail=>detail.interior.filter(o=>o.density163);

function fixture({width=24,height=18,usage='workshop',kind='workbench',levels=[0]}={}){
 const p={id:'P0163',type:'warehouse',codex:'DW-3001',x:200,y:300,a:.4,w:width,h:height,levels,parking:[],outdoor:[],generation:9};
 const room={name:'Atelier de réparation',x:.4,y:.4,w:width-.8,h:height-.8},cx=width/2;
 const plan={rooms:[room],walls:[{x:0,y:0,w:cx-1.6,h:.24},{x:cx+1.6,y:0,w:width-cx-1.6,h:.24},{x:0,y:height-.24,w:cx-1.6,h:.24},{x:cx+1.6,y:height-.24,w:width-cx-1.6,h:.24},{x:0,y:0,w:.24,h:height},{x:width-.24,y:0,w:.24,h:height}],stairs:levels.length>1?[{x:cx-1,y:height/2-1,w:2,h:2}]:[],objects:[{id:'finite-source-container',kind,x:1,y:1.2,w:2,h:.85,amount:7,resource:'scrap'}]};
 const description={id:'DW-3001',name:'Atelier',family:'Services et petits ateliers',rooms:[{name:room.name,levels,exterior:false,sourceProps158:[{kind}]}]};
 const old={id:'previous-11-cabinet',kind:'smallCabinet',x:width-3,y:1,w:1.05,h:.42,solid:true,front160:{x:width-3,y:1.42,w:1.05,h:1.2},furnishing162:true};
 return {seed:42,p,z:0,plan,detail:{interior:[old],outdoor:[],furnishing162:{revision:11,added:1}},description,geometry:G,recipes:Q,classify:()=>({id:usage,confidence:'high',evidence:['fixture-source']})};
}
function assertPhysical(args,result){
 const added=extras(result),safe=H.reservations(args.plan,C.ContextGeometryRules160?.terrainClearance||C.CodexDensity163Rules.clearance).concat(args.reserved||[]),nav={...args.plan,walls:[...args.plan.walls,...safe]};
 const base=Q.accessGrid(args.p,args.z,nav,args.detail),next=Q.accessGrid(args.p,args.z,nav,result);
 assert.ok(base?.baseline&&next?.baseline);assert.ok(Q.anchorCells(args.p,args.z,nav,base).every(i=>next.reachable[i]));
 const solids=[...args.plan.walls,...args.plan.stairs,...args.plan.objects,...result.interior.filter(o=>o.solid&&!o.dressing160),...safe];
 for(const item of added){
  assert.ok(item.solid&&item.front160);assert.equal(item.amount,undefined);assert.equal(item.resource,undefined);assert.equal(item.utilityConnected163,false);
  assert.ok(solids.filter(o=>o!==item).every(o=>!hit(item,o,.039)&&!hit(item.front160,o,.039)),item.id+' keeps physical and service clearance');
  for(const f of H.fronts(item))for(const [x,y]of H.samples(f)){const i=next.at(x,y);assert.ok(i>=0&&next.reachable[i],item.id+' has reachable work faces');}
  for(const old of args.detail.interior)for(const f of H.fronts(old))assert.ok(!hit(item,f,.039),'A previous work face is never occupied');
  assert.equal(item.w,item.angle160%(Math.PI)===0?item.spriteWidth160:item.spriteHeight160);
  assert.equal(item.h,item.angle160%(Math.PI)===0?item.spriteHeight160:item.spriteWidth160);
 }
 for(const old of args.detail.interior)for(const f of H.fronts(old))for(const [x,y]of H.samples(f)){const before=base.at(x,y);if(before>=0&&base.reachable[before])assert.ok(next.reachable[before]);}
 assert.ok(result.density163.gridAudits<=result.density163.maxGridAudits);
 assert.ok(result.density163.candidateChecks<=result.density163.candidateBudget);
}

test('163 large-room composition adds reachable wall furniture and islands, without changing revision11 objects or source stocks',()=>{
 const args=fixture(),before=hash(args),result=H.enrich(args),added=extras(result);
 assert.equal(hash(args),before);assert.ok(added.length>4,'A large room is no longer limited to four additions');assert.ok(added.some(o=>o.placement163==='island'));
 assert.strictEqual(result.interior[0],args.detail.interior[0]);assert.strictEqual(result.furnishing162,args.detail.furnishing162);assert.strictEqual(result.outdoor,args.detail.outdoor);
 assert.equal(result.density163.revision,12);assert.equal(result.density163.added,added.length);assert.equal(result.density163.scope,'derived-usable-area-not-authored-minima');
 assert.deepEqual(result,H.enrich(args));assert.strictEqual(H.enrich({...args,detail:result}),result);assert.equal(new Set(result.interior.map(o=>o.id)).size,result.interior.length);
 assertPhysical(args,result);
 const art=require('../src/seed-detail-art157.js');for(const item of added)assert.ok(art.presentationFor(item.kind),item.kind+' has an actual renderer');
});

test('163 union area counts overlapping reservations once and clips them to the actual room',()=>{
 const room={x:0,y:0,w:10,h:10},boxes=[{x:-2,y:0,w:8,h:5},{x:4,y:0,w:8,h:5},{x:0,y:8,w:10,h:4}];
 assert.equal(H.unionArea(room,boxes),70);assert.equal(H.unionArea(room,[...boxes,...boxes]),70);
});

test('163 occupied bedrooms and tiny rooms remain sparse instead of acquiring hall-scale inventories',()=>{
 for(const [width,height]of [[5,4],[3,3]]){
  const args=fixture({width,height,usage:'sleeping',kind:'bed'});args.detail.interior=[];
  args.plan.objects[0]={id:'existing-bed',kind:'bed',x:.5,y:.6,w:2.05,h:1.6,amount:6,resource:'wood'};
  const result=H.enrich(args);assert.equal(extras(result).length,0);assert.equal(result.density163.navigationChecked,true);
 }
 const args=fixture({width:6,height:4,usage:'sleeping'}),result=H.enrich(args);assert.ok(extras(result).length<=C.CodexDensity163Rules.smallRoomMax);assert.ok(!extras(result).some(o=>o.kind==='bed'));
});

test('163 source refusal preserves exterior, wrong-level, ambiguous and unresolved room purposes',()=>{
 for(const change of [a=>a.description.rooms[0].exterior=true,a=>a.description.rooms[0].levels=[1],a=>a.classify=()=>null,a=>{a.description.rooms.push({...a.description.rooms[0],name:'Other source'});a.plan.rooms[0].name='Unresolved actual room';}]){
  const args=fixture();change(args);const result=H.enrich(args);assert.equal(extras(result).length,0);assert.deepEqual(result.interior,args.detail.interior);
 }
 const args=fixture();args.description.rooms.push({...args.description.rooms[0],conflicting:true});args.classify=s=>({id:s.conflicting?'storage':'workshop'});
 assert.equal(extras(H.enrich(args)).length,0);
 const specialized=fixture();specialized.p.context160={profile:'rail'};assert.strictEqual(H.enrich(specialized),specialized.detail);
});

test('163 collision and circulation reserve physical context, intervention lanes and every older service field',()=>{
 const args=fixture();args.plan.movement160=[{id:'context-barrier',x:3,y:5,w:4,h:3}];args.plan.gates160=[{id:'closed-gate',x:17,y:10,w:3,h:1}];
 args.plan.visuals160=[{id:'operation-support',x:14,y:4,w:1,h:1}];args.plan.operations160=[{anchor:{x:11,y:4.5},supportId:'operation-support'}];
 args.detail.interior[0].service173=[{x:args.p.w-3,y:1.42,w:1.05,h:1.2}];
 args.detail.interior[0].access165={x:args.p.w-3,y:2.7,w:1.05,h:.9};
 const result=H.enrich(args);assert.ok(extras(result).length>0);assertPhysical(args,result);
 assert.deepEqual(args.plan.operations160,[{anchor:{x:11,y:4.5},supportId:'operation-support'}]);
});

test('163 G10 placement-only reservations remain obstacles but never count as furnished contents',()=>{
 const args=fixture(),barrier={id:'context-placement-reservation',kind:'reserved-context162',x:4,y:5,w:2,h:2,solid:true,placementOnly162:true};args.detail.interior.push(barrier);
 const result=H.enrich(args);assert.equal(result.density163.requests[0].existing,2,'Only the finite source and old real cabinet count');
 assert.strictEqual(result.interior[1],barrier);assert.ok(extras(result).length>0);assertPhysical(args,result);
});

test('163 every floor shares the site cap and its expensive navigation work has an explicit bound',()=>{
 const args=fixture({levels:[-1,0,1,2]});assert.equal(args.p.levels.reduce((n,z)=>n+H.floorBudget(args.p,z,C.CodexDensity163Rules),0),C.CodexDensity163Rules.maxPerSite);
 let total=0;for(const z of args.p.levels){const floor={...args,z},result=H.enrich(floor);total+=extras(result).length;assert.ok(extras(result).length<=H.floorBudget(args.p,z,C.CodexDensity163Rules));assertPhysical(floor,result);}
 assert.ok(total<=C.CodexDensity163Rules.maxPerSite);
 const limited={...fixture(),rules:{...C.CodexDensity163Rules,maxGridAudits:2}},result=H.enrich(limited);
 assert.equal(result.density163.gridAudits,2);assert.equal(extras(result).length,0);assert.equal(result.density163.reason,'navigation-budget');
});

test('163 unreachable baseline refuses composition instead of reporting validated access',()=>{
 const args=fixture();args.plan.walls.push({x:args.p.w/2-2,y:-2,w:4,h:3});const result=H.enrich(args);
 assert.equal(extras(result).length,0);assert.equal(result.density163.navigationChecked,false);assert.equal(result.density163.reason,'baseline-inaccessible');
});

test('163 an unpainted catalogue shape cannot create an invisible obstacle and invalid audit budgets are refused',()=>{
 const args=fixture();args.rules={...C.CodexDensity163Rules,profiles:{...C.CodexDensity163Rules.profiles,workshop:{...C.CodexDensity163Rules.profiles.workshop,kinds:['steelTable']}}};
 const result=H.enrich(args);assert.equal(extras(result).length,0);assert.equal(result.density163.requests[0].reason,'unsupported-rendered-kind');
 assert.deepEqual(result.density163.requests[0].unsupportedKinds,['steelTable']);
 assert.throws(()=>H.enrich({...args,rules:{...args.rules,maxGridAudits:1}}),/Budgets de densité163 invalides/);
});

test('163 new props can use unscaled authored footprints while previous details retain exact dimensions',()=>{
 const args=fixture({usage:'office'});args.shapeFor=kind=>kind==='desk'?{w:2.2,h:.9,source:'authored'}:null;
 const before=hash(args.detail),result=H.enrich(args),desks=extras(result).filter(o=>o.kind==='desk');assert.ok(desks.length>0);
 for(const desk of desks){assert.equal(desk.spriteWidth160,2.2);assert.equal(desk.spriteHeight160,.9);}
 assert.equal(hash(args.detail),before);assertPhysical(args,result);
});

test('163 real source programmes keep prior geometry, loot and revision11 while density is composed by reliable use',()=>{
 const P=require('../src/codex-plan165.js'),R=require('../src/codex3000-runtime.js');let added=0;
 for(const seed of [42,17117])for(const id of ['DW-0001','DW-0221','DW-1204','DW-3041','DW-3381','DW-3960']){
  const before=P.inspect(id,seed,0,11),args={seed,p:before.p,z:0,plan:before.plan,detail:before.details,description:R.describe(id),geometry:G,recipes:Q},serialized=hash(args),result=H.enrich(args);
  assert.equal(hash(args),serialized);assert.deepEqual(result.interior.filter(o=>!o.density163),before.details.interior);assert.strictEqual(result.outdoor,before.details.outdoor);
  assert.ok(result.density163.navigationChecked||result.density163.reason==='baseline-inaccessible');if(result.density163.navigationChecked)assertPhysical(args,result);
  if(before.details.colliders160)assert.ok(extras(result).every(o=>result.colliders160.interior.includes(o)));
  added+=extras(result).length;
 }
 assert.ok(added>0,'Shipped source rooms actually gain composition');
});
