# Les Enceintes du Ciel — tous les âges et maintenance 177

## Source et périmètre

Suite de la PR #6, branche `feat/vertical-citadel-175`, base `3bcd2bd9d91653e7048ee91509e80f3d5afaaa98`. La variante #7 reste indépendante. Aucune fusion de main ni mise en production. Les ajouts 175 et 176 sont conservés.

**28 nouveaux supports et 22 nouveaux équipements**, soit **39 supports et 31 équipements** dans le catalogue vertical cumulatif. Chacun des onze âges possède des ouvrages constructibles et des équipements utilisables ; une page de catalogue ne débloque jamais un âge. Valeurs autoritaires : `src/core.js`, `VerticalCitadel175` et `VerticalAges177`.

## Progression réelle

| Âge | Plafond de financement de nouvelles dalles | Supports déblocables | Équipements déblocables |
|---|---:|---:|---:|
| 0 — REFUGE | 2 m | 1 | 2 |
| 1 — CAMP FORTIFIÉ | 3 m | 4 | 2 |
| 2 — AVANT-POSTE | 6 m | 4 | 2 |
| 3 — FORTERESSE | 12 m | 4 | 4 |
| 4 — VILLE | 18 m | 2 | 5 |
| 5 — GRANDE VILLE | 24 m | 4 | 3 |
| 6 — MÉTROPOLE | 30 m | 4 | 4 |
| 7 — GRANDE MÉTROPOLE | 42 m | 4 | 3 |
| 8 — MÉGAVILLE I | 48 m | 4 | 2 |
| 9 — MÉGAVILLE II | 60 m | 4 | 2 |
| 10 — MÉGAVILLE III | 72 m | 4 | 2 |

Ces plafonds ne confisquent pas les paliers déjà construits dans une sauvegarde ancienne. La plateforme de récupération de 2 m et l'estrade de 3 m restent à un seul palier, sans ascenseur. Le socle d'atelier de 6 m et le socle de redoute de 12 m acceptent deux paliers. La fondation logistique accepte quatre paliers. Les fondations historiques gardent six paliers. La fondation finale de 36 m accepte sept paliers, jusqu'à 72 m, toujours sous contrainte de charge. Les remparts ont un chemin de ronde et ne superposent pas de quartiers.

Les ascenseurs commencent à Ville, ou plus tard pour les supports avancés. Les escaliers restent utilisables avant ce déblocage et en cas de panne. Les grandes emprises exigent de déblayer les ressources ; aucune collision n'est supprimée pour imposer un placement.

## Nouveaux supports

| Identifiant | Ouvrage | Âge | Dimensions au sol | Charge | Coût |
|---|---|---:|---|---:|---|
| lookout2a177 | Plateforme de récupération — 2 m | 0 | 6 × 6 m | 35 | B 55 · F 15 |
| rampart3a177 | Rempart de charpente — 3 m | 1 | 12 × 6 m | 65 | B 115 · F 35 |
| gate3a177 | Porte de charpente — 3 m | 1 | 6 × 6 m | 65 | B 133 · F 41 |
| bastion3a177 | Bastion de charpente — 3 m | 1 | 6 × 6 m | 85 | B 125 · F 38 |
| timberDeck3a177 | Estrade de camp — 3 m | 1 | 8 × 8 m | 85 | B 110 · F 40 |
| rampart6a177 | Rempart d’acier — 6 m | 2 | 12 × 6 m | 120 | F 135 · P 55 |
| gate6a177 | Porte d’acier — 6 m | 2 | 6 × 6 m | 120 | F 156 · P 64 |
| bastion6a177 | Bastion d’acier — 6 m | 2 | 6 × 6 m | 140 | F 146 · P 60 |
| workDeck6a177 | Socle d’atelier — 6 m | 2 | 10 × 10 m | 160 | B 65 · F 160 · P 85 |
| refugeDeck12a177 | Socle de redoute — 12 m | 3 | 12 × 12 m | 240 | F 180 · P 330 |
| freightDeck12a177 | Fondation logistique — 12 m | 4 | 16 × 12 m | 380 | F 230 · P 420 |
| rampart18a177 | Rempart de grande ville — 18 m | 5 | 12 × 6 m | 195 | F 195 · P 380 |
| gate18a177 | Porte de grande ville — 18 m | 5 | 6 × 6 m | 195 | F 225 · P 437 |
| bastion18a177 | Bastion de grande ville — 18 m | 5 | 6 × 6 m | 215 | F 211 · P 411 |
| districtDeck12a177 | Fondation de quartier — 12 m | 5 | 16 × 16 m | 450 | F 280 · P 510 |
| rampart36a177 | Rempart de grande métropole — 36 m | 7 | 12 × 6 m | 280 | F 380 · P 760 |
| gate36a177 | Porte de grande métropole — 36 m | 7 | 6 × 6 m | 280 | F 437 · P 874 |
| bastion36a177 | Bastion de grande métropole — 36 m | 7 | 6 × 6 m | 300 | F 411 · P 821 |
| metroDeck18a177 | Fondation de grande métropole — 18 m | 7 | 16 × 16 m | 600 | F 450 · P 850 |
| megaDeck24a177 | Fondation de mégaville — 24 m | 8 | 20 × 20 m | 720 | F 630 · P 1150 |
| rampart60a177 | Rempart de mégaville II — 60 m | 9 | 16 × 8 m | 420 | F 760 · P 1450 |
| gate60a177 | Porte de mégaville II — 60 m | 9 | 8 × 8 m | 420 | F 874 · P 1668 |
| bastion60a177 | Bastion de mégaville II — 60 m | 9 | 8 × 8 m | 440 | F 821 · P 1566 |
| megaDeck30a177 | Fondation de mégaville II — 30 m | 9 | 20 × 20 m | 900 | F 850 · P 1550 |
| rampart72a177 | Rempart de mégaville III — 72 m | 10 | 16 × 8 m | 520 | F 1050 · P 1900 |
| gate72a177 | Porte de mégaville III — 72 m | 10 | 8 × 8 m | 520 | F 1208 · P 2185 |
| bastion72a177 | Bastion de mégaville III — 72 m | 10 | 8 × 8 m | 540 | F 1134 · P 2052 |
| megaDeck36a177 | Fondation de mégaville III — 36 m | 10 | 24 × 24 m | 1120 | F 1150 · P 2100 |

## Nouveaux équipements

| Identifiant | Équipement | Âge | Charge | Coût | Usage réel |
|---|---|---:|---:|---|---|
| fieldCache177 | Caisse de récupération | 0 | 6 | B 25 · F 8 | +80 stockage/ressource |
| handRifle177 | Affût de fusil manuel | 0 | 4 | B 20 · F 25 | manuel uniquement, sans courant, 45 m / 30 cartouches |
| watchCabin177 | Abri de guetteurs | 1 | 10 | B 65 · F 25 | +4 logements |
| handMachineGun177 | Mitrailleuse sur trépied | 1 | 10 | B 30 · F 65 | manuel uniquement, sans courant, 55 m / 75 cartouches |
| steelLocker177 | Réserve métallique | 2 | 18 | B 35 · F 70 | +220 stockage/ressource |
| handSupport177 | Affût lourd à manivelle | 2 | 18 | B 35 · F 110 · P 25 | manuel uniquement, sans courant, 70 m / 24 cartouches |
| aidPost177 | Poste de secours de rempart | 3 | 20 | B 55 · F 75 · + 8 | 16 PV / 1 médicament(s) portés |
| signalLamp177 | Feu de veille orienté | 3 | 4 | F 35 · C 3 | éclairage 260 unités locales |
| freightReserve177 | Réserve de palier renforcée | 4 | 26 | B 75 · F 110 · P 35 | +450 stockage/ressource |
| terraceGarden177 | Potager de terrasse | 4 | 16 | B 100 · F 65 · P 40 | production {"food":0.18} |
| recyclingDeck177 | Atelier de récupération d’étage | 5 | 28 | F 140 · P 65 · C 12 | production {"scrap":0.22} |
| handPrecision177 | Affût de précision manuel | 5 | 18 | F 175 · P 50 | manuel uniquement, sans courant, 130 m / 48 cartouches |
| metroQuarters177 | Habitat de métropole | 6 | 52 | B 200 · F 170 · P 140 | +28 logements |
| deepReserve177 | Réserve métropolitaine | 6 | 65 | B 150 · F 160 · P 110 | +1400 stockage/ressource |
| hydroponic177 | Cultures de grande métropole | 7 | 46 | B 170 · F 240 · P 140 · C 25 | production {"food":0.8} |
| crossBattery177 | Batterie de couverture rapprochée | 7 | 40 | F 265 · P 120 | automatique et contrôlable, 90 m / 320 cartouches |
| armoredAid177 | Poste de triage blindé | 8 | 48 | F 230 · P 190 · + 22 | 40 PV / 2 médicament(s) portés |
| longSearchlight177 | Projecteur de front | 8 | 16 | F 140 · P 60 · C 12 | éclairage 650 unités locales |
| megaQuarters177 | Habitat de mégaville II | 9 | 85 | B 380 · F 350 · P 320 | +60 logements |
| megaArsenal177 | Arsenal d’étage de mégaville II | 9 | 70 | F 420 · P 260 · C 45 | production {"ammo":1.2} |
| megaFarm177 | Complexe nourricier supérieur | 10 | 90 | B 380 · F 440 · P 300 · C 50 | production {"food":1.3} |
| siegeBattery177 | Batterie de siège de mégaville III | 10 | 70 | F 620 · P 360 · C 35 | automatique et contrôlable, 180 m / 240 cartouches |

## Maintenance et soins

Depuis **Citadelle → Entretien et soins**, approcher physiquement l'équipement sur son étage. La réparation rend au plus 250 PV en huit secondes actives et prélève à la fin les matériaux de construction au prorata des dégâts réparés. Déplacement, blessure, dommages sur l'équipement ou perte de support annulent le service sans paiement. Une pause suspend le délai ; une sauvegarde ne termine pas un service en cours.

Le démontage exige une prévisualisation puis une confirmation. Un changement d'état ou de stock invalide la confirmation. Le démontage dure dix secondes actives ; il retire réellement capacités et occupation. La récupération de matériaux est de 35 % au prorata de l'intégrité, plafonnée à l'espace du dépôt après retrait. Les seules cartouches récupérables sont celles réellement contenues dans l'affût. Une réserve dont la suppression ferait perdre des stocks existants ne peut pas être démontée avant réduction des stocks. La destruction hostile n'accorde pas cette récupération.

Le poste de secours et le triage blindé soignent le commandant présent, avec médicaments du sac et alimentation électrique. Pas de soin gratuit ni de résurrection ; une menace visible dans un rayon de 12 m bloque les soins. Ce service n'automatise pas les soins des PNJ à d'autres étages.

Les quatre nouveaux affûts manuels ne tirent pas seuls et restent utilisables sans courant, y compris si d'autres équipements du support sont hors tension. Les affûts électriques peuvent être ravitaillés hors tension, mais pas activés. Les nouveaux projecteurs alimentent la visibilité d'étage par leurs propres valeurs, sans dépendre de l'identifiant de l'ancien projecteur.

## Économie, lisibilité et compatibilité

Les capacités de logement, stockage, énergie et production des modules achevés sont lues par les conditions de progression native. Le score diversifié et le décompte des modèles bâtis conservent leurs règles historiques : les modules ne deviennent pas une nouvelle source illimitée de crédit d'âge. Le tir manuel, les stocks et la santé restent partagés entre les deux caméras.

Deux ateliers placés sur le même support calculent désormais leur production séparément : saturer la nourriture d'une serre n'arrête plus un atelier de munitions voisin. Les deux restent liés au réseau électrique du support et aux stocks communs ; ce n'est pas un réseau de fret indépendant.

Le dossier se filtre en **Défenses et éclairage**, **Vie et production** et **Entretien et soins**. Les pages d'âge sont consultatives ; seuls les modules acquis sont proposés à la construction. Les constructions nouvelles ont des couleurs de charpente, acier ou béton dans le rendu procédural existant. La clé de cache PWA devient `deadwall-v1.60.0-g10-vertical-ages177` ; les sauvegardes ne sont pas effacées.

## Vérifications reproductibles

`node --test --test-concurrency=2 tests/vertical-citadel175.test.cjs tests/vertical-siege176.test.cjs tests/vertical-ages177.test.cjs`

`npm run check` puis `node scripts/qa-vertical175.mjs`, `node scripts/qa-vertical176.mjs` et `node scripts/qa-vertical177.mjs`.

Les fixtures déclarent les âges avancés, les supports achevés et, pour les grandes emprises, la récolte préalable des ressources sans crédit de butin. Les équipements, temps de trajet, coûts et services utilisent les contrôleurs de production. Le scénario navigateur vérifie les boutons, le tir manuel à 2 m, la réparation, la confirmation du démontage, les onze pages d'âge, la vue mobile et une sauvegarde à 72 m. Les reçus du commit réellement testé font foi, pas les résultats d'un ancien commit.

## Chantiers encore ouverts

Aucun nouveau réseau général de navigation verticale des PNJ ni fret automatisé n'est livré ici. Restent les intérieurs librement parcourables et cabines détaillées, passerelles suspendues entre supports, placement arbitraire des bâtiments historiques, démontage des dalles et ascenseurs, déplacement/reconfiguration des modules, effondrement progressif par piliers, pyramides de corps individuels, LOD de foules et art/audio/animations finaux. La limite de 720 infectés actifs et de 24 grimpeurs détaillés est inchangée. Les géants restent ceux de 175. Les paliers 60 et 72 m et la nouvelle économie doivent encore être équilibrés sur des campagnes longues, sans prétendre qu'une couverture de catalogue certifie chaque combinaison jouable.
