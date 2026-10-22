# Codex mondial — inspection physique des plans de travail

## Périmètre de cette reprise

Les 1 200 plans auteur produits deviennent inspectables dans le Guide auteur de DEADWALL. Le dessin utilise les mêmes murs, ouvertures, sols et emprises de mobilier que les contrôles de collision. Le disque piéton a un rayon de 0,32 m. Les pièces et les objets conservent leurs dimensions déclarées en mètres ; un objet trop grand est refusé et comptabilisé.

Les deux continuations du 22 octobre ajoutent 800 plans aux 400 précédents : huit activités agricoles (T021–T028), quatre types résidentiels (T045–T048) et quatre activités industrielles (T053–T056), avec 50 variantes chacun. Les [plans agricoles](AGRICULTURE_2026.md) décrivent locaux de production, habitation, jardin et parcelles ; les [plans résidentiels](RESIDENTIEL_2026.md) décrivent logements, services, jardins, terrasses et boucles de desserte. Ces cotes originales restent des choix auteur.

Ces scènes constituent un outil de production intégré au Guide. Elles ne sont pas implantées dans le monde de campagne : `playable:false`, aucun poids d’apparition, aucun stock de butin, aucun ennemi ajouté et aucun service raccordé. Le libellé « Inspection physique » du suivi désigne précisément ce périmètre.

| Typologie | Plans | Pièces décrites hors circulations | Équipements placés | Demandes refusées |
|---|---:|---:|---:|---:|
| T005 — Cargo polyvalent | 50 | 1 680 | 4 141 | 1 817 |
| T006 — Pétrolier océanique | 50 | 2 800 | 10 015 | 0 |
| T007 — Croiseur militaire abandonné | 50 | 1 600 | 5 815 | 0 |
| T008 — Sous-marin en surface | 50 | 600 | 848 | 1 255 |
| T011 — Navire de soutien offshore | 50 | 1 600 | 4 424 | 1 178 |
| T021 — Ferme laitière | 50 | 1 400 | 4 950 | 0 |
| T022 — Élevage ovin | 50 | 1 400 | 5 100 | 0 |
| T023 — Ferme avicole | 50 | 1 400 | 5 050 | 0 |
| T024 — Centre équestre rural | 50 | 1 400 | 5 100 | 0 |
| T025 — Exploitation céréalière | 50 | 1 300 | 4 850 | 0 |
| T026 — Domaine viticole | 50 | 1 300 | 4 700 | 0 |
| T027 — Ferme maraîchère | 50 | 1 400 | 5 200 | 0 |
| T028 — Verger avec conditionnement | 50 | 1 300 | 4 800 | 0 |
| T045 — Parc résidentiel de mobil-homes | 50 | 2 460 | 7 004 | 1 966 |
| T046 — Camping caravanes | 50 | 900 | 2 880 | 420 |
| T047 — Camp de travailleurs | 50 | 2 560 | 8 168 | 272 |
| T048 — Parc de caravanes abandonné | 50 | 1 290 | 3 925 | 805 |
| T053 — Usine agroalimentaire | 50 | 1 900 | 6 850 | 0 |
| T054 — Usine de mécanique | 50 | 2 000 | 7 500 | 0 |
| T055 — Usine textile | 50 | 2 000 | 7 350 | 0 |
| T056 — Usine de matériaux | 50 | 2 000 | 7 350 | 0 |
| T060 — Champ d’éoliennes | 50 | 600 | 2 200 | 0 |
| T065 — Stade municipal | 50 | 2 000 | 7 140 | 110 |
| T066 — Grand stade couvert | 50 | 2 000 | 7 140 | 110 |
| **Total** | **1 200** | **38 890** | **132 500** | **7 933** |

Le rapport [inspection-restauration-20261022.json](inspection-restauration-20261022.json) contient une preuve par variante, les empreintes SHA-256 des sources vérifiées et les résultats de contrôle. La preuve du 22 octobre compte 38 860 pièces meublées, 284 885 segments de mur, 2 100 niveaux ou paliers et 900 transitions. Le nom de fichier historique est conservé ; `generatedAt` et les empreintes identifient la passe courante. Trente pièces restent sans objet après les contrôles de dimensions et de dégagement. Ces totaux décrivent les variantes de travail ; ils ne représentent pas autant de bâtiments dans une partie.

## Utilisation dans le jeu

1. Démarrer la version web avec `npm start`, puis ouvrir son adresse avec `?tools=1`. Le mode auteur est nécessaire ; les menus de l’entrée joueur normale restent inchangés.
2. Ouvrir Commandement → Opérations → Atlas & Guide, puis « CODEX MONDIAL — INSPECTER LES NOUVEAUX PLANS ».
3. Choisir un lieu et une variante. Les 80 cibles sont affichées ; vingt-quatre disposent de 50 plans. Les 56 autres indiquent qu’aucun plan n’a été produit.
4. Utiliser le plan général pour examiner les étages. La vue de déplacement suit le piéton. Les flèches, ZQSD ou WASD déplacent le gabarit ; les boutons offrent les mêmes déplacements sur écran tactile.
5. À proximité d’un palier, utiliser le bouton de passage ou la touche E. Sélectionner un étage à observer ne déplace pas le piéton.
6. « Mémoriser l’inspection » conserve la position et les pièces visitées dans cette consultation. « Reprendre l’inspection » restaure ce point après reconstruction et validation du plan. Changer de variante efface ce point ; recharger la page ne conserve pas une inspection.

Cliquer une pièce, un jardin, une cour ou une terrasse affiche ses dimensions et les dimensions au sol de son équipement. Le panneau indique les prescriptions non posées et les limites du plan.

## Géométrie et mobilier

`src/codex-layouts2026.js` est généré par `scripts/compile-codex-inspection2026.cjs` à partir du registre `scripts/codex-generators2026.cjs` et de ses cinq générateurs auteur, des références métriques et de la liste des objectifs. Les plans sont produits à la demande ; les 1 200 géométries ne sont pas précalculées à chaque démarrage. La parité avec les sources est testée.

`src/codex-physical2026.js` transforme chaque plan en surfaces, cloisons interrompues aux portes, parcours et liaisons de niveaux. La collision vérifie le trajet continu du disque piéton, y compris les murs fins et les trous de sol, et exige un palier libre pour chaque transition. Chaque port extérieur est adapté de 0,5 m à l’intérieur de la limite pour permettre le passage du disque, sans modifier le plan auteur. Les clôtures gardent leurs ouvertures réelles, les bassins restent des obstacles, et les jardins et cultures sont des surfaces nommées, sans production de ressources.

`src/codex-furnishings2026.js` affecte des équipements selon l’usage de la pièce. Les dimensions des objets existants viennent des catalogues du jeu ; les rares formes ajoutées et les hauteurs de composition sont déclarées comme choix auteur. Les portes, le parcours vers le centre et la face d’utilisation des objets restent accessibles. Le module ne distribue ni ressources ni énergie. Voir [AMENAGEMENTS_2026.md](AMENAGEMENTS_2026.md) pour les règles et les refus.

`src/codex-inspection2026.js` gère uniquement l’observateur, son parcours et sa reprise. Une reprise exige le bon plan, la bonne version de source, l’empreinte de la géométrie reconstruite, une position libre et des identifiants de pièces connus. Elle n’écrit pas dans une sauvegarde de campagne.

## Limites qui maintiennent les tâches ouvertes

- Les cales, citernes et ponts de travail réservés ne deviennent pas des intérieurs détaillés. La hauteur totale réelle des navires demeure inconnue lorsque la source ne la fournit pas ; les hauteurs de composition restent identifiées comme telles.
- Les tribunes, la toiture des stades et les fûts d’éoliennes ne constituent pas des volumes intérieurs achevés. L’accès au terrain et aux locaux effectivement décrits est contrôlé.
- Le palier d’écoutille du sous-marin est une petite surface explicite. Il ne crée pas de cheminement sur la mer. L’embarquement des navires n’est pas raccordé à un port.
- Les objets refusés doivent conduire à revoir la prescription ou le plan. Ils ne sont pas réduits pour entrer artificiellement dans la pièce.
- L’implantation dans les seeds, les réseaux routiers et maritimes, le butin fini, les rencontres, l’eau, l’énergie, les interactions, l’art définitif et la reprise de campagne restent à livrer.

## Réconciliation du suivi et de l’Excel

Le patch `scripts/codex-inspection-progress2026.cjs` s’applique après les étapes métriques, maritimes et terrestres. Il contrôle les 1 200 identifiants et les empreintes des sources du rapport avant d’actualiser le suivi. Une source modifiée impose de régénérer la preuve ; une tâche modifiée ailleurs n’est pas écrasée silencieusement.

Les 1 200 variantes prennent le statut « Inspection physique », tandis que `architecture` reste vide pour la réception de l’architecture complète, `spawnWeight` reste vide et `playable` reste faux. Les étapes architecture, objets, sauvegarde et QA des vingt-quatre typologies sont **en cours**, avec une description de la partie livrée et du reste à faire. Les trois validations métriques précédentes sont conservées. Les dimensions des seize nouvelles typologies restent en cours : un contrôle géométrique de cotes auteur ne valide pas des références réelles.

Le total est **3 tâches validées, 117 en cours et 680 à faire**, sur 800. Il reste **2 800 variantes à concevoir** et **zéro nouvelle variante jouable en campagne**. Les 4 000 programmes historiques et leurs identifiants ne sont pas remplacés par ces objectifs.

Le classeur conserve les feuilles historiques et ajoute une matrice des dix étapes pour chacune des 80 typologies ainsi qu’une feuille Inspection. L’export calcule les formules, et un lecteur XML indépendant vérifie les valeurs, les identifiants, les états, les validations et la conservation des fonctions du classeur d’origine. Le compteur de validations sans preuve a un test négatif dédié.

## Rejouer les contrôles

```bash
npm run codex:inspection
node tests/codex-physical2026.test.cjs
node tests/codex-furnishings2026.test.cjs
node tests/codex-inspection2026.test.cjs
node tests/codex-inspection-progress2026.test.cjs
node tests/codex-tracker2026.test.cjs
node scripts/browser-codex-inspection2026.mjs
npm run check
```

Le script navigateur utilise le Chromium de Playwright, ou le chemin explicitement fourni par `CHROMIUM_EXECUTABLE_PATH`. Ses essais vérifient les vrais contrôles du Guide sur ordinateur et écran mobile, la collision, les escaliers, la reprise de l’inspection et l’identité de tous les champs persistants de la campagne avant et après consultation. Ce scénario ne qualifie pas à lui seul une partie complète ni un appareil physique.

Les résultats finaux exécutés et les limites de validation de cette livraison sont consignés dans [PUBLICATION.md](PUBLICATION.md).

Les [plans industriels](INDUSTRIE_2026.md) ajoutent quinze formes de machines, arrêtées et non raccordées, sans recette ni stock actif. Les résultats de la qualification globale sont consignés dans [PUBLICATION.md](PUBLICATION.md).
