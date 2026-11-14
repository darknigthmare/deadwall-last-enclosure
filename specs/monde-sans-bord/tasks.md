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

## T2 — Canton sec (module pur, hors jeu)

- [ ] T2.1 `src/world-macro217.js` : climat, biome, densité, bande de distance en fonctions
      de champ ; règles dans `core.js`.
- [ ] T2.2 `src/world-canton217.js` : points de raccord des quatre coutures, carrefours des
      quatre sommets, routes internes, sans lieux.
- [ ] T2.3 Tests : trois ordres de visite ; régénération après éviction ; égalité des points
      de raccord des deux côtés de 2 000 coutures ; connexité sur 31 × 31 cantons pour les
      huit graines ; aucune route hors de son canton sauf aux points de raccord.
- [ ] T2.4 Sonde `scripts/probe-cantons217.cjs` : coût médian et maximal d'un canton.
- [ ] T2.5 Page d'aperçu de QA (hors `index.html`) : carte défilante de cantons.
- [ ] T2.6 Preuve `docs/codex/suivi-monde2026/monde-sans-bord-cantons.json` + son test.
- Décision requise avant de commencer : D1.

## T3 — Eau sans bord

- [ ] T3.1 Altitude macro et sens d'écoulement par couture.
- [ ] T3.2 Cours d'eau de canton en canton, confluences, plans d'eau contenus dans un canton
      ou déclarés aux coutures.
- [ ] T3.3 Ponts : réemploi de `hydrology165` (croisements route/eau) par canton.
- [ ] T3.4 Tests : continuité de largeur et de niveau aux coutures ; aucune route noyée.
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
