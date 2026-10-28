'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/core.js');const H=require('../src/hero-actions133.js');

// Deliberately prepared read models isolate the observer contract. These tests
// do not claim seeded travel, water transfer or reservoir simulation.
function fixture(kind='draw',heroFirst=false){
 const point={active:true,generation:11,x:10,y:20,z:0,inside:null,a:.7,car:{driving:false}};let view=null;
 const g={state:'playing',paused:false,gameOver:false,activeOverlay:null,elapsed:0,world:{seed:17117},stats:{shots:0},input:{keys:new Set()},
  player:{x:320,y:640,health:80,dead:false,carry:{wood:4,scrap:4},facing:.4,reload:0,shootCooldown:0,meleeCooldown:0},
  frontier:{position:()=>({...point,car:{...point.car}}),world:()=>assert.fail('Observer generated a world'),snapshot:()=>assert.fail('Observer read a save')},
  worldEvolution:{posture:()=>({key:'stand'})},
  update(dt){if(!g.paused&&!g.activeOverlay)g.elapsed+=dt;},
  startNew(){g.world={seed:17117};view=null;return true;},restoreSave(){view=null;return true;},returnToMenu(){g.state='menu';return true;}};
 const owner={busy:()=>!!view,activity:()=>view};g.campaignWater214=owner;
 function begin(){g.heroActions133?.reset();view={siteId:'P0001',supportId:'P0001:205:static:7',supportKind:'rain-barrel',kind,amount:kind==='prepare'?0:2,start:g.elapsed,elapsed:0,duration:4,progress:0,anchor:{x:10,y:20,z:0},workTarget:{x:10,y:21,z:0}};}
 function advance(dt){if(!view||g.paused||g.activeOverlay||!Number.isFinite(dt)||dt<=0)return;const step=Math.min(.25,dt);view={...view,elapsed:view.elapsed+step,progress:Math.min(1,(view.elapsed+step)/view.duration)};g.heroActions133?.observeWaterWork214(step);if(view.elapsed>=view.duration){view=null;g.heroActions133?.reset();}}
 if(heroFirst)H.install(g);
 const old=g.update;g.update=dt=>{old(dt);advance(dt);};
 if(!heroFirst)H.install(g);
 return{g,point,owner,begin,advance,view:()=>view,set:value=>{view=value;},cancel(){view=null;g.heroActions133.reset();}};
}

for(const[kind,pose]of[['prepare','build'],['draw','handle'],['pour','handle']])test('214 hero '+kind+': only owner elapsed progress creates a directed work gesture',()=>{
 const f=fixture(kind),{g}=f,before=JSON.stringify({player:g.player,world:g.world});f.begin();assert.equal(g.heroActions133.pose(),null);assert.equal(g.heroActions133.observeWaterWork214(.04),false);
 f.advance(.04);const first=g.heroActions133.pose();assert.equal(first?.kind,pose);assert.equal(first.elapsed,.04);assert.equal(first.facing,Math.PI/2,'Metres are converted once, facing the actual work target');assert.equal(g.heroActions133.observeWaterWork214(.04),false,'Same elapsed cannot be replayed');assert.deepEqual(g.heroActions133.pose(),first);assert.equal(JSON.stringify({player:g.player,world:g.world}),before);
 f.cancel();assert.equal(g.heroActions133.pose(),null);f.begin();f.advance(.04);assert.equal(g.heroActions133.pose()?.elapsed,.04,'Restart at same world time has a fresh baseline');
 while(f.view())f.advance(.25);assert.equal(g.heroActions133.pose(),null,'Completion removes the transient gesture');
});

for(const heroFirst of[false,true])test('214 hero: update wrapper order preserves the exact native quarter-second phase ('+heroFirst+')',()=>{
 const f=fixture('draw',heroFirst);f.begin();for(const dt of[.04,.04,.3,.04]){f.g.update(dt);assert.equal(f.g.heroActions133.pose()?.elapsed,f.view().elapsed);}assert.ok(Math.abs(f.view().elapsed-.37)<1e-9);
});

test('214 hero: pause and modals freeze progress; low posture, combat and moved bodies keep their priority',()=>{
 const f=fixture('pour'),{g}=f;f.begin();f.advance(.04);const first=g.heroActions133.pose();
 for(const blocked of['paused','overlay']){g.paused=blocked==='paused';g.activeOverlay=blocked==='overlay'?{}:null;g.update(.1);f.advance(.1);assert.deepEqual(g.heroActions133.pose(),first);assert.equal(g.heroActions133.observeWaterWork214(.1),false);}g.paused=false;g.activeOverlay=null;
 for(const stop of['posture','move','floor','drive','reload','melee','shot','death','world','player','owner']){
  const n=fixture();n.begin();n.advance(.04);assert.ok(n.g.heroActions133.pose());
  if(stop==='posture')n.g.worldEvolution.posture=()=>({key:'prone'});if(stop==='move')n.point.x+=.2;if(stop==='floor')n.point.z=1;if(stop==='drive')n.point.car.driving=true;if(stop==='reload')n.g.player.reload=1;if(stop==='melee')n.g.player.meleeCooldown=.2;if(stop==='shot'){n.g.stats.shots++;n.g.player.shootCooldown=.2;}if(stop==='death')n.g.player.dead=true;if(stop==='world')n.g.world={seed:17117};if(stop==='player')n.g.player={...n.g.player};if(stop==='owner')n.g.campaignWater214=null;
  assert.equal(n.g.heroActions133.pose(),null,stop);
 }
});

test('214 hero: malformed support claims, bad timesteps and stale progress cannot forge work',()=>{
 const f=fixture(),{g}=f;f.begin();f.advance(.04);const valid=f.view(),first=g.heroActions133.pose();
 for(const dt of[0,-1,NaN,Infinity,.26,.04])assert.equal(g.heroActions133.observeWaterWork214(dt),false);assert.deepEqual(g.heroActions133.pose(),first);
 for(const change of[{siteId:'P0002'},{supportId:'P0001:205:static:07'},{supportId:'P0001:0:7'},{supportKind:'oven'},{kind:'meal'},{elapsed:0,progress:0},{elapsed:NaN},{elapsed:Infinity},{duration:0},{progress:.9},{start:NaN},{amount:0},{amount:Infinity},{anchor:{x:10,y:20,z:1}},{workTarget:{x:NaN,y:20,z:0}}]){
  f.set({...valid,...change});assert.equal(g.heroActions133.observeWaterWork214(.04),false,JSON.stringify(change));assert.equal(g.heroActions133.pose(),null);
 }
 f.set(valid);assert.equal(g.heroActions133.observeWaterWork214(.04),false,'Rejected views do not allow already observed progress to replay');
});

test('214 hero: no render read uses RNG, wall time, saves or a foreign singleton, and lifecycle reset clears it',()=>{
 const f=fixture('prepare'),{g}=f;f.begin();f.advance(.04);const first=g.heroActions133.pose(),random=Math.random,now=Date.now,globalDescriptor=Object.getOwnPropertyDescriptor(globalThis,'DEADWALL');
 Math.random=()=>assert.fail('RNG read');Date.now=()=>assert.fail('Wall clock read');Object.defineProperty(globalThis,'DEADWALL',{configurable:true,get(){assert.fail('Foreign game singleton read');}});
 try{assert.deepEqual(g.heroActions133.pose(),first);}finally{Math.random=random;Date.now=now;if(globalDescriptor)Object.defineProperty(globalThis,'DEADWALL',globalDescriptor);else delete globalThis.DEADWALL;}
 for(const name of['restoreSave','startNew']){g[name]();assert.equal(g.heroActions133.pose(),null);f.begin();f.advance(.04);assert.equal(g.heroActions133.pose()?.kind,'build');}
 g.returnToMenu();assert.equal(g.heroActions133.pose(),null);
});
