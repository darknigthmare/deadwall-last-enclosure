'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fixture(){const env=bootDocument134(),{g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.phase='warning';g.phaseTime=10;g.prepareWave();g.updateUI();return env;}
function stable(g){const save=g.serialize();delete save.timestamp;return save;}

test('briefing : les vrais fronts et contacts proches restent visibles hors du dossier Situation',()=>{
 const {g,doc}=fixture(),wave=doc.getElementById('hud135Wave'),intel=g.ui.waveIntel,alert=doc.getElementById('innerRingAlert');
 assert.equal(intel.parentNode,wave);assert.equal(alert.parentNode,wave);assert.equal(g.hud135.regions().intel.open,false);
 assert.equal(doc.body.querySelectorAll('#waveIntel').length,1);assert.equal(doc.body.querySelectorAll('#innerRingAlert').length,1);
 assert.equal(intel.hidden,false);assert.match(intel.textContent,/Approche par/);assert.equal(doc.getElementById('hud143BattleActions').hidden,false);
 g.spawnZombie(Object.keys(globalThis.DeadwallCore.ENEMIES)[0]);Object.assign(g.zombies.at(-1),{x:g.core().x,y:g.core().y-200});
 g.battlefieldUI.refresh(true);g.phase='assault';g.updateUI();assert.equal(alert.classList.contains('hidden'),false);assert.match(alert.textContent,/NORD/);
 const before=stable(g);for(let i=0;i<30;i++)g.hud135.refresh();assert.deepEqual(stable(g),before,'Lire le briefing ne consomme rien et ne recalcule pas une vague');
 g.phase='aftermath';g.updateUI();assert.equal(intel.hidden,false);assert.equal(doc.getElementById('hud143BattleActions').hidden,true);
 g.phase='calm';g.updateUI();assert.equal(intel.hidden,true);assert.equal(alert.parentNode,wave,'L’alerte reste reliée à son vrai contrôleur même pendant le calme');
});

test('briefing : préparer, inspecter les portes et commander les sections passent par le commandement existant',()=>{
 const {g,doc}=fixture(),prepare=doc.getElementById('hud143Prepare');
 for(const[id,tab]of [['hud143Prepare','field'],['hud143Enclosure','enclosure'],['hud143Squads','workers']]){
  const button=doc.getElementById(id);button.focus();const before=stable(g),elapsed=g.elapsed;button.click();
  assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(g.paused,true);assert.equal(g.ui.hud.inert,true);
  assert.equal(doc.getElementById('commandTab-'+tab).getAttribute('aria-selected'),'true');
  assert.ok(g.ui.commandModal.contains(doc.activeElement));if(tab==='field'){assert.equal(doc.activeElement.id,'coordinationHeading143');assert.match(doc.getElementById('coordinationBriefing143').textContent,/Arrivées annoncées/);}
  for(let i=0;i<4;i++)g.loop(g.lastFrame+40);assert.equal(g.elapsed,elapsed);assert.deepEqual(stable(g),before);
  g.showCommand(false);assert.equal(g.paused,false);assert.equal(doc.activeElement,button);assert.deepEqual(stable(g),before);
 }
 prepare.focus();prepare.click();doc.getElementById('coordination143Squads').click();assert.equal(doc.getElementById('commandTab-workers').getAttribute('aria-selected'),'true');
 g.showCommand(false);assert.equal(doc.activeElement,prepare);assert.equal(g.coordinationUI.openOrders('unknown'),false);
});

test('briefing : aucun raccourci ne traverse une introduction, les paramètres ou le menu',()=>{
 const {g,doc}=fixture(),prepare=doc.getElementById('hud143Prepare');
 g.campaignIntro132.replay();assert.equal(prepare.disabled,true);prepare.click();assert.equal(g.coordinationUI.open(),false);assert.equal(g.coordinationUI.openOrders('enclosure'),false);assert.equal(g.activeOverlay,g.campaignIntro132.element);
 g.campaignIntro132.skip();g.showSettings(true);assert.equal(prepare.disabled,true);prepare.click();assert.equal(g.coordinationUI.open(),false);assert.equal(g.activeOverlay,g.ui.settingsModal);
 g.showSettings(false);g.returnToMenu();assert.equal(prepare.disabled,true);assert.equal(g.coordinationUI.open(),false);assert.equal(g.coordinationUI.openOrders('workers'),false);assert.equal(g.activeOverlay,g.ui.mainMenu);
});
