'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),Survey=require('../src/frontier-survey.js');
const {legacyAge}=require('./helpers/legacy-city.cjs');
function fresh(){const{g}=boot131();g.phaseTime=999;g.units=[];return g;}
function add(g,type,x,y,progress=1){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,progress);g.world.add(b);g.refreshMetrics(true);return b;}
function ticks(g,n,method='update'){for(let i=0;i<n;i++)g[method](.04);}
function paidPrepare(g,b,method){g.selectBuilding(b);standAt(g,g.player,b);const q=g.defense131[method](b.id);assert.ok(q.ok,q.reason);}
function late(g){
 // Prepared historical knowledge isolates endgame transactions, not current 1.51 campaign progression.
 for(let i=0;i<40;i++)add(g,'megaTower',3+i%8*7,3+Math.floor(i/8)*7);
 add(g,'warehouse',4,43);add(g,'logisticsCenter',9,43);add(g,'logisticsHub',16,43);add(g,'generator',26,43);add(g,'powerPlant',31,43);
 g.refreshMetrics(true);legacyAge(g,C.Urban.score(g.world.buildings.values()));for(const k of C.RESOURCE_KEYS)g.resources[k]=5000;
 g.restoreSave(g.serialize());assert.equal(g.tier.id,10);assert.ok(g.cityScore>=1850);assert.ok(g.storage>=5000);
}
function visit(g,p){const raw=g.serialize(),q=G.global(p,p.w/2,-2);Object.assign(raw.frontier,{active:true,...q,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});if(!raw.frontier.seen.includes(p.id))raw.frontier.seen.push(p.id);for(let i=0;i<g.frontier.world().threatCount(p);i++)raw.frontier.enemies[p.id+':e'+i]=0;raw.frontier.kills=Object.values(raw.frontier.enemies).filter(x=>x===0).length;g.restoreSave(raw);}

test('QA10 — dix modules chargés : dernier palier, coût et vrai chantier de mégaréserve avec budget fini',()=>{
 const g=fresh();late(g);assert.equal(g.expansions.entries().length,10);assert.equal(g.frontier.position().generation,5);
 // The procedural plan may put a road or house on the former fixed fixture.
 // Select a genuinely vacant footprint; keep the terrain and its resources intact.
 let site=null;for(let y=45;y<110&&!site;y++)for(let x=45;x<110&&!site;x++)if(g.world.placement(C.BUILDINGS.megaReserve,x,y,0).valid)site={x,y};
 assert.ok(site,'La mégaréserve doit trouver une emprise réellement constructible.');
 const before={...g.resources},capacity=g.storage;assert.equal(g.placeOne('megaReserve',site.x,site.y),true);
 const b=[...g.world.buildings.values()].find(b=>b.type==='megaReserve');assert.equal(b.progress,0);assert.equal(g.storage,capacity);
 for(const[k,n]of Object.entries(C.BUILDINGS.megaReserve.cost))assert.equal(g.resources[k],before[k]-n);
 paidPrepare(g,b,'equipWorksite');const point=standAt(g,g.player,b),u=g.createProtectedSurvivor('worker',point.x,point.y);assert.ok(u);assert.equal(g.setWorkerOrder('build'),true);
 ticks(g,100,'updateUnits');const early=b.progress;assert.ok(early>0&&early<1);const work=g.defense131.snapshot().posts.find(p=>p.id===b.id).work;assert.ok(work<8);
 g.restoreSave(g.serialize());assert.equal(g.defense131.snapshot().posts.find(p=>p.id===b.id).work,work);
 ticks(g,1900,'updateUnits');const finished=g.world.buildings.get(b.id);assert.equal(finished.completed,true);g.refreshMetrics(true);assert.equal(g.storage,capacity+C.BUILDINGS.megaReserve.storage);
 assert.equal(g.defense131.snapshot().posts.some(p=>p.id===b.id),false);assert.equal(g.tier.id,10);assert.ok(g.save(false));
});

test('QA10 — vagues 20 à 10000 : effectifs croissants, quatre fronts, santé plafonnée et attente compacte sauvegardable',()=>{
 const g=fresh();let previous=0;for(const wave of [20,100,500,10000]){const plan=C.wavePlan(wave,g.difficulty,1000);assert.ok(plan.total>previous);previous=plan.total;assert.equal(plan.fronts,4);assert.equal(Object.values(plan.composition).reduce((a,b)=>a+b,0),plan.total);assert.ok(C.enemyHealthScale(wave)<=1.34);}
 g.wave=10000;g.phaseTime=0;g.updateDirector(.04);assert.equal(g.phase,'warning');const total=g.wavePlan.total;
 g.phaseTime=0;g.updateDirector(.04);assert.equal(g.phase,'assault');g.spawnTimer=-1000;g.updateDirector(.04);
 assert.equal(g.zombies.length,C.PERFORMANCE_LIMITS.zombies);assert.ok(g.spawnQueue.length<=64);assert.equal(g.zombies.length+g.spawnQueue.length+C.spawnCount(g.pendingSpawns),total);
 const pending=C.spawnCount(g.pendingSpawns)+g.spawnQueue.length,health=g.zombies.map(z=>z.health);g.restoreSave(g.serialize());assert.equal(g.phase,'assault');assert.equal(g.wave,10000);assert.equal(C.spawnCount(g.pendingSpawns)+g.spawnQueue.length,pending);assert.deepEqual(g.zombies.map(z=>z.health),health);
});

test('QA10 — trois nuits accélérées hors D-17 : consigne, tirs, réserves et récompenses uniques à la reprise',()=>{
 const g=fresh(),gate=add(g,'gate',68,68),tower=add(g,'watchtower',75,68);paidPrepare(g,gate,'configureGate');
 g.player.x=2048;g.player.y=20;assert.equal(g.frontier.enter(),true);
 for(let night=1;night<=3;night++){
  g.phaseTime=0;g.updateDirector(.04);ticks(g,52);assert.equal(g.phase,'warning');assert.equal(g.world.buildings.get(gate.id).gateMode,'closed');g.phaseTime=0;g.updateDirector(.04);
  // Emit every real planned contact, then scripted kills advance the director quickly.
  // One target each night is fought by the actual automatic defense below.
  g.spawnZombie('walker');const enemy=g.zombies.at(-1);enemy.x=tower.x+100;enemy.y=tower.y;enemy.health=1;g.rebuildBuckets();const ammo=g.resources.ammo;let minimumAmmo=ammo;for(let n=0;n<90&&!enemy.dead;n++){g.update(.04);minimumAmmo=Math.min(minimumAmmo,g.resources.ammo);}assert.ok(enemy.dead);assert.ok(minimumAmmo<ammo,'Le tir doit consommer une cartouche avant un éventuel butin de mort.');
  for(let rounds=0;g.phase==='assault'&&rounds<100;rounds++){g.spawnTimer=-1000;g.updateDirector(.04);for(const z of g.zombies)g.killZombie(z,false);g.zombies=[];g.updateDirector(.04);}
  assert.equal(g.phase,'aftermath');const reward={...g.resources},insight=g.research.insight,survived=g.stats.wavesSurvived;
  for(let n=0;n<3;n++){g.restoreSave(g.serialize());assert.deepEqual(g.resources,reward);assert.equal(g.research.insight,insight);assert.equal(g.stats.wavesSurvived,survived);}
  g.phaseTime=0;g.updateDirector(.04);assert.equal(g.phase,'calm');assert.equal(g.wave,night+1);ticks(g,52);assert.equal(g.world.buildings.get(gate.id).gateMode,'auto');assert.equal(g.frontier.active(),true);
 }
 assert.equal(g.stats.wavesSurvived,3);assert.equal(g.gameOver,false);
});

test('QA10 — commandant en région : un infecté au centre peut réellement terminer la campagne',()=>{
 const g=fresh(),core=g.core();g.player.x=2048;g.player.y=20;assert.equal(g.frontier.enter(),true);g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=core.left-z.radius-1;z.y=core.y;z.attackCooldown=0;core.health=1;g.rebuildBuckets();
 ticks(g,30);assert.equal(g.gameOver,true);assert.equal(core.dead,true);assert.equal(g.frontier.active(),true);const elapsed=g.elapsed,stock={...g.resources};const render=g.render;g.render=()=>{};g.loop(g.lastFrame+40);g.loop(g.lastFrame+40);g.render=render;assert.equal(g.elapsed,elapsed);assert.deepEqual(g.resources,stock);
});

test('QA10 — arsenal tardif : stockage plein et intrants épuisés arrêtent une production sans ressources gratuites',()=>{
 const g=fresh();late(g);const arsenal=add(g,'cityArsenal',42,43);g.refreshMetrics(true);g.resources.ammo=g.storage;const scrap=g.resources.scrap;
 ticks(g,25,'economyTick');assert.equal(g.resources.ammo,g.storage);assert.equal(g.resources.scrap,scrap);
 g.resources.ammo=0;g.resources.scrap=0;ticks(g,25,'economyTick');assert.equal(g.resources.ammo,0);assert.equal(g.resources.scrap,0);const fuel=g.resources.fuel;
 g.resources.scrap=10;g.refreshMetrics(true);ticks(g,25,'economyTick');assert.ok(g.resources.ammo>0);assert.ok(g.resources.scrap<10);assert.ok(g.resources.fuel<fuel);assert.ok(arsenal.completed);
});

test('QA10 — ressources finies et occupants : éviction de caches et six reprises sans résurrection ni récompense',()=>{
 const g=fresh(),w=g.frontier.world(),p=w.pois.find(p=>p.generation===5&&p.occupation==='infected'&&p.frontier131.reserve);visit(g,p);g.player.carry=C.makeBag({scrap:8});
 assert.ok(g.worldOps131.begin('reserve',p.id).ok);for(let n=0;n<82;n++)g.worldOps131.step(.1);assert.ok(g.worldOps131.opened(p.id));const crate=p.outdoor.find(o=>o.id===p.frontier131.reserve),raw=g.serialize();raw.frontier.taken[crate.id]=crate.amount;g.restoreSave(raw);
 const stocks={home:{...g.resources},carry:{...g.player.carry}},kills=g.frontier.snapshot().kills;
 for(let n=0;n<6;n++){for(let x=30;x<65;x++)w.chunk(x,75);for(const other of w.pois.slice(-60))w.plan(other,0);g.restoreSave(g.serialize());assert.equal(g.frontier.snapshot().taken[crate.id],crate.amount);assert.equal(g.frontier.snapshot().kills,kills);for(let i=0;i<w.threatCount(p);i++)assert.equal(g.frontier.enemyHealth(p.id+':e'+i),0);assert.deepEqual(g.resources,stocks.home);assert.deepEqual(g.player.carry,stocks.carry);assert.equal(g.worldOps131.preview('reserve',p.id).ok,false);}
 assert.ok(w.cacheSize()<=25);assert.ok(w.planCacheSize()<=48);
});

test('QA10 — 128 postes : refus du 129e sans coût et sauvegarde valide',()=>{
 const g=fresh(),raw=g.serialize();for(let i=0;i<129;i++){const b=add(g,'woodWall',2+i%40*2,90+Math.floor(i/40)*2);if(i<128)raw.expansions127.modules.defense131.posts.push({id:b.id,gate:null,maintenance:null,work:0,arc:null});}
 // Use real paid maintenance records in the valid fixture, rather than no-op posts.
 const data=g.serialize();data.expansions127.modules.defense131.posts=raw.expansions127.modules.defense131.posts.map(p=>({...p,maintenance:{...C.Defense131Rules.maintenanceCost}}));g.restoreSave(data);
 const target=[...g.world.buildings.values()].filter(b=>b.type==='woodWall').at(-1);g.selectBuilding(target);standAt(g,g.player,target);const stock={...g.resources},q=g.defense131.startMaintenance(target.id);assert.equal(q.ok,false);assert.match(q.reason,/Limite/);assert.deepEqual(g.resources,stock);assert.equal(g.defense131.snapshot().posts.length,128);assert.ok(g.save(false));
});

test('QA10 — 120000 identifiants générés : le nouvel ID est refusé, un ancien continue et le fichier reste valide',()=>{
 const g=fresh(),w=g.frontier.world(),raw=g.serialize(),limit=C.Frontier.MAX_TAKEN;assert.equal(limit,120000);
 let point,targets;
 for(let x=92;x<96&&!point;x++)for(const tree of w.chunk(x,95).trees){for(let a=0;a<16;a++){
  const p={x:tree.x+Math.cos(a*Math.PI/8)*(tree.r+.8),y:tree.y+Math.sin(a*Math.PI/8)*(tree.r+.8),z:0,inside:null};
  if(w.blocked(p.x,p.y,.32,0,null))continue;const ts=Survey.targets(w,p,{});if(ts.length===2&&ts.every(t=>t.kind==='tree')){point=p;targets=ts;break;}
 }if(point)break;}
 assert.ok(point,'Deux arbres accessibles pour tester ancien et nouveau prélèvement au même endroit.');
 const [freshTarget,knownTarget]=targets;let count=0;
 for(let y=0;y<96&&count<limit-1;y++)for(let x=0;x<96&&count<limit-1;x++)for(const b of [...w.chunk(x,y).trees,...w.chunk(x,y).rocks]){
  if(count===limit-1)break;if(b.id===freshTarget.id||b.id===knownTarget.id)continue;raw.frontier.taken[b.id]=.01;count++;
 }
 raw.frontier.taken[knownTarget.id]=.01;assert.equal(Object.keys(raw.frontier.taken).length,limit);
 Object.assign(raw.frontier,point,{active:true,anchor:{x:g.player.x,y:g.player.y}});
 // This deliberately large fixture goes through the complete validator and real restore.
 // It does not pretend that 120000 containers were physically harvested in this test.
 g.restoreSave(raw);const before={...g.player.carry},gathered=g.stats.gathered;g.input.keys.add('KeyE');g.updatePlayer(.04);
 assert.match(g.interactionText,/Limite du carnet/);assert.deepEqual(g.player.carry,before);assert.equal(g.stats.gathered,gathered);assert.equal(g.frontier.snapshot().taken[freshTarget.id],undefined);
 assert.equal(g.frontier.cycle(),true);g.updatePlayer(.04);g.input.keys.clear();const state=g.frontier.snapshot();assert.ok(state.taken[knownTarget.id]>.01);assert.equal(Object.keys(state.taken).length,limit);assert.ok(g.stats.gathered>gathered);
 assert.ok(Buffer.byteLength(JSON.stringify(g.serialize()))<globalThis.DeadwallSave.MAX_FILE_BYTES);assert.ok(g.save(false));
 g.startNew('standard','17117');assert.equal(Object.keys(g.frontier.snapshot().taken).length,0);
});
