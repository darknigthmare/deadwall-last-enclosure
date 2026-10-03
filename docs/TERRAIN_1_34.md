# Terrain et perspectives — 1.34

## Bâtiments de D-17

Les maisons de cours et les six bâtiments de chaque hameau montrent désormais un toit en vue supérieure et une façade courte. Le bord bas de façade correspond exactement au bord sud de leur volume physique. Les dimensions et les coordonnées des parcelles ne changent pas. Les anciennes rotations de quartiers tournent les empreintes au sol ; elles ne couchent plus la hauteur visuelle du bâtiment.

Les toits résidentiels disposent de deux pans, d'un faîtage et d'une cheminée. Les commerces et bâtiments de service emploient toiture plate, verrière et ventilation. Usure et ombres sont déterministes, avec 44 petites marques au maximum par toiture visible, sans appel au générateur de la simulation.

Ces maisons restent des **volumes fermés**. Leurs portes de façade sont décoratives ; cette passe n'ajoute pas d'intérieurs visitables à ces maisons. Les stations, qui étaient déjà visitables, conservent leurs véritables accès et leur mobilier.

## Fenêtres brisées utilisables

Chaque station de la révision locale 3 possède maintenant une fenêtre basse brisée sur son mur est : largeur 60 unités locales, seuil au sol, espace libre dans la collision du mur. Le joueur et les ennemis peuvent passer tant qu'aucune barricade ne ferme cette ouverture. Le rendu représente le seuil et du verre brisé. Il s'agit d'une brèche traversable, sans animation de franchissement spécifique.

La géométrie publique est `station.windows[]` avec `id`, `x`, `y`, `width`, `horizontal`, `facing` et `broken`. L'extension de barricades utilise cette ouverture réelle. Les portes existantes et portails de cour gardent exactement leurs identifiants et positions. Les révisions historiques 1 et 2 ne reçoivent pas ces nouvelles fenêtres.

## Collisions corrigées

- Les épaves générées des routes avaient une collision horizontale même lorsque leur image était verticale. Leur solide de jeu suit maintenant l'orientation et les dimensions de la carrosserie.
- Les palettes, barrières, chariots et pneus routiers avaient une boîte dépendant d'une taille aléatoire que leur peintre n'utilisait pas. Leurs dimensions physiques correspondent désormais à la géométrie dessinée.
- Le filtrage par index spatial conserve une boîte englobante rapide, puis vérifie la forme orientée exacte. Les coins vides de cette boîte ne bloquent plus le passage ou une construction.
- Les véhicules récupérables dessinés par les atlas utilisaient un carré, alors que certains sprites sont plus de deux fois plus étroits. Leurs huit proportions physiques proviennent des rectangles opaques mesurés dans les atlas livrés. La collision ne dépend pas du moment où l'image finit de charger.
- Le tri de profondeur des épaves générées utilise leur bord bas réellement orienté.
- Les murs des stations, maisons et palissades générées participent désormais aux rayons de visibilité et de contact. Il n’est plus possible de travailler sur une fenêtre depuis derrière le mur perpendiculaire voisin. Le moteur expose le premier impact exact du segment pour raccorder les projectiles sans modifier la règle existante de tir au-dessus des fortifications construites.

Les réserves utilisées pour distribuer les ressources gardent leur ancien encombrement. Ainsi, réduire une collision ne repousse pas les autres ressources au chargement. Les identifiants, positions et quantités des sauvegardes existantes sont conservés. Le plan historique reste inchangé ; les formes physiques corrigées sont dérivées par `physicalSolids134(plan)` et utilisées par déplacement, construction et navigation.

## Vérification

Les tests ciblés vérifient formes diagonales, 256 fenêtres, passages réels, murs/jambages solides, sauvegarde/reprise, ancienne géométrie, récolte et accès aux ressources. Les captures dans `reports/1.34.0/captures/` sont produites par `Game.render` sur Canvas natif avec DOM simulé. Ce ne sont pas des captures d'une session navigateur et elles ne certifient pas la fluidité GPU ou les interactions CSS.
