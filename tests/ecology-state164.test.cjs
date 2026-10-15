'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
require('../src/core.js');
require('../src/codex-context160.js');
const S=require('../src/frontier-state.js'),W=require('../src/frontier-world.js');
const Ops=require('../src/world-pack131.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const checkpoint=g=>{const d=copy(g.serialize());delete d.timestamp;return d;};
function campaign(){const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();return g;}

test('164 ecology is an explicit independent save axis and historical records default to zero',()=>{
 assert.equal(S.initial().ecologyVersion,0);
 const historical={...S.initial(),generation:8};delete historical.ecologyVersion;
 assert.equal(S.normalize(historical).ecologyVersion,0);
 for(let generation=1;generation<=10;generation++){
  assert.equal(S.normalize({...historical,generation,ecologyVersion:0}).ecologyVersion,0);
  if(generation>=7)for(const detailVersion of [0,1,12,13])assert.equal(S.normalize({...historical,generation,detailVersion,ecologyVersion:1}).ecologyVersion,1);
  else assert.throws(()=>S.normalize({...historical,generation,ecologyVersion:1}),/Écologie incompatible/);
 }
 for(const ecologyVersion of [-1,2,.5,'1',true,null,{},[]])assert.throws(()=>S.normalize({...historical,ecologyVersion}),/Écologie régionale/);
 assert.equal(S.normalize({...historical,detailVersion:13}).detailVersion,13);
 assert.throws(()=>S.normalize({...historical,detailVersion:14}),/Détail/);
});

test('164 validator cache separates ecology revisions and uses the world enemy profile as authority',()=>{
 const calls=[],profiles=[];
 const World={sizeForGeneration:()=>24576,create(seed,generation,effects){
  calls.push({seed,generation,...effects});
  return{seed,pois:[{id:'P0000',x:12,y:24,levels:[0]}],threatCount:()=>1,
   biomes:{enemyProfile(s,x,y,id,options){profiles.push({seed:s,x,y,id,options,ecologyVersion:effects.ecologyVersion});return{health:effects.ecologyVersion?42:65};}}};
 }};
 const sandbox={module:{exports:{}},DeadwallFrontierWorld:World,DeadwallFrontierGeometry:{},DeadwallBiomes135:{enemyProfile(){assert.fail('The validator bypassed the world biome authority');}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/frontier-state.js'),'utf8'),sandbox);
 const State=sandbox.module.exports,record={...State.initial(),generation:8,seen:['P0000'],enemies:{'P0000:e0':43}};
 assert.equal(State.validate({...record,ecologyVersion:0},{worldSeed:17117}).enemies['P0000:e0'],43);
 assert.throws(()=>State.validate({...record,ecologyVersion:1},{worldSeed:17117}),/profil/);
 assert.equal(State.validate({...record,ecologyVersion:1,enemies:{'P0000:e0':42}},{worldSeed:17117}).ecologyVersion,1);
 assert.equal(State.validate({...record,ecologyVersion:0},{worldSeed:17117}).ecologyVersion,0);
 assert.deepEqual(calls.map(c=>c.ecologyVersion),[0,1]);
 assert.equal(profiles.length,4);
 for(const p of profiles){assert.equal(p.seed,17117);assert.equal(p.x,12);assert.equal(p.y,24);assert.equal(p.id,'P0000:e0');assert.equal(p.options.generation,8);}
});

test('164 fresh G8 campaigns select ecology one while Continue of an empty historical G7 remains historical',()=>{
 const g=campaign();assert.equal(g.frontier.position().generation,8);assert.equal(g.frontier.position().ecologyVersion,1);
 assert.equal(g.frontier.world().ecologyVersion,1);assert.equal(g.frontier.snapshot().ecologyVersion,1);
 const current=checkpoint(g);assert.equal(g.restoreSave(copy(g.serialize())),true);assert.deepEqual(checkpoint(g),current);
 const historical=copy(g.serialize());historical.frontier.generation=7;delete historical.frontier.ecologyVersion;
 const home=globalThis.DeadwallGeography135.home(historical.worldSeed,7);historical.frontier.x=home.maxX+2;historical.frontier.y=home.y;
 if(historical.expansions127.modules.lore131)historical.expansions127.modules.lore131.siteGeneration=7;
 assert.equal(g.restoreSave(historical),true);assert.equal(g.frontier.position().ecologyVersion,0);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.equal(g.frontier.position().generation,7);assert.equal(g.frontier.position().ecologyVersion,0);assert.equal(g.frontier.world().ecologyVersion,0);
 standAt(g,g.player,g.core());const before=checkpoint(g),action=g.worldOps131.actions().find(a=>a.id==='expandCodex3000');
 assert.equal(action.run().ok,true);const after=checkpoint(g);assert.equal(after.frontier.generation,8);assert.equal(after.frontier.ecologyVersion,0);
 assert.deepEqual(after.frontier.taken,before.frontier.taken);assert.deepEqual(after.resources,before.resources);
 g.startNew('standard','42');assert.equal(g.frontier.position().generation,8);assert.equal(g.frontier.position().ecologyVersion,1);
});

test('164 G9 G10 and detail candidates preserve the selected ecology and finite world records',()=>{
 const g=campaign(),create=W.create,candidates=[];
 W.create=function(seed,generation,effects){const world=create(seed,generation,effects);candidates.push({generation,ecologyVersion:effects?.ecologyVersion,world});return world;};
 try{
  const before=checkpoint(g),expand=g.worldOps131.actions().find(a=>a.id==='expandCodex4000');assert.ok(expand&&!expand.disabled);
  assert.equal(expand.run().ok,true);assert.equal(g.frontier.position().generation,9);assert.equal(g.frontier.world().ecologyVersion,1);
  const activation=g.worldOps131.activateTerritories160();assert.equal(activation.ok,true,activation.reason);assert.equal(g.frontier.position().generation,10);
  assert.equal(g.worldOps131.upgradeDetails159(12).ok,true);assert.equal(g.frontier.snapshot().detailVersion,12);
  const after=checkpoint(g);assert.equal(after.frontier.ecologyVersion,1);assert.equal(g.frontier.world().ecologyVersion,1);
  assert.deepEqual(after.resources,before.resources);assert.deepEqual(after.nodes,before.nodes);assert.deepEqual(after.frontier.taken,before.frontier.taken);
  assert.equal(g.restoreSave(copy(g.serialize())),true);assert.equal(g.frontier.position().ecologyVersion,1);
 }finally{W.create=create;}
 assert.ok(candidates.some(q=>q.generation===9));assert.ok(candidates.some(q=>q.generation===10));
 assert.ok(candidates.every(q=>q.ecologyVersion===1&&q.world.ecologyVersion===1),'Every validator and activation candidate must preserve ecology one');
});

test('164 a regional spawn and save validation share the exact same ecological enemy profile',()=>{
 const g=campaign(),world=g.frontier.world();
 const site=world.pois.find(p=>world.threatCount(p)>0&&p.levels.includes(0));assert.ok(site);
 const data=copy(g.serialize());Object.assign(data.frontier,{active:true,x:site.x,y:site.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 data.frontier.seen.push(site.id);assert.equal(g.restoreSave(data),true);g.update(.04);
 const contacts=g.frontier.contacts().filter(e=>e.poi===site.id);assert.ok(contacts.length,'The scenario must stream a real contact');
 const live=g.frontier.world();
 for(const contact of contacts){const expected=live.biomes.enemyProfile(live.seed,site.x,site.y,contact.id,{generation:8});assert.equal(contact.maxHealth,expected.health);assert.equal(contact.kind,expected.kind);}
 const saved=copy(g.serialize());assert.equal(g.restoreSave(saved),true);assert.equal(g.frontier.position().ecologyVersion,1);
});

test('164 survival surroundings read the current world provider and invalidate a replaced provider without changing the save',()=>{
 const g=campaign(),data=copy(g.serialize()),home=g.frontier.world().home;
 Object.assign(data.frontier,{active:true,x:home.maxX+6,y:home.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 assert.equal(g.restoreSave(data),true);const world=g.frontier.world(),provider=world.biomes,calls=[];
 const replacement=name=>({...provider,sample(seed,x,y,palette,options){calls.push({seed,x,y,palette,generation:options.generation});return{...provider.sample(seed,x,y,palette,options),name};}});
 try{
  const before=checkpoint(g);world.biomes=replacement('Milieu observé A');
  const row=()=>g.survivalPack.overview().rows.find(r=>r.label==='Carte & milieu').value;
  assert.match(row(),/Milieu observé A/);const reads=calls.length;assert.match(row(),/Milieu observé A/);assert.equal(calls.length,reads,'An unchanged context should reuse the bounded terrain read');
  world.biomes=replacement('Milieu observé B');assert.match(row(),/Milieu observé B/);assert.equal(calls.length,reads+1,'Replacing the provider must invalidate the terrain cache');
  assert.deepEqual(checkpoint(g),before);
  for(const call of calls){assert.equal(call.seed,world.seed);assert.equal(call.x,data.frontier.x);assert.equal(call.y,data.frontier.y);assert.equal(call.palette,false);assert.equal(call.generation,8);}
 }finally{world.biomes=provider;}
});

test('164 age exploration evidence counts the current ecological identities of actually harvested sites',()=>{
 const g=campaign(),world=g.frontier.world(),sites=[];
 for(const p of world.pois){if(!p.levels.includes(0))continue;const object=world.plan(p,0).objects.find(o=>o.amount>=12);if(object)sites.push({p,object});if(sites.length===2)break;}
 assert.equal(sites.length,2);const data=copy(g.serialize());
 for(const {p,object}of sites){data.frontier.seen.push(p.id);data.frontier.taken[object.id]=12;}
 assert.equal(g.restoreSave(data),true);const current=g.frontier.world(),provider=current.biomes,calls=[];
 current.biomes={...provider,sample(seed,x,y,palette,options){const index=sites.findIndex(({p})=>p.x===x&&p.y===y);assert.ok(index>=0);calls.push({seed,x,y,palette,generation:options.generation});return{...provider.sample(seed,x,y,palette,options),id:'ecological-evidence-'+index};}};
 try{
  const before=checkpoint(g),facts=g.urban.facts();assert.equal(facts.pois,2);assert.equal(facts.biomes,2);assert.ok(calls.length>=2);
  for(const call of calls){assert.equal(call.seed,current.seed);assert.equal(call.palette,false);assert.equal(call.generation,8);}
  assert.deepEqual(checkpoint(g),before,'Reading the evidence must not reveal or replenish any site');
 }finally{current.biomes=provider;}
});
