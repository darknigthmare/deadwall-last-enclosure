/* Read-only guide for finite forage, seeded weather and field campaign contracts.
 * Mechanisms already own their operational choice159 cards: do not duplicate them. */
(function(root,factory){'use strict';
 const api=factory(root);root.DeadwallContentCodex193=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const CAMPAIGNS=Object.freeze(['ruralSurvey','farmSupply','fuelRecovery','archiveRescue','agroRecovery','triageSearch','engineeringRecovery','watchDuty']);
 const placeNames=Object.freeze({farm:'fermes',cabin:'cabanes',marketgarden:'exploitations maraîchères',fuel:'stations de carburant',garage:'garages',library:'bibliothèques',school:'écoles',townhall:'mairies',garden:'jardins',clinic:'cliniques',hospital:'hôpitaux',veterinary:'cabinets vétérinaires',hardware:'quincailleries',warehouse:'entrepôts',quarry:'carrières',sawmill:'scieries'});
 const number=value=>String(value).replace('.',','),range=values=>values.map(number).join(' à ');
 let previous=null,previousEntries=null;
 function entries(){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),F=C?.Forage193Rules,W=C?.Weather193Rules,P=C?.CampaignPackRules;
  if(!F?.species||!W?.fronts||!P?.definitions||CAMPAIGNS.some(id=>!P.definitions[id]))throw Error('Règles du guide de contenu193 absentes.');
  const water=C.CampaignWater214Rules;
  const refs=[F,W,P,water,C.BiomeRules135,C.EcologyRules164,C.CITY_TIERS,C.RESOURCE_META];
  if(previous&&refs.every((r,i)=>r===previous[i]))return previousEntries;
  const costs=cost=>Object.entries(cost).map(([id,n])=>number(n)+' '+C.RESOURCE_META[id].label.toLowerCase()).join(' + ')||'aucun';
  const rewards=reward=>Object.entries(reward).map(([id,n])=>number(n)+' '+({insight:'point(s) d’analyse',morale:'point(s) de moral',worker:'survivant accueilli'}[id]||C.RESOURCE_META[id]?.label.toLowerCase())).join(' · ');
  const biomes=new Map([...(C.BiomeRules135?.defs||[]),...(C.EcologyRules164?.defs||[])].map(d=>[d.id,d.name]));
  const common={status:'jouable',family:'systemes',qa:'La consultation lit les règles installées ; elle ne découvre aucun site, ne crée aucune ressource et ne tire pas le hasard de la campagne.',source:'Contenu193 dérivé de DeadwallCore.Forage193Rules, Weather193Rules et CampaignPackRules. Les conditions réelles sont revérifiées lors de chaque action.'},list=[];
  const forageAccess='Opérations → Expéditions → Cueillette & ramassage. Active dans les nouvelles campagnes compatibles. Une ancienne campagne garde ce système inactif tant que le carnet n’a pas été préparé une fois au dépôt, à pied par un accès libre, avec '+costs(F.activationCost)+' du sac. Activation définitive ; région G8 à G10, écologie et hydrologie requises.';
  for(const d of Object.values(F.species)){
   list.push({...common,id:'forage193-'+d.id,family:'nature',title:d.name+' · cueillette',
    summary:'Ramassage fini de '+range(d.amount)+' unités de '+C.RESOURCE_META[d.resource].label.toLowerCase()+' dans le sac, après '+number(d.seconds)+' s sur place. Les quantités sont des unités de jeu, pas des kilogrammes.',
    layout:'Petit élément au sol : '+number(d.length)+' × '+number(d.width)+' m, rayon '+number(d.radius)+' m. Milieux pondérés : '+Object.keys(d.biomes).map(id=>biomes.get(id)||id).join(' · ')+'. Les routes, parcelles, obstacles et eaux refusent les emplacements incompatibles ; aucune présence garantie.',
    access:forageAccess+' Approche au sol, en région et à pied à '+number(F.reach)+' m au plus, mains libres et cible réellement visible par un accès dégagé.',
    supplies:'Le lot entier doit tenir dans le sac. '+number(F.staminaCost)+' points d’endurance sont dépensés à l’achèvement ; aucun gain partiel ni prélèvement au dépôt. Aucune repousse au changement de jour ou au rechargement du secteur.',
    risks:'Une menace visible à moins de '+number(F.dangerRange)+' m empêche le travail. Déplacement de plus de '+number(F.moveTolerance)+' m, blessure, tir ou changement de monde ou d’étage interrompent la prise sans paiement ni gain. Les champignons sont déjà identifiés ; aucun mécanisme de poison ou d’identification toxique.',
    night:'La visibilité réelle reste nécessaire. Le menu et la pause suspendent le travail ; une reprise de sauvegarde ne relance pas une cueillette en cours.',
    variants:'Quatre variantes visuelles déterminées par l’identité. '+(d.family==='nut'||/tombées/.test(d.name)?'Fruits et noix sont posés au sol ; aucun arbre fictif n’est créé.':'Le gabarit du petit élément reste passable et ne crée aucun arbre ni bâtiment.'),
    interactions:'Biomes, graine et profil du paysage, éclairage, endurance, capacité du sac et registre persistant des prises. Aucune eau potable, médicament ou récolte supplémentaire accordée par la pluie.'});
  }
  for(const [id,d]of Object.entries(W.fronts)){
   list.push({...common,id:'weather193-'+id,title:d.name+' · front météo',
    summary:d.note+' Intensité de pluie visée : '+Math.round(d.rain*100)+' %. La pluie observée rejoint progressivement cette valeur.',
    layout:'Un front occupe '+number(W.frontSeconds)+' s de temps actif. La prochaine tendance devient consultable dans les '+number(W.forecastLead)+' s précédant la relève ; le premier front d’une nouvelle campagne est sec.',
    access:'Opérations → Région → Météo & préparation. Active au nouveau départ. Une ancienne campagne conserve sa météo historique jusqu’à l’activation volontaire et définitive au dépôt, à pied avec les mains libres ; aucun matériau consommé.',
    supplies:'La pluie réelle modifie les consommations des flammes existantes et la collecte des citernes dans leurs limites. Au-dessus de 62 % de pluie, le sol naturel de D-17 devient boueux ; les routes conservent leur surface. Le front ne fournit aucun stock gratuit.',
    risks:'Le vent reste une animation ; il ne pousse pas les acteurs. Aucun froid corporel, gel, crue, eau potable ou ouverture de passage dans l’eau n’est simulé par ce bulletin.',
    night:'Préparer torche, lanterne, bâche ou éclairage alimenté selon leurs propres règles. Le bulletin ne révèle aucun infecté et ne crée aucune lumière.',
    variants:'Séquence liée à la graine et au temps actif, avec périodes humides et sèches. La pause et les menus ne font pas avancer l’échéance météorologique.',
    interactions:'Pluie observée, usure des flammes, protection du bivouac, citernes, terrain et préparation du retour. Les berges et les ponts conservent leur géométrie.'});
  }
  for(const id of CAMPAIGNS){const d=P.definitions[id],defense=!!d.defense;
   const transport=d.cargo?' Transport '+(d.cargo==='outbound'?'du dépôt vers le terrain':'du terrain vers le dépôt')+' : vitesse à '+Math.round(d.cargoSpeed*100)+' % ; chaque point de dégât reçu retire '+number(d.cargoDamage)+' point(s) d’intégrité au '+(d.rescue?'blessé':'colis')+'.':'';
   list.push({...common,id:'campaign193-'+id,title:d.name+' · mission',summary:d.brief,
    layout:defense?'Tenir '+d.waves+' vagues réellement repoussées. Le centre doit rester à '+Math.round(d.minimumCore*100)+' % d’intégrité au minimum pendant tout l’engagement ; réparer après une chute sous ce seuil ne rétablit pas le contrat.':d.sites+' accès déjà découvert(s) parmi : '+d.types.map(type=>placeNames[type]||type).join(' · ')+'. '+number(d.seconds)+' s de travail par accès ; une fiche ne crée aucun lieu compatible.'+transport,
    access:'Opérations → Région → Missions. Préparer au dépôt pendant le calme, à pied, mains libres, après avoir atteint '+C.CITY_TIERS[d.tier].name+'. Une seule tentative de cette mission par campagne ; un abandon ne la renouvelle pas.',
    supplies:'Budget payé au dépôt dès l’engagement : '+costs(d.fee)+'. '+(defense?'Aucun consommable de terrain.':'À transporter pour chaque accès : '+costs(d.fieldCost)+', payé dans le sac seulement à l’achèvement de l’intervention.')+' Récompense après retour et compte rendu au dépôt : '+rewards(d.reward)+'. Les plafonds de stockage, d’analyse et le logement libre restent à vérifier.',
    risks:'Le budget engagé et les opportunités sont perdus en cas d’échec ou d’abandon. '+(d.waveLimit?'Retour avant '+d.waveLimit+' changements de vague depuis l’engagement ; franchir cette limite perd la mission. ':'La défense exige des vagues réellement survécues, sans accélération par le menu. ')+(defense?'La plus faible intégrité du centre pendant l’engagement est conservée.':'Travail à '+number(P.reach)+' m au plus de l’accès au rez-de-chaussée, accès dégagé et sans infecté visible à moins de '+number(P.danger)+' m. Mouvement, blessure, tir ou changement de lieu interrompent le travail sans prélever ses consommables.'),
    night:'Les trajets, les menaces et la visibilité gardent leurs règles. Pause et menus suspendent l’intervention ; continuer une sauvegarde annule la tâche en cours et conserve l’engagement de campagne.',
    variants:'Les accès sont choisis parmi les lieux découverts et compatibles de cette graine. Les sites engagés restent finis ; aucune nouvelle ferme, clinique, unité ou caisse libre n’apparaît à la lecture.',
    interactions:'Âge de D-17, réserves du dépôt, fournitures du sac, découverte, trajets physiques, intégrité, logement et compte rendu. Aucune récompense passive ni mission automatique.'});
  }
  if(water)list.push({...common,id:'water214-rain-collector',title:'Récupérateur de pluie · eau de service',
   summary:'Remettre en service un tonneau extérieur déjà présent dans une halte G11, puis partager son eau avec le vrai seau des incendies et des abreuvoirs. Eau non potable ; aucun réseau domestique raccordé.',
   layout:'Le tonneau conserve son emprise de 0,7 × 0,7 m et ses collisions. Réserve de '+number(water.capacity)+' unités de service, initialement vide après préparation ; aucun nouvel équipement posé par la consultation.',
   access:'Opérations → Région → Récupérateurs de pluie. Site G11 découvert, support intact, approche à pied au sol à '+number(water.reach)+' m maximum, avec un passage libre et les mains disponibles.',
   supplies:'Préparation : '+number(water.prepare.seconds)+' s et '+costs(water.prepare.cost)+' du sac, payés une seule fois à la fin. Puisage ou versement : '+number(water.draw.seconds)+' s, jusqu’à '+number(water.draw.portion)+' unités par transfert, selon la réserve et la place réelle du seau ou du tonneau.',
   risks:'La pluie effectivement simulée alimente seulement les collecteurs préparés et exposés, à '+number(water.rainPerSecond)+' unité par seconde à pleine pluie, sans dépasser la capacité. Temps sec, toit, destruction ou pause empêchent la collecte ; aucune pluie rétroactive au chargement.',
   night:'Temps et menaces continuent pendant les travaux. Déplacement, blessure, tir, rechargement ou perte du support interrompent l’intervention. Une sauvegarde conserve seulement les réserves achevées, jamais une tâche inachevée.',
   variants:'Les tonneaux physiques gardent leur variante et leur identité. Crépine, couvercle, robinet et jauge reflètent la préparation, la réserve et le travail effectif, sans modifier leur gabarit.',
   interactions:'Même seau persistant que les incendies et les animaux, capacité et perte au décès gérées par son propriétaire. Le transfert débite exactement sa source ; aucune eau potable, nourriture ou énergie n’est créée.',
   source:'Récupérateurs214 dérivés de DeadwallCore.CampaignWater214Rules ; g.campaignWater214 et le propriétaire du seau de siège vérifient les transactions réelles.'});
  previous=refs;previousEntries=Object.freeze(list.map(Object.freeze));return previousEntries;
 }
 return Object.freeze({entries,CAMPAIGNS});
});
