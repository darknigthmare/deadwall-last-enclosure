# DEADWALL — Sprites régionaux Art222

Huit nouveaux sprites extérieurs, produits en continuation du travail précédent. Les neuf images déjà signalées dans le lot Art221 n’ont pas été régénérées. Les deux premières versions de la caserne et de la gare routière ont été remplacées après contrôle des proportions ; elles restent dans les références pour documenter les corrections.

## Fichiers à utiliser

Les **huit PNG définitifs de ce lot** sont dans `assets/art222/regional/`. Leurs octets natifs sont conservés : aucun recadrage, redimensionnement, détourage par script ou retouche des pixels n’a été appliqué. Les corrections de proportions ont été réalisées par ImageGen avec les images précédentes et l’atlas d’origine en référence.

| Fiche | Sprite | Dimensions du PNG | Fichier |
| --- | --- | --- | --- |
| DW-0342 | Station de pompage | 1536 × 1024 | `DW-0342_station-pompage.png` |
| DW-0132 | Clinique chirurgicale | 1536 × 1024 | `DW-0132_clinique-chirurgicale.png` |
| DW-0321 | Poste électrique de quartier | 1536 × 1024 | `DW-0321_poste-electrique-quartier.png` |
| DW-0334 | Relais radio rural | 1312 × 1199 | `DW-0334_relais-radio-rural.png` |
| DW-0541 | Bunker de défense civile — variante 01 | 830 × 1895 | `DW-0541_bunker-defense-civile-v01.png` |
| DW-0528 | Caserne de pompiers — variante 01 | 1184 × 1328 | `DW-0528_caserne-pompiers-v01.png` |
| DW-0549 | Gare routière — variante 01 | 1774 × 887 | `DW-0549_gare-routiere-v01.png` |
| DW-0097 | Clinique vétérinaire | 1430 × 1100 | `DW-0097_clinique-veterinaire.png` |

Les dimensions ci-dessus décrivent le canevas en pixels, pas les dimensions du bâtiment dans le monde du jeu. Les fichiers sous `references/iterations/` sont les deux versions initiales, **pas des sprites supplémentaires à intégrer**.

## Références et fidélité

L’atlas réel `assets/buildings-atlas.webp` du dépôt a été fourni à chaque génération comme référence de matériaux, de palette et de caméra. Les fiches du Codex récupérées à la révision `c9e60c28d8a4b831b94f64c64c766eb724a90d25` fixent les fonctions et, lorsqu’elles existent, les dimensions du lieu. Les copies, liens d’origine et empreintes de contrôle sont inclus dans `references/` et son index `sources.json`.

La direction visuelle conservée est celle d’une vue orthographique très haute, avec toiture dominante et façade vers le bas, sans rotation en losange : béton et métal usés, gris, olive, terre et rouille mesurée. Les objets restent isolés sur un canal alpha réel.

La station de pompage montre sa prise d’eau, ses pompes et le local de commande. Le poste électrique réunit enceinte, appareillages sur socles, local et accès. Le relais rural reste une petite installation raccordée, distincte du grand émetteur déjà produit. La clinique vétérinaire comprend un chenil vide et des accès public et de service distincts. La gare routière comporte un quai couvert sur asphalte, sans rails.

Les emprises cibles documentées sont de **18 × 41 m et deux niveaux** pour le bunker, **19 × 36 m et un niveau** pour la caserne, **34 × 15 m et un niveau** pour la gare routière, et **26 × 20 m au rez-de-chaussée** pour le pilote vétérinaire. Elles sont consignées comme contraintes du projet, et non comme mesures certifiées du rendu. La variante de caserne DW-0528 ne doit pas être confondue avec l’ancien pilote DW-0181 de 36 × 28 m.

**Limite de l’objectif 1:1 :** le style et les fonctions extérieures ont été confrontés aux références disponibles. Les fiches ne fournissent pas toutes une vue canonique complète ni un plan de toiture. Une identité pixel pour pixel et une échelle métrique exacte ne sont donc pas certifiées par ces images. Les proportions de la caserne et de la gare ont fait l’objet d’une correction ciblée ; leur placement métrique reste à vérifier dans le moteur. Les pièces et circuits intérieurs ne sont pas validables depuis ces vues extérieures.

## Contrôles réalisés

Les huit fichiers sont des PNG RGBA avec des pixels entièrement transparents. L’audit contient leurs dimensions, empreintes SHA-256, plages alpha et limites visibles. Des couleurs peuvent subsister dans le RGB de pixels transparents ou presque transparents ; le noir ou le halo d’un aperçu qui ignore l’alpha ne constitue pas un fond opaque. Le PNG d’origine est conservé sans transformation du canal alpha.

La revue visuelle vérifie les silhouettes complètes, les accès visibles, les fonctions extérieures et la cohérence de la famille graphique. Elle figure dans `qa/visual-review.md`. `SHA256SUMS.txt` permet de contrôler les fichiers du pack.

## Reprendre sans recommencer

Commencer par `REPRISE.json`, puis `PROVENANCE.json`. Les prompts exacts, les références de chaque étape et les sorties retenues sont dans `generation-prompts.json` et `generation-history.json`. Les deux corrections ont déjà été effectuées : ne pas relancer ces générations par défaut.

Le candidat « gendarmerie » reste en attente d’une fiche dédiée vérifiable. Le lot n’est pas un inventaire exhaustif de tout ce qui manque encore au jeu.

Ces fichiers constituent un livrable graphique. L’enregistrement dans le sélecteur du jeu, l’ancrage, les collisions, les animations, les échelles et les tests en jeu n’ont pas été réalisés dans cette reprise. Aucune écriture GitHub n’a été effectuée.
