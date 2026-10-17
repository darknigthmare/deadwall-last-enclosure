/* Versioned encounter descriptors and physical habitat rules; no saved owner here. */
(function(root){'use strict';
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const geo=()=>root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 let previous=null,catalogue=null;
 function species(){const C=core(),R=C.Landscape189Rules;if(previous===R)return catalogue;
  const legacy=C.BiomePopulation165Rules.species,overrides={roeDeer:['antlered','land','crepuscular',3],boar:['boar','land','crepuscular',4],hare:['hare','land','crepuscular',2],duck:['duck','amphibious','day',4],heron:['heron','air','day',1],gull:['gull','air','day',4]};
  const all={};for(const [id,d]of Object.entries(legacy)){const [shape,mode,activity,group]=overrides[id];all[id]=Object.freeze({...d,shape,mode,activity,group,bankRange:d.bankRange||0,fleeRange:16,wanderSpeed:.32});}
  for(const [id,d]of Object.entries(R.species))all[id]=d;
  previous=R;catalogue=Object.freeze(all);return catalogue;
 }
 const enabled=w=>!!w&&['balanced','large','patchwork'].includes(w.landscape189);
 function habitat(d,water){
  if(!water||water.crossing)return false;
  const fresh=water.salinity===0||water.salinity==='fresh',salt=water.salinity==='salt'||typeof water.salinity==='number'&&water.salinity>0;
  if(d.water==='fresh'&&!fresh||d.water==='salt'&&!salt)return false;
  if(d.mode==='swim')return water.water&&water.distanceToShore>d.radius&&(!d.kinds||d.kinds.includes(water.kind));
  if(d.mode==='amphibious')return water.water||water.distanceToWater<=d.bankRange;
  if(d.water!=='land'&&water.distanceToWater>d.bankRange)return false;
  return d.mode==='air'||!water.water&&!water.movementBlocked;
 }
 function clear(w,q,x=q?.x,y=q?.y){
  if(!enabled(w)||!q?.profile||![x,y].every(Number.isFinite))return false;
  const d=q.profile,r=Math.max(.32,q.radius),water=w.hydrology.sample(x,y);
  if(x<=r||y<=r||x>=w.size-r||y>=w.size-r||!habitat(d,water))return false;
  // Aquatic/low aerial animals waive only NATURAL water, never walls or furniture.
  if(d.mode==='land')return !w.blocked(x,y,q.radius,0,null);
  if(!w.wildlifeWaterClear?.(x,y,q.radius))return false;
  if(d.mode==='swim')for(const [dx,dy]of [[-q.radius,0],[q.radius,0],[0,-q.radius],[0,q.radius]])if(!habitat(d,w.hydrology.sample(x+dx,y+dy)))return false;
  return true;
 }
 function line(w,q,a,b){return q.profile.mode==='land'?w.movementLine(a,b,0,null,null,q.radius):w.wildlifeWaterLine(a,b,q.radius);}
 function pool(biome,water){const R=core().Landscape189Rules,result={},all=species();
  for(const[id,weight]of Object.entries(R.guilds[biome.id]||{}))if(habitat(all[id],water))result[id]=weight;
  const key=water.salinity==='salt'||typeof water.salinity==='number'&&water.salinity>0?'salt':'fresh';
  for(const[id,weight]of Object.entries(R.waterGuilds[key]))if(habitat(all[id],water))result[id]=weight;
  return result;
 }
 function animal(w,cx,cy,index=0){
  if(!enabled(w))return null;
  const C=core(),K=C.Landscape189Rules.population,R=C.BiomePopulation165Rules,limit=Math.ceil(w.size/R.chunk);
  if(!enabled(w)||w.hydrologyVersion!==1||![cx,cy,index].every(Number.isInteger)||cx<0||cy<0||cx>=limit||cy>=limit||index<0||index>=K.groups*K.members)return null;
  const group=Math.floor(index/K.members),member=index%K.members,gid='A189_'+cx+'_'+cy+'_'+group* K.members,id='A189_'+cx+'_'+cy+'_'+index,hash=(key)=>geo().hash(w.seed,gid,key)/4294967296;
  if(hash('presence')>=K.chance)return null;
  let x=(cx+.15+hash('x')*.7)*R.chunk,y=(cy+.15+hash('y')*.7)*R.chunk;
  // A second, bounded search favours banks/water, rather than requiring a random
  // sub-metre stream hit. Never search outside this descriptor's owning chunk.
  if(group===1){
   const candidates=[],box={x:cx*R.chunk,y:cy*R.chunk,w:R.chunk,h:R.chunk};
   const accept=p=>{if(candidates.length<K.aquaticAttempts&&p.x>box.x+1&&p.x<box.x+box.w-1&&p.y>box.y+1&&p.y<box.y+box.h-1&&w.hydrology.sample(p.x,p.y).water)candidates.push(p);};
   for(const f of w.hydrology.featuresIn(box)){
    if(f.shape==='line')for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i],v=geo().nearest({x,y},a,b);accept({x:a.x+(b.x-a.x)*v.t,y:a.y+(b.y-a.y)*v.t});}
    else {const centre=f.points.reduce((q,p)=>({x:q.x+p.x/f.points.length,y:q.y+p.y/f.points.length}),{x:0,y:0});accept(centre);}
    if(candidates.length>=K.aquaticAttempts)break;
   }
   if(candidates.length)({x,y}=candidates[Math.floor(hash('water-anchor')*candidates.length)]);
  }
  const water=w.hydrology.sample(x,y),biome=w.biomeAt(x,y),choices=Object.entries(pool(biome,water));if(!choices.length)return null;
  let draw=hash('species')*choices.reduce((n,row)=>n+row[1],0),chosen=choices.at(-1)[0];for(const[id,weight]of choices){draw-=weight;if(draw<0){chosen=id;break;}}
  const d=species()[chosen];if(member>=d.group)return null;
  if(member){const a=geo().hash(w.seed,id,'group-angle')/4294967296*Math.PI*2,rr=(.4+.6*hash('spacing'))*K.groupSpread*member/K.members;x+=Math.cos(a)*rr;y+=Math.sin(a)*rr;}
  if(Math.hypot(x-w.home.x,y-w.home.y)<R.homeExclusion||x<1||y<1||x>w.size-1||y>w.size-1||!habitat(d,w.hydrology.sample(x,y)))return null;
  const road=w.nearestRoad({x,y});if(road&&road.d<road.road.width/2+R.roadClearance)return null;
  return Object.freeze({id,x,y,z:0,poi:null,species:d.id,variant:geo().hash(w.seed,id,'appearance')%4,radius:d.radius,length:d.length,width:d.width,profile:d,biome:biome.id,group189:gid,landscape189:w.landscape189});
 }
 function awake(d,dayClock){const K=core().Landscape189Rules.population,t=((dayClock%1)+1)%1,day=t>=K.dayStart&&t<=K.dayEnd;
  return d.activity==='night'?!day:d.activity==='crepuscular'?Math.abs(t-K.dayStart)<=K.twilightWidth||Math.abs(t-K.dayEnd)<=K.twilightWidth:day;
 }
 function speed(w,e,elapsed,dayClock){if(e.alarm>0)return e.profile.speed;
  const K=core().Landscape189Rules.population;if(!awake(e.profile,dayClock))return 0;
  const epoch=Math.floor(elapsed/core().BiomePopulation165Rules.animalWanderSeconds),roll=geo().hash(w.seed,e.group189||e.id,epoch,'rest189')/4294967296;
  return roll<K.restFraction?0:e.profile.mode==='air'?e.profile.speed*.45:e.profile.wanderSpeed;
 }
 const api=Object.freeze({species,enabled,habitat,clear,line,pool,animal,awake,speed});root.DeadwallWildlife189=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
