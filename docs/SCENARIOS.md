# Départs de campagne — DEADWALL 1.0

Quatre conditions de départ utilisent la même cité, les mêmes huit profils d’infectés, les mêmes règles de vague et les mêmes objectifs. Un départ n’est ni une quatrième difficulté, ni un bonus permanent. La difficulté Survivant / Standard / Brutal demeure indépendante.

## Contrats initiaux

Les réserves ci-dessous correspondent à Standard. `B` : bois ; `F` : ferraille ; `P` : pierre ; `N` : nourriture ; `C` : carburant ; `M` : munitions ; `+` : médicaments.

| Départ | Équipe hors commandant | B / F / P / N / C / M / + | Centre | Calme initial |
| --- | --- | --- | --- | --- |
| Départ classique (`classic`) | 3 ouvriers | 180 / 120 / 70 / 130 / 45 / 180 / 12 | 3 200 / 3 200 PV | 82 s |
| Convoi de civils (`convoy`) | 5 ouvriers | 180 / 120 / 70 / 80 / 25 / 180 / 8 | 3 200 / 3 200 PV | 82 s |
| Dépôt à reconstruire (`reconstruction`) | 3 ouvriers | 225 / 150 / 90 / 130 / 30 / 120 / 12 | 1 920 / 3 200 PV | 112 s |
| Arrière-garde (`rearguard`) | 2 ouvriers + 1 fusilier | 130 / 110 / 70 / 115 / 45 / 220 / 12 | 3 200 / 3 200 PV | 64 s |

Le Convoi accroît la main-d’œuvre mais remplit les six logements du centre, commandant inclus. Il consomme davantage de rations et oblige à développer le logement avant un nouveau recrutement.

La Reconstruction donne des matériaux et du temps contre un centre vulnérable et moins de carburant ou de munitions. Réparer immédiatement le centre coûte actuellement 29 ferraille avec l’action de réparation manuelle ; le supplément de ferraille ne rend pas cette réparation gratuite.

L’Arrière-garde remplace un ouvrier par un fusilier et affecte une plus grande réserve aux armes. Les chantiers disposent de moins de bras et de bois ; l’alerte arrive plus tôt. Le soldat utilise les munitions et le commandement existants. Sa présence initiale ne débloque ni caserne, ni palier, ni recrutement de soldats supplémentaires.

Survivant ajoute exactement les bonus historiques : +50 bois, +35 ferraille, +50 nourriture et +50 munitions. Chaque temps de calme initial est multiplié par `difficulty.calmTime` : 1,20 / 1 / 0,82. Les calmes des vagues suivantes, la santé des infectés, leur nombre et les rendements restent exclusivement régis par la difficulté et les systèmes existants.

## Expérience et périmètre

Le menu présente le contexte, l’avantage, la contrepartie et les chiffres correspondant à la difficulté choisie. Préparer un autre départ ne change pas la campagne active ; la confirmation de remplacement de sauvegarde reste obligatoire.

Tous les départs commencent au palier Refuge, avec un seul centre, sans doctrine ni insight offert. Le tutoriel à huit objectifs et le registre narratif restent accessibles. Les variantes ne préconstruisent pas une enceinte, n’ajoutent aucun butin dans le monde et ne modifient pas les gisements ou les six secteurs d’une graine.

Après une défaite, rejouer la même carte conserve graine, difficulté et départ mais crée une nouvelle identité de campagne. Une nouvelle carte conserve difficulté et départ avec une nouvelle graine tirée par le mécanisme historique. Ni les records ni les campagnes précédentes n’accordent de ressources.

## Données et API

Les valeurs d’équilibrage sont centralisées dans `C.START_SCENARIOS` et `C.START_SCENARIO_STORY_BONUS`.

`src/scenarios.js` est un module pur, sans stockage, DOM, RNG ni service distant :

- `normalize(id)` : absence de champ → `classic` ; valeur inconnue, vide ou `null` refusée ;
- `get(id)` / `list()` : définitions immuables ;
- `initialState(id, difficulty)` : nouvelles réserves et liste de rôles, intégrité et calme initial calculés pour la difficulté ;
- `game.startNew(difficulty, seed, scenarioId = 'classic')` : validation avant remplacement du monde ;
- `game.scenarioId` : identité du départ de la campagne en cours.

`src/scenario-ui.js` renseigne `startScenario`, `startScenarioDescription` et `startScenarioFacts`. `game.scenarioUI.refresh()` permet d’actualiser l’aperçu après une préparation depuis les archives.

Le chemin classique conserve sa séquence historique de créations et de tirages aléatoires. Trois empreintes de référence, une par difficulté avec une horloge et un aléatoire de test fixes, contrôlent les stocks, le joueur, les unités, les IDs, les bâtiments, les gisements, le délai et l’état RNG. Les nouveaux champs de classement ou de groupes ne sont pas assimilés à une modification de ces anciennes valeurs.

## Sauvegardes et records

Le champ `scenarioId` est additif dans les sauvegardes v2. Son absence dans un ancien fichier v1/v2 signifie `classic`, sans redonner de ressources, d’unité, de santé ou de temps. Un scénario inconnu est refusé avant mutation. Reprendre une variante restaure exactement son état sauvegardé ; cela ne rejoue jamais son initialisation.

Le profil v1 et ses clés de stockage demeurent conservés :

- `recentRuns[].scenarioId` identifie chaque campagne ;
- `byScenario[scenarioId][difficulty]` conserve les cinq records séparément ;
- `byDifficulty` demeure une vue de compatibilité des records classiques uniquement, jamais un total des variantes ;
- les anciens records sans champ de scénario sont attribués au classique ;
- réutiliser le même `runId` avec un autre scénario est refusé ;
- les dix campagnes récentes sont bornées, mais les meilleurs records de chaque départ restent présents après éviction de leur campagne ;
- copies de secours, conservation de corruption et fusion avant écriture restent appliquées.

## Vérification

`tests/scenarios.test.cjs` couvre les douze combinaisons départ/difficulté, les références historiques, l’absence de modification du monde, récolte/dépôt/construction sur les quatre départs, réparation payante du dépôt, migration et refus transactionnels, relances et séparation des records.

Les tests locaux de simulation utilisent des placements de joueur contrôlés pour isoler les interactions ; ils ne constituent pas des parties humaines complètes. La validation de menu dans le vrai navigateur et les tests prolongés d’équilibre complètent ces contrôles.

Commande ciblée : `node --test tests/scenarios.test.cjs tests/profile.test.cjs tests/progression.test.cjs tests/recovery.test.cjs`. La livraison doit aussi passer `npm run check`.
