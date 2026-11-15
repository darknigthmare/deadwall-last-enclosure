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

## T1 — Accesseurs de limite (aucun changement de valeur)

- [ ] T1.1 Dans l'objet rendu par `frontier-world.create` : `contains(x, y, pad)`,
      `clampInside(x, y, pad)`, `extent()`, `site(id)`, `chunkRange()`. En G1–G11 ils
      rendent exactement ce que calculent aujourd'hui les comparaisons à `size`.
- [ ] T1.2 Test d'équivalence : 10 000 points tirés, bords compris, anciens calculs contre
      accesseurs, pour les tailles 8 192 et 24 576.
- [ ] T1.3 Remplacer les comparaisons une famille à la fois, un commit par famille :
      a) acteurs (`frontier.js:173, 232`, `world-evolution.js:41, 80`) ;
      b) faune et cueillette (`biome-population165.js`, `wildlife189.js`, `biome-forage193.js`, `forage193.js`) ;
      c) validateurs (`frontier-state.js`, `essential-state.js`, `night-gear.js`, `survival-pack.js`, `succession133.js`, `husbandry191.js`, `world-evolution-state.js`, `companions-pack.js`) ;
      d) atlas (`atlas-projection.js`, `atlas-view.js`, `atlas-render.js`, `field-atlas-state.js`).
- [ ] T1.4 Remplacer `pois.find(p => p.id === id)` par `world.site(id)` (30 fichiers ; index
      par identifiant construit une fois en G≤11).
- [ ] T1.5 Supprimer les `24576` et `8192` en dur relevés en §3.1 de la spec au profit de
      `sizeForGeneration` — sans changer aucune valeur.
- Tests : ceux de chaque fichier touché, `tests/codex-campaign*.test.cjs`.
- Parcours : sortie en voiture jusqu'au bord est, atlas, sauvegarde et reprise — inchangés.

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
- [ ] T2.7 Reste à faire avant T4 : agglomérations portées par les sommets (les lieux sont
      aujourd'hui semés le long des routes, sans bourg) ; décor (arbres, rochers) par
      morceaux de 256 m ; D-17 dans `K0_0` ; bande de distance ; rendre les routes de la
      trame moins régulières (une rangée sur trois porte une route d'est en ouest).

## T3 — Eau sans bord

Première version livrée avec T2 (même module, mêmes tests) : chaque canton s'écoule vers son
voisin le plus bas, le débit compte les cantons drainés, un cours d'eau franchit la couture
au point bas de celle-ci et son niveau ne remonte jamais ; cuvette = lac contenu dans son
canton ; palier 0 = mer.

- [x] T3.1 Altitude macro et sens d'écoulement par couture.
- [x] T3.2 Cours d'eau de canton en canton, confluences, plans d'eau contenus dans un canton
      (première version : peu de cours d'eau — 0,4 par canton —, pas de méandres ni de
      largeur de lit dans la maille, pas d'étangs hors cuvette).
- [ ] T3.3 Ponts : réemploi de `hydrology165` (croisements route/eau) par canton. Les ponts
      sont pour l'instant de simples mailles déclarées (`bridges`).
- [x] T3.4 Tests : continuité de largeur et de niveau aux coutures ; aucune route noyée.
- Décision requise : D6. Repli prévu si la tranche dérape (plan §8).

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
