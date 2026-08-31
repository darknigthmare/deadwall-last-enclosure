'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js');
const Save=require('../src/save.js');
const silent=(method,fn)=>{const old=console[method];console[method]=()=>{};try{return fn();}finally{console[method]=old;}};

test('récupération : le backup est essayé après une corruption structurelle sans altérer une partie saine',()=>{
  const {game,storage}=bootGame();game.startNew();const good=storage.get(C.SAVE_KEY),data=JSON.parse(good);
  storage.set(C.SAVE_BACKUP_KEY,good);storage.set(C.SAVE_KEY,JSON.stringify({...data,buildings:[]}));
  assert.equal(silent('warn',()=>game.load()),true);assert.ok(game.core());assert.equal(game.wave,data.wave);
  const world=game.world,player=game.player;storage.set(C.SAVE_BACKUP_KEY,'{}');
  assert.equal(silent('warn',()=>game.load()),false);assert.equal(game.world,world);assert.equal(game.player,player);
  assert.throws(()=>game.restoreSave({...data,player:{...data.player,x:null}}),/position X/);assert.equal(game.world,world);
});

test('récupération : une écriture refusée ne détruit pas le backup valide',()=>{
  const {game,storage}=bootGame();game.startNew();const good=storage.get(C.SAVE_KEY);storage.set(C.SAVE_BACKUP_KEY,good);storage.set(C.SAVE_KEY,'{corrompu');
  const original=localStorage.setItem;localStorage.setItem=(key,value)=>{if(key===C.SAVE_KEY)throw Error('QuotaExceededError');original(key,value);};
  try{assert.equal(silent('error',()=>game.save(false)),false);}finally{localStorage.setItem=original;}
  assert.equal(storage.get(C.SAVE_BACKUP_KEY),good);assert.equal(storage.get(C.SAVE_KEY),'{corrompu');assert.equal(game.lastSaveStatus.ok,false);
});

test('sauvegarde : réanimation, portage, endurance et rechargement survivent au chargement',()=>{
  const {game}=bootGame();game.startNew();game.player.carry.wood=20;game.player.stamina=24;game.damagePlayer(1000);game.player.downTimer=3.5;assert.equal(game.save(false),true);assert.equal(game.load(),true);
  assert.equal(game.player.dead,true);assert.equal(game.player.health,0);assert.equal(game.player.downTimer,3.5);assert.equal(game.player.stamina,24);
  game.updatePlayer(3.5);assert.equal(game.player.dead,false);assert.equal(game.player.carry.wood,10,'la pénalité médicale reste appliquée');
  game.player.magazine.pistol=3;game.startReload();game.player.reload=.5;game.save(false);game.load();assert.equal(game.player.reload,.5);assert.equal(game.player.magazine.pistol,3);
});

test('import : types inconnus, coordonnées invalides, IDs dupliqués et fichiers trop grands sont refusés',()=>{
  const {game}=bootGame();game.startNew();const data=game.serialize();
  assert.throws(()=>Save.validate({...data,buildings:[{...data.buildings[0],type:'unknown'}]}));
  assert.throws(()=>Save.validate({...data,units:[{...data.units[0],id:data.buildings[0].id}]}));
  assert.throws(()=>Save.validate({...data,resources:{...data.resources,wood:-1}}));
  assert.throws(()=>Save.validate({...data,zombies:[{id:2000,kind:'constructor',x:30,y:30,health:1}]}));
  assert.throws(()=>Save.validate({...data,buildings:[{...data.buildings[0],id:0xffffffff}]}));
  assert.throws(()=>Save.parse(' '.repeat(Save.MAX_FILE_BYTES+1)));
  assert.equal(Save.validate({...data,phaseTime:0}).phaseTime,0,'un chronomètre zéro ne gagne pas 20 secondes');
});

test('audio : reprise suspendue, mute sans allocations et panne sans blocage de la partie',()=>{
  const {game}=bootGame(),Audio=game.audio.constructor;let resumes=0,buffers=0;
  const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context{constructor(){this.state='suspended';this.sampleRate=8000;this.currentTime=0;this.destination={};}createGain(){return{gain:param(),connect(){},disconnect(){}};}resume(){resumes++;this.state='running';return Promise.resolve();}createBuffer(c,n){buffers++;return{getChannelData:()=>new Float32Array(n)};}createBufferSource(){return{connect(){},disconnect(){},start(){}};}createBiquadFilter(){return{frequency:param(),connect(){},disconnect(){}};}}
  const original=globalThis.AudioContext;globalThis.AudioContext=Context;
  try{const audio=new Audio();assert.equal(audio.unlock(),true);assert.equal(resumes,1);audio.setMuted(true);audio.noise();assert.equal(buffers,0);audio.setMuted(false);audio.noise();audio.noise();assert.equal(buffers,1,'les tirs réutilisent leurs échantillons procéduraux');
    globalThis.AudioContext=class{constructor(){throw Error('périphérique indisponible');}};game.audio=new Audio();assert.doesNotThrow(()=>game.startNew());assert.equal(game.state,'playing');
  }finally{if(original===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=original;}
});

test('tactile : glisser une ligne de murs produit plusieurs cellules et annuler ne construit rien',()=>{
  const {game}=bootGame();game.startNew();game.selectBuild('woodWall');let placed=[];game.placeWallLine=(id,cells)=>{placed.push({id,cells:cells.slice()});};
  const point=(x,y)=>({pointerType:'touch',pointerId:8,clientX:x,clientY:y});
  game.canvas.dispatch('pointerdown',point(300,300));game.canvas.dispatch('pointermove',point(500,340));game.canvas.dispatch('pointerup',point(500,340));
  assert.equal(placed.length,1);assert.ok(placed[0].cells.length>3);assert.equal(game.wallStart,null);
  game.canvas.dispatch('pointerdown',point(300,300));game.canvas.dispatch('pointercancel',point(400,300));game.canvas.dispatch('pointerup',point(500,340));assert.equal(placed.length,1);
  game.settings.quality='low';globalThis.devicePixelRatio=3;game.resize();assert.equal(game.dpr,1);
});

test('stockage désactivé : le jeu démarre quand même et ne promet pas une sauvegarde réussie',()=>{
  const{installFakeBrowser}=require('./helpers/browser.cjs');installFakeBrowser();globalThis.DeadwallCore=C;globalThis.DeadwallSave=Save;
  const denied=()=>{throw Error('SecurityError');};globalThis.localStorage={getItem:denied,setItem:denied,removeItem:denied};
  delete globalThis.DEADWALL;delete require.cache[require.resolve('../src/game.js')];require('../src/game.js');
  assert.ok(globalThis.DEADWALL);silent('error',()=>globalThis.DEADWALL.startNew());assert.equal(globalThis.DEADWALL.state,'playing');assert.equal(globalThis.DEADWALL.lastSaveStatus.ok,false);
  assert.doesNotThrow(()=>globalThis.DEADWALL.triggerGameOver());assert.equal(globalThis.DEADWALL.ui.gameOver.classList.contains('hidden'),false);
});

test('retour au menu : échec stockage conserve la partie exportable ; récupération et fin de partie restent possibles',async()=>{
  const {game,storage,elements}=bootGame();game.startNew();const world=game.world,write=localStorage.setItem;
  game.resources.wood=17;localStorage.setItem=()=>{throw Error('quota');};
  assert.equal(silent('error',()=>game.returnToMenu()),false);
  assert.equal(game.state,'playing');assert.equal(game.paused,true);assert.equal(game.world,world);
  assert.equal(game.ui.pauseMenu.classList.contains('hidden'),false);assert.equal(game.lastSaveStatus.ok,false);
  assert.equal(JSON.parse(storage.get(C.SAVE_KEY)).resources.wood,180,'le disque garde son ancienne copie valide');

  delete require.cache[require.resolve('../src/ui.js')];require('../src/ui.js');silent('error',()=>game.showSettings(true));
  let exported;const create=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return create(blob);};
  try{elements.get('settingsExport').click();}finally{URL.createObjectURL=create;}
  assert.ok(exported,'la cité en mémoire reste exportable sans stockage');
  assert.equal(JSON.parse(await exported.text()).resources.wood,17,'l’export contient les dernières actions et non la copie ancienne');
  game.showSettings(false);localStorage.setItem=write;game.returnToMenu();
  assert.equal(game.state,'menu');assert.equal(JSON.parse(storage.get(C.SAVE_KEY)).resources.wood,17);

  game.startNew();localStorage.setItem=()=>{throw Error('quota');};game.gameOver=true;
  assert.doesNotThrow(()=>game.returnToMenu());assert.equal(game.state,'menu','une partie perdue ne bloque pas le retour au menu');
});
