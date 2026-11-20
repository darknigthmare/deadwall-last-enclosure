# Codex résidentiel — parcs de mobil-homes et caravanes

Le générateur [codex-residential2026.cjs](../../../scripts/codex-residential2026.cjs) développe **200 plans métriques auteur**, soit 50 variantes pour chacun des quatre types déjà prévus dans `OBJECTIFS80.json`. Leurs pièces, accès, clôtures et aménagements sont destinés à l’inspection physique du Guide auteur. Leur présence dans ce catalogue ne les implante pas dans une campagne.

## Contenu composé

| Type | Programme | Logements et locaux | Particularité |
|---|---|---|---|
| T045 | Parc résidentiel de mobil-homes | Modules habitables avec salon, cuisine, deux cabines, sanitaires et buanderie ; accueil et services collectifs | Jardins individuels et piscine commune dans 15 des 50 variantes |
| T046 | Camping caravanes | Un logement de gestion visitable ; caravanes tractables ; accueil, sanitaires, douches, buanderie, réfectoire, cuisine et atelier | Les coques étroites restent fermées ; piscine commune dans 15 variantes |
| T047 | Camp de travailleurs | Modules comprenant trois cabines, sanitaires, douches et réserve individuelle ; restauration, atelier, infirmerie et vestiaires communs | Gabarits de logements et programme collectif propres au travail ; aucune piscine |
| T048 | Parc de caravanes abandonné | Certains modules restent visitables ; autres caravanes fermées ; ancien club-house, atelier de récupération, réserve évacuée et poste de garde | Les usages sont des fonctions architecturales, sans habitants ni service actif déclarés |

Chaque site possède un accueil, un bloc sanitaire avec douches et buanderie, un bâtiment de services et une **boucle de desserte à deux accès extérieurs déclarés**. Les entrées individuelles rejoignent la rue, traversent une ouverture réelle dans la clôture, puis atteignent le logement ou la face extérieure de la caravane. Un chemin latéral dessert l’arrière de la parcelle sans traverser le logement.

Chaque parcelle occupée comprend :

- une clôture segmentée conservant un passage de 2 m ;
- une terrasse latérale et une place de stationnement réservée ;
- un jardin, choisi parmi potager familial, jardin fleuri, jardin minéral, carré aromatique et herbe ;
- un abri de jardin fermé ;
- selon la composition, une cuve de récupération ou un composteur ;
- un chemin explicite jusqu’à l’avant du jardin.

Les piscines communes sont limitées aux deux programmes de loisirs. Chaque plan concerné en possède une seule, avec sa propre clôture ouverte et son point d’approche. Le bassin est un obstacle : aucune nage, eau potable ou alimentation en eau n’est accordée.

## Diversité des variantes

Les cinquante variantes croisent **dix compositions de parcelles** avec **cinq configurations de dimensions et d’aménagements**. Les compositions comprennent une à trois allées, deux à quatre colonnes, des rangées décalées et des lots laissés libres pour un jardin commun. Les variantes changent donc le nombre de lots, les positions, les dimensions de parcelle, les dimensions des unités et les aménagements ; les identifiants et les noms ne constituent pas la variation.

Les tests comparent des signatures géométriques sans identifiants pour vérifier cinquante géométries différentes par type. Ils vérifient également que les plans se reconstruisent à l’identique sans appel au hasard de simulation.

## Dimensions et provenance

**Toutes les dimensions sont des choix auteur originaux.** Aucun fabricant, bâtiment réel ou référentiel de conformité n’est attribué à ces plans. Ils ne valident pas l’étape documentaire de relevé de dimensions réelles.

Les emprises de site varient de **118 à 154 m de largeur** et de **84 à 184 m de profondeur**. Les parcelles mesurent 21 à 25 m de largeur utile et 28 à 36 m de profondeur. Les cotes de structure et de terrain restent exprimées en mètres.

Les logements familiaux visitables mesurent **9,6 à 11 m de largeur sur 14,4 à 17 m de longueur**. Ce sont des compositions auteur de **deux modules résidentiels fixes assemblés**, avec leurs six pièces et une circulation centrale : ces cotes ne décrivent ni un mobil-home de fabricant ni une caravane transportable. Le salon et la cuisine occupent une zone avant plus profonde ; les deux cabines, les sanitaires et la buanderie disposent de leurs pièces arrière. L’emprise des sites et des parcelles reste inchangée.

Les logements de travailleurs conservent leurs propres gabarits, **9,6 à 10,8 m sur 14,4 à 15,2 m**, et leurs cinquante plans sont identiques à ceux de la version précédente. Les **caravanes tractables conservent une enveloppe étroite**, 2,4 à 2,6 m sur 6,2 à 8,6 m. Leur intérieur n’est pas artificiellement élargi pour y faire entrer le couloir commun : il reste explicitement non réalisé.

Les hauteurs maximales dérivent des bâtiments et structures réellement déclarés. Les portes et les couloirs suivent les cotes auteur communes ; les meubles conservent les dimensions du catalogue de mobilier. Un objet trop encombrant est signalé comme non placé plutôt que réduit.

## Complétion des équipements — 1.72

Les petites pièces uniformes des logements familiaux refusaient **1 819 prescriptions** : 1 167 dans les parcs résidentiels, 200 dans les campings et 452 dans les parcs abandonnés. Les refus portaient notamment sur les canapés, fours, réfrigérateurs, égouttoirs et meubles bas. La correction modifie le vrai programme spatial, sans diminuer le nombre de prescriptions ni les dimensions des appareils.

La reconstruction des deux cents variantes place désormais les **25 440 équipements demandés**, avec zéro refus et zéro usage inconnu :

| Type | Plans | Équipements demandés et placés | Refus |
| --- | ---: | ---: | ---: |
| T045 | 50 | 8 970 | 0 |
| T046 | 50 | 3 300 | 0 |
| T047 | 50 | 8 440 | 0 |
| T048 | 50 | 4 730 | 0 |

Les accès aux faces de service, les portes des pièces, les portails et les retours piétons passent sur les scènes physiques qui contiennent effectivement ces meubles. Les logements de travailleurs, les coques fermées, les jardins, les piscines et le programme collectif gardent leurs rôles. Aucun stock de campagne ni service raccordé n’est créé par cette complétion auteur.

## Contrat technique

Le générateur expose `TYPES`, `build(type, number)`, `audit(plan)` et `auditAll()`. Le cœur entre `BEGIN AUTHOR CORE` et `END AUTHOR CORE` ne dépend pas de Node ; le compilateur navigateur lui injecte le validateur `Reference`. Les limites de lecture/écriture de la commande autonome restent hors de ce cœur.

Le schéma terrestre existant est conservé : bâtiments et pièces au rez-de-chaussée, portes explicites, structures solides, zones réservées et graphe de voies. Les ajouts de sol utilisent `outdoorAreas`, dont les rectangles portent leur usage, nom, niveau, provenance auteur et caractère praticable. Les voies peuvent traverser une terrasse praticable ; elles ne peuvent traverser un bâtiment, une clôture, un bassin ou une zone de jardin réservée.

La propriété `composition.parcels` associe chaque parcelle à une seule unité, un seul jardin et un passage. Le validateur refuse les doublons de parcelle, les déclarations d’intérieur inexactes, les ouvertures obstruées, les surfaces extérieures hors emprise et les faux services raccordés.

Les entrées du réseau auteur restent sur la limite du terrain. L’adaptation de l’inspecteur place les bornes de circulation un demi-mètre à l’intérieur de la parcelle pour contenir le corps du piéton ; elle ne déplace pas les coordonnées auteur ni ne raccorde le terrain à une route de campagne.

## Vérification et limites

La suite dédiée parcourt les **200 plans** avec le véritable constructeur de scènes physiques et son audit de déplacement. Elle vérifie les deux sorties, toutes les pièces et les accès de parcelles. Des cas de mobilier intégral vérifient la cohérence des usages, l’accès aux faces de service et les absences de gains de butin ou de branchements automatiques. Les mutations négatives ferment un portail, tracent une voie à travers une maison ou un jardin, déplacent une terrasse dans un bâtiment et falsifient l’état des services.

```sh
node --test tests/codex-residential2026.test.cjs
node --test tests/codex-residential-furnishing205.test.cjs
node scripts/codex-residential2026.cjs
```

L’audit intégré de l’inspection complète ces contrôles en parcourant toutes les variantes compilées avec leur mobilier et en conservant les empreintes des sources.

Les totaux des 200 variantes représentent **1 240 parcelles**, **1 385 bâtiments visitables**, **8 595 pièces avec circulations** et **455 coques de caravanes fermées**. Ces valeurs additionnent des compositions distinctes. Elles ne décrivent ni un seul camp ni les bâtiments apparus dans une graine.

Le générateur auteur ne prend pas en charge l’implantation dans le seed, les budgets de ressources, les services d’eau et d’énergie, la population, les rencontres, les intérieurs de coques étroites, les véhicules, l’art définitif ou la sauvegarde de campagne. Les preuves et la portée de l’intégration de campagne restent distinctes de cet audit. Aucun stock, rendement, animal ou habitant n’est créé par la seule production de ces plans.
