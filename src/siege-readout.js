// Lecture de siège (docs/GAME_BIBLE.md §7.4 et §8.1) : signature expliquée et bilan de la dernière nuit.
// Présentation seulement : ce module lit des valeurs déjà calculées par leurs propriétaires.
// Il ne modifie aucun stock, aucune règle, aucun tirage et aucune sauvegarde.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallSiegeReadout=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const REFRESH_SECONDS=.5;
 const whole=value=>Math.max(0,Math.round(Number(value)||0));
 // Les parts de la signature, dans les termes du calcul de `refreshMetrics` : les quatre du moteur, puis celle des règles de cité.
 const part=owner=>{try{const n=Number(owner?.signature?.());return Number.isFinite(n)&&n>0?n:0;}catch(error){return 0;}};
 function signatureParts(g){
  const parts=[
   {key:'buildings',label:'Bâtiments achevés',value:Number(g.cityScore)||0},
   {key:'population',label:'Population',value:(Number(g.population)||0)*2},
   {key:'power',label:'Consommation électrique',value:(Number(g.powerUsed)||0)*2},
   {key:'structures',label:'Nombre de structures',value:(g.world?.buildings?.size||0)*.35},
   // Cinquième part : ce que les règles de cité ajoutent au calcul du moteur, lu chez leurs propriétaires
   // (grands ouvrages achevés, src/great-works217.js ; bûcher allumé, src/corpse-chain217.js).
   {key:'works',label:'Grands ouvrages et bûcher',value:part(g.greatWorks217)+part(g.corpseChain217)}
  ];
  return Object.freeze({total:Number(g.signature)||0,parts:Object.freeze(parts.map(Object.freeze))});
 }
 // L'effet sur la horde est lu dans le plan de vague du moteur, sans recopier sa formule.
 function hordeEffect(C,g){
  const wave=Math.max(1,Math.floor(Number(g.wave)||1)),difficulty=g.difficulty||C.DIFFICULTIES.standard;
  // Courbe de la campagne (src/balance217.js) ; absente, le moteur applique la courbe héritée.
  const curve=g.balance217?.curve?.()||null;
  const quiet=C.wavePlan(wave,difficulty,0,curve).total,actual=C.wavePlan(wave,difficulty,Number(g.signature)||0,curve).total;
  return Object.freeze({wave,quiet,actual,extra:Math.max(0,actual-quiet),percent:quiet>0?Math.max(0,Math.round((actual/quiet-1)*100)):0});
 }
 // Vague menée (src/abominations217.js) : l'effectif réel, lu dans sa prévision. Fourchette tant que rien n'est décidé.
 const people=n=>whole(n)+' infecté'+(whole(n)>1?'s':'');
 function ledSentence(f){
  if(!f||!Number.isFinite(f.plan))return '';
  const guard=f.escort?', dont '+f.escort+' de l’escorte déjà sur place':'';
  if(f.decided){
   const change=f.status==='gathered'?'+'+whole(f.real-f.plan)+' rassemblés par la Meneuse':'−'+whole(f.plan-f.real)+', Meneuse abattue avant l’assaut';
   return 'Vague '+f.wave+' menée : '+people(f.real)+' en tout ('+whole(f.plan)+' au plan, '+change+')'+(f.escort?', dont '+whole(f.real-f.entering)+' de l’escorte déjà sur place':'')+'.';
  }
  if(f.status==='slain')return 'Vague '+f.wave+' menée : Meneuse abattue, '+people(f.slain)+' attendus au lieu de '+whole(f.plan)+guard+'.';
  return 'Vague '+f.wave+' menée : '+people(f.alive)+' si la Meneuse vit à l’assaut, '+whole(f.slain)+' si elle tombe ('+whole(f.plan)+' au plan'+guard+').';
 }
 // Siège adossé (O7, terrain de génération 12 seulement) : côtés à tenir, puis passage et largeur de chaque front de la
 // vague annoncée, repli et plafond d'entrée, lus chez le jeu (`openSiegeState217`) et dans `C.OpenSiege217`.
 const SIDE_NAMES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'});
 const joined=list=>list.join(', ').replace(/, ([^,]*)$/,' et $1');
 function frontsSentence(C,g){
  const sides=g?.world?.terrain217?.sides,O=C?.OpenSiege217;if(!sides||!O)return '';
  const open=O.open(sides),metres=f=>whole(sides[f].width)+' m';
  if(!open.length)return 'Aucun côté ouvert : la cité n’a pas de front.';
  if(g.phase==='warning'||g.phase==='assault'){
   let state=null;try{state=g.openSiegeState217?.()||null;}catch(error){state=null;}
   const fronts=(state?.fronts||g.fronts||[]).filter(f=>open.includes(f));if(!fronts.length)return '';
   let text='Vague '+Math.max(1,Math.floor(Number(g.wave)||1))+' par '+joined(fronts.map(f=>O.label(f,sides[f])+' ('+metres(f)+')'));
   if(state?.folded)text+=' — plan de '+state.asked+' fronts replié sur '+fronts.length+', même effectif';
   const rate=O.rate(fronts,sides),interval=Number(g.wavePlan?.spawnInterval)||0;
   if(Number.isFinite(rate)&&1/rate>interval)text+=' ; entrée plafonnée à '+(Math.round(rate*10)/10)+' par seconde, le reste attend au pied';
   return text+'.';
  }
  const closed=O.SIDES.filter(f=>!open.includes(f));
  return 'Côtés à tenir : '+joined(open.map(f=>O.label(f,sides[f])+' ('+metres(f)+')'))+(closed.length?' ; clos : '+joined(closed.map(f=>SIDE_NAMES[f]+(sides[f]?.cause==='eau'?' (eau)':' (falaise)'))):'')+'.';
 }
 function ledForecast(g){try{return g.abominations217?.forecast?.()||null;}catch(error){return null;}}
 function lastNight(g){
  const history=g.citadel?.snapshot?.()?.history;
  if(!Array.isArray(history)||!history.length)return null;
  const night=history[history.length-1];
  return night&&night.metrics?night:null;
 }
 function nightLines(C,night){
  const m=night.metrics;
  return [
   ['Durée',C.formatTime(night.seconds)],
   ['Infectés éliminés',whole(m.kills)],
   ['Équipiers perdus',whole(m.unitsLost)],
   ['Structures perdues',whole(m.buildingsLost)],
   ['Tirs du commandant',whole(m.shots)]
  ];
 }
 function nightSentence(night){
  const m=night.metrics,parts=[whole(m.kills)+' éliminé'+(whole(m.kills)>1?'s':'')];
  parts.push(whole(m.unitsLost)?whole(m.unitsLost)+' équipier'+(whole(m.unitsLost)>1?'s':'')+' perdu'+(whole(m.unitsLost)>1?'s':''):'aucune perte');
  parts.push(whole(m.buildingsLost)?whole(m.buildingsLost)+' structure'+(whole(m.buildingsLost)>1?'s':'')+' perdue'+(whole(m.buildingsLost)>1?'s':''):'aucune structure perdue');
  return 'Bilan de la vague '+night.wave+' : '+parts.join(', ')+'.';
 }
 function install(g,doc){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
  if(!g||!doc?.body||!C?.wavePlan||g.siegeReadout)return false;
  const host=doc.getElementById('rightPanel');if(!host)return false;
  const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
  const write=(node,text)=>{const value=String(text);if(node.textContent!==value)node.textContent=value;};
  const box=el('section',undefined,'siege-readout');box.id='siegeReadout';box.setAttribute('aria-label','Signature de la cité et bilan de la dernière nuit');
  const signature=el('article',undefined,'siege-readout-card');signature.id='siegeReadoutSignature';
  const sigTitle=el('h3'),sigEffect=el('p',undefined,'siege-readout-effect'),sigLed=el('p',undefined,'siege-readout-effect'),sigList=el('dl'),sigNote=el('p','Plus la cité grandit, consomme et s’étend, plus elle se voit de loin : les hordes grossissent avec elle.','siege-readout-note');
  sigTitle.id='siegeReadoutSignatureTitle';sigEffect.id='siegeReadoutEffect';sigLed.id='siegeReadoutLed';sigLed.hidden=true;
  const sigRows=new Map();
  for(const part of signatureParts(g).parts){const dt=el('dt',part.label),dd=el('dd','0');sigList.append(dt,dd);sigRows.set(part.key,dd);}
  signature.append(el('small','SIGNATURE DE LA CITÉ'),sigTitle,sigEffect,sigLed,sigList,sigNote);
  const night=el('article',undefined,'siege-readout-card');night.id='siegeReadoutNight';
  const nightTitle=el('h3'),nightList=el('dl');nightTitle.id='siegeReadoutNightTitle';
  night.append(el('small','DERNIÈRE NUIT'),nightTitle,nightList);
  box.append(signature,night);
  // En tête du dossier de situation : c'est la première chose lue à son ouverture.
  if(host.firstChild&&typeof host.insertBefore==='function')host.insertBefore(box,host.firstChild);else host.appendChild(box);
  let clock=0,nightKey='',announced=0,primed=false,phase=null,last=null,sigFronts=null;
  function render(){
   const playing=g.state==='playing';box.hidden=!playing;if(!playing)return false;
   const sig=signatureParts(g),effect=hordeEffect(C,g);
   write(sigTitle,String(whole(sig.total)));
   write(sigEffect,effect.extra>0?'Vague '+effect.wave+' : +'+effect.percent+' % d’infectés, soit '+effect.extra+' de plus ('+effect.actual+' au lieu de '+effect.quiet+').':'Vague '+effect.wave+' : aucun infecté supplémentaire pour l’instant ('+effect.actual+').');
   const led=ledSentence(ledForecast(g));write(sigLed,led);sigLed.hidden=!led;
   // Ligne des fronts : créée au premier terrain qui en a ; une carte plate n'en reçoit jamais.
   const fronts=frontsSentence(C,g);
   if(fronts&&!sigFronts){sigFronts=el('p',undefined,'siege-readout-effect');sigFronts.id='siegeReadoutFronts';if(typeof signature.insertBefore==='function'&&sigList.parentNode===signature)signature.insertBefore(sigFronts,sigList);else signature.appendChild(sigFronts);}
   if(sigFronts){write(sigFronts,fronts);sigFronts.hidden=!fronts;}
   for(const part of sig.parts)write(sigRows.get(part.key),whole(part.value));
   // Le registre des nuits n'est relu qu'au changement de phase : il n'évolue qu'à ce moment.
   if(phase!==g.phase||!primed){phase=g.phase;last=lastNight(g);}
   const key=last?JSON.stringify(last):'';
   if(key!==nightKey){
    nightKey=key;nightList.replaceChildren();
    if(last){for(const [label,value]of nightLines(C,last))nightList.append(el('dt',label),el('dd',value));}
   }
   night.classList.toggle('siege-readout-empty',!last);
   write(nightTitle,last?'Vague '+last.wave+' · '+(last.outcome==='secured'?'sécurisée':'cité tombée')+(last.partial?' · relevé partiel':''):'Le premier bilan paraîtra après une sécurisation.');
   // Annonce une seule fois chaque nouvelle nuit sécurisée ; une campagne reprise ne répète pas l'ancienne.
   if(!primed){primed=true;announced=last?last.wave:0;}
   else if(last&&last.wave>announced){announced=last.wave;if(last.outcome==='secured')g.notify(nightSentence(last),whole(last.metrics.unitsLost)||whole(last.metrics.buildingsLost)?'normal':'good');}
   else if(!last)announced=0;
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;render();}return result;};
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);primed=false;phase=null;nightKey='\u0000';clock=-Infinity;render();return result;};}
  g.siegeReadout=Object.freeze({render,signature:()=>signatureParts(g),effect:()=>hordeEffect(C,g),lastNight:()=>lastNight(g),led:()=>ledSentence(ledForecast(g)),fronts:()=>frontsSentence(C,g)});
  render();return true;
 }
 return Object.freeze({install,signatureParts,hordeEffect,nightSentence,ledSentence,frontsSentence});
});
