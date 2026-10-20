/* Physical bridges and conserved, manually carried equipment. No duplicate inventory owner. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const R=C.VerticalNetwork179,V=C.VerticalCitadel175,EPS=1e-7;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const finite=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isFinite(x)&&x>=min&&x<=max;
 const integer=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
 const fields=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&Object.keys(o).every(k=>keys.includes(k));
 const initial=()=>({version:1,nextId:1,links:[],cargo:null,crates:[]});
 const key=p=>p.site+':'+p.level;
 const definition=l=>R.links.find(d=>d.id===l?.kind);
 function bounds(b){const d=V.bases[b.type]||b.def||C.CityGeometry202.definition(b.type,b.geometryVersion202??0),swap=(b.rotation||0)%2;return{x:b.gx,y:b.gy,w:d.size[swap?1:0],h:d.size[swap?0:1]};}
 function moduleBox(b,m,z){const q=bounds(b),d=V.modules[m.kind],xs=[.23,.77,.23,.77],ys=[.23,.23,.77,.77];return{x:q.x+q.w*xs[m.slot]-d.size[0]/2,y:q.y+q.h*ys[m.slot]-d.size[1]/2,z,w:d.size[0],h:d.size[1],d:d.range?1.5:2.6};}
 const overlap=(a,b)=>a.x<b.x+b.w-EPS&&a.x+a.w>b.x+EPS&&a.y<b.y+b.h-EPS&&a.y+a.h>b.y+EPS;
 const contains=(q,x,y,r=0)=>x-r>=q.x-EPS&&x+r<=q.x+q.w+EPS&&y-r>=q.y-EPS&&y+r<=q.y+q.h+EPS;
 const deckZ=(b,p)=>V.bases[b.type].height+p.level*V.deckRise;
 const ready=(b,s,p)=>b&&V.bases[b.type]&&!b.dead&&b.health>0&&b.progress===1&&s?.decks[p.level]?.progress===1;
 function shape(l,buildings,sites){
  const a=buildings.get(l.a.site),b=buildings.get(l.b.site),sa=sites.find(s=>s.id===l.a.site),sb=sites.find(s=>s.id===l.b.site),d=definition(l);
  if(!d||l.a.site===l.b.site||!ready(a,sa,l.a)||!ready(b,sb,l.b))return null;
  const z=deckZ(a,l.a);if(Math.abs(z-deckZ(b,l.b))>EPS||z>C.VerticalAges177.ages[d.tier].height)return null;
  const qa=bounds(a),qb=bounds(b),width=d.width,landing=R.landing;
  let q=null,ports=null,gap;
  if(qa.x+qa.w<=qb.x||qb.x+qb.w<=qa.x){
   const left=qa.x<qb.x?qa:qb,right=left===qa?qb:qa,low=Math.max(qa.y,qb.y),high=Math.min(qa.y+qa.h,qb.y+qb.h);
   gap=right.x-left.x-left.w;if(high-low<width+2*R.margin)return null;
   const y=(low+high-width)/2;
   q={x:left.x+left.w-landing,y,w:gap+2*landing,h:width,z};
   const p0={x:q.x+R.margin,y:y+width/2,z},p1={x:q.x+q.w-R.margin,y:y+width/2,z};ports=left===qa?[p0,p1]:[p1,p0];
  }else if(qa.y+qa.h<=qb.y||qb.y+qb.h<=qa.y){
   const top=qa.y<qb.y?qa:qb,bottom=top===qa?qb:qa,low=Math.max(qa.x,qb.x),high=Math.min(qa.x+qa.w,qb.x+qb.w);
   gap=bottom.y-top.y-top.h;if(high-low<width+2*R.margin)return null;
   const x=(low+high-width)/2;
   q={x,y:top.y+top.h-landing,w:width,h:gap+2*landing,z};
   const p0={x:x+width/2,y:q.y+R.margin,z},p1={x:x+width/2,y:q.y+q.h-R.margin,z};ports=top===qa?[p0,p1]:[p1,p0];
  }
  if(!q||gap<R.minSpan-EPS||gap>d.maxSpan+EPS)return null;
  return{...q,gap,ports,link:l,definition:d};
 }
 function load(links,id,buildings,sites){return links.filter(l=>l.a.site===id||l.b.site===id).reduce((n,l)=>{const q=shape(l,buildings,sites);return n+(q?(q.gap+2*R.landing)*q.definition.massPerMetre/2:0);},0);}
 function onBridge(network,actor,p,buildings,sites,r=.26){
  if(!actor||!p)return false;
  return network.links.some(l=>{if(l.progress!==1||!['a','b'].some(k=>key(l[k])===key(actor)))return false;const q=shape(l,buildings,sites);return q&&contains(q,p.x/V.tile,p.y/V.tile,r)&&(!network.cargo||V.modules[network.cargo.kind].mass<=q.definition.payload);});
 }
 function insideFloor(actor,p,buildings,sites,r=.26){const b=buildings.get(actor?.site),s=sites.find(s=>s.id===actor?.site);return ready(b,s,actor)&&contains(bounds(b),p.x/V.tile,p.y/V.tile,r);}
 function structuralCollision(q,l,buildings,sites,nodes=[]){
  for(const b of buildings.values()){
   if(b.dead||!(b.health>0))continue;
   const def=V.bases[b.type]||b.def||C.CityGeometry202.definition(b.type,b.geometryVersion202??0);if(!def)continue;
   const box=bounds(b),end=b.id===l.a.site||b.id===l.b.site;
   if(!end&&overlap(q,box)&&C.CityGeometry202.structureHeight(def,b.geometryVersion202??0)>q.z-R.deckThickness+EPS)return true;
   const s=sites.find(s=>s.id===b.id);if(!s)continue;
   for(let i=0;i<s.decks.length;i++){
    const z=V.bases[b.type].height+i*V.deckRise;
    if(!end&&overlap(q,box)&&i>0&&Math.abs(z-q.z)<R.deckThickness+EPS)return true;
    for(const m of s.decks[i].modules){const mb=moduleBox(b,m,z);if(overlap(q,mb)&&mb.z<q.z+R.railHeight&&mb.z+mb.d>q.z-R.deckThickness)return true;}
   }
  }
  for(const n of nodes)if(n.type==='wood'&&n.amount>0&&!n.depleted&&R.treeHeight>q.z-R.deckThickness){const r=(n.radius||16)/V.tile;if(overlap(q,{x:n.x/V.tile-r,y:n.y/V.tile-r,w:2*r,h:2*r}))return true;}
  return false;
 }
 function normalize(raw,full,vertical){
  raw=raw===undefined?initial():raw;
  const bad=why=>{throw Error('Réseau vertical invalide : '+why);};
  if(!fields(raw,['version','nextId','links','cargo','crates'])||raw.version!==1||!integer(raw.nextId,1)||!Array.isArray(raw.links)||raw.links.length>R.maxLinks||!Array.isArray(raw.crates)||raw.crates.length>R.maxCrates)bad('format');
  const ids=new Set(),pairs=new Set(),moduleIds=new Set(),buildings=new Map((full?.buildings||[]).map(b=>[b.id,{...b,geometryVersion202:full?.cityGeometry202??0}])),sites=vertical?.sites||[];
  for(const s of sites)for(const d of s.decks)for(const m of d.modules)moduleIds.add(m.id);
  for(const e of vertical?.giants||[])moduleIds.add(e.id);
  const endpoint=p=>fields(p,['site','level'])&&integer(p.site,1)&&integer(p.level,0,V.maxDecks-1);
  for(const l of raw.links){
   const def=definition(l);
   if(!fields(l,['id','kind','a','b','progress','health'])||!integer(l.id,1,raw.nextId-1)||ids.has(l.id)||!def||!endpoint(l.a)||!endpoint(l.b)||l.a.site===l.b.site||!finite(l.progress,0,1)||!finite(l.health,Number.EPSILON,def.health))bad('liaison');
   const pair=[key(l.a),key(l.b)].sort().join('/');if(pairs.has(pair))bad('liaison dupliquée');ids.add(l.id);pairs.add(pair);
   if(full){const q=shape(l,buildings,sites);if(!q||structuralCollision(q,l,buildings,sites,full.nodes))bad('géométrie ou appui de liaison');
    for(const other of raw.links){if(other===l)break;const b=shape(other,buildings,sites);if(b&&Math.abs(b.z-q.z)<R.deckThickness&&overlap(q,b))bad('liaisons superposées');}
   }
  }
  function checkModule(m){const d=V.modules[m?.kind];
   if(!fields(m,['id','kind','slot','progress','health','ammo','yaw','pitch','heat','cooldown','overheated'])||!d||!integer(m.id,1,(vertical?.nextId??Number.MAX_SAFE_INTEGER)-1)||moduleIds.has(m.id)||!integer(m.slot,0,3)||m.progress!==1||!finite(m.health,Number.EPSILON,d.health)||!integer(m.ammo,0,d.capacity||0)||!finite(m.yaw,-Math.PI,Math.PI)||!finite(m.pitch,-1.45,1.1)||!finite(m.heat,0,V.heatLimit)||!finite(m.cooldown,0,10)||typeof m.overheated!=='boolean')bad('chargement');
   moduleIds.add(m.id);
  }
  if(raw.cargo!==null){checkModule(raw.cargo);if(full&&(full.player?.dead||!(full.player?.health>0)||full.frontier?.active||full.expeditions?.vehicle?.driving))bad('porteur absent ou hors secteur');}
  for(const crate of raw.crates){
   if(!fields(crate,['module','x','y','z','site','level'])||!finite(crate.x,0,C.WORLD_SIZE)||!finite(crate.y,0,C.WORLD_SIZE)||!finite(crate.z,0,V.maxHeight))bad('caisse');checkModule(crate.module);
   if(crate.site===null){if(crate.level!==-1||crate.z!==0)bad('caisse au sol');}
   else if(!integer(crate.site,1)||!integer(crate.level,0,V.maxDecks-1))bad('palier de caisse');
   else if(full){const p={site:crate.site,level:crate.level},b=buildings.get(p.site);if(!ready(b,sites.find(s=>s.id===p.site),p)||Math.abs(deckZ(b,p)-crate.z)>EPS||!insideFloor(p,crate,buildings,sites,.05)&&!onBridge({...raw,cargo:null},p,crate,buildings,sites,.05))bad('caisse hors sol porteur');}
  }
  if(moduleIds.size>V.maxModules+(vertical?.giants?.length||0))bad('nombre d’équipements');
  if(full)for(const s of sites){const b=buildings.get(s.id);if(!b||!V.bases[b.type])continue;const mass=s.decks.reduce((n,d,i)=>n+(i?V.deckMass:0)+d.modules.reduce((a,m)=>a+V.modules[m.kind].mass,0),0);if(mass+load(raw.links,s.id,buildings,sites)>V.bases[b.type].capacity+EPS)bad('charge d’ancrage');}
  return copy(raw);
 }
 function create(g,h){
  const S=h.S,net=()=>h.state().network,sites=()=>h.state().sites,buildings=()=>g.world.buildings;
  let job=null,review=null,notice='';
  const no=reason=>({ok:false,reason}),ok=reason=>({ok:true,reason}),tell=q=>{notice=q.reason;g.notify?.(notice,q.ok?'good':'danger');return q;};
  const carrying=()=>!!net().cargo,busy=()=>!!job;
  const can=()=>h.can(true)&&!h.nativeBusy()&&!job&&g.player.reload<=0;
  const otherCarrying=()=>!!(g.essentials?.carrying?.()||g.campaignPack?.carrying?.()||g.explorationPack?.carrying?.());
  const available=()=>can()&&!carrying()&&!otherCarrying();
  const floor=()=>{const p=h.pose(),s=sites().find(s=>s.id===p.site),b=buildings().get(p.site);return p.site&&ready(b,s,p)&&contains(bounds(b),g.player.x/V.tile,g.player.y/V.tile,g.player.radius/V.tile)?{p,s,b}:null;};
  const linkShape=l=>shape(l,buildings(),sites());
  const link=id=>net().links.find(l=>l.id===id);
  const materialCost=q=>Object.fromEntries(Object.entries(q.definition.costPerMetre).map(([k,n])=>[k,Math.ceil(n*q.gap)]));
  const weight=id=>load(net().links,id,buildings(),sites());
  function reserveConflict(b,level,box){const z=V.bases[b.type].height+level*V.deckRise;if(net().crates.some(c=>Math.abs(c.z-z)<EPS&&overlap(box,{x:c.x/V.tile-R.crateSize/2,y:c.y/V.tile-R.crateSize/2,w:R.crateSize,h:R.crateSize})))return true;return net().links.some(l=>{const q=linkShape(l);return q&&Math.abs(q.z-z)<EPS&&overlap(q,box);});}
  function corridorFree(l,q){if(structuralCollision(q,l,buildings(),sites(),g.world.nodes))return false;return !net().links.some(x=>x.id!==l.id&&(()=>{const other=linkShape(x);return other&&Math.abs(other.z-q.z)<R.deckThickness&&overlap(q,other);})());}
  function linkQuote(toSite,toLevel=0,kind=R.links[g.tier.id].id){
   if(!available())return no('Libérez vos mains avant de financer une liaison.');
   const f=floor(),d=R.links.find(d=>d.id===kind);if(!f||!d||d.tier>g.tier.id||net().links.length>=R.maxLinks)return no('Support, âge ou capacité de liaison indisponible.');
   if(!integer(toSite,1)||!integer(toLevel,0,V.maxDecks-1))return no('Destination invalide.');
   const candidate={id:net().nextId,kind,a:{site:f.p.site,level:f.p.level},b:{site:toSite,level:toLevel},progress:0,health:d.health};
   if(net().links.some(l=>[key(l.a),key(l.b)].sort().join('/')===[key(candidate.a),key(candidate.b)].sort().join('/')))return no('Ces paliers possèdent déjà une liaison ou un chantier.');
   const q=linkShape(candidate);if(!q)return no('Il faut deux paliers alignés, de même hauteur et à portée du kit.');
   if(!corridorFree(candidate,q))return no('La portée ou ses accès rencontrent un obstacle ; libérez le passage.');
   const mass=(q.gap+2*R.landing)*d.massPerMetre/2;
   for(const p of [candidate.a,candidate.b]){const s=sites().find(s=>s.id===p.site),b=buildings().get(p.site);if(S.mass(s)+weight(p.site)+mass>V.bases[b.type].capacity+EPS)return no('Charge d’ancrage excessive sur un support.');}
   const start=q.ports[0];if(Math.hypot(g.player.x/V.tile-start.x,g.player.y/V.tile-start.y)>R.reach/V.tile)return no('Approchez le bord de départ de la passerelle.');
   const cost=materialCost(q);if(!C.canAfford(g.resources,cost))return no('Matériaux manquants : '+C.resourceText(cost));
   return{ok:true,candidate,q,cost,seconds:R.buildBaseSeconds+q.gap*d.secondsPerMetre};
  }
  function startJob(operation,q){job={operation,object:q.object||q.candidate,elapsed:0,seconds:q.seconds,x:g.player.x,y:g.player.y,z:h.pose().z,health:g.player.health,world:g.world,slot:q.slot,site:q.site,level:q.level,stamp:q.stamp,cost:q.cost||{}};review=null;g.releaseInputs();return tell(ok('Travaux : '+operation+'. Restez sur place ; une pause suspend le travail.'));}
  function buildLink(toSite,toLevel,kind){const q=linkQuote(toSite,toLevel,kind);if(!q.ok)return tell(q);C.spend(g.resources,q.cost);net().links.push(q.candidate);net().nextId++;return startJob('bridge',q);}
  function nearEnd(l){const p=h.pose(),q=linkShape(l);return q&&[0,1].some(i=>key(l[i?'b':'a'])===key(p)&&Math.hypot(g.player.x/V.tile-q.ports[i].x,g.player.y/V.tile-q.ports[i].y)<=R.reach/V.tile)&&!!floor();}
  function bridgeOccupied(l){const q=linkShape(l);if(!q)return false;return h.bridgeHasInvader?.(l.id)||Math.abs(h.pose().z-q.z)<EPS&&!floor()&&contains(q,g.player.x/V.tile,g.player.y/V.tile)||net().crates.some(c=>Math.abs(c.z-q.z)<EPS&&contains(q,c.x/V.tile,c.y/V.tile));}
  function bridgeServiceQuote(id,operation){
   const l=link(id);if(!available()||!l||!nearEnd(l))return no('Rejoignez un ancrage, les mains libres.');
   const q=linkShape(l),cost=materialCost(q);
   if(operation==='bridge')return l.progress<1?{ok:true,object:l,seconds:R.buildBaseSeconds+q.gap*q.definition.secondsPerMetre,cost:{},q}:no('Passerelle déjà achevée.');
   if(operation==='removeBridge')return bridgeOccupied(l)?no('La passerelle porte encore un acteur ou une caisse.'): {ok:true,object:l,seconds:R.removeSeconds,refund:Object.fromEntries(Object.entries(cost).map(([k,n])=>[k,Math.floor(n*R.salvageFraction*l.progress*l.health/q.definition.health+EPS)])),q};
   if(operation==='repairBridge'){
    const amount=Math.min(R.repairHealth,q.definition.health-l.health);if(amount<=0||l.progress!==1)return no('Passerelle inachevée ou intégrité complète.');
    const repair=Object.fromEntries(Object.entries(cost).map(([k,n])=>[k,Math.ceil(n*C.VerticalAges177.repairFraction*amount/q.definition.health)]));
    if(!C.canAfford(g.resources,repair))return no('Matériaux de réparation manquants.');return{ok:true,object:l,seconds:R.repairSeconds,cost:repair,amount,q};
   }return no('Intervention inconnue.');
  }
  function serviceBridge(id,operation,confirm=false){
   const q=bridgeServiceQuote(id,operation);if(!q.ok){review=null;return tell(q);}
   if(operation==='removeBridge'){const stamp=JSON.stringify([q.object,g.resources,net().crates]);if(!confirm||review?.id!==id||review.stamp!==stamp){review={id,stamp};return tell({ok:false,confirmation:true,reason:'Confirmer la dépose de la passerelle ? Récupération maximale : '+C.resourceText(q.refund)});}}
   return startJob(operation,q);
  }
  function packQuote(id){
   if(!available()||net().crates.length>=R.maxCrates)return no('Libérez vos mains ou récupérez les caisses en attente.');
   const q=h.moduleRef(id),f=floor();if(!q||!f||q.s.id!==f.p.site||q.level!==f.p.level||q.m.progress!==1)return no('Rejoignez un équipement achevé sur ce palier.');
   if(q.def.mass>R.links[g.tier.id].payload)return no('Charge trop lourde pour le portage de cet âge.');
   const p=S.slots(q.b)[q.m.slot];if(Math.hypot(g.player.x-p.x*V.tile,g.player.y-p.y*V.tile)>R.reach)return no('Approchez l’équipement à emballer.');
   const capacity=Math.max(100,g.storage-(q.def.storage||0));if(q.def.storage&&C.RESOURCE_KEYS.some(k=>g.resources[k]>capacity+EPS))return no('Réduisez les stocks avant de transporter cette réserve.');
   const cost={wood:Math.ceil(q.def.mass/R.packingMassPerWood),scrap:Math.ceil(q.def.mass/R.packingMassPerScrap)};if(!C.canAfford(g.resources,cost))return no('Matériaux d’emballage manquants.');
   return{ok:true,...q,object:q.m,cost,seconds:R.packSeconds+q.def.mass*R.handleSecondsPerMass,stamp:JSON.stringify(q.m)};
  }
  function packModule(id){const q=packQuote(id);return q.ok?startJob('pack',q):tell(q);}
  function unloadQuote(slot){
   if(!can()||!carrying())return no('Aucun équipement porté ou mains occupées.');
   const f=floor(),m=net().cargo;if(!f||!integer(slot,0,3))return no('Rejoignez une dalle et choisissez un emplacement.');
   const box=S.moduleBox(f.b,{...m,slot},f.p.z),q=bounds(f.b);
   if(!contains(q,box.x,box.y)||!contains(q,box.x+box.w,box.y+box.h))return no('Équipement trop grand pour ce support.');
   if(S.mass(f.s)+weight(f.s.id)+V.modules[m.kind].mass>V.bases[f.b.type].capacity+EPS)return no('Charge portante insuffisante.');
   if(reserveConflict(f.b,f.p.level,box))return no('Gardez l’accès de passerelle libre.');
   const clear=h.clearFootprint(f.b,f.p.level,m.kind,slot);if(!clear.ok)return clear;
   if(Math.hypot(g.player.x-f.b.x,g.player.y-f.b.y)>V.workReach)return no('Rejoignez le palier central pour déballer.');
   return{ok:true,object:m,site:f.s.id,level:f.p.level,slot,seconds:R.unpackSeconds+V.modules[m.kind].mass*R.handleSecondsPerMass,stamp:JSON.stringify(m)};
  }
  function unloadModule(slot){const q=unloadQuote(slot);return q.ok?startJob('unpack',q):tell(q);}
  function pickupQuote(id){
   if(!available())return no('Libérez vos mains.');const c=net().crates.find(c=>c.module.id===id),p=h.pose();
   if(!c||Math.abs(c.z-p.z)>EPS||Math.hypot(c.x-g.player.x,c.y-g.player.y)>R.reach||V.modules[c.module.kind].mass>R.links[g.tier.id].payload)return no('Caisse absente, trop lourde ou hors de portée.');
   if(c.site===null&&!h.groundLine(g.player,c))return no('Un obstacle sépare le porteur de la caisse.');
   return{ok:true,object:c,seconds:R.packSeconds,stamp:JSON.stringify(c)};
  }
  function pickup(id){const q=pickupQuote(id);return q.ok?startJob('pickup',q):tell(q);}
  function dropCargo(force=false){
   if(!net().cargo||!force&&(!can()||net().crates.length>=R.maxCrates))return tell(no('Dépose impossible pendant une autre action.'));
   const p=h.pose(),f=h.surfaceAt(g.player.x,g.player.y,p.z),c={module:net().cargo,x:g.player.x,y:g.player.y,z:f?p.z:0,site:f?p.site:null,level:f?p.level:-1};
   net().cargo=null;net().crates.push(c);job=null;return tell(ok('Caisse déposée ; intégrité et munitions conservées, récupération à proximité.'));
  }
  function jobStep(dt){
   if(!job)return;const j=job;
   if(g.world!==j.world||g.player.health<j.health||g.player.dead||g.player.reload>0||g.input.mouseDown||g.input.touchFire||Math.hypot(g.player.x-j.x,g.player.y-j.y)>V.workMoveTolerance||Math.abs(h.pose().z-j.z)>EPS){job=null;notice='Manutention interrompue ; aucun paiement final ni duplication.';return;}
   job=null;let q;
   try{q=['bridge','repairBridge','removeBridge'].includes(j.operation)?bridgeServiceQuote(j.object.id,j.operation):j.operation==='pack'?packQuote(j.object.id):j.operation==='unpack'?unloadQuote(j.slot):pickupQuote(j.object.module.id);}finally{job=j;}
   if(!q.ok||q.object!==j.object||j.stamp&&q.stamp!==j.stamp){job=null;notice=q.reason||'La charge ou le chantier a changé.';return;}
   if(j.operation==='bridge'){if(!corridorFree(j.object,q.q)){job=null;notice='Chantier suspendu : libérez les accès.';return;}j.object.progress=Math.min(1,j.object.progress+dt/j.seconds);if(j.object.progress<1-EPS)return;j.object.progress=1;}
   else{j.elapsed+=dt;if(j.elapsed+EPS<j.seconds)return;
    if(j.operation==='pack'){C.spend(g.resources,q.cost);q.s.decks[q.level].modules=q.s.decks[q.level].modules.filter(m=>m!==q.m);net().cargo=q.m;}
    else if(j.operation==='unpack'){const s=sites().find(s=>s.id===q.site);q.object.slot=q.slot;s.decks[q.level].modules.push(q.object);net().cargo=null;}
    else if(j.operation==='pickup'){net().cargo=q.object.module;net().crates=net().crates.filter(c=>c!==q.object);}
    else if(j.operation==='removeBridge'){net().links=net().links.filter(l=>l!==q.object);for(const [k,n]of Object.entries(q.refund))g.resources[k]+=Math.min(n,Math.max(0,g.storage-g.resources[k]));}
    else{C.spend(g.resources,q.cost);q.object.health+=q.amount;}
   }
   job=null;g.refreshMetrics(true);notice='Opération terminée ; les stocks ont été transférés une seule fois.';g.audio?.build?.();
  }
  function surfaceAt(x,y,z){
   for(const l of net().links){if(l.progress!==1)continue;const q=linkShape(l);if(!q||Math.abs(z-q.z)>EPS||!contains(q,x/V.tile,y/V.tile)||carrying()&&V.modules[net().cargo.kind].mass>q.definition.payload)continue;
    const p=h.pose(),endpoint=[l.a,l.b].find(a=>key(a)===key(p))||l.a;return{s:sites().find(s=>s.id===endpoint.site),b:buildings().get(endpoint.site),level:endpoint.level,bridge:l.id};}
   return null;
  }
  function prune(){
   const before=net().links.length;net().links=net().links.filter(l=>!!linkShape(l));
   h.reconcileInvaders?.();
   if(before!==net().links.length)notice='Ancrage perdu : liaison effondrée, sans remboursement.';
   const p=h.pose();if(p.site&&!p.travel&&!h.surfaceAt(g.player.x,g.player.y,p.z)){h.fallActor(p.z);notice='Passerelle perdue : chute vers le sol.';}
   for(const c of [...net().crates])if(c.site!==null&&!insideFloor(c,c,buildings(),sites(),.05)&&!onBridge({...net(),cargo:null},c,c,buildings(),sites(),.05)){
    c.module.health-=c.z*R.fallHealthPerMetre;c.z=0;c.site=null;c.level=-1;if(c.module.health<=0)net().crates=net().crates.filter(x=>x!==c);
   }
  }
  function damage(id,amount){if(!finite(amount,Number.EPSILON))return false;const l=link(id);if(!l)return false;l.health-=amount;if(l.health<=0){net().links=net().links.filter(x=>x!==l);if(job?.object===l)job=null;prune();}return true;}
  function giantImpact(e,def){for(const l of [...net().links]){const q=linkShape(l);if(!q||q.z>def.height+def.reach)continue;const distance=Math.hypot(e.x/V.tile-C.clamp(e.x/V.tile,q.x,q.x+q.w),e.y/V.tile-C.clamp(e.y/V.tile,q.y,q.y+q.h));if(distance<=def.reach+def.radius)damage(l.id,def.damage*R.giantDamageFraction);}}
  function protectedStructure(operation,id){
   if(operation!=='removeDeck')return false;const s=sites().find(s=>s.id===id);if(!s)return false;const level=s.decks.length-1;
   return net().links.some(l=>[l.a,l.b].some(p=>p.site===id&&p.level===level))||net().crates.some(c=>c.site===id&&c.level===level);
  }
  function blocksConstruction(type,gx,gy,rotation=0){const d=V.bases[type]||g.world.definition?.(type)||C.BUILDINGS[type];if(!d)return false;const b={type,gx,gy,rotation,def:d},box=bounds(b),height=C.CityGeometry202.structureHeight(d,g.world.cityGeometry202??0);return net().links.some(l=>{const q=linkShape(l);return q&&q.z-R.deckThickness<height&&overlap(q,box);});}
  function geometry(){const boxes=[];for(const l of net().links){const q=linkShape(l);if(!q||l.progress!==1)continue;const box={x:q.x,y:q.y,w:q.w,h:q.h,z:q.z-R.deckThickness,d:R.deckThickness,type:'bridge',link:l.id};boxes.push(box);const horizontal=q.ports[0].y===q.ports[1].y;
    for(const side of [0,1])boxes.push(horizontal?{x:q.x,y:q.y+side*(q.h-R.railThickness),w:q.w,h:R.railThickness,z:q.z+R.railHeight-R.railThickness,d:R.railThickness,type:'bridgeRail',link:l.id}:{x:q.x+side*(q.w-R.railThickness),y:q.y,w:R.railThickness,h:q.h,z:q.z+R.railHeight-R.railThickness,d:R.railThickness,type:'bridgeRail',link:l.id});
   }return boxes;}
  // Render the parapet from the same docking corridors as movement: no invisible doorway through a railing.
  function railGeometry(b,level){
   const q=bounds(b),z=V.bases[b.type].height+level*V.deckRise,t=R.railThickness,out=[];
   for(const side of [0,1,2,3]){
    const horizontal=side%2===0,fixed=horizontal?q.y+(side===2?q.h:0):q.x+(side===1?q.w:0),origin=horizontal?q.x:q.y,length=horizontal?q.w:q.h;
    let spans=[[origin,origin+length]];
    for(const l of net().links){if(l.progress!==1||![l.a,l.b].some(p=>p.site===b.id&&p.level===level))continue;const bridge=linkShape(l);if(!bridge)continue;
     const low=horizontal?bridge.y:bridge.x,high=low+(horizontal?bridge.h:bridge.w);if(fixed<low||fixed>high)continue;
     const a=horizontal?bridge.x:bridge.y,c=a+(horizontal?bridge.w:bridge.h);
     spans=spans.flatMap(([x,y])=>c<=x||a>=y?[[x,y]]:[[x,Math.max(x,a)],[Math.min(y,c),y]].filter(([a,b])=>b-a>EPS));
    }
    for(const [a,b]of spans){const rail=horizontal?{x:a,y:fixed-t/2,w:b-a,h:t}:{x:fixed-t/2,y:a,w:t,h:b-a};out.push({...rail,z:z+R.railHeight-t,d:t,type:'edgeRail'});
     for(let x=a;x<=b+EPS;x+=2)out.push({x:horizontal?x-t/2:fixed-t/2,y:horizontal?fixed-t/2:x-t/2,z,w:t,h:t,d:R.railHeight,type:'edgePost'});
    }
   }
   return out;
  }
  // Shared, read-only topology. Cargo limits are explicit, never inferred for another actor.
  function navigationGraph(payload=null){
   const nodes=new Map(),edges=new Map();
   for(const s of sites()){
    const b=buildings().get(s.id);if(!b?.completed||b.dead||b.health<=0)continue;
    for(let i=0;i<s.decks.length;i++)if(s.decks[i].progress===1){
     const a={site:s.id,level:i};nodes.set(key(a),a);edges.set(key(a),[]);
    }
   }
   if(nodes.size>R.routeNodeLimit)return{nodes:new Map(),edges:new Map()};
   function connect(a,b,kind,id=null){
    if(!nodes.has(key(a))||!nodes.has(key(b)))return;
    edges.get(key(a)).push({from:{...a},to:{...b},kind,id});
    edges.get(key(b)).push({from:{...b},to:{...a},kind,id});
   }
   for(const s of sites())for(let i=1;i<s.decks.length;i++)connect({site:s.id,level:i-1},{site:s.id,level:i},'stairs');
   for(const l of net().links)if(l.progress===1&&l.health>0&&linkShape(l)&&(payload===null||payload<=definition(l).payload))connect(l.a,l.b,'bridge',l.id);
   return{nodes,edges};
  }
  function route(toSite,toLevel=0){
   const p=h.pose();if(!p.site||!integer(toSite,1)||!integer(toLevel,0,V.maxDecks-1))return no('Choisissez deux paliers construits.');
   const {nodes,edges}=navigationGraph(carrying()?V.modules[net().cargo.kind].mass:null);
   const start=key(p),goal=key({site:toSite,level:toLevel});
   if(!nodes.has(start)||!nodes.has(goal))return no('Destination sans palier accessible.');
   const queue=[start],prev=new Map([[start,null]]);
   for(let i=0;i<queue.length&&queue.length<=R.routeNodeLimit;i++){
    const n=queue[i];if(n===goal)break;
    for(const edge of edges.get(n))if(!prev.has(key(edge.to))){prev.set(key(edge.to),{from:n,edge});queue.push(key(edge.to));}
   }
   if(!prev.has(goal))return no('Aucun itinéraire financé ; reliez ces paliers avant le transport.');
   const steps=[];for(let k=goal;k!==start;){const v=prev.get(k);steps.unshift({kind:v.edge.kind,id:v.edge.id,...nodes.get(k)});k=v.from;}
   return{ok:true,steps,reason:steps.length?steps.map(s=>s.kind==='stairs'?'Escalier → palier '+(s.level+1):'Passerelle '+s.id+' → support '+s.site).join(' ; '):'Vous êtes à destination.'};
  }
  function actions(){const result=[],f=floor(),add=(id,label,run,description='',close=true)=>result.push({id:'network-'+id,label,run,description,close});
   if(job)add('stop','Interrompre la manutention',()=>{job=null;return ok('Avancement financé conservé.');});
   if(carrying()){
    if(f)for(let slot=0;slot<4;slot++)if(!f.s.decks[f.p.level].modules.some(m=>m.slot===slot))add('unload-'+slot,'Déballer : '+V.modules[net().cargo.kind].name+' → emplacement '+(slot+1),()=>unloadModule(slot),'Même objet, mêmes cartouches ; pas de nouvelle construction.');
    add('drop','Poser la caisse au sol',()=>dropCargo(),'Caisse persistante, récupérable à proximité.');
   }else{
    if(f)for(const m of f.s.decks[f.p.level].modules)if(m.progress===1)add('pack-'+m.id,'Emballer et transporter : '+V.modules[m.kind].name,()=>packModule(m.id),'Retire temporairement les capacités ; charge limitée selon l’âge.');
    if(f){const candidates=[];for(const s of sites())if(s.id!==f.s.id)for(let level=0;level<s.decks.length;level++){
      const candidate={id:net().nextId,kind:R.links[g.tier.id].id,a:{site:f.s.id,level:f.p.level},b:{site:s.id,level},progress:0,health:R.links[g.tier.id].health},q=linkShape(candidate);
      if(q&&!net().links.some(l=>[key(l.a),key(l.b)].sort().join('/')===[key(candidate.a),key(candidate.b)].sort().join('/')))candidates.push({s,level,q});
     }
     candidates.sort((a,b)=>a.q.gap-b.q.gap||a.s.id-b.s.id);for(const {s,level,q}of candidates.slice(0,R.menuDestinations))add('build-'+s.id+'-'+level,'Relier le support '+s.id+' — palier '+(level+1),()=>buildLink(s.id,level),'Portée '+q.gap.toFixed(1)+' m · '+C.resourceText(materialCost(q))+' · approchez le bord de départ.');
    }
   }
   for(const c of net().crates)if(Math.hypot(c.x-g.player.x,c.y-g.player.y)<=R.reach*2)add('pickup-'+c.module.id,'Récupérer : '+V.modules[c.module.kind].name,()=>pickup(c.module.id),c.module.ammo+' cartouches conservées · '+c.z+' m');
   for(const l of net().links)if(f&&[l.a,l.b].some(p=>p.site===f.s.id&&p.level===f.p.level)){
    if(l.progress<1)add('resume-'+l.id,'Reprendre la passerelle '+l.id,()=>serviceBridge(l.id,'bridge'));
    if(l.progress===1&&l.health<definition(l).health)add('repair-'+l.id,'Réparer la passerelle '+l.id,()=>serviceBridge(l.id,'repairBridge'));
    add('remove-'+l.id,(review?.id===l.id?'CONFIRMER : ':'')+'déposer la passerelle '+l.id,()=>serviceBridge(l.id,'removeBridge',review?.id===l.id),'Dépose depuis un ancrage, sans acteur ni caisse sur la liaison.');
   }
   if(f)for(const s of sites().filter(s=>s.id!==f.s.id).slice(0,R.menuDestinations))add('route-'+s.id,'Itinéraire vers le support '+s.id,()=>tell(route(s.id,0)),'Lecture du graphe ; aucun déplacement ni déblocage automatique.',false);
   return result;
  }
  const api={navigationGraph,railGeometry,hasNearbyCrate:()=>net().crates.some(c=>Math.hypot(c.x-g.player.x,c.y-g.player.y)<=R.reach*2),initial,linkQuote,buildLink,serviceBridge,packQuote,packModule,unloadQuote,unloadModule,pickup,dropCargo,route,damage,giantImpact,prune,surfaceAt,geometry,load:weight,reserveConflict,protectedStructure,blocksConstruction,carrying,busy,actions,
   stop(){job=null;review=null;},reset(){job=null;review=null;notice='';},moduleSuspended:id=>job?.operation==='pack'&&job.object.id===id,
   step(dt){prune();if(g.player.dead||g.player.health<=0){if(carrying())dropCargo(true);job=null;return;}jobStep(dt);},
   jobState:()=>job?{kind:job.operation,seconds:job.seconds,elapsed:job.operation==='bridge'?job.object.progress*job.seconds:job.elapsed}:null,
   presentation:()=>({links:net().links.map(l=>({link:l,shape:linkShape(l)})),cargo:net().cargo,crates:net().crates,notice}),
   overview:()=>({label:'Liaisons et transport',value:net().links.filter(l=>l.progress===1).length+' passerelle(s) · '+(carrying()?V.modules[net().cargo.kind].name+' porté':'mains libres')+' · charge de portage '+R.links[g.tier.id].payload+' · '+notice})};
  return Object.freeze(api);
 }
 const api={initial,normalize,shape,onBridge,insideFloor,create};root.DeadwallVerticalNetwork179=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
