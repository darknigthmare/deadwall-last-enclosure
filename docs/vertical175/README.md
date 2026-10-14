# DEADWALL — Les Enceintes du Ciel

## Livraison 175 — tranche jouable, PR en brouillon

Base auditée : `main` 5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90 (1.60/G10), 14 octobre 2026. Branche `feat/vertical-citadel-175`, PR #6, sans fusion de main ni de la PR métrique #5. Les murs béton, plusieurs enceintes et le contrôle au sol de tourelles existaient ; l'ensemble cité élevée / murs parcourables / FPS perspective n'existait pas.

### Contenu raccordé au jeu

| Support | Âge requis | Hauteur | Pierre / ferraille | Charge |
|---|---|---:|---:|---:|
| Rempart de veille | Forteresse (3) | 12 m | 220 / 100 | 160 |
| Grande enceinte | Métropole (6) | 24 m | 500 / 240 | 220 |
| Muraille ultime | Mégaville I (8) | 48 m | 1000 / 500 | 320 |
| Fondation habitée | Ville (4) | 6 m | 280 / 140 | 300 |
| Fondation profonde | Métropole (6) | 12 m | 600 / 260 | 480 |

Les valeurs font autorité dans `core.js`, objet `VerticalCitadel175`. Les supports utilisent le placement et le chantier natifs. Une dalle supplémentaire coûte 180 pierres et 90 ferrailles, prend 35 secondes actives, ajoute 6 m et 30 de charge. Six paliers au total : fondation 6 m jusqu'à 36 m, fondation 12 m jusqu'à 42 m. La muraille ultime a son chemin de ronde à 48 m. Les remparts ne superposent pas de dalles. La charge est une unité d'équilibrage, pas une grandeur d'ingénierie certifiée.

Chaque palier réserve quatre emplacements et un passage central. Modules : logements suspendus (+12 places), réserve d'étage (+600 de stockage), serre, atelier de munitions, projecteur et quatre affûts : mitrailleuse, mitrailleuse lourde, précision anti-colosse, canon de barrage. Les modules achevés participent à l'économie native : logement, stockage, énergie, production, consommation et signature. Aucun double compteur de cité ni ressource gratuite au chargement.

### Accès et commandes

Rejoindre à pied l'entrée du support achevé puis **MONTER**. L'escalier est une traversée intérieure temporisée, avec interpolation d'altitude, et non un intérieur où chaque marche est librement parcourable. Un ascenseur financé et achevé consomme 5 énergie ; sa panne interrompt le trajet au dernier palier sûr. Les escaliers restent disponibles. Pause et modales suspendent les déplacements d'étage.

Le dossier **Citadelle verticale** sert à financer dalles et modules depuis le palier central. Les travaux interrompus conservent leur avancement et ne sont pas payés deux fois. Il faut ensuite rejoindre physiquement l'affût pour le ravitailler depuis les munitions du sac, puis le contrôler. **V / VUE FPS** change de caméra ; **I / QUITTER L'AFFÛT** rend le contrôle automatique. Souris : viser et tirer ; tactile : glisser pour viser et maintenir TIR.

Les deux vues partagent ennemis, orientation, chaleur, cadence, munitions et dégâts. Le tir utilise les mêmes intersections 3D avec les volumes du monde, et conserve la réduction frontale des porte-boucliers. Acquisition automatique limitée à douze candidats prioritaires, indépendante de la cadence de tir, avec occlusion et luminosité. Pas de certification de performance extrême.

### Siège, destruction et sauvegarde

Trois mutants autorisés par la demande : Porte-faille (6 m), Porte-charniers (12 m), Colosse de siège (20 m). Attaques annoncées, récupération, points faibles tête/jambes. Apparitions rares à partir de la vague 25, tous les cinq assauts, selon âge et rempart construit ; trois géants maximum. Un géant vivant empêche la fin prématurée d'un assaut. Le plafond natif de 720 infectés reste inchangé. Le seuil de pression de corps des nouveaux murs augmente avec leur hauteur.

Le registre optionnel `expansions127.modules.vertical175` sauvegarde supports, paliers, modules, stocks, chaleur, timers des géants et palier du joueur. Il refuse avant mutation les données non finies, supports orphelins, doublons, charges et hauteurs impossibles. Le transit est sauvegardé au dernier palier sûr ; travaux et possession sont transitoires. Détruire un support retire ses étages et capacités, libère le contrôle et traite la chute. Déplacer/pivoter un support est interdit pour préserver ses attaches.

### Validation et limites

Local : **23/23 tests ciblés passent**, syntaxe et build **341 fichiers publics** passent. Le banc Chromium hors réseau charge les 159 scripts réels dans un DOM en mémoire : bouton de montée, construction, ravitaillement, possession et sauvegarde ; pas d'erreur JavaScript observée ni de débordement horizontal à 390 × 844. WebGL est indisponible dans ce banc ; seul son repli classique y est validé. Aucun succès de rendu FPS local n'est revendiqué.

`npm run check` local n'est pas validé : module `@napi-rs/canvas` absent et fixtures historiques `reports/` exclues de l'archive reçue. La CI utilise le dépôt complet et `npm ci`, puis `scripts/qa-vertical175.mjs` pour une qualification WebGL réelle. Seuls ses résultats publiés pour le commit testé font foi, pas le vert d'un ancien commit.

Le rendu FPS est un vrai rendu perspective WebGL avec profondeur, mais sa géométrie est procédurale et simplifiée. Restent à développer : pyramides vivantes de hordes et ascension physique des remparts ; géantes portes/angles/bastions/passerelles ; intérieurs libres et cabines visibles ; navigation multiniveau des PNJ et fret ; libre placement des bâtiments historiques ; effondrement par piliers/dalles ; art, animations, audio et lighting finaux ; longs essais de campagne et équilibrage. Cette tranche n'est pas l'extension massive entièrement terminée ni un port artistique 3D intégral.

### Reproduction et provenance

`npm ci`, `node --test tests/vertical-citadel175.test.cjs`, `npm run check`, puis `npm start`. Pour le navigateur : `npx playwright install chromium` puis `node scripts/qa-vertical175.mjs`.

`scripts/integrate-vertical175.cjs` matérialise dix modifications relues avec empreintes SHA256 avant/après, contrôle aussi six sources nouvelles, et refuse toute divergence. Il est idempotent ; il ne génère aucun code nouveau. Le workflow est limité à cette branche et effectue un push normal, jamais forcé ni vers main. Aucun asset tiers nouveau n'est importé ; les primitives graphiques sont originales et provisoires.

## Suite 176 — sièges sur les chemins de ronde

La suite de cette même PR ajoute les portes 12/24/48 m, les bastions, les grimpeurs natifs, les attaques des équipements d'étage et la cohérence de tir en altitude. Le registre de sauvegarde migre en version 2. Les commandes, bornes, contrôles et manquants actualisés sont dans [SIEGES_176.md](SIEGES_176.md). Les limites de la livraison 175 ci-dessus sont historiques : ne pas les utiliser comme liste de réception de la suite 176.

## Suite 177 — couverture des onze âges et maintenance

La suite 177 ajoute 28 supports et 22 équipements, les services de réparation/soins/démontage, le catalogue par âge et la production indépendante des ateliers. Elle conserve les sauvegardes et plafonds historiques des fondations existantes. Voir [AGES_177.md](AGES_177.md) pour les valeurs, commandes, tests et limites actualisés.
