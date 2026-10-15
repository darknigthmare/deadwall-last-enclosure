'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const checkpoint=g=>{const d=g.serialize();delete d.timestamp;return d;};
const models=new Map();
function worlds(frontier){
 const{detailVersion,ecologyVersion}=frontier,key=ecologyVersion+':'+detailVersion;
 if(!models.has(key))models.set(key,{old:W.create(17117,8,{detailVersion,ecologyVersion}),next:W.create(17117,9,{detailVersion,ecologyVersion})});
 return models.get(key);
}
function campaign(){const{game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();assert.equal(g.frontier.position().generation,8);
 const reference=worlds(g.frontier.position()).old,live=g.frontier.world();assert.equal(reference.ecologyVersion,live.ecologyVersion);
 assert.ok(JSON.stringify(reference.pois)===JSON.stringify(live.pois),'The fixture must use the actual campaign parcels and identities');return g;}
const activate=g=>g.worldOps131.actions().find(a=>a.id==='expandCodex4000').run();
function newWall(radius,g){const{old,next}=worlds(g.frontier.position());for(const p of next.pois.filter(p=>p.generation===9))for(let y=2;y<p.h-2;y+=2){const q=G.global(p,.05,y);if(!old.blocked(q.x,q.y,radius)&&next.blocked(q.x,q.y,radius))return q;}assert.fail('No genuinely new wall covering previously clear ground');}

test('G9: fresh campaigns stay G8 and the inherited G7 upgrade remains guarded',()=>{
 const{game:g}=boot127();Ops.install(g);g.startNew('standard','17117');
 assert.equal(g.frontier.position().generation,8);assert.equal(g.worldOps131.actions().some(a=>a.id==='expandCodex4000'),true);
 require('./helpers/generation141.cjs').legacy(g,7);
 assert.equal(g.frontier.position().generation,7);assert.equal(g.worldOps131.actions().some(a=>a.id==='expandCodex4000'),false);
 standAt(g,g.player,g.core());assert.equal(g.worldOps131.actions().find(a=>a.id==='expandCodex3000').run().ok,true);
 g.player.reload=1;const before=checkpoint(g),action=g.worldOps131.actions().find(a=>a.id==='expandCodex4000');
 assert.equal(action.disabled,true);assert.match(action.reason,/rechargement/i);assert.deepEqual(action.run(),{ok:false,reason:action.reason});assert.deepEqual(checkpoint(g),before);
 g.player.reload=0;g.player.dead=true;assert.equal(g.worldOps131.actions().find(a=>a.id==='expandCodex4000').run().ok,false);
});

test('G9: activation retains paid surveys, local stocks, harvested budgets and round-trip save',()=>{
 const g=campaign(),{old,next}=worlds(g.frontier.position()),sector=old.sectors.find(s=>s.sites.length&&next.sectors.find(n=>n.id===s.id).sites.length>s.sites.length);
 assert.ok(sector,'new programmes append to a real previously surveyed sector');
 const data=g.serialize();data.frontier.seen=sector.sites.slice();data.expansions127.modules.world131.surveyed=[sector.id];
 const tree=old.chunk(48,48).trees[0];assert.ok(tree);data.frontier.taken[tree.id]=Math.min(1,tree.amount);
 assert.equal(g.restoreSave(data),true);const before=checkpoint(g);assert.equal(activate(g).ok,true);
 const after=checkpoint(g);assert.equal(after.frontier.generation,9);
 for(const k of ['resources','nodes','player','randomState','expeditions'])assert.deepEqual(after[k],before[k],k);
 assert.deepEqual(after.frontier.taken,before.frontier.taken);assert.deepEqual(after.expansions127,before.expansions127);
 const surveyed=next.sectors.find(s=>s.id===sector.id).sites;
 assert.ok(surveyed.every(id=>after.frontier.seen.includes(id)));
 assert.ok(after.frontier.seen.every(id=>before.frontier.seen.includes(id)||surveyed.includes(id)),'unpaid sector revealed');
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),after);
 assert.equal(g.worldOps131.actions().some(a=>a.id==='expandCodex4000'),false,'extension cannot be applied twice');
});

test('G9: a placed camp blocks extension atomically until it is dismantled on site',()=>{
 const g=campaign(),point=newWall(C.SurvivalPackRules.campRadius,g),data=g.serialize();
 data.expansions127.modules.survival.serial=2;data.expansions127.modules.survival.camps=[{id:1,domain:'region',...point,z:0,inside:null,left:300,cover:0}];
 assert.equal(g.restoreSave(data),true);const before=checkpoint(g),result=activate(g);
 assert.equal(result.ok,false);assert.match(result.reason,/bivouac/i);assert.deepEqual(checkpoint(g),before);
 const at=g.serialize();Object.assign(at.frontier,{active:true,...point,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});assert.equal(g.restoreSave(at),true);
 assert.equal(g.survivalPack.dismantle().ok,true);const home=g.serialize();Object.assign(home.frontier,{active:false,anchor:null});assert.equal(g.restoreSave(home),true);
 assert.equal(activate(g).ok,true);assert.equal(g.survivalPack.snapshot().camps.length,0);
});

test('G9: a placed light blocks extension without consuming time or supplies',()=>{
 const g=campaign(),point=newWall(.28,g),data=g.serialize();
 data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:60,on:false,used:true,domain:'region',...point,z:0,inside:null,angle:0}]};
 assert.equal(g.restoreSave(data),true);const before=checkpoint(g),result=activate(g);
 assert.equal(result.ok,false);assert.match(result.reason,/éclairage/i);assert.deepEqual(checkpoint(g),before);
});

test('G9: a paid parked vehicle keeps its identity, fuel and cargo when extension is refused',()=>{
 const g=campaign(),{old,next}=worlds(g.frontier.position()),core=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77&&!garage;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(core.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);}
 assert.ok(garage,'prepared completed garage');g.refreshMetrics(true);standAt(g,g.player,g.core());
 assert.equal(g.expeditions.buildCar().ok,true,'vehicle is paid through its actual controller');
 const profile=g.worldEvolution.vehicleProfile();let point;
 for(const p of next.pois.filter(p=>p.generation===9)){for(let y=2;y<p.h-2&&!point;y+=2){const q=G.global(p,.05,y);if(old.vehicleClear(q.x,q.y,0,profile.w,profile.h)&&!next.vehicleClear(q.x,q.y,0,profile.w,profile.h))point=q;}if(point)break;}
 assert.ok(point,'new wall occupies previously clear parking ground');
 const data=g.serialize(),vehicle=data.expeditions.vehicle;vehicle.fuel=3;vehicle.cargo.scrap=4;
 data.frontier.car={id:vehicle.id,...point,a:0,driving:false};assert.equal(g.restoreSave(data),true);
 const before=checkpoint(g),result=activate(g);assert.equal(result.ok,false);assert.match(result.reason,/voiture/i);assert.deepEqual(checkpoint(g),before);
});
