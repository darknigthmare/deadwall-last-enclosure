'use strict';
// Genuine game painters and completed actions under the project's simulated DOM.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/1.31.0/captures');
const {game:g}=require('../tests/helpers/expansions127.cjs').boot127();
const C=require('../src/core.js'),Art=require('../src/art.js'),G=require('../src/frontier-geometry.js'),S=require('../src/frontier-survey.js');
require('../src/exploration-pack131.js').install(g);require('../src/world-pack131.js').install(g);
for(const name of ['region-roadkit','atlas-render','essential-art','world-evolution-art','frontier-art'])require('../src/'+name+'.js');
const A=globalThis.DeadwallFrontierArt,canvas=createCanvas(1040,720),ctx=canvas.getContext('2d');g.ctx=ctx;g.width=1040;g.height=720;g.dpr=1;
const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();
function setup(){g.startNew('standard','17117');g.phase='calm';g.phaseTime=9999;g.dayClock=.44;g.weather=0;g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());g.frontier.scale(44);}
function photo(file,label){g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;A.reset();A.render(g,g.frontier.overview());ctx.fillStyle='rgba(13,23,20,.92)';ctx.fillRect(0,0,1040,44);ctx.fillStyle='#eed7a0';ctx.font='17px sans-serif';ctx.textAlign='left';ctx.fillText(label,16,28);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));}
function tick(seconds){for(let i=0;i<Math.ceil(seconds/.04);i++)g.travel131.step(.04);}
(async()=>{
 await g.art.ready;for(const[key,spec]of Object.entries(Art.ASSETS)){const image=await loadImage(path.join(root,spec.url));if(['magenta','neutral'].includes(spec.matte)){const bitmap=createCanvas(image.width,image.height),c=bitmap.getContext('2d');c.drawImage(image,0,0);const pixels=c.getImageData(0,0,image.width,image.height);Art.decodeMatte(pixels.data,image.width,image.height,spec.matte);c.putImageData(pixels,0,0);g.art.images[key]=bitmap;const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(pixels.data,image.width,r);}else g.art.images[key]=image;}
 setup();const world=g.frontier.world();let wreck;
 for(const p of world.pois){for(const v of p.parking.filter(v=>['compact','break','van','truck'].includes(v.type))){for(const side of [-1,1]){const q=G.global(v,v.w/2,side<0?-.75:v.h+.75);if(world.blocked(q.x,q.y,.32,0,null)||!world.line(q,S.edge(q,v),0,null,v.id,.025))continue;const raw=g.serialize();Object.assign(raw.frontier,{x:q.x,y:q.y,z:0,inside:null,seen:[p.id],a:v.a});raw.frontier.taken[v.id]=v.amount;g.restoreSave(raw);g.player.carry.scrap=1;if(g.travel131.preview('dismantle',v.id).ok){wreck=v;break;}}if(wreck)break;}if(wreck)break;}
 assert.ok(wreck);photo('voyage-epave-avant-131.png','Épave fouillée · le coffre est ouvert, la mécanique reste récupérable');let jobs=0;
 while(g.travel131.wreckStatus(wreck.id).remaining){for(const key of C.RESOURCE_KEYS)g.player.carry[key]=0;g.player.carry.scrap=1;assert.ok(g.travel131.begin('dismantle',wreck.id).ok);tick(C.Travel131Rules.dismantleSeconds);jobs++;}
 photo('voyage-epave-apres-131.png','Mécanique épuisée · capot ouvert, compartiment démonté, prélèvement persistant');
 const record=g.travel131.snapshot();let point=null;
 for(let x=12000;x<12400&&!point;x+=16)for(let y=12000;y<12400&&!point;y+=16){if(world.blocked(x,y,.32,0,null)||world.blocked(x+1.7,y,1.1,0,null))continue;const raw=g.serialize();Object.assign(raw.frontier,{x,y,z:0,inside:null,a:0});g.restoreSave(raw);Object.assign(g.player.carry,{wood:12,scrap:6});if(g.survivalPack.preview('camp').ok)point={x,y};}
 assert.ok(point);assert.ok(g.survivalPack.begin('camp').ok);for(let i=0;i<175;i++)g.survivalPack.step(.04);const camp=g.survivalPack.snapshot().camps[0];assert.ok(camp.x>8192);
 photo('voyage-halte-lointaine-131.png','Halte réelle à '+Math.floor(camp.x)+' m / '+Math.floor(camp.y)+' m · génération 5');
 const evidence={renderer:'DeadwallFrontierArt.render / native Canvas under simulated DOM',browser:false,prepared:true,seed:17117,generation:world.generation,size:world.size,wreck:{id:wreck.id,jobs,record},camp,files:['voyage-epave-avant-131.png','voyage-epave-apres-131.png','voyage-halte-lointaine-131.png']};fs.writeFileSync(path.join(out,'travel131.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({out,...evidence}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
