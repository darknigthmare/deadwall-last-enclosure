# PR #8 — Correctifs de reprise 185

Base de travail : `1db0468b08e3fb74d2f2fd540920cdc82695afcb` (suite 184), sur le `main` immuable `1314e2c1d67f23c05cdd4bd53943fe97c6f56d9a`. « 185 » est un identifiant technique, pas une version commerciale 1.85. Aucune fusion ni publication en production n'est effectuée par cette passe.

## Corrections de jeu

- **Visée FPS** : la caméra et le rayon autoritaire utilisent exactement l'origine de bouche d'arme, sans décalage vertical de 0,15 m. Les coûts, portées et dégâts restent inchangés.
- **Récupération WebGL** : allocations partielles nettoyées, contexte refusé ou perdu sans exception vers la simulation, destruction idempotente du renderer, retour classique et recréation au prochain choix FPS. Un échec de dessin ne laisse plus une instance irrécupérable réutilisée indéfiniment. Les optimisations et gestes des suites 183–184 sont conservés.
- **PWA** : une lecture de cache refusée ne bloque plus une ressource publique disponible en ligne. Une panne hors ligne renvoie une réponse réseau d'erreur sans rejet non géré. Aucun cache partiel n'est réparé au cours d'une lecture défaillante. Liste publique, protection contre les redirections et installation atomique existantes conservées. Cette passe ne change pas la politique `skipWaiting` et ne certifie pas toutes les transitions multi-onglets.
- **Import** : un retour explicite `false` de `restoreSave` ne produit plus un faux succès. Le document reste proposé à la confirmation pour réessai ou annulation, sans quitter les paramètres ni remplacer l'état de pause.
- **Présence coopérative** : les exceptions d'envoi ne quittent plus la boucle `Game.update`. Une file réseau saturée abandonne les positions périmées. Messages, contacts et repères sont bornés ; champs non autorisés ou coordonnées invalides refusés. Les repères expirent aussi pendant une pause et les copies de consultation sont isolées.
- **Relais coopératif** : limites de charge et de débit par connexion, identifiants UUID et normalisation des seuls champs de présence. Un client défaillant ou excessif est isolé des autres. Le service reste un relais de présence et de repères, pas une campagne multijoueur autoritaire.

## Deux échecs annexes expliqués et corrigés

### Préparation du test des pièges

Le scénario de contrat de départ laissait six infectés frapper longtemps un support pour en épuiser les charges. Selon leur mouvement, le support pouvait légitimement être détruit avant le test du départ. Les cinq premières charges sont maintenant consommées par des contacts physiques successifs, puis un groupe mixte held/free utilise la dernière. Les attentes et contraintes du départ restent testées. La scène ne soigne jamais le support, ne restaure pas ses charges et ne fournit aucune ressource. Les déplacements de préparation sont des fixtures explicites, pas un parcours humain de campagne.

### Empreintes du monde

Le contrôle historique comparait une version du 13 octobre (`5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90`) au moteur intégré. La différence existait déjà dans le main de départ : compléments graphiques `dressing160`, cache redondant `colliders160` et annotations explicites de 18 ouvrages partiellement adaptés.

Le nouveau reçu conserve les empreintes brutes, y compris en cas de refus, et exige deux contrôles :

1. égalité stricte des sorties actuelles avec le main immuable `1314e2c`, sans normalisation ;
2. égalité avec l'ancienne version après adaptation uniquement des ajouts visuels précisément reconnus.

L'adaptateur refuse toute ressource, collision, champ de décor inconnu ou divergence du cache de collisions. Les objets et géométries historiques restent comparés. Il n'est utilisé que par l'audit, jamais par le jeu ou les sauvegardes. Des tests négatifs protègent ces refus. Une adaptation visuelle sans référence stricte indépendante est refusée.

## Validation locale de cette passe

Commandes réellement exécutées, groupes distincts pouvant se recouvrir :

- `node --test --test-concurrency=2 tests/audit18[345]-*.test.cjs` : **82/82**, aucun ignoré.
- `node --test --test-concurrency=1 tests/qa-contracts163.test.cjs tests/defenses-qa148.test.cjs` : **9/9**, aucun ignoré.
- `node --test tests/import-concurrency.test.cjs tests/audit185-metric.test.cjs` : **15/15**, aucun ignoré.
- `node --test tests/audit185-coop-relay.test.cjs tests/coop-relay154.test.cjs` : **8/8**, vrais clients WebSocket locaux.
- `node --test --test-concurrency=1 tests/coop-ui154.test.cjs tests/portable-save-recovery.test.cjs` : **16/16**, aucun ignoré.
- `npm run build` : **346 fichiers publics**, Codex compilé **11 443 170 octets**, données inchangées.
- `node scripts/audit-metric174.mjs --baseline <archive-5b8f0ad> --strict-baseline <archive-1314e2c> --legacy-visual-additions` : contrôles strict et historique réussis, trois graines (0, 42, 17117), **9 734 lieux**. Les sept refus d'accès restent des diagnostics réels, pas des passages artificiellement forcés.

Les premiers tests négatifs ont reproduit les défauts avant correction. Les essais intermédiaires d'adaptation des anciennes empreintes ont échoué et leurs journaux ont été conservés ; seul le reçu final validé est annoncé réussi. Les comptes des groupes ne s'additionnent pas en un total de tests uniques.

Le navigateur local refuse les navigations avec `ERR_BLOCKED_BY_ADMINISTRATOR`. Aucun contournement n'est tenté. La validation visuelle est effectuée par GitHub Actions sur `dist` : le parcours FPS contrôle maintenant l'uniforme de caméra, puis provoque une vraie perte/restauration de contexte WebGL et vérifie les données persistantes avant/après. Le reste des parcours 183–184 est conservé. Les résultats distants et le contrôle global avec endurance doivent être lus sur le commit final de la PR ; les résultats de son ancien commit ne valent pas validation de ce nouveau code.

## Limites conservées

Aucune économie, graine, géographie, fonction de dégâts, statistique d'ennemi ou version de sauvegarde n'est modifiée. Il ne s'agit ni d'une refonte artistique complète ni d'une validation sur matériel physique ou d'une campagne humaine de 6–10 heures. La complétion des intérieurs libres, de la vie civile, des transports et du vrai multijoueur demeure distincte. Les workflows temporaires de récupération des sources ont été supprimés des changements finaux.
