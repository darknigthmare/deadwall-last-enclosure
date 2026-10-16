# PR #8 — Qualification avant fusion (186)

Cette passe part de `3a9a2b1ac8448b61584239765ca07682e1cc3ef5`. Elle ne modifie aucun fichier du jeu, aucune géographie, aucun coût et aucune sauvegarde. « 186 » désigne la passe technique, pas une version commerciale.

## Une suite exhaustive, six partitions vérifiées

Le contrôle natif principal répartit maintenant tous les fichiers correspondant exactement à `tests/*.test.cjs` dans six machines indépendantes. La liste est calculée depuis les fichiers du commit : elle n'est ni une sélection manuelle de tests rapides, ni un filtre par nom de cas. Le poids des fichiers sert uniquement à équilibrer les partitions. Chaque fichier appartient à une et une seule partition ; les nouveaux fichiers sont automatiquement inclus.

Chaque partition exécute la vérification syntaxique, le build, le prétest et sa liste native avec `DEADWALL_SOAK=1`, sans `test-only`, exclusion ou fail-fast. Deux processus de test au maximum partagent chaque machine. Les commandes ordinaires `npm test` et `npm run check` restent inchangées pour les développeurs.

Le job **native** garde son nom, mais agrège les six preuves au lieu de tout exécuter sur un seul runner. Il revérifie les journaux d'origine, leurs empreintes, les codes de sortie, les compteurs, l'identité du workflow, l'arbre Git et tous les fichiers suivis avant/après. Une partition manquante, un test ignoré/annulé, une source altérée, une copie d'un ancien commit ou une preuve incomplète refuse la qualification. Le total doit également rester au moins égal aux 4 783 tests de la référence publiée ; ce plancher ne remplace pas le contrôle exhaustif des fichiers.

La preuve est explicitement celle de six exécutions disjointes, **pas** celle d'un unique `npm run check` monolithique. Les tests de chaque fichier restent isolés dans leur processus Node. Les rapports listent les fichiers attribués et les comptes réellement observés. Un artefact d'agrégation antérieur n'est pas confondu avec une partition lors d'une nouvelle tentative.

## Fin des vérifications complètes doublonnées

La CI principale s'exécute sur chaque pull request, sur `main` après fusion et à la demande. Un push sur une branche ayant une PR ne lance plus, en plus, une deuxième CI complète sur le même contenu. Les workflows spécialisés et la suite d'audit restent disponibles.

Le workflow ciblé du personnel vertical conserve tous ses tests et ses sept parcours navigateur. Sur PR, le second `npm run check` final est délégué au contrôle natif principal **obligatoirement vérifié par le job final `test`**. Il n'est plus relancé à la fin d'un job de 55 minutes après les autres scénarios. Sur les pushs directs de sa branche historique, ce contrôle complet est conservé et le délai du job est porté à 90 minutes.

Le job final **test** continue d'exiger le succès de **native**, de toute la matrice **browser**, et de **windows**. Un résultat ignoré, annulé, absent ou échoué n'est pas assimilé à un succès. Aucune protection de branche n'a été modifiée et aucune fusion automatique n'est ajoutée.

## Tests du contrôleur

`tests/audit186-ci.test.cjs` couvre les inventaires réordonnés et futurs, doublons, chemins invalides et liens symboliques, journaux absents ou altérés, faux comptes positifs, signaux d'arrêt, commandes filtrées, perte d'endurance, source modifiée, ancien commit, ancien workflow, mauvais index et partitions manquantes. Il contrôle également le raccord des jobs et le maintien des commandes de test historiques.

Ces tests vérifient la fiabilité de la qualification ; leurs cas synthétiques ne prouvent pas que les milliers de tests du jeu ont réussi. Les résultats effectifs sont ceux des artefacts du dernier commit.

## Conditions de revue et de fusion

Les grands ajouts de contenu non terminés de l'audit restent hors de cette PR de stabilisation. La mise en revue n'est pas une autorisation de fusion tant que les contrôles nécessaires restent rouges ou en attente. Avant fusion : vérifier la tête actuelle, l'absence de conflit avec `main`, le résultat final `test`, les contrôles spécialisés et les retours de revue. Après fusion, la validation de production reste un contrôle distinct.
