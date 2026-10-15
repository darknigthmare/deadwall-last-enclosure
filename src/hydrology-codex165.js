/* Loaded with the data bundle before Core; entries are resolved after Core is ready. */
(function(root,factory){'use strict';
 const api=factory(root);root.DeadwallHydrologyCodex165=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 let previousWater=null,previousPopulation=null,previousBiomes=null,previousEntries=null;
 const number=value=>String(Number(value.toFixed(3))).replace('.',','),range=values=>values[0]===values[1]?number(values[0]):values.map(number).join(' à ');
 const waterText=Object.freeze({
  lake:{summary:'Une étendue d’eau douce organise les trajets de rive. Les lacs traversés appartiennent au réseau d’écoulement et possèdent un exutoire.',
   placement:'Bassin retenu sur un cours principal, avec arrivée et sortie du réseau. Les réservations de D-17, des localités et des lieux terrestres restent prioritaires.',
   variants:'Contours déterministes et rives irrégulières. La présence d’un lac ne crée ni base nautique, ni ponton, ni camping équipé.'},
  pond:{summary:'Un bassin d’eau douce fermé occupe un sol assez humide, à une échelle inférieure au lac.',
   placement:'Le placement dépend de l’humidité du terrain. Le bassin conserve une séparation des autres eaux et refuse les emprises protégées ; aucun ruisseau invisible n’est inventé pour le raccorder.',
   variants:'Contours, orientation et implantation varient avec la graine. Étang naturel en jeu ; pisciculture et entretien d’une retenue ne sont pas simulés.'},
  pool:{summary:'Une petite mare occupe une poche humide et se contourne depuis sa berge ; elle ne remplace pas un cours d’eau.',
   placement:'Bassin fermé sélectionné dans les sols humides, avec contrôle des réservations et de la séparation entre étendues.',
   variants:'Petites formes orientées selon leur identité. Une mare n’offre ni eau potable, ni élevage, ni terrain constructible sur sa surface.'},
  stream:{summary:'Un petit affluent rejoint un cours receveur déclaré. Sa largeur et son dessin restent continus au passage des secteurs techniques.',
   placement:'Tracé orienté du réseau vers un cours principal. Les détours respectent les réservations ; un changement de secteur ne tire pas un nouvel exutoire.',
   variants:'Méandres et directions changent avec la graine. La faible profondeur nominale ne crée pas un gué automatique.'},
  river:{summary:'Un cours principal relie l’intérieur de la région à la côte. Il reçoit les affluents et organise les franchissements.',
   placement:'Le réseau est orienté vers la côte de la campagne. Les lacs traversés conservent un exutoire ; les villes et D-17 disposent de leurs réservations.',
   variants:'Tracés et confluences déterministes. Le courant décrit l’orientation du réseau ; il ne pousse pas physiquement les acteurs et ne simule pas une crue.'},
  sea:{summary:'La mer côtière borde le continent et rejoint directement l’océan. Elle ne forme pas de poche salée au milieu des terres.',
   placement:'Bande littorale attachée à une bordure réelle de la région, entre la terre et les eaux du large.',
   variants:'La bordure et les courbes du rivage dépendent de la graine. Plage aménagée, port, marée et navigation restent des systèmes distincts.'},
  ocean:{summary:'Les eaux du large prolongent la mer côtière jusqu’à la limite de la région. Le monde conserve ses dimensions finies.',
   placement:'Frange au large de la même étendue salée, au-delà de la mer côtière. Aucun bassin d’océan isolé n’est semé à l’intérieur du continent.',
   variants:'La largeur représentée change avec le trait de côte. Il s’agit de la frange d’océan incluse dans la carte, sans monde maritime infini ni navigation jouable.'}
 });
 function measurements(id,definition,rules){
  const dimensions=['lake','pond','pool'].includes(id)?'Grand axe nominal '+range(definition.width)+' m ; petit axe ×'+number(rules.basins[id].ratio):
   id==='ocean'?'Frange représentée dans la région : '+range(definition.width)+' m':
   id==='sea'?'Bande côtière : '+range(definition.width)+' m':'Largeur nominale '+range(definition.width)+' m';
  return dimensions+'. Eau '+(definition.salinity==='salt'?'salée':'douce')+' ; profondeur nominale de classe '+number(definition.depth)+' m ; bande de berge '+number(definition.bankWidth)+' m. Ces mesures décrivent le terrain, sans simulation hydraulique ni nage.';
 }
 function entries(){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),H=C?.Hydrology165Rules,P=C?.BiomePopulation165Rules,B=C?.BiomeRules135;
  if(!H?.kinds||!P?.species||!B?.enemies)throw Error('Règles du guide hydrographique165 absentes.');
  if(H===previousWater&&P===previousPopulation&&B===previousBiomes)return previousEntries;
  const common={status:'jouable',family:'nature',
   access:'L’eau bloque les déplacements au sol. Longer une rive ou rejoindre un franchissement réellement présent ; la faible profondeur ne suffit pas à créer un gué. Aucune nage, plongée ou embarcation jouable.',
   supplies:'L’eau et ses décors n’offrent aucun stock. Les arbres, roches et contenants identifiés conservent leurs réserves finies ; ni pêche ni eau potable automatique.',
   risks:'Le détour peut allonger le retour. Une route dessinée ne transforme pas l’eau en terre ; vérifier le tablier et ses accès. La profondeur nominale ne constitue pas une simulation de noyade.',
   night:'Les eaux et berges ne produisent aucune lumière. Préparer une source réelle ; la nuit et les obstacles gardent les règles de visibilité existantes.',
   interactions:'Itinéraire, obstacles, accès aux lieux et véhicules, choix des berges et peuplement. La consultation ne révèle aucun lieu ni contact inconnu.',
   qa:'Même graine et même hydrologie : mêmes eaux, berges et franchissements après rechargement des secteurs. Le Guide ne modifie ni la campagne ni le hasard de simulation.',
   source:'Extension 1.65 · nouvelles campagnes hydrologyVersion='+H.version+', génération G'+H.requiredGeneration+' ou ultérieure et écologie '+H.requiredEcology+'. Les sauvegardes historiques gardent leur terrain. Source : DeadwallCore.Hydrology165Rules et BiomePopulation165Rules.'};
  const list=Object.entries(H.kinds).map(([id,definition])=>{
   const text=waterText[id];if(!text)throw Error('Famille d’eau sans fiche165 : '+id);
   return Object.freeze({...common,id:'hydrology165-'+id,title:definition.name+' · hydrographie',summary:text.summary,
    layout:measurements(id,definition,H)+' '+text.placement,variants:text.variants});
  });
  list.push(Object.freeze({...common,id:'hydrology165-banks',title:'Berges et franchissements · hydrographie',family:'systemes',
   summary:'Le même réseau décrit la limite de l’eau, sa rive et les traversées retenues. La chaussée passe sur un ouvrage physique lorsqu’elle franchit une eau.',
   layout:'Réserve du refuge : '+number(H.protection.homeRadius)+' m de rayon. Marges de localité : '+number(H.protection.settlementMargin)+' m. Un franchissement prolonge ses accès de '+number(H.crossings.bankLength)+' m sur les berges ; portée maximale retenue '+number(H.crossings.maxSpan)+' m.',
   access:'Le tablier et ses accès gardent leur propre géométrie. Les collisions vérifient la position et le rayon réel de l’acteur ; une rive proche ne vaut pas passage. Les véhicules doivent tenir sur le franchissement.',
   variants:'Les cours contournent les réservations. Les ouvrages dépendent des routes réellement croisées ; aucun pont supplémentaire n’est accordé par la consultation du Guide.',
   interactions:'Cohérence entre carte, terrain, collision, approche à pied et conduite. Les implantations terrestres refusent les emprises en eau ; les palissades, pontons et ports complets gardent leurs règles propres.'}));
  const species=Object.values(P.species),speciesNames=species.map(d=>d.name).join(' · '),dimensions=species.map(d=>d.name+' : '+number(d.length)+' × '+number(d.width)+' m, rayon '+number(d.radius)+' m, vitesse de fuite '+number(d.speed)+' m/s').join(' ; ');
  const bankNames=kind=>species.filter(d=>d.water===kind).map(d=>d.name+' à '+number(d.bankRange)+' m au plus d’une berge').join(' · ');
  list.push(Object.freeze({...common,id:'hydrology165-wildlife',title:'Animaux des biomes et des berges',
   summary:speciesNames+'. Les espèces terrestres sont pondérées par le biome ; les oiseaux de berge dépendent aussi du type d’eau.',
   layout:dimensions+'. Eau douce : '+bankNames('fresh')+'. Eau salée : '+bankNames('salt')+'.',
   access:'Les animaux marchent sur le sol sec et respectent les obstacles. Les oiseaux restent au sol : aucun vol ni nage n’est simulé. Ils errent puis fuient une menace observée ou un bruit.',
   supplies:'Aucune viande, plume ou ressource automatique. Pas d’élevage, de capture ni d’économie de chasse. Une mort ne transforme pas l’animal en contenant de butin.',
   risks:'La présence est probabiliste. Les animaux n’attaquent pas et ne constituent pas une escorte. Les voies, parcelles et '+number(P.homeExclusion)+' m autour de D-17 excluent les apparitions naturelles.',
   variants:'Quatre variantes visuelles par espèce, sans modifier vitesse, santé ou stock. Au plus '+number(P.animalBudget)+' animaux actifs dans le voisinage chargé ; ce plafond ne décrit pas une population mondiale.',
   interactions:'Biomes, eau douce ou salée, déplacement, bruit, visibilité et persistance. Les blessures et les morts gardent leur identité ; quitter un secteur ou continuer la partie ne les réinitialise pas.'}));
  const profiles=Object.values(B.enemies).map(d=>d.name+' : '+number(d.health)+' PV, '+number(d.speed)+' m/s, '+number(d.damage)+' dégâts par contact toutes les '+number(d.interval)+' s').join(' ; ');
  list.push(Object.freeze({...common,id:'hydrology165-infected',title:'Infectés naturels et milieux régionaux',family:'systemes',
   summary:'Les espaces naturels accueillent des contacts régionaux pondérés par le biome. Ils reprennent les six profils existants, avec leurs collisions, poursuites et statistiques régionales.',
   layout:profiles+'. Au plus '+number(P.contactBudget)+' contacts naturels actifs dans le voisinage chargé ; aucun quota ne garantit un ennemi dans chaque secteur.',
   access:'Les apparitions recherchent un sol sec et refusent les emprises réservées. Les contacts suivent les obstacles, les berges et les franchissements ; aucune nage ou traversée directe de l’eau.',
   supplies:'Aucune récompense de ressource automatique. Prévoir les munitions, les soins et un trajet de retour ; aucun budget de horde supplémentaire n’est ajouté à D-17.',
   risks:'Le bruit et une rencontre sur une berge peuvent compliquer la retraite. Les nouveaux placements ne donnent ni pouvoir aquatique, ni santé de boss, ni attaque animale.',
   variants:'Les proportions suivent les profils du milieu. La même identité conserve les blessures et la mort dans le registre régional existant.',
   interactions:'Exploration, bruit, poursuite, combat et sauvegarde. Sur la carte, seuls les individus réellement observés par un allié sont montrés ; consulter cette fiche ne localise personne.'}));
  previousWater=H;previousPopulation=P;previousBiomes=B;previousEntries=Object.freeze(list);return previousEntries;
 }
 return Object.freeze({entries});
});
