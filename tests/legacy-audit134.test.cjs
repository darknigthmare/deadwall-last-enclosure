'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const {boot131}=require('./helpers/expansions131.cjs');
function fresh(){const e=bootGame();e.game.startNew('standard','17117');return e.game;}
function put(g,type,x=70,y=65){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}
function microgrid(g,progress=1){const d=g.serialize();d.worldEvolution.districts.east={level:1,buildings:[{type:'power',slot:0,progress}]};g.restoreSave(d);}

test('1.34 legacy grid: completed annex generation powers real circuits, preview and step agree',()=>{
 const g=fresh(),lamps=Array.from({length:4},(_,i)=>put(g,'searchlight',75+i*3,65));microgrid(g);
 assert.equal(g.powerGenerated,12);assert.equal(g.powerUsed,12);assert.ok(lamps.every(b=>g.world.buildings.get(b.id).powered));
 for(let i=0;i<20;i++){g.powerGrid.step(.04);assert.equal(g.powerGenerated,12);assert.equal(g.powerGrid.overview().generation,12);assert.ok(lamps.every(b=>g.world.buildings.get(b.id).powered));g.refreshMetrics(true);}
 assert.equal(g.powerGrid.overview().shortfall,0);
});
test('1.34 legacy grid: annex surplus charges batteries once, and demand consumes it once',()=>{
 const g=fresh(),battery=put(g,'batteryCabinet');microgrid(g);const lights=Array.from({length:3},(_,i)=>put(g,'searchlight',75+i*3,65));
 const q=g.powerGrid.charge(battery.id);for(let i=0;i<25;i++)g.powerGrid.step(.04);
 assert.ok(Math.abs(g.powerGrid.charge(battery.id)-q-2.7)<1e-7,'3 surplus × 1 second × 90%');assert.equal(g.powerGrid.overview().generation,12);
 g.refreshMetrics(true);assert.equal(g.powerGenerated,12);assert.ok(lights.every(b=>b.powered));
});
test('1.34 legacy grid: unfinished annex cannot supply energy; a new world retains none',()=>{
 const g=fresh();microgrid(g,.9);assert.equal(g.powerGenerated,8);assert.equal(g.powerGrid.overview().generation,8);microgrid(g);assert.equal(g.powerGenerated,12);
 g.startNew('standard','18118');assert.equal(g.powerGenerated,8);g.powerGrid.step(.04);assert.equal(g.powerGenerated,8);assert.equal(g.worldEvolution.districtEffects().power,0);
});
test('1.34 legacy controllers: rejected new campaign preserves owned equipment and records',()=>{
 const g=fresh(),d=g.serialize();d.worldEvolution.districts.east={level:1,buildings:[{type:'housing',slot:0,progress:1}]};d.worldEvolution.posture='crouch';const target=g.essentials.targets().find(t=>t.family==='aid');d.essentials.jobs[target.id]={stage:'delivered'};d.frontier.seen.push(target.poi);d.essentials.stock.aid=2;d.fieldSupplies.reserve=5;g.restoreSave(d);
 // The legacy controller remains independently usable, even before outer 1.27 validation.
 const before=g.serialize(),world=g.world;assert.equal(g.startNew('standard','not-a-number'),false);assert.equal(g.world,world);const after=g.serialize();
 for(const key of ['worldEvolution','essentials','fieldSupplies','fieldAtlas','frontier','fieldcraft','resources','player'])assert.deepEqual(after[key],before[key],key);
});
test('1.34 legacy controllers: invalid scenario is non-destructive across current wrapper stack',()=>{
 const {g}=boot131();require('../src/succession133.js').install(g);const before=g.serialize(),world=g.world;assert.equal(g.startNew('standard','17117','invalid-scenario'),false);assert.equal(g.world,world);const after=g.serialize();
 for(const key of ['worldEvolution','essentials','fieldSupplies','fieldAtlas','frontier','fieldcraft','nightGear','expansions127','succession133','resources','player'])assert.deepEqual(after[key],before[key],key);
});
