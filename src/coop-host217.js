// Coopération hôte/invités, côté hôte (specs/cooperation, tranches C3, C4 et C5 ; décisions D1–D7 du 23 novembre 2026).
// L'hôte reste la seule simulation. Ce module ouvre une session sur le relais 217, reçoit les intentions des invités
// assis (src/coop-session217.js), les applique au début de chaque pas de `g.update`, fait vivre un avatar de
// responsable de district par invité dans la cité de l'hôte et renvoie à chacun une image bornée autour de lui.
// - D4 : l'avatar n'est pas sauvegardé ; il apparaît au dépôt ; son chargeur, pris dans le stock de l'hôte, est
//   rendu au dépôt à son départ, à sa mort, et compté dans le stock de chaque sauvegarde (aucune clé ajoutée).
// - D5-A : un invité se déplace, vise, tire, signale et désigne le district qu'il tient ; rien d'autre.
// - D3-A : tant qu'un invité est assis, ni la pause ni un dossier ne gèlent `update` ; onglet caché : pas réduits
//   par minuterie, puis fermeture annoncée de la session. Hors session, rien ne change : la pause solo est intacte.
// Sans session ouverte, chaque enveloppe appelle l'original et rend son résultat tel quel (solo identique au bit près).
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCoopHost217=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{try{if(root.DEADWALL)api.install(root.DEADWALL,root.document);}catch(error){/* la coopération est facultative : elle ne bloque jamais le jeu */}},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const lib=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=lib('DeadwallCore','./core.js'),S=lib('DeadwallCoopSession217','./coop-session217.js');
 const R=C.CoopPlay217Rules,P=S.PROTOCOL,TILE=C.TILE,ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const finite=Number.isFinite,clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),round=v=>Math.round(v);
 const bytes=text=>typeof root.TextEncoder==='function'?new root.TextEncoder().encode(text).length:text.length*3;
 const REASONS=Object.freeze({taken:'Ce code est déjà ouvert sur le relais.',invalid:'Le relais a refusé la demande.',absent:'Hôte absent.'});
 // Code de salle : tirage hors simulation (crypto du navigateur), jamais `Math.random` ni le flux du jeu.
 function makeCode(length=8){
  const out=new Uint8Array(length),crypto=root.crypto;
  if(crypto?.getRandomValues)crypto.getRandomValues(out);else for(let i=0;i<length;i++)out[i]=(Date.now()>>>(i*3))+i*37;
  return Array.from(out,v=>ALPHABET[v%ALPHABET.length]).join('');
 }

 function install(g,doc){
  if(!g||g.coopHost217||!C||!S||typeof g.update!=='function')return false;
  const A=R.avatar,F=R.frame;
  let session=null,link=null,code='',status='idle',notice='',tick=0,frameClock=0,hiddenSince=null,lastWall=0,timer=null;
  const peers=new Map(),avatars=new Map(),pings=[];
  const playing=()=>g.state==='playing'&&!g.gameOver;
  // Prédicat unique du temps continu (C5) : une session ouverte et au moins un invité assis.
  const live=()=>Boolean(session)&&avatars.size>0&&playing();
  const tell=(text,tone='normal')=>{try{g.notify?.(text,tone);}catch(error){/* note facultative */}};
  const core=()=>{try{return g.core?.()||null;}catch(error){return null;}};
  const send=message=>{try{link?.send(message);}catch(error){/* le relais retire seul un socket cassé */}};
  const sendTo=(peer,message)=>send({type:'send',protocol:P,peer,message});
  const wall=()=>root.performance?.now?.()??Date.now();

  // ---- Avatar de responsable de district (C4) : acteur de session, jamais dans `g.units` hors du pas des infectés.
  function depot(av){
   const c=core();if(!c)return{x:g.player?.x||0,y:g.player?.y||0};
   const preferred={x:c.x+80+av.seat*26,y:c.y+30};
   try{return g.coreArrivalPosition?.(av,preferred)||preferred;}catch(error){return{x:c.x,y:c.y};}
  }
  // Le chargeur est pris dans le stock de l'hôte : au plus ce qui manque, au plus ce qui reste.
  function draw(av){const take=Math.max(0,Math.min(A.magazine-av.carry.ammo,Math.floor(Number(g.resources?.ammo)||0)));if(take>0){g.resources.ammo-=take;av.carry.ammo+=take;}return take;}
  // Rendre le sac au dépôt : mêmes bornes que le dépôt du Commandant (capacité de stockage), rien n'est dupliqué.
  function pour(av){
   let moved=0;
   for(const key of C.RESOURCE_KEYS){const have=Number(av.carry[key])||0;if(!(have>0))continue;const room=Math.max(0,(Number(g.storage)||0)-(Number(g.resources[key])||0)),put=Math.min(room,have);g.resources[key]+=put;moved+=put;av.carry[key]=0;}
   return moved;
  }
  function spawn(av){const at=depot(av);Object.assign(av,{x:at.x,y:at.y,dead:false,health:av.maxHealth,respawn:0,invulnerable:A.invulnerable,reload:0,fireCooldown:0});draw(av);}
  function avatar(seat,name,role){
   const av={id:-seat,seat,name,role,kind:'guest217',guest217:true,x:0,y:0,radius:A.radius,health:A.health,maxHealth:A.health,dead:false,facing:0,
    move:{x:0,y:0},fire:false,fireCooldown:0,reload:0,respawn:0,invulnerable:0,district:null,regionAbsent:false,supportActive:false,state:'guard',carry:C.makeBag(),kills:0};
   spawn(av);return av;
  }
  function remove(seat,why){
   const av=avatars.get(seat);if(!av)return;
   avatars.delete(seat);av.dead=true;pour(av);
   for(const z of g.zombies||[])if(z.prey===av)z.prey=null;
   if(why)tell(av.name+' '+why);
  }
  function hurt(av,amount){
   if(av.dead||av.invulnerable>0||!(amount>0))return;
   av.health=Math.max(0,av.health-amount);
   if(av.health<=0){av.dead=true;av.respawn=A.respawnSeconds;av.fire=false;pour(av);tell(av.name+' est à terre : retour au dépôt dans '+A.respawnSeconds+' s.','danger');}
  }
  function stepAvatar(av,dt){
   av.invulnerable=Math.max(0,av.invulnerable-dt);av.fireCooldown=Math.max(0,av.fireCooldown-dt);
   if(av.dead){av.respawn=Math.max(0,av.respawn-dt);if(av.respawn<=0)spawn(av);return;}
   if(av.reload>0){av.reload-=dt;if(av.reload<=0){av.reload=0;draw(av);}}
   const speed=A.speed,mx=av.move.x,my=av.move.y;
   if(mx||my)g.moveFriendly(av,mx*speed*dt,my*speed*dt);
   if(!av.fire||av.reload>0||av.fireCooldown>0)return;
   if(av.carry.ammo<1){if((Number(g.resources.ammo)||0)>=1)av.reload=A.reload;return;}
   av.carry.ammo-=1;av.fireCooldown=1/A.fireRate;
   const angle=av.facing+g.random.range(-A.spread,A.spread);
   g.fireFriendly(av.x,av.y,angle,A.damage,A.range,'#cfe3b0');
   if(av.carry.ammo<1&&(Number(g.resources.ammo)||0)>=1)av.reload=A.reload;
  }
  function districtName(id){
   if(id===null)return null;const rank=Number(String(id).split(':')[1]);
   try{return (g.districts?.list?.()||[]).find(d=>d.rank===rank)?.name||null;}catch(error){return null;}
  }
  // Intentions rendues par `step()` dans l'ordre (siège, numéro) : appliquées avant tout le reste du pas.
  function apply(intents){
   for(const it of intents){
    const av=avatars.get(it.seat);if(!av)continue;
    if(it.kind==='move')av.move={x:it.data.x,y:it.data.y};
    else if(it.kind==='aim')av.facing=Math.atan2(Math.sin(it.data.a),Math.cos(it.data.a));
    else if(it.kind==='fire')av.fire=it.data.on;
    else if(it.kind==='ping'){
     const size=g.local?.size||C.LOCAL_MAP217?.size||4096,last=pings.filter(p=>p.seat===av.seat).at(-1);
     if(last&&g.elapsed-last.at<F.pingGap)continue;
     pings.push({seat:av.seat,x:clamp(it.data.x,0,size),y:clamp(it.data.y,0,size),at:g.elapsed});while(pings.length>F.maxPings)pings.shift();
     tell('Signal de '+av.name+'.');
    }else if(it.kind==='hold'){
     const name=districtName(it.data.district);av.district=name?it.data.district:null;
     tell(name?av.name+' tient : '+name.toLowerCase()+'.':av.name+' ne tient plus de district.');
    }
   }
  }

  // ---- Image bornée (D7) : sélection par `shareView`, puis forme compacte ; ni référence ni écriture.
  function viewFor(av){
   const reach=F.radius+4*TILE,near=[],zombies=[];
   for(const b of g.world.buildings.values())if(!b.dead&&Math.hypot(b.x-av.x,b.y-av.y)<=reach)near.push({id:b.id,type:b.type,gx:b.gx,gy:b.gy,health:b.health});
   const realZ=new Map();for(const z of g.zombies)if(!z.dead){zombies.push({id:z.id,kind:z.kind,x:z.x,y:z.y,health:z.health});realZ.set(z.id,z);}
   const base=S.shareView({wave:g.wave,phase:g.phase,phaseTime:g.phaseTime,resources:g.resources,buildings:near,zombies},av,{radius:F.radius});
   const types=[],kinds=[],code=(list,v)=>{let i=list.indexOf(v);if(i<0){i=list.length;list.push(v);}return i;};
   const T=root.DeadwallTactics||null;
   let b=base.buildings.slice(0,F.maxBuildings).map(x=>{const real=g.world.buildings.get(x.id),d=real?.def||{};
    const flags=(d.wall?1:0)|(d.gate?2:0)|(T?.openGate?.(real)?4:0)|(real&&!real.completed?8:0)|(x.type==='core'?16:0);
    // C6.2 (v2) : rotation et révision de géométrie, lues par les peintres 2,5D et FPS de l'invité.
    return[x.id,code(types,x.type),x.gx,x.gy,real?.w||1,real?.h||1,real?.maxHealth>0?round(clamp(real.health/real.maxHealth,0,1)*100):100,flags,round(real?.corpseLoad||0),real?.rotation||0,real?.geometryVersion202||0];});
   let z=base.zombies.slice(0,F.maxZombies).map(x=>{const q=realZ.get(x.id);return[x.id,code(kinds,x.kind),round(x.x),round(x.y),round((q?.facing||0)*100),q?.maxHealth>0?round(clamp(q.health/q.maxHealth,0,1)*100):100];});
   // C6.2 : équipe de la cité (ouvriers, soldats) et étages de citadelle du rayon, pour les mêmes peintres.
   const V2=C.CoopViews217Rules?.frame,ukinds=[],u=[];
   for(const q of g.units||[]){if(!V2||u.length>=V2.maxUnits)break;if(q.dead||q.guest217||q.regionAbsent||Math.hypot(q.x-av.x,q.y-av.y)>F.radius)continue;u.push([q.id,code(ukinds,q.kind),round(q.x),round(q.y),round((q.facing||0)*100),q.maxHealth>0?round(clamp(q.health/q.maxHealth,0,1)*100):100]);}
   const decks=[],shownB=new Set(base.buildings.map(x=>x.id));
   if(V2)try{for(const box of g.vertical175?.geometry?.()||[]){if(decks.length>=V2.maxDecks)break;if(box.type==='structure'||!shownB.has(box.owner))continue;decks.push([box.owner,...[box.x,box.y,box.z,box.w,box.h,box.d].map(n=>Math.round(n*10)/10),box.type==='deck'?0:1]);}}catch(error){decks.length=0;}
   // Masses au-delà du rayon : comptes par carreau, sans position individuelle.
   const cells=new Map(),shown=new Set(z.map(x=>x[0]));
   for(const q of zombies){if(shown.has(q.id))continue;const key=Math.floor(q.x/F.massCell)+':'+Math.floor(q.y/F.massCell);const c=cells.get(key)||{n:0,x:0,y:0};c.n++;c.x+=q.x;c.y+=q.y;cells.set(key,c);}
   const masses=[...cells.values()].sort((a,b)=>b.n-a.n||a.x-b.x).slice(0,F.maxMasses).map(c=>[round(c.x/c.n),round(c.y/c.n),c.n]);
   const shots=[];for(const p of g.projectiles||[]){if(p.dead||shots.length>=F.maxShots)continue;if(Math.hypot(p.x-av.x,p.y-av.y)<=F.radius)shots.push([round(p.x),round(p.y),round(p.vx/10),round(p.vy/10)]);}
   const mates=[...avatars.values()].filter(o=>o!==av).map(o=>[o.seat,o.name,round(o.x),round(o.y),+o.facing.toFixed(2),o.dead?1:0]);
   const p=g.player;
   let districts=[];try{districts=(g.districts?.list?.()||[]).slice(0,S.RULES.view.maxDistricts).map(d=>['ring:'+d.rank,String(d.name).slice(0,32),d.closed?1:0,d.infected?1:0]);}catch(error){districts=[];}
   const view={v:V2?2:1,wave:base.wave,phase:base.phase,phaseTime:base.phaseTime,night:+(1-(g.daylight?.()??1)).toFixed(2),size:g.local?.size||0,radius:base.radius,
    ammo:Math.floor(Number(g.resources.ammo)||0),hidden:zombies.length-z.length,types,kinds,b,z,masses,shots,mates,
    host:{x:round(p.x),y:round(p.y),a:+(p.facing||0).toFixed(2),away:p.regionAbsent?1:0,dead:p.dead?1:0,dossier:g.paused||g.activeOverlay?1:0},
    self:{x:+av.x.toFixed(1),y:+av.y.toFixed(1),a:+av.facing.toFixed(2),hp:round(av.health),max:av.maxHealth,dead:av.dead?1:0,respawn:+av.respawn.toFixed(1),mag:av.carry.ammo,reload:+av.reload.toFixed(1),district:av.district,speed:A.speed},
    pings:pings.filter(q=>g.elapsed-q.at<F.pingSeconds).map(q=>[q.seat,round(q.x),round(q.y),+(g.elapsed-q.at).toFixed(1)]),districts};
   if(V2)Object.assign(view,{seed:Number(g.world.seed)>>>0,e:+(Number(g.elapsed)||0).toFixed(2),w:+(Number(g.weather)||0).toFixed(2),ukinds,u,decks});
   // Budget du relais (octets) : on retire d'abord les bâtiments, puis les corps les plus lointains.
   let text=JSON.stringify(view);
   while(bytes(text)>R.relay.hostChars-400&&(view.b.length>16||view.z.length>16||view.u?.length||view.decks?.length)){
    if(view.decks?.length)view.decks=view.decks.slice(0,Math.floor(view.decks.length*.5));else if(view.u?.length)view.u=view.u.slice(0,Math.floor(view.u.length*.5));
    else if(view.b.length>16)view.b=view.b.slice(0,Math.ceil(view.b.length*.7));else{const cut=view.z.length-Math.ceil(view.z.length*.7);view.z=view.z.slice(0,view.z.length-cut);view.hidden+=cut;}
    text=JSON.stringify(view);
   }
   return view;
  }
  function sendFrames(){
   for(const [peer,seat] of peers){const av=avatars.get(seat);if(!av)continue;const frame=session.frame(seat,viewFor(av));if(frame)sendTo(peer,frame);}
  }

  // ---- Messages du relais.
  function receive(message){
   if(!message||typeof message!=='object'||message.protocol!==P||!session)return false;
   if(message.type==='hosting'&&message.code===code){status='open';notice='Cité ouverte : code '+code+'.';return true;}
   if(message.type==='refused'&&status==='opening'){const why=REASONS[message.reason]||REASONS.invalid;stop(false);status='error';notice=why;return true;}
   if(message.type==='gone'&&peers.has(message.peer)){const seat=peers.get(message.peer);peers.delete(message.peer);remove(seat,'a quitté la cité.');session.leave(seat);return true;}
   if(message.type!=='relay'||!Number.isSafeInteger(message.peer)||!message.message)return false;
   const m=message.message,peer=message.peer;
   if(m.type==='hello'){
    if(peers.has(peer))return false;
    if(!playing()){sendTo(peer,{type:'refused',protocol:P,reason:'closed'});send({type:'drop',protocol:P,peer});return false;}
    const r=session.admit(m);
    // D1 : le chef de sortie (seconde bulle régionale) est la tranche C7, pas encore livrée.
    if(r.ok&&r.reply.role==='sortie'){session.leave(r.seat);sendTo(peer,{type:'refused',protocol:P,reason:'role'});send({type:'drop',protocol:P,peer});return false;}
    if(!r.ok){sendTo(peer,r.reply);send({type:'drop',protocol:P,peer});return false;}
    peers.set(peer,r.seat);const av=avatar(r.seat,r.reply.name,r.reply.role);avatars.set(r.seat,av);
    sendTo(peer,r.reply);tell(av.name+' a rejoint la cité : responsable de district. Le temps ne s’arrête plus.','good');
    frameClock=1;return true;
   }
   if(m.type==='intent'&&peers.has(peer))return session.receive(peers.get(peer),m).ok;
   return false;
  }
  function open(options={}){
   if(session||!playing())return{ok:false,reason:playing()?'Une session est déjà ouverte.':'Ouvrez d’abord une partie.'};
   const wanted=typeof options.code==='string'&&options.code?options.code.toUpperCase():makeCode();
   try{session=S.createHost({code:wanted});}catch(error){return{ok:false,reason:error.message};}
   code=wanted;tick=0;frameClock=0;status='opening';notice='Ouverture de la cité…';pings.length=0;hiddenSince=null;lastWall=wall();
   if(options.link){link=options.link;}
   else{
    const url=String(options.url||'');
    if(!/^wss?:\/\/[^\s]+$/.test(url)||typeof root.WebSocket!=='function'){session=null;status='error';notice='Adresse de relais invalide (ws:// ou wss://).';return{ok:false,reason:notice};}
    let socket;try{socket=new root.WebSocket(url);}catch(error){session=null;status='error';notice='Relais injoignable.';return{ok:false,reason:notice};}
    const current=socket;
    link={socket,send:m=>{if(socket.readyState===1)socket.send(JSON.stringify(m));},close:()=>{try{socket.close();}catch(error){}}};
    socket.onopen=()=>{if(link&&session)link.send({type:'host',protocol:P,code});};
    socket.onmessage=event=>{let m=null;try{m=JSON.parse(String(event.data));}catch(error){return;}receive(m);};
    socket.onclose=()=>{if(session&&link&&link.socket===current)stop(false,'Relais perdu : la cité n’est plus ouverte.');};
   }
   if(options.link)send({type:'host',protocol:P,code});
   if(!timer&&typeof root.setInterval==='function'){timer=root.setInterval(watch,R.clock.checkMs);timer?.unref?.();}
   return{ok:true,code};
  }
  // Fermer : chaque invité reçoit `closed`, chaque avatar rend son sac au dépôt, puis le relais libère le code.
  function stop(announce=true,why=''){
   if(!session)return false;
   const notices=session.close();
   for(const n of notices){const peer=[...peers].find(([,seat])=>seat===n.seat)?.[0];if(peer!==undefined)sendTo(peer,n.message);}
   for(const seat of [...avatars.keys()])remove(seat);
   peers.clear();pings.length=0;
   if(announce)send({type:'unhost',protocol:P});
   const l=link;link=null;session=null;status='idle';notice=why||'Cité fermée.';
   try{l?.close?.();}catch(error){}
   if(timer){root.clearInterval?.(timer);timer=null;}
   if(why)tell(why,'danger');
   return true;
  }
  // Minuterie de session : partie quittée, onglet caché (pas réduits, puis fermeture annoncée).
  function watch(){
   if(!session)return;
   if(!playing()){stop(true,'Campagne de l’hôte fermée : la session est terminée.');return;}
   const hidden=Boolean(doc?.hidden||doc?.visibilityState==='hidden'),now=wall();
   if(!hidden||!live()){hiddenSince=null;lastWall=now;return;}
   if(hiddenSince===null)hiddenSince=now;
   if(now-hiddenSince>R.clock.hiddenGraceSeconds*1000){stop(true,'Onglet de l’hôte caché trop longtemps : la session a été interrompue proprement.');return;}
   const seconds=Math.min(R.clock.hiddenMaxSeconds,Math.max(0,(now-lastWall)/1000));lastWall=now;
   const rules=C.SIMULATION_RULES,steps=Math.min(rules.maxSteps,Math.ceil(seconds/rules.maxStepSeconds));
   for(let i=0;i<steps&&live();i++)g.update(seconds/steps);
  }

  // ---- Enveloppes. Sans session : appel direct de l'original, résultat rendu tel quel.
  const update=g.update;
  g.update=function(dt,...rest){
   if(!session)return update.call(this,dt,...rest);
   if(!live())return update.call(this,dt,...rest);
   tick+=1;apply(session.step(tick));
   // D3-A : le pas avance malgré une pause ou un dossier ouvert ; un dossier ouvert pendant le pas reste ouvert.
   const paused=this.paused,overlay=this.activeOverlay;this.paused=false;this.activeOverlay=null;
   let result;
   try{result=update.call(this,dt,...rest);}
   finally{if(this.paused===false)this.paused=paused;if(this.activeOverlay===null)this.activeOverlay=overlay;}
   if(session&&finite(dt)&&dt>0){frameClock+=dt;if(frameClock>=1/F.hz){frameClock=0;sendFrames();}}
   return result;
  };
  const units=g.updateUnits;
  if(typeof units==='function')g.updateUnits=function(dt,...rest){const result=units.call(this,dt,...rest);if(live()&&finite(dt)&&dt>0)for(const av of avatars.values())stepAvatar(av,dt);return result;};
  // Les infectés voient les avatars comme des défenseurs : ils sont ajoutés à `units` le temps de ce seul pas.
  const zombies=g.updateZombies;
  if(typeof zombies==='function')g.updateZombies=function(...args){
   if(!live())return zombies.apply(this,args);
   const present=[...avatars.values()].filter(av=>!av.dead);
   if(!present.length)return zombies.apply(this,args);
   this.units.push(...present);
   try{return zombies.apply(this,args);}
   finally{for(const av of present){const i=this.units.indexOf(av);if(i>=0)this.units.splice(i,1);}}
  };
  const damageUnit=g.damageUnit;
  if(typeof damageUnit==='function')g.damageUnit=function(unit,...args){if(unit?.guest217){hurt(unit,args[0]);return;}return damageUnit.call(this,unit,...args);};
  // D4 : la sauvegarde compte le chargeur des avatars dans le stock du dépôt, sans clé nouvelle ni écriture dans la partie.
  const serialize=g.serialize;
  if(typeof serialize==='function')g.serialize=function(...args){
   const data=serialize.apply(this,args);
   if(!session||!avatars.size||!data||typeof data!=='object'||!data.resources)return data;
   // Une sauvegarde déclenchée pendant le pas des infectés (avatars prêtés à `units`) ne garde jamais un avatar (D4).
   const units=Array.isArray(data.units)?data.units.filter(u=>u?.kind!=='guest217'):data.units;
   const resources={...data.resources};
   for(const key of C.RESOURCE_KEYS){let extra=0;for(const av of avatars.values())extra+=Number(av.carry[key])||0;if(extra>0)resources[key]=Math.min(Math.max(Number(this.storage)||0,resources[key]),resources[key]+extra);}
   return{...data,resources,...(Array.isArray(data.units)?{units}:{})};
  };
  const closing='Campagne de l’hôte fermée : la session est terminée.';
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){if(session)stop(true,closing);return old.apply(this,args);};}
  const menu=g.returnToMenu;
  if(typeof menu==='function')g.returnToMenu=function(...args){const result=menu.apply(this,args);if(session&&!playing())stop(true,closing);return result;};
  // Présentation chez l'hôte : avatars et signaux dessinés au-dessus de la nuit (lecture seule).
  const night=g.drawNight;
  if(typeof night==='function')g.drawNight=function(...args){
   const result=night.apply(this,args),ctx=args[0];
   if(!session||!avatars.size||!ctx||typeof ctx.save!=='function'||!g.camera||g.player?.regionAbsent)return result;
   ctx.save();
   try{
    const zoom=Number(g.camera.zoom)||1;ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
    for(const q of pings){const age=g.elapsed-q.at;if(age>F.pingSeconds)continue;ctx.globalAlpha=clamp(1-age/F.pingSeconds,0,1);ctx.strokeStyle='#e7c86a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,14+age*6%28,0,Math.PI*2);ctx.stroke();}
    ctx.globalAlpha=1;
    for(const av of avatars.values()){
     if(av.dead)continue;ctx.fillStyle='#8fc7d8';ctx.strokeStyle='#0d1a1e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(av.x,av.y,av.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
     ctx.strokeStyle='#dff3f7';ctx.beginPath();ctx.moveTo(av.x,av.y);ctx.lineTo(av.x+Math.cos(av.facing)*20,av.y+Math.sin(av.facing)*20);ctx.stroke();
     if(typeof ctx.fillText==='function'){ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#dff3f7';ctx.fillText(av.name,av.x,av.y-av.radius-8);}
    }
   }catch(error){/* affichage facultatif */}finally{ctx.restore();}
   return result;
  };
  function overview(){
   return Object.freeze({status,notice,code,live:live(),tick,guests:[...avatars.values()].sort((a,b)=>a.seat-b.seat).map(av=>Object.freeze({seat:av.seat,name:av.name,role:av.role,dead:av.dead,health:round(av.health),district:av.district,districtName:districtName(av.district),ammo:av.carry.ammo}))});
  }
  g.coopHost217=Object.freeze({open,close:()=>stop(true),receive,live,overview,avatars:()=>[...avatars.values()].map(av=>({...av,move:{...av.move},carry:{...av.carry}})),view:seat=>avatars.has(seat)?viewFor(avatars.get(seat)):null,watch,code:()=>code});
  return true;
 }
 return Object.freeze({install,makeCode});
});
