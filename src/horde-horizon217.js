// La marée à l'horizon (docs/GAME_BIBLE.md §8.6), première tranche : voir la horde venir.
// Présentation seulement : ce module lit le plan de vague, les fronts annoncés et la file d'entrée.
// Il ne crée ni infecté, ni dégât, ni tirage, ni horloge, et ne modifie aucune sauvegarde.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallHordeHorizon217=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{try{if(root.DEADWALL)api.install(root.DEADWALL,root.document);}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const DIRECTIONS=Object.freeze(['north','east','south','west']);
 const LABELS=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'});
 // Plafonds de dessin : le coût reste constant quel que soit l'effectif de la vague.
 const CAP=240,CAP_LOW=96;
 // Géométrie de la bande de bord, en unités du monde (32 unités = 1 m).
 const SPACING=26,ROW_DEPTH=15,ROWS=6,EDGE=14,INSET=40,BAND=EDGE+ROWS*ROW_DEPTH+10;
 const FULL_MASS=400,REFRESH_SECONDS=.25;
 // La caméra s'arrête au bord du monde : la bande passerait sous le HUD. Elle se décale, au plus de 3 m.
 const CLEARANCE_MAX=96,NO_CLEARANCE=Object.freeze({north:0,east:0,south:0,west:0});
 const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
 const worldSize=()=>{const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);return C?.WORLD_SIZE||4096;};
 function spawnCount(counts){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
  if(C?.spawnCount)return C.spawnCount(counts||{});
  let total=0;for(const value of Object.values(counts||{}))total+=Math.max(0,Number(value)||0);return total;
 }
 // À partir de la vague 4, le directeur fait entrer la vague en trois échelons, chacun par un groupe de
 // fronts. Même lecture que le tableau de coordination : projection de la nuit sauvegardée, sans tirage.
 const echelonMemo=new WeakMap();
 function echelons(g,remaining){
  const key=g.wave+':'+remaining,known=echelonMemo.get(g);if(known&&known.key===key)return known.value;
  let value=null;
  try{
   const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),night=g.dayworks?.snapshot?.().night;
   if(C?.Dayworks?.frontGroup&&night&&night.wave===g.wave&&night.total>0){
    const pattern=g.siege?.assaultPattern?.(),stage=Math.min(2,Math.floor(night.emitted*3/night.total)),pending=[];
    for(let index=stage;index<3;index++)for(const front of C.Dayworks.frontGroup(index===stage?night:{...night,emitted:Math.ceil(night.total*index/3)},pattern)||[])if(!pending.includes(front))pending.push(front);
    value={entering:(C.Dayworks.frontGroup(night,pattern)||[]).slice(),pending};
   }
  }catch(error){value=null;}
  echelonMemo.set(g,{key,value});return value;
 }
 // Ce qui reste à entrer. Le directeur tire le front de chaque arrivée au moment où elle entre :
 // la part de chaque front n'existe donc pas à l'avance, et cette lecture n'en invente pas.
 function horizon(g){
  if(!g||(g.phase!=='warning'&&g.phase!=='assault'))return null;
  const announced=[];for(const front of Array.isArray(g.fronts)?g.fronts:[])if(DIRECTIONS.includes(front)&&!announced.includes(front))announced.push(front);
  let remaining=0;
  if(g.phase==='warning')remaining=Math.floor(Number(g.wavePlan?.total)||0);
  else{remaining=(Array.isArray(g.spawnQueue)?g.spawnQueue.length:0)+spawnCount(g.pendingSpawns);if(!announced.length)announced.push('north');}
  if(!(remaining>0)||!announced.length)return null;
  // En assaut, un front dont tous les échelons sont passés ne recevra plus personne : sa masse s'efface.
  let fronts=announced,entering=g.phase==='assault'?announced:[];
  const plan=g.phase==='assault'?echelons(g,remaining):null;
  if(plan){const left=DIRECTIONS.filter(front=>plan.pending.includes(front));if(left.length){fronts=announced.filter(front=>left.includes(front)).concat(left.filter(front=>!announced.includes(front)));entering=fronts.filter(front=>plan.entering.includes(front));}}
  return Object.freeze({phase:g.phase,wave:Math.max(1,Math.floor(Number(g.wave)||1)),fronts:Object.freeze(fronts.slice()),entering:Object.freeze(entering.slice()),remaining,total:Math.max(remaining,Math.floor(Number(g.wavePlan?.total)||0)),perFront:null});
 }
 function sentence(state){
  if(!state)return '';
  return 'Horde en approche : '+state.fronts.map(front=>LABELS[front]).join(', ')+' — '+state.remaining+' contact'+(state.remaining>1?'s':'')+' restant à entrer';
 }
 // Hachage entier déterministe : graine du monde, vague, front, colonne, rang.
 function seedOf(g){const text=String(g?.world?.seed??0);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 function hash(seed,wave,front,col,row,salt){
  let h=seed^Math.imul(wave+1,0x9e3779b1);
  h=Math.imul(h^(front+1),0x85ebca6b);h^=h>>>13;
  h=Math.imul(h^(col+1),0xc2b2ae35);h^=h>>>16;
  h=Math.imul(h^(row*31+salt+1),0x27d4eb2f);h^=h>>>15;
  h=Math.imul(h,0x165667b1);h^=h>>>13;
  return (h>>>0)/4294967296;
 }
 // Épaisseur de la masse, de 0 à 1. Pendant l'alerte elle grossit à mesure que le préavis s'écoule.
 function mass(g,state){
  const size=clamp(Math.sqrt(state.remaining/FULL_MASS),0,1);
  if(state.phase!=='warning')return size;
  return size*clamp(1-(Number(g.phaseTime)||0)/10,.35,1);
 }
 // Rangs occupés : un rang entier pour la plus petite vague, toute la bande pour une marée.
 function rowsOf(strength){return 1+strength*(ROWS-1);}
 function budgetFor(g,wanted){
  const cap=g?.settings?.quality==='low'?CAP_LOW:CAP;
  return Number.isFinite(wanted)?clamp(Math.floor(wanted),0,cap):cap;
 }
 // Liste des silhouettes à dessiner. Chaque emplacement a un seuil fixe : quand la file se vide,
 // des silhouettes disparaissent mais aucune ne change de place.
 function silhouettes(g,options={}){
  const state=options.state===undefined?horizon(g):options.state;if(!state)return [];
  const size=worldSize(),view=options.view||{left:0,top:0,right:size,bottom:size},budget=budgetFor(g,options.budget);
  if(budget<=0)return [];
  const clear=options.clearance||NO_CLEARANCE;
  const strength=mass(g,state),fill=.08+.87*strength,depth=rowsOf(strength),seed=seedOf(g),columns=Math.floor((size-INSET*2)/SPACING);
  const spans=[];let candidates=0;
  for(const front of state.fronts){
   const horizontal=front==='north'||front==='south';
   const reachable=BAND+CLEARANCE_MAX,near=front==='north'?view.top<=reachable:front==='south'?view.bottom>=size-reachable:front==='west'?view.left<=reachable:view.right>=size-reachable;
   if(!near)continue;
   const lo=horizontal?view.left:view.top,hi=horizontal?view.right:view.bottom;
   const first=clamp(Math.floor((lo-INSET)/SPACING)-1,0,columns),last=clamp(Math.ceil((hi-INSET)/SPACING)+1,0,columns);
   if(last<first)continue;
   spans.push({front,first,last});candidates+=(last-first+1)*ROWS;
  }
  // Éclaircissement régulier quand la masse attendue dépasse le plafond ; l'arrêt net ci-dessous reste la garantie.
  const stride=Math.max(1,Math.ceil(candidates*fill*Math.min(1,depth/ROWS)*1.15/budget)),list=[];
  for(const span of spans){
   const index=DIRECTIONS.indexOf(span.front);
   for(let col=span.first-span.first%stride;col<=span.last;col+=stride){
    if(col<span.first)continue;
    for(let row=0;row<ROWS;row++){
     if(list.length>=budget)return list;
     if(hash(seed,state.wave,index,col,row,0)>=fill||row+hash(seed,state.wave,index,col,row,1)*.999>=depth)continue;
     const along=INSET+col*SPACING+(hash(seed,state.wave,index,col,row,2)-.5)*16,inward=clamp(Number(clear[span.front])||0,0,CLEARANCE_MAX)+EDGE+row*ROW_DEPTH+(hash(seed,state.wave,index,col,row,3)-.5)*8;
     const x=span.front==='west'?inward:span.front==='east'?size-inward:along,y=span.front==='north'?inward:span.front==='south'?size-inward:along;
     list.push({front:span.front,x,y,facing:span.front==='north'?Math.PI/2:span.front==='south'?-Math.PI/2:span.front==='west'?0:Math.PI,scale:.86+hash(seed,state.wave,index,col,row,4)*.3,sway:hash(seed,state.wave,index,col,row,5)*Math.PI*2});
    }
   }
  }
  return list;
 }
 function nightOpacity(g){
  let base=0;
  try{base=g.nightwatch?.isBlackout?.()?1:clamp(1-(typeof g.daylight==='function'?g.daylight():1),0,1)*.72;if(typeof g.fieldcraft?.opacity==='function')base=g.fieldcraft.opacity(base);}catch(error){base=0;}
  return clamp(Number(base)||0,0,1);
 }
 function viewOf(g){
  const zoom=Number(g.camera?.zoom)||1,hw=g.width/zoom/2+24,hh=g.height/zoom/2+24;
  return {left:g.camera.x-hw,right:g.camera.x+hw,top:g.camera.y-hh,bottom:g.camera.y+hh};
 }
 // Part de la bande cachée par le HUD, en unités du monde, lue dans le cadre sûr déjà mesuré par le HUD.
 function clearanceOf(g){
  const safe=g.hud135?.safeFrame?.();if(!safe)return NO_CLEARANCE;
  const zoom=Number(g.camera.zoom)||1,size=worldSize(),sx=x=>(x-g.camera.x)*zoom+g.width/2,sy=y=>(y-g.camera.y)*zoom+g.height/2;
  const part=value=>Number.isFinite(value)?clamp(value/zoom,0,CLEARANCE_MAX):0;
  return {north:part(safe.top-sy(0)),south:part(sy(size)-safe.bottom),west:part(safe.left-sx(0)),east:part(sx(size)-safe.right)};
 }
 // Peintre : passe unique, en coordonnées du monde, sous les flèches de menace et le réticule.
 function paint(ctx,g){
  if(!ctx||!g||g.state!=='playing'||g.gameOver||!g.camera||!(g.width>0)||!(g.height>0))return 0;
  if(g.frontier?.active?.()||g.player?.regionAbsent)return 0;
  const state=horizon(g);if(!state)return 0;
  const view=viewOf(g),clear=clearanceOf(g),list=silhouettes(g,{state,view,clearance:clear});
  const size=worldSize(),strength=mass(g,state),night=nightOpacity(g),zoom=Number(g.camera.zoom)||1;
  const still=!!g.settings?.reducedMotion,time=Number(g.elapsed)||0,reach=EDGE+rowsOf(strength)*ROW_DEPTH+6;
  ctx.save();
  try{
   ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
   ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
   // Ombre portée de la masse : un voile qui s'éteint avant la fin de la bande de bord.
   for(const front of state.fronts){
    const horizontal=front==='north'||front==='south',low=front==='north'||front==='west',sign=low?1:-1,from=(low?0:size)+sign*clear[front];
    const shade=horizontal?ctx.createLinearGradient(0,from,0,from+sign*reach):ctx.createLinearGradient(from,0,from+sign*reach,0);
    shade.addColorStop(0,'rgba(9,12,10,'+(.38+.4*strength).toFixed(3)+')');shade.addColorStop(1,'rgba(9,12,10,0)');ctx.fillStyle=shade;
    const lo=Math.max(0,horizontal?view.left:view.top),hi=Math.min(size,horizontal?view.right:view.bottom);if(hi<=lo)continue;
    // Le voile couvre aussi la marge dégagée du HUD, d'un seul tenant depuis le bord du monde.
    const start=low?0:from-reach,span=reach+clear[front];
    if(horizontal)ctx.fillRect(lo,start,hi-lo,span);else ctx.fillRect(start,lo,span,hi-lo);
   }
   if(list.length){
    const bodies=[];ctx.beginPath();
    for(const s of list){
     const drift=still?0:Math.sin(time*1.3+s.sway)*1.4,cos=Math.cos(s.facing),sin=Math.sin(s.facing);
     // Le balancement suit l'axe des épaules ; la tête dépasse vers la cité.
     const x=s.x-sin*drift,y=s.y+cos*drift,r=s.scale;
     const rx=horizontalRadius(cos,12,7)*r,ry=horizontalRadius(sin,12,7)*r;
     bodies.push(x,y,rx,ry);ctx.moveTo(x+rx,y);ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
     const hx=x+cos*4.2*r,hy=y+sin*4.2*r;ctx.moveTo(hx+5.6*r,hy);ctx.arc(hx,hy,5.6*r,0,Math.PI*2);
    }
    ctx.fillStyle='rgba(15,19,16,.93)';ctx.fill();
    // De nuit, un liseré froid garde la masse lisible près du bord sans rouvrir le masque.
    if(night>.05){
     ctx.beginPath();for(let i=0;i<bodies.length;i+=4){ctx.moveTo(bodies[i]+bodies[i+2],bodies[i+1]);ctx.ellipse(bodies[i],bodies[i+1],bodies[i+2],bodies[i+3],0,0,Math.PI*2);}
     ctx.lineWidth=1/zoom;ctx.strokeStyle='rgba(150,166,160,'+(.08+.24*night).toFixed(3)+')';ctx.stroke();
    }
   }
  }finally{ctx.restore();}
  return list.length;
 }
 // Épaules perpendiculaires à la marche : large le long du bord, étroit vers la cité.
 function horizontalRadius(axis,wide,narrow){return Math.abs(axis)>.5?narrow:wide;}
 function install(g,doc){
  if(!g||g.hordeHorizon217)return false;
  let line=null,clock=-Infinity,shown='';
  function attach(){
   if(line||!doc?.getElementById||typeof doc.createElement!=='function')return line;
   const box=doc.getElementById('siegeReadout');if(!box)return null;
   const card=doc.getElementById('siegeReadoutSignature')||box;
   const node=doc.createElement('p');node.id='hordeHorizonLine';node.className='siege-readout-effect horde-horizon-line';node.hidden=true;
   if(typeof card.appendChild!=='function')return null;
   card.appendChild(node);line=node;return line;
  }
  function render(){
   const node=attach();if(!node)return false;
   const text=g.state==='playing'?sentence(horizon(g)):'';
   if(text!==shown){shown=text;node.textContent=text;}
   node.hidden=!text;return !!text;
  }
  const drawNight=g.drawNight;
  if(typeof drawNight==='function')g.drawNight=function(...args){const result=drawNight.apply(this,args);paint(args[0],g);return result;};
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;render();}return result;};
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);clock=-Infinity;render();return result;};}
  g.hordeHorizon217=Object.freeze({render,horizon:()=>horizon(g),silhouettes:options=>silhouettes(g,options),paint:ctx=>paint(ctx,g),sentence:()=>sentence(horizon(g))});
  render();return true;
 }
 return Object.freeze({install,horizon,sentence,silhouettes,paint,limits:Object.freeze({cap:CAP,capLow:CAP_LOW,band:BAND,clearance:CLEARANCE_MAX})});
});
