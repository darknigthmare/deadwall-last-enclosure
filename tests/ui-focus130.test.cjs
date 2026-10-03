'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
function fixture(){
 const e=boot127(),g=e.game,doc=globalThis.document;
 Object.defineProperty(Object.getPrototypeOf(doc.body),'className',{set(v){this.classList.values=new Set(String(v).split(/\s+/).filter(Boolean));},get(){return [...this.classList.values].join(' ');}});
 g.startNew('standard','17117');
 const p=require.resolve('../src/command-ui.js');delete require.cache[p];require(p);
 const options=require.resolve('../src/ui.js');delete require.cache[options];require(options);
 require('../src/loadout129.js').install(g);require('../src/loadout-ui129.js').install(g,doc);
 return {...e,g,doc};
}
for(const signal of ['blur','visibilitychange'])for(const modal of ['command','equipment','nested','help','settings']){
 test(`focus130 : ${signal} dans ${modal} exige une reprise volontaire après fermeture`,()=>{
  const {g,doc,dispatchWindow,dispatchDocument}=fixture();
  if(['command','nested'].includes(modal))g.showCommand(true,'workers');
  if(['equipment','nested'].includes(modal))g.loadoutUI.open();
  if(modal==='help')g.showHelp(true);
  if(modal==='settings')g.showSettings(true);
  const visible=g.activeOverlay;
  if(signal==='blur')dispatchWindow('blur');else{doc.hidden=true;dispatchDocument('visibilitychange');}
  assert.equal(g.activeOverlay,visible,'La perte de focus conserve la fenêtre consultée');
  if(['equipment','nested'].includes(modal))g.loadoutUI.close();
  if(['command','nested'].includes(modal))g.showCommand(false);
  if(modal==='help')g.showHelp(false);
  if(modal==='settings')g.showSettings(false);
  assert.equal(g.paused,true,'Ne pas relancer la nuit après un changement de fenêtre');
  assert.equal(g.activeOverlay,g.ui.pauseMenu);
  assert.equal(g.ui.pauseMenu.classList.contains('hidden'),false);
  doc.hidden=false;g.togglePause(false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
 });
}
test('focus130 : navigation normale commandement → équipement → terrain restaure le jeu',()=>{
 const {g}=fixture();g.showCommand(true);g.loadoutUI.open();g.loadoutUI.close();g.showCommand(false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
});
test('focus130 : visibilité retrouvée seule ne force pas une pause',()=>{
 const {g,doc,dispatchDocument}=fixture();g.loadoutUI.open();doc.hidden=false;dispatchDocument('visibilitychange');g.loadoutUI.close();assert.equal(g.paused,false);
});
