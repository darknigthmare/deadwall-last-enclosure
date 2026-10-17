'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const fixtures=import('../scripts/browser-city-fixtures150.mjs');
const saved=g=>{const {timestamp,...raw}=g.serialize();return JSON.parse(JSON.stringify(raw));};
async function campaign(){
 const F=await fixtures,{g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);
 F.prepareAge150(10);F.prepareSupports150();return {g,F};
}
// Only the completed initial defence is prepared. The new foundations below
// are placed and paid through the native owner and advanced by declared time.
function completedFixture(g,site){
 const Building=g.core().constructor,b=new Building(g.nextId++,site.type,site.gx,site.gy,0,1);g.world.add(b);g.refreshMetrics(true);return b;
}
function putPaid(g,site){
 const C=DeadwallCore,d=C.BUILDINGS[site.type],before=saved(g);
 assert.equal(g.placeOne(site.type,site.gx,site.gy),true);
 const b=g.world.atCell(site.gx,site.gy);assert.ok(!b.completed);
 for(const [key,cost] of Object.entries(d.cost))assert.equal(g.resources[key],before.resources[key]-cost);
 // Declared isolated construction time, not RAF or an organic human campaign.
 b.work(d.buildTime);g.completeBuilding(b);assert.ok(b.completed);g.refreshMetrics(true);return b;
}
function restorable(g){const raw=DeadwallSave.validate(g.serialize());assert.equal(g.restoreSave(raw),true);g.togglePause(true);}
function assertProtection(g,p){
 const b=g.world.buildings.get(p.id);assert.ok(b&&b.completed&&!b.dead&&b.health>0);
 assert.ok(g.friendlyPositionClear(g.player,p.point.x,p.point.y));
 assert.ok(g.workerCanWorkAt({...g.player,...p.point},g.core(),100));
 assert.ok(Math.hypot(b.x-p.point.x,b.y-p.point.y)<=b.def.range-80);assert.ok(g.hostileLineClear(b,p.point));
}
test('188 three later paid buildings preserve the same defended service point through save/restore',async()=>{
 const {g,F}=await campaign();const setup=F.prepareConstruction150({type:'casemate150',protectCore:true});
 const b=completedFixture(g,setup.site),protection={id:b.id,point:setup.protectedPoint};restorable(g);
 for(const type of ['gateStore150','electricCannery150','continuityArsenal150']){
  const before=saved(g),selected=F.prepareConstruction150({type,preserveProtection:protection}),after=saved(g);
  after.player.x=before.player.x;after.player.y=before.player.y;after.phase=before.phase;after.phaseTime=before.phaseTime;
  assert.deepEqual(after,before,'selection does not change actors, possessions, health, RNG or existing construction');
  assert.deepEqual(selected.preservedProtection,protection);putPaid(g,selected.site);assertProtection(g,protection);restorable(g);assertProtection(g,protection);
 }
 const result=F.prepareService150({point:protection.point});assert.deepEqual(result.point,protection.point);assert.ok(g.workerCanWorkAt(g.player,g.core(),100));
});
test('188 reserving the historical southeast point rejects the cannery footprint that caused CI failure',async()=>{
 const {g,F}=await campaign(),core=g.core(),point={x:core.right-8,y:core.bottom+27};
 assert.ok(g.workerCanWorkAt({...g.player,...point},core,100));
 // Force only an existing legal casemate witness via a declared viewpoint.
 g.player.x=point.x;g.player.y=point.y;const setup=F.prepareConstruction150({type:'casemate150',protectCore:true});
 const b=completedFixture(g,setup.site),protection={id:b.id,point};assertProtection(g,protection);
 const selected=F.prepareConstruction150({type:'electricCannery150',preserveProtection:protection});
 putPaid(g,selected.site);assertProtection(g,protection);restorable(g);assertProtection(g,protection);
});
test('188 an out-of-reach requested service position refuses before changing any saved state',async()=>{
 const {g,F}=await campaign();let point=null;
 for(let y=64;y<DeadwallCore.WORLD_SIZE-64&&!point;y+=32)for(let x=64;x<DeadwallCore.WORLD_SIZE-64&&!point;x+=32){
  const candidate={x,y};if(g.friendlyPositionClear(g.player,x,y)&&!g.workerCanWorkAt({...g.player,...candidate},g.core(),100))point=candidate;
 }
 assert.ok(point,'the negative case uses a genuinely clear point beyond service reach');
 const before=saved(g),world=g.world;assert.throws(()=>F.prepareService150({point}),/No legal exterior service point/);
 assert.equal(g.world,world);assert.deepEqual(saved(g),before);
});
test('188 unavailable protection and malformed coordinates refuse before moving actors or changing the world',async()=>{
 const {g,F}=await campaign();for(const preservation of [{id:999999,point:{x:2000,y:2100}},{id:g.core().id,point:{x:NaN,y:2100}}]){
  const before=saved(g),world=g.world;assert.throws(()=>F.prepareConstruction150({type:'gateStore150',preserveProtection:preservation}),/Protected core work point/);
  assert.equal(g.world,world);assert.deepEqual(saved(g),before);
 }
});
