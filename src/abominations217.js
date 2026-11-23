/* Vagues menées (docs/GAME_BIBLE.md §3.5, la Meneuse), première tranche, pour les NOUVELLES campagnes seulement.
   - Certaines vagues sont menées : le choix dépend du seul numéro de vague et de la graine, sans tirage.
   - Pendant la journée qui précède, la Meneuse se tient au bord de la carte, loin des défenses. C'est une Errante
     ordinaire, créée par le moteur avec les points de vie de n'importe quelle Errante de cette vague. Elle ne marche
     pas et ne frappe pas tant qu'elle rassemble : elle est tenue hors de la boucle de déplacement des infectés.
   - À l'assaut, tout se règle par le nombre. Vivante : le plan de vague gagne `gatherShare` de son effectif et elle
     marche avec la horde, redevenue une infectée comme les autres. Abattue avant : le plan perd `cutShare`.
   Le plan reste celui de `C.wavePlan` : ce module ne fait qu'ajouter ou retirer des infectés ordinaires, dans les
   proportions du plan. Il ne touche ni aux points de vie ni aux dégâts, et ne tire rien dans le flux du jeu : la
   création de la Meneuse emprunte un flux à part, dérivé de la graine et de la vague.
   Deuxième tranche :
   - une escorte d'infectés ORDINAIRES se tient autour d'elle, immobile. Ses membres sont pris SUR l'effectif de la
     vague : à l'assaut, le plan remis au moteur est réduit d'autant, si bien que le total « sur place + à entrer »
     reste l'effectif annoncé et que les contrôles de la sauvegarde des échelons (total de la nuit = total du plan)
     tiennent sans rien toucher. Elle se réveille quand le Commandant ou un tir approche ; la Meneuse, dérangée,
     redevient alors une Errante ordinaire : elle marche et frappe ;
   - le poste est vérifié contre le décor : d'autres points du même côté sont essayés, dans un ordre fixe ;
   - `forecast()` donne l'effectif réel de la vague menée aux lectures (siège, radio, annonce de migration).
   Une campagne commencée avant cette règle n'a aucune vague menée. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Abominations217Rules;
 const E=R.escort,P=R.post;
 const KEYS=['version','active','led'],LED_KEYS=['wave','id','status','delta'],STATUS=['alive','slain','gathered','dispersed','absent'];
 const ESCORT_KEYS=['wave','ids','kinds','woken','taken'],UNREACHED=0x3fffffff,BODY=13,TAU=Math.PI*2;
 const SIDES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'}),SIDE_IDS=Object.keys(SIDES);
 const WHERE=Object.freeze({north:'au nord',east:'à l’est',south:'au sud',west:'à l’ouest'});
 const MAX_WAVE=1e7,MAX_ID=0x7fffffff,MAX_DELTA=1e12,REFRESH_SECONDS=.5,SEARCH=4096;
 // Plancher d'effectif du moteur, lu dans son propre calcul.
 const FLOOR=C.wavePlan(1,{...C.DIFFICULTIES.standard,enemyCount:0}).total;
 function initial(){return{version:1,active:false,led:null};}
 function fresh(){return{version:1,active:true,led:null};}
 const strict=(raw,keys)=>raw&&typeof raw==='object'&&!Array.isArray(raw)&&Object.keys(raw).length===keys.length&&Object.keys(raw).every(k=>keys.includes(k));
 function validate(raw){
  if(raw===undefined)return initial();
  const fail=()=>{throw Error('Vagues menées 217 invalides.');};
  // L'escorte est une clé facultative : absente d'une sauvegarde de la première tranche.
  const keys=raw&&typeof raw==='object'&&Object.hasOwn(raw,'escort')?[...KEYS,'escort']:KEYS;
  if(!strict(raw,keys)||raw.version!==1||typeof raw.active!=='boolean')fail();
  let led=null,escort=null;
  if(raw.led!==null){
   const l=raw.led;
   if(!raw.active||!strict(l,LED_KEYS)||!Number.isInteger(l.wave)||l.wave<R.firstWave||l.wave>MAX_WAVE||!Number.isInteger(l.id)||l.id<0||l.id>MAX_ID
    ||!STATUS.includes(l.status)||!Number.isInteger(l.delta)||Math.abs(l.delta)>MAX_DELTA)fail();
   // L'écart n'existe qu'une fois l'assaut lancé : en plus si elle a rassemblé, en moins si elle a été abattue.
   if(l.status==='gathered'?l.delta<0:l.status==='dispersed'?l.delta>0:l.delta!==0)fail();
   led={wave:l.wave,id:l.id,status:l.status,delta:l.delta};
  }
  if(keys!==KEYS){
   const e=raw.escort;
   if(!led||led.status==='absent'||!strict(e,ESCORT_KEYS)||e.wave!==led.wave||!Array.isArray(e.ids)||!Array.isArray(e.kinds)||e.ids.length>E.max||e.kinds.length!==e.ids.length
    ||e.ids.some(id=>!Number.isInteger(id)||id<1||id>MAX_ID||id===led.id)||new Set(e.ids).size!==e.ids.length||e.kinds.some(kind=>typeof kind!=='string'||!Object.hasOwn(C.ENEMIES,kind))
    ||typeof e.woken!=='boolean'||!Number.isInteger(e.taken)||e.taken<0||e.taken>e.ids.length)fail();
   // Le prélèvement sur le plan n'existe qu'une fois l'assaut lancé, et l'escorte marche alors avec la horde.
   const decided=led.status==='gathered'||led.status==='dispersed';
   if(decided?!e.woken:e.taken!==0)fail();
   escort={wave:e.wave,ids:e.ids.slice(),kinds:e.kinds.slice(),woken:e.woken,taken:e.taken};
  }
  return escort?{version:1,active:raw.active,led,escort}:{version:1,active:raw.active,led};
 }
 // Hachage entier de la graine et de la vague : sert au choix des vagues, au poste et au flux à part.
 function hash(seed,wave){
  const text=String(seed??0)+':'+wave;let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;return h>>>0;
 }
 // Vague de géants du siège vertical : jamais menée, pour garder le plafond d'abominations présentes.
 function giantWave(wave){const s=C.VerticalCitadel175?.siege;return Boolean(s&&wave>=s.firstWave&&wave%s.spawnWaveInterval===0);}
 function led(wave,seed){
  return Number.isInteger(wave)&&wave>=R.firstWave&&wave<=MAX_WAVE&&(wave-R.firstWave)%R.every===hash(seed,0)%R.every&&!giantWave(wave);
 }
 function nextLed(from,seed){
  for(let wave=Math.max(R.firstWave,Math.floor(Number(from)||1)),n=0;n<SEARCH;wave++,n++)if(led(wave,seed))return wave;
  return null;
 }
 // Côtés ouverts d'un terrain (siège adossé, `C.OpenSiege217.open`), dans l'ordre de `SIDE_IDS` ; sans terrain, les quatre.
 function openSides(sides){const list=sides?C.OpenSiege217.open(sides):SIDE_IDS;return list.length?list:SIDE_IDS;}
 // O9 (b) : cadre du terrain d'une partie (côtés, taille de la carte) ; `undefined` sur une carte plate.
 function frameOf(g){const sides=g?.world?.terrain217?.sides;return sides?{sides,size:(g.local||C.LOCAL_MAP217).size}:undefined;}
 // Poste de la Meneuse : un côté et un point du bord, fonction pure de la graine et de la vague.
 // O9 (b) (G12 hors jeu) : `frame` = {sides, size} d'un terrain — côté pris parmi les seuls côtés ouverts par le même
 // hachage (h modulo leur nombre : aucun tirage de plus), bord de la carte de terrain. Sans `frame` (carte plate) :
 // quatre côtés, h modulo 4 = h & 3, mêmes postes qu'avant.
 function post(seed,wave,frame){
  const size=frame?.size||C.LOCAL_MAP217.size,open=frame?.sides?openSides(frame.sides):null;
  const h=hash(seed,wave),side=open?open[h%open.length]:SIDE_IDS[h&3],along=(R.spanMin+(R.spanMax-R.spanMin)*((h>>>8)%1024)/1023)*size,near=R.standoff,far=size-R.standoff;
  const at=side==='north'?{x:along,y:near}:side==='south'?{x:along,y:far}:side==='east'?{x:far,y:along}:{x:near,y:along};
  return Object.freeze({side,name:SIDES[side],where:WHERE[side],x:at.x,y:at.y});
 }
 // Autres points du même côté, dans un ordre fixe : le poste d'origine, puis de part et d'autre le long du bord,
 // puis la même suite un pas plus loin du bord.
 function posts(seed,wave,frame){
  const size=frame?.size||C.LOCAL_MAP217.size,p=post(seed,wave,frame),lo=R.spanMin*size,hi=R.spanMax*size,horizontal=p.side==='north'||p.side==='south',along=horizontal?p.x:p.y,list=[];
  for(let depth=0;depth<2;depth++){
   const off=R.standoff+depth*P.step,deep=p.side==='north'||p.side==='west'?off:size-off;
   for(let i=0;i<=P.tries*2;i++){
    const a=along+(i===0?0:(i%2?1:-1)*Math.ceil(i/2)*P.step);if(a<lo||a>hi)continue;
    list.push(Object.freeze({side:p.side,name:p.name,where:p.where,x:horizontal?a:deep,y:horizontal?deep:a}));
   }
  }
  return list;
 }
 // Effectif de l'escorte : borné, croissant avec la vague, et jamais plus qu'une petite part du plan.
 function escortSize(wave,total){
  if(!Number.isInteger(wave)||wave<R.firstWave||!(total>0))return 0;
  return Math.max(0,Math.min(E.max,E.base+Math.floor((wave-R.firstWave)/R.every)*E.perLed,Math.floor(total*E.share+1e-9),Math.max(0,total-FLOOR)));
 }
 // Types de l'escorte : ceux du plan, dans ses proportions, par quantiles — sans tirage.
 function escortKinds(plan,n){
  const kinds=Object.keys(plan.composition).filter(kind=>plan.composition[kind]>0&&Object.hasOwn(C.ENEMIES,kind)),total=kinds.reduce((a,kind)=>a+plan.composition[kind],0),out=[];
  for(let i=0;i<n&&total>0;i++){
   const target=(i+.5)*total/n;let acc=0,pick=kinds[kinds.length-1];
   for(const kind of kinds){acc+=plan.composition[kind];if(target<acc){pick=kind;break;}}
   out.push(pick);
  }
  return out;
 }
 // L'escorte est prise sur le plan : un infecté de moins à entrer pour chaque membre, de son type si possible.
 function take(plan,kinds){
  const composition={...plan.composition},room=Math.max(0,plan.total-FLOOR);let taken=0;
  for(const kind of kinds){
   if(taken>=room)break;
   const from=composition[kind]>0?kind:composition.walker>0?'walker':Object.keys(composition).find(k=>composition[k]>0);
   if(!from)break;composition[from]--;taken++;
  }
  return{plan:{...plan,total:plan.total-taken,composition},taken};
 }
 // Places de l'escorte autour du poste : un anneau irrégulier, fonction pure de la graine et de la vague.
 function ring(seed,wave,n){
  const phase=hash(seed,wave)%360*TAU/360,out=[];
  for(let i=0;i<n;i++){const h=hash(seed,wave*131+i+1);out.push({angle:phase+TAU*i/n+((h&255)/255-.5)*.5,radius:E.ringMin+(E.ringMax-E.ringMin)*((h>>>8)%1024)/1023});}
  return out;
 }
 // Écart d'effectif, borné par la part réglée : des entiers, sans arrondi flottant défavorable.
 const gain=total=>Math.floor(total*R.gatherShare+1e-9);
 const cut=total=>Math.min(Math.floor(total*R.cutShare+1e-9),Math.max(0,total-FLOOR));
 // Même plan, effectif décalé de `delta` : chaque profil garde sa part, les Errants prennent le reste.
 function shift(plan,delta){
  const total=plan.total+delta,composition={};let assigned=0;
  for(const kind of Object.keys(plan.composition)){if(kind==='walker')continue;const n=Math.floor(plan.composition[kind]*total/plan.total);composition[kind]=n;assigned+=n;}
  const out={};for(const kind of Object.keys(plan.composition))out[kind]=kind==='walker'?total-assigned:composition[kind];
  return{...plan,total,composition:out};
 }
 const gather=plan=>shift(plan,gain(plan.total));
 const disperse=plan=>shift(plan,-cut(plan.total));
 const percent=n=>Math.round(n*100)+' %';
 const contacts=n=>n+' contact'+(n>1?'s':'');
 const infected=n=>n+' infecté'+(n>1?'s':'')+' ordinaire'+(n>1?'s':'');
 function install(g,doc=root.document){
  if(g.abominations217)return g.abominations217;if(!g.expansions)throw Error('Installer les opérations avant les vagues menées 217.');
  let state=initial(),ref=null,seenPhase=null,clock=-Infinity,node=null,title=null,text=null,shown=null;
  const refs=new Map();
  const forget=()=>{ref=null;refs.clear();seenPhase=null;clock=-Infinity;shown=null;};
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const seed=()=>g.world?.seed??0;
  const frame=()=>frameOf(g);
  const current=()=>state.led&&state.led.wave===g.wave?state.led:null;
  // Le corps de la Meneuse tant qu'elle rassemble ; retrouvé par son identifiant après une reprise.
  function body(){
   const l=current();if(!l||l.status!=='alive'||!l.id)return null;
   if(ref&&ref.id===l.id&&(ref.dead||g.zombies.includes(ref)))return ref;
   ref=g.zombies.find(z=>z.id===l.id)||null;return ref;
  }
  // Estimation avant l'alerte : le plan que le moteur calculerait maintenant.
  const planNow=()=>C.wavePlan(g.wave,g.difficulty||C.DIFFICULTIES.standard,Number(g.signature)||0,g.balance217?.curve?.()||null);
  const estimate=()=>planNow().total;
  const say=(message,tone)=>g.notify?.(message,tone);
  const escort=()=>state.escort&&current()&&state.escort.wave===g.wave?state.escort:null;
  // Membres de l'escorte encore sur la carte, retrouvés par leur identifiant après une reprise.
  function guards(){
   const e=escort(),out=[];if(!e)return out;
   for(const id of e.ids){
    let z=refs.get(id);
    if(!z||!(z.dead||g.zombies.includes(z))){z=g.zombies.find(o=>o.id===id)||null;if(z)refs.set(id,z);else refs.delete(id);}
    if(z&&!z.dead)out.push(z);
   }
   return out;
  }
  // Terrain praticable et atteignable : le Commandant peut s'y tenir, un infecté aussi, et le champ de marche
  // des infectés relie ce point à la cité.
  function clear(x,y){
   if(!(x>=BODY+4&&y>=BODY+4&&x<=(g.local||C.LOCAL_MAP217).size-BODY-4&&y<=(g.local||C.LOCAL_MAP217).size-BODY-4))return false;
   try{
    const probe={radius:BODY,x,y};
    if(typeof g.friendlyPositionClear==='function'&&!g.friendlyPositionClear(probe,x,y))return false;
    if(typeof g.hostilePositionClear==='function'&&!g.hostilePositionClear(probe,x,y))return false;
    const values=g.flow?.values,core=g.core?.(),cell=(a,b)=>Math.floor(a/C.TILE)+Math.floor(b/C.TILE)*(g.local||C.LOCAL_MAP217).tiles;
    // Le champ n'est consulté que s'il est construit (valeur nulle au centre).
    if(values&&core&&values[cell(core.x,core.y)]===0&&!(values[cell(x,y)]<UNREACHED))return false;
   }catch(error){return false;}
   return true;
  }
  const place=wave=>posts(seed(),wave,frame()).find(p=>clear(p.x,p.y))||null;
  // Dérangée : un membre du groupe touché ou tombé, le Commandant tout près, ou un tir qui passe à proximité.
  function disturbed(){
   const e=escort(),l=current();if(!e||e.woken||!l)return false;
   // Meneuse déjà abattue (relevé fait par une sauvegarde entre le coup et l'image suivante) : l'escorte se lève.
   const z=body();if(l.status!=='alive'||!z||z.dead)return true;
   const standing=guards();if(standing.length<e.ids.length)return true;
   const all=[z,...standing];if(all.some(m=>m.health<m.maxHealth))return true;
   const near=(a,r)=>all.some(m=>(m.x-a.x)**2+(m.y-a.y)**2<=r*r),p=g.player;
   if(p&&!p.dead&&!p.regionAbsent&&!g.frontier?.active?.()&&near(p,E.wake))return true;
   for(const shot of g.projectiles||[])if(shot&&!shot.dead&&near(shot,E.shot))return true;
   return false;
  }
  function rouse(){
   const e=escort();if(!e||e.woken)return;
   const z=body(),n=guards().length;e.woken=true;
   if(z&&!z.dead)say('Meneuse dérangée '+post(seed(),e.wave,frame()).where+' : elle ne rassemble plus à l’abri'+(n?', et son escorte se réveille — '+infected(n)+' en marche avec elle':'')+'. Elle frappe désormais comme une Errante.','danger');
   else if(n)say('L’escorte de la Meneuse se réveille '+post(seed(),e.wave,frame()).where+' : '+infected(n)+' en marche sur la cité.','danger');
  }
  function sync(){
   const l=current(),z=body();
   if(l&&z&&z.dead){
    l.status='slain';ref=null;
    say('Meneuse abattue '+post(seed(),l.wave,frame()).where+' : la horde ne se rassemblera pas. Environ '+contacts(cut(g.wavePlan&&g.phase==='warning'?g.wavePlan.total:estimate()))+' de moins à l’assaut.','good');
   }
  }
  // Première vague menée de la campagne : fonction pure de la graine, l'explication n'est donc donnée qu'une fois.
  // Donnée à la première vague menée, que la Meneuse ait trouvé un poste ou non : jamais deux fois.
  const firstLed=wave=>nextLed(R.firstWave,seed())===wave;
  const FIRST='Première vague menée de la campagne : la règle est décrite dans le carnet, fiche « Vagues menées ».';
  // Création par le moteur lui-même, avec un flux à part : le flux du jeu n'avance pas d'un tirage.
  function appear(){
   if(typeof g.spawnZombie!=='function'||g.zombies.length>=C.PERFORMANCE_LIMITS.zombies||g.nextId>=MAX_ID)return false;
   const wave=g.wave,p=place(wave);
   if(!p){
    // Aucun point praticable de ce côté : pas de Meneuse, la vague reste une vague ordinaire.
    state.led={wave,id:0,status:'absent',delta:0};delete state.escort;ref=null;refs.clear();
    say('Vague '+wave+' : le terrain '+post(seed(),wave,frame()).where+' ne laisse aucun poste à une Meneuse. Vague ordinaire.'+(firstLed(wave)?' '+FIRST:''),'normal');
    return false;
   }
   // Places de l'escorte : chaque membre cherche un sol libre sur son rayon, en se rapprochant ; sinon il manque.
   const plan=planNow(),spots=[];
   for(const spot of ring(seed(),wave,escortSize(wave,plan.total)))for(const k of [1,.75,.5]){
    const x=p.x+Math.cos(spot.angle)*spot.radius*k,y=p.y+Math.sin(spot.angle)*spot.radius*k;
    if(clear(x,y)){spots.push({x,y});break;}
   }
   const kinds=escortKinds(plan,spots.length),random=g.random,made=[];
   g.random=new C.Random(hash(seed(),wave));
   try{
    for(const kind of ['walker',...kinds]){
     const count=g.zombies.length;
     if(count>=C.PERFORMANCE_LIMITS.zombies||g.nextId>=MAX_ID||g.spawnZombie(kind)===false||g.zombies.length!==count+1||g.zombies[count].kind!==kind)break;
     made.push(g.zombies[count]);
    }
   }finally{g.random=random;}
   const z=made[0];if(!z)return false;
   const set=(m,at)=>{m.x=at.x;m.y=at.y;m.lastX=at.x;m.lastY=at.y;m.facing=Math.atan2((g.local||C.LOCAL_MAP217).size/2-at.y,(g.local||C.LOCAL_MAP217).size/2-at.x);};
   set(z,p);made.slice(1).forEach((m,i)=>set(m,spots[i]));
   state.led={wave,id:z.id,status:'alive',delta:0};ref=z;refs.clear();
   state.escort={wave,ids:made.slice(1).map(m=>m.id),kinds:kinds.slice(0,made.length-1),woken:false,taken:0};
   const total=plan.total,n=state.escort.ids.length;
   say('Vague '+wave+' menée : une Meneuse rassemble la horde '+p.where+', au bord de la carte'+(n?', gardée par '+infected(n)+' immobiles, pris sur l’effectif de la vague':'')+'. Vivante à l’assaut : environ '+contacts(gain(total))+' de plus. Abattue avant : environ '+contacts(cut(total))+' de moins.'
    +(firstLed(wave)?' '+FIRST:''),'danger');
   return true;
  }
  function tick(){
   if(!state.active||!playing())return;
   if(g.phase==='calm'&&led(g.wave,seed())&&!current())appear();
   if(disturbed())rouse();
   sync();
   if(seenPhase!==null&&seenPhase!==g.phase&&g.phase==='warning'){
    const l=current();
    if(l?.status==='alive')say('Vague menée : la Meneuse tient toujours '+post(seed(),l.wave,frame()).where+'. Si elle vit à l’assaut, la horde comptera '+contacts(gain(g.wavePlan?.total||estimate()))+' de plus.','danger');
   }
   seenPhase=g.phase;
  }
  // Tant qu'elle rassemble sans être dérangée, la Meneuse et son escorte restent hors de la boucle des infectés :
  // ni pas, ni coup, ni tirage. Dérangées, elles y reviennent et sont des infectées comme les autres.
  function held(){
   if(!state.active)return[];
   const z=body();if(!z||z.dead)return[];
   const e=escort();if(e?.woken)return[];
   return e?[z,...guards()]:[z];
  }
  const zombies=g.updateZombies;
  if(typeof zombies==='function')g.updateZombies=function(...args){
   const out=[];
   for(const z of held()){const index=this.zombies.indexOf(z);if(index>=0)out.push({z,index});}
   if(!out.length)return zombies.apply(this,args);
   out.sort((a,b)=>b.index-a.index);for(const o of out)this.zombies.splice(o.index,1);
   try{return zombies.apply(this,args);}
   finally{for(const o of out.reverse())if(!o.z.dead&&!this.zombies.includes(o.z))this.zombies.splice(Math.min(o.index,this.zombies.length),0,o.z);}
  };
  // L'assaut fixe l'effectif, une fois : avant que le moteur ne remplisse sa file et que la nuit ne soit comptée.
  const start=g.startAssault;
  // Siège adossé (G12 hors jeu) : sur une cité à un seul front, la Meneuse et son escorte encore debout passent par le même
  // passage que la file ; chacun y prend une place du débit (`C.OpenSiege217.lead`) avant la première arrivée.
  function onSite(){
   const l=current(),e=escort();if(!l)return 0;
   const z=l.id&&l.status==='gathered'?g.zombies.find(o=>o.id===l.id&&!o.dead):null;
   return (z?1:0)+(e?guards().length:0);
  }
  function passLead(){
   const sides=g.world?.terrain217?.sides;if(!sides||typeof g.openSiegeState217!=='function')return;
   const s=g.openSiegeState217(),n=s?onSite():0;if(!n)return;
   const t=C.OpenSiege217.lead(n,g.spawnGap217(),s.fronts,sides);if(t>0)g.spawnTimer+=t;
  }
  if(typeof start==='function')g.startAssault=function(...args){
   let fixed=false;
   if(state.active&&g.world&&led(g.wave,seed())){fixed=true;
    sync();
    if(!g.wavePlan)g.prepareWave();
    let l=current();if(!l)l=state.led={wave:g.wave,id:0,status:'alive',delta:0};
    if(l.status==='alive'||l.status==='slain'){
     const slain=l.status==='slain',before=g.wavePlan,plan=slain?disperse(before):gather(before),where=post(seed(),l.wave,frame()).where;
     // L'escorte fait partie de cet effectif : ses membres, tombés ou debout, ne sont pas à faire entrer une seconde fois.
     const e=escort(),standing=guards().length,rest=e?take(plan,e.kinds):{plan,taken:0};
     g.wavePlan=rest.plan;l.delta=plan.total-before.total;l.status=slain?'dispersed':'gathered';ref=null;
     if(e){e.taken=rest.taken;e.woken=true;}
     const tail=rest.taken?' Dont '+rest.taken+' de l’escorte déjà sur place ('+(standing?standing+' encore debout':'tous abattus')+') : '+rest.plan.total+' restent à entrer.':'';
     if(slain)say('Meneuse abattue : la horde arrive dispersée, '+contacts(-l.delta)+' de moins ('+plan.total+' au lieu de '+before.total+').'+tail,'good');
     else say('La Meneuse n’a pas été abattue : elle marche avec la horde '+where+', '+contacts(l.delta)+' de plus ('+plan.total+' au lieu de '+before.total+').'+tail,'danger');
    }
   }
   const result=start.apply(this,args);
   if(fixed)passLead();
   return result;
  };
  const update=g.update;
  if(typeof update==='function')g.update=function(...args){const result=update.apply(this,args);tick();return result;};
  // Vue de la Meneuse pour la présentation : nulle dès qu'elle ne rassemble plus.
  function leader(){
   const z=state.active?body():null;if(!z||z.dead)return null;
   const p=post(seed(),state.led.wave,frame());return Object.freeze({wave:state.led.wave,id:z.id,side:p.side,name:p.name,x:z.x,y:z.y,health:z.health,maxHealth:z.maxHealth});
  }
  // Effectif réel de la vague menée en cours, pour les lectures : fourchette tant que rien n'est décidé.
  // `plan` est le plan avant l'écart ; `alive` et `slain` comptent l'escorte, qui en fait partie.
  function forecast(){
   if(!state.active||!playing())return null;
   const l=current();if(!l||l.status==='absent')return null;
   const e=escort(),size=e?e.ids.length:0,standing=e?guards().length:0,p=post(seed(),l.wave,frame()),decided=l.status==='gathered'||l.status==='dispersed';
   let plan,real=null,entering=null;
   if(decided){entering=Math.floor(Number(g.wavePlan?.total)||0);real=entering+(e?e.taken:0);plan=real-l.delta;}
   else{plan=g.wavePlan&&g.phase==='warning'?g.wavePlan.total:estimate();if(l.status==='slain')real=plan-cut(plan);}
   return Object.freeze({wave:l.wave,side:p.side,name:p.name,where:p.where,status:l.status,decided,plan,alive:decided?null:plan+gain(plan),slain:decided?null:plan-cut(plan),real,entering,escort:size,standing,woken:Boolean(e?.woken)});
  }
  // L'annonce de migration du moteur donne le plan avant l'écart : pour une vague menée, elle donne l'effectif réel.
  const MIGRATION=/^Migration détectée — (\d+) contacts estimés\.$/;
  function amend(message){
   if(typeof message!=='string'||!state.active||g.phase!=='warning'||!MIGRATION.test(message))return message;
   sync();const f=forecast();if(!f||f.decided)return message;
   const guard=f.escort?', dont '+f.escort+' de l’escorte déjà sur place':'';
   return f.status==='slain'?'Migration détectée — '+f.slain+' contacts estimés : Meneuse abattue, horde dispersée (plan : '+f.plan+')'+guard+'.'
    :'Migration détectée — vague menée : '+f.alive+' contacts si la Meneuse vit à l’assaut, '+f.slain+' si elle tombe (plan : '+f.plan+')'+guard+'.';
  }
  const notify=g.notify;
  if(typeof notify==='function')g.notify=function(message,...rest){return notify.call(this,amend(message),...rest);};
  function guardText(){
   const e=escort();if(!e||!e.ids.length)return'';
   const n=guards().length;
   return e.woken?' Escorte réveillée : '+(n?infected(n)+' en marche.':'abattue.'):' Escorte : '+infected(n)+' immobiles autour d’elle, pris sur l’effectif de la vague ; ils se réveillent si le Commandant ou un tir approche.';
  }
  function line(){
   if(!state.active||!playing())return'';
   const l=current();
   if(l&&l.status==='absent')return'Vague '+l.wave+' : aucun poste praticable pour une Meneuse, vague ordinaire.';
   if(l){
    const where=post(seed(),l.wave,frame()).where,total=g.wavePlan&&g.phase!=='calm'?g.wavePlan.total:estimate();
    if(l.status==='alive')return'Vague '+l.wave+' menée : Meneuse repérée '+where+(escort()?.woken?', dérangée : elle marche et frappe comme une Errante':', au bord de la carte')+'. Vivante à l’assaut : environ '+contacts(gain(total))+' de plus. Abattue avant : environ '+contacts(cut(total))+' de moins.'+guardText();
    if(l.status==='slain')return'Vague '+l.wave+' : Meneuse abattue. La horde arrivera dispersée, environ '+contacts(cut(total))+' de moins.'+guardText();
    const taken=escort()?.taken?' Dont '+escort().taken+' de l’escorte, déjà sur place.':'';
    if(l.status==='gathered')return'Vague '+l.wave+' : la Meneuse n’a pas été abattue, elle marche avec la horde. '+contacts(l.delta)+' de plus.'+taken;
    return'Vague '+l.wave+' : Meneuse abattue avant l’assaut. '+contacts(-l.delta)+' de moins.'+taken;
   }
   const next=nextLed(g.wave,seed());
   return next===null?'':next===g.wave?'Vague '+next+' menée : la Meneuse n’a pas été repérée.':'Prochaine vague menée : vague '+next+'.';
  }
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : aucune de ses vagues n’est menée. La règle ne s’active pas en cours de campagne.',rows:[
    {label:'Règle',value:'Sans objet : vagues d’origine.'},{label:'Meneuse',value:'Sans objet.'}]};
   const l=state.led,next=g.world?nextLed(g.wave,seed()):null;
   let last='Aucune pour l’instant.';
   if(l&&(l.status==='gathered'||l.status==='dispersed'))last='Vague '+l.wave+' : '+(l.status==='gathered'?'non abattue, '+contacts(l.delta)+' de plus.':'abattue avant l’assaut, '+contacts(-l.delta)+' de moins.');
   return{summary:'Certaines vagues sont menées : une Meneuse, infectée d’apparence ordinaire, rassemble la horde depuis le bord de la carte pendant la journée qui précède. Ce n’est pas elle qui est dangereuse, c’est le nombre qu’elle amène. Cette règle vaut pour toute la campagne.',rows:[
    {label:'Règle',value:'À partir de la vague '+R.firstWave+', une vague sur '+R.every+', jamais une vague de géants. Meneuse vivante à l’assaut : +'+percent(R.gatherShare)+' d’infectés ordinaires. Abattue avant l’assaut : −'+percent(R.cutShare)+'. Ses points de vie sont ceux d’une Errante.'},
    {label:'Prochaine vague menée',value:next===null?'Aucune en vue.':'Vague '+next+(next===g.wave?' (celle qui vient).':'.')},
    {label:'Meneuse',value:line()||'Aucune en vue.'},
    {label:'L’atteindre',value:'Elle se tient hors de portée des défenses de la cité : sortie du Commandant ou tir à longue portée, avant l’assaut. Une escorte d’infectés ordinaires la garde, immobile : '+E.base+' à la première vague menée, '+E.perLed+' de plus à chaque vague menée, '+E.max+' au plus, pris sur l’effectif de la vague. Elle se réveille si le Commandant approche à moins de '+Math.round(E.wake/32)+' m ou si un tir passe à moins de '+Math.round(E.shot/32)+' m ; la Meneuse, dérangée, marche et frappe alors comme une Errante.'},
    {label:'Dernière vague menée',value:last}]};
  }
  // Marqueur sobre : un cercle fin et un mot, au sol et sur la carte réduite. Lecture seule.
  const ground=g.drawGround;
  if(typeof ground==='function')g.drawGround=function(...args){
   const result=ground.apply(this,args);
   try{
    const ctx=args[0],z=ctx&&playing()?leader():null;
    if(z&&typeof ctx.arc==='function'){
     ctx.save();ctx.strokeStyle='rgba(214,201,160,.8)';ctx.lineWidth=1.5;ctx.setLineDash?.([5,5]);ctx.beginPath();ctx.arc(z.x,z.y,26,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);
     ctx.fillStyle='rgba(214,201,160,.9)';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText?.('MENEUSE',z.x,z.y-34);
     // Escorte immobile : la distance de réveil, en trait fin.
     const e=escort();if(e&&!e.woken&&e.ids.length){ctx.strokeStyle='rgba(214,201,160,.28)';ctx.lineWidth=1;ctx.setLineDash?.([2,9]);ctx.beginPath();ctx.arc(z.x,z.y,E.wake,0,TAU);ctx.stroke();ctx.setLineDash?.([]);}
     ctx.restore();
    }
   }catch(error){/* le marqueur ne doit jamais interrompre le rendu */}
   return result;
  };
  const minimap=g.renderMinimap;
  if(typeof minimap==='function')g.renderMinimap=function(...args){
   const result=minimap.apply(this,args);
   try{
    const ctx=this.mctx,z=ctx&&this.minimap&&playing()?leader():null;
    if(z&&typeof ctx.arc==='function'){const sx=this.minimap.width/(this.local||C.LOCAL_MAP217).size,sy=this.minimap.height/(this.local||C.LOCAL_MAP217).size;ctx.save();ctx.strokeStyle='#d6c9a0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(z.x*sx,z.y*sy,4,0,Math.PI*2);ctx.stroke();ctx.restore();}
   }catch(error){/* idem */}
   return result;
  };
  // Ligne du dossier de situation, sous la lecture de siège quand elle existe.
  function render(){
   if(!doc?.createElement||!doc.getElementById)return false;
   const value=line();
   if(!node){
    const host=doc.getElementById('rightPanel');if(!host)return false;
    node=doc.createElement('section');node.id='abominations217Readout';node.className='siege-readout';node.setAttribute?.('aria-label','Vague menée');
    const card=doc.createElement('article');card.className='siege-readout-card';
    const small=doc.createElement('small');small.textContent='VAGUE MENÉE';title=doc.createElement('h3');title.id='abominations217Title';text=doc.createElement('p');text.id='abominations217Line';text.className='siege-readout-note';
    card.append?card.append(small,title,text):[small,title,text].forEach(n=>card.appendChild(n));node.appendChild(card);
    const box=doc.getElementById('siegeReadout');
    if(box&&box.parentNode===host&&typeof host.insertBefore==='function')host.insertBefore(node,box.nextSibling||null);else host.appendChild(node);
   }
   node.hidden=!value;
   if(value!==shown){shown=value;const l=current();title.textContent=l&&l.status!=='absent'?(l.status==='alive'?'Meneuse '+post(seed(),l.wave,frame()).where:l.status==='slain'||l.status==='dispersed'?'Meneuse abattue':'Meneuse dans la horde'):'Aucune Meneuse en vue';text.textContent=value;}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;try{render();}catch(error){/* DOM partiel */}}return result;};
  const api=Object.freeze({active:()=>state.active,led:wave=>state.active&&Boolean(g.world)&&led(wave,seed()),next:()=>state.active&&g.world?nextLed(g.wave,seed()):null,
   leader,line,tick,render,overview,forecast,
   escort:()=>{const e=state.active?escort():null;return e?Object.freeze({wave:e.wave,size:e.ids.length,standing:guards().length,kinds:Object.freeze(e.kinds.slice()),woken:e.woken,taken:e.taken}):null;},
   actions:()=>[],snapshot:()=>{if(state.active&&playing())sync();return validate(state);}});g.abominations217=api;
  g.expansions.register({id:'abominations217',title:'Vagues menées',overview,actions:api.actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);forget();},reset:()=>{state=fresh();forget();}});
  return api;
 }
 /* Troisième tranche (docs/GAME_BIBLE.md §3.5) : abominations du siège, Comble-fossé et Traîne-épave. Module à part
    (`abominationsSiege217`), pour que seules les campagnes commencées avec cette règle la suivent : une campagne des
    deux premières tranches garde ses vagues menées et n'a ni Comble-fossé ni Traîne-épave.
    - Le choix de la vague dépend du numéro de vague et de la graine, sans tirage ; jamais une vague de géants ni une
      vague menée, et les deux ne tombent jamais sur la même vague. La Comble-fossé ne vient que si la cité a au moins
      `minDitches` fossés ouverts, la Traîne-épave que si elle a un mur ou une porte en service.
    - Aucune n'est créée : à l'assaut, une fois `lead` de l'effectif entré, l'Errante la plus récemment entrée devient
      l'abomination. Mêmes points de vie, même pas, mêmes coups ; l'effectif de la nuit ne change pas d'une unité.
    - Comble-fossé : un infecté abattu à moins de `radius` d'elle tombe dans le fossé `extra` fois de plus, par la
      réception de corps des travaux de terrain (src/earthworks217.js). Abattue avant la ligne : aucun corps de plus.
    - Traîne-épave : au contact d'un mur ou d'une porte, son épave de tôle et de câbles reste au pied : `load` de charge
      de corps en plus, la même charge que lisent la rampe, l'amas visible et le déblaiement. Aucun dégât.
    - Au plus `cap` abominations présentes à la fois, géants du siège vertical et Meneuse compris. */
 const SF=R.filler,SD=R.dragger;
 const SIEGE_KEYS=['version','active','current'],CURRENT_KEYS=['wave','kind','status','from','id','side','count','wall'],SIEGE_STATUS=['expected','alive','slain','absent'];
 const KINDS=Object.freeze({
  fill:Object.freeze({name:'Comble-fossé',mark:'COMBLE-FOSSÉ',rules:SF,salt:'comble'}),
  drag:Object.freeze({name:'Traîne-épave',mark:'TRAÎNE-ÉPAVE',rules:SD,salt:'epave'})});
 const KIND_IDS=Object.keys(KINDS);
 function siegeInitial(){return{version:1,active:false,current:null};}
 function siegeFresh(){return{version:1,active:true,current:null};}
 function siegeValidate(raw){
  if(raw===undefined)return siegeInitial();
  const fail=()=>{throw Error('Abominations du siège 217 invalides.');};
  if(!strict(raw,SIEGE_KEYS)||raw.version!==1||typeof raw.active!=='boolean')fail();
  if(raw.current===null)return{version:1,active:raw.active,current:null};
  const c=raw.current;
  if(!raw.active||!strict(c,CURRENT_KEYS)||!Object.hasOwn(KINDS,c.kind)||!Number.isInteger(c.wave)||c.wave<KINDS[c.kind].rules.firstWave||c.wave>MAX_WAVE||!SIEGE_STATUS.includes(c.status)
   ||!Number.isInteger(c.from)||c.from<0||c.from>MAX_ID||!Number.isInteger(c.id)||c.id<0||c.id>MAX_ID||typeof c.side!=='string'||c.side!==''&&!Object.hasOwn(SIDES,c.side)
   ||!Number.isInteger(c.count)||c.count<0||c.count>MAX_DELTA||!Number.isInteger(c.wall)||c.wall<0||c.wall>MAX_ID)fail();
  // Désignée (vivante ou abattue) : une infectée entrée avec cet assaut, et son côté. Attendue ou absente : rien encore.
  const named=c.status==='alive'||c.status==='slain';
  if(named?c.id<1||c.id<c.from||c.side==='':c.id!==0||c.side!==''||c.count!==0||c.wall!==0)fail();
  // Seule la Traîne-épave dépose une épave, une seule, contre un mur ; seule la Comble-fossé pousse des corps.
  if(c.kind==='drag'?c.count>1||(c.count===1)!==(c.wall>0):c.wall!==0)fail();
  return{version:1,active:true,current:{wave:c.wave,kind:c.kind,status:c.status,from:c.from,id:c.id,side:c.side,count:c.count,wall:c.wall}};
 }
 // Vague d'abomination du siège : fonction pure du numéro de vague et de la graine.
 function siegeWave(kind,wave,seed){
  const k=KINDS[kind];if(!k||!Number.isInteger(wave)||wave<k.rules.firstWave||wave>MAX_WAVE)return false;
  if((wave-k.rules.firstWave)%k.rules.every!==hash(seed,k.salt)%k.rules.every||giantWave(wave)||led(wave,seed))return false;
  return kind==='drag'?!siegeWave('fill',wave,seed):true;
 }
 function nextSiege(kind,from,seed){
  if(!Object.hasOwn(KINDS,kind))return null;
  for(let wave=Math.max(KINDS[kind].rules.firstWave,Math.floor(Number(from)||1)),n=0;n<SEARCH;wave++,n++)if(siegeWave(kind,wave,seed))return wave;
  return null;
 }
 const siegeKind=(wave,seed)=>KIND_IDS.find(kind=>siegeWave(kind,wave,seed))||null;
 // Côté d'entrée : le bord de la carte le plus proche du point. O9 (b) : sur un terrain (`sides`), parmi les seuls
 // côtés ouverts ; sans `sides`, les quatre (même réduction qu'avant).
 function edgeOf(x,y,size,sides){const d={north:y,south:size-y,west:x,east:size-x},list=openSides(sides);return list.reduce((a,b)=>d[b]<d[a]?b:a,list[0]);}
 const bodies=n=>n+' corps';
 function installSiege(g,doc=root.document){
  if(g.abominationsSiege217)return g.abominationsSiege217;if(!g.expansions)throw Error('Installer les opérations avant les abominations du siège 217.');
  let state=siegeInitial(),ref=null,seenPhase=null,clock=-Infinity,node=null,title=null,text=null,shown=null;
  const forget=()=>{ref=null;seenPhase=null;clock=-Infinity;shown=null;};
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const seed=()=>g.world?.seed??0,size=()=>(g.local||C.LOCAL_MAP217).size;
  const say=(message,tone)=>g.notify?.(message,tone);
  const now=()=>state.current&&state.current.wave===g.wave?state.current:null;
  function body(){
   const c=now();if(!c||c.status!=='alive'||!c.id)return null;
   if(ref&&ref.id===c.id&&(ref.dead||g.zombies.includes(ref)))return ref;
   ref=g.zombies.find(z=>z.id===c.id)||null;return ref;
  }
  const openDitches=()=>{try{return g.earthworks217?.active?.()?g.earthworks217.tally().open:0;}catch(error){return 0;}};
  function walled(){for(const b of g.world?.buildings?.values?.()||[])if(b&&!b.dead&&b.completed&&b.def?.wall&&b.type!=='core')return true;return false;}
  // Abominations déjà présentes : géants du siège vertical et Meneuse debout (au bord ou dans la horde).
  function present(){
   let n=0;
   try{n+=g.vertical175?.presentation?.()?.giants?.length||0;}catch(error){/* siège vertical absent */}
   try{const l=g.abominations217?.snapshot?.()?.led;if(l&&l.id&&l.wave===g.wave&&(l.status==='alive'||l.status==='gathered')&&g.zombies.some(z=>z.id===l.id&&!z.dead))n++;}catch(error){/* vagues menées absentes */}
   return n;
  }
  const ruleText=kind=>kind==='fill'?'les corps qui tombent à moins de '+Math.round(SF.radius/32)+' m d’elle comptent '+(1+SF.extra)+' fois dans les fossés':'au contact d’un mur ou d’une porte, son épave de tôle et de câbles reste au pied : '+SD.load+' de charge de corps en plus';
  // Avant : annoncée à l'alerte, ou au plus tard au lancement de l'assaut. Sans fossé (ou sans mur), elle ne vient pas.
  function expect(){
   if(now())return;
   const kind=siegeKind(g.wave,seed());if(!kind)return;
   if(kind==='fill'?openDitches()<SF.minDitches:!walled())return;
   state.current={wave:g.wave,kind,status:'expected',from:0,id:0,side:'',count:0,wall:0};
   say(kind==='fill'?'Vague '+g.wave+' : une Comble-fossé marche dans la horde. Elle pousse les corps devant elle : '+ruleText(kind)+'. Abattez-la avant la ligne de fossés.'
    :'Vague '+g.wave+' : une Traîne-épave marche dans la horde, empêtrée de tôle et de câbles. Si elle atteint un mur ou une porte, son épave reste au pied : '+SD.load+' de charge de corps en plus.','danger');
  }
  // Pendant : désignée parmi les Errantes déjà entrées, la plus récente, une fois la part réglée de l'effectif entrée.
  function designate(){
   const c=now();if(!c||c.status!=='expected'||g.phase!=='assault'||!g.wavePlan)return;
   const left=(g.spawnQueue?.length||0)+C.spawnCount(g.pendingSpawns||{}),entered=g.wavePlan.total-left;
   if(entered<Math.max(1,Math.ceil(g.wavePlan.total*KINDS[c.kind].rules.lead))&&left>0)return;
   // Plus aucune Errante à entrer : n'importe quelle infectée ordinaire de cet assaut fait l'affaire.
   const any=!(g.pendingSpawns?.walker>0)&&!(g.spawnQueue||[]).includes('walker');
   let pick=null;for(const z of g.zombies)if(z&&!z.dead&&z.id>=c.from&&(z.kind==='walker'||any)&&(!pick||z.id>pick.id))pick=z;
   if(!pick){if(!left)c.status='absent';return;}
   if(present()>=R.cap){c.status='absent';say('Vague '+c.wave+' : '+KINDS[c.kind].name+' perdue dans la masse, '+R.cap+' abominations sont déjà là.','normal');return;}
   c.status='alive';c.id=pick.id;c.side=edgeOf(pick.x,pick.y,size(),g.world?.terrain217?.sides);ref=pick;
   say(KINDS[c.kind].name+' entrée '+WHERE[c.side]+' avec la horde : '+ruleText(c.kind)+'. Abattez-la tôt.','danger');
  }
  // Traîne-épave au contact d'un mur ou d'une porte : l'épave reste au pied, sur la charge de corps du jeu.
  function drop(){
   const c=now();if(!c||c.kind!=='drag'||c.status!=='alive'||c.count)return;
   const z=body();if(!z||z.dead||typeof g.nearestWall!=='function')return;
   const wall=g.nearestWall(z.x,z.y,SD.reach,true);if(!wall||!wall.def?.wall)return;
   wall.corpseLoad=(Number(wall.corpseLoad)||0)+SD.load;c.count=1;c.wall=wall.id;
   say('Traîne-épave contre '+(wall.def.gate?'la porte':'le mur')+' '+WHERE[c.side]+' : son épave reste au pied, '+SD.load+' de charge de corps en plus. Déblayez avant qu’elle ne fasse rampe.','danger');
  }
  // Après : abattue, son effet s'arrête ; le bilan est donné une fois.
  function sync(){
   const c=now(),z=body();if(!c||!z||!z.dead)return;
   c.status='slain';ref=null;
   if(c.kind==='fill')say(c.count?'Comble-fossé abattue '+WHERE[c.side]+' : '+bodies(c.count)+' de plus poussés dans les fossés. Faites-les déblayer.':'Comble-fossé abattue '+WHERE[c.side]+' avant les fossés : aucun corps de plus.',c.count?'normal':'good');
   else say(c.count?'Traîne-épave abattue '+WHERE[c.side]+' : son épave reste au pied du mur, à déblayer.':'Traîne-épave abattue '+WHERE[c.side]+' avant les murs : son épave reste loin des défenses.',c.count?'normal':'good');
  }
  function tick(){
   if(!state.active||!playing())return;
   if(seenPhase!==null&&seenPhase!==g.phase&&g.phase==='warning')expect();
   designate();sync();drop();
   // Assaut fini sans qu'elle soit entrée : rien de plus à signaler.
   const c=now();if(c&&c.status==='expected'&&(g.phase==='aftermath'||g.phase==='calm'))c.status='absent';
   seenPhase=g.phase;
  }
  // Comble-fossé : un corps tombé près d'elle dans un fossé ouvert y compte `extra` fois de plus.
  const kill=g.killZombie;
  if(typeof kill==='function')g.killZombie=function(z,...rest){
   const c=state.active&&z&&!z.dead?now():null,f=c&&c.kind==='fill'&&c.status==='alive'?body():null;
   const near=Boolean(f&&!f.dead&&f!==z&&(z.x-f.x)**2+(z.y-f.y)**2<=SF.radius**2),pose=near?g.vertical175?.corpsePose?.(z):null,x=z?.x,y=z?.y;
   const result=kill.call(this,z,...rest);
   if(near&&z.dead&&!(Number.isFinite(pose?.z)&&pose.z>0))for(let i=0;i<SF.extra;i++)if(g.earthworks217?.receive?.(x,y))c.count++;
   return result;
  };
  const start=g.startAssault;
  if(typeof start==='function')g.startAssault=function(...args){
   if(state.active&&playing()){expect();const c=now();if(c&&c.status==='expected')c.from=Math.max(0,Math.min(MAX_ID,Math.floor(Number(g.nextId)||0)));}
   return start.apply(this,args);
  };
  const update=g.update;
  if(typeof update==='function')g.update=function(...args){const result=update.apply(this,args);tick();return result;};
  // Vue pour la présentation : nulle hors vague d'abomination.
  function mark(){
   if(!state.active||!playing())return null;
   const c=now();if(!c||c.status!=='alive'&&c.status!=='expected')return null;
   const z=c.status==='alive'?body():null;if(c.status==='alive'&&(!z||z.dead))return null;
   const k=KINDS[c.kind];
   return Object.freeze({wave:c.wave,kind:c.kind,name:k.name,mark:k.mark,status:c.status,side:c.side,along:z?(c.side==='north'||c.side==='south'?z.x:z.y):null,x:z?z.x:null,y:z?z.y:null,count:c.count,wall:c.wall,health:z?z.health:null,maxHealth:z?z.maxHealth:null});
  }
  function line(){
   if(!state.active||!playing())return'';
   const c=now();
   if(c){
    const k=KINDS[c.kind],where=c.side?WHERE[c.side]:'';
    if(c.status==='expected')return'Vague '+c.wave+' : une '+k.name+' est annoncée dans la horde — '+ruleText(c.kind)+'.';
    if(c.status==='absent')return'Vague '+c.wave+' : la '+k.name+' annoncée n’est pas entrée.';
    if(c.kind==='fill')return c.status==='alive'?'Vague '+c.wave+' : Comble-fossé dans la horde '+where+' — '+ruleText('fill')+' ('+bodies(c.count)+' de plus pour l’instant). Abattez-la avant la ligne de fossés.'
     :'Vague '+c.wave+' : Comble-fossé abattue '+where+', '+(c.count?bodies(c.count)+' de plus poussés dans les fossés.':'avant les fossés.');
    if(c.status==='alive')return'Vague '+c.wave+' : Traîne-épave dans la horde '+where+(c.count?' — son épave est déjà au pied du mur : '+SD.load+' de charge de corps en plus.':' — '+ruleText('drag')+'. Abattez-la avant les murs.');
    return'Vague '+c.wave+' : Traîne-épave abattue '+where+(c.count?', son épave reste au pied du mur.':', avant les murs.');
   }
   const fill=nextSiege('fill',g.wave,seed()),drag=nextSiege('drag',g.wave,seed()),parts=[];
   if(fill!==null)parts.push('Comble-fossé : vague '+fill+(openDitches()>=SF.minDitches?'':', si la cité a des fossés'));
   if(drag!==null)parts.push('Traîne-épave : vague '+drag);
   return parts.length?'Prochaines abominations du siège — '+parts.join(' · ')+'.':'';
  }
  const capital=t=>t.charAt(0).toUpperCase()+t.slice(1);
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : ni Comble-fossé ni Traîne-épave. La règle ne s’active pas en cours de campagne.',rows:[
    {label:'Comble-fossé',value:'Sans objet.'},{label:'Traîne-épave',value:'Sans objet.'}]};
   const fill=g.world?nextSiege('fill',g.wave,seed()):null,drag=g.world?nextSiege('drag',g.wave,seed()):null;
   return{summary:'Deux abominations marchent parfois dans la horde. D’apparence et de points de vie ordinaires, elles ne frappent pas plus fort : elles changent ce que fait la horde. Abattues tôt, leur effet n’a pas lieu.',rows:[
    {label:'Comble-fossé',value:'À partir de la vague '+SF.firstWave+', une vague sur '+SF.every+', seulement si la cité a des fossés ouverts. '+capital(ruleText('fill'))+' : la ligne se comble bien plus vite. Prochaine : '+(fill===null?'aucune en vue':'vague '+fill)+'.'},
    {label:'Traîne-épave',value:'À partir de la vague '+SD.firstWave+', une vague sur '+SD.every+'. '+capital(ruleText('drag'))+', une fois : l’amas fait rampe plus tôt. Prochaine : '+(drag===null?'aucune en vue':'vague '+drag)+'.'},
    {label:'Règle',value:'Jamais une vague de géants ni une vague menée. Elle entre avec la horde, une Errante parmi d’autres : rien n’est ajouté à l’effectif. '+R.cap+' abominations au plus à la fois, géants et Meneuse compris.'},
    {label:'En cours',value:line()||'Aucune.'}]};
  }
  // Marqueur sobre au sol et sur la carte réduite. Lecture seule.
  const ground=g.drawGround;
  if(typeof ground==='function')g.drawGround=function(...args){
   const result=ground.apply(this,args);
   try{
    const ctx=args[0],m=ctx&&playing()?mark():null;
    if(m&&m.x!==null&&typeof ctx.arc==='function'){
     ctx.save();ctx.strokeStyle='rgba(196,186,156,.8)';ctx.lineWidth=1.5;ctx.setLineDash?.([3,4]);ctx.beginPath();ctx.arc(m.x,m.y,24,0,TAU);ctx.stroke();ctx.setLineDash?.([]);
     ctx.fillStyle='rgba(196,186,156,.9)';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText?.(m.mark,m.x,m.y-32);
     if(m.kind==='fill'){ctx.strokeStyle='rgba(196,186,156,.25)';ctx.lineWidth=1;ctx.setLineDash?.([2,8]);ctx.beginPath();ctx.arc(m.x,m.y,SF.radius,0,TAU);ctx.stroke();ctx.setLineDash?.([]);}
     else if(!m.count){ctx.strokeStyle='rgba(120,116,104,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x+9,m.y+15);ctx.lineTo(m.x-6,m.y+19);ctx.stroke();ctx.fillStyle='rgba(88,86,78,.85)';ctx.fillRect?.(m.x-9,m.y+14,16,7);}
     ctx.restore();
    }
    const c=ctx&&state.active?now():null,wall=c&&c.kind==='drag'&&c.wall?g.world?.buildings?.get?.(c.wall):null;
    if(wall&&!wall.dead&&wall.corpseLoad>0&&typeof ctx.strokeRect==='function'){
     ctx.save();ctx.strokeStyle='rgba(150,146,132,.7)';ctx.lineWidth=1.5;ctx.setLineDash?.([4,4]);ctx.strokeRect(wall.left-4,wall.top-4,wall.right-wall.left+8,wall.bottom-wall.top+8);ctx.setLineDash?.([]);
     ctx.fillStyle='rgba(196,186,156,.85)';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText?.('ÉPAVE',(wall.left+wall.right)/2,wall.top-8);ctx.restore();
    }
   }catch(error){/* le marqueur ne doit jamais interrompre le rendu */}
   return result;
  };
  const minimap=g.renderMinimap;
  if(typeof minimap==='function')g.renderMinimap=function(...args){
   const result=minimap.apply(this,args);
   try{
    const ctx=this.mctx,m=ctx&&this.minimap&&playing()?mark():null;
    if(m&&m.x!==null&&typeof ctx.arc==='function'){const sx=this.minimap.width/size(),sy=this.minimap.height/size();ctx.save();ctx.strokeStyle='#c4ba9c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(m.x*sx,m.y*sy,4,0,TAU);ctx.stroke();ctx.restore();}
   }catch(error){/* idem */}
   return result;
  };
  // Ligne du dossier de situation, sous celle des vagues menées quand elle existe.
  function render(){
   if(!doc?.createElement||!doc.getElementById)return false;
   const value=line();
   if(!node){
    const host=doc.getElementById('rightPanel');if(!host)return false;
    node=doc.createElement('section');node.id='abominationsSiege217Readout';node.className='siege-readout';node.setAttribute?.('aria-label','Abominations du siège');
    const card=doc.createElement('article');card.className='siege-readout-card';
    const small=doc.createElement('small');small.textContent='ABOMINATION DU SIÈGE';title=doc.createElement('h3');title.id='abominationsSiege217Title';text=doc.createElement('p');text.id='abominationsSiege217Line';text.className='siege-readout-note';
    card.append?card.append(small,title,text):[small,title,text].forEach(n=>card.appendChild(n));node.appendChild(card);
    const box=doc.getElementById('abominations217Readout')||doc.getElementById('siegeReadout');
    if(box&&box.parentNode===host&&typeof host.insertBefore==='function')host.insertBefore(node,box.nextSibling||null);else host.appendChild(node);
   }
   node.hidden=!value;
   if(value!==shown){shown=value;const c=now();title.textContent=c?(c.status==='slain'?KINDS[c.kind].name+' abattue':c.status==='absent'?'Aucune abomination entrée':KINDS[c.kind].name+(c.side?' '+WHERE[c.side]:' annoncée')):'Aucune abomination en vue';text.textContent=value;}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const t=Number(g.elapsed)||0;if(t<clock||t-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=t;try{render();}catch(error){/* DOM partiel */}}return result;};
  const api=Object.freeze({active:()=>state.active,wave:(kind,wave)=>state.active&&Boolean(g.world)&&siegeWave(kind,wave,seed()),next:kind=>state.active&&g.world?nextSiege(kind,g.wave,seed()):null,
   current:()=>{const c=state.active?now():null;return c?Object.freeze({...c}):null;},mark,line,tick,render,overview,present,
   actions:()=>[],snapshot:()=>{if(state.active&&playing())sync();return siegeValidate(state);}});g.abominationsSiege217=api;
  g.expansions.register({id:'abominationsSiege217',title:'Abominations du siège',overview,actions:api.actions,validate:siegeValidate,snapshot:api.snapshot,
   restore:raw=>{state=siegeValidate(raw);forget();},reset:()=>{state=siegeFresh();forget();}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,hash,led,nextLed,post,posts,openSides,frameOf,escortSize,escortKinds,take,ring,gain,cut,shift,gather,disperse,install,
  siegeInitial,siegeFresh,siegeValidate,siegeWave,nextSiege,siegeKind,edgeOf,installSiege});root.DeadwallAbominations217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions){install(root.DEADWALL,root.document);installSiege(root.DEADWALL,root.document);}
})(globalThis);
