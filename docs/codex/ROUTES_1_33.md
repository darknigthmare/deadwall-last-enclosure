# Routes, chemins et ouvrages — 1.33

Cette passe ajoute **51 profils et 204 formes nommées** au guide : trois profils décrivent le réseau présent ; 48 sont des programmes de conception. Les quatre formes de chaque profil sont des variations de son programme, pas 204 nouveaux lieux générés. Le filtre « Contenu présent » ne montre que les trois fiches actuelles. Rechercher « Routes » dans « Présent et projets » ouvre le catalogue complet sans multiplier les boutons du commandement.

Les fiches détaillées sont dans [ROUTES_PROFILS_1_33.md](ROUTES_PROFILS_1_33.md) ; les données structurées dans [ROUTES_PROFILS_1_33.json](ROUTES_PROFILS_1_33.json). La source éditable est `src/road-profiles133.js`, raccordée au pack activités. Les exports ne sont pas un second générateur.

## Ce qui existe effectivement

| Élément | Identité runtime | Limite |
| --- | --- | --- |
| Axes et routes régionales | `world.roads[]` ; segments `{id,a,b,width}` ; axes de 7 m, certains axes G5 de 9 m | Aucun comptage de voies, sens légal ou altitude routière simulé |
| Rues et extrémités régionales | Segments de largeur 5,8 m | La largeur seule ne garantit pas la giration d’un poids lourd |
| Accès aux bâtiments | `poi.drive` de largeur 4 m, relié à `poi.road` | Couloir partagé ; pas une route à deux voies |
| Raccords et intersections | `DeadwallRoadKit.topology`, types `end`, `straight`, `bend45`, `bend90`, `bend135`, `tee`, `fork`, `cross`, `multi` | Intersection de lignes à niveau ; aucun échangeur dénivelé ni îlot de giratoire déduit |
| Peinture | `drawNetwork` : tous les accotements, toutes les surfaces, puis marquages interrompus aux raccords | La peinture ne change pas les colliders ni les règles de circulation |
| Région étendue | Axes `r131_<index>`, lieux et secteurs de `world-stream131.js` | Ces IDs restent ceux de la campagne ; les fiches de ce dossier ne les renumérotent pas |

Les désignations « autoroute », « tunnel », « pont » et « giratoire » ci-dessous ne reclassent pas les routes actuelles. La création de profils et la lecture du guide n’ajoutent aucune ressource, rencontre, structure, nouvelle génération ou donnée sauvegardée.

## Conventions de géométrie

Les dimensions proposées sont des **enveloppes de conception pour DEADWALL**, sans valeur de norme de construction. Les sources primaires en fin de dossier guident les distinctions et la méthode ; nous n’attribuons pas à ces organismes les chiffres choisis pour le jeu. Les grandeurs sont en mètres régionaux. Dans D-17, la projection locale utilise 32 unités moteur pour un mètre : ne jamais comparer une largeur locale brute à une largeur régionale.

« 2 × 2 », « 2 × 3 » et « 2 × 4 » signifient respectivement deux, trois et quatre voies **par sens**. Les exemples de sections courantes utilisent 3,5 m par voie, soit 14, 21 et 28 m de chaussées cumulées. Ces totaux excluent terre-plein, bandes de sécurité, accotements, fossés et talus : l’emprise à réserver est plus grande. Un profil de 7 m ne devient pas une autoroute en changeant simplement sa couleur.

`geometry.dimension` sépare trois mesures : largeur utile cumulée de chaussée, diamètre extérieur d’un giratoire, ou emprise globale d’une composition. Une emprise de carrefour de 40 m n’est pas une chaussée de 40 m. Les chaussées partagées ont une seule file praticable dans les deux sens avec croisement en poches ; elles ne sont pas des sens uniques. Les bretelles et anneaux sont déclarés à sens unique. Les programmes à plusieurs formes peuvent publier une surcharge explicite de voies et largeur dans la variante (bretelle à deux voies, tube ou viaduc à trois voies par sens).

L’autoroute relie des échanges ; la route principale relie des localités ; la rue distribue des parcelles ; l’accès dessert une destination ; le sentier relie des usages piétons. Un bâtiment n’ouvre jamais directement sa cour sur une section courante autoroutière. Une aire de service a entrée, circulation interne et sortie. Une route départementale désigne une appartenance au réseau, pas un unique profil physique.

## Assemblage, tracé et raccords

1. Fixer le domaine, la version de génération, le relief et les franchissements.
2. Construire un graphe de corridors continus, avec chaque sens et niveau déclarés.
3. Placer ouvrages et échanges avant les parcelles, puis vérifier leurs approches.
4. Réserver les transitions de largeur, courbes, visibilité, manœuvres et drainage.
5. Choisir surfaces, bords et marquages selon l’usage, sans modifier le graphe.
6. Installer les accès des lieux ; refuser une parcelle qui n’a pas de raccord valide.
7. Poser décors et végétation seulement dans les zones restantes.
8. Distribuer le budget fini de chaque lieu, puis appliquer son état d’abandon.
9. Tester l’aller et le retour de chaque usager admis avant d’accepter l’instance.

Les courbes suivent une tangente commune à la couture. Les bretelles quittent et rejoignent progressivement leur axe ; elles ne débouchent pas à angle droit sur la voie rapide. Les carrefours ordinaires ont une aire commune libre, des branches dont les largeurs se raccordent, et des lignes interrompues au conflit. Les giratoires ont un anneau continu : supprimer tout segment traversant l’îlot central avant le dessin, puis raccorder les branches à l’anneau. Un disque peint sur une intersection existante ne suffit pas.

Les grands échanges occupent des centaines de mètres, avec rampes et niveaux continus. Le jeu ne doit pas réduire arbitrairement un trèfle pour le faire tenir entre deux maisons. Un pont croisant une route ne crée pas de connexion au milieu du tablier. Les coordonnées `x,y` communes ne suffisent jamais à joindre des couches d’altitude différentes. Un changement de voie ou de largeur exige une transition explicite. `connectionCheck()` vérifie seulement ces préconditions documentaires ; il ne fabrique pas les rampes et ne certifie pas la visibilité réelle.

## Végétation, décors et ressources

Le corridor interdit aux objets couvre la demi-largeur de route, le rayon physique ou visuel retenu pour l’objet, puis une marge d’entretien et de lisibilité. Utiliser la distance au **segment fini**, avec ses deux extrémités, pas seulement à sa droite infinie. Pour l’aspect visuel, le rayon du houppier peut être plus grand que celui du tronc. Au raccord, tester tous les corridors concernés ; prendre la distance à l’axe le plus proche sans sa largeur peut oublier une chaussée plus large voisine.

`clearanceEnvelope(road, object)` fournit ce test de capsule pour un objet circulaire de conception. Il ne remplace pas les colliders rectangulaires de véhicules, le balayage des virages ou les niveaux. Le décor doit aussi rester hors du corridor de marche, des portes, de la visibilité d’un panneau, des réserves de giration et des faces de récolte. Un arbre au bord d’une route est cohérent ; un tronc généré au milieu de la chaussée ne l’est pas. Une branche tombée volontairement est un obstacle causé, identifié et récupérable ou contournable, jamais une plantation aléatoire.

| Usage | Décor cohérent | Ce qui peut être récupéré | Limite |
| --- | --- | --- | --- |
| Chemin rural | Fossé, barrière, borne, haie, muret | Branchage ou réserve agricole identifiée | Ni sol entier récoltable ni ferraille à chaque borne |
| Route principale | Panneau, glissière, buse, potelet | Coffre d’épave, réserve d’un lieu | Pas de coffre systématique sous chaque panneau |
| Carrefour | Îlots et panneaux aux approches | Une rencontre ou une épave finie, si acceptée | Trajectoires et retour restent libres |
| Autoroute | Clôtures, séparateur, portique, glissières | Véhicules abandonnés et locaux accessibles | Ne pas peupler toutes les voies d’obstacles |
| Pont/tunnel | Culées, niches, drainage, maintenance | Local ou matériel explicitement accessible | Le tablier et les piles ne sont pas des gisements |
| Aire de service | Pompes, tables, corbeilles, boutique, atelier | Stocks finis dans leurs vrais propriétaires | Pas de remplissage gratuit en revenant dans le chunk |

L’abondance visuelle est obtenue par des objets non récoltables lisibles, des variations de sol et des usages reconnaissables. Elle n’exige pas d’augmenter la densité de ressources. Le budget initial de D-17 doit rester suffisant pour sa boucle de démarrage tout en laissant des passages ; les variantes routières de ce catalogue n’ajoutent aucun budget au bastion.

## Probabilités proposées, conditionnelles et désactivées

La matrice ci-dessous est **une proposition de conception hors générateur**, avec un seul tirage par site routier préalablement validé. Elle ne s’applique ni à chaque mètre, ni à chaque chunk visité, ni à chaque seconde. Un carrefour vide n’est pas un échec de génération. Le nombre d’infectés, leur placement, les stocks, les factions et les interactions humaines demandent leur propre système réel avant activation.

| Contexte de site | Vide | Infecté | Présence alliée projetée | Présence hostile projetée |
| --- | ---: | ---: | ---: | ---: |
| Isolé | 70 % | 24 % | 5 % | 1 % |
| Village | 54 % | 34 % | 10 % | 2 % |
| Aire de service | 48 % | 40 % | 9 % | 3 % |
| Industrie | 51 % | 40 % | 5 % | 4 % |
| Échangeur | 68 % | 26 % | 4 % | 2 % |
| Tunnel | 76 % | 22 % | 1 % | 1 % |

`conditionalSpawns(context, capabilities)` est un outil de vérification documentaire : sans capacités explicitement déclarées, la sortie vaut 100 % vide. Un site doit avoir une géométrie valide et une voie de retour ; un tunnel exige aussi les volumes par niveau. Chaque catégorie désactivée retourne sa part au vide, **sans la redistribuer aux infectés**. Exemple : dans un village avec infectés autorisés mais sans système humain, la proposition devient 66 % vide, 34 % infecté, 0 % allié, 0 % hostile. Le module ne possède volontairement aucune fonction de tirage ou d’installation de rencontre.

Les probabilités **réellement jouées en G5** restent celles de `DeadwallCore.Spawn131Rules` et `world-spawns131.js`, décrites dans [GENERATEUR_1_31.md](GENERATEUR_1_31.md). Un relais logistique « allied » du générateur actuel ne devient pas une population de PNJ alliés grâce à cette proposition. Les factions humaines hostiles demeurent non implémentées. Ne pas recopier la matrice ci-dessus dans l’équilibrage runtime sans une livraison complète des systèmes dépendants.

## Nuit et perception

Campagne, chemins et longues sections rapides restent majoritairement sombres. Un réflecteur renvoie une source existante ; il n’émet pas de lumière. Les zones actives éclairent une entrée, une tâche, un refuge ou une sortie : source, alimentation, état et étage doivent être ceux du lieu. Une station fermée ne conserve pas éternellement des pompes lumineuses sans énergie.

Un tunnel demande une identité de volume distincte, une continuité lisible entre portail et sortie, des lumières attachées au bon tube, et des dispositifs de secours identifiables. La ventilation, l’intoxication et l’incendie demeurent des dépendances de conception si aucune simulation correspondante n’est installée. Une lumière de route sous un pont ne traverse pas son tablier pour éclairer un personnage au-dessus.

## Streaming, GPS et persistance

La géométrie des longues routes se décide à l’échelle du réseau ; les chunks en extraient une portion. Ils partagent les points de couture, la phase de marquage, le sens, le niveau et la continuité de surface. On ne tire pas indépendamment le bout du pont depuis chaque berge. Une route traversant trois chunks garde un identifiant parent ; chaque objet a un ID stable de génération, site, niveau et objet.

Les caches peuvent oublier les dessins et les plans ; ils ne peuvent pas oublier les coffres vidés, obstacles détruits, lampes déplacées ou décès. Un changement de catalogue ne renumérote pas les segments `r131_*`, les lieux `P*`, les contenants et les prélèvements enregistrés. Les anciennes générations gardent leur plan. Le réseau GPS utilise le même graphe, les mêmes couches et les mêmes fermetures physiques ; il doit annoncer une destination piétonne plutôt que diriger une voiture sur une passerelle.

Les garde-fous du module sont purs et n’avancent pas le RNG de simulation. Les calculs de distance sont locaux au segment ; un futur placeur appelle un index spatial pour obtenir seulement les routes voisines. Ni les 51 fiches ni les 204 variantes ne doivent être relues dans chaque tick ou générer un calcul quadratique du monde complet.

## Acceptation d’un futur profil jouable

| Axe | Scénario à prouver |
| --- | --- |
| Continuité | Traverser chaque raccord, changer de chunk et revenir sans saut de terrain ni nouvel obstacle |
| Géométrie | Pieds, pneus, bords, collisions et sol sont au même niveau et dans le même domaine |
| Itinéraire | Tester tous les couples entrée–sortie autorisés, à pied et dans le plus grand véhicule admis |
| Végétation | Aucun tronc ou rocher généré dans une chaussée ; contrôle avec largeur et rayon de canopée visuelle |
| Parcelles | Pas de chaussée sous une maison ; accès relié au vrai portail ; stationnement hors du flux |
| Ouvrage | Passage au-dessus et au-dessous sans téléportation, tir ou lumière à travers la dalle |
| Ressources | Budget total conservé après fouille, dépôt, mort, changement de chunk et reprise |
| Rencontre | Un seul tirage persistant par site ; catégorie absente = part rendue au vide |
| Nuit | Sources explicables, panneaux lisibles sans émission inventée, issues et silhouettes identifiables |
| Présentation | Statut du guide avancé seulement après tests du système réellement livré |

Les tests de ce catalogue prouvent cohérence des données, raccord au guide, calculs de préconditions et conservation des originaux. Ils ne certifient pas que les projets de ponts, tunnels ou autoroutes sont rendus, navigables ou simulés.

## Sources primaires consultées

- [Cerema — Aménagement des routes principales (présentation 2022)](https://www.cerema.fr/fr/actualites/amenagement-routes-principales-guide-reference) : fonctions territoriales, diversité des usagers, profils, visibilité, transitions et exploitation.
- [Cerema — Motorway Interchanges (publication 2023, mise à jour 2021)](https://doc.cerema.fr/Default/doc/SYRACUSE/594140) : portée du guide sur les échanges et accès aux aires annexes. Notice consultée ; les dimensions de nos profils ne sont pas extraites de cette notice.
- [Haute-Savoie — Traversées d’agglomération, édition 2016, hébergé par Cerema](https://www.cerema.fr/system/files/documents/2021/12/rrd74-gata_gt_a-edition2016.pdf) : familles de carrefours, de giratoires et de traitements urbains. Une référence départementale ne vaut pas règle universelle.
- [CETU — Géométrie](https://www.cetu.developpement-durable.gouv.fr/geometrie-a573.html) : références distinctes sur profil en long et dimensionnement des tunnels. Les risques et dépendances décrits ici sont une traduction de conception pour le jeu, sans revendication de conformité technique.

Consultation : 30 septembre 2026. Aucun plan, illustration ou extrait substantiel de ces ouvrages n’est repris ; les programmes et textes du catalogue sont originaux.
