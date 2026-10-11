/* Detailed authored programmes and opt-in furnishing. No resource or RNG ownership. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexRecipes159=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const rows=[
 ['bathroom','Salle d’eau','salle d.eau|salle de bain|sanitaire|douche|toilette',['sink','shower','smallCabinet'],['laundryBasket','rug','tray'],['toilette','miroir','porte-serviettes','ventilation'],.9],
 ['laundry','Buanderie','buanderie|lingerie|laverie|lavage|linge',['laundryBasket','smallCabinet'],['clothesline','tray','basket'],['lave-linge','sèche-linge','table de pliage','lessive'],.9],
 ['kitchen','Cuisine','cuisine|cuisson|fournil|plonge|preparation froide',['worktable','sink'],['tray','basket','countertop','trash'],['réfrigérateur','four','plan de travail','placards','vaisselle'],1.1],
 ['pantry','Cellier et réserve alimentaire','cellier|garde.manger|reserve alimentaire|denree|farine',['bookshelf','crateStack'],['basket','tray','palletMark'],['conserves','sacs de farine','bocaux','stock froid'],.9],
 ['bedroom','Chambre','chambre|couchage|dortoir|repos de garde',['wardrobe','smallCabinet'],['rug','laundryBasket','chair','paper'],['lit','chevet','couverture','rideaux','objets personnels'],.8],
 ['living','Séjour','sejour|salon|vie commune|salle commune',['tv','bookshelf'],['rug','chair','paper','toy'],['canapé','table basse','lampe de lecture','cadres','bibliothèque'],.9],
 ['dining','Repas et restauration','repas|refectoire|cantine|salle de restauration|salle de restaurant|comptoir et repas',['chair','worktable'],['menu','tray','basket','trash'],['tables','chaises','comptoir','plateaux','zone de retour sale'],1.1],
 ['garage','Garage','garage|remise|pneumatique|demonte|mecanique',['worktable','tire'],['toolbox','smallCabinet','barrel'],['outils muraux','roues','huile','rangement de pièces','place de véhicule'],1.2],
 ['workshop','Atelier','atelier|menuiserie|assemblage|debit|production|finition|reparation',['worktable','toolbox'],['pallet','smallCabinet','scrapHeap'],['établi','outils','serre-joints','matières premières','aspiration'],1.2],
 ['medical','Consultation et soins','soins|consultation|infirmer|triage|sterili|medical|dentaire',['sink','smallCabinet'],['tray','screen','chair','paper'],['table de soin','armoire médicale','lavabo','dossiers','zone propre'],1.1],
 ['pharmacy','Pharmacie','pharmacie|officine|medicament',['bookshelf','smallCabinet'],['tray','paper','countertop'],['stock médical','comptoir','zone de préparation','conservation'],1.0],
 ['kennel','Chenil','chenil|animal|veterinaire',['smallCabinet','sink'],['basket','tray','trash'],['enclos','gamelles','réserve d’aliments','espace de soins'],1.1],
 ['classroom','Classe','classe|cours|enseignement|atelier documentaire',['officeDesk','chair'],['bookshelf','paper','notice','toy'],['tables d’élèves','tableau','rangements','matériel pédagogique'],1.1],
 ['library','Bibliothèque et archives','biblioth|archives|collection|litterature|fonds ancien|lecture',['bookshelf','officeDesk'],['chair','paper','notice'],['rayonnages','classement','tables de consultation','chariot de livres'],1.0],
 ['office','Bureau','bureau|conseil|coordination|controle|administration',['officeDesk','chair'],['paper','smallCabinet','notice'],['dossiers','poste de travail','casiers','affichage de service'],.9],
 ['retail','Vente','vente|boutique|rayon|pret|caisse|commerce|conseil client',['display','shelfEnd'],['basket','countertop','fallenStock'],['rayonnages dédiés','caisse','affichage prix','zone client','arrière-boutique'],1.2],
 ['reception','Accueil','accueil|reception|guichet|attente|entree|sas|hall|porche',['bench','sign'],['notice','planter','paper'],['comptoir adapté','assises','affichage','vestiaire','accès principal'],1.2],
 ['storage','Stockage','stock|reserve|box|garde.meuble|tri des colis|entrepot',['crateStack','pallet'],['smallCabinet','palletMark','cart'],['étagères','caisses','palettes','étiquettes','allée de manutention'],1.4],
 ['changing','Vestiaires','vestiaire|rangement personnel',['wardrobe','bench'],['laundryBasket','paper','rug'],['casiers','bancs','portemanteaux','sacs'],1.0],
 ['technical','Local technique','technique|chaufferie|electrique|groupe|pompe|maintenance|ventilation',['worktable','smallCabinet'],['toolbox','sign','barrel'],['coffret','groupe arrêté','outillage','consignes','accès de maintenance'],1.2],
 ['sport','Sport et loisirs','sport|gymnase|plateau|materiel sportif|loisir',['bench','smallCabinet'],['notice','paper','basket'],['aire libre','bancs','matériel rangé','vestiaires'],1.5],
 ['shelter','Abri et secours','abri|refuge|secours|garde|bunker',['bench','crateStack'],['smallCabinet','notice','toolbox'],['couchages','réserve de secours','communication','accès de repli'],1.2],
 ['garden','Jardin','jardin|potager|verger|plantation|serre|pelouse|pature|champ',['cropbed','planter'],['waterButt','compost','flowerbed'],['terre','végétation','irrigation','clôture avec accès','remise'],1.4],
 ['loading','Cour de livraison','quai|livraison|cour de service|manutention|chargement',['pallet','cart'],['crateStack','sign','trash'],['quai','palette','rampe','allée de service','zone déchets'],1.8],
 ['road','Route et ouvrages','route|chaussee|carrefour|pont|bretelle|tunnel|giratoire|chemin',['sign','bollard'],['palletMark','paper'],['chaussée','accotements','raccords','marquages','visibilité des intersections'],2.0],
 ['exterior','Espaces extérieurs','cour|parvis|parking|terrasse|allee|exterieur',['bench','planter'],['bikeRack','trash','sign'],['sol adapté','accès piéton','stationnement','bordures','éclairage justifié'],1.5],
 ['generic','Espace de service','.*',['smallCabinet','chair'],['paper','notice','tray'],['circulation','usage identifiable','rangement','traces d’activité'],1.0]
 ];
 const KITS=freeze(Object.fromEntries(rows.map(([id,label,match,primary,optional,inventory,clearance])=>[id,{id,label,match,primary,optional,inventory,clearance}])));
 const compiledMatches=rows.map(row=>[row[0],new RegExp(row[2])]);
 const GARDENS=freeze([
 {id:'fleurs',name:'Jardin fleuri',modules:['flowerbed','planter','bench'],minArea:20},
 {id:'potager',name:'Potager productif',modules:['cropbed','compost','waterButt'],minArea:28},
 {id:'terrasse',name:'Terrasse de repas',modules:['patio','barbecue','bench'],minArea:32},
 {id:'jeux',name:'Jardin familial',modules:['playset','bench','toy'],minArea:32},
 {id:'verger',name:'Petit verger',modules:['tree','waterButt','bench'],minArea:40},
 {id:'piscine',name:'Piscine et plage',modules:['pool','patio','bench'],minArea:85,unique:'pool'},
 {id:'serre',name:'Serre de jardin',modules:['greenhouse','cropbed','waterButt'],minArea:45},
 {id:'atelier',name:'Cour de bricolage',modules:['shed','worktable','toolbox'],minArea:42},
 {id:'linge',name:'Cour et étendoir',modules:['clothesline','laundryBasket','planter'],minArea:18},
 {id:'friche',name:'Jardin en friche',modules:['hedge','flowerbed','compost'],minArea:24},
 {id:'partage',name:'Jardin partagé',modules:['cropbed','bench','bikeRack'],minArea:40},
 {id:'repos',name:'Cour de repos',modules:['bench','planter','canopy'],minArea:25}
 ]);
 const YARDS=freeze({
 residence:['flowerbed','planter','waterButt','clothesline','bench','shed'],collective:['bench','bikeRack','planter','trash'],
 alimentation:['cart','pallet','crateStack','trash'],restauration:['patio','bench','trash','planter'],hebergement:['bench','patio','planter','laundryLine'],
 magasins:['cart','pallet','sign','planter'],medical:['bench','sign','trash','planter'],administration:['bench','bikeRack','sign','planter'],
 education:['playset','bench','bikeRack','sign'],loisirs:['bench','bikeRack','planter','trash'],artisanat:['worktable','tire','toolbox','pallet'],
 logistique:['pallet','cart','crateStack','container'],industrie:['pallet','barrel','worktable','scrapHeap'],campagne:['cropbed','compost','waterButt','greenhouse'],
 reseaux:['bollard','sign','worktable','barrel'],securite:['bollard','sign','crateStack','bench'],ruines:['scrapHeap','flowerbed','hedge','trash']
 });
 const EXTRA_SHAPES=freeze({greenhouse:[3.4,2.8,true],shower:[1.05,1.05,true],sink:[.8,.65,true],wardrobe:[1.2,.65,true],bookshelf:[2.4,.7,true],officeDesk:[1.4,.7,true]});
 const RULES=freeze({version:2,maxExtra:32,roomSlots:4,yardSlots:10,attempts:12,grid:.4,radius:.34,maxGridCells:120000});
 function kitFor(name){return KITS[compiledMatches.find(([,regex])=>regex.test(norm(name)))[0]];}
 const external=name=>/^(jardin|potager|verger|cour|parvis|parking|terrasse|champ|pature|allee|chemin|quai|plage|berge|voie|route|pont|exterieur)/.test(norm(name));
 /* Compile all authored rooms and props; do not cap the original programme to a UI limit. */
 function compile(originals,states){
  const parents={},assets=[],assetIndex=new Map();let roomCount=0,exteriorCount=0,authoredProps=0;
  for(const p of originals){const source=p.espaces||p.zones||[];const rooms=source.map((s,i)=>{
   const name=String(s.nom??s.zone??s.name??s);const authored=Array.isArray(s.props);const propIds=(s.props||[]).map(prop=>{
    const key=JSON.stringify(prop);if(!assetIndex.has(key)){assetIndex.set(key,assets.length);assets.push(prop);}authoredProps++;return assetIndex.get(key);
   });const outside=s.exterieur===undefined?external(name):s.exterieur;
   roomCount++;if(outside)exteriorCount++;
   return {id:s.id||p.id+'/zone-'+(i+1),name,exterior:outside,classificationSource:s.exterieur===undefined?'inference':'authored',
    levels:s.niveaux_candidats||null,area:s.surface_unitaire_m2||null,repeat:s.repetitions||[1,1],
    resource:s.ressource_dominante||null,props:propIds,kit:kitFor(name).id,
    required:s.required||[],optional:s.optional||[],placement:s.placement||'',furnishingSource:authored?'authored+kit':'kit-extension'};
  });parents[p.id]={rooms,access:p.graphe_acces||[],plot:p.parcelle||{footprint:p.footprint_m,floors:p.floors,placement:p.placement},
   exterior:p.exterior||null,loot:p.loot||null,postFall:p.etat_post_chute||p.visit_state||null};
  }
  return {version:1,parents,assets,states:Object.fromEntries(states.map(s=>[s.id,s])),metrics:{parents:Object.keys(parents).length,rooms:roomCount,exteriorSpaces:exteriorCount,authoredPropReferences:authoredProps,uniquePropSpecs:assets.length}};
 }
 const decoded=new WeakMap();
 function unpack(value,strings){
  if(value&&typeof value==='object'){
   if(Object.keys(value).length===1&&Number.isInteger(value.$text))return strings[value.$text];
   if(Array.isArray(value))return value.map(v=>unpack(v,strings));
   return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,unpack(v,strings)]));
  }
  return value;
 }
 function sourceFor(details,id){
  let cache=decoded.get(details);if(!cache){cache=new Map();decoded.set(details,cache);}
  if(cache.has(id)){const v=cache.get(id);cache.delete(id);cache.set(id,v);return v;}
  const source=unpack(details.parents[id],details.strings||[]);cache.set(id,source);
  if(cache.size>64)cache.delete(cache.keys().next().value);return source;
 }
 function compact(details){
  const counts=new Map();const walk=v=>{if(typeof v==='string'&&v.length>35)counts.set(v,(counts.get(v)||0)+1);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};walk(details);
  const strings=[...counts].filter(([,n])=>n>1).map(([s])=>s),ids=new Map(strings.map((s,i)=>[s,i]));
  const pack=v=>{if(typeof v==='string'&&ids.has(v))return {$text:ids.get(v)};if(Array.isArray(v))return v.map(pack);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,pack(x)]));return v;};
  return {...pack(details),strings};
 }
 function describe(id,data=root.DeadwallCodex3000Data,runtime=root.DeadwallCodex3000Runtime){
  const record=runtime?.get(id);if(!record)throw Error('Programme inconnu : '+id);
  const details=data?.details159,source=details?.parents?.[record.parent]?sourceFor(details,record.parent):null;if(!source)throw Error('Programme détaillé non compilé : '+record.parent);
  return freeze({id:record.id,parent:record.parent,name:record.name,family:record.family,module:record.module,state:record.state,
   rooms:source.rooms.map(room=>({...room,kit:KITS[room.kit],authoredProps:room.props.map(i=>unpack(details.assets[i],details.strings||[]))})),
   exteriorOptions:YARDS[runtime.detailFamily(record.family)]||YARDS.magasins,
   gardenOptions:['residence','collective','campagne','hebergement'].includes(runtime.detailFamily(record.family))?GARDENS:[],
   access:source.access,plot:source.plot,loot:source.loot,exterior:source.exterior,
   causal:unpack(details.states[record.state]||null,details.strings||[]),postFall:source.postFall,
   implementation:'Programme détaillé; matériel non supporté conservé comme prescription, jamais remplacé silencieusement.'});
 }
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 /* Raster audit uses a conservative foot clearance. Existing reachable interaction
    anchors must remain reachable; an unavailable baseline is never called validated. */
 function accessGrid(p,z,plan,details,extra=[]){
  const cell=RULES.grid,pad=z===0?12:0,left=-pad,top=z===0?-16:0,right=p.w+pad,bottom=p.h+(z===0?25:0),cols=Math.ceil((right-left)/cell),rows=Math.ceil((bottom-top)/cell),size=rows*cols;
  if(size>RULES.maxGridCells)return null;
  const blocked=new Uint8Array(size),radius=RULES.radius,solids=[...plan.walls,...plan.objects,...details.interior.filter(o=>o.solid),...extra.filter(o=>o.solid)];
  if(z===0)solids.push(...(p.outdoor||[]),...details.outdoor.filter(o=>o.solid));
  for(const o of solids){const x0=Math.max(0,Math.ceil((o.x-radius-left)/cell-.5)),x1=Math.min(cols-1,Math.floor((o.x+o.w+radius-left)/cell-.5)),y0=Math.max(0,Math.ceil((o.y-radius-top)/cell-.5)),y1=Math.min(rows-1,Math.floor((o.y+o.h+radius-top)/cell-.5));
   if(x0>x1||y0>y1)continue;
   for(let y=y0;y<=y1;y++)blocked.fill(1,y*cols+x0,y*cols+x1+1);
  }
  const at=(x,y)=>{const cx=Math.floor((x-left)/cell),cy=Math.floor((y-top)/cell);return cx<0||cy<0||cx>=cols||cy>=rows?-1:cy*cols+cx;};
  const stair=plan.stairs[0],start=z!==0&&stair?at(stair.x+stair.w/2,stair.y+stair.h/2):at(p.w/2,z===0?-1:1);
  if(start<0||blocked[start])return {reachable:new Uint8Array(size),at,baseline:false};
  const reachable=new Uint8Array(size),queue=new Int32Array(size);let head=0,tail=1;queue[0]=start;reachable[start]=1;
  while(head<tail){const id=queue[head++],x=id%cols,y=(id-x)/cols;for(const n of [x>0?id-1:-1,x+1<cols?id+1:-1,y>0?id-cols:-1,y+1<rows?id+cols:-1])if(n>=0&&!blocked[n]&&!reachable[n]){reachable[n]=1;queue[tail++]=n;}}
  return {reachable,at,baseline:true};
 }
 function anchorCells(p,z,plan,base){
  if(!base?.baseline)return [];
  const points=[[p.w/2,1],[p.w/2,p.h-1]];
  for(const r of plan.rooms)points.push([r.x+r.w/2,r.y+r.h/2]);
  for(const r of plan.stairs)points.push([r.x+r.w/2,r.y+r.h/2]);
  for(const o of plan.objects)for(const [x,y]of [[o.x-.9,o.y+o.h/2],[o.x+o.w+.9,o.y+o.h/2],[o.x+o.w/2,o.y-.9],[o.x+o.w/2,o.y+o.h+.9]])points.push([x,y]);
  if(z===0)points.push([p.w/2,p.h+23]);
  return [...new Set(points.map(([x,y])=>base.at(x,y)).filter(i=>i>=0&&base.reachable[i]))];
 }
 function enrich({seed,p,z,plan,detail,programme,geometry,shapes,data,runtime}){
  const description=describe(programme||p.codex,data,runtime),shapeBy={...shapes,...EXTRA_SHAPES},hash=(...xs)=>geometry.hash('recipe159',seed,p.id,z,...xs),extras=[],rejected=[];
  const occupied=[...plan.walls,...plan.objects,...plan.stairs,...detail.interior,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])];
  const sourceByName=new Map(description.rooms.map(r=>[norm(r.name),r]));
  function add(kind,slot,poses,room){
   const shape=shapeBy[kind];if(!shape){rejected.push({slot,reason:'unsupported-asset',kind});return;}
   const [w,h,solid]=shape;
   for(const [x,y] of poses){
    if(!Number.isFinite(x+y)||x+w>p.w+11||x< -11||y< -15||y+h>p.h+24)continue;
    const o={id:p.id+':recipe159:'+z+':'+slot,kind,x:+x.toFixed(3),y:+y.toFixed(3),w,h,solid,surface:!solid,z,decor157:true,recipe159:true,label:kind,room:room?.name||'Cour',programme:description.id};
    if(occupied.some(b=>hit(o,b,solid?.45:.12))||extras.some(b=>hit(o,b,.25)))continue;
    if(room){if(x<room.x+.45||y<room.y+.45||x+w>room.x+room.w-.45||y+h>room.y+room.h-.45)continue;
     if(solid&&hit(o,{x:room.x,y:room.y+room.h/2-.8,w:room.w,h:1.6},.15))continue;
    }else{
     if(hit(o,{x:-1,y:-1,w:p.w+2,h:p.h+2},.3)||hit(o,{x:p.w/2-2,y:-16,w:4,h:p.h+42},.3))continue;
     if((p.parking||[]).some(car=>{const q=geometry.local(p,car.x,car.y),r=Math.hypot(car.w,car.h)/2+.75;return hit(o,{x:q.x-r,y:q.y-r,w:r*2,h:r*2},.1);}))continue;
    }
    extras.push(o);return;
   }
   rejected.push({slot,kind,reason:'no-free-space'});
  }
  for(let i=0;i<plan.rooms.length&&extras.length<RULES.maxExtra;i++){
   const room=plan.rooms[i],source=sourceByName.get(norm(room.name)),kit=source?.kit||kitFor(room.name);
   if(source?.exterior||['garden','exterior','road','loading'].includes(kit.id))continue;
   const pool=[...kit.primary,...kit.optional];
   for(let n=0;n<RULES.roomSlots&&extras.length<RULES.maxExtra;n++){
    const kind=pool[(hash('room',i)+n)%pool.length],shape=shapeBy[kind];if(!shape)continue;
    const positions=Array.from({length:RULES.attempts},(_,trial)=>{const side=trial%4,j=(hash(i,n,trial)%1000)/1000;return [side<2?room.x+.6:room.x+room.w-shape[0]-.6,room.y+.6+j*Math.max(0,room.h-shape[1]-1.2)];});
    add(kind,'r'+i+'-'+n,positions,room);
   }
  }
  if(z===0){
   const family=runtime.detailFamily(description.family),yardArea=(p.w+18)*18;
   const gardens=description.gardenOptions.filter(v=>v.minArea<=yardArea&&(v.unique!=='pool'||p.w>=18)&&(!v.unique||!detail.outdoor.some(o=>o.kind===v.unique)));
   const garden=gardens.length?gardens[hash('garden')%gardens.length]:null;
   const pool=[...(garden?.modules||[]),...(YARDS[family]||YARDS.magasins)];
   // A site's existing pool and primary garden choice are not overwritten.
   const candidates=pool.filter(k=>!detail.outdoor.some(o=>o.kind===k&&['pool','shed','greenhouse','playset'].includes(k)));
   for(let n=0;n<RULES.yardSlots&&extras.length<RULES.maxExtra;n++){
    const kind=candidates[n%candidates.length];if(!kind||extras.some(o=>o.kind===kind&&['pool','greenhouse','shed','playset'].includes(kind)))continue;
    const poses=Array.from({length:RULES.attempts},(_,trial)=>[-8+(hash(n,trial,'x')%1000)/1000*(p.w+16),(p.h+3)+(hash(n,trial,'y')%1000)/1000*17]);
    add(kind,'y'+n,poses,null);
   }
  }
  const base=accessGrid(p,z,plan,detail),anchors=anchorCells(p,z,plan,base);let dropped=0,current;
  // Work backwards deterministically if a fixture severs any established access.
  while(true){current=accessGrid(p,z,plan,detail,extras);if(current?.baseline&&anchors.every(i=>current.reachable[i]))break;
   const n=extras.findLastIndex(o=>o.solid);if(n<0)break;rejected.push({slot:extras[n].id,reason:'navigation'});extras.splice(n,1);dropped++;
  }
  const indoor=extras.filter(o=>!o.id.includes(':y')),outdoor=extras.filter(o=>o.id.includes(':y'));
  return freeze({...detail,interior:[...detail.interior,...indoor],outdoor:[...detail.outdoor,...outdoor],recipe159:{version:2,programme:description.id,added:extras.length,rejected:rejected.length,navigationRejected:dropped,anchors:anchors.length,navigationChecked:!!base?.baseline&&!!current?.baseline,kitCount:KITS?Object.keys(KITS).length:0}});
 }
 return freeze({KITS,GARDENS,YARDS,EXTRA_SHAPES,RULES,kitFor,compile,compact,describe,enrich,accessGrid,anchorCells});
});
