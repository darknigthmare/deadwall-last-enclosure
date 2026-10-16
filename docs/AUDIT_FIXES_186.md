# PR #8 — Qualification avant fusion (186)

Cette passe part de `3a9a2b1ac8448b61584239765ca07682e1cc3ef5`. La réorganisation initiale des tests ne modifiait aucun fichier du jeu. Les correctifs de revue décrits plus bas touchent aussi le manifeste et le HUD, sans modifier géographie, coûts ou sauvegardes. « 186 » désigne la passe technique, pas une version commerciale.

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

## Retours de revue et blocage d'archivage traités

La première revue externe a relevé deux défauts, vérifiés dans les sources puis corrigés :

- Le manifeste lit désormais les balises complètes, y compris un `>` ou un saut de ligne dans un attribut cité avant `src` ou `href`. Les exemples de balises contenus dans les attributs, scripts et zones de texte ne créent pas d'entrées publiques. Les chemins invalides, doubles chargements et URL de script non citées restent refusés.
- Le tiroir d'actions se ferme dès que ses actions disparaissent, par classe ou attribut `hidden`. Échap ignore les tiroirs invisibles, y compris un ancien élément focalisé ; la reprise d'une modale ne les rouvre pas.

Le job du personnel vertical échouait aussi avant ses tests à cause du nom accentué `APERÇUS_ET_CONTENUS_165.md` échappé par Git. L'archivage lit maintenant les chemins UTF-8 séparés par NUL, sans exclure ce fichier. Le script Python réel du workflow a été exécuté dans un dépôt temporaire contenant accents, espaces, guillemets et saut de ligne dans les noms ; noms et octets de l'archive sont conservés exactement. Ce scénario est une vérification d'archivage, pas une campagne du jeu.

Les checkouts en lecture seule des workflows modifiés ne conservent plus leurs identifiants après récupération. L'artefact d'agrégation peut être remplacé lors d'une nouvelle tentative sur le même run ; ses empreintes et résultats sont toujours revérifiés.

Les résultats des exécutions précédentes restent attachés à leurs révisions. Le lancement local monolithique sur 8c8cda7 a été interrompu avant ces modifications afin de ne pas mélanger les sources pendant les tests ; il n'est pas annoncé comme réussi. Les nouveaux contrôles spécifiques et les suites CI complètes doivent être relus sur la tête corrigée de la PR.

Validation locale après revue : **138/138** contrôles spécifiques 183–186 réussis, aucun ignoré, dont **48** tests du qualificateur et de son raccord CI ; syntaxe de **351 fichiers** vérifiée ; build réussi avec **346 fichiers publics**. Les comptes se recouvrent. Le dernier build intègre bien la correction HUD ; ses nouvelles empreintes ne sont pas confondues avec celles du commit initial.

## Seconde revue : distribution verticale et admission coopérative

Deux autres constats du relecteur indépendant ont été reproduits et traités après `b75ccf9` :

- Les scénarios `qa-vertical176.mjs` à `qa-vertical181.mjs` transmettent désormais explicitement `DEADWALL_QA_ROOT` au serveur, comme le scénario 175. Ils enregistrent la racine réellement sélectionnée dans le rapport. Sans variable, le comportement historique sur les sources reste disponible. La matrice principale choisit `dist` ; une omission de packaging ne peut plus être masquée par un retour implicite aux sources pour ces six scénarios.
- Le relais coupe les connexions qui n'envoient aucun `join` valide dans les **10 secondes** suivant leur admission. Un message invalide ne repousse pas ce délai ; une adhésion valide ou une fermeture nettoie le minuteur. Les paramètres de test du délai sont bornés. Le test d'intégration ouvre **128 vrais WebSockets**, constate l'expiration et la libération des places, puis fait communiquer deux nouveaux clients. Les clients ayant rejoint leur salon restent utilisables au-delà du délai. Ce mécanisme borne les admissions incomplètes ; il ne constitue pas une protection universelle contre toutes les attaques de saturation.

Validation locale finale : **143/143 contrôles ciblés 183–186**, zéro échec, annulation ou test ignoré. Le groupe indépendant comprenant relais historique, relais borné et contrôleur CI réussit **61/61** ; ces comptes se recouvrent. Syntaxe : **351 fichiers**. Build : **346 fichiers publics**, données du Codex inchangées. Les essais interrompus par le plafond de durée de l'outil restent marqués incomplets ; le journal final de 143 cas est distinct. La première observation de fermeture des sockets ne synchronisait que le côté client ; le test final attend aussi les événements de fermeture serveur avant de vérifier la libération des places.

La CI complète est relancée sur le nouveau commit. Les succès distants de `b75ccf9`, y compris le personnel vertical et les parcours FPS, restent des preuves de cette révision antérieure, pas une substitution à la qualification finale.
