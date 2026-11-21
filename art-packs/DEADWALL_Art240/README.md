# DEADWALL — Art240 : Composteurs et bassins — variantes 1 et 2

**4 PNG finaux et 0 sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec les prompts effectivement envoyés, les références exactes, l’historique et les empreintes SHA256.


| Identité de proposition | Sujet | Géométrie déclarée par la source |
|---|---|---|
| `prop:compost-bin:v1` | Composteur de jardin — variante 1 | 1 × 1 m ; hauteur auteur 1 m |
| `prop:compost-bin:v2` | Composteur de jardin — variante 2 | 1 × 1 m ; hauteur auteur 1 m |
| `prop:closed-pool:v1` | Bassin fermé — variante 1 | 8 × 12 m ; hauteur auteur 0.4 m ; profondeur auteur 1.4 m |
| `prop:closed-pool:v2` | Bassin fermé — variante 2 | 8 × 12 m ; hauteur auteur 0.4 m ; profondeur auteur 1.4 m |

## Sources et périmètre

Base de publication : `6ebd6707251e675a5b75ded23e91dd28339dfe38` ; arbre Git : `33d089eab2bb23f288e66d57c2794f6a38b3ba84`. Sources du moteur inchangées depuis `12e0aa4aa77b9901bd53eb7a8771382a5f753593`.

Ce lot étend la couverture aux variantes 1 et 2 déjà définies par structural205. Les propositions en variante 0 restent conservées. Les objets ont déjà un rendu visible ; aucune nouvelle famille runtime ni nouvelle fonctionnalité ne sont créées.

Les références utilisent drawProp sur les instances auteur exactes, avec la variante de peintre 1 ou 2 et stateAlpha:false, sans objet game. La variante du plan auteur reste distincte. Les dimensions sont des choix de conception, sans certification métrique ou pixel pour pixel du PNG.

## Contrôles et contenu

- `assets/art240/props/` : images finales natives, sans réencodage.
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

### Composteur de jardin — variante 1

`prop:compost-bin:v1`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence compost-bin](references/canonical/compost-bin_v1.png) | ![Composteur de jardin — variante 1](assets/art240/props/compost-bin_composteur_jardin_v1.png) |

### Composteur de jardin — variante 2

`prop:compost-bin:v2`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence compost-bin](references/canonical/compost-bin_v2.png) | ![Composteur de jardin — variante 2](assets/art240/props/compost-bin_composteur_jardin_v2.png) |

### Bassin fermé — variante 1

`prop:closed-pool:v1`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence closed-pool](references/canonical/closed-pool_v1.png) | ![Bassin fermé — variante 1](assets/art240/props/closed-pool_bassin_ferme_v1.png) |

### Bassin fermé — variante 2

`prop:closed-pool:v2`

| Référence canonique existante | Proposition source retenue |
|---|---|
| ![Référence closed-pool](references/canonical/closed-pool_v2.png) | ![Bassin fermé — variante 2](assets/art240/props/closed-pool_bassin_ferme_v2.png) |
