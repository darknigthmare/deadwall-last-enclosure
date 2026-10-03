# DEADWALL 1.2 — Les Quartiers reconquis

Extension cumulative, candidate locale du 22 septembre 2026. Base : `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65`.

## Livré et non livré

Ce pack contient le système de territoires, les trois bâtiments, la simulation des fourgons, leurs interfaces, la migration v4, les correctifs cumulatifs, les installateurs et les tests. Il ne contient pas le jeu original intégral ni ses atlas. Le dossier `browser` est un banc de test explicitement simulé, **jamais installé comme jeu**. Le site public et GitHub ne sont pas modifiés.

Les six emplacements sont les sites déterministes déjà présents. Ils deviennent des territoires occupables ; ce ne sont pas six nouvelles cartes. Les douze sorties et quatre plans de la version 1.1 restent présents. Aucun monde sans limite spatiale, chemin de fer exploitable, véhicule pilotable, port natif 3D, reconstruction complète de ville ou test de campagne humaine n’est annoncé.

## Boucle de jeu

1. Construire un **poste de secteur** dans un rayon de 180 unités autour du centre d’un site de récupération. Un seul poste, achevé ou en chantier, par site. La construction reste celle du moteur ; ses ressources, technologies et surfaces libres sont requises.
2. Au centre, transférer jusqu’à 12 rations de la réserve commune dans le véritable sac, sans dépasser la place disponible. Ce transfert tient compte d’une cargaison de sortie 1.1 déjà portée.
3. Marquer le quartier dans Commandement → Terrain → Quartiers, rejoindre son poste et maintenir ACTION / E pendant 14 secondes, avec six rations dans le sac et un accès libre. Il ne doit pas y avoir d’infecté à moins de 190 unités du poste. La capture transfère exactement six rations au poste ; elle ne distribue aucun matériau ni point de recherche.
4. Affecter un ouvrier existant. Il quitte ses travaux ordinaires, rapporte d’abord sa cargaison éventuelle, puis rejoint physiquement le poste par la navigation alliée. Il garde son logement, sa santé et sa consommation de population ; aucune unité invisible n’est créée. Une menace proche le fait fuir. Le repli général détache également ces ouvriers et interdit une nouvelle affectation tant que cet ordre reste actif. Un ouvrier à distance, absent, mort, sans électricité ou sans rations ne produit pas.
5. Le travail prélève une réserve sectorielle finie et remplit un stock local de 120 unités maximum. Le tri consomme 0,025 ration par seconde active. Saturation, panne, danger et épuisement arrêtent simultanément le débit et cette consommation locale. L’alimentation ordinaire de la population reste un coût distinct du détachement.
6. Construire un garage logistique, puis engager un fourgon : 12 rations chargées et 6 carburants consommés au départ. Il rejoint le poste, remet les rations qu’il peut, charge jusqu’à 48 matériaux et revient au centre. Le crédit n’existe qu’au déchargement. Une réserve commune saturée ne détruit pas le reliquat : le fourgon attend.
7. Défendre, évacuer ou reconquérir. Une reconquête demande 22 secondes et six nouvelles rations, mais **ne reconstitue jamais la réserve déjà prélevée**.

La sélection du poste ou le marquage du quartier active son interaction. À proximité de son objectif, une sortie 1.1 active conserve la priorité de la touche E. Ailleurs, les interactions ordinaires ne sont pas remplacées.

## Territoires et ressources

| Site historique | Matière récupérée | Réserve initiale | Tri maximal / minute |
|---|---|---:|---:|
| Les Maisons sans voix | Bois | 900 | 25,2 |
| Les Arcades muettes | Ferraille | 840 | 21,6 |
| Le Camp des veilleurs | Médicaments | 64 | 1,92 |
| La Cour des citernes | Carburant | 600 | 14,4 |
| Le Terminus des cendres | Pierre | 920 | 24 |
| Le Passage du dernier feu | Munitions | 680 | 16,8 |

Les débits représentent le tri du stock sectoriel, pas le crédit au dépôt. Les stocks des gisements et des douze contrats précédents ne sont pas remplacés : ces six réserves sont des lots supplémentaires à équilibrer dans une vraie campagne. Leur quantité reste bornée par le catalogue. Les éléments narratifs sont originaux à D-17.

## Occupation et perte

États : à établir, tenu, contesté, perdu, évacué. Un infecté dans le rayon de sécurité conteste le secteur et arrête le tri. Au pied du poste, dans les 85 unités, les infectés en supériorité par rapport au commandant et aux fusiliers présents font monter la pression. Le seuil est de 24 unités de temps pondéré ; chaque seconde ajoute au maximum 3 unités. Une défense suffisante réduit la pression à raison de 1,5 unité par seconde. La pression exige une ligne hostile libre vers le poste : des infectés derrière une paroi intacte ne peuvent pas capturer au travers du mur. La destruction du poste provoque sa perte immédiate.

La perte ou l’évacuation abandonne les matériaux et les rations **sur place**, désactive la desserte automatique et rappelle l’ouvrier affecté. Les camions encore à l’aller rentrent avec leur chargement restant ; ceux qui ont déjà chargé gardent leur lot en transit. Le poste intact, les murs, les bâtiments, les logements et le stockage central ne sont pas supprimés.

Les industries ordinaires situées dans un rayon de 220 unités du site sont suspendues après sa perte, puis réactivées à la reconquête. Cette suspension n’est appliquée qu’après la première capture réelle : une ancienne ferme située dans un site jamais revendiqué n’est pas désactivée au chargement d’une ancienne campagne. Leurs bâtiments gardent leur score et leur signature. Leur allocation électrique reste celle du moteur existant, même si la production est suspendue. Le bilan logistique les compte comme industries arrêtées.

Les enceintes et portes existantes restent utilisables. La redoute donne un point de repli alternatif aux ouvriers rappelés et, sur ordre explicite, aux trois sections. Il ne s’agit pas d’un système de comptage géométrique automatique de plusieurs enceintes. La chute d’un quartier n’appelle pas le game over ; la règle historique de destruction du centre reste inchangée.

## Trois bâtiments

| Structure | Palier et condition | Coût | Intégrité / chantier | Service |
|---|---|---|---|---|
| Poste de secteur | Camp fortifié | 65 bois, 45 ferraille, 25 pierre | 1 100 / 24 s | 1 énergie, ancrage territorial, score 7 |
| Garage logistique | Avant-poste + atelier militaire | 70 bois, 120 ferraille, 35 pierre, 20 carburant | 1 250 / 36 s | 3 énergies, lancement des convois, score 10 |
| Redoute de repli | Avant-poste | 85 bois, 100 ferraille, 70 pierre, 30 munitions | 1 650 / 38 s | 4 logements, portée 280, 1,4 tir/s, 38 dégâts, 1 munition/tir, score 9 |

Leurs silhouettes Canvas sont distinctes et le fourgon possède son propre dessin. Les textures/atlas historiques ne sont ni remplacés ni redistribués dans ce pack. Le tri commun de profondeur reçoit les véhicules ; ce branchement est testé comme transformation de source. Son rendu final avec les atlas d’origine reste à vérifier.

## Fourgons et navigation

Au maximum six fourgons simultanés, un par quartier. Ils sont autonomes et non armés, non pilotables. Santé 240, vitesse 108 unités/s, rayon 11. Le moteur utilise son A* cardinal allié avec vérification du gabarit, recalcul après changement de navigation, budget de deux calculs par mise à jour et attente de 1,25 s avant une nouvelle tentative infructueuse. Le déplacement est subdivisé en pas d’au plus sept unités pour éviter de sauter une porte. Verrouiller une porte occupée par un fourgon est refusé ; un rempart en cours de construction attend également que le véhicule quitte son emprise.

Des infectés au contact infligent 7 dégâts par seconde chacun, avec six contacts maximum. La vérification de ligne hostile empêche les dégâts au travers d’un accès fermé. Ils n’ont pas besoin d’un bonus de santé ni d’un nouveau pouvoir fantastique. Le système ne prétend pas remplacer l’IA de poursuite de tous les zombies par une IA dédiée aux véhicules.

Le rappel retourne les rations et le lot encore transportés, pas le carburant déjà engagé. Une réparation à proximité, hors menace, coûte 8 ferrailles pour au plus 100 points de santé. Les fourgons bloqués ne relancent pas de débit de carburant : les six unités payées constituent le coût forfaitaire de la sortie. La desserte automatique ne contourne ni les coûts, ni la présence du garage alimenté, ni les routes.

## Sauvegarde v4

La v4 conserve le registre des sorties 1.1, les six registres de secteur, les références de postes et d’ouvriers, la réserve restante, les stocks locaux, la pression, les captures/pertes, les véhicules en transit, leur intégrité et chargement, les ouvriers en repli et la redoute sélectionnée. Les routes et caches temporaires sont reconstruits, pas enregistrés.

La validation précède le remplacement du monde. Les ID de postes et d’ouvriers doivent référencer les bonnes catégories de structures/unités présentes. Sont refusés : versions incomplètes, états non finis, doublons de travailleurs ou destinations, véhicule avec un ID réutilisé, cargaison aller déjà chargée, matière en transit dupliquée par rapport à la réserve initiale. Les simples lectures et reprises ne distribuent rien.

Les anciennes v1/v2/v3 reçoivent un registre territorial vierge. Le registre de sorties v3 reste conservé. Les nouvelles clés sont `deadwall-save-v4` et `deadwall-save-backup-v4` ; les anciennes clés restent proposées en lecture. Exporter une ancienne sauvegarde avant conversion. Le retrait du code ne rend pas les sauvegardes v4 lisibles par les versions antérieures.

## Correctif de construction complémentaire

Le correctif 1.0.1 conservait les dégâts dans `work()`, mais `completeBuilding()` remettait encore la santé au maximum. Cette remise à neuf est supprimée : atteindre 100 % de chantier ne répare plus gratuitement les dégâts antérieurs. Lorsqu’un passage occupé force le chantier à rester à 99,9 %, la petite part d’intégrité correspondante est retirée ; répéter la tentative ne permet plus d’accumuler des soins gratuits.

## Méthode et limites des preuves

Les tests de logique exécutent réellement ce moteur territorial. Les tests d’installateur et de préparateur utilisent des sources synthétiques identifiées comme telles, pour vérifier les écritures, refus et retours arrière. Les quatre profils Chromium s’exécutent en parallèle dans des contextes indépendants sur le module réel, avec un hôte de jeu explicitement simulé. Ils préparent certains états par script, déplacent parfois le joueur vers un objectif et accélèrent le temps.

Le A* utilisé dans le banc est une copie de `findFriendlyPath` et `MinHeap` de la révision GitHub indiquée ; les collisions de murs du banc restent simplifiées. Cela n’est pas quatre campagnes complètes, ni une certification de compatibilité du moteur original, de l’IA, de tous les atlas, de l’application Electron ou du cache PWA. La récupération complète de GitHub a échoué dans cet environnement ; `npm run check` du vrai dépôt n’a donc pas été exécuté.

Le préparateur cumulatif reconstruit un candidat depuis la base originale vérifiée. Il garde les images incorporées mais ne les possède pas à l’avance. L’installateur refuse les sources inconnues et garde les originaux pour retour arrière. Aucun push, déploiement ou modification des données de jeu de l’utilisateur n’a été effectué.
