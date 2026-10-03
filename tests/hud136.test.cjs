'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fixture(){const env=bootDocument134(),{g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();return env;}
function open(node){node.open=true;node.dispatch('toggle');}
function localGenerator(g){
 const C=globalThis.DeadwallCore,core=g.core();
 for(let r=4;r<22;r+=2)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){
  const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.generator,gx,gy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'generator',gx,gy,0,1);b.health=200;g.world.add(b);g.refreshMetrics(true);
  const point=g.fieldcraft.service(g.player,b);assert.ok(point);Object.assign(g.player,point);g.player.carry.scrap=24;return b;
 }
 throw Error('No free real approach for the prepared generator');
}
// Fake DOM has no native button activation: check that keydown permits it, then model the click.
function enter(dock,button){let prevented=false;dock.dispatch('keydown',{code:'Enter',target:button,preventDefault(){prevented=true;}});assert.equal(prevented,false,'Enter must retain the focused button’s native action');button.click();}

test('HUD 1.36 : les commandes tactiles partagent une pile, restent exclusives et Échap les ferme',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions();
 assert.equal(r.tools.parentNode,r.auxiliary);assert.equal(r.touchCommands.parentNode,r.auxiliary);
 assert.equal(doc.getElementById('touchControls').parentNode,r.footer);
 open(r.tools);open(r.touchCommands);assert.equal(r.tools.open,false);assert.equal(r.map.open,false);
 g.input.keys.add('KeyW');r.map.querySelector('summary').click();open(r.map);assert.equal(r.touchCommands.open,false);assert.equal(g.input.keys.size,0);
 open(r.touchCommands);r.touchCommands.querySelector('summary').focus();assert.equal(g.onEscape(),true);
 assert.equal(r.touchCommands.open,false);assert.equal(g.paused,false);assert.equal(doc.activeElement,r.touchCommands.querySelector('summary'));
});

test('HUD 1.36 : la fermeture des modales restitue le tiroir et le vrai bouton focalisé',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions(),button=doc.getElementById('fieldOperations');
 open(r.tools);button.focus();g.arsenalUI134.open();assert.equal(r.tools.open,false);assert.equal(r.hud.dataset.blocked,'true');
 g.arsenalUI134.close();assert.equal(r.tools.open,true);assert.equal(r.hud.dataset.blocked,'false');assert.equal(doc.activeElement,button);
 button.focus();g.loadoutUI.open();assert.equal(r.tools.open,false);g.loadoutUI.close();assert.equal(r.tools.open,true);assert.equal(doc.activeElement,button);
 button.focus();g.togglePause(true);g.togglePause(false);assert.equal(r.tools.open,true);assert.equal(doc.activeElement,button);
 r.tools.open=false;g.canvas.focus();g.togglePause(true);g.togglePause(false);assert.equal(r.tools.open,false);assert.equal(doc.activeElement,g.canvas,'Un ancien bouton du HUD ne reprend pas le focus au terrain');
 g.returnToMenu();g.startNew('standard','42');g.campaignIntro132.skip();assert.equal(r.tools.open,false,'Une nouvelle campagne ne récupère pas les anciens tiroirs');
});

test('HUD 1.36 : Échap annule le placement actif avant la minimap ouverte par défaut',()=>{
 const {g}=fixture(),r=g.hud135.regions();open(r.map);g.selectBuild('woodWall');g.canvas.focus();assert.ok(g.selectedBuild);
 g.onEscape();assert.equal(g.selectedBuild,null);assert.equal(g.paused,false);assert.equal(r.map.open,true);
 assert.equal(g.linecare.equip(),true);g.canvas.focus();g.onEscape();assert.equal(g.linecare.toolActive(),false);assert.equal(r.map.open,true);assert.equal(g.paused,false);
});

test('HUD 1.36 : Entrée conserve Ajuster et Fermer pendant une vraie réparation interactive',()=>{
 const {g,doc}=fixture(),b=localGenerator(g),dock=doc.getElementById('interventions134Dock');
 globalThis.DeadwallAssets136=globalThis.DeadwallAssets136||require('../src/assets136.js');
 assert.equal(g.interventions134.begin('local:'+b.id).ok,true);const s=g.interventions134.view().session;
 const picture=dock.querySelector('.interventions134-illustration');assert.equal(picture.getAttribute('src'),globalThis.DeadwallAssets136.ASSETS.art136Generator.url);
 const assets=globalThis.DeadwallAssets136;globalThis.DeadwallAssets136=null;g.interventionsUI134.refresh(true);assert.equal(picture.classList.contains('hidden'),true);globalThis.DeadwallAssets136=assets;g.interventionsUI134.refresh(true);
 assert.equal(picture.classList.contains('hidden'),false);assert.ok(doc.body.contains(doc.getElementById('interventions134Confirm')));
 const right=doc.getElementById('interventions134Right');right.focus();enter(dock,right);
 assert.equal(g.interventions134.view().session.dial,(s.dial+1)%s.notches);assert.equal(g.interventions134.view().session.step,s.step);
 assert.ok(doc.body.contains(doc.activeElement),'Un bouton remplacé rend le focus au nouveau contrôle connecté');
 const close=doc.getElementById('interventions134Close');close.focus();enter(dock,close);
 assert.equal(g.interventions134.busy(),false);assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(g.paused,false);assert.equal(b.health,200);
});

test('HUD 1.36 : une cible devenue mini-jeu garde le focus dans le document et accepte les flèches',()=>{
 const {g,doc}=fixture(),b=localGenerator(g),dock=doc.getElementById('interventions134Dock');
 const launch=doc.getElementById('interventions134Button');launch.focus();g.interventionsUI134.open();
 const action=doc.getElementById('interventions134Action-work-local:'+b.id);action.focus();action.click();
 assert.ok(doc.body.contains(doc.activeElement));assert.ok(dock.contains(doc.activeElement));assert.notEqual(doc.activeElement,action);
 const s=g.interventions134.view().session;let prevented=false;dock.dispatch('keydown',{code:'ArrowRight',target:doc.activeElement,preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(g.interventions134.view().session.dial,(s.dial+1)%s.notches);
 g.onEscape();assert.equal(g.interventions134.busy(),false);assert.equal(g.interventionsUI134.isOpen(),false);
});

test('HUD 1.36 : Arme suivante parcourt les objets portés, y compris variantes et mêlée',()=>{
 const {g,doc}=fixture(),raw=g.serialize(),state=raw.expansions127.modules.arsenal134;
 for(const id of ['pocket','revolver','hatchet'])state.carried.push({uid:state.next++,id,condition:100,rounds:id==='pocket'?4:id==='revolver'?3:0});
 g.restoreSave(raw);const C=globalThis.DeadwallCore,button=doc.querySelectorAll('[data-game-command]').find(b=>b.dataset.gameCommand==='weapon');
 const before=g.arsenal134.snapshot(),expected=before.carried.filter(i=>C.Arsenal134Rules.catalog[i.id].category!=='deployed'&&C.Arsenal134Rules.catalog[i.id].tier<=g.tier.id),seen=[];
 for(let i=0;i<expected.length;i++){button.click();seen.push(g.arsenal134.snapshot().equipped);}
 assert.deepEqual(new Set(seen),new Set(expected.map(i=>i.uid)));assert.ok(expected.some(i=>i.id==='hatchet'));
 assert.deepEqual(g.arsenal134.snapshot().carried,before.carried,'Changer d’objet ne fabrique ni ne vide les chargeurs');
 const arsenal=g.arsenal134;g.arsenal134=null;let selected=null;const old=g.switchWeapon;g.switchWeapon=id=>{selected=id;};button.click();assert.ok(C.WEAPONS[selected],'Le contrôleur historique reste disponible sans extension');g.switchWeapon=old;g.arsenal134=arsenal;
});
