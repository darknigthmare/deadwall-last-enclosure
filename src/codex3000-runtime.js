/* 3,000 preserved cards + 1,000 independent programmes: lookup, compatibility
 * and executable spatial grammar, compiled from canonical author sources.
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
 const rows=DATA?.programmes||[],parents=DATA?.parents||{},byId=new Map(),byFamily=new Map(),legacyByFamily=new Map();
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 for(const r of rows){const p=Object.freeze({id:'DW-'+String(r[0]).padStart(4,'0'),name:r[1],family:r[2],
   parent:'DW-'+String(r[3]).padStart(4,'0'),module:r[4],state:r[5],original:r[0]<=1000,
   ...(r[0]>3000?{independent:true,extension:158,details:freeze(parents[r[3]]?.[5])}:{})});
  byId.set(p.id,p);if(!byFamily.has(p.family))byFamily.set(p.family,[]);byFamily.get(p.family).push(p);
  if(r[0]<=3000){if(!legacyByFamily.has(p.family))legacyByFamily.set(p.family,[]);legacyByFamily.get(p.family).push(p);}}
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
  if(record.extension===158){const p=record.details?.placement;if(!p)return false;
   if(context.biome&&!p.biomes.includes(context.biome))return false;
   if(p.mode==='town'&&(!context.townKind||!p.townKinds.includes(context.townKind)))return false;
   if(p.mode==='rural'&&context.townKind)return false;
   return true;
  }
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
  // Adding a catalogue must not reshuffle decoration selections in saved G1–G8.
  const pool=(p.generation>=9?byFamily:legacyByFamily).get(family)||[];
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
   adaptedFootprint,adaptedLevels,adapted:adaptedFootprint||adaptedLevels,
   ...(programme.extension===158?{architecture:programme.details.architecture,spaces:programme.details.spaces,access:programme.details.access}: {})};
  return Object.freeze(plan);
 }
 function floor(programme,seed,z=0,siteId='P0000'){
  const blueprint=template(programme,seed,siteId);if(!blueprint.levels.includes(z))throw Error('Niveau indisponible');
  if(blueprint.architecture)return floor158(blueprint,z);
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
 // New authored programmes use four actual distributions. Legacy floor()
 // remains byte-for-byte in its geometry, object serials and finite amounts.
 function floor158(blueprint,z){
  const {w,h,seed,siteId,id:programme}=blueprint,layout=blueprint.architecture.layout,t=.24,
   lobby=layout==='gallery'?3.2:2.2,hall=layout==='gallery'?5.2:3.4,
   mid=layout==='offset'?w*.38:w/2,lo=mid-hall/2,hi=mid+hall/2,
   targets=blueprint.spaces.filter(s=>s.z===z),count=Math.ceil(targets.length/2),
   cross=layout==='cross'?3.2:0,cut=Math.ceil(count/2),rh=(h-lobby*2-cross)/count,
   walls=[],rooms=[],objects=[],stairs=[];
  const wall=(x,y,a,b)=>{if(a>.08&&b>.08)walls.push({x,y,w:a,h:b});};
  const horizontal=(x,y,len,center,opening=2.6)=>{wall(x,y,center-opening/2-x,t);wall(center+opening/2,y,x+len-center-opening/2,t);};
  const vertical=(x,y,len,center)=>{wall(x,y,t,center-y-1.1);wall(x,center+1.1,t,y+len-center-1.1);};
  horizontal(0,0,w,w/2,Math.max(2.6,blueprint.access.width_m));horizontal(0,h-t,w,w/2,2.6);wall(0,0,t,h);wall(w-t,0,t,h);
  for(let i=0;i<count;i++){
   const y=lobby+i*rh+(i>=cut?cross:0);
   wall(.24,y,lo-.24,t);wall(hi,y,w-hi-.24,t);
   // The cross aisle remains open between both wings and the centre spine.
   if(i===count-1||cross&&i===cut-1){wall(.24,y+rh,lo-.24,t);wall(hi,y+rh,w-hi-.24,t);}
   vertical(lo,y,rh,y+rh/2);vertical(hi,y,rh,y+rh/2);
   for(let side=0;side<2;side++){
    const spec=targets[i*2+side];if(!spec)continue;
    rooms.push({id:spec.id,name:spec.name,x:side?hi+.35:.35,y:y+.3,
     w:side?w-hi-.7:lo-.7,h:rh-.6,resource:spec.resource,usage:spec.usage,props:spec.props});
   }
  }
  if(blueprint.levels.length>1)stairs.push({id:siteId+':stairs',x:mid-1.05,y:h-lobby-2.9,w:2.1,h:2.9,levels:blueprint.levels});
  const area=o=>({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h});
  let serial=0;for(const room of rooms)for(let i=0;i<room.props.length;i++){
   const spec=room.props[i],[ow,oh]=G.SHAPES[spec.kind],positions=i?
    [[room.x+room.w-ow-.55,room.y+room.h-oh-.55],[room.x+.55,room.y+room.h-oh-.55]]:
    [[room.x+.55,room.y+.55],[room.x+room.w-ow-.55,room.y+.55]];
   // Container IDs reserve the author slot even when a physical fit is refused.
   const objectId=siteId+':'+z+':'+serial++,amount=3+G.hash(seed,programme,siteId,z,serial)%10;
   for(const [x,y]of positions){const o={id:objectId,kind:spec.kind,x,y,w:ow,h:oh,a:0,resource:spec.resource,amount,room:room.name};
    if(x<room.x+.3||y<room.y+.3||x+ow>room.x+room.w-.3||y+oh>room.y+room.h-.3)continue;
    if(walls.some(v=>G.overlap(area(o),area(v),.18))||stairs.some(v=>G.overlap(area(o),area(v),.22))||objects.some(v=>G.overlap(area(o),area(v),.16)))continue;
    // Protect the whole approach from each room door to the spine.
    if(y<room.y+room.h/2+.55&&y+oh>room.y+room.h/2-.55&&x<hi+1&&x+ow>lo-1)continue;
    objects.push(o);break;
   }
  }
  return{walls,rooms:rooms.map(({props,...room})=>room),objects,stairs,
   floor:{x:.24,y:.24,w:w-.48,h:h-.48},entry:{x:w/2,y:-1},exit:{x:w/2,y:h+1},
   style:'codex3000',programme,layout158:layout};
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
 function populateRegion({seed,roads,install,biomes,towns,sectors,spawn,home,generation=8}){
  const candidates=[...byId.values()].filter(card=>generation>=9||number(card.id)<=3000);
  if(!DATA||typeof install!=='function')return{eligible:0,placed:0,unsupported:candidates.length};
  const viable=roads.filter(r=>r.roadClass!=='approach'
    &&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>=55);
  if(!viable.length)return{eligible:0,placed:0,unsupported:candidates.length};
  const bySector=new Map(sectors.map(s=>[s.id,s]));let eligible=0,placed=0,rejected=0,unsupported=0;
  for(const card of candidates){
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
    Object.assign(p,{generation:card.extension===158?9:8,programme3000:card.id,biome:biome.id,
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
  return Object.freeze({eligible,placed,rejected,unsupported,programmeCount:candidates.length});
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
 function describe(id){
  const record=get(id);if(!record)throw Error('Programme inconnu : '+id);
  if(record.extension!==158)return Recipes159.describe(id,DATA,{get,parentFor,detailFamily});
  const source=record.details;
  // The independent addendum has authored space/prop slots, not the older
  // quantified furniture prescriptions. Keep that distinction visible.
  return freeze({id:record.id,parent:record.parent,name:record.name,family:record.family,module:record.module,state:record.state,
   rooms:source.spaces.map(space=>({id:space.id,name:space.name,exterior:false,classificationSource:'authored',
    levels:[space.z],area:null,repeat:[1,1],resource:space.resource,props:[],authoredProps:[],sourceProps158:space.props,
    kit:Recipes159.kitFor(space.name),required:[],optional:[],placement:space.usage||'',furnishingSource:'independent-authored-slots'})),
   exteriorOptions:[],gardenOptions:[],access:[],sourceAccess158:source.access,
   plot:{enveloppe_min_m:[source.architecture.width,source.architecture.height],enveloppe_max_m:[source.architecture.width,source.architecture.height]},
   loot:source.loot||null,exterior:source.exterior||null,causal:null,postFall:source.story||null,source158:source,
   implementation:'Programme indépendant 1.58 : espaces et contenants propres conservés. Les accessoires sont des emplacements auteur, sans quantités ou hauteurs de mobilier ajoutées.'});
 }
 function dress(options){const api=globalThis.DeadwallCodexDressing160||(typeof require==='function'?require('./codex-dressing160.js'):null);return api?api.enrich(options):options.detail;}
 function searchTerms(id){const entry=get(id);return entry?DATA.details159?.search160?.[entry.parent]||'':'';}
 function enrich(options){if(get(options.programme||options.p.codex)?.extension===158)return options.detail;return Recipes159.enrich({...options,data:DATA,runtime:{get,parentFor,detailFamily},geometry:G});}
 function anchored(options){return Anchors160.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}
 function quantities(options){const q=globalThis.DeadwallCodexQuantities164||(typeof require==='function'?require('./codex-quantities164.js'):null);if(!q)throw Error('Séries de mobilier non chargées');return q.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159,anchors:Anchors160});}
 function ensembles(options){const q=globalThis.DeadwallCodexEnsembles165||(typeof require==='function'?require('./codex-ensembles165.js'):null);if(!q)throw Error('Ensembles de mobilier non chargés');return q.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}
 function fill(options){const api=globalThis.DeadwallCodexFill168||(typeof require==='function'?require('./codex-fill168.js'):null);if(!api)throw Error('Complément mobilier non chargé');return api.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159,anchors:Anchors160});}
 function infill(options){const api=globalThis.DeadwallCodexInfill169||(typeof require==='function'?require('./codex-infill169.js'):null);if(!api)throw Error('Compléments de cour non chargés');return api.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159,anchors:Anchors160});}
 function stations(options){const api=globalThis.DeadwallCodexStations170||(typeof require==='function'?require('./codex-stations170.js'):null);if(!api)throw Error('Postes et stocks au sol non chargés');return api.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}
 function gardens(options){const api=globalThis.DeadwallCodexGardens171||(typeof require==='function'?require('./codex-gardens171.js'):null),D=globalThis.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null),description=describe(options.programme||options.p.codex);if(!api||!D)throw Error('Jardins composés non chargés');return api.enrich({...options,description,geometry:G,recipes:Recipes159,shapes:{...D.objects,...Recipes159.EXTRA_SHAPES},family:detailFamily(description.family)});}
 function searchDocument(id){const r=get(id);if(!r)return '';if(!search160.has(r.parent))search160.set(r.parent,Anchors160.searchText(describe(r.parent)));return search160.get(r.parent);}
 function packing(options){const api=globalThis.DeadwallCodexPacking173||(typeof require==='function'?require('./codex-packing173.js'):null);if(!api)throw Error('Travées intérieures non chargées');return api.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}
 function summary(){return Object.freeze({count:rows.length,legacyCount:Math.min(rows.length,3000),extensionCount:Math.max(0,rows.length-3000),parents:Object.keys(parents).length,
  families:byFamily.size,modules:Object.keys(DATA?.modules||{}).length,states:Object.keys(DATA?.states||{}).length});}
 return Object.freeze({packing,get,parentFor,template,floor,enabled,mappedFamily,forParcel,programmeProps,summary,
  records:Object.freeze([...byId.values()]),byFamily,preset,populateRegion,detailFamily,describe,enrich,dress,searchTerms,anchored,quantities,ensembles,fill,infill,stations,gardens,searchDocument});
});
