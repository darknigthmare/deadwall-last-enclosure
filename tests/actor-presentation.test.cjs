'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const A=require('../src/actor-presentation.js'),C=require('../src/core.js');
function fresh(){const e=bootGame();e.game.startNew('standard','17117');e.game.art={};A.install(e.game);return e;}
function clear(g){g.world.nodes=[];g.player.x=1000;g.player.y=1000;g.input.keys.clear();}
function put(g,type,x,y,progress=1){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,progress);g.world.add(b);return b;}

test('présentation : proxy local stable, branchement art et absence de mutation du joueur',()=>{
 const{game:g}=fresh(),before=JSON.stringify(g.player),first=g.actorPresentation.player();
 assert.equal(g.actorPresentation.player(),first);assert.equal(g.art.presentation(g.player,'player'),first);
 assert.equal(g.art.presentation(first,'player'),first);assert.equal(g.art.presentation(g.units[0],'worker'),g.units[0]);
 assert.equal(JSON.stringify(g.player),before);assert.equal(Object.hasOwn(g.player,'visualMoving'),false);
 assert.equal(first.visualMoving,false);assert.equal(first.visualMotionReset,true);
});

test('présentation : marche et sprint mesurés sur les déplacements réels',()=>{
 const{game:g}=fresh();clear(g);g.input.keys.add('KeyD');g.updatePlayer(.04);
 let p=g.actorPresentation.player();assert.equal(p.visualMoving,true);assert.equal(p.sprinting,false);assert.ok(p.visualSpeed>100);
 g.input.keys.add('ShiftLeft');g.updatePlayer(.04);p=g.actorPresentation.player();assert.equal(p.sprinting,true);assert.ok(p.visualSpeed>190);
 g.input.keys.clear();g.updatePlayer(.04);assert.equal(g.actorPresentation.player().visualMoving,false);
});

test('présentation : une course bloquée contre un mur ne joue ni marche ni sprint',()=>{
 const{game:g}=fresh();clear(g);const wall=put(g,'woodWall',32,31);Object.assign(g.player,{x:wall.left-12,y:wall.y});
 g.input.keys.add('KeyD');g.input.keys.add('ShiftLeft');g.updatePlayer(.04);
 const p=g.actorPresentation.player();assert.equal(p.visualMoving,false);assert.equal(p.sprinting,false);assert.equal(p.visualSpeed,0);
});

test('présentation : travail uniquement quand récolte ou chantier progressent réellement',()=>{
 const{game:g}=fresh(),Node=g.world.nodes[0].constructor;clear(g);
 const node=new Node(90001,'wood',1060,1000,20,14,0);g.world.nodes=[node];standAt(g,g.player,node);g.input.keys.add('KeyE');g.updateInteraction(.04);
 assert.equal(g.actorPresentation.player().visualAction,'work');assert.ok(g.player.carry.wood>0);
 g.world.nodes=[];g.player.x=1000;g.player.y=1000;g.updateInteraction(.04);assert.equal(g.actorPresentation.player().visualAction,'');
 const site=put(g,'house',36,31,0);standAt(g,g.player,site);g.updateInteraction(.04);
 assert.ok(site.progress>0);assert.equal(g.actorPresentation.player().visualAction,'work');
 g.input.keys.clear();g.updateInteraction(.04);assert.equal(g.actorPresentation.player().visualAction,'');
});

test('présentation : le dépôt, E à vide et un stock saturé ne deviennent pas du travail',()=>{
 const{game:g}=fresh();g.player.carry.wood=5;standAt(g,g.player,g.core());g.input.keys.add('KeyE');g.updateInteraction(.04);
 assert.equal(g.player.carry.wood,0);assert.equal(g.actorPresentation.player().visualAction,'');
 g.player.carry.wood=5;g.resources.wood=g.storage;g.updateInteraction(.04);assert.equal(g.actorPresentation.player().visualAction,'');
});

test('présentation : pause, téléportation et reprise annulent les mouvements visuels précédents',()=>{
 const{game:g}=fresh();clear(g);g.input.keys.add('KeyD');g.updatePlayer(.04);assert.equal(g.actorPresentation.player().visualMoving,true);
 g.paused=true;assert.equal(g.actorPresentation.player().visualMoving,false);g.paused=false;
 assert.equal(g.actorPresentation.player().visualMoving,false);g.updatePlayer(.04);assert.equal(g.actorPresentation.player().visualMoving,true);
 g.player.x+=500;let p=g.actorPresentation.player();assert.equal(p.visualMoving,false);assert.equal(p.visualMotionReset,true);
 const proxy=p,snapshot=g.serialize();g.restoreSave(snapshot);p=g.actorPresentation.player();assert.equal(p,proxy);assert.equal(p.visualMoving,false);assert.equal(p.visualMotionReset,true);
});

test('présentation : rechargement, coups et santé proviennent du joueur sans état sauvegardé ajouté',()=>{
 const{game:g}=fresh();g.player.magazine.pistol=0;g.startReload();g.player.shootCooldown=.2;g.player.meleeCooldown=.3;g.player.posture='prone';
 const before=g.serialize(),p=g.actorPresentation.player();assert.equal(p.reload,g.player.reload);assert.equal(p.reloadTotal,g.player.reloadTotal);
 assert.equal(p.shootCooldown,.2);assert.equal(p.meleeCooldown,.3);assert.equal(p.visualPosture,'prone');assert.equal(p.weapon,'pistol');
 const after=g.serialize();delete before.timestamp;delete after.timestamp;assert.deepEqual(after,before);
});

test('présentation régionale : proxy stable en mètres convertis, posture native et retour sans marche fictive',()=>{
 const{game:g}=fresh();g.player.x=4068;g.player.y=2048;assert.equal(g.frontier.enter(),true);
 let v=g.frontier.overview(),p=g.actorPresentation.player(v);assert.equal(p.x,v.x*32);assert.equal(p.y,v.y*32);assert.equal(p.facing,v.a);
 assert.equal(p.visualMoving,false);const regional=p;g.worldEvolution.setPosture('crouch');v=g.frontier.overview();p=g.actorPresentation.player(v);
 assert.equal(p,regional);assert.equal(p.visualPosture,'crouch');assert.equal(g.art.presentation(p,'player'),p);
 g.player.meleeCooldown=.5;assert.equal(g.actorPresentation.player(v).meleeCooldown,0);assert.equal(g.player.meleeCooldown,.5,'le résidu local ne devient pas un travail régional et reste intact');
 g.input.keys.add('KeyD');g.updatePlayer(.04);v=g.frontier.overview();p=g.actorPresentation.player(v);assert.equal(p.visualMoving,true);assert.equal(p.sprinting,false);
 const saved=g.serialize();saved.frontier.x=C.AtlasRules.homeMax;saved.frontier.y=4096;g.restoreSave(saved);assert.equal(g.frontier.leave(),true);
 p=g.actorPresentation.player();assert.notEqual(p,regional);assert.equal(p.x,g.player.x);assert.equal(p.visualMoving,false);assert.equal(p.visualMotionReset,true);
});

test('présentation : une réanimation ne joue pas un cycle de course entre les deux positions',()=>{
 const{game:g}=fresh();clear(g);g.player.dead=true;g.player.health=0;g.player.downTimer=.01;g.updatePlayer(.04);
 const p=g.actorPresentation.player();assert.equal(p.dead,false);assert.equal(p.visualMoving,false);assert.equal(p.sprinting,false);assert.equal(p.visualMotionReset,true);
});
