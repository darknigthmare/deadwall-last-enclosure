# Monde et déplacements — correctifs 1.37

Cette passe conserve les bâtiments, pièces, ouvertures, objets, identifiants et graines G1 à G6. Elle ne redistribue aucun stock.

## Escaliers physiques

Deux erreurs ont été reproduites dans les bâtiments réellement générés de la graine 17117, avec les scripts chargés dans l’ordre du HTML livré :

- Maison à étage `P0001` : le changement d’étage était accepté depuis l’autre côté d’une cloison située dans le rayon de proximité de l’escalier.
- Mine `P0018` : certaines positions accessibles au rez-de-chaussée devenaient des collisions au sous-sol. Le changement conservait ces coordonnées et une sauvegarde reproduisait ensuite le blocage.

`frontier.stairs` vérifie maintenant le trajet jusqu’au centre de l’escalier avec le rayon physique du personnage. Il vérifie ensuite l’espace libre aux coordonnées d’arrivée, sur le niveau demandé, avant de modifier le registre. Les obstacles posés par le joueur passent par la même collision du monde. Un refus invite à rejoindre un accès libre ou le centre de l’escalier. Il ne dépense rien et ne change aucun niveau.

Un changement accepté efface également la cible, la sélection verrouillée et la progression de fouille visuelle du niveau précédent. Le contact et le butin sont recalculés à l’étage courant lors de la mise à jour suivante.

## Reprise des anciennes positions bloquées

La validation des sauvegardes reconnaît le cas limité des anciens paliers : personnage à un étage non nul, position bloquée à moins de 1,8 m du centre d’un escalier, structure intacte, centre de cet escalier libre sur le même niveau. Dans ce cas, la reprise replace le personnage sur ce centre. Elle conserve son étage, le sac, les stocks, les prélèvements, les contacts et les identifiants. Le fichier transmis au validateur n’est pas muté.

Ce correctif n’est pas un déplacement général des personnages. Les positions libres et les positions extérieures à ce cas précis sont inchangées.

## Attribution du tir des compagnons

Le tir du compagnon sélectionnait le contact visible le plus proche, mais la résolution des dégâts recherchait ensuite le premier infecté dans le voisinage de son point d’impact. Deux contacts rapprochés pouvaient ainsi inverser le destinataire. `companionShot` transmet maintenant aussi l’identifiant de la cible à `worldEvolution.hitContact`. La sélection et le registre de blessures désignent le même infecté. Les statistiques de tir sont conservées.

## Vérification

`tests/world137.test.cjs` exécute six scénarios dans des processus indépendants au moyen de `scripts/qa137-world.cjs` :

1. Refus d’escalier à travers une cloison, sans modification du registre.
2. Refus du palier obstrué, déplacement réel vers le centre, descente, sauvegarde, reprise et retour.
3. Reprise d’une sauvegarde coincée, sans gain de ressources ni modification du fichier d’entrée.
4. Deux allers-retours par la porte arrière d’une maison G6, déplacement par les touches, montée par PageUp, reprise à l’étage, descente et sortie ; étage du mobilier et ouverture du toit vérifiés, puis éviction des caches sans modification des plans.
5. Fouille de véhicule par E, prélèvement dans le sac, tracé du coffre ouvert par le peintre du jeu et conservation après reprise et éviction du cache.
6. Tir de compagnon sur deux contacts distants de 25 cm, attribution au contact réellement sélectionné et persistance de cette blessure après reprise.

Seules les approches lointaines et des menaces déjà éliminées sont préparées dans les scènes. Les déplacements courts, changements d’étage, fouilles et sauvegardes passent par le jeu. Le temps de simulation, les dépôts des ouvriers et la consommation normale de nourriture continuent pendant les déplacements. La conservation des stocks est donc vérifiée immédiatement autour de chaque montée, descente et reprise, avec toutes les ressources, et non entre deux trajets pendant lesquels la colonie travaille.

Un contrôle supplémentaire a inspecté tous les centres d’escalier de trois graines G6 : 675 pour 17117, 816 pour 84329 et 705 pour 1. Aucun centre n’est obstrué dans ces 2 196 cas. Ce relevé ne constitue pas une preuve sur toutes les graines possibles.

Le DOM de ces scénarios est simulé. Ils ne certifient pas une mise en page CSS ni une performance graphique en navigateur. Les preuves avant correctif et le relevé géométrique se trouvent dans `reports/1.37.0/world137-stairs-before.json` et `world137-stair-centres.json`.
