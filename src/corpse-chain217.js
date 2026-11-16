/* Filière des corps et maladie (docs/GAME_BIBLE.md §8.7), première tranche, pour les NOUVELLES campagnes seulement.
   La charge de corps au pied d'un mur garde ses règles ; la filière commence après le déblaiement :
   - un corps retiré d'un mur ou d'un fossé, par un ouvrier ou par le Commandant, reste « à traiter » ;
   - le bûcher les consume vite contre du bois ou du carburant, et sa fumée porte loin (signature tant qu'il brûle) ;
   - la fosse les ensevelit lentement, sans combustible ni signature ; pleine, elle se referme, il faut en ouvrir une autre ;
   - des corps laissés (à traiter + charge au pied des murs) au-delà d'un seuil rendent la cité malade, par paliers annoncés
     d'avance, comme la pénurie d'eau (src/city-water215.js) : le moral baisse, des habitants tombent malades, puis les
     plus fragiles meurent par `g.damageUnit`, le chemin de mort ordinaire. Les médicaments évitent une mort.
   Cette maladie est celle des charniers ; elle n'a rien à voir avec ce qui relève les morts.
   Bûcher et fosse sont des emplacements tenus par ce module, près du dépôt : aucun bâtiment n'est posé.
   La Nécropole achevée (src/great-works217.js, lue par `corpses()`) hâte le bûcher et agrandit les fosses : un corps n'y
   prend qu'une part de place. Le remplissage reste compté en places de la fosse ordinaire, donc la sauvegarde ne change pas.
   Ce module ne crée aucune ressource et ne tire aucun hasard. La carte et les repères dessinés ne font que lire l'état. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CorpseChain217Rules,P=R.pyre,F=R.pit,S=R.sickness,W=R.weather;
 const START=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.startAge].name);
 const KEYS=['version','active','pending','burned','buried','pyre','pitLeft','pitOpen','pitFill','pitsClosed','exposure','sick','deaths','ill','died','saved'];
 const FUELS=Object.keys(P.cost),FUEL_NAMES={wood:'bois',fuel:'carburant'},MAX=1e9,MAX_COUNT=1e6,EPS=1e-9,REFRESH_SECONDS=.5,MARK_DROP=112;
 function initial(){return{version:1,active:false,pending:0,burned:0,buried:0,pyre:null,pitLeft:0,pitOpen:false,pitFill:0,pitsClosed:0,exposure:0,sick:0,deaths:0,ill:0,died:0,saved:0};}
 // Échéances atteintes après `e` secondes d'exposition continue. Les nouveaux malades cessent quand les morts commencent.
 function sickSlots(e){return e<S.sickSeconds?0:Math.floor((Math.min(e,S.deathSeconds-1e-6)-S.sickSeconds)/S.sickInterval)+1;}
 function deathSlots(e){return e<S.deathSeconds?0:Math.floor((e-S.deathSeconds)/S.deathInterval)+1;}
 // 0 : salubre · 1 : seuil dépassé, délai de grâce · 2 : le moral baisse · 3 : malades annoncés
 // 4 : des habitants tombent malades · 5 : morts annoncées · 6 : les plus fragiles meurent.
 function stage(e){return e<=0?0:e<S.graceSeconds?1:e<S.sickWarnSeconds?2:e<S.sickSeconds?3:e<S.deathWarnSeconds?4:e<S.deathSeconds?5:6;}
 // Corps laissés qu'une cité de cette taille supporte avant de tomber malade.
 function threshold(population){
  if(!Number.isFinite(population)||population<0)throw Error('Population invalide.');
  return S.base+S.perPerson*population;
 }
 // Vitesse de l'exposition selon la pluie observée (0 à 1) : la pluie accélère, le temps sec ralentit.
 function weatherFactor(rain){return !Number.isFinite(rain)?1:rain>W.wetAbove?W.wet:rain<W.dryBelow?W.dry:1;}
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Filière des corps 217 invalide.');};
  const span=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max,count=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k)))bad();
  if(!span(raw.pending,MAX)||!span(raw.burned,MAX)||!span(raw.buried,MAX)||raw.pyre!==null&&!FUELS.includes(raw.pyre)||!span(raw.pitLeft,F.digSeconds)||typeof raw.pitOpen!=='boolean'
   ||!span(raw.pitFill,F.capacity)||!count(raw.pitsClosed,MAX_COUNT)||!span(raw.exposure,MAX)||!count(raw.sick,sickSlots(raw.exposure))||!count(raw.deaths,deathSlots(raw.exposure))
   ||!count(raw.ill,MAX_COUNT)||!count(raw.died,MAX_COUNT)||!count(raw.saved,MAX_COUNT))bad();
  // Une fosse est en chantier ou ouverte, jamais les deux ; seule une fosse ouverte contient des corps, et une fosse pleine s'est refermée.
  if(raw.pitLeft>0&&raw.pitOpen||!raw.pitOpen&&raw.pitFill>0||raw.pitFill>=F.capacity)bad();
  // Un bûcher ne brûle que s'il reste des corps.
  if(raw.pyre!==null&&!(raw.pending>0))bad();
  if(!raw.active&&KEYS.some(k=>k!=='version'&&k!=='active'&&raw[k]!==0&&raw[k]!==null&&raw[k]!==false))bad();
  const out={};for(const k of KEYS)out[k]=raw[k];return out;
 }
 const NOTICES={1:['Salubrité : trop de corps restent dans la cité. Brûlez-les ou ensevelissez-les ; le moral baissera si rien ne change.','normal'],
  2:['Salubrité : l’odeur des corps pèse sur la cité. Le moral baisse.','danger'],
  3:['Salubrité : les premières fièvres sont signalées. Des habitants tomberont malades si les corps restent là.','danger'],
  5:['Salubrité : les malades s’affaiblissent. Les plus fragiles mourront si les corps ne sont pas traités ; les médicaments peuvent encore les sauver.','danger']};
 const live=u=>Boolean(u&&!u.dead&&u.health>0),present=u=>live(u)&&!u.regionAbsent;
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR'),whole=n=>(Math.ceil(n-EPS)||0).toLocaleString('fr-FR'),factor=n=>String(Math.round(n*100)/100).replace('.',','),plural=(n,one,many)=>n+' '+(n>1?many:one);
 function install(g){
  if(g.corpseChain217)return g.corpseChain217;if(!g.expansions)throw Error('Installer les opérations avant la filière des corps.');
  let state=initial(),announced=0;
  const active=()=>state.active,age=()=>g.tier?.id||0,open=()=>active()&&age()>=R.startAge;
  const sieged=()=>g.phase==='warning'||g.phase==='assault';
  const crew=()=>Array.isArray(g.units)&&g.units.some(u=>present(u)&&u.kind==='worker');
  const walls=()=>{let n=0;for(const b of g.world?.buildings?.values?.()||[])if(!b.dead&&b.completed&&b.def?.wall&&b.corpseLoad>0)n+=b.corpseLoad;return n;};
  // Corps laissés : ceux qui attendent d'être traités et ceux qui n'ont pas été déblayés.
  // Les corps d'une douve restent dans l'eau : ils comptent aussi (src/earthworks217.js).
  const left=()=>state.pending+walls()+(g.earthworks217?.moatBodies?.()||0),limit=()=>threshold(g.population||0);
  const rain=()=>weatherFactor(Number(g.weather)||0);
  // Nécropole : facteurs du bûcher et de la fosse, lus chez leur propriétaire ; 1 sans elle.
  const boost=()=>{const b=g.greatWorks217?.corpses?.();return{pyre:b?.pyre>0?b.pyre:1,pit:b?.pit>0?b.pit:1};};
  const pitCapacity=()=>F.capacity*boost().pit;
  const clinic=()=>{for(const b of g.world?.buildings?.values?.()||[])if(b.type==='clinic'&&!b.dead&&b.completed&&b.powered&&b.health>0&&!b.siegeOffline&&!b.territoryOffline&&!b.dayOffline&&!b.gridOffline)return true;return false;};
  const title=u=>(C.SURVIVORS[u.kind]?.name||'survivant').toLowerCase();
  const lastWorker=u=>u.kind==='worker'&&g.units.filter(o=>live(o)&&o.kind==='worker').length<=1;
  const cost=bag=>typeof g.maintenanceAmounts==='function'?g.maintenanceAmounts(bag):Object.entries(bag).map(([k,v])=>k+' '+v).join(', ');
  // Entrée de la filière : un corps réellement retiré d'un mur ou d'un fossé reste à traiter.
  function receive(n){
   if(!open()||!(n>0)||!Number.isFinite(n))return 0;
   const before=state.pending;state.pending=Math.min(MAX,before+n);return state.pending-before;
  }
  function atDepot(){
   const core=g.core(),p=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('corpseChain217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!p?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.reach));
  }
  const DEPOT='Décidez-le au dépôt de D-17, à pied et les mains libres.';
  function gate(){return !active()?'Cette campagne ne suit pas la filière des corps.':!open()?'La filière des corps viendra à l’âge '+START+'.':null;}
  function lightQuote(fuel){
   if(!FUELS.includes(fuel))return{ok:false,reason:'Combustible inconnu.'};
   const closed=gate();if(closed)return{ok:false,reason:closed};
   if(state.pyre)return{ok:false,reason:'Le bûcher brûle déjà.'};
   if(!(state.pending>=1))return{ok:false,reason:'Aucun corps à brûler : le bûcher reçoit les corps déblayés.'};
   if(!((g.resources?.[fuel]||0)>=P.cost[fuel]))return{ok:false,reason:'Pas de '+FUEL_NAMES[fuel]+' au dépôt.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   return{ok:true};
  }
  function light(fuel){
   const q=lightQuote(fuel);if(!q.ok)return q;
   state.pyre=fuel;g.refreshMetrics?.(true);
   g.notify?.('Bûcher allumé au '+FUEL_NAMES[fuel]+' : '+whole(state.pending)+' corps à brûler. Sa fumée se voit de loin : signature +'+P.signature+' tant qu’il brûle.');
   g.audio?.ui?.();g.save(false);return{ok:true};
  }
  function out(message,tone){state.pyre=null;g.refreshMetrics?.(true);g.notify?.(message,tone);}
  function douseQuote(){
   if(!state.pyre)return{ok:false,reason:'Aucun bûcher ne brûle.'};
   return atDepot()?{ok:true}:{ok:false,reason:DEPOT};
  }
  function douse(){const q=douseQuote();if(!q.ok)return q;out('Bûcher éteint : '+whole(state.pending)+' corps restent à traiter.','normal');g.audio?.ui?.();g.save(false);return{ok:true};}
  function pitQuote(){
   const closed=gate();if(closed)return{ok:false,reason:closed};
   if(state.pitOpen)return{ok:false,reason:'Une fosse est déjà ouverte.'};
   if(state.pitLeft>0)return{ok:false,reason:'Fosse en chantier : encore '+C.formatTime(state.pitLeft)+'.'};
   if(sieged())return{ok:false,reason:'Aucune fosse ne s’ouvre de l’alerte à la fin de l’assaut.'};
   if(!crew())return{ok:false,reason:'Aucun ouvrier présent pour creuser.'};
   if(!C.canAfford(g.resources,F.cost))return{ok:false,reason:'Stock insuffisant : il faut '+cost(F.cost)+'.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   return{ok:true,cost:F.cost};
  }
  function openPit(){
   const q=pitQuote();if(!q.ok)return q;
   if(!C.spend(g.resources,q.cost))return{ok:false,reason:'Stock insuffisant.'};
   state.pitLeft=F.digSeconds;
   g.notify?.('Fosse en chantier : '+C.formatTime(F.digSeconds)+' de terrassement par les ouvriers, arrêté pendant les assauts. Elle recevra '+whole(pitCapacity())+' corps'+necropolis()+'.');
   g.audio?.build?.();g.save(false);return{ok:true};
  }
  function burn(dt){
   const fuel=state.pyre,per=P.cost[fuel],stock=Math.max(0,g.resources[fuel]||0);
   const want=Math.min(state.pending,P.perSecond*boost().pyre*dt),done=Math.min(want,stock/per);
   if(done>0){g.resources[fuel]=Math.max(0,stock-done*per);state.pending=Math.max(0,state.pending-done);state.burned=Math.min(MAX,state.burned+done);}
   if(!(state.pending>EPS)){state.pending=0;out('Bûcher éteint : tous les corps sont brûlés.','good');}
   else if(done<want-EPS)out('Bûcher éteint faute de '+FUEL_NAMES[fuel]+' : '+whole(state.pending)+' corps restent à traiter.','danger');
  }
  // La fosse est un travail d'ouvriers : rien n'avance sans eux, ni de l'alerte à la fin de l'assaut.
  function bury(dt){
   if(sieged()||!crew())return;
   if(state.pitLeft>0){
    state.pitLeft=Math.max(0,state.pitLeft-dt);
    if(!(state.pitLeft>0)){state.pitOpen=true;g.notify?.('Fosse ouverte : les ouvriers y ensevelissent les corps, lentement et sans fumée.','good');}
    return;
   }
   if(!state.pitOpen)return;
   // Une place de fosse ordinaire reçoit `pit` corps dans une fosse de nécropole.
   const room=boost().pit,done=Math.min(state.pending,F.perSecond*dt,(F.capacity-state.pitFill)*room);
   if(done>0){state.pending=Math.max(0,state.pending-done);if(!(state.pending>EPS))state.pending=0;state.pitFill+=done/room;state.buried=Math.min(MAX,state.buried+done);}
   if(state.pitFill>=F.capacity-EPS){
    state.pitOpen=false;state.pitFill=0;state.pitsClosed=Math.min(MAX_COUNT,state.pitsClosed+1);
    g.notify?.('Fosse pleine : elle est refermée. Il faut en ouvrir une autre pour continuer d’ensevelir.','normal');
   }
  }
  // Malade : le mieux portant des présents, pour que le mal gagne la cité ; l'affaiblissement ne tue jamais.
  function sicken(){
   const u=g.units.filter(present).sort((a,b)=>b.health/b.maxHealth-a.health/a.maxHealth||a.id-b.id)[0];if(!u)return false;
   const harm=Math.min(u.maxHealth*S.sickDamage,u.health-1);if(!(harm>0))return false;
   g.damageUnit(u,harm);state.ill=Math.min(MAX_COUNT,state.ill+1);
   g.notify?.('Maladie : un '+title(u)+' est tombé malade. Une clinique en service le soignera contre des médicaments.','danger');return true;
  }
  // Mort : le plus affaibli des présents, sauf le dernier ouvrier. Les médicaments du dépôt le sauvent s'il y en a assez.
  function die(){
   const u=g.units.filter(v=>present(v)&&!lastWorker(v)).sort((a,b)=>a.health/a.maxHealth-b.health/b.maxHealth||a.maxHealth-b.maxHealth||a.id-b.id)[0];if(!u)return false;
   const name=title(u),dose=clinic()?S.medicine.clinic:S.medicine.plain;
   if((g.resources.medicine||0)>=dose){
    g.resources.medicine-=dose;state.saved=Math.min(MAX_COUNT,state.saved+1);
    g.notify?.('Maladie : un '+name+' a été sauvé par '+dose+' médicaments. Les corps sont toujours là.','normal');return false;
   }
   g.damageUnit(u,u.health);if(live(u))return false;
   state.died=Math.min(MAX_COUNT,state.died+1);g.refreshMetrics?.(true);
   g.notify?.('Maladie : un '+name+' est mort dans les murs, emporté par la fièvre des charniers.','danger');return true;
  }
  function sickness(dt){
   const load=left(),cap=limit(),exposed=state.exposure>0?load>=cap*S.clearRatio:load>=cap;
   if(!exposed){
    if(state.exposure>0){if(announced)g.notify?.('Salubrité : la cité est assainie. La maladie recule.','good');state.exposure=0;state.sick=0;state.deaths=0;announced=0;}
    return;
   }
   state.exposure=Math.min(MAX,state.exposure+dt*rain());
   const now=stage(state.exposure);
   if(now>=2)g.morale=Math.max(0,g.morale-dt*S.moraleDrain);
   for(;announced<now;){const notice=NOTICES[++announced];if(notice)g.notify?.(notice[0],notice[1]);}
   // Une échéance, un habitant : un pas de temps long ne provoque jamais plusieurs malades ou morts.
   const sick=sickSlots(state.exposure),deaths=deathSlots(state.exposure);
   if(deaths>state.deaths){state.deaths=deaths;state.sick=sick;die();}
   else if(sick>state.sick){state.sick=sick;sicken();}
  }
  function tick(dt){
   if(!open()||!(dt>0)||!Number.isFinite(dt)||g.state!=='playing'||g.gameOver)return;
   if(state.pyre)burn(dt);
   bury(dt);
   sickness(dt);
  }
  const pyreRate=()=>P.perSecond*boost().pyre,pitBodies=()=>state.pitFill*boost().pit;
  const necropolis=()=>boost().pyre!==1||boost().pit!==1?' (Nécropole)':'';
  function pyreText(){return state.pyre?'Brûle au '+FUEL_NAMES[state.pyre]+' · '+amount(pyreRate()*60)+' corps par minute'+necropolis()+' · signature +'+P.signature:'Éteint';}
  function pitText(){
   return state.pitLeft>0?'En chantier · '+C.formatTime(state.pitLeft)+(sieged()?' (arrêté pendant l’assaut)':crew()?'':' (aucun ouvrier présent)')
    :state.pitOpen?'Ouverte · '+whole(pitBodies())+' / '+whole(pitCapacity())+' corps'+(sieged()?' (arrêtée pendant l’assaut)':crew()?'':' (aucun ouvrier présent)')
    :'Aucune fosse ouverte'+(state.pitsClosed?' · '+plural(state.pitsClosed,'fosse refermée','fosses refermées'):'');
  }
  const PHASES=['Salubre','Trop de corps : délai de grâce','Premier temps : le moral baisse','Premier temps : le moral baisse','Deuxième temps : des habitants tombent malades','Deuxième temps : des habitants tombent malades','Troisième temps : les plus fragiles meurent'];
  function nextText(){
   const s=stage(state.exposure),e=state.exposure,f=rain(),wait=t=>C.formatTime(Math.max(0,t-e)/f);
   if(s===0)return'Rien tant que les corps laissés restent sous le seuil.';
   const pace=f>1?' (la pluie hâte le mal)':f<1?' (le temps sec le ralentit)':'';
   const text=s===1?'Le moral baissera dans '+wait(S.graceSeconds)+'.':s<=3?'Premier malade dans '+wait(S.sickSeconds)+'.'
    :s<=5?(sickSlots(S.deathSeconds)>state.sick?'Prochain malade dans '+wait(S.sickSeconds+state.sick*S.sickInterval)+' ; première':'Première')+' mort dans '+wait(S.deathSeconds)+'.'
    :'Prochaine mort dans '+wait(S.deathSeconds+state.deaths*S.deathInterval)+'.';
   return text+pace+' Repasser sous '+whole(limit()*S.clearRatio)+' corps laissés arrête tout.';
  }
  function overview(){
   if(!active())return{summary:'Cette campagne ne suit pas la filière des corps : elle vient avec les campagnes commencées après son arrivée. Les corps déblayés disparaissent comme avant.',rows:[{label:'Filière des corps',value:'Non suivie'}]};
   if(!open())return{summary:'La cité est encore assez petite pour enterrer ses morts sans y penser. La filière des corps viendra à l’âge '+START+'.',rows:[{label:'Filière des corps',value:'Aucune avant l’âge '+START}]};
   const s=stage(state.exposure),load=left(),cap=limit(),dose=clinic()?S.medicine.clinic:S.medicine.plain;
   const summary=s===6?'Maladie : les plus fragiles meurent tant que les corps restent là.':s===5?'Maladie : des habitants sont malades. Il y aura des morts si les corps ne sont pas traités.':s===4?'Maladie : des habitants tombent malades, un à la fois.'
    :s===3?'Les corps laissés font baisser le moral ; les premières fièvres sont signalées.':s===2?'Les corps laissés font baisser le moral.':s===1?'Trop de corps restent dans la cité : il faut les brûler ou les ensevelir.'
    :state.pyre?'Le bûcher brûle : sa fumée attire tant qu’il reste des corps et du combustible.':'Un corps déblayé reste à traiter : bûcher rapide et visible de loin, ou fosse lente et discrète.';
   return{summary,rows:[
    {label:'Corps à traiter',value:whole(state.pending)+' · déblayés des murs et des fossés'},
    {label:'Corps laissés',value:whole(load)+' (à traiter + au pied des murs) · seuil '+whole(cap)+' pour '+(g.population||0)+' habitants'},
    {label:'Bûcher',value:pyreText()+' — '+amount(P.cost.wood)+' bois ou '+amount(P.cost.fuel)+' carburant par corps ; s’éteint seul sans corps ni combustible.'},
    {label:'Fosse',value:pitText()+' — '+cost(F.cost)+' et '+C.formatTime(F.digSeconds)+' de chantier ; '+amount(F.perSecond*60)+' corps par minute, '+whole(pitCapacity())+' corps'+necropolis()+', puis elle se referme.'},
    {label:'Salubrité',value:PHASES[s]+(s>0?' · seuil dépassé depuis '+C.formatTime(state.exposure):'')},
    {label:'Ensuite',value:nextText()},
    {label:'Médicaments',value:'Une mort est évitée contre '+dose+' médicaments'+(clinic()?' (clinique en service)':' ('+S.medicine.clinic+' avec une clinique en service)')+' ; le dépôt en a '+Math.floor(g.resources?.medicine||0)+'.'},
    {label:'Bilan',value:whole(state.burned)+' brûlés · '+whole(state.buried)+' ensevelis · '+plural(state.ill,'malade','malades')+' · '+plural(state.saved,'sauvé','sauvés')+' · '+plural(state.died,'mort','morts')},
    {label:'Météo',value:'La pluie hâte la maladie (×'+factor(W.wet)+'), le temps sec la ralentit (×'+factor(W.dry)+').'}
   ]};
  }
  function actions(){
   if(!open())return[];
   const list=[];
   if(state.pyre){const q=douseQuote();list.push({id:'douse',label:'Éteindre le bûcher',description:'La signature retombe ; les corps non brûlés restent à traiter.',disabled:!q.ok,reason:q.reason||'Aucun combustible n’est rendu.',run:douse});}
   else for(const fuel of FUELS){const q=lightQuote(fuel);list.push({id:'light-'+fuel,label:'Allumer le bûcher au '+FUEL_NAMES[fuel],
    description:'Consume '+amount(pyreRate()*60)+' corps par minute contre '+amount(P.cost[fuel])+' '+FUEL_NAMES[fuel]+' par corps. Signature +'+P.signature+' tant qu’il brûle ; il s’éteint seul.',
    disabled:!q.ok,reason:q.reason||'Le combustible est pris au dépôt à mesure que les corps brûlent.',run:()=>light(fuel)});}
   if(!state.pitOpen){const q=pitQuote();list.push({id:'open-pit',label:'Ouvrir une fosse',
    description:'Coût : '+cost(F.cost)+', '+C.formatTime(F.digSeconds)+' de chantier d’ouvriers. Ensevelit '+amount(F.perSecond*60)+' corps par minute, sans combustible ni signature ; pleine à '+whole(pitCapacity())+' corps'+necropolis()+', elle se referme.',
    disabled:!q.ok,reason:q.reason||'Le stock paie maintenant ; rien n’est rendu.',run:openPit});}
   return list;
  }
  // La filière avance avec l'économie, comme les autres règles de cité.
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  // Déblaiement d'un mur : le geste et sa cadence restent ceux du moteur ; la charge réellement retirée entre dans la filière.
  const clear=g.clearCorpsesWithWorker;
  g.clearCorpsesWithWorker=function(...args){const removed=clear.apply(this,args);if(removed>0)receive(removed);return removed;};
  // Signature : la fumée du bûcher s'ajoute au calcul du moteur, qui reste seul à le refaire.
  const metrics=g.refreshMetrics;
  g.refreshMetrics=function(...args){const result=metrics.apply(this,args);if(open()&&state.pyre&&Number.isFinite(this.signature))this.signature+=P.signature;return result;};

  // Présentation : carte « Corps et salubrité » dans le dossier de situation. Lecture seule.
  const doc=root.document,ROWS=[['pending','Corps à traiter'],['left','Corps laissés'],['pyre','Bûcher'],['pit','Fosse'],['health','Salubrité'],['next','Ensuite']];
  let card=null,head=null,note=null,cells=null,text='',clock=-Infinity;
  const write=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
  function attach(){
   if(card||!doc?.getElementById||typeof doc.createElement!=='function')return card;
   const box=doc.getElementById('siegeReadout');if(!box||!box.parentNode||typeof box.appendChild!=='function')return null;
   const el=(tag,value,cls)=>{const node=doc.createElement(tag);if(value!==undefined)node.textContent=value;if(cls)node.className=cls;return node;};
   const node=el('article',undefined,'siege-readout-card corpse-chain-card');node.id='corpseChainCard';
   if(typeof node.appendChild!=='function'){box.appendChild(node);card=node;return card;}
   head=el('h3');head.id='corpseChainTitle';note=el('p',undefined,'siege-readout-note');note.id='corpseChainNote';
   const list=el('dl');cells=new Map();
   node.appendChild(el('small','CORPS ET SALUBRITÉ'));node.appendChild(head);node.appendChild(list);node.appendChild(note);
   if(typeof list.appendChild==='function')for(const [id,label] of ROWS){const dd=el('dd','—');dd.id='corpseChain-'+id;list.appendChild(el('dt',label));list.appendChild(dd);cells.set(id,dd);}
   // Avant la carte des amas, qui ferme le dossier ; à défaut, à la suite.
   const heaps=doc.getElementById('corpseHeapsCard');
   if(heaps&&heaps.parentNode===box&&typeof box.insertBefore==='function')box.insertBefore(node,heaps);else box.appendChild(node);
   card=node;return card;
  }
  function lines(){
   const s=stage(state.exposure);
   return{head:s>0?PHASES[s]:state.pyre?'Le bûcher brûle':state.pitOpen?'Fosse ouverte':state.pending>=1?'Des corps attendent':'Cité salubre',
    rows:{pending:whole(state.pending),left:whole(left())+' · seuil '+whole(limit()),pyre:state.pyre?'Brûle au '+FUEL_NAMES[state.pyre]+' · signature +'+P.signature:'Éteint',
     pit:state.pitLeft>0?'En chantier · '+C.formatTime(state.pitLeft):state.pitOpen?whole(pitBodies())+' / '+whole(pitCapacity()):'Aucune',health:PHASES[s],next:nextText()},
    foot:'Bûcher et fosse se décident au dépôt, fiche « Corps et salubrité » des opérations.'+(state.pyre?' Signature du bûcher : +'+P.signature+' (part « Grands ouvrages et bûcher » de la signature ci-dessus).':'')};
  }
  function render(){
   const node=attach();if(!node)return false;
   const show=g.state==='playing'&&open();node.hidden=!show;if(!show)return false;
   const view=lines(),key=JSON.stringify(view);
   if(key!==text){text=key;if(head){write(head,view.head);write(note,view.foot);for(const [id] of ROWS)write(cells.get(id),view.rows[id]);}else write(node,view.head+' '+ROWS.map(([id,label])=>label+' : '+view.rows[id]).join(' · ')+' '+view.foot);}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;render();}return result;};
  // Repères sur la carte, sous le dépôt : le bûcher quand il brûle (avec sa fumée), la fosse en chantier ou ouverte.
  function marks(){
   const core=typeof g.core==='function'?g.core():null;
   if(!open()||!core||!Number.isFinite(core.x)||!Number.isFinite(core.y))return[];
   const list=[];
   if(state.pyre)list.push({id:'pyre',x:core.x-64,y:core.y+MARK_DROP,smoke:true,label:'BÛCHER'});
   if(state.pitLeft>0||state.pitOpen)list.push({id:'pit',x:core.x+64,y:core.y+MARK_DROP,smoke:false,digging:state.pitLeft>0,fill:state.pitFill/F.capacity,label:state.pitLeft>0?'FOSSE · CHANTIER':'FOSSE '+whole(pitBodies())+'/'+whole(pitCapacity())});
   return list;
  }
  function drawMarks(ctx){
   const list=marks();if(!list.length)return 0;
   const zoom=Number(g.camera.zoom)||1,still=Boolean(g.settings?.reducedMotion),time=still?0:Number(g.elapsed)||0;
   ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
   for(const m of list){
    if(m.id==='pyre'){
     ctx.fillStyle='#3a2a1c';ctx.fillRect(m.x-13,m.y-5,26,7);
     ctx.fillStyle='#e0832f';ctx.beginPath();ctx.moveTo(m.x-9,m.y-5);ctx.lineTo(m.x-3,m.y-17-(still?0:Math.sin(time*9)*2));ctx.lineTo(m.x+1,m.y-9);ctx.lineTo(m.x+5,m.y-15-(still?0:Math.cos(time*7)*2));ctx.lineTo(m.x+9,m.y-5);ctx.closePath();ctx.fill();
     // Fumée : une colonne de volutes qui montent ; leur place ne dépend que de l'horloge du jeu.
     for(let i=0;i<9;i++){
      const t=((time*.16+i/9)%1+1)%1,r=7+t*24;
      ctx.fillStyle='rgba(186,182,172,'+(.62*Math.sqrt(1-t)).toFixed(3)+')';ctx.beginPath();ctx.arc(m.x+Math.sin(i*2.1+t*3)*(4+t*14)+t*34,m.y-20-t*190,r,0,Math.PI*2);ctx.fill();
     }
    }else{
     ctx.fillStyle='rgba(28,22,16,.85)';ctx.strokeStyle='#8a7a5a';ctx.lineWidth=1.5;ctx.setLineDash?.(m.digging?[4,3]:[]);
     ctx.fillRect(m.x-17,m.y-9,34,13);ctx.strokeRect(m.x-17,m.y-9,34,13);ctx.setLineDash?.([]);
     if(m.fill>0){ctx.fillStyle='rgba(126,104,74,.9)';ctx.fillRect(m.x-16,m.y+3-11*m.fill,32,11*m.fill);}
    }
    ctx.fillStyle='#e9d9af';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText?.(m.label,m.x,m.y+6);
   }
   return list.length;
  }
  const night=g.drawNight;
  if(typeof night==='function')g.drawNight=function(...args){
   const result=night.apply(this,args),ctx=args[0];
   if(ctx&&typeof ctx.save==='function'&&g.state==='playing'&&!g.gameOver&&g.camera&&g.width>0&&g.height>0&&!g.frontier?.active?.()&&!g.player?.regionAbsent){ctx.save();try{drawMarks(ctx);}catch(error){/* affichage facultatif */}finally{ctx.restore();}}
   return result;
  };
  const fresh=()=>{text='';clock=-Infinity;};
  const api=Object.freeze({active,open,pending:()=>state.pending,left,threshold:limit,stage:()=>stage(state.exposure),burning:()=>open()&&state.pyre?state.pyre:null,signature:()=>open()&&state.pyre?P.signature:0,
   pit:()=>({digging:state.pitLeft>0,left:state.pitLeft,open:state.pitOpen,fill:state.pitFill,closed:state.pitsClosed}),
   receive,lightQuote,light,douseQuote,douse,pitQuote,openPit,tick,overview,actions,render,marks,drawMarks,snapshot:()=>validate(state)});g.corpseChain217=api;
  g.expansions.register({id:'corpseChain217',title:'Corps et salubrité',overview,actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);announced=stage(state.exposure);fresh();},reset:()=>{state={...initial(),active:true};announced=0;fresh();}});
  return api;
 }
 const api=Object.freeze({FUELS:Object.freeze([...FUELS]),initial,validate,stage,sickSlots,deathSlots,threshold,weatherFactor,install});root.DeadwallCorpseChain217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
