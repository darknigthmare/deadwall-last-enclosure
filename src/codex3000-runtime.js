/* All 3,000 preserved programmes: lookup, compatibility and executable spatial grammar.
 * The catalogue is compiled from the canonical Codex at build time.
 */
(function(root,factory){'use strict';
 const data=root.DeadwallCodex3000Data||(typeof require==='function'?require('./codex3000-live-data.js'):null);
 const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const api=factory(data,G);root.DeadwallCodex3000Runtime=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(DATA,G){'use strict';
 const Recipes159=globalThis.DeadwallCodexRecipes159||(typeof require==='function'?require('./codex3000-recipes159.js'):null);
 const Anchors160=globalThis.DeadwallCodexAnchors160||(typeof require==='function'?require('./codex-anchors160.js'):null);
 const search160=new Map();
 const rows=DATA?.programmes||[],parents=DATA?.parents||{},byId=new Map(),byFamily=new Map();
 for(const r of rows){const p=Object.freeze({id:'DW-'+String(r[0]).padStart(4,'0'),name:r[1],family:r[2],
   parent:'DW-'+String(r[3]).padStart(4,'0'),module:r[4],state:r[5],original:r[0]<=1000});
  byId.set(p.id,p);if(!byFamily.has(p.family))byFamily.set(p.family,[]);byFamily.get(p.family).push(p);}
 const NOT_RENDERABLE=new Set(['Routes et ouvrages','Ports et activités nautiques','Eau et réseaux',
  'Ferroviaire et transports collectifs','Quartiers et agglomérations']);
 const NEEDS_TERRAIN=new Set(['port','plage','lac','riviere','montagne','terre-aride','camp-hostile','camp-allie',
  'routes-coutures','gare-fret','foret-profonde','hopital-soins']);
 const BIOMES={
   'bois-lisiere':['deciduous','mixed','conifer','orchard'],
   'scierie':['deciduous','mixed','conifer'],
   'carriere':['limestone','rockyHighland','brownfield'],
   'mine':['limestone','rockyHighland','brownfield'],
   'prairie':['meadow','bocage','orchard'],
   'ferme':['meadow','bocage','orchard'],
   'hameau':['meadow','bocage','orchard','deciduous','mixed'],
   'ruines-vegetales':['deciduous','mixed','brownfield'],
   'industrie':['brownfield','heath','limestone'],
   'zone-commerciale':['brownfield','meadow','bocage']
 };
 const STATE_FEATURES=Object.freeze({
  evacuation:['cart','crateStack','sign'],
  maintenance:['worktable','toolbox','pallet'],
  recuperation:['trash','crateStack','scrapHeap'],
  'service-arriere':['pallet','cart','crateStack'],
  'lisiere-reprise':['hedge','tree','compost'],
  'relai-temporaire':['shed','bench','waterButt'],
  'reseau-coupe':['barrel','worktable','sign'],
  'repli-organise':['crateStack','sign','pallet']
 });
 const number=id=>Number(String(id).replace('DW-',''));
 function get(id){return byId.get(/^DW-\d{4}$/.test(String(id))?String(id):'DW-'+String(number(id)).padStart(4,'0'))||null;}
 function parentFor(p){const row=get(p?.parent||p?.id);return row?parents[number(row.parent)]||null:null;}
 function enabled(record,context={}){
  if(!record||!parentFor(record))return false;
  if(NOT_RENDERABLE.has(record.family))return false;
  if(!record.module)return true;
  const biome=context.biome||'',town=String(context.townKind||'');
  if(NEEDS_TERRAIN.has(record.module))return false; // No invented rivers, bridges, mine shafts or factions.
  if(BIOMES[record.module]&&biome&&!BIOMES[record.module].includes(biome))return false;
  if(['ville','village','metropole','centre-historique','quartier-collectif','ecole-civique'].includes(record.module)
      &&!town)return false;
  if(record.module==='metropole'&&town!=='grande-ville')return false;
  return true;
 }
 function mappedFamily(p){const code=p?.codex;if(!code)return null;return get(code)?.family||null;}
 function forParcel(seed,p,context={}){
  const family=mappedFamily(p);if(!family)return null;
  const pool=byFamily.get(family)||[];
  if(!pool.length)return null;
  const start=G.hash('codex3000-158',seed,p.id,p.type)%pool.length;
  for(let i=0;i<pool.length;i++){const q=pool[(start+i)%pool.length];if(enabled(q,{...context,biome:context.biome||p.biome}))return q;}
  return get(p.codex);
 }
 // An executable, metric plan. It is not installed on G1-G7 geometry:
 // new plans can be used only on new programme-native sites.
 function template(id,seed=0,siteId='P0000'){
  const programme=get(id);if(!programme)throw Error('Fiche du codex absente : '+id);
  const parent=parentFor(programme),[name,family,dim,rooms,source]=parent;
  const normalized=rooms.map(([title,res,z])=>({name:title,resource:res,z:Number.isInteger(z)&&z>=-1&&z<=2?z:0}));
  const levels=[...new Set([0,...normalized.map(q=>q.z),...(source?.levels||[])])].sort((a,b)=>a-b);
  // Promote upper floors only when source rooms explicitly request them.
  const width=Math.max(17,Math.min(78,dim[0])),height=Math.max(18,Math.min(75,dim[1]));
  const sourceLevels=source?.sourceLevels||source?.levels||levels;
  const adaptedLevels=sourceLevels.length!==levels.length||sourceLevels.some((z,i)=>z!==levels[i]);
  const adaptedFootprint=width!==(source?.sourceMin?.[0]??width)||height!==(source?.sourceMin?.[1]??height);
  const plan={id:programme.id,name:programme.name,family,parent:programme.parent,module:programme.module,
   state:programme.state,siteId,w:width,h:height,levels,rooms:normalized,seed,
   reference:{min:source?.sourceMin||[width,height],max:source?.sourceMax||[width,height],levels:sourceLevels},
   adaptedFootprint,adaptedLevels,adapted:adaptedFootprint||adaptedLevels};
  return Object.freeze(plan);
 }
 function floor(programme,seed,z=0,siteId='P0000'){
  const blueprint=template(programme,seed,siteId);if(!blueprint.levels.includes(z))throw Error('Niveau indisponible');
  const w=blueprint.w,h=blueprint.h,t=.24,mid=w/2,lo=mid-1.7,hi=mid+1.7,walls=[],rooms=[],objects=[],stairs=[];
  const target=blueprint.rooms.filter(r=>r.z===z);if(!target.length)target.push({name:'Accueil',resource:'scrap',z},{name:'Réserve',resource:'wood',z});
  const cellCount=Math.max(1,Math.ceil(target.length/2));
  const height=Math.max(h,cellCount*6.7+1),roomH=(height-.8)/cellCount;
  const wall=(x,y,a,b)=>{if(a>.08&&b>.08)walls.push({x,y,w:a,h:b});};
  const hwall=(x,y,len,door,opening)=>{wall(x,y,door-opening/2-x,t);wall(door+opening/2,y,x+len-door-opening/2,t);};
  const vwall=(x,y,len,door)=>{wall(x,y,t,door-y-.92);wall(x,door+1.05,t,y+len-door-1.05);};
  hwall(0,0,w,mid,2.9);hwall(0,height-t,w,mid,2.4);wall(0,0,t,height);wall(w-t,0,t,height);
  for(let i=0;i<cellCount;i++){
   const y=.4+i*roomH;if(i){wall(.25,y,lo-.25,t);wall(hi,y,w-hi-.25,t);}
   vwall(lo,y,roomH,y+roomH/2);vwall(hi,y,roomH,y+roomH/2);
   for(let side=0;side<2;side++){
    const spec=target[i*2+side];if(!spec)continue;
    const x=side?hi+.3:.34,rw=side?w-hi-.6:lo-.64,rh=roomH-.5;
    rooms.push({name:spec.name,x,y:y+.25,w:rw,h:rh,resource:spec.resource});
   }
  }
  if(blueprint.levels.length>1)stairs.push({id:siteId+':stairs',x:mid-1.05,y:height-3.8,w:2.1,h:2.9,levels:blueprint.levels});
  const labelKind=room=>{
   const n=room.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   if(/jardin|pelouse|verger|serre|culture/.test(n))return'plantTray';
   if(/soin|infirmer|pharma|urgence|consult/.test(n))return'medical';
   if(/cuisin|repas|cantin/.test(n))return'fridge';
   if(/dortoir|chambre|couch|heberge/.test(n))return'bed';
   if(/garag|atelier|techni|machine|tri|outil/.test(n))return'workbench';
   if(/bain|lavage|buanderie/.test(n))return'sink';
   if(/stock|reserve|cellier|entrepot/.test(n))return'crate';
   if(/bureau|reception|accueil|controle|guichet/.test(n))return'desk';
   if(/pont|route|quai|exterieur|chemin|cour/.test(n))return'bench';
   return'shelf';
  };
  let serial=0;for(const room of rooms){const kind=labelKind(room),shape=G.SHAPES[kind],positions=[
   [room.x+.56,room.y+.65],[room.x+room.w-shape[0]-.55,room.y+room.h-shape[1]-.6]];
   for(let i=0;i<2;i++){const [x,y]=positions[i],k=i?(['bed','fridge','medical'].includes(kind)?'wardrobe':'crate'):kind,[ow,oh]=G.SHAPES[k];
    const item={id:siteId+':'+z+':'+serial++,kind:k,x,y,w:ow,h:oh,a:0,resource:room.resource,
      amount:Math.max(1,3+G.hash(seed,programme,siteId,z,serial)%10),room:room.name};
    const area=o=>({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h});
    if(x<room.x+.3||y<room.y+.3||x+ow>room.x+room.w-.3||y+oh>room.y+room.h-.3)continue;
    if(walls.some(v=>G.overlap(area(item),area(v),.18))||stairs.some(v=>G.overlap(area(item),area(v),.22))
      ||objects.some(v=>G.overlap(area(item),area(v),.16)))continue;
    // Keep the hallway and all door centre-lines free.
    if(item.x<hi+1&&item.x+item.w>lo-1)continue;
    objects.push(item);
   }}
  // A depleted or disrupted location redistributes its finite original budget;
  // it may never award a second independent budget for the same programme.
  if(blueprint.state==='recuperation')for(let i=0;i<objects.length;i++)if(i%3===0)objects[i].amount=Math.floor(objects[i].amount/2);
  if(blueprint.state==='evacuation')for(let i=0;i<objects.length;i++)if(i%4===0)objects[i].amount=Math.ceil(objects[i].amount*.7);
  const wsh={walls,rooms,objects,stairs,floor:{x:.24,y:.24,w:w-.48,h:height-.48},
   entry:{x:w/2,y:-1},exit:{x:w/2,y:height+1},style:'codex3000',programme:blueprint.id};
  return wsh;
 }
 const presets=new Map();
 function preset(type){
  if(!/^codex3000-\d{4}$/.test(type))return null;
  if(presets.has(type))return presets.get(type);
  const id='DW-'+type.slice(-4),card=get(id);
  if(!card||NOT_RENDERABLE.has(card.family))return null;
  const b=template(id,0,'P0000');
  const d=Object.freeze({id:type,name:card.name.slice(0,80),w:b.w,h:b.h,levels:b.levels,
    codex:id,layout:'codex3000',family:card.family});
  presets.set(type,d);return d;
 }
 function populateRegion({seed,roads,install,biomes,towns,sectors,spawn,home}){
  if(!DATA||typeof install!=='function')return{eligible:0,placed:0,unsupported:rows.length};
  const viable=roads.filter(r=>r.roadClass!=='approach'
    &&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>=55);
  if(!viable.length)return{eligible:0,placed:0,unsupported:rows.length};
  const bySector=new Map(sectors.map(s=>[s.id,s]));let eligible=0,placed=0,rejected=0,unsupported=0;
  for(const card of byId.values()){
   if(NOT_RENDERABLE.has(card.family)){unsupported++;continue;}
   let accepted=false,qualified=false;const d=preset('codex3000-'+card.id.slice(3));
   const start=G.hash(seed,card.id,'road158')%viable.length;
   // Bounded attempts: no placed building may slice a road, neighbour or approach.
   for(let k=0;k<10;k++){
    const r=viable[(start+k*83)%viable.length],angle=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),
      f=.15+.7*(G.hash(seed,card.id,k,'frontage158')/4294967296),side=G.hash(seed,card.id,k,'side158')%2?1:-1,
      off=r.width/2+26+d.h/2+(k%3)*7,
      x=r.a.x+(r.b.x-r.a.x)*f-Math.sin(angle)*off*side,
      y=r.a.y+(r.b.y-r.a.y)*f+Math.cos(angle)*off*side;
    const biome=biomes.sample(seed,x,y,false,{generation:7});
    const town=towns.find(t=>Math.hypot(x-t.x,y-t.y)<t.radius+55);
    if(!enabled(card,{biome:biome.id,townKind:town?.kind})){continue;}
    qualified=true;
    const p=install(d.id,x,y,angle+(side<0?Math.PI:0),r);
    if(!p)continue;
    const distance=Math.hypot(p.x-home.x,p.y-home.y),occupancy=spawn.roll({seed,id:p.id,biome:biome.def.spawnBiome,distance});
    Object.assign(p,{generation:8,programme3000:card.id,biome:biome.id,
      occupation:occupancy.kind,distanceBand:occupancy.band,
      zone:town?'centre':'activite',sector:'S'+Math.floor(p.x/1024)+'_'+Math.floor(p.y/1024),
      frontier131:{role:occupancy.kind==='allied'?'relay':occupancy.kind==='infected'?'contested':'waypoint'}});
    if(town){p.town=town.id;p.name=card.name.slice(0,70)+' · '+town.name;town.parcels++;}
    else p.name=card.name.slice(0,75)+' · '+biome.name;
    bySector.get(p.sector)?.sites.push(p.id);
    placed++;accepted=true;break;
   }
   if(qualified)eligible++;if(!accepted)rejected++;
  }
  for(const town of towns)if(town.program141)town.program141.parcels=town.parcels;
  return Object.freeze({eligible,placed,rejected,unsupported,programmeCount:rows.length});
 }

 function detailFamily(family){
  if(/Habitat individuel|^habitat$|^rural$/i.test(family))return 'residence';
  if(/Habitat collectif/i.test(family))return 'collective';
  if(/Alimentation/i.test(family))return 'alimentation';
  if(/Hôtellerie/i.test(family))return 'hebergement';
  if(/Santé/i.test(family))return 'medical';
  if(/Éducation|connaissance/i.test(family))return 'education';
  if(/Administration|communauté/i.test(family))return 'administration';
  if(/Secours|Abris|militaire|^public$/i.test(family))return 'securite';
  if(/Agriculture|Forêts|^rural$/i.test(family))return 'campagne';
  if(/Mines|Industrie|production|^industrie$/i.test(family))return 'industrie';
  if(/Entrepôts|Ferroviaire/i.test(family))return 'logistique';
  if(/Automobile|carburant|Énergie|Eau/i.test(family))return 'reseaux';
  if(/Loisirs/i.test(family))return 'loisirs';
  if(/ruines/i.test(family))return 'ruines';
  if(/atelier|Services/i.test(family))return 'artisanat';
  return 'magasins';
 }
 function programmeProps(state){return STATE_FEATURES[state]||[];}
 function describe(id){return Recipes159.describe(id,DATA,{get,parentFor,detailFamily});}
 function dress(options){const api=globalThis.DeadwallCodexDressing160||(typeof require==='function'?require('./codex-dressing160.js'):null);return api?api.enrich(options):options.detail;}
 function searchTerms(id){const entry=get(id);return entry?DATA.details159?.search160?.[entry.parent]||'':'';}
 function enrich(options){return Recipes159.enrich({...options,data:DATA,runtime:{get,parentFor,detailFamily},geometry:G});}
 function anchored(options){return Anchors160.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}
 function quantities(options){const q=globalThis.DeadwallCodexQuantities164||(typeof require==='function'?require('./codex-quantities164.js'):null);if(!q)throw Error('Séries de mobilier non chargées');return q.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159,anchors:Anchors160});}
 function ensembles(options){const q=globalThis.DeadwallCodexEnsembles165||(typeof require==='function'?require('./codex-ensembles165.js'):null);if(!q)throw Error('Ensembles de mobilier non chargés');return q.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}
 function searchDocument(id){const r=get(id);if(!r)return '';if(!search160.has(r.parent))search160.set(r.parent,Anchors160.searchText(describe(r.parent)));return search160.get(r.parent);}
 function summary(){return Object.freeze({count:rows.length,parents:Object.keys(parents).length,
  families:byFamily.size,modules:Object.keys(DATA?.modules||{}).length,states:Object.keys(DATA?.states||{}).length});}
 return Object.freeze({get,parentFor,template,floor,enabled,mappedFamily,forParcel,programmeProps,summary,
  records:Object.freeze([...byId.values()]),byFamily,preset,populateRegion,detailFamily,describe,enrich,dress,searchTerms,anchored,quantities,ensembles,searchDocument});
});
