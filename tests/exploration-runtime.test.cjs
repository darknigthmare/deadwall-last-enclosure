'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {bootGame} = require('./helpers/browser.cjs');
const E = require('../src/exploration-125.js');
const C = require('../src/core.js');
const {standAt} = require('./helpers/physical-fixtures.cjs');

function install(game) {
  const proto = Object.getPrototypeOf(document.createElement('div'));
  if (!proto.append) proto.append = function (...nodes) { for (const node of nodes) this.appendChild(node); };
  if (!proto.insertBefore) proto.insertBefore = function (node, sibling) {
    const index = this.children.indexOf(sibling);
    if (index < 0) return this.appendChild(node);
    node.parentNode = this; this.children.splice(index, 0, node); return node;
  };
  assert.equal(E.install(game, document), true);
}

test('nouvelle campagne : région native G4, ressources et sauvegarde 1.25 réunies', () => {
  const {game:g} = bootGame(); install(g);
  g.startNew('standard', '17117');
  assert.equal(g.frontier.snapshot().generation, 4);
  assert.equal(g.exploration125.generation, 4);
  assert.equal(g.world.nodes.filter(n=>n.__exploration125Loot).length, 12);
  for(const station of g.exploration125.plan.stations)
    assert.equal(g.world.nodes.some(n=>!n.__exploration125Loot&&!n.depleted&&
      Math.abs(n.x-station.x)<station.w/2&&Math.abs(n.y-station.y)<station.h/2),false,'boutique dégagée');
  const node = g.world.nodes.find(n=>n.__exploration125Loot);
  const remaining = node.amount - node.harvest(2);
  assert.equal(g.save(false), true);
  assert.equal(g.load(), true);
  assert.equal(g.frontier.snapshot().generation, 4);
  assert.equal(g.world.nodes.find(n=>n.id===node.id).amount, remaining);
  assert.equal(g.serialize().exploration125.generation, 4);
});

test('ancien enregistrement G3 : géométrie et monde régional inchangés', () => {
  const {game:g} = bootGame(); g.startNew('standard','17117');
  const historical = g.serialize(); install(g); g.restoreSave(historical);
  assert.equal(g.frontier.snapshot().generation, 3);
  assert.equal(g.exploration125.generation, 3);
  assert.equal(g.world.nodes.some(n=>n.__exploration125Loot), false);
  assert.equal(g.save(false), true);
  assert.equal(g.load(), true);
  assert.equal(g.frontier.snapshot().generation, 3);
});

test('les quatre faces G4 ouvrent la région native et permettent le retour hors des routes', () => {
  const {game:g} = bootGame(); install(g); g.startNew('standard','17117');
  const values=[640,1280,2048,2816,3456];
  for (const side of ['north','south','east','west']) for (const lateral of values) {
    g.player.x=side==='west'?38:side==='east'?4058:lateral;
    g.player.y=side==='north'?38:side==='south'?4058:lateral;
    assert.equal(g.frontier.enter(),true,`${side} ${lateral} : sortie`);
    const d=g.serialize(),r=C.AtlasRules;
    d.frontier.x=side==='west'?r.homeMin-.5:side==='east'?r.homeMax+.5:r.homeMin+lateral/32;
    d.frontier.y=side==='north'?r.homeMin-.5:side==='south'?r.homeMax+.5:r.homeMin+lateral/32;
    g.restoreSave(d);
    assert.equal(g.frontier.leave(),true,`${side} ${lateral} : retour`);
    assert.equal(g.player.regionAbsent,false);
    assert.ok(Math.abs((side==='north'||side==='south'?g.player.x:g.player.y)-lateral)<=480,`${side} ${lateral} : latitude conservée`);
  }
});

test('boucle G4 intégrée : déplacement, récolte, dépôt, placement, assaut et reprise', () => {
  const {game:g} = bootGame(); install(g); g.startNew('standard','17117');
  const originalX=g.player.x;
  g.input.keys.add('KeyD'); g.updatePlayer(.15); g.input.keys.clear();
  assert.ok(g.player.x>originalX,'le commandant se déplace');

  const node=g.world.nodes.find(candidate=>candidate.type==='wood'&&!candidate.depleted);
  assert.ok(node,'un gisement de bois accessible existe');
  standAt(g,g.player,node); g.input.keys.add('KeyE');
  const amount=node.amount;
  for(let i=0;i<50;i++)g.updateInteraction(.04);
  assert.ok(node.amount<amount&&g.player.carry.wood>0,'récolte physique');
  standAt(g,g.player,g.core());
  const deposited=g.depositedResources;
  g.updateInteraction(.04);
  assert.ok(g.depositedResources>deposited&&g.player.carry.wood===0,'dépôt');

  let cell=null;
  for(let y=59;y<71&&!cell;y++)for(let x=59;x<75;x++)
    if(g.world.placement(C.BUILDINGS.woodWall,x,y,0).valid){cell={x,y};break;}
  assert.ok(cell,'emplacement de palissade');
  assert.equal(g.placeOne('woodWall',cell.x,cell.y),true);
  assert.ok([...g.world.buildings.values()].some(b=>b.type==='woodWall'&&!b.completed));

  g.prepareWave();g.phase='assault';g.startAssault();
  assert.ok(g.remainingAssault>0,'assaut préparé');
  const before=g.zombies.length;
  g.updateDirector(1);
  assert.ok(g.zombies.length>before,'infectés entrent dans la carte');
  assert.equal(g.save(false),true);
  assert.equal(g.load(),true);
  assert.equal(g.frontier.snapshot().generation,4);
  assert.ok([...g.world.buildings.values()].some(b=>b.type==='woodWall'));
  assert.ok(g.remainingAssault>0);
});

test('carte M et sac I suspendent puis restaurent la simulation', () => {
  const {game:g,dispatchDocument}=bootGame(); install(g); g.startNew('standard','17117');
  const map=document.body.children.find(node=>node.id==='deadwall125-map');
  const inventory=document.body.children.find(node=>node.id==='deadwall125-inventory');
  assert.ok(map&&inventory);
  dispatchDocument('keydown',{code:'KeyM',target:document.body});
  assert.equal(map.classList.contains('hidden'),false);
  assert.equal(g.paused,true);
  g.exploration125.closeOverlay();
  assert.equal(g.paused,false);
  dispatchDocument('keydown',{code:'KeyI',target:document.body});
  assert.equal(inventory.classList.contains('hidden'),false);
  assert.equal(g.paused,true);
  g.exploration125.closeOverlay();
  assert.equal(g.paused,false);
});


test('postures : le déplacement réel ralentit, sans consommer de sprint accroupi', () => {
  const {game:g}=bootGame(); install(g);g.startNew('standard','17117');
  const origin={x:g.player.x,y:g.player.y};
  function distance(posture,sprint=false){Object.assign(g.player,origin,{posture,stamina:100});g.input.keys.clear();g.input.keys.add('KeyD');if(sprint)g.input.keys.add('ShiftLeft');g.updatePlayer(.04);return g.player.x-origin.x;}
  const standing=distance('stand'),crouching=distance('crouch'),prone=distance('prone');
  assert.ok(standing>0);
  assert.ok(Math.abs(crouching/standing-.68)<.001);
  assert.ok(Math.abs(prone/standing-.38)<.001);
  assert.ok(Math.abs(distance('crouch',true)-crouching)<.001);
  assert.equal(g.player.stamina,100);
});

test('fenêtres : entrées relâchées, focus rendu et fermeture au retour menu',()=>{
  const {game:g}=bootGame();install(g);g.startNew('standard','17117');
  const origin=document.getElementById('pauseButton');origin.focus();
  g.input.keys.add('KeyD');g.exploration125.openMap();
  assert.equal(g.input.keys.size,0);
  g.exploration125.closeOverlay();assert.equal(document.activeElement,origin);
  g.exploration125.openInventory();g.returnToMenu();
  const inventory=document.body.children.find(n=>n.id==='deadwall125-inventory');
  assert.equal(inventory.classList.contains('hidden'),true);
});


test('hordes sauvages : progression, pause et assaut respectés',()=>{
  const {game:g}=bootGame();install(g);g.startNew('standard','17117');
  g.paused=true;assert.equal(g.exploration125.spawnWildHorde(),false);
  g.paused=false;g.phase='assault';assert.equal(g.exploration125.spawnWildHorde(),false);
  g.phase='calm';assert.equal(g.exploration125.spawnWildHorde(),true);
  assert.equal(g.zombies.length,2);
  assert.ok(g.zombies.every(z=>z.kind==='walker'));
  const next=321;g.exploration125.wildNext=next;g.player.posture='prone';
  assert.equal(g.save(false),true);assert.equal(g.load(),true);
  assert.equal(g.exploration125.wildHordes,1);assert.equal(g.exploration125.wildNext,next);assert.equal(g.player.posture,'prone');
});

test('G4 : arbres et roches quittent les chaussées sans retirer les épaves ni perdre leurs réserves',()=>{
  for(const seed of ['17117','18118','998877']){
    const {game:g}=bootGame();install(g);g.startNew('standard',seed);const plan=g.exploration125.plan;
    const roads=[...plan.roads,...plan.settlements.flatMap(s=>[s.street,s.connector].filter(Boolean))];
    const natural=g.world.nodes.filter(n=>!n.sceneryKind&&['wood','stone'].includes(n.type));
    assert.ok(natural.some(n=>n.__exploration125RoadRelocated),'des ressources ont été relogées');
    assert.equal(natural.some(n=>roads.some(r=>E.roadContains(r,n.x,n.y,n.radius*1.8))),false,'voies dégagées jusque dans les hameaux');
    assert.ok(natural.filter(n=>n.__exploration125RoadRelocated).every(n=>n.amount===n.maxAmount),'réserves déplacées conservées');
    assert.ok(g.world.nodes.some(n=>n.sceneryKind&&E.isVehicleNode(n)),'épaves du monde conservées');
    const positions=natural.map(n=>[n.id,n.x,n.y]);natural.find(n=>n.__exploration125RoadRelocated).harvest(1e6);
    assert.ok(g.save(false));assert.ok(g.load());
    assert.deepEqual(g.world.nodes.filter(n=>!n.sceneryKind&&['wood','stone'].includes(n.type)).map(n=>[n.id,n.x,n.y]),positions,'récolte puis reprise sans redistribution');
  }
});
