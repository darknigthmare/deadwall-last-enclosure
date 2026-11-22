/* Travaux de terrain (docs/GAME_BIBLE.md §7.13) : fossé, talus, douve, remblai. NOUVELLES campagnes seulement.
   - Fossé et talus se choisissent au catalogue (onglet Défense) et se tracent en ligne, dans l'emprise de la cité.
     La pose finance le chantier ; il est ensuite accompli à la main, par les ouvriers ou par le Commandant qui
     tient ACTION / E à portée.
   - Un fossé ouvert ralentit l'infecté qui le traverse et alourdit le coût de passage lu par le champ de flux.
     Il ne bloque personne, n'inflige aucun dégât et ne gêne ni les ouvriers ni le Commandant.
   - Un infecté abattu dans le fossé ou à son bord y tombe. À pleine capacité, le fossé est comblé : il ne ralentit
     plus et ne détourne plus, jusqu'à ce qu'on le déblaie (ordre « déblayer » des ouvriers, corvée comprise).
   - Chaque case creusée donne de la terre. Le talus la consomme : adossé à un mur, il exige plus de corps pour le
     franchir ; au bord d'un fossé ouvert, il le rend plus lent à traverser. Il ne ferme jamais une case.
   - La douve est un fossé mis en eau avec l'eau de cité (src/city-water215.js) : plus lente, plus longue à combler,
     entretenue par les citernes. En pénurie elle se vide et redevient un fossé. Ses corps comptent pour la salubrité.
   - Le remblai coûte de la terre, ou à défaut de la pierre, puis du travail.
   Registre creux, sauvegardé par case. Aucun tirage aléatoire, aucune horloge propre. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Earthworks217Rules,B=R.talus,M=R.moat,F=R.backfill;
 const ID='ditch217',BANK='bank217',TILE=C.TILE,TILES=C.LOCAL_MAP217.tiles;
 const KEYS=['version','active','earth','ditches','banks'],CELL=['x','y','dug','fill','wet','back'],MOUND=['x','y','built'],KEYS1=['version','active','ditches'],CELL1=['x','y','dug','fill'];
 const ENTRIES=Object.freeze([
  Object.freeze({id:ID,name:'Fossé',icon:'▬',description:'Ralentit les infectés qui le traversent, sans bloquer aucun passage. Les corps le comblent : à déblayer. Glissez pour tracer une ligne.'}),
  Object.freeze({id:BANK,name:'Talus',icon:'▲',description:'Fait avec la terre des fossés. Adossé à un mur, il faut plus de corps pour le franchir ; au bord d’un fossé, il le rend plus lent.'})]);
 // Réglages techniques, sans effet sur l'équilibrage : relecture des priorités d'un ouvrier, silence entre deux annonces.
 const RETHINK_SECONDS=1,QUIET_SECONDS=10,WORKER_DANGER=105,EPS=1e-9;
 const TIER=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.unlockTier].name);
 function initial(){return{version:2,active:false,earth:0,ditches:[],banks:[]};}
 function fresh(){return{version:2,active:true,earth:0,ditches:[],banks:[]};}
 const key=(x,y)=>x+y*TILES;
 const within=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 const inMap=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&y>=1&&x<TILES-2&&y<TILES-2;
 const shape=(o,keys)=>Boolean(o)&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&Object.keys(o).every(k=>keys.includes(k));
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Travaux de terrain 217 invalides.');};
  // Forme de la première tranche ({version:1,active,ditches}) : acceptée et convertie. La terre des fossés déjà
  // creusés est tenue pour restée au bord : elle entre dans la réserve. Ni talus, ni douve, ni remblai en cours.
  const first=raw&&raw.version===1;
  if(!shape(raw,first?KEYS1:KEYS)||raw.version!==(first?1:2)||typeof raw.active!=='boolean')bad();
  if(!Array.isArray(raw.ditches)||raw.ditches.length>R.maxDitches||!raw.active&&raw.ditches.length)bad();
  const seen=new Set();
  const ditches=raw.ditches.map(d=>{
   if(!shape(d,first?CELL1:CELL))bad();
   const wet=first?false:d.wet,back=first?null:d.back;
   if(!inMap(d.x,d.y)||!within(d.dug,R.digSeconds)||!within(d.fill,first?R.capacity:M.capacity)||typeof wet!=='boolean'||back!==null&&!within(back,F.seconds)||seen.has(key(d.x,d.y)))bad();
   // Seul un fossé creusé reçoit des corps, de l'eau ou un remblai ; on ne remblaie ni une douve ni des corps.
   if(d.dug<R.digSeconds&&(d.fill>0||wet||back!==null)||back!==null&&(wet||d.fill>0||back>=F.seconds))bad();
   seen.add(key(d.x,d.y));return{x:d.x,y:d.y,dug:d.dug,fill:d.fill,wet,back};
  });
  if(first)return{version:2,active:raw.active,earth:Math.min(R.maxEarth,ditches.filter(d=>d.dug>=R.digSeconds).length*R.earthPerDitch),ditches,banks:[]};
  if(!within(raw.earth,R.maxEarth)||!Array.isArray(raw.banks)||raw.banks.length>B.maxBanks||!raw.active&&(raw.banks.length||raw.earth>0))bad();
  const banks=raw.banks.map(b=>{
   if(!shape(b,MOUND)||!inMap(b.x,b.y)||!within(b.built,B.buildSeconds)||seen.has(key(b.x,b.y)))bad();
   seen.add(key(b.x,b.y));return{x:b.x,y:b.y,built:b.built};
  });
  return{version:2,active:raw.active,earth:raw.earth,ditches,banks};
 }
 const dug=d=>d.dug>=R.digSeconds,cap=d=>d.wet?M.capacity:R.capacity,full=d=>d.fill>=cap(d);
 // Un fossé en cours de remblai n'a plus d'effet et ne reçoit plus de corps.
 const open=d=>dug(d)&&!full(d)&&(d.back===null||d.back===undefined);
 const built=b=>b.built>=B.buildSeconds;
 const centre=d=>({x:d.x*TILE+TILE/2,y:d.y*TILE+TILE/2});
 // Distance d'un point à l'emprise de la case, en pixels (0 à l'intérieur).
 function rimDistance(d,x,y){const dx=Math.max(d.x*TILE-x,0,x-(d.x+1)*TILE),dy=Math.max(d.y*TILE-y,0,y-(d.y+1)*TILE);return Math.hypot(dx,dy);}
 // Fossé qui reçoit un corps tombé en (x, y) : le plus proche des fossés creusés et non comblés, bord compris.
 function catcher(ditches,x,y){
  let best=null,near=Infinity;
  for(const d of ditches){if(!open(d))continue;const distance=rimDistance(d,x,y);if(distance<=R.rimDistance&&distance<near){near=distance;best=d;}}
  return best;
 }
 const percent=n=>Math.round(n*100)+' %',many=(n,one,more)=>n+' '+(n>1?more:one),num=n=>String(Math.round(n*100)/100).replace('.',',');
 const NEAR=[[1,0],[-1,0],[0,1],[0,-1]];
 function install(g){
  if(g.earthworks217)return g.earthworks217;if(!g.expansions)throw Error('Installer les opérations avant les travaux de terrain.');
  let state=initial(),cells=new Map(),mounds=new Map(),bound=null,quietFull=-Infinity,quietDug=-Infinity,quietBank=-Infinity;
  const claims=new WeakMap();
  const active=()=>state.active,playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const unlocked=()=>active()&&(g.tier?.id||0)>=R.unlockTier;
  const mine=id=>id===ID||id===BANK;
  const index=()=>{cells=new Map(state.ditches.map(d=>[key(d.x,d.y),d]));mounds=new Map(state.banks.map(b=>[key(b.x,b.y),b]));};
  const at=(x,y)=>cells.get(key(x,y))||null,bankAt=(x,y)=>mounds.get(key(x,y))||null;
  const isBank=o=>Object.hasOwn(o,'built');
  // Le champ de flux et les trajets en cache relisent le coût de passage.
  const reroute=()=>{if(g.world){g.world.navigationVersion++;g.world.flowDirty=true;}g.flowTimer=0;};
  const flanked=d=>mounds.size>0&&NEAR.some(([dx,dy])=>{const b=bankAt(d.x+dx,d.y+dy);return Boolean(b&&built(b));});
  // Mur ou porte dont l'emprise touche un talus achevé.
  function raised(building){
   if(!mounds.size||!building||!Number.isFinite(building.left))return false;
   const x0=Math.floor(building.left/TILE),x1=Math.ceil(building.right/TILE)-1,y0=Math.floor(building.top/TILE),y1=Math.ceil(building.bottom/TILE)-1;
   const up=(x,y)=>{const b=bankAt(x,y);return Boolean(b&&built(b));};
   for(let x=x0;x<=x1;x++)if(up(x,y0-1)||up(x,y1+1))return true;
   for(let y=y0;y<=y1;y++)if(up(x0-1,y)||up(x1+1,y))return true;
   return false;
  }
  function bind(){
   const w=g.world;if(!w||bound===w)return;bound=w;
   const cost=w.movementCost.bind(w),place=w.placement.bind(w);
   // Même lecture que les ouvrages : le fossé ouvert ajoute un coût, il ne ferme jamais une case.
   w.movementCost=(gx,gy,...rest)=>{const v=cost(gx,gy,...rest),d=cells.size?at(gx,gy):null;return d&&open(d)?v+(d.wet?M.flowCost:R.flowCost):v;};
   // Aucun ouvrage ne se pose sur un fossé ou un talus : il faut d'abord le remblayer ou l'araser.
   w.placement=(def,gx,gy,rotation=0,ignoreId=0)=>{
    const result=place(def,gx,gy,rotation,ignoreId);if(!result.valid||!cells.size&&!mounds.size)return result;
    const d=def?.id&&Object.hasOwn(C.BUILDINGS,def.id)?w.definition(def.id):def,size=Array.isArray(d?.size)?d.size:[1,1],turned=Math.abs(rotation)%2===1;
    const width=turned?size[1]:size[0],height=turned?size[0]:size[1];
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){if(at(gx+x,gy+y))return{valid:false,reason:'Fossé à remblayer d’abord'};if(bankAt(gx+x,gy+y))return{valid:false,reason:'Talus à araser d’abord'};}
    return result;
   };
   if(state.ditches.some(open)){w.flowDirty=true;g.flowTimer=0;}
  }
  // Un ouvrage posé par un autre chemin (plan, reprise) remblaie le fossé ou arase le talus qu'il recouvre.
  function reconcile(){
   if(!g.world||!state.ditches.length&&!state.banks.length)return;
   const kept=state.ditches.filter(d=>!g.world.atCell(d.x,d.y)),banks=state.banks.filter(b=>!g.world.atCell(b.x,b.y));
   if(kept.length!==state.ditches.length||banks.length!==state.banks.length){const changed=state.ditches.some(d=>open(d)&&g.world.atCell(d.x,d.y));state.ditches=kept;state.banks=banks;index();if(changed)reroute();}
  }
  const speed=(x,y)=>{if(!cells.size)return 1;const d=at(C.grid(x),C.grid(y));return d&&open(d)?(d.wet?M.slowFactor:R.slowFactor)*(flanked(d)?B.slowFactor:1):1;};
  // Corps supplémentaires qu'il faut pour franchir ce mur : ceux du talus qui l'adosse.
  const rampBonus=building=>active()&&raised(building)?B.rampBonus:0;
  const wallAt=(x,y)=>Boolean(g.world.atCell(x,y)?.def?.wall);
  // Terrain d'une case, sans regarder le stock : même terrain qu'une palissade d'une case, dans l'emprise.
  function site(type,gx,gy){
   if(!active())return{ok:false,reason:'Cette campagne a commencé avant les travaux de terrain.'};
   if(!unlocked())return{ok:false,reason:'Technologie non disponible.'};
   if(!playing())return{ok:false,reason:'Aucune campagne en cours.'};
   bind();
   if(!inMap(gx,gy))return{ok:false,reason:'Hors de la zone'};
   if(at(gx,gy))return{ok:false,reason:'Un fossé occupe déjà cette case'};
   if(bankAt(gx,gy))return{ok:false,reason:'Un talus occupe déjà cette case'};
   const check=g.world.placement(C.BUILDINGS.woodWall,gx,gy,0);if(!check.valid)return{ok:false,reason:check.reason};
   // Terrain de génération 12 (O7) : la rampe se barre d'un mur ou d'une porte, jamais d'un fossé (même grille que le champ de flux).
   if(type===ID&&g.world.terrain217&&g.world.terrainAt217(gx*TILE+TILE/2,gy*TILE+TILE/2)?.kind===2)return{ok:false,reason:'Pas de fossé sur une rampe : barrez-la d’un mur ou d’une porte.'};
   const core=g.core?.();
   if(!core||Math.max(Math.abs(gx-C.grid(core.x)),Math.abs(gy-C.grid(core.y)))>R.cityRadiusTiles)return{ok:false,reason:'Hors de l’emprise de la cité'};
   if(type===BANK){
    if(!NEAR.some(([dx,dy])=>at(gx+dx,gy+dy)||wallAt(gx+dx,gy+dy)))return{ok:false,reason:'Un talus s’adosse à un mur ou borde un fossé'};
    if(state.banks.length>=B.maxBanks)return{ok:false,reason:'Limite de talus atteinte : arasez-en un'};
   }else if(state.ditches.length>=R.maxDitches)return{ok:false,reason:'Limite de fossés atteinte : remblayez-en un'};
   return{ok:true};
  }
  const funded=type=>type===BANK?state.earth>=B.earth-EPS:C.canAfford(g.resources,R.cost);
  const short=type=>type===BANK?'Terre insuffisante : creusez d’abord des fossés ('+B.earth+' terre par talus).':'Ressources insuffisantes.';
  function quoteOf(type,gx,gy){const q=site(type,gx,gy);return !q.ok?q:funded(type)?{ok:true}:{ok:false,reason:short(type)};}
  const quote=(gx,gy)=>quoteOf(ID,gx,gy),bankQuote=(gx,gy)=>quoteOf(BANK,gx,gy);
  // Pose : le chantier est financé ; il reste à l'accomplir.
  function lay(type,gx,gy,quiet){
   const q=quoteOf(type,gx,gy);if(!q.ok){if(!quiet)g.notify?.(q.reason,'danger');return q;}
   let o;
   if(type===BANK){state.earth=Math.max(0,state.earth-B.earth);o={x:gx,y:gy,built:0};state.banks.push(o);mounds.set(key(gx,gy),o);}
   else{C.spend(g.resources,R.cost);o={x:gx,y:gy,dug:0,fill:0,wet:false,back:null};state.ditches.push(o);cells.set(key(gx,gy),o);}
   if(!quiet)g.audio?.build?.();const p=centre(o);g.floaters?.push({x:p.x,y:p.y-20,text:type===BANK?'TALUS':'FOSSÉ',color:'#d2a84a',life:1,maxLife:1});
   g.refreshMetrics?.(true);return{ok:true};
  }
  const dig=(gx,gy)=>lay(ID,gx,gy,false),raise=(gx,gy)=>lay(BANK,gx,gy,false);
  // Tracé en ligne : chaque case est jugée dans l'ordre du tracé, avec le stock qui reste après les précédentes.
  function plan(type,list){
   const out={type,cells:[],placeable:0,blocked:0,short:0,cost:type===BANK?{earth:0}:C.scaledCost(R.cost,0),text:''};
   if(!mine(type)||!Array.isArray(list)||!list.length||list.some(c=>!c||!Number.isInteger(c.x)||!Number.isInteger(c.y)))return out;
   const line=C.wallLine(list[0],list[list.length-1]).slice(0,R.maxLine);
   let room=type===BANK?B.maxBanks-state.banks.length:R.maxDitches-state.ditches.length;
   const stock=type===BANK?Math.floor((state.earth+EPS)/B.earth):Math.min(...Object.entries(R.cost).map(([k,v])=>Math.floor(((g.resources?.[k]||0)+EPS)/v)));
   for(const c of line){
    let q=site(type,c.x,c.y);
    // Un talus du même tracé ne sert pas d'appui au suivant : seuls un mur ou un fossé le portent.
    if(q.ok&&room<=0)q={ok:false,reason:type===BANK?'Limite de talus atteinte : arasez-en un':'Limite de fossés atteinte : remblayez-en un'};
    if(!q.ok){out.blocked++;out.cells.push({x:c.x,y:c.y,status:'blocked',reason:q.reason});continue;}
    if(out.placeable>=stock){out.short++;out.cells.push({x:c.x,y:c.y,status:'short',reason:short(type)});continue;}
    out.placeable++;room--;out.cells.push({x:c.x,y:c.y,status:'ok'});
   }
   out.cost=type===BANK?{earth:out.placeable*B.earth}:C.scaledCost(R.cost,out.placeable);
   const price=type===BANK?out.placeable*B.earth+' terre':C.resourceText(out.cost);
   out.text=many(out.placeable,'case','cases')+(out.placeable?' · '+price:'')+(out.short?' · stock épuisé pour '+out.short:'')+(out.blocked?' · '+many(out.blocked,'refusée','refusées'):'');
   return out;
  }
  function placeLine(type,list){
   const p=plan(type,list);if(!p.cells.length)return false;
   if(p.cells.length===1)return lay(type,p.cells[0].x,p.cells[0].y,false).ok;
   let placed=0;for(const c of p.cells)if(c.status==='ok'&&lay(type,c.x,c.y,true).ok)placed++;
   const what=type===BANK?'talus':'fossés',first=p.cells.find(c=>c.status==='blocked');
   if(!placed){g.notify?.('Tracé refusé : '+(first?.reason||short(type)),'danger');return false;}
   g.audio?.build?.();
   if(placed<p.cells.length)g.notify?.('Tracé partiel : '+placed+' cases de '+what+' sur '+p.cells.length+(p.short?' · stock épuisé pour '+p.short:'')+(first?' · '+many(p.blocked,'case refusée','cases refusées')+' ('+first.reason+')':'')+'.','danger');
   return true;
  }
  function excavate(d,work){
   if(dug(d)||!(work>0))return 0;
   const before=d.dug;d.dug=Math.min(R.digSeconds,d.dug+work);
   if(dug(d)){
    state.earth=Math.min(R.maxEarth,state.earth+R.earthPerDitch);reroute();
    const now=Number(g.elapsed)||0;if(now>=quietDug){quietDug=now+QUIET_SECONDS;g.notify?.('Fossé creusé : il ralentit les infectés qui le traversent. Sa terre attend un talus.','good');}
   }
   return d.dug-before;
  }
  function mound(b,work){
   if(built(b)||!(work>0))return 0;
   const before=b.built;b.built=Math.min(B.buildSeconds,b.built+work);
   if(built(b)){reroute();const now=Number(g.elapsed)||0;if(now>=quietBank){quietBank=now+QUIET_SECONDS;g.notify?.('Talus dressé.','good');}}
   return b.built-before;
  }
  // Remblai : le travail referme la case financée ; elle quitte alors le registre.
  function fillIn(d,work){
   if(d.back===null||!(work>0))return 0;
   const before=d.back;d.back=Math.min(F.seconds,d.back+work);
   if(d.back>=F.seconds){state.ditches=state.ditches.filter(o=>o!==d);cells.delete(key(d.x,d.y));g.notify?.('Fossé remblayé : l’emplacement est libre.','good');g.refreshMetrics?.(true);}
   return Math.min(F.seconds,before+work)-before;
  }
  // Déblaiement : même geste que pour un mur ; les corps visibles de la case partent avec la charge.
  function shovel(d,amount){
   if(!(d.fill>0)||!(amount>0))return 0;
   const before=d.fill,wasFull=full(d);d.fill=Math.max(0,before-amount);
   let removed=Math.ceil(before)-Math.ceil(d.fill);
   for(let i=(g.corpses?.length||0)-1;i>=0&&removed>0;i--){const c=g.corpses[i];if(!(c.altitude>0)&&rimDistance(d,c.x,c.y)<=R.rimDistance){g.corpses.splice(i,1);removed--;}}
   if(wasFull&&!full(d)){reroute();g.notify?.('Fossé rouvert : il ralentit de nouveau.','good');}
   // Filière des corps (src/corpse-chain217.js) : un corps sorti du fossé reste à traiter.
   g.corpseChain217?.receive?.(before-d.fill);
   return before-d.fill;
  }
  function receive(x,y){
   const d=catcher(state.ditches,x,y);if(!d)return false;
   d.fill=Math.min(cap(d),d.fill+1);
   if(full(d)){reroute();const now=Number(g.elapsed)||0;if(now>=quietFull){quietFull=now+QUIET_SECONDS;g.notify?.('Un fossé est comblé de corps : il ne ralentit plus. Faites-le déblayer.','danger');}}
   return true;
  }
  const effort=()=>g.balance217?.effort?.()??1;
  const dutySpeed=()=>g.cityLaws217?.duty?.()>0?C.CityLaws217Rules.clearingDuty.speed:1;
  // Chantier : fossé à creuser, talus à dresser, remblai à finir. Déblaiement : fossé creusé qui porte des corps.
  const building=o=>isBank(o)?!built(o):!dug(o)||o.back!==null;
  const pending=mode=>mode==='dig'?building:o=>!isBank(o)&&dug(o)&&o.fill>0;
  const listed=o=>isBank(o)?bankAt(o.x,o.y)===o:at(o.x,o.y)===o;
  const works=mode=>mode==='dig'?[...state.ditches,...state.banks]:state.ditches;
  const labour=(o,work)=>isBank(o)?mound(o,work):dug(o)?fillIn(o,work):excavate(o,work);
  function release(u){const memo=claims.get(u);if(memo?.mine){memo.mine=false;memo.target=null;u.state='idle';u.think=0;}return false;}
  // Un ouvrier libre sert les travaux de terrain : chantier après les chantiers d'ouvrages (ordres auto et bâtir),
  // déblaiement après les murs (ordre déblayer). Renvoie vrai quand l'ouvrier est pris en charge pour ce pas.
  function updateAssignedUnit(u,dt){
   if(!active()||!state.ditches.length&&!state.banks.length||!u||u.dead||u.kind!=='worker'||!(dt>0)||!Number.isFinite(dt)||!playing())return u?release(u):false;
   const order=g.workerOrder||'auto',mode=order==='clear'?'clear':order==='auto'||order==='build'?'dig':null;
   if(!mode||u.carry>0||u.state==='return')return release(u);
   const needs=pending(mode),all=works(mode);if(!all.some(needs))return release(u);
   if(g.nearestZombie(u.x,u.y,WORKER_DANGER))return release(u);
   let memo=claims.get(u);const now=Number(g.elapsed)||0;
   if(!memo||memo.mode!==mode||memo.world!==g.world||now>=memo.until||now<memo.since){
    const native=mode==='dig'?g.world.incomplete().some(b=>g.workerJobAvailable(u,'build:'+b.id)):Boolean(g.workerCleanupTarget(u));
    memo={mode,world:g.world,since:now,until:now+RETHINK_SECONDS,native,target:memo?.mode===mode?memo.target:null,mine:Boolean(memo?.mine)};claims.set(u,memo);
   }
   if(memo.native)return release(u);
   let d=memo.target;
   if(!d||!listed(d)||!needs(d)||!g.workerJobAvailable(u,'ditch217:'+key(d.x,d.y))){
    d=null;let best=Infinity;
    for(const other of all){if(!needs(other)||!g.workerJobAvailable(u,'ditch217:'+key(other.x,other.y)))continue;const p=centre(other),score=(p.x-u.x)**2+(p.y-u.y)**2;if(score<best){best=score;d=other;}}
    memo.target=d;
   }
   if(!d)return release(u);
   memo.mine=true;u.state=mode==='dig'?'build':'clear';u.targetNode=-1;u.targetBuilding=-1;
   const p=centre(d);
   if(g.workerCanWorkAt(u,p,R.workRange)){
    const done=mode==='dig'?labour(d,dt*effort()):shovel(d,dt*C.WORKER_RULES.cleanupPerSecond*effort()*dutySpeed());
    if(done>0)g.recordActorAction159?.(u,mode==='dig'?'build':'clear',1.2,{continuous:true,facing:Math.atan2(p.y-u.y,p.x-u.x)});
   }else g.moveWorkerToJob(u,p,dt,'ditch217:'+key(d.x,d.y));
   return true;
  }
  // Le Commandant, à pied et les mains libres, travaille le chantier à sa portée tant qu'il tient ACTION / E.
  function commander(dt){
   const p=g.player;if(!p||p.dead||!(p.health>0)||p.regionAbsent)return;
   if(!state.ditches.length&&!state.banks.length||g.selectedBuild||g.rallyPlacement||p.reload>0||g.input?.mouseDown||g.input?.touchFire||g.expansions.busy()||g.linecare?.toolActive?.()
    ||g.fieldcraft?.context?.().mounted||g.expeditions?.driving?.()||g.frontier?.position?.()?.active)return;
   const calm=g.phase==='calm'||g.phase==='aftermath';
   let d=null,best=Infinity;
   for(const other of works('dig')){
    const site=building(other),work=site||other.fill>0&&calm;if(!work)continue;
    const c=centre(other),score=(c.x-p.x)**2+(c.y-p.y)**2+(site?0:1e6);
    if(score<best&&g.workerCanWorkAt(p,c,R.workRange)){best=score;d=other;}
   }
   if(!d||g.nearestZombie(p.x,p.y,C.LINECARE_RULES.dangerRadius))return;
   const site=building(d);
   const label=isBank(d)?'dresser le talus · '+percent(d.built/B.buildSeconds):!dug(d)?'creuser le fossé · '+percent(d.dug/R.digSeconds):site?'remblayer le fossé · '+percent(d.back/F.seconds):'déblayer le fossé · '+Math.ceil(d.fill)+' corps';
   // Une action du jeu déjà proposée sur la touche (déposer, construire, récolter…) passe d'abord : un seul geste par
   // pression, jamais deux travaux à la fois.
   if(g.interactionText)return;
   g.interactionText='ACTION / E : '+label;
   // Geste explicite, comme les autres travaux à la main : rien ne se fait sans la touche d'action.
   if(!g.input?.keys?.has?.('KeyE'))return;
   if(site)labour(d,dt);else shovel(d,dt*C.LINECARE_RULES.shovelPerSecond);
   p.action='build';
  }
  function tick(dt){
   if(!active()||!playing())return;
   bind();reconcile();
   if(dt>0&&Number.isFinite(dt)&&!g.paused&&!g.activeOverlay)commander(dt);
  }
  // Case la plus proche du Commandant, à portée de travail.
  function nearest(list,wanted){
   const p=g.player;if(!p||p.dead||p.regionAbsent)return null;
   let d=null,best=R.workRange**2;
   for(const other of list){if(wanted&&!wanted(other))continue;const c=centre(other),score=(c.x-p.x)**2+(c.y-p.y)**2;if(score<=best){best=score;d=other;}}
   return d;
  }
  const gate=()=>!active()?'Cette campagne a commencé avant les travaux de terrain.':!g.expansions.canAct()||g.frontier?.position?.()?.active?'Commandant indisponible.':null;
  const sieged=()=>g.phase==='warning'||g.phase==='assault';
  // Remblai : ordre donné au fossé le plus proche. Il est payé en terre, à défaut en pierre, puis reste à faire.
  function backfillQuote(){
   if(!active())return{ok:false,reason:'Cette campagne a commencé avant les travaux de terrain.'};
   if(!state.ditches.length)return{ok:false,reason:'Aucun fossé à remblayer.'};
   const closed=gate();if(closed)return{ok:false,reason:closed};
   if(sieged())return{ok:false,reason:'Aucun remblai de l’alerte à la fin de l’assaut.'};
   const d=nearest(state.ditches);if(!d)return{ok:false,reason:'Rejoignez à pied le fossé à remblayer.'};
   if(d.back!==null)return{ok:false,reason:'Ce remblai est déjà financé : il reste à le faire.'};
   // Un chantier jamais creusé n'a rien à refermer : il s'annule sans coût.
   if(!dug(d))return{ok:true,ditch:d,pay:null};
   if(d.fill>0)return{ok:false,reason:'Déblayez d’abord les corps : on ne remblaie pas un charnier.'};
   const pay=state.earth>=F.earth-EPS?'earth':(g.resources?.stone||0)>=F.stone?'stone':null;
   if(!pay)return{ok:false,reason:'Il faut '+F.earth+' terre ou '+F.stone+' pierre par case.'};
   return{ok:true,ditch:d,pay};
  }
  function backfill(){
   const q=backfillQuote();if(!q.ok)return{ok:false,reason:q.reason};
   const d=q.ditch;
   if(!q.pay){state.ditches=state.ditches.filter(o=>o!==d);index();g.notify?.('Chantier de fossé annulé. Le bois du chantier n’est pas rendu.');g.audio?.build?.();g.save?.(false);return{ok:true};}
   const wasOpen=open(d);
   if(q.pay==='earth')state.earth=Math.max(0,state.earth-F.earth);else g.resources.stone-=F.stone;
   d.wet=false;d.back=0;if(wasOpen)reroute();
   g.notify?.('Remblai financé ('+(q.pay==='earth'?F.earth+' terre':F.stone+' pierre')+') : '+F.seconds+' s de travail, ouvriers ou ACTION / E.');g.audio?.build?.();g.refreshMetrics?.(true);g.save?.(false);return{ok:true};
  }
  // Arasement : le talus le plus proche est défait sur-le-champ ; sa terre retourne à la réserve.
  function levelQuote(){
   const closed=gate();if(closed)return{ok:false,reason:closed};
   if(!state.banks.length)return{ok:false,reason:'Aucun talus à araser.'};
   if(sieged())return{ok:false,reason:'Aucun arasement de l’alerte à la fin de l’assaut.'};
   const b=nearest(state.banks);return b?{ok:true,bank:b}:{ok:false,reason:'Rejoignez à pied le talus à araser.'};
  }
  function level(){
   const q=levelQuote();if(!q.ok)return{ok:false,reason:q.reason};
   const was=built(q.bank);state.banks=state.banks.filter(b=>b!==q.bank);index();state.earth=Math.min(R.maxEarth,state.earth+B.earth);if(was)reroute();
   g.notify?.('Talus arasé : '+B.earth+' terre retournent à la réserve.');g.audio?.build?.();g.save?.(false);return{ok:true};
  }
  // Douve : la tranchée continue qui part du fossé le plus proche, case par case tant que les citernes suivent.
  const watered=()=>Boolean(g.cityWater215?.active?.());
  const floodable=d=>open(d)&&!d.wet&&d.fill<R.capacity;
  function run(start,wanted){
   const out=[start],seen=new Set([start]);
   for(let i=0;i<out.length;i++)for(const [dx,dy] of NEAR){const o=at(out[i].x+dx,out[i].y+dy);if(o&&!seen.has(o)&&wanted(o)){seen.add(o);out.push(o);}}
   return out;
  }
  function floodQuote(){
   const closed=gate();if(closed)return{ok:false,reason:closed};
   if(!watered())return{ok:false,reason:'Cette campagne ne suit pas l’eau de cité : pas de douve.'};
   if(g.cityWater215.stage()>0)return{ok:false,reason:'Pénurie d’eau : la population passe avant les douves.'};
   const d=nearest(state.ditches,floodable);if(!d)return{ok:false,reason:'Rejoignez à pied un fossé ouvert et sec.'};
   const line=run(d,floodable),water=g.cityWater215.reserve().water,count=Math.min(line.length,Math.floor((water+EPS)/M.fillWater));
   if(count<1)return{ok:false,reason:'Citernes trop basses : '+M.fillWater+' eau par case.'};
   return{ok:true,cells:line.slice(0,count),total:line.length,water:count*M.fillWater};
  }
  function flood(){
   const q=floodQuote();if(!q.ok)return{ok:false,reason:q.reason};
   const drawn=g.siege?.drawCityWater215?.(q.water)||0,count=Math.min(q.cells.length,Math.floor((drawn+EPS)/M.fillWater));
   if(count<1)return{ok:false,reason:'Citernes trop basses : '+M.fillWater+' eau par case.'};
   for(const d of q.cells.slice(0,count))d.wet=true;reroute();
   g.notify?.(count<q.total?'Mise en eau partielle : '+count+' cases sur '+q.total+', les citernes ne suivent pas.':'Douve en eau : '+many(count,'case','cases')+' · '+num(count*M.fillWater)+' eau tirée des citernes.',count<q.total?'danger':'good');
   g.audio?.build?.();g.save?.(false);return{ok:true,count};
  }
  function drainQuote(){
   const closed=gate();if(closed)return{ok:false,reason:closed};
   const d=nearest(state.ditches,o=>o.wet);return d?{ok:true,cells:run(d,o=>o.wet)}:{ok:false,reason:'Rejoignez à pied une douve.'};
  }
  function dry(list,message,tone){
   if(!list.length)return 0;
   for(const d of list)d.wet=false;reroute();if(message)g.notify?.(message,tone);return list.length;
  }
  function drain(){
   const q=drainQuote();if(!q.ok)return{ok:false,reason:q.reason};
   dry(q.cells,'Douve vidée : '+many(q.cells.length,'case redevient un fossé','cases redeviennent des fossés')+'. L’eau n’est pas rendue.');g.save?.(false);return{ok:true};
  }
  // Entretien des douves : elles puisent dans les citernes après la population. Sans eau, elles se vident.
  function upkeep(dt){
   if(!active()||!(dt>0)||!Number.isFinite(dt)||!playing())return 0;
   const wet=state.ditches.filter(d=>d.wet);if(!wet.length)return 0;
   const need=wet.length*M.upkeepPerSecond*dt,lacking=!watered()||g.cityWater215.stage()>0,drawn=lacking?0:g.siege?.drawCityWater215?.(need)||0;
   if(lacking||drawn<need-EPS)dry(wet,'Pénurie d’eau : les douves se vident et redeviennent des fossés.','danger');
   return drawn;
  }
  const economy=g.economyTick;
  if(typeof economy==='function')g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);upkeep(dt);return result;};
  // Corps restés dans l'eau des douves : lus par la filière des corps pour la salubrité.
  const moatBodies=()=>{if(!active())return 0;let n=0;for(const d of state.ditches)if(d.wet)n+=d.fill;return n;};
  const tally=()=>{const out={total:state.ditches.length,site:0,open:0,full:0,bodies:0,wet:0,backfill:0,banks:state.banks.length,bankSites:0,earth:state.earth};
   for(const d of state.ditches){if(!dug(d))out.site++;else if(d.back!==null)out.backfill++;else if(full(d))out.full++;else out.open++;if(d.wet)out.wet++;out.bodies+=d.fill;}
   for(const b of state.banks)if(!built(b))out.bankSites++;return out;};
  function overview(){
   if(!active())return{summary:'Cette campagne a commencé avant les travaux de terrain : fossé et talus n’apparaissent pas à son catalogue. La règle ne s’active pas en cours de campagne.',rows:[{label:'Fossés',value:'Sans objet.'}]};
   const rule='Un fossé ouvert ralentit l’infecté qui le traverse (vitesse ×'+num(R.slowFactor)+') et détourne une partie de la horde. Il ne bloque aucun passage et n’inflige aucun dégât. Chaque case absorbe '+R.capacity+' corps, puis elle est comblée et n’a plus d’effet.';
   if(!unlocked())return{summary:'Les travaux de terrain viendront à l’âge '+TIER+'.',rows:[{label:'Fossés',value:'Aucun avant l’âge '+TIER},{label:'Règle',value:rule}]};
   const t=tally();
   return{summary:t.full?(t.full>1?t.full+' fossés comblés : ils ne ralentissent plus':'1 fossé comblé : il ne ralentit plus')+'. Passez les ouvriers à l’ordre « déblayer ».':t.total?'Les fossés tiennent. Surveillez leur comblement après chaque assaut.':'Aucun fossé. Choisissez « Fossé » au catalogue, onglet Défense, et tracez-le devant un mur.',rows:[
    {label:'Fossés',value:t.total?many(t.open,'ouvert','ouverts')+' · '+many(t.full,'comblé','comblés')+' · '+many(t.site,'en chantier','en chantier')+(t.backfill?' · '+many(t.backfill,'en remblai','en remblai'):'')+' · '+Math.ceil(t.bodies)+' corps dedans':'Aucun ('+R.maxDitches+' au plus).'},
    {label:'Chantier',value:C.resourceText(R.cost)+' par case, puis '+R.digSeconds+' s de travail : ouvriers aux ordres « auto » ou « bâtir » après les autres chantiers, ou Commandant à portée qui tient ACTION / E. Glissez pour tracer une ligne ('+R.maxLine+' cases au plus).'},
    {label:'Règle',value:rule},
    {label:'Terre',value:num(t.earth)+' en réserve · '+R.earthPerDitch+' par case creusée.'},
    {label:'Talus',value:(t.banks?many(t.banks-t.bankSites,'dressé','dressés')+' · '+many(t.bankSites,'en chantier','en chantier')+'. ':'Aucun. ')+B.earth+' terre et '+B.buildSeconds+' s de travail par case, contre un mur ou au bord d’un fossé. Adossé à un mur : '+B.rampBonus+' corps de plus pour le franchir. Au bord d’un fossé ouvert : vitesse ×'+num(B.slowFactor)+' en plus. Il ne bloque rien.'},
    {label:'Douve',value:!watered()?'Sans objet : cette campagne ne suit pas l’eau de cité.':many(t.wet,'case en eau','cases en eau')+'. '+M.fillWater+' eau de cité par case, puis '+num(M.upkeepPerSecond*60)+' par minute et par case. Vitesse ×'+num(M.slowFactor)+', '+M.capacity+' corps par case ; ils restent dans l’eau et comptent pour la salubrité. En pénurie, la douve se vide.'},
    {label:'Déblaiement',value:'Ordre « déblayer » : les ouvriers vident les fossés après les murs, à la même cadence. Le Commandant à portée déblaie aussi avec ACTION / E, hors assaut.'},
    {label:'Remblai',value:F.earth+' terre, à défaut '+F.stone+' pierre, puis '+F.seconds+' s de travail par case. Un fossé qui porte des corps se déblaie d’abord.'}]};
  }
  function actions(){
   if(!active())return[];
   const q=backfillQuote(),out=[{id:'backfill',label:'Remblayer le fossé le plus proche',description:'Finance le remblai de la case ('+F.earth+' terre, à défaut '+F.stone+' pierre) ; il reste '+F.seconds+' s de travail. Le bois du chantier n’est pas rendu.',disabled:!q.ok,reason:q.reason||'Hors assaut.',run:backfill}];
   if(state.banks.length){const l=levelQuote();out.push({id:'level',label:'Araser le talus le plus proche',description:'Défait le talus ; sa terre retourne à la réserve.',disabled:!l.ok,reason:l.reason||'Immédiat, hors assaut.',run:level});}
   if(watered()){const f=floodQuote();out.push({id:'flood',label:'Mettre en eau la tranchée la plus proche',description:'Change en douve les fossés ouverts qui se touchent : '+M.fillWater+' eau de cité par case, puis un entretien continu tiré des citernes.',disabled:!f.ok,reason:f.reason||many(f.cells.length,'case','cases')+(f.cells.length<f.total?' sur '+f.total:'')+' · '+num(f.water)+' eau.',run:flood});}
   if(state.ditches.some(d=>d.wet)){const d=drainQuote();out.push({id:'drain',label:'Vider la douve la plus proche',description:'La tranchée redevient un fossé sec. L’eau n’est pas rendue.',disabled:!d.ok,reason:d.reason||'Immédiat.',run:drain});}
   return out;
  }
  // Catalogue : fossé et talus s'ajoutent à l'onglet Défense des campagnes qui suivent la règle.
  const shown=()=>unlocked()&&g.currentCategory==='defense';
  const entry=id=>{const list=g.ui?.buildList;return list?Array.from(list.children||[]).find(n=>n?.dataset?.buildId===id)||null:null;};
  const price=id=>id===BANK?B.earth+' terre · réserve '+num(state.earth):C.resourceText(R.cost);
  function catalogue(){
   const list=g.ui?.buildList,doc=root.document;if(!list)return;
   for(const item of ENTRIES){
    let node=entry(item.id);
    if(!shown()){if(node){if(typeof node.remove==='function')node.remove();else list.removeChild?.(node);}if(g.selectedBuild===item.id&&!unlocked())g.selectedBuild=null;continue;}
    const selected=g.selectedBuild===item.id,html='<span class="build-icon">'+item.icon+'</span><span class="build-copy"><strong>'+item.name+'</strong><small>'+item.description+'</small><span class="build-cost">'+price(item.id)+'</span></span>';
    if(!node){
     if(!doc?.createElement)continue;
     node=doc.createElement('button');node.dataset.buildId=item.id;
     node.addEventListener?.('click',()=>g.selectBuild(item.id));list.appendChild(node);
    }
    if(node.innerHTML!==html)node.innerHTML=html;
    node.className='build-item'+(selected?' selected':'')+(funded(item.id)?' is-affordable':'');
   }
  }
  const menu=g.refreshBuildMenu;
  if(typeof menu==='function')g.refreshBuildMenu=function(...args){const result=menu.apply(this,args);try{catalogue();}catch(error){/* l'entrée de catalogue ne bloque jamais le menu */}return result;};
  const afford=g.refreshBuildAffordability;
  if(typeof afford==='function')g.refreshBuildAffordability=function(...args){const result=afford.apply(this,args);try{if(entry(ID))catalogue();}catch(error){/* idem */}return result;};
  // Fossé et talus ne sont pas des ouvrages du monde : la pose et l'aperçu leur sont propres ; le tracé en ligne
  // reprend le glissé des murs (départ, aperçu, relâchement).
  const lineWall=g.isLineWall;
  g.isLineWall=function(def,...rest){return def?lineWall.call(this,def,...rest):mine(this.selectedBuild);};
  const placeOne=g.placeOne;
  g.placeOne=function(type,gx,gy,...rest){return mine(type)?lay(type,gx,gy,false).ok:placeOne.call(this,type,gx,gy,...rest);};
  const wallLine=g.placeWallLine;
  if(typeof wallLine==='function')g.placeWallLine=function(type,list,...rest){return mine(type)?placeLine(type,list):wallLine.call(this,type,list,...rest);};
  const TINT={ok:'rgba(111,164,102,.55)',short:'rgba(214,160,60,.6)',blocked:'rgba(183,71,62,.55)'};
  const placement=g.drawPlacement;
  if(typeof placement==='function')g.drawPlacement=function(ctx,...rest){
   if(this.rallyPlacement||!mine(this.selectedBuild))return placement.call(this,ctx,...rest);
   const cursor={x:C.grid(this.input.mouseWorldX),y:C.grid(this.input.mouseWorldY)},drag=this.wallStart&&this.wallPreview?.length?this.wallPreview:[cursor];
   const p=plan(this.selectedBuild,drag);if(!p.cells.length)return;
   ctx.save();ctx.globalAlpha=.58;
   for(const c of p.cells){ctx.fillStyle=TINT[c.status];ctx.fillRect(c.x*TILE+2,c.y*TILE+2,TILE-4,TILE-4);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.strokeRect(c.x*TILE+2,c.y*TILE+2,TILE-4,TILE-4);}
   // Coût total du tracé, au bout de la ligne.
   const last=p.cells[p.cells.length-1];
   if(typeof ctx.fillText==='function'){
    ctx.globalAlpha=1;ctx.font='600 13px system-ui,sans-serif';ctx.textAlign='center';
    const tx=last.x*TILE+TILE/2,ty=last.y*TILE-8,width=(ctx.measureText?.(p.text)?.width||p.text.length*7)+12;
    ctx.fillStyle='rgba(16,14,11,.82)';ctx.fillRect(tx-width/2,ty-15,width,20);
    ctx.fillStyle=p.short||p.blocked?'#f0c36a':'#e9e4d6';ctx.fillText(p.text,tx,ty);
   }
   ctx.restore();
  };
  // Un infecté abattu au sol, dans un fossé ouvert ou à son bord, y tombe.
  const kill=g.killZombie;
  g.killZombie=function(z,...rest){
   const watch=active()&&cells.size&&z&&!z.dead,pose=watch?g.vertical175?.corpsePose?.(z):null,x=z?.x,y=z?.y;
   const result=kill.call(this,z,...rest);
   if(watch&&z.dead&&!(Number.isFinite(pose?.z)&&pose.z>0))receive(x,y);
   return result;
  };
  // Talus adossé : la règle de franchissement du jeu est relue avec une charge diminuée d'autant. Elle garde son
  // seuil, ses infectés grimpeurs et ses exceptions ; un amas assez haut franchit toujours le mur.
  const climb=g.zombieCanClimb;
  if(typeof climb==='function')g.zombieCanClimb=function(entity,wall,...rest){
   const can=climb.call(this,entity,wall,...rest);
   if(!can||!mounds.size||!active()||!raised(wall))return can;
   return climb.call(this,entity,Object.create(wall,{corpseLoad:{value:wall.corpseLoad-B.rampBonus}}),...rest);
  };
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(this,dt,...rest);tick(dt);return result;};
  // Rendu au sol : tranchée sombre, eau de la douve, corps visibles et jauge de comblement ; un fossé comblé est
  // plein à ras bord ; le talus est une levée claire, hachurée dans le sens de sa pente.
  function paint(ctx,view){
   const pad=TILE;
   const hidden=(x,y)=>view&&(x+TILE+pad<view.left||x-pad>view.right||y+TILE+pad<view.top||y-pad>view.bottom);
   for(const d of state.ditches){
    const x=d.x*TILE,y=d.y*TILE;if(hidden(x,y))continue;
    // Une tranchée continue : pas de bord entre deux cases voisines.
    const side=(dx,dy)=>at(d.x+dx,d.y+dy)?0:4,l=side(-1,0),r=side(1,0),t=side(0,-1),b=side(0,1);
    const ix=x+l,iy=y+t,iw=TILE-l-r,ih=TILE-t-b,limit=cap(d);
    ctx.save();
    if(!dug(d)){
     const done=d.dug/R.digSeconds;
     ctx.fillStyle='rgba(58,44,28,'+(.25+.5*done).toFixed(3)+')';ctx.fillRect(ix,iy,iw,ih);
     ctx.strokeStyle='#c9a45c';ctx.lineWidth=1.5;ctx.setLineDash?.([5,4]);ctx.strokeRect(ix+1,iy+1,iw-2,ih-2);ctx.setLineDash?.([]);
     ctx.fillStyle='#211f19';ctx.fillRect(x+5,y+TILE-8,TILE-10,3);ctx.fillStyle='#c9a45c';ctx.fillRect(x+5,y+TILE-8,(TILE-10)*done,3);
     ctx.restore();continue;
    }
    if(d.back!==null){
     // Remblai en cours : la terre remonte dans le creux.
     const done=d.back/F.seconds;
     ctx.fillStyle='#2a2118';ctx.fillRect(ix,iy,iw,ih);ctx.fillStyle='#7a6444';ctx.fillRect(ix,iy+ih*(1-done),iw,ih*done);
     ctx.strokeStyle='#d9c08a';ctx.lineWidth=1.5;ctx.setLineDash?.([3,3]);ctx.strokeRect(ix+1,iy+1,iw-2,ih-2);ctx.setLineDash?.([]);
     ctx.restore();continue;
    }
    const closed=full(d);
    // Déblai clair en bordure, puis le creux.
    ctx.fillStyle=d.wet?'#51605e':'#6b5a40';ctx.fillRect(ix,iy,iw,ih);
    ctx.fillStyle=closed?'#4b382e':d.wet?'#2f5f73':'#2a2118';ctx.fillRect(ix+(l?2:0),iy+(t?2:0),iw-(l?2:0)-(r?2:0),ih-(t?2:0)-(b?2:0));
    if(!closed){ctx.fillStyle=d.wet?'#3f7d92':'#17120d';ctx.fillRect(ix+(l?5:0),iy+(t?5:0),iw-(l?5:0)-(r?5:0),ih-(t?5:0)-(b?5:0));}
    if(d.wet&&!closed){
     // Reflets fixes, placés par la case : aucune animation, aucun hasard.
     ctx.strokeStyle='rgba(190,225,235,.55)';ctx.lineWidth=1;ctx.beginPath();
     for(let i=0;i<3;i++){const wx=x+6+((d.x*7+i*9)%(TILE-18)),wy=y+8+i*((TILE-16)/3)+((d.y*3+i)%3);ctx.moveTo(wx,wy);ctx.lineTo(wx+7,wy);}
     ctx.stroke();
    }
    // Corps : positions fixées par la case et le rang, sans hasard.
    const bodies=Math.min(limit,Math.ceil(d.fill));
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
     const w=(TILE-10)/limit;
     for(let i=0;i<limit;i++){ctx.fillStyle=i<bodies?'#d08a4e':'rgba(20,16,12,.8)';ctx.fillRect(x+5+i*w,y+TILE-7,w-1,3);}
    }
    ctx.restore();
   }
   for(const m of state.banks){
    const x=m.x*TILE,y=m.y*TILE;if(hidden(x,y))continue;
    const side=(dx,dy)=>bankAt(m.x+dx,m.y+dy)?0:3,l=side(-1,0),r=side(1,0),t=side(0,-1),b=side(0,1);
    const ix=x+l,iy=y+t,iw=TILE-l-r,ih=TILE-t-b,done=m.built/B.buildSeconds;
    ctx.save();
    if(!built(m)){
     ctx.fillStyle='rgba(150,122,78,'+(.2+.5*done).toFixed(3)+')';ctx.fillRect(ix,iy,iw,ih);
     ctx.strokeStyle='#e0c890';ctx.lineWidth=1.5;ctx.setLineDash?.([5,4]);ctx.strokeRect(ix+1,iy+1,iw-2,ih-2);ctx.setLineDash?.([]);
     ctx.fillStyle='#211f19';ctx.fillRect(x+5,y+TILE-8,TILE-10,3);ctx.fillStyle='#e0c890';ctx.fillRect(x+5,y+TILE-8,(TILE-10)*done,3);
     ctx.restore();continue;
    }
    // Levée : pied sombre, flanc, crête claire au milieu.
    ctx.fillStyle='#5d4c33';ctx.fillRect(ix,iy,iw,ih);
    ctx.fillStyle='#8a7350';ctx.fillRect(ix+(l?2:0),iy+(t?2:0),iw-(l?2:0)-(r?2:0),ih-(t?2:0)-(b?2:0));
    // La crête suit la levée : horizontale si un talus voisin est à gauche ou à droite, verticale sinon.
    const across=!l||!r||l&&r&&t&&b;
    ctx.fillStyle='#b39a6c';if(across)ctx.fillRect(ix,y+TILE/2-3,iw,6);else ctx.fillRect(x+TILE/2-3,iy,6,ih);
    ctx.strokeStyle='rgba(60,46,28,.7)';ctx.lineWidth=1;ctx.beginPath();
    for(let i=0;i<4;i++){const o=5+i*((TILE-10)/3);
     if(across){ctx.moveTo(x+o,y+TILE/2-4);ctx.lineTo(x+o,iy+3);ctx.moveTo(x+o,y+TILE/2+4);ctx.lineTo(x+o,iy+ih-3);}
     else{ctx.moveTo(x+TILE/2-4,y+o);ctx.lineTo(ix+3,y+o);ctx.moveTo(x+TILE/2+4,y+o);ctx.lineTo(ix+iw-3,y+o);}}
    ctx.stroke();
    ctx.restore();
   }
  }
  const ground=g.drawGround;
  if(typeof ground==='function')g.drawGround=function(...args){
   const result=ground.apply(this,args);
   if(active()&&(state.ditches.length||state.banks.length)&&args[0]&&playing())try{paint(args[0],args[1]);}catch(error){/* un dessin ne bloque jamais la partie */}
   return result;
  };
  const snapshot=()=>{reconcile();return validate(state);};
  const load=next=>{state=next;index();quietFull=quietDug=quietBank=-Infinity;if(g.world){g.world.flowDirty=true;g.flowTimer=0;}try{g.refreshBuildMenu?.(true);}catch(error){/* menu absent hors partie */}};
  const api=Object.freeze({ID,BANK,active,unlocked,speed,rampBonus,earth:()=>state.earth,moatBodies,
   at:(x,y)=>{const d=at(x,y);return d?{...d,dug:dug(d),work:d.dug,full:full(d),open:open(d)}:null;},list:()=>state.ditches.map(d=>({...d})),
   bankAt:(x,y)=>{const b=bankAt(x,y);return b?{...b,built:built(b),work:b.built}:null;},banks:()=>state.banks.map(b=>({...b})),
   tally,quote,bankQuote,dig,raise,plan,placeLine,backfill,backfillQuote,level,levelQuote,flood,floodQuote,drain,drainQuote,upkeep,receive,updateAssignedUnit,tick,overview,actions,snapshot});
  g.earthworks217=api;
  g.expansions.register({id:'earthworks217',title:'Travaux de terrain',overview,actions,validate,snapshot,restore:raw=>load(validate(raw)),reset:()=>load(fresh())});
  return api;
 }
 const api=Object.freeze({ID,BANK,initial,fresh,validate,rimDistance,catcher,install});root.DeadwallEarthworks217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
