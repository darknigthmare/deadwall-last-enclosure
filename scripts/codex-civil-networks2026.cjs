'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,wallM:.2,corridorM:2.4,doorM:1.4,
  inspectionRoadM:4.5,inspectionPathM:1.4,highwayWidthM:26,localRoadWidthM:14,
  rampWidthM:6,roadMaxGrade:.06,railMaxGrade:.025,minimumGradeSeparationM:5,
  highwayDeckElevationM:8,roadDeckDepthM:1.2,closedMarginM:120,roadJunctionToleranceM:1e-7});
const freeze = value => {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const PROFILES = freeze({
 'EXT-MONDE-T029':{name:'Pont routier à poutres',family:'bridge',form:'beam',mode:'road',widthM:800,heightM:620,spanM:64,deckWidthM:10.5,deckElevationM:8.2,deckDepthM:1.2},
 'EXT-MONDE-T030':{name:'Pont à arches',family:'bridge',form:'arch',mode:'road',widthM:1000,heightM:680,spanM:96,deckWidthM:10.5,deckElevationM:12,deckDepthM:1.2},
 'EXT-MONDE-T031':{name:'Pont levant portuaire',family:'bridge',form:'lift',mode:'road',widthM:900,heightM:660,spanM:56,deckWidthM:12,deckElevationM:8.5,deckDepthM:1.5},
 'EXT-MONDE-T032':{name:'Viaduc ferroviaire',family:'bridge',form:'rail-viaduct',mode:'rail',widthM:2600,heightM:800,spanM:240,deckWidthM:9,deckElevationM:18,deckDepthM:1.8},
 'EXT-MONDE-T033':{name:'Échangeur en losange',family:'interchange',form:'diamond',widthM:1200,heightM:1200},
 'EXT-MONDE-T034':{name:'Échangeur en trompette',family:'interchange',form:'trumpet',widthM:1200,heightM:1200},
 'EXT-MONDE-T035':{name:'Trèfle autoroutier',family:'interchange',form:'cloverleaf',widthM:1400,heightM:1400},
 'EXT-MONDE-T036':{name:'Échangeur directionnel',family:'interchange',form:'directional',widthM:1400,heightM:1400}
});
const TYPES=Object.freeze(Object.keys(PROFILES));
const PROGRAMMES=freeze([
 ['reception','Accueil de maintenance',['accueil','bureau exploitation','archives','réserve accueil']],
 ['workshop','Atelier des ouvrages',['atelier maintenance','local outillage','réserve pièces détachées','atelier mécanique']],
 ['power','Locaux électriques',['tableau de distribution électrique','local batteries','groupe de secours','contrôle énergie']],
 ['pumps','Drainage de l’ouvrage',['local pompes','contrôle drainage','atelier pompes','réserve entretien']],
 ['welfare','Locaux du personnel',['vestiaires','douches','réfectoire','sanitaires','salle de soins du personnel','réserve de pansements']],
 ['stores','Magasin d’entretien',['réserve outillage','stockage matériel','réserve signalisation','local nettoyage']],
 ['guard','Poste de surveillance',['poste de garde','bureau sécurité','repos équipe','réserve équipement']],
 ['management','Administration technique',['bureau études','réunion technique','archives plans','bureau exploitation']]
]);
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const overlap=(a,b)=>a.x<b.x+b.w-1e-8&&a.x+a.w>b.x+1e-8&&a.y<b.y+b.h-1e-8&&a.y+a.h>b.y+1e-8;
const within=(a,b)=>a.x>=b.x-1e-8&&a.y>=b.y-1e-8&&a.x+a.w<=b.x+b.w+1e-8&&a.y+a.h<=b.y+b.h+1e-8;
const close=(a,b)=>Math.abs(a-b)<1e-7;
function rotate(x,y,quarter){for(let i=0;i<quarter;i++){const old=x;x=-y;y=old;}return {x,y};}
function crossing(a,b,c,d){
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;
 if(Math.abs(den)<1e-9)return null;
 const dx=c.x-a.x,dy=c.y-a.y,t=(dx*sy-dy*sx)/den,u=(dx*ry-dy*rx)/den;
 return t>=-1e-7&&t<=1+1e-7&&u>=-1e-7&&u<=1+1e-7?{t,u,x:a.x+t*rx,y:a.y+t*ry}:null;
}
function build(type,number){
 if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie ou variante de génie civil invalide.');
 const profile=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10,id=type+'-V'+String(number).padStart(2,'0');
 const step=profile.mode==='rail'?400:160,W=profile.widthM+tier*step,H=profile.heightM+tier*80;
 const plan={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
  authorFamily:'civil-networks',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
  bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
  network:{nodes:[],edges:[],externalPorts:[]},
  configuration:{sizeTier:tier+1,arrangement:layout+1,form:profile.form},
  transportNetwork:{scope:'author-transport-layout-not-operational',operational:false,inspectionAccess:'closed',nodes:[],edges:[],externalPorts:[]},
  civil:{scope:'author-design-not-engineering-approval',inspectionAccess:'closed',supports:[],clearances:[],junctions:[],routes:[]},
  designAssumptions:['Toutes les dimensions, altitudes, appuis et tracés sont des choix auteur originaux en mètres, pas un relevé de site ni une homologation d’ouvrage.',
   'Le domaine civil central est fermé dans l’inspection : ni ses chaussées, ni ses volumes supérieurs, ni ses passages inférieurs ne sont actuellement accessibles.',
   'Le graphe de transport décrit les axes et leurs raccords, avec altitudes explicites. Il ne crée aucune route de campagne, circulation automobile, train ni animation de levage.'],
  operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
  unresolved:['implantation et raccords dans les seeds','chaussées, rampes et franchissements physiquement parcourables',
   'sens de circulation, rayons dynamiques, signalisation et gabarits des véhicules','calcul structurel et conformité des ouvrages',
   'réseaux et appareils payés, maintenance et mécanismes','butin fini, rencontres, graphismes définitifs et persistance de campagne']};
 const ground=new Map(),lanes=new Map();
 function groundNode(key,x,y){const n={id:id+':inspection:'+key,x,y,z:0};if(ground.has(key))throw Error('Borne d’inspection répétée.');ground.set(key,n);plan.network.nodes.push(n);return key;}
 function groundEdge(a,b,mode='service'){plan.network.edges.push({id:id+':inspection:edge:'+plan.network.edges.length,from:ground.get(a).id,to:ground.get(b).id,widthM:mode==='service'?RULES.inspectionRoadM:RULES.inspectionPathM,mode,level:0});}
 function lane(key,x,y){if(!lanes.has(y))lanes.set(y,[]);const old=lanes.get(y).find(k=>close(ground.get(k).x,x));if(old)return old;groundNode(key,x,y);lanes.get(y).push(key);return key;}
 groundNode('gate',30,0);lane('nw',30,30);lane('ne',W-30,30);lane('sw',30,H-30);lane('se',W-30,H-30);
 groundEdge('gate','nw');groundEdge('nw','sw');groundEdge('ne','se');
 plan.network.externalPorts.push({node:ground.get('gate').id,requires:'maintenance-road',connectedToWorld:false});
 for(let slot=0;slot<8;slot++){
  const def=PROGRAMMES[(slot+layout)%8],south=slot>=4,col=slot%4,w=22+tier*.5,h=18+tier*.5;
  const x=80+col*(W-160)/4+((W-160)/4-w)/2,y=south?H-70-h:50,face=south?'south':'north';
  const b={id:id+':building:'+def[0],role:def[0],kind:def[0],name:def[1],x,y,w,h,rotationRad:0,entrySide:face,heightM:3.6,
   heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],entry:{x:w/2,y:south?h:0,level:0,widthM:RULES.doorM}};
  const rows=def[2].length/2,cw=RULES.corridorM,wall=RULES.wallM,c={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:3.1};b.rooms.push(c);
  for(let i=0;i<def[2].length;i++){const east=i%2===1,row=Math.floor(i/2),r={id:b.id+':room:'+i,name:def[2][i],x:east?(w+cw)/2+wall:wall,y:row*h/rows+wall,w:(w-cw)/2-2*wall,h:h/rows-2*wall,level:0,clearHeightM:3.1};b.rooms.push(r);b.portals.push({id:r.id+':door',from:c.id,to:r.id,x:east?c.x+cw:c.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:wall,axis:'y'});}
  plan.buildings.push(b);const approach=lane('approach:'+def[0],x+w/2,south?H-30:30),entry=groundNode('entry:'+def[0],x+w/2,y+b.entry.y);groundEdge(approach,entry,'pedestrian');
 }
 for(const keys of lanes.values()){keys.sort((a,b)=>ground.get(a).x-ground.get(b).x);for(let i=1;i<keys.length;i++)groundEdge(keys[i-1],keys[i]);}
 const domain={id:id+':civil-closed-domain',kind:'closed-civil-transport-domain',name:'Ouvrage et chaussées fermés à l’inspection',x:100,y:RULES.closedMarginM,w:W-200,h:H-2*RULES.closedMarginM,
  maxHeightM:1,heightOrigin:'author-design',footprintOrigin:'author-design',walkable:false,interiorStatus:'closed-civil-domain',lootAssigned:false,utilityConnected:false};plan.structures.push(domain);plan.civil.closedDomainId=domain.id;
 const transport=new Map(),T=plan.transportNetwork;
 function transportNode(key,x,y,z,kind='junction'){
  if(transport.has(key))throw Error('Nœud de transport répété.');
  const n={id:id+':transport:'+key,x,y,z,level:close(z,0)?0:close(z,RULES.highwayDeckElevationM)?1:null,kind};transport.set(key,n);T.nodes.push(n);return key;
 }
 function transportEdge(a,b,widthM,mode,kind='axis'){
  const na=transport.get(a),nb=transport.get(b);T.edges.push({id:id+':transport:edge:'+T.edges.length,from:na.id,to:nb.id,widthM,mode,level:close(na.z,nb.z)?na.level:null,kind});return T.edges.at(-1).id;
 }
 function addRoute(key,from,to,points,widthM,mode='ramp',form='ramp'){
  const a=transport.get(from),b=transport.get(to),lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  const length=lengths.at(-1);let previous=from;const edges=[];
  for(let i=1;i<points.length;i++){const end=i===points.length-1,z=a.z+(b.z-a.z)*lengths[i]/length,k=end?to:transportNode(key+':'+i,points[i].x,points[i].y,z,'ramp-point');edges.push(transportEdge(previous,k,widthM,mode,'ramp'));previous=k;}
  plan.civil.routes.push({id:id+':route:'+key,from:a.id,to:b.id,edgeIds:edges,kind:form,inspectionAccess:'closed'});
 }
 const cx=W/2,cy=H/2;
 if(profile.family==='bridge'){
  const span=profile.spanM+tier*(profile.mode==='rail'?80:24)+layout*2,deckWidth=profile.deckWidthM+(profile.mode==='road'&&tier>=3?7:0),elevation=profile.deckElevationM+layout*.04;
  const left=cx-span/2,right=cx+span/2,from=transportNode('west-port',120,cy,0,'destination'),a=transportNode('west-abutment',left,cy,elevation),b=transportNode('east-abutment',right,cy,elevation),to=transportNode('east-port',W-120,cy,0,'destination');
  transport.get(a).level=1;transport.get(b).level=1;
  transportEdge(from,a,deckWidth,profile.mode,'approach-ramp');const deckEdge=transportEdge(a,b,deckWidth,profile.mode,'bridge-deck');transportEdge(b,to,deckWidth,profile.mode,'approach-ramp');
  for(const key of [from,to])T.externalPorts.push({node:transport.get(key).id,requires:profile.mode,connectedToWorld:false});
  plan.civil.deck={id:id+':deck',form:profile.form,x:left,y:cy-deckWidth/2,w:span,h:deckWidth,elevationM:elevation,depthM:profile.deckDepthM,transportEdge:deckEdge,inspectionAccess:'closed'};
  plan.civil.waterArea={id:id+':water',kind:'author-river-reach',x:left+span*.15,y:180,w:span*.7,h:H-360,waterLevelM:0,walkable:false,navigable:false};
  plan.civil.clearances.push({id:id+':under-deck-clearance',x:left+span*.15,y:cy-deckWidth/2,w:span*.7,h:deckWidth,heightM:elevation-profile.deckDepthM,lowerDatumM:0,upperDatumM:elevation-profile.deckDepthM,datum:'nominal-author-water-level',inspectionAccess:'closed'});
  const support=(key,x,y,w,h,zTo)=>plan.civil.supports.push({id:id+':support:'+key,kind:key.startsWith('abutment')?'abutment':'pier',x,y,w,h,zFromM:0,zToM:zTo,footprintOrigin:'author-design'});
  support('abutment-west',left-4,cy-deckWidth/2-2,4,deckWidth+4,elevation-profile.deckDepthM);support('abutment-east',right,cy-deckWidth/2-2,4,deckWidth+4,elevation-profile.deckDepthM);
  if(profile.form!=='lift'){
   const count=profile.form==='arch'?2+tier:Math.max(1,Math.ceil(span/(profile.mode==='rail'?40:32))-1);
   for(let i=1;i<=count;i++)support('pier-'+i,left+span*i/(count+1)-1.1,cy-deckWidth/2-1,2.2,deckWidth+2,elevation-profile.deckDepthM);
  }
  if(profile.form==='arch')plan.civil.arches={count:2+tier,riseM:Math.max(3,elevation-profile.deckDepthM-2),springingDatumM:2,operational:false};
  if(profile.form==='lift'){
   plan.civil.lift={state:'closed-and-immobilized',liftStrokeM:16+tier*2,animationDelivered:false,powerConnected:false};
   for(const [side,x]of [['west',left-5],['east',right+2]])for(const [bank,y]of [['north',cy-deckWidth/2-5],['south',cy+deckWidth/2+2]])plan.civil.supports.push({id:id+':tower:'+side+':'+bank,kind:'lift-tower',x,y,w:3,h:3,zFromM:0,zToM:elevation+plan.civil.lift.liftStrokeM+4,footprintOrigin:'author-design'});
  }
  plan.maxHeightM=Math.max(elevation,...plan.civil.supports.map(s=>s.zToM));
  plan.configuration.spanM=span;plan.configuration.deckWidthM=deckWidth;
 }else{
  const R=65+tier*10+layout*1.5,high=RULES.highwayDeckElevationM,extX=W/2-120,extY=H/2-140;
  const axis=(key,x,y,z)=>transportNode(key,cx+x,cy+y,z);
  for(const [key,x]of [['west-port',-extX],['west-junction',-3*R],['west-centre',0],['east-junction',3*R],['east-port',extX]])axis(key,x,0,high);
  const ew=['west-port','west-junction','west-centre','east-junction','east-port'];for(let i=1;i<ew.length;i++)transportEdge(ew[i-1],ew[i],RULES.highwayWidthM,'road');
  const ns=profile.form==='trumpet'?['south-junction','south-port']:['north-port','north-junction','lower-centre','south-junction','south-port'];
  const nsY={'north-port':-extY,'north-junction':-3*R,'lower-centre':0,'south-junction':3*R,'south-port':extY};
  for(const key of ns)axis(key,0,nsY[key],0);for(let i=1;i<ns.length;i++)transportEdge(ns[i-1],ns[i],RULES.localRoadWidthM,'road');
  const ports=['west-port','east-port',...(profile.form==='trumpet'?['south-port']:['north-port','south-port'])];for(const key of ports)T.externalPorts.push({node:transport.get(key).id,requires:'road-at-declared-elevation',connectedToWorld:false});
  for(const key of ['west-junction','east-junction',...ns.filter(k=>k.endsWith('junction'))]){const n=transport.get(key);plan.civil.junctions.push({id:n.id+':merge',node:n.id,radiusM:30,operational:false});}
  const endpoints=[['east-junction','north-junction'],['south-junction','east-junction'],['west-junction','south-junction'],['north-junction','west-junction']];
  function points(kind,q){
   const raw=[];
   if(kind==='diamond')raw.push({x:3*R,y:0},{x:1.5*R,y:-1.5*R},{x:0,y:-3*R});
   else if(kind==='loop'){
    const cubic=(a,b,c,d,t)=>{const s=1-t;return {x:s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,y:s*s*s*a.y+3*s*s*t*b.y+3*s*t*t*c.y+t*t*t*d.y};};
    const scale=p=>({x:p.x*R,y:p.y*R});
    for(let i=0;i<=16;i++)raw.push(cubic(...[{x:3,y:0},{x:4,y:0},{x:3,y:-3},{x:3,y:-2}].map(scale),i/16));
    for(let i=1;i<=24;i++){const angle=3*Math.PI/2*i/24;raw.push({x:2*R+R*Math.cos(angle),y:-2*R+R*Math.sin(angle)});}
    for(let i=1;i<=16;i++)raw.push(cubic(...[{x:2,y:-3},{x:3,y:-3},{x:0,y:-4},{x:0,y:-3}].map(scale),i/16));
   }else if(kind==='directional'){
    for(let i=0;i<=24;i++){const t=i/24,s=1-t;raw.push({x:3*R*s*s*s+5.1*R*s*s*t,y:-5.1*R*s*t*t-3*R*t*t*t});}
   }else{
    for(let i=0;i<=20;i++){const angle=Math.PI/2+Math.PI/2*i/20;raw.push({x:3*R+3*R*Math.cos(angle),y:-3*R+3*R*Math.sin(angle)});}
   }
   return raw.map(p=>{const r=rotate(p.x,p.y,q);return {x:cx+r.x,y:cy+r.y};});
  }
  if(profile.form==='trumpet'){
   for(const [kind,q]of [['loop',2],['direct',1],['direct',2]]){const [a,b]=endpoints[q];addRoute(kind+':'+q,a,b,points(kind,q),RULES.rampWidthM,'ramp',kind);}
  }else{
   const kinds=profile.form==='diamond'?['diamond']:profile.form==='cloverleaf'?['loop','direct']:['directional','direct'];
   for(const kind of kinds)for(let q=0;q<4;q++){const [a,b]=endpoints[q];addRoute(kind+':'+q,a,b,points(kind,q),RULES.rampWidthM,'ramp',kind);}
  }
  plan.civil.gradeSeparation=profile.form==='trumpet'?null:{upperNode:transport.get('west-centre').id,lowerNode:transport.get('lower-centre').id,clearHeightM:high-1.2,deckDepthM:1.2};
  if(plan.civil.gradeSeparation)plan.civil.clearances.push({id:id+':main-crossing-clearance',x:cx-RULES.localRoadWidthM/2,y:cy-RULES.highwayWidthM/2,w:RULES.localRoadWidthM,h:RULES.highwayWidthM,heightM:high-1.2,lowerDatumM:0,upperDatumM:high-1.2,datum:'lower-road-level',inspectionAccess:'closed'});
  for(const x of [cx-RULES.localRoadWidthM/2-5,cx+RULES.localRoadWidthM/2+3])plan.civil.supports.push({id:id+':support:'+plan.civil.supports.length,kind:'crossing-pier',x,y:cy-RULES.highwayWidthM/2,w:2,h:RULES.highwayWidthM,zFromM:0,zToM:high-1.2,footprintOrigin:'author-design'});
  plan.configuration.rampRadiusM=R;plan.maxHeightM=high;
 }
 domain.maxHeightM=plan.maxHeightM;
 // An axis edge owns its altitude; a ramp joins real endpoints without adding
 // a junction at a mere projected crossing. Nothing is connected to the world.
 return freeze(plan);
}
function audit(plan){
 const base=Reference.audit(plan),errors=[...base.errors],fail=code=>errors.push(code);
 try{
  const p=PROFILES[plan.type];
  if(!p||!Number.isInteger(plan.number)||plan.number<1||plan.number>50||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0'))fail('civil-identity');
  if(plan.configuration?.form!==p.form||plan.configuration.sizeTier!==Math.floor((plan.number-1)/10)+1||plan.configuration.arrangement!==(plan.number-1)%10+1)fail('civil-configuration');
  if(plan.authorFamily!=='civil-networks'||plan.name!==p.name||plan.sourceIds.length||plan.heightOrigin!=='author-design'||!plan.designAssumptions.some(x=>x.includes('choix auteur')))fail('civil-provenance');
  if(plan.buildings.length!==8||new Set(plan.buildings.map(b=>b.role)).size!==8||plan.structures.length!==1||plan.reservedAreas.length||plan.outdoorAreas.length)fail('civil-programme');
  for(const def of PROGRAMMES){const b=plan.buildings.find(b=>b.role===def[0]);if(!b||b.name!==def[1]||b.rooms.filter(r=>r.kind!=='circulation').map(r=>r.name).join('|')!==def[2].join('|'))fail('civil-room-programme');}
  const domain=plan.structures[0];if(domain.maxHeightM!==plan.maxHeightM)fail('civil-reservation-height');if(domain.id!==plan.civil.closedDomainId||domain.kind!=='closed-civil-transport-domain'||domain.walkable!==false||domain.interiorStatus!=='closed-civil-domain')fail('civil-closed-domain');
  if(plan.network.nodes.some(n=>within({x:n.x,y:n.y,w:0,h:0},domain)))fail('civil-inspection-enters-closed-domain');
  if(plan.civil.scope!=='author-design-not-engineering-approval'||plan.civil.inspectionAccess!=='closed')fail('civil-false-visitability');
  const T=plan.transportNetwork;if(T.scope!=='author-transport-layout-not-operational'||T.operational!==false||T.inspectionAccess!=='closed')fail('civil-false-transport-operation');
  const nodes=new Map(),ids=new Set(),edges=new Map(),links=new Map();
  for(const n of T.nodes){
   if(typeof n.id!=='string'||ids.has(n.id)||![n.x,n.y,n.z].every(Number.isFinite)||n.z<0||n.z>plan.maxHeightM||![0,1,null].includes(n.level)||!within({x:n.x,y:n.y,w:0,h:0},domain))fail('civil-transport-node');
   if([...nodes.values()].some(other=>close(other.x,n.x)&&close(other.y,n.y)&&close(other.z,n.z)))fail('civil-unjoined-coincident-node');
   if(!['junction','ramp-point','destination'].includes(n.kind)||(n.level===0)!==close(n.z,0)||n.kind!=='ramp-point'&&n.z>0&&n.level!==1)fail('civil-node-level');
   ids.add(n.id);nodes.set(n.id,n);links.set(n.id,[]);
  }
  for(const e of T.edges){
   const a=nodes.get(e.from),b=nodes.get(e.to);if(ids.has(e.id)||!a||!b||a===b||!positive(e.widthM)||!['road','rail','ramp'].includes(e.mode)){fail('civil-transport-edge');continue;}
   ids.add(e.id);edges.set(e.id,e);links.get(a.id).push(b.id);links.get(b.id).push(a.id);
   const length=Math.hypot(b.x-a.x,b.y-a.y),grade=Math.abs(b.z-a.z)/length,max=e.mode==='rail'?RULES.railMaxGrade:RULES.roadMaxGrade;
   if(!positive(length)||!Number.isFinite(grade)||grade>max+1e-8)fail('civil-excessive-grade');
   if(!close(a.z,b.z)&&!['ramp','approach-ramp'].includes(e.kind))fail('civil-implicit-level-change');
   if(close(a.z,b.z)&&e.level!==a.level||!close(a.z,b.z)&&e.level!==null)fail('civil-edge-level');
   if(Reference.corridorOverlaps(a,b,e.widthM,domain)===false)fail('civil-axis-outside-domain');
   const half=e.widthM/2;if(a.x-half<domain.x||a.x+half>domain.x+domain.w||a.y-half<domain.y||a.y+half>domain.y+domain.h||b.x-half<domain.x||b.x+half>domain.x+domain.w||b.y-half<domain.y||b.y+half>domain.y+domain.h)fail('civil-width-outside-domain');
  }
  const start=T.externalPorts[0]?.node,seen=new Set(start?[start]:[]),queue=start?[start]:[];
  if(!T.externalPorts.length||T.externalPorts.some(x=>!nodes.has(x.node)||typeof x.requires!=='string'||!x.requires||x.connectedToWorld!==false))fail('civil-false-external-link');
  for(let i=0;i<queue.length;i++)for(const next of links.get(queue[i])||[])if(!seen.has(next)){seen.add(next);queue.push(next);}
  if(seen.size!==nodes.size)fail('civil-transport-disconnected');
  const all=[...edges.values()];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
   const a=all[i],b=all[j];if([a.from,a.to].some(n=>n===b.from||n===b.to))continue;
   const p0=nodes.get(a.from),p1=nodes.get(a.to),q0=nodes.get(b.from),q1=nodes.get(b.to),at=crossing(p0,p1,q0,q1);if(!at)continue;
   const za=p0.z+(p1.z-p0.z)*at.t,zb=q0.z+(q1.z-q0.z)*at.u;if(Math.abs(za-zb)-RULES.roadDeckDepthM<RULES.minimumGradeSeparationM)fail('civil-unjoined-or-low-crossing');
  }
  const inspectionNodes=new Map(plan.network.nodes.map(n=>[n.id,n])),groundLinks=new Map(plan.network.nodes.map(n=>[n.id,[]]));for(const e of plan.network.edges){groundLinks.get(e.from).push(e.to);groundLinks.get(e.to).push(e.from);}
  const groundSeen=new Set([plan.network.externalPorts[0].node]),groundQueue=[...groundSeen];for(let i=0;i<groundQueue.length;i++)for(const next of groundLinks.get(groundQueue[i])||[])if(!groundSeen.has(next)){groundSeen.add(next);groundQueue.push(next);}if(groundSeen.size!==inspectionNodes.size)fail('civil-inspection-disconnected');
  for(const s of plan.civil.supports){if(ids.has(s.id)||typeof s.id!=='string')fail('civil-component-identity');ids.add(s.id);if(![s.x,s.y,s.w,s.h,s.zFromM,s.zToM].every(Number.isFinite)||!positive(s.w)||!positive(s.h)||s.zFromM!==0||s.zToM<=0||s.zToM>plan.maxHeightM||!within(s,domain))fail('civil-support');}
  for(const c of plan.civil.clearances){if(ids.has(c.id)||typeof c.id!=='string')fail('civil-component-identity');ids.add(c.id);if(!positive(c.heightM)||!close(c.upperDatumM-c.lowerDatumM,c.heightM)||!within(c,domain)||c.inspectionAccess!=='closed')fail('civil-clearance');}
  if(p.family==='bridge'){
   const d=plan.civil.deck,c=plan.civil.clearances[0],e=edges.get(d.transportEdge),a=nodes.get(e?.from),b=nodes.get(e?.to);
   if(!d||d.form!==p.form||d.inspectionAccess!=='closed'||!a||!b||!close(a.x,d.x)||!close(b.x,d.x+d.w)||!close(a.y,d.y+d.h/2)||!close(a.z,d.elevationM)||!close(b.z,d.elevationM)||!close(c.heightM,d.elevationM-d.depthM))fail('civil-bridge-deck');
   if(!plan.civil.waterArea||plan.civil.waterArea.walkable!==false||plan.civil.waterArea.navigable!==false||!within(plan.civil.waterArea,domain)||plan.civil.waterArea.waterLevelM!==0)fail('civil-water');
   if(p.form==='lift'&&(plan.civil.lift?.state!=='closed-and-immobilized'||plan.civil.lift.animationDelivered!==false||plan.civil.lift.powerConnected!==false||plan.civil.supports.filter(s=>s.kind==='lift-tower').length!==4))fail('civil-false-lift');
   if(p.form==='arch'&&(!Number.isInteger(plan.civil.arches?.count)||plan.civil.arches.count<2||plan.civil.arches.operational!==false))fail('civil-arch');
   if(T.externalPorts.length!==2||T.edges.length!==3||T.edges.map(e=>e.kind).join(',')!=='approach-ramp,bridge-deck,approach-ramp'||plan.civil.supports.filter(s=>s.kind==='abutment').length!==2)fail('civil-bridge-programme');
  }else{
   const expected=p.form==='diamond'?4:p.form==='trumpet'?3:8;if(plan.civil.routes.length!==expected)fail('civil-ramp-count');
   for(const route of plan.civil.routes){if(route.inspectionAccess!=='closed'||!route.edgeIds.length||!nodes.has(route.from)||!nodes.has(route.to))fail('civil-ramp-route');let at=route.from;for(const edgeId of route.edgeIds){const e=edges.get(edgeId);if(!e||e.from!==at){fail('civil-ramp-route');break;}at=e.to;}if(at!==route.to)fail('civil-ramp-route');}
   if(p.form!=='trumpet'){
    const g=plan.civil.gradeSeparation,a=nodes.get(g?.upperNode),b=nodes.get(g?.lowerNode);if(!a||!b||a.id===b.id||!close(a.x,b.x)||!close(a.y,b.y)||a.z-b.z-g.deckDepthM<RULES.minimumGradeSeparationM||!close(g.clearHeightM,a.z-b.z-g.deckDepthM)||T.edges.some(e=>e.from===a.id&&e.to===b.id||e.to===a.id&&e.from===b.id))fail('civil-false-crossing-junction');
   }
  }
  if(domain.lootAssigned!==false||domain.utilityConnected!==false||Object.hasOwn(domain,'amount')||Object.hasOwn(domain,'resource')||Object.keys(plan.operations).sort().join(',')!=='connectedServices,lootContainersCreated,outputCreated,productionRecipes'||Object.values(plan.operations).some(x=>x!==0))fail('civil-false-stock-or-service');
 }catch{fail('civil-schema');}
 return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
function auditAll(){const records=[];for(const type of TYPES)for(let number=1;number<=50;number++){const p=build(type,number),a=audit(p);if(!a.ok)throw Error(p.id+': '+a.errors.join(', '));records.push({id:p.id,type,widthM:p.bounds.w,lengthM:p.bounds.h,heightM:p.maxHeightM,...a});}return {schemaVersion:1,scope:'civil-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};}
// END AUTHOR CORE
module.exports={RULES,PROFILES,TYPES,build,audit,auditAll};
