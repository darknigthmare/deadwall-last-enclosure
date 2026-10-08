'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),Catalogue=require('../src/city-catalogue150.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

test('154 city catalogue: the ordinary generator exposes its existing fuel burden without mutating the city definitions',()=>{
 const before=JSON.stringify(C),catalogue=Catalogue.create(C),generator=catalogue.items.find(i=>i.kind==='building'&&i.id==='generator');
 assert.ok(generator.tradeoffs.includes('1.08 carburant par minute.'),'The early generator needs a visible running cost as well as its construction price');
 assert.equal(JSON.stringify(C),before);assert.equal(C.BUILDINGS.generator.generatorFuel,.018);
});

test('154 generator: catalogued fuel rate remains single-paid in the real economy and the thirty-second progression forecast',()=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();const core=g.core(),def=C.BUILDINGS.generator;let cell;
 for(let r=6;r<25&&!cell;r++)for(let dy=-r;dy<=r&&!cell;dy++)for(let dx=-r;dx<=r&&!cell;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&g.world.placement(def,core.gx+dx,core.gy+dy).valid)cell={gx:core.gx+dx,gy:core.gy+dy};
 assert.ok(cell);const b=new(core.constructor)(g.nextId++,'generator',cell.gx,cell.gy,0,1);g.world.add(b);g.refreshMetrics(true);
 // Prepared completed support isolates running fuel. No paid construction or
 // campaign timing is claimed by this fixture.
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' / '+b);
 g.resources.fuel=10;g.economyTick(60);close(g.resources.fuel,8.92);
 g.resources.fuel=.54;close(g.urban.facts().power,32);g.resources.fuel=.53;close(g.urban.facts().power,8);
 g.research.completed.push('grid');g.resources.fuel=10;g.economyTick(60);close(g.resources.fuel,9.19);
 g.resources.fuel=.405;close(g.urban.facts().power,32);g.resources.fuel=.40;close(g.urban.facts().power,8);
});
