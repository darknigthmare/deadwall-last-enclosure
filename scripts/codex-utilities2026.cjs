'use strict';
const Reference = require('./codex-world-foundations2026.cjs');
// BEGIN AUTHOR CORE
const RULES = Object.freeze({version:1,variants:50,corridorM:2.4,wallM:.2,doorM:1.4,pathM:1.4,serviceRoadM:6,
  plotWidthM:440,plotLengthM:430,widthStepM:20,lengthStepM:18,streetStepM:120});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const PROFILES=freeze({
 'EXT-MONDE-T057':{name:'Centrale thermique',process:'combustible → chaudière → vapeur → alternateur → refroidissement',medium:'thermal',
  rooms:['contrôle chaudière','contrôle alternateur','atelier moteurs','réserve outillage de turbine'],hall:'Salle de conduite thermique',height:12,
  assets:[['fuel-storage','Stockage combustible fermé',42,34,8,false],['boiler-block','Bloc chaudière fermé',58,54,24,false],['steam-turbine','Groupe turboalternateur fermé',54,32,10,false],['cooling-basin','Bassin de refroidissement',60,56,3,true],['flue-treatment','Traitement des fumées fermé',32,38,16,false],['switchyard-transformer','Transformateur de sortie fermé',24,20,4,false]],
  roles:['combustible','chaudière','alternateur','refroidissement','fumées','réseau']},
 'EXT-MONDE-T058':{name:'Centrale hydroélectrique',process:'prise amont → conduite réservée → turbine → restitution aval',medium:'freshwater',
  rooms:['contrôle prise amont','atelier turbine hydraulique','local pompes de drainage','tableau de distribution électrique'],hall:'Maison de conduite hydroélectrique',height:9,
  assets:[['headrace-basin','Bassin amont clos',64,68,5,true],['penstock-gallery','Conduite forcée fermée',26,54,5,false],['hydraulic-turbine','Groupe hydraulique fermé',54,40,8,false],['tailrace-basin','Bassin de restitution aval clos',64,68,3,true],['switchyard-transformer','Transformateur de sortie fermé',24,20,4,false]],
  roles:['amont','conduite','turbine','aval','réseau']},
 'EXT-MONDE-T059':{name:'Poste électrique régional',process:'arrivée haute tension → transformation → départs régionaux',medium:'electrical',
  rooms:['contrôle lignes entrantes','tableau de distribution électrique','local batteries','réserve isolateurs'],hall:'Bâtiment de commande du poste',height:5,
  assets:[['incoming-switchgear','Travée d’arrivée consignée',48,30,6,false],['power-transformer','Transformateur principal A consigné',28,22,5,false],['power-transformer','Transformateur principal B consigné',28,22,5,false],['outgoing-switchgear','Travées de départ consignées',56,32,6,false],['reactor-bank','Réactance fermée',28,26,5,false],['oil-retention','Rétention huile inaccessible',44,32,2,false]],
  roles:['arrivée','transformation A','transformation B','départs','réactance','rétention']},
 'EXT-MONDE-T061':{name:'Station d’épuration urbaine',process:'dégrillage → décantation → aération → clarification → boues',medium:'wastewater',
  rooms:['contrôle dégrillage','local pompes de relevage','atelier analyses des eaux','réserve échantillons'],hall:'Exploitation des eaux usées',height:5,
  assets:[['screening-channel','Canal de dégrillage clos',32,44,2,true],['primary-settler','Décanteur primaire clos',58,58,3,true],['aeration-basin','Bassin d’aération clos',64,64,4,true],['secondary-clarifier','Clarificateur clos',58,58,3,true],['sludge-digester','Digesteur fermé',36,36,12,false],['sludge-storage','Stockage boues fermé',42,34,5,false]],
  roles:['dégrillage','décantation','aération','clarification','digestion','boues']},
 'EXT-MONDE-T062':{name:'Station de lagunage',process:'prétraitement → lagune primaire → lagune secondaire → finition',medium:'wastewater',
  rooms:['contrôle entrée lagunage','local pompes de transfert','atelier analyses des lagunes','réserve entretien des berges'],hall:'Exploitation du lagunage',height:4.5,
  assets:[['screening-channel','Prétraitement clos',32,38,2,true],['primary-lagoon','Lagune primaire close',66,72,2,true],['secondary-lagoon','Lagune secondaire close',66,72,2,true],['polishing-lagoon','Lagune de finition close',66,72,2,true],['reed-treatment-bed','Lit planté clos',60,60,1.5,true]],
  roles:['prétraitement','lagune primaire','lagune secondaire','finition','lit planté']},
 'EXT-MONDE-T063':{name:'Traitement des eaux industrielles',process:'égalisation → neutralisation → séparation → filtration → contrôle',medium:'industrial-water',
  rooms:['contrôle égalisation','local pompes de dosage','atelier analyses industrielles','réserve réactifs conditionnés'],hall:'Conduite des eaux industrielles',height:5.5,
  assets:[['equalization-basin','Bassin d’égalisation clos',60,60,4,true],['neutralization-tanks','Cuves de neutralisation fermées',38,36,5,false],['physicochemical-separator','Séparateur fermé',44,42,5,false],['closed-filter-bank','Filtres fermés',44,30,4,false],['treated-water-basin','Bassin d’eaux traitées clos',58,60,3,true],['sludge-dewatering','Déshydratation fermée',40,30,5,false]],
  roles:['égalisation','neutralisation','séparation','filtration','contrôle','boues']},
 'EXT-MONDE-T064':{name:'Usine de potabilisation',process:'eau brute → coagulation → décantation → filtration → désinfection → réservoir',medium:'raw-to-drinking-water',
  rooms:['contrôle eau brute','local pompes de distribution','atelier analyses de potabilité','réserve échantillons de contrôle'],hall:'Exploitation de la potabilisation',height:5.5,
  assets:[['raw-water-basin','Bassin eau brute clos',60,60,4,true],['coagulation-tanks','Coagulation fermée',38,32,5,false],['settling-basin','Décantation close',58,58,3,true],['closed-sand-filters','Filtres à sable fermés',48,36,4,false],['disinfection-chamber','Désinfection fermée',32,30,4,false],['drinking-water-reservoir','Réservoir eau traitée fermé',64,64,6,false]],
  roles:['eau brute','coagulation','décantation','filtration','désinfection','réservoir']}
});
const TYPES=Object.freeze(Object.keys(PROFILES));
const ARRANGEMENTS=freeze([[0,1,2,3,4],[1,0,3,2,4],[2,3,0,1,4],[3,2,1,0,4],[0,2,4,1,3],
 [1,3,4,0,2],[4,0,1,2,3],[4,1,0,3,2],[2,4,3,0,1],[3,4,2,1,0]]);
const DIAGRAMS=freeze({
 'EXT-MONDE-T057':[[0,1,'combustible'],[1,2,'vapeur'],[2,3,'condensat'],[3,1,'eau de retour'],[1,4,'fumées'],[2,5,'électricité']],
 'EXT-MONDE-T058':[[0,1,'eau amont'],[1,2,'eau sous pression'],[2,3,'eau aval'],[2,4,'électricité']],
 'EXT-MONDE-T059':[[0,1,'électricité'],[0,2,'électricité'],[1,3,'électricité'],[2,3,'électricité'],[3,4,'compensation électrique']],
 'EXT-MONDE-T061':[[0,1,'eaux usées'],[1,2,'eaux décantées'],[2,3,'eaux aérées'],[1,4,'boues primaires'],[3,4,'boues secondaires'],[4,5,'boues digérées']],
 'EXT-MONDE-T062':[[0,1,'eaux prétraitées'],[1,2,'eaux de lagunage'],[2,3,'eaux de finition'],[3,4,'polissage végétal']],
 'EXT-MONDE-T063':[[0,1,'eaux égalisées'],[1,2,'eaux neutralisées'],[2,3,'eaux séparées'],[3,4,'eaux filtrées'],[2,5,'boues séparées']],
 'EXT-MONDE-T064':[[0,1,'eau brute'],[1,2,'eau coagulée'],[2,3,'eau décantée'],[3,4,'eau filtrée'],[4,5,'eau désinfectée']]
});
function build(type,number){
 if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie ou variante eau-énergie invalide.');
 const p=PROFILES[type],tier=Math.floor((number-1)/10),layout=(number-1)%10;
 const id=type+'-V'+String(number).padStart(2,'0'),W=RULES.plotWidthM+tier*RULES.widthStepM,H=RULES.plotLengthM+tier*RULES.lengthStepM;
 const plan={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
  authorFamily:'utilities',name:p.name,sourceIds:[],heightOrigin:'author-design',maxHeightM:0,
  configuration:{sizeTier:tier+1,arrangement:layout+1,process:p.process,medium:p.medium},
  designAssumptions:['Emprises, hauteurs et espacements sont des choix auteur originaux en mètres, sans relevé ni conformité technique revendiquée.',
   'Les bassins et appareils sont des volumes fermés infranchissables. Aucun chemin ne passe sur l’eau et aucune passerelle fictive n’est créée.',
   'L’ordre de procédé indique une intention de composition ; tuyauterie, sécurité, débit, énergie et réactions ne sont pas simulés.'],
  bounds:{x:0,y:0,w:W,h:H},buildings:[],structures:[],reservedAreas:[],outdoorAreas:[],network:{nodes:[],edges:[],externalPorts:[]},
  processFlow:{scope:'author-process-intent-only',stages:[],links:[],recipesActive:false},
  processDiagram:{scope:'author-process-diagram-not-simulated',operational:false,links:[]},
  operations:{lootContainersCreated:0,connectedServices:0,productionRecipes:0,outputCreated:0},
  unresolved:['implantation dans le seed et continuité du terrain','raccords hydrauliques et électriques réels','procédés, intrants finis, temps, énergie et sorties payés',
   'sécurité des installations et accès véhicules','rencontres, art définitif et états de fonctionnement','persistance et qualification de campagne']};
 const nodes=new Map(),lanes=new Map();
 function node(key,x,y){if(nodes.has(key))throw Error('Borne eau-énergie répétée.');const n={id:id+':'+key,x,y,z:0};nodes.set(key,n);plan.network.nodes.push(n);return key;}
 function edge(a,b,mode='service'){if(!nodes.has(a)||!nodes.has(b)||a===b)throw Error('Liaison eau-énergie invalide.');plan.network.edges.push({id:id+':edge:'+plan.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,widthM:mode==='service'?RULES.serviceRoadM:RULES.pathM,mode,level:0});}
 function lane(key,x,y){if(!lanes.has(y))lanes.set(y,[]);const old=lanes.get(y).find(k=>Math.abs(nodes.get(k).x-x)<1e-8);if(old)return old;node(key,x,y);lanes.get(y).push(key);return key;}
 node('entrance',18,0);node('exit',W-18,H);
 for(let row=0;row<=3;row++){
  const y=20+row*RULES.streetStepM,west=lane('street:'+row+':west',18,y),east=lane('street:'+row+':east',W-18,y);
  if(row){edge('street:'+(row-1)+':west',west);edge('street:'+(row-1)+':east',east);}
 }
 edge('entrance','street:0:west');edge('street:3:east','exit');
 plan.network.externalPorts.push({node:nodes.get('entrance').id,requires:'service-road',connectedToWorld:false},{node:nodes.get('exit').id,requires:'service-road',connectedToWorld:false});
 const facilities=[
  {role:'administration',name:'Administration et accueil',w:34,h:30,height:3.8,rooms:['accueil','bureau exploitation','réunion équipe','archives']},
  {role:'welfare',name:'Locaux du personnel',w:40,h:40,height:3.6,rooms:['vestiaires A','vestiaires B','douches','sanitaires','réfectoire','cuisine']},
  {role:'maintenance',name:'Atelier de maintenance',w:40,h:34,height:5,rooms:['atelier maintenance','réserve pièces détachées','local nettoyage','atelier outillage']},
  {role:'utilities',name:'Alimentations auxiliaires',w:36,h:32,height:4.4,rooms:['tableau de distribution électrique','groupe de secours','local pompes auxiliaires','contrôle énergie']},
  {role:'process-control',name:p.hall,w:50,h:42,height:p.height,rooms:p.rooms}
 ];
 for(let position=0;position<5;position++){
  const f=facilities[ARRANGEMENTS[layout][position]],row=Math.floor(position/2),column=position%2;
  const w=f.w+tier*2,h=f.h+tier*1.5,x=34+column*88+(64-w)/2,y=40+row*RULES.streetStepM;
  const face=(row+column+layout)%2?'south':'north',heightM=f.height+tier*.2;
  const b={id:id+':building:'+f.role,kind:f.role,name:f.name,role:f.role,x,y,w,h,rotationRad:0,entrySide:face,heightM,heightOrigin:'author-design',footprintOrigin:'author-design',levels:[0],rooms:[],portals:[],entry:{x:w/2,y:face==='north'?0:h,level:0,widthM:RULES.doorM}};
  const cw=RULES.corridorM,wall=RULES.wallM,rows=f.rooms.length/2;
  const corridor={id:b.id+':circulation',name:'circulation',kind:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:heightM-.4};b.rooms.push(corridor);
  for(let i=0;i<f.rooms.length;i++){
   const east=i%2===1,band=Math.floor(i/2),r={id:b.id+':room:'+i,name:f.rooms[i],x:east?(w+cw)/2+wall:wall,y:band*h/rows+wall,w:(w-cw)/2-2*wall,h:h/rows-2*wall,level:0,clearHeightM:heightM-.4};
   b.rooms.push(r);b.portals.push({id:r.id+':door',from:corridor.id,to:r.id,x:east?corridor.x+cw:corridor.x,y:r.y+r.h/2,widthM:RULES.doorM,wallGapM:wall,axis:'y'});
  }
  plan.buildings.push(b);
  const approach=lane('building:'+f.role+':approach',x+w/2,20+(row+(face==='south'?1:0))*RULES.streetStepM);
  const entry=node('building:'+f.role+':entry',x+w/2,y+b.entry.y);edge(approach,entry,'pedestrian');
 }
 for(let i=0;i<p.assets.length;i++){
  const [kind,name,baseW,baseH,baseHeight,water]=p.assets[i],row=Math.floor(i/2),column=i%2;
  const w=baseW+tier*2,h=baseH+tier*2,swivel=layout>=5,x=240+column*92+(76-w)/2+(layout%5)*1.2,y=48+row*RULES.streetStepM+(layout%5)*2;
  const s={id:id+':structure:process:'+i,kind,name,x,y,w:swivel?h:w,h:swivel?w:h,maxHeightM:baseHeight,heightOrigin:'author-design',footprintOrigin:'author-design',water,walkable:false,interiorStatus:'closed-equipment',lootAssigned:false,utilityConnected:false,role:p.roles[i]};
  plan.structures.push(s);
  const approach=lane('process:'+i+':approach',s.x+s.w/2,20+row*RULES.streetStepM),stop=node('process:'+i+':stop',s.x+s.w/2,s.y-2);edge(approach,stop,'pedestrian');
  plan.processFlow.stages.push({order:i+1,role:s.role,structure:s.id,serviceNode:nodes.get(stop).id});
 }
 plan.processDiagram.links=DIAGRAMS[type].map(([from,to,medium])=>({from:plan.structures[from].id,to:plan.structures[to].id,medium,operational:false}));
 // Services form dry strips around closed volumes. Their graph is the actual
 // collision-tested inspection network, not a drawn process shortcut.
 for(const keys of lanes.values()){keys.sort((a,b)=>nodes.get(a).x-nodes.get(b).x);for(let i=1;i<keys.length;i++)edge(keys[i-1],keys[i]);}
 const adjacent=new Map(plan.network.nodes.map(n=>[n.id,[]]));for(const e of plan.network.edges){adjacent.get(e.from).push(e.to);adjacent.get(e.to).push(e.from);}
 function route(from,to){const q=[from],previous=new Map([[from,null]]);for(let i=0;i<q.length&&!previous.has(to);i++)for(const n of adjacent.get(q[i]))if(!previous.has(n)){previous.set(n,q[i]);q.push(n);}if(!previous.has(to))throw Error('Accès procédé absent.');const out=[];for(let at=to;at!==null;at=previous.get(at))out.push(at);return out.reverse();}
 for(let i=1;i<plan.processFlow.stages.length;i++){const a=plan.processFlow.stages[i-1],b=plan.processFlow.stages[i];plan.processFlow.links.push({from:a.structure,to:b.structure,route:route(a.serviceNode,b.serviceNode),mode:'pedestrian-inspection',operational:false});}
 plan.maxHeightM=Math.max(...plan.buildings.map(b=>b.heightM),...plan.structures.map(s=>s.maxHeightM));
 return freeze(plan);
}
function audit(plan){
 const base=Reference.audit(plan),errors=[...base.errors],fail=c=>errors.push(c);
 try{
  const profile=PROFILES[plan.type];
  if(!profile||!Number.isInteger(plan.number)||plan.number<1||plan.number>RULES.variants||plan.id!==plan.type+'-V'+String(plan.number).padStart(2,'0'))fail('utility-identity');
  if(plan.sourceIds.length||plan.heightOrigin!=='author-design'||!plan.designAssumptions.some(s=>s.includes('choix auteur')))fail('utility-provenance');
  if(plan.buildings.length!==5||new Set(plan.buildings.map(b=>b.role)).size!==5||plan.structures.length!==profile.assets.length)fail('utility-programme');
  if(plan.configuration.process!==profile.process||plan.configuration.medium!==profile.medium)fail('utility-process-profile');
  const flow=plan.processFlow,nodes=new Map(plan.network.nodes.map(n=>[n.id,n]));
  if(flow.scope!=='author-process-intent-only'||flow.recipesActive!==false||flow.stages.length!==profile.assets.length||flow.links.length!==profile.assets.length-1)fail('utility-process-scope');
  for(let i=0;i<flow.stages.length;i++){
   const stage=flow.stages[i],s=plan.structures.find(s=>s.id===stage.structure),n=nodes.get(stage.serviceNode);
   if(stage.order!==i+1||stage.role!==profile.roles[i]||!s||!n||Math.abs(n.x-s.x-s.w/2)>1e-8||Math.abs(n.y-s.y+2)>1e-8)fail('utility-service-stop');
  }
  for(let i=0;i<flow.links.length;i++){
   const link=flow.links[i],from=flow.stages[i],to=flow.stages[i+1];
   if(link.from!==from.structure||link.to!==to.structure||link.operational!==false||link.mode!=='pedestrian-inspection'||!Array.isArray(link.route)||link.route.length<2||link.route[0]!==from.serviceNode||link.route.at(-1)!==to.serviceNode||new Set(link.route).size!==link.route.length){fail('utility-service-route');continue;}
   for(let j=1;j<link.route.length;j++)if(!plan.network.edges.some(e=>e.from===link.route[j-1]&&e.to===link.route[j]||e.to===link.route[j-1]&&e.from===link.route[j]))fail('utility-service-route');
  }
  const expectedDiagram=DIAGRAMS[plan.type].map(([from,to,medium])=>({from:plan.structures[from].id,to:plan.structures[to].id,medium,operational:false}));
  if(plan.processDiagram.scope!=='author-process-diagram-not-simulated'||plan.processDiagram.operational!==false||JSON.stringify(plan.processDiagram.links)!==JSON.stringify(expectedDiagram))fail('utility-process-diagram');
  for(let i=0;i<plan.structures.length;i++){
   const s=plan.structures[i],asset=profile.assets[i];
   if(s.kind!==asset[0]||s.name!==asset[1]||s.role!==profile.roles[i]||s.water!==asset[5]||s.walkable!==false||s.interiorStatus!=='closed-equipment'||!Number.isFinite(s.maxHeightM)||s.maxHeightM<=0||s.maxHeightM>plan.maxHeightM||s.heightOrigin!=='author-design')fail('utility-closed-equipment');
  }
  for(const s of [...plan.structures,...plan.reservedAreas,...plan.outdoorAreas])if(s.lootAssigned!==false||s.utilityConnected!==false||Object.hasOwn(s,'amount')||Object.hasOwn(s,'resource'))fail('false-utility-stock-or-service');
  const operations=['lootContainersCreated','connectedServices','productionRecipes','outputCreated'];
  if(JSON.stringify(Object.keys(plan.operations).sort())!==JSON.stringify([...operations].sort())||operations.some(k=>plan.operations[k]!==0))fail('false-utility-production');
 }catch{fail('utility-schema');}
 return {...base,ok:errors.length===0,errors:[...new Set(errors)]};
}
function auditAll(){const records=[];for(const type of TYPES)for(let number=1;number<=RULES.variants;number++){const p=build(type,number),a=audit(p);if(!a.ok)throw Error(p.id+': '+a.errors.join(', '));records.push({id:p.id,type,widthM:p.bounds.w,lengthM:p.bounds.h,heightM:p.maxHeightM,...a});}return {schemaVersion:1,scope:'utilities-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};}
// END AUTHOR CORE
if(require.main===module)console.log(JSON.stringify({types:TYPES,plans:TYPES.length*RULES.variants}));
module.exports={RULES,PROFILES,TYPES,build,audit,auditAll};
