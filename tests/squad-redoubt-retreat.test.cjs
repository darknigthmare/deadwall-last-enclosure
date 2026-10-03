'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),Q=require('../src/squads.js'),Save=require('../src/save.js'),{bootGame}=require('./helpers/browser.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
function add(g,type,gx,gy,rotation=0,progress=1){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,rotation,progress);g.world.add(b);return b;}
function fresh(){
 const {game:g}=bootGame();g.startNew('standard','17117');g.syncOverlayFocus();const Unit=g.units[0].constructor;
 g.units=[];g.zombies=[];g.world.nodes=[];const redoubt=add(g,'fallbackRedoubt',74,64),unit=new Unit(g.nextId++,'soldier',C.world(80),redoubt.y);unit.squad=0;unit.offset={x:0,y:0};g.units.push(unit);g.refreshMetrics(true);
 assert.ok(g.friendlyPositionClear(unit,unit.x,unit.y));return{g,unit,redoubt};
}
function tick(g,n=1){for(let i=0;i<n;i++){g.elapsed+=.04;g.updateUnits(.04);}}

test('redoubt retreat: territory buttons order real withdrawal to centre or selected redoubt',()=>{
 const {g,unit,redoubt}=fresh(),before={x:unit.x,y:unit.y},resources=copy(g.resources);
 assert.equal(g.territories.chooseFallback(null),true);assert.equal(g.territories.rallySquad(0),true);assert.equal(g.squads.groups[0].order,'retreat');assert.equal(g.squads.groups[0].retreatBuildingId,undefined);
 assert.equal(g.territories.chooseFallback(redoubt.id),true);assert.equal(g.territories.rallySquad(0),true);assert.equal(g.squads.groups[0].order,'retreat');assert.equal(g.squads.groups[0].retreatBuildingId,redoubt.id);
 assert.deepEqual({x:unit.x,y:unit.y},before);assert.deepEqual(g.resources,resources);
 const distance=g.fieldcraft.distance(unit,redoubt);tick(g,20);assert.ok(g.fieldcraft.distance(unit,redoubt)<distance);assert.ok(g.fieldcraft.distance(unit,redoubt)>C.SQUAD_RULES.retreatRadius);
});
test('redoubt retreat: ordinary riposte continues while withdrawal never pursues a distant enemy',()=>{
 const {g,unit,redoubt}=fresh();g.startAssault();g.spawnZombie('walker');const enemy=g.zombies[0];enemy.x=unit.x+100;enemy.y=unit.y;g.rebuildBuckets();assert.equal(g.retreatSquad(0,redoubt),true);
 const before=unit.x,ammo=g.resources.ammo;tick(g);assert.equal(g.resources.ammo,ammo-1);assert.equal(g.projectiles.length,1);assert.ok(unit.x<before);
 enemy.x=unit.x+320;g.rebuildBuckets();unit.fireCooldown=0;const next=unit.x;tick(g);assert.ok(unit.x<next);assert.equal(g.resources.ammo,ammo-1);
});
test('redoubt retreat: a closed gate blocks the route, reopening permits a physical arrival',()=>{
 const {g,unit,redoubt}=fresh();for(let y=0;y<C.WORLD_TILES;y++)if(y!==64&&y!==65)add(g,'woodWall',79,y);
 const gate=add(g,'gate',79,64,1);gate.gateMode='closed';assert.equal(g.retreatSquad(0,redoubt),true);const before={x:unit.x,y:unit.y};tick(g,80);
 assert.deepEqual({x:unit.x,y:unit.y},before);assert.equal(g.getSquadSummary()[0].blocked,1);assert.equal(g.setGateMode('auto',gate),true);
 for(let i=0;i<600&&g.fieldcraft.distance(unit,redoubt)>C.SQUAD_RULES.retreatRadius;i++){tick(g);assert.ok(g.friendlyPositionClear(unit,unit.x,unit.y));}
 assert.ok(g.fieldcraft.distance(unit,redoubt)<=C.SQUAD_RULES.retreatRadius);assert.ok(unit.x<gate.left);
});
test('redoubt retreat: destruction falls back to the centre before movement or serialization',()=>{
 const {g,unit,redoubt}=fresh();assert.equal(g.retreatSquad(0,redoubt),true);g.destroyBuilding(redoubt);const before={x:unit.x,y:unit.y};
 const snapshot=g.serialize();assert.equal(snapshot.squads.groups[0].order,'retreat');assert.equal(snapshot.squads.groups[0].retreatBuildingId,undefined);assert.deepEqual({x:unit.x,y:unit.y},before);
 assert.doesNotThrow(()=>Save.validate(snapshot));const distance=g.fieldcraft.distance(unit,g.core());tick(g,30);assert.ok(g.fieldcraft.distance(unit,g.core())<distance);
});
test('redoubt retreat: save/resume preserves the building reference and restores no resources or movement',()=>{
 const {g,unit,redoubt}=fresh();assert.equal(g.retreatSquad(0,redoubt),true);tick(g,10);const snapshot=copy(g.serialize());
 assert.equal(snapshot.squads.groups[0].retreatBuildingId,redoubt.id);assert.equal(g.restoreSave(snapshot),true);assert.deepEqual(g.squads,snapshot.squads);assert.deepEqual(g.resources,snapshot.resources);assert.deepEqual(g.units.map(u=>[u.id,u.x,u.y]),snapshot.units.map(u=>[u.id,u.x,u.y]));
 const restored=g.units.find(u=>u.id===unit.id),destination=g.world.buildings.get(redoubt.id),distance=g.fieldcraft.distance(restored,destination);tick(g,20);assert.ok(g.fieldcraft.distance(restored,destination)<distance);
});
test('redoubt retreat: malformed references reject transactionally, a missing former redoubt safely resolves to the centre',()=>{
 const {g,redoubt}=fresh();assert.equal(g.retreatSquad(0,redoubt),true);const snapshot=copy(g.serialize()),world=g.world;
 for(const id of[-1,0,1.5,'7',null,0x7fffffff,g.core().id]){const bad=copy(snapshot);bad.squads.groups[0].retreatBuildingId=id;assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,world);}
 const rally=copy(snapshot);rally.squads.groups[0].order='rally';assert.throws(()=>g.restoreSave(rally));assert.equal(g.world,world);
 const unfinished=copy(snapshot);unfinished.buildings.find(b=>b.id===redoubt.id).progress=.5;assert.throws(()=>g.restoreSave(unfinished));assert.equal(g.world,world);
 const missing=copy(snapshot);missing.buildings=missing.buildings.filter(b=>b.id!==redoubt.id);const normalized=Save.validate(missing);assert.equal(normalized.squads.groups[0].retreatBuildingId,undefined);assert.equal(normalized.squads.groups[0].order,'retreat');
});
test('redoubt retreat: legacy groups stay byte-compatible and a new rally clears the previous reference',()=>{
 const legacy=Q.withOrder(Q.create({x:123,y:456}),0,'retreat');assert.deepEqual(Q.normalize(legacy),legacy);
 const {g,redoubt}=fresh();assert.equal(g.retreatSquad(0,redoubt),true);assert.equal(g.setSquadRally(0,{x:C.world(80),y:C.world(68)}),true);assert.equal(g.squads.groups[0].order,'rally');assert.equal(g.squads.groups[0].retreatBuildingId,undefined);
 const before=copy(g.squads);assert.equal(g.retreatSquad(0,add(g,'house',84,70)),false);assert.deepEqual(g.squads,before);
});
test('redoubt retreat: existing squad cards and ground markers display the real destination and its loss',()=>{
 const {g,redoubt}=fresh(),panel=document.getElementById('squadCommandPanel');g.ui.commandModal.appendChild(panel);
 delete require.cache[require.resolve('../src/squad-ui.js')];require('../src/squad-ui.js');assert.equal(g.retreatSquad(0,redoubt),true);g.squadUI.refresh();
 const order=panel.querySelectorAll('article')[0].children[1];assert.equal(order.tagName,'P');assert.ok(order.textContent.includes('REDOUTE #'+redoubt.id));assert.equal(g.getSquadSummary()[0].retreatTarget.id,redoubt.id);
 const arcs=[],ctx=new Proxy({arc:(...args)=>arcs.push(args)},{get:(target,key)=>key in target?target[key]:()=>{}});g.visible=()=>true;g.squadUI.drawMarkers(ctx);
 assert.ok(arcs.some(([x,y,r])=>x===redoubt.x&&y===redoubt.y&&r===18));
 g.destroyBuilding(redoubt);g.squadUI.refresh();assert.ok(order.textContent.includes('AU CENTRE'));assert.equal(g.getSquadSummary()[0].retreatTarget.id,g.core().id);
});
