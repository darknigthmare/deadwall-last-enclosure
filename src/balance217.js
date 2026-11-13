/* Équilibrage 217 (docs/GAME_BIBLE.md §1.2 et §11.3) : deux règles pour les NOUVELLES campagnes seulement.
   - Signature sans plafond : identique à la courbe d'origine tant que l'attirance reste sous +80 % ; au-delà elle
     continue de monter, de plus en plus lentement. Le plan de vague reste calculé par `C.wavePlan`, une fois par vague.
   - Moral par paliers : le moral ralentit le déplacement des unités, le travail des ouvriers et la cadence de tir des
     fusiliers ; très bas et durable, il fait partir des ouvriers, un à la fois, après annonce.
   Une campagne commencée avant ces règles garde la courbe plafonnée et le seul ×0,82 sous 20 de moral, sans
   activation possible. Ce module ne crée aucune ressource et ne tire aucun hasard ; le retrait d'un ouvrier est
   celui de l'eau de cité (src/city-water215.js), jamais recopié ici. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Balance217Rules,S=R.signature,M=R.morale,D=M.depart;
 const KEYS=['version','signatureCurve','moraleTiers','low','departs'],CURVES=['legacy','open'],MAX_LOW=1e9;
 function initial(){return{version:1,signatureCurve:'legacy',moraleTiers:false,low:0,departs:0};}
 function fresh(){return{version:1,signatureCurve:'open',moraleTiers:true,low:0,departs:0};}
 // Échéances de départ atteintes après `low` secondes continues de moral très bas.
 function departSlots(low){return low<D.seconds?0:Math.floor((low-D.seconds)/D.interval)+1;}
 function validate(raw){
  if(raw===undefined)return initial();
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||!CURVES.includes(raw.signatureCurve)||typeof raw.moraleTiers!=='boolean'
   ||typeof raw.low!=='number'||!Number.isFinite(raw.low)||raw.low<0||raw.low>MAX_LOW||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k))
   ||!Number.isInteger(raw.departs)||raw.departs<0||raw.departs>departSlots(raw.low)||!raw.moraleTiers&&(raw.low>0||raw.departs>0))throw Error('Équilibrage 217 invalide.');
  return{version:1,signatureCurve:raw.signatureCurve,moraleTiers:raw.moraleTiers,low:raw.low,departs:raw.departs};
 }
 // Attirance d'une signature (0,8 = +80 % d'infectés). Sous le plafond hérité, les deux courbes sont la même
 // expression, au flottant près ; au-delà, seule la courbe ouverte continue.
 function attraction(signature,curve='open'){
  if(!CURVES.includes(curve))throw Error('Courbe de signature inconnue.');
  const base=C.clamp(signature/S.divisor,0,S.cap);
  if(curve!=='open'||!(base>=S.cap)||!Number.isFinite(signature))return base;
  return S.cap+S.gain*Math.log1p(Math.max(0,signature-S.cap*S.divisor)/S.scale);
 }
 const open=signature=>attraction(signature,'open');
 // Palier de moral : le premier, du plus haut au plus bas, dont le seuil est atteint.
 function tier(morale){return M.tiers.find(t=>morale>=t.min)||M.tiers[M.tiers.length-1];}
 const number=n=>String(Math.round(n*100)/100).replace('.',','),percent=n=>'+'+Math.round(n*100)+' %';
 const TIER_TEXT=M.tiers.map((t,i)=>(i===0?t.min+' et plus':i===M.tiers.length-1?'moins de '+M.tiers[i-1].min:t.min+' à '+M.tiers[i-1].min)+' : ×'+number(t.factor)).join(' · ');
 const SLOWED='déplacement des unités, travail des ouvriers (récolte, chantiers, déblaiement) et cadence de tir des fusiliers';
 function install(g){
  if(g.balance217)return g.balance217;if(!g.expansions)throw Error('Installer les opérations avant l’équilibrage 217.');
  let state=initial();
  const tiers=()=>state.moraleTiers,morale=()=>Number(g.morale)||0;
  // Courbe à passer à `C.wavePlan` : nulle pour une campagne ancienne, qui garde la courbe du moteur.
  const curve=()=>state.signatureCurve==='open'?open:null;
  // Déplacement : nul pour une campagne ancienne, le moteur garde alors sa propre règle (×0,82 sous 20).
  const moveFactor=()=>tiers()?tier(morale()).factor:null;
  // Travail des ouvriers et cadence de tir des fusiliers : 1 pour une campagne ancienne.
  const effort=()=>tiers()?tier(morale()).factor:1;
  const canDepart=()=>typeof g.cityWater215?.departWorker==='function';
  // Une pénurie d'eau qui pèse déjà sur le moral a son propre échéancier de départs et de morts
  // (src/city-water215.js, temps 2 et suivants) : la même cause ne fait pas partir deux fois.
  const drought=()=>(g.cityWater215?.stage?.()||0)>=2;
  function tick(dt){
   if(!tiers()||!(dt>0)||g.state!=='playing'||g.gameOver)return;
   if(!(morale()<D.below)){
    if(state.low>=D.warnSeconds)g.notify?.('Moral : la cité se reprend. Plus personne ne parle de partir.','good');
    state.low=0;state.departs=0;return;
   }
   if(drought())return;
   const before=state.low;state.low=Math.min(MAX_LOW,before+dt);
   // L'annonce est liée au franchissement du seuil : une reprise au-delà ne la rejoue pas.
   if(before<D.warnSeconds&&state.low>=D.warnSeconds)g.notify?.('Moral au plus bas : des habitants parlent de quitter la cité. Les premiers départs suivront si le moral ne remonte pas.','danger');
   // Une échéance, un ouvrier au plus : un pas de temps long ne provoque jamais plusieurs départs.
   const due=departSlots(state.low);
   if(due>state.departs){state.departs=due;if(canDepart())g.cityWater215.departWorker('Moral au plus bas : un ouvrier a quitté la cité.');}
  }
  function overview(){
   const signature=Number(g.signature)||0,pull=attraction(signature,state.signatureCurve),m=morale(),t=tier(m),wait=at=>C.formatTime(Math.max(0,at-state.low));
   const legacyMove=m<20?'déplacement des unités ×0,82':'aucun ralentissement';
   let departs;
   if(!tiers())departs='Sans objet : règle d’origine.';
   else if(!canDepart())departs='Aucun : cette cité ne connaît pas les départs.';
   else if(drought())departs='Suspendus : la pénurie d’eau a son propre échéancier de départs.';
   else if(!(m<D.below))departs='Aucun tant que le moral reste à '+D.below+' ou plus. En dessous pendant '+C.formatTime(D.seconds)+' de suite, un ouvrier part, puis un autre toutes les '+C.formatTime(D.interval)+'.';
   else if(state.low<D.warnSeconds)departs='Moral sous '+D.below+' depuis '+C.formatTime(state.low)+'. Annonce dans '+wait(D.warnSeconds)+', premier départ dans '+wait(D.seconds)+' si le moral ne remonte pas.';
   else departs='Moral sous '+D.below+' depuis '+C.formatTime(state.low)+'. Prochain départ dans '+wait(D.seconds+state.departs*D.interval)+' si le moral ne remonte pas. Le dernier ouvrier ne part jamais.';
   const modern=state.signatureCurve==='open'&&tiers();
   return{summary:modern?'La signature attire sans plafond et le moral ralentit la cité par paliers. Ces règles valent pour toute la campagne.'
     :'Cette campagne a commencé avant ces règles : elle garde l’attirance plafonnée et le moral d’origine. Elles ne s’activent pas en cours de campagne.',
    rows:[
     {label:'Courbe de signature',value:state.signatureCurve==='open'?'Sans plafond : identique à l’ancienne jusqu’à '+percent(S.cap)+', puis toujours croissante, de plus en plus lentement.':'Plafonnée à '+percent(S.cap)+', atteints à une signature de '+Math.round(S.cap*S.divisor)+'.'},
     {label:'Attirance actuelle',value:percent(pull)+' d’infectés pour une signature de '+Math.round(signature)+'.'},
     {label:'Moral',value:Math.floor(m)+' / 100 · '+(tiers()?(t.factor<1?SLOWED+' ×'+number(t.factor):'aucun ralentissement'):legacyMove)},
     {label:'Paliers de moral',value:tiers()?TIER_TEXT:'Règle d’origine : déplacement ×0,82 sous 20 de moral, rien au-dessus.'},
     {label:'Départs',value:departs}
    ]};
  }
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  const api=Object.freeze({curve,curveName:()=>state.signatureCurve,moraleTiers:tiers,attraction:()=>attraction(Number(g.signature)||0,state.signatureCurve),
   tier:()=>tier(morale()),moveFactor,effort,tick,overview,actions:()=>[],snapshot:()=>validate(state)});g.balance217=api;
  g.expansions.register({id:'balance217',title:'Signature et moral',overview,actions:api.actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);},reset:()=>{state=fresh();}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,attraction,tier,departSlots,install});root.DeadwallBalance217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
