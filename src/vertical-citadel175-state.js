/* Persistent state and shared metric geometry for both citadel cameras. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalCitadel175;
 const N=root.DeadwallVerticalNetwork179||(typeof require==='function'?require('./vertical-network179.js'):null);
 const copy=x=>JSON.parse(JSON.stringify(x)),finite=(x,a=0,b=Number.MAX_SAFE_INTEGER)=>Number.isFinite(x)&&x>=a&&x<=b;
 const integer=(x,a=0,b=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
 const initial=()=>({version:3,sites:[],actor:null,giants:[],lastSiegeWave:0,nextId:1,climbers:[],network:N.initial()});
 function register(){for(const [id,d]of Object.entries(R.bases)){if(C.BUILDINGS[id]&&!C.BUILDINGS[id].vertical175)throw Error('Construction verticale en conflit : '+id);C.BUILDINGS[id]={...d};}}
 register();
 const height=(site,level,base)=>base.height+level*R.deckRise;
 const siteInitial=id=>({id,lift:0,decks:[{progress:1,health:R.deck.health,modules:[]}]});
 function bounds(b){const d=R.bases[b.type]||C.BUILDINGS[b.type],swap=(b.rotation||0)%2,w=d.size[swap?1:0],h=d.size[swap?0:1];return{x:b.gx,y:b.gy,w,h};}
 const slots=b=>{const q=bounds(b);return [[.23,.23],[.77,.23],[.23,.77],[.77,.77]].map(([x,y])=>({x:q.x+q.w*x,y:q.y+q.h*y}));};
 function moduleBox(b,m,z){const p=slots(b)[m.slot],d=R.modules[m.kind];return {x:p.x-d.size[0]/2,y:p.y-d.size[1]/2,z,w:d.size[0],h:d.size[1],d:d.range?1.5:2.6};}
 const mass=s=>s.decks.reduce((v,d,i)=>v+(i?R.deckMass:0)+d.modules.reduce((n,m)=>n+R.modules[m.kind].mass,0),0);
 function normalize(raw,full){
  if(raw===undefined){const empty=initial();if(full?.buildings)empty.sites=full.buildings.filter(b=>R.bases[b.type]).map(b=>siteInitial(b.id));return normalize(empty,full);}
  const bad=why=>{throw Error('Cité verticale invalide : '+why);};
  const fields=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&Object.keys(o).every(k=>keys.includes(k));
  if(raw?.version===1){if(!fields(raw,['version','sites','actor','giants','lastSiegeWave','nextId']))bad('ancien format');raw={...raw,version:2,climbers:[]};}
  if(raw?.version===2){if(!fields(raw,['version','sites','actor','giants','lastSiegeWave','nextId','climbers']))bad('ancien réseau');raw={...raw,version:3,network:N.initial()};}
  if(!fields(raw,['version','sites','actor','giants','lastSiegeWave','nextId','climbers','network'])||raw.version!==3||!Array.isArray(raw.sites)||raw.sites.length>R.maxSites||!integer(raw.nextId,1)||!integer(raw.lastSiegeWave))bad('format');
  if(!Array.isArray(raw.climbers)||raw.climbers.length>C.VerticalSiege176.maxClimbers)bad('grimpeurs');
  const native=new Map((full?.buildings||[]).map(b=>[b.id,b])),ids=new Set(),moduleIds=new Set();let count=0;
  for(const s of raw.sites){
   if(!fields(s,['id','lift','decks'])||!integer(s.id,1)||ids.has(s.id)||!finite(s.lift,0,1)||!Array.isArray(s.decks)||s.decks.length<1||s.decks.length>R.maxDecks)bad('support');ids.add(s.id);
   const b=native.get(s.id),base=b&&R.bases[b.type];if(full&&(!base||b.health<=0))bad('support absent');
   if(base&&(height(s,s.decks.length-1,base)>R.maxHeight||s.decks.length>(base.maxDecks??(base.wall?1:R.maxDecks))))bad('hauteur');
   if(base&&base.liftTier===null&&s.lift!==0)bad('ascenseur incompatible');
   s.decks.forEach((d,i)=>{
    if(!fields(d,['progress','health','modules'])||!finite(d.progress,0,1)||i===0&&d.progress!==1||!finite(d.health,Number.EPSILON,R.deck.health)||!Array.isArray(d.modules)||d.modules.length>4||i>0&&s.decks[i-1].progress!==1)bad('dalle');
    const used=new Set();
    for(const m of d.modules){
     const def=R.modules[m.kind];count++;
     if(!fields(m,['id','kind','slot','progress','health','ammo','yaw','pitch','heat','cooldown','overheated'])||!def||!integer(m.id,1,raw.nextId-1)||moduleIds.has(m.id)||!integer(m.slot,0,3)||used.has(m.slot)||!finite(m.progress,0,1)||!finite(m.health,Number.EPSILON,def.health)||!integer(m.ammo,0,def.capacity||0)||!finite(m.yaw,-Math.PI,Math.PI)||!finite(m.pitch,-1.45,1.1)||!finite(m.heat,0,R.heatLimit)||!finite(m.cooldown,0,10)||typeof m.overheated!=='boolean'||d.progress!==1)bad('équipement');
     if(base&&def.age177){const box=moduleBox(b,m,0),q=bounds(b);if(box.x<q.x||box.y<q.y||box.x+box.w>q.x+q.w||box.y+box.h>q.y+q.h)bad('équipement hors support');}
     moduleIds.add(m.id);used.add(m.slot);
    }
   });
   if(base&&mass(s)>base.capacity)bad('charge portante');
  }
  if(count>R.maxModules)bad('capacité du registre');
  if(full&&[...native.values()].filter(b=>R.bases[b.type]).some(b=>!ids.has(b.id)))bad('support non enregistré');
  const network=N.normalize(raw.network,full,raw);
  if(raw.actor!==null){const a=raw.actor,s=raw.sites.find(v=>v.id===a.site);
   if(!fields(a,['site','level'])||!s||!integer(a.level,0,s.decks.length-1)||s.decks[a.level].progress!==1)bad('palier du joueur');
   if(full){const b=native.get(a.site),q=bounds(b),p=full.player,x=p.x/R.tile,y=p.y/R.tile,r=.26;
    if(full.frontier?.active||p.dead||((x<q.x+r||x>q.x+q.w-r||y<q.y+r||y>q.y+q.h-r)&&!N.onBridge(network,a,p,native,raw.sites,r)))bad('position du joueur');
    for(const m of s.decks[a.level].modules){const box=moduleBox(b,m,0);if(x+r>box.x&&x-r<box.x+box.w&&y+r>box.y&&y-r<box.y+box.h)bad('joueur dans un équipement');}
   }
  }
  if(!Array.isArray(raw.giants)||raw.giants.length>R.siege.maxGiants)bad('siège');
  const giantIds=new Set();for(const e of raw.giants){const d=R.siege.kinds[e.kind];
   if(!fields(e,['id','kind','x','y','health','cooldown','windup','target','yaw'])||!d||!integer(e.id,1,raw.nextId-1)||moduleIds.has(e.id)||giantIds.has(e.id)||!finite(e.x,0,C.WORLD_SIZE)||!finite(e.y,0,C.WORLD_SIZE)||!finite(e.health,Number.EPSILON,d.health)||!finite(e.cooldown,0,R.siege.interval)||!finite(e.windup,0,R.siege.telegraph)||!finite(e.yaw,-Math.PI,Math.PI)||(e.target!==null&&!integer(e.target,1)))bad('colosse');giantIds.add(e.id);
  }
  const enemies=new Map((full?.zombies||[]).map(z=>[z.id,z])),climberIds=new Set(),Q=C.VerticalSiege176;
  for(const c of raw.climbers){
   if(!fields(c,['id','site','side','lane','start','progress','stage','fallHeight'])||!finite(c.fallHeight,0,R.maxHeight)||!integer(c.id,1)||climberIds.has(c.id)||!ids.has(c.site)||!integer(c.side,0,3)||!finite(c.lane,Q.margin,C.WORLD_TILES)||!finite(c.start,0,Q.apron)||!finite(c.progress,0,1)||!['climb','roof','fall'].includes(c.stage)||c.stage==='roof'&&c.progress!==1)bad('grimpeur');
   climberIds.add(c.id);
   if(full){const z=enemies.get(c.id),b=native.get(c.site),def=b&&R.bases[b.type];
    if(!z||z.health<=0||!['runner','crawler'].includes(z.kind)||!def?.wall||b.progress!==1)bad('infecté ou support du grimpeur absent');
    const q=bounds(b),span=c.side%2?q.h:q.w;if(c.lane>span-Q.margin)bad('voie du grimpeur');
    if(c.stage==='roof'){const x=z.x/R.tile,y=z.y/R.tile,r=C.ENEMIES[z.kind].radius*.78/R.tile;
     if(x-r<q.x||x+r>q.x+q.w||y-r<q.y||y+r>q.y+q.h)bad('infecté hors du chemin de ronde');
     const s=raw.sites.find(s=>s.id===c.site);for(const m of s.decks[0].modules){const box=moduleBox(b,m,0);if(x+r>box.x&&x-r<box.x+box.w&&y+r>box.y&&y-r<box.y+box.h)bad('infecté dans un équipement');}
    }
    else{const p=climbPoint(b,c);if(Math.hypot(z.x/R.tile-p.x,z.y/R.tile-p.y)>Q.positionTolerance)bad('position du grimpeur');}
   }
  }
  return copy({...raw,network});
 }
 /* Ray/box intersection, distances in metres. Origins inside a solid are blocked. */
 function rayBox(origin,direction,box,max=Infinity){
  let near=0,far=max;
  for(const [axis,span]of [['x','w'],['y','h'],['z','d']]){
   const lo=box[axis],hi=lo+box[span],v=direction[axis],p=origin[axis];
   if(Math.abs(v)<1e-9){if(p<lo||p>hi)return null;continue;}
   let a=(lo-p)/v,b=(hi-p)/v;if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return null;
  }
  return near<=max?near:null;
 }
 function direction(yaw,pitch){return{x:Math.cos(yaw)*Math.cos(pitch),y:Math.sin(yaw)*Math.cos(pitch),z:Math.sin(pitch)};}
 function lookAt(from,to){const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;return{yaw:Math.atan2(dy,dx),pitch:Math.atan2(dz,Math.hypot(dx,dy))};}
 function totals(s){const out={housing:0,storage:0,powerUse:s.lift===1?R.liftPower:0,score:0,light:0,production:{},consumes:{}};
  for(const d of s.decks)if(d.progress===1)for(const m of d.modules)if(m.progress===1&&m.health>0){const v=R.modules[m.kind];for(const k of ['housing','storage','powerUse','score'])out[k]+=v[k]||0;out.light=Math.max(out.light,v.light||0);for(const k of ['production','consumes'])for(const [r,n]of Object.entries(v[k]||{}))out[k][r]=(out[k][r]||0)+n;}
  return out;
 }
 function climbPoint(b,c){
  const q=bounds(b),Q=C.VerticalSiege176,t=c.progress,m=Q.mantleStart;
  const normal=t<=m?c.start+(Q.clearance-c.start)*t/m:Q.clearance+(-Q.margin-Q.clearance)*(t-m)/(1-m);
  const z=R.bases[b.type].height*Math.min(1,t/m);
  if(c.side===0)return{x:q.x+c.lane,y:q.y-normal,z};
  if(c.side===1)return{x:q.x+q.w+normal,y:q.y+c.lane,z};
  if(c.side===2)return{x:q.x+c.lane,y:q.y+q.h+normal,z};
  return{x:q.x-normal,y:q.y+c.lane,z};
 }
 const api={climbPoint,initial,siteInitial,normalize,register,bounds,slots,moduleBox,mass,height,rayBox,direction,lookAt,totals};root.DeadwallVertical175State=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
