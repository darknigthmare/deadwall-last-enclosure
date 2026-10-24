# Ports, offshore et îles — plans auteur 2026

Le générateur `scripts/codex-maritime-sites2026.cjs` compose **11 types et 550 plans**, avec 50 variantes identifiables par type. Ces plans sont réservés à l’inspection auteur. Ils ne sont pas implantés dans une campagne et ne créent ni marchandise, ni poisson, ni carburant, ni appareil raccordé.

| Identifiant | Composition | Plans |
| --- | --- | ---: |
| EXT-MONDE-T009 | Plateforme pétrolière fixe | 50 |
| EXT-MONDE-T010 | Plateforme semi-submersible | 50 |
| EXT-MONDE-T012 | Station scientifique marine | 50 |
| EXT-MONDE-T013 | Port de pêche | 50 |
| EXT-MONDE-T014 | Marina | 50 |
| EXT-MONDE-T015 | Terminal conteneurs | 50 |
| EXT-MONDE-T016 | Terminal ferry | 50 |
| EXT-MONDE-T077 | Îlot de phare | 50 |
| EXT-MONDE-T078 | Île agricole habitée | 50 |
| EXT-MONDE-T079 | Île portuaire industrielle | 50 |
| EXT-MONDE-T080 | Grande île mixte | 50 |

Chaque composition possède huit bâtiments de plain-pied, 32 ou 34 pièces d’usage et leurs circulations, soit **18 000 pièces d’usage** pour la famille complète. Les programmes distinguent notamment la chaîne froide d’un port de pêche, la billetterie d’un ferry, la préparation d’échantillons scientifiques, la gestion des ballasts ou l’habitat d’une île. Les pièces reçoivent le mobilier du catalogue existant, à dimensions constantes, après contrôle des dégagements. Une proposition refusée doit rester comptée dans le rapport ; aucune miniature n’est introduite pour la faire tenir.

La revue de programme a ajouté de vraies pièces desservies depuis le couloir : cuisine et réfectoire pour la plateforme fixe T009 ; cuisine et réserve alimentaire en plus du réfectoire pour T010 ; salle de soins et réserve médicale pour la station T012 et l’île industrielle T079. Les locaux concernés ont été agrandis, sans supprimer les chambres, sanitaires, douches, vestiaires ou autres usages existants. Les cuisines portent évier, four et réfrigérateur ; les pièces de soins portent une armoire médicale et un évier. Ces meubles restent des objets d’inspection sans nourriture, médicaments ou appareil raccordé.

## Dimensions et accès

Toutes les dimensions de ce lot sont des **choix de composition auteur**. Aucun plan général, relevé d’un site existant, tirant d’eau, dimension constructeur ou conformité réglementaire n’est revendiqué. Le module ne complète donc pas artificiellement l’étape des références publiques du classeur.

Les cinq tailles de parcelle et les dix arrangements conservent 50 géométries différentes par type. Les logements insulaires gardent une emprise de 12 × 12 m et une hauteur de 3,2 m, y compris dans la grande île. Les services et ateliers ont leurs gabarits propres ; agrandir une île augmente les espacements et les réserves, pas la taille du mobilier. L’enveloppe de la grande île mixte va de 896 × 856 m à 944 × 912 m. Ses huit bâtiments constituent un échantillon d’usages, pas une population territoriale complète.

Les routes de service mesurent 4,5 m de large, les liaisons piétonnes 1,4 m et les jetées 8 m. Les ports possèdent trois jetées ; les îles et plateformes ont un accès de référence à une aire d’accostage. Le domaine d’eau est découpé autour des rectangles réellement secs. Une jetée est ainsi un support continu : ses côtés demeurent infranchissables et aucun raccourci ne traverse la mer. Les bâtiments et réservations fermées restent hors des bandes de circulation. Les ports extérieurs expriment une condition de raccordement et conservent `connectedToWorld:false`.

## Offshore et réservations fermées

Le niveau 0 est un plan de référence relatif du pont. Son altitude au-dessus de la mer est inconnue ; elle reste `null`. Les réservations de têtes de supports, de colonnes, de portiques ou de forage sont fermées. Elles ne prouvent ni fondation immergée, ni stabilité, ni structure porteuse réelle. Aucun mouvement de plateforme, puits, ballast actif, nacelle, capteur ou transfert nautique n’est livré.

Les volumes de mer ne portent aucune profondeur réelle. Les îles ont une enveloppe rectangulaire auteur, sans relief naturel ni raccord automatique au seed. La navigation, les appareils spécialisés, les locaux ou accès supplémentaires, l’occupation, le budget de butin, les services payés, les graphismes définitifs et la persistance de campagne restent des chantiers distincts.

## Vérification

`tests/codex-maritime-sites2026.test.cjs` contrôle les 550 géométries, la conservation des dimensions domestiques, les pièces meublées et leurs accès physiques. Un contrôle distinct vérifie les nouveaux usages sur les 50 variantes des quatre types concernés, leurs dimensions, portes et meubles propres ; remplacer une salle de soins par un bureau est refusé. Des contre-exemples refusent une jetée sans support, un raccourci sur l’eau, une jonction entre niveaux, une dimension d’appareil modifiée, une profondeur inventée et un service ou stock ajouté. Le cœur compilable est comparé à Node dans un contexte navigateur isolé.

Ces contrôles ne certifient ni une campagne humaine, ni une capacité nautique, ni un port ou une île réellement raccordés au monde. Le rapport exhaustif intégré et la qualification de la livraison restent des preuves séparées.
