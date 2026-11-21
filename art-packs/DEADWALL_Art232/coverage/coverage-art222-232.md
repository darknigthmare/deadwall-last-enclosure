# DEADWALL — couverture des sprites source Art222 à Art232

## Résultat vérifié

**69 images finales sélectionnées : les 62 types natifs ont une proposition graphique, auxquels s’ajoutent 7 autres sites ou variantes.**

| Catégorie | Images finales | Statut |
| --- | ---: | --- |
| Pilotes natifs avec correspondance Codex vérifiée | 42 | Packs Art222–229 préservés |
| Types natifs dont la référence Codex reste contradictoire | 20 | Art230–232, identité `native:<type>` |
| Autres sites ou variantes | 7 | Art222 préservé |
| Total | 69 | Empreintes de toutes les images vérifiées |

Les 20 nouvelles images représentent les enveloppes et niveaux des presets natifs. Le numéro DW déclaré est conservé uniquement dans la provenance. Aucune association historique n’est corrigée ou remplacée par ce lot.

## Les 20 nouvelles propositions

| Pack | Type natif | Nom | Emprise native (m) | Niveaux | Référence historique non résolue |
| --- | --- | --- | --- | --- | --- |
| Art230 | `cottageSmall` | Petite maison ouvrière | 10 × 10 | `[0]` | DW-0501 |
| Art230 | `rowhouse` | Maison étroite | 11 × 18 | `[0, 1]` | DW-0502 |
| Art230 | `bungalow` | Pavillon | 20 × 14 | `[0]` | DW-0503 |
| Art230 | `familyHouse` | Maison familiale | 22 × 19 | `[0, 1]` | DW-0504 |
| Art230 | `farmhouse` | Corps de ferme | 32 × 17 | `[0, 1]` | DW-0505 |
| Art230 | `villa` | Grande villa | 28 × 23 | `[0, 1]` | DW-0506 |
| Art230 | `duplexWide` | Maison double | 30 × 19 | `[0, 1]` | DW-0507 |
| Art231 | `studioBlock` | Petit collectif | 26 × 22 | `[0, 1, 2]` | DW-0508 |
| Art231 | `longBlock` | Barre de logements | 58 × 25 | `[0, 1, 2]` | DW-0509 |
| Art231 | `residence` | Grande résidence | 46 × 38 | `[0, 1, 2]` | DW-0510 |
| Art231 | `cornerShop` | Commerce d’angle | 12 × 13 | `[0]` | DW-0511 |
| Art231 | `superstore` | Grande surface | 64 × 43 | `[0]` | DW-0512 |
| Art231 | `cafe` | Café de quartier | 19 × 17 | `[0]` | DW-0513 |
| Art231 | `bank` | Agence bancaire | 27 × 21 | `[0, 1]` | DW-0514 |
| Art232 | `officeBlock` | Immeuble de bureaux | 44 × 32 | `[0, 1]` | DW-0515 |
| Art232 | `medicalCentre` | Maison de santé | 46 × 34 | `[0]` | DW-0516 |
| Art232 | `smallWorkshop` | Atelier artisanal | 18 × 15 | `[0]` | DW-0517 |
| Art232 | `logisticsHall` | Plateforme logistique | 70 × 42 | `[0]` | DW-0518 |
| Art232 | `chapel` | Chapelle et salle commune | 24 × 33 | `[0, 1]` | DW-0519 |
| Art232 | `waterStation` | Station de pompage | 28 × 21 | `[0]` | DW-0520 |

## Limites de livraison

Ces fichiers sont des sources artistiques à calibrer. Ils ne sont pas intégrés au rendu du jeu. Les pixels par mètre, ancres, portes, profondeur, rotations, miroirs G7 et ouverture des intérieurs doivent encore être raccordés et vérifiés dans le moteur.

Les matériaux de façade et détails de toiture sont interprétés. La fidélité métrique ou pixel à pixel n’est pas certifiée. Les programmes génériques hérités (école pour officeBlock, mairie pour bank/chapel, garage pour waterStation) sont déclarés dans les fiches de provenance ; aucun nouveau programme spécialisé n’est livré.

Le bilan ne couvre pas les 4 000 fiches du Codex, tous les objets, les intérieurs ou les animations. L’inventaire exact des neuf images historiques Art221 n’a pas été retrouvé. Le précédent bilan Art229 et les 49 images déjà publiées restent inchangés.

## Références

- [Presets natifs](https://github.com/darknigthmare/deadwall-last-enclosure/blob/f3ba02a5b73a55120c02c21d5703902ea3e901d9/src/settlement-plans.js).
- [Géométrie réellement évaluée](https://github.com/darknigthmare/deadwall-last-enclosure/blob/f3ba02a5b73a55120c02c21d5703902ea3e901d9/src/frontier-geometry.js).
- [Contrat des profils G7](https://github.com/darknigthmare/deadwall-last-enclosure/blob/f3ba02a5b73a55120c02c21d5703902ea3e901d9/docs/codex/SEED_DETAIL_1_57.md).
- [Bilan précédent des 49 sprites](https://github.com/darknigthmare/deadwall-last-enclosure/blob/5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf/art-packs/DEADWALL_Art229/coverage/coverage-art222-229.md).

Le JSON voisin fournit les chemins de dépôt, tailles et SHA-256 des 69 images finales. Les manifestes de chaque pack conservent les prompts exacts et les itérations remplacées.
