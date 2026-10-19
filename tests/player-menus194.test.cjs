'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const Policy=require('../src/player-menus194.js');
const stable=g=>{const {timestamp,...s}=g.serialize();return require('node:crypto').createHash('sha256').update(JSON.stringify(s)).digest('hex');};
async function fixture({start=true,current=false}={}){const e=bootDocument134();await new Promise(r=>setTimeout(r,0));if(start){e.g.startNew('standard','17117','classic','balanced',current);e.g.campaignIntro132.skip();}return e;}
const actions=doc=>doc.getElementById('field-expansions').querySelectorAll('.expansion-action').map(c=>c.querySelector('button').id);
const sections=doc=>[...doc.getElementById('commandPanel-field').children].filter(n=>n.tagName==='SECTION'&&!n.classList.contains('hidden')).map(n=>n.id);

test('194 default native request uses G10/detail13 with water and natural fauna, without visiting settings',async()=>{
 const {g,doc}=await fixture({start:false});g.startupReady=true;assert.equal(g.playerMenus194.mode,'player');assert.equal(doc.getElementById('newGameButton').getAttribute('aria-describedby'),'newCampaignContent194');assert.equal([...doc.getElementById('startScenario').children].find(n=>n.value==='classic').textContent,'Le dépôt — départ recommandé');
 // This DOM harness does not model <option selected>; an empty selector must
 // still use the current balanced profile. Browser proof covers the real select.
 assert.equal(g.requestNewGame(),true);const f=g.frontier.position();assert.equal(f.generation,10);assert.equal(f.detailVersion,13);assert.equal(f.ecologyVersion,1);assert.equal(f.hydrologyVersion,1);assert.equal(f.landscape189,'balanced');
 assert.equal(g.campaignIntro132.isOpen(),true);g.campaignIntro132.skip();assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
 const id=g.runId,seed=g.world.seed;g.togglePause(true);const before=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);g.togglePause(true);assert.equal(stable(g),before);assert.equal(g.runId,id);assert.equal(g.world.seed,seed);
});
test('194 four-argument legacy starts and saved legacy worlds are not silently converted',async()=>{
 const {g}=await fixture();assert.equal(g.frontier.position().generation,8);assert.equal(g.frontier.position().detailVersion,1);g.togglePause(true);const before=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);g.togglePause(true);assert.equal(stable(g),before);
});
test('194 explicit historical landscape affects climate, not the native current-content promise',async()=>{
 const {g,doc}=await fixture({start:false});g.startupReady=true;doc.getElementById('worldLandscape189').value='classic';doc.getElementById('mapSeed').value='17117';assert.equal(g.requestNewGame(),true);const f=g.frontier.position();assert.equal(f.landscape189,undefined);assert.equal(f.generation,10);assert.equal(f.detailVersion,13);
});
test('194 invalid fresh options and cancelled replacement retain every saved owner',async()=>{
 const {g}=await fixture();g.togglePause(true);const before=stable(g),world=g.world;
 assert.equal(g.startNew('standard','17117','classic','balanced','yes'),false);assert.equal(g.world,world);assert.equal(stable(g),before);
 g.returnToMenu();g.startupReady=true;const atMenu=stable(g),previousConfirm=globalThis.confirm;try{globalThis.confirm=()=>false;assert.equal(g.requestNewGame(),false);assert.equal(g.world,world);assert.equal(stable(g),atMenu);}finally{globalThis.confirm=previousConfirm;}
});
test('194 restart native controls carry current content forward instead of returning to G8',async()=>{
 const {g,doc}=await fixture({current:true});const calls=[],original=g.startNew;g.startNew=(...args)=>calls.push(args);
 // The game-over buttons are intentionally inert until their owner is shown.
 g.gameOver=true;g.ui.gameOver.classList.remove('hidden');g.syncOverlayFocus();
 for(const id of ['restartButton','gameOverNewMapButton'])doc.getElementById(id).dispatch('click');
 assert.equal(calls.length,2);assert.ok(calls.every(a=>a[4]===true&&a[3]==='balanced'));assert.equal(calls[0][1],'17117');assert.equal(calls[1][1],'');g.startNew=original;
});
test('194 player Guide contains playable knowledge, not development proposals or automatic recipe laboratories',async()=>{
 const {g,doc}=await fixture();const before=stable(g);g.worldCodex.open();
 for(const id of ['worldCodexStatus','worldCodexFamily'])assert.ok(![...doc.getElementById(id).children].some(n=>['programme','programmes','plan'].includes(n.value)));
 assert.equal(doc.getElementById('worldCodexCoverage159').hidden,true);assert.equal(doc.getElementById('worldCodexTerritories160').hidden,true);
 doc.getElementById('worldCodexStatus').value='programme';g.worldCodex.refresh();assert.equal(doc.getElementById('worldCodexResults').querySelectorAll('article').length,0);
 doc.getElementById('worldCodexStatus').value='terrain';g.worldCodex.refresh();assert.ok(doc.getElementById('worldCodexResults').querySelectorAll('article').length>0);
 assert.ok(doc.getElementById('worldCodexResults').querySelectorAll('details').every(n=>!n.dataset.codexSource159));assert.equal(stable(g),before);
 // The full source API remains available for diagnostics without mutating play.
 assert.equal(g.worldCodex.query({status:'programme'}).length,4000);
});
test('194 source tools and historical QA require separate explicit URL choices',()=>{
 const old=globalThis.location;try{for(const [search,tools,current]of [['',false,true],['?tools=1',true,true],['?fixture=legacy',false,true],['?tools=1&fixture=legacy',true,false],['?tools=true',false,true]]){globalThis.location={search};assert.equal(Policy.toolsEnabled(),tools);assert.equal(Policy.currentStart(),current);}}finally{globalThis.location=old;}
});
test('194 normal operations hide migrations; compatibility route shows only migrations and does not apply one',async()=>{
 const {g,doc}=await fixture();g.togglePause(true);const before=stable(g);
 g.expansionUI.open('world131');assert.ok(actions(doc).some(id=>id.endsWith('-relay')));assert.ok(!actions(doc).some(id=>id.endsWith('metricVehicle174')||id.includes('expandTerritories160')));
 assert.equal(g.playerMenus194.openMaintenance(),true);assert.ok(actions(doc).some(id=>id.endsWith('metricVehicle174')));assert.ok(actions(doc).every(id=>Policy.isMaintenance('world131',id.replace('expansionAction-world131-',''))));assert.equal(stable(g),before);
 doc.getElementById('maintenanceReturn194').click();assert.equal(g.activeOverlay,g.ui.settingsModal);assert.equal(g.paused,true);g.showSettings(false);g.expansionUI.open('world131');assert.equal(g.playerMenus194.maintenanceOpen,false);assert.ok(actions(doc).some(id=>id.endsWith('-relay')));assert.equal(stable(g),before);
});
test('194 direct dossier shortcuts expose exactly one panel and preserve keyboard owners',async()=>{
 const {g,doc}=await fixture();const before=stable(g);
 for(const [api,id]of [['expansionUI','field-expansions'],['worldCodex','field-world-codex'],['coordinationUI','coordinationPanel'],['linecareUI','linecarePanel'],['reconUI','reconPanel']]){g[api].open();assert.deepEqual(sections(doc),[id]);assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(g.paused,true);}
 g.showCommand(false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(stable(g),before);
});
test('194 folder tabs preserve the original buttons and all dossiers remain reachable',async()=>{
 const {g,doc}=await fixture();const nav=doc.getElementById('commandPanel-field').querySelector('.field-nav'),buttons=[...nav.querySelectorAll('button')];g.showCommand(true,'field');
 for(const b of buttons){const id=b.getAttribute('aria-controls');if(!id)continue;b.dispatch('click');assert.deepEqual(sections(doc),[id]);assert.equal(b.hidden,false);assert.ok(doc.body.contains(b));}
 assert.equal(new Set(buttons).size,buttons.length);
});
test('194 disabled operations are in a disclosure without changing their refusal or payment',async()=>{
 const {g,doc}=await fixture();g.expansionUI.open('world131');const before=stable(g),unavailable=doc.getElementById('unavailableActions194');assert.ok(doc.body.contains(unavailable));assert.ok(unavailable.querySelectorAll('button').length>0);assert.ok(unavailable.querySelectorAll('button').every(b=>b.disabled));assert.equal(stable(g),before);
});
test('194 system records are outside the default tactical tab sequence and remain accessible from pause',async()=>{
 const {g,doc}=await fixture();g.showCommand(true,'research');assert.equal(doc.getElementById('commandTab-records').hidden,true);
 doc.getElementById('commandTab-research').dispatch('keydown',{code:'ArrowRight'});assert.equal(doc.activeElement,doc.getElementById('commandTab-field'));
 g.showCommand(false);g.togglePause(true);doc.getElementById('pauseRecords194').click();assert.equal(doc.getElementById('commandTab-records').hidden,false);assert.equal(doc.getElementById('commandTab-records').getAttribute('aria-selected'),'true');g.showCommand(false);assert.equal(g.paused,true);
});
test('194 objective panel reads the active gameplay objective without granting progression',async()=>{
 const {g,doc}=await fixture();g.showCommand(true);const before=stable(g);g.playerMenus194.refresh();assert.equal(doc.getElementById('playerObjectiveTitle194').textContent,g.ui.objectiveTitle.textContent);assert.equal(doc.getElementById('playerObjectiveText194').textContent,g.ui.objectiveText.textContent);assert.equal(stable(g),before);
});


test('194 even G4/G7 extension commands stay in compatibility, not the player orders',()=>{
 for(const id of ['expand131','expandCodex3000','expandCodex4000','expandTerritories160','metricVehicle174'])assert.equal(Policy.isMaintenance('world131',id),true,id);
 for(const id of ['relay','secure','reserve','survey','rest','store','take','cancel'])assert.equal(Policy.isMaintenance('world131',id),false,id);
 assert.equal(Policy.isMaintenance('another-pack','expand131'),false);
});


test('194 notebook presentation mounts after the original command presenters have placed their controls',async()=>{
 const {g,doc}=await fixture();const goal=doc.getElementById('playerObjective194');
 assert.equal(goal.parentNode,doc.getElementById('commandPanel-enclosure'));
 assert.ok(!doc.getElementById('commandDefense129').contains(goal),'the primary goal is not hidden in the closed defence disclosure');
 assert.equal(doc.getElementById('commandTitle').textContent,'CARNET DU COMMANDANT');
 assert.equal(doc.getElementById('commandTab-field').querySelector('strong').textContent,'Dossiers');
 assert.equal(doc.getElementById('commandTab-workers').querySelector('strong').textContent,'Équipes');
 g.showCommand(true);assert.equal(g.activeOverlay,g.ui.commandModal);
});
