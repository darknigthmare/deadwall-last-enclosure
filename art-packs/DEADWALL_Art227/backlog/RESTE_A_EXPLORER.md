# État des 62 presets natifs après Art227

Cet état couvre uniquement les presets natifs, pas les 4000 fiches, props, animations, intérieurs ni l’ensemble des anciens packs.

**25 pilotes directs sont couverts par les finales des packs Art222–226, 7 par Art227, 7 relèvent du pack parallèle Art228, 3 du pack compagnon Art229, 20 ont une liaison Codex incohérente.** Aucun de ces comptes ne signifie intégration au moteur.

## Trois pilotes directs du lot compagnon Art229

| Type | Fiche | Emprise native | Niveaux |
|---|---|---|---|
| `clinic` | DW-0123 | 23 × 17 m | [0] |
| `bunker` | DW-0201 | 26 × 21 m | [-1, 0] |
| `fuel` | DW-0247 | 19 × 14 m | [0] |

Les correspondances de ces trois pilotes avec leur fiche sont exactes. La recherche bornée dans `art221-bounded-evidence.json` n’établit aucun doublon Art221 exact; elle ne prouve pas une absence historique exhaustive. Les trois sont préparés séparément dans Art229. Consulter `../../DEADWALL_Art229/REPRISE.json` pour leur état effectif de production et livraison; ce pack ne l’anticipe pas.

## Lot parallèle Art228

`mall`, `grocer`, `market`, `motel`, `firestation`, `dental`, `mine`. Consulter `../../DEADWALL_Art228/REPRISE.json` pour l’état effectif de ces sept images ; ce pack ne l’anticipe pas.

## Liaisons settlement à réconcilier

| Type | ID attribué | Pilote natif | Fiche référencée |
|---|---|---|---|
| `cottageSmall` | DW-0501 | 10 × 10 m, niveaux [0] | DW-0501 — Maison de lotissement — variante 01 |
| `rowhouse` | DW-0502 | 11 × 18 m, niveaux [0, 1] | DW-0502 — Maison mitoyenne — variante 01 |
| `bungalow` | DW-0503 | 20 × 14 m, niveaux [0] | DW-0503 — Villa isolée — variante 01 |
| `familyHouse` | DW-0504 | 22 × 19 m, niveaux [0, 1] | DW-0504 — Ferme familiale — variante 01 |
| `farmhouse` | DW-0505 | 32 × 17 m, niveaux [0, 1] | DW-0505 — Immeuble résidentiel — variante 01 |
| `villa` | DW-0506 | 28 × 23 m, niveaux [0, 1] | DW-0506 — Barre de logements — variante 01 |
| `duplexWide` | DW-0507 | 30 × 19 m, niveaux [0, 1] | DW-0507 — Résidence senior — variante 01 |
| `studioBlock` | DW-0508 | 26 × 22 m, niveaux [0, 1, 2] | DW-0508 — Maison avec sous-sol — variante 01 |
| `longBlock` | DW-0509 | 58 × 25 m, niveaux [0, 1, 2] | DW-0509 — Supérette — variante 01 |
| `residence` | DW-0510 | 46 × 38 m, niveaux [0, 1, 2] | DW-0510 — Centre commercial — variante 01 |
| `cornerShop` | DW-0511 | 12 × 13 m, niveaux [0] | DW-0511 — Supermarché — variante 01 |
| `superstore` | DW-0512 | 64 × 43 m, niveaux [0] | DW-0512 — Magasin de bricolage — variante 01 |
| `cafe` | DW-0513 | 19 × 17 m, niveaux [0] | DW-0513 — Pharmacie — variante 01 |
| `bank` | DW-0514 | 27 × 21 m, niveaux [0, 1] | DW-0514 — Station-service — variante 01 |
| `officeBlock` | DW-0515 | 44 × 32 m, niveaux [0, 1] | DW-0515 — Restaurant routier — variante 01 |
| `medicalCentre` | DW-0516 | 46 × 34 m, niveaux [0] | DW-0516 — Hôtel — variante 01 |
| `smallWorkshop` | DW-0517 | 18 × 15 m, niveaux [0] | DW-0517 — Scierie — variante 01 |
| `logisticsHall` | DW-0518 | 70 × 42 m, niveaux [0] | DW-0518 — Garage automobile — variante 01 |
| `chapel` | DW-0519 | 24 × 33 m, niveaux [0, 1] | DW-0519 — Entrepôt logistique — variante 01 |
| `waterStation` | DW-0520 | 28 × 21 m, niveaux [0] | DW-0520 — Petite usine — variante 01 |

Les vingt divergences sont conservées dans le JSON, avec les emprises et niveaux des fiches. Aucune relation corrigée n’est inventée. La géométrie, les identifiants et les sauvegardes ne sont pas modifiés.

Les versions précédentes de l’inventaire sont conservées sous `selection-stage/`. Les cinq références d’exemple sont copiées sous `inventory-references/`, et les 62 empreintes des fiches sont vérifiées contre leurs révisions source lors de l’assemblage.
