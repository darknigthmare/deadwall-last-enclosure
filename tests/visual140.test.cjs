'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Assets=require('../src/assets136.js'),Art=require('../src/art.js'),C=require('../src/core.js');
globalThis.DeadwallFrontierGeometry=require('../src/frontier-geometry.js');require('../src/frontier-art.js');require('../src/expedition-art.js');const Frontier=globalThis.DeadwallFrontierArt,Expedition=globalThis.DeadwallExpeditionArt;
let native;try{native=require('@napi-rs/canvas');}catch{}
async function sprite(type){
 const key=Assets.VEHICLE_SPRITES140[type],spec=Assets.ASSETS140[key],image=await native.loadImage(spec.url),c=native.createCanvas(image.width,image.height).getContext('2d');c.drawImage(image,0,0);const pixels=c.getImageData(0,0,image.width,image.height).data,rect=Art.tightRect(pixels,image.width,[0,0,image.width,image.height]);
 const art={images:{[key]:image},rects:{[key+':sprite']:rect},diagnostics:{draws:{}},blit(c,k,r,x,y,w,h){c.drawImage(this.images[k],...r,x,y,w,h);this.diagnostics.draws[k]=(this.diagnostics.draws[k]||0)+1;return true;}};
 return{key,spec,image,pixels,rect,art};
}
test('140 silhouettes : fourgon et buggy individuels transparents, anciens registres conservés',{skip:!native},async()=>{
 assert.equal(Object.keys(Assets.ASSETS).length,27);assert.equal(Object.keys(Assets.ASSETS138).length,2);assert.equal(Object.keys(Assets.ASSETS139).length,2);assert.equal(Object.keys(Assets.ASSETS140).length,2);assert.equal(Object.keys(Assets.ASSETS141).length,2);assert.equal(Object.keys(Art.ASSETS).length,63);
 for(const type of ['van','buggy']){
  const s=await sprite(type),p=C.WorldEvolution.RULES.vehicles[type];assert.equal(Art.ASSETS[s.key],s.spec);assert.equal(s.spec.matte,'none');assert.equal(s.image.width,s.spec.width);assert.equal(s.image.height,s.spec.height);
  assert.ok(s.pixels.some((_,i)=>i%4===3&&s.pixels[i]===0),'transparent background');assert.ok(s.pixels.some((_,i)=>i%4===3&&s.pixels[i]===255),'opaque vehicle body');assert.ok(Math.abs(s.rect[2]/s.rect[3]-p.w/p.h)<.5,'silhouette fits the intended profile');
 }
});
test('140 peintres : PNG spécifique local et régional, profil actif et possessions inchangés',{skip:!native},async()=>{
 const before=globalThis.DEADWALL;
 try{for(const type of ['van','buggy']){
  const s=await sprite(type),p=C.WorldEvolution.RULES.vehicles[type],v={x:100,y:80,angle:.42,health:p.health,fuel:7.25,cargo:{food:3.125},driving:false},state=JSON.stringify(v),g={art:s.art,worldEvolution:{vehicleProfile:()=>p}};globalThis.DEADWALL=g;
  const canvas=native.createCanvas(640,320),c=canvas.getContext('2d');Expedition.car(c,v);assert.equal(s.art.diagnostics.draws[s.key],1,'local uses its own PNG');c.save();c.translate(320,160);c.scale(40,40);Frontier.car(c,{...v,x:0,y:0,type,a:v.angle,w:p.w,h:p.h},true,v.health);c.restore();assert.equal(s.art.diagnostics.draws[s.key],2,'region uses the same dedicated silhouette');assert.equal(JSON.stringify(v),state);
 }}finally{globalThis.DEADWALL=before;}
});
test('140 états : rotation, coffre ouvert, épave et démontage gardent le PNG et le gabarit',{skip:!native},async()=>{
 for(const type of ['van','buggy']){
  const s=await sprite(type),p=C.WorldEvolution.RULES.vehicles[type],renders=[];
  s.art.blit=function(c,key,r,x,y,w,h){assert.ok(w<=p.w+1e-8&&h<=p.h+1e-8,'asset stays within the unchanged body');c.drawImage(this.images[key],...r,x,y,w,h);this.diagnostics.draws[key]=(this.diagnostics.draws[key]||0)+1;return true;};
  for(const state of [{hp:p.health},{hp:p.health,opened:true},{hp:0},{hp:0,dismantled:true,exhausted:true}]){
   const canvas=native.createCanvas(640,320),c=canvas.getContext('2d');c.translate(320,160);c.scale(50,50);c.rotate(.42);assert.equal(Assets.drawVehicle139(c,s.art,type,p.w,p.h,state),true);renders.push(canvas.toBuffer('image/png'));
  }
  assert.notDeepEqual(renders[1],renders[0]);assert.notDeepEqual(renders[2],renders[0]);assert.notDeepEqual(renders[3],renders[2]);assert.equal(s.art.diagnostics.draws[s.key],4,'the body survives every state');
 }
});
test('140 repli : image absente conserve un fourgon fermé et un buggy ouvert distincts',{skip:!native},()=>{
 const render=type=>{const canvas=native.createCanvas(400,220),c=canvas.getContext('2d');c.translate(200,110);c.scale(60,60);assert.equal(Assets.drawVehicle139(c,{images:{}},type,4,2,{hp:100}),true);return canvas.toBuffer('image/png');};
 assert.notDeepEqual(render('van'),render('buggy'),'body shape differs even at equal normalized dimensions');
});
test('140 ouvrants : moteur arrière du buggy et capot avant du fourgon restent sur le bon côté',{skip:!native},async()=>{
 for(const type of ['van','buggy']){
  const s=await sprite(type),p=C.WorldEvolution.RULES.vehicles[type],canvas=native.createCanvas(640,320),c=canvas.getContext('2d');c.translate(320,160);c.scale(50,50);
  Assets.drawVehicle139(c,s.art,type,p.w,p.h,{hp:p.health,dismantled:true,opened:true});
  const engineX=320+(type==='buggy'?-1:1)*p.w*.345*50,pixel=c.getImageData(Math.round(engineX),160,1,1).data;
  assert.deepEqual(Array.from(pixel),[34,42,38,255],'the dark open engine bay follows the actual engine end');
  const oppositeX=320+(type==='buggy'?1:-1)*p.w*.345*50,opposite=c.getImageData(Math.round(oppositeX),160,1,1).data;
  assert.notDeepEqual(Array.from(opposite),[34,42,38,255],'opening the cargo does not move the engine bay to the opposite end');
 }
});
