/* Avant-postes et routes gardées (docs/GAME_BIBLE.md §7.14), première tranche, NOUVELLES campagnes seulement.
   - Avant-poste : décidé au dépôt de D-17, sur un lieu régional déjà vu, vidé de ses occupants et relié par la route.
     Des fusiliers quittent la cité et un coût est pris au stock. Nombre borné par l'âge. Fait sauvegardé.
   - Route gardée : l'itinéraire routier existant (frontier-routing) entre D-17 et l'avant-poste, tant qu'il tient.
     Elle garde le côté de D-17 où se trouve l'avant-poste (axe dominant), pas le tracé exact : l'itinéraire reste
     indicatif. Effet sur un système existant : un fourgon qui rentre de ce côté n'est pas barré par les Rouleurs.
   - Convoi : à chaque intervalle de vagues, en phase calme, un lot borné du fonds du lieu arrive au dépôt contre du
     carburant. Le fonds est fini (emprise du lieu, hachage de son identifiant) et ne se régénère jamais.
     Le convoi est une ligne du registre : aucun acteur simulé.
   - Radio : hors de portée de D-17 et de tout avant-poste, la radio de cité se tait (crochet lu par city-radio217).
   Aucun hasard, aucun flux de génération tiré, monde inchangé. Une campagne commencée avant cette règle n'a rien de
   tout cela. Reste à faire : chute d'un avant-poste, garnison nourrie, états de route, rappel par les routes gardées. */
(function(root){'use strict';
 const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=need('DeadwallCore','./core.js'),G=need('DeadwallFrontierGeometry','./frontier-geometry.js'),Routing=need('DeadwallFrontierRouting','./frontier-routing.js');
 const R=C.Outposts217Rules,HOLD=R.hold,CONVOY=R.convoy;
 const ID=/^P\d{4}$/,KEYS=['version','active','posts'],POST=['id','garrison','founded','convoy','hauled','note','sent'];
 const NOTES=['held','delivered','nofuel','full','empty'],MAX_WAVE=1e6,MAX_POSTS=Math.max(...R.caps.map(c=>c.max)),OFFERS=6;
 const SIDE=Object.freeze({east:'est',west:'ouest',north:'nord',south:'sud'});
 function initial(){return{version:1,active:false,posts:[]};}
 function fresh(){return{...initial(),active:true};}
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 const exact=(o,keys)=>Boolean(o)&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(o,k));
 function validate(raw,full){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Avant-postes 217 invalides.');};
  if(!exact(raw,KEYS)||raw.version!==1||typeof raw.active!=='boolean'||!Array.isArray(raw.posts)||raw.posts.length>MAX_POSTS)bad();
  if(!raw.active&&raw.posts.length)bad();
  const seen=full?.frontier?.seen,ledger=full?.frontier?.enemies;
  const posts=raw.posts.map((p,i)=>{
   if(!exact(p,POST)||typeof p.id!=='string'||!ID.test(p.id)||i&&!(raw.posts[i-1].id<p.id)||p.garrison!==R.garrison||!int(p.founded,0,MAX_WAVE)||!int(p.convoy,p.founded,MAX_WAVE)
    ||!NOTES.includes(p.note)||typeof p.sent!=='number'||!Number.isFinite(p.sent)||p.sent<0||p.sent>CONVOY.lot||!exact(p.hauled,C.RESOURCE_KEYS))bad();
   const hauled=C.makeBag();
   for(const k of C.RESOURCE_KEYS){const n=p.hauled[k];if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>HOLD.max)bad();hauled[k]=n;}
   if(C.bagTotal(hauled)>HOLD.max+1e-6)bad();
   // Un avant-poste se tient sur un lieu vu, dont au moins un occupant est tombé dans le registre de la même sauvegarde.
   if(Array.isArray(seen)&&!seen.includes(p.id))bad();
   if(ledger&&!Object.keys(ledger).some(id=>ledger[id]===0&&id.startsWith(p.id+':e')))bad();
   return{id:p.id,garrison:p.garrison,founded:p.founded,convoy:p.convoy,hauled,note:p.note,sent:p.sent};
  });
  return{version:1,active:raw.active,posts};
 }
 // Plafond d'avant-postes pour un âge (indice de C.CITY_TIERS) : zéro avant `startAge`.
 function cap(age){let max=0;if(Number.isInteger(age)&&age>=R.startAge)for(const c of R.caps)if(age>=c.age)max=Math.max(max,c.max);return max;}
 // Fonds lourd d'un lieu : fonction pure de la graine, de l'identifiant et de l'emprise. Jamais régénéré.
 function holding(seed,p){
  const total=Math.round(C.clamp(p.w*p.h*HOLD.perArea,HOLD.min,HOLD.max)),mix=HOLD.mixes[G.hash(seed,p.id,'outposts217')%HOLD.mixes.length],bag=C.makeBag();
  let given=0,first=null;
  for(const k of C.RESOURCE_KEYS)if(mix[k]>0){bag[k]=Math.floor(total*mix[k]);given+=bag[k];first=first||k;}
  bag[first]+=total-given;return bag;
 }
 // Côté de D-17 par lequel une direction sort : axe dominant, est et sud positifs comme à l'écran.
 const sideOf=(dx,dy)=>Math.abs(dx)>=Math.abs(dy)?(dx>=0?'east':'west'):(dy>=0?'south':'north');
 // Lot d'un convoi : au plus `lot` unités de ce qui reste, dans l'ordre des ressources, sans dépasser la place du dépôt.
 function lot(left,room){
  const bag=C.makeBag();let free=CONVOY.lot,total=0;
  for(const k of C.RESOURCE_KEYS){const n=Math.max(0,Math.min(free,left[k]||0,room(k)));bag[k]=n;free-=n;total+=n;}
  return{bag,total};
 }
 const title=p=>String(p?.name||'').split(' · ')[0].split(' — ')[0];
 const metres=d=>d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m';
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const bagText=bag=>C.RESOURCE_KEYS.filter(k=>bag[k]>0).map(k=>amount(bag[k])+' '+C.RESOURCE_META[k].label.toLowerCase()).join(', ');
 const live=u=>u&&!u.dead&&u.health>0;
 function install(g,doc){
  if(g.outposts217)return g.outposts217;if(!g.expansions)throw Error('Installer les opérations avant les avant-postes 217.');
  let state=initial(),memo=new WeakMap();
  const active=()=>state.active&&Boolean(g.frontier);
  const world=()=>g.frontier.world(),age=()=>g.tier?.id||0,wave=()=>int(g.wave,0,MAX_WAVE)?g.wave:0;
  // Par monde : lieux par identifiant et itinéraires déjà calculés. Rien n'est écrit dans le monde.
  function book(){const w=world();let b=memo.get(w);if(!b){b={by:new Map(w.pois.map(p=>[p.id,p])),routes:new Map()};memo.set(w,b);}return b;}
  const site=id=>book().by.get(id)||null;
  function routeOf(id){
   const b=book();if(b.routes.has(id))return b.routes.get(id);
   const w=world(),p=site(id);let r=null;
   try{if(p&&w.home){const found=Routing.route(w,{x:w.home.x,y:w.home.y},p);if(found)r={metres:found.metres,path:found.path.map(q=>({x:q.x,y:q.y})),side:sideOf(p.x-w.home.x,p.y-w.home.y)};}}catch(error){r=null;}
   b.routes.set(id,r);return r;
  }
  const post=id=>state.posts.find(p=>p.id===id)||null;
  const holdOf=id=>holding(world().seed,site(id));
  const leftOf=p=>{const h=holdOf(p.id),bag=C.makeBag();for(const k of C.RESOURCE_KEYS)bag[k]=Math.max(0,h[k]-p.hauled[k]);return bag;};
  // Vidé : nid d'un lieu remarquable s'il en est un, sinon tous les occupants ordinaires d'un lieu infesté.
  function emptied(p){
   const mark=g.remarkable217?.active?.()?g.remarkable217.list().find(v=>v.id===p.id):null;
   if(mark)return mark.state!=='nest';
   if(p.occupation!=='infected')return false;
   const n=world().threatCount(p);if(!(n>0))return false;
   for(let i=0;i<n;i++)if(g.frontier.enemyHealth(p.id+':e'+i)!==0)return false;
   return true;
  }
  const soldiers=()=>{const core=g.core?.();return g.units.filter(u=>live(u)&&u.kind==='soldier'&&!u.regionAbsent).sort((a,b)=>(core?Math.hypot(a.x-core.x,a.y-core.y)-Math.hypot(b.x-core.x,b.y-core.y):0)||a.id-b.id);};
  function atDepot(){
   const core=g.core?.(),f=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('outposts217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!f?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.reach));
  }
  const DEPOT='Décidez-le au dépôt de D-17, à pied et les mains libres.',NONE='Cette campagne ne connaît pas les avant-postes.';
  function foundQuote(id){
   if(!active())return{ok:false,reason:NONE};
   const max=cap(age());
   if(!max)return{ok:false,reason:'Il faut une cité d’âge « '+C.CITY_TIERS[R.startAge].name+' » pour tenir un avant-poste.'};
   const p=typeof id==='string'&&ID.test(id)?site(id):null;
   if(!p||!g.frontier.discoveries().includes(id))return{ok:false,reason:'Ce lieu n’a pas été visité.'};
   if(post(id))return{ok:false,reason:'Un avant-poste tient déjà ce lieu.'};
   if(state.posts.length>=max)return{ok:false,reason:'La cité ne peut pas tenir plus de '+max+' avant-poste'+(max>1?'s':'')+' à son âge.'};
   if(p.occupation==='allied')return{ok:false,reason:'Ce lieu est tenu par un relais allié.'};
   if(!emptied(p))return{ok:false,reason:'Le lieu doit d’abord être vidé de ses occupants.'};
   const route=routeOf(id);if(!route)return{ok:false,reason:'Aucune route ne relie ce lieu à D-17.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(soldiers().length<R.garrison)return{ok:false,reason:'Il faut '+R.garrison+' fusiliers présents dans la cité pour la garnison.'};
   if(!C.canAfford(g.resources,R.cost))return{ok:false,reason:'Stock insuffisant : '+bagText(R.cost)+' requis.'};
   return{ok:true,route};
  }
  function found(id){
   const q=foundQuote(id);if(!q.ok)return q;
   const leaving=new Set(soldiers().slice(0,R.garrison));
   C.spend(g.resources,R.cost);g.units=g.units.filter(u=>!leaving.has(u));g.refreshMetrics?.(true);
   state.posts.push({id,garrison:R.garrison,founded:wave(),convoy:wave(),hauled:C.makeBag(),note:'held',sent:0});state.posts.sort((a,b)=>a.id<b.id?-1:1);
   g.notify?.('Avant-poste établi : '+title(site(id))+'. '+R.garrison+' fusiliers quittent la cité ; la route qui y mène ('+metres(q.route.metres)+') est désormais gardée, côté '+SIDE[q.route.side]+' de D-17.','good');
   g.audio?.ui?.();g.save?.(false);return{ok:true};
  }
  // Places libres autour du dépôt pour les hommes qui rentrent : positions fixes, aucune n'est tirée.
  function spots(n){
   const core=g.core?.(),out=[];if(!core||typeof g.friendlyPositionClear!=='function')return out;
   const radius=C.SURVIVORS.soldier.radius;
   for(const r of [70,100,130,160])for(let i=0;i<12&&out.length<n;i++){
    const a=i*Math.PI/6,x=core.x+Math.cos(a)*r,y=core.y+Math.sin(a)*r;
    if(g.friendlyPositionClear({radius},x,y)&&!out.some(q=>Math.hypot(q.x-x,q.y-y)<radius*2+2))out.push({x,y});
   }
   return out;
  }
  const NO_ROOM='Aucune place libre près du dépôt pour les hommes qui rentrent.';
  function abandonQuote(id){
   if(!active())return{ok:false,reason:NONE};
   const p=post(id);if(!p)return{ok:false,reason:'Aucun avant-poste sur ce lieu.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(typeof g.createProtectedSurvivor!=='function'||spots(p.garrison).length<p.garrison)return{ok:false,reason:NO_ROOM};
   return{ok:true};
  }
  function abandon(id){
   const q=abandonQuote(id);if(!q.ok)return q;
   const p=post(id),back=[];
   for(const s of spots(p.garrison)){const u=g.createProtectedSurvivor('soldier',s.x,s.y);if(u)back.push(u);}
   if(back.length<p.garrison){g.units=g.units.filter(u=>!back.includes(u));return{ok:false,reason:NO_ROOM};}
   state.posts=state.posts.filter(e=>e!==p);g.refreshMetrics?.(true);
   g.notify?.('Avant-poste abandonné : '+title(site(id))+'. '+p.garrison+' fusiliers rentrent à D-17 ; la route n’est plus gardée et les convois cessent. Le coût d’établissement est perdu.');
   g.audio?.ui?.();g.save?.(false);return{ok:true};
  }
  // Convoi : une ligne par avant-poste et par intervalle, en phase calme. Livre au dépôt, paie en carburant.
  function tickPost(p,w){
   if(p.note==='empty'||w<p.convoy+CONVOY.everyWaves)return false;
   const name=title(site(p.id)),left=leftOf(p);
   p.convoy=w;p.sent=0;
   if(!(C.bagTotal(left)>1e-9)){p.note='empty';g.notify?.('Convoi : '+name+' est vide. Il n’y aura plus de convoi ; l’avant-poste garde toujours la route.');return true;}
   if(!(g.resources.fuel>=CONVOY.fuel)){p.note='nofuel';g.notify?.('Convoi de '+name+' resté sur place : il faut '+CONVOY.fuel+' carburant au dépôt pour le faire rouler.','danger');return true;}
   const load=lot(left,k=>Math.max(0,g.storage-g.resources[k]));
   if(!(load.total>1e-9)){p.note='full';g.notify?.('Convoi de '+name+' resté sur place : le dépôt n’a pas la place.');return true;}
   g.resources.fuel-=CONVOY.fuel;
   for(const k of C.RESOURCE_KEYS){g.resources[k]+=load.bag[k];p.hauled[k]+=load.bag[k];}
   p.sent=load.total;
   const rest=C.bagTotal(leftOf(p)),done=!(rest>1e-9);
   p.note=done?'empty':'delivered';
   g.notify?.('Convoi de '+name+' arrivé seul par la route gardée : '+bagText(load.bag)+' au dépôt, '+CONVOY.fuel+' carburant brûlé. '+(done?'Le lieu est vide : c’était le dernier convoi.':'Reste sur place : '+amount(rest)+'.'),'good');
   return true;
  }
  function tick(dt){
   if(!active()||!(dt>0)||g.state!=='playing'||g.gameOver||g.phase!=='calm'||!state.posts.length)return;
   const w=wave();let changed=false;
   for(const p of state.posts)changed=tickPost(p,w)||changed;
   if(changed)g.save?.(false);
  }
  // Route gardée : nom de l'avant-poste qui tient le côté par lequel ce point local revient vers le dépôt.
  function guards(point){
   if(!active()||!state.posts.length||!point)return null;
   const core=g.core?.();if(!core||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
   const side=sideOf(point.x-core.x,point.y-core.y);
   for(const p of state.posts){const r=routeOf(p.id);if(r&&r.side===side)return title(site(p.id));}
   return null;
  }
  const roads=()=>active()?state.posts.map(p=>{const r=routeOf(p.id),s=site(p.id);return r&&s?{id:p.id,name:title(s),x:s.x,y:s.y,side:r.side,metres:r.metres,path:r.path.map(q=>({...q}))}:null;}).filter(Boolean):[];
  // Portée radio : vraie hors région, à portée de D-17 ou d'un avant-poste ; sans limite pour une ancienne campagne.
  function radioInRange(){
   if(!active())return true;
   const f=g.frontier.position();if(!f?.active)return true;
   const w=world(),near=q=>Math.hypot(q.x-f.x,q.y-f.y)<=R.radio.range;
   if(!w.home||near(w.home))return true;
   return state.posts.some(p=>{const s=site(p.id);return s&&near(s);});
  }
  const NOTE_TEXT={held:()=>'premier convoi à la prochaine accalmie',delivered:p=>'dernier convoi : '+amount(p.sent)+' unités livrées (vague '+p.convoy+')',
   nofuel:p=>'convoi resté sur place faute de carburant (vague '+p.convoy+')',full:p=>'convoi resté sur place, dépôt plein (vague '+p.convoy+')',empty:()=>'lieu vide, plus de convoi'};
  function line(p){
   const r=routeOf(p.id),left=leftOf(p);
   return p.garrison+' fusiliers en garnison · route '+(r?'gardée côté '+SIDE[r.side]+', '+metres(r.metres):'coupée')+' · reste sur place : '+(C.bagTotal(left)>1e-9?bagText(left):'rien')+' · '+NOTE_TEXT[p.note](p)+'.';
  }
  function candidates(){
   const w=world(),out=[];
   for(const id of g.frontier.discoveries()){const p=site(id);if(!p||post(id)||p.occupation==='allied'||!emptied(p))continue;out.push({p,d:w.home?Math.hypot(p.x-w.home.x,p.y-w.home.y):0});}
   return out.sort((a,b)=>a.d-b.d||(a.p.id<b.p.id?-1:1)).slice(0,OFFERS).map(c=>c.p);
  }
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : elle n’a ni avant-poste, ni route gardée, ni convoi. La règle ne s’active pas en cours de campagne.',
    rows:[{label:'Avant-postes',value:'Sans objet.'},{label:'Routes gardées',value:'Sans objet.'}]};
   const max=cap(age()),rows=[{label:'Avant-postes',value:max?state.posts.length+' sur '+max+' à cet âge.':'Aucun avant l’âge « '+C.CITY_TIERS[R.startAge].name+' ».'}];
   if(g.frontier)for(const p of state.posts)rows.push({label:title(site(p.id)),value:line(p)});
   rows.push({label:'Établir',value:'Au dépôt, sur un lieu visité, vidé de ses occupants et relié par la route : '+R.garrison+' fusiliers quittent la cité, '+bagText(R.cost)+' pris au stock.'},
    {label:'Route gardée',value:'Un avant-poste garde le côté de D-17 où il se trouve : un fourgon qui rentre de ce côté n’est pas barré par les Rouleurs.'},
    {label:'Convoi',value:(CONVOY.everyWaves>1?'Toutes les '+CONVOY.everyWaves+' vagues':'À chaque vague')+', en phase calme : '+CONVOY.lot+' unités au plus du fonds du lieu, contre '+CONVOY.fuel+' carburant du dépôt. Le fonds est fini.'},
    {label:'Radio',value:'Portée : '+metres(R.radio.range)+' autour de D-17 et de chaque avant-poste. Au-delà, silence.'});
   return{summary:'Un avant-poste immobilise des hommes et du carburant ; en échange, sa route est gardée et un convoi rentre seul tant que le lieu a quelque chose à donner.',rows};
  }
  function actions(){
   if(!active())return[];
   const out=[];
   for(const p of state.posts){const q=abandonQuote(p.id);out.push({id:'abandon-'+p.id,label:'Abandonner l’avant-poste : '+title(site(p.id)),description:p.garrison+' fusiliers rentrent à D-17. La route n’est plus gardée, les convois cessent, le coût d’établissement est perdu.',disabled:!q.ok,reason:q.reason||'Les hommes sont rendus à la cité.',run:()=>abandon(p.id)});}
   if(cap(age())>state.posts.length)for(const p of candidates()){const q=foundQuote(p.id),h=holding(world().seed,p);
    out.push({id:'found-'+p.id,label:'Établir un avant-poste : '+title(p),description:'Coût : '+R.garrison+' fusiliers et '+bagText(R.cost)+'. Fonds du lieu : '+bagText(h)+'.'+(q.route?' Route de '+metres(q.route.metres)+', côté '+SIDE[q.route.side]+' de D-17.':''),disabled:!q.ok,reason:q.reason||'La route devient gardée ; un convoi rentre à chaque accalmie.',run:()=>found(p.id)});}
   return out;
  }
  const economy=g.economyTick;
  if(typeof economy==='function')g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  // --- Présentation : lit `roads()`, ne modifie rien. ---
  const safe=fn=>{try{fn();}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}};
  const COLOR='#8fd0c0';
  function flag(c,x,y,text,width){
   c.save();c.strokeStyle=COLOR;c.fillStyle=COLOR;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-18);c.stroke();
   c.beginPath();c.moveTo(x,y-18);c.lineTo(x+11,y-14);c.lineTo(x,y-10);c.closePath();c.fill();
   if(text){c.font='bold 12px system-ui, sans-serif';c.textAlign='center';const w=Math.min(width||Infinity,(c.measureText?.(text)?.width||text.length*7)+10),left=Math.max(4,Math.min((width||Infinity)-w-4,x-w/2));
    c.fillStyle='rgba(12,24,18,.86)';c.fillRect(left,y+3,w,17);c.fillStyle=COLOR;c.fillText(text,left+w/2,y+16,w-6);}
   c.restore();
  }
  function drawAtlas(c,cam){
   if(!active()||!c||!cam?.screen)return;
   for(const r of roads()){
    c.save();c.strokeStyle='rgba(143,208,192,.8)';c.lineWidth=2.5;c.setLineDash?.([10,6]);c.beginPath();
    r.path.forEach((p,i)=>{const q=cam.screen(p.x,p.y);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);});c.stroke();c.setLineDash?.([]);c.restore();
    const q=cam.screen(r.x,r.y);if(q.x<-30||q.y<-30||q.x>cam.width+30||q.y>cam.height+30)continue;
    flag(c,q.x,q.y,'AVANT-POSTE · '+r.name,cam.width);
   }
  }
  function drawRegion(){
   if(!active()||!g.frontier.active()||g.state!=='playing'||!g.ctx||!state.posts.length)return;
   const f=g.frontier.position(),s=g.frontier.scale(),c=g.ctx,W=g.width,H=g.height;
   c.save();c.setTransform?.(g.dpr||1,0,0,g.dpr||1,0,0);
   for(const r of roads()){const x=W/2+(r.x-f.x)*s,y=H/2+(r.y-f.y)*s;if(x<0||y<0||x>W||y>H)continue;flag(c,x,y,'AVANT-POSTE · '+r.name,W);}
   c.restore();
  }
  if(doc||root.document){
   const render=g.render;
   if(typeof render==='function')g.render=function(...args){const result=render.apply(g,args);safe(drawRegion);return result;};
   const A=root.DeadwallAtlasRender;
   if(A&&typeof A.render==='function'&&!A.__outposts217){
    const base=A.render;A.__outposts217=true;
    A.render=function(c,game,v,cam,...rest){const result=base.call(this,c,game,v,cam,...rest);if(game?.outposts217)safe(()=>game.outposts217.drawAtlas(c,cam));return result;};
   }
  }
  const api=Object.freeze({active:()=>state.active,cap:()=>cap(age()),posts:()=>state.posts.map(p=>({...p,hauled:{...p.hauled},name:title(site(p.id)),left:leftOf(p)})),candidates:()=>active()?candidates().map(p=>p.id):[],
   holding:id=>site(id)?holdOf(id):null,foundQuote,found,abandonQuote,abandon,tick,guards,roads,radioInRange,overview,actions,drawAtlas,drawRegion,snapshot:()=>validate(state)});g.outposts217=api;
  g.expansions.register({id:'outposts217',title:'Avant-postes',overview,actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);memo=new WeakMap();},reset:()=>{state=fresh();memo=new WeakMap();}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,cap,holding,sideOf,lot,install});root.DeadwallOutposts217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL,root.document);
})(globalThis);
