(function initNarrativeJournal(){
  'use strict';
  const game=globalThis.DEADWALL,N=globalThis.DeadwallNarrative,C=globalThis.DeadwallCore,get=id=>document.getElementById(id);
  const panel=get('commandPanel-journal'),modal=get('commandModal');if(!game||!N||!panel||!modal)return;
  const append=(parent,...children)=>{for(const child of children)parent.appendChild(child);};
  const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
  const write=text=>{get('commandStatus').textContent=text;},cards=new Map(),chapters=new Map();
  const rule=C.NARRATIVE_RULES||{surveySeconds:8,surveyRadius:90,debriefRadius:180};
  get('narrativeBrief').textContent='Les fragments viennent de lieux abandonnés. Ils ne sont ni des appels radio ni la preuve que leurs auteurs sont encore vivants. Lire et marquer un lieu ne donne aucune ressource ; seuls les choix explicitement engagés au dépôt produisent leur effet.';
  for(const chapter of N.CHAPTERS){
    const card=el('article',undefined,'narrative-chapter');card.dataset.narrativeChapter=chapter.id;
    append(card,el('h4',chapter.title),el('p',chapter.text));get('narrativeChapters').appendChild(card);chapters.set(chapter.id,card);
  }
  for(const sector of N.SECTORS){
    const card=el('details',undefined,'narrative-operation');card.dataset.narrativeSector=sector.id;
    const summary=el('summary'),title=el('span',sector.title),state=el('small'),body=el('div',undefined,'narrative-operation-body');
    summary.setAttribute('tabindex','0');
    append(summary,title,state);card.appendChild(summary);card.appendChild(body);
    const location=el('p'),mark=el('button','MARQUER LE SECTEUR','narrative-mark'),progress=el('progress');
    mark.type='button';mark.dataset.narrativeMark=sector.id;progress.max=rule.surveySeconds;progress.value=0;progress.setAttribute('aria-label','Relevé : '+sector.title);
    const prompt=el('p'),trace=el('blockquote',undefined,'narrative-trace'),source=el('p',sector.source,'narrative-source'),excerpt=el('p',sector.excerpt),discovery=el('p',sector.discovery);
    append(trace,source,excerpt,discovery);append(body,location,mark,prompt,progress,trace);
    const reason=el('p','','narrative-reason');reason.id='narrativeReason-'+sector.id;body.appendChild(reason);
    const choices=el('div',undefined,'narrative-choices'),choiceNodes={};
    for(const choice of ['A','B']){
      const def=sector.choices[choice],choiceCard=el('article',undefined,'narrative-choice'),cost=el('p','COÛT · '+(C.resourceText(def.cost)||'Aucun coût matériel'),'narrative-cost'),reward=el('p'),button=el('button','ENGAGER · '+def.label),availability=el('p','','narrative-choice-reason');
      availability.id='narrativeChoiceReason-'+sector.id+'-'+choice;
      button.type='button';button.dataset.narrativeChoice=choice;button.dataset.narrativeTheme=sector.id;button.setAttribute('aria-describedby',availability.id);
      append(choiceCard,el('h4',def.label),cost,reward,availability,button);choices.appendChild(choiceCard);choiceNodes[choice]={button,reward,availability};
      button.addEventListener('click',()=>{
        if(button.disabled||button.closest('[inert]'))return;
        if(game.resolveNarrative(sector.id,choice)){write('Décision consignée : '+def.label+'. '+def.outcome);refresh();summary.focus();}
        else{write(game.narrativeStatus(sector.id,choice).reason||'Décision indisponible.');refresh();}
      });
    }
    const outcome=el('p','','narrative-outcome');append(body,choices,outcome);get('narrativeOperations').appendChild(card);
    mark.addEventListener('click',()=>{
      if(mark.disabled||mark.closest('[inert]'))return;
      const site=(game.world.sites||[]).find(item=>item.theme===sector.id);if(!site)return;
      game.fieldMarker=game.fieldMarker===site.id?null:site.id;
      write(game.fieldMarker?'Repère posé : '+site.name+'. Aucun ordre de déplacement.':'Repère retiré.');game.contentUI?.refresh();refresh();
    });
    cards.set(sector.id,{card,summary,state,location,mark,progress,prompt,trace,reason,choices,choiceNodes,outcome});
  }
  function rewardText(reward,playing){
    const result=[];if(reward.insight)result.push('Insight +'+reward.insight);
    if(reward.morale){const actual=playing?Math.min(reward.morale,Math.max(0,100-game.morale)):reward.morale;result.push('Moral +'+C.formatNumber(actual)+(actual<reward.morale?' (plafond 100 ; maximum +'+reward.morale+')':''));}
    for(const [key,value]of Object.entries(reward.resources||{}))if(value>0){const actual=playing?Math.min(value,Math.max(0,game.storage-(game.resources[key]||0))):value;result.push(C.RESOURCE_META[key].label+' +'+C.formatNumber(actual)+(actual<value?' (stock limité)':''));}
    return 'EFFET · '+(result.join(' · ')||'Trace conservée, sans bonus matériel');
  }
  function refresh(){
    const state=game.narrative;if(!state)return;
    const counts=N.status(state),unread=Array.isArray(state.unread)?state.unread.length:counts.unread||0,playing=game.state==='playing'&&!game.gameOver;
    get('journalUnread').textContent=unread?unread+' NOUVELLE'+(unread>1?'S':''):'TRACES DE TERRAIN';get('journalCommandButton').dataset.unread=String(unread>0);
    if(modal.classList.contains('hidden'))return;
    get('narrativeSummary').textContent=counts.observed+'/6 relevés · '+counts.resolved+'/6 décisions · '+unread+' entrée'+(unread>1?'s':'')+' non lue'+(unread>1?'s':'');
    get('narrativeReadAll').disabled=!playing||!unread;
    get('narrativeContext').textContent=!playing?'Consultation du journal. Lancez ou reprenez une campagne pour intervenir.':'Relevé : maintenir E ou ACTION pendant '+rule.surveySeconds+' secondes à moins de '+rule.surveyRadius+' unités du centre du secteur. Débriefing : commandant vivant, accès libre au dépôt et distance maximale '+rule.debriefRadius+' unités.';
    for(const [id,card]of chapters)card.classList.toggle('hidden',!state.chapters.includes(id));
    for(const sector of N.SECTORS){
      const entry=state.sectors[sector.id]||{survey:0,choice:null},nodes=cards.get(sector.id),site=(game.world.sites||[]).find(item=>item.theme===sector.id),observed=entry.survey>=rule.surveySeconds,resolved=Boolean(entry.choice);
      nodes.card.dataset.state=resolved?'resolved':observed?'ready':'survey';nodes.state.textContent=resolved?'Décision consignée':observed?'Trace relevée · retour au dépôt':C.formatNumber(entry.survey)+' / '+rule.surveySeconds+' s de relevé';
      nodes.location.textContent=site?site.name+' · cellule '+Math.floor(site.x/C.TILE)+','+Math.floor(site.y/C.TILE):'Secteur indisponible sur cette carte.';
      nodes.mark.disabled=!playing||!site;nodes.mark.textContent=site&&game.fieldMarker===site.id?'EFFACER LE REPÈRE':'MARQUER LE SECTEUR';
      nodes.progress.value=Math.min(rule.surveySeconds,entry.survey);nodes.progress.classList.toggle('hidden',observed);
      nodes.prompt.textContent=observed?'Le relevé reste conservé si vous repartez ou sauvegardez.':'Rejoignez le centre indiqué puis maintenez E ou ACTION. Relâcher ou quitter le lieu conserve le relevé partiel. Aucun progrès dans les menus, pendant la pause ou à terre.';
      nodes.trace.classList.toggle('hidden',!observed);nodes.choices.classList.toggle('hidden',!observed||resolved);nodes.outcome.classList.toggle('hidden',!resolved);
      nodes.outcome.textContent=resolved?sector.choices[entry.choice].label+' — '+sector.choices[entry.choice].outcome:'';
      const availability=playing?game.narrativeStatus(sector.id):{ok:false,reason:'Disponible pendant une campagne.'};nodes.reason.textContent=resolved?'Décision définitive pour cette campagne. Les hordes continuent.':availability.ok?'Au dépôt : choisissez une orientation ci-dessous. Le coût est prélevé immédiatement.':availability.reason;
      for(const choice of ['A','B']){const status=playing?game.narrativeStatus(sector.id,choice):{ok:false,reason:'Disponible pendant une campagne.'},choiceNode=nodes.choiceNodes[choice];choiceNode.button.disabled=!observed||resolved||!status.ok;choiceNode.reward.textContent=rewardText(sector.choices[choice].reward,playing);choiceNode.availability.textContent=status.ok?'Disponible : ce choix est définitif.':status.reason;}
    }
  }
  function open(){game.showCommand(true,'journal');refresh();}
  get('journalCommandButton').addEventListener('click',event=>{if(!event.currentTarget?.closest('[inert]'))open();});
  get('narrativeReadAll').addEventListener('click',event=>{if(event.currentTarget?.disabled||event.currentTarget?.closest('[inert]'))return;if(game.markNarrativeRead()){write('Journal marqué comme lu. Aucun coût ni récompense.');refresh();get('commandTab-journal').focus();}});
  game.narrativeUI={refresh,open};refresh();
})();
