# Monde sans bord — spécification

Référence de direction : `docs/GAME_BIBLE.md` §7.13 (« D'où l'on part », « Direction : sans bord »).
Contrats : `AGENTS.md` (versions de génération, flux RNG, identifiants, prélèvements, transaction
d'activation). Documents liés : [plan.md](plan.md), [tasks.md](tasks.md).

Ce dossier est le premier cadrage Spec Kit du dépôt (ni `specs/` ni `.specify/` n'existaient ;
les compétences `/speckit-*` ne sont pas chargées dans cette session : les trois documents
suivent leur découpage — besoin, plan, tâches — sans les gabarits amont).

Les numéros de ligne renvoient au commit `19a67c5` ; les fichiers ont de très longues lignes,
la ligne citée est donc celle où commence l'instruction.

## 1. Besoin

Une **nouvelle campagne** n'a plus de bord. Le joueur roule dans une direction aussi loin que
son carburant, ses dépôts et ses avant-postes le portent ; le monde se crée devant lui, canton
par canton, et ce qu'il a touché reste touché. **La limite n'est plus un mur, c'est le
réservoir.** Les campagnes déjà commencées ne changent en rien.

### Parcours joueur visés

1. Nouvelle partie : la carte apparaît en moins de deux secondes au lieu d'environ sept.
2. Sortie en voiture plein est : aucune butée, aucune côte-clôture ; routes et cours d'eau
   continuent sans couture visible ; plus loin, lieux plus rares et plus durs.
3. Retour par un autre chemin, puis sauvegarde, fermeture, reprise : les lieux vidés sont
   vides, les arbres coupés sont coupés, les cantons revisités sont identiques.
4. Atlas : la carte se centre sur ce qui est connu, se déplace sans butée, et montre le
   rayon d'action réel du véhicule.
5. Chargement d'une sauvegarde antérieure : région finie de 24 576 m, identique au bit près.

## 2. Exigences

| Id | Exigence | Vérification |
|---|---|---|
| E1 | Le monde sans bord est une **nouvelle génération** (numéro réservé : 12), choisie seulement à la création d'une campagne. Aucune activation depuis G1–G11. | Test : `normalize` refuse G12 tant que la tranche d'ouverture n'est pas livrée ; aucune offre d'activation dans `world-pack131.js`. |
| E2 | G1–G11 : mêmes versions, flux RNG, identifiants, prélèvements, taille. Aucun nouveau tirage dans un flux existant. | Empreintes de monde `docs/codex/suivi-monde2026/campagne*.json` inchangées sur les huit graines de référence. |
| E3 | Le contenu d'un canton est une fonction pure de (graine, coordonnées du canton, version). Il ne dépend ni de l'ordre de visite, ni du cache, ni de l'heure. | Test : génération dans trois ordres (ligne, inverse, spirale) et après éviction → empreintes égales. |
| E4 | Deux cantons voisins partagent leurs points de raccord : une route ou un cours d'eau qui sort de l'un entre dans l'autre au même point, avec la même largeur. | Test de couture : pour chaque arête d'un échantillon, extrémités égales des deux côtés. |
| E5 | Identifiants stables portant les coordonnées du canton ; aucun compteur global. Un identifiant de canton ne peut pas être pris pour un identifiant historique. | Test : expressions des validateurs actuels contre les nouveaux identifiants. |
| E6 | Sauvegarde **creuse** : seuls les écarts sont stockés (prélèvements, lieux vidés, ennemis blessés, cantons vus). Taille bornée par ce que le joueur a touché, avec plafonds explicites. | Test : aller-retour de sauvegarde après 60 cantons traversés ; taille et plafonds. |
| E7 | Coût par image borné : au plus un canton généré par image hors écran de chargement, budget en millisecondes mesuré ; mémoire bornée par un cache à éviction. | Sonde de performance en navigateur ; compteur `streamStats`. |
| E8 | Les règles du jeu ne changent pas : boucle récolte → dépôt → construction → horde, butin fini jamais régénéré, zombies sérieux, difficulté par le nombre. « Plus loin, plus rare et plus dur » passe par les bandes de distance existantes (`world-spawns131.js`). | Tests des systèmes concernés ; relecture d'équilibrage. |
| E9 | Les modules de présentation (atlas, minicarte, peintres) lisent le monde chargé ; ils ne déclenchent ni tirage ni génération. | Test statique + sonde : ouvrir l'atlas ne change pas `streamStats`. |
| E10 | Valeurs d'équilibrage et de budget dans `src/core.js`. | Revue. |

Hors périmètre de ce chantier : relief par paliers, lieux remarquables et nids, travaux de
terrain, avant-postes (§7.14). Le relief exige lui aussi une nouvelle génération : voir le
point de décision D2.

## 3. Inventaire de ce qui suppose un bord

### 3.1 Constantes de taille

| Où | Quoi |
|---|---|
| `src/core.js:6` | `WORLD_SIZE = TILE * WORLD_TILES` : carte **locale** de la cité (4 096). Non concernée ; à ne pas confondre. |
| `src/core.js:1927` | `WorldStreamRules131 = {size:24576, sector:1024, prefetchChunks:1}` : taille de la région G5+. |
| `src/core.js:2093` | `GeographyRules135 = {size:24576, homeMinFraction:.36, homeMaxFraction:.64, settlements:34, margin:120, …}` : D-17 placé en **fraction de la taille**, 34 agglomérations fixes. |
| `src/core.js:1781` | `AtlasRules = {regionSize:8192, homeMin:4032, center:4096, …}` : étendue minimale de l'atlas. |
| `src/core.js:2556` | index spatial : `maxRoads:30000, maxLineLength:36000, maxQueryCells:10000`. |
| `src/frontier-world.js:5` | `sizeForGeneration = g => g>=5 ? (WorldStreamRules131.size || 24576) : 8192` — **le** point d'entrée de la taille. |
| `src/frontier-world.js:7` | `RULES = {size:8192, chunk:256, chunkCache:25, planCache:48, baseMin:4032, baseMax:4160, …}`. |
| `src/frontier-geometry.js:3` | `SIZE=8192, CHUNK=256`. |
| En dur | `24576` dans `src/field-atlas-state.js:6`, `src/succession133.js:20`, `src/companions-pack.js:16` ; `8192` dans `src/frontier-world.js:49,263`, `src/world-stream131.js:7`, `src/atlas-render.js:34,73,74`. |

### 3.2 Génération d'un bloc

| Où | Ce qui est créé d'un coup |
|---|---|
| `src/frontier-world.js:10` | `create(seed, generation, effects)` : liste fermée `[1..11]`, tableaux globaux `roads`, `pois`, `bins`, `roadBins`. Mesuré en navigateur sur la graine 17117 (G8) : 3 142 routes, 2 441 lieux, 34 agglomérations, 576 secteurs. |
| `src/geography135.js:8` | `home()` : position de D-17 = `R.size × fraction`. |
| `src/geography135.js:15-48` | 34 agglomérations tirées **en séquence dans un seul flux** (`G.rng(G.hash(seed,'geography141'))`), dans `1100 … size-2200` ; quatre sorties de bord (`:30`) ; arbre couvrant global (`:34-41`) ; `Route hors limites` (`:48`). |
| `src/geography135.js:70` | 576 secteurs `S<x>_<y>` en double boucle `0 … size`. |
| `src/world-stream131.js:7-10` | grille G5 `tiles = size/edge`, routes butant à `size-80`. |
| `src/hydrology165.js:15-39` | `size` exigée entre 4 096 et 32 768 (`:17`) ; **côte = un des quatre bords** (`:18`) ; océan `outletId:'outside-region'` (`:26`) ; cinq rivières tracées d'un bord à la côte (`:33-34`). |
| `src/biomes164.js:15` | emprises d'agglomération bornées à `GeographyRules135.size`. |
| `src/frontier-world.js:92-107,132-165` | peuplement des lieux par passes globales sur toutes les routes (`extension`, `Geometry160.populate`, `Campaign205.populate`). |
| `src/world-evolution.js:5-6` | migrations et épaves : `w.roads[G.hash(…) % w.roads.length]` — tirage **modulo le nombre total de routes**, donc dépendant du monde entier. |

### 3.3 Identifiants

| Où | Forme | Borne |
|---|---|---|
| `src/frontier-world.js:49` | lieux `P` + rang global sur 4 chiffres ; refus au-delà de `pois.length >= 10000` | 10 000 lieux, ordre de création global |
| `src/frontier-world.js:10`, `src/world-stream131.js:5` | routes `r<rang>`, `r131_<rang>` | compteur global |
| `src/geography135.js:70`, `src/frontier-world.js:136,163` | secteurs `S<x>_<y>` non signés | 24 × 24 |
| `src/frontier-state.js:13` | prélèvements `P\d{4}:…`, arbres et rochers `[TR]<cx>_<cy>_<n>` (non signés) ; ennemis `P\d{4}:e\d+`, `N165_<cx>_<cy>_0` (≤ 3 chiffres) | idem |
| `src/frontier-state.js:5` | `naturalId`, `animalId` : coordonnées de morceau ≤ 999 | 256 km |
| `src/field-atlas-state.js:4-5` | `idOK = /^P\d{4}$/`, villes `T131_x,y`, `T135_n` avec `n < 34` | idem |
| `src/forage193.js:16` | cueillette `…_cx_cy_n`, `limit = ceil(GeographyRules135.size / chunk)` | idem |
| `src/world-evolution.js:5-6` | groupes `W` + série sur 4 chiffres | état, non spatial : conservé |
| `scripts/audit-campaign-sites205.cjs` | `P9000+…`, `/^P\d{4}:0:\d+$/` | preuve liée à `P\d{4}` |

### 3.4 Index et tableaux dimensionnés par la taille

- `src/frontier-world.js:226-227, 242, 273` : morceaux `0 … size/256-1` ; hors bornes → morceau vide.
- `src/frontier-world.js:245` : pas de décor à moins de `pad` du bord.
- `src/frontier-world.js:262, 272, 275, 283` : caches bornés (25 morceaux, 48 plans, 64 détails) — déjà à éviction, réutilisables tels quels.
- `src/biome-population165.js:9, 12, 41`, `src/wildlife189.js:25, 59, 80`, `src/biome-forage193.js:16, 26, 68, 105-106` : `ceil(w.size / chunk)`, exclusion à 1–2 m du bord.
- `src/field-atlas-state.js:6` : cellule de reconnaissance = `(sy*3+sx)*4096 + …` sur 3 × 3 blocs de 8 192 m ; `maxCells:36864` (`src/core.js:1787`) ; registre **dense par indice**.
- `src/frontier-routing.js:44` : Dijkstra sur **tout** le graphe (`Float64Array(g.nodes.length)`, `Int32Array`, `Uint8Array`), quatre sources en cache (`:4`, `:48`), 12 octets par nœud et par source (`:62`).

### 3.5 Sauvegarde et validateurs bornés à la taille

- `src/frontier-state.js:6-7` : générations `[1..11]` ; `size = W.sizeForGeneration(generation)`.
- `src/frontier-state.js:8, 10, 14, 15` : position, voiture, poursuites, faune dans `[0.32, size-0.32]`.
- `src/frontier-state.js:3, 13` : `MAX_TAKEN = 120000`, 15 000 ennemis — registres déjà creux (clé → reste), bon modèle.
- `src/frontier-state.js:18-22` : la validation **régénère le monde entier** (cache de 3) pour vérifier chaque identifiant.
- Même borne `sizeForGeneration` : `src/essential-state.js:3-4`, `src/night-gear.js:21, 31`, `src/survival-pack.js:11, 13`, `src/succession133.js:20-28`, `src/husbandry191.js:32, 43, 55`, `src/world-evolution-state.js:26`, `src/companions-pack.js:16`.
- `src/field-atlas-state.js:14` : `validate` reconstruit le monde et indexe `w.pois` par identifiant.
- Parcours complets de `pois` (`find`, `filter`, `map`) : 30 fichiers, dont `src/frontier.js:83, 119, 252-253`, `src/world-pack131.js` (9), `src/interventions134.js` (4), `src/field-atlas.js` (3), `src/campaign-pack.js` (3).

### 3.6 Atlas, minicarte, déplacements

- `src/atlas-projection.js:25-30` : caméra bornée `clamp(0, extent)`, zoom minimal calé sur l'étendue totale.
- `src/atlas-view.js:11, 15-17, 32` : `cam.regionSize(world.size)` ; `fit()` cadre toute la région.
- `src/atlas-render.js:34, 67, 73-74` : fond et grille peints sur `0 … world.size` ; rien hors de là.
- `src/frontier.js:173, 232`, `src/world-evolution.js:41, 80` : acteurs retenus ou retournés au bord (`h.a += Math.PI`).

### 3.7 Transaction d'activation

`src/world-pack131.js:54-86` (G8, G9), `:89-145` (G10), `:146-186` (G11) : aperçu, contrôles de
recouvrement (contacts, voiture, structures), copie de la sauvegarde, `g.restoreSave(data)`,
puis `generation = cible`. Chaque activation **ajoute** des lieux à une région finie déjà
vue ; elle suppose `next.sectors`, `next.pois` complets. Constat en navigateur : une campagne
neuve (`startNew('standard','17117')`) démarre en **G8** ; G9 à G11 s'obtiennent par ces
activations volontaires.

### 3.8 Preuves et scripts

- `scripts/audit-campaign-sites205.cjs`, `-services208.cjs`, `-water214.cjs` : mondes G11 complets sur huit graines ; empreintes dans `docs/codex/suivi-monde2026/campagne*.json` (244 sources hachées).
- `scripts/browser-qa142.mjs:124`, `browser-journey144.mjs:100`, `browser-pwa142.mjs:104`, `browser-standalone142.mjs:62` : attendent `world.size === 24576 && towns === 34`.
- `scripts/qa-biomes141.cjs:6, 9` : balayage `128 … 24576`.

## 4. Critères de réception du chantier entier

1. Les huit graines de référence donnent les mêmes mondes G1–G11 qu'avant (empreintes).
2. Une campagne G12 : 20 km parcourus dans une direction, sauvegarde, reprise, retour — aucun
   écart d'empreinte entre les cantons au premier et au second passage.
3. Aucune erreur de page ; image la plus lente pendant la traversée d'une couture dans le
   budget fixé en T2 du plan.
4. Sauvegarde après 20 km : sous le plafond fixé en T4.
5. `npm run check` vert, preuves régénérées par le mainteneur.
