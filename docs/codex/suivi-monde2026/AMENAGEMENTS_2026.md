# Aménagement des 1 000 avant-projets — 22 octobre 2026

## Résultat et portée

Les 1 000 plans auteur produits disposent maintenant d'une composition de mobilier métrique et d'un contrôle physique des accès. Ils comprennent **30 990 pièces hors circulation**, dont **30 960 reçoivent au moins un objet**, pour **103 450 objets placés**. Les **7 933 prescriptions non placées** restent visibles dans les données : le gabarit du mobilier et les dégagements priment sur le remplissage. Trente pièces de petits volumes restent entièrement vides. Aucun usage de pièce des sources actuelles n'est laissé sans classification.

Cette étape prépare et permet l'inspection de ces plans. Elle ne les ajoute pas à la campagne, ne relie aucun embarquement au monde et ne valide pas leur architecture, leurs réseaux, leurs graphismes ou leur gameplay complet. Les réservations de terrains, gradins, réservoirs, cales et ponts de travail gardent le statut défini par les plans auteur. Les vingt typologies disposent de plans explicites ; les soixante autres cibles restent à concevoir.

| Famille | Plans | Pièces | Pièces meublées | Objets placés | Demandes refusées |
| --- | ---: | ---: | ---: | ---: | ---: |
| T005 — Cargo polyvalent | 50 | 1 680 | 1 652 | 4 141 | 1 817 |
| T006 — Pétrolier océanique | 50 | 2 800 | 2 800 | 10 015 | 0 |
| T007 — Croiseur militaire abandonné | 50 | 1 600 | 1 600 | 5 815 | 0 |
| T008 — Sous-marin en surface | 50 | 600 | 600 | 848 | 1 255 |
| T011 — Navire de soutien offshore | 50 | 1 600 | 1 598 | 4 424 | 1 178 |
| T021 — Ferme laitière | 50 | 1 400 | 1 400 | 4 950 | 0 |
| T022 — Élevage ovin | 50 | 1 400 | 1 400 | 5 100 | 0 |
| T023 — Ferme avicole | 50 | 1 400 | 1 400 | 5 050 | 0 |
| T024 — Centre équestre rural | 50 | 1 400 | 1 400 | 5 100 | 0 |
| T025 — Exploitation céréalière | 50 | 1 300 | 1 300 | 4 850 | 0 |
| T026 — Domaine viticole | 50 | 1 300 | 1 300 | 4 700 | 0 |
| T027 — Ferme maraîchère | 50 | 1 400 | 1 400 | 5 200 | 0 |
| T028 — Verger avec conditionnement | 50 | 1 300 | 1 300 | 4 800 | 0 |
| T045 — Parc résidentiel de mobil-homes | 50 | 2 460 | 2 460 | 7 004 | 1 966 |
| T046 — Camping caravanes | 50 | 900 | 900 | 2 880 | 420 |
| T047 — Camp de travailleurs | 50 | 2 560 | 2 560 | 8 168 | 272 |
| T048 — Parc de caravanes abandonné | 50 | 1 290 | 1 290 | 3 925 | 805 |
| T060 — Champ d’éoliennes | 50 | 600 | 600 | 2 200 | 0 |
| T065 — Stade municipal | 50 | 2 000 | 2 000 | 7 140 | 110 |
| T066 — Grand stade couvert | 50 | 2 000 | 2 000 | 7 140 | 110 |
| **Total** | **1 000** | **30 990** | **30 960** | **103 450** | **7 933** |

Les 111 383 prescriptions sont entièrement comptabilisées : chaque identifiant correspond soit à un objet présent, soit à un refus documenté. Un refus n'est pas une autorisation de réduire un meuble ni de déplacer une cloison. Il indique où reprendre ultérieurement le programme ou le plan. La disposition reste une première composition fonctionnelle ; une pièce meublée ne signifie pas que son équipement complet ou sa mise en scène artistique est terminé.

## Programme et dimensions

Le module [codex-furnishings2026.js](../../../src/codex-furnishings2026.js) exploite les noms et fonctions déjà présents dans les [fondations métriques](../../../scripts/codex-world-foundations2026.cjs) , les [plans maritimes](../../../scripts/codex-maritime2026.cjs), [agricoles](AGRICULTURE_2026.md) et [résidentiels](RESIDENTIEL_2026.md). Les programmes distinguent notamment couchage, salon, réfectoire, cuisine, réserves, sanitaires, douches, vestiaires, soins, buanderie, atelier, bureaux, accueil, archives, contrôle, électricité et machines. Une cuisine reçoit des équipements de cuisine ; les douches des cabines ; les ateliers des établis et du rangement. Les couloirs et coursives restent libres de mobilier. Les activités agricoles reçoivent leurs équipements dédiés : mangeoires, abreuvoirs, râteliers, traite, laiterie, pondoirs, chai, cuverie, pressoir, soins vétérinaires et semis. Les « boxes de repos » sont des locaux d’élevage ; ils ne reçoivent plus de couchage humain. Les chambres parentales utilisent le lit double du catalogue.

Les emprises existantes sont lues dans [frontier-geometry.js](../../../src/frontier-geometry.js), [seed-detail157.js](../../../src/seed-detail157.js) et le catalogue `CodexFixtures164Rules` de [core.js](../../../src/core.js). Par exemple, l'établi conserve 2 × 0,85 m, la machine 2,6 × 1,6 m, le bureau 1,4 × 0,7 m et la baie électrique 1,5 × 0,6 m. Il s'agit des dimensions du catalogue du jeu, pas de nouvelles mesures de fabricants. La couchette de 2 × 0,75 m et la cabine de douche de 0,9 × 0,9 m restent des formes de composition déclarées. Douze nouvelles formes agricoles portent la même provenance auteur explicite ; aucune mesure de fabricant ni conformité réelle n’est revendiquée. La forme est placée à sa dimension déclarée ou refusée.

Chaque objet porte sa provenance `sourceDimensions`, son emprise d'origine `footprintM`, sa rotation et sa hauteur `heightM`. Les hauteurs ajoutées sont toutes des choix de composition, marqués `author-design-not-manufacturer-dimension`. Elles sont comparées à la hauteur libre de la pièce. Une rotation échange largeur et profondeur ; aucun facteur de réduction n'est utilisé. Les compartiments étroits du sous-marin refusent ainsi les machines de 2,6 × 1,6 m.

Les coordonnées sont locales au site et exprimées en mètres. Pour les navires, `level` est l'indice entier du pont, `sourceLevel` conserve son identifiant auteur et `elevationM` sa cote verticale, éventuellement négative ou fractionnaire. Ni une cote de pont, ni un tirant d'eau, ni une hauteur de meuble ne sert d'indice de niveau. Les coordonnées des annexes terrestres sont converties depuis leur repère de bâtiment sans modifier les plans sources.

## Dégagements contrôlés

Le placement réserve un chemin de 0,8 m de largeur entre chaque porte et le centre de sa pièce. Le joueur utilise un rayon de 0,32 m. Les objets gardent une marge aux murs et aux autres meubles ; leur face de service possède un dégagement de 0,8 m. Un meuble ne recouvre ni un autre objet, ni la face de service d'un autre, ni le trajet protégé de la porte. Tous les essais sont bornés et déterministes, sans appel au hasard de simulation.

La vérification locale agrandit les obstacles du rayon du joueur et recherche les chemins sur une grille de coordonnées issue de leurs arêtes. Chaque segment est vérifié de façon continue : une barrière fine ne disparaît pas entre deux cellules. Elle relie le centre, toutes les entrées et les centres des faces de service. Le contrôle supplémentaire de [codex-physical2026.js](../../../src/codex-physical2026.js) compose les meubles avec les murs, portes, escaliers et échelles de la scène, puis vérifie les parcours depuis l'entrée. Les limites des réservations dangereuses restent fermées.

`lootEligible` décrit seulement la fonction possible d'un conteneur. Tous les objets portent `lootAssigned:false` et `utilityConnected:false`. Aucun champ de quantité ni de ressource n'est généré. Les totaux restent à zéro conteneur de campagne créé et zéro service raccordé. La création d'une session d'inspection ne modifie pas les sauvegardes ou inventaires de campagne.

## Preuve et reproduction

Le script [audit-codex-inspection2026.cjs](../../../scripts/audit-codex-inspection2026.cjs) appelle la véritable API `CodexInspection2026.create` pour chacune des 1 000 variantes. Il compare chaque plan compilé à son générateur auteur, contrôle les deux audits, les faces accessibles, l'immutabilité et les compteurs de ressources. Son rapport [inspection-20261021.json](inspection-20261021.json) contient un enregistrement par variante, les agrégats par famille, les niveaux, murs et transitions réellement construits, les éventuels échecs et les SHA256 des sources et modules utilisés. Il refuse un compilé périmé et signale toute modification des sources pendant l'audit.

```sh
npm run codex:inspection
node --test tests/codex-furnishings2026.test.cjs
```

Le premier test de la suite réutilise `auditAll` : il ne maintient pas un second algorithme de validation des 1 000 plans. Pour écrire la preuve pendant cette même passe, lancer :

```sh
DEADWALL_WRITE_INSPECTION_AUDIT=1 node --test tests/codex-furnishings2026.test.cjs
```

Les cas complémentaires vérifient la stabilité des résultats, l'absence de hasard, la provenance des dimensions, les niveaux maritimes et l'export navigateur. Les cas négatifs altèrent notamment une emprise, une face de service, un niveau, une porte, une quantité de stock, une connexion, un identifiant, un refus ou les métadonnées d'une pièce : l'audit doit les rejeter. Les contrôles physiques, de sauvegarde d'inspection et de navigateur sont suivis séparément ; aucune qualification globale de la campagne n'est déduite de ce rapport.

La passe mobilier et intégration a exécuté **26 tests, tous réussis**, dont les 1 000 créations de session. Le rapport comptabilise **1 900 niveaux**, **224 885 segments de mur** et **900 transitions verticales** à travers les 1 000 variantes ; ces nombres additionnent des variantes distinctes, pas un seul monde. Aucun échec, test ignoré, annulation ou TODO n'a été signalé. Pour cette exécution, le lanceur explicite `DEADWALL_WRITE_INSPECTION_AUDIT=1 node -e "require('./tests/codex-furnishings2026.test.cjs')"` a affiché les 26 cas individuellement.
