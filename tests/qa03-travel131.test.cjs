'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),Survey=require('../src/frontier-survey.js'),Travel=require('../src/exploration-pack131.js');
const R=C.Travel131Rules;
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label||'quantité'} : ${a} / ${b}`);
function fresh(){const {g}=boot131();g.phase='calm';g.phaseTime=9999;g.units=[];g.zombies=[];return g;}
function empty(g){for(const k of C.RESOURCE_KEYS)g.player.carry[k]=0;}
function ticks(g,seconds,full=false){for(let i=0;i<Math.ceil(seconds/.04);i++){full?g.update(.04):g.travel131.step(.04);g.input.pressed.clear();}}
function vehicle(g,kind='break'){
 const garage=new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1);g.world.add(garage);g.refreshMetrics(true);g.fieldcraft.setup();g.tier={...g.tier,id:4};
 assert.ok(g.worldEvolution.selectVehicle(kind));standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=400;assert.ok(g.expeditions.buildCar().ok);
 const v=g.expeditions.car();empty(g);g.player.x=v.x+36;g.player.y=v.y;return v;
}
function enter(g){const v=g.expeditions.car();g.player.x=4058;g.player.y=2048;if(v){v.x=g.player.x;v.y=g.player.y;v.driving=true;g.player.radius=22;}assert.ok(g.frontier.enter());if(v)assert.ok(g.frontier.board());}
function service(g){Object.assign(g.player.carry,{scrap:8,fuel:1});assert.ok(g.travel131.begin('service').ok);ticks(g,R.serviceSeconds);assert.equal(g.travel131.busy(),false);assert.equal(g.travel131.snapshot().tuning.remaining,2000);}
function known(g,ids){g.frontier.revealSites(ids);}
function stable(g){const d=g.serialize();delete d.timestamp;return d;}
function farPose(g,p,driving=false){const raw=g.serialize();Object.assign(raw.frontier,{x:p.x,y:p.y,z:0,inside:null,a:0});if(raw.frontier.car)Object.assign(raw.frontier.car,{x:p.x,y:p.y,a:0,driving});g.restoreSave(raw);}
function totals(g){const v=g.expeditions.car();return Object.fromEntries(C.RESOURCE_KEYS.map(k=>[k,g.resources[k]+g.player.carry[k]+(v?.cargo[k]||0)+(k==='fuel'?(v?.fuel||0):0)]));}

test('QA03 G5 : manifestes, coffre et dépôt saturé conservent les quantités et les reliquats',()=>{
 const g=fresh(),v=vehicle(g,'van');standAt(g,g.player,g.core());const total=totals(g);
 assert.ok(g.travel131.begin('pack','motor').ok);ticks(g,R.packingSeconds);assert.deepEqual(totals(g),total);
 for(const[k,n]of Object.entries(R.manifests.motor.stock))assert.equal(g.player.carry[k],n);
 g.player.x=v.x+36;g.player.y=v.y;assert.ok(g.expeditions.transfer().ok);assert.deepEqual(totals(g),total);assert.equal(C.bagTotal(g.player.carry),0);
 const before=v.cargo.fuel;g.resources.fuel=g.storage-1;assert.ok(g.expeditions.unload().ok);assert.equal(g.resources.fuel,g.storage);assert.equal(v.cargo.fuel,before-1);
 enter(g);g.player.carry.wood=g.player.carryCapacity-2;const left=v.cargo.fuel;assert.equal(g.fieldSupplies.transfer('car','fuel','withdraw','max').amount,2);assert.equal(v.cargo.fuel,left-2);assert.equal(C.bagTotal(g.player.carry),g.player.carryCapacity);
 const depot=g.resources.fuel;assert.equal(g.fieldSupplies.transfer('depot','fuel','withdraw',1).ok,false);assert.equal(g.resources.fuel,depot);
 const bag={...g.player.carry},cargo={...v.cargo};assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.expeditions.car().cargo,cargo);
});

test('QA03 G5 : les neuf modèles emploient leur vrai tarif, y compris vélo et skate sans carburant',()=>{
 for(const[kind,profile]of Object.entries(C.WorldEvolution.RULES.vehicles)){
  const g=fresh();vehicle(g,kind);const p=g.frontier.world().pois.find(p=>p.x>12000&&p.y>12000);known(g,[p.id]);assert.ok(g.frontier.pin(p.id));assert.ok(g.fieldAtlas.add(p.id));assert.ok(g.fieldAtlas.configure('car','east'));
  const budget=g.fieldSupplies.routePlan(),tour=g.fieldAtlas.planning(),gps=g.frontier.guidance();
  close(budget.fuel,budget.metres*profile.fuel,kind+' retour');close(tour.fuel,tour.loopMetres*profile.fuel,kind+' tournée');close(gps.fuel,gps.metres*profile.fuel,kind+' GPS');
  close(budget.required,budget.metres*1.25*profile.fuel+(profile.fuel?2:0));close(tour.required,tour.loopMetres*1.25*profile.fuel+(profile.fuel?2:0));
  const sites=g.expeditions.overview().sites;assert.ok(sites.length);for(const site of sites){const car=g.expeditions.car(),units=Math.hypot(car.x-site.x,car.y-site.y)+Math.hypot(site.x-g.core().x,site.y-g.core().y);close(site.minimumFuel,units*C.Expeditions.RULES.fuelPerUnit*(profile.fuel/.004),kind+' expédition locale');}
  enter(g);const checked=g.returnRoutes.verify('car'),gate=checked.gates.find(q=>q.path);assert.ok(gate,kind+' retour accessible');assert.ok(g.returnRoutes.select(gate.id));const back=g.returnRoutes.budget();assert.equal(back.status,'connected');close(back.regionFuel,back.regionMetres*profile.fuel);close(back.localFuel,back.localMetres*32*.003*(profile.fuel/.004));close(back.required,(back.regionFuel+back.localFuel)*1.25+(profile.fuel?2:0));
  if(!profile.fuel){assert.equal(g.travel131.preview('service').ok,false);assert.equal(g.travel131.preview('siphon').ok,false);assert.equal(tour.required,0);assert.equal(budget.shortfall,0);}
 }
});

test('QA03 G5 : tournée lointaine, révision une seule fois, marge exacte et devis frais sans mutation',()=>{
 const g=fresh(),v=vehicle(g,'truck');service(g);enter(g);const places=g.frontier.world().pois.filter(p=>p.x>12000&&p.y>12000).slice(0,2);known(g,places.map(p=>p.id));g.frontier.pin(places[0].id);places.forEach(p=>assert.ok(g.fieldAtlas.add(p.id)));g.fieldAtlas.configure('car','east');g.fieldAtlas.start();
 const before=stable(g),rate=g.worldEvolution.vehicleProfile().fuel,budget=g.fieldSupplies.routePlan(),tour=g.fieldAtlas.planning();
 assert.ok(budget.metres>20000);assert.equal(tour.legs.length,2);assert.ok(tour.back);assert.ok(tour.loopMetres>tour.metres);assert.ok(tour.excludesLocal);
 const expected=m=>rate*(m-Math.min(m,2000)*.2);
 close(budget.fuel,expected(budget.metres));close(budget.required,expected(budget.metres*1.25)+2);close(budget.margin,budget.required-budget.fuel-2);
 close(tour.fuel,expected(tour.loopMetres));close(tour.required,expected(tour.loopMetres*1.25)+2);close(g.frontier.guidance().fuel,expected(tour.legs[0].metres));assert.deepEqual(stable(g),before);
 g.travel131.consumeDistance(1750,v.id);const newer=g.fieldSupplies.routePlan(),newTour=g.fieldAtlas.planning();close(newer.fuel-budget.fuel,rate*1750*.2);close(newTour.fuel-tour.fuel,rate*1750*.2);assert.equal(newTour.loopMetres,tour.loopMetres);
 g.fieldAtlas.configure('foot','east');assert.equal(g.fieldAtlas.planning().required,0);assert.equal(g.frontier.guidance().fuel,0);
});

test('QA03 G5 : trajet réel au-delà de 20 km, aller-retour de plus de 2 km et fin de révision',t=>{
 const g=fresh(),v=vehicle(g);service(g);v.fuel=24;enter(g);const w=g.frontier.world(),road=w.roads.find(r=>r.a.x===20855&&r.a.y===21067&&r.b.x===22145);assert.ok(road&&road.a.x>20000);
 const mix=t=>({x:road.a.x+(road.b.x-road.a.x)*t,y:road.a.y+(road.b.y-road.a.y)*t}),origin=mix(.04),target=mix(.96);farPose(g,origin,true);const fuel=g.expeditions.car().fuel,initial=g.frontier.snapshot().distance;
 function drive(to){for(let i=0;i<8000;i++){const p=g.frontier.position(),dx=to.x-p.x,dy=to.y-p.y;if(Math.hypot(dx,dy)<.8)return;const laneY=road.a.y+(p.x-road.a.x)/(road.b.x-road.a.x)*(road.b.y-road.a.y),steerY=Math.abs(dx)<1?dy:laneY-p.y;g.input.keys.clear();if(Math.abs(dx)>.4)g.input.keys.add(dx>0?'KeyD':'KeyA');if(Math.abs(steerY)>.4)g.input.keys.add(steerY>0?'KeyS':'KeyW');g.updatePlayer(.04);}assert.fail('Le véhicule doit rejoindre le point par les collisions réelles : '+JSON.stringify({pose:g.frontier.position(),target:to}));}
 drive(target);assert.ok(g.frontier.position().x>22000);drive(origin);g.input.keys.clear();const metres=g.frontier.snapshot().distance-initial;
 t.diagnostic(JSON.stringify({metres,fuelUsed:fuel-g.expeditions.car().fuel,origin,returned:g.frontier.position()}));assert.ok(metres>2300&&metres<2500);close(fuel-g.expeditions.car().fuel,.004*(metres-400));assert.equal(g.travel131.snapshot().tuning,null);assert.ok(g.expeditions.car().fuel>0);assert.ok(Math.hypot(g.frontier.position().x-origin.x,g.frontier.position().y-origin.y)<.8);
 const pose=g.frontier.position(),stock=totals(g);assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.frontier.position(),pose);assert.deepEqual(totals(g),stock);
});

test('QA03 G5 : soins et réparations respectent les neuf plafonds de santé sans ressusciter',()=>{
 for(const[kind,profile]of Object.entries(C.WorldEvolution.RULES.vehicles)){
  const g=fresh();vehicle(g,kind);enter(g);const v=g.expeditions.car();v.health=profile.health-10;g.player.carry.scrap=12;const fuel=v.fuel,depot=g.resources.scrap;
  assert.ok(g.fieldSupplies.begin('repair').ok,kind);ticks(g,6,true);assert.equal(v.health,profile.health,kind);assert.equal(g.player.carry.scrap,0);assert.equal(g.resources.scrap,depot);assert.equal(v.fuel,fuel);assert.equal(g.fieldSupplies.begin('repair').ok,false);
  g.player.health=g.player.maxHealth-10;g.player.carry.medicine=2;const meds=g.resources.medicine;assert.ok(g.fieldSupplies.begin('heal').ok);ticks(g,4,true);assert.equal(g.player.health,g.player.maxHealth);assert.equal(g.player.carry.medicine,0);assert.equal(g.resources.medicine,meds);
  g.expeditions.damage(profile.health);g.player.carry.scrap=12;assert.equal(g.fieldSupplies.begin('repair').ok,false);assert.equal(g.player.carry.scrap,12);
 }
});

test('QA03 G5 : siphon, réservoir, sac et coffre forment une réserve finie à 12 km',()=>{
 const g=fresh();vehicle(g);enter(g);farPose(g,{x:12000,y:12000});if(g.frontier.position().car&&!g.frontier.position().car.driving){const raw=g.serialize();raw.frontier.y+=2;g.restoreSave(raw);}const v=g.expeditions.car();v.fuel=3;empty(g);g.player.carry.wood=g.player.carryCapacity-1;
 const before=totals(g);assert.ok(g.travel131.begin('siphon').ok);ticks(g,5);assert.equal(v.fuel,2);assert.equal(g.player.carry.fuel,1);assert.deepEqual(totals(g),before);assert.equal(g.travel131.begin('siphon').ok,false);
 g.player.carry.wood=0;assert.ok(g.travel131.begin('siphon').ok);ticks(g,5);assert.equal(v.fuel,0);assert.equal(g.player.carry.fuel,3);assert.equal(g.travel131.begin('siphon').ok,false);
 v.cargo.fuel=25;const stock=totals(g);assert.ok(g.frontier.refuel());assert.equal(v.fuel,24);assert.equal(g.player.carry.fuel,0);assert.equal(v.cargo.fuel,4);assert.deepEqual(totals(g),stock);assert.equal(g.frontier.refuel(),false);
});

function farWreck(g){
 enter(g);const w=g.frontier.world();for(const p of w.pois.filter(p=>p.x>9000)){for(const v of p.parking.filter(v=>!['bike','skate'].includes(v.type))){for(const side of[-1,1]){
  const q=G.global(v,v.w/2,side<0?-.75:v.h+.75);if(w.blocked(q.x,q.y,.32,0,null)||!w.line(q,Survey.edge(q,v),0,null,v.id,.025))continue;
  const raw=g.serialize();Object.assign(raw.frontier,{x:q.x,y:q.y,z:0,inside:null,seen:[p.id]});raw.frontier.taken[v.id]=v.amount;g.restoreSave(raw);g.player.carry.scrap=1;if(g.travel131.preview('dismantle',v.id).ok)return v;
 }}}throw Error('Épave lointaine accessible requise');
}
test('QA03 G5 : épave lointaine épuisée après coûts, bruit et reprises sans regénération du coffre',()=>{
 const g=fresh(),v=farWreck(g),reserve=Travel.wreckReserve(g.world.seed,v.id),coffre=g.frontier.snapshot().taken[v.id];let recovered=0,jobs=0,pulses=0;
 const frontier=g.frontier;g.frontier={...frontier,signalAt:(...args)=>{pulses++;return frontier.signalAt(...args);}};
 while(g.travel131.wreckStatus(v.id).remaining){empty(g);g.player.carry.scrap=1;const left=g.travel131.wreckStatus(v.id).remaining;assert.ok(g.travel131.begin('dismantle',v.id).ok);ticks(g,7);const n=Math.min(left,6);assert.equal(g.player.carry.scrap,n);recovered+=n;jobs++;assert.equal(g.frontier.snapshot().taken[v.id],coffre);assert.ok(g.save(false));assert.ok(g.load());}
 assert.equal(recovered,reserve);assert.ok(jobs>=2);assert.ok(pulses>=jobs);assert.equal(g.travel131.preview('dismantle',v.id).ok,false);assert.equal(g.travel131.wreckStatus(v.id).remaining,0);assert.equal(g.travel131.wreckVisual(v.id).exhausted,true);
 const before=stable(g),bad=structuredClone(before);bad.expansions127.modules.exploration131.wrecks[0].recovered=reserve+1;assert.throws(()=>g.restoreSave(bad));assert.deepEqual(stable(g),before);
});

test('QA03 G5 : clic de carte lointaine, repère GPS et minimap partagent la pose sauvegardée',()=>{
 const {g,doc}=boot131({ui:true});assert.equal(g.travel131.fuelCost(100,.004),.4);assert.equal(g.travel131.fuelDistance(.4,.004),100);assert.doesNotThrow(()=>g.travel131.consumeDistance(10));g.phase='calm';g.phaseTime=9999;g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());
 const p=g.frontier.world().pois.find(p=>p.x>12000&&p.y>12000);known(g,[p.id]);farPose(g,{x:p.drive.b.x,y:p.drive.b.y});assert.ok(g.frontierUI.open());
 const atlas=g.frontierUI.atlas;atlas.focusPoint(p.x,p.y,250);const canvas=doc.getElementById('frontierMap'),camera=atlas.position(),screen=atlas.screen(p.x,p.y),rect=canvas.getBoundingClientRect(),event={pointerType:'mouse',clientX:screen.x*rect.width/camera.width,clientY:screen.y*rect.height/camera.height};
 canvas.dispatch('pointerdown',event);canvas.dispatch('pointerup',{...event,type:'pointerup'});assert.deepEqual(atlas.selected(),{kind:'poi',id:p.id});doc.getElementById('atlasPin').click();assert.equal(g.frontier.snapshot().pin,p.id);
 g.showCommand(false);const pose=g.frontier.position(),before=stable(g);g.mctx=require('./helpers/navigation130.cjs').trace();const mini=g.renderMinimap();assert.deepEqual(mini.position,{x:pose.x,y:pose.y});assert.equal(mini.destination,p.id);assert.deepEqual(g.frontier.guidance().path[0],{x:pose.x,y:pose.y});assert.deepEqual(stable(g),before);
 assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.frontier.snapshot().pin,p.id);assert.deepEqual(g.frontier.position(),pose);
});

test('QA03 G5 : retour régional puis local partage les derniers mètres révisés et ses détours',()=>{
 const g=fresh(),v=vehicle(g,'truck');service(g);enter(g);g.travel131.consumeDistance(1990,v.id);const gate=g.returnRoutes.verify('car').gates.find(q=>q.path);assert.ok(gate);assert.ok(g.returnRoutes.select(gate.id));const b=g.returnRoutes.budget(),rate=g.worldEvolution.vehicleProfile().fuel,localRate=.003*32*(rate/.004),discount=.2;
 const cost=(regional,local)=>rate*(regional-Math.min(regional,10)*discount)+localRate*(local-Math.min(local,Math.max(0,10-regional))*discount);
 close(b.regionFuel+b.localFuel,cost(b.regionMetres,b.localMetres));close(b.required,cost(b.regionMetres*1.25,b.localMetres*1.25)+2);assert.equal(g.travel131.snapshot().tuning.remaining,10);
 const before=stable(g);g.returnRoutes.budget();g.returnRoutes.snapshot();assert.deepEqual(stable(g),before);
});

test('QA03 G5 : trajet nul au dépôt fournit un budget fini et aucune dépense',()=>{
 const g=fresh();standAt(g,g.player,g.core());const before=stable(g),direct=require('../src/return-routes.js').createSearch(g,'foot').find(g.player);assert.equal(direct.units,0);assert.equal(direct.metres,0);g.returnRoutes.verify('foot');assert.ok(g.returnRoutes.select('east'));const b=g.returnRoutes.budget();for(const k of['regionMetres','localMetres','localFuel','regionFuel','required','shortfall'])assert.equal(b[k],0,k);assert.deepEqual(stable(g),before);
});
