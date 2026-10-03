'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),R=C.ExplorePackRules;

function fresh(){const {game:g}=boot127();g.startNew('standard','17117');g.units=[];g.phase='calm';g.phaseTime=99999;g.zombies=[];return g;}
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds/.04);i++){g.update(.04);g.input.pressed.clear();}}
function atNode(g){const n=g.world.nodes.find(n=>n.type==='wood'&&n.amount>60);assert.ok(n);standAt(g,g.player,n);g.player.carry.food=4;return n;}

test('QA 1.28 : une commande brève interrompt la prospection sans consommer ses fournitures',()=>{
 const g=fresh(),n=atNode(g);
 for(const key of ['KeyR','KeyE','KeyW']){
  assert.ok(g.explorationPack.survey(n.id).ok);tick(g,.4);
  g.input.pressed.add(key);assert.equal(g.input.keys.has(key),false);
  tick(g,.04);
  assert.equal(g.explorationPack.busy(),false,key);
  assert.equal(g.player.carry.food,4,key);
  assert.equal(g.explorationPack.snapshot().surveys.length,0,key);
 }
});

test('QA 1.28 : le rechargement réel interdit puis interrompt une intervention de prospection',()=>{
 const g=fresh(),n=atNode(g);g.player.magazine.pistol=0;g.startReload();
 assert.ok(g.player.reload>0);
 assert.equal(g.explorationPack.survey(n.id).ok,false);
 tick(g,C.WEAPONS.pistol.reload);
 assert.ok(g.explorationPack.survey(n.id).ok);tick(g,.4);
 g.player.magazine.pistol=0;g.startReload();tick(g,.04);
 assert.equal(g.explorationPack.busy(),false);
 assert.equal(g.player.carry.food,4);
 assert.equal(g.explorationPack.snapshot().surveys.length,0);
});

test('QA 1.28 : une réanimation immédiate au même point annule aussi une tâche sans ballot',()=>{
 const g=fresh(),core=g.core();
 Object.assign(g.player,g.coreArrivalPosition(g.player,{x:core.x+80,y:core.y}));
 Object.assign(g.player.carry,{wood:20,scrap:10});
 const point={x:g.player.x,y:g.player.y};
 assert.ok(g.explorationPack.placeCache().ok);tick(g,.4);
 g.player.dead=true;g.player.health=0;g.player.downTimer=0;tick(g,.04);
 assert.equal(g.player.dead,false);
 assert.deepEqual({x:g.player.x,y:g.player.y},point);
 assert.equal(g.explorationPack.busy(),false);
 tick(g,R.cacheSeconds);
 assert.equal(g.explorationPack.snapshot().caches.length,0);
 assert.equal(g.player.carry.wood,10);
 assert.equal(g.player.carry.scrap,5);
});

test('QA 1.28 : le dossier de prospection expose l’annulation et les motifs des actions indisponibles',()=>{
 const g=fresh(),n=atNode(g);
 assert.equal(g.explorationPack.actions().some(a=>a.id==='cancel'),false);
 for(const id of ['drop','clear-route']){const action=g.explorationPack.actions().find(a=>a.id===id);assert.equal(action.disabled,true);assert.ok(action.reason);}
 assert.ok(g.explorationPack.survey(n.id).ok);tick(g,.4);
 const cancel=g.explorationPack.actions().find(a=>a.id==='cancel');
 assert.ok(cancel);assert.equal(cancel.close,true);assert.ok(cancel.run().ok);
 assert.equal(g.explorationPack.busy(),false);
 assert.equal(g.player.carry.food,4);
 assert.equal(g.explorationPack.actions().some(a=>a.id==='cancel'),false);
});
