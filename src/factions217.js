/* Factions (docs/GAME_BIBLE.md §4), première tranche, NOUVELLES campagnes seulement. Deux factions de la bible :
   - Les Rouleurs (pillards) attaquent la chaîne, jamais le mur : ils barrent la route à un fourgon qui rentre chargé.
     Le barrage tombe tous les `period` retours chargés (compteur, aucun tirage). Il se passe sans tir : escorte de
     fusiliers près du fourgon, ou tribut versé d'avance ; sinon une part bornée du coffre est prise, carburant d'abord.
   - Les Relais (alliés) demandent de l'aide à vagues fixes. Donner depuis le stock, au dépôt, fait monter l'entente
     et rapporte plus tard une contrepartie annoncée, plus petite que le don.
   Un état de relation change par des actes, jamais par un menu. Ce module ne tire aucun hasard, ne touche ni à la
   génération du monde ni aux identifiants, et ne crée de stock qu'à la contrepartie d'un don déjà payé. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Factions217Rules,RAID=R.raid,RELAY=R.relay;
 const IDS=['rouleurs','relais'],NAMES={rouleurs:'Les Rouleurs',relais:'Les Relais'};
 const KEYS=['version','active','spotted','returns','exposed','passes','rep','affairs','relay'],STAGES=['none','open','owed'];
 const CODES={rouleurs:['spotted','robbed','deterred','passed','tribute'],relais:['asked','helped','returned','unanswered']};
 const MAX=1e6;
 function initial(){return{version:1,active:false,spotted:false,returns:0,exposed:false,passes:0,rep:{rouleurs:0,relais:0},affairs:{rouleurs:null,relais:null},relay:{index:0,stage:'none',wave:0}};}
 const fresh=()=>({...initial(),active:true});
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 const exact=(o,keys)=>Boolean(o)&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(o,k));
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Factions 217 invalides.');};
  if(!exact(raw,KEYS)||raw.version!==1||typeof raw.active!=='boolean'||typeof raw.spotted!=='boolean'||typeof raw.exposed!=='boolean'
   ||!int(raw.returns,0,MAX)||!int(raw.passes,0,RAID.maxPasses)||!exact(raw.rep,IDS)||!exact(raw.affairs,IDS)||!exact(raw.relay,['index','stage','wave']))bad();
  const out={version:1,active:raw.active,spotted:raw.spotted,returns:raw.returns,exposed:raw.exposed,passes:raw.passes,rep:{},affairs:{},relay:null};
  for(const id of IDS){
   if(!int(raw.rep[id],R.factions[id].min,R.factions[id].max))bad();out.rep[id]=raw.rep[id];
   const a=raw.affairs[id];
   if(a!==null&&(!exact(a,['code','amount','wave'])||!CODES[id].includes(a.code)||typeof a.amount!=='number'||!Number.isFinite(a.amount)||a.amount<0||a.amount>MAX||!int(a.wave,0,MAX)))bad();
   out.affairs[id]=a===null?null:{code:a.code,amount:a.amount,wave:a.wave};
  }
  const q=raw.relay;if(!int(q.index,0,MAX)||!STAGES.includes(q.stage)||!int(q.wave,0,MAX+RELAY.returnWaves))bad();
  out.relay={index:q.index,stage:q.stage,wave:q.wave};
  // Les Rouleurs ne sont connus qu'après un premier retour chargé ; rien ne se négocie avec des inconnus.
  if(!raw.spotted&&(raw.returns>0||raw.passes>0||raw.rep.rouleurs!==0||raw.affairs.rouleurs!==null))bad();
  if(raw.spotted!==(raw.returns>0)||q.stage==='none'&&q.wave!==0)bad();
  if(!raw.active&&JSON.stringify(out)!==JSON.stringify(initial()))bad();
  return out;
 }
 // Cinq états de la bible (§4.4), lus depuis la réputation ; aucune jauge chiffrée n'est montrée.
 function standing(id,rep,known=true){
  if(!IDS.includes(id)||!Number.isInteger(rep))throw Error('Faction inconnue.');
  if(!known)return'Inconnue';
  if(rep>=R.ententeAt)return'Entente';if(rep<=R.hostileAt)return'Hostile';if(rep<0)return'Tension';
  return id==='rouleurs'&&rep===0?'Repérée':'En contact';
 }
 // Le barrage tombe tous les `period` retours chargés : compteur de sorties, aucun tirage.
 const ambushAt=returns=>Number.isInteger(returns)&&returns>0&&returns%RAID.period===0;
 const untilAmbush=returns=>RAID.period-returns%RAID.period;
 // Part prise à un coffre : bornée par la part et par le plafond, carburant d'abord, jamais plus que le coffre.
 function toll(cargo,rep=0){
  const rule=rep<=R.hostileAt?RAID.hostile:RAID,taken=C.makeBag(),total=C.bagTotal(cargo);
  let left=Math.min(total*rule.share,rule.maxLoss);
  if(!(left>0)||!Number.isFinite(left))return{taken,total:0};
  let sum=0;
  for(const k of ['fuel',...C.RESOURCE_KEYS.filter(k=>k!=='fuel')]){const n=Math.min(left,Math.max(0,cargo[k]||0));taken[k]=n;left-=n;sum+=n;}
  return{taken,total:sum};
 }
 const request=index=>RELAY.requests[index%RELAY.requests.length];
 const requestWave=index=>RELAY.firstWave+index*RELAY.everyWaves;
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const bagText=bag=>C.RESOURCE_KEYS.filter(k=>bag[k]>0).map(k=>amount(bag[k])+' '+C.RESOURCE_META[k].label.toLowerCase()).join(', ');
 const live=e=>e&&!e.dead&&e.health>0;
 // « à Les Granges » se dit « aux Granges ».
 const to=name=>name.startsWith('Les ')?'aux '+name.slice(4):'à '+name,of=name=>name.startsWith('Les ')?'des '+name.slice(4):'de '+name;
 function install(g,doc){
  if(g.factions217)return g.factions217;if(!g.expansions)throw Error('Installer les opérations avant les factions.');
  let state=initial();
  const active=()=>state.active,wave=()=>int(g.wave,0,MAX)?g.wave:0;
  const setRep=(id,delta)=>{state.rep[id]=C.clamp(state.rep[id]+delta,R.factions[id].min,R.factions[id].max);};
  const affair=(id,code,n=0)=>{state.affairs[id]={code,amount:n,wave:wave()};};
  const vehicle=()=>{const v=g.expeditions?.car?.();return live(v)&&!v.regionAway?v:null;};
  const fromCore=p=>{const core=g.core?.();return core?Math.hypot(p.x-core.x,p.y-core.y):Infinity;};
  const escort=v=>g.units.filter(u=>live(u)&&u.kind==='soldier'&&!u.regionAbsent&&Math.hypot(u.x-v.x,u.y-v.y)<=RAID.escortRange).length;
  function atDepot(){
   const core=g.core(),p=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('factions217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!p?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.reach));
  }
  const DEPOT='Décidez-le au dépôt de D-17, à pied et les mains libres.';
  // Retour d'un fourgon chargé : l'affaire se règle sur la route, aux abords de la cité, avant le déchargement.
  function resolveReturn(v){
   state.exposed=false;
   if(C.bagTotal(v.cargo)<RAID.minCargo)return;
   state.returns=Math.min(MAX,state.returns+1);
   if(!state.spotted){state.spotted=true;affair('rouleurs','spotted');g.notify?.('Des motards ont suivi le fourgon à distance jusqu’aux abords de D-17. Les Rouleurs savent désormais qu’il rentre chargé.','danger');}
   if(!ambushAt(state.returns)){g.save(false);return;}
   if(state.passes>0){state.passes--;affair('rouleurs','passed');g.notify?.('Barrage des Rouleurs sur la route du retour : le tribut a été versé, ils laissent passer le fourgon.');}
   else if(escort(v)>=RAID.escortSoldiers){affair('rouleurs','deterred');g.notify?.('Barrage des Rouleurs sur la route du retour : devant l’escorte, ils dégagent la chaussée sans un tir.','good');}
   else{
    const t=toll(v.cargo,state.rep.rouleurs);for(const k of C.RESOURCE_KEYS)v.cargo[k]=Math.max(0,v.cargo[k]-t.taken[k]);
    setRep('rouleurs',-1);affair('rouleurs','robbed',t.total);
    g.notify?.('Fourgon intercepté par les Rouleurs sur la route du retour : '+bagText(t.taken)+' pris dans le coffre. Personne n’a tiré.','danger');
   }
   g.save(false);
  }
  function tickRoad(){
   const v=vehicle();if(!v){state.exposed=false;return;}
   const d=fromCore(v);
   if(!state.exposed){if(d>=RAID.awayDistance&&C.bagTotal(v.cargo)>=RAID.minCargo)state.exposed=true;}
   else if(d<=RAID.ambushDistance)resolveReturn(v);
  }
  const terms=q=>bagText(q.ask)+' ; contrepartie annoncée : '+bagText(q.back);
  function tickRelay(){
   const q=state.relay,w=wave(),req=request(q.index);
   if(q.stage==='none'){
    if(g.phase==='calm'&&w>=requestWave(q.index)){q.stage='open';q.wave=w;affair('relais','asked',q.index);
     g.notify?.(req.relay+' demande de l’aide : '+terms(req)+', '+RELAY.returnWaves+' vagues après le don. Réponse au dépôt avant la fin de la vague.');g.save(false);}
   }else if(q.stage==='open'){
    if(w>=q.wave+RELAY.openWaves){setRep('relais',-1);affair('relais','unanswered',q.index);q.stage='none';q.wave=0;q.index++;
     g.notify?.(req.relay+' n’a rien reçu de D-17. Le relais s’est débrouillé seul ; il s’en souviendra.');g.save(false);}
   }else if(g.phase==='calm'&&w>=q.wave&&C.RESOURCE_KEYS.every(k=>!(req.back[k]>0)||g.storage-g.resources[k]>=req.back[k])){
    for(const k of C.RESOURCE_KEYS)if(req.back[k]>0)g.resources[k]+=req.back[k];
    affair('relais','returned',q.index);q.stage='none';q.wave=0;q.index++;
    g.notify?.(req.relay+' tient parole : '+bagText(req.back)+' livrés au dépôt.','good');g.save(false);
   }
  }
  function tick(dt){if(!active()||!(dt>0)||g.state!=='playing'||g.gameOver)return;tickRoad();tickRelay();}
  function helpQuote(){
   if(!active())return{ok:false,reason:'Cette campagne ne connaît pas les factions.'};
   if(state.relay.stage!=='open')return{ok:false,reason:'Aucun relais ne demande d’aide en ce moment.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   const req=request(state.relay.index);
   return C.canAfford(g.resources,req.ask)?{ok:true}:{ok:false,reason:'Stock insuffisant : '+bagText(req.ask)+' demandés.'};
  }
  function help(){
   const quote=helpQuote();if(!quote.ok)return quote;
   const q=state.relay,req=request(q.index);
   C.spend(g.resources,req.ask);setRep('relais',1);affair('relais','helped',q.index);q.stage='owed';q.wave=wave()+RELAY.returnWaves;
   g.notify?.('Aide envoyée '+to(req.relay)+' : '+bagText(req.ask)+'. Contrepartie promise à la vague '+q.wave+' : '+bagText(req.back)+'.','good');
   g.audio?.ui?.();g.save(false);return{ok:true};
  }
  function tributeQuote(){
   if(!active())return{ok:false,reason:'Cette campagne ne connaît pas les factions.'};
   if(!state.spotted)return{ok:false,reason:'Personne n’a encore approché le fourgon.'};
   if(state.passes>=RAID.maxPasses)return{ok:false,reason:'Le prochain barrage est déjà payé.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   return C.canAfford(g.resources,RAID.tribute)?{ok:true}:{ok:false,reason:'Stock insuffisant : '+bagText(RAID.tribute)+' exigés.'};
  }
  function tribute(){
   const quote=tributeQuote();if(!quote.ok)return quote;
   C.spend(g.resources,RAID.tribute);state.passes++;setRep('rouleurs',1);affair('rouleurs','tribute',C.bagTotal(RAID.tribute));
   g.notify?.('Tribut laissé au carrefour pour les Rouleurs : '+bagText(RAID.tribute)+'. Le prochain barrage laissera passer le fourgon.');
   g.audio?.ui?.();g.save(false);return{ok:true};
  }
  const AFFAIRS={
   spotted:()=>'des motards ont suivi le fourgon jusqu’aux abords de la cité',
   robbed:a=>'fourgon intercepté, '+amount(a.amount)+' unités prises dans le coffre',
   deterred:()=>'barrage levé devant l’escorte, sans un tir',
   passed:()=>'barrage franchi, tribut honoré',
   tribute:a=>'tribut versé ('+amount(a.amount)+' carburant)',
   asked:a=>request(a.amount).relay+' demande '+bagText(request(a.amount).ask),
   helped:a=>'aide envoyée '+to(request(a.amount).relay),
   returned:a=>request(a.amount).relay+' a tenu parole : '+bagText(request(a.amount).back)+' livrés',
   unanswered:a=>'la demande '+of(request(a.amount).relay)+' est restée sans réponse'
  };
  const lastAffair=id=>{const a=state.affairs[id];return a?'Vague '+a.wave+' : '+AFFAIRS[a.code](a)+'.':'Aucune affaire pour l’instant.';};
  const standingOf=id=>standing(id,state.rep[id],id!=='rouleurs'||state.spotted);
  function roadLine(){
   const parade='Parade : '+RAID.escortSoldiers+' fusiliers près du fourgon aux abords de la cité, ou tribut versé d’avance ('+bagText(RAID.tribute)+'). Un coffre de moins de '+RAID.minCargo+' unités ne les intéresse pas.';
   if(!state.spotted)return'Route du retour libre pour l’instant. Un fourgon qui rentre chargé finit par être remarqué.';
   const n=untilAmbush(state.returns),rule=state.rep.rouleurs<=R.hostileAt?RAID.hostile:RAID,when=n===1?'Barrage attendu au prochain retour chargé':'Barrage attendu dans '+n+' retours chargés';
   if(state.passes>0)return when+' ; tribut déjà versé, le fourgon passera.';
   return when+' : jusqu’à '+Math.round(rule.share*100)+' % du coffre, '+rule.maxLoss+' unités au plus, carburant d’abord. '+parade;
  }
  function relayLine(){
   const q=state.relay,req=request(q.index);
   if(q.stage==='open')return req.relay+' demande '+terms(req)+', '+RELAY.returnWaves+' vagues après le don. À donner au dépôt avant la fin de la vague '+(q.wave+RELAY.openWaves-1)+'.';
   if(q.stage==='owed')return req.relay+' doit '+bagText(req.back)+(wave()>=q.wave?' : livraison dès que le dépôt a la place.':' à la vague '+q.wave+'.');
   return'Prochaine demande attendue vers la vague '+Math.max(requestWave(q.index),wave())+'.';
  }
  function overview(){
   if(!active())return{summary:'Cette campagne a commencé avant l’arrivée des factions : les routes de D-17 restent celles d’avant.',rows:[{label:'Factions',value:'Absentes de cette campagne'}]};
   return{summary:'Hors des murs, d’autres vivants. Ils sont peu nombreux et ne menacent jamais l’enceinte : ils pèsent sur les routes et sur la parole donnée.',
    rows:[{label:NAMES.rouleurs,value:state.spotted?standingOf('rouleurs')+' — bande motorisée qui vit du carburant des autres. Dernière affaire : '+lastAffair('rouleurs'):'Inconnue — personne n’a encore été vu sur les routes.'},
     {label:'Route du retour',value:roadLine()},
     {label:NAMES.relais,value:standingOf('relais')+' — hameaux alliés tenus par quelques familles. Dernière affaire : '+lastAffair('relais')},
     {label:'Demande des relais',value:relayLine()}]};
  }
  function actions(){
   if(!active())return[];
   const list=[];
   if(state.relay.stage==='open'){const req=request(state.relay.index),q=helpQuote();list.push({id:'help',label:'Aider '+req.relay,description:'Don : '+bagText(req.ask)+', pris au stock. Contrepartie annoncée : '+bagText(req.back)+', '+RELAY.returnWaves+' vagues plus tard.',disabled:!q.ok,reason:q.reason||'L’entente avec les Relais progresse.',run:help});}
   if(state.spotted){const q=tributeQuote();list.push({id:'tribute',label:'Verser le tribut aux Rouleurs',description:'Coût : '+bagText(RAID.tribute)+', pris au stock. Le prochain barrage laisse passer le fourgon, sans tir ni perte.',disabled:!q.ok,reason:q.reason||'Vaut pour un seul barrage.',run:tribute});}
   return list;
  }
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  // Carte du panneau de droite : lecture seule de l'état ci-dessus.
  doc=doc||root.document;
  let card=null,key='';
  function mount(){
   const host=doc?.getElementById?.('rightPanel');if(!host||typeof doc.createElement!=='function')return null;
   const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
   const box=el('section',undefined,'siege-readout factions217');box.id='factions217Card';box.setAttribute?.('aria-label','Factions hors de D-17');
   const parts={};
   for(const id of IDS){const art=el('article',undefined,'siege-readout-card'),title=el('h3'),last=el('p'),note=el('p',undefined,'siege-readout-effect');
    title.id='factions217-'+id;art.append(el('small',id==='rouleurs'?'FACTIONS · PILLARDS':'FACTIONS · ALLIÉS'),title,last,note);box.append(art);parts[id]={title,last,note};}
   const anchor=doc.getElementById('siegeReadout'),next=anchor&&anchor.parentNode===host?anchor.nextSibling:host.firstChild;
   if(next&&typeof host.insertBefore==='function')host.insertBefore(box,next);else host.appendChild(box);
   return{box,parts};
  }
  function render(){
   if(!card)card=mount();if(!card)return false;
   const show=active()&&g.state==='playing';card.box.hidden=!show;if(!show)return false;
   const lines={rouleurs:[(state.spotted?NAMES.rouleurs:'Sur les routes')+' · '+standingOf('rouleurs'),'Dernière affaire — '+lastAffair('rouleurs'),roadLine()],relais:[NAMES.relais+' · '+standingOf('relais'),'Dernière affaire — '+lastAffair('relais'),relayLine()]};
   const now=JSON.stringify(lines);if(now===key)return true;key=now;
   for(const id of IDS){const p=card.parts[id];p.title.textContent=lines[id][0];p.last.textContent=lines[id][1];p.note.textContent=lines[id][2];}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);render();return result;};
  const api=Object.freeze({active,standing:standingOf,reputation:id=>state.rep[id],lastAffair,returns:()=>state.returns,passes:()=>state.passes,request:()=>state.relay.stage==='none'?null:{...request(state.relay.index),stage:state.relay.stage,wave:state.relay.wave},
   helpQuote,help,tributeQuote,tribute,tick,render,overview,actions,snapshot:()=>validate(state)});g.factions217=api;
  g.expansions.register({id:'factions217',title:'Factions',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);key='';},reset:()=>{state=fresh();key='';}});
  return api;
 }
 const api=Object.freeze({IDS:Object.freeze([...IDS]),initial,validate,standing,ambushAt,untilAmbush,toll,request,requestWave,install});root.DeadwallFactions217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL,root.document);
})(globalThis);
