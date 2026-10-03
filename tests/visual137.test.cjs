'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Art=require('../src/art.js');
const C=require('../src/core.js');
function context(){return new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});}
async function emptyArt(){const old=globalThis.Image;globalThis.Image=class{set src(v){this.onerror();}};try{const art=Art.create();await art.ready;return art;}finally{globalThis.Image=old;}}
test('137 rendu : le recul du fusil à verrou finit avant son délai de prochain tir, y compris sans rig disponible',()=>{
 const aim={weapon:'rifle',shootCooldown:.8,visualRecoil:false,visualMoving:false};
 assert.equal(Art.heroPose(aim,.3,false).state,'idle');
 assert.equal(Art.heroPose({...aim,visualMoving:true},.3,false).state,'walk');
 assert.equal(Art.heroPose({...aim,visualRecoil:true},.3,false).state,'shoot');
 assert.equal(Art.heroPose({...aim,reload:.6,reloadTotal:2,visualRecoil:true},.3,false).state,'reload');
 assert.equal(Art.heroPose({shootCooldown:.2},.3,false).state,'shoot','les compositions historiques sans service de présentation conservent leur repli');
});
test('137 rendu : toutes les armes de contact utilisent les nouvelles postures basses sans arme à feu incrustée',async()=>{
 const art=await emptyArt();art.images.heroCrouch137={};art.images.heroProne137={};art.images.commanderRig={};const used=[];art.blit=(_c,key,r)=>{used.push([key,r]);return true;};
 for(const d of Object.values(C.Arsenal134Rules.catalog).filter(d=>['melee','tool','improvised'].includes(d.category)))for(const posture of ['crouch','prone']){
  used.length=0;const entity={id:0,x:12,y:14,facing:.9,weapon:'pistol',visualEquipmentId:d.id,visualEquipmentCategory:d.category,visualEquipmentRate:d.fireRate,visualPosture:posture,visualLowerFacing:.9,visualUpperFacing:.9,meleeCooldown:.2},before=JSON.stringify(entity);
  assert.equal(art.drawActor(context(),entity,'player',.5,false,false),true);assert.deepEqual(used.map(p=>p[0]),[Art.HERO_LOW137[posture].atlas]);assert.equal(JSON.stringify(entity),before);
 }
});
test('137 rendu : arme basse, mains nues et recharge debout ne reprennent pas les atlas obliques',async()=>{
 const art=await emptyArt();art.images.heroCrouch137={};art.images.heroProne137={};art.images.commanderRig={};art.images.commanderPistol={};art.images.commander={};const used=[];art.blit=(_c,key,r)=>{used.push([key,r]);return true;};
 for(const posture of ['crouch','prone'])for(const weapon of ['pistol','rifle','shotgun']){
  const e={id:0,x:0,y:0,facing:1.2,weapon,visualEquipmentCategory:'firearm',visualPosture:posture,visualUpperFacing:1.2,visualLowerFacing:1.2};used.length=0;art.drawActor(context(),e,'player',1,false,false);
  assert.deepEqual(used.map(p=>p[0]),[Art.HERO_LOW137[posture].atlas,'commanderRig']);used.length=0;art.drawActor(context(),{...e,visualUnarmed:true},'player',1,false,false);assert.deepEqual(used.map(p=>p[0]),[Art.HERO_LOW137[posture].atlas]);
 }
 used.length=0;art.drawActor(context(),{id:0,x:0,y:0,facing:1,weapon:'pistol',visualEquipmentCategory:'firearm',visualUpperFacing:1,visualLowerFacing:1,visualArticulated:false,reload:.6,reloadTotal:2},'player',1,false,false);assert.deepEqual(used.map(p=>p[0]),['commanderRig','commanderRig']);
 assert.notDeepEqual(Art.reloadPose137({reload:1.7,reloadTotal:2}),Art.reloadPose137({reload:.4,reloadTotal:2}));assert.equal(Art.reloadPose137({reload:0,reloadTotal:2}),null);
});
let native;try{native=require('@napi-rs/canvas');}catch{}
test('137 fichiers : deux silhouettes réellement transparentes, pivots opaques et dimensions déclarées exactes',{skip:!native},async()=>{
 const {createCanvas,loadImage}=native;
 for(const pose of Object.values(Art.HERO_LOW137)){const spec=Art.ASSETS[pose.atlas],im=await loadImage(spec.url);assert.equal(im.width,spec.width);assert.equal(im.height,spec.height);const c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);const pixels=c.getImageData(0,0,im.width,im.height).data;
  assert.equal(pixels[3],0);assert.ok(pixels[(pose.pivot[1]*im.width+pose.pivot[0])*4+3]>240);assert.deepEqual(Art.tightRect(pixels,im.width,[0,0,im.width,im.height]),pose.rect);
 }
});
