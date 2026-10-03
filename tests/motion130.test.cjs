'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/actor-presentation.js');
const Art=require('../src/art.js');
const {setup,measureCase,angles,gap}=require('./helpers/motion130.cjs');

test('motion130 : huit visées et huit déplacements réels à D-17, sans désalignement arme/tir',()=>{
 const scene=setup();for(let aim=0;aim<8;aim++)for(let travel=0;travel<8;travel++)measureCase(scene,aim,travel);
});
test('motion130 : huit visées et huit déplacements réels en région, sans mélange mètres/unités',()=>{
 const scene=setup(true);for(let aim=0;aim<8;aim++)for(let travel=0;travel<8;travel++){
  const sample=measureCase(scene,aim,travel);assert.ok(sample.distance<120);
  assert.equal(sample.entity.visualPosture,'stand');
 }
});
test('motion130 : un demi-tour de visée ne dessine jamais un tir à travers l’épaule',()=>{
 let p=P.standingStep(null,{facing:0},.04);
 for(const aim of [Math.PI,-Math.PI/2,Math.PI/2,0,Math.PI*.99,-Math.PI*.99]){
  p=P.standingStep(p,{facing:aim},.04);
  assert.ok(gap(p.shoulders,aim)<1e-9);assert.ok(gap(p.hips,aim)<=P.JOINTS.maxTwist+1e-9);
 }
});
test('motion130 : la rotation progressive et le recul fonctionnent dans les huit directions',()=>{
 for(const facing of angles){let p=P.standingStep(null,{facing},.04);
  const vx=-Math.cos(facing)*136,vy=-Math.sin(facing)*136;
  p=P.standingStep(p,{facing,vx,vy,moving:true,distance:5.44},.04);
  assert.equal(p.backward,true);assert.ok(gap(p.hips,facing)<1e-9);
  const next=P.standingStep(p,{facing:facing+.2},.04);
  assert.ok(gap(next.hips,p.hips)<1e-9);assert.ok(gap(next.shoulders,facing+.2)<1e-9);
 }
});
test('motion130 : course, arrêt et pause ne créent ni pieds flottants ni données de sauvegarde',()=>{
 const scene=setup(),sample=measureCase(scene,0,0,{sprint:true});assert.equal(sample.entity.sprinting,true);
 const {g}=scene;g.input.keys.clear();g.updatePlayer(.04);let p=g.actorPresentation.player();assert.equal(p.visualMoving,false);
 const data=g.serialize();assert.equal(Object.hasOwn(data.player,'visualStride'),false);
 const phase=p.visualStride;g.paused=true;
 for(let i=0;i<10;i++){p=g.actorPresentation.player();assert.equal(p.visualMoving,false);assert.equal(p.visualStride,phase);}
});
test('motion130 : les callbacks d’interaction ne redémarrent plus la marche locale à chaque tick',()=>{
 for(const regional of [false,true]){
  const scene=setup(regional),{samples,entity}=measureCase(scene,0,2,{ticks:24});
  const frames=new Set(samples.map(sample=>Art.heroRigPose(sample).lower));
  assert.equal(frames.size,4,'les quatre pas se succèdent après des mouvements réellement effectués');
  assert.ok(gap(entity.visualLowerFacing,entity.facing)>.9,'le bassin a fini le pas latéral au lieu de repartir de zéro');
  for(let i=1;i<samples.length;i++)assert.notEqual(samples[i].visualStride,samples[i-1].visualStride);
 }
});
test('motion130 : atlas orthographique sans rotation de compensation, repos dans la phase neutre',()=>{
 assert.equal(Art.ASSETS.commanderRig.url,'assets/commander-rig130.png');
 assert.equal(Object.hasOwn(Art.HERO_RIG,'legProjection'),false);
 assert.equal(Object.hasOwn(Art.HERO_RIG,'legScale'),false);
 assert.equal(Art.heroRigPose({}).lower,Art.HERO_RIG.idleLower);
 assert.equal(Art.heroRigPose({visualMoving:true,visualStride:Math.PI},true).lower,Art.HERO_RIG.idleLower);
});
