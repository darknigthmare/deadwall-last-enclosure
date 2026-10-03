/* An illustrated arrival, with the campaign clock stopped until the player is ready. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
const SHOTS=Object.freeze([
 Object.freeze({id:'road',image:'assets/intro-road132.webp',eyebrow:'AVANT LE PREMIER QUART',title:'Il fallait un endroit où revenir.',text:'Les infectés ont gagné les routes abandonnées. Chaque halte peut devenir un piège, chaque départ couper le chemin du retour. Au milieu des messages sans réponse, un nom revient encore : D-17.',line:'Une destination. Aucune promesse de secours.'}),
 Object.freeze({id:'bastion',image:'assets/intro-bastion132.webp',eyebrow:'DÉPÔT MUNICIPAL · D-17',title:'Ce lieu ne tient pas encore.',text:'Un dépôt, quelques outils, des mains pour travailler. Pour en faire un refuge, il faudra tenir ses accès quand les infectés arriveront à la nuit. Ceux qui ont laissé les registres n’ont pas tous laissé d’adresse de retour.',line:'La clé est restée sur le tableau. La relève commence avec vous.'}),
 Object.freeze({id:'command',image:'assets/command-room132.webp',eyebrow:'PRENDRE LA RELÈVE',title:'Commander commence au sol.',text:'Vous porterez les premiers matériaux. Vous déciderez où construire, qui protéger et quel passage garder libre. Plus le refuge grandira, plus son bruit et ses lumières attireront les migrations.',line:'Le centre doit tenir. Prévoyez toujours une ligne de repli.'}),
 Object.freeze({id:'first-watch',image:'assets/intro-bastion132.webp',eyebrow:'VOTRE PREMIER JOUR',title:'Avant la nuit, une première ligne.',text:'Récoltez près du dépôt. Rapportez votre chargement. Financez un chantier, puis aidez à le terminer. Vos ouvriers prennent leur part du travail ; la défense, elle, reste à préparer.',line:'Ne partez pas trop loin avant que D-17 puisse se défendre sans vous.'})
]);
function install(g,doc=root.document){
 if(g?.campaignIntro132)return g.campaignIntro132;
 if(!g?.chronicles131||!g.ui?.mainMenu||!g.canvas||!doc?.body||typeof doc.createElement!=='function')return null;
 const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const button=(id,label,fn,cls)=>{const n=el('button',cls,label);n.type='button';n.id=id;n.addEventListener('click',()=>{if(opened&&!n.disabled)fn();});return n;};
 const overlay=el('section','campaign-intro132 hidden');overlay.id='campaignIntro132';overlay.inert=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','campaignIntro132Title');overlay.setAttribute('aria-describedby','campaignIntro132Text');overlay.setAttribute('tabindex','-1');
 const picture=el('img','campaign132-picture');picture.alt='';picture.draggable=false;picture.setAttribute('aria-hidden','true');
 const shade=el('div','campaign132-shade');shade.setAttribute('aria-hidden','true');
 const top=el('header','campaign132-top'),brand=el('span','campaign132-brand','DEADWALL'),mode=el('span','campaign132-mode','LA DERNIÈRE ENCEINTE');top.appendChild(brand);top.appendChild(mode);
 const copy=el('div','campaign132-copy'),eyebrow=el('p','campaign132-eyebrow'),title=el('h1','campaign132-title'),text=el('p','campaign132-text'),line=el('p','campaign132-line');title.id='campaignIntro132Title';text.id='campaignIntro132Text';
 const facts=el('p','campaign132-facts');facts.id='campaignIntro132Facts';
 const basics=el('dl','campaign132-basics');basics.id='campaignIntro132Basics';basics.setAttribute('aria-label','Commandes du premier quart');
 for(const[key,label]of [['ZQSD / WASD','Se déplacer'],['E / ACTION','Maintenir pour récolter ou déposer'],['B / BÂTIR','Ouvrir le catalogue'],['Échap / PAUSE','Suspendre la partie']]){const item=el('div'),term=el('dt',null,key),description=el('dd',null,label);item.appendChild(term);item.appendChild(description);basics.appendChild(item);}
 const progress=el('ol','campaign132-progress');progress.setAttribute('aria-label','Tableaux du prologue');const marks=SHOTS.map((shot,i)=>{const n=el('li',null,String(i+1).padStart(2,'0'));n.setAttribute('aria-label',shot.eyebrow);progress.appendChild(n);return n;});
 const status=el('p','campaign132-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 for(const n of [eyebrow,title,text,line,facts,basics])copy.appendChild(n);
 const controls=el('footer','campaign132-controls'),navigation=el('div','campaign132-navigation');
 const back=button('campaignIntro132Back','PRÉCÉDENT',previous,'campaign132-back'),nextButton=button('campaignIntro132Next','CONTINUER',next,'campaign132-next'),skip=button('campaignIntro132Skip','PASSER L’INTRODUCTION',finish,'campaign132-skip');
 skip.setAttribute('aria-description','Le suivi des premiers gestes reste actif après cette introduction.');
 navigation.appendChild(back);navigation.appendChild(nextButton);controls.appendChild(progress);controls.appendChild(navigation);controls.appendChild(skip);controls.appendChild(status);
 for(const n of [picture,shade,top,copy,controls])overlay.appendChild(n);doc.body.appendChild(overlay);
 let opened=false,index=0,previousPause=false,returnFocus=null,previousOverlay=null,modeReplay=false,scenarioId='classic';
 const inertBefore=new Map(),wrap=(name,fn)=>{if(typeof g[name]!=='function')return;const old=g[name].bind(g);g[name]=(...args)=>fn(old,...args);};
 function scenario(){return C.START_SCENARIOS[scenarioId]||C.START_SCENARIOS.classic;}
 function refresh(){
  if(!opened)return;
  const shot=SHOTS[index];if(picture.getAttribute('src')!==shot.image)picture.setAttribute('src',shot.image);
  overlay.dataset.shot=shot.id;overlay.classList.toggle('campaign132-static',!!g.settings?.reducedMotion);
  eyebrow.textContent=shot.eyebrow;title.textContent=shot.title;text.textContent=shot.text;line.textContent=shot.line;
  facts.textContent=index===SHOTS.length-1?scenario().name+' — '+scenario().description+' '+scenario().tradeoff:'';facts.hidden=index!==SHOTS.length-1;
  basics.hidden=index!==SHOTS.length-1;
  marks.forEach((mark,i)=>{mark.classList.toggle('is-current',i===index);mark.classList.toggle('is-past',i<index);mark.setAttribute('aria-current',i===index?'step':'false');});
  back.disabled=index===0;nextButton.textContent=index===SHOTS.length-1?(modeReplay?'FERMER LE PROLOGUE':'PRENDRE MON QUART'):'CONTINUER';
  status.textContent='Tableau '+(index+1)+' sur '+SHOTS.length+' · '+shot.eyebrow;g.paused=g.state==='playing'?true:g.paused;
 }
 function resetScroll(){overlay.scrollTop=0;copy.scrollTop=0;}
 function next(){if(!opened)return false;if(index===SHOTS.length-1)return finish();index++;resetScroll();refresh();nextButton.focus({preventScroll:true});g.audio.ui?.();return true;}
 function previous(){if(!opened||index===0)return false;index--;resetScroll();refresh();nextButton.focus({preventScroll:true});g.audio.ui?.();return true;}
 function sync(){
  for(const n of [...Array.from(doc.body.children),g.ui.hud,g.ui.mainMenu,g.ui.pauseMenu,g.ui.commandModal,g.ui.settingsModal,g.ui.helpModal]){
   if(n&&n!==overlay){if(!inertBefore.has(n))inertBefore.set(n,n.inert);n.inert=true;}
  }
  overlay.inert=false;g.activeOverlay=overlay;g.releaseInputs();
  if(g.state==='playing')g.paused=true;
  if(!overlay.contains(doc.activeElement))nextButton.focus({preventScroll:true});
 }
 function open(replay=false){
  if(opened||g.gameOver||!['playing','menu'].includes(g.state))return false;
  if(g.state==='playing'&&(g.player.dead||g.player.health<=0))return false;
  if(g.activeOverlay&&![g.ui.mainMenu,g.ui.pauseMenu,g.ui.commandModal].includes(g.activeOverlay))return false;
  previousPause=g.paused;returnFocus=doc.activeElement;previousOverlay=g.activeOverlay;modeReplay=replay;scenarioId=g.state==='playing'?g.scenarioId:(doc.getElementById('startScenario')?.value||'classic');
  opened=true;index=0;resetScroll();g.releaseInputs();g.cancelPlacement?.();overlay.classList.remove('hidden');doc.body.classList.add('campaign-intro-active');refresh();g.syncOverlayFocus();nextButton.focus({preventScroll:true});return true;
 }
 function cleanup(){
  opened=false;overlay.classList.add('hidden');overlay.inert=true;doc.body.classList.remove('campaign-intro-active');
  for(const[n,inert]of inertBefore)n.inert=inert;inertBefore.clear();g.releaseInputs();
 }
 function finish(){
  if(!opened)return false;const focus=returnFocus;cleanup();returnFocus=null;
  if(g.state==='playing'&&!g.gameOver){g.paused=previousPause;if(!previousOverlay||previousOverlay===g.ui.pauseMenu||previousOverlay.classList.contains('hidden'))g.ui.pauseMenu.classList.toggle('hidden',!previousPause);}
  g.syncOverlayFocus();g.updateUI();
  if(focus&&(!g.activeOverlay||g.activeOverlay.contains(focus))&&!focus.closest?.('[inert], .hidden')&&focus.getClientRects?.().length)focus.focus({preventScroll:true});
  else if(!g.activeOverlay&&g.state==='playing')g.canvas.focus({preventScroll:true});
  return true;
 }
 function guide(){
  if(g.state!=='playing'||g.gameOver)return;
  // A blocked earned reward needs its real capacity instructions even while
  // the optional first gestures remain active in the field records.
  if(g.objectiveReady)return;
  const p=g.chronicles131.snapshot().prologue;if(p.status!=='active')return;
  const R=C.Chronicles131Rules,step=p.stage;
  const amount=step===0?Math.max(0,g.stats.gathered-p.gathered):step===1?p.deposited:0,goal=step===0?R.prologueGather:step===1?R.prologueDeposit:1;
  g.ui.objectiveTitle.textContent=['Premiers gestes · Récolter','Premiers gestes · Déposer','Premiers gestes · Bâtir'][step];
  g.ui.objectiveText.textContent=[
   'Approchez du bois ou de la ferraille. Maintenez E / ACTION pour remplir votre sac.',
   'Revenez au dépôt de D-17 avec votre chargement. Maintenez E / ACTION pour le déposer.',
   'Financez une construction depuis le menu BÂTIR. Maintenez E / ACTION près du chantier pour aider les ouvriers.'
  ][step];
  g.ui.objectiveFill.style.width=(Math.min(1,amount/goal)*100)+'%';g.ui.objectiveCounter.textContent=(step+1)+' / 3 · '+(step===2?'Un nouveau chantier achevé':Math.min(goal,Math.floor(amount))+' / '+goal+' matériaux');
 }
 wrap('syncOverlayFocus',(old,...args)=>{if(!opened)return old(...args);sync();});
 wrap('canIssueCommand',(old,...args)=>!opened&&old(...args));
 wrap('update',(old,...args)=>{if(opened){g.releaseInputs();return;}return old(...args);});
 wrap('togglePause',(old,...args)=>{if(opened){if(args[0]===true)previousPause=true;sync();return false;}return old(...args);});
 wrap('onEscape',(old,...args)=>opened?finish():old(...args));
 for(const name of ['showHelp','showSettings','showCommand'])wrap(name,(old,show,...args)=>opened&&show?false:old(show,...args));
 wrap('suspendForFocusLoss',(old,...args)=>{if(opened&&g.state==='playing')previousPause=true;const result=old(...args);if(opened)sync();return result;});
 wrap('startNew',(old,...args)=>{
  if(opened){
   // Invalid setup must leave the current story and campaign intact. A valid new
   // world needs ordinary command permissions for its own generation migration.
   try{
    root.DeadwallProfile?.normalizeSeed(args[1]??'');
    root.DeadwallScenarios?.initialState(args[2]??'classic',typeof args[0]==='string'&&Object.hasOwn(C.DIFFICULTIES,args[0])?args[0]:'standard');
   }catch{return old(...args);}
   cleanup();returnFocus=null;g.paused=false;g.syncOverlayFocus();
  }
  const world=g.world,result=old(...args);
  if(result!==false&&g.world!==world&&g.state==='playing'){
   if(opened){cleanup();returnFocus=null;g.paused=false;g.syncOverlayFocus();}
   // The existing saved tutorial is primed before the cinematic pauses the world.
   g.chronicles131.startPrologue();open(false);guide();
  }
  return result;
 });
 wrap('restoreSave',(old,...args)=>{
  const result=old(...args);if(result!==false&&opened){cleanup();returnFocus=null;g.paused=false;g.syncOverlayFocus();g.updateUI();}return result;
 });
 wrap('returnToMenu',(old,...args)=>{const result=old(...args);if(opened&&g.state==='menu'){cleanup();returnFocus=null;g.syncOverlayFocus();}return result;});
 wrap('updateUI',(old,...args)=>{const result=old(...args);guide();if(opened)refresh();return result;});
 overlay.addEventListener('keydown',event=>{
  if(!opened)return;
  if(event.code==='Escape'){event.preventDefault();event.stopPropagation();finish();}
  else if(event.code==='Tab'){event.stopPropagation();g.trapOverlayFocus(event);}
  else if(!event.altKey&&!event.ctrlKey&&!event.metaKey&&['ArrowRight','ArrowLeft'].includes(event.code)){
   event.preventDefault();event.stopPropagation();if(!event.repeat)(event.code==='ArrowRight'?next:previous)();
  }
  else if(!event.altKey&&!event.ctrlKey&&!event.metaKey&&['PageDown','PageUp','Home','End'].includes(event.code)){
   // The footer stays reachable on small screens; its focused buttons must still
   // allow keyboard users to read the independently scrolling story.
   event.preventDefault();event.stopPropagation();
   if(event.code==='Home')copy.scrollTop=0;
   else if(event.code==='End')copy.scrollTop=copy.scrollHeight;
   else copy.scrollTop+=(event.code==='PageDown'?1:-1)*Math.max(80,(copy.clientHeight||g.height||400)*.8);
  }
 });
 const api=Object.freeze({replay:()=>open(true),next,previous,skip:finish,refresh,isOpen:()=>opened,view:()=>({open:opened,index,total:SHOTS.length,replay:modeReplay,scenario:scenarioId}),element:overlay});g.campaignIntro132=api;return api;
}
const api=Object.freeze({install,SHOTS});root.DeadwallCampaignIntro132=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;else if(root.DEADWALL&&root.document)install(root.DEADWALL,root.document);
})(globalThis);
