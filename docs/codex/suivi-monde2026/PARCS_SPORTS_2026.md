# Parcs et sports — six typologies auteur

Ce lot fournit **300 plans déterministes**, soit 50 variantes pour chacun des types T049, T050, T051, T052, T067 et T068. Il complète l’inspection métrique du Guide auteur. Il ne place aucun nouveau site dans une campagne et ne crée ni stock, ni service, ni attraction fonctionnelle.

| Type | Programme distinct | Emprise auteur de la plus petite à la plus grande variante |
| --- | --- | --- |
| T049 — Parc familial | Carrousel, petit train, jeux, petite roue, bassin des barques et labyrinthe fermés | 458 × 362 à 490 × 410 m |
| T050 — Parc à sensations | Deux grandes réserves de circuits, tour, roue, plateau tournant et balancier fermés | 614 × 488 à 646 × 536 m |
| T051 — Parc aquatique | Six enveloppes fermées : bassin sportif, bassin ludique, rivière lente, toboggans, pataugeoire et bassin à vagues | 446 × 362 à 478 × 410 m |
| T052 — Parc thématique abandonné | Château de décor, parcours scénique, théâtre, train de mine, lagon et façades condamnés | 502 × 362 à 534 × 410 m |
| T067 — Vélodrome | Enveloppe fermée de piste et gradins ; trois aires sèches extérieures accessibles ; réserves cycles et média fermées | 590 × 434 à 622 × 482 m |
| T068 — Complexe sportif | Quatre terrains extérieurs accessibles, gymnase et courts couverts fermés | 570 × 362 à 602 × 410 m |

Ces dimensions, hauteurs, équipements et dégagements sont **des choix de composition auteur originaux**, sans relevé de bâtiment réel, source publique attribuée ou conformité réglementaire revendiquée. Les grandes attractions gardent leurs emprises de réserve : les variantes redistribuent les équipements et augmentent les espaces libres, sans réduire un circuit ou un bassin pour le faire tenir dans une parcelle.

La hauteur d’une réserve aquatique est une cote d’enveloppe auteur ; elle ne mesure pas une profondeur d’eau ni un niveau hydraulique.

## Ce que l’on peut inspecter

Chaque plan possède huit bâtiments distincts : accueil et consignes avec salle de premiers soins, vestiaires et hygiène, restauration, préparation de l’activité, exploitation et sécurité, atelier spécialisé, magasin et services techniques arrêtés. Leurs 32 pièces d’usage sont reliées à une circulation centrale par de vraies ouvertures. Les usages du mobilier correspondent aux pièces : atelier cycles au vélodrome, maintenance mécanique au parc à sensations, pompes au parc aquatique, décors et costumes au parc abandonné. La salle de soins se trouve dans l’accueil sur la circulation publique ; sa présence n’active pas un service médical gratuit.

Les allées publiques forment des retours autour des équipements. La voie de service passe derrière les bâtiments techniques et possède ses propres entrée et sortie. Une liaison piétonne déclarée au nord connecte les deux domaines pour l’inspection ; elle n’est pas présentée comme une porte automatique ou un contrôle d’accès simulé. Les postes de vue s’arrêtent avant les réserves fermées. Les accès de secours restent reliés au même réseau, et une deuxième entrée ne peut masquer un îlot de nœuds déconnecté.

Les quatre terrains extérieurs du complexe sportif et les trois aires de préparation du vélodrome sont réellement parcourables dans l’inspection. Leurs accès partent des allées sans traverser une machine ou un bâtiment. Les bassins aquatiques, rides, salles fermées et gradins sont des obstacles physiques : un segment ou un déplacement ne peut pas les traverser. Aucune passerelle implicite, nage, escalade ou téléportation vers un gradin n’est créée.

## Tracé du vélodrome

La réserve fermée mesure 130 × 92 m. Le tracé auteur emploie deux lignes droites et deux demi-cercles de rayon 24 m, pour une longueur analytique nominale de 250 m et une largeur de piste de 7,5 m. Les 34 points stockés échantillonnent cette courbe ; ils ne sont pas une mesure homologuée du bord intérieur ni un modèle de dévers. Les deux réserves de gradins restent à l’intérieur de l’enveloppe et hors de la largeur de piste. Le volume complet reste fermé à la marche : aucun vélo, sport ou accès public aux gradins n’est simulé.

## Validation et limites

Le générateur est `scripts/codex-recreation2026.cjs`. Il expose les mêmes `TYPES`, `PROFILES`, `build` et `audit` que les autres familles et possède un cœur pur compilable dans le navigateur. La suite `tests/codex-recreation2026.test.cjs` vérifie les 300 plans, leurs différences géométriques, la conservation des tailles, le mobilier, les réseaux, les obstacles et les mutations invalides. Elle vérifie aussi la parité entre les cœurs Node et navigateur.

La passe ciblée locale a réussi ses **neuf cas natifs**, sans échec, annulation, test ignoré ou TODO. Les 300 audits source sont acceptés : 2 400 bâtiments, 9 600 pièces d’usage toutes meublées, 35 750 objets placés, 1 450 réserves fermées et 350 aires extérieures accessibles. Aucune prescription de mobilier n’est refusée et aucun usage n’est inconnu dans ce lot. Les parcours de toutes les variantes avec ce mobilier respectent leurs murs, ouvertures et réseaux. Ces preuves ciblées ne remplacent pas le contrôle intégral de la révision de livraison.

Les implantations dans les seeds, les rencontres et le butin fini, les services financés, la cinématique, les graphismes définitifs, les accès aux volumes fermés et la persistance de campagne restent ouverts. L’apparition d’un appareil dans le plan ne valide aucune de ces étapes.
