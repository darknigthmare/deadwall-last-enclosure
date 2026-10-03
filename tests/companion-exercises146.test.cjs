'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),Kit=require('../src/expansion-kit.js'),Pack=require('../src/companions-pack.js'),Survival=require('../src/survival-pack.js');
const G=require('../src/frontier-geometry.js');
function fresh(ids=['samir']){const{game:g}=bootGame();Kit.install(g);Pack.install(g);Survival.install(g);g.startNew('standard','17117');g.worldEvolution.enableWorld4();g.population=10;g.resources.food=g.resources.scrap=g.resources.ammo=300;for(const id of ids)assert.equal(g.worldEvolution.assignCompanion(id),true);g.player.x=g.core().x+80;g.player.y=g.core().y;return g;}
const run=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds/.1)+1;i++)g.companionsPack.update(.1);};
const action=(g,id,exercise)=>g.companionsPack.actions().find(a=>a.id==='train-'+id+(exercise==='specialty'?'':'-'+exercise));
function purchase(g,id,exercise){const a=action(g,id,exercise);assert.equal(a.disabled,false,JSON.stringify(a));const cost=exercise==='specialty'?C.CompanionPackRules.training.cost:C.CompanionPackRules.exercises[exercise].cost,before={...g.resources};assert.equal(a.run().ok,true);for(const[key,n]of Object.entries(cost))assert.equal(before[key]-g.resources[key],n);return cost;}
function complete(g,id,exercise){purchase(g,id,exercise);run(g,exercise==='specialty'?45:C.CompanionPackRules.exercises[exercise].seconds);assert.equal(g.companionsPack.snapshot().training,null);}
function unchangedRefusal(g,id,exercise){const stocks={...g.resources},before=g.companionsPack.snapshot();assert.equal(g.companionsPack.train(id,exercise).ok,false);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.companionsPack.snapshot(),before);}
const fieldStep=(g,n)=>{for(let i=0;i<n;i++)g.update(.05);};
function enter(g){g.player.x=4058;g.player.y=2048;assert.equal(g.frontier.enter(),true);fieldStep(g,4);}

test('146 équipe : deux exercices progressifs sont payés une fois après la spécialité',()=>{
 const g=fresh();unchangedRefusal(g,'samir','escort');unchangedRefusal(g,'samir','support');complete(g,'samir','specialty');assert.equal(action(g,'samir','escort').disabled,false);unchangedRefusal(g,'samir','support');complete(g,'samir','escort');complete(g,'samir','support');
 assert.deepEqual(g.companionsPack.snapshot().trained,['samir','samir:escort','samir:support']);for(const exercise of ['specialty','escort','support'])unchangedRefusal(g,'samir',exercise);
 assert.match(action(g,'samir','support').label,/75 s/);assert.equal(action(g,'samir','support').disabled,true);assert.equal(g.worldEvolution.overview().companions.length,1,'aucun accompagnateur offert');
});

test('146 équipe : progression payée suspendue au départ, pause, alerte et recharge ; annulation sans remboursement',()=>{
 const g=fresh();complete(g,'samir','specialty');purchase(g,'samir','escort');run(g,1);let remaining=g.companionsPack.snapshot().training.left;assert.ok(remaining<60&&remaining>58);
 for(const mode of ['away','pause','alert','reload','dead','overlay']){
  const original={x:g.player.x,paused:g.paused,phase:g.phase,reload:g.player.reload,health:g.player.health,dead:g.player.dead,overlay:g.activeOverlay};
  if(mode==='away')g.player.x=500;if(mode==='pause')g.paused=true;if(mode==='alert')g.phase='warning';if(mode==='reload')g.player.reload=1;if(mode==='dead'){g.player.health=0;g.player.dead=true;}if(mode==='overlay')g.activeOverlay={};
  run(g,1);assert.equal(g.companionsPack.snapshot().training.left,remaining,mode);
  Object.assign(g.player,{x:original.x,reload:original.reload,health:original.health,dead:original.dead});g.paused=original.paused;g.phase=original.phase;g.activeOverlay=original.overlay;
 }
 const stocks={...g.resources};assert.equal(g.companionsPack.cancelTraining().ok,true);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.companionsPack.snapshot().trained,['samir']);purchase(g,'samir','escort');
});

test('146 équipe : rechargement, poste, activité et mort ferment le nouveau devis et son action',()=>{
 for(const mode of ['reload','mounted','busy','dead','pause']){
  const g=fresh();complete(g,'samir','specialty');
  if(mode==='reload')g.player.reload=1;
  if(mode==='mounted'){const b=new(g.core().constructor)(g.nextId++,'watchtower',72,72,0,1);g.world.add(b);standAt(g,g.player,b);assert.equal(g.fieldcraft.control(b),true);}
  if(mode==='busy'){g.player.health=60;g.player.carry.medicine=2;assert.equal(g.survivalPack.begin('dressing').ok,true);}
  if(mode==='dead'){g.player.dead=true;g.player.health=0;}
  if(mode==='pause')g.togglePause(true);
  assert.equal(action(g,'samir','escort').disabled,true,mode);unchangedRefusal(g,'samir','escort');
 }
});

test('146 équipe : manque de stock, exercice inconnu et doublon n’engagent aucune ressource',()=>{
 const g=fresh();complete(g,'samir','specialty');g.resources.food=23.9;unchangedRefusal(g,'samir','escort');g.resources.food=300;
 for(const exercise of ['unknown',['escort'],null,{},'__proto__'])unchangedRefusal(g,'samir',exercise);
 purchase(g,'samir','escort');const before={...g.resources};assert.equal(g.companionsPack.train('samir','escort').ok,false);assert.deepEqual(g.resources,before);assert.equal(g.companionsPack.fill('samir').ok,false,'pas de manipulation concurrente pendant l’exercice');
});

test('146 équipe : reprise exacte de l’exercice payé et poursuite sans second débit',()=>{
 const g=fresh();complete(g,'samir','specialty');complete(g,'samir','escort');purchase(g,'samir','support');run(g,10);const state=g.companionsPack.snapshot(),stocks={...g.resources};assert.ok(state.training.left<66&&state.training.left>64);assert.equal(state.training.exercise,'support');
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.companionsPack.snapshot(),state);assert.deepEqual(g.resources,stocks);run(g,66);assert.equal(g.companionsPack.snapshot().training,null);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.companionsPack.snapshot().trained,['samir','samir:escort','samir:support']);
 g.startNew('standard','42');assert.deepEqual(g.companionsPack.snapshot(),Pack.initial());
});

test('146 équipe : retirer le partenaire suspend l’exercice, sa réaffectation payée le reprend',()=>{
 const g=fresh();complete(g,'samir','specialty');purchase(g,'samir','escort');run(g,1);const left=g.companionsPack.snapshot().training.left,stocks={...g.resources};
 assert.equal(g.worldEvolution.removeCompanion('samir'),true);run(g,2);assert.equal(g.companionsPack.snapshot().training.left,left);assert.equal(g.companionsPack.busy(),false);assert.deepEqual(g.resources,stocks);
 assert.equal(g.worldEvolution.assignCompanion('samir'),true);assert.equal(g.resources.food,stocks.food-C.WorldEvolution.RULES.companionRules.assignmentFood);run(g,1);assert.ok(g.companionsPack.snapshot().training.left<left);assert.deepEqual(g.companionsPack.snapshot().trained,['samir']);
});

test('146 équipe : ancienne spécialité et minuterie45 restent exactes, aucune gratification en migration',()=>{
 const old=Pack.initial();old.trained=['malik'];old.training={id:'samir',left:20};assert.deepEqual(Pack.validate(old),old);assert.deepEqual(Pack.validate(undefined),Pack.initial());
 const g=fresh();const raw=g.serialize(),resources={...g.resources};raw.expansions127.modules.companions=old;g.restoreSave(raw);assert.deepEqual(g.companionsPack.snapshot(),old);assert.deepEqual(g.resources,resources);assert.equal(action(g,'samir','escort').disabled,true);
});

test('146 équipe : import forgé sans prérequis, type ou durée échoue avant remplacement du monde',()=>{
 const g=fresh(),world=g.world,stocks={...g.resources};
 for(const change of [s=>s.trained=['samir:escort'],s=>s.trained=['samir','samir:support'],s=>s.trained=['samir','samir:escort','samir:escort'],s=>s.training={id:'samir',left:61,exercise:'escort'},s=>{s.trained=['samir'];s.training={id:'samir',left:30,exercise:'support'};},s=>s.training={id:'samir',left:10,exercise:['escort']},s=>s.training={id:'samir',left:10,exercise:null}]){
  const raw=g.serialize();change(raw.expansions127.modules.companions);assert.throws(()=>g.restoreSave(raw),/Équipe/);assert.equal(g.world,world);assert.deepEqual(g.resources,stocks);
 }
});

test('146 équipe : escorte change la file physique, sans augmenter la vitesse ni traverser les obstacles',()=>{
 const g=fresh();complete(g,'samir','specialty');complete(g,'samir','escort');enter(g);assert.equal(g.companionsPack.setFormation('file').ok,true);const f=g.frontier.snapshot(),expected=C.CompanionPackRules.formations.file.back*.7,control=g.companionsPack.control('samir',f,0);
 assert.ok(Math.abs(Math.hypot(control.goal.x-f.x,control.goal.y-f.y)-expected)<1e-9);const before=g.worldEvolution.overview().companions[0];fieldStep(g,20);const after=g.worldEvolution.overview().companions[0];
 assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<=C.WorldEvolution.RULES.companionRules.speed+1e-9);assert.equal(g.frontier.world().blocked(after.x,after.y,.32,after.z,after.inside),false);assert.ok(Math.hypot(after.x-control.goal.x,after.y-control.goal.y)<.21);
 assert.equal(g.companionsPack.setFormation('spread').ok,true);const ordinary=g.companionsPack.control('samir',f,0);assert.ok(Math.abs(Math.hypot(ordinary.goal.x-f.x,ordinary.goal.y-f.y)-Math.hypot(3,3))<1e-9);
});

test('146 équipe : appui conditionné à Tenir + Défense soigne réellement au tarif habituel',()=>{
 const g=fresh();for(const e of ['specialty','escort','support'])complete(g,'samir',e);enter(g);g.player.health=60;g.player.carry.medicine=2;
 assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('defensive').ok,true);const p=g.worldEvolution.overview().companions[0],before=g.player.health;fieldStep(g,20);const heal=g.player.health-before;
 assert.ok(Math.abs(heal-C.WorldEvolution.RULES.companionRules.healPerSecond*C.CompanionPackRules.training.bonus.samir*1.15)<1e-6);assert.ok(Math.abs((2-g.player.carry.medicine)-heal*C.WorldEvolution.RULES.companionRules.medicinePerHealth)<1e-9);
 const after=g.worldEvolution.overview().companions[0];assert.equal(after.x,p.x);assert.equal(after.y,p.y);assert.equal(g.companionsPack.setOrder('follow').ok,true);assert.equal(g.companionsPack.control('samir',g.frontier.snapshot(),0).healMultiplier,1.25);
 assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('silent').ok,true);assert.equal(g.companionsPack.control('samir',g.frontier.snapshot(),0).healMultiplier,1.25);
});

test('146 équipe : appui augmente uniquement la portée de Malik et les services de leur spécialiste',()=>{
 const g=fresh(['malik','ines']);for(const id of ['malik','ines'])for(const e of ['specialty','escort','support']){g.resources.food=g.resources.scrap=g.resources.ammo=300;complete(g,id,e);}enter(g);
 assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('defensive').ok,true);const f=g.frontier.snapshot(),m=g.companionsPack.control('malik',f,0),i=g.companionsPack.control('ines',f,1);
 assert.equal(m.shotRange,8);assert.equal(m.damageMultiplier,1.2);assert.equal(i.repairMultiplier,1.25*1.15);assert.equal(i.damageMultiplier,1);assert.equal(m.repairMultiplier,1);
 assert.equal(g.companionsPack.setOrder('follow').ok,true);assert.equal(g.companionsPack.control('malik',f,0).shotRange,4);assert.equal(g.companionsPack.control('ines',f,1).repairMultiplier,1.25);
});

test('146 équipe : Inès applique l’appui au vrai véhicule et conserve le prix par point réparé',()=>{
 const g=fresh(['ines']);for(const e of ['specialty','escort','support'])complete(g,'ines',e);
 // Declared completed-garage fixture; vehicle construction, boarding and service are real.
 g.world.add(new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1));g.refreshMetrics(true);g.fieldcraft.setup();g.player.x=g.core().x+80;g.player.y=g.core().y;g.resources.wood=g.resources.scrap=300;assert.equal(g.expeditions.buildCar().ok,true);
 const car=g.expeditions.car();g.player.x=car.x+35;g.player.y=car.y;assert.equal(g.expeditions.board().ok,true);car.x=g.player.x=4058;car.y=g.player.y=2048;assert.equal(g.frontier.enter(),true);assert.equal(g.frontier.board(),true);fieldStep(g,4);
 assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('defensive').ok,true);car.health-=30;g.player.carry.scrap=2;const before=car.health,stock=g.resources.scrap;fieldStep(g,20);const repaired=car.health-before;
 assert.ok(Math.abs(repaired-C.WorldEvolution.RULES.companionRules.repairPerSecond*1.25*1.15)<1e-6);assert.ok(Math.abs((2-g.player.carry.scrap)-repaired*C.WorldEvolution.RULES.companionRules.scrapPerHealth)<1e-9);assert.equal(g.resources.scrap,stock);
 g.player.carry.scrap=0;fieldStep(g,10);assert.equal(car.health,before+repaired);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.expeditions.car().health,before+repaired);
});

function combatFixture(blocked){
 const g=fresh(['malik']);for(const e of ['specialty','escort','support'])complete(g,'malik',e);enter(g);const w=g.frontier.world(),house=w.pois.find(p=>p.type==='house'),d=g.serialize();
 // Saved scenario positions and cleared neighboring threats isolate a six-metre firing lane.
 // They are explicit fixtures, not a claim of an unmodified campaign journey.
 Object.assign(d.frontier,{...G.global(house,house.w/2,house.h/2-3),z:0,inside:house.id});d.expansions127.modules.companions.positions={};g.restoreSave(d);fieldStep(g,1);
 const target=g.frontier.overview().enemies.find(e=>e.poi===house.id&&e.z===0);assert.ok(target);let origin;
 for(let i=0;i<72;i++){const a=i*Math.PI/36,p={x:target.x+6*Math.cos(a),y:target.y+6*Math.sin(a)};if(!w.blocked(p.x,p.y,.32,0,null)&&w.line(p,target,0,null,null,.015)!==blocked){origin=p;break;}}
 assert.ok(origin,blocked?'une cloison réelle est requise':'une ligne libre réelle est requise');const raw=g.serialize();
 for(const p of w.nearPOI(origin.x,origin.y,150))for(let i=0;i<w.threatCount(p);i++){const id=p.id+':e'+i;if(id===target.id)continue;raw.frontier.enemies[id]=0;delete raw.frontier.tracks[id];}
 raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;Object.assign(raw.frontier,{...origin,z:0,inside:null});raw.player.carry.ammo=3;
 const s=raw.expansions127.modules.companions;s.order='hold';s.anchor=null;s.discipline='defensive';s.positions.malik={...origin,z:0,inside:null,a:0};g.restoreSave(raw);
 return{g,id:target.id,hp:target.hp,origin};
}

test('146 équipe : Malik tire au-delà de quatre mètres, une cartouche par cadence, derrière aucun mur',()=>{
 const {g,id,hp}=combatFixture(false);fieldStep(g,1);assert.equal(g.player.carry.ammo,2);assert.ok(Math.abs(g.frontier.snapshot().enemies[id]-(hp-C.WorldEvolution.RULES.companionRules.shotDamage*1.2))<1e-9);
 fieldStep(g,10);assert.equal(g.player.carry.ammo,2,'cadence du tireur préservée');assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.player.carry.ammo,2);
 const obstructed=combatFixture(true);fieldStep(obstructed.g,1);assert.equal(obstructed.g.player.carry.ammo,3);assert.equal(obstructed.g.frontier.snapshot().enemies[obstructed.id]??65,obstructed.hp,'une vraie cloison interdit le tir malgré la portée');
});

test('146 équipe : Léa révèle une horde distante uniquement en appui, sans créer de pertes ni de butin',()=>{
 const g=fresh(['lea']);for(const e of ['specialty','escort','support'])complete(g,'lea',e);enter(g);const raw=g.serialize(),f=g.frontier.snapshot();
 // A declared saved horde at 890 m isolates the 840 m versus 924 m scouting boundary.
 raw.worldEvolution.serial=1;raw.worldEvolution.groups=[{id:'W0000',kind:'resting',count:80,lost:0,wound:0,x:f.x+890,y:f.y,a:0,seen:false}];g.restoreSave(raw);const stocks={...g.resources},bag={...g.player.carry};fieldStep(g,1);assert.equal(g.worldEvolution.snapshot().groups[0].seen,false);
 assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('defensive').ok,true);fieldStep(g,1);const group=g.worldEvolution.snapshot().groups[0];assert.equal(group.seen,true);assert.equal(group.count,80);assert.equal(group.lost,0);assert.equal(group.wound,0);
 for(const key of C.RESOURCE_KEYS)if(key==='food')assert.ok(g.resources[key]<=stocks[key],'la consommation normale de vivres continue');else assert.equal(g.resources[key],stocks[key]);assert.deepEqual(g.player.carry,bag);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.worldEvolution.snapshot().groups[0].seen,true);
});
