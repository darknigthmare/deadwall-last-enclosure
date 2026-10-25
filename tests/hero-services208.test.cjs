'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),H=require('../src/hero-actions133.js'),Services=require('../src/campaign-services208.js');
const {serviceFixture208,stepSupport208,checkpoint208,copy}=require('./helpers/campaign-services208.cjs');
for(const[action,kind]of[['meal','handle'],['restSheltered','dressing'],['service','handle']])test('208 hero native '+action+': only real owner progress animates the matching gesture and completion removes it',()=>{
 const {g,site,support,quote,lanternId}=serviceFixture208(action);H.install(g);const saved=checkpoint208(g),begin=()=>g.survivalPack.beginAtSupport(action,site.id,support.supportId,action==='service'?lanternId:undefined);
 assert.equal(begin().ok,true);assert.equal(g.heroActions133.pose(),null,'Beginning is not observed progress');assert.equal(g.heroActions133.observeSupportWork208(.04),false);
 g.survivalPack.step(.04);const view=g.survivalPack.presentationSupport(),pose=g.heroActions133.pose();assert.equal(pose?.kind,kind);assert.equal(pose.elapsed,view.elapsed);assert.deepEqual(checkpoint208(g),saved,'A gesture cannot pay, heal or persist itself');
 const f=g.frontier.position(),target=view.workTarget;assert.ok(Math.abs(pose.facing-Math.atan2(target.y-f.y,target.x-f.x))<1e-8,'Gesture faces the actual supported furniture');
 assert.equal(g.heroActions133.observeSupportWork208(.04),false,'The same elapsed cannot be replayed');assert.deepEqual(g.heroActions133.pose(),pose);
 for(const blocked of['pause','overlay']){if(blocked==='pause')g.paused=true;else g.activeOverlay={};g.survivalPack.step(.1);assert.deepEqual(g.heroActions133.pose(),pose);g.paused=false;g.activeOverlay=null;}
 const frontier=g.frontier,random=Math.random;g.frontier={...frontier,world:()=>assert.fail('A gesture read generated the world'),snapshot:()=>assert.fail('A gesture read inspected the save')};Math.random=()=>assert.fail('A gesture consumed RNG');try{assert.deepEqual(g.heroActions133.pose(),pose);}finally{g.frontier=frontier;Math.random=random;}
 g.survivalPack.cancel();assert.equal(g.heroActions133.pose(),null);assert.deepEqual(checkpoint208(g),saved);
 assert.equal(begin().ok,true);g.survivalPack.step(.04);const raw=g.serialize();assert.equal(Object.hasOwn(raw,'heroActions133'),false);assert.equal(g.restoreSave(raw),true);assert.equal(g.heroActions133.pose(),null);assert.equal(g.survivalPack.busy(),false);
 assert.equal(begin().ok,true);stepSupport208(g,quote.seconds);assert.equal(g.heroActions133.pose(),null);assert.equal(g.survivalPack.busy(),false);for(const resource of C.RESOURCE_KEYS)assert.equal(g.player.carry[resource],saved.player.carry[resource]-(quote.cost[resource]||0));
});
test('208 hero native support gestures yield to low posture, movement, reloading, damage, death and loss of their owner',()=>{
 const {g,site,support}=serviceFixture208('restSheltered');H.install(g);const saved=checkpoint208(g),begin=()=>g.survivalPack.beginAtSupport('restSheltered',site.id,support.supportId);
 for(const interrupt of['posture','move','reload','damage','death','owner']){
  assert.equal(g.restoreSave(copy(saved)),true);assert.equal(begin().ok,true);g.survivalPack.step(.04);assert.equal(g.heroActions133.pose()?.kind,'dressing');const owner=g.survivalPack,evolution=g.worldEvolution;
  if(interrupt==='posture')g.worldEvolution={...evolution,posture:()=>({key:'prone'})};
  if(interrupt==='move'){g.input.keys.add('KeyD');g.updatePlayer(.1);g.input.keys.clear();}
  if(interrupt==='reload')g.player.reload=1;if(interrupt==='damage'){g.player.health--;g.survivalPack.step(.04);}if(interrupt==='death')g.player.dead=true;if(interrupt==='owner')g.survivalPack=null;
  try{assert.equal(g.heroActions133.pose(),null,interrupt);}finally{g.survivalPack=owner;g.worldEvolution=evolution;}
 }
});
test('208 hero native progress is clamped by its owner and a duplicated or malformed callback cannot create another pose',()=>{
 const {g,site,support}=serviceFixture208('meal');H.install(g);assert.equal(g.survivalPack.beginAtSupport('meal',site.id,support.supportId).ok,true);g.survivalPack.step(.3);const pose=g.heroActions133.pose();assert.equal(pose.elapsed,C.SurvivalPackRules.maxStep);const original=g.survivalPack;
 for(const dt of[0,-1,NaN,Infinity,.2,.04])assert.equal(g.heroActions133.observeSupportWork208(dt),false);
 for(const changes of[{fullKey:'P0000:208:0:meal'},{supportId:original.presentationSupport().siteId+':0:07',fullKey:original.presentationSupport().siteId+':208:07:meal'},{supportKind:'medical'},{progress:.99},{owner:'other'},{workTarget:{x:0,y:0,z:1}}]){g.survivalPack={...original,presentationSupport:()=>({...original.presentationSupport(),...changes})};assert.equal(g.heroActions133.observeSupportWork208(.1),false);assert.equal(g.heroActions133.pose(),null);}
 g.survivalPack=original;assert.equal(g.heroActions133.observeSupportWork208(.1),false,'Stale progress is not replayed after a rejected presentation');
});
test('208 medical hero: the actualT047 medicine owner keeps its existing dressing gesture and real workTarget',()=>{
 const {g,site}=serviceFixture208('restSheltered');const w=g.frontier.world(),s=Services.supportsFor(site,w.plan(site,0),w.detailAt(site,0)).find(s=>s.action==='medicalCare');assert.ok(s);const raw=g.serialize();Object.assign(raw.frontier,{...s.anchor,inside:site.id,z:0});assert.equal(g.restoreSave(raw),true);H.install(g);const key='medical208-'+s.supportId.split(':')[2],before=checkpoint208(g),q=g.contextOperations160.preview(site.id,key);assert.equal(q.ok,true,q.reason);assert.equal(g.contextOperations160.begin(site.id,key).ok,true);assert.equal(g.heroActions133.pose(),null);g.contextOperations160.step(.04);const pose=g.heroActions133.pose(),view=g.contextOperations160.activity();assert.equal(pose?.kind,'dressing');assert.equal(pose.elapsed,view.elapsed);const f=g.frontier.position();assert.ok(Math.abs(pose.facing-Math.atan2(view.workTarget.y-f.y,view.workTarget.x-f.x))<1e-8);assert.deepEqual(checkpoint208(g),before);g.contextOperations160.cancel();assert.equal(g.heroActions133.pose(),null);assert.deepEqual(checkpoint208(g),before);
});
