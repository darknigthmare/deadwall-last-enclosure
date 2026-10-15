'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),E=require('../src/biomes164.js'),H=require('../src/hydrology165.js'),Geo=require('../src/geography135.js');
const seed=17117,base=E.create({base:B,seed}),hydrology=H.create({seed,home:Geo.home(seed,8),biomes:base}),wet=E.create({base:B,seed,hydrology});

test('165 freshwater banks actually become wetter ecological habitats without changing distant land',()=>{
 let bank=null;
 for(const river of hydrology.features.filter(f=>f.kind==='river')){
  for(let i=1;i<river.points.length-1&&!bank;i++){
   const p=river.points[i],q=river.points[i+1],a=Math.atan2(q.y-p.y,q.x-p.x),x=p.x-Math.sin(a)*(river.width/2+8),y=p.y+Math.cos(a)*(river.width/2+8),water=hydrology.sample(x,y),before=base.sample(seed,x,y,false);
   if(!water.water&&water.salinity==='fresh'&&water.distanceToWater<10&&before.moisture<.5)bank={x,y,before};
  }
  if(bank)break;
 }
 assert.ok(bank,'a real dry bank beside freshwater exists');
 const after=wet.sample(seed,bank.x,bank.y,false),riparian=s=>['riparian','wetland','alluvialTerrace','peatland'].reduce((n,id)=>n+s.weights[id],0);
 assert.ok(after.moisture>bank.before.moisture);assert.ok(riparian(after)>riparian(bank.before));
 assert.equal(after.hydrology165.fresh,true);
 const home=Geo.home(seed,8);assert.ok(hydrology.sample(home.x,home.y).distanceToWater>C.Hydrology165Rules.ecology.bankReach);
 const distant=wet.sample(seed,home.x,home.y,true),historical=base.sample(seed,home.x,home.y,true);
 assert.deepEqual(distant.weights,historical.weights);assert.deepEqual(distant.palette,historical.palette);
});

test('165 saline shores are distinguished from freshwater banks by the real hydrology owner',()=>{
 const coast=hydrology.coast,v=hydrology.size/2,p=coast.toWorld(coast.inlandAt(v)+8,v),water=hydrology.sample(p.x,p.y);
 assert.equal(water.water,false);assert.equal(water.salinity,'salt');
 const sample=wet.sample(seed,p.x,p.y,false);assert.equal(sample.hydrology165.fresh,false);assert.ok(sample.hydrology165.bank>0);
 const sea=coast.toWorld(coast.inlandAt(v)-20,v);assert.equal(hydrology.sample(sea.x,sea.y).salinity,'salt');
});

test('165 absence of water preserves the historical ecological provider, including scatter identities',()=>{
 const explicit=E.create({base:B,seed,hydrology:null});
 for(const p of [[0,0],[1000,3000],[10000,20000],[24000,24000]])assert.deepEqual(explicit.sample(seed,...p),base.sample(seed,...p));
 assert.deepEqual(explicit.scatter(seed,3,4),base.scatter(seed,3,4));
 assert.throws(()=>E.create({base:B,seed,hydrology:{...hydrology,seed:42}}),/Hydrologie/);
 assert.throws(()=>E.create({base:B,seed,hydrology:{version:2,seed,sample(){}}}),/Hydrologie/);
});
