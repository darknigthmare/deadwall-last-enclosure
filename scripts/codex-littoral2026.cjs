'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,wallM:.2,corridorM:1.8,doorM:1.2,
  pathM:1.4,roadM:4.5,waterWidthM:48,shoreReserveM:22,plotWidthM:230,plotLengthM:270,
  widthStepM:16,lengthStepM:18,rowStepM:50});
const freeze = v => {if(v && typeof v==='object' && !Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const facility = (role,name,kind,w,h,height,rooms) => ({role,name,kind,w,h,height,rooms});
const dwelling = role => facility(role,'Logement côtier','coastal-house',12,12,3.2,
  ['chambre double','salon','cuisine','sanitaires']);
const PROFILES = freeze({
  'EXT-MONDE-T017': {name:'Phare et logements',intent:'Résidence de gardien, maintenance du feu et contrôle du littoral',
    facilities:[
      facility('watch','Poste de veille côtière','coast-watch',18,18,3.8,['bureau de veille','observation côtière','archives cartes','communications']),
      dwelling('keeper-house'),dwelling('relief-house'),
      facility('workshop','Atelier du phare','lighthouse-workshop',20,18,4.2,['atelier optique','atelier maintenance','réserve pièces détachées','local outillage']),
      facility('utilities','Alimentation du feu','lighthouse-power',18,16,3.8,['groupe de secours','tableau de distribution','local batteries','contrôle énergie']),
      facility('welcome','Accueil des visiteurs','lighthouse-reception',18,16,3.4,['accueil','archives historiques','sanitaires','bureau accueil']),
      facility('supplies','Réserves du poste','coastal-stores',18,16,3.6,['réserve alimentaire','stockage entretien','buanderie','réserve équipement']),
      facility('welfare','Relève et secours','coast-welfare',18,18,3.3,['salle de soins','repos équipe','vestiaires','douches'])],
    fixtures:[{role:'lighthouse',kind:'closed-lighthouse-tower',w:10,h:10,height:28,name:'Tour du phare fermée : escalier et lanterne non livrés'},
      {role:'signal',kind:'closed-signal-mast',w:3,h:3,height:12,name:'Mât de signalisation hors service'}],
    closedWork:['Escalier de la tour, lanterne, faisceau alimenté et maintenance du feu non réalisés.']},
  'EXT-MONDE-T018': {name:'Fête foraine portuaire',intent:'Accueil et services de fête installés sur un terre-plein de port',
    facilities:[
      facility('welcome','Billetterie et accueil','fair-ticket-office',18,16,3.2,['accueil','bureau billetterie','consignes','sanitaires']),
      facility('operations','Administration foraine','fair-management',18,18,3.4,['bureau exploitation','réunion équipe','archives','poste de contrôle']),
      facility('food','Restauration foraine','fair-food-house',24,20,3.6,['cuisine','réfectoire','réserve sèche','plonge']),
      facility('welfare','Personnel itinérant','fair-staff',20,18,3.3,['vestiaires','douches','repos équipe','sanitaires']),
      facility('workshop','Maintenance des attractions','fair-workshop',24,20,4.4,['atelier mécanique','local outillage','réserve pièces détachées','contrôle machines']),
      facility('first-aid','Secours et surveillance','fair-first-aid',18,18,3.3,['salle de soins','réserve médicale','poste de garde','bureau sécurité']),
      facility('stores','Réserves foraines','fair-stores',22,18,4,['stockage matériel','réserve comptoirs','réserve textile','bureau magasin']),
      facility('utilities','Services techniques','fair-utilities',18,16,3.8,['tableau de distribution','groupe de secours','local nettoyage','local pompes'])],
    fixtures:[{role:'wheel',kind:'closed-ferris-wheel',w:15,h:12,height:24,name:'Grande roue immobilisée, nacelles non accessibles'},
      {role:'carousel',kind:'closed-carousel',w:14,h:14,height:5,name:'Manège fermé, aucune animation ni embarquement'}],
    closedWork:['Attractions immobiles et fermées ; nacelles, cinématique, énergie et exploitation non réalisées.']},
  'EXT-MONDE-T019': {name:'Chantier naval côtier',intent:'Chaîne à terre de réparation navale avec cale fermée au bord de mer',
    facilities:[
      facility('welcome','Accueil et contrôle','yard-gatehouse',18,18,3.6,['accueil','bureau chantier','poste de garde','archives']),
      facility('design','Études et préparation','naval-design',22,20,3.8,['bureau études navales','réunion technique','archives cartes','contrôle qualité']),
      facility('hull','Atelier de coque','hull-workshop',32,26,7,['atelier chaudronnerie','atelier soudage','réserve tôles','local outillage']),
      facility('engines','Atelier des moteurs','naval-engine-shop',30,24,6,['atelier moteurs','contrôle mécanique','réserve pièces détachées','atelier outillage']),
      facility('joinery','Menuiserie et accastillage','naval-joinery',28,22,4.8,['atelier menuiserie','atelier accastillage','stockage bois','réserve quincaillerie']),
      facility('stores','Magasin du chantier','naval-stores',28,22,5,['stockage équipements navals','réserve cordages','bureau magasin','réserve composants']),
      facility('welfare','Locaux du personnel','yard-staff',24,20,3.4,['vestiaires','douches','réfectoire','cuisine']),
      facility('utilities','Services de cale','yard-utilities',22,20,4.2,['local pompes','tableau de distribution','groupe de secours','local nettoyage'])],
    fixtures:[{role:'slipway',kind:'closed-naval-slipway',w:16,h:30,height:2,name:'Cale condamnée, aucune mise à l’eau'},
      {role:'gantry',kind:'closed-yard-crane',w:12,h:10,height:18,name:'Portique immobilisé, domaine fermé'}],
    closedWork:['Cale, bassin et manutention navale fermés ; portique, navire, mécanique et mise à l’eau non réalisés.']},
  'EXT-MONDE-T020': {name:'Baie avec village côtier',intent:'Petit habitat de baie associé aux activités de pêche à terre',
    facilities:[
      dwelling('house-a'),dwelling('house-b'),dwelling('house-c'),
      facility('community','Maison commune du village','coastal-community',22,20,3.4,['accueil','réunion habitants','bureau communal','archives']),
      facility('fish','Préparation de la pêche','fish-handling-house',24,20,4,['conditionnement pêche','stockage réfrigéré','réserve emballages','local nettoyage']),
      facility('workshop','Atelier des pêcheurs','fishing-workshop',24,20,4.4,['atelier moteurs','atelier filets','réserve cordages','local outillage']),
      facility('food','Épicerie et salle commune','coastal-food-house',22,20,3.4,['réserve alimentaire','cuisine','réfectoire','salon commun']),
      facility('services','Hygiène et secours','coastal-services',20,18,3.3,['salle de soins','sanitaires','buanderie','local pompes'])],
    fixtures:[{role:'boat',kind:'closed-beached-fishing-boat',w:6,h:14,height:4,name:'Bateau échoué fermé, non pilotable'},
      {role:'net-drying',kind:'closed-net-drying-rack',w:10,h:8,height:2.6,name:'Séchoir de filets sans production'}],
    closedWork:['La baie reste une réserve d’eau rectangulaire auteur ; navigation, trait de côte naturel et pêche active non réalisés.']}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS = freeze([
  [0,1,2,3,4,5,6,7],[1,0,3,2,5,4,7,6],[2,3,0,1,6,7,4,5],[3,2,1,0,7,6,5,4],
  [0,2,4,6,1,3,5,7],[7,5,3,1,6,4,2,0],[4,5,6,7,0,1,2,3],[5,4,7,6,1,0,3,2],
  [6,7,4,5,2,3,0,1],[7,6,5,4,3,2,1,0]
]);
const overlaps=(a,b)=>a.x<b.x+b.w-1e-8&&a.x+a.w>b.x+1e-8&&a.y<b.y+b.h-1e-8&&a.y+a.h>b.y+1e-8;
function build(type,number) {
  if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie ou variante littorale invalide.');
  const profile=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10,id=type+'-V'+String(number).padStart(2,'0');
  const W=RULES.plotWidthM+tier*RULES.widthStepM,H=RULES.plotLengthM+tier*RULES.lengthStepM,dryWidth=W-RULES.waterWidthM-RULES.shoreReserveM;
  const p={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'littoral',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    designAssumptions:['Toutes les cotes sont des choix auteur originaux en mètres, sans relevé de site ni conformité réglementaire revendiquée.',
      'La mer est un volume fermé ; aucune surface de l’inspection ne permet de marcher ou naviguer sur cette eau.',
      'Les bâtiments sont de plain-pied. Les tours, navires, attractions et appareils réservés restent fermés.'],
    configuration:{sizeTier:tier+1,arrangement:layout+1,intent:profile.intent,shoreSide:'east'},
    bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],
    network:{nodes:[],edges:[],externalPorts:[]},
    operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
    unresolved:['raccord au trait de côte, profondeur et réseaux du seed','butin fini, rencontres et occupation',
      'services payés, énergie, eau et maintenance','graphismes définitifs et états des appareils','persistance et qualification de campagne',...profile.closedWork]};
  const nodes=new Map(),lanes=new Map();
  function node(key,x,y){const n={id:id+':'+key,x,y,z:0};if(nodes.has(key))throw Error('Borne littorale répétée.');nodes.set(key,n);p.network.nodes.push(n);return key;}
  function edge(a,b,mode='pedestrian'){if(a===b||!nodes.has(a)||!nodes.has(b))throw Error('Liaison littorale invalide.');p.network.edges.push({id:id+':edge:'+p.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,widthM:mode==='service'?RULES.roadM:RULES.pathM,mode,level:0});}
  function lane(key,x,y){if(!lanes.has(y))lanes.set(y,[]);const found=lanes.get(y).find(k=>nodes.get(k).x===x);if(found)return found;node(key,x,y);lanes.get(y).push(key);return key;}
  function solid(role,kind,name,x,y,w,h,height){const s={id:id+':structure:'+role,role,kind,name,x,y,w,h,maxHeightM:height,heightOrigin:'author-design',footprintOrigin:'author-design',interiorStatus:'closed-reservation',walkable:false,lootAssigned:false,utilityConnected:false};p.structures.push(s);return s;}
  const sea=solid('sea','closed-sea-water','Réserve maritime infranchissable',W-RULES.waterWidthM,0,RULES.waterWidthM,H,1);
  p.coast={waterId:sea.id,shoreSide:'east',waterWalkable:false,nauticalLink:false,waterExtentIsAuthorAssumption:true};
  node('entrance',8,0);node('exit',dryWidth-8,H);
  const step=RULES.rowStepM+tier*3;
  for(let row=0;row<=4;row++){
    const y=16+row*step,west='lane:'+row+':west',east='lane:'+row+':east';lane(west,8,y);lane(east,dryWidth-8,y);
    if(row){edge('lane:'+(row-1)+':west',west,'service');edge('lane:'+(row-1)+':east',east,'service');}
  }
  edge('entrance','lane:0:west','service');edge('lane:4:east','exit','service');
  p.network.externalPorts.push({node:nodes.get('entrance').id,requires:'coastal-road',connectedToWorld:false},
    {node:nodes.get('exit').id,requires:'local-road',connectedToWorld:false});
  const columnWidth=(dryWidth-32)/2;
  for(let slot=0;slot<8;slot++){
    const def=profile.facilities[ARRANGEMENTS[layout][slot]],row=Math.floor(slot/2),column=slot%2;
    // Houses retain their domestic size. Larger parcels add space between uses
    // and modest ancillary capacity instead of inflating every home.
    const domestic=def.kind==='coastal-house',w=def.w+(domestic?0:tier*.5),h=def.h+(domestic?0:tier*.5);
    const x=16+column*columnWidth+(columnWidth-w)/2,y=16+row*step+12,face=(layout+row+column)%2?'south':'north';
    const b={id:id+':building:'+def.role,role:def.role,name:def.name,kind:def.kind,x,y,w,h,rotationRad:0,entrySide:face,
      heightM:def.height,heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],entry:{x:w/2,y:face==='north'?0:h,level:0,widthM:RULES.doorM}};
    const cw=RULES.corridorM,wall=RULES.wallM,rows=def.rooms.length/2;
    const c={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:b.heightM-.4};b.rooms.push(c);
    for(let i=0;i<def.rooms.length;i++){
      const east=i%2===1,band=Math.floor(i/2),r={id:b.id+':room:'+i,name:def.rooms[i],x:east?(w+cw)/2+wall:wall,y:band*h/rows+wall,
        w:(w-cw)/2-2*wall,h:h/rows-2*wall,level:0,clearHeightM:b.heightM-.4};
      b.rooms.push(r);b.portals.push({id:r.id+':door',from:c.id,to:r.id,x:east?c.x+cw:c.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:wall,axis:'y'});
    }
    p.buildings.push(b);
    const approach=lane('building:'+def.role+':approach',x+w/2,16+(row+(face==='south'?1:0))*step);
    const entry=node('building:'+def.role+':entry',x+w/2,y+b.entry.y);edge(approach,entry);
  }
  for(let i=0;i<profile.fixtures.length;i++){
    const f=profile.fixtures[i],y=36+i*88+(layout%5)*2;
    solid(f.role,f.kind,f.name,dryWidth+4,y,f.w,f.h,f.height+tier*(f.role==='lighthouse'?2:0));
    const stop=node('closed:'+f.role+':view',dryWidth-2,y+f.h/2),approach=lane('closed:'+f.role+':approach',dryWidth-8,16+Math.floor((y+f.h/2-16)/step)*step);
    // Stay on the dry road, then approach the western face of the closed object.
    const turn=Math.abs(nodes.get(approach).y-y-f.h/2)<1e-8?approach:node('closed:'+f.role+':turn',dryWidth-8,y+f.h/2);
    if(turn!==approach)edge(approach,turn);edge(turn,stop);
  }
  for(const keys of lanes.values()){keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);for(let i=1;i<keys.length;i++)edge(keys[i-1],keys[i],'service');}
  p.maxHeightM=Math.max(...p.buildings.map(b=>b.heightM),...p.structures.map(s=>s.maxHeightM));
  return freeze(p);
}
function audit(p){
  const base=Reference.audit(p),errors=[...base.errors],fail=code=>errors.push(code);
  try{
    if(!TYPES.includes(p.type)||!Number.isInteger(p.number)||p.number<1||p.number>50||p.id!==p.type+'-V'+String(p.number).padStart(2,'0'))fail('littoral-identity');
    const profile=PROFILES[p.type];if(p.authorFamily!=='littoral'||p.name!==profile.name||p.sourceIds.length||p.heightOrigin!=='author-design')fail('littoral-provenance');
    if(p.buildings.length!==profile.facilities.length||new Set(p.buildings.map(b=>b.role)).size!==profile.facilities.length)fail('littoral-programme');
    for(const f of profile.facilities){const b=p.buildings.find(b=>b.role===f.role);if(!b||b.kind!==f.kind||b.rooms.filter(r=>r.kind!=='circulation').map(r=>r.name).join('|')!==f.rooms.join('|'))fail('littoral-room-programme');if(f.kind==='coastal-house'&&(b.w!==12||b.h!==12||b.heightM!==3.2))fail('littoral-house-scale');}
    const sea=p.structures.find(s=>s.id===p.coast.waterId);
    if(!sea||sea.kind!=='closed-sea-water'||sea.x!==p.bounds.w-RULES.waterWidthM||sea.y!==0||sea.w!==RULES.waterWidthM||sea.h!==p.bounds.h||p.coast.waterWalkable!==false||p.coast.nauticalLink!==false)fail('littoral-water');
    if(p.structures.length!==profile.fixtures.length+1||p.structures.some(s=>s.walkable!==false||s.interiorStatus!=='closed-reservation'))fail('littoral-closed-volumes');
    if(p.buildings.some(b=>overlaps(b,sea)))fail('littoral-building-on-water');
    for(const s of p.structures)if(s.lootAssigned!==false||s.utilityConnected!==false||s.heightOrigin!=='author-design'||s.maxHeightM>p.maxHeightM||Object.hasOwn(s,'amount')||Object.hasOwn(s,'resource'))fail('littoral-false-stock-or-service');
    if(Object.keys(p.operations).sort().join(',')!=='connectedServices,lootContainersCreated,outputCreated,productionRecipes'||Object.values(p.operations).some(v=>v!==0))fail('littoral-false-production');
    if(!p.unresolved.includes(profile.closedWork[0])||!p.designAssumptions.some(v=>v.includes('choix auteur')))fail('littoral-hidden-limit');
  }catch{fail('littoral-schema');}
  return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
// END AUTHOR CORE
module.exports={RULES,PROFILES,TYPES,build,audit};
