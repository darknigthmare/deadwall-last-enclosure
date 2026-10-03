'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{performance}=require('node:perf_hooks'),{createCanvas}=require('@napi-rs/canvas');
const {bootDocument134}=require('./qa-startup134.cjs');
const {g}=bootDocument134(),current=globalThis.DeadwallAtlasRender,currentField=globalThis.DeadwallFieldAtlasArt,baseline=process.argv[2];
if(!baseline)throw Error('Provide the unchanged 1.35 atlas-render.js for before/after measurement.');
vm.runInThisContext(fs.readFileSync(baseline,'utf8'),{filename:baseline});const old=globalThis.DeadwallAtlasRender;globalThis.DeadwallAtlasRender=current;vm.runInThisContext(fs.readFileSync(path.join(path.dirname(baseline),'field-atlas-art.js'),'utf8'),{filename:'baseline-field-atlas-art.js'});const oldField=globalThis.DeadwallFieldAtlasArt;
const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(1,1):create(tag);
const results=[];
for(const seed of[17117,84329,1]){
 g.startNew('standard',String(seed));g.campaignIntro132.skip();g.paused=true;
 const w=g.frontier.world(),v=g.frontier.overview();v.seen=w.pois.map(p=>p.id);
 const cam=globalThis.DeadwallAtlasProjection.camera(1440,960);cam.regionSize(w.size);cam.fit(w.size/2,w.size/2,w.size*1.04);
 const layers={terrain:true,roads:true,places:true,city:true,units:true,labels:true,gates:true,relays:false,routes:false,travelled:false,intelligence:true,tours:true};
 const runs={};for(const[name,painter]of[['before',old],['after',current]]){
  globalThis.DeadwallFieldAtlasArt=name==='before'?oldField:currentField;const canvas=createCanvas(1440,960),c=canvas.getContext('2d'),times=[];for(let i=0;i<7;i++){const t=performance.now();painter.render(c,g,v,cam,layers);times.push(performance.now()-t);}
  runs[name]={coldMs:times[0],warmMs:times.slice(1),medianWarmMs:times.slice(1).sort((a,b)=>a-b)[3],pixels:canvas.toBuffer('image/png'),raster:c.getImageData(0,0,1440,960).data};
 }
 const identical=runs.before.pixels.equals(runs.after.pixels);let changedChannels=0,maxChannelDelta=0,totalDelta=0;for(let i=0;i<runs.before.raster.length;i++){const delta=Math.abs(runs.before.raster[i]-runs.after.raster[i]);if(delta){changedChannels++;totalDelta+=delta;maxChannelDelta=Math.max(delta,maxChannelDelta);}}const rasterDifference={changedChannels,maxChannelDelta,meanChannelDelta:totalDelta/runs.before.raster.length};delete runs.before.raster;delete runs.after.raster;
 if(seed===17117){fs.writeFileSync('reports/1.36.0/atlas136-world.png',runs.after.pixels);fs.writeFileSync('reports/1.36.0/atlas136-world-before.png',runs.before.pixels);}
 delete runs.before.pixels;delete runs.after.pixels;results.push({seed,roads:w.roads.length,pois:w.pois.length,identicalPixels:identical,rasterDifference,...runs});
}
globalThis.DeadwallFieldAtlasArt=currentField;const result={method:'Actual Atlas render with native Canvas and simulated DOM; CPU timings, not browser FPS. Six warm samples per renderer.',results};fs.writeFileSync('reports/1.36.0/atlas136-profile.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
