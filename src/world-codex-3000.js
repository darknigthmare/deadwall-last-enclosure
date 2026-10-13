/* All archived and independently authored programme cards in the in-game atlas.
 * Status deliberately differs from 'pilote': a template is not a world POI.
 */
(function(root){'use strict';
 const R=root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
 const X=root.DeadwallCodexContext160||(typeof require==='function'?require('./codex-context160.js'):null);
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const D=root.DeadwallCodex3000Data||(typeof require==='function'?require('./codex3000-live-data.js'):null);
 const groupLabels=Object.freeze({roads:'Réseau routier',rail:'Ferroviaire',water:'Eau et ouvrages',port:'Port',district:'Quartier'});
 const metric=value=>value.join(' × '),floors=value=>value.join(', ');
 const resourceName=id=>C?.RESOURCE_META?.[id]?.label?.toLowerCase()||id;
 function contextCard(p,contract){
  const adaptation=contract.adaptation,profile=contract.profile;
  const implementationText=contract.implementation160?.text?contract.implementation160.text+' ':'';
  const rooms=contract.parentRooms,operations=contract.operationCandidates;
  const contextName=profile?groupLabels[contract.context160]||contract.context160:
   D?.modules?.[contract.context160]?.[0]||contract.context160;
  const historicalContext=p.module?D?.modules?.[p.module]?.[0]||p.module:'programme historique';
  const dryPort=profile?.geometry?.waterRelation==='not-required';
  const marine=!dryPort&&(profile?.context160==='port'||['port','lake','coastal'].includes(contract.contextProfile?.terrain));
  const aquatic=operations.includes('pumpBasin')||!dryPort&&(marine||profile?.context160==='water'||
   ['water','shallow-water-bed'].includes(profile?.geometry?.crossing?.underlay)||
   /\b(water|river|lake|canal|coastal|shore|quay|pontoon|basin)\b/.test(profile?.geometry?.terrain||''));
  const railway=profile?.context160==='rail'||contract.contextProfile?.terrain==='rail'||dryPort||
   /\brail\b/.test(profile?.geometry?.network||'');
  const staticTransport=[railway?' Les trains restent statiques.':'',marine?' Les navires et bateaux restent statiques.':''].join('');
  const dimensionPolicy=profile?
   'Le programme reprend les minima auteurs, sans réduire son réseau ou son quartier au gabarit intérieur historique '+
    metric(adaptation.fromHistoricalFootprint)+' m.':
   'Le plan intérieur historique reste conservé, avec ses pièces, ouvertures, étages, identifiants et budgets; le contexte est ajouté autour de ce plan.';
  const adaptationText='Emprise '+(adaptation.footprintChangedFromHistorical?'modifiée':'inchangée')+
   ' par rapport au plan historique; niveaux '+(adaptation.levelsChangedFromHistorical?'modifiés':'inchangés')+
   '. La référence auteur '+(adaptation.sourceWasAdaptedInHistoricalTemplate?'avait été adaptée dans ce plan historique.':'n’avait pas été adaptée dans ce plan historique.');
  const authorBoundary=profile?.geometry?.heightModel?.startsWith('requires-authored-')?
   ' La référence décrit des niveaux ou hauteurs supplémentaires encore à définir: leur accès n’est pas promis par les niveaux G10 affichés.':
   ' Le niveau intérieur ne désigne pas l’altitude d’une route, d’un tablier ou du relief.';
  const inheritedSpaces=rooms.map(room=>room.name+' (niveau '+room.z+')').join(' ; ');
  const inheritedSupplies=rooms.map(room=>room.name+' — '+resourceName(room.resource)).join(' ; ');
  const physicalAccess=profile?profile.interactionContract.slice(0,2).join(' '):
   'L’entrée du parent, sa desserte de service et le retour rejoignent les parcours physiques du contexte; le plan intérieur garde ses accès historiques.';
  const operationNames=operations.map(id=>C?.ContextRules160?.operations?.[id]?.name||id).join(' ; ');
  const operationText=operations.length?
   ' Services possibles sur les supports réellement présents: '+operationNames+
    '. Chaque intervention exige le point de travail accessible, les matériaux du sac et le temps actif annoncés par son propriétaire; un catalogue n’exécute aucun service.':
   ' Aucun service supplémentaire n’est déduit de la seule fiche.';
  const abandonedScope=p.module==='camp-hostile'?
   'Ancien camp désormais abandonné et occupé par les infectés existants; aucune faction humaine combattante n’est créée.':
   p.module==='camp-allie'?
    'Infrastructure d’un ancien camp abandonné; son nom historique ne crée ni habitants, ni aide gratuite, ni droits de faction.':
    'Site abandonné à explorer et à ravitailler avec des réserves finies.';
  const waterScope=operations.includes('pumpBasin')?' La purge du bassin ne produit pas d’eau potable.':
   aquatic?' L’eau visible ne constitue pas une réserve potable.':'';
  return Object.freeze({
   id:'programme-'+p.id,title:p.id+' · '+p.name,family:'programmes',status:'programme',
   summary:'Fiche '+(p.original?'historique':'dérivée')+' du catalogue de 3 000. '+rooms.length+
    ' espaces du parent '+p.parent+', famille '+p.family+'. Contexte physique G10: '+contextName+'. '+abandonedScope,
   layout:'Emprise G10 '+contract.w+' × '+contract.h+' m; niveaux '+floors(contract.levels)+
    '. Référence auteur: '+metric(contract.sourceMin)+' à '+metric(contract.sourceMax)+' m; niveaux '+floors(contract.sourceLevels)+
    '. '+dimensionPolicy+' '+adaptationText+authorBoundary+' Espaces sources: '+inheritedSpaces+'.',
   access:physicalAccess+' Les ouvertures, parcours de retour et supports utilisent les mêmes transformations que les collisions. '+
    'Chaque accès annoncé doit être atteignable dans le lieu effectivement posé.',
   supplies:'Répartition héritée du parent canonique '+p.parent+': '+inheritedSupplies+
    '. Contenants finis et identifiés: la nouvelle emprise, les sprites, les variantes et les services ne créent pas un second budget. '+
    'Les prélèvements restent conservés après rechargement.',
   risks:implementationText+abandonedScope+(aquatic?' Eau, ruptures':' Ruptures')+
    ', ouvrages, voies et relief doivent conserver leurs limites de déplacement et de visibilité propres. '+
    'Les contacts infectés suivent la visibilité et les collisions existantes.'+staticTransport+waterScope,
   night:'L’état '+(p.state||'état initial')+' décrit les traces du site abandonné. Lumières et services exigent leurs propriétaires et leurs réserves; '+
    'une pièce, un sprite ou une texture n’ajoute ni courant ni éclairage autonome.',
   variants:'Contexte historique: '+historicalContext+(p.module?' ('+p.module+')':'')+'. Contexte G10: '+contextName+' ('+contract.context160+')'+
    '. État: '+(p.state||'état initial')+'. Programme parent: '+p.parent+'. Les variations conservent les noms et les identités historiques.',
   interactions:'G10 s’active volontairement au dépôt de D-17, dans Monde & relais. La consultation du guide laisse la campagne inchangée.'+operationText,
   qa:'Vérifier l’emprise G10 contre la référence auteur, les niveaux, ouvertures, collisions, contenants et le retour réel. '+
    'Les sprites et textures du contexte doivent suivre les emprises physiques; leur présence graphique ne prouve pas un franchissement ou un service. '+
    (profile?'Le programme spécialisé utilise son minimum auteur; chaque hauteur, tablier et sous-lieu exige sa validation physique.':
     'L’intérieur historique est préservé; valider aussi les accès et collisions du contexte extérieur.'),
   source:implementationText+'Codex 3000 originel; parent '+p.parent+' et contrat DeadwallCodexContext160.get('+p.id+'). '+
    'G10 rend ce programme candidat à une implantation après contrôle du terrain, des accès et des réservations. '+
    'Les 626 fiches concernées ne promettent pas 626 lieux supplémentaires présents dans chaque graine; la fiche ne découvre aucun lieu ni ressource.'
  });
 }
 const entries=(R?.records||[]).map(p=>{
  const parent=R.parentFor(p),parts=parent?.[3]||[],context=p.module||'programme historique',state=p.state||'état initial';
  const physical=X?.get?.(p.id);
  if(physical)return contextCard(p,physical);
  const supported=R.enabled(p,{townKind:'grande-ville',biome:'meadow'});
  if(p.extension===158){const d=p.details,a=d.architecture,plan=R.template(p.id),levels=a.levels.join(', ');
   return Object.freeze({id:'programme-'+p.id,title:p.id+' · '+p.name,family:'programmes',status:'programme',
    summary:d.purpose+' Programme indépendant ; '+d.spaces.length+' espaces, famille '+p.family+'.',
    layout:a.width+' × '+a.height+' m auteur ; '+plan.w+' × '+plan.h+' m pour le plan métrique, niveaux '+levels+
      '. Distribution '+a.layout+'. '+a.material+' Espaces : '+d.spaces.map(s=>s.name+' (niveau '+s.z+') — '+s.usage).join(' ; ')+'.',
    access:d.access.public+' '+d.access.service+' '+d.access.return+' Largeur de référence '+d.access.width_m+' m. Les couloirs et ouvertures du plan restent réservés.',
    supplies:d.supplies+' Contenants : '+d.spaces.flatMap(s=>s.props.map(o=>o.kind+' / '+o.resource)).join(', ')+'. Les quantités restent finies et persistantes.',
    risks:d.risks.join(' ')+' Les risques décrits comme traces ne créent pas de mécanisme absent.',
    night:d.night,variants:d.variants.join(' '),interactions:d.interactions.join(' '),qa:d.qa.join(' '),
    source:'Programme indépendant DW-3001–4000, addendum 1.58. '+d.story+
      ' G9 : candidat à une implantation après contrôle du terrain, des accès et des réservations. La fiche ne découvre aucun lieu ni ressource.'});
  }
  return Object.freeze({
   id:'programme-'+p.id,title:p.id+' · '+p.name,
   family:'programmes',status:'programme',
   summary:'Fiche '+(p.original?'historique':'dérivée')+' du catalogue de 3 000. '+parts.length+' espaces sources, famille '+p.family+'.',
   layout:'Parent '+p.parent+'. Programme spatial : '+parts.map(x=>x[0]).join(' ; ')+'. Gabarit calculé à partir des pièces et des contraintes métriques.',
   access:'Le générateur de plan possède entrée principale, distribution, murs et ouvertures. Les parcours doivent être vérifiés dans la géométrie réellement posée.',
   supplies:'Contenants finis et identifiés lors de la matérialisation ; pas de butin créé par la fiche ou par une variante. Les stocks historiques sont conservés.',
   risks:'Compatibilité territoriale vérifiée avant pose. Les sites nécessitant eau, relief, voies dénivelées ou faction non simulée restent exclus des implantations terrestres.',
   night:'L’état '+state+' décrit les traces de service et de panne ; il ne crée ni réseau électrique fonctionnel ni lumière autonome sans alimentation.',
   variants:'Contexte : '+context+'. État : '+state+'. Programme parent : '+p.parent+'.',
   interactions:'Plan métrique produisible pour inspection / graine et enrichissement contextuel des lieux compatibles. '
     +(supported?'Compatibilité sur terrain plat à confirmer par emplacement.':'La fiche exige un terrain ou programme spécialisé.'),
   qa:'Vérifier dimensions, portes, étages, collisions, ressources finies, retour, et ne jamais confondre programme et lieu déjà présent.',
   source:'Codex 3000 originel ; src/codex3000-runtime.js. Statut : recette procédurale, pas 3 000 POI individuels dans une seule sauvegarde.'
  });
 });
 Object.freeze(entries);
 (root.DeadwallCodexPacks||(root.DeadwallCodexPacks={})).programmes=entries;
 if(typeof module==='object'&&module.exports)module.exports=entries;
})(typeof globalThis!=='undefined'?globalThis:this);
