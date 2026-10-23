'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1, variants:50, corridorM:2, wallM:.2,
  doorM:1.2, pathM:1.4, roadM:4.5, shoreClearanceM:6, waterBandM:40,
  plotWidthM:200, plotLengthM:242, widthStepM:16, lengthStepM:14, rowStepM:56});
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const PROFILES = freeze({
  'EXT-MONDE-T001': {name:'Base nautique lacustre', activity:'accueil, formation et entretien nautique',
    shoreUse:'Préparation sèche des embarcations, sans mise à l’eau active',
    facilities:[
      ['welcome','accueil-nautique',26,22,3.4,['accueil','bureau encadrement','réunion formation','réserve documents']],
      ['changing','vestiaires-nautiques',28,26,3.2,['vestiaires A','vestiaires B','douches A','douches B','sanitaires A','sanitaires B']],
      ['boat-store','hangar-embarcations',40,30,5.4,['stockage embarcations légères','stockage avirons','réserve voiles','atelier entretien gréement']],
      ['workshop','atelier-nautique',32,26,4.2,['atelier réparation embarcations','atelier entretien moteurs','réserve pièces détachées','local nettoyage']],
      ['safety','secours-de-rive',26,24,3.5,['poste de contrôle rive','salle de soins','réserve médicale','bureau météo']],
      ['club','club-nautique',30,26,3.6,['club-house','cuisine','réserve sèche','sanitaires']]
    ]},
  'EXT-MONDE-T002': {name:'Village de pêche lacustre', activity:'habitat de pêche et préparation de prises',
    shoreUse:'Cour de filets et retour de pêche, sans poisson ni navigation créé',
    facilities:[
      ['fish-house','maison-peche-A',28,24,3.4,['chambre parentale','chambre enfants','séjour','cuisine']],
      ['family-house','maison-peche-B',28,26,3.4,['chambre parentale','chambre enfants','salon','sanitaires']],
      ['landing','halle-peche',38,28,4.6,['atelier préparation filets','conditionnement de pêche','stockage réfrigéré prises','réserve caisses']],
      ['repair','atelier-filets',30,26,3.8,['atelier réparation filets','atelier entretien barques','réserve outillage','réserve cordages']],
      ['commons','maison-commune',28,26,3.5,['accueil','bureau communal','réunion équipe','salle de soins']],
      ['provisions','epicerie-village',32,26,3.8,['réception','réserve alimentaire','stockage réfrigéré denrées','local nettoyage']]
    ]},
  'EXT-MONDE-T003': {name:'Station limnologique', activity:'prélèvements, préparation et observation du lac',
    shoreUse:'Point sec de préparation des prélèvements ; prélèvements non simulés',
    facilities:[
      ['welcome','accueil-recherche',28,24,3.6,['accueil','bureau station','réunion scientifique','archives']],
      ['sampling','preparation-echantillons',34,28,4,['atelier préparation échantillons','stockage réfrigéré échantillons','réserve flacons','local nettoyage']],
      ['analysis','analyse-limnologique',36,28,4,['bureau analyse eau','contrôle échantillons','observation limnologique','archives mesures']],
      ['technical','maintenance-terrain',32,26,4.2,['atelier instrumentation','local pompes','réserve matériel de terrain','tableau de distribution']],
      ['accommodation','hebergement-chercheurs',28,26,3.4,['chambre chercheurs A','chambre chercheurs B','cuisine','sanitaires']],
      ['welfare','retour-terrain',30,26,3.5,['vestiaires terrain','douches','salle de soins','réfectoire']]
    ]},
  'EXT-MONDE-T004': {name:'Camping de rive', activity:'accueil de séjour, hébergement et entretien de berge',
    shoreUse:'Promenade sèche séparée de l’eau ; baignade et pontons non disponibles',
    facilities:[
      ['welcome','accueil-camping',26,22,3.2,['accueil','bureau camping','consignes','réserve documents']],
      ['sanitary','sanitaires-camping',30,28,3.2,['sanitaires A','sanitaires B','douches A','douches B','buanderie','local nettoyage']],
      ['lodge-a','chalet-familial-A',28,24,3.4,['chambre parentale','chambre enfants','séjour','cuisine']],
      ['lodge-b','chalet-familial-B',28,26,3.4,['chambre parentale','chambre enfants','salon','sanitaires']],
      ['club','salle-commune-camping',30,26,3.5,['club-house','cuisine','réserve alimentaire','réfectoire']],
      ['service','entretien-camping',28,24,3.8,['atelier entretien','réserve mobilier','salle de soins','bureau surveillance']]
    ]}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS = freeze([
  [0,1,2,3,4,5], [1,0,3,2,5,4], [0,4,2,5,1,3], [4,0,5,2,3,1], [1,5,3,4,0,2],
  [5,1,4,3,2,0], [0,2,1,4,3,5], [2,0,4,1,5,3], [3,5,0,2,4,1], [5,3,2,0,1,4]
]);
const overlap = (a,b) => a.x<b.x+b.w-1e-8 && a.x+a.w>b.x+1e-8 && a.y<b.y+b.h-1e-8 && a.y+a.h>b.y+1e-8;
const rectangle = r => r && [r.x,r.y,r.w,r.h].every(Number.isFinite) && r.w>0 && r.h>0;
const contains = (a,b) => b.x>=a.x-1e-8 && b.y>=a.y-1e-8 && b.x+b.w<=a.x+a.w+1e-8 && b.y+b.h<=a.y+a.h+1e-8;

function build(type, number) {
  if (!TYPES.includes(type) || !Number.isInteger(number) || number<1 || number>RULES.variants) throw Error('Typologie ou variante lacustre invalide.');
  const profile=PROFILES[type], tier=Math.floor((number-1)/10), layout=(number-1)%10;
  const id=type+'-V'+String(number).padStart(2,'0'), W=RULES.plotWidthM+tier*RULES.widthStepM,
    H=RULES.plotLengthM+tier*RULES.lengthStepM, waterY=H-RULES.waterBandM, shoreY=waterY-RULES.shoreClearanceM;
  const plan={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'lacustre',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    designAssumptions:[
      'Les emprises, pièces, hauteurs et espacements sont des choix auteur originaux en mètres ; aucun relevé réel ni conformité réglementaire revendiqué.',
      'La bande lacustre est une réservation fermée, jamais un sol de traversée. La promenade et les accès restent du côté sec de la berge.',
      'Le raccord au lac du seed, la profondeur, les pontons et la mise à l’eau restent à qualifier. Aucun chemin sur l’eau ou service actif n’est ajouté.'
    ], configuration:{sizeTier:tier+1,arrangement:layout+1,activity:profile.activity},
    bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    shoreline:{axis:'x',landSide:'north',waterSide:'south',waterY,depthM:null,waterKind:'freshwater-lake',
      connectedToSeed:false,walkableWater:false,boatNavigation:false,swimming:false,shoreUse:profile.shoreUse},
    operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
    unresolved:['implantation réelle sur la berge du seed','profondeur, quais, pontons et mise à l’eau',
      'navigation, baignade et collecte aquatique','butin fini, rencontres et occupation','services, eau et énergie',
      'graphismes définitifs et équipement spécialisé','persistance et qualification de campagne']};
  const nodes=new Map(),rows=new Map();
  function node(key,x,y) {
    if (nodes.has(key)) throw Error('Borne lacustre répétée.');
    const n={id:id+':'+key,x,y,z:0}; nodes.set(key,n); plan.network.nodes.push(n); return key;
  }
  function edge(from,to,mode='pedestrian') {
    if (!nodes.has(from)||!nodes.has(to)||from===to) throw Error('Liaison lacustre invalide.');
    plan.network.edges.push({id:id+':edge:'+plan.network.edges.length,from:nodes.get(from).id,to:nodes.get(to).id,
      widthM:mode==='service'?RULES.roadM:RULES.pathM,mode,level:0});
  }
  function junction(key,x,y) {
    if (!rows.has(y)) rows.set(y,[]);
    const existing=rows.get(y).find(k=>Math.abs(nodes.get(k).x-x)<1e-8);
    if (existing) return existing;
    node(key,x,y); rows.get(y).push(key); return key;
  }
  node('gate',8,0);
  plan.network.externalPorts.push({node:nodes.get('gate').id,requires:'local-road',connectedToWorld:false});
  for (let row=0;row<=3;row++) {
    const y=15+row*RULES.rowStepM;
    junction('lane:'+row+':west',8,y); junction('lane:'+row+':east',W-8,y);
    if (row) {edge('lane:'+(row-1)+':west','lane:'+row+':west','service');edge('lane:'+(row-1)+':east','lane:'+row+':east','service');}
  }
  edge('gate','lane:0:west','service');
  const columnW=(W-48)/2;
  for (let position=0;position<6;position++) {
    const d=profile.facilities[ARRANGEMENTS[layout][position]],row=Math.floor(position/2),column=position%2;
    const [role,kind,baseW,baseH,height,names]=d,w=baseW+tier*1.5,h=baseH+tier*.5;
    const x=24+column*columnW+(columnW-w)/2, y=27+row*RULES.rowStepM;
    const face=(layout+position)%2?'south':'north',heightM=height+tier*.15;
    const b={id:id+':building:'+role,role,kind,name:kind,x,y,w,h,rotationRad:0,entrySide:face,
      heightM,heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],
      entry:{x:w/2,y:face==='north'?0:h,level:0,widthM:RULES.doorM}};
    const cw=RULES.corridorM,t=RULES.wallM,bands=names.length/2;
    const corridor={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:heightM-.3};
    b.rooms.push(corridor);
    for (let i=0;i<names.length;i++) {
      const east=i%2===1,band=Math.floor(i/2),r={id:b.id+':room:'+i,name:names[i],
        x:east?(w+cw)/2+t:t,y:band*h/bands+t,w:(w-cw)/2-2*t,h:h/bands-2*t,level:0,clearHeightM:heightM-.3};
      b.rooms.push(r);b.portals.push({id:r.id+':door',from:corridor.id,to:r.id,
        x:east?corridor.x+cw:corridor.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:t,axis:'y'});
    }
    plan.buildings.push(b);
    const roadY=15+(row+(face==='south'?1:0))*RULES.rowStepM;
    const approach=junction(role+':approach',x+w/2,roadY),entry=node(role+':entry',x+w/2,y+b.entry.y);
    edge(approach,entry);
  }
  // This waterfront stops on dry ground. A closed rectangular reservation is
  // intentionally used instead of borrowing the site's ground as lake support.
  const west=node('shore:west',8,shoreY),east=node('shore:east',W-8,shoreY),centre=node('shore:stop',W/2,shoreY);
  edge('lane:3:west',west);edge('lane:3:east',east);edge(west,centre);edge(centre,east);
  for (const keys of rows.values()) {
    keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);
    for (let i=1;i<keys.length;i++) edge(keys[i-1],keys[i],'service');
  }
  plan.structures.push({id:id+':water',kind:'freshwater-reservation',name:'Lac — bande fermée non navigable',
    x:0,y:waterY,w:W,h:RULES.waterBandM,maxHeightM:.05,heightOrigin:'author-design',footprintOrigin:'author-design',
    interiorStatus:'closed-water-reservation',walkable:false,lootAssigned:false,utilityConnected:false});
  plan.outdoorAreas.push({id:id+':shore',kind:'dry-shore',name:'Promenade sèche de rive',
    x:4,y:shoreY-2,w:W-8,h:4,level:0,walkable:true,origin:'author-design',lootAssigned:false,utilityConnected:false});
  plan.reservedAreas.push({id:id+':launch-preparation',kind:'dry-launch-preparation',name:profile.shoreUse,
    x:W/2-12,y:waterY-3,w:24,h:2,level:0,walkable:true,origin:'author-design',lootAssigned:false,utilityConnected:false});
  plan.maxHeightM=Math.max(...plan.buildings.map(b=>b.heightM));
  return freeze(plan);
}

function audit(plan) {
  const base=Reference.audit(plan),errors=[...base.errors],fail=code=>errors.push(code);
  try {
    if (!TYPES.includes(plan.type)||!Number.isInteger(plan.number)||plan.number<1||plan.number>RULES.variants||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0')) fail('lacustre-identity');
    if (plan.sourceIds.length||plan.heightOrigin!=='author-design'||!plan.designAssumptions.some(s=>s.includes('choix auteur'))) fail('lacustre-provenance');
    if (plan.buildings.length!==6||new Set(plan.buildings.map(b=>b.role)).size!==6||plan.structures.length!==1||plan.outdoorAreas.length!==1||plan.reservedAreas.length!==1) fail('lacustre-programme');
    const s=plan.shoreline,water=plan.structures.find(v=>v.kind==='freshwater-reservation');
    if (!s||s.axis!=='x'||s.landSide!=='north'||s.waterSide!=='south'||s.depthM!==null||s.waterKind!=='freshwater-lake'||s.connectedToSeed!==false||s.walkableWater!==false||s.boatNavigation!==false||s.swimming!==false) fail('false-lacustre-water-service');
    if (!water||water.x!==0||water.w!==plan.bounds.w||water.y!==plan.bounds.h-RULES.waterBandM||water.h!==RULES.waterBandM||water.y!==s.waterY||water.walkable!==false||water.interiorStatus!=='closed-water-reservation') fail('lacustre-water-boundary');
    if (plan.network.nodes.some(n=>n.y>water.y-RULES.shoreClearanceM+1e-8)||plan.buildings.some(b=>b.y+b.h>=water.y-RULES.shoreClearanceM)) fail('lacustre-dry-clearance');
    for (const area of plan.outdoorAreas) {
      if (!rectangle(area)||!contains(plan.bounds,area)||area.kind!=='dry-shore'||area.level!==0||area.walkable!==true||area.y+area.h>water.y||plan.buildings.some(b=>overlap(b,area))) fail('lacustre-shore');
    }
    for (const object of [...plan.structures,...plan.reservedAreas,...plan.outdoorAreas]) {
      if (object.lootAssigned!==false||object.utilityConnected!==false||Object.hasOwn(object,'amount')||Object.hasOwn(object,'resource')) fail('false-lacustre-stock-or-service');
    }
    const keys=['lootContainersCreated','connectedServices','productionRecipes','outputCreated'];
    if (JSON.stringify(Object.keys(plan.operations).sort())!==JSON.stringify(keys.sort())||keys.some(k=>plan.operations[k]!==0)) fail('false-lacustre-production');
  } catch { fail('lacustre-schema'); }
  return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
function auditAll() {
  const records=[];
  for (const type of TYPES) for (let number=1;number<=RULES.variants;number++) {
    const plan=build(type,number),result=audit(plan);
    if (!result.ok) throw Error(plan.id+': '+result.errors.join(', '));
    records.push({id:plan.id,type,widthM:plan.bounds.w,lengthM:plan.bounds.h,heightM:plan.maxHeightM,...result});
  }
  return {schemaVersion:1,scope:'lacustre-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
// END AUTHOR CORE
if (require.main === module) console.log(JSON.stringify({types:TYPES,plans:TYPES.length*50}));
module.exports={RULES,PROFILES,TYPES,build,audit,auditAll};
