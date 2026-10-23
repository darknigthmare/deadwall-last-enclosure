'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,wallM:.2,corridorM:2.4,doorM:1.4,
  pathM:2.4,serviceRoadM:6,railGaugeM:1.435,trackSpacingM:24,switchRunM:216,
  crossingWidthM:10,platformWidthM:8,airsideFenceM:.3});
const freeze = value => {
  if(value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
};
const PROFILES = freeze({
  'EXT-MONDE-T069':{name:'Aérodrome régional',mode:'air',runwayLengthM:1200,lengthStepM:100,runwayWidthM:30,runways:1,stands:3,towerHeightM:18,hangar:[60,44,12],terminal:[84,44],purpose:'regional-passengers'},
  'EXT-MONDE-T070':{name:'Aéroport international',mode:'air',runwayLengthM:2600,lengthStepM:200,runwayWidthM:45,runways:2,stands:8,towerHeightM:36,hangar:[100,72,18],terminal:[180,72],purpose:'international-passengers'},
  'EXT-MONDE-T071':{name:'Aéroport de fret',mode:'air',runwayLengthM:2200,lengthStepM:200,runwayWidthM:45,runways:1,stands:6,towerHeightM:28,hangar:[96,68,17],terminal:[120,60],purpose:'air-cargo'},
  'EXT-MONDE-T072':{name:'Aérodrome insulaire',mode:'air',runwayLengthM:900,lengthStepM:100,runwayWidthM:24,runways:1,stands:2,towerHeightM:14,hangar:[46,36,10],terminal:[70,40],purpose:'island-passengers'},
  'EXT-MONDE-T073':{name:'Gare de passage',mode:'rail',trackLengthM:1400,lengthStepM:160,tracks:2,through:true,fan:false,terminal:[86,44],purpose:'through-passengers'},
  'EXT-MONDE-T074':{name:'Gare terminus',mode:'rail',trackLengthM:1600,lengthStepM:200,tracks:4,through:false,fan:false,terminal:[132,56],purpose:'terminating-passengers'},
  'EXT-MONDE-T075':{name:'Gare de triage',mode:'rail',trackLengthM:2200,lengthStepM:200,tracks:6,through:false,fan:true,terminal:[68,40],purpose:'freight-sorting'},
  'EXT-MONDE-T076':{name:'Dépôt ferroviaire',mode:'rail',trackLengthM:1800,lengthStepM:160,tracks:5,through:false,fan:true,terminal:[76,42],purpose:'rolling-stock-maintenance'}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS = freeze([
  [0,1,2,3,4,5,6],[1,0,3,2,5,6,4],[2,3,0,1,6,4,5],[3,2,1,0,5,4,6],
  [0,2,4,6,1,3,5],[4,0,5,1,6,2,3],[5,1,6,2,0,3,4],[6,3,2,5,4,1,0],
  [1,4,0,6,2,5,3],[2,6,3,4,0,5,1]
]);
const rectangle = v => v && [v.x,v.y,v.w,v.h].every(Number.isFinite) && v.w>0 && v.h>0;
const contains = (a,b) => b.x>=a.x-1e-8 && b.y>=a.y-1e-8 && b.x+b.w<=a.x+a.w+1e-8 && b.y+b.h<=a.y+a.h+1e-8;
const overlap = (a,b) => a.x<b.x+b.w-1e-8 && a.x+a.w>b.x+1e-8 && a.y<b.y+b.h-1e-8 && a.y+a.h>b.y+1e-8;
function undeclaredCrossing(first,second,nodes) {
  const a=nodes.get(first.from),b=nodes.get(first.to),c=nodes.get(second.from),d=nodes.get(second.to);
  if(!a||!b||!c||!d)return false;
  const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,cx=c.x-a.x,cy=c.y-a.y;
  const cross=(x,y,u,v)=>x*v-y*u,denominator=cross(rx,ry,sx,sy),epsilon=1e-8;
  const shared=[first.from,first.to].some(id=>id===second.from||id===second.to);
  if(Math.abs(denominator)<epsilon) {
    if(Math.abs(cross(cx,cy,rx,ry))>epsilon)return false;
    const horizontal=Math.abs(rx)>Math.abs(ry),x0=horizontal?a.x:a.y,x1=horizontal?b.x:b.y,y0=horizontal?c.x:c.y,y1=horizontal?d.x:d.y;
    const span=Math.min(Math.max(x0,x1),Math.max(y0,y1))-Math.max(Math.min(x0,x1),Math.min(y0,y1));
    return span>epsilon||span>=-epsilon&&!shared;
  }
  const t=cross(cx,cy,sx,sy)/denominator,u=cross(cx,cy,rx,ry)/denominator;
  if(t<-epsilon||t>1+epsilon||u<-epsilon||u>1+epsilon)return false;
  return !shared||t>epsilon&&t<1-epsilon||u>epsilon&&u<1-epsilon;
}

function build(type,number) {
  if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants) throw Error('Typologie ou variante de transport invalide.');
  const profile=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10;
  const id=type+'-V'+String(number).padStart(2,'0'),air=profile.mode==='air';
  const length=(air?profile.runwayLengthM:profile.trackLengthM)+tier*profile.lengthStepM;
  const lastTaxiY=200+(air?profile.runways-1:0)*360+140;
  const W=length+(air?400:300),H=air?lastTaxiY+760:800;
  const p={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'transport-sites',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    configuration:{sizeTier:tier+1,arrangement:layout+1,purpose:profile.purpose},
    designAssumptions:[
      'Toutes les cotes sont des choix auteur originaux en mètres, sans relevé de site réel ni conformité aéronautique ou ferroviaire revendiquée.',
      'La longueur des pistes et des voies n’est pas comprimée pour la vue. Le graphe de transport décrit une géométrie, sans avion, train, signalisation ou aiguillage opérationnel.',
      'L’inspection reste piétonne au sol. Les tours et hangars fermés ne possèdent pas d’étage public inventé ; les passages ferroviaires sont explicitement de plain-pied sans circulation de train.'
    ],
    bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    transportNetwork:{scope:'author-transport-layout-not-operational',operational:false,inspectionAccess:'closed',nodes:[],edges:[],externalPorts:[]},
    operations:{lootContainersCreated:0,connectedServices:0,vehiclesCreated:0,outputCreated:0},
    unresolved:['implantation et réseaux du seed','raccords réels aux voies, pistes et à la côte insulaire',
      'circulation des véhicules, rayons de courbure et règles de sécurité','signalisation et passages à niveau opérationnels',
      'intérieurs des hangars et étages des tours','budgets finis de butin et rencontres','art définitif, animations et persistance de campagne']};
  const nodes=new Map(),lanes=new Map(),transportNodes=new Map();
  function node(key,x,y) {
    if(nodes.has(key)) throw Error('Borne piétonne répétée.');
    const n={id:id+':walk:'+key,x,y,z:0};nodes.set(key,n);p.network.nodes.push(n);return key;
  }
  function edge(a,b,mode='pedestrian') {
    if(!nodes.has(a)||!nodes.has(b)||a===b) throw Error('Liaison piétonne invalide.');
    p.network.edges.push({id:id+':walk-edge:'+p.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,
      widthM:mode==='service'?RULES.serviceRoadM:RULES.pathM,mode,level:0});
  }
  function lane(key,x,y) {
    if(!lanes.has(y))lanes.set(y,[]);
    const old=lanes.get(y).find(k=>Math.abs(nodes.get(k).x-x)<1e-8);if(old)return old;
    node(key,x,y);lanes.get(y).push(key);return key;
  }
  function tnode(key,x,y,kind='junction') {
    if(transportNodes.has(key))throw Error('Borne de transport répétée.');
    const n={id:id+':transport:'+key,x,y,z:0,level:0,kind};transportNodes.set(key,n);p.transportNetwork.nodes.push(n);return key;
  }
  function tedge(a,b,widthM,mode,kind=mode,extra={}) {
    if(!transportNodes.has(a)||!transportNodes.has(b)||a===b)throw Error('Liaison de transport invalide.');
    const e={id:id+':transport-edge:'+p.transportNetwork.edges.length,from:transportNodes.get(a).id,to:transportNodes.get(b).id,widthM,mode,level:0,kind,...extra};
    p.transportNetwork.edges.push(e);return e.id;
  }
  function area(key,kind,name,x,y,w,h,reserved=true,extra={}) {
    const value={id:id+':area:'+key,kind,name,x,y,w,h,level:0,origin:'author-design',lootAssigned:false,utilityConnected:false,...extra};
    (reserved?p.reservedAreas:p.outdoorAreas).push(value);return value;
  }
  function solid(key,kind,name,x,y,w,h,heightM,extra={}) {
    const s={id:id+':structure:'+key,kind,name,x,y,w,h,maxHeightM:heightM,heightOrigin:'author-design',footprintOrigin:'author-design',interiorStatus:'closed',walkable:false,lootAssigned:false,utilityConnected:false,...extra};
    p.structures.push(s);return s;
  }
  const topY=H-300,bottomY=H-30;
  for(const y of [topY,bottomY]) {lane('west:'+y,24,y);lane('east:'+y,W-24,y);}
  edge('west:'+topY,'west:'+bottomY,'service');edge('east:'+topY,'east:'+bottomY,'service');
  node('entrance',24,H);edge('entrance','west:'+bottomY,'service');
  p.network.externalPorts.push({node:nodes.get('entrance').id,requires:'local-road',connectedToWorld:false});
  const facilities=[
    {role:'terminal',name:air?'Terminal et accueil':'Hall des voyageurs et exploitation',w:profile.terminal[0],h:profile.terminal[1],height:air?7:5.5,
      rooms:air?['accueil','contrôle sûreté','bureau opérations aériennes','réserve bagages','repos équipe','sanitaires','cuisine équipe','poste de garde']:['accueil','bureau exploitation ferroviaire','réserve bagages','contrôle voies','repos équipe','sanitaires','consignes','poste de garde']},
    {role:'freight',name:air?'Réception du fret aérien':'Réception et expédition du fret',w:profile.purpose==='air-cargo'?110:54,h:profile.purpose==='air-cargo'?56:38,height:7,
      rooms:['bureau réception','stockage expédition','réserve palettes','atelier manutention','vestiaires','local nettoyage']},
    {role:'maintenance',name:'Atelier de maintenance',w:58,h:38,height:6,rooms:['atelier maintenance','réserve pièces détachées','local outillage','contrôle maintenance']},
    {role:'welfare',name:'Locaux du personnel',w:44,h:36,height:3.8,rooms:['vestiaires A','vestiaires B','sanitaires','douches','réfectoire','cuisine']},
    {role:'management',name:'Administration',w:36,h:30,height:4,rooms:['bureau exploitation','réunion équipe','archives','informatique']},
    {role:'power',name:'Énergie et communications',w:34,h:32,height:4.5,rooms:['tableau de distribution électrique','groupe de secours','communications','réserve batteries']},
    {role:'rescue',name:'Secours et sécurité',w:40,h:34,height:4.5,rooms:['salle de soins','réserve médicale','poste de garde','repos équipe']}
  ];
  for(let pos=0;pos<facilities.length;pos++) {
    const f=facilities[ARRANGEMENTS[layout][pos]],row=pos<4?0:1,col=row?pos-4:pos;
    const w=f.w+tier*3,h=f.h+tier*2,x=100+col*260+(220-w)/2+(layout%5)*2;
    const y=row?H-130:H-270,side=row?'south':'north',height=f.height+tier*.2;
    const b={id:id+':building:'+f.role,kind:f.role,name:f.name,role:f.role,x,y,w,h,rotationRad:0,entrySide:side,heightM:height,
      heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],entry:{x:w/2,y:side==='north'?0:h,level:0,widthM:RULES.doorM}};
    const cw=RULES.corridorM,t=RULES.wallM,rows=f.rooms.length/2;
    const c={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:height-.4};b.rooms.push(c);
    for(let i=0;i<f.rooms.length;i++) {
      const east=i%2===1,band=Math.floor(i/2),r={id:b.id+':room:'+i,name:f.rooms[i],x:east?(w+cw)/2+t:t,y:band*h/rows+t,w:(w-cw)/2-2*t,h:h/rows-2*t,level:0,clearHeightM:height-.4};
      b.rooms.push(r);b.portals.push({id:r.id+':door',from:c.id,to:r.id,x:east?c.x+cw:c.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:t,axis:'y'});
    }
    p.buildings.push(b);const approach=lane('approach:'+f.role,x+w/2,row?bottomY:topY);
    node('entry:'+f.role,x+w/2,y+b.entry.y);edge(approach,'entry:'+f.role);
  }
  if(air) {
    const tw=profile.runwayWidthM>30?23:18,runways=[],stands=profile.stands+tier;
    for(let row=0;row<profile.runways;row++) {
      const y=200+row*360,taxiY=y+140;
      const strip=area('runway-strip:'+row,'runway-strip','Réserve libre de la piste '+(row+1),140,y-75,length+120,150);
      const runway=area('runway:'+row,'runway','Piste '+(row+1),200,y-profile.runwayWidthM/2,length,profile.runwayWidthM,true,{parent:strip.id});
      const taxi=area('taxiway:'+row,'taxiway','Voie de circulation '+(row+1),50,taxiY-tw/2,length+150,tw);
      const rw=[],tx=[];
      for(const [name,x] of [['west',200],['middle',200+length/2],['east',200+length]]) {
        rw.push(tnode('runway:'+row+':'+name,x,y,name==='middle'?'junction':'runway-threshold'));
        tx.push(tnode('taxiway:'+row+':'+name,x,taxiY));
      }
      for(let i=1;i<rw.length;i++) {tedge(rw[i-1],rw[i],profile.runwayWidthM,'runway','runway',{area:runway.id});tedge(tx[i-1],tx[i],tw,'taxiway','taxiway',{area:taxi.id});}
      for(let i=0;i<rw.length;i++) {
        const x=transportNodes.get(rw[i]).x;
        const turn=area('runway-exit:'+row+':'+i,'runway-exit','Sortie de piste réservée',x-tw/2,y,tw,140);
        tedge(rw[i],tx[i],tw,'taxiway','runway-exit',{area:turn.id});
      }
      const west=tnode('taxiway:'+row+':west-bypass',50,taxiY,'aircraft-holding-point');
      tedge(west,tx[0],tw,'taxiway','bypass',{area:taxi.id});
      if(row) {
        const previous='taxiway:'+(row-1)+':west-bypass';
        const bypass=area('bypass:'+row,'taxiway','Liaison hors extrémités des pistes',50-tw/2,taxiY-360,tw,360);
        tedge(previous,west,tw,'taxiway','bypass',{area:bypass.id});
      }
      runways.push({strip:strip.id,runway:runway.id,taxiway:taxi.id,runwayNodes:rw.map(k=>transportNodes.get(k).id),taxiwayNodes:tx.map(k=>transportNodes.get(k).id),lengthM:length,widthM:profile.runwayWidthM});
    }
    const centre=200+length/2,apronW=stands*70+100,apronY=lastTaxiY+120;
    const apron=area('apron','apron','Aire de stationnement des avions',centre-apronW/2,apronY,apronW,210,false,{walkable:true,inspectionAccess:'closed'});
    const approach=tnode('apron:approach',centre,lastTaxiY+145);
    const connector=area('apron-connector','taxiway','Liaison taxiway–aire avions',centre-tw/2,lastTaxiY,tw,145);
    tedge('taxiway:'+(profile.runways-1)+':middle',approach,tw,'taxiway','apron-connector',{area:connector.id});
    const row=[];
    for(let i=0;i<stands;i++) {
      const x=apron.x+85+i*70,laneKey=tnode('apron:lane:'+i,x,lastTaxiY+145),standKey=tnode('apron:stand:'+i,x,lastTaxiY+265,'apron-stand');
      area('aircraft-stand:'+i,'aircraft-stand','Poste avion '+(i+1),x-26,lastTaxiY+205,52,86,false,{parent:apron.id,inspectionAccess:'closed'});
      tedge(laneKey,standKey,tw,'apron','aircraft-stand',{area:apron.id});row.push(laneKey);
    }
    const ordered=[approach,...row].sort((a,b)=>transportNodes.get(a).x-transportNodes.get(b).x);
    for(let i=1;i<ordered.length;i++) if(Math.abs(transportNodes.get(ordered[i]).x-transportNodes.get(ordered[i-1]).x)>1e-8)tedge(ordered[i-1],ordered[i],tw,'apron','apron-lane',{area:apron.id});
    // An odd stand count puts its centre exactly on the approach. Share that
    // vertex explicitly instead of leaving two coincident disconnected nodes.
    const coincident=row.find(k=>Math.abs(transportNodes.get(k).x-centre)<1e-8);
    if(coincident) {
      const duplicate=transportNodes.get(coincident),canonical=transportNodes.get(approach);
      for(const e of p.transportNetwork.edges){if(e.from===duplicate.id)e.from=canonical.id;if(e.to===duplicate.id)e.to=canonical.id;}
      p.transportNetwork.nodes=p.transportNetwork.nodes.filter(n=>n.id!==duplicate.id);transportNodes.delete(coincident);
    }
    const hangar=solid('hangar','closed-aircraft-hangar','Hangar aéronautique fermé',apron.x+apron.w+24,lastTaxiY+220,...profile.hangar);
    const tower=solid('tower','closed-control-tower','Tour de contrôle fermée',apron.x-40,lastTaxiY+240,14,14,profile.towerHeightM+tier*2);
    const fenceY=H-330;solid('airside-fence','airside-fence','Clôture continue côté pistes',.5,fenceY,W-1,RULES.airsideFenceM,2.4);
    p.airfield={runways,apron:apron.id,stands:stands,hangar:hangar.id,tower:tower.id,inspectionAccess:'landside-only',flightSimulation:false};
    p.transportNetwork.externalPorts.push({node:p.transportNetwork.nodes.find(n=>n.kind==='runway-threshold').id,requires:'airspace',connectedToWorld:false});
  } else {
    const count=profile.tracks,crossX=220+(count-1)*RULES.switchRunM+200,ends=[],switches=[],platforms=[],crossings=[];
    const fenceY=180+(count-1)*RULES.trackSpacingM+80;
    solid('rail-fence-west','rail-fence','Clôture ferroviaire côté ouest',.5,fenceY,crossX-6-.5,RULES.airsideFenceM,2);
    solid('rail-fence-east','rail-fence','Clôture ferroviaire côté est',crossX+6,fenceY,W-crossX-6-.5,RULES.airsideFenceM,2);
    const approach=lane('crossing:approach',crossX,topY);node('crossing:gate',crossX,fenceY);edge(approach,'crossing:gate');
    let previous='crossing:gate';
    for(let i=count-1;i>=0;i--) {
      const y=180+i*RULES.trackSpacingM,platformY=y+12;
      const plat=area('platform:'+i,'rail-platform',profile.fan?'Quai de service '+(i+1):'Quai voyageurs '+(i+1),crossX+20,y+8,W-crossX-120,RULES.platformWidthM,false,{walkable:true});
      platforms.push(plat.id);node('platform-access:'+i,crossX,platformY);edge(previous,'platform-access:'+i);
      node('platform:'+i,crossX+40,platformY);edge('platform-access:'+i,'platform:'+i);previous='platform-access:'+i;
      node('crossing:'+i,crossX,y);edge(previous,'crossing:'+i);previous='crossing:'+i;
      const crossing=area('level-crossing:'+i,'rail-level-crossing','Traversée piétonne de plain-pied, trains inactifs',crossX-5,y-4,10,8,false,{walkable:true,operational:false});
      crossings.push({area:crossing.id,walkNode:nodes.get('crossing:'+i).id,railNode:id+':transport:rail:'+i+':crossing',level:0,barriersOperational:false});
    }
    for(let i=0;i<count;i++) {
      const y=180+i*RULES.trackSpacingM,startX=220+i*RULES.switchRunM,endX=profile.through?W:W-100;
      const junction=tnode('rail:'+i+':switch',startX,y,i<count-1?'junction':'bend');switches.push(junction);
      if(!profile.fan||i===0) {
        const external=tnode('rail:'+i+':west',0,y,'destination');tedge(external,junction,4.5,'rail','track');
        p.transportNetwork.externalPorts.push({node:transportNodes.get(external).id,requires:'rail',connectedToWorld:false});
      }
      const cross=tnode('rail:'+i+':crossing',crossX,y,'level-crossing');
      const terminal=tnode('rail:'+i+':end',endX,y,profile.through?'destination':'buffer-stop');
      tedge(junction,cross,4.5,'rail','track');tedge(cross,terminal,4.5,'rail','track');
      if(profile.through)p.transportNetwork.externalPorts.push({node:transportNodes.get(terminal).id,requires:'rail',connectedToWorld:false});
      else solid('buffer:'+i,'rail-buffer-stop','Butoir '+(i+1),endX+2,y-2.4,2,4.8,1.2);
      const from=profile.fan&&i>0?startX:0;
      area('rail-west:'+i,'rail-clearance','Réserve ferroviaire ouest '+(i+1),from,y-2.5,crossX-5-from,5);
      area('rail-east:'+i,'rail-clearance','Réserve ferroviaire est '+(i+1),crossX+5,y-2.5,endX-crossX-5,5);
      solid('crossing-signal:'+i,'closed-rail-signal','Signal inactif de la traversée '+(i+1),crossX+7,y-6,.6,.6,3,{operational:false});
      ends.push({track:i,from:transportNodes.get(junction).id,to:transportNodes.get(terminal).id,endKind:profile.through?'destination':'buffer-stop'});
    }
    for(let i=1;i<switches.length;i++)tedge(switches[i-1],switches[i],4.5,'rail','switch-connection');
    p.railway={gaugeM:RULES.railGaugeM,tracks:count,through:profile.through,fan:profile.fan,ends,platforms,crossings,
      signalSimulation:false,trainSimulation:false,inspectionAccess:'declared-level-crossing-with-no-train-traffic'};
  }
  for(const keys of lanes.values()) {
    keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);
    for(let i=1;i<keys.length;i++)edge(keys[i-1],keys[i],'service');
  }
  p.maxHeightM=Math.max(...p.buildings.map(b=>b.heightM),...p.structures.map(s=>s.maxHeightM));
  return freeze(p);
}

function audit(plan) {
  const base=Reference.audit(plan),errors=[...base.errors],fail=code=>errors.push(code);
  try {
    const p=PROFILES[plan.type],tier=Math.floor((plan.number-1)/10),layout=(plan.number-1)%10;
    if(!TYPES.includes(plan.type)||!Number.isInteger(plan.number)||plan.number<1||plan.number>50||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0'))fail('transport-identity');
    if(plan.sourceIds.length||plan.heightOrigin!=='author-design'||!plan.designAssumptions.some(s=>s.includes('choix auteur')))fail('transport-provenance');
    if(plan.configuration.sizeTier!==tier+1||plan.configuration.arrangement!==layout+1||plan.configuration.purpose!==p.purpose)fail('transport-configuration');
    if(plan.buildings.length!==7||new Set(plan.buildings.map(b=>b.role)).size!==7)fail('transport-facilities');
    const allAreas=[...plan.reservedAreas,...plan.outdoorAreas];
    if(new Set(allAreas.map(a=>a.id)).size!==allAreas.length||allAreas.some(a=>!rectangle(a)||!contains(plan.bounds,a)||a.level!==0))fail('transport-areas');
    const t=plan.transportNetwork;
    if(t.scope!=='author-transport-layout-not-operational'||t.operational!==false||t.inspectionAccess!=='closed'||!Array.isArray(t.nodes)||!Array.isArray(t.edges)||!Array.isArray(t.externalPorts))fail('transport-network-scope');
    const ns=new Map(),adjacent=new Map(),ids=new Set();
    for(const n of t.nodes) {
      if(ns.has(n.id)||typeof n.id!=='string'||![n.x,n.y,n.z].every(Number.isFinite)||n.z!==0||n.level!==0||!contains(plan.bounds,{x:n.x,y:n.y,w:0,h:0}))fail('transport-node');
      ns.set(n.id,n);adjacent.set(n.id,[]);
    }
    for(const e of t.edges) {
      const a=ns.get(e.from),b=ns.get(e.to);
      if(ids.has(e.id)||!a||!b||a.id===b.id||!Number.isFinite(e.widthM)||e.widthM<=0||e.level!==0||!['runway','taxiway','apron','rail'].includes(e.mode)||Math.hypot(a.x-b.x,a.y-b.y)<=1e-8){fail('transport-edge');continue;}
      const expectedWidth=p.mode==='rail'?4.5:e.mode==='runway'?p.runwayWidthM:p.runwayWidthM>30?23:18;
      if(e.widthM!==expectedWidth||p.mode==='rail'&&e.mode!=='rail'||p.mode==='air'&&(e.mode==='rail'||!e.area))fail('transport-edge-profile');
      ids.add(e.id);adjacent.get(a.id).push(b.id);adjacent.get(b.id).push(a.id);
      if(e.area) {
        const area=allAreas.find(v=>v.id===e.area),sweep={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};
        if(!area||!contains(area,sweep))fail('transport-edge-outside-area');
      }
    }
    for(let i=0;i<t.edges.length;i++)for(let j=i+1;j<t.edges.length;j++)if(undeclaredCrossing(t.edges[i],t.edges[j],ns))fail('transport-undeclared-crossing');
    const mixedNodes=new Map([...ns,...plan.network.nodes.map(n=>[n.id,n])]);
    for(const walk of plan.network.edges)for(const transport of t.edges) {
      if(!undeclaredCrossing(walk,transport,mixedNodes))continue;
      const declared=p.mode==='rail'&&plan.railway.crossings.some(c=>
        [walk.from,walk.to].includes(c.walkNode)&&[transport.from,transport.to].includes(c.railNode));
      if(!declared)fail('transport-undeclared-pedestrian-crossing');
    }
    if(!t.externalPorts.length||t.externalPorts.some(e=>e.connectedToWorld!==false||!ns.has(e.node)))fail('transport-false-external');
    const seen=new Set(),queue=[t.nodes[0]?.id];
    for(let i=0;i<queue.length;i++)if(!seen.has(queue[i])) {seen.add(queue[i]);for(const n of adjacent.get(queue[i])||[])queue.push(n);}
    if(seen.size!==ns.size)fail('transport-disconnected');
    if([...adjacent].some(([key,links])=>!links.length||links.length===1&&!['destination','buffer-stop','runway-threshold','apron-stand','aircraft-holding-point'].includes(ns.get(key).kind)))fail('transport-dangling-end');
    if(p.mode==='air') {
      const a=plan.airfield,length=p.runwayLengthM+tier*p.lengthStepM;
      if(a.runways.length!==p.runways||a.stands!==p.stands+tier||a.flightSimulation!==false||a.inspectionAccess!=='landside-only')fail('airfield-programme');
      const fence=plan.structures.filter(s=>s.kind==='airside-fence');
      if(fence.length!==1||fence[0].x!==.5||fence[0].w!==plan.bounds.w-1||fence[0].y!==plan.bounds.h-330||fence[0].h!==RULES.airsideFenceM||plan.network.nodes.some(n=>n.y<plan.bounds.h-330+.32))fail('airfield-closed-boundary');
      for(const runway of a.runways) {
        const r=allAreas.find(v=>v.id===runway.runway),strip=allAreas.find(v=>v.id===runway.strip),taxi=allAreas.find(v=>v.id===runway.taxiway);
        if(!r||!strip||!taxi||r.kind!=='runway'||strip.kind!=='runway-strip'||taxi.kind!=='taxiway'||r.w!==length||r.h!==p.runwayWidthM||runway.lengthM!==length||runway.widthM!==p.runwayWidthM||!contains(strip,r))fail('airfield-runway-dimensions');
        if(runway.runwayNodes.length!==3||runway.taxiwayNodes.length!==3)fail('airfield-runway-network');
        for(let i=0;i<3;i++)if(!t.edges.some(e=>e.from===runway.runwayNodes[i]&&e.to===runway.taxiwayNodes[i]&&e.kind==='runway-exit'))fail('airfield-missing-exit');
        for(let i=1;i<3;i++) {
          if(!t.edges.some(e=>e.from===runway.runwayNodes[i-1]&&e.to===runway.runwayNodes[i]&&e.mode==='runway'&&e.area===r.id))fail('airfield-runway-gap');
          if(!t.edges.some(e=>e.from===runway.taxiwayNodes[i-1]&&e.to===runway.taxiwayNodes[i]&&e.mode==='taxiway'&&e.area===taxi.id))fail('airfield-taxiway-gap');
        }
      }
      if(!plan.structures.some(s=>s.id===a.hangar&&s.kind==='closed-aircraft-hangar')||!plan.structures.some(s=>s.id===a.tower&&s.kind==='closed-control-tower'))fail('airfield-closed-facility');
    } else {
      const r=plan.railway;
      if(r.gaugeM!==RULES.railGaugeM||r.tracks!==p.tracks||r.through!==p.through||r.fan!==p.fan||r.ends.length!==p.tracks||r.platforms.length!==p.tracks||r.crossings.length!==p.tracks||r.trainSimulation!==false||r.signalSimulation!==false)fail('railway-programme');
      for(const end of r.ends) {
        const node=ns.get(end.to);
        if(!node||node.kind!==end.endKind||node.kind!==(p.through?'destination':'buffer-stop'))fail('railway-end');
        if(node?.kind==='buffer-stop'&&!plan.structures.some(s=>s.kind==='rail-buffer-stop'&&Math.abs(s.x-node.x-2)<1e-8&&Math.abs(s.y+2.4-node.y)<1e-8))fail('railway-missing-buffer');
      }
      for(const c of r.crossings) {
        const walk=plan.network.nodes.find(n=>n.id===c.walkNode),rail=ns.get(c.railNode),area=allAreas.find(a=>a.id===c.area);
        if(!walk||!rail||!area||walk.x!==rail.x||walk.y!==rail.y||c.level!==0||c.barriersOperational!==false||area.operational!==false||!contains(area,{x:walk.x,y:walk.y,w:0,h:0}))fail('railway-level-crossing');
      }
      if(t.edges.filter(e=>e.kind==='switch-connection').length!==p.tracks-1)fail('railway-switch-ladder');
    }
    const zero=['lootContainersCreated','connectedServices','vehiclesCreated','outputCreated'];
    if(JSON.stringify(Object.keys(plan.operations).sort())!==JSON.stringify([...zero].sort())||zero.some(k=>plan.operations[k]!==0))fail('transport-false-operation');
    for(const asset of [...plan.structures,...allAreas]) if(asset.lootAssigned!==false||asset.utilityConnected!==false||Object.hasOwn(asset,'amount')||Object.hasOwn(asset,'resource'))fail('transport-false-stock-or-service');
    if(plan.structures.some(s=>s.walkable!==false||s.interiorStatus!=='closed'||s.heightOrigin!=='author-design'||!Number.isFinite(s.maxHeightM)||s.maxHeightM<=0||s.maxHeightM>plan.maxHeightM))fail('transport-closed-structure');
  } catch { fail('transport-schema'); }
  return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
function auditAll() {
  const records=[];
  for(const type of TYPES)for(let number=1;number<=RULES.variants;number++) {
    const p=build(type,number),a=audit(p);if(!a.ok)throw Error(p.id+': '+a.errors.join(', '));
    records.push({id:p.id,type,widthM:p.bounds.w,lengthM:p.bounds.h,heightM:p.maxHeightM,...a});
  }
  return {schemaVersion:1,scope:'transport-authoring-not-campaign-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
// END AUTHOR CORE
if(require.main===module)console.log(JSON.stringify({types:TYPES,plans:TYPES.length*RULES.variants}));
module.exports={RULES,PROFILES,TYPES,build,audit,auditAll};
