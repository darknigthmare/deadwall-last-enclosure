'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const {legacyAge}=require('./helpers/legacy-city.cjs');

function fresh(){
 const {g}=bootDocument134();g.startNew('standard','903145');g.campaignIntro132.skip();
 g.units=[];g.phaseTime=999;g.resources.food=300;g.resources.medicine=30;g.resources.scrap=100;
 standAt(g,g.player,g.core());return g;
}
function discover(g){const d=g.serialize();d.frontier.seen=g.frontier.world().pois.map(p=>p.id);g.restoreSave(d);standAt(g,g.player,g.core());}
function field(g,p){
 const d=g.serialize(),w=g.frontier.world();
 Object.assign(d.frontier,{active:true,anchor:{x:g.player.x,y:g.player.y},x:p.x,y:p.y,z:0,inside:null});
 for(const poi of w.nearPOI(p.x,p.y,110))for(let i=0;i<w.threatCount(poi);i++)d.frontier.enemies[poi.id+':e'+i]=0;
 d.frontier.kills=Object.values(d.frontier.enemies).filter(n=>n===0).length;g.restoreSave(d);
}
function openNear(g,p){
 const w=g.frontier.world();
 for(let r=1.8;r<2.9;r+=.2)for(let a=0;a<Math.PI*2;a+=.1){const q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};if(!w.blocked(q.x,q.y,.4,0,null)&&w.line(q,p,0,null,null,.05))return q;}
 throw Error('A reachable exterior position within the contract access radius is required.');
}

test('152 campaign: a real reanimated survivor blocks contract work without consuming the field supplies',()=>{
 const g=fresh();discover(g);const q=g.campaignPack.previewStart('medical');assert.equal(q.ok,true,q.reason);
 const p=g.campaignPack.sitePoint(q.sites[0]);field(g,p);g.player.invulnerable=0;g.frontier.damage(1000);
 assert.equal(g.succession133.select('porter'),true);standAt(g,g.player,g.core());
 const d=g.serialize(),r=d.succession133.remains.at(-1);r.body.phase='waiting';r.body.roll=0;r.body.left=.01;g.restoreSave(d);
 assert.equal(g.loadout.transfer('depot','sac','scrap',2).ok,true);assert.equal(g.campaignPack.start('medical').ok,true);
 field(g,openNear(g,p));g.succession133.step(.1);
 const threat=g.succession133.contacts()[0];assert.ok(threat);assert.equal(g.frontier.visibleEnemy(threat),true);
 const bag={...g.player.carry},stock={...g.resources},state=g.campaignPack.snapshot();
 assert.equal(g.campaignPack.previewWork().ok,false);assert.equal(g.campaignPack.begin().ok,false);
 assert.equal(g.campaignPack.busy(),false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);assert.deepEqual(g.campaignPack.snapshot(),state);
 assert.equal(g.succession133.hit(threat.x,threat.y,100,0,null,threat.id),true);
 assert.equal(g.campaignPack.begin().ok,true);assert.equal(g.campaignPack.cancel(),true);assert.deepEqual(g.player.carry,bag);
});

test('152 campaign: a real reanimation interrupts work already begun, with its paid attempt preserved on Continue',()=>{
 const g=fresh();discover(g);const q=g.campaignPack.previewStart('medical'),p=g.campaignPack.sitePoint(q.sites[0]);
 field(g,p);g.player.invulnerable=0;g.frontier.damage(1000);assert.equal(g.succession133.select('porter'),true);standAt(g,g.player,g.core());
 const d=g.serialize(),r=d.succession133.remains.at(-1);r.body.phase='waiting';r.body.roll=0;r.body.left=.15;g.restoreSave(d);
 assert.equal(g.loadout.transfer('depot','sac','scrap',2).ok,true);assert.equal(g.campaignPack.start('medical').ok,true);
 field(g,openNear(g,p));assert.equal(g.campaignPack.begin().ok,true);g.loop(g.lastFrame+40);
 assert.equal(g.campaignPack.busy(),true);const bag={...g.player.carry},stock={...g.resources},paid=g.campaignPack.snapshot();
 g.succession133.step(.1);g.succession133.step(.1);assert.equal(g.succession133.contacts().length,1);g.loop(g.lastFrame+40);
 assert.equal(g.campaignPack.busy(),false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);assert.deepEqual(g.campaignPack.snapshot(),paid);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.campaignPack.snapshot(),paid);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);
 assert.equal(g.campaignPack.begin().ok,false);const threat=g.succession133.contacts()[0];assert.equal(g.succession133.hit(threat.x,threat.y,100,0,null,threat.id),true);
 assert.equal(g.campaignPack.begin().ok,true);assert.equal(g.campaignPack.cancel(),true);assert.deepEqual(g.resources,stock);assert.deepEqual(g.player.carry,bag);
});

test('152 campaign: fatal core damage freezes an active paid defense contract at the defeat snapshot',()=>{
 const g=fresh();
 assert.equal(g.campaignPack.start('defense').ok,true);
 const fee={...g.resources};g.world.nodes.forEach(n=>n.depleted=true);
 g.phase='assault';g.phaseTime=999;g.spawnQueue=[];g.pendingSpawns={};g.spawnTimer=999;
 assert.equal(g.spawnZombie('breacher'),true);const z=g.zombies[0],core=g.core();
 Object.assign(z,{x:core.left-z.radius-1,y:core.y,attackCooldown:0});core.health=1;g.rebuildBuckets();
 let atDefeat;const old=g.triggerGameOver.bind(g);g.triggerGameOver=(...args)=>{const value=old(...args);atDefeat=g.campaignPack.snapshot();return value;};
 g.loop(g.lastFrame+40);assert.equal(g.gameOver,true);assert.ok(atDefeat.active);assert.equal(atDefeat.active.kind,'defense');
 assert.deepEqual(g.campaignPack.snapshot(),atDefeat);assert.deepEqual(g.resources,fee);
 for(let i=0;i<5;i++)g.loop(g.lastFrame+40);assert.deepEqual(g.campaignPack.snapshot(),atDefeat);
});

test('152 shared hands: the local deposit cannot advance beside an active paid companion exercise',()=>{
 const g=fresh();g.population=10;assert.equal(g.worldEvolution.assignCompanion('lea'),true);
 assert.equal(g.companionsPack.train('lea').ok,true);g.player.carry.wood=4;
 const training=g.companionsPack.snapshot().training,bag={...g.player.carry},stock={...g.resources},deposited=g.depositedResources;
 assert.equal(g.expansions.busy(),true);g.input.keys.add('KeyE');g.loop(g.lastFrame+40);g.input.keys.clear();
 assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);assert.equal(g.depositedResources,deposited);
 assert.ok(g.companionsPack.snapshot().training.left<training.left);
 assert.equal(g.companionsPack.cancelTraining().ok,true);g.input.keys.add('KeyE');g.loop(g.lastFrame+40);g.input.keys.clear();
 assert.equal(g.player.carry.wood,0);assert.equal(g.resources.wood,stock.wood+4);assert.equal(g.depositedResources,deposited+4);
});

test('152 shared hands: a real paid fortification job blocks E construction through every local wrapper until cancelled',()=>{
 const g=fresh(),C=globalThis.DeadwallCore,core=g.core(),gx=core.gx+7,gy=core.gy;
 const recipe=C.FortificationPackRules.fieldSupply.repair;
 for(const[key,n]of Object.entries(recipe.cost))assert.equal(g.loadout.transfer('depot','sac',key,n).ok,true);
 // Both foundations are financed through the shipped placement controller.
 // Setup accelerates only the wall's already-paid construction; the house
 // remains a real unfinished, paid worksite for the E interaction under test.
 const before={...g.resources};assert.equal(g.placeOne('woodWall',gx,gy),true);
 const wall=[...g.world.buildings.values()].find(b=>b.gx===gx&&b.gy===gy);assert.ok(wall);
 assert.equal(before.wood-g.resources.wood,C.BUILDINGS.woodWall.cost.wood);assert.equal(wall.work(wall.def.buildTime),true);g.completeBuilding(wall);
 assert.equal(g.placeOne('house',gx+2,gy),true);const house=[...g.world.buildings.values()].find(b=>b.gx===gx+2&&b.gy===gy);assert.ok(house&&!house.completed);
 Object.assign(g.player,{x:wall.right+16,y:wall.y});assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);
 assert.equal(g.workerCanWorkAt(g.player,house,78),true);assert.equal(g.fortificationPack.startFieldSupply('repair',wall.id).ok,true);
 const progress=house.progress,bag={...g.player.carry},stock={...g.resources};
 g.input.keys.add('KeyE');g.updatePlayer(.04);g.input.keys.clear();
 assert.equal(house.progress,progress);assert.equal(g.fortificationPack.busy(),true);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);
 g.fortificationPack.step(.04);assert.ok(g.fortificationPack.job.elapsed>0,'The owning fortification job continues its own work with the shared hands occupied.');
 assert.equal(g.fortificationPack.stop(),true);g.input.keys.add('KeyE');g.updatePlayer(.04);g.input.keys.clear();
 assert.ok(house.progress>progress);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);
});

for(const exercise of ['specialty','escort','triage'])test('152 companion HUD: '+exercise+' reports its actual paid duration and preserves progress on Continue',()=>{
 const g=fresh(),C=globalThis.DeadwallCore,R=C.CompanionPackRules,id='samir';
 // Only historical knowledge is a fixture. Assignment, each prerequisite
 // exercise, its cost, work, Continue and cancellation use shipped controllers.
 if(exercise==='triage')legacyAge(g,C.CITY_TIERS[R.exercises.triage.tier].requiredScore);
 g.population=10;assert.equal(g.worldEvolution.assignCompanion(id),true);standAt(g,g.player,g.core());
 function purchase(name){const option=name==='specialty'?R.training:R.exercises[name],before={...g.resources};assert.equal(g.companionsPack.train(id,name).ok,true);for(const[key,n]of Object.entries(option.cost))assert.equal(before[key]-g.resources[key],n);return option;}
 for(const prerequisite of exercise==='specialty'?[]:exercise==='escort'?['specialty']:['specialty','escort','support']){
  purchase(prerequisite);let steps=0;while(g.companionsPack.snapshot().training&&steps++<2000)g.companionsPack.update(.1);assert.equal(g.companionsPack.snapshot().training,null);
 }
 const option=purchase(exercise),paid={...g.resources},work=document.getElementById('expansionWork');
 g.expansionUI.refresh(true);assert.match(work.children[0].textContent,/0 %/);assert.equal(work.children[1].value,0);
 for(let left=option.seconds/4;left>1e-8;left-=.1)g.companionsPack.update(Math.min(left,.1));
 const current=g.companionsPack.snapshot();g.expansionUI.refresh(true);assert.ok(Math.abs(work.children[1].value-.25)<1e-8);assert.match(work.children[0].textContent,/2[45] %/);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.companionsPack.snapshot(),current);assert.deepEqual(g.resources,paid);
 g.expansionUI.refresh(true);assert.ok(Math.abs(work.children[1].value-.25)<1e-8);assert.match(work.children[0].textContent,/2[45] %/);
 assert.equal(g.companionsPack.cancelTraining().ok,true);g.expansionUI.refresh(true);assert.equal(work.classList.contains('hidden'),true);assert.deepEqual(g.resources,paid);
});
