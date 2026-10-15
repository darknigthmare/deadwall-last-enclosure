'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
const{boot131}=require('./helpers/expansions131.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
function owned(g){const d=copy(g.serialize());return{frontier:d.frontier,resources:d.resources,fieldSupplies:d.fieldSupplies,
 nightGear:d.nightGear,essentials:d.essentials,worldEvolution:d.worldEvolution,expeditions:d.expeditions,
 succession133:d.succession133,companions:d.expansions127.modules.companions,interventions:d.expansions127.modules.interventions134,
 player:{carry:d.player.carry,magazine:d.player.magazine,health:d.player.health}};}
function resource(w){
 const cx=Math.floor(w.home.x/256),cy=Math.floor(w.home.y/256);
 for(let radius=1;radius<=8;radius++)for(const[dx,dy]of[[radius,0],[-radius,0],[0,radius],[0,-radius]]){
  const c=w.chunk(cx+dx,cy+dy),node=[...c.trees,...c.rocks].find(n=>n.amount>1);if(node)return node;
 }
 assert.fail('The actual ecological world must provide a finite nearby resource');
}
function parking(w){
 // Water and new parcels may occupy the former east-only fixture. Find an
 // actual outside position, keeping the car and its campfire physically free.
 for(let radius=90;radius<=600;radius+=10)for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,p={x:w.home.x+Math.cos(angle)*radius,y:w.home.y+Math.sin(angle)*radius};
  if(p.x>w.home.minX-10&&p.x<w.home.maxX+10&&p.y>w.home.minY-10&&p.y<w.home.maxY+10)continue;
  if(w.vehicleClear(p.x,p.y,0,4.6,1.85)&&!w.blocked(p.x+6,p.y,.32)&&!w.nearPOI(p.x,p.y,50).length)return p;
 }
 assert.fail('The prepared vehicle and camp require real clear outside ground');
}
for(const seed of ['17117','42','84329'])test('164 ecological campaign '+seed+' continues finite contents, resources, lamps, camp, companion, body and parked vehicle',()=>{
 const{g}=boot131({seed,generation:8});
 require('../src/succession133.js').install(g);require('../src/interventions134.js').install(g);
 const w=g.frontier.world();assert.equal(w.ecologyVersion,1);
 const upstairs=w.pois.find(p=>p.levels.includes(1)&&w.plan(p,1).stairs.length);assert.ok(upstairs);
 const stair=w.plan(upstairs,1).stairs[0],point=G.global(upstairs,stair.x+stair.w/2,stair.y+stair.h/2);
 assert.equal(w.blocked(point.x,point.y,.32,1,upstairs.id),false);
 let container;
 for(const p of w.pois){const object=w.plan(p,0).objects.find(o=>C.FieldSupplies.RULES.cacheKinds.includes(o.kind)&&['crate','wardrobe'].includes(o.kind)&&!o.sealed131&&o.amount>0);
  if(object){container={...object,poi:p.id};break;}}
 assert.ok(container);const node=resource(w),outside=parking(w),d=copy(g.serialize()),carId=d.nextId++;
 // Explicit late-state persistence fixture: the stocks and equipped devices
 // are prepared here. Their acquisition and campaign duration are not claimed.
 d.frontier.seen=[...new Set([...d.frontier.seen,upstairs.id,container.poi])];
 Object.assign(d.frontier,{active:true,...point,z:1,inside:upstairs.id,anchor:{x:d.player.x,y:d.player.y},
  car:{id:carId,...outside,a:0,driving:false}});
 d.frontier.taken[container.id]=container.amount;d.frontier.taken[node.id]=Math.min(2,node.amount);
 d.fieldSupplies.caches=[{id:container.id,stock:C.makeBag({wood:3,scrap:2})}];
 d.expeditions.vehicle={id:carId,x:d.player.x,y:d.player.y,health:300,fuel:9.25,angle:0,driving:false,cargo:C.makeBag({food:4,fuel:2})};
 d.worldEvolution.structures[container.poi]=.8;
 d.expansions127.modules.companions.positions.samir={...point,z:1,inside:upstairs.id,a:0};
 d.nightGear={version:1,serial:3,devices:[{id:1,kind:'lantern',location:'placed',left:93.5,on:true,used:true,
  domain:'region',...point,z:1,inside:upstairs.id,angle:0},
  {id:2,kind:'campfire',location:'placed',left:81.25,on:false,used:true,domain:'region',x:outside.x+6,y:outside.y,z:0,inside:null,angle:0}]};
 d.expansions127.modules.interventions134.unlocked=[container.id];
 d.player.carry=C.makeBag({food:7,scrap:3});
 assert.equal(g.restoreSave(d),true);assert.equal(g.frontier.world().ecologyVersion,1);
 assert.equal(g.fieldSupplies.snapshot().caches[0].stock.wood,3);
 // Capture a real regional death at the genuine stair, then select a successor.
 g.player.invulnerable=0;g.frontier.damage(1000);assert.equal(g.succession133.pending(),true);
 const remains=g.succession133.remains()[0];assert.equal(remains.point.inside,upstairs.id);assert.equal(remains.point.z,1);
 assert.equal(remains.bag.food,7);assert.equal(g.succession133.select('builder'),true);
 const expected=owned(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.deepEqual(owned(g),expected);assert.equal(g.frontier.world().ecologyVersion,1);
 assert.equal(g.frontier.takenAmount(container.id),container.amount);assert.equal(g.frontier.takenAmount(node.id),Math.min(2,node.amount));
 assert.equal(g.expeditions.car().fuel,9.25);assert.equal(g.nightGear.snapshot().devices[0].left,93.5);
 assert.equal(g.nightGear.snapshot().devices[1].left,81.25);assert.equal(g.succession133.remains().length,1);
 assert.equal(g.restoreSave(copy(g.serialize())),true);assert.deepEqual(owned(g),expected);
 const bad=copy(g.serialize());bad.frontier.taken[node.id]=node.amount+1;const world=g.world;
 assert.throws(()=>g.restoreSave(bad),/Prélèvement supérieur/);assert.equal(g.world,world);assert.deepEqual(owned(g),expected);
});
