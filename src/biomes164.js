/* Optional ecology revision 1. All providers own their immutable geographic context. */
(function(root,factory){'use strict';const api=factory(()=>typeof module==='object'&&module.exports?require('./core.js'):root.DeadwallCore);root.DeadwallBiomes164=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(getCore){'use strict';
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const smooth=(n,range)=>{const t=clamp((n-range[0])/(range[1]-range[0]));return t*t*(3-2*t);};
 const channels=['base','secondary','soil','accent','rock','grass','water'];
 function lattice(seed,x,y){let h=(seed^Math.imul(x,0x27d4eb2d)^Math.imul(y,0x165667b1))>>>0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return((h^h>>>16)>>>0)/4294967296;}
 function valid(seed,x=0,y=0){if(!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isFinite(x)||!Number.isFinite(y))throw Error('Coordonnées ou graine écologique164 invalides.');}
 function create({base,seed,settlements=[],hydrology=null}={}){
  const C=getCore(),R=C?.EcologyRules164;if(!R)throw Error('Règles écologiques164 absentes.');
  valid(seed);if(!base?.sample||!base?.climate||!base?.noise||!base?.habitat||!base?.weighted)throw Error('Biomes historiques requis pour l’écologie164.');
  if(hydrology&&(hydrology.version!==1||hydrology.seed!==seed||typeof hydrology.sample!=='function'))throw Error('Hydrologie écologique165 invalide.');
  if(!Array.isArray(settlements)||settlements.length>R.settlements.limit)throw Error('Communautés géographiques164 invalides.');
  const towns=Object.freeze(settlements.map((t,index)=>{const radius=t?.radius??t?.r;
   if(!t||![t.x,t.y,radius].every(Number.isFinite)||t.x<0||t.y<0||t.x>C.GeographyRules135.size||t.y>C.GeographyRules135.size||radius<=0||radius>R.settlements.maximumRadius)throw Error('Emprise de communauté164 invalide.');
   return Object.freeze({id:String(t.id??index),x:t.x,y:t.y,radius,kind:String(t.kind||'village')});
  }));
  const defs=Object.freeze([...base.defs,...R.defs]),BY=Object.freeze(Object.fromEntries(defs.map(d=>[d.id,d]))),legacyIds=base.defs.map(d=>d.id);
  const indices=Object.fromEntries(defs.map((d,i)=>[d.id,i])),aliases=Object.freeze(Object.fromEntries(defs.map(d=>[d.id,Object.freeze([d.id,...(d.aliases||[])])])));
  const colors=defs.map(d=>channels.map(k=>[1,3,5].map(i=>parseInt(d.palette[k].slice(i,i+2),16))));
  const townBins=new Map(),sk=R.settlements;
  for(const t of towns){const reach=t.radius+sk.influenceReach;for(let y=Math.floor((t.y-reach)/sk.binSize);y<=Math.floor((t.y+reach)/sk.binSize);y++)for(let x=Math.floor((t.x-reach)/sk.binSize);x<=Math.floor((t.x+reach)/sk.binSize);x++){const key=x+':'+y;if(!townBins.has(key))townBins.set(key,[]);townBins.get(key).push(t);}}
  function aliasesFor(id){const list=aliases[typeof id==='string'?id:id?.id];if(!list)throw Error('Biome écologique164 inconnu : '+String(id));return list;}
  function settlementInfluence(sampleSeed,x,y){if(sampleSeed!==seed)return 0;let value=0;
   for(const t of townBins.get(Math.floor(x/sk.binSize)+':'+Math.floor(y/sk.binSize))||[]){const d=Math.hypot(x-t.x,y-t.y),outer=1-smooth(d,[t.radius*sk.edgeFraction,t.radius+sk.influenceReach]),ring=smooth(d,[t.radius*sk.innerFraction,t.radius*sk.ringFraction]);
    value=Math.max(value,outer*(sk.centreInfluence+(1-sk.centreInfluence)*ring)*(sk.kindWeights[t.kind]??sk.kindWeights.village));}
   return clamp(value);
  }
  function climate(sampleSeed,x,y){valid(sampleSeed,x,y);const c=base.climate(sampleSeed,x,y),k=R.climate;
   // The valley-shaped field describes soil moisture; it never creates water or elevation geometry.
   const valley=1-Math.abs(2*(base.noise(sampleSeed^164017,x,y,k.drainageScale)*(1-k.drainageDetailWeight)+base.noise(sampleSeed^164021,x,y,k.drainageDetailScale)*k.drainageDetailWeight)-1),
    drainage=smooth(valley,k.drainageThreshold)*(1-smooth(c.elevation,k.drainageElevation)),
    substrate=clamp(base.noise(sampleSeed^164101,x,y,k.substrateScale)*(1-k.substrateDetailWeight)+base.noise(sampleSeed^164107,x,y,k.substrateDetailScale)*k.substrateDetailWeight);
   if(hydrology&&sampleSeed===seed){
    const water=hydrology.sample(x,y),e=C.Hydrology165Rules.ecology,bank=1-smooth(water.distanceToWater,[0,e.bankReach]),fresh=water.salinity==='fresh'||water.salinity===0;
    return{...c,moisture:c.moisture+(e.moisture-c.moisture)*bank,drainage:drainage+(e.drainage-drainage)*bank,substrate,settlementInfluence:settlementInfluence(sampleSeed,x,y),hydrology165:{bank,fresh,kind:water.kind,bodyId:water.bodyId}};
   }
   return{...c,drainage,substrate,settlementInfluence:settlementInfluence(sampleSeed,x,y)};
  }
  function palette(values){const result={};for(let k=0;k<channels.length;k++){const rgb=[0,0,0];for(let i=0;i<defs.length;i++)for(let j=0;j<3;j++)rgb[j]+=colors[i][k][j]*values[i];result[channels[k]]='#'+rgb.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');}return result;}
  function projected(weights){const out={};for(const id of legacyIds)out[id]=0;for(const d of defs){const share=weights[d.id]/(d.aliases?.length||1);for(const id of d.aliases||[d.id])out[id]+=share;}return out;}
  function sample(sampleSeed,x,y,withPalette=true,options={}){
   const c=climate(sampleSeed,x,y),k=R.composition,raw=new Array(defs.length);let naturalPeak=0;
   for(let i=0;i<defs.length;i++){const d=defs[i],dt=(c.temperature-d.climate[0])/d.spread[0],dm=(c.moisture-d.climate[1])/d.spread[1],de=(c.elevation-d.climate[2])/d.spread[2];raw[i]=Math.exp(-(dt*dt+dm*dm+de*de)/(R.climate.blendSoftness/2));if(d.id!=='brownfield')naturalPeak=Math.max(naturalPeak,raw[i]);}
   raw[indices.brownfield]=naturalPeak*c.settlementInfluence*sk.brownfieldStrength;
   raw[indices.alluvialTerrace]*=k.newBiomeStrength*smooth(c.drainage,k.alluvialDrainage)*(1-smooth(c.substrate,k.alluvialMineral));
   raw[indices.agriculturalPlateau]*=k.newBiomeStrength*smooth(c.elevation,k.plateauElevation)*(1-smooth(c.drainage,k.plateauDrainage));
   raw[indices.sandyPine]*=k.newBiomeStrength*smooth(c.substrate,k.sandySubstrate)*(1-smooth(c.moisture,k.sandyMoisture));
   raw[indices.peatland]*=k.newBiomeStrength*smooth(c.drainage,k.peatDrainage)*smooth(c.substrate,k.peatSubstrate);
   if(c.hydrology165){const h=c.hydrology165,e=C.Hydrology165Rules.ecology;
    if(h.fresh){for(const id of ['riparian','wetland','alluvialTerrace','peatland'])raw[indices[id]]*=1+h.bank*e.bankWeight;}
    else for(const id of ['sandyPine','heath'])raw[indices[id]]*=1+h.bank*e.coastWeight;
   }
   let total=0;for(const value of raw)total+=value;const values=raw,weights={};for(let i=0;i<defs.length;i++){values[i]/=total;weights[defs[i].id]=values[i];}
   let first=0,second=1;for(let i=1;i<defs.length;i++)if(values[i]>values[first]){second=first;first=i;}else if(i!==first&&(second===first||values[i]>values[second]))second=i;
   const def=defs[first],legacyWeights=projected(weights),h=base.habitat(sampleSeed,x,y,{weights:legacyWeights}),p=withPalette?palette(values):null;
   let treeChance=0,rockChance=0,decorChance=0;for(let i=0;i<defs.length;i++){treeChance+=defs[i].treeChance*values[i];rockChance+=defs[i].rockChance*values[i];decorChance+=defs[i].decorChance*values[i];}
   const aliases=aliasesFor(def.id),ecology164={revision:1,drainage:c.drainage,substrate:c.substrate,settlementInfluence:c.settlementInfluence,aliases};
   return{id:def.id,name:def.name,primary:def.id,secondary:defs[second].id,blend:values[second]/(values[first]+values[second]),weights,legacyWeights,def,palette:p,ground:p,surface:def.surface,
    ...c,climate:{temperature:c.temperature,moisture:c.moisture,elevation:c.elevation},fertility:clamp(c.moisture*(1-c.elevation*.55)),urban:weights.brownfield,
    treeChance:clamp(treeChance*h.treeFactor),rockChance:clamp(rockChance*h.rockFactor),decorChance:clamp(decorChance*h.decorFactor),habitat:h,aliases,ecology164};
  }
  function definition(id){const d=typeof id==='string'?BY[id]:id?.def||BY[id?.id];if(!d)throw Error('Biome écologique164 inconnu : '+String(id));return d;}
  function buildingPool(id){return definition(id).buildings;}
  function ecologicalDef(sampleSeed,x,y,key,s=sample(sampleSeed,x,y,false)){
   const floor=R.composition.speciesWeightFloor,pool=Object.fromEntries(Object.entries(s.weights).filter(([,weight])=>weight>=floor));if(!Object.keys(pool).length)pool[s.id]=1;return BY[base.weighted(pool,sampleSeed,'ecotone164',key)];
  }
  function patchAt(sampleSeed,x,y){const k=R.composition,scale=k.speciesPatchScale,ix=Math.floor(x/scale),iy=Math.floor(y/scale);let result=null,best=Infinity;
   for(let yy=iy-1;yy<=iy+1;yy++)for(let xx=ix-1;xx<=ix+1;xx++){const px=(xx+.5+(lattice(sampleSeed^164211,xx,yy)-.5)*k.speciesPatchJitter)*scale,py=(yy+.5+(lattice(sampleSeed^164227,xx,yy)-.5)*k.speciesPatchJitter)*scale,d=(px-x)**2+(py-y)**2;if(d<best){best=d;result=xx+':'+yy;}}
   return result;
  }
  function roll(sampleSeed,key,channel){return base.hash(sampleSeed,key,channel)/4294967296;}
  function species(sampleSeed,x,y,key,s,field){const patch=patchAt(sampleSeed,x,y),d=ecologicalDef(sampleSeed,x,y,patch,s),pool={...d[field]};
   if(field==='rocks'){const affinity=R.composition.substrateAffinity;
    for(const kind of Object.keys(pool))pool[kind]*=1+affinity*(kind==='limestone'?1-s.substrate:kind==='granite'?s.substrate:kind==='schist'?1-Math.abs(s.substrate-.5)*2:.5);}
   const grouped=roll(sampleSeed,key,'affinity164')<R.composition.speciesAffinity,chosen=base.weighted(pool,sampleSeed,grouped?patch:key,field,'species164');return{species:chosen,biome:d.id};
  }
  function pickTree(sampleSeed,x,y,key='tree',options={}){const s=sample(sampleSeed,x,y,false,options),v=species(sampleSeed,x,y,key,s,'trees');return{...base.TREES[v.species],id:v.species,species:v.species,biome:v.biome};}
  function pickRock(sampleSeed,x,y,key='rock',options={}){const s=sample(sampleSeed,x,y,false,options),v=species(sampleSeed,x,y,key,s,'rocks');return{...base.ROCKS[v.species],id:v.species,species:v.species,biome:v.biome};}
  function pickBuilding(sampleSeed,x,y,key='site',options={}){return base.weighted(ecologicalDef(sampleSeed,x,y,key,sample(sampleSeed,x,y,false,options)).buildings,sampleSeed,'building164',key);}
  function enemyProfile(sampleSeed,x,y,key='contact',options={}){const d=ecologicalDef(sampleSeed,x,y,key,sample(sampleSeed,x,y,false,options)),kind=base.weighted(d.enemies,sampleSeed,'enemy164',key);return{...base.RULES.enemies[kind],kind,biome:d.id};}
  function surface(sampleSeed,x,y,options={}){return sample(sampleSeed,x,y,false,options).surface;}
  function scatter(sampleSeed,cx,cy,options={}){
   if(!Number.isInteger(cx)||!Number.isInteger(cy)||cx<0||cy<0)return{cx,cy,trees:[],rocks:[],decor:[]};valid(sampleSeed,cx,cy);
   const k=base.RULES.scatter,edge=base.RULES.chunk,clear=options.clear||(()=>true),home=options.home,trees=[],rocks=[],decor=[];
   const free=(x,y,pad)=>!(home&&Math.abs(x-home.x)<(home.half??64)+k.ecologicalClearance+pad&&Math.abs(y-home.y)<(home.half??64)+k.ecologicalClearance+pad)&&clear(x,y,pad);
   // Jittered global cells and local priorities preserve spacing across streamed chunk boundaries.
   const point=(ix,iy,n,salt)=>{const step=edge/n,gx=cx*n+ix,gy=cy*n+iy;return{x:(gx+.5+(lattice(sampleSeed^salt,gx,gy)-.5)*.88)*step,y:(gy+.5+(lattice(sampleSeed^(salt+311),gx,gy)-.5)*.88)*step,gx,gy};};
   const thin=(p,n,salt,spacing)=>{const step=edge/n,priority=lattice(sampleSeed^(salt+733),p.gx,p.gy);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(!xx&&!yy)continue;const gx=p.gx+xx,gy=p.gy+yy;if(lattice(sampleSeed^(salt+733),gx,gy)>=priority)continue;const x=(gx+.5+(lattice(sampleSeed^salt,gx,gy)-.5)*.88)*step,y=(gy+.5+(lattice(sampleSeed^(salt+311),gx,gy)-.5)*.88)*step;if(Math.hypot(p.x-x,p.y-y)<spacing)return false;}return true;};
   const treeGrid=Math.floor(Math.sqrt(k.treeCandidates));
   for(let iy=0;iy<treeGrid;iy++)for(let ix=0;ix<treeGrid;ix++){
    const i=iy*treeGrid+ix,key='T'+cx+'_'+cy+'_'+i,p=point(ix,iy,treeGrid,77519),s=sample(sampleSeed,p.x,p.y,false,options);
    if(roll(sampleSeed,key,'presence')>s.treeChance||!thin(p,treeGrid,77519,k.treeSpacing))continue;
    const v=species(sampleSeed,p.x,p.y,key,s,'trees'),d=base.TREES[v.species],r=d.radius[0]+roll(sampleSeed,key,'radius')*(d.radius[1]-d.radius[0]),canopy=d.canopy[0]+roll(sampleSeed,key,'canopy')*(d.canopy[1]-d.canopy[0]);
    if(free(p.x,p.y,canopy+.6))trees.push({id:key,x:p.x,y:p.y,r,canopy,a:roll(sampleSeed,key,'angle')*Math.PI*2,kind:'tree',species:v.species,biome:v.biome,resource:'wood',amount:d.wood[0]+Math.floor(roll(sampleSeed,key,'amount')*(d.wood[1]-d.wood[0]+1)),label:d.name,habitat:s.habitat.id});
   }
   const rockGrid=Math.floor(Math.sqrt(k.rockCandidates));
   for(let iy=0;iy<rockGrid;iy++)for(let ix=0;ix<rockGrid;ix++){
    const i=iy*rockGrid+ix,key='R'+cx+'_'+cy+'_'+i,p=point(ix,iy,rockGrid,84233),s=sample(sampleSeed,p.x,p.y,false,options);
    if(roll(sampleSeed,key,'presence')>s.rockChance)continue;
    const v=species(sampleSeed,p.x,p.y,key,s,'rocks'),d=base.ROCKS[v.species],r=d.radius[0]+roll(sampleSeed,key,'radius')*(d.radius[1]-d.radius[0]);
    if(free(p.x,p.y,r+.6)&&!trees.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<t.r+r+k.rockSpacing))rocks.push({id:key,x:p.x,y:p.y,r,a:roll(sampleSeed,key,'angle')*Math.PI*2,kind:'rock',species:v.species,biome:v.biome,resource:'stone',amount:d.stone[0]+Math.floor(roll(sampleSeed,key,'amount')*(d.stone[1]-d.stone[0]+1)),label:d.name,habitat:s.habitat.id});
   }
   const decorGrid=Math.floor(Math.sqrt(k.decorCandidates));
   for(let iy=0;iy<decorGrid;iy++)for(let ix=0;ix<decorGrid;ix++){
    const i=iy*decorGrid+ix,key='D135_'+cx+'_'+cy+'_'+i,p=point(ix,iy,decorGrid,49591),s=sample(sampleSeed,p.x,p.y,true,options);
    if(roll(sampleSeed,key,'presence')>s.decorChance||!free(p.x,p.y,.4))continue;
    // Union is deliberate: a habitat may add reeds/flowers absent from its primary biome's pool.
    const pool={};for(const d of defs)for(const[kind,weight]of Object.entries(d.decor))pool[kind]=(pool[kind]||0)+weight*s.weights[d.id];
    for(const[kind,weight]of Object.entries(s.habitat.decorPool))pool[kind]=(pool[kind]||0)+weight*R.composition.habitatDecorWeight;
    const kind=base.weighted(pool,sampleSeed,key,'decor164'),r=.2+roll(sampleSeed,key,'radius')*.65;
    decor.push({id:key,x:p.x,y:p.y,a:roll(sampleSeed,key,'angle')*Math.PI*2,r,kind,biome:s.id,habitat:s.habitat.id,color:kind==='pebbles'||kind==='rubble'?s.palette.rock:kind==='fallenBranch'||kind==='leaves'?s.palette.soil:s.palette.grass});
   }
   return{cx,cy,trees,rocks,decor};
  }
  return Object.freeze({...base,ecologyVersion:1,seed,settlements:towns,ECOLOGY_RULES:R,defs,BY,aliasesFor,compatibleIds:aliasesFor,climate,sample,biomeAt:sample,habitat:(sampleSeed,x,y)=>sample(sampleSeed,x,y,false).habitat,buildingPool,pickBuilding,pickTree,pickRock,enemyProfile,surface,scatter});
 }
 return Object.freeze({get RULES(){return getCore()?.EcologyRules164;},create});
});
