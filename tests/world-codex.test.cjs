'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/world-codex.js'),{bootGame}=require('./helpers/browser.cjs');
test('codex modulaire : couverture structurée, identités uniques et au moins trois fois les douze fiches historiques',()=>{
 assert.ok(C.entries.length>=36);assert.equal(new Set(C.entries.map(e=>e.id)).size,C.entries.length);
 for(const e of C.entries){assert.ok(Object.hasOwn(C.families,e.family));assert.ok(Object.hasOwn(C.statuses,e.status));for(const key of ['id','title','summary',...Object.keys(C.fields)])assert.ok(typeof e[key]==='string'&&e[key].length>(['id','title'].includes(key)?0:8),e.id+' '+key);assert.ok(Object.isFrozen(e));}
 for(const id of ['bois-lisiere','foret-profonde','montagne','port','plage','ville','village','metropole','camp-fortune','camp-allie','camp-hostile','quartier-pavillonnaire','industrie','zone-commerciale','zone-loisirs','mine','carriere'])assert.ok(C.entries.some(e=>e.id===id),id);
});
test('recherche sans accents, multiterme et intersection des filtres',()=>{
 assert.equal(C.query({text:'FORET immense'}).some(e=>e.id==='foret-profonde'),true);
 assert.equal(C.query({text:'chemlightmotinexistant'}).length,0);
 assert.ok(C.query({family:'camps'}).every(e=>e.family==='camps'));
 assert.ok(C.query({status:'terrain'}).every(e=>e.status!=='plan'));
 assert.equal(C.query({family:'nature',status:'plan',text:'montagne'}).some(e=>e.id==='montagne'),true);
 assert.equal(C.query({family:'systemes',status:'jouable',text:'montagne'}).some(e=>e.id==='montagne'),false);
});
test('plans futurs et projets de factions ne sont pas présentés comme lieux jouables',()=>{
 for(const id of ['montagne','port','plage','camp-allie','camp-hostile','neige','foret-profonde'])assert.equal(C.entries.find(e=>e.id===id).status,'plan');
 assert.match(C.entries.find(e=>e.id==='metropole').source,/conception/);
});
test('onglet guide : filtre utilisable, navigation réversible et aucune mutation de campagne',()=>{
 const{game:g,elements}=bootGame();g.startNew('standard','17117');
 const panel=document.getElementById('commandPanel-field'),nav=document.createElement('nav');nav.classList.add('field-nav');panel.appendChild(nav);
 const old=document.createElement('button'),oldSection=document.createElement('section');nav.appendChild(old);panel.appendChild(oldSection);
 document.getElementById('commandModal').appendChild(panel);document.getElementById('commandModal').classList.remove('hidden');
 const snapshot=()=>{const d=g.serialize();delete d.timestamp;return JSON.stringify(d);};const before=snapshot();assert.equal(C.install(g,document),true);assert.equal(C.install(g,document),false);
 const section=panel.children.find(e=>e.id==='field-world-codex'),tab=nav.children.find(e=>e.dataset.fieldView==='world-codex');
 assert.ok(section.classList.contains('hidden'));tab.dispatch('click');assert.equal(section.classList.contains('hidden'),false);assert.equal(oldSection.classList.contains('hidden'),true);
 const controls=section.querySelectorAll('input,select'),search=controls.find(e=>e.id==='worldCodexSearch'),status=controls.find(e=>e.id==='worldCodexStatus');
 status.value='all';status.dispatch('change');search.value='FORET immense';search.dispatch('input');
 assert.equal(section.querySelectorAll('article').some(e=>e.dataset.codexId==='foret-profonde'),true);
 search.value='termeinexistant';search.dispatch('input');assert.equal(section.querySelectorAll('article').length,0);
 old.dispatch('click');assert.equal(section.classList.contains('hidden'),true);
 assert.equal(snapshot(),before,'la lecture ne crée ni butin ni découverte ni état sauvegardé');
});
