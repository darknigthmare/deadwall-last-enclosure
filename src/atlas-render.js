/* Read-only drawings built from live geometry. No regenerated city or random draws. */
(function(root){'use strict';const P=root.DeadwallAtlasProjection||(typeof require==='function'?require('./atlas-projection.js'):null),C=root.DeadwallCore,R=P.RULES;
const overlap=(a,b)=>a.x+a.w>b.left&&a.x<b.right&&a.y+a.h>b.top&&a.y<b.bottom;
function buildingColor(b){if(!b.complete)return'#c4a368';if(b.underAttack)return'#c88364';if(b.type==='core')return'#e2c987';if(/wall|gate|spike|turret|tower|mirador/i.test(b.type))return'#a5b79a';if(/house|residence|apartment|habitat|townhouse/i.test(b.type))return'#b5b7a0';if(/hospital|clinic|medic/i.test(b.type))return'#99b8b0';if(/power|solar|generator|battery/i.test(b.type))return'#c2b681';return'#8fa79a';}
function getApproaches(context){return P.gatesFor(context).map(q=>{const angle=q.id==='east'?0:q.id==='south'?Math.PI/2:q.id==='west'?Math.PI:-Math.PI/2;return{id:'d17-'+q.id,a:{x:q.x,y:q.y},b:{x:q.x+Math.cos(angle)*12,y:q.y+Math.sin(angle)*12},width:132/R.unitsPerMetre};});}
function approaches(c,context){const roads=getApproaches(context);if(root.DeadwallRoadKit?.drawNetwork)return root.DeadwallRoadKit.drawNetwork(c,roads);for(const road of roads)drawRoad(c,road,1);}
function drawHomeScene(c,g,local){
 g.drawGround(c,local);
 for(const corpse of g.corpses||[])if(g.visible(corpse.x,corpse.y,25,local))g.drawCorpse(c,corpse);
 // Use exactly the same queue and painters as local play, including extension entries.
 for(const entry of g.depthEntries(local)){
  if(typeof entry.draw==='function')entry.draw(c);
  else if(entry.kind===0)g.drawNode(c,entry.entity);
  else if(entry.kind===1)g.drawBuilding(c,entry.entity);
  else if(entry.kind===2)g.drawUnit(c,entry.entity);
  else if(entry.kind===3)g.drawZombie(c,entry.entity);
  else if(entry.kind===5)g.territories?.drawTruck(c,entry.entity);
  else if(entry.kind===6)root.DeadwallExpeditionArt?.car(c,entry.entity);
  else if(!g.player.regionAbsent&&!g.frontier?.active())g.drawPlayer(c);
 }
 for(const particle of g.particles||[])if(g.visible(particle.x,particle.y,20,local))g.drawParticle(c,particle);
 for(const projectile of g.projectiles||[])if(!projectile.dead&&g.visible(projectile.x,projectile.y,20,local))g.drawProjectile(c,projectile);

}

function drawHome(c,g,opts={}){const h=P.home(g),scale=opts.scale||1,view=opts.view||{left:h.minX,top:h.minY,right:h.maxX,bottom:h.maxY},m=opts.model||P.model(g);if(!overlap(m.bounds,view))return;c.save();c.beginPath();c.rect(h.minX,h.minY,h.size,h.size);c.clip();
if(opts.world){const a=P.toLocal(Math.max(h.minX,view.left),Math.max(h.minY,view.top),g),b=P.toLocal(Math.min(h.maxX,view.right),Math.min(h.maxY,view.bottom),g),local={left:a.x,top:a.y,right:b.x,bottom:b.y,homeProjection:true};c.translate(h.minX,h.minY);c.scale(1/R.unitsPerMetre,1/R.unitsPerMetre);drawHomeScene(c,g,local);c.restore();}
else{if(!(opts.terrainWorld?.generation>=6)){c.fillStyle='#293c31';c.fillRect(h.minX,h.minY,h.size,h.size);}c.save();c.translate(h.minX,h.minY);const mapped=g.exploration125?.drawMap?.(c,1/R.unitsPerMetre,1/R.unitsPerMetre,{resources:opts.resources!==false});c.restore();if(!mapped){c.fillStyle='#797c68';const w=132/R.unitsPerMetre;c.fillRect(h.minX,h.y-w/2,h.size,w);c.fillRect(h.x-w/2,h.minY,w,h.size);}c.save();c.translate(h.minX,h.minY);c.scale(1/R.unitsPerMetre,1/R.unitsPerMetre);g.infrastructure?.drawRoads(c,{left:0,top:0,right:4096,bottom:4096});c.restore();
if(!mapped&&scale>1.5&&opts.resources!==false){c.globalAlpha=.52;for(const n of g.world.nodes){if(n.depleted)continue;const q=P.toRegion(n.x,n.y,g);if(q.x<view.left||q.x>view.right||q.y<view.top||q.y>view.bottom)continue;const r=Math.max(.18,n.radius/R.unitsPerMetre);c.fillStyle=n.type==='wood'?'#5f7959':n.type==='stone'?'#9ba08c':'#9b927a';c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
for(const b of m.buildings){if(!overlap(b,view))continue;c.fillStyle=buildingColor(b);c.fillRect(b.x,b.y,b.w,b.h);if(scale>1){c.strokeStyle=b.complete?'#233d31':'#ead7a6';c.lineWidth=Math.min(.12,1/scale);if(!b.complete)c.setLineDash([.3,.25]);c.strokeRect(b.x,b.y,b.w,b.h);c.setLineDash([]);if(!b.powered&&b.source.def.powerUse){c.fillStyle='#b08c57';c.fillRect(b.x,b.y,Math.min(b.w,.4),Math.min(b.h,.4));}}}
if(opts.units!==false&&scale>2){c.fillStyle='#d0d6bb';for(const u of m.units){c.beginPath();c.arc(u.x,u.y,.22,0,Math.PI*2);c.fill();}}c.restore();}
// This is a domain boundary, not an invented physical wall.
c.save();c.strokeStyle='#c1b588';c.lineWidth=Math.min(.22,1.25/scale);c.setLineDash([1.2,.65]);c.strokeRect(h.minX,h.minY,h.size,h.size);c.setLineDash([]);c.restore();}
function terrain(c,v,cam){const bounds=cam.bounds();if(root.DeadwallGround135?.draw(c,v.world,bounds,{scale:cam.scale,map:true}))return;const step=cam.scale<.06?512:cam.scale<.2?160:cam.scale<1?48:cam.scale<4?16:4,G=root.DeadwallFrontierGeometry;c.fillStyle='#263d2d';c.fillRect(0,0,v.world.size||8192,v.world.size||8192);for(let y=Math.max(0,Math.floor(bounds.top/step)*step);y<Math.min(v.world.size||8192,bounds.bottom);y+=step)for(let x=Math.max(0,Math.floor(bounds.left/step)*step);x<Math.min(v.world.size||8192,bounds.right);x+=step){const n=G.noise(v.world.seed^7931,x,y,310)*.7+G.noise(v.world.seed^9981,x,y,74)*.3;c.fillStyle=`rgba(117,132,83,${Math.max(.05,.31-n*.32)})`;c.fillRect(x,y,step+.02,step+.02);}if(cam.scale>=2){c.globalAlpha=.5;const r=Math.max(cam.width,cam.height)/cam.scale/2+8;for(const chunk of v.world.around(cam.x,cam.y,r))for(const t of [...chunk.trees,...chunk.rocks]){if((v.taken[t.id]||0)>=t.amount)continue;c.fillStyle=t.kind==='rock'?'#9da28c':'#466b47';c.beginPath();c.arc(t.x,t.y,t.kind==='tree'?t.canopy*.65:t.r,0,Math.PI*2);c.fill();}c.globalAlpha=1;}}
function drawRoad(c,rd,s){c.lineCap='round';c.strokeStyle='#777e68';c.lineWidth=Math.max(rd.width+1,1.8/s);c.beginPath();c.moveTo(rd.a.x,rd.a.y);c.lineTo(rd.b.x,rd.b.y);c.stroke();c.strokeStyle='#9f9d80';c.lineWidth=Math.max(rd.width,1/s);c.stroke();}
// One viewport per destination canvas. Only immutable road geometry is cached;
// discoveries invalidate driveways while the rest of the map stays live.
const roadRasters=new WeakMap();
function mapRoads(c,g,v,cam,layers,seen){
 const s=cam.scale,view=cam.bounds(),draw=ctx=>{const roads=[...v.world.roads,...(layers.city?getApproaches(g):[]),...(layers.places&&s>.5?v.world.pois.filter(p=>seen.has(p.id)).map(p=>p.drive).filter(Boolean):[])];if(root.DeadwallRoadKit?.drawNetwork)root.DeadwallRoadKit.drawNetwork(ctx,roads,{view:{l:view.left,r:view.right,t:view.top,b:view.bottom},scale:s,minWidth:1,markings:false,shoulder:'#777e68',surface:'#9f9d80'});else for(const rd of roads)drawRoad(ctx,rd,s);};
 const transform=c.getTransform?.(),dpr=transform&&Math.hypot(transform.a,transform.b)/s;
 if(!c.canvas||!Number.isFinite(dpr)||dpr<=0||typeof c.drawImage!=='function'){draw(c);return;}
 const key=[cam.x,cam.y,s,cam.width,cam.height,dpr,!!layers.city,layers.places&&s>.5?v.seen.join('|'):''].join(':');
 let entry=roadRasters.get(c.canvas);
 if(!entry||entry.world!==v.world||entry.key!==key){
  const bitmap=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(Math.ceil(cam.width*dpr),Math.ceil(cam.height*dpr)):root.document?.createElement?.('canvas');
  const ctx=bitmap?.getContext?.('2d');if(!ctx||typeof ctx.setTransform!=='function'){draw(c);return;}
  bitmap.width=Math.ceil(cam.width*dpr);bitmap.height=Math.ceil(cam.height*dpr);
  ctx.setTransform(dpr*s,0,0,dpr*s,dpr*(cam.width/2-cam.x*s),dpr*(cam.height/2-cam.y*s));draw(ctx);
  entry={world:v.world,key,bitmap};roadRasters.set(c.canvas,entry);
 }
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(entry.bitmap,0,0);c.restore();
}
function labelBounds(textWidth,x,y,width,height,reserved=[],used=[],priority=false){
 if(!Number.isFinite(textWidth)||textWidth+12>width-16||x<0||x>width||y<21||y>height-13)return null;
 const w=textWidth+12,r={x:Math.max(8,Math.min(width-w-8,x-w/2)),y:y-13,w,h:18};
 const intersects=q=>r.x<q.x+q.w&&r.x+r.w>q.x&&r.y<q.y+q.h&&r.y+r.h>q.y;
 if(reserved.some(intersects)||!priority&&used.some(intersects))return null;return r;
}
const ecologyLabels=new WeakMap();
function biomeLabels(world,cam){
 if(!world.biomeAt||world.generation<6||cam.scale>.5)return [];
 const key=[cam.x,cam.y,cam.scale,cam.width,cam.height].join(':');let cache=ecologyLabels.get(world);if(cache?.key===key)return cache.labels;
 const candidates=new Map(),bounds=cam.bounds();
 for(let row=0;row<5;row++)for(let col=0;col<6;col++){
  const x=bounds.left+(col+.5)/6*(bounds.right-bounds.left),y=bounds.top+(row+.5)/5*(bounds.bottom-bounds.top);
  if(x<0||y<0||x>world.size||y>world.size)continue;const biome=world.biomeAt(x,y);if(!biome)continue;
  const score=Math.hypot((x-cam.x)/(bounds.right-bounds.left),(y-cam.y)/(bounds.bottom-bounds.top))+(biome.blend||0)*.2,previous=candidates.get(biome.id);
  if(!previous||score<previous.score)candidates.set(biome.id,{id:biome.id,text:biome.name,x,y,score,color:biome.palette?.accent||'#b6c9a4'});
 }
 const labels=[...candidates.values()].sort((a,b)=>a.score-b.score);ecologyLabels.set(world,{key,labels});return labels;
}
function render(c,g,v,cam,layers,selected=null){const vision=g.visibility?.frame?.(),width=cam.width,height=cam.height,s=cam.scale,view=cam.bounds(),G=root.DeadwallFrontierGeometry,m=P.model(g),seen=new Set(v.seen);c.clearRect(0,0,width,height);c.fillStyle='#101e18';c.fillRect(0,0,width,height);c.save();c.translate(width/2,height/2);c.scale(s,s);c.translate(-cam.x,-cam.y);c.beginPath();c.rect(0,0,v.world.size||8192,v.world.size||8192);c.clip();if(layers.terrain)terrain(c,v,cam);else{c.fillStyle='#1e3426';c.fillRect(0,0,v.world.size||8192,v.world.size||8192);}
if(layers.travelled&&g.fieldAtlas){const visited=g.fieldAtlas.travelled(),cell=C.FieldAtlas.RULES.cell;for(let y=Math.max(0,Math.floor(view.top/cell));y<Math.min((v.world.size||8192)/cell,Math.ceil(view.bottom/cell));y++)for(let x=Math.max(0,Math.floor(view.left/cell));x<Math.min((v.world.size||8192)/cell,Math.ceil(view.right/cell));x++){c.fillStyle=visited.has(C.FieldAtlas.cell(x*cell,y*cell))?'rgba(133,185,151,.13)':'rgba(8,16,14,.44)';c.fillRect(x*cell,y*cell,cell,cell);}}
if(layers.roads)mapRoads(c,g,v,cam,layers,seen);
if(layers.places)for(const p of v.world.pois){if(!seen.has(p.id)||p.x+p.w<view.left||p.x-p.w>view.right||p.y+p.h<view.top||p.y-p.h>view.bottom)continue;if(s>.5){for(const cv of p.parking){c.save();c.translate(cv.x,cv.y);c.rotate(cv.a);c.fillStyle='#7e8e80';c.fillRect(-cv.w/2,-cv.h/2,cv.w,cv.h);c.restore();}}c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=v.notes[p.id]==='danger'?'#b78268':v.notes[p.id]==='cleared'?'#798b74':'#c1b997';if(p.w*s>5)c.fillRect(-p.w/2,-p.h/2,p.w,p.h);else c.fillRect(-2.5/s,-2.5/s,5/s,5/s);c.strokeStyle='#e9d5a1';c.lineWidth=1/s;if(selected?.kind==='poi'&&selected.id===p.id||v.pin===p.id)c.strokeRect(-p.w/2-2/s,-p.h/2-2/s,p.w+4/s,p.h+4/s);c.restore();}
if(layers.city){drawHome(c,g,{model:m,scale:s,view,resources:layers.terrain,units:layers.units,terrainWorld:layers.terrain?v.world:null});}
if(selected?.kind==='building'){const b=m.buildings.find(b=>b.id===selected.id);if(b){c.strokeStyle='#ffda91';c.lineWidth=2/s;c.strokeRect(b.x-1/s,b.y-1/s,b.w+2/s,b.h+2/s);}}
if(layers.routes){const path=g.frontier.guidance()?.path;if(path){c.strokeStyle='#ebca83';c.lineWidth=2.4/s;c.setLineDash([7/s,4/s]);c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([]);}}
const back=layers.routes?g.returnRoutes?.overlay():null;if(back){if(back.regionalPath?.length){c.strokeStyle='#8eb9ad';c.lineWidth=2/s;c.setLineDash([6/s,5/s]);c.beginPath();back.regionalPath.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}c.strokeStyle='#86d2c8';c.lineWidth=2.5/s;c.setLineDash([]);c.beginPath();back.path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();for(const p of [back.path[0],back.path.at(-1)]){c.fillStyle='#b1e6d6';c.beginPath();c.arc(p.x,p.y,3.5/s,0,Math.PI*2);c.fill();}}
c.restore();
root.DeadwallFieldAtlasArt?.draw(c,g,v,cam,layers);
if(selected?.kind==='terrain'){const q=cam.screen(selected.x,selected.y);if(q.x>=0&&q.y>=0&&q.x<=width&&q.y<=height){c.strokeStyle='#eddb9e';c.lineWidth=1.5;c.beginPath();c.arc(q.x,q.y,7,0,Math.PI*2);c.moveTo(q.x-11,q.y);c.lineTo(q.x-4,q.y);c.moveTo(q.x+4,q.y);c.lineTo(q.x+11,q.y);c.moveTo(q.x,q.y-11);c.lineTo(q.x,q.y-4);c.moveTo(q.x,q.y+4);c.lineTo(q.x,q.y+11);c.stroke();}}
// Labels and symbols have screen-space sizes; footprints above remain metric.
const bar=P.scaleBar(s,Math.min(150,width*.25)),legendWidth=Math.min(234,width-78),reserved=[{x:10,y:height-43,w:bar.pixels+22,h:36},{x:width-58,y:8,w:50,h:25},{x:10,y:8,w:legendWidth,h:20}],used=[];function label(text,x,y,priority=false,color='#c5d1b4'){c.font='12px system-ui, sans-serif';const r=labelBounds(c.measureText(text).width,x,y,width,height,reserved,used,priority);if(!r)return;used.push(r);c.fillStyle='rgba(14,30,22,.9)';c.fillRect(r.x,r.y,r.w,r.h);c.fillStyle=color;c.textAlign='center';c.fillText(text,r.x+r.w/2,y);}

const core=cam.screen(m.core.x,m.core.y);if(layers.city)label(s>1?'D-17 · '+R.homeSize+' × '+R.homeSize+' m':'D-17',core.x,core.y-12,true,'#eddbac');
if(layers.labels){for(const town of v.world.towns){const q=cam.screen(town.x,town.y);label(town.name,q.x,q.y-12,false);}if(s>.18)for(const p of v.world.pois)if(seen.has(p.id)){const q=cam.screen(p.x,p.y);label(p.name,q.x,q.y-p.h*s/2-8,false);}}
if(layers.biomes)for(const b of biomeLabels(v.world,cam)){const q=cam.screen(b.x,b.y);label(b.text,q.x,q.y,false,b.color);}
if(layers.gates&&s>.35){for(const gate of m.gates){const q=cam.screen(gate.x,gate.y);c.fillStyle=gate.foot&&gate.car?'#a4c19a':gate.foot?'#d0ad66':'#be7a64';c.fillRect(q.x-4,q.y-4,8,8);if(s>1)label(gate.name+(gate.car?'':' · accès contraint'),q.x,q.y+21,false);}}
if(layers.relays&&g.fieldSupplies){for(const cache of g.fieldSupplies.snapshot().caches){const b=C.FieldSupplies.resolve(v.world,cache.id);if(!b)continue;const q=cam.screen(b.x,b.y);c.strokeStyle='#d6c48d';c.lineWidth=1.5;c.strokeRect(q.x-4,q.y-4,8,8);if(s>1)label('Relais · '+C.bagTotal(cache.stock).toFixed(0)+'/60',q.x,q.y-10,false);}}
const marked=new Set(),level=v.active?v.z:0;
for(const contact of [...(v.enemies||[]),...(g.succession133?.contacts?.()||[])])if(!marked.has(contact.id)&&contact.z===level&&vision?.canSeeRegional(contact)){marked.add(contact.id);const q=cam.screen(contact.x,contact.y);c.fillStyle='#cb8270';c.beginPath();c.arc(q.x,q.y,2.5,0,Math.PI*2);c.fill();}
if(layers.city&&level===0)for(const contact of g.zombies||[])if(vision?.canSeeLocal(contact)){const p=P.toRegion(contact.x,contact.y,g),q=cam.screen(p.x,p.y);c.fillStyle='#cb8270';c.beginPath();c.arc(q.x,q.y,2.5,0,Math.PI*2);c.fill();}
root.DeadwallWorldEvolutionArt?.atlas(c,g,v,cam,label,vision,marked);const player=P.playerPosition(g,v),q=cam.screen(player.x,player.y);c.save();c.translate(q.x,q.y);c.rotate(v.active?v.a:g.player.facing);c.fillStyle='#fff0bf';c.beginPath();c.moveTo(7,0);c.lineTo(-5,-4);c.lineTo(-3,0);c.lineTo(-5,4);c.closePath();c.fill();c.restore();
const cv=v.car||(g.expeditions.car()&&!g.expeditions.car().regionAway?{...g.expeditions.car(),...P.toRegion(g.expeditions.car().x,g.expeditions.car().y,g)}:null);if(cv){const q=cam.screen(cv.x,cv.y);c.strokeStyle='#dec68d';c.lineWidth=1.5;c.strokeRect(q.x-5,q.y-3,10,6);}
if(layers.units&&!v.active&&s>.5){const a=P.toRegion(g.camera.x-g.width/g.camera.zoom/2,g.camera.y-g.height/g.camera.zoom/2,g),b=P.toRegion(g.camera.x+g.width/g.camera.zoom/2,g.camera.y+g.height/g.camera.zoom/2,g),aa=cam.screen(a.x,a.y),bb=cam.screen(b.x,b.y);c.strokeStyle='rgba(220,226,187,.38)';c.lineWidth=1;c.setLineDash([4,4]);c.strokeRect(aa.x,aa.y,bb.x-aa.x,bb.y-aa.y);c.setLineDash([]);}
c.fillStyle='rgba(10,24,16,.9)';c.fillRect(10,height-43,bar.pixels+22,36);c.strokeStyle='#e0d7b6';c.lineWidth=2;c.beginPath();c.moveTo(20,height-25);c.lineTo(20+bar.pixels,height-25);c.stroke();c.fillStyle='#e0d7b6';c.font='12px system-ui';c.textAlign='left';c.fillText(bar.label,20,height-10);c.textAlign='right';c.fillStyle='#bcc6a6';c.fillText('N ↑',width-18,25);c.fillStyle='rgba(10,24,16,.9)';c.fillRect(10,8,legendWidth,20);c.fillStyle='#cb8270';c.fillRect(16,16,4,4);c.fillStyle='#e0d7b6';c.font='10px system-ui';c.textAlign='left';c.fillText('CONTACTS OBSERVÉS · '+(level<0?'SOUS-SOL':level>0?'ÉTAGE '+level:'RDC'),26,22,legendWidth-22);return{model:m,bar,player};}
root.DeadwallAtlasRender={render,drawHome,drawHomeScene,buildingColor,approaches,getApproaches,mapRoads,labelBounds,biomeLabels};if(typeof module!=='undefined'&&module.exports)module.exports=root.DeadwallAtlasRender;
})(globalThis);
