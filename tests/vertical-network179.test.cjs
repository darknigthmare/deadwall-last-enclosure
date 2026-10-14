'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {C,S,R,V,clone,tick,boot,build,ascend,equip,approach,lowStock,snapshot}=require('./helpers/vertical177.cjs');
const N=require('../src/vertical-network179.js'),B=C.VerticalNetwork179;
function pair(age=4,type='lookout2a177',gap=2,axis='x'){
 const g=boot(age);for(const n of g.world.nodes)n.harvest(n.amount);
 let a,b;const def=C.BUILDINGS[type];for(const [k,n]of Object.entries(def.cost||{}))g.resources[k]=Math.max(g.resources[k],n*2+1000);
 for(let x=8;x<100&&!a;x+=2)for(let y=8;y<100&&!a;y+=2){
  const bx=axis==='x'?x+def.size[0]+gap:x,by=axis==='y'?y+def.size[1]+gap:y;
  if(!g.world.placement(def,x,y,0).valid||!g.world.placement(def,bx,by,0).valid)continue;
  if(!g.placeOne(type,x,y))continue;a=g.world.atCell(x,y);a.progress=1;a.health=a.maxHealth;
  if(!g.placeOne(type,bx,by))throw Error('Second support unexpectedly unavailable');b=g.world.atCell(bx,by);b.progress=1;b.health=b.maxHealth;
 }
 assert.ok(a&&b,'two legally paid supports');g.refreshMetrics(true);Object.assign(g.player,g.vertical175.entrance(a));ascend(g,a);
 return{g,a,b,v:g.vertical175,n:g.vertical175.network};
}
function geometry(f,kind=B.links[f.g.tier.id].id){return N.shape({id:1,kind,a:{site:f.a.id,level:0},b:{site:f.b.id,level:0},progress:0,health:1},f.g.world.buildings,f.v.presentation().sites);}
function moveTo(f,x,y){for(let i=0;i<100&&Math.hypot(f.g.player.x-x,f.g.player.y-y)>.02;i++){const dx=x-f.g.player.x,dy=y-f.g.player.y,k=f.n.carrying()?B.carrySpeed:1;f.g.moveFriendly(f.g.player,dx/k,dy/k);}assert.ok(Math.hypot(f.g.player.x-x,f.g.player.y-y)<.05,'physical path reaches point');}
function bridge(f,kind){const q=geometry(f,kind);assert.ok(q);moveTo(f,q.ports[0].x*R.tile,q.ports[0].y*R.tile);const quote=f.n.linkQuote(f.b.id,0,kind);assert.ok(quote.ok,quote.reason);assert.ok(f.n.buildLink(f.b.id,0,kind).ok);tick(f.g,quote.seconds+.1);assert.equal(f.n.presentation().links[0].link.progress,1);return q;}
function packGun(f){moveTo(f,f.a.x,f.a.y);const m=equip(f.g,f.a,'handRifle177');m.ammo=7;const quote=f.n.packQuote(m.id);assert.ok(quote.ok,quote.reason);assert.ok(f.n.packModule(m.id).ok);tick(f.g,quote.seconds+.1);assert.equal(f.n.presentation().cargo?.id,m.id);return m;}

test('179 v2 save migrates additively and repeated restore cannot grant bridges or resources',()=>{
 const g=boot(),d=g.serialize(),v=d.expansions127.modules.vertical175;v.version=2;delete v.network;const stock=clone(d.resources);
 assert.ok(g.restoreSave(d));assert.equal(g.vertical175.snapshot().version,3);assert.deepEqual(g.vertical175.snapshot().network,N.initial());assert.deepEqual(g.resources,stock);assert.ok(g.restoreSave(g.serialize()));assert.deepEqual(g.resources,stock);
});
for(let age=0;age<11;age++)test('179 acquired age '+age+' builds a paid compatible connection',()=>{
 const f=pair(age),before={...f.g.resources},q=bridge(f),l=f.n.presentation().links[0].link;
 assert.equal(l.kind,B.links[age].id);for(const [k,n]of Object.entries(q.definition.costPerMetre))assert.equal(f.g.resources[k],before[k]-Math.ceil(q.gap*n));
 assert.ok(f.n.load(f.a.id)>0);assert.equal(f.n.load(f.a.id),f.n.load(f.b.id));assert.ok(f.g.restoreSave(f.g.serialize()));assert.equal(f.n.presentation().links.length,1);
});
for(const axis of ['x','y'])test('179 continuous '+axis+' bridge walk and midspan save/restore preserve height and ownership',()=>{
 const f=pair(2,'lookout2a177',2,axis),q=bridge(f);moveTo(f,(q.x+q.w/2)*R.tile,(q.y+q.h/2)*R.tile);
 assert.equal(f.v.pose().z,2);const before={x:f.g.player.x,y:f.g.player.y};assert.ok(f.g.restoreSave(f.g.serialize()));assert.deepEqual({x:f.g.player.x,y:f.g.player.y},before);
 moveTo(f,f.b.x,f.b.y);assert.equal(f.v.pose().site,f.b.id);assert.equal(f.v.pose().z,2);
});
test('179 no crossing before completion; pause and cancellation preserve only paid progress',()=>{
 const f=pair(),q=geometry(f);moveTo(f,q.ports[0].x*32,q.ports[0].y*32);const before={...f.g.resources};assert.ok(f.n.buildLink(f.b.id,0).ok);tick(f.g,2);const done=f.n.presentation().links[0].link.progress;
 assert.ok(done>0&&done<1);assert.equal(f.v.clearAt((q.x+q.w/2)*32,(q.y+q.h/2)*32,2),false);f.g.paused=true;tick(f.g,20);assert.equal(f.n.presentation().links[0].link.progress,done);
 f.g.paused=false;f.v.stop();const save=f.g.serialize();assert.ok(f.g.restoreSave(save));assert.equal(f.n.busy(),false);tick(f.g,20);assert.equal(f.n.presentation().links[0].link.progress,done);
 const paid={...f.g.resources};assert.ok(f.n.serviceBridge(1,'bridge').ok);tick(f.g,30);assert.equal(f.n.presentation().links[0].link.progress,1);assert.deepEqual(f.g.resources,paid);assert.ok(f.g.resources.wood<before.wood||f.g.resources.scrap<before.scrap);
});
test('179 pack, walk, unload across supports conserves exact module identity, health and ammunition',()=>{
 const f=pair(),q=bridge(f),m=packGun(f);assert.equal(f.v.moduleRef(m.id),null);assert.equal(f.n.presentation().cargo,m);assert.equal(f.g.expansions.busy(),true);
 assert.equal(f.g.shootPlayer(),false);assert.equal(f.g.melee(),false);assert.equal(f.g.startReload(),false);
 moveTo(f,q.ports[0].x*32,q.ports[0].y*32);moveTo(f,q.ports[1].x*32,q.ports[1].y*32);moveTo(f,f.b.x,f.b.y);
 const quote=f.n.unloadQuote(1);assert.ok(quote.ok,quote.reason);assert.ok(f.n.unloadModule(1).ok);tick(f.g,quote.seconds+.1);
 const ref=f.v.moduleRef(m.id);assert.equal(ref.m,m);assert.equal(ref.s.id,f.b.id);assert.equal(ref.m.ammo,7);assert.equal(ref.m.health,R.modules.handRifle177.health);assert.equal(f.n.carrying(),false);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('179 packing preserves ammo through a mid-carry save; unpacking cannot complete from saved progress',()=>{
 const f=pair(),m=packGun(f),id=m.id;assert.ok(f.g.restoreSave(f.g.serialize()));assert.equal(f.n.presentation().cargo.id,id);assert.equal(f.n.presentation().cargo.ammo,7);
 moveTo(f,f.a.x,f.a.y);assert.ok(f.n.unloadModule(1).ok);tick(f.g,1);assert.ok(f.g.restoreSave(f.g.serialize()));tick(f.g,30);assert.equal(f.v.moduleRef(id),null);assert.equal(f.n.presentation().cargo.id,id);
});
test('179 cargo moves between floors via existing stairs and retains native firing state',()=>{
 const g=boot(4),a=build(g,'verticalFoundation6');ascend(g,a);assert.ok(g.vertical175.buildDeck().ok);tick(g,36);const f={g,a,b:a,v:g.vertical175,n:g.vertical175.network},m=packGun(f);
 moveTo(f,a.x,a.y);const q=f.v.accessQuote(a.id,1);assert.ok(q.ok,q.reason);assert.ok(f.v.access(a.id,1).ok);tick(g,q.seconds+.1);assert.equal(f.v.pose().z,12);
 assert.ok(f.n.unloadModule(0).ok);tick(g,10);assert.equal(f.v.moduleRef(m.id).level,1);assert.equal(f.v.moduleRef(m.id).m.ammo,7);
});
test('179 dropped equipment is persistent and recovered once without new construction',()=>{
 const f=pair(),m=packGun(f);assert.ok(f.n.dropCargo().ok);assert.equal(f.n.carrying(),false);assert.equal(f.n.presentation().crates.length,1);assert.ok(f.g.restoreSave(f.g.serialize()));
 assert.ok(f.n.pickup(m.id).ok);tick(f.g,8);assert.equal(f.n.presentation().cargo.id,m.id);assert.equal(f.n.presentation().cargo.ammo,7);assert.equal(f.n.presentation().crates.length,0);assert.equal(f.n.pickup(m.id).ok,false);
});
test('179 injury interrupts packing without paying or removing the original equipment',()=>{
 const f=pair(),m=equip(f.g,f.a,'handRifle177'),before={...f.g.resources};assert.ok(f.n.packModule(m.id).ok);tick(f.g,1);f.g.player.health-=1;tick(f.g,20);
 assert.equal(f.n.carrying(),false);assert.equal(f.v.moduleRef(m.id).m,m);assert.deepEqual(f.g.resources,before);
});
test('179 stock loss prevents packing a storage module; a gun needs no storage reduction',()=>{
 const f=pair(),m=equip(f.g,f.a,'fieldCache177');f.g.resources.wood=f.g.storage;const before=snapshot(f.g);assert.equal(f.n.packModule(m.id).ok,false);assert.deepEqual(snapshot(f.g),before);
});
test('179 wrong tier, too-long span, duplicate endpoints and invalid input refuse before payment',()=>{
 const f=pair(0),q=geometry(f);moveTo(f,q.ports[0].x*32,q.ports[0].y*32);const before=snapshot(f.g);
 for(const args of [[f.b.id,0,'link10'],[NaN,0],[f.b.id,.2],[f.a.id,0]])assert.equal(f.n.buildLink(...args).ok,false);assert.deepEqual(snapshot(f.g),before);bridge(f);const paid={...f.g.resources};assert.equal(f.n.buildLink(f.b.id,0).ok,false);assert.deepEqual(f.g.resources,paid);
 const far=pair(0,'lookout2a177',4);assert.equal(geometry(far),null);
});
test('179 bridge deck blocks a descending ray but leaves ground movement underneath',()=>{
 const f=pair(),q=bridge(f),x=q.x+q.w/2,y=q.y+q.h/2;assert.equal(f.v.raycast({x,y,z:4},0,-Math.PI/2,5).type,'bridge');
 assert.equal(f.v.raycast({x,y,z:1},0,0,.1).type,'miss');assert.ok(f.g.friendlyPositionClear({radius:10},x*32,y*32));
});
test('179 destruction of a bridge causes a real fall without deleting surviving supports',()=>{
 const f=pair(),q=bridge(f);moveTo(f,(q.x+q.w/2)*32,(q.y+q.h/2)*32);const health=f.g.player.health;
 assert.ok(f.n.damage(1,1e6));assert.equal(f.n.presentation().links.length,0);assert.equal(f.v.pose().site,null);assert.ok(f.g.player.health<health);assert.ok(!f.a.dead&&!f.b.dead);assert.ok(f.g.restoreSave(f.g.serialize()));
});
test('179 destroying the remote anchor removes the bridge and drops a midspan actor',()=>{
 const f=pair(),q=bridge(f);moveTo(f,(q.x+q.w/2)*32,(q.y+q.h/2)*32);f.g.destroyBuilding(f.b);assert.equal(f.n.presentation().links.length,0);assert.equal(f.v.pose().site,null);
});
test('179 removal is confirmed, blocked by a crate, then refunds once from a clear anchor',()=>{
 const f=pair(),q=bridge(f),m=packGun(f);moveTo(f,(q.x+q.w/2)*32,(q.y+q.h/2)*32);assert.ok(f.n.dropCargo().ok);
 moveTo(f,q.ports[0].x*32,q.ports[0].y*32);assert.equal(f.n.serviceBridge(1,'removeBridge').ok,false);assert.ok(f.n.pickup(m.id).ok);tick(f.g,8);moveTo(f,f.a.x,f.a.y);assert.equal(f.n.unloadQuote(1).ok,false,'docking strip stays clear');assert.ok(f.n.unloadModule(0).ok);tick(f.g,10);
 moveTo(f,q.ports[0].x*32,q.ports[0].y*32);lowStock(f.g);assert.equal(f.n.serviceBridge(1,'removeBridge').confirmation,true);const before={...f.g.resources};assert.ok(f.n.serviceBridge(1,'removeBridge',true).ok);tick(f.g,15);assert.equal(f.n.presentation().links.length,0);assert.ok(f.g.resources.scrap>=before.scrap);const after={...f.g.resources};assert.equal(f.n.serviceBridge(1,'removeBridge',true).ok,false);assert.deepEqual(f.g.resources,after);
});
test('179 route is a bounded read-only graph of completed stairs and bridges',()=>{
 const f=pair();const before=snapshot(f.g);assert.equal(f.n.route(f.b.id,0).ok,false);assert.deepEqual(snapshot(f.g),before);bridge(f);const state=snapshot(f.g),route=f.n.route(f.b.id,0);assert.ok(route.ok);assert.equal(route.steps.length,1);assert.equal(route.steps[0].kind,'bridge');assert.deepEqual(snapshot(f.g),state);
});
for(const scenario of ['duplicate-link','missing-anchor','bad-progress','extra-key','cargo-duplicate','cargo-ammo','crate-altitude','actor-void'])test('179 corrupt '+scenario+' is rejected transactionally',()=>{
 const f=pair();bridge(f);const m=equip(f.g,f.a,'handRifle177'),raw=f.g.serialize(),v=raw.expansions127.modules.vertical175,n=v.network;
 if(scenario==='duplicate-link'){n.links.push({...clone(n.links[0]),id:n.nextId++});}
 if(scenario==='missing-anchor')n.links[0].b.site=999999;
 if(scenario==='bad-progress')n.links[0].progress=Infinity;
 if(scenario==='extra-key')n.freeAmmo=20;
 if(scenario==='cargo-duplicate')n.cargo=clone(m);
 if(scenario==='cargo-ammo'){v.sites[0].decks[0].modules=[];n.cargo=clone(m);n.cargo.ammo=99999;}
 if(scenario==='crate-altitude'){v.sites[0].decks[0].modules=[];n.crates.push({module:clone(m),site:null,level:-1,x:raw.player.x,y:raw.player.y,z:2});}
 if(scenario==='actor-void'){raw.player.x=4;raw.player.y=4;}
 const before=snapshot(f.g);assert.throws(()=>f.g.restoreSave(raw));assert.deepEqual(snapshot(f.g),before);
});

for(let age=0;age<11;age++)test('179 age '+age+' bridge works at its actual highest unlocked support',()=>{
 const type=Object.entries(R.bases).filter(([,b])=>b.unlockTier===age).sort((a,b)=>b[1].height-a[1].height)[0][0];
 const f=pair(age,type),q=bridge(f);assert.equal(q.z,R.bases[type].height);moveTo(f,(q.x+q.w/2)*32,(q.y+q.h/2)*32);
 assert.equal(f.v.pose().z,R.bases[type].height);assert.ok(f.g.restoreSave(f.g.serialize()));moveTo(f,f.b.x,f.b.y);assert.equal(f.v.pose().site,f.b.id);
});
test('179 other native freight owners block packing before resource mutation',()=>{
 const f=pair(),m=equip(f.g,f.a,'handRifle177');
 for(const name of ['essentials','explorationPack','campaignPack']){const old=f.g[name],before=snapshot(f.g);f.g[name]={...old,carrying:()=>true};assert.equal(f.n.packModule(m.id).ok,false);f.g[name]=old;assert.deepEqual(snapshot(f.g),before);}
});
test('179 registry refuses a vertical cargo and another held consignment atomically',()=>{
 const X=require('../src/expansion-kit.js'),cargo={kind:'handRifle177'};
 const validators=new Map([['vertical175',()=>({network:{cargo}})],['exploration',()=>({cargo:[{stage:'held'}]})]]);
 assert.throws(()=>X.normalize(undefined,{},validators),/Un seul chargement/);
});
test('179 immediate lethal native damage drops one recoverable equipment crate before the next tick',()=>{
 const f=pair(),m=packGun(f);f.g.player.invulnerable=0;f.g.damagePlayer(99999);
 assert.equal(f.g.player.dead,true);assert.equal(f.n.carrying(),false);assert.equal(f.n.presentation().crates.length,1);assert.equal(f.n.presentation().crates[0].module,m);assert.equal(f.n.presentation().crates[0].z,2);
 assert.equal(f.v.pose().site,null);const saved=f.g.serialize();assert.ok(f.g.restoreSave(saved));assert.equal(f.n.presentation().crates[0].module.ammo,7);
});
test('179 cargo can descend to native ground, drop and pick up without gaining an equipment',()=>{
 const f=pair(),m=packGun(f);moveTo(f,f.a.x,f.a.y);ascend(f.g,f.a,-1);assert.equal(f.v.pose().z,0);assert.ok(f.n.dropCargo().ok);const c=f.n.presentation().crates[0];assert.equal(c.z,0);assert.equal(c.site,null);
 assert.ok(f.g.restoreSave(f.g.serialize()));assert.ok(f.n.pickup(m.id).ok);tick(f.g,8);assert.equal(f.n.presentation().cargo.ammo,7);assert.equal(f.n.presentation().crates.length,0);
});
test('179 low bridge reserves its physical span against native ground construction',()=>{
 const f=pair(),q=bridge(f),before={...f.g.resources};assert.equal(f.n.blocksConstruction('lookout2a177',Math.floor(q.x),Math.floor(q.y)),true);assert.equal(f.g.placeOne('lookout2a177',Math.floor(q.x),Math.floor(q.y)),false);assert.deepEqual(f.g.resources,before);
});
test('179 interrupted bridge repair cannot manufacture integrity or final payment',()=>{
 const f=pair(),q=bridge(f);assert.ok(f.n.damage(1,100));const hp=f.n.presentation().links[0].link.health,before={...f.g.resources};assert.ok(f.n.serviceBridge(1,'repairBridge').ok);tick(f.g,2);f.g.player.health-=1;tick(f.g,20);assert.equal(f.n.presentation().links[0].link.health,hp);assert.deepEqual(f.g.resources,before);
 assert.ok(f.n.serviceBridge(1,'repairBridge').ok);tick(f.g,12);assert.equal(f.n.presentation().links[0].link.health,B.links[4].health);assert.ok(f.g.resources.scrap<before.scrap);
});
test('179 absent network in an explicit v3 save is refused rather than silently erasing cargo',()=>{
 const f=pair();packGun(f);const d=f.g.serialize(),before=snapshot(f.g);delete d.expansions127.modules.vertical175.network;assert.throws(()=>f.g.restoreSave(d));assert.deepEqual(snapshot(f.g),before);
});
test('179 visible parapets leave the paid docking corridor open on both anchors',()=>{
 const f=pair(),q=bridge(f);for(const b of [f.a,f.b])for(const rail of f.n.railGeometry(b,0).filter(r=>r.type==='edgeRail')){
  const x=rail.x+rail.w/2,y=rail.y+rail.h/2;assert.ok(!(x>q.x&&x<q.x+q.w&&y>q.y&&y<q.y+q.h),'no rail bar across a bridge doorway');
 }
});
for(const axis of ['x','y'])test('179 short wide '+axis+' bridges keep rails parallel to the actual crossing',()=>{
 const f=pair(10,'lookout2a177',2,axis),q=bridge(f),rails=f.n.geometry().filter(b=>b.type==='bridgeRail');
 assert.equal(rails.length,2);assert.ok(q.definition.width>q.gap+2*B.landing,'fixture is wider than long');
 for(const rail of rails){if(axis==='x'){assert.equal(rail.w,q.w);assert.equal(rail.h,B.railThickness);}else{assert.equal(rail.h,q.h);assert.equal(rail.w,B.railThickness);}}
 moveTo(f,f.b.x,f.b.y);assert.equal(f.v.pose().site,f.b.id);assert.ok(f.g.restoreSave(f.g.serialize()));
});
