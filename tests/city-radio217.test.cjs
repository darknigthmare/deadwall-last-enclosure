'use strict';
// Cité autonome : radio et consignes d'absence (docs/GAME_BIBLE.md §7.15), première tranche.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Fallback=require('../src/fallback-order.js'),Radio=require('../src/city-radio217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const T=globalThis.DeadwallTactics||require('../src/tactics.js');
const root=path.join(__dirname,'..'),clone=o=>JSON.parse(JSON.stringify(o));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function campaign(){
 const {g,doc}=bootDocument134();Fallback.install(g,doc);Radio.install(g,doc);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 return {g,doc};
}
// Même enceinte que le test du repli : palissades autour du centre, une porte au nord.
function enclose(g){
 const core=g.core(),cells=T.footprint(core),r=3,placed=[];
 const put=(type,gx,gy)=>{const B=core.constructor,b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
 const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
 for(let x=x0;x<=x1;x++){if(x===gateX)put('gate',x,y0);else if(x!==gateX+1)put('woodWall',x,y0);put('woodWall',x,y1);}
 for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
 g.world.navigationVersion++;g.refreshMetrics(true);
 const top=Math.min(...placed.map(b=>b.gy)),bottom=Math.max(...placed.map(b=>b.gy)),mid=cells.x+3;
 return {placed,gate:placed.find(b=>T.isGate(b)),north:placed.find(b=>!T.isGate(b)&&b.gy===top&&b.gx===mid),south:placed.find(b=>b.gy===bottom&&b.gx===mid),inside:{x:core.x,y:core.y+C.TILE*2}};
}
// Le Commandant franchit réellement la limite : même sortie et même drapeau d'absence qu'en jeu.
function leave(g){g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter(),'sortie régionale');assert.equal(g.player.regionAbsent,true);}
function step(g,n=1){for(let i=0;i<n;i++){g.elapsed+=1;g.fallbackOrder.tick();g.cityRadio217.tick();}g.cityRadio217.refresh();}
// La chute passe par la destruction du jeu : le mur quitte réellement le monde.
function fell(g,wall){g.destroyBuilding(wall);assert.equal(g.world.buildings.has(wall.id),false);g.world.navigationVersion++;}
// Sortie, puis position régionale ramenée à la jonction : le retour par `frontier.leave()` reste possible.
function leaveAtGate(g){leave(g);const P=globalThis.DeadwallAtlasProjection,edge=P.gatesFor(g).find(gate=>gate.id==='east'),saved=clone(g.serialize());saved.frontier.x=edge.x;saved.frontier.y=edge.y;assert.equal(g.restoreSave(saved),true);assert.equal(g.player.regionAbsent,true);}
const texts=g=>g.cityRadio217.journal().map(e=>e.text);
const breaches=g=>texts(g).filter(t=>t.startsWith('Brèche au '));
const feed=doc=>doc.getElementById('cityRadio217Feed').children.map(n=>n.textContent||n.children.map(c=>c.textContent).join(' '));

test('radio 217 : état validé strictement ; une ancienne sauvegarde est inactive, une campagne neuve active',()=>{
 assert.deepEqual(Radio.validate(undefined),{version:1,active:false,order:'hold',applied:null,ours:false,journal:[]});
 assert.deepEqual(Radio.fresh(),{version:1,active:true,order:'hold',applied:null,ours:false,journal:[]});
 const ok={version:1,active:true,order:'everyone',applied:3,ours:true,journal:[{at:12.5,wave:3,tone:'danger',text:'Brèche au nord (Palissade).'}]};
 assert.deepEqual(Radio.validate(clone(ok)),ok);
 const bad=change=>{const raw=clone(ok);change(raw);assert.throws(()=>Radio.validate(raw),/Radio 217 invalide/);};
 bad(r=>{r.extra=1;});bad(r=>{delete r.ours;});bad(r=>{r.version=2;});bad(r=>{r.order='charge';});bad(r=>{r.applied=-1;});bad(r=>{r.applied=1.5;});
 bad(r=>{r.order='hold';});bad(r=>{r.applied=null;});bad(r=>{r.active=false;});bad(r=>{r.journal[0].tone='rouge';});bad(r=>{r.journal[0].text='';});
 bad(r=>{r.journal[0].text='x'.repeat(241);});bad(r=>{r.journal[0].at=-1;});bad(r=>{r.journal[0].who='x';});bad(r=>{r.journal='x';});
 bad(r=>{r.journal=Array.from({length:C.CityRadio217Rules.journal+1},()=>({at:1,wave:1,tone:'normal',text:'x'}));});
 for(const raw of [null,[],'x',{version:1,active:false,order:'hold',applied:null,ours:false,journal:[{at:1,wave:1,tone:'normal',text:'x'}]}])assert.throws(()=>Radio.validate(raw),/Radio 217 invalide/);
 assert.equal(Object.isFrozen(C.CityRadio217Rules),true);assert.equal(C.CityRadio217Rules.journal,12);
});

test('radio 217 : module enregistré au chargement, listé dans les opérations, le manifeste et le cache',()=>{
 const {g}=bootDocument134();
 assert.ok(g.expansions.get('cityRadio217'),'enregistré avant toute installation d’interface');
 assert.match(read('src/expansion-kit.js'),/'cityRadio217'/);
 const ui=read('src/expansion-ui.js');assert.equal(ui.split('cityRadio217').length-1,5,'ORDER, GROUPS, API_NAMES (deux fois), LABELS');
 const html=read('index.html');assert.ok(html.indexOf('src/city-radio217.js')>html.indexOf('src/fallback-order.js'),'après les ordres de repli');
 assert.match(read('sw.js'),/"src\/city-radio217\.js"/);
 const source=read('src/city-radio217.js');
 for(const forbidden of ['Math.random','.random','localStorage','setInterval','Date.now','performance.now','damage','spawn','setTimeout(()=>{tick'])assert.equal(source.includes(forbidden),false,forbidden);
 assert.match(read('src/narrative.js'),/Sami V\., répartiteur/,'le répartiteur vient du récit existant');assert.match(Radio.SPEAKER,/^Sami V\./);
});

test('radio 217 : Commandant sur place, rien n’est relayé et aucune consigne ne s’applique',()=>{
 const {g,doc}=campaign(),{north}=enclose(g);
 assert.equal(g.cityRadio217.active(),true);assert.equal(g.cityRadio217.setOrder('everyone').ok,true);
 step(g);g.phase='assault';fell(g,north);step(g,3);
 assert.equal(g.fallbackOrder.status().lastBreach.side,'north','la brèche est réelle');
 assert.deepEqual(texts(g),[]);assert.equal(g.fallbackOrder.status().mode,null);assert.equal(g.workerOrder,'auto');
 assert.equal(doc.getElementById('cityRadio217').classList.contains('hidden'),true,'poste masqué dans D-17');
});

test('radio 217 : pendant une sortie, une brèche est annoncée une seule fois, datée et attribuée',()=>{
 const {g,doc}=campaign(),{north}=enclose(g);
 step(g);leave(g);step(g,2);
 assert.deepEqual(texts(g),[],'rien à signaler au départ');
 assert.equal(doc.getElementById('cityRadio217').classList.contains('hidden'),false,'poste visible en sortie');
 assert.match(feed(doc).join(' '),/Rien à signaler/);
 const stock=JSON.stringify(g.resources),zombies=g.zombies.length,units=g.units.length,health=g.core().health;
 g.phase='assault';step(g);
 assert.deepEqual(texts(g),['Vague '+g.wave+' : l’assaut a commencé.']);
 fell(g,north);step(g);
 assert.equal(breaches(g).length,1);assert.match(breaches(g)[0],/^Brèche au nord \(Palissade/);
 const entry=g.cityRadio217.journal().at(-1);assert.equal(entry.wave,g.wave);assert.equal(entry.tone,'danger');assert.ok(entry.at>0&&entry.at<=g.elapsed);
 assert.match(Radio.line(entry),/^Vague \d+ · \d+:\d\d — Brèche au nord/);
 step(g,200);
 assert.equal(breaches(g).length,1,'pas de doublon');assert.equal(texts(g).filter(t=>/l’assaut a commencé/.test(t)).length,1);
 assert.match(feed(doc).join(' '),/Brèche au nord/);assert.match(doc.getElementById('cityRadio217').textContent+doc.getElementById('cityRadio217').children[0].textContent,/Sami V\., répartiteur/);
 assert.match(doc.getElementById('cityRadio217Log').children.map(n=>n.children.map(c=>c.textContent).join(' ')).join('|'),/Brèche au nord/,'journal consultable dans le carnet');
 // Lecture seule : ni stock, ni infecté, ni unité, ni dégât ; sans consigne de repli, aucun ordre.
 assert.equal(JSON.stringify(g.resources),stock);assert.equal(g.zombies.length,zombies);assert.equal(g.units.length,units);assert.equal(g.core().health,health);
 assert.equal(g.cityRadio217.order(),'hold');assert.equal(g.fallbackOrder.status().mode,null);assert.equal(g.workerOrder,'auto');
});

test('radio 217 : ce que le Commandant savait en partant n’est pas répété ; le journal est borné',()=>{
 const {g}=campaign(),{north,south}=enclose(g);
 step(g);g.phase='assault';fell(g,north);step(g,2);leave(g);step(g,5);
 assert.deepEqual(texts(g),[],'assaut et brèche connus avant le départ');
 fell(g,south);g.elapsed+=10;step(g);
 assert.equal(breaches(g).length,1);assert.match(breaches(g)[0],/^Brèche au sud/);
 // Faits lus chez leurs propriétaires : remplacés ici par des relevés fixes pour parcourir les épisodes.
 let stage=0;g.cityWater215={needed:()=>true,stage:()=>stage};
 step(g);const before=texts(g).length;
 stage=1;step(g,3);assert.equal(texts(g).length,before+1);assert.match(texts(g).at(-1),/citernes sont vides/);
 stage=4;step(g,3);assert.equal(texts(g).length,before+2,'une aggravation est annoncée');assert.match(texts(g).at(-1),/ouvriers quittent/);
 stage=2;step(g,3);assert.equal(texts(g).length,before+2,'une amélioration ne l’est pas');
 stage=0;step(g,2);stage=1;step(g,2);assert.equal(texts(g).length,before+2,'un fait qui revient aussitôt reste silencieux');
 g.elapsed+=120;step(g);stage=0;step(g);g.elapsed+=120;stage=1;step(g);assert.equal(texts(g).length,before+3,'nouvel épisode après le silence');
 for(let i=0;i<40;i++){stage=0;g.elapsed+=120;step(g);stage=1;g.elapsed+=120;step(g);}
 assert.equal(texts(g).length,C.CityRadio217Rules.journal);assert.equal(g.cityRadio217.snapshot().journal.length,C.CityRadio217Rules.journal);
});

test('radio 217 : relevé des faits, un par épisode, lus chez leurs propriétaires',()=>{
 const g={phase:'warning',wave:4,morale:5,resources:{ammo:0},core:()=>({health:30,maxHealth:100}),balance217:{moraleTiers:()=>true},
  cityWater215:{needed:()=>true,stage:()=>6},breach217:{threatened:()=>[{side:'north',length:3,gates:0},{side:'north',length:5,gates:1}]},
  corpseHeaps217:{summary:()=>({north:{state:'franchi',gate:false},east:null,south:{state:'imminent',gate:true},west:{state:'haut',gate:false}})},
  fallbackOrder:{status:()=>({closed:true,infectedInside:2,lastBreach:{side:'east',name:'Porte',wave:4,at:90}}),nightLog:()=>({wave:4,lost:['east'],retaken:['west']})}};
 const list=Radio.facts(g),by=Object.fromEntries(list.map(f=>[f.key,f]));
 assert.deepEqual(Object.keys(by).sort(),['ammo','breach:4:90','core','front:4','heap:north','heap:south','lost:4:east','morale','pan:north','retaken:4:west','water'].sort());
 assert.equal(by['breach:4:90'].text,'Brèche au est (Porte). 2 infectés dans l’enceinte intérieure.');
 assert.equal(by['pan:north'].text,'Le mur nord menace de céder sur 5 ouvrages, porte comprise.');
 assert.equal(by['heap:north'].level,2);assert.equal(by['heap:south'].level,1);assert.match(by['heap:south'].text,/la porte sera bientôt franchissable/);
 assert.equal(by.water.level,4);assert.equal(by['retaken:4:west'].tone,'good');assert.equal(by['front:4'].tone,'normal');
 assert.deepEqual(Radio.facts({phase:'calm',wave:1,morale:5,resources:{ammo:40}}),[],'sans module propriétaire, aucun fait');
});

test('consigne 217 : choisie sur place, refusée en sortie, appliquée une seule fois par les ordres existants puis levée',()=>{
 const {g,doc}=campaign(),{north,south,inside}=enclose(g);
 for(const unit of g.units){unit.x=inside.x;unit.y=inside.y;}
 assert.deepEqual(g.cityRadio217.actions().map(a=>a.id),['order-hold','order-fighters','order-everyone']);
 assert.equal(g.cityRadio217.quote('hold').ok,false,'déjà en vigueur');assert.equal(g.cityRadio217.setOrder('charge').ok,false);
 assert.equal(g.cityRadio217.setOrder('everyone').ok,true);assert.equal(g.cityRadio217.order(),'everyone');
 assert.equal(doc.getElementById('cityRadio217-everyone').getAttribute('aria-pressed'),'true');
 step(g);leave(g);step(g);
 assert.equal(g.cityRadio217.setOrder('hold').ok,false,'les consignes se donnent sur place');assert.equal(g.cityRadio217.order(),'everyone');
 let orders=0;const setWorkerOrder=g.setWorkerOrder;g.setWorkerOrder=function(order,...rest){if(order==='retreat')orders++;return setWorkerOrder.call(this,order,...rest);};
 const stock=JSON.stringify(g.resources),zombies=g.zombies.length;
 g.phase='assault';step(g);assert.equal(g.fallbackOrder.status().mode,null,'pas de repli sans brèche');
 fell(g,north);step(g);
 assert.equal(orders,1);assert.equal(g.fallbackOrder.status().mode,'everyone');assert.equal(g.workerOrder,'retreat');assert.equal(g.cityRadio217.ours(),true);
 assert.ok(texts(g).some(t=>/^Consigne appliquée : repli général/.test(t)));
 fell(g,south);g.elapsed+=10;step(g,5);
 assert.equal(breaches(g).length,2,'la seconde brèche est annoncée');assert.equal(orders,1,'consigne appliquée une seule fois par vague');
 assert.equal(texts(g).filter(t=>t.startsWith('Consigne')).length,1);
 g.phase='aftermath';step(g);
 assert.equal(g.fallbackOrder.status().mode,null,'repli levé l’assaut terminé');assert.equal(g.workerOrder,'auto');assert.equal(g.cityRadio217.ours(),false);
 assert.match(texts(g).at(-1),/^Assaut terminé : repli levé/);
 step(g,5);assert.equal(texts(g).filter(t=>t.startsWith('Assaut terminé')).length,1);
 assert.equal(JSON.stringify(g.resources),stock);assert.equal(g.zombies.length,zombies);
 assert.equal(g.cityRadio217.snapshot().applied,g.wave);
});

test('consigne 217 : « replier les combattants » n’appelle que le repli des sections ; « tenir » n’appelle rien',()=>{
 const {g}=campaign(),{north}=enclose(g);
 assert.equal(g.cityRadio217.setOrder('fighters').ok,true);step(g);leave(g);step(g);
 g.phase='assault';step(g);fell(g,north);step(g);
 assert.equal(g.fallbackOrder.status().mode,'fighters');assert.equal(g.workerOrder,'auto','les ouvriers gardent leurs ordres');
 assert.deepEqual(g.squads.groups.map(group=>group.order),['retreat','retreat','retreat']);
 assert.ok(texts(g).some(t=>/^Consigne appliquée : les sections/.test(t)));
});

test('consigne 217 : un repli déjà ordonné n’est pas modifié ; un retour avant la fin laisse le repli au Commandant',()=>{
 const a=campaign(),wa=enclose(a.g);
 assert.equal(a.g.cityRadio217.setOrder('everyone').ok,true);assert.equal(a.g.fallbackOrder.fighters(),true);
 step(a.g);leave(a.g);step(a.g);a.g.phase='assault';step(a.g);fell(a.g,wa.north);step(a.g);
 assert.equal(a.g.fallbackOrder.status().mode,'fighters');assert.equal(a.g.cityRadio217.ours(),false);
 assert.ok(texts(a.g).some(t=>/un repli est déjà en cours, rien n’est changé/.test(t)));
 a.g.phase='aftermath';step(a.g,3);assert.equal(a.g.fallbackOrder.status().mode,'fighters','l’ordre du Commandant n’est pas levé par la cité');

 const {g}=campaign(),{north}=enclose(g);
 assert.equal(g.cityRadio217.setOrder('everyone').ok,true);step(g);leaveAtGate(g);step(g);g.phase='assault';step(g);fell(g,north);step(g);
 assert.equal(g.cityRadio217.ours(),true);
 const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
 assert.equal(g.frontier.leave(),true,'retour par la jonction');assert.equal(g.player.regionAbsent,false);
 step(g);
 assert.equal(g.cityRadio217.ours(),false);assert.equal(g.fallbackOrder.status().mode,'everyone','le repli reste en vigueur');
 assert.equal(notes.filter(t=>/^Votre consigne a fait replier la cité/.test(t)).length,1);
 assert.equal(notes.filter(t=>/^Radio : \d+ messages? reçus? pendant votre sortie/.test(t)).length,1);
 g.phase='aftermath';step(g,3);assert.equal(g.fallbackOrder.status().mode,'everyone');
 step(g,3);assert.equal(notes.filter(t=>/^Radio : /.test(t)).length,1,'un seul rappel au retour');
});

test('radio 217 : sauvegarde et reprise gardent consigne et journal, sans rien réannoncer ni réappliquer',()=>{
 const {g,doc}=campaign(),{north}=enclose(g);
 assert.equal(g.cityRadio217.setOrder('everyone').ok,true);step(g);leave(g);step(g);g.phase='assault';step(g);fell(g,north);step(g);
 const saved=clone(g.serialize()),module=saved.expansions127.modules.cityRadio217,journal=clone(g.cityRadio217.journal());
 assert.equal(module.active,true);assert.equal(module.order,'everyone');assert.equal(module.ours,true);assert.equal(module.applied,g.wave);assert.deepEqual(module.journal,journal);
 assert.equal(g.restoreSave(clone(saved)),true);assert.equal(g.player.regionAbsent,true);
 assert.deepEqual(clone(g.cityRadio217.journal()),journal);
 let orders=0;const setWorkerOrder=g.setWorkerOrder;g.setWorkerOrder=function(order){if(order==='retreat')orders++;return setWorkerOrder.call(this,order);};
 step(g,10);
 assert.deepEqual(clone(g.cityRadio217.journal()),journal,'rien n’est annoncé à la reprise');assert.equal(orders,0);
 assert.equal(g.fallbackOrder.status().mode,'everyone','le repli en cours est celui de la sauvegarde');
 assert.match(doc.getElementById('cityRadio217Log').children.map(n=>n.children.map(c=>c.textContent).join(' ')).join('|'),/Brèche au nord/);
 assert.deepEqual(g.serialize().expansions127.modules.cityRadio217,module,'reprise sans dérive');
 const broken=clone(saved);broken.expansions127.modules.cityRadio217.order='charge';
 assert.throws(()=>g.restoreSave(broken),/Radio 217 invalide/);
 assert.deepEqual(clone(g.cityRadio217.journal()),journal,'une sauvegarde refusée ne change rien');
});

test('radio 217 : ancienne campagne — la radio transmet en mémoire, aucune consigne, rien de sauvegardé',()=>{
 const {g,doc}=campaign(),{north}=enclose(g);
 const old=clone(g.serialize());delete old.expansions127.modules.cityRadio217;
 assert.equal(g.restoreSave(old),true);
 assert.equal(g.cityRadio217.active(),false);assert.deepEqual(g.cityRadio217.actions(),[]);
 assert.equal(g.cityRadio217.setOrder('everyone').ok,false);assert.match(g.cityRadio217.quote('everyone').reason,/avant les consignes/);
 assert.equal(doc.getElementById('cityRadio217-everyone').hidden,true);
 const wall=[...g.world.buildings.values()].find(b=>b.gx===north.gx&&b.gy===north.gy&&b.def?.wall);assert.ok(wall);
 step(g);leave(g);step(g);g.phase='assault';step(g);fell(g,wall);step(g);
 assert.equal(breaches(g).length,1,'la radio reste de la présentation, pour toutes les campagnes');
 assert.equal(g.fallbackOrder.status().mode,null);
 assert.deepEqual(g.serialize().expansions127.modules.cityRadio217,Radio.initial());
 assert.match(g.cityRadio217.overview().summary,/avant les consignes/);
});

test('radio 217 : les bandes errantes restent suspendues pendant l’absence, radio installée',()=>{
 const {g}=campaign();
 g.daylight=()=>1;g.phase='calm';g.phaseTime=9999;leave(g);
 const ids=new Set(g.zombies.map(z=>z.id)),hordes=g.exploration125.wildHordes||0;
 assert.equal(g.exploration125.spawnWildHorde(),false);
 g.exploration125.wildNext=g.elapsed+.05;for(let i=0;i<20;i++)g.update(.05);
 assert.equal(g.exploration125.wildHordes||0,hordes);assert.equal(g.zombies.filter(z=>!ids.has(z.id)).length,0);
 assert.deepEqual(texts(g),[]);
});
