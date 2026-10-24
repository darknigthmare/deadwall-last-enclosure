'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,wallM:.2,corridorM:1.8,doorM:1.2,
  pathM:2,serviceRoadM:4.5,cellClearanceM:38,sizeStepM:4,visitorSpineM:88,firstLaneM:20});
const freeze = value => {
  if(value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
};
const asset = (role,kind,name,w,h,height,water=false,open=false) => ({role,kind,name,w,h,height,water,open});
const PROFILES = freeze({
  'EXT-MONDE-T049': {name:'Parc familial',intent:'Jeux de proximité et petites attractions autour de promenades continues',
    staffRooms:['atelier des manèges','local outillage','réserve pièces détachées','bureau maintenance'],
    activityRooms:['club-house familles','rangement sportif','salle de soins','réserve médicale'],
    assets:[asset('carousel','closed-family-carousel','Carrousel familial immobilisé',20,20,6),
      asset('mini-railway','closed-miniature-railway','Boucle du petit train fermée',64,42,2.5),
      asset('playground','closed-family-playground','Jeux et structure d’escalade condamnés',34,28,5),
      asset('wheel','closed-family-wheel','Petite roue immobilisée',18,16,18),
      asset('boats','closed-boating-pond','Bassin des barques fermé',30,24,1.5,true),
      asset('maze','closed-garden-maze','Labyrinthe fermé au public',38,32,2.2)],
    limits:['Les petits trains, jeux et manèges sont des réservations fermées ; aucun embarquement ni mouvement n’est livré.']},
  'EXT-MONDE-T050': {name:'Parc à sensations',intent:'Grandes emprises mécaniques, maintenance et évacuation en périphérie',
    staffRooms:['atelier mécanique lourde','local outillage','réserve pièces détachées','contrôle machines'],
    activityRooms:['poste de contrôle attractions','bureau exploitation','archives interventions','réserve équipement'],
    assets:[asset('coaster','closed-steel-coaster','Enveloppe des montagnes russes fermée',142,110,36),
      asset('launch','closed-launch-coaster','Enveloppe du circuit lancé fermée',122,82,22),
      asset('drop','closed-drop-tower','Tour de chute immobilisée',22,22,58),
      asset('wheel','closed-observation-wheel','Grande roue immobilisée',42,34,48),
      asset('spinner','closed-spinning-ride','Plateau tournant immobilisé',38,38,16),
      asset('swing','closed-giant-swing','Enveloppe de débattement du balancier fermée',46,42,32)],
    limits:['Les enveloppes comprennent la réserve de mouvement, pas seulement les appuis. Rails, véhicules, nacelles et cinématique restent à réaliser.']},
  'EXT-MONDE-T051': {name:'Parc aquatique',intent:'Bassins clos, plages sèches et séparation des visiteurs des locaux de traitement',
    staffRooms:['atelier pompes aquatiques','local outillage','réserve pièces détachées','contrôle traitement des eaux'],
    activityRooms:['poste de contrôle bassins','bureau surveillance','salle de soins','réserve médicale'],
    assets:[asset('sport-pool','closed-sports-pool','Bassin sportif fermé',50,25,2,true),
      asset('leisure-pool','closed-leisure-pool','Bassin ludique fermé',46,38,1.8,true),
      asset('lazy-river','closed-lazy-river','Enveloppe de rivière lente fermée',58,42,1.4,true),
      asset('slides','closed-water-slides','Enveloppe des toboggans et bassin de réception fermée',48,56,18,true),
      asset('paddling','closed-paddling-pool','Pataugeoire fermée',26,22,.6,true),
      asset('wave-pool','closed-wave-pool','Bassin à vagues arrêté et fermé',52,46,2.4,true)],
    limits:['Aucune baignade, nage, vague, glissade ni désinfection active ; tous les bassins restent infranchissables.']},
  'EXT-MONDE-T052': {name:'Parc thématique abandonné',intent:'Décors fermés et bâtiments de service encore inspectables à pied',
    staffRooms:['atelier décors','atelier menuiserie','réserve textile','local outillage'],
    activityRooms:['bureau régie','réserve costumes','archives spectacles','poste de contrôle'],
    assets:[asset('castle','closed-theme-castle','Façade du château condamnée',36,30,24),
      asset('dark-ride','closed-dark-ride','Enveloppe du parcours scénique fermée',72,52,12),
      asset('theatre','closed-open-air-theatre','Théâtre de plein air condamné',56,42,9),
      asset('mine','closed-mine-train','Enveloppe du train de mine fermée',86,62,18),
      asset('lagoon','closed-theme-lagoon','Lagon de décor fermé',42,34,2,true),
      asset('village','closed-theme-frontages','Façades du village de décor fermées',66,26,8)],
    limits:['Les bâtiments de décor sont condamnés ; intérieurs scéniques, dégradation détaillée et spectacles ne sont pas livrés.']},
  'EXT-MONDE-T067': {name:'Vélodrome',intent:'Piste cycliste réservée, préparation des athlètes et logistique des cycles séparées',
    staffRooms:['atelier cycles','local outillage','réserve pièces détachées','contrôle mécanique'],
    activityRooms:['vestiaires athlètes','douches athlètes','rangement sportif cycles','club-house cycliste'],
    assets:[asset('velodrome','closed-velodrome-bowl','Piste, gradins et aire centrale fermés',130,92,16),
      asset('warmup','sports-court','Aire extérieure de préparation cycliste',54,28,.1,false,true),
      asset('practice','sports-court','Plateau extérieur d’entraînement',42,24,.1,false,true),
      asset('bicycle-store','closed-cycle-stores','Réserve extérieure des cycles fermée',28,18,3.2),
      asset('media','closed-sports-media-tower','Poste technique média fermé',12,12,8),
      asset('training-court','sports-court','Cour sèche de préparation physique',32,22,.1,false,true)],
    limits:['La piste et les gradins sont un volume fermé. Le tracé auteur n’est ni une piste homologuée ni un circuit cyclable simulé.']},
  'EXT-MONDE-T068': {name:'Complexe sportif',intent:'Terrains distincts et locaux d’équipe desservis sans traverser les aires de jeu',
    staffRooms:['atelier équipements sportifs','local outillage','rangement sportif','bureau maintenance'],
    activityRooms:['vestiaires équipe A','vestiaires équipe B','douches athlètes','rangement sportif'],
    assets:[asset('multi-court','sports-court','Plateau multisports extérieur',44,26,.1,false,true),
      asset('tennis','sports-court','Enveloppe du court de tennis et dégagements auteur',38,20,.1,false,true),
      asset('athletics','sports-court','Ligne droite et dégagements d’athlétisme auteur',120,18,.1,false,true),
      asset('training-lawn','sports-lawn','Aire d’échauffement engazonnée',48,32,.1,false,true),
      asset('gymnasium','closed-gymnasium','Halle sportive fermée',52,38,10),
      asset('covered-courts','closed-covered-courts','Courts couverts fermés',46,34,8)],
    limits:['Les quatre terrains extérieurs sont parcourables en inspection seulement. Halles et tribunes restent fermées ; aucun match, entraînement ou service actif n’est créé.']}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS = freeze([[0,1,2,3,4,5],[1,0,3,2,5,4],[2,3,4,5,0,1],[3,2,5,4,1,0],
  [4,5,0,1,2,3],[5,4,1,0,3,2],[0,2,4,1,3,5],[1,3,5,0,2,4],[4,2,0,5,3,1],[5,3,1,4,2,0]]);
const contains = (a,b) => b.x>=a.x-1e-8 && b.y>=a.y-1e-8 && b.x+b.w<=a.x+a.w+1e-8 && b.y+b.h<=a.y+a.h+1e-8;
const overlaps = (a,b) => a.x<b.x+b.w-1e-8 && a.x+a.w>b.x+1e-8 && a.y<b.y+b.h-1e-8 && a.y+a.h>b.y+1e-8;

function build(type,number) {
  if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie ou variante de loisirs invalide.');
  const profile=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10;
  const id=type+'-V'+String(number).padStart(2,'0');
  const cellW=Math.max(...profile.assets.map(s=>s.w))+RULES.cellClearanceM+tier*RULES.sizeStepM;
  const cellH=Math.max(106,...profile.assets.map(s=>s.h+RULES.cellClearanceM))+tier*RULES.sizeStepM;
  const gridX=114,gridEnd=gridX+2*cellW,W=gridEnd+140,H=RULES.firstLaneM+3*cellH+24;
  const p={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'recreation',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    designAssumptions:['Toutes les emprises, hauteurs, dégagements et tracés sont des choix auteur originaux en mètres, sans relevé réel ni homologation revendiquée.',
      'Les emprises d’attractions comprennent leur réserve de mouvement ; elles sont fermées et ne sont jamais réduites pour tenir dans une parcelle.',
      'Les allées publiques, les voies techniques, les files et les appareils sont distincts ; une liaison contrôlée dessert la zone de service au nord.'],
    configuration:{sizeTier:tier+1,arrangement:layout+1,intent:profile.intent},
    bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    circulation:{visitorEntry:null,serviceEntry:null,controlledGate:null,publicSpines:[],serviceSpine:[],activityStops:[]},
    operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
    unresolved:['implantation dans les seeds et raccords aux routes réelles','butin fini, occupation et rencontres contextualisées',
      'énergie, eau, secours et maintenance financés','graphismes définitifs, cinématique et états des appareils',
      'persistance et qualification en campagne',...profile.limits]};
  const nodes=new Map(),lines=new Map(),edgeIds=new Set();
  function node(key,x,y){if(nodes.has(key))throw Error('Borne de loisirs répétée.');const n={id:id+':'+key,x,y,z:0};nodes.set(key,n);p.network.nodes.push(n);return key;}
  function edge(a,b,mode='pedestrian'){
    if(a===b||!nodes.has(a)||!nodes.has(b))throw Error('Liaison de loisirs invalide.');
    const key=[a,b].sort().join('|');if(edgeIds.has(key))return;edgeIds.add(key);
    p.network.edges.push({id:id+':edge:'+p.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,
      widthM:mode==='service'?RULES.serviceRoadM:RULES.pathM,mode,level:0});
  }
  function vertical(key,x,y){
    if(!lines.has(x))lines.set(x,[]);
    const old=lines.get(x).find(k=>Math.abs(nodes.get(k).y-y)<1e-8);if(old)return old;
    node(key,x,y);lines.get(x).push(key);return key;
  }
  const west=RULES.visitorSpineM,east=gridEnd+18,service=W-16;
  node('visitor-entry',west,0);node('visitor-exit',west,H);node('service-entry',service,0);node('service-exit',service,H);
  p.circulation.visitorEntry=nodes.get('visitor-entry').id;p.circulation.serviceEntry=nodes.get('service-entry').id;
  for(let row=0;row<=3;row++){
    const y=RULES.firstLaneM+row*cellH;
    vertical('visitor-west:'+row,west,y);vertical('visitor-east:'+row,east,y);vertical('service:'+row,service,y);
    edge('visitor-west:'+row,'visitor-east:'+row);
  }
  edge('visitor-entry','visitor-west:0');edge('visitor-west:3','visitor-exit');
  edge('service-entry','service:0','service');edge('service:3','service-exit','service');
  edge('visitor-east:0','service:0');
  p.circulation.controlledGate={from:nodes.get('visitor-east:0').id,to:nodes.get('service:0').id,scope:'inspection-link-not-live-access-control'};
  for(const [key,requires] of [['visitor-entry','pedestrian-access'],['visitor-exit','emergency-pedestrian-access'],
    ['service-entry','service-road'],['service-exit','emergency-service-road']])p.network.externalPorts.push({node:nodes.get(key).id,requires,connectedToWorld:false});

  const publicFacilities=[
    {role:'welcome',name:'Accueil, consignes et premiers soins',w:24,h:20,height:3.4,rooms:['accueil','bureau billetterie','consignes','salle de soins']},
    {role:'changing',name:'Hygiène des visiteurs',w:28,h:24,height:3.3,rooms:['vestiaires visiteurs','douches visiteurs','sanitaires','local nettoyage']},
    {role:'food',name:'Restauration et réserves',w:30,h:24,height:3.6,rooms:['cuisine','réfectoire','réserve sèche','plonge']},
    {role:'activity',name:profile.name+' : préparation et soins',w:30,h:26,height:3.5,rooms:profile.activityRooms}
  ];
  const serviceFacilities=[
    {role:'administration',name:'Exploitation et sécurité',w:26,h:22,height:3.4,rooms:['bureau exploitation','poste de garde','réunion équipe','archives interventions']},
    {role:'workshop',name:'Atelier spécialisé',w:32,h:26,height:4.8,rooms:profile.staffRooms},
    {role:'stores',name:'Magasin du site',w:30,h:24,height:4,rooms:['réserve équipements','stockage technique','bureau magasin','local nettoyage']},
    {role:'utilities',name:'Services techniques arrêtés',w:28,h:24,height:4.2,rooms:['tableau de distribution','groupe de secours','local pompes','contrôle énergie']}
  ];
  // Two top-row slots and one in each following row leave every public
  // building accessible without borrowing an attraction's safety envelope.
  const slots=[[0,18],[0,60],[1,28],[2,28]];
  function facility(def,slot,technical){
    const [row,offset]=slots[slot],x=technical?gridEnd+50:22,y=RULES.firstLaneM+row*cellH+offset;
    const south=(layout+slot+(technical?1:0))%2===1,face=south?'south':'north';
    const b={id:id+':building:'+def.role,role:def.role,name:def.name,kind:'recreation-'+def.role,x,y,w:def.w,h:def.h,
      rotationRad:0,entrySide:face,heightM:def.height,heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],
      entry:{x:def.w/2,y:south?def.h:0,level:0,widthM:RULES.doorM}};
    const cw=RULES.corridorM,t=RULES.wallM,c={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(b.w-cw)/2,y:0,w:cw,h:b.h,level:0,clearHeightM:b.heightM-.4};
    b.rooms.push(c);
    for(let i=0;i<def.rooms.length;i++){
      const right=i%2===1,band=Math.floor(i/2),r={id:b.id+':room:'+i,name:def.rooms[i],x:right?(b.w+cw)/2+t:t,y:band*b.h/2+t,
        w:(b.w-cw)/2-2*t,h:b.h/2-2*t,level:0,clearHeightM:b.heightM-.4};
      b.rooms.push(r);b.portals.push({id:r.id+':door',from:c.id,to:r.id,x:right?c.x+c.w:c.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:t,axis:'y'});
    }
    p.buildings.push(b);
    const frontY=y+b.entry.y,approachY=frontY+(south?5:-5),spine=technical?service:west;
    const branch=vertical('building:'+def.role+':branch',spine,approachY),turn=node('building:'+def.role+':turn',x+b.entry.x,approachY);
    const door=node('building:'+def.role+':entry',x+b.entry.x,frontY);edge(branch,turn);edge(turn,door);
  }
  for(let slot=0;slot<4;slot++){
    const selected=(slot+layout)%4;facility(publicFacilities[selected],slot,false);
    facility(serviceFacilities[(slot+Math.floor(layout/2))%4],slot,true);
  }
  for(let slot=0;slot<6;slot++){
    const def=profile.assets[ARRANGEMENTS[layout][slot]],row=Math.floor(slot/2),col=slot%2;
    const x=gridX+col*cellW+(cellW-def.w)/2,y=RULES.firstLaneM+row*cellH+(cellH-def.h)/2;
    const a={id:id+':activity:'+def.role,role:def.role,name:def.name,kind:def.kind,x,y,w:def.w,h:def.h,
      level:0,maxHeightM:def.height,heightOrigin:'author-design',footprintOrigin:'author-design',water:def.water,
      walkable:def.open,interiorStatus:def.open?'outdoor-inspection':'closed-reservation',operational:false,lootAssigned:false,utilityConnected:false};
    if(def.open)p.outdoorAreas.push(a);else p.structures.push(a);
    const laneY=RULES.firstLaneM+row*cellH,key='activity:'+def.role;
    const junction=node(key+':junction',x+def.w/2,laneY),stop=node(key+':view',x+def.w/2,y-3);
    // Keep the junction between the two side spines on the same horizontal
    // lane. It does not create a diagonal shortcut through adjacent assets.
    edge('visitor-west:'+row,junction);edge(junction,'visitor-east:'+row);edge(junction,stop);
    const visit={role:def.role,area:a.id,viewNode:nodes.get(stop).id,open:def.open};
    if(def.open){const field=node(key+':field',x+def.w/2,y+def.h/2);edge(stop,field);visit.fieldNode=nodes.get(field).id;}
    p.circulation.activityStops.push(visit);
    if(def.role==='velodrome'){
      const radius=24,straight=(250-2*Math.PI*radius)/2,cx=x+def.w/2,cy=y+def.h/2;
      const outline=[];
      for(let i=0;i<=16;i++){const angle=-Math.PI/2+i*Math.PI/16;outline.push({x:cx+straight/2+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius});}
      for(let i=0;i<=16;i++){const angle=Math.PI/2+i*Math.PI/16;outline.push({x:cx-straight/2+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius});}
      p.trackGeometry={scope:'author-centreline-not-homologated',enclosureId:a.id,nominalLengthM:250,straightM:straight,
        turnRadiusM:radius,laneWidthM:7.5,bankingSimulated:false,walkable:false,centerline:outline,
        grandstands:[{x:x+8,y:y+5,w:def.w-16,h:12},{x:x+8,y:y+def.h-17,w:def.w-16,h:12}]};
    }
  }
  for(const [x,keys]of lines){
    keys.sort((a,b)=>nodes.get(a).y-nodes.get(b).y);
    for(let i=1;i<keys.length;i++)edge(keys[i-1],keys[i],x===service?'service':'pedestrian');
  }
  p.circulation.publicSpines=[...lines.get(west),...lines.get(east)].map(k=>nodes.get(k).id);
  p.circulation.serviceSpine=lines.get(service).map(k=>nodes.get(k).id);
  p.maxHeightM=Math.max(...p.buildings.map(b=>b.heightM),...p.structures.map(s=>s.maxHeightM));
  return freeze(p);
}

function audit(p){
  const base=Reference.audit(p),errors=[...base.errors],fail=code=>errors.push(code);
  try{
    const profile=PROFILES[p.type];
    if(!profile||!Number.isInteger(p.number)||p.number<1||p.number>RULES.variants||p.id!==p.type+'-V'+String(p.number).padStart(2,'0'))fail('recreation-identity');
    if(p.configuration.sizeTier!==Math.floor((p.number-1)/10)+1||p.configuration.arrangement!==(p.number-1)%10+1||p.configuration.intent!==profile.intent)fail('recreation-configuration');
    if(p.authorFamily!=='recreation'||p.name!==profile.name||p.sourceIds.length||p.heightOrigin!=='author-design'||!p.designAssumptions.some(v=>v.includes('choix auteur')))fail('recreation-provenance');
    const roles=['welcome','changing','food','activity','administration','workshop','stores','utilities'];
    if(p.buildings.length!==8||new Set(p.buildings.map(b=>b.role)).size!==8||roles.some(role=>!p.buildings.some(b=>b.role===role)))fail('recreation-facilities');
    if(!p.buildings.find(b=>b.role==='welcome')?.rooms.some(r=>r.name==='salle de soins'))fail('recreation-first-aid');
    for(const [role,rooms]of [['activity',profile.activityRooms],['workshop',profile.staffRooms]]){
      const b=p.buildings.find(b=>b.role===role);
      if(!b||b.rooms.filter(r=>r.kind!=='circulation').map(r=>r.name).join('|')!==rooms.join('|'))fail('recreation-room-programme');
    }
    const actual=[...p.structures,...p.outdoorAreas];
    if(actual.length!==6||new Set(actual.map(a=>a.role)).size!==6)fail('recreation-activities');
    for(const def of profile.assets){
      const a=actual.find(a=>a.role===def.role);
      if(!a||a.kind!==def.kind||a.name!==def.name||a.w!==def.w||a.h!==def.h||a.maxHeightM!==def.height||a.water!==def.water||a.walkable!==def.open||a.operational!==false||a.lootAssigned!==false||a.utilityConnected!==false||a.heightOrigin!=='author-design'||!contains(p.bounds,a))fail('recreation-activity-scale-or-state');
      if(!a||a.water&&a.walkable||a?.water&&!p.structures.includes(a))fail('recreation-water');
      if(a&&(Object.hasOwn(a,'amount')||Object.hasOwn(a,'resource')))fail('recreation-false-stock');
    }
    for(let i=0;i<actual.length;i++)for(let j=i+1;j<actual.length;j++)if(overlaps(actual[i],actual[j]))fail('recreation-overlapping-activities');
    for(const a of p.outdoorAreas)if(p.buildings.some(b=>overlaps(a,b)))fail('recreation-field-building');
    if(Object.keys(p.operations).sort().join(',')!=='connectedServices,lootContainersCreated,outputCreated,productionRecipes'||Object.values(p.operations).some(v=>v!==0))fail('recreation-false-operation');
    if(!p.unresolved.includes(profile.limits[0])||p.unresolved.length<6)fail('recreation-hidden-limit');
    const c=p.circulation,nodes=new Map(p.network.nodes.map(n=>[n.id,n])),adjacent=new Map(p.network.nodes.map(n=>[n.id,[]]));
    for(const e of p.network.edges){if(adjacent.has(e.from)&&adjacent.has(e.to)){adjacent.get(e.from).push(e.to);adjacent.get(e.to).push(e.from);}}
    const seen=new Set([c.visitorEntry]),queue=[c.visitorEntry];
    for(let i=0;i<queue.length;i++)for(const n of adjacent.get(queue[i])||[])if(!seen.has(n)){seen.add(n);queue.push(n);}
    if(!nodes.has(c.visitorEntry)||!nodes.has(c.serviceEntry)||c.visitorEntry===c.serviceEntry||seen.size!==nodes.size)fail('recreation-single-connected-network');
    const service=new Set(c.serviceSpine),publicNodes=new Set(c.publicSpines);
    if(!service.size||!publicNodes.size||[...service].some(id=>publicNodes.has(id))||
      [...service].some(id=>nodes.get(id)?.x!==p.bounds.w-16)||
      [...publicNodes].some(id=>![RULES.visitorSpineM,p.bounds.w-122].includes(nodes.get(id)?.x)))fail('recreation-shared-spines');
    if(c.controlledGate.scope!=='inspection-link-not-live-access-control'||!publicNodes.has(c.controlledGate.from)||!service.has(c.controlledGate.to)||
      !p.network.edges.some(e=>e.from===c.controlledGate.from&&e.to===c.controlledGate.to||e.to===c.controlledGate.from&&e.from===c.controlledGate.to))fail('recreation-controlled-link');
    if(c.activityStops.length!==6)fail('recreation-missing-activity-access');
    for(const stop of c.activityStops){const a=actual.find(a=>a.id===stop.area),n=nodes.get(stop.viewNode);
      if(!a||!n||n.x!==a.x+a.w/2||n.y!==a.y-3||stop.open!==a.walkable)fail('recreation-activity-access');
      if(stop.open){const target=nodes.get(stop.fieldNode);if(!a||!target||target.x!==a.x+a.w/2||target.y!==a.y+a.h/2)fail('recreation-field-access');}
      else if(Object.hasOwn(stop,'fieldNode'))fail('recreation-closed-access');
    }
    if(p.type==='EXT-MONDE-T067'){
      const t=p.trackGeometry,box=p.structures.find(s=>s.id===t?.enclosureId);
      if(!box||t.scope!=='author-centreline-not-homologated'||t.nominalLengthM!==250||t.turnRadiusM!==24||t.laneWidthM!==7.5||
        Math.abs(2*t.straightM+2*Math.PI*t.turnRadiusM-t.nominalLengthM)>1e-8||t.walkable!==false||t.bankingSimulated!==false||t.centerline.length!==34||t.grandstands.length!==2)fail('recreation-velodrome');
      if(box&&(t.centerline.some(n=>!Number.isFinite(n.x)||!Number.isFinite(n.y)||!contains(box,{x:n.x-t.laneWidthM/2,y:n.y-t.laneWidthM/2,w:t.laneWidthM,h:t.laneWidthM}))||t.grandstands.some(s=>!contains(box,s))))fail('recreation-track-envelope');
      if(box){
        const cx=box.x+box.w/2,cy=box.y+box.h/2;
        for(let i=0;i<34;i++){
          const first=i<17,j=i%17,angle=(first?-Math.PI/2:Math.PI/2)+j*Math.PI/16,n=t.centerline[i];
          const x=cx+(first?1:-1)*t.straightM/2+Math.cos(angle)*t.turnRadiusM,y=cy+Math.sin(angle)*t.turnRadiusM;
          if(!n||Math.abs(n.x-x)>1e-8||Math.abs(n.y-y)>1e-8)fail('recreation-track-centreline');
        }
        if(overlaps(t.grandstands[0],t.grandstands[1])||t.grandstands.some(s=>t.centerline.some(n=>overlaps(s,{x:n.x-t.laneWidthM/2,y:n.y-t.laneWidthM/2,w:t.laneWidthM,h:t.laneWidthM}))))fail('recreation-stand-on-track');
      }
    }else if(p.trackGeometry!==undefined)fail('recreation-wrong-track');
  }catch{fail('recreation-schema');}
  return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
// END AUTHOR CORE
module.exports={RULES,PROFILES,TYPES,build,audit};
