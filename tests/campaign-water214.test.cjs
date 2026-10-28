'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),P=require('../src/codex-physical2026.js');
const Audit=require('../scripts/audit-campaign-services208.cjs'),Supports=require('../src/campaign-water-supports214.js'),Water=require('../src/campaign-water214.js');
const copy=value=>JSON.parse(JSON.stringify(value)),R=C.CampaignWater214Rules;
const step=(api,seconds)=>{for(let t=0;t<seconds-1e-9;t+=R.maxStep)api.step(Math.min(R.maxStep,seconds-t));};

// Isolated owner scenarios use the real authored metric plan and swept-disc
// geometry. They are not counted as naturally visited seeded-world sites.
function fixture(){
 const model=Audit.makeModel('EXT-MONDE-T047',9),{p,template,plan,details}=model;
 const originalById=new Map([...plan.objects,...details.interior].map(o=>[o.id,o.authorObjectId]));
 details.outdoor.forEach((o,i)=>originalById.set(o.id,template.base.solids[i].id));
 let blocked=false,cover,deadSupport=false,externalBusy=false,mounted=false;
 const clear=(a,b,z,ignore,radius,optical=false)=>z===0&&P.segmentClear({...template.scene,solids:template.scene.solids.filter(o=>o.id!==originalById.get(ignore)&&!(optical&&o.kind==='closed-pool'))},G.local(p,a.x,a.y),G.local(p,b.x,b.y),0,radius);
 const world={...Audit.modelWorld(model),
  blocked:(x,y,radius,z=0,inside=null,ignore=null)=>blocked||!clear({x,y},{x,y},z,ignore,radius),
  movementLine:(a,b,z=0,inside=null,ignore=null,radius=.32)=>!blocked&&clear(a,b,z,ignore,radius),
  line:(a,b,z=0,inside=null,ignore=null,radius=.05)=>clear(a,b,z,ignore,radius,true),
  coveredAt205:(x,y,z)=>cover===undefined?z===0&&require('../src/codex-campaign205.js').insideBuilding(p,{x,y}):cover};
 const offered=Supports.supportsFor(p,plan,details);assert.ok(offered.length);
 let support;
 for(const row of offered)for(const face of row.approaches){
  const q=Supports.resolve(world,{active:true,generation:11,...face.anchor,inside:p.id,car:null},row,[p.id],{structureDestroyed:()=>false});if(q.ok&&!support)support=q;
 }
 assert.ok(support,'A real physical rain collector approach');
 const pose={active:true,generation:11,...support.anchor,inside:p.id,car:null};
 const engine=new C.Siege.Engine(),modules=new Map(),messages=[];
 const g={world:{seed:0},state:'playing',gameOver:false,paused:false,activeOverlay:null,elapsed:0,weather:0,
  player:{health:100,maxHealth:100,dead:false,reload:0,shootCooldown:0,meleeCooldown:0,carry:C.makeBag()},stats:{shots:0},
  resources:C.makeBag(),input:{keys:new Set(),pressed:new Set(),mouseDown:false,touchFire:false},ui:{commandModal:{}},
  update(){},startNew(valid){if(!valid)return false;for(const d of modules.values())d.reset();g.world={seed:1};return true;},returnToMenu(){g.state='menu';},damagePlayer(amount){g.player.health-=amount;},
  save(){return true;},notify:text=>messages.push(text),releaseInputs(){g.input.keys.clear();g.input.pressed.clear();},
  fieldcraft:{context:()=>({mounted})},worldEvolution:{structureDestroyed:()=>deadSupport,groupMembers:()=>[]},
  frontier:{position:()=>({...pose}),world:()=>world,discoveries:()=>[p.id],contacts:()=>[]},
  expansions:{canAct:()=>g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0,busy:except=>externalBusy||[...modules].some(([id,d])=>id!==except&&d.busy?.()),register:d=>modules.set(d.id,d)},
  siege:{carriedWater199:()=>engine.state.playerWater,transferFieldWater199:(direction,amount)=>engine.fieldWater(direction,amount,{running:g.state==='playing'&&!g.paused&&!g.activeOverlay,accessible:pose.active&&pose.z===0&&!pose.car?.driving,dead:g.player.dead||g.player.health<=0,secure:!g.gameOver})}};
 Object.assign(g.player.carry,{wood:8,scrap:8});
 const api=Water.install(g),module=modules.get('water214');
 const prepared=water=>module.restore({version:1,collectors:[{siteId:p.id,supportId:support.supportId,water}]});
 const begin=kind=>api.begin(kind,p.id,support.supportId);
 const set={blocked:value=>{blocked=value;},cover:value=>{cover=value;},destroyed:value=>{deadSupport=value;},busy:value=>{externalBusy=value;},mounted:value=>{mounted=value;}};
 return{g,api,module,p,world,pose,support,engine,prepared,begin,set,messages};
}

test('214 preparation is paid once at completion and all previews leave an empty legacy registry unchanged',()=>{
 const f=fixture(),{g,api,support,begin}=f,before=copy(g.player.carry);
 assert.deepEqual(Water.validate(undefined),{version:1,collectors:[]});
 for(let i=0;i<3;i++){assert.equal(api.preview('prepare',f.p.id,support.supportId).ok,true);api.actions();api.overview();assert.equal(api.status(support.supportId),null);assert.equal(api.activity(),null);}
 assert.deepEqual(api.snapshot(),Water.initial());assert.deepEqual(g.player.carry,before);
 const context=g.fieldcraft.context;for(const value of [null,undefined]){g.fieldcraft.context=()=>value;assert.equal(api.preview('prepare',f.p.id,support.supportId).ok,true);}g.fieldcraft.context=context;
 assert.equal(begin('prepare').ok,true);step(api,R.prepare.seconds-R.maxStep);assert.deepEqual(g.player.carry,before);assert.deepEqual(api.snapshot(),Water.initial());
 api.step(R.maxStep);assert.equal(api.busy(),false);assert.equal(api.status(support.supportId).water,0);assert.equal(api.status(support.supportId).capacity,R.capacity);
 assert.equal(g.player.carry.wood,before.wood-R.prepare.cost.wood);assert.equal(g.player.carry.scrap,before.scrap-R.prepare.cost.scrap);assert.equal(g.siege.carriedWater199(),0);
 const paid=copy(g.player.carry);step(api,20);assert.deepEqual(g.player.carry,paid);assert.equal(api.status(support.supportId).water,0);
 assert.equal(begin('prepare').ok,false);assert.equal(begin('draw').ok,false);
});

test('214 actual active rain is bounded, exposed-only, finite and never inferred from elapsed wall time',()=>{
 const f=fixture(),{g,api,set,support}=f;f.prepared(0);g.weather=1;
 api.step(10000);assert.equal(api.status(support.supportId).water,R.rainPerSecond*R.maxStep,'A huge dt is only one bounded step');
 const saved=api.snapshot();g.elapsed=1000000;g.paused=true;step(api,20);assert.deepEqual(api.snapshot(),saved);
 g.paused=false;g.activeOverlay={};step(api,20);assert.deepEqual(api.snapshot(),saved);g.activeOverlay=null;
 for(const value of [true,null]){set.cover(value);step(api,10);assert.deepEqual(api.snapshot(),saved,'Unknown cover is not proven exposure');}set.cover(undefined);
 for(const weather of [0,-1,NaN,Infinity]){g.weather=weather;step(api,1);assert.deepEqual(api.snapshot(),saved);}g.weather=1;
 for(const status of ['dead','menu','over']){g.player.dead=status==='dead';g.state=status==='menu'?'menu':'playing';g.gameOver=status==='over';step(api,1);assert.deepEqual(api.snapshot(),saved);}g.player.dead=false;g.state='playing';g.gameOver=false;
 step(api,R.capacity/R.rainPerSecond+1);assert.equal(api.status(support.supportId).water,R.capacity);step(api,10);assert.equal(api.status(support.supportId).water,R.capacity);
 assert.equal(g.siege.carriedWater199(),0,'Rain does not fill a second or carried inventory');
});

test('214 transfers conserve the fixed reservoir and the actual shared bucket including partial free space',()=>{
 const f=fixture(),{api,g,engine,support,begin}=f;f.prepared(4);engine.state.playerWater=7.5;
 assert.equal(api.preview('draw',f.p.id,support.supportId).amount,.5);assert.equal(begin('draw').ok,true);step(api,R.draw.seconds);
 assert.equal(g.siege.carriedWater199(),8);assert.equal(api.status(support.supportId).water,3.5);assert.equal(begin('draw').ok,false);
 const total=8+3.5;assert.equal(begin('pour').ok,true);step(api,R.pour.seconds);assert.equal(g.siege.carriedWater199(),6);assert.equal(api.status(support.supportId).water,5.5);assert.equal(g.siege.carriedWater199()+api.status(support.supportId).water,total);
 f.prepared(23.5);engine.state.playerWater=2;assert.equal(begin('pour').ok,true);step(api,R.pour.seconds);assert.equal(api.status(support.supportId).water,24);assert.equal(g.siege.carriedWater199(),1.5);assert.equal(begin('pour').ok,false);
 f.prepared(0);engine.state.playerWater=0;assert.equal(begin('draw').ok,false);assert.equal(begin('pour').ok,false);
 f.prepared(2);engine.state.playerWater=0;assert.equal(begin('draw').ok,true);const siege=g.siege;g.siege={...siege,transferFieldWater199:()=>0};step(api,R.draw.seconds);assert.equal(api.status(support.supportId).water,2);assert.equal(engine.state.playerWater,0);assert.equal(api.busy(),false);g.siege=siege;
});

test('214 current hands, source, world, pose, dangers and damage can cancel a prepared job before any charge',()=>{
 for(const reason of ['move','hurt','reload','shots','bag','player','local-world','regional-world','domain','profile','blocked','destroyed','unknown-destruction','busy','mounted','input','danger','cost']){
  const f=fixture(),{g,api,pose,world,set,begin,support}=f,before=copy(g.player.carry);assert.equal(begin('prepare').ok,true,reason);api.step(.25);
  if(reason==='move')pose.x+=R.moveTolerance*2;if(reason==='hurt')g.damagePlayer(1);if(reason==='reload')g.player.reload=1;if(reason==='shots')g.stats.shots++;
  if(reason==='bag')g.player.carry=copy(g.player.carry);if(reason==='player')g.player={...g.player};if(reason==='local-world')g.world={seed:0};
  if(reason==='regional-world')g.frontier.world=()=>({...world});if(reason==='domain')pose.active=false;if(reason==='profile')pose.detailVersion=1;
  if(reason==='blocked')set.blocked(true);if(reason==='destroyed')set.destroyed(true);if(reason==='unknown-destruction')delete g.worldEvolution.structureDestroyed;if(reason==='busy')set.busy(true);if(reason==='mounted')set.mounted(true);
  if(reason==='danger')g.frontier.contacts=()=>[{x:pose.x,y:pose.y,z:0,hp:10}];if(reason==='cost')g.player.carry.scrap=0;
  if(reason==='input'){g.input.keys.add('KeyD');g.update(.25);}else step(api,R.prepare.seconds);
  assert.equal(api.busy(),false,reason);assert.deepEqual(api.snapshot(),Water.initial(),reason);assert.equal(api.status(support.supportId),null,reason);
  assert.equal(g.player.carry.wood,before.wood,reason);assert.equal(g.player.carry.scrap,reason==='cost'?0:before.scrap,reason);
 }
});

test('214 pure views freeze in pause, disappear immediately on destroyed supports, and never generate a world or use RNG',()=>{
 const f=fixture(),{g,api,support,set,begin}=f;f.prepared(4);assert.equal(begin('draw').ok,true);api.step(.25);
 const view=api.activity(),state=api.snapshot(),beforeBucket=g.siege.carriedWater199(),reader=g.frontier.world,random=Math.random;
 assert.equal(view.amount,2);assert.ok(Object.isFrozen(view));assert.ok(Object.isFrozen(view.anchor));
 g.frontier.world=()=>assert.fail('A presentation read generated a world');Math.random=()=>assert.fail('A presentation read used RNG');
 try{for(let i=0;i<10;i++){assert.deepEqual(api.activity(),view);assert.deepEqual(api.presentation(support.supportId),view);assert.equal(api.status(support.supportId).water,4);}}finally{g.frontier.world=reader;Math.random=random;}
 assert.deepEqual(api.snapshot(),state);assert.equal(g.siege.carriedWater199(),beforeBucket);g.paused=true;step(api,20);assert.deepEqual(api.activity(),view);
 const readDestruction=g.worldEvolution.structureDestroyed;delete g.worldEvolution.structureDestroyed;
 assert.equal(api.activity(),null);assert.equal(api.status(support.supportId),null);assert.equal(api.busy(),true);g.paused=false;g.weather=1;api.step(.25);assert.equal(api.busy(),false);assert.deepEqual(api.snapshot(),state,'Unknown destruction state cannot collect rain or transfer water');
 g.worldEvolution.structureDestroyed=readDestruction;g.weather=0;assert.equal(begin('draw').ok,true);api.step(.25);g.paused=true;
 set.destroyed(true);assert.equal(api.activity(),null);assert.equal(api.status(support.supportId),null);assert.equal(api.busy(),true);step(api,20);assert.equal(api.busy(),true,'Paused presentation cannot cancel the job');
 g.paused=false;api.step(.25);assert.equal(api.busy(),false);assert.deepEqual(api.snapshot(),state);assert.equal(g.siege.carriedWater199(),beforeBucket);
});

test('214 prepared reservoirs survive transient work restore while rejected starts preserve the current owner',()=>{
 const f=fixture(),{g,api,module,begin}=f;f.prepared(4);assert.equal(begin('draw').ok,true);api.step(.25);const saved=api.snapshot();
 assert.equal(g.startNew(false),false);assert.equal(api.busy(),true);assert.deepEqual(api.snapshot(),saved);
 module.restore(copy(saved));assert.equal(api.busy(),false);assert.equal(api.activity(),null);assert.deepEqual(api.snapshot(),saved);assert.equal(g.siege.carriedWater199(),0);
 assert.equal(begin('draw').ok,true);api.step(.25);g.returnToMenu();assert.equal(api.busy(),false);assert.deepEqual(api.snapshot(),saved);
 g.state='playing';assert.equal(g.startNew(true),true);assert.deepEqual(api.snapshot(),Water.initial());
});

test('214 registry rejects unknown fields, nonfinite stock, duplicate or foreign structural IDs and excess capacity',()=>{
 const f=fixture(),valid={version:1,collectors:[{siteId:f.p.id,supportId:f.support.supportId,water:2}]};assert.deepEqual(Water.validate(valid),valid);
 const cases=[r=>r.extra=true,r=>r.version=2,r=>r.collectors[0].extra=true,r=>r.collectors.push(copy(r.collectors[0])),r=>r.collectors[0].water=-1,r=>r.collectors[0].water=R.capacity+.1,r=>r.collectors[0].water=NaN,r=>r.collectors[0].water=Infinity,r=>r.collectors[0].water=true,r=>r.collectors[0].siteId='P0001',r=>r.collectors[0].supportId=f.p.id+':205:static:01',r=>r.collectors[0].supportId=f.p.id+':0:1'];
 for(const mutate of cases){const value=copy(valid);mutate(value);assert.throws(()=>Water.validate(value),/récupérateurs/);}
 assert.throws(()=>Water.validate({version:1,collectors:Array.from({length:R.maxCollectors+1},(_,i)=>({siteId:'P0001',supportId:'P0001:205:static:'+i,water:0}))}),/récupérateurs/);
 for(const frontier of [{generation:10,seen:[f.p.id]},{generation:11,seen:[]},{generation:11,seen:[f.p.id],detailVersion:99}])assert.throws(()=>Water.validate(valid,{worldSeed:17117,frontier}));
});

test('214 actual seeded G11 reservoir validates on its exact source, shares the native saved bucket, and Continue cancels unpaid work',()=>{
 const {boot127}=require('./helpers/expansions127.cjs'),g=boot127().game;require('../src/world-pack131.js').install(g);Water.install(g);g.startNew('standard','17117','classic','classic',true);
 const w=g.frontier.world();let site,support;
 for(const p of w.pois.filter(p=>p.campaign205))for(const row of Supports.supportsFor(p,w.plan(p,0),w.detailAt(p,0)))for(const face of row.approaches){
  const q=Supports.resolve(w,{active:true,generation:11,...face.anchor,inside:null,car:null},row,[p.id],{structureDestroyed:()=>false});if(q.ok&&!support){site=p;support=q;}
 }
 assert.ok(support,'Prepared native fixture at a real seed-admitted rain collector');const raw=g.serialize();
 Object.assign(raw.frontier,{active:true,...support.anchor,inside:null,anchor:{x:g.player.x,y:g.player.y},seen:[site.id]});Object.assign(raw.player.carry,{wood:8,scrap:8});
 for(const p of w.nearPOI(support.anchor.x,support.anchor.y,200))for(let i=0;i<w.threatCount(p);i++)raw.frontier.enemies[p.id+':e'+i]=0;
 raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
 assert.equal(g.restoreSave(raw),true);g.input.keys.clear();g.input.pressed.clear();g.weather=0;
 const api=g.campaignWater214,before=copy(g.player.carry);
 assert.equal(api.begin('prepare',site.id,support.supportId).ok,true);api.step(.25);
 g.player.invulnerable=1;assert.equal(g.frontier.damage(1),false);assert.equal(api.busy(),true,'An invulnerable non-hit does not interrupt useful work');
 g.player.invulnerable=0;const health=g.player.health;assert.equal(g.frontier.damage(1),true);g.player.health=health;
 assert.equal(api.busy(),false,'The actual regional damage owner cancels before a same-frame heal can mask the hit');step(api,R.prepare.seconds);assert.deepEqual(api.snapshot(),Water.initial());assert.deepEqual(g.player.carry,before);
 assert.equal(api.begin('prepare',site.id,support.supportId).ok,true);api.step(.25);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.equal(api.busy(),false);assert.deepEqual(api.snapshot(),Water.initial());assert.deepEqual(g.player.carry,before);
 assert.equal(api.begin('prepare',site.id,support.supportId).ok,true);step(api,R.prepare.seconds);assert.equal(api.status(support.supportId).water,0);
 g.weather=1;step(api,40);g.weather=0;const rain=api.status(support.supportId).water;assert.ok(Math.abs(rain-40*R.rainPerSecond)<1e-8);
 assert.equal(api.begin('draw',site.id,support.supportId).ok,true);step(api,R.draw.seconds);assert.equal(g.siege.carriedWater199(),R.draw.portion);assert.ok(Math.abs(api.status(support.supportId).water-(rain-R.draw.portion))<1e-8);
 const finished=g.serialize();assert.deepEqual(Water.validate(api.snapshot(),finished),api.snapshot());assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.siege.carriedWater199(),R.draw.portion);assert.deepEqual(api.snapshot(),finished.expansions127.modules.water214);
 const destroyed=copy(finished);destroyed.worldEvolution.structures[site.id]=0;
 assert.deepEqual(Water.validate(destroyed.expansions127.modules.water214,destroyed),destroyed.expansions127.modules.water214,'A destroyed fixed support keeps its historical finite record valid; presentation and collection are refused live');
 for(const alter of [d=>d.frontier.seen=[],d=>d.frontier.generation=10,d=>d.worldSeed=0,d=>d.frontier.detailVersion=String(d.frontier.detailVersion),d=>d.frontier.ecologyVersion=true,d=>d.frontier.hydrologyVersion=String(d.frontier.hydrologyVersion),d=>d.frontier.landscape189=null,d=>d.expansions127.modules.water214.collectors[0].supportId=site.id+':205:static:99999']){const value=copy(finished);alter(value);assert.throws(()=>Water.validate(value.expansions127.modules.water214,value));}
 g.player.dead=true;g.siege.playerDown();assert.equal(g.siege.carriedWater199(),0);assert.deepEqual(api.snapshot(),finished.expansions127.modules.water214,'Death empties only the existing carried bucket, not fixed collector stocks');
});
