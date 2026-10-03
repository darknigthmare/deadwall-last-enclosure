# Rendu des routes de D-17 — correctif 1.36

Le plan local révision 3 utilisait encore le peintre de la version 1.25 : aplats presque noirs, lignes médianes très transparentes et dessins de routes successifs qui recouvraient une partie des marquages. Le peintre régional partageait déjà correctement les surfaces de ses jonctions. Aucune texture d'asphalte existante n'était désactivée ou oubliée.

Le layout 3 appelle maintenant le même `DeadwallRoadKit.drawNetwork` que la région. Un adaptateur convertit les coordonnées locales en mètres uniquement pour le dessin. Il ne modifie ni le tracé, ni la largeur des voies, ni la géométrie physique, ni la seed, ni les identifiants, ni les vitesses de déplacement, ni les données sauvegardées.

- Les accotements sont dessinés avant toutes les surfaces, puis viennent les marquages.
- L'asphalte reprend la palette du peintre régional ; terre, gravier et béton restent différenciés.
- Les voies principales gardent une ligne médiane contrastée, interrompue avant les surfaces des raccordements.
- Les dessertes et l'anneau du dépôt, à une voie, restent sans ligne médiane.
- Les bouts des voies principales restent plats : aucune excroissance circulaire n'apparaît dans la cour du dépôt. L'anneau ferme ses quatre angles.
- Les adaptateurs de peinture et les intervalles de marquage sont calculés une fois par jeu de tableaux du plan. Ils sont invalidés lors du remplacement du plan par `syncPlan` (nouveau départ ou reprise). Le cache utilise un `WeakMap` et ne retient pas les anciens plans.
- Les révisions 1 et 2 conservent exactement leurs commandes de peinture historiques. En l'absence du RoadKit, le peintre précédent reste disponible comme repli.

`index.html` et `scripts/build.mjs` chargent déjà le RoadKit avant `exploration-125.js` ; aucun nouvel ordre de chargement n'est ajouté.

`tests/local-roads136.test.cjs` vérifie les tracés historiques enregistrés depuis le code 1.35, les matériaux et largeurs, l'absence de mutation ou de recalcul par image, l'invalidation au changement de seed, les pixels produits avec un vrai Canvas natif, le repli et le branchement réel dans `Game.drawGround` avec les scripts du HTML livré. Les tests régionaux et de conservation des anciennes cartes sont repris séparément.

Les images `reports/1.36.0/captures/d17-roads136-before.png` et `d17-roads136-after.png` montrent le vrai peintre routier sur un fond de référence uniforme, sans personnages ni éclairage de nuit. Ce sont des scènes de contrôle isolées, pas des captures du jeu entier. Les dernières captures du jeu complet permettent de vérifier l'intégration avec le terrain, les bâtiments et l'éclairage.
