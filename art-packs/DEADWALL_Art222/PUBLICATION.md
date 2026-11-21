# Publication du lot Art222

Ce dossier conserve le contenu complet du pack Art222 livré le 17 novembre 2026 : huit sprites retenus, les deux premières versions remplacées après revue, les références du Codex, l’atlas de style, les prompts et le point de reprise.

Les fichiers du pack ont été copiés sans modification. `SHA256SUMS.txt` décrit ce contenu d’origine ; ce document de publication lui est ajouté. Les mentions d’absence d’écriture GitHub dans les rapports d’origine décrivent la phase de génération avant cette publication.

## Périmètre de la PR

La branche est créée depuis `main` au commit `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Les références artistiques et les fiches avaient été récupérées à la tête de la PR24, `c9e60c28d8a4b831b94f64c64c766eb724a90d25` ; elles sont conservées avec leurs empreintes et liens d’origine.

Les PNG retenus se trouvent dans `assets/art222/regional/`, relativement à ce dossier. Le dossier `references/iterations/` contient les deux versions initiales, conservées comme entrées des corrections.

Ce sont des sources graphiques publiées pour revue. Le raccord aux peintres du moteur, les ancrages, les emprises, l’ouverture des intérieurs et la distribution des images en jeu restent à réaliser. L’état de sauvegarde et les règles du jeu ne sont pas modifiés par cette PR.

## Validation

Les huit sorties ont été revues visuellement et contrôlées comme PNG RGBA avec transparence réelle. Les octets natifs, métadonnées et empreintes sont conservés. Les corrections ont porté sur les proportions de la caserne et de la gare routière.

Le contrôle intégré du dépôt est consigné dans la description de la PR avec son commit exact et son résultat réel. La revue des images ne certifie ni un rendu en jeu ni une identité métrique ou pixel pour pixel 1:1.

## Méthode appliquée

Le chantier suit `docs/GAMEDEV_GUIDANCE.md`, le guide `create-game-assets` et ses références raster, direction artistique et provenance, à la révision amont `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`. La génération et les corrections utilisent ImageGen avec la référence réelle du projet. Les images n’ont pas été recadrées ou retouchées par script.

Pour poursuivre ce lot sans le recommencer, lire `REPRISE.json`, puis `PROVENANCE.json` et `generation-history.json`.
