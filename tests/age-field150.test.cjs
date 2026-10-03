'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),Kit=require('../src/expansion-kit.js'),Fort=require('../src/fortification-pack.js'),Team=require('../src/companions-pack.js'),Loadout=require('../src/loadout129.js');
const G=require('../src/frontier-geometry.js'),FR=C.FortificationPackRules,TR=C.CompanionPackRules;
const mechanisms=['guideRail','ratchet','clamp','counterweight'],exercises=['triage','sapeur','veille','coordination'],copy=v=>JSON.parse(JSON.stringify(v));
// Historical ages, completed supports, resources and actor positions are explicit
// model fixtures. Payment, access checks, work, effects and save/load use the engine.
function fresh(tier=10,ids=[]){const{game:g}=bootGame();Kit.install(g);Fort.install(g);Team.install(g);Loadout.install(g);g.startNew('standard','17117');g.units=[];g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});g.urban.attain(C.CITY_TIERS[tier].requiredScore);g.refreshMetrics(true);g.worldEvolution.enableWorld4();g.population=10;for(const key of C.RESOURCE_KEYS)g.resources[key]=300;for(const id of ids)assert.equal(g.worldEvolution.assignCompanion(id),true);standAt(g,g.player,g.core());return g;}
function structure(g,type,x=72,y=72){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);g.selectBuilding(b);standAt(g,g.player,b);return b;}
function bag(g,cost){standAt(g,g.player,g.core());for(const[key,n]of Object.entries(cost)){const result=g.loadout.transfer('depot','sac',key,n);assert.equal(result.ok,true,result.reason);assert.equal(result.amount,n);}assert.ok(C.bagTotal(g.player.carry)<=36);}
const fit=(g,b)=>g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id)?.mechanism;
function work(g,seconds){for(let left=seconds;left>1e-8;left-=FR.maxStep)g.fortificationPack.step(Math.min(left,FR.maxStep));}
function support(g,kind){bag(g,FR.mechanisms[kind].cost);structure(g,'workshop',82,72);const b=structure(g,'spikes');return b;}
function install(g,kind){const b=support(g,kind),r=FR.mechanisms[kind];assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,true);work(g,r.seconds);return b;}
function infected(g,b){assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1);z.x=b.right+z.radius+FR.mechanismContactReach-1;z.y=b.y;g.rebuildBuckets();return z;}
function battle(g,seconds){for(let left=seconds;left>1e-8;left-=.04){g.updateZombies(Math.min(left,.04));g.rebuildBuckets();}}
function stable(g){const raw=copy(g.serialize());delete raw.timestamp;return raw;}
function trainWork(g,seconds){for(let left=seconds;left>1e-8;left-=.1)g.companionsPack.update(Math.min(left,.1));}
function prepared(g,id,exercise){const r=TR.exercises[exercise],s=g.companionsPack.snapshot();s.trained=[id,id+':escort',...(r.requires==='support'?[id+':support']:[])];g.companionsPack.restore(s);}
function complete(g,id,exercise){const r=TR.exercises[exercise];prepared(g,id,exercise);assert.equal(g.companionsPack.train(id,exercise).ok,true);trainWork(g,r.seconds+.1);assert.equal(g.companionsPack.snapshot().training,null);}
function armed(g){require('../src/player-pack131.js').install(g);require('../src/arsenal134.js').install(g);assert.equal(g.arsenal134.weaponSpec().category,'firearm');bag(g,{ammo:1});return g;}
function trainingContact(g,distance=70){
 assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1);let clear=false;
 for(let i=0;i<24;i++){const angle=i*Math.PI/12;z.x=g.player.x+distance*Math.cos(angle);z.y=g.player.y+distance*Math.sin(angle);if(g.friendlyPositionClear(z,z.x,z.y)&&g.hostileLineClear(z,g.player)){clear=true;break;}}
 assert.equal(clear,true,'La menace doit occuper un point libre avec une ligne physique vers le commandant.');g.rebuildBuckets();return z;
}
const trainingLabel=g=>g.companionsPack.overview().rows.find(r=>r.label==='Entraînement').value;
function screenTrainingContact(g,z){
 let wall;
 for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,x=g.player.x+100*Math.cos(angle),y=g.player.y+100*Math.sin(angle),gx=Math.floor((g.player.x+x)/2/C.TILE),gy=Math.floor((g.player.y+y)/2/C.TILE);
  if(!g.friendlyPositionClear(z,x,y)||!g.hostileLineClear({x,y},g.player)||!g.world.placement(C.BUILDINGS.steelWall,gx,gy,0).valid)continue;
  const candidate=new(g.core().constructor)(g.nextId++,'steelWall',gx,gy,0,1);g.world.add(candidate);z.x=x;z.y=y;
  if(g.friendlyPositionClear(g.player,g.player.x,g.player.y)&&g.friendlyPositionClear(z,z.x,z.y)&&!g.hostileLineClear(z,g.player)){wall=candidate;break;}
  g.world.remove(candidate);
 }
 assert.ok(wall,'Une cloison réelle doit couper la ligne sans enfermer les acteurs.');assert.ok(Math.hypot(z.x-g.player.x,z.y-g.player.y)<TR.trainingDanger);g.rebuildBuckets();return wall;
}
function enter(g){g.player.x=4058;g.player.y=2048;assert.equal(g.frontier.enter(),true);for(let i=0;i<4;i++)g.update(.05);}
const fieldWork=(g,seconds)=>{for(let left=seconds;left>1e-8;left-=.05)g.update(Math.min(left,.05));};

for(const kind of mechanisms){
 test('150 '+kind+' : palier, atelier et sac réel avant un paiement final unique',()=>{
  const r=FR.mechanisms[kind],g=fresh(r.tier-1),b=support(g,kind),carried={...g.player.carry},stocks={...g.resources};
  assert.match(g.fortificationPack.previewMechanism(kind,b.id).reason,/Palier/);assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,false);assert.deepEqual(g.player.carry,carried);assert.deepEqual(g.resources,stocks);
  g.urban.attain(C.CITY_TIERS[r.tier].requiredScore);g.refreshMetrics(true);const prior=stable(g);
  for(let i=0;i<4;i++){assert.equal(g.fortificationPack.previewMechanism(kind,b.id).ok,true);g.fortificationPack.actions();}assert.deepEqual(stable(g),prior);
  const a=g.fortificationPack.actions().find(v=>v.id==='mechanism-'+kind);assert.equal(a.disabled,false);assert.match(a.description,/dans le sac/);assert.equal(a.run().ok,true);work(g,r.seconds-.25);assert.deepEqual(g.player.carry,carried);assert.equal(fit(g,b),undefined);work(g,.25);
  assert.deepEqual(fit(g,b),{kind,charges:r.charges,cooldown:0,caught:[]});for(const[key,n]of Object.entries(r.cost))assert.equal(carried[key]-g.player.carry[key],n);assert.deepEqual(g.resources,stocks);const paid={...g.player.carry};work(g,30);assert.deepEqual(g.player.carry,paid);
 });
 test('150 '+kind+' : accès, atelier perdu, déplacement et Continue annulent sans débit',()=>{
  for(const mode of ['distance','reload','unfinished','destroy','move','continue']){
   const g=fresh(),b=support(g,kind),r=FR.mechanisms[kind],w=[...g.world.buildings.values()].find(v=>v.type==='workshop'),carried={...g.player.carry};
   if(mode==='distance'){g.player.x=100;g.player.y=100;}if(mode==='reload')g.player.reload=1;if(mode==='unfinished')w.progress=.5;
   if(['distance','reload','unfinished'].includes(mode)){assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,false);}
   else{assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,true);work(g,1);if(mode==='destroy')g.destroyBuilding(w);if(mode==='move')g.player.x+=3;if(mode==='continue'){assert.equal(g.save(false),true);assert.equal(g.load(),true);}work(g,r.seconds);assert.equal(g.fortificationPack.busy(),false);}
   assert.deepEqual(g.player.carry,carried,mode);assert.equal(fit(g,b),undefined,mode);
  }
 });
 test('150 '+kind+' : dégâts et entrave physiques, charges finies, reprise exacte et perte du support',()=>{
  const g=fresh(),b=install(g,kind),r=FR.mechanisms[kind];standAt(g,g.player,g.core());const z=infected(g,b),hp=z.health;g.updateZombies(.04);
  assert.equal(hp-z.health,r.damage);assert.equal(fit(g,b).charges,r.charges-1);assert.equal(fit(g,b).cooldown,r.cooldown);if(r.holdSeconds)assert.ok(z.stagger>r.holdSeconds-.1);else assert.equal(fit(g,b).caught.length,0);
  const saved=copy(g.serialize()),stored=copy(fit(g,b)),stock={...g.resources};assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(fit(g,b),stored);assert.deepEqual(g.resources,stock);
  const world=g.world,invalid=copy(saved);invalid.urban.peakScore=C.CITY_TIERS[r.tier-1].requiredScore;assert.throws(()=>g.restoreSave(invalid),/Fortifications/);assert.equal(g.world,world);assert.deepEqual(g.resources,stock);
  let living=g.zombies.find(v=>v.id===z.id);living.x=3900;living.y=3900;g.rebuildBuckets();battle(g,Math.max(r.cooldown,r.holdSeconds)+.1);
  for(let i=1;i<r.charges;i++){const e=infected(g,b);g.updateZombies(.04);assert.equal(fit(g,b).charges,r.charges-i-1);e.x=3900;e.y=3900;g.rebuildBuckets();battle(g,Math.max(r.cooldown,r.holdSeconds)+.1);}
  const exhausted=infected(g,b),remaining=exhausted.health;g.updateZombies(.04);assert.equal(exhausted.health,remaining);assert.equal(fit(g,b).charges,0);exhausted.x=3900;exhausted.y=3900;g.rebuildBuckets();
  bag(g,r.cost);standAt(g,g.player,g.world.buildings.get(b.id));assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,true);work(g,r.seconds);assert.equal(fit(g,b).charges,r.charges);g.destroyBuilding(g.world.buildings.get(b.id));assert.equal(fit(g,b),undefined);
 });
}

for(const exercise of exercises){
 const r=TR.exercises[exercise],id=r.allowedCompanions[0];
 test('150 '+exercise+' : équipier exact, palier et prérequis contrôlés avant paiement',()=>{
  const g=fresh(r.tier-1,[id]),stocks={...g.resources};prepared(g,id,exercise);assert.match(g.companionsPack.train(id,exercise).reason,/Palier/);assert.deepEqual(g.resources,stocks);
  const action=g.companionsPack.actions().find(a=>a.id==='train-'+id+'-'+exercise);assert.equal(action.disabled,true);assert.match(action.description,/seulement/);assert.match(action.reason,/Palier/);
  g.urban.attain(C.CITY_TIERS[r.tier].requiredScore);g.refreshMetrics(true);const empty=g.companionsPack.snapshot();empty.trained=[];g.companionsPack.restore(empty);assert.equal(g.companionsPack.train(id,exercise).ok,false);assert.deepEqual(g.resources,stocks);
  prepared(g,id,exercise);assert.equal(g.companionsPack.train(id,exercise).ok,true);for(const[key,n]of Object.entries(r.cost))assert.equal(stocks[key]-g.resources[key],n);assert.equal(g.companionsPack.snapshot().training.left,r.seconds);const paid={...g.resources};assert.equal(g.companionsPack.train(id,exercise).ok,false);assert.deepEqual(g.resources,paid);
 });
 test('150 '+exercise+' : durée payée suspendue, Continue exacte et annulation sans remboursement',()=>{
  const g=fresh(10,[id]);prepared(g,id,exercise);assert.equal(g.companionsPack.train(id,exercise).ok,true);trainWork(g,1);const before=g.companionsPack.snapshot(),stocks={...g.resources};
  for(const mode of ['away','pause','alert','reload','dead','overlay','removed','danger']){
   const prior={x:g.player.x,y:g.player.y,paused:g.paused,phase:g.phase,reload:g.player.reload,health:g.player.health,dead:g.player.dead,overlay:g.activeOverlay};let z;
   if(mode==='away')g.player.x=500;if(mode==='pause')g.paused=true;if(mode==='alert')g.phase='warning';if(mode==='reload')g.player.reload=1;if(mode==='dead'){g.player.health=0;g.player.dead=true;}if(mode==='overlay')g.activeOverlay={};if(mode==='removed')assert.equal(g.worldEvolution.removeCompanion(id),true);
   if(mode==='danger'){assert.equal(g.spawnZombie('walker'),true);z=g.zombies.at(-1);z.x=g.player.x+50;z.y=g.player.y;g.rebuildBuckets();}
   trainWork(g,1);assert.deepEqual(g.companionsPack.snapshot(),before,mode);if(z){z.dead=true;z.health=0;}if(mode==='removed'){g.resources.food+=C.WorldEvolution.RULES.companionRules.assignmentFood;assert.equal(g.worldEvolution.assignCompanion(id),true);}
   Object.assign(g.player,{x:prior.x,y:prior.y,reload:prior.reload,health:prior.health,dead:prior.dead});g.paused=prior.paused;g.phase=prior.phase;g.activeOverlay=prior.overlay;
  }
  assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.companionsPack.snapshot(),before);assert.deepEqual(g.resources,stocks);trainWork(g,1);assert.ok(g.companionsPack.snapshot().training.left<before.training.left);assert.equal(g.companionsPack.cancelTraining().ok,true);assert.deepEqual(g.resources,stocks);assert.equal(g.companionsPack.snapshot().training,null);
 });
 test('150 '+exercise+' : validation transactional du palier, partenaire et chaîne de formation',()=>{
  const g=fresh(10,[id]);complete(g,id,exercise);const valid=copy(g.serialize()),world=g.world,stocks={...g.resources};
  for(const mode of ['tier','wrong-role','prerequisite','duplicate','timer']){
   const raw=copy(valid),s=raw.expansions127.modules.companions;
   if(mode==='tier')raw.urban.peakScore=C.CITY_TIERS[r.tier-1].requiredScore;
   if(mode==='wrong-role'){s.trained=s.trained.filter(v=>v!==id+':'+exercise);const other=id==='samir'?'malik':'samir';s.trained.push(other,other+':escort',other+':support',other+':'+exercise);}
   if(mode==='prerequisite')s.trained=s.trained.filter(v=>v!==id+':'+r.requires);if(mode==='duplicate')s.trained.push(id+':'+exercise);if(mode==='timer'){s.trained=s.trained.filter(v=>v!==id+':'+exercise);s.training={id,left:r.seconds+1,exercise};}
   assert.throws(()=>g.restoreSave(raw),/Équipe/,mode);assert.equal(g.world,world);assert.deepEqual(g.resources,stocks);
  }
  assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.companionsPack.snapshot(),valid.expansions127.modules.companions);assert.deepEqual(g.resources,stocks);
 });
}

// Arsenal registers validators shared by all games in this Node process. Run its
// integration fixtures after the historical fixtures using the minimal registry.
function threatRegressionTests(){for(const exercise of exercises){
 test('150 '+exercise+' : menace physique suspend le travail et permet tir et recharge réellement payés',()=>{
  const r=TR.exercises[exercise],id=r.allowedCompanions[0],g=armed(fresh(r.tier,[id]));prepared(g,id,exercise);const before={...g.resources};assert.equal(g.companionsPack.train(id,exercise).ok,true);
  for(const[key,n]of Object.entries(r.cost))assert.equal(before[key]-g.resources[key],n);trainWork(g,.1);const paid=g.companionsPack.snapshot(),stocks={...g.resources},rounds=g.player.magazine[g.player.weapon],shots=g.stats.shots,projectiles=g.projectiles.length;
  assert.equal(g.companionsPack.busy(),true);assert.equal(g.arsenal134.beforeShot(),false);g.shootPlayer();assert.equal(g.player.magazine[g.player.weapon],rounds);assert.equal(g.stats.shots,shots);
  const z=trainingContact(g),state=stable(g);for(let i=0;i<3;i++){assert.equal(g.companionsPack.busy(),false);assert.equal(g.expansions.busy('arsenal134'),false);assert.match(trainingLabel(g),/Suspendu : infectés proches · mains libres pour se défendre/);}assert.deepEqual(stable(g),state,'Lire la disponibilité et son explication ne modifie ni la simulation ni son RNG.');
  trainWork(g,1);assert.deepEqual(g.companionsPack.snapshot(),paid);assert.equal(g.arsenal134.beforeShot(),true);g.shootPlayer();assert.equal(g.player.magazine[g.player.weapon],rounds-1);assert.equal(g.stats.shots,shots+1);assert.equal(g.projectiles.length,projectiles+g.arsenal134.weaponSpec().pellets);
  g.startReload();assert.ok(g.player.reload>0);let steps=0;while(g.player.reload>0&&steps++<200){g.updatePlayer(.05);g.companionsPack.update(.05);}assert.ok(steps<200,'Le rechargement réel doit se terminer.');assert.equal(g.player.magazine[g.player.weapon],rounds);assert.equal(g.player.carry.ammo,0);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.companionsPack.snapshot(),paid);
  assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.companionsPack.snapshot(),paid);assert.deepEqual(g.resources,stocks);assert.equal(g.player.magazine[g.player.weapon],rounds);assert.equal(g.player.carry.ammo,0);assert.equal(g.companionsPack.busy(),false);assert.match(trainingLabel(g),/Suspendu : infectés proches/);trainWork(g,.2);assert.deepEqual(g.companionsPack.snapshot(),paid);
  const restored=g.zombies.find(e=>e.id===z.id);assert.ok(restored&&!restored.dead);g.zombies=g.zombies.filter(e=>e!==restored);g.rebuildBuckets();assert.equal(g.companionsPack.busy(),true);assert.doesNotMatch(trainingLabel(g),/Suspendu|mains libres/);assert.equal(g.arsenal134.beforeShot(),false);g.player.shootCooldown=0;g.shootPlayer();assert.equal(g.player.magazine[g.player.weapon],rounds);assert.equal(g.stats.shots,shots+1);trainWork(g,.1);assert.ok(Math.abs(g.companionsPack.snapshot().training.left-(paid.training.left-.1))<1e-9);assert.deepEqual(g.resources,stocks);
 });
}

for(const mode of ['death','removed','distance','wall']){
 test('150 formation : fin de menace par '+mode+' remet les mains au travail sans second paiement',()=>{
  const g=armed(fresh(4,['samir']));prepared(g,'samir','triage');assert.equal(g.companionsPack.train('samir','triage').ok,true);trainWork(g,.1);const z=trainingContact(g),paid=g.companionsPack.snapshot();assert.equal(g.companionsPack.busy(),false);trainWork(g,.5);assert.deepEqual(g.companionsPack.snapshot(),paid);assert.match(trainingLabel(g),/Suspendu : infectés proches/);
  if(mode==='death'){z.health=0;g.killZombie(z,false);assert.equal(z.dead,true);}if(mode==='removed')g.zombies=g.zombies.filter(e=>e!==z);if(mode==='distance'){const angle=Math.atan2(z.y-g.player.y,z.x-g.player.x);z.x=g.player.x+(TR.trainingDanger+1)*Math.cos(angle);z.y=g.player.y+(TR.trainingDanger+1)*Math.sin(angle);assert.ok(g.friendlyPositionClear(z,z.x,z.y));}if(mode==='wall')screenTrainingContact(g,z);g.rebuildBuckets();const stocks={...g.resources};
  assert.equal(g.companionsPack.busy(),true);assert.equal(g.expansions.busy('arsenal134'),true);assert.doesNotMatch(trainingLabel(g),/Suspendu|mains libres/);assert.equal(g.arsenal134.beforeShot(),false);const rounds=g.player.magazine[g.player.weapon],shots=g.stats.shots;g.player.shootCooldown=0;g.shootPlayer();assert.equal(g.player.magazine[g.player.weapon],rounds);assert.equal(g.stats.shots,shots);trainWork(g,.1);assert.ok(Math.abs(g.companionsPack.snapshot().training.left-(paid.training.left-.1))<1e-9);assert.deepEqual(g.resources,stocks);
 });
}

test('150 formation : après la menace, une recharge inachevée reste suspendue et coûte ses munitions',()=>{
 const g=armed(fresh(4,['samir']));prepared(g,'samir','triage');assert.equal(g.companionsPack.train('samir','triage').ok,true);const paid=g.companionsPack.snapshot(),stocks={...g.resources},z=trainingContact(g),rounds=g.player.magazine[g.player.weapon];g.shootPlayer();g.startReload();assert.ok(g.player.reload>0);g.zombies=g.zombies.filter(e=>e!==z);g.rebuildBuckets();assert.equal(g.companionsPack.busy(),true);trainWork(g,.5);assert.deepEqual(g.companionsPack.snapshot(),paid);
 let steps=0;while(g.player.reload>0&&steps++<200)g.updatePlayer(.05);assert.ok(steps<200);assert.equal(g.player.magazine[g.player.weapon],rounds);assert.equal(g.player.carry.ammo,0);trainWork(g,.1);assert.ok(Math.abs(g.companionsPack.snapshot().training.left-(paid.training.left-.1))<1e-9);assert.deepEqual(g.resources,stocks);
});

for(const exercise of ['specialty','escort','support']){
 test('150 ancien entraînement '+exercise+' : durée, mains occupées et libellé restent historiques sous menace',()=>{
  const g=armed(fresh(0,['samir'])),s=g.companionsPack.snapshot(),r=exercise==='specialty'?TR.training:TR.exercises[exercise];s.trained=exercise==='specialty'?[]:['samir',...(exercise==='support'?['samir:escort']:[])];g.companionsPack.restore(s);const stocks={...g.resources};assert.equal(g.companionsPack.train('samir',exercise).ok,true);for(const[key,n]of Object.entries(r.cost))assert.equal(stocks[key]-g.resources[key],n);const paid={...g.resources};trainingContact(g);assert.equal(g.companionsPack.busy(),true);assert.equal(g.arsenal134.beforeShot(),false);assert.equal(trainingLabel(g),'Samir · '+(exercise==='specialty'?'Spécialité':r.name)+' · '+r.seconds+' s, au dépôt en phase calme');trainWork(g,.1);assert.ok(Math.abs(g.companionsPack.snapshot().training.left-(r.seconds-.1))<1e-9);assert.deepEqual(g.resources,paid);
 });
}
}

test('150 triage : soins réels conditionnés à Tenir + Défense + Ligne au tarif médical historique',()=>{
 const g=fresh(10,['samir']);complete(g,'samir','triage');enter(g);g.player.health=50;g.player.carry.medicine=2;assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('defensive').ok,true);const hp=g.player.health;fieldWork(g,1);const gain=g.player.health-hp;
 assert.ok(Math.abs(gain-C.WorldEvolution.RULES.companionRules.healPerSecond*TR.training.bonus.samir*TR.exercises.support.serviceFactor*TR.exercises.triage.healFactor)<1e-6);assert.ok(Math.abs((2-g.player.carry.medicine)-gain*C.WorldEvolution.RULES.companionRules.medicinePerHealth)<1e-9);
 assert.equal(g.companionsPack.setFormation('spread').ok,true);assert.equal(g.companionsPack.control('samir',g.frontier.snapshot(),0).healMultiplier,1.25*1.15);g.player.carry.medicine=0;const healed=g.player.health;fieldWork(g,1);assert.equal(g.player.health,healed);
});

test('150 sapeur : réparation réelle du véhicule sans ferraille gratuite ni augmentation de portée',()=>{
 const g=fresh(10,['ines']);complete(g,'ines','sapeur');structure(g,'expeditionGarage',77,65);g.fieldcraft.setup();standAt(g,g.player,g.core());assert.equal(g.expeditions.buildCar().ok,true);const car=g.expeditions.car();g.player.x=car.x+35;g.player.y=car.y;assert.equal(g.expeditions.board().ok,true);car.x=g.player.x=4058;car.y=g.player.y=2048;assert.equal(g.frontier.enter(),true);assert.equal(g.frontier.board(),true);fieldWork(g,.2);
 assert.equal(g.companionsPack.setOrder('hold').ok,true);assert.equal(g.companionsPack.setDiscipline('defensive').ok,true);assert.equal(g.companionsPack.setFormation('spread').ok,true);car.health-=30;g.player.carry.scrap=2;const hp=car.health;fieldWork(g,1);const gain=car.health-hp;
 assert.ok(Math.abs(gain-C.WorldEvolution.RULES.companionRules.repairPerSecond*TR.training.bonus.ines*TR.exercises.support.serviceFactor*TR.exercises.sapeur.repairFactor)<1e-6);assert.ok(Math.abs((2-g.player.carry.scrap)-gain*C.WorldEvolution.RULES.companionRules.scrapPerHealth)<1e-9);g.player.carry.scrap=0;fieldWork(g,.5);assert.equal(car.health,hp+gain);
 assert.equal(g.companionsPack.setOrder('follow').ok,true);assert.equal(g.companionsPack.control('ines',g.frontier.snapshot(),0).repairMultiplier,1.25);
});

function firingFixture(blocked){
 const g=fresh(10,['malik']);complete(g,'malik','veille');enter(g);const w=g.frontier.world(),house=w.pois.find(p=>p.type==='house'),raw=g.serialize();Object.assign(raw.frontier,{...G.global(house,house.w/2,house.h/2-3),z:0,inside:house.id});raw.expansions127.modules.companions.positions={};g.restoreSave(raw);fieldWork(g,.05);const target=g.frontier.overview().enemies.find(e=>e.poi===house.id&&e.z===0);assert.ok(target);let origin;
 for(let i=0;i<144;i++){const a=i*Math.PI/72,p={x:target.x+9*Math.cos(a),y:target.y+9*Math.sin(a)};if(!w.blocked(p.x,p.y,.32,0,null)&&w.line(p,target,0,null,null,.015)!==blocked){origin=p;break;}}assert.ok(origin);
 const saved=g.serialize();for(const place of w.nearPOI(origin.x,origin.y,150))for(let i=0;i<w.threatCount(place);i++){const id=place.id+':e'+i;if(id!==target.id){saved.frontier.enemies[id]=0;delete saved.frontier.tracks[id];}}
 saved.frontier.kills=Object.values(saved.frontier.enemies).filter(h=>h===0).length;Object.assign(saved.frontier,{...origin,z:0,inside:null});saved.player.carry.ammo=3;const s=saved.expansions127.modules.companions;s.order='hold';s.anchor=null;s.formation='spread';s.discipline='defensive';s.positions.malik={...origin,z:0,inside:null,a:0};g.restoreSave(saved);return{g,target};
}
test('150 veille : tir réel à neuf mètres, cadence et coût inchangés, cloison respectée',()=>{
 const{g,target}=firingFixture(false);assert.equal(g.companionsPack.control('malik',g.frontier.snapshot(),0).shotRange,10);fieldWork(g,.05);assert.equal(g.player.carry.ammo,2);assert.ok(Math.abs(g.frontier.snapshot().enemies[target.id]-(target.hp-C.WorldEvolution.RULES.companionRules.shotDamage*TR.training.bonus.malik))<1e-9);fieldWork(g,.5);assert.equal(g.player.carry.ammo,2);
 const blocked=firingFixture(true);fieldWork(blocked.g,.05);assert.equal(blocked.g.player.carry.ammo,3);assert.equal(blocked.g.frontier.snapshot().enemies[blocked.target.id]??65,blocked.target.hp);
});

test('150 coordination : seul le trajet physique de Léa se resserre, sans vitesse ou vision supplémentaire',()=>{
 const g=fresh(10,['lea','samir']);complete(g,'lea','coordination');enter(g);assert.equal(g.companionsPack.setOrder('rally').ok,true);assert.equal(g.companionsPack.setFormation('line').ok,true);const f=g.frontier.snapshot(),control=g.companionsPack.control('lea',f,0),other=g.companionsPack.control('samir',f,1),plain=Math.hypot(TR.formations.line.back,TR.formations.line.side);
 assert.ok(Math.abs(Math.hypot(control.goal.x-f.x,control.goal.y-f.y)-plain*TR.exercises.coordination.gapFactor)<1e-9);assert.ok(Math.abs(Math.hypot(other.goal.x-f.x,other.goal.y-f.y)-plain)<1e-9);assert.equal(control.scoutMultiplier,TR.training.bonus.lea);assert.equal(other.healMultiplier,1);const before=g.worldEvolution.overview().companions.find(c=>c.id==='lea');fieldWork(g,1);const after=g.worldEvolution.overview().companions.find(c=>c.id==='lea');assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<=C.WorldEvolution.RULES.companionRules.speed+1e-9);assert.equal(g.frontier.world().blocked(after.x,after.y,.32,after.z,after.inside),false);
 assert.equal(g.companionsPack.setFormation('spread').ok,true);assert.equal(g.companionsPack.control('lea',f,0).scoutMultiplier,TR.training.bonus.lea);
});

test('150 équipe : affecter un autre partenaire ne permet jamais une formation réservée',()=>{
 for(const exercise of exercises){const r=TR.exercises[exercise],id=r.allowedCompanions[0]==='samir'?'malik':'samir',g=fresh(10,[id]);prepared(g,id,'triage');const stock={...g.resources},state=g.companionsPack.snapshot();assert.match(g.companionsPack.train(id,exercise).reason,/réservée/);assert.deepEqual(g.resources,stock);assert.deepEqual(g.companionsPack.snapshot(),state);assert.equal(g.companionsPack.actions().some(a=>a.id==='train-'+id+'-'+exercise),false);}
});

test('150 anciens registres : aucune gratification et états 1.27/1.46/1.48 inchangés',()=>{
 const g=fresh(0,['samir']),oldTeam=Team.initial();oldTeam.trained=['samir','samir:escort'];oldTeam.training={id:'samir',exercise:'support',left:40};assert.deepEqual(Team.validate(oldTeam,g.serialize()),oldTeam);g.companionsPack.restore(oldTeam);const oldFort=Fort.initial();assert.deepEqual(Fort.normalize(oldFort,g.serialize()),oldFort);assert.equal(Team.validate(undefined).trained.length,0);assert.equal(Fort.normalize(undefined).fittings.length,0);const stocks={...g.resources};assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.companionsPack.snapshot(),oldTeam);assert.deepEqual(g.resources,stocks);g.startNew('standard','42');assert.deepEqual(g.companionsPack.snapshot(),Team.initial());assert.deepEqual(g.fortificationPack.snapshot(),Fort.initial());
});
threatRegressionTests();
