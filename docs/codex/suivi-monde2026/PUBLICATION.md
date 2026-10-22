# DEADWALL — PR #16 : 1 200 plans et correctifs de validation

Cette continuation ajoute **200 plans industriels** aux 1 000 inspections déjà publiées dans la [PR #16](https://github.com/darknigthmare/deadwall-last-enclosure/pull/16). Les quatre nouvelles familles proposent chacune 50 variantes : agroalimentaire, mécanique, textile et matériaux. Elles restent destinées à l’inspection auteur ; leur présence dans le Guide n’accorde aucun nouveau stock, service ou emplacement jouable en campagne.

## Audit des plans

Le rapport accepte **1 200/1 200 plans** de 24 types : 38 890 pièces, dont 38 860 meublées, **132 500 équipements posés**, 7 933 prescriptions refusées et 284 885 segments de mur. Les 1 000 plans précédents restent inchangés dans les treize champs comparés. Les suites industrielles ciblées passent **24/24** et **26/26**, sans échec ni test ignoré. Les quinze fichiers d’entrée de cet audit ont été comparés à leurs empreintes après les correctifs ci-dessous et sont inchangés. Preuves : [audit et journaux](validation-industrie-restauration-20261022.json), [rapport exhaustif](inspection-restauration-20261022.json).

Les dimensions sont des choix de composition auteur. Chaque nouveau site comporte neuf bâtiments et des cheminements entre les cinq étapes réception, préparation, production, finition et expédition ; les procédés industriels ne sont pas activés en campagne.

## Deux contre-exemples corrigés

La CI sur `a137e2f714649083e460fcf25b0d84b7ea1bee57` a révélé deux cas supplémentaires, conservés dans les [journaux d’échec](validation-ci-echecs-a137-20261022.json).

La nouvelle partie de graine `2550352072` ne trouvait pas de parcelle pour la maison en ruine 471. Une bande libre existait entre la limite du monde et une route, mais les recherches par anneaux et grille ne l’échantillonnaient pas. Le dernier repli examine maintenant un ensemble fini de positions dérivées des limites des obstacles. Il conserve la vérification native de toute l’emprise, du toit, de la façade et des marges, sans consommer de hasard ni supprimer d’objet. La régression couvre les 48 décors et leurs stocks, l’accès physique à la maison, une récolte suivie de Continuer, un second démarrage identique et trois cartes témoins inchangées.

La [qualification native ciblée de ce correctif](validation-scenery-placement-reprise2-20261022.json) passe **36/36**, sans échec ni test ignoré, en 270 983 ms. Elle inclut les suites existantes de routes, parcelles et nouvelle partie, ainsi que quarante démarrages et cinq reprises de la suite de stocks finis. Le reçu identifie les deux fichiers corrigés par leurs empreintes et déclare le delta local au moment de l’exécution.

Le parcours D17 en paysage atteignait le dézoom minimal alors que toutes les parcelles libres se trouvaient sous la zone de jeu visible. Après épuisement du zoom, le contrôle prépare désormais une courte marche vers un point de vue accessible, exécutée avec les commandes normales. La recherche, les marches et les attentes sont bornées ; le placement natif, l’occupation et le clic réel sont vérifiés de nouveau après déplacement. Les refus restent explicites et les assertions de construction payée sont conservées.

La [preuve ciblée D17 corrigée](validation-d17-correctif-reprise2-20261022.json) passe **4/4** tests natifs, **9/9** contrôles du cas paysage préparé avec marche tactile obligatoire, puis **429/429** sur les trois parcours complets. Ces derniers ont chacun achevé leurs entrepôts payés et atteint 1 700 places de stockage. Ils n’ont pas eu besoin de la marche de secours pendant cette exécution : le scénario préparé en apporte la preuve distincte. La distribution servie demeure celle d’`a137e2f`, avec le helper corrigé ; le correctif de génération n’est pas attribué à ces parcours. Le [manifeste des parties](validation-d17-correctif-reprise2-20261022.parts.json) conserve l’ordre et les empreintes de l’archive complète.

Ce point de reprise enregistre ces corrections avant leur nouvelle qualification intégrale. Les résultats de `a137e2f` ci-dessous restent liés à leurs sources et ne constituent pas une passe complète du nouvel ensemble.

## Résultats restaurés conservés

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

## Livraison du classeur en attente

Le classeur du dépôt et sa copie Drive sont encore la livraison précédente de **1 000 plans**. Le candidat de 1 200 plans est préparé ; sa livraison attend les résultats de cette nouvelle source. Le suivi cible 4 000 programmes, 80 typologies et 4 000 variantes ; son nouvel état prévu est de 3 tâches validées, 117 en cours et 680 à faire, avec 2 800 variantes restant à concevoir.

La [publication précédente](PUBLICATION_REPRISE1_20261022.md) et le [manifeste de restauration](restauration-sources-20261022.json) restent disponibles. Les scénarios préparés, formats tactiles simulés et inspections auteur ne constituent pas une campagne humaine complète ni un essai sur appareil mobile physique. Cette reprise reste dans la PR #16.
