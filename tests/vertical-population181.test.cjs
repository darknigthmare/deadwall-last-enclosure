'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/vertical180.cjs');
const {C,R,S,boot,build,ascend,equip,tick,clone,snapshot,pair,bridge}=H;
const P=C.VerticalPopulation181;
function createUnit(g,kind='worker',at=null){
 const core=g.core(),u=g.createProtectedSurvivor(kind,at?.x??core.x+90,at?.y??core.y+15);
 assert.ok(u,'existing native survivor factory');return u;
}
function run(g,seconds,predicate=()=>false){
 for(let t=0;t<seconds-1e-8;t+=.1){if(predicate())return;g.updateUnits(.1);g.vertical175.step(.1);g.elapsed+=.1;}
 if(predicate!==undefined&&predicate())return;
}
function until(g,predicate,seconds=90){run(g,seconds,predicate);assert.ok(predicate(),JSON.stringify(g.vertical175.population.presentation()));}
function cleared(age=4){const g=boot(age);for(const n of g.world.nodes)n.harvest(n.amount);return g;}
function setup(kind='worker',type='lookout2a177',age=4){const g=cleared(age),b=build(g,type),u=createUnit(g,kind);g.player.x=g.core().x;g.player.y=g.core().y;return{g,b,u,v:g.vertical175,p:g.vertical175.population};}
function onDuty(f){assert.ok(f.p.assign(f.u.id,f.b.id,0).ok);until(f.g,()=>f.p.presentation().find(m=>m.id===f.u.id)?.mode==='duty',200);}
for(let age=0;age<11;age++)test('181 native worker reaches an operational palier at age '+age+' without duplication',()=>{
 const types=['lookout2a177','timberDeck3a177','workDeck6a177','refugeDeck12a177','verticalFoundation6','districtDeck12a177','rampart24','metroDeck18a177','megaDeck24a177','megaDeck30a177','megaDeck36a177'];
 const f=setup('worker',types[age],age),ids=f.g.units.map(u=>u.id),ammo=f.g.resources.ammo;onDuty(f);
 assert.deepEqual(f.g.units.map(u=>u.id),ids);assert.equal(f.u.carry,10);assert.equal(f.g.resources.ammo,ammo-10);assert.equal(f.p.pose(f.u).z,R.bases[types[age]].height);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('181 assignment does not withdraw remotely, create a survivor, grant age or move the unit',()=>{
 const f=setup(),before=snapshot(f.g),pos={x:f.u.x,y:f.u.y};assert.ok(f.p.assign(f.u.id,f.b.id,0).ok);
 assert.deepEqual(f.g.resources,before.resources);assert.deepEqual({x:f.u.x,y:f.u.y},pos);assert.equal(f.g.units.length,before.units.length);assert.equal(f.g.tier.id,4);
 assert.equal(f.p.assign(f.u.id,f.b.id,0).ok,false);
});
test('181 courier reaches the actual module before transferring finite native carried ammunition',()=>{
 const f=setup();Object.assign(f.g.player,f.v.entrance(f.b));ascend(f.g,f.b);const gun=equip(f.g,f.b,'handRifle177');f.v.access(f.b.id,-1);tick(f.g,10);f.g.player.x=f.g.core().x;f.g.player.y=f.g.core().y;
 const stock=f.g.resources.ammo;assert.ok(f.p.assign(f.u.id,f.b.id,0).ok);assert.equal(gun.ammo,0);
 until(f.g,()=>gun.ammo>=10,200);assert.equal(gun.ammo,10);assert.equal(f.u.carry,0);assert.equal(f.g.resources.ammo,stock-10);assert.equal(f.p.pose(f.u).z,2);
});
test('181 recall returns leftover supplies once without crediting harvesting or deposit objectives',()=>{
 const f=setup();f.g.resources.ammo=100;const stock=f.g.resources.ammo,progress=f.g.depositedResources;onDuty(f);assert.ok(f.p.recall(f.u.id).ok);
 until(f.g,()=>!f.p.isAssigned(f.u.id),200);assert.equal(f.u.carry,0);assert.equal(f.p.pose(f.u).z,0);assert.equal(f.g.resources.ammo,stock);assert.equal(f.g.depositedResources,progress);
 run(f.g,1);assert.equal(f.g.resources.ammo,stock);
});
test('181 paused personnel preserve bag, coordinates and dispatch state exactly',()=>{
 const f=setup();f.p.assign(f.u.id,f.b.id,0);run(f.g,2);const before=snapshot(f.g);f.g.paused=true;run(f.g,2);
 const after=snapshot(f.g);assert.deepEqual(after.expansions127.modules.vertical175.population,before.expansions127.modules.vertical175.population);assert.equal(f.u.x,before.units.find(u=>u.id===f.u.id).x);assert.equal(f.u.carry,before.units.find(u=>u.id===f.u.id).carry);
});
test('181 saves resume a native survivor in the staircase with the same bag and exact position',()=>{
 const f=setup('worker','rampart12');f.p.assign(f.u.id,f.b.id,0);until(f.g,()=>f.p.pose(f.u).z>1&&f.p.pose(f.u).z<11,200);
 const before={pose:f.p.pose(f.u),x:f.u.x,y:f.u.y,carry:f.u.carry,health:f.u.health};assert.ok(f.g.restoreSave(f.g.serialize()));const u=f.g.units.find(u=>u.id===f.u.id);
 assert.deepEqual({pose:f.p.pose(u),x:u.x,y:u.y,carry:u.carry,health:u.health},before);until(f.g,()=>f.p.presentation().find(m=>m.id===f.u.id)?.mode==='duty',50);
});
test('181 malformed personnel snapshots are rejected before campaign mutation',()=>{
 const f=setup();onDuty(f);const good=clone(f.g.serialize()),before=snapshot(f.g);
 const cases=[m=>m.id=999999,m=>m.level=6,m=>m.bridge=99,m=>m.home.level=6,m=>m.site=null,m=>m.extra=true];
 for(const change of cases){const bad=clone(good);change(bad.expansions127.modules.vertical175.population.members[0]);assert.throws(()=>f.g.restoreSave(bad),/Personnel vertical/);assert.deepEqual(snapshot(f.g),before);}
 const duplicate=clone(good);duplicate.expansions127.modules.vertical175.population.members.push(clone(duplicate.expansions127.modules.vertical175.population.members[0]));assert.throws(()=>f.g.restoreSave(duplicate),/Personnel vertical/);assert.deepEqual(snapshot(f.g),before);
});
test('181 legacy v4 migration adds no personnel, supplies or health',()=>{
 const f=setup(),good=f.g.serialize(),v=good.expansions127.modules.vertical175;v.version=4;delete v.population;const before=clone(good.resources),count=good.units.length;
 assert.ok(f.g.restoreSave(good));assert.equal(f.v.snapshot().version,5);assert.deepEqual(f.v.snapshot().population,{version:1,members:[]});assert.deepEqual(f.g.resources,before);assert.equal(f.g.units.length,count);
});
test('181 ground medics and ground enemies cannot act through a floor onto an assigned survivor',()=>{
 const f=setup('worker','rampart12');onDuty(f);const other=createUnit(f.g,'medic');other.x=f.u.x;other.y=f.u.y;assert.equal(f.g.workerCanWorkAt(other,f.u,100),false);
 f.g.spawnZombie('walker');const z=f.g.zombies.at(-1);z.x=f.u.x;z.y=f.u.y;assert.equal(f.g.hostileLineClear(z,f.u,false),false);
});
test('181 automatic courier crosses a paid bridge and resumes a saved trip without another debit',()=>{
 const f=pair(4,'lookout2a177',2),q=bridge(f);H.moveTo(f,f.a.x,f.a.y);const gun=equip(f.g,f.a,'handRifle177');H.moveTo(f,f.a.x,f.a.y);
 assert.ok(f.v.access(f.a.id,-1).ok);tick(f.g,15);f.g.player.x=f.g.core().x;f.g.player.y=f.g.core().y;
 let u=createUnit(f.g);const id=u.id,p=f.v.population;f.g.resources.ammo=100;const count=f.g.units.length;
 assert.ok(p.assign(id,f.a.id,0).ok);until(f.g,()=>p.pose(u).bridge!==null&&u.x>f.a.right+12&&u.x<f.b.left-12,200);
 const before={pose:p.pose(u),x:u.x,y:u.y,carry:u.carry,stock:f.g.resources.ammo};assert.ok(f.g.restoreSave(f.g.serialize()));u=f.g.units.find(u=>u.id===id);
 assert.deepEqual({pose:p.pose(u),x:u.x,y:u.y,carry:u.carry,stock:f.g.resources.ammo},before);assert.equal(f.g.units.length,count);
 until(f.g,()=>f.v.moduleRef(gun.id).m.ammo===10,80);assert.equal(f.g.resources.ammo,90);
});
test('181 soldier fires from actual altitude using only ten cartouches carried from the depot',()=>{
 const f=setup('soldier','rampart12');f.g.resources.ammo=100;onDuty(f);
 f.g.spawnZombie('runner');let z=f.g.zombies.at(-1);z.x=f.b.x+64;z.y=f.b.y;
 const d=f.g.serialize();d.expansions127.modules.vertical175.climbers.push({id:z.id,site:f.b.id,level:0,bridge:null,stair:null,side:0,lane:C.VerticalSiege176.margin,start:0,progress:1,stage:'roof',fallHeight:0});
 assert.ok(f.g.restoreSave(d));const u=f.g.units.find(x=>x.id===f.u.id);z=f.g.zombies.find(x=>x.id===z.id);const hp=z.health,ammo=u.carry;f.g.updateUnits(.1);
 assert.equal(u.carry,ammo-1);assert.equal(f.g.resources.ammo,90);assert.ok(z.health<hp);assert.ok(f.v.population.pose(u).z===12);
 f.g.paused=true;const cooldown=u.fireCooldown;run(f.g,2);assert.equal(u.carry,ammo-1);assert.equal(u.fireCooldown,cooldown);
});
test('181 an engineer repairs the existing module with physically carried scrap, without new items',()=>{
 const f=setup('engineer');Object.assign(f.g.player,f.v.entrance(f.b));ascend(f.g,f.b);const gun=equip(f.g,f.b,'handRifle177');const id=gun.id;f.v.damageModule(id,90);
 assert.ok(f.v.access(f.b.id,-1).ok);tick(f.g,8);f.g.player.x=f.g.core().x;f.g.player.y=f.g.core().y;f.g.resources.scrap=100;
 assert.ok(f.p.assign(f.u.id,f.b.id).ok);until(f.g,()=>gun.health===R.modules[gun.kind].health,200);
 assert.equal(f.g.resources.scrap,90);assert.ok(Math.abs(f.u.carry-7)<1e-7);assert.equal(f.v.moduleRef(id).m,gun);assert.equal(gun.ammo,0);
});
test('181 medic reaches the wounded native survivor and consumes medicine from its own bag',()=>{
 const f=setup('worker');onDuty(f);f.u.health-=12;const medic=createUnit(f.g,'medic');f.g.resources.medicine=10;
 assert.ok(f.p.assign(medic.id,f.b.id).ok);until(f.g,()=>f.u.health===f.u.maxHealth,240);
 assert.equal(f.g.resources.medicine,8);assert.ok(Math.abs(medic.carry-(2-12*C.NPC_RULES.medicinePerHealth))<1e-7);assert.equal(f.p.pose(medic).z,2);
});
test('181 full depot keeps recalled supplies on the living unit until room is available',()=>{
 const f=setup();f.g.resources.ammo=100;onDuty(f);f.g.resources.ammo=f.g.storage;f.p.recall(f.u.id);
 until(f.g,()=>f.p.pose(f.u).site===null,150);run(f.g,80);assert.ok(f.p.isAssigned(f.u.id));assert.equal(f.u.carry,10);assert.equal(f.g.resources.ammo,f.g.storage);
 f.g.resources.ammo-=10;until(f.g,()=>!f.p.isAssigned(f.u.id),5);assert.equal(f.g.resources.ammo,f.g.storage);assert.equal(f.u.carry,0);
});
test('181 empty depot does not fabricate an ammunition delivery',()=>{
 const f=setup();f.g.resources.ammo=0;const position={x:f.u.x,y:f.u.y};f.p.assign(f.u.id,f.b.id);run(f.g,3);
 assert.equal(f.u.carry,0);assert.equal(f.g.resources.ammo,0);assert.equal(f.p.pose(f.u).z,0);assert.match(f.p.presentation()[0].status,/Pénurie/);
});
test('181 demolition and new equipment placement refuse occupied personnel footprints before payment',()=>{
 const f=setup();onDuty(f);const d=f.g.serialize(),p=S.slots(f.b)[0];const u=d.units.find(u=>u.id===f.u.id);u.x=p.x*32;u.y=p.y*32;
 // Explicit static-placement fixture: the unit occupies a free slot before a new module exists.
 assert.ok(f.g.restoreSave(d));Object.assign(f.g.player,f.v.entrance(f.b));ascend(f.g,f.g.world.buildings.get(f.b.id));f.g.player.x=f.b.x;f.g.player.y=f.b.y;
 const stock={...f.g.resources};const quote=f.v.moduleQuote('handRifle177',0);assert.equal(quote.ok,false);assert.match(quote.reason,/personnel/);assert.deepEqual(f.g.resources,stock);
 assert.equal(f.g.structureActionStatus('demolish',f.g.world.buildings.get(f.b.id)).ok,false);
});
test('181 bridge rupture removes no duplicate unit or hidden ammunition and applies a real fall',()=>{
 const f=pair(4,'lookout2a177',2),q=bridge(f);H.moveTo(f,f.a.x,f.a.y);assert.ok(f.v.access(f.a.id,-1).ok);tick(f.g,8);f.g.player.x=f.g.core().x;f.g.player.y=f.g.core().y;
 const u=createUnit(f.g),p=f.v.population,id=u.id;f.g.resources.ammo=100;p.assign(id,f.a.id);
 until(f.g,()=>p.pose(u).bridge!==null&&u.x>f.a.right+12&&u.x<f.b.left-12,200);const hp=u.health;assert.ok(f.n.damage(1,1e6));
 assert.equal(p.pose(u).z,0);assert.ok(u.health<hp);assert.equal(u.id,id);assert.equal(u.carry,10);assert.equal(f.g.resources.ammo,90);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('181 native hostile on the palier attacks the real allied unit, not a proxy',()=>{
 const f=setup('worker','rampart12');onDuty(f);f.g.spawnZombie('runner');const z=f.g.zombies.at(-1);z.x=f.u.x+22;z.y=f.u.y;
 const d=f.g.serialize();d.expansions127.modules.vertical175.climbers.push({id:z.id,site:f.b.id,level:0,bridge:null,stair:null,side:0,lane:C.VerticalSiege176.margin,start:0,progress:1,stage:'roof',fallHeight:0});assert.ok(f.g.restoreSave(d));
 const u=f.g.units.find(u=>u.id===f.u.id),hp=u.health;f.g.updateZombies(.1);assert.ok(u.health<hp);assert.equal(f.g.units.filter(x=>x.id===u.id).length,1);
});
test('181 global recall cancels duty but retains cargo until a physical return',()=>{
 const f=setup();f.g.resources.ammo=100;onDuty(f);f.g.workerOrder='retreat';f.g.updateUnits(.1);assert.equal(f.p.presentation()[0].recalled,true);assert.equal(f.u.carry,10);
 until(f.g,()=>!f.p.isAssigned(f.u.id),200);assert.equal(f.g.resources.ammo,100);
});
test('181 malformed carried resource and staircase position reject transactionally',()=>{
 const f=setup('worker','rampart12');f.p.assign(f.u.id,f.b.id);until(f.g,()=>f.p.pose(f.u).travel&&f.p.pose(f.u).z>1,200);const good=clone(f.g.serialize()),before=snapshot(f.g);
 for(const mutate of [d=>d.units.find(u=>u.id===f.u.id).carryType='stone',d=>d.units.find(u=>u.id===f.u.id).carry=11,d=>d.units.find(u=>u.id===f.u.id).x+=32,d=>d.expansions127.modules.vertical175.population.members[0].travel.to=5]){
  const bad=clone(good);mutate(bad);assert.throws(()=>f.g.restoreSave(bad),/Personnel vertical/);assert.deepEqual(snapshot(f.g),before);
 }
});
test('181 a destroyed native support applies fall damage from its former altitude',()=>{
 const f=setup('worker','rampart12');onDuty(f);const hp=f.u.health,carry=f.u.carry;f.b.health=0;f.g.destroyBuilding(f.b);
 assert.equal(f.p.pose(f.u).z,0);assert.ok(f.u.health<hp);assert.equal(f.u.carry,carry);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('181 age capacity rejects excess dispatch without recruiting anyone or spending supplies',()=>{
 const f=setup('worker','lookout2a177',0),other=createUnit(f.g);assert.ok(f.p.assign(f.u.id,f.b.id).ok);const before=snapshot(f.g);
 assert.equal(f.p.assign(other.id,f.b.id).ok,false);assert.deepEqual(snapshot(f.g),before);assert.equal(P.slots.length,11);
});
test('181 a courier with harvested cargo cannot silently convert it to ammunition',()=>{
 const f=setup();f.u.carry=3;f.u.carryType='wood';const before=snapshot(f.g);assert.equal(f.p.assign(f.u.id,f.b.id).ok,false);assert.deepEqual(snapshot(f.g),before);
});
test('181 floor arrival coordinates survive native ground-restoration collision repair exactly',()=>{
 const f=setup();onDuty(f);const d=f.g.serialize(),u=d.units.find(u=>u.id===f.u.id),slot=S.slots(f.b)[0];u.x=slot.x*32;u.y=slot.y*32;
 assert.ok(f.g.restoreSave(d));const actual=f.g.units.find(x=>x.id===u.id);assert.equal(actual.x,u.x);assert.equal(actual.y,u.y);assert.ok(f.g.friendlyPositionClear(actual,actual.x,actual.y));assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('181 two existing workers queue through a shaft instead of overlapping the same transit',()=>{
 const f=setup('worker','timberDeck3a177',1),other=createUnit(f.g);f.g.resources.ammo=100;assert.ok(f.p.assign(f.u.id,f.b.id).ok);assert.ok(f.p.assign(other.id,f.b.id).ok);
 let simultaneous=false;for(let n=0;n<2000;n++){f.g.updateUnits(.1);f.v.step(.1);f.g.elapsed+=.1;const members=f.p.presentation();if(members.filter(m=>m.travel).length>1)simultaneous=true;if(members.length===2&&members.every(m=>m.mode==='duty'))break;}
 assert.equal(simultaneous,false);assert.ok(f.p.presentation().every(m=>m.mode==='duty'));assert.equal(f.g.resources.ammo,80);assert.equal(f.u.carry+other.carry,20);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('181 full native update preserves supported personnel instead of applying ground AI',()=>{
 const f=setup('worker','rampart12');onDuty(f);const site=f.p.pose(f.u).site;for(let i=0;i<5;i++)f.g.update(.05);
 assert.equal(f.p.pose(f.u).site,site);assert.equal(f.p.pose(f.u).z,12);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('181 an occupied gate roof does not incorrectly block closing the passage below',()=>{
 const f=setup('worker','citadelGate12');onDuty(f);assert.equal(f.v.aboveGate(f.u,f.b),true);
});
test('181 personnel with a different mission cannot be restored into two simultaneous owners',()=>{
 const f=setup();onDuty(f);const good=f.g.serialize(),bad=clone(good),before=snapshot(f.g);bad.territories.withdrawing.push(f.u.id);
 assert.throws(()=>f.g.restoreSave(bad));assert.deepEqual(snapshot(f.g),before);
});
test('181 allied pose lookup does not shadow the altitude of native rooftop enemies',()=>{
 const f=setup('worker','rampart12');Object.assign(f.g.player,f.v.entrance(f.b));ascend(f.g,f.b);f.g.spawnZombie('runner');let z=f.g.zombies.at(-1);z.x=f.g.player.x+22;z.y=f.g.player.y;
 const d=f.g.serialize();d.expansions127.modules.vertical175.climbers.push({id:z.id,site:f.b.id,level:0,bridge:null,stair:null,side:0,lane:C.VerticalSiege176.margin,start:0,progress:1,stage:'roof',fallHeight:0});assert.ok(f.g.restoreSave(d));z=f.g.zombies.find(e=>e.id===z.id);
 assert.equal(f.v.enemyPose(z).z,12);assert.equal(f.g.hostileLineClear(z,f.g.player,false),true);
});
