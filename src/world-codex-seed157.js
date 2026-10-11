/* Searchable seeded construction guide for every actually visitable regional preset. */
(function(root){'use strict';
 const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const D=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null);
 const habitat=new Set(['residence','collective']);
 const entries=G&&D?G.PRESETS.map(p=>{
  const family=D.familyFor(p.id),profile=D.profiles[family],variants=profile.variants.map(s=>s.replaceAll('-',' '));
  return Object.freeze({
   id:'seed157-'+p.id,title:p.name+' — variantes de parcelle',family:habitat.has(family)?'habitat':'activites',status:'pilote',
   summary:'Variantes réelles de décoration, de cour et de pièces pour '+p.name.toLowerCase()+' sur les cartes régionales G7. Les installations ne sont pas toutes garanties sur une même parcelle.',
   layout:'Le modèle conserve ses '+p.levels.length+' niveau(x) historique(s), ses pièces et ses meubles existants ; la graine répartit des détails supplémentaires selon leurs emprises et la fonction du lieu.',
   access:'Parcelle reliée à la route et à l’entrée historique. Chemin arrière dégagé, ouvertures en clôture et dégagement des véhicules préservés ; les obstacles générés sont testés comme des solides.',
   supplies:'Objets de détail sans butin supplémentaire. Les caisses et meubles historiquement fouillables conservent leurs montants, identifiants et prélèvements finis.',
   risks:'Piscines, abris, barrières et équipements fixes peuvent couper une ligne de vue ou un déplacement. Le décor de surface reste traversable ; aucun éclairage ou effet dangereux gratuit.',
   night:'Même visibilité et même énergie que le monde historique. Une lampe, enseigne ou piscine décorative ne crée pas de véritable réseau alimenté ou d’automatisation.',
   variants:variants.join(' ; ')+'. Choix déterministe par graine et identifiant de parcelle, avec sous-variantes de mobilier et entretien.',
   interactions:'Déplacement à pied, collision des obstacles, lignes de visée et gabarit des véhicules partagent les mêmes rectangles. Décorations non fouillables.',
   qa:'Tester plusieurs graines, la cohérence du type de bâtiment, la sortie du jardin, les étages, les emprises du parking, la réouverture du secteur et les anciens stocks.',
   source:'src/seed-detail157.js et src/frontier-world.js : détail régional G7 actif, sans nouveau modèle de bâtiment ni objet lootable.'
  });
 }):[];
 Object.freeze(entries);
 (root.DeadwallCodexPacks||(root.DeadwallCodexPacks={})).seed157=entries;
 if(typeof module==='object'&&module.exports)module.exports=entries;
})(typeof globalThis!=='undefined'?globalThis:this);
