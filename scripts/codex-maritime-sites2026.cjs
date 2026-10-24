'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,wallM:.2,corridorM:1.8,doorM:1.2,
  pathM:1.4,roadM:4.5,waterBandM:36,jettyWidthM:8,jettyReachM:52,
  widthStepM:12,lengthStepM:14});
const freeze = value => {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const facility = (role,name,kind,w,h,heightM,rooms) => ({role,name,kind,w,h,heightM,rooms});
const house = role => facility(role,'Logement insulaire','island-house',12,12,3.2,['chambre double','salon','cuisine','sanitaires']);
const staff = () => facility('staff','Locaux du personnel','maritime-staff',22,20,3.5,['vestiaires','douches','réfectoire','repos équipe']);
const power = () => facility('power','Alimentation et secours','maritime-power',22,20,4,['tableau de distribution','groupe de secours','local batteries','contrôle énergie']);
const workshop = () => facility('workshop','Atelier de maintenance','maritime-workshop',28,24,5,['atelier mécanique','local outillage','réserve pièces détachées','bureau maintenance']);
const stores = () => facility('stores','Magasin de service','maritime-stores',28,24,4.5,['stockage matériel','réserve matériel','bureau magasin','réserve consommables']);
const welfare = () => facility('welfare','Hygiène et secours','maritime-welfare',22,20,3.4,['salle de soins','réserve médicale','sanitaires','buanderie']);
const control = () => facility('control','Contrôle maritime','maritime-control',24,22,4,['navigation','communications','archives cartes','bureau exploitation']);
const reception = () => facility('welcome','Accueil et surveillance','maritime-welcome',22,20,3.6,['accueil','poste de garde','bureau accueil','consignes']);
const lab = (role,name) => facility(role,name,'maritime-laboratory',26,22,3.8,['contrôle analyse','atelier préparation échantillons','réserve flacons','local nettoyage']);
const fixture = (role,kind,name,w,h,heightM) => ({role,kind,name,w,h,heightM});
const PROFILES = freeze({
  'EXT-MONDE-T009': {name:'Plateforme pétrolière fixe',domain:'offshore',dry:[224,284],
    intent:'Pont de référence, hébergement et maintenance autour de réservations de forage fermées',
    facilities:[control(),facility('crew','Hébergement et restauration de relève','offshore-crew',26,32,3.5,['chambre double','repos de quart','sanitaires','lingerie','cuisine','réfectoire']),
      facility('process','Poste de procédé','offshore-process-control',28,24,4.5,['contrôle procédé','local pompes','distribution électrique','réserve matériel']),
      lab('lab','Contrôle des prélèvements'),workshop(),stores(),power(),welfare()],
    fixtures:[fixture('derrick','closed-drilling-derrick','Tour de forage fermée, puits non livré',18,20,52),
      fixture('jacket','closed-jacket-head','Tête de support fixe, fondations immergées non livrées',16,16,1.8)],
    limits:['Puits, hydrocarbures, fondations immergées et structure porteuse réelle non livrés.']},
  'EXT-MONDE-T010': {name:'Plateforme semi-submersible',domain:'offshore',dry:[244,304],
    intent:'Pont de référence et postes de ballast sans simulation flottante',
    facilities:[control(),facility('ballast','Contrôle des ballasts','offshore-ballast',28,24,4.2,['contrôle ballast','local pompes','distribution électrique','atelier vannes']),
      facility('crew','Hébergement du bord','offshore-accommodation',28,24,3.5,['cabine équipage','repos de quart','sanitaires','lingerie']),
      workshop(),stores(),power(),facility('staff','Locaux du personnel et restauration','maritime-staff',22,28,3.5,['vestiaires','douches','réfectoire','repos équipe','cuisine','réserve alimentaire']),facility('logistics','Préparation des transferts','offshore-logistics',26,22,4,['bureau logistique','réserve matériel','vestiaire technique','salle de soins'])],
    fixtures:[fixture('column','closed-pontoon-column','Tête de colonne fermée, ponton immergé non livré',18,24,2.2),
      fixture('handling','closed-offshore-handling','Treuil de manutention arrêté, accès condamné',20,22,12)],
    limits:['Pontoons immergés, ancrages, ballast, mouvements et stabilité de la plateforme non simulés.']},
  'EXT-MONDE-T012': {name:'Station scientifique marine',domain:'offshore',dry:[224,284],
    intent:'Laboratoires et vie de relève sur un pont marin de référence',
    facilities:[facility('welcome','Accueil, surveillance et soins','maritime-welcome',22,28,3.6,['accueil','poste de garde','bureau accueil','consignes','salle de soins','réserve médicale']),lab('water-lab','Laboratoire des eaux'),lab('biology-lab','Laboratoire de biologie marine'),
      facility('samples','Traitement des échantillons','marine-sample-stores',26,22,4,['stockage réfrigéré','atelier préparation échantillons','réserve flacons','bureau scientifique']),
      facility('crew','Hébergement scientifique','marine-science-crew',26,24,3.5,['cabine technicien','salon commun','cuisine','sanitaires']),workshop(),stores(),power()],
    fixtures:[fixture('mast','closed-scientific-mast','Mât scientifique sans capteur opérationnel',10,12,26),
      fixture('hoist','closed-sampling-hoist','Portique de prélèvement arrêté',18,18,9)],
    limits:['Appareils de prélèvement, capteurs, laboratoires spécialisés, ancrages et niveaux sous-marins non livrés.']},
  'EXT-MONDE-T013': {name:'Port de pêche',domain:'port',dry:[344,344],
    intent:'Débarquement, préparation et vente du poisson avec pontons secs distincts du chenal',
    facilities:[reception(),facility('auction','Halle de criée','fishing-auction',36,28,5,['accueil','conditionnement pêche','bureau ventes','stockage réfrigéré']),
      facility('cold','Conservation et expédition','fishing-cold-chain',32,26,4.5,['stockage réfrigéré','réserve emballages','conditionnement pêche','local nettoyage']),
      facility('nets','Atelier des pêcheurs','fishing-net-workshop',28,24,4.5,['atelier filets','atelier moteurs','réserve cordages','local outillage']),
      staff(),control(),stores(),welfare()],
    fixtures:[fixture('ice','closed-ice-plant','Installation de glace arrêtée',24,26,7),
      fixture('haul','closed-fishing-haulout','Élévateur de bateau immobilisé',22,24,10)],
    limits:['Aucun poisson, navire pilotable, marché actif ou réserve de glace n’est créé.']},
  'EXT-MONDE-T014': {name:'Marina',domain:'port',dry:[324,324],
    intent:'Accueil des plaisanciers, entretien et trois pontons physiquement accessibles',
    facilities:[control(),reception(),workshop(),facility('chandlery','Accastillage et fournitures','marina-chandlery',28,24,3.6,['accueil','réserve accastillage','bureau magasin','stockage matériel']),
      facility('club','Club du port','marina-club',26,22,3.5,['club-house','cuisine','réserve alimentaire','réunion équipe']),staff(),welfare(),power()],
    fixtures:[fixture('hoist','closed-marina-hoist','Grue de plaisance immobilisée',16,20,10),
      fixture('boat-store','closed-marina-boat-storage','Réserve de bateaux fermée, aucune coque accessible',24,28,5)],
    limits:['Aucun emplacement nautique actif, bateau visitable, carburant ou service de plaisance n’est livré.']},
  'EXT-MONDE-T015': {name:'Terminal conteneurs',domain:'port',dry:[464,424],
    intent:'Cour de fret, contrôle et maintenance séparés des jetées piétonnes auteur',
    facilities:[reception(),facility('customs','Poste de douane','container-customs',30,24,4,['bureau douanes','poste de contrôle','archives','réserve matériel']),
      facility('dispatch','Gestion du fret','container-dispatch',32,26,4,['bureau logistique','contrôle trafic','archives fret','réunion équipe']),
      workshop(),staff(),stores(),power(),welfare()],
    fixtures:[fixture('gantry','closed-container-gantry','Portique de quai immobilisé',30,34,36),
      fixture('stack','closed-container-stack','Îlot de conteneurs fermé, contenu non attribué',28,38,8.6)],
    limits:['Aucun conteneur de butin, manutention, fret automatisé ou mouvement de portique n’est livré.']},
  'EXT-MONDE-T016': {name:'Terminal ferry',domain:'port',dry:[384,364],
    intent:'Accueil passagers et services du terminal avec accès piéton jusqu’aux jetées',
    facilities:[reception(),facility('tickets','Billetterie du terminal','ferry-ticket-office',26,22,3.6,['accueil','bureau billetterie','archives','consignes']),
      facility('waiting','Salle d’attente voyageurs','ferry-waiting',34,28,4,['salon voyageurs','sanitaires','réserve accueil','poste de contrôle']),
      facility('security','Contrôle d’embarquement','ferry-security',28,24,4,['poste de garde','bureau contrôle','réserve matériel','repos équipe']),
      staff(),workshop(),facility('food','Restauration du terminal','ferry-food',28,24,3.6,['cuisine','réfectoire','réserve sèche','plonge']),welfare()],
    fixtures:[fixture('ramp','closed-ferry-linkspan','Rampe roulante condamnée, ferry absent',24,30,3),
      fixture('traffic','closed-ferry-marshalling','Réserve de contrôle véhicules non ouverte',28,32,2)],
    limits:['Le ferry est absent ; aucune traversée, rampe automobile ou embarquement n’est opérationnel.']},
  'EXT-MONDE-T077': {name:'Îlot de phare',domain:'island',dry:[204,264],
    intent:'Habitat de gardiens et maintenance sur une emprise sèche réellement entourée d’eau',
    facilities:[house('keeper-house'),house('relief-house'),workshop(),power(),reception(),stores(),welfare(),control()],
    fixtures:[fixture('lighthouse','closed-islet-lighthouse','Tour fermée, lanterne inaccessible',14,16,32),
      fixture('signal','closed-islet-signal','Sémaphore hors service',8,10,12)],
    limits:['La tour n’a pas d’escalier livré ; relief naturel, accès nautique et alimentation du phare restent ouverts.']},
  'EXT-MONDE-T078': {name:'Île agricole habitée',domain:'island',dry:[484,504],
    intent:'Habitat et bâtiments de préparation agricole autour de parcelles réservées',
    facilities:[house('house-a'),house('house-b'),facility('barn','Hangar agricole','island-agricultural-barn',36,30,6,['atelier agricole','local semences','stockage récoltes','local outillage']),
      workshop(),facility('cold','Conditionnement agricole','island-produce',32,26,4.4,['conditionnement agricole','stockage réfrigéré','réserve emballages','local nettoyage']),
      welfare(),facility('water','Eau et maintenance','island-water',26,22,3.8,['local pompes','contrôle eau','réserve matériel','atelier vannes']),
      facility('community','Maison commune','island-community',26,22,3.6,['accueil','réunion habitants','bureau communal','archives'])],
    fixtures:[fixture('field','closed-agricultural-plot','Parcelle de culture réservée, production non livrée',44,48,1),
      fixture('silo','closed-island-silo','Silo fermé sans grain attribué',20,24,14)],
    limits:['Les parcelles réservées ne créent aucune culture ni récolte ; animaux, irrigation et autonomie insulaire restent ouverts.']},
  'EXT-MONDE-T079': {name:'Île portuaire industrielle',domain:'island',dry:[644,624],
    intent:'Échantillon portuaire et industriel autour d’une desserte terrestre intérieure',
    facilities:[reception(),facility('industry','Atelier industriel insulaire','island-industrial-shop',42,32,7,['atelier mécanique','atelier soudage','réserve matières','contrôle qualité']),
      workshop(),facility('staff','Locaux du personnel et soins','maritime-staff',22,28,3.5,['vestiaires','douches','réfectoire','repos équipe','salle de soins','réserve médicale']),control(),stores(),power(),facility('housing','Logement de relève','island-industrial-crew',28,24,3.6,['chambre double','repos équipe','cuisine','sanitaires'])],
    fixtures:[fixture('crane','closed-island-crane','Portique insulaire immobilisé',28,32,30),
      fixture('freight','closed-island-freight','Cour de fret fermée sans contenu attribué',44,48,6)],
    limits:['Le terminal n’est raccordé à aucun monde ; fret, production industrielle et service de traversée ne sont pas livrés.']},
  'EXT-MONDE-T080': {name:'Grande île mixte',domain:'island',dry:[824,784],
    intent:'Échantillon d’habitat, alimentation, pêche et services dans une grande emprise insulaire',
    facilities:[house('house-a'),house('house-b'),facility('community','Maison commune','mixed-island-community',32,26,3.6,['accueil','réunion habitants','bureau communal','archives']),
      facility('food','Alimentation de l’île','mixed-island-food',32,26,3.6,['cuisine','réfectoire','réserve alimentaire','stockage réfrigéré']),
      facility('fish','Préparation de la pêche','mixed-island-fishing',30,26,4,['conditionnement pêche','stockage réfrigéré','réserve emballages','local nettoyage']),
      workshop(),power(),welfare()],
    fixtures:[fixture('orchard','closed-island-orchard','Parcelle de verger réservée sans récolte',48,50,5),
      fixture('landing','closed-island-loading','Réserve de chargement sans manutention active',38,44,8)],
    limits:['Cette composition de huit bâtiments n’est pas une île naturellement peuplée complète ; relief, densification et réseaux du seed restent ouverts.']}
});
const TYPES = Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS = freeze([[0,1,2,3,4,5,6,7],[1,0,3,2,5,4,7,6],[2,3,0,1,6,7,4,5],[3,2,1,0,7,6,5,4],
  [0,2,4,6,1,3,5,7],[7,5,3,1,6,4,2,0],[4,5,6,7,0,1,2,3],[5,4,7,6,1,0,3,2],
  [6,7,4,5,2,3,0,1],[7,6,5,4,3,2,1,0]]);
const overlap = (a,b) => a.x<b.x+b.w-1e-8&&a.x+a.w>b.x+1e-8&&a.y<b.y+b.h-1e-8&&a.y+a.h>b.y+1e-8;
const contains = (a,b) => b.x>=a.x-1e-8&&b.y>=a.y-1e-8&&b.x+b.w<=a.x+a.w+1e-8&&b.y+b.h<=a.y+a.h+1e-8;

// Carve the water around actual supported rectangles. A jetty is a dry strip,
// not a path painted on an uncut sea collider. Adjacent wet cells are merged.
function waterPartition(bounds,dry) {
  const xs=[...new Set([bounds.x,bounds.x+bounds.w,...dry.flatMap(r=>[r.x,r.x+r.w])])].sort((a,b)=>a-b);
  const ys=[...new Set([bounds.y,bounds.y+bounds.h,...dry.flatMap(r=>[r.y,r.y+r.h])])].sort((a,b)=>a-b);
  const water=[];
  for(let j=0;j<ys.length-1;j++){
    let start=null;
    for(let i=0;i<xs.length;i++){
      const wet=i<xs.length-1&&!dry.some(r=>contains(r,{x:(xs[i]+xs[i+1])/2,y:(ys[j]+ys[j+1])/2,w:0,h:0}));
      if(wet&&start===null)start=xs[i];
      if(!wet&&start!==null){const box={x:start,y:ys[j],w:xs[i]-start,h:ys[j+1]-ys[j]},previous=water.find(r=>r.x===box.x&&r.w===box.w&&Math.abs(r.y+r.h-box.y)<1e-8);if(previous)previous.h+=box.h;else water.push(box);start=null;}
    }
  }
  return water;
}

function build(type,number) {
  if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie ou variante maritime de site invalide.');
  const profile=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10,id=type+'-V'+String(number).padStart(2,'0');
  const port=profile.domain==='port',D={x:port?0:RULES.waterBandM,y:port?0:RULES.waterBandM,
    w:profile.dry[0]+tier*RULES.widthStepM,h:profile.dry[1]+tier*RULES.lengthStepM};
  const bounds={x:0,y:0,w:D.x+D.w+(port?100:RULES.waterBandM),h:D.y+D.h+(port?0:RULES.waterBandM)};
  const p={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
    authorFamily:'maritime-sites',name:profile.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
    bounds,buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],network:{nodes:[],edges:[],externalPorts:[]},
    configuration:{sizeTier:tier+1,arrangement:layout+1,domain:profile.domain,intent:profile.intent},
    operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
    designAssumptions:['Cotes, emprises, hauteurs et dispositions sont des choix auteur originaux en mètres, sans relevé de site ni conformité réglementaire revendiquée.',
      'L’eau est une réservation infranchissable en plan, sans profondeur réelle attribuée. Les jetées sont de véritables surfaces sèches.',
      'Un niveau de référence est inspectable. Aucun accès externe, bateau, fondation sous-marine ou service actif n’est créé.'],
    unresolved:['implantation, relief, littoral naturel et profondeur du seed','budget fini, rencontres et population de campagne',
      'réseaux d’eau et énergie payés, opérations et maintenance','graphismes définitifs, états et animations des appareils',
      'identités, persistance et qualification de campagne',...profile.limits]};
  const nodes=new Map(),lanes=new Map(),step=(D.h-36)/4;
  function node(key,x,y){if(nodes.has(key))throw Error('Borne maritime répétée.');const n={id:id+':'+key,x,y,z:0};nodes.set(key,n);p.network.nodes.push(n);return key;}
  function edge(a,b,mode='pedestrian'){if(a===b||!nodes.has(a)||!nodes.has(b))throw Error('Liaison maritime invalide.');p.network.edges.push({id:id+':edge:'+p.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,widthM:mode==='service'?RULES.roadM:RULES.pathM,mode,level:0});}
  function lane(key,x,y){if(!lanes.has(y))lanes.set(y,[]);const previous=lanes.get(y).find(k=>nodes.get(k).x===x);if(previous)return previous;node(key,x,y);lanes.get(y).push(key);return key;}
  function solid(role,kind,name,box,heightM){const s={id:id+':structure:'+role,role,kind,name,...box,maxHeightM:heightM,heightOrigin:'author-design',footprintOrigin:'author-design',interiorStatus:'closed-reservation',walkable:false,lootAssigned:false,utilityConnected:false};p.structures.push(s);return s;}
  const supported=[D],piers=[];
  if(port){
    for(let row=1;row<=3;row++){
      const y=D.y+18+row*step,box={x:D.x+D.w-8,y:y-RULES.jettyWidthM/2,w:RULES.jettyReachM+8,h:RULES.jettyWidthM};
      supported.push(box);piers.push({id:id+':jetty:'+row,...box,kind:'supported-jetty',widthM:RULES.jettyWidthM,walkable:true,level:0});
    }
  }else{
    const y=D.y+D.h/2,box={x:8,y:y-RULES.jettyWidthM/2,w:D.x,h:RULES.jettyWidthM};supported.push(box);
    piers.push({id:id+':landing',...box,kind:'supported-landing',widthM:RULES.jettyWidthM,walkable:true,level:0});
  }
  const water=waterPartition(bounds,supported);
  water.forEach((box,i)=>solid('water:'+i,'closed-maritime-water','Réservation d’eau infranchissable, profondeur non attribuée',box,1));
  p.water={parts:p.structures.map(s=>s.id),walkable:false,depthM:null,navigationDelivered:false};
  p.support={origin:'author-design',dryArea:{...D},surfaces:supported.map((r,i)=>({id:id+':supported:'+i,...r,level:0})),piers};
  p.outdoorAreas.push(...piers);
  if(profile.domain==='offshore')p.deckDatum={relativeLevel:0,elevationAboveSeaM:null,submergedSupportDelivered:false,stabilitySimulated:false};
  if(profile.domain==='island')p.island={coastlineOrigin:'author-rectangular-envelope',naturalReliefDelivered:false,worldLink:false};
  for(let row=0;row<=4;row++){
    const y=D.y+18+row*step;lane('lane:'+row+':west',D.x+8,y);lane('lane:'+row+':east',D.x+D.w-8,y);
    if(row){edge('lane:'+(row-1)+':west','lane:'+row+':west','service');edge('lane:'+(row-1)+':east','lane:'+row+':east','service');}
  }
  if(port){
    const key=node('entrance',8,0);edge(key,'lane:0:west','service');
    p.network.externalPorts.push({node:nodes.get(key).id,requires:'port-road',connectedToWorld:false});
    for(let row=1;row<=3;row++){
      const start='lane:'+row+':east',key=node('jetty:'+row+':end',D.x+D.w+RULES.jettyReachM-3,D.y+18+row*step);edge(start,key);
    }
  }else{
    const key=node('entrance',10,D.y+D.h/2);edge(key,'lane:2:west');
    p.network.externalPorts.push({node:nodes.get(key).id,requires:'reachable-nautical-landing',connectedToWorld:false});
  }
  const reserveWidth=Math.max(...profile.fixtures.map(f=>f.w))+24,columnWidth=(D.w-reserveWidth-56)/2;
  for(let slot=0;slot<8;slot++){
    const f=profile.facilities[ARRANGEMENTS[layout][slot]],row=Math.floor(slot/2),column=slot%2,domestic=f.kind==='island-house';
    const w=f.w+(domestic?0:tier*.5),h=f.h+(domestic?0:tier*.5),x=D.x+16+column*columnWidth+(columnWidth-w)/2,y=D.y+18+row*step+12;
    const face=(layout+row+column)%2?'south':'north',cw=RULES.corridorM,wall=RULES.wallM;
    const b={id:id+':building:'+f.role,role:f.role,name:f.name,kind:f.kind,x,y,w,h,rotationRad:0,entrySide:face,heightM:f.heightM,
      heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],entry:{x:w/2,y:face==='north'?0:h,level:0,widthM:RULES.doorM}};
    const corridor={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:f.heightM-.4};b.rooms.push(corridor);
    const roomRows=Math.ceil(f.rooms.length/2),roomDepth=h/roomRows;
    for(let i=0;i<f.rooms.length;i++){
      const east=i%2===1,r={id:b.id+':room:'+i,name:f.rooms[i],x:east?(w+cw)/2+wall:wall,y:Math.floor(i/2)*roomDepth+wall,w:(w-cw)/2-2*wall,h:roomDepth-2*wall,level:0,clearHeightM:f.heightM-.4};
      b.rooms.push(r);b.portals.push({id:r.id+':door',from:corridor.id,to:r.id,x:east?corridor.x+cw:corridor.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:wall,axis:'y'});
    }
    p.buildings.push(b);const approach=lane('building:'+f.role+':approach',x+w/2,D.y+18+(row+(face==='south'?1:0))*step);
    const entry=node('building:'+f.role+':entry',x+w/2,y+b.entry.y);edge(approach,entry);
  }
  profile.fixtures.forEach((f,i)=>{
    const x=D.x+D.w-16-f.w,y=D.y+32+i*2*step+(layout%5),box={x,y,w:f.w,h:f.h};
    solid(f.role,f.kind,f.name,box,f.heightM);
    const approach=lane('fixture:'+f.role+':approach',D.x+D.w-8,D.y+18+i*2*step),turn=node('fixture:'+f.role+':turn',D.x+D.w-8,y+f.h/2),stop=node('fixture:'+f.role+':view',D.x+D.w-12,y+f.h/2);
    edge(approach,turn);edge(turn,stop);
  });
  for(const keys of lanes.values()){keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);for(let i=1;i<keys.length;i++)edge(keys[i-1],keys[i],'service');}
  p.maxHeightM=Math.max(...p.buildings.map(b=>b.heightM),...p.structures.map(s=>s.maxHeightM));
  return freeze(p);
}

function audit(p) {
  const base=Reference.audit(p),errors=[...base.errors],fail=code=>errors.push(code);
  try{
    if(!TYPES.includes(p.type)||!Number.isInteger(p.number)||p.number<1||p.number>50||p.id!==p.type+'-V'+String(p.number).padStart(2,'0'))fail('maritime-site-identity');
    const profile=PROFILES[p.type];
    const expectedTier=Math.floor((p.number-1)/10);
    if(p.authorFamily!=='maritime-sites'||p.name!==profile.name||p.sourceIds.length||p.heightOrigin!=='author-design'||p.configuration.domain!==profile.domain)fail('maritime-site-provenance');
    if(p.buildings.length!==8||new Set(p.buildings.map(b=>b.role)).size!==8)fail('maritime-site-programme');
    for(const f of profile.facilities){
      const b=p.buildings.find(b=>b.role===f.role),extra=f.kind==='island-house'?0:expectedTier*.5;
      if(!b||b.kind!==f.kind||b.rooms.filter(r=>r.kind!=='circulation').map(r=>r.name).join('|')!==f.rooms.join('|'))fail('maritime-site-room-programme');
      if(!b||b.w!==f.w+extra||b.h!==f.h+extra||b.heightM!==f.heightM)fail('maritime-site-building-scale');
      if(f.kind==='island-house'&&(!b||b.w!==12||b.h!==12||b.heightM!==3.2))fail('maritime-site-house-scale');
    }
    if(p.water.walkable!==false||p.water.depthM!==null||p.water.navigationDelivered!==false||!p.water.parts.length)fail('maritime-site-false-water');
    const D=p.support.dryArea,tier=Math.floor((p.number-1)/10);
    const port=profile.domain==='port',layout=(p.number-1)%10;
    if(D.x!==(port?0:RULES.waterBandM)||D.y!==(port?0:RULES.waterBandM)||D.w!==profile.dry[0]+tier*RULES.widthStepM||D.h!==profile.dry[1]+tier*RULES.lengthStepM||p.support.origin!=='author-design')fail('maritime-site-shrunk-envelope');
    if(p.bounds.x!==0||p.bounds.y!==0||p.bounds.w!==D.x+D.w+(port?100:RULES.waterBandM)||p.bounds.h!==D.y+D.h+(port?0:RULES.waterBandM)||p.configuration.sizeTier!==tier+1||p.configuration.arrangement!==layout+1)fail('maritime-site-configuration');
    const dry=p.support.surfaces;
    if(dry.length!==(port?4:2)||dry.some(r=>r.level!==0||!contains(p.bounds,r))||['x','y','w','h'].some(k=>dry[0][k]!==D[k])||p.buildings.some(b=>!contains(D,b)))fail('maritime-site-unsupported');
    const expected=waterPartition(p.bounds,dry),water=p.water.parts.map(id=>p.structures.find(s=>s.id===id));
    if(water.length!==expected.length||water.some((s,i)=>!s||s.kind!=='closed-maritime-water'||['x','y','w','h'].some(k=>s[k]!==expected[i][k])))fail('maritime-site-water-partition');
    if(p.structures.length!==water.length+profile.fixtures.length)fail('maritime-site-fixture-count');
    for(const f of profile.fixtures){const s=p.structures.find(s=>s.role===f.role);if(!s||s.kind!==f.kind||s.name!==f.name||s.w!==f.w||s.h!==f.h||s.maxHeightM!==f.heightM)fail('maritime-site-fixture-scale');}
    if(p.structures.some(s=>s.walkable!==false||s.interiorStatus!=='closed-reservation'||s.lootAssigned!==false||s.utilityConnected!==false||s.heightOrigin!=='author-design'||Object.hasOwn(s,'amount')||Object.hasOwn(s,'resource')))fail('maritime-site-false-device');
    if(p.maxHeightM!==Math.max(...p.buildings.map(b=>b.heightM),...p.structures.map(s=>s.maxHeightM)))fail('maritime-site-height');
    if(p.support.piers.length!==(port?3:1)||p.support.piers.some((r,i)=>{
      const y=port?D.y+18+(i+1)*(D.h-36)/4:D.y+D.h/2,expected={x:port?D.x+D.w-8:8,y:y-RULES.jettyWidthM/2,w:port?RULES.jettyReachM+8:D.x,h:RULES.jettyWidthM};
      return r.widthM!==RULES.jettyWidthM||r.walkable!==true||r.level!==0||['x','y','w','h'].some(k=>r[k]!==expected[k]||dry[i+1][k]!==expected[k]);
    }))fail('maritime-site-jetty');
    if(profile.domain==='offshore'&&(p.deckDatum.relativeLevel!==0||p.deckDatum.elevationAboveSeaM!==null||p.deckDatum.submergedSupportDelivered!==false||p.deckDatum.stabilitySimulated!==false))fail('maritime-site-false-offshore');
    if(profile.domain==='island'&&(p.island.coastlineOrigin!=='author-rectangular-envelope'||p.island.naturalReliefDelivered!==false||p.island.worldLink!==false))fail('maritime-site-false-island');
    if(Object.keys(p.operations).sort().join(',')!=='connectedServices,lootContainersCreated,outputCreated,productionRecipes'||Object.values(p.operations).some(v=>v!==0))fail('maritime-site-false-production');
    if(!p.unresolved.includes(profile.limits[0])||!p.designAssumptions.some(s=>s.includes('choix auteur')))fail('maritime-site-hidden-limit');
  }catch{fail('maritime-site-schema');}
  return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
// END AUTHOR CORE
module.exports={RULES,PROFILES,TYPES,build,audit};
