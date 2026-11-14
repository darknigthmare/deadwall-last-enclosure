// Exploration en trois échelles, deuxième tranche (docs/GAME_BIBLE.md §7.9).
// 1. Chaque besoin de la cité est relié aux lieux déjà connus qui en détiennent encore.
// 2. Les six quartiers et les haltes d'expédition reçoivent un cap et une distance fixes sur la carte régionale.
// Présentation seulement : ce module lit les registres des couches existantes et le contrat de projection de l'atlas.
// Il ne crée ni stock, ni règle, ni tirage, ni horloge, ni état sauvegardé, et ne génère jamais le monde régional.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallExplorationNeeds217=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 // Bornes d'affichage, pas des règles de jeu.
 const PER_SCALE=2,REGION_SITES=40,REFRESH_SECONDS=1,MARK_SCALE=1.2,LABEL_SCALE=3.2,FOCUS_METRES=60;
 const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
 // Vocabulaire unique des lieux, partagé par le carnet, la liste des repères et la carte.
 // `entry` désigne le contrôle d'origine, déjà rangé dans la table des échelles.
 const TERMS=freeze({
  gisement:{label:'Gisement',plural:'Gisements',scale:'abords',entry:{kind:'fieldView',id:'recon'}},
  vestige:{label:'Vestige',plural:'Vestiges',scale:'abords',entry:{kind:'fieldView',id:'recon'}},
  cueillette:{label:'Cueillette',plural:'Cueillettes',scale:'abords',entry:{kind:'pack',id:'forage193'}},
  quartier:{label:'Quartier',plural:'Quartiers',scale:'secteurs',entry:{kind:'fieldView',id:'territories'}},
  halte:{label:'Halte d’expédition',plural:'Haltes d’expédition',scale:'secteurs',entry:{kind:'control',id:'expOpen'}},
  site:{label:'Site régional',plural:'Sites régionaux',scale:'region',entry:{kind:'fieldView',id:'recon'}}
 });
 const SCALE_ORDER=freeze(['abords','secteurs','region']);
 const SCALE_NAMES=freeze({abords:'Les abords',secteurs:'Les secteurs',region:'La région'});
 const NONE='Aucune source connue : explorer plus loin.';
 const WATER='Aucun lieu connu ne fournit d’eau : elle se règle dans l’enceinte, par les récupérateurs et les citernes.';
 const STATUS=freeze({held:'poste tenu',contested:'poste disputé',neutral:'poste à établir',lost:'quartier perdu, à reprendre',evacuated:'poste évacué, à reprendre'});
 const BEARINGS=freeze(['au nord','au nord-est','à l’est','au sud-est','au sud','au sud-ouest','à l’ouest','au nord-ouest']);
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const projection=()=>root.DeadwallAtlasProjection||(typeof require==='function'?require('./atlas-projection.js'):null);
 const whole=value=>Math.max(0,Math.floor(Number(value)||0));
 const finite=(...values)=>values.every(Number.isFinite);
 const lower=(C,key)=>(C.RESOURCE_META?.[key]?.label||key).toLowerCase();
 // Lecture d'un registre voisin : une couche absente ou en cours de reprise ne casse pas le carnet.
 const read=(fn,fallback)=>{try{const value=fn();return value===undefined||value===null?fallback:value;}catch{return fallback;}};
 // Cap sur une rose de huit vents, nord en haut (y décroissant), comme l'atlas.
 function bearing(dx,dy){if(!dx&&!dy)return '';const turn=Math.round(Math.atan2(dx,-dy)/(Math.PI/4));return BEARINGS[(turn%8+8)%8];}
 function metres(value){const m=Math.max(0,Number(value)||0);return m>=1000?(Math.round(m/100)/10).toFixed(1).replace('.',',')+' km':Math.round(m)+' m';}
 function away(distance,cap){return 'à '+metres(distance)+(cap?' '+cap:'');}
 // Monde régional déjà construit par le jeu, s'il l'est : ce module ne déclenche jamais sa génération.
 // L'atlas le fournit à chaque dessin ; dehors, le domaine régional le tient déjà.
 const regionSeen=new WeakMap(),poiCache=new WeakMap();
 function regionWorld(g){
  if(!g?.world)return null;
  if(read(()=>g.frontier.position().active,false))return read(()=>g.frontier.world(),null);
  const world=regionSeen.get(g.world)||null;
  return world&&world.seed===g.world.seed?world:null;
 }
 function remember(g,world){if(g?.world&&world&&typeof g.world==='object')regionSeen.set(g.world,world);}
 // Contenu immuable d'un lieu régional (meubles, abords, stationnement) ; le reste à prendre se lit dans le registre des prélèvements.
 function poiStock(world,poi){
  let cache=poiCache.get(world);if(!cache){cache=new Map();poiCache.set(world,cache);}
  let items=cache.get(poi.id);
  if(!items){
   items=[];
   const add=b=>{if(b&&typeof b.id==='string'&&typeof b.resource==='string'&&b.amount>0)items.push({id:b.id,resource:b.resource,amount:b.amount});};
   for(const z of poi.levels||[])for(const b of read(()=>world.plan(poi,z).objects,[]))add(b);
   for(const b of poi.outdoor||[])add(b);for(const b of poi.parking||[])add(b);
   cache.set(poi.id,items);
  }
  return items;
 }
 const centre=(g,C)=>{const b=read(()=>g.core(),null);return b&&finite(b.x,b.y)?{x:b.x,y:b.y}:{x:C.WORLD_SIZE/2,y:C.WORLD_SIZE/2};};
 const expeditionSites=(g,C)=>read(()=>C.Expeditions.sitesFor({cityGeometry202:g.world.cityGeometry202??0}),C.Expeditions?.SITES||[]);
 // Tout ce que les couches savent d'un lieu encore approvisionné. Fonction pure de l'état : elle ne fait que lire.
 // Un lieu vidé n'apparaît pas ; un lieu non repéré non plus.
 function sources(g,options={}){
  const C=core(),out=[];if(!g?.world||!C)return freeze(out);
  const U=C.AtlasRules?.unitsPerMetre||32,mid=centre(g,C);
  const local=(x,y)=>({distance:Math.hypot(x-mid.x,y-mid.y)/U,cap:bearing(x-mid.x,y-mid.y)});
  const push=(kind,id,name,remaining,place,extra)=>{const bag={};for(const key of C.RESOURCE_KEYS)if(whole(remaining[key])>=1)bag[key]=whole(remaining[key]);if(Object.keys(bag).length)out.push({id:kind+':'+id,kind,term:TERMS[kind].label,scale:TERMS[kind].scale,name,remaining:bag,distance:place.distance,cap:place.cap,entry:TERMS[kind].entry,...extra});};
  // Abords — gisements à pied autour de D-17 : un seul lieu par ressource, le point le plus proche en repère.
  const fields=new Map();
  for(const node of g.world.nodes||[]){
   if(!node||node.depleted||!(node.amount>0)||!finite(node.x,node.y)||!C.RESOURCE_KEYS.includes(node.type))continue;
   const d=Math.hypot(node.x-mid.x,node.y-mid.y),row=fields.get(node.type)||{count:0,total:0,best:Infinity,node:null};
   row.count++;row.total+=node.amount;if(d<row.best||d===row.best&&node.id<row.node.id){row.best=d;row.node=node;}fields.set(node.type,row);
  }
  for(const key of C.RESOURCE_KEYS){const row=fields.get(key);if(row)push('gisement',key,'Autour de D-17',{[key]:row.total},local(row.node.x,row.node.y),{note:row.count+(row.count>1?' points à récolter':' point à récolter')+', le plus proche'});}
  // Abords — vestiges relevés par les chantiers de jour.
  for(const s of read(()=>g.dayworks.snapshot().sites,[])){const def=C.Dayworks?.BY_ID?.[s?.id];if(def&&s.seen&&finite(s.x,s.y))push('vestige',s.id,def.name,{[def.resource]:s.remaining},local(s.x,s.y));}
  // Abords — cueillette en vue (seulement dehors : le module propriétaire ne montre rien depuis la cité).
  const region=options.regionWorld===undefined?regionWorld(g):options.regionWorld,P=projection(),home=P?read(()=>P.home(g),null):null;
  const far=(x,y)=>home?{distance:Math.hypot(x-home.x,y-home.y),cap:bearing(x-home.x,y-home.y)}:{distance:0,cap:''};
  for(const q of read(()=>g.forage193.visible(),[]))if(q&&finite(q.x,q.y)&&typeof q.id==='string')push('cueillette',q.id,q.name,{[q.resource]:q.amount},far(q.x,q.y));
  // Secteurs — les six quartiers : réserve du quartier et stock déjà trié au poste.
  const sectors=read(()=>g.territories.snapshot().sectors,null);
  if(sectors)for(const def of C.TERRITORY_SECTORS||[]){
   const s=sectors[def.id],site=(g.world.sites||[]).find(p=>p.theme===def.id);if(!s||!site)continue;
   const sorted=whole(s.stock);
   push('quartier',def.id,def.name,{[def.resource]:(Number(s.remaining)||0)+(Number(s.stock)||0)},local(site.x,site.y),{note:(STATUS[s.status]||'poste à établir')+(sorted>=1?', '+sorted+' déjà trié au poste':'')});
  }
  // Secteurs — haltes d'expédition repérées : stock du registre, jamais le catalogue.
  const halts=read(()=>g.expeditions.snapshot().sites,[]),defs=new Map(expeditionSites(g,C).map(d=>[d.id,d]));
  for(const s of halts){const def=defs.get(s?.id);if(def&&s.known&&s.stock)push('halte',s.id,def.name,s.stock,local(def.x,def.y),{note:'voiture requise'});}
  // Région — sites repérés, si le monde régional est déjà construit dans cette session.
  const seen=read(()=>g.frontier.discoveries(),[]);
  if(region&&home&&seen.length&&Array.isArray(region.pois)){
   let cache=poiCache.get(region);if(!cache){cache=new Map();poiCache.set(region,cache);}
   let index=cache.get('#index');if(!index){index=new Map(region.pois.map(p=>[p.id,p]));cache.set('#index',index);}
   const near=seen.map(id=>index.get(id)).filter(Boolean).map(p=>({p,d:Math.hypot(p.x-home.x,p.y-home.y)})).sort((a,b)=>a.d-b.d||(a.p.id<b.p.id?-1:1)).slice(0,REGION_SITES);
   for(const {p}of near){
    const left={};for(const item of poiStock(region,p)){const rest=item.amount-(read(()=>g.frontier.takenAmount(item.id),0)||0);if(rest>0)left[item.resource]=(left[item.resource]||0)+rest;}
    push('site',p.id,p.name,left,far(p.x,p.y));
   }
  }
  return freeze(out);
 }
 // Sites régionaux repérés que ce module ne peut pas relire sans carte construite.
 function unreadSites(g,options={}){
  const region=options.regionWorld===undefined?regionWorld(g):options.regionWorld;
  const seen=read(()=>g.frontier.discoveries(),[]).length;return region?Math.max(0,seen-REGION_SITES):seen;
 }
 function placeText(C,source,resource){
  const amount=source.remaining[resource],where=source.scale==='region'||source.kind==='cueillette'?'de D-17':'du centre de D-17';
  const link=source.note?' ; '+source.note+(source.kind==='gisement'?' ':', '):', ';
  return source.term+' · '+SCALE_NAMES[source.scale]+' — encore '+amount+' '+lower(C,resource)+link+away(source.distance,source.cap)+' '+where+'.';
 }
 // Pour chaque besoin : les lieux qui y répondent réellement, à chaque échelle dont l'entrée est ouverte.
 // `options.offered(entry)` dit si le contrôle d'origine est proposé (présent et non voilé par l'âge).
 function proposals(g,needs,options={}){
  const C=core(),list=needs||[],out=[];if(!g||!C)return freeze(out);
  const offered=typeof options.offered==='function'?options.offered:()=>true;
  const all=list.some(n=>n?.resource)?sources(g,options):[],open=all.filter(s=>offered(s.entry)),unread=unreadSites(g,options);
  for(const need of list){
   if(!need?.resource){out.push({need:need.id,places:[],none:need.id==='water'?WATER:null,hint:null});continue;}
   const places=[];
   for(const scale of SCALE_ORDER){
    const found=open.filter(s=>s.scale===scale&&s.remaining[need.resource]>=1).sort((a,b)=>a.distance-b.distance||(a.id<b.id?-1:a.id>b.id?1:0)).slice(0,PER_SCALE);
    for(const s of found)places.push({id:s.id,kind:s.kind,scale:s.scale,name:s.name,amount:s.remaining[need.resource],distance:s.distance,text:placeText(C,s,need.resource),entry:s.entry,button:'OUVRIR'});
   }
   const hint=unread>0&&offered(TERMS.site.entry)?unread+(unread>1?' sites régionaux repérés':' site régional repéré')+' non relu'+(unread>1?'s':'')+' ici : ouvrez la carte régionale pour lire leurs réserves.':null;
   out.push({need:need.id,places,none:places.length?null:NONE,hint});
  }
  return freeze(out);
 }
 // Repères fixes : position régionale de chaque quartier et de chaque halte, par le contrat de projection de l'atlas.
 // Cap et distance depuis le centre de D-17, puis ville nommée la plus proche si la carte régionale est construite.
 // Fonction pure de la graine et des données déjà générées : aucun état n'est lu ni écrit pour placer un lieu.
 function landmarks(g,options={}){
  const C=core(),P=projection(),out=[];if(!g?.world||!C||!P)return freeze(out);
  const home=read(()=>P.home(g),null);if(!home)return freeze(out);
  const region=options.regionWorld===undefined?regionWorld(g):options.regionWorld,towns=options.towns||region?.towns||null;
  const known=new Map(read(()=>g.expeditions.snapshot().sites,[]).map(s=>[s.id,s.known===true]));
  const place=(kind,id,name,lx,ly,shown)=>{
   const p=P.toRegion(lx,ly,g),dx=p.x-home.x,dy=p.y-home.y,distance=Math.hypot(dx,dy),cap=bearing(Math.round(dx),Math.round(dy));
   let town=null;
   for(const t of towns||[]){if(!t||!finite(t.x,t.y)||typeof t.name!=='string')continue;const d=Math.hypot(t.x-p.x,t.y-p.y);if(!town||d<town.distance||d===town.distance&&t.id<town.id)town={id:t.id,name:t.name,kind:t.kind||'',distance:d,cap:bearing(t.x-p.x,t.y-p.y)};}
   const text=TERMS[kind].label+' · '+away(distance,cap)+' du centre de D-17'+(town?' · ville nommée la plus proche : '+town.name+(town.kind?' ('+town.kind+')':'')+', '+away(town.distance,town.cap):'')+'.';
   out.push({id:kind+':'+id,kind,term:TERMS[kind].label,name,x:p.x,y:p.y,distance,cap,town,known:shown,text});
  };
  for(const def of C.TERRITORY_SECTORS||[]){const site=(g.world.sites||[]).find(s=>s.theme===def.id);if(site&&finite(site.x,site.y))place('quartier',def.id,def.name,site.x,site.y,true);}
  for(const def of expeditionSites(g,C))if(finite(def.x,def.y))place('halte',def.id,def.name,def.x,def.y,known.get(def.id)===true);
  return freeze(out);
 }
 // Peintre des repères sur l'atlas : lecture seule, après le rendu d'origine. Rien n'est dessiné à l'échelle
 // de la région entière, où les dix-huit repères tiendraient dans le point de D-17.
 function drawLandmarks(c,cam,marks){
  if(!c||!cam||typeof cam.screen!=='function'||!(cam.scale>=MARK_SCALE))return 0;
  let drawn=0;c.save?.();
  for(const m of marks||[]){
   if(!m.known)continue;const q=cam.screen(m.x,m.y);if(!finite(q.x,q.y)||q.x<-12||q.y<-12||q.x>cam.width+12||q.y>cam.height+12)continue;
   c.beginPath();
   if(m.kind==='quartier'){c.moveTo(q.x,q.y-6);c.lineTo(q.x+6,q.y);c.lineTo(q.x,q.y+6);c.lineTo(q.x-6,q.y);c.closePath();}
   else c.rect(q.x-4,q.y-4,8,8);
   c.fillStyle=m.kind==='quartier'?'rgba(226,201,135,.92)':'rgba(137,182,172,.92)';c.fill();c.strokeStyle='#14251b';c.lineWidth=1.5;c.stroke();
   if(cam.scale>=LABEL_SCALE&&typeof c.fillText==='function'){c.font='11px system-ui';c.textAlign='left';c.lineWidth=3;c.strokeStyle='rgba(10,24,16,.85)';c.strokeText?.(m.name,q.x+9,q.y+4);c.fillStyle='#f0e6c8';c.fillText(m.name,q.x+9,q.y+4);}
   drawn++;
  }
  c.restore?.();return drawn;
 }
 // L'atlas appelle `render` par l'objet partagé : l'enveloppe ajoute les repères et retient le monde régional déjà construit.
 let wrapped=false;
 function wrapAtlas(){
  const R=root.DeadwallAtlasRender;if(wrapped||!R||typeof R.render!=='function'||Object.isFrozen(R))return wrapped;
  const render=R.render;
  R.render=function(c,g,v,cam,layers,...rest){
   const result=render.call(this,c,g,v,cam,layers,...rest);
   try{remember(g,v?.world);if(layers?.places!==false)drawLandmarks(c,cam,landmarks(g,{regionWorld:v?.world||null}));}catch{/* un repère illisible ne doit jamais empêcher la carte */}
   return result;
  };
  wrapped=true;return true;
 }
 function install(g,doc){
  if(!g||!doc?.body||g.explorationNeeds217)return false;
  wrapAtlas();
  const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
  let box=null,list=null,note=null,key='',clock=-Infinity;
  const map=()=>doc.getElementById('frontierMap');
  // La liste se pose sous la carte régionale dès que celle-ci existe ; sans carte, le module reste une simple lecture.
  function mount(){
   if(box)return true;const canvas=map(),host=doc.getElementById('frontierDossier')||canvas?.parentNode;if(!canvas||!host)return false;
   box=el('details',undefined,'exploration-landmarks');box.id='explorationLandmarks217';
   box.append(el('summary','Repères de D-17 sur la carte régionale'));
   note=el('p',undefined,'exploration-landmarks-note');list=el('ul');list.id='explorationLandmarksList217';box.append(note,list);
   const anchor=doc.getElementById('frontierRoute')||host.querySelector?.('.atlas-city-card')||null;
   if(anchor&&typeof anchor.after==='function')anchor.after(box);else host.appendChild(box);
   return true;
  }
  function focus(mark){const atlas=map()?.atlas;if(!atlas||typeof atlas.focusPoint!=='function')return false;atlas.focusPoint(mark.x,mark.y,FOCUS_METRES);return true;}
  function render(){
   if(!mount())return false;
   const shown=g.state==='playing'&&!g.gameOver;if(box.hidden!==!shown)box.hidden=!shown;if(!shown)return false;
   const marks=landmarks(g).filter(m=>m.known),towns=marks.some(m=>m.town);
   const next=JSON.stringify(marks.map(m=>[m.id,m.text]));if(next===key)return true;key=next;
   note.textContent='Une seule carte : la cité, ses quartiers et ses haltes occupent le carré de D-17 dans le repère régional. Cap et distance sont fixes pour cette campagne.'+(towns?'':' La ville nommée la plus proche s’affiche une fois la carte régionale dessinée.');
   list.replaceChildren();
   for(const m of marks){
    const item=el('li');item.dataset.landmark=m.id;
    const b=el('button','CENTRER');b.type='button';b.addEventListener('click',()=>{focus(m);});
    item.append(el('strong',m.name),el('span',m.text),b);list.appendChild(item);
   }
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS){clock=now;render();}return result;};
  for(const method of ['startNew','restoreSave']){const old=g[method];if(typeof old!=='function')continue;g[method]=function(...args){const result=old.apply(this,args);key='';clock=Number(g.elapsed)||0;render();return result;};}
  g.explorationNeeds217=Object.freeze({render,focus,sources:options=>sources(g,options),proposals:(needs,options)=>proposals(g,needs,options),landmarks:options=>landmarks(g,options)});
  render();return true;
 }
 return Object.freeze({install,sources,proposals,landmarks,drawLandmarks,bearing,metres,wrapAtlas,TERMS,SCALE_NAMES,NONE,WATER});
});
