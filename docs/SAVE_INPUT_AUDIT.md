# Échap et limites d’import

Audit ciblé après la révision `76c5abc`, avec reproductions Node dans le simulateur DOM du projet. Il ne constitue pas une nouvelle vérification navigateur ou un test d’équilibrage.

## Échap maintenu

Le premier événement ouvrait la pause, puis la répétition clavier la refermait. Depuis les paramètres ou le manuel, maintenir Échap pouvait également fermer la fenêtre, traverser la pause et reprendre involontairement la simulation.

La commande ignore désormais les événements `repeat`, tout en empêchant leur comportement natif. Une nouvelle pression après relâchement reste utilisable. Les tests couvrent pause, paramètres, manuel et annulation de placement ; une pression maintenue ne provoque qu’une sauvegarde de pause.

## Identifiants à la reprise

Un fichier dont `nextId` valait `2147483646` était accepté. La reprise attribuait cette valeur au commandant, puis incrémentait le compteur à `2147483647` : la sauvegarde et l’export échouaient immédiatement, après remplacement du monde. L’interface attribuait alors cet échec à tort au stockage.

Le commandant restauré utilise maintenant l’identité réservée `0`, déjà employée par les cibles de soins et exclue des identifiants d’entités persistées. La reprise ne consomme plus `nextId`. Les identifiants des structures, survivants et infectés sont conservés ; aucun rattrapage ni aucune réindexation n’est appliqué silencieusement.

La validation vérifie le compteur **après** calcul de `max(nextId, maximumId + 1)`. Un résultat supérieur ou égal à `2147483646` est refusé avant remplacement du monde, y compris si un identifiant élevé dans le fichier impose cette valeur malgré un petit `nextId` déclaré. Les versions 1 et 2 restent prises en charge pour les fichiers non épuisés.

La garantie testée est limitée : une reprise acceptée reste immédiatement sauvegardable et ne consomme aucun identifiant par simple rechargement. Le moteur conserve un espace numérique fini ; cette correction ne promet pas des allocations d’entités illimitées. Construction, recrutement, tir et apparition sont testés avec des compteurs ordinaires, avec leurs coûts et sans collisions d’identifiants.

## Vérification

`tests/input-save-boundaries.test.cjs` contient les huit régressions de ces deux défauts, dont le vrai contrôleur d’import, le refus transactionnel, les reprises répétées à la dernière borne acceptée et les allocations ordinaires.

Les paramètres de confort ne sont pas modifiés par cette passe.
