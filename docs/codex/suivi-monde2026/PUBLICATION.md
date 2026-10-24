# DEADWALL 1.71 — 80 typologies et 4 000 plans d’inspection auteur

La [PR #18](https://github.com/darknigthmare/deadwall-last-enclosure/pull/18) complète les 41 typologies précédemment absentes avec 2 050 nouveaux plans, soit **80 typologies et 4 000 plans inspectables**. Les **800 tâches** conservent leurs identifiants : **3 validées, 397 en cours, 400 à faire**. La présence d’un plan ne valide ni son intégration au seed, ni le butin, les rencontres, les services ou l’art définitif. Aucune nouvelle variante campagne n’est déclarée jouable.

## Provenance et audit exhaustif

Les sources, tests, plans compilés et le [rapport accepté](inspection-20261023.json) sont liés au commit [`f0ef5a2036d4876ae8f4d4477676da968a032d01`](https://github.com/darknigthmare/deadwall-last-enclosure/commit/f0ef5a2036d4876ae8f4d4477676da968a032d01), sur la base 1.70 [`8288178946a189cf5857433b71b9ece8b3379689`](https://github.com/darknigthmare/deadwall-last-enclosure/commit/8288178946a189cf5857433b71b9ece8b3379689). Les **4 000/4 000 inspections** passent : 162 460 pièces, toutes meublées, 583 708 équipements posés et 4 670 prescriptions refusées. Les 1 950 enregistrements antérieurs sont strictement identiques ; les 2 050 nouveaux plans n’ajoutent aucun refus. L’inspection ne crée aucun stock de butin ni service de campagne.

- Sources compilées : `37652419da723adc414909f4d65d2c9e07f94a7685dfaf0ae34a9c3b9cc69cb2` ; 29 fichiers contrôlés par taille et SHA-256.
- Rapport : `c671887ef1bab08224073868e9f1da563bce562cfbe7400289e7a7fe316b37d7` ; 3141061 octets.
- [Classeur actualisé](DEADWALL_CODEX_MONDE_SUIVI.xlsx) : `989083147539313b3aa7a37a66fa8b5ea10d321a001648216087c2858df94b31` ; 557803 octets, 13 feuilles, 800 tâches et 1 165 formules avec caches.
- [Vérification XML indépendante](validation-classeur-20261023.json) : aucune erreur Excel ni cache absent ; identifiants, preuves, tables, filtres, validations et volets conservés. Les 98 089 cellules historiques sont comparées séparément au classeur 1.70 et à l’original public. Les styles hérités sont préservés ; 22 902 cellules auteur supplémentaires utilisent le renvoi à la ligne et les valeurs par défaut équivalentes admis par le contrôle. Par rapport à l’original public, ce total est de 33 143 cellules auteur.

La garde contre une tâche déclarée validée sans preuve est exercée par une vraie perturbation temporaire des données de calcul, puis restaurée avant export. Huit rendus de feuilles ont été examinés. Le [manifeste](CLASSEUR_REFERENCE.json) distingue le classeur 1.70 de 547 093 octets et l’original public de 539 765 octets. Le Drive original reste intact ; aucune synchronisation distante n’est revendiquée.

## Qualification du jeu distincte

Les parcours Chromium locaux sur la distribution finale passent **414 contrôles du Guide sur deux formats** et **42 contrôles de mise en cache, reprise et jeu hors ligne**. Ils couvrent l’inspection auteur et des parcours préparés ; la qualification CI complète du commit final, la fusion et le déploiement sont suivis séparément dans la [PR #18](https://github.com/darknigthmare/deadwall-last-enclosure/pull/18). Le contrôle complet 1.70 conservé dans l’historique ne qualifie pas cette nouvelle livraison. Une campagne humaine de 6 à 10 heures et la cadence sur téléphone physique restent des mesures distinctes.

Les 400 tâches à faire restent réparties sur le seed, le butin, les rencontres, les services et les graphismes définitifs. Les étapes auteur en cours ne deviennent pas validées par l’export. Les cotes de présentation utilisent au plus trois décimales ; les valeurs sources et les géométries restent inchangées.

## Historique 1.70 et livraisons antérieures

Le texte suivant conserve les lots, compteurs, PR et qualifications précédents. Il ne remplace pas l’état 1.71 décrit ci-dessus.

### DEADWALL 1.70 — 1 950 plans et provenance du classeur

La [reprise du 23 octobre](https://github.com/darknigthmare/deadwall-last-enclosure/blob/8288178946a189cf5857433b71b9ece8b3379689/docs/codex/suivi-monde2026/REPRISE_20261023.md) conserve **39 typologies et 1 950 plans inspectables**, **41 typologies / 2 050 plans à produire**, et **800 tâches : 3 validées, 192 en cours, 605 à faire**. Aucune nouvelle variante n’est qualifiée jouable en campagne. Le seed, le butin, les rencontres, les services, les graphismes définitifs et la persistance de campagne restent ouverts.

#### Provenance actualisée

La source [`b5bb3652974bc460ae2b08a5dd5a85e2d9a7c4f0`](https://github.com/darknigthmare/deadwall-last-enclosure/commit/b5bb3652974bc460ae2b08a5dd5a85e2d9a7c4f0) contient les références corrigées, le compilé et le [rapport régénéré](https://github.com/darknigthmare/deadwall-last-enclosure/blob/8288178946a189cf5857433b71b9ece8b3379689/docs/codex/suivi-monde2026/inspection-20261023.json). Les trois libellés de tirant non liés au Torsk ont été rectifiés ; les nombres et la géométrie ne changent pas. Les **1 950 enregistrements individuels** et tous les agrégats sont identiques à ceux de la livraison précédente : 57 990 pièces toutes meublées, 205 763 équipements posés et 4 670 prescriptions refusées. Les 22 sources du rapport ont été relues par taille et SHA-256.

- Empreinte des sources compilées : `59ae30e960393b51a34e64a5d5b6c4badd5fdd62fb694b26cc0c3a0e2db63e24`.
- Rapport : `9117b8dd7df783cf8163a733a65f8fdafed927d0348f4dfbfdf8731f9fb4d106` ; 1531795 octets.
- [Classeur actualisé](https://github.com/darknigthmare/deadwall-last-enclosure/blob/8288178946a189cf5857433b71b9ece8b3379689/docs/codex/suivi-monde2026/DEADWALL_CODEX_MONDE_SUIVI.xlsx) : `33258e07966e29cc781e49ae0d816f2f609784e31859a25bacc41fc9f41e4cf8` ; 547093 octets, 13 feuilles et 1 165 formules.
- [Vérification indépendante](https://github.com/darknigthmare/deadwall-last-enclosure/blob/8288178946a189cf5857433b71b9ece8b3379689/docs/codex/suivi-monde2026/validation-classeur-20261023.json) : aucune erreur Excel ni résultat de formule absent ; identifiants, preuves, tables, filtres, validations, volets et styles hérités préservés. Les 98 089 cellules historiques comparées à la livraison précédente n’ont aucun changement de style. La comparaison séparée avec l’original public conserve les 10 241 cellules auteur déjà adaptées pour le renvoi à la ligne.

Le [manifeste](https://github.com/darknigthmare/deadwall-last-enclosure/blob/8288178946a189cf5857433b71b9ece8b3379689/docs/codex/suivi-monde2026/CLASSEUR_REFERENCE.json) conserve distinctement l’original public de 539 765 octets et le classeur précédent de 547 077 octets. Ces liens historiques désignent les octets de la livraison 1.70 ; les fichiers courants peuvent évoluer sans remplacer ces preuves. Le fichier Drive public n’a pas été remplacé et aucune synchronisation distante n’est revendiquée.

#### Qualification distincte du jeu

Le [contrôle littéral avec endurance sur `99ea81b`](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/39885063051/job/120191415617) a réellement terminé avec **5 752 succès, zéro échec, annulation, test ignoré ou TODO**, et des codes de sortie à zéro. Cette preuve reste rattachée à ce commit ; elle ne qualifie pas les fichiers modifiés de la révision courante. Le contrôle complet et les parcours navigateur de la livraison finale restent à qualifier séparément. L’inspection des plans et la vérification du classeur ne constituent ni une campagne humaine complète de 6 à 10 heures ni une mesure de cadence sur téléphone physique.

#### Historique conservé du 22 octobre

Les sections suivantes décrivent les lots et SHA antérieurs. Leurs compteurs et états de publication sont historiques et ne remplacent pas la livraison courante ci-dessus.

#### DEADWALL — PR #16 : 1 200 plans et correctifs de validation

Cette continuation ajoute **200 plans industriels** aux 1 000 inspections déjà publiées dans la [PR #16](https://github.com/darknigthmare/deadwall-last-enclosure/pull/16). Les quatre nouvelles familles proposent chacune 50 variantes : agroalimentaire, mécanique, textile et matériaux. Elles restent destinées à l’inspection auteur ; leur présence dans le Guide n’accorde aucun nouveau stock, service ou emplacement jouable en campagne.

##### Audit des plans

Le rapport accepte **1 200/1 200 plans** de 24 types : 38 890 pièces, dont 38 860 meublées, **132 500 équipements posés**, 7 933 prescriptions refusées et 284 885 segments de mur. Les 1 000 plans précédents restent inchangés dans les treize champs comparés. Les suites industrielles ciblées passent **24/24** et **26/26**, sans échec ni test ignoré. Les quinze fichiers d’entrée de cet audit ont été comparés à leurs empreintes après les correctifs ci-dessous et sont inchangés. Preuves : [audit et journaux](validation-industrie-restauration-20261022.json), [rapport exhaustif](inspection-restauration-20261022.json).

Les dimensions sont des choix de composition auteur. Chaque nouveau site comporte neuf bâtiments et des cheminements entre les cinq étapes réception, préparation, production, finition et expédition ; les procédés industriels ne sont pas activés en campagne.

##### Deux contre-exemples corrigés

La CI sur `a137e2f714649083e460fcf25b0d84b7ea1bee57` a révélé deux cas supplémentaires, conservés dans les [journaux d’échec](validation-ci-echecs-a137-20261022.json).

La nouvelle partie de graine `2550352072` ne trouvait pas de parcelle pour la maison en ruine 471. Une bande libre existait entre la limite du monde et une route, mais les recherches par anneaux et grille ne l’échantillonnaient pas. Le dernier repli examine maintenant un ensemble fini de positions dérivées des limites des obstacles. Il conserve la vérification native de toute l’emprise, du toit, de la façade et des marges, sans consommer de hasard ni supprimer d’objet. La régression couvre les 48 décors et leurs stocks, l’accès physique à la maison, une récolte suivie de Continuer, un second démarrage identique et trois cartes témoins inchangées.

La [qualification native ciblée de ce correctif](validation-scenery-placement-reprise2-20261022.json) passe **36/36**, sans échec ni test ignoré, en 270 983 ms. Elle inclut les suites existantes de routes, parcelles et nouvelle partie, ainsi que quarante démarrages et cinq reprises de la suite de stocks finis. Le reçu identifie les deux fichiers corrigés par leurs empreintes et déclare le delta local au moment de l’exécution.

Le parcours D17 en paysage atteignait le dézoom minimal alors que toutes les parcelles libres se trouvaient sous la zone de jeu visible. Après épuisement du zoom, le contrôle prépare désormais une courte marche vers un point de vue accessible, exécutée avec les commandes normales. La recherche, les marches et les attentes sont bornées ; le placement natif, l’occupation et le clic réel sont vérifiés de nouveau après déplacement. Les refus restent explicites et les assertions de construction payée sont conservées.

La [preuve ciblée D17 corrigée](validation-d17-correctif-reprise2-20261022.json) passe **4/4** tests natifs, **9/9** contrôles du cas paysage préparé avec marche tactile obligatoire, puis **429/429** sur les trois parcours complets. Ces derniers ont chacun achevé leurs entrepôts payés et atteint 1 700 places de stockage. Ils n’ont pas eu besoin de la marche de secours pendant cette exécution : le scénario préparé en apporte la preuve distincte. La distribution servie demeure celle d’`a137e2f`, avec le helper corrigé ; le correctif de génération n’est pas attribué à ces parcours. Le [manifeste des parties](validation-d17-correctif-reprise2-20261022.parts.json) conserve l’ordre et les empreintes de l’archive complète.

Ce point de reprise enregistre ces corrections avant leur nouvelle qualification intégrale. Les résultats de `a137e2f` ci-dessous restent liés à leurs sources et ne constituent pas une passe complète du nouvel ensemble.

##### Résultats restaurés conservés

| Parcours local sur les sources restaurées | Résultat | Preuve |
| --- | ---: | --- |
| Reconstruction | 16/16, 2 profils | [Rapport](validation-reconstruction-reprise2-20261022.json) |
| Produits et élevage | 106/106, 5 profils | [Rapport](validation-produits-reprise2-20261022.json) |
| D17 | 429/429, 3 profils ; contre-exemple CI distinct ci-dessus | [Rapport](validation-d17-reprise2-20261022.json) |
| Relevé narratif | 16/16, 2 profils | [Rapport et limites](validation-survey-reprise2-20261022.json) |
| Sprites | 159/159, 3 profils | [Rapport](validation-vehicules-sprites-restauration-20261022.json) |
| Guide et Atlas | Guide 128/128 ; Atlas 2 formats contrôlés | [Rapport](validation-guide-atlas-restauration-20261022.json) |

Ces parcours totalisent **854 contrôles quantifiés réussis sur 19 profils**, en comptant les deux formats Atlas parmi les profils et sans leur inventer un nombre d’assertions. La continuation CI possède une preuve séparée de **167/167** sur trois profils : [rapport indépendant](validation-ci-continuation201-reprise2-20261022.json). Les vérifications natives ciblées de reconstruction, narration spatiale et véhicules passent respectivement **3/3**, **7/7** et **12/12**.

La commande intégrale **`DEADWALL_SOAK=1 npm run check`** a également été exécutée sur `a137e2f` : **5 690/5 690 tests**, quatre suites, zéro échec, annulation, test ignoré ou tâche différée, avec les sorties npm et tee à zéro. Le [reçu et le journal originaux](validation-ci-literal-reprise2-20261022.json) ont été qualifiés indépendamment ; leur inventaire correspond aux 4 794 fichiers et 530 fichiers de tests de ce commit immuable. Cette passe dure 47 min 01,629 s, commande complète comprise. Les contre-exemples des autres jobs CI demeurent documentés et les deux corrections ultérieures demandent une nouvelle qualification.

La [vérification Windows](validation-windows-restauration-20261022.json) a réussi sur un merge synthétique dont l’arbre est identique à celui de `a137e2f` : création du portable et deux lancements, état narratif, sauvegarde, import/export et contrôles du moteur de rendu. La distribution Windows conserve son empreinte propre. L’archive D17 locale est conservée en trois parties octet pour octet ; le [manifeste d’assemblage](validation-d17-reprise2-20261022.tar.gz.parts.json) donne leur ordre et l’empreinte de l’archive complète.

##### Livraison du classeur en attente

Le classeur du dépôt et sa copie Drive sont encore la livraison précédente de **1 000 plans**. Le candidat de 1 200 plans est préparé ; sa livraison attend les résultats de cette nouvelle source. Le suivi cible 4 000 programmes, 80 typologies et 4 000 variantes ; son nouvel état prévu est de 3 tâches validées, 117 en cours et 680 à faire, avec 2 800 variantes restant à concevoir.

La [publication précédente](PUBLICATION_REPRISE1_20261022.md) et le [manifeste de restauration](restauration-sources-20261022.json) restent disponibles. Les scénarios préparés, formats tactiles simulés et inspections auteur ne constituent pas une campagne humaine complète ni un essai sur appareil mobile physique. Cette reprise reste dans la PR #16.
