'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../../src/core.js');
function fixture(){
 let raw,clock=0,tones=0;const rules=C.Husbandry191Rules,position={active:true,x:12,y:15.4,z:0,a:-Math.PI/2,landscape189:'balanced',hydrologyVersion:1};
 const animals=new Map([['A189_0_0_0',{id:'A189_0_0_0',species:'rabbit',x:12,y:15,z:0,hp:10,profile:{health:10,name:'Lapin',mode:'land'}}]]);
 const world={size:24576,home:{x:600,y:600},blocked:()=>false,nearestRoad:()=>null,nearPOI:()=>[],movementLine:()=>true,line:()=>true,wildlifeWaterLine:()=>true,hydrology:{sample:()=>({water:false,salinity:'fresh'})}};
 const g={wildHarvest190:{},world:{seed:17117},state:'playing',gameOver:false,paused:false,activeOverlay:null,elapsed:0,dayClock:.4,settings:{volume:1,muted:false},
  player:{health:100,dead:false,reload:0,carry:{...Object.fromEntries(Object.keys(C.RESOURCE_META).map(k=>[k,0])),wood:30,scrap:20,food:30,fuel:20},carryCapacity:120},input:{keys:new Set(),pressed:new Set(),mouseDown:false,touchFire:false},stats:{},
  audio:{tone(){tones++;}},expansions:{canAct:()=>true,busy:()=>false,register:d=>raw=d},arsenal134:{snapshot:()=>({equipped:1,carried:[{uid:1,id:'knife',condition:100}]}),wearTool(){}},
  frontier:{world:()=>world,position:()=>position,contacts:()=>[],wildlifeStatus165:id=>animals.get(id),wildlife165:()=>[...animals.values()].filter(a=>a.hp>0&&!g.husbandry191?.claimed(a.id)),signalAt(){},retireWildlife191(id){if(!g.husbandry191.owns(id))return false;animals.get(id).hp=0;return true;},releaseCaptive191(id){animals.get(id).hp=Math.min(animals.get(id).hp,10*g.husbandry191.healthFraction(id));return true;},damage:()=>true,hitWildlife165(id,n){animals.get(id).hp=Math.max(0,animals.get(id).hp-n);return true;}},update(dt){g.elapsed+=dt;},damagePlayer(n){if(!g.player.invulnerable)g.player.health-=n;},returnToMenu(){},save:()=>true,notify(){}};
 const ctx=vm.createContext({DeadwallCore:C,DeadwallFrontierWorld:{RULES:{size:8192},sizeForGeneration:()=>24576,create:()=>world},DeadwallBiomePopulation165:{},DeadwallWildlife189:{species:()=>({rabbit:{name:'Lapin'}}),awake:()=>true},DeadwallFrontierGeometry:{...require('../../src/frontier-geometry.js'),hash:(...a)=>a.join('').length}});
 vm.runInContext(fs.readFileSync('src/husbandry191.js','utf8'),ctx);ctx.DeadwallHusbandry191.install(g);
 return{g,world,position,animals,api:ctx.DeadwallHusbandry191,restore:s=>raw.restore(s),read:()=>raw.snapshot(),tones:()=>tones};
}
const pen=()=>({id:1,x:12,y:12,health:100,food:30,water:30,meat:0,hides:0,leather:0,breed:0,meatAge:0,hideAge:0});
const stock=()=>({version:1,next:4,behaviors:false,pens:[pen()],animals:[{id:2,source:'A189_0_0_0',species:'rabbit',pen:1,sex:'female',age:900,health:100,status:'held',parents:[]},{id:3,source:'A189_0_0_1',species:'rabbit',pen:1,sex:'male',age:900,health:100,status:'held',parents:[]}]});

module.exports={fixture,pen,stock};
