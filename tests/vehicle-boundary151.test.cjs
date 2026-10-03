'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs'),{legacyAge}=require('./helpers/legacy-city.cjs');
const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
function put(type){const d=C.BUILDINGS[type],core=g.core();for(let r=6;r<60;r++)for(let y=core.gy-r;y<=core.gy+r;y++)for(let x=core.gx-r;x<=core.gx+r;x++)if(Math.max(Math.abs(x-core.gx),Math.abs(y-core.gy))===r&&g.world.placement(d,x,y).valid){const b=new(core.constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}throw Error('No legal fixture footprint '+type);}
// Prepared completed infrastructure, historical knowledge and finite stocks isolate
// the boundary contract. Vehicle construction, loading, boarding and motion are native;
// these declared edge poses are not an organic campaign or travel-time claim.
put('expeditionOffice');put('expeditionGarage');legacyAge(g,1850);
g.resources.wood=300;g.resources.scrap=500;g.resources.food=300;
const base=g.serialize();g.frontier.world();
const sides={east:{axis:'x',sign:1,key:'KeyD'},west:{axis:'x',sign:-1,key:'KeyA'},north:{axis:'y',sign:-1,key:'KeyW'},south:{axis:'y',sign:1,key:'KeyS'}};
function paid(id,generation=7){g.restoreSave(structuredClone(base));if(generation!==7){const raw=g.serialize();Object.assign(raw.frontier,{generation,x:4162,y:4096});raw.expansions127.modules.lore131.siteGeneration=null;g.restoreSave(raw);}
 standAt(g,g.player,g.core());assert.equal(g.worldEvolution.selectVehicle(id),true);const before={...g.resources},profile=C.WorldEvolution.RULES.vehicles[id];assert.equal(g.expeditions.buildCar().ok,true);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before[key]-(profile.cost[key]||0),'Native vehicle cost '+id+' '+key);
 const v=g.expeditions.car();Object.assign(g.player,{x:v.x,y:v.y});g.resources.food-=2;g.player.carry.food=2;assert.equal(g.expeditions.transfer().ok,true);assert.equal(v.cargo.food,2);
 if(profile.tank>0)assert.equal(g.expeditions.refuel().ok,true);return v;
}
function pose(v,side){const {axis,sign}=sides[side],radius=g.expeditions.entity().radius,inset=Math.max(36,radius/.9+6),seam=Math.max(26,radius/.9+4),cross=axis==='x'?'y':'x';
 for(const n of [400,800,1200,1600,2048,2400,2800,3200,3600]){const p={[axis]:sign>0?C.WORLD_SIZE-inset:inset,[cross]:n},target={[axis]:sign>0?C.WORLD_SIZE-seam:seam,[cross]:n};const steps=Math.max(1,Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)/4));let clear=true;
  for(let i=0;i<=steps;i++)if(!g.expeditions.carClear(p.x+(target.x-p.x)*i/steps,p.y+(target.y-p.y)*i/steps))clear=false;
  if(clear){Object.assign(v,p);Object.assign(g.player,p);assert.equal(g.save(false),true);assert.equal(g.expeditions.board().ok,true);return p;}
 }throw Error('No clear prepared seam '+side);
}
function within(v){for(const key of ['x','y'])assert.ok(Number.isFinite(v[key])&&v[key]>=26&&v[key]<=C.WORLD_SIZE-26,key+' remains inside the historical save bounds');}
function continuation(){const vehicle=structuredClone(g.expeditions.snapshot().vehicle),resources={...g.resources},frontier=g.frontier.position();assert.ok(Object.values(resources).every(n=>Number.isFinite(n)&&n>=0));assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.expeditions.snapshot().vehicle,vehicle);assert.deepEqual(g.resources,resources);assert.deepEqual(g.frontier.position(),frontier);}

for(const id of ['bike','skate'])for(const side of Object.keys(sides))test('151 vehicles: paid '+id+' native motion at '+side+' remains serializable through Continue',()=>{
 const v=paid(id),start=pose(v,side),stock={...g.resources},cargo={...v.cargo};g.input.keys.add(sides[side].key);for(let i=0;i<20;i++)g.expeditions.drive(.25);g.input.keys.clear();
 within(v);assert.ok(Math.hypot(v.x-start.x,v.y-start.y)>0);assert.deepEqual(g.resources,stock);assert.deepEqual(v.cargo,cargo);assert.equal(v.fuel,0);assert.ok(g.expeditions.snapshot().stats.distance>0);assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(g.serialize()));continuation();
});

test('151 vehicles: a native full update at an off-road legacy G1 edge refuses departure and still autosaves',()=>{
 const v=paid('bike',1);pose(v,'east');const previous=g.save;let attempts=0,failures=0;g.save=function(...args){attempts++;const result=previous.apply(g,args);if(!result)failures++;return result;};
 // A prepared autosave window observes the real save inside the whole wrapped update.
 g.saveTimer=29.6;g.input.keys.add('KeyD');try{for(let i=0;i<25;i++)g.update(.04);}finally{g.input.keys.clear();g.save=previous;}
 assert.equal(g.frontier.active(),false);assert.equal(g.frontier.position().generation,1);assert.ok(Math.abs(v.y-2048)>66);assert.equal(g.frontier.enter(),false);assert.ok(attempts>0);assert.equal(failures,0);within(v);assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(g.serialize()));continuation();
});

test('151 vehicles: every existing profile can enter every physically clear driving seam',()=>{
 for(const id of Object.keys(C.WorldEvolution.RULES.vehicles))for(const side of Object.keys(sides)){const v=paid(id);pose(v,side);const stock={...g.resources},cargo={...v.cargo},fuel=v.fuel,radius=g.player.radius;assert.equal(radius,g.expeditions.entity().radius,'Native boarding retains the '+id+' footprint');
  assert.equal(g.frontier.enter(),true,id+' '+side);assert.equal(g.frontier.position().car.driving,true);assert.equal(g.frontier.position().car.id,v.id);assert.deepEqual(g.resources,stock);assert.deepEqual(v.cargo,cargo);assert.equal(v.fuel,fuel);within(v);assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(g.serialize()));
 }
});

test('151 vehicles: malformed out-of-bounds snapshots still reject before replacing the live world',()=>{
 const v=paid('bike');pose(v,'east');const valid=g.serialize(),world=g.world;
 for(const [key,value]of [['x',25.999],['x',C.WORLD_SIZE-25.999],['y',25.999],['y',C.WORLD_SIZE-25.999],['x',NaN]]){const bad=structuredClone(valid);bad.expeditions.vehicle[key]=value;bad.player[key]=value;assert.throws(()=>g.restoreSave(bad),/Expéditions invalides : véhicule/);assert.equal(g.world,world);}
});
