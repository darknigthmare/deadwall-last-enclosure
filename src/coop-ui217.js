// Coopération hôte/invités : interface et client invité (specs/cooperation, tranches C3 et C6 partielle ; D1–D7).
// - Hôte : dans le menu de pause, « OUVRIR MA CITÉ » donne un code de salle (src/coop-host217.js) ; un bandeau
//   rappelle le code, les invités assis et que le temps ne s'arrête plus.
// - Invité : dans le menu principal, « REJOINDRE UNE CITÉ » (adresse du relais, code, nom, rôle). Une fois assis,
//   l'invité ne lance aucune partie : il ne fait que dessiner les images reçues et envoyer des intentions.
// Présentation seulement : ce module ne crée ni stock, ni dégât, ni tirage de simulation, ni horloge de jeu. Son
// `requestAnimationFrame` ne sert qu'à peindre ; l'interpolation et la prédiction de l'avatar sont d'affichage.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCoopUI217=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{try{if(root.DEADWALL)api.install(root.DEADWALL,root.document);}catch(error){/* interface facultative */}},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const lib=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=lib('DeadwallCore','./core.js'),S=lib('DeadwallCoopSession217','./coop-session217.js');
 const TILE=C?.TILE||32,F=C?.CoopPlay217Rules?.frame,clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),lerp=(a,b,t)=>a+(b-a)*t;
 const REFUSED=Object.freeze({code:'Code de salle incorrect.',full:'La cité est complète (trois invités).',closed:'La campagne de l’hôte n’est pas ouverte.',invalid:'Demande refusée : vérifiez le code (6 à 12 lettres majuscules ou chiffres).',absent:'Aucune cité ouverte avec ce code sur ce relais.',role:'Rôle pas encore disponible : choisissez responsable de district.'});
 const PHASES=Object.freeze({calm:'Calme',warning:'Alerte',assault:'Assaut'});
 const KEYS=Object.freeze({up:['KeyW','KeyZ','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyA','KeyQ','ArrowLeft'],right:['KeyD','ArrowRight']});

 // Mouvement unitaire à partir des touches tenues : la seule « vitesse » qu'un invité peut envoyer.
 function moveOf(keys){
  const has=list=>list.some(k=>keys.has(k));
  let x=(has(KEYS.right)?1:0)-(has(KEYS.left)?1:0),y=(has(KEYS.down)?1:0)-(has(KEYS.up)?1:0);const l=Math.hypot(x,y);
  if(l){x/=l;y/=l;}return{x:+x.toFixed(4),y:+y.toFixed(4)};
 }
 // Lecture d'une image compacte (src/coop-host217.js) en objets d'affichage. Ne modifie pas l'image.
 function decode(view){
  if(!view||typeof view!=='object')return null;
  const types=Array.isArray(view.types)?view.types:[],kinds=Array.isArray(view.kinds)?view.kinds:[];
  const buildings=(Array.isArray(view.b)?view.b:[]).filter(Array.isArray).map(b=>({id:b[0],type:String(types[b[1]]??''),gx:+b[2]||0,gy:+b[3]||0,w:+b[4]||1,h:+b[5]||1,hp:+b[6]||0,flags:+b[7]||0,corpses:+b[8]||0}));
  const zombies=(Array.isArray(view.z)?view.z:[]).filter(Array.isArray).map(z=>({id:z[0],kind:String(kinds[z[1]]??'walker'),x:+z[2]||0,y:+z[3]||0}));
  return{...view,buildings,zombies};
 }
 // Position d'affichage d'un corps entre deux images (interpolation), sans rien écrire.
 function blend(prev,cur,t){
  if(!prev)return cur.zombies;const before=new Map(prev.zombies.map(z=>[z.id,z]));
  return cur.zombies.map(z=>{const p=before.get(z.id);return p?{...z,x:lerp(p.x,z.x,t),y:lerp(p.y,z.y,t)}:z;});
 }
 // Peintre de l'invité : vue de dessus centrée sur son avatar. `state` : {prev, cur, t, self, mouse, width, height}.
 function paint(ctx,state){
  const cur=state?.cur;if(!ctx||!cur)return false;
  const W=state.width,H=state.height,self=state.self||cur.self,zoom=state.zoom||1;
  ctx.save();
  ctx.fillStyle='#161b17';ctx.fillRect(0,0,W,H);
  ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-self.x,-self.y);
  // Sol : quadrillage par cases et bord de la carte.
  const left=self.x-W/2/zoom,top=self.y-H/2/zoom,right=self.x+W/2/zoom,bottom=self.y+H/2/zoom;
  ctx.strokeStyle='rgba(120,130,110,.10)';ctx.lineWidth=1;ctx.beginPath();
  for(let x=Math.floor(left/TILE)*TILE;x<=right;x+=TILE){ctx.moveTo(x,top);ctx.lineTo(x,bottom);}
  for(let y=Math.floor(top/TILE)*TILE;y<=bottom;y+=TILE){ctx.moveTo(left,y);ctx.lineTo(right,y);}ctx.stroke();
  if(cur.size>0){ctx.strokeStyle='rgba(200,80,60,.5)';ctx.lineWidth=3;ctx.strokeRect(0,0,cur.size,cur.size);}
  // Rayon de l'image : au-delà, seules les masses agrégées sont connues.
  ctx.strokeStyle='rgba(223,189,119,.18)';ctx.setLineDash?.([10,10]);ctx.beginPath();ctx.arc(cur.self.x,cur.self.y,cur.radius||900,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);
  for(const b of cur.buildings){
   const x=b.gx*TILE,y=b.gy*TILE,w=b.w*TILE,h=b.h*TILE,wall=b.flags&1,gate=b.flags&2,open=b.flags&4,site=b.flags&8,core=b.flags&16;
   ctx.globalAlpha=site?.45:1;
   ctx.fillStyle=core?'#b8955a':gate?(open?'#5d6a45':'#8a6f3a'):wall?'#6d655a':'#3f4a45';
   ctx.fillRect(x+1,y+1,w-2,h-2);
   ctx.strokeStyle=b.hp<35?'#c5533f':b.hp<70?'#c9a24f':'rgba(0,0,0,.55)';ctx.lineWidth=b.hp<70?2:1;ctx.strokeRect(x+1,y+1,w-2,h-2);
   // Pression des cadavres au pied d'un mur : marque proportionnelle à la charge lue chez l'hôte.
   if(wall&&b.corpses>0){ctx.fillStyle='rgba(90,40,34,.85)';ctx.beginPath();ctx.arc(x+w/2,y+h/2,Math.min(TILE*.6,3+Math.sqrt(b.corpses)*1.6),0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
  for(const m of cur.masses||[]){const [x,y,n]=m;ctx.fillStyle='rgba(160,60,50,.22)';ctx.beginPath();ctx.arc(x,y,Math.min(160,18+Math.sqrt(n)*9),0,Math.PI*2);ctx.fill();if(typeof ctx.fillText==='function'){ctx.fillStyle='rgba(235,170,150,.85)';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(String(n),x,y+5);}}
  const enemies=C?.ENEMIES||{};
  for(const z of blend(state.prev,cur,clamp(state.t??1,0,1))){const d=enemies[z.kind]||{radius:11,color:'#596052'};ctx.fillStyle=d.color;ctx.strokeStyle='#0b0d0b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(z.x,z.y,d.radius,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.strokeStyle='rgba(255,226,160,.8)';ctx.lineWidth=1.5;ctx.beginPath();for(const s of cur.shots||[]){ctx.moveTo(s[0],s[1]);ctx.lineTo(s[0]-s[2]*.25,s[1]-s[3]*.25);}ctx.stroke();
  for(const p of cur.pings||[]){const age=+p[3]||0,a=clamp(1-age/((F?.pingSeconds)||8),0,1);ctx.globalAlpha=a;ctx.strokeStyle='#e7c86a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[1],p[2],14+(age*10)%30,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=1;
  const actor=(x,y,a,fill,label,dead)=>{ctx.globalAlpha=dead?.35:1;ctx.fillStyle=fill;ctx.strokeStyle='#0d1a1e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#f3f6ef';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*22,y+Math.sin(a)*22);ctx.stroke();if(label&&typeof ctx.fillText==='function'){ctx.fillStyle='#f3f6ef';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(label,x,y-20);}ctx.globalAlpha=1;};
  if(cur.host&&!cur.host.away)actor(cur.host.x,cur.host.y,cur.host.a,'#d9b45f','COMMANDANT',cur.host.dead);
  for(const m of cur.mates||[])actor(m[2],m[3],m[4],'#8fc7d8',String(m[1]),m[5]);
  actor(self.x,self.y,state.aim??self.a,'#9bd17a','VOUS',cur.self.dead);
  ctx.restore();
  return true;
 }
 // Bandeau d'état de l'invité (texte), lu dans l'image.
 function hud(cur,status){
  if(!cur)return status||'En attente de la première image de l’hôte…';
  const s=cur.self,phase=PHASES[cur.phase]||cur.phase,parts=['Vague '+cur.wave+' · '+phase,'Santé '+s.hp+'/'+s.max,'Chargeur '+s.mag+(s.reload>0?' (rechargement)':'')+' · stock de l’hôte '+cur.ammo];
  if(s.dead)parts.push('À terre : retour au dépôt dans '+Math.ceil(s.respawn)+' s');
  if(cur.host?.away)parts.push('Commandant en sortie : vous tenez la cité');else if(cur.host?.dossier)parts.push('Commandant au poste : le temps continue');
  if(cur.hidden>0)parts.push(cur.hidden+' infecté(s) hors de vue');
  return parts.join(' · ');
 }

 // Client invité : socket du relais, siège C1, intentions limitées, deux dernières images.
 function createClient(options={}){
  const Socket=options.WebSocket||root.WebSocket,now=options.now||(()=>root.performance?.now?.()??Date.now());
  let socket=null,guest=null,status='idle',notice='',prev=null,cur=null,at0=0,at1=0,lastAim=-1,lastAimAt=-1e9,move={x:0,y:0},listeners=new Set();
  const emit=()=>{for(const f of listeners)try{f();}catch(error){}};
  const sendRaw=m=>{if(m&&socket?.readyState===1)socket.send(JSON.stringify(m));return Boolean(m);};
  function join(url,code,name,role){
   leave(false);
   if(!/^wss?:\/\/[^\s]+$/.test(String(url||''))||typeof Socket!=='function'){status='error';notice='Adresse de relais invalide (ws:// ou wss://).';emit();return false;}
   guest=S.createGuest({name,role});prev=cur=null;status='joining';notice='Connexion au relais…';
   try{socket=new Socket(String(url));}catch(error){status='error';notice='Relais injoignable.';emit();return false;}
   const mine=socket;
   socket.onopen=()=>{if(socket===mine){sendRaw(guest.hello(String(code||'').trim().toUpperCase()));notice='Demande envoyée à l’hôte…';emit();}};
   socket.onmessage=event=>{if(socket!==mine)return;let m=null;try{m=JSON.parse(String(event.data));}catch(error){return;}receive(m);};
   socket.onclose=()=>{if(socket!==mine)return;socket=null;if(status==='seated'||status==='joining'){notice=status==='joining'?'Relais injoignable.':'Liaison avec l’hôte perdue.';status='closed';}emit();};
   socket.onerror=()=>{};
   emit();return true;
  }
  function receive(m){
   if(!guest||!guest.receive(m))return false;
   const o=guest.overview();
   if(m.type==='welcome'){status='seated';notice='Assis au siège '+o.seat+' : responsable de district.';}
   else if(m.type==='refused'){status='refused';notice=REFUSED[o.reason]||'Demande refusée.';try{socket?.close();}catch(error){}}
   else if(m.type==='closed'){status='closed';notice='Campagne de l’hôte fermée. Vous n’emportez rien.';try{socket?.close();}catch(error){}}
   else if(m.type==='frame'){const v=decode(guest.view());if(v){prev=cur;at0=at1;cur=v;at1=now();}}
   emit();return true;
  }
  function intent(kind,data){return guest?sendRaw(guest.intent(kind,data)):false;}
  function setMove(next){if(next.x===move.x&&next.y===move.y)return false;move=next;return intent('move',next);}
  function setAim(a){const t=now();if(Math.abs(Math.atan2(Math.sin(a-lastAim),Math.cos(a-lastAim)))<.03||t-lastAimAt<80)return false;lastAim=a;lastAimAt=t;return intent('aim',{a:+a.toFixed(3)});}
  function leave(announce=true){const s=socket;socket=null;if(s)try{s.close();}catch(error){}if(announce&&status!=='idle'){status='idle';notice='Vous avez quitté la cité.';}prev=cur=null;move={x:0,y:0};emit();}
  // Image d'affichage : interpolée entre les deux dernières, avatar prédit par la dernière intention non confirmée.
  function frameState(){
   if(!cur)return null;const t=now(),span=Math.max(1,at1-at0),k=prev?clamp((t-at1)/span,0,1):1,lag=clamp((t-at1)/1000,0,.25);
   const self=cur.self.dead?{...cur.self}:{...cur.self,x:cur.self.x+move.x*(cur.self.speed||0)*lag,y:cur.self.y+move.y*(cur.self.speed||0)*lag};
   return{prev,cur,t:k,self};
  }
  return Object.freeze({join,leave,receive,intent,setMove,setAim,frameState,on:f=>{listeners.add(f);return()=>listeners.delete(f);},
   overview:()=>({status,notice,seat:guest?.overview().seat??null,tick:guest?.overview().tick??-1,pending:guest?.overview().pending??0,frames:Boolean(cur)})});
 }

 function install(g,doc){
  if(!g||!doc?.body||g.coopUI217||!S)return false;
  const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
  const write=(n,text)=>{const v=String(text);if(n&&n.textContent!==v)n.textContent=v;};
  const defaultRelay=()=>{const h=root.location?.hostname||'127.0.0.1';return(root.location?.protocol==='https:'?'wss://':'ws://')+h+':4290';};
  const field=(label,input)=>{const l=el('label',label);l.appendChild(input);return l;};
  const input=(id,value,extra={})=>{const n=el('input');n.id=id;n.type='text';n.value=value;for(const [k,v] of Object.entries(extra))n.setAttribute(k,v);return n;};
  try{const style=el('style');style.textContent=
   '.coop217{margin:0 0 18px;padding:10px 12px;border:1px solid #6f8a86;border-left:4px solid #9fc0b8;background:rgba(16,24,25,.86);color:#eef2ea;font:12px/1.45 system-ui,sans-serif;max-width:410px}'+
   '.coop217 summary{cursor:pointer;font-weight:700;letter-spacing:.06em}.coop217 label{display:block;margin:6px 0}.coop217 input,.coop217 select{display:block;width:100%;box-sizing:border-box;margin-top:2px}'+
   '.coop217 .coop217-row{display:flex;gap:6px;margin-top:8px}.coop217 p{margin:6px 0}.coop217 .coop217-code{font:700 18px/1.2 monospace;letter-spacing:.18em;color:#e4c982}'+
   '#coop217Banner{position:absolute;z-index:24;left:50%;top:76px;transform:translateX(-50%);padding:4px 10px;border:1px solid #6f8a86;background:rgba(16,24,25,.9);color:#dff3f7;font:12px/1.4 system-ui,sans-serif;pointer-events:none}'+
   '#coop217Guest{position:fixed;inset:0;z-index:200;background:#161b17}#coop217Guest canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}'+
   '#coop217Guest .coop217-hud{position:absolute;left:12px;top:10px;right:12px;padding:6px 10px;background:rgba(16,24,25,.88);border-left:4px solid #9bd17a;color:#eef2ea;font:13px/1.45 system-ui,sans-serif}'+
   '#coop217Guest .coop217-help{position:absolute;left:12px;bottom:10px;padding:4px 10px;background:rgba(16,24,25,.8);color:#c9d3c4;font:12px/1.4 system-ui,sans-serif}'+
   '#coop217Guest .coop217-districts{position:absolute;right:12px;top:64px;width:min(280px,40vw);padding:6px 10px;background:rgba(16,24,25,.85);color:#eef2ea;font:12px/1.5 system-ui,sans-serif}'+
   '#coop217Guest .coop217-leave{position:absolute;right:12px;bottom:10px}';
   (doc.head||doc.body).appendChild(style);}catch(error){}

  // ---- Côté invité : section du menu principal.
  const client=createClient();
  const join=el('details',undefined,'coop217');join.id='coop217Join';join.append(el('summary','COOPÉRATION · REJOINDRE UNE CITÉ'));
  join.appendChild(el('p','Un ami ouvre sa cité depuis son menu de pause et vous donne un code. Vous tenez un district à ses côtés : déplacement, visée, tir, signaux. Il garde la construction, les lois, les ordres et le stock.'));
  const relayIn=input('coop217Relay',defaultRelay(),{autocomplete:'off','aria-label':'Adresse du relais'}),codeIn=input('coop217Code','',{maxlength:'12',autocomplete:'off',autocapitalize:'characters'}),nameIn=input('coop217Name','Invité',{maxlength:'24'});
  const roleIn=el('select');roleIn.id='coop217Role';const r1=el('option','Responsable de district');r1.value='district';const r2=el('option','Chef de sortie (tranche C7, pas encore disponible)');r2.value='sortie';r2.disabled=true;roleIn.append(r1,r2);
  const joinBtn=el('button','REJOINDRE');joinBtn.type='button';joinBtn.id='coop217JoinButton';
  const joinState=el('p','Non connecté.');joinState.id='coop217JoinState';joinState.setAttribute('role','status');
  join.append(field('Adresse du relais',relayIn),field('Code de la cité',codeIn),field('Votre nom',nameIn),field('Rôle',roleIn),joinBtn,joinState);
  const card=doc.querySelector?.('#mainMenu .menu-card'),footer=card?.querySelector?.('footer');
  try{if(card&&footer&&typeof card.insertBefore==='function')card.insertBefore(join,footer);else (card||doc.body).appendChild(join);}catch(error){doc.body.appendChild(join);}
  joinBtn.addEventListener('click',()=>{client.join(relayIn.value.trim(),codeIn.value,nameIn.value,roleIn.value);});

  // Vue de l'invité assis.
  const layer=el('div');layer.id='coop217Guest';layer.hidden=true;layer.setAttribute('role','application');layer.setAttribute('aria-label','Vue de la cité de l’hôte');
  const canvas=el('canvas'),hudLine=el('div',undefined,'coop217-hud'),help=el('div','ZQSD/WASD : se déplacer · souris : viser · clic : tirer · F : signal au curseur · 1–8 : tenir un district · 0 : ne plus tenir · Échap : quitter','coop217-help');
  const list=el('div',undefined,'coop217-districts'),leaveBtn=el('button','QUITTER LA CITÉ','coop217-leave');leaveBtn.type='button';
  hudLine.setAttribute('role','status');layer.append(canvas,hudLine,list,help,leaveBtn);doc.body.appendChild(layer);
  const held=new Set(),mouse={x:0,y:0};let raf=0,aim=0;
  const seated=()=>client.overview().status==='seated';
  const screenToWorld=()=>{const st=client.frameState();if(!st)return null;const w=canvas.clientWidth||root.innerWidth||1280,h=canvas.clientHeight||root.innerHeight||720;return{x:st.self.x+(mouse.x-w/2),y:st.self.y+(mouse.y-h/2)};};
  function paintNow(){
   raf=0;if(layer.hidden)return;
   const w=root.innerWidth||1280,h=root.innerHeight||720,dpr=root.devicePixelRatio||1;
   if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
   const ctx=canvas.getContext?.('2d'),st=client.frameState();
   if(ctx){ctx.setTransform?.(dpr,0,0,dpr,0,0);if(st)paint(ctx,{...st,width:w,height:h,aim});else{ctx.fillStyle='#161b17';ctx.fillRect(0,0,w,h);}}
   const o=client.overview();write(hudLine,(o.status==='seated'?'':o.notice+' · ')+hud(st?.cur,o.notice));
   const ds=st?.cur?.districts||[],key=ds.map(d=>d.join('|')).join(';')+'#'+(st?.cur?.self?.district||'');
   if(list.dataset.key!==key){list.dataset.key=key;list.replaceChildren(el('strong','DISTRICTS'));if(!ds.length)list.appendChild(el('div','Aucune enceinte fermée autour du centre.'));ds.slice(0,8).forEach((d,i)=>list.appendChild(el('div',(i+1)+' · '+d[1]+(d[2]?'':' (ouverte)')+(d[3]?' · infecté':'')+(st.cur.self.district===d[0]?' · TENU':''))));}
   if(typeof root.requestAnimationFrame==='function')raf=root.requestAnimationFrame(paintNow);
  }
  function show(on){
   layer.hidden=!on;
   if(on&&!raf&&typeof root.requestAnimationFrame==='function')raf=root.requestAnimationFrame(paintNow);
   if(!on){held.clear();if(raf&&typeof root.cancelAnimationFrame==='function')root.cancelAnimationFrame(raf);raf=0;}
  }
  client.on(()=>{const o=client.overview();write(joinState,o.notice||'Non connecté.');show(o.status==='seated');if(o.status!=='seated'&&!layer.hidden)show(false);});
  const key=(down,event)=>{
   if(!seated()||layer.hidden)return;
   event.stopImmediatePropagation?.();
   if(event.target?.closest?.('input, select, textarea'))return;
   if(down&&event.code==='Escape'){event.preventDefault?.();client.leave();return;}
   if(down&&event.code==='KeyF'&&!event.repeat){const at=screenToWorld();if(at)client.intent('ping',{x:Math.round(at.x),y:Math.round(at.y)});return;}
   if(down&&/^Digit[0-8]$/.test(event.code)&&!event.repeat){const n=Number(event.code.slice(5)),ds=client.frameState()?.cur?.districts||[];client.intent('hold',{district:n===0?null:ds[n-1]?.[0]??null});return;}
   const all=[...KEYS.up,...KEYS.down,...KEYS.left,...KEYS.right];
   if(!all.includes(event.code))return;event.preventDefault?.();
   if(down)held.add(event.code);else held.delete(event.code);client.setMove(moveOf(held));
  };
  root.addEventListener?.('keydown',e=>key(true,e),true);root.addEventListener?.('keyup',e=>key(false,e),true);
  root.addEventListener?.('blur',()=>{if(seated()){held.clear();client.setMove({x:0,y:0});client.intent('fire',{on:false});}});
  canvas.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;const w=canvas.clientWidth||root.innerWidth||1280,h=canvas.clientHeight||root.innerHeight||720;aim=Math.atan2(mouse.y-h/2,mouse.x-w/2);client.setAim(aim);});
  canvas.addEventListener('mousedown',e=>{if(e.button===0)client.intent('fire',{on:true});else if(e.button===2){e.preventDefault?.();const at=screenToWorld();if(at)client.intent('ping',{x:Math.round(at.x),y:Math.round(at.y)});}});
  canvas.addEventListener('contextmenu',e=>e.preventDefault?.());
  root.addEventListener?.('mouseup',e=>{if(seated()&&e.button===0)client.intent('fire',{on:false});});
  leaveBtn.addEventListener('click',()=>client.leave());

  // ---- Côté hôte : section du menu de pause et bandeau.
  const hostBox=el('section',undefined,'coop217');hostBox.id='coop217Host';
  hostBox.append(el('strong','COOPÉRATION · OUVRIR MA CITÉ'));
  const hostRelay=input('coop217HostRelay',defaultRelay(),{autocomplete:'off'}),hostCode=el('p','','coop217-code');hostCode.id='coop217HostCode';
  const hostState=el('p','Cité fermée. Un invité tient un district ; tant qu’il est assis, le temps ne s’arrête pas.');hostState.id='coop217HostState';hostState.setAttribute('role','status');
  const hostGuests=el('p','');hostGuests.id='coop217HostGuests';
  const openBtn=el('button','OUVRIR MA CITÉ');openBtn.type='button';openBtn.id='coop217OpenButton';const closeBtn=el('button','FERMER LA CITÉ');closeBtn.type='button';closeBtn.id='coop217CloseButton';
  const row=el('div',undefined,'coop217-row');row.append(openBtn,closeBtn);
  hostBox.append(field('Adresse du relais',hostRelay),row,hostCode,hostState,hostGuests);
  const pauseCard=doc.querySelector?.('#pauseMenu .modal-card');try{(pauseCard||doc.body).appendChild(hostBox);}catch(error){}
  const banner=el('div');banner.id='coop217Banner';banner.hidden=true;banner.setAttribute('role','status');
  try{(doc.getElementById?.('gameContainer')||doc.getElementById?.('hud')||doc.body).appendChild(banner);}catch(error){doc.body.appendChild(banner);}
  openBtn.addEventListener('click',()=>{const r=g.coopHost217?.open({url:hostRelay.value.trim()});if(r&&!r.ok)write(hostState,r.reason);refreshHost();});
  closeBtn.addEventListener('click',()=>{g.coopHost217?.close();refreshHost();});
  function refreshHost(){
   const o=g.coopHost217?.overview?.();if(!o){hostBox.hidden=true;return;}
   const open=o.status==='open'||o.status==='opening';
   openBtn.disabled=open||g.state!=='playing';closeBtn.disabled=!open;
   write(hostCode,open?o.code:'');write(hostState,o.notice||'Cité fermée.');
   write(hostGuests,o.guests.length?o.guests.map(x=>'Siège '+x.seat+' · '+x.name+(x.dead?' (à terre)':'')+(x.districtName?' · tient '+x.districtName.toLowerCase():'')).join(' — '):open?'Aucun invité pour l’instant : la pause reste possible.':'');
   banner.hidden=!open||g.state!=='playing';
   write(banner,'CITÉ OUVERTE · CODE '+o.code+' · '+o.guests.length+' invité'+(o.guests.length>1?'s':'')+(o.live?' · le temps ne s’arrête pas':''));
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);try{refreshHost();}catch(error){}return result;};
  const togglePause=g.togglePause;
  if(typeof togglePause==='function')g.togglePause=function(...args){const result=togglePause.apply(this,args);try{refreshHost();}catch(error){}return result;};
  refreshHost();
  g.coopUI217=Object.freeze({client,refresh:refreshHost,paint:ctx=>{const st=client.frameState();return st?paint(ctx,{...st,width:ctx.canvas?.width||1280,height:ctx.canvas?.height||720}):false;}});
  return true;
 }
 return Object.freeze({install,createClient,paint,decode,hud,moveOf,blend});
});
