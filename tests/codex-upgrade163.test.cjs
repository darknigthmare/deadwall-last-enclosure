'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
const R=require('../src/codex3000-runtime.js'),A=require('../src/codex-architecture163.js'),X=require('../src/codex-context160.js');
const Ops=require('../src/world-pack131.js'),ContextOps=require('../src/context-operations160.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=value=>JSON.parse(JSON.stringify(value)),checkpoint=g=>{const d=copy(g.serialize());delete d.timestamp;return d;};
const models=new Map();
function model(revision,ecologyVersion=0,hydrologyVersion=0){const key=ecologyVersion+':'+revision+':'+hydrologyVersion;if(!models.has(key))models.set(key,W.create(17117,10,{detailVersion:revision,ecologyVersion,hydrologyVersion}));return models.get(key);}
function references(g){
 const f=g.frontier.position(),old=model(11,f.ecologyVersion,f.hydrologyVersion),next=model(12,f.ecologyVersion,f.hydrologyVersion),live=g.frontier.world();
 assert.equal(f.generation,10);assert.equal(f.detailVersion,11);assert.equal(old.ecologyVersion,live.ecologyVersion);
 assert.ok(JSON.stringify(old.pois)===JSON.stringify(live.pois),'The fixture must use the actual campaign parcels and identities');
 return{old,next};
}
function campaign(){
 const {game:g}=boot127();Ops.install(g);ContextOps.install(g);g.startNew('standard','17117');
 standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 assert.equal(g.worldOps131.activateTerritories160().ok,true);
 const d=g.serialize();d.frontier.detailVersion=11;assert.equal(g.restoreSave(d),true);return g;
}
function install(g,mutate){const d=g.serialize();mutate(d);assert.equal(g.restoreSave(d),true);return checkpoint(g);}
function refuse(g,pattern){
 const before=checkpoint(g),home=g.world,region=g.frontier.world(),result=g.worldOps131.upgradeDetails159(12);
 assert.equal(result.ok,false);assert.match(result.reason,pattern);assert.equal(g.world,home);
 assert.equal(g.frontier.world(),region,'A refusal cannot replace the live regional model');assert.deepEqual(checkpoint(g),before);
}
function furnishingPoint(g,programme,radius,{groundEnemy=false}={}){
 const{old,next}=references(g),sites=next.contextSites160(),preferred=sites.find(p=>p.programme160===programme);assert.ok(preferred,programme);
 // A different ecological parcel can legitimately fit a different furnishing
 // set. Search bounded real sites while retaining the physical collision oracle.
 const candidates=[preferred,...sites.filter(p=>p!==preferred)].slice(0,128);
 for(const p of candidates){
  const prior=old.pois.find(q=>q.id===p.id),levels=prior.legacyLevels160||prior.levels;
  if(groundEnemy&&(!old.threatCount(prior)||levels[G.hash(prior.id,0)%levels.length]!==0))continue;
  for(const o of next.detailAt(p,0).interior.filter(o=>o.density163&&o.solid))
   for(const dx of [0,-radius,radius])for(const dy of [0,-radius,radius]){
    const q=G.global(p,o.x+o.w/2+dx,o.y+o.h/2+dy);
    if(!old.blocked(q.x,q.y,radius,0,p.id)&&next.blocked(q.x,q.y,radius,0,p.id))return {...q,z:0,inside:p.id,p,object:o};
   }
  }
 assert.fail('A real context must offer a genuinely new solid within previously free floor space');
}
function pierFixture(g,profile){
 const{old,next}=references(g),p=next.contextSites160().find(p=>p.programme160==='DW-0269');assert.ok(p);
 for(const o of (next.plan(p,0).movement160||[]).filter(o=>o.id?.includes(':163:pier:'))){
  const q=G.global(p,o.x+o.w/2,o.y+o.h/2);
  for(const a of [p.a,p.a+Math.PI/2,0])if(old.vehicleClear(q.x,q.y,a,profile.w,profile.h)&&!next.vehicleClear(q.x,q.y,a,profile.w,profile.h))return {...q,a,p,object:o};
 }
 assert.fail('A new exchange pier must occupy genuinely clear parking ground at revision11');
}
function campPier(g){
 const{old,next}=references(g),p=next.contextSites160().find(p=>p.programme160==='DW-0269'),r=C.SurvivalPackRules.campRadius;
 for(const o of (next.plan(p,0).movement160||[]).filter(o=>o.id?.includes(':163:pier:'))){
  const q=G.global(p,o.x+o.w/2,o.y+o.h/2);
  if(!old.blocked(q.x,q.y,r,0,null)&&next.blocked(q.x,q.y,r,0,null))return q;
 }
 assert.fail('A new pier must cover previously free outdoor ground at the full camp radius');
}

test('163 depot upgrade and Continue preserve paid work, finite loot, damage, ground tracks and every campaign budget',()=>{
 const g=campaign(),w=references(g).old,site=w.contextSites160().find(p=>p.context160.operations.some(o=>o.kind==='pumpBasin'));
 const op=site.context160.operations.find(o=>o.kind==='pumpBasin'),key=site.id+':160:'+op.key;
 const hostile=w.contextSites160().find(p=>A.supports(p.context160)&&w.threatCount(p)>0);assert.ok(hostile);
 const sourceObjects=copy(w.plan(site,0).objects),container=sourceObjects.find(o=>o.amount>0);assert.ok(container);
 const point=G.global(hostile,hostile.w/2,-2),enemy=hostile.id+':e0';
 const before=install(g,d=>{
  d.frontier.seen=[...new Set([...d.frontier.seen,site.id,hostile.id])];d.frontier.taken[container.id]=Math.min(1,container.amount);
  d.frontier.enemies[enemy]=17;d.frontier.tracks[enemy]={...point,z:0,a:.7,mode:'investigate',ttl:5,gx:point.x+.3,gy:point.y,cool:.2};
  d.worldEvolution.structures[site.id]=.6;d.expansions127.modules.context160={version:1,completed:[key]};
 });
 const result=g.worldOps131.actions().find(a=>a.id==='completeCodex163');assert.ok(result&&!result.disabled);
 assert.equal(result.run().ok,true);const after=checkpoint(g);assert.equal(after.frontier.detailVersion,12);
 const expected=copy(before);expected.frontier.detailVersion=12;assert.deepEqual(after,expected);
 assert.equal(g.frontier.enemyHealth(enemy),17);assert.equal(g.frontier.snapshot().tracks[enemy].z,0,'New upper planes must not remap old occupants');
 assert.equal(g.frontier.world().contextCompleted160(key),true);assert.equal(g.frontier.takenAmount(container.id),before.frontier.taken[container.id]);
 const continuedSite=g.frontier.world().pois.find(p=>p.id===site.id);
 assert.deepEqual(g.frontier.world().plan(continuedSite,0).objects,sourceObjects,'Old container IDs, positions, resources and finite amounts remain exact');
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),after);assert.equal(result.run().ok,false);
 assert.equal(g.frontier.world().pois.find(p=>p.id===hostile.id).levels.length,2);
});

test('163 unavailable commander and rejected restore leave the whole upgrade atomic',()=>{
 const g=campaign(),before=checkpoint(g);g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(12).ok,false);g.player.reload=0;
 const restore=g.restoreSave;g.restoreSave=()=>false;
 try{refuse(g,/sauvegarde a refusé/);}finally{g.restoreSave=restore;}
 assert.deepEqual(checkpoint(g),before);assert.equal(g.worldOps131.upgradeDetails159(13).ok,false);
});

test('163 a ground-level character track on new furnishing refuses activation without moving or healing it',()=>{
 const g=campaign(),point=furnishingPoint(g,'DW-1223',.4,{groundEnemy:true}),enemy=point.p.id+':e0',old=model(11,g.frontier.position().ecologyVersion,g.frontier.position().hydrologyVersion);assert.ok(old.threatCount(point.p)>0);
 const prior=old.pois.find(p=>p.id===point.p.id),levels=prior.legacyLevels160||prior.levels;
 assert.equal(levels[G.hash(prior.id,0)%levels.length],0);
 assert.ok(old.biomes.enemyProfile(old.seed,prior.x,prior.y,enemy,{generation:old.generation}).health>=13,'The wounded contact must belong to a real enemy profile');
 install(g,d=>{d.frontier.enemies[enemy]=13;d.frontier.tracks[enemy]={x:point.x,y:point.y,z:0,a:0,mode:'search',ttl:4,gx:point.x,gy:point.y,cool:.1};});
 refuse(g,/personnage ou équipement régional/);assert.equal(g.frontier.enemyHealth(enemy),13);
});

test('163 a saved outdoor bivouac on a new pier refuses activation atomically',()=>{
 const g=campaign(),point=campPier(g);
 install(g,d=>{d.expansions127.modules.survival.serial=2;d.expansions127.modules.survival.camps=[{id:1,domain:'region',x:point.x,y:point.y,z:0,inside:null,left:123,cover:0}];});
 refuse(g,/bivouac/);
});

test('163 a placed lamp retains its charge when new furniture would cover it',()=>{
 const g=campaign(),point=furnishingPoint(g,'DW-1223',.4);
 install(g,d=>{d.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:17,on:false,used:true,domain:'region',x:point.x,y:point.y,z:0,inside:point.inside,angle:0}]};});
 refuse(g,/équipement régional/);assert.equal(g.nightGear.snapshot().devices[0].left,17);
});

test('163 a paid parked car on a new pier keeps identity, cargo, fuel and damage when migration is refused',()=>{
 const g=campaign(),core=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77&&!garage;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(core.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);}
 assert.ok(garage);g.refreshMetrics(true);standAt(g,g.player,g.core());assert.equal(g.expeditions.buildCar().ok,true);
 const point=pierFixture(g,g.worldEvolution.vehicleProfile());
 install(g,d=>{d.expeditions.vehicle.fuel=3;d.expeditions.vehicle.cargo.scrap=4;d.expeditions.vehicle.health=123;d.frontier.car={id:d.expeditions.vehicle.id,x:point.x,y:point.y,a:point.a,driving:false};});
 refuse(g,/véhicule régional/);
});

test('163 new upper and underground inspection planes survive real stairs, save and Continue without remapping ground enemies',()=>{
 for(const [programme,delta]of [['DW-0266',1],['DW-0294',-1]]){
  const g=campaign();assert.equal(g.worldOps131.upgradeDetails159(12).ok,true);
  const w=g.frontier.world(),p=w.contextSites160().find(p=>p.programme160===programme),stair=w.plan(p,0).stairs[0];assert.ok(stair);
  const point=G.global(p,stair.x+stair.w/2,stair.y+stair.h/2);
  install(g,d=>{Object.assign(d.frontier,{active:true,x:point.x,y:point.y,z:0,inside:p.id,anchor:{x:g.player.x,y:g.player.y}});d.frontier.seen=[...new Set([...d.frontier.seen,p.id])];});
  assert.equal(g.frontier.stairsStatus(delta).ok,true);assert.equal(g.frontier.stairs(delta),true);assert.equal(g.frontier.position().z,delta);
  const before=checkpoint(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),before);
  assert.equal(g.frontier.world().blocked(point.x,point.y,W.RULES.footRadius,delta,p.id),false);
  assert.equal(g.frontier.stairs(-delta),true);assert.equal(g.frontier.position().z,0);
 }
});

test('163 preview and actual campaign expose the same eighteen inspection levels and measured stairs despite parcel-specific IDs',()=>{
 const P=require('../src/codex-plan165.js'),next=model(12),cards=X.records.filter(c=>A.supports(c));assert.equal(cards.length,18);
 for(const card of cards){
  const p=next.contextSites160().find(p=>p.programme160===card.id);assert.ok(p);
  const preview=P.inspect(card.id,17117,0,12,10),live=next.plan(p,0);assert.deepEqual(preview.levels,p.levels);
  assert.equal(preview.p.w,p.w);assert.equal(preview.p.h,p.h);assert.notEqual(preview.p.id,p.id);
  const stair=o=>({x:o.x,y:o.y,w:o.w,h:o.h,levels:o.levels,architecture163:o.architecture163});
  assert.deepEqual(preview.plan.stairs.map(stair),live.stairs.map(stair),card.id);
  assert.ok(preview.plan.stairs.every(o=>o.id.startsWith(preview.p.id+':')));assert.ok(live.stairs.every(o=>o.id.startsWith(p.id+':')));
  for(const z of p.levels.filter(z=>z!==0)){
   const upper=P.inspect(card.id,17117,z,12,10);assert.deepEqual(upper.plan.objects,[]);assert.deepEqual(next.plan(p,z).objects,[]);
  }
 }
});
