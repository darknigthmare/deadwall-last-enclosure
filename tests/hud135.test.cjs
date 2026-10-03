'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const HUD=require('../src/hud135.js');
function fixture(){const env=bootDocument134(),{g,doc}=env;HUD.install(g,doc);g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();return env;}
test('HUD 1.35 : les vrais contrôles gardent identité, événements, un seul propriétaire et catalogue fonctionnel',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions();
 const ids=['toggleBuild','pauseButton','hudSettings14','fieldOperations','essentialQuick','nightGearQuick','interventions134Button','activeReloadButton14','frontierCargo','frontierFuel','minimap'];
 const before=ids.map(id=>doc.getElementById(id));assert.equal(HUD.install(g,doc),g.hud135);
 for(let i=0;i<ids.length;i++){assert.equal(doc.getElementById(ids[i]),before[i]);assert.equal(doc.body.querySelectorAll('#'+ids[i]).length,1,ids[i]);assert.ok(r.hud.contains(before[i]),ids[i]+' doit suivre le HUD');}
 assert.equal(doc.getElementById('interventions134Dock').parentNode,r.context);assert.equal(doc.getElementById('expansionWork').parentNode,r.context);assert.equal(g.chronicles131UI.element.parentNode,r.alerts);
 doc.getElementById('toggleBuild').click();assert.equal(g.buildCollapsed,false);assert.equal(r.hud.dataset.build,'true');doc.getElementById('toggleBuild').click();assert.equal(g.buildCollapsed,true);
 assert.equal(doc.getElementById('toggleBuild')._listeners.get('click').length,1);
 const objective=doc.getElementById('hud135Objective');
 assert.equal(objective.parentNode,r.right,'L’objectif actif reste visible sans ouvrir Situation');
 assert.equal(g.ui.objectiveTitle.parentNode,objective,'Le tutoriel garde son unique titre vivant');
 assert.equal(g.ui.objectiveText.parentNode.id,'hud135ObjectiveInstructions');assert.equal(g.ui.objectiveCounter.parentNode,objective);
 assert.equal(r.intel.open,false);assert.match(g.ui.objectiveTitle.textContent,/Premiers gestes/);
 assert.equal(doc.body.querySelectorAll('#objectiveTitle').length,1);
 assert.equal(doc.getElementById('settingsToggle').hidden,true,'La pause ne présente qu’un accès aux paramètres');
});
test('HUD 1.35 : un tiroir périphérique, détails imbriqués exclusifs, défilement et focus conservés',()=>{
 const {g,doc}=fixture(),{intel,map,tools,utilityHost}=g.hud135.regions();
 intel.open=true;intel.dispatch('toggle');assert.deepEqual(g.hud135.snapshot().open,['hud135Intel']);
 map.open=true;map.dispatch('toggle');assert.equal(intel.open,false);assert.equal(map.open,true);
 assert.equal(g.onEscape(),true);assert.equal(map.open,false);assert.equal(g.paused,false);
 const essential=doc.getElementById('essentialQuick'),night=doc.getElementById('nightGearQuick');
 night.open=true;night.dispatch('toggle');assert.equal(tools.open,true);assert.equal(map.open,false);
 essential.open=true;essential.dispatch('toggle');assert.equal(night.open,false);assert.equal(essential.open,true);
 utilityHost.scrollTop=150;const button=doc.getElementById('interventions134Button');button.focus();for(let i=0;i<60;i++)g.hud135.refresh();
 assert.equal(utilityHost.scrollTop,150);assert.equal(doc.activeElement,button);assert.deepEqual(g.hud135.snapshot().open,['hud135Tools']);
});
test('HUD 1.35 : les modales, introduction, pause, mort et menu neutralisent les panneaux flottants',()=>{
 const {g,doc}=fixture(),{hud,tools}=g.hud135.regions();tools.open=true;tools.dispatch('toggle');
 doc.getElementById('pauseButton').click();assert.equal(g.paused,true);assert.equal(hud.dataset.blocked,'true');assert.equal(tools.open,false);
 g.togglePause(false);assert.equal(hud.dataset.blocked,'false');
 g.loadoutUI.open();g.hud135.refresh();assert.equal(hud.dataset.blocked,'true');assert.equal(hud.inert,true);g.loadoutUI.close();g.hud135.refresh();assert.equal(hud.dataset.blocked,'false');
 g.campaignIntro132.replay();g.hud135.refresh();assert.equal(hud.dataset.blocked,'true');g.campaignIntro132.skip();
 g.player.dead=true;g.hud135.refresh();assert.equal(hud.dataset.blocked,'true');g.player.dead=false;
 g.returnToMenu();assert.equal(hud.dataset.blocked,'true');assert.equal(hud.classList.contains('hidden'),true);
});
test('HUD 1.35 : la région conserve un seul ruban et les actions historiques de véhicule restent accessibles',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions(),frontier=g.frontier;g.frontier={...frontier,active:()=>true};
 g.expansionUI.refresh(true);g.hud135.refresh();assert.equal(doc.getElementById('fieldUtilityTray').parentNode,r.utilityHost);assert.equal(r.hud.dataset.region,'true');
 for(const id of ['frontierCargo','frontierFuel'])assert.equal(doc.getElementById(id).parentNode.id,'hud135RegionTools');
 g.frontier=frontier;g.expansionUI.refresh(true);g.hud135.refresh();assert.equal(doc.getElementById('fieldUtilityTray').parentNode,r.utilityHost);assert.equal(r.hud.dataset.region,'false');
 const text=require('node:fs').readFileSync(require('node:path').join(__dirname,'../src/world-evolution-ui.js'),'utf8');assert.ok(!text.includes("'sac '+C.bagTotal"),'Une seule quantité de sac dans le HUD');
});
test('HUD 1.35 : intervention réelle non modale et alerte de sélection se rangent sans modifier temps/ressources',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions(),before=g.elapsed,bag={...g.player.carry};
 assert.equal(g.interventionsUI134.open(),true);g.hud135.refresh();assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(r.hud.dataset.blocked,'false');assert.equal(r.hud.dataset.intervention,'true');assert.equal(doc.getElementById('interventions134Dock').parentNode,r.context);
 g.interventionsUI134.close();g.hud135.refresh();assert.equal(r.hud.dataset.intervention,'false');assert.equal(g.elapsed,before);assert.deepEqual(g.player.carry,bag);
 g.selectBuilding(g.core());g.hud135.refresh();assert.equal(r.intel.open,true);assert.equal(r.tools.open,false);
});
test('HUD 1.35 : flèches de menace dans la zone mesurée, cache de rendu et repli borné en paysage étroit',()=>{
 const {g}=fixture(),r=g.hud135.regions();g.width=1280;g.height=720;
 const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
 r.center.getBoundingClientRect=()=>box(280,82,720,520);r.alerts.getBoundingClientRect=()=>box(320,82,600,75);r.context.getBoundingClientRect=()=>box(320,452,600,150);
 r.alerts.children[0].classList.remove('hidden');r.context.children[0].classList.remove('hidden');
 const frame=g.hud135.measure();assert.deepEqual(frame,{left:302,right:978,top:175,bottom:434});
 let reads=0;for(const n of [r.center,r.context,r.alerts,g.ui.leftPanel,g.ui.rightPanel])n.getBoundingClientRect=()=>{reads++;throw Error('Lecture de layout pendant le rendu');};
 g.zombies=[{x:g.camera.x+10000,y:g.camera.y}];for(let i=0;i<30;i++)g.drawThreatArrows(g.ctx);assert.equal(reads,0);assert.equal(g.hud135.safeFrame(),frame);
 g.width=320;g.height=240;r.center.getBoundingClientRect=()=>box(245,90,35,30);r.alerts.getBoundingClientRect=()=>box(245,90,35,20);r.context.getBoundingClientRect=()=>box(245,100,35,20);
 const narrow=g.hud135.measure();assert.ok(narrow.right-narrow.left>=24);assert.ok(narrow.bottom-narrow.top>=24);assert.ok(narrow.left>0&&narrow.top>0&&narrow.right<g.width&&narrow.bottom<g.height);
});

test('HUD : un écran tactile court libère le terrain sans perdre objectif, instructions ni commandes locales',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions(),local=doc.getElementById('hud135LocalActions'),instructions=doc.getElementById('hud135ObjectiveInstructions');
 const stable=()=>{const save=g.serialize();delete save.timestamp;return save;},before=stable();
 g.width=844;g.height=390;g.isCompactViewport=()=>true;g.hud135.refresh();
 assert.equal(r.hud.dataset.short,'true');assert.equal(local.parentNode,r.auxiliary);assert.equal(local.open,false);assert.equal(instructions.open,false);
 assert.equal(doc.getElementById('localManage14').parentNode.parentNode,local,'Le vrai bouton Gérer reste disponible dans le tiroir');
 assert.equal(g.ui.objectiveText.parentNode,instructions);assert.deepEqual(stable(),before);
 local.open=true;local.querySelector('summary').focus();g.input.keys.add('KeyE');local.querySelector('summary').click();local.dispatch('toggle');
 assert.equal(g.input.keys.size,0);assert.equal(g.onEscape(),true);assert.equal(local.open,false);assert.equal(g.paused,false);
 g.height=844;g.hud135.refresh();assert.equal(local.parentNode,r.context);assert.equal(local.open,true);assert.equal(instructions.open,true);
 assert.deepEqual(stable(),before,'Le changement de disposition ne modifie pas la campagne');
});
