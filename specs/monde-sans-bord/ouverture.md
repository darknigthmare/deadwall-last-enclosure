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
     ├─ O7 siège adossé : fronts, enceintes (livré)       ∥     │
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
| O6 | Carte de 192 m née de `world-local217` : arêtes de falaise, flux, collisions, gisements (**livré** : O6a, O6b) | Aucun (G12 non créable) | XL → O6a, O6b | moyen / haut | O3, O4 |
| O7 | Siège adossé : fronts par côté ouvert, enceintes sur falaise, équilibrage à deux côtés (**livré**) | Aucun (G12 non créable) | L | moyen / haut | O8 |
| O8 | Rendu des falaises et de l'eau en 2D/2,5D (O8a, **livré**), vue FPS (O8b, **livré**) | Aucun | L + L | bas / moyen | O7 |
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

### O6 — Carte de la cité de 192 m née de `world-local217` (G12 non créable) (**livré** : O6a, O6b, O6c ; hors jeu)

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

**O6b — Arêtes de falaise (livré).** Nouvelle méthode `WorldMap#canStep(gx, gy, nx, ny)` lue par :
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
- **Livré O6b** (sans effet en jeu ; détail, mesures et réserves : `tasks.md`, section O6b) :
  - Projectiles (D-O1) : palier du tireur capté au tir (`Game#shot217`, joueur et tirs amis), relu par
    `updateProjectiles`, qui ajoute la fraction de `sightObstruction217` aux obstacles ; une bouche de
    canon passée au-dessus d'une falaise montante fait partir le tir du tireur (`projectileOrigin`). D'en
    bas, le tir s'arrête au pied de la falaise ; d'en haut, il touche en contrebas.
  - Contrôles directs des ouvriers : `workerCanWorkAt`, `workerBuildExit`, `workerCleanupTarget` (jeu de
    base) et, surtout, leurs remplaçants de `fieldcraft.js` (`moveFriendly`, `workFrom`, donc les points de
    service), qui ignoraient les arêtes en partie complète : aucun pas, geste de travail ni point d'approche
    par-dessus une falaise.
  - Voirie : `Infrastructure.findRoute` reçoit un prédicat d'arête (10e argument) ; `findPath` de la partie
    prend par défaut celui du terrain (véhicules, convois, reconnaissance) ; `moveUnitToward` passe par la
    voirie avec ce prédicat sur un terrain (plafond `C.OpenCity217Rules.pathMaxExpanded` 16 384).
  - Repli d'un infecté posé sur une case hors d'atteinte : `FlowField#fallback217` (case atteinte et libre
    la plus proche, sans tirage), appelé par `updateZombies` (`zombieFallback217`) ; anneau
    `C.OpenCity217Rules.fallbackRing` 192 (une poche de 17117 est à 74 cases de tout accès).
  - Décor métrique : `WorldMap#footprintClear217` (un palier, à sec, hors rampe) lu par la parcelle de
    `packMetricScenery202` (`createMetricSceneryPlacement202`), exporté pour le test.
  - Récolte par les rampes : un ouvrier de la partie (`updateUnits`) va au gisement de l'autre palier par
    la rampe et rapporte au centre, sans un pas à travers la falaise (42, 46).
  - D-O5 : partie de terrain (centre posé, enveloppes du jeu de base) 2 à 5 ms par reconstruction à 192 m
    (Node et Chromium) ; l'optimisation O6a suffit, aucune autre n'est nécessaire à ce stade.
  - Innocuité : parcours déterministe de 240 s (base `5b0d8ab` contre l'arbre de travail) identique octet
    pour octet, reprises croisées identiques ; parcours « empoisonné » dans le test (chaque chemin du
    terrain jette s'il est appelé sur une carte plate) ; mondes G1–G11 inchangés.

**O6c — Dettes de falaise soldées avant O9 (livré, hors jeu).** Réserves d'O6b et d'O8b sur le tir, la pose et
`fieldcraft` ; détail, mesures et réserves : `tasks.md`, section O6c.

- Choix de cible 2D (D-O1) : `Game#fireTarget217(x, y, portée, sx, sy)` garde le choix existant (veille
  nocturne, arcs de tir de `defense-pack131`, plus proche) et, sur un terrain seulement, retire de
  `nearbyZombies` le temps de l'appel tout infecté que `sightClear217` cache depuis le palier de la bouche ;
  lu par la tourelle, le fusilier, la visée tactile du commandant et le caisson local (`fortification-pack`).
  Plus aucune munition dépensée sur un tir que la falaise arrête.
- Affûts de la citadelle (vue FPS) : `sightQuery` (cibles automatiques, gardes de palier, lumière) applique
  D-O1 depuis le palier de la bouche, comme le peintre O8b ; `raycast` s'arrête sur l'arête qu'il monte
  (`type` `terrain217`, un peu avant l'arête) — tir possédé, tir automatique, tir du commandant sur un palier,
  gardes de `vertical-population181`, éclats, et projectiles 2D contre les géants (palier capté au tir).
- Pose : `placement217` refuse un support de citadelle (`vertical175`) dont l'entrée intérieure tombe hors du
  palier de son emprise (« Entrée de la citadelle hors du palier de l’emprise : la falaise ou l’eau couperait
  l’escalier. ») ; la garde de l'escalier d'O8b reste en place.
- `fieldcraft` sur un terrain : `setup` garde l'eau profonde de l'enveloppe du monde dans `solidForFriendly` ;
  `positionFree` (donc `friendlyPositionClear`) refuse l'eau profonde aux points de la garde de base ; `pack`
  ne replace un gisement que sur un seul palier, à sec, hors rampe, relié sans falaise à sa place ;
  `recoverActor` ne dégage un acteur que par un segment sans falaise ni eau profonde.
- Repli d'un infecté hors d'atteinte : l'enveloppe `updateZombies` de `fieldcraft` ne défait plus un repli
  du pas en cours (compteur `fallback217`) ; posé contre un décor, l'infecté en est dégagé (`recoverActor`).
- Innocuité : procédure 3 (base `a94915f`) identique octet pour octet ; mondes G1–G11 inchangés.

### O7 — Siège adossé : fronts, enceintes et équilibrage à deux côtés (**livré**, hors jeu)

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
- **Livré O7** (sans effet en jeu ; détail, mesures et réserves : `tasks.md`, section O7) :
  - Règles `C.OpenSiege217Rules` (`src/core.js`, après `C.OpenCity217Rules`) : `foldShares` {`basis` 'width',
    `minShare` 0,1}, `passRate` {`perMetre` 0,25, `min` 1}, `minFronts` 1 ; lecture pure `C.OpenSiege217` (`open`,
    `shares`, `fold`, `quotas`, `pick`, `rate`, `gap`, `label`, `phrase`), sans tirage propre.
  - Fronts : `prepareWave` garde son tirage sur une carte plate ; sur un terrain (`world.terrain217.sides`, copie des
    côtés de la description), `prepareFronts217` tire `wavePlan.fronts` côtés parmi les non clos avec le même mélange
    du jeu (`random.shuffle`), replie un plan qui en demande plus (même effectif, parts au prorata de la largeur) et met
    le côté le plus large en tête (les échelons de nuit, vague 4 et plus, font entrer chaque tiers par un groupe pris
    dans cet ordre). `spawnZombie217` : front de la prochaine arrivée par retard sur sa part (sans tirage), dans le
    groupe d'échelon courant ; case tirée dans les `entries` du côté, pondérées par leur largeur ; jamais un côté clos.
  - Contrainte de passage (cité à un seul front) : `spawnGap217` = max(intervalle du plan, 1 / (0,25 × largeur)) — une
    rampe de 12 m laisse entrer 3 infectés par seconde, le reste attend dans la file (masse au pied, vague plus
    longue). Aucun point de vie de plus : mêmes `Zombie`, même `wavePlan`.
  - Annonce : « Migration détectée — N contacts estimés, par la rampe du nord. » ; renseignement d'alerte « Approche
    par … » ; `siege-readout.js` : ligne `siegeReadoutFronts` créée au premier terrain (côtés à tenir et clos au
    calme ; passage, largeur, repli et plafond d'entrée pendant l'alerte et l'assaut), jamais sur une carte plate.
  - Enceintes : `T.terrainGrid217(monde)` (pas `canStep`, départ des cases à sec du bord) lu par `analyzeEnclosure`
    (`grid`, grille jusqu'à 192 cases), `getEnclosureStatus`, `fallback-order` (`innerZone`), `districts` (`survey`,
    aussi pour `factions217`), `linecare` (`traceAccess`). Arête de falaise et eau profonde = mur indestructible ; une
    rampe se barre d'un mur ou d'une porte posés sur ses cases (porte ouverte = front ouvert). `breach217` exclut
    l'obstacle `terrain217` des ouvrages ; `earthworks217` refuse un fossé sur une rampe.
  - `horde-horizon217.js` : fronts filtrés sur les côtés non clos (repli « nord » remplacé par le premier côté ouvert
    sur un terrain), silhouettes et aplat limités aux tronçons d'entrée du côté.
  - Mesures (12 graines, harnais `scripts/measure-open-siege217.cjs`, **27 relevés sur 39**, les plus coûteux manquent) :
    voir `tasks.md`, O7.7. Aucune graine « à un
    passage » n'existe sur 3 000 graines de la carte locale version 2 : catégorie remplacée par « un seul côté »
    (ouvert, 32 à 96 m) et une variante synthétique à rampe de 12 m.
  - Innocuité : parcours déterministe de 240 s (base `8d7ea21` contre l'arbre de travail) identique octet pour
    octet ; parcours « empoisonné » dans le test ; repli identité prouvé sur les plans des vagues 1 à 60 des trois
    difficultés ; mondes G1–G11 des huit graines inchangés.
- **Livré O7 (suite), décision du 22 novembre 2026** (sans effet en jeu ; détail, mesures et réserves : `tasks.md`,
  section « O7 (suite) ») : le plafond de passage s'applique à **toute cité à un seul côté non clos, quelle que soit sa
  largeur** — `passRate.max` 1,5 arrivée par seconde au plus (`C.OpenSiege217.rate` = max(1, min(1,5 ; 0,25 × largeur))) ;
  une cité à plusieurs côtés dont la vague n'en prend qu'un garde le seul débit par mètre. La Meneuse rassemblée et son
  escorte encore debout **entrent dans ce même débit** : à l'assaut, la file attend une place par infecté déjà sur la
  carte (`C.OpenSiege217.lead`, appliqué par `abominations217`). Même effectif total, mêmes points de vie, vague plus
  longue. Mesures (39 relevés d'O7 complets, harnais corrigé : la relève du Commandant figeait la partie) : une cité à un
  seul côté de 32 à 64 m tient 164 à 176 s à l'âge 4 et 147 à 156 s à l'âge 6, contre 107 à 137 s et 73 à 88 s sur quatre
  fronts ; aucune chute à l'âge 2. Valeur 2 par seconde écartée (chute à l'âge 2 sur 714).

### O8 — Rendu des falaises et de l'eau, puis vue FPS (**O8a et O8b livrés**, hors jeu)

Point 8 et point 9 de `tasks.md`. Présentation seule : lit la grille, ne crée ni stock, ni
dégât, ni tirage, ni horloge.

**O8a — 2D / 2,5D.** `game.js` `drawGround` (2380, 2395) et `art.js` `drawGround` (520) :
teinte par palier, face de falaise dessinée du côté bas (hauteur projetée comme les étages
de `CityGeometry202.presentation`), rampes lisibles, eau (lit de `hydrology165`), routes
d'après `roads` au lieu de la croix fixe de `exploration-125.js` ; tri de profondeur des
acteurs derrière une falaise ; minicarte (`renderMinimap`, 2594) ; adoucissement de
présentation des bords qui ne touche pas la collision ; `visibility146.js` : une falaise
coupe la vue vers le bas (décision D-O1 liée). Ampleur L.

- **Livré O8a** (présentation seule, hors jeu ; détail, mesures et réserves : `tasks.md`, section O8a) :
  - Module `src/terrain-art217.js` (`DeadwallTerrainArt217`), absent d'`index.html`, de `sw.js` et du
    build : il ne lit que `world.terrain217` et garde ses données de peinture (traits de falaise,
    rampes, couleurs des cases, image d'un pixel par case) dans une table faible par terrain. Ni tirage,
    ni horloge, ni écriture dans la partie ou le monde.
  - Sol : teinte par palier (contrebas sombre et humide, plateaux plus clairs), grain par hachage de
    case ; image d'un pixel par case agrandie avec lissage (bords de palier, rives et routes adoucis,
    la collision reste à la case). Eau d'après la grille (mer, lac, rivière, ruisseau) avec son **lit** :
    berge de la largeur `bankWidth` de `Hydrology165Rules.kinds`, bornée à 4 cases. Routes d'après
    `roads` (trois classes, pont sur l'eau) au lieu de la croix fixe : la croix, la cour, le cadre de
    carte et le plan d'`exploration-125.js` (routes, stations, cours, minicarte) ne sont pas peints sur
    un monde de terrain ; un fondu de 6 m remplace le cadre du bord.
  - Falaises : face visible (palier haut au nord) dessinée **du côté bas**, sous l'arête, sur
    `cliffMetres` 4 × 16 unités par mètre (`CityGeometry202.presentation.projectedHeightUnitsPerMetre`)
    par cran, extrémités biseautées, strates et ombre au pied ; arêtes est-ouest en ombre latérale ;
    arête arrière (palier haut au sud) : le rebord du plateau masque le contrebas sur la même hauteur
    projetée et entre dans la file de profondeur (`kind` 8, profondeur = l'arête) — un acteur du
    contrebas juste derrière est peint avant (masqué), un acteur du plateau après.
  - Rampes : composantes de cases de rampe, sens de la pente par les arêtes franchies, ombrage du bas
    vers le haut, trois marches par case, chevrons vers le haut.
  - Minicarte : image du terrain, traits de falaise, rampes ; plus de grille fixe ni de cour.
  - `visibility146.js` (D-O1) : un rayon de vue local qui monte une falaise est coupé avant tout autre
    calcul, y compris le chemin en hauteur de la citadelle (géants, bouches de tir) qui ne passait pas
    par `hostileLineClear`.
  - Points d'appel gardés par `world.terrain217` : `game.js` `drawGround`, `depthEntries`,
    `renderMinimap` ; `exploration-125.js` (`inHome`, minicarte). En G1–G11, 299 751 appels de dessin
    enregistrés (16 images, vague 1 jouée 60 s, minicarte comprise) identiques à la base `5b0d8ab`,
    sauvegarde identique.
  - Graines de capture : 17117 (couloir est-ouest, falaises au nord et au sud, **aucune rampe** dans la
    version 2 de la carte locale), 0 (falaise et deux rampes de col), 46 (lac, rivière, six rampes).
    Harnais : `scripts/browser-terrain-art217.mjs`.

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
- **Livré O8b** (présentation seule, hors jeu ; détail, mesures et réserves : `tasks.md`, section O8b) :
  - Hauteur jouée d'un cran (D-O3) : **4 m**, `C.TerrainRelief217Rules.stepMetres` — un étage de support
    (`VerticalCitadel175.structureHeight`), plus du double de l'œil (1,65 m) : d'en bas, ni l'œil ni une
    bouche d'arme au sol ne dépassent le rebord (D-O1) ; rampe de 12 m à 18°. Égale à la hauteur peinte
    d'O8a (`TerrainArt217Rules.cliffMetres` 4) : la peinture 2D n'a pas changé.
  - Module `src/terrain-fps217.js` (`DeadwallTerrainFPS217`), absent d'`index.html`, de `sw.js` et du
    build : champ de hauteur (palier × 4 m, rampes en plan incliné du palier bas au palier haut le long de
    leur axe, eau abaissée de 0,45 m) et maillage dérivés une fois par terrain (table faible) : sol en blocs
    de 4 × 4 cases, parois verticales sur toute arête entre deux hauteurs (falaises avec strates d'un
    mètre, flancs de rampe, rives), jupe au bord de la carte ; 89 000 à 103 000 sommets (17117, 0, 46).
  - Peintre FPS (`vertical-citadel175-render.js`) : sur un monde de terrain seulement, le sol plat est
    remplacé par ce maillage (tampon statique alloué au premier tableau, envoyé une fois par terrain), et
    l'œil, les boîtes de la géométrie partagée (bâtiments, dalles, garde-corps, passerelles), les talus de
    cadavres, infectés, géants, équipe, caisses et gisements sont levés de leur palier. La simulation garde
    ses hauteurs relatives au sol local (`siege.enemyPose`, `population.pose`, `muzzle`, `sightQuery`,
    `raycast` inchangés) : la pose d'un infecté est décalée du palier dans la peinture seulement, sans quoi
    `canMelee` et `hostileLineClear` changeraient de chemin pour tout infecté au sol d'un plateau.
  - D-O1 dans la vue : depuis le palier du support, un infecté ou un géant au-dessus d'une falaise
    montante n'est pas peint (`sightClear217`, même accesseur que le jeu) ; d'en haut, le contrebas reste
    visible.
  - Commandant borné par `canStep` (G12 seulement) : entrée et sortie par l'escalier refusées quand une
    falaise sépare l'entrée du support (`landing217`, segment `stepClear217`) ; chute (support perdu) jamais
    posée par-dessus une falaise ; passerelle refusée entre deux supports posés sur deux paliers (leurs
    dalles ne sont pas à la même hauteur). L'œil est la bouche de l'arme levée du palier du support, dont
    l'emprise tient sur un seul palier.
  - En G1–G11 : séquence d'appels WebGL identique avec ou sans le module, et identique au peintre de la
    base `8d7ea21` (contexte factice enregistreur, 24 images, citadelle, sentinelle, trois infectés).
    Harnais : `tests/helpers/terrain-fps217.cjs`, `scripts/browser-terrain-fps217.mjs`.

### Préalable O9 (b) — tir FPS entre paliers, côtés de la Meneuse et des abominations, siège adossé sauvegardé (**livré**, hors jeu)

Dettes relevées par la revue de la PR #39 et par les réserves d'O7 ; G12 toujours non créable (aucun module ajouté à
`index.html`). Décisions D-O1 (la falaise arrête vue et tirs d'en bas, pas d'en haut), D-O2 (même effectif concentré
sur les côtés ouverts), D-O3 (FPS dès l'ouverture).

- Tir FPS entre paliers (`vertical-citadel175.js`) : la simulation garde ses hauteurs relatives au sol local ; sur un
  terrain, `raycast`, `sightQuery`, `aimPoint(e, origine)` et la visée de la vue classique (`screenAim`) passent dans le
  repère du relief avec les décalages du peintre O8b (`terrain-fps217.js` : `siteFloor`, `boxFloor`, `actorFloor`,
  `linkFloors`, `elevation`) — origine levée du sol de la boîte qui la porte (citadelle, passerelle) ou du relief,
  boîtes et acteurs levés de leur sol, sol du tir = relief (marche de 25 cm puis dichotomie) au lieu du plan z = 0.
  Point d'impact rendu dans le repère de l'origine (traces 2D inchangées). Les gardes de palier
  (`vertical-population181.js`) visent par `aimPoint(cible, origine)`. Carte plate : aucun appel au relief, mêmes
  calculs qu'avant.
- Côtés (`abominations217.js`) : `post(graine, vague, cadre)` et `posts` prennent le côté de la Meneuse parmi les côtés
  ouverts (`C.OpenSiege217.open`) par le même hachage, `h` modulo leur nombre (aucun tirage de plus), au bord de la
  carte de terrain (192 m) ; `edgeOf(x, y, taille, côtés)` ne retient que les côtés ouverts pour la Comble-fossé et la
  Traîne-épave. `frameOf(g)` donne le cadre ; `horde-horizon217` et `factions217` le passent. Sans cadre : quatre côtés,
  `h % 4 = h & 3`, mêmes postes et mêmes côtés qu'avant.
- Sauvegarde (`game.js`, `save.js`, `core.js`) : `serialize` ajoute `openSiege217` sur un terrain seulement, quand l'état
  est celui de la vague en cours ; la dernière enveloppe de `DeadwallSave.validate` le relit par
  `C.OpenSiege217.normalize(brut, partie)` (forme stricte, vague et phase de la partie, fronts parmi `fronts`, parts de
  somme 1, arrivées entières bornées par le plan) ; version 20 inchangée ; absent = reconstruit comme avant
  (`openSiegeState217`, qui reconstruit aussi un état dont un front n'est plus ouvert).
- Tests : `tests/open-city217-shot.test.cjs` (4 cas), `tests/open-siege217-sides.test.cjs` (5 cas).
- Innocuité : procédure 3 (base O6c, plus une vague menée et une vague de Traîne-épave) identique octet pour octet ;
  mondes des huit graines identiques hors tailles de sources.

### O9 — Ouverture « expérimental » (premier effet en jeu) (**livré**, derrière l’option)

**Préalable O9 (a) — Quartiers, chantiers de jour et systèmes de cité sur un monde de terrain (livré, hors jeu).**
Les chantiers O6b à O8b contournaient dans leurs harnais les systèmes de cité qui plantaient sur un monde de terrain ;
une partie construite sur la carte de 192 m (harnais) tourne désormais sans contournement : construire, mettre en
service, bilan, menu de construction, sauvegarde et reprise de la cité, minicarte et plan complets, vague complète.
Détail, mesures et réserves : `tasks.md`, section « préalable O9 (a) ».

- Quartiers (`WorldMap#buildTerrain217`) : six quartiers (thèmes de `C.TERRITORY_SECTORS`) posés par une fonction pure
  de la graine et de la description (hachage, aucun flux de génération) : un par secteur de 60° à partir d'une
  orientation hachée, au plus près de 45 m du centre, sur une case « libre » (carré de 5 cases atteint depuis le centre,
  à sec, d'un seul palier, hors rampe), à 22 m au moins l'un de l'autre ; un secteur fermé par la falaise ou l'eau cède
  son quartier au terrain atteint le plus proche de sa direction. Règles `C.OpenCityLife217Rules`. Le terrain porte
  `reach` (cases atteintes depuis le centre par les arêtes franchissables, bâtiments exclus) et `centre`.
- Chantiers de jour : 18 points de terrain sur la carte de la campagne (`generate` et `normalize` bornés à
  côté − 48 : 4 048 à 128 m, 6 096 à 192 m), sur une case atteinte (`clearLocation` lit `reach217`).
- Haltes d'expédition (« sites nommés ») : position de la carte de 128 m mise à l'échelle autour du centre de la cité,
  puis case libre la plus proche, à 8 m des autres lieux (`WorldMap#halts217`, lu par `expeditions` et les repères).
- Plan de la carte plate absent d'un terrain (`exploration-125` `planOn`) : ni solides invisibles, coût, vue, butin de
  station, placement ni surface ; la route est celle de la description. CARTE [M] : paliers, eau, routes, falaises,
  quartiers nommés et haltes au lieu des hameaux, stations et carrefours du plan plat.
- `fieldcraft.pack` : routes du terrain (`roads`) au lieu de la croix, anneau autour du centre de la cité, place
  nouvelle atteinte (`reach217`) quand l'ancienne l'était. `earthworks217` : grille et clés sur la carte de la partie.
- Sauvegarde : `save.js` lit la génération sur le registre régional du document reçu (la migration des couches
  anciennes remettait ce registre à neuf : une carte de 192 m n'était jamais admise) ; `world-pack131` n'admet en G12
  que son registre vide (préparations G5–G11 sans objet) ; `restoreSave` reconstruit la cité sur le terrain de la graine
  (`Game#cityTerrain217`, carte locale requise). La génération 12 reste refusée par le registre régional fermé.
- Tests : `tests/open-city217-life.test.cjs` ; harnais sans quartiers fictifs, chantiers vidés ni bilan neutralisé.
- Innocuité : procédure 3 (base `37984c1`) identique octet pour octet ; mondes G1–G11 des huit graines inchangés.

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
- **Livré O9** (premier effet en jeu, derrière l'option ; détail, mesures et réserves : `tasks.md`, section O9) :
  - Menu : ligne « MONDE » (*Région finie (défaut)* / *Sans bord — expérimental*) et son aide, dans le volet « Carte
    personnalisée et bilans » ; septième argument `open217` de `startNew` ; rejouer la carte et « nouvelle carte » gardent
    l'option. Départ : cité de 192 m née de `world-local217`, registre G12 au centre du cadre, marque `openworld217`.
  - Fiche : `seed-card217` lit la carte locale en G12 et à l'aperçu (côtés fermés et cause, passages, milieu, eau,
    falaise, mention « expérimental »), sans tirage.
  - Branchement : `frontier-world` (12 → `DeadwallOpenWorld217.region`, limites d'O1), `frontier-state` (module ouvert),
    `frontier` (cantons vus, porte à la taille de la carte, bord fermé refusé, profils d'occupants G12, un canton par image),
    `world-evolution` (`pickRoad`), `frontier-routing` (itinéraire borné du monde), `atlas-projection` (cadre de 192 m),
    `night-gear`, `frontier-art` (relief et routes de la vue).
  - Scripts publics : huit modules G12 et `openworld217` ; gardes d'isolement remplacées par « chargé sans effet en G1–G11 »
    plus un test de comportement à globales empoisonnées.
  - D-O4 tranché « évoluer, puis geler » (section 3).
  - Hors portée, à suivre : atlas et minicarte sans étendue (O10), graphe macro des coutures (T5.3 : l'itinéraire reste borné
    à 25 cantons), faune et migrations propres aux cantons (T5.4 : hordes sur routes seulement, aucune faune G12).
- **Livré T5.4** (faune, épaves et migrations des cantons ; détail, mesures et réserves : `tasks.md`, section « T5.4 ») :
  - Module `openlife217` (`src/openlife217.js`, liste blanche, `ORDER`, `GROUPS`, `API_NAMES`, `LABELS`) : actif pour une
    campagne NOUVELLE créée avec l'option ; une campagne sans l'option garde la forme inactive ; une campagne sans bord créée
    avant cette tranche (sans clé) reste sans faune de canton. Règles `C.OpenLife217Rules` (adressage, eau, plafonds) ;
    l'équilibrage de la faune est celui de la région finie (`Landscape189Rules.population`, guildes par milieu,
    `BiomePopulation165Rules`), lu et non recopié.
  - Animaux `K<cx>_<cy>:faune:<n>` (n = morceau de 256 m × 8 + emplacement), tirés par le flux nouveau
    `K.stream(graine, cx, cy, 'faune-<morceau>-<groupe>')` ; eau lue sur les mailles et rivières du canton (mer salée, lacs et
    cours d'eau doux, pont = traversée). La boucle régionale (`frontier.js`) les anime par la même logique que la région finie
    (alarme, fuite, dérive, repos, activité du jour) ; peintres `wildlife-art165/189` ; chasse et pêche (`wildlife-harvest190`).
  - Sauvegarde creuse : seuls les animaux abattus, par canton (`kills[canton][n] = [x, y, angle]`), au plus 24 000 ; le registre
    régional G12 garde `wildlife165` vide ; validation stricte des 16 cantons cités les plus proches à la même révision,
    forme seule au-delà ou sous une autre révision (D-O4).
  - Épaves : véhicules garés des lieux de canton (déjà fouillables par le registre régional) ; démontage
    (`exploration-pack131`, identifiants `K…:site:n:car:m`) ouvert aux campagnes du module.
  - Migrations : hordes tirées par `pickRoad` (O9) ; cap tenu le long des routes des cantons (test).

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
  Les valeurs du plafond de passage par front restent à mesurer en O7. **O7** : repli au prorata de la largeur
  des côtés ouverts, plafond d'entrée d'une cité à un seul front de 0,25 arrivée par seconde et par mètre
  (`C.OpenSiege217Rules`) ; mesures sur 12 graines dans `tasks.md`, section O7 — valeurs à confirmer en jeu (O9).
  **22 novembre 2026** : le plafond s'applique à toute cité à un seul côté quelle que soit sa largeur (1,5 arrivée par
  seconde au plus) et l'escorte de la Meneuse entre dans ce même débit ; même effectif total, vague plus longue, jamais
  plus de points de vie (`tasks.md`, section « O7 (suite) »).
- **D-O3 — tranché** : la vue à la première personne est **disponible dès l'ouverture** de
  l'option expérimentale. O8b passe donc sur le chemin critique de O9 ; la hauteur d'un cran est
  fixée en O8b à 4 m (`C.TerrainRelief217Rules.stepMetres`, égale à la hauteur peinte d'O8a).
- **D-O4 — tranché (O9) : « évoluer, puis geler »**. Tant que l'option reste « expérimental », le générateur G12 peut
  changer. Une campagne G12 porte la révision de génération avec laquelle elle a été créée (module `openworld217` :
  `revision` = {`open`, `canton`, `relief`, `sites`, `local`} ; registre régional : `reliefVersion`, `sitesVersion`,
  `detailVersion`). À la reprise, si la révision diffère, la campagne **reste jouable**, est signalée « monde révisé »
  (message clair à la reprise, ligne du poste de commandement) et ses cantons **non visités** peuvent différer ; les écarts
  sauvegardés (lieux repérés, prélèvements, cantons vus) restent, et le registre n'est alors vérifié que sur sa forme. Le
  gel interviendra à la sortie d'« expérimental » (T7)
  Limite d'O9 : la reprise régénère tous les cantons avec la révision courante, y compris ceux déjà vus (aucun canton
  n'est conservé en clair) ; garder à l'identique les cantons visités demanderait de garder l'ancien générateur ou leur
  contenu, à décider avant le gel.
- **D-O5 — tranché** : la carte de la cité **reste à 192 m** ; si le champ de flux coûte trop, on
  l'**optimise** plutôt que de revenir à 128 m, quitte à retarder l'ouverture. O6b doit donc
  mesurer et, si nécessaire, inclure l'optimisation.
