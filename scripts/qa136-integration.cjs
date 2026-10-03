'use strict';
// Production script order and real actions under a simulated DOM. Long-distance
// approaches and the vehicle's completed garage are explicitly prepared fixtures.
const assert=require('node:assert/strict');
const {bootDocument134}=require('./qa-startup134.cjs');
const {standAt}=require('../tests/helpers/physical-fixtures.cjs');
function start(seed=17117){const env=bootDocument134();env.g.startNew('standard',String(seed));env.g.campaignIntro132.skip();assert.equal(env.g.frontier.position().generation,7);return env;}
function ticks(g,count){for(let i=0;i<count;i++){g.update(.04);g.input.pressed.clear();}}
function act(g,count){g.input.keys.add('KeyE');ticks(g,count);g.input.keys.delete('KeyE');}
function loop(){
 const {g}=start(),C=globalThis.DeadwallCore;
 const node=g.world.nodes.filter(n=>!n.depleted&&g.fieldcraft.service(g.player,n)).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y))[0];
 assert.ok(node);standAt(g,g.player,node);const original=node.amount;act(g,30);
 const bag={...g.player.carry};assert.ok(C.bagTotal(bag)>0,'Récolte réelle par E');assert.ok(node.amount<original);
 const gathered=g.stats.gathered;assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.player.carry,bag);assert.equal(g.stats.gathered,gathered);
 standAt(g,g.player,g.core());const stock={...g.resources};act(g,1);assert.equal(C.bagTotal(g.player.carry),0);
 for(const k of C.RESOURCE_KEYS.filter(k=>k!=='food'))assert.equal(g.resources[k],stock[k]+bag[k]);
 let point;for(let x=67;x<82&&!point;x++)for(let y=59;y<77&&!point;y++)if(g.world.placement(C.BUILDINGS.house,x,y,0).valid)point={x,y};assert.ok(point);
 const funds={...g.resources};assert.equal(g.placeOne('house',point.x,point.y),true);const b=[...g.world.buildings.values()].at(-1);assert.equal(b.completed,false);
 for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],funds[k]-(b.def.cost[k]||0));
 standAt(g,g.player,b);g.input.keys.add('KeyE');for(let i=0;i<1000&&!b.completed;i++)ticks(g,1);g.input.keys.clear();assert.equal(b.completed,true);
 const built=g.serialize();assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.world.buildings.get(b.id).completed,true);assert.deepEqual(g.resources,built.resources);
 standAt(g,g.player,g.core());assert.equal(g.dayworks.finishDay(true).ok,true);ticks(g,1);assert.equal(g.phase,'warning');
 const warning=g.serialize();assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.phase,'warning');assert.equal(g.phaseTime,warning.phaseTime);
 for(let i=0;i<600&&g.phase==='warning';i++)ticks(g,1);assert.equal(g.phase,'assault');ticks(g,30);assert.ok(g.zombies.some(z=>!z.dead));
 const assault=g.serialize();assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.phase,'assault');assert.equal(g.zombies.filter(z=>!z.dead).length,assault.zombies.filter(z=>!z.dead).length);
 return{scenario:'loop',status:'passed',browser:false,seed:g.world.seed,node:node.id,gathered,building:b.type,wave:g.wave,zombies:g.zombies.length};
}
function prepareGarage(g){const C=globalThis.DeadwallCore,core=g.core();for(let x=67;x<82;x++)for(let y=59;y<77;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){const b=new(core.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}throw Error('No clear garage fixture');}
function vehicle(){
 const {g}=start(),C=globalThis.DeadwallCore,P=globalThis.DeadwallAtlasProjection;prepareGarage(g);standAt(g,g.player,g.core());
 const built=g.expeditions.buildCar();assert.equal(built.ok,true,built.reason);let car=g.expeditions.car();const id=car.id;
 // Transfer from the existing depot into the bag, then through the actual trunk command.
 assert.equal(g.loadout.transfer('depot','sac','scrap',8).ok,true);let beside;for(let i=0;i<24;i++){const q={x:car.x+Math.cos(i*Math.PI/12)*50,y:car.y+Math.sin(i*Math.PI/12)*50};if(g.friendlyPositionClear(g.player,q.x,q.y)&&g.hostileLineClear(q,car)){beside=q;break;}}assert.ok(beside,'Portière accessible');Object.assign(g.player,beside);
 assert.equal(g.expeditions.transfer().ok,true);assert.equal(car.cargo.scrap,8);assert.equal(g.player.carry.scrap,0);
 assert.equal(g.expeditions.refuel().ok,true);assert.ok(car.fuel>0);assert.equal(g.expeditions.board().ok,true);
 // Put the prepared vehicle on the physically free eastern approach. Actual
 // travel across the boundary and the return are driven through input/update.
 let arrival;for(const y of [2048,1800,2250,1470])if(g.expeditions.carClear(4028,y)){arrival={x:4028,y};break;}assert.ok(arrival);
 Object.assign(car,arrival);Object.assign(g.player,arrival);g.input.keys.add('KeyD');for(let i=0;i<100&&!g.frontier.active();i++)ticks(g,1);g.input.keys.clear();
 assert.equal(g.frontier.active(),true);assert.equal(g.frontier.position().car.driving,true);assert.equal(g.expeditions.driving(),false);assert.equal(g.expeditions.entity(),null);
 const regional=g.frontier.position(),h=P.home(g);assert.ok(regional.x>h.maxX);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 car=g.expeditions.car();assert.equal(car.id,id);assert.equal(car.cargo.scrap,8);assert.equal(g.frontier.position().car.driving,true);assert.equal(car.regionAway,true);
 g.input.keys.add('KeyD');ticks(g,30);g.input.keys.clear();assert.ok(g.frontier.position().x>regional.x);const fuel=car.fuel;
 assert.equal(g.frontier.board(),true);assert.equal(g.frontier.position().car.driving,false);assert.equal(g.frontier.vehiclePresent(),true);
 assert.equal(g.fieldSupplies.transfer('car','scrap','withdraw',3).ok,true);assert.equal(g.player.carry.scrap,3);assert.equal(car.cargo.scrap,5);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);car=g.expeditions.car();assert.equal(g.frontier.position().car.driving,false);assert.equal(g.frontier.vehiclePresent(),true);assert.equal(car.cargo.scrap,5);assert.equal(g.player.carry.scrap,3);assert.equal(car.fuel,fuel);
 assert.equal(g.frontier.board(),true);g.input.keys.add('KeyA');for(let i=0;i<180&&g.frontier.active();i++)ticks(g,1);g.input.keys.clear();assert.equal(g.frontier.active(),false);assert.equal(g.expeditions.driving(),true);assert.equal(g.frontier.position().car,null);assert.equal(g.expeditions.car().cargo.scrap,5);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.expeditions.car().id,id);assert.equal(g.expeditions.driving(),true);assert.equal(g.expeditions.car().regionAway,false);
 assert.equal(g.expeditions.board().ok,true);assert.equal(g.player.radius,13,'À pied après reprise au volant : rayon du commandant restauré');assert.equal(g.expeditions.driving(),false);
 return{scenario:'vehicle',status:'passed',browser:false,prepared:'Garage completed; car moved onto verified free approach before actual crossing',car:id,carriedScrap:3,cargoScrap:5,fuel:g.expeditions.car().fuel};
}
const scenarios={loop,vehicle};module.exports={scenarios};
if(require.main===module){const name=process.argv[2]||'loop';try{if(!scenarios[name])throw Error('Unknown scenario: '+name);Promise.resolve(scenarios[name]()).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(e=>{console.error(e.stack);process.exitCode=1;});}catch(e){console.error(e.stack);process.exitCode=1;}}
