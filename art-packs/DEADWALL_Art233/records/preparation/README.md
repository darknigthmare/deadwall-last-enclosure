# Art233 — 13 équipements spécialisés, variante 0

Les 13 propositions source sont prêtes : **13 PNG finaux, 4 versions remplacées conservées, 17 sorties natives au total**. Aucun PNG n’a été recadré, redimensionné, recomposé ou retouché après ImageGen. Aucun pack n’a été assemblé dans le dépôt par cette préparation ; aucun code runtime, identifiant DW, save, collision ou transaction n’a été changé.

## Périmètre et identité

Chaque image conserve l’identité `prop:<kind>:v0`. Le catalogue existant est propriétaire des dimensions auteur, `src/campaign-site-art205.js` du rendu `procedural205`. Ces objets disposent déjà d’un rendu procédural ; le manque constaté porte sur un bitmap typé dédié dans les registres vérifiés, et non sur une absence totale de rendu ou d’analogues visuels. Les 69 propositions Art222–232 concernent des extérieurs de bâtiments et ne couvrent pas ces props.

| Kind | Objet | Empreinte auteur X × Y | Hauteur auteur | Itération retenue |
|---|---|---:|---:|---:|
| singleBunk | Couchette individuelle | 2 × 0,75 m | 1,7 m | 2 |
| feedTrough | Mangeoire | 2 × 0,5 m | 0,65 m | 2 |
| waterTrough | Abreuvoir | 1,2 × 0,5 m | 0,6 m | 2 |
| fodderRack | Râtelier à fourrage | 1,6 × 0,6 m | 1,3 m | 2 |
| milkingUnit | Poste de traite | 1,1 × 0,8 m | 1,6 m | 1 |
| milkVat | Cuve à lait | 1,5 × 1,3 m | 1,8 m | 1 |
| nestBox | Pondoir | 1,2 × 0,5 m | 0,8 m | 1 |
| wineVat | Cuve vinicole | 1,6 × 1,6 m | 2,2 m | 1 |
| wineBarrel | Fût de chai | 0,8 × 0,8 m | 0,95 m | 1 |
| grapePress | Pressoir | 1,4 × 1,2 m | 1,8 m | 1 |
| veterinaryTable | Table de soins vétérinaires | 1,3 × 0,7 m | 0,85 m | 1 |
| growingBench | Table de semis | 1,6 × 0,7 m | 0,85 m | 1 |
| growingBed | Bac de culture | 1,8 × 0,7 m | 0,65 m | 1 |

Les dimensions sont des choix `author-design`, pas des mesures constructeur. La couchette garde une seule surface de couchage et son échelle ; la hauteur 1,7 m n’a pas été interprétée comme un second lit. Les équipements agricoles restent des plans auteur : ces images ne prouvent pas que les fermes sont implantées ou productives en campagne. Les contenus fixes illustrés ne créent aucun stock, loot, niveau de service ou ressource.

## Références contrôlées

La base source est `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. `references/source-index.json` relie les 13 copies de sources et les 2 atlas au chemin du dépôt, à cette révision, au blob Git, au SHA-256 et à la taille native. `source-integrity.json` vérifie ces octets et leurs blobs Git.

`prepare-art233.cjs` a rendu une référence PNG transparente par objet via l’export public inchangé `DeadwallCampaignSiteArt205.drawProp`, qui délègue à `drawPropBase`. Paramètres : variante 0, rotation 0, aucun `game`, `stateAlpha:false`, aucune image d’atlas injectée dans ce rendu spécialisé. Le script applique une échelle uniforme en mètres et ne change ni source, ni prop, ni pixels du rendu. `references/canonical-render-records.json` conserve l’appel, les dimensions, l’échelle, les hashes et le hash du script. `root-canonical-replay.json` est le rejeu indépendant effectué par root depuis la base.

Les 13 références ont été inspectées individuellement avant génération. L’atlas intérieur domestique sert de référence de matière pour la couchette ; l’atlas d’atelier sert aux 12 autres. Leur rôle est limité à la palette et à la peinture. L’angle de caméra, la grille et les objets voisins de l’atlas ne sont pas des éléments à copier. `reference-inspections.json` trace ces inspections et les entrées natives utilisées pour les corrections.

## Génération et corrections

Toutes les images ont été produites par l’outil intégré `image_gen.imagegen`, avec `transparent_background:true`, par groupes de deux ou trois appels maximum. `generation-prompts.json` contient les 13 demandes initiales ; `generation-corrections.json` les 4 textes d’édition exacts. Les résultats conservent aussi ces textes verbatim et leurs références effectivement envoyées.

Les corrections ont rétabli les trois barreaux de la couchette, transformé les marques de la mangeoire en paille et résidu granuleux, rendu l’eau de l’abreuvoir avec un reflet naturel tout en retirant un appui central inventé, et remplacé les bandes peintes du râtelier par des brins de fourrage derrière ses six montants. Toutes les sorties initiales restent conservées.

`initial-results.json` contient les 13 premières sorties ; `history-results.json` les 17 sorties natives ; `results.json` les 13 finales. Les chemins `generatedSourcePath` y désignent les PNG natifs à copier sans recompression lors de l’assemblage. `generation-ledger.json` vérifie la correspondance exacte des prompts et des références, avec leur SHA-256. Les 17 sorties ont des hashes distincts.

## Revue et transparence

`review.json` contient une revue visuelle détaillée liée au SHA-256 de chacune des 13 finales. Les orientations, silhouettes et pièces principales sont vérifiées contre la variante 0 ; les ovales des cuves et les formes végétales restent des interprétations artistiques. Une proposition source n’est pas une certification métrique 1:1, ni une validation d’intégration moteur.

Les 17 sorties ont été auditées en lecture seule dans `native-alpha-audit.json`. Toutes les finales sont des PNG RGBA avec alpha minimal nul. Les bords ont un alpha maximal de 0 ou 1 sur 255 ; aucun contour significatif au seuil alpha > 8 n’est coupé. Douze finales ont leurs quatre coins à zéro. Le bac de culture a un coin inférieur gauche à 1, les trois autres à zéro. Les halos de la couchette et du bac sont largement du RGB stocké sous alpha nul ; ils ne justifient pas une retouche arbitraire des PNG.

Les marges visibles sont enregistrées ; la demande de 12 % n’est pas uniformément atteinte, mais les silhouettes restent complètes. Le relevé n’efface pas le bruit alpha très faible et ne modifie aucun pixel.

- 13 PNG finaux : **19 255 858 octets**.
- 17 PNG historiques, finales comprises : **24 595 089 octets**.
- 13 IDs uniques et 13 SHA-256 de finales uniques.
- 17 prompts rapprochés verbatim des registres des demandes.

`verification.json` rassemble les contrôles et les hashes des livrables. La revue indépendante de root est conservée séparément dans `root-independent-visual-review.json` et peut être complétée par root. Les rotations complémentaires, variantes procédurales 1/2, animations, placements, calibrations et branchements runtime restent hors de cette livraison source.
