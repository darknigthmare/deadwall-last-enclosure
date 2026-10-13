'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
const Context=require('../src/codex-context160.js'),Ops=require('../src/world-pack131.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const checkpoint=g=>{const data=copy(g.serialize());delete data.timestamp;return data;};
const models=new Map();
function model(generation){if(!models.has(generation))models.set(generation,W.create(17117,generation,{detailVersion:1}));return models.get(generation);}
function campaign(generation=8){
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 assert.equal(g.frontier.position().generation,8);
 if(generation===9){const action=g.worldOps131.actions().find(a=>a.id==='expandCodex4000');assert.equal(action.run().ok,true);}
 return g;
}
function newContextPoint(generation,radius=.32,clearInBoth=false,predicate=()=>true){
 const old=model(generation),next=model(10);
 for(const p of next.pois.filter(p=>p.generation>generation)){
  const r=p.reserve;for(let y=r.t+radius+1;y<r.b-radius-1;y+=4)for(let x=r.l+radius+1;x<r.r-radius-1;x+=4){
   const point={x,y,z:0,inside:null,poi:p.id};if(!old.blocked(x,y,radius,0,null)&&(!clearInBoth||!next.blocked(x,y,radius,0,null))&&predicate(point,old,next))return point;
  }
 }
 assert.fail('A genuinely new territory must occupy previously free regional ground');
}
function installRaw(g,mutate){const data=g.serialize();mutate(data);assert.equal(g.restoreSave(data),true);return checkpoint(g);}
function refusedWithoutMutation(g,pattern){const before=checkpoint(g),world=g.world,q=g.worldOps131.previewTerritories160();assert.equal(q.ok,false);assert.match(q.reason,pattern);assert.equal(g.worldOps131.activateTerritories160().ok,false);assert.equal(g.world,world);assert.deepEqual(checkpoint(g),before);}

test('G10: fresh campaigns remain G8 and activation is explicit, guarded and free of supplies',()=>{
 const g=campaign(),a=g.worldOps131.actions().find(row=>row.id==='expandTerritories160');
 assert.equal(a.label,'ACTIVER LES 626 PROGRAMMES TERRITORIAUX');assert.equal(a.disabled,false);
 const q=g.worldOps131.previewTerritories160();assert.equal(q.fromGeneration,8);assert.equal(q.generation,10);assert.equal(q.programmes,626);assert.deepEqual(q.cost,{});assert.equal(q.seconds,0);
 g.player.reload=1;refusedWithoutMutation(g,/rechargement/i);g.player.reload=0;
 require('./helpers/generation141.cjs').legacy(g,7);refusedWithoutMutation(g,/G8 ou G9/);
});

test('G10: preview neither serializes nor synchronizes regional tracks, advances RNG or creates supplies',()=>{
 const g=campaign(),before=checkpoint(g),world=g.world,serialize=g.serialize,frontier=g.frontier;
 g.serialize=()=>{assert.fail('A territorial preview must not call serialize');};
 g.frontier=Object.freeze({...frontier,snapshot:()=>assert.fail('A territorial preview must not synchronize tracks')});
 try{for(let i=0;i<3;i++){const q=g.worldOps131.previewTerritories160();assert.equal(q.ok,true,q.reason);assert.equal(g.world,world);}}
 finally{g.serialize=serialize;g.frontier=frontier;}
 assert.deepEqual(checkpoint(g),before);
});

test('G10: activation never silently releases a manual post or an unfinished relocation',()=>{
 const g=campaign(),fieldcraft=g.fieldcraft;
 try{for(const pending of [{mounted:1},{moving:1},{quote:{id:1}}]){g.fieldcraft=Object.freeze({...fieldcraft,context:()=>pending});refusedWithoutMutation(g,pending.mounted?/poste manuel/i:/réimplantation/i);assert.deepEqual(g.fieldcraft.context(),pending);}}
 finally{g.fieldcraft=fieldcraft;}
});

for(const generation of [8,9])test('G10: additive activation from G'+generation+' preserves finite ledgers, paid surveys and a v20 reload',()=>{
 const g=campaign(generation),old=model(generation),next=model(10),sector=old.sectors.find(s=>s.sites.length&&next.sectors.find(n=>n.id===s.id).sites.length>s.sites.length);
 assert.ok(sector,'A paid existing survey gains appended sites only in its own sector');
 const before=installRaw(g,data=>{data.frontier.seen=sector.sites.slice();data.expansions127.modules.world131.surveyed=[sector.id];const tree=old.chunk(48,48).trees[0];assert.ok(tree);data.frontier.taken[tree.id]=Math.min(1,tree.amount);});
 assert.equal(g.worldOps131.activateTerritories160().ok,true);const after=checkpoint(g);assert.equal(after.version,20);assert.equal(after.frontier.generation,10);
 for(const key of Object.keys(before).filter(key=>key!=='frontier'))assert.deepEqual(after[key],before[key],key);
 for(const key of Object.keys(before.frontier).filter(key=>!['generation','seen'].includes(key)))assert.deepEqual(after.frontier[key],before.frontier[key],key);
 const surveyed=next.sectors.find(s=>s.id===sector.id).sites;assert.ok(surveyed.every(id=>after.frontier.seen.includes(id)));
 assert.ok(after.frontier.seen.every(id=>before.frontier.seen.includes(id)||surveyed.includes(id)),'No unpaid sector is revealed');
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),after);
 assert.equal(g.worldOps131.actions().some(a=>a.id==='expandTerritories160'),false);refusedWithoutMutation(g,/déjà activés/);
 assert.equal(next.pois.length<=5000,true);assert.equal(next.pois.every(p=>/^P\d{4}$/.test(p.id)),true);
});

test('G10: a camp on a new walkable context prevents activation without requiring a new wall',()=>{
 const g=campaign(9),point=newContextPoint(9,C.SurvivalPackRules.campRadius,true);assert.equal(model(10).blocked(point.x,point.y,C.SurvivalPackRules.campRadius),false);
 installRaw(g,data=>{data.expansions127.modules.survival.serial=2;data.expansions127.modules.survival.camps=[{id:1,domain:'region',x:point.x,y:point.y,z:0,inside:null,left:300,cover:0}];});
 refusedWithoutMutation(g,/bivouac/i);
});

test('G10: an existing placed light remains finite and cannot be overlaid by a new context',()=>{
 const g=campaign(9),point=newContextPoint(9,.28);
 installRaw(g,data=>{data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:17,on:false,used:true,domain:'region',x:point.x,y:point.y,z:0,inside:null,angle:0}]};});
 refusedWithoutMutation(g,/éclairage/i);assert.equal(g.nightGear.snapshot().devices[0].left,17);
});

test('G10: essential effects and dropped cargo are protected even away from the camera',()=>{
 for(const kind of ['effect','cargo']){
  const g=campaign(9),point=newContextPoint(9,.32),target=g.essentials.targets().find(t=>t.family==='light');assert.ok(target);
  installRaw(g,data=>{data.frontier.seen=[target.poi];if(kind==='effect'){data.essentials.jobs[target.id]={stage:'delivered'};data.essentials.serial=2;data.essentials.effects=[{id:1,kind:'light',domain:'region',x:point.x,y:point.y,z:0,inside:null,left:8,pulse:0}];}else data.essentials.jobs[target.id]={stage:'ground',point:{domain:'region',x:point.x,y:point.y,z:0,inside:null}};});
  refusedWithoutMutation(g,kind==='effect'?/dispositif/i:/colis/i);
 }
});

test('G10: the inactive commander regional return position cannot be silently displaced',()=>{
 const g=campaign(9),point=newContextPoint(9,.32);installRaw(g,data=>{Object.assign(data.frontier,{x:point.x,y:point.y,z:0,inside:null});});
 refusedWithoutMutation(g,/dernière position/i);
});

test('G10: a real regional death preserves the body and bag and blocks an overlapping extension',()=>{
 const g=campaign(9);require('../src/player-pack131.js').install(g);require('../src/succession133.js').install(g);
 const point=newContextPoint(9,.32);installRaw(g,data=>{Object.assign(data.frontier,{active:true,x:point.x,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});data.player.carry.food=8;});
 g.player.invulnerable=0;g.frontier.damage(1000);const remains=g.succession133.remains();assert.equal(remains.length,1);assert.equal(remains[0].point.domain,'region');assert.equal(remains[0].bag.food,8);
 assert.equal(g.succession133.select('builder'),true);standAt(g,g.player,g.core());refusedWithoutMutation(g,/corps ou un sac/i);assert.deepEqual(g.succession133.remains(),remains);
});

test('G10: a paid parked vehicle keeps fuel, cargo and its identity when migration is refused',()=>{
 const g=campaign(9),core=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77&&!garage;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(core.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);}
 assert.ok(garage);g.refreshMetrics(true);standAt(g,g.player,g.core());assert.equal(g.expeditions.buildCar().ok,true);
 const profile=g.worldEvolution.vehicleProfile(),point=newContextPoint(9,3,false,(q,old)=>old.vehicleClear(q.x,q.y,0,profile.w,profile.h));assert.equal(model(9).vehicleClear(point.x,point.y,0,profile.w,profile.h),true);
 installRaw(g,data=>{data.expeditions.vehicle.fuel=3;data.expeditions.vehicle.cargo.scrap=4;data.frontier.car={id:data.expeditions.vehicle.id,x:point.x,y:point.y,a:0,driving:false};});
 refusedWithoutMutation(g,/voiture/i);
});

test('G10: old save geometry and strict regional identifiers remain valid; unsupported generations and forged loot are atomic failures',()=>{
 const g=campaign(9);assert.equal(g.worldOps131.activateTerritories160().ok,true);
 const w=g.frontier.world(),p=w.pois.find(p=>p.generation===10&&w.plan(p,0).objects.some(o=>o.amount>0));assert.ok(p);
 const object=w.plan(p,0).objects.find(o=>o.amount>0);assert.match(object.id,/^P\d{4}:0:\d+$/);
 installRaw(g,data=>{data.frontier.seen.push(p.id);data.frontier.taken[object.id]=object.amount;});
 const before=checkpoint(g),world=g.world;
 for(const mutate of [data=>{data.frontier.generation=11;},data=>{data.frontier.generation=10.5;},data=>{data.frontier.seen.push('P10000');},data=>{data.frontier.taken[object.id]=object.amount+.01;},data=>{data.frontier.taken[p.id+':0:999999']=1;},data=>{data.frontier.seen.push('P9999');},data=>{data.frontier.z=3;}]){
  const bad=copy(before);mutate(bad);assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,world);assert.deepEqual(checkpoint(g),before);
 }
 for(let i=0;i<2;i++){assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.frontier.takenAmount(object.id),object.amount);}
 assert.equal(Context.ids.length,626);assert.equal(C.Frontier.MAX_TAKEN,120000);
});

test('G10: real regional harvesting drains one new container and a reload cannot refill it',()=>{
 const g=campaign(9);assert.equal(g.worldOps131.activateTerritories160().ok,true);
 const w=g.frontier.world(),Survey=require('../src/frontier-survey.js');let access;
 for(const p of w.pois.filter(p=>p.generation===10)){
  for(const o of w.plan(p,0).objects.filter(o=>o.amount>0&&o.amount<=g.player.carryCapacity&&!o.sealed131)){
   for(let y=o.y-1;y<o.y+o.h+1&&!access;y+=.4)for(let x=o.x-1;x<o.x+o.w+1&&!access;x+=.4){
    const point=G.global(p,x,y),pose={...point,z:0,inside:p.id};if(w.blocked(point.x,point.y,.32,0,p.id))continue;
    const targets=Survey.targets(w,pose,{},W.RULES.lootReach);if(targets[0]?.id===o.id)access={p,o,point};
   }
   if(access)break;
  }
  if(access)break;
 }
 assert.ok(access,'A new container has an actual free approach and line of interaction');
 const {p,o,point}=access;installRaw(g,data=>{
  Object.assign(data.frontier,{active:true,x:point.x,y:point.y,z:0,inside:p.id,anchor:{x:g.player.x,y:g.player.y}});data.frontier.seen=[p.id];
  for(const site of w.nearPOI(point.x,point.y,180))for(let i=0;i<w.threatCount(site);i++)data.frontier.enemies[site.id+':e'+i]=0;
  data.frontier.kills=Object.values(data.frontier.enemies).filter(h=>h===0).length;
 });
 const bagBefore=C.bagTotal(g.player.carry);g.input.keys.add('KeyE');
 for(let i=0;i<Math.ceil(o.amount/(W.RULES.lootRate*.04))+5&&g.frontier.takenAmount(o.id)<o.amount-.000001;i++)g.updatePlayer(.04);
 g.input.keys.clear();assert.ok(Math.abs(g.frontier.takenAmount(o.id)-o.amount)<.000001);assert.ok(Math.abs(C.bagTotal(g.player.carry)-bagBefore-o.amount)<.000001);
 const record=checkpoint(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),record);
 const remaining=Survey.targets(g.frontier.world(),g.frontier.position(),g.frontier.expansionRecord160().taken,W.RULES.lootReach).find(t=>t.id===o.id);assert.equal(remaining.left,0);
});

test('G10: reloading a regional operation cancels its unfinished job and conserves supplies',()=>{
 const g=campaign(9);assert.equal(g.worldOps131.activateTerritories160().ok,true);const w=g.frontier.world(),p=w.pois.find(p=>{if(p.generation!==10)return false;const q=G.global(p,p.w/2,-2);return!w.blocked(q.x,q.y,W.RULES.footRadius,0,null)&&w.line(q,q,0,null,null,.05);});assert.ok(p,'A new site has a physically free survey entrance');const point=G.global(p,p.w/2,-2);
 installRaw(g,data=>{Object.assign(data.frontier,{active:true,x:point.x,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});data.frontier.seen=[p.id];for(const[k,n]of Object.entries(C.WorldOpsRules131.survey.cost))data.player.carry[k]=n;for(const site of w.nearPOI(point.x,point.y,180))for(let i=0;i<w.threatCount(site);i++)data.frontier.enemies[site.id+':e'+i]=0;data.frontier.kills=Object.values(data.frontier.enemies).filter(h=>h===0).length;});
 assert.equal(g.worldOps131.begin('survey',p.id).ok,true);g.worldOps131.step(.1);assert.equal(g.worldOps131.busy(),true);
 const before=checkpoint(g);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.worldOps131.busy(),false);g.worldOps131.step(C.WorldOpsRules131.survey.seconds+1);
 assert.deepEqual(checkpoint(g),before);assert.equal(g.worldOps131.snapshot().surveyed.includes(p.sector),false);
});
