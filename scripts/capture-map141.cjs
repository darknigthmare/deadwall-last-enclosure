'use strict';
// Actual atlas painters and projection under the shipped script order; simulated DOM, native Canvas.
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const source=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=path.resolve(process.argv[3]||'reports/1.41.0'),prefix=process.argv[4]||'map141';fs.mkdirSync(out,{recursive:true});
const {bootDocument134}=require(path.join(source,'scripts/qa-startup134.cjs')),{g,doc}=bootDocument134(),create=doc.createElement.bind(doc);
const records=[];
for(const seed of [17117,84329]){
 g.startNew('standard',String(seed));g.campaignIntro132.skip();if(process.argv[5])require('../tests/helpers/generation141.cjs').legacy(g,Number(process.argv[5]));g.paused=true;doc.getElementById('reconPanel').classList.remove('hidden');g.frontierUI.refresh(true);
 const atlas=g.frontierUI.atlas,w=g.frontier.world(),v=g.frontier.overview();
 const capture=(suffix)=>{const p=atlas.position(),cam=globalThis.DeadwallAtlasProjection.camera(p.width,p.height);cam.regionSize(w.size);cam.set(p.x,p.y,p.zoom);const bitmap=createCanvas(p.width,p.height),c=bitmap.getContext('2d');doc.createElement=tag=>tag==='canvas'?createCanvas(1,1):create(tag);let result;try{result=globalThis.DeadwallAtlasRender.render(c,g,v,cam,atlas.layers(),atlas.selected());}finally{doc.createElement=create;}const file=prefix+'-'+seed+'-'+suffix+'.png';fs.writeFileSync(path.join(out,file),bitmap.toBuffer('image/png'));records.push({file,seed,generation:w.generation,size:w.size,home:w.home,camera:p,bounds:cam.bounds(),selected:atlas.selected(),seen:v.seen.length,layers:atlas.layers(),scaleBar:result.bar,biomeLabels:atlas.layers().biomes?globalThis.DeadwallAtlasRender.biomeLabels(w,cam).map(b=>b.text):[]});};
 capture('first');
 atlas.fit();const layer=doc.getElementById('atlasLayer-biomes');if(doc.body.contains(layer)){layer.checked=true;layer.dispatch('change');}capture('whole');
 atlas.city();capture('home');
}
const report={method:'Actual Canvas atlas renderer under complete shipped HTML script order and simulated DOM. No browser CSS, touch hardware or GPU claim.',source,records};fs.writeFileSync(path.join(out,prefix+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
