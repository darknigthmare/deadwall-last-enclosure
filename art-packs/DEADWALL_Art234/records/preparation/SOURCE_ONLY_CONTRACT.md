# Art234 — Quinze propositions dédiées aux familles industrielles

Les identités sont exclusivement `prop:<kind>:v0`, où `kind` est la clé existante du `CATALOGUE`. Aucun identifiant DW n’est attribué ou déplacé. Les quinze familles possèdent déjà un rendu `procedural205` ; des silhouettes génériques analogues de tour, de scie et de perceuse existent aussi dans l’atlas d’atelier. Ce lot crée des propositions de bitmaps dédiés, sans prétendre supprimer une absence de tout rendu.

## Sources et référence géométrique

La révision source est `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Les copies de `src/codex-furnishings2026.js`, `src/campaign-site-art205.js` et `assets/art153/interior-workshop-atlas.png` sont liées au chemin du dépôt, au blob Git, au SHA256 et à leur nombre d’octets. `source-files-verification.json` vérifie chaque copie contre `git show`.

`prepare.cjs` rend une référence canonique par objet avec l’entrée publique inchangée `drawProp(ctx, null, prop, {seed:0, floor:0, variant:0, stateAlpha:false, scale:pixelsPerMetre})`. Cette entrée délègue à `drawPropBase`, qui est privée. Aucun objet `game` n’est fourni : les surimpressions de service et d’eau restent inactives. Les rectangles auteur viennent directement du catalogue. Le reçu conserve chaque objet, les options, la transformation du canvas, la taille et le SHA256 de chaque référence. Le module Canvas disponible est `@napi-rs/canvas` dans les dépendances du runtime ; aucune dépendance du projet n’est installée ou modifiée.

L’atlas d’atelier fournit seulement les matériaux et la peinture. Le prompt refuse sa caméra plus basse et son agencement de plusieurs objets. Chaque référence canonique et cet atlas ont été affichés avant utilisation.

## Génération et conservation

Une image par objet, avec l’outil ImageGen intégré et une demande explicite de transparence. Les PNG originaux, les prompts exacts réellement transmis et toutes les références sont conservés. `initial-results.json`, `history-results.json` et `results.json` sont des tableaux ; les copies sous `generated/iteration-*` sont identiques aux originaux. Aucun PNG n’a été recadré, redimensionné, nettoyé, retouché ou réencodé par un autre outil.

Les machines sont arrêtées et sans opérateur. Les éléments ajoutés restent les constituants d’une seule unité, sans terrain, équipement détaché ni stock inventé.

## Revue et limites

`review.json` lie les observations aux SHA256 des quinze PNG. `alpha-review.json` conserve les dimensions natives, les comptes alpha et les limites de silhouette à plusieurs seuils. Les résidus d’alpha très faible sont consignés séparément ; une marge du corps visible n’implique pas que chaque pixel extérieur soit strictement transparent.

Les dimensions sont des choix auteur. Le rapport largeur/profondeur des pixels du canonique peut différer du rectangle `w/h` à cause des retraits du dessin. La revue conserve ces deux informations sans transformer les proportions de la sortie en une échelle métrique certifiée. Il n’existe ici ni certification 1:1, ni validation d’ancrage, de collision ou de clipping en jeu.

Ce lot n’intègre rien au moteur, ne crée aucune implantation de campagne et ne change aucun système de rendu, de génération, de sauvegarde, de stock ou de service. Une intégration ultérieure devra évaluer échelle, ancrage, orientation, clipping et états réels séparément.
