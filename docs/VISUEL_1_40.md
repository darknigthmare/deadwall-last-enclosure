# Fourgon et buggy — 1.40

## Manque confirmé

En 1.39, seuls le bus et le camion disposaient d'une silhouette individuelle. Le fourgon de 5,3 × 2,05 mètres et le buggy de 3,5 × 1,75 mètres reprenaient les mêmes trois rectangles du break : un habitacle fermé avec vitrage central. Cela représentait mal la longue toiture tôlée du fourgon et le châssis ouvert du buggy. Les neuf captures `qa140-before-*`, produites sur la source 1.39 conservée en lecture seule, confirment le manque dans les véritables peintres locaux et régionaux.

## Raccord effectué

Deux PNG individuels transparents complètent les illustrations : `assets/art140/van.png` et `buggy.png`. Avant à droite, caméra zénithale, fourgon fermé et buggy avec arceau, sièges, roues extérieures et moteur arrière distincts. Les fichiers sont les sorties originales copiées sans retouche de pixels ; dimensions, empreintes et provenance figurent dans `PROVENANCE_1_40.json`, avec les prompts dans `PROMPTS.md`.

`ASSETS140` s'ajoute au chargeur partagé. Le rectangle alpha est calculé une fois au chargement et l'image s'inscrit dans le gabarit du profil en gardant ses proportions. Les deux véhicules utilisent automatiquement le peintre partagé installé en 1.39, dans D-17 et dans la région. Les anciens registres et leurs fichiers restent préservés : 35 images ajoutées depuis 1.36, 51 images au total avec les atlas antérieurs.

En l'absence d'image, le fourgon garde une longue toiture fermée et le buggy une carrosserie étroite avec sièges et arceau. Les ouvrants complètent l'image sans supprimer la silhouette. Le démontage du buggy est représenté du côté de son moteur arrière visible ; son rangement s'ouvre à l'avant. Les marques du fourgon, du bus et du camion conservent leurs côtés habituels. Un véhicule à zéro PV reste visible comme épave.

La peinture ne modifie aucun profil, coût, carburant, santé, coffre, placement, collision ou format de sauvegarde. Le tri, les ombres, le marquage de parking et les marges de visibilité 1.39 sont réutilisés. Aucun défaut supplémentaire de profondeur n'a été confirmé dans les scènes de ce lot.

## Échelles et portée du contrôle

La conversion locale compacte reste `2 × 22 / 4,6` unités par unité de profil : fourgon environ 50,70 × 19,61 unités ; buggy environ 33,48 × 16,74 unités. La région utilise les mètres du profil. Les captures locales montrent encore que les anciens acteurs et bâtiments ne suivent pas tous cette même échelle métrique. Ce lot raccorde les illustrations aux emprises existantes ; il ne prétend pas harmoniser la taille physique de D-17 avec toute la région.

Les planches d'états sont des poses préparées du vrai peintre, dont le rangement et le démontage du buggy. Elles n'ajoutent ni nouvelle action ni véhicule stationné au générateur. La vérification de fouille effective porte sur un fourgon déjà produit dans le monde.

## Vérification

`tests/visual140.test.cjs` ajoute cinq contrôles : registres/alpha/proportions ; PNG spécifique dans les deux domaines sans mutation des possessions ; rotation et états conservant l'image ; silhouettes de repli distinctes ; démontage du bon côté pour le moteur arrière du buggy et le capot avant du fourgon. Avec les contrôles visuels 1.38–1.39 et les tests historiques d'expéditions, d'acteurs et de compagnons régionaux : **68/68 réussis, aucun ignoré**. Résultat dans `reports/1.40.0/visual140-final.log`.

`scripts/qa140-visual.cjs` charge le HTML dans l'ordre de production, conserve l'instance installée du jeu, charge réellement les PNG puis capture `Game.render` et le peintre régional sur Canvas natif 1440 × 960. Les deux véhicules sont construits par le vrai garage. Neuf captures avant et neuf après couvrent D-17, la région, les quatre orientations, les états ouverts/détruits/démontés et la vraie fouille d'un fourgon stationné par douze pas actifs de la touche E.

Après raccord : **51 images chargées, aucun échec** ; fourgon dessiné 31 fois, buggy 10 fois. Les 3,125 rations de cargaison personnelle et les 10 unités de carburant sont conservées après reprise. Les 1,44 ferrailles prélevées par la vraie fouille et l'ouvrant arrière visible restent présents après sauvegarde/rechargement. Les métadonnées se trouvent dans `reports/1.40.0/captures/qa140-after-visual.json`.

Les planches de rotations/états, les deux scènes locales et le fourgon rechargé ont été inspectés visuellement. Ce contrôle sous DOM simulé et Canvas natif ne certifie pas le CSS du navigateur, le tactile, l'audio ou les FPS GPU. Les positions locales avant/après peuvent différer avec les corrections de placement effectuées en parallèle ; aucune égalité pixel à pixel entre deux campagnes n'est annoncée.
