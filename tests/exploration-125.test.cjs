'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const X = require('../src/exploration-125.js');

function assertPacking(packed, expectedTotals) {
  const cells = new Set(), totals = {};
  for (const item of packed.items) {
    assert.ok(item.x >= 0 && item.y >= 0 && item.x + item.w <= packed.cols && item.y + item.h <= packed.rows, item.key);
    totals[item.key] = (totals[item.key] || 0) + item.quantity;
    for (let y=item.y;y<item.y+item.h;y++) for(let x=item.x;x<item.x+item.w;x++) {
      const key=`${x}:${y}`; assert.ok(!cells.has(key), `overlap ${key}`); cells.add(key);
    }
  }
  for (const [key,value] of Object.entries(expectedTotals)) assert.equal(Math.round((totals[key]||0)*1000),Math.round(value*1000),key);
}

test('version 1.25.3 and codex cover the complete requested world pass', () => {
  assert.equal(X.VERSION, '1.25.3');
  const ids = new Set(X.WORLD_CODEX.map(entry => entry.id));
  for (const id of ['frontieres-d17','intersections','stations-service','backyards','palisades-ouvertures','epaves-coffres','props-routiers','profondeur','villages-habitations','hordes-sauvages','postures-surfaces','cartographie-inventaire']) assert.ok(ids.has(id), id);
});

test('feature plan is deterministic and substantially populated', () => {
  const a = X.createFeaturePlan(17117, 4096), b = X.createFeaturePlan(17117, 4096);
  assert.deepEqual(a, b);
  assert.equal(a.intersections.length, 9);
  assert.equal(a.intersections.filter(j=>j.kind==='angled').length, 2);
  assert.deepEqual(new Set(a.roads.map(r=>r.lanes)), new Set([2,3,4]));
  assert.ok(a.roads.some(r=>r.axis==='line'));
  assert.equal(a.stations.length, 4);
  assert.equal(a.stationLoot.length, 12);
  assert.equal(a.backyards.length, 8);
  assert.equal(a.settlements.length, 3);
  assert.equal(a.settlements.reduce((n,s)=>n+s.buildings.length,0), 21);
  assert.ok(a.wrecks.length >= 10);
  assert.ok(a.roadEvents.length >= 8);
  assert.ok(a.roadProps.length >= 32);
  assert.ok(a.solids.length > 100);
});

test('all four D-17 faces are traversable across the full span, not only at roads', () => {
  const size = 4096, r = 12, spans = [173, 947, 1733, 2879, 3911];
  for (const y of spans) {
    const west = X.edgeTransition({x:30,y},-40,0,size,r); assert.equal(west?.edge,'west'); assert.equal(west?.offsetX,-1); assert.equal(west?.y,y);
    const east = X.edgeTransition({x:size-30,y},40,0,size,r); assert.equal(east?.edge,'east'); assert.equal(east?.offsetX,1); assert.equal(east?.y,y);
  }
  for (const x of spans) {
    const north = X.edgeTransition({x,y:30},0,-40,size,r); assert.equal(north?.edge,'north'); assert.equal(north?.offsetY,-1); assert.equal(north?.x,x);
    const south = X.edgeTransition({x,y:size-30},0,40,size,r); assert.equal(south?.edge,'south'); assert.equal(south?.offsetY,1); assert.equal(south?.x,x);
  }
});

test('station walls preserve a genuine entrance gap and provide persistent loot specs', () => {
  const plan = X.createFeaturePlan(77, 4096), ids=new Set();
  for (const station of plan.stations) {
    const door = station.door;
    const blocked = station.solids.some(box => X.circleIntersectsRect(door.x, door.y, 10, box));
    assert.equal(blocked, false, station.id);
    const loot=plan.stationLoot.filter(node=>node.stationId===station.id);assert.equal(loot.length,3);
    assert.deepEqual(new Set(loot.map(node=>node.type)),new Set(['fuel','food','medicine']));
    for(const node of loot){assert.ok(!ids.has(node.id));ids.add(node.id);assert.ok(node.amount>0);}
  }
});

test('station footprints remain clear of the road surface', () => {
  for(const seed of [77,17117,991,2001]){
    const plan=X.createFeaturePlan(seed,4096);
    for(const station of plan.stations)for(let iy=0;iy<=8;iy++)for(let ix=0;ix<=8;ix++){
      const x=station.x-station.w/2+station.w*ix/8,y=station.y-station.h/2+station.h*iy/8;
      assert.ok(plan.roads.every(road=>!X.roadContains(road,x,y)),`${station.id} ${seed} ${ix}:${iy}`);
    }
  }
});

test('backyard palisades preserve a genuine opening and every yard is attached to a house', () => {
  const plan = X.createFeaturePlan(88, 4096);
  for (const yard of plan.backyards) {
    assert.ok(yard.opening >= 58);
    const blocked = yard.solids.filter(box=>box.kind==='palisade').some(box => X.circleIntersectsRect(yard.gate.x, yard.gate.y - 2, 9, box));
    assert.equal(blocked, false, yard.id);
    assert.ok(yard.house && yard.house.w >= 120 && yard.house.h >= 70, yard.id);
    assert.ok(yard.house.y < yard.y-yard.h/2, 'house must sit on the rear edge of yard');
    assert.ok(yard.props.some(prop=>prop.kind==='mailbox'));
  }
});

test('road wrecks do not occupy intersection cores', () => {
  const plan = X.createFeaturePlan(17117, 4096);
  for (const wreck of plan.wrecks) for (const j of plan.intersections) assert.ok(Math.hypot(wreck.x-j.x,wreck.y-j.y) >= 150);
});

test('road design includes 2/3/4 lanes and diagonal road containment works', () => {
  const plan=X.createFeaturePlan(17117,4096), diagonal=plan.roads.find(r=>r.axis==='line');
  assert.ok(diagonal);
  const mx=(diagonal.x1+diagonal.x2)/2,my=(diagonal.y1+diagonal.y2)/2;
  assert.equal(X.roadContains(diagonal,mx,my),true);
  assert.equal(X.roadContains(diagonal,mx+1000,my+1000),false);
});

test('road event families are grouped and varied rather than random single props', () => {
  const plan=X.createFeaturePlan(991,4096), families=new Set(plan.roadEvents.map(event=>event.kind));
  assert.ok(families.size>=5);
  for(const event of plan.roadEvents){const props=plan.roadProps.filter(prop=>prop.eventId===event.id);assert.ok(props.length>=4,event.id);assert.ok(props.every(prop=>prop.family===event.kind));}
  const propKinds=new Set(plan.roadProps.map(prop=>prop.kind));
  for(const kind of ['cone','barrier','shoppingCart','pallet','toolbox','crate','tarp','debris'])assert.ok(propKinds.has(kind),kind);
});

test('inventory packing splits quantities into physical stacks, stays in bounds and never overlaps', () => {
  const carry={wood:12,scrap:8,stone:5,food:4,fuel:3,ammo:22,medicine:2};
  const packed = X.packInventory(carry);
  assert.equal(packed.overflow.length,0);
  assertPacking(packed,carry);
  assert.ok(packed.items.filter(item=>item.key==='wood').length>=2);
  assert.ok(packed.items.filter(item=>item.key==='ammo').length>=2);
});

test('realistic max carry distributions fit in the 8x5 jigsaw grid',()=>{
  const cases=[{wood:36},{ammo:36},{wood:6,scrap:6,stone:6,food:6,fuel:6,ammo:3,medicine:3},{wood:8,scrap:5,stone:5,food:5,fuel:5,ammo:5,medicine:3}];
  for(const carry of cases){const packed=X.packInventory(carry);assert.equal(packed.overflow.length,0,JSON.stringify(carry));assertPacking(packed,carry);}
});

test('looted vehicle scenery kinds remain explicitly recognized', () => {
  for (const sceneryKind of ['ambulance','bus','utilityTruck','tanker']) assert.equal(X.isVehicleNode({sceneryKind}), true);
  assert.equal(X.isVehicleNode({sceneryKind:'rubble'}), false);
});

test('surface and posture rules produce explicit mobility differences',()=>{
  const plan=X.createFeaturePlan(17,4096),road=plan.roads.find(r=>r.axis==='h'),yard=plan.backyards[0];
  assert.equal(X.surfaceAt(plan,plan.worldSize/2,road.y,0).id,'asphalt');
  assert.equal(X.surfaceAt(plan,yard.x,yard.y,0).id,'yard');
  assert.equal(X.surfaceAt(plan,80,80,.9).id,'mud');
  assert.ok(X.postureMultiplier('stand')>X.postureMultiplier('crouch'));
  assert.ok(X.postureMultiplier('crouch')>X.postureMultiplier('prone'));
});

test('settlements expose varied building types and stay away from D-17 core',()=>{
  const plan=X.createFeaturePlan(321,4096),c=plan.worldSize/2,types=new Set();
  for(const settlement of plan.settlements){assert.ok(Math.hypot(settlement.x-c,settlement.y-c)>700);for(const building of settlement.buildings)types.add(building.type);}
  assert.ok(types.size>=5);
});

test('settlements, stations and house-backed yards remain coherent across 250 seeds',()=>{
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(let seed=1;seed<=250;seed++){
    const plan=X.createFeaturePlan(seed*3571,4096);
    for(const yard of plan.backyards){
      const reserve={x:yard.x-yard.w/2-10,y:yard.y-yard.h/2-130,w:yard.w+20,h:yard.h+140};
      assert.ok(reserve.x>=0&&reserve.y>=0&&reserve.x+reserve.w<=4096&&reserve.y+reserve.h<=4096,`yard bounds ${seed}`);
      for(const road of plan.roads)assert.equal(X.roadContains(road,yard.house.x,yard.house.y,Math.max(yard.house.w,yard.house.h)/2*.6),false,`house on road ${seed}`);
      for(const station of plan.stations)assert.equal(overlap(reserve,{x:station.x-station.w/2,y:station.y-station.h/2,w:station.w,h:station.h}),false,`yard/station ${seed}`);
      for(const settlement of plan.settlements)for(const building of settlement.buildings)assert.equal(overlap(reserve,{x:building.x-building.w/2,y:building.y-building.h/2,w:building.w,h:building.h}),false,`yard/settlement ${seed}`);
    }
    for(const settlement of plan.settlements)for(const building of settlement.buildings){
      for(const road of plan.roads)assert.equal(X.roadContains(road,building.x,building.y,Math.max(building.w,building.h)/2*.65),false,`building on road ${seed}`);
      const bb={x:building.x-building.w/2,y:building.y-building.h/2,w:building.w,h:building.h};
      for(const station of plan.stations)assert.equal(overlap(bb,{x:station.x-station.w/2,y:station.y-station.h/2,w:station.w,h:station.h}),false,`settlement/station ${seed}`);
    }
  }
});

test('build exclusions reserve complete POI footprints instead of walls only',()=>{
  const plan=X.createFeaturePlan(17,4096);
  assert.ok(plan.buildExclusions.some(box=>box.kind==='station-reserve'));
  assert.ok(plan.buildExclusions.some(box=>box.kind==='yard-reserve'));
  assert.ok(plan.buildExclusions.some(box=>box.kind==='settlement-reserve'));
});


test('exploration save extension preserves generation, regional coordinates, posture and wild-horde clock safely',()=>{
  const data=X.normalizeExplorationSave({generation:4,regionOffset:{x:12.9,y:-4.2},posture:'prone',wildNext:321.5,wildHordes:7});
  assert.deepEqual(data,{generation:4,regionOffset:{x:12,y:-4},posture:'prone',wildNext:321.5,wildHordes:7});
  assert.deepEqual(X.normalizeExplorationSave({generation:99,regionOffset:{x:Infinity},posture:'flying',wildNext:-2}),{generation:3,regionOffset:{x:0,y:0},posture:'stand',wildNext:0,wildHordes:0});
});

test('POI entrances stay clear of generated wrecks across many seeds', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const plan = X.createFeaturePlan(seed * 7919, 4096);
    for (const wreck of plan.wrecks) {
      for (const station of plan.stations) assert.ok(!(Math.abs(wreck.x-station.x) < station.w/2+85 && Math.abs(wreck.y-station.y) < station.h/2+85), `station conflict ${seed}`);
      for (const yard of plan.backyards) assert.ok(!(Math.abs(wreck.x-yard.x) < yard.w/2+45 && Math.abs(wreck.y-yard.y) < yard.h/2+45), `yard conflict ${seed}`);
    }
  }
});

test('angled intersections are physically crossed by a diagonal road, not only styled as angled',()=>{
  const plan=X.createFeaturePlan(17117,4096),angled=plan.intersections.filter(j=>j.kind==='angled'),diagonals=plan.roads.filter(r=>r.axis==='line');
  assert.equal(angled.length,2);
  for(const junction of angled)assert.ok(diagonals.some(road=>X.roadContains(road,junction.x,junction.y)),junction.id);
});

test('each settlement local street is connected back to the main road hierarchy',()=>{
  const plan=X.createFeaturePlan(17117,4096);
  for(const settlement of plan.settlements){
    assert.ok(settlement.connector,settlement.id);
    const endpoint={x:settlement.connector.x2,y:settlement.connector.y2};
    assert.ok(plan.roads.some(road=>X.roadContains(road,endpoint.x,endpoint.y,2)),`${settlement.id} connector`);
    const localMid={x:(settlement.street.x1+settlement.street.x2)/2,y:(settlement.street.y1+settlement.street.y2)/2};
    assert.equal(X.surfaceAt(plan,localMid.x,localMid.y,0).id,'street');
  }
});

test('station loot remains inside usable shop space and clear of walls/furniture across 100 seeds',()=>{
  for(let seed=1;seed<=100;seed++){
    const plan=X.createFeaturePlan(seed*12347,4096);
    for(const loot of plan.stationLoot){
      const station=plan.stations.find(st=>st.id===loot.stationId);assert.ok(station);
      assert.ok(Math.abs(loot.x-station.x)<station.w/2-8&&Math.abs(loot.y-station.y)<station.h/2-8,`loot outside ${seed}`);
      for(const box of plan.solids.filter(box=>['station-wall','station-furniture'].includes(box.kind)))assert.equal(X.circleIntersectsRect(loot.x,loot.y,loot.radius,box),false,`loot blocked ${seed}/${loot.id}`);
    }
  }
});

test('restored exploration state preserves regional coordinates and never schedules an immediate wild horde by default',()=>{
  const game={runId:'run:test:g4',player:{posture:'stand'},exploration125:{}};
  X.applyExplorationState(game,{generation:4,regionOffset:{x:7,y:-9},posture:'crouch',wildNext:145,wildHordes:3});
  assert.equal(game.exploration125.generation,4);assert.deepEqual(game.d17RegionOffset,{x:7,y:-9});assert.equal(game.player.posture,'crouch');assert.equal(game.exploration125.wildNext,145);assert.equal(game.exploration125.wildHordes,3);
  for(const wave of [1,5,20,100]){const delay=X.wildHordeDelay(wave,0);assert.ok(delay>=28,`wave ${wave}`);}
  assert.ok(X.wildHordeDelay(1,11)>0);
});

test('1000-seed world fuzz keeps roads, POIs, settlements, yards and wrecks mutually coherent',()=>{
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(let i=1;i<=1000;i++){
    const seed=(i*2654435761)>>>0,plan=X.createFeaturePlan(seed,4096),diagonals=plan.roads.filter(r=>r.axis==='line');
    for(const j of plan.intersections.filter(j=>j.kind==='angled'))assert.ok(diagonals.some(r=>X.roadContains(r,j.x,j.y)),`angled ${seed}`);
    for(const settlement of plan.settlements){
      assert.ok(plan.roads.some(r=>X.roadContains(r,settlement.connector.x2,settlement.connector.y2,2)),`connector ${seed}`);
      for(const building of settlement.buildings){
        assert.equal(plan.roads.some(r=>X.roadContains(r,building.x,building.y,Math.max(building.w,building.h)/2*.65)),false,`building/road ${seed}`);
        const bb={x:building.x-building.w/2,y:building.y-building.h/2,w:building.w,h:building.h};
        for(const station of plan.stations)assert.equal(overlap(bb,{x:station.x-station.w/2,y:station.y-station.h/2,w:station.w,h:station.h}),false,`building/station ${seed}`);
      }
    }
    for(const yard of plan.backyards)for(const road of plan.roads)assert.equal(X.roadContains(road,yard.house.x,yard.house.y,Math.max(yard.house.w,yard.house.h)/2*.6),false,`yard/road ${seed}`);
    for(const wreck of plan.wrecks){
      for(const station of plan.stations)assert.equal(Math.abs(wreck.x-station.x)<station.w/2+85&&Math.abs(wreck.y-station.y)<station.h/2+85,false,`wreck/station ${seed}`);
      for(const yard of plan.backyards)assert.equal(Math.abs(wreck.x-yard.x)<yard.w/2+45&&Math.abs(wreck.y-yard.y)<yard.h/2+45,false,`wreck/yard ${seed}`);
    }
  }
});

test('20000 deterministic carry distributions within capacity fit the jigsaw bag exactly',()=>{
  const keys=['wood','scrap','stone','food','fuel','ammo','medicine'];let state=0xD17C0DE5;
  const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
  for(let i=0;i<20000;i++){
    let left=36,carry={};for(const key of keys){const value=Math.floor(rnd()*(left+1));carry[key]=value;left-=value;}
    const packed=X.packInventory(carry);assert.equal(packed.overflow.length,0,JSON.stringify(carry));assertPacking(packed,carry);
  }
});

test('station loot has a walkable route from the real doorway across 300 seeds',()=>{
  function reachable(plan,station,target){
    const numeric=Number(station.id.split('-')[1]);
    const solids=plan.solids.filter(box=>['station-wall','station-furniture'].includes(box.kind)&&(box.station===numeric||box.station===station.id));
    const step=12,radius=9,left=station.x-station.w/2+radius,top=station.y-station.h/2+radius,right=station.x+station.w/2-radius,bottom=station.y+station.h/2-radius;
    const clear=(x,y)=>x>=left&&x<=right&&y>=top&&y<=bottom&&!solids.some(box=>X.circleIntersectsRect(x,y,radius,box));
    let start={x:station.door.x,y:station.door.y};if(station.facing==='north')start.y+=22;else if(station.facing==='south')start.y-=22;else if(station.facing==='west')start.x+=22;else start.x-=22;
    const snap=value=>Math.round(value/step)*step;start={x:snap(start.x),y:snap(start.y)};
    const queue=[start],seen=new Set([`${start.x}:${start.y}`]);let head=0;
    while(head<queue.length){const point=queue[head++];if(Math.hypot(point.x-target.x,point.y-target.y)<=22)return true;for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const x=point.x+dx,y=point.y+dy,key=`${x}:${y}`;if(!seen.has(key)&&clear(x,y)){seen.add(key);queue.push({x,y});}}}
    return false;
  }
  for(let seed=1;seed<=300;seed++){const plan=X.createFeaturePlan(seed*9973,4096);for(const station of plan.stations)for(const loot of plan.stationLoot.filter(node=>node.stationId===station.id))assert.equal(reachable(plan,station,loot),true,`${seed}/${station.id}/${loot.type}`);}
});


test('runtime building footprint uses BUILDINGS.size and respects rotation',()=>{
  assert.deepEqual(X.buildingFootprint({size:[3,2]},5,7,0,32),{x:160,y:224,w:96,h:64});
  assert.deepEqual(X.buildingFootprint({size:[3,2]},5,7,1,32),{x:160,y:224,w:64,h:96});
  assert.throws(()=>X.buildingFootprint({size:[0,2]},0,0,0,32),/Gabarit/);
});

test('runtime placement wrapper really blocks POI footprints using def.size',()=>{
  const world={
    placement(){return {valid:true,reason:''};},
    solidForFriendly(){return null;},
    movementCost(){return 10;}
  };
  const game={state:'playing',runId:'run:placement:g4',world};
  const plan={solids:[],buildExclusions:[{x:64,y:64,w:96,h:96,kind:'test'}]};
  X.patchWorldPlacement(game,plan);
  assert.deepEqual(world.placement({size:[2,2]},2,2,0),{valid:false,reason:'Décor, habitation ou accès à préserver'});
  assert.deepEqual(world.placement({size:[2,2]},10,10,0),{valid:true,reason:''});
  const rotatedWorld={placement(){return {valid:true,reason:''};},solidForFriendly(){return null;},movementCost(){return 10;}};
  const rotatedGame={state:'playing',runId:'run:rotation:g4',world:rotatedWorld};
  const rotatedPlan={solids:[],buildExclusions:[{x:64,y:96,w:32,h:32,kind:'test'}]};
  X.patchWorldPlacement(rotatedGame,rotatedPlan);
  assert.equal(rotatedWorld.placement({size:[3,1]},2,2,0).valid,true,'unrotated 3x1 stays above blocker');
  assert.equal(rotatedWorld.placement({size:[3,1]},2,2,1).valid,false,'rotated 1x3 reaches blocker');
});

test('spatial collision index has no false negatives against brute force',()=>{
  for(let seed=1;seed<=80;seed++){
    const plan=X.createFeaturePlan(seed*811,4096), index=X.createSpatialIndex(plan.solids,192);
    let state=(seed*2654435761)>>>0;
    const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
    for(let i=0;i<250;i++){
      const x=rnd()*4096,y=rnd()*4096,r=4+rnd()*22;
      const brute=plan.solids.filter(box=>X.circleIntersectsRect(x,y,r,box));
      const fast=X.querySpatialIndexCircle(index,x,y,r);
      assert.equal(fast.length,brute.length,`${seed}/${i}`);
      for(const box of brute)assert.ok(fast.includes(box),`${seed}/${i}/box`);
    }
  }
});

test('movement cost wrapper marks every grid cell touched by 1.25 solids, including thin palisades',()=>{
  const plan=X.createFeaturePlan(17117,4096), tile=32;
  const world={placement(){return {valid:true,reason:''};},solidForFriendly(){return null;},movementCost(){return 10;}};
  const game={state:'playing',runId:'run:path:g4',world};X.patchWorldPlacement(game,plan);
  for(const box of plan.solids.filter(box=>box.kind==='palisade').slice(0,12)){
    const gx=Math.floor((box.x+Math.min(box.w/2,tile/2))/tile),gy=Math.floor((box.y+Math.min(box.h/2,tile/2))/tile);
    assert.ok(world.movementCost(gx,gy)>=1200,`${box.kind}@${gx},${gy}`);
  }
});


test('four gas stations use distinct visitable archetypes and interior furniture families',()=>{
  const plan=X.createFeaturePlan(17117,4096), archetypes=new Set(plan.stations.map(st=>st.archetype)), sizes=new Set(plan.stations.map(st=>`${st.w}x${st.h}`)), furniture=new Set();
  assert.deepEqual(archetypes,new Set(['miniMarket','garage','rural','service']));
  assert.equal(sizes.size,4);
  for(const station of plan.stations){assert.ok(station.archetypeLabel);for(const item of X.stationFurniture(station))furniture.add(item.kind);}
  for(const kind of ['counter','pump','shelf','workbench','vending'])assert.ok(furniture.has(kind),kind);
});


test('initial D-17 depot reserve stays free of generated wrecks and road events across 1000 seeds',()=>{
  for(let i=1;i<=1000;i++){
    const plan=X.createFeaturePlan((i*2246822519)>>>0,4096),c=plan.worldSize/2,r=plan.coreReserveRadius;
    assert.ok(r>=650);
    for(const wreck of plan.wrecks)assert.ok(Math.hypot(wreck.x-c,wreck.y-c)>=r,`${i}/${wreck.id}`);
    for(const event of plan.roadEvents)assert.ok(Math.hypot(event.x-c,event.y-c)>=r,`${i}/${event.id}`);
    for(const prop of plan.roadProps)assert.ok(Math.hypot(prop.x-c,prop.y-c)>=r-80,`${i}/${prop.id}`);
  }
});


test('road wreck density stays useful without overlaps across 1000 seeds',()=>{
  for(let i=1;i<=1000;i++){
    const plan=X.createFeaturePlan((i*3266489917)>>>0,4096);
    assert.ok(plan.wrecks.length>=14,`${i}/density ${plan.wrecks.length}`);
    for(let a=0;a<plan.wrecks.length;a++)for(let b=a+1;b<plan.wrecks.length;b++)assert.ok(Math.hypot(plan.wrecks[a].x-plan.wrecks[b].x,plan.wrecks[a].y-plan.wrecks[b].y)>=92,`${i}/${a}/${b}`);
    for(const event of plan.roadEvents)for(const wreck of plan.wrecks)assert.ok(Math.hypot(event.x-wreck.x,event.y-wreck.y)>=135,`${i}/${event.id}/${wreck.id}`);
  }
});
