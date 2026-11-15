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

## T1 — Accesseurs de limite (aucun changement de valeur) — en partie livré

Livré (tranche vérifiée ; test `tests/world-bounds217.test.cjs`) :

- [x] T1.1 `src/frontier-world.js` : `limits(size)` et `limitsForGeneration(g)` (objets gelés, un
      par taille), repris tels quels par le monde rendu par `create` : `outside(x, y, pad)`,
      `outsideOpen(x, y, pad)`, `contains(x, y, pad)`, `clampInside(x, y, pad)`, `extent()`,
      `chunkRange(chunk)`, plus `site(id)`. Trois prédicats et non un seul, parce que les sites
      d'appel historiques ne traitent pas un `NaN` ni le bord exact de la même façon :
      `outside` = `x<pad||y<pad||x>size-pad||y>size-pad` (bord admis, `NaN` admis),
      `outsideOpen` = `x<=pad||…||x>=size-pad` (bord refusé), `contains` = forme positive
      `x>=pad&&…&&x<=size-pad` (`NaN` refusé). `contains` n'est donc **pas** la négation de
      `outside`. `site(id)` : index par identifiant construit à la première lecture, reconstruit
      si la liste change, premier lieu portant l'identifiant comme `pois.find`.
- [x] T1.2 Test d'équivalence : 10 000 points par taille (8 192 et 24 576), bords, `NaN`, infinis
      et marges compris, anciens calculs contre accesseurs ; mondes réels G4, G8, G11 ; tailles
      des générations 1 à 11.
- [x] T1.3 a) acteurs : `frontier.js` (dérive animale, ex-ligne 173), `world-evolution.js`
      (ex-lignes 41 et 80).
- [x] T1.3 b) faune : `biome-population165.js`, `wildlife189.js`, `biome-forage193.js`
      (ex-ligne 105). Le fichier généré `src/codex3000-live-data.js` suit `wildlife189.js`.
- [x] T1.3 d) atlas, en partie : `atlas-view.js` (étendue, sélection de terrain, lieux),
      `atlas-render.js` (fond, grille, cellules ; `8192` en dur remplacé par
      `AtlasRules.regionSize`, même valeur).
- [x] T1.4 `pois.find(p => p.id === id)` → `site(id)` : les 28 recherches par identifiant de
      18 fichiers hors `frontier-world.js`, et les 3 de `frontier-world.js`.

Forme retenue aux sites d'appel : une fonction locale par fichier (`siteOf217`, `outside217`,
`outsideOpen217`, `inside217`, `chunks217`, `span217`) qui lit l'accesseur du monde et, **si le
monde n'en a pas**, refait le calcul historique. Ce repli existe pour les mondes factices des
tests (une vingtaine de fichiers de test construisent `{size, pois: […]}` à la main) ; il est
vérifié identique dans `tests/world-bounds217.test.cjs`.

Reste à faire en T1 :

- [ ] T1.3 a) `frontier.js`, `enemyBlocked` (ex-ligne 232) : **non converti**. L'expression lit
      `world()` seulement si les premières comparaisons échouent ; `world()` crée la région à la
      demande. Passer par un accesseur évaluerait `world()` plus tôt : équivalence non évidente.
- [ ] T1.3 b) `forage193.js:16` et `biome-forage193.js:16` : bornes lues dans
      `GeographyRules135.size`, pas dans le monde — validateur d'identifiants, à traiter avec T4.
- [ ] T1.3 c) validateurs (`frontier-state.js`, `essential-state.js`, `night-gear.js`,
      `survival-pack.js`, `succession133.js`, `husbandry191.js`, `world-evolution-state.js`,
      `companions-pack.js`) : **non convertis**. Ils n'ont pas de monde, seulement
      `sizeForGeneration`, et plusieurs fichiers de test fournissent un faux `DeadwallFrontierWorld`
      réduit à `sizeForGeneration` : lire `limitsForGeneration` exigerait de modifier ces tests.
      `limitsForGeneration` est prêt ; la conversion va avec T4 (bornes de position signées).
- [ ] T1.3 d) `atlas-view.js`, lecture des coordonnées au survol (ex-ligne 36) : **non
      converti** (`view()` appelé deux fois, sous court-circuit). `atlas-projection.js` :
      caméra bornée par une étendue scalaire, laissée telle quelle — relève de T6.
      `field-atlas-state.js` : voir T1.5.
- [ ] T1.5 `24576` / `8192` en dur **laissés** : `field-atlas-state.js:6` (schéma d'indexation
      fixe 3 × 3 blocs de 8 192 m, indépendant de la génération : le remplacer par
      `sizeForGeneration` changerait les mondes G1–G4) ; `succession133.js:20` et
      `companions-pack.js:16` (replis quand `DeadwallFrontierWorld` est absent) ;
      `world-stream131.js:7` (`old=8192`, emprise de l'ancienne région dans le flux G5) ;
      `frontier-world.js` (emprise historique de 8 192 m dans `install` et `chunk`, repli de
      `sizeForGeneration`).
- [ ] Comparaisons internes de `frontier-world.js` (`blocked`, `line`, `vehicleClear`, `chunk`,
      `prefetch`, décor) : laissées en clair — c'est l'implémentation du monde fini, que la
      façade G12 remplace entièrement (T5).
- [ ] Parcours de `pois` autres que la recherche par identifiant (`filter`, `map`, `some`) :
      non traités ; ils demandent une vue par cantons chargés (T5).
- [ ] Retirer les replis locaux quand les mondes factices des tests porteront les accesseurs.
- Tests : ceux de chaque fichier touché, `tests/world-bounds217.test.cjs`,
  `tests/codex-campaign*.test.cjs`.
- Parcours vérifié : sortie à pied par le bord est de D-17 (G11, graine 17117), marche, atlas
  ouvert en région, sauvegarde et reprise, retour — positions identiques au bit près à la base.
  Non joué : sortie en voiture jusqu'au bord est de la région.

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

## T4 — Lieux et sauvegarde creuse

- [ ] T4.1 Lieux par canton : `K…:site:n`, plans par les fabriques existantes (`G.plan`,
      codex 160, sites 205), occupants par `world-spawns131` et la bande de distance.
- [ ] T4.2 `frontier-state` : G12 acceptée, bornes de position, expressions d'identifiants
      par génération, registre `cantons`, plafonds.
- [ ] T4.3 Validation par cantons cités ; plafond ; refus croisés G≤11 / G12.
- [ ] T4.4 `field-atlas-state` : cellules par canton.
- [ ] T4.5 Version de sauvegarde générale et migration vide ; tests de reprise des
      sauvegardes de référence existantes.
- Décisions requises : D2, D4, D7.

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
