/* Seeded G6 ecology and opt-in G7 communities, shared by generation, painting and field guide. No simulation RNG or save state. */
(function(root,factory){'use strict';const C=typeof module==='object'&&module.exports?require('./core.js'):root.DeadwallCore;const api=factory(C);root.DeadwallBiomes135=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){'use strict';
const R=C.BiomeRules135,defs=R.defs,BY=Object.freeze(Object.fromEntries(defs.map(d=>[d.id,d]))),clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function hash(seed,...values){let h=(seed>>>0)^2166136261;for(const v of values){for(const c of String(v)){h=Math.imul(h^c.charCodeAt(0),16777619);}h=Math.imul(h^255,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return(h^h>>>16)>>>0;}
function lattice(seed,x,y){let h=(seed^Math.imul(x,0x27d4eb2d)^Math.imul(y,0x165667b1))>>>0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return((h^h>>>16)>>>0)/4294967296;}
function noise(seed,x,y,scale){const xx=x/scale,yy=y/scale,ix=Math.floor(xx),iy=Math.floor(yy),sx=xx-ix,sy=yy-iy,fx=sx*sx*(3-2*sx),fy=sy*sy*(3-2*sy),a=lattice(seed,ix,iy),b=lattice(seed,ix+1,iy),c=lattice(seed,ix,iy+1),d=lattice(seed,ix+1,iy+1);return(a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;}
function valid(seed,x,y){if(!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isFinite(x)||!Number.isFinite(y))throw Error('Coordonnées ou graine de biome invalides.');}
function climate(seed,x,y){valid(seed,x,y);const k=R.climate,wx=x+(noise(seed^132751,x,y,k.warpScale)-.5)*k.warpAmplitude,wy=y+(noise(seed^743231,x,y,k.warpScale)-.5)*k.warpAmplitude,channel=(salt,scale)=>clamp(.5+((noise(seed^salt,wx,wy,scale)*(1-k.detailWeight)+noise(seed^(salt+101),wx,wy,k.detailScale)*k.detailWeight)-.5)*k.contrast);return{temperature:channel(73521,k.temperatureScale),moisture:channel(98971,k.moistureScale),elevation:channel(52361,k.elevationScale)};}
const channels=['base','secondary','soil','accent','rock','grass','water'],colors=defs.map(d=>channels.map(k=>[1,3,5].map(i=>parseInt(d.palette[k].slice(i,i+2),16))));
function blendPalette(weights){const out={};for(let k=0;k<channels.length;k++){let r=0,g=0,b=0;for(let i=0;i<defs.length;i++){const c=colors[i][k],w=weights[i];r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;}out[channels[k]]='#'+Math.round(r).toString(16).padStart(2,'0')+Math.round(g).toString(16).padStart(2,'0')+Math.round(b).toString(16).padStart(2,'0');}return out;}
function sampleBase(seed,x,y,withPalette=true){const c=climate(seed,x,y),v=[c.temperature,c.moisture,c.elevation],scores=new Array(defs.length),values=new Array(defs.length);let first=0,second=1,dist=Infinity,next=Infinity;for(let n=0;n<defs.length;n++){const d=defs[n];let score=0;for(let i=0;i<3;i++){const delta=(v[i]-d.climate[i])/d.spread[i];score+=delta*delta;}scores[n]=score;if(score<dist){second=first;next=dist;first=n;dist=score;}else if(score<next){second=n;next=score;}}const weights={};let total=0;for(let n=0;n<defs.length;n++){const w=Math.exp((dist-scores[n])/(R.climate.blendSoftness/2));values[n]=w;total+=w;}let treeChance=0,rockChance=0,decorChance=0;for(let n=0;n<defs.length;n++){const d=defs[n],w=values[n]/total;values[n]=w;weights[d.id]=w;treeChance+=d.treeChance*w;rockChance+=d.rockChance*w;decorChance+=d.decorChance*w;}const def=defs[first],blend=values[second]/(values[first]+values[second]),palette=withPalette?blendPalette(values):null;return{id:def.id,name:def.name,primary:def.id,secondary:defs[second].id,blend,weights,treeChance,rockChance,decorChance,def,palette,ground:palette,surface:def.surface,...c,fertility:clamp(c.moisture*(1-c.elevation*.55)),urban:weights.brownfield};}
const smooth=(n,range)=>{const t=clamp((n-range[0])/(range[1]-range[0]));return t*t*(3-2*t);};
function ecologyRules(){const k=C.EcologyRules141;if(!k)throw Error('Communautés écologiques G7 absentes.');return k;}
// Natural neighbourhoods use jittered world-space sites, independently of the streaming grid.
function neighbourhood(seed,x,y,scale,salt,jitter){const ix=Math.floor(x/scale),iy=Math.floor(y/scale);let best=null,dist=Infinity;for(let yy=iy-1;yy<=iy+1;yy++)for(let xx=ix-1;xx<=ix+1;xx++){const px=(xx+.5+(lattice(seed^salt,xx,yy)-.5)*jitter)*scale,py=(yy+.5+(lattice(seed^(salt+311),xx,yy)-.5)*jitter)*scale,d=(px-x)**2+(py-y)**2;if(d<dist){dist=d;best={id:xx+':'+yy,x:px,y:py,ix:xx,iy:yy};}}return best;}
function habitat(seed,x,y,base=sampleBase(seed,x,y,false)){
 const k=ecologyRules(),w=base.weights,cover=smooth(noise(seed^371819,x,y,k.patchScale)*(1-k.patchDetailWeight)+noise(seed^571337,x,y,k.fineScale)*k.patchDetailWeight,k.groveThreshold),opening=smooth(noise(seed^903731,x,y,k.openingScale),k.openingThreshold),stone=smooth(noise(seed^614129,x,y,k.mineralScale),k.mineralThreshold),wet=smooth(noise(seed^192391,x,y,k.wetScale),k.wetThreshold);
 const forest=w.deciduous+w.mixed+w.conifer,humid=w.riparian+w.wetland,mineral=w.heath+w.limestone+w.rockyHighland,open=w.meadow+w.bocage,orchard=w.orchard,urban=w.brownfield,weights={grassland:open*(1-cover)+mineral*(1-stone)*(1-cover*k.mineralGroveFraction)+orchard*(1-k.orchardRowsFraction)+urban*(1-cover)*(1-k.urbanStoneFraction),grove:open*cover+humid*cover*k.wetGroveFraction+mineral*(1-stone)*cover*k.mineralGroveFraction,forestFloor:forest*(1-opening),clearing:forest*opening,stonefield:mineral*stone+urban*(1-cover)*k.urbanStoneFraction,reeds:humid*(1-cover*k.wetGroveFraction)*wet,mudflat:humid*(1-cover*k.wetGroveFraction)*(1-wet),orchardRows:orchard*k.orchardRowsFraction,pioneer:urban*cover};
 let id='grassland',peak=-1,treeFactor=0,rockFactor=0,decorFactor=0;const decorPool={};for(const [key,n]of Object.entries(weights)){const d=k.habitats[key];if(n>peak){peak=n;id=key;}treeFactor+=d.treeFactor*n;rockFactor+=d.rockFactor*n;decorFactor+=d.decorFactor*n;for(const [kind,p]of Object.entries(d.decor))decorPool[kind]=(decorPool[kind]||0)+p*n;}
 const field=neighbourhood(seed,x,y,k.orchardFieldScale,129719,k.speciesPatchJitter),orchardAngle=lattice(seed^791789,field.ix,field.iy)*Math.PI,across=(x-field.x)*Math.cos(orchardAngle)+(y-field.y)*Math.sin(orchardAngle),rowDistance=Math.abs(across/k.orchardRowSpacing-Math.round(across/k.orchardRowSpacing))*k.orchardRowSpacing,rowStrength=1-smooth(rowDistance,[0,k.orchardRowWidth]);
 // Orchard rows are old agricultural geometry. Other communities retain continuous density fields.
 treeFactor*=1-orchard+orchard*(k.orchardRowFloor+k.orchardRowPeak*rowStrength);
 return{id,name:k.habitats[id].name,weights,treeFactor,rockFactor,decorFactor,decorPool,openness:clamp(opening*forest+(1-cover)*(open+mineral+urban)),canopy:clamp((1-opening)*forest+cover*(open+humid+urban)),mineral:clamp(stone*mineral),wetness:clamp(wet*humid),orchardAngle,rowDistance,rowSpacing:k.orchardRowSpacing,rowStrength:clamp(rowStrength*orchard)};
}
function sample(seed,x,y,withPalette=true,options={}){const s=sampleBase(seed,x,y,withPalette);if(options?.generation!==7)return s;const h=habitat(seed,x,y,s);return{...s,treeChance:clamp(s.treeChance*h.treeFactor),rockChance:clamp(s.rockChance*h.rockFactor),decorChance:clamp(s.decorChance*h.decorFactor),habitat:h};}
function weighted(pool,seed,...key){const entries=Object.entries(pool||{}).filter(([,v])=>Number.isFinite(v)&&v>0);if(!entries.length)throw Error('Pool écologique vide.');let n=hash(seed,...key)/4294967296*entries.reduce((s,[,v])=>s+v,0);for(const [id,w]of entries){n-=w;if(n<0)return id;}return entries.at(-1)[0];}
function definition(id){const d=typeof id==='string'?BY[id]:id?.def||BY[id?.id];if(!d)throw Error('Biome inconnu : '+String(id));return d;}
function buildingPool(id){return definition(id).buildings;}
function ecologicalDef(seed,x,y,key,options={}){const s=sample(seed,x,y,false,options);return BY[weighted(s.weights,seed,'ecotone',key)];}
function pickBuilding(seed,x,y,key='site',options={}){return weighted(ecologicalDef(seed,x,y,key,options).buildings,seed,'building',key);}
function communitySpecies(seed,x,y,key,s,field){const k=ecologyRules(),patch=neighbourhood(seed,x,y,k.speciesPatchScale,118919,k.speciesPatchJitter),d=BY[weighted(s.weights,seed,'community-biome141',patch.id)],pool=d[field],species=hash(seed,key,'affinity141')/4294967296<k.speciesAffinity?weighted(pool,seed,'community-species141',field,patch.id):weighted(pool,seed,key,field);return{species,biome:d.id};}
function pickTree(seed,x,y,key='tree',options={}){if(options?.generation===7){const s=sample(seed,x,y,false,options),v=communitySpecies(seed,x,y,key,s,'trees');return{...R.trees[v.species],id:v.species,species:v.species,biome:v.biome};}const d=ecologicalDef(seed,x,y,key),species=weighted(d.trees,seed,'tree-species',key);return{...R.trees[species],id:species,species,biome:d.id};}
function pickRock(seed,x,y,key='rock',options={}){if(options?.generation===7){const s=sample(seed,x,y,false,options),v=communitySpecies(seed,x,y,key,s,'rocks');return{...R.rocks[v.species],id:v.species,species:v.species,biome:v.biome};}const d=ecologicalDef(seed,x,y,key),species=weighted(d.rocks,seed,'rock-species',key);return{...R.rocks[species],id:species,species,biome:d.id};}
function enemyProfile(seed,x,y,key='contact',options={}){const d=ecologicalDef(seed,x,y,key,options),kind=weighted(d.enemies,seed,'enemy',key);return{...R.enemies[kind],kind,biome:d.id};}
function surface(seed,x,y,options={}){return sample(seed,x,y,true,options).surface;}
const roll=(seed,key,channel)=>hash(seed,key,channel)/4294967296;
function scatter(seed,cx,cy,options={}){
 if(!Number.isInteger(cx)||!Number.isInteger(cy)||cx<0||cy<0)return{cx,cy,trees:[],rocks:[],decor:[]};valid(seed,cx,cy);
 const k=R.scatter,edge=R.chunk,clear=options.clear||(()=>true),home=options.home,trees=[],rocks=[],decor=[];
 const free=(x,y,pad)=>!(home&&Math.abs(x-home.x)<(home.half??64)+k.ecologicalClearance+pad&&Math.abs(y-home.y)<(home.half??64)+k.ecologicalClearance+pad)&&clear(x,y,pad);
 const point=(ix,iy,n,salt)=>{const step=edge/n,gx=cx*n+ix,gy=cy*n+iy;return{x:(gx+.5+(lattice(seed^salt,gx,gy)-.5)*.88)*step,y:(gy+.5+(lattice(seed^(salt+311),gx,gy)-.5)*.88)*step,gx,gy};};
 const thin=(p,n,salt,spacing)=>{const step=edge/n,priority=lattice(seed^(salt+733),p.gx,p.gy);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(!xx&&!yy)continue;const gx=p.gx+xx,gy=p.gy+yy;if(lattice(seed^(salt+733),gx,gy)>=priority)continue;const x=(gx+.5+(lattice(seed^salt,gx,gy)-.5)*.88)*step,y=(gy+.5+(lattice(seed^(salt+311),gx,gy)-.5)*.88)*step;if(Math.hypot(p.x-x,p.y-y)<spacing)return false;}return true;};
 const treeGrid=Math.floor(Math.sqrt(k.treeCandidates));
 for(let iy=0;iy<treeGrid;iy++)for(let ix=0;ix<treeGrid;ix++){
  const i=iy*treeGrid+ix,key='T'+cx+'_'+cy+'_'+i,p=point(ix,iy,treeGrid,77519),s=sample(seed,p.x,p.y,false,options),d=s.def,chance=s.treeChance,patch=options.generation===7?1:.45+noise(seed^55931,p.x,p.y,k.patchScale)*.9+noise(seed^11851,p.x,p.y,k.patchFineScale)*.25;
  if(roll(seed,key,'presence')>chance*patch||!thin(p,treeGrid,77519,k.treeSpacing))continue;
  const community=options.generation===7?communitySpecies(seed,p.x,p.y,key,s,'trees'):null,species=community?.species||weighted(BY[weighted(s.weights,seed,key,'ecotone')].trees,seed,key),def=R.trees[species],r=def.radius[0]+roll(seed,key,'radius')*(def.radius[1]-def.radius[0]),canopy=def.canopy[0]+roll(seed,key,'canopy')*(def.canopy[1]-def.canopy[0]);
  if(!free(p.x,p.y,canopy+.6))continue;
  trees.push({id:key,x:p.x,y:p.y,r,canopy,a:roll(seed,key,'angle')*Math.PI*2,kind:'tree',species,biome:community?.biome||d.id,resource:'wood',amount:def.wood[0]+Math.floor(roll(seed,key,'amount')*(def.wood[1]-def.wood[0]+1)),label:def.name,...(community?{habitat:s.habitat.id}:{} )});
 }
 const rockGrid=Math.floor(Math.sqrt(k.rockCandidates));
 for(let iy=0;iy<rockGrid;iy++)for(let ix=0;ix<rockGrid;ix++){
  const i=iy*rockGrid+ix,key='R'+cx+'_'+cy+'_'+i,p=point(ix,iy,rockGrid,84233),s=sample(seed,p.x,p.y,false,options),d=s.def,chance=s.rockChance;
  if(roll(seed,key,'presence')>chance*(options.generation===7?1:.6+noise(seed^6191,p.x,p.y,120)*.8))continue;
  const community=options.generation===7?communitySpecies(seed,p.x,p.y,key,s,'rocks'):null,species=community?.species||weighted(BY[weighted(s.weights,seed,key,'ecotone')].rocks,seed,key),def=R.rocks[species],r=def.radius[0]+roll(seed,key,'radius')*(def.radius[1]-def.radius[0]);
  if(!free(p.x,p.y,r+.6)||trees.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<t.r+r+k.rockSpacing))continue;
  rocks.push({id:key,x:p.x,y:p.y,r,a:roll(seed,key,'angle')*Math.PI*2,kind:'rock',species,biome:community?.biome||d.id,resource:'stone',amount:def.stone[0]+Math.floor(roll(seed,key,'amount')*(def.stone[1]-def.stone[0]+1)),label:def.name,...(community?{habitat:s.habitat.id}:{} )});
 }
 const decorGrid=Math.floor(Math.sqrt(k.decorCandidates));
 for(let iy=0;iy<decorGrid;iy++)for(let ix=0;ix<decorGrid;ix++){
  const i=iy*decorGrid+ix,key='D135_'+cx+'_'+cy+'_'+i,p=point(ix,iy,decorGrid,49591),s=sample(seed,p.x,p.y,true,options),d=s.def;
  if(roll(seed,key,'presence')>s.decorChance||!free(p.x,p.y,.4))continue;
  const pool=options.generation===7?Object.fromEntries(Object.entries(d.decor).map(([kind,n])=>[kind,n*(1+(s.habitat.decorPool[kind]||0))])):d.decor,kind=weighted(pool,seed,key),r=.2+roll(seed,key,'radius')*.65;decor.push({id:key,x:p.x,y:p.y,a:roll(seed,key,'angle')*Math.PI*2,r,kind,biome:d.id,color:kind==='pebbles'||kind==='rubble'?s.palette.rock:kind==='fallenBranch'||kind==='leaves'?s.palette.soil:s.palette.grass});
 }
 return{cx,cy,trees,rocks,decor};
}
return Object.freeze({RULES:R,defs,BY,TREES:R.trees,ROCKS:R.rocks,hash,noise,climate,sample,biomeAt:sample,habitat,weighted,buildingPool,pickBuilding,pickTree,pickRock,enemyProfile,surface,scatter});
});
