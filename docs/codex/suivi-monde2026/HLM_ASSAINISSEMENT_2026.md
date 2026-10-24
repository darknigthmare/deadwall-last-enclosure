# HLM et réseaux souterrains — inspection auteur

Cette famille ajoute **400 plans de huit types**, avec 50 variantes déterministes par type. Elle complète les objectifs `EXT-MONDE-T037` à `EXT-MONDE-T044`. Les plans sont des compositions originales en mètres : ils ne reproduisent aucun bâtiment réel et ne revendiquent ni conformité réglementaire ni validation d’accès à un égout réel.

| Identifiant | Composition | Programme et niveaux |
| --- | --- | --- |
| T037 | Collecteur urbain | Galerie sèche, deux regards, branches et jonctions vers un exutoire ; plancher de visite à −3 m |
| T038 | Réseau unitaire ancien | Deux niveaux de visite, diagramme d’eaux mixtes et chute gravitaire explicite ; planchers à −3 et −6 m |
| T039 | Galerie pluviale | Canal de pluie plus large, banquette sèche et accès de secours ; plancher à −3 m |
| T040 | Station souterraine de relevage | Trois niveaux secs, canal profond et conduite de refoulement déclarée ; planchers jusqu’à −9 m |
| T041 | Barre HLM | 3 à 7 niveaux de logements, 12 à 42 appartements, cave et noyau d’escalier |
| T042 | Tour HLM | 7 à 11 niveaux de logements, 28 à 44 appartements, cave et noyau d’escalier |
| T043 | Résidence en cour | Deux ou trois blocs autour d’une cour, 28 à 48 appartements et caves desservies séparément |
| T044 | Ensemble HLM mixte | Deux blocs de hauteurs différentes, 40 à 56 appartements, caves et locaux communs |

## Appartements et accès

Chaque appartement est une unité privée : séjour, cuisine, chambre parentale, chambre enfant, sanitaires et douche donnent sur son propre couloir. Les chambres ne débouchent pas directement sur la coursive collective. Les portes extérieures de chaque unité rejoignent une coursive réelle du même étage, puis le noyau du bloc.

Les emprises brutes des unités vont de **123,200 à 135,464 m²**, murs et circulation compris ; **ce ne sont pas des surfaces habitables mesurées**. Ce sont des logements familiaux généreux à deux chambres, pas un relevé représentatif du parc HLM réel. Les variantes changent les dimensions des unités, le nombre de travées, les hauteurs, l’agencement des blocs et les coursives. Un changement de nom ou de marge de parcelle ne suffit pas à compter une nouvelle géométrie.

La composition initiale de 99,360 à 119,296 m² bruts refusait réellement des lits et des fours, bien que chaque pièce contienne au moins un autre objet. La recomposition augmente les chambres et la cuisine, conserve les portes centrées et limite la croissance des variantes. Les pièces d’eau conservent une profondeur fixe de 2,46 m ; les mètres supplémentaires de profondeur vont aux pièces de vie. Aucun appareil, meuble ou dégagement du catalogue n’a été réduit. Le programme de cuisine partagé inclut notamment un four de 1,40 × 1,10 m et une table inox de 2 × 0,80 m : sa réservation reste donc plus généreuse que celle d’une kitchenette domestique.

| Pièce | Dimensions utiles de la plus petite variante | Dimensions utiles de la plus grande variante |
| --- | --- | --- |
| Séjour | 4,40 × 3,968 m | 4,64 × 4,202 m |
| Chambre parentale | 4,40 × 3,572 m | 4,64 × 3,938 m |
| Chambre enfant | 4,40 × 3,012 m | 4,64 × 3,348 m |
| Cuisine | 4,40 × 4,528 m | 4,64 × 4,792 m |
| Sanitaires, douche séparée | 4,40 × 2,460 m chacune | 4,64 × 2,460 m chacune |

Les sanitaires sont spacieux pour garder le WC et le lavabo accessibles avec le trajet conservateur vers le centre de pièce ; la douche conserve une emprise semblable ou inférieure à la composition initiale. Ces métriques décrivent le plan auteur et ne revendiquent aucune certification d’accessibilité ou d’évacuation.

Les niveaux sont espacés de 3 m, avec 2,6 m de hauteur libre auteur. Les tours atteignent de 21,35 à 33,55 m avec leur réservation de parapet. Chaque cage possède une emprise de 8 × 7 m et une transition piétonne de 1,4 m : le détail constructif des volées et les conditions d’évacuation ne sont pas certifiés. Les paliers sont alignés, raccordés à leur vraie circulation et franchissent uniquement des niveaux adjacents en hauteur. Les caves sont reliées par ces mêmes cages, sans raccourci entre étages.

Le moteur d’inspection ne crée aucun terrain global aux étages. Seuls les sols de pièces, coursives et paliers explicitement déclarés portent le piéton. Le vide extérieur reste infranchissable. Des emprises identiques sur deux niveaux différents ne deviennent pas un même solide ; le mobilier conserve l’étage et l’élévation de sa pièce.

## Galeries sèches et diagramme d’eau

Les deux regards donnent accès à des paliers déclarés et aux galeries sèches de chaque profondeur. Une banquette parallèle dessert le canal ; le retour passe par le même réseau ou par le second regard. Les canaux sont des volumes fermés au niveau souterrain déclaré et restent infranchissables. Ils ne servent jamais de sol ni de passage.

Chaque site possède au sol un vrai bâtiment de personnel : contrôle, distribution électrique, atelier de maintenance, réserve, sanitaires, douches, vestiaires et cuisine. Les sanitaires et douches sont des pièces distinctes avec leurs portes et leur propre mobilier ; ce ne sont pas des alias de l’atelier ou de la réserve. Le WC et la cabine de douche sont effectivement placés à leur gabarit du catalogue, sans raccordement d’eau fictif. Les bâtiments d’assainissement ne sont pas présentés comme des appartements.

Le graphe hydraulique distingue branches, jonctions, chute et exutoire. Chaque nœud possède un niveau et une cote de radier ; les liaisons gravitaires descendent vers l’exutoire. Seule la station de relevage comporte une remontée, identifiée comme conduite de refoulement. Le milieu pluvial reste distinct des eaux usées et du réseau unitaire.

`depthM` exprime la profondeur du **plancher sec le plus bas**, pas une profondeur d’excavation. Les cotes de radier des canaux sont plus basses. Le graphe indique une intention de composition ; débit, potabilité, pompage, risques atmosphériques et sécurité ne sont pas simulés. Une conduite dessinée ne raccorde aucun appareil du jeu.

## Mobilier et preuves

Les pièces utilisent le catalogue partagé de mobilier à dimensions constantes : cuisine, couchage, sanitaires, douche, maintenance, pompes, électricité, contrôle et stockage. Les prescriptions impossibles restent comptées comme refus ; aucun meuble n’est réduit pour le faire entrer. Les couloirs et noyaux sont des circulations et ne sont pas artificiellement comptés comme pièces à meubler.

`tests/codex-urban-services2026.test.cjs` vérifie les 400 plans, les 50 signatures géométriques de chaque type, les identités et les données immuables. Il contrôle aussi 40 scènes meublées réparties entre tous les types et cinq variantes, les transitions réellement exécutées, les colliders de canaux au bon niveau, les services et trajets libres, ainsi que des contre-exemples : étage déplacé, faux palier, logement incomplet, débit déclaré actif, gravité montante, exutoire absent ou eau traversable. Les contrôles utilisent un piéton de rayon 0,32 m et un plafond de 5 000 props par plan.

Un contrôle sémantique distinct parcourt les **400 variantes** : chaque appartement HLM et chacun des 200 bâtiments de personnel d’assainissement doit posséder un WC, une cabine de douche et leurs lavabos effectivement placés dans les bonnes pièces et au bon étage. Chaque appartement doit aussi avoir un vrai lit double et son armoire, un couchage enfant et son armoire, un évier, un four et un réfrigérateur en cuisine, puis un sofa, une table et une chaise dans le séjour. Le nom de pièce ou le simple statut « meublé » ne suffit pas. Les dimensions et appareils sont conservés ; aucune arrivée d’eau, évacuation ou production de ressource n’est activée par ce contrôle. Un contre-test rétrécit chambre et cuisine : l’audit mobilier générique comptabilise les refus, puis le contrôle de fonction refuse bien le logement sans lit ou sans four.

Le diagnostic ciblé des 200 plans HLM recomposés du 23 octobre 2026 compte **zéro refus de mobilier**, caves et locaux communs compris, sur 7 370 appartements. Les égouts conservent exactement leurs 200 compositions antérieures. Les résultats portent sur les sources de cette famille ; ils ne qualifient pas à eux seuls l’ensemble compilé du jeu.

La dernière exécution directe passe **12 tests sur 12**, sans échec ni test ignoré, en 30,85 s. Elle couvre les 400 variantes pour les appareils essentiels, les 40 scènes physiques représentatives, les transitions réellement exécutées et les contre-exemples de chambres sans lit et cuisines sans four. Les comptes précis et empreintes des sources sont conservés dans le reçu ciblé distinct du rapport mondial compilé.

L’audit mondial exhaustif du registre produit ses propres reçus, distincts de ces contrôles ciblés. Il reste nécessaire avant de qualifier la livraison compilée.

## Portée livrée

Ces plans sont inspectables par le système auteur et conservent `playable:false`. Ils ne sont pas implantés dans les seeds de campagne. Aucune population, eau potable, ressource, recette de production, connexion électrique ou récompense n’est créée. Rencontres, budgets de butin, services opérationnels, graphismes définitifs, persistance et qualification de campagne gardent leurs tâches ouvertes dans le classeur.
