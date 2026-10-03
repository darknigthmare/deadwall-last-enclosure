/* The bastion survives its commander. Selection never advances the campaign clock. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{
  root.DeadwallSuccessionUI133=api;
  const mount=()=>api.install(root.DEADWALL,root.document);
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const GLYPHS=Object.freeze({
  signal:'M4 16h3v5H4Zm6-6h3v11h-3Zm6-6h3v17h-3Z',
  pack:'M8 6V3h8v3M6 6h12l2 4v11H4V10l2-4Zm2 6h8v6H8v-6Z',
  person:'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-4c0-4 16-4 16 0v4',
  route:'M3 19h6L15 5h6M4 4v4m16 9v4M3 6h3m12 13h3',
  tools:'m4 20 7-7M14 10l6-6M15 3l6 6M3 4l3-1 14 14-3 3L3 6V4Z',
  cross:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z'
 });
 function icon(doc,kind){
  const make=tag=>doc.createElementNS?doc.createElementNS('http://www.w3.org/2000/svg',tag):doc.createElement(tag);
  const svg=make('svg'),path=make('path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');path.setAttribute('d',GLYPHS[kind]||GLYPHS.person);svg.appendChild(path);return svg;
 }
 function install(g,doc=root.document){
  if(g?.successionUI133)return g.successionUI133;
  if(!g?.succession133||!g.ui?.hud||!doc?.body||typeof doc.createElement!=='function')return null;
  const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.classList.add(...cls.split(' '));return n;};
  const add=(parent,...nodes)=>{for(const n of nodes)parent.appendChild(n);return parent;};
  const button=(id,text,fn,cls)=>{const n=el('button',text,cls);n.id=id;n.type='button';n.addEventListener('click',()=>{if(!n.disabled&&!n.closest?.('[inert], .hidden'))fn();});return n;};
  const write=(node,text)=>{text=String(text??'');if(node.textContent!==text)node.textContent=text;};
  const overlay=el('section',undefined,'succession133 hidden');overlay.id='succession133';overlay.inert=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','succession133Title');overlay.setAttribute('aria-describedby','succession133Description');overlay.setAttribute('tabindex','-1');
  const scene=el('div',undefined,'succession133-scene');scene.setAttribute('aria-hidden','true');
  const shell=el('div',undefined,'succession133-shell'),header=el('header',undefined,'succession133-header');
  const heading=el('div'),title=el('h1','La garde continue.');title.id='succession133Title';
  add(heading,el('p','D-17 · RELÈVE DU COMMANDEMENT','succession133-eyebrow'),title);
  const clock=add(el('p',undefined,'succession133-clock'),icon(doc,'signal'),el('span','Temps suspendu · choisissez votre survivant'));
  add(header,heading,clock);
  const body=el('div',undefined,'succession133-body'),memory=el('aside',undefined,'succession133-memory');
  const portrait=el('div',undefined,'succession133-portrait'),image=el('img');image.setAttribute('src','assets/loadout-character129.png');image.alt='';image.draggable=false;image.setAttribute('aria-hidden','true');
  add(portrait,image,el('span','DERNIER QUART','succession133-stamp'));
  const deathName=el('h2'),deathPlace=el('p',undefined,'succession133-place');
  const memoryText=el('p','Le corps et le sac restent sur place. Le prochain survivant devra rejoindre le lieu pour récupérer ce qui peut l’être.','succession133-memory-text');
  const infection=el('p','Un corps peut se relever. Ne présumez pas que le lieu est sûr.','succession133-risk');
  add(memory,portrait,deathName,deathPlace,memoryText,infection);
  const roster=el('section',undefined,'succession133-roster'),description=el('p','D-17 tient encore. Choisissez qui reprendra votre place au dépôt. Les constructions, les réserves et la campagne continuent.','succession133-description');description.id='succession133Description';
  const choices=el('div',undefined,'succession133-choices');choices.setAttribute('role','radiogroup');choices.setAttribute('aria-label','Archétype du prochain survivant');
  const departure=add(el('div',undefined,'succession133-departure'),icon(doc,'pack'),el('p','Vous repartez avec un sac vide, sans armes ni munitions offertes. Récupérez votre matériel sur place ou équipez-vous auprès du dépôt.'));
  add(roster,description,choices,departure);add(body,memory,roster);
  const footer=el('footer',undefined,'succession133-footer'),status=el('p',undefined,'succession133-status');status.id='succession133Status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  const controls=el('div',undefined,'succession133-controls'),quit=button('succession133Menu','SAUVEGARDER ET QUITTER',()=>leave(),'succession133-quit'),confirm=button('succession133Confirm','PRENDRE LA RELÈVE',()=>confirmSelection(),'succession133-confirm');confirm.setAttribute('aria-describedby','succession133Status');
  add(controls,quit,confirm);add(footer,status,controls);add(shell,header,body,footer);add(overlay,scene,shell);doc.body.appendChild(overlay);
  const armory=el('details',undefined,'succession133-armory hidden');armory.id='succession133Armory';const armorySummary=add(el('summary'),icon(doc,'tools'),el('span','ARMURERIE')),armoryBody=el('div',undefined,'succession133-armory-body'),armoryRows=el('div',undefined,'succession133-armory-rows'),armoryStatus=el('p',undefined,'succession133-armory-status');armoryStatus.setAttribute('role','status');armoryStatus.setAttribute('aria-live','polite');add(armoryBody,el('h2','Réserve d’armes de D-17'),el('p','Prenez une arme déjà au râtelier ou assemblez-en une avec les stocks du dépôt. Les armes neuves sont vides.'),armoryRows,armoryStatus);add(armory,armorySummary,armoryBody);const tray=doc.getElementById('fieldUtilityTray');(tray?.parentNode?tray:g.ui.hud).appendChild(armory);
  armory.addEventListener('keydown',event=>{event.stopPropagation();if(event.code==='Escape'){event.preventDefault();armory.open=false;armorySummary.focus({preventScroll:true});}});armory.addEventListener('toggle',()=>{if(armory.open)g.releaseInputs();});
  let armorySignature='';const armoryButtons=new Map();
  const inertBefore=new Map();let opened=false,chosen=null,cards=[],signature='',keepPaused=false,transitioning=false,committing=false;
  const pending=()=>Boolean(g.succession133.pending());
  const wrap=(name,fn)=>{if(typeof g[name]!=='function')return;const old=g[name].bind(g);g[name]=(...args)=>fn(old,...args);};
  function sync(){
   for(const node of [...Array.from(doc.body.children),g.ui.hud,g.ui.mainMenu,g.ui.pauseMenu,g.ui.commandModal,g.ui.settingsModal,g.ui.helpModal])if(node&&node!==overlay){if(!inertBefore.has(node))inertBefore.set(node,node.inert);node.inert=true;}
   overlay.inert=false;g.activeOverlay=overlay;g.paused=true;g.releaseInputs();
   if(!overlay.contains(doc.activeElement))(cards.find(c=>c.id===chosen)?.button||confirm).focus({preventScroll:true});
  }
  function close(){
   if(!opened)return false;opened=false;overlay.classList.add('hidden');overlay.inert=true;doc.body.classList.remove('succession133-active');
   for(const[node,inert]of inertBefore)node.inert=inert;inertBefore.clear();g.releaseInputs();g.syncOverlayFocus();return true;
  }
  function choose(id,focus=false){
   if(!opened||!cards.some(c=>c.id===id))return false;chosen=id;
   for(const card of cards){const selected=card.id===id;card.button.classList.toggle('is-selected',selected);card.button.setAttribute('aria-checked',String(selected));card.button.setAttribute('tabindex',selected?'0':'-1');}
   const card=cards.find(c=>c.id===id);write(status,card.name+' · '+(g.succession133.view().message||'Confirmez pour reprendre au dépôt.'));confirm.disabled=false;
   if(focus)card.button.focus({preventScroll:true});return true;
  }
  function renderChoices(list){
   const key=JSON.stringify(list);if(key===signature)return;signature=key;const focused=doc.activeElement?.dataset?.archetype;
   choices.replaceChildren();cards=[];
   for(let i=0;i<list.length;i++){
    const profile=list[i],b=button('succession133Choice-'+profile.id,undefined,()=>choose(profile.id),'succession133-choice');b.dataset.archetype=profile.id;b.setAttribute('role','radio');b.setAttribute('aria-checked','false');b.setAttribute('tabindex','-1');
    const name=el('h3',profile.name),copy=el('p',profile.description||'','succession133-profile-copy');name.id='succession133Name-'+profile.id;copy.id='succession133Profile-'+profile.id;b.setAttribute('aria-labelledby',name.id);
    const glyph=profile.icon||({scout:'route',porter:'pack',carrier:'pack',builder:'tools',medic:'cross'}[profile.id]||'person');const top=add(el('div',undefined,'succession133-choice-heading'),icon(doc,glyph),el('span',String(i+1).padStart(2,'0'),'succession133-number'));
    const strengths=el('ul',undefined,'succession133-strengths'),tradeoffs=el('ul',undefined,'succession133-tradeoffs');strengths.id='succession133Advantages-'+profile.id;tradeoffs.id='succession133Tradeoffs-'+profile.id;strengths.setAttribute('aria-label','Avantages');tradeoffs.setAttribute('aria-label','Contreparties');b.setAttribute('aria-describedby',[copy.id,strengths.id,tradeoffs.id].join(' '));
    for(const text of profile.advantages||[])strengths.appendChild(el('li',text));for(const text of profile.tradeoffs||[])tradeoffs.appendChild(el('li',text));
    add(b,top,name,copy,strengths,tradeoffs);choices.appendChild(b);cards.push({id:profile.id,name:profile.name,button:b});
   }
   if(!cards.some(c=>c.id===chosen))chosen=cards[0]?.id||null;
   if(chosen)choose(chosen);else{confirm.disabled=true;write(status,'Aucun profil disponible. Votre campagne reste suspendue.');}
   if(focused)cards.find(c=>c.id===focused)?.button.focus({preventScroll:true});
  }
  function refreshArmory(){
   const visible=g.state==='playing'&&!g.gameOver&&!g.player.dead&&!pending()&&!g.activeOverlay;
   const v=visible?g.succession133.view():null,rows=(v?.requisitions||[]).filter(r=>!r.owned);
   const show=visible&&(v.atDepot===true||v.canRequisition===true)&&rows.length>0;armory.classList.toggle('hidden',!show);armory.inert=!show;if(!show){armory.open=false;return;}
   const key=JSON.stringify(rows);if(key===armorySignature)return;armorySignature=key;const focused=doc.activeElement?.dataset?.requisition;armoryRows.replaceChildren();armoryButtons.clear();
   for(const row of rows){
    const cost=typeof row.cost==='number'?row.cost:row.cost?.scrap||0,action=row.action==='take'?'PRENDRE · ':row.action==='craft'?'ASSEMBLER · ':'';
    const detail=row.action==='take'?'Au râtelier · '+row.rounds+' cartouches':cost+' ferrailles'+(row.seconds?' · '+row.seconds+' s':'')+' · arme vide';
    const b=button('succession133Requisition-'+row.id,undefined,()=>{const result=g.succession133.requisition(row.id);write(armoryStatus,result?.reason||g.succession133.view().message||(result===true||result?.ok?'Arme vide retirée. Prévoyez ses munitions.':'Réquisition indisponible.'));armorySignature='';refreshArmory();},'succession133-requisition');
    b.dataset.requisition=row.id;b.disabled=!row.allowed;add(b,el('strong',action+row.name),el('span',detail));const line=add(el('div'),b,el('p',row.reason||'Disponible au dépôt.'));armoryRows.appendChild(line);armoryButtons.set(row.id,b);
   }
   if(focused)(armoryButtons.get(focused)||armorySummary).focus({preventScroll:true});
  }
  function refresh(){
   if(transitioning||committing)return false;
   if(!pending()||g.state!=='playing'||g.gameOver){close();refreshArmory();return false;}
   armory.classList.add('hidden');armory.inert=true;armory.open=false;
   const v=g.succession133.view();
   if(!opened){
    keepPaused=Boolean(doc.hidden||!g.ui.pauseMenu.classList.contains('hidden'));
    // A restored death can replace an inventory or a briefing that was open.
    // Close each controller through its API, so its own pause/focus memory is cleared.
    transitioning=true;try{
     if(g.loadoutUI?.isOpen())g.loadoutUI.dismiss();
     if(g.exploration125?.overlayOpen())g.exploration125.closeOverlay();
     if(g.campaignIntro132?.isOpen())g.campaignIntro132.skip();
     g.showHelp?.(false);g.showSettings?.(false);g.showCommand?.(false);g.ui.pauseMenu.classList.add('hidden');
    }finally{transitioning=false;}
    opened=true;chosen=null;signature='';overlay.scrollTop=0;overlay.classList.remove('hidden');doc.body.classList.add('succession133-active');g.releaseInputs();g.cancelPlacement?.();
   }
   overlay.classList.toggle('succession133-static',!!g.settings?.reducedMotion);
   write(deathName,v.lastDeath?.name||'Un survivant est tombé.');write(deathPlace,v.lastDeath?.locationLabel||'Dernière position conservée sur le terrain.');
   renderChoices(v.choices||g.succession133.choices());sync();return true;
  }
  function confirmSelection(){
   if(!opened||!pending()||committing||!chosen)return false;
   const pauseAfter=keepPaused||Boolean(doc.hidden);committing=true;let ok;
   try{ok=g.succession133.select(chosen);}finally{committing=false;}
   if(!ok){write(status,g.succession133.view().message||'Relève indisponible. Choisissez à nouveau un profil.');refresh();return false;}
   close();
   if(g.state==='playing'&&!g.gameOver){g.paused=pauseAfter;g.ui.pauseMenu.classList.toggle('hidden',!pauseAfter);g.syncOverlayFocus();g.updateUI();if(!g.activeOverlay)g.canvas.focus({preventScroll:true});}
   return true;
  }
  function leave(){
   if(!opened)return false;const result=g.returnToMenu();
   if(g.state!=='menu'){write(status,'Sauvegarde impossible. La campagne reste ici ; choisissez un survivant pour accéder aux paramètres et exporter votre partie.');sync();return false;}return result!==false;
  }
  wrap('syncOverlayFocus',(old,...args)=>{if(opened&&!transitioning&&!committing&&pending()&&g.state==='playing'&&!g.gameOver)return sync();return old(...args);});
  wrap('canIssueCommand',(old,...args)=>!opened&&!pending()&&old(...args));
  wrap('update',(old,...args)=>{if(opened&&pending()){g.releaseInputs();return;}return old(...args);});
  wrap('togglePause',(old,...args)=>{if(opened){if(args[0]===true)keepPaused=true;sync();return false;}return old(...args);});
  wrap('onEscape',(old,...args)=>{if(!opened)return old(...args);write(status,'Choisissez un survivant pour continuer, ou sauvegardez et quittez.');quit.focus({preventScroll:true});return false;});
  for(const name of ['showHelp','showSettings','showCommand'])wrap(name,(old,show,...args)=>opened&&show?false:old(show,...args));
  wrap('suspendForFocusLoss',(old,...args)=>{if(opened)keepPaused=true;const result=old(...args);if(opened)sync();return result;});
  wrap('updateUI',(old,...args)=>{const result=old(...args);refresh();return result;});
  wrap('restoreSave',(old,...args)=>{const result=old(...args);if(result!==false)refresh();return result;});
  wrap('returnToMenu',(old,...args)=>{const result=old(...args);if(g.state==='menu')close();else if(opened)sync();return result;});
  wrap('startNew',(old,...args)=>{
   if(!opened)return old(...args);
   try{root.DeadwallProfile?.normalizeSeed(args[1]??'');root.DeadwallScenarios?.initialState(args[2]??'classic',typeof args[0]==='string'&&Object.hasOwn(root.DeadwallCore.DIFFICULTIES,args[0])?args[0]:'standard');}catch{return old(...args);}
   transitioning=true;close();let result;try{result=old(...args);}finally{transitioning=false;refresh();}return result;
  });
  overlay.addEventListener('keydown',event=>{
   if(!opened)return;
   if(event.code==='Escape'){event.preventDefault();event.stopPropagation();g.onEscape();}
   else if(event.code==='Tab'){event.stopPropagation();g.trapOverlayFocus(event);}
   else if(event.target?.dataset?.archetype&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.code)){
    event.preventDefault();event.stopPropagation();const current=cards.findIndex(c=>c.id===event.target.dataset.archetype),delta=['ArrowLeft','ArrowUp'].includes(event.code)?-1:1;
    const next=event.code==='Home'?0:event.code==='End'?cards.length-1:(current+delta+cards.length)%cards.length;if(cards[next])choose(cards[next].id,true);
   }
  });
  const api=Object.freeze({refresh,choose,confirm:confirmSelection,isOpen:()=>opened,view:()=>({open:opened,chosen,keepPaused}),element:overlay});g.successionUI133=api;refresh();return api;
 }
 return Object.freeze({install,icon});
});
