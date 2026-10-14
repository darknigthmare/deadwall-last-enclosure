'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {C,S,R,clone,tick,boot,build,ascend,equip,approach,lowStock,snapshot}=require('./helpers/vertical177.cjs');
const E=C.VerticalMaintenance178;
const centre=(g,b)=>{g.player.x=b.x;g.player.y=b.y;};
function addFloor(g,b){centre(g,b);assert.ok(g.vertical175.buildDeck().ok);tick(g,R.deck.seconds+.2);}
function confirm(g,method,id){assert.equal(g.vertical175[method](id,true).confirmation,true);const q=g.vertical175[method](id,true);assert.ok(q.ok,q.reason);}

for(const tier of C.CITY_TIERS)test('178 reconfiguration works with native content at age '+tier.id+' '+tier.name,()=>{
 const g=boot(tier.id),defs=Object.values(R.bases).filter(d=>d.unlockTier===tier.id).sort((a,b)=>b.size[0]*b.size[1]-a.size[0]*a.size[1]);
 const d=defs[0],kind=Object.keys(R.modules).find(k=>{const m=R.modules[k];return m.tier===tier.id&&m.mass<d.capacity&&m.size[0]<=d.size[0]*.46&&m.size[1]<=d.size[1]*.46;}),b=build(g,d.id);
 assert.ok(kind,'A physically fitting new module must exist at each age');const m=equip(g,b,kind);for(const k of C.RESOURCE_KEYS)g.resources[k]=100;m.health-=1;if(R.modules[kind].range)m.ammo=3;
 const before=clone(m),q=g.vertical175.engineeringQuote178('relocate',m.id,1),stock=clone(g.resources),capacity=g.storage,housing=g.housing;
 assert.ok(q.ok,q.reason);assert.ok(g.vertical175.relocateModule(m.id,1).ok);tick(g,q.seconds+.2);
 assert.equal(m.slot,1);assert.equal(m.id,before.id);assert.equal(m.ammo,before.ammo);assert.equal(m.health,before.health);assert.equal(g.storage,capacity);assert.equal(g.housing,housing);
 for(const [k,n]of Object.entries(q.cost))assert.equal(g.resources[k],stock[k]-n);
 assert.ok(g.restoreSave(g.serialize()));assert.equal(g.vertical175.moduleRef(m.id).m.slot,1);
});

test('178 relocation is final-paid, paused with the game and preserves finite weapon state',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');lowStock(g);m.ammo=9;m.health-=40;m.yaw=.25;m.pitch=-.1;
 const before=clone(m),stock=clone(g.resources),q=g.vertical175.engineeringQuote178('relocate',m.id,1);assert.ok(g.vertical175.relocateModule(m.id,1).ok);tick(g,2);assert.equal(m.slot,0);assert.deepEqual(g.resources,stock);
 g.paused=true;tick(g,30);assert.equal(m.slot,0);assert.deepEqual(g.resources,stock);g.paused=false;tick(g,q.seconds);
 assert.equal(m.slot,1);for(const key of ['id','kind','health','ammo','yaw','pitch'])assert.equal(m[key],before[key]);assert.equal(g.vertical175.busy(),false);
});

test('178 occupied slot, invalid slot, same slot and insufficient supplies refuse before payment',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');equip(g,b,'fieldCache177',1);approach(g,b,m);lowStock(g);const stock=clone(g.resources);
 for(const slot of [0,1,-1,4,NaN,'2'])assert.equal(g.vertical175.relocateModule(m.id,slot).ok,false);
 assert.deepEqual(g.resources,stock);g.resources.wood=0;g.resources.scrap=0;assert.equal(g.vertical175.relocateModule(m.id,2).ok,false);assert.equal(m.slot,0);
});

test('178 player destination overlap is rejected before native construction charges',()=>{
 const g=boot(0),b=build(g,'lookout2a177');ascend(g,b);const p=S.slots(b)[0];g.player.x=p.x*R.tile+5;g.player.y=p.y*R.tile+5;const stock=clone(g.resources);
 assert.equal(g.vertical175.buildModule('handRifle177',0).ok,false);assert.deepEqual(g.resources,stock);assert.equal(g.vertical175.presentation().sites[0].decks[0].modules.length,0);
});

test('178 movement, injury or target damage cancels relocation without payment or a duplicate',()=>{
 for(const disturb of [(g,b,m)=>{g.player.x+=30;},g=>{g.player.health--;},(g,b,m)=>{m.health--;},(g,b)=>{b.health--;}]){
  const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');lowStock(g);const stock=clone(g.resources);
  assert.ok(g.vertical175.relocateModule(m.id,1).ok);tick(g,2);disturb(g,b,m);tick(g,12);assert.equal(m.slot,0);assert.equal(g.vertical175.busy(),false);assert.deepEqual(g.resources,stock);assert.equal(g.vertical175.presentation().sites[0].decks[0].modules.length,1);
 }
});

test('178 save mid relocation keeps original slot and does not restart or pay for unfinished work',()=>{
 const g=boot(0),b=build(g,'lookout2a177'),m=equip(g,b,'handRifle177');lowStock(g);const stock=clone(g.resources);assert.ok(g.vertical175.relocateModule(m.id,1).ok);tick(g,2);const d=g.serialize();assert.ok(g.restoreSave(d));tick(g,30);assert.equal(g.vertical175.moduleRef(m.id).m.slot,0);assert.deepEqual(g.resources,stock);assert.equal(g.vertical175.busy(),false);
});

test('178 moving a producing workshop suspends its output without dropping storage or housing',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'greenhouse');lowStock(g);assert.equal(g.vertical175.productionPlans(b).length,1);
 assert.ok(g.vertical175.relocateModule(m.id,1).ok);assert.equal(g.vertical175.productionPlans(b).length,0);g.vertical175.stop();assert.equal(g.vertical175.productionPlans(b).length,1);
});

test('178 an automated weapon does not fire while being relocated',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'sentry');m.ammo=20;
 const from=g.vertical175.muzzle(g.vertical175.moduleRef(m.id));g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=from.x*32;z.y=(from.y-25)*32;g.rebuildBuckets();g.daylight=()=>1;
 assert.ok(g.vertical175.relocateModule(m.id,1).ok);tick(g,4);assert.equal(m.ammo,20);assert.equal(m.slot,0);
});

test('178 empty top floor is dismantled from below after exact confirmation, once only',()=>{
 const g=boot(),b=build(g);ascend(g,b);addFloor(g,b);lowStock(g);const q=g.vertical175.engineeringQuote178('removeDeck',b.id),stock=clone(g.resources);
 assert.ok(q.ok,q.reason);confirm(g,'dismantleTopDeck',b.id);tick(g,3);assert.equal(g.vertical175.presentation().sites[0].decks.length,2);assert.deepEqual(g.resources,stock);tick(g,E.deckDismantleSeconds);
 assert.equal(g.vertical175.presentation().sites[0].decks.length,1);assert.equal(g.vertical175.pose().z,6);for(const [k,n]of Object.entries(q.refund))assert.equal(g.resources[k],stock[k]+n);
 const paid=clone(g.resources);assert.equal(g.vertical175.dismantleTopDeck(b.id,true).ok,false);assert.deepEqual(g.resources,paid);assert.ok(g.restoreSave(g.serialize()));
});

test('178 occupied top floor and actor standing on it prevent dismantling',()=>{
 const g=boot(),b=build(g);ascend(g,b);addFloor(g,b);ascend(g,b,1);const stock=clone(g.resources);
 assert.equal(g.vertical175.dismantleTopDeck(b.id).ok,false);equip(g,b,'quarters');centre(g,b);ascend(g,b,0);assert.equal(g.vertical175.dismantleTopDeck(b.id).ok,false);assert.equal(g.vertical175.presentation().sites[0].decks.length,2);assert.ok(g.resources.wood<stock.wood);
});

test('178 intermediate floors and structural base cannot be removed as an empty top floor',()=>{
 const g=boot(),b=build(g);ascend(g,b);assert.equal(g.vertical175.dismantleTopDeck(b.id).ok,false);addFloor(g,b);ascend(g,b,1);addFloor(g,b);ascend(g,b,0);assert.equal(g.vertical175.dismantleTopDeck(b.id).ok,false);
});

test('178 interrupted floor project can be removed; refund follows built progress, never full construction cost',()=>{
 const g=boot(),b=build(g);ascend(g,b);assert.ok(g.vertical175.buildDeck().ok);tick(g,10);g.vertical175.stop();lowStock(g);
 const q=g.vertical175.engineeringQuote178('removeDeck',b.id);assert.ok(q.ok);assert.ok(q.refund.stone<R.deck.cost.stone*A_SALVAGE());confirm(g,'dismantleTopDeck',b.id);tick(g,E.deckDismantleSeconds+.2);assert.equal(g.vertical175.presentation().sites[0].decks.length,1);assert.ok(g.restoreSave(g.serialize()));
});
function A_SALVAGE(){return C.VerticalAges177.salvageFraction;}

test('178 lift removal preserves stairs, floors and power accounting, also during blackout',()=>{
 const g=boot(),b=build(g);ascend(g,b);assert.ok(g.vertical175.buildLift().ok);tick(g,R.lift.seconds+.2);const beforePower=b.def.powerUse;b.gridOffline=true;b.powered=false;lowStock(g);
 confirm(g,'dismantleLift',b.id);tick(g,E.liftDismantleSeconds+.2);assert.equal(g.vertical175.presentation().sites[0].lift,0);assert.equal(b.def.powerUse,beforePower-R.liftPower);assert.ok(g.vertical175.accessQuote(b.id,-1,'stairs').ok);assert.equal(g.vertical175.accessQuote(b.id,-1,'lift').ok,false);assert.ok(g.restoreSave(g.serialize()));
});

test('178 construction ceiling remains enforced when a slab is rebuilt after dismantling',()=>{
 const g=boot(4),b=build(g);ascend(g,b);addFloor(g,b);confirm(g,'dismantleTopDeck',b.id);tick(g,21);addFloor(g,b);ascend(g,b,1);addFloor(g,b);ascend(g,b,2);assert.equal(g.vertical175.pose().z,18);assert.equal(g.vertical175.buildDeck().ok,false);
});

test('178 repair upper slab is useful, timed, bounded and final-paid',()=>{
 const g=boot(),b=build(g);ascend(g,b);assert.equal(g.vertical175.repairDeck(b.id).ok,false);addFloor(g,b);ascend(g,b,1);const d=g.vertical175.presentation().sites[0].decks[1];d.health-=200;lowStock(g);const q=g.vertical175.engineeringQuote178('repairDeck',b.id),stock=clone(g.resources);
 assert.ok(g.vertical175.repairDeck(b.id).ok);tick(g,4);assert.equal(d.health,R.deck.health-200);assert.deepEqual(g.resources,stock);tick(g,E.deckRepairSeconds);assert.equal(d.health,R.deck.health);for(const [k,n]of Object.entries(q.cost))assert.equal(g.resources[k],stock[k]-n);assert.equal(g.vertical175.repairDeck(b.id).ok,false);assert.ok(g.restoreSave(g.serialize()));
});

test('178 unfinished equipment is removed only after confirmation and returns no invented rounds',()=>{
 const g=boot(0),b=build(g,'lookout2a177');ascend(g,b);assert.ok(g.vertical175.buildModule('handRifle177',0).ok);tick(g,5);g.vertical175.stop();const m=g.vertical175.presentation().sites[0].decks[0].modules[0];approach(g,b,m);lowStock(g);const q=g.vertical175.engineeringQuote178('cancelModule',m.id),stock=clone(g.resources);
 assert.ok(q.ok);confirm(g,'cancelModuleProject',m.id);tick(g,E.cancelSeconds+.2);assert.equal(g.vertical175.moduleRef(m.id),null);assert.equal(g.resources.ammo,stock.ammo);for(const [k,n]of Object.entries(q.refund))assert.equal(g.resources[k],stock[k]+n);assert.ok(g.restoreSave(g.serialize()));
});

test('178 stale confirmation, changed resources and destruction cannot remove or refund twice',()=>{
 const g=boot(),b=build(g);ascend(g,b);addFloor(g,b);lowStock(g);
 assert.equal(g.vertical175.dismantleTopDeck(b.id).confirmation,true);g.resources.wood++;assert.equal(g.vertical175.dismantleTopDeck(b.id,true).confirmation,true);assert.equal(g.vertical175.busy(),false);
 assert.ok(g.vertical175.dismantleTopDeck(b.id,true).ok);const stock=clone(g.resources);g.destroyBuilding(b);tick(g,30);assert.deepEqual(g.resources,stock);assert.equal(g.vertical175.busy(),false);
});

test('178 saturated deposit never overflows when unused vertical works are salvaged',()=>{
 const g=boot(),b=build(g);ascend(g,b);addFloor(g,b);for(const k of C.RESOURCE_KEYS)g.resources[k]=g.storage;const stock=clone(g.resources);confirm(g,'dismantleTopDeck',b.id);tick(g,21);assert.deepEqual(g.resources,stock);
});

test('178 views and service lists are read-only, and maintenance UI exposes all reconfiguration controls',()=>{
 const g=boot(),b=build(g);ascend(g,b);addFloor(g,b);assert.ok(g.vertical175.buildLift().ok);tick(g,26);const m=equip(g,b,'handRifle177');g.vertical175.actions().find(a=>a.id==='group-service').run();const before=snapshot(g),ids=g.vertical175.actions().map(a=>a.id);
 assert.ok(ids.includes('remove-top-deck'));assert.ok(ids.includes('remove-lift'));assert.ok(ids.includes('move-'+m.id+'-1'));g.vertical175.overview();g.vertical175.catalogue(10);assert.deepEqual(snapshot(g),before);
});

test('178 completed deck refunds exactly 63 stone and 31 scrap, without floating-point loss',()=>{
 const g=boot(4),b=build(g);ascend(g,b);addFloor(g,b);lowStock(g);
 const q=g.vertical175.engineeringQuote178('removeDeck',b.id);assert.equal(q.ok,true);assert.deepEqual(q.refund,{stone:63,scrap:31});
 confirm(g,'dismantleTopDeck',b.id);tick(g,21);assert.equal(g.resources.stone,83);assert.equal(g.resources.scrap,51);
});
