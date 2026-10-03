'use strict';
// Actual runtime painters. Prepared states under a simulated DOM, never browser screenshots.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),root=path.resolve(__dirname,'..'),out=path.join(root,'reports/1.30.0/captures');
const {game:g}=require('../tests/helpers/expansions127.cjs').boot127(),Art=require('../src/art.js'),G=require('../src/frontier-geometry.js');
for(const name of['region-roadkit','atlas-render','essential-art','world-evolution-art','frontier-art'])require('../src/'+name+'.js');
const A=globalThis.DeadwallFrontierArt,canvas=createCanvas(1000,760),ctx=canvas.getContext('2d');g.ctx=ctx;g.width=1000;g.height=760;g.dpr=1;
const make=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):make(tag);
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();
(async()=>{
 await g.art.ready;for(const[key,spec]of Object.entries(Art.ASSETS)){const image=await loadImage(path.join(root,spec.url));if(['magenta','neutral'].includes(spec.matte)){const bitmap=createCanvas(image.width,image.height),c=bitmap.getContext('2d');c.drawImage(image,0,0);const data=c.getImageData(0,0,image.width,image.height);Art.decodeMatte(data.data,image.width,image.height,spec.matte);c.putImageData(data,0,0);g.art.images[key]=bitmap;const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(data.data,image.width,r);}else g.art.images[key]=image;}
 g.startNew('standard','17117');g.phaseTime=9999;g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 const world=g.frontier.world();let selected;
 for(const poi of world.pois.filter(p=>p.type==='duplex')){const plan=world.plan(poi,0);for(const o of plan.objects){if(o.w<1.5||o.h<.6)continue;const north=G.global(poi,o.x+o.w/2,o.y-.43),south=G.global(poi,o.x+o.w/2,o.y+o.h+.43);if(!world.blocked(north.x,north.y,.32,0,poi.id)&&!world.blocked(south.x,south.y,.32,0,poi.id)){selected={poi,o,north,south};break;}}if(selected)break;}
 assert.ok(selected,'two traversable sides of real furniture');const {poi,o,north,south}=selected,base=g.serialize(),evidence=[];
 function pose(point,z,inside){const save=JSON.parse(JSON.stringify(base));Object.assign(save.frontier,point,{z,inside,seen:[...new Set([...save.frontier.seen,poi.id])],a:0});g.restoreSave(save);g.dayClock=.44;g.weather=0;g.paused=true;g.frontier.scale(44);return g.frontier.overview();}
 function shot(name,v,label){A.render(g,v);ctx.fillStyle='rgba(12,22,19,.9)';ctx.fillRect(0,0,1000,44);ctx.fillStyle='#e9d5a3';ctx.font='18px sans-serif';ctx.textAlign='left';ctx.fillText(label,18,28);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));const view={l:v.x-12,r:v.x+12,t:v.y-9,b:v.y+9};evidence.push({file:name+'.png',position:{x:v.x,y:v.y,z:v.z,inside:v.inside},queue:A.depthEntries(g,v,view).map(e=>({kind:e.kind,id:e.id,depth:e.depth}))});}
 shot('plans-interieur-arriere-130',pose(north,0,poi.id),'Intérieur réel · commandant derrière le meuble');
 shot('plans-interieur-avant-130',pose(south,0,poi.id),'Intérieur réel · commandant devant le meuble');
 let upstairs;for(let y=1;y<poi.h-1&&!upstairs;y+=.5)for(let x=1;x<poi.w-1&&!upstairs;x+=.5){const q=G.global(poi,x,y);if(!world.blocked(q.x,q.y,.32,1,poi.id))upstairs=q;}assert.ok(upstairs);shot('plans-etage-130',pose(upstairs,1,poi.id),'Étage 1 · aucun véhicule, toit ni arbre du rez-de-chaussée');
 const parking=poi.parking[0];assert.ok(parking);let point;for(const offset of[2,3,4,-2,-3,-4]){const q={x:parking.x,y:parking.y+offset};if(!world.blocked(q.x,q.y,.32,0,null)){point=q;break;}}assert.ok(point);shot('plans-exterieur-130',pose(point,0,null),'Extérieur réel · voitures, infectés et personnage dans la profondeur commune');
 const benchDepth=A.rectDepth(poi,o);assert.ok(evidence[0].queue.some(e=>e.id===o.id));
 fs.writeFileSync(path.join(out,'spatial130.json'),JSON.stringify({renderer:'DeadwallFrontierArt.render — native Canvas, simulated DOM',browser:false,prepared:true,seed:17117,furniture:{poi:poi.id,id:o.id,depth:benchDepth},captures:evidence},null,2));console.log(JSON.stringify({out,files:evidence.map(e=>e.file),poi:poi.id}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
