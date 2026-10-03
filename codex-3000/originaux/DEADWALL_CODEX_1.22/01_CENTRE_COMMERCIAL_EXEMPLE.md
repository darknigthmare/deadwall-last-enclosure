# DW-0041 — Exemple composé : « Les Arcades du Val »

**Spécification d’un futur grand lieu, pas déclaration d’un niveau déjà entièrement intégré.** Le plan pilote actuel est une base simplifiée de 82 × 56 m sur deux niveaux. L’exemple ci-dessous développe la logique du programme pour une future variante plus riche.

## Parcelle et masses

Proposer une parcelle de 230 × 185 m, soit 42 550 m², desservie par une voie locale connectée au réseau principal. Ce grand exemple élargit explicitement l’enveloppe générique de sa famille : enregistrer cette dérogation de variante, ne pas prétendre qu’il rentre dans une parcelle de 25 × 20 m.

Placer un bâtiment principal de 112 × 74 m vers le fond, une aire clients au sud, un accès service à l’est et une cour arrière au nord. Le parvis mène à deux entrées distinctes. Réserver une circulation piétonne protégée entre les rangées du parking et l’entrée ; les chariots ne sont pas abandonnés sur chaque place.

Un parking de 144 places peut être composé en quatre modules de 36 places. Chaque module contient deux rangées de 18 places de 2,7 × 5,5 m et une allée de 6 m : environ 48,6 × 17 m avant trottoirs et plantations. Deux modules côte à côte et deux en profondeur occupent environ 104 × 40 m avec séparations. Ce budget ne comprend ni la dépose, ni les emplacements utilitaires, ni les raccordements routiers : les placer séparément dans la parcelle.

L’occupation après évacuation n’est pas de 144 voitures. Tirer un taux de présence selon le scénario : 12–25 % un jour de fermeture, 35–60 % après évacuation interrompue. Les véhicules sont des objets de taille réelle, orientés selon leurs places. Une scène d’accident concerne un petit groupe localisé, pas tout le parking.

## Graphe d’usage

Public : `voie → parking/piétons → parvis → sas → mail → boutique → caisse → sortie`.

Employés : `accès latéral → vestiaire → couloir de service → boutique / local technique`.

Livraison : `voie de service → cour arrière → quai → réception → réserve dédiée → surface de vente`.

Déchets : `boutique / restauration → sas sale → local déchets → cour de ramassage`. Ce trajet ne passe pas par une réserve alimentaire propre.

Les sorties de chaque aile doivent rejoindre l’extérieur sans traverser une autre boutique fermée. Une fermeture partielle peut isoler une cellule mais ne peut condamner arbitrairement l’ensemble du mail.

## Sous-zones

Le **mail principal** fait 7–9 m de largeur utile ; il contient bancs et signalétique dans des alcôves, jamais au milieu du couloir réservé. Ses vitrines donnent sur les boutiques. L’étage peut comporter une coursive et une trémie, mais la trémie doit exister comme vide, pas comme texture sur un plancher traversable.

Deux **magasins locomotives** occupent des extrémités différentes : une surface alimentaire avec stock froid et une surface d’équipement avec réception volumineuse. Leur mobilier et leurs butins ne sont pas interchangeables. L’alimentaire dispose de caisses en sortie, rayons, zone fraîche et réserve arrière ; l’équipement possède showrooms ou travées, atelier éventuel et retrait de gros objets.

Douze à seize **boutiques** sont regroupées par cellules. Chaque cellule comporte façade, porte publique, vente, caisse, réserve et liaison service. Une boutique de vêtements contient portants et cabines, une librairie des rayonnages et une réserve de cartons, une pharmacie des tiroirs et une réserve médicale contrôlée. Les noms d’enseignes peuvent varier, pas la logique du programme.

La **restauration** comprend une zone de tables et plusieurs cuisines de tailles modestes, reliées à leurs stocks et à la plonge. Les plateaux usagés suivent un retour distinct. Les réserves froides proches de la réception alimentent les cuisines ; on ne place pas les frigos au milieu du mail pour faciliter artificiellement la collecte.

Le **couloir arrière** fait environ 3–4 m et distribue les réserves. Les portes y sont espacées selon les cellules. Les chariots et palettes stationnent dans des poches, avec une largeur de circulation résiduelle testée. Des véhicules lourds circulent seulement dans la cour extérieure et pas dans le couloir des employés.

Les **locaux techniques** regroupent distribution électrique, entretien et ventilation. Leur état peut expliquer une obscurité partielle ; une lumière décorative ne reste pas active après une coupure simulée. L’accès y donne des ressources techniques cohérentes et éventuellement une information, pas un plein de nourriture aléatoire.

Les **sanitaires, vestiaires, sécurité générale et ménage** sont de petites sous-zones identifiables. Le ménage stocke chariots et consommables ; les vestiaires des casiers ; le poste d’accueil des plans et registres. Aucun plan de sécurité réel d’un site existant n’est reproduit.

## Mise en scène de la chute

Choisir une histoire dominante :

- **Évacuation interrompue** : objets de voyage près des sorties, véhicules encore stationnés, quelques files désorganisées ; réserve arrière moins visitée.
- **Pillage de façade** : vitrines et caisses ouvertes, rayons publics clairsemés, livraisons arrière encore possibles ; ni tous les meubles renversés ni chaque pièce vide.
- **Incendie de cuisine** : dégâts concentrés dans une aile et autour des réseaux voisins ; poussières sous rupture ; un autre parcours reste vérifiable.
- **Abandon envahi** : végétation d’abord dans le parking, les joints, les verrières et les portes ouvertes ; les magasins sans lumière ne deviennent pas une forêt identique à l’extérieur.

Les débris sont générés à partir d’éléments réellement détruits, avec un support et une hauteur. Le feuillage peut recouvrir une voiture mais sa collision ne doit pas rendre ses portières accessibles à travers un tronc.

## Butin et épuisement

Établir d’abord un budget par activité. Les aliments sont répartis entre vente, cuisine et réserves ; les médicaments dans une pharmacie ou un poste de soins ; les matériaux dans réception et maintenance. L’ouverture d’une porte, le retour d’un étage ou le rechargement du secteur ne remplit rien.

Les ressources proches du parking sont faciles à extraire mais souvent déjà entamées. Les réserves arrière demandent une traversée plus longue. Le joueur peut organiser plusieurs sorties, mais il doit retrouver les mêmes contenants et les mêmes quantités restantes. Une future information du bureau de réception peut révéler le dépôt qui livrait ce centre ; elle ne crée pas ce dépôt à proximité du joueur.

## Validation spécifique

Tester les deux entrées, chaque boutique obligatoire, chaque réserve, les locaux techniques et tous les niveaux. Tester les mêmes trajets avec une porte fermée ou un sinistre local. Vérifier la manœuvre d’un break dans une allée et l’accès au coffre ; ne pas comparer seulement la largeur du sprite avec le vide du décor.

Captures requises : vue de la parcelle avec routes ; voiture et personnage côte à côte ; entrée du mail ; réserve avec service arrière ; coupe de chaque niveau ; état endommagé et parcours restant. Rapport obligatoire : programme intégré, éléments encore manquants, contrôles de collision, sauvegarde des stocks et temps de génération. Une liste de 16 boutiques sans leurs pièces ne suffit pas à qualifier 16 boutiques jouables.
