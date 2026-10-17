'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createRequire}=require('node:module');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),Player=require('../src/player-pack131.js');
const copy=value=>JSON.parse(JSON.stringify(value));
const bag=()=>Object.fromEntries(C.RESOURCE_KEYS.map(key=>[key,0]));

// Deliberately distinct reference identities make reuse of a world from another
// revision fail the existing semantic checks. No validator is stubbed out.
function reference(ecologyVersion,detailVersion,landscape189){
 const serial=({'balanced':3,'large':4,'patchwork':5}[landscape189]||0)*10+ecologyVersion*2+(detailVersion?1:0),id='P'+String(serial).padStart(4,'0');
 const poi={id,name:'Atelier témoin',type:'garage',generation:10,x:100+serial*100,y:100,w:20,h:20,a:0,levels:[0,1],outdoor:[],
  occupation:'allied',parking:[{id:id+':car:0',kind:'car',type:'compact',amount:5,x:100+serial*100,y:95,a:0}],
  context160:{operations:[{key:'pump',kind:'pumpBasin'}]}};
 const plan=(p,z)=>({walls:[{x:0,y:0,w:8,h:.3},{x:10,y:0,w:10,h:.3}],stairs:[{x:4,y:4,w:2,h:2}],
  objects:[{id:id+':'+z+':0',kind:'crate',x:12,y:12,w:1,h:1,amount:5},
   {id:id+':'+z+':1',kind:'generator',x:14,y:12,w:1,h:1,amount:5},
   {id:id+':'+z+':2',kind:'shelf',x:12,y:14,w:1,h:1,amount:5}]});
 return{seed:17117,generation:10,ecologyVersion,home:{x:100,y:100},pois:[poi],towns:[{id:'witness',x:100,y:100}],plan};
}
function isolated(file){
 const calls=[],World={TOWNS:[{id:'witness',x:100,y:100}],sizeForGeneration:()=>24576,
  create(seed,generation,effects){calls.push({seed,generation,...effects});return reference(effects.ecologyVersion,effects.detailVersion,effects.landscape189);}};
 const filename=path.join(__dirname,'../src/',file),sandbox={module:{exports:{}},require:createRequire(filename),
  DeadwallCore:C,DeadwallFrontierWorld:World,DeadwallFrontierGeometry:G,DeadwallPlayerPack131:Player};
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),sandbox,{filename});
 const api=sandbox.module.exports;
 if(file==='field-atlas-state.js')api.configure(C.FieldAtlas.RULES);
 if(file==='essential-state.js')api.configure(C.Essentials.RULES);
 if(file==='world-evolution-state.js')api.configure(C.WorldEvolution.RULES);
 if(file==='frontier-logistics.js')api.configure(C.FieldSupplies.RULES);
 return{api,calls};
}
function context(world,effects){const p=world.pois[0];return{worldSeed:17117,wave:1,stats:{wavesSurvived:0},
 frontier:{generation:10,...effects,seen:[p.id],taken:{[p.id+':0:0']:5,[p.id+':car:0']:5}},
 player:{dead:false,health:100,carry:bag(),magazine:Object.fromEntries(Object.keys(C.WEAPONS).map(key=>[key,0]))}};}
const scenarios=[
 ['context-operations160.js','normalize',(api,w)=>({version:1,completed:[w.pois[0].id+':160:pump']})],
 ['companions-pack.js','validate',(api,w)=>({...api.initial(),positions:{samir:{...G.global(w.pois[0],5,5),z:1,inside:w.pois[0].id,a:0}}})],
 ['campaign-pack.js','normalize',(api,w)=>{const s=api.initial();s.usedSites.patrol=[w.pois[0].id];return s;}],
 ['barricades134.js','normalize',(api,w)=>({version:1,records:[{target:api.regionTargets(w,w.pois[0],1)[0].id,type:'planks',hp:120}]})],
 ['field-atlas-state.js','validate',(api,w)=>({...api.initial(),reports:[{id:w.pois[0].id,town:'witness',at:0}]})],
 ['exploration-pack131.js','normalize',(api,w)=>({...api.initial(),wrecks:[{id:w.pois[0].id+':car:0',recovered:1}]})],
 ['world-evolution-state.js','validate',(api,w)=>({...api.initial(),structures:{[w.pois[0].id]:.5}})],
 ['essential-state.js','validate',api=>({...api.initial(),jobs:{'light-grid':{stage:'surveyed'}}})],
 ['night-gear.js','normalize',(api,w)=>({version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:360,on:false,used:false,
  domain:'region',...G.global(w.pois[0],5,5),z:1,inside:w.pois[0].id,angle:0}]})],
 ['succession133.js','validate',(api,w)=>{const p=w.pois[0],point={domain:'region',...G.global(p,5,5),z:1,inside:p.id,angle:0};
  return{...api.initial(),serial:2,current:{number:2,profile:'commander',weapons:Object.keys(C.WEAPONS)},remains:[{id:1,profile:'commander',point,
   bag:bag(),magazine:Object.fromEntries(Object.keys(C.WEAPONS).map(key=>[key,0])),weapons:Object.keys(C.WEAPONS),gear:Player.initial(),
   kits:{light:0,aid:0,brace:0,decoy:0},body:{phase:'rest',left:0,roll:0xffffffff,x:point.x,y:point.y,health:65,zombieId:null},time:0}]};}],
 ['world-pack131.js','normalize',(api,w)=>({...api.initial(),relays:{[w.pois[0].id]:bag()}})],
 ['interventions134.js','validate',(api,w)=>({...api.initial(),unlocked:[w.pois[0].id+':0:0']})],
 ['frontier-logistics.js','validate',(api,w)=>({...api.initial(),caches:[{id:w.pois[0].id+':0:0',stock:bag()}]})]
];
for(const[file,method,fixture]of scenarios)test('189 '+file+' isolates each landscape with the same seed and generation',()=>{
 const{api,calls}=isolated(file),revisions=['balanced','large','patchwork'].map(landscape189=>({ecologyVersion:1,detailVersion:13,landscape189,hydrologyVersion:1}));
 for(const effects of revisions){const w=reference(effects.ecologyVersion,effects.detailVersion,effects.landscape189),data=context(w,effects),raw=fixture(api,w);
  assert.doesNotThrow(()=>api[method](copy(raw),copy(data)));
  assert.doesNotThrow(()=>api[method](copy(raw),copy(data)),'A repeat must use the matching bounded cache');
  if(effects.ecologyVersion===0){const historical=copy(data);delete historical.frontier.ecologyVersion;delete historical.frontier.hydrologyVersion;delete historical.frontier.detailVersion;
   assert.doesNotThrow(()=>api[method](copy(raw),historical),'An absent revision means the exact historical world');}
 }
 assert.deepEqual(calls,revisions.map(effects=>({seed:17117,generation:10,...effects})));
});
