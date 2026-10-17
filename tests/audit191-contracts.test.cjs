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
  frontier:{world:()=>world,position:()=>position,contacts:()=>[],wildlifeStatus165:id=>animals.get(id),wildlife165:()=>[...animals.values()].filter(a=>a.hp>0&&!g.husbandry191?.claimed(a.id)),signalAt(){},retireWildlife191(id){if(!g.husbandry191.owns(id))return false;animals.get(id).hp=0;return true;},releaseCaptive191(id){animals.get(id).hp=Math.min(animals.get(id).hp,10*g.husbandry191.healthFraction(id));return true;},damage:()=>true,hitWildlife165(id,n){animals.get(id).hp=Math.max(0,animals.get(id).hp-n);return true;}},update(dt){g.elapsed+=dt;},damagePlayer(n){if(!g.player.invulnerable)g.player.health-=n;},returnToMenu(){},save:()=>true,notify(){}};
 const ctx=vm.createContext({DeadwallCore:C,DeadwallFrontierWorld:{RULES:{size:8192},sizeForGeneration:()=>24576,create:()=>world},DeadwallBiomePopulation165:{},DeadwallWildlife189:{species:()=>({rabbit:{name:'Lapin'}}),awake:()=>true},DeadwallFrontierGeometry:{...require('../src/frontier-geometry.js'),hash:(...a)=>a.join('').length}});
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
test('191 new and rebuilt enclosures reject the actual rotated parked vehicle footprint without payment',()=>{
 for(const kind of ['build','rebuild']){const f=fixture();if(kind==='rebuild'){const s=stock();s.animals=[];s.pens[0].health=0;f.restore(s);}
  f.position.car={x:22,y:12,a:0,driving:false};f.g.worldEvolution={vehicleProfile:()=>({w:22,h:2})};
  const bag=JSON.stringify(f.g.player.carry),q=f.g.husbandry191.begin(kind,kind==='rebuild'?1:null);assert.equal(q.ok,false);assert.match(q.reason,/véhicule/);
  assert.equal(JSON.stringify(f.g.player.carry),bag);f.position.car.a=Math.PI/2;
  assert.equal(f.g.husbandry191.quote(kind,kind==='rebuild'?1:null).ok,true,'a long vehicle outside the footprint must not be rejected by a bounding circle');
 }
});
test('191 vehicle movement uses its exact rotated rectangle and remains clear of traversable ruins',()=>{
 const f=fixture(),s=stock();s.animals=[];f.restore(s);const before=JSON.stringify(f.read());
 assert.equal(f.g.husbandry191.vehicleBlocked(22,12,0,22,2),true);
 assert.equal(f.g.husbandry191.vehicleBlocked(22,12,Math.PI/2,22,2),false);
 assert.equal(f.g.husbandry191.vehicleBlocked(12,14.6,0,22,2),false,'a long side passes outside the fence instead of using a circumscribed circle');
 assert.equal(JSON.stringify(f.read()),before);s.pens[0].health=0;f.restore(s);assert.equal(f.g.husbandry191.vehicleBlocked(12,12,0,22,2),false);
});
test('191 every regional hostile owner prevents husbandry and interrupts paid work',()=>{
 for(const owner of ['worldEvolution','succession133']){
  const f=fixture();assert.ok(f.g.husbandry191.begin('build').ok);const paid=JSON.stringify(f.g.player.carry);
  const enemy={x:f.position.x,y:f.position.y,health:45};f.g[owner]=owner==='worldEvolution'?{groupMembers:()=>[enemy]}:{contacts:()=>[enemy]};
  f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false);assert.equal(f.read().pens.length,0);assert.equal(JSON.stringify(f.g.player.carry),paid);
  assert.match(f.g.husbandry191.quote('build').reason,/infectés/);enemy.health=0;assert.ok(f.g.husbandry191.quote('build').ok);
 }
});
test('191 regional companions reserve their actual footprint during enclosure work',()=>{
 const f=fixture(),companion={health:100,x:12,y:12,z:0,riding:false};f.g.worldEvolution={overview:()=>({companions:[companion]})};
 const bag=JSON.stringify(f.g.player.carry);assert.match(f.g.husbandry191.begin('build').reason,/occupant/);assert.equal(JSON.stringify(f.g.player.carry),bag);
 companion.z=1;assert.ok(f.g.husbandry191.quote('build').ok);companion.z=0;companion.riding=true;assert.ok(f.g.husbandry191.quote('build').ok);
});
test('191 regional group and reanimated contacts exert the same finite pressure on a real enclosure',()=>{
 for(const owner of ['worldEvolution','succession133']){const f=fixture(),s=stock();s.animals=[];f.restore(s);const contact={x:13.8,y:12,z:0,hp:40};
  f.g[owner]=owner==='worldEvolution'?{groupMembers:()=>[contact]}:{contacts:()=>[contact]};f.g.husbandry191.step(.1);
  assert.equal(f.read().pens[0].health,C.Husbandry191Rules.health-C.Husbandry191Rules.penContactDamage*.1);
  const health=f.read().pens[0].health;f.world.line=()=>false;f.g.husbandry191.step(.1);assert.equal(f.read().pens[0].health,health);
 }
});
function ruins(){const s=stock();s.animals.forEach(a=>{a.status='processed';a.health=0;});s.pens=Array.from({length:8},(_,i)=>({...pen(),id:i?i+3:1,x:12+i*5,health:0}));s.next=11;Object.assign(s.pens[0],{meat:4,hides:2,leather:3,meatAge:30,hideAge:50});return s;}
test('191 paid reconstruction reuses a destroyed slot and retains terminal custody, stocks and spoilage ages',()=>{
 const f=fixture(),s=ruins();f.restore(s);const before=f.read(),bag={...f.g.player.carry};
 assert.equal(f.g.husbandry191.quote('build').ok,false);assert.ok(f.g.husbandry191.actions().some(a=>a.id==='rebuild:1:null'&&!a.disabled));
 assert.ok(f.g.husbandry191.begin('rebuild',1).ok);for(let i=0;i<81;i++)f.g.husbandry191.step(.1);
 const after=f.read();assert.equal(after.pens.length,8);assert.equal(after.next,before.next);assert.deepEqual(after.animals,before.animals);
 assert.equal(after.pens[0].health,C.Husbandry191Rules.health);for(const k of ['id','x','y','food','water','meat','hides','leather'])assert.equal(after.pens[0][k],before.pens[0][k],k);
 assert.ok(after.pens[0].meatAge>before.pens[0].meatAge);assert.ok(after.pens[0].hideAge>before.pens[0].hideAge);
 assert.equal(f.g.player.carry.wood,bag.wood-C.Husbandry191Rules.penCost.wood);assert.equal(f.g.player.carry.scrap,bag.scrap-C.Husbandry191Rules.penCost.scrap);
 assert.equal(f.g.husbandry191.quote('rebuild',1).ok,false);f.restore(after);assert.deepEqual(f.read(),after);
});
test('191 reconstruction rechecks occupation and access, and cancelled or loaded jobs cannot finish for free',()=>{
 const f=fixture();f.restore(ruins());assert.ok(f.g.husbandry191.begin('rebuild',1).ok);const paid=JSON.stringify(f.g.player.carry);
 f.animals.set('A189_0_0_7',{id:'A189_0_0_7',species:'rabbit',x:12,y:12,z:0,hp:10,profile:{health:10,name:'Lapin',mode:'land'}});
 f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false);assert.equal(f.read().pens[0].health,0);assert.equal(JSON.stringify(f.g.player.carry),paid);
 f.animals.delete('A189_0_0_7');f.world.movementLine=()=>false;assert.equal(f.g.husbandry191.quote('rebuild',1).ok,false);f.world.movementLine=()=>true;
 assert.ok(f.g.husbandry191.begin('rebuild',1).ok);const snapshot=f.read();f.restore(snapshot);for(let i=0;i<100;i++)f.g.husbandry191.step(.1);assert.equal(f.read().pens[0].health,0);
});
test('191 ruined enclosures cannot freeze perishable meat and hides',()=>{
 const f=fixture(),s=ruins();s.pens[0].meatAge=C.Husbandry191Rules.meatLife-.05;s.pens[0].hideAge=C.Husbandry191Rules.hideLife-.05;f.restore(s);
 const bag=JSON.stringify(f.g.player.carry);f.g.husbandry191.step(.1);assert.equal(f.read().pens[0].meat,0);assert.equal(f.read().pens[0].hides,0);assert.equal(f.read().pens[0].leather,3);assert.equal(JSON.stringify(f.g.player.carry),bag);
});
test('191 a knife that breaks on the completion frame cannot produce slaughter products',()=>{
 const f=fixture(),s=stock();s.animals.pop();f.restore(s);let condition=2;
 f.g.arsenal134.snapshot=()=>({equipped:1,carried:[{uid:1,id:'knife',condition}]});f.g.arsenal134.wearTool=()=>{condition=Math.max(0,condition-2/90);};
 assert.ok(f.g.husbandry191.begin('slaughter',1,2).ok);for(let i=0;i<89;i++)f.g.husbandry191.step(.1);assert.ok(f.g.husbandry191.busy());condition=.001;
 f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false);assert.equal(f.read().animals[0].status,'held');assert.equal(f.read().pens[0].meat,0);assert.equal(f.read().pens[0].hides,0);
});
test('191 full validation rejects live pens over a saved parked vehicle and permits traversable ruins',()=>{
 const f=fixture(),s=stock();s.animals=[];const full={worldSeed:17117,frontier:{...f.position,generation:8,detailVersion:1,ecologyVersion:1,car:{x:12,y:12,a:0,driving:false}}};
 assert.throws(()=>f.api.validate(s,full),/invalide/);s.pens[0].health=0;assert.doesNotThrow(()=>f.api.validate(s,full));
});
test('191 actual damage interrupts immediately even if healed before the next step; invulnerability preserves work',()=>{
 const f=fixture();assert.ok(f.g.husbandry191.begin('build').ok);f.g.player.invulnerable=1;f.g.damagePlayer(5);assert.ok(f.g.husbandry191.busy());
 f.g.player.invulnerable=0;f.g.damagePlayer(5);f.g.player.health=100;assert.equal(f.g.husbandry191.busy(),false);f.g.husbandry191.step(.1);assert.equal(f.read().pens.length,0);
});
test('191 construction presentation exposes a detached point without saving the work or creating a pen',()=>{
 for(const kind of ['build','rebuild']){const f=fixture();if(kind==='rebuild')f.restore(ruins());assert.ok(f.g.husbandry191.begin(kind,kind==='rebuild'?1:null).ok);
  const task=f.g.husbandry191.view().task;assert.equal(task.point.x,12);assert.equal(task.point.y,12);task.point.x=999;assert.equal(f.g.husbandry191.view().task.point.x,12);assert.equal(Object.hasOwn(f.read(),'task'),false);
 }
});
test('191 a blocked release after destruction keeps a finite stranded owner until the origin clears',()=>{
 const f=fixture(),s=stock();s.pens[0].health=.1;f.restore(s);let blocked=true;f.g.frontier.releaseCaptive191=()=>!blocked;
 const contact={x:13.8,y:12,z:0,hp:40};f.g.worldEvolution={groupMembers:()=>[contact]};f.g.husbandry191.step(.1);
 let state=f.read();assert.equal(state.pens[0].health,0);assert.ok(state.animals.every(a=>a.status==='stranded'));assert.ok(f.g.husbandry191.claimed(state.animals[0].source));
 assert.equal(f.g.frontier.wildlife165().length,0);f.restore(state);assert.deepEqual(f.read(),state);contact.hp=0;
 const age=state.animals[0].age,food=state.pens[0].food;f.g.husbandry191.step(.1);state=f.read();assert.ok(state.animals[0].age>age);assert.ok(state.pens[0].food<food);assert.equal(state.pens[0].breed,0);
 assert.equal(f.g.husbandry191.begin('release',1,2).ok,false);assert.equal(f.read().animals[0].status,'stranded');blocked=false;
 assert.ok(f.g.husbandry191.begin('release',1,2).ok);assert.equal(f.read().animals[0].status,'released');assert.equal(f.g.husbandry191.claimed(state.animals[0].source),false);
});
test('191 reconstruction restores stranded custody without resetting health or age; ruin deaths retire their wild source',()=>{
 const f=fixture(),s=stock();s.animals=s.animals.slice(0,1);s.animals[0].status='stranded';s.animals[0].health=70;s.pens[0].health=0;f.restore(s);
 assert.ok(f.g.husbandry191.begin('rebuild',1).ok);for(let i=0;i<81;i++)f.g.husbandry191.step(.1);
 const after=f.read();assert.equal(after.animals[0].status,'held');assert.equal(after.animals[0].health,70);assert.ok(after.animals[0].age>s.animals[0].age);assert.equal(after.animals[0].id,s.animals[0].id);
 const doomed=JSON.parse(JSON.stringify(s));doomed.animals[0].health=.001;doomed.pens[0].food=0;f.restore(doomed);f.g.husbandry191.step(.1);
 assert.equal(f.read().animals[0].status,'dead');assert.equal(f.animals.get(doomed.animals[0].source).hp,0);assert.equal(f.read().pens[0].meat,0);assert.equal(f.read().pens[0].hides,0);
});
test('191 stranded state requires a ruined enclosure and an original live source',()=>{
 const f=fixture(),s=stock();s.animals[0].status='stranded';assert.throws(()=>f.api.validate(s));s.pens[0].health=0;s.animals[1].status='stranded';assert.doesNotThrow(()=>f.api.validate(s));
 s.animals[0].status='held';assert.throws(()=>f.api.validate(s));s.animals[0].status='stranded';s.animals[0].health=0;assert.throws(()=>f.api.validate(s));
});
