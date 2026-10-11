/* All 3,000 original and derived programme cards in the in-game atlas.
 * Status deliberately differs from 'pilote': a template is not a world POI.
 */
(function(root){'use strict';
 const R=root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
 const entries=(R?.records||[]).map(p=>{
  const parent=R.parentFor(p),parts=parent?.[3]||[],context=p.module||'programme historique',state=p.state||'état initial';
  const supported=R.enabled(p,{townKind:'grande-ville',biome:'meadow'});
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
