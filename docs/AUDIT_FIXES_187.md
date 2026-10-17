# PR #8 — Recherche complète des sites de test urbains

Base : `0ebdc942dc5ff121a73ce30f2d46fe32eca92497`. Repère technique 187, pas une nouvelle version commerciale. Aucun fichier livré du jeu n'est modifié par cette passe.

## Blocage reproduit

Sur la base 0ebdc94, les six partitions natives et Windows ont réussi, mais le parcours urbain et une exécution indépendante du contrôle complet ont rencontré `No legal empty physical site for casemate150`.

La marge de sécurité des ouvriers avait été correctement conservée en 186. La recherche des parcelles, en revanche, ne visitait que les coordonnées paires, à partir de six cases du dépôt. Elle pouvait refuser une scène alors qu'un site autorisé restait disponible, proche du dépôt ou sur une case sautée.

## Correction

`prepareConstruction150` visite toutes les cellules par anneaux, depuis le premier anneau jusqu'aux limites du monde. Le site du dépôt lui-même est déjà occupé et n'est pas un emplacement candidat. Les coordonnées extérieures et les sites hors de portée sont éliminés avant la coûteuse validation physique.

Le résultat reste soumis aux mêmes règles : placement réel, marge de sécurité des ouvriers de 37 unités, dégagement du commandant, point de travail du dépôt protégé, portée avec réserve de 80 unités, ligne de vue et position extérieure accessible. Aucun ouvrier n'est déplacé, aucun bâtiment n'est ajouté, aucune munition ou ressource n'est donnée. Le parcours navigateur continue de financer et terminer les bâtiments avec les commandes normales.

## Régressions

Trois tests supplémentaires couvrent une parcelle réelle dans les anneaux intérieurs, une parcelle réelle de parité auparavant ignorée et un terrain entièrement indisponible. Pour isoler la recherche, ils peuvent refuser des parcelles supplémentaires, mais n'autorisent jamais une position refusée par le moteur. Ils comparent l'intégralité du document sauvegardé sérialisable, à l'exception des coordonnées/horloges explicitement préparées. Un refus conserve tout le document.

Le cas intérieur a été exécuté sur l'ancienne recherche et a reproduit l'erreur avant correction. Les cinq tests 186 restent présents et leurs assertions ne sont pas affaiblies. Le workflow Audit regressions inclut désormais aussi les tests 187 et conserve le parcours `test:city` intégral, sans filtre de profil ni mode smoke.

## Tests locaux exécutés

`node --test --test-concurrency=2 tests/audit187-city-search.test.cjs tests/audit186-city-placement.test.cjs` : **8/8**, zéro échec, annulation, test ignoré ou TODO. Le cas intérieur échoue bien avec l’ancienne recherche. Les tentatives locales interrompues précédentes ne sont pas présentées comme des réussites.

## Qualification avant fusion

Les résultats CI doivent être lus sur la tête finale. Les 4 932 tests de la base 0ebdc94 ne sont pas présentés comme une exécution du nouveau commit. Les journaux d'essais locaux interrompus sont distingués des exécutions terminées. La CI conserve syntaxe, build, inventaire natif exhaustif avec endurance, navigateurs, Windows et son job final `test` exigeant le succès de tous ces groupes. Aucun statut, seuil ou protection de fusion n'est contourné.

Les scènes avancées sont préparées : elles ne représentent pas une progression humaine naturelle jusqu'à la mégacité. Cette passe ne change ni coût, ni sauvegarde, ni géographie, ni rendu artistique. Le déploiement Vercel et ses quotas restent un contrôle distinct.
