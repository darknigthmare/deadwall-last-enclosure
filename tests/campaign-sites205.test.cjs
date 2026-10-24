'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js'),A=require('../src/codex-campaign205.js');
const {auditVariant205,auditPlacements205}=require('../scripts/audit-campaign-sites205.cjs');
const historical=require('./fixtures/campaign205-historical-prefix.json');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),copy=v=>JSON.parse(JSON.stringify(v));
const effects={detailVersion:13,ecologyVersion:1,hydrologyVersion:1};

test('205 contracts: four ground-level families adapt actual author geometry and one finite historical budget',()=>{
 assert.equal(A.types.length,4);assert.equal(A.variants,50);
 for(const type of A.types)for(const number of [1,10,11,25,50]){
  const result=auditVariant205(type,number);assert.equal(result.pass,true,result.id+' '+JSON.stringify(result));
  assert.equal(result.parentBudgetProfile,C.CampaignSites205Rules.parentProfiles[type]);assert.ok(result.lootContainers<result.props);
 }
 for(const [type,n]of [['EXT-MONDE-T044',1],['EXT-MONDE-T049',1],['EXT-MONDE-T045',0],['EXT-MONDE-T048',51]])assert.equal(A.typeFor(type,n),null);
 assert.equal(A.preset('house'),null);assert.equal(A.preset('__proto__'),null);assert.throws(()=>A.template('campaign205-045-00'),/inconnu/);
});

test('205 plans: pure reads preserve author flags, actual metric furniture, variants and per-instance entry coordinates',()=>{
 const type=A.typeFor('EXT-MONDE-T045',1),d=A.preset(type),p={...d,type,id:'P4900',x:1000,y:2000,a:0,generation:11},before=JSON.stringify(A.template(type).author),random=Math.random;
 Math.random=()=>assert.fail('Campaign205 inspection consumed simulation randomness');
 try{
  const a=A.plan(p),b=A.plan({...p,x:5000,y:6000,a:Math.PI/2}),t=A.template(type);
  assert.deepEqual(a.entry,G.global(p,t.base.entry.x,0));assert.deepEqual(b.entry,G.global({...p,x:5000,y:6000,a:Math.PI/2},t.base.entry.x,0));assert.notDeepEqual(a.entry,b.entry);
  assert.equal(t.author.playable,false);assert.equal(a.volumes160.length,t.author.buildings.length);assert.ok(a.volumes160.every(v=>v.w<p.w&&v.h<p.h));
  for(const o of [...a.objects,...A.details(p).interior]){const source=t.furnishing.props.find(s=>s.id===o.authorObjectId);assert.ok(source);assert.deepEqual([o.x,o.y,o.w,o.h,o.rotationRad],[source.x,source.y,source.w,source.h,source.rotationRad]);}
  assert.throws(()=>A.plan(p,1),/étage/);assert.equal(JSON.stringify(t.author),before);
 }finally{Math.random=random;}
});

for(const f of historical.fixtures)test('205 historical compatibility: released G'+f.generation+' seed'+f.seed+' retains site, road and interior fingerprints',()=>{
 const w=W.create(f.seed,f.generation,f.effects);assert.equal(w.pois.length,f.sites);assert.equal(hash(w.pois),f.poisSha256);assert.equal(hash(w.roads),f.roadsSha256);
 const witnesses=f.planWitnessIds.map(id=>{const p=w.pois.find(p=>p.id===id);return{id,levels:p.levels.map(z=>({z,plan:w.plan(p,z),details:w.detailAt(p,z)}))};});assert.equal(hash(witnesses),f.plansSha256);
 assert.equal(Object.hasOwn(w,'campaignCoverage205'),false);
});

test('205 seed admission: real G11 preserves G10, roads, unscaled doors and every authored walking connection',()=>{
 const result=auditPlacements205(17117);assert.equal(result.pass,true,JSON.stringify(result));assert.ok(result.sites.length>0&&result.sites.length<=8);
 const counts={};for(const p of result.sites)counts[p.typologyId]=(counts[p.typologyId]||0)+1;assert.ok(Object.values(counts).every(n=>n<=2));
});

for(const seed of [0,967313470])test('205 admission regression: seed'+seed+' refuses foreign carriageway corridors before publishing new sites',()=>{
 const result=auditPlacements205(seed);assert.equal(result.pass,true,JSON.stringify(result));assert.equal(result.historicalPrefixUnchanged,true);assert.ok(result.sites.length>0&&result.sites.length<=8);
 for(const site of result.sites){assert.equal(site.physicalAudit,true,site.id);assert.deepEqual(site.physicalChecks,{nativePathClear:true,doorClear:true,roadEntryClear:true,frontageClear:true,frontageReason:'connected'},site.id);}
});

function campaign(){
 const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs'),g=boot127().game;require('../src/world-pack131.js').install(g);
 globalThis.DeadwallCodexContext160=require('../src/codex-context160.js');
 g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();assert.equal(g.frontier.position().generation,8);
 const q=g.worldOps131.activateTerritories160();assert.equal(q.ok,true,q.reason);assert.equal(g.frontier.position().generation,10);return g;
}
const checkpoint=g=>{const d=copy(g.serialize());delete d.timestamp;return d;};

test('205 migration: preview is pure, activation is additive and finite, Continue never activates G11 on its own',()=>{
 const g=campaign(),old=g.frontier.world(),tree=old.chunk(48,48).trees[0];assert.ok(tree);
 const raw=g.serialize();raw.frontier.taken[tree.id]=1;assert.equal(g.restoreSave(raw),true);assert.equal(g.frontier.position().generation,10);
 const before=checkpoint(g),serialize=g.serialize,frontier=g.frontier;
 g.serialize=()=>assert.fail('Read-only preview serialized the campaign');g.frontier=Object.freeze({...frontier,snapshot:()=>assert.fail('Read-only preview synchronized regional actors')});
 try{const q=g.worldOps131.previewCampaignSites205();assert.equal(q.ok,true,q.reason);assert.equal(q.generation,11);assert.ok(q.addedSites>0&&q.addedSites<=8);assert.deepEqual(q.cost,{});
  const create=W.create;let calls=0;W.create=(...args)=>{calls++;return create(...args);};try{for(let i=0;i<3;i++)assert.equal(g.worldOps131.previewCampaignSites205().ok,true);assert.equal(calls,0,'Repeated dossier reads reuse the candidate model');}finally{W.create=create;}
 }finally{g.serialize=serialize;g.frontier=frontier;}
 assert.deepEqual(checkpoint(g),before);g.player.reload=1;assert.equal(g.worldOps131.previewCampaignSites205().ok,false);g.player.reload=0;
 assert.equal(g.worldOps131.activateCampaignSites205().ok,true);const after=checkpoint(g);assert.equal(after.frontier.generation,11);
 for(const k of Object.keys(before).filter(k=>k!=='frontier'))assert.deepEqual(after[k],before[k],k);
 for(const k of Object.keys(before.frontier).filter(k=>!['generation','seen'].includes(k)))assert.deepEqual(after.frontier[k],before.frontier[k],k);
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),after);assert.equal(g.worldOps131.activateCampaignSites205().ok,false);
});

test('205 migration: an existing finite lamp in a new parcel refuses activation without moving or deleting possessions',()=>{
 const g=campaign(),old=g.frontier.world(),next=W.create(g.world.seed,11,effects);let point;
 for(const p of next.pois.filter(p=>p.campaign205)){for(let y=p.reserve.t+2;y<p.reserve.b-2&&!point;y+=5)for(let x=p.reserve.l+2;x<p.reserve.r-2&&!point;x+=5)if(!old.blocked(x,y,.28))point={x,y};if(point)break;}assert.ok(point);
 const raw=g.serialize();raw.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:17,on:false,used:true,domain:'region',...point,z:0,inside:null,angle:0}]};assert.equal(g.restoreSave(raw),true);
 const before=checkpoint(g),q=g.worldOps131.previewCampaignSites205();assert.equal(q.ok,false);assert.match(q.reason,/éclairage/i);assert.equal(g.worldOps131.activateCampaignSites205().ok,false);assert.deepEqual(checkpoint(g),before);assert.equal(g.nightGear.snapshot().devices[0].left,17);
});

test('205 field loop: native E harvest pays the existing carried bag once and survives save/reload without refill',()=>{
 const g=campaign();assert.equal(g.worldOps131.activateCampaignSites205().ok,true);const w=g.frontier.world(),p=w.pois.find(p=>p.campaign205),o=w.plan(p).objects[0],q=G.global(p,o.access.x+o.access.w/2,o.access.y+o.access.h/2);
 assert.equal(w.blocked(q.x,q.y,.32),false);const raw=g.serialize();Object.assign(raw.frontier,{active:true,x:q.x,y:q.y,z:0,inside:p.id,anchor:{x:g.player.x,y:g.player.y}});raw.frontier.seen.push(p.id);for(let i=0;i<w.threatCount(p);i++)raw.frontier.enemies[p.id+':e'+i]=0;raw.player.carry=C.makeBag();assert.equal(g.restoreSave(raw),true);
 const carried=C.bagTotal(g.player.carry);g.input.keys.add('KeyE');for(let i=0;i<20;i++)g.update(.1);g.input.keys.clear();
 const taken=g.frontier.takenAmount(o.id);assert.ok(taken>0&&taken<=o.amount,'The native interaction must remove the actual finite stock');assert.ok(C.bagTotal(g.player.carry)>carried);const after=checkpoint(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),after);assert.equal(g.frontier.takenAmount(o.id),taken);assert.equal(g.frontier.world().plan(p).objects.find(b=>b.id===o.id).amount,o.amount);
});

test('205 cover: the open compound lane is outside; only real building volumes count as shelter',()=>{
 const w=W.create(17117,11,effects),p=w.pois.find(p=>p.campaign205),t=A.template(p.type),lane=G.global(p,t.base.entry.x,.75),r=t.scene.rooms.find(r=>r.kind!=='circulation'),room=G.global(p,r.x+r.w/2,r.y+r.h/2);
 assert.equal(w.coveredAt205(lane.x,lane.y,0,p.id),false);assert.equal(w.coveredAt205(room.x,room.y,0,p.id),true);assert.equal(w.coveredAt205(w.home.x,w.home.y),null);assert.equal(w.blocked(lane.x,lane.y,.32,0,null),false);assert.equal(w.blocked(room.x,room.y,.32,0,p.id),false);
});

test('205 cover: a native horde demolition removes shelter immediately through the live structure owner',()=>{
 const g=campaign();assert.equal(g.worldOps131.activateCampaignSites205().ok,true);
 const before=g.frontier.world(),p=before.pois.find(p=>p.campaign205),t=A.template(p.type),r=t.scene.rooms.find(r=>r.kind!=='circulation'),room=G.global(p,r.x+r.w/2,r.y+r.h/2),lane=G.global(p,t.base.entry.x,.75),raw=g.serialize();
 Object.assign(raw.frontier,{active:true,x:lane.x,y:lane.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 Object.assign(raw.worldEvolution,{serial:1,nextHorde:999,structures:{[p.id]:.0011},groups:[{id:'W0000',kind:'frenzied',count:31,lost:0,wound:0,fallen:[],injuries:{},contacts:{},x:p.x,y:p.y,a:0,seen:false}]});
 assert.equal(g.restoreSave(raw),true);const w=g.frontier.world(),plan=w.plan(p);
 assert.equal(g.worldEvolution.structureDestroyed(p.id),false);assert.equal(w.coveredAt205(room.x,room.y,0,p.id),true);assert.equal(w.coveredAt205(room.x,room.y),true);
 g.update(.1);
 assert.equal(g.frontier.world(),w,'The owner update must invalidate shelter without rebuilding the world');assert.equal(g.worldEvolution.structureDestroyed(p.id),true);assert.ok(g.worldEvolution.snapshot().structures[p.id]<=.001);
 assert.equal(w.plan(p),plan);assert.equal(w.coveredAt205(room.x,room.y,0,p.id),false);assert.equal(w.coveredAt205(room.x,room.y),false);assert.equal(w.coveredAt205(lane.x,lane.y,0,p.id),false);assert.equal(w.coveredAt205(w.home.x,w.home.y),null);
});

test('205 closed pools: solid to people and vehicles, transparent to sight, never roofed or potable',()=>{
 const w=W.create(17117,11,effects);let found;
 for(const p of w.pois.filter(p=>p.campaign205)){const pool=w.detailAt(p).outdoor.find(o=>o.kind==='closed-pool');if(pool){found={p,pool};break;}}assert.ok(found);
 const {p,pool}=found,q=G.global(p,pool.x+pool.w/2,pool.y+pool.h/2),a=G.global(p,pool.x+pool.w/2-.2,pool.y+pool.h/2),b=G.global(p,pool.x+pool.w/2+.2,pool.y+pool.h/2);
 assert.equal(pool.opaque,false);assert.equal(w.blocked(q.x,q.y,.32),true);assert.equal(w.opticalBlocked(q.x,q.y,.01),false);assert.equal(w.movementLine(a,b,0,null,null,.01),false);assert.equal(w.line(a,b,0,null,null,.01),true);assert.equal(w.vehicleClear(q.x,q.y,0,4.6,1.85),false);assert.equal(w.coveredAt205(q.x,q.y),false);
});

test('205 native new-game control: current campaigns start G11 and saved Continue keeps the same finite sites',()=>{
 const {bootDocument133}=require('./helpers/document133.cjs'),env=bootDocument133(),g=env.g;env.ready();document.getElementById('mapSeed').value='17117';g.ui.newGameButton.click();
 assert.equal(g.frontier.position().generation,11);assert.equal(g.frontier.position().detailVersion,13);assert.equal(g.frontier.world().campaignCoverage205.placed,8);assert.equal(g.lastSaveStatus.ok,true);const before=checkpoint(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),before);
});
