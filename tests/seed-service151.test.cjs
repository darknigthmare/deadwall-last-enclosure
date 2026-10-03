'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{boot131}=require('./helpers/expansions131.cjs');

for(const [seed,id,type]of [[1,419,'wood'],[4294967295,200,'scrap']])test(`151 : réserve initiale ${seed}/${id} accessible sans déplacer le gisement`,()=>{
 const {g}=boot131({seed:String(seed),generation:7}),node=g.world.nodes.find(n=>n.id===id);
 assert.equal(node.type,type);assert.ok(!node.depleted&&Math.hypot(node.x-2048,node.y-2048)<850);
 const geometry=g.world.nodes.map(n=>[n.id,n.x,n.y]),point=g.fieldcraft.service(g.player,node);
 assert.ok(point,'un point libre et à portée existe entre les anciennes propositions et la cellule suivante');
 const randomState=g.random.state;g.render();g.renderMinimap();assert.equal(g.random.state,randomState);
 assert.ok(g.friendlyPositionClear(g.player,point.x,point.y));
 const path=C.findFriendlyPath({x:Math.floor(g.player.x/32),y:Math.floor(g.player.y/32)},{x:Math.floor(point.x/32),y:Math.floor(point.y/32)},(x,y)=>!g.friendlyPositionClear(g.player,x*32+16,y*32+16));
 assert.notEqual(path,null);
 Object.assign(g.player,point);g.paused=false;g.activeOverlay=null;g.input.keys.add('KeyE');
 const before=node.amount,carried=g.player.carry[type];g.updateInteraction(.1);
 assert.ok(node.amount<before,'la collecte manuelle atteint la réserve réelle');
 assert.ok(Math.abs(before-node.amount-(g.player.carry[type]-carried))<1e-8);
 assert.deepEqual(g.world.nodes.map(n=>[n.id,n.x,n.y]),geometry);
 const save=g.serialize();g.restoreSave(save);
 assert.deepEqual(g.world.nodes.map(n=>[n.id,n.x,n.y]),geometry);assert.equal(g.world.nodes.find(n=>n.id===id).amount,node.amount);
 g.startNew('standard',String((seed+1)>>>0));g.startNew('standard',String(seed));
 assert.deepEqual(g.world.nodes.map(n=>[n.id,n.x,n.y]),geometry);
});

test('151 : un ouvrier rejoint et récolte le bois dont les anciennes propositions revenaient dans le tronc',()=>{
 const {g}=boot131({seed:'1',generation:7}),worker=g.units.find(u=>u.kind==='worker'),node=g.world.nodes.find(n=>n.id===49),point=g.fieldcraft.service(worker,node);
 assert.ok(point);g.navigationBudget=6;g.moveUnitToward(worker,node,.1);
 assert.ok(worker.navigation&&Array.isArray(worker.navigation.cells),'le contrôleur conserve un trajet physique');
 Object.assign(worker,{...point,state:'gather',targetNode:node.id,think:100,carry:0,carryType:null});
 assert.ok(g.workerCanWorkAt(worker,node,node.radius+12));
 const before=node.amount;g.updateUnits(.1);
 assert.ok(worker.carry>0);assert.ok(Math.abs(before-node.amount-worker.carry)<1e-8);
 assert.equal(worker.carryType,node.type);assert.ok(g.friendlyPositionClear(worker,worker.x,worker.y));
});

test('151 : une réserve sans aucun accès libre reste refusée et inchangée',()=>{
 const {g}=boot131({seed:'1',generation:7}),node=g.world.nodes.find(n=>n.id===419),before=g.serialize(),clear=g.friendlyPositionClear;
 try{g.friendlyPositionClear=()=>false;assert.equal(g.fieldcraft.service(g.player,node),null);}finally{g.friendlyPositionClear=clear;}
 assert.deepEqual(g.serialize().nodes,before.nodes);assert.deepEqual(g.resources,before.resources);assert.deepEqual(g.player.carry,before.player.carry);
});
