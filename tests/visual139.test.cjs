'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Assets=require('../src/assets136.js'),Art=require('../src/art.js'),C=require('../src/core.js');
globalThis.DeadwallFrontierGeometry=require('../src/frontier-geometry.js');require('../src/frontier-art.js');const Frontier=globalThis.DeadwallFrontierArt;
let native;try{native=require('@napi-rs/canvas');}catch{}
require('../src/expedition-art.js');const Expedition=globalThis.DeadwallExpeditionArt;

test('139 gros véhicules : PNG individuels conservant alpha et proportions sans remplacement des matières',async()=>{
 assert.equal(Object.keys(Assets.ASSETS).length,27);assert.equal(Object.keys(Assets.ASSETS138).length,2);assert.equal(Object.keys(Assets.ASSETS139).length,2);
 for(const[type,key]of Object.entries(Assets.VEHICLE_SPRITES139)){
  assert.equal(Art.ASSETS[key],Assets.ASSETS139[key]);assert.equal(Assets.ASSETS139[key].matte,'none');
  if(!native)continue;
  const im=await native.loadImage(Assets.ASSETS139[key].url),c=native.createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);assert.equal(im.width,Assets.ASSETS139[key].width);assert.equal(im.height,Assets.ASSETS139[key].height);
  const d=c.getImageData(0,0,im.width,im.height).data,r=Art.tightRect(d,im.width,[0,0,im.width,im.height]),ratio=r[2]/r[3],p=C.WorldEvolution.RULES.vehicles[type];
  assert.ok(d.some((_,i)=>i%4===3&&d[i]===0),'true transparency');assert.ok(d.some((_,i)=>i%4===3&&d[i]===255),'opaque vehicle body');assert.ok(Math.abs(ratio-p.w/p.h)<.65,'long body keeps its intended profile');
 }
});

test('139 profondeur locale : acteur derrière le bus vertical, gros véhicule encore visible au bord, sans mutation',()=>{
 const p=C.WorldEvolution.RULES.vehicles.bus,v={id:30,x:100,y:100,angle:Math.PI/2,health:p.health,cargo:{food:3.125},fuel:9,regionAway:false},actor={id:20,x:100,y:140},source=JSON.stringify(v);
 const g={art:{drawBuilding(){return false;}},drawGround(){},world:{at(){return false;}},visible(x,y,r,view){return x+r>=view.left&&x-r<=view.right&&y+r>=view.top&&y-r<=view.bottom;},worldEvolution:{vehicleProfile:()=>p,overview:()=>({fleet:{active:'bus'}})},expeditions:{car:()=>v,overview:()=>({sites:[]})},depthEntries(view){return[{kind:4,entity:actor,id:actor.id,depth:actor.y,order:0},...(this.visible(v.x,v.y,40,view)?[{kind:6,entity:v,id:v.id,depth:v.y,order:1}]:[])].sort((a,b)=>a.depth-b.depth);}};
 Expedition.install(g);
 const full=g.depthEntries({left:0,right:200,top:0,bottom:200});assert.equal(full.filter(e=>e.kind===6).length,1);assert.equal(full.at(-1).kind,6,'body covering an actor behind is painted last');
 const edge=g.depthEntries({left:0,right:200,top:145,bottom:200});assert.equal(edge.filter(e=>e.kind===6).length,1,'visible bus end survives the former fixed40cull');
 assert.equal(g.depthEntries({left:0,right:200,top:180,bottom:200}).some(e=>e.kind===6),false);assert.equal(JSON.stringify(v),source,'presentation changes no health,cargo,fuel,pose');
});

test('139 stationnement : le camion et le bus tiennent dans leur marquage à l’angle réel, sans déplacer la place',()=>{
 for(const type of ['break','truck','bus']){
  const p=C.WorldEvolution.RULES.vehicles[type],vehicle={id:'parked',x:30,y:40,a:.83,w:p.w,h:p.h},lot={x:30,y:60,w:20,h:20,a:.17,parking:[vehicle]},before=JSON.stringify(lot),marks=[],rotations=[];
  const c=new Proxy({strokeRect(...r){marks.push(r);},rotate(a){rotations.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,x)=>(o[k]=x,true)});
  Frontier.lotGround(c,lot,{z:0});assert.equal(marks.length,1);assert.ok(marks[0][2]>vehicle.w&&marks[0][3]>vehicle.h,'both long and transverse ends have clearance');assert.equal(rotations.at(-1),vehicle.a-lot.a,'marking follows the parked body');assert.equal(JSON.stringify(lot),before);
 }
});

test('139 local : profil actif et santé maximale du véhicule passent au peintre commun',()=>{
 const before={game:globalThis.DEADWALL,frontier:globalThis.DeadwallFrontierArt,assets:globalThis.DeadwallAssets136},calls=[],bars=[];
 globalThis.DeadwallAssets136=Assets;globalThis.DeadwallFrontierArt={car(...args){calls.push(args);}};
 try{for(const type of ['bus','truck']){
  const p=C.WorldEvolution.RULES.vehicles[type],v={x:40,y:50,angle:.4,health:p.health,cargo:{food:3.125},fuel:9,driving:false},state=JSON.stringify(v),g={worldEvolution:{vehicleProfile:()=>p,overview:()=>({fleet:{active:type}})}};globalThis.DEADWALL=g;
  const c=new Proxy({fillRect(...r){if(['#111e17','#b79562'].includes(this.fillStyle))bars.push(r);},globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,x)=>(o[k]=x,true)});
  bars.length=0;Expedition.car(c,v);assert.equal(bars.length,0,'fully healthy650/760vehicle has no damaged bar');
  v.health=p.health/2;bars.length=0;Expedition.car(c,v);assert.equal(bars.length,2,'injured650/760vehicle has a damage bar');assert.equal(bars[1][2],bars[0][2]/2,'half health uses its own actual maximum');
  assert.equal(calls.at(-1)[1].type,type);assert.equal(calls.at(-1)[1].w,p.w);assert.equal(calls.at(-1)[1].h,p.h);assert.equal(calls.at(-1)[1].a,v.angle);v.health=p.health;assert.equal(JSON.stringify(v),state);
 }}finally{globalThis.DEADWALL=before.game;globalThis.DeadwallFrontierArt=before.frontier;globalThis.DeadwallAssets136=before.assets;}
});

test('139 états natifs : coque distincte après coffre ouvert, destruction et démontage, PNG encore dessiné',{skip:!native},async()=>{
 for(const[type,key]of Object.entries(Assets.VEHICLE_SPRITES139)){
  const image=await native.loadImage(Assets.ASSETS139[key].url),source=native.createCanvas(image.width,image.height).getContext('2d');source.drawImage(image,0,0);const rect=Art.tightRect(source.getImageData(0,0,image.width,image.height).data,image.width,[0,0,image.width,image.height]);
  const art={images:{[key]:image},rects:{[key+':sprite']:rect},diagnostics:{draws:{}},blit(c,k,r,x,y,w,h){assert.ok(w<=C.WorldEvolution.RULES.vehicles[type].w+1e-8&&h<=C.WorldEvolution.RULES.vehicles[type].h+1e-8);c.drawImage(image,...r,x,y,w,h);this.diagnostics.draws[k]=(this.diagnostics.draws[k]||0)+1;}},p=C.WorldEvolution.RULES.vehicles[type];
  const render=state=>{const canvas=native.createCanvas(640,240),c=canvas.getContext('2d');c.translate(320,120);c.scale(40,40);assert.equal(Assets.drawVehicle139(c,art,type,p.w,p.h,state),true);return canvas.toBuffer('image/png');};
  const intact=render({hp:p.health}),opened=render({hp:p.health,opened:true}),wreck=render({hp:0}),stripped=render({hp:0,dismantled:true,exhausted:true});assert.notDeepEqual(opened,intact);assert.notDeepEqual(wreck,intact);assert.notDeepEqual(stripped,wreck);assert.equal(art.diagnostics.draws[key],4,'states preserve the main silhouette');
 }
 const c={fillRect(){assert.fail('unrelated vehicle');}};assert.equal(Assets.drawVehicle139(c,{},'break',4.6,1.85),false);
});
