/* Player presentation policy. Original command, payment and save owners stay authoritative. */
(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallPlayerMenus194=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 else if(root.document){
  // Browsers flush microtasks between DOMContentLoaded listeners. Run after the
  // event dispatch, once the original presenters have finished moving controls.
  const mount=()=>{const game=root.DEADWALL,doc=root.document;setTimeout(()=>{if(root.DEADWALL===game&&root.document===doc)api.install(game,doc);},0);};
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const MAINTENANCE=new Set(['expand131','expandCodex3000','expandTerritories160','expandCodex4000','sanitationMedical164','completeCodex163','furnishing162','packing173','gardens171','stations170','sourceComplements169','fillDetails168','ensembleDetails165','quantityDetails164','anchoredDetails160','richDetails159','expand','metricVehicle174']);
 const DOMAINS=[['terrain','SUR LE TERRAIN'],['city','DANS LA CITÉ'],['reference','GUIDE DE SURVIE']];
 const ROUTES={expansions:['terrain','field-expansions'],operations:['terrain','field-operations'],recon:['terrain','reconPanel'],sectors:['terrain','field-sectors'],coordination:['city','coordinationPanel'],crew:['city','field-crew'],logistics:['city','field-logistics'],territories:['city','field-territories'],siege:['city','field-siege'],dayworks:['city','dayworksPanel'],citadel:['city','citadelPanel'],infrastructure:['city','infrastructurePanel'],linecare:['city','linecarePanel'],infected:['reference','field-infected'],'world-codex':['reference','field-world-codex']};
 function toolsEnabled(){try{return new URLSearchParams(root.location?.search||'').get('tools')==='1';}catch{return false;}}
 function currentStart(){return !(toolsEnabled()&&new URLSearchParams(root.location?.search||'').get('fixture')==='legacy');}
 function isMaintenance(pack,id){return pack==='world131'&&MAINTENANCE.has(id);}
 function install(g,doc){
  if(!g||!doc?.body||g.playerMenus194)return false;
  const get=id=>doc.getElementById(id),modal=g.ui.commandModal,field=get('commandPanel-field'),nav=field?.querySelector('.field-nav');
  if(!modal||!nav)return false;
  const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.classList.add(...cls.split(' '));return n;};
  const write=(n,text)=>{if(n&&n.textContent!==String(text))n.textContent=String(text);};
  const button=(id,text,run)=>{const n=el('button',text);n.id=id;n.type='button';n.addEventListener('click',()=>{if(!n.disabled&&!n.closest('[inert]'))run();});return n;};
  if(toolsEnabled()){
   doc.body.classList.add('author-tools194');
   const note=el('p',currentStart()?'ATELIER AUTEUR — outils de conception, distincts de la campagne.':'ATELIER AUTEUR — scénario historique G8 explicite pour les contrats de régression.','author-note194');note.id='authorMode194';get('mainMenu').querySelector('.menu-card').appendChild(note);
   g.playerMenus194=Object.freeze({mode:'author',maintenanceOpen:false,arrangeActions(){}});return true;
  }
  doc.body.classList.add('player-menus194');modal.classList.add('field-notebook194');
  const defaultScenario=[...(get('startScenario')?.children||[])].find(n=>n.value==='classic');if(defaultScenario)defaultScenario.textContent='Le dépôt — départ recommandé';
  let domain='terrain',selectedField='field-expansions',maintenance=false,openingMaintenance=false;
  const header=modal.querySelector('.command-heading');write(get('commandTitle'),'CARNET DU COMMANDANT');
  for(const id of ['pauseCommandButton','cityCommandButton']){const b=get(id);if(b){b.textContent='CARNET DU COMMANDANT';b.setAttribute('aria-label','Ouvrir le carnet du commandant');}}
  get('commandClose').setAttribute('aria-label','Fermer le carnet du commandant');
  const headingSmall=header.querySelector('small');write(headingSmall,'D-17 / ORDRES ET NOTES DE TERRAIN');
  const goal=el('section',undefined,'next-step194');goal.id='playerObjective194';goal.setAttribute('aria-labelledby','playerObjectiveTitle194');
  const goalTitle=el('h3');goalTitle.id='playerObjectiveTitle194';const goalText=el('p');goalText.id='playerObjectiveText194';
  goal.append(el('small','VOTRE PROCHAIN GESTE'),goalTitle,goalText);
  const resume=button('playerObjectiveReturn194','RETOUR AU TERRAIN',()=>g.showCommand(false));goal.appendChild(resume);
  const situation=get('commandPanel-enclosure');situation.prepend(goal);
  const quickTitle=el('p','Un ordre prépare une action. Les déplacements, la récolte et les travaux se font sur le terrain.','notebook-note194');situation.insertBefore(quickTitle,goal.nextSibling||null);
  // Five player tabs; campaign records are a system action, not an in-world order.
  const tabTitles={enclosure:'Situation',workers:'Équipes',research:'Doctrines',field:'Dossiers',journal:'Journal'};
  for(const [id,title] of Object.entries(tabTitles)){const b=get('commandTab-'+id);write(b.querySelector('strong'),title);b.setAttribute('aria-label',title);}
  const records=get('commandTab-records');records.hidden=true;
  const pauseCard=get('resumeButton').parentNode;
  pauseCard.appendChild(button('pauseRecords194','BILANS DES CAMPAGNES',()=>g.showCommand(true,'records')));
  // Compatibility tools are opt-in system maintenance; never a progression goal.
  const maintenanceBox=el('details',undefined,'maintenance194');maintenanceBox.id='campaignMaintenance194';
  maintenanceBox.append(el('summary','Compatibilité des anciennes sauvegardes'),el('p','Ne modifie rien à l’ouverture. Exportez votre campagne avant toute conversion. Les nouvelles parties utilisent déjà le contenu actuel.'));
  const maintenanceButton=button('openCampaignMaintenance194','EXAMINER LES OPTIONS DE COMPATIBILITÉ',()=>openMaintenance());maintenanceBox.appendChild(maintenanceButton);
  const settings=get('settingsStatus')?.parentNode;if(settings)settings.appendChild(maintenanceBox);
  const maintenanceBanner=el('p','MAINTENANCE DE SAUVEGARDE — Ces conversions ne sont pas des objectifs de jeu.','maintenance-banner194');maintenanceBanner.id='maintenanceBanner194';maintenanceBanner.hidden=true;maintenanceBanner.appendChild(button('maintenanceReturn194','RETOUR AUX PARAMÈTRES',()=>{g.showCommand(false);g.showSettings(true);}));field.prepend(maintenanceBanner);
  // Existing field controls are kept, grouped by purpose and routed to one panel.
  const originalButtons=[...nav.querySelectorAll('button')],groupNav=el('nav',undefined,'notebook-domains194');groupNav.id='notebookDomains194';groupNav.setAttribute('aria-label','Classement des dossiers');nav.before(groupNav);
  const groupButtons=new Map(),routeByButton=new Map();
  for(const b of originalButtons){const key=b.dataset.fieldView||b.id.replace(/Tab$/,'');const route=ROUTES[key];if(!route)continue;routeByButton.set(b,route);b.setAttribute('aria-controls',route[1]);b.addEventListener('click',()=>{leaveMaintenance();activateField(route[1]);});}
  for(const [id,label]of DOMAINS){const b=button('notebookDomain-'+id,label,()=>{leaveMaintenance();const first=[...routeByButton].find(([,r])=>r[0]===id);if(first){first[0].click();activateField(first[1][1]);}});b.setAttribute('aria-controls','commandPanel-field');groupNav.appendChild(b);groupButtons.set(id,b);}
  function syncNav(){
   for(const [b,r]of routeByButton){b.hidden=!maintenance&&r[0]!==domain;b.setAttribute('aria-pressed',String(r[1]===selectedField));}
   for(const [id,b]of groupButtons)b.setAttribute('aria-pressed',String(id===domain));
   groupNav.hidden=maintenance;nav.hidden=maintenance;maintenanceBanner.hidden=!maintenance;
  }
  function activateField(id){
   if(![...field.children].some(n=>n.tagName==='SECTION'&&n.id===id))return false;
   selectedField=id;domain=Object.values(ROUTES).find(r=>r[1]===id)?.[0]||domain;
   for(const n of field.children)if(n.tagName==='SECTION')n.classList.toggle('hidden',n.id!==id);
   syncNav();return true;
  }
  function leaveMaintenance(){maintenance=false;syncNav();}
  function openMaintenance(){
   if(g.state!=='playing'||g.gameOver||g.player?.dead)return false;
   openingMaintenance=true;
   try{g.showSettings?.(false);maintenance=true;g.expansionUI.open('world131');activateField('field-expansions');g.expansionUI.refresh(true);return g.activeOverlay===modal;}
   finally{openingMaintenance=false;}
  }
  function arrangeActions(actions){
   if(!actions)return;const cards=[...actions.querySelectorAll('.expansion-action')];if(!cards.length)return;
   let later=[...actions.children].find(n=>n.id==='unavailableActions194');
   if(!later){later=el('details',undefined,'unavailable-actions194');later.id='unavailableActions194';later.appendChild(el('summary'));actions.appendChild(later);}
   let count=0;
   for(const card of cards){const disabled=card.dataset.available==='false';if(disabled)count++;const host=disabled?later:actions;if(card.parentNode!==host){if(disabled)host.appendChild(card);else actions.insertBefore(card,later);}}
   later.hidden=count===0;write(later.querySelector('summary'),'À préparer ou indisponible ici ('+count+')');
  }
  function refresh(){
   const active=g.state==='playing'&&!g.gameOver;goal.hidden=!active;maintenanceButton.disabled=!active||g.player?.dead;
   if(active){write(goalTitle,g.ui.objectiveTitle.textContent||'Établir le refuge');write(goalText,g.ui.objectiveText.textContent||'Récoltez, rapportez vos matériaux au dépôt, puis financez une première défense.');write(resume,g.ui.pauseMenu.classList.contains('hidden')?'RETOUR AU TERRAIN':'RETOUR À LA PAUSE');}
  }
  const oldCommand=g.showCommand.bind(g);
  g.showCommand=(show,tab='enclosure')=>{
   if(!openingMaintenance)leaveMaintenance();records.hidden=!(show&&tab==='records');
   const result=oldCommand(show,tab);
   if(show&&!modal.classList.contains('hidden')&&tab==='field'){activateField('field-expansions');g.expansionUI?.refresh(true);}
   refresh();return result;
  };
  // Direct shortcuts share the same panel exclusivity as a click on its tab.
  for(const [name,id]of Object.entries({worldCodex:'field-world-codex',fieldOperations:'field-operations',expansionUI:'field-expansions',coordinationUI:'coordinationPanel',linecareUI:'linecarePanel',reconUI:'reconPanel',siegeUI:'field-siege',dayworksUI:'dayworksPanel',citadelUI:'citadelPanel',infrastructureUI:'infrastructurePanel'})){
   const api=g[name];if(typeof api?.open!=='function')continue;const original=api.open.bind(api);g[name]=Object.freeze({...api,open(...args){const result=original(...args);if(g.activeOverlay===modal&&!field.classList.contains('hidden'))activateField(id);return result;}});
  }
  const content=g.contentUI;if(content?.choose){const choose=content.choose.bind(content);g.contentUI={...content,choose(id){const result=choose(id);activateField('field-'+id);return result;}};}
  const oldUI=g.updateUI.bind(g);g.updateUI=(...args)=>{const result=oldUI(...args);refresh();return result;};
  g.playerMenus194=Object.freeze({mode:'player',get maintenanceOpen(){return maintenance;},openMaintenance,leaveMaintenance,activateField,arrangeActions,refresh,view:()=>({domain,selectedField,maintenance})});
  // Relais and archive routes cannot retain stale maintenance mode after navigation.
  for(const id of ['expansionGroup-defense','expansionGroup-exploration','expansionGroup-player','expansionGroup-world','expansionGroup-lore'])get(id)?.addEventListener('click',()=>{leaveMaintenance();g.expansionUI.refresh(true);});
  refresh();activateField('field-expansions');return true;
 }
 return Object.freeze({install,toolsEnabled,currentStart,isMaintenance});
});
