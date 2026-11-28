# Vraie coopération — tâches

Besoin : [spec.md](spec.md). Plan et tranches : [plan.md](plan.md).

Règle commune à toute tâche : avant et après, le parcours déterministe de 240 s (graine 17117) et le
rechargement de sa sauvegarde de mi-parcours donnent des sorties et des sauvegardes **identiques
octet pour octet** à la base ; les tests coop existants restent verts ; `--test-concurrency=2` au plus.

## C0 — Cadrage (livré)

- [x] C0.1 Inventaire du code réel : `src/coop.js`, `scripts/coop-server.mjs`, onglet coop de
      `src/world-evolution-ui.js`, boucle, pause, sauvegarde et bulle régionale (`game.js`,
      `frontier.js`). Constat : présence seule, aucun peintre des pairs, simulation non reproductible
      au pas près (hôte autoritaire obligatoire).
- [x] C0.2 `spec.md`, `plan.md`, `tasks.md` ; sept décisions D1–D7 à soumettre.

## C1 — Protocole et état partagé (livré)

- [x] C1.1 Règles `C.CoopSession217Rules` dans `src/core.js` (protocole 217, trois invités, code de 6 à
      12 caractères, file de 32, 8 intentions par pas, rôles `district` et `sortie`, image : rayon 900,
      240 corps, 400 bâtiments).
- [x] C1.2 `src/coop-session217.js` : `normalizeHello`, `normalizeIntent`, `shareView`, `createHost`
      (`admit`, `receive`, `step`, `frame`, `leave`, `close`, `overview`), `createGuest` (`hello`,
      `intent`, `receive`, `pending`, `view`, `overview`). Module pur, non chargé par `index.html`, lu
      par aucun module du jeu.
- [x] C1.3 `tests/coop-session217.test.cjs` (7 cas) : session à deux dans le même processus par un
      transport JSON ; admission (code, forme, rôle `commandant` refusé, trois sièges, siège libéré) ;
      triche (vitesse > 1, champs ajoutés, type inconnu, `state`, `__proto__`, répétition, hors rôle,
      file pleine, pas qui recule) ; ordre stable sous entrelacement ; image lue sur une vraie partie
      sans la modifier ni la référencer ; isolement (aucun script public, présence 200 inchangée).
- [x] C1.4 Preuve solo : `replay.cjs` 240 s et rechargement de mi-parcours identiques à la base.

## C2 — Relais 217 (livré le 23 novembre 2026)

- [x] C2.1 `scripts/coop-server.mjs` : accepter `host` (code) et `hello` 217 dans des salles à part ;
      un hôte et trois invités au plus ; ne relayer que hôte → invité (`welcome`, `refused`, `frame`,
      `closed`) et invité → hôte (`hello`, `intent`). Le protocole 200 reste identique.
- [x] C2.2 Budget propre aux images (taille, cadence) ; l'invité ne peut jamais émettre `frame`.
- [x] C2.3 Tests `ws` sur port 0 : routage, refus, départ de l'hôte → `closed`, coexistence 200/217.

## C3 — Session hôte/invité de bout en bout (livré le 23 novembre 2026)

- [x] C3.1 Adaptateur hôte (nouveau script public : `index.html`, `sw.js`, manifeste `audit183`) :
      ouvrir/fermer une session, compteur de pas dans l'enveloppe de `g.update`, images à 5–10 Hz.
- [x] C3.2 Lecture plus légère que `serialize` si la mesure l'exige (même forme d'image).
- [x] C3.3 Tests : non-mutation (empreinte de `serialize`), solo identique, cadence bornée.

## C4 — Responsable de district (livré le 23 novembre 2026, décisions D1, D4, D5)

- [x] C4.1 Acteur de session dans la cité de l'hôte, mû par `step()`, ciblé par les zombies comme un
      défenseur, tirant sur le stock de l'hôte (D5-A).
- [x] C4.2 Absent de `serialize` ; sac versé au dépôt au départ et avant chaque sauvegarde (D4).
- [x] C4.3 Tests : application dans l'ordre, cibles, sauvegarde identique avec ou sans avatar,
      départ, mort de l'avatar (retour au dépôt).

## C5 — Temps continu en session (livré le 23 novembre 2026, décision D3)

- [x] C5.1 Prédicat unique « session active » lu par `loop` et `update`.
- [~] C5.2 Un test par module qui pose `paused` ou `activeOverlay` (dont `command-ui.js`,
      `succession133.js`, `campaign-intro132.js`, `arsenal-ui134.js`, `loadout-ui129.js`,
      `succession-ui133.js`, `exploration-125.js`, `ui.js`).
- [x] C5.3 Onglet caché : pas réduits par minuterie, puis interruption annoncée.

## C6 — Client invité (en partie livré)

- [x] C6.1 Interface : adresse, code, rôle ; statut accessible (comme l'onglet coop actuel).
- [x] C6.2 Peintres 2,5D et FPS sur l'image ; interpolation ; prédiction de son seul avatar (livré, voir bilan C6.2).
- [x] C6.3 Vrai navigateur, deux onglets (serveur local 4512, relais 4513) : parcours 1 à 6 de la spec.

## C7 — Chef de sortie (livré le 28 novembre 2026, décision D1-B ; sac versé au dépôt, D4)

- [x] C7.1 Seconde bulle régionale détachée de `g.player` (voir le bilan C7 : objet de session hors de `frontier.js`).
- [x] C7.2 Tests d'isolement des bulles (poursuites, faune, véhicules, prélèvements) et sauvegarde inchangée.

## C8 — Trois invités, reprise, notes (livré le 28 novembre 2026)

- [x] C8.1 Charge à trois invités ; reconnexion ; fermeture propre.
- [x] C8.2 Paragraphes de bible, de journal et d'équilibrage rendus à l'utilisateur.

## Bilan des tranches livrées le 23 novembre 2026

Décisions D1–D7 tranchées par l'utilisateur : voir [spec.md §6.0](spec.md).

- **C2** : `scripts/coop-server.mjs` — messages 217 `host`/`hosting`/`unhost`, `hello`, `intent` (réécrite par
  `normalizeIntent` dans le rôle annoncé), `send` (seuls `welcome`, `refused`, `frame`, `closed` vers un invité de la
  salle), `drop`, `gone`. Budget d'images de 12/s par invité (excédent perdu), hôte à 90 messages/s, image de
  30 000 octets au plus, charge utile du relais inchangée (32 Kio : le refus 1009 reste). Un socket 217 ne parle
  pas 200, et inversement.
- **C3** : `src/coop-host217.js` (adaptateur hôte) et `src/coop-ui217.js` (interface et client invité), scripts
  publics après `src/coop-session217.js`. L'hôte ouvre sa cité depuis le menu de pause ; l'invité rejoint depuis le
  menu principal. Fermeture : retour au menu, nouvelle partie, reprise de sauvegarde, relais perdu.
  C3.2 : l'image n'est pas lue dans `serialize` ; elle est lue directement (bâtiments du rayon, corps vivants) puis
  bornée par `shareView` et compactée en tableaux.
- **C4** : avatar de session (identifiant négatif, jamais dans `g.units` hors du pas des infectés), déplacement par
  `moveFriendly`, tir par `fireFriendly` (28 dégâts, 5 tirs/s, portée 700), chargeur de 30 pris au dépôt,
  rechargement 2,2 s, 100 points de vie, retour au dépôt 8 s après une chute. Signal (au plus un par 1,5 s, 8 s de
  vie), district tenu (district existant seulement, annoncé à l'hôte). Le rôle `sortie` est refusé (`role`).
- **C5** : `g.coopHost217.live()` est le prédicat unique ; `loop` l'ajoute à son test d'activité ; l'enveloppe de
  `update` masque pause et dossier le temps du pas et rend l'affichage tel quel. Onglet caché : minuterie de 0,5 s,
  au plus 1 s simulée par appel, fermeture annoncée après 90 s.
  C5.2 (en partie) : testés — menu de pause, poste de commandement, aide, dossier quelconque (`paused` +
  `activeOverlay`), boucle d'écran. Non testés un par un : relève (`succession133.js`), introduction de campagne,
  arsenal, paquetage, exploration : ils passent par le même masque, sans test dédié.
- **C6** (en partie) : client invité (`createClient`), peintre de dessus dédié (`paint`), interpolation entre les
  deux dernières images, prédiction d'affichage de son avatar, liste des districts, aide des commandes. C6.2 livré
  ensuite (bilan ci-dessous).

## Bilan C6.2 — vues 2,5D et FPS de l'invité

- `src/coop-views218.js` (script public après `src/coop-ui217.js`) : façade de lecture de l'image. La vue 2,5D appelle les
  méthodes de dessin du prototype de `Game` (sol, file de profondeur, bâtiments et leur art, unités, infectés, Commandant,
  tirs, pluie, nuit) sur des objets d'affichage copiés de l'image ; la vue FPS nourrit `DeadwallVertical175Render.createFPS`
  avec une citadelle de lecture (œil de l'avatar de l'invité, boîtes des bâtiments du rayon, étages lus dans l'image).
  Aucune méthode de simulation, aucun tirage, aucune horloge : le temps d'animation est `e` (temps de l'hôte) interpolé.
- Image v2 (`src/coop-host217.js`) : graine (variantes d'art), temps de l'hôte, pluie, rotation et révision de géométrie
  des bâtiments, orientation et santé des corps, équipe de la cité (`C.CoopViews217Rules.frame.maxUnits`) et boîtes d'étages
  de citadelle (`maxDecks`) ; le rognage au budget du relais retire d'abord étages et équipe. Mesure : environ 15,6 Ko pour
  une cité de 436 bâtiments et 700 infectés (vague 30). Un invité lit encore une image v1.
- Interface : vue 2,5D par défaut ; bouton « VUE » et touche V (2,5D → FPS → dessus). En FPS, la souris tourne le regard,
  ZQSD marche selon le regard (intention toujours unitaire, 32 directions). Sans WebGL : retour annoncé à la vue de dessus.
- Correctif relevé en vrai navigateur : une sauvegarde déclenchée pendant le pas des infectés (avatars prêtés à `units`)
  était refusée (« type de survivant ») ; l'enveloppe de `serialize` de l'hôte retire désormais tout avatar (D4).
- Tests : `tests/coop-views218.test.cjs`, cas C6.2 de `tests/coop-play217.test.cjs` ; vrai navigateur hôte + invité par le
  relais (serveur 8771, relais 8772), captures 2,5D, FPS, dessus et repli sans WebGL pendant une vague.

## Bilan C7 — chef de sortie

- `src/coop-sortie218.js` (script public après `src/coop-views218.js`) : bulle de session `createBubble(g, {seat, name, pour,
  tell})` et peintre régional de l'invité (`paint`, `hud`). **Écart au plan, point 1** : l'état de bulle de `src/frontier.js`
  n'a pas été extrait en objet (fichier de 54 Ko où une centaine de fonctions lisent les fermetures `state`, `enemies`,
  `near`… ; risque de régression jugé trop fort). La bulle de l'hôte reste donc la bulle d'origine, intacte ; la seconde est
  un objet de session qui lit la région par les accesseurs publics de `g.frontier` (`world`, `contacts`, `enemyHealth`,
  `siteStock`, `takeFromSite`, `discoveries`, `revealSites`, `position`). Seul ajout à `frontier.js` : `recordContact218`
  (santé d'un contact de lieu au registre, comme `hitEnemy`), jamais appelé hors session.
- Bulle : départ devant une jonction de D-17 (nord d'abord, repli latéral borné), marche à 3,5 m/s avec les mêmes collisions
  que la bulle de l'hôte (sans véhicule), contacts de lieu au sol seulement (mêmes identifiants, niveaux, profils et santé de
  registre ; budget propre de 24), poursuites par `DeadwallFrontierSurvey.step`, tir sans dispersion (aucun tirage),
  fouille (`search`, E tenu) par `takeFromSite` : mêmes contenants, gardes et limite du carnet. Aucun flux de faune, aucun
  véhicule, aucune trace écrite. Un contact vivant de la bulle de l'hôte quitte la seconde à chaque pas.
- Ordre : le pas de l'hôte d'abord (sa bulle comprise), puis les bulles de session par siège croissant, intentions dans
  l'ordre (siège, numéro).
- D4 : sac versé au dépôt à moins de 6 m de l'emprise de D-17 (dans la capacité de stockage ; un dépôt plein laisse le reste
  au sac), à la mort (sac et chargeur, puis retour aux portes en 8 s) et au départ ; sac et chargeur comptés dans chaque
  sauvegarde, sans clé nouvelle. Un seul chef de sortie à la fois (`C.CoopSortie217Rules.maxSeats`).
- Image régionale v2 (`region:1`) : avatar, sac, lieux du rayon de 70 m (24 au plus, stock libre des lieux repérés),
  contacts (48 au plus), tirs, emprise de D-17, Commandant s'il est en région à proximité ; environ 0,5 à 2 Ko.
- Preuve de neutralité : parcours scripté (cité 30 s, sortie de l'hôte, marche, fouille, tir, retour, rechargement de
  mi-parcours) sur la base `e7336b3` et sur la tranche : sorties identiques octet pour octet.
- Tests : `tests/coop-sortie218.test.cjs` (6 cas), cas C4 de `tests/coop-play217.test.cjs` adapté (le second chef de sortie
  est refusé avec `role`).

## Bilan C8 — trois invités, reprise, fermeture

- Jeton de reprise (16 caractères, crypto du navigateur, hors simulation) rendu dans `welcome` ; `hello` peut le porter
  (`normalizeHello`, relais qui le transmet). Coupure d'un invité : siège et rôle gardés 45 s
  (`C.CoopResume217Rules.graceSeconds`), avatar retiré et sac au dépôt, le temps peut de nouveau s'arrêter ; retour avec
  le jeton : même siège, même rôle, numéros d'intention remis à zéro (`createHost().resume`). Un jeton connu depuis un autre
  socket remplace l'ancien sans doubler l'avatar. Délai dépassé : siège libéré, un retour tardif reçoit un siège libre.
- Invité : reconnexion automatique (400 ms, 1, 2 puis 4 s) jusqu'à la fin du délai ; billet enregistré dans `localStorage`
  (onglet rechargé ou rouvert : reprise au chargement) ; effacé au départ volontaire, au refus et à la fermeture.
- Hôte : relais perdu, sièges gardés, nouvel essai pendant 30 s (`hostRetrySeconds`) avec le même code, puis fermeture propre.
- Vrai navigateur (4 navigateurs Chromium, serveur 8773, relais 8774) : hôte + deux responsables de district + un chef de
  sortie pendant une vague ; ~35 images/s reçues par invité sur 17 s (plafond du relais) ; simulation de l'hôte à 0,5× le
  temps réel sur la machine de test (4 Chromium logiciels) ; onglet rechargé : siège repris en 0,3 s ; relais tué puis
  relancé : hôte et trois invités sur les mêmes sièges en 8,5 s ; fermeture : « Campagne de l’hôte fermée », billets effacés.
  Second parcours (serveur 8773, relais 8775) : chef de sortie au lieu occupé, un contact abattu, fouille de 18 ferraille.
- Tests : `tests/coop-reconnect218.test.cjs` (protocole, hôte, client, bout en bout par le vrai relais redémarré).

## Reste à faire

- Extraction de l'état de bulle de `src/frontier.js` (point 1 du plan C7) si une seconde bulle doit un jour conduire,
  monter aux étages ou porter la faune ; non nécessaire au parcours livré.
- C5.2 : tests un par un des modules qui posent `paused` restants (relève, introduction, arsenal, paquetage, exploration).

## Ancienne liste (avant le 28 novembre 2026, traitée ci-dessus)

- **C7 — chef de sortie** (non commencé ; la condition « le reste livré et vert » ne couvrait pas C6.2) :
  1. extraire de `src/frontier.js` l'état de bulle (`state.x/y/z/a`, `inside`, `near`, `enemies`, `bullets`,
     `action`, `locked`, poursuites, son) dans un objet de bulle, la bulle actuelle restant celle de `g.player` ;
  2. créer une seconde bulle pour un siège `sortie`, avancée par l'enveloppe de `update` de l'hôte, avec ses
     propres ennemis régionaux, sans véhicule au début ;
  3. prélèvements régionaux (`state.taken`) partagés par les deux bulles, dans l'ordre (siège, numéro) ;
  4. sac du chef de sortie versé au dépôt au retour et avant chaque sauvegarde (D4) ;
  5. image régionale (lieux proches, ennemis de la bulle) et peintre de l'invité en région ;
  6. tests d'isolement : faune, poursuites, véhicules, prélèvements, et sauvegarde inchangée.
- **C8** : charge à trois invités en vrai navigateur, reconnexion automatique, notes de version.
