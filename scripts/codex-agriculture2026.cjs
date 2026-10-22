'use strict';
/* Original authoring geometry. No campaign registration, RNG, inventory or save. */
const fs = require('node:fs');
const path = require('node:path');
const Reference = require('./codex-world-foundations2026.cjs');

// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1, variants:50, wallM:.2, corridorM:1.8,
  doorM:1.2, serviceWidthM:4.5, pedestrianWidthM:1.2, fenceM:.15,
  plotWidthM:224, plotLengthM:260, sizeWidthStepM:24, sizeLengthStepM:20,
  westSpineM:9, columnMarginM:22, fieldGapM:10, gardenGateM:2.4,
  fieldGateM:5.4, propertyGateM:6.4});
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const PROFILES = freeze({
  'EXT-MONDE-T021': {name:'Ferme laitière', domain:'livestock', field:'pasture', fieldName:'Prairie bovine',
    production:{kind:'cattle-barn', name:'Étable', w:36,h:30,height:5.4, rooms:['stabulation A','stabulation B','aire de vêlage','infirmerie vétérinaire','réserve fourrage','local alimentation']},
    processing:{kind:'milking-house', name:'Laiterie', w:26,h:22,height:3.8, rooms:['salle de traite','local du lait','local nettoyage','réserve hygiène']},
    storage:['réserve fourrage sec','stockage alimentation','réserve pièces','local semences'],
    equipment:[['feed-silo',4.5,4.5,8.2],['water-tank',3.2,3.2,3.2],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T022': {name:'Élevage ovin', domain:'livestock', field:'sheep-pasture', fieldName:'Prairie ovine',
    production:{kind:'sheepfold', name:'Bergerie', w:34,h:28,height:4.8, rooms:['bergerie A','bergerie B','aire agnelage','infirmerie vétérinaire','réserve fourrage','local alimentation']},
    processing:{kind:'shearing-house', name:'Tonte et laine', w:24,h:20,height:3.6, rooms:['atelier tonte','stockage laine','local nettoyage','réserve outillage']},
    storage:['réserve fourrage','stockage laine sèche','réserve pièces','local semences'],
    equipment:[['feed-silo',4,4,7],['water-tank',3,3,2.8],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T023': {name:'Ferme avicole', domain:'livestock', field:'poultry-run', fieldName:'Parcours extérieur avicole',
    production:{kind:'poultry-house', name:'Poulailler', w:36,h:28,height:4.2, rooms:['poulailler ponte A','poulailler ponte B','poussinière','sas sanitaire','réserve alimentaire','local nettoyage']},
    processing:{kind:'egg-packing', name:'Collecte et emballage des œufs', w:24,h:20,height:3.5, rooms:['local œufs','conditionnement œufs','local nettoyage','réserve emballages']},
    storage:['réserve alimentaire','stockage litière','réserve pièces','réserve emballages'],
    equipment:[['feed-silo',3.8,3.8,6.8],['water-tank',2.8,2.8,2.6],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T024': {name:'Centre équestre rural', domain:'livestock', field:'horse-paddock', fieldName:'Paddock équestre',
    production:{kind:'horse-stable', name:'Écuries', w:36,h:32,height:5.2, rooms:['boxes équestres A','boxes équestres B','boxes de repos','infirmerie vétérinaire','sellerie','réserve fourrage']},
    processing:{kind:'riding-support', name:'Préparation des chevaux', w:26,h:22,height:3.8, rooms:['atelier préparation équestre','sellerie','local nettoyage','réserve équipement']},
    storage:['réserve fourrage','stockage litière','réserve pièces','réserve équipement'],
    equipment:[['hay-shelter',5,4,3.8],['water-tank',3.2,3.2,3.2],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T025': {name:'Exploitation céréalière', domain:'crops', field:'cereal-strip', fieldName:'Parcelle céréalière',
    production:{kind:'grain-hall', name:'Hangar de récolte', w:38,h:28,height:5.8, rooms:['stockage grains','local semences','atelier semoir','réserve récolte']},
    processing:{kind:'grain-sorting', name:'Tri des grains', w:26,h:22,height:4.2, rooms:['tri et calibrage grains','conditionnement grains','local nettoyage','bureau exploitation']},
    storage:['local semences','réserve récolte sèche','réserve pièces','réserve emballages'],
    equipment:[['grain-silo',5.5,5.5,10.2],['water-tank',3.2,3.2,3.2],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T026': {name:'Domaine viticole', domain:'crops', field:'vine-row', fieldName:'Parcelle de vignes',
    production:{kind:'winery', name:'Chai', w:34,h:28,height:5.2, rooms:['chais de vieillissement','cuverie','pressoir','réserve fûts']},
    processing:{kind:'wine-packing', name:'Mise en bouteille', w:26,h:22,height:4.2, rooms:['conditionnement bouteilles','stockage bouteilles','local nettoyage','bureau exploitation']},
    storage:['réserve fûts','stockage bouteilles','réserve pièces','réserve emballages'],
    equipment:[['water-tank',4,4,3.5],['rainwater-tank',3.2,3.2,3.2],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T027': {name:'Ferme maraîchère', domain:'crops', field:'vegetable-bed', fieldName:'Planche maraîchère',
    production:{kind:'plant-nursery', name:'Serre et semis', w:32,h:26,height:4.4, rooms:['serre semis','serre culture A','serre culture B','atelier préparation semis','local pompes','réserve semences']},
    processing:{kind:'vegetable-packing', name:'Préparation maraîchère', w:26,h:22,height:3.8, rooms:['tri et calibrage légumes','conditionnement légumes','local nettoyage','stockage réfrigéré légumes']},
    storage:['réserve semences','stockage cagettes','réserve pièces','réserve emballages'],
    equipment:[['irrigation-tank',4.5,4.5,3.8],['rainwater-tank',3.2,3.2,3.2],['electrical-cabinet',1.8,.8,1.9]]},
  'EXT-MONDE-T028': {name:'Verger avec conditionnement', domain:'crops', field:'orchard', fieldName:'Carré de verger',
    production:{kind:'fruit-sorting', name:'Station fruitière', w:34,h:28,height:4.8, rooms:['tri et calibrage fruits','conditionnement fruits','stockage réfrigéré fruits','réserve cagettes']},
    processing:{kind:'fruit-support', name:'Préparation des récoltes', w:26,h:22,height:3.8, rooms:['atelier préparation verger','local nettoyage','local pompes','bureau exploitation']},
    storage:['stockage cagettes','réserve récolte sèche','réserve pièces','réserve emballages'],
    equipment:[['irrigation-tank',4.5,4.5,3.8],['rainwater-tank',3.2,3.2,3.2],['electrical-cabinet',1.8,.8,1.9]]}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS = freeze([
  [0,1,2,3,4,5], [3,1,2,0,5,4], [0,2,1,4,3,5], [4,2,3,0,1,5], [0,3,2,5,1,4],
  [5,1,4,0,2,3], [0,4,5,2,3,1], [2,3,5,0,4,1], [0,5,1,3,2,4], [1,5,2,0,3,4]
]);
const rect = o => o && [o.x,o.y,o.w,o.h].every(Number.isFinite) && o.w>0 && o.h>0;
const overlaps = (a,b) => a.x<b.x+b.w-1e-8 && a.x+a.w>b.x+1e-8 && a.y<b.y+b.h-1e-8 && a.y+a.h>b.y+1e-8;
const contains = (a,b) => b.x>=a.x-1e-8 && b.y>=a.y-1e-8 && b.x+b.w<=a.x+a.w+1e-8 && b.y+b.h<=a.y+a.h+1e-8;

function build(type, number) {
  if (!TYPES.includes(type) || !Number.isInteger(number) || number<1 || number>RULES.variants) throw Error('Typologie agricole ou variante invalide.');
  const profile=PROFILES[type], tier=Math.floor((number-1)/10), arrangement=(number-1)%10;
  const id=type+'-V'+String(number).padStart(2,'0'), W=RULES.plotWidthM+tier*RULES.sizeWidthStepM;
  const H=RULES.plotLengthM+tier*RULES.sizeLengthStepM;
  const plan={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'agriculture',name:profile.name,sourceIds:[],heightOrigin:'author-design',
    designAssumptions:[
      'Emprises, hauteurs, portes, clôtures et objets sont des choix auteur originaux ; aucun relevé réel ni dimension fabricant revendiqué.',
      'Les six bâtiments et leurs pièces sont de plain-pied. Les parcelles sont des surfaces de composition, sans récolte ni repousse.',
      'Le réseau représente des accès internes ; gabarit des engins, virages, terrain, espèces et raccordements du seed restent à qualifier.'
    ],
    configuration:{sizeTier:tier+1,arrangement:arrangement+1,fieldCount:2+arrangement%3,production:profile.domain,
      rowEntries:[arrangement>=5?'south':'north','north'],plotBoundary:'wire-fence-open-gate'},
    bounds:{x:0,y:0,w:W,h:H},maxHeightM:Math.max(6.5+tier*.2,...profile.equipment.map(e=>e[3])),
    buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],accessGates:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    operations:{animalsSpawned:0,lootContainersCreated:0,connectedServices:0,harvestablePlots:0},
    unresolved:['implantation dans le terrain réel et raccords au seed','navigation des engins agricoles',
      'animaux et rencontres contextualisés','butin fini et transport','eau et énergie payées',
      'états de culture et récoltes','art définitif','sauvegarde et qualification de campagne']};
  const nodes=new Map(), lanes=new Map();
  function node(key,x,y) {
    if(nodes.has(key))throw Error('Nœud agricole répété.');
    const n={id:id+':'+key,x,y,z:0};nodes.set(key,n);plan.network.nodes.push(n);return n;
  }
  function edge(a,b,mode='service') {
    if(!nodes.has(a)||!nodes.has(b))throw Error('Extrémité agricole absente.');
    plan.network.edges.push({id:id+':edge:'+plan.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,
      widthM:mode==='pedestrian'?RULES.pedestrianWidthM:RULES.serviceWidthM,mode,level:0});
  }
  function solid(key,kind,x,y,w,h,heightM,name=kind) {
    const s={id:id+':structure:'+key,kind,name,x,y,w,h,maxHeightM:heightM,heightOrigin:'author-design',
      footprintOrigin:'author-design',lootAssigned:false,utilityConnected:false};
    plan.structures.push(s);return s;
  }
  function area(key,kind,name,x,y,w,h) {
    const a={id:id+':outdoor:'+key,kind,name,x,y,w,h,level:0,walkable:true,origin:'author-design'};
    plan.outdoorAreas.push(a);return a;
  }
  function reserved(key,kind,name,x,y,w,h,areaId) {
    const a={id:id+':reserve:'+key,kind,name,x,y,w,h,level:0,walkable:true,origin:'author-design',
      lootAssigned:false,utilityConnected:false,areaId};plan.reservedAreas.push(a);return a;
  }
  function fence(key,box,face,at,width,kind,heightM) {
    const t=RULES.fenceM, ids=[];
    const piece=(suffix,x,y,w,h)=>{if(w>0&&h>0)ids.push(solid(key+':'+suffix,'fence-'+kind,x,y,w,h,heightM,'Clôture '+kind).id);};
    for(const side of ['north','south']) {
      const y=side==='north'?box.y:box.y+box.h-t;
      if(side===face){piece(side+'-left',box.x,y,at-width/2-box.x,t);piece(side+'-right',at+width/2,y,box.x+box.w-at-width/2,t);}
      else piece(side,box.x,y,box.w,t);
    }
    // The sides stop short of their end segments, avoiding overlapping solids.
    piece('west',box.x,box.y+t,t,box.h-2*t);
    piece('east',box.x+box.w-t,box.y+t,t,box.h-2*t);
    return ids;
  }
  function laneNode(key,x,y) {
    node(key,x,y);if(!lanes.has(y))lanes.set(y,[]);lanes.get(y).push(key);return key;
  }
  function gate(key,box,face,width,kind,fromLaneY,mode,internalDistance,areaId=null) {
    const x=box.x+box.w/2,y=face==='north'?box.y:box.y+box.h, sign=face==='north'?1:-1;
    const fences=fence(key,box,face,x,width,kind,kind==='wood'?1.4:1.7);
    const outside=laneNode(key+':approach',x,fromLaneY),threshold=key+':threshold',inside=key+':inside';
    node(threshold,x,y);node(inside,x,y+sign*internalDistance);edge(outside,threshold,mode);edge(threshold,inside,mode);
    const g={id:id+':gate:'+key,areaId,kind,face,x,y,widthM:width,level:0,box:{...box},
      approachNode:nodes.get(outside).id,node:nodes.get(threshold).id,insideNode:nodes.get(inside).id,
      fenceSegments:fences,open:true,connectedToWorld:false};plan.accessGates.push(g);return g;
  }
  const row0Y=arrangement>=5?82+tier*3:14, row1Y=96+tier*4, fieldY=166+tier*8;
  const spineYs=[...new Set([14,row0Y,row1Y,fieldY])].sort((a,b)=>a-b);
  node('gate',RULES.westSpineM,0);node('property-threshold',RULES.westSpineM,2);
  edge('gate','property-threshold');let previous='property-threshold';
  for(const y of spineYs){const key='spine:'+y;laneNode(key,RULES.westSpineM,y);edge(previous,key);previous=key;}
  plan.network.externalPorts.push({node:nodes.get('gate').id,requires:'farm-service-road',connectedToWorld:false});
  const boundary={x:2,y:2,w:W-4,h:H-4};
  const boundarySegments=fence('boundary',boundary,'north',RULES.westSpineM,RULES.propertyGateM,'wire',1.7);
  plan.accessGates.push({id:id+':gate:property',areaId:null,kind:'property',face:'north',x:RULES.westSpineM,y:2,
    widthM:RULES.propertyGateM,level:0,box:boundary,approachNode:nodes.get('gate').id,node:nodes.get('property-threshold').id,
    insideNode:nodes.get('spine:14').id,fenceSegments:boundarySegments,open:true,connectedToWorld:false});
  const facilities=[
    {role:'housing',kind:'farmhouse',name:'Habitation',w:16,h:18,height:3.4,rooms:['cuisine familiale','salon','chambre parentale','chambre enfants','sanitaires','buanderie']},
    {...profile.production,role:'production'}, {...profile.processing,role:'processing'},
    {role:'workshop',kind:'farm-workshop',name:'Atelier et énergie',w:22,h:18,height:3.8,rooms:['atelier matériel','réserve pièces détachées','local pompes','tableau de distribution']},
    {role:'welfare',kind:'farm-welfare',name:'Équipe et accueil',w:20,h:18,height:3.4,rooms:['vestiaires','douches','sanitaires','réfectoire']},
    {role:'storage',kind:'farm-stores',name:'Réserves agricoles',w:26,h:20,height:4.4,rooms:profile.storage}
  ];
  const columnW=(W-2*RULES.columnMarginM)/3;
  for(let position=0;position<6;position++) {
    const definition=facilities[ARRANGEMENTS[arrangement][position]],row=Math.floor(position/3),column=position%3;
    const face=row===0&&arrangement>=5?'south':'north',laneY=row===0?row0Y:row1Y;
    const w=definition.w+tier*(definition.role==='housing'?1.5:2),h=definition.h+tier*1.2;
    const left=RULES.columnMarginM+column*columnW;
    const x=definition.role==='housing'?left+2:left+(columnW-w)/2;
    const setback=12+(arrangement%5)*.8;
    const y=face==='north'?laneY+setback:laneY-setback-h, heightM=definition.height+tier*.2;
    const b={id:id+':building:'+definition.role,kind:definition.kind,name:definition.name,role:definition.role,
      x,y,w,h,rotationRad:0,entrySide:face,heightM,heightOrigin:'author-design',footprintOrigin:'author-design',
      levels:[0],rooms:[],portals:[],entry:{x:w/2,y:face==='north'?0:h,level:0,widthM:RULES.doorM}};
    const cw=RULES.corridorM,t=RULES.wallM,rows=definition.rooms.length/2,roomW=(w-cw)/2-2*t;
    const corridor={id:b.id+':corridor',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,
      level:0,clearHeightM:heightM-.4};b.rooms.push(corridor);
    for(let n=0;n<definition.rooms.length;n++) {
      const east=n%2===1,band=Math.floor(n/2),room={id:b.id+':room:'+n,name:definition.rooms[n],
        x:east?(w+cw)/2+t:t,y:band*h/rows+t,w:roomW,h:h/rows-2*t,level:0,clearHeightM:heightM-.4};
      b.rooms.push(room);b.portals.push({id:room.id+':door',from:corridor.id,to:room.id,
        x:east?corridor.x+cw:corridor.x,y:room.y+room.h/2,widthM:RULES.doorM,wallGapM:t,axis:'y'});
    }
    plan.buildings.push(b);
    const junction=laneNode('building:'+definition.role+':approach',x+w/2,laneY),entry='building:'+definition.role+':entry';
    node(entry,x+w/2,y+b.entry.y);edge(junction,entry,'pedestrian');
    if(definition.role==='housing') {
      const garden=area('garden','kitchen-garden','Jardin de l’habitation',x+w+4,y,16+tier,h);
      gate('garden',garden,face,RULES.gardenGateM,'wood',laneY,'pedestrian',garden.h/2,garden.id);
      const bedW=(garden.w-7)/2;
      reserved('garden-west','vegetable-bed','Potager domestique ouest',garden.x+2,garden.y+3,bedW,garden.h-6,garden.id);
      reserved('garden-east','vegetable-bed','Potager domestique est',garden.x+garden.w/2+1.5,garden.y+3,bedW,garden.h-6,garden.id);
      solid('garden-compost','compost-bin',garden.x+2,garden.y+garden.h-2.5,1.4,1,1,'Composteur');
    }
  }
  // A separate northern technical apron keeps closed equipment out of entrances.
  let right=W-14;
  for(let i=0;i<profile.equipment.length;i++) {
    const[kind,w,h,height]=profile.equipment[i];right-=w;
    solid('utility:'+i,kind,right,5,w,h,height,kind);
    const service=laneNode('utility:'+i+':approach',right+w/2,14),stop='utility:'+i+':stop';
    node(stop,right+w/2,5+h+1);edge(service,stop,'pedestrian');right-=5;
  }
  const count=plan.configuration.fieldCount, fieldW=(W-48-(count-1)*RULES.fieldGapM)/count;
  for(let i=0;i<count;i++) {
    const x=24+i*(fieldW+RULES.fieldGapM),y=fieldY+14,h=H-y-14;
    const field=area('field:'+i,profile.field,profile.fieldName+' '+(i+1),x,y,fieldW,h);
    gate('field:'+i,field,'north',RULES.fieldGateM,profile.domain==='livestock'?'wood':'wire',fieldY,'service',h/2,field.id);
    const half=(fieldW-12)/2,innerH=h-12;
    if(profile.field==='orchard') {
      const rows=3+tier,columns=2;
      for(const side of [0,1])for(let row=0;row<rows;row++)for(let column=0;column<columns;column++) {
        const localX=3+(half-2)*(column+.5)/columns+(side?fieldW/2:0);
        const localY=6+innerH*(row+.5)/rows;
        solid('orchard:'+i+':'+side+':'+row+':'+column,'orchard-tree-trunk',x+localX,y+localY,.55,.55,4.6+tier*.15,'Arbre fruitier');
      }
    } else {
      const strips=profile.domain==='livestock'?1:2+tier+(arrangement%2),gap=.7,stripW=(half-gap*(strips-1))/strips;
      for(const side of [0,1])for(let strip=0;strip<strips;strip++) {
        const rx=x+3+(side?fieldW/2:0)+strip*(stripW+gap);
        reserved('field:'+i+':'+side+':'+strip,profile.field,profile.fieldName,rx,y+6,stripW,innerH,field.id);
      }
    }
    if(profile.domain==='livestock') {
      solid('field:'+i+':water','water-trough',x+3,y+2,2.4,.9,.8,'Abreuvoir extérieur non raccordé');
      solid('field:'+i+':feeder','feed-trough',x+fieldW-6,y+2,2.4,.9,1,'Mangeoire extérieure vide');
    }
  }
  // Every junction is linked in coordinate order: shifting a building does not
  // produce a diagonal spur crossing its neighbour or the protected crop beds.
  for(const keys of lanes.values()) {
    keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);
    for(let i=1;i<keys.length;i++) {
      if(Math.abs(nodes.get(keys[i]).x-nodes.get(keys[i-1]).x)<1e-8) throw Error('Jonctions agricoles confondues.');
      edge(keys[i-1],keys[i]);
    }
  }
  return freeze(plan);
}

function audit(plan) {
  let checked;
  try { checked=Reference.audit(plan); } catch { return {ok:false,errors:['schema']}; }
  const errors=[...checked.errors], fail=code=>errors.push(code);
  try {
    if(!plan || !TYPES.includes(plan.type) || !Number.isInteger(plan.number) || plan.number<1 || plan.number>RULES.variants ||
      plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0') || plan.authorFamily!=='agriculture')fail('agriculture-identity');
    if(!Array.isArray(plan?.outdoorAreas)||!Array.isArray(plan?.accessGates)||!Array.isArray(plan?.sourceIds)||plan.sourceIds.length ||
      plan.heightOrigin!=='author-design'||!Array.isArray(plan?.designAssumptions)||plan.designAssumptions.length<3)throw Error('agriculture-schema');
    const ids=new Set(), known=[...plan.buildings,...plan.structures,...plan.reservedAreas,...plan.network.nodes,...plan.network.edges];
    for(const value of known)ids.add(value.id);
    const nodes=new Map(plan.network.nodes.map(n=>[n.id,n])),structures=new Map(plan.structures.map(s=>[s.id,s]));
    const expectedRoles=['housing','production','processing','workshop','welfare','storage'];
    if(plan.buildings.length!==expectedRoles.length||expectedRoles.some(role=>plan.buildings.filter(b=>b.role===role).length!==1))fail('missing-farm-facility');
    for(const a of plan.outdoorAreas) {
      if(!rect(a)||!contains(plan.bounds,a)||typeof a.id!=='string'||ids.has(a.id)||!a.name||a.level!==0||a.walkable!==true||a.origin!=='author-design')fail('outdoor-area');
      ids.add(a.id);if(plan.buildings.some(b=>overlaps(a,b)))fail('outdoor-building-overlap');
    }
    for(let i=0;i<plan.outdoorAreas.length;i++)for(let j=i+1;j<plan.outdoorAreas.length;j++)
      if(overlaps(plan.outdoorAreas[i],plan.outdoorAreas[j]))fail('overlapping-farm-plots');
    for(const patch of plan.reservedAreas) {
      const parent=plan.outdoorAreas.find(a=>a.id===patch.areaId);
      if(!parent||!contains(parent,patch))fail('crop-outside-parent-plot');
    }
    if(plan.configuration?.fieldCount!==2+(plan.number-1)%10%3 || plan.outdoorAreas.filter(a=>a.kind===PROFILES[plan.type]?.field).length!==plan.configuration.fieldCount)fail('field-count');
    if(plan.accessGates.length!==plan.configuration.fieldCount+2)fail('gate-count');
    for(const g of plan.accessGates) {
      if(!g?.id||ids.has(g.id))fail('gate-id');ids.add(g.id);
      const n=nodes.get(g.node),a=nodes.get(g.approachNode),b=nodes.get(g.insideNode);
      if(!rect(g.box)||!contains(plan.bounds,g.box)||![g.x,g.y,g.widthM].every(Number.isFinite)||g.widthM<.9||g.level!==0||
        !['north','south'].includes(g.face)||!n||!a||!b||g.open!==true||g.connectedToWorld!==false||
        !Array.isArray(g.fenceSegments)||g.fenceSegments.length!==5||g.fenceSegments.some(id=>!structures.has(id))) {fail('invalid-fence-gate');continue;}
      if(Math.abs(g.x-n.x)>1e-8||Math.abs(g.y-n.y)>1e-8||Math.abs(g.y-(g.face==='north'?g.box.y:g.box.y+g.box.h))>1e-8||
        g.x-g.widthM/2<g.box.x||g.x+g.widthM/2>g.box.x+g.box.w)fail('gate-off-boundary');
      if(g.areaId&&!plan.outdoorAreas.some(o=>o.id===g.areaId&&['x','y','w','h'].every(k=>Math.abs(o[k]-g.box[k])<1e-8)))fail('orphan-fence-gate');
      const sign=g.face==='north'?1:-1;
      if(a.x!==g.x||b.x!==g.x||(a.y-g.y)*sign>=0||(b.y-g.y)*sign<=0)fail('gate-wrong-side');
      if(!plan.network.edges.some(e=>e.from===a.id&&e.to===n.id)||!plan.network.edges.some(e=>e.from===n.id&&e.to===b.id))fail('gate-without-path');
      const clearance={x:g.x-g.widthM/2+.01,y:g.y-.3,w:g.widthM-.02,h:.6};
      if(plan.structures.some(s=>overlaps(clearance,s)))fail('gate-obstructed');
    }
    for(const value of [...plan.structures,...plan.reservedAreas]) {
      if(value.lootAssigned!==false||value.utilityConnected!==false||Object.hasOwn(value,'amount')||Object.hasOwn(value,'resource'))fail('false-agricultural-stock-or-service');
    }
    for(const s of plan.structures)if(!Number.isFinite(s.maxHeightM)||s.maxHeightM<=0||s.maxHeightM>plan.maxHeightM||s.heightOrigin!=='author-design'||s.footprintOrigin!=='author-design')fail('agricultural-height');
    if(!plan.operations||Object.keys(plan.operations).sort().join(',')!=='animalsSpawned,connectedServices,harvestablePlots,lootContainersCreated'||Object.values(plan.operations).some(v=>v!==0))fail('false-agricultural-operation');
  } catch {fail('agriculture-schema');}
  const buildings=Array.isArray(plan?.buildings)?plan.buildings:[];
  return {ok:errors.length===0,errors:[...new Set(errors)],buildings:buildings.length,
    rooms:buildings.reduce((n,b)=>n+(Array.isArray(b?.rooms)?b.rooms.length:0),0),
    structures:Array.isArray(plan?.structures)?plan.structures.length:0,
    fields:plan?.configuration?.fieldCount||0,gates:Array.isArray(plan?.accessGates)?plan.accessGates.length:0};
}
function auditAll() {
  const records=[];
  for(const type of TYPES)for(let number=1;number<=RULES.variants;number++) {
    const plan=build(type,number),checked=audit(plan);
    if(!checked.ok)throw Error(plan.id+': '+checked.errors.join(', '));
    records.push({id:plan.id,type,widthM:plan.bounds.w,lengthM:plan.bounds.h,heightM:plan.maxHeightM,heightOrigin:plan.heightOrigin,...checked});
  }
  return {schemaVersion:1,scope:'metric-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
// END AUTHOR CORE

if(require.main===module) {
  const out=path.resolve(process.argv[2]||'artifacts/qa/codex-agriculture2026');
  fs.mkdirSync(out,{recursive:true});const report=auditAll();
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({typologies:report.typologies,variants:report.variants,playable:0,output:out}));
}
module.exports={RULES,TYPES,PROFILES,build,audit,auditAll};
