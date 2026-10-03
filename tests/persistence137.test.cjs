'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,C;
test.before(()=>{g=bootDocument134().g;C=globalThis.DeadwallCore;});
function begin(generation){
 g.startNew('standard','17117');g.campaignIntro132.skip();
 if(generation===5)assert.equal(g.restoreSave(JSON.parse(fs.readFileSync(require.resolve('../reports/1.35.0/legacy-g5-start-save.json'),'utf8'))),true);
 if(generation===6){
  // This historical bus fixture predates G7. Select its original generation
  // before any exploration, retaining the actual G6 geometry and save checks.
  const d=g.serialize(),h=globalThis.DeadwallGeography135.home(g.world.seed,6);
  assert.equal(d.frontier.active,false);assert.deepEqual(d.frontier.seen,[]);assert.deepEqual(d.frontier.taken,{});assert.deepEqual(d.frontier.enemies,{});
  Object.assign(d.frontier,{generation:6,x:h.maxX+2,y:h.y,z:0,inside:null,anchor:null,car:null});assert.equal(g.restoreSave(d),true);
 }
 assert.equal(g.frontier.position().generation,generation);
}
function bus(){
 const c=g.core();let garage=null;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(c.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);break;}
 assert.ok(garage,'Fixture : garage achevé dans une emprise libre.');g.refreshMetrics(true);
 // A late-campaign fixture exposes the already-defined bus; its actual purchase
 // and all subsequent inventory operations still use the shipped public APIs.
 g.tier={id:4};g.resources.wood=g.resources.scrap=500;
 assert.equal(g.worldEvolution.selectVehicle('bus'),true);const before={...g.resources};
 const result=g.expeditions.buildCar();assert.equal(result.ok,true,result.reason);
 for(const[k,n]of Object.entries(C.WorldEvolution.RULES.vehicles.bus.cost))assert.equal(g.resources[k],before[k]-n);
 return g.expeditions.car();
}
function approach(v){
 const radius=g.expeditions.entity().radius;
 for(let i=0;i<32;i++){const a=i*Math.PI/16,p={x:v.x+Math.cos(a)*(radius+15),y:v.y+Math.sin(a)*(radius+15)};if(!g.friendlyPositionClear(g.player,p.x,p.y))continue;Object.assign(g.player,p);if(!g.loadout.access({id:'car:'+v.id}))return;}
 throw Error('Fixture : aucun accès au coffre.');
}
for(const generation of [6,5,7])test((generation===7?'141':'137')+' G'+generation+' : le bus est livré dans son gabarit réel et garde son coffre après reprise et descente',()=>{
 begin(generation);let v=bus();const radius=Number((10.4*22/4.6).toFixed(6));
 assert.equal(g.expeditions.carClear(v.x,v.y),true,'Un véhicule neuf doit pouvoir occuper sa propre aire.');
 assert.equal(g.expeditions.entity().radius,radius,'Le gabarit des portes et chantiers doit être celui de la conduite.');
 let shoulder=null;
 for(let y=Math.floor((v.y-radius)/32);y<=Math.ceil((v.y+radius)/32)&&!shoulder;y++)for(let x=Math.floor((v.x-radius)/32);x<=Math.ceil((v.x+radius)/32);x++){
  const overlaps=v.x+radius>x*32&&v.x-radius<(x+1)*32&&v.y+radius>y*32&&v.y-radius<(y+1)*32;
  const oldOverlaps=v.x+22>x*32&&v.x-22<(x+1)*32&&v.y+22>y*32&&v.y-22<(y+1)*32;
  if(!overlaps||oldOverlaps)continue;
  const health=v.health;v.health=0;const empty=g.world.placement(C.BUILDINGS.woodWall,x,y,0);v.health=health;
  if(empty.valid){shoulder={x,y};break;}
 }
 assert.ok(shoulder,'Fixture : cellule libre dans le gabarit du bus, hors ancien rayon du break.');
 assert.equal(g.world.placement(C.BUILDINGS.woodWall,shoulder.x,shoulder.y,0).valid,false,'Un chantier ne doit pas recouvrir le bus.');
 const before=g.resources.food;assert.equal(g.loadout.transfer('depot','sac','food',3.125).ok,true);approach(v);
 assert.equal(g.loadout.transfer('sac','car:'+v.id,'food',3.125).ok,true);assert.equal(v.cargo.food,3.125);
 assert.equal(g.expeditions.board().ok,true);assert.equal(g.player.radius,radius);assert.equal(g.save(false),true);assert.equal(g.load(),true);
 v=g.expeditions.car();assert.equal(v.cargo.food,3.125);assert.equal(g.resources.food,before-3.125);assert.equal(g.player.radius,radius);assert.equal(g.expeditions.carClear(v.x,v.y),true);
 assert.equal(g.expeditions.board().ok,true);assert.equal(g.player.radius,g.makePlayer(0).radius);
 assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.frontier.position().generation,generation);assert.equal(g.expeditions.entity().radius,radius);assert.equal(g.expeditions.car().cargo.food,3.125);
});

test('137 ancienne livraison du bus : la reprise dégage son gabarit sans perdre son identité, son carburant ou son coffre',()=>{
 begin(6);bus();const raw=g.serialize();
 // Exact blocked point reproduced on 1.36, seed 17117: construction checked
 // the old break radius before activating the newly bought bus profile.
 Object.assign(raw.expeditions.vehicle,{x:2048,y:2138,fuel:7});raw.expeditions.vehicle.cargo.food=3.125;
 const id=raw.expeditions.vehicle.id;assert.equal(g.restoreSave(raw),true);const v=g.expeditions.car();
 assert.equal(v.id,id);assert.equal(v.fuel,7);assert.equal(v.cargo.food,3.125);assert.equal(g.expeditions.carClear(v.x,v.y),true);
 assert.notDeepEqual([v.x,v.y],[2048,2138]);const point=[v.x,v.y];
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual([g.expeditions.car().x,g.expeditions.car().y],point,'Une aire déjà dégagée doit rester stable.');
});
