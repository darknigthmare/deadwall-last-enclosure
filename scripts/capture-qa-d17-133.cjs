'use strict';
// Actual game Canvas painters under a simulated DOM. These are not browser screenshots.
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const outputRoot=path.resolve(__dirname,'..'),project=process.argv[2]?path.resolve(process.argv[2]):outputRoot,label=process.argv[3]||'after';
const out=path.join(outputRoot,'reports/1.33.0/captures');
const {g}=require(path.join(project,'tests/helpers/expansions131.cjs')).boot131(),Art=require(path.join(project,'src/art.js')),X=require(path.join(project,'src/exploration-125.js'));
const canvas=createCanvas(1440,1000),mini=createCanvas(220,220),ctx=canvas.getContext('2d');
g.ctx=ctx;g.mctx=mini.getContext('2d');g.width=1440;g.height=1000;g.dpr=1;
const make=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):make(tag);
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();
(async()=>{
 await g.art.ready;
 for(const [key,spec]of Object.entries(Art.ASSETS)){
  const image=await loadImage(path.join(project,spec.url));
  if(['magenta','neutral'].includes(spec.matte)){
   const bitmap=createCanvas(image.width,image.height),c=bitmap.getContext('2d');c.drawImage(image,0,0);const data=c.getImageData(0,0,image.width,image.height);Art.decodeMatte(data.data,image.width,image.height,spec.matte);c.putImageData(data,0,0);g.art.images[key]=bitmap;
   const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(data.data,image.width,r);
  }else g.art.images[key]=image;
 }
 fs.mkdirSync(out,{recursive:true});const captures=[],samples=[];
 for(const seed of ['17117','84329']){
  g.startNew('standard',seed);g.dayClock=.44;g.weather=0;g.phaseTime=9999;g.settings.reducedMotion=true;g.camera.shake=0;g.paused=true;
  const p=g.serialize();if(p.fieldcraft)p.fieldcraft.opacity=0;g.restoreSave(p);g.dayClock=.44;g.weather=0;g.paused=true;
  const core=g.core(),plan=g.exploration125.plan,nodes=g.world.nodes.filter(n=>!n.depleted&&n.amount>0),wood=nodes.filter(n=>n.type==='wood'&&!n.sceneryKind);
  samples.push({seed,totalNodes:g.world.nodes.length,liveNodes:nodes.length,liveWood:wood.length,woodOnRoad:wood.filter(n=>plan.roads.some(r=>X.roadContains(r,n.x,n.y,n.radius||0))).map(n=>n.id),nearCore:nodes.filter(n=>Math.hypot(n.x-core.x,n.y-core.y)<600).length,roadGeometry:plan.roads.map(r=>({id:r.id,axis:r.axis,x:r.x,y:r.y,x1:r.x1,y1:r.y1,x2:r.x2,y2:r.y2,width:r.width})),layoutRevision:g.serialize().exploration125?.layoutRevision});
  for(const [suffix,x,y,zoom]of [['depot',core.x,core.y,.8],['lisiere',core.x+650,core.y-300,1.25]]){
   Object.assign(g.camera,{x,y,zoom});g.render();ctx.fillStyle='rgba(13,21,17,.95)';ctx.fillRect(0,0,1440,50);ctx.fillStyle='#eddda9';ctx.font='20px sans-serif';ctx.textAlign='left';ctx.fillText('D-17 · '+label+' · graine '+seed+' · '+suffix+' · Canvas réel / DOM simulé',20,32);
   const file='qa-d17-'+label+'-'+seed+'-'+suffix+'.png';fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));captures.push(file);
  }
 }
 const evidence={browser:false,prepared:true,renderer:'Game.render, native Canvas with simulated DOM',project,label,captures,samples};fs.writeFileSync(path.join(out,'qa-d17-'+label+'.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
