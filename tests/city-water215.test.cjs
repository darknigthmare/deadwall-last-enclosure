'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),W=require('../src/city-water215.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.CityWater215Rules,F=globalThis.DeadwallSiege,Save=require('../src/save.js');

test('eau de cité : règles dans le cœur, besoin nul avant l’âge de départ',()=>{
  assert.ok(Object.isFrozen(R));assert.equal(C.CITY_TIERS[R.startAge].name,'VILLE');
  assert.ok(R.perPersonSecond>0&&R.graceSeconds>0&&R.moraleDrain>0);
  for(let age=0;age<R.startAge;age++)assert.equal(W.demand(60,age),0);
  assert.equal(W.demand(50,R.startAge),50*R.perPersonSecond);assert.equal(W.demand(0,10),0);
  assert.throws(()=>W.demand(-1,4));assert.throws(()=>W.demand(10,1.5));
  assert.equal(W.stage(0),0);assert.equal(W.stage(1),1);assert.equal(W.stage(R.graceSeconds-.01),1);assert.equal(W.stage(R.graceSeconds),2);
});

test('eau de cité : trois temps ordonnés, lents, chacun précédé de son annonce',()=>{
  assert.ok(R.graceSeconds<R.departWarnSeconds&&R.departWarnSeconds<R.departSeconds&&R.departSeconds<R.deathWarnSeconds&&R.deathWarnSeconds<R.deathSeconds);
  assert.ok(R.departSeconds>=300&&R.departSeconds-R.departWarnSeconds>=60,'départs après plusieurs minutes, annoncés au moins une minute avant');
  assert.ok(R.deathSeconds>=2*R.departSeconds&&R.deathSeconds-R.deathWarnSeconds>=60,'morts bien après, annoncées au moins une minute avant');
  assert.ok(R.departInterval>=60&&R.deathInterval>=60);
  assert.deepEqual([R.departWarnSeconds-.01,R.departWarnSeconds,R.departSeconds,R.deathWarnSeconds,R.deathSeconds].map(W.stage),[2,3,4,5,6]);
  assert.equal(W.departSlots(R.departSeconds-.01),0);assert.equal(W.departSlots(R.departSeconds),1);assert.equal(W.departSlots(R.departSeconds+R.departInterval),2);
  assert.equal(W.departSlots(1e9),W.departSlots(R.deathSeconds),'les départs cessent quand les morts commencent');
  assert.equal(W.deathSlots(R.deathSeconds-.01),0);assert.equal(W.deathSlots(R.deathSeconds),1);assert.equal(W.deathSlots(R.deathSeconds+R.deathInterval),2);
});

test('eau de cité : état validé strictement, absent des anciennes sauvegardes = inactif',()=>{
  const none={version:2,active:false,dry:0,departs:0,deaths:0,left:0,died:0},ok={version:2,active:true,dry:12.5,departs:0,deaths:0,left:3,died:1};
  assert.deepEqual(W.validate(undefined),none);assert.deepEqual(W.validate(ok),ok);
  const late={...ok,dry:R.deathSeconds+1,departs:W.departSlots(R.deathSeconds),deaths:1};assert.deepEqual(W.validate(late),late);
  for(const bad of [null,[],{version:1,active:true,dry:0,extra:1},{version:1,active:true},{...ok,version:3},{...ok,active:'oui'},{...ok,dry:-1},{...ok,dry:Infinity},{version:2,active:true,dry:0},{...ok,extra:1},
    {...ok,departs:1},{...ok,deaths:1},{...ok,dry:R.departSeconds,departs:2},{...ok,left:-1},{...ok,died:1.5},{...ok,left:'2'},{...none,left:1},{...none,dry:5}])assert.throws(()=>W.validate(bad),/Eau de cité/);
});

test('eau de cité : le puisage conserve l’eau, citerne après citerne, sans jamais en créer',()=>{
  const engine=new F.Engine({...F.create(),tanks:[{id:5,water:30},{id:9,water:12}]});
  const used=engine.state.stats.waterUsed;
  assert.equal(engine.cityWater(10),10);assert.deepEqual(engine.state.tanks.map(t=>t.water),[20,12]);
  assert.equal(engine.cityWater(25),25);assert.deepEqual(engine.state.tanks.map(t=>t.water),[0,7]);
  assert.equal(engine.cityWater(50),7,'on ne tire que ce qui reste');assert.deepEqual(engine.state.tanks.map(t=>t.water),[0,0]);
  assert.equal(engine.cityWater(5),0);assert.equal(engine.state.stats.waterUsed,used+42);
  for(const bad of [0,-3,NaN,Infinity,'4'])assert.equal(engine.cityWater(bad),0);
});

function campaign(){const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();return {g,doc};}
function cistern(g,water){
  const core=g.core(),B=core.constructor,b=new B(g.nextId++,'fireCistern',T(core).x+8,T(core).y,0,1);b.health=b.def.health;g.world.add(b);g.refreshMetrics(true);
  g.siege.snapshot();const data=g.serialize();const tank=data.siege.tanks.find(t=>t.id===b.id);assert.ok(tank,'citerne reconnue par son propriétaire');tank.water=water;
  assert.equal(g.restoreSave(data),true);return b.id;
}
const T=b=>globalThis.DeadwallTactics.footprint(b);
// L’âge ne redescend jamais : une campagne arrivée à la Ville le porte dans sa sauvegarde.
const toAge=(g,age)=>{const data=g.serialize();data.urban.peakScore=Math.max(data.urban.peakScore,C.CITY_TIERS[age].requiredScore);data.urban.progression151={version:1,age};assert.equal(g.restoreSave(data),true);g.refreshMetrics(true);assert.equal(g.tier.id,age);};
const step=(g,seconds,dt=.25)=>{for(let t=0;t<seconds-1e-9;t+=dt)g.economyTick(dt);};

test('eau de cité : une nouvelle campagne la suit, sans rien consommer avant la Ville',()=>{
  const {g}=campaign();
  assert.equal(g.cityWater215.active(),true);assert.equal(g.cityWater215.needed(),false);
  cistern(g,80);const morale=g.morale;
  step(g,30);assert.equal(g.siege.cityReserve215().water,80,'aucun puisage au Refuge');assert.equal(g.cityWater215.stage(),0);assert.equal(g.morale,morale);
  assert.match(g.cityWater215.overview().summary,/encore assez petite/);
});

test('eau de cité : à la Ville, la population puise dans les citernes puis subit la pénurie',()=>{
  const {g}=campaign();cistern(g,2);
  toAge(g,R.startAge);assert.equal(g.cityWater215.needed(),true);
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  const rate=W.demand(g.population,g.tier.id);assert.ok(rate>0);
  g.economyTick(.25);
  assert.ok(Math.abs(g.siege.cityReserve215().water-(2-rate*.25))<1e-9,'puisage exact');assert.equal(g.cityWater215.stage(),0);
  step(g,Math.ceil(2/rate)+2);
  assert.equal(g.siege.cityReserve215().water,0);assert.equal(g.cityWater215.stage(),1,'délai de grâce');
  assert.equal(notes.filter(t=>t.startsWith('Eau de cité : les citernes sont vides')).length,1);
  g.resources.food=500;step(g,R.graceSeconds);
  assert.equal(g.cityWater215.stage(),2);
  const before=g.morale=80;step(g,20);
  assert.ok(Math.abs(g.morale-(before+20*(.08-R.moraleDrain)))<1e-6,'le moral baisse du taux prévu, cité nourrie');
  assert.equal(notes.filter(t=>t.startsWith('Pénurie d’eau')).length,1,'annoncée une seule fois');
  const saved=g.serialize();assert.ok(saved.expansions127.modules.cityWater215.dry>R.graceSeconds);
  assert.equal(g.restoreSave(saved),true);assert.equal(g.cityWater215.stage(),2,'la pénurie survit à la reprise');
  step(g,5);assert.equal(notes.filter(t=>t.startsWith('Pénurie d’eau')).length,1,'la reprise ne la réannonce pas');
});

test('eau de cité : une ancienne campagne reste inchangée jusqu’à son activation volontaire',()=>{
  const {g}=campaign();cistern(g,60);
  const old=g.serialize();delete old.expansions127.modules.cityWater215;
  assert.equal(g.restoreSave(old),true);assert.equal(g.cityWater215.active(),false);
  toAge(g,R.startAge);assert.equal(g.cityWater215.active(),false);
  step(g,60);assert.equal(g.siege.cityReserve215().water,60,'aucun puisage sans activation');
  assert.equal(g.cityWater215.actions().length,1);
  const core=g.core();g.player.x=core.x;g.player.y=core.y+C.TILE*3;
  const result=g.cityWater215.activate();
  if(result.ok){assert.equal(g.cityWater215.active(),true);assert.equal(g.cityWater215.actions().length,0);step(g,10);assert.ok(g.siege.cityReserve215().water<60);}
  else assert.match(result.reason,/dépôt/);
});

// Une cité à la Ville, citerne vide, avec exactement les habitants demandés (nourris, pour isoler l'eau).
function dryCity(kinds){
  const {g}=campaign();cistern(g,0);toAge(g,R.startAge);
  const Unit=g.units[0].constructor,core=g.core();
  g.units=kinds.map((kind,i)=>new Unit(g.nextId++,kind,core.x+60+i*14,core.y+90));g.refreshMetrics(true);g.resources.food=1e5;
  const notes=[];watch(g,notes);return {g,notes};
}
const watch=(g,notes)=>{const notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};};
const count=(notes,start)=>notes.filter(t=>t.startsWith(start)).length;
const alive=g=>g.units.filter(u=>!u.dead&&u.health>0),kinds=g=>alive(g).map(u=>u.kind).sort().join(',');
const dry=g=>g.cityWater215.snapshot().dry,until=(g,seconds)=>step(g,seconds-dry(g),1);
// Sauvegarde et reprise : aucune référence à un habitant absent, aucune annonce rejouée.
function resume(g,notes){
  const before=notes.length,saved=g.serialize(),ids=new Set(saved.units.map(u=>u.id)),living=alive(g).map(u=>u.id);
  assert.deepEqual([...ids].sort(),[...living].sort(),'seuls les habitants présents sont sauvegardés');
  for(const id of [...saved.siege.crew.map(c=>c.id),...saved.infrastructure.crew.map(c=>c.id),...(saved.territories.withdrawing||[]),...Object.values(saved.territories.sectors).map(x=>x.workerId).filter(x=>x!==null),...saved.citadel.calls.map(c=>c.unitId).filter(x=>x!==null)])assert.ok(ids.has(id),'référence pendante '+id);
  assert.doesNotThrow(()=>Save.validate(JSON.parse(JSON.stringify(saved))));
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);g.resources.food=1e5;
  assert.deepEqual(alive(g).map(u=>u.id).sort(),living.sort());
  assert.deepEqual(g.cityWater215.snapshot(),saved.expansions127.modules.cityWater215);
  step(g,2,1);assert.equal(notes.length,before,'la reprise ne rejoue ni annonce, ni départ, ni mort');assert.deepEqual(alive(g).map(u=>u.id).sort(),living.sort());
}
const LEAVE='Pénurie d’eau : des habitants parlent de partir',LEFT='Pénurie d’eau : un ouvrier a quitté la cité',DOOM='Pénurie d’eau : les plus fragiles ne tiendront plus longtemps',DIED=/^Pénurie d’eau : un (\S+) est mort dans les murs/;

test('eau de cité : la pénurie fait partir des ouvriers, puis tue les plus fragiles, chaque temps annoncé une fois',()=>{
  const {g,notes}=dryCity(['worker','worker','worker','soldier','medic']);
  const soldier=g.units.find(u=>u.kind==='soldier');soldier.health=50;
  const lost=g.stats.unitsLost,health=g.player.health;
  until(g,R.departWarnSeconds-1);assert.equal(g.cityWater215.stage(),2);assert.equal(count(notes,LEAVE),0);assert.equal(alive(g).length,5);
  until(g,R.departWarnSeconds+1);assert.equal(g.cityWater215.stage(),3);assert.equal(count(notes,LEAVE),1,'départs annoncés avant d’arriver');
  assert.match(g.cityWater215.overview().rows.find(r=>r.label==='Ensuite').value,/Premier départ dans/);
  resume(g,notes);
  until(g,R.departSeconds-1);assert.equal(alive(g).length,5,'aucun départ avant l’échéance');assert.equal(count(notes,LEFT),0);
  until(g,R.departSeconds+1);assert.equal(kinds(g),'medic,soldier,worker,worker','un seul ouvrier part');assert.equal(count(notes,LEFT),1);
  assert.equal(g.stats.unitsLost,lost,'un départ n’est pas une perte au combat');assert.equal(g.population,5,'la population suit le départ');
  resume(g,notes);
  assert.match(g.cityWater215.overview().rows.find(r=>r.label==='Pénurie').value,/Deuxième temps/);
  until(g,R.departSeconds+R.departInterval-2);assert.equal(count(notes,LEFT),1,'un à la fois, à intervalle régulier');
  until(g,R.departSeconds+R.departInterval+1);assert.equal(kinds(g),'medic,soldier,worker');assert.equal(count(notes,LEFT),2);
  until(g,R.deathWarnSeconds-1);assert.equal(kinds(g),'medic,soldier,worker','le dernier ouvrier ne part jamais');assert.equal(count(notes,LEFT),2);assert.equal(count(notes,DOOM),0);
  until(g,R.deathWarnSeconds+1);assert.equal(count(notes,DOOM),1,'morts annoncées avant d’arriver');
  resume(g,notes);
  assert.match(g.cityWater215.overview().rows.find(r=>r.label==='Ensuite').value,/[Pp]remière mort dans/);
  until(g,R.deathSeconds-1);assert.equal(alive(g).length,3);assert.equal(g.stats.unitsLost,lost);
  until(g,R.deathSeconds+1);assert.equal(kinds(g),'medic,worker','le plus affaibli meurt le premier');
  assert.equal(g.stats.unitsLost,lost+1,'la mort passe par le chemin ordinaire et ses statistiques');
  assert.deepEqual(notes.map(t=>DIED.exec(t)?.[1]).filter(Boolean),['fusilier']);assert.equal(count(notes,'Un fusilier a été perdu'),1);
  resume(g,notes);
  assert.match(g.cityWater215.overview().summary,/meurent dans les murs/);
  until(g,R.deathSeconds+R.deathInterval-2);assert.equal(alive(g).length,2,'une mort à la fois');
  until(g,R.deathSeconds+R.deathInterval+1);assert.equal(kinds(g),'worker');assert.equal(g.stats.unitsLost,lost+2);
  until(g,R.deathSeconds+R.deathInterval*4);assert.equal(kinds(g),'worker','le dernier ouvrier ne meurt pas de soif');
  assert.equal(g.player.dead,false);assert.equal(g.player.health,health,'le Commandant n’est jamais touché');
  assert.equal(count(notes,LEAVE),1);assert.equal(count(notes,DOOM),1);assert.equal(count(notes,LEFT),2);assert.equal(notes.filter(t=>DIED.test(t)).length,2);
  assert.equal(g.siege.cityReserve215().water,0,'aucune eau créée');
  const state=g.cityWater215.snapshot();assert.equal(state.left,2);assert.equal(state.died,2);
  assert.match(g.cityWater215.overview().rows.find(r=>r.label==='Pertes dues à l’eau').value,/2 départs · 2 morts/);
  resume(g,notes);
});

test('eau de cité : le retour de l’eau arrête tout aussitôt et réarme les seuils',()=>{
  const {g,notes}=dryCity(['worker','worker','worker','worker']);
  g.units[0].state='build';g.units[3].state='build';
  const idle=g.units.slice(1,3).map(u=>u.id);
  until(g,R.departSeconds+1);assert.equal(alive(g).length,3);assert.equal(count(notes,LEFT),1);
  assert.equal(alive(g).some(u=>u.id===idle[1]),false,'un ouvrier sans tâche part avant un ouvrier au chantier');
  g.updateUnits(.04);assert.equal(g.units.length,3,'le moteur écarte l’ouvrier parti au pas suivant');
  const data=g.serialize();data.siege.tanks[0].water=120;assert.equal(g.restoreSave(data),true);g.resources.food=1e5;
  const water=g.siege.cityReserve215().water;step(g,1,1);
  assert.equal(g.cityWater215.stage(),0);assert.equal(count(notes,'Eau de cité : les citernes servent de nouveau'),1);
  assert.deepEqual(g.cityWater215.snapshot(),{version:2,active:true,dry:0,departs:0,deaths:0,left:1,died:0});
  step(g,R.departInterval*3,1);assert.equal(alive(g).length,3,'plus aucun départ, l’eau revenue');assert.equal(count(notes,LEFT),1);
  assert.ok(g.siege.cityReserve215().water<water,'la population boit ; aucune eau créée');
  const empty=g.serialize();empty.siege.tanks[0].water=0;assert.equal(g.restoreSave(empty),true);g.resources.food=1e5;
  until(g,R.departSeconds-1);assert.equal(alive(g).length,3,'une nouvelle pénurie repart de zéro');assert.equal(count(notes,LEAVE),2,'et s’annonce de nouveau');
  until(g,R.departSeconds+1);assert.equal(alive(g).length,2);assert.equal(g.cityWater215.snapshot().left,2);
});

test('eau de cité : sans activation ou avant la Ville, personne ne part ni ne meurt',()=>{
  const old=dryCity(['worker','worker','soldier']),data=old.g.serialize();delete data.expansions127.modules.cityWater215;
  assert.equal(old.g.restoreSave(data),true);old.g.resources.food=1e5;const notes=[];watch(old.g,notes);
  assert.equal(old.g.cityWater215.active(),false);step(old.g,R.deathSeconds+R.deathInterval*2,1);
  assert.equal(alive(old.g).length,3);assert.equal(count(notes,'Pénurie'),0);assert.equal(count(notes,'Eau de cité'),0);assert.equal(old.g.stats.unitsLost,0);
  assert.deepEqual(old.g.cityWater215.snapshot(),W.initial());
  const {g}=campaign();cistern(g,0);const early=[];watch(g,early);g.resources.food=1e5;const before=alive(g).length;
  assert.ok(g.tier.id<R.startAge);step(g,R.deathSeconds+R.deathInterval*2,1);
  assert.equal(alive(g).length,before);assert.equal(count(early,'Pénurie'),0);assert.equal(g.cityWater215.snapshot().dry,0);
});

test('eau de cité : le module ne crée aucune eau et ne tire aucun hasard',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/city-water215.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','localStorage','resources.','water+=','.water ='])assert.equal(source.includes(forbidden),false,forbidden);
});

test('eau de cité : l’état de la première tranche est converti, sans départ ni mort rétroactifs',()=>{
  assert.deepEqual(W.validate({version:1,active:true,dry:0}),{version:2,active:true,dry:0,departs:0,deaths:0,left:0,died:0});
  assert.deepEqual(W.validate({version:1,active:false,dry:50}),{version:2,active:false,dry:0,departs:0,deaths:0,left:0,died:0});
  const late=W.validate({version:1,active:true,dry:R.deathSeconds+R.deathInterval*2+1});
  assert.equal(late.left,0);assert.equal(late.died,0);assert.ok(late.departs>0&&late.deaths===3,'les échéances passées sont tenues pour échues');
  assert.deepEqual(W.validate(late),late,'la forme convertie est valide');
});
