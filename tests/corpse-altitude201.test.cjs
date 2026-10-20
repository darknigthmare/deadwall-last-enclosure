'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const C=require('../src/core.js'),V=require('../src/vertical-citadel175.js'),R=C.VerticalCitadel175,Q=C.VerticalSiege176;
const Render=require('../src/vertical-citadel175-render.js');
const copy=v=>JSON.parse(JSON.stringify(v));
// Serialization timestamps describe the read itself, not simulation state.
const snapshot=g=>{const d=copy(g.serialize());delete d.timestamp;return d;};

// Prepared native scene: paid native foundation and an ordinary generated
// runner climb. This is not a naturally reached late-age campaign.
function roof(){
 const {game:g}=boot127();V.install(g);g.startNew('standard','17117');
 const d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age:10};
 d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};assert.equal(g.restoreSave(d),true);
 let b=null;for(let x=38;x<85&&!b;x+=2)for(let y=38;y<85&&!b;y+=2)if(g.world.placement(C.BUILDINGS.rampart12,x,y,0).valid){
  assert.equal(g.placeOne('rampart12',x,y),true);b=g.world.atCell(x,y);b.progress=1;b.health=b.maxHealth;g.refreshMetrics(true);
 }assert.ok(b);
 g.spawnZombie('runner');const z=g.zombies.at(-1);z.x=b.x;z.y=b.top-R.tile;z.lastX=z.x;z.lastY=z.y;g.rebuildBuckets();
 b.corpseLoad=R.bases[b.type].height*Q.loadPerMetre/Q.corpseFaceShare+100;
 for(let n=0;n<10-1e-6;n+=.1){g.updateZombies(.1);g.rebuildBuckets();}
 assert.equal(g.vertical175.enemyPose(z).stage,'roof');assert.equal(g.vertical175.enemyPose(z).z,12);assert.equal(z.dead,false);
 return{g,b,z};
}

test('201 rooftop death preserves the real altitude, one kill and ground-pressure state through Continue',()=>{
 const {g,b,z}=roof(),before={load:b.corpseLoad,kills:g.stats.kills},pose=copy(g.vertical175.enemyPose(z));
 g.killZombie(z,false);const c=g.corpses.at(-1);
 assert.equal(c.altitude,pose.z);assert.equal(c.site,pose.site);assert.equal(c.level,pose.level);assert.equal(c.bridge,pose.bridge);
 assert.equal(c.x,z.x);assert.equal(c.y,z.y);assert.equal(b.corpseLoad,before.load);assert.equal(g.stats.kills,before.kills+1);
 assert.equal(g.vertical175.snapshot().climbers.length,0,'The live enemy reference is removed after death observes the pose');
 const save=g.serialize(),after={save:snapshot(g),corpses:copy(g.corpses)};g.killZombie(z,false);
 assert.deepEqual({save:snapshot(g),corpses:copy(g.corpses)},after,'A repeated death adds no loot, RNG, pressure or corpse');
 assert.equal(g.restoreSave(save),true);assert.equal(g.world.buildings.get(b.id).corpseLoad,before.load);
 assert.equal(g.corpses.length,0,'Visual corpses remain transient rather than adding a save register');
});

test('201 support destruction retains the last elevated corpse without inventing a ground pile or visible ground body',()=>{
 const {g,b,z}=roof(),load=b.corpseLoad,kills=g.stats.kills;
 g.destroyBuilding(b);const c=g.corpses.at(-1);
 assert.equal(z.dead,true);assert.equal(g.stats.kills,kills+1);assert.equal(c.altitude,12);
 assert.equal(b.corpseLoad,load);assert.equal(g.vertical175.snapshot().climbers.length,0);
 assert.equal(g.vertical175.corpseDepth(c),null,'No surface survives the destroyed support');
 assert.equal(g.depthEntries({left:0,top:0,right:C.WORLD_SIZE,bottom:C.WORLD_SIZE}).some(e=>e.entity===c),false);
 assert.equal(g.restoreSave(g.serialize()),true);
});

test('201 projected corpse paints once above its roof and below actors without advancing simulation or RNG',()=>{
 const {g,b,z}=roof();Render.install(g);g.killZombie(z,false);const c=g.corpses.at(-1),before=snapshot(g),body=JSON.stringify(c),y=c.y-c.altitude*R.projectedHeight;
 const entries=g.depthEntries({left:c.x-2,right:c.x+2,top:y-2,bottom:y+2}),selected=entries.filter(e=>e.entity===c);
 assert.equal(selected.length,1,'Culling uses the projected upper silhouette, not its old ground position');
 const deck=entries.find(e=>e.entity===b);assert.ok(deck,'The supporting deck remains visible in the same projected frame');
 assert.ok(entries.indexOf(deck)<entries.indexOf(selected[0]),'The actual native deck painter is queued before its corpse');
 assert.ok(selected[0].depth>b.bottom&&selected[0].depth<b.bottom+.05,'The corpse is above the roof but below native personnel');
 assert.equal(g.vertical175.corpseDepth({...c,bridge:undefined}),selected[0].depth,'An absent bridge field remains the roof surface');
 const calls=[];let balance=0;
 const ctx=new Proxy({save(){balance++;},restore(){balance--;}},{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args]);},set(o,k,v){o[k]=v;return true;}});
 selected[0].draw(ctx);
 assert.ok(calls.some(a=>a[0]==='translate'&&a[1]===0&&a[2]===-c.altitude*R.projectedHeight));
 assert.ok(calls.some(a=>a[0]==='translate'&&a[1]===c.x&&a[2]===c.y));assert.equal(balance,0);
 assert.deepEqual(snapshot(g),before);assert.equal(JSON.stringify(c),body);
 assert.equal(g.depthEntries({left:-1000,right:-900,top:-1000,bottom:-900}).some(e=>e.entity===c),false);
 g.updateEffects(99);assert.equal(g.corpses.includes(c),true);g.updateEffects(1);assert.equal(g.corpses.includes(c),false,'The native 100-second decay remains unchanged');
});

test('201 ground cleanup removes a ground corpse while retaining the elevated corpse at the same wall',()=>{
 const {g,b,z}=roof();g.spawnZombie('walker');const ground=g.zombies.at(-1);ground.x=b.x;ground.y=b.top-30;
 g.killZombie(ground,false);const low=g.corpses.at(-1);g.killZombie(z,false);const high=g.corpses.at(-1);
 assert.equal(Object.hasOwn(low,'altitude'),false);assert.equal(high.altitude,12);
 // Existing integer pressure-to-visual cleanup fixture, independent of the
 // large pile used solely to obtain the native roof climb.
 b.corpseLoad=1;const worker=g.units[0],point=g.workerCleanupPoint(worker,b);assert.ok(point);Object.assign(worker,point);
 assert.equal(g.workerCanWorkAt(worker,point,C.WORKER_RULES.cleanupRange),true);
 for(let i=0;i<5;i++)g.clearCorpsesWithWorker(worker,b,.25);
 assert.equal(b.corpseLoad,0);assert.equal(g.corpses.includes(low),false);assert.equal(g.corpses.includes(high),true);
});

test('201 native ground deaths retain their body shape, finite pressure, loot and random draw budget',()=>{
 const {g,b}=roof();g.spawnZombie('runner');const z=g.zombies.at(-1);z.x=b.x;z.y=b.top-30;
 const before={load:b.corpseLoad,kills:g.stats.kills,resources:copy(g.resources)},random=new C.Random(g.random.state);
 const rotation=random.range(0,Math.PI*2),scale=random.range(.8,1.2),drop=random.next();g.killZombie(z,false);const c=g.corpses.at(-1);
 assert.deepEqual(Object.keys(c).sort(),['age','kind','rotation','scale','x','y'].sort());assert.equal(c.rotation,rotation);assert.equal(c.scale,scale);assert.equal(g.random.state,random.state);
 assert.equal(b.corpseLoad,before.load+C.ENEMIES.runner.corpseLoad);assert.equal(g.stats.kills,before.kills+1);
 const expected=before.resources;if(drop<.06)expected.ammo=Math.min(g.storage,expected.ammo+1);else if(drop<.075)expected.medicine=Math.min(g.storage,expected.medicine+.5);
 assert.deepEqual(copy(g.resources),expected);
});

test('201 a legacy vertical owner without the corpse method keeps the historical ground death contract',()=>{
 const {g,b}=roof();g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=b.x;z.y=b.top-30;
 const load=b.corpseLoad,kills=g.stats.kills,owner=g.vertical175;
 g.vertical175={enemyPose(){throw new Error('Legacy death must not require the live-pose API');}};
 try{assert.doesNotThrow(()=>g.killZombie(z,false));}finally{g.vertical175=owner;}
 assert.equal(g.stats.kills,kills+1);assert.equal(b.corpseLoad,load+C.ENEMIES.walker.corpseLoad);
 assert.equal(Object.hasOwn(g.corpses.at(-1),'altitude'),false);
});
