/* One layout owner for the field HUD. Existing controls and model owners are preserved. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.DeadwallHud135=api;const mount=()=>api.install(root.DEADWALL,root.document);if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}})(globalThis,function(){
'use strict';
function install(g,doc=globalThis.document){
 if(g?.hud135)return g.hud135;if(!g?.ui?.hud||!doc?.body)return null;
 const hud=g.ui.hud,get=id=>{const n=doc.getElementById(id);return n&&doc.body.contains(n)?n:null;},el=(tag,id,cls,text)=>{const n=doc.createElement(tag);if(id)n.id=id;if(cls)n.classList.add(cls);if(text)n.textContent=text;return n;},move=(parent,node)=>{if(node&&node.parentNode!==parent)parent.appendChild(node);return node;};
 const main=el('div','hud135Main','hud135-main'),left=el('div','hud135Left','hud135-left'),center=el('div','hud135Center','hud135-center'),right=el('div','hud135Right','hud135-right'),context=el('div','hud135Context','hud135-context'),alerts=el('div','hud135Alerts','hud135-alerts'),footer=el('div','hud135Footer','hud135-footer'),combat=el('div','hud135Combat','hud135-combat'),utilityHost=el('div','hud135UtilityHost','hud135-utility-host');
 const drawer=(id,label,cls)=>{const n=el('details',id,cls),s=el('summary',id+'Toggle',null,label);n.appendChild(s);return n;};
 const intel=drawer('hud135Intel','SITUATION','hud135-drawer'),map=drawer('hud135Map','CARTE','hud135-drawer'),tools=drawer('hud135Tools','MATÉRIEL & ACTIONS','hud135-tools');
 const touchCommands=get('touchCommandDrawer'),auxiliary=el('div','hud135Auxiliary','hud135-auxiliary');
 const drawers=[intel,map,tools,touchCommands].filter(Boolean),leftPanel=get('leftPanel'),rightPanel=get('rightPanel');
 hud.classList.add('hud135');doc.body.classList.add('hud135-ready');context.setAttribute('role','region');context.setAttribute('aria-label','Actions de terrain et interventions');
 for(const n of [left,center,right])main.appendChild(n);for(const n of [alerts,context])center.appendChild(n);for(const n of [intel,map])right.appendChild(n);for(const n of [combat,auxiliary])footer.appendChild(n);auxiliary.appendChild(tools);tools.appendChild(utilityHost);hud.appendChild(main);hud.appendChild(footer);
 move(left,leftPanel);move(intel,rightPanel);
 const wave=el('section','hud135Wave','wave-card');
 const originalWave=rightPanel?.querySelector('.wave-card');
 if(originalWave){for(const node of [...originalWave.children])if(node.classList.contains('wave-heading')||node.classList.contains('threat-meter'))move(wave,node);right.insertBefore(wave,intel);}
 // Keep the actual forecast and sampled centre alert with the live wave clock.
 // An unopened situation dossier must not hide announced fronts or a breach.
 const waveIntel=get('waveIntel'),innerAlert=get('innerRingAlert');move(wave,waveIntel);move(wave,innerAlert);
 const battleActions=el('nav','hud143BattleActions','hud143-battle-actions');battleActions.setAttribute('aria-label','Préparatifs et ordres tactiques');
 const quickButtons=[];
 for(const[id,label,description,action]of [
  ['hud143Prepare','PRÉPARATIFS','Consulter les préparatifs en pause',()=>g.coordinationUI?.open()],
  ['hud143Enclosure','PORTES','Inspecter les portes et les enceintes en pause',()=>g.coordinationUI?.openOrders('enclosure')],
  ['hud143Squads','SECTIONS','Donner les ordres aux sections en pause',()=>g.coordinationUI?.openOrders('workers')]
 ]){const button=el('button',id,null,label);button.type='button';button.setAttribute('aria-label',description);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','commandModal');button.title=description;
  button.addEventListener('click',()=>{if(!button.disabled&&!hud.inert&&!button.closest('[inert]')&&g.state==='playing'&&!g.paused&&!g.activeOverlay)action();});battleActions.appendChild(button);quickButtons.push(button);}
 wave.appendChild(battleActions);move(map,get('minimapWrap'));move(combat,get('bottomHud'));move(combat,get('carryIndicator'));move(utilityHost,get('fieldUtilityTray'));
 const objective=rightPanel?.querySelector('.objective-card');
 // The current task must be visible when the optional situation dossier is shut.
 // Move its live nodes so the saved tutorial and ordinary objectives keep one owner.
 if(objective){objective.id='hud135Objective';right.insertBefore(objective,intel);}
 const objectiveInstructions=drawer('hud135ObjectiveInstructions','INSTRUCTIONS','hud135-objective-instructions');
 if(objective&&g.ui.objectiveText){objectiveInstructions.open=true;move(objectiveInstructions,g.ui.objectiveText);objective.insertBefore(objectiveInstructions,g.ui.objectiveFill?.parentNode||null);}
 // All fixed notices now take part in the same flow and obey the HUD's modal inertness.
 for(const n of [get('notifications'),get('departureWarning130'),g.chronicles131UI?.element])move(alerts,n);
 for(const n of [get('interventions134Dock'),get('activeReload14'),get('interactionHint'),get('expansionWork'),get('localActions14'),get('expHUD'),get('fieldDock')])move(context,n);
 const localActions=get('localActions14'),localDrawer=drawer('hud135LocalActions','ACTIONS À PROXIMITÉ','hud135-local-actions');
 if(localActions){localDrawer.open=true;move(context,localDrawer);move(localDrawer,localActions);localDrawer.addEventListener('toggle',refresh);}
 // Old regional controls have real actions absent from the newer regional dock.
 const dock=get('fieldDock'),regional=drawer('hud135RegionTools','VÉHICULE & TRAJET','hud135-region-tools');
 if(dock){for(const id of ['frontierCargo','frontierFuel','returnHud'])move(regional,get(id));const old=get('frontierHud');for(const n of [...(old?.children||[])])if(n.classList.contains('supplies-progress'))move(regional,n);dock.appendChild(regional);}
 // Touch controls remain in the footer, with a dedicated column instead of floating over prompts.
 move(footer,get('touchControls'));move(auxiliary,touchCommands);
 const closeOther=opened=>{for(const n of drawers)if(n!==opened)n.open=false;};
 // Native details toggles are queued. Restoring a drawer after a modal must
 // not cancel a new movement key pressed before that queued event arrives.
 for(const d of [...drawers,localDrawer])d.querySelector('summary')?.addEventListener('click',()=>{if(!hud.inert&&!d.closest('[inert]'))g.releaseInputs?.();});
 for(const d of drawers)d.addEventListener('toggle',()=>{if(d.open){closeOther(d);if(g.isCompactViewport?.()&&d!==tools)g.setBuildCollapsed?.(true);}refresh();});
 const trayDrawers=[...(get('fieldUtilityTray')?.children||[])].filter(n=>n.tagName==='DETAILS');
 for(const d of trayDrawers)d.addEventListener('toggle',()=>{if(d.open){tools.open=true;for(const other of trayDrawers)if(other!==d)other.open=false;closeOther(tools);}refresh();});
 // The day planner reports refusals above its schedule. Show that existing
 // result only after the player's explicit attempt, never during HUD refresh.
 const finishDay=get('dayworksFinish'),finishConfirm=get('dayworksFinishConfirm'),dayStatus=get('dayworksStatus');
 finishDay?.addEventListener('click',()=>{
  if(finishDay.disabled||finishDay.closest('[inert]')||g.activeOverlay!==g.ui.commandModal||g.phase!=='calm'||!finishConfirm?.classList.contains('hidden')||!dayStatus?.textContent)return;
  dayStatus.setAttribute('tabindex','-1');dayStatus.scrollIntoView({block:'center',inline:'nearest'});dayStatus.focus({preventScroll:true});
 });
 let lastSelection=null,lastCrisis=false,lastWorld=null,measuredKey='',safe=null,wasBlocked=false,restoreDrawers=null,hudFocus=null,lastShort=null,lastTacticalPhase=null,tacticalReading=false;
 right.addEventListener('scroll',()=>{if(hud.dataset.blocked!=='true'&&hud.dataset.short==='true'&&['warning','assault'].includes(g.phase)){const reading=right.scrollTop>0;if(reading!==tacticalReading){tacticalReading=reading;refresh();}}});
 intel.querySelector('summary').addEventListener('click',()=>{if(!intel.open&&hud.dataset.blocked!=='true'&&hud.dataset.short==='true'&&['warning','assault'].includes(g.phase))tacticalReading=true;});
 const shown=node=>node&&!node.hidden&&!node.classList.contains('hidden')&&[...node.children].some(n=>!n.hidden&&!n.classList.contains('hidden'));
 function measure(){
  const width=Math.max(80,g.width||globalThis.innerWidth||1280),height=Math.max(80,g.height||globalThis.innerHeight||720),r=center.getBoundingClientRect();
  const box={left:r.left||0,top:r.top||0,right:r.right??((r.left||0)+(r.width||width)),bottom:r.bottom??((r.top||0)+(r.height||height))};
  let l=Math.max(24,box.left+22),t=Math.max(24,box.top+22),rightEdge=Math.min(width-24,box.right-22),bottom=Math.min(height-24,box.bottom-22);
  if(shown(alerts)){const a=alerts.getBoundingClientRect();t=Math.max(t,(a.bottom??a.top+a.height)+18);}
  if(shown(context)){const c=context.getBoundingClientRect();bottom=Math.min(bottom,c.top-18);}
  if(rightEdge-l<24){const mid=Math.max(36,Math.min(width-36,(box.left+box.right)/2));l=mid-12;rightEdge=mid+12;}
  if(bottom-t<24){const mid=Math.max(36,Math.min(height-36,(box.top+box.bottom)/2));t=mid-12;bottom=mid+12;}
  safe=Object.freeze({left:l,right:rightEdge,top:t,bottom});return safe;
 }
 function refresh(){
  const blocked=g.state!=='playing'||g.gameOver||g.player?.dead||!!g.activeOverlay||g.paused;
  const tactical=['warning','assault'].includes(g.phase),forecast=tactical||g.phase==='aftermath';
  wave.dataset.phase=g.phase||'calm';if(waveIntel)waveIntel.hidden=!forecast;
  battleActions.hidden=!tactical;for(const button of quickButtons)button.disabled=!!blocked||!tactical||!g.coordinationUI;
  if(g.world!==lastWorld){lastTacticalPhase=null;tacticalReading=false;}
  if(!blocked&&tactical&&lastTacticalPhase!==g.phase){right.scrollTop=0;lastTacticalPhase=g.phase;tacticalReading=false;}else if(!tactical){lastTacticalPhase=null;tacticalReading=false;}
  const short=!!g.isCompactViewport?.()&&g.height<=500;hud.dataset.short=String(short);
  const reading=short&&tactical&&tacticalReading;wave.dataset.reading=String(reading);
  if(waveIntel?.dataset.detail){const text=reading?waveIntel.dataset.counts:short?waveIntel.dataset.compact:waveIntel.dataset.detail;if(waveIntel.textContent!==text)waveIntel.textContent=text;}
  if(waveIntel&&reading&&g.phase==='warning')waveIntel.hidden=true;
  if(innerAlert){innerAlert.dataset.summary=innerAlert.textContent.replace('CONTACTS PROCHES DU CENTRE · ','CENTRE · ');if(reading)innerAlert.setAttribute('aria-label',innerAlert.textContent);else innerAlert.removeAttribute('aria-label');}
  if(short!==lastShort){localDrawer.open=objectiveInstructions.open=!short;lastShort=short;}
  if(localActions){
   localDrawer.classList.toggle('hidden',localActions.classList.contains('hidden'));
   localDrawer.querySelector('summary').textContent=(localActions.querySelector('strong')?.textContent||'À proximité')+' · ACTIONS';
   move(short?auxiliary:context,localDrawer);
  }
  hud.dataset.blocked=String(!!blocked);hud.dataset.region=String(!!g.frontier?.active?.());hud.dataset.build=String(!g.buildCollapsed);
  if(blocked){
   if(!wasBlocked)restoreDrawers={world:g.world,open:drawers.filter(n=>n.open),focus:hudFocus};
   for(const n of drawers)n.open=false;
   if(g.state!=='playing'||g.gameOver||g.player?.dead)restoreDrawers=null;
  }else if(wasBlocked&&restoreDrawers){
   if(restoreDrawers.world===g.world){
    for(const n of restoreDrawers.open)n.open=true;
    const target=restoreDrawers.focus;
    if(target&&hud.contains(target)&&!target.closest?.('[inert], .hidden'))target.focus?.({preventScroll:true});
   }
   restoreDrawers=null;
  }
  wasBlocked=!!blocked;
  if(!blocked&&g.world!==lastWorld){lastWorld=g.world;if(!g.isCompactViewport?.()){map.open=true;closeOther(map);}}
  const selection=g.selectedBuilding?.id??null,crisis=get('crisisCard'),hasCrisis=!!crisis&&!crisis.classList.contains('hidden');
  const needsIntel=!blocked&&((selection!==null&&selection!==lastSelection)||(hasCrisis&&!lastCrisis));
  lastSelection=selection;lastCrisis=hasCrisis;
  if(needsIntel){intel.open=true;closeOther(intel);if(g.isCompactViewport?.()&&!g.buildCollapsed)g.setBuildCollapsed?.(true);}
  // One location for bag quantity; region supplies posture/surface instead of the D-17 label.
  tools.dataset.active=String(trayDrawers.some(n=>n.open));
  const working=get('interventions134Dock');hud.dataset.intervention=String(!!working&&!working.classList.contains('hidden'));
  if(g.buildCollapsed===false&&g.isCompactViewport?.()){intel.open=false;map.open=false;}
  const key=[g.width,g.height,blocked,hud.dataset.region,hud.dataset.build,...drawers.map(n=>n.open),...[...context.children].map(n=>n.classList.contains('hidden')),...[...alerts.children].map(n=>n.classList.contains('hidden'))].join(':');
  if(!blocked&&key!==measuredKey){measuredKey=key;measure();}
 }
 const wrap=name=>{if(typeof g[name]!=='function')return;const old=g[name].bind(g);g[name]=(...args)=>{if(name==='syncOverlayFocus')hudFocus=hud.contains(doc.activeElement)?doc.activeElement:null;const r=old(...args);refresh();return r;};};
 for(const name of ['updateUI','syncOverlayFocus','setBuildCollapsed','returnToMenu','togglePause'])wrap(name);
 if(typeof g.onEscape==='function'){
  const old=g.onEscape.bind(g);
  g.onEscape=(...args)=>{
   if(g.activeOverlay||g.interventionsUI134?.isOpen?.())return old(...args);
   const focused=doc.activeElement?.closest?.('details'),open=focused?.open&&hud.contains(focused)?focused:drawers.find(n=>n.open);
   if(!open)return old(...args);
   if(!open.contains(doc.activeElement)){
    const field=g.fieldcraft?.context(),plan=g.dayworks?.overview(),roads=g.infrastructure?.overview();
    if(g.selectedBuild||g.rallyPlacement||g.linecare?.toolActive()||field?.moving||field?.quote||field?.mounted||plan?.placing||plan?.preview||roads?.preview||roads?.tool&&roads.tool!=='none')return old(...args);
   }
   open.open=false;if(open===tools)for(const d of trayDrawers)d.open=false;
   g.releaseInputs?.();open.querySelector('summary')?.focus?.({preventScroll:true});refresh();return true;
  };
 }
 const observer=typeof globalThis.ResizeObserver==='function'?new globalThis.ResizeObserver(()=>{if(hud.dataset.blocked!=='true')measure();}):null;
 for(const n of [center,context,alerts])observer?.observe(n);
 const api=Object.freeze({refresh,measure,safeFrame:()=>safe,regions:()=>({hud,main,left,center,right,alerts,context,footer,combat,auxiliary,utilityHost,intel,map,tools,touchCommands}),snapshot:()=>({blocked:hud.dataset.blocked==='true',region:hud.dataset.region==='true',build:!g.buildCollapsed,open:drawers.filter(n=>n.open).map(n=>n.id),context:[...context.children].filter(n=>!n.hidden&&!n.classList.contains('hidden')).map(n=>n.id)})});
 g.hud135=api;refresh();return api;
}
return Object.freeze({install});
});
