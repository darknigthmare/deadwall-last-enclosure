'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),R=C.VerticalRules175,G=require('../src/vertical-geometry175.js'),V=require('../src/vertical-citadel175.js');
const {boot127}=require('./helpers/expansions127.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(type='cityFoundation'){
 const {game:g,...env}=boot127();g.startNew('standard',12345);g.paused=false;g.activeOverlay=null;
 const a=V.install(g);const qualified=g.serialize();qualified.urban.peakScore=2000;qualified.urban.progression151={version:1,age:10};assert.equal(g.restoreSave(qualified),true);g.paused=false;g.activeOverlay=null;
 // QA fixture only: allocate resources and select an unlocked age. No production
 // code grants these values or calls this fixture.
 g.resources=C.makeBag({wood:100000,scrap:100000,stone:100000,ammo:100000,food:100000,fuel:100000});g.tier=C.CITY_TIERS[10];
 let b;for(let y=10;y<110&&!b;y+=12)for(let x=10;x<110&&!b;x+=12)if(g.placeOne(type,x,y))b=[...g.world.buildings.values()].find(b=>b.type===type);
 assert.ok(b,'fixture finds a legal footprint');b.progress=1;b.health=b.maxHealth;a.reconcile();g.tier=C.CITY_TIERS[10];
 const p=a.entry(b.id);g.player.x=p.x*32;g.player.y=p.y*32;
 const advance=seconds=>{for(let i=0;i<Math.ceil(seconds/.2);i++){g.elapsed+=.2;a.step(.2);}};
 return{g,a,b,advance,...env};
}
function upstairs(f,level=6){assert.equal(f.a.travelTo(f.b.id,level).ok,true);f.advance(level/R.stairsSpeed+1);assert.equal(f.a.height(),level);}
function installModule(f,kind='dormitory',slot=0,level=f.a.height()){
 const p=f.a.landing(f.b.id);f.g.player.x=p.x*32;f.g.player.y=p.y*32;f.g.tier=C.CITY_TIERS[10];
 assert.equal(f.a.startWork('module',f.b.id,level,slot,kind).ok,true);f.advance(R.modules[kind].seconds+1);
 assert.ok(f.a.snapshot().structures[0].modules.some(m=>m.kind===kind&&m.slot===slot));
}
function atGun(f,slot=0){const p=f.a.modulePoint(f.b.id,slot);f.g.player.x=(p.x+1)*32;f.g.player.y=p.y*32;}
function armed(){const f=fixture('bastion12');upstairs(f,12);installModule(f,'gun');atGun(f);f.g.player.carry.ammo=120;assert.equal(f.a.startWork('reload',f.b.id,12,0).ok,true);f.advance(4);f.b.powered=true;assert.equal(f.a.mount(f.b.id,12,0).ok,true);return f;}
const box={x0:2,y0:-1,z0:-1,x1:3,y1:1,z1:1};
test('metric ray: nearest exact box, parallel miss, behind, inside',()=>{
 assert.equal(G.rayBox({x:0,y:0,z:0},{x:1,y:0,z:0},box,10),2);
 assert.equal(G.rayBox({x:0,y:2,z:0},{x:1,y:0,z:0},box,10),null);
 assert.equal(G.rayBox({x:4,y:0,z:0},{x:1,y:0,z:0},box,10),null);
 assert.equal(G.rayBox({x:2.5,y:0,z:0},{x:1,y:0,z:0},box,10),0);
 assert.equal(G.rayBox({x:NaN,y:0,z:0},{x:1,y:0,z:0},box,10),null);
 assert.equal(G.firstHit({x:0,y:0,z:0},{x:1,y:0,z:0},[{...box,id:1},{...box,x0:1,id:2}],10).box.id,2);
});
test('near clipping and projection stay finite across the camera plane',()=>{
 const p=G.clipNear([{x:0,y:0,z:-2},{x:1,y:1,z:2},{x:-1,y:1,z:2}],.1);assert.equal(p.length,4);assert.ok(p.every(v=>v.z>=.1-1e-9));
 assert.ok(p.map(v=>G.project(v,1280,720,R.fov)).every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
});
test('unions permit connected platforms, but not gaps or unsupported radius',()=>{
 const a={x0:0,y0:0,x1:2,y1:2},b={x0:2,y0:0,x1:4,y1:2};assert.equal(G.supported([a,b],2,1,.2),true);assert.equal(G.supported([a],2,1,.2),false);assert.equal(G.supported([a,{...b,x0:3}],2.5,1,0),false);
});
test('all six supports have priced native definitions and no age or enemy-cap change',()=>{
 assert.equal(Object.keys(R.supports).length,6);assert.equal(C.CITY_TIERS.length,11);assert.equal(C.PERFORMANCE_LIMITS.zombies,720);
 for(const[id,r]of Object.entries(R.supports)){assert.equal(C.BUILDINGS[id].unlockTier,r.tier);assert.ok(Object.values(r.cost).every(v=>v>0));assert.ok(r.height>=6);assert.ok(Object.isFrozen(r));}
 assert.deepEqual([3,5,7,9].map(t=>V.maxFoundationFloors(t)),[2,3,5,8]);
});
test('empty legacy record migrates without stocks or actor changes',()=>assert.deepEqual(V.normalize(undefined),V.initial()));
test('codec rejects extra properties, invalid values and unknown module names',()=>{
 const base={version:1,structures:[{id:7,levels:[6],lift:false,modules:[],stress:0}],actor:null};
 for(const bad of [{...base,extra:1},{...base,version:2},{...base,actor:{id:7,level:12}}])assert.throws(()=>V.normalize(bad));
 for(const value of [NaN,Infinity,-1,61]){const x=clone(base);x.structures[0].levels=[value];assert.throws(()=>V.normalize(x));}
 const x=clone(base);x.structures[0].modules=[{kind:'__proto__',level:6,slot:0,ammo:0,cooldown:0,heat:0,locked:false,mode:'hold'}];assert.throws(()=>V.normalize(x));
});
test('native traversal takes active time, freezes in pause and forbids teleport access',()=>{
 const f=fixture();f.g.player.x+=1000;assert.equal(f.a.travelTo(f.b.id,6).ok,false);const e=f.a.entry(f.b.id);f.g.player.x=e.x*32;f.g.player.y=e.y*32;
 assert.equal(f.a.travelTo(f.b.id,6).ok,true);f.advance(1);assert.ok(f.a.height()>0&&f.a.height()<6);const before=f.a.height();f.g.paused=true;f.advance(3);assert.equal(f.a.height(),before);f.g.paused=false;f.advance(6);assert.equal(f.a.height(),6);
});
test('active stairs do not grant immunity or consume materials',()=>{
 const f=fixture(),bag=clone(f.g.resources);upstairs(f);assert.deepEqual(f.g.resources,bag);assert.equal(f.g.player.invulnerable,0);
});
test('upper floor movement respects edges, fixtures and blocks ground placement',()=>{
 const f=fixture();upstairs(f);const before={x:f.g.player.x,y:f.g.player.y};f.g.moveFriendly(f.g.player,10000,0);assert.ok(f.g.player.x<f.b.right);assert.ok(f.g.player.x>=before.x);assert.equal(f.g.placeOne('house',50,50),false);
 installModule(f);const p=f.a.modulePoint(f.b.id,0);assert.equal(f.a.onDeck(p.x,p.y,6),false);
});
test('completed upper housing changes native metrics exactly once',()=>{
 const f=fixture();upstairs(f);const before=f.g.resources.wood,base=f.g.housing;installModule(f);assert.equal(f.g.resources.wood,before-R.modules.dormitory.cost.wood);assert.equal(f.b.def.housing,8);assert.equal(f.g.housing,base+8);f.advance(3);assert.equal(f.g.resources.wood,before-R.modules.dormitory.cost.wood);
});
test('cancel, movement and missing final materials do not commit a module',()=>{
 const f=fixture();upstairs(f);const before=f.g.resources.wood;
 assert.equal(f.a.startWork('module',f.b.id,6,0,'dormitory').ok,true);f.advance(3);f.a.stopWork();assert.equal(f.g.resources.wood,before);
 assert.equal(f.a.startWork('module',f.b.id,6,0,'dormitory').ok,true);f.g.player.x+=32;f.advance(.2);assert.equal(f.a.job,null);
 const p=f.a.landing(f.b.id);f.g.player.x=p.x*32;f.g.player.y=p.y*32;assert.equal(f.a.startWork('module',f.b.id,6,0,'dormitory').ok,true);f.g.resources.wood=0;f.advance(25);assert.equal(f.a.snapshot().structures[0].modules.length,0);
});
test('foundation floors are paid in sequence and gated by the existing age',()=>{
 const f=fixture(),stone=f.g.resources.stone;f.g.tier=C.CITY_TIERS[3];assert.equal(f.a.startWork('raise',f.b.id).ok,true);f.advance(61);assert.deepEqual(f.a.snapshot().structures[0].levels,[6,12]);assert.equal(f.g.resources.stone,stone-R.raiseCost.stone);f.g.tier=C.CITY_TIERS[3];assert.equal(f.a.startWork('raise',f.b.id).ok,false);
});
test('a lift is never free and power loss stops its actual travel',()=>{
 const f=fixture();assert.equal(f.a.travelTo(f.b.id,6,'lift').ok,false);assert.equal(f.a.startWork('lift',f.b.id).ok,true);f.advance(41);assert.equal(f.a.snapshot().structures[0].lift,true);assert.equal(f.b.def.powerUse,1+R.liftPower);
 f.b.powered=true;assert.equal(f.a.travelTo(f.b.id,6,'lift').ok,true);f.advance(1);const h=f.a.height();f.b.powered=false;f.advance(2);assert.equal(f.a.height(),h);f.b.powered=true;f.advance(6);assert.equal(f.a.height(),6);
});
test('turrets begin empty; reloading transfers finite carried ammo only',()=>{
 const f=fixture('bastion12');upstairs(f,12);installModule(f,'gun');let m=f.a.snapshot().structures[0].modules[0];assert.equal(m.ammo,0);atGun(f);assert.equal(f.a.startWork('reload',f.b.id,12,0).ok,false);f.g.player.carry.ammo=17;const stock=f.g.resources.ammo;assert.equal(f.a.startWork('reload',f.b.id,12,0).ok,true);f.advance(4);assert.equal(f.a.snapshot().structures[0].modules[0].ammo,17);assert.equal(f.g.player.carry.ammo,0);assert.equal(f.g.resources.ammo,stock);
});
test('possessed classic and FPS views share one gun and one ammunition owner',()=>{
 const f=armed();const p=f.a.modulePoint(f.b.id,0);f.g.input.mouseWorldX=(p.x-40)*32;f.g.input.mouseWorldY=(p.y-20)*32;assert.equal(f.a.fireMounted(),true);assert.equal(f.a.snapshot().structures[0].modules[0].ammo,119);
 assert.equal(f.a.fireMounted(),false);f.advance(1);assert.equal(f.a.switchView().view,'fps');f.a.setAim(-Math.PI*.75,-.25);assert.equal(f.a.fireMounted(),true);assert.equal(f.a.snapshot().structures[0].modules[0].ammo,118);f.a.leavePost();assert.equal(f.a.view,'classic');assert.equal(f.g.input.mouseDown,false);
});
test('mounted gun obeys power, pause, cooldown, finite heat and ammunition',()=>{
 const f=armed();f.a.switchView();f.b.powered=false;assert.equal(f.a.fireMounted(),false);f.b.powered=true;f.g.paused=true;assert.equal(f.a.fireMounted(),false);f.g.paused=false;
 f.g.input.mouseDown=true;f.advance(8);const m=f.a.snapshot().structures[0].modules[0];assert.ok(m.ammo<120&&m.ammo>0);assert.ok(m.heat>=0&&m.heat<=R.overheat+R.modules.gun.heatPerShot);assert.ok(m.cooldown<=1/R.modules.gun.fireRate);
});
test('views and overview are read-only, including the simulation RNG',()=>{
 const f=armed();f.a.switchView();const before=JSON.stringify(f.a.snapshot()),elapsed=f.g.elapsed,rng=f.g.random.state;for(let i=0;i<4;i++){f.g.render();f.a.overview();f.a.actions();f.a.scene();}assert.equal(JSON.stringify(f.a.snapshot()),before);assert.equal(f.g.elapsed,elapsed);assert.equal(f.g.random.state,rng);
});
test('monumental corpse thresholds scale with actual wall height',()=>{
 const f=fixture('bastion12');f.b.corpseLoad=40;assert.equal(f.g.zombieCanClimb({id:1,kind:'runner'},f.b),false);f.b.corpseLoad=200;assert.equal(f.g.zombieCanClimb({id:1,kind:'runner'},f.b),true);assert.equal(f.g.zombieCanClimb({id:1,kind:'armored'},f.b),false);
});
test('destroying an occupied support ejects the station and resolves a real fall',()=>{
 const f=armed();f.a.switchView();f.g.player.invulnerable=0;f.g.destroyBuilding(f.b);assert.equal(f.a.mounted,null);assert.equal(f.a.view,'classic');assert.equal(f.a.snapshot().actor,null);assert.equal(f.a.snapshot().structures.length,0);assert.ok(f.g.player.health<100);
});
test('module-only save validates duplicate slots, orphan supports and ammo bounds',()=>{
 const f=armed(),data=f.a.snapshot();assert.deepEqual(V.normalize(data),data);
 for(const mutate of [x=>x.structures[0].modules.push(clone(x.structures[0].modules[0])),x=>x.structures[0].modules[0].ammo=999,x=>x.structures[0].id=999]){
  const x=clone(data);mutate(x);assert.throws(()=>V.normalize(x,{buildings:[{id:f.b.id,type:f.b.type,gx:f.b.gx,gy:f.b.gy,rotation:0,progress:1,health:3200}],player:{x:f.g.player.x,y:f.g.player.y,dead:false}}));
 }
});
test('source distribution includes both runtime modules in index/server/build/PWA',()=>{
 const fs=require('node:fs'),path=require('node:path');for(const f of ['index.html','scripts/server.mjs','scripts/build.mjs','sw.js'])for(const name of ['vertical-geometry175.js','vertical-citadel175.js'])assert.ok(fs.readFileSync(path.join(__dirname,'..',f),'utf8').includes(name),f+' includes '+name);
});
test('full native save roundtrip preserves payload, floor and finite ammunition; view resets',()=>{
 const f=armed();f.a.switchView();f.a.setAim(-2,-.3);const before=f.a.snapshot(),bag=clone(f.g.resources),saved=f.g.serialize();
 assert.equal(f.g.restoreSave(saved),true);assert.deepEqual(f.a.snapshot(),before);assert.deepEqual(f.g.resources,bag);assert.equal(f.a.view,'classic');assert.equal(f.a.mounted,null);
});
test('a mid-stair save resumes at the last stable landing without gaining materials',()=>{
 const f=fixture(),p={x:f.g.player.x,y:f.g.player.y};assert.equal(f.a.travelTo(f.b.id,6).ok,true);f.advance(2);assert.ok(f.a.height()>0&&f.a.height()<6);const saved=f.g.serialize();assert.equal(saved.player.x,p.x);assert.equal(saved.player.y,p.y);
 assert.equal(f.g.restoreSave(saved),true);assert.equal(f.a.height(),0);assert.equal(f.a.travel,null);assert.equal(f.g.player.x,p.x);assert.equal(f.g.player.y,p.y);
});
test('invalid vertical save is transactional and does not replace the native world',()=>{
 const f=armed(),world=f.g.world,before=JSON.stringify(f.a.snapshot()),saved=f.g.serialize();saved.expansions127.modules.vertical175.structures[0].modules[0].ammo=9999;
 assert.throws(()=>f.g.restoreSave(saved));assert.equal(f.g.world,world);assert.equal(JSON.stringify(f.a.snapshot()),before);
});
test('starting a real new game removes the extension state without prebuilding anything',()=>{
 const f=armed();f.g.startNew('standard',4321);assert.deepEqual(f.a.snapshot(),V.initial());assert.equal([...f.g.world.buildings.values()].some(b=>b.def.vertical175),false);assert.equal(f.a.view,'classic');
});
test('the existing update loop actually advances the registered extension, not only its test API',()=>{
 const f=fixture();assert.equal(f.a.travelTo(f.b.id,6).ok,true);const old=f.a.height();f.g.update(.04);assert.ok(f.a.height()>old);f.g.paused=true;const h=f.a.height();f.g.update(.04);assert.equal(f.a.height(),h);
});
test('degraded supports shed overload only after active-time warning and no resource refund',()=>{
 const f=fixture();upstairs(f);installModule(f,'dormitory',0);installModule(f,'store',1);installModule(f,'store',2);const s=f.a.snapshot().structures[0];assert.equal(s.modules.length,3);f.b.health=f.b.maxHealth*.35;const before=clone(f.g.resources);assert.equal(f.a.loadReport(f.b.id).overloaded,true);f.advance(3);assert.equal(f.a.snapshot().structures[0].modules.length,3);f.g.paused=true;f.advance(10);assert.equal(f.a.snapshot().structures[0].modules.length,3);f.g.paused=false;f.advance(6);assert.equal(f.a.snapshot().structures[0].modules.length,0);assert.deepEqual(f.g.resources,before);
});
test('colossi replace counted wave slots only after both age and wave gates',()=>{
 const f=fixture();f.g.wave=18;f.g.tier=C.CITY_TIERS[4];f.g.prepareWave();assert.equal(f.g.wavePlan.composition.colossusBreaker,0);
 f.g.tier=C.CITY_TIERS[5];f.g.prepareWave();assert.equal(f.g.wavePlan.composition.colossusBreaker,1);assert.equal(Object.values(f.g.wavePlan.composition).reduce((a,b)=>a+b,0),f.g.wavePlan.total);
 f.g.wave=48;f.g.tier=C.CITY_TIERS[9];f.g.prepareWave();assert.equal(f.g.wavePlan.composition.colossusSiege,1);assert.equal(Object.values(f.g.wavePlan.composition).reduce((a,b)=>a+b,0),f.g.wavePlan.total);
});
test('real colossi use native health, hitboxes, persistence and the same active cap',()=>{
 const f=fixture();f.g.wave=48;assert.equal(f.g.spawnZombie('colossusSiege'),true);const z=f.g.zombies.at(-1),d=C.ENEMIES.colossusSiege;assert.equal(z.radius,d.radius);assert.ok(z.x>=z.radius&&z.y>=z.radius);assert.ok(z.maxHealth<=d.health*1.34*f.g.difficulty.enemyHealth);
 const box=f.a.scene().find(b=>b.zombie===z);assert.equal(box.z1,15);z.health-=20;const health=z.health,saved=f.g.serialize();assert.equal(f.g.restoreSave(saved),true);assert.equal(f.g.zombies.find(b=>b.id===z.id).health,health);assert.equal(C.PERFORMANCE_LIMITS.zombies,720);
});

test('an empty wall roof cannot hide an overloaded occupied lower floor',()=>{
 const f=fixture('rampart24');upstairs(f,6);installModule(f,'store',0);installModule(f,'store',1);installModule(f,'store',2);
 f.b.health=f.b.maxHealth*.35;assert.equal(f.a.loadReport(f.b.id).overloaded,true);f.advance(9);
 assert.equal(f.a.snapshot().structures[0].modules.length,0);assert.equal(f.a.loadReport(f.b.id).overloaded,false);
 assert.deepEqual(f.a.snapshot().structures[0].levels,[6,12,18,24]);
});
test('native ground services cannot interact vertically through an occupied floor',()=>{
 const f=fixture();upstairs(f);assert.equal(f.g.workerCanWorkAt(f.g.player,f.b,1000),false);
 assert.equal(f.g.workerCanWorkAt({x:f.g.player.x,y:f.g.player.y},f.g.player,1000),false);
});
