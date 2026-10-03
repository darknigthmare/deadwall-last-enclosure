# Véhicules et profondeur — 1.39

## Défauts reproduits

Le bus et le camion locaux étaient dessinés comme le même petit break de 46 × 26 unités. La région étirait le rectangle du break aux dimensions du profil, sans cabine/benne ni toiture de bus distinctes. Le tri local conservait le centre du véhicule et une marge fixe de visibilité de 40 unités : l'extrémité d'un bus vertical pouvait recouvrir un acteur dessiné ensuite, ou disparaître prématurément au bord de la caméra. La barre de dégâts utilisait 320 PV pour tous les véhicules ; un bus à 325/650 PV ne montrait aucune barre.

Les défauts de profondeur, de santé et de marquage de stationnement ont été reproduits sur les sources 1.38 dans `reports/1.39.0/visual139-baseline138.log`. Les captures `qa139-before-*` montrent les véritables peintres de la source 1.38 conservée avant cette modification.

## Raccord effectué

- Deux PNG individuels transparents : `assets/art139/bus.png` et `truck.png`. Bus en vue strictement zénithale, avant vers la droite ; camion rigide avec cabine et plateau distincts. Les PNG originaux restent intacts. Le premier essai de bus oblique a été rejeté et remplacé par une édition zénithale.
- Registre `ASSETS139`, ajouté au chargeur commun : 49 images au total. Le rectangle alpha est calculé une fois par `Art.load`, puis la silhouette conserve ses proportions à chaque rotation et niveau de zoom. Aucun sprite n'est étiré jusqu'à déformer sa cabine.
- `drawVehicle139` conserve la silhouette principale pour le coffre ouvert, la destruction, la dépose du moteur et l'épuisement. Les marques et ouvrants sont de petits compléments vectoriels, sans supprimer l'image de carrosserie. En l'absence de PNG, un bus et un camion disposent de silhouettes de secours distinctes.
- Le peintre local lit le profil actif et réutilise le même peintre que la région. Le point de profondeur suit désormais le bord inférieur du corps après rotation ; la visibilité tient compte de la longueur réelle de sa représentation. Les vélos, motos et skates retrouvent également leur silhouette régionale existante lorsqu'ils sont dans D-17.
- La barre de dégâts utilise la santé maximale du profil actif et reste au-dessus de la carrosserie orientée. Un véhicule à zéro PV reste représenté comme épave.
- Les anciennes marques de parking de 2,7 × 5,5 mètres étaient plus courtes que le camion. Le marquage prend désormais les dimensions du véhicule stationné et son angle exact. La place et son véhicule restent à leurs coordonnées existantes.

Les coûts, santé, carburant, coffre, profils physiques, positions sauvegardées et collisions ne changent pas dans ce lot. La peinture du coffre ouvert des épaves régionales est toujours dérivée du prélèvement effectif. Le contrôle historique de fouille et de reprise a été adapté à l'invariant visible — ouvrant derrière le pare-chocs arrière — et ajoute le contrôle du coffre fermé avant la vraie action E.

## Échelles conservées et limites

La région travaille en mètres : bus 10,4 × 2,55 ; camion 7,4 × 2,5. La conduite locale utilise son emprise compacte historique : conversion `2 × 22 / 4,6` unités par unité de profil. La peinture suit ce support local, soit environ 99,48 × 24,39 unités pour le bus et 70,78 × 23,91 pour le camion. Elle ne prétend pas que les véhicules de D-17 ont la même échelle métrique que la région ou que tous les anciens bâtiments et personnages. Une harmonisation métrique complète nécessiterait aussi une révision des collisions, des places de stationnement et des accès ; elle n'est pas cachée dans une modification d'image.

Les 31 images ajoutées en 1.36–1.38 restent préservées. Aucun nouvel atlas d'animation, nouveau véhicule, nouvelle capacité ou état de coffre personnel persistant n'est ajouté.

## Vérification

`tests/visual139.test.cjs` contrôle les images/alpha/proportions, l'occlusion d'un acteur derrière un bus vertical, la visibilité au bord, le marquage de parking, les PV maximaux, les états visuels et l'absence de mutation du véhicule. Avec les contrôles de matières et ombres 1.38 : 9/9 réussis, sans test ignoré. Les tests historiques d'expéditions et de présentation : 54/54 réussis. Le lot groupé final totalise 63/63 réussites.

`scripts/qa139-visual.cjs` utilise l'ordre HTML de production, le vrai chargement `Art.load` et les instances installées du moteur. Les véhicules sont achetés via le véritable garage ; les positions d'approche régionales sont préparées et physiquement libres. Carburant fini et cargaison de 3,125 rations sont conservés après sauvegarde/reprise. Neuf captures avant et neuf après couvrent D-17, route régionale, quatre orientations, états d'épave/coffre et une vraie fouille de camion par douze pas actifs de la touche E. Les 1,44 ferrailles prélevées et le coffre ouvert restent conservés à la reprise. Le PNG bus a été dessiné dix fois et le camion vingt-deux fois dans ce contrôle, sans chargement en échec.

Les scènes sont préparées sous DOM simulé et Canvas natif, avec inspection des images produites. Elles ne certifient pas le CSS dans un navigateur, le tactile physique, l'audio ni les FPS GPU. Les positions de construction locales avant/après peuvent différer à cause des corrections de sécurité de placement faites en parallèle ; il ne s'agit pas d'une comparaison pixel à pixel de deux états identiques.
