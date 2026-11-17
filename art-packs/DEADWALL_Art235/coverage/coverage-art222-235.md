# DEADWALL — inventaire des propositions source Art222 à Art235

**99 images finales distinctes : 69 extérieurs déjà publiés et 30 nouveaux objets dédiés.**

| Ensemble | Nombre | Portée |
|---|---:|---|
| Art222–232 | 69 | 62 types natifs de bâtiments et 7 autres sites/variantes |
| Art233 | 13 | Mobilier rural, de soins et de repos, variante 0 |
| Art234 | 15 | Machines et mobilier industriels, variante 0 |
| Art235 | 2 | Caravanes fermées des instances parcelle 1 de V01, variante 0 |

Les 69 fichiers précédents ont été relus et comparés à leurs empreintes, sans modification. Leur [inventaire publié](https://github.com/darknigthmare/deadwall-last-enclosure/blob/5b2ce44c6904498b3d5572e8b1acfb84a0106b02/art-packs/DEADWALL_Art232/coverage/coverage-art222-232.json) est conservé à l’identique dans `prior-coverage-art222-232.json`.

Les 28 familles spécialisées possèdent déjà un rendu procedural205. Les deux caravanes possèdent un rendu structural205. Des silhouettes analogues se trouvent dans des atlas génériques : le manque traité ici est celui de bitmaps dédiés à ces types, et non une absence de tout rendu. Les cotes sont celles du code auteur. Les 30 références canoniques ont été rejouées indépendamment et comparées octet par octet.

Les nouvelles générations conservent 35 sorties natives, dont 5 remplacées après revue. Le cumul archivé atteint 153 sorties, dont 54 remplacées. Les PNG finaux représentent 180,461,540 octets, dont 47,430,687 pour ce lot.

**Aucune intégration moteur ni certification métrique ou pixel pour pixel 1:1.** Le périmètre ne couvre pas toutes les rotations, animations, pièces intérieures ou 4 000 fiches auteur. Les 20 associations Codex contradictoires des extérieurs natifs restent documentées et non réaffectées. Les plans agricoles et industriels ne sont pas présentés comme des sites de campagne nouvellement implantés.

## Nouveaux objets

| Pack | Identité | Objet | Dimensions auteur X × Y × H (m) |
|---|---|---|---:|
| Art233 | `prop:singleBunk:v0` | Couchette individuelle | 2 × 0.75 × 1.7 |
| Art233 | `prop:feedTrough:v0` | Mangeoire | 2 × 0.5 × 0.65 |
| Art233 | `prop:waterTrough:v0` | Abreuvoir | 1.2 × 0.5 × 0.6 |
| Art233 | `prop:fodderRack:v0` | Râtelier à fourrage | 1.6 × 0.6 × 1.3 |
| Art233 | `prop:milkingUnit:v0` | Poste de traite | 1.1 × 0.8 × 1.6 |
| Art233 | `prop:milkVat:v0` | Cuve à lait | 1.5 × 1.3 × 1.8 |
| Art233 | `prop:nestBox:v0` | Pondoir | 1.2 × 0.5 × 0.8 |
| Art233 | `prop:wineVat:v0` | Cuve vinicole | 1.6 × 1.6 × 2.2 |
| Art233 | `prop:wineBarrel:v0` | Fût de chai | 0.8 × 0.8 × 0.95 |
| Art233 | `prop:grapePress:v0` | Pressoir | 1.4 × 1.2 × 1.8 |
| Art233 | `prop:veterinaryTable:v0` | Table de soins vétérinaires | 1.3 × 0.7 × 0.85 |
| Art233 | `prop:growingBench:v0` | Table de semis | 1.6 × 0.7 × 0.85 |
| Art233 | `prop:growingBed:v0` | Bac de culture | 1.8 × 0.7 × 0.65 |
| Art234 | `prop:conveyor:v0` | Convoyeur | 3.2 × 1 × 1.1 |
| Art234 | `prop:dosingUnit:v0` | Poste de dosage | 1.5 × 1.2 × 2.1 |
| Art234 | `prop:foodMixer:v0` | Mélangeur alimentaire | 1.8 × 1.6 × 2 |
| Art234 | `prop:heatChamber:v0` | Enceinte thermique | 2.2 × 1.6 × 2.2 |
| Art234 | `prop:metalSaw:v0` | Scie de débit | 2.2 × 1.2 × 1.6 |
| Art234 | `prop:lathe:v0` | Tour mécanique | 2.4 × 1.2 × 1.6 |
| Art234 | `prop:millingMachine:v0` | Fraiseuse | 2.2 × 1.6 × 2.1 |
| Art234 | `prop:assemblyStation:v0` | Poste assemblage | 2.4 × 1.1 × 1.1 |
| Art234 | `prop:inspectionBench:v0` | Banc de contrôle | 1.8 × 0.9 × 1.2 |
| Art234 | `prop:loom:v0` | Métier à tisser | 2.8 × 1.8 × 1.9 |
| Art234 | `prop:sewingStation:v0` | Poste de confection | 1.4 × 0.7 × 1.2 |
| Art234 | `prop:cuttingTable:v0` | Table de coupe | 2.4 × 1.4 × 0.9 |
| Art234 | `prop:materialMixer:v0` | Malaxeur de matériaux | 2.2 × 1.8 × 2.2 |
| Art234 | `prop:formingPress:v0` | Presse de formage | 2.2 × 1.8 × 2.6 |
| Art234 | `prop:curingRack:v0` | Rayonnage de maturation | 2.4 × 1.1 × 2.2 |
| Art235 | `prop:touring-caravan:v0` | Caravane tractable fermée | 2.4 × 6.2 × 2.8 |
| Art235 | `prop:abandoned-caravan:v0` | Caravane abandonnée fermée | 2.4 × 6.2 × 2.8 |

## Suite identifiée

La dépouille persistante du survivant reste une cible distincte à préparer depuis son rig et ses actions. Les six mécanismes D17 disposent déjà d’un dessin composite ; de nouveaux sprites complets relèveraient d’un enrichissement. Le raccord au moteur exige encore le contrôle de l’échelle, de l’ancrage, des accès, des collisions et des états de service.
