// Fiche de graine (docs/GAME_BIBLE.md §7.13, « des graines qui comptent ») : ce que la graine fixe autour de D-17.
// Présentation seulement : ce module lit le monde déjà généré (région, rivières, côte, agglomérations, gisements du site).
// Il ne modifie aucun stock, aucune règle, aucun tirage, aucune version de génération et aucune sauvegarde.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallSeedCard217=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
 // Seuils de lecture seulement : aucun système de jeu ne les consulte. Distances régionales en mètres ;
 // `walkRadius` est en unités du site de D-17 (32 unités par mètre).
 const RULES=freeze({
  biomeRings:[[0,1],[400,8],[800,12],[1200,16],[1600,20]],biomeMinShare:.05,biomeOthers:3,
  waterNear:1500,townNear:2000,townWide:3000,placeRadius:1500,
  walkRadius:900,scarce:5,plenty:15,places:3,cache:8,refreshSeconds:.5
 });
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
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
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
 function places(remarkable,dense,home){
  const items=[];
  if(Array.isArray(remarkable))for(const r of remarkable){
   if(!r||typeof r.name!=='string')continue;
   const d=finite(r.distance)?r.distance:finite(r.x)&&finite(r.y)?Math.hypot(r.x-home.x,r.y-home.y):NaN;if(!finite(d))continue;
   items.push({id:String(r.id??r.name),name:r.name,kind:typeof r.kind==='string'?r.kind:'',distance:d,direction:finite(r.x)&&finite(r.y)?direction(r.x-home.x,r.y-home.y):''});
  }
  if(items.length){items.sort((a,b)=>a.distance-b.distance||(a.id<b.id?-1:1));return{source:'remarkable',title:'Premiers lieux remarquables',items:items.slice(0,RULES.places)};}
  // Sans module de lieux remarquables : les premières agglomérations d'importance (bourg et au-delà), à défaut toutes.
  const large=dense.all.filter(t=>(TOWN_RANK[t.kind]||0)>=3),pool=large.length?large:dense.all;
  const towns=pool.slice(0,RULES.places).map(t=>({id:String(t.id),name:t.name,kind:TOWN_NAMES[t.kind]||'',distance:t.distance,direction:t.direction}));
  return towns.length?{source:'towns',title:large.length?'Premières grandes agglomérations':'Premières agglomérations',items:towns}:{source:'none',title:'',items:[]};
 }
 // Conseil d'ouverture : une ou deux phrases qui ne font que relier les faits relevés ci-dessus.
 function advice(card){
  const o=card.opening,lines=[],milieu=card.biomes.known?card.biomes.dominant.name:'Site';
  const far=key=>{const q=card.sources[key];return q?SOURCE_NAMES[key]+' est à '+distanceText(q.distance)+(q.direction?' '+q.direction:''):'';};
  if(o.known){
   const rare=OPENING.filter(key=>o[key].level==='scarce'),has=key=>!rare.includes(key),tail=key=>far(key)?' : '+far(key):'';
   if(rare.includes('stone'))lines.push(milieu+(o.stone.count?' pauvre en pierre':' sans pierre')+' à portée'+(tail('stone')||' : la carrière sera loin')+(has('wood')?' ; ouvrez en bois.':'.'));
   if(rare.includes('wood'))lines.push((lines.length?'Peu de bois':milieu+' pauvre en bois')+' à portée'+tail('wood')+(has('stone')?' ; la pierre, elle, est sur place.':'.'));
   if(rare.includes('scrap')&&lines.length<2)lines.push((lines.length?'Peu de ferraille':milieu+' pauvre en ferraille')+' à portée'+tail('scrap')+'.');
   if(!rare.length)lines.push(milieu+' : bois, pierre et ferraille à portée de marche, l’ouverture est libre.');
  }
  if(lines.length<2&&card.water.known&&card.water.none)lines.push('Aucune eau proche : rives et pêche demandent une longue sortie.');
  if(lines.length<2&&card.density.level==='isole')lines.push('Aucune agglomération à moins de '+distanceText(RULES.townWide)+' : la récupération se paie en longues sorties.');
  if(lines.length<2&&card.density.level==='urbain')lines.push('Agglomérations toutes proches : la récupération est à courte sortie.');
  if(lines.length<2&&card.water.known&&!card.water.none&&card.water.river&&card.water.river.distance<=RULES.waterNear)lines.push('Une rivière coule à '+distanceText(card.water.river.distance)+' de l’enceinte.');
  return lines.join(' ');
 }
 // Fonction pure : mêmes données générées, même fiche. Elle ne garde aucune référence au monde.
 function describe(input){
  const C=core(),world=input?.world||null,seed=input?.seed??world?.seed;
  const h=world?.home&&finite(world.home.x)&&finite(world.home.y)?{x:world.home.x,y:world.home.y}:{x:0,y:0};
  const landscape=input?.landscape??world?.landscape189??null,preset=landscape&&C?.Landscape189Rules?.presets?.[landscape];
  const card={seed,generation:world?.generation??null,profile:preset?{id:landscape,name:preset.name}:null,home:h};
  card.biomes=biomes(world,h);card.water=water(world,h);card.density=density(world,h);card.opening=opening(input?.nodes,C);card.sources=sources(world,h);
  card.places=places(input?.remarkable,card.density,h);
  delete card.density.all;
  card.advice=advice(card);
  const placeText=card.places.items.map(p=>p.name+(p.kind?' ('+p.kind+')':'')+' à '+distanceText(p.distance)+(p.direction?' '+p.direction:'')).join(' · ');
  card.lines=[['Milieu',card.biomes.text],['Eau',card.water.text],['Densité',card.density.text],['Ouverture',card.opening.text]];
  if(placeText)card.lines.push([card.places.title,placeText+'.']);
  card.summary=[card.biomes.known?lower(card.biomes.dominant.name):null,card.water.known?(card.water.none?'aucune eau proche':card.water.river&&card.water.river.distance<=RULES.waterNear?'rivière à '+distanceText(card.water.river.distance):card.water.nearest?card.water.nearest.name+' à '+distanceText(card.water.nearest.distance):'côte à '+distanceText(card.water.coast?.distance)):null,card.density.word].filter(Boolean).join(' · ');
  card.title='Graine '+seed+(card.profile?' · '+card.profile.name:'');
  card.share=['DEADWALL — '+card.title,...card.lines.map(([label,text])=>label+' : '+text),...(card.advice?['Conseil : '+card.advice]:[])].join('\n');
  return freeze(card);
 }
 // Lecture de la partie en cours. `g.frontier.world()` rend la région que le jeu trace déjà dès la première image.
 function inputs(g){
  const world=g?.frontier?.world?.()||null;
  let remarkable=null;
  try{const r=g.remarkable217?.nearest?.();remarkable=Array.isArray(r)?r:r&&typeof r==='object'?[r]:null;if(!remarkable?.length){const l=g.remarkable217?.list?.();remarkable=Array.isArray(l)?l:null;}}catch{remarkable=null;}
  const nodes=g?.world?.nodes;
  return{seed:g?.world?.seed,world,landscape:world?.landscape189||'classic',nodes:nodes?[...(typeof nodes.values==='function'?nodes.values():nodes)]:[],remarkable};
 }
 function keyOf(g){
  const p=g?.frontier?.position?.()||{};
  return [g?.world?.seed,p.generation,p.detailVersion,p.ecologyVersion,p.hydrologyVersion,p.landscape189||'classic',g?.world?.cityGeometry202||0,g?.remarkable217?1:0].join('|');
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
 function install(g,doc){
  if(!g||!doc?.body||g.seedCard217)return false;
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
  fold.append(line,head,list,tip,el('p','La graine recrée la carte, pas le combat. Même graine et même profil de paysage : même monde.','seed-card217-note'));
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
  const cache=new Map();
  let clock=-Infinity,shownKey='',ticks=0,started=false;
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
  input?.addEventListener?.('input',()=>{renderMenu();});
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
    if(name!=='showCommand'&&result!==false){started=true;ticks=0;shownKey='';}
    clock=Number(g.elapsed)||0;render();renderMenu();return result;
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
  g.seedCard217=Object.freeze({render,card,copy,key:()=>keyOf(g),menu:renderMenu});
  render();return true;
 }
 return Object.freeze({install,describe,inputs,distanceText,direction,copyText,RULES});
});
