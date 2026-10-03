# Monde et programmes territoriaux 1.41

Les nouvelles campagnes utilisent G7. Les campagnes G1–G6 conservent leur réseau, leurs parcelles, leurs contenants et leurs prélèvements. La nouvelle population ne remplit pas une ancienne ville au chargement.

G6 choisissait principalement les bâtiments depuis le pool naturel du biome. Ce choix donnait beaucoup de chalets, de mines ou d'ateliers à une agglomération, sans programme de services locaux. Sur les cinq graines contrôlées, 19 à 24 des 34 agglomérations n'avaient aucun service alimentaire ; 7 à 10 n'avaient aucun atelier ou lieu de maintenance reconnu.

G7 compose les agglomérations avant les sites isolés. Un hameau reçoit logement, alimentation et entretien ; un village ajoute soins et lieu civique ; les bourgs et villes ajoutent école ou bibliothèque. Ces lieux sont de vrais programmes visitables du catalogue existant, avec leurs pièces, leurs réserves finies et leurs accès. Ils ne créent ni habitants alliés, ni commerce automatique, ni approvisionnement renouvelable.

Les parcelles suivantes distinguent habitat, centre et activité. La taille de l'agglomération influe sur les familles de logement ; les activités spécialisées restent liées au biome réel de leur parcelle. Un programme ordinaire de logement ou de commerce reste possible dans un village forestier : la présence humaine et son centre constituent son contexte. Les sites isolés et les extractions utilisent leurs compatibilités naturelles. L'identité de biome enregistrée dans le lieu provient de sa position réelle, après le recul depuis la route.

Le placement de G7 réserve toute la largeur de la chaussée. Une nouvelle desserte ne peut couper une parcelle existante, et une parcelle nouvelle ne peut couper une desserte déjà acceptée. Les réservations des annexes de D-17 participent au même contrôle. Un index spatial conservateur réduit les routes candidates sans remplacer ce prédicat ; il est libéré après la population. Les empreintes de la géométrie de cinq graines sont identiques avant et après cette optimisation. Les anciennes générations conservent leur prédicat historique.

`WorldTownRules141` dans `core.js` fournit les rôles requis, les familles de programme, les poids et les limites de tentatives. `region-settlements.populate141` applique ce programme ; `frontier-world.populateG7` relie occupation, secteurs, réserves scellées et sites isolés aux propriétaires existants. `town.program141` et `poi.program141` sont des métadonnées dérivées de génération ; aucun deuxième registre de ressources ou de sauvegarde n'est ajouté.

Les cinq graines comparées et six autres graines contrôlées produisent chacune 34 agglomérations dont tous les rôles requis possèdent un lieu réel : 374 programmes territoriaux complets sur 374 contrôlés. Les 62 programmes historiques restent représentés sur chaque graine. La densité globale mesurée est inférieure à G6, conséquence des dessertes et emprises réellement réservées. Cela ne constitue pas une preuve exhaustive de toutes les graines possibles.

Preuves : `tests/world141.test.cjs`, `scripts/audit-world141.cjs`, `reports/1.41.0/world141-targeted.log`, `reports/1.41.0/world141-audit.json`. Le script d'audit compare également les empreintes exactes de géométrie, chunks et plans sur la graine 17117 pour chacune des générations G1–G6.
