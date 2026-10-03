'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');
const {auditD17Progression}=require('./helpers/d17-progression149.cjs');
const {bootGame}=require('./helpers/browser.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');

test('D17 149: all eleven ages reached in order by paid physical construction, final services and exact Continue',()=>{
 const report=auditD17Progression();assert.equal(report.pass,true);
 assert.deepEqual(report.transitions.map(t=>t.threshold),C.CITY_TIERS.slice(1).map(t=>t.requiredScore));
 assert.equal(report.finalAge,10);assert.equal(report.saveVersion,C.SAVE_VERSION);
 assert.ok(report.saveReloads>=12);assert.ok(report.activeConstructionSeconds>0);
});

test('D17 149: capacity warning counts the largest resource, a finished store and a lost store without spending',()=>{
 const {game:g}=bootGame();g.startNew('standard','17117');
 // Explicit previously reached Metropole fixture. This test isolates capacity
 // information; the other scenario reaches all ages through real construction.
 g.urban.attain(210);g.refreshMetrics(true);
 const model=()=>g.urban.planning().nextModels.find(model=>model.id==='logisticsHub');
 const unchanged=()=>{const raw=g.serialize();delete raw.timestamp;return JSON.stringify(raw);};
 const before=unchanged();assert.equal(model().minimumStorage,600);assert.equal(model().storageShortfall,100);assert.equal(g.storage,500);assert.equal(unchanged(),before);
 let cell=null;for(let y=54;y<84&&!cell;y++)for(let x=54;x<84;x++)if(g.world.placement(C.BUILDINGS.warehouse,x,y).valid){cell={x,y};break;}
 assert.ok(cell);const stock={...g.resources};assert.equal(g.placeOne('warehouse',cell.x,cell.y),true);const b=g.world.atCell(cell.x,cell.y);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(C.BUILDINGS.warehouse.cost[key]||0));
 assert.equal(model().storageShortfall,100,'An uncompleted paid store adds no capacity');
 standAt(g,g.player,b);g.input.keys.add('KeyE');for(let tick=0;tick<400&&!b.completed;tick++)g.updateInteraction(.25);g.input.keys.clear();assert.equal(b.completed,true);
 assert.equal(g.storage,1100);assert.equal(model().storageShortfall,0);
 g.selectBuilding(b);assert.equal(g.demolishSelected(),true);assert.equal(g.storage,500);assert.equal(model().storageShortfall,100);
 const lost=unchanged();for(let i=0;i<4;i++)model();assert.equal(unchanged(),lost,'Reading a warning never deposits, pays or adds capacity');
 g.startNew('standard','17117');const examined=new Set();
 for(const tier of C.CITY_TIERS){g.urban.attain(tier.requiredScore);g.refreshMetrics(true);const v=g.urban.planning();for(const d of [...v.currentModels,...v.nextModels]){examined.add(d.id);assert.equal(d.minimumStorage,Math.max(0,...Object.values(C.BUILDINGS[d.id].cost)));assert.equal(d.storageShortfall,Math.max(0,d.minimumStorage-g.storage));}}
 assert.equal(examined.size,Object.keys(C.BUILDINGS).length-2,'Every placeable model is represented');
});
