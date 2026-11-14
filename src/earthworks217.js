/* Travaux de terrain (docs/GAME_BIBLE.md §7.13), première tranche : le fossé. NOUVELLES campagnes seulement.
   - Le fossé se choisit au catalogue (onglet Défense) et se pose case par case, dans l'emprise de la cité. La pose
     finance le chantier ; il est ensuite creusé à la main, par les ouvriers ou par le Commandant immobile à portée.
   - Un fossé ouvert ralentit l'infecté qui le traverse et alourdit le coût de passage lu par le champ de flux.
     Il ne bloque personne, n'inflige aucun dégât et ne gêne ni les ouvriers ni le Commandant.
   - Un infecté abattu dans le fossé ou à son bord y tombe. À pleine capacité, le fossé est comblé : il ne ralentit
     plus et ne détourne plus, jusqu'à ce qu'on le déblaie (ordre « déblayer » des ouvriers, corvée comprise).
   Registre creux, sauvegardé par case. Aucun tirage aléatoire, aucune horloge propre. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Earthworks217Rules;
 const ID='ditch217',TILE=C.TILE,TILES=C.WORLD_TILES,KEYS=['version','active','ditches'],CELL=['x','y','dug','fill'];
 const NAME='Fossé',ICON='▬',DESCRIPTION='Ralentit les infectés qui le traversent, sans bloquer aucun passage. Les corps le comblent : à déblayer.';
 // Réglages techniques, sans effet sur l'équilibrage : relecture des priorités d'un ouvrier, silence entre deux annonces.
 const RETHINK_SECONDS=1,QUIET_SECONDS=10,WORKER_DANGER=105;
 const TIER=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.unlockTier].name);
 function initial(){return{version:1,active:false,ditches:[]};}
 function fresh(){return{version:1,active:true,ditches:[]};}
 const key=(x,y)=>x+y*TILES;
 const within=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 const inMap=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&y>=1&&x<TILES-2&&y<TILES-2;
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Travaux de terrain 217 invalides.');};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k)))bad();
  if(!Array.isArray(raw.ditches)||raw.ditches.length>R.maxDitches||!raw.active&&raw.ditches.length)bad();
  const seen=new Set();
  const ditches=raw.ditches.map(d=>{
   if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).length!==CELL.length||Object.keys(d).some(k=>!CELL.includes(k)))bad();
   if(!inMap(d.x,d.y)||!within(d.dug,R.digSeconds)||!within(d.fill,R.capacity)||seen.has(key(d.x,d.y)))bad();
   // Seul un fossé creusé reçoit des corps.
   if(d.fill>0&&d.dug<R.digSeconds)bad();
   seen.add(key(d.x,d.y));return{x:d.x,y:d.y,dug:d.dug,fill:d.fill};
  });
  return{version:1,active:raw.active,ditches};
 }
 const dug=d=>d.dug>=R.digSeconds,full=d=>d.fill>=R.capacity,open=d=>dug(d)&&!full(d);
 const centre=d=>({x:d.x*TILE+TILE/2,y:d.y*TILE+TILE/2});
 // Distance d'un point à l'emprise de la case, en pixels (0 à l'intérieur).
 function rimDistance(d,x,y){const dx=Math.max(d.x*TILE-x,0,x-(d.x+1)*TILE),dy=Math.max(d.y*TILE-y,0,y-(d.y+1)*TILE);return Math.hypot(dx,dy);}
 // Fossé qui reçoit un corps tombé en (x, y) : le plus proche des fossés creusés et non comblés, bord compris.
 function catcher(ditches,x,y){
  let best=null,near=Infinity;
  for(const d of ditches){if(!open(d))continue;const distance=rimDistance(d,x,y);if(distance<=R.rimDistance&&distance<near){near=distance;best=d;}}
  return best;
 }
 const percent=n=>Math.round(n*100)+' %',many=(n,one,more)=>n+' '+(n>1?more:one);
 function install(g){
  if(g.earthworks217)return g.earthworks217;if(!g.expansions)throw Error('Installer les opérations avant les travaux de terrain.');
  let state=initial(),cells=new Map(),bound=null,quietFull=-Infinity,quietDug=-Infinity,last=null;
  const claims=new WeakMap();
  const active=()=>state.active,playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const unlocked=()=>active()&&(g.tier?.id||0)>=R.unlockTier;
  const index=()=>{cells=new Map(state.ditches.map(d=>[key(d.x,d.y),d]));};
  const at=(x,y)=>cells.get(key(x,y))||null;
  // Le champ de flux et les trajets en cache relisent le coût de passage.
  const reroute=()=>{if(g.world){g.world.navigationVersion++;g.world.flowDirty=true;}g.flowTimer=0;};
  function bind(){
   const w=g.world;if(!w||bound===w)return;bound=w;
   const cost=w.movementCost.bind(w),place=w.placement.bind(w);
   // Même lecture que les ouvrages : le fossé ouvert ajoute un coût, il ne ferme jamais une case.
   w.movementCost=(gx,gy,...rest)=>{const v=cost(gx,gy,...rest),d=cells.size?at(gx,gy):null;return d&&open(d)?v+R.flowCost:v;};
   // Aucun ouvrage ne se pose sur un fossé : il faut d'abord le remblayer.
   w.placement=(def,gx,gy,rotation=0,ignoreId=0)=>{
    const result=place(def,gx,gy,rotation,ignoreId);if(!result.valid||!cells.size)return result;
    const d=def?.id&&Object.hasOwn(C.BUILDINGS,def.id)?w.definition(def.id):def,size=Array.isArray(d?.size)?d.size:[1,1],turned=Math.abs(rotation)%2===1;
    const width=turned?size[1]:size[0],height=turned?size[0]:size[1];
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(at(gx+x,gy+y))return{valid:false,reason:'Fossé à remblayer d’abord'};
    return result;
   };
   if(state.ditches.some(open)){w.flowDirty=true;g.flowTimer=0;}
  }
  // Un ouvrage posé par un autre chemin (plan, reprise) remblaie le fossé qu'il recouvre.
  function reconcile(){
   if(!g.world||!state.ditches.length)return;
   const kept=state.ditches.filter(d=>!g.world.atCell(d.x,d.y));
   if(kept.length!==state.ditches.length){const changed=state.ditches.some(d=>open(d)&&g.world.atCell(d.x,d.y));state.ditches=kept;index();if(changed)reroute();}
  }
  const speed=(x,y)=>{if(!cells.size)return 1;const d=at(C.grid(x),C.grid(y));return d&&open(d)?R.slowFactor:1;};
  function quote(gx,gy){
   if(!active())return{ok:false,reason:'Cette campagne a commencé avant les travaux de terrain.'};
   if(!unlocked())return{ok:false,reason:'Technologie non disponible.'};
   if(!playing())return{ok:false,reason:'Aucune campagne en cours.'};
   bind();
   if(!inMap(gx,gy))return{ok:false,reason:'Hors de la zone'};
   if(at(gx,gy))return{ok:false,reason:'Un fossé occupe déjà cette case'};
   // Même terrain qu'une palissade d'une case : ressources, décor, relevés et véhicules gardent leurs règles de pose.
   const check=g.world.placement(C.BUILDINGS.woodWall,gx,gy,0);if(!check.valid)return{ok:false,reason:check.reason};
   const core=g.core?.();
   if(!core||Math.max(Math.abs(gx-C.grid(core.x)),Math.abs(gy-C.grid(core.y)))>R.cityRadiusTiles)return{ok:false,reason:'Hors de l’emprise de la cité'};
   if(state.ditches.length>=R.maxDitches)return{ok:false,reason:'Limite de fossés atteinte : remblayez-en un'};
   if(!C.canAfford(g.resources,R.cost))return{ok:false,reason:'Ressources insuffisantes.'};
   return{ok:true};
  }
  // Pose : le chantier est financé ; il reste à creuser.
  function dig(gx,gy){
   const q=quote(gx,gy);if(!q.ok){g.notify?.(q.reason,'danger');return q;}
   C.spend(g.resources,R.cost);const d={x:gx,y:gy,dug:0,fill:0};state.ditches.push(d);cells.set(key(gx,gy),d);
   g.audio?.build?.();const p=centre(d);g.floaters?.push({x:p.x,y:p.y-20,text:'FOSSÉ',color:'#d2a84a',life:1,maxLife:1});
   g.refreshMetrics?.(true);return{ok:true};
  }
  function excavate(d,work){
   if(dug(d)||!(work>0))return 0;
   const before=d.dug;d.dug=Math.min(R.digSeconds,d.dug+work);
   if(dug(d)){reroute();const now=Number(g.elapsed)||0;if(now>=quietDug){quietDug=now+QUIET_SECONDS;g.notify?.('Fossé creusé : il ralentit les infectés qui le traversent.','good');}}
   return d.dug-before;
  }
  // Déblaiement : même geste que pour un mur ; les corps visibles de la case partent avec la charge.
  function shovel(d,amount){
   if(!(d.fill>0)||!(amount>0))return 0;
   const before=d.fill,wasFull=full(d);d.fill=Math.max(0,before-amount);
   let removed=Math.ceil(before)-Math.ceil(d.fill);
   for(let i=(g.corpses?.length||0)-1;i>=0&&removed>0;i--){const c=g.corpses[i];if(!(c.altitude>0)&&rimDistance(d,c.x,c.y)<=R.rimDistance){g.corpses.splice(i,1);removed--;}}
   if(wasFull&&!full(d)){reroute();g.notify?.('Fossé rouvert : il ralentit de nouveau.','good');}
   return before-d.fill;
  }
  function receive(x,y){
   const d=catcher(state.ditches,x,y);if(!d)return false;
   d.fill=Math.min(R.capacity,d.fill+1);
   if(full(d)){reroute();const now=Number(g.elapsed)||0;if(now>=quietFull){quietFull=now+QUIET_SECONDS;g.notify?.('Un fossé est comblé de corps : il ne ralentit plus. Faites-le déblayer.','danger');}}
   return true;
  }
  const effort=()=>g.balance217?.effort?.()??1;
  const dutySpeed=()=>g.cityLaws217?.duty?.()>0?C.CityLaws217Rules.clearingDuty.speed:1;
  const pending=mode=>mode==='dig'?d=>!dug(d):d=>dug(d)&&d.fill>0;
  function release(u){const memo=claims.get(u);if(memo?.mine){memo.mine=false;memo.target=null;u.state='idle';u.think=0;}return false;}
  // Un ouvrier libre sert les fossés : chantier après les chantiers d'ouvrages (ordres auto et bâtir), déblaiement
  // après les murs (ordre déblayer). Renvoie vrai quand l'ouvrier est pris en charge pour ce pas.
  function updateAssignedUnit(u,dt){
   if(!active()||!state.ditches.length||!u||u.dead||u.kind!=='worker'||!(dt>0)||!Number.isFinite(dt)||!playing())return u?release(u):false;
   const order=g.workerOrder||'auto',mode=order==='clear'?'clear':order==='auto'||order==='build'?'dig':null;
   if(!mode||u.carry>0||u.state==='return')return release(u);
   const needs=pending(mode);if(!state.ditches.some(needs))return release(u);
   if(g.nearestZombie(u.x,u.y,WORKER_DANGER))return release(u);
   let memo=claims.get(u);const now=Number(g.elapsed)||0;
   if(!memo||memo.mode!==mode||memo.world!==g.world||now>=memo.until||now<memo.since){
    const native=mode==='dig'?g.world.incomplete().some(b=>g.workerJobAvailable(u,'build:'+b.id)):Boolean(g.workerCleanupTarget(u));
    memo={mode,world:g.world,since:now,until:now+RETHINK_SECONDS,native,target:memo?.mode===mode?memo.target:null,mine:Boolean(memo?.mine)};claims.set(u,memo);
   }
   if(memo.native)return release(u);
   let d=memo.target;
   if(!d||at(d.x,d.y)!==d||!needs(d)||!g.workerJobAvailable(u,'ditch217:'+key(d.x,d.y))){
    d=null;let best=Infinity;
    for(const other of state.ditches){if(!needs(other)||!g.workerJobAvailable(u,'ditch217:'+key(other.x,other.y)))continue;const p=centre(other),score=(p.x-u.x)**2+(p.y-u.y)**2;if(score<best){best=score;d=other;}}
    memo.target=d;
   }
   if(!d)return release(u);
   memo.mine=true;u.state=mode==='dig'?'build':'clear';u.targetNode=-1;u.targetBuilding=-1;
   const p=centre(d);
   if(g.workerCanWorkAt(u,p,R.workRange)){
    const done=mode==='dig'?excavate(d,dt*effort()):shovel(d,dt*C.WORKER_RULES.cleanupPerSecond*effort()*dutySpeed());
    if(done>0)g.recordActorAction159?.(u,mode==='dig'?'build':'clear',1.2,{continuous:true,facing:Math.atan2(p.y-u.y,p.x-u.x)});
   }else g.moveWorkerToJob(u,p,dt,'ditch217:'+key(d.x,d.y));
   return true;
  }
  // Le Commandant creuse ou déblaie le fossé à sa portée quand il reste sur place, à pied et les mains libres.
  function commander(dt){
   const p=g.player;if(!p||p.dead||!(p.health>0)||p.regionAbsent){last=null;return;}
   const still=last&&Math.hypot(p.x-last.x,p.y-last.y)<.05;last={x:p.x,y:p.y};
   if(!still||!state.ditches.length||g.selectedBuild||g.rallyPlacement||p.reload>0||g.input?.mouseDown||g.input?.touchFire||g.expansions.busy()||g.linecare?.toolActive?.()
    ||g.fieldcraft?.context?.().mounted||g.expeditions?.driving?.()||g.frontier?.position?.()?.active)return;
   const calm=g.phase==='calm'||g.phase==='aftermath';
   let d=null,best=Infinity;
   for(const other of state.ditches){
    const work=!dug(other)||other.fill>0&&calm;if(!work)continue;
    const c=centre(other),score=(c.x-p.x)**2+(c.y-p.y)**2+(dug(other)?1e6:0);
    if(score<best&&g.workerCanWorkAt(p,c,R.workRange)){best=score;d=other;}
   }
   if(!d||g.nearestZombie(p.x,p.y,C.LINECARE_RULES.dangerRadius))return;
   if(dug(d)){shovel(d,dt*C.LINECARE_RULES.shovelPerSecond);if(!g.interactionText)g.interactionText='Vous déblayez le fossé · '+Math.ceil(d.fill)+' corps';}
   else{excavate(d,dt);if(!g.interactionText)g.interactionText='Vous creusez le fossé · '+percent(d.dug/R.digSeconds);}
   p.action='build';
  }
  function tick(dt){
   if(!active()||!playing())return;
   bind();reconcile();
   if(dt>0&&Number.isFinite(dt)&&!g.paused&&!g.activeOverlay)commander(dt);
  }
  // Remblai : referme le fossé le plus proche du Commandant. Rien n'est rendu.
  function nearest(){
   const p=g.player;if(!p||p.dead||p.regionAbsent)return null;
   let d=null,best=R.workRange**2;
   for(const other of state.ditches){const c=centre(other),score=(c.x-p.x)**2+(c.y-p.y)**2;if(score<=best){best=score;d=other;}}
   return d;
  }
  function backfillQuote(){
   if(!active())return{ok:false,reason:'Cette campagne a commencé avant les travaux de terrain.'};
   if(!state.ditches.length)return{ok:false,reason:'Aucun fossé à remblayer.'};
   if(!g.expansions.canAct()||g.frontier?.position?.()?.active)return{ok:false,reason:'Commandant indisponible.'};
   if(g.phase==='warning'||g.phase==='assault')return{ok:false,reason:'Aucun remblai de l’alerte à la fin de l’assaut.'};
   const d=nearest();if(!d)return{ok:false,reason:'Rejoignez à pied le fossé à remblayer.'};
   return{ok:true,ditch:d};
  }
  function backfill(){
   const q=backfillQuote();if(!q.ok)return{ok:false,reason:q.reason};
   const wasOpen=open(q.ditch);state.ditches=state.ditches.filter(d=>d!==q.ditch);index();if(wasOpen)reroute();
   g.notify?.('Fossé remblayé. Le bois du chantier n’est pas rendu.');g.audio?.build?.();g.save?.(false);return{ok:true};
  }
  const tally=()=>{const out={total:state.ditches.length,site:0,open:0,full:0,bodies:0};for(const d of state.ditches){if(!dug(d))out.site++;else if(full(d))out.full++;else out.open++;out.bodies+=d.fill;}return out;};
  function overview(){
   if(!active())return{summary:'Cette campagne a commencé avant les travaux de terrain : le fossé n’apparaît pas à son catalogue. La règle ne s’active pas en cours de campagne.',rows:[{label:'Fossés',value:'Sans objet.'}]};
   const rule='Un fossé ouvert ralentit l’infecté qui le traverse (vitesse ×'+String(R.slowFactor).replace('.',',')+') et détourne une partie de la horde. Il ne bloque aucun passage et n’inflige aucun dégât. Chaque case absorbe '+R.capacity+' corps, puis elle est comblée et n’a plus d’effet.';
   if(!unlocked())return{summary:'Les travaux de terrain viendront à l’âge '+TIER+'.',rows:[{label:'Fossés',value:'Aucun avant l’âge '+TIER},{label:'Règle',value:rule}]};
   const t=tally();
   return{summary:t.full?(t.full>1?t.full+' fossés comblés : ils ne ralentissent plus':'1 fossé comblé : il ne ralentit plus')+'. Passez les ouvriers à l’ordre « déblayer ».':t.total?'Les fossés tiennent. Surveillez leur comblement après chaque assaut.':'Aucun fossé. Choisissez « '+NAME+' » au catalogue, onglet Défense, et posez-le devant un mur.',rows:[
    {label:'Fossés',value:t.total?many(t.open,'ouvert','ouverts')+' · '+many(t.full,'comblé','comblés')+' · '+many(t.site,'en chantier','en chantier')+' · '+Math.ceil(t.bodies)+' corps dedans':'Aucun ('+R.maxDitches+' au plus).'},
    {label:'Chantier',value:C.resourceText(R.cost)+' par case, puis '+R.digSeconds+' s de travail : ouvriers aux ordres « auto » ou « bâtir » après les autres chantiers, ou Commandant immobile à portée.'},
    {label:'Règle',value:rule},
    {label:'Déblaiement',value:'Ordre « déblayer » : les ouvriers vident les fossés après les murs, à la même cadence. Le Commandant immobile à portée déblaie aussi, hors assaut.'}]};
  }
  function actions(){
   if(!active())return[];
   const q=backfillQuote();
   return[{id:'backfill',label:'Remblayer le fossé le plus proche',description:'Referme la case et libère l’emplacement. Le bois du chantier n’est pas rendu.',disabled:!q.ok,reason:q.reason||'Immédiat, hors assaut.',run:backfill}];
  }
  // Catalogue : l'entrée du fossé s'ajoute à l'onglet Défense des campagnes qui suivent la règle.
  const listed=()=>unlocked()&&g.currentCategory==='defense';
  const entry=()=>{const list=g.ui?.buildList;return list?Array.from(list.children||[]).find(n=>n?.dataset?.buildId===ID)||null:null;};
  function catalogue(){
   const list=g.ui?.buildList,doc=root.document;if(!list)return;
   let node=entry();
   if(!listed()){if(node){if(typeof node.remove==='function')node.remove();else list.removeChild?.(node);}if(g.selectedBuild===ID&&!unlocked())g.selectedBuild=null;return;}
   const selected=g.selectedBuild===ID,affordable=C.canAfford(g.resources,R.cost);
   if(!node){
    if(!doc?.createElement)return;
    node=doc.createElement('button');node.dataset.buildId=ID;
    node.innerHTML='<span class="build-icon">'+ICON+'</span><span class="build-copy"><strong>'+NAME+'</strong><small>'+DESCRIPTION+'</small><span class="build-cost">'+C.resourceText(R.cost)+'</span></span>';
    node.addEventListener?.('click',()=>g.selectBuild(ID));list.appendChild(node);
   }
   node.className='build-item'+(selected?' selected':'')+(affordable?' is-affordable':'');
  }
  const menu=g.refreshBuildMenu;
  if(typeof menu==='function')g.refreshBuildMenu=function(...args){const result=menu.apply(this,args);try{catalogue();}catch(error){/* l'entrée de catalogue ne bloque jamais le menu */}return result;};
  const afford=g.refreshBuildAffordability;
  if(typeof afford==='function')g.refreshBuildAffordability=function(...args){const result=afford.apply(this,args);try{if(entry())catalogue();}catch(error){/* idem */}return result;};
  // Le fossé n'est pas un ouvrage du monde : la pose, l'aperçu et le tracé en ligne lui sont propres.
  const lineWall=g.isLineWall;
  g.isLineWall=function(def,...rest){return def?lineWall.call(this,def,...rest):false;};
  const placeOne=g.placeOne;
  g.placeOne=function(type,gx,gy,...rest){return type===ID?dig(gx,gy).ok:placeOne.call(this,type,gx,gy,...rest);};
  const placement=g.drawPlacement;
  if(typeof placement==='function')g.drawPlacement=function(ctx,...rest){
   if(this.rallyPlacement||this.selectedBuild!==ID)return placement.call(this,ctx,...rest);
   const gx=C.grid(this.input.mouseWorldX),gy=C.grid(this.input.mouseWorldY),ok=quote(gx,gy).ok;
   ctx.save();ctx.globalAlpha=.58;ctx.fillStyle=ok?'rgba(111,164,102,.55)':'rgba(183,71,62,.55)';ctx.fillRect(gx*TILE+2,gy*TILE+2,TILE-4,TILE-4);
   ctx.strokeStyle='rgba(255,255,255,.7)';ctx.strokeRect(gx*TILE+2,gy*TILE+2,TILE-4,TILE-4);ctx.restore();
  };
  // Un infecté abattu au sol, dans un fossé ouvert ou à son bord, y tombe.
  const kill=g.killZombie;
  g.killZombie=function(z,...rest){
   const watch=active()&&cells.size&&z&&!z.dead,pose=watch?g.vertical175?.corpsePose?.(z):null,x=z?.x,y=z?.y;
   const result=kill.call(this,z,...rest);
   if(watch&&z.dead&&!(Number.isFinite(pose?.z)&&pose.z>0))receive(x,y);
   return result;
  };
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(this,dt,...rest);tick(dt);return result;};
  // Rendu au sol : tranchée sombre, corps visibles et jauge de comblement ; un fossé comblé est plein à ras bord.
  function paint(ctx,view){
   const pad=TILE,cap=R.capacity;
   for(const d of state.ditches){
    const x=d.x*TILE,y=d.y*TILE;
    if(view&&(x+TILE+pad<view.left||x-pad>view.right||y+TILE+pad<view.top||y-pad>view.bottom))continue;
    // Une tranchée continue : pas de bord entre deux cases voisines.
    const side=(dx,dy)=>at(d.x+dx,d.y+dy)?0:4,l=side(-1,0),r=side(1,0),t=side(0,-1),b=side(0,1);
    const ix=x+l,iy=y+t,iw=TILE-l-r,ih=TILE-t-b;
    ctx.save();
    if(!dug(d)){
     const done=d.dug/R.digSeconds;
     ctx.fillStyle='rgba(58,44,28,'+(.25+.5*done).toFixed(3)+')';ctx.fillRect(ix,iy,iw,ih);
     ctx.strokeStyle='#c9a45c';ctx.lineWidth=1.5;ctx.setLineDash?.([5,4]);ctx.strokeRect(ix+1,iy+1,iw-2,ih-2);ctx.setLineDash?.([]);
     ctx.fillStyle='#211f19';ctx.fillRect(x+5,y+TILE-8,TILE-10,3);ctx.fillStyle='#c9a45c';ctx.fillRect(x+5,y+TILE-8,(TILE-10)*done,3);
     ctx.restore();continue;
    }
    const closed=full(d);
    // Déblai clair en bordure, puis le creux.
    ctx.fillStyle='#6b5a40';ctx.fillRect(ix,iy,iw,ih);
    ctx.fillStyle=closed?'#4b382e':'#2a2118';ctx.fillRect(ix+(l?2:0),iy+(t?2:0),iw-(l?2:0)-(r?2:0),ih-(t?2:0)-(b?2:0));
    if(!closed){ctx.fillStyle='#17120d';ctx.fillRect(ix+(l?5:0),iy+(t?5:0),iw-(l?5:0)-(r?5:0),ih-(t?5:0)-(b?5:0));}
    // Corps : positions fixées par la case et le rang, sans hasard.
    const bodies=Math.min(cap,Math.ceil(d.fill));
    for(let i=0;i<bodies;i++){
     const h=((d.x*73+d.y*151+i*97)%360)/360,bx=x+6+((i*11+d.x*5)%(TILE-12)),by=y+7+((i*7+d.y*3)%(TILE-14));
     ctx.fillStyle=i%2?'#5a5346':'#6a4a40';ctx.beginPath();
     if(ctx.ellipse)ctx.ellipse(bx,by,5.5,2.6,h*Math.PI,0,Math.PI*2);else ctx.arc(bx,by,3.5,0,Math.PI*2);
     ctx.fill();
    }
    if(closed){
     ctx.strokeStyle='#b0563f';ctx.lineWidth=2;ctx.strokeRect(ix+1,iy+1,iw-2,ih-2);
     ctx.beginPath();ctx.moveTo(ix+3,iy+3);ctx.lineTo(ix+iw-3,iy+ih-3);ctx.moveTo(ix+iw-3,iy+3);ctx.lineTo(ix+3,iy+ih-3);ctx.stroke();
    }else if(d.fill>0){
     // Jauge : un cran par corps que la case peut encore absorber.
     const w=(TILE-10)/cap;
     for(let i=0;i<cap;i++){ctx.fillStyle=i<bodies?'#d08a4e':'rgba(20,16,12,.8)';ctx.fillRect(x+5+i*w,y+TILE-7,w-1,3);}
    }
    ctx.restore();
   }
  }
  const ground=g.drawGround;
  if(typeof ground==='function')g.drawGround=function(...args){
   const result=ground.apply(this,args);
   if(active()&&state.ditches.length&&args[0]&&playing())try{paint(args[0],args[1]);}catch(error){/* un dessin ne bloque jamais la partie */}
   return result;
  };
  const snapshot=()=>{reconcile();return validate(state);};
  const load=next=>{state=next;index();last=null;quietFull=quietDug=-Infinity;if(g.world){g.world.flowDirty=true;g.flowTimer=0;}try{g.refreshBuildMenu?.(true);}catch(error){/* menu absent hors partie */}};
  const api=Object.freeze({ID,active,unlocked,speed,at:(x,y)=>{const d=at(x,y);return d?{...d,dug:dug(d),work:d.dug,full:full(d),open:open(d)}:null;},list:()=>state.ditches.map(d=>({...d})),
   tally,quote,dig,backfill,backfillQuote,receive,updateAssignedUnit,tick,overview,actions,snapshot});
  g.earthworks217=api;
  g.expansions.register({id:'earthworks217',title:'Travaux de terrain',overview,actions,validate,snapshot,restore:raw=>load(validate(raw)),reset:()=>load(fresh())});
  return api;
 }
 const api=Object.freeze({ID,initial,fresh,validate,rimDistance,catcher,install});root.DeadwallEarthworks217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
