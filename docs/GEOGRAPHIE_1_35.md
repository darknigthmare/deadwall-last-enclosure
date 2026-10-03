# Géographie G6 — 1.35

Les nouvelles campagnes utilisent G6. La graine définit à la fois le relief écologique, les ressources, les lieux, le réseau routier et l'emplacement régional de D-17. Reprendre ou rejouer une même graine reproduit ces éléments. Le tirage d'une nouvelle graine appartient au démarrage de campagne, pas aux fonctions de géographie.

## Carte et ancre

La région reste une carte finie de **24 576 × 24 576 mètres**. Elle est entièrement générée selon la même grammaire, sans carré historique ajouté dans son angle nord-ouest. D-17 occupe toujours ses 128 × 128 mètres de simulation locale ; son centre régional varie entre 36 et 64 % de chaque axe. Au moins huit kilomètres restent donc disponibles de chaque côté.

`DeadwallGeography135.home(seed, generation)` renvoie une valeur immuable propre à cette graine : `x`, `y`, `size`, `minX`, `minY`, `maxX`, `maxY`. Les mondes régionaux exposent cette ancre via `world.home`. Aucune constante globale n'est réécrite lors d'un changement de campagne ou de la validation d'une autre sauvegarde.

Les anciennes générations G1 à G5 conservent leur centre régional historique (4 096 ; 4 096), leurs routes, leurs identifiants de parcelles, leurs intérieurs et leurs gisements. Elles ne sont pas déplacées automatiquement : cela invaliderait l'exploration et les lieux de stockage déjà sauvegardés.

## Réseau sans grille générale

Trente-quatre agglomérations sont réparties par tirage avec espacement minimal, en évitant l'emprise de départ. Les profils écologiques rares sont desservis en premier pour éviter qu'un biome présent ne reste dépourvu de lieux ou de programmes spécialisés. Elles possèdent des tailles, orientations et implantations propres. Leurs rues suivent trois implantations déterministes : village-rue, bourg à liaisons partielles et quartier à plusieurs axes. Une rue principale courbe dessert plusieurs carrefours décalés ; les rues secondaires n'ont pas un sommet central commun. Zéro à trois liaisons latérales relient certains voisins, sans ceinture polygonale systématique ni quadrillage régional.

Un arbre de connexion minimal relie les agglomérations, les quatre approches de D-17 et quatre terminus proches des limites régionales. Des boucles courtes ajoutent des itinéraires alternatifs. Les liaisons sont sinueuses, découpées au plus tous les 96 mètres et divisées à leurs véritables intersections par le graphe routier existant. Les itinéraires GPS emploient ces mêmes segments.

Les itinéraires passant près de D-17 contournent son emprise. Seules ses quatre approches axiales pénètrent dans la projection locale. Une bande libre entoure toutes ses faces pour autoriser les sorties à pied et en véhicule ailleurs qu'au milieu de la route. Les cinq emprises d'annexes sont réservées avant de poser bâtiments et végétation. Leurs poses G6 proviennent de `Geo.annexes` ; les quatre annexes cardinales présentent leur allée centrale de huit mètres face à la route de sept mètres. Les autres liaisons contournent ces emprises.

## Implantation et biomes

Les programmes visitables existants sont conservés : 62 modèles avec leurs étages, meubles, véhicules, cours, générateurs, tableaux et réserves. Le biome propose une sélection pondérée des programmes ; toute implantation reste soumise aux contrôles physiques de parcelle. Une chaussée ne peut pas traverser l'enveloppe de service d'un bâtiment et deux réservations de parcelles ne peuvent pas se recouvrir.

Chaque accès part d'un point réel du réseau et rejoint la façade. Les routes sont finalisées avant les bâtiments ; aucune rue ajoutée ensuite ne coupe une parcelle déjà construite. Les occupations, relais alliés, réserves éloignées, prélèvements et secteurs 1.31 restent raccordés au même registre. La distance de danger est mesurée depuis l'ancre réelle de D-17.

Les ressources naturelles G6 proviennent de `DeadwallBiomes135.scatter`. Les routes, leurs accès privés, les parcelles et l'emprise de D-17 sont exclues du placement. Les identifiants de récolte gardent le format historique. Les petits décors n'ajoutent pas de réserves infinies. Le cache de géométrie reste limité à 25 chunks et 48 plans d'intérieur.

## Collision et récolte

La collision naturelle consulte désormais les prélèvements réels par `effects.resourceTaken`. Un rocher entièrement récolté, qui n'est plus dessiné, cesse de bloquer les déplacements, tirs et véhicules. Une souche conserve une collision réduite à son rayon visible de 18 cm au maximum. Les contenants et identifiants restent disponibles pour valider les historiques de récolte après sauvegarde.

## Vérifications

`tests/geography135.test.cjs` vérifie la reproductibilité, la diversité des graines, les marges autour de D-17, l'absence de grille générale, les raccordements des quatre côtés, la conservation des programmes, les parcelles hors routes, les caches et les collisions de récolte. Le test de navigation traverse le vrai graphe GPS et vérifie que chaque accès de lieu est relié à D-17.

Échantillon mesuré : graine 17 117, 1 628 lieux et 3 330 segments ; graine 84 329, 1 604 lieux et 3 139 segments ; graine 42, 1 437 lieux et 3 062 segments. Les 62 programmes sont présents dans les sept graines examinées (0, 1, 42, 17 117, 84 329, 903 145, 4 294 967 295). Chacune dessert les douze biomes et emploie les trois implantations locales. Le graphe GPS est vérifié séparément par les tests de connexion. Les mesures CPU ne certifient pas les FPS ni une campagne humaine prolongée.

La carte reste plane du point de vue de la collision : les variations écologiques de hauteur ne constituent pas des falaises 3D. Les limites régionales restent finies et la route s'arrête à ses terminus ; aucune continuation infinie ou traversée de mer n'est annoncée.
