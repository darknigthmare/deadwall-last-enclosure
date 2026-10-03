'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/battlefield.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fixture(){const env=bootDocument134(),{g}=env;g.startNew('standard','54831');g.campaignIntro132.skip();g.setBuildCollapsed(true);return env;}
function stable(g){const s=g.serialize();delete s.timestamp;return s;}

test('assaut court : comptes, contacts et reprise exacte restent lisibles sans annoncer une fin d’assaut',()=>{
 const status={present:14,incoming:9,activeFronts:B.DIRECTIONS.map(f=>({...f,contacts:3})),nextFronts:B.DIRECTIONS,echelon:3,pauseSeconds:6},prior=JSON.stringify(status);
 const text=B.assaultCompactText(status);
 assert.match(text,/14 présents · 9 à venir · échelon 3\/3/);assert.match(text,/Contacts : NORD \/ EST \/ SUD \/ OUEST/);assert.match(text,/Reprise des arrivées dans 6 s/);
 assert.equal(B.assaultCountsText(status),'14 présents · 9 à venir.');
 assert.doesNotMatch(text,/accalmie|sécuris|terminé|repoussé/i);assert.equal(JSON.stringify(status),prior);
 const approaching=B.assaultCompactText({...status,present:0,activeFronts:[],pauseSeconds:0});assert.match(approaching,/Arrivées : NORD \/ EST \/ SUD \/ OUEST/);assert.doesNotMatch(approaching,/Contacts/);
 const clear=B.assaultCompactText({...status,present:0,incoming:0,activeFronts:[],nextFronts:[],pauseSeconds:0});
 assert.match(clear,/0 présents · 0 à venir/);assert.doesNotMatch(clear,/Contacts|Reprise/);
});

test('assaut court intégré : même état, briefing complet en pause, redimensionnement et sortie sans détail périmé',()=>{
 const {g,doc}=fixture();g.width=844;g.height=390;g.isCompactViewport=()=>true;
 g.wave=4;g.phase='assault';g.prepareWave();g.startAssault();
 const first=Math.ceil(g.dayworks.snapshot().night.total/3);let guard=0;
 while(g.dayworks.snapshot().night.emitted<first){g.spawnTimer=0;g.updateDirector(.04);assert.ok(++guard<1000);}
 g.battlefieldUI.refresh(true);const before=stable(g);g.updateUI();
 const intel=g.ui.waveIntel,full=intel.dataset.detail;assert.match(full,/encore à venir/);assert.match(full,/Arrivées annoncées/);assert.match(full,/assaut toujours actif/);
 assert.match(intel.textContent,/à venir · échelon/);assert.match(intel.textContent,/Reprise des arrivées dans \d+ s/);assert.notEqual(intel.textContent,full);assert.deepEqual(stable(g),before);
 const r=g.hud135.regions();r.right.scrollTop=300;r.right.dispatch('scroll');assert.equal(doc.getElementById('hud135Wave').dataset.reading,'true');assert.equal(intel.textContent,intel.dataset.counts);assert.equal(intel.dataset.detail,full);
 r.right.scrollTop=0;r.right.dispatch('scroll');assert.equal(doc.getElementById('hud135Wave').dataset.reading,'false');assert.equal(intel.textContent,intel.dataset.compact);assert.equal(doc.getElementById('innerRingAlert').getAttribute('aria-label'),null);
 doc.getElementById('hud143Prepare').click();assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(g.ui.hud.inert,true);
 assert.ok(doc.getElementById('coordinationBriefing143').textContent.startsWith(full));assert.deepEqual(stable(g),before);
 g.height=844;g.updateUI();assert.equal(intel.textContent,intel.dataset.detail,'Même en pause, le retour portrait retrouve les détails');g.showCommand(false);
 g.phase='aftermath';g.updateUI();assert.equal(intel.dataset.detail,undefined);assert.match(intel.textContent,/Nettoyage/);
 assert.equal(intel.dataset.counts,undefined);assert.equal(intel.dataset.compact,undefined);
 g.phase='calm';g.updateUI();assert.equal(intel.dataset.detail,undefined);assert.equal(intel.hidden,true);
});

test('alerte : mise en vue une fois par phase, puis défilement et modales respectés',()=>{
 const {g}=fixture(),r=g.hud135.regions();r.intel.open=true;r.right.scrollTop=600;g.phase='warning';g.updateUI();assert.equal(r.right.scrollTop,0);
 r.right.scrollTop=500;for(let i=0;i<20;i++)g.updateUI();assert.equal(r.right.scrollTop,500,'Le joueur peut continuer à consulter Personnel');
 g.showCommand(true,'workers');g.phase='assault';g.updateUI();assert.equal(r.right.scrollTop,500,'Le défilement ne bouge pas derrière la modale');
 g.showCommand(false);assert.equal(r.right.scrollTop,0,'L’assaut devient visible à la reprise');
 r.right.scrollTop=400;for(let i=0;i<20;i++)g.hud135.refresh();assert.equal(r.right.scrollTop,400);
 assert.ok(g.save(false));const oldWorld=g.world;g.returnToMenu();assert.ok(g.load());assert.notEqual(g.world,oldWorld);g.updateUI();assert.equal(r.right.scrollTop,0,'Continuer présente l’assaut avant la lecture des dossiers');assert.equal(r.right.querySelector('#hud135Wave').dataset.reading,'false');
});

test('jour : un refus loin du centre montre son vrai message, une confirmation conserve son bouton',()=>{
 const {g,doc}=fixture(),status=doc.getElementById('dayworksStatus'),finish=doc.getElementById('dayworksFinish'),confirm=doc.getElementById('dayworksFinishConfirm');
 let scrolls=0;status.scrollIntoView=options=>{scrolls++;assert.equal(options.block,'center');};
 const c=g.core(),home={x:g.player.x,y:g.player.y};g.player.x=c.x+1000;g.player.y=c.y;g.dayworks.open();
 const before=stable(g);finish.click();assert.match(status.textContent,/Revenez près du centre/);assert.equal(confirm.classList.contains('hidden'),true);assert.equal(scrolls,1);assert.equal(doc.activeElement,status);assert.deepEqual(stable(g),before);
 for(let i=0;i<20;i++)g.updateUI();assert.equal(scrolls,1,'Le HUD ne force jamais la lecture à chaque rafraîchissement');assert.match(status.textContent,/Revenez près du centre/);
 doc.getElementById('dayworksSurvey').click();assert.match(status.textContent,/Carnet équipé/);assert.equal(scrolls,1,'Un nouvel ordre remplace normalement la notice');
 Object.assign(g.player,home);g.updateUI();finish.click();assert.equal(confirm.classList.contains('hidden'),false);assert.equal(scrolls,1,'La confirmation dans le planning reste à sa place');
 g.showCommand(false);finish.click();assert.equal(scrolls,1,'Un contrôle inerte ne déclenche aucune navigation');
});

test('tiroirs : le toggle différé d’une restauration ne mange pas la nouvelle touche de déplacement',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions();r.intel.open=true;r.intel.dispatch('toggle');
 g.showCommand(true,'workers');assert.equal(r.intel.open,false);g.showCommand(false);assert.equal(r.intel.open,true);
 g.input.keys.add('KeyD');r.intel.dispatch('toggle');r.map.dispatch('toggle');assert.ok(g.input.keys.has('KeyD'),'Les événements de restauration et fermeture ne sont pas des actions du joueur');
 r.map.querySelector('summary').click();assert.equal(g.input.keys.size,0,'Une activation explicite du tiroir annule toujours les entrées précédentes');
 g.input.keys.add('KeyS');doc.getElementById('hud135LocalActions').dispatch('toggle');assert.ok(g.input.keys.has('KeyS'));
 doc.getElementById('hud135LocalActionsToggle').click();assert.equal(g.input.keys.size,0);
});
