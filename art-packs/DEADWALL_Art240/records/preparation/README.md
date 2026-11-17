# Art240 — variantes existantes des composteurs et bassins

Quatre propositions de sprites source ont été générées, une pour chacune des variantes peintre 1 et 2 de `compost-bin` et `closed-pool`. Les quatre sorties natives sont retenues après inspection de l’auteur et revue visuelle indépendante de `/root`. La décision indépendante est conservée séparément dans `root-review.json` lorsqu’elle est ajoutée au dossier. Aucun rendu v0 antérieur n’a été régénéré.

Ces objets disposent déjà de rendus Canvas dans le jeu et d’analogues dans l’atlas Art157. Art238 possède en outre leurs propositions source v0. Art240 étend les propositions aux variantes existantes explicitement demandées ; il ne constate ni objet invisible ni fonctionnalité manquante. Les images restent des propositions source à calibrer avant intégration.

## Identités, instances et variantes

| Clé Art240 | Identifiant graphique | Instance auteur | Variante du plan | Variante du peintre |
| --- | --- | --- | ---: | ---: |
| `compost-bin:v1` | `prop:compost-bin:v1` | `EXT-MONDE-T045-V01:parcel:0:compost` | 1 | 1 |
| `compost-bin:v2` | `prop:compost-bin:v2` | `EXT-MONDE-T045-V01:parcel:0:compost` | 1 | 2 |
| `closed-pool:v1` | `prop:closed-pool:v1` | `EXT-MONDE-T045-V21:communal-pool` | 21 | 1 |
| `closed-pool:v2` | `prop:closed-pool:v2` | `EXT-MONDE-T045-V21:communal-pool` | 21 | 2 |

`kind` et `runtimeIdentity` restent les clés natives `compost-bin` ou `closed-pool`. `key` distingue la variante, tandis que `id` et `artId` valent `prop:<kind>:vN`. Les fichiers utilisent les suffixes `_v1` et `_v2`, sans deux-points. `canonicalVariant` et `painterVariant` sont numériques ; `sourcePlanVariant` est enregistré séparément. La route est `structural205`.

Les dimensions viennent des instances auteur exactes dans `scripts/codex-residential2026.cjs` : composteur de 1 × 1 m, hauteur maximale de 1 m ; bassin de 8 × 12 m, hauteur maximale distincte de 0,4 m et profondeur de 1,4 m. Ce sont des dimensions de conception du jeu. Les valeurs de plan et tous les attributs de l’instance sont archivés dans [selection-and-prompts.json](selection-and-prompts.json) et [canonical-render-receipt.json](canonical-render-receipt.json).

## Références et rendu canonique

Les références ont été produites par l’API publique inchangée `campaign-site-art205.drawProp`, qui délègue à `drawPropBase` puis `structuralProp`. La source est le commit `12e0aa4aa77b9901bd53eb7a8771382a5f753593`. Les 22 fichiers utilisés sont archivés avec leurs octets, SHA-256 et Git blobs dans [references/sources.json](references/sources.json). Ils ont été comparés au commit source et au checkout de travail.

La préparation a été exécutée sur le commit local `e728993ee81f50b1bcc241ffe9503304a19e6ae0`, arbre `33d089eab2bb23f288e66d57c2794f6a38b3ba84`. Le checkout est ensuite passé au commit distant réel `6ebd6707251e675a5b75ded23e91dd28339dfe38`, avec exactement le même arbre. [checkout-transition.json](checkout-transition.json) atteste que les sources sont restées identiques ; les références préparées n’ont pas été régénérées pour changer ce relevé historique.

La pose canonique place l’instance à l’origine, au niveau zéro et avec une rotation externe nulle. L’option `variant` est explicitement la variante peintre demandée. Le seed vaut zéro, `stateAlpha` vaut `false`, l’argument `art` est `null` et aucun argument de jeu n’est fourni : les surcouches de service ou d’état ne sont pas inventées. Le peintre conserve sa rotation interne pour un objet plus haut que large. Ainsi les bassins restent verticaux à l’écran, avec X vers la droite et Y vers le bas.

Canvas natif `@napi-rs/canvas` 0.1.100 et Node v24.22.1 ont été utilisés. Les composteurs sont rendus dans des références de 1024 × 1024 pixels à 720 pixels/mètre ; les bassins dans des références de 1024 × 1280 pixels à 60 pixels/mètre. Chaque rendu a été répété à l’identique en mémoire. Les fixtures gelées restent inchangées, l’état du contexte est restauré et aucun appel à `Math.random` n’a été effectué. Le rejeu indépendant de `/root`, [root-canonical-replay.json](root-canonical-replay.json), retrouve les quatre PNG canoniques octet pour octet.

L’atlas original `assets/art157/yard-atlas.png` est fourni uniquement pour ses matériaux et son traitement pictural. Son SHA-256 est `bc59caf35959c0074987e50d4a2059f63e0e17d8725d21e6b1a0b8a2ffcff6b1`. Chaque appel reçoit exactement deux références ordonnées : le canonique de la variante, puis cet atlas. Les vues, grilles et autres objets de l’atlas ne définissent pas la géométrie. Les propositions v0 d’Art238 ne sont pas données à ImageGen.

## Géométrie examinée

- **Composteur v1** : cadre complet en vue de dessus, quatre éléments verticaux en comptant les deux latéraux, et une traverse diagonale du haut gauche vers le bas droit. Les neuf groupes organiques suivent les trois rangées sous les occultations de la traverse. De petites ferrures de coin ajoutées par la génération sont déclarées comme interprétation graphique de surface.
- **Composteur v2** : deux bandes métalliques horizontales, panneau de bois à gauche avec quatre joints courts et six groupes organiques visibles à droite en deux colonnes de trois. Le panneau occulte la colonne de gauche du dessin sous-jacent ; les boulons et le grain sont des détails interprétés.
- **Bassin v1** : pourtour et ouverture rectangulaires, grand axe vertical, échelle à droite dans la moitié basse. Les deux rails et trois barreaux sont conservés, ainsi que deux lignes longitudinales verticales et cinq groupes principaux de résidus, trois à droite et deux à gauche.
- **Bassin v2** : pourtour extérieur rectangulaire ; seule l’ouverture d’eau possède huit côtés, avec quatre angles coupés. L’échelle passe à droite dans la moitié haute. Une seule ligne à deux segments se trouve à gauche, avec son coude vers la droite. Les cinq groupes de résidus conservent la répartition trois à droite/deux à gauche.

Les joints de pierre, feuilles éparses, petites attaches, grains et traces de corrosion interprètent la matière. La sélection ne vaut pas certification métrique 1:1 ou identité pixel par pixel. Aucune terrasse, pompe, couverture, personne, action ou nouveau stock fonctionnel n’a été ajouté. « Bassin fermé » signifie indisponible à l’usage, avec l’eau visible.

## Sorties natives et contrôle alpha

| Clé | Fichier retenu dans `outputs/iteration-01/` | Taille native | SHA-256 abrégé |
| --- | --- | --- | --- |
| `compost-bin:v1` | `compost-bin_composteur_jardin_v1.png` | 1254 × 1254 | `74341943da6e…` |
| `compost-bin:v2` | `compost-bin_composteur_jardin_v2.png` | 1254 × 1254 | `450d49d55866…` |
| `closed-pool:v1` | `closed-pool_bassin_ferme_v1.png` | 1122 × 1402 | `4b511e0eb83c…` |
| `closed-pool:v2` | `closed-pool_bassin_ferme_v2.png` | 1122 × 1402 | `8b4f76904cb6…` |

Les quatre appels ImageGen intégrés ont produit quatre PNG. Il n’y a aucune itération remplacée, aucun refus et aucune cible bloquée dans Art240. Les fichiers sont copiés octet pour octet depuis leurs sorties natives ; les originaux sont également conservés. Aucun crop, redimensionnement, nettoyage alpha, réencodage ou autre retouche de pixel n’a été effectué.

Les quatre PNG sont RGBA, avec un alpha allant de 0 à 255. Les marges du contenu d’alpha au moins 8 sont au minimum de 19,14 % pour le composteur v1, 18,18 % pour le composteur v2, 23,47 % pour le bassin v1 et 23,32 % pour le bassin v2. Ces valeurs ne signifient pas que toute la marge soit strictement alpha zéro : les sorties natives contiennent de faibles traces d’alpha 1 à 7 et l’alpha maximal des pixels du bord vaut 1 pour chaque image. Ce résidu natif est conservé et mesuré. Certains pixels d’alpha zéro ont un RGB non nul, ce qui ne constitue pas un fond opaque.

[alpha-audit.json](alpha-audit.json) donne les décomptes, les boîtes de contenu aux seuils 1, 8, 32, 128 et 240, les marges et les empreintes complètes. La lecture Pillow/NumPy est utilisée uniquement pour mesurer, jamais pour réécrire les images. [review.json](review.json) et [review-history.json](review-history.json) lient les observations visuelles aux SHA exacts.

## Dossier et limites d’intégration

[results.json](results.json) contient les quatre finales retenues. [history-results.json](history-results.json) conserve toutes les sorties natives, ici les mêmes quatre. Le répertoire `calls/` contient chaque requête effective, son prompt exact, les références réellement transmises et le reçu de sortie. Les prompts ne sont pas reconstruits après la génération. `selection-and-prompts.json` conserve la sélection et la spécification initiale ; les prompts effectivement utilisés restent ceux de `calls/` et des résultats.

[instructions-receipt.json](instructions-receipt.json) atteste la lecture des sept documents obligatoires dans l’ordre requis, déjà effectuée dans cette conversation, puis la vérification de leurs octets inchangés. Les guides de création d’assets et du pipeline raster sont archivés dans `guidance/`, avec leur révision et leurs empreintes. La consigne explicite de conservation native suspend leur étape de normalisation.

Les objets restent rendus par leur propriétaire runtime existant. Art240 ne modifie ni atlas runtime, ni registre, ni service, ni gameplay. L’échelle raster finale, le pivot, le détourage éventuel et la validation dans la scène devront faire l’objet d’une intégration distincte ; ils ne sont pas déclarés terminés par ce lot source.

`verify-integrity.py` contrôle les sources, blobs, références, copies natives, prompts, identités, résultats, historique, revues et alpha réel. Il écrit [integrity-receipt.json](integrity-receipt.json). Le manifeste de gel et le reçu de transmission sont produits après ce contrôle. Les fichiers indépendants commençant par `root-` sont maintenus par `/root` et ne sont pas réécrits par l’auteur.

Un unique relevé CI facultatif figure dans [optional-pr36-ci-observation.json](optional-pr36-ci-observation.json) : à 15:19:14 UTC le 17 novembre 2026, le contrôle littéral de PR36 restait en cours et Chromium était réussi. Ce relevé ne revendique aucun succès global et ne remplace pas le reçu de validation précédent. Aucun job n’a été relancé ou annulé.
