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


test('194 player Guide filters retain real city choices and discovered map links without author controls',async()=>{
 const {g,doc}=await fixture();g.worldCodex.open();
 const status=doc.getElementById('worldCodexStatus'),use=doc.getElementById('worldCodexAvailability159');
 assert.ok([...status.children].some(n=>n.value==='all'&&n.textContent==='Toutes les fiches utiles'));
 assert.deepEqual([...use.children].map(n=>n.value),['all','known','city']);
 use.value='city';use.dispatch('change');assert.ok(doc.getElementById('worldCodexResults').querySelectorAll('article').length>0);
 const place=g.frontier.world().pois.find(p=>p.programme3000);g.frontier.revealSites([place.id]);const before=stable(g);
 use.value='known';doc.getElementById('worldCodexSearch').value=place.programme3000;use.dispatch('change');
 const cards=doc.getElementById('worldCodexResults').querySelectorAll('article');assert.equal(cards.length,1);
 const card=cards[0];assert.equal(card.querySelector('h4').textContent,place.name);
 assert.ok(card.querySelectorAll('button').every(b=>b.dataset.codexPlace159===place.id&&!b.dataset.codexTerritories160));
 assert.ok(card.querySelectorAll('details').every(d=>!d.dataset.codexSource159));assert.equal(stable(g),before);
});

// Follow-up 196: player navigation without stacked author tabs, and correct pause feedback.
test('196 the player action index covers every registered pack once and all selections are read-only',async()=>{
 const {g,doc}=await fixture({current:true});g.expansionUI.open();const picker=doc.getElementById('playerOperationSelect196'),hub=g.expansionUI.section,before=stable(g);
 const values=picker.querySelectorAll('option').map(n=>n.value),expected=g.expansions.entries().map(n=>n.id).sort();
 assert.deepEqual([...values].sort(),expected);assert.equal(new Set(values).size,values.length);
 assert.equal(picker.getAttribute('aria-controls'),'expansionDetail');assert.equal(picker.parentNode.htmlFor,picker.id);
 assert.equal(hub.querySelector('.expansion-groups').hidden,true);assert.equal(hub.querySelector('.expansion-tabs').hidden,true);
 for(const id of values){picker.value=id;picker.dispatch('change');assert.equal(picker.value,id);assert.equal(stable(g),before,id);assert.deepEqual(sections(doc),['field-expansions']);}
 g.expansionUI.open('arsenal134');assert.equal(picker.value,'arsenal134');assert.equal(doc.activeElement,picker);assert.equal(stable(g),before);
});
test('196 compatibility and campaign archives show their system purpose, then return to the notebook',async()=>{
 const {g,doc}=await fixture({current:true});g.togglePause(true);g.showCommand(true);const before=stable(g);
 g.showCommand(false);g.showSettings(true);assert.equal(g.playerMenus194.openMaintenance(),true);
 assert.equal(doc.getElementById('commandTitle').textContent,'COMPATIBILITÉ DES SAUVEGARDES');
 assert.equal(g.expansionUI.section.querySelector('.expansion-heading').hidden,true);
 assert.equal(doc.activeElement,doc.getElementById('maintenanceReturn194'));
 doc.getElementById('maintenanceReturn194').click();g.showSettings(false);g.showCommand(true,'records');
 assert.equal(doc.getElementById('commandTitle').textContent,'ARCHIVES DE CAMPAGNE');
 g.showCommand(false);g.showCommand(true,'enclosure');assert.equal(doc.getElementById('commandTitle').textContent,'CARNET DU COMMANDANT');assert.equal(stable(g),before);
});
test('196 real worker orders legitimately replace a running plan, not resources or elapsed time',async()=>{
 const {g,doc}=await fixture({current:true});for(let i=0;i<40;i++)g.update(.04);g.togglePause(true);g.showCommand(true,'workers');
 const snapshot=()=>{const {timestamp,...s}=JSON.parse(JSON.stringify(g.serialize()));return s;};const before=snapshot();
 const workerButtons=doc.getElementById('workerOrders').querySelectorAll('button');
 const choose=order=>workerButtons.find(b=>b.dataset.workerOrder===order).dispatch('click');
 choose('harvest');assert.equal(g.workerOrder,'harvest');assert.match(doc.getElementById('commandStatus').textContent,/pause.*REPRENDRE/);
 choose('auto');const after=snapshot(),expected=structuredClone(before);
 for(const u of expected.units)if(u.kind==='worker'){u.state=u.carry>0?'return':'idle';u.targetNode=u.targetBuilding=u.targetUnit=-1;}
 assert.deepEqual(after,expected);assert.notDeepEqual(after.units,before.units,'a prior moving/assigned plan is not restored by changing the order back');
 g.showCommand(false);assert.equal(g.paused,true);g.togglePause(false);g.showCommand(true,'workers');choose('harvest');assert.match(doc.getElementById('commandStatus').textContent,/Fermez le carnet/);g.showCommand(false);assert.equal(g.paused,false);
});
test('196 an explicit author session retains its original group and family controls',async()=>{
 const {g,doc}=bootDocument134({search:'?tools=1&fixture=legacy'});await new Promise(r=>setTimeout(r,0));g.startNew('standard','17117');g.campaignIntro132.skip();g.expansionUI.open('world131');
 assert.equal(g.playerMenus194.mode,'author');assert.ok(!g.expansionUI.section.querySelector('.expansion-groups').hidden);assert.ok(!g.expansionUI.section.querySelector('.expansion-tabs').hidden);
 assert.equal(doc.body.querySelectorAll('#playerOperationSelect196').length,0);
});

// Run the actual browser branch with explicit timers. Replacing a document is
// observed, not a new fixture-only implementation of the scheduling policy.
test('196 only the latest pending notebook mount retains its document and world',()=>{
 const vm=require('node:vm'),source=require('node:fs').readFileSync('src/player-menus194.js','utf8'),timers=new Map();let next=0,installed=0;
 const env={console,URLSearchParams,Symbol,setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),location:{search:''}};
 vm.createContext(env);
 for(let i=0;i<40;i++){
  env.document={readyState:'complete',body:{},getElementById:()=>null};
  env.DEADWALL={get ui(){installed++;return {};}};
  vm.runInContext(source,env);assert.equal(timers.size,1,'obsolete callbacks are cancelled, not merely made harmless');
 }
 assert.equal(installed,0,'mount still waits for the post-DOM turn');
 const callback=[...timers.values()][0];timers.clear();callback();assert.equal(installed,1);
 assert.equal(env[Symbol.for('deadwall.playerMenus194.pendingMount')],undefined);
});
test('196 stale notebook callback cannot clear or install a newer pending request',()=>{
 const vm=require('node:vm'),source=require('node:fs').readFileSync('src/player-menus194.js','utf8'),timers=new Map();let next=0,installed=0;
 const env={URLSearchParams,Symbol,setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),location:{search:''},document:{readyState:'complete',body:{},getElementById:()=>null},DEADWALL:{get ui(){installed++;return {};}}};vm.createContext(env);
 vm.runInContext(source,env);const stale=[...timers.values()][0];env.document={readyState:'complete',body:{},getElementById:()=>null};vm.runInContext(source,env);
 const key=Symbol.for('deadwall.playerMenus194.pendingMount'),current=env[key];stale();assert.equal(installed,0);assert.equal(env[key],current);
 [...timers.values()][0]();assert.equal(installed,1);assert.equal(env[key],undefined);
});


test('196 first native Dossiers tab fills its operation index while paused, without an API shortcut or simulation tick',async()=>{
 const {g,doc}=await fixture({current:true});g.togglePause(true);g.showCommand(true,'enclosure');const before=stable(g),picker=doc.getElementById('playerOperationSelect196');
 assert.equal(picker.querySelectorAll('option').length,0,'no previous operation shortcut prepopulates this first visit');
 doc.getElementById('commandTab-field').click();
 const options=picker.querySelectorAll('option');assert.equal(options.length,g.expansions.entries().length);assert.ok(options.some(n=>n.value==='world131'));
 assert.ok(doc.getElementById('operationPackTitle196').textContent);assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(stable(g),before);
});
test('196 native top tabs exit system presentation and maintenance without changing the paused campaign',async()=>{
 const {g,doc}=await fixture({current:true});g.togglePause(true);g.showCommand(true,'records');const before=stable(g);
 assert.equal(doc.getElementById('commandTitle').textContent,'ARCHIVES DE CAMPAGNE');doc.getElementById('commandTab-enclosure').click();
 assert.equal(doc.getElementById('commandTitle').textContent,'CARNET DU COMMANDANT');assert.equal(doc.getElementById('commandTab-records').hidden,true);
 g.showCommand(false);g.showSettings(true);g.playerMenus194.openMaintenance();assert.equal(g.playerMenus194.maintenanceOpen,true);
 doc.getElementById('commandTab-workers').click();assert.equal(g.playerMenus194.maintenanceOpen,false);assert.equal(doc.getElementById('commandTitle').textContent,'CARNET DU COMMANDANT');
 doc.getElementById('commandTab-field').click();assert.equal(doc.getElementById('playerOperationSelect196').parentNode.parentNode.hidden,false);
 assert.equal(g.paused,true);assert.equal(stable(g),before);
});
