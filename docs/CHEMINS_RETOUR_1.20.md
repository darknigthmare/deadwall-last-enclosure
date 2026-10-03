# 1.20 — Contrat de retour jusqu’au dépôt

## Portée

Le contrôle est une lecture des données de campagne, pas un nouvel ordre de déplacement. Il établit un chemin depuis une approche de jonction vers un point de service extérieur au centre. Il ne commande ni conducteur ni escorte, ne prélève rien et ne crée aucun bâtiment. Le format de sauvegarde reste v17.

## Gabarits et recherche

Les constantes de `ReturnRouteRules` restent dans `core.js`. La recherche utilise les contrôles physiques du piéton ou de `expeditions.carClear`. Le graphe a un pas de 32 unités locales ; quatre décalages [16,0,8,24] sont essayés pour réduire les faux négatifs aux ouvertures décentrées. Chaque segment et chaque simplification sont revérifiés avec des échantillons espacés d’au plus quatre unités.

Une recherche ne développe pas plus de 16 384 cellules par grille. Les composantes entièrement explorées sans objectif sont mémorisées dans le calcul courant. La destination doit être dans la plage du centre et satisfaire le test physique de service. Aucun objectif placé à l’intérieur d’un bâtiment solide.

Les cinq approches de chaque jonction utilisent les offsets tangentiels [0,-28,28,-56,56]. L’état du point central est conservé séparément du résultat d’ensemble. Une arrivée centrale obstruée avec des approches libres mais non reliées au dépôt donne « chemin non trouvé », pas « toutes les arrivées bloquées ».

## Invalidation

La signature couvre le monde, ses bâtiments, leurs positions, orientations, achèvements, états vivants et modes de porte, ainsi que les positions et états épuisés des props. Un changement détecté rend le diagnostic périmé ; les tracés et budgets concernés sont alors retirés jusqu’à un nouveau contrôle explicite. Une baisse de santé positive sans changement de collision ne suffit pas à déclarer une géométrie différente.

Le chargement et une nouvelle partie retirent le diagnostic. Les résultats publics sont copiés afin qu’un lecteur ne puisse pas modifier le cache par référence. La sélection d’un trajet ne modifie pas le carnet d’exploration.

## Route régionale et budget

Le graphe régional dérivé exclut les morceaux de route strictement intérieurs à D-17. Le monde original reste inchangé. Une jonction opposée se rejoint par les liaisons extérieures, pas en coupant à travers le domaine local non simulé dans la vue régionale.

En mode véhicule, la source est la position effective du break, même si le commandant s’en est éloigné à pied. En mode piéton, il faut revenir au niveau zéro pour calculer une sortie régionale. Le budget concerne le retour seul et ne passe pas automatiquement par le repère.

Les débits restent ceux du moteur : région 0,004 par mètre ; local 0,003 par unité, soit 0,096 par mètre projeté. Ils sont additionnés séparément, puis reçoit la marge existante de 25 % et la réserve fixe. Rien n’est débité par cette lecture. La suggestion routière extérieure ne certifie pas les obstacles, ni le calcul local la sécurité vis-à-vis des infectés.

## Interface

`return-routes.js` : helpers, calculs, invalidation, budget et overlay local. `return-routes-ui.js` : section dans l’atlas, tableau des quatre approches et lecture du carburant. `atlas-render.js` : tracé régional pointillé et chemin local plein. La vue locale affiche également le guide sélectionné ; les commandes habituelles restent seules responsables du déplacement.

## Vérifications et corrections

Une fixture initiale utilisait un identifiant de porte absent et une quantité de carburant initiale supposée : elle emploie désormais le catalogue réel et le stock observé. Une autre vérification a révélé un vrai faux négatif de navigation : une ouverture de deux cellules avec un prop proche pouvait être manquée par une seule grille. Les quatre phases corrigent ce cas sans supprimer les collisions, et tous les segments produits sont encore vérifiés.

Les quatre parcours navigateur préparent explicitement les enceintes, découvertes et réserves nécessaires. Le conducteur passe ensuite la jonction, suit le chemin local avec le moteur normal et décharge réellement son coffre. Cette observation ne certifie pas toutes les géométries ou toutes les campagnes. Les journaux intermédiaires sont conservés avec les résultats finaux.
