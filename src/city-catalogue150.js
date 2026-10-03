/* Read-only catalogue of the choices installed in the shipped city runtime. */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DeadwallCityCatalogue150=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const GROUPS=Object.freeze({building:'Constructions et évolutions',road:'Chemins et routes',mechanism:'Montages de pièges',fitting:'Équipements de défenses',exercise:'Formation des accompagnateurs',plan:'Ensembles de chantiers',recipe:'Armes, outils et postes portatifs',role:'Personnel',doctrine:'Doctrines',vehicle:'Véhicules'});
 const copy=x=>JSON.parse(JSON.stringify(x));
 const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
 const number=n=>Number.isFinite(n)?Number(n.toFixed(3)):0;
 function create(C){
  if(!C?.CITY_TIERS||!C.BUILDINGS)throw Error('Catalogue de cité absent.');
  const items=[],buildings=Object.values(C.BUILDINGS),name=id=>C.BUILDINGS[id]?.name||id;
  const prerequisite=id=>({kind:'building',id,text:name(id)+' achevé requis.'});
  const add=(kind,id,tier,d,extra={})=>{
   if(!Number.isInteger(tier)||!C.CITY_TIERS[tier])throw Error('Âge de contenu invalide : '+id);
   items.push({key:kind+':'+id,kind,id,tier,name:d.name||d.title||id,description:d.description||'',cost:copy(d.cost||{}),payment:kind==='mechanism'?'bag':'depot',conditions:[],facts:[],tradeoffs:[],...extra});
  };
  for(const d of buildings){
   if(d.id==='core')continue;
   const conditions=[],facts=[],tradeoffs=[];
   if(d.requires)conditions.push(prerequisite(d.requires));
   const contract=C.FieldOperations?.CONTRACTS?.find(q=>q.unlock===d.id);
   if(contract)conditions.push({kind:'contract',id:contract.id,wave:contract.wave,text:'Plan à récupérer et livrer : '+contract.name+' (vague '+contract.wave+' ou suivante).'+(contract.prerequisite?' Contrat précédent : '+C.FieldOperations.BY_ID[contract.prerequisite].name+'.':'')});
   const site=['dayGreenhouse','prefabYard'].includes(d.id)&&C.Dayworks?.SITES?.find(q=>q.unlock===d.id);
   if(site)conditions.push({kind:'survey',id:site.id,text:'Relevé physique requis : '+site.name+'.'});
   const upgradeFrom=buildings.filter(q=>q.upgradeTo===d.id).map(q=>q.id),upgradeCost=C.scaledCost(d.cost,C.MAINTENANCE_RULES.upgradeFactor);
   if(upgradeFrom.length)facts.push('Évolution sur place de '+upgradeFrom.map(name).join(' / ')+': '+C.resourceText(upgradeCost)+'. Intégrité proportionnelle conservée.');
   if(upgradeFrom.some(id=>C.BUILDINGS[id].production&&Object.keys(C.BUILDINGS[id].consumes||{}).length)&&(!d.production||!Object.keys(d.consumes||{}).length))tradeoffs.push('Retirez explicitement le régulateur via Fortifications avant cette évolution ; retrait sans remboursement. Les réserves compatibles restent en place.');
   if(d.id==='armoredGate')conditions.push({kind:'upgrade',id:upgradeFrom[0],text:'Disponible par amélioration d’une porte achevée ; pas de placement libre.'});
   if(d.housing){facts.push(d.housing+' places de logement.');tradeoffs.push('Les personnes sont recrutées séparément et consomment des rations.');}
   if(d.storage)facts.push('+'+d.storage+' de capacité par ressource'+(d.storageDepot?' et point de dépôt physique.':'.'));
   if(d.production){facts.push('Production nominale : '+Object.entries(d.production).map(([k,n])=>number(n)+' '+(C.RESOURCE_META[k]?.label||k).toLowerCase()+'/s').join(' + ')+'.');tradeoffs.push('Stockage plein ou intrants manquants : production interrompue.');}
   if(d.consumes)tradeoffs.push('Intrants par seconde : '+Object.entries(d.consumes).map(([k,n])=>number(n)+' '+(C.RESOURCE_META[k]?.label||k).toLowerCase()).join(' + ')+'.');
   if(d.powerUse)tradeoffs.push(d.powerUse+' unités électriques demandées ; rétablissez l’alimentation du support.');
   if(d.powerGen)facts.push(d.powerGen+' unités électriques'+(d.solar?' pendant le calme seulement.':'.'));
   if(d.generatorFuel)tradeoffs.push(number(d.generatorFuel*60)+' carburant par minute.');
   if(d.range){facts.push('Portée '+number(d.range/C.TILE)+' m · '+number(d.fireRate)+' tir(s)/s · '+d.damage+' dégâts par tir.');tradeoffs.push((d.ammoPerShot||1)+' munition(s) par tir, portée et accès à défendre.');}
   if(d.observerRange150)facts.push('Observation nominale '+d.observerRange150+' m ; poste achevé et opérationnel, nuit et obstacles limitant la vue.');
   if(d.medicalRadius){facts.push('Soins accessibles à '+number(d.medicalRadius/C.TILE)+' m · '+number(d.healRate)+' PV/s par personne.');tradeoffs.push(number(d.medicinePerHealth)+' médicament par PV ; aucune résurrection.');}
   if(d.battery){facts.push(d.battery.capacity+' unités-secondes stockées · sortie maximale '+d.battery.output+'.');tradeoffs.push('Batterie vide à la construction ; charge sur le surplus réel, rendement '+Math.round(C.PowerGrid.RULES.efficiency*100)+' %.');}
   if(d.explosive)tradeoffs.push('Destruction explosive : éloignez les réserves et logements.');
   if(d.beamHalfAngle)tradeoffs.push('Éclairage orienté et coupé par les obstacles ; une lampe ne devient pas un observateur.');
   add('building',d.id,d.unlockTier,d,{conditions,facts,tradeoffs,category:d.category,upgradeFrom,upgradeCost:upgradeFrom.length?upgradeCost:null,upgradeOnly:d.id==='armoredGate',new150:!!C.CityContent150?.BUILDINGS[d.id],...(d.id==='armoredGate'?{cost:upgradeCost}:{})});
  }
  for(const [id,d]of Object.entries(C.Infrastructure?.SURFACES||{}))add('road',id,d.unlockTier,d,{conditions:[prerequisite(d.requires),...(d.workshop?[prerequisite('workshop')]:[])],facts:['Par cellule : '+d.workSeconds+' unités de travail · alliés ×'+d.friendlySpeed+' · fourgons ×'+d.truckSpeed+'.'],tradeoffs:['Les infectés accélèrent également : ×'+d.hostileSpeed+'.','L’ancien revêtement reste actif jusqu’à l’achèvement d’une amélioration payée.'],new150:id!=='gravel'});
  for(const [id,d]of Object.entries(C.FortificationPackRules?.mechanisms||{}))add('mechanism',id,d.tier,d,{conditions:[prerequisite('spikes'),...(d.requires?[prerequisite(d.requires)]:[])],facts:[d.charges+' déclenchement(s) · '+d.damage+' dégâts · '+d.holdSeconds+' s d’entrave · '+d.seconds+' s de travail.'],tradeoffs:['Charges finies, contact physique et délai de réarmement de '+d.cooldown+' s ; matériaux du sac payés à l’achèvement.'],new150:!!d.strictTier});
  for(const [id,d]of Object.entries(C.FortificationPackRules?.variants||{}))add('fitting',id,d.tier,d,{conditions:[{kind:'support',text:d.target==='ammo'?'Poste de tir achevé et accessible requis.':'Mur ou porte achevés et accessibles requis.'},...(d.requires?[prerequisite(d.requires)]:[])],facts:[d.capacity+' '+(d.target==='ammo'?'cartouches prélevées au dépôt.':'points de capture finis.')],tradeoffs:['Une réserve finie sur un support réel ; installation payée et manipulation hors danger.']});
  for(const [id,d]of Object.entries(C.CompanionPackRules?.exercises||{})){
   const tier=d.tier??0;if(d.tier===undefined)continue;
   const allies=(d.allowedCompanions||[]).map(q=>C.WorldEvolution?.RULES.companions[q]?.name||q);
   add('exercise',id,tier,d,{conditions:[{kind:'training',id:d.requires,text:'Entraînement préalable : '+(C.CompanionPackRules.exercises[d.requires]?.name||'Spécialité')+'.'},{kind:'team',text:'Accompagnateur affecté : '+allies.join(' / ')+'.'}],facts:[d.seconds+' s d’entraînement payé au dépôt.'],tradeoffs:['Les effets dépendent des ordres, formations, réserves et accès physiques ; aucun nouveau survivant offert.'],new150:true});
  }
  for(const d of C.Dayworks?.PLANS||[]){
   const parts=C.Dayworks.footprint(d.id,0,0),defs=parts.map(p=>C.BUILDINGS[p.type]);
   const tier=Math.max(C.BUILDINGS.planningOffice?.unlockTier||0,d.tier150||0,...defs.map(p=>p.unlockTier)),cost={};
   for(const def of defs)for(const [k,n]of Object.entries(def.cost))cost[k]=(cost[k]||0)+n;
   const conditions=[prerequisite('planningOffice'),...new Set(defs.flatMap(q=>q.requires?[q.requires]:[]))].map(q=>typeof q==='string'?prerequisite(q):q);
   if(d.unlock){const site=C.Dayworks.SITES.find(s=>s.unlock===d.unlock);conditions.push({kind:'survey',id:site?.id,text:'Croquis à relever : '+(site?.name||d.unlock)+'.'});}
   add('plan',d.id,tier,{...d,cost},{conditions,facts:[parts.length+' fondations · emprise '+d.w+' × '+d.h+' cellules.'],tradeoffs:['Somme intégrale des pièces, chacune à financer et achever. Accès, énergie et réserves restent nécessaires.'],new150:!!d.tier150});
  }
  for(const d of Object.values(C.Arsenal134Rules?.catalog||{}))add('recipe',d.id,d.tier,d,{conditions:d.requires?[prerequisite(d.requires)]:[],facts:[d.kg+' kg · '+(C.Arsenal134Rules.craftSeconds+Math.ceil(d.kg))+' s d’assemblage.'],tradeoffs:[d.category==='firearm'||d.category==='deployed'?'Munitions, chargeur, usure et entretien restent nécessaires ; aucune cartouche fournie.':'Endurance, usure et poids limitent l’usage ; fabriquer ne remplace pas le travail physique.']});
  for(const d of Object.values(C.SURVIVORS||{}))add('role',d.id,d.tier,d,{conditions:d.requires?[prerequisite(d.requires)]:[],tradeoffs:['Une place de logement et des rations ; soins, réparations et tirs consomment leurs fournitures.']});
  for(const d of C.RESEARCH||[])add('doctrine',d.id,d.tier,d,{insight:d.insight,facts:[d.insight+' point(s) d’analyse, achat unique.'],tradeoffs:['Points acquis en campagne ; aucun bonus gratuit au chargement.']});
  for(const [id,d]of Object.entries(C.WorldEvolution?.RULES.vehicles||{}))add('vehicle',id,d.tier,d,{conditions:[prerequisite('expeditionGarage')],facts:['Coffre '+d.cargo+' · réservoir '+d.tank+' · vitesse nominale '+d.speed+' m/s.'],tradeoffs:['Sélection, remise en service et transport physiques ; carburant et entretien séparés.']});
  const rows=C.CITY_TIERS.map(age=>({age:copy(age),items:items.filter(d=>d.tier===age.id)}));
  return freeze({groups:copy(GROUPS),items,ages:rows,forAge:age=>rows[age]?.items||[],alwaysAvailable:{note:'Sans nouvel âge : bivouacs, caches et marqueurs de terrain, barricades de portes et fenêtres, caissons et cassettes finis sur support, outillage de chantier et consignes de porte. Quatre familles de kits après récupération de modules et huit appareils nocturnes complètent les sorties. Les compagnons ont aussi leurs spécialités, exercices d’escorte et de soutien payés. Les lieux générés et les fiches du codex ne sont pas des constructions à débloquer.',nightGear:Object.keys(C.NightGearRules?.types||{}),barricades:Object.keys(C.BarricadeRules134?.types||{}),kits:[...(C.Essentials?.keys||[])]}});
 }
 function status(item,context){
  const known=item.tier<=context.age,finished=new Set(context.finished||[]),missingBuildings=item.conditions.filter(d=>d.kind==='building'&&!finished.has(d.id));
  const supplies=item.payment==='bag'?context.bag:context.resources,missing=Object.fromEntries(Object.entries(item.cost).map(([k,n])=>[k,Math.max(0,n-(supplies?.[k]||0))]).filter(([,n])=>n>0));
  const minimumStorage=item.kind==='building'||item.kind==='plan'?Math.max(0,...Object.values(item.cost)):0;
  return{known,missingBuildings:missingBuildings.map(d=>d.id),missing,minimumStorage,storageShortfall:Math.max(0,minimumStorage-(context.storage||0)),missingInsight:Math.max(0,(item.insight||0)-(context.insight||0)),extraConditions:item.conditions.filter(d=>d.kind!=='building'),completed:item.kind==='doctrine'&&(context.research||[]).includes(item.id)};
 }
 function context(g){
  return{age:g.tier?.id??0,storage:g.storage||0,resources:{...g.resources},bag:{...g.player?.carry},insight:g.research?.insight||0,research:[...(g.research?.completed||[])],finished:[...new Set([...g.world.buildings.values()].filter(b=>!b.dead&&b.health>0&&b.completed).map(b=>b.type))].sort()};
 }
 return Object.freeze({create,status,context,groups:GROUPS});
});
