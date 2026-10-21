'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
const clone=value=>JSON.parse(JSON.stringify(value));
function fixture(){
 const records=new Map();let attempt=()=>false,tones=0,damage=0,reads=0;
 const pose={active:true,x:12,y:15.4,z:0,inside:null,a:0,hydrologyVersion:1,landscape189:'balanced'};
 const rabbit={id:'A189_0_0_0',species:'rabbit',x:12,y:15,z:0,hp:0,profile:{name:'Lapin',health:10,mode:'land'}};
 const fish={id:'A189_0_0_1',species:'trout',x:13.5,y:15.4,z:0,hp:10,profile:{name:'Truite',health:10,mode:'swim'}};
 const boar={id:'A189_0_0_2',species:'boar',x:12,y:15.4,z:0,hp:5,alarm:1,profile:{name:'Sanglier',health:10,mode:'land'}};
 const animals=new Map([rabbit,fish,boar].map(a=>[a.id,a]));
 const world={home:{x:900,y:900},size:24576,blocked:()=>false,line:()=>true,movementLine:()=>true,wildlifeWaterLine:()=>true,nearestRoad:()=>null,
  hydrology:{sample:x=>({water:x>13,crossing:null,salinity:'fresh'})}};
 const g={world:{seed:17117},elapsed:0,dayClock:.4,state:'playing',paused:false,activeOverlay:null,gameOver:false,
  player:{dead:false,health:100,reload:0,carry:{...Object.fromEntries(C.RESOURCE_KEYS.map(k=>[k,0])),wood:30,scrap:20,food:10,fuel:4,medicine:3},carryCapacity:120},
  input:{keys:new Set(),pressed:new Set(),mouseDown:false,touchFire:false},settings:{volume:1,muted:false},stats:{gathered:0},resources:{food:100},
  audio:{tone(){tones++;}},notify(){},save:()=>true,returnToMenu(){},update(dt){g.elapsed+=dt;},
  startNew(...args){return attempt(...args);},
  expansions:{canAct:()=>true,busy:owner=>[...records].some(([id,d])=>id!==owner&&d.busy()),register:d=>records.set(d.id,d)},
  arsenal134:{snapshot:()=>({equipped:1,carried:[{uid:1,id:'knife',condition:100}]}),toolFactor:()=>1,wearTool(){}},
  frontier:{position:()=>pose,world:()=>world,contacts:()=>[],signalAt(){},
   wildlifeStatus165:id=>animals.get(id),wildlife165:()=>[...animals.values()].filter(a=>a.hp>0&&!g.husbandry191?.claimed(a.id)),
   wildlifeRemains165(){reads++;return [...animals.values()].filter(a=>a.hp===0);},
   hitWildlife165(id,n){const a=animals.get(id);if(!a||a.hp<=0)return false;a.hp=Math.max(0,a.hp-n);return true;},
   damage(){damage++;return true;},retireWildlife191(id){animals.get(id).hp=0;return true;},releaseCaptive191:()=>true}};
 const context=vm.createContext({DeadwallCore:C,DeadwallFrontierGeometry:G,DeadwallFrontierWorld:{RULES:{footRadius:.32},sizeForGeneration:()=>24576},DeadwallBiomePopulation165:{},DeadwallWildlife189:{awake:()=>true,species:()=>({rabbit:rabbit.profile,trout:fish.profile,boar:boar.profile})}});
 for(const path of ['src/wildlife-harvest190.js','src/husbandry191.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context);
 context.DeadwallWildlifeHarvest190.install(g);context.DeadwallHusbandry191.install(g);
 const harvest=g.wildHarvest190,husbandry=g.husbandry191;
 return {g,pose,rabbit,fish,boar,harvest,husbandry,records,reads:()=>reads,tones:()=>tones,damage:()=>damage,
  attempt:fn=>attempt=fn,reset:()=>{for(const d of records.values())d.reset();},
  state:()=>clone({harvest:harvest.snapshot(),husbandry:husbandry.snapshot(),bag:g.player.carry,resources:g.resources})};
}
const oldLedger=()=>({version:1,harvested:{A189_2_0_0:1}});
const owned=()=>({version:1,next:2,behaviors:true,pens:[{id:1,x:12,y:12,health:60,food:10,water:10,meat:0,hides:0,leather:0,breed:0,meatAge:0,hideAge:0}],animals:[]});
function abort(f,mode='throw'){
 f.attempt(()=>{f.reset();if(mode==='throw')throw Error('creator rejected after reset');return false;});
 if(mode==='throw')assert.throws(()=>f.g.startNew(),/creator rejected/);else assert.equal(f.g.startNew(),false);
}
for(const mode of ['throw','return'])test('202 rejected new campaign preserves finite harvest ledger and paid work: '+mode,()=>{
 const f=fixture();f.records.get('wildlife190').restore(oldLedger());
 assert.equal(f.harvest.begin('fish',f.fish.id).ok,true);f.harvest.step(.1);
 const before=f.state(),work=clone(f.harvest.overview().task),world=f.g.world;
 abort(f,mode);assert.equal(f.g.world,world);assert.deepEqual(f.state(),before);assert.deepEqual(clone(f.harvest.overview().task),work);
 assert.equal(f.harvest.hooked(f.fish.id),true);
 // The existing paid task may finish once; a failed campaign does not grant new supplies.
 for(let i=0;i<150&&f.harvest.busy();i++)f.harvest.step(.1);
 assert.equal(f.harvest.busy(),false);assert.ok(f.harvest.taken(f.fish.id)>0);assert.equal(f.harvest.taken('A189_2_0_0'),1);
 assert.equal(f.g.player.carry.wood,before.bag.wood);assert.equal(f.g.player.carry.scrap,before.bag.scrap);
});
for(const mode of ['throw','return'])test('202 aborted campaign preserves same-world choice cache without repeatedly querying the map: '+mode,()=>{
 const f=fixture();f.harvest.actions();const n=f.reads();assert.ok(n>0);abort(f,mode);f.harvest.actions();assert.equal(f.reads(),n);
});
for(const mode of ['throw','return'])test('202 rejected campaign cannot reset a wild attack cooldown: '+mode,()=>{
 const f=fixture();f.records.get('husbandry191').restore(owned());
 f.husbandry.naturalIntent(f.boar);assert.equal(f.damage(),1);abort(f,mode);
 f.husbandry.naturalIntent(f.boar);assert.equal(f.damage(),1);
 f.g.elapsed+=C.Husbandry191Rules.boarCooldown;f.husbandry.naturalIntent(f.boar);assert.equal(f.damage(),2);
});
for(const mode of ['throw','return'])test('202 interrupted creation preserves wildlife sound cadence: '+mode,()=>{
 const f=fixture();f.g.update(.1);assert.equal(f.tones(),1);
 for(let i=0;i<29;i++)f.g.update(.1);abort(f,mode);
 for(let i=0;i<22;i++)f.g.update(.1);assert.equal(f.tones(),2);
});
test('202 rejected campaign keeps already paid enclosure maintenance without refund or completion',()=>{
 const f=fixture();f.records.get('husbandry191').restore(owned());assert.equal(f.husbandry.begin('repair',1).ok,true);f.husbandry.step(.1);
 const before=f.state(),task=clone(f.husbandry.view().task);abort(f);
 assert.deepEqual(f.state(),before);assert.deepEqual(clone(f.husbandry.view().task),task);
});
for(const throws of [false,true])test('202 changed world never recovers a previous campaign ledger: throws='+throws,()=>{
 const f=fixture();f.records.get('wildlife190').restore(oldLedger());f.records.get('husbandry191').restore(owned());
 const old=f.g.world;f.attempt(()=>{f.reset();f.g.world={seed:9};if(throws)throw Error('failure after replacement');return true;});
 if(throws)assert.throws(()=>f.g.startNew(),/failure after replacement/);else assert.equal(f.g.startNew(),true);
 assert.notEqual(f.g.world,old);assert.equal(Object.keys(f.harvest.snapshot().harvested).length,0);assert.equal(f.husbandry.view().pens.length,0);
});
for(const kind of ['fish','harvest'])for(const equipment of ['mount','fire'])test('202 '+kind+' refuses '+equipment+' before any payment or hooking',()=>{
 const f=fixture(),id=kind==='fish'?f.fish.id:f.rabbit.id;
 if(equipment==='mount')f.g.fieldcraft={context:()=>({mounted:true})};else f.g.siege={toolActive:()=>true};
 const before=f.state();assert.equal(f.harvest.quote(kind,id).ok,false);assert.equal(f.harvest.begin(kind,id).ok,false);
 assert.deepEqual(f.state(),before);assert.equal(f.harvest.busy(),false);assert.equal(f.fish.hp,10);
});
for(const equipment of ['mount','fire'])test('202 held equipment acquired after payment interrupts fishing without refund: '+equipment,()=>{
 const f=fixture();assert.equal(f.harvest.begin('fish',f.fish.id).ok,true);const bag=clone(f.g.player.carry);
 if(equipment==='mount')f.g.fieldcraft={context:()=>({mounted:true})};else f.g.siege={toolActive:()=>true};
 f.harvest.step(.1);assert.equal(f.harvest.busy(),false);assert.equal(f.fish.hp,10);assert.deepEqual(f.g.player.carry,bag);assert.equal(f.harvest.taken(f.fish.id),0);
});
test('202 putting equipment away restores the normal operation without a free reward',()=>{
 const f=fixture();f.g.siege={toolActive:()=>true};assert.equal(f.harvest.begin('fish',f.fish.id).ok,false);
 f.g.siege.toolActive=()=>false;assert.equal(f.harvest.begin('fish',f.fish.id).ok,true);assert.equal(f.harvest.taken(f.fish.id),0);
 assert.equal(f.g.player.carry.food,10-C.WildlifeHarvest190Rules.fishingCost.food);
});
