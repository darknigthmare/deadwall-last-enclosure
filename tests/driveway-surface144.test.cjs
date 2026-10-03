'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js'),B=require('../src/biomes135.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{describeWorld}=require('./helpers/world-generation-digest.cjs');
const preserved=require('./fixtures/world-surface143-preserved.json');
let g,C;
test.before(()=>{({g}=bootDocument134());C=globalThis.DeadwallCore;});
function begin(){g.startNew('standard','17117');g.campaignIntro132.skip();return g.frontier.world();}
function onAccess(p,t=.15){return{x:p.drive.a.x+(p.drive.b.x-p.drive.a.x)*t,y:p.drive.a.y+(p.drive.b.y-p.drive.a.y)*t,generation:7,z:0};}
function offAccess(w,p){
 const q=onAccess(p),dx=p.drive.b.x-p.drive.a.x,dy=p.drive.b.y-p.drive.a.y,length=Math.hypot(dx,dy);
 for(const sign of[-1,1])for(const distance of[8,12,18,26]){
  const f={...q,x:q.x-sign*dy/length*distance,y:q.y+sign*dx/length*distance},n=w.nearestRoad(f);
  if(n.d<n.road.width/2+1||w.drivewayAt(f.x,f.y,1)||w.nearPOI(f.x,f.y,15).some(p=>f.x>p.reserve.l&&f.x<p.reserve.r&&f.y>p.reserve.t&&f.y<p.reserve.b)||w.blocked(f.x,f.y,.32))continue;
  if(w.biomeAt(f.x,f.y).surface==='forest')return f;
 }
 throw Error('No physically free off-access woodland fixture');
}
// Explicit regional-position fixture; geometry, stocks, contacts and costs stay native.
function visit(f){const d=g.serialize();Object.assign(d.frontier,{...f,active:true,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});g.restoreSave(d);}

test('driveways144: real G7 access painted outside the parcel uses asphalt speed and noise',()=>{
 const w=begin(),p=w.pois.find(p=>p.id==='P0006'),f=onAccess(p);
 assert.equal(w.generation,7);assert.equal(p.type,'postoffice');assert.equal(f.x,4996.499825274519);assert.equal(f.y,10844.118169826746);
 assert.equal(w.blocked(f.x,f.y,.32),false);assert.equal(B.sample(w.seed,f.x,f.y,false,{generation:7}).surface,'forest');
 const n=w.nearestRoad(f);assert.ok(n.d>n.road.width/2+1);assert.ok(!w.nearPOI(f.x,f.y,15).some(p=>f.x>p.reserve.l&&f.x<p.reserve.r&&f.y>p.reserve.t&&f.y<p.reserve.b));
 assert.deepEqual(g.worldEvolution.surface(f),{key:'asphalt',...C.WorldEvolution.RULES.surfaces.asphalt});
});
test('driveways144: leaving the paved access retains the real biome and interior/public-road priority',()=>{
 const w=begin(),p=w.pois.find(p=>p.id==='P0006'),f=offAccess(w,p);
 assert.deepEqual(g.worldEvolution.surface(f),{key:'forest',...C.WorldEvolution.RULES.surfaces.forest});
 assert.deepEqual(g.worldEvolution.surface({...onAccess(p),z:1}),{key:'floor',...C.WorldEvolution.RULES.surfaces.floor});
 assert.deepEqual(g.worldEvolution.surface({...onAccess(p),...p.drive.a}),{key:'asphalt',...C.WorldEvolution.RULES.surfaces.asphalt});
});
test('driveways144: restoring each supported modern generation reads its own paved approach',()=>{
 begin();
 for(const generation of[4,5,6,7]){
  // Explicit historical-generation fixture, using the regular save validator.
  const saved=g.serialize();Object.assign(saved.frontier,{generation,active:false,x:4096,y:4096,z:0,inside:null,car:null});g.restoreSave(saved);
  const w=g.frontier.world(),p=w.pois[0],f={...onAccess(p,.5),generation},r=w.nearestRoad(f);
  assert.equal(w.generation,generation);assert.ok(r.d>r.road.width/2+1,'Point is outside the public road shoulder');assert.ok(w.drivewayAt(f.x,f.y,1));
  assert.deepEqual(g.worldEvolution.surface(f),{key:'asphalt',...C.WorldEvolution.RULES.surfaces.asphalt});
  assert.deepEqual(g.worldEvolution.surface({...f,z:1}),{key:'floor',...C.WorldEvolution.RULES.surfaces.floor});
 }
});
test('driveways144: native foot movement, noise and save/resume use the paved access without free stocks',()=>{
 const w=begin(),p=w.pois.find(p=>p.id==='P0006'),f=onAccess(p);visit(f);
 const before=g.frontier.position(),stocks=structuredClone(g.resources),bag=structuredClone(g.player.carry),rng=g.random.state;
 g.input.keys.add('KeyD');g.updatePlayer(.04);g.input.keys.clear();const after=g.frontier.position(),sound=g.frontier.overview().sound;
 assert.ok(Math.abs(after.x-before.x-W.RULES.walk*.04)<1e-9);assert.equal(after.y,before.y);assert.equal(sound.kind,'Marche');assert.equal(sound.radius,C.FrontierTacticsRules.walkNoise);
 assert.deepEqual(g.resources,stocks);assert.deepEqual(g.player.carry,bag);assert.equal(g.random.state,rng);
 const saved=g.serialize();g.restoreSave(saved);assert.deepEqual(g.frontier.position(),after);assert.deepEqual(g.worldEvolution.surface(g.frontier.position()),{key:'asphalt',...C.WorldEvolution.RULES.surfaces.asphalt});
 assert.deepEqual(g.resources,stocks);assert.deepEqual(g.player.carry,bag);
});
test('driveways144: nearby woodland keeps its physical movement/noise and no resources change',()=>{
 const w=begin(),f=offAccess(w,w.pois.find(p=>p.id==='P0006'));visit(f);const before=g.frontier.position(),stocks=structuredClone(g.resources);
 g.input.keys.add('KeyD');g.updatePlayer(.04);g.input.keys.clear();const after=g.frontier.position();
 assert.ok(Math.abs(after.x-before.x-W.RULES.walk*C.WorldEvolution.RULES.surfaces.forest.speed*.04)<1e-9);assert.equal(g.frontier.overview().sound.radius,C.FrontierTacticsRules.walkNoise*C.WorldEvolution.RULES.surfaces.forest.noise);assert.deepEqual(g.resources,stocks);
});
test('driveways144: the bounded driveway index matches physical capsules across chunk boundaries',()=>{
 for(const seed of[0,17117,4294967295]){
  const w=W.create(seed,7);let crossings=0;
  for(const p of w.pois){const d=p.drive,dx=d.b.x-d.a.x,dy=d.b.y-d.a.y,len=Math.hypot(dx,dy);if(!len)continue;
   const ts=[.15,.5,.85];for(const axis of['x','y']){const delta=d.b[axis]-d.a[axis];if(!delta)continue;for(let line=Math.ceil(Math.min(d.a[axis],d.b[axis])/256)*256;line<Math.max(d.a[axis],d.b[axis]);line+=256){const t=(line-d.a[axis])/delta;if(t>0&&t<1){ts.push(t-1e-6,t+1e-6);crossings++;}}}
   for(const t of ts)for(const offset of[0,d.width/2+.999,d.width/2+1.001]){
    const x=d.a.x+dx*t-dy/len*offset,y=d.a.y+dy*t+dx/len*offset;
    const expected=w.pois.some(q=>G.nearest({x,y},q.drive.a,q.drive.b).d<q.drive.width/2+1),actual=w.drivewayAt(x,y,1);
    assert.equal(Boolean(actual),expected,seed+' '+p.id+' '+t+' offset '+offset);
   }
  }
  assert.ok(crossings>0,'Actual seeded driveways cross streaming boundaries');
  const p=w.pois[0],q=onAccess(p,.5),returned=w.drivewayAt(q.x,q.y,1),original=structuredClone(p.drive);assert.ok(returned);returned.a.x=-99;assert.deepEqual(p.drive,original,'Lookup cannot mutate shared generation geometry');
  for(const [x,y,m]of[[NaN,3,1],[3,Infinity,1],[-1,3,1],[3,-1,1],[3,3,-1],[3,3,NaN]])assert.equal(w.drivewayAt(x,y,m),null);
  assert.ok(w.cacheSize()<=W.RULES.chunkCache);assert.ok(w.planCacheSize()<=W.RULES.planCache);
 }
});
for(const expected of preserved.rows)test('driveways144: unchanged G'+expected.generation+' geometry, floors, finite nodes and threats for seed '+expected.seed,()=>{
 assert.deepEqual(describeWorld(W.create(expected.seed,expected.generation)),expected);
});
