# Sections de fusiliers

Trois sections fixes, **Alpha**, **Bravo** et **Charlie**, permettent de défendre des fronts différents sans modifier les coûts, les logements, la nourriture, la santé, la cadence ou les réserves communes de munitions.

## Affectation et compatibilité

- Chaque nouveau fusilier rejoint la section vivante la moins peuplée ; les égalités sont résolues Alpha, Bravo, Charlie.
- Les anciens fusiliers sans affectation sont répartis par identifiant croissant selon la même règle, sans tirage aléatoire.
- Les trois points initiaux reprennent exactement le ralliement historique de la sauvegarde. Aucune position d'unité n'est changée par la migration.
- Une affectation existante est conservée après pertes, sauvegarde et reprise. La mort d'un fusilier ne déplace pas arbitrairement les autres entre sections.
- Les ouvriers et spécialistes restent sous leurs ordres existants ; ils ne sont pas intégrés aux sections.

## Ordres et commandes

L'onglet ÉQUIPES du poste de commandement contient les sections, leurs effectifs et les trajets bloqués connus. Les boutons restent utilisables en pause tactique. Le placement au sol ferme le commandement et reprend explicitement la simulation.

| Commande en jeu | Effet |
| --- | --- |
| 4, 5, 6 | Sélectionner Alpha, Bravo, Charlie |
| G | Préparer le point au sol de la section sélectionnée |
| T | Repli de la section sélectionnée vers le centre |
| Échap | Annuler un placement préparé |

Ces raccourcis ne s'appliquent pas dans les champs de saisie ou les fenêtres modales. Les commandes d'armes 1, 2, 3 restent inchangées. « Rallier ma position » constitue une alternative sans pointage à la souris ; elle est indisponible lorsque le commandant est à terre.

Le ralliement général historique diffuse un nouveau point aux trois sections et conserve son effet sur les spécialistes. Il remet les trois sections en ordre de ralliement. Un ordre individuel ne modifie ni les autres sections ni les spécialistes.

## Comportement physique

Le ralliement conserve l'engagement historique des fusiliers : ils peuvent avancer au contact d'une menace proche puis reviennent à leur point. Ce n'est pas un ordre absolu de tenir une position sans poursuite.

Le repli prend la priorité sur la poursuite. Les fusiliers rejoignent physiquement le centre et peuvent riposter dans leur portée habituelle en consommant les mêmes munitions. Sans munitions, la crosse exige toujours le contact et une ligne dégagée.

Les routes alliées respectent les remparts et les portes verrouillées. Un trajet impossible attend un accès praticable ; ni l'ordre ni la sauvegarde ne téléportent les acteurs. Un nouveau point situé hors carte ou recouvrant un rempart/une porte verrouillée est refusé en tenant compte du rayon complet du fusilier. Les marqueurs A/B/C et les cercles de la section sélectionnée complètent la couleur, sans nouvelle animation imposée.

## Données et tests

`src/core.js` centralise `SQUAD_RULES` : trois sections et valeurs historiques de combat désormais nommées. `src/squads.js` porte les fonctions pures, sans navigateur, stockage ni RNG.

La sauvegarde v2 ajoute `squads` (version interne 1, sélection, trois ordres et points) et `Unit.squad`. L'absence du champ migre vers le ralliement historique ; les indices inconnus, ordres invalides, coordonnées non finies et formats incompatibles sont refusés avant mutation du monde.

`tests/squads.test.cjs` couvre affectation, indépendance des ordres, coûts, repli, navigation, contrôles, migration et validation. Les contrôles de rendu réels doivent être consignés séparément : ces tests Node ne constituent pas une certification d'accessibilité, de performance ou d'équilibrage commercial.
