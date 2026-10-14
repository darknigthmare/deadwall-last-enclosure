# Passe 174 — publication des échelles et dessertes

## Source livrée et reprise des deux branches

Base vérifiée : `5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90`, main 1.60.0 / G10, 4 000 programmes.
Source effectivement publiée après vérification : **`c11808d36ba12ba425bae07ee2172f8e7e0eb2c6`**.
Arbre `src` : **`bfeea38bad8e639deed6420d9d0fce562dea8e35`**, identique à la copie de travail vérifiée.

Cette livraison réunit la branche de préparation de la PR #5 et la branche d'intégration métrique, en conservant leurs historiques. Le code du jeu ne change pas après sa validation. Les transports ponctuels et anciens scripts d'application sont remplacés par un workflow permanent en lecture seule. La branche principale, l'ancienne PR #2 et les variantes de cité verticale restent indépendantes ; aucune fusion sur main ni publication de production.

## Fonctionnalités présentes

- Les neuf véhicules utilisent explicitement les dimensions au sol de leur propriétaire, dans les peintres de base et alternatifs. Le bus conserve 10,4 × 2,55 m ; le camion 7,4 × 2,5 m. Ces valeurs viennent du jeu, pas d'une homologation externe.
- D-17 : **Monde & relais → CALIBRER LE VÉHICULE EN MÈTRES**. Le véhicule existant passe volontairement à 32 unités locales/mètre si sa nouvelle emprise est libre. Aucun mouvement, carburant, cargaison, matériau ou véhicule offert. L'indicateur sauvegardé strict est `expeditions.vehicle.metric174 = 1`.
- L'ancien moteur local utilise encore un cercle de collision : le rayon calibré couvre tout le corps. C'est une approximation conservatrice, non une collision rectangulaire locale parfaite. La région conserve ses rectangles orientés. Les véhicules remplacés ne sont pas agrandis automatiquement.
- Les dessertes dérivées rejoignent la première chaussée rencontrée depuis l'entrée. Le dessin finit sur le bord proche ; le lien de navigation rejoint l'axe. Toute la largeur du corridor est contrôlée contre les autres routes, leur extrémité, les voitures tournées, clôtures et réserves voisines. Un accès direct à une route contrôlée ou un raccord trop tangent est refusé.
- Monde, atlas, GPS, guidage et lecture de surface utilisent la même desserte. Le `p.drive` historique, les positions, identités et budgets restent inchangés. Les niveaux explicites sont distingués ; cette correction ne remplace pas la topologie propre des ouvrages G10.

## Résultats d'intégration terminés

Run : https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/38606184063

Déclencheur `7d949ed6e0fe80ee7242c8acfb299e7663d3a077`, puis application vérifiée des fichiers avant les tests ; il faut donc citer la source résultante `c11808d`, pas prétendre que le déclencheur contenait déjà le code. Toutes les étapes, y compris publication source-only, sont terminées avec succès.

Artefact `deadwall-metric174-integration`, ID **11915547837**, ZIP SHA-256 **5e045564327d0245b992c0a269ea1d7da84a3b3ff423e90f82b945e2b0837ddc**. Le fichier `applied-source.json` contient les 31 empreintes avant/après, dont le workflow traité séparément. Les 30 fichiers de jeu, tests, outils et documentation correspondent au résultat vérifié ; les arbres locaux `src` et `scripts` ont également été comparés à ceux de la publication.

| Contrôle | Résultat |
|---|---:|
| Tests ciblés géométrie, métrique, migration, véhicules, routes et distribution | **121/121**, aucun échec, annulation ou test ignoré |
| Chromium, clic de confiance, sauvegarde, reprise et rendu | **33/33** sur 1440×900, 390×844 et 844×390 |
| Programmes inventoriés | **4 000** |
| Définitions d'ensemble et de support | **4 244** |
| Plans d'étage | **5 081** |
| Occurrences d'objets examinées | **29 370** |
| Gabarits régionaux / constructions D-17 / véhicules | **62 / 91 / 9** |
| Lieux contrôlés sur les graines 0, 42 et 17117 | **9 734** |
| Dessert es acceptées | **9 727**, dont **66 corrigées** |
| Raccords refusés et conservés dans le rapport | **7** |

Les 7 refus sont des conflits de corridor avec une autre route : graine 0, P2541 et P2969 ; graine 42, P0536, P1523 et P1613 ; graine 17117, P0556 et P3136. Aucun itinéraire fictivement réussi n'est dessiné pour ces cas. Le solveur ne recherche pas encore un détour arbitraire autour des obstacles.

La comparaison historique indépendante exécute les sources main et modifiées dans deux processus : tous les POIs, routes, plans et détails, plus quatre chunks de ressources sur chaque graine. Elle n'est pas une exploration humaine ni un balayage de chaque chunk de végétation.

## Sauvegarde et portée des preuves visuelles

Les trois parcours n'ont aucune erreur JavaScript, console ou HTTP. La sonde exige une seule restauration et un clic de confiance. Les différences avant/pour/après la transaction et dans le stockage sont vides, hormis le seul indicateur métrique attendu et le timestamp. **Continuer** retrouve tous les champs du checkpoint sauvegardé, sans tolérance sur le temps de jeu.

Le précédent échec mobile provenait d'une référence de test conservant `stats` par alias : une frame ultérieure modifiait l'observation supposée figée. La sonde fait désormais une copie détachée au moment exact de la restauration. L'assertion sur `stats.playSeconds` n'a pas été supprimée.

Les scènes préparent explicitement un garage achevé, des connaissances d'âge, un stock fini et un parking physiquement libre. L'achat et l'activation sont natifs. Les neuf silhouettes de la planche comparative sont dessinées par les peintres de production avec les atlas réellement décodés, à la même échelle que le personnage. Les captures ordinateur et mobile ont été inspectées ; les appareils mobiles sont émulés.

## Limites non masquées

**Inventorier une emprise valide ne certifie pas la bonne hauteur et l'ancrage artistique de chaque sprite.** Cette passe corrige les véhicules et les accès décrits ; elle ne redimensionne pas les 91 constructions de D-17 ni toutes les façades et tous les meubles verticaux. Les gabarits restent distincts de l'enveloppe visible en perspective. La référence piéton utilisée pour les ratios est le diamètre physique de 0,64 m, pas la hauteur complète d'un humain.

Les pièces manquantes, interfaces artistiques des bâtiments, interactions et réseaux encore incomplets restent des chantiers séparés. Les 66 routes corrigées ne prouvent pas tous les routages de toutes les graines.

Localement, les 10 tests géométriques légers passent. `npm run check` a été réellement lancé : syntaxe de **262 fichiers** et construction de **338 fichiers publics** réussies, puis limite de 120 s atteinte pendant la suite générale (code 124). L'installation locale hors ligne des dépendances était incomplète ; les 121 tests et les 33 contrôles navigateur ci-dessus proviennent de l'installation verrouillée réussie dans Actions. **Aucun résultat global ni Windows nouveau n'est déduit de cette tentative locale.** Les validations du commit final doivent être lues dans leurs propres reçus CI.

Contrats techniques et commandes : [METRIC_FRONTAGE_174.md](METRIC_FRONTAGE_174.md).
