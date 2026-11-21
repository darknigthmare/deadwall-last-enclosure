# DEADWALL — Art233 : Mobilier rural, de soins et de repos

**13 PNG finaux et 4 sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec prompts effectivement envoyés, références, dimensions auteur, historique et empreintes SHA256.

| Identité | Objet | Emprise X × Y (m) | Hauteur auteur (m) |
|---|---|---:|---:|
| `prop:singleBunk:v0` | Couchette individuelle | 2 × 0.75 | 1.7 |
| `prop:feedTrough:v0` | Mangeoire | 2 × 0.5 | 0.65 |
| `prop:waterTrough:v0` | Abreuvoir | 1.2 × 0.5 | 0.6 |
| `prop:fodderRack:v0` | Râtelier à fourrage | 1.6 × 0.6 | 1.3 |
| `prop:milkingUnit:v0` | Poste de traite | 1.1 × 0.8 | 1.6 |
| `prop:milkVat:v0` | Cuve à lait | 1.5 × 1.3 | 1.8 |
| `prop:nestBox:v0` | Pondoir | 1.2 × 0.5 | 0.8 |
| `prop:wineVat:v0` | Cuve vinicole | 1.6 × 1.6 | 2.2 |
| `prop:wineBarrel:v0` | Fût de chai | 0.8 × 0.8 | 0.95 |
| `prop:grapePress:v0` | Pressoir | 1.4 × 1.2 | 1.8 |
| `prop:veterinaryTable:v0` | Table de soins vétérinaires | 1.3 × 0.7 | 0.85 |
| `prop:growingBench:v0` | Table de semis | 1.6 × 0.7 | 0.85 |
| `prop:growingBed:v0` | Bac de culture | 1.8 × 0.7 | 0.65 |

## Sources et périmètre

Les objets existent déjà dans les sources de la révision `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Les nouvelles images sont des propositions dédiées à leur type ; leur rendu procédural actuel reste présent. Des images analogues existent dans les atlas génériques. Ce pack ne transforme pas des plans auteur agricoles ou industriels en installations de campagne et n’affirme pas une absence de toute image analogue.

Les références canoniques utilisent l’entrée publique `drawProp`, qui délègue à `drawPropBase` privé, avec variante 0, `stateAlpha:false` et sans objet `game`. Les surimpressions de service et d’eau restent donc inactives. La géométrie et les cotes sont issues du code inchangé ; ce sont des choix auteur, pas des mesures constructeur. Pour les caravanes, seule l’instance parcelle 1 de V01 est représentée : toit et intérieur fermés, axe long Y, attelage vers −Y. La famille complète possède d’autres longueurs.

## Contrôles et contenu

- `assets/art233/props/` : images finales natives, sans réencodage.
- `references/iterations/` : sorties remplacées, lorsqu’une correction a été nécessaire.
- `references/` : références canoniques, atlas réellement fourni, sources inchangées et index vérifié contre Git.
- `generation-history.json` : chaque prompt réellement envoyé, ses images de référence et la sortie retenue ou remplacée.
- `records/` : préparation et enregistrements originaux, y compris les scripts de rendu.
- `qa/` : revue visuelle liée au SHA256, décodage PNG, chunks, dimensions et mesures alpha.
- `SHA256SUMS.txt` : tous les fichiers du pack, hors manifeste lui-même.

Les PNG possèdent un canal alpha et des marges autour du corps visible. Les pixels d’alpha très faible sont mesurés séparément ; cette vérification n’affirme pas un alpha strictement nul partout autour du sprite. Toutes les métadonnées natives restent conservées par copie exacte des octets.

**Propositions source uniquement.** La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée. Échelle, ancrage, orientation, clipping et apparence en jeu restent à qualifier lors d’une intégration distincte. Aucune source du moteur, identité, sauvegarde, génération, collision, dépendance ou test n’est modifié par ce pack.

## Comparaison visuelle

### Couchette individuelle

`prop:singleBunk:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence singleBunk](references/canonical/singleBunk-v0.png) | ![Couchette individuelle](assets/art233/props/singleBunk_couchette_individuelle.png) |

### Mangeoire

`prop:feedTrough:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence feedTrough](references/canonical/feedTrough-v0.png) | ![Mangeoire](assets/art233/props/feedTrough_mangeoire.png) |

### Abreuvoir

`prop:waterTrough:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence waterTrough](references/canonical/waterTrough-v0.png) | ![Abreuvoir](assets/art233/props/waterTrough_abreuvoir.png) |

### Râtelier à fourrage

`prop:fodderRack:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence fodderRack](references/canonical/fodderRack-v0.png) | ![Râtelier à fourrage](assets/art233/props/fodderRack_ratelier_fourrage.png) |

### Poste de traite

`prop:milkingUnit:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence milkingUnit](references/canonical/milkingUnit-v0.png) | ![Poste de traite](assets/art233/props/milkingUnit_poste_traite.png) |

### Cuve à lait

`prop:milkVat:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence milkVat](references/canonical/milkVat-v0.png) | ![Cuve à lait](assets/art233/props/milkVat_cuve_lait.png) |

### Pondoir

`prop:nestBox:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence nestBox](references/canonical/nestBox-v0.png) | ![Pondoir](assets/art233/props/nestBox_pondoir.png) |

### Cuve vinicole

`prop:wineVat:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence wineVat](references/canonical/wineVat-v0.png) | ![Cuve vinicole](assets/art233/props/wineVat_cuve_vinicole.png) |

### Fût de chai

`prop:wineBarrel:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence wineBarrel](references/canonical/wineBarrel-v0.png) | ![Fût de chai](assets/art233/props/wineBarrel_fut_chai.png) |

### Pressoir

`prop:grapePress:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence grapePress](references/canonical/grapePress-v0.png) | ![Pressoir](assets/art233/props/grapePress_pressoir.png) |

### Table de soins vétérinaires

`prop:veterinaryTable:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence veterinaryTable](references/canonical/veterinaryTable-v0.png) | ![Table de soins vétérinaires](assets/art233/props/veterinaryTable_table_soins_veterinaires.png) |

### Table de semis

`prop:growingBench:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence growingBench](references/canonical/growingBench-v0.png) | ![Table de semis](assets/art233/props/growingBench_table_semis.png) |

### Bac de culture

`prop:growingBed:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence growingBed](references/canonical/growingBed-v0.png) | ![Bac de culture](assets/art233/props/growingBed_bac_culture.png) |
