# Monde sans bord — tâches

Besoin : [spec.md](spec.md). Plan et tranches : [plan.md](plan.md).

Règle commune à toute tâche : avant et après, les mondes G1–G11 des graines
0, 1, 42, 17117, 84329, 967313470, 1947648717, 4294967295 sont identiques
(`node scripts/audit-campaign-sites205.cjs <sortie> <graines>` comparé, hors empreintes de
sources, à `docs/codex/suivi-monde2026/campagne205-eligibilite.json`).

## T0 — Adressage des cantons (livré)

- [x] T0.1 Règles `C.WorldCantons217Rules` dans `src/core.js`.
- [x] T0.2 `src/world-cantons217.js` : coordonnées signées, identifiants de canton, d'objet
      et de couture, sous-graines de canton, de couture et de sommet, voisinage, anneau,
      plan de chargement, cache borné.
- [x] T0.3 `tests/world-cantons217.test.cjs` : vecteurs figés, ordre de visite, symétrie des
      coutures, éviction, isolement (non chargé par `index.html`, lu par aucun fichier).
- [x] T0.4 Vérification : empreintes de monde inchangées ; seule l'empreinte de source de
      `src/core.js` change.

## T1 — Accesseurs de limite (aucun changement de valeur) — livré

Tranche vérifiée ; test `tests/world-bounds217.test.cjs` (14 cas).

- [x] T1.1 `src/frontier-world.js` : `limits(size)` et `limitsForGeneration(g)` (objets gelés, un
      par taille), repris tels quels par le monde rendu par `create` : `outside(x, y, pad)`,
      `outsideOpen(x, y, pad)`, `contains(x, y, pad)`, `clampInside(x, y, pad)`, `extent()`,
      `chunkRange(chunk)`, `axisMin(pad)`, `axisMax(pad)`, plus `site(id)` et
      `sitesNear(x, y, radius)`. Trois prédicats et non un seul, parce que les sites d'appel
      historiques ne traitent pas un `NaN` ni le bord exact de la même façon :
      `outside` = `x<pad||y<pad||x>size-pad||y>size-pad` (bord admis, `NaN` admis),
      `outsideOpen` = `x<=pad||…||x>=size-pad` (bord refusé), `contains` = forme positive
      `x>=pad&&…&&x<=size-pad` (`NaN` refusé). `contains` n'est donc **pas** la négation de
      `outside`. `axisMin(pad)` = `pad` et `axisMax(pad)` = `size - pad` : les deux bornes d'un
      axe, pour les validateurs qui gardent leur propre garde `!Number.isFinite(v)||v<lo||v>hi`.
      `site(id)` : index par identifiant construit à la première lecture, reconstruit si la liste
      change, premier lieu portant l'identifiant comme `pois.find`.
      `sitesNear(x, y, radius)` : lieux dont le centre **ou** l'emprise tournée est à `radius` au
      plus du point, dans l'ordre de la liste ; un lieu ou un point non mesurable (`NaN`) n'est
      jamais retiré. C'est un préfiltre : l'appelant réapplique son critère d'origine, inchangé.
- [x] T1.2 Test d'équivalence : 10 000 points par taille (8 192 et 24 576), bords, `NaN`, infinis
      et marges compris, anciens calculs contre accesseurs ; mondes réels G4, G8, G11 ; tailles
      des générations 1 à 11.
- [x] T1.3 a) acteurs : `frontier.js` (dérive animale ; `enemyBlocked`), `world-evolution.js`.
      `enemyBlocked` : converti en gardant les deux précomparaisons `x<R.footRadius||y<R.footRadius`
      devant `outside217(world(),x,y,R.footRadius)`. `world()` crée la région à la demande : il
      est lu exactement au moment où l'ancienne expression lisait `world().size` pour la première
      fois, jamais plus tôt. Seule différence : la seconde lecture consécutive de `world()` dans
      la même expression disparaît ; `world()` relu sans rien entre les deux est sans effet
      (`ensure()` ne réécrit que les mêmes valeurs), et l'instruction suivante le relit de toute
      façon. Les précomparaisons en clair sont à retirer avec T5.
- [x] T1.3 b) faune : `biome-population165.js`, `wildlife189.js`, `biome-forage193.js`.
      Le fichier généré `src/codex3000-live-data.js` suit `wildlife189.js`.
- [x] T1.3 c) validateurs de sauvegarde : `frontier-state.js` (position, voiture, poursuites,
      faune), `essential-state.js`, `night-gear.js`, `survival-pack.js`, `succession133.js`
      (dépouilles et corps), `husbandry191.js` (enclos, capture), `world-evolution-state.js`
      (hordes et contacts), `companions-pack.js`. Chacun lit `limitsForGeneration(g)` par une
      fonction locale `limitsOf217(W, g, ancienCalcul)` : si le module du monde porte
      `limitsForGeneration`, l'accesseur ; sinon l'ancien calcul sur `sizeForGeneration`, évalué
      au même endroit qu'avant (une fois, tout de suite). Les faux `DeadwallFrontierWorld` des
      tests, réduits à `sizeForGeneration`, passent par ce repli : aucun test modifié. Les gardes
      (`num`, `number`, `n`) et leurs messages ne changent pas ; seules les deux bornes passées
      viennent de l'accesseur. Bornes inférieures du domaine « région » comprises (`axisMin()`
      = 0) ; le domaine « local » (cité, 4 096 unités) n'est pas une borne de monde et reste en
      clair. `husbandry191.js` borne les enclos par la génération 10 en dur, comme avant.
- [x] T1.3 d) atlas : `atlas-view.js` (étendue, sélection de terrain, lieux, coordonnées au
      survol), `atlas-render.js` (fond, grille, cellules). Survol : `q.x>=0&&q.y>=0` reste
      devant `inside217(view().world,q.x,q.y)` ; `view()` (qui peut demander la région par
      `overview()`) est lu au même moment qu'avant, une fois au lieu de deux à cet endroit.
- [x] T1.4 `pois.find(p => p.id === id)` → `site(id)` : les 28 recherches par identifiant de
      18 fichiers hors `frontier-world.js`, et les 3 de `frontier-world.js`.
- [x] T1.5 Constantes `24576` / `8192` : décision par site (valeurs inchangées).

  | Fichier | Nature | Traitement |
  | --- | --- | --- |
  | `frontier-world.js` (taille par génération, `RULES.size`, emprise des bâtiments de l'ancienne région dans `install`, morceaux historiques dans `chunk`) | définition des régions finies G1–G11 et emprise de l'ancienne région | nommées `OLD_REGION` = 8 192 et `WIDE_REGION` = 24 576 |
  | `field-atlas-state.js`, `cell` | schéma d'indexation fixe 3 × 3 blocs de 8 192 m, le même pour G1 à G11 (le lire dans `sizeForGeneration` changerait l'index des campagnes G1–G4) | nommées `INDEX_BLOCK_217`, `INDEX_SPAN_217` |
  | `field-atlas-state.js`, `district` et `belongs` (`p.x<8192&&p.y<8192`) | emprise de l'ancienne région (agglomérations historiques) | nommée `OLD_REGION_217` |
  | `world-stream131.js` (`old=8192`) | emprise de l'ancienne région dans le flux G5 | nommée `OLD_REGION_131` |
  | `succession133.js` (`\|\|24576`), `companions-pack.js` (`\|\|8192`, `:24576`) | replis de validation quand le module du monde ou la sauvegarde manquent | nommées `WIDE_REGION_217`, `OLD_REGION_217` ; la borne elle-même passe par `limitsOf217` |
  | `world-pack131.js` (`w?.size\|\|8192`, « km de côté ») | borne de monde affichée | `span217(w)` ; repli nommé `OLD_REGION_217` quand aucune région n'est chargée |
  | `core.js` : `AtlasRules.regionSize`, `WorldStreamRules131.size`, `GeographyRules135.size` | règles : source des tailles | laissées (déjà nommées) |
  | `frontier-geometry.js` (`SIZE=8192`) | constante déjà nommée de la géométrie historique | laissée |
  | `core.js` (`pathMaxExpanded`, `maxExpanded`), `game.js` (`findPath`), `coop.js` (`messageChars`), `breach217.js` (`SCAN_LIMIT`) | plafonds de calcul sans rapport avec le monde | laissées |

- [x] T1.6 Parcours de `pois` — recensement (hors recherche par identifiant, traitée en T1.4).

  Lecteurs d'un voisinage ou d'un seul lieu, **convertis** (repli identique sans accesseur) :

  | Fichier | Usage | Conversion |
  | --- | --- | --- |
  | `atlas-view.js` (clic sur l'atlas) | premier lieu vu dont le rectangle local élargi de `radius` contient le point | `sitesNear(x, y, radius × 1,5)` puis critère d'origine (1,5 couvre le coin, √2) |
  | `seed-card217.js`, `density` | nombre de lieux dont le centre est à `placeRadius` de D-17 | `sitesNear(home, placeRadius)` puis critère d'origine |
  | `frontier-art.js`, `render` (intérieur) | `pois.filter(p => p.id === inside)` : le lieu occupé | `site(id)` rendu en liste (`sitesById217`) |
  | `campaign-services208.js`, `campaign-water-supports214.js` | `world.pois.includes(p)` sur des candidats déjà pris dans `nearPOI` | `site(p.id) === p` (`listed217`) |

  Les deux dernières lignes supposent des identifiants uniques, ce que le test vérifie sur les
  mondes G4, G8 et G11 et que l'activation de monde exige déjà (`world-pack131.js`).

  Lecteurs d'un voisinage, **non convertis** :

  | Fichier | Usage | Pourquoi |
  | --- | --- | --- |
  | `atlas-render.js:80` (emprises, parkings) | lieux vus dont `x ± w`, `y ± h` touche le rectangle de la caméra | voisinage rectangulaire dont la marge dépend de chaque lieu, relu à chaque image : demande `sitesIn(rect)` — T6 |
  | `campaign-services208.js`, `campaign-water-supports214.js` | candidats `world.pois` quand `nearPOI` manque | repli pour mondes factices ; le monde réel passe déjà par `nearPOI` |
  | `frontier-world.js`, `contextSites160(x, y, r)` | `nearPOI` si un point est donné, sinon toute la liste | la forme sans point exige tout (voir plus bas) |

  Lecteurs qui exigent **tous** les lieux — incompatibles avec un monde sans bord, matière de
  T4–T6 :

  | Fichier | Usage | Ce qu'il faudra |
  | --- | --- | --- |
  | `frontier-state.js:33`, `field-atlas-state.js:20`, `world-pack131.js:12`, `campaign-pack.js:42`, `campaign-water214.js:43,130`, `context-operations160.js:32`, `outposts217.js:71`, `exploration-needs217.js:106`, `urban.js:43` | index `Map` de toute la liste par identifiant, pour valider ou lire des lieux cités | lecture par `site(id)` sur les cantons cités (T4.3) ; pas une conversion à l'identique aujourd'hui (une `Map` garde le **dernier** doublon, `site` le premier) |
  | `world-evolution-state.js`, `frontier.js` (`revealSites`) | ensemble de tous les identifiants | idem |
  | `world-pack131.js` (`normalize`) | tout lieu portant une réserve `frontier131` | registre par canton cité |
  | `world-pack131.js` (préparations G5 à G11) | lieux ajoutés par une génération, plafonds et unicité du monde préparé | propre aux activations G5–G11 ; sans objet en G12 |
  | `essential-state.js`, `campaign-pack.js:62`, `chronicles131.js:45`, `field-atlas.js:11` | plus proche lieu d'un type (ou d'un bourg) dans toute la région, trié par distance à D-17 | recherche par anneaux de cantons, bornée |
  | `seed-card217.js` (`nearest`) | plus proche lieu d'un type depuis D-17 | idem |
  | `field-atlas.js:26,28`, `field-atlas-ui.js:22`, `frontier-ui.js:19`, `world-codex-actions159.js:68,100`, `atlas-render.js` (voies d'accès, étiquettes) | tous les lieux **vus** (listes, étiquettes, voies d'accès, biomes connus) | itérer la liste `seen` et lire chaque lieu par `site(id)` — l'ordre de parcours change, donc pas une conversion à l'identique (T6) |
  | `night-gear.js:155` | panneaux solaires de tous les lieux de six types | cache par canton chargé (T5) |
  | `remarkable217.js:47` | lieux remarquables et nids de toute la région | rang par canton (T4.1) |
  | `frontage174.js:88,90,114` | index et audit des façades de toute la liste | index par canton (T4.1) |
  | `frontier-world.js` (`install`, raccords de routes, corbeilles `bins`, `driveOwners174`, `programmeDrives`) | construction de la région finie | remplacé par la façade G12 (T5) |
  | `scripts/`, `tests/` | audits et preuves sur toute la liste | restent valables pour G1–G11 |

Forme retenue aux sites d'appel : une fonction locale par fichier (`siteOf217`, `outside217`,
`outsideOpen217`, `inside217`, `chunks217`, `span217`, `limitsOf217`, `sitesNear217`,
`listed217`, `sitesById217`) qui lit l'accesseur du monde et, **si le monde n'en a pas**, refait
le calcul historique. Ce repli existe pour les mondes factices des tests (une vingtaine de
fichiers de test construisent `{size, pois: […]}` à la main, d'autres un faux module réduit à
`sizeForGeneration`) ; il est vérifié identique dans `tests/world-bounds217.test.cjs`.

Laissé hors T1, avec sa tranche :

- [ ] `forage193.js:16` et `biome-forage193.js:16` : bornes lues dans `GeographyRules135.size`,
      pas dans le monde — validateur d'identifiants, à traiter avec T4.
- [ ] `atlas-projection.js` : caméra bornée par une étendue scalaire — T6.
- [ ] Comparaisons internes de `frontier-world.js` (`blocked`, `line`, `vehicleClear`, `chunk`,
      `prefetch`, décor) : laissées en clair — c'est l'implémentation du monde fini, que la
      façade G12 remplace entièrement (T5).
- [ ] Bornes de position signées dans les validateurs : `limitsForGeneration(12)` devra rendre
      des bornes par cantons cités (T4.2) ; les validateurs lisent déjà l'accesseur.
- [ ] Retirer les replis locaux quand les mondes factices des tests porteront les accesseurs.
- Tests : ceux de chaque fichier touché, `tests/world-bounds217.test.cjs`,
  `tests/codex-campaign*.test.cjs`.
- Preuve d'innocuité de la fin de tranche : empreintes G1 à G11 de deux graines (routes, lieux,
  villes, secteurs, jonctions, 482 sondes par monde) identiques avant et après ; mondes des
  huit graines identiques à `campagne205-eligibilite.json` hors empreintes de sources ;
  sauvegarde en région écrite avant, relue après, et inversement : états identiques, puis
  identiques après 200 pas ; 2 100 falsifications de coordonnées de cette sauvegarde (position,
  ancre, douze hordes, coordonnées locales), mêmes verdicts avant et après. Les validateurs de
  l'équipement de nuit, du bivouac, des dépouilles, des enclos et des compagnons ne sont
  couverts que par leurs propres tests et par l'égalité des bornes : cette sauvegarde n'en
  contient pas d'objet.
- Parcours vérifié (premier lot) : sortie à pied par le bord est de D-17 (G11, graine 17117),
  marche, atlas ouvert en région, sauvegarde et reprise, retour — positions identiques au bit
  près à la base. Non joué : sortie en voiture jusqu'au bord est de la région.

## T2 — Canton sec hors jeu, avec relief par paliers (livré, sans effet en jeu)

Décisions prises avant la tranche : D1 (canton de 1 024 m), D2 (le relief par paliers entre
dans la même génération 12), D3 (ouverture en « expérimental », plus tard), D6 (la mer est une
zone basse — le palier 0 —, plus un bord). La génération 12 reste refusée partout.

Le découpage prévu en deux fichiers (`world-macro217.js`, `world-canton217.js`) est livré en
un seul module, `src/world-canton-gen217.js` : les champs macro y sont des fonctions exportées
(`altitude`, `levelAt`, `biomeAt`, `drainage`, `seam`).

- [x] T2.1 Champs en coordonnées monde : altitude continue quantifiée en six paliers
      (maille de 32 m), ressauts raides qui donnent les falaises (écart de deux crans entre
      mailles voisines), rampes ailleurs ; milieu par maille parmi les 16 existants, selon
      chaleur, humidité et altitude. Règles `C.WorldRelief217Rules` dans `src/core.js`.
- [x] T2.2 `src/world-canton-gen217.js` : passages de route et d'eau des quatre coutures
      (sous-graines de couture), carrefour intérieur, routes qui ne changent de palier que
      par une rampe, lieux candidats `K<cx>_<cy>:site:<n>` sans plan d'intérieur.
- [x] T2.3 `tests/world-canton-gen217.test.cjs` : ordres de visite et cache ; empreintes de
      référence ; coordonnées négatives et bout de l'adressage ; relief, routes et eau
      identiques des deux côtés de 486 coutures ; routes jamais par une falaise ; connexité
      mesurée sur les huit graines (31 × 31 cantons pour 17117, 21 × 21 pour les autres) ;
      module isolé, génération 12 refusée, monde existant inchangé.
      Écart avec le plan : la connexité n'est **pas** totale. Plus grande composante entre
      92 % et 99,5 % des cantons desservis ; la mer et les plateaux fermés isolent le reste.
- [x] T2.4 Sonde `scripts/probe-cantons217.cjs` : médiane 1,8 ms par canton sous Node,
      3 à 4 ms dans Chromium, pour un budget de 8 ms ; la moyenne subit la charge machine.
- [x] T2.5 Page d'aperçu hors jeu : `PORT=4442 node scripts/apercu-cantons217.mjs`, page
      `tools/apercu-cantons217.html` (paliers ou milieux, falaises, eau, routes, rampes,
      ponts, lieux). Ni servie par `scripts/server.mjs`, ni chargée par `index.html`.
- [ ] T2.6 Preuve `docs/codex/suivi-monde2026/monde-sans-bord-cantons.json` + son test
      (à produire par le mainteneur avec les autres preuves, une fois les réglages arrêtés).
- [ ] T2.7 Reste à faire avant T4 : décor (arbres, rochers) par morceaux de 256 m ; bande de
      distance ; trame des routes moins régulière (une rangée sur trois porte encore la route
      principale d'est en ouest, et chaque canton a son carrefour). Agglomérations et D-17 :
      livrés dans la seconde tranche T3 ci-dessous.

## T3 — Eau sans bord

Première version livrée avec T2 (même module, mêmes tests) : chaque canton s'écoule vers son
voisin le plus bas, le débit compte les cantons drainés, un cours d'eau franchit la couture
au point bas de celle-ci et son niveau ne remonte jamais ; cuvette = lac contenu dans son
canton ; palier 0 = mer.

- [x] T3.1 Altitude macro et sens d'écoulement par couture.
- [x] T3.2 Cours d'eau de canton en canton, confluences, plans d'eau contenus dans un canton
      (première version : peu de cours d'eau — 0,4 par canton —, pas de méandres ni de
      largeur de lit dans la maille, pas d'étangs hors cuvette ; densité et lacs de vallée
      repris dans la tranche suivante).
- [ ] T3.3 Ponts : réemploi de `hydrology165` (croisements route/eau) par canton. Les ponts
      sont pour l'instant de simples mailles déclarées (`bridges`).
- [x] T3.4 Tests : continuité de largeur et de niveau aux coutures ; aucune route noyée.
- Décision requise : D6. Repli prévu si la tranche dérape (plan §8).

## T3 (suite) — Relief durci, routes par les cols, eau, agglomérations et D-17 (livré, sans effet en jeu)

Décision de l'utilisateur avant la tranche : **falaises fréquentes, rampes rares** — un
plateau est une enceinte naturelle avec quelques passages à garder. Même module, mêmes
règles (`C.WorldRelief217Rules`, version 2), toujours hors jeu : la génération 12 reste
refusée partout. Les empreintes de référence de T2 ont été refigées (permis tant que la
génération 12 n'est ouverte nulle part).

- [x] T3.5 Relief durci. **Tout changement de palier est une falaise**, sauf aux cols. Dans
      un canton, chaque contour d'un cran entre deux régions porte un col par 32 arêtes (au
      moins un dès 5 arêtes), large de 3 à 4 arêtes ; toute région d'au moins 6 mailles
      garde un accès. Le canton expose `passes` (arêtes franchissables) et `cols`
      (`K…:col:n`, naturel ou taillé). Mesure sur les huit graines (11 × 11 cantons) :
      87 à 102 arêtes de falaise pour 15 à 20 de rampe par canton, rapport **4,9 à 5,7**
      (T2 : 17 pour 80) ; 4,2 à 5,5 cols par canton. Aucun plateau fermé de 12 mailles ou
      plus sur 49 km² par graine ; restent des îlots de moins de 12 mailles (75 à 204) et
      0 à 10 mesas ceintes de falaises de deux crans.
- [x] T3.6 Routes par les cols. Un col coûte 4, tailler une rampe 40 (un cran) ou 160 (deux
      crans) : la route fait le détour par un col quand le canton en offre un, sinon elle
      taille sa rampe, qui devient un col déclaré (0,4 à 0,6 par canton). Toute couture
      franchissable porte une route ; de plain-pied d'abord, sinon rampe taillée sur la
      couture (rare : 4 sur 2 500 cantons). Raccord de secours si la mer ferme la couture
      voulue. Connexité sur les huit graines : plus grande composante **97,9 à 100 %** des
      cantons desservis (T2 : 92 à 99,5 %) ; sur une même masse de terre, **99,77 à 100 %**
      des réseaux. Ce qui reste isolé l'est par la mer. Pas d'arbre couvrant global.
- [x] T3.7 Eau. Fonds de vallée creusés dans le champ (jamais sous le palier 1), sources
      dans les cantons sans amont, lacs de vallée traversés par leur cours d'eau. Un cours
      d'eau dans 68 à 82 % des cantons hors hauts plateaux et hors mer (T2 : 0,4 par
      canton) ; 0,15 à 0,3 lac par canton. Niveau jamais remontant, continu aux coutures.
- [x] T3.8 Agglomérations portées par les sommets (`cornerSeed`), posées dans le canton dont
      le sommet est le coin nord-ouest, lues à l'identique par leurs quatre cantons
      (`G.town`) : hameau, bourg, ville (60 / 30 / 10 %), noms repris de `geography135`. Elles
      servent de carrefour, attirent les lieux (12,4 lieux par canton d'agglomération contre
      4,0 ailleurs) et sont reliées à leurs voisines, par une route principale entre bourgs
      et villes.
- [x] T3.9 D-17 dans `K0_0` : `G.foundation(graine)` rend un plat sec de 128 m, carrefour du
      canton, avec sa fiche — palier, milieu, falaise et eau les plus proches (distance,
      direction), part de falaise autour du palier, cols à garder. Un socle garde le centre
      de `K0_0` hors d'eau ; le sommet (0,0) ne porte pas d'agglomération. Valide sur 50
      graines (et 400 en relevé) : 48 sur 50 près d'une falaise ou de l'eau.
- [x] T3.10 Sonde et aperçu mis à jour (cols, rampes taillées, agglomérations, D-17 et sa
      fiche). Coût médian : 3 à 4,6 ms sous Node sur machine chargée (T2 : 1,8 ms au calme),
      5 à 8 ms dans Chromium sur la même machine chargée — le budget de 8 ms est tenu de
      peu dans le navigateur, à remesurer au calme.
- [ ] T3.11 Réserves à lever avant T4 : les rivières suivent les vallées quand le plus court
      chemin y passe, pas toujours ; les vallées ne dépendent pas du sens d'écoulement ; un
      col naturel n'est jamais posé sur une couture ; les agglomérations sont toutes près
      du coin nord-ouest de leur canton ; noms en double possibles (16 noms × 97 numéros) ;
      les mesas ceintes de falaises de deux crans restent sans accès.

## T4 (hors jeu) — La carte locale de D-17 née de son canton (livré, sans effet en jeu)

Réserve de T3 à lever : « une falaise vaut une enceinte » ne se lisait qu'à l'échelle
régionale. Toujours rien de branché : génération 12 refusée partout, aucune option de menu.
Module `src/world-local217.js`, règles `C.WorldLocal217Rules`, test
`tests/world-local217.test.cjs` (9 cas). Échelle rappelée : une case de la carte actuelle fait
1 m (`C.TILE` = 32 unités), la carte 128 cases ; une maille de relief fait 32 m.

- [x] T4.L1 Cadrage du site — mesuré sur les 50 graines du relevé de fondation, puis décidé.
      « Fermé » = aucune case du bord d'où l'on atteint la cité ; « passage » = le côté ne
      se joint que par des rampes, un pont ou un goulet.

  | Option | Site (`foundation`) | Cadre | Un côté fermé | Fermé ou passage | Côtés ouverts 0/1/2/3/4 | Falaise dans le cadre |
  | --- | --- | --- | --- | --- | --- | --- |
  | état T3 | plat 128 m, falaise idéale à 2 mailles | 128 m | 0 | 0 | 0/0/0/0/50 | 0 |
  | (a) agrandir | idem | 256 m | 2 | 4 | 0/0/0/4/46 | 32 graines, à 107 m |
  | (a) agrandir | idem | 320 m | 6 | 12 | 0/0/0/12/38 | 43 graines, à 112 m |
  | (b) rapprocher | plat 128 m, falaise idéale à 0 | 128 m | 0 | 0 | 0/0/0/0/50 | 0 |
  | (b) rapprocher | plat 64 m, falaise idéale à 0 | 128 m | 7 | 13 | 0/0/1/12/37 | 43, à 32 m |
  | (b) adossé | plat 64 m, idéale 0, prime d'adossement | 128 m | 22 | 26 | 0/0/11/15/24 | 44, à 32 m |
  | **retenu** | plat 64 m, idéale 0, prime d'adossement | **192 m** | **29** | **38** | **0/2/18/18/12** | 44, à 32 m |
  | (a)+(b) | idem | 256 m | 28 | 42 | 0/3/19/20/8 | 45, à 33 m |

  Décision : **combinaison**. Agrandir seul ne suffit pas (4 sur 50 à 256 m, et la falaise
  reste à 107 m, loin de toute muraille). Ce qui compte est le site : un plat exigé de 64 m
  au lieu de 128, adossé (`foundation.size` 64, `idealCliff` 0, prime `backWeight` 6 par côté
  du plat entièrement bordé de falaise, pour `backCap` 2 côtés au plus). Le cadre passe à
  192 m (2,25 fois la surface actuelle, pas 4 fois) : il montre ce qu'il y a derrière la
  falaise et fait entrer les rampes. Réglable : `C.WorldLocal217Rules.frame` (128 reste
  valide et donne déjà 26 sur 50 ; 256 aussi), `C.WorldRelief217Rules.foundation`.
  Sur 400 graines à 192 m : 303 avec un côté fermé ou réduit à un passage, 212 avec un côté
  fermé, aucune cité enclavée.
  Conséquence sur T3 : `C.WorldRelief217Rules.version` passe à 3, l'empreinte de référence
  de `K0_0` (graine 17117) est refigée — les trois autres ne bougent pas : seul le canton
  d'origine change. Les seuils du test de fondation tiennent sans retouche (48 sites sur 50
  près d'une falaise ou de l'eau).
- [x] T4.L2 Grille locale `L.describe(graine, {frame})` : par case de 1 m, `levels` (palier
      de la maille du canton), `biomes`, `water` (mer et lacs de la maille ; rivières et
      ruisseaux posés à leur largeur réelle depuis les tracés du canton), `passes` (bit 1 :
      l'arête est se franchit ; bit 2 : l'arête sud), `kinds` (plat, falaise, rampe, rive,
      eau), `roads` (classe + 1), `cost` (coût du chemin jusqu'au centre, −1 hors
      d'atteinte). **Une arête de col ne se franchit que par sa rampe**, large de `ramp`
      (12 m) au milieu de l'arête : à l'échelle régionale un col fait 3 à 4 mailles, soit
      une centaine de mètres — ce n'est pas une porte ; à l'échelle de la cité, chacune de
      ses arêtes porte une rampe de 12 m. Les routes du canton franchissent une arête en
      son milieu, donc par la rampe. `accesses` : routes qui entrent dans le cadre (côté,
      position, classe, `linked` : mène à la cité sans sortir du cadre) ; `cols` : cols du
      canton pris dans le cadre. `sides.<côté>` : `ouvert` (au moins `narrow` = 24 m de bord
      de plain-pied, joint par un couloir au moins aussi large), `ralenti` (idem, mais un
      ruisseau à passer à gué), `passage` (rampes de col, pont, goulet, avec largeur et
      position), `clos` (cause : falaise ou eau), plus `width`, `share`, `lanes`, `entries`.
- [x] T4.L3 Siège hors jeu `L.siege(carte)` : fronts possibles (où la horde entre, où elle
      est canalisée), relus par un parcours en largeur indépendant sur la grille seule ;
      `enclosed`, `reachable`, `consistent`. Test : 50 graines sans cité enclavée, chaque
      extrémité d'entrée reliée au centre par `L.pathToCentre` sans falaise ni eau profonde.
- [x] T4.L4 Gisements candidats `deposits` (`K0_0:gite:n`) : 40 pierre, 100 bois, 52
      ferraille, dans le carré de 128 m de la carte actuelle, à portée de la cité. Relevé de
      la carte actuelle (graines 17117, 42, 84329, hors vivres et carburant) : 99 à 102
      gisements de bois (8 700 à 9 100), 30 à 47 de pierre (3 100 à 4 800), 44 à 59 de
      ferraille (3 200 à 4 200), plus les 48 pièces de décor métrique (20 à 23 de ferraille,
      5 à 10 de pierre, 6 à 10 de bois, 4 à 5 de vivres, 1 de soins, 1 de carburant). Pierre
      au pied des falaises (15 par graine en moyenne) sinon selon `rockChance` du milieu ;
      bois selon `treeChance` et en lisière ; ferraille en bord de route. Tirage par hachage
      de la case, aucun flux existant. Non repris : vivres, carburant, décor métrique, lots.
- [x] T4.L5 Fiche du site `sheet` : côtés fermés (falaise, eau), passages, côtés ralentis,
      ouverts, à demi couverts, eau et falaise les plus proches dans le cadre, part du cadre
      à portée et sur le palier de la cité, phrase d'ouverture (38 phrases différentes sur
      50 graines).
- [x] T4.L6 Page d'aperçu : mode « carte locale de D-17 » (`?mode=local&seed=…&frame=…`).
- [x] T4.L7 Mondes G1–G11 identiques sur les huit graines (procédure d'en-tête) ; coût
      médian 25 à 35 ms sous Node canton compris, environ 130 ms au premier appel dans
      Chromium ; une fois par campagne.
- Réserves : **l'eau ne ferme aucun côté** (0 sur 400 graines) et ne ralentit que 17 graines
  sur 400 — le site est choisi à sec et les rivières larges sont rares près de lui ; les
  falaises suivent les mailles de 32 m (traits droits, angles droits) ; 12 graines sur 50
  restent ouvertes des quatre côtés ; le plat garanti n'est que de 64 m (58 % du cadre sur
  le palier de la cité en moyenne, 28 % au pire) ; une route peut longer le cadre sur un
  autre palier sans mener à la cité (`linked` faux) ; la horde qui contourne par l'extérieur
  du cadre n'est pas modélisée ; rien n'a été joué.

### Ce que la tranche d'ouverture devra changer pour consommer cette grille (non commencé)

Tout ce qui suit est conditionné à la génération 12 ; les campagnes G1–G11 gardent la carte
plate de 128 m, ses flux et ses identifiants.

1. **Taille de la carte locale** (`src/core.js`, `src/game.js`, sauvegarde). Préparé en T5 (volet
   B, ci-dessous) : accesseurs `world.local` / `g.local` et lecteurs convertis. `WORLD_TILES`
   (128) et `WORLD_SIZE` (4 096) étaient des constantes lues par 35 fichiers de `src/`
   (`game.js`, `tactics.js`, `save.js`, `squads.js`, `linecare.js`, `recon.js`,
   `exploration-125.js`, `vertical-citadel175*.js`, `earthworks217.js`,
   `horde-horizon217.js`, `seed-card217.js`…). À 192 m il faut une taille par campagne :
   `world.tiles` / `world.size` portés par `WorldMap`, `occupancy` et `FlowField.values`
   dimensionnés par carte, `index(x, y)` et `grid()` paramétrés, caméra, minicarte
   (`renderMinimap`), bornes des validateurs du domaine « local » (4 096 en clair dans
   `frontier-state.js`, `essential-state.js`, `night-gear.js`, `survival-pack.js`,
   `save.js` : véhicule, unités, chantiers). Repli sans rien de cela : `frame` 128 garde
   la taille actuelle et donne déjà 26 graines sur 50 avec un côté fermé ou un passage.
2. **`WorldMap`** (`src/game.js`). Le constructeur reçoit la description locale : tableaux
   `levels`, `passes`, `water`, `roads`, `kinds`. `generateNodes()` et
   `DeadwallWorldContent.generate` ne servent plus en G12 : les nœuds viennent de
   `deposits` (identifiants `K0_0:gite:n` → `ResourceNode`), le décor métrique reste à
   replacer (`packMetricScenery202` : parcelles libres hors falaise, hors eau, hors rampe).
   `placement()` refuse une emprise à cheval sur deux paliers, sur l'eau, sur une rampe
   (sauf porte et mur), et le message le dit. `movementCost()` ajoute le coût de rampe et de
   gué ; nouvelle méthode `canStep(gx, gy, nx, ny)` (falaise, eau profonde) lue par tout
   déplacement.
3. **Collisions** (`src/game.js`). `friendlyPositionClear`, `hostilePositionClear`,
   `moveFriendly` (lignes de `clamp(…, WORLD_SIZE - …)`), `hostileBuildingAt`, les lancers de
   rayon par pas de `TILE/3` (lignes de vue des unités, charge des infectés, projectiles
   dans `updateProjectiles`) : un pas qui change de palier hors rampe est refusé ; un
   projectile tiré d'en bas s'arrête à la falaise, tiré d'en haut la franchit (règle à
   décider). `findFriendlyPath` (`src/core.js`) reçoit le même prédicat d'arête, pas
   seulement `blocked(x, y)` : une falaise ferme une arête, pas une case.
4. **Champ de flux des hordes** (`FlowField.rebuild` et `direction`, `src/game.js`). Les
   quatre voisins ne sont développés que si `canStep` ; coût = `movementCost` + rampe + gué
   (`C.WorldLocal217Rules.costs`). Une case hors d'atteinte garde `0x3fffffff` : un infecté
   qui s'y trouve (chute, apparition) doit avoir un repli. Les murs restent franchissables
   au prix fort (ils se détruisent), une falaise jamais.
5. **Fronts et apparitions** (`prepareWave`, `spawnZombie`, `src/game.js` ;
   `src/horde-horizon217.js` ; `C.wavePlan`, `CARDINAL_FRONTS` et les formes d'assaut de
   `src/core.js`). Les fronts d'une vague se tirent parmi les côtés non `clos` ; l'apparition
   se fait dans les `entries` du côté (au lieu de `80 … WORLD_SIZE-80`). Un plan à quatre
   fronts sur une cité à deux côtés ouverts doit se replier (deux fronts, même effectif :
   la pression reste, elle se concentre) — décision d'équilibrage à prendre et à écrire dans
   `docs/BALANCING.md`. Annonces de vague, horizon de horde et lecture de siège
   (`siege-readout.js`) nomment le passage (« par la rampe du nord »).
6. **Placement des murs et enceintes** (`wallLine`, `placement`, `tactics.js` : enceintes,
   portes, `nearestWall`, `breach217.js`, `fallback-order.js`, `linecare.js`). Une enceinte
   se ferme sur une falaise : le calcul d'enceinte close (cases intérieures atteintes sans
   franchir de mur) doit compter l'arête de falaise comme un mur indestructible, sinon
   aucune enceinte adossée n'est reconnue. Une rampe se barre comme une porte : un mur
   posé sur les 12 cases de la rampe ferme le front. Les brèches (`breach217`) ne
   s'appliquent pas à une falaise. Fossés et talus (`earthworks217.js`) : interdits sur une
   rampe ou à préciser.
7. **Récolte et ouvriers** (`nearestNode`, tâches et points d'approche des ouvriers,
   `src/game.js` ; `linecare.js`). Les gisements sont tous à portée par construction, mais
   parfois sur un autre palier : les trajets passent par les rampes, donc hors des murs si
   la rampe est barrée — à montrer au joueur.
8. **Rendu 2D / 2,5D** (`drawGround` dans `src/game.js`, `src/art.js`, `src/ground135.js`,
   `exploration-125.js` pour les routes d'accès aujourd'hui en croix). Teinte ou ombrage
   par palier, face de falaise dessinée du côté bas (hauteur projetée comme les étages de
   `CityGeometry202.presentation`), rampe lisible, eau (`hydrology165` sait dessiner un
   lit), routes d'après `roads` au lieu de la croix fixe, tri de profondeur des acteurs
   derrière une falaise, brouillard de `visibility146.js` (une falaise coupe-t-elle la vue ?),
   minicarte. Les falaises suivent les mailles de 32 m : prévoir un adoucissement de
   présentation qui ne change pas la grille de collision.
9. **Vue FPS de la citadelle** (`src/vertical-citadel175.js`, `-render.js`, `-state.js`,
   `vertical-network179.js`). La vue partage la simulation : le sol devient un champ de
   hauteur par palier (hauteur d'un cran à fixer en mètres), les falaises des parois
   verticales, les rampes des plans inclinés ; collisions de la caméra par `canStep` ; pose
   verticale des infectés (`vertical175.enemyPose`) décalée du palier. Aucune seconde
   horloge ni tirage : les peintres lisent la grille.
10. **Sauvegarde et campagne** (`save.js`, `frontier-state.js`, module d'extension de la
    tranche d'ouverture). La description locale se recalcule de la graine et de la version
    des règles (`WorldRelief217Rules.version`, `WorldLocal217Rules.version`) : la sauvegarde
    ne garde que ces deux versions et les prélèvements par identifiant de gisement. Geler
    les deux jeux de règles à l'ouverture : après, tout réglage change les cartes.
    `Geo.home` (`geography135.js`) devient le site de `K0_0` ; les quatre approches fixes
    (`D17_E`…) deviennent les `accesses`.
11. **Fiche de graine** (`seed-card217.js`) : phrase d'ouverture et côtés depuis `sheet`.

## T4 — Lieux et sauvegarde creuse

- [x] T4.1 (→ O2, livré hors jeu) Lieux par canton : `K…:site:n`, plans par les fabriques existantes (`G.plan`,
      codex 160, sites 205), occupants par `world-spawns131` et la bande de distance.
- [x] T4.2 (→ O3, livré hors jeu) `frontier-state` : G12 acceptée, bornes de position, expressions d'identifiants
      par génération, registre `cantons`, plafonds.
- [x] T4.3 (→ O3) Validation par cantons cités ; plafond ; refus croisés G≤11 / G12.
- [x] T4.4 (→ O3) `field-atlas-state` : cellules par canton (dans `world-save217.js` ; branchement en O9).
- [x] T4.5 (→ O3) Version de sauvegarde générale **gardée à 20** (voir O3) ; reprise des
      sauvegardes de référence existantes vérifiée.
- Décisions requises : D2, D4, D7.

## T5 (préparation) — Taille de la carte locale par accesseurs, relief local adouci (livré, sans effet en jeu)

Toujours rien d'ouvert : génération 12 refusée partout, aucune option de menu. La carte de la
cité reste de 128 cases (4 096 unités, 128 m).

### Volet B — accesseurs de taille de la carte locale

- [x] T5.B1 Accesseur : `C.localMap217(tiles)` (`src/core.js`), objet gelé — `tiles`, `size`,
      `tile`, `cells`, `extent()`, `centre()` (objet neuf à chaque appel), `centreCell()`,
      `axisMax(pad)`, `clampAxis(v, pad)`, `clampInside(x, y, pad)`, `contains(x, y, pad)`
      (bord admis, `NaN` refusé), `outside(x, y, pad)` (bord admis, `NaN` admis),
      `outsideOpen(x, y, pad)` (bord refusé), `cellInside(gx, gy)`, `cellOf(v)` (= `grid`),
      `index(gx, gy)` (= `index`). Une seule instance en jeu : `C.LOCAL_MAP217 = localMap217(128)`.
- [x] T5.B2 Propriétaires : `WorldMap#local` (accesseur de prototype, aucune propriété propre,
      donc rien de sérialisé ni d'énuméré) et `Game#local` (= `g.world.local`, repli sur
      `C.LOCAL_MAP217` quand le monde manque ou qu'un test le simule). `FlowField` garde la carte
      lue à sa dernière reconstruction et redimensionne `values` si la taille change. Pas de
      `size` posé directement sur `g.world` : plusieurs modules distinguent la région de la cité
      par la présence de `world.size` (replis `w?.size||8192`) ; un accesseur au nom distinct
      (`local`) évite toute confusion.
- [x] T5.B3 Recensement (lignes du commit `f082488`) et conversions, par lots strictement
      équivalents (même expression avec `size` / `tiles` lus sur la carte, ou prédicat qui reprend
      mot pour mot la comparaison ; `a - r - 4` n'est jamais réécrit en `a - (r + 4)`).

  Convertis — lus sur la carte de la partie (`this.local`, `g.local`, `world.local`) :

  | Fichier | Lignes | Usage | Forme |
  | --- | --- | --- | --- |
  | `game.js`, `WorldMap` | 186, 220, 222, 227, 257–270, `add`/`remove`/`rewrite`/`placement` | occupation, `atCell`, `at`, zone constructible, nœuds de ressources | `this.local.cells`, `cellInside`, `cellOf`, `index`, `tiles`, `size` |
  | `game.js`, `FlowField` | 279–299 | champ de flux des hordes (taille, voisins, direction) | carte lue sur `map` à `rebuild` |
  | `game.js`, `Game` | 314–315, 328, 359, 737, 926, 1066, 1077, 1132, 1140, 1239–1240, 1303–1304, 1407–1408, 1634, 1670, 1714, 1775, 1882, 1888, 1968–1972, 2007, 2375, 2382–2402, 2586 | souris, caméra, ralliement, joueur, cœur, ordres d'escouade, déplacements amis, infectés poussés, points d'approche, brèche, apparitions par front, charges, projectiles, sol, minicarte | `this.local.size` / `.tiles`, `outside`, `outsideOpen`, `contains`, `centre()`, `centreCell()` |
  | `game.js`, citadelle (`spawnPoint`) | 3755 | point d'apparition d'un rescapé (`4096` en clair) | `(g.local‖défaut).size` |
  | `departure130.js` | 46, 91–94 | distance au bord, côté de sortie | `g.local` |
  | `frontier.js` | 40, 49, 66, 276 | sortie de la cité vers la région, retour | `g.local` |
  | `expeditions.js` | 44, 69–70, 86, 154 | gabarit du véhicule, sortie du volant, minicarte | `g.local` |
  | `fieldcraft.js` | 40 | position libre | `g.local` |
  | `recon.js` | 5, 61 | point de reconnaissance valide, minicarte | `C.LOCAL_MAP217.contains`, `g.local` |
  | `exploration-pack.js` | 113 | minicarte | `g.local` |
  | `abominations217.js` | 55, 104, 196 | poste de la Meneuse, orientation, minicarte | défaut (fonction pure de la graine), `g.local`, `this.local` |
  | `expeditions-ui.js`, `content-ui.js`, `command-presentation129.js`, `linecare-ui.js` | 20, 31 ; 50, 72 ; 133, 143 ; 35–41 | cartes des dossiers | `g.local` / `game.local` |
  | `return-routes.js` | 9 | grille des itinéraires de retour | `g.local` |

  Convertis — lus sur la carte par défaut (`C.LOCAL_MAP217`), faute de partie à portée (validateurs,
  fonctions pures) ; à brancher sur la carte de la campagne validée à l'ouverture :

  | Fichier | Lignes | Usage |
  | --- | --- | --- |
  | `core.js` (fin de fichier) | 1743, 1761 | véhicule d'expédition, emplacements de nœuds |
  | `save.js` | 20, 29, 33–34, 92, 103 | bornes de position, structures (grille, chevauchement), ralliement par défaut |
  | `squads.js` | 8, 11 | ralliement valide, ralliement par défaut |
  | `tactics.js`, `linecare.js`, `narrative.js` | 47–48 ; 19–20 ; 62–64, 88 | grilles d'enceinte, d'accès et d'approche (largeur par défaut et plafond) |
  | `earthworks217.js`, `world-content.js` | 11 ; 22 | grille des fossés, centre du décor métrique |
  | `fallback-order.js`, `districts.js` | 55 ; 31 | grilles d'enceinte : `C.LOCAL_MAP217?.tiles ?? C.WORLD_TILES` (le cœur est passé en argument, parfois simulé par un test) |

  Restent en clair (lot suivant, ou propriétaire distinct) :

  | Fichier | Lignes | Usage | Raison / à faire |
  | --- | --- | --- | --- |
  | `core.js` | 255, 257, 305, 363 | `grid`, `index`, `wallLine`, `findFriendlyPath` | aides de la carte par défaut, appelées partout ; à paramétrer avec la grille de collision (point 3 ci-dessus) |
  | `game.js` | 96 | orientation d'un infecté à sa création (`Zombie` n'a pas la carte) | passer le centre au constructeur |
  | `game.js` | 3983, 4094 ; `core.js` 1447, 1559 ; `atlas-render.js` 32 | voirie (`InfrastructureRules.worldTiles = 128`, `at` borné à 4 096, vue par défaut) | grille propre à la voirie : à dériver de la carte locale avec elle |
  | `succession133.js` 28, 32 ; `essential-state.js` 8 ; `night-gear.js` 34 ; `survival-pack.js` 15, 57 ; `frontier-state.js` 8, 11 ; `arsenal134.js` 15 ; `fortification-pack.js` 48 ; `exploration-pack.js` 17 ; `vertical-citadel175-state.js` 65, 69 ; `vertical-network179.js` 84 ; `vertical-population181.js` 57 ; `core.js` 840, 929 | validateurs du domaine « local » (4 096 ou `C.WORLD_SIZE` en clair) | lire la carte de la campagne validée (à porter par la sauvegarde, point 10) |
  | `vertical-citadel175.js` 360, `vertical-citadel175-render.js` 164 | sol et siège de la vue FPS | point 9 |
  | `exploration-125.js` 1939, `barricades134.js` 39 | plan des abords (`createFeaturePlan(seed, size)`) | le plan prend déjà la taille en argument : passer `g.local.size` |
  | `exploration-needs217.js` 69, `horde-horizon217.js` 33, `seed-card217.js` 126 | centres par défaut avec repli `‖4096` | présentation ; convertir avec un repli pour les cœurs simulés |
  | `frontier.js` 49, 276 ; `fieldcraft.js` 81 ; `atlas-projection.js` 16 ; `recon-ui.js` 14–71 | centre `2048` en clair (croix des routes historiques, carte de reconnaissance) | à convertir avec la croix des routes (point 8) |

- [x] T5.B4 Preuves (commit `f082488` contre l'arbre de travail) :
      parcours déterministe — `Math.random`, `Date.now`, `performance.now` et `crypto.randomUUID`
      figés, `startNew('standard','17117')`, vague forcée, 240 s de jeu à 30 pas par seconde avec
      déplacements du joueur et un rendu sur quatre (la horde arrive, assiège et détruit le
      cœur vers 100 s) : huit points de contrôle, sauvegardes de départ, de mi-parcours et de fin
      **identiques octet pour octet**. Sauvegarde de mi-parcours d'avant rechargée après (et,
      les fichiers étant identiques, inversement) : même état relu et même état 30 s plus tard.
      Mondes G1–G11 des huit graines : voir le rapport de la tranche (procédure d'en-tête).
      Tests des familles touchées (56 fichiers, 581 cas) : mêmes résultats avant et après
      (580 réussis ; échoue des deux côtés `build: la sortie publique…`, qui lit `dist/`).
      `tests/local-bounds217.test.cjs` (5 cas) : valeurs, 70 000 comparaisons de prédicats (bords,
      `NaN`, infinis, marges fractionnaires), propriétaires et repli, parcours de 70 s avec vague
      et reprise identique quelle que soit la source de l'accesseur (monde, copie, repli), lecteurs
      convertis sans lecture en dur.
- [x] T5.B5 Restant : tableau « Restent en clair » ; puis carte par campagne (`WorldMap` reçoit
      `tiles`), sauvegarde portant la taille, validateurs lisant la carte de la sauvegarde.
      → livré avec O5 (section O5 plus bas).

### Volet A — relief, hors jeu

- [ ] T5.A1 Cols plus rares — **non livré** ; essais mesurés (fenêtre de 7 × 7 cantons, plateaux
      entiers d'au moins 400 mailles, cols naturels et rampes taillées qui les bordent) :

  | Essai | Médiane par grand plateau (8 graines) | Effet de bord |
  | --- | --- | --- |
  | version 3 (livrée) | 8, 9, 14, 12, 14, 8, 8, 9 | — |
  | premier col d'un contour seulement si une région en manque, un de plus par 64 arêtes | 8, 8, 14, 10, 11, 8, 8, 9 | aucun |
  | + part de plateau ouverte sur un voisin dispensée, col en « zone de col » (bruit monde) | 6, 6, 9, 7, 8, 8, 6, 5 (avec routes locales sur 80 % des coutures, rampe taillée à 120) | 3 plateaux fermés jusqu'à 251 mailles (graine 0) ; rampes taillées 62 % des rampes de route ; côtés fermés de la carte locale 212 → 173 sur 400 graines |
  | + seule la part du sud-est porte le col | 7, 8, 9, 10, 10, 10, 7, 7 | 1 plateau fermé de 39 mailles (graine 1) |
  | + petites parts (< 12 mailles) gardent leur col | 7, 8, 11, 12, 12, 10, 7, 7 | aucun plateau fermé ; gain nul |

  Constat : la moitié des passages d'un grand plateau sont des **rampes taillées par les routes**
  (chaque couture franchissable porte une route, chaque canton a son carrefour) ; retirer des cols
  naturels en fait tailler d'autres. Et la garantie « aucun plateau fermé » est locale au canton :
  un plateau qui s'étend sur plusieurs cantons reçoit un col par part. Pistes : propriétaire
  global d'un plateau (remplissage du champ de paliers, borné, depuis chaque part), ou trame
  routière moins dense (T2.7). Rien de ces essais n'est livré.
- [x] T5.A2 Eau qui ferme : prime de rive au choix du site (`foundation.shoreWeight` 6 par côté du
      plat longé à 2 mailles au plus par la mer, un lac ou une rivière, `shoreCap` 1) ;
      `WorldRelief217Rules.version` 4 (empreintes de canton inchangées : seul le site de certaines
      graines bouge). Sur 400 graines : côté fermé par l'eau **5** (0 avant), côté ralenti par un
      gué 25 (17), côté fermé 211 (212), fermé ou passage 295 (303), aucune cité enclavée. Sur les
      50 graines figées : fermé 28 (29), dont eau 2 (0). Limite : K0_0 n'a une rivière ou un lac
      que pour 44 graines sur 200, le socle d'origine étant haut ; un lac rond de 40 à 90 m se
      contourne dans un cadre de 192 m. Un pont seul n'a encore été vu sur aucune graine.
      Pousser plus loin demande d'agir sur l'eau elle-même (débit autour de l'origine).
- [x] T5.A3 Falaises moins en escalier : `WorldLocal217Rules.version` 2, `edge` (amplitude 4 m,
      échelle 40 m, bande 12 m). Chaque case lit la maille d'un point déplacé par un bruit continu
      en coordonnées monde ; le déplacement s'annule près des arêtes de col (rampes droites), des
      coins où deux mailles de même palier ne se touchent qu'en diagonale, du bord du cadre et du
      plat du site, et reste contractant (pente sous 1). Vérifié sur 200 graines hors test et 50 en
      test : mêmes composantes par palier, mêmes rampes, mêmes verdicts de côté ; arêtes de
      ressaut sur une ligne de maille 100 % → 58 % ; 212 cases changées par carte en moyenne.
      `describe(seed, {edge:false})` rend la grille T4, sur laquelle les contrôles stricts de
      cohérence avec le canton sont gardés. Limite : la falaise qui adosse la cité borde le plat,
      donc reste droite.
- [x] T5.A4 Empreintes refigées (`world-local217` : `f34175ea`, `b82c6bc4`, `76e8b703`) ;
      aperçu : sélecteur « Bord de falaise » (décalé / sur les mailles), regardé sur 17117, 42,
      84329 et 1947648717 (empreintes identiques à Node).

## T6 (cadrage) — Plan d'ouverture « expérimental » et première brique O1 (livré, sans effet en jeu)

Décisions de l'utilisateur avant la tranche : le monde sans bord s'ouvrira d'abord comme
**option « expérimental » à la création de partie**, la région finie restant le défaut ; relief
dans la même génération 12 ; cadre de la cité de 192 m et site adossé ; mer comme zone basse.
Toujours rien d'ouvert : génération 12 refusée partout, aucune option de menu.

- [x] T6.P Plan d'ouverture exécutable : [ouverture.md](ouverture.md) — tranches O1 à O10,
      livrables une à une, chacune avec fichiers et lignes, tests, preuve d'innocuité pour
      G1–G11, parcours joueur, ampleur, risque et parallélisme ; décisions ouvertes D-O1 à D-O5.
      Les tâches T4, T5.1–T5.6 et T6.1–T6.2 ci-dessous y sont redécoupées : T4.1 → O2,
      T4.2–T4.5 → O3, T5.1–T5.5 → O9, T5.6 → O9, T6.1–T6.2 → O10 ; la liste en 11 points de
      T4 → O5 (points 1, 10), O6 (2, 3, 4, 7), O7 (5, 6), O8 (8, 9), O9 et O4 (11) ; le
      tableau « exigent tous les lieux » de T1.6 → O4 ; le tableau « Restent en clair » de
      T5.B3 → O5.
- [x] O1 Monde régional G12 hors jeu : `src/world-open217.js`, règles `C.WorldOpen217Rules`
      (`src/core.js`, avant `C.Weather193Rules`), test `tests/world-open217.test.cjs` (9 cas).
      Accesseurs communs du monde fini (`site`, `sitesNear`, `contains` vrai pour tout point
      mesurable, `outside`, `outsideOpen`, `clampInside`, `axisMin`, `axisMax`, `chunkRange`,
      `extent()` infini, `nearestRoad`), plus `roadsAround` / `pickRoad(hash, x, y)` (tirage de
      route sans `% roads.length`) et `route(from, to)` borné au rectangle des deux cantons
      élargi d'un canton, 25 cantons au plus, sur un graphe dont les passages de couture sont
      partagés par leurs deux cantons. Aucun `roads`, `pois`, `size` global.
      Module **absent du jeu** : ni `index.html`, ni `sw.js`, ni build, lu par aucun fichier de
      `src/`. Les listes d'isolement de `tests/world-cantons217.test.cjs` et
      `tests/world-canton-gen217.test.cjs` nomment le nouveau lecteur (aucune garde retirée).
      Mesures (huit graines, 4 itinéraires de 1,9 à 2,9 km depuis D-17) : 31 trouvés sur 32,
      détour de 1,23 à 2,42 fois le vol d'oiseau, 1 150 à 1 590 nœuds, 83 à 168 ms à froid
      cantons compris. Mondes G1–G11 des huit graines identiques à
      `campagne205-eligibilite.json` hors empreintes de sources ; seule l'empreinte de
      `src/core.js` change.
- Réserves : tracé sur les centres de maille, pas sur les courbes adoucies ; lieux sans
  emprise ni `drive` (O2) ; `home` = plat de 64 m du site, à remplacer par le cadre de la carte
  locale en O5 ; aucun `blocked` / `line` : la falaise n'est pas encore un obstacle régional (O2).
- [x] O2 Lieux G12 complets et collisions régionales, hors jeu : `src/world-sites217.js`
      (enveloppe du monde d'O1, qui reste intact), règles `C.WorldSites217Rules` (`src/core.js`,
      juste après `C.WorldOpen217Rules`), test `tests/world-sites217.test.cjs` (13 cas) ; page
      d'aperçu étendue (case « emprises des lieux (O2) », servie par
      `scripts/apercu-cantons217.mjs`). Chaque candidat `K…:site:n` devient un lieu complet par
      (graine, canton, indice) : genre tiré du milieu du lieu (flux `lieu-genre-n`), programme du
      codex par `forParcel` et plan `floor` comme les lieux natifs de G8+ (sinon `G.plan` du
      genre), emprise tournée face à sa route avec le lot de la région finie (w + 26 × h + 48),
      allée raccordée par `frontage174.resolve`, occupation `world-spawns131`, nombre
      d'occupants identique à `frontier-world.threatCount`, occupants `K…:site:n:eN` (étage et
      profil du milieu), détails par la chaîne des campagnes neuves (version 13), plans et
      détails paresseux. Veto : lot dans le canton à 12 m des coutures, sur un seul palier sec,
      sans route ni rivière, hors du site de fondation et des autres lots. Accesseurs ajoutés :
      `site` (lieu complet ; `candidate` = candidat brut d'O1), `sitesNear` par emprise tournée,
      `nearPOI`, `plan`, `detailAt`, `drive`, `driveFor`, `connectionFor`, `threatCount`,
      `occupants`, `chunk(cx, cy)` (256 m, clé signée, arbres `K…:arbre:n` et rochers
      `K…:roche:n` par flux `arbres-j` / `roches-j`), `around`, `containers`, `blocked`,
      `line`, `opticalBlocked`, `movementLine`, `vehicleClear`, `lineOfSight`, `levelAt`,
      `edgesIn`. Obstacles : une arête de falaise bloque le pas et la voiture, une rampe (col
      naturel ou taillé) se franchit, la mer, les lacs et les cours d'eau bloquent sauf sur un
      pont (règle G8+) ; **D-O1** : `lineOfSight` (et `line` en vue ou en tir) est arrêté par
      une arête de falaise montante plus haute que le palier du tireur, jamais en descendant ;
      règle pure `SIGHT.blocks(tireur, avant, après)`.
      Mesures : 45 % des candidats deviennent des lieux (17117 : 222 sur 489 en 7 × 7 cantons ;
      refus surtout par lot voisin, palier, route, raccord) ; un tiers à la moitié des lieux
      portent un programme du codex ; mobilier d'un canton 1 ms en médiane hors génération
      (6,5 ms dans le navigateur), morceau de 256 m 2 ms en médiane ; 200 cantons : toutes les
      arêtes de falaise bloquantes, aucune rampe bloquée par le relief. Mondes G1–G11 des huit
      graines identiques à `campagne205-eligibilite.json` hors empreinte de `src/core.js`.
- Réserves O2 : le tracé adouci `road.points` coupe parfois l'angle d'une falaise près d'une
  rampe (moins de 0,2 % des points de route refusés à la voiture) : à reprendre avec le rendu
  (O8) ou le générateur ; plus de la moitié des candidats restent sans lieu (aucun second
  essai de position) ; les lots refusent toute route sur leur arrière (plus strict que la
  région finie, dont les clôtures de détail peuvent toucher une route) ; `line` refuse un
  segment de plus de 512 m ; pas de nids de `remarkable217` (O4) ; un détail du codex coûte
  50 à 1 000 ms au premier appel (chargement des grilles), à surveiller en O9.

## O4 — Lecteurs de voisinage (premier lot livré, sans effet en jeu)

Fiche : [ouverture.md](ouverture.md), O4. Test `tests/world-neighbourhood217.test.cjs` (5 cas).

- [x] O4.1 Accesseurs sur les deux mondes. Région finie (`src/frontier-world.js`) : chacun rend
      exactement l'ancien parcours de toute la liste, dans son ordre. Monde G12 hors jeu
      (`src/world-open217.js`) : mêmes noms, réponses par cantons, aucune liste globale ; bornes
      reprises de `nearMaxRadius` (aucune règle nouvelle, `src/core.js` inchangé).

  | Accesseur | Région finie (G1–G11) | Monde G12 |
  | --- | --- | --- |
  | `sitesIn({left, top, right, bottom})` | lieux dont `x ± w`, `y ± h` touche le rectangle (critère de `atlas-render.js`), ordre de la liste, `NaN` jamais écarté | centre dans le rectangle, ordre canonique ; côté ≤ 2 × `nearMaxRadius`, refus sinon (pas encore d'emprise : O2) |
  | `seenSites(ids)` | `pois.filter(p => ids.has(p.id))` (liste ou ensemble), ordre de la liste, doublons de la liste gardés | `site(id)` pour chaque identifiant, ordre des identifiants, doublons et inconnus écartés |
  | `nearestSite(x, y, filtre, rayonMax)` | premier lieu de distance minimale dans l'ordre de la liste (`<` strict, comme `seed-card217.js`) | recherche par anneaux de cantons, arrêt dès qu'un lieu retenu est à moins de (k − 1) cantons ; égalité : ordre canonique ; rayon ≤ `nearMaxRadius` |
  | `sitesByDistance(x, y, filtre, rayonMax)` (ajouté à la fiche) | `pois.filter(filtre).sort(distance ‖ id.localeCompare)` : le tri recopié par `campaign-pack`, `essential-state`, `field-atlas` | `sitesNear` filtré, même tri |
  | `siteIndex()` | `new Map(pois.map(p => [p.id, p]))` neuve à chaque appel (le **dernier** doublon gagne, comme les `Map` actuelles) | index paresseux gelé `{get, has}` par `site(id)` ; ni `size` ni parcours |

- [x] O4.2 Lecteurs convertis, chacun avec un repli historique identique quand le monde n'a pas
      l'accesseur (mondes factices des tests) :

  | Lot | Fichier | Avant | Après |
  | --- | --- | --- | --- |
  | lieux remarquables | `remarkable217.js` `select` | toute la liste groupée par canton de 4 096 m (clé `cy*4096+cx`) | cantons de l'étendue parcourus ligne puis colonne (même ordre que les clés triées), chacun lu par `sitesIn` du canton puis `floor(x / 4096)` ; rang, espacement, plafonds inchangés. Monde sans bord (étendue non bornée) : liste vide, comme avant, sans lire `pois` |
  | fiche de graine | `seed-card217.js` `sources` | plus proche carrière, scierie, casse dans toute la liste | `nearestSite` |
  | atlas | `atlas-render.js` voies d'accès (44), emprises et parkings (80), étiquettes (92) | `pois` filtrés par `seen` | `seenSites` (44, 92), `sitesIn(caméra)` puis critère d'origine (80) |
  | lieux vus | `field-atlas-ui.js` (22), `frontier-ui.js` (19), `world-codex-actions159.js` (68, 100), `field-atlas.js` biomes connus et étapes (26, 28), `campaign-pack.js` candidats (62) | `pois.filter(seen…)` | `seenSites` puis le reste du filtre et du tri d'origine |
  | plus proche par secteur | `field-atlas.js` `pool` (11) | `pois.filter(secteur).sort(distance ‖ id)` | `sitesByDistance` |
  | index | `frontier.js` `revealSites`, `exploration-needs217.js` (106), `urban.js` (43), `outposts217.js` `book` | `new Set` / `new Map` de toute la liste | `siteIndex()` (lectures `get` / `has` seulement) |

- [ ] O4.3 Restent sur toute la liste (à convertir avec leur tranche) :

  | Fichier | Usage | Pourquoi pas dans ce lot |
  | --- | --- | --- |
  | ~~`frontier-state.js:33`, `field-atlas-state.js:20`, `world-pack131.js:12`, `campaign-water214.js:43,130`, `campaign-pack.js:42`, `context-operations160.js:32`, `world-evolution-state.js:28`~~ | index ou ensemble de toute la liste dans un validateur de sauvegarde | **converti avec O3** : `siteIndex()` (voir O3) |
  | ~~`essential-state.js:12` (`targets`)~~ | plus proche lieu d'un type, puis plan intérieur | **converti avec O3** : `sitesByDistance` |
  | `chronicles131.js:45` | lieux d'un type triés par hachage sur toute la région | tri global par hachage, pas une distance : demande une règle par canton (G12), à décider avec O2 |
  | `night-gear.js:156` | panneaux solaires des lieux de six types | cache par canton chargé : avec le chargement par anneau (O9) |
  | `frontage174.js:88,90,114` | index et audit des façades | construction de la région finie ; index par canton avec O2 |
  | `world-pack131.js` (préparations G5–G11, `normalize`) | activations | sans objet en G12 (inchangé, voir la fiche) |
  | `campaign-services208.js`, `campaign-water-supports214.js`, `frontier-world.js` (`contextSites160` sans point, `install`) | replis des mondes factices, construction | inchangés (T1.6) |

- Lieux remarquables en G12 : la sélection finie est une **chaîne** — l'espacement (1 000 m) est
  vérifié contre tous les lieux déjà retenus dans l'ordre des cantons, et le plafond de 512 est
  global. Un canton dépend donc de tous ceux qui le précèdent, ce qu'un monde sans bord ne peut pas
  recalculer localement. Le monde fini garde cette chaîne (sélection identique). Le monde G12
  appliquera une règle locale, propre aux nouvelles campagnes G12 : candidats d'un canton de
  4 096 m par `sitesIn` (côté exactement à la borne de 2 × 2 048 m), rang par hachage inchangé,
  au plus `perCanton` ; espacement résolu contre les **candidats bruts** des huit cantons voisins
  (le plus petit hachage l'emporte), sans dépendre de leur propre sélection ; pas de plafond
  global (le registre sauvegardé reste plafonné à 512). Rien de cela n'est codé : `select` rend
  une liste vide en G12, comme avant ; décision à prendre avec O2 (types et emprises des lieux G12).
- Preuves (base `9940aa1`, même worktree) :
  - test d'équivalence sur G4, G8, G11 de 17117 et 42 : 300 rectangles par monde (dégénérés,
    hors région, `NaN` compris), 40 listes de lieux vus (inconnus et doublons compris), plus proche
    lieu et liste triée pour chaque type depuis 28 points, index par identifiant : mêmes objets,
    même ordre ; lecteurs convertis contre leur repli historique (lieux remarquables, fiche de
    graine entière, lieux et programmes connus du codex) : sorties identiques ; en G12, contre un
    calcul exhaustif sur 7 × 7 cantons, et aucun lecteur converti ne lit `pois`, `roads` ni `size` ;
  - lieux remarquables et fiche de graine des huit graines de référence en G8 et G11, base contre
    tranche, deux processus : JSON identique octet pour octet (43 à 50 lieux remarquables par monde) ;
  - mondes G1–G11 des huit graines identiques à `campagne205-eligibilite.json` hors empreintes de
    sources ; seules les empreintes des fichiers touchés changent ;
  - parcours déterministe de T5.B4 (240 s, graine 17117) : sauvegardes de départ, de mi-parcours
    et de fin identiques octet pour octet, résultats identiques ; sauvegarde de mi-parcours d'avant
    relue après : mêmes empreintes que relue avant ;
  - navigateur (Playwright, campagne standard 17117, G8) : 60 lieux révélés autour de D-17, carnet
    ouvert sur l'atlas, cadrage « tout voir » : liste des lieux, lieux remarquables (44), biomes
    connus, programmes du codex (56) et leurs lieux, besoins d'exploration, image du canevas de
    l'atlas et capture de page **identiques** à la base ; aucune erreur de page.
- Réserves : le parcours de 240 s reste dans la cité (il ne lit ni l'atlas ni la région) ;
  l'atlas, la fiche, le codex et les lieux remarquables sont couverts par le test d'équivalence et
  le parcours navigateur. Sur la région finie, `sitesIn` et les autres accesseurs parcourent
  encore la liste : même coût qu'avant (les lieux remarquables lisent 49 cantons une fois par
  monde, résultat gardé).

## O3 — Sauvegarde G12 creuse (livré, hors jeu ; G12 toujours non créable)

Fiche : [ouverture.md](ouverture.md), O3. Test `tests/world-save217.test.cjs` (8 cas).

- [x] O3.1 Module hors jeu `src/world-save217.js` : `initial(home)`, `normalize` (forme seule,
      clés exactes, identifiants `K…` seulement), `cited` (cantons cités, du plus proche du
      joueur au plus lointain), `validate(état, données)` (au plus `maxCantons` = 64 cantons
      générés dans un monde O2 neuf, contrôles de la région finie ; au-delà, forme seule),
      `lastValidation()` (cantons cités, vérifiés, de forme seule, générés), `cell` et
      `normalizeAtlas` (carnet de reconnaissance `K…:cell:n`). Règles `C.WorldSave217Rules`
      drapeau `C.WorldSave217Rules.open` (faux ; fiche O3).
- [x] O3.2 `frontier-state.js` : délégation au module seulement s'il est présent **et** ouvert ;
      sinon chemin inchangé. En jeu, la globale n'existe pas : génération 12 refusée.
- [x] O3.3 Validateurs restés sur la liste complète (O4.3) convertis à `siteIndex()` /
      `sitesByDistance`, repli historique identique : `frontier-state.js`,
      `field-atlas-state.js`, `world-pack131.js` (`normalize`), `campaign-water214.js` (43, 130),
      `campaign-pack.js` (44), `context-operations160.js`, `world-evolution-state.js`,
      `essential-state.js` (`targets`).
- [x] O3.4 Gardes d'isolement de `world-cantons217`, `world-canton-gen217`, `world-open217` et
      `world-sites217` étendues au nouveau lecteur (aucune retirée) ; garde propre au module :
      seul `frontier-state.js` le nomme dans `src/`, sans le charger.
- [ ] O3.5 (O9) `limitsForGeneration(12)` = limites d'O1 ; `field-atlas-state` appelle
      `normalizeAtlas` ; identifiants de cueillette G12 (aucune cueillette G12 aujourd'hui) ;
      sections de sauvegarde qui recréent le monde (services, hordes, campagne…) en G12.
- `SAVE_VERSION` gardé à 20 (raisons : fiche O3).
- Preuves (base `c9e60c2`, copie intacte de la base contre le worktree) :
  - tests `save*`, `frontier*`, `codex-campaign*`, `world-*217`, `audit183-manifest`, `static*`
    et tous les tests qui nomment un module touché (106 fichiers) : 954 / 954 avant ; après, 959 / 962 au premier passage
    (nouveau test compris) : `anchor-consumers135` (monde recopié avec d'autres `pois` mais
    l'accesseur de l'original : `essential-state` ne lit désormais l'accesseur qu'en monde sans
    bord), `world-open217` (règles figées : le drapeau `open` passe dans `C.WorldSave217Rules`)
    et `world-neighbourhood217` (liste des lecteurs hors jeu étendue) ; corrigés, 198 / 198 sur
    ces fichiers, `world-*217` et tous les tests de l'état essentiel ;
  - mondes G1–G11 des huit graines identiques à `campagne205-eligibilite.json` hors empreintes
    de sources (seules les tailles des neuf fichiers touchés changent) ;
  - parcours déterministe de 240 s (graine 17117) : sauvegardes de départ, de mi-parcours et
    de fin identiques octet pour octet, résultats identiques ; sauvegarde de mi-parcours d'avant
    relue après : mêmes empreintes que relue avant ;
  - 2 × 2 100 falsifications de coordonnées (méthode de T1) : verdicts identiques (346
    acceptées) ; 24 falsifications d'identifiants de lieu d'une sauvegarde G11 en région (dont
    `worldEvolution.structures`) : verdicts identiques ;
  - sauvegarde G12 synthétique (17117, 60 cantons plein est) écrite, relue octet pour octet,
    36 falsifications nommées et 352 identifiants décalés refusés ; refus croisés G≤11 / G12 ;
  - navigateur (campagne standard 17117) : départ en G8, module G12 absent, drapeau fermé,
    sauvegarde valide en version 20, registre G12 refusé (`Génération inconnue`), aucune
    erreur de page.
- Réserves : aucune campagne G12 jouée (G12 non créable) ; le registre G12 n'est éprouvé que
  par la campagne synthétique ; au-delà de 64 cantons cités, la validation est de forme seule
  (D4) ; la validation recrée un monde neuf à chaque relecture (environ 20 ms par canton cité).

## O5 — Carte de la cité par campagne (livré, sans effet en jeu)

Fiche : [ouverture.md](ouverture.md), O5 (décision D-O5 : la cité reste à 192 m en G12). Toute
campagne G1–G11 garde 128 cases ; la sauvegarde n'écrit rien de plus.

- [x] O5.1 Règles et accesseurs (`src/core.js`) : `C.LocalMap217Rules` (`defaultTiles` 128,
      `generationTiles` {12 : 192}) ; `C.localMapOf217(source)` (données de sauvegarde —
      `localTiles` absent = carte par défaut — ou carte rendue telle quelle ; une instance par
      taille) ; `C.campaignLocal217(data)` (carte des données validées ; sans données, carte de la
      partie en cours ; sinon carte par défaut). `grid`, `index`, `wallLine` : carte en dernier
      argument facultatif ; `findFriendlyPath` : défaut `LOCAL_MAP217.tiles`.
- [x] O5.2 Cité (`src/game.js`) : `WorldMap(seed, géométrie, carte)` garde sa carte dans une
      table faible (rien de sérialisé ni d'énuméré) ; `restoreSave` construit le monde sur
      `C.localMapOf217(data)` ; `serialize` écrit `localTiles` seulement s'il diffère de 128 ;
      `Zombie` reçoit la carte (orientation vers son centre) ; les `grid(…)` des méthodes de
      `Game`, `wallLine` et `findFriendlyPath` lisent `this.local` ; sections (`squads.js` :
      `create`, `normalize`, `withOrder` reçoivent la carte). `WORLD_SIZE` / `WORLD_TILES` ne sont
      plus lus par `game.js`.
- [x] O5.3 Sauvegarde (`src/save.js`) : `localTiles` absent = 128 ; refusé s'il vaut 128 en clair,
      s'il n'est pas entier ou s'il diffère de la taille que `generationTiles` associe à la
      génération déclarée (192 en G12, que le registre régional refuse toujours). Bornes des
      positions, des structures et du ralliement lues sur cette carte.
- [x] O5.4 Tableau « Restent en clair » de T5.B3 entièrement converti, repli local identique :
      cœur (`grid`, `index`, `wallLine`, `findFriendlyPath`) ; orientation d'un infecté ; voirie
      (`Infrastructure` : clé, cellules 1…taille − 2, `at`, `line`, `quote`, `findRoute` plafonné
      par la carte, `Engine(raw, carte)` ; `game.js` : emprise, `findPath`, `drawRoads`,
      `atlas-render.js`) ; validateurs « local » (`succession133`, `essential-state`,
      `night-gear`, `survival-pack`, `frontier-state` — l'ancre ; la position initiale
      `4162, 4096` est régionale et reste —, `arsenal134`, `fortification-pack`,
      `exploration-pack`, `vertical-citadel175-state`, `vertical-network179`,
      `vertical-population181`, territoires, expéditions, décor `Fieldcraft`) ; vue FPS
      (`vertical-citadel175.js` siège, `-render.js` sol) ; plan des abords (`exploration-125.js`
      suit `game.local.size`, `barricades134.js` avec la carte dans la clé du cache) ;
      présentation (`exploration-needs217`, `horde-horizon217`, `seed-card217`) ; centre `2048`
      en clair (`frontier.js`, `fieldcraft.js`, `atlas-projection.js` `exitSide(p, context)`,
      `recon-ui.js`) ; et, hors tableau, `128,128` des recherches de chemin (`game.js`
      territoires, `recon.js`) et `127` / `128` de `fieldcraft.js` (repli des infectés).
      Les migrations qui normalisent territoires, voirie, région, expéditions et décor reçoivent
      la sauvegarde lue.
- [x] O5.5 Tests : `tests/local-bounds217.test.cjs` de 5 à 9 cas — règles et accesseurs ;
      lecteurs convertis (motifs présents, lectures nues absentes) ; sauvegarde (aucun champ à
      128, refus de 128 en clair, 192 hors G12, `'192'`, `null`, 64, 191,5, et G12) ; **fumée hors
      jeu à 192 m** : `C.localMap217(192)` passée à une `WorldMap` construite à part (36 864
      cases, gisements au-delà de 4 096, construction en 180, 180), au champ de flux (toute case
      atteinte, direction vers le centre), à la voirie, aux territoires et à sept validateurs
      (bivouac, débris, ancre, véhicule, décor, ralliement, éclairage) qui acceptent à 192 la
      position que la carte par défaut refuse ; la partie en cours ne bouge pas.
- [x] O5.6 Preuves (base `c9e60c2` contre l'arbre de travail) : parcours déterministe de 240 s
      (procédure 3) — sauvegardes de départ, de mi-parcours et de fin identiques octet pour octet,
      huit points de contrôle identiques ; sauvegarde de mi-parcours d'avant relue après et
      inversement : même état relu, même état 30 s plus tard. Mondes G1–G11 des huit graines :
      `audit-campaign-sites205` identique à `campagne205-eligibilite.json` hors empreintes de
      sources. 119 fichiers de tests des familles touchées (sauvegardes, sections, voirie,
      territoires, expéditions, terrain, région, survivants tombés, services, nuit, bivouacs,
      armurerie, fortifications, exploration, citadelle et vue FPS, barricades, horizon de
      horde, fiche de graine, reconnaissance, atlas, `static`, `audit183`, `siege-readout`,
      `fallback-order`, `breach217`) : 1 516 cas réussis avant, 1 520 après (les 4 nouveaux),
      aucun échec. `tests/codex-campaign*` : 31 sur 31. Navigateur : partie 17117, vague,
      sauvegarde, puis citadelle verticale, affût pris, vue FPS demandée — aucune erreur de page ;
      le Chromium sans écran perd le contexte WebGL et revient à la vue classique, **comme la
      base** (rendu FPS non vu à l'image, couvert par les tests de la citadelle).
- [x] O5.7 Coût du champ de flux (préparation de D-O5 ; médiane de 60 reconstructions, machine
      partagée et chargée) : carte nue 5,7 ms à 128 cases, 15,7 ms à 192 (× 2,7) ; avec les
      enveloppes de `movementCost` posées par la partie (décor métrique, obstacles), 72 ms à 128
      et 170 ms à 192 (× 2,4 ; enveloppes recopiées sur la carte de 192, qui lisent encore le
      monde de 128 hors de ses bornes : ordre de grandeur seulement). Le coût vient surtout des
      enveloppes : O6b doit les optimiser (coût par case mis en cache, reconstruction
      incrémentale) plutôt que la taille.
- Réserves : les reprises et instantanés de modules sans données (`restore`, `snapshot`) lisent
  la carte de la partie en cours, juste après le remplacement du monde ; un validateur appelé sans
  données pendant l'import d'une autre campagne lirait la carte de la partie affichée (aucun cas
  relevé ; à garder en tête pour O3/O9). Les lecteurs « par défaut » de T5.B3 sans partie à portée
  (`tactics.js`, `linecare.js`, `narrative.js`, `earthworks217.js`, `great-works217.js`,
  `world-content.js`, `fallback-order.js`, `districts.js`, `abominations217.js` poste,
  `recon.js` `valid`) gardent la carte par défaut : à brancher avec O6/O7. `AtlasRules`
  (`localUnits`, empreinte de D-17 dans la région) et la position régionale initiale restent à
  128 m : O9/O10. Rien n'a été joué à 192 m dans une partie.

## O6a — Carte de la cité de 192 m née de `world-local217` : terrain et gisements (livré, sans effet en jeu)

Fiche : [ouverture.md](ouverture.md), O6 (points 2, 3, 4 et 7 de la liste de T4 ; décisions D-O1, D-O5).
Atteinte seulement par un harnais de test qui construit une `WorldMap` à part : la génération 12
reste refusée partout, aucune option de menu, `world-local217.js` toujours absent d'`index.html`.

- [x] O6a.1 Chemin de construction séparé (`src/game.js`) : `WorldMap(graine, géométrie, carte,
      terrain)` ; `terrain` = `DeadwallWorldLocal217.describe(graine)` (génération 12, `frame` égal à
      la carte, `tile` 1, `unit` 32, tableaux de la taille de la carte, même graine — sinon refus).
      `buildTerrain217` n'exécute rien de la génération G1–G11 (`generateNodes`, contenu généré, lieux)
      et ne tire rien : terrain copié dans une table faible (`world.terrain217` : paliers, arêtes,
      eau, routes, natures, plus `deep` — mer, lac, rivière sans pont — et `ford` — ruisseau sans
      pont), rien d'énuméré en plus d'une carte plate.
- [x] O6a.1b Règles (`src/core.js`) : `C.CityTerrain217Rules` (`version` 1, `generation` 12,
      `rampCost` 30, `fordCost` 20, unité du pas du champ de flux, 10 par case) — mêmes valeurs que
      `C.WorldLocal217Rules.costs`, relues par le test ; `game.js` ne nomme toujours pas le module de
      carte locale (garde de `tests/world-local217.test.cjs`).
- [x] O6a.2 Gisements : les 192 candidats (`K0_0:gite:n` : 40 pierre, 100 bois, 52 ferraille)
      deviennent des `ResourceNode` (mètres × `TILE`, quantité et rayon de la description,
      `depositId` gardé, variante `seededHash(n, graine, 217) % 4`). Ni vivres ni carburant.
- [x] O6a.3 Terrain dans la cité : enveloppes non énumérables propres au monde de terrain —
      `solidForFriendly` (eau profonde = obstacle), `movementCost` (+ `C.CityTerrain217Rules.fordCost` 20 sur un gué),
      `placement` (« Emprise à cheval sur deux paliers », « Emprise sur l’eau », « Emprise sur une
      rampe : seuls murs et portes la barrent »). Accesseurs : `terrainAt217(x, y)`,
      `canStep(gx, gy, nx, ny)` (voisine ou diagonale ; carte plate : toujours vrai dans la carte),
      `walk217` (cases d'un segment), `stepClear217(x0, y0, x1, y1)`.
- [x] O6a.4 Arêtes de falaise dans les collisions (avance sur O6b, chemin G12 seulement) :
      `moveFriendly` (chaque axe), `moveUnitToward` (ligne directe refusée à travers une falaise ;
      `findFriendlyPath` reçoit un prédicat d'arête en 7e argument, que l'enveloppe de la voirie
      laisse au chemin ami de base), `hostilePositionClear` (segment depuis la position de
      l'infecté : déplacement ordinaire, charge, repoussée, séparation, chasse, couloir du traqueur).
- [x] O6a.5 D-O1 : `sightObstruction217(de, vers, palier)` coupe un segment qui monte une arête de
      falaise hors rampe vers un palier plus haut que celui du tireur ; lu par `hasLineOfSight` et
      `hostileLineClear`. D'en haut on voit et on vise en contrebas ; d'en bas, non. La fraction
      d'obstacle rendue est prête pour `updateProjectiles` (O6b ; le palier de départ d'un projectile
      reste à capter à son tir).
- [x] O6a.6 Champ de flux (`FlowField.rebuildTerrain217`, D-O5) : arête de falaise et eau profonde
      jamais développées (une falaise ne se détruit pas), `rampCost` 30 sur l'arête de rampe, coût de
      case (`movementCost` et ses enveloppes) lu une fois par case et par reconstruction ;
      `direction` ne désigne jamais une voisine derrière une falaise. Case hors d'atteinte :
      `0x3fffffff`, exactement les cases à `cost` −1 de la description.
- [x] O6a.7 Coût mesuré (médiane de 15 reconstructions, machine partagée ; enveloppes de la partie
      17117 déléguées sur le monde de 128, ordre de grandeur) : partie actuelle à 128 cases 43 à 47 ms ;
      carte plate de 192 sans cache 115 à 121 ms (environ 120 000 appels de coût) ; **terrain G12 de
      192 avec cache 13 à 14 ms (17117 : deux tiers du cadre hors d'atteinte), 26 à 28 ms (42, 46)**,
      un appel de coût par case atteinte. Dans Chromium (harnais dans la page, deux passages) : 9 à
      19 ms, description 87 à 218 ms. L'optimisation reste propre au chemin du terrain : le champ des
      cartes G1–G11 n'a pas changé de code. Preuve d'équivalence : sur les parties 17117, 42 et 84329,
      un monde de terrain plat (128 cases, mêmes enveloppes) rend le même champ **octet pour octet**
      que `rebuild` historique, et la même `direction` sur 200 points.
- [x] O6a.8 Tests : `tests/local-g12-map217.test.cjs` (8 cas) — chemin séparé (aucun
      `generateNodes`, gisements posés à portée, à sec, hors rampe ; refus d'une autre graine, taille,
      génération ou d'un tableau tronqué ; partie en cours inchangée) ; déterminisme (monde et champ) ;
      falaise infranchissable (arêtes, ami, infecté, champ, `direction`, 4 000 pas relus contre la
      grille, cases hors d'atteinte identiques à la description) ; rampe franchissable (pas, ami,
      chemin ami, survivant mené du bas au haut par la rampe sans un pas à travers la falaise) ;
      centre atteint depuis chaque côté ouvert par la pente du champ, aucun côté clos atteint, fronts
      de `siege` concordants ; construction refusée (paliers, eau, rampe ; mur et porte admis) ;
      D-O1 ; champ identique et coût. Graines 17117 (couloir est-ouest), 42 (rampes), 46 (rampes et
      eau profonde).
- [x] O6a.9 Innocuité : parcours déterministe de 240 s (procédure 3, base `cc9efd9` contre l'arbre de
      travail) — sauvegardes de départ, de mi-parcours et de fin identiques octet pour octet, huit
      points de contrôle identiques, reprises croisées identiques. Mondes G1–G11 des huit graines :
      `audit-campaign-sites205` identique à `campagne205-eligibilite.json` hors empreintes de sources
      (`src/core.js`, `src/game.js`). Navigateur : partie 17117, vague, aucune erreur de page ; harnais
      G12 construit dans la page à côté de la partie, sauvegarde de la partie inchangée.
- Réserves : rien n'a été joué en G12 ; pas de vivres ni de carburant dans les gisements, décor
  métrique non replacé (`packMetricScenery202`), lieux absents ; projectiles, contrôles directs des
  ouvriers (points d'approche, nettoyage), voirie (`findRoute` sans arête), véhicule et
  reconnaissance ignorent encore les falaises (O6b) ; un infecté posé sur une case hors d'atteinte
  reste sur place (repli O6b/O7) ; le palier 0 et le palier 1 ne se joignent que par une rampe,
  comme dans `world-local217` ; une emprise de mur ou de porte peut chevaucher une rampe mais pas
  deux paliers ; la vue D-O1 est centrée sur les cases (pas de hauteur d'œil ni de bord de falaise
  adouci, O8).

## O8a — Rendu 2D/2,5D des falaises, rampes, eau et routes (livré, présentation seule, hors jeu)

Fiche : [ouverture.md](ouverture.md), O8 (point 8 de la liste de T4 ; décision D-O1). Atteint seulement par
un harnais qui remplace le monde d'une partie par une carte de terrain (`tests/helpers/terrain-game217.cjs`) :
la génération 12 reste refusée, aucune option de menu, le module n'est pas chargé par `index.html`.

- [x] O8a.1 Module `src/terrain-art217.js` (`DeadwallTerrainArt217` : `prepare`, `drawGround`, `depthEntries`,
      `backEntries`, `hiddenBehind`, `drawMinimap`, `summary`, `colourAt`) ; règles de présentation
      `C.TerrainArt217Rules` (`cliffMetres` 4, `bevel` .35, `bankMaxCells` 4, `edgeFadeMetres` 6, `grain` 7).
      Lit `world.terrain217` seulement ; données de peinture dérivées une fois par terrain (table faible).
- [x] O8a.2 Sol : teinte par palier, grain par hachage de case, image d'un pixel par case agrandie avec
      lissage (adoucissement des bords de palier, des rives et des routes ; repli par bandes sans canevas).
      Eau d'après `water` avec lit (berge `Hydrology165Rules.kinds[…].bankWidth`, au plus 4 cases), routes
      d'après `roads` (trois classes, pont sur l'eau). Sur un monde de terrain : ni croix fixe, ni cour, ni
      cadre (fondu de 6 m), ni plan d'`exploration-125.js` (routes, stations, cours, minicarte).
- [x] O8a.3 Falaises : face visible du côté bas, hauteur projetée `cliffMetres` × 16 unités par mètre et par
      cran (64 unités) ; arêtes est-ouest en ombre latérale ; rebord arrière dans la file de profondeur
      (`kind` 8, profondeur = arête) : acteur du contrebas derrière le rebord peint avant lui, acteur du
      plateau après.
- [x] O8a.4 Rampes : sens de la pente par les arêtes franchies, ombrage, trois marches par case, chevrons.
- [x] O8a.5 Minicarte (`renderMinimap`) : terrain, traits de falaise, rampes.
- [x] O8a.6 D-O1 dans `visibility146.js` : rayon local coupé par une falaise vers le haut avant tout autre
      calcul (couvre aussi le chemin en hauteur : géants, bouches de tir).
- [x] O8a.7 Tests : `tests/terrain-art217.test.cjs` (6 cas) — isolement et test statique (ni tirage, ni
      horloge, ni affectation sur la partie, appels gardés par le terrain) ; G1–G11 : séquence d'appels de
      dessin identique avec et sans le module, module jamais appelé ; falaises (toutes les arêtes de falaise
      nord-sud une fois, côté bas, hauteur projetée), tri derrière/rebord/dessus ; rampes (graine 0 : deux
      rampes de 144 cases), routes, teintes, rivière et berge (graine 46), minicarte ; D-O1 (infecté et géant,
      vu d'en haut, pas d'en bas) ; sonde de 600 images sur 17117 et 46 (aucun tirage ni horloge pendant les
      appels du module, état, monde, terrain et `streamStats` régionaux inchangés).
- [x] O8a.8 Innocuité : arbre de travail contre la base `5b0d8ab` (horloges et tirages figés, partie 17117,
      quatre vues puis vague 1 forcée et 60 s à 30 pas par seconde, un rendu tous les 150 pas, minicarte
      comprise) : 299 751 appels de dessin et sauvegarde finale identiques. Navigateur : partie 17117 lancée
      par le menu, harnais de terrain 17117, 0 et 46 (`scripts/browser-terrain-art217.mjs`), aucune erreur
      de page ; deux infectés témoins par graine (derrière un rebord : masqué ; sur le plateau : visible).
- Réserves : 17117 n'a **pas de rampe** dans la version 2 de la carte locale (couloir fermé au nord et au
  sud) ; les rampes sont montrées sur 0 et 46. La hauteur peinte d'un cran (4 m) est une valeur de
  présentation : la hauteur jouée reste à fixer en O8b (D-O3). Les acteurs ne sont pas décalés par palier
  (chaque palier peint à sa vraie position) ; projectiles, particules et textes flottants ne passent pas
  par la file de profondeur et restent visibles devant un rebord. Les modules de la partie qui lisent les
  lieux et le plan G1–G11 (quartiers, sites nommés, d-17) ne savent pas encore vivre sur un monde de
  terrain : le harnais met la partie en pause et appelle la minicarte de base (O9/O10). La vue D-O1 reste
  centrée sur les cases (pas de hauteur d'œil).
## O6b — Arêtes de falaise dans la cité de 192 m (livré, sans effet en jeu)

Fiche : [ouverture.md](ouverture.md), O6b (décisions D-O1, D-O5). Toujours atteint par un harnais seulement :
la génération 12 reste refusée, `world-local217.js` absent d'`index.html`. Le harnais de
`tests/open-city217.test.cjs` donne à la partie complète du test (modules chargés) le monde de terrain, un centre
au milieu et son champ de flux, puis joue les méthodes du jeu (`updateUnits`, `updateZombies`,
`updateProjectiles`, contrôles de `fieldcraft`) ; les quartiers et le bilan de la cité, qui ne lisent pas encore
ce monde, sont laissés de côté pendant la pose du mur.

- [x] O6b.1 Projectiles (D-O1) : `Game#shot217` capte le palier du tireur au tir (tir du joueur, `fireFriendly` :
      tourelles et soldats) ; `updateProjectiles` ajoute `sightObstruction217(p, fin, palier)` aux obstacles (le
      projectile s'arrête à la fraction de l'arête) ; repli sur le palier du premier point pour un projectile créé
      ailleurs. `projectileOrigin` fait partir du tireur un tir dont la bouche passerait au-dessus d'une falaise
      montante. Carte plate : aucun champ, aucun appel.
- [x] O6b.2 Contrôles directs des ouvriers : `workerCanWorkAt` (segment sans falaise), `workerBuildExit` (point de
      sortie sur le palier de l'ouvrier), `workerCleanupTarget` (face de nettoyage sur le palier du mur). Dans la
      partie complète, `fieldcraft.js` remplace `moveFriendly` et `workerCanWorkAt` : `cliff217` est lu par son
      `moveFriendly` (chaque sous-pas, chaque axe) et par `workFrom` (travail, points de service). Sans cela, les
      gardes O6a de `Game#moveFriendly` étaient contournées en partie (trouvé par les marches aléatoires).
- [x] O6b.3 Voirie : `Infrastructure.findRoute(…, limit, step)` ; `findPath(…, kind, step)` de la partie prend
      par défaut `canStep` du terrain ; `moveUnitToward` passe par la voirie avec le prédicat sur un terrain
      (`C.OpenCity217Rules.pathMaxExpanded` 16 384), appel inchangé sur une carte plate. `C.findFriendlyPath`
      avec un 7e argument reste le chemin ami de base (test O6a).
- [x] O6b.4 Repli d'un infecté hors d'atteinte : `FlowField#fallback217(x, y, anneau, libre)` — case atteinte
      (`< 0x3fffffff`) et libre la plus proche du point, égalité départagée par l'indice, sans tirage ;
      `Game#zombieFallback217` dans `updateZombies` sur un terrain ; `z.fallback217` compte les replis.
      `C.OpenCity217Rules.fallbackRing` 192 : sur 17117, 1 062 cases sèches hors d'atteinte sur 1 892 relevées sont
      à plus de 24 cases d'un accès (jusqu'à 74).
- [x] O6b.5 Décor métrique : `WorldMap#footprintClear217(x, y, l, h)` (un palier, sans eau ni gué, hors rampe ;
      vrai sur une carte plate) lu par `fits` de `createMetricSceneryPlacement202`, donc par toutes les recherches
      de `packMetricScenery202` ; `packMetricScenery202` exporté par `exploration-125.js`.
- [x] O6b.6 Règles : `C.OpenCity217Rules` (`version` 1, `generation` 12, `fallbackRing` 192, `pathMaxExpanded`
      16 384).
- [x] O6b.7 Tests : `tests/open-city217.test.cjs` (10 cas) — règles et parcours plat empoisonné (20 s, vague,
      tirs ; `canStep`, `walk217`, `stepClear217`, `sightObstruction217`, `footprintClear217`, `terrainAt217`,
      `rebuildTerrain217`, `fallback217`, `zombieFallback217` jettent s'ils sont appelés) ; 10 000 pas aléatoires
      d'amis (`moveFriendly` de la partie) et d'infectés (`hostilePositionClear`) par graine 17117, 42, 46, la moitié
      au bord d'une rampe, plus 40 infectés de `updateZombies` pendant 10 s : aucun pas à travers une falaise,
      451 pas d'un palier à l'autre, tous par une rampe ; champ de flux contre `pathToCentre` (cases
      atteintes identiques, champ = 2 × coût de la carte locale moins 30 par rampe franchie, descente le long de
      chaque chemin de la carte locale) ; projectiles D-O1 (17117, 42) ; ouvriers ; voirie ; repli ; décor
      métrique (42, 46) ; parcours mur + récolte par la rampe (42, 46 : mur bâti, aller et retour par la rampe,
      matériaux déposés) ; coût du flux.
- [x] O6b.8 Coût (D-O5, médiane de 15 reconstructions) : partie de terrain à 192 m, centre posé, enveloppes du jeu
      de base, 2 à 5 ms (17117 / 42 / 46) contre 44 à 47 ms pour la partie 17117 à 128 cases et toutes ses enveloppes ;
      Chromium (harnais dans la page) 2 à 5 ms, description 113 à 115 ms. Avec les enveloppes de la partie déléguées
      (mesure O6a) : 13 à 28 ms. Aucune optimisation de plus n'est nécessaire avant O9.
- [x] O6b.9 Innocuité : parcours déterministe de 240 s (procédure 3, base `5b0d8ab` contre l'arbre de travail ;
      vague forcée, déplacements, 243 tirs, 18 tués, un rendu sur quatre) — sauvegardes de départ, de mi-parcours et
      de fin identiques octet pour octet ; sauvegardes de la base relues par l'arbre et resérialisées à l'identique
      de la base. Mondes G1–G11 des huit graines : `audit-campaign-sites205` identique à
      `campagne205-eligibilite.json` hors empreintes de sources (`src/core.js`, `src/exploration-125.js`,
      `src/fieldcraft.js`, `src/game.js`). Navigateur : partie 17117, vague, tirs, aucune erreur de page ;
      harnais G12 dans la page, sauvegarde de la partie inchangée.
- Réserves : rien n'a été joué en G12 dans une partie lancée par le menu ; `fieldcraft` au chargement d'un monde
  (`setup`) remplace encore `solidForFriendly` du monde (l'eau profonde n'y bloquerait plus les amis) et replace
  les gisements (`pack`) sans lire le terrain — à brancher en O9, quand une partie G12 passera par `setup` ; le
  repli remet l'infecté sur la case atteinte la plus proche (déplacement instantané, sûreté avant les apparitions
  par passage d'O7) et peut être défait par l'enveloppe de `fieldcraft` si la case touche un décor ; tourelles et
  soldats choisissent encore une cible sans lire la falaise (le tir s'arrête, la munition est dépensée) ; le repli
  de `recoverActor` (`fieldcraft`) ignore le terrain ; vue D-O1 et tirs centrés sur les cases, sans hauteur d'œil
  (O8).

## O8b — Relief de la cité de 192 m dans la vue FPS (livré, présentation seule, hors jeu)

Fiche : [ouverture.md](ouverture.md), O8b (décisions D-O1, D-O3). Atteint seulement par un harnais : la génération 12
reste refusée, `terrain-fps217.js` absent d'`index.html`. `tests/helpers/terrain-fps217.cjs` pose sur la partie de
terrain d'O8a une citadelle achevée (ajout direct au monde : les quartiers et le bilan de la cité plantent sur un monde
de terrain, `cancelPlacement` et `refreshMetrics` neutralisés le temps de la pose), y monte le commandant par
l'escalier, construit une sentinelle par les contrôleurs de production et la possède.

- [x] O8b.1 Hauteur jouée d'un cran : `C.TerrainRelief217Rules` (`version` 1, `stepMetres` 4, `waterDrop` .45,
      `strataMetres` 1, `block` 4, `skirtMetres` 6). 4 m = un étage de support (`structureHeight`), plus du double
      de l'œil 1,65 m (D-O1 : d'en bas on ne voit pas par-dessus le rebord), rampe de 12 m à 18° ; égale à
      `TerrainArt217Rules.cliffMetres` (peinture O8a inchangée, égalité vérifiée par le test).
- [x] O8b.2 Module `src/terrain-fps217.js` (`DeadwallTerrainFPS217` : `mesh`, `elevation`, `siteFloor`,
      `actorFloor`, `boxFloor`, `linkFloors`, `sightClear`, `levelOf`, `eye`, `summary`) : coins de case
      (palier × 4 m, eau − 0,45 m, rampes en plan incliné sur la longueur de leur composante), sol en blocs de
      4 × 4 cases uniformes, parois verticales sur toute arête entre deux hauteurs (strates d'un mètre sur les
      falaises), jupe du bord de carte. Maillage dérivé une fois par terrain (35 à 55 ms sous Node) :
      99 144 sommets (17117), 103 110 (0), 89 022 (46).
- [x] O8b.3 Peintre FPS (`createFPS`) : branche prise seulement si `g.world.terrain217` ; sol plat remplacé par le
      maillage (troisième tampon alloué au premier tableau d'un terrain, envoyé une fois par terrain, libéré avec
      les autres) ; œil = bouche levée du palier du support ; boîtes de `geometry()` et garde-corps levés du palier
      de leur propriétaire (passerelles : palier de leur premier support), talus de cadavres, infectés
      (`enemyPose` + palier du support ou surface sous les pieds), géants, équipe, caisses et gisements levés.
      Simulation inchangée : hauteurs relatives au sol local, `sightQuery` et `raycast` reçoivent la bouche simulée.
- [x] O8b.4 D-O1 dans la vue : un infecté ou un géant que `sightClear217` cache depuis le palier du support n'est
      pas peint ; vu d'en haut, le contrebas l'est.
- [x] O8b.5 Commandant borné par `canStep` (`vertical-citadel175.js`, `landing217`, neutre sans terrain) : escalier
      refusé quand une falaise sépare l'entrée du support (entrée comme sortie, et fin de trajet), chute d'un support
      perdu posée seulement sur un point relié par `stepClear217`. `vertical-network179.js` : passerelle refusée
      entre deux supports sur deux paliers.
- [x] O8b.6 Tests : `tests/terrain-fps217.test.cjs` (8 cas) — règle et cohérence avec l'œil ; isolement et test
      statique (ni tirage, ni horloge, ni affectation ; hors `index.html`, `sw.js`, build ; points d'appel gardés) ;
      champ de hauteur sur 17117, 0, 46 (aucune marche sur un pas franchissable hors flanc de rampe, paroi d'au moins
      un cran moins l'eau sur chaque arête de falaise, rampes monotones raccordées aux deux paliers, rampes plates
      de 46, maillage fini et borné) ; œil levé du palier, bouche sur le palier du support ; entrée refusée par la
      falaise ; chute bornée (la recherche d'origine aurait franchi la falaise) ; peinture levée (boîtes de la
      citadelle, pieds d'un infecté sur le sol), D-O1 vers le haut et vers le bas ; passerelle refusée entre deux
      paliers ; sonde de 600 images sur 17117, 0, 46 (aucun tirage ni horloge pendant le tracé, relief envoyé une
      fois, état, monde, terrain, sauvegarde de base, citadelle et `streamStats` régionaux inchangés) ; G1–G11 :
      séquence d'appels WebGL identique avec ou sans le module (module jamais appelé) et identique au peintre de la
      base `8d7ea21` (lu par `git show`, sauté sans historique).
- [x] O8b.7 Innocuité : mondes G1–G11 des huit graines identiques à `campagne205-eligibilite.json` hors empreintes
      de sources ; parcours déterministe (procédure 3, base `8d7ea21` contre l'arbre : horloges, tirages et
      `crypto.randomUUID` figés, partie 17117 d'âge 10, citadelle posée, montée, sentinelle construite et possédée,
      vague forcée, 240 s à 30 pas par seconde avec tirs, un rendu sur quatre) : sauvegardes de départ, de
      mi-parcours et de fin identiques octet pour octet, sauvegarde de mi-parcours relue à l'identique.
      Navigateur : `scripts/browser-terrain-fps217.mjs` (WebGL logiciel), graines 17117 (falaise), 0 (rampe de col),
      46 (rivière et rampes vues du plateau sud), trois vues chacune, aucune erreur de page.
- Réserves : la visée et les tirs des affûts (`sightQuery`, `raycast`, cibles automatiques) ne lisent pas encore le
  terrain — une sentinelle du contrebas vise et touche un infecté du plateau que la vue ne peint pas (D-O1 à brancher
  sur les tirs verticaux avant O9) ; le placement du terrain admet encore un support dont l'entrée tombe sur l'autre
  palier (escalier alors refusé, à refuser dès la pose en O9) ; le flanc d'une rampe, du côté de son propre palier
  (franchissable en jeu), montre une marche d'au plus 2 m le long du plan incliné ; les hauteurs simulées restent
  relatives au sol local (corps à corps entre paliers, chute, talus) ; vue FPS du commandant à pied absente (la vue
  reste celle d'un affût) ; aucune partie G12 lancée par le menu ; les quartiers ne vivent toujours pas sur un monde
  de terrain.

## O6c — Dettes de falaise soldées avant O9 (livré, sans effet en jeu)

Fiche : [ouverture.md](ouverture.md), O6c (décision D-O1). Réserves d'O6b et d'O8b. Toujours atteint par un harnais
seulement : la génération 12 reste refusée, aucun module ajouté à `index.html`.

- [x] O6c.1 Choix de cible 2D : `Game#fireTarget217(x, y, portée, sx, sy)` — carte plate : exactement l'ancien appel
      (`nightwatch.target` ou `nearestZombie`) ; terrain : le même choix, avec `nearbyZombies` filtré le temps de
      l'appel (`SIGHT217`, variable du module, jamais posée sur une carte plate) par `sightClear217` depuis le
      palier de la bouche. Les arcs de tir (`defense-pack131`) et la veille nocturne passent par `nearbyZombies` :
      ils restent appliqués. Points d'appel : tourelle (`updateBuildings`, bouche `b.y − 3`), fusilier
      (`updateUnits`), visée tactile du commandant, caisson local (`fortification-pack`).
- [x] O6c.2 Affûts de la citadelle (`vertical-citadel175.js`) : `sightQuery` refuse une cible que
      `sightClear217` cache depuis le palier de la bouche (même palier que le peintre O8b : la bouche reste dans
      l'emprise) ; `raycast(…, level217)` ajoute la fraction de `sightObstruction217` (impact `terrain217`, 2 cm
      avant l'arête : l'éclat reste au pied) ; l'enveloppe des projectiles 2D contre les géants passe
      `p.level217`. Couvre tir possédé, tir automatique, tir du commandant sur un palier, gardes de palier
      (`vertical-population181`), éclats. Carte plate : aucun appel au terrain.
- [x] O6c.3 Pose : `placement217` refuse un support `vertical175` dont l'entrée (`DeadwallVertical175State.entrance`)
      sort de la carte ou n'est pas reliée au centre de l'emprise par `stepClear217` — « Entrée de la citadelle
      hors du palier de l’emprise : la falaise ou l’eau couperait l’escalier. ». La garde de l'escalier d'O8b
      reste (support ajouté directement au monde : accès toujours refusé, test O8b adapté).
- [x] O6c.4 `fieldcraft.js` sur un terrain : `setup` chaîne l'eau profonde de l'enveloppe du monde dans son
      `solidForFriendly` ; `positionFree` refuse l'eau profonde au centre et aux quatre points à 0,78 rayon (comme
      `Game#friendlyPositionClear`) ; `pack` ne replace un gisement que si sa réserve est sur un seul palier, à
      sec, hors rampe (`footprintClear217`) et reliée à sa place par `stepClear217` ; `recoverActor` exige un
      segment sans falaise ni eau profonde. Sur 17117 / 42 / 46 (harnais) : 46 / 42 / 46 gisements replacés, tous
      conformes ; la base en replaçait 36 / 33 / 35, dont 1, 1, 0 hors palier et 2 par-dessus une falaise (17117),
      et laissait l'eau profonde franchissable aux amis après `setup`.
- [x] O6c.5 Repli : l'enveloppe `updateZombies` de `fieldcraft` (retour en arrière d'un infecté posé dans un décor)
      ne défait plus un repli du pas (`fallback217` changé) : l'infecté est dégagé par `recoverActor`. Sans cela, un
      repli tombé sur un gisement était annulé à chaque pas (infecté figé hors d'atteinte, compteur sans fin).
- [x] O6c.6 Tests : `tests/open-city217-fire.test.cjs` (6 cas, tous en échec sur la base `a94915f`) — carte plate
      (choix identique, points d'appel) ; tourelle et fusilier (17117, 42 : caché ignoré, visible retenu, aucune
      munition ni projectile, tir d'en haut) ; affûts (requête de visée, `raycast` arrêté au pied, affût
      automatique sans munition, affût du plateau qui touche en contrebas) ; pose refusée (17117, 0, toutes
      rotations) ; `fieldcraft` (46 : eau profonde, gisements, unités dégagées) ; repli contre un gisement.
      `tests/terrain-fps217.test.cjs` : la réserve consignée (`aim(zHigh) === true`) exige désormais le refus, et
      l'emprise à porte sur l'autre palier est refusée dès la pose. Le parcours empoisonné d'O6b (chemins du
      terrain qui jettent sur une carte plate) passe toujours.
- [x] O6c.7 Innocuité : parcours déterministe de 240 s (procédure 3, base `a94915f` contre l'arbre : horloges, tirages
      et `crypto.randomUUID` figés, partie 17117 d'âge 10, citadelle, montée, sentinelle possédée, atelier,
      générateur, tourelle, caserne et deux fusiliers, vague forcée, tirs, un rendu sur quatre) — sauvegardes de
      départ, de mi-parcours et de fin identiques octet pour octet, relecture de mi-parcours identique. Mondes G1–G11
      des huit graines : `audit-campaign-sites205` identique à `campagne205-eligibilite.json` hors tailles de sources.
      Navigateur : partie 17117 par le menu, vague, tourelle, fusiliers, aucune erreur de page ;
      `scripts/browser-terrain-fps217.mjs` (17117) sans erreur.
- Réserves : D-O1 reste centré sur les cases et sur le palier du support — un affût d'un étage élevé ne voit pas
  par-dessus la falaise, même plus haut qu'elle (hauteur d'œil réelle : O8 ultérieur) ; les lumières de la citadelle
  éclairent encore par-dessus une falaise (la cible reste refusée par la bouche) ; `pack` garde la croix des routes et
  l'anneau central de la carte plate (routes du terrain à lire en O9) et ne vérifie pas que la place nouvelle est
  atteinte par le champ de flux ; les quartiers et les chantiers de jour ne vivent toujours pas sur un monde de
  terrain (le test vide l'instantané des chantiers de jour le temps de `setup`) ; rien n'a été joué en G12 par le
  menu ; coût du filtre : un `sightClear217` par infecté à portée et par choix de cible, sur un terrain seulement.

## T5 — Ouverture expérimentale

- [ ] T5.1 `src/world-open217.js` : façade ; aiguillage dans `frontier-world.create`.
- [ ] T5.2 Chargement par anneau dans la boucle de `frontier.js`, un canton par image.
- [ ] T5.3 Itinéraire : graphe chargé + graphe macro des coutures.
- [ ] T5.4 Migrations, épaves, faune sur cantons chargés (D5).
- [ ] T5.5 Réglage « Monde sans bord (expérimental) » à la création de campagne ; module
      d'extension enregistré (`reset()` actif, `validate(undefined)` inactif).
- [ ] T5.6 Harnais navigateur G12 : 20 km, sauvegarde, reprise, retour.
- Décision requise : D3.

## T6 — Atlas et minicarte

- [ ] T6.1 Caméra sans étendue fixe, cadrage sur les cantons vus.
- [ ] T6.2 Rendu par cantons vus ; brouillard au-delà ; rayon d'action du véhicule.

## T7 — Par défaut et gradient de distance

- [ ] T7.1 G12 pour toute nouvelle campagne ; mention dans le codex et le journal.
- [ ] T7.2 Rareté et dureté par distance ; relevé de butin par bande ; `docs/BALANCING.md`.
- [ ] T7.3 Mise à jour de `docs/GAME_BIBLE.md` §7.13 ([DÉCISION] → [LIVRÉ]).
