// La marée à l'horizon (docs/GAME_BIBLE.md §8.6), première tranche : voir la horde venir.
// Une masse humaine compacte au bord de la carte : avant-garde de silhouettes, rangs serrés derrière.
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
 // CAP borne les silhouettes entières (corps, jambes, bras) ; HEADS borne les têtes de rang, réduites à
 // une tête et une ligne d'épaules, qui forment l'épaisseur de la masse derrière l'avant-garde.
 const CAP=240,CAP_LOW=96,HEADS=1440,HEADS_LOW=192;
 // Géométrie de la bande de bord, en unités du monde (32 unités = 1 m) : une grille fixe d'emplacements.
 const SPACING=14,ROW_DEPTH=11.5,ROWS=14,EDGE=8,INSET=40,VEIL=34,VANGUARD=5,BAND=EDGE+ROWS*ROW_DEPTH+VEIL+8;
 const FULL_MASS=400,REFRESH_SECONDS=.25;
 // La caméra s'arrête au bord du monde : la bande passerait sous le HUD. La masse se tient donc à la
 // limite de la marge que le HUD cache quand la caméra est en butée, au plus à 12 m du bord.
 const CLEARANCE_MAX=384,CLEARANCE_RATE=260,NO_CLEARANCE=Object.freeze({north:0,east:0,south:0,west:0});
 // Rien n'est posé autour du Commandant ; le repère de bord tient dans une bande de l'écran.
 const PLAYER_CLEARING=68,CUE=56,CUE_MARGIN=22,SHADE_STEPS=14,CUE_STEPS=8;
 // Palette terre, acier, béton : vêtements sombres, têtes cendre. Rien de saturé.
 const BODY_TINTS=Object.freeze(['#1f231d','#2a2a21','#322d24','#252b29']),HEAD_TINTS=Object.freeze(['#49443a','#34322c']),BACK_TINTS=Object.freeze(['#181c17','#1f1f19','#24211b','#1b201f']);
 const CUE_LABELS=Object.freeze({north:'HORDE · NORD',east:'HORDE · EST',south:'HORDE · SUD',west:'HORDE · OUEST'});
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
 // Profondeur occupée, en rangs : un à deux rangs pour une poignée de contacts, toute la bande pour une marée.
 function rowsOf(strength){return 1.2+strength*(ROWS-1.2);}
 // Part du bord occupée : une petite vague arrive par paquets serrés, une vague moyenne tient tout le bord.
 function coverOf(strength){return clamp(strength*3.4-.1,.14,1);}
 function budgetFor(g,wanted){
  const cap=g?.settings?.quality==='low'?CAP_LOW:CAP;
  return Number.isFinite(wanted)?clamp(Math.floor(wanted),0,cap):cap;
 }
 function headBudgetFor(g,wanted){
  const cap=g?.settings?.quality==='low'?HEADS_LOW:HEADS;
  return Number.isFinite(wanted)?clamp(Math.floor(wanted)*3,0,cap):cap;
 }
 // Bruit lissé le long du bord, de 0 à 1 : la foule se serre par paquets au lieu de s'aligner.
 function noise(seed,wave,front,col,scale,salt){
  const at=col/scale,base=Math.floor(at),t=at-base,k=t*t*(3-2*t),a=hash(seed,wave,front,base,97,salt),b=hash(seed,wave,front,base+1,97,salt);
  return a+(b-a)*k;
 }
 // Liste des figures à dessiner, sur une grille fixe d'emplacements. Chaque emplacement a ses seuils :
 // quand la file se vide, des figures disparaissent mais aucune ne change de place. Les rangs de tête
 // (`detail`) sont des silhouettes entières ; derrière eux, la masse se réduit à des têtes de rang.
 function silhouettes(g,options={}){
  const state=options.state===undefined?horizon(g):options.state;if(!state)return [];
  const size=worldSize(),view=options.view||{left:0,top:0,right:size,bottom:size},inner=options.inner||view;
  const budget=budgetFor(g,options.budget),heads=headBudgetFor(g,options.budget);
  if(budget<=0)return [];
  const clear=options.clearance||NO_CLEARANCE,player=options.player||null;
  const strength=mass(g,state),depth=rowsOf(strength),gap=1-coverOf(strength),seed=seedOf(g),columns=Math.floor((size-INSET*2)/SPACING);
  const spans=[];
  for(const front of state.fronts){
   const horizontal=front==='north'||front==='south',offset=clamp(Number(clear[front])||0,0,CLEARANCE_MAX),reachable=offset+BAND;
   const near=front==='north'?view.top<=reachable:front==='south'?view.bottom>=size-reachable:front==='west'?view.left<=reachable:view.right>=size-reachable;
   if(!near)continue;
   // Seule la portion du bord réellement visible entre les panneaux reçoit des figures.
   const lo=Math.max(horizontal?view.left:view.top,horizontal?inner.left:inner.top),hi=Math.min(horizontal?view.right:view.bottom,horizontal?inner.right:inner.bottom);
   const first=clamp(Math.floor((lo-INSET)/SPACING)-1,0,columns),last=clamp(Math.ceil((hi-INSET)/SPACING)+1,0,columns);
   if(hi<=lo||last<first)continue;
   spans.push({front,first,last,offset});
  }
  if(!spans.length)return [];
  // Chaque front reçoit une part des deux plafonds proportionnelle à sa longueur visible.
  let length=0;for(const span of spans)length+=span.last-span.first+1;
  const list=[];
  for(const span of spans){
   const index=DIRECTIONS.indexOf(span.front),cols=span.last-span.first+1,share=Math.max(1,Math.floor(budget*cols/length)),headShare=Math.floor(heads*cols/length);
   // Vue large : moins de rangs entiers et des têtes de rang espacées, pour tenir les deux plafonds.
   const van=clamp(Math.floor(share/(cols*.72)),1,VANGUARD),stride=Math.max(1,Math.ceil(cols*(ROWS-van)*.6/Math.max(1,headShare)));
   const fx=span.front==='west'?1:span.front==='east'?-1:0,fy=span.front==='north'?1:span.front==='south'?-1:0;
   let whole=0,simple=0;
   // De l'avant-garde vers le bord : le plafond des silhouettes entières sert d'abord les premiers rangs.
   // Le front de la masse ondule en lobes : chaque colonne a sa profondeur, fixée par le hachage.
   const packed=new Array(cols),local=new Array(cols);
   for(let i=0;i<cols;i++){
    const col=span.first+i,pack=clamp((noise(seed,state.wave,index,col,6,7)-gap)*5,0,1);
    packed[i]=pack*clamp(.52+.74*noise(seed,state.wave,index,col,5,9),0,1);local[i]=depth*(.62+.38*noise(seed,state.wave,index,col,11,8));
   }
   for(let row=ROWS-1;row>=0;row--){
    for(let col=span.first;col<=span.last;col++){
     const reach=local[col-span.first];if(row>=reach)continue;
     // Densité croissante vers le bord : les rangs arrière sont pleins, l'avant-garde s'effiloche.
     const rel=row/reach,thin=rel<.5?.97:.97-(rel-.5)*1.26,wantsWhole=row>reach-van-1;
     if(row+hash(seed,state.wave,index,col,row,1)*.999>=reach||hash(seed,state.wave,index,col,row,0)>=thin*packed[col-span.first])continue;
     const detail=wantsWhole&&whole<share;
     if(!detail&&((col+row*((stride>>1)||1))%stride!==0||simple>=headShare))continue;
     const along=INSET+col*SPACING+(hash(seed,state.wave,index,col,row,2)-.5)*9,inward=span.offset+EDGE+row*ROW_DEPTH+(hash(seed,state.wave,index,col,row,3)-.5)*7;
     const x=fx>0?inward:fx<0?size-inward:along,y=fy>0?inward:fy<0?size-inward:along;
     if(player){const dx=x-player.x,dy=y-(player.y-8);if(dx*dx+dy*dy<PLAYER_CLEARING*PLAYER_CLEARING)continue;}
     if(detail)whole++;else simple++;
     // Tailles et teintes légèrement variées ; quelques silhouettes plus hautes, voûtées, ou bras tendus.
     const build=hash(seed,state.wave,index,col,row,4),trait=hash(seed,state.wave,index,col,row,5)*4,kind=trait%1;
     list.push({front:span.front,x,y,facing:fy>0?Math.PI/2:fy<0?-Math.PI/2:fx>0?0:Math.PI,scale:(.9+build*.24)*(kind<.07?1.2:1),sway:hash(seed,state.wave,index,col,row,6)*Math.PI*2,
      detail,tint:Math.floor(trait),shade:build*8%1<.6?0:1,hunch:kind>.82,reach:kind>=.07&&kind<.27,fx,fy,px:x,py:y,step:0});
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
 // Cadre sûr du HUD, en pixels d'écran ; une mesure absente ou absurde revient au plein écran.
 function safeRect(g){
  let safe=null;try{safe=g.hud135?.safeFrame?.()||null;}catch(error){safe=null;}
  const pick=(value,fallback,lo,hi)=>Number.isFinite(value)?clamp(value,lo,hi):fallback;
  const rect={left:pick(safe?.left,0,0,g.width),top:pick(safe?.top,0,0,g.height),right:pick(safe?.right,g.width,0,g.width),bottom:pick(safe?.bottom,g.height,0,g.height),measured:!!safe};
  if(rect.right-rect.left<24){rect.left=0;rect.right=g.width;}
  if(rect.bottom-rect.top<24){rect.top=0;rect.bottom=g.height;}
  return rect;
 }
 // Marge cachée par le HUD quand la caméra est en butée, en unités du monde. Elle ne dépend pas de la
 // position de la caméra : la masse reste ancrée au monde et défile comme le terrain.
 function clearanceTarget(g,safe){
  const zoom=Number(g.camera.zoom)||1,part=value=>clamp(value/zoom,0,CLEARANCE_MAX);
  return {north:part(safe.top),south:part(g.height-safe.bottom),west:part(safe.left),east:part(g.width-safe.right)};
 }
 // Une notification qui s'ouvre déplace le cadre sûr : la masse glisse au lieu de sauter. Le pas se lit
 // dans le temps de jeu ; en animations réduites, en pause, ou sans image précédente, la marge est prise telle quelle.
 const eased=new WeakMap(),frames=new WeakMap();
 function clearanceOf(g,safe,still,time){
  const target=clearanceTarget(g,safe),known=eased.get(g),dt=known?time-known.time:-1;
  if(!known||still||!(dt>0)||dt>1){eased.set(g,{time,clear:target});return target;}
  const step=dt*CLEARANCE_RATE,next={};
  for(const front of DIRECTIONS){const gap=target[front]-known.clear[front];next[front]=Math.abs(gap)<=step?target[front]:known.clear[front]+Math.sign(gap)*step;}
  eased.set(g,{time,clear:next});return next;
 }
 function active(g){
  if(!g||g.state!=='playing'||g.gameOver||!g.camera||!(g.width>0)||!(g.height>0))return false;
  return !(g.frontier?.active?.()||g.player?.regionAbsent);
 }
 // Image courante : calculée une fois, lue par la passe au sol puis par la passe au-dessus de la nuit.
 // Les emplacements ne dépendent pas du temps : tant que la vue, la file et le Commandant ne bougent pas,
 // la liste est gardée et seul le mouvement est relu.
 function frameOf(g){
  if(!active(g))return null;
  const state=horizon(g);if(!state)return null;
  const zoom=Number(g.camera.zoom)||1,still=!!g.settings?.reducedMotion,time=Number(g.elapsed)||0,safe=safeRect(g),p=g.player;
  const scene=[g.camera.x,g.camera.y,zoom,g.width,g.height,state.phase,state.wave,state.remaining,state.fronts.join(),g.phaseTime,safe.left,safe.right,safe.top,safe.bottom,p?.x,p?.y,g.settings?.quality,still,g.world?.seed].join(':');
  const known=frames.get(g);if(known&&known.time===time&&known.scene===scene)return known;
  const clear=clearanceOf(g,safe,still,time),layout=scene+':'+clear.north+':'+clear.east+':'+clear.south+':'+clear.west;
  let frame=known&&known.layout===layout?known:null;
  if(!frame){
   const view=viewOf(g),pad=30;
   const inner={left:(safe.left-pad-g.width/2)/zoom+g.camera.x,right:(safe.right+pad-g.width/2)/zoom+g.camera.x,top:(safe.top-pad-g.height/2)/zoom+g.camera.y,bottom:(safe.bottom+pad-g.height/2)/zoom+g.camera.y};
   const player=p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null,list=silhouettes(g,{state,view,inner,clearance:clear,player});
   // Du fond vers l'avant de l'écran : chaque rang recouvre celui qui est derrière lui.
   list.sort((a,b)=>a.y-b.y);
   const strength=mass(g,state);
   frame={layout,state,zoom,still,safe,clear,view,inner,list,strength,depth:rowsOf(strength)};
  }
  // Mouvement collectif : une houle lente le long de la masse et le pas de chacun, lus dans le temps de jeu.
  if(!still)for(const s of frame.list){
   const swell=Math.sin(time*.7+(s.fy?s.x:s.y)*.011)*2.2;s.step=Math.sin(time*2.1+s.sway);
   s.px=s.x+s.fx*swell+(s.fx?0:s.step*.6);s.py=s.y+s.fy*swell+(s.fy?0:s.step*.6);
  }
  frame.scene=scene;frame.time=time;frame.night=nightOpacity(g);
  frames.set(g,frame);return frame;
 }
 const TAU=Math.PI*2;
 // Une figure, en deux aplats : le corps puis la tête. Une silhouette entière a un tronc, des jambes et
 // parfois des bras tendus ; une tête de rang se réduit à sa ligne d'épaules. Un aplat par figure coûte
 // moins qu'un grand chemin commun, et chaque rang recouvre proprement celui qui est derrière lui.
 function figure(ctx,s){
  const k=s.scale,x=s.px,y=s.py,w=(s.fy?8.4:5)*k,top=y-(s.hunch?15:17.5)*k;
  ctx.fillStyle=BODY_TINTS[s.tint];
  if(!s.detail){
   // Tête de rang : une ligne d'épaules et une tête en deux aplats croisés, sans chemin.
   const hx=x+s.fx*2.4*k,hy=top-2.2*k+s.fy*1.6*k,r=3.7*k;
   ctx.fillStyle=BACK_TINTS[s.tint];ctx.fillRect(x-w*.92,top+.8*k,w*1.84,6.2*k);
   ctx.fillStyle=HEAD_TINTS[s.shade];ctx.fillRect(hx-r*.86,hy-r*.86,r*1.72,r*1.72);
   return;
  }
  {
   const stride=s.step*1.5*k,hip=y-8*k;
   ctx.beginPath();
   ctx.moveTo(x-w,top+2.4*k);ctx.lineTo(x-w*.72,top);ctx.lineTo(x+w*.72,top);ctx.lineTo(x+w,top+2.4*k);ctx.lineTo(x+w*.78,hip);
   ctx.lineTo(x+w*.6+stride,y);ctx.lineTo(x+w*.12+stride,y);ctx.lineTo(x,y-5*k);ctx.lineTo(x-w*.12-stride,y);ctx.lineTo(x-w*.6-stride,y);ctx.lineTo(x-w*.78,hip);ctx.closePath();
   if(s.reach&&s.fy>=0){
    // Bras tendus vers la cité (de dos, le corps les cache) ; même sens de tracé que le corps.
    const arm=9*k,thick=2.6*k;
    if(s.fy){ctx.rect(x-w-.3*k,top+1.5*k,thick,arm);ctx.rect(x+w+.3*k-thick,top+1.5*k,thick,arm);}
    else ctx.rect(s.fx>0?x:x-w-arm,top+2*k,w+arm,thick);
   }
   ctx.fill();
  }
  const hx=x+s.fx*(s.hunch?4.6:2.4)*k,hy=top-2.2*k+s.fy*1.6*k;
  ctx.fillStyle=HEAD_TINTS[s.shade];ctx.beginPath();ctx.arc(hx,hy,3.9*k,0,TAU);ctx.fill();
 }
 // Passe au sol, en coordonnées du monde : appelée dans la transformation de la scène, avant les corps,
 // les acteurs et les bâtiments. La masse passe donc sous tout ce qui se joue.
 function groundPass(ctx,f){
  const size=worldSize(),view=f.view,alpha=clamp(.08+.76*f.strength,0,.8);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  for(const front of f.state.fronts){
   const horizontal=front==='north'||front==='south',low=front==='north'||front==='west',sign=low?1:-1,edge=low?0:size;
   const clear=f.clear[front],reach=clear+EDGE+f.depth*ROW_DEPTH,depth=reach-clear+10;
   const near=front==='north'?view.top<=reach+VEIL:front==='south'?view.bottom>=size-reach-VEIL:front==='west'?view.left<=reach+VEIL:view.right>=size-reach-VEIL;
   const lo=Math.max(0,horizontal?view.left:view.top),hi=Math.min(size,horizontal?view.right:view.bottom);if(!near||hi<=lo)continue;
   // Base sombre continue : un aplat depuis le bord du monde, marge cachée par le HUD comprise, puis
   // des paliers qui s'éteignent sous l'avant-garde. Des aplats coûtent bien moins qu'un dégradé.
   const solid=clear+depth*.3,fade=depth*.7/SHADE_STEPS;
   const bar=(from,span)=>{if(horizontal)ctx.fillRect(lo,low?from:size-from-span,hi-lo,span);else ctx.fillRect(low?from:size-from-span,lo,span,hi-lo);};
   ctx.fillStyle='rgba(10,13,11,'+alpha.toFixed(3)+')';bar(0,solid);
   for(let i=0;i<SHADE_STEPS;i++){const t=(i+.5)/SHADE_STEPS,level=t<.6?1-t*.83:.5*(1-t)/.4;ctx.fillStyle='rgba(10,13,11,'+(alpha*level).toFixed(3)+')';bar(solid+i*fade,fade);}
   // Voile de poussière soulevé devant la masse, sur la seule portion visible entre les panneaux.
   const from=reach-28,span=28+VEIL,dust=horizontal?ctx.createLinearGradient(0,edge+sign*from,0,edge+sign*(from+span)):ctx.createLinearGradient(edge+sign*from,0,edge+sign*(from+span),0);
   dust.addColorStop(0,'rgba(134,122,100,0)');dust.addColorStop(.42,'rgba(134,122,100,'+(.1+.1*f.strength).toFixed(3)+')');dust.addColorStop(1,'rgba(134,122,100,0)');ctx.fillStyle=dust;
   const dl=Math.max(lo,horizontal?f.inner.left:f.inner.top),dh=Math.min(hi,horizontal?f.inner.right:f.inner.bottom);
   if(dh>dl){if(horizontal)ctx.fillRect(dl,low?from:size-from-span,dh-dl,span);else ctx.fillRect(low?from:size-from-span,dl,span,dh-dl);}
  }
  for(const s of f.list)figure(ctx,s);
 }
 function worldTransform(ctx,g,zoom){
  ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
 }
 // Passe au-dessus du masque de nuit : un liseré froid sur les têtes, puis le repère de bord.
 function overlayPass(ctx,g,f){
  const zoom=f.zoom;
  if(f.night>.05&&f.list.length){
   ctx.save();
   try{
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;worldTransform(ctx,g,zoom);
    // Un reflet froid sur chaque tête, et la tête entière pour l'avant-garde : la marée se devine
    // sans rouvrir le masque de nuit.
    const glint='rgba(150,166,160,'+(.1+.26*f.night).toFixed(3)+')',skull='rgba(118,132,128,'+(.08+.14*f.night).toFixed(3)+')';
    for(const s of f.list){
     const k=s.scale,top=s.py-(s.hunch?15:17.5)*k,hx=s.px+s.fx*(s.hunch?4.6:2.4)*k,hy=top-2.2*k+s.fy*1.6*k;
     if(s.detail){ctx.fillStyle=skull;ctx.beginPath();ctx.arc(hx,hy,3.9*k,0,TAU);ctx.fill();}
     ctx.fillStyle=glint;ctx.fillRect(hx-2.6*k,hy-3.4*k,5.2*k,1.5*k);
    }
   }finally{ctx.restore();}
  }
  cuePass(ctx,g,f);
 }
 // Repère de bord : quand la masse d'un front est hors champ ou sous le HUD, une bande d'ombre et un
 // libellé court tiennent le long du bord visible du cadre sûr. Ni flèche, ni couleur vive.
 function cuePass(ctx,g,f){
  const size=worldSize(),zoom=f.zoom,safe=f.safe,margin=safe.measured?CUE_MARGIN:0,compact=g.width<=720,depth=compact?40:CUE;
  const sx=x=>(x-g.camera.x)*zoom+g.width/2,sy=y=>(y-g.camera.y)*zoom+g.height/2;
  let drawn=0;
  for(const front of f.state.fronts){
   const lead=f.clear[front]+EDGE+f.depth*ROW_DEPTH;
   // Largeur de masse visible à l'intérieur du cadre sûr, en pixels.
   const inside=front==='north'?sy(lead)-safe.top:front==='south'?safe.bottom-sy(size-lead):front==='west'?sx(lead)-safe.left:safe.right-sx(size-lead);
   const alpha=clamp(1-inside/28,0,1);if(alpha<=.02)continue;
   const horizontal=front==='north'||front==='south',low=front==='north'||front==='west';
   const edge=horizontal?(low?Math.max(0,safe.top-margin):Math.min(g.height,safe.bottom+margin)):(low?Math.max(0,safe.left-margin):Math.min(g.width,safe.right+margin));
   const lo=horizontal?safe.left:safe.top,hi=horizontal?safe.right:safe.bottom,sign=low?1:-1;
   ctx.save();
   try{
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    // Ombre par paliers, depuis le bord de l'écran : elle passe sous le HUD et n'a aucune arête visible.
    const reach=low?edge:(horizontal?g.height:g.width)-edge,step=depth/CUE_STEPS,length=horizontal?g.width:g.height;
    const bar=(from,span,level)=>{ctx.fillStyle='rgba(8,10,9,'+(level*alpha).toFixed(3)+')';const at=low?from:(horizontal?g.height:g.width)-from-span;if(horizontal)ctx.fillRect(0,at,length,span);else ctx.fillRect(at,0,span,length);};
    bar(0,reach,.6);for(let i=0;i<CUE_STEPS;i++)bar(reach+i*step,step,.6*(1-(i+.5)/CUE_STEPS));
    // Le libellé se pose à côté de l'emplacement des flèches de menace, sans les recouvrir.
    const middle=(lo+hi)/2,tx=horizontal?middle:edge+sign*(margin+3),ty=horizontal?edge+sign*(margin+15):middle+30;
    ctx.font='bold '+(compact?10:11)+'px Bahnschrift,sans-serif';ctx.textBaseline='middle';ctx.textAlign=horizontal?'center':low?'left':'right';
    if('letterSpacing' in ctx)ctx.letterSpacing='1.5px';
    const label=CUE_LABELS[front],ox=horizontal?30+ctx.measureText(label).width/2:0;
    ctx.fillStyle='rgba(8,10,9,'+(.8*alpha).toFixed(3)+')';ctx.fillText(label,tx+ox+1,ty+1);
    ctx.fillStyle='rgba(224,212,184,'+(.88*alpha).toFixed(3)+')';ctx.fillText(label,tx+ox,ty);
   }finally{ctx.restore();}
   drawn++;
  }
  return drawn;
 }
 // Peintre complet, pour une image isolée : passe au sol puis passe au-dessus de la nuit.
 function paint(ctx,g){
  if(!ctx)return 0;
  const f=frameOf(g);if(!f)return 0;
  ctx.save();
  try{worldTransform(ctx,g,f.zoom);groundPass(ctx,f);}finally{ctx.restore();}
  overlayPass(ctx,g,f);
  return f.list.length;
 }
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
  // Deux points d'accroche : le sol de la scène (sous les corps, les acteurs et les bâtiments) pour la
  // masse, puis la nuit (au-dessus du masque) pour le liseré et le repère. Sans peintre de sol, la nuit
  // porte l'image entière.
  const drawGround=g.drawGround,drawNight=g.drawNight,layered=typeof drawGround==='function';
  if(layered)g.drawGround=function(...args){
   const result=drawGround.apply(this,args);
   // Seule la scène locale du canvas principal reçoit la masse, pas les plans ni les projections.
   if(args[0]&&(!g.ctx||args[0]===g.ctx)&&!args[1]?.homeProjection){const f=frameOf(g);if(f){args[0].save();try{groundPass(args[0],f);}finally{args[0].restore();}}}
   return result;
  };
  if(typeof drawNight==='function')g.drawNight=function(...args){
   const result=drawNight.apply(this,args);
   if(!layered)paint(args[0],g);else if(args[0]){const f=frameOf(g);if(f)overlayPass(args[0],g,f);}
   return result;
  };
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;render();}return result;};
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);clock=-Infinity;render();return result;};}
  g.hordeHorizon217=Object.freeze({render,horizon:()=>horizon(g),silhouettes:options=>silhouettes(g,options),paint:ctx=>paint(ctx,g),sentence:()=>sentence(horizon(g))});
  render();return true;
 }
 return Object.freeze({install,horizon,sentence,silhouettes,paint,limits:Object.freeze({cap:CAP,capLow:CAP_LOW,heads:HEADS,headsLow:HEADS_LOW,band:BAND,clearance:CLEARANCE_MAX,clearing:PLAYER_CLEARING,cue:CUE+CUE_MARGIN})});
});
