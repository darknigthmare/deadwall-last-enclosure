'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');
const {bootGame}=require('./helpers/browser.cjs');

function fresh(){
  const {game}=bootGame();game.startNew('standard','17117','rearguard');
  const unit=game.units.find(u=>u.kind==='soldier');game.units=[unit];game.zombies=[];game.world.nodes=[];
  unit.x=2140;unit.y=2064;unit.offset={x:100,y:0};
  return{game,unit};
}
function add(game,type,gx,gy,rotation=0){
  const building=new(game.core().constructor)(game.nextId++,type,gx,gy,rotation,1);game.world.add(building);return building;
}
function tick(game,steps=1){for(let i=0;i<steps;i++){game.elapsed+=.04;game.updateUnits(.04);}}

test('formation : conserve le décalage libre, sans hasard ni mutation des ordres',()=>{
  const {game,unit}=fresh(),group=Object.freeze({order:'rally',rally:Object.freeze({x:2220,y:2064})});
  Object.freeze(unit.offset);
  const before={rng:game.random.state,x:unit.x,y:unit.y,offset:JSON.stringify(unit.offset),group:JSON.stringify(group)};
  const point=game.squadFormationTarget(unit,group);
  assert.deepEqual(point,{x:2255,y:2064});assert.notEqual(point,group.rally);
  assert.deepEqual({rng:game.random.state,x:unit.x,y:unit.y,offset:JSON.stringify(unit.offset),group:JSON.stringify(group)},before);
});

test('formation : un décalage dans un mur rejoint physiquement le point central valide',()=>{
  const {game,unit}=fresh();add(game,'woodWall',70,64);
  const rally={x:2220,y:2064};
  assert.equal(game.setSquadRally(0,rally),true);
  assert.equal(game.squadRallyStatus({x:2255,y:2064}).ok,false);
  assert.deepEqual(game.squadFormationTarget(unit,game.squads.groups[0]),rally);
  const start={x:unit.x,y:unit.y};tick(game);
  assert.ok(C.dist(unit,start)>0);assert.ok(C.dist(unit,start)<=unit.speed*.04+1e-8,'déplacement normal, sans téléportation');
  tick(game,100);assert.ok(C.dist(unit,rally)<=C.SQUAD_RULES.rallyRadius);assert.equal(game.getSquadSummary()[0].blocked,0);
  assert.deepEqual(game.squads.groups[0].rally,rally,'le point sauvegardé ne change pas');
});

test('formation : fermeture ultérieure des deux destinations arrête, puis la réouverture libère',()=>{
  const {game,unit}=fresh(),gate=add(game,'gate',69,64);
  gate.gateMode='auto';assert.equal(game.setSquadRally(0,{x:2220,y:2064}),true);
  assert.notEqual(game.squadFormationTarget(unit,game.squads.groups[0]),null);
  assert.equal(game.setGateMode('closed',gate),true);
  assert.equal(game.squadFormationTarget(unit,game.squads.groups[0]),null);
  const before={x:unit.x,y:unit.y};tick(game,20);
  assert.deepEqual({x:unit.x,y:unit.y},before);assert.equal(game.getSquadSummary()[0].blocked,1);
  assert.equal(game.setGateMode('auto',gate),true);tick(game,100);
  assert.ok(C.dist(unit,{x:2255,y:2064})<=C.SQUAD_RULES.rallyRadius);
  assert.equal(game.getSquadSummary()[0].blocked,0);
});

test('formation : le fallback ne traverse pas une enceinte verrouillée',()=>{
  const {game,unit}=fresh();unit.x=2100;add(game,'woodWall',70,64);
  for(let y=0;y<C.WORLD_TILES;y++)add(game,'woodWall',67,y);
  assert.equal(game.setSquadRally(0,{x:2220,y:2064}),true);
  const before={x:unit.x,y:unit.y};tick(game,50);
  assert.deepEqual({x:unit.x,y:unit.y},before);assert.equal(game.getSquadSummary()[0].blocked,1);
});

test('formation : rayon complet, tangence et bord de carte utilisent un fallback praticable',()=>{
  const {game,unit}=fresh(),wall=add(game,'woodWall',70,64);
  unit.offset={x:-100,y:0};
  for(const preferred of [{x:wall.right+unit.radius,y:wall.y},{x:wall.right+8,y:wall.bottom+8}]){
    const group={order:'rally',rally:{x:preferred.x+35,y:preferred.y}};
    assert.equal(game.squadRallyStatus(preferred).ok,false);
    assert.deepEqual(game.squadFormationTarget(unit,group),group.rally);
  }
  const corner={x:wall.right+9,y:wall.bottom+9};
  assert.equal(game.squadRallyStatus(corner).ok,true);
  assert.deepEqual(game.squadFormationTarget(unit,{rally:{x:corner.x+35,y:corner.y}}),corner);
  assert.deepEqual(game.squadFormationTarget(unit,{rally:{x:16,y:300}}),{x:16,y:300});
});

test('formation : diagnostic bloqué suit le vrai rayon d’arrivée de 22, pas celui de repli',()=>{
  const {game,unit}=fresh();unit.offset={x:0,y:0};unit.navigation={cells:null};
  game.squads.groups[0].rally={x:2220,y:2064};unit.x=2190;
  assert.equal(game.getSquadSummary()[0].blocked,1);
  unit.x=2200;assert.equal(game.getSquadSummary()[0].blocked,0);
});

test('accessibilité : réduire les animations fige le cercle général sans supprimer les sections',()=>{
  const {game}=fresh(),radii=[];let sections=0;
  const ctx=new Proxy({arc:(_x,_y,radius)=>radii.push(radius)},{get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>(target[key]=value,true)});
  game.squadUI={drawMarkers:()=>sections++};game.settings.reducedMotion=true;
  for(const elapsed of [0,Math.PI/4,Math.PI/2]){game.elapsed=elapsed;game.drawRally(ctx);}
  assert.deepEqual(radii,[34,34,34]);radii.length=0;game.settings.reducedMotion=false;
  for(const elapsed of [0,Math.PI/4]){game.elapsed=elapsed;game.drawRally(ctx);}
  assert.deepEqual(radii,[34,37]);assert.equal(sections,5);
});
