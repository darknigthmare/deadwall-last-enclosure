/* Guide fields are read after Core is ready; this helper is bundled before Core. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallEcologyCodex164=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 let previousRules=null,previousEntries=null;
 function entries(){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),rules=C?.EcologyRules164;
  if(!rules?.defs)throw Error('Règles du guide écologique164 absentes.');
  if(rules===previousRules)return previousEntries;
  const B=C.BiomeRules135,G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
  const common={status:'jouable',family:'nature',night:'Les troncs et l’obscurité limitent la vue. Ces milieux ne produisent aucune lumière ; préparer une lampe.',
   access:'Les routes, dessertes et entrées gardent leur dégagement physique. Ce milieu ne révèle aucun lieu inconnu sur la carte.',
   qa:'La même graine et la même écologie reproduisent les sols, essences et identifiants. Les caches de terrain ne renouvellent pas les stocks.',
   source:'Extension 1.64 : nouvelle écologie des campagnes créées avec cette version. Les campagnes sauvegardées gardent leur terrain historique.'};
  const list=rules.defs.map(d=>Object.freeze({...common,id:'biome164-'+d.id,title:d.name+' · biome',summary:d.description,
   layout:d.places.join(' · ')+'. Le sol, les arbres et les roches lisent les mêmes champs de température, humidité, drainage et substrat.',
   supplies:'Arbres : '+Object.keys(d.trees).map(id=>B.trees[id].name).join(' · ')+'. Roches : '+Object.keys(d.rocks).map(id=>B.rocks[id].name).join(' · ')+'. Bois et pierre restent des réserves finies.',
   risks:d.risk,variants:'Lieux compatibles : '+Object.keys(d.buildings).map(id=>G?.BY[id]?.name||id).join(' · ')+'. Les accès et l’espace disponible décident des implantations ; aucun type n’est garanti partout.',
   interactions:'Choix d’itinéraire, collecte, couvert physique, vitesse et bruit du sol, types de lieux et contacts régionaux. Les statistiques des infectés gardent leurs valeurs existantes.'}));
  list.push(Object.freeze({...common,id:'ecology164-coherence',family:'systemes',title:'Lire les régions et leur contenu',
   summary:'Les seize milieux forment des régions continues. Les friches suivent les bourgs et villes ; les clairières et bosquets modulent localement la végétation.',
   layout:'Les transitions mêlent les palettes et les essences. Les fonds humides partagent un indice de drainage ; les roches et pinèdes dépendent aussi du substrat.',
   supplies:'Les sols décoratifs ne distribuent aucune ressource. Récolter les vrais troncs et blocs, puis fouiller les contenants identifiés.',
   risks:'Les indices écologiques ne créent ni rivière franchissable, ni falaise, ni météo saisonnière. Les plans d’eau physiques gardent leurs propres collisions et accès.',
   variants:'Une nouvelle graine change les régions. Une graine conservée reproduit la carte de sa version ; Continuer ne redistribue pas les anciennes ressources.',
   interactions:'La nouvelle écologie accompagne les extensions de campagne. Les contextes forestiers, agricoles et d’extraction refusent les implantations incompatibles ; les emprises indisponibles peuvent empêcher un lieu de trouver sa place.'}));
  previousRules=rules;previousEntries=Object.freeze(list);return previousEntries;
 }
 return Object.freeze({entries});
});
