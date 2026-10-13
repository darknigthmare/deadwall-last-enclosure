'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
require('../src/codex-context160.js');
const Ops=require('../src/context-operations160.js'),WorldOps=require('../src/world-pack131.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const checkpoint=g=>{const data=copy(g.serialize());delete data.timestamp;return data;};
// Explicit advanced field fixtures: real seeded sites and collision-free work
// points, finite carried supplies and neutralized prepared contacts. These are
// controller tests, not organic campaign travel or progression measurements.
function campaign(){
 const {game:g}=boot127();WorldOps.install(g);Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());
 assert.equal(g.worldOps131.activateTerritories160().ok,true);g.input.keys.clear();g.input.pressed.clear();return g;
}
function field(g,kind,predicate=()=>true){
 const w=g.frontier.world();let fixture;
 for(const p of w.contextSites160()){for(const op of p.context160.operations||[]){
  if(op.kind!==kind||!predicate(p,op,w))continue;const point=G.global(p,op.anchor.x,op.anchor.y);
  if(!w.blocked(point.x,point.y,C.FrontierTacticsRules.enemyRadius,0,null)&&w.line(point,point,0,null,null,.05)){fixture={p,op,point};break;}
 }if(fixture)break;}
 assert.ok(fixture,'Real seeded '+kind+' support with a free work point');
 const {p,op,point}=fixture,data=g.serialize();Object.assign(data.frontier,{active:true,x:point.x,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 data.frontier.seen=[p.id];data.player.carry=C.makeBag();for(const[k,n]of Object.entries(C.ContextRules160.operations[kind].cost))data.player.carry[k]=n*2;
 if(kind==='medicalCare')data.player.health=g.player.maxHealth-30;
 for(const site of w.nearPOI(point.x,point.y,180))for(let i=0;i<w.threatCount(site);i++)data.frontier.enemies[site.id+':e'+i]=0;
 data.frontier.kills=Object.values(data.frontier.enemies).filter(h=>h===0).length;assert.equal(g.restoreSave(data),true);
 assert.equal(g.contextOperations160.preview(p.id,op.key).ok,true);return{...fixture,w:g.frontier.world(),fullKey:Ops.operationKey(p.id,op.key)};
}
function step(g,seconds){for(let elapsed=0;elapsed<seconds-.000001;elapsed+=.1)g.contextOperations160.step(Math.min(.1,seconds-elapsed));}

for(const kind of ['restoreAccess','pumpBasin','switchTrack'])test('G10 '+kind+': actual completed work pays once, changes its physical barrier and survives reload',()=>{
 const g=campaign(),f=field(g,kind),q=g.contextOperations160.preview(f.p.id,f.op.key),before=checkpoint(g),plan=f.w.plan(f.p,0);
 const barrier=[...plan.gates160,...plan.terrain160].find(o=>o.id===f.op.barrierId);assert.ok(barrier);const point=G.global(f.p,barrier.x+barrier.w/2,barrier.y+barrier.h/2);
 assert.equal(f.w.blocked(point.x,point.y,.1,0,null),true,'The named barrier physically blocks before work');
 assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,q.seconds-.1);
 assert.deepEqual(g.player.carry,before.player.carry,'Partial work pays nothing');assert.equal(g.contextOperations160.snapshot().completed.length,0);
 assert.ok(g.contextOperations160.presentation(f.fullKey).progress>0);step(g,.1);
 const after=checkpoint(g);for(const key of C.RESOURCE_KEYS)assert.ok(Math.abs(before.player.carry[key]-after.player.carry[key]-(q.cost[key]||0))<.000001,key);
 assert.deepEqual(after.resources,before.resources,'Work pays only the carried bag');assert.equal(g.contextOperations160.isComplete(f.fullKey),true);assert.equal(g.contextOperations160.busy(),false);
 assert.equal(g.contextOperations160.presentation(f.fullKey),null);assert.equal(g.frontier.world().blocked(point.x,point.y,.1,0,null),false,'The completed barrier is actually removed from movement');
 assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,false);assert.deepEqual(checkpoint(g),after);
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),after);assert.equal(g.contextOperations160.isComplete(f.fullKey),true);
 assert.equal(g.frontier.world().blocked(point.x,point.y,.1,0,null),false);
});

test('G10 medical care: healthy refusal, bounded paid healing and finite carried medicine',()=>{
 const g=campaign(),f=field(g,'medicalCare'),q=g.contextOperations160.preview(f.p.id,f.op.key);g.player.health=g.player.maxHealth;
 assert.match(g.contextOperations160.preview(f.p.id,f.op.key).reason,/Aucun soin/);const healthy=checkpoint(g);assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,false);assert.deepEqual(checkpoint(g),healthy);
 g.player.health=g.player.maxHealth-30;const stock=g.resources.medicine;assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,q.seconds);
 assert.equal(g.player.health,g.player.maxHealth-10);assert.equal(g.player.carry.medicine,1);assert.equal(g.resources.medicine,stock);assert.deepEqual(g.contextOperations160.snapshot().completed,[]);
 assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,q.seconds);assert.equal(g.player.health,g.player.maxHealth);assert.equal(g.player.carry.medicine,0);
 g.player.health-=5;assert.match(g.contextOperations160.preview(f.p.id,f.op.key).reason,/Dans le sac/);assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,false);
});

test('G10 jobs: movement, shots, reload, damage and replacing the bag interrupt without payment',()=>{
 for(const interrupt of ['movement','shots','reload','damage','source']){
  const g=campaign(),f=field(g,'restoreAccess'),before={...g.player.carry};assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,.2);
  if(interrupt==='movement'){g.input.keys.add('KeyD');g.updatePlayer(.1);g.input.keys.clear();}
  if(interrupt==='shots')g.stats.shots++;if(interrupt==='reload')g.player.reload=1;if(interrupt==='damage')g.player.health--;if(interrupt==='source')g.player.carry=copy(g.player.carry);
  g.contextOperations160.step(.1);assert.equal(g.contextOperations160.busy(),false,interrupt);assert.deepEqual(g.player.carry,before,interrupt);assert.equal(g.contextOperations160.isComplete(f.fullKey),false,interrupt);
 }
});

test('G10 jobs: a live visible hostile contact blocks work and interrupts a partial operation',()=>{
 const g=campaign(),f=field(g,'restoreAccess'),frontier=g.frontier,before={...g.player.carry};assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,.2);
 // A live-contact fixture uses the real collision/LOS reader; it does not
 // change the terrain, saved threat IDs or owners of completed operations.
 const hostile={id:'qa-danger160',x:f.point.x+.8,y:f.point.y,z:0,hp:10,dead:false,inside:null};g.frontier=Object.freeze({...frontier,contacts:()=>[hostile]});
 try{assert.match(g.contextOperations160.preview(f.p.id,f.op.key,{working:true}).reason,/Sécurisez/);g.contextOperations160.step(.1);assert.equal(g.contextOperations160.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,false);}
 finally{g.frontier=frontier;}
});

test('G10 jobs: pause and overlays preserve partial progress; Save/Continue cancels it without free stock or completion',()=>{
 const g=campaign(),f=field(g,'pumpBasin'),before={...g.player.carry};assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,.3);const progress=g.contextOperations160.presentation(f.fullKey);
 g.paused=true;step(g,50);assert.deepEqual(g.contextOperations160.presentation(f.fullKey),progress);g.paused=false;
 g.activeOverlay=g.ui.commandModal;step(g,50);assert.deepEqual(g.contextOperations160.presentation(f.fullKey),progress);g.activeOverlay=null;
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.contextOperations160.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.contextOperations160.isComplete(f.fullKey),false);
});

test('G10 work: no bag supplies, an undetected site, wrong floor and destroyed support are refused',()=>{
 const g=campaign(),f=field(g,'restoreAccess'),good=checkpoint(g),depot={...g.resources};g.player.carry=C.makeBag();assert.match(g.contextOperations160.preview(f.p.id,f.op.key).reason,/Dans le sac/);assert.deepEqual(g.resources,depot);
 assert.equal(g.restoreSave(good),true);const hidden=copy(good);hidden.frontier.seen=[];assert.equal(g.restoreSave(hidden),true);assert.match(g.contextOperations160.preview(f.p.id,f.op.key).reason,/repéré/);
 assert.equal(g.restoreSave(good),true);const original=g.frontier;g.frontier=Object.freeze({...original,position:()=>({...original.position(),z:1,inside:f.p.id})});try{assert.match(g.contextOperations160.preview(f.p.id,f.op.key).reason,/bon niveau/);}finally{g.frontier=original;}
 const destroyed=copy(good);destroyed.worldEvolution.structures[f.p.id]=0;assert.equal(g.restoreSave(destroyed),true);assert.equal(g.worldEvolution.structureDestroyed(f.p.id),true);assert.match(g.contextOperations160.preview(f.p.id,f.op.key).reason,/détruit/);
 const before=checkpoint(g);assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,false);assert.deepEqual(checkpoint(g),before);
});

test('G10 completed register: duplicates, unknown sites/operations, repeated care and undiscovered completion are atomic failures',()=>{
 const g=campaign(),f=field(g,'restoreAccess');assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);step(g,C.ContextRules160.operations.restoreAccess.seconds);
 const before=checkpoint(g),world=g.world,care=g.frontier.world().contextSites160().find(p=>p.context160.operations.some(o=>o.kind==='medicalCare'));assert.ok(care);
 for(const mutate of [s=>s.completed.push(s.completed[0]),s=>s.completed=['P10000:160:access'],s=>s.completed=['P9999:160:access'],s=>s.completed=[f.p.id+':160:nonexistent'],s=>s.completed=[care.id+':160:care'],s=>s.version=2,s=>s.injected=true,s=>s.completed={}]){
  const bad=copy(before);mutate(bad.expansions127.modules.context160);assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,world);assert.deepEqual(checkpoint(g),before);
 }
 const undiscovered=copy(before);undiscovered.frontier.seen=[];assert.throws(()=>g.restoreSave(undiscovered));assert.equal(g.world,world);assert.deepEqual(checkpoint(g),before);
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),before);
});

test('G10 modal work: begin from the real Pause/Command chain resumes work, while a later manual pause still freezes it',()=>{
 const {g,doc}=require('../scripts/qa-startup134.cjs').bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();standAt(g,g.player,g.core());
 assert.equal(g.worldOps131.activateTerritories160().ok,true);const f=field(g,'restoreAccess'),before={...g.player.carry};
 g.togglePause(true);doc.getElementById('pauseCommandButton').click();assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.commandModal);
 assert.equal(g.contextOperations160.begin(f.p.id,f.op.key).ok,true);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(g.ui.pauseMenu.classList.contains('hidden'),true);
 step(g,.2);const progress=g.contextOperations160.presentation(f.fullKey);assert.ok(progress.elapsed>0);
 g.togglePause(true);step(g,50);assert.deepEqual(g.contextOperations160.presentation(f.fullKey),progress);assert.deepEqual(g.player.carry,before);assert.equal(g.contextOperations160.isComplete(f.fullKey),false);
});
