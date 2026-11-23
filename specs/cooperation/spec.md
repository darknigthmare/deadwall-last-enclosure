# Vraie coopération — spécification

Référence de direction : `docs/GAME_BIBLE.md` §7.12 (« Coopération [DÉCISION] ») et ligne 22 de la
feuille de route : **« Un joueur tient le mur pendant qu'un autre explore. »**
Contrats : `AGENTS.md` (une seule simulation, peintres sans effet, sauvegarde versionnée, déterminisme,
aucun système supprimé). Documents liés : [plan.md](plan.md), [tasks.md](tasks.md).

Les numéros de ligne renvoient au commit `cc9efd9`. Les fichiers du dépôt ont de longues lignes : la
ligne citée est celle où commence l'instruction. Les compétences `/speckit-*` ne sont pas chargées dans
cette session : les trois documents suivent le découpage de Spec Kit (besoin, plan, tâches), comme
`specs/monde-sans-bord/`.

## 1. Ce que la coopération fait aujourd'hui (inventaire)

La « coopération » livrée est une **préversion de présence** : chacun joue sa propre campagne, sur sa
propre machine, et le relais échange des positions et des repères. Personne n'a d'autorité sur le monde
de l'autre.

### 1.1 Client `src/coop.js` (216 lignes, chargé par `index.html` l. 293)

| Lignes | Ce que fait le code |
|---|---|
| 3–5 | `LIMITS` : budgets de transport (8 192 caractères par message, 64 Kio en attente, 64 pairs, 64 repères, pair oublié après 5 s, repère après 8 s, 128 clients au relais, rafale 60, 30 messages/s, admission 10 s). Commentaire explicite : aucune construction, aucun inventaire ni combat n'est autoritaire ici. |
| 12–21 | `normalizeSpace` / `spaceKey` : identité de carte (graine, génération, révisions de détail, d'écologie, d'hydrologie, paysage, cité ou région, étage, intérieur). Deux joueurs ne se voient que si la clé est **identique**. |
| 22–28 | `normalizeState` : un échantillon de présence (`x`, `y`, `z`, `a`, posture, région active). |
| 33–96 | `install(game)` : socket unique, admission vérifiée (protocole 200, délai de 10 s, l. 45–71) ; `joinScope` rejoint à chaque changement de carte ou d'étage. |
| 121–178 | `connect(url, salle, nom)` : `ws://` ou `wss://`, salle de 2 à 24 caractères ; messages `joined`, `leave`, `peer`, `ping` ; un ancien socket ne peut pas casser son remplaçant. |
| 179–185 | `ping()` : un repère, seulement en région. |
| 186–197 | `update(dt)` : envoie sa position toutes les 0,2 s (l. 191). |
| 198–203 | `overview()` : statut, pairs et repères encore frais. |
| 206–211 | Enveloppe de `game.update` : n'émet que si `state === 'playing'` et la partie n'est pas en pause. **Ne modifie rien de la simulation.** |

### 1.2 Relais `scripts/coop-server.mjs` (83 lignes, `npm run coop`, port 4290 par défaut)

- Serveur `ws` sans état de jeu (l. 8–76) : identité = UUID de socket (l. 28), aucune authentification,
  aucun code de salle secret.
- Seau à jetons par client (l. 39–41), admission bornée (l. 32–35), 128 clients (l. 27).
- `join` (l. 44–56) range le client par salle **et** par clé de carte ; `state` devient `peer` (l. 60–63),
  `ping` n'est relayé qu'en région (l. 64–66), la fermeture diffuse `leave` (l. 68–73).
- Il ne lit jamais une sauvegarde, une ressource ni un dégât.

### 1.3 Interface et rendu

- `src/world-evolution-ui.js` l. 94 : onglet « Coop » du panneau « Monde, flotte & expansion » (adresse,
  salle, nom, CONNECTER, PING, DÉCONNECTER) ; l. 55 : statut et **nombre** de présences.
- **Aucun peintre ne dessine les pairs ni les repères** : `overview().peers` et `.pings` ne sont lus que
  par `coop.js` et `world-evolution-ui.js` (recherche dans `src/`). La présence existe dans le protocole,
  pas encore à l'écran.

### 1.4 Tests existants (à garder verts)

`tests/coop-relay154`, `coop-ui154`, `audit185-coop`, `audit185-coop-relay`, `undercovered200-coop`,
`coop-floor201`, `continuation202-coop-lifecycle` : isolation par carte et par étage, refus des états
forgés, cadence, admission, sockets tardifs, contre-pression.

### 1.5 Ce que la simulation impose (`src/game.js`, `src/frontier.js`)

| Constat | Où | Conséquence pour la coopération |
|---|---|---|
| Une seule boucle : `loop` découpe le temps d'écran en pas bornés et appelle `update(dt)`. | `game.js` l. 1206–1226 | L'horloge de jeu est celle de l'écran de l'hôte ; elle s'arrête si l'onglet est caché (l. 1210). |
| `update` s'arrête dès qu'il y a pause, superposition ou fin de partie. | `game.js` l. 1238 | Tout dossier ouvert gèle la cité. Neuf modules posent `paused = true` (dont `command-ui.js` l. 167, `succession133.js` l. 87) et six posent `activeOverlay`. |
| **Un seul acteur joueur** : `g.player`, une seule entrée clavier `g.input`. | `game.js` l. 1287 (`updatePlayer`) | Un deuxième humain n'a ni corps, ni entrée, ni tir. |
| La région est une **bulle unique** centrée sur le Commandant : quand `frontier.active()`, `updatePlayer` et `handlePressed` sont remplacés par ceux de la région. | `frontier.js` l. 274 | La cité **continue** de tourner pendant une sortie (`frontier.js` l. 278 appelle toujours l'ancien `update`) : l'hôte peut déjà explorer pendant que la cité est simulée. Mais une seule bulle régionale existe, attachée à `g.player`. |
| Hasard non reproductible dans la simulation : `Math.random` (zombies, `game.js` l. 84, 97, 99), graine de `Random` tirée de `Date.now()` (l. 743), pas variable selon la cadence d'écran (l. 1213). | `game.js` | Une coopération en **pas synchronisés** (« lockstep ») est exclue sans réécrire la simulation : la seule voie compatible est **l'hôte autoritaire** qui envoie des images de l'état. |
| Sauvegarde : `serialize` (l. 774), `save` (l. 798, toutes les 30 s l. 1249), `restoreSave` (l. 832), modules additifs via `g.expansions` ; `frontier` ajoute son état (`frontier.js` l. 276). | | Une seule sauvegarde, celle de l'hôte ; les invités n'ont rien à écrire. |
| Deux vues de citadelle (2,5D et FPS WebGL) lisent la même simulation. | `vertical-citadel175*.js` | Un invité regarde l'une ou l'autre vue **depuis l'image reçue**, jamais depuis une seconde simulation. |

## 2. Ce qui manque pour « un joueur tient le mur pendant qu'un autre explore »

| Manque | Pourquoi c'est bloquant |
|---|---|
| **Autorité unique** sur le monde | Aujourd'hui chaque joueur simule sa propre campagne : rien n'est partagé. |
| **Deuxième acteur** (responsable de district ou chef de sortie) | La simulation n'a qu'un `g.player` et une seule entrée. |
| **Cité et région en même temps pour deux humains** | Déjà vrai pour « l'hôte explore, l'invité tient le mur » (la cité tourne pendant la sortie). Faux pour l'inverse : la bulle régionale suit `g.player`. |
| **Temps continu** | En solo la pause et les dossiers gèlent tout ; la bible exige « aucune pause à plusieurs ». |
| **Synchronisation** | Aucun message d'état du monde n'existe ; un siège compte des centaines à des milliers de corps. |
| **Rôles et droits** | Rien ne dit qui peut construire, donner un ordre, ouvrir une porte ou dépenser un stock. |
| **Sauvegarde et reprise** | Rien ne dit ce que devient l'avatar d'un invité à la sauvegarde, au départ, à la reconnexion. |
| **Triche et sécurité** | Le relais n'authentifie personne ; un invité ne doit jamais pouvoir écrire une position, un stock ou un dégât. |

## 3. Exigences

| Id | Exigence | Vérification |
|---|---|---|
| E1 | **Une seule simulation** : celle de l'hôte. Un invité ne fait tourner ni `update`, ni génération, ni tirage aléatoire de simulation. | Test : l'invité n'a pas d'objet `Game` actif ; ses changements n'arrivent que par l'image. |
| E2 | **Un invité n'envoie que des intentions** (se déplacer d'une direction unitaire, viser, tirer, signaler, tenir un district) ; jamais une position, un stock, un dégât ni une horloge. | Tests de refus : champs supplémentaires, vitesse > 1, types inconnus, répétitions, intentions hors rôle. |
| E3 | **Ordre stable** : pour une même suite de messages par siège, l'hôte applique les intentions dans le même ordre (pas, siège, numéro), quel que soit l'entrelacement à l'arrivée. | Test d'entrelacement. |
| E4 | **Le solo est inchangé au bit près** tant qu'aucune session n'est ouverte : mêmes sauvegardes, même parcours déterministe. | `replay.cjs` 240 s et rechargement de mi-parcours : sorties identiques octet pour octet. |
| E5 | **Une seule sauvegarde**, celle de l'hôte, au format versionné existant ; la session n'y ajoute rien tant qu'une décision (D4) ne l'exige pas, et alors par un module additif enregistré via `g.expansions`. | Test : `serialize` identique avec et sans invité assis (hors avatars, D4). |
| E6 | **Le Commandant reste unique** et appartient à l'hôte ; un invité est responsable de district ou chef de sortie. | Test : le rôle `commandant` est refusé à l'admission. |
| E7 | **Un à trois invités**, qui rejoignent ou quittent une campagne en cours ; la campagne ne tourne que si l'hôte joue. | Tests d'admission, de départ, de fermeture. |
| E8 | **Aucune pause à plusieurs** : avec au moins un invité assis, le temps de l'hôte ne s'arrête pas (dossiers, poste de commandement, mort du Commandant, onglet caché — selon D3). | Test de boucle sous superposition, en session. |
| E9 | **Peintres sans effet** : les images reçues sont dessinées par les peintres existants (2,5D, FPS) sans créer de stock, de dégât, de tirage ni d'horloge de jeu. | Tests de non-mutation, comme `actor-presentation`. |
| E10 | **Image bornée** : ce que l'hôte envoie à un invité est une lecture bornée (rayon, nombre de corps, de bâtiments), sans référence vers l'objet de l'hôte. | Test sur une vraie partie : empreinte de `serialize` inchangée après lecture. |
| E11 | **Les records restent locaux** et sans classement. | Aucun envoi de `profile.js`. |

## 4. Parcours joueur visés

1. **Ouvrir sa cité** : l'hôte, en partie, ouvre une session ; un code de six à douze caractères
   s'affiche. Rien ne change pour lui tant que personne ne rejoint.
2. **Rejoindre** : l'invité saisit l'adresse du relais et le code, choisit « responsable de district » ;
   il apparaît au dépôt de l'hôte, voit la cité depuis l'image reçue.
3. **Tenir le mur pendant que l'hôte explore** : l'hôte sort en région ; l'invité tient la porte nord,
   tire, signale ; la radio de cité (`city-radio217.js`) annonce la brèche à l'hôte pendant sa sortie.
4. **Pas de pause** : l'hôte ouvre le poste de commandement ; la cité continue, l'invité continue de tirer.
5. **Départ et retour** : l'invité ferme son onglet ; son avatar rentre au dépôt puis disparaît ; il
   revient avec le même code et retrouve un siège.
6. **Fin de session** : l'hôte quitte ; l'invité voit « Campagne de l'hôte fermée » et n'emporte rien.
7. **Plus tard (tranche C7)** : un invité « chef de sortie » explore pendant que l'hôte tient le mur.

## 5. Hors champ

- Serveur persistant, matchmaking, classement, échanges d'objets entre campagnes.
- Coopération sur des réseaux publics sans relais de confiance (voir D2).
- Modification des règles de jeu solo, des générations, des flux RNG ou des identifiants.

## 6. Décisions

### 6.0 Décisions tranchées par l'utilisateur (23 novembre 2026)

| Id | Choix | Conséquence dans le code |
|---|---|---|
| D1 | **Les deux rôles** : responsable de district dans la cité (C4) **et** chef de sortie en région (C7, seconde bulle régionale détachée de `g.player`). | C4 livré (`src/coop-host217.js`). Tant que C7 manque, l'hôte refuse le rôle `sortie` avec la raison `role` ; l'interface le montre grisé. |
| D2 | **A** — étendre le relais WebSocket existant, sans autorité, code de salle exigé, protocole 217 séparé du 200. | `scripts/coop-server.mjs` (C2). |
| D3 | **A** — aucune pause tant qu'un invité est assis : dossiers et poste de commandement sans geler `update`, relève sans pause, onglet caché en pas réduits puis interruption propre ; pause solo intacte hors session. | Prédicat unique `g.coopHost217.live()`, lu par `loop` (`game.js`) et l'enveloppe de `update` (C5). |
| D4 | **A + C** — l'avatar d'invité n'est pas sauvegardé, il réapparaît au dépôt ; son sac est versé au dépôt de l'hôte au départ et avant chaque sauvegarde. | Aucune clé de sauvegarde ajoutée ; le chargeur de l'avatar est compté dans `resources` de chaque `serialize` et rendu au dépôt au départ et à la mort. |
| D5 | **A** — combattre et signaler seulement (déplacement, visée, tir, repère, district tenu) ; construction, lois, ordres et dépenses restent au Commandant unique. | Rôle `district` : `move`, `aim`, `fire`, `ping`, `hold`. Le tir puise dans le stock de munitions de l'hôte (chargeur de 30), sans autre dépense. |
| D6 | **B** — jusqu'à trois invités dans le protocole ; un seul pour la première vérification en vrai navigateur. | Trois sièges au relais et chez l'hôte ; vérification Chromium avec un invité. |
| D7 | **A** — image bornée autour de l'invité (rayon, nombre de corps) à 5–10 images/s avec interpolation, masses agrégées au-delà. | 8 images/s, rayon 900, 200 corps, 320 bâtiments, masses par carreaux de 640 ; interpolation et prédiction d'affichage chez l'invité. |

Les options ci-dessous restent comme trace du cadrage.

### 6.1 Options présentées lors du cadrage

Chaque décision propose deux ou trois options et une recommandation.

### D1 — Quel rôle prend l'invité dans la première version jouable ?

- **A. Responsable de district dans la cité** (l'hôte garde la région). Réutilise la bulle régionale
  unique et la cité qui tourne déjà pendant une sortie (`frontier.js` l. 278).
- B. Chef de sortie en région (l'hôte garde la cité). Exige une seconde bulle régionale détachée de
  `g.player` (frontier, faune, poursuites, véhicules) : chantier lourd.
- C. Les deux dès la première version.

**Recommandation : A**, puis B en tranche C7. C'est le parcours de la feuille de route avec le moindre
risque : « un joueur tient le mur pendant qu'un autre explore » est vrai dès que l'hôte sort.

### D2 — Par quel transport ?

- **A. Étendre le relais WebSocket existant** (`scripts/coop-server.mjs`) avec un protocole 217
  séparé : l'hôte et les invités d'une salle, le relais toujours sans autorité, code de salle exigé.
- B. WebRTC pair à pair (canal de données) avec le relais comme simple signalisation : moins de
  latence, mais traversée NAT, serveur STUN/TURN et surface de test bien plus grande.
- C. Hôte qui ouvre lui-même un serveur (application de bureau) : impossible dans un navigateur seul.

**Recommandation : A.** Il garde les budgets, les tests et l'hébergement local actuels ; B reste possible
plus tard derrière la même interface de session.

### D3 — Que devient la pause quand un invité est assis ?

- **A. Aucune pause tant qu'un invité est assis** : les dossiers et le poste de commandement s'ouvrent
  sans geler `update` ; la mort du Commandant ouvre la relève sans pause ; un onglet caché continue à
  pas fixes réduits (minuterie), puis la session s'interrompt proprement au-delà d'un délai.
- B. Pause possible par l'hôte seul, annoncée aux invités.
- C. Pause par vote.

**Recommandation : A**, conforme à la bible (« le temps ne s'arrête jamais »). La pause solo reste
intacte hors session.

### D4 — L'avatar d'un invité est-il sauvegardé ?

- **A. Non** : l'avatar est un acteur de session, absent de `serialize` ; à la reprise, l'invité
  réapparaît au dépôt. Aucune migration de sauvegarde.
- B. Oui, par un module additif `g.expansions` qui garde position, santé et munitions de chaque siège.
- C. Seulement ce qu'il porte (sac) rendu au dépôt à la sauvegarde.

**Recommandation : A + C** : rien de nouveau dans le format, et ce qu'un invité a ramassé est versé au
dépôt de l'hôte au départ et avant chaque sauvegarde (aucune perte, aucune duplication).

### D5 — Que peut faire un responsable de district ?

- **A. Combattre et signaler seulement** (déplacement, visée, tir, repère, désignation du district
  tenu) : la construction, les lois, les ordres d'escouade et les dépenses restent au Commandant.
- B. A, plus réparer et charger les munitions de son district (dépense du stock de l'hôte).
- C. Tous les droits du Commandant sur son district.

**Recommandation : A** pour la première version jouable, B ensuite si l'essai montre que l'invité
s'ennuie. Le Commandant reste unique (bible §7.12).

### D6 — Combien d'invités pour la première version jouable ?

- A. Un seul invité.
- **B. Jusqu'à trois, comme la bible** : le protocole C1 les gère déjà ; la bande passante se règle
  par le rayon de l'image.

**Recommandation : B** pour le protocole, A pour la première vérification en vrai navigateur.

### D7 — Que voit un invité de la cité ?

- **A. Une image bornée autour de lui** (rayon, nombre de corps) et les masses agrégées au-delà
  (les compteurs `hidden`), à 5 à 10 images par seconde, avec interpolation d'affichage.
- B. L'état complet à chaque image : impossible au-delà de quelques centaines de corps.

**Recommandation : A.**

## 7. Risques

| Risque | Effet | Parade |
|---|---|---|
| La simulation suppose un seul `g.player` dans des dizaines de modules (cibles des zombies, actions contextuelles, véhicules). | Un deuxième acteur ignoré, ou pris pour le Commandant. | L'avatar d'invité est d'abord un **combattant de cité** (comme une unité), pas un second `g.player` ; tranche C4 avec tests de cibles. |
| Neuf modules posent `paused = true`, six posent `activeOverlay`. | Gel du temps en session. | Une seule porte « session active » consultée par `loop`/`update` (C5), test par module. |
| Bande passante d'un siège (milliers de corps). | Images trop grosses, latence. | Image bornée et triée (C1 livré), masses agrégées, cadence réglable. |
| Latence perçue par l'invité. | Tir imprécis. | Prédiction d'affichage de son seul avatar (intentions non confirmées, `pending()` en C1) ; l'hôte reste juge. |
| Relais ouvert à tous. | Intrusion, déni de service. | Code de salle exigé (C1), budgets du relais existant, protocole 217 isolé du 200. |
| Onglet de l'hôte caché. | Le navigateur bride `requestAnimationFrame`. | D3 : pas réduits par minuterie, puis interruption annoncée. |
| Coût de maintenance de deux protocoles. | Régressions. | Le protocole 200 (présence) reste tel quel et testé ; le 217 vit à côté. |
