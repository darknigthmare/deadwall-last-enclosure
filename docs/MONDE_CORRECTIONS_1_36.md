# Monde, atlas et reconnaissance — corrections 1.36

Cette passe conserve la génération de terrain livrée en 1.35 : aucune route, parcelle, ressource, ville ou ancre D-17 n’est déplacée et aucun identifiant persistant n’est renuméroté.

## Reconnaissance G6 réparée

Trois défauts empêchaient le bureau de fonctionner correctement dans les nouveaux mondes :

- le registre n’acceptait pas les identifiants des villes `T135_*` ;
- les lieux du quart nord-ouest étaient classés dans les six villes historiques de l’ancienne géographie ;
- le menu des districts conservait les options créées avant le lancement de la campagne.

Les nouvelles commandes utilisent maintenant les villes réelles de la graine. Le sélecteur se reconstruit lors du changement de monde et garde une sélection valide. Les coûts, durées et limites sont inchangés : cinq rations, quarante secondes de travail effectif, trois indices au maximum, six étapes par tournée. Les indices restent approximatifs jusqu’à la visite.

Une campagne G6 1.35 peut déjà contenir un dossier ou des indices portant un ancien tag `t0`–`t5`. La reprise accepte uniquement l’association qui était effectivement valide avec l’ancien classement du nord-ouest. Ces documents sont conservés à l’identique ; aucun coût, progrès ou indice n’est réinitialisé. Cette compatibilité n’autorise pas les nouvelles commandes à viser des villes fictives. Les mondes G1–G5 conservent leur classement historique.

## Coût de la carte réduit

La carte demandait le tableau de gestion complet du bureau à chaque dessin : l’éligibilité de toutes les villes était recalculée en parcourant les lieux à répétition. La lecture `mapView()` fournit maintenant seulement les indices, étapes et arrivée. Les calques cachés ne déclenchent aucune lecture de ces marqueurs. Le petit HUD de tournée utilise également cette lecture légère quand le dossier est fermé.

La couche routière immuable dispose d’un raster par canvas destinataire, remplacé dès que monde, caméra, zoom, dimensions, densité de pixels, calque cité ou dessertes découvertes changent. Bâtiments, chantiers, déplacements, annotations, contacts et itinéraires restent dessinés à partir de leur état actuel. Les découvertes sont consultées via un ensemble, au lieu de milliers de recherches linéaires répétées.

Mesures du dessin complet de l’atlas à 1 440 × 960, tous les lieux affichés, six échantillons chauds par variante :

| Graine | Médiane avant | Médiane après |
| --- | ---: | ---: |
| 17117 | 99,21 ms | 15,52 ms |
| 84329 | 117,20 ms | 20,49 ms |
| 1 | 111,07 ms | 19,44 ms |

Ce sont des mesures CPU avec les vrais peintres Canvas sous DOM simulé, pas une garantie de FPS navigateur. La base de comparaison emploie les peintres 1.35 vérifiés dans l’archive livrée. Les premières passes froides partagent des caches de sol et ne servent pas à calculer le gain. La composition de la couche raster peut modifier l’arrondi d’anticrénelage : écart maximal observé de 3/255 sur un canal, écart moyen inférieur à 0,003/255, sans modification de géométrie.

## Contrôles

Huit nouveaux tests vérifient le raster et ses invalidations, la vraie progression d’un analyste avec sauvegarde au milieu puis reprise, les coûts, les indices et la tournée, les anciens tags G6, le refus des associations étrangères et les options de ville après changement de graine. Vingt-six contrôles historiques de reconnaissance restent verts. Trente-cinq contrôles existants de géométrie, atlas et G6 vérifient également les quatre faces de D-17, les annexes, les routes, le graphe GPS, les rayons des colliders, les étages et les roches épuisées. Cette passe n’a pas révélé un autre défaut de collision dans ces scénarios ; elle ne prétend pas avoir parcouru chaque mètre de chaque graine.

Preuves : `reports/1.36.0/field-atlas136-tests.log`, `world136-targeted.log`, `atlas136-profile.json`, `atlas136-world.png`. Commande de profil : `node scripts/profile-atlas136.cjs chemin/vers/1.35/src/atlas-render.js`.

## Relecture visuelle finale : noms des lieux

La capture régionale au zoom 12 a révélé des noms rendus à environ cinq pixels et plusieurs superpositions. Le peintre régional utilise maintenant des étiquettes de douze pixels écran, indépendantes du zoom et de la densité de pixels. Leurs rectangles sont mesurés : ceux hors de l’écran sont retirés, les noms longs abrégés et les collisions entre étiquettes arbitrées dans l’ordre lieu intérieur, repère, interaction, proximité. Les indications de retour à D-17 emploient le même système. Trois tests supplémentaires vérifient taille, priorités, absence de recouvrement, limites et absence de mutation des lieux. La nouvelle capture visuelle est confiée à la passe QA finale.
