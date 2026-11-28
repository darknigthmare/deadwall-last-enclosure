// Session de vraie coopération, tranche C1 (docs/GAME_BIBLE.md §7.12, specs/cooperation/).
// Module pur : protocole et état partagé d'une session hôte/invités. L'hôte est la seule autorité
// sur le monde ; un invité n'envoie que des intentions (se déplacer, viser, tirer, signaler, tenir
// un district) et reçoit des images de l'état. Le module ne lit ni ne modifie aucune partie, aucune
// sauvegarde, aucun flux aléatoire ni aucune horloge : le pas de l'hôte est un entier fourni par
// l'appelant. Il n'est pas chargé par index.html ; aucun module du jeu ne le lit encore.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCoopSession217=api;
})(globalThis,function(root){
 'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CoopSession217Rules;
 const P=R.protocol,ROLES=R.roles;
 const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
 const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
 const finite=(v,lim=1e6)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=lim;
 const count=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 const CODE=new RegExp('^[A-Z0-9]{'+R.codeChars[0]+','+R.codeChars[1]+'}$'),DISTRICT=/^[A-Za-z0-9:_-]{1,32}$/;
 const label=(v,fallback)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,R.nameChars)||fallback:fallback;
 const exact=(v,keys)=>record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>own(v,k));
 const round=(v,per)=>Math.round(v*per)/per; // per = 10 : au dixième

 // Une intention valide est réécrite champ par champ : rien d'autre que ces clés n'atteint l'hôte.
 // Un invité ne transmet jamais une position, un stock, un dégât ni une horloge : seulement une volonté.
 const SHAPES=Object.freeze({
  move:v=>exact(v,['x','y'])&&finite(v.x,1)&&finite(v.y,1)&&Math.hypot(v.x,v.y)<=1+1e-9?{x:v.x,y:v.y}:null,
  aim:v=>exact(v,['a'])&&finite(v.a,64)?{a:v.a}:null,
  fire:v=>exact(v,['on'])&&typeof v.on==='boolean'?{on:v.on}:null,
  ping:v=>exact(v,['x','y'])&&finite(v.x)&&finite(v.y)?{x:v.x,y:v.y}:null,
  hold:v=>exact(v,['district'])&&(v.district===null||typeof v.district==='string'&&DISTRICT.test(v.district))?{district:v.district}:null,
  // C7 : fouiller le lieu voisin (chef de sortie seulement, voir les rôles) ; une volonté, jamais une quantité.
  search:v=>exact(v,['on'])&&typeof v.on==='boolean'?{on:v.on}:null
 });
 // C8 : jeton de reprise d'un siège (tiré par l'hôte hors simulation), facultatif dans `hello`.
 const RESUME=new RegExp('^[A-Z0-9]{'+((C.CoopResume217Rules&&C.CoopResume217Rules.tokenChars)||16)+'}$');
 function normalizeIntent(message,role){
  if(!exact(message,['type','protocol','seq','kind','data'])||message.type!=='intent'||message.protocol!==P)return null;
  if(!Number.isSafeInteger(message.seq)||message.seq<1||message.seq>R.maxSeq)return null;
  if(typeof message.kind!=='string'||!own(SHAPES,message.kind)||!own(ROLES,role)||!ROLES[role].includes(message.kind))return null;
  const data=SHAPES[message.kind](message.data);
  return data?{seq:message.seq,kind:message.kind,data}:null;
 }
 function normalizeHello(message){
  const resumed=exact(message,['type','protocol','code','name','role','resume']);
  if(!(resumed||exact(message,['type','protocol','code','name','role']))||message.type!=='hello'||message.protocol!==P)return null;
  if(typeof message.code!=='string'||!CODE.test(message.code)||typeof message.role!=='string'||!own(ROLES,message.role))return null;
  if(resumed&&(typeof message.resume!=='string'||!RESUME.test(message.resume)))return null;
  return{code:message.code,name:label(message.name,'Invité'),role:message.role,...(resumed?{resume:message.resume}:{})};
 }

 // Image partagée : une lecture bornée de l'état de l'hôte (la forme de Game.serialize, ou un objet
 // équivalent). Elle copie des nombres arrondis et ne garde aucune référence vers l'objet lu.
 function shareView(state,focus,options={}){
  const V=R.view,radius=finite(options.radius)&&options.radius>0?options.radius:V.radius;
  if(!state||typeof state!=='object')throw new TypeError('État de l’hôte illisible.');
  const fx=finite(focus?.x)?focus.x:0,fy=finite(focus?.y)?focus.y:0;
  const resources={};
  if(state.resources&&typeof state.resources==='object')for(const key of Object.keys(state.resources).sort())if(/^[a-zA-Z0-9_]{1,32}$/.test(key)&&finite(state.resources[key],1e9))resources[key]=round(state.resources[key],100);
  const buildings=(Array.isArray(state.buildings)?state.buildings:[]).filter(b=>b&&Number.isSafeInteger(b.id)&&typeof b.type==='string'&&finite(b.gx)&&finite(b.gy))
   .map(b=>({id:b.id,type:b.type.slice(0,32),gx:b.gx,gy:b.gy,health:finite(b.health,1e9)?round(b.health,10):0})).sort((a,b)=>a.id-b.id).slice(0,V.maxBuildings);
  const near=[];let hidden=0;
  for(const z of Array.isArray(state.zombies)?state.zombies:[]){
   if(!z||!Number.isSafeInteger(z.id)||!finite(z.x)||!finite(z.y))continue;
   const d=Math.hypot(z.x-fx,z.y-fy);if(d>radius){hidden++;continue;}
   near.push({d,id:z.id,kind:typeof z.kind==='string'?z.kind.slice(0,24):'walker',x:round(z.x,10),y:round(z.y,10),health:finite(z.health,1e9)?round(z.health,10):0});
  }
  near.sort((a,b)=>a.d-b.d||a.id-b.id);hidden+=Math.max(0,near.length-V.maxZombies);
  const zombies=near.slice(0,V.maxZombies).map(({d,...z})=>z);
  return{wave:count(state.wave,1e6)?state.wave:0,phase:typeof state.phase==='string'?state.phase.slice(0,24):'',phaseTime:finite(state.phaseTime)?round(state.phaseTime,10):0,
   focus:{x:round(fx,10),y:round(fy,10)},radius,resources,buildings,zombies,hidden};
 }

 // Hôte : admet les invités, file leurs intentions et les rend dans un ordre stable à chaque pas.
 function createHost(options={}){
  if(typeof options.code!=='string'||!CODE.test(options.code))throw new RangeError('Code de salle invalide : '+R.codeChars.join(' à ')+' lettres majuscules ou chiffres.');
  const code=options.code,seats=new Map();let tick=0,closed=false;
  const seatOf=id=>seats.get(id)||null;
  function admit(message){
   if(closed)return{ok:false,reply:{type:'refused',protocol:P,reason:'closed'}};
   const hello=normalizeHello(message);
   if(!hello)return{ok:false,reply:{type:'refused',protocol:P,reason:'invalid'}};
   if(hello.code!==code)return{ok:false,reply:{type:'refused',protocol:P,reason:'code'}};
   let seat=1;while(seats.has(seat))seat++;
   if(seat>R.maxGuests)return{ok:false,reply:{type:'refused',protocol:P,reason:'full'}};
   seats.set(seat,{seat,name:hello.name,role:hello.role,last:0,done:0,queue:[],refused:0,district:null,joined:tick});
   return{ok:true,seat,reply:{type:'welcome',protocol:P,seat,role:hello.role,name:hello.name,tick}};
  }
  function receive(seat,message){
   const s=seatOf(seat);if(closed||!s)return{ok:false,reason:'seat'};
   const intent=normalizeIntent(message,s.role);
   if(!intent){s.refused++;return{ok:false,reason:'invalid'};}
   // WebSocket garantit l'ordre : un numéro déjà vu est une répétition ou une falsification.
   if(intent.seq<=s.last){s.refused++;return{ok:false,reason:'replay'};}
   if(s.queue.length>=R.maxPending){s.refused++;return{ok:false,reason:'busy'};}
   s.last=intent.seq;s.queue.push(intent);return{ok:true};
  }
  // Un pas de l'hôte : au plus `perStep` intentions par siège, sièges par numéro, intentions par
  // numéro d'ordre. Le résultat ne dépend que des messages reçus, jamais de l'heure d'arrivée.
  function step(nextTick){
   if(!Number.isSafeInteger(nextTick)||nextTick<=tick||nextTick>R.maxTick)throw new RangeError('Le pas de l’hôte doit croître.');
   tick=nextTick;const out=[];
   for(const seat of [...seats.keys()].sort((a,b)=>a-b)){
    const s=seats.get(seat),batch=s.queue.splice(0,R.perStep);
    // L'accusé ne couvre que ce que ce pas a appliqué : une intention encore en file n'est pas confirmée.
    if(batch.length)s.done=batch[batch.length-1].seq;
    for(const intent of batch){if(intent.kind==='hold')s.district=intent.data.district;out.push(Object.freeze({tick,seat,role:s.role,seq:intent.seq,kind:intent.kind,data:Object.freeze({...intent.data})}));}
   }
   return Object.freeze(out);
  }
  function frame(seat,view){
   const s=seatOf(seat);if(!s||!view||typeof view!=='object'||Array.isArray(view))return null;
   return{type:'frame',protocol:P,tick,seat,ack:s.done,view:JSON.parse(JSON.stringify(view))};
  }
  // C8 : un invité revenu après une coupure reprend son siège (même rôle) ; ses numéros d'intention repartent de zéro.
  // L'hôte seul décide qu'un siège est gardé (jeton, délai) : la session vérifie seulement la forme, le code et le rôle.
  function resume(seat,message){
   const s=seatOf(seat);if(closed)return{ok:false,reply:{type:'refused',protocol:P,reason:'closed'}};
   const hello=normalizeHello(message);
   if(!hello||!s)return{ok:false,reply:{type:'refused',protocol:P,reason:'invalid'}};
   if(hello.code!==code)return{ok:false,reply:{type:'refused',protocol:P,reason:'code'}};
   if(hello.role!==s.role)return{ok:false,reply:{type:'refused',protocol:P,reason:'role'}};
   Object.assign(s,{name:hello.name,last:0,done:0,queue:[]});
   return{ok:true,seat,reply:{type:'welcome',protocol:P,seat,role:s.role,name:hello.name,tick}};
  }
  function leave(seat){return seats.delete(seat);}
  function close(){closed=true;const notices=[...seats.keys()].sort((a,b)=>a-b).map(seat=>({seat,message:{type:'closed',protocol:P,tick}}));seats.clear();return notices;}
  function overview(){return{tick,closed,guests:[...seats.values()].sort((a,b)=>a.seat-b.seat).map(s=>({seat:s.seat,name:s.name,role:s.role,ack:s.last,pending:s.queue.length,refused:s.refused,district:s.district}))};}
  return Object.freeze({admit,resume,receive,step,frame,leave,close,overview,get tick(){return tick;}});
 }

 // Invité : ne simule rien. Il numérote ses intentions, garde celles que l'hôte n'a pas encore
 // confirmées (pour une prédiction d'affichage) et n'accepte qu'une image plus récente que la précédente.
 function createGuest(options={}){
  const name=label(options.name,'Invité'),role=own(ROLES,options.role)?options.role:'district';
  let seat=null,seq=0,tick=-1,view=null,status='idle',reason='',pending=[],token=null;
  // C8 : `resume` (jeton reçu dans un `welcome` précédent) redemande le même siège après une coupure.
  function hello(code,resume){status='joining';return{type:'hello',protocol:P,code:String(code),name,role,...(typeof resume==='string'&&RESUME.test(resume)?{resume}:{})};}
  function intent(kind,data){
   if(status!=='seated'||!ROLES[role].includes(kind)||seq>=R.maxSeq)return null;
   const checked=normalizeIntent({type:'intent',protocol:P,seq:seq+1,kind,data},role);
   if(!checked||pending.length>=R.maxPending)return null;
   const message={type:'intent',protocol:P,seq:checked.seq,kind,data:checked.data};
   seq++;pending.push(message);return message;
  }
  function receive(message){
   if(!record(message)||message.protocol!==P)return false;
   if(message.type==='welcome'&&status==='joining'&&Number.isSafeInteger(message.seat)&&message.seat>=1&&message.seat<=R.maxGuests&&message.role===role){seat=message.seat;status='seated';tick=-1;token=typeof message.resume==='string'&&RESUME.test(message.resume)?message.resume:null;return true;}
   if(message.type==='refused'&&status==='joining'){status='refused';reason=typeof message.reason==='string'?message.reason.slice(0,16):'';return true;}
   if(message.type==='closed'&&status==='seated'){status='closed';pending=[];return true;}
   if(message.type==='frame'&&status==='seated'&&message.seat===seat&&count(message.tick,R.maxTick)&&message.tick>tick&&count(message.ack,R.maxSeq)&&message.ack<=seq&&record(message.view)){
    tick=message.tick;view=message.view;pending=pending.filter(m=>m.seq>message.ack);return true;
   }
   return false;
  }
  return Object.freeze({hello,intent,receive,
   pending:()=>pending.map(m=>({seq:m.seq,kind:m.kind,data:{...m.data}})),
   view:()=>view,token:()=>token,overview:()=>({name,role,seat,status,reason,tick,seq,pending:pending.length})});
 }

 return Object.freeze({RULES:R,PROTOCOL:P,ROLES,normalizeIntent,normalizeHello,shareView,createHost,createGuest});
});
