'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),zlib=require('node:zlib');
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

for(const [seed,failedId,kind] of [[2550352072,471,'ruinedHouse'],[628472550,461,'ruinedHouse'],[967313470,468,'ruinedHouse'],[960071112,438,'burntTree']])test(`202 scenery: seed${seed} starts G10 with all finite objects, real free plots and authoritative Continue`,()=>{
 // The first seed exposed an unsampled border strip; the second exposed
 // fragmented nearest-plot packing (Actions40032832225/job120687773634).
 const {bootDocument133}=require('./helpers/document133.cjs'),env=bootDocument133(),g=env.g;env.ready();
 // Reproduce the CI blank-input branch with its actual generated seed. The
 // native preview owns this seed; the shipped menu still runs every initializer.
 document.getElementById('mapSeed').value='';g.previewMapSeed135=seed;
 assert.doesNotThrow(()=>g.ui.newGameButton.click());
 assert.equal(g.world.seed,seed);assert.equal(g.world.cityGeometry202,1);assert.equal(g.exploration125.layoutRevision,4);assert.equal(g.frontier.position().generation,10);
 assert.equal(g.lastSaveStatus.ok,true);g.campaignIntro132.skip();
 const source=new g.world.constructor(g.world.seed,1),scenery=g.world.nodes.filter(n=>n.sceneryKind),nominal=source.nodes.filter(n=>n.sceneryKind);
 assert.equal(scenery.length,48);assert.equal(new Set(scenery.map(n=>n.id)).size,48);
 assert.deepEqual(scenery.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount,n.maxAmount]),nominal.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount,n.amount]));
 assert.ok(scenery.every(n=>!n.depleted));assert.equal(g.world.nodes.filter(n=>n.__exploration125Loot).length,12);
 const node=scenery.find(n=>n.id===failedId);assert.equal(node.sceneryKind,kind);if(kind==='ruinedHouse')assert.deepEqual(node.body202,{w:320,h:256});
 const envelope=n=>{const b=g.fieldcraft.reserveRect(n),q={x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t};if(!['ruinedHouse','ruinedShop','warehouseShell'].includes(n.sceneryKind))return q;const p=C.CityGeometry202.presentation,o=p.roofOverhangMetres*C.TILE,h=p.storeyHeightMetres*p.projectedHeightUnitsPerMetre;return{x:q.x-o,y:q.y-h-o,w:q.w+o*2,h:q.h+h+o*2};};
 const plan=g.exploration125.plan,clearance=C.CityGeometry202.localParcels.clearanceMetres*C.TILE;
 const ordinary=n=>{const b=g.fieldcraft.reserveRect(n);return{x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t};};
 // Measure the renderer's actual roof/facade, independently of the packer's
 // reservation handling. Build exclusions already add the same one-metre gap.
 const settlements=plan.settlements.flatMap(s=>s.buildings).map(b=>{const q=E.buildingProjection134(b),o=q.roofOverhang;return{id:b.id,x:q.l-o,y:q.roofTop-o,w:b.w+o*2,h:q.b-q.roofTop+o*2};});
 const reservations=plan.buildExclusions.filter(b=>b.kind==='settlement-reserve');assert.equal(settlements.length,6);assert.equal(reservations.length,6);
 for(const actual of settlements){const reserved=reservations.find(b=>b.building===actual.id),expected=padded(actual,clearance);assert.ok(reserved);for(const key of ['x','y','w','h'])assert.ok(Math.abs(reserved[key]-expected[key])<1e-8,'the authored reservation already includes the declared clearance');}
 const fixtures=[...[...g.world.buildings.values()].filter(b=>!b.dead).map(ordinary),...g.expeditions.sites().map(s=>ordinary({...s,renderSize:90})),...g.dayworks.snapshot().sites.map(s=>ordinary({...s,renderSize:50})),...g.world.sites.map(s=>ordinary({...s,renderSize:96})),...plan.buildExclusions.filter(b=>b.kind!=='settlement-reserve'),...settlements,...plan.buildableDistricts202,...E.physicalSolids134(plan)];
 let minimumSettlementGap=Infinity;
 for(const owner of scenery){const box=envelope(owner);assert.equal(within(box,plan.worldSize),true);assert.equal(E.roadFootprint202(plan,box,clearance),false);for(const other of [...fixtures,...scenery.filter(n=>n!==owner).map(envelope)])assert.equal(E.rectsOverlap(other,padded(box,clearance)),false,'each full envelope and its margin fit without moving an obstacle');for(const reserved of reservations)assert.equal(E.rectsOverlap(reserved,box),false,'the existing construction reservation stays clear without adding it twice');for(const actual of settlements)minimumSettlementGap=Math.min(minimumSettlementGap,Math.max(actual.x-box.x-box.w,box.x-actual.x-actual.w,actual.y-box.y-box.h,box.y-actual.y-actual.h));}
 assert.ok(minimumSettlementGap>=clearance,'all six real projected settlements retain at least one metre');
 if(kind==='burntTree'){
  const radius=Math.max(node.radius*1.86,(node.renderSize||0)*.56);
  for(const s of plan.stations){const forecourt=s.facing==='north'?{x:s.x-s.w/2-24,y:s.door.y-128,w:s.w+48,h:128}:s.facing==='south'?{x:s.x-s.w/2-24,y:s.door.y,w:s.w+48,h:128}:s.facing==='west'?{x:s.door.x-128,y:s.y-s.h/2-24,w:128,h:s.h+48}:{x:s.door.x,y:s.y-s.h/2-24,w:128,h:s.h+48};assert.equal(E.circleIntersectsRect(node.x,node.y,radius,forecourt),false,'the corrected tree still clears every station forecourt');}
 }
 for(const actor of [g.player,...g.units])assert.equal(g.friendlyPositionClear(actor,actor.x,actor.y),true);
 const access=g.fieldcraft.service(g.player,node);assert.ok(access,'the recovered finite object has a native standing point');assert.equal(g.workerCanWorkAt({...g.player,...access},node,node.radius+12),true);
 const initial=rows(g);assert.equal(node.harvest(11),11);assert.equal(node.amount,node.maxAmount-11);
 const exhausted=scenery.find(n=>n!==node);exhausted.harvest(exhausted.amount);
 const before=rows(g),runId=g.runId,rng=g.random.state;assert.equal(g.save(false),true);g.returnToMenu();
 assert.equal(g.load(),true);g.campaignIntro132.skip();assert.equal(g.runId,runId);assert.equal(g.random.state,rng);assert.deepEqual(rows(g),before);
 g.exploration125.syncPlan();assert.deepEqual(rows(g),before,'later sync cannot relocate or refill the saved recovered plot');
 g.startNew('standard',String(seed),'classic','balanced',true);g.campaignIntro132.skip();
 assert.deepEqual(rows(g),initial,'repeating the same seed reproduces every node coordinate, identity and stock');
});

test('202 scenery: two stable witnesses retain every byte and corrected seed42 retains its entire plan',()=>{
 const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{g}=bootDocument134();
 // Captured from untouched a137e2f before this correction, using these same
 // native starts. Seed42 changed only tree471: the old cleanup moved it into
 // a palisade. The full historical E42 save remains separately authoritative.
 const witnesses=[
  [17117,'e61c465aa3e3029c815fce42c73bd38f242241e7863e3e32d70b748aa73c45d9','be0dcd3b90f3798d8c5fa4b1008fb1cc3788162ffdde99c801480ebae2c770c2'],
  [84329,'505ce4549295da26a898cc71f294127d9d7defa40ce1238ccfe5bc3e246e4a74','eed69ee35da0e2603f1095e63fa35a87e70ba7ba6f448a32b218dc538e15dd2d'],
  [42,'34685aa5535c114890dcb7267f13a510ba33a86b75168d903331036d49a05160','120265808cd21b6e4e19719b8ecafd36910ccb3d50d373b66000df12e56c03ec']
 ];
 for(const [seed,nodes,plan]of witnesses){g.startNew('standard',String(seed),'classic','balanced',true);g.campaignIntro132.skip();assert.equal(hash(rows(g)),nodes,seed+'/all node positions and quantities');assert.equal(hash(g.exploration125.plan),plan,seed+'/complete immutable plan');}
});

test('202 scenery: the real E42 save keeps every saved coordinate, quantity and RNG through Continue',()=>{
 // Exact native save captured on270b0f09317ffd8da19273a71ea518effa389f58,
 // before the clearance correction; deterministic gzip SHA256ac3fb1e3be9b3b8789f2d55dd2028146c1b5dd742d309a5a7434d3bb9ab39161.
 const compressed=fs.readFileSync(require.resolve('./fixtures/city42-before-clearance204.json.gz'));
 assert.equal(crypto.createHash('sha256').update(compressed).digest('hex'),'ac3fb1e3be9b3b8789f2d55dd2028146c1b5dd742d309a5a7434d3bb9ab39161');
 const historical=JSON.parse(zlib.gunzipSync(compressed)),{bootDocument134}=require('../scripts/qa-startup134.cjs'),{g}=bootDocument134();
 assert.equal(g.restoreSave(historical),true);g.campaignIntro132.skip();
 const restoredById=new Map(g.world.nodes.map(n=>[n.id,n]));
 for(const [id,x,y] of historical.fieldcraft.nodes){const restored=restoredById.get(id);assert.ok(restored,'every saved position retains its identity');assert.deepEqual([restored.x,restored.y],[x,y],'the first restore must not repack any historical position');}
 for(const [id,amount] of historical.nodes){const restored=restoredById.get(id);assert.ok(restored,'every saved stock retains its identity');assert.equal(restored.amount,amount,'the first restore must not refill or consume a historical stock');}
 const before=rows(g),tree=g.world.nodes.find(n=>n.id===471);assert.deepEqual([tree.x,tree.y],[3053.33,2953.55]);assert.equal(g.random.state,historical.randomState);
 g.exploration125.syncPlan();assert.deepEqual(rows(g),before);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);g.campaignIntro132.skip();
 assert.deepEqual(rows(g),before);assert.equal(g.random.state,historical.randomState);
 g.startNew('standard','42','classic','balanced',true);g.campaignIntro132.skip();
 const fresh=rows(g);assert.deepEqual(fresh.filter((row,index)=>JSON.stringify(row)!==JSON.stringify(before[index])).map(row=>row[0]),[471]);
 for(let i=0;i<fresh.length;i++)assert.deepEqual(fresh[i].filter((_,k)=>k!==4&&k!==5),before[i].filter((_,k)=>k!==4&&k!==5),'the repair changes no identity, stock or physical size');
 const moved=g.world.nodes.find(n=>n.id===471),r=g.fieldcraft.reserveRect(moved),box={x:r.l,y:r.t,w:r.r-r.l,h:r.b-r.t};
 for(const solid of E.physicalSolids134(g.exploration125.plan))assert.equal(E.rectsOverlap(solid,padded(box,C.CityGeometry202.localParcels.clearanceMetres*C.TILE)),false,'a fresh seed42 tree stays clear of the real palisades');
});
