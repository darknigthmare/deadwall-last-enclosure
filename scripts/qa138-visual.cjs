'use strict';
// Production HTML order and Canvas painters; prepared scenes, no browser/CSS claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const {bootDocument134}=require('./qa-startup134.cjs');
const root=path.resolve(__dirname,'..');
async function run(phase='before'){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 const canvas=createCanvas(1440,960),ctx=canvas.getContext('2d');g.ctx=ctx;g.mctx=createCanvas(220,220).getContext('2d');g.width=1440;g.height=960;g.dpr=1;
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'&&!v.startsWith('data:')?path.join(root,v):v;}};
 const fresh=globalThis.DeadwallArt.create();await fresh.ready;assert.deepEqual(fresh.diagnostics.failed,[]);
 // Preserve the installed instance and its extension building painters.
 for(const key of ['images','rects','actionFrames133','diagnostics','ready'])g.art[key]=fresh[key];
 g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 const out=path.join(root,'reports/1.38.0/captures');fs.mkdirSync(out,{recursive:true});
 const scenes=[],write=(name,meta={})=>{const file=`qa138-${phase}-${name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));scenes.push({name,file,...meta});};
 const plan=g.exploration125.plan;
 Object.assign(g.camera,{x:g.player.x,y:g.player.y,zoom:1.3,shake:0});g.render();write('d17-core');
 const workshop=plan.settlements.flatMap(s=>s.buildings).find(b=>b.type==='workshop');assert.ok(workshop);
 Object.assign(g.camera,{x:workshop.x,y:workshop.y,zoom:2.2,shake:0});g.render();write('d17-workshop',{id:workshop.id,type:workshop.type});
 const A=globalThis.DeadwallFrontierArt,G=globalThis.DeadwallFrontierGeometry,w=g.frontier.world(),base=g.serialize();
 function point(p,z,inside){
  for(let k=0;k<200;k++){
   const q=inside?G.global(p,.7+(k%20)*(p.w-1.4)/20,.7+Math.floor(k/20)*(p.h-1.4)/10):G.global(p,p.w/2+(k%5-2)*.5,-2-Math.floor(k/5)*.5);
   if(!w.blocked(q.x,q.y,.32,z,inside))return q;
  }
  throw Error('No valid prepared point '+p.id);
 }
 function capture(p,z,inside,name){
  const q=point(p,z,inside),save=structuredClone(base);Object.assign(save.frontier,{active:true,...q,z,inside,car:null,anchor:{x:g.player.x,y:g.player.y}});assert.equal(g.restoreSave(save),true);g.paused=true;g.dayClock=.44;g.weather=0;g.frontier.scale(24);const v=g.frontier.overview();
  A.render(g,v);write(name,{poi:p.id,type:p.type,z,inside,position:q,angle:p.a,geometry:{w:p.w,h:p.h},entries:A.depthEntries(g,v,{l:v.x-35,r:v.x+35,t:v.y-25,b:v.y+25}).map(e=>({kind:e.kind,id:e.id,depth:e.depth}))});
 }
 const industry=w.pois.find(p=>p.type==='generatorRoom');assert.ok(industry);capture(industry,0,null,'region-industrial-roof');capture(industry,0,industry.id,'region-industrial-interior');
 const house=w.pois.find(p=>p.type==='basementHouse');assert.ok(house);capture(house,0,null,'region-house-roof');capture(house,-1,house.id,'region-basement');
 const materialCanvas=createCanvas(1280,700),mc=materialCanvas.getContext('2d');mc.fillStyle='#25332b';mc.fillRect(0,0,1280,700);
 const materials=[];
 for(const [i,[key,tile]]of [['art138RoofMetal',8],['art138InteriorConcrete',3]].entries()){
  if(!g.art.images[key])continue;mc.save();mc.translate(i*640+20,20);mc.scale(288/tile,288/tile);globalThis.DeadwallAssets136.drawSurface138(mc,g.art,key,0,0,tile*2,tile*2,{tile,alpha:1});mc.restore();
  mc.fillStyle='#e4d8b9';mc.font='18px sans-serif';mc.fillText(key+' · 2 × 2 répétitions natives',i*640+20,640);materials.push({key,tileMetres:tile});
 }
 if(materials.length){const file=`qa138-${phase}-materials-repeat.png`;fs.writeFileSync(path.join(out,file),materialCanvas.toBuffer('image/png'));scenes.push({name:'materials-repeat',file,materials});}
 const meta={phase,seed:17117,prepared:true,browser:false,method:'Production Art.load, installed Art instance preserved, bootDocument134 HTML order, Game.render and DeadwallFrontierArt.render',assets:g.art.diagnostics.ready.length,failed:g.art.diagnostics.failed,draws:g.art.diagnostics.draws,scenes};fs.writeFileSync(path.join(out,`qa138-${phase}-visual.json`),JSON.stringify(meta,null,2)+'\n');return meta;
}
module.exports={run};if(require.main===module)run(process.argv[2]||'before').then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.stack);process.exitCode=1;});
