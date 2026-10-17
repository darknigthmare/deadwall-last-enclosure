'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../src/core.js');
function fixture(){
 let raw,clock=0,tones=0;const rules=C.Husbandry191Rules,position={active:true,x:12,y:15.4,z:0,a:-Math.PI/2,landscape189:'balanced',hydrologyVersion:1};
 const animals=new Map([['A189_0_0_0',{id:'A189_0_0_0',species:'rabbit',x:12,y:15,z:0,hp:10,profile:{health:10,name:'Lapin',mode:'land'}}]]);
 const world={size:24576,home:{x:600,y:600},blocked:()=>false,nearestRoad:()=>null,nearPOI:()=>[],movementLine:()=>true,line:()=>true,wildlifeWaterLine:()=>true,hydrology:{sample:()=>({water:false,salinity:'fresh'})}};
 const g={wildHarvest190:{},world:{seed:17117},state:'playing',gameOver:false,paused:false,activeOverlay:null,elapsed:0,dayClock:.4,settings:{volume:1,muted:false},
  player:{health:100,dead:false,reload:0,carry:{wood:30,scrap:20,food:30,fuel:20},carryCapacity:120},input:{keys:new Set(),pressed:new Set(),mouseDown:false,touchFire:false},stats:{},
  audio:{tone(){tones++;}},expansions:{canAct:()=>true,busy:()=>false,register:d=>raw=d},arsenal134:{snapshot:()=>({equipped:1,carried:[{uid:1,id:'knife',condition:100}]}),wearTool(){}},
  frontier:{world:()=>world,position:()=>position,contacts:()=>[],wildlifeStatus165:id=>animals.get(id),wildlife165:()=>[...animals.values()].filter(a=>a.hp>0&&!g.husbandry191?.claimed(a.id)),signalAt(){},retireWildlife191(id){if(!g.husbandry191.owns(id))return false;animals.get(id).hp=0;return true;},releaseCaptive191(id){animals.get(id).hp=Math.min(animals.get(id).hp,10*g.husbandry191.healthFraction(id));return true;},damage:()=>true,hitWildlife165(id,n){animals.get(id).hp=Math.max(0,animals.get(id).hp-n);return true;}},update(dt){g.elapsed+=dt;},returnToMenu(){},save:()=>true,notify(){}};
 const ctx=vm.createContext({DeadwallCore:C,DeadwallFrontierWorld:{RULES:{size:8192},sizeForGeneration:()=>24576},DeadwallBiomePopulation165:{},DeadwallWildlife189:{species:()=>({rabbit:{name:'Lapin'}}),awake:()=>true},DeadwallFrontierGeometry:{hash:(...a)=>a.join('').length}});
 vm.runInContext(fs.readFileSync('src/husbandry191.js','utf8'),ctx);ctx.DeadwallHusbandry191.install(g);
 return{g,world,position,animals,api:ctx.DeadwallHusbandry191,restore:s=>raw.restore(s),read:()=>raw.snapshot(),tones:()=>tones};
}
const pen=()=>({id:1,x:12,y:12,health:100,food:30,water:30,meat:0,hides:0,leather:0,breed:0,meatAge:0,hideAge:0});
const stock=()=>({version:1,next:4,behaviors:false,pens:[pen()],animals:[{id:2,source:'A189_0_0_0',species:'rabbit',pen:1,sex:'female',age:900,health:100,status:'held',parents:[]},{id:3,source:'A189_0_0_1',species:'rabbit',pen:1,sex:'male',age:900,health:100,status:'held',parents:[]}]});
for(const change of [s=>s.next=0,s=>s.pens[0].food=-1,s=>s.animals[0].source='__proto__',s=>s.animals[0].health=Infinity,s=>s.animals[0].age=NaN,s=>s.animals[0].pen=9,s=>s.pens[0].health=0,s=>s.animals[1].source=s.animals[0].source,s=>s.pens[0].bonus=1,s=>s.behaviors='yes'])test('191 strict schema rejects '+String(change),()=>{const {api}=fixture(),s=stock();change(s);assert.throws(()=>api.validate(s),/invalide/);});
test('191 absent save keeps husbandry empty; copies do not mutate accepted state',()=>{const f=fixture();assert.equal(f.api.validate(undefined).pens.length,0);f.restore(stock());const v=f.g.husbandry191.view();v.pens[0].food=999;assert.equal(f.read().pens[0].food,30);});
test('191 reproduction consumes upkeep and birth resources and creates exactly one persistent juvenile',()=>{
 const f=fixture(),s=stock();s.pens[0].breed=C.Husbandry191Rules.breedSeconds-.05;f.restore(s);f.g.husbandry191.step(.1);const after=f.read();
 assert.equal(after.animals.length,3);const child=after.animals[2];assert.equal(child.source,null);assert.equal(child.age,0);assert.deepEqual([...child.parents],[2,3]);assert.ok(after.pens[0].food<28);assert.ok(after.pens[0].water<26);
 f.restore(after);f.g.husbandry191.step(.1);assert.equal(f.read().animals.length,3);assert.ok(f.read().animals[2].age>0);
});
for(const absent of ['food','water'])test('191 no birth without '+absent+'; starvation cannot be bypassed by pause',()=>{
 const f=fixture(),s=stock();s.pens[0].breed=899.99;s.pens[0][absent]=0;f.restore(s);f.g.paused=true;f.g.husbandry191.step(.1);assert.equal(f.read().animals[0].health,100);assert.equal(f.read().pens[0].breed,899.99);f.g.paused=false;
 f.g.husbandry191.step(.1);assert.equal(f.read().animals.length,2);assert.equal(f.read().pens[0].breed,0);assert.ok(f.read().animals[0].health<100);
});
test('191 same-sex, juvenile or crowded groups never reproduce',()=>{
 for(const mutate of [s=>s.animals[1].sex='female',s=>s.animals[1].age=0,s=>s.animals[1].health=74]){const f=fixture(),s=stock();s.pens[0].breed=899.99;mutate(s);f.restore(s);f.g.husbandry191.step(.1);assert.equal(f.read().animals.length,2);assert.equal(f.read().pens[0].breed,0);}
});
test('191 tanning is a finite conversion and leather repairs an actual damaged enclosure',()=>{
 const f=fixture(),s=stock();s.pens[0].hides=2;s.pens[0].leather=1;s.pens[0].health=70;s.animals=[];f.restore(s);const fuel=f.g.player.carry.fuel;
 assert.ok(f.g.husbandry191.begin('tan',1).ok);for(let i=0;i<121;i++)f.g.husbandry191.step(.1);let p=f.read().pens[0];assert.equal(p.hides,1);assert.equal(p.leather,2);assert.equal(p.water,28);assert.equal(f.g.player.carry.fuel,fuel-.5);
 assert.ok(f.g.husbandry191.begin('lining',1).ok);p=f.read().pens[0];assert.equal(p.leather,0);assert.equal(p.health,95);
});
test('191 delayed frames do not fast-forward husbandry and raw products spoil without becoming free food',()=>{
 const f=fixture(),s=stock();s.animals=[];s.pens[0].meat=4;s.pens[0].hides=2;s.pens[0].meatAge=899.95;s.pens[0].hideAge=1799.95;f.restore(s);const before=f.g.player.carry.food;
 f.g.husbandry191.step(100000);assert.equal(f.read().pens[0].meat,0);assert.equal(f.read().pens[0].hides,0);assert.equal(f.g.player.carry.food,before);
});
test('191 natural behaviors are opt-in; sound obeys master mute and no hidden simulation while paused',()=>{
 const f=fixture();assert.equal(f.read().behaviors,false);assert.equal(f.g.husbandry191.naturalIntent({id:'A189_0_0_0',species:'boar',hp:1,profile:{health:10}}),null);
 f.g.settings.muted=true;for(let i=0;i<100;i++)f.g.husbandry191.step(.1);assert.equal(f.tones(),0);f.g.settings.muted=false;for(let i=0;i<60;i++)f.g.husbandry191.step(.1);assert.ok(f.tones()>0);const n=f.tones();f.g.paused=true;for(let i=0;i<100;i++)f.g.husbandry191.step(.1);assert.equal(f.tones(),n);
});
test('191 enclosure geometry blocks movement and remains transparent to shots; readers do not age stocks',()=>{
 const f=fixture();f.restore(stock());assert.equal(f.g.husbandry191.solid(12,12,.3),true);assert.equal(f.g.husbandry191.lineClear({x:8,y:12},{x:16,y:12},.3),false);assert.equal(f.g.husbandry191.solid(12,15.4,.3),false);
 const before=JSON.stringify(f.read());for(let i=0;i<100;i++)f.g.husbandry191.overview();assert.equal(JSON.stringify(f.read()),before);
});
test('191 a predator damages only visible reachable prey, respects cooldowns and never creates inventory',()=>{
 const f=fixture(),s=f.api.initial();s.behaviors=true;f.restore(s);const fox={id:'A189_0_0_2',species:'fox',x:12.5,y:15,z:0,hp:20,alarm:0,profile:{health:20}},id='A189_0_0_0';
 const bag=JSON.stringify(f.g.player.carry);assert.ok(f.g.husbandry191.naturalIntent(fox));assert.equal(f.animals.get(id).hp,6);f.g.husbandry191.naturalIntent(fox);assert.equal(f.animals.get(id).hp,6);
 f.g.elapsed=2;f.world.movementLine=()=>false;assert.equal(f.g.husbandry191.naturalIntent(fox),null);assert.equal(f.animals.get(id).hp,6);assert.equal(JSON.stringify(f.g.player.carry),bag);
});
test('191 boar defense needs injury, alarm, contact and a clear path; it uses the existing damage entry',()=>{
 const f=fixture(),s=f.api.initial();s.behaviors=true;f.restore(s);let damage=0;f.g.frontier.damage=n=>{damage+=n;};const boar={id:'A189_0_0_3',species:'boar',x:12,y:15,z:0,hp:19,alarm:0,profile:{health:20}};
 f.g.husbandry191.naturalIntent(boar);assert.equal(damage,0);boar.alarm=2;f.g.husbandry191.naturalIntent(boar);assert.equal(damage,5);f.g.husbandry191.naturalIntent(boar);assert.equal(damage,5);
 f.g.elapsed=3;f.world.movementLine=()=>false;f.g.husbandry191.naturalIntent(boar);assert.equal(damage,5);
});
test('191 actual freshwater is required and cannot be substituted with dry ground or salt water',()=>{
 const f=fixture(),s=stock();s.animals=[];s.pens[0].water=0;f.restore(s);assert.equal(f.g.husbandry191.quote('water',1).ok,false);
 f.world.hydrology.sample=()=>({water:true,salinity:'salt'});assert.equal(f.g.husbandry191.quote('water',1).ok,false);
 f.world.hydrology.sample=()=>({water:true,salinity:'fresh'});assert.equal(f.g.husbandry191.begin('water',1).ok,true);for(let i=0;i<61;i++)f.g.husbandry191.step(.1);assert.equal(f.read().pens[0].water,6);
});
test('191 newborn ancestry cannot refer to itself, to missing parents or an incompatible species',()=>{
 const f=fixture(),s=stock();s.next=5;s.animals.push({id:4,source:null,species:'rabbit',pen:1,sex:'female',age:0,health:100,status:'held',parents:[2,3]});assert.doesNotThrow(()=>f.api.validate(s));
 for(const parents of [[4,3],[2,99],[2,2]]){const q=JSON.parse(JSON.stringify(s));q.animals[2].parents=parents;assert.throws(()=>f.api.validate(q));}
});
test('191 all added public entry points appear once and after their dependencies',()=>{
 const entries=require('../scripts/public-manifest183.cjs').readPublicEntries(process.cwd()).scripts;
 const sw=fs.readFileSync('sw.js','utf8');for(const name of ['src/husbandry191.js','src/husbandry191-art.js']){assert.equal(entries.filter(n=>n===name).length,1);assert.ok(entries.indexOf(name)>entries.indexOf('src/wildlife-harvest190.js'));assert.ok(sw.includes(JSON.stringify(name)));}
});
test('191 interrupted cookery cannot turn committed fuel into food after save and restore',()=>{
 const f=fixture(),s=stock();s.animals=[];s.pens[0].meat=4;f.restore(s);const before=f.g.player.carry.food,fuel=f.g.player.carry.fuel;
 assert.ok(f.g.husbandry191.begin('cook',1).ok);f.g.husbandry191.step(.1);const saved=f.read();f.restore(saved);for(let i=0;i<100;i++)f.g.husbandry191.step(.1);
 assert.equal(f.g.husbandry191.view().task,null);assert.equal(f.g.player.carry.food,before);assert.equal(f.g.player.carry.fuel,fuel-.5);assert.equal(f.read().pens[0].meat,4);
});
