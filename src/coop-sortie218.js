// Coopération, chef de sortie (specs/cooperation, tranche C7, décision D1-B ; sac versé au dépôt, D4).
// Seconde bulle régionale détachée de `g.player` : un invité explore la région pendant que l'hôte tient le mur.
// La bulle de l'hôte reste celle de `src/frontier.js`, inchangée ; celle-ci est un objet de session créé par l'adaptateur
// hôte (`src/coop-host217.js`) et avancée par son enveloppe de `update`, siège par siège. Elle lit le monde régional par
// les accesseurs publics de `g.frontier` et partage avec l'hôte, dans l'ordre (hôte, puis sièges croissants) :
// - les prélèvements (`takeFromSite`, mêmes contenants, mêmes gardes, même limite du carnet) ;
// - le registre des contacts de lieu (`enemyHealth`, `recordContact218`) et les découvertes (`revealSites`).
// Elle garde pour elle : ses contacts vivants (jamais ceux de la bulle de l'hôte), ses poursuites, son bruit. Elle ne lit ni
// n'écrit la faune, les véhicules, la voiture de l'hôte, ses traces ni son sac ; elle n'utilise aucun tirage aléatoire.
// Sans session ouverte, aucune bulle n'existe : la région solo garde ses tirages, son ordre et sa sauvegarde.
// Le peintre `paint` (vue de dessus régionale de l'invité) ne fait que lire l'image reçue.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCoopSortie218=api;
})(globalThis,function(root){
 'use strict';
 const lib=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=lib('DeadwallCore','./core.js');
 const K=C?.CoopSortie217Rules,TAU=Math.PI*2,clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),round1=v=>Math.round(v*10)/10;
 const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
 const SIDES=Object.freeze(['north','east','south','west']);

 // ---- Bulle de session (hôte seulement).
 function createBubble(g,options={}){
  const G=lib('DeadwallFrontierGeometry','./frontier-geometry.js'),Survey=lib('DeadwallFrontierSurvey','./frontier-survey.js'),P=lib('DeadwallAtlasProjection','./atlas-projection.js');
  const W=lib('DeadwallFrontierWorld','./frontier-world.js'),T=C.FrontierTacticsRules;
  const F=g?.frontier;if(!K||!G||!Survey||!P||!W||!T||!F?.world||!F.takeFromSite||!F.recordContact218)return null;
  const A=K.avatar,B=K.bubble,R=W.RULES,seat=options.seat,name=String(options.name||'Invité');
  const pour=typeof options.pour==='function'?options.pour:()=>0,tell=typeof options.tell==='function'?options.tell:()=>{};
  const ammoStock=()=>Math.floor(Number(g.resources?.ammo)||0);
  const enemies=new Map(),shots=[];
  let start=null,near=[],spawnClock=0,pulse=0,searching=null,note='',lastHome=true,gathered=0,kills=0,disposed=false;
  const av={seat,name,role:'sortie',x:0,y:0,z:0,a:0,inside:null,quiet:false,car:null,health:A.health,maxHealth:A.health,dead:false,respawn:0,invulnerable:A.invulnerable,
   reload:0,fireCooldown:0,mag:0,bag:C.makeBag(),move:{x:0,y:0},fire:false,search:false};
  const world=()=>F.world();
  const home=()=>{try{return P.home(g);}catch(error){return null;}};
  const outside=(w,x,y,pad)=>w.outside?w.outside(x,y,pad):x<pad||y<pad||x>w.size-pad||y>w.size-pad;
  const generation=()=>{try{return F.position().generation;}catch(error){return 3;}};
  // Même pas de collision que la marche de la bulle de l'hôte, sans véhicule.
  function clear(w,x,y){if(generation()<4&&P.homeBarrier(x,y,g))return false;if(outside(w,x,y,R.footRadius))return false;return!w.blocked(x,y,R.footRadius,0,av.inside);}
  function insideOf(){
   const C205=lib('DeadwallCodexCampaign205','./codex-campaign205.js');
   return near.find(p=>{const q=G.local(p,av.x,av.y);return q.x>0&&q.y>0&&q.x<p.w&&q.y<p.h&&(!p.campaign205||C205?.insideBuilding(p,av));})?.id||null;
  }
  // Point de départ : devant une jonction de D-17 (côté nord d'abord), dégagé ; repli latéral borné. Fonction du monde seul.
  function findStart(){
   const w=world(),size=(g.local||C.LOCAL_MAP217)?.size||4096;
   for(const side of SIDES){
    const mid=side==='north'?{x:size/2,y:0}:side==='south'?{x:size/2,y:size}:side==='east'?{x:size,y:size/2}:{x:0,y:size/2};
    let base;try{base=P.exitPosition(mid,side,g);}catch(error){continue;}
    for(let d=0;d<=48;d+=4)for(const sign of d?[1,-1]:[1]){
     const ew=side==='east'||side==='west',x=base.x+(ew?0:sign*d),y=base.y+(ew?sign*d:0);
     try{w.prefetch?.(x,y,1);}catch(error){}
     if(clear(w,x,y))return{x,y,a:side==='north'?-Math.PI/2:side==='south'?Math.PI/2:side==='east'?0:Math.PI,side};
    }
   }
   return null;
  }
  function draw(){const take=Math.max(0,Math.min(A.magazine-av.mag,ammoStock()));if(take>0){g.resources.ammo-=take;av.mag+=take;}return take;}
  // Retour aux portes : le sac est versé au stock de l'hôte dans la capacité de stockage (`pour` retire du sac ce qu'il
  // a posé ; un dépôt plein laisse le reste au sac). Le chargeur reste à l'avatar : il est compté à chaque sauvegarde.
  function deposit(){return C.bagTotal(av.bag)>0?pour(av.bag):0;}
  function place(){
   start=start||findStart();if(!start)return false;
   enemies.clear();Object.assign(av,{x:start.x,y:start.y,a:start.a,inside:null,dead:false,health:A.health,respawn:0,invulnerable:A.invulnerable,reload:0,fireCooldown:0});
   near=world().nearPOI(av.x,av.y,B.stream);draw();return true;
  }
  function hurt(amount){
   if(av.dead||av.invulnerable>0||!(amount>0))return false;
   av.health=Math.max(0,av.health-amount);
   if(av.health<=0){av.dead=true;av.respawn=A.respawnSeconds;av.fire=false;av.search=false;searching=null;av.bag.ammo=(av.bag.ammo||0)+av.mag;av.mag=0;deposit();for(const k of C.RESOURCE_KEYS)av.bag[k]=0;
    tell(name+' est à terre en région : sac versé au dépôt, retour aux portes dans '+A.respawnSeconds+' s.','danger');}
   return true;
  }
  // Contacts de lieu : mêmes identifiants, niveaux, profils et santé de registre que la bulle de l'hôte ; seulement au sol.
  function spawnPoint(w,p,index,firstGround){
   const out=[];
   if(index===firstGround)for(let row=0;row<4;row++)for(const t of [.5,.25,.75,.12,.88]){out.push(G.global(p,p.w*t,p.h+1.2+row*1.1));out.push(G.global(p,p.w*t,-1.2-row*1.1));}
   out.push(G.global(p,p.w/2,p.h/2+Math.min(index,2)*.9));
   for(let k=0;k<64;k++)out.push(G.global(p,.65+(p.w-1.3)*(G.hash(p.id,index,k,'x')%10001)/10000,.65+(p.h-1.3)*(G.hash(p.id,index,k,'y')%10001)/10000));
   return out.find(q=>!w.blocked(q.x,q.y,T.enemyRadius,0,null)&&![...enemies.values()].some(e=>Math.hypot(e.x-q.x,e.y-q.y)<T.enemyRadius*2));
  }
  // Un contact repris par la bulle de l'hôte n'existe qu'une fois : il quitte celle-ci à chaque pas (sa santé est au registre).
  function hostContacts(){const host=new Set();try{for(const e of F.contacts())host.add(e.id);}catch(error){}for(const id of [...enemies.keys()])if(host.has(id))enemies.delete(id);return host;}
  function spawn(w,host){
   near=w.nearPOI(av.x,av.y,B.stream);
   const seen=new Set(F.discoveries?.()||[]),found=[];
   for(const p of near){
    const d=Math.hypot(p.x-av.x,p.y-av.y);
    if(d<R.discover&&!seen.has(p.id))found.push(p);
    if(d>B.spawnReach+Math.hypot(p.w,p.h)/2)continue;
    const count=w.threatCount(p)+(g.remarkable217?.nestExtra?.(w,p)||0)+(g.outposts217?.siteExtra?.(w,p)||0),source=p.legacyLevels160||p.levels;
    const levels=Array.from({length:count},(_,i)=>source[G.hash(p.id,i)%source.length]),firstGround=levels.indexOf(0);
    for(let i=0;i<count&&enemies.size<B.maxEnemies;i++){
     const id=p.id+':e'+i;if(levels[i]!==0||enemies.has(id)||host.has(id)||F.enemyHealth(id)===0)continue;
     const pos=spawnPoint(w,p,i,firstGround);if(!pos)continue;
     const occupant=w.unbounded?w.occupants?.(p)?.[i]:null;
     const profile=occupant?{...C.BiomeRules135.enemies[occupant.kind],id:occupant.kind,kind:occupant.kind,health:occupant.health,biome:p.biome}:generation()>=6?(w.biomes||root.DeadwallBiomes135)?.enemyProfile(w.seed,p.x,p.y,id,{generation:generation()}):null;
     const hp=F.enemyHealth(id)??profile?.health??65;
     enemies.set(id,{...(profile?{kind:profile.kind,maxHealth:profile.health,biomeProfile:profile}:{}),id,poi:p.id,z:0,x:pos.x,y:pos.y,a:G.hash(id,'facing')/4294967296*TAU,hp,cool:0,mode:'idle',ttl:0,gx:pos.x,gy:pos.y,path:null,repath:0});
    }
   }
   if(found.length){F.revealSites(found.map(p=>p.id));note='Découverte : '+found[0].name;tell(name+' a repéré '+found.map(p=>p.name).slice(0,2).join(', ')+'.');}
   for(const [id,e] of enemies)if(Math.hypot(e.x-av.x,e.y-av.y)>B.despawn)enemies.delete(id);
  }
  const blockedFor=(w,x,y)=>w.blocked(x,y,T.enemyRadius,0,null);
  function hear(w,radius){if(radius>0)Survey.hear(w,enemies.values(),av,radius,T);}
  function enemyTurn(w,dt){
   const budget={left:T.pathBudget};
   for(const e of enemies.values()){
    Survey.step(w,e,av,dt,e.biomeProfile?{...T,enemySpeed:e.biomeProfile.speed}:T,budget,(x,y)=>blockedFor(w,x,y));
    if(Math.hypot(av.x-e.x,av.y-e.y)<.9&&e.cool===0&&w.line(e,av,0,null,null,.015)){hurt(e.biomeProfile?.damage??8);e.cool=e.biomeProfile?.interval??1.15;}
   }
  }
  // Tir : trait sans dispersion (aucun tirage) ; le premier contact dans l'axe, à vue, prend le coup.
  function fire(w){
   if(!av.fire||av.reload>0||av.fireCooldown>0)return;
   if(av.mag<1){if(ammoStock()>=1)av.reload=A.reload;return;}
   av.mag-=1;av.fireCooldown=1/A.fireRate;
   const dx=Math.cos(av.a),dy=Math.sin(av.a);let best=null,reach=A.range;
   for(const e of enemies.values()){const ex=e.x-av.x,ey=e.y-av.y,along=ex*dx+ey*dy;if(along<=0||along>reach)continue;if(Math.abs(ex*dy-ey*dx)>T.enemyRadius+A.aimWidth)continue;if(!w.line(av,e,0,av.inside,null,.015))continue;best=e;reach=along;}
   shots.push({x:av.x,y:av.y,x2:av.x+dx*reach,y2:av.y+dy*reach,t:K.frame.shotSeconds});while(shots.length>K.frame.maxShots)shots.shift();
   if(best){best.hp=Math.max(0,best.hp-A.damage);F.recordContact218(best.id,best.hp);if(best.hp===0){enemies.delete(best.id);kills++;}}
   hear(w,B.shotNoise);
   if(av.mag<1&&ammoStock()>=1)av.reload=A.reload;
  }
  // Fouille : lieu dont l'emprise est à portée ; ressources libres dans l'ordre des clés ; prélèvement partagé avec l'hôte.
  function search(w,dt){
   searching=null;if(!av.search)return;
   const site=near.map(p=>{const q=G.local(p,av.x,av.y),dx=Math.max(0,-q.x,q.x-p.w),dy=Math.max(0,-q.y,q.y-p.h);return{p,d:Math.hypot(dx,dy)};}).filter(o=>o.d<=A.lootReach).sort((a,b)=>a.d-b.d||(a.p.id<b.p.id?-1:1))[0]?.p;
   if(!site){note='Aucun lieu à fouiller à portée.';return;}
   if([...enemies.values()].some(e=>e.hp>0&&Math.hypot(e.x-av.x,e.y-av.y)<A.clearRange&&w.line(e,av,0,null,null,.015))){note='Écartez les infectés avant de fouiller.';return;}
   const stock=F.siteStock(site.id);if(!stock){note='Lieu illisible.';return;}
   const key=C.RESOURCE_KEYS.find(k=>stock.free[k]>.00001);
   if(!key){note=site.name+' : plus rien de libre à prendre.';return;}
   const room=A.carry-C.bagTotal(av.bag);if(room<=.00001){note='Sac plein : rentrez aux portes de D-17.';return;}
   const want=Math.min(room,stock.free[key],A.lootRate*dt*(Number(g.difficulty?.resourceYield)||1));
   const got=F.takeFromSite(site.id,key,want);if(!(got>0)){note=site.name+' : contenants fermés.';return;}
   av.bag[key]+=got;gathered+=got;if(g.stats)g.stats.gathered=(Number(g.stats.gathered)||0)+got;
   searching={id:site.id,name:site.name,resource:key};note='Fouille : '+site.name;
   if(pulse<=0){hear(w,B.workNoise);pulse=B.pulse;}
  }
  function atHome(){const h=home();if(!h)return false;const dx=Math.max(0,h.minX-av.x,av.x-h.maxX),dy=Math.max(0,h.minY-av.y,av.y-h.maxY);return Math.hypot(dx,dy)<=A.homeReach;}
  function step(dt){
   if(disposed||!(dt>0))return;
   dt=Math.min(.1,dt);const w=world();
   for(const s of shots)s.t-=dt;while(shots.length&&shots[0].t<=0)shots.shift();
   av.invulnerable=Math.max(0,av.invulnerable-dt);av.fireCooldown=Math.max(0,av.fireCooldown-dt);pulse=Math.max(0,pulse-dt);
   if(av.dead){av.respawn=Math.max(0,av.respawn-dt);if(av.respawn<=0)place();return;}
   if(av.reload>0){av.reload-=dt;if(av.reload<=0){av.reload=0;draw();}}
   try{w.prefetch?.(av.x+Math.cos(av.a)*3,av.y+Math.sin(av.a)*3,1);}catch(error){}
   const n=Math.hypot(av.move.x,av.move.y);
   if(n>0){av.search=false;const dx=av.move.x/n*A.walk*dt,dy=av.move.y/n*A.walk*dt,parts=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.16));
    for(let i=0;i<parts;i++){const x=av.x+dx/parts,y=av.y+dy/parts;if(clear(w,x,av.y))av.x=x;if(clear(w,av.x,y))av.y=y;}
    av.inside=insideOf();}
   const host=hostContacts();spawnClock-=dt;if(spawnClock<=0){spawnClock=B.spawnEvery;spawn(w,host);}
   fire(w);search(w,dt);enemyTurn(w,dt);
   const home=atHome();
   if(home&&!lastHome||home&&C.bagTotal(av.bag)>0){const moved=deposit();if(moved>0)tell(name+' est rentré aux portes : '+Math.round(moved)+' versé(s) au dépôt.','good');}
   lastHome=home;
  }
  function intent(kind,data){
   if(kind==='move')av.move={x:data.x,y:data.y};
   else if(kind==='aim')av.a=wrapAngle(data.a);
   else if(kind==='fire'){av.fire=data.on;if(data.on)av.search=false;}
   else if(kind==='search')av.search=data.on&&!av.dead;
   else if(kind==='ping'){tell('Signal de '+name+' en région.');}
  }
  // Sac compté dans chaque sauvegarde (D4) : chargeur et sac, sans clé nouvelle.
  const carried=()=>({...av.bag,ammo:(av.bag.ammo||0)+av.mag});
  // Image régionale : lieux et contacts du rayon, en mètres, nombres arrondis, aucune référence vers la bulle.
  function view(){
   const Fr=K.frame,w=world(),seen=new Set(F.discoveries?.()||[]),h=home();
   const sites=w.nearPOI(av.x,av.y,Fr.radius).filter(p=>Math.hypot(p.x-av.x,p.y-av.y)<=Fr.radius+Math.hypot(p.w,p.h)/2).sort((a,b)=>Math.hypot(a.x-av.x,a.y-av.y)-Math.hypot(b.x-av.x,b.y-av.y)).slice(0,Fr.maxSites)
    .map(p=>{let free=0;if(seen.has(p.id)){const s=F.siteStock(p.id);if(s)free=Math.round(C.bagTotal(s.free));}return[p.id,round1(p.x),round1(p.y),round1(p.w),round1(p.h),+(p.a||0).toFixed(3),String(p.name||p.id).slice(0,32),String(p.type||'').slice(0,16),free,seen.has(p.id)?1:0];});
   const list=[...enemies.values()].filter(e=>Math.hypot(e.x-av.x,e.y-av.y)<=Fr.radius).sort((a,b)=>Math.hypot(a.x-av.x,a.y-av.y)-Math.hypot(b.x-av.x,b.y-av.y)).slice(0,Fr.maxEnemies)
    .map(e=>[String(e.id),round1(e.x),round1(e.y),Math.round((e.a||0)*100),e.maxHealth>0?Math.round(clamp(e.hp/e.maxHealth,0,1)*100):Math.round(clamp(e.hp/65,0,1)*100),e.mode==='chase'?2:e.mode==='investigate'?1:0]);
   let hostPose=null;try{const q=F.position();if(q.active&&Math.hypot(q.x-av.x,q.y-av.y)<=Fr.radius*1.5)hostPose=[round1(q.x),round1(q.y),q.z||0];}catch(error){}
   const bag={};for(const k of C.RESOURCE_KEYS)if(av.bag[k]>.05)bag[k]=round1(av.bag[k]);
   return{v:2,region:1,scale:Fr.scale,radius:Fr.radius,
    self:{x:round1(av.x),y:round1(av.y),a:+av.a.toFixed(2),hp:Math.round(av.health),max:av.maxHealth,dead:av.dead?1:0,respawn:+av.respawn.toFixed(1),mag:av.mag,reload:+av.reload.toFixed(1),speed:A.walk,inside:av.inside},
    bag,load:round1(C.bagTotal(av.bag)),cap:A.carry,search:searching?[searching.id,searching.name,searching.resource]:null,note,kills,
    home:h?[round1(h.minX),round1(h.minY),round1(h.maxX),round1(h.maxY)]:null,atHome:lastHome?1:0,
    sites,enemies:list,shots:shots.map(s=>[round1(s.x),round1(s.y),round1(s.x2),round1(s.y2)]),regionHost:hostPose};
  }
  function dispose(){if(disposed)return 0;disposed=true;const bag=carried();av.mag=0;for(const k of C.RESOURCE_KEYS)av.bag[k]=0;enemies.clear();shots.length=0;return pour(bag);}
  if(!place())return null;
  return Object.freeze({seat,name,role:'sortie',step,intent,view,carried,dispose,hurt,
   pose:()=>({x:av.x,y:av.y,a:av.a,z:0,inside:av.inside,dead:av.dead,health:av.health}),
   contacts:()=>[...enemies.values()].map(e=>({id:e.id,poi:e.poi,x:e.x,y:e.y,hp:e.hp,mode:e.mode})),
   stats:()=>({gathered,kills,load:C.bagTotal(av.bag),mag:av.mag}),
   start:()=>start&&{...start}});
 }

 // ---- Peintre de l'invité en région : vue de dessus en mètres. `state` : {prev, cur, t, self, width, height, aim}.
 function paint(ctx,state){
  const cur=state?.cur;if(!ctx||!cur?.region)return false;
  const W=state.width,H=state.height,self=state.self||cur.self,scale=Number(cur.scale)||K?.frame?.scale||12,lerp=(a,b,t)=>a+(b-a)*t,t=clamp(state.t??1,0,1);
  ctx.save();
  ctx.fillStyle='#1b2019';ctx.fillRect(0,0,W,H);
  ctx.translate(W/2,H/2);ctx.scale(scale,scale);ctx.translate(-self.x,-self.y);
  const lw=1/scale;
  // Quadrillage de 10 m et emprise de D-17.
  const left=self.x-W/2/scale,top=self.y-H/2/scale,right=self.x+W/2/scale,bottom=self.y+H/2/scale;
  ctx.strokeStyle='rgba(140,150,120,.10)';ctx.lineWidth=lw;ctx.beginPath();
  for(let x=Math.floor(left/10)*10;x<=right;x+=10){ctx.moveTo(x,top);ctx.lineTo(x,bottom);}for(let y=Math.floor(top/10)*10;y<=bottom;y+=10){ctx.moveTo(left,y);ctx.lineTo(right,y);}ctx.stroke();
  if(Array.isArray(cur.home)){const [x0,y0,x1,y1]=cur.home;ctx.fillStyle='rgba(184,149,90,.10)';ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.strokeStyle='rgba(223,189,119,.75)';ctx.lineWidth=3*lw;ctx.strokeRect(x0,y0,x1-x0,y1-y0);}
  ctx.strokeStyle='rgba(223,189,119,.16)';ctx.lineWidth=lw;ctx.setLineDash?.([8*lw,8*lw]);ctx.beginPath();ctx.arc(cur.self.x,cur.self.y,cur.radius||70,0,TAU);ctx.stroke();ctx.setLineDash?.([]);
  for(const s of Array.isArray(cur.sites)?cur.sites:[]){
   if(!Array.isArray(s))continue;const [id,x,y,w,h,a,label,,free,seen]=s;
   ctx.save();ctx.translate(+x||0,+y||0);ctx.rotate(+a||0);
   ctx.fillStyle=seen?'#3f4a45':'#2c332f';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle=cur.search&&cur.search[0]===id?'#e7c86a':seen?'rgba(200,210,190,.55)':'rgba(120,130,120,.4)';ctx.lineWidth=(cur.search&&cur.search[0]===id?3:1.5)*lw;ctx.strokeRect(-w/2,-h/2,w,h);
   ctx.restore();
   if(typeof ctx.fillText==='function'){ctx.save();ctx.translate(+x||0,+y||0);ctx.scale(lw,lw);ctx.fillStyle=seen?'#dfe6d8':'#8e978a';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(seen?String(label)+(free>0?' · '+free:' · vide'):'?',0,4);ctx.restore();}
  }
  const before=new Map((state.prev?.region&&Array.isArray(state.prev.enemies)?state.prev.enemies:[]).filter(Array.isArray).map(e=>[e[0],e]));
  for(const e of Array.isArray(cur.enemies)?cur.enemies:[]){
   if(!Array.isArray(e))continue;const p=before.get(e[0]),x=p?lerp(+p[1],+e[1],t):+e[1],y=p?lerp(+p[2],+e[2],t):+e[2],a=(+e[3]||0)/100;
   ctx.fillStyle=e[5]===2?'#9a4a3c':e[5]===1?'#7d6a48':'#596052';ctx.strokeStyle='#0b0d0b';ctx.lineWidth=1.5*lw;ctx.beginPath();ctx.arc(x,y,.45,0,TAU);ctx.fill();ctx.stroke();
   ctx.strokeStyle='rgba(230,200,180,.6)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*.8,y+Math.sin(a)*.8);ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,226,160,.85)';ctx.lineWidth=2*lw;ctx.beginPath();for(const s of Array.isArray(cur.shots)?cur.shots:[]){if(Array.isArray(s)){ctx.moveTo(s[0],s[1]);ctx.lineTo(s[2],s[3]);}}ctx.stroke();
  const actor=(x,y,a,fill,label,dead)=>{ctx.globalAlpha=dead?.35:1;ctx.fillStyle=fill;ctx.strokeStyle='#0d1a1e';ctx.lineWidth=2*lw;ctx.beginPath();ctx.arc(x,y,.6,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#f3f6ef';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*1.4,y+Math.sin(a)*1.4);ctx.stroke();
   if(label&&typeof ctx.fillText==='function'){ctx.save();ctx.translate(x,y);ctx.scale(lw,lw);ctx.fillStyle='#f3f6ef';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(label,0,-14);ctx.restore();}ctx.globalAlpha=1;};
  if(Array.isArray(cur.regionHost))actor(cur.regionHost[0],cur.regionHost[1],0,'#d9b45f','COMMANDANT',false);
  actor(self.x,self.y,state.aim??self.a,'#9bd17a','VOUS',cur.self.dead);
  ctx.restore();
  return true;
 }
 const NAMES=Object.freeze({wood:'bois',stone:'pierre',scrap:'ferraille',food:'vivres',fuel:'carburant',ammo:'munitions',medicine:'remèdes'});
 function hud(cur){
  if(!cur?.region)return'';const s=cur.self,parts=['RÉGION · chef de sortie','Santé '+s.hp+'/'+s.max,'Chargeur '+s.mag+(s.reload>0?' (rechargement)':'')+' · stock de l’hôte '+(cur.ammo??0)];
  parts.push('Sac '+Math.round(cur.load||0)+'/'+(cur.cap||0)+(Object.keys(cur.bag||{}).length?' ('+Object.entries(cur.bag).map(([k,v])=>Math.round(v)+' '+(NAMES[k]||k)).join(', ')+')':''));
  if(s.dead)parts.push('À terre : retour aux portes dans '+Math.ceil(s.respawn)+' s');
  if(cur.search)parts.push('Fouille : '+cur.search[1]);else if(cur.note)parts.push(cur.note);
  if(cur.atHome)parts.push('Aux portes de D-17 : le sac est versé au dépôt');
  if(Number.isFinite(cur.wave))parts.push('Cité : vague '+cur.wave);
  return parts.join(' · ');
 }
 return Object.freeze({createBubble,paint,hud});
});
