/* Lieux remarquables et nids (docs/GAME_BIBLE.md §7.13), première tranche, pour les NOUVELLES campagnes seulement.
   - Rang : quelques lieux DÉJÀ générés sont promus « remarquables » par une fonction pure du monde (`select`) :
     usage compatible lu sur le nom d'origine, emprise suffisante, puis hachage de l'identifiant, par canton, espacés.
     Aucun lieu n'est créé, déplacé, renommé ni modifié ; aucun flux de génération n'est tiré.
   - Vu de loin : un lieu en vue porte une silhouette (château d'eau, cheminée, pylône) sur l'atlas et en vue de
     région, avec son nom et sa distance. Un seul lieu à la fois peut être désigné objectif de sortie.
   - Nid : tant qu'il n'est pas vidé, le lieu abrite `nest` infectés au lieu d'un à quatre. Ce sont les occupants
     ordinaires du registre régional (mêmes profils, même veille immobile, même intégrité) : seul leur nombre change.
   - Lot : une fois le nid vidé, le lot annoncé sur la fiche se charge sur place, dans le sac, une seule fois.
   Deuxième tranche (état v2 ; un état v1 est converti sans rien perdre) :
   - Vu de loin / repéré : depuis la cité ou de loin, un lieu n'a que sa silhouette, son nom et sa distance (dérivé,
     jamais sauvegardé). Il n'est « repéré » (sauvegardé : nid et lot connus) qu'en sortie, à `spot` mètres.
     Un lieu seulement vu de loin peut être désigné objectif de sortie sans être repéré pour autant.
   - Repeuplement : une migration du monde (lue chez world-evolution, jamais modifiée) qui passe près d'un nid vidé,
     hors de vue du Commandant et non tenu par un avant-poste, y ramène quelques infectés, une fois par migration.
     Ce sont de nouveaux occupants du registre régional (indices à la suite du nid). Le lot emporté ne revient pas.
   Reste à faire : rang « singulier ».
   Une campagne commencée avant cette règle n'a ni lieu remarquable, ni nid, ni repère : son monde est inchangé. */
(function(root){'use strict';
 const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=need('DeadwallCore','./core.js'),G=need('DeadwallFrontierGeometry','./frontier-geometry.js');
 const R=C.Remarkable217Rules,KINDS=Object.keys(R.kinds);
 // Réglages techniques, sans effet sur l'équilibrage : cadence du relevé, bornes de registre, repères dessinés.
 const CHECK_SECONDS=.5,MAX_SITES=512,MARKS=4,OFFERS=6,MINI_SPAN=320,MINI_DOTS=6;
 // Une migration ne repeuple qu'un lieu, une fois : le registre des migrations comptées est borné par les lieux.
 const P=R.repopulate,REFILL_MAX=P.max*P.perSite,MAX_MIGRATIONS=MAX_SITES*P.perSite,GROUP=/^W\d{4}$/;
 const ID=/^P\d{4}$/,KEYS=['version','active','objective','sighted','cleared','taken','refilled','migrations'],KEYS_V1=KEYS.slice(0,6);
 const MAX_LOT=Math.max(...KINDS.map(k=>R.kinds[k].reward.amount));
 const WINDS=['E','SE','S','SO','O','NO','N','NE'];
 // Usage lu sur le titre d'origine du lieu (avant la variante et le nom du bourg), dans cet ordre.
 const USES=[
  ['water',/ch[âa]teau d.eau|station de pompage|r[ée]servoir d.eau/i],
  ['hospital',/h[ôo]pital|clinique|centre m[ée]dical/i],
  ['barracks',/caserne(?! de pompiers)|gendarmerie|d[ée]p[ôo]t militaire|bunker/i],
  ['fuel',/d[ée]p[ôo]t (?:civil de |de )?carburant|station-service|raffinerie/i],
  ['silo',/^silo|coop[ée]rative agricole/i],
  ['station',/^gare/i],
  ['dam',/barrage/i],
  ['transmitter',/[ée]metteur|relais radio|tour de t[ée]l[ée]communication/i],
  ['power',/^centrale|poste [ée]lectrique/i]];
 // Nom d'usage affiché quand le titre d'origine est plus précis que le genre retenu. Le genre, donc la sélection,
 // la silhouette, le nid et le lot, ne changent pas : seul le mot affiché est corrigé.
 const LABELS=[
  [/clinique v[ée]t[ée]rinaire/i,'clinique vétérinaire'],[/^clinique/i,'clinique'],[/station de pompage/i,'station de pompage'],[/bunker/i,'bunker'],
  [/d[ée]p[ôo]t militaire/i,'dépôt militaire'],[/station-service/i,'station-service'],[/coop[ée]rative agricole/i,'coopérative agricole'],[/^gare routi[èe]re/i,'gare routière'],
  [/relais radio/i,'relais radio'],[/tour de t[ée]l[ée]communication/i,'tour de télécommunication'],[/poste [ée]lectrique/i,'poste électrique']];
 const title=p=>String(p.name||'').split(' · ')[0].split(' — ')[0];
 const labelOf=(p,fallback)=>{const text=title(p);for(const[re,label]of LABELS)if(re.test(text))return label;return fallback;};
 function kindOf(p){
  if(!p||!ID.test(p.id)||p.occupation==='allied'||(p.generation||0)>R.maxGeneration||!(p.w*p.h>=R.minArea))return null;
  const text=title(p);
  for(const[kind,re]of USES)if(re.test(text))return kind;
  return null;
 }
 // Sélection pure : même monde, mêmes lieux. Les cantons sont parcourus dans un ordre fixe ; dans un canton, les
 // candidats sont classés par hachage de la graine et de l'identifiant, et un candidat trop proche d'un lieu déjà
 // retenu est écarté. Le résultat est gelé et gardé par monde, sans rien écrire dans le monde.
 const cache=new WeakMap();
 // Candidat promouvable : usage reconnu, hors des abords de D-17, avec son hachage de rang.
 function candidate(world,p,out){
  const kind=kindOf(p);if(!kind)return;
  // Aucun nid aux portes de la cité : un lieu à moins de `homeClearance` de D-17 reste ordinaire.
  if(world.home&&Math.hypot(p.x-world.home.x,p.y-world.home.y)<R.homeClearance)return;
  out.push({p,kind,rank:G.hash(world.seed,p.id,'remarkable217')});
 }
 // Candidats groupés par canton de `cantonSize` m, cantons dans l'ordre de la clé cy*4096+cx (ligne puis colonne),
 // lieux d'un canton dans l'ordre du monde. Région finie : chaque canton est lu par `sitesIn` (monde sans bord,
 // tranche O4), jamais toute la liste. Monde factice sans accesseur : parcours historique de `pois`. Monde sans
 // bord (G12) : aucun lieu remarquable tant que l'espacement n'est pas rendu local (voir ouverture.md, O4).
 function cantonGroups(world){
  const S=R.cantonSize,e=typeof world.sitesIn==='function'&&typeof world.extent==='function'?world.extent():null;
  if(e&&e.bounded===true){
   const groups=[];
   for(let cy=Math.floor(e.minY/S);cy<=Math.floor(e.maxY/S);cy++)for(let cx=Math.floor(e.minX/S);cx<=Math.floor(e.maxX/S);cx++){
    const out=[];
    for(const p of world.sitesIn({left:cx*S,top:cy*S,right:(cx+1)*S,bottom:(cy+1)*S}))if(Math.floor(p.x/S)===cx&&Math.floor(p.y/S)===cy)candidate(world,p,out);
    if(out.length)groups.push(out);
   }
   return groups;
  }
  if(e||!Array.isArray(world.pois))return null;
  const cantons=new Map();
  for(const p of world.pois){
   const out=[];candidate(world,p,out);if(!out.length)continue;
   const key=Math.floor(p.y/S)*4096+Math.floor(p.x/S);
   if(!cantons.has(key))cantons.set(key,[]);
   cantons.get(key).push(out[0]);
  }
  return [...cantons.keys()].sort((a,b)=>a-b).map(key=>cantons.get(key));
 }
 function select(world){
  if(!world)return Object.freeze([]);
  const known=cache.get(world);if(known)return known.list;
  const groups=cantonGroups(world);if(!groups)return Object.freeze([]);
  const list=[];
  for(const group of groups){
   let kept=0;
   for(const c of group.sort((a,b)=>a.rank-b.rank||(a.p.id<b.p.id?-1:1))){
    if(kept>=R.perCanton||list.length>=MAX_SITES)break;
    if(list.some(e=>Math.hypot(e.x-c.p.x,e.y-c.p.y)<R.spacing))continue;
    const rule=R.kinds[c.kind],nest=R.nestMin+G.hash(world.seed,c.p.id,'nest217')%(R.nestMax-R.nestMin+1);
    list.push(Object.freeze({id:c.p.id,name:c.p.name,kind:c.kind,label:labelOf(c.p,rule.label),silhouette:rule.silhouette,x:c.p.x,y:c.p.y,
     radius:Math.hypot(c.p.w,c.p.h)/2,nest,reward:rule.reward}));kept++;
   }
  }
  Object.freeze(list);cache.set(world,{list,by:new Map(list.map(e=>[e.id,e]))});return list;
 }
 const entry=(world,id)=>{select(world);return cache.get(world)?.by.get(id)||null;};
 // Infectés ajoutés aux occupants ordinaires du lieu pour former le nid. Zéro pour tout lieu ordinaire.
 function extra(world,p){
  const e=p&&entry(world,p.id);if(!e)return 0;
  return Math.max(0,e.nest-(typeof world.threatCount==='function'?world.threatCount(p):0));
 }
 // Infectés ramenés par des migrations dans un nid vidé, lus dans un état brut (sauvegarde) : entier borné, sinon zéro.
 function refilled(raw,id){const n=raw&&typeof raw.refilled==='object'&&raw.refilled&&Object.prototype.hasOwnProperty.call(raw.refilled,id)?raw.refilled[id]:0;return Number.isInteger(n)&&n>0&&n<=REFILL_MAX?n:0;}
 // Effectif ramené par une migration donnée dans un lieu donné : fonction pure, plus petite que tout nid d'origine.
 const refillCount=(seed,site,group)=>P.min+G.hash(seed,site,group,'repop217')%(P.max-P.min+1);
 function initial(){return{version:2,active:false,objective:null,sighted:[],cleared:[],taken:{},refilled:{},migrations:[]};}
 function fresh(){return{...initial(),active:true};}
 function validate(raw,full){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Lieux remarquables 217 invalides.');};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1&&raw.version!==2||typeof raw.active!=='boolean')bad();
  // v1 (première tranche) : mêmes champs sans repeuplement ; l'objectif y était toujours un lieu repéré.
  const old=raw.version===1,keys=old?KEYS_V1:KEYS;
  if(Object.keys(raw).length!==keys.length||Object.keys(raw).some(k=>!keys.includes(k)))bad();
  const ids=list=>{if(!Array.isArray(list)||list.length>MAX_SITES)bad();list.forEach((id,i)=>{if(typeof id!=='string'||!ID.test(id)||i&&!(list[i-1]<id))bad();});return list.slice();};
  const sighted=ids(raw.sighted),cleared=ids(raw.cleared),taken={};
  // v2 : l'objectif peut être un lieu seulement vu de loin, donc absent de `sighted`.
  if(raw.objective!==null&&(typeof raw.objective!=='string'||(old?!sighted.includes(raw.objective):!ID.test(raw.objective))))bad();
  if(cleared.some(id=>!sighted.includes(id)))bad();
  if(!raw.taken||typeof raw.taken!=='object'||Array.isArray(raw.taken))bad();
  for(const[id,n]of Object.entries(raw.taken)){if(!cleared.includes(id)||typeof n!=='number'||!Number.isFinite(n)||n<=0||n>MAX_LOT)bad();taken[id]=n;}
  const refill={},migrations=[];
  if(!old){
   if(!raw.refilled||typeof raw.refilled!=='object'||Array.isArray(raw.refilled)||!Array.isArray(raw.migrations)||raw.migrations.length>MAX_MIGRATIONS)bad();
   let sum=0;
   for(const[id,n]of Object.entries(raw.refilled)){if(!cleared.includes(id)||!Number.isInteger(n)||n<P.min||n>REFILL_MAX)bad();refill[id]=n;sum+=n;}
   raw.migrations.forEach((id,i)=>{if(typeof id!=='string'||!GROUP.test(id)||i&&!(raw.migrations[i-1]<id))bad();migrations.push(id);});
   // Chaque migration comptée a ramené entre `min` et `max` infectés, une seule fois.
   if(sum<migrations.length*P.min||sum>migrations.length*P.max)bad();
  }
  if(!raw.active&&(raw.objective!==null||sighted.length||cleared.length||migrations.length))bad();
  // Un nid déclaré vidé doit l'être dans le registre régional de la même sauvegarde.
  const ledger=full?.frontier?.enemies;
  if(ledger&&cleared.length){
   const dead=new Map();
   for(const[id,hp]of Object.entries(ledger))if(hp===0){const site=id.split(':')[0];dead.set(site,(dead.get(site)||0)+1);}
   if(cleared.some(id=>(dead.get(id)||0)<R.nestMin))bad();
  }
  return{version:2,active:raw.active,objective:raw.objective,sighted,cleared,taken,refilled:refill,migrations};
 }
 const metres=d=>d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m';
 const wind=(dx,dy)=>WINDS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
 const lot=e=>e.reward.amount+' '+C.RESOURCE_META[e.reward.resource].label.toLowerCase();
 // Silhouettes en coordonnées d'écran, pied en (x,y), hauteur `h`. Dessin seul.
 function silhouette(c,shape,x,y,h,color){
  c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=Math.max(1.5,h/12);c.lineJoin='round';c.beginPath();
  if(shape==='tower'){
   c.moveTo(x-h*.16,y);c.lineTo(x-h*.08,y-h*.58);c.moveTo(x+h*.16,y);c.lineTo(x+h*.08,y-h*.58);c.moveTo(x-h*.13,y-h*.3);c.lineTo(x+h*.13,y-h*.3);c.stroke();
   c.beginPath();c.moveTo(x-h*.34,y-h*.58);c.lineTo(x+h*.34,y-h*.58);c.lineTo(x+h*.27,y-h*.92);c.lineTo(x,y-h);c.lineTo(x-h*.27,y-h*.92);c.closePath();c.fill();
  }else if(shape==='chimney'){
   c.moveTo(x-h*.15,y);c.lineTo(x-h*.08,y-h);c.lineTo(x+h*.08,y-h);c.lineTo(x+h*.15,y);c.closePath();c.fill();
   c.beginPath();c.moveTo(x-h*.42,y);c.lineTo(x-h*.42,y-h*.24);c.lineTo(x-h*.15,y-h*.24);c.moveTo(x+h*.15,y-h*.16);c.lineTo(x+h*.4,y-h*.16);c.lineTo(x+h*.4,y);c.stroke();
  }else{
   c.moveTo(x-h*.24,y);c.lineTo(x,y-h);c.lineTo(x+h*.24,y);c.moveTo(x-h*.17,y-h*.3);c.lineTo(x+h*.17,y-h*.3);c.moveTo(x-h*.1,y-h*.58);c.lineTo(x+h*.1,y-h*.58);
   c.moveTo(x-h*.3,y-h*.8);c.lineTo(x+h*.3,y-h*.8);c.moveTo(x-h*.17,y-h*.3);c.lineTo(x+h*.1,y-h*.58);c.moveTo(x+h*.17,y-h*.3);c.lineTo(x-h*.1,y-h*.58);c.stroke();
  }
  c.restore();
 }
 const COLORS=Object.freeze({nest:'#e0a35c',cleared:'#a5cf9c',rewarded:'#8b9488',far:'#c3cbbd'});
 function tag(c,text,x,y,color,width){
  c.save();c.font='bold 12px system-ui, sans-serif';c.textAlign='center';
  const w=Math.min(width||Infinity,(c.measureText(text)?.width||text.length*7)+10),left=Math.max(4,Math.min((width||Infinity)-w-4,x-w/2));
  c.fillStyle='rgba(12,24,18,.86)';c.fillRect(left,y-12,w,17);c.fillStyle=color;c.fillText(text,left+w/2,y+1,w-6);c.restore();
 }
 function install(g,doc){
  if(g.remarkable217)return g.remarkable217;if(!g.expansions)throw Error('Installer les opérations avant les lieux remarquables 217.');
  let state=initial(),clock=-Infinity,primed=false,seenWorld=null,hud=null,infested=new Set();
  const forget=()=>{clock=-Infinity;primed=false;seenWorld=null;infested=new Set();};
  const active=()=>state.active&&Boolean(g.frontier);
  const world=()=>g.frontier.world();
  const sites=()=>active()?select(world()):Object.freeze([]);
  const origin=()=>{const f=g.frontier.position(),P=root.DeadwallAtlasProjection;try{if(!f.active&&P?.playerPosition)return P.playerPosition(g,f);}catch(error){/* repli : position régionale */}return f;};
  // Occupants du lieu : le nid d'origine (indices 0 à nest-1), puis ceux ramenés par des migrations, à la suite.
  const refillOf=e=>state.refilled[e.id]||0;
  const living=e=>{let n=0;for(let i=0,all=e.nest+refillOf(e);i<all;i++)if(g.frontier.enemyHealth(e.id+':e'+i)!==0)n++;return n;};
  const emptied=e=>living(e)===0;
  const takenOf=e=>state.taken[e.id]||0;
  // Un nid repeuplé redevient un nid, lot emporté ou non.
  const repopulated=e=>refillOf(e)>0&&state.cleared.includes(e.id)&&!emptied(e);
  const stateOf=e=>!state.cleared.includes(e.id)||repopulated(e)?'nest':takenOf(e)>=e.reward.amount-1e-9?'rewarded':'cleared';
  const insert=(list,id)=>{if(!list.includes(id)){list.push(id);list.sort();}};
  function view(e,o=origin()){
   // `far` : vu de loin, dérivé de la position, jamais sauvegardé. `sighted` : repéré en sortie, sauvegardé ; lui seul
   // autorise à montrer le nid et le lot.
   const dx=e.x-o.x,dy=e.y-o.y,back=repopulated(e);
   return{id:e.id,name:e.name,kind:e.kind,x:e.x,y:e.y,distance:Math.hypot(dx,dy),state:stateOf(e),label:e.label,bearing:wind(dx,dy),nest:back?living(e):e.nest,repopulated:back,
    reward:{resource:e.reward.resource,amount:e.reward.amount,left:Math.max(0,e.reward.amount-takenOf(e))},far:Math.hypot(dx,dy)<=R.sight,sighted:state.sighted.includes(e.id),objective:state.objective===e.id};
  }
  function list(){const o=active()?origin():null;return sites().map(e=>view(e,o)).sort((a,b)=>a.distance-b.distance||(a.id<b.id?-1:1));}
  const nearest=()=>list()[0]||null;
  const objective=()=>{const e=state.objective&&active()?entry(world(),state.objective):null;return e?view(e):null;};
  const nestExtra=(w,p)=>{if(!state.active)return 0;const n=extra(w,p);return n>0?n+(state.refilled[p.id]||0):n;};
  const UNKNOWN='nid et lot inconnus tant que le lieu n’est pas repéré, en sortie, à '+metres(R.spot);
  const card=v=>v.name+' — '+v.label+' · '+v.bearing+' '+metres(v.distance)+' · '+(!v.sighted?'vu de loin : '+UNKNOWN+'.':
   (v.state==='nest'?(v.repopulated?'nid repeuplé par une migration : ':'nid de ')+v.nest+' infectés, immobiles tant qu’on ne les dérange pas':v.state==='cleared'?'nid vidé':'lot emporté')
   +(v.reward.left>1e-9?' · lot annoncé : '+lot(v)+(v.reward.left<v.reward.amount?' (reste '+Math.ceil(v.reward.left)+')':''):v.state==='nest'?' · lot déjà emporté':'')+'.');
  // Repeuplement : lit les migrations du monde et les avant-postes, n'y écrit rien ; aucun tirage.
  function repopulate(all){
   const ready=all.filter(e=>state.cleared.includes(e.id)&&refillOf(e)+P.min<=REFILL_MAX&&emptied(e));
   if(!ready.length||state.migrations.length>=MAX_MIGRATIONS)return;
   let groups;try{groups=g.worldEvolution?.overview?.().groups;}catch(error){groups=null;}
   if(!Array.isArray(groups))return;
   const moving=groups.filter(h=>h&&h.kind==='migrating'&&h.alive>0&&typeof h.id==='string'&&GROUP.test(h.id)&&!state.migrations.includes(h.id)).sort((a,b)=>a.id<b.id?-1:1);
   if(!moving.length)return;
   // Avant-postes lus seulement quand une migration est à portée d'un nid vidé : un lieu tenu ne se repeuple pas.
   let held=null;const holds=id=>{if(!held){try{held=g.outposts217?.active?.()?g.outposts217.posts().map(p=>p.id):[];}catch(error){held=[];}}return held.includes(id);};
   const f=g.frontier.active()?g.frontier.position():null,seed=world().seed;let changed=false;
   for(const e of ready){
    if(f&&Math.hypot(e.x-f.x,e.y-f.y)<=P.unseen)continue;
    const h=moving.find(h=>!state.migrations.includes(h.id)&&Math.hypot(h.x-e.x,h.y-e.y)<=P.range);if(!h||holds(e.id))continue;
    const n=Math.min(refillCount(seed,e.id,h.id),REFILL_MAX-refillOf(e));
    state.refilled[e.id]=refillOf(e)+n;insert(state.migrations,h.id);infested.add(e.id);changed=true;
    if(state.sighted.includes(e.id))g.notify?.('Une migration est passée : '+e.name+' est de nouveau un nid ('+n+' infectés). Rien n’est acquis hors des murs.','danger');
   }
   if(changed)g.save?.(false);
  }
  // Relevé : lieux entrés en vue, nids vidés. Lit la position et le registre régional ; n'y écrit rien.
  function tick(){
   if(!active()||g.state!=='playing'||g.gameOver||!g.world)return;
   if(seenWorld!==g.world){forget();seenWorld=g.world;}
   // Repérage : en sortie seulement, Commandant dehors à `spot` mètres. Depuis la cité, un lieu reste « vu de loin ».
   const f=g.frontier.active()?g.frontier.position():null,o=f&&f.z===0?f:null,all=sites(),fresh=[];
   for(const e of all){
    if(o&&!state.sighted.includes(e.id)&&Math.hypot(e.x-o.x,e.y-o.y)<=R.spot){insert(state.sighted,e.id);fresh.push(e);}
    if(!state.cleared.includes(e.id)){
     if(emptied(e)){
      insert(state.sighted,e.id);insert(state.cleared,e.id);
      g.notify?.('Nid vidé : '+e.name+'. Le lot annoncé ('+lot(e)+') se charge sur place.','good');
     }
    }else if(refillOf(e)>0){
     // Nid repeuplé : suivi en mémoire seulement, pour annoncer une fois qu'il est de nouveau vidé.
     if(!emptied(e))infested.add(e.id);
     else if(infested.delete(e.id))g.notify?.('Nid de nouveau vidé : '+e.name+'.'+(e.reward.amount-takenOf(e)>1e-9?' Le lot se charge sur place.':''),'good');
    }
   }
   repopulate(all);
   if(primed&&fresh.length)g.notify?.(fresh.length===1?'Lieu repéré : '+fresh[0].name+' ('+fresh[0].label+') — nid de '+fresh[0].nest+', lot : '+lot(fresh[0])+'.':fresh.length+' lieux repérés. Voir « Lieux remarquables ».');
   primed=true;
  }
  const can=()=>g.expansions.canAct?.()!==false;
  function designateQuote(id){
   if(!active())return{ok:false,reason:'Cette campagne n’a pas de lieux remarquables.'};
   const e=entry(world(),id);
   const o=e&&origin();
   if(!e||!state.sighted.includes(id)&&Math.hypot(e.x-o.x,e.y-o.y)>R.sight)return{ok:false,reason:'Ce lieu n’est pas en vue.'};
   if(stateOf(e)==='rewarded')return{ok:false,reason:'Le lot de ce lieu a déjà été emporté.'};
   if(state.objective===id)return{ok:false,reason:'C’est déjà l’objectif de sortie.'};
   return{ok:true};
  }
  // Désigner un lieu seulement vu de loin ne le repère pas : son nid et son lot restent inconnus.
  function designate(id){const q=designateQuote(id);if(!q.ok)return q;state.objective=id;g.notify?.('Objectif de sortie : '+entry(world(),id).name+'.');g.save?.(false);return{ok:true};}
  function abandon(){if(!state.objective)return{ok:false,reason:'Aucun objectif de sortie.'};state.objective=null;g.save?.(false);return{ok:true};}
  function claimQuote(id){
   if(!active())return{ok:false,reason:'Cette campagne n’a pas de lieux remarquables.'};
   const e=entry(world(),id);if(!e)return{ok:false,reason:'Lieu inconnu.'};
   const f=g.frontier.position();
   if(!f.active||Math.hypot(e.x-f.x,e.y-f.y)>e.radius+R.claimReach)return{ok:false,reason:'Le lot se charge sur place, à pied.'};
   if(f.car?.driving)return{ok:false,reason:'Descendez du véhicule.'};
   if(!emptied(e))return{ok:false,reason:'Le nid n’est pas vidé.'};
   const left=e.reward.amount-takenOf(e);if(!(left>1e-9))return{ok:false,reason:'Le lot a déjà été emporté.'};
   const room=g.player.carryCapacity-C.bagTotal(g.player.carry);if(!(room>1e-9))return{ok:false,reason:'Sac plein : transférez au coffre ou rentrez.'};
   return{ok:true,amount:Math.min(left,room),resource:e.reward.resource};
  }
  // Le lot passe du lieu au sac : jamais plus que l'annonce, jamais plus que la place du sac.
  function claim(id){
   const q=claimQuote(id);if(!q.ok)return q;
   const e=entry(world(),id);
   insert(state.sighted,id);insert(state.cleared,id);
   g.player.carry[q.resource]+=q.amount;state.taken[id]=Math.min(e.reward.amount,takenOf(e)+q.amount);
   if(g.stats&&Number.isFinite(g.stats.gathered))g.stats.gathered+=q.amount;
   const done=stateOf(e)==='rewarded';if(done&&state.objective===id)state.objective=null;
   g.notify?.((done?'Lot emporté : ':'Lot entamé : ')+Math.round(q.amount*10)/10+' '+C.RESOURCE_META[q.resource].label.toLowerCase()+' · '+e.name+'.','good');
   g.save?.(false);return{ok:true,amount:q.amount,resource:q.resource};
  }
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : sa région n’a ni lieu remarquable ni nid. La règle ne s’active pas en cours de campagne.',rows:[
    {label:'Lieux remarquables',value:'Sans objet.'},{label:'Objectif de sortie',value:'Sans objet.'}]};
   const all=list(),seen=all.filter(v=>v.sighted),known=all.filter(v=>v.sighted||v.far),target=all.find(v=>v.objective);
   const rows=[{label:'Objectif de sortie',value:target?card(target):'Aucun. Désignez un lieu en vue : son cap et sa distance restent affichés.'},
    {label:'Lieux en vue',value:seen.length+' repérés sur '+all.length+' dans la région, '+all.filter(v=>v.far&&!v.sighted).length+' seulement vus de loin · '+seen.filter(v=>v.state==='nest').length+' nids, '+seen.filter(v=>v.state==='cleared').length+' vidés, '+seen.filter(v=>v.state==='rewarded').length+' lots emportés.'}];
   for(const v of known.filter(v=>!v.objective&&v.state!=='rewarded').slice(0,OFFERS))rows.push({label:v.label.charAt(0).toUpperCase()+v.label.slice(1),value:card(v)});
   return{summary:'Quelques lieux par canton se voient de loin, à '+metres(R.sight)+' : château d’eau, cheminée, pylône, avec leur nom et leur distance. Un lieu n’est repéré qu’en sortie, à '+metres(R.spot)+' : on apprend alors son nid de '+R.nestMin+' à '+R.nestMax+' infectés immobiles et son lot, à charger sur place une seule fois quand le nid est vidé. Une migration qui passe près d’un nid vidé, loin du Commandant et sans avant-poste, y ramène '+P.min+' à '+P.max+' infectés ; le lot emporté ne revient pas.',rows};
  }
  function actions(){
   if(!state.active)return[];
   const all=list(),out=[],ok=can();
   for(const v of all){
    if(v.state==='rewarded')continue;
    const q=claimQuote(v.id);
    if(q.ok||v.state==='cleared'&&v.distance<=R.sight)out.push({id:'claim-'+v.id,label:'Charger le lot : '+v.name,description:'Lot annoncé : '+lot(v)+', reste '+Math.ceil(v.reward.left)+'. Pris une seule fois ; ce que le sac ne peut pas porter reste sur place.',
     disabled:!ok||!q.ok,reason:q.reason||'Dans le sac : '+Math.round(q.amount*10)/10+'.',run:()=>claim(v.id)});
   }
   if(state.objective)out.push({id:'abandon',label:'Abandonner l’objectif de sortie',description:'Retire le cap affiché. Le lieu reste en vue.',disabled:!ok,reason:'Rien n’est perdu.',run:abandon});
   for(const v of all.filter(v=>(v.sighted||v.far)&&!v.objective&&v.state!=='rewarded').slice(0,OFFERS)){
    const q=designateQuote(v.id);
    out.push({id:'designate-'+v.id,label:'Objectif de sortie : '+v.name,description:card(v),disabled:!ok||!q.ok,reason:q.reason||'Un seul objectif à la fois ; il remplace le précédent.',run:()=>designate(v.id)});
   }
   return out;
  }
  // --- Présentation : lit `list()`, ne modifie rien. ---
  const shown=()=>list().filter(v=>v.objective||(v.sighted||v.far)&&v.state!=='rewarded');
  // Couleur d'état pour un lieu repéré seulement : un lieu vu de loin ne dit rien de son nid.
  const tint=v=>v.objective?'#f6dc93':v.sighted?COLORS[v.state]:COLORS.far;
  function drawRegion(){
   if(!active()||!g.frontier.active()||g.state!=='playing'||!g.ctx)return;
   const marks=shown().filter(v=>v.objective||v.distance<=R.sight);if(!marks.length)return;
   // Hors du centre de l'écran, le repère se pose sur une ellipse autour du commandant, à l'écart des panneaux.
   const f=g.frontier.position(),s=g.frontier.scale(),c=g.ctx,W=g.width,H=g.height,rx=W*.3,ry=H*.16;
   c.save();c.setTransform(g.dpr||1,0,0,g.dpr||1,0,0);
   let far=0;
   for(const v of marks){
    const dx=v.x-f.x,dy=v.y-f.y,color=tint(v);
    let x=W/2+dx*s,y=H/2+dy*s;const inside=Math.abs(dx*s)<rx*.9&&Math.abs(dy*s)<ry*.9;
    if(!inside){
     if(!v.objective&&++far>MARKS)continue;
     const k=1/Math.max(1e-9,Math.hypot(dx/rx,dy/ry));
     x=W/2+dx*k;y=H/2+dy*k;
    }
    const h=inside?46:Math.max(22,40-v.distance/R.sight*16);
    if(v.objective){c.strokeStyle=color;c.lineWidth=1.5;c.setLineDash?.([4,3]);c.beginPath();c.arc(x,y-h/2,h*.72,0,Math.PI*2);c.stroke();c.setLineDash?.([]);}
    silhouette(c,R.kinds[v.kind].silhouette,x,y,h,color);
    tag(c,(v.objective?'OBJECTIF · ':'')+title(v)+' · '+metres(v.distance),x,y+15,color,W);
   }
   c.restore();
  }
  function drawAtlas(c,cam){
   if(!active()||!c||!cam?.screen)return;
   c.save();
   for(const v of shown().concat(list().filter(v=>v.sighted&&v.state==='rewarded'))){
    const q=cam.screen(v.x,v.y);if(q.x<-30||q.y<-30||q.x>cam.width+30||q.y>cam.height+30)continue;
    const color=tint(v),h=v.objective?24:v.state==='rewarded'?12:18;
    if(v.objective){c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.arc(q.x,q.y-h/2,h*.8,0,Math.PI*2);c.stroke();}
    silhouette(c,R.kinds[v.kind].silhouette,q.x,q.y,h,color);
    if(v.objective||cam.scale>.05&&v.state!=='rewarded')tag(c,(v.objective?'OBJECTIF · ':'')+title(v)+' · '+metres(v.distance),q.x,q.y+14,color,cam.width);
   }
   c.restore();
  }
  // Minicarte de région : un point sobre par lieu vu de loin, un losange pour l'objectif. Hors du cadre, le repère
  // se pose sur le bord, dans la direction du lieu. La minicarte régionale couvre `MINI_SPAN` mètres (frontier-art).
  function drawMinimap(){
   if(!active()||!g.frontier.active()||g.state!=='playing')return;
   const c=g.mctx,m=g.minimap;if(!c||!m||!(m.width>0)||!(m.height>0))return;
   const f=g.frontier.position();if(f.z!==0)return;
   const marks=shown().filter(v=>v.objective||v.distance<=R.sight);if(!marks.length)return;
   const w=m.width,h=m.height,s=w/MINI_SPAN,pad=6,hx=w/2-pad,hy=h/2-pad;let dots=0;
   c.save();c.setTransform?.(1,0,0,1,0,0);
   for(const v of marks.sort((a,b)=>Number(a.objective)-Number(b.objective))){
    if(!v.objective&&++dots>MINI_DOTS)continue;
    let dx=(v.x-f.x)*s,dy=(v.y-f.y)*s;const k=Math.max(Math.abs(dx)/hx,Math.abs(dy)/hy);
    if(k>1){dx/=k;dy/=k;}
    const x=w/2+dx,y=h/2+dy,color=tint(v);
    c.fillStyle=color;c.strokeStyle='rgba(12,24,18,.9)';c.lineWidth=1.5;c.beginPath();
    if(v.objective){const r=5.5;c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();}
    else c.arc(x,y,2.6,0,Math.PI*2);
    c.fill();c.stroke();
   }
   c.restore();
  }
  function hudText(){
   if(!active())return'';
   const v=objective();if(v)return'Objectif : '+title(v)+' ('+v.label+') · cap '+v.bearing+' · '+metres(v.distance)+(!v.sighted?'':v.state==='nest'?' · nid de '+v.nest:v.state==='cleared'?' · nid vidé, lot à charger':'');
   const n=shown().filter(v=>v.distance<=R.sight)[0];return n?'Repère : '+title(n)+' ('+n.label+') · cap '+n.bearing+' · '+metres(n.distance):'';
  }
  function refreshHud(){
   if(!doc?.getElementById)return;
   if(!hud){
    const host=doc.getElementById('frontierHud');if(!host||!doc.createElement)return;
    hud=doc.createElement('small');hud.id='remarkable217Hud';hud.className='frontier-survey-text';hud.setAttribute?.('role','status');
    const before=doc.getElementById('frontierFocus');
    if(before&&before.parentNode===host&&typeof host.insertBefore==='function')host.insertBefore(hud,before);else host.appendChild(hud);
   }
   const text=g.state==='playing'&&g.frontier.active()?hudText():'';
   if(hud.textContent!==text)hud.textContent=text;hud.hidden=!text;
  }
  const safe=fn=>{try{fn();}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}};
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){
   const result=update.call(g,dt,...rest),now=Number(g.elapsed)||0;
   if(now<clock||now-clock>=CHECK_SECONDS){clock=now;tick();}
   return result;
  };
  if(doc){
   const render=g.render;
   // En sortie, `updateUI` ne passe pas à chaque image : la ligne de repère suit le rendu (texte comparé, sans coût).
   if(typeof render==='function')g.render=function(...args){const result=render.apply(g,args);safe(drawRegion);if(g.frontier?.active?.())safe(refreshHud);return result;};
   const mini=g.renderMinimap;
   if(typeof mini==='function')g.renderMinimap=function(...args){const result=mini.apply(g,args);safe(drawMinimap);return result;};
   const updateUI=g.updateUI;
   if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(g,args);safe(refreshHud);return result;};
   const A=root.DeadwallAtlasRender;
   if(A&&typeof A.render==='function'&&!A.__remarkable217){
    const base=A.render;A.__remarkable217=true;
    A.render=function(c,game,v,cam,...rest){const result=base.call(this,c,game,v,cam,...rest);if(game?.remarkable217)safe(()=>game.remarkable217.drawAtlas(c,cam));return result;};
   }
  }
  const api=Object.freeze({active:()=>state.active,list,nearest,objective,nestExtra,designate,designateQuote,abandon,claim,claimQuote,tick,overview,actions,drawRegion,drawAtlas,drawMinimap,hudText,snapshot:()=>validate(state)});g.remarkable217=api;
  g.expansions.register({id:'remarkable217',title:'Lieux remarquables',overview,actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);forget();},reset:()=>{state=fresh();forget();}});
  return api;
 }
 const api=Object.freeze({KINDS:Object.freeze([...KINDS]),initial,fresh,validate,kindOf,select,extra,refilled,refillCount,silhouette,install});root.DeadwallRemarkable217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL,root.document);
})(globalThis);
