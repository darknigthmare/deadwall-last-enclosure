# Aménagement des 400 avant-projets — 21 octobre 2026

## Résultat et portée

Les 400 plans auteur existants disposent maintenant d'une composition de mobilier métrique et d'un contrôle physique des accès. Ils comprennent **12 880 pièces hors circulation**, dont **12 850 reçoivent au moins un objet**, pour **41 723 objets placés**. Les **4 470 prescriptions non placées** restent visibles dans les données : le gabarit du mobilier et les dégagements priment sur le remplissage. Trente pièces de petits volumes restent entièrement vides. Aucun usage de pièce des sources actuelles n'est laissé sans classification.

Cette étape prépare et permet l'inspection de ces plans. Elle ne les ajoute pas à la campagne, ne relie aucun embarquement au monde et ne valide pas leur architecture, leurs réseaux, leurs graphismes ou leur gameplay complet. Les réservations de terrains, gradins, réservoirs, cales et ponts de travail gardent le statut défini par les plans auteur. Aucune nouvelle typologie parmi les 72 restantes n'est inventée.

| Famille | Plans | Pièces | Pièces meublées | Objets placés | Demandes refusées |
| --- | ---: | ---: | ---: | ---: | ---: |
| T060 — parc éolien | 50 | 600 | 600 | 2 200 | 0 |
| T065 — stade municipal | 50 | 2 000 | 2 000 | 7 140 | 110 |
| T066 — stade couvert | 50 | 2 000 | 2 000 | 7 140 | 110 |
| T005 — cargo | 50 | 1 680 | 1 652 | 4 141 | 1 817 |
| T006 — pétrolier | 50 | 2 800 | 2 800 | 10 015 | 0 |
| T007 — croiseur déclassé | 50 | 1 600 | 1 600 | 5 815 | 0 |
| T008 — sous-marin en surface | 50 | 600 | 600 | 848 | 1 255 |
| T011 — soutien offshore | 50 | 1 600 | 1 598 | 4 424 | 1 178 |
| **Total** | **400** | **12 880** | **12 850** | **41 723** | **4 470** |

Les 46 193 prescriptions sont entièrement comptabilisées : chaque identifiant correspond soit à un objet présent, soit à un refus documenté. Un refus n'est pas une autorisation de réduire un meuble ni de déplacer une cloison. Il indique où reprendre ultérieurement le programme ou le plan. La disposition reste une première composition fonctionnelle ; une pièce meublée ne signifie pas que son équipement complet ou sa mise en scène artistique est terminé.

## Programme et dimensions

Le module [codex-furnishings2026.js](../../../src/codex-furnishings2026.js) exploite les noms et fonctions déjà présents dans les [fondations métriques](../../../scripts/codex-world-foundations2026.cjs) et les [plans maritimes](../../../scripts/codex-maritime2026.cjs). Vingt-quatre programmes distinguent notamment couchage, salon, réfectoire, cuisine, réserves, sanitaires, douches, vestiaires, soins, buanderie, atelier, bureaux, accueil, archives, contrôle, électricité et machines. Une cuisine reçoit des équipements de cuisine ; les douches des cabines ; les ateliers des établis et du rangement. Les couloirs et coursives restent libres de mobilier.

Les emprises existantes sont lues dans [frontier-geometry.js](../../../src/frontier-geometry.js), [seed-detail157.js](../../../src/seed-detail157.js) et le catalogue `CodexFixtures164Rules` de [core.js](../../../src/core.js). Par exemple, l'établi conserve 2 × 0,85 m, la machine 2,6 × 1,6 m, le bureau 1,4 × 0,7 m et la baie électrique 1,5 × 0,6 m. Il s'agit des dimensions du catalogue du jeu, pas de nouvelles mesures de fabricants. Deux formes de composition explicitement déclarées complètent le catalogue : couchette de 2 × 0,75 m et cabine de douche de 0,9 × 0,9 m.

Chaque objet porte sa provenance `sourceDimensions`, son emprise d'origine `footprintM`, sa rotation et sa hauteur `heightM`. Les hauteurs ajoutées sont toutes des choix de composition, marqués `author-design-not-manufacturer-dimension`. Elles sont comparées à la hauteur libre de la pièce. Une rotation échange largeur et profondeur ; aucun facteur de réduction n'est utilisé. Les compartiments étroits du sous-marin refusent ainsi les machines de 2,6 × 1,6 m.

Les coordonnées sont locales au site et exprimées en mètres. Pour les navires, `level` est l'indice entier du pont, `sourceLevel` conserve son identifiant auteur et `elevationM` sa cote verticale, éventuellement négative ou fractionnaire. Ni une cote de pont, ni un tirant d'eau, ni une hauteur de meuble ne sert d'indice de niveau. Les coordonnées des annexes terrestres sont converties depuis leur repère de bâtiment sans modifier les plans sources.

## Dégagements contrôlés

Le placement réserve un chemin de 0,8 m de largeur entre chaque porte et le centre de sa pièce. Le joueur utilise un rayon de 0,32 m. Les objets gardent une marge aux murs et aux autres meubles ; leur face de service possède un dégagement de 0,8 m. Un meuble ne recouvre ni un autre objet, ni la face de service d'un autre, ni le trajet protégé de la porte. Tous les essais sont bornés et déterministes, sans appel au hasard de simulation.

La vérification locale agrandit les obstacles du rayon du joueur et recherche les chemins sur une grille de coordonnées issue de leurs arêtes. Chaque segment est vérifié de façon continue : une barrière fine ne disparaît pas entre deux cellules. Elle relie le centre, toutes les entrées et les centres des faces de service. Le contrôle supplémentaire de [codex-physical2026.js](../../../src/codex-physical2026.js) compose les meubles avec les murs, portes, escaliers et échelles de la scène, puis vérifie les parcours depuis l'entrée. Les limites des réservations dangereuses restent fermées.

`lootEligible` décrit seulement la fonction possible d'un conteneur. Tous les objets portent `lootAssigned:false` et `utilityConnected:false`. Aucun champ de quantité ni de ressource n'est généré. Les totaux restent à zéro conteneur de campagne créé et zéro service raccordé. La création d'une session d'inspection ne modifie pas les sauvegardes ou inventaires de campagne.

## Preuve et reproduction

Le script [audit-codex-inspection2026.cjs](../../../scripts/audit-codex-inspection2026.cjs) appelle la véritable API `CodexInspection2026.create` pour chacune des 400 variantes. Il compare chaque plan compilé à son générateur auteur, contrôle les deux audits, les faces accessibles, l'immutabilité et les compteurs de ressources. Son rapport [inspection-20261021.json](inspection-20261021.json) contient un enregistrement par variante, les agrégats par famille, les niveaux, murs et transitions réellement construits, les éventuels échecs et les SHA256 des sources et modules utilisés. Il refuse un compilé périmé et signale toute modification des sources pendant l'audit.

```sh
npm run codex:inspection
node --test tests/codex-furnishings2026.test.cjs
```

Le premier test de la suite réutilise `auditAll` : il ne maintient pas un second algorithme de validation des 400 plans. Pour écrire la preuve pendant cette même passe, lancer :

```sh
DEADWALL_WRITE_INSPECTION_AUDIT=1 node --test tests/codex-furnishings2026.test.cjs
```

Les cas complémentaires vérifient la stabilité des résultats, l'absence de hasard, la provenance des dimensions, les niveaux maritimes et l'export navigateur. Les cas négatifs altèrent notamment une emprise, une face de service, un niveau, une porte, une quantité de stock, une connexion, un identifiant, un refus ou les métadonnées d'une pièce : l'audit doit les rejeter. Les contrôles physiques, de sauvegarde d'inspection et de navigateur sont suivis séparément ; aucune qualification globale de la campagne n'est déduite de ce rapport.

La passe mobilier et intégration a exécuté **25 tests, tous réussis**, dont les 400 créations de session. Le rapport comptabilise **1 300 niveaux**, **89 730 segments de mur** et **900 transitions verticales** à travers les 400 variantes ; ces nombres additionnent des variantes distinctes, pas un seul monde. Aucun échec, test ignoré, annulation ou TODO n'a été signalé. Pour cette exécution, le lanceur explicite `DEADWALL_WRITE_INSPECTION_AUDIT=1 node -e "require('./tests/codex-furnishings2026.test.cjs')"` a affiché les 25 cas individuellement.
