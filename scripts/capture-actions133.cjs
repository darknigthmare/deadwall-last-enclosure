'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage,ImageData}=require('@napi-rs/canvas');
const Art=require('../src/art.js');
async function loadArt(){
 const NativeImage=global.Image;global.Image=class{set src(_v){this.onerror();}};const art=Art.create();await art.ready;global.Image=NativeImage;
 const measurements={};
 for(const atlas of ['heroHarvest133','heroActions133']){
  const spec=Art.ASSETS[atlas],image=await loadImage(path.resolve(__dirname,'..',spec.url)),c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  const frames=Art.isolateHeroFrames133(ctx.getImageData(0,0,image.width,image.height).data,image.width,image.height,Art.HERO_ACTION_PIVOTS133[atlas]);
  art.images[atlas]=image;art.actionFrames133[atlas]=frames.map(frame=>{const canvas=createCanvas(frame.rect[2],frame.rect[3]);canvas.getContext('2d').putImageData(new ImageData(frame.data,canvas.width,canvas.height),0,0);return{image:canvas,pivot:frame.pivot,rect:frame.rect};});
  measurements[atlas]=frames.map(f=>({rect:f.rect,pivot:f.pivot,pixels:f.data.filter((_n,i)=>i%4===3&&f.data[i]>0).length}));
 }
 art.images.commanderRig=await loadImage(path.resolve(__dirname,'../assets/commander-rig130.png'));return{art,measurements};
}
async function capture(out=path.resolve(__dirname,'../reports/1.33.0/animations133.png')){
 const{art,measurements}=await loadArt();
 const canvas=createCanvas(1536,1140),ctx=canvas.getContext('2d');ctx.fillStyle='#26302d';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#f1e7ca';ctx.font='bold 25px sans-serif';ctx.fillText('DEADWALL · Actions du survivant / 64 poses',25,36);
 ctx.font='15px sans-serif';ctx.fillStyle='#c3ccbf';ctx.fillText('Rendu Canvas natif · Source alpha isolée · Point central fixe · Échelle 2× du jeu',25,65);
 const labels=['Bois / hache','Pierre / pioche','Récupération / levier','Ramassage / dépôt','Chantier / marteau','Déblaiement / pelle','Pansement','Ouverture de réserve'];
 for(const [row,[kind,spec]]of Object.entries(Art.HERO_ACTIONS133).entries()){
  ctx.fillStyle=row%2?'#303a34':'#25312b';ctx.fillRect(12,85+row*130,1512,126);ctx.font='bold 14px sans-serif';ctx.fillStyle='#d4c9a2';ctx.fillText(labels[row]+' · '+spec.seconds+' s',25,105+row*130);
  for(let frame=0;frame<8;frame++){
   const x=98+frame*190,y=152+row*130;ctx.save();ctx.translate(x,y);ctx.scale(2,2);
   art.drawHeroAction133(ctx,{visualAction133:{kind,elapsed:(frame+.1)/8*spec.seconds,facing:0},visualPosture:'stand'},false,false);
   ctx.strokeStyle='#b09963';ctx.globalAlpha=.6;ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(3,0);ctx.moveTo(0,-3);ctx.lineTo(0,3);ctx.stroke();ctx.restore();
   ctx.font='12px sans-serif';ctx.fillStyle='#9fad9e';ctx.fillText(String(frame+1).padStart(2,'0'),x-6,205+row*130);
  }
 }
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,canvas.toBuffer('image/png'));fs.writeFileSync(out.replace(/\.png$/,'.json'),JSON.stringify(measurements,null,2)+'\n');return out;
}
if(require.main===module)capture(process.argv[2]).then(console.log).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={capture,loadArt};
