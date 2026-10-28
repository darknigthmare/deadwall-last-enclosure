'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const A=require('../src/campaign-site-art205.js'),Q=require('../scripts/audit-service-art208.cjs'),Campaign=require('../src/codex-campaign205.js');

const barrel=(turn=0)=>({id:'P0001:205:static:7',kind:'rain-barrel',campaign205:true,campaign205Structural:true,x:1.25,y:1.5,w:.7,h:.7,z:0,rotationRad:turn*Math.PI/2});
// Prepared owner read models test presentation only. Native rain collection,
// finite transfers and save validation have separate controller tests.
function fixture(prop=barrel(),kind=null,water=12){
 const siteId=prop.id.split(':')[0],point={active:true,generation:11,x:10,y:20,z:0,inside:null,a:.4,car:{driving:false}};
 let status=kind==='prepare'?null:{siteId,supportId:prop.id,prepared:true,water,capacity:24},view=kind?{siteId,supportId:prop.id,supportKind:'rain-barrel',kind,amount:kind==='prepare'?0:2,elapsed:.24,duration:4,progress:.06,start:10,anchor:{x:10,y:20,z:0},workTarget:{x:10.5,y:20,z:0}}:null;
 const forbidden=()=>assert.fail('Presentation called a simulation/save reader');
 const g={state:'playing',gameOver:false,paused:false,activeOverlay:null,elapsed:99,settings:{reducedMotion:false},world:{seed:17117},
  player:{health:75,dead:false,carry:{wood:4,scrap:4}},frontier:{position:()=>({...point}),world:forbidden,snapshot:forbidden},
  worldEvolution:{structureDestroyed:()=>false},campaignWater214:{status:id=>id===prop.id?status:null,presentation:id=>id===prop.id?view:null,busy:()=>!!view,activity:()=>view,snapshot:forbidden,preview:forbidden}};
 return{g,point,view:()=>view,status:()=>status,set:view214=>{view=view214;},setStatus:s=>{status=s;},advance:elapsed=>{view={...view,elapsed,progress:elapsed/view.duration};}};
}

test('214 water art: twelve unprepared barrel frames preserve exact1.73 pixels',()=>{
 const f=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/campaign-water214-idle-art.json'),'utf8'));
 assert.equal(f.baseline.commit,'70c790cdfab3c2c8b286c70269786872d8be5217');assert.equal(f.baseline.sourceSha256,'7b3aa2c2359f92cb3351dd9c946e5eba5797bcb78b4d17ed1b242f0a203d7cd7');assert.equal(f.rows.length,12);
 for(const row of f.rows){const prop=barrel(row.turn),g={campaignWater214:{status:()=>null,presentation:()=>null}};assert.equal(Q.render(prop,{variant:row.variant}).hash,row.hash);assert.equal(Q.render(prop,{game:g,variant:row.variant}).hash,row.hash);}
});

test('214 water art: prepared fittings reflect actual empty, partial and full reservoir levels without an active job',()=>{
 for(const turn of[0,1,2,3])for(const variant of[0,1,2]){
  const prop=barrel(turn),hashes=[];for(const water of[0,12,24]){const f=fixture(prop,null,water),state=JSON.stringify(f.status()),picture=Q.render(prop,{game:f.g,variant,record:true});Q.clipped(picture);hashes.push(picture.hash);assert.equal(JSON.stringify(f.status()),state);assert.notEqual(picture.hash,Q.render(prop,{variant}).hash);}
  assert.equal(new Set(hashes).size,3,'Gauge must distinguish the owner levels');
 }
});

test('214 water art: lid, screen, tool, tap and stream follow three actual work kinds within all physical quarter-turns',()=>{
 for(const kind of['prepare','draw','pour'])for(const turn of[0,1,2,3])for(const variant of[0,1,2]){
  const prop=barrel(turn),f=fixture(prop,kind),first=Q.render(prop,{game:f.g,variant,record:true});Q.clipped(first);f.advance(.61);const second=Q.render(prop,{game:f.g,variant,record:true});Q.clipped(second);assert.notEqual(first.hash,second.hash,kind+' native phase');assert.notDeepEqual(first.calls,second.calls,kind+' has separate moving pieces');
 }
});

test('214 water art: pause and reduced-motion freeze the native work phase while genuine gauge changes remain visible',()=>{
 for(const kind of['prepare','draw','pour']){
  const prop=barrel(),f=fixture(prop,kind),first=Q.render(prop,{game:f.g,record:true});f.g.paused=true;f.g.elapsed+=200;assert.equal(Q.render(prop,{game:f.g}).hash,first.hash);f.g.paused=false;f.g.activeOverlay={};assert.equal(Q.render(prop,{game:f.g}).hash,first.hash);f.g.activeOverlay=null;
  f.g.settings.reducedMotion=true;const reduced=Q.render(prop,{game:f.g,record:true});for(const elapsed of[.61,1.9,3.4]){f.advance(elapsed);const later=Q.render(prop,{game:f.g,record:true});assert.equal(later.hash,reduced.hash);assert.deepEqual(later.calls,reduced.calls);}
  if(kind!=='prepare'){f.setStatus({...f.status(),water:16});assert.notEqual(Q.render(prop,{game:f.g}).hash,reduced.hash,'Reduced motion must not freeze stored water');}
 }
});

test('214 water art: cancellation and interruption remove activity but retain prepared physical fittings and actual water',()=>{
 for(const kind of['prepare','draw','pour']){
  const prop=barrel(),f=fixture(prop,kind),before=JSON.stringify(f.status()),active=Q.render(prop,{game:f.g}).hash;
  f.set(null);const stopped=Q.render(prop,{game:f.g}).hash;assert.notEqual(stopped,active);assert.equal(JSON.stringify(f.status()),before);
  if(kind==='prepare')assert.equal(stopped,Q.render(prop).hash);else assert.notEqual(stopped,Q.render(prop).hash);
  for(const stop of['death','menu','gameOver','drive','floor']){const n=fixture(prop,kind);n.g.paused=true;if(stop==='death')n.g.player.dead=true;if(stop==='menu')n.g.state='menu';if(stop==='gameOver')n.g.gameOver=true;if(stop==='drive')n.point.car.driving=true;if(stop==='floor')n.point.z=1;assert.equal(Q.render(prop,{game:n.g}).hash,stopped,kind+'/'+stop);}
  const destroyed=fixture(prop,kind);destroyed.g.worldEvolution.structureDestroyed=()=>true;assert.equal(Q.render(prop,{game:destroyed.g}).hash,Q.render(prop).hash);
 }
});

test('214 water art: empty source, full destination and malformed work never draw a fictitious stream',()=>{
 const prop=barrel(),f=fixture(prop,'draw'),prepared=fixture(prop),base=Q.render(prop,{game:prepared.g}).hash;
 for(const change of[{siteId:'P0002'},{supportId:'P0001:205:static:07'},{supportKind:'oven'},{kind:'meal'},{elapsed:0,progress:0},{elapsed:Infinity},{duration:0},{progress:.9},{start:NaN},{amount:0},{amount:-1},{amount:NaN},{amount:13},{anchor:{x:0,y:0,z:1}},{workTarget:{x:NaN,y:0,z:0}}]){
  f.set({...fixture(prop,'draw').view(),...change});assert.equal(Q.render(prop,{game:f.g}).hash,base,JSON.stringify(change));
 }
 const empty=fixture(prop,'draw',0),emptyIdle=fixture(prop,null,0);assert.equal(Q.render(prop,{game:empty.g}).hash,Q.render(prop,{game:emptyIdle.g}).hash);
 const full=fixture(prop,'pour',24),fullIdle=fixture(prop,null,24);assert.equal(Q.render(prop,{game:full.g}).hash,Q.render(prop,{game:fullIdle.g}).hash);
 const noWork=fixture(prop,'draw');noWork.g.campaignWater214.busy=()=>false;assert.equal(Q.render(prop,{game:noWork.g}).hash,base,'An idle owner cannot leave a stale stream');
 for(const change of[{prepared:false},{siteId:'P0002'},{supportId:'P0001:205:static:8'},{capacity:0},{water:-1},{water:25},{water:NaN},{capacity:Infinity}]){const n=fixture(prop,'draw');n.setStatus({...n.status(),...change});assert.equal(Q.render(prop,{game:n.g}).hash,Q.render(prop).hash);}
 for(const candidate of[{...prop,campaign205:false},{...prop,campaign205Structural:false},{...prop,id:'P0001:205:static:07'},{...prop,kind:'garden-shed'}])assert.equal(A.waterPresentation214(f.g,candidate),null);
});

test('214 water art: pure explicit game reads never generate a region, serialize, consume RNG or consult a singleton',()=>{
 const prop=barrel(),f=fixture(prop,'draw'),before=JSON.stringify({status:f.status(),view:f.view(),player:f.g.player,world:f.g.world}),random=Math.random,now=Date.now,globalDescriptor=Object.getOwnPropertyDescriptor(globalThis,'DEADWALL');
 Math.random=()=>assert.fail('RNG read');Date.now=()=>assert.fail('Wall clock read');Object.defineProperty(globalThis,'DEADWALL',{configurable:true,get(){assert.fail('Foreign game singleton read');}});
 try{const first=Q.render(prop,{game:f.g});assert.equal(Q.render(prop,{game:f.g}).hash,first.hash);assert.equal(JSON.stringify({status:f.status(),view:f.view(),player:f.g.player,world:f.g.world}),before);assert.notEqual(first.hash,Q.render(prop).hash);}finally{Math.random=random;Date.now=now;if(globalDescriptor)Object.defineProperty(globalThis,'DEADWALL',globalDescriptor);else delete globalThis.DEADWALL;}
});

test('214 water art: tiny supports and unrelated furniture avoid reservoir reads',()=>{
 const canvas=createCanvas(80,80),c=canvas.getContext('2d'),g={campaignWater214:{status:()=>assert.fail('Hidden level-of-detail read'),presentation:()=>assert.fail('Hidden activity read')}};
 assert.equal(A.drawProp(c,{images:{}},barrel(),{game:g,scale:2}),true);
 assert.equal(A.drawProp(c,{images:{}},{...barrel(),kind:'garden-shed'},{game:g,scale:40}),true);
});

test('214 water art: real outdoor barrels from all four G11 families retain their physical dimensions and canvas state',()=>{
 for(let n=45;n<=48;n++){
  const type=Campaign.typeFor('EXT-MONDE-T'+String(n).padStart(3,'0'),1),preset=Campaign.preset(type),site={...preset,type,id:'P'+String(3000+n),generation:11,x:1000,y:1000,a:0},prop=Campaign.details(site).outdoor.find(o=>o.kind==='rain-barrel');assert.ok(prop);
  assert.equal(prop.w,.7);assert.equal(prop.h,.7);const f=fixture(prop,'draw');Q.clipped(Q.render(prop,{game:f.g}));
 }
 const prop=barrel(),f=fixture(prop,'draw'),canvas=createCanvas(120,120),c=canvas.getContext('2d');c.translate(2,3);c.scale(32,32);c.lineCap='round';c.lineJoin='bevel';c.globalAlpha=.57;c.setLineDash([.12,.06]);c.shadowColor='#ccba87';c.shadowBlur=2;c.shadowOffsetX=3;c.shadowOffsetY=4;
 const state=()=>({transform:c.getTransform().toJSON(),alpha:c.globalAlpha,lineCap:c.lineCap,lineJoin:c.lineJoin,dash:c.getLineDash(),shadow:c.shadowColor,blur:c.shadowBlur,dx:c.shadowOffsetX,dy:c.shadowOffsetY,fill:c.fillStyle,stroke:c.strokeStyle});const before=state();assert.equal(A.drawProp(c,{images:{}},prop,{game:f.g,scale:32}),true);assert.deepEqual(state(),before);c.resetTransform();c.fillStyle='#ff0000';c.fillRect(0,0,1,1);assert.ok(c.getImageData(0,0,1,1).data[3]>0,'Support clipping is restored for the next object');
});
