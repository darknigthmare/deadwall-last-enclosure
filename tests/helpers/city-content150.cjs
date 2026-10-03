'use strict';
const {legacyAge}=require('./legacy-city.cjs');
const assert=require('node:assert/strict');
const {bootDocument134}=require('../../scripts/qa-startup134.cjs');
const {standAt}=require('./physical-fixtures.cjs');

// Advanced fixtures deliberately prepare knowledge, supplies and old services.
// New supports still use the shipped placement, payment, manual work and Continue.
function fresh(){
 const {g,doc}=bootDocument134(),C=globalThis.DeadwallCore;
 g.startNew('standard','17117');g.campaignIntro132.skip();
 return{g,doc,C};
}
function freeCell(g,type){
 const C=globalThis.DeadwallCore,core=g.core(),d=C.BUILDINGS[type];
 for(let r=6;r<60;r++)for(let y=-r;y<=r;y++)for(const x of Math.abs(y)===r?Array.from({length:2*r+1},(_,i)=>i-r):[-r,r]){
  const gx=core.gx+x,gy=core.gy+y;
  const l=gx*C.TILE,t=gy*C.TILE,r=l+d.size[0]*C.TILE,b=t+d.size[1]*C.TILE;
  const occupied=[g.player,...g.units,...g.zombies].some(actor=>!actor.dead&&Math.hypot(actor.x-Math.max(l,Math.min(r,actor.x)),actor.y-Math.max(t,Math.min(b,actor.y)))<(actor.radius||13)+2);
  if(!occupied&&g.world.placement(d,gx,gy,0).valid)return{gx,gy};
 }
 throw Error('Fixture sans terrain libre pour '+type);
}
function prepare(g,type){
 const C=globalThis.DeadwallCore;if(g.world.has(type))return [...g.world.buildings.values()].find(b=>b.type===type&&b.completed&&!b.dead);
 const d=C.BUILDINGS[type];if(d.requires)prepare(g,d.requires);
 const p=freeCell(g,type),b=new(g.core().constructor)(g.nextId++,type,p.gx,p.gy,0,1);
 g.world.add(b);g.refreshMetrics(true);return b;
}
function advanced(g,type){
 const C=globalThis.DeadwallCore;
 legacyAge(g,1850);prepare(g,'megaReserve');
 if(type&&C.BUILDINGS[type].requires)prepare(g,C.BUILDINGS[type].requires);
 g.refreshMetrics(true);for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(3000,g.storage);
 // Materialize the normal wave plan before exact round-trip comparisons.
 g.prepareWave();g.refreshMetrics(true);return g;
}
function stable(g){const raw=g.serialize();delete raw.timestamp;return raw;}
function continueExactly(g){
 const before=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.deepEqual(stable(g),before);return before;
}
function build(g,type){
 const C=globalThis.DeadwallCore,d=C.BUILDINGS[type],p=freeCell(g,type),stock={...g.resources},storage=g.storage,housing=g.housing,score=g.cityScore;
 assert.equal(g.placeOne(type,p.gx,p.gy),true,type+' native placement');
 const b=g.world.atCell(p.gx,p.gy);assert.equal(b.progress,0);assert.equal(b.completed,false);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(d.cost[key]||0),type+' pays '+key);
 assert.equal(g.storage,storage);assert.equal(g.housing,housing);assert.equal(g.cityScore,score);
 standAt(g,g.player,b);g.input.keys.add('KeyE');
 for(let ticks=0;ticks<2000&&!b.completed;ticks++)g.updateInteraction(.1);
 g.input.keys.clear();assert.equal(b.completed,true,type+' finishes by real manual work');
 assert.equal(g.storage,storage+(d.storage||0));assert.equal(g.housing,housing+(d.housing||0));assert.equal(g.cityScore,score+d.score);
 return b;
}
function planPosition(g,id){
 for(let y=10;y<104;y+=2)for(let x=10;x<104;x+=2){const q=g.dayworks.planStatus(id,x,y);if(q.ok)return{x,y,q};}
 throw Error('Fixture sans terrain libre pour le plan '+id);
}
module.exports={fresh,freeCell,prepare,advanced,stable,continueExactly,build,planPosition,standAt};
