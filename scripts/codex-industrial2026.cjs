'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1, variants:50, wallM:.2, corridorM:2.4,
  doorM:1.4, pathM:1.4, serviceRoadM:6, fenceM:.18, gateM:8,
  plotWidthM:320, plotLengthM:350, widthStepM:24, lengthStepM:18});
const freeze = value => {
  if(value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const PROFILES = freeze({
  'EXT-MONDE-T053': {name:'Usine agroalimentaire', process:'préparation et conditionnement alimentaire',
    preparation:{name:'Préparation alimentaire',kind:'food-preparation',w:38,h:34,height:4.6,
      rooms:['préparation alimentaire industrielle','dosage alimentaire industriel','local nettoyage','réserve ingrédients']},
    production:{name:'Transformation alimentaire',kind:'food-production',w:50,h:42,height:6.2,
      rooms:['mélange alimentaire industriel','traitement thermique alimentaire','contrôle qualité alimentaire','local nettoyage']},
    finishing:{name:'Conditionnement et froid',kind:'food-packing',w:36,h:32,height:4.8,
      rooms:['emballage industriel alimentaire','stockage réfrigéré produits finis','réserve emballages','contrôle qualité alimentaire']},
    receiving:['réception matières alimentaires','stockage réfrigéré matières premières','réserve ingrédients secs','bureau réception'],
    dispatch:['stockage réfrigéré expédition','stockage produits emballés','bureau expédition','réserve palettes'],
    equipment:[['water-tank',5,4,4.2],['refrigeration-unit',5.4,3,2.8],['electrical-cabinet',2,.9,2]]},
  'EXT-MONDE-T054': {name:'Usine mécanique', process:'débit, usinage et assemblage mécanique',
    preparation:{name:'Débit et préparation',kind:'metal-preparation',w:42,h:34,height:5.4,
      rooms:['découpe mécanique industrielle','stockage ébauches','atelier préparation outillage','réserve consommables']},
    production:{name:'Usinage',kind:'machining-hall',w:54,h:44,height:7.2,
      rooms:['tournage industriel','fraisage industriel','métrologie industrielle','atelier outillage de production','stockage pièces en cours','local nettoyage']},
    finishing:{name:'Assemblage et contrôle',kind:'mechanical-assembly',w:44,h:34,height:5.4,
      rooms:['assemblage mécanique industriel','contrôle mécanique final','réserve composants','emballage industriel mécanique']},
    receiving:['réception matières métalliques','stockage barres métalliques','stockage tôles','bureau réception'],
    dispatch:['stockage ensembles finis','stockage pièces emballées','bureau expédition','réserve palettes'],
    equipment:[['compressed-air-unit',4.2,3,2.8],['coolant-recovery-tank',4,3.2,3],['electrical-cabinet',2,.9,2]]},
  'EXT-MONDE-T055': {name:'Usine textile', process:'préparation, tissage et confection textile',
    preparation:{name:'Préparation des fibres',kind:'textile-preparation',w:36,h:34,height:4.8,
      rooms:['préparation textile industrielle','stockage bobines','réserve fibres','local nettoyage']},
    production:{name:'Tissage',kind:'weaving-hall',w:56,h:40,height:5.8,
      rooms:['tissage industriel A','tissage industriel B','contrôle textile industriel','stockage rouleaux en cours','atelier réglage métiers','local nettoyage']},
    finishing:{name:'Coupe et confection',kind:'textile-finishing',w:42,h:36,height:4.6,
      rooms:['coupe textile industrielle','confection textile industrielle','contrôle textile industriel','emballage industriel textile']},
    receiving:['réception fibres textiles','stockage fibres','stockage fils','bureau réception'],
    dispatch:['stockage rouleaux finis','stockage vêtements emballés','bureau expédition','réserve emballages'],
    equipment:[['air-filtration-unit',4.8,3,3.4],['water-tank',4,3.2,3.4],['electrical-cabinet',2,.9,2]]},
  'EXT-MONDE-T056': {name:'Usine de matériaux', process:'dosage, moulage et maturation de matériaux',
    preparation:{name:'Dosage des matières',kind:'material-preparation',w:42,h:36,height:6.4,
      rooms:['dosage matériaux industriel','stockage liants','réserve additifs','local nettoyage']},
    production:{name:'Mélange et formage',kind:'material-forming',w:58,h:46,height:7.8,
      rooms:['mélange matériaux industriel','formage matériaux industriel','contrôle matériaux industriel','atelier moules','stockage moules','local nettoyage']},
    finishing:{name:'Maturation et emballage',kind:'material-finishing',w:46,h:38,height:6,
      rooms:['maturation matériaux industrielle','contrôle matériaux industriel','emballage industriel matériaux','réserve calages']},
    receiving:['réception matières minérales','stockage granulats secs','stockage liants conditionnés','bureau réception'],
    dispatch:['stockage matériaux finis','stockage palettes préparées','bureau expédition','réserve palettes'],
    equipment:[['closed-material-silo',6,5,10.6],['water-recovery-tank',5,4,4.4],['electrical-cabinet',2,.9,2]]}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const PROCESS_ROLES = Object.freeze(['receiving','preparation','production','finishing','dispatch']);
const ARRANGEMENTS = freeze([
  [0,1,2,3,4,5,6,7,8], [0,2,1,5,4,3,6,8,7], [1,0,2,3,5,4,7,6,8],
  [2,1,0,4,3,5,8,7,6], [0,1,2,6,4,3,7,5,8], [1,2,0,7,3,4,8,6,5],
  [2,0,1,5,6,7,4,3,8], [0,2,1,8,7,6,3,4,5], [1,0,2,4,8,3,5,7,6],
  [2,1,0,6,5,8,7,4,3]
]);
const rectangle = r => r && [r.x,r.y,r.w,r.h].every(Number.isFinite) && r.w>0 && r.h>0;
const overlap = (a,b) => a.x<b.x+b.w-1e-8 && a.x+a.w>b.x+1e-8 && a.y<b.y+b.h-1e-8 && a.y+a.h>b.y+1e-8;
const contains = (a,b) => b.x>=a.x-1e-8 && b.y>=a.y-1e-8 && b.x+b.w<=a.x+a.w+1e-8 && b.y+b.h<=a.y+a.h+1e-8;

function build(type, number) {
  if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants) throw Error('Typologie ou variante industrielle invalide.');
  const profile=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10;
  const id=type+'-V'+String(number).padStart(2,'0'),W=RULES.plotWidthM+tier*RULES.widthStepM,H=RULES.plotLengthM+tier*RULES.lengthStepM;
  const plan={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'industrial',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    designAssumptions:[
      'Toutes les cotes sont des choix auteur originaux en mètres ; aucun relevé constructeur, rendement ou conformité industrielle revendiqué.',
      'Les parcours relient réception, préparation, production, finition et expédition à pied ; leur ordre décrit une intention de procédé, sans recette active.',
      'Les cours de chargement et voies sont des réservations auteur. Girations, charges, séparation des flux, sécurité industrielle et réseaux réels restent à qualifier.'
    ],
    configuration:{sizeTier:tier+1,arrangement:layout+1,process:profile.process},
    bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    processFlow:{scope:'author-process-intent-only',stages:[],links:[],recipesActive:false},
    operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
    unresolved:['implantation et réseaux du seed','machines et procédés réellement exécutables','intrants finis, énergie, eau, temps et sorties payés',
      'circulation et girations des véhicules','séparation des flux et sécurité industrielle','rencontres et occupation','art définitif','sauvegarde et qualification de campagne']};
  const nodes=new Map(),lanes=new Map(),entries=new Map();
  function node(key,x,y) {
    if(nodes.has(key))throw Error('Nœud industriel répété.');
    const value={id:id+':'+key,x,y,z:0};nodes.set(key,value);plan.network.nodes.push(value);return key;
  }
  function edge(from,to,mode='service') {
    if(!nodes.has(from)||!nodes.has(to)||from===to)throw Error('Liaison industrielle invalide.');
    plan.network.edges.push({id:id+':edge:'+plan.network.edges.length,from:nodes.get(from).id,to:nodes.get(to).id,
      widthM:mode==='service'?RULES.serviceRoadM:RULES.pathM,mode,level:0});
  }
  function lane(key,x,y) {
    if(!lanes.has(y))lanes.set(y,[]);
    const existing=lanes.get(y).find(k=>Math.abs(nodes.get(k).x-x)<1e-8);
    if(existing)return existing;
    node(key,x,y);lanes.get(y).push(key);return key;
  }
  function solid(key,kind,x,y,w,h,heightM) {
    const s={id:id+':structure:'+key,kind,x,y,w,h,maxHeightM:heightM,heightOrigin:'author-design',footprintOrigin:'author-design',
      interiorStatus:'closed-equipment',lootAssigned:false,utilityConnected:false};plan.structures.push(s);return s;
  }
  function area(key,kind,name,x,y,w,h) {
    const a={id:id+':area:'+key,kind,name,x,y,w,h,level:0,walkable:true,origin:'author-design',lootAssigned:false,utilityConnected:false};plan.outdoorAreas.push(a);return a;
  }
  node('entrance',10,0);node('exit',W-10,H);
  const step=100+tier*6;
  for(let row=0;row<=3;row++) {
    const y=20+row*step,west='lane:'+row+':west',east='lane:'+row+':east';
    lane(west,10,y);lane(east,W-10,y);
    if(row){edge('lane:'+(row-1)+':west',west);edge('lane:'+(row-1)+':east',east);}
  }
  edge('entrance','lane:0:west');edge('lane:3:east','exit');
  plan.network.externalPorts.push({node:nodes.get('entrance').id,requires:'freight-road',connectedToWorld:false},
    {node:nodes.get('exit').id,requires:'freight-road',connectedToWorld:false});
  const t=RULES.fenceM,half=RULES.gateM/2;
  for(const [key,x,y,w,h] of [
    ['north-left',2,2,10-half-2,t],['north-right',10+half,2,W-2-10-half,t],
    ['south-left',2,H-2-t,W-10-half-2,t],['south-right',W-10+half,H-2-t,8-half,t],
    ['west',2,2+t,t,H-4-2*t],['east',W-2-t,2+t,t,H-4-2*t]
  ])solid('fence:'+key,'site-fence',x,y,w,h,1.8);
  const facilities=[
    {role:'office',kind:'administration',name:'Accueil et administration',w:26,h:24,height:3.8,rooms:['accueil','bureau exploitation','réunion équipe','archives']},
    {role:'welfare',kind:'staff-welfare',name:'Locaux du personnel',w:30,h:30,height:3.6,rooms:['vestiaires A','vestiaires B','douches','sanitaires','réfectoire','cuisine']},
    {role:'maintenance',kind:'maintenance-workshop',name:'Maintenance',w:30,h:26,height:4.8,rooms:['atelier maintenance','réserve pièces détachées','local nettoyage','atelier outillage']},
    {role:'receiving',kind:'goods-receiving',name:'Réception des matières',w:36,h:30,height:5.2,rooms:profile.receiving},
    {...profile.preparation,role:'preparation'}, {...profile.production,role:'production'}, {...profile.finishing,role:'finishing'},
    {role:'dispatch',kind:'dispatch-stores',name:'Stockage et expédition',w:40,h:32,height:5.6,rooms:profile.dispatch},
    {role:'utilities',kind:'utility-house',name:'Locaux techniques',w:26,h:24,height:4.2,rooms:['tableau de distribution','local pompes','groupe de secours','contrôle énergie']}
  ];
  const columnW=(W-48)/3;
  for(let position=0;position<9;position++) {
    const definition=facilities[ARRANGEMENTS[layout][position]],row=Math.floor(position/3),column=position%3;
    const w=definition.w+tier*2,h=definition.h+tier*1.5,x=24+column*columnW+(columnW-w)/2,y=20+row*step+14;
    const face=(layout+row+column)%2?'south':'north',heightM=definition.height+tier*.25;
    const b={id:id+':building:'+definition.role,kind:definition.kind,name:definition.name,role:definition.role,
      x,y,w,h,rotationRad:0,entrySide:face,heightM,heightOrigin:'author-design',footprintOrigin:'author-design',
      levels:[0],rooms:[],portals:[],entry:{x:w/2,y:face==='north'?0:h,level:0,widthM:RULES.doorM}};
    const cw=RULES.corridorM,wall=RULES.wallM,rows=definition.rooms.length/2;
    const corridor={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:heightM-.4};
    b.rooms.push(corridor);
    for(let i=0;i<definition.rooms.length;i++) {
      const east=i%2===1,band=Math.floor(i/2);
      const room={id:b.id+':room:'+i,name:definition.rooms[i],x:east?(w+cw)/2+wall:wall,y:band*h/rows+wall,
        w:(w-cw)/2-2*wall,h:h/rows-2*wall,level:0,clearHeightM:heightM-.4};
      b.rooms.push(room);b.portals.push({id:room.id+':door',from:corridor.id,to:room.id,
        x:east?corridor.x+cw:corridor.x,y:room.y+room.h/2,widthM:RULES.doorM,wallGapM:wall,axis:'y'});
    }
    plan.buildings.push(b);
    const roadY=20+(row+(face==='south'?1:0))*step,approach=lane('building:'+definition.role+':approach',x+w/2,roadY);
    const entry=node('building:'+definition.role+':entry',x+w/2,y+b.entry.y);edge(approach,entry,'pedestrian');
    entries.set(definition.role,nodes.get(entry).id);
    if(['receiving','dispatch'].includes(definition.role)) {
      area(definition.role+':loading','loading-court',definition.role==='receiving'?'Cour de réception réservée':'Cour d’expédition réservée',
        x-2,face==='north'?y-10:y+h+2,w+4,8);
    }
  }
  let equipmentX=40;
  for(let i=0;i<profile.equipment.length;i++) {
    const [kind,w,h,heightM]=profile.equipment[i],y=H-20;
    solid('equipment:'+i,kind,equipmentX,y,w,h,heightM);
    const approach=lane('equipment:'+i+':approach',equipmentX+w/2,20+3*step);
    const stop=node('equipment:'+i+':stop',equipmentX+w/2,y-1);edge(approach,stop,'pedestrian');equipmentX+=48;
  }
  for(const [index,kind,name] of [[0,'material-holding','Aire matières en attente'],[1,'waste-holding','Aire déchets de procédé']]) {
    plan.reservedAreas.push({id:id+':reserve:'+kind,kind,name,x:W-86+index*34,y:H-20,w:24,h:12,level:0,
      origin:'author-design',lootAssigned:false,utilityConnected:false});
  }
  // Sort junctions before adding lanes: process routes use the same connected
  // physical network that the collision audit checks, not an illustrative arrow.
  for(const keys of lanes.values()) {
    keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);
    for(let i=1;i<keys.length;i++)edge(keys[i-1],keys[i]);
  }
  const adjacent=new Map(plan.network.nodes.map(n=>[n.id,[]]));
  for(const e of plan.network.edges){adjacent.get(e.from).push(e.to);adjacent.get(e.to).push(e.from);}
  function route(from,to) {
    const previous=new Map([[from,null]]),queue=[from];
    for(let i=0;i<queue.length&&!previous.has(to);i++)for(const next of adjacent.get(queue[i])) {
      if(previous.has(next))continue;previous.set(next,queue[i]);queue.push(next);
    }
    if(!previous.has(to))throw Error('Flux industriel sans parcours physique.');
    const result=[];for(let at=to;at!==null;at=previous.get(at))result.push(at);return result.reverse();
  }
  plan.processFlow.stages=PROCESS_ROLES.map((role,index)=>({order:index+1,role,building:id+':building:'+role,entryNode:entries.get(role)}));
  for(let i=1;i<plan.processFlow.stages.length;i++) {
    const from=plan.processFlow.stages[i-1],to=plan.processFlow.stages[i];
    plan.processFlow.links.push({from:from.building,to:to.building,route:route(from.entryNode,to.entryNode),mode:'pedestrian-inspection',operational:false});
  }
  plan.maxHeightM=Math.max(...plan.buildings.map(b=>b.heightM),...plan.structures.map(s=>s.maxHeightM));
  return freeze(plan);
}

function audit(plan) {
  const base=Reference.audit(plan),errors=[...base.errors],fail=code=>errors.push(code);
  try {
    if(!TYPES.includes(plan.type)||!Number.isInteger(plan.number)||plan.number<1||plan.number>RULES.variants||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0'))fail('industrial-identity');
    if(plan.sourceIds.length!==0||plan.heightOrigin!=='author-design'||!plan.designAssumptions.some(s=>s.includes('choix auteur')))fail('industrial-provenance');
    if(!Array.isArray(plan.outdoorAreas)||plan.outdoorAreas.length!==2||plan.buildings.length!==9)fail('industrial-programme');
    const solids=[...plan.buildings,...plan.structures],ids=new Set([...solids,...plan.reservedAreas,...plan.network.nodes,...plan.network.edges].map(v=>v.id));
    for(const area of plan.outdoorAreas) {
      if(!rectangle(area)||!contains(plan.bounds,area)||ids.has(area.id)||area.kind!=='loading-court'||area.level!==0||area.walkable!==true||area.origin!=='author-design')fail('industrial-loading-court');
      ids.add(area.id);if(solids.some(s=>overlap(s,area)))fail('industrial-loading-obstacle');
    }
    const roles=['office','welfare','maintenance',...PROCESS_ROLES,'utilities'];
    if(new Set(plan.buildings.map(b=>b.role)).size!==roles.length||plan.buildings.some(b=>!roles.includes(b.role)))fail('industrial-building-roles');
    const f=plan.processFlow;
    if(f.scope!=='author-process-intent-only'||f.recipesActive!==false||f.stages.length!==5||f.links.length!==4)fail('industrial-flow-scope');
    const nodes=new Map(plan.network.nodes.map(n=>[n.id,n]));
    for(let i=0;i<f.stages.length;i++) {
      const stage=f.stages[i],b=plan.buildings.find(b=>b.id===stage.building),n=nodes.get(stage.entryNode);
      if(stage.order!==i+1||stage.role!==PROCESS_ROLES[i]||!b||b.role!==stage.role||!n||Math.abs(n.x-b.x-b.entry.x)>1e-8||Math.abs(n.y-b.y-b.entry.y)>1e-8)fail('industrial-flow-stage');
    }
    for(let i=0;i<f.links.length;i++) {
      const link=f.links[i],from=f.stages[i],to=f.stages[i+1];
      if(link.from!==from.building||link.to!==to.building||link.mode!=='pedestrian-inspection'||link.operational!==false||
        !Array.isArray(link.route)||link.route.length<2||link.route[0]!==from.entryNode||link.route.at(-1)!==to.entryNode||new Set(link.route).size!==link.route.length) {fail('industrial-flow-route');continue;}
      for(let n=1;n<link.route.length;n++)if(!plan.network.edges.some(e=>e.from===link.route[n-1]&&e.to===link.route[n]||e.to===link.route[n-1]&&e.from===link.route[n]))fail('industrial-flow-route');
    }
    for(const s of plan.structures)if(!Number.isFinite(s.maxHeightM)||s.maxHeightM<=0||s.maxHeightM>plan.maxHeightM||s.heightOrigin!=='author-design')fail('industrial-equipment-height');
    for(const s of [...plan.structures,...plan.reservedAreas,...plan.outdoorAreas])if(s.lootAssigned!==false||s.utilityConnected!==false||Object.hasOwn(s,'amount')||Object.hasOwn(s,'resource'))fail('false-industrial-stock-or-service');
    const operationKeys=['lootContainersCreated','connectedServices','productionRecipes','outputCreated'];
    if(JSON.stringify(Object.keys(plan.operations).sort())!==JSON.stringify([...operationKeys].sort())||operationKeys.some(k=>plan.operations[k]!==0))fail('false-industrial-production');
  } catch {fail('industrial-schema');}
  return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
function auditAll() {
  const records=[];
  for(const type of TYPES)for(let n=1;n<=RULES.variants;n++) {
    const p=build(type,n),check=audit(p);if(!check.ok)throw Error(p.id+': '+check.errors.join(', '));
    records.push({id:p.id,type,widthM:p.bounds.w,lengthM:p.bounds.h,heightM:p.maxHeightM,heightOrigin:p.heightOrigin,...check});
  }
  return {schemaVersion:1,scope:'industrial-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
// END AUTHOR CORE
if (require.main === module) console.log(JSON.stringify({types:TYPES,plans:TYPES.length*50}));
module.exports={RULES,PROFILES,TYPES,build,audit,auditAll};
