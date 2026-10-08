'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/actor-presentation.js');
const {boot127}=require('./helpers/expansions127.cjs');
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const gap=(a,b)=>Math.abs(wrap(a-b));
function setup(){const e=boot127();e.game.startNew('standard','17117');return e;}

test('commande : X change seulement la posture, K équipe et range seulement la pelle',()=>{
 const {game:g,dispatchDocument}=setup();g.player.posture='stand';
 const press=code=>dispatchDocument('keydown',{code,target:g.canvas||document.getElementById('game')});
 press('KeyX');assert.equal(g.player.posture,'prone');assert.equal(g.linecare.toolActive(),false);
 press('KeyX');assert.equal(g.player.posture,'stand');assert.equal(g.linecare.toolActive(),false);
 press('KeyK');assert.equal(g.player.posture,'stand');assert.equal(g.linecare.toolActive(),true);
 press('KeyK');assert.equal(g.player.posture,'stand');assert.equal(g.linecare.toolActive(),false);
 press('KeyC');assert.equal(g.player.posture,'crouch');assert.equal(g.linecare.toolActive(),false);
});

test('commande : K ne déclenche pas la pelle en saisie, répétition, raccourci système ou pause',()=>{
 const {game:g,dispatchDocument}=setup();
 for(const extra of [{target:document.createElement('input')},{repeat:true},{ctrlKey:true},{altKey:true},{metaKey:true}]){
  dispatchDocument('keydown',{code:'KeyK',target:document.getElementById('game'),...extra});assert.equal(g.linecare.toolActive(),false);
 }
 g.paused=true;dispatchDocument('keydown',{code:'KeyK',target:document.getElementById('game')});assert.equal(g.linecare.toolActive(),false);
});

test('articulation : reculer garde le bassin vers la visée et inverse le cycle des pieds',()=>{
 let pose=null;for(let i=0;i<10;i++)pose=A.standingStep(pose,{facing:0,vx:-136,vy:0,moving:true,distance:5.44},.04);
 assert.equal(pose.backward,true);assert.ok(gap(pose.hips,0)<1e-9);assert.ok(gap(pose.shoulders,0)<1e-9);
 const forward=A.standingStep(null,{facing:0,vx:136,vy:0,moving:true,distance:5},.04),backward=A.standingStep(null,{facing:0,vx:-136,vy:0,moving:true,distance:5},.04);
 assert.equal(forward.phase,-backward.phase);
});

test('articulation : strafing, visée arrière et pivot restent dans les limites anatomiques',()=>{
 let prior=A.standingStep(null,{facing:0},.04);
 for(let i=0;i<500;i++){
  const facing=Math.sin(i*.047)*Math.PI,moving=i%71<40,vx=Math.cos(i*.09)*120,vy=Math.sin(i*.09)*120;
  const next=A.standingStep(prior,{facing,moving,vx,vy,distance:moving?4.8:0},.04);
  if(gap(facing,prior.hips)<=A.JOINTS.maxTwist)assert.ok(gap(next.hips,prior.hips)<=A.JOINTS.hipsRate*.04+1e-9);
  assert.ok(gap(next.shoulders,facing)<1e-9,'le torse et le tir réel visent exactement la même direction');
  assert.ok(gap(next.shoulders,next.hips)<=A.JOINTS.maxTwist+1e-9);
  assert.ok(Number.isFinite(next.phase));prior=next;
 }
 let pose=A.standingStep(null,{facing:0},.04);pose=A.standingStep(pose,{facing:Math.PI},.04);
 assert.ok(gap(pose.hips,Math.PI)<=A.JOINTS.maxTwist);assert.equal(pose.pivoting,true);
 for(let i=0;i<30;i++)pose=A.standingStep(pose,{facing:Math.PI},.04);
 assert.ok(gap(pose.hips,Math.PI)<.09);assert.ok(gap(pose.shoulders,Math.PI)<1e-9);assert.equal(pose.pivoting,false);
});

test('articulation : petit changement de visée au repos ne fait pas tourner les chaussures',()=>{
 const prior=A.standingStep(null,{facing:0},.04);
 const next=A.standingStep(prior,{facing:.4},.04);
 assert.equal(next.hips,prior.hips);assert.ok(gap(next.shoulders,.4)<1e-9);assert.equal(next.pivoting,false);
 for(const dt of [0,-1,NaN,Infinity])assert.deepEqual(A.standingStep(next,{facing:Math.PI,moving:true,distance:999},dt),next);
});

test('présentation articulée : pause, postures et actions prioritaires sans état de simulation ajouté',()=>{
 const {game:g}=setup();g.world.nodes=[];Object.assign(g.player,{x:1000,y:1000,facing:0});
 g.input.keys.add('KeyD');g.updatePlayer(.04);let p=g.actorPresentation.player();
 assert.equal(p.visualArticulated,true);assert.ok(Number.isFinite(p.visualLowerFacing));
 const before=JSON.stringify(g.player),phase=p.visualStride;g.paused=true;p=g.actorPresentation.player();
 assert.equal(p.visualStride,phase);assert.equal(p.visualMoving,false);assert.equal(JSON.stringify(g.player),before);
 g.paused=false;g.player.posture='crouch';assert.equal(g.actorPresentation.player().visualArticulated,false);
 g.player.posture='prone';assert.equal(g.actorPresentation.player().visualArticulated,false);
 g.player.posture='stand';g.player.reload=1;assert.equal(g.actorPresentation.player().visualArticulated,false);
 g.player.reload=0;g.player.meleeCooldown=.3;assert.equal(g.actorPresentation.player().visualArticulated,false);
 g.player.meleeCooldown=0;g.player.dead=true;assert.equal(g.actorPresentation.player().visualArticulated,false);
 assert.equal(Object.hasOwn(g.player,'visualLowerFacing'),false);
});


test('commande : une sortie de D-17 range la pelle et son raccourci régional ne bloque pas les armes',()=>{
 const {game:g,dispatchDocument}=setup();assert.equal(g.linecare.equip(),true);
 Object.assign(g.player,{x:4068,y:2048});assert.equal(g.frontier.enter(),true);g.updatePlayer(.04);
 assert.equal(g.linecare.toolActive(),false);assert.equal(g.linecare.equip(),false);
 dispatchDocument('keydown',{code:'KeyK',target:document.getElementById('game')});assert.equal(g.linecare.toolActive(),false);
 dispatchDocument('keydown',{code:'KeyX',target:document.getElementById('game')});assert.equal(g.worldEvolution.posture().key,'prone');assert.equal(g.linecare.toolActive(),false);
});


test('présentation : les lectures régionales utilisent la pose légère sans sérialiser les historiques',()=>{
 const {game:g}=setup();Object.assign(g.player,{x:4068,y:2048});assert.equal(g.frontier.enter(),true);
 const api=g.frontier;let fullReads=0;g.frontier={...api,snapshot(){fullReads++;return api.snapshot();}};
 for(let i=0;i<100;i++)g.actorPresentation.player();assert.equal(fullReads,0);
 assert.equal(g.actorPresentation.player().x,g.frontier.position().x*32);
});

test('présentation : le recul d’arme ne couvre que les premières 80 ms du vrai délai de tir',()=>{
 const {game:g}=setup();const C=require('../src/core.js');
 for(const weapon of ['pistol','rifle','shotgun']){
  g.player.weapon=weapon;g.player.shootCooldown=1/C.WEAPONS[weapon].fireRate;g.stats.shots++;
  assert.equal(g.actorPresentation.player().visualRecoil,true);
  g.player.shootCooldown-=.09;assert.equal(g.actorPresentation.player().visualRecoil,false);
 }
});

test('rig : découpes et pivots mesurés restent dans les sources et le cycle inverse utilise les quatre poses',()=>{
 const Art=require('../src/art.js'),rig=Art.HERO_RIG,a=Art.ASSETS.commanderRig;
 assert.deepEqual([a.width,a.height],[1774,887]);assert.equal(rig.upper.length,4);assert.equal(rig.lower.length,4);
 for(const part of [...rig.upper,...rig.lower]){
  const [x,y,w,h]=part.rect;assert.ok(x>=0&&y>=0&&x+w<=a.width&&y+h<=a.height);
  assert.ok(part.pivot[0]>=x&&part.pivot[0]<=x+w&&part.pivot[1]>=y&&part.pivot[1]<=y+h);
 }
 assert.deepEqual([0,.25,.5,.75].map(n=>Art.heroRigPose({visualMoving:true,visualStride:n*Math.PI*2}).lower),[0,1,2,3]);
 assert.deepEqual([0,-.25,-.5,-.75].map(n=>Art.heroRigPose({visualMoving:true,visualStride:n*Math.PI*2}).lower),[0,3,2,1]);
 assert.equal(Art.heroRigPose({visualMoving:true,visualStride:3},true).lower,Art.HERO_RIG.idleLower);
 assert.equal(Art.heroRigPose({weapon:'pistol',visualRecoil:true}).upper,3);
 assert.equal(Art.heroRigPose({weapon:'rifle',visualRecoil:true}).upper,2);
});

test('rig : jambes / torse indépendants, recharge zénithale et replis historiques préservés',async()=>{
 const Art=require('../src/art.js'),oldImage=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};
 try{
  const art=Art.create();await art.ready;art.images.commanderRig={};art.images.commander={};
  const rotations=[],draws=[],magazine=[],ctx={save(){},restore(){},translate(){},rotate(a){rotations.push(a);},beginPath(){},ellipse(){},stroke(){},fillRect(...args){magazine.push(args);}};
  art.blit=(_ctx,atlas,rect,...coordinates)=>{draws.push({atlas,rect,coordinates});return true;};
  const entity={x:0,y:0,weapon:'rifle',facing:0,visualArticulated:true,visualPosture:'stand',visualLowerFacing:.4,visualUpperFacing:0};
  assert.equal(art.drawActor(ctx,entity,'player',1,false,false),true);
  assert.equal(draws.length,2);assert.deepEqual(draws.map(x=>x.atlas),['commanderRig','commanderRig']);
  assert.equal(rotations[0],.4);assert.equal(rotations[1],0);
  for(const change of [{visualPosture:'crouch'},{visualPosture:'prone'},{dead:true},{visualAction:'work'}]){
   draws.length=0;assert.equal(art.drawActor(ctx,{...entity,...change},'player',1,false,false),true);
   assert.equal(draws.length,1);assert.equal(draws[0].atlas,'commander');
  }
  draws.length=0;rotations.length=0;
  assert.equal(art.drawActor(ctx,{...entity,visualArticulated:false,reload:1,reloadTotal:2},'player',1,false,false),true);
  assert.deepEqual(draws.map(x=>x.atlas),['commanderRig','commanderRig'],'la recharge conserve les deux pièces zénithales');
  assert.equal(rotations[0],.4,'le bassin conserve son angle indépendant');assert.ok(magazine.length>0,'la manipulation du chargeur est peinte');
  draws.length=0;delete art.images.commanderRig;art.drawActor(ctx,entity,'player',1,false,false);assert.equal(draws[0].atlas,'commander');
  draws.length=0;art.drawActor(ctx,{...entity,reload:1,reloadTotal:2},'player',1,false,false);assert.equal(draws[0].atlas,'commander','la recharge garde son ancien secours si le rig ne charge pas');
 }finally{globalThis.Image=oldImage;}
});
