'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const C=require('../src/core.js');
const Intro=require('../src/campaign-intro132.js');
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(){
 const e=boot131({ui:true}),g=e.g,doc=e.doc;
 const options=require.resolve('../src/ui.js');delete require.cache[options];require(options);
 g.returnToMenu();Intro.install(g,doc);
 return{...e,g,doc,intro:g.campaignIntro132};
}
for(const scenario of Object.keys(C.START_SCENARIOS))for(const difficulty of Object.keys(C.DIFFICULTIES)){
 test(`QA132 entrée réelle : ${scenario} / ${difficulty}, introduction puis campagne intacte`,()=>{
  const{g,intro,storage}=fixture();g.startNew(difficulty,'17117',scenario);
  assert.equal(intro.isOpen(),true);assert.equal(intro.view().scenario,scenario);
  assert.equal(g.chronicles131.snapshot().prologue.status,'active');
  const initial=clone(g.serialize()),expected=globalThis.DeadwallScenarios.initialState(scenario,difficulty);
  assert.deepEqual(initial.resources,expected.resources);assert.deepEqual(g.units.map(u=>u.kind),expected.roster);
  assert.equal(g.core().health,expected.coreHealth);
  assert.equal(initial.phaseTime,expected.calmSeconds);
  for(let i=0;i<3;i++){g.update(.04);g.loop(g.lastFrame+40);intro.next();}
  assert.equal(intro.isOpen(),true);assert.equal(intro.view().index,3);
  assert.deepEqual(g.resources,initial.resources);assert.equal(g.phaseTime,initial.phaseTime);
  assert.equal(g.elapsed,initial.elapsed);assert.equal(g.dayClock,initial.dayClock);assert.equal(g.player.x,initial.player.x);
  const stored=globalThis.DeadwallSave.parse(storage.get(C.SAVE_KEY));
  assert.equal(stored.expansions127.modules.lore131.prologue.status,'active');
  intro.next();assert.equal(intro.isOpen(),false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
  assert.equal(g.canIssueCommand(),true);assert.match(g.ui.objectiveTitle.textContent,/Récolter/);
  assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(intro.isOpen(),false);
  assert.equal(g.chronicles131.snapshot().prologue.status,'active');
 });
}

test('QA132 : le clic Nouvelle partie annulé conserve la campagne ; accepté ouvre le récit',()=>{
 const{g,intro,doc,storage}=fixture();const before=storage.get(C.SAVE_KEY),world=g.world;
 const confirm=globalThis.confirm;try{
  globalThis.confirm=()=>false;doc.getElementById('newGameButton').click();
  assert.equal(g.world,world);assert.equal(storage.get(C.SAVE_KEY),before);assert.equal(intro.isOpen(),false);
  globalThis.confirm=()=>true;doc.getElementById('newGameButton').click();
  assert.notEqual(g.world,world);assert.equal(intro.isOpen(),true);assert.equal(g.activeOverlay,intro.element);
 }finally{globalThis.confirm=confirm;}
});

test('QA132 : graine ou scénario invalide ne détruit ni l’introduction ni la sauvegarde courante',()=>{
 const{g,intro,storage}=fixture();g.startNew('standard','17117');intro.next();
 const world=g.world,snapshot=clone(g.serialize()),saved=storage.get(C.SAVE_KEY),view=intro.view();
 for(const args of [['standard','not-a-seed','classic'],['standard','17117','missing-scenario']]){
  assert.equal(g.startNew(...args),false);assert.equal(g.world,world);assert.deepEqual(intro.view(),view);
  assert.equal(g.activeOverlay,intro.element);assert.equal(g.paused,true);assert.equal(storage.get(C.SAVE_KEY),saved);
  assert.deepEqual(g.serialize().resources,snapshot.resources);assert.deepEqual(g.chronicles131.snapshot(),snapshot.expansions127.modules.lore131);
 }
});

test('QA132 : nouvelle campagne pendant le récit remplace proprement les états et le contexte',()=>{
 const{g,intro,doc}=fixture();g.startNew('standard','17117');intro.next();intro.next();
 g.startNew('brutal','99','rearguard');
 assert.deepEqual(intro.view(),{open:true,index:0,total:4,replay:false,scenario:'rearguard'});
 assert.equal(g.world.seed,99);assert.equal(g.difficulty.id,'brutal');assert.equal(g.activeOverlay,intro.element);
 assert.equal(doc.body.querySelectorAll('#campaignIntro132').length,1);
 intro.skip();assert.equal(g.paused,false);assert.equal(g.ui.hud.inert,false);assert.equal(g.activeOverlay,null);
});

test('QA132 : inventaire, carte, opérations, aide et paramètres ne percent pas le récit',()=>{
 const{g,intro}=fixture();g.startNew('standard','17117');const initial=clone(g.serialize());
 for(const attempt of [()=>g.loadoutUI.open(),()=>g.expansionUI.open(),()=>g.frontierUI.open(),()=>g.showHelp(true),()=>g.showSettings(true),()=>g.showCommand(true)]){
  attempt();assert.equal(intro.isOpen(),true);assert.equal(g.activeOverlay,intro.element);assert.equal(g.paused,true);
  assert.equal(g.loadoutUI.isOpen(),false);assert.equal(g.ui.commandModal.classList.contains('hidden'),true);
 }
 assert.equal(g.canIssueCommand(),false);assert.deepEqual(g.resources,initial.resources);assert.equal(g.phaseTime,initial.phaseTime);
 intro.skip();assert.equal(g.loadoutUI.open(),true);g.loadoutUI.close();assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);
});

test('QA132 : retour au menu puis Continuer retrouve le tutoriel sans recommencer les tableaux',()=>{
 const{g,intro,doc}=fixture();g.startNew('standard','17117');intro.next();
 const worldSeed=g.world.seed;g.returnToMenu();assert.equal(g.state,'menu');assert.equal(intro.isOpen(),false);
 assert.equal(g.activeOverlay,g.ui.mainMenu);assert.equal(g.ui.mainMenu.inert,false);
 doc.getElementById('continueButton').click();assert.equal(g.state,'playing');assert.equal(g.world.seed,worldSeed);
 assert.equal(intro.isOpen(),false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
 assert.equal(g.chronicles131.snapshot().prologue.status,'active');
});

test('QA132 : import refusé reste atomique ; reprise valide ferme une introduction interrompue',()=>{
 const{g,intro,storage}=fixture();g.startNew('standard','17117');intro.next();
 const current=clone(g.serialize()),world=g.world,saved=storage.get(C.SAVE_KEY),view=intro.view();
 const invalid=clone(current);invalid.expansions127.modules.player131.vest=-1;
 assert.throws(()=>g.restoreSave(invalid));assert.equal(g.world,world);assert.deepEqual(intro.view(),view);
 assert.equal(storage.get(C.SAVE_KEY),saved);assert.equal(g.activeOverlay,intro.element);
 assert.equal(g.restoreSave(current),true);assert.equal(intro.isOpen(),false);assert.equal(g.paused,false);
 assert.equal(g.activeOverlay,null);assert.equal(g.ui.hud.inert,false);assert.equal(g.save(false),true);
});

test('QA132 : panne du stockage pendant l’introduction conserve un état exportable et reprenable',()=>{
 const{g,intro}=fixture();const set=localStorage.setItem,error=console.error;
 try{localStorage.setItem=()=>{throw Error('QuotaExceededError');};console.error=()=>{};
  g.startNew('standard','17117');assert.equal(intro.isOpen(),true);assert.equal(g.lastSaveStatus.ok,false);
  const data=globalThis.DeadwallSave.validate(g.serialize());
  assert.equal(data.expansions127.modules.lore131.prologue.status,'active');
  intro.skip();assert.equal(g.paused,false);assert.equal(g.restoreSave(data),true);assert.equal(intro.isOpen(),false);
 }finally{localStorage.setItem=set;console.error=error;}
 assert.equal(g.save(false),true);
});
