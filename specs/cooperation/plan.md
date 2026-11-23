# Vraie coopération — plan

Besoin : [spec.md](spec.md). Tâches : [tasks.md](tasks.md). Commit de référence : `cc9efd9`.
Décisions D1–D7 tranchées le 23 novembre 2026 ([spec.md §6.0](spec.md)) ; C2 à C5 livrés, C6 en partie (bilan dans [tasks.md](tasks.md)).
Vérification réelle : serveur de jeu 8756, relais 8757 (au lieu de 4512/4513 prévus).

## 1. Architecture cible

```
            ┌──────────────── navigateur de l'HÔTE ─────────────────┐
 relais     │  Game (src/game.js) — LA simulation, sa boucle, sa     │
 WebSocket  │  sauvegarde versionnée, ses deux vues de citadelle     │
 (proto     │        ▲ intentions appliquées au début du pas         │
  217,      │        │                 │ lecture bornée (shareView)  │
  sans  ◄──►│  adaptateur hôte (C4) ◄──┴── session hôte (C1, pur)    │
 autorité)  └────────────────────────────────────────────────────────┘
     ▲
     │      ┌──────────────── navigateur d'un INVITÉ ───────────────┐
     └─────►│  session invité (C1, pur) → images → peintres (C6)    │
            │  clavier/souris → intentions ; aucune simulation      │
            └────────────────────────────────────────────────────────┘
```

Principes, tous dérivés des contrats du dépôt :

1. **Une seule simulation.** `Game.update` de l'hôte reste l'unique horloge de jeu. L'invité ne crée
   pas de `Game` jouable : il reçoit des images.
2. **Hôte autoritaire, invités à intentions.** Le pas synchronisé est exclu (spec §1.5 : `Math.random`
   dans la simulation, graine tirée de l'heure, pas variable). L'hôte applique les intentions au début
   de son pas, dans l'ordre (pas, siège, numéro) rendu par `createHost().step(n)`.
3. **Peintres sans effet.** Les vues 2,5D et FPS de l'invité dessinent l'image reçue (et la seule
   prédiction de son avatar) ; ils ne créent ni stock, ni dégât, ni tirage, ni horloge.
4. **Sauvegarde versionnée inchangée.** Seul l'hôte sauvegarde. L'avatar d'invité est un acteur de
   session absent de `serialize` (décision D4, option recommandée) ; si D4 change, ce sera un module
   additif `g.expansions` (`validate(undefined)` = ancienne sauvegarde, inactif).
5. **Solo identique au bit près** tant qu'aucune session n'est ouverte : chaque tranche le prouve par
   le parcours déterministe de 240 s et le rechargement de mi-parcours.
6. **Aucune règle de jeu nouvelle sans décision** : les budgets vont dans `C.CoopSession217Rules`
   (`src/core.js`), les règles de rôle passent par D5.

## 2. Protocole 217 (livré en C1, `src/coop-session217.js`)

| Message | Sens | Champs (exactement) | Contrôles |
|---|---|---|---|
| `hello` | invité → hôte | `type, protocol, code, name, role` | protocole 217, code `[A-Z0-9]{6,12}` égal à celui de l'hôte, rôle `district` ou `sortie` (jamais `commandant`), nom nettoyé (24 car.) |
| `welcome` / `refused` | hôte → invité | `seat, role, name, tick` / `reason` (`invalid`, `code`, `full`, `closed`) | trois sièges au plus, le plus petit siège libre |
| `intent` | invité → hôte | `type, protocol, seq, kind, data` | `seq` entier strictement croissant ; `kind` permis par le rôle ; `data` réécrite champ par champ (`move {x,y}` de norme ≤ 1, `aim {a}`, `fire {on}`, `ping {x,y}`, `hold {district}`) ; file de 32 au plus |
| `frame` | hôte → invité | `type, protocol, tick, seat, ack, view` | l'invité n'accepte qu'un `tick` plus récent, pour son siège, avec un `ack` ≤ ses envois ; il oublie ses intentions confirmées |
| `closed` | hôte → invités | `type, protocol, tick` | l'invité perd son siège et n'émet plus |

Le pas de l'hôte (`tick`) est un entier fourni par l'adaptateur (compteur de pas de `Game.update`),
jamais l'heure. `step(n)` rend au plus 8 intentions par siège, gelées.

L'image (`shareView(état, foyer)`) lit la forme de `Game.serialize` : vague, phase, temps de phase,
ressources, bâtiments (400 au plus, par identifiant), corps dans un rayon de 900 (240 au plus, par
distance puis identifiant), compteur `hidden` des corps non transmis. Valeurs arrondies, copie sans
référence.

## 3. Tranches

Chaque tranche se livre seule, garde le solo identique et ajoute ses tests. Les numéros C* sont ceux
de [tasks.md](tasks.md).

| Tranche | Contenu | Change le jeu ? | Parcours observable | Tests |
|---|---|---|---|---|
| **C1 (livrée)** | Protocole et état partagé purs, hôte + invité dans le même processus. Non chargé par `index.html`. | Non | Aucun (brique) | `tests/coop-session217.test.cjs` |
| C2 (livrée) | Relais : salles 217 avec un hôte et trois invités, code exigé, routage hôte ↔ invités seulement, protocole 200 intact. | Non (relais) | Deux terminaux Node se parlent par le relais. | test `ws` port 0, budgets, refus |
| C3 (livrée) | Adaptateur hôte **en lecture** : ouvrir une session (code), envoyer des images à 5–10 Hz depuis `serialize` ou une lecture plus légère ; aucune intention appliquée. Script public ajouté (manifeste). | Non en solo ; en session, l'hôte ne change pas | Un second onglet voit la cité de l'hôte en spectateur. | non-mutation, cadence, `replay.cjs` |
| C4 (livrée) | Avatar de responsable de district : acteur de cité de l'hôte, mû par les intentions, ciblé par les zombies, tire avec les munitions de l'hôte (D5-A). Absent de `serialize` (D4-A). | Oui, **en session seulement** | L'invité tient la porte nord pendant que l'hôte est en région. | ordre des intentions, cibles, sauvegarde identique avec/sans avatar, départ → sac au dépôt |
| C5 (livrée) | Temps continu en session (D3) : une porte unique « session active » pour `loop`, `update`, dossiers, poste de commandement, relève, onglet caché. | En session seulement | Le poste de commandement ouvert, la cité continue. | un test par module qui pose `paused`/`activeOverlay` |
| C6 (en partie) | Client invité : interface de connexion, peintres 2,5D et FPS sur l'image, interpolation, prédiction de son avatar. | Non pour l'hôte | Parcours 1 à 6 de la spec en vrai navigateur (deux onglets, ports 4512/4513). | peintres sans effet, image ancienne refusée |
| C7 | Chef de sortie : seconde bulle régionale détachée de `g.player` (D1-B). | En session seulement | Un invité explore pendant que l'hôte tient le mur. | isolement des bulles, poursuites, véhicules |
| C8 | Trois invités, reprise après coupure, fermeture propre, notes de version. | En session seulement | Rejoindre et quitter en cours de vague. | charge, reconnexion |

## 4. Vérification commune

- `node --test --test-concurrency=2` sur les tests de la tranche, les tests coop existants (§1.4 de la
  spec), `tests/audit183-manifest.test.cjs`, `tests/static*.test.cjs`, `tests/siege-readout.test.cjs`,
  `tests/fallback-order.test.cjs`, `tests/breach217.test.cjs`.
- Parcours déterministe `replay.cjs` (240 s, graine 17117) et rechargement de la sauvegarde de
  mi-parcours : sorties et sauvegardes identiques octet pour octet à la base.
- À partir de C3 : vrai navigateur (Playwright), zéro erreur de page, capture regardée.

## 5. Points d'accroche dans le code (pour C3–C5)

| Besoin | Endroit | Méthode |
|---|---|---|
| Compteur de pas de l'hôte | enveloppe de `g.update` (comme `coop.js` l. 206) | incrément après l'ancien `update` si la partie a avancé |
| Application des intentions | avant `updatePlayer` (`game.js` l. 1241) | enveloppe de `updateUnits` ou d'un nouvel acteur de session, jamais d'écriture dans `g.player` |
| Lecture de l'image | après le pas, cadence propre à la session | `shareView(g.serialize(), avatar)` puis allègement |
| Temps continu | `loop` l. 1210, `update` l. 1238 | prédicat « session active » qui ignore `activeOverlay`/`paused` **seulement** en session |
| Radio vers l'hôte en sortie | `city-radio217.js` | inchangé : l'avatar d'invité est un défenseur présent comme un autre |
