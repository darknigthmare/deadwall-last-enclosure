'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),G=require('../src/great-works217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.GreatWorks217Rules,T=b=>globalThis.DeadwallTactics.footprint(b);
// État de la première tranche (version 1) et état courant (version 2, avec l'emprise).
const none1=()=>({version:1,active:false,works:{belfry:{steps:0,left:0,wave:null},necropolis:{steps:0,left:0,wave:null}}});
const none=()=>({version:2,active:false,ground:false,works:none1().works,sites:{belfry:null,necropolis:null}});
const fresh=()=>({...none(),active:true,ground:true});
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
  // Une sauvegarde de la première tranche est convertie sans perte : avancement gardé, sans emprise ni exigence d'emprise.
  assert.deepEqual(G.validate(ok),{version:2,active:true,ground:false,works:ok.works,sites:{belfry:null,necropolis:null}});assert.notEqual(G.validate(ok).works,ok.works);assert.notEqual(G.validate(ok).works.belfry,ok.works.belfry);
  assert.deepEqual(G.validate(none1()),none());
  {const v2={...G.validate(ok),sites:{belfry:{gx:40,gy:50,scar:3},necropolis:null}};assert.deepEqual(G.validate(v2),v2);assert.deepEqual(G.validate(G.validate(v2)),v2);}
  assert.deepEqual(G.validate(fresh()),fresh());
  assert.equal(G.signature(ok),R.works.necropolis.signature,'seul l’ouvrage achevé pèse');assert.equal(G.signature(fresh()),0);
  const w=(id,patch)=>({...ok,works:{...ok.works,[id]:{...ok.works[id],...patch}}});
  for(const bad of [null,[],'ouvrages',{},{...ok,version:2},{...ok,active:1},{...ok,extra:1},{version:1,active:true},{...ok,works:null},{...ok,works:[]},
    {...ok,works:{belfry:ok.works.belfry}},{...ok,works:{...ok.works,keep:{steps:0,left:0,wave:null}}},{...ok,works:{...ok.works,belfry:null}},
    {...ok,works:{...ok.works,belfry:{steps:1,left:0}}},w('belfry',{extra:1}),w('belfry',{steps:1.5}),w('belfry',{steps:-1}),w('belfry',{steps:4}),
    w('belfry',{left:-1}),w('belfry',{left:NaN}),w('belfry',{left:'3'}),w('belfry',{left:R.works.belfry.steps[1].seconds+1}),
    w('belfry',{wave:null}),w('belfry',{wave:1.5}),w('belfry',{wave:-1}),w('belfry',{wave:1e7}),w('belfry',{steps:0,left:0}),
    w('necropolis',{left:5}),w('necropolis',{wave:null}),{...ok,active:false},{...none1(),works:{...none1().works,belfry:{steps:0,left:0,wave:2}}}])assert.throws(()=>G.validate(bad),/Grands ouvrages 217 invalides/);
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
// Première case libre où l'emprise d'un ouvrage se pose, en spirale autour du dépôt (lecture seule).
function spot(g,id,skip=null){
  const core=g.core(),cx=C.grid(core.x),cy=C.grid(core.y),[w,h]=R.works[id].site.size;
  for(let r=8;r<=R.site.reach;r+=2)for(let dy=-r;dy<=r;dy+=2)for(let dx=-r;dx<=r;dx+=2){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const gx=cx+dx-Math.floor(w/2),gy=cy+dy-Math.floor(h/2);
    if((!skip||Math.abs(gx-skip.gx)>8||Math.abs(gy-skip.gy)>8)&&g.greatWorks217.siteQuote(id,gx,gy).ok)return{gx,gy};
  }
  throw Error('Aucune emprise libre pour '+id);
}
const site=(g,id)=>{const p=spot(g,id),result=g.greatWorks217.place(id,p.gx,p.gy);assert.deepEqual(result,{ok:true},id+' : '+result.reason);return p;};
const launch=(g,id)=>{if(g.greatWorks217.ground()&&!g.greatWorks217.sites()[id])site(g,id);const result=g.greatWorks217.launch(id);assert.deepEqual(result,{ok:true},id+' : '+result.reason);};
const launchIds=g=>g.greatWorks217.actions().map(a=>a.id).filter(id=>id.startsWith('launch-'));
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
  assert.equal(W.open(),true);assert.deepEqual(launchIds(g),['launch-belfry','launch-necropolis']);
  assert.match(W.launch('belfry').reason,/emprise/);assert.deepEqual({...g.resources},RICH,'sans emprise, rien n’est payé');site(g,'belfry');
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
  assert.match(row(g,'Beffroi d’alerte'),/^Achevé — /);assert.deepEqual(launchIds(g),['launch-necropolis']);
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
  for(const id of G.IDS){assert.match(W.launch(id).reason,/ne suit pas/);assert.match(W.siteQuote(id,40,40).reason,/ne suit pas/);assert.match(W.choose(id).reason,/ne suit pas/);}
  assert.deepEqual(W.silhouettes(),[]);
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

// ——— Deuxième tranche : chantier posé sur la carte ———
const proxyCtx=calls=>new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push(k);return k==='measureText'?{width:40}:undefined;},set:(o,k,v)=>{o[k]=v;return true;}});
const snapshot=g=>JSON.stringify({...g.serialize(),timestamp:0});
const cellsOf=(t,w,h)=>{const out=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)out.push([t.gx+x,t.gy+y]);return out;};
function zombieAt(g,x,y){assert.equal(g.spawnZombie('walker'),true);const z=g.zombies[g.zombies.length-1];z.x=x;z.y=y;return z;}
const centre=t=>({x:(t.gx+t.w/2)*C.TILE,y:(t.gy+t.h/2)*C.TILE});
function ok(result){assert.deepEqual(result,{ok:true},result?.reason);}
const chain=g=>g.serialize().expansions127.modules.corpseChain217;

test('grands ouvrages : emprise choisie sur la carte, refus propres, réservée sans toucher au champ de flux',()=>{
  const g=megacity(),W=g.greatWorks217,[bw,bh]=R.works.belfry.site.size,core=g.core(),cx=C.grid(core.x),cy=C.grid(core.y);
  assert.equal(W.ground(),true,'nouvelle campagne : emprise exigée');
  assert.ok(W.actions().some(a=>a.id==='site-belfry'&&!a.disabled&&a.close===true&&/^Choisir l’emprise/.test(a.label)));
  // Refus : hors de la cité, sur le dépôt, ouvrage inconnu, case illisible.
  assert.equal(W.siteQuote('belfry',cx+R.site.reach+1,cy).reason,'Hors de l’emprise de la cité');
  assert.equal(W.siteQuote('belfry',cx-1,cy-1).ok,false,'pas sur le dépôt');
  assert.equal(W.siteQuote('tour',cx,cy).reason,'Ouvrage inconnu.');assert.equal(W.siteQuote('belfry',1.5,cy).reason,'Case illisible.');
  const p=spot(g,'belfry');
  g.phase='warning';assert.match(W.siteQuote('belfry',p.gx,p.gy).reason,/alerte/);assert.match(W.place('belfry',p.gx,p.gy).reason,/alerte/);g.phase='calm';
  const flow=cellsOf(p,bw,bh).map(([x,y])=>g.world.movementCost(x,y)),count=g.world.buildings.size,nav=g.world.navigationVersion,stock={...g.resources};
  ok(W.place('belfry',p.gx,p.gy));
  assert.deepEqual(W.sites().belfry,{gx:p.gx,gy:p.gy,scar:0,w:bw,h:bh});
  assert.deepEqual(cellsOf(p,bw,bh).map(([x,y])=>g.world.movementCost(x,y)),flow,'champ de flux inchangé : l’emprise ne ferme aucune case');
  assert.equal(g.world.buildings.size,count);assert.equal(g.world.navigationVersion,nav);assert.deepEqual({...g.resources},stock,'la pose ne coûte rien');
  // Réservée : aucun ouvrage ne s'y pose, par la lecture d'emplacement du monde comme par le geste du joueur.
  assert.deepEqual(g.world.placement(C.BUILDINGS.woodWall,p.gx+1,p.gy+1,0),{valid:false,reason:'Emprise d’un grand ouvrage'});
  assert.equal(g.placeOne('woodWall',p.gx+1,p.gy+1,0),false);assert.equal(g.world.buildings.size,count);assert.deepEqual({...g.resources},stock);
  // Une autre emprise ne la chevauche pas.
  assert.equal(W.siteQuote('necropolis',p.gx,p.gy).reason,'Emprise d’un autre grand ouvrage');
  // Elle se déplace tant qu'aucune tranche n'est lancée, plus ensuite.
  const q=spot(g,'belfry',p);assert.notDeepEqual(q,p);ok(W.place('belfry',q.gx,q.gy));
  assert.notEqual(g.world.placement(C.BUILDINGS.woodWall,p.gx+1,p.gy+1,0).reason,'Emprise d’un grand ouvrage','l’ancienne emprise est libérée');
  launch(g,'belfry');assert.match(W.siteQuote('belfry',p.gx,p.gy).reason,/chantier est commencé/);assert.equal(W.actions().some(a=>a.id==='site-belfry'),false);
  // Reprise : l'emprise et sa réserve suivent la sauvegarde.
  const saved=JSON.parse(JSON.stringify(g.serialize()));assert.deepEqual(saved.expansions127.modules.greatWorks217.sites.belfry,{gx:q.gx,gy:q.gy,scar:0});
  assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.greatWorks217.sites().belfry,{gx:q.gx,gy:q.gy,scar:0,w:bw,h:bh});
  assert.equal(g.world.placement(C.BUILDINGS.woodWall,q.gx,q.gy,0).reason,'Emprise d’un grand ouvrage','réserve rétablie sur le monde repris');
  // Une sauvegarde aux emprises qui se chevauchent est refusée en bloc.
  const bad=JSON.parse(JSON.stringify(saved));bad.expansions127.modules.greatWorks217.sites.necropolis={gx:q.gx,gy:q.gy,scar:0};
  assert.throws(()=>g.restoreSave(bad),/Grands ouvrages 217 invalides/);
});

test('grands ouvrages : pose au curseur comme le catalogue, aperçu sans effet, Échap renonce',()=>{
  const g=megacity(),W=g.greatWorks217,[bw,bh]=R.works.belfry.site.size,p=spot(g,'belfry');
  const result=W.choose('belfry');assert.equal(result.ok,true);assert.match(result.message,/l’emprise : Beffroi/);
  assert.equal(g.selectedBuild,'greatWorks217:belfry');assert.equal(g.isLineWall(C.BUILDINGS[g.selectedBuild]),false);
  // Aperçu centré sur le curseur : clair sur une emprise libre, ambré et motivé sinon ; il ne change rien.
  const at={x:(p.gx+Math.floor(bw/2))*C.TILE+4,y:(p.gy+Math.floor(bh/2))*C.TILE+4},before=snapshot(g);
  g.input.mouseWorldX=at.x;g.input.mouseWorldY=at.y;
  let calls=[],ctx=proxyCtx(calls);g.drawPlacement(ctx);assert.equal(ctx.fillStyle,'#e9e4d6');assert.ok(calls.includes('fillText'));
  g.input.mouseWorldX=g.core().x;g.input.mouseWorldY=g.core().y;calls=[];ctx=proxyCtx(calls);g.drawPlacement(ctx);assert.equal(ctx.fillStyle,'#f0c36a','refus lisible');
  assert.equal(snapshot(g),before,'l’aperçu ne modifie rien');
  // Clic sur une case refusée : rien n'est posé, le mode reste ouvert.
  assert.equal(g.placeOne(g.selectedBuild,C.grid(g.core().x),C.grid(g.core().y),0),false);assert.equal(W.sites().belfry,null);assert.equal(g.selectedBuild,'greatWorks217:belfry');
  // Clic valide : posée au centre du curseur, mode refermé.
  assert.equal(g.placeOne(g.selectedBuild,C.grid(at.x),C.grid(at.y),0),true);assert.deepEqual([W.sites().belfry.gx,W.sites().belfry.gy],[p.gx,p.gy]);assert.equal(g.selectedBuild,null);
  // Annulation du geste (Échap, clic droit) : rien n'est posé.
  assert.equal(W.choose('necropolis').ok,true);assert.equal(g.selectedBuild,'greatWorks217:necropolis');g.cancelPlacement();assert.equal(g.selectedBuild,null);assert.equal(W.sites().necropolis,null);
  // Les ouvrages ordinaires gardent leur geste.
  g.selectBuild('woodWall');assert.equal(g.isLineWall(C.BUILDINGS[g.selectedBuild]),true);g.cancelPlacement();
});

test('grands ouvrages : la silhouette grandit tranche par tranche, dans la file de profondeur, sans rien modifier',()=>{
  const g=megacity(),W=g.greatWorks217,B=R.works.belfry,U=C.CityGeometry202.presentation.projectedHeightUnitsPerMetre;
  assert.deepEqual(W.silhouettes(),[]);site(g,'belfry');
  const view={left:0,top:0,right:C.LOCAL_MAP217.size,bottom:C.LOCAL_MAP217.size};
  const entry=()=>g.depthEntries(view).find(e=>e.id==='greatWork217:belfry');
  const look=()=>{const s=W.silhouettes().find(v=>v.id==='belfry');return [s.steps,s.height,s.next,s.building,s.done];};
  assert.deepEqual(look(),[0,0,B.site.heights[0]*U,false,false]);assert.ok(entry(),'emprise visible avant la première tranche');
  const heights=[];
  for(let k=0;k<B.steps.length;k++){
    stock(g);launch(g,'belfry');step(g,B.steps[k].seconds/2);
    const half=W.silhouettes()[0];assert.equal(half.building,true);near(half.share,.5,'échafaudage à moitié');
    step(g,B.steps[k].seconds/2);g.wave++;
    const [steps,height]=look();assert.equal(steps,k+1);near(height,B.site.heights[k]*U);heights.push(height);
    const e=entry();assert.ok(e&&typeof e.draw==='function');near(e.depth,W.silhouettes()[0].bottom);
    const before=snapshot(g),calls=[];e.draw(proxyCtx(calls));assert.ok(calls.includes('fillRect')&&calls.includes('strokeRect'));assert.equal(snapshot(g),before,'le peintre ne modifie rien');
  }
  assert.ok(heights[0]<heights[1]&&heights[1]<heights[2],'trois étages distincts');
  assert.deepEqual(look(),[3,B.site.heights[2]*U,null,false,true]);
  // L'étiquette du repère suit l'emprise, plus le dépôt.
  const m=W.marks().find(v=>v.id==='belfry'),t=W.sites().belfry;assert.equal(m.sited,true);near(m.x,(t.gx+t.w/2)*C.TILE);near(m.y,(t.gy+t.h)*C.TILE);
  // Hors de la vue : aucune entrée.
  assert.equal(g.depthEntries({left:0,top:0,right:10,bottom:10}).some(e=>e.id==='greatWork217:belfry'),false);
});

test('grands ouvrages : une tranche ouverte foulée pendant l’assaut perd une partie de son avancement, rien d’autre',()=>{
  const g=megacity(),W=g.greatWorks217,B=R.works.belfry,s0=B.steps[0].seconds,cap0=s0*R.site.maxLossShare,T=R.site.trampleSeconds;
  launch(g,'belfry');step(g,40);near(works(g).belfry.left,s0-40);
  const t={...W.sites().belfry},inside=centre(t),notes=watch(g);
  // Hors de l'assaut : un infecté sur l'emprise ne défait rien (et le chantier continue).
  zombieAt(g,inside.x,inside.y);step(g,1);near(works(g).belfry.left,s0-41);
  // Assaut : le chantier s'arrête et chaque seconde d'infecté dans l'emprise défait `trampleSeconds`.
  g.phase='assault';g.phaseTime=1e6;const costKeys=Object.keys(B.steps[0].cost),pick=()=>costKeys.map(k=>g.resources[k]),stock0=pick(),count=g.world.buildings.size,hp=g.units.map(u=>u.health);
  step(g,1);near(works(g).belfry.left,s0-41+T);near(W.sites().belfry.scar,T);
  assert.equal(notes.filter(n=>/la horde foule le chantier/.test(n)).length,1);
  zombieAt(g,inside.x+4,inside.y);step(g,1);near(works(g).belfry.left,s0-41+3*T,'deux infectés, deux fois plus');
  // Plafond de l'assaut : jamais plus que `maxLossShare` de la tranche, jamais au-delà de son chantier entier.
  step(g,60);const lost=Math.min(cap0,41);near(W.sites().belfry.scar,lost);near(works(g).belfry.left,s0-41+lost);
  assert.equal(notes.filter(n=>/la horde foule le chantier/.test(n)).length,1,'une seule annonce par assaut');
  assert.deepEqual(pick(),stock0,'rien n’est payé ni rendu');assert.equal(g.world.buildings.size,count);assert.deepEqual(g.units.map(u=>u.health),hp,'aucun dégât infligé');
  // Sauvegarde au milieu de l'assaut : la trace suit, le plafond reste atteint.
  const mid=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(mid),true);g.phase='assault';g.phaseTime=1e6;
  near(g.greatWorks217.sites().belfry.scar,lost);const left=works(g).belfry.left;step(g,2);near(works(g).belfry.left,left,'plafond atteint');
  // Fin de l'assaut : la trace s'efface, le chantier reprend où il en est.
  g.phase='aftermath';for(const q of g.zombies)q.dead=true;step(g,1);assert.equal(g.greatWorks217.sites().belfry.scar,0);near(works(g).belfry.left,left-1);
  // Entre deux tranches, la dernière construite rouvre, sans être repayée ; un infecté hors de l'emprise ne fait rien.
  step(g,left-1);assert.deepEqual(works(g).belfry,{steps:1,left:0,wave:g.wave});const night=g.wave;g.wave++;
  const W2=g.greatWorks217,outside={x:(t.gx-3)*C.TILE,y:(t.gy-3)*C.TILE};
  g.phase='assault';zombieAt(g,outside.x,outside.y);step(g,2);assert.deepEqual(works(g).belfry,{steps:1,left:0,wave:night},'hors de l’emprise : rien');
  const paid=pick();zombieAt(g,inside.x,inside.y);step(g,1);assert.equal(works(g).belfry.steps,0);near(works(g).belfry.left,T);
  assert.ok(notes.some(n=>/tranche 1 sur 3 construite est entamée et rouvre/.test(n)));assert.deepEqual(pick(),paid);
  assert.ok(W2.status('belfry').startsWith('Tranche 1 sur 3 en chantier'));
  step(g,60);near(works(g).belfry.left,cap0);assert.ok(cap0<s0,'un assaut n’efface jamais toute la tranche');
  // La tranche rouverte se rebâtit après l'assaut, sans nouveau paiement ni attente d'une nuit.
  g.phase='aftermath';for(const q of g.zombies)q.dead=true;step(g,cap0);assert.equal(works(g).belfry.steps,1);assert.deepEqual(pick(),paid);
  // Achevé : la horde ne défait plus rien.
  for(const s of B.steps.slice(1)){stock(g);launch(g,'belfry');step(g,s.seconds);g.wave++;}
  assert.equal(W2.done('belfry'),true);g.phase='assault';zombieAt(g,inside.x,inside.y);const done=JSON.stringify(works(g));step(g,5);assert.equal(JSON.stringify(works(g)),done);
  assert.equal(W2.sites().belfry.scar,0);
});

test('grands ouvrages : la Nécropole achevée hâte le bûcher et agrandit les fosses de la filière des corps, sans double compte',()=>{
  const g=megacity(),W=g.greatWorks217,N=R.works.necropolis,K=C.CorpseChain217Rules,A=g.corpseChain217;
  assert.deepEqual(W.corpses(),{pyre:1,pit:1});
  // Avant : cadence ordinaire du bûcher.
  A.receive(400);ok(A.light('wood'));let burned=chain(g).burned;
  step(g,4);near(chain(g).burned-burned,K.pyre.perSecond*4,'bûcher ordinaire');
  ok(A.douse());build(g,'necropolis');assert.deepEqual(W.corpses(),{pyre:N.pyreSpeed,pit:N.pitCapacity});
  g.phase='calm';g.phaseTime=1e6;stock(g);
  g.resources.wood=300;burned=chain(g).burned;const wood=g.resources.wood;ok(A.light('wood'));step(g,4);
  near(chain(g).burned-burned,K.pyre.perSecond*N.pyreSpeed*4,'bûcher de nécropole');near(wood-g.resources.wood,K.pyre.perSecond*N.pyreSpeed*4*K.pyre.cost.wood,'même bois par corps');
  assert.match(A.overview().rows.find(r=>r.label==='Bûcher').value,/Nécropole/);
  // Signature : chaque prix une seule fois, la Nécropole et le bûcher.
  g.refreshMetrics(true);assert.equal(W.signature(),N.signature);assert.equal(A.signature(),K.pyre.signature);
  const Readout=require('../src/siege-readout.js'),sig=Readout.signatureParts(g),sum=sig.parts.reduce((n,p)=>n+p.value,0);
  assert.equal(sig.parts.length,5);near(sum,g.signature,'somme des parts = signature');near(sig.parts.find(p=>p.key==='works').value,N.signature+K.pyre.signature);
  ok(A.douse());g.refreshMetrics(true);near(Readout.signatureParts(g).parts.find(p=>p.key==='works').value,N.signature);
  // Fosse : contenance multipliée, remplissage sauvegardé en places de fosse ordinaire.
  A.receive(K.pit.capacity*N.pitCapacity+50);ok(A.openPit());step(g,K.pit.digSeconds);assert.equal(A.pit().open,true);
  step(g,40);near(A.pit().fill,40*K.pit.perSecond/N.pitCapacity);assert.match(A.overview().rows.find(r=>r.label==='Fosse').value,new RegExp('/ '+K.pit.capacity*N.pitCapacity+' corps'));
  const saved=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(saved),true);g.phase='calm';g.phaseTime=1e6;near(g.corpseChain217.pit().fill,40*K.pit.perSecond/N.pitCapacity);
  const buried=chain(g).buried;
  step(g,(K.pit.capacity*N.pitCapacity-40*K.pit.perSecond)/K.pit.perSecond+1);assert.equal(g.corpseChain217.pit().open,false,'refermée pleine');assert.equal(g.corpseChain217.pit().closed,1);
  near(chain(g).buried,buried+K.pit.capacity*N.pitCapacity-40*K.pit.perSecond,'chaque corps compté une fois');
});

test('grands ouvrages : campagne de la première tranche convertie, avancement gardé, emprise facultative',()=>{
  const g=megacity();
  const data=JSON.parse(JSON.stringify(g.serialize()));
  data.expansions127.modules.greatWorks217={version:1,active:true,works:{belfry:{steps:1,left:20,wave:g.wave},necropolis:{steps:3,left:0,wave:1}}};
  assert.equal(g.restoreSave(data),true);g.phase='calm';g.phaseTime=1e6;stock(g);const W=g.greatWorks217;
  assert.equal(W.ground(),false);assert.deepEqual(state(g),{version:2,active:true,ground:false,works:{belfry:{steps:1,left:20,wave:g.wave},necropolis:{steps:3,left:0,wave:1}},sites:{belfry:null,necropolis:null}});
  assert.equal(W.done('necropolis'),true);assert.deepEqual(W.corpses(),{pyre:R.works.necropolis.pyreSpeed,pit:R.works.necropolis.pitCapacity});
  assert.deepEqual(W.silhouettes(),[]);assert.equal(W.marks().length,2,'repères au-dessus du dépôt, comme avant');
  // Sans emprise : la horde n'y touche pas, le chantier continue et la tranche suivante se lance comme avant.
  g.phase='assault';zombieAt(g,g.core().x,g.core().y);step(g,3);near(works(g).belfry.left,20,'arrêté, intact');
  g.phase='calm';for(const z of g.zombies)z.dead=true;step(g,20);assert.equal(works(g).belfry.steps,2);g.wave++;
  stock(g);ok(W.launch('belfry'));
  // Une emprise peut être choisie à la reprise, même pour un ouvrage achevé ou entamé.
  const labels=W.actions().filter(a=>a.id.startsWith('site-')).map(a=>a.label);
  assert.equal(labels.length,2);assert.ok(labels.every(l=>/^Poser une emprise \(facultatif\)/.test(l)));
  const p=spot(g,'necropolis');ok(W.place('necropolis',p.gx,p.gy));const s=W.silhouettes().find(v=>v.id==='necropolis');
  assert.equal(s.done,true);near(s.height,R.works.necropolis.site.heights[2]*C.CityGeometry202.presentation.projectedHeightUnitsPerMetre);
  const q=spot(g,'belfry');ok(W.place('belfry',q.gx,q.gy));assert.equal(W.silhouettes().find(v=>v.id==='belfry').building,true);
  assert.equal(state(g).version,2);assert.equal(state(g).ground,false,'la campagne reste convertie');
  assert.deepEqual(W.marks().map(m=>m.sited),[true,true]);
});

test('grands ouvrages : ancienne campagne sans emprise ni entrée dessinée ; aucun tirage pendant pose, chantier, piétinement et dessin',()=>{
  const g=megacity();const old=JSON.parse(JSON.stringify(g.serialize()));delete old.expansions127.modules.greatWorks217;
  assert.equal(g.restoreSave(old),true);const W=g.greatWorks217;
  const view={left:0,top:0,right:C.LOCAL_MAP217.size,bottom:C.LOCAL_MAP217.size};
  assert.equal(g.depthEntries(view).some(e=>String(e.id).startsWith('greatWork217')),false);
  assert.match(W.place('belfry',40,40).reason,/ne suit pas/);assert.deepEqual(W.corpses(),{pyre:1,pit:1});assert.deepEqual(W.sites(),{belfry:null,necropolis:null});
  const h=megacity(),V=h.greatWorks217;launch(h,'belfry');step(h,10);const t=V.sites().belfry,c=centre(t);zombieAt(h,c.x,c.y);
  const rnd=JSON.stringify(h.random),stockBefore=JSON.stringify(h.resources);h.phase='assault';
  for(let i=0;i<8;i++)V.tick(.25);
  for(const e of h.depthEntries(view))if(String(e.id).startsWith('greatWork217'))e.draw(proxyCtx([]));
  V.drawMarks(proxyCtx([]));V.siteQuote('necropolis',t.gx,t.gy);V.overview();V.actions();
  assert.equal(JSON.stringify(h.random),rnd,'aucun tirage');assert.equal(JSON.stringify(h.resources),stockBefore);
  assert.ok(V.sites().belfry.scar>0,'le piétinement a bien eu lieu');
});
