(function initCoordinationUI(root) {
  'use strict';
  const game = root.DEADWALL, model = root.DeadwallCoordination, C = root.DeadwallCore;
  if (!game || !model || !root.document) return;
  function mount() {
    if (game.coordinationUI) return;
    const get = id => document.getElementById(id);
    const element = (tag, text, cls) => { const n=document.createElement(tag); if(text !== undefined)n.textContent=text; if(cls)n.className=cls; return n; };
    const field=get('commandPanel-field'), nav=field?.querySelector('.field-nav');
    if (!field || !nav) return;
    // Keep existing button nodes, their event listeners and cached Game references.
    const command=game.ui.rightPanel.querySelector('.command-card'), grid=command?.querySelector('.command-grid');
    const quick=element('details',undefined,'coord-quick'), quickTitle=element('summary','RECRUTER & DONNER UN ORDRE');quick.id='quickOrders';
    if(grid){const post=get('cityCommandButton');command.insertBefore(post,grid);quick.append(quickTitle,grid);command.appendChild(quick);}
    quick.addEventListener('toggle',()=>{if(!quick.open&&grid?.contains(document.activeElement))quickTitle.focus({preventScroll:true});});
    const panel=element('section',undefined,'coord-panel hidden');panel.id='coordinationPanel';field.appendChild(panel);
    const heading=element('h2','Avant de tenir la prochaine ligne'), context=element('p','','coord-context');
    heading.id='coordinationHeading143';heading.setAttribute('tabindex','-1');panel.setAttribute('aria-labelledby',heading.id);
    panel.append(element('small','D-17 / PRÉPARATIFS'),heading,context);
    const briefing=element('p','','coord-briefing143');briefing.id='coordinationBriefing143';panel.appendChild(briefing);
    const battleNav=element('nav',undefined,'coord-battle-actions143');battleNav.setAttribute('aria-label','Accéder aux ordres tactiques');
    for(const[id,label,tabName]of [['coordination143Enclosure','PORTES & ENCEINTES','enclosure'],['coordination143Squads','SECTIONS & OUVRIERS','workers']]){const button=element('button',label);button.id=id;button.type='button';button.addEventListener('click',()=>openOrders(tabName));battleNav.appendChild(button);}
    const maintenance=element('button','ENTRETIEN');maintenance.id='coordination147Maintenance';maintenance.type='button';maintenance.addEventListener('click',()=>{if(canOpen())game.linecare?.open();});battleNav.appendChild(maintenance);panel.appendChild(battleNav);
    const tactical=element('details',undefined,'coord-tactical147'),tacticalTitle=element('summary'),schedule=element('ol'),defenses=element('p'),limits=element('p','Les fronts annoncés décrivent les arrivées prévues, pas des ennemis déjà repérés. Seuls les contacts actuellement vus par vos observateurs donnent une direction. Les amas et dégâts ci-dessous concernent vos propres remparts.','coord-visibility147');
    tactical.id='coordination147Director';tacticalTitle.id='coordination147DirectorTitle';schedule.id='coordination147Schedule';defenses.id='coordination147Defenses';tactical.append(tacticalTitle,schedule,defenses,limits);panel.appendChild(tactical);
    const stageRows=[1,2,3].map(number=>{const row=element('li');row.dataset.echelon=String(number);schedule.appendChild(row);return row;});
    panel.appendChild(element('p','Des observations de la cité, pas des ordres automatiques : vous gardez le choix de sortir, de construire ou de rappeler une équipe.'));
    const cards=element('div',undefined,'coord-cards');panel.appendChild(cards);const entries=new Map();
    const actions={perimeter:()=>game.linecare?game.linecare.open():game.showCommand(true,'enclosure'),build:()=>game.citadel.open(),supply:()=>nav.querySelector('[data-field-view="logistics"]')?.click(),power:()=>nav.querySelector('[data-field-view="logistics"]')?.click(),teams:()=>game.citadel.open(),fire:()=>game.siege.open()};
    for(const id of ['perimeter','build','supply','power','teams','fire']){const card=element('article',undefined,'coord-card'),h=element('h3'),p=element('p'),b=element('button');b.type='button';b.dataset.prepare=id;b.addEventListener('click',()=>actions[id]());card.append(h,p,b);cards.appendChild(card);entries.set(id,{card,h,p,b});}
    const tab=element('button','PRÉPARATIFS');tab.type='button';tab.id='coordinationTab';tab.dataset.fieldView='coordination';nav.prepend(tab);
    let last=-Infinity;
    function refresh(force=false){if(panel.closest('.hidden'))return;if(!force&&performance.now()-last<500)return;last=performance.now();const data=model.inspect(game);
      cards.classList.toggle('hidden',!data);context.textContent=data?`Vague ${data.wave} · ${data.phase==='calm'?'préparation : '+C.formatTime(data.seconds):data.phase==='assault'?'assaut en cours':data.phase==='warning'?'alerte en cours':'sécurisation'} · action suspendue dans le commandement.`:'Lancez ou reprenez une campagne pour consulter son état.';
      const situation=data&&model.tactical(game),visible=!!situation&&situation.visible;
      briefing.classList.toggle('hidden',!visible);briefing.textContent=visible?root.DeadwallBattlefield.assaultText(situation.status)+(situation.inner?` ${situation.inner} contact(s) observé(s) près du centre.`:''):'';
      tactical.classList.toggle('hidden',!data);
      if(situation){tacticalTitle.textContent=(situation.visible?situation.title:'État des remparts')+(situation.status.echelon?` · échelon ${situation.status.echelon}/3`:'');schedule.classList.toggle('hidden',!situation.visible||!situation.stages.length);
        for(let i=0;i<stageRows.length;i++){const stage=situation.stages[i];if(!stage)continue;stageRows[i].textContent=`Échelon ${stage.number} : ${stage.fronts.join(' / ')}${data.phase==='assault'?(stage.number<situation.status.echelon?' · arrivées émises':stage.number===situation.status.echelon?' · échelon actuel':' · prévu'): ' · prévu'}`;stageRows[i].dataset.current=String(data.phase==='assault'&&stage.number===situation.status.echelon);}
        defenses.textContent=`${situation.fragile} rempart(s) fragile(s) · ${situation.corpseRamps} amas permettant le franchissement · ${situation.openGates} porte(s) ouverte(s) à tous · ${situation.braces} étai(s) avec absorption restante. L’entretien et les étais exigent leurs interventions physiques ; ce bilan ne les exécute pas.`;}
      for(const b of battleNav.children)b.disabled=!canOpen();
      if(!data)return;for(const row of data.cards){const n=entries.get(row.id);n.card.dataset.tone=row.tone;n.h.textContent=row.title;n.p.textContent=row.detail;n.b.textContent=row.action;n.b.disabled=!game.canIssueCommand();}}
    function canOpen(){return game.state==='playing'&&!game.gameOver&&!game.player?.dead&&(!game.activeOverlay||[game.ui.pauseMenu,game.ui.commandModal].includes(game.activeOverlay));}
    function openOrders(tabName){
      if(!['enclosure','workers'].includes(tabName)||!canOpen())return false;
      game.showCommand(true,tabName);if(game.activeOverlay!==game.ui.commandModal)return false;
      const target=get('commandPanel-'+tabName);target.setAttribute('tabindex','-1');target.scrollIntoView({block:'start',inline:'nearest'});target.focus({preventScroll:true});return true;
    }
    function open(){
      if(!canOpen())return false;
      game.showCommand(true,'field');if(game.activeOverlay!==game.ui.commandModal)return false;
      for(const n of field.children)if(n.tagName==='SECTION')n.classList.toggle('hidden',n!==panel);for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===tab));refresh(true);panel.scrollIntoView({block:'start',inline:'nearest'});heading.focus({preventScroll:true});return true;
    }
    tab.addEventListener('click',open);
    nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b!==tab){panel.classList.add('hidden');tab.setAttribute('aria-pressed','false');}});
    const openButton=element('button','PRÉPARER LA NUIT','coord-ready');openButton.type='button';openButton.id='preparationButton';openButton.addEventListener('click',open);command?.insertBefore(openButton,quick);
    // Search the actual catalogue; affordability is recalculated from current stocks.
    const filters=element('div',undefined,'coord-filter'),label=element('label','RECHERCHER UNE CONSTRUCTION'),search=element('input'),select=element('select'),count=element('small');
    search.id='buildSearch';search.type='search';search.placeholder='Nom ou fonction…';search.autocomplete='off';label.htmlFor=search.id;select.id='buildFilter';select.setAttribute('aria-label','Filtrer le catalogue de construction');
    for(const [value,text]of [['all','Tout le catalogue'],['unlocked','Technologies débloquées'],['affordable','Finançables maintenant']]){const o=element('option',text);o.value=value;select.appendChild(o);}
    count.id='buildFilterCount';count.setAttribute('role','status');search.setAttribute('aria-describedby',count.id);filters.append(label,search,select,count);get('buildCategories').after(filters);
    function filter(){let visible=0,total=0;for(const b of game.ui.buildList.children){const def=C.BUILDINGS[b.dataset.buildId];if(!def)continue;total++;const keep=model.matches(def,search.value)&&(select.value==='all'||!b.disabled&&(select.value!=='affordable'||C.canAfford(game.resources,def.cost)));b.classList.toggle('coord-filtered',!keep);if(keep)visible++;}
      const text=`${visible} / ${total} constructions dans cette catégorie`;if(count.textContent!==text)count.textContent=text;}
    search.addEventListener('input',filter);select.addEventListener('change',filter);
    for(const name of ['refreshBuildMenu','refreshBuildAffordability']){const previous=game[name].bind(game);game[name]=(...args)=>{const result=previous(...args);filter();return result;};}
    const collapse=game.setBuildCollapsed.bind(game);game.setBuildCollapsed=value=>{if(value&&filters.contains(document.activeElement))get('toggleBuild').focus({preventScroll:true});const result=collapse(value);filters.inert=game.buildCollapsed;return result;};
    const oldUI=game.updateUI.bind(game);game.updateUI=(...args)=>{const result=oldUI(...args);refresh();return result;};
    const newGame=game.startNew.bind(game);game.startNew=(...args)=>{search.value='';select.value='all';quick.open=false;const result=newGame(...args);filter();return result;};
    game.coordinationUI=Object.freeze({open,openOrders,refresh,filter});filter();filters.inert=game.buildCollapsed;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis !== 'undefined' ? globalThis : this);
