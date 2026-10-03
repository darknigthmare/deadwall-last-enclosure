# Monde et déplacements — correctifs 1.38

La géographie, les graines, les plans, les IDs et les générations G1 à G6 sont conservés. Aucun coût, stock, profil de véhicule ou format de sauvegarde n’est ajouté.

## Frontières de D-17

La conduite locale réserve le rayon du profil actif. Les seuils fixes de sortie attendaient pourtant que le centre du véhicule s’approche davantage de la limite que sa collision ne l’autorisait. Sur la graine 17117, le bus s’arrêtait à x = 4034,20 sans pouvoir sortir, même par commande explicite ; le camion s’arrêtait à x = 4052,65 sans déclencher le départ automatique.

Les seuils de départ manuel et automatique tiennent maintenant compte du rayon déjà appliqué par `expeditions.carClear`. Le joueur peut franchir les quatre frontières avec un grand véhicule en utilisant ses touches habituelles. Les positions régionales, l’ancre locale et l’identité du véhicule utilisent toujours les conversions existantes. Le retour conserve son contrôle d’accès local.

## Portières et épaves

La première position proposée par la portière était à 1,55 m du centre pour tous les profils. Elle chevauchait le flanc du bus et du camion avec le rayon du personnage. La recherche commence désormais au-delà du demi-gabarit latéral augmenté du rayon à pied. Le terrain, les ouvertures, les barricades et les annexes continuent de bloquer une sortie obstruée.

La destruction d’un véhicule régional laissait auparavant le conducteur au centre de son rectangle devenu infranchissable : les touches de déplacement ne produisaient aucun mouvement. La destruction cherche maintenant une sortie par la même portière physique. Pour une ancienne sauvegarde gardant le conducteur à l’intérieur d’une épave, le déplacement permet de quitter ce seul chevauchement ; les autres obstacles restent actifs. Dès que le personnage est dehors, l’épave retrouve sa collision habituelle, y compris après sauvegarde/reprise. Le véhicule reste détruit et ne récupère ni carburant ni cargaison.

## Annexes et gabarits

Les bâtiments d’annexe utilisaient un rayon fixe de 2,6 m pour tous les véhicules. L’avant d’un bus pouvait ainsi entrer d’environ 2,5 m dans une façade avant l’arrêt de son centre.

`districtBlocked` accepte désormais une emprise de véhicule optionnelle. Le rectangle orienté du profil est projeté dans le repère de l’annexe et confronté aux bâtiments existants. La conduite contrôle cette emprise pendant le déplacement et avant un changement d’orientation. Les piétons et infectés conservent leur contrôle de rayon existant. Aucune parcelle ou emprise de bâtiment n’est déplacée.

## Vérification

`scripts/qa138-world.cjs` charge tous les scripts dans l’ordre du HTML livré. Les véhicules sont achetés par les commandes existantes, avec contrôle du coût. Seuls un garage achevé physiquement valide, le palier avancé, les réserves de voyage et les approches lointaines sont préparés. Les courtes approches, la conduite, les collisions, les portières et les sauvegardes passent par le jeu.

`tests/world138.test.cjs` couvre dix scénarios :

- bus et camion : départ est par touches, parcours régional, sauvegarde/reprise, retour réel et conduite après retour ;
- bus : mêmes allers-retours aux frontières nord, ouest et sud ;
- bus : même trajet sur une génération G5 conservée ;
- bus et camion : descente sans chevauchement, marche réelle, reprise et réembarquement ;
- bus détruit : sortie, marche, reprise d’une ancienne position au centre de l’épave et maintien de la collision extérieure ;
- annexe : construction par commandes, approche réelle du bus, arrêt avant façade, absence de consommation à l’arrêt, marche arrière et rotation obstruée refusée.

Les trajets et reprises conservent identité du véhicule, cargaison, sac et carburant restant. Le carburant baisse pendant la distance réellement parcourue. La simulation locale continue pendant les trajets ; aucune assertion ne confond sa consommation normale avec un coût de changement de domaine.

Les quatre suites ciblées (`world138`, `world137`, `frontier`, `frontier-rays129`) ont réussi 46 tests. Après le renforcement de la récupération des anciennes épaves et du contrôle de rotation, les deux scénarios concernés ont été rejoués et réussissent. La syntaxe des deux modules et des fichiers de test a été vérifiée. Le contrôle global `npm run check` relève de l’intégration de livraison.

Preuves : `reports/1.38.0/world138-before.json`, `world138-district-before.json`, `world138-tests.tap` et `world138-final-cases.json`. Une relecture indépendante n’a identifié aucun bloqueur.

Ces tests utilisent un DOM simulé. Ils ne constituent pas une certification du CSS, du tactile matériel, de l’audio ou des FPS GPU. Ils ne prétendent pas couvrir toutes les graines ou toutes les combinaisons d’obstacles.
