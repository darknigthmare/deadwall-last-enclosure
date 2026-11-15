/* Vagues menées (docs/GAME_BIBLE.md §3.5, la Meneuse), première tranche, pour les NOUVELLES campagnes seulement.
   - Certaines vagues sont menées : le choix dépend du seul numéro de vague et de la graine, sans tirage.
   - Pendant la journée qui précède, la Meneuse se tient au bord de la carte, loin des défenses. C'est une Errante
     ordinaire, créée par le moteur avec les points de vie de n'importe quelle Errante de cette vague. Elle ne marche
     pas et ne frappe pas tant qu'elle rassemble : elle est tenue hors de la boucle de déplacement des infectés.
   - À l'assaut, tout se règle par le nombre. Vivante : le plan de vague gagne `gatherShare` de son effectif et elle
     marche avec la horde, redevenue une infectée comme les autres. Abattue avant : le plan perd `cutShare`.
   Le plan reste celui de `C.wavePlan` : ce module ne fait qu'ajouter ou retirer des infectés ordinaires, dans les
   proportions du plan. Il ne touche ni aux points de vie ni aux dégâts, et ne tire rien dans le flux du jeu : la
   création de la Meneuse emprunte un flux à part, dérivé de la graine et de la vague.
   Une campagne commencée avant cette règle n'a aucune vague menée. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Abominations217Rules;
 const KEYS=['version','active','led'],LED_KEYS=['wave','id','status','delta'],STATUS=['alive','slain','gathered','dispersed'];
 const SIDES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'}),SIDE_IDS=Object.keys(SIDES);
 const WHERE=Object.freeze({north:'au nord',east:'à l’est',south:'au sud',west:'à l’ouest'});
 const MAX_WAVE=1e7,MAX_ID=0x7fffffff,MAX_DELTA=1e12,REFRESH_SECONDS=.5,SEARCH=4096;
 // Plancher d'effectif du moteur, lu dans son propre calcul.
 const FLOOR=C.wavePlan(1,{...C.DIFFICULTIES.standard,enemyCount:0}).total;
 function initial(){return{version:1,active:false,led:null};}
 function fresh(){return{version:1,active:true,led:null};}
 const strict=(raw,keys)=>raw&&typeof raw==='object'&&!Array.isArray(raw)&&Object.keys(raw).length===keys.length&&Object.keys(raw).every(k=>keys.includes(k));
 function validate(raw){
  if(raw===undefined)return initial();
  const fail=()=>{throw Error('Vagues menées 217 invalides.');};
  if(!strict(raw,KEYS)||raw.version!==1||typeof raw.active!=='boolean')fail();
  let led=null;
  if(raw.led!==null){
   const l=raw.led;
   if(!raw.active||!strict(l,LED_KEYS)||!Number.isInteger(l.wave)||l.wave<R.firstWave||l.wave>MAX_WAVE||!Number.isInteger(l.id)||l.id<0||l.id>MAX_ID
    ||!STATUS.includes(l.status)||!Number.isInteger(l.delta)||Math.abs(l.delta)>MAX_DELTA)fail();
   // L'écart n'existe qu'une fois l'assaut lancé : en plus si elle a rassemblé, en moins si elle a été abattue.
   if(l.status==='gathered'?l.delta<0:l.status==='dispersed'?l.delta>0:l.delta!==0)fail();
   led={wave:l.wave,id:l.id,status:l.status,delta:l.delta};
  }
  return{version:1,active:raw.active,led};
 }
 // Hachage entier de la graine et de la vague : sert au choix des vagues, au poste et au flux à part.
 function hash(seed,wave){
  const text=String(seed??0)+':'+wave;let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;return h>>>0;
 }
 // Vague de géants du siège vertical : jamais menée, pour garder le plafond d'abominations présentes.
 function giantWave(wave){const s=C.VerticalCitadel175?.siege;return Boolean(s&&wave>=s.firstWave&&wave%s.spawnWaveInterval===0);}
 function led(wave,seed){
  return Number.isInteger(wave)&&wave>=R.firstWave&&wave<=MAX_WAVE&&(wave-R.firstWave)%R.every===hash(seed,0)%R.every&&!giantWave(wave);
 }
 function nextLed(from,seed){
  for(let wave=Math.max(R.firstWave,Math.floor(Number(from)||1)),n=0;n<SEARCH;wave++,n++)if(led(wave,seed))return wave;
  return null;
 }
 // Poste de la Meneuse : un côté et un point du bord, fonction pure de la graine et de la vague.
 function post(seed,wave){
  const h=hash(seed,wave),side=SIDE_IDS[h&3],along=(R.spanMin+(R.spanMax-R.spanMin)*((h>>>8)%1024)/1023)*C.WORLD_SIZE,near=R.standoff,far=C.WORLD_SIZE-R.standoff;
  const at=side==='north'?{x:along,y:near}:side==='south'?{x:along,y:far}:side==='east'?{x:far,y:along}:{x:near,y:along};
  return Object.freeze({side,name:SIDES[side],where:WHERE[side],x:at.x,y:at.y});
 }
 // Écart d'effectif, borné par la part réglée : des entiers, sans arrondi flottant défavorable.
 const gain=total=>Math.floor(total*R.gatherShare+1e-9);
 const cut=total=>Math.min(Math.floor(total*R.cutShare+1e-9),Math.max(0,total-FLOOR));
 // Même plan, effectif décalé de `delta` : chaque profil garde sa part, les Errants prennent le reste.
 function shift(plan,delta){
  const total=plan.total+delta,composition={};let assigned=0;
  for(const kind of Object.keys(plan.composition)){if(kind==='walker')continue;const n=Math.floor(plan.composition[kind]*total/plan.total);composition[kind]=n;assigned+=n;}
  const out={};for(const kind of Object.keys(plan.composition))out[kind]=kind==='walker'?total-assigned:composition[kind];
  return{...plan,total,composition:out};
 }
 const gather=plan=>shift(plan,gain(plan.total));
 const disperse=plan=>shift(plan,-cut(plan.total));
 const percent=n=>Math.round(n*100)+' %';
 const contacts=n=>n+' contact'+(n>1?'s':'');
 function install(g,doc=root.document){
  if(g.abominations217)return g.abominations217;if(!g.expansions)throw Error('Installer les opérations avant les vagues menées 217.');
  let state=initial(),ref=null,seenPhase=null,clock=-Infinity,node=null,title=null,text=null,shown=null;
  const forget=()=>{ref=null;seenPhase=null;clock=-Infinity;shown=null;};
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const seed=()=>g.world?.seed??0;
  const current=()=>state.led&&state.led.wave===g.wave?state.led:null;
  // Le corps de la Meneuse tant qu'elle rassemble ; retrouvé par son identifiant après une reprise.
  function body(){
   const l=current();if(!l||l.status!=='alive'||!l.id)return null;
   if(ref&&ref.id===l.id&&(ref.dead||g.zombies.includes(ref)))return ref;
   ref=g.zombies.find(z=>z.id===l.id)||null;return ref;
  }
  // Estimation avant l'alerte : le plan que le moteur calculerait maintenant.
  const estimate=()=>C.wavePlan(g.wave,g.difficulty||C.DIFFICULTIES.standard,Number(g.signature)||0,g.balance217?.curve?.()||null).total;
  const say=(message,tone)=>g.notify?.(message,tone);
  function sync(){
   const l=current(),z=body();
   if(l&&z&&z.dead){
    l.status='slain';ref=null;
    say('Meneuse abattue '+post(seed(),l.wave).where+' : la horde ne se rassemblera pas. Environ '+contacts(cut(g.wavePlan&&g.phase==='warning'?g.wavePlan.total:estimate()))+' de moins à l’assaut.','good');
   }
  }
  // Création par le moteur lui-même, avec un flux à part : le flux du jeu n'avance pas d'un tirage.
  function appear(){
   if(typeof g.spawnZombie!=='function'||g.zombies.length>=C.PERFORMANCE_LIMITS.zombies||g.nextId>=MAX_ID)return false;
   const wave=g.wave,p=post(seed(),wave),random=g.random,count=g.zombies.length;let ok;
   g.random=new C.Random(hash(seed(),wave));
   try{ok=g.spawnZombie('walker');}finally{g.random=random;}
   const z=g.zombies[g.zombies.length-1];
   if(ok===false||g.zombies.length!==count+1||!z||z.kind!=='walker')return false;
   z.x=p.x;z.y=p.y;z.lastX=p.x;z.lastY=p.y;z.facing=Math.atan2(C.WORLD_SIZE/2-p.y,C.WORLD_SIZE/2-p.x);
   state.led={wave,id:z.id,status:'alive',delta:0};ref=z;
   const total=estimate();
   say('Vague '+wave+' menée : une Meneuse rassemble la horde '+p.where+', au bord de la carte. Vivante à l’assaut : environ '+contacts(gain(total))+' de plus. Abattue avant : environ '+contacts(cut(total))+' de moins.','danger');
   return true;
  }
  function tick(){
   if(!state.active||!playing())return;
   if(g.phase==='calm'&&led(g.wave,seed())&&!current())appear();
   sync();
   if(seenPhase!==null&&seenPhase!==g.phase&&g.phase==='warning'){
    const l=current();
    if(l?.status==='alive')say('Vague menée : la Meneuse tient toujours '+post(seed(),l.wave).where+'. Si elle vit à l’assaut, la horde comptera '+contacts(gain(g.wavePlan?.total||estimate()))+' de plus.','danger');
   }
   seenPhase=g.phase;
  }
  // Tant qu'elle rassemble, la Meneuse reste hors de la boucle des infectés : ni pas, ni coup, ni tirage.
  const zombies=g.updateZombies;
  if(typeof zombies==='function')g.updateZombies=function(...args){
   const z=state.active?body():null,index=z&&!z.dead?this.zombies.indexOf(z):-1;
   if(index<0)return zombies.apply(this,args);
   this.zombies.splice(index,1);
   try{return zombies.apply(this,args);}
   finally{if(!z.dead&&!this.zombies.includes(z))this.zombies.splice(Math.min(index,this.zombies.length),0,z);}
  };
  // L'assaut fixe l'effectif, une fois : avant que le moteur ne remplisse sa file et que la nuit ne soit comptée.
  const start=g.startAssault;
  if(typeof start==='function')g.startAssault=function(...args){
   if(state.active&&g.world&&led(g.wave,seed())){
    sync();
    if(!g.wavePlan)g.prepareWave();
    let l=current();if(!l)l=state.led={wave:g.wave,id:0,status:'alive',delta:0};
    if(l.status==='alive'||l.status==='slain'){
     const slain=l.status==='slain',before=g.wavePlan,plan=slain?disperse(before):gather(before),where=post(seed(),l.wave).where;
     g.wavePlan=plan;l.delta=plan.total-before.total;l.status=slain?'dispersed':'gathered';ref=null;
     if(slain)say('Meneuse abattue : la horde arrive dispersée, '+contacts(-l.delta)+' de moins ('+plan.total+' au lieu de '+before.total+').','good');
     else say('La Meneuse n’a pas été abattue : elle marche avec la horde '+where+', '+contacts(l.delta)+' de plus ('+plan.total+' au lieu de '+before.total+').','danger');
    }
   }
   return start.apply(this,args);
  };
  const update=g.update;
  if(typeof update==='function')g.update=function(...args){const result=update.apply(this,args);tick();return result;};
  // Vue de la Meneuse pour la présentation : nulle dès qu'elle ne rassemble plus.
  function leader(){
   const z=state.active?body():null;if(!z||z.dead)return null;
   const p=post(seed(),state.led.wave);return Object.freeze({wave:state.led.wave,id:z.id,side:p.side,name:p.name,x:z.x,y:z.y,health:z.health,maxHealth:z.maxHealth});
  }
  function line(){
   if(!state.active||!playing())return'';
   const l=current();
   if(l){
    const where=post(seed(),l.wave).where,total=g.wavePlan&&g.phase!=='calm'?g.wavePlan.total:estimate();
    if(l.status==='alive')return'Vague '+l.wave+' menée : Meneuse repérée '+where+', au bord de la carte. Vivante à l’assaut : environ '+contacts(gain(total))+' de plus. Abattue avant : environ '+contacts(cut(total))+' de moins.';
    if(l.status==='slain')return'Vague '+l.wave+' : Meneuse abattue. La horde arrivera dispersée, environ '+contacts(cut(total))+' de moins.';
    if(l.status==='gathered')return'Vague '+l.wave+' : la Meneuse n’a pas été abattue, elle marche avec la horde. '+contacts(l.delta)+' de plus.';
    return'Vague '+l.wave+' : Meneuse abattue avant l’assaut. '+contacts(-l.delta)+' de moins.';
   }
   const next=nextLed(g.wave,seed());
   return next===null?'':next===g.wave?'Vague '+next+' menée : la Meneuse n’a pas été repérée.':'Prochaine vague menée : vague '+next+'.';
  }
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : aucune de ses vagues n’est menée. La règle ne s’active pas en cours de campagne.',rows:[
    {label:'Règle',value:'Sans objet : vagues d’origine.'},{label:'Meneuse',value:'Sans objet.'}]};
   const l=state.led,next=g.world?nextLed(g.wave,seed()):null;
   let last='Aucune pour l’instant.';
   if(l&&(l.status==='gathered'||l.status==='dispersed'))last='Vague '+l.wave+' : '+(l.status==='gathered'?'non abattue, '+contacts(l.delta)+' de plus.':'abattue avant l’assaut, '+contacts(-l.delta)+' de moins.');
   return{summary:'Certaines vagues sont menées : une Meneuse, infectée d’apparence ordinaire, rassemble la horde depuis le bord de la carte pendant la journée qui précède. Ce n’est pas elle qui est dangereuse, c’est le nombre qu’elle amène. Cette règle vaut pour toute la campagne.',rows:[
    {label:'Règle',value:'À partir de la vague '+R.firstWave+', une vague sur '+R.every+', jamais une vague de géants. Meneuse vivante à l’assaut : +'+percent(R.gatherShare)+' d’infectés ordinaires. Abattue avant l’assaut : −'+percent(R.cutShare)+'. Ses points de vie sont ceux d’une Errante.'},
    {label:'Prochaine vague menée',value:next===null?'Aucune en vue.':'Vague '+next+(next===g.wave?' (celle qui vient).':'.')},
    {label:'Meneuse',value:line()||'Aucune en vue.'},
    {label:'L’atteindre',value:'Elle se tient hors de portée des défenses de la cité : sortie du Commandant ou tir à longue portée, avant l’assaut.'},
    {label:'Dernière vague menée',value:last}]};
  }
  // Marqueur sobre : un cercle fin et un mot, au sol et sur la carte réduite. Lecture seule.
  const ground=g.drawGround;
  if(typeof ground==='function')g.drawGround=function(...args){
   const result=ground.apply(this,args);
   try{
    const ctx=args[0],z=ctx&&playing()?leader():null;
    if(z&&typeof ctx.arc==='function'){
     ctx.save();ctx.strokeStyle='rgba(214,201,160,.8)';ctx.lineWidth=1.5;ctx.setLineDash?.([5,5]);ctx.beginPath();ctx.arc(z.x,z.y,26,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);
     ctx.fillStyle='rgba(214,201,160,.9)';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText?.('MENEUSE',z.x,z.y-34);ctx.restore();
    }
   }catch(error){/* le marqueur ne doit jamais interrompre le rendu */}
   return result;
  };
  const minimap=g.renderMinimap;
  if(typeof minimap==='function')g.renderMinimap=function(...args){
   const result=minimap.apply(this,args);
   try{
    const ctx=this.mctx,z=ctx&&this.minimap&&playing()?leader():null;
    if(z&&typeof ctx.arc==='function'){const sx=this.minimap.width/C.WORLD_SIZE,sy=this.minimap.height/C.WORLD_SIZE;ctx.save();ctx.strokeStyle='#d6c9a0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(z.x*sx,z.y*sy,4,0,Math.PI*2);ctx.stroke();ctx.restore();}
   }catch(error){/* idem */}
   return result;
  };
  // Ligne du dossier de situation, sous la lecture de siège quand elle existe.
  function render(){
   if(!doc?.createElement||!doc.getElementById)return false;
   const value=line();
   if(!node){
    const host=doc.getElementById('rightPanel');if(!host)return false;
    node=doc.createElement('section');node.id='abominations217Readout';node.className='siege-readout';node.setAttribute?.('aria-label','Vague menée');
    const card=doc.createElement('article');card.className='siege-readout-card';
    const small=doc.createElement('small');small.textContent='VAGUE MENÉE';title=doc.createElement('h3');title.id='abominations217Title';text=doc.createElement('p');text.id='abominations217Line';text.className='siege-readout-note';
    card.append?card.append(small,title,text):[small,title,text].forEach(n=>card.appendChild(n));node.appendChild(card);
    const box=doc.getElementById('siegeReadout');
    if(box&&box.parentNode===host&&typeof host.insertBefore==='function')host.insertBefore(node,box.nextSibling||null);else host.appendChild(node);
   }
   node.hidden=!value;
   if(value!==shown){shown=value;const l=current();title.textContent=l?(l.status==='alive'?'Meneuse '+post(seed(),l.wave).where:l.status==='slain'||l.status==='dispersed'?'Meneuse abattue':'Meneuse dans la horde'):'Aucune Meneuse en vue';text.textContent=value;}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;try{render();}catch(error){/* DOM partiel */}}return result;};
  const api=Object.freeze({active:()=>state.active,led:wave=>state.active&&Boolean(g.world)&&led(wave,seed()),next:()=>state.active&&g.world?nextLed(g.wave,seed()):null,
   leader,line,tick,render,overview,actions:()=>[],snapshot:()=>{if(state.active&&playing())sync();return validate(state);}});g.abominations217=api;
  g.expansions.register({id:'abominations217',title:'Vagues menées',overview,actions:api.actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);forget();},reset:()=>{state=fresh();forget();}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,hash,led,nextLed,post,gain,cut,shift,gather,disperse,install});root.DeadwallAbominations217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL,root.document);
})(globalThis);
