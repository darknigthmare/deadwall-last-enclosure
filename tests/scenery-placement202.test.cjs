'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const E=require('../src/exploration-125.js'),C=require('../src/core.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rows=g=>g.world.nodes.map(n=>[n.id,n.type,n.sceneryKind||null,n.siteId||null,n.x,n.y,n.amount,n.maxAmount,n.metric202||0,n.body202||null]);
const translated=(box,x,y)=>({...box,x:box.x+x,y:box.y+y});
const padded=(box,margin)=>({x:box.x-margin,y:box.y-margin,w:box.w+margin*2,h:box.h+margin*2});
const within=(box,size)=>box.x>=38&&box.y>=38&&box.x+box.w<=size-38&&box.y+box.h<=size-38;

test('202 scenery: a lawful strip missed by sixteen-unit samples retains the full asymmetric roof and clearance',()=>{
 const footprint={x:-164.8,y:-180.8,w:329.6,h:313.6},size=4096,margin=32;
 // The full ruin can stand only at y in [218.8,222.2]. Both old sample
 // pitches miss this strip; no footprint, world border or obstacle is relaxed.
 const blockers=[{x:0,y:387,w:size,h:size-387}],before=JSON.stringify({footprint,blockers});
 const accepts=(x,y)=>{const box=translated(footprint,x,y);return within(box,size)&&blockers.every(b=>!E.rectsOverlap(b,padded(box,margin)));};
 for(const step of [16,8])for(let y=48;y<size-48;y+=step)assert.equal(accepts(500,y),false,'the original grid cannot sample the narrow strip');
 const point=E.findMetricSceneryBoundaryPlot202(footprint,size,blockers,margin,accepts);
 assert.ok(point);assert.equal(accepts(point.x,point.y),true);assert.ok(point.y>218.8&&point.y<222.2);
 assert.deepEqual(E.findMetricSceneryBoundaryPlot202(footprint,size,[...blockers].reverse(),margin,accepts),point);
 assert.equal(JSON.stringify({footprint,blockers}),before,'search does not move an owner or resize its envelope');
});

test('202 scenery: a fully occupied parcel stays unavailable and the final native veto is never bypassed',()=>{
 const footprint={x:-160,y:-128,w:320,h:256},size=4096,blockers=[{x:0,y:0,w:size,h:size}];let calls=0;
 const accepts=(x,y)=>{calls++;const box=translated(footprint,x,y);return within(box,size)&&!E.rectsOverlap(blockers[0],padded(box,32));};
 assert.equal(E.findMetricSceneryBoundaryPlot202(footprint,size,blockers,32,accepts),null);
 assert.ok(calls>0&&calls<=(2+blockers.length*2)**2,'the contact set bounds the search');
 assert.equal(E.findMetricSceneryBoundaryPlot202(footprint,size,[],32,()=>false),null,'a native rejection is authoritative even without an AABB blocker');
 assert.equal(E.findMetricSceneryBoundaryPlot202({...footprint,w:5000},size,[],32,()=>{throw Error('oversized envelopes have no candidates');}),null);
});

test('202 scenery: CI seed2550352072 starts G10 with all finite objects, a real free plot and authoritative Continue',()=>{
 // Actions run39789163177/job119860247597, a137e2f: the unchanged shipped
 // start failed on ruinedHouse471, despite a valid full-footprint border strip.
 const {bootDocument133}=require('./helpers/document133.cjs'),env=bootDocument133(),g=env.g;env.ready();
 // Reproduce the CI blank-input branch with its actual generated seed. The
 // native preview owns this seed; the shipped menu still runs every initializer.
 document.getElementById('mapSeed').value='';g.previewMapSeed135=2550352072;
 assert.doesNotThrow(()=>g.ui.newGameButton.click());
 assert.equal(g.world.seed,2550352072);assert.equal(g.world.cityGeometry202,1);assert.equal(g.exploration125.layoutRevision,4);assert.equal(g.frontier.position().generation,10);
 assert.equal(g.lastSaveStatus.ok,true);g.campaignIntro132.skip();
 const source=new g.world.constructor(g.world.seed,1),scenery=g.world.nodes.filter(n=>n.sceneryKind),nominal=source.nodes.filter(n=>n.sceneryKind);
 assert.equal(scenery.length,48);assert.equal(new Set(scenery.map(n=>n.id)).size,48);
 assert.deepEqual(scenery.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount,n.maxAmount]),nominal.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount,n.amount]));
 assert.ok(scenery.every(n=>!n.depleted));assert.equal(g.world.nodes.filter(n=>n.__exploration125Loot).length,12);
 const node=scenery.find(n=>n.id===471);assert.equal(node.sceneryKind,'ruinedHouse');assert.deepEqual(node.body202,{w:320,h:256});
 const envelope=n=>{const b=g.fieldcraft.reserveRect(n),q={x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t};if(!['ruinedHouse','ruinedShop','warehouseShell'].includes(n.sceneryKind))return q;const p=C.CityGeometry202.presentation,o=p.roofOverhangMetres*C.TILE,h=p.storeyHeightMetres*p.projectedHeightUnitsPerMetre;return{x:q.x-o,y:q.y-h-o,w:q.w+o*2,h:q.h+h+o*2};};
 const plan=g.exploration125.plan,box=envelope(node),clearance=C.CityGeometry202.localParcels.clearanceMetres*C.TILE;
 assert.equal(within(box,plan.worldSize),true);assert.equal(E.roadFootprint202(plan,box,clearance),false);
 const ordinary=n=>{const b=g.fieldcraft.reserveRect(n);return{x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t};};
 const fixtures=[...[...g.world.buildings.values()].filter(b=>!b.dead).map(ordinary),...g.expeditions.sites().map(s=>ordinary({...s,renderSize:90})),...g.dayworks.snapshot().sites.map(s=>ordinary({...s,renderSize:50})),...g.world.sites.map(s=>ordinary({...s,renderSize:96})),...plan.buildExclusions,...plan.buildableDistricts202,...E.physicalSolids134(plan)];
 for(const other of [...fixtures,...scenery.filter(n=>n!==node).map(envelope)])assert.equal(E.rectsOverlap(other,padded(box,clearance)),false,'the real ruin and its margin fit without moving an obstacle');
 for(const actor of [g.player,...g.units])assert.equal(g.friendlyPositionClear(actor,actor.x,actor.y),true);
 const access=g.fieldcraft.service(g.player,node);assert.ok(access,'the recovered finite object has a native standing point');assert.equal(g.workerCanWorkAt({...g.player,...access},node,node.radius+12),true);
 const initial=rows(g);assert.equal(node.harvest(11),11);assert.equal(node.amount,34);
 const exhausted=scenery.find(n=>n!==node);exhausted.harvest(exhausted.amount);
 const before=rows(g),runId=g.runId,rng=g.random.state;assert.equal(g.save(false),true);g.returnToMenu();
 assert.equal(g.load(),true);g.campaignIntro132.skip();assert.equal(g.runId,runId);assert.equal(g.random.state,rng);assert.deepEqual(rows(g),before);
 g.exploration125.syncPlan();assert.deepEqual(rows(g),before,'later sync cannot relocate or refill the saved recovered plot');
 g.startNew('standard','2550352072','classic','balanced',true);g.campaignIntro132.skip();
 assert.deepEqual(rows(g),initial,'repeating the same seed reproduces every node coordinate, identity and stock');
});

test('202 scenery: the three successful a137e2f witness maps retain every node and plan byte',()=>{
 const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{g}=bootDocument134();
 // Captured from untouched a137e2f before this correction, using these same
 // native starts. The last-resort contact search must not affect successful maps.
 const witnesses=[
  [17117,'e61c465aa3e3029c815fce42c73bd38f242241e7863e3e32d70b748aa73c45d9','be0dcd3b90f3798d8c5fa4b1008fb1cc3788162ffdde99c801480ebae2c770c2'],
  [84329,'505ce4549295da26a898cc71f294127d9d7defa40ce1238ccfe5bc3e246e4a74','eed69ee35da0e2603f1095e63fa35a87e70ba7ba6f448a32b218dc538e15dd2d'],
  [42,'ccb81727ea026a834fbb46014392be4cab1a411bddeef2941c916290a06073a7','120265808cd21b6e4e19719b8ecafd36910ccb3d50d373b66000df12e56c03ec']
 ];
 for(const [seed,nodes,plan]of witnesses){g.startNew('standard',String(seed),'classic','balanced',true);g.campaignIntro132.skip();assert.equal(hash(rows(g)),nodes,seed+'/all node positions and quantities');assert.equal(hash(g.exploration125.plan),plan,seed+'/complete immutable plan');}
});
