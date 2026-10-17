/* Stable natural encounters. Merely sampling a landscape never creates saved actors. */
(function(root){'use strict';
 const geometry=()=>root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),worlds=new WeakMap();
 const expanded=w=>!!w&&typeof w.landscape189==='string'&&w.landscape189!=='classic';
 const wildlife=()=>root.DeadwallWildlife189||(typeof require==='function'?require('./wildlife189.js'):null);
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),rules=()=>{const r=core()?.BiomePopulation165Rules;if(!r)throw Error('Règles de population naturelle absentes.');return r;};
 const unit=(w,id,key)=>geometry().hash(w.seed,id,key)/4294967296;
 function context(w,id,cx,cy,index,kind){
  const R=rules();if(w?.hydrologyVersion!==1||!w.hydrology||!Number.isInteger(cx)||!Number.isInteger(cy)||!Number.isInteger(index)||cx<0||cy<0||cx>=Math.ceil(w.size/R.chunk)||cy>=Math.ceil(w.size/R.chunk)||index<0||index>=(kind==='animal'?R.animalCandidates:R.contactCandidates))return null;
  if(unit(w,id,'presence')>=(kind==='animal'?R.animalChance:R.contactChance))return null;
  const x=(cx+.08+unit(w,id,'x')*.84)*R.chunk,y=(cy+.08+unit(w,id,'y')*.84)*R.chunk;
  if(Math.hypot(x-w.home.x,y-w.home.y)<R.homeExclusion||x<2||y<2||x>w.size-2||y>w.size-2)return null;
  const water=w.hydrology.sample(x,y);if(water.water||water.movementBlocked)return null;
  const road=w.nearestRoad({x,y});if(road&&road.d<road.road.width/2+R.roadClearance)return null;
  return{id,x,y,z:0,poi:null,cx,cy,index,water,biome:w.biomeAt(x,y)};
 }
 function memo(w,id,build){let cache=worlds.get(w);if(!cache){cache=new Map();worlds.set(w,cache);}if(cache.has(id)){const value=cache.get(id);cache.delete(id);cache.set(id,value);return value;}const value=build();cache.set(id,value);if(cache.size>rules().candidateCache)cache.delete(cache.keys().next().value);return value;}
 function animal(w,cx,cy,index=0){
  if(expanded(w))return memo(w,'A189_'+cx+'_'+cy+'_'+index,()=>wildlife().animal(w,cx,cy,index));
  const id='A165_'+cx+'_'+cy+'_'+index;return memo(w,id,()=>{const q=context(w,id,cx,cy,index,'animal');if(!q)return null;const R=rules(),pool=[];
   for(const d of Object.values(R.species)){
    const fresh=q.water.salinity===0||q.water.salinity==='fresh',salt=typeof q.water.salinity==='number'?q.water.salinity>0:q.water.salinity==='salt';
    const weight=d.water==='land'?(d.biomes[q.biome.id]||0):d.water==='fresh'&&fresh&&q.water.distanceToWater<=d.bankRange||d.water==='salt'&&salt&&q.water.distanceToWater<=d.bankRange?d.weight:0;
    if(weight>0)pool.push([d,weight]);
   }
   const total=pool.reduce((n,row)=>n+row[1],0);if(!total)return null;let draw=unit(w,id,'species')*total,d=pool[pool.length-1][0];for(const row of pool){draw-=row[1];if(draw<0){d=row[0];break;}}
   const descriptor={id,x:q.x,y:q.y,z:0,poi:null,species:d.id,variant:geometry().hash(w.seed,id,'appearance')%4,radius:d.radius,length:d.length,width:d.width,profile:d,biome:q.biome.id};return Object.freeze(descriptor);
  });
 }
 function contact(w,cx,cy,index=0){
  const id='N165_'+cx+'_'+cy+'_'+index;return memo(w,id,()=>{const q=context(w,id,cx,cy,index,'contact');if(!q)return null;
   const profile=w.biomes.enemyProfile(w.seed,q.x,q.y,id,{generation:w.generation}),bank=q.water.distanceToWater<50;
   return Object.freeze({id,x:q.x,y:q.y,z:0,poi:null,radius:core().FrontierTacticsRules.enemyRadius,biome:q.biome.id,bank,profile:Object.freeze({...profile,name:bank&&profile.kind==='walker'?'Errant des berges':profile.name})});
  });
 }
 function candidate(w,id){if(typeof id!=='string')return null;const v=/^A189_(\d+)_(\d+)_(\d+)$/.exec(id);if(v)return expanded(w)?animal(w,...v.slice(1).map(Number)):null;const match=/^([AN])165_(\d+)_(\d+)_(\d+)$/.exec(id);return match&&!(match[1]==='A'&&expanded(w))?(match[1]==='A'?animal:contact)(w,Number(match[2]),Number(match[3]),Number(match[4])):null;}
 function admitted(w,q){if(!q||(q.id.startsWith('A189_')?!wildlife().clear(w,q):w.blocked(q.x,q.y,q.radius??core().FrontierTacticsRules.enemyRadius,0,null)))return false;const margin=rules().parcelClearance;
  for(const p of w.nearPOI(q.x,q.y,60)){const box=p.reserve;if(box&&q.x>box.l-margin&&q.x<box.r+margin&&q.y>box.t-margin&&q.y<box.b+margin)return false;}return true;
 }
 function around(w,x,y,range=rules().streamRange){const R=rules(),animals=[],contacts=[];if(w.hydrologyVersion!==1)return{animals,contacts};
  const max=Math.ceil(w.size/R.chunk)-1;for(let cy=Math.max(0,Math.floor((y-range)/R.chunk));cy<=Math.min(max,Math.floor((y+range)/R.chunk));cy++)for(let cx=Math.max(0,Math.floor((x-range)/R.chunk));cx<=Math.min(max,Math.floor((x+range)/R.chunk));cx++){
   for(let i=0;i<(expanded(w)?core().Landscape189Rules.population.groups*core().Landscape189Rules.population.members:R.animalCandidates);i++){const q=animal(w,cx,cy,i);if(q&&Math.hypot(q.x-x,q.y-y)<=range)animals.push(q);}
   for(let i=0;i<R.contactCandidates;i++){const q=contact(w,cx,cy,i);if(q&&Math.hypot(q.x-x,q.y-y)<=range)contacts.push(q);}
  }
  const order=(a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.id.localeCompare(b.id);animals.sort(order);contacts.sort(order);return{animals,contacts};
 }
 const api=Object.freeze({clear189:(w,q,x,y)=>wildlife().clear(w,q,x,y),animal,contact,candidate,admitted,around,cacheSize:w=>worlds.get(w)?.size||0,get RULES(){return rules();}});root.DeadwallBiomePopulation165=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
