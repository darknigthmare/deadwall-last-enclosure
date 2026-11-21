// Cité autonome : radio et consignes (docs/GAME_BIBLE.md §7.15, directions 2 et 3), première tranche.
// Radio : pendant que le Commandant est hors de D-17, ce module relit des faits déjà établis par leurs
// propriétaires (phase, brèche nommée, secteur perdu, pan menacé, amas de corps, eau, moral, centre, munitions)
// et les relaie en messages datés. Lecture seule : ni stock, ni dégât, ni tirage, ni horloge.
// Consigne : choisie sur place avant de sortir, pour les NOUVELLES campagnes seulement. À la première brèche
// d'une vague, la cité donne seule l'ordre de repli choisi, par les ordres existants de `g.fallbackOrder`
// et avec leurs refus ; elle le lève quand l'assaut est terminé. Aucune règle de combat n'est ajoutée.
// Deuxième tranche (état version 2) : chaque district (src/districts.js) peut recevoir sa propre consigne — tenir,
// replier ses combattants, évacuer vers l'anneau intérieur, sacrifier. Une consigne de district s'applique, en présence
// comme en absence, à la première brèche ou au premier pan menacé de son enceinte pendant l'alerte ou l'assaut, une fois
// par vague, par les ordres existants (repli des sections, repli général et sa ligne, mode des portes). Sans consigne
// propre, un district suit la consigne générale, qui reste une consigne d'absence. Sacrifier ouvre les portes du district,
// replie tout le monde derrière l'enceinte intérieure suivante et laisse le secteur perdu jusqu'à sa reconquête.
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
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CityRadio217Rules,T=root.DeadwallTactics||(typeof require==='function'?require('./tactics.js'):null);
 // Réglages techniques, sans effet sur l'équilibrage : cadence du relevé, silence avant qu'un même fait
 // puisse être réannoncé, longueur d'un message, nombre de lignes de la vague en cours montrées en sortie.
 const CHECK_SECONDS=.5,REARM_SECONDS=60,MAX_TEXT=240,SHOWN=3,MAX_AT=1e9,MAX_WAVE=1e6;
 const SPEAKER='Sami V., répartiteur';
 const ORDERS=Object.freeze(['hold','fighters','everyone']),TONES=Object.freeze(['normal','danger','good']);
 const ORDER_NAMES=Object.freeze({hold:'Tenir la ligne',fighters:'Replier les combattants à la première brèche',everyone:'Repli général à la première brèche'});
 const ORDER_HINTS=Object.freeze({hold:'aucun ordre donné sans vous',fighters:'sections vers le centre · ouvriers inchangés',everyone:'tout le monde rentre · portes verrouillées'});
 const SIDES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'}),WHERE=Object.freeze({north:'au nord',east:'à l’est',south:'au sud',west:'à l’ouest'});
 const KEYS=['version','active','order','applied','ours','journal'],ENTRY=['at','wave','tone','text'];
 // Consignes de district : une case par rang, 0 pour « Dehors », 1 à 8 pour les enceintes (borne du relevé des districts).
 const SLOTS=9,MAX_ID=0x7ffffffe,MAX_GATES=64;
 const POSTURES=Object.freeze(['hold','fighters','evacuate','sacrifice']),MODES=Object.freeze(['fighters','everyone']);
 const POSTURE_NAMES=Object.freeze({hold:'Tenir',fighters:'Replier ses combattants',evacuate:'Évacuer vers l’anneau intérieur',sacrifice:'Sacrifier'});
 const KEYS2=['version','active','order','applied','ours','mode','districts','done','sacrifice','journal'],SACRIFICE=['ring','wave','gates'];
 const blank=()=>Array(SLOTS).fill(null);
 function initial(){return{version:2,active:false,order:'hold',applied:null,ours:false,mode:null,districts:blank(),done:blank(),sacrifice:null,journal:[]};}
 function fresh(){return{...initial(),active:true};}
 const wave=v=>Number.isInteger(v)&&v>=0&&v<=MAX_WAVE;
 // Conversion : une campagne de la première tranche garde sa consigne générale ; ses districts la suivent.
 function upgrade(v1){return{version:2,active:v1.active,order:v1.order,applied:v1.applied,ours:v1.ours,mode:v1.ours?v1.order:null,districts:blank(),done:blank(),sacrifice:null,journal:v1.journal};}
 function validate(raw){
  if(raw===undefined)return initial();
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.version===1)return upgrade(validate1(raw));
  const bad=()=>{throw Error('Radio 217 invalide.');};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==2||Object.keys(raw).length!==KEYS2.length||Object.keys(raw).some(k=>!KEYS2.includes(k)))bad();
  const base=validate1({version:1,active:raw.active,order:raw.order,applied:raw.applied,ours:false,journal:raw.journal});
  if(typeof raw.ours!=='boolean'||raw.mode!==null&&!MODES.includes(raw.mode)||raw.ours!==(raw.mode!==null))bad();
  if(!Array.isArray(raw.districts)||raw.districts.length!==SLOTS||raw.districts.some((p,rank)=>p!==null&&(!POSTURES.includes(p)||p==='sacrifice'&&rank<2)))bad();
  if(!Array.isArray(raw.done)||raw.done.length!==SLOTS||raw.done.some(v=>v!==null&&!wave(v)))bad();
  // Un repli donné par la cité suppose une consigne appliquée à une vague connue.
  if(raw.ours&&raw.applied===null&&raw.done.every(v=>v===null))bad();
  let sacrifice=null;
  if(raw.sacrifice!==null){
   const x=raw.sacrifice,seen=new Set();
   if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==SACRIFICE.length||Object.keys(x).some(k=>!SACRIFICE.includes(k))||!Number.isInteger(x.ring)||x.ring<2||x.ring>=SLOTS||!wave(x.wave)
    ||!Array.isArray(x.gates)||x.gates.length>MAX_GATES)bad();
   const gates=x.gates.map(e=>{if(!Array.isArray(e)||e.length!==2||!Number.isInteger(e[0])||e[0]<1||e[0]>MAX_ID||seen.has(e[0])||!['auto','closed'].includes(e[1]))bad();seen.add(e[0]);return[e[0],e[1]];});
   sacrifice={ring:x.ring,wave:x.wave,gates};
  }
  if(!raw.active&&(raw.ours||raw.districts.some(p=>p!==null)||raw.done.some(v=>v!==null)||sacrifice))bad();
  return{version:2,active:base.active,order:base.order,applied:base.applied,ours:raw.ours,mode:raw.mode,districts:[...raw.districts],done:[...raw.done],sacrifice,journal:base.journal};
 }
 // Format de la première tranche, gardé tel quel pour relire les anciennes sauvegardes.
 function validate1(raw){
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
  // Vague menée (src/abominations217.js) : annoncée, dérangée (aggravation), puis abattue. Effectif lu dans sa prévision.
  let led=null;try{led=g.abominations217?.forecast?.()||null;}catch(error){led=null;}
  if(led&&WHERE[led.side]&&!led.decided){
   if(led.status==='alive')add('led:'+led.wave,led.woken?2:1,led.woken?'Meneuse dérangée '+WHERE[led.side]+' : elle marche sur la cité'+(led.standing?' avec '+many(led.standing,'infecté','infectés')+' de son escorte':'')+'.'
    :'Vague '+led.wave+' menée : une Meneuse rassemble la horde '+WHERE[led.side]+'. '+led.alive+' contacts si elle vit à l’assaut, '+led.slain+' si elle tombe.');
   else if(led.status==='slain')add('ledslain:'+led.wave,1,'Meneuse abattue '+WHERE[led.side]+' : la vague '+led.wave+' arrivera dispersée, '+led.slain+' contacts attendus.','good');
  }
  // Avant-postes (src/outposts217.js) : chute ou passage tenu d'une migration, lus chez leur propriétaire.
  let posts=[];try{posts=g.outposts217?.radioFacts?.()||[];}catch(error){posts=[];}
  for(const f of posts)if(f&&typeof f.key==='string'&&typeof f.text==='string')add(f.key,f.level||1,f.text,f.tone||'danger');
  // Maladie des charniers (src/corpse-chain217.js) : mêmes paliers que l'eau, lus dans leur propriétaire.
  const chain=g.corpseChain217;
  if(chain?.open?.()){
   const s=Number(chain.stage?.())||0;
   if(s>=6)add('disease',4,'Maladie : les plus fragiles meurent de la fièvre des charniers.');
   else if(s>=4)add('disease',3,'Maladie : des habitants tombent malades, les corps ne sont pas traités.');
   else if(s>=2)add('disease',2,'Salubrité : l’odeur des corps pèse sur la cité, le moral baisse.');
   else if(s>=1)add('disease',1,'Salubrité : trop de corps restent dans la cité.','normal');
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
  let log=[],primed=false,clock=-Infinity,seenWorld=null,wasAway=false,received=0,missed=0,notice='';
  const known=new Map(),told=new Map();
  const state=()=>owner.state;
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const away=()=>Boolean(g.frontier?.active?.()||g.player?.regionAbsent);
  const now=()=>Math.min(MAX_AT,Math.max(0,Number(g.elapsed)||0));
  // Consignes de district : relevé des enceintes au relevé précédent (une enceinte ouverte ne figure plus au relevé
  // suivant), brèches déjà vues et vague de la dernière brèche de chaque district. Rien de tout cela n'est sauvegardé.
  const memory={walls:new Map(),gates:new Map(),names:new Map()},seen=new Set(),hits=new Map();let watched=false;
  const forget=()=>{primed=false;clock=-Infinity;seenWorld=g.world||null;wasAway=false;received=0;missed=0;notice='';known.clear();told.clear();seen.clear();hits.clear();watched=false;};
  owner.changed=()=>{log=owner.state.journal.map(e=>({...e}));forget();refresh();};
  // Portée (avant-postes 217, nouvelles campagnes) : hors de portée de D-17 et de tout avant-poste, rien n'est reçu.
  const inRange=()=>g.outposts217?.radioInRange?.()!==false;
  function say(text,tone='normal'){
   if(away()&&!inRange()){missed++;return null;}
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
   take();
   say(s.order==='everyone'?'Consigne appliquée : repli général, tout le monde revient vers le centre.':'Consigne appliquée : les sections se replient vers le centre.');
   return true;
  }
  // Fin de consigne : l'ordre donné par la cité est levé quand l'assaut est terminé. Si le Commandant rentre
  // avant, ou si l'ordre a changé entre-temps, la cité ne touche plus à rien : le repli redevient son affaire.
  // L'ordre en cours est celui de la cité : son mode est retenu pour savoir s'il a changé depuis.
  function take(){const s=state(),mode=g.fallbackOrder?.status?.().mode||null;s.ours=Boolean(mode);s.mode=mode;}
  function release(){const s=state();s.ours=false;s.mode=null;}
  function followOrder(isAway){
   const s=state(),F=g.fallbackOrder;if(!s.ours)return;
   const mode=F?.status?.().mode||null;
   if(mode!==s.mode){release();return;}
   if(!isAway){release();g.notify?.('Votre consigne a fait replier la cité. Le repli reste en vigueur : levez-le dans le carnet, onglet Situation.','normal');return;}
   if(g.phase==='warning'||g.phase==='assault')return;
   release();
   // Un secteur sacrifié est isolé avec la levée : ses portes retrouvent leur mode d'avant, par la commande des portes.
   if(s.sacrifice)isolate(true);
   if(F.standDown())say('Assaut terminé : repli levé comme convenu. Les ouvriers reprennent ; les sections attendent au centre.','good');
  }
  // ——— Consignes de district ———
  const Fallback=root.DeadwallFallbackOrder||(typeof require==='function'?require('./fallback-order.js'):null);
  const rings=()=>{try{return playing()&&g.districts?.rings?.()||[];}catch(error){return[];}};
  const nameOf=rank=>rank>=1?root.DeadwallDistricts?.ringName?.(rank)||memory.names.get(rank)||rings()[rank-1]?.name||'Enceinte '+rank:'Dehors';
  const the=name=>{const low=name.toLowerCase();return low==='dehors'?'l’extérieur':(/^[aeéèiou]/.test(low)?'l’':'la ')+low;};
  const alive=entity=>Boolean(entity&&!entity.dead&&entity.health>0);
  // Une entité est dans le district `rank` : dans son enceinte et hors de l'enceinte intérieure. Une enceinte déjà ouverte
  // ne borne plus rien : son district s'étend alors à tout ce qui est au-delà de l'enceinte intérieure.
  function inDistrict(rank,entity){
   const list=rings();
   if(rank===0)return !list.length||!list[list.length-1].contains(entity);
   if(rank>=2&&list[rank-2]?.contains(entity))return false;
   const outer=list[rank-1];return outer?outer.contains(entity):true;
  }
  function squadsIn(rank){
   const found=new Set();
   for(const unit of g.units||[])if(alive(unit)&&!unit.regionAbsent&&unit.kind==='soldier'&&Number.isInteger(unit.squad)&&inDistrict(rank,unit))found.add(unit.squad);
   return [...found].sort((a,b)=>a-b);
  }
  // Ligne d'une évacuation : l'enceinte intérieure du district ; l'enceinte du centre pour elle-même ; la dernière pour « Dehors ».
  const lineFor=rank=>rank>=2?rank-1:rank===1?1:rings().length;
  // Sur place, une annonce ordinaire ; en sortie, un message radio.
  function tell(text,tone='normal'){if(away())return say(text,tone);g.notify?.(text,tone);return null;}
  function applyDistrict(rank,posture){
   const s=state(),F=g.fallbackOrder,name=nameOf(rank),label='Consigne de '+the(name);
   s.done[rank]=g.wave;
   const mode=F.status?.().mode||null;
   if(posture==='hold'){tell(label+' : tenir. Aucun ordre de repli n’est donné.');return false;}
   // Un repli ordonné par le Commandant n'est jamais repris par la cité ; un repli de la cité peut être étendu.
   if(mode==='everyone'||mode&&!s.ours){tell(label+' : '+(mode==='everyone'?'un repli général':'un repli')+' est déjà en cours, rien n’est changé.');return false;}
   if(posture==='fighters'){
    const squads=squadsIn(rank);
    if(!squads.length){tell(label+' : aucune section dans ce district, rien n’est changé.');return false;}
    if(!F.fighters({squads})){tell(label+' : l’ordre n’a pas pu être donné.','danger');return false;}
    take();tell(label+' appliquée : '+(squads.length>1?'les sections ':'la section ')+squads.map(i=>C.SQUAD_RULES.labels[i]).join(', ')+(squads.length>1?' se replient':' se replie')+' vers le centre.');return true;
   }
   if(posture==='sacrifice'&&s.sacrifice){tell(label+' : un secteur est déjà sacrifié, rien n’est changé.');return false;}
   const line=posture==='sacrifice'?rank-1:lineFor(rank);
   if(line>=1&&g.districts.lineRank?.()!==line&&!g.districts.setLine(line)){tell(label+' : la ligne de repli n’a pas pu être choisie, rien n’est changé.','danger');return false;}
   if(!F.everyone()){tell(label+' : l’ordre n’a pas pu être donné.','danger');return false;}
   take();
   const behind=line>=1?the(nameOf(line)):'le centre';
   if(posture==='evacuate'){tell(label+' appliquée : tout le monde rentre derrière '+behind+', verrouillée dès que plus personne n’est au-delà.');return true;}
   // Sacrifier : les portes du district sont laissées ouvertes, par la commande des portes. Leur mode d'avant est retenu.
   const opened=[];
   for(const id of memory.gates.get(rank)||[]){
    const gate=g.world.buildings.get(id);if(!gate||!T.operational(gate))continue;
    const before=T.gateMode(gate);if(before==='open')continue;
    if(g.setGateMode('open',gate))opened.push([id,before]);
   }
   s.sacrifice={ring:rank,wave:wave(g.wave)?g.wave:0,gates:opened};
   tell(name+' sacrifiée : '+(opened.length?(opened.length>1?opened.length+' portes laissées ouvertes':'sa porte laissée ouverte')+', la horde y passe plutôt que d’enfoncer les murs':'aucune porte à laisser ouverte')+'. Tout le monde se replie derrière '+behind+'. Le secteur est perdu jusqu’à sa reconquête.','danger');
   g.save?.(false);return true;
  }
  // Enceinte du secteur sacrifié : celle qui porte encore l'une de ses portes, sinon celle de son rang.
  function sacrificeRing(){
   const x=state().sacrifice;if(!x)return null;
   const list=rings(),ids=x.gates.map(e=>e[0]);
   return ids.length?list.find(ring=>ring.gates.some(gate=>ids.includes(gate.id)))||null:list[x.ring-1]||null;
  }
  const openGates=()=>(state().sacrifice?.gates||[]).filter(([id])=>{const gate=g.world?.buildings?.get(id);return gate&&T.operational(gate)&&T.gateMode(gate)==='open';});
  // Reconquête du secteur sacrifié, en trois temps (src/fallback-order.js), lue sur l'état réel.
  function reconquest(){
   const x=state().sacrifice;if(!x||!playing()||!Fallback)return null;
   const ring=sacrificeRing(),inner=ring?rings()[ring.rank-2]:null,gates=openGates().length;
   const intruders=ring?(g.zombies||[]).filter(z=>alive(z)&&ring.contains(z)&&!(inner&&inner.contains(z))).length:0;
   const steps=Fallback.reconquest({breaches:ring?gates:1,intruders:ring?intruders:1,order:g.fallbackOrder?.status?.().mode||null});
   return Object.freeze({rank:ring?.rank||x.ring,name:ring?.name||nameOf(x.ring),closed:Boolean(ring),intruders,gates,steps});
  }
  function watchSacrifice(){
   const view=reconquest();if(!view||!view.steps.every(step=>step.done))return;
   state().sacrifice=null;
   tell(view.name+' reprise : portes refermées, plus aucun infecté dans le district, repli levé. Le secteur est de nouveau tenu.','good');
   g.save?.(false);
  }
  function isolateQuote(){
   if(!state().sacrifice)return{ok:false,reason:'Aucun secteur sacrifié.'};
   if(!openGates().length)return{ok:false,reason:'Les portes du secteur sont déjà refermées.'};
   if(!playing()||away()||!g.canIssueCommand?.()||g.player?.dead)return{ok:false,reason:'Les portes se referment sur place.'};
   return{ok:true};
  }
  // Isoler : les portes laissées ouvertes retrouvent leur mode d'avant ; la commande des portes refuse un passage occupé.
  function isolate(byCity=false){
   if(!byCity){const q=isolateQuote();if(!q.ok)return q;}
   const x=state().sacrifice;if(!x)return{ok:false,reason:'Aucun secteur sacrifié.'};
   const left=openGates();let closed=0;
   for(const [id,mode]of left){const gate=g.world.buildings.get(id);if(g.setGateMode(mode,gate))closed++;}
   if(closed)tell('Isoler '+the(nameOf(x.ring))+' : '+many(closed,'porte refermée','portes refermées')+(closed<left.length?', '+many(left.length-closed,'reste ouverte','restent ouvertes'):'')+'.',closed===left.length?'good':'danger');
   refresh();
   return closed===left.length?{ok:true}:{ok:false,reason:'Passage occupé : une porte n’a pas pu être refermée.'};
  }
  // Relevé des consignes de district, en présence comme en absence.
  function districtTick(){
   const s=state(),F=g.fallbackOrder;
   if(!s.active||!F||!g.districts||!T)return;
   const list=F.breachList?.()||[];
   if(watched)for(const b of list)if(!seen.has(b.id))hits.set(memory.walls.get(b.id)??0,g.wave);
   seen.clear();for(const b of list)seen.add(b.id);watched=true;
   if((g.phase==='warning'||g.phase==='assault')&&wave(g.wave)){
    let threatened=[];try{threatened=g.breach217?.districts?.()||[];}catch(error){threatened=[];}
    const ranks=new Set(threatened.map(d=>d.rank));
    for(let rank=0;rank<SLOTS;rank++){
     const posture=s.districts[rank];
     if(!posture||s.done[rank]===g.wave)continue;
     if(hits.get(rank)===g.wave||ranks.has(rank))applyDistrict(rank,posture);
    }
   }
   watchSacrifice();
  }
  function remember(){
   memory.walls.clear();memory.gates.clear();memory.names.clear();
   if(!state().active)return;
   for(const ring of rings()){for(const work of ring.works)memory.walls.set(work.id,ring.rank);memory.gates.set(ring.rank,ring.gates.map(gate=>gate.id));memory.names.set(ring.rank,ring.name);}
  }
  // La brèche relayée appartient-elle à un district qui a sa propre consigne ? Alors la consigne générale s'efface.
  function ownPosture(){
   const ids=g.fallbackOrder?.status?.().lastBreach?.ids;if(!ids?.length)return false;
   return state().districts[memory.walls.get(ids[0])??0]!==null;
  }
  function tick(){
   if(!playing())return;
   if(seenWorld!==g.world)forget();
   try{radioTick();}finally{remember();}
  }
  function radioTick(){
   const isAway=away();
   followOrder(isAway);
   districtTick();
   if(!isAway){
    // Retour : un seul rappel, puis plus aucun relevé tant que le Commandant est sur place.
    if(wasAway&&missed>0){const lost=missed;missed=0;say('Hors de portée pendant la sortie : '+many(lost,'message n’a pas été reçu','messages n’ont pas été reçus')+'.','danger');}
    if(wasAway&&received>0)g.notify?.('Radio : '+many(received,'message reçu','messages reçus')+' pendant votre sortie. Journal dans le carnet, onglet Situation.','normal');
    wasAway=false;received=0;missed=0;primed=false;known.clear();return;
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
    if(fact.key.startsWith('breach:')&&!ownPosture())applyOrder();
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
   // La consigne générale remplit tous les districts : aucun ne garde de consigne propre.
   const s=state();s.order=id;release();s.districts=blank();
   notice='Consigne d’absence : '+ORDER_NAMES[id].toLowerCase()+'.';
   g.notify?.(notice+(id==='hold'?' La cité ne donnera aucun ordre de repli sans vous.':' La cité donnera cet ordre seule si une brèche s’ouvre pendant votre sortie, et le lèvera l’assaut terminé.'));
   g.audio?.ui?.();g.save?.(false);refresh();return{ok:true};
  }
  // Consigne propre d'un district : `general` le rend à la consigne générale.
  const DISTRICT_IDS=[...POSTURES,'general'];
  const ranks=()=>{const n=rings().length;return n?[...Array.from({length:Math.min(n,SLOTS-1)},(_,i)=>i+1),0]:[0];};
  function districtQuote(rank,id){
   if(!DISTRICT_IDS.includes(id))return{ok:false,reason:'Consigne inconnue.'};
   if(!state().active)return{ok:false,reason:'Cette campagne a commencé avant les consignes d’absence.'};
   if(!g.fallbackOrder||!g.districts||!T)return{ok:false,reason:'Districts indisponibles.'};
   if(!Number.isInteger(rank)||!ranks().includes(rank))return{ok:false,reason:'Aucun district de ce rang.'};
   if(id==='sacrifice'&&rank===0)return{ok:false,reason:'Dehors n’est pas un district : rien à sacrifier.'};
   if(id==='sacrifice'&&rank===1)return{ok:false,reason:'L’enceinte intérieure garde le centre : elle ne se sacrifie pas.'};
   if(state().districts[rank]===(id==='general'?null:id))return{ok:false,reason:'Consigne en vigueur.'};
   if(!playing()||away()||!g.canIssueCommand?.()||g.player?.dead)return{ok:false,reason:HERE};
   return{ok:true};
  }
  function setDistrictOrder(rank,id){
   const q=districtQuote(rank,id);if(!q.ok)return q;
   state().districts[rank]=id==='general'?null:id;
   notice='Consigne de '+the(nameOf(rank))+' : '+postureText(rank).toLowerCase()+'.';
   g.notify?.(notice+' '+postureHint(rank,id),id==='sacrifice'?'danger':'normal');
   g.audio?.ui?.();g.save?.(false);refresh();return{ok:true};
  }
  function postureText(rank){
   const own=state().districts[rank];
   return own?POSTURE_NAMES[own]:ORDER_NAMES[state().order]+' (consigne générale, en votre absence)';
  }
  function postureHint(rank,id){
   const inner=rank>=2?the(nameOf(rank-1)):rank===1?'l’enceinte intérieure':rings().length?the(nameOf(rings().length)):'le centre';
   const when=' À la première brèche ou au premier pan menacé de cette enceinte, pendant l’alerte ou l’assaut, une fois par vague, en votre présence comme en votre absence.';
   if(id==='general')return'Ce district suit la consigne générale, appliquée en votre absence seulement.';
   if(id==='hold')return'Aucun ordre de repli pour ce district, même si la consigne générale en prévoit un.'+when;
   if(id==='fighters')return'Les sections présentes dans ce district se replient vers le centre ; les autres sections et les ouvriers gardent leurs ordres.'+when;
   if(id==='evacuate')return'Repli général : tout le monde rentre, puis '+inner+' est verrouillée dès que plus personne n’est au-delà.'+when;
   return'Les portes du district restent ouvertes et tout le monde se replie derrière '+inner+', verrouillée : la horde passe par les portes ouvertes plutôt que d’enfoncer les murs. Le secteur est perdu jusqu’à sa reconquête ; ses bâtiments restent exposés et comptent toujours dans la signature.'+when;
  }
  // États des districts fermés : perdu par choix pour le secteur sacrifié, menacé (pan menacé, ou mur fragile pendant
  // l'alerte et l'assaut), sinon tenu. « Dehors » n'a pas d'état. Lecture seule.
  function districtStates(){
   if(!playing()||!g.districts)return Object.freeze([]);
   let pans=[];try{pans=g.breach217?.districts?.()||[];}catch(error){pans=[];}
   const lost=sacrificeRing()?.rank,fighting=g.phase==='warning'||g.phase==='assault',S=Fallback?.STATES||{};
   return Object.freeze((g.districts.list()||[]).map(d=>{
    const pan=pans.find(p=>p.rank===d.rank),key=!d.closed?null:d.rank===lost?'lost':pan||fighting&&d.fragileWalls>0?'threatened':'held';
    return Object.freeze({rank:d.rank,name:d.name,state:key,label:key?S[key]+(key==='lost'?' par choix':''):'hors enceinte',chosen:key==='lost',pan:pan?Object.freeze({side:pan.side,length:pan.length}):null,
     posture:state().active?state().districts[d.rank]:null,text:state().active?postureText(d.rank):'Sans consigne'});
   }));
  }
  function overview(){
   const s=state(),last=log[log.length-1];
   const rows=[{label:'Radio',value:SPEAKER+' transmet les faits de D-17 pendant vos sorties : front, brèche, secteur perdu, mur menacé, amas de corps, eau, moral, centre, munitions. '+(g.outposts217?.active?.()?'Portée : '+C.Outposts217Rules.radio.range+' m autour de D-17 et de chaque avant-poste ; au-delà, silence. Selon son rang, un avant-poste porte plus loin ('+C.Outposts217Rules.ranks.map(r=>r.name+' '+r.radio+' m').join(', ')+').':'Portée non limitée pour l’instant.')},
    {label:'Dernier message',value:last?line(last):'Aucun.'},
    {label:'Journal',value:many(log.length,'message','messages')+' sur '+R.journal+' gardés'+(s.active?', sauvegardés avec la campagne.':', non sauvegardés.')}];
   if(!s.active)return{summary:'Cette campagne a commencé avant les consignes d’absence : la radio transmet, mais la cité ne donne aucun ordre sans vous. Les consignes ne s’activent pas en cours de campagne.',
    rows:[...rows,{label:'Consigne',value:'Sans objet.'}]};
   return{summary:'Avant de sortir, fixez une consigne. La cité l’applique seule par les ordres de repli existants ; elle n’improvise pas.',rows:[...rows,
    {label:'Consigne',value:ORDER_NAMES[s.order]+(s.ours?' · appliquée, repli en cours':s.applied!==null&&s.applied===g.wave?' · déjà appliquée à cette vague':'')},
    {label:'Application',value:'À la première brèche d’une vague, une fois par vague, pendant votre absence seulement. Le repli est levé quand l’assaut est terminé ; si vous rentrez avant, il reste en vigueur et c’est à vous de le lever.'},
    {label:'Par district',value:(()=>{const list=districtStates();return list.length?list.map(d=>d.name+' : '+d.text.toLowerCase()+' · '+d.label).join(' — '):'Aucun district relevé.';})()+' Une consigne propre s’applique en votre présence comme en votre absence.'},
    {label:'Secteur sacrifié',value:(()=>{const r=reconquest();return r?r.name+' · '+r.steps.map(step=>(step.done?'fait':'à faire')+' : '+step.label.toLowerCase()).join(', ')+(r.closed?'':' · enceinte ouverte, à rebâtir'):'Aucun.';})()}]};
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
   let box=null,journal=null,orderState=null,districtTitle=null,districtNote=null,districtList=null,steps=null,isolateButton=null;const buttons=new Map();
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
    districtTitle=el('h3','CONSIGNES PAR DISTRICT');districtTitle.id='cityRadio217DistrictsTitle';
    districtNote=el('p',undefined,'city-radio-order');districtNote.id='cityRadio217DistrictNote';districtNote.setAttribute('role','status');
    districtList=el('ul',undefined,'city-radio-districts');districtList.id='cityRadio217Districts';
    steps=el('ol',undefined,'fallback-reconquest');steps.id='cityRadio217Reconquest';
    isolateButton=el('button');isolateButton.id='cityRadio217Isolate';isolateButton.type='button';isolateButton.append(el('span','REFERMER LES PORTES DU SECTEUR'),el('small','isoler · portes rendues à leur mode d’avant'));
    isolateButton.addEventListener('click',()=>{if(!isolateButton.disabled){isolate();refresh();}});
    box.append(title,orderState,row,districtTitle,districtNote,districtList,steps,isolateButton,el('h3','JOURNAL RADIO · '+SPEAKER),journal);host.appendChild(box);
   }
   const SHORT=Object.freeze({hold:'TENIR',fighters:'REPLIER',evacuate:'ÉVACUER',sacrifice:'SACRIFIER',general:'GÉNÉRALE'});
   let districtKey='';const rows=new Map();
   function paintDistricts(s){
    const list=s.active?districtStates():[];
    for(const node of [districtTitle,districtNote,districtList])node.hidden=!s.active;
    const key=list.map(d=>d.rank).join(',');
    if(key!==districtKey){
     districtKey=key;districtList.replaceChildren();rows.clear();
     for(const d of list){
      const item=el('li'),name=el('strong',d.name),text=el('span'),choices=el('div',undefined,'city-radio-actions'),pressed=new Map();
      item.dataset.district=String(d.rank);
      for(const id of DISTRICT_IDS){
       const button=el('button',SHORT[id]);button.type='button';button.id='cityRadio217-d'+d.rank+'-'+id;
       button.addEventListener('click',()=>{if(!button.disabled){setDistrictOrder(d.rank,id);refresh();}});choices.appendChild(button);pressed.set(id,button);
      }
      item.append(name,text,choices);districtList.appendChild(item);rows.set(d.rank,{item,text,pressed});
     }
    }
    for(const d of list){
     const row=rows.get(d.rank);if(!row)continue;
     write(row.text,d.label+' · consigne : '+d.text.toLowerCase()+(d.pan?' · pan menacé au '+SIDES[d.pan.side]+' : tenir, évacuer ou sacrifier ?':''));
     if(row.item.dataset.state!==String(d.state))row.item.dataset.state=String(d.state);
     const threat=d.pan?'true':'false';if(row.item.dataset.threat!==threat)row.item.dataset.threat=threat;
     for(const [id,button]of row.pressed){const q=districtQuote(d.rank,id);button.disabled=!q.ok;button.title=q.reason||postureHint(d.rank,id);button.setAttribute('aria-pressed',String((id==='general'?null:id)===d.posture));}
    }
    const pan=list.find(d=>d.pan);
    write(districtNote,!s.active?'':pan?'Pan menacé : '+the(pan.name)+', mur '+SIDES[pan.pan.side]+'. Tenir, évacuer ou sacrifier ? La consigne choisie s’appliquera seule si le pan cède.'
     :'Sans consigne propre, un district suit la consigne générale. Une consigne propre s’applique en votre présence comme en votre absence.');
    const r=s.active?reconquest():null;steps.hidden=!r;isolateButton.hidden=!r;
    if(r){
     const stepKey=r.name+':'+r.steps.map(step=>step.done?1:0).join('');
     if(steps.dataset.key!==stepKey){steps.dataset.key=stepKey;steps.replaceChildren();const head=el('li',r.name.toUpperCase()+' · PERDU PAR CHOIX'+(r.closed?'':' · enceinte ouverte, à rebâtir'));head.dataset.head='true';steps.appendChild(head);
      for(const step of r.steps){const item=el('li',(step.done?'Fait — ':'À faire — ')+step.label+' : '+(step.id==='isolate'?'refermer les portes du secteur':step.detail)+'.');item.dataset.done=String(step.done);steps.appendChild(item);}}
     const q=isolateQuote();isolateButton.disabled=!q.ok;isolateButton.title=q.reason||'';
    }else steps.dataset.key='';
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
    paintDistricts(s);
    fill(journal,log.slice().reverse(),'Aucun message reçu.');
   };
   const updateUI=g.updateUI;if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);refresh();return result;};
  }
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(this,dt,...rest);const t=Number(g.elapsed)||0;if(t<clock||t-clock>=CHECK_SECONDS){clock=t;tick();}return result;};
  g.cityRadio217=Object.freeze({active:()=>state().active,order:()=>state().order,ours:()=>state().ours,away,speaker:()=>SPEAKER,journal:()=>Object.freeze(log.map(e=>Object.freeze({...e}))),
   facts:()=>facts(g),quote,setOrder,tick,refresh:()=>refresh(),overview,actions,snapshot:()=>validate(state()),
   districtOrder:rank=>state().districts[rank]??null,districtQuote,setDistrictOrder,postureText,postureHint,districtStates,
   sacrificed:()=>state().sacrifice?Object.freeze({ring:state().sacrifice.ring,wave:state().sacrifice.wave,gates:Object.freeze(state().sacrifice.gates.map(e=>e[0]))}):null,
   reconquest,isolateQuote,isolate:()=>isolate(false)});
  owner.changed?.();
  return true;
 }
 return Object.freeze({install,register,initial,fresh,validate,facts,line,ORDERS,ORDER_NAMES,POSTURES,POSTURE_NAMES,SPEAKER});
});
