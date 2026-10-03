'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
function setup(){
 const env=boot127(),g=env.game;g.startNew('standard','17117');
 const original=document.getElementById.bind(document);
 document.getElementById=id=>document.body.querySelectorAll('#'+id)[0]||original(id);
 const recon=original('reconPanel'),host=original('frontierDossier');
 document.body.appendChild(recon);recon.appendChild(host);recon.classList.add('hidden');
 g.frontierUI={open(){recon.classList.remove('hidden');},refresh(){}};
 const proto=Object.getPrototypeOf(host);proto.scrollIntoView=function(){};
 let summaries=0,worlds=0;const overview=g.essentials.overview,world=g.frontier.world;
 g.essentials={...g.essentials,overview(){summaries++;return overview();}};
 g.frontier={...g.frontier,world(){worlds++;return world();}};
 document.readyState='complete';const file=require.resolve('../src/essential-ui.js');delete require.cache[file];require(file);
 return{...env,g,get:id=>document.getElementById(id),counts:()=>({summaries,worlds})};
}
test('HUD matériel : le tiroir fermé et son résumé n’énumèrent ni objectifs ni région',()=>{
 const{g,get,counts}=setup();
 for(let i=0;i<100;i++)g.essentialUI.refresh(true);
 assert.deepEqual(counts(),{summaries:0,worlds:0});
 get('essentialQuick').open=true;g.essentialUI.refresh(true);
 assert.deepEqual(counts(),{summaries:0,worlds:0});
 assert.match(get('essentialQuick').children[0].textContent,/MATÉRIEL · 0\/8/);
});
test('HUD matériel : une vraie préparation reste visible sans générer les lieux',()=>{
 const{g,get,counts}=setup();
 // Prepared save fixture: recipe obtained from a genuinely identified location.
 const target=g.essentials.targets().find(j=>j.family==='light'),raw=g.serialize();
 raw.frontier.seen=[target.poi];raw.essentials.jobs[target.id]={stage:'delivered'};g.restoreSave(raw);
 const before=counts();
 const {standAt}=require('./helpers/physical-fixtures.cjs');standAt(g,g.player,g.core());
 assert.equal(g.essentials.begin('craft','light').ok,true);
 g.update(.04);g.essentialUI.refresh(true);
 assert.equal(get('essentialQuick').open,true);assert.equal(get('essentialProgress').hidden,false);
 assert.ok(get('essentialProgress').value>0);
 assert.deepEqual(counts(),before);
 g.essentials.cancel();g.essentialUI.refresh(true);assert.equal(get('essentialProgress').hidden,true);
});
test('HUD matériel : le dossier visible garde ses données complètes, masqué il cesse de les lire',()=>{
 const{g,get,counts}=setup();g.essentialUI.open();
 assert.equal(get('essentialPanel').open,true);assert.ok(counts().summaries>0);
 const before=counts().summaries;get('reconPanel').classList.add('hidden');
 for(let i=0;i<50;i++)g.essentialUI.refresh(true);
 assert.equal(counts().summaries,before);
 get('reconPanel').classList.remove('hidden');g.essentialUI.refresh(true);assert.equal(counts().summaries,before+1);
});
test('HUD matériel : fermer le poste ou changer de rubrique suspend aussi le dossier resté déplié',()=>{
 const{g,get,counts}=setup(),field=document.createElement('section');field.id='command-field';
 // The shipped hierarchy hides the command modal or its tab, not every descendant.
 field.appendChild(get('reconPanel'));g.ui.commandModal.appendChild(field);
 g.ui.commandModal.classList.remove('hidden');g.essentialUI.open();const before=counts().summaries;
 g.ui.commandModal.classList.add('hidden');
 for(let i=0;i<50;i++)g.essentialUI.refresh(true);
 assert.equal(counts().summaries,before);assert.equal(get('essentialPanel').open,true);
 g.ui.commandModal.classList.remove('hidden');field.classList.add('hidden');
 for(let i=0;i<50;i++)g.essentialUI.refresh(true);
 assert.equal(counts().summaries,before);
 field.classList.remove('hidden');g.essentialUI.refresh(true);assert.equal(counts().summaries,before+1);
});
