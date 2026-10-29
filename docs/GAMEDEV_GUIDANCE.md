# Guider le développement de DEADWALL avec les skills gamedev

Ce guide rattache les méthodes d'[awesome-gamedev-agent-skills][upstream] aux
systèmes et aux vérifications de DEADWALL. Il sert à préparer, réaliser et relire
les prochains changements. Choisir les références selon le travail demandé,
puis vérifier leur application dans le jeu.

**État inspecté :** DEADWALL **1.74.0**, commit
[`0a38a12301e1b60650f49c592dcbefe806e60cda`][deadwall-base], le 29 octobre 2026.
**Révision des guides consultés :**
[`19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`][upstream].
Les liens amont ci-dessous sont figés sur cette révision. Après une évolution du
jeu, vérifier les propriétaires et commandes dans le checkout courant.

## Sommaire

1. [Contrat du moteur](#1-contrat-du-moteur)
2. [Choisir les guides](#2-choisir-les-guides)
3. [Relier les méthodes au code](#3-relier-les-méthodes-au-code)
4. [Adaptations propres à DEADWALL](#4-adaptations-propres-à-deadwall)
5. [Scénarios de réception](#5-scénarios-de-réception)
6. [Méthode de travail et vérifications](#6-méthode-de-travail-et-vérifications)
7. [Provenance et entretien](#7-provenance-et-entretien)

## 1. Contrat du moteur

Lire d'abord les documents prescrits par [AGENTS.md](../AGENTS.md).
Le parcours [moteurs maison][custom-engines] du catalogue correspond au projet.

| Contrat | Référence dans DEADWALL |
| --- | --- |
| Moteur et plateformes | JavaScript, Canvas 2D/2.5D, interface HTML/CSS ; PWA, HTML autonome et enveloppe Electron. La vue FPS des remparts emploie le WebGL natif de `src/vertical-citadel175-render.js`. |
| Versions et commandes | `package.json` et `package-lock.json` font autorité. Node minimal déclaré : 22.12.0 ; la CI inspectée utilise Node 24. Le numéro du produit et les suffixes historiques des modules sont distincts. |
| Boucle, entrées et état | `src/game.js` possède notamment `Game`, les acteurs, `FlowField`, `Particle` et `AudioSystem`. Relever les hooks et l'ordre de chargement dans `index.html` avant de modifier un module. |
| Règles et dimensions | `src/core.js` centralise les règles. Suivre les exports effectifs et les extensions : la première constante historique rencontrée ne décrit pas nécessairement le comportement intégré. Pour une construction, utiliser la définition effective du monde (`world.definition(type)` / `building.def`). |
| Persistance | `src/save.js`, `Game.serialize`, `Game.restoreSave`, `src/frontier-state.js` et les registres des propriétaires. Valider le monde candidat et ses références avant de remplacer la campagne active. |
| Distribution | `scripts/build.mjs`, `scripts/public-manifest183.cjs`, `sw.js` et `desktop/` assurent les variantes web, hors ligne et PC. Un nouveau module ou asset doit rejoindre les listes existantes et leurs contrôles. |
| Présentation | Les peintres lisent la simulation. Poses, sons, caches et VFX suivent les événements effectifs sans devenir propriétaires des ressources ou du monde. |

Avant une modification, identifier le fichier propriétaire, un appel existant
et un test qui utilise réellement son interface. Les exemples GDScript, C# ou
Three.js d'un guide ne constituent pas des API de DEADWALL. Une évolution de
moteur ou de dépendances constitue un chantier distinct, motivé par un besoin.

## 2. Choisir les guides

Commencer par deux ou trois guides pertinents, puis compléter si le périmètre
l'exige. Cette sélection est un ensemble de références à lire ; elle n'ajoute
aucune dépendance au lancement du jeu.

| Travail demandé | Guides à consulter | Application recherchée |
| --- | --- | --- |
| Seed, monde, biomes, composition des lieux | [procedural-gen] + [level-design] | Génération reproductible, budgets de placement, accès, cohérence des routes et des usages. |
| D-17, routes, intérieurs et circulation | [level-design] + [game-ai] | Parcours réellement praticables, échelle physique et navigation cohérente avec les obstacles. |
| Nouvelle partie, reprise, migration et fouille | [save-systems] + [procedural-gen] | Préserver les versions et les possessions ; distinguer création, continuation et activation d'une extension. |
| Hordes, fronts, portes et tourelles | [game-ai] + [performance-optimization] ; [tower-defense] en appui | Invalidation des chemins, pression lisible, ciblage et coût borné de la simulation. |
| HUD, menus, pause et interactions | [game-ui-ux] | Hiérarchie des informations, focus, redimensionnement et propriété des entrées. |
| Tir, impact, recul, pieds directionnels et VFX | [game-feel] + [create-game-assets] | Feedback lié au tir réel, pivots stables, locomotion et visée cohérentes. |
| SFX, ambiances et alertes | [audio-design] + [game-feel] | Mixage, plafonds de voix, diversité des sons répétés et priorité des menaces. |
| Sprites, textures, icônes et atlas | [create-game-assets] et son [pipeline raster][raster] | Références visuelles communes, dimensions, alpha, ancrage et contrôle dans le jeu. |
| Monde dense, mémoire et ralentissements | [performance-optimization] | Scène reproductible, mesures avant/après, coûts CPU/rendu et caches bornés. |
| Récolte, inventaire, production et construction | [survival-crafting] + [save-systems] | Transactions, coûts, contreparties et continuité de la boucle de survie. |

Les guides de genre complètent les contrats du jeu. Par exemple, le respawn de
ressources proposé dans un exemple de survie ne remplit pas à nouveau les
contenants déjà fouillés de DEADWALL ; les vies et primes d'un tower defense ne
remplacent pas la défense physique de la cité.

## 3. Relier les méthodes au code

Les chemins suivants sont des points d'entrée vérifiés dans l'état inspecté,
pas une liste exhaustive des dépendances. Chercher les appels et les wrappers
du sous-système avant de modifier son comportement.

| Domaine | Propriétaires ou points d'entrée | Tests existants à examiner |
| --- | --- | --- |
| Génération régionale | `src/frontier-world.js`, `src/frontier-state.js`, `src/geography135.js`, `src/biomes164.js`, `src/hydrology165.js`, `src/world-stream131.js` | `tests/new-game-generation.test.cjs`, `tests/generation141.test.cjs`, `tests/integration182-generation-details.test.cjs`, `tests/campaign-sites205.test.cjs` |
| D-17 et routes | `src/exploration-125.js`, `src/atlas-projection.js`, `src/region-roadkit.js`, `src/region-settlements.js`, `src/frontier-geometry.js` ; règles `CityGeometry202` / `CityRoadRules202` de `src/core.js` | `tests/city-geometry202.test.cjs`, `tests/city-roads202.test.cjs`, `tests/dayworks-geometry202.test.cjs`, `tests/road-network129.test.cjs` |
| Création et persistance | `src/game.js`, `src/save.js`, `src/campaign-intro132.js`, `src/player-menus194.js`, `src/frontier-state.js`, `src/world-pack131.js` | `tests/new-game-generation.test.cjs`, `tests/campaign-replay.test.cjs`, `tests/input-save-boundaries.test.cjs`, `tests/save-integrity126.test.cjs`, `tests/portable-save-recovery.test.cjs` |
| Hordes et alliés | `src/game.js`, `src/tactics.js`, `src/frontier-routing.js`, `src/frontier.js`, `src/battlefield.js`, `src/squads.js` | `tests/tactics.test.cjs`, `tests/horde-plans147.test.cjs`, `tests/enemy-save-continuity.test.cjs`, `tests/combat156-corpse-geometry.test.cjs` |
| HUD et entrées | `src/game.js`, `src/ui.js`, `src/command-ui.js`, `src/hud135.js`, `src/player-menus194.js`, `src/presentation132.js`, `src/loadout-ui129.js`, `src/fieldcraft.js` et leurs CSS | `tests/hud-layout137.test.cjs`, `tests/player-menus194.test.cjs`, `tests/ui-focus130.test.cjs`, `tests/undercovered200-input.test.cjs`, `tests/loadout-keyboard.test.cjs`, `tests/modal-input216.test.cjs`, `tests/modal-operations216.test.cjs` |
| Acteurs, effets et son | `src/actor-presentation.js`, `src/hero-actions133.js`, `src/actor-actions159.js`, `src/art.js` ; caméra / `Particle` / `AudioSystem` dans `src/game.js` | `tests/locomotion129.test.cjs`, `tests/actor-motion152.test.cjs`, `tests/actor-actions-owners159.test.cjs`, `tests/quality199-audio.test.cjs`, `tests/camera-feedback.test.cjs` |
| Fortifications et verticalité | `src/fortification-pack.js`, `src/vertical-citadel175.js`, `src/vertical-citadel175-state.js`, `src/vertical-citadel175-render.js`, `src/vertical-siege176.js`, `src/vertical-network179.js`, `src/vertical-population181.js` | `tests/vertical-citadel175.test.cjs`, `tests/vertical-siege176.test.cjs`, `tests/vertical-routing180.test.cjs`, `tests/vertical-population181.test.cjs` |
| Performances | `src/game.js`, `src/frontier-world.js`, `src/world-stream131.js`, `src/render-cache153.js`, `src/atlas-render.js` | `tests/generation-performance.test.cjs`, `tests/qa05-performance131.test.cjs`, `tests/qa10-endgame131.test.cjs`, `tests/collision-broadphase208.test.cjs` |

## 4. Adaptations propres à DEADWALL

### Monde déterministe et anciennes campagnes

- Reproduire un défaut avec la graine **et toutes les révisions concernées** :
  génération, détails, écologie, hydrologie, paysage et géométrie locale. Respecter
  les axes d'invalidation de leurs caches.
- Préserver les flux RNG indépendants. Une consultation de carte, un peintre ou
  une nouvelle variante de sprite ne doit pas consommer le hasard de simulation.
- Borner les tentatives de placement ; vérifier les emprises, les portes et les
  chemins avant de compter un lieu comme implanté. Une fiche auteur ou un plan
  inspectable ne constitue pas une implantation observée dans une campagne.
- Conserver les identifiants, prélèvements et budgets finis des sites. Réutiliser
  la transaction de `world-pack131.js` pour les extensions volontaires ; la simple
  ouverture du Guide ne doit ni migrer ni régénérer le monde.

### Géométrie, circulation et ville verticale

- Distinguer les unités locales de D-17 des mètres régionaux ; employer les
  conversions existantes. Mesurer l'emprise physique entière, sa rotation et les
  dégagements, indépendamment des pixels d'une toiture ou d'un atlas.
- Carte, collisions, accès et rendu doivent dériver du même plan. Préserver les
  routes publiques pendant la construction et les constructions pendant le
  financement d'une route. La reprise conserve les positions historiques.
- Étendre les escaliers, ascenseurs, passerelles, postes et personnels existants.
  `g.vertical175` reste le propriétaire commun des vues classique et FPS :
  munitions, cadence, chaleur, énergie, raycast, ennemis et dégâts sont partagés.
- Les changements d'altitude et de support doivent conserver l'identité de
  l'acteur. La destruction d'un support invalide ses équipements et capacités.

### Temps, transactions et sauvegardes

- Une action payée revalide support, étage, portée, accès, danger, ressources et
  mains disponibles à l'exécution. Débiter exactement les quantités acceptées ou
  l'action effectivement achevée, selon le contrat du propriétaire.
- Les tâches interrompues et les reprises suivent leurs règles existantes ;
  éviter les récompenses de migration et les doubles paiements.
- Adapter les principes d'écriture fiable au stockage navigateur/PC utilisé par
  le jeu. Vérifier les erreurs et la sauvegarde de secours ; les appels disque de
  l'exemple Godot ne sont pas transposables tels quels au navigateur.
- Un hit-stop ou un effet visuel ne doit pas remettre arbitrairement le temps à
  une vitesse normale : pause, modale, perte de focus et reprise gardent leur
  propriétaire. Une panne audio ne doit pas interrompre un paiement de gameplay.

### Hordes, rendu et animations

- Conserver le champ de flux pondéré de D-17, les routes alliées et les budgets
  d'apparition. Profiler avant de remplacer un algorithme. Tester portes ouvertes,
  automatiques, verrouillées, fermeture occupée, brèches et pression des corps.
- Augmenter la pression par fronts, logistique et comportements cohérents avec
  le brief. Le catalogue externe ne décide pas du bestiaire de DEADWALL.
- Animer les déplacements et actions accomplis : direction des jambes, visée du
  torse, point de contact au sol, recul et changement de posture. Un cooldown
  restauré ou un ordre sans effet ne doit pas inventer un geste.
- Conserver les dimensions et ancrages entre frames ; vérifier la transparence,
  les découpes et les transitions dans le jeu. Pour des tuiles répétables, regarder
  aussi une répétition 3 × 3 et les raccords de plusieurs variantes.
- Produire sons et VFX depuis les événements effectifs, avec intensité et nombre
  bornés. Les options de réduction des effets doivent préserver l'information
  nécessaire au combat et la lisibilité du HUD.

## 5. Scénarios de réception

Choisir les scénarios touchés par la modification et conserver leur preuve.
Ces attentes orientent la réception ; leur présence dans ce document ne signifie
pas qu'un parcours a été exécuté ni qu'une campagne humaine a été terminée.

| ID | Parcours | Résultat à vérifier |
| --- | --- | --- |
| DW-G01 | Nouvelle partie, graine explicite puis graine vide ; terminer l'introduction et passer par Pause/Reprendre. | La campagne courante est initialisée et sauvegardée complètement ; la reprise ne remplace ni la carte ni sa graine. Une graine vide crée une nouvelle campagne ; annuler un remplacement conserve la précédente. |
| DW-G02 | Régénérer une même graine avec les mêmes révisions, puis parcourir plusieurs graines nommées ; après une défaite, choisir « Rejouer cette carte ». | Plans et identités reproductibles, placement borné, départ accessible, raccords des routes cohérents. Le rejeu conserve toutes les révisions de carte dès sa première sauvegarde et crée une campagne avec une progression neuve ; noter les graines défaillantes et les révisions. |
| DW-G03 | Parcourir D-17, sortir vers la région et revenir ; placer une route et une construction dans plusieurs orientations. | Échelles et positions cohérentes, portes atteignables, emprises sans recouvrement interdit, route et bâtiment protégés avant paiement. |
| DW-G04 | Fouiller, transporter, construire, sauvegarder, fermer le document puis continuer. | Positions, possessions, prélèvements, stocks et progression conservés ; aucun contenant rempli à nouveau ni objet dupliqué. |
| DW-G05 | Charger une campagne historique et proposer l'extension du monde ; annuler puis accepter sur une copie de test. | La simple reprise conserve l'ancien monde. La transaction d'activation préserve possessions et identifiants ; un import invalide ne remplace pas la partie en cours. |
| DW-G06 | Lancer un assaut avec portes de différents modes, brèche, alliés, cadavres et renforts en attente. | Permissions et routes respectées, pression physique cohérente, cadence et comptes de la vague conservés à la reprise, acteurs et file d'apparition bornés. |
| DW-G07 | Accéder à un rempart, utiliser escalier/ascenseur/passerelle, contrôler une tourelle et changer classique/FPS. | Mêmes ressources et cibles dans les deux vues, obstructions respectées, déplacements soumis au temps actif ; alimentation et coupure prises en compte pour l'ascenseur, escaliers utilisables sans courant ; aucune duplication d'ennemi ou de personnel. |
| DW-G08 | Ouvrir et fermer inventaire, commandement et paramètres ; maintenir puis relâcher le raccourci ou Entrée ; naviguer par Échap avec un outil, placement ou trajet actif ; perdre le focus ; reprendre sur bureau et petit écran. | Une action possède les entrées, focus restauré, pause conservée correctement, aucune fermeture involontaire par répétition clavier ni annulation de terrain derrière une modale. L'aperçu visible dans son propre dossier conserve son annulation gratuite ; un aperçu masqué ne consomme pas Échap. Vérifier AZERTY/QWERTY, tactile et lisibilité selon la cible. |
| DW-G09 | Marcher dans les directions prises en charge, viser indépendamment, tirer, recharger, changer de posture puis mettre en pause. | Pieds ancrés, silhouette et pivot stables, tir aligné, poses liées aux actions accomplies, animation suspendue correctement ; absence de mutation de la simulation par le rendu. |
| DW-G10 | Répéter tirs, impacts et alertes ; mettre en pause ; couper/rétablir le son et simuler une indisponibilité audio. | Caméra figée pendant la pause, sons et VFX cohérents avec les événements, voix bornées et nettoyées, aucun événement sonore périmé accumulé pendant une suspension du périphérique ni transaction interrompue par l'audio. |
| DW-G11 | Rejouer une scène de horde et de ville dense identique avant/après. | Relever navigateur, matériel, résolution, graine/révisions, charge et durées de frame ; comparer simulation, rendu, mémoire et croissance des caches. Un test Node de cache ne prouve pas les FPS GPU. |
| DW-G12 | Construire et lancer les variantes de distribution concernées ; exercer une mise à jour PWA et une reprise hors ligne si les ressources publiées changent. | Modules et assets présents, provenance conservée, sauvegarde accessible après relancement, pas de mélange de ressources de versions différentes. |

## 6. Méthode de travail et vérifications

1. Fixer le commit de départ et lire le brief ainsi que les contrats concernés.
2. Reproduire le problème ou décrire l'action joueur attendue. Choisir les guides
   utiles et les scénarios de réception ; consigner les systèmes touchés.
3. Suivre le propriétaire réel, ses appels et ses tests. Réaliser un changement
   cohérent de bout en bout, avec données, coût, interaction, présentation et
   persistance nécessaires à la fonctionnalité.
4. Exécuter les vérifications pertinentes et la validation intégrée demandée par
   `AGENTS.md`. Adapter les tests de comportement lorsqu'un système change.
5. Vérifier le parcours dans le jeu, puis documenter résultats, limites et reste
   à faire. Une capture préparée, un test Node et un parcours Chromium sont des
   preuves différentes.
6. Remplir le [modèle de PR](../.github/pull_request_template.md). Mettre à jour
   le suivi existant si la fonctionnalité y figure, avec son statut réel.

### Commandes existantes

Installation de développement à partir du verrou du dépôt, puis validation :

```sh
npm ci
npm run check
```

`check` exécute la vérification de syntaxe, le build et les tests natifs ; le
prétest prépare les données compilées. Les fichiers natifs peuvent être lancés
individuellement pendant l'itération, après préparation de leurs dépendances.
Ils complètent cette commande intégrée.

| Domaine | Parcours existants à choisir selon le changement |
| --- | --- |
| Arrivée et géométrie | `npm run test:arrival`, `npm run test:world` |
| Début et progression de D-17 | `npm run test:d17`, `npm run test:city` |
| Hordes et défenses | `npm run test:tactics`, `npm run test:assault`, `npm run test:defenses` |
| HUD et menus | `npm run test:browser`, `node scripts/browser-touch-layout162.mjs`, `node scripts/browser-player-menus194.mjs` |
| Acteurs et qualité visuelle | `npm run test:sprites`, `npm run test:quality`, `npm run test:world-art` |
| Pause, retours d'action et sac | `node scripts/browser-feedback215.mjs` |
| Verticalité et FPS | `node scripts/qa-vertical175.mjs`, puis les parcours 176 à 181 selon les modules touchés |
| Publication web et autonome | `npm run verify:web`, `npm run test:standalone` |

Les parcours navigateur demandent les dépendances verrouillées, un build et le
navigateur attendu par leurs scripts. Suivre la configuration des workflows
existants plutôt qu'installer arbitrairement une autre version de Playwright.

La CI de [validation complète](../.github/workflows/fullcheck201.yml) exécute
`DEADWALL_SOAK=1 npm run check` sur le commit de tête de la PR et conserve les
journaux, statuts et empreintes. La [CI principale](../.github/workflows/ci.yml)
complète avec ses partitions natives, parcours Chromium et vérification Windows.
Réutiliser ces workflows ; citer le résultat du commit réellement vérifié.

Si une commande est bloquée ou encore en cours, préciser laquelle et ce qui
reste non vérifié. Une lecture du code ou des noms de tests ne permet pas de
déclarer le contrôle réussi. En particulier,
`tests/generation-performance.test.cjs` contrôle des contrats de géométrie et de
cache ; les performances graphiques se mesurent dans un vrai navigateur.

## 7. Provenance et entretien

Les guides amont sont publiés par **Abhishek Barali et les contributeurs** sous
[Apache-2.0][upstream-license], avec une [notice d'attribution][upstream-notice].
Le présent document contient des consignes propres à DEADWALL et des liens vers
ces références. Aucun fichier de skill, script ou asset amont n'est recopié ou
exécuté par cette intégration documentaire ; aucune installation personnelle
globale n'est effectuée.

Pour réviser cette sélection, comparer la nouvelle révision amont, lire les
guides modifiés et réexaminer leurs adaptations au moteur. Actualiser les liens
et la date dans une PR relue. Éviter une mise à jour automatique de ces références
en cours de tâche. Si une copie de fichiers tiers est proposée ultérieurement,
conserver leur provenance, les références nécessaires, la licence, la notice et
les indications de modification correspondantes.

[deadwall-base]: https://github.com/darknigthmare/deadwall-last-enclosure/commit/0a38a12301e1b60650f49c592dcbefe806e60cda
[upstream]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9
[custom-engines]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/router/references/custom-engines.md
[procedural-gen]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/procedural-gen/SKILL.md
[level-design]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/level-design/SKILL.md
[save-systems]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/save-systems/SKILL.md
[game-ai]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ai/SKILL.md
[game-ui-ux]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/SKILL.md
[game-feel]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-feel/SKILL.md
[audio-design]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/audio-design/SKILL.md
[create-game-assets]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/SKILL.md
[raster]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/references/raster-pipeline.md
[performance-optimization]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/performance-optimization/SKILL.md
[survival-crafting]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/genres/survival-crafting/SKILL.md
[tower-defense]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/genres/tower-defense/SKILL.md
[upstream-license]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/LICENSE
[upstream-notice]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/NOTICE
