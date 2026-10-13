/* All archived and independently authored programme cards in the in-game atlas.
 * Status deliberately differs from 'pilote': a template is not a world POI.
 */
(function(root){'use strict';
 const R=root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
 const entries=(R?.records||[]).map(p=>{
  const parent=R.parentFor(p),parts=parent?.[3]||[],context=p.module||'programme historique',state=p.state||'état initial';
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
