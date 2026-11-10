'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),W=require('../src/city-water215.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.CityWater215Rules,F=globalThis.DeadwallSiege;

test('eau de cité : règles dans le cœur, besoin nul avant l’âge de départ',()=>{
  assert.ok(Object.isFrozen(R));assert.equal(C.CITY_TIERS[R.startAge].name,'VILLE');
  assert.ok(R.perPersonSecond>0&&R.graceSeconds>0&&R.moraleDrain>0);
  for(let age=0;age<R.startAge;age++)assert.equal(W.demand(60,age),0);
  assert.equal(W.demand(50,R.startAge),50*R.perPersonSecond);assert.equal(W.demand(0,10),0);
  assert.throws(()=>W.demand(-1,4));assert.throws(()=>W.demand(10,1.5));
  assert.equal(W.stage(0),0);assert.equal(W.stage(1),1);assert.equal(W.stage(R.graceSeconds-.01),1);assert.equal(W.stage(R.graceSeconds),2);
});

test('eau de cité : état validé strictement, absent des anciennes sauvegardes = inactif',()=>{
  assert.deepEqual(W.validate(undefined),{version:1,active:false,dry:0});
  assert.deepEqual(W.validate({version:1,active:true,dry:12.5}),{version:1,active:true,dry:12.5});
  for(const bad of [null,[],{version:2,active:true,dry:0},{version:1,active:'oui',dry:0},{version:1,active:true,dry:-1},{version:1,active:true,dry:Infinity},{version:1,active:true},{version:1,active:true,dry:0,extra:1}])assert.throws(()=>W.validate(bad),/Eau de cité/);
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

test('eau de cité : le module ne crée aucune eau et ne tire aucun hasard',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/city-water215.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','localStorage','resources.','water+=','.water ='])assert.equal(source.includes(forbidden),false,forbidden);
});
