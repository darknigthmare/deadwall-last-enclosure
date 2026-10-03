'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
const copy=value=>JSON.parse(JSON.stringify(value));
function start(){g.startNew('standard','903146');g.campaignIntro132.skip();g.phaseTime=999;standAt(g,g.player,g.core());return g;}
function take(cost){standAt(g,g.player,g.core());for(const[k,n]of Object.entries(cost)){const q=g.loadout.transfer('depot','sac',k,n);assert.equal(q.ok,true,q.reason);assert.equal(q.amount,n);} }
function step(pack,seconds){for(let left=seconds;left>1e-7;left-=.04)pack.step(Math.min(.04,left));}
function tick(seconds){for(let left=seconds;left>1e-7;left-=.04){g.update(Math.min(.04,left));g.input.pressed.clear();}}
function camp(){take(C.SurvivalPackRules.camp.cost);const core=g.core();let found=false;
 for(let r=70;r<=120&&!found;r+=10)for(let a=0;a<Math.PI*2&&!found;a+=Math.PI/8){const p={x:core.x+Math.cos(a)*r,y:core.y+Math.sin(a)*r};if(!g.friendlyPositionClear(g.player,p.x,p.y)||!g.workerCanWorkAt({...g.player,...p},core,125))continue;Object.assign(g.player,p);g.player.facing=a;found=g.survivalPack.preview('camp').ok;}
 assert.equal(found,true,'A physically clear camp has a real nearby depot approach');assert.equal(g.survivalPack.begin('camp').ok,true);step(g.survivalPack,C.SurvivalPackRules.camp.seconds);return g.survivalPack.snapshot().camps[0];
}
function nearCamp(c){Object.assign(g.player,{x:c.x-Math.cos(g.player.facing)*C.SurvivalPackRules.placeDistance*32,y:c.y-Math.sin(g.player.facing)*C.SurvivalPackRules.placeDistance*32});assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);}
function cover(c){take(C.SurvivalPackRules.cover.cost);nearCamp(c);assert.equal(g.survivalPack.begin('cover').ok,true);step(g.survivalPack,C.SurvivalPackRules.cover.seconds);}
function click(pack,action){assert.equal(g.expansionUI.open(pack),true);const button=doc.getElementById('expansionAction-'+pack+'-'+action);assert.equal(button.disabled,false,button.title);button.click();assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);return button;}
function node(){const n=g.world.nodes.find(n=>!n.depleted&&n.amount>60&&n.type==='wood');assert.ok(n);standAt(g,g.player,n);return n;}
function surveyed(){take(C.ExplorePackRules.surveyCost);const n=node();assert.equal(g.explorationPack.survey(n.id).ok,true);step(g.explorationPack,C.ExplorePackRules.surveySeconds);return n;}
function compact(){const n=surveyed();take(C.ExplorePackRules.compactExtract.cost);standAt(g,g.player,n);const before=n.amount;assert.equal(g.explorationPack.extractCompact(n.id).ok,true);step(g.explorationPack,C.ExplorePackRules.compactExtract.seconds);assert.equal(before-n.amount,C.ExplorePackRules.compactExtract.amount);return n;}
function cache(){take(C.ExplorePackRules.cacheCost);assert.equal(g.explorationPack.placeCache().ok,true);step(g.explorationPack,C.ExplorePackRules.cacheSeconds);return g.explorationPack.snapshot().caches[0];}
function putFood(c,amount){take({food:amount});Object.assign(g.player,{x:c.x,y:c.y});assert.equal(g.explorationPack.cacheTransfer(c.id,'store').ok,true);}

test('146 ration : le bouton historique lance un gain réel supplémentaire à la régénération naturelle, payé une seule fois',()=>{
 start();const c=camp();take(C.SurvivalPackRules.ration.cost);nearCamp(c);g.player.stamina=0;const saved=copy(g.serialize());click('survival','ration');tick(C.SurvivalPackRules.ration.seconds);
 const treated=g.player.stamina;assert.equal(g.player.carry.food,0);assert.equal(g.survivalPack.busy(),false);assert.equal(g.serialize().version,20);
 g.restoreSave(saved);tick(C.SurvivalPackRules.ration.seconds);assert.ok(Math.abs(treated-g.player.stamina-C.SurvivalPackRules.ration.stamina)<1e-6);assert.equal(g.player.carry.food,2,'The control run keeps its ration');
});
test('146 ration : pleine endurance, distance et expiration du camp refusent sans paiement ; pause et modale gèlent le travail',()=>{
 start();const c=camp();take(C.SurvivalPackRules.ration.cost);nearCamp(c);const bag=copy(g.player.carry);assert.equal(g.survivalPack.begin('ration').ok,false);g.player.stamina=10;
 g.player.x+=400;assert.equal(g.survivalPack.begin('ration').ok,false);nearCamp(c);const raw=g.serialize();raw.expansions127.modules.survival.camps[0].left=1;g.restoreSave(raw);assert.equal(g.survivalPack.begin('ration').ok,false);assert.deepEqual(g.player.carry,bag);
 raw.expansions127.modules.survival.camps[0].left=100;g.restoreSave(raw);assert.equal(g.survivalPack.begin('ration').ok,true);g.paused=true;step(g.survivalPack,3);assert.equal(g.survivalPack.activity().progress,0);g.paused=false;g.showCommand(true);step(g.survivalPack,3);assert.equal(g.survivalPack.activity().progress,0);g.showCommand(false);step(g.survivalPack,2);assert.equal(g.player.stamina,40);assert.equal(g.player.carry.food,0);
});
test('146 relève abritée : le camp et la vraie bâche sont exigés ; coût du sac et soin plafonné après vingt secondes',()=>{
 start();const c=camp();take(C.SurvivalPackRules.restSheltered.cost);nearCamp(c);g.player.invulnerable=0;g.damagePlayer(20);assert.equal(g.survivalPack.begin('restSheltered').ok,false);cover(c);nearCamp(c);
 const before=copy(g.player.carry),stock=copy(g.resources);click('survival','restSheltered');step(g.survivalPack,19.96);assert.deepEqual(g.player.carry,before);assert.equal(g.player.health,80);step(g.survivalPack,.04);
 assert.equal(g.player.health,100);assert.equal(g.player.carry.food,before.food-6);assert.equal(g.player.carry.medicine,before.medicine-1);assert.deepEqual(g.resources,stock);assert.equal(g.survivalPack.begin('restSheltered').ok,false);
});
test('146 relève abritée : une bâche trop courte refuse ; déplacement et perte des ingrédients annulent sans débit partiel',()=>{
 start();const c=camp();cover(c);take(C.SurvivalPackRules.restSheltered.cost);nearCamp(c);g.player.invulnerable=0;g.damagePlayer(40);const save=g.serialize();save.expansions127.modules.survival.camps[0].cover=10;g.restoreSave(save);assert.equal(g.survivalPack.begin('restSheltered').ok,false);
 save.expansions127.modules.survival.camps[0].cover=100;g.restoreSave(save);const before=copy(g.player.carry);assert.equal(g.survivalPack.begin('restSheltered').ok,true);step(g.survivalPack,1);g.player.x+=8;step(g.survivalPack,.04);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.player.health,60);
 g.restoreSave(save);assert.equal(g.survivalPack.begin('restSheltered').ok,true);step(g.survivalPack,1);g.player.carry.medicine=0;step(g.survivalPack,.04);assert.equal(g.survivalPack.busy(),false);assert.equal(g.player.carry.food,before.food);assert.equal(g.player.health,60);
});
test('146 pansement léger : neuf PV progressifs dans le même emplacement, conservation après reprise et aucun cumul',()=>{
 start();take(C.SurvivalPackRules.dressingLight.cost);g.player.invulnerable=0;g.damagePlayer(30);const random=g.random.state;click('survival','dressingLight');step(g.survivalPack,3);
 assert.equal(g.player.health,70);assert.equal(g.player.carry.medicine,0);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:15,remaining:9});assert.equal(g.survivalPack.preview('dressing').ok,false);assert.equal(g.survivalPack.preview('dressingLight').ok,false);assert.equal(g.random.state,random);
 const saved=g.serialize();assert.equal(DeadwallSave.validate(saved).version,20);g.restoreSave(saved);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:15,remaining:9});step(g.survivalPack,15);assert.ok(Math.abs(g.player.health-79)<1e-6);assert.equal(g.player.carry.medicine,0);
});
test('146 nouveaux soins : menace réelle et reprise interrompent une pose impayée ; campagne neuve sans consommable offert',()=>{
 start();take({medicine:1});g.player.invulnerable=0;g.damagePlayer(30);assert.equal(g.survivalPack.begin('dressingLight').ok,true);step(g.survivalPack,1);const before=copy(g.player.carry);const random=g.random.state;
 g.spawnZombie('walker');const zombie=g.zombies.at(-1);Object.assign(zombie,{x:g.player.x+90,y:g.player.y});assert.equal(g.hostileLineClear(zombie,g.player),true);tick(.04);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.player.health,70);
 const saved=g.serialize();g.restoreSave(saved);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});assert.notEqual(g.random.state,random,'Only the deliberately spawned threat advances combat RNG');g.startNew('standard','903147');g.campaignIntro132.skip();assert.deepEqual(g.survivalPack.snapshot(),DeadwallSurvivalPack.initial());assert.equal(C.bagTotal(g.player.carry),0);
});
test('146 survie régionale : une ration exige un camp du vrai domaine et conserve son gain dans player.stamina v20',()=>{
 start();const localCamp=camp();take({...C.SurvivalPackRules.camp.cost,food:2});Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);g.player.stamina=10;assert.equal(g.survivalPack.preview('ration').ok,false,'A camp in D17 cannot feed a regional action');
 assert.equal(g.survivalPack.begin('camp').ok,true);step(g.survivalPack,C.SurvivalPackRules.camp.seconds);assert.equal(g.survivalPack.snapshot().camps[1].domain,'region');assert.equal(g.survivalPack.snapshot().camps[0].id,localCamp.id);assert.equal(g.survivalPack.begin('ration').ok,true);step(g.survivalPack,2);assert.equal(g.player.stamina,40);assert.equal(g.player.carry.food,0);const saved=g.serialize();g.restoreSave(saved);assert.equal(g.player.stamina,40);assert.equal(g.survivalPack.snapshot().version,1);
});
test('146 ballot compact : coût payé à la fin, douze unités retirées du gisement fini, véritable vitesse de portage et conservation au chargement',()=>{
 start();const n=surveyed();take(C.ExplorePackRules.compactExtract.cost);standAt(g,g.player,n);const amount=n.amount,bag=copy(g.player.carry),gathered=g.stats.gathered,random=g.random.state;click('exploration','extract-compact');step(g.explorationPack,2.96);assert.deepEqual(g.player.carry,bag);assert.equal(n.amount,amount);step(g.explorationPack,.04);
 const parcel=g.explorationPack.snapshot().cargo[0];assert.equal(parcel.amount,12);assert.equal(n.amount,amount-12);assert.equal(g.stats.gathered,gathered+12);assert.equal(g.player.carry.wood,bag.wood-1);assert.equal(g.player.carry.scrap,bag.scrap-1);assert.equal(g.random.state,random);assert.match(g.explorationPack.overview().rows.find(r=>r.label==='Ballot porté').value,/86 %/);
 standAt(g,g.player,g.core());const p={x:g.player.x,y:g.player.y};g.moveFriendly(g.player,4,0);const loaded=g.player.x-p.x;assert.ok(loaded>0);Object.assign(g.player,p);const saved=g.serialize();g.explorationPack.drop();g.moveFriendly(g.player,4,0);assert.ok(Math.abs(loaded/(g.player.x-p.x)-.86)<1e-6);g.restoreSave(saved);assert.equal(g.explorationPack.snapshot().cargo[0].amount,12);assert.equal(g.explorationPack.carrying(),true);
});
test('146 ballot compact : mouvement, pause et gisement épuisé respectent fournitures et réserve native',()=>{
 start();const n=surveyed();take(C.ExplorePackRules.compactExtract.cost);standAt(g,g.player,n);const before=copy(g.player.carry),amount=n.amount;assert.equal(g.explorationPack.extractCompact(n.id).ok,true);g.paused=true;step(g.explorationPack,4);assert.equal(g.explorationPack.overview().task.progress,0);g.paused=false;g.player.x+=4;step(g.explorationPack,.04);assert.equal(g.explorationPack.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(n.amount,amount);
 standAt(g,g.player,n);assert.equal(g.explorationPack.extractCompact(n.id).ok,true);step(g.explorationPack,1);n.harvest(n.amount);step(g.explorationPack,.04);assert.equal(g.explorationPack.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.explorationPack.snapshot().cargo.length,0);
});
test('146 cache : le stockage partiel du ballot conserve le reliquat et ne compte aucune livraison au dépôt',()=>{
 start();const c=cache();putFood(c,36);putFood(c,16);const n=compact(),parcel=g.explorationPack.snapshot().cargo[0],source=n.amount;Object.assign(g.player,{x:c.x,y:c.y});const deposited=g.depositedResources,delivered=g.explorationPack.snapshot().delivered;click('exploration','stash');step(g.explorationPack,3);
 let state=g.explorationPack.snapshot();assert.equal(C.bagTotal(state.caches[0].stock),54);assert.equal(state.caches[0].stock.wood,2);assert.equal(state.cargo[0].amount,10);assert.equal(state.cargo[0].id,parcel.id);assert.equal(n.amount,source);assert.equal(g.depositedResources,deposited);assert.equal(state.delivered,delivered);assert.equal(g.explorationPack.preview('stash',c.id).ok,false);
 const saved=g.serialize();assert.equal(DeadwallSave.validate(saved).version,20);g.restoreSave(saved);assert.deepEqual(g.explorationPack.snapshot(),state);assert.equal(g.explorationPack.cacheTransfer(c.id,'take').ok,true);assert.equal(g.explorationPack.stash(c.id).ok,true);step(g.explorationPack,3);state=g.explorationPack.snapshot();assert.equal(state.cargo.length,0);assert.equal(g.player.carry.wood+state.caches[0].stock.wood,12);assert.equal(g.explorationPack.carrying(),false);
});
test('146 cache : distance, déplacement et reprise refusent ou annulent sans transfert à distance ni duplication',()=>{
 start();const c=cache();compact();g.player.x=c.x+200;g.player.y=c.y;assert.equal(g.explorationPack.stash(c.id).ok,false);Object.assign(g.player,{x:c.x,y:c.y});assert.equal(g.explorationPack.stash(c.id).ok,true);step(g.explorationPack,1);const before=g.explorationPack.snapshot();g.player.x+=4;step(g.explorationPack,.04);assert.deepEqual(g.explorationPack.snapshot(),before);assert.equal(g.explorationPack.busy(),false);
 Object.assign(g.player,{x:c.x,y:c.y});assert.equal(g.explorationPack.stash(c.id).ok,true);step(g.explorationPack,1);const saved=g.serialize();g.restoreSave(saved);assert.equal(g.explorationPack.busy(),false);step(g.explorationPack,4);assert.deepEqual(g.explorationPack.snapshot(),before);g.startNew('standard','903147');g.campaignIntro132.skip();assert.deepEqual(g.explorationPack.snapshot(),DeadwallExplorationPack.initial());assert.equal(C.bagTotal(g.player.carry),0);
});
test('146 interlocks : les nouvelles recettes partagent la recharge, les interventions et le refus transactionnel des anciens registres',()=>{
 start();const c=camp();take({food:2,medicine:1});nearCamp(c);g.player.stamina=10;g.player.invulnerable=0;g.damagePlayer(30);assert.equal(g.survivalPack.begin('dressingLight').ok,true);assert.equal(g.survivalPack.begin('ration').ok,false);g.survivalPack.cancel();g.startReload();g.player.magazine.pistol=0;g.startReload();assert.ok(g.player.reload>0);const bag=copy(g.player.carry);assert.equal(g.survivalPack.begin('ration').ok,false);assert.equal(g.explorationPack.preview('stash',1).ok,false);assert.deepEqual(g.player.carry,bag);
 g.player.reload=0;const good=g.serialize(),world=g.world;good.expansions127.modules.survival.dressing.remaining=19;assert.throws(()=>g.restoreSave(good));assert.equal(g.world,world);assert.deepEqual(g.player.carry,bag);
});
