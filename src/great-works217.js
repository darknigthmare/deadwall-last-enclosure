/* Grands ouvrages (docs/GAME_BIBLE.md §8.4), pour les NOUVELLES campagnes seulement.
   Un grand ouvrage est un chantier de cité bâti par tranches sur plusieurs nuits. Chaque tranche est payée au dépôt
   sur le stock, puis construite ; le chantier s'arrête de l'alerte à la fin de l'assaut, et une seule tranche par
   ouvrage peut être lancée par nuit. Un ouvrage inachevé n'a aucun effet. Deux ouvrages, composés sur l'existant :
   - Beffroi d'alerte : l'alerte du moteur dure plus longtemps avant l'assaut ; sa cloche porte loin (signature).
   - Nécropole : les ouvriers déblaient les corps plus vite (même geste que l'ordre « déblayer ») ; sa fumée se voit (signature).
     Achevée, elle sert aussi la filière des corps (src/corpse-chain217.js lit `corpses()`) : bûcher plus rapide, fosses plus grandes.
   Deuxième tranche : le chantier est posé sur la carte. L'emprise est réservée par ce module (registre de deux rectangles,
   comme les fossés de src/earthworks217.js) et non un ouvrage du catalogue : aucun bâtiment, point de vie ni case du
   champ de flux n'est ajouté ; la pose de tout ouvrage sur l'emprise est refusée. La silhouette, dessinée dans la file de
   profondeur du jeu, grandit d'un étage par tranche. Une tranche inachevée foulée par la horde pendant l'assaut perd une
   partie de son avancement (positions réelles des infectés, aucun dégât infligé), une tranche construite peut rouvrir.
   Une campagne de la première tranche (état version 1) est convertie sans perte : ses ouvrages restent sans emprise et
   fonctionnent comme avant, sauf si le joueur leur en choisit une.
   Ce module ne crée aucune ressource, ne tire aucun hasard et ne pose aucun bâtiment. La carte du panneau de droite, la
   silhouette et le repère dessiné au-dessus du dépôt ne font que lire l'état. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.GreatWorks217Rules;
 const START=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.startAge].name);
 const IDS=Object.keys(R.works),KEYS=['version','active','works'],KEYS2=['version','active','ground','works','sites'],WORK_KEYS=['steps','left','wave'],SITE_KEYS=['gx','gy','scar'],MAX_WAVE=1e6,REFRESH_SECONDS=.5,EPS=1e-9;
 const TILE=C.TILE,TILES=C.LOCAL_MAP217.tiles,S=R.site,UNIT=C.CityGeometry202.presentation.projectedHeightUnitsPerMetre,TYPE='greatWorks217:';
 const NAMES={belfry:'Beffroi d’alerte',necropolis:'Nécropole'};
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const TERMS={
  belfry:{effect:'alerte avant l’assaut +'+R.works.belfry.warningSeconds+' s',price:'signature +'+R.works.belfry.signature+' (la cloche porte loin)',done:'les fronts sont annoncés plus tôt.'},
  necropolis:{effect:'déblaiement des corps par les ouvriers ×'+amount(R.works.necropolis.clearSpeed),price:'signature +'+R.works.necropolis.signature+' (fumée permanente)',done:'bûchers et fosses dégagent les murs plus vite.'}
 };
 const none=()=>({steps:0,left:0,wave:null});
 // Version 2 : `ground` dit si la campagne exige une emprise avant la première tranche (nouvelles campagnes) ;
 // `sites` tient l'emprise choisie de chaque ouvrage (case du coin nord-ouest) et `scar`, l'avancement perdu pendant l'assaut en cours.
 function initial(){return{version:2,active:false,ground:false,works:Object.fromEntries(IDS.map(id=>[id,none()])),sites:Object.fromEntries(IDS.map(id=>[id,null]))};}
 const total=id=>R.works[id].steps.length,size=id=>R.works[id].site.size;
 // Avancement qu'un assaut peut retirer au plus à la tranche touchée.
 const budget=(id,k)=>R.works[id].steps[k].seconds*S.maxLossShare;
 const MAX_SCAR=Math.max(...IDS.flatMap(id=>R.works[id].steps.map((s,k)=>budget(id,k))));
 const overlaps=(a,b)=>a.gx<b.gx+b.w&&b.gx<a.gx+a.w&&a.gy<b.gy+b.h&&b.gy<a.gy+a.h;
 const box=(id,site)=>({gx:site.gx,gy:site.gy,w:size(id)[0],h:size(id)[1]});
 const plain=v=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
 const exact=(v,keys)=>Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Grands ouvrages 217 invalides.');};
  // Version 1 : état de la première tranche, converti sans perte, sans emprise et sans exigence d'emprise.
  const v2=plain(raw)&&raw.version===2;
  if(!plain(raw)||raw.version!==1&&!v2||typeof raw.active!=='boolean'||!exact(raw,v2?KEYS2:KEYS)||!plain(raw.works)||!exact(raw.works,IDS))bad();
  if(v2&&(typeof raw.ground!=='boolean'||!plain(raw.sites)||!exact(raw.sites,IDS)||!raw.active&&raw.ground))bad();
  const works={};
  for(const id of IDS){
   const w=raw.works[id];
   if(!plain(w)||!exact(w,WORK_KEYS)||!Number.isInteger(w.steps)||w.steps<0||w.steps>total(id)||typeof w.left!=='number'||!Number.isFinite(w.left)||w.left<0)bad();
   if(w.wave!==null&&(!Number.isInteger(w.wave)||w.wave<0||w.wave>MAX_WAVE))bad();
   // Une tranche en chantier est la suivante d'un ouvrage inachevé ; un ouvrage entamé connaît la nuit de sa dernière tranche.
   if(w.left>0&&(w.steps>=total(id)||w.left>R.works[id].steps[w.steps].seconds))bad();
   if((w.steps>0||w.left>0)!==(w.wave!==null))bad();
   if(!raw.active&&w.wave!==null)bad();
   works[id]={steps:w.steps,left:w.left,wave:w.wave};
  }
  const sites={};
  for(const id of IDS){
   const t=v2?raw.sites[id]:null;
   if(t===null){sites[id]=null;continue;}
   const [w,h]=size(id),w0=works[id];
   if(!plain(t)||!exact(t,SITE_KEYS)||!raw.active||!Number.isInteger(t.gx)||!Number.isInteger(t.gy)||t.gx<1||t.gy<1||t.gx+w>=TILES-1||t.gy+h>=TILES-1)bad();
   // Seule une tranche inachevée garde la trace d'un piétinement, jamais plus que le plafond d'un assaut.
   if(typeof t.scar!=='number'||!Number.isFinite(t.scar)||t.scar<0||t.scar>MAX_SCAR+EPS||t.scar>0&&w0.steps>=total(id))bad();
   sites[id]={gx:t.gx,gy:t.gy,scar:t.scar};
  }
  for(let i=0;i<IDS.length;i++)for(const other of IDS.slice(i+1))if(sites[IDS[i]]&&sites[other]&&overlaps(box(IDS[i],sites[IDS[i]]),box(other,sites[other])))bad();
  return{version:2,active:raw.active,ground:v2?raw.ground:false,works,sites};
 }
 // Achevé : toutes les tranches payées et construites. C'est la seule condition de tout effet.
 const complete=(state,id)=>state.active&&state.works[id].steps===total(id);
 // Signature ajoutée par les ouvrages achevés.
 function signature(state){return IDS.reduce((n,id)=>n+(complete(state,id)?R.works[id].signature:0),0);}
 function install(g){
  if(g.greatWorks217)return g.greatWorks217;if(!g.expansions)throw Error('Installer les opérations avant les grands ouvrages.');
  let state=initial();
  const active=()=>state.active,age=()=>g.tier?.id||0,open=()=>active()&&age()>=R.startAge;
  const done=id=>IDS.includes(id)&&complete(state,id),sieged=()=>g.phase==='warning'||g.phase==='assault';
  const crew=()=>Array.isArray(g.units)&&g.units.some(u=>u&&!u.dead&&u.health>0&&u.kind==='worker'&&!u.regionAbsent);
  const cost=bag=>typeof g.maintenanceAmounts==='function'?g.maintenanceAmounts(bag):Object.entries(bag).map(([k,v])=>k+' '+v).join(', ');
  function atDepot(){
   const core=g.core(),p=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('greatWorks217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!p?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.activationReach));
  }
  function quote(id){
   if(!IDS.includes(id))return{ok:false,reason:'Ouvrage inconnu.'};
   if(!active())return{ok:false,reason:'Cette campagne ne suit pas les grands ouvrages.'};
   if(!open())return{ok:false,reason:'Les grands ouvrages viendront à l’âge '+START+'.'};
   const w=state.works[id];
   if(w.steps>=total(id))return{ok:false,reason:'Ouvrage achevé.'};
   if(w.left>0)return{ok:false,reason:'Tranche en chantier : encore '+C.formatTime(w.left)+'.'};
   if(state.ground&&!state.sites[id])return{ok:false,reason:'Choisissez d’abord l’emprise du chantier sur la carte.'};
   if(sieged())return{ok:false,reason:'Aucune tranche ne se lance de l’alerte à la fin de l’assaut.'};
   if(w.wave!==null&&!(g.wave>w.wave))return{ok:false,reason:'Une seule tranche par nuit : la suivante après le prochain assaut repoussé.'};
   if(!Number.isInteger(g.wave)||g.wave<0||g.wave>MAX_WAVE)return{ok:false,reason:'Nuit de campagne illisible.'};
   const price=R.works[id].steps[w.steps].cost;
   if(!C.canAfford(g.resources,price))return{ok:false,reason:'Stock insuffisant : il faut '+cost(price)+'.'};
   if(!atDepot())return{ok:false,reason:'Décidez-le au dépôt de D-17, à pied et les mains libres.'};
   return{ok:true,cost:price};
  }
  // Emprise : un rectangle de cases réservé par ce module, jamais un ouvrage du monde. La pose de tout ouvrage y est
  // refusée par la lecture d'emplacement du monde, enveloppée ici ; le champ de flux et les points de vie ne changent pas.
  let bound=null,probing=null,cached={key:'',quote:null};
  // Sonde d'une case : la lecture d'emplacement du monde et toutes ses enveloppes (décor, fossés, véhicule, routes,
  // points de terrain) jugent l'emprise case par case, comme un fanal d'une case, qui ne se pose pas sur une route.
  const PROBE=C.BUILDINGS.perimeterLight;
  function bind(){
   const w=g.world;if(!w||bound===w||typeof w.placement!=='function')return;bound=w;
   const place=w.placement.bind(w);
   w.placement=(def,gx,gy,rotation=0,ignoreId=0,...rest)=>{
    const result=place(def,gx,gy,rotation,ignoreId,...rest);if(!result.valid||!state.active)return result;
    const d=def?.id&&Object.hasOwn(C.BUILDINGS,def.id)&&typeof w.definition==='function'?w.definition(def.id)||def:def,base=Array.isArray(d?.size)?d.size:[1,1],turned=Math.abs(rotation)%2===1;
    const area={gx,gy,w:turned?base[1]:base[0],h:turned?base[0]:base[1]};
    for(const id of IDS){const t=state.sites[id];if(t&&probing!==id&&overlaps(area,box(id,t)))return{valid:false,reason:'Emprise d’un grand ouvrage'};}
    return result;
   };
  }
  const coreCell=()=>{const core=typeof g.core==='function'?g.core():null;return core&&Number.isFinite(core.x)&&Number.isFinite(core.y)?{x:C.grid(core.x),y:C.grid(core.y)}:null;};
  // L'emprise se choisit hors assaut ; elle se déplace tant qu'aucune tranche n'a été lancée, et une fois posée sur une campagne convertie.
  function siteGate(id){
   if(!IDS.includes(id))return'Ouvrage inconnu.';
   if(!active())return'Cette campagne ne suit pas les grands ouvrages.';
   if(!open())return'Les grands ouvrages viendront à l’âge '+START+'.';
   if(g.state!=='playing'||g.gameOver)return'Aucune campagne en cours.';
   const w=state.works[id],t=state.sites[id];
   if(t&&(w.steps>0||w.left>0))return'Emprise déjà posée : le chantier est commencé.';
   if(sieged())return'Aucune emprise ne se pose de l’alerte à la fin de l’assaut.';
   return null;
  }
  function siteQuote(id,gx,gy){
   const closed=siteGate(id);if(closed)return{ok:false,reason:closed};
   if(!Number.isInteger(gx)||!Number.isInteger(gy))return{ok:false,reason:'Case illisible.'};
   bind();
   const [w,h]=size(id),area={gx,gy,w,h},c=coreCell();
   if(!c)return{ok:false,reason:'Dépôt introuvable.'};
   if(Math.max(Math.abs(gx-c.x),Math.abs(gx+w-1-c.x),Math.abs(gy-c.y),Math.abs(gy+h-1-c.y))>S.reach)return{ok:false,reason:'Hors de l’emprise de la cité'};
   for(const other of IDS)if(other!==id&&state.sites[other]&&overlaps(area,box(other,state.sites[other])))return{ok:false,reason:'Emprise d’un autre grand ouvrage'};
   const key=[id,gx,gy,g.world.navigationVersion,g.world.nodes?.length,JSON.stringify(state.sites),Math.floor((Number(g.elapsed)||0)*2)].join('|');
   if(cached.key===key)return cached.quote;
   let quote={ok:true};probing=id;
   try{for(let y=0;y<h&&quote.ok;y++)for(let x=0;x<w;x++){const check=g.world.placement(PROBE,gx+x,gy+y,0);if(!check.valid){quote={ok:false,reason:check.reason||'Emplacement occupé'};break;}}}
   finally{probing=null;}
   cached={key,quote};return quote;
  }
  function place(id,gx,gy){
   const q=siteQuote(id,gx,gy);if(!q.ok)return q;
   const moved=Boolean(state.sites[id]);state.sites[id]={gx,gy,scar:0};
   if(mine(g.selectedBuild))g.cancelPlacement?.();
   g.notify?.('Emprise '+(moved?'déplacée':'posée')+' : '+NAMES[id]+', '+size(id).join(' × ')+' cases. '+(state.works[id].steps>=total(id)?'L’ouvrage achevé s’y dresse.':'Une tranche inachevée y reste exposée : la horde qui la foule pendant l’assaut en défait une partie.'),'good');
   g.audio?.build?.();g.save(false);return{ok:true};
  }
  // Mode de pose : même geste que le catalogue (aperçu sous le curseur, clic pour poser, Échap pour renoncer).
  const mine=type=>typeof type==='string'&&type.startsWith(TYPE)&&IDS.includes(type.slice(TYPE.length))?type.slice(TYPE.length):null;
  function choose(id){
   const closed=siteGate(id);if(closed)return{ok:false,reason:closed};
   if(!g.expansions.canAct())return{ok:false,reason:'Il faut une campagne active et un commandant debout.'};
   g.rallyPlacement=false;g.selectedBuild=TYPE+id;g.wallStart=null;g.wallPreview=[];g.selectBuilding?.(null);g.refreshBuildMenu?.(true);
   return{ok:true,message:'Choisissez sur la carte l’emprise : '+NAMES[id]+' ('+size(id).join(' × ')+' cases) ; Échap pour renoncer.'};
  }
  // Piétinement : pendant l'assaut, chaque infecté debout dans l'emprise d'une tranche inachevée défait du chantier,
  // jusqu'au plafond de l'assaut. La tranche en chantier recule ; entre deux tranches, la dernière construite rouvre.
  function inside(t,id){
   const [w,h]=size(id),l=t.gx*TILE,top=t.gy*TILE,r=l+w*TILE,b=top+h*TILE;let n=0;
   for(const z of g.zombies||[])if(z&&!z.dead&&z.health>0&&!z.regionAbsent&&z.x>=l&&z.x<=r&&z.y>=top&&z.y<=b)n++;
   return n;
  }
  function trample(dt){
   if(g.phase!=='assault'){for(const id of IDS){const t=state.sites[id];if(t&&t.scar>0)t.scar=0;}return;}
   for(const id of IDS){
    const t=state.sites[id],w=state.works[id];
    if(!t||w.wave===null||w.steps>=total(id)||!(w.left>0)&&w.steps===0)continue;
    const n=inside(t,id);if(!n)continue;
    const k=w.left>0?w.steps:w.steps-1,seconds=R.works[id].steps[k].seconds;
    let loss=Math.min(budget(id,k)-t.scar,n*S.trampleSeconds*dt);
    if(w.left>0)loss=Math.min(loss,seconds-w.left);
    if(!(loss>EPS))continue;
    const first=!(t.scar>0),reopened=!(w.left>0);
    if(reopened){w.steps--;w.left=loss;}else w.left=Math.min(seconds,w.left+loss);
    t.scar+=loss;
    if(first||reopened)g.notify?.(NAMES[id]+' : la horde foule le chantier. '+(reopened?'La tranche '+(w.steps+1)+' sur '+total(id)+' construite est entamée et rouvre':'La tranche '+(w.steps+1)+' sur '+total(id)+' perd de son avancement')+' ; au plus '+C.formatTime(budget(id,k))+' perdus par assaut, rien n’est repayé.','danger');
   }
  }
  // Lancer la tranche suivante : le stock paie d'abord, le chantier commence ensuite.
  function launch(id){
   const q=quote(id);if(!q.ok)return q;
   if(!C.spend(g.resources,q.cost))return{ok:false,reason:'Stock insuffisant.'};
   const w=state.works[id],step=R.works[id].steps[w.steps];
   w.left=step.seconds;w.wave=g.wave;
   g.notify?.('Grand ouvrage : '+NAMES[id]+', tranche '+(w.steps+1)+' sur '+total(id)+' financée. Chantier de '+C.formatTime(step.seconds)+', arrêté pendant les assauts.');
   g.audio?.build?.();g.save(false);return{ok:true};
  }
  function tick(dt){
   if(!active()||!(dt>0)||!Number.isFinite(dt)||g.state!=='playing'||g.gameOver)return;
   bind();trample(dt);
   if(sieged()||!crew())return;
   for(const id of IDS){
    const w=state.works[id];if(!(w.left>0))continue;
    w.left=Math.max(0,w.left-dt);if(w.left>0)continue;
    w.steps++;
    if(w.steps<total(id))g.notify?.(NAMES[id]+' : tranche '+w.steps+' sur '+total(id)+' construite. La suivante se lance après le prochain assaut repoussé.','good');
    else{g.notify?.(NAMES[id]+' achevé : '+TERMS[id].done+' Prix : '+TERMS[id].price+'.','good');g.refreshMetrics?.(true);}
   }
  }
  function status(id){
   const w=state.works[id],n=total(id);
   if(w.steps>=n)return'Achevé';
   if(w.left>0)return'Tranche '+(w.steps+1)+' sur '+n+' en chantier · '+C.formatTime(w.left)+(sieged()?' (arrêté pendant l’assaut)':crew()?'':' (aucun ouvrier présent)');
   return w.steps>0?w.steps+' tranche'+(w.steps>1?'s':'')+' sur '+n+' · sans effet avant la dernière':'Non commencé';
  }
  function siteText(id){
   const t=state.sites[id];
   if(t)return'posée en '+t.gx+', '+t.gy+(t.scar>0?' · '+C.formatTime(t.scar)+' défaits cet assaut':'');
   return state.ground?'à choisir':'sans emprise';
  }
  function overview(){
   if(!active())return{summary:'Cette campagne ne suit pas les grands ouvrages : ils viennent avec les campagnes commencées après leur arrivée.',rows:[{label:'Grands ouvrages',value:'Non suivis'}]};
   if(!open())return{summary:'La cité est encore trop petite pour de tels chantiers. Les grands ouvrages viendront à l’âge '+START+'.',rows:[{label:'Grands ouvrages',value:'Aucun avant l’âge '+START}]};
   const rows=[{label:'Chantier',value:'Par tranches, payées au dépôt puis construites ; une tranche par ouvrage et par nuit, arrêtée de l’alerte à la fin de l’assaut.'},
    {label:'Emprise',value:IDS.map(id=>NAMES[id]+' '+size(id).join(' × ')+' cases : '+siteText(id)).join(' · ')+'. '+(state.ground?'Elle se choisit sur la carte avant la première tranche, à '+S.reach+' cases au plus du dépôt.':'Campagne commencée avec la première tranche : une emprise est facultative ; sans elle, l’ouvrage fonctionne comme avant.')+' Une tranche inachevée foulée par la horde pendant l’assaut perd '+S.trampleSeconds+' s de chantier par infecté et par seconde, au plus '+Math.round(S.maxLossShare*100)+' % de la tranche par assaut.'}];
   for(const id of IDS){
    const w=state.works[id],next=w.steps<total(id)&&!(w.left>0)?' Prochaine tranche : '+cost(R.works[id].steps[w.steps].cost)+', '+C.formatTime(R.works[id].steps[w.steps].seconds)+' de chantier.':'';
    rows.push({label:NAMES[id],value:status(id)+' — Effet : '+TERMS[id].effect+'. Prix : '+TERMS[id].price+'.'+next});
   }
   const live=IDS.filter(done).map(id=>NAMES[id]);
   return{summary:live.length?'Achevés : '+live.join(', ')+'. Chaque ouvrage résout un problème et en crée un.':'Aucun grand ouvrage achevé. Un ouvrage inachevé ne sert à rien : il faut tenir plusieurs nuits pour le finir.',rows};
  }
  function actions(){
   if(!open())return[];
   return[...launches(),...IDS.filter(id=>!(state.sites[id]&&(state.works[id].steps>0||state.works[id].left>0))).map(id=>{
    const t=state.sites[id],q=siteGate(id);
    return{id:'site-'+id,label:(t?'Déplacer l’emprise : ':state.ground?'Choisir l’emprise : ':'Poser une emprise (facultatif) : ')+NAMES[id],
     description:'Emprise de '+size(id).join(' × ')+' cases dans la cité, à '+S.reach+' cases au plus du dépôt. Aucun ouvrage ne s’y pose ensuite. La silhouette y grandit à chaque tranche ; une tranche inachevée y est exposée à la horde.',
     disabled:Boolean(q),reason:q||'Aperçu sous le curseur ; clic pour poser, Échap pour renoncer.',close:true,run:()=>choose(id)};
   })];
  }
  function launches(){
   return IDS.filter(id=>state.works[id].steps<total(id)).map(id=>{
    const w=state.works[id],step=R.works[id].steps[w.steps],q=quote(id);
    return{id:'launch-'+id,label:'Lancer la tranche '+(w.steps+1)+' sur '+total(id)+' : '+NAMES[id],
     description:'Coût : '+cost(step.cost)+'. Chantier : '+C.formatTime(step.seconds)+'. Une fois achevé — effet : '+TERMS[id].effect+' ; prix : '+TERMS[id].price+'.',
     disabled:!q.ok,reason:q.reason||'Le stock paie maintenant ; rien n’est rendu.',run:()=>launch(id)};
   });
  }
  // Chantier : avance avec l'économie, comme les autres règles de cité.
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  // Beffroi : le moteur ouvre l'alerte ; le beffroi achevé l'allonge, au moment exact où elle commence.
  const director=g.updateDirector;
  g.updateDirector=function(...args){
   const before=this.phase,result=director.apply(this,args);
   if(before==='calm'&&this.phase==='warning'&&done('belfry')){this.phaseTime+=R.works.belfry.warningSeconds;this.notify?.('Beffroi d’alerte : la cloche donne '+R.works.belfry.warningSeconds+' s de plus avant l’assaut.');}
   return result;
  };
  // Nécropole : même geste, même propriétaire ; seule la cadence des ouvriers change.
  const clear=g.clearCorpsesWithWorker;
  g.clearCorpsesWithWorker=function(unit,wall,dt,...rest){
   return clear.call(this,unit,wall,done('necropolis')&&unit&&unit!==this.player&&unit.kind==='worker'?dt*R.works.necropolis.clearSpeed:dt,...rest);
  };
  // Signature : les ouvrages achevés s'ajoutent au calcul du moteur, qui reste seul à le refaire.
  const metrics=g.refreshMetrics;
  g.refreshMetrics=function(...args){const result=metrics.apply(this,args);const extra=signature(state);if(extra>0&&Number.isFinite(this.signature))this.signature+=extra;return result;};

  // Présentation : carte dans le dossier de situation, à la suite de la lecture de siège. Lecture seule.
  const doc=root.document;
  let card=null,title=null,note=null,rows=null,text='',clock=-Infinity;
  const write=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
  function attach(){
   if(card||!doc?.getElementById||typeof doc.createElement!=='function')return card;
   // La carte ne s'accroche qu'à une lecture de siège réellement posée dans le dossier de situation.
   const box=doc.getElementById('siegeReadout');if(!box||!box.parentNode||typeof box.appendChild!=='function')return null;
   const el=(tag,value,cls)=>{const node=doc.createElement(tag);if(value!==undefined)node.textContent=value;if(cls)node.className=cls;return node;};
   const node=el('article',undefined,'siege-readout-card great-works-card');node.id='greatWorksCard';
   if(typeof node.appendChild!=='function'){box.appendChild(node);card=node;return card;}
   title=el('h3');title.id='greatWorksTitle';note=el('p',undefined,'siege-readout-note');note.id='greatWorksNote';
   const list=el('dl');rows=new Map();
   node.appendChild(el('small','GRANDS OUVRAGES'));node.appendChild(title);node.appendChild(list);node.appendChild(note);
   if(typeof list.appendChild==='function')for(const id of IDS){const dd=el('dd','—');dd.id='greatWorks-'+id;list.appendChild(el('dt',NAMES[id]));list.appendChild(dd);rows.set(id,dd);}
   // Troisième carte : après la signature et la dernière nuit, avant les cartes ajoutées ensuite.
   const after=box.children?.[2];
   if(after&&typeof box.insertBefore==='function')box.insertBefore(node,after);else box.appendChild(node);
   card=node;return card;
  }
  function lines(){
   const begun=IDS.filter(id=>state.works[id].wave!==null),live=IDS.filter(done),extra=signature(state);
   const head=live.length===IDS.length?'Tous achevés':live.length?live.length+' achevé'+(live.length>1?'s':'')+' sur '+IDS.length:begun.length?'En chantier':'Aucun chantier lancé';
   const works={};for(const id of IDS){const w=state.works[id];works[id]=w.steps>=total(id)?'Achevé':w.left>0?(w.steps+1)+'/'+total(id)+' · '+C.formatTime(w.left)+(sieged()?' · arrêté':''):w.steps+'/'+total(id);}
   const foot=(extra>0?'Signature ajoutée par les ouvrages achevés : +'+extra+' (part « Grands ouvrages et bûcher » de la signature ci-dessus). ':'')+(live.length===IDS.length?'':'Tranches à lancer au dépôt, fiche « Grands ouvrages » des opérations ; aucun effet avant la dernière.');
   return{head,works,foot};
  }
  function render(){
   const node=attach();if(!node)return false;
   const show=g.state==='playing'&&open();node.hidden=!show;if(!show)return false;
   const out=lines(),key=JSON.stringify(out);
   if(key!==text){text=key;if(title){write(title,out.head);write(note,out.foot);for(const id of IDS)write(rows.get(id),out.works[id]);}else write(node,out.head+' '+IDS.map(id=>NAMES[id]+' : '+out.works[id]).join(' · ')+' '+out.foot);}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;render();}return result;};
  // Repère sur la carte : un échafaudage par ouvrage entamé, au-dessus du dépôt ; un étage par tranche.
  // Un ouvrage posé sur son emprise n'a plus qu'une étiquette au pied de sa silhouette.
  function marks(){
   const core=typeof g.core==='function'?g.core():null;
   if(!open()||!core||!Number.isFinite(core.x)||!Number.isFinite(core.y))return[];
   return IDS.map((id,i)=>{
    const t=state.sites[id],[w,h]=size(id),base={id,steps:state.works[id].steps,total:total(id),building:state.works[id].left>0,done:done(id),sited:Boolean(t)};
    return t?{...base,x:(t.gx+w/2)*TILE,y:(t.gy+h)*TILE}:{...base,x:core.x+(i*2-(IDS.length-1))*46,y:core.y-58};
   }).filter(m=>m.steps>0||m.building||m.sited);
  }
  function drawMarks(ctx){
   const list=marks();if(!list.length)return 0;
   const zoom=Number(g.camera.zoom)||1;
   ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
   for(const m of list){
    if(m.sited){
     const label=(m.id==='belfry'?'BEFFROI':'NÉCROPOLE')+' '+(m.done?'ACHEVÉ':m.steps+'/'+m.total+(m.building?' · CHANTIER':''));
     const width=Math.max(60,label.length*5.6+10);
     ctx.fillStyle='rgba(16,14,11,.78)';ctx.fillRect(m.x-width/2,m.y+4,width,14);ctx.strokeStyle=m.done?'#f0d48a':'#e8cb7e';ctx.lineWidth=1;ctx.strokeRect(m.x-width/2,m.y+4,width,14);
     ctx.fillStyle='#e9d9af';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText?.(label,m.x,m.y+6);
     continue;
    }
    const w=22,h=11,levels=m.steps+(m.building?1:0);
    ctx.lineWidth=1.5;
    for(let level=0;level<levels;level++){
     const top=m.y-(level+1)*h,built=level<m.steps;
     ctx.setLineDash?.(built?[]:[4,3]);
     ctx.fillStyle=built?(m.done?'rgba(210,168,74,.85)':'rgba(141,136,124,.8)'):'rgba(210,168,74,.12)';ctx.strokeStyle=m.done?'#f0d48a':'#e8cb7e';
     ctx.fillRect(m.x-w/2,top,w,h);ctx.strokeRect(m.x-w/2,top,w,h);
    }
    ctx.setLineDash?.([]);
    if(m.done){ctx.beginPath();ctx.moveTo(m.x-w/2-3,m.y-m.total*h);ctx.lineTo(m.x,m.y-m.total*h-10);ctx.lineTo(m.x+w/2+3,m.y-m.total*h);ctx.closePath();ctx.fillStyle='#f0d48a';ctx.fill();}
    ctx.fillStyle='#e9d9af';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText?.((m.id==='belfry'?'BEFFROI':'NÉCROPOLE')+' '+m.steps+'/'+m.total,m.x,m.y+2);
   }
   return list.length;
  }
  const night=g.drawNight;
  if(typeof night==='function')g.drawNight=function(...args){
   const result=night.apply(this,args),ctx=args[0];
   if(ctx&&typeof ctx.save==='function'&&g.state==='playing'&&!g.gameOver&&g.camera&&g.width>0&&g.height>0&&!g.frontier?.active?.()&&!g.player?.regionAbsent){ctx.save();try{drawMarks(ctx);}catch(error){/* affichage facultatif */}finally{ctx.restore();}}
   return result;
  };
  // Silhouette : un volume par emprise, dans la file de profondeur du jeu (vue de la cité et atlas), un étage par tranche.
  // Hauteur projetée comme les ouvrages : `heights` en mètres, au pas de la présentation de C.CityGeometry202.
  function silhouettes(){
   if(!open())return[];
   const out=[];
   for(const id of IDS){
    const t=state.sites[id];if(!t)continue;
    const [w,h]=size(id),wk=state.works[id],heights=R.works[id].site.heights,l=t.gx*TILE,top=t.gy*TILE;
    out.push({id,left:l,top,right:l+w*TILE,bottom:top+h*TILE,steps:wk.steps,total:total(id),building:wk.left>0,done:done(id),
     height:wk.steps>0?heights[wk.steps-1]*UNIT:0,next:wk.steps<total(id)?heights[wk.steps]*UNIT:null,
     share:wk.left>0?1-wk.left/R.works[id].steps[wk.steps].seconds:0,levels:heights.slice(0,wk.steps).map(m=>m*UNIT),scarred:t.scar>0});
   }
   return out;
  }
  function paintSilhouette(ctx,v){
   const w=v.right-v.left,d=v.bottom-v.top,H=v.height,belfry=v.id==='belfry';
   // Emprise au sol : terre battue et piquets.
   ctx.fillStyle='rgba(58,48,34,.55)';ctx.fillRect(v.left,v.top,w,d);
   ctx.strokeStyle='rgba(232,203,126,.75)';ctx.lineWidth=2;ctx.setLineDash?.([6,4]);ctx.strokeRect(v.left+1,v.top+1,w-2,d-2);ctx.setLineDash?.([]);
   const wall=belfry?'#8f877a':'#7c7466',roof=belfry?'#b3a993':'#5e574c',band='rgba(30,26,20,.55)';
   if(H>0){
    if(belfry){
     // Tour : face avant, puis plateforme décalée de la hauteur.
     ctx.fillStyle=wall;ctx.fillRect(v.left,v.bottom-H,w,H);
     ctx.fillStyle=roof;ctx.fillRect(v.left,v.top-H,w,d);
    }else{
     // Enceinte des morts : murs bas tout autour, cour sombre au milieu.
     ctx.fillStyle=roof;ctx.fillRect(v.left,v.top-H,w,d);
     ctx.fillStyle='rgba(34,30,25,.9)';ctx.fillRect(v.left+TILE,v.top-H+TILE,w-2*TILE,d-2*TILE);
     ctx.fillStyle=wall;ctx.fillRect(v.left,v.bottom-H,w,H);
    }
    ctx.strokeStyle=band;ctx.lineWidth=2;
    for(const level of v.levels.slice(0,-1)){ctx.beginPath();ctx.moveTo(v.left,v.bottom-level);ctx.lineTo(v.right,v.bottom-level);ctx.stroke();}
    ctx.strokeStyle='rgba(20,18,14,.8)';ctx.lineWidth=1.5;ctx.strokeRect(v.left,v.bottom-H,w,H);ctx.strokeRect(v.left,v.top-H,w,d);
   }
   // Tranche en chantier : échafaudage de la tranche suivante, plein à mesure de l'avancement.
   if(v.next!==null&&(v.building||v.steps>0)){
    const top=v.next,filled=H+(top-H)*v.share;
    if(v.building&&filled>H){ctx.fillStyle='rgba(143,135,122,.55)';ctx.fillRect(v.left,v.bottom-filled,w,filled-H);}
    ctx.strokeStyle=v.scarred?'rgba(214,96,70,.9)':'rgba(232,203,126,.85)';ctx.lineWidth=1.5;ctx.setLineDash?.([5,4]);
    ctx.strokeRect(v.left,v.bottom-top,w,top-H);ctx.strokeRect(v.left,v.top-top,w,d);
    ctx.beginPath();ctx.moveTo(v.left,v.bottom-H);ctx.lineTo(v.right,v.bottom-top);ctx.moveTo(v.right,v.bottom-H);ctx.lineTo(v.left,v.bottom-top);ctx.stroke();ctx.setLineDash?.([]);
   }
   if(v.done){
    if(belfry){
     // Flèche et cloche au sommet.
     const cx=v.left+w/2,cy=v.top-H+d/2;
     ctx.fillStyle='#5a4a35';ctx.beginPath();ctx.moveTo(v.left-4,v.top-H+d);ctx.lineTo(cx,cy-d*1.6);ctx.lineTo(v.right+4,v.top-H+d);ctx.closePath();ctx.fill();
     ctx.fillStyle='#d2a84a';ctx.beginPath();ctx.arc(cx,cy-d*.25,Math.max(6,w*.12),0,Math.PI*2);ctx.fill();
    }else{
     // Cheminée du four et sa fumée permanente, sans horloge propre.
     const cx=v.right-TILE*2,top=v.top-H-UNIT*4;
     ctx.fillStyle='#4a443b';ctx.fillRect(cx-TILE/2,top,TILE,UNIT*4+TILE);
     for(let i=0;i<4;i++){ctx.fillStyle='rgba(176,172,162,'+(.5-i*.1).toFixed(2)+')';ctx.beginPath();ctx.arc(cx+i*12,top-14-i*22,10+i*6,0,Math.PI*2);ctx.fill();}
    }
   }
   return true;
  }
  const visibleIn=(v,view)=>!view||!Number.isFinite(view.left)||v.right>=view.left&&v.left<=view.right&&v.bottom>=view.top&&v.top-(v.next??v.height)-UNIT*8<=view.bottom;
  const depth=g.depthEntries;
  if(typeof depth==='function')g.depthEntries=function(view,...rest){
   const entries=depth.call(this,view,...rest);
   if(!Array.isArray(entries)||!state.active||this.frontier?.active?.()&&!view?.homeProjection)return entries;
   let added=0;
   for(const v of silhouettes())if(visibleIn(v,view)){entries.push({kind:'greatWork217',id:'greatWork217:'+v.id,depth:v.bottom,order:entries.length,draw:ctx=>{ctx.save();try{paintSilhouette(ctx,v);}catch(error){/* affichage facultatif */}finally{ctx.restore();}}});added++;}
   if(added)entries.sort((a,b)=>a.depth-b.depth||(a.order??0)-(b.order??0));
   return entries;
  };
  // Pose : l'aperçu et le clic du catalogue servent l'emprise ; Échap renonce comme pour tout ouvrage.
  const lineWall=g.isLineWall;
  if(typeof lineWall==='function')g.isLineWall=function(def,...rest){return!def&&mine(this.selectedBuild)?false:lineWall.call(this,def,...rest);};
  // Clic : l'emprise est centrée sur le curseur, comme son aperçu.
  const corner=(id,x,y)=>({gx:C.grid(x)-Math.floor(size(id)[0]/2),gy:C.grid(y)-Math.floor(size(id)[1]/2)});
  const placeOne=g.placeOne;
  if(typeof placeOne==='function')g.placeOne=function(type,gx,gy,...rest){
   const id=mine(type);if(!id)return placeOne.call(this,type,gx,gy,...rest);
   const at={gx:gx-Math.floor(size(id)[0]/2),gy:gy-Math.floor(size(id)[1]/2)},q=place(id,at.gx,at.gy);if(!q.ok)this.notify?.(q.reason,'danger');return q.ok;
  };
  const placement=g.drawPlacement;
  if(typeof placement==='function')g.drawPlacement=function(ctx,...rest){
   const id=this.rallyPlacement?null:mine(this.selectedBuild);if(!id)return placement.call(this,ctx,...rest);
   const at=corner(id,this.input.mouseWorldX,this.input.mouseWorldY),q=siteQuote(id,at.gx,at.gy),[w,h]=size(id);
   ctx.save();ctx.globalAlpha=.58;ctx.fillStyle=q.ok?'rgba(111,164,102,.55)':'rgba(183,71,62,.55)';ctx.fillRect(at.gx*TILE+2,at.gy*TILE+2,w*TILE-4,h*TILE-4);
   ctx.strokeStyle='rgba(255,255,255,.7)';ctx.strokeRect(at.gx*TILE+2,at.gy*TILE+2,w*TILE-4,h*TILE-4);
   if(typeof ctx.fillText==='function'){
    ctx.globalAlpha=1;ctx.font='600 13px system-ui,sans-serif';ctx.textAlign='center';
    const text=NAMES[id]+(q.ok?' : clic pour poser':' : '+q.reason),x=(at.gx+w/2)*TILE,y=at.gy*TILE-11,width=(ctx.measureText?.(text)?.width||text.length*7)+12;
    ctx.fillStyle='rgba(16,14,11,.82)';ctx.fillRect(x-width/2,y-15,width,20);ctx.fillStyle=q.ok?'#e9e4d6':'#f0c36a';ctx.fillText(text,x,y);
   }
   ctx.restore();
  };
  // Le monde est refait à chaque campagne et à chaque reprise : la réserve d'emprise le suit.
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);bind();return result;};}
  // Nécropole et filière des corps : facteurs lus par src/corpse-chain217.js, à 1 tant que l'ouvrage n'est pas achevé.
  const corpses=()=>done('necropolis')?{pyre:R.works.necropolis.pyreSpeed,pit:R.works.necropolis.pitCapacity}:{pyre:1,pit:1};
  const sites=()=>Object.fromEntries(IDS.map(id=>[id,state.sites[id]?{...state.sites[id],w:size(id)[0],h:size(id)[1]}:null]));
  const fresh=()=>{text='';clock=-Infinity;};
  const api=Object.freeze({active,open,done,signature:()=>signature(state),quote,launch,tick,status,overview,actions,render,marks,drawMarks,
   ground:()=>state.active&&state.ground,sites,siteQuote,place,choose,silhouettes,paintSilhouette,corpses,snapshot:()=>validate(state)});g.greatWorks217=api;
  g.expansions.register({id:'greatWorks217',title:'Grands ouvrages',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);bind();fresh();},reset:()=>{state={...initial(),active:true,ground:true};bind();fresh();}});
  return api;
 }
 const api=Object.freeze({IDS:Object.freeze([...IDS]),NAMES:Object.freeze({...NAMES}),initial,validate,signature,install});root.DeadwallGreatWorks217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
