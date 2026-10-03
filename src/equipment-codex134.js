/* Field guide derives weapon statistics from the live balance catalog. */
(function(root){'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Arsenal134Rules;
const names={firearm:'Arme à feu',improvised:'Arme de fortune',melee:'Mêlée',tool:'Outil',deployed:'Défense posable'};
const cost=items=>Object.entries(items||{}).map(([key,n])=>n+' '+(C.RESOURCE_META[key]?.label||key).toLowerCase()).join(' + ');
const entries=Object.values(R.catalog).map(w=>Object.freeze({
 id:'arm134-'+w.id,title:w.name,family:'systemes',status:'jouable',
 summary:(names[w.category]||w.category)+' · '+w.description,
 layout:w.range+' m de portée de jeu · '+w.damage+' dégâts'+(w.pellets>1?' par projectile, '+w.pellets+' projectiles par tir':' par impact')+' · '+Number((w.fireRate*60).toFixed(1))+' actions/min au maximum.',
 access:w.category==='deployed'?'Fabriquer ou assembler au dépôt, transporter le dispositif puis le poser sur une emprise libre de D-17.':'Armurerie : assembler au dépôt, emporter puis équiper. Les raccourcis d’armes sélectionnent les familles de tir existantes.',
 supplies:cost(w.cost)+' · '+w.kg+' kg · palier '+w.tier+'. '+(w.magazine?'Réserve de l’arme : '+w.magazine+' coups ; coût logistique '+w.ammoPerReload+' unité(s) par coup.':'Aucune munition ; '+w.stamina+' endurance par geste.'),
 risks:'Usure : '+w.wear+' point(s) par utilisation. Une arme à zéro est inutilisable. Réparer consomme des matériaux ; changer d’arme ne reconstitue ni état ni munitions.',
 night:w.category==='deployed'?'Le poste ne fonctionne que s’il est intact et approvisionné ; les infectés peuvent l’attaquer.':'La portée ne garantit pas une cible visible. Les murs et les étages restent pris en compte.',
 variants:w.category==='deployed'?'Pose, ravitaillement, réparation et récupération physiques.':'État propre à chaque exemplaire ; coffre du dépôt et limite de portage.',
 interactions:'Stocks, portage, combat, usure, sauvegarde et succession du survivant.',
 qa:'Vérifier coûts, tirs bloqués, entretien, transfert et conservation après décès/reprise.',
 source:'Valeurs de simulation DEADWALL. Les unités de munitions sont logistiques, sans reproduction d’une cartouche réelle.'
}));
entries.push(...[
 {id:'locks',title:'Serrures et réserves fermées',summary:'Une serrure se traite au contact, dans le bon lieu et au bon étage.',access:'Ouvrir Interventions près du contenant. Ajuster les éléments du mécanisme avec les commandes affichées, puis valider.',supplies:'Outils consommables pris dans le sac ; tentatives et erreurs limitées.',risks:'Une fouille ordinaire ne contourne pas le verrou. Abandonner une tentative ne donne pas le contenu.'},
 {id:'power',title:'Remettre un bâtiment sous tension',summary:'Le générateur et le tableau constituent deux étapes distinctes avant l’alimentation.',access:'Diagnostiquer puis réparer le générateur, fournir du carburant et rétablir le tableau avec le mini-jeu.',supplies:'Ferraille et carburant transportés ; combustible et usure suivis dans la sauvegarde.',risks:'L’éclairage et les aides de travail exigent une alimentation réellement active. Un relais lointain n’alimente pas magiquement D-17.'},
 {id:'barricades',title:'Barricader une ouverture réelle',summary:'Planches croisées, bois contreventé et tôle rivetée protègent des passages physiques.',access:'Approcher une porte, un portail ou une fenêtre brisée reconnue par le système. Choisir le renfort depuis Ouvertures.',supplies:'Matériaux du sac, temps de pose, santé du renfort, réparation et récupération partielle.',risks:'Le renfort bloque aussi votre passage. Le démontage reste possible depuis les deux faces. Les fenêtres disponibles concernent les stations D-17 ; les maisons à volume fermé ne deviennent pas visitables.'}
].map(e=>Object.freeze({...e,id:'systems134-'+e.id,family:'systemes',status:'jouable',layout:'Interaction attachée à la géométrie et à l’état du lieu.',night:'Prévoir une lampe et sécuriser le secteur avant les travaux.',variants:'Conditions, coûts et commandes détaillés dans le panneau de terrain.',interactions:'Exploration, ressources, danger, sauvegarde et reprise.',qa:'Accès physique, interruption, transaction unique et persistance.',source:'Systèmes jouables 1.34 ; les mini-jeux sont des abstractions de jeu.'})));
Object.freeze(entries);(root.DeadwallCodexPacks||(root.DeadwallCodexPacks={})).equipment134=entries;
if(typeof module==='object'&&module.exports)module.exports=entries;
})(globalThis);
