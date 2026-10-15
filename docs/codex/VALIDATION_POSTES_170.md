# Validation de la passe 170 et fusion de main 1.57.2

## Révision réellement testée

Le run GitHub Actions **38313443986**, job **115024371826**, a reconstruit et testé le commit de fusion **d31f8dc46973dace2e4aae578f83b3668fa2f7e1**. Ce commit conserve la branche Codex et le parent main **c7174caa3a7fe3eea0a3f28acd9b49a8ebab410c** (version 1.57.2, corrections d'arrivée D-17 et d'identité de campagne).

Le commit de livraison qui ajoute ce document ne modifie pas ce code du jeu : il supprime les dix-huit fichiers ponctuels d'intégration, ajoute ce bilan et conserve une vérification permanente **en lecture seule** des postes et stockages.

L'étape de publication automatique a été refusée au jeton GitHub Actions, qui ne possède pas le droit de modifier les workflows. Cela n'annule pas les tests exécutés, mais le job reste techniquement en échec. Les objets Git du commit testé ont été récupérés par le connecteur GitHub autorisé pour publier exactement le résultat vérifié, sans changement de permissions, force-push, modification de main ni déploiement de production.

## Résultats achevés après fusion

| Vérification | Résultat |
|---|---:|
| Syntaxe | 269 fichiers vérifiés |
| Construction source, web et HTML autonome | 278 fichiers publics, version 1.57.2 |
| Tests ciblés cumulatifs, génération, sauvegardes, arrivée et distribution | **71/71**, zéro échec, annulation ou test ignoré |
| Activation réelle de la révision 8, transaction et Continuer | **39/39 contrôles**, 1440×900, 390×844, 844×390 |
| Arrivée D-17, prologue, Pause/Reprendre et identité des campagnes | **50/50 contrôles**, ordinateur et mobile émulé |
| Audit comparatif des programmes | **3 000 sources, 2 374 recettes compatibles, 2 951 étages** |

Les rapports navigateur ne relèvent aucune erreur de page, console, HTTP ou requête. Les changements de sauvegarde avant le clic, pendant l'action, dans l'entrée de restauration, à sa sortie et dans le stockage sont vides après exclusion du timestamp et normalisation de la seule révision attendue. Le contrôleur réel est appelé une seule fois depuis un événement de confiance.

L'activation utilise une position préparée physiquement libre au dépôt, déclarée dans le rapport. Les aperçus sont des recettes isolées et les formats mobiles sont émulés ; ces tests ne prétendent pas être une exploration humaine complète.

## Bilan réel des ajouts

Sur la graine **17117**, comparaison des révisions 7 et 8 : **342 occurrences ajoutées**, dont **190 palettes, 141 machines et 11 caisses**. **340** sont intérieures et **deux** utilisent des zones extérieures de service déjà attribuées. Les quantités sous les minima source passent de **3 056 à 2 716**, soit **340 unités résolues**. **132 unités demandées** à cette nouvelle couche restent refusées faute de place ou d'accès. **Aucun nouveau stock** n'est créé dans les détails.

Le contrôle compare les parcelles, plans, anciens objets et extérieurs avant/après sur chaque étage : aucune réécriture de la géométrie ou des budgets historiques. Les nombres incluent les variantes héritées et ne comptent pas des architectures ou assets indépendants.

Les tests physiques supplémentaires ont parcouru 70 lieux G8, contrôlé 16 nouveaux obstacles avec les vraies fonctions piétonnes, de ligne de vue et de gabarit automobile, et vérifié les faces de service restées accessibles. Un échantillon séparé des 250 premiers parents comptabilise 81 compléments, sans modification de leurs plans ou stocks.

## Conflits résolus et ancien contrôle corrigé

Quatre conflits avec main ont été examinés puis résolus par empreintes complètes : conservation des parcours CI Codex et arrivée, adoption du contrôleur smoke Windows testé sur main, combinaison de la correction de perte de focus et du verrou d'historique, et nouvelle identité de cache PWA **deadwall-v1.57.2-stations170**.

Le premier passage fusionné avait 70 tests réussis et un seul échec : un ancien test exigeait le suffixe `:g4` pour une nouvelle campagne. Main 1.57.2 supprime précisément cette mutation tardive. Le test exige maintenant l'identité initiale sans suffixe ; tous les contrôles d'unicité, d'archives, de scénario, de refus et de reprise restent présents. Les anciennes identités suffixées sont vérifiées par les tests de compatibilité de main. Aucun contrôleur n'a été changé pour faire passer ce test.

## Vérifications locales distinctes

Les vérifications locales des dix tests d'identité et de nouvelle partie passent. La distribution sans dépendances a réussi séparément ; une première exécution simultanée avec l'audit avait interrompu ce test pour manque de ressources. Un contrôle graphique isolé Chromium 144 a décodé trois atlas du projet et validé **24 images** (trois familles, quatre rotations, atlas et secours), avec **12 appels réels de sprites**, aucune fuite de pixels hors emprise et aucune mutation des objets. Les captures ont été inspectées.

Ces contrôles graphiques locaux ne naviguent pas dans une campagne. La navigation locale était interdite par l'environnement ; les 89 contrôles réels ci-dessus proviennent de GitHub Actions, Chromium 151 et Node 24. Le `npm run check` local a passé syntaxe/build mais rencontré l'absence de `@napi-rs/canvas` et la limite de 120 secondes. Aucune réussite globale locale n'est revendiquée.

## Preuves et portée restante

- Run : https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/38313443986
- Archive complète des rapports, captures, audit et sources rapprochées : https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/38313443986/artifacts/11775513004
- SHA-256 de l'archive : `335102f3708da6978eeead733e8db6902faed9eae43e6aa4b3b2536f2cf46556`.

La suite générale avec endurance et une nouvelle fabrication Windows doivent encore être confirmées sur le commit de livraison. Les anciens succès Windows ne sont pas attribués à cette révision. La PR reste en brouillon jusqu'à la validation globale.

La révision 8 reste volontaire : **Monde & relais → COMPLÉTER ATELIERS ET STOCKAGES**. Les machines sont statiques, non alimentées ; caisses et palettes de complément ne donnent pas de butin. Les 2 716 unités encore sous les minima, les pièces absentes, niveaux et jardins natifs manquants, ports, tunnels, échangeurs, alimentation des appareils et interactions d'assise ne sont pas annoncés terminés.
