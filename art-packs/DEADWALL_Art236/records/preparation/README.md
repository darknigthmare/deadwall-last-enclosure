# Art236 — dépouille persistante du survivant

Une seule proposition de sprite source représente le survivant existant dans une pose inerte, vue strictement du dessus. Le PNG retenu est `outputs/iteration-02/survivor_inert_body.png`. Il est conservé dans les octets natifs d’ImageGen, sans recadrage, redimensionnement, retouche, nettoyage d’alpha, recoloration ou réencodage.

## Périmètre et décision

La dépouille est **déjà visible** dans le jeu grâce au fallback Canvas de `src/succession133.js`. L’audit borné n’a pas trouvé de raster du survivant spécifiquement inerte. Art137 possède une pose vivante allongée, avec mains tendues vers l’avant et sac olive incorporé. Art236 propose une pose distincte pour le corps existant ; il ne crée ni personnage, ni type runtime, ni stock.

| Élément | Contrat |
| --- | --- |
| Clé graphique | `survivor-inert-body` ; famille graphique `survivor-inert` |
| Identité de proposition | `succession:body`, distincte des identifiants d’entités sauvegardées |
| Personnage | Modèle de survivant partagé actuellement par commander, scout, porter et builder |
| Phases visées | Une même pose statique pour rest, waiting et neutralized |
| Phase exclue | risen conserve son chemin de rendu walker existant |
| Vue | Zénithale orthographique ; angle zéro : tête à droite, bottes à gauche |
| Équipement | Mains vides, aucun sac, sangle de sac, arme, outil ou objet au sol |
| Propriétaires | Corps, sac déposé et inventaire gardent leurs propriétaires existants |

Le hook optionnel `drawFallen133` est appelé mais n’a pas d’implémentation dans la révision étudiée. Cette préparation n’en ajoute aucune. Aucun atlas, registre, moteur, sauvegarde, équilibrage ou ancien pack n’a été modifié.

## Références exactes

La source de dépôt est le commit `12e0aa4aa77b9901bd53eb7a8771382a5f753593`, arbre `663ad5750e49ae401fc0b46bfdebc28942ad1617`. Les copies sont sous `references/repository/` ; `references/sources.json` consigne pour chaque fichier son chemin de dépôt, sa révision, son blob Git, sa taille et son SHA-256. Les fichiers de travail ont été comparés aux blobs de ce commit avant copie. Les sept documents prescrits par AGENTS, dont `docs/GAME_BIBLE.md`, ont été lus avant génération.

La pose canonique `references/canonical/survivor-inert-angle0.png` est un rendu natif du fallback actuel, et non un dessin imité : `boot131` crée une partie de test à graine 17117 ; le mécanisme existant de dégâts produit une dépouille ; l’entrée publique `succession133.depthEntries` dessine uniquement son corps. Le hook raster étant absent, la fonction utilise son fallback inchangé. Canvas 0.1.100 provient des dépendances verrouillées du checkout. `prepare-art236.cjs` reproduit ce rendu ; `canonical-render-receipt.json` décrit les axes, l’angle, la matrice et les limites.

L’état sérialisé avant et après le dessin est identique après exclusion du seul champ de métadonnées `timestamp`, que `src/game.js` recrée avec `Date.now()` à chaque sérialisation. Les deux empreintes, et les horodatages exclus, sont enregistrés. Ce contrôle ne prétend pas couvrir un rendu en partie réelle.

Le fallback canonique conserve son ellipse rouge sombre d’origine. Elle fait partie de cette référence exacte, mais est explicitement exclue du nouveau sprite **corps seul**. Aucun sol, sang, ombre ou marque circulaire n’a été incorporé. Le code de fallback n’a pas été changé. La tenue et les matières proviennent du PNG existant `assets/art137/survivor-prone.png`, inspecté intégralement avant usage. Le rig du commandant a aussi été inspecté pour confirmer la tenue, mais n’a pas été passé au générateur.

Les guides `create-game-assets` et `raster-pipeline` sont archivés sous `guidance/`, avec la révision épinglée et leurs empreintes. Les consignes de préservation des images natives priment ici sur une éventuelle normalisation de production ultérieure.

## Générations et revue

Deux appels au générateur intégré `image_gen.imagegen`, chacun avec transparence demandée, ont été effectués. Les arguments exacts et rôles de chaque image sont dans `generation-inputs/`. Les réponses de chemin sont dans `generation-responses/`. Chaque PNG demeure inchangé dans `outputs/iteration-01/` ou `outputs/iteration-02/`, ainsi qu’à son emplacement natif initial.

La première sortie conserve la tenue et enlève le sac, mais garde les mains en avant de la tête. Elle est rejetée pour cette pose active et conservée dans l’historique. La seconde utilise cette sortie comme cible d’édition et le fallback comme référence de pose ; elle ramène les deux avant-bras vers la taille. `history-results.json` contient les deux appels, `results.json` désigne la seconde sortie, et `selection-and-prompts.json` garde les prompts et références initiales et finales.

La revue d’auteur SHA-liée est dans `review.json`, avec la décision `accepted_source_art_proposal`. La tête, les cheveux, la veste ocre, les gants sombres, le pantalon charbon et les bottes brunes restent cohérents avec les références. Les mains vides reviennent derrière les épaules, les coudes sont écartés, le dos sans sac est visible. La silhouette entière apparaît aplatie et relâchée. La revue indépendante par l’agent principal reste nécessaire avant assemblage.

## Alpha et limites

Le fichier retenu mesure **1774 × 887**, mode **RGBA**, alpha de 0 à 255. `alpha-review.json` analyse les fichiers en lecture seule, avec histogrammes, coins, bords et boîtes aux seuils 1, 8, 16, 32, 128 et 240. À alpha ≥ 16, la silhouette est comprise dans `[164, 160, 1526, 752]` (droite et bas exclus), soit des marges gauche/haut/droite/bas d’environ **9,24 % / 18,04 % / 13,98 % / 15,22 %**. Le souhait de 12 % sur chaque côté n’est donc pas strictement atteint à gauche, mais aucun membre n’est coupé.

Le maximum d’alpha sur les bords est **1/255** : quelques pixels presque transparents demeurent dans la sortie native. Aucun pixel de bord n’atteint alpha 8. Ce bruit n’a pas été nettoyé, et les bords ne sont pas présentés comme strictement tous nuls.

Les bras et les bottes sont plus symétriques que le schéma Canvas. La proposition conserve son orientation et son arrangement des membres, mais constitue une interprétation anatomique ; ce n’est ni un calque exact ni une certification métrique. Aucun pivot, échelle de jeu, chevauchement de sac ou placement d’ombre n’a été validé dans le moteur. Le pivot vivant Art137, proche de la tête, ne doit pas être repris aveuglément pour le corps centré sur son torse. Une future intégration devra vérifier ces points et respecter le sac séparé ainsi que la phase risen.

Le périmètre de cette préparation s’arrête à l’asset et à ses preuves. Les contrôles globaux du dépôt, l’assemblage du pack et la publication appartiennent à l’étape suivante.
