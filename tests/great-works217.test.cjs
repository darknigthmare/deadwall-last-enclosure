'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),G=require('../src/great-works217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.GreatWorks217Rules,T=b=>globalThis.DeadwallTactics.footprint(b);
const none=()=>({version:1,active:false,works:{belfry:{steps:0,left:0,wave:null},necropolis:{steps:0,left:0,wave:null}}});
const fresh=()=>({...none(),active:true});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-9,(message||'')+' : '+a+' ≠ '+b);

test('grands ouvrages : règles gelées dans le cœur, âge de la bible, deux ouvrages en plusieurs tranches',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.works));
  assert.equal(R.startAge,9);assert.equal(C.CITY_TIERS[R.startAge].name,'MÉGAVILLE II','« âge 10 » de la bible, compté à partir de 1');
  assert.ok(R.startAge>C.CityLaws217Rules.startAge);
  assert.deepEqual(G.IDS,['belfry','necropolis']);assert.deepEqual(Object.keys(R.works),G.IDS);
  for(const id of G.IDS){
    const w=R.works[id];assert.ok(Object.isFrozen(w)&&Object.isFrozen(w.steps));assert.ok(w.steps.length>=2,'plusieurs tranches');assert.ok(w.signature>0);
    for(const s of w.steps){
      assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.cost));assert.ok(s.seconds>0);
      const keys=Object.keys(s.cost);assert.ok(keys.length>0);
      for(const k of keys){assert.ok(C.RESOURCE_KEYS.includes(k),k);assert.ok(Number.isInteger(s.cost[k])&&s.cost[k]>0);}
    }
  }
  assert.ok(R.works.belfry.warningSeconds>0&&R.works.necropolis.clearSpeed>1);
});

test('grands ouvrages : état validé strictement, absent des anciennes sauvegardes = inactif',()=>{
  assert.deepEqual(G.validate(undefined),none());assert.deepEqual(G.initial(),none());
  const ok={version:1,active:true,works:{belfry:{steps:1,left:12.5,wave:4},necropolis:{steps:3,left:0,wave:9}}};
  assert.deepEqual(G.validate(ok),ok);assert.notEqual(G.validate(ok).works,ok.works);assert.notEqual(G.validate(ok).works.belfry,ok.works.belfry);
  assert.deepEqual(G.validate(fresh()),fresh());
  assert.equal(G.signature(ok),R.works.necropolis.signature,'seul l’ouvrage achevé pèse');assert.equal(G.signature(fresh()),0);
  const w=(id,patch)=>({...ok,works:{...ok.works,[id]:{...ok.works[id],...patch}}});
  for(const bad of [null,[],'ouvrages',{},{...ok,version:2},{...ok,active:1},{...ok,extra:1},{version:1,active:true},{...ok,works:null},{...ok,works:[]},
    {...ok,works:{belfry:ok.works.belfry}},{...ok,works:{...ok.works,keep:{steps:0,left:0,wave:null}}},{...ok,works:{...ok.works,belfry:null}},
    {...ok,works:{...ok.works,belfry:{steps:1,left:0}}},w('belfry',{extra:1}),w('belfry',{steps:1.5}),w('belfry',{steps:-1}),w('belfry',{steps:4}),
    w('belfry',{left:-1}),w('belfry',{left:NaN}),w('belfry',{left:'3'}),w('belfry',{left:R.works.belfry.steps[1].seconds+1}),
    w('belfry',{wave:null}),w('belfry',{wave:1.5}),w('belfry',{wave:-1}),w('belfry',{wave:1e7}),w('belfry',{steps:0,left:0}),
    w('necropolis',{left:5}),w('necropolis',{wave:null}),{...ok,active:false},{...none(),works:{...none().works,belfry:{steps:0,left:0,wave:2}}}])assert.throws(()=>G.validate(bad),/Grands ouvrages 217 invalides/);
});

function campaign(){const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.__doc=doc;return g;}
const toAge=(g,age)=>{const data=g.serialize();data.urban.peakScore=Math.max(data.urban.peakScore,C.CITY_TIERS[age].requiredScore);data.urban.progression151={version:1,age};assert.equal(g.restoreSave(data),true);g.refreshMetrics(true);assert.equal(g.tier.id,age);};
const step=(g,seconds,dt=.25)=>{for(let t=0;t<seconds-1e-9;t+=dt)g.economyTick(dt);};
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const mine=notes=>notes.filter(t=>/^(Grand ouvrage|Beffroi d’alerte|Nécropole)/.test(t));
const state=g=>g.serialize().expansions127.modules.greatWorks217,works=g=>state(g).works;
const row=(g,label)=>g.greatWorks217.overview().rows.find(r=>r.label===label).value;
const RICH={wood:5000,scrap:5000,stone:5000,food:300,fuel:1000,ammo:100,medicine:10};
const stock=g=>{Object.assign(g.resources,RICH);};
function megacity(age=R.startAge){const g=campaign();toAge(g,age);stock(g);g.phase='calm';g.phaseTime=1e6;return g;}
const launch=(g,id)=>{const result=g.greatWorks217.launch(id);assert.deepEqual(result,{ok:true},id+' : '+result.reason);};
// Bâtit un ouvrage entier : une tranche par nuit.
function build(g,id){for(const s of R.works[id].steps){stock(g);launch(g,id);step(g,s.seconds);g.wave++;}assert.equal(g.greatWorks217.done(id),true);}
function wallWithWorker(g){
  const type=Object.values(C.BUILDINGS).find(d=>d.wall&&!d.gate).id,core=g.core(),B=core.constructor;
  const wall=new B(g.nextId++,type,T(core).x+10,T(core).y,0,1);wall.health=wall.def.health;g.world.add(wall);g.refreshMetrics(true);
  const worker=g.units.find(u=>u.kind==='worker'),point=g.workerCleanupPoint(worker,wall);worker.x=point.x;worker.y=point.y;
  assert.ok(wall.completed&&g.workerCanWorkAt(worker,point,C.WORKER_RULES.cleanupRange));return {wall,worker};
}
// Fait passer le moteur du calme à l'alerte et rend la durée d'alerte obtenue.
function alert(g){g.phase='calm';g.phaseTime=.01;g.updateDirector(.02);assert.equal(g.phase,'warning');return g.phaseTime;}

test('grands ouvrages : enregistré, actif en nouvelle campagne, fermé avant Mégaville II',()=>{
  const g=campaign(),notes=watch(g),W=g.greatWorks217;
  assert.ok(g.expansions.get('greatWorks217'));assert.equal(W.active(),true);assert.equal(W.open(),false);
  assert.match(W.overview().summary,/viendront à l’âge Mégaville ii/);assert.deepEqual(W.actions(),[]);
  toAge(g,R.startAge-1);stock(g);g.phase='calm';
  assert.equal(W.open(),false);assert.deepEqual(W.actions(),[]);
  for(const id of G.IDS){const q=W.launch(id);assert.equal(q.ok,false);assert.match(q.reason,/viendront/);}
  assert.equal(W.launch('tour').reason,'Ouvrage inconnu.');
  assert.deepEqual({...g.resources},RICH,'rien n’est payé');assert.deepEqual(state(g),fresh());assert.equal(mine(notes).length,0);
  assert.equal(W.marks().length,0);
});

test('grands ouvrages : une tranche paie exactement son coût, se construit, et attend la nuit suivante',()=>{
  const g=megacity(),notes=watch(g),W=g.greatWorks217,steps=R.works.belfry.steps,wave=g.wave;
  assert.equal(W.open(),true);assert.deepEqual(W.actions().map(a=>a.id),['launch-belfry','launch-necropolis']);
  assert.match(row(g,'Beffroi d’alerte'),/^Non commencé — Effet : alerte avant l’assaut \+8 s\. Prix : signature \+120/);
  assert.equal(W.actions()[0].disabled,false);assert.match(W.actions()[0].label,/tranche 1 sur 3 : Beffroi/);
  launch(g,'belfry');
  const paid={...RICH};for(const [k,v] of Object.entries(steps[0].cost))paid[k]-=v;
  assert.deepEqual({...g.resources},paid,'coût exact, aucune autre ressource touchée');
  assert.deepEqual(works(g).belfry,{steps:0,left:steps[0].seconds,wave});assert.equal(mine(notes).length,1);
  assert.match(W.launch('belfry').reason,/en chantier/);assert.deepEqual({...g.resources},paid);
  assert.match(row(g,'Beffroi d’alerte'),/^Tranche 1 sur 3 en chantier · 01:00/);
  // Le chantier s'arrête de l'alerte à la fin de l'assaut, et sans ouvrier.
  step(g,10);near(works(g).belfry.left,steps[0].seconds-10);
  for(const phase of ['warning','assault']){g.phase=phase;step(g,5);near(works(g).belfry.left,steps[0].seconds-10,phase);assert.match(W.status('belfry'),/arrêté pendant l’assaut/);}
  g.phase='aftermath';step(g,5);near(works(g).belfry.left,steps[0].seconds-15,'le chantier reprend après l’assaut');
  const crew=g.units.filter(u=>u.kind==='worker');for(const u of crew)u.regionAbsent=true;
  g.phase='calm';step(g,5);near(works(g).belfry.left,steps[0].seconds-15,'aucun ouvrier présent');assert.match(W.status('belfry'),/aucun ouvrier/);
  for(const u of crew)delete u.regionAbsent;
  // Reprise au milieu d'une tranche : elle continue, sans annonce rejouée.
  const saved=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(saved),true);stock(g);g.phase='calm';g.phaseTime=1e6;
  near(works(g).belfry.left,steps[0].seconds-15);
  step(g,steps[0].seconds-15);assert.deepEqual(works(g).belfry,{steps:1,left:0,wave});
  assert.equal(notes.filter(t=>t.startsWith('Beffroi d’alerte : tranche 1 sur 3 construite')).length,1);
  // Une seule tranche par nuit.
  const before={...g.resources};assert.match(W.launch('belfry').reason,/Une seule tranche par nuit/);assert.deepEqual({...g.resources},before);
  g.wave=wave+1;g.phase='warning';assert.match(W.launch('belfry').reason,/de l’alerte à la fin de l’assaut/);g.phase='assault';assert.equal(W.launch('belfry').ok,false);
  g.phase='calm';g.resources.stone=steps[1].cost.stone-1;assert.match(W.launch('belfry').reason,/Stock insuffisant/);assert.equal(W.actions()[0].disabled,true);
  stock(g);const core=g.core(),x=g.player.x,y=g.player.y;g.player.x=core.x+C.TILE*40;g.player.y=core.y+C.TILE*40;
  assert.match(W.launch('belfry').reason,/dépôt/);g.player.x=x;g.player.y=y;assert.deepEqual({...g.resources},RICH);
  launch(g,'belfry');assert.deepEqual(works(g).belfry,{steps:1,left:steps[1].seconds,wave:wave+1});
  // Les deux ouvrages avancent en même temps, chacun à sa tranche.
  launch(g,'necropolis');step(g,60);assert.equal(works(g).belfry.steps,2);assert.equal(works(g).necropolis.steps,1);
  assert.equal(W.done('belfry'),false);assert.match(row(g,'Beffroi d’alerte'),/^2 tranches sur 3 · sans effet avant la dernière/);
});

test('grands ouvrages : beffroi, aucun effet inachevé ; achevé, alerte allongée et signature exacte',()=>{
  const g=megacity(),notes=watch(g),W=g.greatWorks217,B=R.works.belfry;
  const base=10+(g.hasResearch('recon')?5:0);g.refreshMetrics(true);const signature=g.signature;
  // Deux tranches sur trois : rien ne change.
  for(const s of B.steps.slice(0,2)){stock(g);launch(g,'belfry');step(g,s.seconds);g.wave++;}
  assert.equal(W.done('belfry'),false);assert.equal(W.signature(),0);
  g.refreshMetrics(true);assert.equal(g.signature,signature,'signature intacte');
  // Dernière tranche en chantier : toujours rien, alerte comprise (sur une campagne jumelle, pour ne pas ouvrir la nuit ici).
  stock(g);launch(g,'belfry');step(g,B.steps[2].seconds-1);
  {const twin=megacity();for(const s of B.steps.slice(0,2)){stock(twin);launch(twin,'belfry');step(twin,s.seconds);twin.wave++;}
   stock(twin);launch(twin,'belfry');step(twin,B.steps[2].seconds-1);assert.equal(twin.greatWorks217.done('belfry'),false);assert.equal(alert(twin),base,'alerte intacte');}
  assert.equal(W.done('belfry'),false);g.refreshMetrics(true);assert.equal(g.signature,signature);
  step(g,1);assert.equal(W.done('belfry'),true);assert.equal(notes.filter(t=>t.startsWith('Beffroi d’alerte achevé')).length,1);
  near(g.signature,signature+B.signature,'signature ajoutée dès l’achèvement');assert.equal(W.signature(),B.signature);
  g.refreshMetrics(true);g.refreshMetrics(true);near(g.signature,signature+B.signature,'ajoutée une seule fois par calcul');
  // Reprise : l'ouvrage achevé reste achevé, avec ses effets.
  const saved=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(saved),true);g.phase='calm';g.phaseTime=1e6;
  assert.equal(g.greatWorks217.done('belfry'),true);near(g.signature,signature+B.signature);
  assert.equal(alert(g),base+B.warningSeconds,'alerte allongée');
  assert.equal(notes.filter(t=>t.startsWith('Beffroi d’alerte : la cloche donne')).length,1);
  g.updateDirector(.5);near(g.phaseTime,base+B.warningSeconds-.5,'pas de rallonge répétée pendant l’alerte');
  assert.match(row(g,'Beffroi d’alerte'),/^Achevé — /);assert.deepEqual(W.actions().map(a=>a.id),['launch-necropolis']);
  assert.equal(W.launch('belfry').reason,'Ouvrage achevé.');
  // La horde lit la signature par le plan de vague du moteur : jamais moins d'infectés qu'avant.
  const curve=g.balance217?.curve?.()||null;
  assert.ok(C.wavePlan(g.wave,g.difficulty,g.signature,curve).total>=C.wavePlan(g.wave,g.difficulty,signature,curve).total);
  // Une sauvegarde prise pendant l'alerte allongée est acceptée telle quelle.
  const night=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(night),true);assert.equal(g.phase,'warning');near(g.phaseTime,base+B.warningSeconds-.5);
});

test('grands ouvrages : nécropole, cadence de déblaiement des ouvriers, jamais plus que les corps présents',()=>{
  const g=megacity(),W=g.greatWorks217,N=R.works.necropolis,{wall,worker}=wallWithWorker(g),rate=C.WORKER_RULES.cleanupPerSecond;
  g.refreshMetrics(true);const signature=g.signature;
  wall.corpseLoad=20;near(g.clearCorpsesWithWorker(worker,wall,1),rate,'cadence ordinaire avant l’ouvrage');
  for(const s of N.steps.slice(0,2)){stock(g);launch(g,'necropolis');step(g,s.seconds);g.wave++;}
  wall.corpseLoad=20;near(g.clearCorpsesWithWorker(worker,wall,1),rate,'ouvrage inachevé : aucun effet');
  stock(g);launch(g,'necropolis');step(g,N.steps[2].seconds);assert.equal(W.done('necropolis'),true);
  wall.corpseLoad=20;near(g.clearCorpsesWithWorker(worker,wall,1),rate*N.clearSpeed,'cadence de nécropole');near(wall.corpseLoad,20-rate*N.clearSpeed);
  wall.corpseLoad=.5;near(g.clearCorpsesWithWorker(worker,wall,1),.5,'jamais plus que les corps présents');assert.equal(wall.corpseLoad,0);
  near(g.signature,signature+N.signature);assert.equal(W.done('belfry'),false);
  g.wave++;build(g,'belfry');near(g.signature,signature+N.signature+R.works.belfry.signature,'les deux signatures s’ajoutent');
  assert.deepEqual(W.actions(),[]);assert.match(W.overview().summary,/^Achevés : Beffroi d’alerte, Nécropole/);
});

test('grands ouvrages : ancienne campagne inactive, rien ne change et rien ne se lance',()=>{
  const g=megacity();build(g,'belfry');
  const old=JSON.parse(JSON.stringify(g.serialize()));delete old.expansions127.modules.greatWorks217;
  assert.equal(g.restoreSave(old),true);stock(g);const notes=watch(g),W=g.greatWorks217;
  assert.equal(W.active(),false);assert.equal(W.open(),false);assert.equal(W.done('belfry'),false);assert.deepEqual(state(g),none());
  assert.match(W.overview().summary,/ne suit pas les grands ouvrages/);assert.deepEqual(W.actions(),[]);
  for(const id of G.IDS)assert.match(W.launch(id).reason,/ne suit pas/);
  g.refreshMetrics(true);const signature=g.signature;assert.equal(W.signature(),0);
  step(g,30);g.refreshMetrics(true);assert.equal(g.signature,signature);
  const {wall,worker}=wallWithWorker(g);wall.corpseLoad=20;near(g.clearCorpsesWithWorker(worker,wall,1),C.WORKER_RULES.cleanupPerSecond);
  assert.deepEqual(state(g),none());assert.equal(mine(notes).length,0);assert.equal(W.marks().length,0);
  // Une sauvegarde corrompue est refusée en bloc, la campagne en cours reste en place.
  g.phase='calm';g.phaseTime=1e6;const bad=JSON.parse(JSON.stringify(g.serialize()));bad.expansions127.modules.greatWorks217={version:1,active:true,works:{belfry:{steps:9,left:0,wave:1},necropolis:{steps:0,left:0,wave:null}}};
  assert.throws(()=>g.restoreSave(bad),/Grands ouvrages 217 invalides/);assert.equal(g.greatWorks217.active(),false);
  assert.equal(alert(g),10+(g.hasResearch('recon')?5:0),'alerte héritée');
});

test('grands ouvrages : carte du dossier de situation et repère de carte, lecture seule',()=>{
  const g=megacity(),W=g.greatWorks217,doc=g.__doc;
  assert.equal(W.render(),false,'sans lecture de siège posée, pas de carte');
  assert.equal(require('../src/siege-readout.js').install(g,doc),true);
  assert.equal(W.render(),true);const card=doc.getElementById('greatWorksCard');assert.ok(card);assert.equal(card.hidden,false);
  assert.equal(doc.getElementById('greatWorksTitle').textContent,'Aucun chantier lancé');assert.equal(doc.getElementById('greatWorks-belfry').textContent,'0/3');
  assert.equal(W.marks().length,0);
  launch(g,'belfry');step(g,20);const snap=()=>JSON.stringify({...g.serialize(),timestamp:0}),before=snap();
  W.render();assert.equal(doc.getElementById('greatWorksTitle').textContent,'En chantier');assert.equal(doc.getElementById('greatWorks-belfry').textContent,'1/3 · 00:40');
  const marks=W.marks();assert.equal(marks.length,1);assert.deepEqual([marks[0].id,marks[0].steps,marks[0].building,marks[0].done],['belfry',0,true,false]);
  // Le peintre ne fait que dessiner : un contexte factice compte ses appels, l'état reste identique.
  const calls=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push(k);},set:(o,k,v)=>{o[k]=v;return true;}});
  assert.equal(W.drawMarks(ctx),1);assert.ok(calls.includes('strokeRect')&&calls.includes('fillText'));
  assert.ok(snap()===before,'ni la carte ni le repère ne modifient la campagne');
  step(g,40);g.wave++;build(g,'necropolis');W.render();
  assert.equal(doc.getElementById('greatWorks-necropolis').textContent,'Achevé');assert.equal(doc.getElementById('greatWorksTitle').textContent,'1 achevé sur 2');
  assert.match(doc.getElementById('greatWorksNote').textContent,/Signature ajoutée par les ouvrages achevés : \+80/);
  assert.equal(W.marks().find(m=>m.id==='necropolis').done,true);
  // Avant l'âge : carte masquée.
  const young=campaign();require('../src/siege-readout.js').install(young,young.__doc);
  young.greatWorks217.render();assert.equal(young.__doc.getElementById('greatWorksCard').hidden,true);
});

test('grands ouvrages : aucun hasard, aucune ressource créée, script publié',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/great-works217.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','.random(','localStorage','Date.now','setTimeout','C.add(','resources.','corpseLoad','world.add','new Building'])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal(source.match(/C\.spend\(/g).length,1,'un seul point de paiement');
  for(const file of ['index.html','sw.js'])assert.ok(fs.readFileSync(path.join(__dirname,'..',file),'utf8').includes('src/great-works217.js'),file);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.indexOf('src/breach217.js')>0&&html.indexOf('src/breach217.js')<html.indexOf('src/great-works217.js')&&html.indexOf('src/great-works217.js')<html.indexOf('src/siege-readout.js'),'chargé avec les règles de cité, après le registre des opérations');
  const ui=fs.readFileSync(path.join(__dirname,'../src/expansion-ui.js'),'utf8'),kit=fs.readFileSync(path.join(__dirname,'../src/expansion-kit.js'),'utf8');
  assert.ok(kit.includes("'greatWorks217'"));assert.equal(ui.match(/greatWorks217/g).length,5,'ORDER, GROUPS, API_NAMES (deux fois) et LABELS');
});
