'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),Q=require('../src/squads.js'),Save=require('../src/save.js'),T=require('../src/tactics.js');
const {bootGame}=require('./helpers/browser.cjs');
const fresh=()=>{const env=bootGame();env.game.startNew('standard','17117');return env;};
function add(game,type,gx,gy,rotation=0){const b=new(game.core().constructor)(game.nextId++,type,gx,gy,rotation,1);game.world.add(b);return b;}
function soldier(game,squad=0,x=game.core().x,y=game.core().y){const unit=new(game.units[0].constructor)(game.nextId++,'soldier',x,y);unit.squad=squad;unit.offset={x:0,y:0};game.units.push(unit);return unit;}
function tick(game,steps=1){for(let n=0;n<steps;n++){game.elapsed+=.04;game.updateUnits(.04);}}
function tactical(game){game.ui.commandModal.classList.remove('hidden');game.paused=true;game.syncOverlayFocus();}
const live=(id,squad=null)=>({id,kind:'soldier',squad,health:100,dead:false});

test('sections pures : trois groupes et points indépendants reprennent le ralliement historique',()=>{
  const rally={x:2211,y:2001},state=Q.create(rally);assert.equal(state.groups.length,3);assert.equal(state.selected,0);
  state.groups.forEach(group=>assert.deepEqual(group,{order:'rally',rally}));
  state.groups[0].rally.x=5;assert.equal(state.groups[1].rally.x,2211);assert.equal(rally.x,2211);
  assert.deepEqual(Q.normalize(undefined,rally),Q.create(rally));
});
test('sections pures : affectation équilibrée par IDs sans dépendre de l’ordre des tableaux',()=>{
  const units=[live(8),live(2),live(7),live(1),live(3),live(5),{id:0,kind:'worker',health:100}];
  const assigned=Q.assignments(units);assert.deepEqual([...assigned],[[1,0],[2,1],[3,2],[5,0],[7,1],[8,2]]);
  assert.deepEqual([...Q.assignments(units.slice().reverse())],[...assigned]);assert.equal(units[0].squad,null,'fonction pure');
});
test('sections pures : les affectations existantes restent stables, morts exclus du prochain renfort',()=>{
  const units=[live(1,2),live(2,0),{...live(3,0),dead:true},live(4)];
  assert.equal(Q.nextGroup(units),1);const assigned=Q.assignments(units);assert.equal(assigned.get(1),2);assert.equal(assigned.get(2),0);assert.equal(assigned.get(4),1);assert.equal(assigned.has(3),false);
});
test('sections pures : validation stricte et ordres indépendants sans modifier l’entrée',()=>{
  const state=Q.create({x:100,y:200}),point={x:300,y:400},next=Q.withOrder(state,1,'rally',point);
  assert.deepEqual(state.groups[1].rally,{x:100,y:200});assert.deepEqual(next.groups[1].rally,point);
  assert.deepEqual(next.groups[0],state.groups[0]);assert.equal(Q.withOrder(state,4,'retreat'),null);
  for(const raw of [null,{...state,version:2},{...state,selected:3},{...state,groups:[]},{...state,groups:[{order:'teleport',rally:point},...state.groups.slice(1)]},{...state,groups:[{order:'rally',rally:{x:NaN,y:2}},...state.groups.slice(1)]}])assert.throws(()=>Q.normalize(raw),RangeError);
  for(const value of [-1,3,1.5,'1',true])assert.throws(()=>Q.unitGroup('soldier',value));
  assert.throws(()=>Q.unitGroup('medic',1));assert.equal(Q.unitGroup('worker',undefined),null);
});
test('sections : module autonome sans accès navigateur, stockage ou hasard',()=>{
  const sandbox={DeadwallCore:C};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../src/squads.js'),'utf8'),sandbox);
  assert.equal(sandbox.DeadwallSquads.create({x:100,y:100}).groups.length,3);
});
test('sections : recrutement équilibré garde coûts, santé et nombre de tirages historiques',()=>{
  const {game}=fresh();add(game,'barracks',73,62);add(game,'house',74,70);game.refreshMetrics(true);
  for(const key of C.RESOURCE_KEYS)game.resources[key]=500;
  let calls=0;const range=game.random.range.bind(game.random);game.random.range=(...args)=>{calls++;return range(...args);};
  const before={...game.resources};
  for(let n=0;n<6;n++)assert.equal(game.recruit('soldier'),true);
  const soldiers=game.units.filter(u=>u.kind==='soldier');assert.deepEqual(soldiers.map(u=>u.squad),[0,1,2,0,1,2]);assert.equal(calls,12,'seuls les deux tirages de position existants par recrue');
  for(const key of C.RESOURCE_KEYS)assert.equal(game.resources[key],before[key]-(C.SURVIVORS.soldier.cost[key]||0)*6);
  soldiers.forEach(u=>assert.equal(u.health,C.SURVIVORS.soldier.health));soldiers[0].dead=true;assert.equal(game.recruit('soldier'),true);assert.equal(game.units.at(-1).squad,0);
});
test('sections : ordres distincts gratuits mais sans déplacement ni rechargement instantané',()=>{
  const {game}=fresh(),a=soldier(game,0),b=soldier(game,1),before={...game.resources},positions=game.units.map(u=>[u.id,u.x,u.y]),random=game.random.state;
  assert.equal(game.setSquadRally(1,{x:2300,y:2200}),true);assert.equal(game.retreatSquad(0),true);
  assert.equal(game.squads.groups[0].order,'retreat');assert.deepEqual(game.squads.groups[1].rally,{x:2300,y:2200});assert.equal(game.squads.groups[2].order,'rally');
  assert.deepEqual(game.resources,before);assert.equal(game.random.state,random);assert.deepEqual(game.units.map(u=>[u.id,u.x,u.y]),positions);assert.equal(a.health,C.SURVIVORS.soldier.health);assert.equal(b.health,C.SURVIVORS.soldier.health);
});
test('sections : ancien ralliement général diffuse aux trois et conserve les spécialistes',()=>{
  const {game}=fresh();game.retreatSquad(0);const target={x:2400,y:2150};
  assert.equal(game.setSquadRally(null,target),true);assert.deepEqual(game.rally,target);
  game.squads.groups.forEach(group=>assert.deepEqual(group,{order:'rally',rally:target}));
});
test('sections : aucun ordre hors partie ou derrière pause/aide/paramètres, pause tactique autorisée',()=>{
  const {game}=fresh();const before=JSON.stringify(game.squads);
  for(const overlay of [game.ui.pauseMenu,game.ui.helpModal,game.ui.settingsModal]){
    game.paused=true;game.activeOverlay=overlay;
    assert.equal(game.selectSquad(1),false);assert.equal(game.setSquadRally(1,{x:2200,y:2100}),false);assert.equal(game.retreatSquad(1),false);assert.equal(game.beginSquadRally(1),false);
  }
  assert.equal(JSON.stringify(game.squads),before);tactical(game);assert.equal(game.selectSquad(2),true);assert.equal(game.retreatSquad(2),true);
  game.gameOver=true;assert.equal(game.retreatSquad(1),false);game.gameOver=false;game.state='menu';assert.equal(game.selectSquad(1),false);
});
test('sections : points hors carte, rayon chevauchant et porte fermée refusés sans muter',()=>{
  const {game}=fresh(),wall=add(game,'woodWall',70,64),gate=add(game,'gate',70,68,1);gate.gateMode='closed';
  const before=JSON.stringify(game.squads),coords=game.units.map(u=>[u.x,u.y]);
  for(const point of [{x:-1,y:2000},{x:Infinity,y:2000},{x:wall.x,y:wall.y},{x:wall.left-5,y:wall.top-5},{x:gate.x,y:gate.y}])assert.equal(game.setSquadRally(0,point),false);
  assert.equal(JSON.stringify(game.squads),before);assert.deepEqual(game.units.map(u=>[u.x,u.y]),coords);
  gate.gateMode='auto';assert.equal(game.setSquadRally(0,{x:gate.x,y:gate.y}),true);
});
test('sections : repli avance vers le centre sans poursuivre une menace éloignée',()=>{
  const {game}=fresh(),unit=soldier(game,1,game.core().x+230,game.core().y);game.units=[unit];game.zombies=[];game.retreatSquad(1);
  const before=C.dist(unit,game.core()),ammo=game.resources.ammo;
  tick(game,20);assert.ok(C.dist(unit,game.core())<before);assert.ok(unit.x>game.core().x+100,'pas de téléportation');assert.equal(game.resources.ammo,ammo);
});
test('sections : repli peut riposter mais dépense les munitions normales et ne poursuit pas',()=>{
  const {game}=fresh(),unit=soldier(game,0,game.core().x+180,game.core().y);game.units=[unit];game.startAssault();
  game.spawnZombie('walker');const enemy=game.zombies[0];enemy.x=unit.x+100;enemy.y=unit.y;game.rebuildBuckets();game.retreatSquad(0);
  const ammo=game.resources.ammo,x=unit.x;tick(game);
  assert.equal(game.resources.ammo,ammo-1);assert.ok(game.projectiles.length);assert.ok(unit.x<x,'repli maintenu pendant la riposte');
  enemy.x=unit.x+320;game.rebuildBuckets();unit.fireCooldown=0;const next=unit.x;tick(game);assert.ok(unit.x<next,'pas de poursuite hors portée de tir effective');
});
test('sections : le repli ne traverse pas une enceinte verrouillée puis utilise sa porte ouverte',()=>{
  const {game}=fresh(),unit=soldier(game,2,C.world(74),C.world(64));game.units=[unit];game.world.nodes=[];
  for(let y=0;y<C.WORLD_TILES;y++)if(y!==64&&y!==65)add(game,'woodWall',70,y);
  const gate=add(game,'gate',70,64,1);gate.gateMode='closed';game.retreatSquad(2);const before={x:unit.x,y:unit.y};
  tick(game,100);assert.deepEqual({x:unit.x,y:unit.y},before);assert.equal(game.getSquadSummary()[2].blocked,1);
  assert.equal(game.setGateMode('auto',gate),true);let crossed=false;
  for(let n=0;n<800&&C.dist(unit,game.core())>C.SQUAD_RULES.retreatRadius;n++){tick(game);assert.ok(game.friendlyPositionClear(unit,unit.x,unit.y));if(C.grid(unit.x)===70&&[64,65].includes(C.grid(unit.y)))crossed=true;}
  assert.ok(crossed);assert.ok(C.dist(unit,game.core())<=C.SQUAD_RULES.retreatRadius);
});
test('sections : la sauvegarde conserve points, repli, sélection et identités sans débit au chargement',()=>{
  const {game}=fresh();soldier(game,0);soldier(game,2);game.setSquadRally(2,{x:2400,y:2200});game.retreatSquad(0);game.selectSquad(2);
  const squads=JSON.parse(JSON.stringify(game.squads)),positions=game.units.map(u=>[u.id,u.x,u.y,u.squad]),resources={...game.resources};
  assert.equal(game.save(false),true);assert.equal(game.load(),true);assert.deepEqual(game.squads,squads);assert.deepEqual(game.units.map(u=>[u.id,u.x,u.y,u.squad]),positions);assert.deepEqual(game.resources,resources);
});
test('sections : migration ancienne par IDs, ralliement exact et aucun gain',()=>{
  const {game}=fresh();soldier(game,0);soldier(game,2);soldier(game,1);const data=game.serialize();delete data.squads;data.rally={x:2430,y:2090};
  data.units.forEach(u=>delete u.squad);data.units.reverse();const resources={...data.resources},positions=data.units.map(u=>[u.id,u.x,u.y]);
  assert.equal(game.restoreSave(data),true);game.squads.groups.forEach(group=>assert.deepEqual(group.rally,data.rally));assert.deepEqual(game.units.filter(u=>u.kind==='soldier').sort((a,b)=>a.id-b.id).map(u=>u.squad),[0,1,2]);assert.deepEqual(game.resources,resources);assert.deepEqual(game.units.map(u=>[u.id,u.x,u.y]),positions);
});
test('sections : import invalide transactionnel préserve monde et ordres',()=>{
  const {game}=fresh();soldier(game,0);const data=game.serialize(),world=game.world,squads=JSON.stringify(game.squads);
  for(const bad of [{...data,squads:null},{...data,squads:{...data.squads,selected:4}},{...data,units:data.units.map(u=>u.kind==='soldier'?{...u,squad:99}:u)}])assert.throws(()=>game.restoreSave(bad));
  assert.equal(game.world,world);assert.equal(JSON.stringify(game.squads),squads);assert.doesNotThrow(()=>Save.validate(data));
});
test('sections : raccourcis réservés au terrain, saisies et combinaisons système ignorées',()=>{
  const {game,dispatchWindow}=fresh();game.canvas.focus();
  const press=code=>{dispatchWindow('keydown',{code,target:game.canvas});game.handlePressed();game.input.pressed.clear();dispatchWindow('keyup',{code});};
  press('Digit6');assert.equal(game.squads.selected,2);press('KeyT');assert.equal(game.squads.groups[2].order,'retreat');press('KeyG');assert.deepEqual(game.rallyPlacement,{squad:2});press('Escape');assert.equal(game.rallyPlacement,false);
  const input=document.createElement('input');dispatchWindow('keydown',{code:'Digit4',target:input});game.handlePressed();assert.equal(game.squads.selected,2);
  dispatchWindow('keydown',{code:'Digit4',ctrlKey:true,target:game.canvas});game.handlePressed();assert.equal(game.squads.selected,2);
  tactical(game);dispatchWindow('keydown',{code:'Digit4',target:game.canvas});game.handlePressed();assert.equal(game.squads.selected,2);
});
test('sections : point au sol et annulation conservent positions, chantier antérieur annulé',()=>{
  const {game}=fresh();game.selectBuild('woodWall');const units=game.units.map(u=>[u.x,u.y]);
  assert.equal(game.beginSquadRally(1),true);assert.equal(game.selectedBuild,null);assert.equal(game.placeSquadRally({x:-10,y:2000}),false);assert.deepEqual(game.rallyPlacement,{squad:1});
  game.onEscape();assert.equal(game.rallyPlacement,false);assert.deepEqual(game.units.map(u=>[u.x,u.y]),units);
  assert.equal(game.beginSquadRally(null),true);assert.equal(game.placeSquadRally({x:2300,y:2150}),true);assert.equal(game.rallyPlacement,false);game.squads.groups.forEach(group=>assert.deepEqual(group.rally,{x:2300,y:2150}));
});
test('sections UI : trois cartes natives, état pressé, alternative clavier et annonces sans HTML importé',()=>{
  const {game}=fresh(),panel=document.getElementById('squadCommandPanel');game.ui.commandModal.appendChild(panel);
  delete require.cache[require.resolve('../src/squad-ui.js')];require('../src/squad-ui.js');tactical(game);game.squadUI.refresh();
  const cards=panel.querySelectorAll('article');assert.equal(cards.length,3);
  const first=cards[0],buttons=first.querySelectorAll('button');assert.equal(buttons.length,4);assert.equal(buttons[0].getAttribute('aria-pressed'),'true');assert.ok(buttons.every(button=>button.getAttribute('aria-label')));
  buttons[3].click();assert.equal(game.squads.groups[0].order,'retreat');assert.equal(buttons[3].getAttribute('aria-pressed'),'true');
  buttons[2].click();assert.equal(game.squads.groups[0].order,'rally');assert.deepEqual(game.squads.groups[0].rally,{x:game.player.x,y:game.player.y});
  const status=panel.children.at(-1);assert.equal(status.getAttribute('role'),'status');assert.ok(status.textContent.includes('ALPHA'));assert.equal(panel.innerHTML,'');
});
