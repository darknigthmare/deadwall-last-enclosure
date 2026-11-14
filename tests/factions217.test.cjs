'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),F=require('../src/factions217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.Factions217Rules,RAID=R.raid,RELAY=R.relay;
const none=()=>({version:1,active:false,spotted:false,returns:0,exposed:false,passes:0,rep:{rouleurs:0,relais:0},affairs:{rouleurs:null,relais:null},relay:{index:0,stage:'none',wave:0}});
const fresh=()=>({...none(),active:true});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-9,(message||'')+' : '+a+' ≠ '+b);
const bag=o=>({...C.makeBag(),...o});

test('factions : règles gelées dans le cœur, bornées et sans cadeau',()=>{
  const frozen=o=>{assert.ok(Object.isFrozen(o));for(const v of Object.values(o))if(v&&typeof v==='object')frozen(v);};frozen(R);
  assert.deepEqual(F.IDS,['rouleurs','relais']);
  assert.ok(RAID.share>0&&RAID.share<.5&&RAID.hostile.share<=.5&&RAID.hostile.share>RAID.share,'jamais plus de la moitié du coffre');
  assert.ok(RAID.maxLoss<C.Expeditions.RULES.cargo&&RAID.hostile.maxLoss<C.Expeditions.RULES.cargo&&RAID.minCargo>0);
  assert.ok(RAID.awayDistance>RAID.ambushDistance&&RAID.ambushDistance>C.Expeditions.RULES.homeRange,'le barrage se tient sur la route, avant le dépôt');
  assert.ok(RAID.period>=2&&RAID.escortSoldiers>=1&&RAID.maxPasses>=1);
  assert.ok(C.bagTotal(bag(RAID.tribute))<RAID.maxLoss,'le tribut coûte moins que le barrage');
  assert.ok(R.factions.relais.min>R.hostileAt,'un relais allié ne devient jamais hostile');
  assert.ok(R.factions.rouleurs.min<=R.hostileAt&&R.factions.rouleurs.max>=R.ententeAt&&R.factions.relais.max>=R.ententeAt);
  assert.ok(RELAY.firstWave>=2&&RELAY.everyWaves>RELAY.openWaves&&RELAY.returnWaves>=1&&RELAY.requests.length>=2);
  for(const q of RELAY.requests){
    assert.ok(C.bagTotal(bag(q.back))>0&&C.bagTotal(bag(q.back))<C.bagTotal(bag(q.ask)),q.relay+' : contrepartie plus petite que le don');
    for(const k of [...Object.keys(q.ask),...Object.keys(q.back)])assert.ok(C.RESOURCE_KEYS.includes(k));
    assert.ok(Object.keys(q.back).every(k=>!(k in q.ask)),'la contrepartie n’est pas la ressource donnée');
  }
  assert.deepEqual(RELAY.requests.map(q=>q.relay),['Les Granges','La Rive','Fontvieille'],'noms de la bible');
});

test('factions : états de relation, barrage au compteur, prélèvement borné',()=>{
  assert.equal(F.standing('rouleurs',0,false),'Inconnue');assert.equal(F.standing('rouleurs',0),'Repérée');assert.equal(F.standing('relais',0),'En contact');
  assert.deepEqual([-3,-2,-1,1,2].map(n=>F.standing('rouleurs',n)),['Hostile','Hostile','Tension','En contact','Entente']);
  assert.deepEqual([-1,1,2,3].map(n=>F.standing('relais',n)),['Tension','En contact','Entente','Entente']);
  assert.throws(()=>F.standing('colonne',0));assert.throws(()=>F.standing('relais',.5));
  assert.deepEqual([0,1,2,3,4,5,6,7].map(F.ambushAt),[false,false,false,true,false,false,true,false]);
  assert.deepEqual([0,1,2,3,4,5].map(F.untilAmbush),[3,2,1,3,2,1]);
  assert.deepEqual([0,1,2,3].map(F.requestWave),[2,5,8,11]);assert.equal(F.request(4),RELAY.requests[1]);
  // Carburant d'abord, puis l'ordre des ressources ; part et plafond respectés.
  let t=F.toll(bag({fuel:4,scrap:36}));near(t.total,14);assert.deepEqual(t.taken,bag({fuel:4,scrap:10}));
  t=F.toll(bag({fuel:30,food:10}));near(t.total,14);assert.deepEqual(t.taken,bag({fuel:14}));
  t=F.toll(bag({wood:80}));assert.equal(t.total,RAID.maxLoss);assert.deepEqual(t.taken,bag({wood:RAID.maxLoss}));
  t=F.toll(bag({wood:80}),R.hostileAt);assert.equal(t.total,RAID.hostile.maxLoss,'bande hostile : part et plafond plus lourds, toujours bornés');
  t=F.toll(bag({scrap:40}),R.hostileAt);near(t.total,20);
  assert.equal(F.toll(C.makeBag()).total,0);
  for(const cargo of [bag({fuel:1}),bag({ammo:79.5,medicine:.5}),bag({wood:3,scrap:3,stone:3,food:3,fuel:3,ammo:3,medicine:3})])for(const rep of [0,-3]){
    const r=F.toll(cargo,rep);assert.ok(r.total<=C.bagTotal(cargo)*.5+1e-9);for(const k of C.RESOURCE_KEYS)assert.ok(r.taken[k]>=0&&r.taken[k]<=cargo[k]);
  }
});

test('factions : état validé strictement, absent des anciennes sauvegardes = inactif',()=>{
  assert.deepEqual(F.validate(undefined),none());assert.deepEqual(F.initial(),none());assert.deepEqual(F.validate(fresh()),fresh());
  const ok={...fresh(),spotted:true,returns:4,exposed:true,passes:1,rep:{rouleurs:-2,relais:3},affairs:{rouleurs:{code:'robbed',amount:13.5,wave:6},relais:{code:'helped',amount:1,wave:5}},relay:{index:1,stage:'owed',wave:7}};
  assert.deepEqual(F.validate(ok),ok);assert.notEqual(F.validate(ok).rep,ok.rep);assert.notEqual(F.validate(ok).affairs.rouleurs,ok.affairs.rouleurs);
  for(const bad of [null,[],'factions',{},{...ok,version:2},{...ok,active:1},{...ok,extra:1},(({passes,...rest})=>rest)(ok),
    {...ok,returns:-1},{...ok,returns:1.5},{...ok,returns:1e7},{...ok,exposed:'oui'},{...ok,passes:RAID.maxPasses+1},{...ok,passes:-1},
    {...ok,rep:{rouleurs:-4,relais:0}},{...ok,rep:{rouleurs:3,relais:0}},{...ok,rep:{rouleurs:0,relais:-2}},{...ok,rep:{rouleurs:0,relais:4}},{...ok,rep:{rouleurs:0}},{...ok,rep:{rouleurs:0,relais:0,garde:0}},{...ok,rep:{rouleurs:.5,relais:0}},
    {...ok,affairs:{rouleurs:null}},{...ok,affairs:{rouleurs:{code:'helped',amount:0,wave:1},relais:null}},{...ok,affairs:{rouleurs:null,relais:{code:'robbed',amount:0,wave:1}}},
    {...ok,affairs:{rouleurs:{code:'robbed',amount:-1,wave:1},relais:null}},{...ok,affairs:{rouleurs:{code:'robbed',amount:NaN,wave:1},relais:null}},{...ok,affairs:{rouleurs:{code:'robbed',amount:1,wave:1.5},relais:null}},{...ok,affairs:{rouleurs:{code:'robbed',amount:1,wave:1,extra:1},relais:null}},
    {...ok,relay:{index:1,stage:'due',wave:7}},{...ok,relay:{index:-1,stage:'owed',wave:7}},{...ok,relay:{index:1,stage:'none',wave:7}},{...ok,relay:{index:1,stage:'owed'}},{...ok,relay:null},
    {...ok,spotted:false},{...ok,returns:0},{...fresh(),passes:1},{...fresh(),rep:{rouleurs:1,relais:0}},{...fresh(),affairs:{rouleurs:{code:'spotted',amount:0,wave:1},relais:null}},
    {...ok,active:false},{...none(),rep:{rouleurs:0,relais:1}},{...none(),relay:{index:1,stage:'none',wave:0}},{...none(),exposed:true}])assert.throws(()=>F.validate(bad),/Factions 217/);
});

function campaign(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();return g;}
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const count=(notes,part)=>notes.filter(t=>t.includes(part)).length;
const saved=g=>g.serialize().expansions127.modules.factions217;
const row=(g,label)=>g.factions217.overview().rows.find(r=>r.label===label).value;
const tick=g=>g.economyTick(.25);
// Un fourgon en service, garé au centre, coffre donné.
function withVan(g,cargo){
  const data=g.serialize(),core=g.core();
  data.expeditions.vehicle={id:data.nextId++,x:core.x+140,y:core.y+140,health:300,fuel:10,angle:0,driving:false,cargo:bag(cargo)};data.expeditions.stats.built=1;
  assert.equal(g.restoreSave(data),true);assert.ok(g.expeditions.car());return g.expeditions.car();
}
// Une sortie : le fourgon s'éloigne, charge, puis revient jusqu'aux abords de la cité.
function sortie(g,cargo,far=RAID.awayDistance+50){
  const v=g.expeditions.car(),core=g.core();
  v.x=core.x+far;v.y=core.y;Object.assign(v.cargo,cargo);tick(g);
  v.x=core.x+RAID.ambushDistance+40;tick(g);const before={...v.cargo};
  v.x=core.x+RAID.ambushDistance-10;tick(g);
  return{before,after:{...v.cargo}};
}
function soldiersNear(g,v,n,distance=RAID.escortRange-20){
  const made=[];for(let i=0;i<n;i++){const u=g.addUnit?g.addUnit('soldier',v.x,v.y+distance):null;if(u)made.push(u);}
  if(made.length<n){const model=g.units.find(u=>u.kind==='worker');for(let i=made.length;i<n;i++){const u=Object.assign(Object.create(Object.getPrototypeOf(model)),model,{id:g.nextId++,kind:'soldier',x:v.x,y:v.y+distance,dead:false,health:100});g.units.push(u);made.push(u);}}
  return made;
}

test('factions : campagne neuve active, deux factions présentées sans rien changer au départ',()=>{
  const g=campaign(),notes=watch(g),stock={...g.resources};
  assert.equal(g.factions217.active(),true);assert.deepEqual(saved(g),fresh());
  assert.equal(g.factions217.standing('rouleurs'),'Inconnue');assert.equal(g.factions217.standing('relais'),'En contact');
  assert.match(row(g,'Les Rouleurs'),/^Inconnue/);assert.match(row(g,'Route du retour'),/libre pour l’instant/);
  assert.match(row(g,'Demande des relais'),/vers la vague 2/);assert.deepEqual(g.factions217.actions(),[]);
  assert.equal(g.factions217.help().ok,false);assert.equal(g.factions217.tribute().ok,false);
  const food=g.resources.food;for(let i=0;i<40;i++)tick(g);
  for(const k of C.RESOURCE_KEYS)if(k!=='food')assert.equal(g.resources[k],stock[k],k);assert.ok(g.resources.food<=food);
  assert.deepEqual(saved(g),fresh(),'rien ne se passe sans fourgon chargé ni vague atteinte');assert.equal(notes.length,0);
  assert.equal(g.expansions.get('factions217').title,'Factions');
});

test('factions : un fourgon chargé est repéré, puis intercepté au troisième retour, perte bornée',()=>{
  const g=campaign(),notes=watch(g),v=withVan(g,{});
  // Coffre léger ou fourgon resté près de la cité : rien n'est compté.
  let r=sortie(g,{scrap:RAID.minCargo-1});assert.deepEqual(r.after,r.before);assert.equal(g.factions217.returns(),0);
  Object.assign(v.cargo,C.makeBag());r=sortie(g,{scrap:60},RAID.awayDistance-50);assert.equal(g.factions217.returns(),0,'sortie trop courte');
  Object.assign(v.cargo,C.makeBag());
  r=sortie(g,{scrap:30,fuel:6});assert.deepEqual(r.after,r.before,'premier retour : repéré, rien de pris');
  assert.equal(g.factions217.returns(),1);assert.equal(g.factions217.standing('rouleurs'),'Repérée');assert.equal(count(notes,'Des motards ont suivi le fourgon'),1);
  assert.match(row(g,'Route du retour'),/dans 2 retours chargés : jusqu’à 35 % du coffre, 24 unités au plus, carburant d’abord\. Parade : 2 fusiliers.*tribut versé d’avance \(6 carburant\)/);
  assert.deepEqual(g.factions217.actions().map(a=>a.id),['tribute']);
  // Rester aux abords ou rentrer une seconde fois sans repartir ne recompte pas.
  for(let i=0;i<8;i++)tick(g);assert.equal(g.factions217.returns(),1);
  r=sortie(g,{});assert.deepEqual(r.after,r.before);assert.equal(g.factions217.returns(),2);assert.match(row(g,'Route du retour'),/au prochain retour chargé/);
  const stock={...g.resources};
  r=sortie(g,{});
  const total=C.bagTotal(r.before),lost=total-C.bagTotal(r.after);
  near(lost,Math.min(total*RAID.share,RAID.maxLoss),'part bornée');assert.equal(r.after.fuel,0,'carburant d’abord');near(r.before.scrap-r.after.scrap,lost-r.before.fuel);
  for(const k of C.RESOURCE_KEYS)if(k!=='food')assert.equal(g.resources[k],stock[k],'le stock du dépôt n’est jamais touché : '+k);
  assert.equal(count(notes,'Fourgon intercepté par les Rouleurs'),1);assert.equal(g.factions217.standing('rouleurs'),'Tension');assert.equal(g.factions217.reputation('rouleurs'),-1);
  assert.match(g.factions217.lastAffair('rouleurs'),/fourgon intercepté, 12,6 unités prises/);
  assert.equal(v.health,300,'aucun dégât : personne ne tire');
  // Sauvegarde et reprise : le compteur continue, rien n'est rejoué.
  const data=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(data),true);
  assert.deepEqual(saved(g),data.expansions127.modules.factions217);assert.equal(g.factions217.returns(),3);
  const cargo={...g.expeditions.car().cargo};for(let i=0;i<8;i++)tick(g);assert.deepEqual(g.expeditions.car().cargo,cargo);
  assert.equal(count(notes,'Fourgon intercepté'),1);
});

test('factions : escorte ou tribut font passer le barrage sans perte ; l’hostilité alourdit la part',()=>{
  const g=campaign(),notes=watch(g),v=withVan(g,{});
  sortie(g,{wood:70});sortie(g,{});
  // Escorte : deux fusiliers près du fourgon aux abords de la cité.
  const core=g.core();v.x=core.x+RAID.awayDistance+50;tick(g);v.x=core.x+RAID.ambushDistance-10;v.y=core.y;
  const guards=soldiersNear(g,v,RAID.escortSoldiers);tick(g);
  assert.equal(g.factions217.returns(),3);assert.equal(v.cargo.wood,70,'rien de pris');assert.equal(count(notes,'devant l’escorte'),1);
  assert.equal(g.factions217.reputation('rouleurs'),0);assert.match(g.factions217.lastAffair('rouleurs'),/sans un tir/);
  // Un seul fusilier ne suffit pas ; des fusiliers trop loin non plus.
  guards[1].y=v.y+RAID.escortRange+40;
  sortie(g,{});sortie(g,{});let r=sortie(g,{});
  near(C.bagTotal(r.before)-C.bagTotal(r.after),RAID.maxLoss);assert.equal(g.factions217.reputation('rouleurs'),-1);
  // Tribut : payé au dépôt, vaut pour un barrage.
  const fuel=g.resources.fuel;assert.deepEqual(g.factions217.tribute(),{ok:true});
  assert.equal(g.resources.fuel,fuel-RAID.tribute.fuel);assert.equal(g.factions217.passes(),1);assert.equal(g.factions217.reputation('rouleurs'),0);
  assert.match(g.factions217.tribute().reason,/déjà payé/);assert.equal(g.resources.fuel,fuel-RAID.tribute.fuel);
  assert.match(row(g,'Route du retour'),/tribut déjà versé/);
  Object.assign(v.cargo,bag({wood:70}));sortie(g,{});sortie(g,{});r=sortie(g,{});
  assert.deepEqual(r.after,r.before);assert.equal(g.factions217.passes(),0);assert.equal(count(notes,'le tribut a été versé'),1);
  // Sans parade, la relation se dégrade jusqu'à l'hostilité, où la part est plus lourde mais toujours bornée.
  for(let n=0;n<2;n++){Object.assign(v.cargo,bag({wood:70}));sortie(g,{});sortie(g,{});sortie(g,{});}
  assert.equal(g.factions217.standing('rouleurs'),'Hostile');
  Object.assign(v.cargo,bag({wood:70}));sortie(g,{});sortie(g,{});r=sortie(g,{});
  near(C.bagTotal(r.before)-C.bagTotal(r.after),Math.min(70*RAID.hostile.share,RAID.hostile.maxLoss));
  for(let n=0;n<3;n++){sortie(g,{wood:40});}
  assert.equal(g.factions217.reputation('rouleurs'),R.factions.rouleurs.min,'réputation bornée');
  // Tribut impossible sans stock, et jamais débité à moitié.
  g.resources.fuel=RAID.tribute.fuel-1;assert.match(g.factions217.tribute().reason,/Stock insuffisant/);assert.equal(g.resources.fuel,RAID.tribute.fuel-1);
  // Fourgon détruit en route : plus rien à intercepter.
  v.x=core.x+RAID.awayDistance+50;Object.assign(v.cargo,bag({wood:70}));tick(g);assert.equal(saved(g).exposed,true);
  g.expeditions.damage(1e9);tick(g);assert.equal(saved(g).exposed,false);assert.equal(g.factions217.returns(),21);
});

test('factions : un relais demande de l’aide ; le don monte l’entente et la contrepartie annoncée arrive plus tard',()=>{
  const g=campaign(),notes=watch(g),q=RELAY.requests[0];
  g.wave=RELAY.firstWave;g.phase='warning';tick(g);assert.equal(g.factions217.request(),null,'aucune demande pendant l’alerte');
  g.phase='calm';tick(g);
  assert.equal(g.factions217.request().relay,'Les Granges');assert.equal(count(notes,'Les Granges demande de l’aide : 14 nourriture ; contrepartie annoncée : 5 carburant, 2 vagues après le don'),1);
  assert.match(row(g,'Demande des relais'),/Les Granges demande 14 nourriture ; contrepartie annoncée : 5 carburant.*avant la fin de la vague 2/);
  const act=g.factions217.actions().find(a=>a.id==='help');assert.equal(act.disabled,false,act.reason);assert.match(act.description,/Don : 14 nourriture.*Contrepartie annoncée : 5 carburant, 2 vagues plus tard/);
  // Stock insuffisant : refus sans débit.
  const food=g.resources.food;g.resources.food=q.ask.food-1;assert.match(g.factions217.help().reason,/Stock insuffisant/);assert.equal(g.resources.food,q.ask.food-1);g.resources.food=food;
  const stock={...g.resources};assert.deepEqual(act.run(),{ok:true});
  for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],stock[k]-(q.ask[k]||0),k);
  assert.equal(g.factions217.reputation('relais'),1);assert.equal(g.factions217.help().ok,false,'un seul don par demande');
  assert.equal(count(notes,'Contrepartie promise à la vague 4 : 5 carburant'),1);assert.match(row(g,'Demande des relais'),/Les Granges doit 5 carburant à la vague 4/);
  // Reprise pendant l'attente : la dette du relais est conservée, rien n'est livré en avance.
  const data=JSON.parse(JSON.stringify(g.serialize()));assert.deepEqual(data.expansions127.modules.factions217.relay,{index:0,stage:'owed',wave:RELAY.firstWave+RELAY.returnWaves});
  assert.equal(g.restoreSave(data),true);
  let fuel=g.resources.fuel;g.wave=RELAY.firstWave+RELAY.returnWaves-1;g.phase='calm';tick(g);assert.equal(g.resources.fuel,fuel);
  g.wave++;g.phase='assault';tick(g);assert.equal(g.resources.fuel,fuel,'pas de livraison pendant l’assaut');
  // Dépôt plein : la livraison attend, rien n'est perdu ni dépassé.
  g.phase='calm';g.resources.fuel=g.storage-1;tick(g);assert.equal(g.resources.fuel,g.storage-1);assert.match(row(g,'Demande des relais'),/dès que le dépôt a la place/);
  g.resources.fuel=fuel;tick(g);assert.equal(g.resources.fuel,fuel+q.back.fuel,'contrepartie exacte, une fois');
  for(let i=0;i<8;i++)tick(g);assert.equal(g.resources.fuel,fuel+q.back.fuel);assert.equal(count(notes,'Les Granges tient parole : 5 carburant'),1);
  assert.match(g.factions217.lastAffair('relais'),/Les Granges a tenu parole/);
  // Demande suivante, laissée sans réponse : l'entente baisse, sans autre sanction.
  g.wave=F.requestWave(1);tick(g);assert.equal(g.factions217.request().relay,'La Rive');
  const before={...g.resources};g.wave++;tick(g);
  assert.equal(g.factions217.request(),null);assert.equal(g.factions217.reputation('relais'),0);assert.equal(count(notes,'La Rive n’a rien reçu'),1);
  for(const k of C.RESOURCE_KEYS)if(k!=='food')assert.equal(g.resources[k],before[k]);
  // Deux dons de suite mènent à l'entente ; la réputation reste bornée.
  for(let i=2;i<7;i++){g.wave=Math.max(g.wave+1,F.requestWave(i));g.phase='calm';tick(g);for(const k of C.RESOURCE_KEYS)g.resources[k]=200;assert.deepEqual(g.factions217.help(),{ok:true});g.wave+=RELAY.returnWaves;tick(g);assert.equal(g.factions217.request(),null);}
  assert.equal(g.factions217.reputation('relais'),R.factions.relais.max);assert.equal(g.factions217.standing('relais'),'Entente');
  assert.deepEqual(F.validate(saved(g)),saved(g));
});

test('factions : don refusé loin du dépôt ou au volant',()=>{
  const g=campaign();g.wave=RELAY.firstWave;tick(g);assert.equal(g.factions217.helpQuote().ok,true);
  const x=g.player.x;g.player.x+=900;assert.match(g.factions217.helpQuote().reason,/au dépôt de D-17/);
  const food=g.resources.food;assert.equal(g.factions217.help().ok,false);assert.equal(g.resources.food,food);g.player.x=x;
  g.state='menu';assert.equal(g.factions217.helpQuote().ok,false);g.state='playing';assert.equal(g.factions217.helpQuote().ok,true);
});

test('factions : une ancienne campagne reste sans faction, et une sauvegarde abîmée est refusée',()=>{
  const g=campaign(),notes=watch(g),data=JSON.parse(JSON.stringify(g.serialize()));
  delete data.expansions127.modules.factions217;assert.equal(g.restoreSave(data),true);
  assert.equal(g.factions217.active(),false);assert.deepEqual(saved(g),none());
  assert.match(g.factions217.overview().summary,/avant l’arrivée des factions/);assert.deepEqual(g.factions217.actions(),[]);
  const v=withVan(g,{});assert.equal(g.factions217.active(),false);
  for(let i=0;i<3;i++){const r=sortie(g,{scrap:60});assert.deepEqual(r.after,r.before);}
  g.wave=RELAY.firstWave+1;g.phase='calm';const stock={...g.resources};for(let i=0;i<8;i++)tick(g);
  for(const k of C.RESOURCE_KEYS)if(k!=='food')assert.equal(g.resources[k],stock[k]);
  assert.equal(g.factions217.help().ok,false);assert.equal(g.factions217.tribute().ok,false);
  assert.deepEqual(saved(g),none());assert.equal(notes.filter(t=>/Rouleurs|motards|relais|Granges/i.test(t)).length,0);assert.equal(v.cargo.scrap,60);
  const broken=JSON.parse(JSON.stringify(g.serialize()));broken.expansions127.modules.factions217={...fresh(),passes:9};
  let restored=false;try{restored=g.restoreSave(broken)===true;}catch(error){assert.match(error.message,/Factions 217/);}assert.equal(restored,false);
  // Une campagne neuve lancée ensuite redevient active.
  g.startNew('standard','4242');g.campaignIntro132?.skip?.();assert.deepEqual(saved(g),fresh());
});

test('factions : carte du panneau de droite, réputation et dernière affaire',()=>{
  const {g,doc:document}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  g.updateUI();const card=document.getElementById('factions217Card');assert.ok(card,'carte montée dans le panneau de droite');
  const text=id=>document.getElementById('factions217-'+id).textContent;
  assert.equal(text('rouleurs'),'Sur les routes · Inconnue');assert.equal(text('relais'),'Les Relais · En contact');assert.equal(card.hidden,false);
  withVan(g,{});sortie(g,{scrap:40});g.updateUI();assert.equal(text('rouleurs'),'Les Rouleurs · Repérée');
  g.wave=RELAY.firstWave;tick(g);g.factions217.help();g.updateUI();assert.equal(text('relais'),'Les Relais · En contact');
  assert.equal(g.factions217.render(),true);
});

test('factions : aucun hasard, aucune horloge, génération du monde intacte, module référencé',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/factions217.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','.random(','rng','localStorage','Date.now','performance.now','setTimeout','setInterval','nextId','.health=','.health-=','damage','zombies','ammo-='])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal((source.match(/g\.resources\[k\]\+=/g)||[]).length,1,'un seul point de crédit : la contrepartie d’un don payé');
  assert.equal((source.match(/C\.spend\(/g)||[]).length,2,'deux débits : le don et le tribut');
  for(const file of ['index.html','sw.js','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(fs.readFileSync(path.join(__dirname,'..',file),'utf8').includes('factions217'),file);
  {const h=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.ok(h.indexOf('src/breach217.js')>0&&h.indexOf('src/breach217.js')<h.indexOf('src/factions217.js'));};
  // Même graine, mêmes lieux : la campagne avec factions n'a rien décalé.
  const a=campaign(),b=campaign();const strip=d=>{const c=JSON.parse(JSON.stringify(d));delete c.expansions127.modules.factions217;delete c.savedAt;return c;};
  const da=a.serialize();withVan(b,{});sortie(b,{scrap:40});
  assert.deepEqual(strip(da).exploration125,strip(b.serialize()).exploration125);assert.deepEqual(da.expeditions.sites,b.serialize().expeditions.sites);
});
