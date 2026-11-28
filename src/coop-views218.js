// Coopération : vues 2,5D et FPS de l'invité (specs/cooperation, tranche C6.2 ; décisions D1–D7 du 23 novembre 2026).
// L'invité ne simule rien. Ce module lit l'image reçue de l'hôte (décodée par src/coop-ui217.js) et la fait peindre par
// les peintres existants : ceux de la vue de cité (méthodes de dessin de `Game`, art des bâtiments et des acteurs) et le
// peintre FPS WebGL de la citadelle (`DeadwallVertical175Render.createFPS`). Il leur prête une façade de lecture :
// - aucune méthode de simulation n'est appelée (ni `update`, ni génération, ni tirage, ni horloge de jeu) ;
// - le temps d'animation est celui de l'hôte (`e` de l'image), interpolé entre les deux dernières images ;
// - les objets d'affichage gardés d'une peinture à l'autre ne servent qu'à la continuité des allures.
// Sans WebGL, la vue FPS renvoie `false` : l'interface repasse sur le peintre de dessus.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCoopViews218=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{try{if(root.DEADWALL)api.install(root.DEADWALL,root.document);}catch(error){/* vues facultatives : la vue de dessus reste */}},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const lib=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=lib('DeadwallCore','./core.js');
 const TILE=C?.TILE||32,VR=C?.VerticalCitadel175,RULES=C?.CoopViews217Rules,ENEMIES=C?.ENEMIES||{};
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),lerp=(a,b,t)=>a+(b-a)*t,finite=Number.isFinite;
 const angleLerp=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
 const GUEST_MODULE='coop218';

 // Bâtiment d'affichage : mêmes accesseurs que le bâtiment de la partie (src/game.js), valeurs copiées de l'image.
 class Shown{
  constructor(b){this.read(b);this.dead=false;this.turretAngle=-Math.PI/2;this.flash=0;this.powered=true;this.underAttack=0;this.selected=false;this.priority=2;}
  read(b){
   this.id=b.id;this.type=b.type;this.gx=b.gx;this.gy=b.gy;this.w=b.w;this.h=b.h;this.rotation=b.rotation|0;this.geometryVersion202=b.gv===1?1:0;
   this.progress=b.flags&8?.5:1;this.gateMode=b.flags&4?'open':'auto';this.corpseLoad=b.corpses||0;this.hp=clamp(b.hp,0,100);return this;
  }
  get def(){try{return C.CityGeometry202.definition(this.type,this.geometryVersion202);}catch(error){return null;}}
  get x(){return (this.gx+this.w/2)*TILE;}get y(){return (this.gy+this.h/2)*TILE;}
  get left(){return this.gx*TILE;}get top(){return this.gy*TILE;}get right(){return (this.gx+this.w)*TILE;}get bottom(){return (this.gy+this.h)*TILE;}
  get completed(){return this.progress>=1;}get maxHealth(){return this.def?.health||100;}get health(){return Math.max(1,this.maxHealth*this.hp/100);}
  get size(){return[this.w,this.h];}
  contains(x,y,pad=0){return x>=this.left-pad&&x<=this.right+pad&&y>=this.top-pad&&y<=this.bottom+pad;}
 }

 // Façade de lecture d'une image : objets d'affichage seulement, jamais une référence vers l'image ni vers une partie.
 function createScene(){
  const buildings=new Map(),zombies=new Map(),units=new Map();
  // Les objets d'affichage sont repris d'une peinture à l'autre (allure continue) ; ceux qui sortent de l'image sont oubliés.
  function keep(store,id,make){let o=store.get(id);if(!o){o=make();store.set(id,o);}o.seen218=true;return o;}
  function sweep(store){for(const [id,o] of store){if(!o.seen218)store.delete(id);else o.seen218=false;}}
  function read(st){
   const cur=st?.cur;if(!cur)return null;
   const prev=st.prev,t=clamp(st.t??1,0,1),self=st.self||cur.self;
   const elapsed=finite(prev?.e)&&finite(cur.e)?lerp(prev.e,cur.e,t):Number(cur.e)||0;
   for(const b of cur.buildings||[]){if(!C.CityGeometry202||!Object.hasOwn(C.BUILDINGS||{},b.type))continue;keep(buildings,b.id,()=>new Shown(b)).read(b);}
   sweep(buildings);
   const before=new Map((prev?.zombies||[]).map(z=>[z.id,z]));
   for(const z of cur.zombies||[]){
    const p=before.get(z.id),d=ENEMIES[z.kind]||{radius:11,health:100},o=keep(zombies,z.id,()=>({id:z.id,kind:z.kind,anim:(z.id%17)*.37,charge:{stage:''},shieldImpact:0,rage:0,dead:false,maxHealth:100}));
    o.kind=z.kind;o.x=p?lerp(p.x,z.x,t):z.x;o.y=p?lerp(p.y,z.y,t):z.y;o.facing=p?angleLerp(p.facing||0,z.facing||0,t):z.facing||0;o.radius=d.radius||11;o.health=Math.max(1,z.hp??100);
   }
   sweep(zombies);
   const uBefore=new Map((prev?.units||[]).map(u=>[u.id,u])),actor=(id,make)=>keep(units,id,()=>({id,state:'guard',carry:0,maxCarry:1,supportActive:false,dead:false,radius:10,maxHealth:100,regionAbsent:false,...make}));
   for(const u of cur.units||[]){const p=uBefore.get(u.id),o=actor(u.id,{});o.kind=u.kind;o.x=p?lerp(p.x,u.x,t):u.x;o.y=p?lerp(p.y,u.y,t):u.y;o.facing=p?angleLerp(p.facing,u.facing,t):u.facing;o.health=Math.max(1,u.hp);}
   const mBefore=new Map((prev?.mates||[]).map(m=>[m[0],m])),mates=[];
   for(const m of cur.mates||[]){const p=mBefore.get(m[0]),o=actor(-1000-m[0],{});Object.assign(o,{kind:'soldier',name:String(m[1]),x:p?lerp(p[2],m[2],t):m[2],y:p?lerp(p[3],m[3],t):m[3],facing:p?angleLerp(p[4],m[4],t):m[4],dead:Boolean(m[5]),health:m[5]?0:100,mate218:true});mates.push(o);}
   const me=actor(-999,{});Object.assign(me,{kind:'soldier',x:self.x,y:self.y,facing:finite(st.aim)?st.aim:self.a||0,dead:Boolean(cur.self?.dead),health:Math.max(cur.self?.dead?0:1,cur.self?.hp??100),maxHealth:cur.self?.max||100,self218:true});
   sweep(units);
   const h=cur.host||{},ph=prev?.host,host={id:0,x:ph&&!ph.away?lerp(ph.x,h.x,t):h.x,y:ph&&!ph.away?lerp(ph.y,h.y,t):h.y,facing:ph?angleLerp(ph.a||0,h.a||0,t):h.a||0,vx:0,vy:0,
    health:h.dead?0:100,maxHealth:100,stamina:100,maxStamina:100,weapon:'rifle',invulnerable:0,reload:0,radius:14,dead:Boolean(h.dead||h.away),away:Boolean(h.away),host218:true};
   if(ph&&finite(ph.x)&&finite(h.x)&&!ph.away){host.vx=(h.x-ph.x)*8;host.vy=(h.y-ph.y)*8;}
   const decks=new Map();for(const d of cur.decks||[]){if(!decks.has(d.owner))decks.set(d.owner,[]);decks.get(d.owner).push(d);}
   return{cur,prev,t,elapsed,self:me,host,mates,buildings,zombies:[...zombies.values()],units:[...units.values()].filter(u=>!u.self218&&!u.mate218),decks};
  }
  return{read,buildings};
 }

 // ---- Vue de cité 2,5D : les méthodes de dessin de `Game` (prototype, sans enveloppes de simulation) sur la façade.
 function painterOf(game){
  const proto=game&&Object.getPrototypeOf(game);
  return proto&&['drawBuilding','drawZombie','drawUnit','drawPlayer','drawGround','depthEntries','viewBounds','visible'].every(k=>typeof proto[k]==='function')?proto:null;
 }
 function facade(proto,scene,options){
  const f=Object.create(proto),cur=scene.cur,size=Number(cur.size)||C?.LOCAL_MAP217?.size||4096,cells=new Map();
  for(const b of scene.buildings.values())for(let x=0;x<b.w;x++)for(let y=0;y<b.h;y++)cells.set((b.gx+x)+':'+(b.gy+y),b);
  const zoom=options.zoom||RULES?.iso?.zoom||1;
  // Propriétés propres (le prototype de `Game` porte des accesseurs comme `local`) : la façade ne touche jamais la partie.
  const own=values=>{for(const [k,value] of Object.entries(values))Object.defineProperty(f,k,{value,writable:true,configurable:true,enumerable:true});};
  own({
   ctx:options.ctx,dpr:options.dpr||1,width:options.width,height:options.height,state:'coop218',
   settings:{reducedMotion:Boolean(options.settings?.reducedMotion)},camera:{x:scene.self.x,y:scene.self.y,zoom,shake:0},
   elapsed:scene.elapsed,weather:clamp(Number(cur.w)||0,0,1),art:options.art||null,
   world:{seed:Number(cur.seed)>>>0,buildings:scene.buildings,nodes:[],atCell:(x,y)=>cells.get(x+':'+y)||null,definition:type=>C.CityGeometry202?.definition(type,0)},
   local:{size,tiles:Math.round(size/TILE)},zombies:scene.zombies,units:[...scene.units,...scene.mates.filter(m=>!m.dead),scene.self].filter(u=>!u.dead),
   player:scene.host,corpses:[],particles:[],projectiles:[],floaters:[],depthQueue:[],crowdDetail:options.width>720&&scene.zombies.length<320,
   daylight:()=>clamp(1-(Number(cur.night)||0),0,1),
  });
  return f;
 }
 // Étages d'une citadelle (lus dans l'image) : volume projeté au-dessus du socle, sans état propre.
 function drawDecks(ctx,b,boxes){
  if(!VR||!boxes?.length)return;
  const top=Math.max(...boxes.map(q=>q.z+q.d)),H=top*VR.projectedHeight,left=b.left,w=b.w*TILE,h=b.h*TILE,y=b.top-H;
  ctx.save();ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(left+16,b.top+10,w+H*.35,h);
  ctx.fillStyle='#414940';ctx.fillRect(left,y+h,w,Math.max(0,b.bottom-(y+h)));ctx.strokeStyle='#252d28';ctx.lineWidth=3;ctx.strokeRect(left,y+h,w,Math.max(0,b.bottom-(y+h)));
  for(let k=1;k<Math.ceil(top/3);k++){const line=b.bottom-k*3*VR.projectedHeight;ctx.strokeStyle=k%2?'#596053':'#353f36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,line);ctx.lineTo(left+w,line);ctx.stroke();}
  ctx.fillStyle='#b2aa90';ctx.fillRect(left,y,w,h);ctx.fillStyle='#8d907e';ctx.fillRect(left+7,y+7,w-14,h-14);
  for(const q of boxes)if(q.module){ctx.fillStyle='#455449';ctx.fillRect(q.x*TILE,q.y*TILE-H,q.w*TILE,q.h*TILE);}
  if(typeof ctx.fillText==='function'){ctx.fillStyle='#c6b985';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(Math.round(top)+' m',b.x,y-10);}
  ctx.restore();
 }
 function label(ctx,x,y,text,color){if(typeof ctx.fillText!=='function')return;ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.strokeText?.(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
 // Peint une image en 2,5D ; rend `false` si les peintres de la cité manquent (l'interface garde alors la vue de dessus).
 function paintIso(ctx,scene,options){
  const proto=options.proto;if(!ctx||!scene||!proto)return false;
  const f=facade(proto,scene,{...options,ctx}),W=options.width,H=options.height,cur=scene.cur,tries=fn=>{try{fn();}catch(error){options.faults&&options.faults.push(String(error?.message||error));}};
  ctx.save();ctx.fillStyle='#171c18';ctx.fillRect(0,0,W,H);
  ctx.translate(W/2,H/2);ctx.scale(f.camera.zoom,f.camera.zoom);ctx.translate(-f.camera.x,-f.camera.y);
  const view=f.viewBounds();
  tries(()=>f.drawGround(ctx,view));
  let entries=[];tries(()=>{entries=f.depthEntries(view);});
  for(const entry of entries){
   if(entry.kind===1)tries(()=>{f.drawBuilding(ctx,entry.entity);drawDecks(ctx,entry.entity,scene.decks.get(entry.entity.id));});
   else if(entry.kind===2)tries(()=>{f.drawUnit(ctx,entry.entity);const u=entry.entity;if(u.self218)label(ctx,u.x,u.y-30,'VOUS','#c9ef9f');else if(u.mate218)label(ctx,u.x,u.y-30,u.name,'#bfe3ee');});
   else if(entry.kind===3)tries(()=>f.drawZombie(ctx,entry.entity));
   else if(entry.kind===4)tries(()=>{f.drawPlayer(ctx);label(ctx,scene.host.x,scene.host.y-40,'COMMANDANT','#e8cd84');});
  }
  ctx.globalAlpha=1;
  // Tirs reçus (positions et vitesses arrondies par l'hôte), puis masses au-delà du rayon et signaux.
  for(const s of cur.shots||[])tries(()=>f.drawProjectile?.(ctx,{x:s[0],y:s[1],vx:s[2]*10,vy:s[3]*10,color:'#e8d39a',radius:2}));
  ctx.globalAlpha=1;
  for(const m of cur.masses||[]){const [x,y,n]=m;ctx.fillStyle='rgba(160,60,50,.22)';ctx.beginPath();ctx.arc(x,y,Math.min(160,18+Math.sqrt(n)*9),0,Math.PI*2);ctx.fill();label(ctx,x,y+5,String(n),'rgba(235,170,150,.9)');}
  for(const p of cur.pings||[]){const age=+p[3]||0,a=clamp(1-age/8,0,1);ctx.globalAlpha=a;ctx.strokeStyle='#e7c86a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[1],p[2],14+(age*10)%30,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=1;
  ctx.restore();
  // Pluie et nuit de l'hôte ; la lumière portée suit l'invité.
  tries(()=>f.drawRain?.(ctx));
  tries(()=>{const lit=Object.create(f);lit.player=scene.self;f.drawNight?.call(lit,ctx);});
  return true;
 }

 // ---- Vue FPS : le peintre WebGL de la citadelle, nourri par une façade de lecture (œil de l'avatar de l'invité).
 function fpsFacade(scene,options){
  const cur=scene.cur,size=Number(cur.size)||C?.LOCAL_MAP217?.size||4096,range=(Number(cur.radius)||900)/TILE+4;
  const boxes=[];
  for(const b of scene.buildings.values()){
   if(!b.completed)continue;const def=b.def;if(!def)continue;const vertical=Boolean(VR?.bases?.[b.type]);
   if(def.gate&&b.gateMode==='open'&&!vertical)continue;
   let d=0;try{d=C.CityGeometry202.structureHeight(def,b.geometryVersion202);}catch(error){d=VR?.structureHeight||4;}
   boxes.push({x:b.gx,y:b.gy,z:0,w:b.w,h:b.h,d:Math.max(.3,d),owner:b.id,type:'structure'});
  }
  for(const list of scene.decks.values())for(const q of list)boxes.push({x:q.x,y:q.y,z:q.z,w:q.w,h:q.h,d:q.d,owner:q.owner,type:q.module?'module':'deck'});
  const eye=(VR?.eyeHeight)||1.7,camera={x:scene.self.x/TILE,y:scene.self.y/TILE,z:eye};
  const q={m:{id:GUEST_MODULE,yaw:finite(options.aim)?options.aim:scene.self.facing,pitch:clamp(Number(options.pitch)||0,-1.2,1.2)},def:{range},b:null,s:null,level:0};
  const presentation=Object.freeze({controlled:GUEST_MODULE,view:'fps',sites:[],giants:[],traces:[]}),flat=Object.freeze({z:0});
  const V=Object.freeze({presentation:()=>presentation,moduleRef:id=>id===GUEST_MODULE?q:null,muzzle:()=>camera,geometry:()=>boxes,pressure:()=>[],
   sightQuery:(origin,reach)=>e=>Boolean(e)&&!e.dead&&Math.hypot(e.x/TILE-origin.x,e.y/TILE-origin.y)<=reach,
   enemyPose:()=>flat,population:Object.freeze({pose:()=>flat}),network:Object.freeze({presentation:()=>({links:[],crates:[]}),railGeometry:()=>[]})});
  const night=clamp(Number(cur.night)||0,0,1);
  return{vertical175:V,world:{buildings:scene.buildings,nodes:[],seed:Number(cur.seed)>>>0},local:{size,tiles:Math.round(size/TILE)},
   zombies:scene.zombies,units:[scene.host,...scene.mates].filter(u=>!u.dead).map(u=>u),elapsed:scene.elapsed,
   settings:{reducedMotion:Boolean(options.settings?.reducedMotion)},daylight:()=>1-night};
 }

 // Vues d'un invité : une scène (objets d'affichage), un peintre FPS créé à la première demande et gardé.
 function createViews(options={}){
  const scene=createScene(),game=options.game||null;
  let fps=null,fpsCanvas=null,fpsFailed=false,isoPaints=0,fpsPaints=0;
  const settings=()=>{try{return game?.settings||{};}catch(error){return{};}};
  function iso(ctx,st,o={}){
   const proto=o.proto||painterOf(game);if(!proto)return false;const s=scene.read({...st,aim:o.aim});if(!s)return false;
   const ok=paintIso(ctx,s,{proto,width:o.width||ctx?.canvas?.width||1280,height:o.height||ctx?.canvas?.height||720,dpr:o.dpr,zoom:o.zoom,art:o.art??game?.art??null,settings:o.settings||settings(),faults:o.faults});
   if(ok)isoPaints++;return ok;
  }
  function fpsView(canvas,st,o={}){
   const R=root.DeadwallVertical175Render;if(!canvas||!R?.createFPS)return false;
   if(fpsCanvas!==canvas){dispose();fpsCanvas=canvas;fpsFailed=false;}
   if(fps?.lost){try{fps.dispose();}catch(error){}fps=null;}
   if(!fps&&!fpsFailed){try{fps=R.createFPS(canvas);}catch(error){fps=null;}if(!fps)fpsFailed=true;}
   if(!fps)return false;
   const s=scene.read({...st,aim:o.aim});if(!s)return false;
   let ok=false;try{ok=fps.draw(fpsFacade(s,{aim:o.aim,pitch:o.pitch,settings:o.settings||settings()}));}catch(error){ok=false;if(o.faults)o.faults.push(String(error?.stack||error));}
   if(ok)fpsPaints++;return ok;
  }
  function dispose(){if(fps)try{fps.dispose();}catch(error){}fps=null;}
  return Object.freeze({iso,fps:fpsView,dispose,read:st=>scene.read(st),webgl:()=>fpsFailed?false:fps?true:null,
   diagnostics:()=>({isoPaints,fpsPaints,webgl:fpsFailed?false:Boolean(fps),renderer:fps?.diagnostics?.()||null})});
 }
 // Direction de marche en FPS : avant/arrière et côtés tournés selon le regard (pas angulaire borné), toujours unitaire.
 function turnMove(move,yaw,steps=RULES?.fps?.moveSteps||32){
  const f=-move.y,s=move.x;if(!f&&!s)return{x:0,y:0};
  const q=Math.PI*2/steps,a=Math.round(yaw/q)*q,c=Math.cos(a),n=Math.sin(a);
  let x=f*c-s*n,y=f*n+s*c;const l=Math.hypot(x,y)||1;x/=l;y/=l;
  return{x:+x.toFixed(4)||0,y:+y.toFixed(4)||0};
 }
 function install(g){
  if(!g||g.coopViews218)return false;
  g.coopViews218=createViews({game:g});
  return true;
 }
 return Object.freeze({install,createViews,createScene,paintIso,fpsFacade,painterOf,turnMove,Shown,RULES});
});
