'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js'),S=require('../src/scenarios.js'),Q=require('../src/coordination.js'),A=require('../src/art.js');
const stable=g=>{const x=g.serialize();delete x.timestamp;return JSON.stringify(x)};
test('coordination: version du jeu distincte du format de sauvegarde conservé',()=>{assert.equal(Q.VERSION,require('../package.json').version);assert.equal(C.SAVE_VERSION,20)});
test('coordination: recherche insensible aux accents, termes multiples et entrée vide',()=>{assert.ok(Q.matches(C.BUILDINGS.ammoFactory,'munitions'));assert.ok(Q.matches(C.BUILDINGS.dayGreenhouse,'SERRE jour'));assert.ok(Q.matches(C.BUILDINGS.receptionHall,'accueil'));assert.ok(!Q.matches(C.BUILDINGS.house,'ferme'));assert.ok(Q.matches(C.BUILDINGS.house,''));assert.equal(Q.searchable('ÉNERGIE'),'energie')});
test('coordination: douze aperçus correspondent au départ réellement exécuté',()=>{const{game:g}=bootGame();for(const s of S.list())for(const d of Object.keys(C.DIFFICULTIES)){g.startNew(d,'17117',s.id);assert.equal(g.phaseTime,S.initialState(s.id,d).calmSeconds);assert.ok(g.lastSaveStatus.ok)}});
test('coordination: aucune récompense, aucun ordre et aucune modification de sauvegarde à la lecture',()=>{const{game:g}=bootGame();g.startNew('standard','17117');const before=stable(g);for(let i=0;i<30;i++){const s=Q.inspect(g);assert.equal(s.cards.length,6);assert.equal(s.wave,1)}assert.equal(stable(g),before)});
test('coordination: signale une pénurie réelle sans la corriger',()=>{const{game:g}=bootGame();g.startNew('standard','17117');g.resources.food=0;g.resources.ammo=0;g.powerGenerated=0;g.powerUsed=4;const s=Q.inspect(g);assert.equal(s.cards.find(c=>c.id==='power').tone,'warn');assert.equal(s.cards.find(c=>c.id==='supply').tone,'warn');assert.equal(g.resources.food,0)});
test('coordination: des rations suffisantes ne masquent pas une réserve commune vide',()=>{
 const{game:g}=bootGame();g.startNew('standard','17117');g.resources.food=g.population*5;g.resources.ammo=0;
 const before=stable(g),card=Q.inspect(g).cards.find(c=>c.id==='supply');
 assert.equal(g.citadel.canFire(1),false);assert.equal(card.tone,'warn');assert.match(card.detail,/Pas assez de munitions communes/);assert.equal(stable(g),before);
});
test('coordination: le seuil protégé et une dépense réelle de fusilier commandent le diagnostic',()=>{
 const{game:g}=bootGame();g.startNew('standard','17117');g.resources.food=g.population*5;assert.equal(g.citadel.configure('reserve',20),true);
 const supply=()=>Q.inspect(g).cards.find(c=>c.id==='supply');
 g.resources.ammo=20.9;assert.equal(g.citadel.canFire(1),false);assert.equal(supply().tone,'warn');assert.equal(g.resources.ammo,20.9);
 g.resources.ammo=21;assert.equal(g.citadel.canFire(1),true);assert.equal(supply().tone,'good');
 const unit=new(g.units[0].constructor)(g.nextId++,'soldier',g.core().x+180,g.core().y);unit.squad=0;unit.offset={x:0,y:0};g.units=[unit];
 g.startAssault();g.spawnZombie('walker');const enemy=g.zombies[0];enemy.x=unit.x+100;enemy.y=unit.y;g.rebuildBuckets();g.retreatSquad(0);
 g.elapsed+=.04;g.updateUnits(.04);
 assert.ok(g.projectiles.length,'le fusilier a réellement tiré');assert.equal(g.resources.ammo,20);assert.equal(g.citadel.canFire(1),false);assert.equal(supply().tone,'warn');
 const before=stable(g);supply();assert.equal(stable(g),before,'l’inspection ne consomme ni ne recharge les munitions');
});
test('coordination: ne présente pas le menu ou la défaite comme une cité active',()=>{const{game:g}=bootGame();assert.equal(Q.inspect(g),null);g.startNew();g.gameOver=true;assert.equal(Q.inspect(g),null);assert.equal(Q.inspect(null),null)});
test('coordination: les peintres procéduraux hérités et urbains sont associés à leur vrai catalogue',()=>{assert.equal(Object.keys(A.PROCEDURAL_BUILDINGS).length,18+Object.keys(C.Urban.BUILDINGS).length+Object.keys(C.PowerGrid.BUILDINGS).length+Object.keys(C.Expeditions.BUILDINGS).length+Object.keys(C.CityContent150.BUILDINGS).length);for(const[id,owner]of Object.entries(A.PROCEDURAL_BUILDINGS)){assert.ok(C[owner].BUILDINGS[id]);assert.equal(A.BUILDINGS[id],undefined)}});
test('coordination: un état incohérent ne prétend pas être une panne du stockage',()=>{
 const{game:g,storage}=bootGame();g.startNew('standard','17117');g.save(false);const before=storage.get(C.SAVE_KEY),backup=storage.get(C.SAVE_BACKUP_KEY),old=g.serialize,log=console.error;
 try{g.serialize=()=>({...old(),player:{...g.player,health:-1}});console.error=()=>{};assert.equal(g.save(false),false);assert.equal(g.lastSaveStatus.code,'invalid-state');assert.match(g.lastSaveStatus.message,/copie valide/);assert.equal(storage.get(C.SAVE_KEY),before);assert.equal(storage.get(C.SAVE_BACKUP_KEY),backup)}finally{g.serialize=old;console.error=log;}
});
test('coordination: le refus réel du stockage reste identifié séparément',()=>{
 const{game:g}=bootGame();g.startNew('standard','17117');const write=localStorage.setItem,log=console.error;
 try{localStorage.setItem=()=>{throw new Error('QuotaExceededError')};console.error=()=>{};assert.equal(g.save(false),false);assert.equal(g.lastSaveStatus.code,'storage-unavailable');assert.match(g.lastSaveStatus.message,/Stockage indisponible/)}finally{localStorage.setItem=write;console.error=log;}
});
