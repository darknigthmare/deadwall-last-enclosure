/* Compact contextual HUD, paper journal and local building management. */
(function(root){
'use strict';const g=root.DEADWALL,C=root.DeadwallCore;if(!g?.fieldcraft)return;
function mount(){
 if(g.fieldcraftUI)return;
 const get=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(title,id,fn)=>{const b=el('button',title);b.type='button';b.id=id;b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]')){fn();refresh();}});return b;};
 const wrench='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3a6 6 0 0 0-6 8L2 17a3 3 0 0 0 5 5l6-6a6 6 0 0 0 8-7l-4 4-4-4 4-4a6 6 0 0 0-3-2Z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><small>B</small>';
 const collapse=g.setBuildCollapsed.bind(g);g.setBuildCollapsed=v=>{const result=collapse(v);if(g.buildCollapsed){g.ui.toggleBuild.innerHTML=wrench;g.ui.toggleBuild.title='Construction · B';}return result;};g.setBuildCollapsed(g.buildCollapsed);
 const card=g.ui.rightPanel.querySelector('.command-card');
 function group(title,id,ids){const section=el('details',undefined,'hud-section14'),summary=el('summary',title),content=el('div',undefined,'hud-buttons14');section.id=id;section.append(summary,content);for(const key of ids){const n=get(key);if(n)content.append(n);}card.append(section);return section;}
 group('PERSONNEL','hudPersonnel14',['recruitWorker','recruitSoldier','specialistCommandButton']);
 group('DÉFENSE & ORDRES','hudOrders14',['setRally','squadCommandButton','repairAll','researchButton']);
 const journal=get('journalCommandButton');if(journal)card.insertBefore(journal,card.firstChild);
 const settings=get('settingsToggle'),sound=get('soundToggle');
 if(settings)get('pauseMenu').querySelector('main').append(settings);
 if(sound)(get('settingsModal')?.querySelector('main')||get('pauseMenu').querySelector('main')).append(sound);
 const gear=button('⚙','hudSettings14',()=>g.showSettings(true));gear.className='icon-button';gear.setAttribute('aria-label','Paramètres et sauvegardes');get('pauseButton').before(gear);
 get('quickOrders')?.classList.add('hidden');
 const local=el('section',undefined,'local-actions14');local.id='localActions14';const localName=el('strong');
 local.append(localName,button('O · ORIENTER','localRotate14',()=>g.fieldcraft.rotate()),button('P · DÉPLACER','localMove14',()=>g.fieldcraft.beginMove()),button('I · GÉRER','localManage14',()=>{if(g.fieldcraft.context().mounted){g.fieldcraft.control();return;}const b=g.fieldcraft.nearby();if(b)showBuilding(b);}));g.ui.hud.append(local);
 const field=get('commandPanel-field'),panel=el('section',undefined,'building-panel14 hidden');panel.id='buildingPanel14';field.append(panel);
 const heading=el('h2'),description=el('p'),stats=el('div',undefined,'building-stats14'),notice=el('p',undefined,'building-notice14'),actions=el('div',undefined,'building-buttons14');
 panel.append(el('small','POSTE LOCAL / STRUCTURE'),heading,description,stats,notice,actions);let selected=null;
 actions.append(button('RÉPARER','buildingRepair14',()=>{g.selectBuilding(g.world.buildings.get(selected));g.repairSelected();}),button('AMÉLIORER','buildingUpgrade14',()=>{g.selectBuilding(g.world.buildings.get(selected));g.upgradeSelected();}),button('PRIORITÉ','buildingPriority14',()=>{g.selectBuilding(g.world.buildings.get(selected));g.cyclePriority();}),button('PRENDRE LE TIR','buildingControl14',()=>{if(g.fieldcraft.control(g.world.buildings.get(selected)))g.showCommand(false);}));
 const circuit=el('select');circuit.id='buildingCircuit14';circuit.setAttribute('aria-label','Circuit électrique du bâtiment');
 for(const[value,label]of [['on','Toujours alimenter'],['day','Jour uniquement'],['night','Nuit uniquement'],['off','Circuit coupé']]){const option=el('option',label);option.value=value;circuit.append(option);}
 circuit.addEventListener('change',()=>{g.powerGrid.setCircuit(selected,circuit.value);refresh();});panel.append(circuit);
 const review=el('section',undefined,'building-review14 hidden'),quoteText=el('p');review.id='buildingReview14';
 review.append(el('h3','Confirmer les travaux'),quoteText,button('CONFIRMER ET PAYER','buildingConfirm14',()=>{g.fieldcraft.commit();showBuilding(g.world.buildings.get(selected));}),button('ANNULER SANS DÉPENSE','buildingCancel14',()=>{g.fieldcraft.cancel();review.classList.add('hidden');}));
 panel.append(review,button('RETOUR AUX PRÉPARATIFS','buildingBack14',()=>{g.fieldcraft.cancel();panel.classList.add('hidden');g.coordinationUI.open();}));
 function showBuilding(b,q=null){if(!b)return;selected=b.id;g.showCommand(true,'field');for(const section of field.children)if(section.tagName==='SECTION')section.classList.toggle('hidden',section!==panel);review.classList.toggle('hidden',!q);quoteText.textContent=q?q.reason:'';get('buildingConfirm14').disabled=!q?.ok;refresh();}
 field.querySelector('.field-nav').addEventListener('click',()=>{panel.classList.add('hidden');g.fieldcraft.cancel();});
 const reload=el('section',undefined,'active-reload14 hidden');reload.id='activeReload14';
 const reloadText=el('strong'),track=el('div',undefined,'active-track14'),marker=el('i',undefined,'active-marker14');
 track.append(el('span',undefined,'active-good14'),el('span',undefined,'active-perfect14'),marker);
 reload.append(reloadText,track,button('R · CALER LE CHARGEUR','activeReloadButton14',()=>g.startReload()));g.ui.hud.append(reload);
 const journalPanel=get('commandPanel-journal'),book=el('div',undefined,'paper-book14'),left=el('article',undefined,'paper-page14 paper-left14'),right=el('article',undefined,'paper-page14 paper-right14');
 left.id='journalLeft14';right.id='journalRight14';
 const chapters=get('narrativeChapters').parentElement,operations=get('narrativeOperations').parentElement;
 left.append(el('small','D-17 / CARNET DU DÉPÔT'),chapters);right.append(el('small','OBSERVATIONS / DÉCISIONS'),operations);book.append(left,right);journalPanel.append(book);
 let page=0;const pagination=el('nav',undefined,'paper-pagination14'),pageText=el('span');
 pagination.append(button('← PAGE PRÉCÉDENTE','journalPrev14',()=>turn(page-1)),pageText,button('PAGE SUIVANTE →','journalNext14',()=>turn(page+1)));journalPanel.append(pagination);
 function turn(value){const pages=[...get('narrativeOperations').children];page=Math.max(0,Math.min(pages.length-1,value));pages.forEach((node,i)=>{node.classList.toggle('paper-hidden14',i!==page);if(i===page)node.open=true;});pageText.textContent='FEUILLET '+(page+1)+' / '+pages.length;get('journalPrev14').disabled=page===0;get('journalNext14').disabled=page===pages.length-1;}
 turn(0);let frame=0;
 function refresh(){
  const b=g.fieldcraft.nearby(),ctx=g.fieldcraft.context(),playing=g.state==='playing'&&!g.gameOver;
  local.classList.toggle('hidden',!playing||!b||g.activeOverlay||g.expeditions.driving());localName.textContent=ctx.mounted?'TIR MANUEL · I POUR QUITTER':b?b.def.name:'';
  get('localMove14').disabled=get('localRotate14').disabled=!b||g.phase!=='calm'||!b.completed||b.type==='core';
  const active=g.player.reload>0,info=g.fieldcraft.reload();reload.classList.toggle('hidden',!playing||(!active&&!info.feedback)||Boolean(g.activeOverlay));
  marker.style.left=Math.max(0,Math.min(100,info.p*100))+'%';reload.dataset.outcome=info.outcome;
  reloadText.textContent=info.outcome==='failed'?'MAUVAIS TIMING — RECHARGEMENT RALENTI':info.attempt?(info.outcome==='perfect'?'PARFAIT':'RECHARGEMENT ACCÉLÉRÉ'):'RECHARGER · APPUYER DANS LA ZONE';get('activeReloadButton14').disabled=!active||info.attempt||!g.canIssueCommand();
  if(!panel.classList.contains('hidden')){
   const s=g.world.buildings.get(selected);if(!s){panel.classList.add('hidden');g.coordinationUI.open();return;}
   heading.textContent=s.def.name;description.textContent=s.def.description;
   stats.textContent='Intégrité '+Math.ceil(s.health)+' / '+s.maxHealth+' · Cellule '+s.gx+','+s.gy+' · Rotation '+s.rotation*90+'°'+(s.def.housing?' · '+s.def.housing+' logements':'')+(s.def.storage?' · '+s.def.storage+' places par ressource':'')+(s.def.production?' · Production : '+C.resourceText(s.def.production)+'/s':'');
   notice.textContent=s.def.powerUse?'Courant '+(s.powered?'disponible':'insuffisant / coupé')+' · besoin '+s.def.powerUse:'Cette structure ne consomme pas d’électricité.';
   circuit.classList.toggle('hidden',!s.def.powerUse);circuit.value=g.powerGrid.circuitMode(s.id);
   get('buildingControl14').classList.toggle('hidden',!s.def.fireRate);
   const repair=g.structureActionStatus('repair',s),upgrade=g.structureActionStatus('upgrade',s);get('buildingRepair14').title=repair.reason||C.resourceText(repair.cost);get('buildingUpgrade14').title=upgrade.reason||C.resourceText(upgrade.cost);
   get('buildingRepair14').disabled=!repair.ok;get('buildingUpgrade14').disabled=!upgrade.ok;
   if(!ctx.quote)review.classList.add('hidden');
  }
 }
 const update=g.updateUI.bind(g);g.updateUI=(...args)=>{const result=update(...args);refresh();return result;};
 const render=g.render.bind(g);g.render=(...args)=>{const result=render(...args);if(frame++%3===0)refresh();return result;};
 const close=g.showCommand.bind(g);g.showCommand=(show,...args)=>{if(!show&&g.fieldcraft.context().quote)g.fieldcraft.cancel();return close(show,...args);};
 g.fieldcraftUI=Object.freeze({showBuilding,refresh,turn});refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(globalThis);
