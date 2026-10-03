'use strict';
// Real Canvas painter and real updatePlayer samples. No browser certification.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const Art=require('../src/art.js'),P=require('../src/actor-presentation.js');
const {setup,measureCase,angles,names}=require('../tests/helpers/motion130.cjs');
const project=path.resolve(__dirname,'..'),out=path.join(project,'reports/1.30.0/captures');
const prefix=process.argv.includes('--before')?'avant-motion130':'motion130';
const sourceOnly=process.argv.includes('--before');

function components(data,w,h){
 const seen=new Uint8Array(w*h),sizes=[];let opaque=0;
 for(let at=0;at<w*h;at++)if(data[at*4+3]>=96){opaque++;if(!seen[at]){
  let size=0;const queue=[at];seen[at]=1;
  for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w,y=Math.floor(p/w);size++;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,q=ny*w+nx;
    if(nx>=0&&nx<w&&ny>=0&&ny<h&&!seen[q]&&data[q*4+3]>=96){seen[q]=1;queue.push(q);}}
  }sizes.push(size);
 }}return {opaque,sizes:sizes.sort((a,b)=>b-a)};
}
function pixels(art,entity){
 const size=256,c=createCanvas(size,size),ctx=c.getContext('2d');ctx.translate(size/2,size/2);ctx.scale(3,3);
 assert.equal(art.drawCommanderRig(ctx,entity,false,false),true);
 const joined=components(ctx.getImageData(0,0,size,size).data,size,size);
 return {opaque:joined.opaque,detached:joined.sizes.slice(1).reduce((a,b)=>a+b,0),largestDetached:joined.sizes[1]||0};
}
function panel(ctx,x,y,title,art,entity){
 ctx.fillStyle='#26322d';ctx.fillRect(x+3,y+3,194,170);
 ctx.strokeStyle='#3b4840';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+4,y+80);ctx.lineTo(x+196,y+80);ctx.stroke();
 for(const [dx,scale]of [[39,1],[126,2.5]]){ctx.save();ctx.translate(x+dx,y+83);ctx.scale(scale,scale);
  art.drawActor(ctx,{...entity,x:0,y:0},'player',.5,false,false);ctx.restore();}
 ctx.fillStyle='#eadfbd';ctx.font='13px sans-serif';ctx.fillText(title,x+10,y+143);
 ctx.fillStyle='#a9b9ad';ctx.font='11px sans-serif';ctx.fillText('taille jeu                ×2,5',x+14,y+160);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});globalThis.Image=class{set src(_){this.onerror?.();}};
 const art=Art.create();await art.ready;
 for(const key of ['commanderRig','commander','commanderPistol'])art.images[key]=await loadImage(path.join(project,Art.ASSETS[key].url));
 const canvas=createCanvas(1640,1160),ctx=canvas.getContext('2d');ctx.fillStyle='#17221e';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#eee3c5';ctx.font='bold 25px sans-serif';ctx.fillText('COMMANDANT · 8 DIRECTIONS ET ANCRAGE DES JAMBES',24,40);
 ctx.fillStyle='#b7c6b9';ctx.font='15px sans-serif';ctx.fillText('Moteur Canvas réel · mouvements mesurés après collision · vue du dessus · DOM simulé',24,70);
 const scene=setup(),region=setup(true),cases=[];
 for(let aim=0;aim<8;aim++){
  const forward=measureCase(scene,aim,aim),back=measureCase(scene,aim,(aim+4)%8),strafe=measureCase(scene,aim,(aim+2)%8),regional=measureCase(region,aim,(aim+6)%8);
  const idle={...forward.entity,visualMoving:false,visualLowerFacing:angles[aim],visualUpperFacing:angles[aim],visualStride:0};
  const examples=[['Repos',idle],['Marche',forward.entity],['Recul',back.entity],['Pas latéral',strafe.entity],['Région · latéral',regional.entity]];
  for(const [row,[label,entity]]of examples.entries()){
   panel(ctx,20+aim*200,94+row*177,label+' · '+names[aim],art,entity);
   cases.push({label,aim:angles[aim],hips:entity.visualLowerFacing,shoulders:entity.visualUpperFacing,phase:entity.visualStride});
  }
 }
 const actions=[['Accroupi',{visualPosture:'crouch'}],['Allongé',{visualPosture:'prone'}],['Recharge',{reload:1,reloadTotal:2}],['Travail',{visualAction:'work'}],['Pistolet',{weapon:'pistol'}],['Fusil · tir',{weapon:'rifle',visualRecoil:true}],['Pistolet · tir',{weapon:'pistol',visualRecoil:true}],['Mouvement réduit',{}]];
 for(const [i,[title,change]]of actions.entries()){
  const x=20+i*200,y=985;ctx.fillStyle='#26322d';ctx.fillRect(x+3,y,194,155);ctx.save();ctx.translate(x+96,y+72);ctx.scale(2.3,2.3);
  art.drawActor(ctx,{x:0,y:0,weapon:'rifle',facing:0,visualArticulated:true,visualUpperFacing:0,visualLowerFacing:0,visualPosture:'stand',...change},'player',.5,i===7,false);ctx.restore();
  ctx.fillStyle='#eadfbd';ctx.font='13px sans-serif';ctx.fillText(title,x+14,y+134);
 }
 fs.writeFileSync(path.join(out,prefix+'-directions.png'),canvas.toBuffer('image/png'));
 const scaleCanvas=createCanvas(1480,900),sc=scaleCanvas.getContext('2d');sc.fillStyle='#17221e';sc.fillRect(0,0,1480,900);
 sc.fillStyle='#eee3c5';sc.font='bold 23px sans-serif';sc.fillText('ÉCHELLES RÉELLES · D-17 ET RÉGION',24,38);
 sc.fillStyle='#b7c6b9';sc.font='14px sans-serif';sc.fillText('Même ancrage x/y ; conversion régionale 32 unités = 1 m · moteur Canvas réel, DOM simulé',24,66);
 const scales=[['D-17 · zoom minimum 0,52',.52],['D-17 · zoom 1',1],['D-17 · zoom maximum 1,65',1.65],['Région · 12 px/m',12/32],['Région · 26 px/m',26/32],['Région · 44 px/m',44/32]];
 for(const[row,[label,scale]]of scales.entries()){
  const y=89+row*132;sc.fillStyle='#26322d';sc.fillRect(20,y,1440,126);sc.fillStyle='#d9d2b7';sc.font='13px sans-serif';sc.fillText(label,31,y+23);
  for(let aim=0;aim<8;aim++){
   const x=105+aim*178;sc.save();sc.translate(x,y+77);sc.scale(scale,scale);
   art.drawActor(sc,{x:0,y:0,weapon:'rifle',facing:angles[aim],visualArticulated:true,visualUpperFacing:angles[aim],visualLowerFacing:angles[aim],visualMoving:false},'player',.5,false,false);sc.restore();
   sc.fillStyle='#a4b6a8';sc.font='11px sans-serif';sc.fillText(names[aim],x-6,y+115);
  }
 }
 fs.writeFileSync(path.join(out,prefix+'-scales.png'),scaleCanvas.toBuffer('image/png'));
 const inspections=[];
 for(const facing of angles)for(const twist of [-P.JOINTS.maxTwist,-Math.PI/4,0,Math.PI/4,P.JOINTS.maxTwist])for(const weapon of ['rifle','pistol'])for(const recoil of [false,true])for(let phase=0;phase<4;phase++){
  const entity={x:0,y:0,weapon,facing,visualArticulated:true,visualPosture:'stand',visualLowerFacing:facing-twist,visualUpperFacing:facing,visualMoving:true,visualStride:phase*Math.PI/2,visualRecoil:recoil};
  const result=pixels(art,entity);inspections.push({facing,twist,weapon,recoil,phase,...result});
 }
 const worst=inspections.toSorted((a,b)=>b.largestDetached-a.largestDetached)[0];
 const report={browser:false,painter:'DeadwallArt.drawActor / drawCommanderRig',source:Art.ASSETS.commanderRig.url,cases,pixelCases:inspections.length,worst,checks:{largestDetachedMaximum:12,passed:inspections.every(p=>p.largestDetached<=12)},inspections};
 fs.writeFileSync(path.join(out,prefix+'-pixels.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({image:prefix+'-directions.png',pixelCases:report.pixelCases,worst,checks:report.checks}));
 if(!sourceOnly)assert.ok(report.checks.passed,'aucun membre ou morceau de membre détaché au-delà du bruit alpha');
})().catch(error=>{console.error(error);process.exitCode=1;});
