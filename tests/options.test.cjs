'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js');
function bootOptions(){const env=bootGame();delete require.cache[require.resolve('../src/ui.js')];require('../src/ui.js');return env;}

test('paramètres : toutes les commandes du module existent dans le HTML public',()=>{
  const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=fs.readFileSync(path.join(root,'src/ui.js'),'utf8');
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]));for(const match of source.matchAll(/\bget\('([^']+)'\)/g))assert.ok(ids.has(match[1]),`contrôle absent : ${match[1]}`);
});

test('paramètres : ouverture clavier depuis menu/jeu, volume et confort persistants',()=>{
  const{game,elements}=bootOptions();elements.get('menuSettingsButton').click();assert.equal(game.activeOverlay,game.ui.settingsModal);
  elements.get('settingsVolume').value='25';elements.get('settingsVolume').dispatch('input');assert.equal(game.settings.volume,.25);assert.equal(game.audio.volume,.25);
  elements.get('settingsMotion').checked=true;elements.get('settingsMotion').dispatch('change');assert.equal(game.settings.reducedMotion,true);assert.equal(document.body.classList.contains('reduced-motion'),true);
  assert.equal(JSON.parse(localStorage.getItem(C.SETTINGS_KEY)).volume,.25);
  elements.get('settingsClose').click();assert.equal(game.activeOverlay,game.ui.mainMenu);
  game.startNew();game.showSettings(true);assert.equal(game.paused,true);game.onEscape();assert.equal(game.paused,false);assert.equal(game.activeOverlay,null);
});

test('import UI : prévisualisation sans mutation, annulation et confirmation explicite',async()=>{
  const{game,elements,storage}=bootOptions();game.startNew();game.showSettings(true);const world=game.world,save=storage.get(C.SAVE_KEY),data=game.serialize();data.wave=8;
  const input=elements.get('settingsImportFile'),handler=input._listeners.get('change')[0];
  await handler({target:{files:[{size:10,text:async()=>JSON.stringify(data)}],value:'file'}});
  assert.equal(game.world,world);assert.equal(storage.get(C.SAVE_KEY),save);assert.equal(elements.get('settingsImportReview').classList.contains('hidden'),false);
  elements.get('settingsImportCancel').click();assert.equal(game.wave,1);assert.equal(elements.get('settingsImportReview').classList.contains('hidden'),true);
  await handler({target:{files:[{size:10,text:async()=>'{corrompu'}],value:'file'}});assert.equal(game.world,world);assert.equal(storage.get(C.SAVE_KEY),save);assert.match(elements.get('settingsStatus').textContent,/Import refusé/);
  await handler({target:{files:[{size:10,text:async()=>JSON.stringify(data)}],value:'file'}});elements.get('settingsImportConfirm').click();assert.equal(game.wave,8);assert.equal(JSON.parse(storage.get(C.SAVE_KEY)).wave,8);assert.equal(game.paused,false);
});
