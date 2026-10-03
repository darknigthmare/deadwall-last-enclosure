# Visuel — 1.38

Cette passe audite le rendu Canvas existant de D-17, des bâtiments régionaux et des intérieurs. Elle conserve les empreintes, passages, positions, identifiants, étages, files de profondeur et générations G1–G6. Les 27 images de nature/sol/équipement 1.36 et les deux postures 1.37 restent utilisées.

## Observations et corrections

| Observation vérifiée | Modification | Preuve |
| --- | --- | --- |
| Les ombres des murs, meubles et véhicules régionaux changeaient de direction avec l'orientation de la parcelle ou du véhicule. À 180°, leur décalage partait vers le nord-ouest. | Le décalage du soleil conserve maintenant un vecteur monde vers le sud-est, transformé vers les coordonnées locales avant peinture. Les rectangles et contacts de profondeur restent identiques. | `tests/visual138.test.cjs`, cinq angles, murs et meuble tournés réels ; captures des deux intérieurs. |
| Les sols industriels et toitures techniques restaient de grandes surfaces uniformes à côté des arbres, du générateur et du commandant détaillés. | Deux textures originales opaques de 1254 × 1254 : tôle patinée et béton intérieur. Elles sont intégrées aux peintres existants à échelle métrique constante. | Six scènes de jeu avant/après et planche de répétition Canvas native dans `reports/1.38.0/captures/`. |
| Le script de capture 1.36 remplaçait l'instance Art après l'installation des extensions, ce qui pouvait perdre les peintres ajoutés à cette instance. | Le script 1.38 conserve l'instance installée et hydrate seulement les images, découpes et diagnostics provenant du véritable chargeur. | `scripts/qa138-visual.cjs`, ordre des scripts du HTML livré. |

## Ciblage des matières

Le runtime ne possède pas de propriété physique de couverture. La sélection ci-dessous est une convention artistique explicite fondée sur les types existants ; elle ne modifie aucune règle matérielle ou de construction.

| Domaine | Types | Toiture | Sol |
| --- | --- | --- | --- |
| Région | `warehouse`, `selfstorage`, `garage`, `sawmill`, `freight`, `logisticsHall`, `smallWorkshop`, `generatorRoom` | Tôle | Béton lorsqu'ouvert |
| Région | `basementHouse` | Peintre historique | Béton au sous-sol seulement |
| D-17 | `workshop` non résidentiel des quartiers existants | Tôle | Peintre historique |
| Autres lieux | Habitations, commerces, cliniques, écoles, serres, ruines | Peintres historiques | Peintres historiques |

Les toits gardent rives, faîtages et équipements. Les sols sont peints avant murs, mobilier, escaliers et acteurs. Le clip s'arrête aux rectangles existants ; les motifs ne couvrent pas les murs ni les marches. Une ruine ou destruction reçoit toujours son traitement historique de dégradation. La teinte du bâtiment ou des pièces demeure sous la texture, avec une opacité de 72 % pour la tôle et 58 % pour le béton.

Une répétition représente 8 m pour la tôle et 3 m pour le béton. D-17 emploie la même conversion de 32 unités par mètre, également dans sa projection régionale. L'origine suit le repère du bâtiment : déplacer la caméra ne déplace pas la matière. Deux petits rasters Canvas de 256 × 256 sont calculés une fois depuis les images chargées pour réduire le scintillement des détails fins, sans modifier les PNG. Les caches sont faibles par image/contexte et limités aux deux clés de matière ; ils ne mémorisent aucun bâtiment ni chunk.

## Perspective et profondeur

Le jeu combine actuellement les façades courtes projetées vers le nord de D-17, les vues régionales orthographiques et plusieurs atlas historiques obliques. Cette passe ne transforme pas ce moteur en projection 3D uniforme. La hauteur des façades locales reste indépendante de l'orientation des parcelles. Le commandant debout et les nouvelles postures basses 1.37 conservent leurs pivots et dimensions.

Les vérifications ciblées confirment les contrats existants : contacts bas des rectangles et véhicules tournés, meubles avant/après le joueur selon sa position, masquage sous toit fermé, ruines/destruction ouvertes, séparation des étages, matériel et compagnons dans la même file. Aucun correctif supplémentaire de tri n'était nécessaire sur ces scènes. Les véhicules et la majorité du mobilier régional restent des dessins géométriques ; aucune nouvelle silhouette fictive n'est annoncée.

## Vérification reproductible

- `node scripts/qa138-visual.cjs after` : six scènes préparées de la graine 17117, chargeur et peintres Canvas réels, 47 assets chargés, zéro échec ; deux utilisations en scène de chaque matière et une sur la planche de contrôle.
- `node --test tests/visual138.test.cjs tests/visual137.test.cjs tests/spatial-planes130.test.cjs tests/regional-companion-art.test.cjs tests/ground135.test.cjs` : sélection restrictive, ombres tournées, clip, transparence extérieure au clip, stabilité caméra, alpha opaque des PNG, postures, profondeur, compagnons et sols G6.
- La planche `qa138-after-materials-repeat.png` présente chaque texture en 2 × 2 répétitions. Inspection visuelle native : absence de cadre artificiel ou de trou aux raccords, nervures continues et transitions de béton discrètes. Le motif répété reste perceptible de près ; aucune promesse de texture mathématiquement apériodique n'est faite.
- Rapport machine et fichiers : `reports/1.38.0/captures/qa138-after-visual.json`, `reports/1.38.0/visual-tests.log`. Le gate général `npm run check` est exécuté au lot d'intégration, pas par le sous-audit visuel.

Les captures emploient un DOM simulé et `@napi-rs/canvas`. Elles attestent le rendu des peintres et leurs données de scène. CSS interactif, tactile physique, audio et FPS GPU ne sont pas validés par cette méthode.
