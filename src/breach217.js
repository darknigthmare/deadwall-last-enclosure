/* Brèche catastrophe (docs/GAME_BIBLE.md §8.6), première tranche, pour les NOUVELLES campagnes seulement.
   - Pan menacé : une suite droite d'ouvrages de mur contigus (même rangée ou même colonne de cases), tous en service
     et tous sous le seuil de fragilité de `C.BATTLEFIELD_RULES`. À partir de `minLength` ouvrages, le pan est annoncé
     une fois et exposé par `threatened()`. Réparer un seul ouvrage au-dessus du seuil rompt le pan.
   - Rupture : quand un ouvrage d'un pan déjà relevé est détruit par le chemin ordinaire, les autres ouvrages du pan
     cèdent dans le même instant, chacun par `g.destroyBuilding`, `maxCollapse` ouvrages au plus.
   Ce module n'inflige aucun dégât, ne tire aucun hasard et ne crée rien : il ne fait tomber que des ouvrages déjà
   fragiles, par la destruction du jeu. Une campagne commencée avant cette règle garde la chute ouvrage par ouvrage. */
(function(root){'use strict';
 const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=need('DeadwallCore','./core.js'),T=need('DeadwallTactics','./tactics.js'),B=need('DeadwallBattlefield','./battlefield.js');
 const R=C.Breach217Rules,RATIO=C.BATTLEFIELD_RULES.fragileWallRatio;
 // Réglages techniques, sans effet sur l'équilibrage : cadence du relevé, silence entre deux annonces de menace
 // d'un même côté, nombre d'ouvrages de mur examinés par relevé.
 const CHECK_SECONDS=.5,QUIET_SECONDS=10,SCAN_LIMIT=8192,RUPTURE_MEMORY=256;
 const DECISIONS=Object.freeze([['hold','Tenir'],['evacuate','Évacuer'],['sacrifice','Sacrifier']]);
 const KEYS=['version','active'],SIDES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'}),SIDE_IDS=Object.keys(SIDES);
 function initial(){return{version:1,active:false};}
 function fresh(){return{version:1,active:true};}
 function validate(raw){
  if(raw===undefined)return initial();
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k)))throw Error('Brèche 217 invalide.');
  return{version:1,active:raw.active};
 }
 // Même critère que le décompte des murs fragiles du champ de bataille : un ouvrage de mur achevé, debout, sous le seuil.
 const wall=b=>Boolean(b&&b.def?.wall&&b.type!=='core'&&T.operational(b));
 const fragile=b=>wall(b)&&b.health/b.maxHealth<=RATIO;
 const many=n=>n+' ouvrage'+(n>1?'s':'');
 // Relevé des pans menacés. Un ouvrage large d'une case en hauteur peut tenir dans un pan horizontal, un ouvrage
 // large d'une case en largeur dans un pan vertical : un mur d'angle peut donc appartenir à deux pans, un par ligne,
 // mais un pan ne tourne jamais le coin. Deux ouvrages sont voisins quand leurs emprises se touchent par un côté
 // le long de la ligne ; une diagonale ou une case vide coupe le pan, comme un ouvrage sain ou inachevé.
 function survey(buildings,core){
  const rows=[],columns=[];let examined=0;
  for(const b of buildings){
   if(!wall(b))continue;
   if(++examined>SCAN_LIMIT)break;
   if(!fragile(b))continue;
   const f=T.footprint(b);if(!f)continue;
   if(f.height===1)rows.push({b,f});
   if(f.width===1)columns.push({b,f});
  }
  const pans=[];
  const close=(axis,run)=>{
   if(run.length<R.minLength)return;
   const members=run.map(item=>item.b),first=run[0].f,last=run[run.length-1].f;
   const x=members.reduce((n,b)=>n+b.x,0)/members.length,y=members.reduce((n,b)=>n+b.y,0)/members.length;
   const side=core?(B?.direction||sideOf)(core,{x,y}):'north',gates=members.filter(b=>T.isGate(b)).length;
   pans.push({key:axis+':'+first.x+':'+first.y,axis,side,name:SIDES[side],length:members.length,gates,members,
    cells:{x:first.x,y:first.y,width:axis==='row'?last.x+last.width-first.x:1,height:axis==='row'?1:last.y+last.height-first.y}});
  };
  const scan=(axis,list)=>{
   const along=axis==='row'?'x':'y',across=axis==='row'?'y':'x',span=axis==='row'?'width':'height';
   list.sort((a,b)=>a.f[across]-b.f[across]||a.f[along]-b.f[along]||a.b.id-b.b.id);
   let run=[];
   for(const item of list){
    const previous=run[run.length-1];
    if(previous&&previous.f[across]===item.f[across]&&previous.f[along]+previous.f[span]===item.f[along])run.push(item);
    else{close(axis,run);run=[item];}
   }
   close(axis,run);
  };
  scan('row',rows);scan('column',columns);
  return pans.sort((a,b)=>SIDE_IDS.indexOf(a.side)-SIDE_IDS.indexOf(b.side)||a.cells.y-b.cells.y||a.cells.x-b.cells.x||(a.axis===b.axis?0:a.axis==='row'?-1:1));
 }
 function sideOf(core,point){const dx=point.x-core.x,dy=point.y-core.y;return Math.abs(dx)>Math.abs(dy)?(dx>=0?'east':'west'):(dy>=0?'south':'north');}
 // Ouvrages emportés avec `b`, calculés une fois, avant toute destruction. `pans` est le dernier relevé : seul un pan
 // déjà relevé (donc annoncé) peut rompre. Le pan est relu à l'instant de la chute : on avance depuis `b` de chaque
 // côté tant que l'ouvrage relevé est encore debout et fragile ; le premier ouvrage réparé, tombé ou remplacé arrête
 // le pan. Sous `minLength`, la menace est levée. Au-delà de `maxCollapse`, les ouvrages les plus proches cèdent.
 function collapse(b,pans,standing=()=>true){
  let best=null;
  for(const pan of pans){
   const at=pan.members.indexOf(b);if(at<0)continue;
   const ok=o=>!o.dead&&fragile(o)&&standing(o);
   let low=at,high=at;
   while(low>0&&ok(pan.members[low-1]))low--;
   while(high<pan.members.length-1&&ok(pan.members[high+1]))high++;
   const length=high-low+1;
   // Mur d'angle commun à deux pans : un seul cède, le plus long ; à égalité, le pan horizontal.
   if(length>=R.minLength&&(!best||length>best.length||length===best.length&&pan.axis==='row'&&best.pan.axis!=='row'))best={pan,at,low,high,length};
  }
  if(!best)return null;
  const others=[];
  for(let step=1;others.length<R.maxCollapse-1&&(best.at-step>=best.low||best.at+step<=best.high);step++){
   if(best.at-step>=best.low)others.push(best.pan.members[best.at-step]);
   if(others.length<R.maxCollapse-1&&best.at+step<=best.high)others.push(best.pan.members[best.at+step]);
  }
  return{side:best.pan.side,others};
 }
 const NATIVE=' détruit — le secteur est ouvert !';
 function install(g){
  if(g.breach217)return g.breach217;if(!g.expansions)throw Error('Installer les opérations avant la brèche 217.');
  let state=initial(),pans=[],seenWorld=null,primed=false,clock=-Infinity,busy=false,view=Object.freeze([]);
  const announced=new Set(),quiet=new Map(),ruptures=new Map();
  const forget=()=>{pans=[];seenWorld=null;primed=false;clock=-Infinity;view=Object.freeze([]);announced.clear();quiet.clear();ruptures.clear();};
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const expose=()=>Object.freeze(pans.map(pan=>Object.freeze({key:pan.key,axis:pan.axis,side:pan.side,name:pan.name,length:pan.length,gates:pan.gates,
   ids:Object.freeze(pan.members.map(b=>b.id)),cells:Object.freeze({...pan.cells})})));
  // Relevé périodique : met à jour les pans, puis annonce ceux dont aucun ouvrage n'était déjà dans un pan annoncé.
  // Un pan qui s'allonge ou deux pans qui se rejoignent ne sont pas réannoncés ; un pan levé puis reformé l'est.
  // Le premier relevé d'une campagne ouverte ou reprise se fait en silence.
  function tick(){
   if(!state.active||!playing()){if(pans.length){pans=[];view=Object.freeze([]);}return;}
   if(seenWorld!==g.world){forget();seenWorld=g.world;}
   pans=survey(g.world.buildings.values(),g.core?.());view=expose();
   const now=Number(g.elapsed)||0,current=new Set();
   for(const pan of pans){
    const known=pan.members.some(b=>announced.has(b.id));
    for(const b of pan.members)current.add(b.id);
    if(known||!primed||now<(quiet.get(pan.side)??-Infinity))continue;
    quiet.set(pan.side,now+QUIET_SECONDS);
    g.notify('Le mur '+pan.name+' menace de céder sur '+many(pan.length)+(pan.gates?', porte comprise':'')+'.','danger');
   }
   announced.clear();for(const id of current)announced.add(id);primed=true;
  }
  const destroy=g.destroyBuilding;
  g.destroyBuilding=function(b,...rest){
   // Une destruction provoquée par une rupture ne déclenche jamais de rupture : aucune réaction en chaîne.
   const plan=!busy&&state.active&&playing()&&seenWorld===g.world&&b&&!b.dead&&b.def?.wall&&b.completed&&g.world.buildings.get(b.id)===b
    ?collapse(b,pans,o=>g.world.buildings.get(o.id)===o):null;
   if(!plan)return destroy.call(g,b,...rest);
   busy=true;let fallen=0;
   const own=Object.hasOwn(g,'notify'),notify=g.notify;
   try{
    const result=destroy.call(g,b,...rest);if(b.dead)fallen++;
    // L'annonce de destruction du jeu vaut pour le premier ouvrage ; les suivants sont résumés par l'annonce de rupture.
    g.notify=function(text,...more){if(typeof text==='string'&&text.endsWith(NATIVE))return;return notify.call(g,text,...more);};
    for(const other of plan.others){
     if(g.gameOver)break;
     if(other.dead||other.type==='core'||g.world.buildings.get(other.id)!==other||!fragile(other))continue;
     g.destroyBuilding(other);if(other.dead)fallen++;
    }
    return result;
   }finally{
    if(own)g.notify=notify;else delete g.notify;
    busy=false;
    if(fallen>1&&!g.gameOver)g.notify('Rupture au '+SIDES[plan.side]+' : '+many(fallen)+' ont cédé d’un coup.','danger');
    // Mémoire courte des ouvrages tombés ensemble : le repli n'en fait qu'une brèche nommée.
    if(fallen>1)for(const o of [b,...plan.others])if(o.dead){ruptures.delete(o.id);ruptures.set(o.id,b.id);}
    while(ruptures.size>RUPTURE_MEMORY)ruptures.delete(ruptures.keys().next().value);
    if(playing()){pans=survey(g.world.buildings.values(),g.core?.());view=expose();}
   }
  };
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){
   const result=update.call(g,dt,...rest),now=Number(g.elapsed)||0;
   if(now<clock||now-clock>=CHECK_SECONDS){clock=now;tick();}
   return result;
  };
  function overview(){
   const percent=Math.round(RATIO*100)+' %';
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : ses murs tombent ouvrage par ouvrage. La règle ne s’active pas en cours de campagne.',rows:[
    {label:'Règle',value:'Sans objet : chute d’origine, un ouvrage à la fois.'},{label:'Pans menacés',value:'Sans objet.'}]};
   return{summary:'Un pan de '+R.minLength+' ouvrages de mur voisins ou plus, tous sous '+percent+' de leur solidité, cède d’un seul coup dès que l’un d’eux est détruit. Cette règle vaut pour toute la campagne et ne s’active pas en cours de campagne.',rows:[
    {label:'Règle',value:'Pan : ouvrages de mur alignés, côte à côte, portes comprises, tous sous '+percent+'. Une rupture emporte au plus '+R.maxCollapse+' ouvrages, les plus proches de celui qui tombe. Un ouvrage sain arrête le pan.'},
    {label:'Pans menacés',value:view.length?view.map(pan=>'mur '+pan.name+' : '+many(pan.length)+(pan.gates?', porte comprise':'')).join(' · '):'Aucun.'},
    {label:'Lever la menace',value:view.length?'Réparez un seul ouvrage de chaque pan au-dessus de '+percent+' : le pan est rompu, le reste tombera ouvrage par ouvrage.':'Rien à réparer d’urgence. Gardez les murs voisins au-dessus de '+percent+'.'},
    ...decision()]};
  }
  // Ligne de décision, seulement quand un pan menace un district fermé et que la cité suit des consignes.
  function decision(){
   const radio=g.cityRadio217,list=radio?.active?.()?districts():[];
   return list.length?[{label:'Décision',value:list.map(d=>d.name+' (mur '+SIDES[d.side]+') : tenir, évacuer ou sacrifier ? Consigne actuelle : '+radio.postureText(d.rank)+'.').join(' · ')}]:[];
  }
  // District de chaque pan menacé : l'enceinte fermée dont le pourtour porte ses ouvrages (src/districts.js).
  // Un pan hors de toute enceinte fermée n'est rattaché à aucun district.
  function districts(){
   if(!state.active||!view.length)return Object.freeze([]);
   let rings=[];try{rings=g.districts?.rings?.()||[];}catch(error){rings=[];}
   const found=new Map();
   for(const pan of view){
    const ring=rings.find(r=>r.works.some(w=>pan.ids.includes(w.id)));if(!ring)continue;
    const known=found.get(ring.rank);
    if(!known||pan.length>known.length)found.set(ring.rank,{rank:ring.rank,name:ring.name,side:pan.side,length:pan.length,gates:pan.gates});
   }
   return Object.freeze([...found.values()].sort((a,b)=>a.rank-b.rank).map(d=>Object.freeze(d)));
  }
  // Décision sur pan menacé : tenir, évacuer ou sacrifier le district concerné. Elle devient la consigne de ce district
  // (src/city-radio217.js), que la cité applique seule à la rupture, en présence comme en absence.
  function actions(){
   const radio=g.cityRadio217;if(!radio?.active?.()||typeof radio.setDistrictOrder!=='function')return[];
   const list=[];
   for(const d of districts())for(const [id,label]of DECISIONS){
    const q=radio.districtQuote(d.rank,id);
    list.push({id:'decide-'+d.rank+'-'+id,label:label+' : '+d.name.toLowerCase()+' (mur '+SIDES[d.side]+')',description:radio.postureHint(d.rank,id),
     disabled:!q.ok,reason:q.reason||'Devient la consigne de ce district ; la cité l’applique seule si le pan cède.',run:()=>radio.setDistrictOrder(d.rank,id)});
   }
   return list;
  }
  const api=Object.freeze({active:()=>state.active,threatened:()=>state.active?view:Object.freeze([]),districts,ruptureOf:id=>state.active&&ruptures.has(id)?ruptures.get(id):null,tick,overview,actions,snapshot:()=>validate(state)});g.breach217=api;
  g.expansions.register({id:'breach217',title:'Pans menacés',overview,actions:api.actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);forget();},reset:()=>{state=fresh();forget();}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,survey,collapse,install});root.DeadwallBreach217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
