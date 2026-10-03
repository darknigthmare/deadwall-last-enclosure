'use strict';
// Actual art.drawActor output on native Canvas; technical pose sheet, not browser capture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/art.js'),P=require('../src/actor-presentation.js');
const project=path.resolve(__dirname,'..'),out=path.join(project,'reports/1.29.0/captures');
(async()=>{
 fs.mkdirSync(out,{recursive:true});globalThis.Image=class{set src(_){this.onerror?.();}};
 const art=A.create();await art.ready;
 for(const key of ['commanderRig','commander','commanderPistol'])art.images[key]=await loadImage(path.join(project,A.ASSETS[key].url));
 const canvas=createCanvas(1280,1040),ctx=canvas.getContext('2d');ctx.fillStyle='#1b2423';ctx.fillRect(0,0,1280,1040);
 ctx.fillStyle='#e6dfc4';ctx.font='bold 24px sans-serif';ctx.fillText('COMMANDANT · ARTICULATION ET POSTURES',40,43);
 ctx.fillStyle='#aab9b1';ctx.font='15px sans-serif';ctx.fillText('Rendu Canvas du moteur · pièces originales séparées · vue technique agrandie ×3',40,72);
 const cases=[
  ['Visée stable',{facing:0}],
  ['Marche avant',{facing:0,vx:136,vy:0,moving:true,distance:5.44}],
  ['Recul / visée opposée',{facing:0,vx:-136,vy:0,moving:true,distance:5.44}],
  ['Pas latéral gauche',{facing:0,vx:0,vy:-136,moving:true,distance:5.44}],
  ['Pas latéral droit',{facing:0,vx:0,vy:136,moving:true,distance:5.44}],
  ['Pivot après demi-tour',{facing:Math.PI,pivot:true}],
  ['Pistolet · marche',{facing:0,vx:136,vy:0,moving:true,distance:5.44,weapon:'pistol'}],
  ['Recul de tir',{facing:0,recoil:true}],
  ['Accroupi conservé',{posture:'crouch'}],
  ['Allongé conservé',{posture:'prone'}],
  ['Rechargement conservé',{reload:1}],
  ['Travail conservé',{work:true}]
 ];
 const evidence=[];
 for(const [i,[title,s]]of cases.entries()){
  const x=40+(i%4)*310,y=115+Math.floor(i/4)*295;ctx.fillStyle='#28332f';ctx.fillRect(x,y,288,262);
  ctx.strokeStyle='#34423b';ctx.lineWidth=1;for(let q=0;q<5;q++){ctx.beginPath();ctx.moveTo(x+q*60,y);ctx.lineTo(x+q*60,y+215);ctx.moveTo(x,y+q*50);ctx.lineTo(x+288,y+q*50);ctx.stroke();}
  let joints=P.standingStep(null,{facing:0},.04);for(let n=0;n<(s.pivot?5:8);n++)joints=P.standingStep(joints,s,.04);
  const entity={x:0,y:0,id:i,facing:s.facing||0,weapon:s.weapon||'rifle',visualArticulated:!s.posture&&!s.reload&&!s.work,
   visualLowerFacing:joints.hips,visualUpperFacing:joints.shoulders,visualStride:joints.phase,visualMoving:Boolean(s.moving),visualPivoting:joints.pivoting,
   visualRecoil:Boolean(s.recoil),visualPosture:s.posture||'stand',reload:s.reload||0,reloadTotal:2,visualAction:s.work?'work':''};
  ctx.save();ctx.translate(x+127,y+121);ctx.scale(3,3);assert.ok(art.drawActor(ctx,entity,'player',.39,false,false));ctx.restore();
  ctx.fillStyle='#e6dfc4';ctx.font='16px sans-serif';ctx.fillText(title,x+12,y+237);
  evidence.push({title,hips:joints.hips,shoulders:joints.shoulders,phase:joints.phase,rig:entity.visualArticulated});
 }
 fs.writeFileSync(path.join(out,'06-articulation-commandant.png'),canvas.toBuffer('image/png'));
 fs.writeFileSync(path.join(out,'06-articulation-commandant.json'),JSON.stringify({browser:false,fixture:true,painter:'DeadwallArt.drawActor',cases:evidence},null,2));
 console.log('reports/1.29.0/captures/06-articulation-commandant.png');
})();
