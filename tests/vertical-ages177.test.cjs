'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {C,S,R,clone,tick,boot,build,ascend,equip,approach,lowStock,snapshot}=require('./helpers/vertical177.cjs');

test('177 eleven ages contain paid supports and equipment, with bounded progression and no free arsenal',()=>{
 assert.equal(C.CITY_TIERS.length,11);assert.equal(Object.keys(R.bases).length,39);assert.equal(Object.keys(R.modules).length,31);
 for(const t of C.CITY_TIERS){assert.ok(Object.values(R.bases).some(d=>d.unlockTier===t.id));assert.ok(Object.values(R.modules).some(d=>d.tier===t.id));}
 for(const d of [...Object.values(R.bases),...Object.values(R.modules)]){assert.ok(Object.values(d.cost).every(n=>Number.isFinite(n)&&n>0));assert.ok(d.health>0);}
 assert.ok(Object.isFrozen(C.VerticalAges177.ages));assert.equal(R.maxHeight,72);
});
for(const t of C.CITY_TIERS)test('177 native placement, use and round trip at age '+t.id+' '+t.name,()=>{
 const g=boot(t.id),defs=Object.values(R.bases).filter(d=>d.unlockTier===t.id),d=defs.find(d=>d.age177)||defs[0],before=clone(g.resources),b=build(g,d.id);
 for(const [key,cost]of Object.entries(d.cost))assert.equal(g.resources[key],before[key]-cost);
 ascend(g,b);assert.equal(g.vertical175.pose().z,d.height);const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.equal(g.vertical175.pose().z,d.height);
 if(t.id<10){const late=Object.values(R.bases).find(d=>d.unlockTier===t.id+1),stock=clone(g.resources);assert.equal(g.placeOne(late.id,38,38),false);assert.deepEqual(g.resources,stock);}
});
test('177 catalogue reads and browsing all ages never mutate the campaign or unlock content',()=>{
 const g=boot(0),before=snapshot(g);
 for(let age=0;age<=10;age++){const c=g.vertical175.catalogue(age);assert.equal(c.age,age);assert.ok(c.modules.length&&c.supports.length);c.modules[0].cost.wood=999;}
 for(let i=0;i<10;i++){const a=g.vertical175.actions().find(a=>a.id==='catalogue-1');assert.ok(a);a.run();g.vertical175.overview();}
 assert.equal(g.vertical175.catalogue(-1),null);assert.equal(g.vertical175.catalogue(NaN),null);assert.equal(g.tier.id,0);assert.deepEqual(snapshot(g),before);
});
test('177 light platforms never gain upper decks or lifts, even at the final age',()=>{
 const g=boot(),b=build(g,'lookout2a177');ascend(g,b);const before=clone(g.resources);
 assert.equal(g.vertical175.buildDeck().ok,false);assert.equal(g.vertical175.buildLift().ok,false);assert.deepEqual(g.resources,before);
 const good=g.serialize();for(const corrupt of [d=>d.expansions127.modules.vertical175.sites[0].decks.push({progress:1,health:R.deck.health,modules:[]}),d=>d.expansions127.modules.vertical175.sites[0].lift=1]){const d=clone(good);corrupt(d);assert.throws(()=>g.restoreSave(d),/verticale/);}
});
test('177 lifts have age gates; stairs remain physically available before electricity',()=>{
 const g=boot(2),b=build(g,'workDeck6a177');ascend(g,b);const stock=clone(g.resources);assert.equal(g.vertical175.buildLift().ok,false);assert.deepEqual(g.resources,stock);assert.equal(g.vertical175.accessQuote(b.id,-1).ok,true);
});
test('177 new deck financing stops at the current age ceiling before charging',()=>{
 const g=boot(4),b=build(g);ascend(g,b);
 for(const level of [1,2]){g.player.x=b.x;g.player.y=b.y;assert.equal(g.vertical175.buildDeck().ok,true);tick(g,36);ascend(g,b,level);}
 const stock=clone(g.resources);assert.equal(g.vertical175.pose().z,18);assert.equal(g.vertical175.buildDeck().ok,false);assert.deepEqual(g.resources,stock);
});
test('177 previously constructed high decks remain valid even below new construction ceilings',()=>{
 const g=boot(),b=build(g);ascend(g,b);
 for(let level=1;level<=3;level++){assert.ok(g.vertical175.buildDeck().ok);tick(g,36);ascend(g,b,level);}
 const d=g.serialize();d.urban.progression151.age=4;assert.equal(g.restoreSave(d),true);assert.equal(g.vertical175.pose().z,24);assert.equal(g.vertical175.accessQuote(b.id,2).ok,true);
});
test('177 manual weapon never auto-fires and can be possessed in an electrical blackout',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');g.player.carry.ammo=7;assert.ok(g.vertical175.reload(m.id).ok);tick(g,5);
 g.spawnZombie('walker');const z=g.zombies.at(-1),from=g.vertical175.muzzle(g.vertical175.moduleRef(m.id));z.x=from.x*32;z.y=(from.y-25)*32;g.rebuildBuckets();tick(g,3);assert.equal(m.ammo,7);
 b.gridOffline=true;b.powered=false;assert.ok(g.vertical175.possess(m.id).ok);const a=S.lookAt(from,g.vertical175.aimPoint(z));g.vertical175.aim(a.yaw,a.pitch);const hp=z.health;
 assert.equal(g.vertical175.fire(),true);assert.equal(m.ammo,6);assert.equal(z.health,hp-R.modules.handRifle177.damage);
});
test('177 unpowered electric guns can be supplied but not controlled or fired',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'sentry');b.powered=false;g.player.carry.ammo=8;assert.ok(g.vertical175.reload(m.id).ok);tick(g,5);assert.equal(m.ammo,8);assert.equal(g.vertical175.possess(m.id).ok,false);assert.equal(g.vertical175.fire(),false);
});
test('177 repair is timed, final-paid, pause-safe and cannot be repeated for a gain',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');lowStock(g);m.health-=120;
 const hp=m.health,q=g.vertical175.maintenanceQuote(m.id,'repair'),stock=clone(g.resources);assert.ok(q.ok);assert.ok(g.vertical175.repairModule(m.id).ok);tick(g,3);assert.deepEqual(g.resources,stock);assert.equal(m.health,hp);
 g.paused=true;tick(g,20);assert.equal(m.health,hp);g.paused=false;tick(g,6);assert.equal(m.health,R.modules.handRifle177.health);
 for(const [k,n]of Object.entries(q.cost))assert.equal(g.resources[k],stock[k]-n);
 assert.equal(g.vertical175.repairModule(m.id).ok,false);const saved=g.serialize();assert.ok(g.restoreSave(saved));assert.equal(g.vertical175.moduleRef(m.id).m.health,R.modules.handRifle177.health);
});
test('177 injury to worker or repair target cancels without payment, save does not finish work',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');lowStock(g);m.health-=100;const stock=clone(g.resources);assert.ok(g.vertical175.repairModule(m.id).ok);tick(g,2);m.health--;tick(g,.2);assert.equal(g.vertical175.busy(),false);assert.deepEqual(g.resources,stock);
 assert.ok(g.vertical175.repairModule(m.id).ok);tick(g,1);const d=g.serialize();assert.ok(g.restoreSave(d));tick(g,20);assert.equal(g.vertical175.moduleRef(m.id).m.health,m.health);assert.deepEqual(g.resources,stock);
});
test('177 dismantling requires an exact preview, frees the slot and returns only real stored rounds',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');lowStock(g);m.ammo=9;const before=clone(g.resources);
 const preview=g.vertical175.dismantleModule(m.id,true);assert.equal(preview.confirmation,true);assert.equal(g.vertical175.busy(),false);const q=g.vertical175.maintenanceQuote(m.id,'dismantle');
 assert.equal(g.vertical175.dismantleModule(m.id,true).ok,true);tick(g,11);assert.equal(g.vertical175.moduleRef(m.id),null);assert.equal(g.resources.ammo,before.ammo+9);
 for(const [k,n]of Object.entries(q.refund))assert.equal(g.resources[k],before[k]+n);assert.equal(g.vertical175.dismantleModule(m.id,true).ok,false);assert.ok(g.restoreSave(g.serialize()));
});
test('177 changed stock invalidates demolition confirmation; destruction cannot pay twice',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'fieldCache177');lowStock(g);assert.equal(g.vertical175.dismantleModule(m.id).confirmation,true);g.resources.wood++;
 assert.equal(g.vertical175.dismantleModule(m.id,true).confirmation,true);assert.equal(g.vertical175.busy(),false);assert.ok(g.vertical175.dismantleModule(m.id,true).ok);const stock=clone(g.resources);g.vertical175.damageModule(m.id,9999);tick(g,20);assert.deepEqual(g.resources,stock);
});
test('177 storage removal refuses any existing overflow instead of silently deleting reserves',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'fieldCache177');lowStock(g);g.resources.wood=g.storage;const before=snapshot(g);assert.equal(g.vertical175.dismantleModule(m.id).ok,false);assert.match(g.vertical175.maintenanceQuote(m.id,'dismantle').reason,/stocks/);assert.deepEqual(snapshot(g),before);
});
test('177 physical medical post costs carried medicine once and requires useful healing',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'aidPost177');g.player.health=40;g.player.carry.medicine=2;const dep=g.resources.medicine;
 assert.ok(g.vertical175.useMedical(m.id).ok);tick(g,6);assert.equal(g.player.health,56);assert.equal(g.player.carry.medicine,1);assert.equal(g.resources.medicine,dep);
 g.player.health=100;assert.equal(g.vertical175.useMedical(m.id).ok,false);assert.equal(g.player.carry.medicine,1);
});
test('177 medical interruption and power loss consume no medicine or free health',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'aidPost177');g.player.health=40;g.player.carry.medicine=2;assert.ok(g.vertical175.useMedical(m.id).ok);tick(g,2);b.powered=false;tick(g,6);assert.equal(g.player.health,40);assert.equal(g.player.carry.medicine,2);assert.equal(g.vertical175.busy(),false);
});
test('177 saturation of one workshop does not stop a different workshop on the same support',()=>{
 const g=boot(),b=build(g);equip(g,b,'greenhouse',0);equip(g,b,'ammunition',1);lowStock(g);g.resources.food=g.storage;b.powered=true;b.powerShare=1;b.gridOffline=false;
 const ammo=g.resources.ammo;g.economyTick(1);assert.ok(Math.abs(g.resources.ammo-ammo-.55)<1e-6);assert.ok(g.resources.food<=g.storage);assert.equal(g.vertical175.productionPlans(b).length,2);
});
test('177 completed modules contribute capacities and production to native age requirements',()=>{
 const g=boot(),b=build(g),before=g.urban.facts();equip(g,b,'quarters',0);const after=g.urban.facts();assert.equal(after.housing,before.housing+12);
 equip(g,b,'storage',1);assert.equal(g.urban.facts().storage,before.storage+600);const m=g.vertical175.presentation().sites[0].decks[0].modules.find(m=>m.kind==='storage');g.vertical175.damageModule(m.id,9999);assert.equal(g.urban.facts().storage,before.storage);
});
test('177 oversized equipment is rejected before payment on narrow supports',()=>{
 const g=boot(),b=build(g,'lookout2a177');ascend(g,b);const stock=clone(g.resources);assert.equal(g.vertical175.buildModule('megaQuarters177',0).ok,false);assert.deepEqual(g.resources,stock);
});
test('177 every new module is accepted by strict snapshots without resetting finite stocks',()=>{
 const g=boot(),b=build(g,'megaDeck36a177');ascend(g,b);
 for(const [kind,d]of Object.entries(R.modules).filter(([,d])=>d.age177)){
  const save=g.serialize(),v=save.expansions127.modules.vertical175;v.nextId=2;v.sites[0].decks[0].modules=[{id:1,kind,slot:0,progress:1,health:d.health,ammo:d.capacity?Math.min(3,d.capacity):0,yaw:0,pitch:0,heat:0,cooldown:0,overheated:false}];
  save.player.x=b.x;save.player.y=b.y;assert.ok(g.restoreSave(save),kind);assert.equal(g.vertical175.moduleRef(1).m.ammo,d.capacity?Math.min(3,d.capacity):0);
 }
});

test('177 final-age deep foundation reaches 72 m while historical foundation limits are preserved',()=>{
 const g=boot(),b=build(g,'megaDeck36a177');ascend(g,b);g.resources.stone=3000;g.resources.scrap=3000;
 for(let i=1;i<=6;i++){assert.ok(g.vertical175.buildDeck().ok);tick(g,36);ascend(g,b,i);}
 assert.equal(g.vertical175.pose().z,72);assert.equal(g.vertical175.buildDeck().ok,false);assert.equal(R.bases.verticalFoundation6.maxDecks,6);assert.ok(g.restoreSave(g.serialize()));assert.equal(g.vertical175.pose().z,72);
});

test('177 impossible saved equipment footprint is refused transactionally',()=>{
 const g=boot(),b=build(g,'citadelGate12');ascend(g,b);const valid=g.serialize(),before=snapshot(g),bad=clone(valid),v=bad.expansions127.modules.vertical175;
 v.nextId=2;v.sites[0].decks[0].modules=[{id:1,kind:'megaQuarters177',slot:0,progress:1,health:R.modules.megaQuarters177.health,ammo:0,yaw:0,pitch:0,heat:0,cooldown:0,overheated:false}];
 assert.throws(()=>g.restoreSave(bad),/hors support/);assert.deepEqual(snapshot(g),before);assert.ok(g.restoreSave(valid));
});
