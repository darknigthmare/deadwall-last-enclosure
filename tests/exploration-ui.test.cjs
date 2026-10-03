'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const E=require('../src/exploration-125.js');

function setup(){
  const env=bootGame(),proto=Object.getPrototypeOf(document.createElement('div'));
  proto.append=function(...nodes){for(const node of nodes)this.appendChild(node);};
  proto.insertBefore=function(node,sibling){const index=this.children.indexOf(sibling);if(index<0)return this.appendChild(node);node.parentNode=this;this.children.splice(index,0,node);return node;};
  E.install(env.game,document);env.game.startNew('standard','17117');
  return {...env,map:document.body.children.find(n=>n.id==='deadwall125-map'),bag:document.body.children.find(n=>n.id==='deadwall125-inventory')};
}
function descendants(node){return [node,...node.children.flatMap(descendants)];}

test('UI : carte et sac deviennent la seule modale active, Tab y reste et Échap ne reprend pas le jeu',()=>{
  const {game:g,map,bag,dispatchDocument,dispatchWindow}=setup();
  g.togglePause(true);const pauseOrigin=document.activeElement;
  g.exploration125.openMap();
  assert.equal(g.activeOverlay,map);assert.equal(g.ui.hud.inert,true);assert.equal(g.ui.pauseMenu.inert,true);
  const tab=dispatchWindow('keydown',{code:'Tab',target:document.activeElement});
  assert.equal(tab.defaultPrevented,true);assert.equal(map.contains(document.activeElement),true);
  g.exploration125.openInventory();
  assert.equal(map.classList.contains('hidden'),true);assert.equal(map.inert,true);assert.equal(g.activeOverlay,bag);
  const escape=dispatchDocument('keydown',{code:'Escape'});
  assert.equal(escape.propagationStopped,true);assert.equal(bag.classList.contains('hidden'),true);
  assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);assert.equal(g.ui.pauseMenu.inert,false);
  assert.equal(document.activeElement,pauseOrigin);
});

test('UI : une resynchronisation du moteur conserve la carte au premier plan',()=>{
  const {game:g,map}=setup();g.exploration125.openMap();g.syncOverlayFocus();
  assert.equal(g.activeOverlay,map);assert.equal(g.paused,true);assert.equal(map.inert,false);
  g.exploration125.closeOverlay();assert.equal(g.activeOverlay,null);assert.equal(g.ui.hud.inert,false);assert.equal(g.paused,false);
});

test('UI : perte de focus avec carnet ouvert exige une reprise explicite',()=>{
  const {game:g}=setup();g.exploration125.openMap();g.suspendForFocusLoss();g.exploration125.closeOverlay();
  assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);assert.equal(g.ui.pauseMenu.classList.contains('hidden'),false);
});

test('UI : recharger une sauvegarde ferme le carnet et ne laisse aucune simulation sous une modale',()=>{
  const {game:g,bag}=setup();const save=g.serialize();g.exploration125.openInventory();g.restoreSave(save);
  assert.equal(bag.classList.contains('hidden'),true);assert.equal(g.exploration125.overlayOpen(),false);
  assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);
});

test('UI : la minimap ouvre la carte régionale et laisse ses boutons enfants agir une seule fois',()=>{
  const {game:g}=setup();g.player.x=38;g.player.y=640;assert.equal(g.frontier.enter(),true);
  let opens=0;g.frontierUI={open(){opens++;}};
  const minimap=document.getElementById('minimapWrap');minimap.dispatch('click');assert.equal(opens,1);
  const child=document.createElement('button');minimap.appendChild(child);minimap.dispatch('click',{target:child});assert.equal(opens,1);
  g.exploration125.openInventory();g.exploration125.openMap();assert.equal(opens,2);assert.equal(g.exploration125.overlayOpen(),false);
});

test('UI : le sac régional indique la posture effective, le sol et les armes encore verrouillées',()=>{
  const {game:g,bag}=setup();g.player.x=38;g.player.y=640;assert.equal(g.frontier.enter(),true);
  g.player.posture='stand';g.worldEvolution.setPosture('prone');g.exploration125.openInventory();
  const equip=descendants(bag).find(n=>n.className==='deadwall125-equip'),ground=g.worldEvolution.overview().surface.name;
  assert.match(equip.innerHTML,/ALLONGÉ/);assert.ok(equip.innerHTML.includes(ground));
  assert.match(equip.innerHTML,/À DÉBLOQUER/);assert.match(equip.innerHTML,/Requiert Camp fortifié/i);assert.doesNotMatch(equip.innerHTML,/PROTECTION/);
});

test('UI : les 40 fonds de case sont explicitement placés dans cinq rangées, même avec des ressources',()=>{
  const {game:g,bag}=setup();g.player.carry.wood=12;g.player.carry.food=7;g.exploration125.openInventory();
  const grid=descendants(bag).find(n=>n.className==='deadwall125-grid'),cells=grid.children.filter(n=>n.tagName==='I');
  assert.equal(cells.length,40);assert.equal(grid.children.some(n=>n.tagName==='DIV'),true);
  assert.equal(new Set(cells.map(n=>n.style.gridColumn+':'+n.style.gridRow)).size,40);
  assert.ok(cells.every(n=>Number(n.style.gridColumn)>=1&&Number(n.style.gridColumn)<=8&&Number(n.style.gridRow)>=1&&Number(n.style.gridRow)<=5));
});

test('UI : les raccourcis ne percent pas les paramètres, les champs éditables ou la défaite',()=>{
  const {game:g,dispatchDocument}=setup();
  const field=document.createElement('div');field.setAttribute('contenteditable','true');
  dispatchDocument('keydown',{code:'KeyI',target:field});assert.equal(g.exploration125.overlayOpen(),false);
  g.ui.settingsModal.classList.remove('hidden');g.syncOverlayFocus();dispatchDocument('keydown',{code:'KeyI'});assert.equal(g.exploration125.overlayOpen(),false);
  g.ui.settingsModal.classList.add('hidden');g.syncOverlayFocus();g.gameOver=true;g.exploration125.openInventory();assert.equal(g.exploration125.overlayOpen(),false);
});

function mountRegionalUI(env){
  const g=env.game,proto=Object.getPrototypeOf(document.createElement('div'));
  proto.before=function(node){if(this.parentNode)this.parentNode.insertBefore(node,this);};
  proto.after=function(node){if(!this.parentNode)return;const at=this.parentNode.children.indexOf(this);node.parentNode=this.parentNode;this.parentNode.children.splice(at+1,0,node);};
  proto.scrollIntoView=function(){};
  const originalGet=document.getElementById.bind(document);
  document.getElementById=id=>document.body.querySelectorAll('#'+id)[0]||originalGet(id);
  document.body.appendChild(document.getElementById('reconPanel'));
  document.createTextNode=text=>{const node=document.createElement('span');node.textContent=String(text);return node;};
  for(const name of ['atlas-render','atlas-view']){
    const file=require.resolve('../src/'+name+'.js');delete require.cache[file];require(file);
  }
  document.readyState='complete';
  const module=require.resolve('../src/frontier-ui.js');delete require.cache[module];require(module);
  return id=>document.getElementById(id);
}

test('UI régionale : le bouton POSTURE suit les mêmes trois positions que C et se verrouille avec une modale',()=>{
  const env=setup(),g=env.game;g.player.x=38;g.player.y=640;assert.equal(g.frontier.enter(),true);const get=mountRegionalUI(env);
  const pose=get('frontierQuiet');assert.equal(pose.disabled,false);
  pose.click();assert.equal(g.worldEvolution.posture().key,'crouch');
  pose.click();assert.equal(g.worldEvolution.posture().key,'prone');assert.match(get('frontierFocus').textContent,/Allongé/);
  pose.click();assert.equal(g.worldEvolution.posture().key,'stand');
  g.exploration125.openInventory();g.frontierUI.refresh(true);assert.equal(pose.disabled,true);assert.equal(get('frontierMapHud').disabled,true);
});

test('UI régionale : M ignore répétition, raccourcis navigateur, carnet superposé et fin de partie',()=>{
  const env=setup(),g=env.game;g.player.x=38;g.player.y=640;assert.equal(g.frontier.enter(),true);mountRegionalUI(env);
  let opens=0;g.recon={...g.recon,open(){opens++;return true;}};
  for(const extra of [{repeat:true},{ctrlKey:true},{altKey:true},{metaKey:true}])env.dispatchWindow('keydown',{code:'KeyM',target:document.body,...extra});
  assert.equal(opens,0);env.dispatchWindow('keydown',{code:'KeyM',target:document.body});assert.equal(opens,1);
  g.exploration125.openInventory();env.dispatchWindow('keydown',{code:'KeyM',target:document.body});assert.equal(opens,1);
  g.exploration125.closeOverlay();g.gameOver=true;env.dispatchWindow('keydown',{code:'KeyM',target:document.body});assert.equal(opens,1);
});

function mountWorldUI(env){
  const get=mountRegionalUI(env),module=require.resolve('../src/world-evolution-ui.js');delete require.cache[module];require(module);get('evolutionPanel').open=true;return get;
}

test('UI équipe : les prérequis sont expliqués, les aides décrites et le focus conservé au rafraîchissement',()=>{
  const env=setup(),g=env.game,get=mountWorldUI(env);get('evoTab-people').onclick();
  g.population=1;g.worldEvolutionUI.refresh();assert.equal(get('comp-lea').disabled,true);
  const allText=n=>[n.textContent,...n.children.map(allText)].join(' ');
  assert.match(allText(get('evolutionPanel')),/Il faut 4 personnes/);assert.match(allText(get('evolutionPanel')),/médicament du sac/);
  g.population=4;g.resources.food=20;g.worldEvolutionUI.refresh();const before=get('comp-lea');assert.equal(before.disabled,false);before.focus();
  g.worldEvolutionUI.refresh();assert.notEqual(get('comp-lea'),before);assert.equal(document.activeElement,get('comp-lea'));
});

test('UI coop : les rafraîchissements et actions conservent adresse, salle, nom et focus',()=>{
  const env=setup(),g=env.game,get=mountWorldUI(env),calls=[];g.coop={connect(...args){calls.push(args);},ping(){},disconnect(){}};get('evoTab-coop').onclick();
  const server=get('coopServer'),room=get('coopRoom'),name=get('coopName');server.value='wss://coop.example.test';room.value='D17';name.value='Éclaireuse';name.focus();
  for(let i=0;i<4;i++)g.worldEvolutionUI.refresh();assert.equal(get('coopServer'),server);assert.equal(server.value,'wss://coop.example.test');assert.equal(document.activeElement,name);
  get('coopConnect').onclick();assert.deepEqual(calls,[['wss://coop.example.test','D17','Éclaireuse']]);assert.equal(get('coopName').value,'Éclaireuse');
});

test('UI terrain : C et X ne modifient pas la posture depuis un champ éditable ou le tiroir éclairage',()=>{
  const {game:g,dispatchDocument}=setup(),field=document.createElement('div');field.setAttribute('contenteditable','true');
  dispatchDocument('keydown',{code:'KeyC',target:field});assert.equal(g.player.posture,'stand');
  const panel=document.createElement('details');panel.id='nightGearQuick';const button=document.createElement('button');panel.appendChild(button);
  dispatchDocument('keydown',{code:'KeyX',target:button});assert.equal(g.player.posture,'stand');
});

test('UI codex : recherche M/I/C/X sans commande de jeu et retour depuis équipement vers le guide',()=>{
  const {game:g,dispatchDocument}=setup(),codex=require('../src/world-codex.js');
  const panel=document.getElementById('commandPanel-field'),nav=document.createElement('nav');nav.classList.add('field-nav');panel.appendChild(nav);g.ui.commandModal.appendChild(panel);
  assert.equal(codex.install(g,document),true);g.ui.commandModal.classList.remove('hidden');g.paused=true;g.syncOverlayFocus();
  const tab=nav.children.find(n=>n.dataset.fieldView==='world-codex');tab.dispatch('click');
  const section=panel.children.find(n=>n.id==='field-world-codex'),search=section.querySelectorAll('input').find(n=>n.id==='worldCodexSearch');search.focus();
  search.value='mine';for(const code of ['KeyM','KeyI','KeyC','KeyX'])dispatchDocument('keydown',{code,target:search});
  assert.equal(g.exploration125.overlayOpen(),false);assert.equal(g.player.posture,'stand');assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(document.activeElement,search);
  const equipment=section.querySelectorAll('button').find(n=>n.textContent==='ÉQUIPEMENT');equipment.focus();equipment.dispatch('click');assert.equal(g.exploration125.overlayOpen(),true);
  g.exploration125.closeOverlay();assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(document.activeElement,equipment);assert.equal(g.paused,true);
});

test('UI éclairage : tiroir non modal, assemblage actif et Échap ferme sans ouvrir la pause',()=>{
  const {game:g}=setup(),night=require('../src/night-gear.js'),{standAt}=require('./helpers/physical-fixtures.cjs');night.install(g);standAt(g,g.player,g.core());
  const panel=document.body.children.find(n=>n.id==='nightGearQuick');g.input.keys.add('KeyD');panel.open=true;panel.dispatch('toggle');
  assert.equal(g.input.keys.size,0);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.ok(g.nightGear.craft('torch').ok);
  g.update(.04);assert.ok(g.nightGear.overview().task.progress>0);
  let stopped=false;panel.dispatch('keydown',{code:'Escape',stopPropagation(){stopped=true;}});
  assert.equal(stopped,true);assert.equal(panel.open,false);assert.equal(g.paused,false);assert.equal(document.activeElement,g.canvas);
});

test('UI éclairage : le bouton matériel garde le focus pendant le décompte, le tiroir est inerte sous la carte',()=>{
  const {game:g}=setup(),night=require('../src/night-gear.js'),{standAt}=require('./helpers/physical-fixtures.cjs'),C=require('../src/core.js');night.install(g);standAt(g,g.player,g.core());
  assert.ok(g.nightGear.craft('lantern').ok);for(let i=0;i<Math.ceil(C.NightGearRules.craftSeconds/.04);i++)g.update(.04);
  const device=g.nightGear.snapshot().devices[0];assert.ok(device);assert.ok(g.nightGear.transfer(device.id,'equip').ok);assert.ok(g.nightGear.ignite(device.id).ok);
  const panel=document.body.children.find(n=>n.id==='nightGearQuick');panel.open=true;panel.dispatch('toggle');
  const toggle=panel.querySelectorAll('button').find(n=>n.id==='night-device-'+device.id+'-toggle');toggle.focus();g.nightGear.step(.1);panel.dispatch('toggle');
  const next=panel.querySelectorAll('button').find(n=>n.id===toggle.id);assert.notEqual(next,toggle);assert.equal(document.activeElement,next);
  g.exploration125.openMap();panel.dispatch('toggle');assert.equal(panel.inert,true);
});
