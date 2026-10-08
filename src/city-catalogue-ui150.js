/* Every city age can be inspected from the existing preparation dossier. */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{
  root.DeadwallCityCatalogueUI150=api;
  const mount=()=>api.install(root.DEADWALL,root.document,root.DeadwallCityCatalogue150,root.DeadwallCore);
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function install(g,doc,model,C){
  if(!g?.urbanUI||g.cityCatalogueUI150||!doc||!model||!C)return false;
  const panel=doc.getElementById('coordinationPanel');if(!panel)return false;
  // Install after Game's historical PowerGridArt wrapper, so the new front
  // accumulator keeps its own silhouette and reads the real stored charge.
  globalThis.DeadwallD17Art150?.install?.(g);
  globalThis.DeadwallD17Art152?.install?.(g);
  const catalogue=model.create(C),el=(tag,value,cls)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
  const write=(n,v)=>{if(n.textContent!==String(v))n.textContent=String(v);};
  const block=el('fieldset',undefined,'city-catalogue150');block.id='cityCatalogue150';
  const legend=el('legend','Les choix de chaque âge'),intro=el('p','Choisissez un âge pour voir les constructions, évolutions et préparatifs qu’il ouvre. Les options déjà acquises restent disponibles aux âges suivants.','city-catalogue-note150');
  const controls=el('div',undefined,'city-catalogue-controls150'),label=el('label','ÂGE À CONSULTER'),select=el('select');select.id='cityCatalogueAge150';label.htmlFor=select.id;
  const current=el('button','REVENIR À L’ÂGE ATTEINT');current.id='cityCatalogueCurrent150';current.type='button';
  for(const {age}of catalogue.ages){const o=el('option',age.name+' · '+age.requiredScore+' points');o.value=String(age.id);select.appendChild(o);}
  const summary=el('p',undefined,'city-catalogue-summary150');summary.id='cityCatalogueSummary150';summary.setAttribute('role','status');select.setAttribute('aria-describedby',summary.id);
  controls.append(label,select,current);const groups=el('div',undefined,'city-catalogue-groups150');groups.id='cityCatalogueGroups150';
  const reminder=el('p','Âge atteint, support achevé, plan récupéré et matériaux sont des conditions différentes. Une consultation ne construit rien ; les chantiers ne donnent leurs capacités qu’après achèvement.','city-catalogue-note150');
  const shared=el('details',undefined,'city-catalogue-shared150');shared.append(el('summary','Équipements et activités sans nouvel âge'),el('p',catalogue.alwaysAvailable.note));
  block.append(legend,intro,controls,summary,reminder,groups,shared);panel.appendChild(block);
  const cards=new Map(),opened=new Map();let selected=0,rendered=-1,world=null,last=-Infinity,lastContext='';
  const visible=()=>!panel.closest('.hidden')&&!panel.closest('[inert]');
  const now=()=>globalThis.performance?.now?.()??Date.now();
  function canNavigate(){return g.state==='playing'&&!g.gameOver&&!g.player?.dead&&g.canIssueCommand();}
  function openController(item){
   if(!canNavigate())return false;
   if(item.kind==='building'){
    if(item.upgradeOnly){g.showCommand(true,'enclosure');return true;}
    g.showCommand(false);if(g.paused)g.togglePause(false);g.currentCategory=item.category;g.refreshBuildMenu(true);g.setBuildCollapsed(false);
    const target=[...g.ui.buildList.children].find(n=>n.dataset.buildId===item.id);
    if(target&&!target.disabled)target.focus({preventScroll:true});else g.ui.toggleBuild?.focus({preventScroll:true});
    target?.scrollIntoView?.({block:'nearest',inline:'nearest'});return true;
   }
   if(item.kind==='road')return g.infrastructure?.open?.()!==false;
   if(item.kind==='mechanism'||item.kind==='fitting')return g.expansionUI?.open?.('fortification')!==false;
   if(item.kind==='exercise')return g.expansionUI?.open?.('companions')!==false;
   if(item.kind==='recipe')return g.arsenalUI134?.open?.()!==false;
   if(item.kind==='plan')return g.dayworks?.open?.()!==false;
   if(item.kind==='role'){g.showCommand(true,'workers');return true;}
   if(item.kind==='doctrine'){g.showCommand(true,'research');return true;}
   if(item.kind==='vehicle')return g.worldEvolutionUI?.open?.('fleet')!==false;
   return false;
  }
  function actionLabel(item){return({building:item.upgradeOnly?'VOIR LES STRUCTURES':'OUVRIR LE CATALOGUE',road:'VOIR LA VOIRIE',mechanism:'VOIR LES FORTIFICATIONS',fitting:'VOIR LES FORTIFICATIONS',exercise:'VOIR LES ACCOMPAGNATEURS',plan:'VOIR LES ENSEMBLES',recipe:'OUVRIR L’ARMURERIE',role:'VOIR LE PERSONNEL',doctrine:'VOIR LES DOCTRINES',vehicle:'VOIR LA FLOTTE'})[item.kind];}
  function render(){
   if(rendered===selected)return;
   for(const details of groups.children)opened.set(details.dataset.kind,!!details.open);
   groups.replaceChildren();cards.clear();rendered=selected;
   const row=catalogue.ages[selected];
   for(const [kind,title]of Object.entries(catalogue.groups)){
    const entries=row.items.filter(item=>item.kind===kind);if(!entries.length)continue;
    const details=el('details',undefined,'city-catalogue-group150');details.dataset.kind=kind;details.open=opened.get(kind)||false;
    const heading=el('summary',title+' · '+entries.length),list=el('div',undefined,'city-catalogue-list150');details.append(heading,list);
    details.addEventListener('toggle',()=>{opened.set(kind,!!details.open);if(!details.open&&details.contains(doc.activeElement))heading.focus({preventScroll:true});});
    for(const item of entries){
     const card=el('article',undefined,'city-catalogue-card150');card.dataset.choice=item.key;card.dataset.new=String(!!item.new150);
     const title=el('h3',item.name),description=el('p',item.description),cost=el('p',(item.kind==='road'?'Coût par cellule : ':item.upgradeOnly?'Coût de l’évolution : ':item.payment==='bag'?'Coût dans le sac : ':'Coût au dépôt : ')+C.resourceText(item.cost),'city-catalogue-cost150');
     const state=el('p',undefined,'city-catalogue-state150'),requirements=el('ul',undefined,'city-catalogue-conditions150'),facts=el('ul',undefined,'city-catalogue-facts150');
     for(const text of item.facts)facts.appendChild(el('li',text));
     for(const condition of item.conditions){const li=el('li',condition.text);li.dataset.condition=condition.kind;requirements.appendChild(li);}
     for(const text of item.tradeoffs)facts.appendChild(el('li',text));
     const material=el('p',undefined,'city-catalogue-note150'),storage=el('p',undefined,'city-catalogue-note150'),action=el('button',actionLabel(item));action.type='button';action.dataset.catalogueAction=item.key;action.setAttribute('aria-label',actionLabel(item)+' — '+item.name);
     action.addEventListener('click',()=>{if(!action.disabled&&!action.closest('[inert]'))openController(item);});
     card.append(title,description,cost,state,requirements,facts,material,storage,action);list.appendChild(card);cards.set(item.key,{item,card,state,requirements,material,storage,action});
    }
    groups.appendChild(details);
   }
   lastContext='';
  }
  function refresh(force=false){
   if(!visible())return false;
   if(!force&&now()-last<500)return false;last=now();
   if(world!==g.world){world=g.world;selected=g.tier?.id??0;rendered=-1;select.value=String(selected);}
   render();const context=model.context(g),row=catalogue.ages[selected],buildings=row.items.filter(d=>d.kind==='building').length,other=row.items.length-buildings;
   write(summary,row.age.name+' · '+(selected<=context.age?'Âge connu':'À atteindre : '+row.age.requiredScore+' points construits')+' · '+buildings+' modèle(s) de construction et '+other+' autre(s) choix à ce palier.');
   const key=JSON.stringify([context,canNavigate()]);if(key===lastContext&&!force)return true;lastContext=key;
   for(const view of cards.values()){
    const s=model.status(view.item,context);view.card.dataset.known=String(s.known);
    write(view.state,s.completed?'Doctrine déjà acquise.':s.known?'Connaissance de cet âge acquise.':'Âge à atteindre avant utilisation.');
    for(let i=0;i<view.item.conditions.length;i++){const condition=view.item.conditions[i],li=view.requirements.children[i];if(condition.kind==='building')write(li,(s.missingBuildings.includes(condition.id)?'À construire et achever : ':'Support achevé : ')+(C.BUILDINGS[condition.id]?.name||condition.id)+'.');}
    const source=view.item.payment==='bag'?'dans le sac':'au dépôt';
    write(view.material,s.completed?'Déjà achetée ; aucun nouvel achat nécessaire.':(Object.keys(s.missing).length?'Manque '+source+' : '+C.resourceText(s.missing)+'.':'Matériaux présents '+source+' ; emplacement et conditions de l’opération restent à vérifier.')+(s.missingInsight?' Il manque '+s.missingInsight+' point(s) d’analyse.':''));
    view.storage.hidden=s.storageShortfall<=0;write(view.storage,s.storageShortfall>0?'Capacité nécessaire : '+s.minimumStorage+' par ressource, '+context.storage+' actuellement. Achevez du stockage avant ce financement.':'');
    view.action.disabled=!canNavigate();
   }
   return true;
  }
  function selectAge(id){if(!Number.isInteger(id)||!catalogue.ages[id])return false;selected=id;select.value=String(id);rendered=-1;refresh(true);return true;}
  select.addEventListener('change',()=>selectAge(Number(select.value)));
  current.addEventListener('click',()=>selectAge(g.tier?.id??0));
  const previous=g.updateUI.bind(g);g.updateUI=(...args)=>{const result=previous(...args);refresh();return result;};
  const oldCoordination=g.coordinationUI;if(oldCoordination)g.coordinationUI=Object.freeze({...oldCoordination,open:(...args)=>{const result=oldCoordination.open(...args);refresh(true);return result;}});
  for(const id of ['coordinationTab','preparationButton'])doc.getElementById(id)?.addEventListener('click',()=>refresh(true));
  g.cityCatalogueUI150=Object.freeze({refresh,selectAge,open:()=>{const ok=g.coordinationUI?.open?.();if(ok===false)return false;refresh(true);select.focus({preventScroll:true});block.scrollIntoView?.({block:'start',inline:'nearest'});return true;},catalogue,element:block,selectedAge:()=>selected});
  return true;
 }
 return Object.freeze({install});
});
