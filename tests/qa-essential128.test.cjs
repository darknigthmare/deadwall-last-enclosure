'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const C=require('../src/core.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function fresh(){const {game:g}=boot127();g.startNew('standard','17117');g.units=[];g.phaseTime=9999;return g;}
function carriedSave(g){const t=g.essentials.targets()[0],raw=copy(g.serialize());raw.frontier.seen=[...new Set([...raw.frontier.seen,t.poi])];raw.essentials.jobs[t.id]={stage:'player'};Object.assign(raw.player,{dead:true,health:0,downTimer:.02});return{raw,id:t.id};}
test('1.28 essential review: imported downed commander drops module before same-frame revival',()=>{
 const g=fresh(),{raw,id}=carriedSave(g);Object.assign(raw.player,{x:2400,y:2450});g.restoreSave(raw);g.update(.04);
 assert.equal(g.player.dead,false);const held=g.essentials.snapshot().jobs[id];assert.equal(held.stage,'ground');assert.deepEqual(held.point,{domain:'local',x:2400,y:2450,z:0,inside:null});assert.equal(g.essentials.carrying(),false);
 const after=copy(g.essentials.snapshot());assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.essentials.snapshot(),after);g.update(.04);assert.deepEqual(g.essentials.snapshot(),after);
});
test('1.28 essential review: regional death retains the actual drop domain before evacuation',()=>{
 const g=fresh();g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());const f=g.frontier.position(),{raw,id}=carriedSave(g);g.restoreSave(raw);g.update(.04);
 const held=g.essentials.snapshot().jobs[id];assert.equal(held.stage,'ground');assert.equal(held.point.domain,'region');assert.equal(held.point.z,f.z);assert.equal(held.point.inside,f.inside);assert.ok(Math.hypot(held.point.x-f.x,held.point.y-f.y)<.001);assert.equal(g.essentials.carrying(),false);assert.ok(g.save(false));
});
test('1.28 essential review: death cancels almost-completed assembly at the exact revival point',()=>{
 const g=fresh(),t=g.essentials.targets().find(t=>t.family==='light'),raw=copy(g.serialize());raw.frontier.seen=[t.poi];raw.essentials.jobs[t.id]={stage:'delivered'};g.restoreSave(raw);
 Object.assign(g.player,g.coreArrivalPosition(g.player,{x:g.core().x+80,y:g.core().y}));assert.ok(g.essentials.begin('craft','light').ok);for(let i=0;i<124;i++)g.update(.04);assert.ok(g.essentials.status().task.progress>.99);
 const supplies={scrap:g.resources.scrap,fuel:g.resources.fuel},stock=g.essentials.snapshot().stock.light;Object.assign(g.player,{dead:true,health:0,downTimer:.02});g.update(.04);
 assert.equal(g.player.dead,false);assert.equal(g.essentials.busy(),false);assert.equal(g.essentials.snapshot().stock.light,stock);assert.equal(g.resources.scrap,supplies.scrap);assert.equal(g.resources.fuel,supplies.fuel);
 assert.ok(g.essentials.begin('craft','light').ok);for(let i=0;i<125;i++)g.update(.04);assert.equal(g.essentials.snapshot().stock.light,stock+1);assert.equal(g.resources.scrap,supplies.scrap-C.Essentials.RULES.kits.light.cost.scrap);assert.equal(g.resources.fuel,supplies.fuel-C.Essentials.RULES.kits.light.cost.fuel);
});
test('1.28 essential review: a native world horde drops the module at regional death in the same update',()=>{
 const g=fresh();g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());const w=g.frontier.world();let point;
 for(const r of w.roads){const p={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2};if(!w.blocked(p.x,p.y,.4)&&!w.nearPOI(p.x,p.y,100).length){point=p;break;}}assert.ok(point);
 const t=g.essentials.targets()[0],raw=copy(g.serialize());Object.assign(raw.frontier,{...point,z:0,inside:null,seen:[t.poi]});raw.essentials.jobs[t.id]={stage:'player'};Object.assign(raw.player,{health:1,dead:false,invulnerable:0});
 Object.assign(raw.worldEvolution,{serial:1,nextHorde:10000,groups:[{id:'W0000',kind:'resting',count:80,lost:0,wound:0,...point,a:0,seen:true}]});g.restoreSave(raw);g.update(.04);
 assert.equal(g.player.dead,true);assert.equal(g.frontier.active(),false);const dropped=g.essentials.snapshot().jobs[t.id];assert.equal(dropped.stage,'ground');assert.deepEqual(dropped.point,{domain:'region',...point,z:0,inside:null});
 g.update(.04);assert.deepEqual(g.essentials.snapshot().jobs[t.id],dropped);assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.essentials.snapshot().jobs[t.id],dropped);
});
