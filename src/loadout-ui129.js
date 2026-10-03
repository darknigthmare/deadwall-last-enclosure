/* Dedicated equipment workspace. Every slot is backed by a current game system. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
function install(g,doc=root.document){
 if(g.loadoutUI||!doc||!g.loadout)return false;
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls,focusKey=text)=>{const b=el('button',text,cls);b.type='button';b.dataset.action=focusKey;b.addEventListener('click',fn);return b;};
 const number=n=>Number(n||0).toLocaleString('fr-FR',{maximumFractionDigits:2}),kg=n=>number(n)+' kg';
 const overlay=el('section',undefined,'loadout129 hidden');overlay.id='loadout129';overlay.classList.add('hidden');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','loadout129Title');overlay.tabIndex=-1;
 const shell=el('div',undefined,'loadout-shell'),header=el('header',undefined,'loadout-header'),identity=el('div'),title=el('h1','ÉQUIPEMENT & BAGAGES');title.id='loadout129Title';
 identity.appendChild(el('span','D-17 / PRÉPARATION DE SORTIE','loadout-eyebrow'));identity.appendChild(title);
 const summary=el('p',undefined,'loadout-total'),closeButton=button('FERMER  [ I / ÉCHAP ]',()=>close(),'loadout-close');header.appendChild(identity);header.appendChild(summary);header.appendChild(closeButton);
 const body=el('div',undefined,'loadout-body'),character=el('section',undefined,'loadout-character'),packPanel=el('section',undefined,'loadout-pack'),contextPanel=el('section',undefined,'loadout-context');body.appendChild(character);body.appendChild(packPanel);body.appendChild(contextPanel);
 const status=el('p','Choisissez un objet pour le déplacer ou le transférer.','loadout-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const footer=el('footer',undefined,'loadout-footer');footer.appendChild(status);footer.appendChild(el('span','CLIC : sélectionner / placer · R : pivoter · FLÈCHES : déplacer · ÉCHAP : fermer'));
 shell.appendChild(header);shell.appendChild(body);shell.appendChild(footer);overlay.appendChild(shell);doc.body.appendChild(overlay);
 const inertBefore=new Map();
 let opened=false,previousPause=false,returnFocus=null,selected=null,otherId='depot',last=0,signature='',rotation=0;
 function icon(key,cls='loadout-icon'){if((C.Arsenal134Rules?.catalog[key]||['ammo','fuel'].includes(key))&&root.DeadwallAssets136)return root.DeadwallAssets136.icon(doc,key,{category:C.Arsenal134Rules?.catalog[key]?.category||'',className:cls});const n=el('span',undefined,cls);n.dataset.icon=key;n.setAttribute('aria-hidden','true');return n;}
 function result(r){status.textContent=r?.ok?r.amount?number(r.amount)+' transféré sans perte.':'Matériel mis à jour.':r?.reason||'Action indisponible.';refresh(true);return r;}
 function choose(container,item){selected={container,item};const q=g.loadout.view(container).items.find(i=>i.id===item);rotation=q?.rotation||0;refresh(true);}
 function drawGrid(host,v){
  const grid=el('div',undefined,'loadout-grid');grid.dataset.container=v.id;grid.style.setProperty('--cols',v.cols);grid.style.setProperty('--rows',v.rows);grid.setAttribute('role','group');grid.setAttribute('aria-label',v.name+' : '+v.cols+' colonnes, '+v.rows+' lignes');
  for(let y=0;y<v.rows;y++)for(let x=0;x<v.cols;x++){
   const cell=button('',()=>{if(selected?.container===v.id)result(g.loadout.move(v.id,selected.item,x,y,rotation));},'loadout-cell');cell.tabIndex=-1;cell.setAttribute('aria-label','Case '+(x+1)+', '+(y+1));cell.style.gridColumn=String(x+1);cell.style.gridRow=String(y+1);
   cell.addEventListener('dragover',e=>{if(selected?.container===v.id)e.preventDefault();});cell.addEventListener('drop',e=>{e.preventDefault();if(selected?.container===v.id)result(g.loadout.move(v.id,selected.item,x,y,rotation));});grid.appendChild(cell);
  }
  for(const item of v.items){
   const b=button('',()=>choose(v.id,item.id),'loadout-item');b.dataset.item=item.id;b.dataset.container=v.id;b.dataset.resource=item.key;b.draggable=!v.reason;
   b.setAttribute('aria-label',C.RESOURCE_META[item.key].label+' : '+number(item.quantity)+' portions, '+kg(item.kg)+', '+item.w+' sur '+item.h+' cases');b.setAttribute('aria-pressed',String(selected?.container===v.id&&selected.item===item.id));
   b.style.gridColumn=(item.x+1)+' / span '+item.w;b.style.gridRow=(item.y+1)+' / span '+item.h;b.appendChild(icon(item.key));b.appendChild(el('small',C.RESOURCE_META[item.key].label));b.appendChild(el('strong','× '+number(item.quantity)));
   b.addEventListener('dragstart',e=>{selected={container:v.id,item:item.id};rotation=item.rotation;e.dataTransfer?.setData('text/plain',item.id);status.textContent='Déposez dans une case libre de '+v.name+'.';});
   b.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(arrows[e.code]||e.code==='KeyR'){e.preventDefault();e.stopPropagation();selected={container:v.id,item:item.id};const delta=arrows[e.code]||[0,0],turn=e.code==='KeyR'?1-item.rotation:item.rotation;rotation=turn;result(g.loadout.move(v.id,item.id,item.x+delta[0],item.y+delta[1],turn));}
   });grid.appendChild(b);
  }
  host.appendChild(grid);
  if(v.overflow.length){const overflow=el('div',undefined,'loadout-overflow');overflow.appendChild(el('strong','À RANGER — contenu conservé'));for(const i of v.overflow)overflow.appendChild(button(C.RESOURCE_META[i.key].label+' × '+number(i.quantity),()=>choose(v.id,i.id)));host.appendChild(overflow);}
 }
 function containerHeader(host,v){const head=el('header',undefined,'loadout-container-head');head.appendChild(icon(v.id==='sac'?'backpack':v.id.startsWith('car:')?'trunk':'pouch'));const name=el('div');name.appendChild(el('small',v.subtitle));name.appendChild(el('h2',v.name));head.appendChild(name);head.appendChild(el('strong',kg(v.weight+v.tare)));host.appendChild(head);const meta=el('p',number(v.total)+' / '+number(v.capacity)+' portions · contenu '+kg(v.weight)+' / '+kg(v.maxWeight)+(v.tare?' · sac vide '+kg(v.tare):''),'loadout-capacity');host.appendChild(meta);const meter=el('progress');meter.max=v.capacity;meter.value=v.total;meter.setAttribute('aria-label','Capacité de '+v.name);host.appendChild(meter);if(v.reason)host.appendChild(el('p',v.reason,'loadout-warning'));}
 function drawCharacter(eq){
  character.replaceChildren();const name=el('div',undefined,'loadout-character-name');name.appendChild(el('small','COMMANDANT'));name.appendChild(el('h2','SURVIVANT D-17'));name.appendChild(el('span',Math.ceil(g.player.health)+' / '+g.player.maxHealth+' PV'));character.appendChild(name);
  const doll=el('div',undefined,'loadout-paperdoll'),img=el('img');img.src='assets/loadout-character129.png';img.alt='Commandant équipé pour la sortie';doll.appendChild(img);
  const label=(cls,title,detail)=>{const p=el('div',undefined,'loadout-body-slot '+cls);p.appendChild(el('small',title));p.appendChild(el('strong',detail));doll.appendChild(p);};
  label('slot-back','DOS','Sac de terrain');label('slot-belt','CEINTURE',eq.beltCount+' / '+eq.beltCapacity);label('slot-holster','EN MAIN',eq.weapons.find(w=>w.active&&w.owned)?.name||'Mains libres');label('slot-carry','PORTE-CHARGE',eq.heavy?'Occupé':'Libre');character.appendChild(doll);
  const personal=el('div',undefined,'loadout-personal');for(const item of eq.personal||[]){const row=el('article');row.appendChild(el('small',item.slot.toUpperCase()));row.appendChild(el('strong',item.name));row.appendChild(el('span',item.quantity+' × · '+kg(item.kg)+(item.maximum?' · '+Math.ceil(item.remaining/item.maximum*100)+' %':'')));personal.appendChild(row);}if(eq.personal?.length)character.appendChild(personal);
  const weapons=el('div',undefined,'loadout-weapons');for(const w of eq.weapons){const b=button('',()=>result(g.loadout.equipWeapon(w.id)),'loadout-weapon');b.dataset.action='weapon:'+w.id;b.appendChild(icon(w.icon||w.id));const text=el('span');text.appendChild(el('small',!w.owned?'ABSENT':w.active?'EN MAIN':w.available?'DANS LE HARNAIS':'PALIER '+w.tier));text.appendChild(el('strong',w.name));const details=!w.owned?'À récupérer ou assembler':!w.available?'Palier '+w.tier+' requis':w.category==='firearm'?w.rounds+' / '+w.magazine+' cartouches':w.damage+' dégâts · '+w.stamina+' endurance';text.appendChild(el('span',details+(w.condition===undefined?'':' · '+Math.ceil(w.condition)+' % état')));b.appendChild(text);b.disabled=!w.available;b.setAttribute('aria-pressed',String(w.active));weapons.appendChild(b);}if(!eq.weapons.some(w=>w.owned))weapons.appendChild(el('p','Mains libres. Récupérez votre matériel ou assemblez un équipement au dépôt.','loadout-muted'));character.appendChild(weapons);
  if(eq.armamentCapacity){const harness=el('div',undefined,'loadout-personal');harness.appendChild(el('p','HARNAIS · '+kg(eq.armamentWeight)+' / '+kg(eq.armamentCapacity)));for(const item of eq.deployables||[]){const row=el('article');row.appendChild(el('strong',item.name));row.appendChild(el('span',kg(item.kg)+' · '+Math.ceil(item.condition)+' % état · à déployer au sol'));harness.appendChild(row);}character.appendChild(harness);}
  if(eq.heavy){const p=el('article',undefined,'loadout-heavy');p.appendChild(icon('cargo'));p.appendChild(el('strong',eq.heavy.name));p.appendChild(el('span',eq.heavy.detail));character.appendChild(p);}
 }
 function drawBelt(eq){
  const belt=el('section',undefined,'loadout-belt');belt.appendChild(el('h3','CEINTURE · '+eq.beltCount+' / '+eq.beltCapacity+' · '+kg(eq.beltWeight)));
  const row=el('div',undefined,'loadout-belt-items');
  for(const i of eq.belt){const card=el('article',undefined,'loadout-belt-item');card.appendChild(icon(i.key));card.appendChild(el('strong',i.name+' × '+i.quantity));card.appendChild(el('small',kg(i.kg)+(i.left!==undefined?' · '+Math.ceil(i.left)+' s'+(i.on?' · ALLUMÉ':''):'')));
   if(i.id.startsWith('kit:'))card.appendChild(button('UTILISER',()=>result(g.essentials.use(i.key)),undefined,'use:'+i.id));
   else{const id=+i.id.slice(6);card.appendChild(button(i.on?'ÉTEINDRE':'ALLUMER',()=>result(g.nightGear.ignite(id)),undefined,'ignite:'+i.id));card.appendChild(button('POSER',()=>{const r=g.nightGear.place(id);result(r);if(r?.ok)close();},undefined,'place:'+i.id));}
   if(g.loadout.atHome())card.appendChild(button('RANGER',()=>result(i.id.startsWith('kit:')?g.essentials.transferKit(i.key,'store'):g.nightGear.transfer(+i.id.slice(6),'store')),undefined,'store:'+i.id));row.appendChild(card);
  }
  if(!eq.belt.length)row.appendChild(el('p','Ceinture vide. Équipez les kits et lampes préparés au dépôt.','loadout-muted'));belt.appendChild(row);packPanel.appendChild(belt);
 }
 function inspector(){
  const section=el('section',undefined,'loadout-inspector');
  if(!selected){section.appendChild(el('p','Sélectionnez une pile : quantité, masse, rotation et transfert apparaissent ici.'));packPanel.appendChild(section);return;}
  const v=g.loadout.view(selected.container),item=[...v.items,...v.overflow].find(i=>i.id===selected.item);
  if(v.id!==selected.container||!item){selected=null;section.appendChild(el('p','Cette pile a été consommée ou déplacée.'));packPanel.appendChild(section);return;}
  section.appendChild(icon(item.key));const heading=el('div');heading.appendChild(el('h3',C.RESOURCE_META[item.key].label));heading.appendChild(el('p',C.LoadoutRules.resources[item.key].note+' · '+kg(item.kg)));section.appendChild(heading);
  const controls=el('div',undefined,'loadout-transfer'),amount=el('input');amount.type='number';amount.min='.01';amount.max=String(item.quantity);amount.step='any';amount.value=String(Number(item.quantity.toFixed(6)));amount.dataset.action='quantity';amount.setAttribute('aria-label','Quantité à transférer');
  const destination=el('select');destination.dataset.action='destination';destination.setAttribute('aria-label','Conteneur de destination');const choices=selected.container==='sac'?g.loadout.containers().filter(c=>c.id!=='sac').concat({id:'depot',name:'Dépôt de D-17',reason:g.loadout.atHome()?'':'Rejoignez D-17'}):[{id:'sac',name:'Sac de terrain'}];
  for(const c of choices){const option=el('option',c.name+(c.reason?' · hors de portée':''));option.value=c.id;destination.appendChild(option);}destination.value=choices.some(c=>c.id===otherId)?otherId:choices[0]?.id||'';
  const transfer=button('TRANSFÉRER →',()=>result(g.loadout.transfer(selected.container,destination.value,item.key,Number(amount.value))));transfer.disabled=!choices.length;controls.appendChild(amount);controls.appendChild(destination);controls.appendChild(transfer);
  controls.appendChild(button('PIVOTER  [ R ]',()=>{rotation=1-(item.rotation||0);result(g.loadout.move(selected.container,item.id,item.x??0,item.y??0,rotation));}));section.appendChild(controls);packPanel.appendChild(section);
 }
 function drawContext(list){
  contextPanel.replaceChildren();const select=el('select',undefined,'loadout-context-select');select.dataset.action='neighbor';select.setAttribute('aria-label','Conteneur voisin');const choices=[{id:'depot',name:'Dépôt de D-17'},...list.filter(c=>c.id!=='sac')];if(!choices.some(c=>c.id===otherId))otherId='depot';
  for(const c of choices){const o=el('option',c.name);o.value=c.id;select.appendChild(o);}select.value=otherId;select.addEventListener('change',()=>{otherId=select.value;refresh(true);});contextPanel.appendChild(select);
  if(otherId!=='depot'){const v=g.loadout.view(otherId);containerHeader(contextPanel,v);drawGrid(contextPanel,v);contextPanel.appendChild(button('RANGER AUTOMATIQUEMENT',()=>result(g.loadout.tidy(v.id)),'loadout-tidy','tidy:'+v.id));return;}
  contextPanel.appendChild(el('h2','RÉSERVE DE D-17'));contextPanel.appendChild(el('p',g.loadout.atHome()?'Accès au dépôt établi. Prélevez les portions nécessaires à votre sortie.':'Rejoignez le centre pour prélever ou déposer des fournitures.','loadout-muted'));
  const stores=el('div',undefined,'loadout-store');for(const key of C.RESOURCE_KEYS){const row=el('article');row.appendChild(icon(key));row.appendChild(el('strong',C.RESOURCE_META[key].label));row.appendChild(el('span',number(g.resources[key])+' portions'));const b=button('+ '+C.LoadoutRules.resources[key].stack,()=>result(g.loadout.transfer('depot','sac',key,C.LoadoutRules.resources[key].stack)),undefined,'take:'+key);b.setAttribute('aria-label','Prélever '+C.LoadoutRules.resources[key].stack+' portions de '+C.RESOURCE_META[key].label.toLowerCase());b.disabled=!g.loadout.atHome();row.appendChild(b);stores.appendChild(row);}contextPanel.appendChild(stores);
  const equipment=g.essentials.snapshot(),night=g.nightGear.snapshot();const held=el('section',undefined,'loadout-store-equipment');held.appendChild(el('h3','MATÉRIEL PRÉPARÉ'));
  let available=0;for(const[key,quantity]of Object.entries(equipment.stock))if(quantity>0){available++;const b=button(C.Essentials.RULES.kits[key].name+' × '+quantity+' · ÉQUIPER',()=>result(g.essentials.transferKit(key,'equip')),undefined,'equip-kit:'+key);b.disabled=!g.loadout.atHome();held.appendChild(b);}for(const d of night.devices.filter(x=>x.location==='stock')){available++;const b=button(C.NightGearRules.types[d.kind].name+' · ÉQUIPER',()=>result(g.nightGear.transfer(d.id,'equip')),undefined,'equip-light:'+d.id);b.disabled=!g.loadout.atHome();held.appendChild(b);}if(!available)held.appendChild(el('p','Aucun kit ni lampe préparé en réserve.'));contextPanel.appendChild(held);
 }
 function refresh(force=false){
  if(!opened)return false;const now=Date.now();if(!force&&now-last<350)return false;last=now;
  const list=g.loadout.containers(),v=g.loadout.view('sac'),eq=g.loadout.equipment(),key=JSON.stringify([list,v.items,eq,selected,otherId,g.player.health,g.player.weapon,g.resources]);if(!force&&key===signature)return false;signature=key;
  const active=doc.activeElement,focus=active?.dataset?.item?{container:active.dataset.container,item:active.dataset.item}:active?.dataset?.action?{action:active.dataset.action}:null,scroll=body.scrollTop;
  summary.textContent=kg(v.weight+v.tare+eq.beltWeight+(eq.personalWeight||0)+(eq.armamentWeight||0))+' SAC + CEINTURE + ÉQUIPEMENT · '+number(v.total)+' / '+v.capacity+' PORTIONS';drawCharacter(eq);packPanel.replaceChildren();containerHeader(packPanel,v);drawGrid(packPanel,v);packPanel.appendChild(button('RANGER AUTOMATIQUEMENT',()=>result(g.loadout.tidy('sac')),'loadout-tidy','tidy:sac'));inspector();drawBelt(eq);drawContext(list);body.scrollTop=scroll;
  if(focus){const b=Array.from(overlay.querySelectorAll('button,input,select')).find(b=>!b.disabled&&(focus.item?b.dataset.item===focus.item&&b.dataset.container===focus.container:b.dataset.action===focus.action));(b||closeButton).focus({preventScroll:true});}
  return true;
 }
 const sync=g.syncOverlayFocus.bind(g);g.syncOverlayFocus=(...a)=>{if(!opened)return sync(...a);for(const n of [...Array.from(doc.body.children),g.ui.hud,g.ui.mainMenu,g.ui.pauseMenu,g.ui.commandModal,g.ui.settingsModal,g.ui.helpModal])if(n&&n!==overlay){if(!inertBefore.has(n))inertBefore.set(n,n.inert);n.inert=true;}overlay.inert=false;g.activeOverlay=overlay;g.releaseInputs();if(!overlay.contains(doc.activeElement))closeButton.focus({preventScroll:true});};
 const commands=g.canIssueCommand.bind(g);g.canIssueCommand=()=>opened&&g.activeOverlay===overlay?g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0:commands();
 function open(){
  if(opened){close();return true;}if(g.state!=='playing'||g.gameOver||g.player.dead)return false;
  if(g.exploration125?.overlayOpen())g.exploration125.closeOverlay();
  if(g.activeOverlay&&![g.ui.pauseMenu,g.ui.commandModal].includes(g.activeOverlay))return false;
  returnFocus=doc.activeElement;previousPause=g.paused;opened=true;selected=null;g.paused=true;g.releaseInputs();g.cancelPlacement?.();overlay.classList.remove('hidden');g.syncOverlayFocus();refresh(true);closeButton.focus({preventScroll:true});return true;
 }
 function close(){if(!opened)return false;opened=false;overlay.classList.add('hidden');overlay.inert=true;for(const[n,inert]of inertBefore)n.inert=inert;inertBefore.clear();if(g.state==='playing'&&!g.gameOver)g.paused=previousPause;g.syncOverlayFocus();if(returnFocus&&!returnFocus.closest?.('[inert], .hidden'))returnFocus.focus({preventScroll:true});returnFocus=null;return true;}
 overlay.addEventListener('keydown',e=>{if(e.code==='Escape'||e.code==='KeyI'&&!e.target?.closest?.('input,textarea,select')){e.preventDefault();e.stopPropagation();close();}else if(e.code==='Tab')g.trapOverlayFocus(e);});
 overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)close();});
 const suspendForFocusLoss=g.suspendForFocusLoss.bind(g);g.suspendForFocusLoss=(...a)=>{
  if(opened&&g.state==='playing'&&!g.gameOver){previousPause=true;g.ui.pauseMenu.classList.remove('hidden');}
  const r=suspendForFocusLoss(...a);if(opened)g.syncOverlayFocus();return r;
 };
 const update=g.updateUI.bind(g);g.updateUI=(...a)=>{const r=update(...a);refresh();return r;};
 const toMenu=g.returnToMenu.bind(g);g.returnToMenu=(...a)=>{close();return toMenu(...a);};
 g.loadoutUI=Object.freeze({open,close,dismiss:()=>{previousPause=g.paused;return close();},refresh,isOpen:()=>opened,overlay,body});g.art?.ready?.then(()=>{if(opened)refresh(true);});if(g.exploration125)g.exploration125.openInventory=open;
 return true;
}
const api={install};root.DeadwallLoadoutUI129=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;else if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
