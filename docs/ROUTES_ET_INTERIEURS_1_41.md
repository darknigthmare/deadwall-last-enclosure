# Parcours et intérieurs — 1.41

G7 est une nouvelle génération de campagne. Les 62 programmes régionaux possèdent deux dispositions intérieures déterministes par parcelle : la disposition historique et sa réflexion horizontale. Murs, pièces, meubles et escaliers sont transformés ensemble. Le plan commun sert au rendu, aux collisions, aux contenants, aux ouvertures barricadables, à la lumière et aux étages. Les issues publiques restent au centre de la façade. Stationnement et cour de service gardent leur implantation extérieure.

Le miroir conserve les identifiants, ressources et quantités finies de chaque meuble. Le changement de génération distingue les nouvelles parcelles des anciennes cartes ; charger G1–G6 garde exactement les anciens plans. Les six empreintes indépendantes provenant de la 1.40 couvrent 62 programmes et 91 niveaux, avec plans, stationnement et cours.

Le GPS G7 partage désormais le découpage extérieur autour de D-17. Ses routes régionales contournent le domaine local. Un départ fourni depuis l’intérieur de D-17 est représenté depuis un portail extérieur et porte `localSegmentRequired` : il ne prétend pas tracer un passage à travers les constructions locales. Les destinations intérieures au domaine local exigent le système de parcours local.

Le dossier Sac, coffre & relais G7 réutilise la recherche locale bornée pour contrôler le départ du joueur/véhicule et l’arrivée au dépôt. Il ne modifie ni diagnostic sélectionné, ni personnage, ni quantité. Une sortie à pied ne compte pas le carburant d’un véhicule resté au dépôt et ne facture pas de consommation d’essence à la marche. Une enceinte sans accès refuse ce budget. Le calcul sépare les distances et tarifs locaux/régionaux et respecte l’ordre de consommation de la révision moteur ; la marge de détour et la réserve fixe restent celles des règles existantes. Les barricades, portes, ressources épuisées, constructions et gabarits actuels invalident la géométrie concernée. La partie régionale reste un guidage routier indicatif : de nouveaux obstacles peuvent imposer un détour.

Un défaut confirmé du cache GPS est corrigé pour toutes les générations : les points renvoyés par une route sont des copies, au lieu de références vers le graphe partagé. Modifier une réponse ne corrompt plus les calculs suivants. Les résultats numériques historiques restent identiques quand personne ne modifie les réponses.

## Preuves ciblées

- `tests/routes141.test.cjs` : 9 cas, dont 182 plans intérieurs au rayon réel de 0,32 m, les empreintes G1–G6, les budgets séparés, une enceinte fermée, un escalier miroir et une vraie fouille à l’étage suivie d’une reprise.
- `reports/1.41.0/routes-last-tests141.log` : 9/9 contrôles 1.41 sur les fichiers gelés, dont le refus du carburant resté dans un véhicule au dépôt lorsque le joueur marche en région. Les 19 tests historiques de retour passent également ; le contrôle global les rejoue séparément.
- `reports/1.41.0/routes-after141.json` : six graines, 7 489 lieux, 7 489 accès balayés avec le disque réel de marche, 7 489 itinéraires et aucun segment régional dans D-17 ; toutes les approches et routes contrôlées passent.
- `reports/1.41.0/routes-before140.json` : six mêmes graines G6 et 9 380 approches correctes. Cette passe n’invente pas une réparation d’accès sur ces scènes déjà cohérentes.
- `reports/1.41.0/gps-cache-before-after141.json` : corruption du graphe reproduite sur la 1.40, supprimée sur la 1.41.

Ces parcours automatisés utilisent les modèles et interactions réels sous DOM simulé. Ils ne certifient ni navigateur/CSS, ni tactile matériel, ni FPS GPU. Le contrôle global de livraison est effectué séparément par `npm run check`.
