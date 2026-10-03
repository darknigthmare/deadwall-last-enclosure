/* D-17 keeps simulating during travel. This warning is advisory, never a safety certificate. */
(function(root){
 'use strict';
 const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore,R=C.DepartureRules;
 const live=e=>Boolean(e&&!e.dead&&e.health>0);
 function assess(g){
  const core=g.core(),buildings=[...g.world.buildings.values()];
  const fittings=new Map((g.fortificationPack?.snapshot().fittings||[]).map(f=>[f.id,f.ammo]));
  const shared=cost=>g.resources.ammo>=cost&&(!g.citadel||g.citadel.canFire(cost));
  const assigned=u=>g.citadel?.isEscort(u.id)||['expeditions','salvage','infrastructure','siege','territories'].some(name=>g[name]?.isAssigned?.(u.id));
  const soldiers=g.units.filter(u=>u.kind==='soldier'&&live(u)&&!u.regionAbsent&&!assigned(u));
  let armedPosts=0,localPosts=0,unpowered=0,emptyPosts=0,unfinished=0;
  for(const b of buildings){
   if(!live(b)||!b.def.range)continue;
   if(!b.completed){unfinished++;continue;}
   if(!b.powered||b.siegeOffline||b.territoryOffline||b.gridOffline||b.dayOffline){unpowered++;continue;}
   const cost=b.def.ammoPerShot||1;
   if(shared(cost))armedPosts++;
   else if((fittings.get(b.id)||0)>=cost){armedPosts++;localPosts++;}
   else emptyPosts++;
  }
  const armedSoldiers=shared(1)?soldiers.length:0,noFire=armedPosts+armedSoldiers===0;
  const coreRatio=live(core)?Math.max(0,Math.min(1,core.health/core.maxHealth)):0;
  const clock=g.phase==='calm'?'Crépuscule dans '+C.formatTime(Math.max(0,g.phaseTime)):g.phase==='warning'?'Assaut dans '+C.formatTime(Math.max(0,g.phaseTime)):g.phase==='assault'?'Assaut en cours':'Sécurisation en cours';
  const reasons=[];
  if(noFire)reasons.push('Aucun poste ni fusilier ne peut actuellement assurer le tir.');
  else reasons.push(armedPosts+' poste'+(armedPosts>1?'s':'')+' et '+armedSoldiers+' fusilier'+(armedSoldiers>1?'s':'')+' capables de tirer actuellement ; leur couverture reste à vérifier.');
  if(unpowered)reasons.push(unpowered+' poste'+(unpowered>1?'s':'')+' hors service ou sans alimentation.');
  if(emptyPosts||soldiers.length&&!armedSoldiers)reasons.push(g.resources.ammo>=1?'La réserve protégée limite les tirs automatiques.':'Munitions communes épuisées.');
  if(unfinished)reasons.push(unfinished+' défense'+(unfinished>1?'s':'')+' encore en chantier.');
  if(localPosts)reasons.push('Les caissons locaux sont limités et ne se rechargent pas seuls.');
  if(coreRatio<=R.criticalCoreRatio)reasons.push('Centre gravement endommagé.');
  if(g.nightwatch?.forecast())reasons.push('Nuit noire annoncée : vérifiez les projecteurs.');
  const urgent=g.phase==='assault'||g.phase==='warning'||noFire||coreRatio<=R.criticalCoreRatio;
  return{phase:g.phase,wave:g.wave,clock,armedPosts,armedSoldiers,localPosts,unpowered,emptyPosts,unfinished,noFire,coreRatio,
   tone:urgent?'danger':'warning',title:noFire?'D-17 dépend encore de vous':'D-17 continue sans vous',detail:reasons.join(' '),
   advice:g.phase==='assault'?'Le bastion est attaqué. Votre absence peut entraîner sa chute.':g.phase==='aftermath'?'Le bastion termine la sécurisation. Réparez et ravitaillez avant la prochaine nuit.':'Le bastion peut tomber si vous êtes absent lors de l’assaut nocturne. Préparez ses défenses et prévoyez votre retour.'};
 }
 function install(g,doc=root.document){
  if(g.departure130)return g.departure130;
  let world=g.world,episode=false,notice=null,until=0,lastRefresh=-Infinity,phaseKey='',awaySeen=false;
  const running=()=>g.state==='playing'&&!g.gameOver&&!g.paused&&!g.activeOverlay&&live(g.player);
  const distance=()=>Math.min(g.player.x,g.player.y,C.WORLD_SIZE-g.player.x,C.WORLD_SIZE-g.player.y);
  let box=null,title=null,detail=null,advice=null,clock=null,announcement=null;
  if(doc&&g.ui.hud){
   const el=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
   box=el('aside');box.id='departureWarning130';box.className='departure130 hidden';box.classList.add('departure130','hidden');box.setAttribute('aria-label','Prévention avant de quitter D-17');
   title=el('strong');
   announcement=el('span');announcement.className='departure130-announcement';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');announcement.setAttribute('aria-atomic','true');
   clock=el('span');clock.className='departure130-clock';clock.setAttribute('aria-live','off');
   advice=el('p');detail=el('small');box.appendChild(title);box.appendChild(clock);box.appendChild(advice);box.appendChild(detail);box.appendChild(announcement);g.ui.hud.appendChild(box);
  }
  const reset=()=>{world=g.world;episode=false;notice=null;until=0;lastRefresh=-Infinity;phaseKey='';awaySeen=false;box?.classList.add('hidden');};
  const ensure=()=>{if(world!==g.world)reset();};
  function refresh(force=false){
   ensure();if(!box)return;
   const visible=Boolean(notice&&g.state==='playing'&&!g.gameOver&&!g.activeOverlay&&live(g.player)&&g.elapsed<until);
   box.classList.toggle('hidden',!visible);if(!visible)return;
   if(!force&&g.elapsed-lastRefresh<R.refreshSeconds)return;
   lastRefresh=g.elapsed;notice=assess(g);box.dataset.tone=notice.tone;
   const set=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
   set(title,notice.title);set(clock,notice.clock+' · vague '+g.wave);set(advice,notice.advice);set(detail,notice.detail);
  }
  function show(){
   notice=assess(g);until=g.elapsed+R.displaySeconds;lastRefresh=-Infinity;phaseKey=g.wave+':'+g.phase;
   // One complete announcement per departure/phase, independent of the ticking clock.
   const message=notice.title+'. '+notice.clock+'. '+notice.advice+' '+notice.detail;
   if(announcement)announcement.textContent=message;
   else g.notify(message,notice.tone==='danger'?'danger':'normal');
   refresh(true);
  }
  function beforeExit(){
   ensure();if(!live(g.player)||g.gameOver)return;
   if(!episode){episode=true;show();}else{until=Math.max(until,g.elapsed+R.displaySeconds);refresh(true);}
  }
  function approach(){
   ensure();if(!running())return;
   const away=!!g.frontier?.active();
   if(away){
    if(!awaySeen){awaySeen=true;if(!episode){episode=true;show();}}
    const current=g.wave+':'+g.phase;
    if(current!==phaseKey&&['warning','assault'].includes(g.phase))show();
   }else{
    awaySeen=false;
    if(distance()>R.rearmDistance){episode=false;notice=null;until=0;}
    if(!episode&&distance()<R.approachDistance){
     const p=g.player,k=g.input.keys,side=[
      ['east',C.WORLD_SIZE-p.x,['KeyD','ArrowRight']],['west',p.x,['KeyA','KeyQ','ArrowLeft']],
      ['north',p.y,['KeyW','KeyZ','ArrowUp']],['south',C.WORLD_SIZE-p.y,['KeyS','ArrowDown']]
     ].find(([,d,keys])=>d<R.approachDistance&&keys.some(key=>k.has(key)))?.[0];
     const legacyOK=side&&(g.frontier?.position().generation>=4||(side==='east'||side==='west'?Math.abs(p.y-C.WORLD_SIZE/2):Math.abs(p.x-C.WORLD_SIZE/2))<=66);
     if(legacyOK){episode=true;show();}
    }
   }
   refresh();
  }
  const oldUI=g.updateUI.bind(g);g.updateUI=(...args)=>{const r=oldUI(...args);refresh();return r;};
  const api={assess:()=>assess(g),approach,beforeExit,refresh,status:()=>({visible:!!notice&&g.elapsed<until,episode,until,notice:notice?{...notice}:null}),reset};
  g.departure130=Object.freeze(api);return g.departure130;
 }
 const api={assess,install};root.DeadwallDeparture130=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL)install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this);
