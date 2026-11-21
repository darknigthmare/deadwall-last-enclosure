# Monde sans bord — plan d'ouverture « expérimental »

Besoin : [spec.md](spec.md). Plan technique : [plan.md](plan.md). Suivi : [tasks.md](tasks.md).

Ce document ordonne ce qui reste à faire pour qu'une **nouvelle** campagne puisse se jouer en
génération 12, choisie à la création de partie par une option « expérimental », la région finie
restant le défaut. Il remplace, pour la suite, le découpage T4–T6 de `plan.md` §7 par des
tranches plus fines, livrables **une à une**. Les tranches T0 à T5 (préparation) déjà livrées
restent décrites dans `tasks.md`.

Les numéros de ligne renvoient au commit `9e8b093` (lignes très longues : la ligne citée est
celle où commence l'instruction). Ils glissent d'une tranche à l'autre ; chaque tranche relève
les siens avant de commencer.

## 0. Décisions déjà prises et cadre commun

Décisions de l'utilisateur : ouverture **d'abord en option « expérimental »** à la création de
partie, région finie par défaut (D3) ; relief dans **la même génération 12** (D2) ; carte de la
cité de **192 m** et site **adossé** (T4.L1) ; mer = **zone basse** (palier 0, D6) ; canton de
1 024 m (D1).

Règles de chaque tranche, sans exception :

1. **Rien ne change en G1–G11.** Les graines de référence 0, 1, 42, 17117, 84329, 967313470,
   1947648717, 4294967295 donnent les mêmes mondes : `node scripts/audit-campaign-sites205.cjs
   <sortie> <graines>` comparé, hors `sha256` de sources, à
   `docs/codex/suivi-monde2026/campagne205-eligibilite.json`.
2. **La génération 12 reste refusée** (`frontier-world.create`, `frontier-state.normalize`)
   jusqu'à O9 compris ; avant O9, tout code G12 n'est atteint que par les tests.
3. Une tranche qui touche la cité (`game.js`, `core.js` hors règles, sauvegarde) refait le
   **parcours déterministe** de T5.B4 : `Math.random`, `Date.now`, `performance.now`,
   `crypto.randomUUID` figés, `startNew('standard','17117')`, vague forcée, 240 s à 30 pas par
   seconde, déplacements et un rendu sur quatre ; sauvegardes de départ, de mi-parcours et de
   fin **identiques octet pour octet** avant et après ; sauvegarde d'avant relue après.
4. Une tranche qui touche un validateur refait les **falsifications** de T1 (2 100 coordonnées
   altérées d'une sauvegarde de région : mêmes verdicts avant et après).
5. Valeurs d'équilibrage et de budget dans `src/core.js`, objet gelé `C.<Nom>217Rules`.
6. Un module hors jeu n'est ni dans `index.html`, ni dans `sw.js`, ni dans `dist/`. Les gardes
   d'isolement des tests (`tests/world-cantons217.test.cjs:140`,
   `tests/world-canton-gen217.test.cjs:404`, `tests/world-local217.test.cjs:212-213`) ne sont
   **jamais retirées** : une tranche qui ajoute un lecteur hors jeu l'ajoute à leur liste ;
   O9, qui charge ces modules dans le jeu, les remplace par des gardes « chargé sans effet en
   G1–G11 » au moins aussi strictes (même liste de fichiers, plus un test de comportement).

Notation : **ampleur** S (≤ 1 jour), M (2–3 jours), L (une semaine), XL (à redécouper) ;
**risque** pour les campagnes existantes (bas, moyen, haut) puis pour G12.

## 1. Vue d'ensemble

```
O1 monde régional G12 (interface)  ── livré, hors jeu
 ├─ O2 lieux G12 complets (plans, occupants, collisions régionales)
 │   └─ O3 sauvegarde G12 creuse ───────────────────────────────┐
 ├─ O4 lecteurs de voisinage (toute la liste → voisinage)  ∥     │
 │                                                              │
 O5 carte de la cité par campagne (taille, sauvegarde)          │
 └─ O6 arêtes de falaise dans la cité (pas, flux, collisions)   │
     ├─ O7 siège adossé : fronts, enceintes, équilibrage  ∥     │
     └─ O8 rendu 2D/2,5D puis vue FPS                     ∥     │
                                                                ▼
                         O9 ouverture « expérimental » (menu, fiche, branchement)
                         O10 atlas et minicarte sans étendue (T6), puis T7
```

| # | Tranche | Effet en jeu | Ampleur | Risque G1–G11 / G12 | En parallèle de |
|---|---|---|---|---|---|
| **O1** | Monde régional G12, interface commune, routage borné | Aucun (hors jeu) | M | nul / moyen | — (**livré**) |
| O2 | Lieux G12 complets et collisions régionales | Aucun (hors jeu) | L | nul / haut | O4, O5 |
| O3 | Sauvegarde G12 creuse, validation sans régénération globale (**livré**) | Aucun (G12 non créable) | L | moyen / moyen | O4, O5, O6 |
| O4 | Lecteurs de la liste complète des lieux → lecteurs de voisinage (**premier lot livré**) | Aucun (valeurs identiques) | L | moyen / bas | O2, O3, O5–O8 |
| O5 | Carte de la cité par campagne, taille portée par la sauvegarde (**livré**) | Aucun (128 partout) | L | haut / moyen | O2, O3, O4 |
| O6 | Carte de 192 m née de `world-local217` : arêtes de falaise, flux, collisions, gisements | Aucun (G12 non créable) | XL → O6a, O6b | moyen / haut | O3, O4 |
| O7 | Siège adossé : fronts par côté ouvert, enceintes sur falaise, équilibrage à deux côtés | Aucun | L | moyen / haut | O8 |
| O8 | Rendu des falaises et de l'eau en 2D/2,5D (O8a), vue FPS (O8b) | Aucun | L + L | bas / moyen | O7 |
| O9 | Ouverture : option de menu, fiche, branchement, chargement par anneau | **Oui, derrière l'option** | L | moyen / haut | — |
| O10 | Atlas et minicarte sans étendue fixe ; rayon d'action (T6) | Oui (G12) | M | bas / bas | après O9 |

Chemin critique : O1 → O2 → O3 → O9 et O5 → O6 → O7 → O9. O4 et O8 avancent à côté.

## 2. Tranches

### O1 — Monde régional G12 : interface commune et routage borné (**livré**, hors jeu)

But : un objet monde G12 qui répond aux accesseurs déjà lus par le jeu sur le monde fini
(tranche T1), construit à partir des cantons, sans rien brancher.

- Fichiers : `src/world-open217.js` (nouveau), `src/core.js` (`C.WorldOpen217Rules`, juste
  avant `C.Weather193Rules`), `tests/world-open217.test.cjs` (nouveau) ; listes d'isolement de
  `tests/world-cantons217.test.cjs:140` et `tests/world-canton-gen217.test.cjs:404` étendues
  à `world-open217.js` (le nouveau module lit les cantons ; aucune garde retirée).
- Interface : `site(id)` (charge le seul canton nommé), `sitesNear(x, y, r)` (voisinage exact,
  ordre canonique, rayon plafonné à `nearMaxRadius`), `contains` / `outside` / `outsideOpen` /
  `clampInside` / `axisMin` / `axisMax` / `chunkRange` aux conventions de T1 sur l'étendue de
  l'adressage (`contains` vrai pour tout point mesurable, `NaN` refusé), `extent()` infini
  (`bounded:false`), `nearestRoad(p)` (anneau `snapRadius`), `roadsAround(x, y)` et
  `pickRoad(hash, x, y)` (remplace `w.roads[hash % w.roads.length]` : la route dépend du
  hachage et du canton du point, pas du monde chargé), `route(from, to)` : Dijkstra sur le
  graphe routier du rectangle des deux cantons élargi de `route.margin`, refusé au-delà de
  `route.maxCantons` (25). Nœuds : cases de route et passages de couture, ces derniers
  nommés par l'identifiant de la couture, donc partagés par les deux cantons. `canton`,
  `cantonAt`, `streamStats`. **Aucun** `roads`, `pois`, `size`, `bounds` : un lecteur qui en
  dépend échoue au lieu de lire une vue partielle.
- `home` = plat garanti du site de fondation (64 m) ; O5 le remplacera par le cadre de la
  carte locale, que ce module ne lit pas (garde de `tests/world-local217.test.cjs:213`).
- Tests (9 cas) : règles ; limites ; `site` ; `sitesNear` contre un calcul exhaustif sur 7 × 7
  cantons ; indépendance du cache, de l'ordre et de l'éviction ; tirage de route ; coutures
  vues des deux côtés ; itinéraires (huit graines, continuité, symétrie, refus au-delà) ;
  isolement, génération 12 refusée, mondes G4 et G11 intouchés.
- Innocuité : module absent du jeu (ni `index.html`, ni `sw.js`, ni build, lu par aucun
  fichier de `src/`) ; seule l'empreinte de source de `src/core.js` change ; procédure 1.
- Parcours joueur : aucun.
- Réserves : le tracé suit les centres de maille (pas les courbes adoucies de
  `road.points`) ; détour de 1,2 à 2,4 fois le vol d'oiseau sur 2 km ; 31 itinéraires sur 32
  trouvés (un point d'arrivée non relié dans la zone permise) ; un lieu G12 n'a pas encore
  d'emprise (`sitesNear` mesure le centre) ni de `drive`.

### O2 — Lieux G12 complets et collisions régionales (**livré**, hors jeu)

But : que le monde O1 porte tout ce que la région finie offre au déplacement et à la fouille.
C'est T4.1 plus la façade de mouvement de `plan.md` §3.3.

- Fichiers : `src/world-open217.js` (ou `src/world-sites217.js` s'il dépasse 400 lignes) ;
  réemploi en lecture de `src/frontier-geometry.js` (`G.plan`, `G.local`, `G.global`),
  `src/world-spawns131.js` (occupants, bande de distance), `src/frontage174.js` (accès des
  lieux, `drive`), `src/campaign-sites205.js` et codex 160 (programmes de lieu, à décider
  site par site).
- Ajouts à l'objet monde : emprise et orientation des lieux, `drive`, `connectionFor`,
  `nearPOI`, `plan(p, z)`, `detailAt`, `chunk(cx, cy)` (arbres et rochers par morceaux de
  256 m à clé **signée**, flux nouveaux par `K.stream`), `around`, `blocked`, `line`,
  `vehicleClear`, `opticalBlocked`, `movementLine`, `threatCount`. **Nouveau** : une arête de
  falaise du canton (`levels`, `passes`) est un obstacle régional, infranchissable à pied
  comme en voiture ; la mer et les lacs aussi ; un col se prend par sa rampe.
- `sitesNear` passe à l'emprise tournée (même critère que `frontier-world.js:375`).
- Tests : plan d'un lieu identique quel que soit l'ordre de chargement ; occupants stables ;
  `blocked` vrai sur toute arête de falaise de 200 cantons, faux sur toute rampe de col ;
  aucune parcelle sur une falaise ni à cheval sur une couture ; `vehicleClear` sur les routes.
- Innocuité : hors jeu ; procédure 1.
- Parcours joueur : aucun ; page d'aperçu (`tools/apercu-cantons217.html`) étendue aux
  emprises.
- Ampleur L, risque G12 haut (coût par canton : mesurer contre le budget de 8 ms ; plans
  d'intérieur paresseux comme dans le monde fini).
- **Fait** : `src/world-sites217.js` (le fichier séparé est pris d'emblée : il dépend des modules
  du codex, de la géométrie et des occupants, que `world-open217.js` ne doit pas lire),
  `C.WorldSites217Rules`, `tests/world-sites217.test.cjs` (13 cas), page d'aperçu (case
  « emprises des lieux (O2) »). Le monde O2 enveloppe celui d'O1 sans le modifier ; `site(id)`
  y rend le lieu complet, `candidate(id)` le candidat brut. Genre tiré du milieu, programme du
  codex (`forParcel`, plan `floor`) ou plan historique du genre, emprise tournée face à la
  route, lot de la région finie, allée de `frontage174`, occupation et nombre d'occupants de
  la région finie, détails de la chaîne des campagnes neuves. Collisions : falaise
  infranchissable (pas et voiture), rampe franchissable, eau bloquante hors des ponts, décor
  par morceaux signés. D-O1 : `lineOfSight(from, to)` faux seulement si une arête de falaise
  **montante** dépasse le palier du tireur ; d'un plateau à un plateau de même hauteur
  par-dessus une vallée, la vue passe ; une rampe n'arrête rien. Isolement : les gardes des
  tests `world-cantons217`, `world-canton-gen217` et `world-open217` nomment le nouveau
  lecteur ; procédure 1 refaite (seule l'empreinte de `src/core.js` change).
- **Reste** : tracé adouci des routes qui coupe parfois une falaise près d'une rampe (moins de
  0,2 % des points, O6/O8 ou générateur) ; 45 % seulement des candidats deviennent des lieux ;
  nids de `remarkable217` (O4) ; segments de plus de 512 m refusés par `line` ; coût du premier
  détail du codex (chargement des grilles) à mesurer en jeu (O9) ; règle D-O1 à brancher sur
  les projectiles de la cité (O6b) et sur la vue (O8).

### O3 — Sauvegarde G12 creuse (**livré**, hors jeu ; G12 toujours non créable)

But : qu'une campagne G12 se sauvegarde en ne gardant que ses écarts et se valide sans
régénérer le monde entier. C'est T4.2 à T4.5.

- `src/frontier-state.js` : `normalize` (ligne 9) garde la liste `[1..11]` ; un second
  chemin `normalize12` / `validate12` accepte `generation:12` **seulement** quand un drapeau
  d'ouverture des règles est vrai (`C.WorldOpen217Rules.open`, faux jusqu'à O9) ; positions
  bornées par `limitsForGeneration(12)` = limites d'O1 ; expressions d'identifiants de la
  ligne 13 complétées **pour G12 seulement** par `K.ENTITY_ID` (prélèvements
  `K…:site:n:…`, arbres et rochers `K…:arbre:n` / `K…:roche:n`, ennemis `K…:site:n:e…`) ;
  une sauvegarde G≤11 contenant un `K…` est refusée, et l'inverse. Validation (lignes 20-45) :
  au lieu de `W.create` du monde entier (ligne 29), ne générer que les cantons cités, au plus
  64 (D4) ; au-delà, contrôle de forme seul. Nouveau registre `cantons` (vus), plafonné.
- `src/frontier-world.js:18` : `limitsForGeneration(12)` rend les limites d'O1 (fonction pure,
  sans charger le monde) ; les validateurs qui lisent déjà l'accesseur (T1.3 c :
  `essential-state.js`, `night-gear.js`, `survival-pack.js`, `succession133.js`,
  `husbandry191.js`, `world-evolution-state.js`, `companions-pack.js`) suivent sans retouche.
- `src/field-atlas-state.js` (`cell`, `validate` ligne 20) : cellules indexées par canton
  (`K…:cell:n`) en G12 ; schéma dense inchangé en G1–G11.
- `src/forage193.js:16`, `src/biome-forage193.js:16` : identifiants de cueillette G12 par
  canton.
- `src/core.js` : `C.SAVE_VERSION` 20 → 21 (ligne 1824), migration vide.
- Tests : aller-retour après 60 cantons traversés (taille et plafonds) ; refus croisés ;
  validation qui ne génère que les cantons cités (compteur `streamStats`) ; sauvegardes de
  référence existantes relues à l'identique ; falsifications (procédure 4).
- Innocuité : procédures 1, 3 et 4 ; la montée de version est la seule différence d'une
  sauvegarde G1–G11 écrite après (à vérifier champ par champ).
- Parcours joueur : aucun (test sans interface).
- Ampleur L, risque G1–G11 moyen (validateurs partagés).
- **Fait** : module hors jeu `src/world-save217.js` (le chemin G12 lit les lieux d'O2, que
  `frontier-state.js`, chargé par le jeu, ne doit pas nommer : gardes d'isolement), règles
  `C.WorldSave217Rules` (`src/core.js`, juste après `C.WorldSites217Rules` : `maxCantons` 64,
  `maxSeenCantons` 4 096, autres plafonds repris du registre G1–G11) et drapeau d'ouverture
  `open` (faux) — placé là et non dans `C.WorldOpen217Rules`, dont les valeurs sont figées par
  `tests/world-open217.test.cjs` ; O9 l'ouvrira avec la création — test `tests/world-save217.test.cjs` (8 cas).
  `frontier-state.js` : `normalize` et `validate` délèguent au module **seulement** si sa globale
  est déjà présente et que `opened()` est vrai ; sinon chemin inchangé (`Génération inconnue`).
  Format : registre version 2 aux clés exactes (inconnue ou absente refusée), plus
  `reliefVersion` et `sitesVersion` (règles de génération G12 figées dans la sauvegarde : une
  campagne écrite sous d'autres règles est refusée, base de D-O4), `detailVersion` 13,
  écologie, hydrologie et faune neutres, et le registre `cantons` (cantons vus, canoniques, sans
  doublon). Identifiants G12 seulement : lieux `K…:site:n`, contenants `K…:site:n:z:k`,
  `…:car:k`, `…:out:k`, arbres `K…:arbre:n`, rochers `K…:roche:n` (rang ramené à son morceau
  de 256 m et refusé hors de la grille), occupants `K…:site:n:eN`. Règles de forme nouvelles :
  un lieu repéré et la position en sortie appartiennent à un canton vu ; un étage exige un lieu.
  Validation : cantons cités (lieux, intérieur, prélèvements, occupants, poursuites) triés par
  distance de Tchebychev au joueur ; les 64 premiers sont générés dans un monde O2 **neuf**
  (cache de 89 cantons : aucun généré deux fois) et vérifiés comme la région finie (lieu
  présent, étage, position dans l'étage, prélèvement ≤ contenant, rang d'occupant < menace,
  intégrité ≤ profil, étage de poursuite) ; au-delà, forme seule (D4). Carnet de reconnaissance
  G12 : `cell(x, y)` → `K…:cell:n` (8 × 8 mailles de 128 m par canton), `normalizeAtlas`
  (cellules d'un canton vu ; archives et tournées vides exigées). Validateurs restés sur la
  liste complète convertis (voir O4) : `frontier-state`, `field-atlas-state`, `world-pack131`
  (index de `normalize`), `campaign-water214` (43, 130), `campaign-pack` (44),
  `context-operations160`, `world-evolution-state` → `siteIndex()` ; `essential-state`
  (`targets`) → `sitesByDistance` en monde sans bord seulement (la région finie garde le parcours
  de sa propre liste : un monde recopié par un test garde sinon l'accesseur de l'original) ; chacun avec un repli identique pour les mondes factices.
- **`SAVE_VERSION` reste à 20** : la monter changerait le champ `version` et la clé de stockage
  de toute sauvegarde G1–G11 écrite après (le parcours de la règle 3 ne serait plus identique
  octet pour octet), sans rien protéger : une version antérieure du jeu refuse déjà un registre
  G12 (`Génération inconnue`), et le registre G12 porte ses propres versions de règles. À
  reconsidérer en O9 si l'ouverture ajoute une section de sauvegarde.
- Mesures (graine 17117, 60 cantons traversés plein est, 180 cantons vus, 152 lieux repérés,
  136 prélèvements, 64 occupants) : registre de 9 828 octets ; 58 cantons cités, 58 générés,
  validation en 1,1 s environ ; 90 cantons traversés : 64 vérifiés, le reste de forme seule.
- **Reste** : `limitsForGeneration(12)` de `frontier-world.js` n'est pas encore les limites
  d'O1 (le fichier, chargé par le jeu, ne peut pas lire les cantons sans lever les gardes
  d'isolement) : avec O9, comme le branchement ; `forage193` / `biome-forage193` : aucun
  identifiant de cueillette G12 tant qu'il n'existe pas de cueillette G12 (en G12, la
  cueillette est refusée : écologie 0) ; `field-atlas-state` n'appelle pas encore
  `normalizeAtlas` (O9) ; ancre de sortie bornée à 4 096 unités (carte de 128 m) jusqu'à O5 ;
  les autres sections de sauvegarde (services, hordes, campagne…) ne connaissent pas G12 : leur
  monde vient de `frontier-world.create`, qui refuse 12 (O9) ; au-delà de 64 cantons cités, un
  identifiant inventé dans un canton lointain passe le contrôle de forme (D4, test à l'appui).

### O4 — Lecteurs de la liste complète des lieux → lecteurs de voisinage (**premier lot livré**)

But : qu'aucun module ne parcoure `world.pois` en entier. Les lecteurs relevés en T1.6
(« exigent tous les lieux ») passent par des accesseurs **ajoutés aussi au monde fini**, qui y
rendent exactement le résultat actuel — même méthode que T1.

Accesseurs nouveaux, sur les deux mondes : `sitesIn(rect)` (voisinage rectangulaire),
`nearestSite(x, y, filtre, rayonMax)` (recherche par anneaux de cantons en G12, tri actuel en
G1–G11), `seenSites(ids)` (lieux vus lus par `site(id)`, **dans l'ordre de la liste** en
G1–G11 pour garder les sorties), `siteIndex()` (index par identifiant ; le monde fini garde
le **dernier** doublon comme les `Map` actuelles, cf. T1.6).

| Lecteur | Ligne | Remplacé par |
|---|---|---|
| `src/remarkable217.js` (lieux remarquables et nids de toute la région) | 60, 63 | rang par canton : au plus `perCanton` lieux par canton de `cantonSize` m, calculé sur `sitesIn` du canton de 4 096 m ; en G1–G11, même sélection |
| `src/seed-card217.js` (`nearest`, densité) | 116, 145 | `nearestSite` depuis D-17 ; en G12, la fiche lit aussi `world-local217` (`sheet`, point 11 de `tasks.md`) |
| `src/field-atlas.js`, `src/field-atlas-ui.js`, `src/frontier-ui.js`, `src/world-codex-actions159.js` (lieux vus, listes, biomes connus) | 11, 26, 28 ; 22 ; 19 ; 68, 100 | `seenSites` |
| `src/atlas-render.js` (emprises, parkings, voies d'accès, étiquettes) | 44, 80, 92 | `sitesIn(caméra)` |
| `src/frontage174.js` (index et audit des façades) | 88, 114 | index par canton ; l'audit global reste un outil G1–G11 |
| `src/night-gear.js` (panneaux de six types) | 156 | `sitesIn` autour du joueur, cache par canton |
| `src/essential-state.js`, `src/campaign-pack.js`, `src/chronicles131.js` (plus proche lieu d'un type) | 12 ; 42, 62 ; 45 | `nearestSite` |
| `src/frontier.js` (`revealSites`), `src/world-evolution-state.js` (ensemble des identifiants) | 267 | `site(id)` par identifiant cité |
| `src/frontier-state.js:33`, `src/field-atlas-state.js:20`, `src/world-pack131.js:12`, `src/campaign-water214.js:43,130`, `src/context-operations160.js:32`, `src/outposts217.js:71`, `src/exploration-needs217.js:106`, `src/urban.js:43` (index `Map`) | — | `siteIndex()` en G1–G11 ; en G12, `site(id)` sur les cantons cités (O3) |
| `src/world-pack131.js` (préparations G5–G11, `normalize`) | 16, 71, 107, 108, 138, 168 | inchangé : propre aux activations, sans objet en G12 (O9 les désactive pour G12) |

- Tests : ceux de chaque fichier touché ; test d'équivalence (comme `tests/world-bounds217.test.cjs`)
  sur les mondes G4, G8, G11 de deux graines : sorties identiques, ordre compris ; en G12,
  aucune lecture de `pois`.
- Innocuité : procédures 1 et 3 ; un lot par famille de lecteurs.
- Parcours joueur : atlas ouvert, fiche de graine, lieux remarquables, codex — identiques.
- Ampleur L, risque G1–G11 moyen (ordre de parcours), parallélisable avec tout le reste.

**Premier lot livré** (détail, preuves et réserves : `tasks.md`, section O4) :

- Accesseurs posés sur les deux mondes : `sitesIn`, `seenSites`, `nearestSite`, `siteIndex`, plus
  `sitesByDistance(x, y, filtre, rayonMax)` — liste triée par distance puis identifiant, le tri que
  recopient `campaign-pack.js`, `essential-state.js` et `field-atlas.js` (`nearestSite` ne rend que
  le premier). En G12, rayons et rectangles bornés par `nearMaxRadius` ; `siteIndex()` n'y offre
  que `get` et `has`. `src/core.js` inchangé.
- Convertis (sorties identiques, repli historique pour les mondes factices) : `remarkable217.js`
  (`select` par cantons lus par `sitesIn`), `seed-card217.js` (`sources`), `atlas-render.js` (44,
  80, 92), `field-atlas.js` (11, 26, 28), `field-atlas-ui.js` (22), `frontier-ui.js` (19),
  `world-codex-actions159.js` (68, 100), `campaign-pack.js` (62), `frontier.js` (`revealSites`),
  `exploration-needs217.js` (106), `urban.js` (43), `outposts217.js` (`book`).
- **Reportés** : les index de validateurs (`frontier-state.js:33`, `field-atlas-state.js:20`,
  `world-pack131.js:12`, `campaign-water214.js`, `campaign-pack.js:42`,
  `context-operations160.js:32`, `world-evolution-state.js`) et `essential-state.js:12` (appelé
  par sa validation) passent avec O3, qui refait les falsifications (règle 4) ;
  **convertis avec O3** (voir O3) ; restent `chronicles131.js:45` (tri global par hachage), `night-gear.js:156` (cache par canton, O9),
  `frontage174.js` (O2).
- Lieux remarquables en G12 : la sélection finie est une chaîne (espacement contre tous les lieux
  déjà retenus, plafond global) que le monde fini garde à l'identique ; G12 ne peut pas la
  recalculer localement et prendra une règle locale propre aux campagnes G12 (espacement contre
  les candidats bruts des huit cantons de 4 096 m voisins), à trancher avec O2. D'ici là,
  `select` rend une liste vide en G12, comme avant.

### O5 — Carte de la cité par campagne (128 partout) (**livré**, sans effet en jeu)

But : que la taille de la carte locale soit une donnée de la campagne, portée par la
sauvegarde, sans qu'aucune campagne ne change de taille. Points 1 et 10 de `tasks.md`, et le
tableau « Restent en clair » de T5.B3.

- `src/core.js` : `grid`, `world`, `index` (255-257), `wallLine` (318), `findFriendlyPath`
  (388) prennent la carte en argument, la carte par défaut en repli ; voirie
  (`InfrastructureRules.worldTiles`, 1447, 1559) dérivée de la carte.
- `src/game.js` : `WorldMap` (187) reçoit `tiles` ; `Zombie` (96) reçoit le centre ; voirie
  (3983, 4094) ; `startNew` (725) passe `tiles` = 128.
- Validateurs du domaine « local » en clair : `succession133.js` 28, 32 ; `essential-state.js`
  8 ; `night-gear.js` 34 ; `survival-pack.js` 15, 57 ; `frontier-state.js` 8, 11 ;
  `arsenal134.js` 15 ; `fortification-pack.js` 48 ; `exploration-pack.js` 17 ;
  `vertical-citadel175-state.js` 65, 69 ; `vertical-network179.js` 84 ;
  `vertical-population181.js` 57 ; `core.js` 840, 929, 1768, 1786 ; `save.js` 20-34, 92, 103 :
  lisent la carte de la sauvegarde validée (`data.localTiles`, absent = 128).
- Présentation : `exploration-125.js:1939`, `barricades134.js:39` (`createFeaturePlan(seed,
  g.local.size)`), `exploration-needs217.js:69`, `horde-horizon217.js:33`,
  `seed-card217.js:126`, `frontier.js` 49, 276, `fieldcraft.js:81`, `atlas-projection.js:16`,
  `recon-ui.js` 14-71 (centre lu sur la carte).
- Sauvegarde : champ `localTiles` écrit seulement s'il diffère de 128 ; absent = 128.
- Tests : `tests/local-bounds217.test.cjs` étendu (carte de 192 cases construite par un test,
  prédicats, flux, sauvegarde) ; tests de chaque fichier.
- Innocuité : procédure 3 **octet pour octet** (aucun champ ajouté à 128) ; procédure 4.
- Parcours joueur : partie standard 17117, une vague, sauvegarde, reprise — identique.
- Ampleur L, risque G1–G11 haut (35 fichiers) : par lots, chacun avec la procédure 3.
- **Livré** (sans effet en jeu ; détail, preuves et réserves : `tasks.md`, section O5) :
  - Règles `C.LocalMap217Rules` (`defaultTiles` 128, `generationTiles` {12 : 192}) ; accesseurs
    `C.localMapOf217(source)` (carte d'une sauvegarde ou carte passée telle quelle, une instance
    par taille) et `C.campaignLocal217(data)` (carte des données validées ; sans données, celle de
    la partie en cours ; sinon la carte par défaut). `grid`, `index`, `wallLine` prennent la carte
    en dernier argument facultatif ; `findFriendlyPath` a pour défaut `LOCAL_MAP217.tiles`.
  - Cité : `WorldMap(seed, géométrie, carte)` (carte gardée hors des propriétés du monde),
    `restoreSave` construit le monde sur `C.localMapOf217(data)`, `serialize` n'écrit
    `localTiles` que s'il diffère de 128, `Zombie` reçoit la carte (orientation vers son centre),
    `grid(…)` des méthodes de `Game` et chemins amis lisent `this.local`.
  - Sauvegarde : `localTiles` absent = 128 ; toute autre valeur est refusée sauf celle que
    `generationTiles` associe à la génération déclarée (192 pour G12, toujours refusée par le
    registre régional) ; 128 écrit en clair est refusé (jamais produit).
  - Voirie (`Infrastructure` : clé, cellules, `at`, `line`, `quote`, `findRoute` plafonné par la
    carte, `Engine(raw, carte)`), territoires (convois, dépôt), expéditions (véhicule), décor
    (`Fieldcraft`), sections (`squads.js`), tous les validateurs « local » listés plus haut,
    vue FPS (siège et sol de la citadelle), plan des abords, présentation (centre `2048` en clair,
    `128,128` des recherches de chemin, `4096` de la carte de reconnaissance) : lus sur la carte
    de la campagne, repli local identique.
  - Fumée hors jeu à 192 m (`tests/local-bounds217.test.cjs`, 4 cas de plus) : carte, champ de
    flux, voirie, territoires et sept validateurs acceptent à 192 une position que la carte par
    défaut refuse ; la partie en cours ne bouge pas.
  - **Coût du champ de flux** (préparation de D-O5, médiane de 60 reconstructions, machine
    chargée) : carte nue 5,7 ms à 128 cases, 15,7 ms à 192 (× 2,7) ; avec les enveloppes de
    `movementCost` de la partie (décor métrique, obstacles), 72 ms à 128, 170 ms à 192 (× 2,4).
    Le coût vient surtout des enveloppes (× 12 sur la carte nue) : c'est elles qu'O6b devra
    optimiser (coût par case mis en cache, reconstruction incrémentale), avant la taille.

### O6 — Carte de la cité de 192 m née de `world-local217` (G12 non créable) (**O6a livré**, hors jeu)

Points 2, 3, 4 et 7 de `tasks.md`. Atteinte seulement par un harnais de test qui construit
une partie à partir de `L.describe(graine)`.

**O6a — Terrain et gisements.** `src/game.js` `WorldMap` (187) : constructeur qui reçoit
la description (`levels`, `passes`, `water`, `roads`, `kinds`) ; `generateNodes` (261) et
`DeadwallWorldContent.generate` non appelés en G12 : nœuds tirés de `deposits`
(`K0_0:gite:n` → `ResourceNode`) ; décor métrique replacé (`packMetricScenery202`, parcelles
hors falaise, eau, rampe) ; `placement` (229) refuse une emprise à cheval sur deux paliers,
sur l'eau ou sur une rampe (sauf porte et mur) avec un message qui le dit ; `movementCost`
(255) ajoute rampe et gué (`C.WorldLocal217Rules.costs`) ; `nearestNode` (242) inchangé.
Ampleur L.

- **Livré O6a** (sans effet en jeu ; détail, mesures et réserves : `tasks.md`, section O6a) :
  - `WorldMap(graine, géométrie, carte, terrain)` : le 4e argument, la description
    `DeadwallWorldLocal217.describe(graine)` (génération 12, cadre égal à la carte, 1 m par case),
    prend un chemin de construction séparé (`buildTerrain217`) : ni `generateNodes`, ni
    `DeadwallWorldContent.generate` ; les 192 gisements candidats deviennent des `ResourceNode`
    (`depositId` `K0_0:gite:n`, mètres × 32, variante par hachage). Terrain gardé dans une table
    faible (`terrain217`, copie des tableaux), enveloppes non énumérables propres à ce monde
    (`solidForFriendly` : eau profonde ; `movementCost` : gué, `C.CityTerrain217Rules` ; `placement` : refus à cheval sur
    deux paliers, sur l'eau, sur une rampe sauf mur et porte). Le prototype des cartes plates
    garde son comportement : aucun champ, aucune clé, aucun appel de plus en G1–G11.
  - Arêtes de falaise (avance sur O6b) : `canStep` (voisine ou diagonale), `stepClear217`
    (segment), lus par `moveFriendly`, `moveUnitToward` (ligne directe et `findFriendlyPath`, qui
    reçoit un prédicat d'arête en 7e argument), `hostilePositionClear` (depuis la position de
    l'infecté : déplacements ordinaires, charge, repoussée, séparation, couloir du traqueur),
    `FlowField.rebuild` / `direction`. D-O1 : `sightObstruction217` / `sightClear217` lus par
    `hasLineOfSight` et `hostileLineClear` ; la fraction d'obstacle est prête pour les
    projectiles (O6b).
  - D-O5 : champ de flux du terrain avec coût de case lu une fois par reconstruction (au lieu
    d'une fois par voisin) ; à 192 m, enveloppes de la partie comprises, 14 à 28 ms contre
    43 à 47 ms pour la partie actuelle à 128 et 115 à 121 ms pour une carte plate de 192 sans
    cache. Optimisation propre au chemin G12 : le champ des cartes actuelles n'est pas touché
    (et le chemin du terrain, sur un terrain plat, rend le même champ octet pour octet).
  - Restent pour O6b : décor métrique replacé, projectiles (`updateProjectiles`), contrôles
    directs des ouvriers (1640, 1648, 1692), voirie (`findRoute` sans prédicat d'arête),
    repli d'un infecté sur une case hors d'atteinte, récolte par les rampes en partie.

**O6b — Arêtes de falaise.** Nouvelle méthode `WorldMap#canStep(gx, gy, nx, ny)` lue par :
`FlowField.rebuild` (283-299 : voisins développés seulement si `canStep`, case hors d'atteinte
`0x3fffffff` avec repli de l'infecté), `friendlyPositionClear` (1304), `moveFriendly`
(1309-1312), `hostileBuildingAt` / `hostilePositionClear` (1813-1821), lancers de rayon par
pas de `TILE/3` (1322, 1417, 1634, 1824, 1872, 1890), `updateProjectiles` (1970),
`findFriendlyPath` (`core.js:388`, prédicat d'arête en plus de `blocked`). Projectile :
décision D-O1. Ampleur L, risque G12 haut (performances du flux sur 36 864 cases au lieu de
16 384 : mesurer).

- Tests : `tests/open-city217.test.cjs` — partie construite sur trois graines (dont 17117 :
  couloir est-ouest) ; aucun pas à travers une falaise sur 10 000 pas aléatoires d'amis et
  d'infectés ; champ de flux contre `L.pathToCentre` ; gisements récoltés par les ouvriers
  par les rampes ; construction refusée à cheval sur deux paliers.
- Innocuité : procédure 3 (le chemin G12 n'est pas pris : `canStep` d'une carte plate rend
  toujours vrai, à prouver par le parcours octet pour octet).
- Parcours joueur (harnais) : poser un mur, récolter un gisement sur l'autre palier.

### O7 — Siège adossé : fronts, enceintes et équilibrage à deux côtés

Points 5 et 6 de `tasks.md`, et la question (f).

- Fronts et apparitions : `prepareWave` (`game.js:1716-1717`) tire les fronts parmi les côtés
  non `clos` de `L.describe(…).sides` ; `spawnZombie` (1780-1782) fait apparaître dans les
  `entries` du côté au lieu de `margin … size - margin` ; annonce (2252) et
  `siege-readout.js` nomment le passage (« par la rampe du nord »).
- Équilibrage (f) — `core.js` `wavePlan` (437), `CARDINAL_FRONTS` (1214), formes d'assaut
  (1326) : quand un plan demande plus de fronts que la cité n'a de côtés ouverts, il se
  **replie** : mêmes effectifs, répartis sur les côtés ouverts au prorata de leur largeur
  (`sides.<côté>.width`), jamais plus de points de vie. Une cité à un seul front reçoit en
  plus une **contrainte de passage** : la file d'apparition d'un passage (rampe de 12 m) est
  plafonnée par seconde, le reste attend en masse au pied (pression des cadavres et de la
  masse conservée, vague plus longue). Règles `C.OpenSiege217Rules` (`foldShares`,
  `passRate`, `minFronts`) ; paragraphe à écrire dans `docs/BALANCING.md` par le mainteneur.
  Décision D-O2 sur les valeurs, à mesurer : temps de vague, cadavres par mètre de front,
  pertes de murs à l'âge 2, 4 et 6 sur 12 graines (4 ouvertes, 4 à deux côtés, 4 à un passage).
- Enceintes : `tactics.js:47` `analyzeEnclosure` compte une arête de falaise comme un mur
  indestructible ; une rampe se barre comme une porte (mur posé sur ses 12 cases) ;
  `breach217.js` ne s'applique jamais à une falaise ; `fallback-order.js:55`,
  `districts.js:31`, `linecare.js` 19-20 et `earthworks217.js:11` (fossés interdits sur une
  rampe) lisent la même grille d'arêtes.
- `horde-horizon217.js` : la masse lointaine se dessine seulement sur les côtés ouverts.
- Tests : fronts jamais tirés sur un côté clos (1 000 vagues, 50 graines) ; repli des effectifs
  (somme conservée) ; enceinte adossée reconnue ; rampe barrée = front fermé ; `breach217`
  sans effet sur une falaise ; mesures d'équilibrage consignées.
- Innocuité : procédure 3 ; en G1–G11, quatre côtés ouverts, donc le repli est l'identité (à
  prouver sur les plans des vagues 1 à 60 des trois difficultés).
- Parcours joueur (harnais) : vague 5 sur la graine 17117 — deux fronts, est et ouest.
- Ampleur L, risque G12 haut (équilibrage), parallélisable avec O8.

### O8 — Rendu des falaises et de l'eau, puis vue FPS

Point 8 et point 9 de `tasks.md`. Présentation seule : lit la grille, ne crée ni stock, ni
dégât, ni tirage, ni horloge.

**O8a — 2D / 2,5D.** `game.js` `drawGround` (2380, 2395) et `art.js` `drawGround` (520) :
teinte par palier, face de falaise dessinée du côté bas (hauteur projetée comme les étages
de `CityGeometry202.presentation`), rampes lisibles, eau (lit de `hydrology165`), routes
d'après `roads` au lieu de la croix fixe de `exploration-125.js` ; tri de profondeur des
acteurs derrière une falaise ; minicarte (`renderMinimap`, 2594) ; adoucissement de
présentation des bords qui ne touche pas la collision ; `visibility146.js` : une falaise
coupe la vue vers le bas (décision D-O1 liée). Ampleur L.

**O8b — Vue FPS.** `vertical-citadel175.js:360`, `vertical-citadel175-render.js:164`
(sol à `C.WORLD_SIZE`), `vertical-network179.js` : champ de hauteur par palier (hauteur d'un
cran en mètres : D-O3), parois verticales, plans inclinés des rampes, caméra bornée par
`canStep`, `siege.enemyPose` décalée du palier. Ampleur L.

- Tests : peintres sans tirage ni écriture (test statique + sonde : `streamStats` et état
  inchangés après 600 images) ; captures de trois graines ; en G1–G11, mêmes appels de
  dessin (enregistreur de contexte factice : séquence identique).
- Innocuité : procédure 3 et comparaison d'images de la partie 17117 avant/après.
- Parcours joueur (harnais) : voir la falaise de 17117, ses deux rampes, la rivière d'une
  graine à eau.

### O9 — Ouverture « expérimental » (premier effet en jeu)

Conditions : O2, O3, O4, O5, O6, O7, O8a livrés ; O8b livré **ou** vue FPS indisponible en
G12 avec un message (décision D-O3).

- Option de menu (e) : dans `index.html`, une ligne `seed-controls` à côté de
  `worldLandscape189` (ligne 139) — « MONDE » : *Région finie (défaut)* / *Sans bord —
  expérimental* ; texte d'aide : génération susceptible de changer, campagne non convertible.
  `game.js:691` passe la valeur ; `startNew` (725) la valide comme `landscape189` (727) ;
  `world-pack131.js:260` `startVersions` écrit `generation = 12` seulement si l'option est
  choisie ; l'enveloppe de `startNew` (241-249) place le joueur au bord du cadre de 192 m au
  lieu de `Geography135.home` ; les activations G8→G11 (54-186) ne s'offrent pas en G12.
- Fiche (e) : `seed-card217.js` lit `L.describe(graine).sheet` et `sides` en G12 (« Adossée à
  une falaise à l'est… ») et affiche la mention « expérimental » ; l'aperçu de graine reste
  sans tirage de jeu.
- Branchement : `frontier-world.create` (ligne 22) aiguille `12` vers `world-open217.create` ;
  `frontier-state.normalize` accepte 12 (drapeau `open` vrai) ; `frontier.js` charge un canton
  par image depuis `K.ring` (T5.2) ; `world-evolution.js` 8-9 (migrations et épaves) tire par
  `pickRoad`, 83 inchangé (demi-tour au bord : jamais vrai en G12) ;
  `frontier-routing.js:50` `route` délègue à `world.route` quand `world.unbounded`.
- Module d'extension `openworld217` (`g.expansions.register`, modèle `breach217.js`) : marque
  la campagne « expérimental », `reset()` = campagne neuve **sur l'option seulement**,
  `validate(undefined)` inactif ; liste blanche de `src/expansion-kit.js` (avant
  `'balance217','breach217']`), `ORDER`, `GROUPS`, `API_NAMES`, `LABELS` de
  `src/expansion-ui.js` (13-16).
- Scripts publics : `world-cantons217.js`, `world-canton-gen217.js`, `world-local217.js`,
  `world-open217.js` et le module d'extension dans `index.html` (ordre : cœur, cantons,
  générateur, carte locale, monde ouvert, avant `frontier-world.js`), `sw.js` `ASSETS`,
  `tests/audit183-manifest.test.cjs` (compteurs + exclusions). Les gardes d'isolement des
  trois tests deviennent « chargé sans effet en G1–G11 » (règle 6).
- Tests : harnais navigateur G12 (T5.6) — 20 km en voiture plein est, sauvegarde, reprise,
  retour, empreintes de cantons égales aux deux passages, image la plus lente à la couture ;
  `tests/openworld217.test.cjs` (option, ancienne campagne inactive, reprise) ; tous les tests
  `browser-*` conservés pour G≤11.
- Innocuité : procédures 1, 3, 4 ; une partie lancée **sans** l'option est identique octet
  pour octet à la base ; `dist/` ne diffère que des nouveaux fichiers.
- Parcours joueur : menu → *Sans bord — expérimental* → fiche (côtés fermés, passages) →
  départ dans la cité de 192 m adossée → vague à deux fronts → sortie en voiture → retour.
- Ampleur L, risque G1–G11 moyen (premier chargement des modules), G12 haut.

### O10 — Atlas et minicarte sans étendue ; rayon d'action (T6)

- `atlas-projection.js` 25-30 (caméra bornée par une étendue scalaire, zoom minimal),
  `atlas-view.js` 21-22 (`fit`, `city`), `atlas-render.js` 34, 67, 73-74 (fond, grille,
  cellules sur `0 … size`) : cadrage sur les cantons vus (`cantons` d'O3), brouillard au-delà,
  rayon d'action du véhicule (carburant restant × `fuelPerMetre`).
- Tests `atlas-*` ; sonde : ouvrir l'atlas ne change pas `streamStats` (E9).
- Parcours joueur 4 de la spec. Ampleur M.

Puis T7 (défaut pour toute nouvelle campagne, gradient de distance) : hors de ce plan.

## 3. Décisions de l'utilisateur (16 novembre 2026)

- **D-O1 — tranché** : une falaise **arrête la vue et les tirs d'en bas**, mais **pas les tirs
  d'en haut** : depuis le haut d'une falaise on voit et on touche ce qui est en contrebas ; d'en bas
  on ne voit ni ne touche ce qui est au-dessus. Le haut d'une falaise devient une position à tenir.
  S'applique à O6b (collisions des projectiles) et O8a/O8b (vue).
- **D-O2 — tranché sur le principe** : quand la cité n'a que deux côtés ouverts, la vague garde
  **le même effectif, concentré sur les côtés ouverts**. Aucune réduction pour les côtés fermés.
  Les valeurs du plafond de passage par front restent à mesurer en O7.
- **D-O3 — tranché** : la vue à la première personne est **disponible dès l'ouverture** de
  l'option expérimentale. O8b passe donc sur le chemin critique de O9 ; la hauteur d'un cran reste
  à fixer en O8b.
- **D-O4 — ouvert** : gel des règles de génération à l'ouverture. Proposé : gel à O9, version de
  détail propre à G12 pour les corrections.
- **D-O5 — tranché** : la carte de la cité **reste à 192 m** ; si le champ de flux coûte trop, on
  l'**optimise** plutôt que de revenir à 128 m, quitte à retarder l'ouverture. O6b doit donc
  mesurer et, si nécessaire, inclure l'optimisation.
