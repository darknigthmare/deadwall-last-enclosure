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

// État version 2 (consignes par district) : l’état de la première tranche (version 1) reste lisible et se convertit.
const nine=()=>Array(9).fill(null);
test('radio 217 : état validé strictement ; une ancienne sauvegarde est inactive, une campagne neuve active',()=>{
 assert.deepEqual(Radio.validate(undefined),{version:2,active:false,order:'hold',applied:null,ours:false,mode:null,districts:nine(),done:nine(),sacrifice:null,journal:[]});
 assert.deepEqual(Radio.fresh(),{version:2,active:true,order:'hold',applied:null,ours:false,mode:null,districts:nine(),done:nine(),sacrifice:null,journal:[]});
 const ok={version:1,active:true,order:'everyone',applied:3,ours:true,journal:[{at:12.5,wave:3,tone:'danger',text:'Brèche au nord (Palissade).'}]};
 assert.deepEqual(Radio.validate(clone(ok)),{...ok,version:2,mode:'everyone',districts:nine(),done:nine(),sacrifice:null},'un état de la première tranche est converti, consigne générale gardée');
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
 // Deux pans au nord tels que la brèche 217 peut en relever : le plus court possible, et un plus long avec une porte.
 const short=C.Breach217Rules.minLength,longer=short+1;
 const g={phase:'warning',wave:4,morale:5,resources:{ammo:0},core:()=>({health:30,maxHealth:100}),balance217:{moraleTiers:()=>true},
  cityWater215:{needed:()=>true,stage:()=>6},breach217:{threatened:()=>[{side:'north',length:short,gates:0},{side:'north',length:longer,gates:1}]},
  corpseHeaps217:{summary:()=>({north:{state:'franchi',gate:false},east:null,south:{state:'imminent',gate:true},west:{state:'haut',gate:false}})},
  fallbackOrder:{status:()=>({closed:true,infectedInside:2,lastBreach:{side:'east',name:'Porte',wave:4,at:90}}),nightLog:()=>({wave:4,lost:['east'],retaken:['west']})}};
 const list=Radio.facts(g),by=Object.fromEntries(list.map(f=>[f.key,f]));
 assert.deepEqual(Object.keys(by).sort(),['ammo','breach:4:90','core','front:4','heap:north','heap:south','lost:4:east','morale','pan:north','retaken:4:west','water'].sort());
 assert.equal(by['breach:4:90'].text,'Brèche au est (Porte). 2 infectés dans l’enceinte intérieure.');
 assert.equal(by['pan:north'].text,'Le mur nord menace de céder sur '+longer+' ouvrages, porte comprise.');
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

test('radio 217 : vague menée et paliers de maladie, lus chez leurs propriétaires',()=>{
 const base={phase:'calm',wave:16,morale:5,resources:{ammo:40}};
 const forecast={wave:16,side:'east',status:'alive',decided:false,plan:200,alive:240,slain:176,escort:6,standing:6,woken:false};
 let by=Object.fromEntries(Radio.facts({...base,abominations217:{forecast:()=>forecast}}).map(f=>[f.key,f]));
 assert.deepEqual(Object.keys(by),['led:16']);assert.equal(by['led:16'].level,1);
 assert.equal(by['led:16'].text,'Vague 16 menée : une Meneuse rassemble la horde à l’est. 240 contacts si elle vit à l’assaut, 176 si elle tombe.');
 by=Object.fromEntries(Radio.facts({...base,abominations217:{forecast:()=>({...forecast,woken:true,standing:4})}}).map(f=>[f.key,f]));
 assert.equal(by['led:16'].level,2,'dérangée : une aggravation');assert.equal(by['led:16'].text,'Meneuse dérangée à l’est : elle marche sur la cité avec 4 infectés de son escorte.');
 by=Object.fromEntries(Radio.facts({...base,abominations217:{forecast:()=>({...forecast,status:'slain'})}}).map(f=>[f.key,f]));
 assert.deepEqual(Object.keys(by),['ledslain:16']);assert.equal(by['ledslain:16'].tone,'good');assert.match(by['ledslain:16'].text,/176 contacts attendus/);
 assert.deepEqual(Radio.facts({...base,abominations217:{forecast:()=>({...forecast,status:'gathered',decided:true})}}),[],'décidée : l’assaut est relayé par ailleurs');
 assert.deepEqual(Radio.facts({...base,abominations217:{forecast:()=>{throw Error('x');}}}),[],'un propriétaire en défaut ne bloque rien');
 const levels=[0,1,2,3,4,5,6].map(stage=>Radio.facts({...base,corpseChain217:{open:()=>true,stage:()=>stage}}).find(f=>f.key==='disease')?.level??0);
 assert.deepEqual(levels,[0,1,2,2,3,3,4]);
 assert.deepEqual(Radio.facts({...base,corpseChain217:{open:()=>false,stage:()=>6}}),[],'filière fermée : rien');
});

test('radio 217 : la vague menée et la maladie sont relayées une fois pendant la sortie, jamais à la reprise',()=>{
 const {g}=campaign(),api=g.abominations217,wave=api.next();
 g.wave=wave-1;g.phase='calm';g.phaseTime=60;
 step(g);leave(g);step(g,2);const before=texts(g).length;
 g.wave=wave;api.tick();assert.ok(api.leader(),'la Meneuse paraît pendant la sortie');
 step(g);const led=texts(g).slice(before).filter(t=>t.startsWith('Vague '+wave+' menée'));assert.equal(led.length,1);
 step(g,4);assert.equal(texts(g).filter(t=>t.startsWith('Vague '+wave+' menée')).length,1,'une fois par épisode');
 let stage=0;g.corpseChain217={open:()=>true,stage:()=>stage};
 stage=2;step(g,2);stage=4;step(g,2);stage=4;step(g,2);
 assert.equal(texts(g).filter(t=>/^Salubrité : l’odeur/.test(t)).length,1);assert.equal(texts(g).filter(t=>/^Maladie : des habitants tombent malades/.test(t)).length,1);
 const count=texts(g).length,saved=clone(g.serialize());assert.equal(g.restoreSave(saved),true);
 g.corpseChain217={open:()=>true,stage:()=>4};step(g,4);
 assert.equal(texts(g).length,count,'la reprise ne relaie rien de ce qui était connu');
});

// ——— Deuxième tranche : consignes par district, sacrifice et reconquête ———
const Districts=require('../src/districts.js');
const RATIO=C.BATTLEFIELD_RULES.fragileWallRatio;
function city(){
 const {g,doc}=bootDocument134();Fallback.install(g,doc);Radio.install(g,doc);Districts.install(g,doc);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 return {g,doc};
}
// Enceinte carrée de palissades à `r` cases du centre, porte de deux cases au nord (même tracé que le test des districts).
function ring(g,r){
 const core=g.core(),cells=T.footprint(core),placed=[];
 const put=(type,gx,gy)=>{const B=core.constructor,b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
 const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
 for(let x=x0;x<=x1;x++){if(x===gateX)put('gate',x,y0);else if(x!==gateX+1)put('woodWall',x,y0);put('woodWall',x,y1);}
 for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
 g.world.navigationVersion++;g.refreshMetrics(true);
 const row=y=>placed.filter(b=>b.gy===y&&!T.isGate(b)).sort((a,b)=>a.gx-b.gx);
 return {placed,gate:placed.find(b=>T.isGate(b)),north:row(y0),south:row(y1),mid:placed.find(b=>!T.isGate(b)&&b.gy===y1&&b.gx===cells.x+3),at:d=>({x:core.x,y:(y0-d+.5)*C.TILE})};
}
// Deux enceintes : 1 à trois cases du centre, 2 à sept cases. Tout le monde est mis au centre.
function twoRings(g){
 const a=ring(g,3),b=ring(g,7),center={x:g.core().x,y:g.core().y+C.TILE*2};
 for(const u of g.units){u.x=center.x;u.y=center.y;}g.player.x=center.x;g.player.y=center.y;
 return {a,b,center};
}
// Un fusilier posé près d'un point, sur une place libre, dans la section voulue.
function soldier(g,point,squad){
 for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[1,1],[-1,1],[2,0],[-2,0]]){const u=g.createProtectedSurvivor('soldier',point.x+dx*C.TILE*.75,point.y+dy*C.TILE*.75);if(u){u.squad=squad;return u;}}
 assert.fail('fusilier posé');
}
function tickAll(g,n=1){for(let i=0;i<n;i++){g.elapsed+=1;g.breach217.tick();g.fallbackOrder.tick();g.cityRadio217.tick();}g.cityRadio217.refresh();}
const weakenAll=list=>{for(const b of list)b.health=b.maxHealth*RATIO*.5;};
const notesOf=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const state217=g=>g.serialize().expansions127.modules.cityRadio217;

test('consignes par district : état version 2 validé strictement, conversion de la première tranche',()=>{
 const v1={version:1,active:true,order:'fighters',applied:4,ours:true,journal:[]};
 const up=Radio.validate(clone(v1));
 assert.equal(up.version,2);assert.equal(up.order,'fighters');assert.equal(up.mode,'fighters','le repli en cours de la cité est retrouvé');assert.deepEqual(up.districts,nine());assert.deepEqual(up.done,nine());assert.equal(up.sacrifice,null);
 assert.deepEqual(Radio.validate(clone(up)),up,'la conversion est stable');
 const ok={...Radio.fresh(),order:'everyone',districts:['hold','fighters','sacrifice','evacuate',null,null,null,null,null],done:[null,null,7,null,null,null,null,null,null],ours:true,mode:'everyone',
  sacrifice:{ring:2,wave:7,gates:[[40,'auto'],[41,'closed']]}};
 assert.deepEqual(Radio.validate(clone(ok)),ok);
 const bad=change=>{const raw=clone(ok);change(raw);assert.throws(()=>Radio.validate(raw),/Radio 217 invalide/);};
 bad(r=>{r.districts[1]='sacrifice';});bad(r=>{r.districts[0]='sacrifice';});bad(r=>{r.districts[3]='charge';});bad(r=>{r.districts.push(null);});bad(r=>{r.done[2]=-1;});bad(r=>{r.done='x';});
 bad(r=>{r.mode=null;});bad(r=>{r.ours=false;});bad(r=>{r.mode='rally';});bad(r=>{r.done=nine();r.applied=null;});bad(r=>{delete r.sacrifice;});bad(r=>{r.extra=1;});
 bad(r=>{r.sacrifice.ring=1;});bad(r=>{r.sacrifice.ring=9;});bad(r=>{r.sacrifice.gates.push([40,'auto']);});bad(r=>{r.sacrifice.gates[0][1]='open';});bad(r=>{r.sacrifice.extra=1;});bad(r=>{r.sacrifice.gates[0][0]=0;});
 bad(r=>{r.active=false;r.order='hold';r.applied=null;r.ours=false;r.mode=null;});
 assert.deepEqual(Radio.POSTURES,['hold','fighters','evacuate','sacrifice']);
});

test('consignes par district : deux districts, deux consignes, chacune appliquée une seule fois, en présence',()=>{
 const {g}=city(),{b}=twoRings(g),notes=notesOf(g),R2=g.cityRadio217;
 assert.deepEqual(R2.districtStates().map(d=>[d.rank,d.name,d.state]),[[1,'Enceinte intérieure','held'],[2,'Deuxième enceinte','held'],[0,'Dehors',null]]);
 assert.equal(R2.setDistrictOrder(1,'fighters').ok,true);assert.equal(R2.setDistrictOrder(2,'evacuate').ok,true);
 assert.equal(R2.districtQuote(2,'evacuate').ok,false,'déjà en vigueur');assert.equal(R2.districtQuote(5,'hold').ok,false,'aucun district de ce rang');
 assert.equal(R2.districtQuote(1,'sacrifice').ok,false);assert.match(R2.districtQuote(1,'sacrifice').reason,/garde le centre/);assert.equal(R2.districtQuote(0,'sacrifice').ok,false);
 assert.deepEqual(state217(g).districts.slice(0,3),[null,'fighters','evacuate']);
 let retreats=0;const setWorkerOrder=g.setWorkerOrder;g.setWorkerOrder=function(order,...rest){if(order==='retreat')retreats++;return setWorkerOrder.call(this,order,...rest);};
 const stock=JSON.stringify(g.resources),zombies=g.zombies.length;
 tickAll(g);g.phase='assault';tickAll(g,2);
 assert.equal(g.fallbackOrder.status().mode,null,'sans brèche ni pan menacé, rien');
 // Les débris de la chute sont tirés par la destruction du jeu ; ensuite, plus aucun tirage.
 fell(g,b.mid);const rng=g.random.state;tickAll(g);
 assert.equal(g.fallbackOrder.status().mode,'everyone','la deuxième enceinte s’évacue par le repli général');assert.equal(g.workerOrder,'retreat');assert.equal(retreats,1);
 assert.equal(g.districts.lineRank(),1,'derrière l’enceinte intérieure');
 assert.equal(notes.filter(t=>t.startsWith('Consigne de la deuxième enceinte appliquée')).length,1);
 const done=state217(g).done;assert.equal(done[2],g.wave);assert.equal(done[1],null,'la consigne de l’enceinte intérieure attend sa propre brèche');
 tickAll(g,5);assert.equal(retreats,1,'une seule fois par vague');
 assert.equal(notes.filter(t=>/^Votre consigne a fait replier la cité/.test(t)).length,1,'sur place, le repli reste au Commandant');assert.equal(R2.ours(),false);
 assert.deepEqual(texts(g),[],'sur place, rien n’entre au journal radio');
 assert.equal(JSON.stringify(g.resources),stock);assert.equal(g.random.state,rng,'aucun tirage');assert.equal(g.zombies.length,zombies);
});

test('consignes par district : replier les combattants d’un district ne replie que ses sections ; « tenir » ne donne rien',()=>{
 const {g}=city(),{a,b,center}=twoRings(g),notes=notesOf(g),R2=g.cityRadio217;
 const inner=soldier(g,{x:center.x-C.TILE*1.5,y:center.y},0),outer=soldier(g,a.at(2),1);
 assert.equal(g.districts.list()[1].defenders.byRole.soldier,1,'un fusilier dans la deuxième enceinte');
 const before=g.squads.groups.map(group=>group.order);
 assert.equal(R2.setDistrictOrder(2,'fighters').ok,true);assert.equal(R2.setDistrictOrder(1,'hold').ok,true);
 tickAll(g);g.phase='assault';fell(g,b.mid);tickAll(g);
 const after=g.squads.groups.map(group=>group.order);
 assert.equal(after[1],'retreat','la section Bravo, dans la deuxième enceinte, se replie');assert.equal(after[0],before[0],'la section Alpha garde son ordre');assert.equal(after[2],before[2]);
 assert.equal(g.fallbackOrder.status().mode,'fighters');assert.equal(g.workerOrder,'auto','les ouvriers gardent leurs ordres');
 assert.ok(notes.includes('Consigne de la deuxième enceinte appliquée : la section '+C.SQUAD_RULES.labels[1]+' se replie vers le centre.'),notes.join(' | '));
 fell(g,a.mid);g.elapsed+=10;tickAll(g);
 assert.ok(notes.some(t=>t==='Consigne de l’enceinte intérieure : tenir. Aucun ordre de repli n’est donné.'),notes.join(' | '));
 assert.equal(state217(g).done[1],g.wave);assert.equal(g.squads.groups[0].order,before[0]);assert.equal(inner.squad,0);assert.equal(outer.squad,1);
});

test('consignes par district : en sortie, une consigne propre l’emporte sur la consigne générale, qui remplit les autres districts',()=>{
 const {g}=city(),{a,b}=twoRings(g),R2=g.cityRadio217;
 assert.equal(R2.setDistrictOrder(2,'sacrifice').ok,true);
 assert.equal(R2.setOrder('everyone').ok,true);assert.deepEqual(state217(g).districts,nine(),'la consigne générale remplit tous les districts');
 assert.equal(R2.postureText(2),'Repli général à la première brèche (consigne générale, en votre absence)');
 assert.equal(R2.setDistrictOrder(2,'hold').ok,true);
 step(g);leave(g);step(g);assert.equal(R2.setDistrictOrder(2,'evacuate').ok,false,'les consignes se donnent sur place');
 g.phase='assault';step(g);fell(g,b.mid);tickAll(g);
 assert.equal(g.fallbackOrder.status().mode,null,'« tenir » l’emporte sur la consigne générale');assert.ok(texts(g).includes('Consigne de la deuxième enceinte : tenir. Aucun ordre de repli n’est donné.'),texts(g).join(' | '));
 fell(g,a.mid);g.elapsed+=10;tickAll(g);
 assert.equal(g.fallbackOrder.status().mode,'everyone','l’enceinte intérieure suit la consigne générale');assert.ok(texts(g).some(t=>/^Consigne appliquée : repli général/.test(t)));
 g.phase='aftermath';tickAll(g);assert.equal(g.fallbackOrder.status().mode,null,'levé l’assaut terminé');
});

test('sacrifier un secteur : décision annoncée, portes laissées, repli derrière l’enceinte intérieure, puis reconquête au matin',()=>{
 const {g,doc}=city(),{a,b}=twoRings(g),notes=notesOf(g),R2=g.cityRadio217;
 assert.equal(R2.setDistrictOrder(2,'sacrifice').ok,true);assert.match(notes.at(-1),/^Consigne de la deuxième enceinte : sacrifier\. Les portes du district restent ouvertes/);
 assert.match(notes.at(-1),/comptent toujours dans la signature/,'le prix est dit');
 const rng=g.random.state,stock=JSON.stringify(g.resources);
 tickAll(g);g.phase='warning';tickAll(g);assert.equal(g.fallbackOrder.status().mode,null,'pas de menace : rien');
 // Signe avant-coureur : un pan de la deuxième enceinte menace de céder. La consigne s'applique sans attendre la rupture.
 weakenAll(b.north.slice(0,5));tickAll(g);
 assert.deepEqual(g.breach217.districts().map(d=>d.rank),[2]);
 assert.equal(T.gateMode(b.gate),'open','la porte du district est laissée ouverte');assert.equal(g.fallbackOrder.status().mode,'everyone');assert.equal(g.districts.lineRank(),1);
 assert.equal(notes.filter(t=>/^Deuxième enceinte sacrifiée : sa porte laissée ouverte, la horde y passe plutôt que d’enfoncer les murs/.test(t)).length,1,notes.join(' | '));
 assert.deepEqual(R2.sacrificed(),{ring:2,wave:g.wave,gates:[b.gate.id]});
 tickAll(g);assert.equal(T.gateMode(a.gate),'closed','l’enceinte intérieure est verrouillée, tout le monde étant rentré');
 assert.equal(R2.districtStates()[1].state,'lost');assert.equal(R2.districtStates()[1].label,'perdu par choix');assert.notEqual(R2.districtStates()[0].state,'lost');
 // La horde passe par la porte ouverte : coût de passage d'une case libre pour le champ de flux.
 assert.equal(g.world.movementCost(b.gate.gx,b.gate.gy),10);assert.ok(g.world.movementCost(a.gate.gx,a.gate.gy)>10);
 const signature=g.signature;
 const saved=clone(g.serialize());assert.deepEqual(saved.expansions127.modules.cityRadio217.sacrifice,{ring:2,wave:g.wave,gates:[[b.gate.id,'auto']]});
 assert.equal(g.restoreSave(clone(saved)),true);notes.length=0;tickAll(g,3);
 assert.deepEqual(R2.sacrificed(),{ring:2,wave:g.wave,gates:[b.gate.id]},'reprise fidèle');assert.equal(notes.filter(t=>/sacrifiée/.test(t)).length,0,'rien n’est réappliqué');
 const gate2=g.world.buildings.get(b.gate.id),gate1=g.world.buildings.get(a.gate.id);assert.equal(T.gateMode(gate2),'open');
 // Un infecté entre par la porte laissée ouverte.
 const p=a.at(2),intruder={id:999999,x:p.x,y:p.y,health:10,dead:false,kind:'walker'};g.zombies.push(intruder);
 assert.deepEqual(R2.reconquest().steps.map(s=>s.done),[false,false,false]);assert.equal(R2.reconquest().intruders,1);
 R2.refresh();assert.equal(doc.getElementById('cityRadio217Reconquest').hidden,false);assert.match(doc.getElementById('cityRadio217Reconquest').children[0].textContent,/PERDU PAR CHOIX/);
 // Au matin : isoler, nettoyer, rétablir.
 g.phase='aftermath';tickAll(g);
 assert.equal(R2.isolate().ok,true);assert.equal(T.gateMode(gate2),'auto','la porte retrouve son mode d’avant');
 assert.deepEqual(R2.reconquest().steps.map(s=>s.done),[true,false,false]);
 g.zombies.splice(g.zombies.indexOf(intruder),1);tickAll(g);assert.deepEqual(R2.reconquest().steps.map(s=>s.done),[true,true,false]);
 assert.equal(g.fallbackOrder.standDown(),true);assert.equal(T.gateMode(gate1),'auto');tickAll(g);
 assert.equal(R2.sacrificed(),null);assert.equal(notes.filter(t=>t.startsWith('Deuxième enceinte reprise')).length,1);assert.equal(R2.districtStates()[1].state,'threatened','repris ; le pan reste à réparer');
 tickAll(g,3);assert.equal(notes.filter(t=>t.startsWith('Deuxième enceinte reprise')).length,1,'annoncé une fois');
 assert.equal(g.random.state,rng,'aucun tirage');assert.equal(JSON.stringify(g.resources),stock);g.refreshMetrics(true);assert.equal(g.signature,signature,'le secteur perdu compte toujours dans la signature');
});

test('sacrifier un secteur en sortie : la cité referme les portes et lève le repli l’assaut terminé',()=>{
 const {g}=city(),{b}=twoRings(g),R2=g.cityRadio217;
 assert.equal(R2.setDistrictOrder(2,'sacrifice').ok,true);step(g);leave(g);tickAll(g);
 g.phase='assault';fell(g,b.mid);tickAll(g);
 assert.equal(T.gateMode(b.gate),'open');assert.equal(g.fallbackOrder.status().mode,'everyone');assert.equal(R2.ours(),true);
 assert.ok(texts(g).some(t=>t.startsWith('Deuxième enceinte sacrifiée')),texts(g).join(' | '));
 g.phase='aftermath';tickAll(g);
 assert.equal(T.gateMode(b.gate),'auto');assert.equal(g.fallbackOrder.status().mode,null);
 assert.ok(texts(g).some(t=>/^Isoler la deuxième enceinte : 1 porte refermée\./.test(t)),texts(g).join(' | '));
 // L'enceinte est ouverte par la brèche : le secteur reste perdu tant qu'elle n'est pas rebâtie.
 assert.equal(R2.reconquest().closed,false);assert.equal(R2.reconquest().steps[0].done,false);
 const B=g.core().constructor,rebuilt=new B(g.nextId++,'woodWall',b.mid.gx,b.mid.gy,0,1);rebuilt.health=rebuilt.def.health;g.world.add(rebuilt);g.world.navigationVersion++;
 tickAll(g);assert.equal(R2.sacrificed(),null,'brèche rebâtie, district vide, repli levé : repris');assert.ok(texts(g).some(t=>t.startsWith('Deuxième enceinte reprise')));
});

test('pan menacé : la fiche propose tenir, évacuer ou sacrifier le district concerné',()=>{
 const {g}=city(),{a,b}=twoRings(g),R2=g.cityRadio217;
 tickAll(g);assert.deepEqual(g.breach217.actions(),[]);
 weakenAll(b.north.slice(0,5));tickAll(g);
 const ids=g.breach217.actions().map(x=>x.id);assert.deepEqual(ids,['decide-2-hold','decide-2-evacuate','decide-2-sacrifice']);
 assert.ok(g.breach217.overview().rows.some(r=>r.label==='Décision'&&/^Deuxième enceinte \(mur nord\) : tenir, évacuer ou sacrifier \?/.test(r.value)));
 g.breach217.actions().find(x=>x.id==='decide-2-evacuate').run();assert.equal(R2.districtOrder(2),'evacuate');
 assert.equal(g.breach217.actions().find(x=>x.id==='decide-2-evacuate').disabled,true,'consigne en vigueur');
 weakenAll(a.south.slice(0,5));tickAll(g);
 const inner=g.breach217.actions().filter(x=>x.id.startsWith('decide-1-'));assert.equal(inner.length,3);
 assert.equal(inner.find(x=>x.id==='decide-1-sacrifice').disabled,true);assert.match(inner.find(x=>x.id==='decide-1-sacrifice').reason,/garde le centre/);
 assert.equal(g.fallbackOrder.status().mode,null,'en journée, la décision attend l’alerte');
 g.phase='warning';tickAll(g);assert.equal(g.fallbackOrder.status().mode,'everyone','l’alerte venue, la consigne s’applique');
});

test('consignes par district : ancienne campagne inchangée, aucune consigne de district',()=>{
 const {g}=city(),{b}=twoRings(g);
 const old=clone(g.serialize());delete old.expansions127.modules.cityRadio217;assert.equal(g.restoreSave(old),true);
 const R2=g.cityRadio217;assert.match(R2.districtQuote(2,'sacrifice').reason,/avant les consignes/);assert.equal(R2.setDistrictOrder(2,'hold').ok,false);
 const walls=b.north.slice(0,5).map(w=>[...g.world.buildings.values()].find(o=>o.gx===w.gx&&o.gy===w.gy));weakenAll(walls);g.phase='assault';tickAll(g,3);
 assert.ok(g.breach217.districts().length>0,'le pan est bien relevé');assert.deepEqual(g.breach217.actions(),[],'aucune décision proposée hors consignes');assert.equal(g.fallbackOrder.status().mode,null);
 assert.deepEqual(state217(g),Radio.initial());
 // Une campagne de la première tranche se convertit : consigne générale gardée, districts sans consigne propre.
 const v1=clone(g.serialize());v1.expansions127.modules.cityRadio217={version:1,active:true,order:'everyone',applied:null,ours:false,journal:[]};
 assert.equal(g.restoreSave(v1),true);assert.equal(R2.order(),'everyone');assert.deepEqual(state217(g).districts,nine());assert.equal(state217(g).version,2);
});
