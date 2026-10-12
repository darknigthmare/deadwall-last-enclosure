# Passe 166 — Tables, assises et usages composés

Base de travail : PR #2, branche `feat/codex3000-detailed-programmes-159`, commit `42679040d96673396889c242f2461bd3689f2ae3`, paquet 1.57.0. Cette passe termine les ensembles commencés avant interruption. Le module conserve son nom `codex-ensembles165.js` ; les tests et ce bilan portent le numéro 166. Aucun changement direct de main, aucune fusion ni publication de production.

## Implantation de groupes cohérents

Huit profils : repas, séjour, classe, lecture, bureau partagé, accueil, petit assemblage et terrasse. Chaque groupe comporte une table et deux ou quatre assises, avec leurs zones d'accès. La table n'est pas posée seule si les sièges et leurs accès ne tiennent pas. Un groupe de quatre places peut devenir un groupe de deux lorsque la place disponible l'exige.

Les tables et postes déjà présents sont comptés. Certains sprites historiques de tables contiennent déjà des chaises : ils ne reçoivent pas de sièges supplémentaires. Les nouvelles tables de repas utilisent la forme nue de l'atlas existant ; les ateliers gardent un établi et les anciens `worktable` gardent leur famille graphique d'origine. Aucun nouveau pack PNG n'est annoncé.

Le générateur consulte les prescriptions auteur lorsqu'une table est décrite : quantité, dimensions et dégagement. Une prescription invalide ou hors des capacités acceptées est signalée, pas remplacée silencieusement par un objet plus petit. Le nombre est plafonné à deux ensembles par espace et six groupes par plan, avec au plus trente objets solides et six petits ensembles de contenu sur table.

## Accès, intérieurs et jardins

Chaque table et chaque assise reste dans les limites de son espace. Le générateur contrôle les murs, meubles, escaliers, petits décors déjà présents, les dégagements du mobilier ancré, les véhicules garés avec leur rotation, et les accès des groupes précédents.

Les tables extérieures sont proposées uniquement sur une terrasse `patio` déjà présente, au rez-de-chaussée. Les archives de stockage et simples couloirs ne sont pas transformés en salles de lecture ou espaces d'attente. Une pièce source déclarée extérieure n'est pas meublée comme une pièce intérieure par cette couche.

Le contrôle raster conserve les points d'interaction déjà joignables et les centres d'accès du mobilier antérieur. Les nouveaux accès sont également échantillonnés. Il s'agit d'une vérification conservatrice et bornée, pas d'une preuve exhaustive de tous les trajets continus ou automobiles.

Le contenu des tables — vaisselle, livres, documents ou outils — suit l'orientation du support et reste non solide. L'ordre de profondeur utilise le support réel. Les tableaux de rendu partagent les dimensions et transformations utilisées par les collisions.

## Activation et sauvegardes

Action au dépôt D-17, dans Monde & relais : **COMPOSER TABLES ET ASSISES**. La révision sauvegardée devient `detailVersion=5`. L'action reste volontaire et réutilise les protections existantes contre les possessions, camps ou véhicules nouvellement bloqués, ainsi que le refus pendant un rechargement ou une action incompatible.

Les révisions 0 à 4 et le réglage initial restent inchangés. L'inspecteur de recette montre les possibilités de la révision 5, avec le nombre réel de groupes, sièges et demandes non posées ; consulter ce plan ne change pas la sauvegarde et ne modifie pas la région jouée.

Les nouveaux meubles sont fixes et solides, mais ne sont pas de nouveaux contenants fouillables. Aucun montant, ressource ou budget gratuit n'est ajouté. Les lieux, routes, plans historiques, quantités et identifiants de fouille ne sont ni déplacés ni remplacés. Une activation répétée est refusée ; une restauration refusée n'est pas annoncée réussie. Les objets sont déterministes après éviction du cache.

## Vérifications réellement terminées localement

**45 tests ciblés réussis, zéro échec, annulation ou skip**, en une exécution achevée (Node 22.16.0) :

- Nouveau placement des groupes, quantités auteur, espaces interdits, terrasses et voitures tournées ; activation et invariants de sauvegarde.
- Contrats de rendu : sélection précise de la table nue, maintien des anciens établis, quatre rotations, fermeture des save/restore du canvas même après erreur, contenu attaché et profondeur au-dessus du support. Ce sont des contrats d'appel du peintre, pas une validation raster des pixels.
- Programmes de quantités 164, inspecteur 165, contenu des meubles, preuves de rendu de cité, contrats des tests avancés et distribution réelle sans node_modules.

L'échantillon des 62 gabarits sur deux graines couvre **124 lieux et 182 niveaux**, avec **67 groupes, 156 assises et 25 demandes non posées**. Sept des huit profils y sont effectivement observés ; le profil séjour n'est pas annoncé présent dans cet échantillon.

Un second contrôle porte sur **40 sites G8**, comparant les révisions 4 et 5 : plans et stocks conservés, obstacles nouveaux raccordés aux vraies fonctions de collision et de visibilité. Le nombre relevé de nouveaux objets solides dans cet échantillon est **128**. Ces comptages ne sont pas des architectures ou sprites distincts.

La syntaxe de **254 fichiers** passe. Le build réel et la reconstruction de distribution sans dépendances installées passent ; le contrat public reste à **278 fichiers**, le nouveau module étant incorporé au bundle de codex existant. Le cache PWA porte le nom `deadwall-v1.57.0-ensembles166`.

## Échecs et limites non masqués

`npm run check` a réellement été lancé : syntaxe et build passent. La suite générale rencontre notamment l'absence de `@napi-rs/canvas` dans cet environnement, puis l'exécution bornée à 180 secondes s'arrête (code 124). Elle n'est pas déclarée réussie. Les dépendances verrouillées ne sont pas modifiées pour contourner cette absence.

Les tentatives de navigateur sur la page locale et le HTML autonome sont bloquées avant chargement du jeu avec `ERR_BLOCKED_BY_ADMINISTRATOR`. Le nouveau parcours Chromium de révision 5 est livré pour la CI, mais aucune de ces tentatives locales n'est comptée comme un succès graphique. Les anciennes captures 165 ne constituent pas une preuve de cette nouvelle passe.

Vercel Sandbox refuse une nouvelle session pour limite du forfait (réponse 402, remise à zéro indiquée au 1er novembre 2026). Aucun réglage de facturation, permission ou sécurité n'a été modifié. Les résultats distants du commit publié sont à lire séparément sur la PR.

Le transport ponctuel `apply-quantities164` et son payload déjà appliqué sont retirés. Les workflows normaux, contrats de validation et suites avancées sont conservés ; aucun nouveau workflow écrivant dans la branche n'est ajouté. La revue Codex exécute désormais les nouveaux tests et le parcours de l'activation.

Les ports, tunnels, échangeurs, géométries natives complexes et le comportement interactif des assises restent hors de cette passe. Les 3 000 programmes ne sont pas présentés comme 3 000 bâtiments natifs exhaustifs. La PR doit rester en brouillon tant que les régressions et la recette graphique courantes ne sont pas entièrement validées.

## Commandes de reproduction

```sh
npm ci
npm run build
node --test --test-concurrency=1 tests/codex-ensembles166.test.cjs tests/codex-ensembles-art166.test.cjs tests/codex-quantities164.test.cjs tests/codex-plan165.test.cjs tests/codex-surface165.test.cjs tests/city-proof164.test.cjs tests/qa-contracts163.test.cjs tests/defenses-qa148.test.cjs tests/distribution.test.cjs
npx playwright install --with-deps chromium
node scripts/browser-ensembles166.mjs
npm run check
```
