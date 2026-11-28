/* Nature des cantons du monde sans bord, suite de la faune (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/tasks.md T5.5).
   Une campagne NOUVELLE de génération 12 (option « Sans bord — expérimental ») reçoit, en plus de la faune de T5.4
   (`src/openlife217.js`), ce que la région finie offre autour de ses animaux, avec les mêmes règles et le même équilibrage :
   - contacts naturels : errants isolés de la campagne (`biome-population165.contact`), un candidat par morceau de 256 m,
     présence, profil tiré du milieu, « errant des berges » près de l'eau ; la faune les fuit comme dans la région finie ;
   - prédation et défense du sanglier (`husbandry191.naturalIntent`) pour les animaux de canton, sur la même option ;
   - enclos et capture (`husbandry191`) : un animal de canton `K<cx>_<cy>:faune:<n>` se capture et s'élève ;
   - cueillette (`forage193`) : ramassages finis `K<cx>_<cy>:cueil:<n>`, mêmes espèces, densités et quantités ;
   - écologie : celle de la région finie — ni les animaux abattus ni les cueillettes épuisées ne reviennent ; le carnet dit
     quels cantons sont chassés et lesquels sont épuisés (lecture seule).
   Tirages : flux NOUVEAUX dérivés de la graine et du canton (`K.stream(graine, cx, cy, 'errant-…' | 'cueil-…')`), toujours le
   même nombre par candidat ; aucun flux existant n'est lu. Sauvegarde creuse (module d'extension `openlife218`) : contacts
   blessés, tués ou suivis seulement. Une campagne sans l'option et une campagne sans bord créée avant cette tranche (sans clé)
   ne lisent rien de ce module (forme inactive seule). */
(function(root){'use strict';
 const node=typeof require==='function';
 const need=(name,file)=>root[name]||(node?require(file):null);
 const C=need('DeadwallCore','./core.js');
 const R=C.OpenLife218Rules;
 const K=()=>need('DeadwallWorldCantons217','./world-cantons217.js');
 const L=()=>need('DeadwallOpenLife217','./openlife217.js');
 const O=()=>need('DeadwallOpenWorld217','./openworld217.js');
 const B=()=>C.BiomePopulation165Rules,F=()=>C.Forage193Rules;
 const BY=Object.freeze(Object.fromEntries([...C.BiomeRules135.defs,...C.EcologyRules164.defs].map(d=>[d.id,d])));
 const INT='(0|-?[1-9]\\d{0,6})',idOf=kind=>new RegExp('^K'+INT+'_'+INT+':'+kind+':(0|[1-9]\\d{0,4})$');
 const CONTACT=idOf(R.contact.kind),FORAGE=idOf(R.forage.kind);
 const finite=(...v)=>v.every(Number.isFinite),far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy),plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const contactsPerCanton=()=>(K().SIZE/B().chunk)**2*B().contactCandidates,foragePerCanton=()=>(K().SIZE/F().chunk)**2*F().candidates;
 function weighted(choices,u){let n=u*choices.reduce((s,r)=>s+r[1],0),out=choices.at(-1)[0];for(const[id,v]of choices){n-=v;if(n<0){out=id;break;}}return out;}
 const memos={contact:new WeakMap(),forage:new WeakMap()};
 function memo(table,w,id,cap,build){let m=table.get(w);if(!m){m=new Map();table.set(w,m);}if(m.has(id)){const v=m.get(id);m.delete(id);m.set(id,v);return v;}const v=build();m.set(id,v);if(m.size>cap)m.delete(m.keys().next().value);return v;}
 function canonical(re,id,limit){if(typeof id!=='string'||!re.test(id))return null;const e=K().parseEntity(id);return e&&e.index<limit&&K().entityId(e.cx,e.cy,e.kind,e.index)===id?e:null;}
 const ownsContact=id=>!!canonical(CONTACT,id,contactsPerCanton()),ownsForage=id=>!!canonical(FORAGE,id,foragePerCanton());
 const addressable=(w,kx,ky,index,limit)=>!!w?.unbounded&&Number.isInteger(kx)&&Number.isInteger(ky)&&Number.isInteger(index)&&index>=0&&index<limit&&Math.abs(kx)<=K().RULES.maxCoordinate&&Math.abs(ky)<=K().RULES.maxCoordinate;

 // --- Contacts naturels : `biome-population165.context` + `contact`, adressés par canton ------------------------------------
 function buildContact(w,kx,ky,index){
  const k=K(),P=B(),n=k.SIZE/P.chunk,N=P.contactCandidates,j=Math.floor(index/N),slot=index%N,chunk=P.chunk;
  const d=k.stream(w.seed,kx,ky,R.contact.kind+'-'+j+'-'+slot),u=[d(),d(),d(),d()];
  if(u[0]>=P.contactChance)return null;
  const x=kx*k.SIZE+(j%n+.08+u[1]*.84)*chunk,y=ky*k.SIZE+(Math.floor(j/n)+.08+u[2]*.84)*chunk;
  if(far(x-w.home.x,y-w.home.y)<P.homeExclusion||!w.contains(x,y,2))return null;
  const here=L().water(w,x,y);if(!here||here.water||here.movementBlocked)return null;
  const road=w.nearestRoad({x,y});if(road&&road.d<road.road.width/2+P.roadClearance)return null;
  const biome=w.biomeAt(x,y),def=biome&&BY[biome.id];if(!def?.enemies)return null;
  const kind=weighted(Object.entries(def.enemies),u[3]),base=C.BiomeRules135.enemies[kind];if(!base)return null;
  const bank=here.distanceToWater<R.contact.bank;
  return Object.freeze({id:k.entityId(kx,ky,R.contact.kind,index),x,y,z:0,poi:null,radius:C.FrontierTacticsRules.enemyRadius,biome:biome.id,bank,
   profile:Object.freeze({...base,kind,biome:biome.id,name:bank&&kind==='walker'?'Errant des berges':base.name}),canton:k.id(kx,ky),open218:true});
 }
 function contact(w,kx,ky,index){if(!addressable(w,kx,ky,index,contactsPerCanton()))return null;return memo(memos.contact,w,K().entityId(kx,ky,R.contact.kind,index),B().candidateCache*2,()=>buildContact(w,kx,ky,index));}
 function contactCandidate(w,id){const e=canonical(CONTACT,id,contactsPerCanton());return e?contact(w,e.cx,e.cy,e.index):null;}
 // Même admission que les contacts de la région finie : sol libre, parcelles et leurs abords réservés.
 function contactAdmitted(w,q){if(!q||!w?.unbounded||w.blocked(q.x,q.y,q.radius,0,null))return false;const m=B().parcelClearance;for(const p of w.nearPOI(q.x,q.y,60)){const b=p.reserve;if(b&&q.x>b.l-m&&q.x<b.r+m&&q.y>b.t-m&&q.y<b.b+m)return false;}return true;}
 function scan(w,x,y,range,chunk,slots,read){
  const rows=[];if(!w?.unbounded||!finite(x,y,range)||range<0)return rows;const n=K().SIZE/chunk;
  for(let cy=Math.floor((y-range)/chunk);cy<=Math.floor((y+range)/chunk);cy++)for(let cx=Math.floor((x-range)/chunk);cx<=Math.floor((x+range)/chunk);cx++){
   const kx=Math.floor(cx/n),ky=Math.floor(cy/n),j=(cy-ky*n)*n+(cx-kx*n);
   for(let i=0;i<slots;i++){const q=read(kx,ky,j*slots+i);if(q&&far(q.x-x,q.y-y)<=range)rows.push(q);}
  }
  return rows.sort((a,b)=>far(a.x-x,a.y-y)-far(b.x-x,b.y-y)||(a.id<b.id?-1:a.id>b.id?1:0));
 }
 const contactsAround=(w,x,y,range=B().streamRange)=>scan(w,x,y,range,B().chunk,B().contactCandidates,(kx,ky,i)=>contact(w,kx,ky,i));

 // --- Cueillette : `biome-forage193.candidate` + `admitted`, adressée par canton ------------------------------------------
 function buildForage(w,kx,ky,index){
  const k=K(),P=F(),chunk=P.chunk,n=k.SIZE/chunk,S=P.candidates,j=Math.floor(index/S),slot=index%S;
  const d=k.stream(w.seed,kx,ky,R.forage.kind+'-'+j+'-'+slot),u=Array.from({length:7},()=>d());
  if(u[0]>=P.chance)return null;
  const x=kx*k.SIZE+(j%n+.08+u[1]*.84)*chunk,y=ky*k.SIZE+(Math.floor(j/n)+.08+u[2]*.84)*chunk,biome=w.biomeAt(x,y);if(!biome)return null;
  const choices=Object.values(P.species).map(s=>[s,s.biomes[biome.id]||0]).filter(r=>r[1]>0);if(!choices.length)return null;
  const s=weighted(choices,u[3]),r=s.radius,water=L().water(w,x,y,true),road=w.nearestRoad({x,y});
  if(!w.contains(x,y,r)||far(x-w.home.x,y-w.home.y)<P.homeExclusion+r||!water||water.water||water.movementBlocked||water.crossing||w.waterBlocked(x,y,r)||road&&road.d<=road.road.width/2+P.roadClearance+r)return null;
  const amount=s.amount[0]+Math.floor(u[4]*(s.amount[1]-s.amount[0]+1));
  return Object.freeze({id:k.entityId(kx,ky,R.forage.kind,index),x,y,z:0,poi:null,species:s.id,family:s.family,resource:s.resource,amount,variant:Math.floor(u[5]*4),a:u[6]*Math.PI*2,
   radius:r,length:s.length,width:s.width,name:s.name,label:s.name,seconds:s.seconds,profile:s,biome:biome.id,landscape189:'classic',canton:k.id(kx,ky),open218:true});
 }
 function forage(w,kx,ky,index){if(!addressable(w,kx,ky,index,foragePerCanton()))return null;return memo(memos.forage,w,K().entityId(kx,ky,R.forage.kind,index),F().candidateCache*2,()=>buildForage(w,kx,ky,index));}
 function forageCandidate(w,id){const e=canonical(FORAGE,id,foragePerCanton());return e?forage(w,e.cx,e.cy,e.index):null;}
 function forageAdmitted(w,q){
  if(!q||!w?.unbounded)return false;const c=forageCandidate(w,q.id);if(!c||['x','y','species','radius','amount'].some(k=>q[k]!==c[k]))return false;
  const P=F(),G=root.DeadwallFrontierGeometry||(node?require('./frontier-geometry.js'):null),pad=q.radius+P.parcelClearance;
  if(w.drivewayAt?.(q.x,q.y,q.radius+P.roadClearance))return false;
  for(const p of w.nearPOI(q.x,q.y,pad)){const b=p.reserve;if(b&&G.circleRect(q.x,q.y,pad,{x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t}))return false;const d=p.drive;if(d&&G.nearest(q,d.a,d.b).d<=d.width/2+q.radius+P.roadClearance)return false;}
  return!w.blocked(q.x,q.y,q.radius,0,null);
 }
 const forageAround=(w,x,y,range=F().viewRange)=>scan(w,x,y,range,F().chunk,F().candidates,(kx,ky,i)=>{const q=forage(w,kx,ky,i);return q&&forageAdmitted(w,q)?q:null;});
 // Fournisseur de la forme de `DeadwallBiomeForage193`, lu par `forage193` dans une campagne de ce module.
 const Forage=Object.freeze({owns:ownsForage,candidate:forageCandidate,admitted:forageAdmitted,around:forageAround,chunk:(w,kx,ky,j)=>Array.from({length:F().candidates},(_,i)=>forage(w,kx,ky,j*F().candidates+i)).filter(q=>q&&forageAdmitted(w,q))});

 // --- Écologie : comptes de chasse par canton (lecture seule ; la région finie ne renouvelle pas ses morts) -----------------
 function ecology(w,kills,at){
  const k=K(),here=at&&finite(at.x,at.y)?k.at(at.x,at.y):null,rows=[];
  for(const[cid,list]of Object.entries(kills||{})){const c=k.parse(cid);if(!c)continue;rows.push({id:cid,cx:c.cx,cy:c.cy,killed:Object.keys(list).length});}
  const d=r=>here?Math.max(Math.abs(r.cx-here.cx),Math.abs(r.cy-here.cy)):0;rows.sort((a,b)=>d(a)-d(b)||a.cy-b.cy||a.cx-b.cx);
  return rows.slice(0,R.ecology.rows).map(r=>{let total=0;if(w?.unbounded)for(let i=0;i<(k.SIZE/B().chunk)**2*C.Landscape189Rules.population.groups*C.Landscape189Rules.population.members;i++)if(L().animal(w,r.cx,r.cy,i))total++;
   return Object.freeze({...r,total,depleted:total>0&&r.killed>=total*R.ecology.depleted});});
 }

 // --- Module d'extension : contacts blessés, tués ou suivis, creux par identifiant ------------------------------------------
 const KEYS=Object.freeze(['version','active','revision','enemies','tracks','kills']),TRACK=Object.freeze(['x','y','z','a','mode','ttl','gx','gy','cool']),MODES=Object.freeze(['idle','investigate','pursuit','search']);
 const initial=()=>({version:1,active:false,revision:null,enemies:{},tracks:{},kills:0});
 const fresh=()=>({version:1,active:true,revision:R.version,enemies:{},tracks:{},kills:0});
 const worlds=new Map();
 function worldOf(seed){if(!worlds.has(seed)){worlds.set(seed,O().region(seed));if(worlds.size>2)worlds.delete(worlds.keys().next().value);}return worlds.get(seed);}
 function validate(raw,full){
  if(raw===undefined)return initial();
  const bad=m=>{throw Error(m||'Nature des cantons 218 invalide.');},num=(v,lo,hi)=>{if(!Number.isFinite(v)||v<lo||v>hi)bad();return v;};
  if(!plain(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||KEYS.some(k=>!(k in raw))||!plain(raw.enemies)||!plain(raw.tracks)||!Number.isInteger(raw.kills)||raw.kills<0)bad();
  if(!raw.active){if(raw.revision!==null||Object.keys(raw.enemies).length||Object.keys(raw.tracks).length||raw.kills)bad();return initial();}
  if(!Number.isInteger(raw.revision)||raw.revision<1||raw.revision>1e6)bad();
  const f=full?.frontier;if(full&&f?.generation!==12)bad('Nature des cantons sur une campagne à région finie.');
  const out=fresh();out.revision=raw.revision;const k=K(),drift=B().contactDrift+1,ids=new Set();
  const inCanton=(e,x,y)=>{const b=k.bounds(e.cx,e.cy);return x>=b.x-drift&&x<=b.x+b.w+drift&&y>=b.y-drift&&y<=b.y+b.h+drift;};
  for(const[id,hp]of Object.entries(raw.enemies)){if(!ownsContact(id))bad('Contact naturel de canton invalide.');out.enemies[id]=num(hp,0,1000);ids.add(id);}
  for(const[id,t]of Object.entries(raw.tracks)){const e=canonical(CONTACT,id,contactsPerCanton());if(!e||!plain(t)||Object.keys(t).length!==TRACK.length||TRACK.some(n=>!(n in t))||!MODES.includes(t.mode)||t.z!==0)bad('Poursuite de canton invalide.');
   if(out.enemies[id]===0)bad('Poursuite d’un contact abattu.');
   const v={x:num(t.x,-1e9,1e9),y:num(t.y,-1e9,1e9),z:0,a:num(t.a,-1e5,1e5),mode:t.mode,ttl:num(t.ttl,0,16),gx:num(t.gx,-1e9,1e9),gy:num(t.gy,-1e9,1e9),cool:num(t.cool,0,2)};
   if(!inCanton(e,v.x,v.y)||!inCanton(e,v.gx,v.gy))bad('Poursuite hors de la dérive du contact.');out.tracks[id]=v;ids.add(id);}
  if(ids.size>B().maxContactRecords)bad('Trop de contacts naturels suivis.');
  if(raw.kills!==Object.values(out.enemies).filter(h=>h===0).length)bad('Compteur des contacts de canton contradictoire.');out.kills=raw.kills;
  // Monde de la même révision : les cantons cités les plus proches du commandant sont vérifiés contre la graine.
  const w=f&&raw.revision===R.version&&ids.size?worldOf(full.worldSeed):null;
  if(w&&f.reliefVersion===w.reliefVersion&&f.sitesVersion===w.sitesVersion){
   const here=k.at(f.x,f.y),by=new Map();for(const id of ids){const e=k.parseEntity(id);if(!by.has(e.canton))by.set(e.canton,{...e,list:[]});by.get(e.canton).list.push(id);}
   const d=c=>Math.max(Math.abs(c.cx-here.cx),Math.abs(c.cy-here.cy));
   for(const c of[...by.values()].sort((p,q)=>d(p)-d(q)||p.cy-q.cy||p.cx-q.cx).slice(0,R.strictCantons))for(const id of c.list){
    const q=contactCandidate(w,id);if(!q)bad('Contact naturel absent de cette graine.');if(id in out.enemies&&out.enemies[id]>q.profile.health)bad('Intégrité de contact incompatible avec son profil.');
    const t=out.tracks[id];if(t&&(far(t.x-q.x,t.y-q.y)>B().contactDrift+1e-6||far(t.gx-q.x,t.gy-q.y)>B().contactDrift+1e-6))bad('Poursuite hors de la dérive du contact.');
   }
  }
  return out;
 }
 function install(g){
  if(!g||g.openLife218)return g?.openLife218||null;
  if(!g.expansions)return null;
  let state=initial(),pending=false,reserved=new Set(),custody=false;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const index=()=>{reserved=new Set([...Object.keys(state.enemies),...Object.keys(state.tracks)]);};
  // Actif seulement avec la faune de T5.4 (même option, même campagne neuve).
  const active=()=>state.active&&g.openLife217?.active?.()===true;
  function reserve(id){if(reserved.has(id))return true;if(reserved.size>=B().maxContactRecords)return false;reserved.add(id);return true;}
  // Captifs de canton : leur fiche vivante n'est pas sauvegardée par T5.4 (seuls les abattus le sont) ; à la reprise, chaque sujet
  // gardé retrouve une fiche à sa place d'origine, comme un animal vivant de T5.4 après une reprise.
  function adopt(){
   custody=false;if(!active()||!g.husbandry191?.view||!g.frontier?.world)return 0;const records=g.openLife217.records(),w=g.frontier.world();let n=0;
   for(const a of g.husbandry191.view().animals){if(!a.source||!L().owns(a.source)||!['held','stranded'].includes(a.status)||records[a.source]?.hp>0)continue;
    const q=L().candidate(w,a.source);if(!q)continue;records[a.source]={x:q.x,y:q.y,a:0,hp:Math.max(1e-6,q.profile.health*a.health/100),alarm:0,stride:0};n++;}
   return n;
  }
  function overview(){
   if(!state.active)return{summary:'Nature des cantons : sans objet (région finie, ou campagne sans bord créée avant cette tranche).',rows:[{label:'Nature',value:'Sans objet.'}]};
   const p=g.frontier?.position?.(),eco=g.openLife217?.active?.()?ecology(g.frontier?.worldReady?.()?g.frontier.world():null,g.openLife217.snapshot().kills,p):[];
   const tracked=Object.keys(state.tracks).length,wounded=Object.values(state.enemies).filter(h=>h>0).length;
   return{summary:'Monde sans bord : errants isolés, prédation, enclos et cueillette des cantons suivent les règles de la région finie. Ni les bêtes abattues ni les cueillettes épuisées ne reviennent.',rows:[
    {label:'Errants des cantons',value:state.kills+' abattu'+(state.kills>1?'s':'')+', '+wounded+' blessé'+(wounded>1?'s':'')+', '+tracked+' suivi'+(tracked>1?'s':'')},
    ...eco.map(r=>({label:'Canton '+r.id,value:r.killed+' bête'+(r.killed>1?'s':'')+' abattue'+(r.killed>1?'s':'')+' sur '+r.total+(r.depleted?' · canton épuisé : la faune n’y revient pas':' · faune encore présente')})),
    {label:'Écologie',value:'Celle de la région finie : aucun renouvellement des animaux abattus ni des ramassages épuisés.'}]};
  }
  const snapshot=()=>state.active?copy(state):initial();
  const api=Object.freeze({active,ownsContact,ledger:()=>state,reserve,contactsAround,contactAdmitted,contactCandidate,forage:Forage,adopt,snapshot,overview,
   ecology:()=>ecology(g.frontier?.world?.(),g.openLife217?.snapshot?.().kills,g.frontier?.position?.())});
  g.openLife218=api;
  g.expansions.register({id:'openlife218',title:'Nature des cantons',overview,actions:()=>[],validate,snapshot,available:()=>state.active,
   restore:raw=>{state=raw&&raw.active?copy(raw):initial();index();custody=state.active;},
   reset:()=>{state=pending?fresh():initial();index();custody=false;}});
  const start=g.startNew.bind(g);
  g.startNew=(...a)=>{const before=pending;pending=a[6]===true||a[5]?.generation===12;try{return start(...a);}finally{pending=before;}};
  const update=g.update.bind(g);g.update=(...a)=>{if(custody)adopt();return update(...a);};
  return api;
 }

 const api=Object.freeze({RULES:R,ownsContact,ownsForage,contact,contactCandidate,contactAdmitted,contactsAround,forage,Forage,ecology,initial,fresh,validate,install,
  cacheSize:w=>(memos.contact.get(w)?.size||0)+(memos.forage.get(w)?.size||0)});
 root.DeadwallOpenLife218=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
