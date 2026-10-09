(function(root){'use strict';const g=root.DEADWALL,C=root.DeadwallCore,R=C.WorldEvolution.RULES;if(!g?.worldEvolution)return;
function mount(){if(g.worldEvolutionUI)return;const get=id=>document.getElementById(id),host=get('frontierDossier');if(!host)return;const el=(t,s,c)=>{const n=document.createElement(t);if(s!==undefined)n.textContent=s;if(c)n.className=c;return n;},btn=(s,id,fn)=>{const n=el('button',s);n.type='button';n.id=id;n.onclick=()=>{if(!n.disabled){fn();render();}};return n;};
const panel=el('details',undefined,'evo-panel');panel.id='evolutionPanel';panel.append(el('summary','Monde, flotte & expansion'));const tabs=el('div',undefined,'evo-tabs'),body=el('div',undefined,'evo-body');panel.append(tabs,body);host.append(panel);let tab='world';for(const[k,n]of [['world','Monde'],['fleet','Flotte'],['districts','Districts'],['people','Équipe'],['campaign','Campagne'],['coop','Coop']])tabs.append(btn(n,'evoTab-'+k,()=>tab=k));
const dock=el('section',undefined,'field-dock hidden');dock.id='fieldDock';const status=el('div',undefined,'field-dock-status'),actions=el('div',undefined,'field-dock-actions'),context=el('div',undefined,'field-dock-context');dock.append(status,actions,context);document.body.append(dock);actions.append(btn('CARTE','fieldDockMap',()=>g.frontierUI.open()),btn('SAC','fieldDockBag',()=>g.fieldSuppliesUI.open()),btn('MATÉRIEL','fieldDockGear',()=>g.essentialUI.open()),btn('VÉHICULE','fieldDockVehicle',()=>g.frontier.board()),btn('POSTURE','fieldDockPosture',()=>g.frontier.cyclePosture()));
// A short touch viewport already has a bounded action shelf. Reuse that shelf
// instead of letting the regional dock consume the commander's field of view.
const terrain=el('details',undefined,'field-dock-terrain'),terrainSummary=el('summary'),terrainCaption=el('span','TERRAIN & TRAJET','field-dock-caption'),terrainTarget=el('span',undefined,'field-dock-target'),terrainBody=el('div',undefined,'field-dock-terrain-body');terrain.id='fieldDockTerrain';terrainSummary.id='fieldDockTerrainToggle';terrainSummary.append(terrainCaption,terrainTarget);terrain.append(terrainSummary,terrainBody);dock.append(terrain);
let shortDock=false,promptHome=null,drawerBindings=false;
function placeDock(active){
 dock.classList.toggle('hidden',!active);
 const field=get('hud135Context'),shelf=get('hud135Auxiliary'),prompt=get('interactionHint');
 if(!field||!shelf||!document.body.contains(field)||!document.body.contains(shelf))return;
 if(!drawerBindings){for(const id of ['hud135Tools','touchCommandDrawer'])get(id)?.querySelector('summary')?.addEventListener('click',()=>{if(shortDock)terrain.open=false;});drawerBindings=true;}
 const short=active&&g.isCompactViewport?.();
 if(short!==shortDock){
  shortDock=short;terrain.open=false;
  if(short){terrainBody.append(status,context);shelf.prepend(dock);if(prompt){promptHome=field;terrainBody.append(prompt);}}
  else{dock.prepend(status,actions,context);field.append(dock);if(promptHome&&prompt){promptHome.prepend(prompt);promptHome=null;}}
 }
 shelf.dataset.regionDock=String(!!short);dock.dataset.short=String(!!short);
 const regional=get('hud135RegionTools'),regionalHost=short?terrainBody:dock;if(regional&&regional.parentNode!==regionalHost)regionalHost.append(regional);
 // Only an explicit disclosure activation releases a held control; queued
 // programmatic restoration and ordinary refresh must preserve fresh input.
 if(short){
  const p=g.frontier.position(),hint=g.interactionText||'',target=hint.startsWith('RÉGION · E fouiller')?'':hint.split(' · ')[0];
  terrainCaption.textContent=p.z===0?'TERRAIN':p.z<0?'SOUS-SOL':'ÉTAGE '+p.z;
  terrainTarget.textContent=target;terrainTarget.hidden=!target;
  terrainSummary.title=[status.textContent,hint].filter(Boolean).join(' · ');terrainSummary.setAttribute('aria-label','Terrain et trajet · '+terrainSummary.title);
 }
}
terrainSummary.addEventListener('click',()=>{g.releaseInputs?.();if(!terrain.open)for(const id of ['hud135Tools','touchCommandDrawer']){const d=get(id);if(d)d.open=false;}});
// Crossing the physical seam already refreshes frontier UI synchronously.
// Move the existing controls in that transition, before the next throttled
// status refresh; no input, simulation or persistent state changes are needed.
if(typeof g.frontierUI?.refresh==='function'){
 const frontierUI=g.frontierUI;
 g.frontierUI=Object.freeze({...frontierUI,refresh:(...args)=>{const result=frontierUI.refresh(...args);placeDock(g.frontier.active()&&g.state==='playing'&&!g.gameOver);return result;}});
}
const cost=c=>Object.entries(c).map(([k,n])=>n+' '+C.RESOURCE_META[k].label.toLowerCase()).join(' · ');
// A discovered group is historic knowledge, not a live count or position.
// Reuse the maps' physical observers and summarize only their current contacts.
function observedGroups(f){
 const vision=g.visibility?.frame?.();if(!vision)return[];
 const groups=new Map();
 for(const contact of g.worldEvolution.groupMembers()){
  if(!vision.canSeeRegional(contact))continue;
  const distance=Math.hypot(contact.x-f.x,contact.y-f.y),id=contact.group.id;
  let group=groups.get(id);
  if(!group){group={id,kind:contact.group.kind,count:0,distance,x:contact.x,y:contact.y};groups.set(id,group);}
  group.count++;
  if(distance<group.distance)Object.assign(group,{distance,x:contact.x,y:contact.y});
 }
 return [...groups.values()].sort((a,b)=>a.distance-b.distance);
}
function refreshCoop(){const current=g.coop.overview?.(),line=get('coopStatus');if(!line)return;const text=(current?.notice||'Relais coop non connecté.')+(current?.connected?' · Salle '+current.room+' · '+current.peers.length+' présence(s)':'');if(line.textContent!==text)line.textContent=text;const ping=get('coopPing'),disconnect=get('coopDisconnect');ping.disabled=!current?.connected||!g.frontier.active();ping.title=!current?.connected?'Connectez un relais avant de signaler une position.':!g.frontier.active()?'Sortez dans la région pour signaler votre position.':'Signaler la position régionale actuelle.';disconnect.disabled=!current?.connected&&!current?.connecting;}
function render(){if(tab==='coop'&&body.dataset.view==='coop'){refreshCoop();return;}const focusedId=body.contains(document.activeElement)?document.activeElement.id:null;body.dataset.view=tab;body.replaceChildren();const v=g.worldEvolution.overview(),f=g.frontier.snapshot();for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.id==='evoTab-'+tab));
if(tab==='world'){body.append(el('p','Le monde étendu ajoute des routes, des agglomérations et des bâtiments. Une campagne déjà explorée conserve son terrain.'));const b=btn(f.generation>=4?'MONDE ÉTENDU ACTIF':'ACTIVER LE MONDE ÉTENDU','enableWorld4',()=>g.worldEvolution.enableWorld4());b.disabled=f.generation>=4||f.active||f.seen.length>0||Object.keys(f.taken).length>0;body.append(b);for(const h of observedGroups(f)){const a=el('article',undefined,'evo-card');a.append(el('strong',R.behaviours[h.kind].name+' · '+h.count+' contacts observés'),el('span',(h.x/1000).toFixed(2)+' / '+(h.y/1000).toFixed(2)+' km'));body.append(a);}}
if(tab==='fleet')for(const[id,p]of Object.entries(R.vehicles)){const a=el('article',undefined,'evo-card'),b=btn(v.fleet.selected===id?'SÉLECTIONNÉ':'PRÉPARER','fleet-'+id,()=>g.worldEvolution.selectVehicle(id));b.disabled=g.tier.id<p.tier||!!g.expeditions.car()?.health;a.append(el('strong',p.name),el('span','Palier '+p.tier+' · '+p.speed+' m/s · coffre '+p.cargo+(p.tank?' · '+p.tank+' carburant':' · sans carburant')),el('small',cost(p.cost)),b);body.append(a);}
if(tab==='districts'){body.append(el('p','Cinq annexes étendent physiquement D-17 autour du secteur historique.'));for(const d of v.districts){const a=el('article',undefined,'evo-card'),c=btn('SÉCURISER','claim-'+d.id,()=>g.worldEvolution.claimDistrict(d.id)),q=g.worldEvolution.previewDistrictClaim(d.id);c.disabled=!q.ok;c.title=q.reason||cost(q.cost);a.append(el('strong','District '+d.id.toUpperCase()+' · niveau '+d.level),el('span',d.complete+' / '+d.buildings.length+' bâtiments achevés'),el('small',q.reason||'Sécurisation : '+cost(q.cost)),c);if(d.level)for(const[k,x]of Object.entries(R.districtBuildings)){const b=btn('+ '+x.name,'build-'+d.id+'-'+k,()=>g.worldEvolution.buildDistrict(d.id,k)),build=g.worldEvolution.previewDistrictBuild(d.id,k);b.title=build.reason||cost(build.cost);b.disabled=!build.ok;a.append(b,el('small',build.reason||cost(build.cost)));}body.append(a);}}
if(tab==='people'){
 const rules=R.companionRules,max=rules.maxCompanions||2,min=rules.minimumPopulation||4,food=rules.assignmentFood||2;
 body.append(el('p',max+' partenaires maximum, affectés ou retirés depuis D-17. Affectation : '+food+' nourriture des réserves de la cité ; population minimale : '+min+'.'));
 const duties={lea:'Repère les hordes à '+rules.scoutRange+' m, à l’extérieur.',samir:'Soigne '+rules.healPerSecond+' PV/s à moins de '+rules.healRange+' m : '+rules.medicinePerHealth+' médicament du sac par PV.',ines:'Répare un véhicule encore en état à '+rules.repairRange+' m : '+rules.repairPerSecond+' PV/s contre '+rules.scrapPerHealth+' ferraille du sac par PV.',malik:'Couvre les ennemis visibles à '+rules.shotRange+' m : '+rules.shotDamage+' dégâts toutes les '+rules.shotInterval+' s, contre '+rules.shotAmmo+' munition du sac.'};
 for(const[id,p]of Object.entries(R.companions)){
  const active=v.companions.some(c=>c.id===id),a=el('article',undefined,'evo-card');
  const reason=f.active?'Revenez à D-17 pour modifier l’équipe.':!g.canIssueCommand()?'Affectation disponible dans le commandement en partie.':active?'':g.population<min?'Il faut '+min+' personnes dans la cité.':v.companions.length>=max?'L’équipe de sortie est complète.':g.resources.food<food?'Nourriture insuffisante.':'';
  const b=btn(active?'RETIRER':'AFFECTER','comp-'+id,()=>active?g.worldEvolution.removeCompanion(id):g.worldEvolution.assignCompanion(id));b.disabled=!!reason;
  a.append(el('strong',p.name),el('span',p.role),el('p',duties[id]),b);if(reason)a.append(el('small',reason));body.append(a);
 }
 body.append(el('p','Emportez médicaments, ferraille et munitions avant de sortir : les soins, réparations et tirs s’arrêtent si le sac manque de la ressource nécessaire. Les partenaires vous suivent, respectent les accès et changent d’étage avec vous.','evo-note'));
 body.append(el('p','Moral '+v.civil.morale.toFixed(0)+'/100 · sécurité '+v.civil.safety.toFixed(0)+'/100.','evo-note'));
}
if(tab==='campaign')for(let i=0;i<R.campaign.length;i++){const x=R.campaign[i],done=i<v.campaign.chapter,a=el('article',undefined,'evo-card');a.append(el('strong',(done?'✓ ':'')+(i+1)+'. '+x.name),el('span',done?'Accompli':i===v.campaign.chapter?'Objectif actuel':'Verrouillé'));body.append(a);}
if(tab==='coop'){body.append(el('p','Préversion coop : positions et pings uniquement. Inventaires, combats et sauvegardes restent locaux.'),el('p','Relais WebSocket requis. Cette préversion est destinée aux parties ouvertes depuis un serveur local.','evo-note'));const u=el('input'),r=el('input'),n=el('input'),line=el('p',undefined,'evo-note');u.placeholder='ws://serveur:4290';r.placeholder='Salle';n.placeholder='Nom';u.id='coopServer';r.id='coopRoom';n.id='coopName';u.setAttribute('aria-label','Adresse du serveur coopératif');r.setAttribute('aria-label','Nom de la salle');n.setAttribute('aria-label','Votre nom');line.id='coopStatus';line.setAttribute('role','status');line.setAttribute('aria-live','polite');line.setAttribute('aria-atomic','true');body.append(u,r,n,btn('CONNECTER','coopConnect',()=>g.coop.connect(u.value,r.value,n.value)),btn('PING','coopPing',()=>g.coop.ping()),btn('DÉCONNECTER','coopDisconnect',()=>g.coop.disconnect()),line);refreshCoop();}if(focusedId){const target=get(focusedId);(body.contains(target)&&!target.disabled?target:get('evoTab-'+tab)).focus({preventScroll:true});}}
const contextUp=btn('MONTER','dockUp',()=>g.frontier.stairs(1)),contextDown=btn('DESCENDRE','dockDown',()=>g.frontier.stairs(-1)),contextNext=btn('SUIVANTE','fieldDockNext',()=>g.fieldAtlas.next()),contextStairs=el('span'),contextFocus=el('span'),contextGps=el('span');
contextStairs.id='fieldDockStairs';contextStairs.setAttribute('role','status');contextGps.id='fieldDockGps';
function refreshContext(f){
 const focused=context.contains(document.activeElement)?document.activeElement:null,next=[],stairStates=[g.frontier.stairsStatus(1),g.frontier.stairsStatus(-1)];
 for(const [delta,label,b,stairs]of [[1,'MONTER',contextUp,stairStates[0]],[-1,'DESCENDRE',contextDown,stairStates[1]]])if(f.poi?.levels.includes(f.z+delta)){
  b.disabled=!g.canIssueCommand()||!stairs.ok;b.title=g.frontierUI.stairHint(stairs,f)||stairs.reason;b.setAttribute('aria-label',label+' · '+b.title);next.push(b);
 }
 const stair=f.z>0&&stairStates[1].approach?stairStates[1]:stairStates[0].approach?stairStates[0]:stairStates[1];
 if(stair.approach){contextStairs.textContent=g.frontierUI.stairHint(stair,f);next.push(contextStairs);}
 if(f.focus){contextFocus.textContent='Cible : '+f.focus.label+' · '+f.focus.left.toFixed(1);next.push(contextFocus);}
 if(g.frontierUI.navigation){contextGps.textContent=g.frontierUI.navigation();next.push(contextGps);}
 if(g.fieldAtlas?.snapshot().tour?.active)next.push(contextNext);
 // Native pointer and Space activation span multiple live status refreshes.
 // Keep their button nodes attached while the physical action remains available.
 for(const node of [...context.children])if(!next.includes(node))node.remove();
 for(let i=0;i<next.length;i++)if(context.children[i]!==next[i])context.insertBefore(next[i],context.children[i]||null);
 if(focused&&(!context.contains(focused)||focused.disabled))get('fieldDockMap')?.focus({preventScroll:true});
}
let lastUI=-Infinity;function refresh(force=true){const now=performance.now();if(!force&&now-lastUI<400)return;lastUI=now;const active=g.frontier.active()&&g.state==='playing'&&!g.gameOver;document.body.classList.toggle('region-active',active);dock.classList.toggle('hidden',!active);if(active){const f=g.frontier.overview(),e=g.worldEvolution.overview(),veh=g.expeditions.car(),h=observedGroups(f)[0];const parts=[f.poi?f.poi.name:'Région',...(f.poi?[f.z===0?'RDC':f.z<0?'SOUS-SOL':'ÉTAGE '+f.z]:[]),e.posture?.name||'Debout',e.surface?.name||'D-17'];if(veh)parts.push((e.fleet.activeProfile?.name||'Véhicule')+' '+veh.fuel.toFixed(1));if(h)parts.push('CONTACTS '+h.count+' à '+Math.round(h.distance)+' m');status.textContent=parts.join(' · ');get('fieldDockVehicle').disabled=!f.car;get('fieldDockPosture').disabled=!!f.car?.driving;refreshContext(f);}placeDock(active);if(panel.open&&!panel.closest('.hidden'))render();}
const old=g.updateUI.bind(g);g.updateUI=(...a)=>{const z=old(...a);refresh(false);return z;};g.worldEvolutionUI={refresh,open:(requestedTab)=>{if(['world','fleet','districts','people','campaign','coop'].includes(requestedTab))tab=requestedTab;g.frontierUI.open();panel.open=true;render();}};render();refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();})(globalThis);
