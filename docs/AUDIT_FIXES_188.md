# Qualification 188 — Accès de service conservé pendant le parcours de ville

Base examinée : `99e35b343fa0f0a7547479fba16039f8dbdb1c01`. Ce correctif poursuit la PR #8 sans changer les fichiers distribués du jeu, les graines, les coûts, les dégâts ni le format des sauvegardes.

## Cause reproduite

Le parcours `browser-city-content150.mjs` choisissait un point de service au sud-est du dépôt, protégé par une casemate réellement payée. Les placements ultérieurs ne connaissaient pas cette réservation. Dans le reçu d'échec du run `38955869702`, le point `(2104, 2139)` était occupé par la conserverie électrique achevée, ID 84, cellule `(64, 66)`. Le dépôt et la sauvegarde restaient valides ; c'était la préparation spatiale du contrôle qui réutilisait un point devenu impossible.

Les groupes `browser / city`, `Audit regressions` et `Advanced Regression / city` exécutaient ce même parcours. Relancer sans changer cette préparation pouvait donc reproduire le même échec. Le jeu n'est pas modifié pour laisser le personnage traverser cette construction.

## Correction

La préparation de chaque construction suivante reçoit maintenant la réservation explicite `{id, point}` de la casemate. Elle refuse les sites qui croisent le point de travail, son accès à la façade avec le rayon du personnage, ou la ligne de tir du défenseur. L'intersection analytique segment/rectangle inclut les contacts aux extrémités. Les règles ordinaires de placement, la marge de sécurité des ouvriers, les collisions, les positions existantes et les recherches complètes des suites 186–187 sont conservées.

La réservation est une donnée de test, pas une nouvelle règle de construction imposée au joueur. Elle ne modifie pas les objets, ne crée pas de terrain libre, ne déplace aucun bâtiment et n'accorde ni ressources ni protection artificielle. Les constructions du parcours navigateur restent payées et travaillées avec les vraies commandes et le temps ordinaire. La protection de ce même point est vérifiée après chaque nouvelle construction, au lieu d'être simplement présumée jusqu'à l'entraînement.

`prepareService150` vérifie également la portée et la position avant toute restauration : demander un point physiquement libre mais hors de portée est refusé sans remplacer le monde ou déplacer le personnage. Un défenseur manquant et des coordonnées invalides sont refusés avant mutation.

## Tests locaux réellement exécutés

- Quatre tests `audit188-city-reservation.test.cjs` : **4/4** réussis.
- Régressions de placement 186, recherche 187 et réservation 188 exécutées ensemble : **12/12** réussies, zéro échec, annulation, test ignoré ou TODO.
- Syntaxe : **351 fichiers** vérifiés.

Les quatre nouveaux tests sont inclus dans le groupe de douze ; ces comptes ne s'additionnent pas. Ils couvrent trois constructions payées successives, les sauvegardes/restaurations, le point sud-est du scénario d'échec et les refus atomiques. Les tests isolés préparent une défense initiale et avancent explicitement la construction : ils ne sont pas présentés comme une campagne humaine ni comme une validation graphique.

## Qualification pour la fusion

Le groupe permanent d'audit inclut maintenant la suite 188. Le parcours complet de ville, son entraînement de 90 secondes, ses deux profils ordinateur/tactile, les reprises exactes et tous ses contrôles précédents sont conservés. Aucun filtre de test, mode court, bonus, `continue-on-error` ou nouvelle tolérance de succès n'est ajouté. Le résultat de la CI globale et des suites spécialisées doit être lu sur le commit final ; les succès d'un parent ne constituent pas une exécution sur le nouveau commit.

La préparation temporaire d'un objet Git ne fait pas partie des fichiers finaux. Aucune fusion ou publication en production n'est effectuée par cette passe. Le rendu artistique, les intérieurs libres et la campagne humaine complète restent des qualifications distinctes.

## Contrôle vertical interrompu à 55 minutes

Le run `38955869829` a réussi les contrats verticaux, les régressions natives ciblées et les six parcours navigateur 175–180. Son `npm run check` monolithique a ensuite été interrompu à la limite du job (19:36–20:31 UTC le 16 octobre), pas validé.

Le workflow vertical utilise maintenant le même partitionnement exhaustif `ci-native186.mjs` que la CI principale : six groupes indépendants exécutent syntaxe, build, préparation et la totalité de l'inventaire de tests, avec l'endurance activée. L'agrégateur revalide les sources avant/après, les commandes, les journaux, les comptes et la couverture exacte de tous les fichiers. Le contrôle final historique `network180` exige simultanément les scénarios ciblés et cet agrégat. Échec, annulation, groupe ignoré ou manquant restent bloquants.

Aucun test n'est retiré au profit d'une simple lecture d'état d'un ancien run. Ces six groupes sont réellement exécutés dans ce workflow sur son propre commit. Ce n'est plus une invocation monolithique de `npm run check`, mais sa qualification exhaustive distribuée avec preuves, plus l'endurance. Les trois nouveaux tests `audit188-vertical-ci.test.cjs` passent et vérifient la conservation des scénarios, le même exécuteur exhaustif et les refus du contrôle final. Le délai n'est pas présenté comme un gain de performance du jeu.
