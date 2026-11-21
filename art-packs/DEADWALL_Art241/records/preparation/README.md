# Art241 — variantes existantes de caravanes

Quatre propositions source : `touring-caravan:v1`, `touring-caravan:v2`, `abandoned-caravan:v1` et `abandoned-caravan:v2`. Il s’agit de deux familles natives déjà couvertes en v0 par Art235. Aucun fichier du moteur, des anciens packs ou de leurs finales n’est modifié.

Les sources proviennent de main `12e0aa4aa77b9901bd53eb7a8771382a5f753593`. La préparation a été effectuée sur le checkout local `e728993ee81f50b1bcc241ffe9503304a19e6ae0`, arbre `33d089eab2bb23f288e66d57c2794f6a38b3ba84`, identique au parent publié `6ebd6707251e675a5b75ded23e91dd28339dfe38`. Les 23 copies de sources et références sont comparées aux blobs Git de main, du parent publié et au checkout.

## Identité et rendu canonique

La caravane de tourisme vient de `EXT-MONDE-T046-V01:parcel:1:caravan` ; la caravane abandonnée de `EXT-MONDE-T048-V01:parcel:1:caravan`. Leur enveloppe auteur est 2,4 × 6,2 m, hauteur 2,8 m. Leurs états restent respectivement `unoccupied` et `evacuated`, avec intérieur fermé non réalisé, aucun loot assigné et aucun raccordement.

La variante V01 du plan résidentiel (`sourcePlanVariant:1`) ne désigne pas la variante du peintre (`painterVariant:1` ou 2). Les canoniques invoquent l’API publique inchangée `campaign-site-art205.drawProp`, route `structural205`, sans argument de jeu ni surimpression de service. Les scènes sont normalisées à l’origine et rendues avec le Canvas verrouillé du dépôt ; aucune fonction privée n’est extraite ou réécrite.

Les identifiants descriptifs du pack sont `prop:<kind>:v1` et `prop:<kind>:v2`. Aucun nouvel identifiant sauvegardé n’est créé. Les coques fermées conservent leur vue zénithale, quatre roues à deux positions espacées et l’attelage vers le haut. La v1 possède deux panneaux fermés avec un cadre central ; la v2 possède un panneau central, un renfort métallique longitudinal et un patch de bois inférieur droit.

## Génération et revue

Sept appels au générateur ImageGen intégré ont effectivement produit sept PNG natifs séparés, sans refus. Les quatre premiers utilisent le canonique pour la géométrie et la palette, puis la finale v0 Art235 de la même famille pour la matière seulement. Deux corrections ciblées transforment les marques de rouille et de fissure des versions abandonnées en usure superficielle ; une troisième correction complète la longueur du renfort métallique de la v2 abandonnée.

`generation-prompts.json` archive les sept appels, leurs arguments exacts et les chemins natifs retournés. `history-results.json` conserve les sept sorties ; `results.json` désigne les quatre finales. Les trois sorties non retenues restent intactes. L’itération 3 de `abandoned-caravan:v2` utilise sa précédente sortie, son canonique et la nouvelle `touring-caravan:v2` uniquement comme référence de longueur du renfort ; cette dépendance est déclarée avec les SHA exacts.

Les fichiers PNG n’ont été que copiés. Aucun pixel, alpha, recadrage ou encodage n’a été modifié localement. L’audit Pillow lit les pixels pour vérifier les dimensions 887 × 1774, le RGBA, les bornes alpha et les marges ; il n’enregistre aucune image. Les silhouettes sont entières au seuil alpha≥8. La marge haute native est d’environ 10,8 à 11,1 %, inférieure aux 12 % demandés mais sans élément coupé ; quelques pixels d’alpha 1/255 peuvent atteindre un bord.

`review.json` lie chaque décision auteur à son SHA ; `iteration-review.json` explique les trois sorties écartées. La revue indépendante root reste requise avant assemblage. Ces images sont des propositions à calibrer, sans certification métrique 1:1, intégration runtime, intérieur accessible, nouveau stock ou service actif.
