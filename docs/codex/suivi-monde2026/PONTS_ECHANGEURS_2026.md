# Ponts et échangeurs — plans auteur 2026

Ce lot produit **400 plans auteur** : 50 variantes pour chacun des huit types `EXT-MONDE-T029` à `EXT-MONDE-T036`. Les cotes sont des **choix de composition originaux**, exprimés en mètres. Elles ne constituent ni un relevé d’ouvrage existant, ni une conformité structurelle ou routière. Aucun identifiant de source publique n’est inventé pour ces choix.

Chaque plan possède deux graphes distincts :

- `network` décrit les routes et chemins de maintenance effectivement inspectables au sol. Il dessert huit locaux contenant 34 pièces d’usage, avec leurs portes et circulations. Le parcours est connexe depuis une seule entrée ; bâtiments et domaine civil restent hors de ces voies.
- `transportNetwork` décrit les axes de l’ouvrage, leurs largeurs, altitudes et raccords. Il est fermé à la marche et à la conduite dans cette livraison. Les altitudes ne sont pas remplacées par une taille graphique réduite. Les raccords extérieurs ont tous `connectedToWorld:false`.

Le domaine civil central est un véritable obstacle fermé dans l’inspection. On ne peut donc pas marcher sur le tablier, sur le cours d’eau réservé, dans une bretelle, ni dans un passage inférieur simplement parce qu’un trait de plan y apparaît. La géométrie routière est une vue de conception distincte de la visite des locaux.

Chaque base de maintenance possède une vraie salle de soins du personnel et une réserve de pansements dans les locaux du personnel. Ces deux pièces s’ajoutent aux vestiaires, douches, réfectoire et sanitaires conservés. La salle de soins reçoit effectivement son mobilier médical et son lavabo ; la réserve comporte des rayonnages. Ce programme de premiers soins ne crée aucun consommable, soignant ou effet de soin et ne revendique pas une conformité réglementaire.

## Programmes et dimensions

| Type | Ouvrage | Emprise du premier plan → dernier plan | Composition civile |
| --- | --- | --- | --- |
| T029 | Pont routier à poutres | 800 × 620 → 1 440 × 940 m | Tablier de 64 à 178 m ; culées et piles ; largeur de 10,5 ou 17,5 m. |
| T030 | Pont à arches | 1 000 × 680 → 1 640 × 1 000 m | Tablier de 96 à 210 m ; deux à six arches de conception et leurs appuis. |
| T031 | Pont levant portuaire | 900 × 660 → 1 540 × 980 m | Tablier de 56 à 170 m, quatre tours ; mécanisme explicitement immobilisé. |
| T032 | Viaduc ferroviaire | 2 600 × 800 → 4 200 × 1 120 m | Tablier de 240 à 578 m, largeur réservée de 9 m ; longues approches conservant leur pente. |
| T033 | Échangeur en losange | 1 200 × 1 200 → 1 840 × 1 520 m | Deux axes superposés, quatre bretelles diagonales. |
| T034 | Échangeur en trompette | 1 200 × 1 200 → 1 840 × 1 520 m | Branche non traversante, une boucle de 270° et deux axes de bretelles directs. |
| T035 | Trèfle autoroutier | 1 400 × 1 400 → 2 040 × 1 720 m | Quatre boucles de 270° et quatre bretelles directes. |
| T036 | Échangeur directionnel | 1 400 × 1 400 → 2 040 × 1 720 m | Huit tracés de bretelles sans boucle, répartis dans quatre quadrants. |

Les 50 variantes combinent cinq emprises avec dix arrangements et dimensions de tracé. Les locaux gardent des dimensions de bâtiment cohérentes au lieu de grandir à la taille du réseau. Les voies ne sont pas compressées pour tenir à l’écran.

Le tablier autoroutier est à 8 m au-dessus de l’axe inférieur ; l’épaisseur auteur de 1,2 m donne un gabarit nominal de 6,8 m. Les nœuds centraux restent distincts : un croisement dessiné ne crée aucune jonction entre les niveaux. Les rampes ont des altitudes interpolées par leur longueur réelle. Les gradients maximaux admis par ce lot sont des limites de composition : 6 % pour la route et 2,5 % pour le rail. Ces nombres ne certifient pas l’aptitude d’un véhicule ou d’un train à parcourir les tracés.

Les ponts conservent une cote de tablier, son épaisseur, deux culées, les appuis particuliers et un gabarit inférieur calculé depuis un niveau d’eau auteur à zéro. Le pont levant reste en position fermée et immobilisée : ni énergie, ni animation, ni ouverture de chenal n’est déclarée fonctionnelle. Les surfaces d’eau sont des réservations de plan, sans navigation ni profondeur hydrodynamique simulée.

## Contrôles et portée

`tests/codex-civil-networks2026.test.cjs` vérifie les 400 identités, la reproductibilité sans RNG de campagne, les 50 géométries distinctes par type et la connexion des graphes. Des contre-exemples refusent notamment : nœud inventé entre chaussées superposées, pente excessive, gabarit falsifié, appui absent, branche orpheline, axe hors du domaine, route de maintenance dans un bâtiment ou domaine fermé, faux raccord au monde et faux stock.

La visite physique et le mobilier sont contrôlés sur les variantes 1, 25 et 50 des huit types, soit **24 scènes**. Les 34 pièces d’usage sont équipées sans usage inconnu. Les contrôles constatent dans chaque salle de soins l’armoire médicale, le fauteuil de consultation et le lavabo effectivement placés, ainsi que les rayonnages dans la réserve de pansements, sans prescription refusée dans ces deux pièces. Les parcours de maintenance restent libres et le centre demeure réellement bloqué. Cette vérification ciblée ne remplace pas l’audit global de toutes les variantes que produit le rapport d’inspection courant.

L’audit du graphe de transport contrôle ses pentes et les intersections des axes segmentés. Il ne qualifie pas les enveloppes dynamiques de véhicules, les rayons de giration, les zones de tressage, la sécurité des fusions, le plan de circulation par sens, les piles sous charges ou la signalisation. Les tracés sont des axes de conception, pas un réseau routier opérationnel complet.

Il n’y a aucun nouveau contenant de butin, courant disponible, recette de production, train, véhicule ou ressource créée. L’implantation dans les seeds, le raccord physique des chaussées, les rencontres, les services payés, les graphismes définitifs et les états persistants de campagne conservent leurs tâches ouvertes.
