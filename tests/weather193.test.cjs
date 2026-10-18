'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/weather193.js'),{boot127}=require('./helpers/expansions127.cjs');
function fresh(){const {game:g}=boot127();W.install(g);g.startNew('standard','17117');g.phaseTime=999;return g;}
test('193 fronts are deterministic, varied and bounded without consuming campaign RNG',()=>{
 const g=fresh(),rng=g.random.state,found=new Set(),other=[];
 for(let index=0;index<500;index++){
  const a=W.sample(17117,index*240+17),b=W.sample(17117,index*240+17);
  assert.deepEqual(a,b);assert.ok(a.rain>=0&&a.rain<=1);assert.ok(a.left>0&&a.left<=240);
  found.add(a.id);other.push(a.id!==W.sample(17118,index*240+17).id);
 }
 assert.equal(found.size,Object.keys(C.Weather193Rules.fronts).length);assert.ok(other.some(Boolean));
 assert.equal(g.random.state,rng);assert.equal(W.sample(17117,0).id,'dry');
 assert.doesNotThrow(()=>W.sample(0,1e12));
});
test('193 the short bulletin reveals the actual next front only inside its lead window',()=>{
 const R=C.Weather193Rules;
 assert.equal(W.sample(17117,240-R.forecastLead-.01).next,null);
 const f=W.sample(17117,240-R.forecastLead);assert.equal(f.next.id,W.sample(17117,240).id);
 assert.equal(f.next.rain,W.sample(17117,240).rain);assert.equal(W.sample(17117,240).left,240);
});
test('193 malformed clocks, seeds and weather ledgers are rejected',()=>{
 for(const raw of [null,[],{}, {version:1,active:1},{version:1,active:true,extra:0},{version:2,active:true}])assert.throws(()=>W.validate(raw));
 for(const time of [-1,Infinity,NaN,1e12+1,'1'])assert.throws(()=>W.sample(17117,time));
 for(const seed of [-1,.5,0x100000000,'1'])assert.throws(()=>W.sample(seed,0));
 assert.deepEqual(W.validate(undefined),{version:1,active:false});
});
test('193 new fronts use the normal rain interpolation and keep the combat RNG out of weather selection',()=>{
 const g=fresh();let time=240;while(!W.sample(17117,time).rain)time+=240;
 g.elapsed=time;g.weather=0;g.weatherTarget=0;const target=W.sample(17117,time+.04).rain;
 g.update(.04);assert.equal(g.weatherTarget,target);assert.ok(Math.abs(g.weather-target*.0016)<1e-12);
 const before=g.random.state;for(let n=0;n<10;n++){g.weather193.overview();g.weather193.current();g.weather193.forecast();}
 assert.equal(g.random.state,before);
});
test('193 weather and the exact next transition survive Continue; legacy absence keeps historical mode',()=>{
 const g=fresh();g.elapsed=479.96;g.weather=.38;g.weatherTarget=.66;
 const raw=g.serialize();g.update(.04);const expected={rain:g.weather,target:g.weatherTarget};
 g.restoreSave(raw);assert.equal(g.weather193.active(),true);g.update(.04);
 assert.deepEqual({rain:g.weather,target:g.weatherTarget},expected);
 const legacy=g.serialize();delete legacy.expansions127.modules.weather193;delete legacy.weatherTarget;
 g.restoreSave(legacy);assert.equal(g.weather193.active(),false);assert.equal(g.weatherTarget,g.weather);
 assert.equal(g.expansions.restoring(),false);
});
test('193 opted-in fronts pause with the simulation and activate old campaigns only at the real depot',()=>{
 const g=fresh(),raw=g.serialize();delete raw.expansions127.modules.weather193;g.restoreSave(raw);
 g.player.x=4000;g.player.y=4000;assert.equal(g.weather193.activate().ok,false);
 const home=g.coreArrivalPosition(g.player,g.core());assert.ok(home);Object.assign(g.player,home);
 assert.equal(g.weather193.activationQuote().ok,true);const stock={...g.resources},seed=g.world.seed;
 assert.equal(g.weather193.activate().ok,true);assert.deepEqual(g.resources,stock);assert.equal(g.world.seed,seed);
 assert.equal(g.weather193.activate().ok,false);
 g.paused=true;const elapsed=g.elapsed,front=g.weather193.current();g.loop(performance.now());
 assert.equal(g.elapsed,elapsed);assert.deepEqual(g.weather193.current(),front);
});
test('193 rain remains visible with either wind direction and honors reduced motion without mutating state',()=>{
 const g=fresh();g.weather=1;const points=[];const ctx={save(){},restore(){},beginPath(){},stroke(){},moveTo(x,y){points.push([x,y]);},lineTo(){}};
 let at=240;while(W.sample(17117,at).wind>=0)at+=240;
 g.elapsed=at+100;const before=g.serialize();g.drawRain(ctx);assert.ok(points.length>0);
 assert.ok(points.every(([x,y])=>x>=-100&&x<=g.width+100&&y>=0&&y<=g.height));
 assert.equal(g.random.state,before.randomState);assert.equal(g.elapsed,before.elapsed);
 g.settings.reducedMotion=true;points.length=0;g.drawRain(ctx);const still=JSON.stringify(points);
 points.length=0;g.elapsed+=.04;g.drawRain(ctx);assert.equal(JSON.stringify(points),still);
});
