# Suite des extérieurs — inventaire incomplet

Source locale : `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Inventaire limité aux **62 presets natifs**, sans parcourir les 4000 fiches ni tous les accessoires, intérieurs ou anciens lots. Chaque fiche directe a été comparée à son type, son emprise et ses niveaux.

Répartition : **13 pilotes natifs déjà pourvus par les finales Art222–224**, **6 sélectionnés Art225**, **6 réservés Art226**, **17 autres pilotes directs**, **20 dérivés dont la liaison Codex est incohérente**. Les 20 finales Art222–224 comprennent aussi 7 sites/variantes hors de ces 62 presets directs. Aucun de ces comptes ne signifie intégration au moteur.

## 17 pilotes directs restant à traiter

Les correspondances ci-dessous sont exactes dans les fiches de liaison au moteur. L’inventaire complet des neuf sorties Art221 n’a pas été retrouvé; les remarques signalent les thèmes à vérifier, sans déclarer à tort un doublon.

| Type | Fiche | Bâtiment | Emprise native | Niveaux | Toiture générique | Remarque |
|---|---|---|---|---|---|---|
| `house` | DW-0001 | Maison de lotissement | 14 × 12 m | [0] | `cottage` |  |
| `duplex` | DW-0003 | Maison à étage | 16 × 13 m | [0, 1] | `cottage` |  |
| `cabin` | DW-0010 | Chalet forestier | 9 × 8 m | [0] | `cottage` |  |
| `apartments` | DW-0021 | Immeuble de trois étages | 30 × 23 m | [0, 1, 2] | `collective` |  |
| `mall` | DW-0041 | Centre commercial régional | 82 × 56 m | [0, 1] | `retail` |  |
| `grocer` | DW-0061 | Supérette de quartier | 19 × 15 m | [0] | `retail` |  |
| `market` | DW-0062 | Supermarché avec quai | 42 × 30 m | [0] | `retail` |  |
| `hotel` | DW-0101 | Hôtel de centre-ville | 42 × 26 m | [0, 1, 2] | `hotel` |  |
| `clinic` | DW-0123 | Dispensaire rural | 23 × 17 m | [0] | `clinic` | Theme may overlap Art221 remarkable categories; full Art221 filename/ID inventory unavailable. This is not proof that this exact pilot has already been drawn. |
| `bunker` | DW-0201 | Abri communal souterrain | 26 × 21 m | [-1, 0] | `underground` | Theme may overlap Art221 remarkable categories; full Art221 filename/ID inventory unavailable. This is not proof that this exact pilot has already been drawn. |
| `fuel` | DW-0247 | Station-service | 19 × 14 m | [0] | `service` | Theme may overlap Art221 remarkable categories; full Art221 filename/ID inventory unavailable. This is not proof that this exact pilot has already been drawn. |
| `mine` | DW-0401 | Mine à galerie | 32 × 25 m | [-1, 0] | `underground` |  |
| `ruin` | DW-0481 | Maison effondrée visitable | 18 × 14 m | [0] | `ruin` |  |
| `motel` | DW-0498 | Motel gagné par la forêt | 44 × 19 m | [0, 1] | `hotel` |  |
| `firestation` | DW-0181 | Caserne de pompiers | 36 × 28 m | [0, 1] | `service` | Art222 DW-0528 fire station is a different 19×36 m, one-level supplement variant. This direct DW-0181 pilot is 36×28 m and two levels; no automatic reuse as 1:1. |
| `basementHouse` | DW-0004 | Maison sur sous-sol | 18 × 15 m | [-1, 0] | `cottage` |  |
| `dental` | DW-0126 | Cabinet dentaire | 25 × 20 m | [0] | `clinic` | Theme may overlap Art221 remarkable categories; full Art221 filename/ID inventory unavailable. This is not proof that this exact pilot has already been drawn. |

Une suite résidentielle peut s’appuyer sur house, duplex, cabin, apartments, basementHouse, puis ruin ou hôtel. Une suite commerce/hébergement peut regrouper mall, grocer, market, hotel, motel; le sixième doit être choisi après vérification des catégories historiques et du lot résidentiel. La mine doit montrer l’accès et l’enveloppe au sol, pas afficher le sous-sol comme un étage aérien. Ces suggestions ne réservent aucun nouveau sprite.

## Six types réservés Art226

`sawmill` DW-0381, `warehouse` DW-0221, `freight` DW-0289, `centralKitchen` DW-0073, `generatorRoom` DW-0331, `quarry` DW-0403. Les sources et prompts de ce lot sont préparés séparément.

## 20 dérivés : résoudre la liaison avant une promesse de fidélité Codex

`src/settlement-plans.js` crée les identifiants DW-0501 à DW-0520 selon le rang des lignes. Les fiches du supplément ne décrivent pas ces mêmes emprises et désignent souvent une autre fonction. Toutes les vingt dimensions natives diffèrent de celles des fiches référencées.

| Type natif | ID attribué | Emprise / niveaux natifs | Fiche réellement référencée | Emprise / niveaux fiche |
|---|---|---|---|---|
| `cottageSmall` | DW-0501 | 10 × 10 m / [0] | DW-0501 — Maison de lotissement — variante 01 | 10 × 9 m / 2 |
| `rowhouse` | DW-0502 | 11 × 18 m / [0, 1] | DW-0502 — Maison mitoyenne — variante 01 | 21 × 26 m / 1 |
| `bungalow` | DW-0503 | 20 × 14 m / [0] | DW-0503 — Villa isolée — variante 01 | 32 × 43 m / 1 |
| `familyHouse` | DW-0504 | 22 × 19 m / [0, 1] | DW-0504 — Ferme familiale — variante 01 | 43 × 60 m / 1 |
| `farmhouse` | DW-0505 | 32 × 17 m / [0, 1] | DW-0505 — Immeuble résidentiel — variante 01 | 54 × 23 m / 3 |
| `villa` | DW-0506 | 28 × 23 m / [0, 1] | DW-0506 — Barre de logements — variante 01 | 65 × 40 m / 4 |
| `duplexWide` | DW-0507 | 30 × 19 m / [0, 1] | DW-0507 — Résidence senior — variante 01 | 76 × 57 m / 2 |
| `studioBlock` | DW-0508 | 26 × 22 m / [0, 1, 2] | DW-0508 — Maison avec sous-sol — variante 01 | 15 × 20 m / 1 |
| `longBlock` | DW-0509 | 58 × 25 m / [0, 1, 2] | DW-0509 — Supérette — variante 01 | 26 × 37 m / 2 |
| `residence` | DW-0510 | 46 × 38 m / [0, 1, 2] | DW-0510 — Centre commercial — variante 01 | 37 × 54 m / 1 |
| `cornerShop` | DW-0511 | 12 × 13 m / [0] | DW-0511 — Supermarché — variante 01 | 48 × 17 m / 1 |
| `superstore` | DW-0512 | 64 × 43 m / [0] | DW-0512 — Magasin de bricolage — variante 01 | 59 × 34 m / 1 |
| `cafe` | DW-0513 | 19 × 17 m / [0] | DW-0513 — Pharmacie — variante 01 | 70 × 51 m / 2 |
| `bank` | DW-0514 | 27 × 21 m / [0, 1] | DW-0514 — Station-service — variante 01 | 81 × 14 m / 1 |
| `officeBlock` | DW-0515 | 44 × 32 m / [0, 1] | DW-0515 — Restaurant routier — variante 01 | 20 × 31 m / 1 |
| `medicalCentre` | DW-0516 | 46 × 34 m / [0] | DW-0516 — Hôtel — variante 01 | 31 × 48 m / 1 |
| `smallWorkshop` | DW-0517 | 18 × 15 m / [0] | DW-0517 — Scierie — variante 01 | 42 × 11 m / 1 |
| `logisticsHall` | DW-0518 | 70 × 42 m / [0] | DW-0518 — Garage automobile — variante 01 | 53 × 28 m / 1 |
| `chapel` | DW-0519 | 24 × 33 m / [0, 1] | DW-0519 — Entrepôt logistique — variante 01 | 64 × 45 m / 1 |
| `waterStation` | DW-0520 | 28 × 21 m / [0] | DW-0520 — Petite usine — variante 01 | 75 × 62 m / 1 |

Exemples copiés avec la provenance : farmhouse natif32×17m, niveaux[0,1], pointe vers DW-0505 « Immeuble résidentiel »54×23m/3niveaux; logisticsHall70×42m pointe vers DW-0518 « Garage automobile »53×28m. Le JSON garde les chemins, titres, citations et SHA de toutes les fiches.

## Deux demandes plausibles mais non pilotées

DW-0056 « Quincaillerie ancienne » et DW-0066 « Boucherie » portent le statut `conception_non_integree`, sans Plan source natif. Le magasin de bricolage Art225 est DW-0045; ni ce type ni grocer/market ne doivent être renommés pour masquer ce manque.

## Limite graphique

Le rendu actuel conserve les familles de toitures et leurs variantes; ce manque concerne des sprites extérieurs spécialisés de bâtiments entiers. Les emprises en mètres ne certifient pas automatiquement l’échelle des pixels générés. Les futurs sprites nécessiteront encore calibration des ancrages, collisions, rotation et ouvertures avant une intégration. Aucun test du jeu ou statut de CI n’est déclaré ici.
