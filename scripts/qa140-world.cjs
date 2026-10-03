'use strict';
// Production HTML order. Advanced poses are prepared only on shared physical
// emprises; paid barricade construction, driving exits and walking are real.
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.DEADWALL_QA_ROOT||path.resolve(__dirname,'..');
const {bootDocument134}=require(path.join(root,'scripts/qa-startup134.cjs'));
const copy=v=>JSON.parse(JSON.stringify(v));
function start(type='break'){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();const C=globalThis.DeadwallCore,c=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(c.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);break;}
 assert.ok(garage);g.refreshMetrics(true);g.tier={id:4};g.resources.wood=g.resources.scrap=500;assert.equal(g.worldEvolution.selectVehicle(type),true);
 const before=copy(g.resources);assert.equal(g.expeditions.buildCar().ok,true);for(const[k,n]of Object.entries(g.worldEvolution.vehicleProfile().cost))assert.equal(g.resources[k],before[k]-n);return g;
}
function driving(g,q){
 assert.equal(g.expeditions.carClear(q.x,q.y),true,'Le véhicule préparé tient sur sa véritable emprise locale.');const raw=g.serialize();Object.assign(raw.expeditions.vehicle,q,{angle:Math.PI,driving:true,fuel:5,cargo:globalThis.DeadwallCore.makeBag({food:3.125,fuel:.75})});Object.assign(raw.player,q);assert.equal(g.restoreSave(raw),true);assert.equal(g.expeditions.driving(),true);assert.equal(g.expeditions.carClear(q.x,q.y),true);return g.expeditions.car();
}
function persist(g){const p={x:g.player.x,y:g.player.y,radius:g.player.radius},v=copy(g.expeditions.car()),bag=copy(g.player.carry),barriers=g.barricades134.snapshot();assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual({x:g.player.x,y:g.player.y,radius:g.player.radius},p);assert.equal(g.expeditions.car().id,v.id);assert.equal(g.expeditions.car().driving,v.driving);assert.equal(g.expeditions.car().fuel,v.fuel);assert.deepEqual(g.expeditions.car().cargo,v.cargo);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.barricades134.snapshot(),barriers);}
function barricadedExit(observe=false){
 const g=start(),C=globalThis.DeadwallCore,B=globalThis.DeadwallBarricades134,t=B.localTargets(g.exploration125.plan).find(t=>t.id==='local:station-1:window:broken-east');assert.ok(t);assert.ok(Math.abs(Math.sin(t.angle))>.98);
 const approach={x:t.x+32,y:t.y};assert.equal(g.friendlyPositionClear(g.player,approach.x,approach.y),true);Object.assign(g.player,approach);g.player.carry=C.makeBag({wood:12,scrap:4});const cost=C.BarricadeRules134.types.planks.cost;assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);for(let i=0;i<100&&g.barricades134.busy();i++)g.barricades134.step(.25);
 assert.equal(g.barricades134.busy(),false);assert.equal(g.barricades134.snapshot().records.length,1);for(const[k,n]of Object.entries(cost))assert.equal(g.player.carry[k],({wood:12,scrap:4})[k]-n);
 const q={x:t.x-28,y:t.y},v=driving(g,q),id=v.id,radius=g.player.radius,exitDistance=radius+13+8,previousCandidate={x:q.x+exitDistance,y:q.y};assert.equal(g.friendlyPositionClear({radius:13},previousCandidate.x,previousCandidate.y),true,'L’ancienne arrivée est libre, mais située de l’autre côté de la barricade.');assert.equal(g.nightGear.localLineClear(q,previousCandidate),false);assert.ok(g.barricades134.firstObstruction(q,previousCandidate,13*.78));const before={point:q,cargo:copy(v.cargo),fuel:v.fuel,bag:copy(g.player.carry),barrier:g.barricades134.snapshot()};
 const result=g.expeditions.board(),after={x:g.player.x,y:g.player.y},clear=g.nightGear.localLineClear(q,after),hit=g.barricades134.firstObstruction(q,after,13*.78);
 if(observe)return{scenario:'barricaded-exit',before,previousCandidate,result,after,clear,hit:hit?.target?.id||hit?.id||!!hit};
 assert.equal(result.ok,true,result.reason);assert.equal(clear,true,'Le choix d’une portière locale ne traverse pas une ouverture barricadée.');assert.equal(hit,null);assert.equal(g.friendlyPositionClear({radius:13},after.x,after.y),true);assert.ok(after.x<t.x,'Une autre sortie conserve le commandant du bon côté de la barrière.');assert.equal(g.player.radius,13);assert.equal(g.expeditions.driving(),false);assert.equal(v.id,id);assert.equal(v.fuel,before.fuel);assert.deepEqual(v.cargo,before.cargo);assert.deepEqual(g.player.carry,before.bag);assert.deepEqual(g.barricades134.snapshot(),before.barrier);persist(g);
 const x=g.player.x;g.input.keys.add('KeyA');for(let i=0;i<3;i++){g.update(.04);g.input.pressed.clear();}g.input.keys.clear();assert.ok(g.player.x<x-.3,'Le conducteur débarqué peut réellement marcher.');assert.equal(g.expeditions.board().ok,true);assert.equal(g.expeditions.driving(),true);persist(g);assert.equal(g.expeditions.car().fuel,before.fuel);assert.deepEqual(g.expeditions.car().cargo,before.cargo);
 return{scenario:'barricaded-exit',status:'passed',browser:false,target:t.id,cost,before,previousCandidate,after,clear,barrierPreserved:true,actualWalking:true,reboarded:true};
}
function busFreeExit(){
 const g=start('bus'),q={x:2048,y:3900},v=driving(g,q),before=copy(v),radius=g.player.radius;assert.equal(g.expeditions.board().ok,true);const after={x:g.player.x,y:g.player.y};assert.equal(g.nightGear.localLineClear(q,after),true);assert.equal(g.friendlyPositionClear({radius:13},after.x,after.y),true);assert.ok(Math.hypot(after.x-q.x,after.y-q.y)>radius+13);assert.equal(g.player.radius,13);assert.equal(v.fuel,before.fuel);assert.deepEqual(v.cargo,before.cargo);persist(g);return{scenario:'bus-free-exit',status:'passed',browser:false,controlOnly:true,radius,before:q,after,fuel:before.fuel,cargo:before.cargo};
}
const scenarios={'barricaded-exit':barricadedExit,'bus-free-exit':busFreeExit};module.exports={scenarios};
if(require.main===module){try{const name=process.argv[2];if(!scenarios[name])throw Error('Scénario inconnu '+name);process.stdout.write(JSON.stringify(scenarios[name](process.argv.includes('--observe')))+'\n');}catch(error){console.error(error.stack);process.exitCode=1;}}
