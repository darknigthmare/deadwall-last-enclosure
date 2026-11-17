# DEADWALL — Art234 : Mobilier et machines industriels

**15 PNG finaux et 0 sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec prompts effectivement envoyés, références, dimensions auteur, historique et empreintes SHA256.

| Identité | Objet | Emprise X × Y (m) | Hauteur auteur (m) |
|---|---|---:|---:|
| `prop:conveyor:v0` | Convoyeur | 3.2 × 1 | 1.1 |
| `prop:dosingUnit:v0` | Poste de dosage | 1.5 × 1.2 | 2.1 |
| `prop:foodMixer:v0` | Mélangeur alimentaire | 1.8 × 1.6 | 2 |
| `prop:heatChamber:v0` | Enceinte thermique | 2.2 × 1.6 | 2.2 |
| `prop:metalSaw:v0` | Scie de débit | 2.2 × 1.2 | 1.6 |
| `prop:lathe:v0` | Tour mécanique | 2.4 × 1.2 | 1.6 |
| `prop:millingMachine:v0` | Fraiseuse | 2.2 × 1.6 | 2.1 |
| `prop:assemblyStation:v0` | Poste assemblage | 2.4 × 1.1 | 1.1 |
| `prop:inspectionBench:v0` | Banc de contrôle | 1.8 × 0.9 | 1.2 |
| `prop:loom:v0` | Métier à tisser | 2.8 × 1.8 | 1.9 |
| `prop:sewingStation:v0` | Poste de confection | 1.4 × 0.7 | 1.2 |
| `prop:cuttingTable:v0` | Table de coupe | 2.4 × 1.4 | 0.9 |
| `prop:materialMixer:v0` | Malaxeur de matériaux | 2.2 × 1.8 | 2.2 |
| `prop:formingPress:v0` | Presse de formage | 2.2 × 1.8 | 2.6 |
| `prop:curingRack:v0` | Rayonnage de maturation | 2.4 × 1.1 | 2.2 |

## Sources et périmètre

Les objets existent déjà dans les sources de la révision `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Les nouvelles images sont des propositions dédiées à leur type ; leur rendu procédural actuel reste présent. Des images analogues existent dans les atlas génériques. Ce pack ne transforme pas des plans auteur agricoles ou industriels en installations de campagne et n’affirme pas une absence de toute image analogue.

Les références canoniques utilisent l’entrée publique `drawProp`, qui délègue à `drawPropBase` privé, avec variante 0, `stateAlpha:false` et sans objet `game`. Les surimpressions de service et d’eau restent donc inactives. La géométrie et les cotes sont issues du code inchangé ; ce sont des choix auteur, pas des mesures constructeur. Pour les caravanes, seule l’instance parcelle 1 de V01 est représentée : toit et intérieur fermés, axe long Y, attelage vers −Y. La famille complète possède d’autres longueurs.

## Contrôles et contenu

- `assets/art234/props/` : images finales natives, sans réencodage.
- `references/iterations/` : sorties remplacées, lorsqu’une correction a été nécessaire.
- `references/` : références canoniques, atlas réellement fourni, sources inchangées et index vérifié contre Git.
- `generation-history.json` : chaque prompt réellement envoyé, ses images de référence et la sortie retenue ou remplacée.
- `records/` : préparation et enregistrements originaux, y compris les scripts de rendu.
- `qa/` : revue visuelle liée au SHA256, décodage PNG, chunks, dimensions et mesures alpha.
- `SHA256SUMS.txt` : tous les fichiers du pack, hors manifeste lui-même.

Les PNG possèdent un canal alpha et des marges autour du corps visible. Les pixels d’alpha très faible sont mesurés séparément ; cette vérification n’affirme pas un alpha strictement nul partout autour du sprite. Toutes les métadonnées natives restent conservées par copie exacte des octets.

**Propositions source uniquement.** La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée. Échelle, ancrage, orientation, clipping et apparence en jeu restent à qualifier lors d’une intégration distincte. Aucune source du moteur, identité, sauvegarde, génération, collision, dépendance ou test n’est modifié par ce pack.

## Comparaison visuelle

### Convoyeur

`prop:conveyor:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence conveyor](references/canonical/conveyor_v0.png) | ![Convoyeur](assets/art234/props/conveyor_convoyeur.png) |

### Poste de dosage

`prop:dosingUnit:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence dosingUnit](references/canonical/dosingUnit_v0.png) | ![Poste de dosage](assets/art234/props/dosingUnit_poste_dosage.png) |

### Mélangeur alimentaire

`prop:foodMixer:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence foodMixer](references/canonical/foodMixer_v0.png) | ![Mélangeur alimentaire](assets/art234/props/foodMixer_melangeur_alimentaire.png) |

### Enceinte thermique

`prop:heatChamber:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence heatChamber](references/canonical/heatChamber_v0.png) | ![Enceinte thermique](assets/art234/props/heatChamber_enceinte_thermique.png) |

### Scie de débit

`prop:metalSaw:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence metalSaw](references/canonical/metalSaw_v0.png) | ![Scie de débit](assets/art234/props/metalSaw_scie_debit.png) |

### Tour mécanique

`prop:lathe:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence lathe](references/canonical/lathe_v0.png) | ![Tour mécanique](assets/art234/props/lathe_tour_mecanique.png) |

### Fraiseuse

`prop:millingMachine:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence millingMachine](references/canonical/millingMachine_v0.png) | ![Fraiseuse](assets/art234/props/millingMachine_fraiseuse.png) |

### Poste assemblage

`prop:assemblyStation:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence assemblyStation](references/canonical/assemblyStation_v0.png) | ![Poste assemblage](assets/art234/props/assemblyStation_poste_assemblage.png) |

### Banc de contrôle

`prop:inspectionBench:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence inspectionBench](references/canonical/inspectionBench_v0.png) | ![Banc de contrôle](assets/art234/props/inspectionBench_banc_controle.png) |

### Métier à tisser

`prop:loom:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence loom](references/canonical/loom_v0.png) | ![Métier à tisser](assets/art234/props/loom_metier_tisser.png) |

### Poste de confection

`prop:sewingStation:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence sewingStation](references/canonical/sewingStation_v0.png) | ![Poste de confection](assets/art234/props/sewingStation_poste_confection.png) |

### Table de coupe

`prop:cuttingTable:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence cuttingTable](references/canonical/cuttingTable_v0.png) | ![Table de coupe](assets/art234/props/cuttingTable_table_coupe.png) |

### Malaxeur de matériaux

`prop:materialMixer:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence materialMixer](references/canonical/materialMixer_v0.png) | ![Malaxeur de matériaux](assets/art234/props/materialMixer_malaxeur_materiaux.png) |

### Presse de formage

`prop:formingPress:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence formingPress](references/canonical/formingPress_v0.png) | ![Presse de formage](assets/art234/props/formingPress_presse_formage.png) |

### Rayonnage de maturation

`prop:curingRack:v0`

| Référence canonique v0 | Proposition source retenue |
|---|---|
| ![Référence curingRack](references/canonical/curingRack_v0.png) | ![Rayonnage de maturation](assets/art234/props/curingRack_rayonnage_maturation.png) |
