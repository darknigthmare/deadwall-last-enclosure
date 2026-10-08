'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/assets136.js'),Art=require('../src/art.js'),C=require('../src/core.js'),Ground=require('../src/ground135.js');
const {bootGame}=require('./helpers/browser.cjs'),Presentation=require('../src/actor-presentation.js');
function context(){const calls=[],stack=[];const c=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},drawImage(...a){calls.push(['image',...a]);},rotate(a){calls.push(['rotate',a]);},createRadialGradient(){return{addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});return{c,calls};}
async function art(){const old=globalThis.Image;globalThis.Image=class{set src(v){this.onerror();}};try{const a=Art.create();await a.ready;return a;}finally{globalThis.Image=old;}}
test('136 assets : catalogue unique, chemins distincts, outils anciens réutilisables',()=>{
 assert.equal(Object.keys(A.ASSETS).length,27);assert.equal(new Set(Object.values(A.ASSETS).map(v=>v.url)).size,27);
 for(const[key,v]of Object.entries(A.ASSETS)){assert.equal(Art.ASSETS[key],v);assert.match(v.url,/^assets\/art136\/[a-z-]+\.png$/);assert.equal(v.matte,'none');}
 assert.deepEqual(A.LEGACY.pickaxe,[2,3]);assert.deepEqual(A.LEGACY.shovel,[3,3]);
 for(const d of Object.values(C.Arsenal134Rules.catalog).filter(d=>['melee','tool','improvised'].includes(d.category)))assert.ok(A.PATHS[d.id],d.id+' dispose de sa silhouette de secours');
});
test('136 héros : tous les outils et armes de contact évitent les sprites de pistolet, debout et en posture basse',async()=>{
 const a=await art();a.images.commanderRig={};const used=[];a.blit=(_c,key,r)=>{used.push([key,r]);return true;};
 for(const d of Object.values(C.Arsenal134Rules.catalog).filter(d=>['melee','tool','improvised'].includes(d.category)))for(const posture of ['stand','crouch','prone']){
  used.length=0;const{c}=context(),e={id:0,x:10,y:10,facing:.3,weapon:'pistol',visualEquipmentId:d.id,visualEquipmentCategory:d.category,visualEquipmentRate:d.fireRate,visualPosture:posture,visualLowerFacing:0,visualUpperFacing:.3,meleeCooldown:.2};
  assert.equal(a.drawActor(c,e,'player',.5,false,false),true);assert.ok(used.every(([key,r])=>key==='commanderRig'&&Art.HERO_RIG.lower.some(p=>p.rect===r)),d.id+' / '+posture+' ne montre que les jambes du rig armé');
 }
});
test('136 héros : une action réelle de récolte conserve son cycle prioritaire',async()=>{
 const a=await art(),frame={image:{width:10,height:10},pivot:[5,5]};a.actionFrames133.heroHarvest133=Array.from({length:32},()=>frame);const{c,calls}=context();
 assert.equal(a.drawActor(c,{x:0,y:0,weapon:'pistol',visualEquipmentId:'crowbar',visualEquipmentCategory:'tool',visualAction133:{kind:'chop',elapsed:.1,facing:0}},'player',.5,false,false),true);
 assert.equal(a.diagnostics.draws.heroHarvest133,1);assert.ok(calls.some(v=>v[0]==='image'&&v[1]===frame.image));
});
test('136 présentation : lecture légère du matériel, aucun appel à la vue du catalogue ni mutation du joueur',()=>{
 const e=bootGame(),g=e.game;g.startNew('standard','17117');g.art={};let eq={id:'hatchet',category:'tool',condition:83,fireRate:1.1};g.arsenal134={visualEquipment:()=>eq,view(){throw Error('Vue complète appelée par le rendu');}};Presentation.install(g);const before=JSON.stringify(g.player),p=g.actorPresentation.player();
 assert.equal(p.visualEquipmentId,'hatchet');assert.equal(p.visualEquipmentCategory,'tool');assert.equal(p.visualUnarmed,false);assert.equal(JSON.stringify(g.player),before);
 eq=null;assert.equal(g.actorPresentation.player().visualUnarmed,true);assert.equal(g.actorPresentation.player().visualEquipmentId,null);
});
test('136 présentation : recul bref du fusil à verrou et du pistolet mitrailleur à leur cadence réelle',()=>{
 const{game:g}=bootGame();g.startNew('standard','17117');g.art={};g.player.weapon='rifle';let equipment={id:'hunting',category:'firearm',condition:100,fireRate:.67};g.arsenal134={visualEquipment:()=>equipment};Presentation.install(g);
 g.player.shootCooldown=1.45;g.stats.shots++;assert.equal(g.actorPresentation.player().visualRecoil,true,'départ du coup à verrou');g.player.shootCooldown=.5;assert.equal(g.actorPresentation.player().visualRecoil,false,'le recul cesse avant la fin du verrouillage');
 equipment={id:'smg',category:'firearm',condition:100,fireRate:10};g.player.shootCooldown=.03;g.stats.shots++;assert.equal(g.actorPresentation.player().visualRecoil,true,'rafale rapide encore dans sa fenêtre de recul');g.player.shootCooldown=.01;assert.equal(g.actorPresentation.player().visualRecoil,false);
});
test('136 inventaire : les 17 équipements de contact gardent leur identité visuelle réelle',()=>{
 const {boot127}=require('./helpers/expansions127.cjs'),Loadout=require('../src/loadout129.js'),e=boot127(),g=e.game;g.startNew('standard','17117');Loadout.install(g);
 const items=Object.values(C.Arsenal134Rules.catalog).filter(d=>['melee','tool','improvised'].includes(d.category)).map((d,i)=>({uid:i+1,id:d.id,condition:80,rounds:0}));
 g.arsenal134={view:()=>({carried:items,equipped:1,weight:12,capacity:22})};const weapons=g.loadout.equipment().weapons;
 assert.equal(weapons.length,17);for(const w of weapons){assert.equal(w.icon,w.catalogId);assert.notEqual(w.icon,'pistol');}
});
test('136 sprites : alpha, angle et taille physique restent sous le contrôle du peintre',()=>{
 const{c,calls}=context(),img={width:1024,height:1024},art={images:{art136Limestone:img},rects:{'art136Limestone:sprite':[100,200,600,400]}};c.globalAlpha=.32;
 assert.equal(A.drawSprite(c,art,'art136Limestone',10,20,2,2,{angle:.4}),true);const draw=calls.find(v=>v[0]==='image');assert.deepEqual(draw.slice(2,6),[100,200,600,400]);assert.equal(draw[8],2);assert.ok(draw[9]<=2);assert.equal(c.globalAlpha,.32);assert.ok(calls.some(v=>v[0]==='rotate'&&v[1]===.4));
 assert.equal(A.drawSprite(c,art,'art136Oak',0,0,4),false);assert.equal(A.drawSprite(c,art,'art136Limestone',0,0,-1),false);
});
test('136 nature : canopée bitmap seulement vivante, souche et génération ancienne préservées',()=>{
 const previous=globalThis.DEADWALL;globalThis.DEADWALL={art:{images:{art136Oak:{width:1024,height:1024}},rects:{}}};
 try{let{c,calls}=context();const t={id:'tree',kind:'tree',species:'oak',x:2,y:3,a:.4,r:.4,canopy:3},v={world:{generation:6},x:2,y:3};Ground.drawScenery(c,t,v,false);assert.ok(calls.some(v=>v[0]==='image'));({c,calls}=context());Ground.drawScenery(c,t,v,true);assert.ok(!calls.some(v=>v[0]==='image'));assert.ok(calls.some(v=>v[0]==='arc'&&v[3]===.18));({c,calls}=context());assert.equal(Ground.drawScenery(c,t,{...v,world:{generation:5}},false),false);assert.equal(calls.length,0);}finally{globalThis.DEADWALL=previous;}
});
test('136 nature : les 9 essences et 4 minéraux du monde utilisent leur propre image, avec repli en cas d’échec',()=>{
 const previous=globalThis.DEADWALL,images=Object.fromEntries(Object.keys(A.ASSETS).map(key=>[key,{width:1254,height:1254}]));globalThis.DEADWALL={art:{images,rects:{}}};
 try{for(const[kind,rules,sprites]of [['tree',C.BiomeRules135.trees,A.TREE_SPRITES],['rock',C.BiomeRules135.rocks,A.ROCK_SPRITES]]){
  assert.deepEqual(Object.keys(sprites).sort(),Object.keys(rules).sort());assert.equal(new Set(Object.values(sprites)).size,Object.keys(rules).length);
  for(const species of Object.keys(rules)){const t={id:species,kind,species,x:2,y:3,a:.4,r:.4,canopy:3},v={world:{generation:6},x:20,y:30},{c,calls}=context(),before=JSON.stringify(t);Ground.drawScenery(c,t,v,false);assert.equal(calls.filter(p=>p[0]==='image').length,1);assert.equal(calls.find(p=>p[0]==='image')[1],images[sprites[species]],species+' choisit son image exacte');assert.equal(JSON.stringify(t),before,'la géométrie reste intacte');}
 }
 globalThis.DEADWALL.art.images={};for(const[kind,species]of [['tree','beech'],['rock','granite']]){const{c,calls}=context();Ground.drawScenery(c,{id:species,kind,species,x:2,y:3,r:.4,canopy:3},{world:{generation:6},x:20,y:30},false);assert.ok(!calls.some(p=>p[0]==='image'));assert.ok(calls.some(p=>p[0]==='fill'),'le secours procédural reste visible');}
 }finally{globalThis.DEADWALL=previous;}
});
let native;try{native=require('@napi-rs/canvas');}catch{}
test('136 fichiers : chargeur Art réel, dimensions, alpha, découpes et absence de fichier défaillant',{skip:!native},async()=>{
 const previous={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:()=>native.createCanvas(1,1)};globalThis.Image=native.Image;
 try{const a=Art.create();await a.ready;assert.deepEqual(a.diagnostics.failed,[]);for(const[key,spec]of Object.entries(A.ASSETS)){const image=a.images[key];assert.ok(image,key+' chargé');assert.equal(image.width,spec.width);assert.equal(image.height,spec.height);if(!['art136ForestFloor','art136WetGround','art136LockChest','art136ElectricalPanel'].includes(key)){const r=a.rects[key+':sprite'];assert.ok(r&&r[2]>0&&r[3]>0,key+' contour mesuré');assert.ok(r[0]+r[2]<=image.width&&r[1]+r[3]<=image.height);}}}finally{globalThis.document=previous.document;globalThis.Image=previous.Image;}
});
test('136 textures : raccord raster exact après déplacement caméra et texture chargée tardivement',{skip:!native},()=>{
 const previous={document:globalThis.document,game:globalThis.DEADWALL};globalThis.document={createElement:()=>native.createCanvas(1,1)};globalThis.DEADWALL={art:{images:{}}};Ground.reset();
 try{
  const palette={base:'#69714a',secondary:'#5b653f',soil:'#8d7858',accent:'#b7a36e',rock:'#a49f8b',grass:'#849064',water:'#50645a'},w={generation:6,seed:17117,biomeAt:()=>({id:'deciduous',weights:{deciduous:1},palette})};
  const render=v=>{const canvas=native.createCanvas((v.r-v.l)*16,(v.b-v.t)*16),c=canvas.getContext('2d');c.scale(16,16);c.translate(-v.l,-v.t);Ground.draw(c,w,v,{scale:16});return canvas;};
  const v={l:28,r:36,t:252,b:260},before=render(v).toBuffer('image/png'),texture=native.createCanvas(32,32),tc=texture.getContext('2d');tc.fillStyle='#886431';tc.fillRect(0,0,32,32);tc.fillStyle='#c0a660';tc.fillRect(2,3,13,9);globalThis.DEADWALL.art.images.art136ForestFloor=texture;
  const a=render(v),b=render({l:26,r:38,t:250,b:262});assert.notDeepEqual(a.toBuffer('image/png'),before,'une tuile déjà en cache est enrichie quand la texture arrive');assert.deepEqual(a.getContext('2d').getImageData(0,0,128,128).data,b.getContext('2d').getImageData(32,32,128,128).data,'une frontière de tuile et un mouvement de caméra ne changent aucun pixel');
 }finally{globalThis.document=previous.document;globalThis.DEADWALL=previous.game;Ground.reset();}
});
