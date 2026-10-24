'use strict';
/* Metric authoring input. No campaign installer, stock owner or service simulation. */
const Reference = require('./codex-world-foundations2026.cjs');

// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,wallM:.2,doorM:1.1,privateCorridorM:1.4,
  commonCorridorM:2.6,stairWidthM:1.4,floorToFloorM:3,clearHeightM:2.6,serviceRoadM:4.5,pathM:1.4,
  shaftWidthM:8,shaftDepthM:7,maxHousingProps:5000});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const PROFILES=freeze({
 'EXT-MONDE-T037':{name:'Collecteur urbain',family:'sewer',medium:'wastewater',depths:1,channelWidthM:8,
  rooms:['contrôle du collecteur','local pompes de service','atelier de maintenance','réserve outillage','local ventilation','réserve de curage']},
 'EXT-MONDE-T038':{name:'Réseau unitaire ancien',family:'sewer',medium:'combined-wastewater',depths:2,channelWidthM:8,
  rooms:['contrôle du réseau unitaire','atelier maintenance','local ventilation','réserve de curage','local pompes de service','réserve outillage','distribution électrique','contrôle du déversoir']},
 'EXT-MONDE-T039':{name:'Galerie pluviale',family:'sewer',medium:'stormwater',depths:1,channelWidthM:14,
  rooms:['contrôle du bassin versant','atelier de maintenance des regards','réserve de curage','local ventilation']},
 'EXT-MONDE-T040':{name:'Station souterraine de relevage',family:'sewer',medium:'wastewater',depths:3,channelWidthM:8,
  rooms:['local pompes de relevage','atelier maintenance','distribution électrique','réserve outillage','contrôle de niveau','local ventilation']},
 'EXT-MONDE-T041':{name:'Barre HLM',family:'housing',form:'linear-block'},
 'EXT-MONDE-T042':{name:'Tour HLM',family:'housing',form:'tower'},
 'EXT-MONDE-T043':{name:'Résidence en cour',family:'housing',form:'courtyard-blocks'},
 'EXT-MONDE-T044':{name:'Ensemble HLM mixte',family:'housing',form:'mixed-height-blocks'}
});
const TYPES=Object.freeze(Object.keys(PROFILES));
const finite=(...values)=>values.every(Number.isFinite);
const positive=value=>Number.isFinite(value)&&value>0;
const rectangle=value=>value&&finite(value.x,value.y,value.w,value.h)&&value.w>0&&value.h>0;
const overlap=(a,b)=>a.x<b.x+b.w-1e-8&&a.x+a.w>b.x+1e-8&&a.y<b.y+b.h-1e-8&&a.y+a.h>b.y+1e-8;
const contains=(a,b)=>rectangle(a)&&b&&finite(b.x,b.y,b.w,b.h)&&b.x>=a.x-1e-8&&b.y>=a.y-1e-8&&b.x+b.w<=a.x+a.w+1e-8&&b.y+b.h<=a.y+a.h+1e-8;

function build(type,number){
 if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie ou variante urbaine invalide.');
 const profile=PROFILES[type],size=Math.floor((number-1)/10),pattern=(number-1)%10,id=type+'-V'+String(number).padStart(2,'0');
 const plan={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
  authorFamily:'urban-services',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
  configuration:{sizeTier:size+1,arrangement:pattern+1,family:profile.family},bounds:null,
  levels:[{id:'ground',index:0,elevationM:0,clearHeightM:RULES.clearHeightM}],
  buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],surfaceAreas:[],
  network:{nodes:[],edges:[],transitions:[],externalPorts:[]},
  operations:{lootContainersCreated:0,connectedServices:0,outputCreated:0},
  designAssumptions:[
   'Les dimensions, niveaux et compositions sont des choix auteur originaux en mètres, sans relevé de bâtiment réel ni conformité réglementaire revendiquée.',
   'Les étages ne possèdent que les sols de pièces, coursives et paliers explicitement déclarés. Le vide extérieur ne devient pas un sol.',
   'Les escaliers et échelles désignent des transitions piétonnes alignées entre paliers adjacents ; aucun ascenseur ou trajet automobile n’est activé.'
  ],
  unresolved:['implantation et raccords dans le seed','budgets finis de butin et identités de campagne','rencontres et occupation',
   'eau, assainissement, énergie et procédés réellement connectés','sécurité et conformité des ouvrages','art définitif, sauvegarde et qualification de campagne']};
 const nodes=new Map();
 function level(key,elevationM){const value={id:key,index:plan.levels.length,elevationM,clearHeightM:RULES.clearHeightM};plan.levels.push(value);return value.index;}
 function node(key,x,y,index=0,roomId){
  if(nodes.has(key)||!plan.levels[index])throw Error('Nœud ou niveau urbain répété/invalide.');
  const value={id:id+':'+key,x,y,level:index,z:plan.levels[index].elevationM};if(roomId)value.roomId=roomId;
  nodes.set(key,value);plan.network.nodes.push(value);return key;
 }
 function edge(from,to,mode='pedestrian'){
  const a=nodes.get(from),b=nodes.get(to);if(!a||!b||a.level!==b.level||from===to)throw Error('Liaison horizontale urbaine invalide.');
  plan.network.edges.push({id:id+':edge:'+plan.network.edges.length,from:a.id,to:b.id,widthM:mode==='service'?RULES.serviceRoadM:RULES.pathM,mode,level:a.level});
 }
 function surface(key,kind,name,x,y,w,h,index){
  plan.surfaceAreas.push({id:id+':'+key,kind,name,x,y,w,h,level:index,walkable:true,origin:'author-design',lootAssigned:false,utilityConnected:false});
 }
 function building(key,role,x,y,w,h,index,names,entrySide='north',extra={}){
  const privateHome=role==='dwelling',core=role==='stair-core',cw=core?3.2:RULES.privateCorridorM,t=RULES.wallM;
  const b={id:id+':'+key,kind:role,name:extra.name||role,role,x,y,w,h,rotationRad:0,entrySide,
   heightM:RULES.floorToFloorM,heightOrigin:'author-design',footprintOrigin:'author-design',floorElevationM:plan.levels[index].elevationM,
   levels:[index],rooms:[],portals:[],entry:{x:w/2,y:entrySide==='north'?0:h,level:index,widthM:RULES.doorM},...extra};
  const c={id:b.id+':circulation',name:core?'circulation du noyau':'circulation',kind:'circulation',
   x:(w-cw)/2,y:0,w:cw,h,level:index,clearHeightM:RULES.clearHeightM};b.rooms.push(c);
  const rooms=[];
  if(privateHome){
   // Keep wet rooms shallow while reserving enough depth for the WC/shower
   // and hand-washing access. Extra variant depth belongs to the living rooms.
   const wetStart=1-(2.46+2*t)/h;
   for(const [side,start,end,name] of [
    [0,0,.39,'séjour familial'],[0,.39,wetStart,'chambre parentale'],[0,wetStart,1,'sanitaires du logement'],
    [1,0,.44,'cuisine familiale'],[1,.44,wetStart,'chambre enfant'],[1,wetStart,1,'douches du logement']
   ])rooms.push({side,start:start*h,end:end*h,name});
  }else{
   const rows=Math.ceil(names.length/2);for(let i=0;i<names.length;i++)rooms.push({side:i%2,start:Math.floor(i/2)*h/rows,end:(Math.floor(i/2)+1)*h/rows,name:names[i]});
  }
  for(let i=0;i<rooms.length;i++){
   const r0=rooms[i],r={id:b.id+':room:'+i,name:r0.name,x:r0.side?(w+cw)/2+t:t,y:r0.start+t,
    w:(w-cw)/2-2*t,h:r0.end-r0.start-2*t,level:index,clearHeightM:RULES.clearHeightM};
   b.rooms.push(r);b.portals.push({id:r.id+':door',from:c.id,to:r.id,x:r0.side?c.x+c.w:c.x,y:r.y+r.h/2,
    widthM:RULES.doorM,wallGapM:t,axis:'y',level:index});
  }
  plan.buildings.push(b);return b;
 }
 function core(key,x,y,indices,entrySide='south',kind='stairs',blockId=null){
  const landings=[];
  for(const index of indices){
   const b=building(key+':level:'+index,'stair-core',x,y,RULES.shaftWidthM,RULES.shaftDepthM,index,[],entrySide,
    {name:kind==='stairs'?'Cage d’escalier déclarée':'Regard et palier de visite',blockId});
   const k=node(key+':landing:'+index,x+b.entry.x,y+b.entry.y,index,b.rooms[0].id);
   landings.push({level:index,node:k,building:b.id,room:b.rooms[0].id});
  }
  const ordered=[...landings].sort((a,b)=>plan.levels[a.level].elevationM-plan.levels[b.level].elevationM);
  for(let i=1;i<ordered.length;i++)plan.network.transitions.push({id:id+':transition:'+plan.network.transitions.length,
   from:nodes.get(ordered[i-1].node).id,to:nodes.get(ordered[i].node).id,kind,widthM:RULES.stairWidthM});
  return {id:id+':'+key,x,y,w:RULES.shaftWidthM,h:RULES.shaftDepthM,kind,blockId,landings};
 }
 function groundSpine(yValues,connections){
  node('site-gate',8,0);node('site-exit',8,plan.bounds.h);
  const ys=[...new Set([6,...yValues,plan.bounds.h-6])].sort((a,b)=>a-b);let previous='site-gate';
  for(let i=0;i<ys.length;i++){const k=node('ground-spine:'+i,8,ys[i]);edge(previous,k,'service');previous=k;}
  edge(previous,'site-exit','service');
  for(const connection of connections){const at=ys.indexOf(connection.y);edge('ground-spine:'+at,connection.node);}
  plan.network.externalPorts.push({node:nodes.get('site-gate').id,requires:'local-road',connectedToWorld:false},
   {node:nodes.get('site-exit').id,requires:'service-road',connectedToWorld:false});
 }

 if(profile.family==='housing'){
  const uw=11+size*.08+(pattern%5)*.04,uh=11.2+size*.1+Math.floor(pattern/5)*.2,
   common=RULES.commonCorridorM+(pattern%5)*.15;
  const columns=type==='EXT-MONDE-T041'?2+(pattern%2):2,bw=RULES.shaftWidthM+2+columns*(uw+.4),bh=uh*2+common;
  const specs=[];
  if(type==='EXT-MONDE-T041')specs.push({x:28,y:28,floors:3+size,columns});
  if(type==='EXT-MONDE-T042')specs.push({x:28,y:28,floors:7+size,columns});
  if(type==='EXT-MONDE-T043'){
   specs.push({x:28,y:28,floors:3+size%3,columns},{x:28,y:84+pattern*.4,floors:3+(size+1)%3,columns});
   if(pattern%2)specs.push({x:28+bw+24+pattern*.3,y:56,floors:3+(size+2)%3,columns});
  }
  if(type==='EXT-MONDE-T044')specs.push({x:28,y:28,floors:4+size%3,columns},
   {x:28+bw+28+pattern*.4,y:28,floors:6+size%3,columns});
  const floorCount=Math.max(...specs.map(s=>s.floors));
  for(let i=1;i<floorCount;i++)level('floor-'+i,i*RULES.floorToFloorM);
  const basement=level('basement',-RULES.floorToFloorM);
  plan.bounds={x:0,y:0,w:Math.max(...specs.map(s=>s.x+bw))+24+pattern*.3,
   h:Math.max(...specs.map(s=>s.y+bh),type==='EXT-MONDE-T044'?111:0)+24+pattern*.25};
  plan.housing={form:profile.form,floorToFloorM:RULES.floorToFloorM,basementLevel:basement,blocks:[],stairCores:[],units:[],campaignOccupantsCreated:0};
  const spineY=[],connections=[];
  for(let bi=0;bi<specs.length;bi++){
   const s=specs[bi],key='block:'+bi,blockId=id+':'+key,hallY=s.y+uh,coreY=hallY-RULES.shaftDepthM;
   const indices=[basement,...Array.from({length:s.floors},(_,i)=>i)];
   const shaft=core(key+':stairs',s.x,coreY,indices,'south','stairs',blockId);plan.housing.stairCores.push(shaft);
   const block={id:blockId,x:s.x,y:s.y,w:bw,h:bh,floors:s.floors,levels:indices,unitIds:[],stairCore:shaft.id,
    heightM:s.floors*RULES.floorToFloorM,roofParapetM:.35+(pattern%3)*.1,geometryOrigin:'author-design'};
   plan.housing.blocks.push(block);
   for(let floor=0;floor<s.floors;floor++){
    surface(key+':hall:'+floor,'common-corridor','Coursive commune du bloc '+(bi+1),s.x,hallY,bw,common,floor);
    const shaftLanding=shaft.landings.find(l=>l.level===floor).node;
    const root=node(key+':hall-root:'+floor,s.x+RULES.shaftWidthM/2,hallY+common/2,floor);edge(shaftLanding,root);
    if(floor===0){spineY.push(hallY+common/2);connections.push({y:hallY+common/2,node:root});}
    let previous=root;
    for(let col=0;col<s.columns;col++){
     const ux=s.x+RULES.shaftWidthM+2+col*(uw+.4),doorX=ux+uw/2;
     const junction=node(key+':hall:'+floor+':'+col,doorX,hallY+common/2,floor);edge(previous,junction);previous=junction;
     for(const south of [false,true]){
      const unitKey=key+':unit:'+floor+':'+col+':'+(south?'south':'north'),uy=south?hallY+common:s.y;
      const unit=building(unitKey,'dwelling',ux,uy,uw,uh,floor,[],south?'north':'south',
       {name:'Logement '+(bi+1)+'-'+floor+'-'+col+'-'+(south?'S':'N'),blockId,privateCirculation:true});
      const entry=node(unitKey+':entry',doorX,uy+unit.entry.y,floor);edge(junction,entry);
      block.unitIds.push(unit.id);plan.housing.units.push({id:unit.id,block:blockId,level:floor,privateHall:unit.rooms[0].id,
       rooms:unit.rooms.slice(1).map(r=>r.id),areaM2:uw*uh,areaBasis:'gross-author-footprint',occupantsAssigned:false});
     }
    }
   }
   surface(key+':cellar-landing','cellar-landing','Palier de cave du bloc '+(bi+1),s.x+1,hallY,6,2,basement);
   const cellar=building(key+':cellar','cellar-services',s.x+RULES.shaftWidthM+2,hallY-7,18,7,basement,
    ['réserve commune des caves','tableau de distribution électrique'],'south',{name:'Caves et locaux techniques',blockId});
   surface(key+':cellar-corridor','cellar-corridor','Desserte des caves',s.x+1,hallY,27,2,basement);
   const cellNode=node(key+':cellar-entry',cellar.x+cellar.entry.x,hallY,basement);
   const a=node(key+':cellar-turn-a',s.x+4,hallY+1,basement),b=node(key+':cellar-turn-b',cellar.x+cellar.entry.x,hallY+1,basement);
   edge(shaft.landings.find(l=>l.level===basement).node,a);edge(a,b);edge(b,cellNode);
  }
  if(type==='EXT-MONDE-T043')plan.outdoorAreas.push({id:id+':shared-court',kind:'communal-court',name:'Cour commune entre les blocs',
   x:28,y:28+bh+3,w:bw,h:Math.max(8,84+pattern*.4-(28+bh+6)),level:0,walkable:true,origin:'author-design',lootAssigned:false,utilityConnected:false});
  if(type==='EXT-MONDE-T044'){
   const annex=building('common-services','common-services',28,84,32,24,0,
    ['buanderie commune','atelier maintenance','local nettoyage','réserve commune'],'north',{name:'Locaux communs de l’ensemble'});
   const turn=node('common-services:turn',annex.x+annex.entry.x,80),entry=node('common-services:entry',annex.x+annex.entry.x,84);edge(turn,entry);
   spineY.push(80);connections.push({y:80,node:turn});
  }
  groundSpine(spineY,connections);
  plan.maxHeightM=Math.max(...plan.housing.blocks.map(b=>b.heightM+b.roofParapetM));
  plan.configuration.form=profile.form;
  plan.designAssumptions.push('Les appartements possèdent un couloir privé. Leurs portes de pièces ne donnent pas directement sur la coursive collective.',
   'Les cages d’escalier ont une emprise réservée de 8 × 7 m ; le détail constructif des volées et les règles d’évacuation restent à qualifier.');
 }else{
  const W=200+size*12+pattern*.7,H=180+size*10+pattern*2,deep=profile.depths;
  for(let i=1;i<=deep;i++)level('underground-'+i,-i*RULES.floorToFloorM);
  plan.bounds={x:0,y:0,w:W,h:H};plan.depthM=deep*RULES.floorToFloorM;
  plan.sewer={medium:profile.medium,deepestLevel:deep,depthM:plan.depthM,depthDatum:'deepest-dry-gallery-floor',dryGalleries:[],accessShafts:[],waterStructures:[],
   hydraulicFlow:{scope:'author-hydraulic-diagram-not-simulated',operational:false,potable:false,nodes:[],links:[],outfalls:[]}};
  const control=building('surface-services','sewer-surface-services',24,12,24,14,0,
   ['contrôle du réseau','distribution électrique','atelier de maintenance','réserve outillage',
    'sanitaires du personnel','douches du personnel','vestiaires du personnel','cuisine du personnel'],
   'north',{name:'Exploitation et locaux du personnel'});
  const controlApproach=node('surface-services:approach',control.x+control.entry.x,6),controlEntry=node('surface-services:entry',control.x+control.entry.x,12);edge(controlApproach,controlEntry);
  const levels=Array.from({length:deep+1},(_,i)=>i),north=core('north-access',42,27,levels,'south','ladder'),south=core('emergency-access',42,H-12,levels,'north','ladder');
  plan.sewer.accessShafts.push(north,south);
  const connections=[{y:6,node:controlApproach}],spineY=[6,37,H-15];
  for(const [shaft,approachY]of [[north,37],[south,H-15]]){
   const g=shaft.landings.find(l=>l.level===0).node,approach=node(shaft.id.endsWith('north-access')?'north-ground-approach':'south-ground-approach',46,approachY,0);
   edge(approach,g);connections.push({y:approachY,node:approach});
  }
  const waterX=profile.channelWidthM>8?90:80;
  for(let index=1;index<=deep;index++){
   const gallery=building('dry-gallery:'+index,'dry-gallery',50,40,22,H-58,index,profile.rooms,'north',
    {name:'Galerie sèche de visite '+index,medium:profile.medium});
   plan.sewer.dryGalleries.push({building:gallery.id,level:index,widthM:RULES.privateCorridorM,waterSeparated:true});
   surface('north-landing:'+index,'inspection-landing','Palier sec nord',42,34,37,6,index);
   surface('east-walkway:'+index,'inspection-walkway','Banquette sèche parallèle au canal',73,34,6,H-48,index);
   surface('south-landing:'+index,'inspection-landing','Palier sec de secours',42,H-18,37,6,index);
   const start=north.landings.find(l=>l.level===index).node,end=south.landings.find(l=>l.level===index).node;
   const a=node('north-turn:'+index,46,37,index),b=node('gallery-approach:'+index,61,37,index),e=node('gallery-entry:'+index,61,40,index),
    c=node('walkway-north:'+index,76,37,index),d=node('walkway-south:'+index,76,H-16,index),f=node('south-turn:'+index,46,H-16,index);
   edge(start,a);edge(a,b);edge(b,e);edge(b,c);edge(c,d);edge(d,f);edge(f,end);
  }
  groundSpine(spineY,connections);
  const waterLevels=type==='EXT-MONDE-T038'?[1,2]:[deep],flow=plan.sewer.hydraulicFlow,flowByLevel=[];
  function water(key,kind,x,y,w,h,index){
   const asset={id:id+':'+key,kind,name:kind==='overflow-channel'?'Déversoir fermé':'Canal hydraulique fermé',x,y,w,h,level:index,
    water:true,walkable:false,maxHeightM:1.4,heightOrigin:'author-design',footprintOrigin:'author-design',interiorStatus:'closed-hydraulic-volume',lootAssigned:false,utilityConnected:false};
   plan.structures.push(asset);plan.sewer.waterStructures.push(asset.id);return asset;
  }
  for(const index of waterLevels){
   const channel=water('main-channel:'+index,'closed-sewer-channel',waterX,42,profile.channelWidthM,H-70,index);
   const out=water('outfall-channel:'+index,'overflow-channel',waterX,H-28,profile.channelWidthM,12,index);
   water('branch-a:'+index,'closed-sewer-branch',waterX+profile.channelWidthM,60,44+pattern*.2,4,index);
   water('branch-b:'+index,'closed-sewer-branch',waterX+profile.channelWidthM,90,44+pattern*.2,4,index);
   const centerX=channel.x+channel.w/2,z=plan.levels[index].elevationM;
   const defs=[['head',centerX,44,z-.3],['junction-a',centerX,62,z-.5],['junction-b',centerX,92,z-.7],
    ['outfall',centerX,H-20,z-.9],['branch-a',channel.x+channel.w+40,62,z-.4],['branch-b',channel.x+channel.w+40,92,z-.6]];
   const local=new Map();for(const [key,x,y,invertElevationM]of defs){const n={id:id+':hydraulic:'+index+':'+key,x,y,level:index,invertElevationM,medium:profile.medium};flow.nodes.push(n);local.set(key,n.id);}
   for(const [a,b]of [['head','junction-a'],['junction-a','junction-b'],['junction-b','outfall'],['branch-a','junction-a'],['branch-b','junction-b']])flow.links.push({id:id+':hydraulic-link:'+flow.links.length,from:local.get(a),to:local.get(b),kind:'gravity',operational:false});
   flowByLevel.push({level:index,outfall:local.get('outfall'),channel:channel.id,outfallStructure:out.id});
  }
  if(type==='EXT-MONDE-T038')flow.links.push({id:id+':hydraulic-link:'+flow.links.length,from:flowByLevel[0].outfall,to:flowByLevel[1].outfall,kind:'gravity-drop',operational:false});
  if(type==='EXT-MONDE-T040'){
   const index=1,discharge=water('pump-discharge','closed-pump-discharge',waterX,H-28,profile.channelWidthM,12,index),last=flowByLevel[0];
   const outlet={id:id+':hydraulic:lifted-outfall',x:discharge.x+discharge.w/2,y:H-20,level:index,invertElevationM:-3.8,medium:profile.medium};flow.nodes.push(outlet);
   flow.links.push({id:id+':hydraulic-link:'+flow.links.length,from:last.outfall,to:outlet.id,kind:'pump-riser',operational:false});
   flow.outfalls.push({node:outlet.id,connectedToWorld:false});
  }else flow.outfalls.push({node:flowByLevel.at(-1).outfall,connectedToWorld:false});
  plan.maxHeightM=RULES.floorToFloorM;
  plan.designAssumptions.push('Le graphe hydraulique est une intention de composition dirigée vers un exutoire ; il ne simule ni débit, traitement, pompage, potabilité ni sécurité d’accès.',
   'Les canaux sont des volumes fermés au niveau déclaré. Les visites se font dans les galeries et banquettes sèches ; les deux regards de retour sont physiquement reliés.');
 }
 return freeze(plan);
}

function audit(plan){
 const base=Reference.audit(plan),errors=[...base.errors],fail=code=>errors.push(code);
 try{
  const profile=PROFILES[plan.type];
  if(!profile||!Number.isInteger(plan.number)||plan.number<1||plan.number>RULES.variants||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0'))fail('urban-identity');
  if(plan.sourceIds.length||plan.heightOrigin!=='author-design'||!plan.designAssumptions.some(s=>s.includes('choix auteur')))fail('urban-provenance');
  if(plan.configuration.family!==profile.family||!Array.isArray(plan.levels)||!plan.levels.length||!Array.isArray(plan.surfaceAreas)||!Array.isArray(plan.network.transitions))throw Error('schema');
  const levels=new Map(plan.levels.map(l=>[l.index,l])),nodes=new Map(plan.network.nodes.map(n=>[n.id,n]));
  if(levels.size!==plan.levels.length||plan.levels.some((l,i)=>l.index!==i)||levels.get(0)?.elevationM!==0)fail('urban-level-index');
  for(const n of plan.network.nodes)if(!levels.has(n.level)||n.z!==levels.get(n.level).elevationM)fail('urban-node-elevation');
  for(const t of plan.network.transitions){
   const a=nodes.get(t.from),b=nodes.get(t.to);
   if(!a||!b||a.level===b.level||a.x!==b.x||a.y!==b.y||Math.abs(a.z-b.z)>4.8||Math.abs(a.z-b.z)<1||t.widthM!==RULES.stairWidthM||!['stairs','ladder'].includes(t.kind)||!a.roomId||!b.roomId)fail('urban-vertical-transition');
  }
  for(const n of plan.network.nodes.filter(n=>n.roomId)){
   const b=plan.buildings.find(b=>b.rooms.some(r=>r.id===n.roomId)),r=b?.rooms.find(r=>r.id===n.roomId);
   if(!r||r.kind!=='circulation'||r.level!==n.level||!contains({x:b.x+r.x,y:b.y+r.y,w:r.w,h:r.h},{x:n.x,y:n.y,w:0,h:0}))fail('urban-landing-room');
  }
  if(Object.keys(plan.operations).length!==3||Object.values(plan.operations).some(n=>n!==0))fail('false-urban-stock-or-service');
  for(const a of [...plan.structures,...plan.surfaceAreas,...plan.outdoorAreas])if(a.lootAssigned!==false||a.utilityConnected!==false||Object.hasOwn(a,'amount')||Object.hasOwn(a,'resource'))fail('false-urban-stock-or-service');
  if(profile.family==='housing'){
   const h=plan.housing;if(!h||h.form!==profile.form||h.floorToFloorM!==RULES.floorToFloorM||h.campaignOccupantsCreated!==0||!Array.isArray(h.blocks)||!Array.isArray(h.units)||!Array.isArray(h.stairCores))throw Error('housing');
   const unitIds=new Set();for(const unit of h.units){
    const b=plan.buildings.find(b=>b.id===unit.id),block=h.blocks.find(b=>b.id===unit.block);
    if(unitIds.has(unit.id)||!b||b.role!=='dwelling'||!block?.unitIds.includes(unit.id)||unit.level>=block.floors||b.levels.length!==1||b.levels[0]!==unit.level||unit.occupantsAssigned!==false||unit.areaM2!==b.w*b.h||unit.areaBasis!=='gross-author-footprint')fail('urban-dwelling-identity');
    unitIds.add(unit.id);
    if(b?.rooms[0].id!==unit.privateHall||b?.rooms.length!==7||unit.rooms.length!==6||b.rooms.slice(1).some(r=>!unit.rooms.includes(r.id)))fail('urban-private-hall');
    for(const required of ['séjour','cuisine','chambre parentale','chambre enfant','sanitaires','douches'])if(!b?.rooms.some(r=>r.name.includes(required)))fail('urban-incomplete-dwelling');
    if(b?.portals.some(d=>d.from!==unit.privateHall))fail('urban-room-opens-to-common-hall');
    if(b&&!plan.surfaceAreas.some(s=>s.kind==='common-corridor'&&s.level===unit.level&&s.x<=b.x&&s.x+s.w>=b.x+b.w&&
     (Math.abs(s.y-b.y-b.h)<1e-8||Math.abs(s.y+s.h-b.y)<1e-8)))fail('urban-missing-common-hall');
   }
   if(unitIds.size!==plan.buildings.filter(b=>b.role==='dwelling').length)fail('urban-unregistered-dwelling');
   for(const block of h.blocks){
    const shaft=h.stairCores.find(s=>s.id===block.stairCore);if(!shaft||block.unitIds.some(id=>!unitIds.has(id))||new Set(block.unitIds).size!==block.unitIds.length)fail('urban-block');
    const expected=[h.basementLevel,...Array.from({length:block.floors},(_,i)=>i)].sort((a,b)=>a-b);
    if(JSON.stringify([...block.levels].sort((a,b)=>a-b))!==JSON.stringify(expected)||JSON.stringify(shaft.landings.map(l=>l.level).sort((a,b)=>a-b))!==JSON.stringify(expected))fail('urban-incomplete-stair-core');
    if(block.heightM!==block.floors*RULES.floorToFloorM||block.heightM+block.roofParapetM>plan.maxHeightM+1e-8)fail('urban-block-height');
   }
   if(plan.network.transitions.some(t=>t.kind!=='stairs')||!h.units.length)fail('urban-housing-transition');
  }else{
   const s=plan.sewer,f=s?.hydraulicFlow;if(!s||s.medium!==profile.medium||s.depthM!==profile.depths*3||s.depthDatum!=='deepest-dry-gallery-floor'||s.deepestLevel!==profile.depths||s.accessShafts.length!==2||!f||f.scope!=='author-hydraulic-diagram-not-simulated'||f.operational!==false||f.potable!==false)throw Error('sewer');
   if(plan.network.transitions.some(t=>t.kind!=='ladder')||s.dryGalleries.length!==profile.depths)fail('urban-sewer-access');
   const staff=plan.buildings.filter(b=>b.role==='sewer-surface-services');
   if(staff.length!==1||staff[0].levels.length!==1||staff[0].levels[0]!==0||
    ['sanitaires du personnel','douches du personnel','vestiaires du personnel','cuisine du personnel'].some(name=>!staff[0].rooms.some(r=>r.name===name)))fail('urban-incomplete-staff-welfare');
   if(s.accessShafts.some(shaft=>shaft.landings.length!==profile.depths+1)||s.dryGalleries.some(g=>!g.waterSeparated||!plan.buildings.some(b=>b.id===g.building&&b.levels.includes(g.level))))fail('urban-sewer-gallery');
   for(const wid of s.waterStructures){const water=plan.structures.find(w=>w.id===wid);if(!water||water.level===0||!levels.has(water.level)||water.water!==true||water.walkable!==false||water.interiorStatus!=='closed-hydraulic-volume')fail('urban-open-water');}
   if(s.waterStructures.length!==plan.structures.length||new Set(s.waterStructures).size!==s.waterStructures.length)fail('urban-water-inventory');
   const hydraulic=new Map(f.nodes.map(n=>[n.id,n])),links=new Map(f.nodes.map(n=>[n.id,[]])),outfalls=new Set(f.outfalls.map(o=>o.node));
   if(hydraulic.size!==f.nodes.length||outfalls.size!==1||f.outfalls.some(o=>o.connectedToWorld!==false||!hydraulic.has(o.node)))fail('urban-hydraulic-outfall');
   for(const n of f.nodes)if(!finite(n.x,n.y,n.invertElevationM)||!levels.has(n.level)||n.medium!==profile.medium||!plan.structures.some(w=>w.level===n.level&&contains(w,{x:n.x,y:n.y,w:0,h:0})))fail('urban-hydraulic-node');
   for(const e of f.links){
    const a=hydraulic.get(e.from),b=hydraulic.get(e.to);if(!a||!b||e.from===e.to||e.operational!==false||!['gravity','gravity-drop','pump-riser'].includes(e.kind)){fail('urban-hydraulic-link');continue;}
    links.get(a.id).push(b.id);
    if(e.kind==='gravity'&&(a.level!==b.level||a.invertElevationM<b.invertElevationM))fail('urban-uphill-gravity');
    if(e.kind==='gravity-drop'&&(a.x!==b.x||a.y!==b.y||a.invertElevationM<=b.invertElevationM))fail('urban-gravity-drop');
    if(e.kind==='pump-riser'&&(plan.type!=='EXT-MONDE-T040'||a.x!==b.x||a.y!==b.y||a.invertElevationM>=b.invertElevationM))fail('urban-pump-riser');
   }
   for(const n of f.nodes){const seen=new Set(),active=new Set();let outlet=false,cycle=false;function visit(id){if(active.has(id)){cycle=true;return;}if(seen.has(id))return;seen.add(id);active.add(id);if(outfalls.has(id))outlet=true;for(const next of links.get(id)||[])visit(next);active.delete(id);}visit(n.id);if(!outlet||cycle)fail('urban-hydraulic-dead-end-or-cycle');}
  }
 }catch{fail('urban-schema');}
 return {...base,ok:errors.length===0,errors:[...new Set(errors)],dwellingUnits:plan?.housing?.units?.length||0,
  undergroundLevels:plan?.sewer?.deepestLevel||0};
}
function auditAll(){
 const records=[];for(const type of TYPES)for(let number=1;number<=RULES.variants;number++){
  const p=build(type,number),a=audit(p);if(!a.ok)throw Error(p.id+': '+a.errors.join(', '));
  records.push({id:p.id,type,widthM:p.bounds.w,lengthM:p.bounds.h,heightM:p.maxHeightM,depthM:p.depthM||0,...a});
 }
 return {schemaVersion:1,scope:'urban-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
// END AUTHOR CORE

if(require.main===module)console.log(JSON.stringify({types:TYPES,plans:TYPES.length*RULES.variants}));
module.exports={RULES,PROFILES,TYPES,build,audit,auditAll};
