# DEADWALL — Art239 : Clôtures, abris et tonneaux — variantes 1 et 2

**6 PNG finaux et 2 sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec les prompts effectivement envoyés, les références exactes, l’historique et les empreintes SHA256.


| Identité de proposition | Sujet | Géométrie déclarée par la source |
|---|---|---|
| `prop:fence:v1` | Clôture à renforts diagonaux en bois — variante 1 | 3 × 0.15 m ; hauteur auteur 1.2 m |
| `prop:fence:v2` | Clôture métallique à croisillons fins — variante 2 | 3 × 0.15 m ; hauteur auteur 1.2 m |
| `prop:garden-shed:v1` | Abri fermé à toiture métallique — variante 1 | 3.4 × 3.3 m ; hauteur auteur 2.4 m |
| `prop:garden-shed:v2` | Abri fermé à plaques de réparation — variante 2 | 3.4 × 3.3 m ; hauteur auteur 2.4 m |
| `prop:rain-barrel:v1` | Tonneau fermé à disque métallique — variante 1 | 0.7 × 0.7 m ; hauteur auteur 1 m |
| `prop:rain-barrel:v2` | Tonneau fermé à traverse diagonale — variante 2 | 0.7 × 0.7 m ; hauteur auteur 1 m |

## Sources et périmètre

Base de publication : `6ebd6707251e675a5b75ded23e91dd28339dfe38` ; arbre Git : `33d089eab2bb23f288e66d57c2794f6a38b3ba84`. Sources du moteur inchangées depuis `12e0aa4aa77b9901bd53eb7a8771382a5f753593`.

Ce lot étend la couverture aux variantes 1 et 2 déjà définies par structural205. Les propositions en variante 0 restent conservées. Les objets ont déjà un rendu visible ; aucune nouvelle famille runtime ni nouvelle fonctionnalité ne sont créées.

Les références utilisent drawProp sur les instances auteur exactes, avec la variante de peintre 1 ou 2 et stateAlpha:false, sans objet game. La variante du plan auteur reste distincte. Les dimensions sont des choix de conception, sans certification métrique ou pixel pour pixel du PNG.

## Contrôles et contenu

- `assets/art239/props/` : images finales natives, sans réencodage.
- `references/iterations/` : sorties remplacées lorsqu’une correction a été nécessaire.
- `references/` : références canoniques, images réellement fournies et sources vérifiées contre Git.
- `generation-history.json` : chaque prompt ayant produit un PNG, ses références exactes et sa sortie retenue ou remplacée.
- `records/` : préparation originale et reçus, notamment le rejeu indépendant des références canoniques.
- `qa/` : revue liée au SHA256, décodage PNG, chunks, dimensions de fichier et mesures alpha.
- `gallery.html` : comparaisons canoniques/finales avec les fichiers natifs liés directement.
- `SHA256SUMS.txt` : tous les fichiers du pack, hors manifeste lui-même.

Les pixels d’alpha très faible sont mesurés séparément. Des marges autour du corps visible n’impliquent pas un alpha strictement nul partout autour du sujet. Les métadonnées natives restent préservées par copie exacte des octets.

**Propositions source uniquement.** La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée. Échelle, ancrage, orientation, clipping et apparence en jeu restent à qualifier lors d’une intégration distincte. L’assembleur ne modifie aucune source du moteur, sauvegarde, identité, collision, dépendance ou test.

## Comparaison visuelle

### Clôture à renforts diagonaux en bois — variante 1

`prop:fence:v1`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence fence](references/canonical/fence_v1.png) | ![Clôture à renforts diagonaux en bois — variante 1](assets/art239/props/fence_cloture_renforts_bois_v1.png) |

### Clôture métallique à croisillons fins — variante 2

`prop:fence:v2`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence fence](references/canonical/fence_v2.png) | ![Clôture métallique à croisillons fins — variante 2](assets/art239/props/fence_cloture_croisillons_metal_v2.png) |

### Abri fermé à toiture métallique — variante 1

`prop:garden-shed:v1`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence garden-shed](references/canonical/garden-shed_v1.png) | ![Abri fermé à toiture métallique — variante 1](assets/art239/props/garden-shed_toiture_metal_v1.png) |

### Abri fermé à plaques de réparation — variante 2

`prop:garden-shed:v2`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence garden-shed](references/canonical/garden-shed_v2.png) | ![Abri fermé à plaques de réparation — variante 2](assets/art239/props/garden-shed_toiture_pieces_v2.png) |

### Tonneau fermé à disque métallique — variante 1

`prop:rain-barrel:v1`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence rain-barrel](references/canonical/rain-barrel_v1.png) | ![Tonneau fermé à disque métallique — variante 1](assets/art239/props/rain-barrel_disque_metal_v1.png) |

### Tonneau fermé à traverse diagonale — variante 2

`prop:rain-barrel:v2`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence rain-barrel](references/canonical/rain-barrel_v2.png) | ![Tonneau fermé à traverse diagonale — variante 2](assets/art239/props/rain-barrel_traverse_diagonale_v2.png) |
