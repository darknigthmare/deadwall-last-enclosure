// Cité autonome : radio et consignes (docs/GAME_BIBLE.md §7.15, directions 2 et 3), première tranche.
// Radio : pendant que le Commandant est hors de D-17, ce module relit des faits déjà établis par leurs
// propriétaires (phase, brèche nommée, secteur perdu, pan menacé, amas de corps, eau, moral, centre, munitions)
// et les relaie en messages datés. Lecture seule : ni stock, ni dégât, ni tirage, ni horloge.
// Consigne : choisie sur place avant de sortir, pour les NOUVELLES campagnes seulement. À la première brèche
// d'une vague, la cité donne seule l'ordre de repli choisi, par les ordres existants de `g.fallbackOrder`
// et avec leurs refus ; elle le lève quand l'assaut est terminé. Aucune règle de combat n'est ajoutée.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCityRadio217=api;
 if(root.DEADWALL)api.register(root.DEADWALL);
 if(root.document){
  const mount=()=>root.setTimeout(()=>{try{if(root.DEADWALL)api.install(root.DEADWALL,root.document);}catch(error){/* la radio ne bloque jamais le jeu */}},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CityRadio217Rules;
 // Réglages techniques, sans effet sur l'équilibrage : cadence du relevé, silence avant qu'un même fait
 // puisse être réannoncé, longueur d'un message, nombre de lignes de la vague en cours montrées en sortie.
 const CHECK_SECONDS=.5,REARM_SECONDS=60,MAX_TEXT=240,SHOWN=3,MAX_AT=1e9,MAX_WAVE=1e6;
 const SPEAKER='Sami V., répartiteur';
 const ORDERS=Object.freeze(['hold','fighters','everyone']),TONES=Object.freeze(['normal','danger','good']);
 const ORDER_NAMES=Object.freeze({hold:'Tenir la ligne',fighters:'Replier les combattants à la première brèche',everyone:'Repli général à la première brèche'});
 const ORDER_HINTS=Object.freeze({hold:'aucun ordre donné sans vous',fighters:'sections vers le centre · ouvriers inchangés',everyone:'tout le monde rentre · portes verrouillées'});
 const SIDES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'}),WHERE=Object.freeze({north:'au nord',east:'à l’est',south:'au sud',west:'à l’ouest'});
 const KEYS=['version','active','order','applied','ours','journal'],ENTRY=['at','wave','tone','text'];
 function initial(){return{version:1,active:false,order:'hold',applied:null,ours:false,journal:[]};}
 function fresh(){return{version:1,active:true,order:'hold',applied:null,ours:false,journal:[]};}
 const wave=v=>Number.isInteger(v)&&v>=0&&v<=MAX_WAVE;
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Radio 217 invalide.');};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||!ORDERS.includes(raw.order)||typeof raw.ours!=='boolean'
   ||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k))||raw.applied!==null&&!wave(raw.applied)||!Array.isArray(raw.journal)||raw.journal.length>R.journal)bad();
  // Une consigne en cours d'application suppose un ordre de repli donné à une vague connue.
  if(raw.ours&&(raw.order==='hold'||raw.applied===null))bad();
  // Une campagne sans consignes ne garde rien : sa radio reste de la présentation.
  if(!raw.active&&(raw.order!=='hold'||raw.applied!==null||raw.ours||raw.journal.length))bad();
  const journal=raw.journal.map(e=>{
   if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).length!==ENTRY.length||Object.keys(e).some(k=>!ENTRY.includes(k))||typeof e.at!=='number'||!Number.isFinite(e.at)||e.at<0||e.at>MAX_AT
    ||!wave(e.wave)||!TONES.includes(e.tone)||typeof e.text!=='string'||!e.text||e.text.length>MAX_TEXT)bad();
   return{at:e.at,wave:e.wave,tone:e.tone,text:e.text};
  });
  return{version:1,active:raw.active,order:raw.order,applied:raw.applied,ours:raw.ours,journal};
 }
 const many=(n,one,several)=>n+' '+(n>1?several:one);
 const stamp=entry=>'Vague '+entry.wave+' · '+C.formatTime(entry.at);
 const line=entry=>stamp(entry)+' — '+entry.text;
 // Relevé pur des faits en cours : clé d'épisode, niveau (une aggravation se réannonce), texte et ton.
 // Chaque valeur vient de son propriétaire ; un module absent ne produit simplement aucun fait.
 function facts(g){
  const list=[],add=(key,level,text,tone='danger')=>list.push({key,level,text,tone});
  const w=wave(g.wave)?g.wave:0;
  if(g.phase==='warning')add('front:'+w,1,'Front annoncé : la vague '+w+' approche de D-17.','normal');
  if(g.phase==='assault')add('assault:'+w,1,'Vague '+w+' : l’assaut a commencé.');
  const F=g.fallbackOrder,status=F?.status?.(),breach=status?.lastBreach;
  if(breach&&SIDES[breach.side])add('breach:'+breach.wave+':'+breach.at,1,'Brèche au '+SIDES[breach.side]+' ('+breach.name+').'+(status.closed?(status.infectedInside?' '+many(status.infectedInside,'infecté','infectés')+' dans l’enceinte intérieure.':''):' Le centre n’est plus couvert par une enceinte fermée.'));
  const night=F?.nightLog?.();
  if(night&&night.wave===g.wave){
   for(const side of night.lost)if(SIDES[side])add('lost:'+night.wave+':'+side,1,'Secteur '+SIDES[side]+' perdu : des infectés sont entrés par la brèche.');
   for(const side of night.retaken)if(SIDES[side])add('retaken:'+night.wave+':'+side,1,'Secteur '+SIDES[side]+' repris : la ligne est refermée.','good');
  }
  const pans=g.breach217?.threatened?.()||[],seen=new Set();
  for(const pan of pans){
   if(!SIDES[pan.side]||seen.has(pan.side))continue;seen.add(pan.side);
   const longest=pans.filter(p=>p.side===pan.side).reduce((a,b)=>b.length>a.length?b:a);
   add('pan:'+pan.side,1,'Le mur '+SIDES[pan.side]+' menace de céder sur '+many(longest.length,'ouvrage','ouvrages')+(longest.gates?', porte comprise':'')+'.');
  }
  const heaps=g.corpseHeaps217?.summary?.();
  if(heaps)for(const side of Object.keys(SIDES)){
   const heap=heaps[side];
   if(heap?.state==='franchi')add('heap:'+side,2,'Amas de corps '+WHERE[side]+' : des infectés franchissent '+(heap.gate?'la porte':'le mur')+'.');
   else if(heap?.state==='imminent')add('heap:'+side,1,'Amas de corps '+WHERE[side]+' : '+(heap.gate?'la porte':'le mur')+' sera bientôt franchissable.');
  }
  const water=g.cityWater215;
  if(water?.needed?.()){
   const s=water.stage();
   if(s>=6)add('water',4,'Pénurie d’eau : les plus fragiles meurent dans les murs.');
   else if(s>=4)add('water',3,'Pénurie d’eau : des ouvriers quittent la cité.');
   else if(s>=2)add('water',2,'Pénurie d’eau : le moral de la cité baisse.');
   else if(s>=1)add('water',1,'Eau : les citernes sont vides, la population se rationne.','normal');
  }
  if(g.balance217?.moraleTiers?.()&&Number(g.morale)<C.Balance217Rules.morale.depart.below)add('morale',1,'Moral au plus bas : des habitants parlent de quitter la cité.');
  const core=g.core?.();
  if(core&&!core.dead&&core.maxHealth>0&&core.health/core.maxHealth<=C.DepartureRules.criticalCoreRatio)add('core',1,'Le centre est gravement endommagé.');
  if(Number(g.resources?.ammo)<1)add('ammo',1,'Munitions communes épuisées.');
  return list;
 }
 // Enregistrement dès le chargement du script : une campagne reprise avant la mise en place de l'interface
 // trouve déjà son validateur. L'état vit ici ; l'installation n'y ajoute que le relevé et l'affichage.
 const OWNER=Symbol.for('deadwall.cityRadio217.owner');
 function register(g){
  if(!g?.expansions?.register||g[OWNER])return false;
  const owner={state:initial(),changed:null,overview:null,actions:null};Object.defineProperty(g,OWNER,{value:owner,enumerable:false});
  const set=next=>{owner.state=next;owner.changed?.();};
  g.expansions.register({id:'cityRadio217',title:'Radio et consignes',validate,
   snapshot:()=>validate(owner.state),
   overview:()=>owner.overview?owner.overview():{summary:'La radio de D-17 se met en place.',rows:[]},
   actions:()=>owner.actions?owner.actions():[],
   restore:raw=>set(validate(raw)),reset:()=>set(fresh())});
  return true;
 }
 function install(g,doc){
  if(!g||g.cityRadio217)return false;
  register(g);
  // Sans registre des opérations, la radio fonctionne seule, en mémoire : jamais de consigne ni de sauvegarde.
  const owner=g[OWNER]||{state:initial()};
  // Journal en mémoire : celui de la sauvegarde pour une campagne récente, vide sinon.
  let log=[],primed=false,clock=-Infinity,seenWorld=null,wasAway=false,received=0,notice='';
  const known=new Map(),told=new Map();
  const state=()=>owner.state;
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const away=()=>Boolean(g.frontier?.active?.()||g.player?.regionAbsent);
  const now=()=>Math.min(MAX_AT,Math.max(0,Number(g.elapsed)||0));
  const forget=()=>{primed=false;clock=-Infinity;seenWorld=g.world||null;wasAway=false;received=0;notice='';known.clear();told.clear();};
  owner.changed=()=>{log=owner.state.journal.map(e=>({...e}));forget();refresh();};
  function say(text,tone='normal'){
   const entry={at:now(),wave:wave(g.wave)?g.wave:0,tone:TONES.includes(tone)?tone:'normal',text:String(text).slice(0,MAX_TEXT)};
   log.push(entry);while(log.length>R.journal)log.shift();
   if(state().active)state().journal=log.map(e=>({...e}));
   received++;return entry;
  }
  // Consigne : un seul ordre par vague, donné à la première brèche. Un repli déjà en cours n'est pas modifié.
  function applyOrder(){
   const s=state(),F=g.fallbackOrder;
   if(!s.active||s.order==='hold'||!wave(g.wave)||s.applied===g.wave||typeof F?.[s.order]!=='function')return false;
   s.applied=g.wave;
   if(F.status?.().mode){say('Consigne « '+ORDER_NAMES[s.order]+' » : un repli est déjà en cours, rien n’est changé.');return false;}
   if(!F[s.order]()){say('Consigne « '+ORDER_NAMES[s.order]+' » : l’ordre n’a pas pu être donné.','danger');return false;}
   s.ours=true;
   say(s.order==='everyone'?'Consigne appliquée : repli général, tout le monde revient vers le centre.':'Consigne appliquée : les sections se replient vers le centre.');
   return true;
  }
  // Fin de consigne : l'ordre donné par la cité est levé quand l'assaut est terminé. Si le Commandant rentre
  // avant, ou si l'ordre a changé entre-temps, la cité ne touche plus à rien : le repli redevient son affaire.
  function followOrder(isAway){
   const s=state(),F=g.fallbackOrder;if(!s.ours)return;
   const mode=F?.status?.().mode||null;
   if(mode!==s.order){s.ours=false;return;}
   if(!isAway){s.ours=false;g.notify?.('Votre consigne a fait replier la cité. Le repli reste en vigueur : levez-le dans le carnet, onglet Situation.','normal');return;}
   if(g.phase==='warning'||g.phase==='assault')return;
   s.ours=false;
   if(F.standDown())say('Assaut terminé : repli levé comme convenu. Les ouvriers reprennent ; les sections attendent au centre.','good');
  }
  function tick(){
   if(!playing())return;
   if(seenWorld!==g.world)forget();
   const isAway=away();
   followOrder(isAway);
   if(!isAway){
    // Retour : un seul rappel, puis plus aucun relevé tant que le Commandant est sur place.
    if(wasAway&&received>0)g.notify?.('Radio : '+many(received,'message reçu','messages reçus')+' pendant votre sortie. Journal dans le carnet, onglet Situation.','normal');
    wasAway=false;received=0;primed=false;known.clear();return;
   }
   wasAway=true;
   const list=facts(g),t=now(),current=new Set();
   for(const fact of list){
    current.add(fact.key);
    const before=known.get(fact.key);known.set(fact.key,Math.max(before||0,fact.level));
    // Premier relevé d'une sortie ou d'une reprise : ce que le Commandant savait déjà n'est pas répété.
    if(!primed||before!==undefined&&fact.level<=before)continue;
    if(before===undefined&&t-(told.get(fact.key)??-Infinity)<REARM_SECONDS)continue;
    told.set(fact.key,t);say(fact.text,fact.tone);
    if(fact.key.startsWith('breach:'))applyOrder();
   }
   // Fin d'épisode : le fait pourra être réannoncé s'il revient, après le délai de silence.
   for(const key of known.keys())if(!current.has(key))known.delete(key);
   for(const [key,at]of told)if(!current.has(key)&&t-at>=REARM_SECONDS)told.delete(key);
   primed=true;
  }
  const HERE='Les consignes se donnent sur place, dans D-17, avant de sortir.';
  function quote(id){
   if(!ORDERS.includes(id))return{ok:false,reason:'Consigne inconnue.'};
   if(!state().active)return{ok:false,reason:'Cette campagne a commencé avant les consignes d’absence.'};
   if(state().order===id)return{ok:false,reason:'Consigne en vigueur.'};
   if(!g.fallbackOrder)return{ok:false,reason:'Ordres de repli indisponibles.'};
   if(!playing()||away()||!g.canIssueCommand?.()||g.player?.dead)return{ok:false,reason:HERE};
   return{ok:true};
  }
  function setOrder(id){
   const q=quote(id);if(!q.ok)return q;
   const s=state();s.order=id;s.ours=false;
   notice='Consigne d’absence : '+ORDER_NAMES[id].toLowerCase()+'.';
   g.notify?.(notice+(id==='hold'?' La cité ne donnera aucun ordre de repli sans vous.':' La cité donnera cet ordre seule si une brèche s’ouvre pendant votre sortie, et le lèvera l’assaut terminé.'));
   g.audio?.ui?.();g.save?.(false);refresh();return{ok:true};
  }
  function overview(){
   const s=state(),last=log[log.length-1];
   const rows=[{label:'Radio',value:SPEAKER+' transmet les faits de D-17 pendant vos sorties : front, brèche, secteur perdu, mur menacé, amas de corps, eau, moral, centre, munitions. Portée non limitée pour l’instant.'},
    {label:'Dernier message',value:last?line(last):'Aucun.'},
    {label:'Journal',value:many(log.length,'message','messages')+' sur '+R.journal+' gardés'+(s.active?', sauvegardés avec la campagne.':', non sauvegardés.')}];
   if(!s.active)return{summary:'Cette campagne a commencé avant les consignes d’absence : la radio transmet, mais la cité ne donne aucun ordre sans vous. Les consignes ne s’activent pas en cours de campagne.',
    rows:[...rows,{label:'Consigne',value:'Sans objet.'}]};
   return{summary:'Avant de sortir, fixez une consigne. La cité l’applique seule par les ordres de repli existants ; elle n’improvise pas.',rows:[...rows,
    {label:'Consigne',value:ORDER_NAMES[s.order]+(s.ours?' · appliquée, repli en cours':s.applied!==null&&s.applied===g.wave?' · déjà appliquée à cette vague':'')},
    {label:'Application',value:'À la première brèche d’une vague, une fois par vague, pendant votre absence seulement. Le repli est levé quand l’assaut est terminé ; si vous rentrez avant, il reste en vigueur et c’est à vous de le lever.'}]};
  }
  function actions(){
   if(!state().active)return[];
   return ORDERS.map(id=>{const q=quote(id);return{id:'order-'+id,label:'Consigne : '+ORDER_NAMES[id],description:id==='hold'?'La cité ne donne aucun ordre de repli sans vous.':'À la première brèche d’une vague, la cité donne seule l’ordre « '+(id==='everyone'?'repli général':'repli des combattants')+' », puis le lève l’assaut terminé.',
    disabled:!q.ok,reason:q.reason||'Aucun coût. Modifiable à tout moment sur place.',run:()=>setOrder(id)};});
  }
  owner.overview=overview;owner.actions=actions;
  // Interface : un poste en surimpression pendant la sortie, un journal et les consignes dans l'onglet Situation.
  let refresh=()=>{};
  if(doc?.body&&typeof doc.createElement==='function'){
   const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
   const write=(node,text)=>{const value=String(text);if(node.textContent!==value)node.textContent=value;};
   const fill=(list,entries,empty)=>{
    const key=entries.map(e=>e.at+'|'+e.text).join('\n')||'∅'+empty;if(list.dataset.key===key)return;list.dataset.key=key;
    list.replaceChildren();
    if(!entries.length){list.appendChild(el('li',empty,'city-radio-empty'));return;}
    for(const entry of entries){const item=el('li');item.dataset.tone=entry.tone;item.append(el('time',stamp(entry)),el('span',entry.text));list.appendChild(item);}
   };
   const post=el('aside',undefined,'city-radio hidden');post.id='cityRadio217';post.setAttribute('aria-label','Radio de D-17');
   const postList=el('ol');postList.id='cityRadio217Feed';postList.setAttribute('role','log');postList.setAttribute('aria-live','polite');
   post.append(el('strong','RADIO D-17 · '+SPEAKER),postList);(g.ui?.hud||doc.body).appendChild(post);
   const host=doc.getElementById('commandPanel-enclosure');
   let box=null,journal=null,orderState=null;const buttons=new Map();
   if(host){
    box=el('section',undefined,'city-radio-journal');box.id='cityRadio217Journal';box.setAttribute('aria-labelledby','cityRadio217Title');
    const title=el('h3','RADIO ET CONSIGNES D’ABSENCE');title.id='cityRadio217Title';
    orderState=el('p',undefined,'city-radio-order');orderState.id='cityRadio217Order';orderState.setAttribute('role','status');
    const row=el('div',undefined,'city-radio-actions');
    for(const id of ORDERS){
     const button=el('button');button.id='cityRadio217-'+id;button.type='button';button.append(el('span',ORDER_NAMES[id].toUpperCase()),el('small',ORDER_HINTS[id]));
     button.addEventListener('click',()=>{if(!button.disabled){setOrder(id);refresh();}});row.appendChild(button);buttons.set(id,button);
    }
    journal=el('ol',undefined,'city-radio-log');journal.id='cityRadio217Log';
    box.append(title,orderState,row,el('h3','JOURNAL RADIO · '+SPEAKER),journal);host.appendChild(box);
   }
   refresh=()=>{
    const on=g.state==='playing'&&!g.gameOver,out=on&&away();
    post.classList.toggle('hidden',!out);
    if(out)fill(postList,log.filter(e=>e.wave===g.wave).slice(-SHOWN),'Rien à signaler.');
    if(!box)return;
    box.hidden=!on;if(!on)return;
    const s=state();
    for(const [id,button]of buttons){const q=quote(id);button.disabled=!q.ok;button.hidden=!s.active;button.setAttribute('aria-pressed',String(s.active&&s.order===id));button.title=q.reason||'';}
    write(orderState,!s.active?'Cette campagne a commencé avant les consignes d’absence : la radio transmet, la cité ne donne aucun ordre sans vous.'
     :'Consigne en vigueur : '+ORDER_NAMES[s.order].toLowerCase()+'.'+(s.ours?' Repli appliqué par la cité, levé quand l’assaut sera terminé.':'')+(away()?' '+HERE:''));
    fill(journal,log.slice().reverse(),'Aucun message reçu.');
   };
   const updateUI=g.updateUI;if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);refresh();return result;};
  }
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(this,dt,...rest);const t=Number(g.elapsed)||0;if(t<clock||t-clock>=CHECK_SECONDS){clock=t;tick();}return result;};
  g.cityRadio217=Object.freeze({active:()=>state().active,order:()=>state().order,ours:()=>state().ours,away,speaker:()=>SPEAKER,journal:()=>Object.freeze(log.map(e=>Object.freeze({...e}))),
   facts:()=>facts(g),quote,setOrder,tick,refresh:()=>refresh(),overview,actions,snapshot:()=>validate(state())});
  owner.changed?.();
  return true;
 }
 return Object.freeze({install,register,initial,fresh,validate,facts,line,ORDERS,ORDER_NAMES,SPEAKER});
});
