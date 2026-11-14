/* Grands ouvrages (docs/GAME_BIBLE.md §8.4), première tranche, pour les NOUVELLES campagnes seulement.
   Un grand ouvrage est un chantier de cité bâti par tranches sur plusieurs nuits. Chaque tranche est payée au dépôt
   sur le stock, puis construite ; le chantier s'arrête de l'alerte à la fin de l'assaut, et une seule tranche par
   ouvrage peut être lancée par nuit. Un ouvrage inachevé n'a aucun effet. Deux ouvrages, composés sur l'existant :
   - Beffroi d'alerte : l'alerte du moteur dure plus longtemps avant l'assaut ; sa cloche porte loin (signature).
   - Nécropole : les ouvriers déblaient les corps plus vite (même geste que l'ordre « déblayer ») ; sa fumée se voit (signature).
   Ce module ne crée aucune ressource, ne tire aucun hasard et ne pose aucun bâtiment. La carte du panneau de droite et
   le repère dessiné au-dessus du dépôt ne font que lire l'état. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.GreatWorks217Rules;
 const START=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.startAge].name);
 const IDS=Object.keys(R.works),KEYS=['version','active','works'],WORK_KEYS=['steps','left','wave'],MAX_WAVE=1e6,REFRESH_SECONDS=.5;
 const NAMES={belfry:'Beffroi d’alerte',necropolis:'Nécropole'};
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const TERMS={
  belfry:{effect:'alerte avant l’assaut +'+R.works.belfry.warningSeconds+' s',price:'signature +'+R.works.belfry.signature+' (la cloche porte loin)',done:'les fronts sont annoncés plus tôt.'},
  necropolis:{effect:'déblaiement des corps par les ouvriers ×'+amount(R.works.necropolis.clearSpeed),price:'signature +'+R.works.necropolis.signature+' (fumée permanente)',done:'bûchers et fosses dégagent les murs plus vite.'}
 };
 const none=()=>({steps:0,left:0,wave:null});
 function initial(){return{version:1,active:false,works:Object.fromEntries(IDS.map(id=>[id,none()]))};}
 const total=id=>R.works[id].steps.length;
 const plain=v=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
 const exact=(v,keys)=>Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Grands ouvrages 217 invalides.');};
  if(!plain(raw)||raw.version!==1||typeof raw.active!=='boolean'||!exact(raw,KEYS)||!plain(raw.works)||!exact(raw.works,IDS))bad();
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
  return{version:1,active:raw.active,works};
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
   if(sieged())return{ok:false,reason:'Aucune tranche ne se lance de l’alerte à la fin de l’assaut.'};
   if(w.wave!==null&&!(g.wave>w.wave))return{ok:false,reason:'Une seule tranche par nuit : la suivante après le prochain assaut repoussé.'};
   if(!Number.isInteger(g.wave)||g.wave<0||g.wave>MAX_WAVE)return{ok:false,reason:'Nuit de campagne illisible.'};
   const price=R.works[id].steps[w.steps].cost;
   if(!C.canAfford(g.resources,price))return{ok:false,reason:'Stock insuffisant : il faut '+cost(price)+'.'};
   if(!atDepot())return{ok:false,reason:'Décidez-le au dépôt de D-17, à pied et les mains libres.'};
   return{ok:true,cost:price};
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
   if(!active()||!(dt>0)||g.state!=='playing'||g.gameOver||sieged()||!crew())return;
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
  function overview(){
   if(!active())return{summary:'Cette campagne ne suit pas les grands ouvrages : ils viennent avec les campagnes commencées après leur arrivée.',rows:[{label:'Grands ouvrages',value:'Non suivis'}]};
   if(!open())return{summary:'La cité est encore trop petite pour de tels chantiers. Les grands ouvrages viendront à l’âge '+START+'.',rows:[{label:'Grands ouvrages',value:'Aucun avant l’âge '+START}]};
   const rows=[{label:'Chantier',value:'Par tranches, payées au dépôt puis construites ; une tranche par ouvrage et par nuit, arrêtée de l’alerte à la fin de l’assaut.'}];
   for(const id of IDS){
    const w=state.works[id],next=w.steps<total(id)&&!(w.left>0)?' Prochaine tranche : '+cost(R.works[id].steps[w.steps].cost)+', '+C.formatTime(R.works[id].steps[w.steps].seconds)+' de chantier.':'';
    rows.push({label:NAMES[id],value:status(id)+' — Effet : '+TERMS[id].effect+'. Prix : '+TERMS[id].price+'.'+next});
   }
   const live=IDS.filter(done).map(id=>NAMES[id]);
   return{summary:live.length?'Achevés : '+live.join(', ')+'. Chaque ouvrage résout un problème et en crée un.':'Aucun grand ouvrage achevé. Un ouvrage inachevé ne sert à rien : il faut tenir plusieurs nuits pour le finir.',rows};
  }
  function actions(){
   if(!open())return[];
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
   const foot=(extra>0?'Signature ajoutée par les ouvrages achevés : +'+extra+' (comptée dans le total ci-dessus, hors des quatre parts). ':'')+(live.length===IDS.length?'':'Tranches à lancer au dépôt, fiche « Grands ouvrages » des opérations ; aucun effet avant la dernière.');
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
  function marks(){
   const core=typeof g.core==='function'?g.core():null;
   if(!open()||!core||!Number.isFinite(core.x)||!Number.isFinite(core.y))return[];
   return IDS.map((id,i)=>({id,x:core.x+(i*2-(IDS.length-1))*46,y:core.y-58,steps:state.works[id].steps,total:total(id),building:state.works[id].left>0,done:done(id)})).filter(m=>m.steps>0||m.building);
  }
  function drawMarks(ctx){
   const list=marks();if(!list.length)return 0;
   const zoom=Number(g.camera.zoom)||1;
   ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
   for(const m of list){
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
  const fresh=()=>{text='';clock=-Infinity;};
  const api=Object.freeze({active,open,done,signature:()=>signature(state),quote,launch,tick,status,overview,actions,render,marks,drawMarks,snapshot:()=>validate(state)});g.greatWorks217=api;
  g.expansions.register({id:'greatWorks217',title:'Grands ouvrages',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);fresh();},reset:()=>{state={...initial(),active:true};fresh();}});
  return api;
 }
 const api=Object.freeze({IDS:Object.freeze([...IDS]),NAMES:Object.freeze({...NAMES}),initial,validate,signature,install});root.DeadwallGreatWorks217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
