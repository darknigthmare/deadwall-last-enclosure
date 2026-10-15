'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../src/codex-furnishing162.js'),G=require('../src/frontier-geometry.js'),Q=require('../src/codex3000-recipes159.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hit=(a,b,margin=0)=>a.x<b.x+b.w+margin&&a.x+a.w>b.x-margin&&a.y<b.y+b.h+margin&&a.y+a.h>b.y-margin;
const samples=f=>[[f.x+f.w/2,f.y+f.h/2],...(f.w>=f.h?[[f.x+f.w*.25,f.y+f.h/2],[f.x+f.w*.75,f.y+f.h/2]]:[[f.x+f.w/2,f.y+f.h*.25],[f.x+f.w/2,f.y+f.h*.75]])];

function fixture(name='Atelier de réparation',kind='workbench',levels=[0]){
 const p={id:'P0162',type:'warehouse',codex:'DW-3001',x:200,y:300,a:.4,w:24,h:18,levels,parking:[],outdoor:[],generation:8};
 const room={name,x:.4,y:.4,w:23.2,h:17.2};
 const plan={rooms:[room],walls:[{x:0,y:0,w:10.4,h:.24},{x:13.6,y:0,w:10.4,h:.24},{x:0,y:17.76,w:10.4,h:.24},{x:13.6,y:17.76,w:10.4,h:.24},{x:0,y:0,w:.24,h:18},{x:23.76,y:0,w:.24,h:18}],stairs:[],objects:[{id:'source-container',kind,x:1,y:1.2,w:1.8,h:.8,solid:true,amount:7,resource:'scrap'}]};
 const description={id:'DW-3001',rooms:[{...room,id:'espace-01',levels,exterior:false,kit:Q.kitFor(name),sourceProps158:[{kind,resource:'scrap'}],props:[],authoredProps:[]}]};
 return {seed:42,p,z:0,plan,detail:{interior:[],outdoor:[]},description,geometry:G,recipes:Q};
}
const additions=(before,after)=>after.interior.filter(item=>!before.interior.some(old=>old.id===item.id));

function assertPhysical(args,result){
 const extras=additions(args.detail,result),base=Q.accessGrid(args.p,args.z,args.plan,args.detail),next=Q.accessGrid(args.p,args.z,args.plan,result);
 assert.ok(base?.baseline&&next?.baseline);
 assert.ok(Q.anchorCells(args.p,args.z,args.plan,base).every(index=>next.reachable[index]),'Previously reachable room, stair and container anchors remain reachable');
 const solids=[...args.plan.walls,...args.plan.stairs,...args.plan.objects,...result.interior.filter(item=>item.solid!==false)];
 for(const item of extras){
  assert.ok(item.front160,'New physical furniture exposes an accessible service face');
  assert.ok(item.solid);assert.equal(item.amount,undefined);assert.equal(item.resource,undefined);
  assert.ok(solids.filter(other=>other!==item).every(other=>!hit(item,other,.015)&&!hit(item.front160,other,.015)),item.id+' body and face are clear');
  for(const [x,y]of samples(item.front160)){const index=next.at(x,y);assert.ok(index>=0&&next.reachable[index],item.id+' service face is reachable');}
  for(const old of args.detail.interior)for(const front of [old.front160,old.access165].filter(Boolean))assert.ok(!hit(item,front,.015),'Existing furniture keeps its access zone');
 }
}

test('162 independent furnishing: actual usage adds deterministic physical furniture without changing source containers',()=>{
 const args=fixture(),before=hash(args),result=H.enrich(args);
 assert.equal(hash(args),before);assert.deepEqual(result,H.enrich(args));assert.strictEqual(H.enrich({...args,detail:result}),result);
 assert.equal(result.furnishing162.revision,11);assert.equal(result.furnishing162.scope,'derived-usage-not-authored-minima');
 assert.ok(result.furnishing162.added>0);assert.equal(result.furnishing162.added,additions(args.detail,result).length);assert.ok(result.furnishing162.navigationChecked);
 assert.equal(new Set(result.interior.map(item=>item.id)).size,result.interior.length);
 assert.deepEqual(result.outdoor,args.detail.outdoor);assertPhysical(args,result);
 const Art=require('../src/seed-detail-art157.js');for(const item of additions(args.detail,result))assert.ok(Art.presentationFor(item.kind),item.kind+' has a real renderer');
});

test('162 usage guards: inventory and explicit purpose override accidental kit substring matches',()=>{
 const source=(name,kind)=>({name,sourceProps158:[{kind}],kit:Q.kitFor(name)});
 for(const [name,kind]of [['Chambre du foyer','bed'],['Atelier de réparation','workbench'],['Cuisine des occupants','fridge'],['Vestiaire et pause de l’équipe','fridge'],['Réserve documentaire','shelf'],['Bureau de relevés','desk']])assert.ok(H.usage(source(name,kind)),name);
 for(const [name,kind]of [['Chambre des lots en attente','palletStack'],['Examen des fermetures de chambre','steelTable'],['Examen des modules de cuisson','palletStack'],['Préparation personnelle des équipes civiles','medical'],['Refroidissement sur plateaux','dishRack'],['Vérification des boîtiers de lecture','electricalRack']])assert.ok(!H.usage(source(name,kind)),name+' does not inherit its misleading kit');
 const vestibule=fixture('Vestibule des affaires de séjour','desk'),result=H.enrich(vestibule);
 assert.ok(!additions(vestibule.detail,result).some(item=>['tv','sofa','bed'].includes(item.kind)),'A vestibule for papers is not a living room');
});

test('162 historical and unknown programmes remain exact identity reads, not implicit migrations',()=>{
 for(const id of ['DW-0001','DW-2999','DW-3000','DW-4001']){const args=fixture();args.description.id=id;assert.strictEqual(H.enrich(args),args.detail,id);}
 const unknown=fixture('Examen des modules de cuisson','palletStack'),result=H.enrich(unknown);
 assert.equal(result.furnishing162.added,0);assert.deepEqual(result.interior,unknown.detail.interior);
});

test('162 refusal: blocked entry, exterior source, wrong level and ambiguous room never invent unsupported furniture',()=>{
 const blocked=fixture();blocked.plan.walls.push({x:10.4,y:-1.5,w:3.2,h:2});
 assert.equal(Q.accessGrid(blocked.p,0,blocked.plan,blocked.detail).baseline,false);
 const result=H.enrich(blocked);assert.equal(result.furnishing162.added,0);assert.equal(result.furnishing162.navigationChecked,false);
 for(const change of [a=>a.description.rooms[0].exterior=true,a=>a.description.rooms[0].levels=[1],a=>a.description.rooms.push({...a.description.rooms[0]})]){
  const args=fixture();change(args);const next=H.enrich(args);assert.equal(next.furnishing162.added,0);assert.ok(next.furnishing162.requests.every(request=>request.unplaced>=0||request.unplaced===null));
 }
});

test('162 existing access: old physical objects and both wall and chair service zones survive every addition',()=>{
 const args=fixture();args.detail.interior=[{id:'old-cabinet',kind:'smallCabinet',x:5,y:.3,w:1,h:.6,solid:true,front160:{x:5,y:.9,w:1,h:1}},{id:'old-seat',kind:'bench',x:18,y:10,w:1.8,h:.65,solid:true,access165:{x:18,y:10.65,w:1.8,h:1}}];
 const before=hash(args),result=H.enrich(args);assert.equal(hash(args),before);assert.deepEqual(result.interior.slice(0,2),args.detail.interior);assertPhysical(args,result);
});

test('162 budgets: repeated floors share the site allowance and each room stays bounded',()=>{
 const Core=require('../src/core.js'),rules=Core.CodexFurnishingRules162;
 assert.equal(rules.maxPerRoom,4);assert.equal(rules.maxPerSite,32);assert.equal(rules.maxPerFloor,16);assert.equal(rules.maxPasses,4);
 const levels=[0,1,2,3],args=fixture('Vestiaire des résidents','fridge',levels);let total=0;
 args.p.w=128;args.plan.rooms=[];args.plan.objects=[];args.plan.walls=[];args.description.rooms=[];
 // Eight changing rooms connect through a transverse corridor. Every floor has
 // enough usable supports to test the shared cap, rather than one tiny room
 // that could never exhaust either the floor or site allowance.
 for(let index=0;index<8;index++){
  const x=index*16,name='Vestiaire des résidents '+index,room={name,x:x+.4,y:.4,w:15.2,h:17.2};
  args.plan.rooms.push(room);args.description.rooms.push({...room,id:'room-'+index,levels,exterior:false,kit:Q.KITS.changing,sourceProps158:[{kind:'fridge'}],authoredProps:[]});
  args.plan.objects.push({id:'source-'+index,kind:'fridge',x:x+1.5,y:1.2,w:1.8,h:.8,solid:true,amount:7,resource:'scrap'});
  for(const y of [0,17.76])args.plan.walls.push({x,y,w:6.4,h:.24},{x:x+9.6,y,w:6.4,h:.24});
  if(index>0)args.plan.walls.push({x:x-.12,y:0,w:.24,h:7.4},{x:x-.12,y:10.6,w:.24,h:7.4});
 }
 args.plan.walls.push({x:0,y:0,w:.24,h:18},{x:127.76,y:0,w:.24,h:18});
 args.plan.stairs=[{x:62.6,y:8,w:2.8,h:2}];
 for(const z of levels){
  const floor={...args,z},result=H.enrich(floor),extra=additions(args.detail,result);total+=extra.length;
  assert.ok(extra.length>0,'Every accessible level receives its own bounded allocation: '+JSON.stringify({z,report:result.furnishing162}));
  assert.ok(extra.length<=rules.maxPerFloor);assert.ok(extra.length<=Math.floor(rules.maxPerSite/levels.length));
  for(const room of args.plan.rooms)assert.ok(extra.filter(item=>hit(item,room)).length<=rules.maxPerRoom);
  assertPhysical(floor,result);
 }
 assert.ok(total>0);assert.ok(total<=rules.maxPerSite);
});

test('162 shipped plans: three seeds preserve independent source geometry, finite stocks and previous detail revisions',()=>{
 const P=require('../src/codex-plan165.js'),R=require('../src/codex3000-runtime.js');
 const descriptionBefore=hash(R.records);let added=0,models=0;
 for(const seed of [42,17117,90125])for(const id of ['DW-3001','DW-3251','DW-3501','DW-3751','DW-4000']){
  const before=P.inspect(id,seed,0,10),next=P.inspect(id,seed,0,11);
  assert.ok(before.supported&&next.supported,id);assert.deepEqual(next.p,before.p,id+' parcel');assert.deepEqual(next.plan,before.plan,id+' source geometry and containers');
  assert.deepEqual(next.details.interior.filter(item=>!item.furnishing162),before.details.interior,id+' previous details');assert.deepEqual(next.details.outdoor,before.details.outdoor,id+' exterior');
  const args={seed,p:next.p,z:0,plan:next.plan,detail:before.details};
  assert.equal(next.details.furnishing162.scope,'derived-usage-not-authored-minima');assert.ok(next.details.furnishing162.added<=16);
  if(next.details.furnishing162.navigationChecked)assertPhysical(args,next.details);
  added+=next.details.furnishing162.added;models++;
 }
 assert.equal(hash(R.records),descriptionBefore);assert.ok(added>0,'Real independent plans receive some usable furniture');
 console.log('INDEPENDENT_FURNISHING162 '+JSON.stringify({seeds:3,models,added}));
});
