/* Read-only mapping and temporary route planning. Existing discovery/save rules own progress. */
(function(root){
 'use strict';const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore;
 const R=C.RECON_RULES,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),live=b=>b&&!b.dead&&b.health>0;
 function valid(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=C.WORLD_SIZE&&p.y<=C.WORLD_SIZE;}
 function points(g){
  if(!g?.world||g.state!=='playing'||g.gameOver)return[];
  const out=[];
  for(const s of g.dayworks.snapshot().sites)if(s.seen){const d=C.Dayworks.BY_ID[s.id];out.push({id:'site:'+s.id,ref:s.id,kind:'site',x:s.x,y:s.y,name:d.name,text:d.text,resource:d.resource,remaining:s.remaining,survey:s.survey,done:s.survey>=6&&s.remaining<=.001,reach:C.Dayworks.RULES.surveyRange,unlock:s.survey>=6?d.unlock:null});}
  for(const s of g.citadel.snapshot().calls)if(s.seen&&['waiting','follow','hold','return'].includes(s.status)){
   const p=s.unitId?g.units.find(u=>u.id===s.unitId&&live(u)):(g.world.sites||[]).find(p=>p.theme===s.id);if(!p)continue;const d=C.Citadel.BY_ID[s.id];out.push({id:'call:'+s.id,ref:s.id,kind:'call',x:p.x,y:p.y,name:d.name,text:d.brief,status:s.status,done:false,reach:48});}
  for(const b of g.world.buildings.values())if(live(b)&&b.completed&&(b.type==='core'||b.type==='warehouse'||b.def.storageDepot))out.push({id:'depot:'+b.id,ref:b.id,kind:'depot',x:b.x,y:b.y,name:b.def.name,text:'Déposez physiquement les ressources portées, dans la limite de la capacité de la cité.',done:false,reach:90});
  return out.map(p=>({...p,distance:dist(g.player,p)}));
 }
 function segmentClear(g,a,b,radius=g.player.radius){
  if(!valid(a)||!valid(b))return false;const n=Math.max(1,Math.ceil(dist(a,b)/R.sampleStep)),probe={radius};
  for(let i=0;i<=n;i++)if(!g.friendlyPositionClear(probe,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
  return true;
 }
 function routeBetween(g,from,to){
  const fail={ok:false,path:[],distance:0,reason:'Trajet non établi : accès fermé ou recherche bornée. Aucun déplacement automatique.'};
  if(!valid(from)||!valid(to))return fail;
  const radius=g.player.radius,clear=p=>valid(p)&&g.friendlyPositionClear({radius},p.x,p.y);
  if(g.fieldcraft&&!clear(to)){const edge=g.fieldcraft.service({x:from.x,y:from.y,radius},g.world.buildings.get(to.ref)||to);if(!edge)return fail;to={...to,x:edge.x,y:edge.y};}
  const candidates=[{x:to.x,y:to.y},...[[-32,0],[32,0],[0,-32],[0,32]].map(([x,y])=>({x:to.x+x,y:to.y+y}))].filter(p=>clear(p)&&dist(p,to)<(to.reach||54)&&segmentClear(g,p,to,radius));
  for(const end of candidates)if(segmentClear(g,from,end,radius))return{ok:true,path:[{x:from.x,y:from.y},end],distance:dist(from,end),reason:'Passage direct actuellement libre. Aucun danger évalué.'};
  const start={x:Math.floor(from.x/32),y:Math.floor(from.y/32)},origin={x:start.x*32+16,y:start.y*32+16};
  if(!segmentClear(g,from,origin,radius))return fail;
  for(const end of candidates.slice(0,R.routeQueries)){
   const goal={x:Math.floor(end.x/32),y:Math.floor(end.y/32)};
   const blocked=(x,y)=>!clear({x:x*32+16,y:y*32+16});
   const cells=g.infrastructure?.findPath?g.infrastructure.findPath(start,goal,blocked,128,128,R.maxExpanded):C.findFriendlyPath(start,goal,blocked,128,128,R.maxExpanded);
   if(!cells)continue;const path=[{x:from.x,y:from.y},origin,...cells.map(p=>({x:p.x*32+16,y:p.y*32+16})),end];
   if(!path.slice(1).every((p,i)=>segmentClear(g,path[i],p,radius)))continue;
   return{ok:true,path,distance:path.slice(1).reduce((n,p,i)=>n+dist(path[i],p),0),reason:'Trajet par les accès actuels. Portes et pistes prises en compte ; aucun danger évalué.'};
  }
  return fail;
 }
 function install(g){
  if(!g||g.recon)return g?.recon;let world=g.world,queue=[],selected=null,overlay=true,cached=null,key='',last=-Infinity,message='';
  function sync(){if(world!==g.world){world=g.world;queue=[];selected=null;cached=null;key='';last=-Infinity;message='';}const ids=new Set(points(g).map(p=>p.id));queue=queue.filter(id=>ids.has(id));if(selected&&!ids.has(selected))selected=null;}
  const permitted=()=>g.canIssueCommand()&&!g.player.dead;
  function choose(id){sync();if(!permitted()||!points(g).some(p=>p.id===id))return false;selected=id;g.reconUI?.refresh(true);return true;}
  function enqueue(id){sync();const p=points(g).find(p=>p.id===id);if(!permitted()||!p||p.done)return false;if(queue.includes(id)){message='Ce lieu est déjà dans le parcours.';return false;}if(queue.length>=R.maxStops){message='Quatre étapes maximum. Retirez une étape avant d’en ajouter.';return false;}queue.push(id);selected=id;key='';message='Étape ajoutée. Le parcours ne déplace pas le commandant.';return true;}
  function remove(id){sync();if(!permitted()||!queue.includes(id))return false;queue=queue.filter(x=>x!==id);key='';return true;}
  function move(id,delta){sync();const i=queue.indexOf(id),j=i+delta;if(!permitted()||![-1,1].includes(delta)||i<0||j<0||j>=queue.length)return false;[queue[i],queue[j]]=[queue[j],queue[i]];key='';return true;}
  function clear(){sync();if(!permitted())return false;queue=[];cached=null;key='';message='Parcours effacé. Aucun objectif ni matériau modifié.';return true;}
  function returnHome(){sync();const core=g.core();if(!permitted()||!core)return false;queue=['depot:'+core.id];selected=queue[0];key='';message='Retour au centre indiqué. Rejoignez-le à pied puis déposez votre sac.';return true;}
  function route(force=false){sync();const to=points(g).find(p=>p.id===queue[0]);if(!to)return null;
   const newKey=[queue[0],g.world.navigationVersion,Math.floor(g.player.x/32),Math.floor(g.player.y/32),Math.floor(to.x/32),Math.floor(to.y/32)].join(':');
   if(!cached||newKey!==key&&(force||g.elapsed-last>=R.routeInterval)){cached=routeBetween(g,g.player,to);key=newKey;last=g.elapsed;}return cached;
  }
  function overview(force=false){sync();const ps=points(g),path=route(force);return{points:ps,selected:ps.find(p=>p.id===selected)||null,queue:queue.map(id=>ps.find(p=>p.id===id)).filter(Boolean),route:path,overlay,message,phase:g.phase,remaining:Math.max(0,g.phaseTime),bag:C.bagTotal(g.player.carry),capacity:g.player.carryCapacity};}
  function open(){if(g.state!=='playing'||g.gameOver)return false;g.showCommand?.(true,'field');g.reconUI?.open();return true;}
  function draw(ctx,view){if(!overlay||!queue.length||g.state!=='playing'||g.gameOver)return;const r=route(),p=points(g).find(p=>p.id===queue[0]);if(!p)return;
   ctx.save();ctx.lineWidth=2/Math.max(.5,g.camera.zoom);ctx.strokeStyle=r?.ok?'rgba(221,198,131,.66)':'rgba(216,149,117,.65)';ctx.setLineDash([6,7]);
   if(r?.ok){ctx.beginPath();for(let i=1;i<r.path.length;i++){const a=r.path[i-1],b=r.path[i];if(view&&(Math.max(a.x,b.x)<view.left||Math.min(a.x,b.x)>view.right||Math.max(a.y,b.y)<view.top||Math.min(a.y,b.y)>view.bottom))continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.stroke();}
   ctx.setLineDash([]);if(!view||g.visible(p.x,p.y,45,view)){ctx.beginPath();ctx.arc(p.x,p.y,33,0,Math.PI*2);ctx.stroke();ctx.font='bold 11px sans-serif';ctx.fillStyle='#efdab0';ctx.textAlign='center';ctx.fillText('ÉTAPE 1',p.x,p.y-40);}ctx.restore();
  }
  const oldGround=g.drawGround.bind(g);g.drawGround=(ctx,...args)=>{const result=oldGround(ctx,...args);draw(ctx,args[0]);return result;};
  const oldMinimap=g.renderMinimap.bind(g);g.renderMinimap=(...args)=>{const result=oldMinimap(...args);if(g.frontier?.active())return result;sync();const ps=points(g),c=g.mctx,sx=g.minimap.width/C.WORLD_SIZE,sy=g.minimap.height/C.WORLD_SIZE;c.save();for(const p of ps)if(p.kind==='site'&&!p.done){c.strokeStyle=queue.includes(p.id)?'#f0d28d':'#89b6ac';c.lineWidth=queue.includes(p.id)?2:1;c.strokeRect(p.x*sx-2,p.y*sy-2,4,4);}c.restore();return result;};
  for(const name of ['startNew','restoreSave','returnToMenu']){const old=g[name].bind(g);g[name]=(...args)=>{const result=old(...args);queue=[];selected=null;cached=null;key='';world=g.world;message='';g.reconUI?.reset();return result;};}
  const api=Object.freeze({points:()=>points(g),choose,enqueue,remove,move,clear,returnHome,route,overview,open,draw,setOverlay:value=>{if(typeof value!=='boolean')return false;overlay=value;return true;}});g.recon=api;return api;
 }
 const API=Object.freeze({points,segmentClear,routeBetween,install});root.DeadwallRecon=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;else if(root.DEADWALL)install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this);
