(function(root){'use strict';
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
const COMPANION_ART=Object.freeze({
 lea:Object.freeze({kind:'workerAlt',id:0}),
 samir:Object.freeze({kind:'medic',id:1}),
 ines:Object.freeze({kind:'engineer',id:2}),
 malik:Object.freeze({kind:'soldier',id:3})
});
const ANNEX_ART=Object.freeze({housing:'house',workshop:'workshop',clinic:'clinic',depot:'warehouse',watch:'watchtower',power:'generator'});
function drawAnnex(c,g,b,x,y){
 const art=g.art,rect=art?.rects?.['buildings:'+ANNEX_ART[b.type]],ready=b.progress>=1&&rect&&art?.images?.buildings&&typeof art.blit==='function';
 c.fillStyle=b.progress>=1?(ready?'#4b584b':'#768b72'):'#8b765a';c.fillRect(x,y,20,9);
 if(b.progress<1){c.fillStyle='#d5bd82';c.fillRect(x,y+9,20*b.progress,.55);return;}
 if(!ready)return;
 // The paid foundation remains 20×9 m. Fit the original alpha-trimmed image
 // without stretching it; its lower edge stays on the foundation's contact.
 const scale=Math.min(20/rect[2],13/rect[3]),w=rect[2]*scale,h=rect[3]*scale;
 art.blit(c,'buildings',rect,x+(20-w)/2,y+9-h,w,h);
}
const presentations=new WeakMap(),ACTOR_MARGIN=1.25;
function presentation(g,p){
 let state=presentations.get(g);
 if(!state||state.world!==g.world||state.player!==g.player){state={world:g.world,player:g.player,actors:new Map()};presentations.set(g,state);}
 let entry=state.actors.get(p.id);
 if(!entry){entry={proxy:{id:COMPANION_ART[p.id].id},sample:null};state.actors.set(p.id,entry);}
 const before=entry.sample,time=Number.isFinite(g.elapsed)?g.elapsed:0,dt=before?time-before.time:0;
 const distance=before?Math.hypot(p.x-before.x,p.y-before.y):0;
 const same=before&&before.z===p.z&&before.inside===(p.inside??null)&&before.riding===!!p.riding;
 const active=g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay;
 const speed=root.DeadwallCore?.WorldEvolution?.RULES?.companionRules?.speed||0;
 // Observe real regional displacement. Repeated paints do not advance a walk;
 // scene changes, jumps and pauses never borrow the previous movement cycle.
 const moving=!!(active&&same&&(dt===0&&distance<1e-8?before.moving:
  dt>0&&dt<=.25&&distance>1e-5&&distance<=speed*dt+1e-6));
 entry.sample={x:p.x,y:p.y,z:p.z,inside:p.inside??null,riding:!!p.riding,time,moving};
 Object.assign(entry.proxy,{x:p.x*32,y:p.y*32,facing:Number.isFinite(p.a)?p.a:0,health:p.health,
  visualMoving:moving,visualMotionReset:!moving});
 return entry.proxy;
}
function underClosedRoof(g,p,v){
 if(v.z!==0)return false;
 const places=v.world?.nearPOI?.(p.x,p.y,2)||[];
 for(const place of places){
  if(place.id===v.inside||place.type==='ruin'||g.worldEvolution?.structureDestroyed?.(place.id))continue;
  const q=G.local(place,p.x,p.y);
  if(q.x>0&&q.y>0&&q.x<place.w&&q.y<place.h)return true;
 }
 return false;
}
function drawCompanions(c,g,v,view,companions){
 const present=new Set();
 const members=companions.filter(p=>Object.hasOwn(COMPANION_ART,p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.health>0&&p.z===v.z&&!p.riding&&(v.z===0||p.inside===v.inside)).sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));
 for(const p of members){
  present.add(p.id);const proxy=presentation(g,p);
  if(p.x<view.l-ACTOR_MARGIN||p.x>view.r+ACTOR_MARGIN||p.y<view.t-ACTOR_MARGIN||p.y>view.b+ACTOR_MARGIN||underClosedRoof(g,p,v))continue;
  c.save();c.scale(1/32,1/32);
  const rendered=g.art?.drawActor?.(c,proxy,COMPANION_ART[p.id].kind,g.elapsed,!!g.settings?.reducedMotion,false);
  c.restore();
  if(!rendered){c.fillStyle=p.id==='malik'?'#c0aa7c':'#8fb39a';c.beginPath();c.arc(p.x,p.y,.34,0,Math.PI*2);c.fill();}
 }
 const state=presentations.get(g);if(state)for(const id of state.actors.keys())if(!present.has(id))state.actors.delete(id);
}

const enemyPresentations=new WeakMap();
function enemyKind(e){return ['runner','armored','crawler','breacher','stalker','howler','bloated'].includes(e.kind)?e.kind:'walkerAlt';}
function enemyPresentation(g,e){
 let state=enemyPresentations.get(g);if(!state||state.world!==g.world||state.player!==g.player){state={world:g.world,player:g.player,actors:new Map()};enemyPresentations.set(g,state);}
 let old=state.actors.get(e.id);if(!old){old={proxy:{id:G.hash(e.id)},sample:null};state.actors.set(e.id,old);}
 const previous=old.sample,time=g.elapsed||0,dt=previous?time-previous.time:0,d=previous?Math.hypot(e.x-previous.x,e.y-previous.y):0;
 const active=g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay,same=previous&&previous.z===e.z;
 const moving=!!(active&&same&&(dt===0&&d<1e-8?previous.moving:dt>0&&dt<=.25&&d>1e-5&&d<=3*dt+.001));
 old.sample={x:e.x,y:e.y,z:e.z,time,moving};Object.assign(old.proxy,{x:e.x*32,y:e.y*32,facing:e.a||0,health:e.hp??60,maxHealth:e.maxHealth??60,type:enemyKind(e),kind:enemyKind(e),visualUpright:true,visualMoving:moving,visualMotionReset:!moving});return old.proxy;
}
function drawInfected(c,g,v,view,members){
 const margin=root.DeadwallCore?.RegionContactRules?.visibleMargin||1.4;
 const sorted=members.filter(e=>e.z===v.z&&e.x>=view.l-margin&&e.x<=view.r+margin&&e.y>=view.t-margin&&e.y<=view.b+margin).sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));
 for(const e of sorted){
  const actor=enemyPresentation(g,e);if(!g.frontier.visibleEnemy(e)||underClosedRoof(g,e,v))continue;
  c.save();c.scale(1/32,1/32);const rendered=g.art?.drawActor?.(c,actor,actor.kind,g.elapsed,!!g.settings?.reducedMotion,false);c.restore();
  if(!rendered){c.fillStyle='#817766';c.beginPath();c.ellipse(e.x,e.y-.35,.24,.48,e.a||0,0,Math.PI*2);c.fill();}
 }
}
function drawEnemies(c,g,v,view){drawInfected(c,g,v,view,v.enemies||[]);const ids=new Set([...(v.enemies||[]),...(g.worldEvolution?.groupMembers?.()||[])].map(e=>e.id)),state=enemyPresentations.get(g);if(state)for(const id of state.actors.keys())if(!ids.has(id))state.actors.delete(id);}

function draw(c,g,v,view){const e=g.worldEvolution?.overview();if(!e)return;if(v.z===0){for(const d of e.districts){if(!d.level||d.pos.x<view.l-40||d.pos.x>view.r+40||d.pos.y<view.t-40||d.pos.y>view.b+40)continue;c.save();c.translate(d.pos.x,d.pos.y);c.rotate(d.pos.a);c.strokeStyle='#d7c798';c.lineWidth=.08;c.setLineDash([.7,.45]);c.strokeRect(-28,-28,56,56);c.setLineDash([]);for(const b of d.buildings){const col=b.slot%2,row=Math.floor(b.slot/2),x=-22+col*28,y=-22+row*13;drawAnnex(c,g,b,x,y);}c.restore();}}
if(v.z===0)drawInfected(c,g,v,view,g.worldEvolution.groupMembers?.()||[]);
drawCompanions(c,g,v,view,e.companions);}
function drawGround(c,g,v,view,evolution=g.worldEvolution?.overview()){if(v.z!==0)return;for(const d of evolution?.districts||[]){if(!d.level||d.pos.x<view.l-40||d.pos.x>view.r+40||d.pos.y<view.t-40||d.pos.y>view.b+40)continue;c.save();c.translate(d.pos.x,d.pos.y);c.rotate(d.pos.a);c.strokeStyle='#d7c798';c.lineWidth=.08;c.setLineDash([.7,.45]);c.strokeRect(-28,-28,56,56);c.restore();}}
function depthEntries(g,v,view,e=g.worldEvolution?.overview()){
 const entries=[],present=new Set(),enemies=[...(v.enemies||[]),...(v.z===0?g.worldEvolution?.groupMembers?.()||[]:[])];
 for(const p of e?.companions||[]){
  if(!Object.hasOwn(COMPANION_ART,p.id)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.health<=0||p.riding||p.z!==v.z||v.z!==0&&p.inside!==v.inside)continue;
  present.add(p.id);const proxy=presentation(g,p);if(p.x<view.l-ACTOR_MARGIN||p.x>view.r+ACTOR_MARGIN||p.y<view.t-ACTOR_MARGIN||p.y>view.b+ACTOR_MARGIN||underClosedRoof(g,p,v))continue;
  entries.push({kind:'companion',id:p.id,depth:p.y,draw(c){c.save();c.scale(1/32,1/32);const done=g.art?.drawActor?.(c,proxy,COMPANION_ART[p.id].kind,g.elapsed,!!g.settings?.reducedMotion,false);c.restore();if(!done){c.fillStyle=p.id==='malik'?'#c0aa7c':'#8fb39a';c.beginPath();c.arc(p.x,p.y,.34,0,Math.PI*2);c.fill();}}});
 }
 const pc=presentations.get(g);if(pc)for(const id of pc.actors.keys())if(!present.has(id))pc.actors.delete(id);
 const margin=root.DeadwallCore?.RegionContactRules?.visibleMargin||1.4,ids=new Set(enemies.map(p=>p.id));
 for(const p of enemies){if(p.z!==v.z||v.z!==0&&(p.inside??p.poi)!==v.inside||p.x<view.l-margin||p.x>view.r+margin||p.y<view.t-margin||p.y>view.b+margin||!g.frontier.visibleEnemy(p)||underClosedRoof(g,p,v))continue;
  const proxy=enemyPresentation(g,p);entries.push({kind:'infected',id:p.id,depth:p.y,draw(c){c.save();c.scale(1/32,1/32);const done=g.art?.drawActor?.(c,proxy,proxy.kind,g.elapsed,!!g.settings?.reducedMotion,false);c.restore();if(!done){c.fillStyle='#817766';c.beginPath();c.ellipse(p.x,p.y-.35,.24,.48,p.a||0,0,Math.PI*2);c.fill();}}});
 }
 const ec=enemyPresentations.get(g);if(ec)for(const id of ec.actors.keys())if(!ids.has(id))ec.actors.delete(id);
 if(v.z===0)for(const d of e?.districts||[]){if(!d.level||d.pos.x<view.l-40||d.pos.x>view.r+40||d.pos.y<view.t-40||d.pos.y>view.b+40)continue;
  for(const b of d.buildings){const x=-22+b.slot%2*28,y=-22+Math.floor(b.slot/2)*13,depth=Math.max(...[[x,y],[x+20,y],[x,y+9],[x+20,y+9]].map(([xx,yy])=>d.pos.y+Math.sin(d.pos.a)*xx+Math.cos(d.pos.a)*yy));
   entries.push({kind:'annex',id:d.id+':'+b.slot,depth,draw(c){c.save();c.translate(d.pos.x,d.pos.y);c.rotate(d.pos.a);drawAnnex(c,g,b,x,y);c.restore();}});
  }
 }
 return entries;
}
function atlas(c,g,v,cam,label,vision=g.visibility?.frame?.(),marked=new Set()){const e=g.worldEvolution?.overview();if(!e)return;for(const d of e.districts)if(d.level){const q=cam.screen(d.pos.x,d.pos.y);c.strokeStyle='#d4c28e';c.strokeRect(q.x-5,q.y-5,10,10);if(cam.scale>.5)label('ANNEXE '+d.id.toUpperCase(),q.x,q.y-10,false,'#e1d2a4');}for(const contact of g.worldEvolution.groupMembers?.()||[]){if(marked.has(contact.id)||contact.z!==(v.active?v.z:0)||!vision?.canSeeRegional(contact))continue;marked.add(contact.id);const q=cam.screen(contact.x,contact.y);c.fillStyle='#cb8270';c.beginPath();c.arc(q.x,q.y,2.5,0,Math.PI*2);c.fill();}}
const api=Object.freeze({draw,drawEnemies,drawGround,depthEntries,atlas,COMPANION_ART,ANNEX_ART});root.DeadwallWorldEvolutionArt=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
