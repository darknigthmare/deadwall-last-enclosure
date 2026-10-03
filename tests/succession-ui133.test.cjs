'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const Intro=require('../src/campaign-intro132.js'),UI=require('../src/succession-ui133.js');
const PROFILES=[
 {id:'scout',name:'Éclaireur',description:'Lit le terrain.',advantages:['Déplacement +8 %'],tradeoffs:['90 PV · sac 32 portions']},
 {id:'carrier',name:'Manutentionnaire',description:'Ramène les matériaux.',advantages:['Sac 44 portions'],tradeoffs:['Déplacement −6 %']},
 {id:'builder',name:'Bâtisseur',description:'Termine les chantiers.',advantages:['Construction +15 %'],tradeoffs:['Déplacement −2 %']}
];
function fixture(){
 const e=boot131({ui:true}),g=e.g,doc=e.doc;Intro.install(g,doc);
 const state={pending:false,selected:[],atDepot:false,requisitions:[],quoteCalls:0};
 const oldStart=g.startNew.bind(g);g.startNew=(...args)=>{try{globalThis.DeadwallProfile.normalizeSeed(args[1]??'');globalThis.DeadwallScenarios.initialState(args[2]??'classic',args[0]||'standard');}catch{return oldStart(...args);}state.pending=false;return oldStart(...args);};
 g.succession133={ownsWeapon:()=>true,pending:()=>state.pending,choices:()=>PROFILES,view:()=>({pending:state.pending,choices:PROFILES,lastDeath:{name:'Survivant 01',locationLabel:'D-17 · dépôt · dernier point connu'},message:'',atDepot:state.atDepot,canRequisition:state.requisitions.some(r=>r.allowed),requisitions:state.requisitions}),select:id=>{if(!state.pending||!PROFILES.some(p=>p.id===id)||g.gameOver)return false;state.selected.push(id);state.pending=false;g.player.dead=false;g.player.health=100;g.paused=false;g.updateUI();return true;},requisition:id=>{state.quoteCalls++;const q=state.requisitions.find(q=>q.id===id);if(!q?.allowed)return false;q.owned=true;return true;}};
 UI.install(g,doc);const ui=g.successionUI133;
 const die=()=>{state.pending=true;g.player.health=0;g.player.dead=true;g.paused=true;ui.refresh();};
 return{...e,g,doc,state,ui,die};
}

test('relève UI : ouverture illustrée, choix explicite en deux temps et focus exclusif',()=>{
 const {g,doc,state,ui,die}=fixture();die();assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);assert.equal(g.paused,true);assert.equal(g.canIssueCommand(),false);assert.equal(g.ui.hud.inert,true);assert.equal(doc.activeElement.dataset.archetype,'scout');
 assert.equal(ui.element.getAttribute('aria-modal'),'true');assert.equal(ui.element.querySelector('img').getAttribute('src'),'assets/loadout-character129.png');
 const choices=ui.element.querySelectorAll('button').filter(b=>b.dataset.archetype);assert.equal(choices.length,3);assert.ok(choices.every(b=>b.getAttribute('role')==='radio'));
 choices[1].click();assert.equal(ui.view().chosen,'carrier');assert.deepEqual(state.selected,[]);assert.equal(g.player.dead,true);assert.equal(choices[1].getAttribute('aria-checked'),'true');
 doc.getElementById('succession133Confirm').click();assert.deepEqual(state.selected,['carrier']);assert.equal(ui.isOpen(),false);assert.equal(g.player.dead,false);assert.equal(g.activeOverlay,null);assert.equal(g.ui.hud.inert,false);assert.equal(g.paused,false);assert.equal(doc.activeElement,g.canvas);
});

test('relève UI : clavier fléché, Home/End, boucle Tab et Échap ne ressuscitent pas',()=>{
 const {g,doc,state,ui,die,dispatchWindow}=fixture();die();
 ui.element.dispatch('keydown',{code:'ArrowRight',target:doc.activeElement});assert.equal(ui.view().chosen,'carrier');assert.equal(doc.activeElement.dataset.archetype,'carrier');
 ui.element.dispatch('keydown',{code:'End',target:doc.activeElement});assert.equal(ui.view().chosen,'builder');
 ui.element.dispatch('keydown',{code:'Home',target:doc.activeElement});assert.equal(ui.view().chosen,'scout');
 const confirm=doc.getElementById('succession133Confirm');confirm.focus();dispatchWindow('keydown',{code:'Tab'});assert.equal(doc.activeElement.dataset.archetype,'scout');dispatchWindow('keydown',{code:'Tab',shiftKey:true});assert.equal(doc.activeElement,confirm);
 dispatchWindow('keydown',{code:'Escape'});assert.equal(doc.activeElement.id,'succession133Menu');assert.equal(ui.isOpen(),true);assert.equal(g.player.dead,true);assert.deepEqual(state.selected,[]);assert.equal(g.togglePause(false),false);assert.equal(g.paused,true);
});

test('relève UI : commandes et simulation bloquées, champs invisibles non interactifs',()=>{
 const {g,ui,die,dispatchWindow}=fixture();die();const before={elapsed:g.elapsed,phase:g.phaseTime,resources:{...g.resources},x:g.player.x};
 dispatchWindow('keydown',{code:'KeyD'});dispatchWindow('keydown',{code:'Space'});g.input.keys.add('KeyE');g.input.mouseDown=true;
 for(let i=0;i<12;i++){g.update(.04);g.loop(g.lastFrame+40);}
 assert.deepEqual({elapsed:g.elapsed,phase:g.phaseTime,resources:{...g.resources},x:g.player.x},before);assert.equal(g.input.keys.size,0);assert.equal(g.input.mouseDown,false);
 for(const f of [()=>g.showCommand(true),()=>g.showHelp(true),()=>g.loadoutUI.open(),()=>g.frontierUI.open(),()=>g.expansionUI.open()]){f();assert.equal(g.activeOverlay,ui.element);assert.equal(g.paused,true);}
 assert.equal(g.campaignIntro132.replay(),false);
});

test('relève UI : perte de focus préserve une reprise volontaire après sélection',()=>{
 const {g,doc,ui,die}=fixture();die();g.suspendForFocusLoss();assert.equal(ui.view().keepPaused,true);assert.equal(ui.confirm(),true);assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);assert.ok(g.ui.pauseMenu.contains(doc.activeElement));const elapsed=g.elapsed;g.loop(g.lastFrame+40);assert.equal(g.elapsed,elapsed);g.togglePause(false);assert.equal(g.paused,false);
});

test('relève UI : rafraîchir conserve choix, défilement, focus et réglage mouvement réduit',()=>{
 const {g,doc,ui,die}=fixture();die();ui.choose('builder',true);ui.element.scrollTop=280;g.settings.reducedMotion=true;g.updateUI();assert.equal(ui.view().chosen,'builder');assert.equal(ui.element.scrollTop,280);assert.equal(doc.activeElement.dataset.archetype,'builder');assert.equal(ui.element.classList.contains('succession133-static'),true);
});

test('relève UI : échec de sélection ne ferme pas le dossier ni ne reprend la campagne',()=>{
 const {g,doc,ui,die}=fixture();die();g.succession133.select=()=>false;assert.equal(ui.confirm(),false);assert.equal(ui.isOpen(),true);assert.equal(g.paused,true);assert.equal(g.activeOverlay,ui.element);assert.match(doc.getElementById('succession133Status').textContent,/Relève indisponible/);
});

test('relève UI : menu sauvegardé conserve le choix en attente, retour en campagne le réaffiche',()=>{
 const {g,doc,state,ui,die}=fixture();die();doc.getElementById('succession133Menu').click();assert.equal(g.state,'menu');assert.equal(ui.isOpen(),false);assert.equal(state.pending,true);assert.equal(g.activeOverlay,g.ui.mainMenu);assert.equal(g.ui.mainMenu.inert,false);assert.deepEqual(state.selected,[]);
 // La persistance des données est couverte par succession133 ; ici le même état réhydraté rouvre le dossier.
 g.state='playing';g.ui.mainMenu.classList.add('hidden');g.updateUI();assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);assert.equal(g.paused,true);
});

test('relève UI : sauvegarde refusée conserve le dossier et un message actionnable',()=>{
 const {g,doc,state,ui,die}=fixture();die();const save=g.save;g.save=()=>false;try{doc.getElementById('succession133Menu').click();assert.equal(g.state,'playing');assert.equal(state.pending,true);assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);assert.match(doc.getElementById('succession133Status').textContent,/Sauvegarde impossible/);}finally{g.save=save;}
});

test('relève UI : nouvelle campagne valide nettoie la relève avant le nouveau prologue',()=>{
 const {g,doc,state,ui,die}=fixture();die();g.startNew('standard','17219');assert.equal(state.pending,false);assert.equal(ui.isOpen(),false);assert.equal(g.campaignIntro132.isOpen(),true);assert.equal(g.activeOverlay,g.campaignIntro132.element);assert.equal(g.ui.hud.inert,true);g.campaignIntro132.skip();assert.equal(g.ui.hud.inert,false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(doc.body.querySelectorAll('#succession133').length,1);
});

test('relève UI : départ invalide ne libère pas le mort ni les commandes',()=>{
 const {g,state,ui,die}=fixture();die();const world=g.world;assert.equal(g.startNew('standard','graine-invalide'),false);assert.equal(g.world,world);assert.equal(state.pending,true);assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);assert.equal(g.paused,true);assert.equal(g.canIssueCommand(),false);
});

test('relève UI : chute du centre donne la priorité à la défaite, pas à une nouvelle vie',()=>{
 const {g,doc,state,ui,die}=fixture();die();g.gameOver=true;g.ui.gameOver.classList.remove('hidden');ui.refresh();assert.equal(ui.isOpen(),false);assert.equal(g.activeOverlay,g.ui.gameOver);assert.equal(g.ui.gameOver.inert,false);assert.ok(g.ui.gameOver.contains(doc.activeElement));assert.equal(ui.confirm(),false);assert.deepEqual(state.selected,[]);
});

test('relève UI : armurerie physique, coût visible, refus expliqué et quantité jamais inventée par UI',()=>{
 const {g,doc,state,ui}=fixture();state.atDepot=true;state.requisitions=[{id:'pistol',name:'Pistolet',cost:{scrap:8},allowed:false,reason:'8 ferrailles nécessaires.'}];ui.refresh();const armory=doc.getElementById('succession133Armory');assert.equal(armory.classList.contains('hidden'),false);let b=doc.getElementById('succession133Requisition-pistol');assert.equal(b.disabled,true);b.click();assert.equal(state.quoteCalls,0);
 state.requisitions[0].allowed=true;state.requisitions[0].reason='';ui.refresh();b=doc.getElementById('succession133Requisition-pistol');assert.equal(b.disabled,false);const resources={...g.resources};b.click();assert.equal(state.quoteCalls,1);assert.deepEqual(g.resources,resources);assert.equal(state.requisitions[0].owned,true);assert.equal(armory.classList.contains('hidden'),true);
 state.requisitions[0].owned=false;state.atDepot=false;state.requisitions[0].allowed=false;ui.refresh();assert.equal(armory.classList.contains('hidden'),true);
});

test('relève UI : installation idempotente, DOM absent sans effet',()=>{
 assert.equal(UI.install(null,null),null);assert.equal(UI.install({succession133:{}},{}),null);const {g,doc,ui}=fixture();assert.equal(UI.install(g,doc),ui);assert.equal(doc.body.querySelectorAll('#succession133').length,1);assert.equal(doc.body.querySelectorAll('#succession133Armory').length,1);
});

for(const kind of ['inventory','command'])test('relève UI : mort importée ferme proprement la modale '+kind,()=>{
 const {g,ui,die}=fixture();if(kind==='inventory')assert.equal(g.loadoutUI.open(),true);else g.showCommand(true);
 assert.ok(g.activeOverlay);die();assert.equal(g.activeOverlay,ui.element);assert.equal(g.loadoutUI.isOpen(),false);assert.equal(g.ui.commandModal.classList.contains('hidden'),true);
 assert.equal(ui.confirm(),true);assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(g.loadoutUI.open(),true);g.loadoutUI.close();assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
});

function realFixture(){
 const e=boot131({ui:true}),g=e.g,doc=e.doc;
 const settings=require.resolve('../src/ui.js');delete require.cache[settings];require(settings);
 const Succession=require('../src/succession133.js');Succession.install(g);Intro.install(g,doc);UI.install(g,doc);
 const kill=()=>{g.player.invulnerable=0;g.damagePlayer(10000);};
 return{...e,g,doc,kill,ui:g.successionUI133};
}
const clone=value=>JSON.parse(JSON.stringify(value));
const withoutTimestamp=value=>{const out=clone(value);delete out.timestamp;return out;};

test('relève intégrée : vrai décès, sauvegarde, menu et Continuer conservent le sac et le choix',()=>{
 const {g,doc,kill,ui}=realFixture();g.player.carry.wood=7;const position={x:g.player.x,y:g.player.y};kill();
 assert.equal(g.succession133.pending(),true);assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);const before=g.succession133.snapshot();assert.equal(before.remains[0].bag.wood,7);assert.deepEqual({x:before.remains[0].point.x,y:before.remains[0].point.y},position);
 doc.getElementById('succession133Menu').click();assert.equal(g.state,'menu');assert.equal(ui.isOpen(),false);doc.getElementById('continueButton').click();assert.equal(g.state,'playing');assert.equal(g.succession133.pending(),true);assert.equal(ui.isOpen(),true);assert.equal(g.campaignIntro132.isOpen(),false);assert.equal(g.activeOverlay,ui.element);assert.deepEqual(g.succession133.snapshot(),before);
 const id=g.succession133.choices()[0].id;ui.choose(id);assert.equal(ui.confirm(),true);assert.equal(g.player.dead,false);assert.equal(g.succession133.pending(),false);assert.equal(g.player.carry.wood,0);assert.deepEqual(g.succession133.snapshot().current.weapons,[]);assert.equal(g.succession133.snapshot().remains[0].bag.wood,7);assert.equal(g.paused,false);
});

test('relève intégrée : restauration invalide conserve monde, UI, choix et sauvegarde',()=>{
 const {g,storage,kill,ui}=realFixture();kill();ui.choose(g.succession133.choices().at(-1).id);const world=g.world,view=ui.view(),before=withoutTimestamp(g.serialize()),saved=storage.get(globalThis.DeadwallCore.SAVE_KEY);const invalid=clone(g.serialize());invalid.succession133.remains[0].bag.wood=-1;
 assert.throws(()=>g.restoreSave(invalid));assert.equal(g.world,world);assert.deepEqual(ui.view(),view);assert.equal(g.activeOverlay,ui.element);assert.equal(g.paused,true);assert.deepEqual(withoutTimestamp(g.serialize()),before);assert.equal(storage.get(globalThis.DeadwallCore.SAVE_KEY),saved);
});

test('relève intégrée : nouvelle campagne depuis décès prépare un monde neuf et son introduction',()=>{
 const {g,kill,ui}=realFixture();kill();g.startNew('standard','133717');assert.equal(g.succession133.pending(),false);assert.equal(g.succession133.snapshot().remains.length,0);assert.equal(ui.isOpen(),false);assert.equal(g.campaignIntro132.isOpen(),true);assert.equal(g.activeOverlay,g.campaignIntro132.element);assert.equal(g.frontier.position().generation,5);g.campaignIntro132.skip();assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(g.ui.hud.inert,false);
});

for(const mode of ['intro','pause','settings'])test('relève intégrée : décès remplace '+mode+' et ne laisse pas de focus captif',()=>{
 const {g,doc,kill,ui}=realFixture();if(mode==='intro'){g.startNew('standard','133717');assert.equal(g.campaignIntro132.isOpen(),true);}else if(mode==='pause')g.togglePause(true);else g.showSettings(true);
 kill();assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);assert.equal(g.campaignIntro132.isOpen(),false);assert.equal(g.ui.settingsModal.classList.contains('hidden'),true);assert.equal(g.ui.pauseMenu.classList.contains('hidden'),true);assert.equal(ui.confirm(),true);
 if(mode==='pause'){assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);assert.ok(g.ui.pauseMenu.contains(doc.activeElement));g.togglePause(false);}else{assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);}
 assert.equal(g.ui.hud.inert,false);g.showSettings(true);g.showSettings(false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
});

test('relève intégrée : charger un décès depuis les paramètres remplace le panneau sans rejouer le prologue',()=>{
 const {g,kill,ui}=realFixture();kill();const pending=clone(g.serialize());assert.equal(ui.confirm(),true);g.showSettings(true);assert.equal(g.activeOverlay,g.ui.settingsModal);assert.equal(g.restoreSave(pending),true);assert.equal(ui.isOpen(),true);assert.equal(g.activeOverlay,ui.element);assert.equal(g.campaignIntro132.isOpen(),false);assert.equal(g.ui.settingsModal.classList.contains('hidden'),true);assert.equal(g.succession133.snapshot().remains.length,1);
});
