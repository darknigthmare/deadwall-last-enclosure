# Occupants physiques des chantiers dans la QA de ville

Base examinée : `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Le correctif concerne uniquement le harnais de vérification de ville et ses tests.

## Défaut observé et portée du diagnostic

L'[audit de PR33, job 133999273438](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44071701627/job/133999273438) échoue dans l'étape `Complete native city construction and service regression from dist`, à l'assertion existante `Non-worker physical occupants must remain a refusal` (`browser-city-content150.mjs:373:16` sur la base).

Le rapport archivé montre l'infecté vivant 85 à `(1071.98, 870.03)`, dans le chantier `continuityArsenal150` 87, dont l'emprise est `[928, 1088] × [800, 928]`. Il est présent dès la première observation du travail, avant tout maintien de E. La sélection du chantier, sa revalidation et l'observateur du paiement ne recensaient que le joueur et les unités. Le contrôle du travail recensait déjà les infectés, le véhicule d'expédition et les camions, et refusait correctement cet occupant.

Le journal ne fournit pas l'inventaire complet à l'instant de la sélection ou du paiement. Il ne permet donc pas de dater précisément l'entrée de cet infecté. La contre-épreuve ci-dessous démontre le défaut de sélection sur un état identique ; elle ne prétend pas reconstruire toute la trajectoire du runner.

Cet incident est distinct du test Art159. Celui-ci réussit explicitement dans le [shard natif 3 de PR32](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44071447976/job/133998417051), avec 976 tests réussis et le précontrôle Canvas accepté pour 164 glyphes. Les packs graphiques de PR33 ne contiennent pas le correctif de polices de PR32.

## Changement

Le préparateur, la sélection visible, la revalidation et le relevé synchrone au paiement recensent désormais les mêmes corps vivants que le contrôle du travail : joueur, unités, infectés, véhicule d'expédition et camions. Les rayons, la marge de sélection de 37 unités pour les autres acteurs et la marge de paiement de 5 unités restent explicites. Les entités mortes ou sans santé ne sont pas prises pour des occupants vivants ; le rayon de secours de 12 correspond au contrôle du travail existant.

Les trois fonctions évaluées dans la page sont déplacées dans `scripts/browser-city-placement150.mjs`. Elles restent autonomes pour la sérialisation Playwright et peuvent être exercées directement sans démarrer le scénario complet. Le relevé de paiement lit les acteurs au moment de l'appel réel, conserve ses arguments, son résultat et ses effets, puis rétablit le propriétaire original.

La navigation, les contrôles de placement, les débits, le travail manuel, l'évacuation par les ordres ouvriers et le refus des autres occupants restent identiques octet pour octet. Aucun acteur n'est supprimé, déplacé ou soigné par ces lectures. Une menace entrant après le paiement reste un refus réel. Aucun fichier de gameplay, de rendu, de dépendance, de workflow, d'Art159 ou de pack graphique ne change.

## Vérifications

La contre-épreuve capture une seule sauvegarde avec un infecté natif vivant au centre de la première parcelle, puis rejoue exactement cet état sur la base et sur le correctif. C'est une préparation négative déclarée, sans avance de simulation.

| Lecture du même état | Base | Correctif |
|---|---|---|
| Parcelle choisie | `(58, 58)`, occupée | `(60, 66)`, libre |
| Infecté conservé | ID 70, `(1936, 1920)`, santé 54 | Identique |
| État sérialisé hors quatre champs de point de vue | Identique à l'entrée | Identique à l'entrée |
| Code de sortie de la contre-épreuve | 1 | 0 |

Empreinte de l'état d'entrée commun : `84434c9ef083807efba7cdebb737a039fec3967999ff005c28f3c95812d7c4d1`. Les seuls champs autorisés à changer par ce préparateur existant sont `player.x`, `player.y`, `phase`, `phaseTime`.

Commande ciblée exécutée :

```sh
node --test tests/audit186-city-placement.test.cjs tests/audit187-city-search.test.cjs tests/audit188-city-reservation.test.cjs tests/audit188-city-physical-occupants.test.cjs
```

Résultat final : **17 tests réussis**, aucun échec, annulation, saut ou TODO. Les cinq tests ajoutés couvrent l'infecté natif, les cinq familles de corps et leurs marges, la distinction vivant/mort, une entrée entre instrumentation et paiement, et la conservation exacte d'une véritable fondation payée. Les tests existants vérifient aussi la recherche de parcelles, la protection du point de service et les reprises de sauvegarde. La syntaxe des trois scripts modifiés/ajoutés et `git diff --check` réussissent.

Un seul lancement du scénario Chromium desktop a été tenté avec Playwright 1.62.1 et le Chromium système 156.0.8078.79. Il s'arrête **avant le chargement du jeu**, sur `process_singleton_posix.cc:297: socket() failed: Operation not permitted (1)`. Aucun parcours Chromium local réussi, build `dist` local ou `npm run check` complet n'est revendiqué. Aucun contournement ni nouvelle tentative n'a été effectué. La CI devra établir le résultat du scénario complet.

Les guides `level-design` et `save-systems`, épinglés par le projet à la révision `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`, motivent respectivement la mesure sur les propriétaires physiques existants et la comparaison de l'état sauvegardé. Aucun changement de schéma de sauvegarde n'est nécessaire.

Les empreintes des sources, des preuves et des portions protégées sont consignées dans [verification.json](verification.json). Les logs et l'état de contre-épreuve sont conservés dans le dossier de travail `ci-followup-20261117-1230`, sans ajouter les archives CI volumineuses au dépôt.
