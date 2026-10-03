'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const Intro=require('../src/campaign-intro132.js'),C=require('../src/core.js');
function fresh(){const e=boot131({ui:true});Intro.install(e.g,e.doc);e.g.startNew('standard','17118');return e;}
function stable(g){const s=g.serialize();delete s.timestamp;return s;}
function ticks(g,n){for(let i=0;i<n;i++)g.update(.04);}

test('intro 143 : les premiers gestes ne masquent pas une récompense réservée dans un dépôt plein',()=>{
 const {g}=fresh();g.campaignIntro132.skip();
 g.resources.wood=g.storage;g.resources.scrap=g.storage;g.depositedResources=C.OBJECTIVES[0].target;
 g.updateObjective();g.updateUI();
 assert.equal(g.chronicles131.snapshot().prologue.status,'active');assert.equal(g.objectiveReady,true);
 assert.equal(g.ui.objectiveTitle.textContent,C.OBJECTIVES[0].title);
 assert.match(g.ui.objectiveText.textContent,/récompense réservée.*Place manquante/i);
 assert.match(g.ui.objectiveCounter.textContent,/RÉCOMPENSE RÉSERVÉE/);
 g.resources.wood-=C.OBJECTIVES[0].reward.wood;g.resources.scrap-=C.OBJECTIVES[0].reward.scrap;
 g.updateObjective();g.updateUI();
 assert.equal(g.objectiveReady,false);assert.match(g.ui.objectiveTitle.textContent,/Premiers gestes/);
});

test('intro 132 : quatre tableaux automatiques, vrais premiers gestes sauvegardés et aucune récompense',()=>{
 const {g,doc}=fresh(),a=g.campaignIntro132,before=stable(g);
 assert.equal(a.isOpen(),true);assert.equal(g.paused,true);assert.equal(g.activeOverlay,a.element);assert.equal(g.ui.hud.inert,true);assert.equal(g.canIssueCommand(),false);
 assert.equal(g.chronicles131.snapshot().prologue.status,'active');assert.equal(g.chronicles131.snapshot().prologue.stage,0);assert.equal(doc.activeElement.id,'campaignIntro132Next');
 const basics=doc.getElementById('campaignIntro132Basics');assert.equal(basics.hidden,true);
 for(let i=0;i<3;i++){assert.equal(a.view().index,i);assert.equal(a.element.querySelector('img').getAttribute('src'),Intro.SHOTS[i].image);a.next();}
 assert.match(doc.getElementById('campaignIntro132Facts').textContent,/Départ classique/);assert.equal(doc.getElementById('campaignIntro132Next').textContent,'PRENDRE MON QUART');
 assert.equal(basics.hidden,false);assert.equal(basics.querySelectorAll('dt').length,4);assert.equal(basics.querySelector('dt').textContent,'ZQSD / WASD');assert.match(basics.querySelectorAll('dd')[1].textContent,/récolter ou déposer/);
 a.next();assert.equal(a.isOpen(),false);assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(g.ui.hud.inert,false);assert.equal(doc.activeElement,g.canvas);assert.deepEqual(stable(g),before);
 assert.match(g.ui.objectiveTitle.textContent,/Récolter/);assert.match(g.ui.objectiveCounter.textContent,/1 \/ 3/);
});

test('intro 132 : simulation, touches tenues, commandes et pause sont bloquées jusqu’au choix du joueur',()=>{
 const {g,dispatchWindow}=fresh(),before=stable(g),phase=g.phaseTime,position={x:g.player.x,y:g.player.y};
 dispatchWindow('keydown',{code:'KeyD'});dispatchWindow('keydown',{code:'Space'});g.input.keys.add('KeyE');g.input.mouseDown=true;
 for(let i=0;i<80;i++){g.loop(g.lastFrame+40);g.update(.04);}
 assert.equal(g.phaseTime,phase);assert.deepEqual({x:g.player.x,y:g.player.y},position);assert.deepEqual(stable(g),before);assert.equal(g.input.keys.size,0);assert.equal(g.input.mouseDown,false);
 assert.equal(g.togglePause(false),false);assert.equal(g.paused,true);g.showHelp(true);g.showCommand(true);assert.equal(g.activeOverlay,g.campaignIntro132.element);
 g.campaignIntro132.skip();g.update(.04);assert.ok(g.elapsed>before.elapsed);assert.equal(g.chronicles131.snapshot().prologue.status,'active');
});

test('intro 132 : clavier, focus modal, navigation inverse et réduction du mouvement',()=>{
 const {g,doc,dispatchWindow}=fresh(),a=g.campaignIntro132,next=doc.getElementById('campaignIntro132Next'),skip=doc.getElementById('campaignIntro132Skip');
 const copy=a.element.querySelector('.campaign132-copy');
 a.element.dispatch('keydown',{code:'PageDown'});assert.ok(copy.scrollTop>0,'Le récit défile au clavier sans déplacer le pied de page');
 a.next();assert.equal(copy.scrollTop,0);a.previous();
 a.element.scrollTop=380;a.refresh();assert.equal(a.element.scrollTop,380);a.element.dispatch('keydown',{code:'ArrowRight'});assert.equal(a.view().index,1);assert.equal(a.element.scrollTop,0);a.element.scrollTop=240;a.element.dispatch('keydown',{code:'ArrowLeft'});assert.equal(a.view().index,0);assert.equal(a.element.scrollTop,0);assert.equal(a.previous(),false);
 skip.focus();dispatchWindow('keydown',{code:'Tab'});assert.equal(doc.activeElement,next);dispatchWindow('keydown',{code:'Tab',shiftKey:true});assert.equal(doc.activeElement,skip);
 g.settings.reducedMotion=true;a.refresh();assert.ok(a.element.classList.contains('campaign132-static'));assert.equal(a.element.getAttribute('aria-modal'),'true');
 dispatchWindow('keydown',{code:'Escape'});assert.equal(a.isOpen(),false);assert.equal(g.paused,false);assert.equal(g.chronicles131.snapshot().prologue.status,'active');
});

test('intro 132 : quitter la fenêtre préserve une pause volontaire après le dernier tableau',()=>{
 const {g,doc}=fresh();g.suspendForFocusLoss();g.campaignIntro132.skip();
 assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);assert.equal(g.ui.pauseMenu.classList.contains('hidden'),false);assert.ok(g.ui.pauseMenu.contains(doc.activeElement));
 const elapsed=g.elapsed;g.loop(g.lastFrame+40);assert.equal(g.elapsed,elapsed);g.togglePause(false);assert.equal(g.paused,false);
});

test('intro 132 : relecture depuis pause, commandement et menu ne modifie ni campagne ni prologue',()=>{
 const {g,doc}=fresh();g.campaignIntro132.skip();g.togglePause(true);const before=stable(g);doc.getElementById('resumeButton').focus();
 assert.ok(g.campaignIntro132.replay());g.campaignIntro132.skip();assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);assert.equal(doc.activeElement.id,'resumeButton');assert.deepEqual(stable(g),before);
 g.togglePause(false);g.showCommand(true);assert.ok(g.campaignIntro132.replay());g.campaignIntro132.skip();assert.equal(g.activeOverlay,g.ui.commandModal);g.showCommand(false);assert.equal(g.paused,false);
 g.returnToMenu();const menuBefore=stable(g);assert.ok(g.campaignIntro132.replay());g.campaignIntro132.skip();assert.equal(g.state,'menu');assert.equal(g.activeOverlay,g.ui.mainMenu);assert.deepEqual(stable(g),menuBefore);
});

test('intro 132 : première collecte, dépôt personnel et chantier réel avancent le HUD sans supprimer les objectifs',()=>{
 const {g}=fresh();g.campaignIntro132.skip();
 const node=g.world.nodes.find(n=>n.type==='wood'&&!n.depleted&&g.fieldcraft.service(g.player,n));assert.ok(node);standAt(g,g.player,node);g.input.keys.add('KeyE');
 for(let i=0;i<600&&g.stats.gathered<C.Chronicles131Rules.prologueGather;i++)g.updateInteraction(.04);
 g.input.keys.clear();g.chronicles131.tick(.04);g.updateUI();assert.equal(g.chronicles131.snapshot().prologue.stage,1);assert.match(g.ui.objectiveTitle.textContent,/Déposer/);
 standAt(g,g.player,g.core());g.input.keys.add('KeyE');g.updateInteraction(.04);g.input.keys.clear();g.chronicles131.tick(.04);g.updateUI();assert.equal(g.chronicles131.snapshot().prologue.stage,2);assert.match(g.ui.objectiveTitle.textContent,/Bâtir/);
 g.selectBuild('woodWall');let b=null;
 for(let y=72;y<85&&!b;y++)for(let x=72;x<85&&!b;x++){const old=new Set(g.world.buildings.keys());if(g.placeOne('woodWall',x,y)){b=[...g.world.buildings.values()].find(v=>!old.has(v.id));}}
 assert.ok(b,'Un chantier doit être financé et placé');assert.equal(b.completed,false);const approach=[{x:b.x+48,y:b.y},{x:b.x-48,y:b.y},{x:b.x,y:b.y+48},{x:b.x,y:b.y-48}].find(p=>g.friendlyPositionClear(g.player,p.x,p.y));assert.ok(approach);Object.assign(g.player,approach);assert.ok(g.workerCanWorkAt(g.player,b,78));g.input.keys.add('KeyE');
 for(let i=0;i<1500&&!b.completed;i++)g.updateInteraction(.04);
 g.input.keys.clear();assert.equal(b.completed,true);g.chronicles131.tick(.04);g.updateUI();assert.equal(g.chronicles131.snapshot().prologue.status,'done');assert.doesNotMatch(g.ui.objectiveTitle.textContent,/Premiers gestes/);assert.ok(g.objectiveIndex>=0);
});

test('intro 132 : une installation sans DOM exploitable est sans effet et installer deux fois ne double pas les scènes',()=>{
 assert.equal(Intro.install(null,null),null);assert.equal(Intro.install({chronicles131:{}},{}),null);const {g,doc}=fresh();const a=g.campaignIntro132;assert.equal(Intro.install(g,doc),a);assert.equal(doc.body.querySelectorAll('#campaignIntro132').length,1);
});
