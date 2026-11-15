// Fiche de graine (docs/GAME_BIBLE.md §7.13, « des graines qui comptent ») : ce que la graine fixe autour de D-17.
// Présentation seulement : ce module lit le monde déjà généré (région, rivières, côte, agglomérations, gisements du site),
// le milieu de la cité (src/biome217.js) et les lieux remarquables (src/remarkable217.js).
// Il ne modifie aucun stock, aucune règle, aucun tirage, aucune version de génération et aucune sauvegarde.
// Aperçu avant le départ : au menu, sur clic seulement, la région d'une graine saisie est tracée à part, dans les
// versions que le départ choisirait (`DeadwallWorldPack131.startVersions`), sans créer de campagne ni toucher au jeu.
// Divulgation : la fiche nomme les lieux remarquables (nom, genre, direction, distance). Le nid et le lot d'un lieu ne
// s'affichent que dans le carnet, pour un lieu déjà repéré par la campagne, et dans leur état réel. Jamais dans l'aperçu.
// Tracé hors du fil principal : ce même fichier sert de script de Web Worker. Chargé dans un worker, il charge les
// scripts de génération (`WORKER_SCRIPTS`) et répond aux demandes d'aperçu ; la page garde le calcul direct en repli.
(function(root,factory){
 // Adresse de ce script, relevée au chargement : c'est elle que le worker d'aperçu recharge.
 const own=root.document?.currentScript?.src||'';
 const api=factory(root,own);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallSeedCard217=api;
 if(!root.document&&typeof root.importScripts==='function'&&typeof root.postMessage==='function')api.serve(root);
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root,ownUrl){
 'use strict';
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
 // Seuils de lecture seulement : aucun système de jeu ne les consulte. Distances régionales en mètres ;
 // `walkRadius` est en unités du site de D-17 (32 unités par mètre).
 const RULES=freeze({
  biomeRings:[[0,1],[400,8],[800,12],[1200,16],[1600,20]],biomeMinShare:.05,biomeOthers:3,
  waterNear:1500,townNear:2000,townWide:3000,placeRadius:1500,
  walkRadius:900,scarce:5,plenty:15,places:3,cache:8,refreshSeconds:.5,previewDelayMs:60
 });
 // Scripts de génération qu'un worker d'aperçu charge avant de tracer une région, dans l'ordre d'`index.html`.
 // Noms relatifs à ce fichier. Une dépendance manquante fait échouer le worker : la page calcule alors elle-même.
 const WORKER_SCRIPTS=freeze(['frontier-specialists.js','frontier-places.js','settlement-plans.js','frontier-geometry.js','seed-detail157.js','codex3000-live-data.js','codex3000-runtime.js','region-roadkit.js','region-settlements.js','codex-context160-data.js','codex-context160.js','codex-geometry160.js','frontage174.js','frontier-world.js','frontier-state.js','frontier-logistics.js','field-atlas-state.js','essential-content.js','essential-state.js','world-evolution-state.js','core.js','biomes135.js','geography135.js','world-spawns131.js','world-stream131.js','profile.js','codex-layouts2026.js','codex-physical2026.js','codex-furnishings2026.js','codex-campaign205.js','biome217.js','remarkable217.js','world-pack131.js']);
 const OPENING=freeze(['wood','stone','scrap']);
 // Type de lieu régional qui fournit chaque ressource d'ouverture, et son nom dans une phrase.
 const SOURCES=freeze([['wood','sawmill'],['stone','quarry'],['scrap','scrapyard']]);
 const SOURCE_NAMES=freeze({wood:'la scierie la plus proche',stone:'la carrière la plus proche',scrap:'la casse la plus proche'});
 const WATER_NAMES=freeze({river:'rivière',stream:'ruisseau',lake:'lac',pond:'étang',pool:'mare',sea:'mer',ocean:'mer'});
 const TOWN_NAMES=freeze({hameau:'hameau',village:'village',bourg:'bourg',ville:'ville','grande-ville':'grande ville'});
 const TOWN_RANK=freeze({hameau:1,village:2,bourg:3,ville:4,'grande-ville':5});
 const DENSITY=freeze({isole:'isolé',rural:'rural',periurbain:'périurbain',urbain:'urbain'});
 const DIRECTIONS=freeze(['à l’est','au sud-est','au sud','au sud-ouest','à l’ouest','au nord-ouest','au nord','au nord-est']);
 const COAST_SIDE=freeze({west:'à l’ouest',east:'à l’est',north:'au nord',south:'au sud'});
 // Effets du milieu de la cité, en mots courts pour le conseil : ressource touchée, puis ce qu'il faut en faire.
 const EFFECT_NAMES=freeze({wood:'bois',stone:'pierre',scrap:'ferraille',farm:'fermes',rain:'citernes'});
 const BONUS_HINTS=freeze({wood:'ouvrez en bois',stone:'ouvrez en pierre',scrap:'ouvrez en ferraille',farm:'misez tôt sur les fermes',rain:'comptez sur les citernes'});
 const MALUS_HINTS=freeze({wood:'comptez plus de temps pour le bois',stone:'comptez plus de temps pour la pierre',scrap:'comptez plus de temps pour la ferraille',farm:'prévoyez plus de fermes',rain:'prévoyez plus de citernes'});
 const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const core=()=>need('DeadwallCore','./core.js');
 const finite=Number.isFinite;
 const plural=(n,one,many)=>n+' '+(n>1?many:one);
 const lower=text=>{const s=String(text||'');return s.charAt(0).toLowerCase()+s.slice(1);};
 const upper=text=>{const s=String(text||'');return s.charAt(0).toUpperCase()+s.slice(1);};
 // Distance lisible : dizaines de mètres, puis kilomètres à une décimale.
 function distanceText(d){
  if(!finite(d)||d<0)return '';
  if(d<1000)return Math.max(10,Math.round(d/10)*10)+' m';
  return (Math.round(d/100)/10).toFixed(1).replace('.0','').replace('.',',')+' km';
 }
 // Le nord est vers les y décroissants, comme sur la carte régionale.
 function direction(dx,dy){
  if(!finite(dx)||!finite(dy)||(!dx&&!dy))return '';
  return DIRECTIONS[((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8];
 }
 function toSegment(x,y,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len>0?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/len)):0,px=a.x+dx*t,py=a.y+dy*t;
  return{d:Math.hypot(x-px,y-py),x:px,y:py};
 }
 function toLine(x,y,points,half=0){
  let best=null;
  for(let i=1;i<(points?.length||0);i++){const q=toSegment(x,y,points[i-1],points[i]);if(!best||q.d<best.d)best=q;}
  return best?{distance:Math.max(0,best.d-half),direction:direction(best.x-x,best.y-y)}:null;
 }
 // Milieux autour de D-17 : relevé du milieu principal sur quelques anneaux, sans tirage.
 function biomes(world,home){
  if(typeof world?.biomeAt!=='function')return{known:false,dominant:null,others:[],text:'Milieu non relevé sur cette génération de carte.'};
  const counts=new Map(),names=new Map();let total=0;
  for(const [radius,count]of RULES.biomeRings)for(let i=0;i<count;i++){
   const angle=i/count*Math.PI*2;let sample=null;
   try{sample=world.biomeAt(home.x+Math.cos(angle)*radius,home.y+Math.sin(angle)*radius);}catch{sample=null;}
   const id=sample?.primary||sample?.id;if(typeof id!=='string')continue;
   total++;counts.set(id,(counts.get(id)||0)+1);
   if(!names.has(id))names.set(id,sample.id===id&&sample.name?sample.name:world.biomes?.BY?.[id]?.name||id);
  }
  if(!total)return{known:false,dominant:null,others:[],text:'Milieu non relevé sur cette génération de carte.'};
  // Égalités départagées par identifiant : l'ordre ne dépend pas de l'ordre de relevé.
  const ranked=[...counts].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).map(([id,n])=>({id,name:names.get(id),share:n/total}));
  const dominant=ranked[0],others=ranked.slice(1).filter(b=>b.share>=RULES.biomeMinShare).slice(0,RULES.biomeOthers);
  const pct=b=>Math.round(b.share*100)+' %';
  return{known:true,dominant,others,text:dominant.name+' ('+pct(dominant)+')'+(others.length?' ; puis '+others.map(b=>lower(b.name)+' ('+pct(b)+')').join(', '):' ; milieu unique à la ronde')+'.'};
 }
 // Eau : point d'eau le plus proche, rivière la plus proche, côte. Lecture du réseau déjà tracé.
 function water(world,home){
  const hydro=world?.hydrology;
  if(!hydro||!Array.isArray(hydro.features))return{known:false,nearest:null,river:null,coast:null,none:false,text:'Eau non relevée sur cette génération de carte.'};
  let nearest=null,river=null,coast=null;
  try{const s=world.hydrologyAt?.(home.x,home.y);if(s&&finite(s.distanceToWater)&&s.nearestKind)nearest={kind:s.nearestKind,name:WATER_NAMES[s.nearestKind]||'eau',distance:Math.max(0,s.distanceToWater)};}catch{nearest=null;}
  for(const f of hydro.features){
   if(f?.kind!=='river'||!Array.isArray(f.points))continue;
   const q=toLine(home.x,home.y,f.points,(Number(f.width)||0)/2);if(q&&(!river||q.distance<river.distance))river=q;
  }
  const shore=toLine(home.x,home.y,hydro.coast?.points);
  if(shore)coast={distance:shore.distance,direction:COAST_SIDE[hydro.coast.side]||shore.direction};
  const closest=Math.min(nearest?nearest.distance:Infinity,river?river.distance:Infinity,coast?coast.distance:Infinity),none=!(closest<=RULES.waterNear),parts=[];
  if(none)parts.push('Aucune eau proche');
  if(nearest&&nearest.kind!=='river'&&!none)parts.push(upper(nearest.name)+' à '+distanceText(nearest.distance));
  if(river)parts.push((parts.length?'rivière':'Rivière')+' à '+distanceText(river.distance)+(river.direction?' '+river.direction:''));
  if(coast)parts.push((parts.length?'côte':'Côte')+' à '+distanceText(coast.distance)+(coast.direction?' '+coast.direction:''));
  return{known:true,nearest,river,coast,none,text:parts.join(' · ')+'.'};
 }
 // Densité urbaine : agglomérations et lieux recensés autour de D-17, traduits en un mot.
 function density(world,home){
  const towns=(world?.towns||[]).filter(t=>finite(t?.x)&&finite(t?.y)).map(t=>({id:t.id,name:t.name,kind:t.kind,distance:Math.hypot(t.x-home.x,t.y-home.y),direction:direction(t.x-home.x,t.y-home.y)})).sort((a,b)=>a.distance-b.distance||(String(a.id)<String(b.id)?-1:1));
  const near=towns.filter(t=>t.distance<=RULES.townNear),wide=towns.filter(t=>t.distance<=RULES.townWide);
  let places=0;for(const p of world?.pois||[])if(finite(p?.x)&&finite(p?.y)&&Math.hypot(p.x-home.x,p.y-home.y)<=RULES.placeRadius)places++;
  const big=near.some(t=>(TOWN_RANK[t.kind]||0)>=4);
  const level=near.length>=2||big?'urbain':near.length>=1||wide.length>=2?'periurbain':wide.length>=1?'rural':'isole';
  const first=towns[0]||null,km=distanceText(RULES.townWide),m=distanceText(RULES.placeRadius);
  const text=upper(DENSITY[level])+' : '+(wide.length?plural(wide.length,'agglomération','agglomérations')+' à moins de '+km:'aucune agglomération à moins de '+km)+', '+plural(places,'lieu recensé','lieux recensés')+' à moins de '+m+
   (first?' ; la plus proche, '+first.name+(TOWN_NAMES[first.kind]?' ('+TOWN_NAMES[first.kind]+')':'')+', est à '+distanceText(first.distance)+' '+first.direction:'')+'.';
  return{level,word:DENSITY[level],towns:wide.length,townsNear:near.length,places,nearestTown:first,all:towns,text};
 }
 // Ressources d'ouverture : gisements du site de D-17 à portée de marche du centre, à leur quantité d'origine.
 function opening(nodes,C){
  const centre=(C?.WORLD_SIZE||4096)/2,out={radius:RULES.walkRadius,metres:Math.round(RULES.walkRadius/(C?.TILE||32))};
  for(const key of OPENING)out[key]={count:0,amount:0,level:'scarce'};
  let known=false;
  for(const n of nodes||[]){
   known=true;const slot=out[n?.type];if(!slot||!finite(n.x)||!finite(n.y)||Math.hypot(n.x-centre,n.y-centre)>RULES.walkRadius)continue;
   slot.count++;slot.amount+=Math.max(0,Number(n.maxAmount??n.amount)||0);
  }
  for(const key of OPENING){const slot=out[key];slot.amount=Math.round(slot.amount);slot.level=slot.count<=RULES.scarce?'scarce':slot.count>=RULES.plenty?'plenty':'fair';}
  const label=key=>String(C?.RESOURCE_META?.[key]?.label||key).toLowerCase();
  const word={scarce:['rare','rare'],fair:['présent','présente'],plenty:['abondant','abondante']};
  out.known=known;out.labels=Object.fromEntries(OPENING.map(key=>[key,label(key)]));
  out.text=known?OPENING.map(key=>upper(label(key))+' '+word[out[key].level][key==='wood'?0:1]+' ('+plural(out[key].count,'gisement','gisements')+', '+out[key].amount+')').join(' · ')+' — à moins de '+out.metres+' m du centre.':'Gisements du site non relevés.';
  return out;
 }
 // Exploitations régionales les plus proches (carrière, scierie, casse) : des lieux déjà posés par la génération.
 function sources(world,home){
  const out={};
  for(const [key,type]of SOURCES){
   let best=null;
   for(const p of world?.pois||[]){if(p?.type!==type||!finite(p.x)||!finite(p.y))continue;const d=Math.hypot(p.x-home.x,p.y-home.y);if(!best||d<best.distance)best={distance:d,direction:direction(p.x-home.x,p.y-home.y)};}
   out[key]=best;
  }
  return out;
 }
 // Lieux : les lieux remarquables si leur module est présent, sinon les grandes agglomérations du monde généré.
 // `reveal` : seul le carnet d'une campagne peut montrer nid et lot, et seulement pour un lieu que la campagne a
 // repéré (`sighted` de `g.remarkable217.list()`). L'état montré est l'état réel : nid, nid vidé, lot emporté.
 function places(remarkable,dense,home,C,reveal){
  const items=[];
  if(Array.isArray(remarkable))for(const r of remarkable){
   if(!r||typeof r.name!=='string')continue;
   // Distance depuis le centre de la cité, calculée sur les coordonnées : la distance fournie par le module dépend
   // de la position du joueur et ne sert que si le lieu n'a pas de coordonnées.
   const placed=finite(r.x)&&finite(r.y),d=placed?Math.hypot(r.x-home.x,r.y-home.y):finite(r.distance)?r.distance:NaN;if(!finite(d))continue;
   const sighted=reveal===true&&r.sighted===true,state=!sighted?'':r.state==='cleared'||r.state==='rewarded'?r.state:'nest';
   const nest=state==='nest'&&Number.isInteger(r.nest)&&r.nest>0?r.nest:0,amount=Number(r.reward?.amount),resource=r.reward?.resource;
   // Lot restant sur place : l'annonce d'origine tant que rien n'est chargé, puis ce qui reste, puis rien.
   const rawLeft=r.reward?.left,left=typeof rawLeft==='number'&&finite(rawLeft)?Math.max(0,rawLeft):amount,partial=state==='cleared'&&left<amount-1e-9;
   const lot=sighted&&state!=='rewarded'&&amount>0&&left>1e-9&&typeof resource==='string'?Math.ceil(left-1e-9)+' '+String(C?.RESOURCE_META?.[resource]?.label||resource).toLowerCase():'';
   const detail=!sighted?'':state==='rewarded'||state==='cleared'&&!lot?'nid vidé, lot emporté':state==='cleared'?'nid vidé, '+(partial?'reste du lot : ':'lot à charger : ')+lot:[nest?'nid de '+nest:'',lot?'lot : '+lot:''].filter(Boolean).join(', ');
   // Titre d'origine du lieu, sans sa variante ni son milieu : le nom complet déborde d'une ligne de fiche.
   items.push({id:String(r.id??r.name),name:r.name.split(' · ')[0].split(' — ')[0]||r.name,kind:typeof r.label==='string'&&r.label?r.label:typeof r.kind==='string'?r.kind:'',distance:d,direction:placed?direction(r.x-home.x,r.y-home.y):'',sighted,state,nest,lot,detail});
  }
  if(items.length){items.sort((a,b)=>a.distance-b.distance||(a.id<b.id?-1:1));return{source:'remarkable',title:'Premiers lieux remarquables',items:items.slice(0,RULES.places)};}
  // Sans module de lieux remarquables : les premières agglomérations d'importance (bourg et au-delà), à défaut toutes.
  const large=dense.all.filter(t=>(TOWN_RANK[t.kind]||0)>=3),pool=large.length?large:dense.all;
  const towns=pool.slice(0,RULES.places).map(t=>({id:String(t.id),name:t.name,kind:TOWN_NAMES[t.kind]||'',distance:t.distance,direction:t.direction}));
  return towns.length?{source:'towns',title:large.length?'Premières grandes agglomérations':'Premières agglomérations',items:towns}:{source:'none',title:'',items:[]};
 }
 // Milieu qui compte : famille figée de la campagne, avec son avantage et sa contrainte chiffrés. `source` vaut
 // `{active,profile}` ; une campagne d'avant la règle (inactive) ou une lecture sans module n'affiche aucun effet.
 function milieu(source){
  const none={active:false,family:null,name:'',bonus:null,malus:null,text:''};
  if(!source||source.active!==true)return none;
  const p=source.profile,side=e=>e&&typeof e.key==='string'&&finite(e.factor)&&typeof e.text==='string'?{key:e.key,factor:e.factor,text:e.text,percent:(e.factor>=1?'+':'−')+Math.round(Math.abs(e.factor-1)*100)+' %'}:null;
  const bonus=side(p?.bonus),malus=side(p?.malus);
  if(!p||typeof p.family!=='string'||!bonus||!malus)return{...none,active:true,text:'Aucun milieu marqué autour de D-17 : rendements inchangés.'};
  return{active:true,family:p.family,name:String(p.name),bonus,malus,text:p.name+' : '+bonus.text+', '+malus.text+'.'};
 }
 // Conseil d'ouverture : d'abord les effets réels du milieu, puis une ou deux phrases qui relient les faits relevés.
 // Aucun adjectif n'est accordé avec un nom de milieu : les phrases ont leur propre sujet.
 function advice(card){
  const o=card.opening,m=card.milieu,first=[],lines=[];
  if(m.family)first.push(m.name+' : '+(EFFECT_NAMES[m.bonus.key]||m.bonus.key)+' '+m.bonus.percent+', '+(EFFECT_NAMES[m.malus.key]||m.malus.key)+' '+m.malus.percent+' — '+(BONUS_HINTS[m.bonus.key]||'profitez-en')+', '+(MALUS_HINTS[m.malus.key]||'compensez')+'.');
  const far=key=>{const q=card.sources[key];return q?SOURCE_NAMES[key]+' est à '+distanceText(q.distance)+(q.direction?' '+q.direction:''):'';};
  if(o.known){
   const rare=OPENING.filter(key=>o[key].level==='scarce'),has=key=>!rare.includes(key),tail=key=>far(key)?' : '+far(key):'';
   const few=key=>(o[key].count?'Peu de ':key==='wood'?'Aucun ':'Aucune ')+o.labels[key]+' à portée de marche';
   // Sans effet de milieu, le conseil dit lui-même par quoi ouvrir ; avec, la première phrase l'a déjà dit.
   if(rare.includes('stone'))lines.push(few('stone')+(tail('stone')||' : la carrière sera loin')+(has('wood')&&!m.family?' ; ouvrez en bois.':'.'));
   if(rare.includes('wood'))lines.push(few('wood')+tail('wood')+(has('stone')?' ; la pierre, elle, est sur place.':'.'));
   if(rare.includes('scrap')&&lines.length<2)lines.push(few('scrap')+tail('scrap')+'.');
   if(!rare.length)lines.push('Bois, pierre et ferraille à portée de marche'+(m.family?'.':' : l’ouverture est libre.'));
  }
  if(lines.length<2&&card.water.known&&card.water.none)lines.push('Aucune eau proche : rives et pêche demandent une longue sortie.');
  if(lines.length<2&&card.density.level==='isole')lines.push('Aucune agglomération à moins de '+distanceText(RULES.townWide)+' : la récupération se paie en longues sorties.');
  if(lines.length<2&&card.density.level==='urbain')lines.push('Agglomérations toutes proches : la récupération est à courte sortie.');
  if(lines.length<2&&card.water.known&&!card.water.none&&card.water.river&&card.water.river.distance<=RULES.waterNear)lines.push('Une rivière coule à '+distanceText(card.water.river.distance)+' de l’enceinte.');
  return[...first,...lines];
 }
 // Fonction pure : mêmes données générées, même fiche. Elle ne garde aucune référence au monde.
 function describe(input){
  const C=core(),world=input?.world||null,seed=input?.seed??world?.seed;
  const h=world?.home&&finite(world.home.x)&&finite(world.home.y)?{x:world.home.x,y:world.home.y}:{x:0,y:0};
  const landscape=input?.landscape??world?.landscape189??null,preset=landscape&&C?.Landscape189Rules?.presets?.[landscape];
  const card={seed,generation:world?.generation??null,profile:preset?{id:landscape,name:preset.name}:null,home:h};
  card.biomes=biomes(world,h);card.water=water(world,h);card.density=density(world,h);card.opening=opening(input?.nodes,C);card.sources=sources(world,h);
  // Aperçu avant le départ : la carte locale de D-17 n'existe pas encore, ses gisements ne peuvent pas être comptés.
  card.preview=input?.preview===true;
  if(card.preview&&!card.opening.known)card.opening.text='Gisements à portée du centre : relevés au départ seulement, la carte locale de D-17 n’est tracée qu’au lancement.';
  card.milieu=milieu(input?.milieu);
  card.places=places(input?.remarkable,card.density,h,C,!card.preview);
  delete card.density.all;
  card.adviceLines=advice(card);card.advice=card.adviceLines.join(' ');
  const detail=p=>[p.kind,p.detail].filter(Boolean).join(', ');
  const placeText=card.places.items.map(p=>p.name+(detail(p)?' ('+detail(p)+')':'')+' à '+distanceText(p.distance)+(p.direction?' '+p.direction:'')).join(' · ');
  card.lines=[['Milieu',card.biomes.text]];
  if(card.milieu.text)card.lines.push(['Effet du milieu',card.milieu.text]);
  card.lines.push(['Eau',card.water.text],['Densité',card.density.text],['Ouverture',card.opening.text]);
  if(placeText)card.lines.push([card.places.title,placeText+'.']);
  card.summary=[card.biomes.known?lower(card.biomes.dominant.name):null,card.water.known?(card.water.none?'aucune eau proche':card.water.river&&card.water.river.distance<=RULES.waterNear?'rivière à '+distanceText(card.water.river.distance):card.water.nearest?card.water.nearest.name+' à '+distanceText(card.water.nearest.distance):'côte à '+distanceText(card.water.coast?.distance)):null,card.density.word].filter(Boolean).join(' · ');
  card.title=(card.preview?'Aperçu · ':'')+'Graine '+seed+(card.profile?' · '+card.profile.name:'');
  card.share=['DEADWALL — '+card.title,...card.lines.map(([label,text])=>label+' : '+text),...(card.advice?['Conseil : '+card.advice]:[])].join('\n');
  return freeze(card);
 }
 // Lecture de la partie en cours. `g.frontier.world()` rend la région que le jeu trace déjà dès la première image.
 function inputs(g){
  const world=g?.frontier?.world?.()||null;
  // Lieux remarquables : la liste entière avec ses coordonnées (la fiche mesure elle-même depuis le centre de la cité) ;
  // à défaut, le plus proche. Une campagne sans lieux remarquables rend une liste vide : la fiche nomme les agglomérations.
  let remarkable=null;
  try{const l=g.remarkable217?.list?.();remarkable=Array.isArray(l)&&l.length?l:null;if(!remarkable){const r=g.remarkable217?.nearest?.();remarkable=Array.isArray(r)?r:r&&typeof r==='object'?[r]:null;}}catch{remarkable=null;}
  // Milieu : la famille figée de la campagne. Inactif (ancienne campagne) ou absent : aucun effet affiché.
  // La fiche lit l'état sans le faire avancer : `profile()` figerait la famille au premier appel, parfois sur une région
  // encore provisoire en plein départ. Tant que le relevé n'a pas eu lieu, elle applique le même relevé pur à la région lue.
  let milieu={active:false,profile:null};
  try{
   if(g.biome217?.active?.()===true){
    const B=root.DeadwallBiome217,family=typeof g.biome217.snapshot==='function'?g.biome217.snapshot().family:undefined;
    milieu={active:true,profile:family===undefined||!B?g.biome217.profile():family===null?B.profileFor(world):B.describe(family)};
   }
  }catch{milieu={active:false,profile:null};}
  const nodes=g?.world?.nodes;
  return{seed:g?.world?.seed,world,landscape:world?.landscape189||'classic',nodes:nodes?[...(typeof nodes.values==='function'?nodes.values():nodes)]:[],remarkable,milieu};
 }
 // Arguments de départ lus au menu, comme `requestNewGame` (src/game.js) les passe à `startNew`.
 function startChoice(doc){
  let current=true;try{current=root.DeadwallPlayerMenus194?.currentStart?.()!==false;}catch{current=true;}
  return{seedText:String(doc?.getElementById?.('mapSeed')?.value||''),landscape:doc?.getElementById?.('worldLandscape189')?.value||'balanced',current};
 }
 // Région qu'un départ tracerait pour cette graine. Les versions viennent de la fonction que le départ réel appelle ;
 // la création reprend les options de `src/frontier.js`. Rien n'est écrit ailleurs que dans l'objet rendu.
 function previewWorld(seed,landscape='classic',current=true,recipe){
  const C=core(),Pack=need('DeadwallWorldPack131','./world-pack131.js'),World=need('DeadwallFrontierWorld','./frontier-world.js');
  if(!C?.Frontier||typeof Pack?.startVersions!=='function'||typeof World?.create!=='function')throw Error('Aperçu indisponible : génération de région absente.');
  // Même point de départ que le départ réel : le registre régional neuf, normalisé comme à sa sérialisation.
  const v=Pack.startVersions(C.Frontier.normalize(C.Frontier.initial()),recipe,current,landscape);
  return World.create(seed,v.generation,{detailVersion:v.detailVersion,ecologyVersion:v.ecologyVersion,hydrologyVersion:v.hydrologyVersion,...(v.landscape189?{landscape189:v.landscape189}:{})});
 }
 // Fiche d'une graine sans campagne : fonction pure de la graine, du profil de paysage et du contenu de départ.
 // Un départ au menu ouvre toujours une campagne neuve : milieu de la cité et lieux remarquables y sont actifs.
 function preview(choice){
  const seed=need('DeadwallProfile','./profile.js').normalizeSeed(choice?.seed??choice?.seedText);
  if(seed===null)throw new RangeError('Saisissez ou tirez une graine pour en voir l’aperçu.');
  const world=previewWorld(seed,choice?.landscape??'classic',choice?.current!==false,choice?.recipe);
  const Biome=need('DeadwallBiome217','./biome217.js'),Remarkable=need('DeadwallRemarkable217','./remarkable217.js');
  return describe({seed,world,landscape:world.landscape189||'classic',preview:true,remarkable:Remarkable?.select?Remarkable.select(world):null,
   milieu:Biome?.profileFor?{active:true,profile:Biome.profileFor(world)}:null});
 }
 // Service d'aperçu dans un Web Worker : une demande `{id,choice}`, une réponse `{id,card}` ou `{id,error}`.
 // Les scripts de génération ne sont chargés qu'à la première demande. Aucun accès au jeu, au DOM ni au stockage.
 function serve(scope){
  let loaded=false;
  scope.onmessage=event=>{
   const id=event?.data?.id;
   try{
    if(!loaded){scope.importScripts(...WORKER_SCRIPTS);loaded=true;}
    scope.postMessage({id,card:preview(event.data.choice)});
   }catch(error){scope.postMessage({id,error:String(error?.message||error),unloaded:!loaded});}
  };
  return true;
 }
 // Lieux repérés et leur état, pour la clé de cache : la fiche du carnet suit le repérage, le nid vidé, le lot chargé.
 // Tant que la région n'est pas tracée, rien n'est lu : la clé ne déclenche jamais un tracé.
 function placesKey(g){
  try{
   if(!g?.remarkable217||typeof g.remarkable217.list!=='function')return g?.remarkable217?'1':'0';
   if(typeof g.frontier?.worldReady==='function'&&!g.frontier.worldReady())return 'attente';
   return '1:'+g.remarkable217.list().filter(v=>v?.sighted===true).map(v=>v.id+'/'+(v.state||'')+'/'+(v.reward?.left??'')).join(',');
  }catch{return '1';}
 }
 // État du milieu pour la clé de cache : inactif, relevé en attente, ou famille figée.
 function biomeKey(g){try{return g?.biome217?.active?.()===true?String(g.biome217.snapshot?.().family??'attente'):'0';}catch{return '0';}}
 function keyOf(g){
  const p=g?.frontier?.position?.()||{};
  return [g?.world?.seed,p.generation,p.detailVersion,p.ecologyVersion,p.hydrologyVersion,p.landscape189||'classic',g?.world?.cityGeometry202||0,placesKey(g),biomeKey(g)].join('|');
 }
 // Presse-papiers : l'API moderne, puis l'ancienne commande, puis un simple « faux » si rien n'existe.
 function copyText(text,doc){
  const legacy=()=>{
   try{
    if(typeof doc?.createElement!=='function'||typeof doc.execCommand!=='function'||!doc.body)return false;
    const area=doc.createElement('textarea');area.value=text;area.setAttribute?.('readonly','');if(area.style){area.style.position='fixed';area.style.opacity='0';}
    doc.body.appendChild(area);area.select?.();const ok=doc.execCommand('copy')===true;area.remove?.();return ok;
   }catch{return false;}
  };
  try{const clip=root.navigator?.clipboard;if(typeof clip?.writeText==='function')return Promise.resolve(clip.writeText(text)).then(()=>true,legacy);}catch{/* repli ci-dessous */}
  return Promise.resolve(legacy());
 }
 // `env` (facultatif) : classe de worker et adresse du script, pour les essais ; sinon ceux de la page.
 function install(g,doc,env){
  if(!g||!doc?.body||g.seedCard217)return false;
  const WorkerClass=env?.Worker||root.Worker,workerUrl=env?.url||ownUrl;
  const field=doc.getElementById('commandPanel-field'),nav=field?.querySelector?.('.field-nav');if(!field||!nav)return false;
  const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
  const write=(node,text)=>{const value=String(text);if(node.textContent!==value)node.textContent=value;};
  // Un `aside`, pas une `section` : les dossiers masquent toutes les sections sœurs à chaque changement d'onglet.
  const box=el('aside',undefined,'seed-card217');box.id='seedCard217';box.setAttribute('aria-label','Fiche de graine de la carte');
  // Repliée par défaut : une ligne sous les échelles, pour ne pas repousser le dossier ouvert.
  const fold=el('details'),line=el('summary'),title=el('strong'),brief=el('span');
  fold.id='seedCard217Details';title.id='seedCard217Title';brief.id='seedCard217Summary';
  line.append(el('small','FICHE DE GRAINE'),title,brief);
  const head=el('div',undefined,'seed-card217-head'),copySeed=el('button','Copier la graine'),copyCard=el('button','Copier la fiche'),status=el('span',undefined,'seed-card217-status');
  copySeed.id='seedCard217Copy';copySeed.type='button';copyCard.id='seedCard217CopyCard';copyCard.type='button';status.id='seedCard217Status';status.setAttribute('role','status');
  head.append(copySeed,copyCard,status);
  const list=el('dl');list.id='seedCard217Facts';
  const tip=el('p',undefined,'seed-card217-advice');tip.id='seedCard217Advice';
  const NOTE='La graine recrée la carte, pas le combat. Même graine et même profil de paysage : même monde.';
  const note=el('p',NOTE,'seed-card217-note');note.id='seedCard217Note';
  fold.append(line,head,list,tip,note);
  box.append(fold);
  const anchor=doc.getElementById('explorationScales')||nav;
  // Certains environnements minimaux n'offrent ni `after` ni `insertBefore` : la fiche se place alors en fin de panneau.
  if(typeof anchor.after==='function')anchor.after(box);else if(typeof field.insertBefore==='function')field.insertBefore(box,anchor.nextSibling||null);else field.appendChild(box);
  // Résumé d'une ligne sous le champ de graine du menu : il décrit la carte en cours, jamais une graine inconnue.
  const hint=doc.getElementById('seedHint'),input=doc.getElementById('mapSeed');let menu=null;
  if(hint){
   menu=el('p',undefined,'seed-hint seed-card217-menu');menu.id='seedCard217Menu';menu.hidden=true;
   if(typeof hint.after==='function')hint.after(menu);else if(typeof hint.parentNode?.insertBefore==='function')hint.parentNode.insertBefore(menu,hint.nextSibling||null);else menu=null;
  }
  // Aperçu d'une graine saisie : un bouton et un encadré sous le champ de graine. Rien n'est calculé sans clic.
  let previewButton=null,previewBox=null,previewTitle=null,previewList=null,previewTip=null,previewNote=null;
  const under=menu||hint;
  if(under&&typeof under.after==='function'){
   previewButton=el('button','Aperçu de la carte','seed-card217-preview-button');previewButton.id='seedCard217PreviewButton';previewButton.type='button';
   previewButton.title='Trace à part la région de cette graine : quelques secondes de calcul, sans créer de campagne.';
   previewBox=el('div',undefined,'seed-card217 seed-card217-preview');previewBox.id='seedCard217Preview';previewBox.hidden=true;previewBox.setAttribute('role','status');previewBox.setAttribute('aria-live','polite');
   previewTitle=el('strong');previewTitle.id='seedCard217PreviewTitle';previewList=el('dl');previewList.id='seedCard217PreviewFacts';
   previewTip=el('p',undefined,'seed-card217-advice');previewTip.id='seedCard217PreviewAdvice';previewNote=el('p',undefined,'seed-card217-note');previewNote.id='seedCard217PreviewNote';
   previewBox.append(previewTitle,previewList,previewTip,previewNote);under.after(previewBox);under.after(previewButton);
  }
  const previews=new Map();let previewBusy=null;
  const cache=new Map();
  let clock=-Infinity,shownKey='',ticks=0,started=false;
  const previewKey=c=>{const seed=root.DeadwallProfile?.normalizeSeed?.(c.seedText);return seed===null||seed===undefined?null:[seed,c.landscape,c.current?1:0].join('|');};
  function showPreview(value,message){
   if(!previewBox)return;
   previewBox.hidden=!value&&!message;write(previewTitle,value?value.title:message||'');
   previewList.replaceChildren();previewList.hidden=!value;previewTip.hidden=!value||!value.advice;previewNote.hidden=!value;
   if(!value){write(previewTip,'');write(previewNote,'');return;}
   for(const [label,text]of value.lines)previewList.append(el('dt',label),el('dd',text));
   write(previewTip,value.advice);
   write(previewNote,'Aperçu calculé sans démarrer : aucune campagne créée, aucune sauvegarde touchée. Les gisements à portée du centre ne sont relevés qu’au départ.'
    +(value.places.source==='remarkable'?' Nids et lots des lieux remarquables se découvrent en campagne, en les repérant.':'')
    +' L’aperçu ne vérifie pas la carte locale de D-17 : une carte impraticable, cas rare, est remplacée au départ par une autre graine, avec une annonce.');
  }
  // Le champ a changé : l'encadré montre l'aperçu déjà calculé pour cette graine, sinon il se retire.
  function syncPreview(){
   if(!previewBox||previewBusy)return;
   let key=null;try{key=previewKey(startChoice(doc));}catch{key=null;}
   showPreview(key&&previews.get(key)||null,'');
  }
  // Tracé dans un Web Worker quand la page en offre un et que ce script a une adresse : le menu reste utilisable.
  // Refus de la politique de sécurité (application de bureau), page d'un seul fichier, erreur de chargement ou de
  // calcul : la page trace alors elle-même, comme avant, et ne retente plus le worker après un échec de chargement.
  let workerOk=Boolean(workerUrl)&&typeof WorkerClass==='function',job=null,jobs=0,lastMode='';
  function inWorker(choice){
   return new Promise((resolve,reject)=>{
    let worker=null;const id=++jobs;
    const end=(fn,value)=>{if(!job||job.id!==id)return;job=null;try{worker?.terminate?.();}catch{/* déjà arrêté */}fn(value);};
    try{worker=new WorkerClass(workerUrl);}catch(error){workerOk=false;reject(error);return;}
    job={id,cancel:()=>end(reject,Error('annulé'))};
    worker.onmessage=event=>{const d=event?.data;if(!d||d.id!==id)return;if(d.card&&typeof d.card==='object')end(resolve,freeze(d.card));else{if(d.unloaded)workerOk=false;end(reject,Error(d.error||'worker'));}};
    // Erreur de script ou de chargement : ce worker ne servira pas davantage.
    worker.onerror=event=>{event?.preventDefault?.();workerOk=false;end(reject,Error('worker indisponible'));};
    try{worker.postMessage({id,choice:{seedText:choice.seedText,landscape:choice.landscape,current:choice.current}});}catch(error){workerOk=false;end(reject,error);}
   });
  }
  // Calcul sur demande : une seule région à la fois, un résultat gardé par graine, profil et contenu de départ.
  function runPreview(){
   if(previewBusy)return previewBusy;
   const choice=startChoice(doc);let key;
   try{key=previewKey(choice);}catch(error){showPreview(null,error.message);return Promise.resolve(null);}
   if(key===null){showPreview(null,'Saisissez ou tirez une graine pour en voir l’aperçu.');return Promise.resolve(null);}
   const known=previews.get(key);if(known){showPreview(known,'');return Promise.resolve(known);}
   const label='Calcul en cours… la région de la graine '+choice.seedText.trim()+' est tracée, quelques secondes.';
   if(previewButton){previewButton.disabled=true;previewButton.setAttribute('aria-busy','true');}
   const later=typeof root.setTimeout==='function'?fn=>root.setTimeout(fn,RULES.previewDelayMs):fn=>fn();
   let cancelled=false;
   const finish=(resolve,value,failure)=>{
    if(value){previews.set(key,value);if(previews.size>RULES.cache)previews.delete(previews.keys().next().value);}
    previewBusy=null;
    if(previewButton){previewButton.disabled=false;previewButton.removeAttribute?.('aria-busy');}
    // Le joueur a pu changer la graine pendant le calcul : l'encadré suit le champ, le résultat reste en cache.
    let now=null;try{now=previewKey(startChoice(doc));}catch{now=null;}
    if(cancelled||value&&now!==key)syncPreview();else showPreview(value,failure);
    resolve(value);
   };
   // Repli : tracé sur le fil principal. Le délai laisse l'écran afficher l'avertissement avant que le menu se fige.
   const direct=resolve=>{
    lastMode='direct';
    showPreview(null,label+' Le menu ne répond pas pendant ce calcul.');
    later(()=>{
     let value=null,failure='';
     try{value=preview(choice);}catch(error){failure='Aperçu impossible : '+(error?.message||'erreur de génération')+'.';}
     finish(resolve,value,failure);
    });
   };
   previewBusy=new Promise(resolve=>{
    if(!workerOk){direct(resolve);return;}
    lastMode='worker';
    showPreview(null,label+' Le menu reste utilisable.');
    inWorker(choice).then(value=>finish(resolve,value,''),()=>{
     // Départ ou reprise pendant le calcul : l'aperçu est abandonné, rien n'est retracé.
     if(cancelled)finish(resolve,null,'');else direct(resolve);
    });
    cancelPreview=()=>{cancelled=true;job?.cancel();};
   });
   return previewBusy;
  }
  let cancelPreview=()=>{};
  previewButton?.addEventListener?.('click',()=>{runPreview();});
  doc.getElementById('worldLandscape189')?.addEventListener?.('change',()=>{syncPreview();});
  function card(){
   const key=keyOf(g);let value=cache.get(key);
   if(!value){
    value=describe(inputs(g));cache.set(key,value);
    if(cache.size>RULES.cache)cache.delete(cache.keys().next().value);
   }
   return value;
  }
  // Visible en partie, dans le classement « Sur le terrain » du carnet (toujours dans l'atelier auteur, qui n'a pas de classement).
  function visible(){const view=g.playerMenus194?.view?.();return g.state==='playing'&&!g.gameOver&&(!view||view.domain==='terrain'&&!view.maintenance);}
  function render(){
   const shown=visible();box.hidden=!shown;if(!shown)return false;
   const key=keyOf(g);if(key===shownKey)return true;
   const value=card();shownKey=key;
   write(title,value.title);write(brief,value.summary);write(tip,value.advice);tip.hidden=!value.advice;write(status,'');
   write(note,NOTE+(value.places.source==='remarkable'?' Le nid et le lot d’un lieu remarquable s’affichent une fois le lieu repéré.':''));
   list.replaceChildren();
   for(const [label,text]of value.lines)list.append(el('dt',label),el('dd',text));
   return true;
  }
  function renderMenu(){
   if(!menu)return false;
   const value=started&&g.state==='menu'?cache.get(keyOf(g)):null,typed=String(input?.value||'').trim();
   const show=Boolean(value)&&(!typed||typed===String(value.seed));
   menu.hidden=!show;
   if(show)write(menu,'Carte en cours — graine '+value.seed+(value.profile?' ('+value.profile.name+')':'')+' : '+value.summary+'. Saisissez cette graine avec le même profil pour la retrouver.');
   return show;
  }
  function copy(kind){
   let value;try{value=card();}catch{value=null;}
   if(!value)return Promise.resolve(false);
   const text=kind==='card'?value.share:String(value.seed);
   return copyText(text,doc).then(ok=>{write(status,ok?(kind==='card'?'Fiche copiée.':'Graine copiée.'):'Copie impossible ici : notez la graine '+value.seed+'.');return ok;});
  }
  copySeed.addEventListener?.('click',()=>{copy('seed');});
  copyCard.addEventListener?.('click',()=>{copy('card');});
  input?.addEventListener?.('input',()=>{renderMenu();syncPreview();});
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){
   const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;
   if(g.state==='playing')ticks++;
   if(now<clock||now-clock>=RULES.refreshSeconds||visible()===box.hidden){clock=now;render();}
   return result;
  };
  for(const name of ['showCommand','startNew','restoreSave']){
   const old=g[name];if(typeof old!=='function')continue;
   g[name]=function(...args){
    const result=old.apply(this,args);
    if(name!=='showCommand'&&result!==false){started=true;ticks=0;shownKey='';if(job)cancelPreview();}
    clock=Number(g.elapsed)||0;render();renderMenu();if(name!=='showCommand')syncPreview();return result;
   };
  }
  // Au retour au menu, la fiche n'est établie que si la partie a tourné : la région existe alors déjà.
  const back=g.returnToMenu;
  if(typeof back==='function')g.returnToMenu=function(...args){
   if(started&&ticks>=2&&g.state==='playing'){try{card();}catch{/* le menu se passe du résumé */}}
   const result=back.apply(this,args);box.hidden=true;renderMenu();return result;
  };
  // Un changement d'onglet ou de classement doit rafraîchir la visibilité sans attendre l'horloge.
  field.addEventListener?.('click',()=>render());
  g.seedCard217=Object.freeze({render,card,copy,key:()=>keyOf(g),menu:renderMenu,preview:runPreview,previewBusy:()=>Boolean(previewBusy),previewCount:()=>previews.size,previewMode:()=>lastMode});
  render();return true;
 }
 return Object.freeze({install,describe,inputs,preview,previewWorld,startChoice,distanceText,direction,copyText,serve,RULES,WORKER_SCRIPTS});
});
