'use strict';
/* Authoring input only. No campaign installer, randomness, inventory or save API. */
const fs = require('node:fs');
const path = require('node:path');
const Reference = require('./codex-world-foundations2026.cjs');

// BEGIN AUTHOR CORE
const RULES = Object.freeze({version: 1, variants: 50, wallM: .2, corridorM: 1.2,
  doorM: 1.1, pathM: 1.2, serviceRoadM: 5, fenceM: .15, plotGateM: 2,
  streetStartM: 36, plotFrontM: 6, streetGapM: 10});
const TYPES = Object.freeze(['EXT-MONDE-T045', 'EXT-MONDE-T046', 'EXT-MONDE-T047', 'EXT-MONDE-T048']);
const LAYOUTS = Object.freeze([
  {name:'deux rangées courtes', columns:2, rows:2, stagger:0, empty:[]},
  {name:'deux rangées familiales', columns:3, rows:2, stagger:0, empty:[]},
  {name:'deux longues allées', columns:4, rows:2, stagger:0, empty:[]},
  {name:'petite allée en boucle', columns:3, rows:1, stagger:0, empty:[]},
  {name:'allée résidentielle étendue', columns:4, rows:1, stagger:0, empty:[]},
  {name:'trois allées courtes', columns:2, rows:3, stagger:1.5, empty:[]},
  {name:'trois allées décalées', columns:3, rows:3, stagger:2.5, empty:[]},
  {name:'deux allées avec clairière', columns:4, rows:2, stagger:1, empty:[5]},
  {name:'rangée interrompue et jardin commun', columns:3, rows:2, stagger:2, empty:[1]},
  {name:'trois allées avec deux lots libres', columns:4, rows:3, stagger:3, empty:[2,9]}
].map(v => Object.freeze({...v, empty:Object.freeze(v.empty)})));
const PROFILES = Object.freeze({
  'EXT-MONDE-T045':Object.freeze({name:'Parc résidentiel de mobil-homes', dwelling:'mobile-home', pool:true,
    common:Object.freeze(['club-house','cuisine commune','atelier entretien','tableau de distribution'])}),
  'EXT-MONDE-T046':Object.freeze({name:'Camping caravanes', dwelling:'caravan', pool:true,
    common:Object.freeze(['réfectoire','cuisine commune','atelier maintenance','réserve sèche'])}),
  'EXT-MONDE-T047':Object.freeze({name:'Camp de travailleurs', dwelling:'worker-lodge', pool:false,
    common:Object.freeze(['réfectoire','cuisine','atelier','réserve sèche','infirmerie','vestiaires'])}),
  'EXT-MONDE-T048':Object.freeze({name:'Parc de caravanes abandonné', dwelling:'abandoned-caravan', pool:false,
    common:Object.freeze(['ancien club-house','atelier de récupération','réserve évacuée','poste de garde'])})
});
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const overlap = (a,b) => a.x < b.x+b.w-1e-8 && a.x+a.w > b.x+1e-8 && a.y < b.y+b.h-1e-8 && a.y+a.h > b.y+1e-8;
const contains = (a,b) => b.x >= a.x-1e-8 && b.y >= a.y-1e-8 && b.x+b.w <= a.x+a.w+1e-8 && b.y+b.h <= a.y+a.h+1e-8;
const rectangle = v => v && [v.x,v.y,v.w,v.h].every(Number.isFinite) && v.w>0 && v.h>0;

function build(type, number) {
  if (!TYPES.includes(type) || !Number.isInteger(number) || number < 1 || number > RULES.variants) throw Error('Typologie ou variante résidentielle invalide.');
  const profile = PROFILES[type], group = Math.floor((number-1)/10), layoutIndex = (number-1)%10, layout = LAYOUTS[layoutIndex];
  const id = type+'-V'+String(number).padStart(2,'0'), plotW = 22+group, plotH = 28+group*2;
  const width = Math.max(118,50+layout.columns*plotW), lastRoadY = RULES.streetStartM+layout.rows*(plotH+RULES.streetGapM), height = lastRoadY+10;
  const model = {id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    designAssumptions:[
      'Toutes les cotes sont des choix auteur originaux en mètres, sans relevé de constructeur ni conformité de bâtiment revendiquée.',
      'Les logements visitables sont des modules résidentiels élargis. Les caravanes tractables étroites conservent une coque fermée à leur propre gabarit.',
      'Les routes sont des réservations géométriques : le parcours inspecté reste piéton et ne certifie pas les girations des véhicules.'
    ],
    bounds:{x:0,y:0,w:width,h:height},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    composition:{layout:layout.name,layoutIndex,dimensionGroup:group+1,plotWidthM:plotW,plotDepthM:plotH,parcels:[]},
    unresolved:['implantation et raccord réel au seed','eau potable, assainissement et énergie','budgets finis de butin','occupation et rencontres',
      'intérieurs des caravanes tractables et abris fermés','navigation et giration des véhicules','art définitif','sauvegarde et qualification de campagne']};
  const nodes = new Map();
  function node(key,x,y) {
    if (nodes.has(key)) throw Error('Borne résidentielle répétée.');
    const value={id:id+':'+key,x,y,z:0};nodes.set(key,value);model.network.nodes.push(value);return key;
  }
  function edge(from,to,mode='pedestrian') {
    if (!nodes.has(from)||!nodes.has(to)||from===to) throw Error('Liaison résidentielle invalide.');
    model.network.edges.push({id:id+':edge:'+model.network.edges.length,from:nodes.get(from).id,to:nodes.get(to).id,
      widthM:mode==='service'?RULES.serviceRoadM:RULES.pathM,mode,level:0});
  }
  function solid(key,kind,x,y,w,h,heightM=1.2,extra={}) {
    const value={id:id+':'+key,kind,x,y,w,h,maxHeightM:heightM,heightOrigin:'author-design',footprintOrigin:'author-design',
      interiorStatus:'not-built',lootAssigned:false,utilityConnected:false,...extra};
    model.structures.push(value);return value;
  }
  function surface(key,kind,name,x,y,w,h) {
    model.outdoorAreas.push({id:id+':'+key,kind,name,x,y,w,h,level:0,walkable:true,origin:'author-design'});
  }
  function reserve(key,kind,name,x,y,w,h) {
    model.reservedAreas.push({id:id+':'+key,kind,name,x,y,w,h,level:0,origin:'author-design',lootAssigned:false,utilityConnected:false});
  }
  function fence(key,box,gateX,gateWidth=RULES.plotGateM,backGateX=null) {
    const t=RULES.fenceM;
    const segment=(suffix,x,y,w,h)=>{if(w>1e-8&&h>1e-8)solid(key+':'+suffix,'fence',x,y,w,h,1.2,{material:'aged-timber-or-mesh'});};
    segment('north-left',box.x,box.y,gateX-gateWidth/2-box.x,t);
    segment('north-right',gateX+gateWidth/2,box.y,box.x+box.w-gateX-gateWidth/2,t);
    segment('west',box.x,box.y+t,t,box.h-2*t);
    segment('east',box.x+box.w-t,box.y+t,t,box.h-2*t);
    if(backGateX===null)segment('south',box.x,box.y+box.h-t,box.w,t);
    else {
      segment('south-left',box.x,box.y+box.h-t,backGateX-gateWidth/2-box.x,t);
      segment('south-right',backGateX+gateWidth/2,box.y+box.h-t,box.x+box.w-backGateX-gateWidth/2,t);
    }
  }
  function building(key,kind,x,y,w,h,names,entrySide='north') {
    const t=RULES.wallM,cw=RULES.corridorM,rows=Math.ceil(names.length/2),clearHeightM=kind==='worker-lodge'?2.65:2.5;
    // The fixed residential modules contain a complete family programme. Give
    // the living room and kitchen their own deeper day zone instead of making
    // every room an equally small slice and refusing full-size equipment.
    const rowCuts=kind==='mobile-home'?[0,h*.44,h*.72,h]:null;
    const b={id:id+':'+key,kind,x,y,w,h,rotationRad:0,entrySide,heightM:kind==='worker-lodge'?3.4:3.2,
      heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],
      entry:{x:w/2,y:entrySide==='north'?0:h,level:0,widthM:RULES.doorM}};
    const corridor={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM};
    b.rooms.push(corridor);
    for(let index=0;index<names.length;index++) {
      const east=index%2===1,row=Math.floor(index/2),rw=(w-cw)/2-2*t,rh=(rowCuts?rowCuts[row+1]-rowCuts[row]:h/rows)-2*t;
      const r={id:b.id+':room:'+index,name:names[index],x:east?(w+cw)/2+t:t,y:(rowCuts?rowCuts[row]:row*h/rows)+t,w:rw,h:rh,level:0,clearHeightM,slots:[]};
      b.rooms.push(r);b.portals.push({id:r.id+':door',from:corridor.id,to:r.id,x:east?corridor.x+cw:corridor.x,
        y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:t,axis:'y'});
    }
    model.buildings.push(b);return b;
  }

  // A connected perimeter loop reaches every street without crossing any plot.
  node('entrance',8,0);node('front-west',8,6);node('front-east',width-8,6);
  edge('entrance','front-west','service');edge('front-west','front-east','service');
  model.network.externalPorts.push({node:nodes.get('entrance').id,requires:'local-road',connectedToWorld:false});
  let west='front-west',east='front-east';
  for(let row=0;row<=layout.rows;row++) {
    const y=RULES.streetStartM+row*(plotH+RULES.streetGapM),w='street:'+row+':west',e='street:'+row+':east';
    node(w,8,y);node(e,width-8,y);edge(west,w,'service');edge(east,e,'service');edge(w,e,'service');west=w;east=e;
  }
  node('service-exit',width-8,height);edge(east,'service-exit','service');
  model.network.externalPorts.push({node:nodes.get('service-exit').id,requires:'service-road',connectedToWorld:false});
  fence('site-fence',{x:2,y:2,w:width-4,h:height-4},8,6,width-8);

  const common=[
    ['welcome','reception',22,12,12,12,['accueil','bureau exploitation','local nettoyage','réserve accueil']],
    ['hygiene','sanitary',47,12,14,12,['sanitaires A','douches A','buanderie','réserve hygiène']],
    ['common','common-services',72,12,16,profile.common.length>4?14:12,profile.common]
  ];
  for(const[key,kind,x,y,w,h,names]of common) {
    const b=building(key,kind,x,y,w,h,names),junction=key+':junction',entry=key+':entry';
    node(junction,b.x+b.w/2,6);node(entry,b.x+b.w/2,b.y);edge('front-west',junction,'service');edge(junction,entry);
  }
  surface('communal-court','court','Cour commune et accès de service',22,28,width-44,4);
  for(let row=0;row<layout.rows;row++)for(let column=0;column<layout.columns;column++) {
    const index=row*layout.columns+column,streetY=RULES.streetStartM+row*(plotH+RULES.streetGapM);
    const px=22+column*plotW+(row%2?layout.stagger:0),py=streetY+RULES.plotFrontM,key='parcel:'+index;
    if(layout.empty.includes(index)) {
      reserve(key+':common-garden','communal-garden','Jardin commun dans une parcelle libre',px+2,py+2,plotW-4,plotH-4);
      continue;
    }
    const box={x:px,y:py,w:plotW-1,h:plotH},gateX=px+(plotW-1)/2;
    const isShell=(type==='EXT-MONDE-T046'&&index!==0)||(type==='EXT-MONDE-T048'&&index%3!==0);
    const bw=isShell?2.4+group*.05:type==='EXT-MONDE-T047'?9.6+group*.3:9.6+group*.3+(index%2)*.2;
    const bh=isShell?6.2+group*.6:type==='EXT-MONDE-T047'?14.4+group*.2:14.4+group*.5+(index%3)*.3;
    const bx=gateX-bw/2,by=py+5,parcelId=id+':'+key;
    fence(key+':fence',box,gateX);
    const junction=key+':junction',gate=key+':gate',front=key+':front',side=key+':side',rear=key+':rear',back=key+':back',garden=key+':garden-access';
    node(junction,gateX,streetY);node(gate,gateX,py);node(front,gateX,py+2);
    edge('street:'+row+':west',junction,'service');edge(junction,gate);edge(gate,front);
    node(side,bx-1.2,py+2);node(rear,bx-1.2,by+bh+1.2);node(back,gateX,by+bh+1.2);node(garden,gateX,py+plotH-6.5);
    edge(front,side);edge(side,rear);edge(rear,back);edge(back,garden);
    let unit;
    if(isShell) {
      unit=solid(key+':caravan',type==='EXT-MONDE-T048'?'abandoned-caravan':'touring-caravan',bx,by,bw,bh,2.8,
        {parcelId,interiorStatus:'closed-towable-interior-not-built',condition:type==='EXT-MONDE-T048'?'evacuated':'unoccupied'});
      const approach=key+':door-approach';node(approach,bx-.6,by+bh/2);
      const turn=key+':door-turn';node(turn,bx-1.2,by+bh/2);edge(side,turn);edge(turn,approach);
    } else {
      const rooms=type==='EXT-MONDE-T047'?['cabine équipe A','cabine équipe B','sanitaires','douches','cabine équipe C','réserve individuelle']:
        ['salon familial','cuisine','cabine parents','cabine enfants','sanitaires','buanderie'];
      unit=building(key+':home',type==='EXT-MONDE-T047'?'worker-lodge':'mobile-home',bx,by,bw,bh,rooms);
      const entry=key+':home-entry';node(entry,gateX,by);edge(front,entry);
    }
    const gardenKinds=['vegetable-garden','flower-garden','gravel-garden','herb-garden','meadow-garden'];
    const gardenNames=['Potager familial','Jardin fleuri','Jardin minéral','Carré aromatique','Jardin en herbe'];
    const gardenIndex=(group+index+layoutIndex)%gardenKinds.length;
    reserve(key+':garden',gardenKinds[gardenIndex],gardenNames[gardenIndex],px+6,py+plotH-5.3,plotW-9,4);
    surface(key+':terrace','terrace','Terrasse latérale de la parcelle',px+1.2,by+.4,bx-px-2,Math.min(6,bh-1));
    surface(key+':parking','parking','Emplacement de stationnement réservé',bx+bw+1.5,by+2,2.6,5.2);
    solid(key+':shed','garden-shed',px+1.3,py+plotH-4.8,3.4,3.3,2.4,{parcelId});
    if((group+index)%2===0)solid(key+':water-barrel','rain-barrel',bx+bw+1.4,by+.5,.7,.7,1,{parcelId});
    if((layoutIndex+index)%3===0)solid(key+':compost','compost-bin',px+plotW-3,by+bh+1,1,1,1,{parcelId});
    model.composition.parcels.push({id:parcelId,bounds:box,unit:unit.id,gate:{x:gateX,y:py,widthM:RULES.plotGateM},
      garden:id+':'+key+':garden',interiorVisit:!isShell,utilitiesConnected:false});
  }
  const pool=profile.pool&&group>=2&&layoutIndex%2===0;
  if(pool) {
    const gridRight=22+layout.columns*plotW+layout.stagger,px=gridRight+3,py=RULES.streetStartM+RULES.plotFrontM+8,center=px+4;
    solid('communal-pool','closed-pool',px,py,8,12,.4,{depthM:1.4,walkable:false,waterPotable:false,interiorStatus:'water-basin-closed'});
    fence('pool-fence',{x:px-1.5,y:py-1.5,w:11,h:15},center,1.6);
    node('pool-junction',center,RULES.streetStartM);node('pool-gate',center,py-1.5);node('pool-approach',center,py-.6);
    edge('street:0:west','pool-junction','service');edge('pool-junction','pool-gate');edge('pool-gate','pool-approach');
  }
  model.maxHeightM=Math.max(...model.buildings.map(b=>b.heightM),...model.structures.map(s=>s.maxHeightM));
  return freeze(model);
}

function audit(plan) {
  const base=Reference.audit(plan),errors=[...base.errors],fail=code=>errors.push(code);
  try {
    if(!TYPES.includes(plan.type)||!Number.isInteger(plan.number)||plan.number<1||plan.number>RULES.variants||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0'))fail('residential-identity');
    if(plan.sourceIds.length!==0||!plan.designAssumptions.some(s=>s.includes('choix auteur')))fail('residential-provenance');
    if(!Array.isArray(plan.outdoorAreas)||!Array.isArray(plan.composition?.parcels)||plan.composition.parcels.length<3)throw Error('schema');
    const solids=[...plan.buildings,...plan.structures],ids=new Set([...solids,...plan.reservedAreas,...plan.network.nodes,...plan.network.edges].map(x=>x.id));
    for(const area of plan.outdoorAreas) {
      if(!rectangle(area)||ids.has(area.id)||area.level!==0||area.walkable!==true||area.origin!=='author-design'||!area.name||!contains(plan.bounds,area))fail('residential-outdoor-area');
      ids.add(area.id);if(solids.some(s=>overlap(s,area)))fail('residential-outdoor-obstacle');
    }
    const parcelIds=new Set(),unitIds=new Set(),gardenIds=new Set();
    for(const parcel of plan.composition.parcels) {
      if(!parcel.id||parcelIds.has(parcel.id)||unitIds.has(parcel.unit)||gardenIds.has(parcel.garden))fail('residential-duplicate-parcel');
      parcelIds.add(parcel.id);unitIds.add(parcel.unit);gardenIds.add(parcel.garden);
      const unit=solids.find(s=>s.id===parcel.unit),garden=plan.reservedAreas.find(s=>s.id===parcel.garden);
      if(!rectangle(parcel.bounds)||!contains(plan.bounds,parcel.bounds)||!unit||!garden||!contains(parcel.bounds,unit)||!contains(parcel.bounds,garden)||parcel.utilitiesConnected!==false)fail('residential-parcel');
      if(parcel.gate?.widthM!==RULES.plotGateM||parcel.gate?.y!==parcel.bounds.y||!Number.isFinite(parcel.gate?.x)||
        parcel.gate.x-RULES.plotGateM/2<parcel.bounds.x||parcel.gate.x+RULES.plotGateM/2>parcel.bounds.x+parcel.bounds.w)fail('residential-gate');
      if(parcel.interiorVisit!==plan.buildings.some(b=>b.id===parcel.unit))fail('false-residential-interior');
      if(!plan.network.nodes.some(n=>Math.abs(n.x-parcel.gate.x)<1e-8&&Math.abs(n.y-parcel.gate.y)<1e-8))fail('residential-gate-disconnected');
      if(solids.some(s=>overlap(s,{x:parcel.gate.x-RULES.pathM/2,y:parcel.gate.y-.4,w:RULES.pathM,h:.8})))fail('residential-gate-obstructed');
    }
    if(plan.structures.some(s=>s.lootAssigned!==false||s.utilityConnected!==false))fail('false-residential-stock-or-service');
    const pools=plan.structures.filter(s=>s.kind==='closed-pool');
    if(pools.length>1||pools.length&&!PROFILES[plan.type].pool||pools.some(s=>s.walkable!==false||s.waterPotable!==false))fail('false-residential-pool');
    if(plan.reservedAreas.some(a=>a.lootAssigned!==false||a.utilityConnected!==false))fail('false-residential-garden-yield');
  } catch {fail('residential-schema');}
  return {...base,ok:errors.length===0,errors:[...new Set(errors)],parcels:plan?.composition?.parcels?.length||0};
}
function auditAll() {
  const records=[];
  for(const type of TYPES)for(let number=1;number<=RULES.variants;number++) {
    const plan=build(type,number),check=audit(plan);if(!check.ok)throw Error(plan.id+': '+check.errors.join(', '));
    records.push({id:plan.id,type,widthM:plan.bounds.w,lengthM:plan.bounds.h,heightM:plan.maxHeightM,heightOrigin:plan.heightOrigin,...check});
  }
  return {schemaVersion:1,scope:'residential-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
// END AUTHOR CORE

if(require.main===module) {
  const out=path.resolve(process.argv[2]||'artifacts/qa/codex-residential2026'),report=auditAll();
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({typologies:report.typologies,variants:report.variants,playable:0,output:out}));
}
module.exports={RULES,TYPES,LAYOUTS,PROFILES,build,audit,auditAll};
