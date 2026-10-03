# Départ des projectiles locaux — 1.38

## Défaut reproduit sur la 1.37

Le tir du joueur créait sa balle 22 unités devant le personnage. Une barricade mince entièrement située entre le personnage et cette origine était donc sautée avant le premier contrôle de collision. Le tireur pouvait rester sur un emplacement physique libre et atteindre un infecté derrière une ouverture renforcée.

La reproduction utilise la fenêtre brisée `local:station-1:window:broken-east`, dans une vraie scène D-17 de graine 17117. Une barricade en planches est construite par son service temporisé avec les matériaux préparés dans le sac. Le joueur est placé à 16 unités de son axe, l’infecté à 42 unités de l’autre côté. Les emplacements et l’ouverture initiale sont vérifiés par la géométrie du jeu. Le même essai est réalisé depuis les deux faces.

| État après un tir de pistolet | 1.37, deux faces | 1.38, deux faces |
| --- | ---: | ---: |
| Santé de l’Errant, initialement 72 | 30 | 72 |
| Intégrité de la barricade, initialement 120 | 120 | 78 |
| Cartouches, initialement 12 | 11 | 11 |
| État du pistolet, initialement 100 | 99,82 | 99,82 |

La preuve numérique est conservée dans `reports/1.38.0/projectile138-impact-proof.log`. Le journal `projectile138-baseline137-physical.log` rejoue le test corrigé sur les sources 1.37 : les deux assertions de protection échouent, tandis que le scénario allié réussit déjà.

## Correction

`Game.projectileOrigin` vérifie le segment entre le tireur et la bouche de l’arme contre les obstructions locales et les barricades. Si ce court segment rencontre une surface, la balle démarre au tireur ; le résolveur continu existant traite alors le premier impact et applique les dégâts à la barricade. Un départ libre conserve son origine habituelle. Les tirs du joueur et des alliés emploient ce même calcul.

Le scénario allié constitue un contrôle de conservation : il passait déjà en 1.37 et n’est pas présenté comme un défaut reproduit. Les statistiques d’armes, la portée, les coûts, les dégâts critiques et la géographie restent inchangés. Aucun projectile transitoire n’est ajouté à la sauvegarde.

## Vérification et correction de la scène de test

`tests/projectile138.test.cjs` utilise l’ordre HTML livré via `scripts/qa-startup134.cjs`. Pour chaque face, il vérifie les dégâts exacts sur la barricade, l’absence de blessure derrière elle, la dépense d’une cartouche, l’usure normale, puis la sauvegarde et la reprise. Une fois la barricade détruite, une deuxième balle traverse l’ouverture et inflige exactement 42 dégâts à l’Errant, qui passe de 72 à 30 PV.

Le premier essai de reprise du test contenait trois problèmes de préparation : il imposait 100 PV à un Errant dont le maximum était 72, conservait implicitement une visée non sauvegardée, et appelait directement le résolveur de projectiles sans reconstruire l’index des infectés. Le chargement normal ramenait donc les PV à 72 ; l’index vide empêchait ensuite tout impact et la face opposée perdait aussi son angle. `projectile138-fixture-diagnosis.log` consigne ces états. La scène utilise maintenant la santé réelle du profil, réapplique sa visée déterministe après reprise et reconstruit l’index comme le fait `Game.update` avant les impacts. Les assertions de dégâts restent exactes.

Commande ciblée : `node --test tests/projectile138.test.cjs tests/projectile-weapon.test.cjs tests/barricades134.test.cjs`. Résultat : **34 tests réussis, aucun échec**, dans `reports/1.38.0/projectile138-final.log`. Le contrôle global reste celui de la livraison. Ces preuves de simulation sous DOM de test ne certifient pas le rendu CSS ni une campagne humaine complète.
