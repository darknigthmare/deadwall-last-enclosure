'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const C=require('../src/core.js'),E=require('../src/exploration-125.js');
const full={left:0,top:0,right:4096,bottom:4096};
function fresh(){const{game:g}=boot127();g.startNew('standard','17117');require('../src/atlas-render.js');require('../src/essential-art.js');return g;}
function outside(g){g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());}
function queue(g,projection){return g.depthEntries({...full,homeProjection:projection}).filter(e=>e.kind!==4).map(e=>({kind:e.kind,id:e.id,depth:e.depth,entity:e.entity.__explorationPack||e.entity.__survivalCamp||e.entity.id}));}
function recording(g){const ctx=g.ctx,fills=[],translations=[];ctx.fillRect=function(...rect){fills.push({color:this.fillStyle,rect});};ctx.translate=(...p)=>translations.push(p);return{ctx,fills,translations};}
test('1.29 maps cross-review: all four seeded rotations preserve station door and furniture collision geometry',()=>{
 const seen=new Set();for(let seed=1;seed<=40&&seen.size<4;seed++){const p=E.createFeaturePlan(seed,4096,2);if(seen.has(p.layoutTurns))continue;seen.add(p.layoutTurns);
  for(const s of p.stations){assert.equal(s.solids.some(b=>E.circleIntersectsRect(s.door.x,s.door.y,13,b)),false,'door blocked '+seed+':'+s.id);
   for(const f of E.stationFurniture(s)){const collision=p.solids.find(b=>b.kind==='station-furniture'&&b.station===s.id&&Math.abs(b.x+b.w/2-f.x)<.001&&Math.abs(b.y+b.h/2-f.y)<.001);assert.ok(collision,'missing rotated furniture');assert.equal(collision.w,f.w);assert.equal(collision.h,f.h);}
  }
 }assert.equal(seen.size,4);
});
test('1.29 maps cross-review: complete local depth queue survives exit, projection, save/reload and return',()=>{
 const g=fresh(),a=require('../src/exploration-pack.js').initial(),b=require('../src/survival-pack.js').initial();a.serial=3;a.caches=[{id:1,x:400,y:450,stock:C.makeBag()}];a.markers=[{id:2,x:600,y:500}];b.serial=2;b.camps=[{id:1,domain:'local',x:700,y:550,z:0,inside:null,left:600,cover:0}];g.expansions.get('exploration').restore(a);g.expansions.get('survival').restore(b);
 const before=queue(g,false);assert.ok(before.length>g.world.nodes.length);outside(g);assert.deepEqual(queue(g,true),before);assert.ok(queue(g,false).length<before.length,'regional scene alone does not duplicate local props');
 const save=g.serialize();save.frontier.x=4160.5;save.frontier.y=4096;g.restoreSave(save);assert.deepEqual(queue(g,true),before);assert.ok(g.frontier.leave());assert.deepEqual(queue(g,false),before);assert.equal(g.exploration125.layoutRevision,3);assert.deepEqual(g.explorationPack.snapshot(),a);assert.deepEqual(g.survivalPack.snapshot(),b);
});
test('1.29 maps cross-review: fortification debris remains drawn from outside D17',()=>{
 const g=fresh(),b=new(g.core().constructor)(g.nextId++,'watchtower',72,72,0,1);g.world.add(b);g.refreshMetrics(true);g.destroyBuilding(b);assert.equal(g.fortificationPack.snapshot().debris.length,1);
 const{ctx,fills}=recording(g);g.drawGround(ctx,full);assert.ok(fills.some(f=>f.color==='#887661'));
 outside(g);fills.length=0;g.drawGround(ctx,{...full,homeProjection:true});assert.ok(fills.some(f=>f.color==='#887661'));fills.length=0;g.drawGround(ctx,full);assert.equal(fills.some(f=>f.color==='#887661'),false);
});
test('1.29 maps cross-review: projected lights follow the visible area rather than stale local player position',()=>{
 const g=fresh(),save=g.serialize();save.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',domain:'local',x:120,y:160,z:0,inside:null,angle:0,left:C.NightGearRules.types.lantern.duration,on:false,used:false}]};g.restoreSave(save);outside(g);
 const{ctx,translations}=recording(g);g.nightGear.draw(ctx,'local');assert.equal(translations.some(p=>p[0]===120&&p[1]===160),false,'old player-dependent cull in ordinary local view');
 translations.length=0;g.nightGear.draw(ctx,'local',{left:80,top:120,right:180,bottom:200,homeProjection:true});assert.ok(translations.some(p=>p[0]===120&&p[1]===160),'survival wrapper forwards projection viewport');
 translations.length=0;g.nightGear.draw(ctx,'local',{left:300,top:300,right:400,bottom:400,homeProjection:true});assert.equal(translations.some(p=>p[0]===120&&p[1]===160),false);assert.deepEqual(g.nightGear.snapshot(),save.nightGear);
});
test('1.29 maps cross-review: local essential packages are projected without duplicating carried equipment',()=>{
 const g=fresh(),jobs=C.Essentials.content.jobs;assert.ok(jobs.length>1);const snapshot={jobs:{[jobs[0].id]:{stage:'ground',point:{domain:'local',x:123,y:456}},[jobs[1].id]:{stage:'player'}},effects:[]};
 const{ctx,translations}=recording(g);const fixture={essentials:{snapshot:()=>snapshot},player:{x:900,y:800,dead:false},expeditions:{driving:()=>false}};
 globalThis.DeadwallEssentialArt.local(ctx,fixture,{carried:false});assert.deepEqual(translations,[[123,456]]);
 translations.length=0;globalThis.DeadwallEssentialArt.local(ctx,fixture);assert.equal(translations.length,2,'ordinary local scene still draws carried package');
});
