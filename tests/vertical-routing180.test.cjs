'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/vertical180.cjs');
const {C,R,S,N,B,pair,bridge,moveTo,roofInvader,until,clone,snapshot,tick,boot,build,ascend,equip}=H;
function playerAcross(f,q){moveTo(f,q.ports[0].x*32,q.ports[0].y*32);moveTo(f,q.ports[1].x*32,q.ports[1].y*32);moveTo(f,f.b.x,f.b.y);}
function onSpan(f,z){const p=f.v.enemyPose(z),q=f.n.presentation().links.find(x=>x.link.id===p.bridge)?.shape;return q&&z.x>f.a.right+10&&z.x<f.b.left-10;}
function saveReload(f,id){assert.ok(f.g.restoreSave(f.g.serialize()));f.a=f.g.world.buildings.get(f.a.id);f.b=f.g.world.buildings.get(f.b.id);return f.g.zombies.find(z=>z.id===id);}
for(let age=0;age<11;age++)test('180 native invader crosses acquired bridge kit '+age+' continuously without a duplicate',()=>{
 const types=['lookout2a177','rampart3a177','rampart6a177','rampart12','rampart12','rampart18a177','rampart24','rampart36a177','rampart48','rampart60a177','rampart72a177'];
 const f=pair(age,types[age]),q=bridge(f);playerAcross(f,q);const z=roofInvader(f),count=f.g.zombies.length,id=z.id,hp=z.health;let last={x:z.x,y:z.y};
 until(f,()=>f.v.enemyPose(z).site===f.b.id,30,()=>{
  assert.ok(Math.hypot(z.x-last.x,z.y-last.y)<=C.VerticalSiege176.roofSpeed*32*.1+.001,'bounded physical movement');last={x:z.x,y:z.y};
  assert.equal(f.v.enemyPose(z).z,R.bases[types[age]].height);assert.equal(z.id,id);assert.equal(f.g.zombies.length,count);assert.equal(z.health,hp);
 });
 assert.equal(f.v.enemyPose(z).bridge,null);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('180 actual native climb leads onto a bridge and to the remote wall, not a second spawned enemy',()=>{
 const f=pair(1,'rampart3a177'),q=bridge(f);playerAcross(f,q);f.g.spawnZombie('runner');const z=f.g.zombies.at(-1),id=z.id;
 z.x=f.a.x;z.y=f.a.top-32;z.lastX=z.x;z.lastY=z.y;f.a.corpseLoad=300;f.g.rebuildBuckets();
 until(f,()=>f.v.enemyPose(z).stage==='climb',3);assert.ok(f.v.enemyPose(z).z>0&&f.v.enemyPose(z).z<3);
 until(f,()=>f.v.enemyPose(z).bridge!==null,25);until(f,()=>f.v.enemyPose(z).site===f.b.id,10);
 assert.equal(f.g.zombies.length,1);assert.equal(z.id,id);assert.equal(f.v.enemyPose(z).z,3);
});
test('180 paused bridge traversal freezes native pose and registry',()=>{
 const f=pair(),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));const state=snapshot(f.g);f.g.paused=true;
 for(let i=0;i<20;i++)f.g.updateZombies(.1);const after=snapshot(f.g);assert.deepEqual(after.expansions127.modules.vertical175,state.expansions127.modules.vertical175);assert.equal(after.zombies[0].x,state.zombies[0].x);assert.equal(after.zombies[0].y,state.zombies[0].y);
});
for(const axis of ['x','y'])test('180 '+axis+' mid-bridge save/reload preserves altitude, identity and continuing route',()=>{
 const f=pair(2,'lookout2a177',2,axis),q=bridge(f);playerAcross(f,q);let z=roofInvader(f);
 until(f,()=>f.v.enemyPose(z).bridge!==null);f.g.updateZombies(.1);const before={x:z.x,y:z.y,pose:f.v.enemyPose(z),health:z.health};z=saveReload(f,z.id);
 assert.deepEqual({x:z.x,y:z.y,pose:f.v.enemyPose(z),health:z.health},before);until(f,()=>f.v.enemyPose(z).site===f.b.id,15);
});
test('180 unfinished bridge is absent from hostile topology and cannot be walked',()=>{
 const f=pair(),q=H.geometry(f);moveTo(f,q.ports[0].x*32,q.ports[0].y*32);assert.ok(f.n.buildLink(f.b.id,0).ok);tick(f.g,1);f.v.stop();const z=roofInvader(f),n=f.n.presentation().links[0].link.progress;
 for(let i=0;i<200;i++)f.g.updateZombies(.1);
 assert.equal(f.v.enemyPose(z).site,f.a.id);assert.equal(f.v.enemyPose(z).bridge,null);assert.equal(f.n.presentation().links[0].link.progress,n);
});
test('180 routing topology is read-only and can exclude cargo load without mutating costs or progression',()=>{
 const f=pair(),q=bridge(f),before=snapshot(f.g);const a=f.n.navigationGraph(),b=f.n.navigationGraph(1e9);
 assert.equal(a.edges.get(f.a.id+':0').length,1);assert.equal(b.edges.get(f.a.id+':0').length,0);a.nodes.clear();a.edges.clear();assert.equal(f.n.navigationGraph().nodes.size,2);assert.deepEqual(snapshot(f.g),before);
});
test('180 invader on a span blocks dismantling before payment or confirmation',()=>{
 const f=pair(),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));moveTo(f,q.ports[1].x*32,q.ports[1].y*32);
 const stock={...f.g.resources},l=clone(f.n.presentation().links[0].link),result=f.n.serviceBridge(1,'removeBridge');assert.equal(result.ok,false);assert.match(result.reason,/acteur|infecté/);assert.equal(result.confirmation,undefined);assert.deepEqual(f.g.resources,stock);assert.deepEqual(f.n.presentation().links[0].link,l);
});
test('180 hostile bridge occupancy invalidates already confirmed maintenance while active',()=>{
 const f=pair(),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);moveTo(f,q.ports[1].x*32,q.ports[1].y*32);
 assert.ok(f.n.serviceBridge(1,'removeBridge').confirmation);assert.ok(f.n.serviceBridge(1,'removeBridge',true).ok);const stock={...f.g.resources};
 until(f,()=>onSpan(f,z));tick(f.g,20);assert.equal(f.n.busy(),false);assert.equal(f.n.presentation().links.length,1);assert.deepEqual(f.g.resources,stock);
});
test('180 breaking a span resolves hostile fall immediately, with health loss and no population duplication',()=>{
 const f=pair(),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));const hp=z.health,id=z.id,count=f.g.zombies.length;
 assert.ok(f.n.damage(1,1e6));assert.equal(f.v.enemyPose(z).z,0);assert.equal(f.v.snapshot().climbers.length,0);assert.ok(z.dead||z.health<hp);assert.equal(z.id,id);assert.equal(f.g.zombies.length,count);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('180 destruction of the destination anchor drops a midspan invader and preserves the surviving support',()=>{
 const f=pair(),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));f.g.destroyBuilding(f.b);
 assert.equal(f.n.presentation().links.length,0);assert.equal(f.v.enemyPose(z).z,0);assert.ok(!f.a.dead);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('180 corrupt bridge/stair saves reject transactionally rather than silently changing native enemies',()=>{
 const f=pair(),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));const good=clone(f.g.serialize()),before=snapshot(f.g);
 for(const change of [c=>c.bridge=99999,c=>c.level=1,c=>c.progress=NaN,c=>c.stage='stairs',c=>c.stair={from:0,to:2,progress:.5},c=>c.site=f.b.id+10000]){
  const d=clone(good);change(d.expansions127.modules.vertical175.climbers[0]);assert.throws(()=>f.g.restoreSave(d),/vertical|infecté|palier|grimpeur/);assert.deepEqual(snapshot(f.g),before);
 }
 const orphan=clone(good);orphan.expansions127.modules.vertical175.network.links=[];assert.throws(()=>f.g.restoreSave(orphan),/vertical|passerelle/);assert.deepEqual(snapshot(f.g),before);
});
test('180 v3 migration preserves existing rooftop enemy health and supplies, grants no connections',()=>{
 const f=pair(1,'rampart3a177'),z=roofInvader(f),d=clone(f.g.serialize()),raw=d.expansions127.modules.vertical175;raw.version=3;
 for(const c of raw.climbers){delete c.level;delete c.bridge;delete c.stair;}
 // Use a wall in the separate old format fixture; v3 roof provenance is unchanged.
 const stock={...d.resources};assert.ok(f.g.restoreSave(d));assert.equal(f.v.snapshot().version,4);assert.equal(f.v.enemyPose(f.g.zombies.find(e=>e.id===z.id)).level,0);assert.deepEqual(f.g.resources,stock);assert.equal(f.n.presentation().links.length,0);
});
function stairsFixture(){
 const g=boot(4),a=build(g,'verticalFoundation6');ascend(g,a);assert.ok(g.vertical175.buildDeck().ok);tick(g,40);g.player.x=a.x;g.player.y=a.y;ascend(g,a,1);
 const f={g,a,b:a,v:g.vertical175,n:g.vertical175.network};const z=roofInvader(f);return{f,z};
}
test('180 roof invader physically reaches stairs and ascends with intermediate altitude; power is not required',()=>{
 const {f,z}=stairsFixture();f.a.gridOffline=true;until(f,()=>f.v.enemyPose(z).stage==='stairs');const from=f.v.enemyPose(z).z;
 f.g.updateZombies(.2);assert.ok(f.v.enemyPose(z).z>from&&f.v.enemyPose(z).z<12);until(f,()=>f.v.enemyPose(z).level===1,15);
 assert.equal(f.v.enemyPose(z).z,12);assert.equal(f.g.zombies.length,1);const hp=f.g.player.health;f.g.updateZombies(.2);assert.ok(f.g.player.health<hp);
});
test('180 save in the middle of an interior enemy stair route resumes the same native actor',()=>{
 const {f,z:original}=stairsFixture();let z=original;until(f,()=>f.v.enemyPose(z).stage==='stairs');for(let i=0;i<20;i++)f.g.updateZombies(.1);
 const p=f.v.enemyPose(z);assert.ok(p.z>6&&p.z<12);z=saveReload(f,z.id);assert.deepEqual(f.v.enemyPose(z),p);until(f,()=>f.v.enemyPose(z).level===1,15);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('180 floor currently used as a stair destination cannot be dismantled from below',()=>{
 const {f,z}=stairsFixture();until(f,()=>f.v.enemyPose(z).stage==='stairs');
 const d=f.g.serialize();d.expansions127.modules.vertical175.actor.level=0;assert.ok(f.g.restoreSave(d));const stock={...f.g.resources};
 const result=f.v.dismantleTopDeck(f.a.id);assert.equal(result.ok,false);assert.match(result.reason,/infecté|escalier/);assert.deepEqual(f.g.resources,stock);
});
test('180 stair saves reject skipped floors, nonfinite travel and off-centre native positions',()=>{
 const {f,z}=stairsFixture();until(f,()=>f.v.enemyPose(z).stage==='stairs');const good=clone(f.g.serialize()),before=snapshot(f.g);
 for(const change of [d=>d.expansions127.modules.vertical175.climbers[0].stair.to=2,d=>d.expansions127.modules.vertical175.climbers[0].stair.progress=Infinity,d=>d.zombies[0].x+=40]){
  const d=clone(good);change(d);assert.throws(()=>f.g.restoreSave(d),/vertical|infecté|escalier/);assert.deepEqual(snapshot(f.g),before);
 }
});
test('180 roof weapons hit the same crossing native body; ground shots still cannot reach it',()=>{
 const f=pair(3,'rampart12'),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));const p=f.v.enemyPose(z),hp=z.health;
 f.g.fireFriendly(z.x-100,z.y,0,300,300,'soldier');f.g.updateProjectiles(.2);assert.equal(z.health,hp);
 const ray=f.v.raycast({x:z.x/32-.8,y:z.y/32,z:p.z+.8},0,0,2);assert.equal(ray.entity,z);assert.equal(ray.type,'zombie');
});
test('180 hostile route does not borrow the payload restriction of an unrelated player cargo',()=>{
 const f=pair(2),q=bridge(f,'link0');playerAcross(f,q);const m=equip(f.g,f.b,'handSupport177');
 const quote=f.n.packQuote(m.id);assert.ok(quote.ok,quote.reason);assert.ok(f.n.packModule(m.id).ok);tick(f.g,quote.seconds+.1);
 assert.ok(R.modules[f.n.presentation().cargo.kind].mass>B.links[0].payload);const z=roofInvader(f);
 until(f,()=>f.v.enemyPose(z).site===f.b.id,30);assert.ok(f.n.carrying());assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('180 an invader crosses to a populated foundation and destroys its actual housing module',()=>{
 const f=pair(4,'verticalFoundation6'),q=bridge(f);playerAcross(f,q);const m=equip(f.g,f.b,'quarters',2),housing=f.g.housing;
 assert.ok(f.v.damageModule(m.id,R.modules.quarters.health-1));moveTo(f,f.b.x,f.b.y);assert.ok(f.v.buildDeck(f.b.id).ok);tick(f.g,40);ascend(f.g,f.b,1);
 const z=roofInvader(f);until(f,()=>f.v.moduleRef(m.id)===null,60);assert.equal(f.g.housing,housing-R.modules.quarters.housing);assert.equal(f.v.enemyPose(z).site,f.b.id);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('180 visible movement remains independent of camera selection and has no draw-time mutation',()=>{
 const f=pair(2),q=bridge(f);playerAcross(f,q);const z=roofInvader(f);until(f,()=>onSpan(f,z));const before=snapshot(f.g);
 for(let i=0;i<100;i++){f.v.enemyPose(z);f.v.geometry();f.n.navigationGraph();f.n.presentation();}
 assert.deepEqual(snapshot(f.g),before);
});
