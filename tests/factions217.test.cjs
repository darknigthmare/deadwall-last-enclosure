'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),F=require('../src/factions217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.Factions217Rules,RAID=R.raid,RELAY=R.relay;
// État de la première tranche (v1), puis état v2 : mêmes champs, plus repaires repérés, escorte du retour et effets d'Entente.
const none1=()=>({version:1,active:false,spotted:false,returns:0,exposed:false,passes:0,rep:{rouleurs:0,relais:0},affairs:{rouleurs:null,relais:null},relay:{index:0,stage:'none',wave:0}});
const fresh1=()=>({...none1(),active:true});
const second=()=>({lairs:{rouleurs:false,relais:false},leg:{checks:0,guarded:0},kept:0,entente:null,fate:'free',rally:{stage:'none',wave:0},intel:null,noise:0,traded:-1,recruit:'none'});
const none=()=>({...none1(),version:2,...second()});
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
  // Une sauvegarde v1 est convertie : mêmes valeurs, champs de la deuxième tranche neutres, entretien daté de la dernière affaire.
  assert.deepEqual(F.validate(fresh1()),fresh());assert.deepEqual(F.validate(none1()),none());
  {const none=none1,fresh=fresh1;
  const ok={...fresh(),spotted:true,returns:4,exposed:true,passes:1,rep:{rouleurs:-2,relais:3},affairs:{rouleurs:{code:'robbed',amount:13.5,wave:6},relais:{code:'helped',amount:1,wave:5}},relay:{index:1,stage:'owed',wave:7}};
  const converted={...ok,version:2,...second(),kept:6};
  assert.deepEqual(F.validate(ok),converted);assert.notEqual(F.validate(ok).rep,ok.rep);assert.notEqual(F.validate(ok).affairs.rouleurs,ok.affairs.rouleurs);
  assert.deepEqual(F.validate(converted),converted,'la conversion est stable');
  for(const bad of [null,[],'factions',{},{...ok,version:2},{...ok,active:1},{...ok,extra:1},(({passes,...rest})=>rest)(ok),
    {...ok,returns:-1},{...ok,returns:1.5},{...ok,returns:1e7},{...ok,exposed:'oui'},{...ok,passes:RAID.maxPasses+1},{...ok,passes:-1},
    {...ok,rep:{rouleurs:-4,relais:0}},{...ok,rep:{rouleurs:3,relais:0}},{...ok,rep:{rouleurs:0,relais:-2}},{...ok,rep:{rouleurs:0,relais:4}},{...ok,rep:{rouleurs:0}},{...ok,rep:{rouleurs:0,relais:0,garde:0}},{...ok,rep:{rouleurs:.5,relais:0}},
    {...ok,affairs:{rouleurs:null}},{...ok,affairs:{rouleurs:{code:'helped',amount:0,wave:1},relais:null}},{...ok,affairs:{rouleurs:null,relais:{code:'robbed',amount:0,wave:1}}},
    {...ok,affairs:{rouleurs:{code:'robbed',amount:-1,wave:1},relais:null}},{...ok,affairs:{rouleurs:{code:'robbed',amount:NaN,wave:1},relais:null}},{...ok,affairs:{rouleurs:{code:'robbed',amount:1,wave:1.5},relais:null}},{...ok,affairs:{rouleurs:{code:'robbed',amount:1,wave:1,extra:1},relais:null}},
    {...ok,relay:{index:1,stage:'due',wave:7}},{...ok,relay:{index:-1,stage:'owed',wave:7}},{...ok,relay:{index:1,stage:'none',wave:7}},{...ok,relay:{index:1,stage:'owed'}},{...ok,relay:null},
    {...ok,spotted:false},{...ok,returns:0},{...fresh(),passes:1},{...fresh(),rep:{rouleurs:1,relais:0}},{...fresh(),affairs:{rouleurs:{code:'spotted',amount:0,wave:1},relais:null}},
    {...ok,active:false},{...none(),rep:{rouleurs:0,relais:1}},{...none(),relay:{index:1,stage:'none',wave:0}},{...none(),exposed:true}])assert.throws(()=>F.validate(bad),/Factions 217/);}
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
  // Débits : le don, le tribut (première tranche), puis le renseignement, le ralliement, l'assaut et l'échange — tous des actions annoncées.
  assert.equal((source.match(/C\.spend\(/g)||[]).length,6,'six débits, chacun derrière une action annoncée');
  assert.equal((source.match(/g\.resources\[k\]-=/g)||[]).length,0,'aucun débit hors C.spend');
  for(const file of ['index.html','sw.js','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(fs.readFileSync(path.join(__dirname,'..',file),'utf8').includes('factions217'),file);
  {const h=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.ok(h.indexOf('src/breach217.js')>0&&h.indexOf('src/breach217.js')<h.indexOf('src/factions217.js'));};
  // Même graine, mêmes lieux : la campagne avec factions n'a rien décalé.
  const a=campaign(),b=campaign();const strip=d=>{const c=JSON.parse(JSON.stringify(d));delete c.expansions127.modules.factions217;delete c.savedAt;return c;};
  const da=a.serialize();withVan(b,{});sortie(b,{scrap:40});
  assert.deepEqual(strip(da).exploration125,strip(b.serialize()).exploration125);assert.deepEqual(da.expeditions.sites,b.serialize().expeditions.sites);
});

// --- Deuxième tranche : repaires, repérage, effets d'Entente, escorte hors des murs, assaut, ralliement, tribut. ---
const G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js'),M=require('../src/remarkable217.js'),T=require('../src/tactics.js');
const OPT={detailVersion:1,ecologyVersion:1,hydrologyVersion:1},copy=v=>JSON.parse(JSON.stringify(v));
const titleOf=p=>String(p.name).split(' · ')[0].split(' — ')[0];
const step=(g,n=6)=>{for(let i=0;i<n;i++)g.update(.05);};
// Remplace l'état du module par une sauvegarde validée (seul moyen d'écrire l'état, comme une reprise).
function withState(g,patch,edit){
  const data=copy(g.serialize());data.expansions127.modules.factions217={...saved(g),...patch};if(edit)edit(data);
  assert.equal(g.restoreSave(data),true);return g;
}
const known=(returns=1,rep=0,extra={})=>({spotted:true,returns,rep:{rouleurs:rep,relais:0},affairs:{rouleurs:{code:'spotted',amount:0,wave:1},relais:null},...extra});
// Place le commandant en sortie, à pied, devant la façade du lieu, par une sauvegarde validée.
function enterAt(g,p,edit){
  const base=JSON.stringify(g.serialize());
  for(const d of [3,5,8,12,20,30])for(const t of [.5,.2,.8]){
    const data=JSON.parse(base),q=G.global(p,p.w*t,p.h+d);
    Object.assign(data.frontier,{active:true,anchor:{x:data.player.x,y:data.player.y},x:q.x,y:q.y,z:0,inside:null});if(edit)edit(data);
    try{if(g.restoreSave(data)!==false&&g.frontier.position().active)return true;}catch(error){/* point refusé : essai suivant */}
  }
  return false;
}
function standNear(g,v,d){
  const base=JSON.stringify(g.serialize());
  for(const k of [0,1,-1,2,-2,3,-3,4])for(let a=0;a<16;a++){
    const r=d+k*15,t=a/16*Math.PI*2,data=JSON.parse(base);
    Object.assign(data.frontier,{active:true,anchor:{x:data.player.x,y:data.player.y},x:v.x+Math.cos(t)*r,y:v.y+Math.sin(t)*r,z:0,inside:null});
    try{if(g.restoreSave(data)!==false&&g.frontier.position().active)return Math.hypot(g.frontier.position().x-v.x,g.frontier.position().y-v.y);}catch(error){/* point refusé : essai suivant */}
  }
  return NaN;
}
const home=g=>{const data=copy(g.serialize());data.frontier.active=false;data.frontier.anchor=null;assert.equal(g.restoreSave(data),true);assert.equal(g.frontier.active(),false);};
// Fusiliers posés à des points donnés (positions libres de la carte locale).
// Le fusilier est créé sur la première place libre proche du point (décor), puis posé exactement au point voulu.
function soldiersAt(g,points){return points.map(p=>{
  let u=null;for(let r=0;r<=160&&!u;r+=16)for(let a=0;a<8&&!u;a++)u=g.createProtectedSurvivor('soldier',p.x+Math.cos(a*Math.PI/4)*r,p.y+Math.sin(a*Math.PI/4)*r);
  assert.ok(u,'place libre près de '+p.x+','+p.y);u.x=p.x;u.y=p.y;return u;});}
// Enceinte de palissades réelle autour du centre, porte au nord (même construction que tests/districts.test.cjs).
function enclose(g,r){
  const center=g.core(),cells=T.footprint(center),placed=[];
  const put=(type,gx,gy)=>{const B=center.constructor,b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
  const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
  for(let x=x0;x<=x1;x++){if(x===gateX)put('gate',x,y0);else if(x!==gateX+1)put('woodWall',x,y0);put('woodWall',x,y1);}
  for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  g.world.navigationVersion++;g.refreshMetrics(true);
  return{placed,east:(x1+1)*C.TILE,gate:{x:(gateX+1)*C.TILE,y:y0*C.TILE}};
}
// Retour réaliste : le fourgon part au-delà du seuil de sortie, puis rentre par l'est à pas de `stepPx`, chaque pas étant un tick.
function drive(g,cargo,{stepPx=8,follow=null}={}){
  const v=g.expeditions.car(),core=g.core(),z=g.factions217.approach();
  Object.assign(v.cargo,cargo);v.y=core.y;v.x=core.x+z.away+40;tick(g);
  const before={...v.cargo};
  for(let d=z.away+40;d>=z.near-12;d-=stepPx){v.x=core.x+d;if(follow)follow(v);tick(g);}
  return{before,after:{...v.cargo}};
}

test('repaires : lieu régional déjà généré, compatible, ni remarquable ni infecté, déterministe et sans écriture',()=>{
  for(const seed of [17117,42]){
    const w=W.create(seed,8,OPT),before=JSON.stringify(w.pois),keys=Object.keys(w).join();
    const random=Math.random;let draws=0;Math.random=()=>{draws++;return random();};
    let l;try{l=F.lairs(w);}finally{Math.random=random;}
    assert.equal(draws,0,'aucun tirage');assert.equal(JSON.stringify(w.pois),before,'aucune écriture dans le monde');assert.equal(Object.keys(w).join(),keys);
    assert.equal(F.lairs(w),l,'gardé par monde');assert.deepEqual(F.lairs(W.create(seed,8,OPT)),l,'même graine, mêmes repaires');
    const marked=new Set(M.select(w).map(e=>e.id));
    assert.notEqual(l.rouleurs.id,l.relais.id);
    for(const id of F.IDS){
      const e=l[id],p=w.pois.find(q=>q.id===e.id);assert.ok(p,'lieu existant : '+e.id);
      assert.deepEqual([e.name,e.x,e.y],[p.name,p.x,p.y],'nom et position d’origine');
      assert.match(titleOf(p),id==='rouleurs'?/^garage|^casse automobile|station-service|^entrep[ôo]t/i:/^ferme|^corps de ferme|^hameau|^long[èe]re|^exploitation mara/i,seed+' '+id+' : '+p.name);
      assert.notEqual(p.occupation,'infected');assert.equal(w.threatCount(p),0,'aucun occupant infecté');assert.equal(marked.has(p.id),false,'jamais un lieu remarquable');
      if(id==='rouleurs')assert.notEqual(p.occupation,'allied');
      const d=Math.hypot(p.x-w.home.x,p.y-w.home.y);assert.ok(d>=R.lair.minDistance&&d<=R.lair.maxDistance,'distance raisonnable : '+Math.round(d));
    }
  }
  assert.notDeepEqual(F.lairs(W.create(17117,8,OPT)).rouleurs.id,F.lairs(W.create(42,8,OPT)).rouleurs.id,'deux graines, deux voisinages');
  assert.deepEqual(F.lairs(null),{rouleurs:null,relais:null});
  // En jeu : même repaire que la fonction pure ; un avant-poste ne peut pas tenir un lieu sans occupant infecté.
  const g=campaign(),l=F.lairs(g.frontier.world());
  assert.equal(g.factions217.lair('rouleurs').id,l.rouleurs.id);assert.equal(g.factions217.lair('rouleurs').sighted,false);
  assert.equal(g.outposts217.candidates().includes(l.rouleurs.id),false);assert.equal(g.outposts217.candidates().includes(l.relais.id),false);
  assert.match(row(g,'Repaire des Rouleurs'),/^Inconnu : il se repère en sortie, à 600 m/);assert.deepEqual(g.factions217.marks(),[]);
});

test('repaires : repérés en sortie seulement, à portée ; repère d’atlas ensuite, sauvegardé',()=>{
  const g=campaign(),notes=watch(g),l=g.factions217.lair('rouleurs');
  // Depuis la cité : rien, quel que soit le temps passé.
  step(g,30);assert.equal(saved(g).lairs.rouleurs,false);
  const far=standNear(g,l,R.lair.spot+250);assert.ok(far>R.lair.spot,'position à '+far);step(g,30);
  assert.equal(saved(g).lairs.rouleurs,false,'trop loin');assert.equal(count(notes,'Repaire repéré'),0);
  const close=standNear(g,l,R.lair.spot-150);assert.ok(close<=R.lair.spot,'position à '+close);step(g,30);
  assert.equal(saved(g).lairs.rouleurs,true);assert.equal(count(notes,'Repaire repéré : '+l.title),1);assert.match(notes.find(t=>t.includes('Repaire repéré')),/une bande motorisée vit ici/);
  const mark=g.factions217.marks().find(m=>m.id==='rouleurs');assert.equal(mark.x,l.x);assert.match(mark.text,/^REPAIRE · /);
  assert.ok(row(g,'Repaire des Rouleurs').startsWith(l.title+' · cap '),row(g,'Repaire des Rouleurs'));
  // Repère dessiné sur l'atlas (contexte factice) : lecture seule.
  const calls=[],ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:40}):typeof k==='string'?(...a)=>calls.push(k):undefined,set:()=>true});
  const before=JSON.stringify(saved(g));g.factions217.drawAtlas(ctx,{screen:()=>({x:50,y:50}),width:400,height:300,scale:.1});
  assert.ok(calls.includes('fillText'));assert.equal(JSON.stringify(saved(g)),before);
  // Rentré : le repère reste, une seule annonce.
  home(g);step(g,20);assert.equal(saved(g).lairs.rouleurs,true);assert.equal(count(notes,'Repaire repéré'),1);
});

test('escorte : mesurée pendant tout le retour, hors des murs ; la garnison des portes ne compte pas',()=>{
  const g=campaign(),notes=watch(g),v=withVan(g,{}),core=g.core();
  // Sans enceinte : les abords et le seuil de la première tranche.
  assert.deepEqual(g.factions217.approach(),{away:RAID.awayDistance,near:RAID.ambushDistance});
  const ring=enclose(g,18),z=g.factions217.approach();
  assert.ok(z.near>=ring.east-core.x+R.escort.margin-1e-9&&z.near>RAID.ambushDistance,'abords au-delà de l’enceinte extérieure : '+JSON.stringify(z));
  assert.equal(z.away-z.near,RAID.awayDistance-RAID.ambushDistance);
  // Hors des murs : dedans non, au pied du mur non, au-delà de `beyond` oui.
  const probe=(x,y)=>g.factions217.outside({x,y});
  assert.equal(probe(core.x+200,core.y+300),false,'dans l’enceinte');assert.equal(probe(ring.gate.x,ring.gate.y-20),false,'devant la porte');
  assert.equal(probe(ring.east+40,core.y),false,'au pied du mur');assert.equal(probe(ring.east+R.escort.beyond+30,core.y),true);
  // Deux retours chargés : repéré, compté.
  drive(g,{wood:70});drive(g,{});assert.equal(g.factions217.returns(),2);
  // Garnison aux portes et fusiliers postés aux seuls abords : le barrage tombe quand même.
  const gate=soldiersAt(g,[{x:ring.gate.x-40,y:ring.gate.y-24},{x:ring.gate.x+40,y:ring.gate.y-24}]);
  const late=soldiersAt(g,[{x:core.x+z.near-10,y:core.y+150},{x:core.x+z.near-10,y:core.y-150}]);
  let r=drive(g,{});assert.equal(g.factions217.returns(),3);
  near(C.bagTotal(r.before)-C.bagTotal(r.after),Math.min(C.bagTotal(r.before)*RAID.share,RAID.maxLoss),'escorte arrivée trop tard : barrage');
  assert.equal(count(notes,'devant l’escorte'),0);
  // Une section envoyée sur la route, hors des murs, couvre tout le retour : le barrage est levé sans perte.
  g.units=g.units.filter(u=>!late.includes(u));
  const mid=(z.away+z.near)/2,section=soldiersAt(g,[{x:core.x+mid,y:core.y+100},{x:core.x+mid,y:core.y-100}]);
  Object.assign(v.cargo,bag({wood:70}));drive(g,{});drive(g,{});r=drive(g,{});
  assert.deepEqual(r.after,r.before,'rien de pris');assert.equal(count(notes,'devant l’escorte qui a suivi le fourgon hors des murs'),1);
  // Une escorte qui suit le fourgon pas à pas vaut aussi ; un seul fusilier ne suffit pas.
  g.units=g.units.filter(u=>!section.includes(u));
  const pair=soldiersAt(g,[{x:core.x+z.away,y:core.y+120},{x:core.x+z.away,y:core.y-120}]);
  drive(g,{});drive(g,{});r=drive(g,{},{follow:van=>{pair[0].x=van.x;pair[1].x=van.x;}});
  assert.deepEqual(r.after,r.before);assert.equal(count(notes,'devant l’escorte'),2);
  pair[1].dead=true;drive(g,{});drive(g,{});r=drive(g,{},{follow:van=>{pair[0].x=van.x;}});
  assert.ok(C.bagTotal(r.after)<C.bagTotal(r.before),'un seul fusilier : barrage');
  assert.ok(gate.every(u=>!u.dead),'la garnison des portes n’a pas bougé');
  // L'état de l'escorte est sauvegardé pendant le retour, puis remis à zéro.
  pair[1].dead=false;Object.assign(v.cargo,bag({wood:70}));v.x=core.x+z.away+40;tick(g);pair[0].x=pair[1].x=core.x+z.away-(z.away-z.near)/R.escort.checks-5;v.x=pair[0].x;tick(g);
  assert.deepEqual(saved(g).leg,{checks:1,guarded:1});const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.deepEqual(saved(g).leg,{checks:1,guarded:1});
  const w=g.expeditions.car();w.x=core.x+z.away+40;tick(g);assert.deepEqual(saved(g).leg,{checks:0,guarded:0},'reparti au large : tout recommence');
});

test('Entente des Rouleurs : plus de barrage, renseignement vendu contre carburant, entretien par des actes',()=>{
  const g=campaign(),notes=watch(g);withVan(g,{});
  withState(g,known(2,R.ententeAt,{kept:1}));assert.equal(g.factions217.standing('rouleurs'),'Entente');
  const stock={...g.resources};let r=sortie(g,{wood:70});
  assert.deepEqual(r.after,r.before,'pas de barrage en Entente');assert.equal(g.factions217.passes(),0);assert.equal(count(notes,'en Entente, ils laissent passer le fourgon'),1);
  assert.match(g.factions217.lastAffair('rouleurs'),/Entente, le fourgon passe/);
  assert.equal(saved(g).entente,g.wave,'Entente datée');
  // Renseignement : la prochaine vague menée d'abord, un par vague, payé au stock.
  const act=g.factions217.actions().find(a=>a.id==='intel');assert.ok(act,'action proposée');assert.equal(act.disabled,false,act.reason);
  const led=g.abominations217.next();assert.ok(Number.isInteger(led));
  g.resources.fuel=50;let res=act.run();assert.equal(res.ok,true);assert.deepEqual(res.intel,{kind:'led',ref:led,wave:g.wave});
  assert.equal(g.resources.fuel,50-R.intel.cost.fuel);assert.match(notes.at(-1),new RegExp('vague '+led+' menée : la Meneuse rassemblera la horde (au nord|à l’est|au sud|à l’ouest)'));
  assert.match(g.factions217.intelQuote().reason,/Un renseignement par vague/);assert.equal(g.resources.fuel,50-R.intel.cost.fuel);
  // Vague suivante : la même vague menée n'est pas revendue ; un lieu remarquable pas encore repéré l'est.
  g.wave++;res=g.factions217.buyIntel();assert.equal(res.ok,true,res.reason);assert.equal(res.intel.kind,'site');
  const site=g.remarkable217.list().find(e=>e.id===res.intel.ref);assert.ok(site&&!site.sighted);
  assert.match(notes.at(-1),/Renseignement des Rouleurs, payé 8 carburant : .*, cap (N|NE|E|SE|S|SO|O|NO) à .* de D-17/);
  assert.equal(g.remarkable217.list().find(e=>e.id===site.id).sighted,false,'un renseignement ne repère pas le lieu : le repérage se fait en sortie');
  for(const k of C.RESOURCE_KEYS)if(!['fuel','food'].includes(k))assert.equal(g.resources[k],stock[k],k);
  // Sans tribut ni achat pendant `memory` vagues : un cran de moins, l'Entente est rompue et annoncée.
  g.wave+=R.entente.memory;tick(g);
  assert.equal(g.factions217.reputation('rouleurs'),R.ententeAt-1);assert.equal(saved(g).entente,null);assert.equal(count(notes,'l’Entente est rompue'),1);
  assert.match(g.factions217.intelQuote().reason,/qu’en Entente/);assert.equal(g.factions217.actions().some(a=>a.id==='intel'),false);
  assert.deepEqual(F.validate(saved(g)),saved(g));
});

test('ralliement des Rouleurs : demandé après une Entente tenue, payé en nourriture et logements',()=>{
  const g=campaign(),notes=watch(g);withVan(g,{});
  withState(g,known(2,R.ententeAt,{kept:g.wave}));tick(g);const since=saved(g).entente;assert.equal(since,g.wave);
  assert.match(g.factions217.rallyQuote().reason,/n’ont rien demandé/);
  // L'Entente se tient par des achats de renseignement, une vague sur deux.
  for(let w=since+1;w<since+R.rally.afterWaves;w++){g.wave=w;tick(g);if(w%2===0){g.resources.fuel=50;assert.equal(g.factions217.buyIntel().ok,true,'vague '+w);}assert.equal(saved(g).rally.stage,'none','vague '+w);}
  g.wave=since+R.rally.afterWaves;tick(g);
  assert.deepEqual(saved(g).rally,{stage:'asked',wave:g.wave});assert.equal(count(notes,'Les Rouleurs demandent à rejoindre D-17'),1);
  const act=g.factions217.actions().find(a=>a.id==='rally');assert.ok(act);assert.match(act.description,/3 fusiliers de plus, contre 40 nourriture et 3 logements/);
  // Logements comptés, refus sans débit.
  g.housing=g.population+R.rally.members-1;g.resources.food=100;assert.match(g.factions217.rallyQuote().reason,/Logements insuffisants/);assert.equal(g.resources.food,100);
  g.housing=g.population+R.rally.members;const soldiers=g.units.filter(u=>u.kind==='soldier').length;
  assert.deepEqual(g.factions217.rally(),{ok:true});
  assert.equal(g.units.filter(u=>u.kind==='soldier').length,soldiers+R.rally.members);assert.equal(g.resources.food,100-R.rally.cost.food);
  assert.equal(g.factions217.fate(),'rallied');assert.equal(g.factions217.standing('rouleurs'),'Ralliée');
  assert.match(row(g,'Route du retour'),/les Rouleurs vivent à D-17/);assert.equal(g.factions217.tributeQuote().ok,false);
  // Plus de barrage ensuite, plus de retour compté ; leurs éclaireurs vendent toujours.
  const returns=g.factions217.returns();for(let i=0;i<3;i++){const r=sortie(g,{wood:60});assert.deepEqual(r.after,r.before);}
  assert.equal(g.factions217.returns(),returns);g.wave++;g.resources.fuel=50;assert.equal(g.factions217.intelQuote().ok,true,g.factions217.intelQuote().reason);
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.equal(g.factions217.fate(),'rallied');assert.deepEqual(F.validate(saved(g)),saved(g));
});

test('assaut du repaire : en sortie, payé trois fois, définitif ; refusé sans repérage ni section',()=>{
  const g=campaign(),notes=watch(g),l=g.factions217.lair('rouleurs'),p=g.frontier.world().pois.find(q=>q.id===l.id);
  withVan(g,{});
  // Six fusiliers à D-17 et des munitions au stock.
  const core=g.core(),pts=[];for(let i=0;i<R.assault.soldiers;i++)pts.push({x:core.x-160+i*60,y:core.y+190});soldiersAt(g,pts);
  g.resources.ammo=100;g.resources.fuel=10;
  assert.match(g.factions217.assaultQuote().reason,/Personne ne sait encore/);
  withState(g,known(1,0));
  assert.match(g.factions217.assaultQuote().reason,/n’a pas été repéré/);
  assert.ok(enterAt(g,p),'devant le repaire');step(g,4);assert.equal(saved(g).lairs.rouleurs,true);
  const q=g.factions217.assaultQuote();assert.equal(q.ok,true,q.reason);assert.equal(q.losses,R.assault.losses);
  const act=g.factions217.actions().find(a=>a.id==='assault');assert.match(act.description,/30 munitions prises au stock, 2 fusiliers de la section tués, la cité s’entend de plus loin pendant 2 vagues/);
  // Section incomplète : refus sans rien prendre.
  const extra=g.units.filter(u=>u.kind==='soldier').at(-1);extra.dead=true;
  assert.match(g.factions217.assaultQuote().reason,/Il faut 6 fusiliers/);assert.equal(g.resources.ammo,100);extra.dead=false;
  g.refreshMetrics(true);
  const before={signature:g.signature,soldiers:g.units.filter(u=>u.kind==='soldier'&&!u.dead).length,ammo:g.resources.ammo,fuel:g.resources.fuel,wave:g.wave};
  const plan=sig=>C.wavePlan(g.wave,g.difficulty,sig).total;
  assert.deepEqual(g.factions217.assault(),{ok:true,losses:R.assault.losses});
  assert.equal(g.units.filter(u=>u.kind==='soldier'&&!u.dead).length,before.soldiers-R.assault.losses,'fusiliers tués');
  assert.equal(g.resources.ammo,before.ammo-R.assault.cost.ammo,'munitions');
  near(g.signature,before.signature-2*R.assault.losses+R.assault.signature,'bruit : signature');
  assert.ok(plan(g.signature)>plan(before.signature-2*R.assault.losses),'hordes plus nombreuses');
  assert.equal(g.resources.fuel,before.fuel+R.assault.cache.fuel,'stock du repaire rentré au dépôt');
  assert.equal(g.factions217.fate(),'destroyed');assert.equal(g.factions217.standing('rouleurs'),'Détruite');assert.equal(count(notes,'Repaire des Rouleurs pris et vidé'),1);
  assert.match(g.factions217.marks().find(m=>m.id==='rouleurs').text,/^REPAIRE VIDÉ/);
  assert.match(g.factions217.assaultQuote().reason,/déjà vide/);
  // Définitif : plus de tribut ni de renseignement, plus de barrage, plus de retour compté.
  home(g);
  assert.match(g.factions217.tributeQuote().reason,/ne sont plus/);assert.match(g.factions217.intelQuote().reason,/ne sont plus/);
  assert.deepEqual(g.factions217.actions().filter(a=>['tribute','intel','rally','assault'].includes(a.id)),[]);
  const returns=g.factions217.returns();for(let i=0;i<3;i++){const r=sortie(g,{wood:60});assert.deepEqual(r.after,r.before);}assert.equal(g.factions217.returns(),returns);
  // Le bruit dure les vagues annoncées, puis s'éteint.
  g.wave=before.wave+R.assault.noiseWaves-1;tick(g);g.refreshMetrics(true);const loud=g.signature;
  g.wave++;tick(g);g.refreshMetrics(true);near(loud-g.signature,R.assault.signature,'bruit éteint');assert.equal(saved(g).noise,0);
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.equal(g.factions217.fate(),'destroyed');
  // Bande hostile : alertée, elle tue un fusilier de plus.
  const h=campaign();withVan(h,{});soldiersAt(h,pts);h.resources.ammo=100;
  withState(h,{...known(1,R.hostileAt),lairs:{rouleurs:true,relais:false}});const hp=h.frontier.world().pois.find(q=>q.id===h.factions217.lair('rouleurs').id);
  assert.ok(enterAt(h,hp));assert.equal(h.factions217.assaultQuote().losses,R.assault.losses+R.assault.alerted);
});

test('Entente des Relais : un échange par vague, une recrue une seule fois',()=>{
  const g=campaign(),notes=watch(g);
  assert.match(g.factions217.tradeQuote().reason,/qu’en Entente/);assert.match(g.factions217.recruitQuote().reason,/avant l’Entente/);
  withState(g,{rep:{rouleurs:0,relais:R.ententeAt}});tick(g);
  assert.equal(saved(g).recruit,'offered');assert.equal(count(notes,'une famille propose'),1);
  g.resources.wood=40;const food=g.resources.food;
  assert.deepEqual(g.factions217.trade(),{ok:true});assert.equal(g.resources.wood,40-R.exchange.give.wood);near(g.resources.food,food+R.exchange.get.food);
  assert.match(g.factions217.tradeQuote().reason,/Un échange par vague/);assert.equal(g.factions217.trade().ok,false);assert.equal(g.resources.wood,40-R.exchange.give.wood);
  g.wave++;g.resources.wood=R.exchange.give.wood-1;assert.match(g.factions217.tradeQuote().reason,/Stock insuffisant/);
  g.resources.wood=40;g.resources.food=g.storage;assert.match(g.factions217.tradeQuote().reason,/pas la place/);assert.equal(g.resources.wood,40);
  g.resources.food=food;
  // Recrue : un ouvrier, un logement, une seule fois.
  const workers=g.units.filter(u=>u.kind==='worker').length;g.housing=g.population;assert.match(g.factions217.recruitQuote().reason,/Logements/);
  g.housing=g.population+1;assert.deepEqual(g.factions217.recruit(),{ok:true});
  assert.equal(g.units.filter(u=>u.kind==='worker').length,workers+1);assert.equal(saved(g).recruit,'taken');assert.match(g.factions217.recruitQuote().reason,/déjà rejoint/);
  for(let i=0;i<4;i++){g.wave++;tick(g);}assert.equal(count(notes,'une famille propose'),1,'jamais reproposée');
  assert.deepEqual(F.validate(saved(g)),saved(g));
});

test('tribut : il suit l’âge de la cité et les vagues, borné sous le plafond d’un barrage',()=>{
  const S=R.tributeScale;
  assert.deepEqual(F.tributeCost(0,1),bag({fuel:RAID.tribute.fuel}),'la cité naissante paie le tribut de la première tranche');
  assert.equal(F.tributeCost(3,12).fuel,RAID.tribute.fuel+3*S.perTier+2*S.perStep);
  assert.equal(F.tributeCost(20,500).fuel,S.max);assert.ok(S.max<RAID.maxLoss,'jamais plus cher que le pire barrage');
  for(let age=0;age<12;age++)for(let w=0;w<60;w+=7)assert.ok(F.tributeCost(age,w).fuel<=F.tributeCost(age+1,w+1).fuel,'croissant');
  const g=campaign();withVan(g,{});sortie(g,{wood:60});g.wave=11;g.resources.fuel=50;
  const cost=F.tributeCost(g.tier.id,11).fuel;assert.ok(cost>RAID.tribute.fuel);
  assert.match(row(g,'Route du retour'),new RegExp('tribut versé d’avance \\('+cost+' carburant\\)'));
  assert.deepEqual(g.factions217.tribute(),{ok:true});assert.equal(g.resources.fuel,50-cost);
  assert.match(g.factions217.lastAffair('rouleurs'),new RegExp('tribut versé \\('+cost+' carburant\\)'));
});

test('conversion : une campagne de la première tranche reprend en v2, mêmes repaires, monde identique',()=>{
  const g=campaign(),world=JSON.stringify(g.frontier.world().pois.map(p=>[p.id,p.name,p.x,p.y,p.occupation]));
  const v1={...fresh1(),spotted:true,returns:4,passes:1,rep:{rouleurs:1,relais:2},affairs:{rouleurs:{code:'tribute',amount:6,wave:3},relais:{code:'helped',amount:1,wave:5}},relay:{index:1,stage:'owed',wave:7}};
  const data=copy(g.serialize());data.expansions127.modules.factions217=v1;assert.equal(g.restoreSave(data),true);
  assert.deepEqual(saved(g),{...v1,version:2,...second(),kept:3});assert.equal(g.factions217.passes(),1);assert.equal(g.factions217.standing('relais'),'Entente');
  assert.equal(g.factions217.lair('rouleurs').id,F.lairs(g.frontier.world()).rouleurs.id);
  tick(g);assert.equal(saved(g).recruit,'offered','les effets d’Entente valent aussi pour une campagne convertie');
  assert.equal(JSON.stringify(g.frontier.world().pois.map(p=>[p.id,p.name,p.x,p.y,p.occupation])),world);
  // Une v2 abîmée est refusée.
  for(const patch of [{fate:'gone'},{leg:{checks:R.escort.checks+1,guarded:0}},{leg:{checks:1,guarded:2}},{intel:{kind:'site',ref:'X1',wave:1}},{noise:3},{rally:{stage:'asked',wave:4}},{traded:-2},{recruit:'maybe'},{lairs:{rouleurs:1,relais:false}},{entente:2}]){
    const bad=copy(g.serialize());bad.expansions127.modules.factions217={...saved(g),...patch};
    let ok=false;try{ok=g.restoreSave(bad)===true;}catch(error){assert.match(error.message,/Factions 217/);}assert.equal(ok,false,JSON.stringify(patch));
  }
  assert.throws(()=>F.validate({...fresh(),fate:'destroyed'}),/Factions 217/,'détruits sans être connus');
  assert.throws(()=>F.validate({...fresh(),...known(1,0),fate:'destroyed',passes:1}),/Factions 217/,'un repaire détruit ne garde pas de tribut');
});

test('ancienne campagne : ni repaire, ni repère, ni effet d’Entente, même en sortie',()=>{
  const g=campaign(),notes=watch(g),l=g.factions217.lair('rouleurs');
  const data=copy(g.serialize());delete data.expansions127.modules.factions217;assert.equal(g.restoreSave(data),true);
  assert.equal(g.factions217.lair('rouleurs'),null);assert.deepEqual(g.factions217.marks(),[]);
  standNear(g,l,100);step(g,30);assert.deepEqual(saved(g),none());assert.equal(notes.filter(t=>/Repaire|Relais repéré/.test(t)).length,0);
  for(const q of ['intelQuote','rallyQuote','assaultQuote','tradeQuote','recruitQuote'])assert.match(g.factions217[q]().reason,/ne connaît pas les factions/,q);
  const sig=g.signature;g.refreshMetrics(true);assert.equal(g.signature,sig);
});
