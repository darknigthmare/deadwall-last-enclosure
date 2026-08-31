(function initCommandPost() {
  'use strict';
  const game=globalThis.DEADWALL,C=globalThis.DeadwallCore,get=id=>document.getElementById(id);
  const modal=get('commandModal');if(!game||!modal)return;
  const tabs=['enclosure','workers','research','records'];
  const orders=[
    ['auto','AUTONOMIE','Chantiers puis collecte selon les besoins de la cité.'],
    ['harvest','RÉCOLTER','Collecte prioritaire ; chantiers si aucune ressource accessible.'],
    ['build','CONSTRUIRE','Chantiers prioritaires ; collecte en attendant une affectation.'],
    ['clear','DÉBLAYER','Rejoindre le pied extérieur des remparts et retirer les corps. Pas de collecte.'],
    ['retreat','REPLI','Rejoindre le centre ; conserver ou déposer les sacs. Aucun nouveau travail extérieur.']
  ];
  const modes=[['auto','AUTO'],['open','OUVERTE'],['closed','VERROUILLÉE']];
  let previousPause=null,tab='enclosure',gateListKey='',recordsKey='';
  const message=text=>{get('commandStatus').textContent=text;};
  const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
  const bind=(id,fn)=>get(id)?.addEventListener('click',event=>{if(!event.currentTarget.disabled&&!event.currentTarget.closest('[inert]'))fn();});
  const workerCards=new Map(),researchCards=new Map();
  for(const [id,title,description] of orders){
    const button=element('button',undefined,'order-card');button.type='button';button.dataset.workerOrder=id;
    button.appendChild(element('strong',title));button.appendChild(element('span',description));
    button.addEventListener('click',()=>{if(game.setWorkerOrder(id)){message('Ordre transmis : '+title.toLowerCase()+'. La simulation reprend à la fermeture du poste.');refresh();}});
    get('workerOrders').appendChild(button);workerCards.set(id,button);
  }
  for(const item of C.RESEARCH){
    const card=element('article',undefined,'doctrine-card');card.dataset.researchId=item.id;
    const tier=element('small',C.CITY_TIERS[item.tier].name),title=element('h3',item.name);
    const description=element('p',item.description),cost=element('p',item.insight+' insight · '+Object.entries(item.cost).map(([key,value])=>C.formatNumber(value)+' '+C.RESOURCE_META[key].label.toLowerCase()).join(' · '),'doctrine-cost');
    const button=element('button','VALIDER');button.type='button';button.dataset.researchBuy=item.id;
    button.addEventListener('click',()=>{if(game.launchResearch(item.id)){message(item.name+' activée pour cette campagne.');refresh();}else message('Doctrine indisponible : vérifiez le palier, les réserves et l’insight.');});
    for(const node of [tier,title,description,cost,button])card.appendChild(node);
    get('researchLibrary').appendChild(card);researchCards.set(item.id,{card,button});
  }
  for(const [mode]of modes)bind('gateMode-'+mode,()=>{
    const gate=game.world.buildings.get(Number(get('commandGate').value));
    if(game.setGateMode(mode,gate)){message('Porte '+gate.id+' : '+modes.find(item=>item[0]===mode)[1].toLowerCase()+'.');refresh();}
    else message('Ordre refusé. Le passage doit être libre et la porte terminée pour verrouiller.');
  });
  function chooseTab(id,focus=false){
    if(!tabs.includes(id))return;
    if(game.state!=='playing'||game.gameOver)id='records';
    tab=id;
    for(const name of tabs){
      const button=get('commandTab-'+name),selected=name===id;
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
      button.disabled=name!=='records'&&(game.state!=='playing'||game.gameOver);
      get('commandPanel-'+name).classList.toggle('hidden',!selected);
    }
    refresh();if(focus)get('commandTab-'+tab).focus();
  }
  for(const id of tabs){
    bind('commandTab-'+id,()=>chooseTab(id));
    get('commandTab-'+id).addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.code))return;
      event.preventDefault();
      const enabled=tabs.filter(name=>!get('commandTab-'+name).disabled),index=enabled.indexOf(tab);
      chooseTab(event.code==='Home'?enabled[0]:event.code==='End'?enabled.at(-1):enabled[(index+(event.code==='ArrowRight'?1:-1)+enabled.length)%enabled.length],true);
    });
  }
  function refreshRecords(){
    const profile=game.profile?.get();if(!profile)return;
    const key=JSON.stringify(profile);if(key===recordsKey)return;recordsKey=key;
    get('recordBoard').replaceChildren();get('recentCampaigns').replaceChildren();
    for(const id of ['story','standard','brutal']){
      const best=profile.byDifficulty[id],card=element('article',undefined,'record-card');
      card.appendChild(element('small',C.DIFFICULTIES[id].label));
      card.appendChild(element('strong',C.formatNumber(best.wavesSurvived)));
      card.appendChild(element('span','VAGUES SURVÉCUES'));
      card.appendChild(element('p',C.formatNumber(best.kills)+' éliminations · '+C.formatTime(best.playSeconds)+' de résistance'));
      card.appendChild(element('p',best.peakPopulation+' survivants · '+best.peakBuildings+' structures achevées au pic'));
      get('recordBoard').appendChild(card);
    }
    if(!profile.recentRuns.length)get('recentCampaigns').appendChild(element('p','Vos campagnes apparaîtront ici après une sauvegarde.','command-note'));
    for(const run of profile.recentRuns){
      const row=element('li',undefined,'campaign-row'),copy=element('div');
      copy.appendChild(element('strong','CARTE '+run.seed+' · '+C.DIFFICULTIES[run.difficulty].label));
      copy.appendChild(element('span',run.wavesSurvived+' vagues · '+C.formatNumber(run.kills)+' éliminations · '+(run.ended?'cité tombée':'archive de campagne')));
      const button=element('button','RÉUTILISER LA CARTE');button.type='button';
      button.setAttribute('aria-label','Réutiliser la carte '+run.seed);
      button.addEventListener('click',()=>{
        get('mapSeed').value=String(run.seed);get('mapSeed').setCustomValidity('');
        message('Carte '+run.seed+' préparée dans le menu. Aucun changement de la campagne actuelle.');
        if(game.state==='menu'){game.showCommand(false);get('mapSeed').focus();}
      });
      row.appendChild(copy);row.appendChild(button);get('recentCampaigns').appendChild(row);
    }
  }
  function refresh(){
    if(modal.classList.contains('hidden'))return;
    const playing=game.state==='playing'&&!game.gameOver;
    get('commandContext').textContent=playing?'ACTION SUSPENDUE · VAGUE '+game.wave+' · CARTE '+game.world.seed:'ARCHIVES LOCALES · SANS BONUS PERMANENT';
    if(playing){
      const enclosure=game.getEnclosureStatus(),workers=game.getWorkerSummary();
      get('perimeterResult').textContent=enclosure.enclosed?'CENTRE CEINTURÉ':'CENTRE EXPOSÉ';
      get('perimeterResult').dataset.closed=String(enclosure.enclosed);
      get('perimeterDetails').textContent=enclosure.wallCount+' éléments de rempart · '+enclosure.gates+' portes · '+enclosure.openGates+' ouvertes';
      get('perimeterAdvice').textContent=enclosure.enclosed?'La ligne structurelle est fermée. Surveillez l’intégrité et les amas : certains infectés peuvent franchir les corps.':'Un passage relie encore le bord de la carte au centre. Reliez les segments et vérifiez les portes ouvertes.';
      const gates=[...game.world.buildings.values()].filter(b=>!b.dead&&b.def.gate);
      const key=gates.map(b=>b.id+':'+b.completed).join(',');
      if(key!==gateListKey){
        const previous=get('commandGate').value;get('commandGate').replaceChildren();
        for(const gate of gates){const option=element('option',gate.def.name+' #'+gate.id+' · '+gate.gx+','+gate.gy+(gate.completed?'':' · chantier'));option.value=String(gate.id);get('commandGate').appendChild(option);}
        if(gates.some(gate=>String(gate.id)===previous))get('commandGate').value=previous;
        else if(gates.length)get('commandGate').value=String(gates[0].id);
        gateListKey=key;
      }
      const gate=game.world.buildings.get(Number(get('commandGate').value));
      get('commandGate').disabled=!gates.length;
      get('gateEmpty').classList.toggle('hidden',Boolean(gates.length));
      for(const [mode]of modes){const button=get('gateMode-'+mode);button.disabled=!gate?.completed;button.setAttribute('aria-pressed',String(Boolean(gate)&&gate.gateMode===mode));}
      get('workerSummary').textContent=workers.total+' ouvriers · '+workers.busy+' occupés · '+workers.carrying+' avec un sac · '+workers.clearing+' au déblaiement';
      get('workerAccess').textContent=workers.blocked?'Des trajets sont bloqués : vérifiez les portes et les accès aux chantiers.':'Le déblaiement exige un trajet vers la face extérieure des remparts. Les ouvriers fuient les infectés proches.';
      for(const [id,button]of workerCards){button.setAttribute('aria-pressed',String((game.workerOrder||'auto')===id));button.disabled=!workers.total;}
      get('researchBudget').textContent=game.research.insight+' INSIGHT · '+game.research.completed.length+'/'+C.RESEARCH.length+' DOCTRINES';
      for(const item of C.RESEARCH){
        const {card,button}=researchCards.get(item.id),done=game.hasResearch(item.id),locked=item.tier>game.tier.id;
        const affordable=game.research.insight>=item.insight&&C.canAfford(game.resources,item.cost);
        card.dataset.state=done?'complete':locked?'locked':affordable?'available':'unfunded';
        button.disabled=done||locked||!affordable;
        button.textContent=done?'ACTIVE':locked?'PALIER '+C.CITY_TIERS[item.tier].name:!affordable?'RÉSERVES / INSIGHT INSUFFISANTS':'VALIDER LA DOCTRINE';
      }
    }
    refreshRecords();
    get('profileStatus').textContent=game.profileStatus?.error?.message||'Records conservés sur cet appareil. Les maxima de chaque catégorie peuvent provenir de campagnes différentes.';
  }
  game.showCommand=(show,requestedTab='enclosure')=>{
    const visible=!modal.classList.contains('hidden');
    if(show){
      if(game.activeOverlay&&![game.ui.pauseMenu,game.ui.mainMenu,modal].includes(game.activeOverlay))return;
      if(!visible){previousPause=game.state==='playing'&&!game.gameOver?game.paused:null;if(previousPause!==null){game.paused=true;game.save(false);}game.releaseInputs();gateListKey='';recordsKey='';message('');}
      modal.classList.remove('hidden');chooseTab(requestedTab);
    }else{
      if(!visible)return;
      modal.classList.add('hidden');
      if(previousPause!==null&&game.state==='playing'&&!game.gameOver){game.paused=previousPause;game.ui.pauseMenu.classList.toggle('hidden',!game.paused);}
      previousPause=null;
    }
    game.syncOverlayFocus();
  };
  game.commandUI={refresh};
  bind('cityCommandButton',()=>game.showCommand(true));
  bind('pauseCommandButton',()=>game.showCommand(true));
  bind('menuRecordsButton',()=>game.showCommand(true,'records'));
  bind('commandClose',()=>game.showCommand(false));
  get('commandGate').addEventListener('change',refresh);
  get('mapSeed').addEventListener('input',()=>get('mapSeed').setCustomValidity(''));
})();
