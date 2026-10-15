# Passe 163 — Reprise des trois validations avancées

Base vérifiée : `dfff00e6cfc3658c8924deb28325497574ff2373`, PR #2 de DEADWALL. Cette passe porte sur les contrôles de qualité ; elle ne livre pas de nouveaux bâtiments, sprites ou variantes de gameplay. Les changements `src/`, les sauvegardes, les dégâts, les coûts et la génération du monde restent inchangés.

## D-17 : observer exactement le centre dessiné

La vérification historique cherchait uniquement un compteur de l’atlas 149, alors qu’une variante 157 peut être sélectionnée depuis la graine et l’identité du centre. Le nouveau probe calcule le sprite attendu avec les registres existants, puis observe le vrai peintre du centre pendant un rendu synchrone. Il compare l’atlas, le rectangle source et le rectangle de destination. Un autre bâtiment, un mauvais découpage ou un déplacement d’un pixel ne sont pas acceptés. Les fonctions observées sont restaurées même en cas d’exception. La sauvegarde avant/après doit rester identique, hors timestamp.

## Cité : version exacte du paquet

Le parcours ne réclame plus une ancienne famille `1.53.*`. Il exige exactement un libellé VERSION dont le token correspond au package courant. Les versions voisines, suffixes inattendus et doublons sont refusés. Les contrôles de coûts, travaux, progression et reprise qui suivent ne sont pas supprimés.

## Défenses : isoler le départ du groupe préparé

Après consommation des charges, le groupe préparé contient à la fois des ennemis encore retenus et des ennemis déjà libres. La préparation de départ peut maintenant recevoir les identifiants exacts du groupe initial, au lieu de ne déplacer que les dernières entraves. Tous les emplacements sont préparés avant la première mutation ; les points sont physiquement libres, distincts et éloignés d’au moins 400 unités du support. Un échec tardif ne laisse plus un déplacement partiel.

Cette relocalisation concerne seulement une scène de test explicitement préparée. Aucun ennemi du gameplay n’est téléporté. Les acteurs ne sont ni supprimés, ni soignés, ni rendus inoffensifs. Santé du support, charges, délais, stocks et RNG sont conservés. L’expiration des entraves reste exécutée par la simulation réelle ; un support disparu reste un échec.

## Contrôles et portée

Sept tests ciblés ont terminé localement avec succès : trois contrôles historiques de défenses et quatre nouveaux contrats incluant des cas volontairement incorrects. Le nouveau workflow exécute les parcours Défenses, D-17 et Cité indépendamment, sur leurs profils ordinateur, mobile et paysage. Aucun échec n’est rendu non bloquant et les preuves sont conservées par suite.

L’environnement local a bloqué les navigations Chromium avant le chargement du jeu. Ces essais ne sont pas revendiqués comme des parcours réussis. Les résultats navigateur avec les dépendances verrouillées sont ceux des jobs GitHub Actions, consignés dans la PR avec leur commit exact. Les tests sous DOM simulé ne certifient pas le rendu graphique, l’équilibrage humain ou les appareils physiques.

```sh
node scripts/compile-codex3000.mjs
node --test --test-concurrency=1 tests/qa-contracts163.test.cjs tests/defenses-qa148.test.cjs
npm run check
npm run test:defenses
npm run test:d17
npm run test:city
```

La PR reste en brouillon tant que les validations générales et avancées ne sont pas terminées. Aucune fusion ni mise en production n’est effectuée.
