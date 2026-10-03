'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const {g}=bootDocument134(),C=globalThis.DeadwallCore,P=globalThis.DeadwallAtlasProjection;
const sides={east:{gx:127,gy:64,x:4050,y:2064,dx:1,dy:0},west:{gx:0,gy:64,x:46,y:2064,dx:-1,dy:0},north:{gx:64,gy:0,x:2064,y:46,dx:0,dy:-1},south:{gx:64,gy:127,x:2064,y:4050,dx:0,dy:1}};
function fresh(generation=7){
 g.startNew('standard','17117');g.campaignIntro132.skip();
 if(generation!==7){const s=g.serialize(),home=globalThis.DeadwallGeography135.home(s.worldSeed,generation);Object.assign(s.frontier,{generation,x:home.maxX+2,y:home.y});s.expansions127.modules.lore131.siteGeneration=null;g.restoreSave(s);}
}
function stable(){const s=g.serialize();delete s.timestamp;return s;}
function place(type,gx,gy,rotation=0){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,rotation,1);g.world.add(b);g.refreshMetrics(true);return b;}
function vehicle(){
 place('expeditionOffice',72,65);place('expeditionGarage',77,65);g.refreshMetrics(true);g.fieldcraft.setup();standAt(g,g.player,g.core());
 g.resources.wood=g.resources.scrap=300;assert.equal(g.expeditions.buildCar().ok,true);
 const v=g.expeditions.car(),radius=g.expeditions.entity().radius;v.fuel=12;v.cargo.scrap=7;v.driving=true;g.player.radius=radius;return v;
}
function approach(side,v=null){
 const s=sides[side],offset=v?g.player.radius+1:14,edge=side==='east'||side==='south'?C.WORLD_SIZE-32-offset:32+offset;
 Object.assign(g.player,{x:s.dx?edge:s.x,y:s.dy?edge:s.y});if(v)Object.assign(v,{x:g.player.x,y:g.player.y});
 assert.ok(g.friendlyPositionClear(g.player,g.player.x,g.player.y),'Prepared commander starts in physically free terrain.');
}

test('1.51 frontière : les quatre murs refusent la sortie à pied et au volant avant toute mutation',()=>{
 for(const driving of [false,true])for(const side of Object.keys(sides)){
  fresh();const v=driving?vehicle():null,s=sides[side];place('woodWall',s.gx,s.gy);approach(side,v);
  const before=stable();assert.equal(g.frontier.enter(),false,side+' '+(driving?'vehicle':'foot'));
  assert.deepEqual(stable(),before,'Refusal preserves save bytes, RNG, stocks, fog, threats, clocks and vehicle.');
 }
});

test('1.51 frontière : une porte verrouillée bloque, une porte automatique ou ouverte laisse passer le même acteur',()=>{
 for(const driving of [false,true])for(const side of Object.keys(sides)){
  fresh();const v=driving?vehicle():null,s=sides[side],gate=place('gate',s.gx,s.gy,s.dx?1:0);gate.gateMode='closed';approach(side,v);
  const before=stable();assert.equal(g.frontier.enter(),false);assert.deepEqual(stable(),before);
  for(const mode of ['auto','open']){
   g.world.buildings.get(gate.id).gateMode=mode;const stock={...g.resources},cargo={...v?.cargo},fuel=v?.fuel,clock=g.dayClock,phaseTime=g.phaseTime;
   assert.equal(g.frontier.enter(),true,side+' '+mode+' '+(driving?'vehicle':'foot'));
   const entered=stable();assert.equal(g.restoreSave(entered),true);assert.deepEqual(stable(),entered,'Active region restores exactly.');
   const snapshot=g.serialize(),h=P.home(g);Object.assign(snapshot.frontier,{x:s.dx?(s.dx>0?h.maxX+.1:h.minX-.1):h.minX+s.x/32,y:s.dy?(s.dy>0?h.maxY+.1:h.minY-.1):h.minY+s.y/32});
   if(v)Object.assign(snapshot.frontier.car,{x:snapshot.frontier.x,y:snapshot.frontier.y});g.restoreSave(snapshot);
   assert.equal(g.frontier.leave(),true);assert.equal(g.frontier.active(),false);assert.deepEqual(g.resources,stock);assert.equal(g.dayClock,clock);assert.equal(g.phaseTime,phaseTime);
   if(v){const returned=g.expeditions.car();assert.equal(returned.id,v.id);assert.equal(returned.fuel,fuel);assert.deepEqual(returned.cargo,cargo);assert.equal(returned.driving,true);}
   const returned=stable();assert.equal(g.restoreSave(returned),true);assert.deepEqual(stable(),returned,'Returned local actor restores exactly.');
   approach(side,g.expeditions.car());
  }
 }
});

test('1.51 frontière : refus et passages légitimes préservent les registres historiques G1–G7',()=>{
 for(const generation of [1,2,3,4,5,6,7]){
  fresh(generation);Object.assign(g.player,{x:4050,y:2048});const wall=place('woodWall',127,64),before=stable();
  assert.equal(g.frontier.enter(),false);assert.deepEqual(stable(),before);
  g.world.remove(wall);const resources={...g.resources},clock=g.dayClock,phaseTime=g.phaseTime;
  assert.equal(g.frontier.enter(),true);assert.equal(g.frontier.position().generation,generation);
  const entered=stable();assert.equal(g.restoreSave(entered),true);assert.deepEqual(stable(),entered);
  const s=g.serialize(),h=P.home(g);s.frontier.x=h.maxX+.1;g.restoreSave(s);assert.equal(g.frontier.leave(),true);
  assert.deepEqual(g.resources,resources);assert.equal(g.dayClock,clock);assert.equal(g.phaseTime,phaseTime);assert.deepEqual(g.frontier.discoveries(),[]);
  const returned=stable();assert.equal(g.restoreSave(returned),true);assert.deepEqual(stable(),returned);assert.equal(g.frontier.position().generation,generation);
 }
});
