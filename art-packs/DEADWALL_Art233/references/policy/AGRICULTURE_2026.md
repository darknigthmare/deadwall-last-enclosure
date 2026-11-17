# Codex agricole — plans auteur en mètres

Cette extension prépare **400 plans**, soit 50 variantes pour chacune des huit typologies agricoles T021 à T028. Les plans sont raccordés au format d’inspection auteur : les pièces, murs, portes, clôtures et dégagements ont une géométrie mesurable. Ils ne créent aucune ferme dans une campagne et n’activent ni animaux, ni récoltes, ni production, ni eau, ni électricité.

La source de référence est [codex-agriculture2026.cjs](../../../scripts/codex-agriculture2026.cjs). Ses dimensions sont des **choix de composition originaux**, explicitement marqués `author-design`. Il n’y a ni relevé de bâtiment réel, ni affirmation de conformité technique, ni source fabricant inventée. La tâche de références publiques et de qualification des dimensions demeure donc distincte de l’existence de ces plans.

## Les huit activités

| Typologie | Variantes | Locaux propres à l’activité | Parcelles et équipements extérieurs |
|---|---:|---|---|
| T021 — Ferme laitière | 50 | Stabulation, vêlage, infirmerie vétérinaire, traite, local du lait, nettoyage, réserves de fourrage et d’alimentation | Prairies bovines clôturées, mangeoires vides, abreuvoirs non raccordés, silo à alimentation et cuve d’eau |
| T022 — Élevage ovin | 50 | Bergerie, agnelage, infirmerie vétérinaire, atelier de tonte, stockage de laine et fourrage | Prairies ovines clôturées, mangeoires, abreuvoirs, silo à alimentation et cuve d’eau |
| T023 — Ferme avicole | 50 | Poulaillers de ponte, poussinière, sas sanitaire, collecte et conditionnement des œufs, réserves et nettoyage | Parcours extérieurs avicoles clôturés, alimentation, eau et silo |
| T024 — Centre équestre rural | 50 | Boxes, repos des chevaux, infirmerie vétérinaire, sellerie, préparation, fourrage et matériel | Paddocks, abreuvoirs, mangeoires, abri de fourrage et cuve d’eau |
| T025 — Exploitation céréalière | 50 | Hangar à grains, semences, atelier semoir, tri et calibrage, conditionnement et bureau d’exploitation | Parcelles en bandes, silo à grains, cuve d’eau et armoire technique |
| T026 — Domaine viticole | 50 | Chais, cuverie, pressoir, réserve de fûts, mise en bouteille et stockage | Rangs de vignes, cuves extérieures et récupération d’eau |
| T027 — Ferme maraîchère | 50 | Serres de semis et de culture, préparation, pompage, tri des légumes, conditionnement et stockage réfrigéré | Planches maraîchères, réserves d’irrigation et récupération d’eau |
| T028 — Verger avec conditionnement | 50 | Tri et calibrage des fruits, conditionnement, stockage réfrigéré, cagettes, préparation et pompage | Carrés de verger avec troncs solides, voie centrale dégagée et cuves d’irrigation |

Chaque plan possède également six fonctions distinctes : habitation, activité principale, préparation ou transformation, atelier, locaux d’équipe et réserves. L’habitation comporte cuisine, salon, chambres, sanitaires et buanderie. Son jardin clos contient deux bandes de potager et un composteur ; son ouverture possède un chemin explicite depuis la desserte.

## Variantes géométriques

Les 50 variantes d’une typologie combinent **cinq tailles de site et dix dispositions**. Les différences portent sur les emprises, les dimensions des bâtiments, l’ordre de leurs fonctions, leurs retraits, le côté d’entrée de la première rangée et le nombre de parcelles. Le nombre de bandes de culture ou de rangées d’arbres varie également. Le test d’unicité compare uniquement les coordonnées et les formes, sans compter les noms ou identifiants comme des différences de géométrie.

Les emprises auteur vont de **224 × 260 m à 320 × 340 m**. Les hauteurs de référence de site vont de 6,5 à 10,2 m, selon les annexes et les silos. Ces dimensions expriment les compositions retenues pour l’inspection, sans prétendre représenter toutes les tailles possibles d’une exploitation réelle.

L’ensemble des 400 variantes représente :

- **2 400 bâtiments** de plain-pied ;
- **13 300 pièces**, dont 2 400 circulations et 10 900 pièces d’usage ;
- **1 160 parcelles agricoles** et 400 jardins d’habitation ;
- **1 960 ouvertures de clôture** : entrée de propriété, jardin et parcelles ;
- **15 460 structures extérieures**, en additionnant les segments de clôture, équipements et troncs des variantes.

Ces sommes comparent des plans distincts. Elles ne décrivent pas un monde de campagne réunissant tous ces éléments.

## Accès et dégagements

Le réseau de service longe l’ouest du site puis dessert les deux rangées de bâtiments et la rangée de parcelles. Les jonctions sont reliées dans l’ordre de leurs coordonnées. Le déplacement d’un bâtiment dans une variante ne crée donc pas une liaison diagonale traversant son voisin.

Les voies de service mesurent 4,5 m ; les branchements piétons, 1,2 m. Les ouvertures de clôture sont de 6,4 m pour la propriété, 5,4 m pour les parcelles et 2,4 m pour le jardin. Les clôtures sont de vrais segments solides séparés aux ouvertures. Une indication « portail ouvert » ne permet pas de traverser un segment qui occuperait encore le passage.

Chaque bâtiment conserve un couloir central, des portes de 1,2 m et une entrée reliée au réseau. La géométrie physique génère les murs depuis les limites réelles des pièces. Les aménagements ajoutent ensuite leur emprise et leur face de service. Le contrôle utilise le rayon piéton de l’inspecteur, y compris à travers les portes et les passages des clôtures.

Les deux bandes du potager et les bandes agricoles laissent une voie centrale libre. Chaque bande porte un `areaId` vers son jardin ou sa parcelle. Les arbres du verger sont des obstacles au sol, placés de part et d’autre de cette circulation. Les équipements fermés ont une approche extérieure ; leur libellé ne crée ni interaction ni inventaire.

La largeur d’un tracé de service n’est pas une qualification de conduite : les rayons de braquage, manœuvres de livraison, croisements d’engins, pentes et accès au réseau régional restent à traiter dans leur système de campagne.

## Contrat de données

Le module expose `TYPES`, `build(type, number)`, `audit(plan)` et `auditAll()`. Son cœur est délimité par `BEGIN AUTHOR CORE` et `END AUTHOR CORE`. Le compilateur peut l’intégrer sans fonctions de lecture ou d’écriture Node ; l’audit commun des fondations lui est fourni par `Reference`.

Les propriétés principales sont celles du format terrestre existant : `bounds`, `buildings`, `structures`, `reservedAreas` et `network`. Les compléments sont :

- `outdoorAreas` : emprises nommées des jardins et parcelles, en mètres et au niveau 0 ;
- `accessGates` : face de clôture, largeur, nœuds d’approche et de passage, segments associés et ouverture physique ;
- `configuration` : taille, disposition, côté d’entrée et nombre de parcelles ;
- `operations` : compteurs explicitement nuls pour animaux, butin, services et parcelles récoltables.

Les structures et surfaces réservées portent `lootAssigned:false` et `utilityConnected:false`. Aucun appel au générateur aléatoire de simulation, à un inventaire ou à une sauvegarde n’est nécessaire pour créer ou consulter un plan.

## Vérifications reproductibles

Le fichier [codex-agriculture2026.test.cjs](../../../tests/codex-agriculture2026.test.cjs) vérifie les 400 géométries auteur et les 400 scènes physiques sans mobilier. Il compose aussi le mobilier réel des huit activités dans deux orientations et aux tailles extrêmes, soit 32 cas. L’audit d’intégration général du Codex couvre séparément l’ensemble des sessions d’inspection compilées et meublées.

Les cas négatifs couvrent une clôture refermée sur son ouverture, un chemin au travers d’un bâtiment ou d’une culture, une voie trop large, une culture hors de sa parcelle, une entrée sans propriétaire, des identités répétées, des coordonnées invalides, des schémas incomplets et des déclarations abusives de stock, animaux ou services. Le cœur exécuté dans un contexte JavaScript sans `require`, `fs` ni `process` doit reconstruire les mêmes plans que Node.

```sh
node --test tests/codex-agriculture2026.test.cjs
node scripts/codex-agriculture2026.cjs artifacts/qa/codex-agriculture2026
```

Le rapport produit par la seconde commande mesure la géométrie auteur. Il ne remplace pas le contrôle global `npm run check`, l’audit d’intégration, une visite humaine ni une campagne naturellement jouée.

La passe locale du 22 octobre 2026 a réussi **13 tests sur 13**, sans échec, annulation, test ignoré ou TODO. Le lanceur direct `node -e "require('./tests/codex-agriculture2026.test.cjs')"` a affiché les treize cas et terminé avec le code 0. Cette passe comprend les 400 contrôles de scène et les 32 compositions meublées ci-dessus. Elle a aussi détecté puis vérifié le correctif de classification des « boxes de repos », qui doivent recevoir le mobilier d’élevage et non un couchage humain.

## Travaux de campagne encore ouverts

L’implantation dans le seed devra d’abord vérifier terrain, continuité des parcelles, voies agricoles et réserves des accès. Les activités devront ensuite raccorder les propriétaires existants du butin fini, de la faune, du transport, de l’énergie, de l’eau et de la sauvegarde. La présence d’un silo ou d’une mangeoire ne vaut aucune ressource gratuite. L’art définitif, les animations, les états d’abandon et la qualification du parcours en campagne restent distincts de cette inspection.
