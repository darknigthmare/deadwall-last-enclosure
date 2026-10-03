'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js');
const pending={readyState:'loading',currentScript:{tagName:'SCRIPT'}};
function ready(env){document.readyState='interactive';document.currentScript=null;env.dispatchDocument('DOMContentLoaded');}

test('démarrage 132 : Nouveau et Continuer restent verrouillés pendant les scripts du document',()=>{
 const env=bootGame(pending),g=env.game,world=g.world;let started=0,loaded=0;
 g.startNew=()=>{started++;};g.load=()=>{loaded++;};
 env.storage.set(C.SAVE_KEY,'existing-save');
 for(let i=0;i<5;i++)g.refreshContinue();
 assert.equal(g.startupReady,false);assert.equal(g.ui.newGameButton.disabled,true);assert.equal(g.ui.continueButton.disabled,true);
 g.ui.newGameButton.click();g.ui.continueButton.click();assert.equal(g.requestNewGame(),false);
 assert.equal(started,0);assert.equal(loaded,0);assert.equal(g.world,world);
 ready(env);assert.equal(g.startupReady,true);assert.equal(g.ui.newGameButton.disabled,false);assert.equal(g.ui.continueButton.disabled,false);
});

test('démarrage 132 : Continuer redevient disponible selon la vraie sauvegarde après chargement',()=>{
 const env=bootGame(pending),g=env.game;g.startNew('standard','17117');g.returnToMenu();
 assert.equal(g.ui.continueButton.disabled,true);assert.ok(env.storage.get(C.SAVE_KEY));
 ready(env);assert.equal(g.ui.continueButton.disabled,false);g.ui.continueButton.click();
 assert.equal(g.state,'playing');assert.equal(g.world.seed,17117);assert.equal(g.save(false),true);
});

test('démarrage 132 : fin du chargement ne fabrique pas de bouton Continuer sans copie lisible en stockage',()=>{
 const env=bootGame(pending),g=env.game;ready(env);
 assert.equal(g.ui.newGameButton.disabled,false);assert.equal(g.ui.continueButton.disabled,true);
 const original=localStorage.getItem;try{localStorage.getItem=()=>{throw Error('Storage unavailable');};g.refreshContinue();
  assert.equal(g.ui.newGameButton.disabled,false);assert.equal(g.ui.continueButton.disabled,true);
 }finally{localStorage.getItem=original;}
});

test('démarrage 132 : autostart attend tous les installateurs DOMContentLoaded et ne lance qu’une fois',()=>{
 const original=setTimeout,timers=[];globalThis.setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
 try{
  const env=bootGame({...pending,search:'?autostart=1&difficulty=brutal'}),g=env.game;
  assert.equal(timers.length,0);assert.equal(g.state,'menu');
  let lateInstalled=false,calls=0;const start=g.startNew.bind(g);
  document.addEventListener('DOMContentLoaded',()=>{
   lateInstalled=true;g.startNew=(...args)=>{assert.equal(lateInstalled,true);calls++;return start(...args);};
  });
  ready(env);assert.equal(calls,0);assert.equal(lateInstalled,true);assert.equal(timers.length,1);assert.equal(timers[0].ms,50);
  timers.shift().fn();assert.equal(calls,1);assert.equal(g.state,'playing');assert.equal(g.difficulty.id,'brutal');
  env.dispatchDocument('DOMContentLoaded');assert.equal(timers.length,0);assert.equal(calls,1);
 }finally{globalThis.setTimeout=original;}
});

test('démarrage 132 : un choix utilisateur après chargement annule l’autostart en attente',()=>{
 const original=setTimeout,timers=[];globalThis.setTimeout=fn=>{timers.push(fn);return timers.length;};
 try{
  const env=bootGame({...pending,search:'?autostart=1'}),g=env.game;ready(env);
  g.startNew('story','42','convoy');const world=g.world,run=g.runId;
  for(const fn of timers.splice(0))fn();assert.equal(g.world,world);assert.equal(g.runId,run);
  assert.equal(g.world.seed,42);assert.equal(g.scenarioId,'convoy');assert.equal(g.difficulty.id,'story');
 }finally{globalThis.setTimeout=original;}
});

test('démarrage 132 : moteur headless et installation après le DOM restent immédiatement utilisables',()=>{
 for(const options of [{},{readyState:'complete',currentScript:{tagName:'SCRIPT'}},{readyState:null,currentScript:{tagName:'SCRIPT'}}]){
  const{game:g}=bootGame(options);assert.equal(g.startupReady,true);assert.equal(g.ui.newGameButton.disabled,false);
  assert.equal(g.requestNewGame(),true);assert.equal(g.state,'playing');
 }
});
