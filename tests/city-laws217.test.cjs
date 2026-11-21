'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),L=require('../src/city-laws217.js'),W=require('../src/city-water215.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.CityLaws217Rules,WR=C.CityWater215Rules,T=b=>globalThis.DeadwallTactics.footprint(b);
const none=()=>({version:1,active:false,halfRations:{on:false,wait:0},waterRation:{on:false,wait:0},clearingDuty:{on:false,wait:0},dutyLeft:0,dutyResume:null,dutyServed:0});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-9,(message||'')+' : '+a+' ≠ '+b);

test('lois de cité : règles gelées dans le cœur, âge de départ et plafond par âge',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.caps)&&Object.isFrozen(R.halfRations)&&Object.isFrozen(R.waterRation)&&Object.isFrozen(R.clearingDuty));
  assert.equal(C.CITY_TIERS[R.startAge].name,'GRANDE MÉTROPOLE');assert.equal(R.startAge,7);
  assert.ok(R.delaySeconds>=30&&R.halfRations.foodFactor>0&&R.halfRations.foodFactor<1&&R.waterRation.waterFactor>0&&R.waterRation.waterFactor<1);
  assert.ok(R.halfRations.moraleDrain>.08&&R.waterRation.moraleDrain>.08,'le prix dépasse le regain ordinaire du moral : la baisse est nette');
  assert.ok(R.clearingDuty.seconds>0&&R.clearingDuty.speed>1);
  for(let age=0;age<R.startAge;age++)assert.equal(L.cap(age),0);
  assert.deepEqual([7,8,9,10,11,40].map(L.cap),[1,2,2,3,3,3]);
  for(let i=1;i<R.caps.length;i++)assert.ok(R.caps[i]>=R.caps[i-1]);assert.ok(R.caps.at(-1)<=L.IDS.length);
  assert.throws(()=>L.cap(-1));assert.throws(()=>L.cap(7.5));
  assert.deepEqual(L.IDS,['halfRations','waterRation','clearingDuty']);
});

test('lois de cité : état validé strictement, absent des anciennes sauvegardes = inactif',()=>{
  assert.deepEqual(L.validate(undefined),none());assert.deepEqual(L.initial(),none());
  const ok={...none(),active:true,halfRations:{on:true,wait:12.5},waterRation:{on:false,wait:R.delaySeconds},clearingDuty:{on:true,wait:0},dutyLeft:4,dutyResume:'auto',dutyServed:9};
  assert.deepEqual(L.validate(ok),ok);assert.notEqual(L.validate(ok).halfRations,ok.halfRations);
  assert.deepEqual(L.validate({...none(),active:true}),{...none(),active:true});
  assert.equal(L.engaged(ok),2,'une abrogation décidée libère la place, une promulgation en attente la prend');
  for(const bad of [null,[],'lois',{},{...ok,version:2},{...ok,active:1},{...ok,extra:1},(({dutyServed,...rest})=>rest)(ok),
    {...ok,halfRations:null},{...ok,halfRations:{on:true}},{...ok,halfRations:{on:true,wait:0,extra:1}},{...ok,halfRations:{on:'oui',wait:0}},{...ok,halfRations:{on:true,wait:-1}},
    {...ok,halfRations:{on:true,wait:R.delaySeconds+1}},{...ok,waterRation:{on:false,wait:NaN}},{...ok,clearingDuty:[]},
    {...ok,dutyLeft:-1},{...ok,dutyLeft:R.clearingDuty.seconds+1},{...ok,dutyLeft:'4'},{...ok,dutyResume:'retreat'},{...ok,dutyResume:null},{...ok,dutyLeft:0},
    {...ok,clearingDuty:{on:false,wait:0}},{...ok,dutyServed:1.5},{...ok,dutyServed:-1},{...ok,dutyServed:1e7},
    {...ok,active:false},{...none(),halfRations:{on:true,wait:0}},{...none(),waterRation:{on:false,wait:3}},{...none(),dutyServed:2}])assert.throws(()=>L.validate(bad),/Lois de cité/);
});

test('lois de cité : la part rendue ne dépasse jamais ce qui vient d’être consommé',()=>{
  near(L.spared(100,50,.25),50*R.foodPerPersonSecond*.25*(1-R.halfRations.foodFactor));
  near(L.spared(.01,50,.25),.01*(1-R.halfRations.foodFactor),'stock plus petit que la ration');
  for(const [before,people,dt] of [[0,50,.25],[-3,50,.25],[100,0,.25],[100,50,0],[100,50,-1],[NaN,50,.25],[100,Infinity,.25]])assert.equal(L.spared(before,people,dt),0);
  for(const before of [.001,.5,3,500])assert.ok(L.spared(before,80,1)<=Math.min(before,80*R.foodPerPersonSecond));
});

function campaign(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();return g;}
const toAge=(g,age)=>{const data=g.serialize();data.urban.peakScore=Math.max(data.urban.peakScore,C.CITY_TIERS[age].requiredScore);data.urban.progression151={version:1,age};assert.equal(g.restoreSave(data),true);g.refreshMetrics(true);assert.equal(g.tier.id,age);};
const step=(g,seconds,dt=.25)=>{for(let t=0;t<seconds-1e-9;t+=dt)g.economyTick(dt);};
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const mine=notes=>notes.filter(t=>/^(Loi décidée|Abrogation décidée|Corvée de déblaiement|Demi-rations|Rationnement de l’eau|Lois de cité)/.test(t));
const count=(notes,start)=>notes.filter(t=>t.startsWith(start)).length;
const laws=g=>g.serialize().expansions127.modules.cityLaws217;
const row=(g,label)=>g.cityLaws217.overview().rows.find(r=>r.label===label).value;
function cistern(g,water){
  const core=g.core(),B=core.constructor,b=new B(g.nextId++,'fireCistern',T(core).x+8,T(core).y,0,1);b.health=b.def.health;g.world.add(b);g.refreshMetrics(true);
  g.siege.snapshot();const data=g.serialize();data.siege.tanks.find(t=>t.id===b.id).water=water;assert.equal(g.restoreSave(data),true);
}
// Une grande métropole prête à légiférer, Commandant au dépôt.
function metropolis(age=R.startAge,water){const g=campaign();if(water!==undefined)cistern(g,water);toAge(g,age);g.resources.food=300;return g;}
const enact=(g,id)=>{const result=g.cityLaws217.change(id);assert.deepEqual(result,{ok:true},id+' : '+result.reason);};
const inForce=(g,id)=>{enact(g,id);step(g,R.delaySeconds);assert.equal(g.cityLaws217.inForce(id),true);};

test('lois de cité : rien avant la Grande métropole, la fiche annonce seulement leur venue',()=>{
  const g=campaign(),notes=watch(g);
  assert.equal(g.cityLaws217.active(),true);assert.equal(g.cityLaws217.open(),false);assert.equal(g.cityLaws217.cap(),0);
  assert.match(g.cityLaws217.overview().summary,/viendront à l’âge Grande métropole/);assert.deepEqual(g.cityLaws217.actions(),[]);
  for(const id of L.IDS){const q=g.cityLaws217.change(id);assert.equal(q.ok,false);assert.match(q.reason,/viendront/);}
  toAge(g,R.startAge-1);assert.equal(g.cityLaws217.open(),false);assert.deepEqual(g.cityLaws217.actions(),[]);
  const food=g.resources.food=300,morale=g.morale=80,people=g.population;
  g.economyTick(.25);
  near(food-g.resources.food,people*R.foodPerPersonSecond*.25,'ration entière, et miroir exact de la ration du moteur');
  near(g.morale,morale+.25*.08);
  g.phase='aftermath';step(g,5);assert.equal(g.workerOrder,'auto');
  assert.deepEqual(laws(g),{...none(),active:true});assert.equal(mine(notes).length,0);
});

test('lois de cité : demi-rations, effet et prix exacts, aucune nourriture créée',()=>{
  const g=metropolis(),notes=watch(g),people=g.population,use=people*R.foodPerPersonSecond;
  assert.equal(g.cityLaws217.open(),true);assert.equal(g.cityLaws217.cap(),1);
  assert.deepEqual(g.cityLaws217.actions().map(a=>a.id),['enact-halfRations','enact-waterRation','enact-clearingDuty']);
  assert.equal(row(g,'Demi-rations').startsWith('Abrogée — Effet : nourriture consommée −50 %'),true);assert.match(row(g,'Demi-rations'),/Prix : moral −7,2 par minute/);
  enact(g,'halfRations');
  assert.equal(count(notes,'Loi décidée : Demi-rations'),1);assert.match(row(g,'Demi-rations'),/^En attente · en vigueur dans 01:00/);
  assert.match(g.cityLaws217.change('halfRations').reason,/déjà décidé/);
  let food=g.resources.food;step(g,R.delaySeconds-1);
  assert.equal(g.cityLaws217.inForce('halfRations'),false,'délai respecté');near(food-g.resources.food,use*(R.delaySeconds-1),'ration entière pendant le délai');
  step(g,1);assert.equal(g.cityLaws217.inForce('halfRations'),true);assert.equal(count(notes,'Demi-rations en vigueur'),1);
  assert.match(row(g,'Demi-rations'),/^En vigueur — /);assert.equal(g.cityLaws217.actions()[0].id,'repeal-halfRations');
  food=g.resources.food;const morale=g.morale=80;
  g.economyTick(.25);near(food-g.resources.food,use*.25*R.halfRations.foodFactor,'consommation réduite du facteur prévu');
  near(g.morale,morale+.25*(.08-R.halfRations.moraleDrain),'le moral baisse du taux prévu, cité nourrie');
  step(g,19.75);near(g.morale,morale+20*(.08-R.halfRations.moraleDrain));assert.ok(g.morale<morale);
  // Bilan : à chaque pas, le stock ne monte jamais, plein, presque vide ou vide.
  for(const start of [g.storage,g.storage-.001,use*.25*.6,.004,0]){
    g.resources.food=start;g.economyTick(.25);
    assert.ok(g.resources.food<=start+1e-12,'aucune nourriture créée depuis '+start);assert.ok(g.resources.food<=g.storage&&g.resources.food>=0);
    assert.ok(start-g.resources.food>=Math.min(start,use*.25)*R.halfRations.foodFactor-1e-12,'au moins la demi-ration est consommée');
  }
  g.resources.food=0;g.morale=50;g.economyTick(1);near(g.morale,50-.7-R.halfRations.moraleDrain,'la famine garde son propre prix');
  // Abrogation : même délai, puis ration entière et moral libéré.
  g.resources.food=300;enact(g,'halfRations');assert.equal(count(notes,'Abrogation décidée : Demi-rations'),1);assert.match(row(g,'Demi-rations'),/^En vigueur · abrogation dans 01:00/);
  step(g,R.delaySeconds);assert.equal(g.cityLaws217.inForce('halfRations'),false);assert.equal(count(notes,'Demi-rations abrogée'),1);
  food=g.resources.food;g.morale=80;g.economyTick(.25);near(food-g.resources.food,use*.25);near(g.morale,80+.25*.08);
  assert.equal(mine(notes).length,4,'une annonce par décision et une par changement');
});

test('lois de cité : rationnement de l’eau, puisage réduit, prix exact, aucune eau créée',()=>{
  const g=metropolis(R.startAge,110),notes=watch(g),rate=W.demand(g.population,g.tier.id);
  assert.ok(rate>0);assert.equal(g.cityLaws217.waterFactor(),1);
  let water=g.siege.cityReserve215().water;g.economyTick(.25);near(water-g.siege.cityReserve215().water,rate*.25,'puisage entier sans loi');
  assert.match(row(g,'Rationnement de l’eau'),/eau puisée par la population −30 %.*Prix : moral −6 par minute/);
  inForce(g,'waterRation');assert.equal(g.cityLaws217.waterFactor(),R.waterRation.waterFactor);assert.equal(count(notes,'Rationnement de l’eau en vigueur'),1);
  water=g.siege.cityReserve215().water;const food=g.resources.food,morale=g.morale=80;
  g.economyTick(.25);
  near(water-g.siege.cityReserve215().water,rate*.25*R.waterRation.waterFactor,'puisage réduit du facteur prévu');
  near(food-g.resources.food,g.population*R.foodPerPersonSecond*.25,'la ration de nourriture n’est pas touchée');
  near(g.morale,morale+.25*(.08-R.waterRation.moraleDrain),'le moral baisse du taux prévu');
  assert.equal(g.cityWater215.stage(),0,'une cité servie à ration réduite n’est pas en pénurie');
  assert.match(g.cityWater215.overview().rows.find(r=>r.label==='Besoin de la population').value,/eau rationnée par la loi/);
  let last=g.siege.cityReserve215().water;
  for(let i=0;i<400;i++){g.economyTick(.25);const now=g.siege.cityReserve215().water;assert.ok(now<=last,'aucune eau créée');last=now;}
  near(water-last,rate*R.waterRation.waterFactor*100.25,'bilan sur cent secondes');assert.ok(last>0);
  // Citernes vides : la pénurie ordinaire reprend ses droits, la loi ne crée rien.
  const empty=g.serialize();for(const tank of empty.siege.tanks)tank.water=0;assert.equal(g.restoreSave(empty),true);g.resources.food=300;
  step(g,5);assert.equal(g.siege.cityReserve215().water,0);assert.equal(g.cityWater215.stage(),1);
});

test('lois de cité : sans eau de cité suivie, le rationnement de l’eau est refusé',()=>{
  const g=metropolis(),old=g.serialize();delete old.expansions127.modules.cityWater215;
  assert.equal(g.restoreSave(old),true);assert.equal(g.cityWater215.active(),false);assert.equal(g.cityLaws217.active(),true);
  const q=g.cityLaws217.change('waterRation');assert.equal(q.ok,false);assert.match(q.reason,/rien à rationner/);
  assert.match(row(g,'Rationnement de l’eau'),/sans objet/);assert.equal(g.cityLaws217.waterFactor(),1);
});

test('lois de cité : aucun changement de l’alerte à la fin de l’assaut, délai suspendu',()=>{
  const g=metropolis(),notes=watch(g);
  for(const phase of ['warning','assault']){
    g.phase=phase;const q=g.cityLaws217.change('halfRations');assert.equal(q.ok,false);assert.match(q.reason,/assaut/);
    assert.equal(g.cityLaws217.actions()[0].disabled,true);
  }
  assert.deepEqual(laws(g),{...none(),active:true});assert.equal(notes.length,0);
  g.phase='calm';enact(g,'halfRations');step(g,R.delaySeconds-20);near(laws(g).halfRations.wait,20);
  const use=g.population*R.foodPerPersonSecond;
  for(const phase of ['warning','assault']){
    g.phase=phase;const food=g.resources.food;step(g,R.delaySeconds*2);
    assert.equal(g.cityLaws217.inForce('halfRations'),false,'jamais en vigueur pendant '+phase);near(laws(g).halfRations.wait,20,'délai suspendu');
    near(food-g.resources.food,use*R.delaySeconds*2,'ration entière');assert.match(row(g,'Demi-rations'),/délai suspendu pendant l’assaut/);
  }
  assert.equal(count(notes,'Demi-rations en vigueur'),0);
  g.phase='aftermath';step(g,19);assert.equal(g.cityLaws217.inForce('halfRations'),false);
  step(g,1);assert.equal(g.cityLaws217.inForce('halfRations'),true,'le délai reprend après l’assaut');assert.equal(count(notes,'Demi-rations en vigueur'),1);
  // Une abrogation décidée avant l'alerte attend de même.
  g.phase='calm';enact(g,'halfRations');g.phase='assault';step(g,R.delaySeconds*2);assert.equal(g.cityLaws217.inForce('halfRations'),true);
  g.phase='calm';step(g,R.delaySeconds);assert.equal(g.cityLaws217.inForce('halfRations'),false);
});

test('lois de cité : décision au dépôt seulement',()=>{
  const g=metropolis(),core=g.core(),x=g.player.x,y=g.player.y;
  g.player.x=core.x+C.TILE*40;g.player.y=core.y+C.TILE*40;
  const far=g.cityLaws217.change('halfRations');assert.equal(far.ok,false);assert.match(far.reason,/dépôt/);
  g.player.x=x;g.player.y=y;g.player.reload=1;assert.match(g.cityLaws217.change('halfRations').reason,/dépôt/);
  g.player.reload=0;g.paused=true;assert.equal(g.cityLaws217.change('halfRations').ok,false);
  g.paused=false;assert.deepEqual(laws(g),{...none(),active:true});
  assert.match(g.cityLaws217.change('inconnue').reason,/inconnue/);enact(g,'halfRations');
});

test('lois de cité : le nombre de lois engagées suit l’âge',()=>{
  const g=metropolis(R.startAge,110);
  enact(g,'halfRations');assert.equal(g.cityLaws217.engaged(),1);
  const second=g.cityLaws217.change('clearingDuty');assert.equal(second.ok,false);assert.match(second.reason,/ne tient que 1 loi à la fois/);
  assert.match(row(g,'Lois engagées'),/^1 \/ 1/);
  step(g,R.delaySeconds);assert.equal(g.cityLaws217.change('waterRation').ok,false,'plafond tenu une fois la loi en vigueur');
  // Abroger libère la place aussitôt décidé ; les deux lois ne sont jamais en vigueur ensemble.
  enact(g,'halfRations');assert.equal(g.cityLaws217.engaged(),0);step(g,10);enact(g,'waterRation');
  for(let t=0;t<R.delaySeconds+10;t+=.25){g.economyTick(.25);assert.ok(L.IDS.filter(id=>g.cityLaws217.inForce(id)).length<=1);}
  assert.equal(g.cityLaws217.inForce('waterRation'),true);assert.equal(g.cityLaws217.inForce('halfRations'),false);
  toAge(g,R.startAge+1);assert.equal(g.cityLaws217.cap(),2);assert.equal(g.cityLaws217.inForce('waterRation'),true,'les lois survivent au changement d’âge');
  enact(g,'halfRations');const third=g.cityLaws217.change('clearingDuty');assert.equal(third.ok,false);assert.match(third.reason,/ne tient que 2 lois à la fois/);
  toAge(g,R.startAge+3);assert.equal(g.cityLaws217.cap(),3);enact(g,'clearingDuty');assert.equal(g.cityLaws217.engaged(),3);
  step(g,R.delaySeconds);assert.deepEqual(L.IDS.map(id=>g.cityLaws217.inForce(id)),[true,true,true]);
  // Deux prix de moral s'additionnent.
  g.resources.food=300;g.morale=80;g.economyTick(1);near(g.morale,80+.08-R.halfRations.moraleDrain-R.waterRation.moraleDrain);
});

test('lois de cité : sauvegarde et reprise au milieu d’un délai, sans annonce rejouée',()=>{
  const g=metropolis(),notes=watch(g);
  enact(g,'halfRations');step(g,20);
  const saved=JSON.parse(JSON.stringify(g.serialize()));near(saved.expansions127.modules.cityLaws217.halfRations.wait,R.delaySeconds-20);
  assert.equal(saved.expansions127.modules.cityLaws217.halfRations.on,false);
  assert.doesNotThrow(()=>require('../src/save.js').validate(JSON.parse(JSON.stringify(saved))));
  const before=notes.length;assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);g.resources.food=300;
  assert.deepEqual(laws(g),saved.expansions127.modules.cityLaws217);
  step(g,R.delaySeconds-21);assert.equal(notes.length,before,'la reprise ne répète rien');assert.equal(g.cityLaws217.inForce('halfRations'),false);
  step(g,1);assert.equal(g.cityLaws217.inForce('halfRations'),true,'le délai reprend où il en était');assert.equal(count(notes,'Demi-rations en vigueur'),1);
  const live=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(live),true);g.resources.food=300;
  assert.equal(g.cityLaws217.inForce('halfRations'),true);step(g,5);assert.equal(count(notes,'Demi-rations en vigueur'),1);assert.equal(notes.length,before+1);
  // Un état corrompu est refusé avant toute modification de la partie.
  const broken=JSON.parse(JSON.stringify(live));broken.expansions127.modules.cityLaws217.halfRations.wait=-5;
  assert.throws(()=>g.restoreSave(broken),/Lois de cité/);assert.equal(g.cityLaws217.inForce('halfRations'),true);
});

test('lois de cité : une ancienne campagne reste inchangée jusqu’à son activation volontaire',()=>{
  const g=metropolis(),old=g.serialize();delete old.expansions127.modules.cityLaws217;
  assert.equal(g.restoreSave(old),true);g.resources.food=300;const notes=watch(g);
  assert.equal(g.cityLaws217.active(),false);assert.equal(g.cityLaws217.open(),false);assert.deepEqual(laws(g),none());
  assert.match(g.cityLaws217.overview().summary,/ne suit pas les lois/);
  for(const id of L.IDS)assert.match(g.cityLaws217.change(id).reason,/ne suit pas/);
  const food=g.resources.food,people=g.population;g.morale=80;g.phase='aftermath';step(g,10);g.phase='calm';
  near(food-g.resources.food,people*R.foodPerPersonSecond*10,'ration entière');near(g.morale,80+10*.08);assert.equal(g.workerOrder,'auto');assert.equal(mine(notes).length,0);
  const actions=g.cityLaws217.actions();assert.deepEqual(actions.map(a=>a.id),['activate']);assert.equal(actions[0].disabled,false);
  g.phase='calm';assert.deepEqual(actions[0].run(),{ok:true});
  assert.equal(g.cityLaws217.active(),true);assert.equal(g.cityLaws217.actions().length,3);assert.equal(count(notes,'Lois de cité suivies'),1);
  assert.match(g.cityLaws217.activate().reason,/déjà suivies/);assert.deepEqual(laws(g),{...none(),active:true});
});

// Un mur chargé de corps et un ouvrier à portée de pelle.
function wallWithWorker(g){
  const type=Object.values(C.BUILDINGS).find(d=>d.wall&&!d.gate).id,core=g.core(),B=core.constructor;
  const wall=new B(g.nextId++,type,T(core).x+10,T(core).y,0,1);wall.health=wall.def.health;g.world.add(wall);g.refreshMetrics(true);
  const worker=g.units.find(u=>u.kind==='worker'),point=g.workerCleanupPoint(worker,wall);worker.x=point.x;worker.y=point.y;
  assert.ok(wall.completed&&g.workerCanWorkAt(worker,point,C.WORKER_RULES.cleanupRange));return {wall,worker};
}

test('lois de cité : corvée de déblaiement, ordre imposé après l’assaut, cadence et prix exacts',()=>{
  const g=metropolis(),D=R.clearingDuty;inForce(g,'clearingDuty');const notes=watch(g),{wall,worker}=wallWithWorker(g);
  assert.match(row(g,'Corvée de déblaiement'),/^En vigueur — Effet : après chaque assaut repoussé, les ouvriers déblaient les murs 00:30, cadence ×1,5\. Prix : ni récolte ni chantier/);
  wall.corpseLoad=20;near(g.clearCorpsesWithWorker(worker,wall,1),C.WORKER_RULES.cleanupPerSecond,'cadence ordinaire hors corvée');
  step(g,5);assert.equal(g.workerOrder,'auto','aucune corvée en temps calme');
  g.wave=3;g.phase='aftermath';g.economyTick(.25);
  assert.equal(g.workerOrder,'clear','l’ordre existant est imposé : les ouvriers ne récoltent ni ne bâtissent');assert.equal(g.cityLaws217.duty(),D.seconds);
  assert.equal(count(notes,'Corvée de déblaiement : les ouvriers dégagent'),1);
  assert.deepEqual([laws(g).dutyResume,laws(g).dutyServed],['auto',3]);
  wall.corpseLoad=20;near(g.clearCorpsesWithWorker(worker,wall,1),C.WORKER_RULES.cleanupPerSecond*D.speed,'cadence de corvée');near(wall.corpseLoad,20-C.WORKER_RULES.cleanupPerSecond*D.speed);
  wall.corpseLoad=.5;near(g.clearCorpsesWithWorker(worker,wall,1),.5,'jamais plus que les corps présents');assert.equal(wall.corpseLoad,0);
  // Reprise au milieu de la corvée : elle continue, sans annonce rejouée.
  step(g,10);const saved=JSON.parse(JSON.stringify(g.serialize()));near(saved.expansions127.modules.cityLaws217.dutyLeft,D.seconds-10);
  assert.equal(g.restoreSave(saved),true);g.resources.food=300;assert.equal(g.workerOrder,'clear');near(g.cityLaws217.duty(),D.seconds-10);
  g.phase='calm';step(g,D.seconds-11);assert.equal(g.workerOrder,'clear');
  step(g,1);assert.equal(g.workerOrder,'auto','l’ordre antérieur est rendu');assert.equal(g.cityLaws217.duty(),0);
  g.phase='aftermath';step(g,3);assert.equal(g.workerOrder,'auto','une seule corvée par assaut');assert.equal(count(notes,'Corvée de déblaiement : les ouvriers dégagent'),1);
  const calm=g.units.find(u=>u.kind==='worker');wall.corpseLoad=20;near(g.clearCorpsesWithWorker(calm,wall,1),C.WORKER_RULES.cleanupPerSecond,'cadence ordinaire après la corvée');
  // Nuit suivante : un ordre contraire du Commandant lève la corvée ; un nouvel assaut aussi.
  g.wave=4;g.setWorkerOrder('harvest');g.economyTick(.25);assert.equal(g.workerOrder,'clear');assert.equal(laws(g).dutyResume,'harvest');
  assert.equal(g.setWorkerOrder('build'),true);g.economyTick(.25);assert.equal(g.cityLaws217.duty(),0);assert.equal(g.workerOrder,'build','l’ordre du Commandant prime');
  g.wave=5;g.economyTick(.25);assert.equal(g.workerOrder,'clear');g.phase='warning';g.economyTick(.25);
  assert.equal(g.cityLaws217.duty(),0);assert.equal(g.workerOrder,'build','l’alerte rend les ouvriers à leur ordre');
  // Un repli général en cours est respecté.
  g.phase='aftermath';g.wave=6;g.setWorkerOrder('retreat');step(g,3);assert.equal(g.workerOrder,'retreat');assert.equal(g.cityLaws217.duty(),0);assert.equal(laws(g).dutyServed,5);
  // Abroger pendant une corvée la termine à l'entrée en vigueur de l'abrogation.
  g.setWorkerOrder('auto');g.economyTick(.25);assert.equal(g.workerOrder,'clear');assert.equal(laws(g).dutyServed,6);
  g.phase='calm';enact(g,'clearingDuty');g.wave=7;step(g,D.seconds);assert.equal(g.workerOrder,'auto');
  step(g,R.delaySeconds-D.seconds);assert.equal(g.cityLaws217.inForce('clearingDuty'),false);
  g.phase='aftermath';g.wave=8;step(g,3);assert.equal(g.workerOrder,'auto','loi abrogée : plus de corvée');
});

test('lois de cité : le module ne tire aucun hasard et ne touche qu’à la nourriture rendue',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/city-laws217.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','.random(','localStorage','Date.now','water+=','.water =','corpseLoad'])assert.equal(source.includes(forbidden),false,forbidden);
  assert.deepEqual(source.match(/resources\.\w+/g).filter(x=>x!=='resources.food'),[],'aucune autre ressource');
  assert.equal(source.match(/resources\.food\+=/g).length,1,'un seul point de restitution');
  for(const file of ['index.html','sw.js'])assert.ok(fs.readFileSync(path.join(__dirname,'..',file),'utf8').includes('src/city-laws217.js'),file);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.includes('<script src="src/city-water215.js"></script>\n<script src="src/city-laws217.js"></script>'),'chargé juste après l’eau de cité');
});
