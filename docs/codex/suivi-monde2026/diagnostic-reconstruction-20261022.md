# Diagnostic ciblé de la fixture de reconstruction — 22 octobre 2026

## Conclusion

L'erreur CI « The declared house fixture has no valid footprint: Chaussée ou voie financée à préserver » est reproduite sur le commit `7ec448a552c6ad65cc3b167e9e4974d7f8772585` et sur la référence main `74a62084e96dd7e78463bd4e15b9ec2897887704`, pour les profils desktop et mobile. La fixture demande de placer une maison à des coordonnées fixes qui chevauchent une route native déjà présente dans main.

Le refus du propriétaire de placement est cohérent. Le parcours de reconstruction n'est jamais atteint : aucune maison n'est ajoutée, puis détruite. Les nouveaux modules d'inspection ne sont pas nécessaires à ce refus ; ils sont absents des deux profils main qui reproduisent exactement l'erreur.

## État et géométrie observés

Le script CI utilise `tools=1&fixture=legacy` via son harness et sert la distribution construite. Le diagnostic emploie la même surface explicite : graine 17117, difficulté standard, scénario classic, G8, `cityGeometry202=0`, plan local de révision 3, requestAnimationFrame désactivé avant initialisation.

La fonction `reconstructionFixture` a été extraite telle quelle de `scripts/browser-reconstruction144.mjs`, sans réécriture, puis exécutée dans les quatre profils. Elle épuise les ressources locales, retire les unités et les zombies, place les stocks bois/ferraille/pierre à 400, puis tente la maison déclarée. Ces mutations restent celles de la fixture synthétique, sans prétendre à une acquisition naturelle.

| Élément | Géométrie |
|---|---|
| Maison déclarée | Grille `(74,70)`, rotation 0, taille 3×2 cellules |
| Emprise de la maison | x=2368, y=2240, largeur=96, hauteur=64 |
| Route native | `depot-ring-east`, axe vertical x=2358, y=1738 à 2358, largeur=96 |
| Emprise routière | x=2310, y=1738, largeur=96, hauteur=620 |
| Intersection sans marge | x=2368, y=2240, largeur=38, hauteur=64 |

La collision routière est vraie **même sans la marge de protection de 8**. La voie financée est absente de ce chevauchement et l'audit des autres obstacles est négatif. Le nombre de bâtiments reste à 1 avant et après le refus dans les quatre profils : seul le dépôt initial existe.

| Profil | Inspections | Refus de placement | Bâtiments avant/après | Erreurs JS/console/HTTP |
|---|---|---|---|---|
| Current desktop, 1440×900 | Module chargé, 1 panneau | Route native | 1/1 | 0 |
| Current mobile, 390×844 | Module chargé, 1 panneau | Route native | 1/1 | 0 |
| Main desktop, 1440×900 | Module absent | Route native | 1/1 | 0 |
| Main mobile, 390×844 | Module absent | Route native | 1/1 | 0 |

## Comparaison à main

Les fichiers `scripts/browser-reconstruction144.mjs`, `scripts/browser-qa-common142.mjs`, `src/core.js`, `src/game.js` et `src/exploration-125.js` sont identiques octet pour octet à main74a. Les trois sources publiques critiques servies depuis `dist` sont également identiques à leurs sources actuelles. Le rapport conserve leurs SHA-256.

Pour la référence main, les réponses HTTP de `index.html`, `src/coordination.js` et `src/world-codex.js` sont remplacées par leurs blobs Git main exacts. Les autres fichiers publics et assets utilisés sont inchangés dans le diff. Les service workers sont bloqués ; le blob main de `sw.js`, préparé mais non demandé, n'est pas une quatrième substitution observée. Cette comparaison ne constitue pas une recompilation de la distribution main.

## Incident distinct de disponibilité dans le diagnostic

La première tentative a reproduit le refus desktop, puis a expiré après 120 secondes dans le helper `ready` du profil mobile, avant tout appel à la fixture. Aucune erreur JavaScript, console ou HTTP n'était enregistrée. Le script de reconstruction désactive RAF, tandis que l'attente de disponibilité ne spécifie pas de polling par minuterie.

Le passage complet ajoute, **dans le seul pilote de diagnostic sous /tmp**, une attente par minuterie de 50 ms sur le même prédicat de disponibilité, avant d'appeler le helper `ready` inchangé. Cette modification concerne seulement l'observation de l'initialisation. La fonction fixture, le placement, la route et le refus ne sont pas modifiés. Les quatre profils atteignent alors la fixture et reproduisent le refus.

La tentative incomplète est conservée séparément et n'est pas comptée comme une exécution réussie. Le champ `pass` du passage complet signifie que le diagnostic a abouti, pas que le test de reconstruction est vert.

## Preuves archivées

- [Résumé, géométrie et empreintes](diagnostic-reconstruction-20261022.json).
- [Rapport du diagnostic complet](diagnostic-reconstruction-rapport-20261022.json.gz).
- [Script exact du diagnostic complet](diagnostic-reconstruction-script-20261022.mjs.gz).
- [Annexe : rapport initial incomplet](diagnostic-reconstruction-initial-rapport-20261022.json.gz).
- [Annexe : script initial exact](diagnostic-reconstruction-initial-script-20261022.mjs.gz).

Les gzip utilisent le niveau 9, `mtime=0` et aucun nom de fichier original dans l'en-tête. Leur décompression restitue exactement les octets conservés. Les fichiers bruts ne sont pas dupliqués dans ce dossier. Les annexes initiales témoignent du délai de disponibilité mobile et ne comptent jamais comme une validation.

| Contenu | SHA-256 du gzip | SHA-256 des octets décompressés |
|---|---|---|
| Rapport complet | `d88849cea7fd443d6051ea8081e80a125b39dd9ac5bc07e987f587d77606e802` | `8e9acd375fb80bbc79b9ef836ef15c7cfc95423e17ca94a441ae6ac128faae72` |
| Script complet | `69234c839e62f4b39bf0d94f9ad370df3fecca4e6c8ef1d9d759c1a2bb8fb08e` | `a76bad78ac89218bfe46aa369be55c176a6b713083a9b4613236edd8017b420a` |
| Rapport initial incomplet | `732683c3e2d1359fa9bd3e9cce266e8e155c6fefcb30da3f5ed59022e8f1c12b` | `20060071cc9ef51c9db5c9762eb0c050ae0c5e0a49d67aac025799b0c12e171c` |
| Script initial | `f93d113a9425f17c31ec13fd7930c81bcb50beb103b0c018ccea81629553ae69` | `08f87759e1d4af3f142968c423f32d36cc998452c2937fd7a366953812f830f8` |

Le journal CI consulté correspond à l'exécution 39763290956, job 119772489316. Son empreinte figure dans le résumé ; cette archive ne duplique pas l'intégralité du journal externe. Le défaut apparaît dans les deux profils avant tout contrôle fonctionnel (`checks=0`).

Les pilotes sont des traces locales et **ne sont pas des outils utilisateur portables**. Ils conservent intentionnellement les chemins absolus du dépôt `/workspace/scratch/b8ff726dd748/deadwall`, de sa distribution `dist`, du Chromium `/tmp/yautja-chromium/chromium` et des sorties temporaires. Une réutilisation dans un autre environnement nécessite une adaptation explicite de ces chemins.

## Limites et recommandation en lecture seule

Ce diagnostic ne valide ni le devis, ni le paiement, ni la construction, ni la sauvegarde/reprise après reconstruction : le refus se produit avant ces contrôles. Il ne représente pas une campagne complète ni une qualification Electron/Windows.

Une correction ultérieure de cette fixture peut choisir une emprise réellement admissible et un point extérieur de travail praticable, en s'appuyant sur les propriétaires natifs, avant l'ajout puis la destruction de la maison. Les assertions du parcours de reconstruction doivent rester intactes. Désactiver la protection routière ou forcer l'ajout contournerait le refus réel.

Le diagnostic n'a modifié aucun test ni aucune source produit ; son archivage ajoute seulement les présents fichiers documentaires. Aucun correctif n'est appliqué dans le lot gelé `7ec448a`.
