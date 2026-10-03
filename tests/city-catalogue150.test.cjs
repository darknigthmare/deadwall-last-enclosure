'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),M=require('../src/city-catalogue150.js');

test('city catalogue derives the installed city definitions without altering input data',()=>{
 const before=JSON.stringify(C),keysFrozen=Object.isFrozen(C.Essentials.keys),catalogue=M.create(C);
 assert.equal(JSON.stringify(C),before);assert.equal(Object.isFrozen(C.Essentials.keys),keysFrozen);
 assert.equal(catalogue.ages.length,11);assert.equal(new Set(catalogue.items.map(v=>v.key)).size,catalogue.items.length);
 const buildings=catalogue.items.filter(v=>v.kind==='building');assert.equal(buildings.length,Object.keys(C.BUILDINGS).length-1);
 for(const row of buildings){assert.deepEqual(row.cost,row.upgradeOnly?C.scaledCost(C.BUILDINGS[row.id].cost,C.MAINTENANCE_RULES.upgradeFactor):C.BUILDINGS[row.id].cost);assert.equal(row.tier,C.BUILDINGS[row.id].unlockTier);assert.notEqual(row.cost,C.BUILDINGS[row.id].cost);}
 assert.equal(catalogue.items.filter(v=>v.new150&&v.kind==='building').length,20);
 assert.ok(Object.isFrozen(catalogue));assert.ok(Object.isFrozen(catalogue.items[0].cost));
 assert.equal(catalogue.items.some(v=>v.id==='core'),false);assert.equal(catalogue.items.some(v=>v.id==='world-codex'),false);
});

test('catalogue keeps age knowledge separate from contracts, waves, surveys and physical supports',()=>{
 const catalogue=M.create(C),kitchen=catalogue.items.find(v=>v.id==='fieldKitchen'),greenhouse=catalogue.items.find(v=>v.id==='dayGreenhouse');
 assert.equal(kitchen.tier,1);assert.ok(kitchen.conditions.some(c=>c.kind==='contract'&&c.id==='market-kitchen'&&c.wave===3));
 assert.ok(kitchen.conditions.some(c=>c.kind==='building'&&c.id==='farm'));
 assert.ok(greenhouse.conditions.some(c=>c.kind==='survey'&&c.id==='housing-1'));
 const known=M.status(kitchen,{age:10,finished:[],resources:C.makeBag({wood:10000,scrap:10000}),storage:10000});
 assert.equal(known.known,true);assert.ok(known.missingBuildings.includes('farm'));assert.ok(known.extraConditions.some(c=>c.kind==='contract'));
 const gate=catalogue.items.find(v=>v.id==='armoredGate');assert.equal(gate.upgradeOnly,true);assert.deepEqual(gate.upgradeFrom,['gate']);
});

test('late choices include exact road, mechanism and companion prerequisites and costs',()=>{
 const catalogue=M.create(C);
 for(const [id,d]of Object.entries(C.Infrastructure.SURFACES)){const row=catalogue.items.find(v=>v.kind==='road'&&v.id===id);assert.equal(row.tier,d.unlockTier);assert.deepEqual(row.cost,d.cost);assert.ok(row.tradeoffs.some(t=>t.includes(String(d.hostileSpeed))));}
 for(const [id,d]of Object.entries(C.FortificationPackRules.mechanisms)){const row=catalogue.items.find(v=>v.kind==='mechanism'&&v.id===id);assert.equal(row.tier,d.tier);assert.deepEqual(row.cost,d.cost);assert.equal(row.payment,'bag');}
 assert.equal(catalogue.items.filter(v=>v.kind==='exercise').length,4);
 for(const row of catalogue.items.filter(v=>v.kind==='exercise')){const def=C.CompanionPackRules.exercises[row.id];assert.equal(row.tier,def.tier);assert.deepEqual(row.cost,def.cost);assert.equal(row.description,def.description);assert.ok(row.conditions.some(c=>c.kind==='training'&&c.id===def.requires));}
 for(let age=3;age<=10;age++)assert.ok(catalogue.forAge(age).some(v=>v.new150),'An advanced age contains its actual new choices');
});

test('plan prices and unlock ages are derived from paid foundations and discovery conditions',()=>{
 const catalogue=M.create(C);
 for(const def of C.Dayworks.PLANS){const row=catalogue.items.find(v=>v.kind==='plan'&&v.id===def.id),parts=C.Dayworks.footprint(def.id,0,0),cost={};
  for(const part of parts)for(const[k,n]of Object.entries(C.BUILDINGS[part.type].cost))cost[k]=(cost[k]||0)+n;
  assert.deepEqual(row.cost,cost);assert.ok(row.tier>=C.BUILDINGS.planningOffice.unlockTier);for(const part of parts)assert.ok(row.tier>=C.BUILDINGS[part.type].unlockTier);
  if(def.unlock)assert.ok(row.conditions.some(c=>c.kind==='survey'));
 }
 assert.equal(catalogue.items.filter(v=>v.kind==='plan'&&v.new150).length,4);
});

test('a mechanical preparation reads the finite bag, while city costs read the depot and storage',()=>{
 const catalogue=M.create(C),mechanism=catalogue.items.find(v=>v.id==='counterweight'),reserve=catalogue.items.find(v=>v.id==='megaReserve');
 const ctx={age:10,finished:['spikes','workshop','logisticsHub'],resources:C.makeBag({wood:10000,scrap:10000,stone:10000}),bag:C.makeBag(),storage:500,research:[],insight:0};
 const original=JSON.stringify(ctx),trap=M.status(mechanism,ctx),store=M.status(reserve,ctx);
 assert.deepEqual(trap.missing,mechanism.cost);assert.equal(store.storageShortfall,1000);assert.deepEqual(store.missing,{});assert.equal(JSON.stringify(ctx),original);
 ctx.bag=C.makeBag(mechanism.cost);assert.deepEqual(M.status(mechanism,ctx).missing,{});
 ctx.storage=1700;assert.equal(M.status(reserve,ctx).storageShortfall,0);
});

test('read context excludes destroyed buildings and paid foundations without simulation snapshots',()=>{
 const g={tier:{id:7},storage:500,resources:C.makeBag(),player:{carry:C.makeBag()},research:{completed:['logistics'],insight:2},world:{buildings:new Map([[1,{type:'warehouse',health:900,completed:false}],[2,{type:'clinic',health:0,dead:true,completed:true}],[3,{type:'barracks',health:950,completed:true}],[4,{type:'barracks',health:950,completed:true}]])},serialize(){throw Error('Read must not serialize');},urban:{snapshot(){throw Error('Read must not snapshot');}}};
 const before=JSON.stringify(g),ctx=M.context(g);assert.deepEqual(ctx.finished,['barracks']);assert.equal(ctx.age,7);assert.equal(JSON.stringify(g),before);assert.notEqual(ctx.resources,g.resources);assert.notEqual(ctx.bag,g.player.carry);
});
