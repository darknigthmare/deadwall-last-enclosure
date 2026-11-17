# DEADWALL — Revue visuelle du lot art222

Date de revue : 17 novembre 2026.

## Verdict

Les huit images retenues présentent une cohérence graphique avec l’atlas de référence : matériaux usés, palette acier/olive/terre, silhouettes lisibles et vue haute avec façade principale vers le bas de l’image. Aucun bâtiment, mât ou équipement majeur n’est coupé par le cadre. Les huit images peuvent être conservées à l’issue de cette revue, avec les versions corrigées de la caserne et de la gare routière identifiées plus bas.

Les premières versions de la caserne et de la gare routière étaient trop étirées. Les corrections ciblées ont amélioré leurs proportions tout en conservant les accès et les fonctions extérieures. Les premières versions restent documentées dans l’historique et ne sont pas les fichiers retenus. Aucun défaut majeur de dessin ou de cadrage n’a été relevé sur les deux corrections.

Cette conclusion porte sur l’apparence et sur les fonctions extérieures visibles. Elle ne certifie pas une fidélité métrique ou pixel 1:1. Les proportions doivent être rapprochées d’un plan ou d’une projection calibrée avant tout usage revendiquant une emprise exacte.

## Références et méthode

- Référence de style : `references/buildings-atlas.webp`, atlas de 16 bâtiments.
- Fiches lues : `DW-0342.md`, `DW-0132.md`, `DW-0321.md`, `DW-0334.md`, `DW-0541.md`, `DW-0528.md`, `DW-0549.md` et `DW-0097.md`, dans `references/`.
- Inspection visuelle des huit PNG retenus et comparaison des deux corrections avec leurs versions initiales ; lecture de leurs dimensions, mode et canal alpha.
- Aucune transformation de pixel, aucun recadrage, aucune régénération effectués par le réviseur.
- Aucun test du jeu, de navigation, de collision, de ressources ou d’intégration effectué.

## Résultat par sprite

| Dossier | Constats vérifiés sur l’image | Limites ou réserve |
|---|---|---|
| **DW-0342 — Station de pompage** | Bassin/prise d’eau et conduite reliés ; deux pompes sur supports ; local technique et passage de maintenance visibles. Fonction reconnaissable et silhouette complète. | La continuité du réseau hors image et la circulation intérieure ne sont pas démontrées. La fiche ne définit pas une géométrie extérieure unique. |
| **DW-0132 — Clinique chirurgicale** | Croix médicale sur toiture, volumes bas, entrée publique centrale sous auvent, accès de service distinct en retrait et équipements techniques. Bonne continuité avec le bâtiment médical de l’atlas. | L’image extérieure ne permet pas de vérifier les espaces de préparation, bloc, repos et stérilisation, ni la séparation propre/sale/public. |
| **DW-0321 — Poste électrique de quartier** | Enceinte grillagée, portail, transformateurs/appareillage sur socles et local opérateur en fond. Fonction de poste électrique identifiable, sans effet d’arc ni installation de centrale. | La disponibilité des circulations et les dimensions des équipements restent hors du périmètre de cette revue. |
| **DW-0334 — Relais radio rural** | Bâtiment bas, atelier, armoire technique et mât réunis en une installation cohérente ; conduites de liaison visibles. Antenne complète et fonction reconnaissable. | La desserte rurale hors image et le programme intérieur ne sont pas vérifiables. |
| **DW-0541 — Bunker de défense civile, variante 01** | Forme longue et étroite, entrée protégée, façade lisible à deux niveaux, ventilation/générateur et radio visibles. Aucun équipement coupé. | L’emprise source est **18 × 41 m**, avec **2 niveaux**. Le rendu rend ces intentions lisibles mais ne mesure pas l’emprise ni les espaces intérieurs. La rotation de placement ne fixe pas la caméra du sprite. |
| **DW-0528 — Caserne de pompiers, variante 01 — version corrigée retenue** | Silhouette moins étroite que la première version, deux grandes portes de remise rouges, porte piétonne distincte, aire dure devant les remises, volume d’un seul niveau et liserés d’herbe. Cadrage complet ; équipements de toiture préservés. | La fiche impose **19 × 36 m**, **1 niveau**. Les proportions ont été améliorées, sans certification de l’emprise métrique. Le parking latéral et sa bretelle ne sont pas établis par cette image isolée. |
| **DW-0549 — Gare routière, variante 01 — version corrigée retenue** | Profondeur de toiture accrue par rapport à la première version ; façade basse, entrée de hall, auvent continu, bancs, bordure de quai et marquages routiers sur goudron. **Aucun rail**. Ensemble complet. | La fiche impose **34 × 15 m**, **1 niveau**. Les proportions ont été améliorées, sans certification de l’emprise métrique. Les positions et dégagements de bus demandent une intégration séparée. |
| **DW-0097 — Clinique vétérinaire** | Bâtiment de plain-pied, entrée publique en façade, chenil arrière couvert et **vide**, compartiments grillagés et portail de service distinct. Fonction extérieure identifiable. | La fiche décrit un pilote **26 × 20 m**, niveau **0**. L’image ne démontre pas sa correspondance aux pièces du moteur ni la séparation du stockage médical. La génération de ce PNG ne prouve pas son intégration au pilote existant. |

## Transparence et cadrage

Les huit fichiers ont un canal alpha réel. Le noir, le brun et certaines couleurs rouges/jaunes visibles dans les aperçus bruts ne doivent pas être interprétés comme des fonds opaques : une partie de ces couleurs RGB est conservée dans des pixels transparents ou presque transparents.

Les rectangles ci-dessous encadrent les pixels dont l’alpha est supérieur à 32/255. Ce seuil sert uniquement à vérifier que la silhouette significative conserve une marge ; il ne remplace pas le canal alpha et n’a été appliqué à aucun fichier.

| Sprite | Dimensions PNG | Mode | Alpha min–max | Pixels alpha 0 | Rectangle alpha > 32 : gauche, haut, droite, bas |
|---|---:|---|---:|---:|---|
| Station de pompage | 1536 × 1024 | RGBA | 0–254 | 52,30 % | 172, 132, 1344, 906 |
| Clinique chirurgicale | 1536 × 1024 | RGBA | 0–254 | 55,06 % | 179, 158, 1358, 889 |
| Poste électrique | 1536 × 1024 | RGBA | 0–254 | 35,54 % | 128, 74, 1406, 951 |
| Relais radio | 1312 × 1199 | RGBA | 0–255 | 70,47 % | 201, 167, 1118, 994 |
| Bunker | 830 × 1895 | RGBA | 0–255 | 30,35 % | 87, 11, 749, 1878 |
| Caserne de pompiers corrigée | 1184 × 1328 | RGBA | 0–254 | 47,73 % | 218, 92, 967, 1242 |
| Gare routière corrigée | 1774 × 887 | RGBA | 0–255 | 19,78 % | 68, 63, 1710, 854 |
| Clinique vétérinaire | 1430 × 1100 | RGBA | 0–255 | 46,61 % | 148, 158, 1277, 972 |

Le bunker possède le cadrage le plus serré : environ 11 px de marge supérieure et 17 px de marge inférieure autour de cette silhouette significative. La cheminée, l’antenne et l’entrée restent complètes.

Les franges très saturées du relais, du bunker, de la première caserne et du vétérinaire correspondent principalement à des alpha de 1 à 5/255. Les quelques pixels rouge/jaune à alpha élevé sont compatibles avec les marquages et lampes du sujet. Le halo brun visible dans l’aperçu brut de la caserne corrigée relève également des couleurs RGB de la transparence. Aucun fond opaque ni liseré opaque majeur n’a été identifié. Quelques pixels d’alpha 1 dans des coins ne justifient pas une nouvelle génération.

## Fichiers inspectés

Les noms ci-dessous désignent les sorties natives de génération. Dans ce pack, leurs copies binaires sont sous `assets/art222/regional/` ; `generation-prompts.json` fournit la correspondance exacte. Les deux premières versions sont sous `references/iterations/`.

| Dossier | PNG original |
|---|---|
| DW-0342 | `exec-f2d47d48-42f2-4980-84a4-5533dd1e6d80.png` |
| DW-0132 | `exec-d128a877-57ac-4fbc-b667-160644b2871c.png` |
| DW-0321 | `exec-74d29a26-16da-4dc6-b331-048125690149.png` |
| DW-0334 | `exec-557157e9-0c4c-4acd-ba92-f182a4d345f6.png` |
| DW-0541 | `exec-f5148f84-76a9-4f23-bbfc-3a1518cc1b8c.png` |
| DW-0528 — corrigée retenue | `exec-ede8045f-71db-434f-a747-eea906cebdda.png` |
| DW-0549 — corrigée retenue | `exec-07c45838-2370-4163-89b6-bf2cc5d01cd2.png` |
| DW-0097 | `exec-455808e7-0a4d-4688-b262-2bb752c43e16.png` |

## Historique des deux corrections

| Dossier | Première version non retenue | Changement constaté dans la version corrigée |
|---|---|---|
| DW-0528 | `exec-b56adefe-7525-45b0-ad8f-edcb851ebdf4.png`, 914 × 1721 px | Bâtiment visuellement plus compact et plus large par rapport à sa longueur ; les deux remises, la porte piétonne, les fenêtres latérales et la toiture technique restent lisibles. Aucune coupe ajoutée. |
| DW-0549 | `exec-936d38fa-ba4f-4292-9097-664a65ca0366.png`, 1866 × 843 px | Toiture nettement plus profonde, bâtiment moins réduit à une façade très étirée ; hall, quai, auvent, bancs et marquages bus préservés. Aucun rail et aucune coupe ajoutés. |

Ces corrections traitent la disproportion visuelle relevée lors de la première passe. Elles ne constituent toujours pas une preuve de conformité métrique 1:1 : l’image n’offre ni projection calibrée ni échelle de référence vérifiable.

## Limite du terme « fidélité 1:1 »

Les quatre premiers dossiers sont des programmes génériques sans plan extérieur unique ni image canonique. Une identité géométrique ou pixel 1:1 ne peut donc pas être certifiée à partir de ces sources. Les variantes à emprise définie et le pilote vétérinaire apportent des contraintes métriques, mais un rendu raster isolé ne démontre pas leur respect : caméra, hauteurs visibles, annexes et empreinte au sol doivent être alignées avec une projection ou avec les données de placement du moteur.

La présente revue valide la cohérence artistique, les fonctions extérieures lisibles et l’absence de coupe majeure. Elle ne valide ni le plan intérieur, ni l’accessibilité, ni les collisions, ni les stocks finis, ni la mise en jeu des nouveaux sprites.
