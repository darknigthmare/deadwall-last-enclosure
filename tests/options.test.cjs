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

test('import UI : les quatre départs validés sont identifiés avant confirmation sans changer la cité courante',async()=>{
  const S=require('../src/scenarios.js');
  for(const scenario of S.list()){
    const{game,elements,storage}=bootOptions();game.startNew('brutal','17117',scenario.id);
    const imported=JSON.parse(JSON.stringify(game.serialize()));imported.resources.wood-=7;
    game.startNew('standard','42','classic');game.showSettings(true);
    const world=game.world,raw=storage.get(C.SAVE_KEY),handler=elements.get('settingsImportFile')._listeners.get('change')[0];
    await handler({target:{files:[{size:10,text:async()=>JSON.stringify(imported)}]}});
    const summary=elements.get('settingsImportSummary').textContent;
    assert.ok(summary.includes('Départ : '+scenario.name));assert.match(summary,/Brutal/);assert.match(summary,/Carte 17117/);
    assert.equal(game.world,world);assert.equal(game.scenarioId,'classic');assert.equal(game.world.seed,42);assert.equal(storage.get(C.SAVE_KEY),raw);
    elements.get('settingsImportConfirm').click();
    assert.equal(game.scenarioId,scenario.id);assert.equal(game.difficulty.id,'brutal');assert.equal(game.world.seed,17117);
    assert.equal(game.resources.wood,imported.resources.wood,'la confirmation restaure les stocks sans réappliquer le départ');
    assert.equal(JSON.parse(storage.get(C.SAVE_KEY)).scenarioId,scenario.id);
  }
});

test('import UI : une ancienne sauvegarde affiche Classique et un départ inconnu reste refusé avant confirmation',async()=>{
  const{game,elements,storage}=bootOptions();game.startNew('standard','17117','convoy');game.showSettings(true);
  const data=JSON.parse(JSON.stringify(game.serialize()));delete data.scenarioId;
  const handler=elements.get('settingsImportFile')._listeners.get('change')[0],world=game.world,raw=storage.get(C.SAVE_KEY);
  await handler({target:{files:[{size:10,text:async()=>JSON.stringify(data)}]}});
  assert.match(elements.get('settingsImportSummary').textContent,/Départ : Départ classique/);
  elements.get('settingsImportCancel').click();assert.equal(game.scenarioId,'convoy');
  data.scenarioId='<img src=x onerror=alert(1)>';
  await handler({target:{files:[{size:10,text:async()=>JSON.stringify(data)}]}});
  assert.match(elements.get('settingsStatus').textContent,/Import refusé/);assert.equal(elements.get('settingsImportReview').classList.contains('hidden'),true);
  assert.equal(elements.get('settingsImportSummary').textContent.includes(data.scenarioId),false);
  elements.get('settingsImportConfirm').dispatch('click');
  assert.equal(game.world,world);assert.equal(game.scenarioId,'convoy');assert.equal(storage.get(C.SAVE_KEY),raw);
});

test('import UI : une lecture précédente ne remplace pas le scénario du dernier fichier sélectionné',async()=>{
  const{game,elements}=bootOptions();game.startNew('standard','17117','classic');game.showSettings(true);
  const first=JSON.parse(JSON.stringify(game.serialize())),last=JSON.parse(JSON.stringify(first));first.scenarioId='reconstruction';last.scenarioId='rearguard';
  const handler=elements.get('settingsImportFile')._listeners.get('change')[0];let resolveFirst;
  const reading=handler({target:{files:[{size:10,text:()=>new Promise(resolve=>{resolveFirst=resolve;})}]}});
  await handler({target:{files:[{size:10,text:async()=>JSON.stringify(last)}]}});
  resolveFirst(JSON.stringify(first));await reading;
  assert.match(elements.get('settingsImportSummary').textContent,/Départ : Arrière-garde/);
  elements.get('settingsImportConfirm').click();assert.equal(game.scenarioId,'rearguard');
});
