'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),{bootDocument134}=require('../scripts/qa-startup134.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const stable=g=>{const raw=g.serialize();delete raw.timestamp;return structuredClone(raw);};
function fresh(metric=true){const env=bootDocument134();env.g.startNew('standard','17117','classic','classic',metric);env.g.campaignIntro132.skip();return env;}
function lawfulHouse(g){const d=g.world.definition('house');for(let y=3;y<124-d.size[1];y++)for(let x=3;x<124-d.size[0];x++)if(g.world.placement(d,x,y).valid)return{x,y};throw Error('No real house plot on the generated district');}

test('202 all city models have explicit metre footprints without changing historical models or effects',()=>{
 const legacy=Object.values(C.BUILDINGS).filter(d=>!d.vertical175),hash=crypto.createHash('sha256').update(JSON.stringify(legacy.map(d=>[d.id,d.size]))).digest('hex');
 assert.equal(legacy.length,91);assert.equal(hash,'990a84a82958bc0d14f0476ac01beb1577968b3a532cd8b751275fe6d6b20a75');
 for(const d of legacy){const current=C.CityGeometry202.definition(d.id,1);assert.ok(Object.isFrozen(current)&&Object.isFrozen(current.size));assert.deepEqual(current.size,C.CityGeometry202.sizes[d.id]);assert.ok(current.size.every(n=>Number.isInteger(n)&&n>0));for(const key of Object.keys(d))if(key!=='size')assert.equal(current[key],d[key],d.id+' preserves '+key);assert.equal(C.CityGeometry202.definition(d.id),d);if(d.upgrade)assert.deepEqual(C.CityGeometry202.definition(d.upgrade,1).size,current.size,d.id+' keeps its upgrade footprint');}
 assert.deepEqual(C.CityGeometry202.definition('house',1).size,[10,8]);assert.equal(C.TILE,C.Frontier.RULES.metreUnits);assert.equal(C.CityGeometry202.definition('absent',1),null);
 for(const revision of[-1,2,null,'1',true,NaN])assert.throws(()=>C.CityGeometry202.definition('house',revision));
});

test('202 quarter turns use the same complete footprint for occupancy, placement and movement',()=>{
 const {g}=fresh(false),World=g.world.constructor,Building=g.core().constructor;
 for(let rotation=0;rotation<4;rotation++){
  const world=new World(17117,1);world.nodes=[];const b=new Building(99,'house',20,20,rotation,1);world.add(b);
  const size=rotation%2?[8,10]:[10,8];assert.deepEqual([b.w,b.h],size);assert.equal(b.geometryVersion202,1);assert.equal(world.cells(b).length,80);
  for(let y=20;y<20+b.h;y++)for(let x=20;x<20+b.w;x++){assert.equal(world.atCell(x,y),b);assert.equal(world.solidForFriendly(x*32+16,y*32+16),b);}
  assert.equal(world.atCell(20+b.w,20),null);assert.equal(world.placement(C.BUILDINGS.house,20+b.w-1,20).valid,false);assert.equal(world.placement(C.BUILDINGS.house,20+b.w,20).valid,true);
  const old=world.cells(b);b.type='warehouse';world.rewrite(b,old);assert.equal(world.atCell(20+b.w-1,20+b.h-1),b);world.remove(b);assert.equal(world.buildings.size,0);assert.ok(world.occupancy.every(n=>n===0));
 }
});

test('202 new campaign, first autosave and Continue retain physical dimensions and exterior starting actors',()=>{
 const {g}=fresh(),core=g.core();assert.equal(g.world.cityGeometry202,1);assert.equal(g.exploration125.layoutRevision,4);assert.deepEqual([core.w,core.h],[10,10]);
 for(const actor of[g.player,...g.units]){assert.ok(actor.y>core.bottom);assert.equal(g.friendlyPositionClear(actor,actor.x,actor.y),true);}
 g.zoomView(.01);assert.equal(g.camera.zoom,.3);g.width=1366;g.height=768;g.update(.04);assert.equal(g.camera.x,C.WORLD_SIZE/2,'a viewport wider than the metric district remains centred');g.zoomView(100);assert.equal(g.camera.zoom,1.65);
 assert.equal(g.serialize().cityGeometry202,1);g.prepareWave();g.refreshMetrics(true);const before=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(stable(g),before);assert.equal(g.world.definition('house').size[0],10);
 const current=stable(g);for(const revision of[2,null,'1',true]){const corrupt=structuredClone(current);corrupt.cityGeometry202=revision;assert.throws(()=>g.restoreSave(corrupt));assert.deepEqual(stable(g),current);}
 const overlapping=structuredClone(current);overlapping.buildings.push({id:overlapping.nextId++,type:'house',gx:core.gx+core.w-1,gy:core.gy,rotation:0,progress:0,health:10});assert.throws(()=>g.restoreSave(overlapping));assert.deepEqual(stable(g),current);
});

test('202 a paid house, preview, manual construction and Continue preserve its actual 10 by 8 metre body',()=>{
 const {g}=fresh(),at=lawfulHouse(g),stock={...g.resources},def=g.world.definition('house'),capacities=[g.housing,g.storage,g.cityScore];
 g.selectedBuild='house';g.buildRotation=0;g.input.mouseWorldX=at.x*32;g.input.mouseWorldY=at.y*32;const rects=[],ctx={save(){},restore(){},fillRect(...args){rects.push(args);},strokeRect(){}};g.drawPlacement(ctx);assert.deepEqual(rects,[[at.x*32+2,at.y*32+2,10*32-4,8*32-4]]);g.cancelPlacement();
 assert.equal(g.placeOne('house',at.x,at.y),true);const b=g.world.atCell(at.x,at.y);assert.deepEqual([b.w,b.h,b.progress],[10,8,0]);for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(def.cost[key]||0));assert.deepEqual([g.housing,g.storage,g.cityScore],capacities);
 standAt(g,g.player,b);g.input.keys.add('KeyE');try{for(let ticks=0;ticks<2000&&!b.completed;ticks++)g.updateInteraction(.1);}finally{g.input.keys.clear();}assert.equal(b.completed,true);assert.equal(g.housing,capacities[0]+def.housing);
 g.prepareWave();g.refreshMetrics(true);const before=stable(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(stable(g),before);const restored=g.world.buildings.get(b.id);assert.deepEqual([restored.gx,restored.gy,restored.w,restored.h],[at.x,at.y,10,8]);
});

test('202 tall buildings remain in the depth queue when their ground footprint is below the visible roof',()=>{
 const {g}=fresh(),b=new(g.core().constructor)(g.nextId++,'megaTower',72,20,0,1);g.world.add(b);const frame=globalThis.DeadwallBuildingVariants157.metricFrame202(b),view={left:b.left,right:b.right,top:frame.bounds.y+2,bottom:frame.bounds.y+30};
 assert.equal(g.visible(b.x,b.y,Math.max(b.w,b.h)*32+40,view),false,'historical ground-only culling would drop this roof');assert.ok(g.depthEntries(view).some(entry=>entry.entity===b));assert.equal(g.world.at(b.x,view.top+4),null);assert.equal(g.buildingAtVisual(b.x,view.top+4),b,'visible roof can be selected');
 assert.equal(g.depthEntries({...view,left:b.right+100,right:b.right+150}).some(entry=>entry.entity===b),false);assert.equal(g.buildingAtVisual(b.right+100,view.top+4),null);b.dead=true;assert.equal(g.depthEntries(view).some(entry=>entry.entity===b),false);assert.equal(g.buildingAtVisual(b.x,view.top+4),null);
});

test('202 historical campaigns keep original bodies and omit the new geometry flag through Continue',()=>{
 const {g}=fresh(false);assert.equal(g.world.cityGeometry202,0);assert.equal(g.exploration125.layoutRevision,3);assert.deepEqual([g.core().w,g.core().h],C.BUILDINGS.core.size);g.zoomView(.01);assert.equal(g.camera.zoom,.52);assert.equal(Object.hasOwn(g.serialize(),'cityGeometry202'),false);g.prepareWave();g.refreshMetrics(true);const before=stable(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(stable(g),before);assert.deepEqual(g.world.definition('house').size,[3,2]);
});
