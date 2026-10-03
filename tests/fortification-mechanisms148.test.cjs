'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),Kit=require('../src/expansion-kit.js'),Pack=require('../src/fortification-pack.js'),Loadout=require('../src/loadout129.js'),Survival=require('../src/survival-pack.js');
const R=C.FortificationPackRules,copy=v=>JSON.parse(JSON.stringify(v));
// Completed supports, attained tiers, moved actors and cleared props are explicit
// model fixtures. Transactions and effects use the real game APIs, not browser play.
function fresh(){const{game:g}=bootGame();Kit.install(g);Pack.install(g);Loadout.install(g);Survival.install(g);g.startNew('standard','17117');g.units=[];g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});g.tier=C.CITY_TIERS[2];return g;}
function structure(g,type='spikes',x=72,y=72){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);g.tier=C.CITY_TIERS[2];g.selectBuilding(b);standAt(g,g.player,b);return b;}
function bag(g,cost){standAt(g,g.player,g.core());for(const[key,n]of Object.entries(cost)){const r=g.loadout.transfer('depot','sac',key,n);assert.equal(r.ok,true,key+': '+r.reason+' '+JSON.stringify({state:g.state,health:g.player.health,paused:g.paused,overlay:g.activeOverlay?.id,reload:g.player.reload,busy:g.expansions.entries().filter(d=>(g[d.id+'Pack']||g[d.id])?.busy?.()).map(d=>d.id)}));assert.equal(r.amount,n);}}
const fitting=(g,b)=>g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id),mechanism=(g,b)=>fitting(g,b)?.mechanism;
function work(g,seconds){for(let left=seconds;left>1e-8;left-=R.maxStep)g.fortificationPack.step(Math.min(left,R.maxStep));}
function install(g,kind='ankle',b=null){bag(g,R.mechanisms[kind].cost);if(kind==='blades')structure(g,'workshop',82,72);b=b||structure(g);g.selectBuilding(b);standAt(g,g.player,b);assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,true);work(g,R.mechanisms[kind].seconds);standAt(g,g.player,g.core());standAt(g,g.player,b);return b;}
function enemy(g,b,kind='walker',side='right'){assert.equal(g.spawnZombie(kind),true);const z=g.zombies.at(-1);z.x=side==='right'?b.right+z.radius+R.mechanismContactReach-1:b.left-z.radius-R.mechanismContactReach+1;z.y=b.y;g.rebuildBuckets();return z;}
function moveAway(g,z,b){z.x=b.x+600;z.y=b.y;g.rebuildBuckets();}
function battle(g,seconds){for(let left=seconds;left>1e-8;left-=.04){g.updateZombies(Math.min(left,.04));g.rebuildBuckets();}}
function stable(g){const s=copy(g.serialize());delete s.timestamp;return s;}

for(const kind of ['ankle','blades'])test('148 montage '+kind+' : devis pur, vrai sac, paiement final unique et réserves inchangées',()=>{
 const g=fresh(),b=installSupport(g,kind),r=R.mechanisms[kind],before=stable(g),stock={...g.resources},carried={...g.player.carry},hp=b.health;
 for(let i=0;i<20;i++){const q=g.fortificationPack.previewMechanism(kind,b.id);assert.equal(q.ok,true);assert.deepEqual(q.cost,r.cost);g.fortificationPack.actions();}assert.deepEqual(stable(g),before);
 const action=g.fortificationPack.actions().find(a=>a.id==='mechanism-'+kind);assert.equal(action.disabled,false);assert.equal(action.close,true);assert.match(action.description,/dans le sac/);assert.equal(action.run().ok,true);
 work(g,r.seconds-.25);assert.deepEqual(g.player.carry,carried);assert.equal(mechanism(g,b),undefined);work(g,.25);
 assert.deepEqual(mechanism(g,b),{kind,charges:6,cooldown:0,caught:[]});for(const[key,n]of Object.entries(r.cost))assert.equal(carried[key]-g.player.carry[key],n);assert.deepEqual(g.resources,stock);assert.equal(b.health,hp);
 const paid={...g.player.carry};work(g,30);assert.deepEqual(g.player.carry,paid);assert.equal(mechanism(g,b).charges,6);assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,false);
});
function installSupport(g,kind){bag(g,R.mechanisms[kind].cost);if(kind==='blades')structure(g,'workshop',82,72);return structure(g);}

test('148 montage : ressources du dépôt seules, types invalides et mauvais support refusés sans dépense',()=>{
 const g=fresh(),b=structure(g),before=stable(g);for(const kind of ['ankle','blades','unknown',['ankle'],null])assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,false);assert.deepEqual(stable(g),before);
 bag(g,R.mechanisms.ankle.cost);const tower=structure(g,'watchtower'),carried={...g.player.carry};assert.equal(g.fortificationPack.startMechanism('ankle',tower.id).ok,false);assert.deepEqual(g.player.carry,carried);
});

test('148 montage : vrai palier et atelier achevé requis, sans réduction gratuite',()=>{
 const g=fresh();bag(g,R.mechanisms.blades.cost);const b=structure(g);g.tier=C.CITY_TIERS[1];assert.match(g.fortificationPack.previewMechanism('blades',b.id).reason,/Palier/);
 g.tier=C.CITY_TIERS[2];assert.match(g.fortificationPack.previewMechanism('blades',b.id).reason,/terminé requis/);const w=structure(g,'workshop',82,72);w.progress=.5;g.selectBuilding(b);standAt(g,g.player,b);assert.equal(g.fortificationPack.startMechanism('blades',b.id).ok,false);
 w.progress=1;assert.equal(g.fortificationPack.startMechanism('blades',b.id).ok,true);const carried={...g.player.carry};g.destroyBuilding(w);work(g,12);assert.equal(g.fortificationPack.busy(),false);assert.deepEqual(g.player.carry,carried);assert.equal(mechanism(g,b),undefined);
});

test('148 montage : mains, décès, région et accès physique refusent le départ',()=>{
 for(const mode of ['reload','dead','region','absent','busy','placement','distance','blocked']){
  const g=fresh(),b=installSupport(g,'ankle');
  if(mode==='reload')g.player.reload=1;if(mode==='dead'){g.player.dead=true;g.player.health=0;}
  if(mode==='region')g.frontier={active:()=>true};if(mode==='absent')g.player.regionAbsent=true;
  if(mode==='busy'){g.player.health=60;g.player.carry.medicine=1;assert.equal(g.survivalPack.begin('dressingLight').ok,true);}
  if(mode==='placement')g.selectedBuild='woodWall';if(mode==='distance'){g.player.x=100;g.player.y=100;}
  if(mode==='blocked'){const p={x:b.left-55,y:b.y};structure(g,'steelWall',71,72);Object.assign(g.player,p);g.selectBuilding(b);assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true,'Le joueur est physiquement debout hors du mur');}
  const carried={...g.player.carry},stock={...g.resources};assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,false,mode);assert.equal(g.fortificationPack.actions().find(a=>a.id==='mechanism-ankle').disabled,true,mode);assert.deepEqual(g.player.carry,carried);assert.deepEqual(g.resources,stock);
 }
});

test('148 montage : mouvement, recharge, décès, support et ingrédients revalidés jusqu’au paiement',()=>{
 for(const mode of ['move','reload','dead','ingredient','injury','destroy','replacement','rotation','support-move','fire']){
  const g=fresh(),b=installSupport(g,'ankle');assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);work(g,7.75);
  if(mode==='move')g.player.x+=R.fieldSupplyMoveTolerance+1;if(mode==='reload')g.player.reload=1;
  if(mode==='dead'){g.player.health=0;g.player.dead=true;g.update(.04);}if(mode==='ingredient')g.player.carry.scrap=0;if(mode==='injury')g.player.health--;
  if(mode==='destroy')g.destroyBuilding(b);if(mode==='replacement'){g.world.remove(b);g.world.add(new(b.constructor)(b.id,b.type,b.gx,b.gy,0,1));}
  if(mode==='rotation')b.rotation=(b.rotation+1)%4;if(mode==='support-move')b.gx++;if(mode==='fire')g.input.mouseDown=true;
  const carried={...g.player.carry};work(g,.25);assert.equal(g.fortificationPack.busy(),false,mode);assert.deepEqual(g.player.carry,carried,mode);assert.equal(mechanism(g,b),undefined,mode);
 }
});

test('148 montage : le poste monté et les autres gestes matériels partagent l’exclusivité',()=>{
 const g=fresh(),b=installSupport(g,'ankle'),tower=structure(g,'watchtower',76,72);assert.equal(g.fieldcraft.control(tower),true);g.selectBuilding(b);standAt(g,g.player,b);assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,false);assert.equal(g.fieldcraft.control(tower),true);
 g.selectBuilding(b);standAt(g,g.player,b);assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);assert.equal(g.fieldcraft.control(tower),false);assert.equal(g.loadout.transfer('sac','depot','wood',1).ok,false);
 g.player.health=60;g.player.carry.medicine=1;assert.equal(g.survivalPack.begin('dressingLight').ok,false);assert.equal(g.fortificationPack.startFieldSupply('repair',b.id).ok,false);assert.equal(g.fortificationPack.planSpikes().ok,false);g.fortificationPack.stop();assert.equal(g.survivalPack.begin('dressingLight').ok,true);
});

test('148 montage : contact réel à l’arrivée interrompt sans débit, éloignement permet de reprendre',()=>{
 const g=fresh(),b=installSupport(g,'ankle');assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);work(g,2);const z=enemy(g,b);z.x=g.player.x-30;z.y=g.player.y;g.rebuildBuckets();const carried={...g.player.carry};work(g,.04);assert.equal(g.fortificationPack.busy(),false);assert.deepEqual(g.player.carry,carried);moveAway(g,z,b);assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);work(g,8);assert.equal(mechanism(g,b).charges,6);
});

test('148 entrave : ralentissement mesuré, attaque différée et horloge strictement alignée',()=>{
 const g=fresh(),b=install(g),z=enemy(g,b),hp=z.health,start={x:z.x,y:z.y};g.updateZombies(.04);const moved=Math.hypot(z.x-start.x,z.y-start.y);
 assert.equal(hp-z.health,12);assert.equal(mechanism(g,b).charges,5);assert.equal(z.stagger,2.46);assert.equal(z.attackCooldown,2.46);assert.equal(mechanism(g,b).caught[0].left,z.stagger);
 const normal=fresh(),support=structure(normal),walker=enemy(normal,support),origin={x:walker.x,y:walker.y};normal.updateZombies(.04);const full=Math.hypot(walker.x-origin.x,walker.y-origin.y);assert.ok(full>0);assert.ok(Math.abs(moved/full-.35)<.001,'Le facteur historique de marche ralentie agit réellement');
 battle(g,.4);assert.equal(mechanism(g,b).charges,5,'Pas de deuxième charge sur un infecté encore entravé');assert.ok(Math.abs(mechanism(g,b).caught[0].left-z.stagger)<1e-8);
});

test('148 entrave : la ruée physique d’un Fonceur est réellement annulée au contact',()=>{
 const g=fresh(),b=install(g),z=enemy(g,b,'charger');z.charge={stage:'rush',timer:C.ENEMY_RULES.charge.rushSeconds,angle:Math.PI};g.updateZombies(.04);assert.equal(mechanism(g,b).charges,5);assert.equal(z.charge.stage,'recover');assert.ok(z.stagger>2.4);assert.ok(z.charge.timer>0);
 const saved=copy(g.serialize()),held=copy(mechanism(g,b)),charge={...z.charge},stagger=z.stagger,stock={...g.resources},carried={...g.player.carry};g.restoreSave(saved);const restored=g.zombies.find(e=>e.id===z.id);assert.deepEqual(restored.charge,charge);assert.equal(restored.stagger,stagger);assert.deepEqual(mechanism(g,b),held);g.updateZombies(.04);assert.equal(mechanism(g,b).charges,5);assert.ok(restored.stagger<stagger);assert.ok(mechanism(g,b).caught[0].left<held.caught[0].left);assert.deepEqual(g.resources,stock);assert.deepEqual(g.player.carry,carried);
});

test('148 montage et appoint : les vrais aperçus de programme excluent toute seconde préparation',()=>{
 for(const action of ['mechanism','supply'])for(const timing of ['before','during'])for(const mode of ['placing','preview']){
  const g=fresh(),cost=action==='mechanism'?R.mechanisms.ankle.cost:R.fieldSupply.repair.cost;bag(g,cost);structure(g,'planningOffice',82,72);const b=structure(g),api=g.fortificationPack,start=()=>action==='mechanism'?api.startMechanism('ankle',b.id):api.startFieldSupply('repair',b.id);
  if(timing==='during'){assert.equal(start().ok,true);work(g,2);}const carried={...g.player.carry};assert.equal(g.dayworks.beginPlan('spikedApproach'),true);assert.equal(g.dayworks.workContext().placing,true);
  if(mode==='preview')g.dayworks.anchorPlan('spikedApproach',92,92);assert.equal(g.dayworks.workContext()[mode],true);
  if(timing==='before')assert.equal(start().ok,false);else work(g,.25);assert.equal(api.busy(),false);assert.deepEqual(g.player.carry,carried);assert.equal(fitting(g,b),undefined);assert.equal(g.dayworks.workContext()[mode],true,'Aucun déplacement ou financement implicite du programme');g.dayworks.cancelPlan();assert.equal(start().ok,true);api.stop();
 }
});

for(const kind of ['ankle','blades'])test('148 '+kind+' : six usages finis, délai global, recharge payante et aucun crédit de stock',()=>{
 const g=fresh(),b=install(g,kind),stock={...g.resources};for(let i=0;i<6;i++){
  const z=enemy(g,b),hp=z.health;g.updateZombies(.04);assert.equal(mechanism(g,b).charges,5-i);assert.equal(hp-z.health,R.mechanisms[kind].damage);moveAway(g,z,b);battle(g,R.mechanisms[kind].cooldown+.04);
 }battle(g,3);assert.equal(mechanism(g,b).charges,0);assert.match(g.fortificationPack.overview().rows.find(r=>r.label==='Montage mécanique').value,/ÉPUISÉ/);
 const z=enemy(g,b),hp=z.health;g.updateZombies(.04);assert.equal(z.health,hp);assert.deepEqual(g.resources,stock);moveAway(g,z,b);bag(g,R.mechanisms[kind].cost);standAt(g,g.player,b);g.selectBuilding(b);assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,true);work(g,R.mechanisms[kind].seconds);assert.equal(mechanism(g,b).charges,6);assert.equal(C.bagTotal(g.player.carry),0);
});

test('148 lames : deux contacts simultanés ne consomment qu’une charge par cooldown',()=>{
 const g=fresh(),b=install(g,'blades'),one=enemy(g,b),two=enemy(g,b);two.y+=5;g.rebuildBuckets();const health=one.health+two.health;g.updateZombies(.04);assert.equal(mechanism(g,b).charges,5);assert.equal(health-one.health-two.health,28);g.updateZombies(.04);assert.equal(mechanism(g,b).charges,5);assert.equal(health-one.health-two.health,28);
});

test('148 montage : morts, distance, mur et vrai décor bloquent le contact sans charge fantôme',()=>{
 for(const mode of ['dead','distance','wall','prop']){
  const g=fresh(),b=install(g),z=enemy(g,b);if(mode==='dead'){z.health=0;z.dead=true;}if(mode==='distance')z.x=b.right+z.radius+R.mechanismContactReach+4;
  if(mode==='wall'){structure(g,'steelWall',73,72);z.x=b.right+C.TILE+z.radius+1;z.y=b.y;assert.equal(g.hostilePositionClear(z,z.x,z.y),true,'Le contact reste physiquement dehors, derrière le mur');assert.equal(g.hostileLineClear(z,{x:b.right,y:b.y},false,b),false);}
  if(mode==='prop'){const p=g.world.nodes.find(n=>n.type==='scrap');Object.assign(p,{x:b.right+14,y:b.y,radius:16,renderSize:undefined,sceneryKind:'sedan',depleted:false});g.world.navigationVersion++;const rect=g.fieldcraft.rect(p);assert.ok(rect.l>b.right);assert.ok(z.x-rect.r>z.radius*.7);assert.ok(g.hostilePositionClear(z,z.x,z.y),'Le contact est debout hors du décor, pas dedans');}
  g.rebuildBuckets();const hp=z.health;g.updateZombies(.04);assert.equal(mechanism(g,b).charges,6,mode);assert.equal(z.health,hp,mode);
 }
});

test('148 montage : tuer par l’impact suit le propriétaire des morts, jamais une charge sur cadavre',()=>{
 const g=fresh(),b=install(g,'blades'),z=enemy(g,b);z.health=20;const kills=g.stats.kills;g.updateZombies(.04);assert.equal(z.dead,true);assert.equal(g.stats.kills,kills+1);assert.equal(mechanism(g,b).charges,5);battle(g,2);assert.equal(mechanism(g,b).charges,5);
});

test('148 montage : pause et Commandement figent travail, cooldown et entrave par vraie boucle',()=>{
 const g=fresh(),b=installSupport(g,'ankle');assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);work(g,2);g.paused=true;work(g,20);assert.equal(g.fortificationPack.job.elapsed,2);g.paused=false;work(g,6);const z=enemy(g,b);g.updateZombies(.04);const before=copy(mechanism(g,b)),position={x:z.x,y:z.y},stagger=z.stagger;
 for(const overlay of [null,g.ui.commandModal]){g.paused=true;g.activeOverlay=overlay;for(let i=0;i<10;i++)g.loop(g.lastFrame+40);assert.deepEqual(mechanism(g,b),before);assert.deepEqual({x:z.x,y:z.y},position);assert.equal(z.stagger,stagger);}g.activeOverlay=null;g.paused=false;battle(g,.04);assert.ok(mechanism(g,b).caught[0].left<before.caught[0].left);
});

test('148 montage : défense autonome quand le commandant part ou tombe, aucun montage à distance',()=>{
 for(const mode of ['region','dead']){const g=fresh(),b=install(g,'blades'),z=enemy(g,b);if(mode==='region'){g.frontier={...g.frontier,active:()=>true};g.player.regionAbsent=true;}else{g.player.dead=true;g.player.health=0;}const hp=z.health;g.updateZombies(.04);assert.equal(hp-z.health,28);assert.equal(mechanism(g,b).charges,5);assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,false);}
});

test('148 montage : retrait sans remboursement, réserves historiques conservées, destruction clôt l’entrave',()=>{
 const g=fresh(),b=install(g);const state=g.fortificationPack.snapshot();state.fittings[0].repair=20;g.expansions.get('fortification').restore(state);const stock={...g.resources};assert.equal(g.fortificationPack.removeMechanism(b.id).ok,true);assert.equal(mechanism(g,b),undefined);assert.equal(fitting(g,b).repair,20);assert.deepEqual(g.resources,stock);
 bag(g,R.mechanisms.ankle.cost);standAt(g,g.player,b);assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);work(g,8);const z=enemy(g,b);g.updateZombies(.04);assert.equal(z.stagger,2.46);g.destroyBuilding(b);assert.equal(mechanism(g,b),undefined);assert.equal(z.stagger,0);assert.equal(z.attackCooldown,0);assert.deepEqual(g.resources,stockAfterBag(stock,R.mechanisms.ankle.cost));
});
function stockAfterBag(stock,cost){const next={...stock};for(const[k,n]of Object.entries(cost))next[k]-=n;return next;}

test('148 montage : destruction préserve un autre effet distinct plus long',()=>{
 const g=fresh(),b=install(g),z=enemy(g,b);g.updateZombies(.04);z.stagger=5;z.attackCooldown=7;g.destroyBuilding(b);assert.equal(z.stagger,5);assert.equal(z.attackCooldown,7);
});

test('148 montage : sauvegarde réelle conserve charges, cooldown et entrave sans remise à neuf',()=>{
 const g=fresh(),b=install(g),z=enemy(g,b);g.updateZombies(.04);const saved=copy(g.serialize()),stored=copy(mechanism(g,b)),carried={...g.player.carry},stock={...g.resources};assert.equal(saved.version,20);g.restoreSave(saved);assert.deepEqual(mechanism(g,b),stored);assert.deepEqual(g.player.carry,carried);assert.deepEqual(g.resources,stock);const restored=g.zombies.find(e=>e.id===z.id);assert.equal(restored.stagger,0,'Le propriétaire historique ne sauvegarde pas stagger');g.updateZombies(.04);assert.equal(mechanism(g,b).charges,5);assert.ok(Math.abs(restored.stagger-(stored.caught[0].left-.04))<1e-8);assert.ok(mechanism(g,b).cooldown<stored.cooldown);
 const stable=copy(g.serialize());for(let i=0;i<3;i++){g.restoreSave(stable);assert.deepEqual(g.fortificationPack.snapshot(),stable.expansions127.modules.fortification);assert.deepEqual(g.resources,stock);}
});

test('148 montage : travail non payé annulé au chargement, ancienne sauvegarde sans montage et nouvelle campagne vides',()=>{
 const g=fresh(),b=installSupport(g,'ankle');assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,true);work(g,7);const saved=copy(g.serialize()),carried={...g.player.carry};g.restoreSave(saved);assert.equal(g.fortificationPack.busy(),false);assert.equal(mechanism(g,b),undefined);assert.deepEqual(g.player.carry,carried);
 const legacy={version:1,fittings:[{id:b.id,ammo:0,repair:20,net:0,regulator:false}],debris:[]};assert.deepEqual(Pack.normalize(legacy,g.serialize()),legacy);g.expansions.get('fortification').restore(legacy);assert.equal(mechanism(g,b),undefined);assert.equal(fitting(g,b).repair,20);g.startNew('standard','42');assert.deepEqual(g.fortificationPack.snapshot(),Pack.initial());assert.equal(g.fortificationPack.busy(),false);
});

test('148 montage : validation strictement transactionnelle des charges, clocks, cibles et supports',()=>{
 const g=fresh(),b=install(g),z=enemy(g,b);g.updateZombies(.04);const valid=copy(g.serialize()),world=g.world,stock={...g.resources};
 for(const mutate of [m=>m.kind='unknown',m=>m.charges=7,m=>m.charges=5.5,m=>m.cooldown=1.1,m=>m.extra=1,m=>m.caught[0].left=2.6,m=>m.caught[0].id=0,m=>m.caught[0].id=999999,m=>m.caught.push({...m.caught[0]}),m=>m.charges=6]){
  const raw=copy(valid);mutate(raw.expansions127.modules.fortification.fittings[0].mechanism);assert.throws(()=>g.restoreSave(raw),/Fortifications/);assert.equal(g.world,world);assert.deepEqual(g.resources,stock);
 }
 const wrong=copy(valid);wrong.expansions127.modules.fortification.fittings[0].id=g.core().id;assert.throws(()=>g.restoreSave(wrong),/Fortifications/);assert.equal(g.world,world);
});

test('148 montage : borne des 128 supports et raccourci placement sans chantier ni financement automatique',()=>{
 const g=fresh();bag(g,R.mechanisms.ankle.cost);const b=structure(g),records=[];for(let gy=8;gy<120&&records.length<R.maxFittings;gy+=3)for(let gx=8;gx<120&&records.length<R.maxFittings;gx+=3){if(!g.world.placement(C.BUILDINGS.spikes,gx,gy,0).valid)continue;const support=new(b.constructor)(g.nextId++,'spikes',gx,gy,0,1);g.world.add(support);records.push({id:support.id,ammo:0,repair:1,net:0,regulator:false});}assert.equal(records.length,R.maxFittings);g.expansions.get('fortification').restore({version:1,fittings:records,debris:[]});g.selectBuilding(b);standAt(g,g.player,b);const carried={...g.player.carry};assert.equal(g.fortificationPack.startMechanism('ankle',b.id).ok,false);assert.deepEqual(g.player.carry,carried);
 const stock={...g.resources},count=g.world.buildings.size;assert.equal(g.fortificationPack.planSpikes().ok,true);assert.equal(g.selectedBuild,'spikes');assert.equal(g.world.buildings.size,count);assert.deepEqual(g.resources,stock);g.cancelPlacement();
});
