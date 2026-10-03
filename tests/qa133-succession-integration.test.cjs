'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const C=require('../src/core.js'),Succession=require('../src/succession133.js');
function fresh({ui=false}={}){const e=boot131({ui});Succession.install(e.g);return e;}
const clone=v=>JSON.parse(JSON.stringify(v));
function dead(g){g.player.invulnerable=0;g.damagePlayer(10000);assert.equal(g.succession133.pending(),true);}
function stable(g){const s=g.serialize();delete s.timestamp;return s;}

test('QA133 succession : la mort clôt la sortie et les effets personnels avant sa première sauvegarde',()=>{
 const {g,storage}=fresh(),operation=g.fieldOperations.catalogue[0];
 assert.equal(g.fieldOperations.start(operation.id).ok,true);
 const save=g.serialize();save.siege.playerWater=4;save.expansions127.modules.survival.meal={left:60,budget:15};save.expansions127.modules.survival.dressing={left:10,remaining:8};g.restoreSave(save);
 dead(g);
 const stored=globalThis.DeadwallSave.parse(storage.get(C.SAVE_KEY));
 assert.equal(stored.fieldOps.active,null);assert.equal(stored.fieldOps.last.result,'downed');assert.equal(stored.fieldOps.failures[operation.id],1);
 assert.equal(stored.siege.playerWater,0);assert.deepEqual(stored.expansions127.modules.survival.meal,{left:0,budget:0});assert.deepEqual(stored.expansions127.modules.survival.dressing,{left:0,remaining:0});
 assert.equal(stored.succession133.pending,true);assert.equal(stored.player.dead,true);assert.equal(g.lastSaveStatus.ok,true);
 assert.equal(g.succession133.select('scout'),true);g.update(.04);assert.equal(g.fieldOperations.snapshot().active,null);assert.equal(g.player.carryCapacity,32);
});

test('QA133 succession : archétypes, vitesse réelle, chantier, santé et sac survivent à plusieurs reprises',()=>{
 const {g}=fresh();
 for(const choice of g.succession133.choices()){
  dead(g);assert.equal(g.succession133.select(choice.id),true);
  assert.equal(g.player.maxHealth,choice.health);assert.equal(g.player.health,choice.health);assert.equal(g.player.carryCapacity,choice.capacity);
  const before=g.player.x,surface=require('../src/exploration-125.js').surfaceAt(g.exploration125.plan,g.player.x,g.player.y,g.weather).multiplier,road=g.infrastructure.speed(g.player.x,g.player.y);g.moveFriendly(g.player,10,0);assert.ok(Math.abs(g.player.x-before-10*choice.speed*surface*road)<1e-7,'La vitesse annoncée affecte le déplacement réel en conservant le facteur du terrain.');
  assert.equal(g.playerOps131.constructionFactor(.04),choice.construction);
  assert.equal(C.bagTotal(g.player.carry),0);assert.equal(Object.values(g.player.magazine).reduce((a,b)=>a+b,0),0);
  const s=g.serialize();g.restoreSave(s);g.restoreSave(g.serialize());assert.equal(g.player.carryCapacity,choice.capacity);assert.equal(g.player.maxHealth,choice.health);assert.equal(g.player.health,choice.health);
  assert.equal(g.succession133.view().current.profile,choice.id);assert.equal(g.lastSaveStatus.ok,true);
 }
});

test('QA133 succession : une reprise invalide reste transactionnelle et ne modifie ni le sac au sol ni la colonie',()=>{
 const {g}=fresh();g.player.carry.scrap=9;dead(g);const before=stable(g),world=g.world;
 const bad=clone(before);bad.player.carry.scrap=1;
 assert.throws(()=>g.restoreSave(bad),/survivants tombés/);assert.equal(g.world,world);assert.deepEqual(stable(g),before);
 const malformed=clone(before);malformed.succession133.remains[0].point.domain='elsewhere';
 assert.throws(()=>g.restoreSave(malformed));assert.equal(g.world,world);assert.deepEqual(stable(g),before);
});

test('QA133 succession : ancienne sauvegarde d’un commandant à terre migre une seule fois et conserve son chargement',()=>{
 const {g}=fresh(),old=g.serialize();delete old.succession133;old.player.dead=true;old.player.health=0;old.player.downTimer=8;old.player.carry.food=7;
 const mags=clone(old.player.magazine);assert.equal(g.restoreSave(old),true);const first=g.succession133.remains();assert.equal(first.length,1);assert.equal(first[0].bag.food,7);assert.deepEqual(first[0].magazine,mags);
 const migrated=g.serialize();assert.equal(g.restoreSave(migrated),true);assert.equal(g.succession133.remains().length,1);assert.deepEqual(g.succession133.remains()[0],first[0]);
});

test('QA133 succession : la réanimation locale conserve santé et identité dans les trois difficultés',()=>{
 const {g}=fresh();
 for(const difficulty of Object.keys(C.DIFFICULTIES)){
  g.startNew(difficulty,'17117');dead(g);assert.equal(g.succession133.select('porter'),true);
  const s=g.serialize(),b=s.succession133.remains[0].body;b.roll=0;b.phase='waiting';b.left=.01;
  g.restoreSave(s);g.paused=true;g.succession133.step(.1);assert.equal(g.succession133.remains()[0].body.left,.01,'Une pause n’avance pas le délai.');g.paused=false;g.succession133.step(.1);
  const before=g.succession133.remains()[0];assert.equal(before.body.phase,'risen');assert.equal(g.zombies.filter(z=>z.id===before.body.zombieId).length,1);
  const save=g.serialize();g.restoreSave(save);assert.deepEqual(g.succession133.remains()[0],before);g.restoreSave(g.serialize());assert.deepEqual(g.succession133.remains()[0],before);
 }
});

test('QA133 succession : un sac rempli demeure matériellement au point de chute lorsque le centre tombe',()=>{
 const {g}=fresh();g.player.carry.wood=11;const where={x:g.player.x,y:g.player.y};dead(g);const body=g.succession133.remains()[0];assert.deepEqual({x:body.point.x,y:body.point.y},where);
 g.destroyBuilding(g.core());assert.equal(g.gameOver,true);assert.equal(g.succession133.select('builder'),false);assert.equal(g.player.dead,true);assert.equal(g.succession133.remains()[0].bag.wood,11);
});
