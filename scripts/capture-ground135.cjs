'use strict';
// Native Canvas render of production painters. Specimen staging is explicitly labelled.
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const B=require('../src/biomes135.js'),D=require('../src/ground135.js');
global.document={createElement:()=>createCanvas(1,1)};
const seed=17117,found={};for(let y=512;y<24000;y+=512)for(let x=512;x<24000;x+=512){const p=B.sample(seed,x,y);if(!found[p.id])found[p.id]={x,y};}
const tiles=[],canvas=createCanvas(1600,1260),c=canvas.getContext('2d');c.fillStyle='#18241d';c.fillRect(0,0,1600,1260);c.fillStyle='#e9dbb6';c.font='20px sans-serif';c.fillText('SOLS RÉELS G6 · graine 17117 · spécimens d’arbres et de rochers mis en scène',20,28);c.font='13px sans-serif';c.fillText('Peintres Canvas du jeu ; DOM simulé. Chaque vignette représente 25 × 23 mètres dans le biome indiqué.',20,50);
for(let i=0;i<B.defs.length;i++){
 const d=B.defs[i],v=found[d.id];if(!v)throw Error('No real point found for '+d.id);
 const sx=i%4*400,sy=Math.floor(i/4)*400+60,w={seed,generation:6,biomeAt:(x,y)=>B.sample(seed,x,y)},view={l:v.x-12.5,r:v.x+12.5,t:v.y-11.5,b:v.y+11.5};
 c.save();c.beginPath();c.rect(sx,sy,400,370);c.clip();c.translate(sx+200,sy+185);c.scale(16,16);c.translate(-v.x,-v.y);D.draw(c,w,view,{scale:16});
 const tree=Object.keys(d.trees)[0],rock=Object.keys(d.rocks)[0];D.drawScenery(c,{id:'tree-'+i,x:v.x-5,y:v.y,r:.36,canopy:3.3,a:.8,kind:'tree',species:tree},{world:w,x:v.x,y:v.y},false);D.drawScenery(c,{id:'rock-'+i,x:v.x+5,y:v.y+2,r:1.1,a:.4,kind:'rock',species:rock},{world:w,x:v.x,y:v.y},false);
 const kinds=Object.keys(d.decor);for(let k=0;k<kinds.length;k++)D.drawDecor(c,{x:v.x-8+k*4,y:v.y+7,a:k*1.7,r:.6,kind:kinds[k],color:['pebbles','rubble'].includes(kinds[k])?d.palette.rock:d.palette.grass});
 c.restore();c.fillStyle='#eddcab';c.font='16px sans-serif';c.fillText(d.name,sx+15,sy+392);tiles.push({id:d.id,...v,tree,rock});
}
const out=path.resolve(__dirname,'../reports/1.35.0/captures');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'ground135-soils-gallery.png'),canvas.toBuffer('image/png'));fs.writeFileSync(path.join(out,'ground135-soils-gallery.json'),JSON.stringify({seed,renderer:'actual ground135 procedural Canvas; terrain sampling real; tree/rock specimens staged to compare painters, not gameplay screenshot',browser:false,tiles,cache:D.cacheInfo()},null,2));
console.log(JSON.stringify({out,biomes:tiles.length,cache:D.cacheInfo()}));
