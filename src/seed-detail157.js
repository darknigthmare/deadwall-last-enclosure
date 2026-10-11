/* Seeded, read-only detail layer for visitable G7 parcels.
 * No historical POI, floor plan, loot node, save key or RNG stream is changed.
 */
(function(root,factory){'use strict';
 const geometry=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const api=factory(geometry);
 root.DeadwallSeedDetail157=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G){'use strict';
 const groups=Object.freeze({
  residence:['house','duplex','cabin','basementHouse','cottageSmall','rowhouse','bungalow','familyHouse','farmhouse','villa','duplexWide'],
  collective:['apartments','studioBlock','longBlock','residence'],
  alimentation:['grocer','market','bakery','centralKitchen','cornerShop','superstore'],
  restauration:['diner','cafe','inn'],
  hebergement:['hotel','motel'],
  magasins:['mall','hardware','garden'],
  medical:['clinic','medicalCentre','dental','veterinary','pharmacy'],
  administration:['townhall','bank','postoffice','library','chapel'],
  education:['school','officeBlock'],
  loisirs:['gym','laundry'],
  artisanat:['garage','joinery','smallWorkshop','reuse'],
  logistique:['warehouse','freight','selfstorage','logisticsHall'],
  industrie:['sawmill','mine','quarry','scrapyard'],
  campagne:['marketgarden'],
  reseaux:['fuel','generatorRoom','waterStation'],
  securite:['bunker','firestation'],
  ruines:['ruin']
 });
 const typeFamily=Object.freeze(Object.fromEntries(Object.entries(groups).flatMap(([key,types])=>types.map(t=>[t,key]))));
 const profiles=Object.freeze({
  residence:{variants:['jardin-fleuri','potager','terrasse','pelouse-et-jeux','verger','piscine-privee','cour-atelier','jardin-sauvage'],yard:['tree','flowerbed','planter','cropbed','bench','shed','compost','patio','barbecue','clothesline','playset','hedge','waterButt'],interior:['rug','chair','paper','lamp','tv','smallCabinet','toy','laundryBasket']},
  collective:{variants:['cour-collective','parking-residentiel','jardin-partage','aire-de-jeux','acces-technique'],yard:['bench','hedge','planter','playset','trash','bikeRack','laundryLine','pallet','lamp'],interior:['rug','chair','paper','notice','smallCabinet','laundryBasket']},
  alimentation:{variants:['livraison-matinale','rayonnages-degrades','stock-evacue','rayon-frais','cour-de-livraison'],yard:['pallet','trash','barrel','crateStack','sign','cart','canopy','lamp'],interior:['display','basket','countertop','paper','fallenStock','shelfEnd']},
  restauration:{variants:['terrasse-fermee','cuisine-abandonnee','service-routier','livraisons','salle-degradee'],yard:['patio','bench','trash','sign','pallet','canopy','planter','barrel'],interior:['chair','menu','rug','fallenStock','tray','countertop']},
  hebergement:{variants:['cour-deserte','piscine-d-hotel','parking','terrasse','linge-abandonne'],yard:['bench','planter','trash','pallet','lamp','sign','patio','pool','hedge'],interior:['rug','chair','laundryBasket','paper','notice','smallCabinet']},
  magasins:{variants:['rayons-vides','stock-arriere','serre-de-vente','quai','palettes-eparses'],yard:['pallet','cart','sign','canopy','planter','barrel','trash','crateStack'],interior:['display','basket','fallenStock','shelfEnd','paper','countertop']},
  medical:{variants:['accueil-degrade','zone-triage','quai-sanitaire','salle-des-soins','reserve-securisee'],yard:['bench','sign','lamp','trash','barrel','pallet','planter'],interior:['screen','tray','paper','smallCabinet','chair','notice']},
  administration:{variants:['place-deserte','accueil-abandonne','archives-fermees','cour-de-service','stationnement-public'],yard:['bench','planter','sign','lamp','trash','bikeRack','hedge'],interior:['chair','paper','notice','smallCabinet','rug','tray']},
  education:{variants:['cour-recreation','accueil','salle-abandonnee','archives','parking-du-personnel'],yard:['bench','playset','planter','bikeRack','sign','lamp','trash'],interior:['chair','paper','notice','rug','toy','smallCabinet']},
  loisirs:{variants:['parvis-vide','cour-technique','vestiaires-fermes','equipements-abandonnes'],yard:['bench','bikeRack','planter','sign','trash','lamp','pallet'],interior:['chair','laundryBasket','rug','notice','paper']},
  artisanat:{variants:['atelier-en-panne','cour-d-outils','stock-de-pieces','chantier-stoppe','entretien'],yard:['pallet','barrel','tire','crateStack','trash','worktable','lamp','sign'],interior:['toolbox','paper','smallCabinet','fallenStock','tray']},
  logistique:{variants:['quai-sature','stock-evacue','entrepot-ferme','cour-de-manutention','zone-de-containers'],yard:['pallet','crateStack','barrel','container','trash','sign','lamp','cart'],interior:['fallenStock','palletMark','paper','toolbox','shelfEnd']},
  industrie:{variants:['site-arrete','materiaux-stocks','chantier-abandonne','zone-manutention','maintenance'],yard:['pallet','barrel','container','worktable','scrapHeap','tire','sign','lamp'],interior:['toolbox','paper','fallenStock','smallCabinet','palletMark']},
  campagne:{variants:['potager','serre','plantations','parcelles-en-friche','irrigation-arretee'],yard:['cropbed','cropbed','waterButt','planter','compost','shed','tree','barrel','pallet'],interior:['paper','toolbox','basket','tray','smallCabinet']},
  reseaux:{variants:['maintenance','coupure-du-reseau','station-fermee','equipement-en-panne','zone-technique'],yard:['barrel','pallet','sign','lamp','worktable','container','scrapHeap','bollard'],interior:['toolbox','paper','smallCabinet','notice','tray']},
  securite:{variants:['cour-de-materiel','vestiaires-et-intervention','stocks-de-secours','poste-de-controle','parking-securise'],yard:['barrel','pallet','crateStack','sign','lamp','bollard','bench','trash','container'],interior:['smallCabinet','paper','notice','chair','toolbox','tray']},
  ruines:{variants:['jardin-en-friche','cour-eboulee','vegetation-reprise','abandon-prolonge'],yard:['scrapHeap','hedge','tree','flowerbed','trash','pallet','waterButt'],interior:['paper','fallenStock','chair','rug','smallCabinet']}
 });
 // Metres in the same local coordinate system as the building plan.
 const objects=Object.freeze({
  tree:[2.2,2.2,true],flowerbed:[2.3,.85,false],planter:[1.05,.9,true],cropbed:[3.1,1.35,false],bench:[1.8,.65,true],
  shed:[3.2,2.5,true],compost:[1.2,1.2,true],patio:[4.5,2.8,false],barbecue:[1.1,.85,true],clothesline:[3.2,.4,false],
  playset:[2.7,2.2,true],hedge:[2.5,.55,true],waterButt:[.85,.8,true],pool:[5.5,3.5,true],
  trash:[1.3,1.1,true],bikeRack:[2.1,.7,true],laundryLine:[2.8,.5,false],pallet:[2.3,1.25,true],lamp:[.55,.55,true],
  barrel:[.9,.9,true],crateStack:[1.5,1.4,true],sign:[1.5,.45,true],cart:[1.5,.9,true],canopy:[4.4,2.4,false],
  container:[4.5,2.6,true],tire:[1.25,1.25,true],worktable:[2,.85,true],scrapHeap:[2.1,1.8,true],bollard:[.45,.45,true],
  // Floor overlays and very small items; no changes to the historical furniture economy.
  rug:[1.45,1.05,false],chair:[.65,.65,true],paper:[.45,.32,false],tv:[.95,.4,true],
  smallCabinet:[1.05,.42,true],toy:[.65,.45,false],laundryBasket:[.72,.55,true],display:[1.15,.5,true],
  basket:[.55,.45,false],countertop:[1,.35,false],fallenStock:[.75,.65,true],shelfEnd:[.58,.48,true],
  menu:[.62,.3,false],tray:[.65,.35,false],screen:[.65,.55,false],notice:[.62,.25,false],
  toolbox:[.7,.45,true],palletMark:[1.15,.7,false]
 });
 const SURFACES=new Set(['flowerbed','cropbed','patio','clothesline','laundryLine','canopy','rug','paper','toy','basket','countertop','menu','tray','screen','notice','palletMark']);
 const minx=p=>-11,maxx=p=>p.w+11,maxy=p=>p.h+25;
 const hit=(a,b,margin=0)=>a.x<b.x+b.w+margin&&a.x+a.w>b.x-margin&&a.y<b.y+b.h+margin&&a.y+a.h>b.y-margin;
 const bounds=o=>({x:o.x,y:o.y,w:o.w,h:o.h});
 const cleanHash=(...args)=>G.hash('detail157',...args);
 const randIndex=(length,...args)=>cleanHash(...args)%length;
 function familyFor(type){return typeFamily[type]||'magasins';}
 function planVariant(seed,p){const family=familyFor(p.type),profile=profiles[family];let variants=profile.variants;
  if(family==='residence'&&p.w<18)variants=variants.filter(v=>v!=='piscine-privee');
  if(family==='hebergement'&&p.w<29)variants=variants.filter(v=>v!=='piscine-d-hotel');
  return variants[randIndex(variants.length,seed,p.id,p.type,'variant')];
 }
 function validOutdoor(p,o,solid,occupied){
  if(o.x<minx(p)||o.x+o.w>maxx(p)||o.y<-16||o.y+o.h>maxy(p))return false;
  if(hit(o,{x:-1,y:-1,w:p.w+2,h:p.h+2},.65))return false;
  // Maintain an open 3.6m front-to-rear pedestrian corridor and both exit faces.
  if(solid&&hit(o,{x:p.w/2-1.8,y:p.h-.5,w:3.6,h:26},.3))return false;
  if(solid&&hit(o,{x:p.w/2-2.5,y:-17,w:5,h:17},.2))return false;
  return !occupied.some(item=>hit(o,item,solid&&item.solid?.7:.18));
 }
 function outdoorOccupied(p){
  const used=(p.outdoor||[]).map(o=>({...bounds(o),solid:true}));
  for(const car of p.parking||[]){
   const q=G.local(p,car.x,car.y),r=Math.hypot(car.w||4.6,car.h||1.85)/2+.5;
   used.push({x:q.x-r,y:q.y-r,w:r*2,h:r*2,solid:true});
  }
  return used;
 }
 function createFeature(p,part,kind,index,x,y,z=0){
  const shape=objects[kind];return Object.freeze({id:p.id+':detail157:'+part+':'+z+':'+index,kind,label:kind,
   x:Math.round(x*100)/100,y:Math.round(y*100)/100,w:shape[0],h:shape[1],
   solid:shape[2],surface:SURFACES.has(kind),z,decor157:true});
 }
 function yard(seed,p,variant,profile){
  const details=[],used=outdoorOccupied(p),pool=variant==='piscine-privee'||variant==='piscine-d-hotel';
  const outdoorKinds=profile.yard.filter(kind=>kind!=='pool');
  // Occupied, serviced sites have more environmental storytelling than a barren yard.
  const target=p.w<15?5:p.w<32?8:11;
  const stockKinds=pool?['pool',...outdoorKinds]:outdoorKinds;
  for(let i=0;i<target;i++){
   let kind=i===0&&pool?'pool':stockKinds[randIndex(stockKinds.length,seed,p.id,variant,'kind',i)];
   const [w,h]=objects[kind];let placed=null;
   // Rectangles use the actual parcel reserve. Search several deterministic slots;
   // never place furniture over a building, an existing resource or a parked vehicle.
   for(let trial=0;trial<24;trial++){
    const lane=randIndex(6,seed,p.id,'lane',i,trial);
    const y=p.h+3.3+(randIndex(1600,seed,p.id,'y',i,trial)/100);
    const x=lane===0?-8.5:lane===1?p.w+3.5:lane===2?1.2:lane===3?p.w-w-1.2:lane===4?p.w/2-w-4.3:p.w/2+3.6;
    const o=createFeature(p,'yard',kind,i,x,y);
    if(validOutdoor(p,o,o.solid,used)){placed=o;break;}
   }
   if(placed){details.push(placed);if(placed.solid)used.push({...bounds(placed),solid:true});}
  }
  // Boundary fences are independent of loot and have a permanently open gate.
  // They do not close the path that permits returning from the garden.
  if(['residence','collective','campagne','education'].includes(familyFor(p.type))){
   const material=randIndex(3,seed,p.id,'boundary')===0?'hedge':'fence';
   const t=material==='fence'?.24:.55,limit=p.h+22,sideH=12;
   const parts=[
    {x:-9.3,y:p.h+8,w:t,h:sideH},{x:p.w+9.3,y:p.h+8,w:t,h:sideH},
    {x:-9.3,y:limit,w:p.w/2+7.2,h:t},
    {x:p.w/2+2.1,y:limit,w:p.w/2+7.3,h:t}
   ];
   for(let i=0;i<parts.length;i++){const rect=parts[i];if(used.some(b=>hit(rect,b,.1)))continue;
    details.push(Object.freeze({id:p.id+':detail157:fence:0:'+i,kind:material,x:rect.x,y:rect.y,w:rect.w,h:rect.h,solid:true,surface:false,z:0,decor157:true,label:'Cloture avec portillon ouvert'}));
   }
  }
  return Object.freeze(details);
 }
 function roomTheme(name,family){
  const n=String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(/bain|eau|vestiaire|linge|lavage|buanderie|plonge/.test(n))return ['laundryBasket','tray','rug','paper'];
  if(/cuisin|repas|fournil|bar|cellier|reserve alimentaire|cuisson/.test(n))return ['tray','basket','fallenStock','paper'];
  if(/chambre|couchage|dortoir|repos/.test(n))return ['rug','smallCabinet','paper','chair'];
  if(/garage|atelier|maintenance|machine|stock|quai|reparation/.test(n))return ['toolbox','palletMark','paper','smallCabinet'];
  if(/soin|consult|medical|pharma|urgence|triage/.test(n))return ['tray','screen','paper','chair'];
  if(/classe|bibliothe|archive|bureau|conseil/.test(n))return ['paper','notice','rug','chair'];
  return profiles[family].interior;
 }
 function interior(seed,p,z,pl){
  const result=[],used=[...(pl.objects||[]),...(pl.walls||[]),...(pl.stairs||[])].map(o=>({...bounds(o),solid:true}));
  const rooms=pl.rooms||[],family=familyFor(p.type);
  for(let r=0;r<rooms.length;r++){const room=rooms[r],kinds=roomTheme(room.name,family);
   for(let k=0;k<2;k++){
    const kind=kinds[randIndex(kinds.length,seed,p.id,z,r,k)],shape=objects[kind];
    for(let a=0;a<12;a++){
     const x=room.x+.7+(randIndex(10000,seed,p.id,z,r,k,a,'x')/10000)*Math.max(0,room.w-shape[0]-1.4);
     const y=room.y+.7+(randIndex(10000,seed,p.id,z,r,k,a,'y')/10000)*Math.max(0,room.h-shape[1]-1.4);
     const o=createFeature(p,'room',kind,r*2+k,x,y,z);
     if(o.x<room.x+.45||o.y<room.y+.45||o.x+o.w>room.x+room.w-.45||o.y+o.h>room.y+room.h-.45)continue;
     if(used.some(q=>hit(o,q,o.solid?.36:.08)))continue;
     // Door centrelines and vertical circulation remain untouched.
     if(o.solid&&Math.abs(o.x+o.w/2-p.w/2)<1.9)continue;
     result.push(o);if(o.solid)used.push({...bounds(o),solid:true});break;
    }
   }
  }
  return Object.freeze(result);
 }
 function make(seed,p,z,plan){
  if(!Number.isInteger(seed)||!p?.id||!Number.isFinite(p.w+p.h)||!Array.isArray(plan?.objects))throw Error('Fiche de detail157 invalide');
  const family=familyFor(p.type),profile=profiles[family],variant=planVariant(seed,p);
  return Object.freeze({family,variant,outdoor:z===0?yard(seed,p,variant,profile):Object.freeze([]),interior:interior(seed,p,z,plan)});
 }
 function validCatalogue(types=G?.PRESETS||[]){
  return {complete:types.every(p=>Object.hasOwn(typeFamily,p.id)&&!!profiles[typeFamily[p.id]]),
   missing:types.filter(p=>!Object.hasOwn(typeFamily,p.id)).map(p=>p.id),families:Object.keys(groups).length,types:Object.keys(typeFamily).length,
   variants:Object.values(profiles).reduce((sum,p)=>sum+p.variants.length,0)};
 }
 // Road markings are spatially seeded, but painted only inside the visible view.
 // Existing asphalt/navigation and every junction remain the source of truth.
 function drawRoads(c,roads,view,seed){
  if(!c||!Array.isArray(roads))return 0;
  let drawn=0;c.save();
  for(const road of roads){
   const dx=road.b.x-road.a.x,dy=road.b.y-road.a.y,len=Math.hypot(dx,dy);
   if(!Number.isFinite(len)||len<12||road.width<5||Math.max(road.a.x,road.b.x)<view.l-5||Math.min(road.a.x,road.b.x)>view.r+5||Math.max(road.a.y,road.b.y)<view.t-5||Math.min(road.a.y,road.b.y)>view.b+5)continue;
   const ux=dx/len,uy=dy/len;
   const profile=randIndex(4,seed,road.id,Math.round(road.a.x),Math.round(road.a.y));
   const stride=profile===0?28:profile===1?42:profile===2?34:52;
   // At most a bounded number of local decals, never one per road metre.
   let seen=0;for(let t=stride/2;t<len-stride/3&&seen<32;t+=stride,seen++){
    const x=road.a.x+ux*t,y=road.a.y+uy*t;
    if(x<view.l-3||x>view.r+3||y<view.t-3||y>view.b+3)continue;
    const side=randIndex(2,seed,road.id,seen)?1:-1;
    c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));
    if(profile===0){c.strokeStyle='rgba(167,166,151,.44)';c.lineWidth=.11;c.strokeRect(-.85,-.65,1.7,1.3);}
    else if(profile===1){c.fillStyle='rgba(40,50,47,.42)';c.beginPath();c.ellipse(0,side*road.width*.26,1.3,.47,0,0,Math.PI*2);c.fill();}
    else if(profile===2){c.strokeStyle='rgba(171,171,147,.35)';c.lineWidth=.07;c.beginPath();c.arc(.2,side*road.width*.25,.44,0,Math.PI*2);c.stroke();}
    else{c.fillStyle='rgba(181,173,141,.30)';c.fillRect(-.8,side*road.width*.28,.85,.11);}
    c.restore();drawn++;
   }
  }
  c.restore();return drawn;
 }
 return Object.freeze({groups,typeFamily,profiles,objects,familyFor,planVariant,make,validCatalogue,drawRoads});
});
