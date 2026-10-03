# Catalogue routier — 1.33

51 profils, chacun décliné en quatre formes nommées. Les plages proposées sont des choix de conception, sans valeur normative. Voir [contrats, statuts et sources](ROUTES_1_33.md).

La source éditable est `src/road-profiles133.js`. Les profils ci-dessous ne créent pas de nouvelles routes en jeu.

## Réseau présent

### Axes régionaux actuels

`road133-runtime-axis` · **Présent en partie**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 7 à 9 m ; ground. Voies non modélisées dans le réseau actuel.

**Accès** : Segments reliés du réseau G4/G5 ; largeur ne prouvant ni nombre de voies ni régime de circulation.

**Formes** : Axe historique de 7 m ; Axe G5 de 7 m ; Axe G5 de 9 m ; Raccord entre noyau et région.

**Décor** : Accotements, marquages interrompus aux raccords et abords existants.

**Ressources** : Ressources dans les vrais contenants des lieux voisins ; aucun budget supplémentaire sur le bitume.

**Nuit** : Éclairage existant des lieux et matériel nocturne ; le réseau routier ne reçoit pas automatiquement des lampadaires.

**Risque** : Les croisements actuels sont à niveau ; aucune voie rapide dénivelée ne doit être déduite de leur largeur.

**Acceptation** : Comparer les centres, largeurs et raccords aux segments réels G4/G5 et aux accès p.drive.

**Portée** : world.roads: width===7 || width===9. Profil descriptif seulement. Le moteur ne modélise pas les voies séparément et ne simule pas le code de la route. Références : arp.

### Rues régionales actuelles

`road133-runtime-street` · **Présent en partie**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 5.8 à 5.8 m ; ground. Voies non modélisées dans le réseau actuel.

**Accès** : Rues de bourgs et bouts de réseau ; même ligne centrale pour carte, peinture et recherche routière.

**Formes** : Rue traversante ; Rue périphérique ; Rue oblique ; Extrémité régionale.

**Décor** : Accotements, marquages interrompus aux raccords et abords existants.

**Ressources** : Ressources dans les vrais contenants des lieux voisins ; aucun budget supplémentaire sur le bitume.

**Nuit** : Éclairage existant des lieux et matériel nocturne ; le réseau routier ne reçoit pas automatiquement des lampadaires.

**Risque** : La largeur ne garantit pas une manœuvre de camion : les véhicules doivent encore passer les collisions réelles.

**Acceptation** : Comparer les centres, largeurs et raccords aux segments réels G4/G5 et aux accès p.drive.

**Portée** : world.roads: width===5.8. Profil descriptif seulement. Le moteur ne modélise pas les voies séparément et ne simule pas le code de la route. Références : arp.

### Accès actuels aux bâtiments

`road133-runtime-drive` · **Présent en partie**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 4 à 4 m ; ground. Voies non modélisées dans le réseau actuel.

**Accès** : Relier la façade au vrai segment public, sans peindre de bordure en travers du raccord.

**Formes** : Accès de maison ; Accès de commerce ; Accès de service ; Accès oblique.

**Décor** : Accotements, marquages interrompus aux raccords et abords existants.

**Ressources** : Ressources dans les vrais contenants des lieux voisins ; aucun budget supplémentaire sur le bitume.

**Nuit** : Éclairage existant des lieux et matériel nocturne ; le réseau routier ne reçoit pas automatiquement des lampadaires.

**Risque** : Un accès de 4 m est un corridor partagé, pas une rue à deux voies ni un lieu de demi-tour garanti.

**Acceptation** : Comparer les centres, largeurs et raccords aux segments réels G4/G5 et aux accès p.drive.

**Portée** : poi.drive: {a,b,width:4}. Profil descriptif seulement. Le moteur ne modélise pas les voies séparément et ne simule pas le code de la route. Références : arp.


## Chemins et pistes

### Sentier forestier

`road133-trail` · **Projet de contenu**. Surface : sol naturel.

**Géométrie** : chaussée utile cumulée de 1.2 à 2.2 m ; ground. Flux pedestrian ; 0 / 0 voies de référence.

**Accès** : Parcours piéton entre lisière, clairière et repère ; raccord piéton seulement.

**Formes** : Lisière feuillue ; Sous-bois résineux ; Ancien passage de bûcheron ; Sentier de crête.

**Décor** : Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.

**Ressources** : Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.

**Nuit** : Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.

**Risque** : Ne jamais autoriser une voiture parce que les deux extrémités touchent des routes.

**Acceptation** : Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp.

### Chemin de terre agricole

`road133-dirt` · **Projet de contenu**. Surface : terre compactée.

**Géométrie** : chaussée utile cumulée de 3 à 4.5 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Voie partagée vers une parcelle, avec poche de croisement hors cultures.

**Formes** : Deux ornières herbeuses ; Terre battue sèche ; Chemin creux drainé ; Desserte de grange.

**Décor** : Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.

**Ressources** : Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.

**Nuit** : Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.

**Risque** : Ornières visuelles distinctes de la traction future ; éviter une impasse sans retour.

**Acceptation** : Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp.

### Chemin empierré

`road133-gravel` · **Projet de contenu**. Surface : grave et gravier.

**Géométrie** : chaussée utile cumulée de 3.5 à 5.5 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Accès rural stabilisé avec accotement et rayon de giration selon le véhicule retenu.

**Formes** : Grave calcaire ; Gravier sombre ; Empierrement réparé ; Rive de carrière.

**Décor** : Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.

**Ressources** : Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.

**Nuit** : Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.

**Risque** : Des cailloux décoratifs ne deviennent pas des gisements infinis.

**Acceptation** : Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp.

### Chemin de bocage

`road133-bocage` · **Projet de contenu**. Surface : terre compactée.

**Géométrie** : chaussée utile cumulée de 3 à 4.5 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Talus et haies placés après le corridor praticable ; ouvertures alignées avec les parcelles.

**Formes** : Haies basses ; Talus et fossés ; Murets ajourés ; Passage entre vergers.

**Décor** : Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.

**Ressources** : Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.

**Nuit** : Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.

**Risque** : Branches, clôtures et murets ne masquent pas totalement la prochaine sortie.

**Acceptation** : Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp.

### Piste forestière

`road133-forest-track` · **Projet de contenu**. Surface : grave et gravier.

**Géométrie** : chaussée utile cumulée de 3.5 à 5.5 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Piste d’exploitation vers aire de retournement ; barrière placée sur une entrée élargie.

**Formes** : Pare-feu ; Desserte de coupe ; Piste à lacets ; Accès de poste forestier.

**Décor** : Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.

**Ressources** : Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.

**Nuit** : Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.

**Risque** : Réserver le balayage du grumier avant troncs, tas de bois et fossés.

**Acceptation** : Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp.

### Antenne de débardage

`road133-logging-spur` · **Projet de contenu**. Surface : terre compactée.

**Géométrie** : chaussée utile cumulée de 3 à 5 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Branche courte de piste, avec extrémité lisible et aire latérale de chargement.

**Formes** : Coupe récente ; Coupe ancienne ; Place de dépôt ; Passage humide stabilisé.

**Décor** : Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.

**Ressources** : Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.

**Nuit** : Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.

**Risque** : Ne pas la traiter comme un raccourci permanent du réseau principal.

**Acceptation** : Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp.


## Routes et rues

### Petite route de campagne

`road133-country` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 4.5 à 6 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Deux sens sur chaussée étroite ; accotements irréguliers et accès agricoles espacés.

**Formes** : Bocage ; Plaine cultivée ; Vignoble ; Route de ferme dispersée.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Absence de ligne centrale possible ; aucun marquage autoroutier.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Route départementale

`road133-departmental` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 6 à 7.5 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Axe interurbain raccordant les bourgs ; carrefours lisibles et voies d’accès latérales.

**Formes** : Plaine à fossés ; Traversée de bois ; Entrée de village ; Secteur de relief.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Le statut départemental ne fixe pas à lui seul la largeur ni la vitesse.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Traversée de village

`road133-village-street` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 5 à 6.5 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Transition visible entre campagne et bâti ; trottoirs et seuils de commerces cohérents.

**Formes** : Rue de mairie ; Rue de marché ; Faubourg artisanal ; Rue ancienne contrainte.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Réserver une continuité piétonne sans rétrécir le véhicule jusqu’à traverser les murs.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Rocade urbaine

`road133-bypass` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 12 à 18 m ; ground. Flux bidirectional ; 2 / 2 voies de référence.

**Accès** : Chaussées séparées ; connexions regroupées et traversées piétonnes explicitement aménagées.

**Formes** : Boulevard périphérique ; Contournement industriel ; Section en tranchée ; Liaison entre faubourgs.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Une artère divisée n’est pas automatiquement une autoroute ; son régime reste déclaré.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Route de montagne

`road133-mountain-road` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 4.5 à 7 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Le tracé suit le relief avec lacets séparés en altitude et soutènements du bon côté.

**Formes** : Versant boisé ; Lacet rocheux ; Balcon exposé ; Route de col.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Pas de nœud routier à l’intersection projetée de deux lacets de hauteurs différentes.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Route littorale

`road133-coastal-road` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 5.5 à 7 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Conserver côte, talus et accès de plage ; parking sur parcelle dédiée.

**Formes** : Dune reculée ; Falaise ; Front de petite ville ; Digue accessible.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Nécessite une vraie limite d’eau et un traitement des franchissements avant activation.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Rue pavée ou chemin en pierre

`road133-stone-lane` · **Projet de contenu**. Surface : pierre ou pavés.

**Géométrie** : chaussée utile cumulée de 3 à 6 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Desserte ancienne à faible gabarit ; distinguer pavage construit et éboulis naturel.

**Formes** : Pavés de bourg ; Dalles de cour ; Voie antique réparée ; Ruelle minérale.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Le pavé ne justifie pas des rochers bloquants sur l’axe.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.

### Section en travaux

`road133-work-zone` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 3.2 à 7 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Déviation et rétrécissement raccordés ; balisage progressif en amont et sortie visible.

**Formes** : Alternat abandonné ; Chaussée réparée ; Déviation provisoire ; Voie neutralisée.

**Décor** : Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.

**Ressources** : Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.

**Nuit** : Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.

**Risque** : Les cônes n’annulent pas les collisions ni les sens de circulation ; gabarit déclaré par variante.

**Acceptation** : Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, urban.


## Autoroutes et bretelles

### Autoroute 2 × 2 voies

`road133-motorway-2x2` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 14 à 14 m ; ground. Flux bidirectional ; 2 / 2 voies de référence.

**Accès** : Deux voies par sens, séparateur central, bords et bandes de sécurité réservés en plus de la chaussée.

**Formes** : Plaine ; Tranchée boisée ; Remblai rural ; Périphérie lointaine.

**Décor** : Séparateur, glissières, clôture, panneaux et ouvrages de drainage suivent le profil et ses transitions.

**Ressources** : Récupération dans les véhicules ou installations accessibles ; pas de caisses disséminées sur chaque voie.

**Nuit** : Échanges ou aires éclairés seulement si leur installation est alimentée ; longues sections sombres cohérentes.

**Risque** : Aucun accès de maison, carrefour à niveau, arrêt de bus ou giratoire sur la section courante.

**Acceptation** : Suivre séparément chaque sens et chaque bretelle ; aucune liaison à niveau, demi-tour par terre-plein ou accès de parcelle.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange.

### Autoroute 2 × 3 voies

`road133-motorway-2x3` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 21 à 21 m ; ground. Flux bidirectional ; 3 / 3 voies de référence.

**Accès** : Trois voies par sens ; élargissement progressif annoncé depuis une section 2 × 2.

**Formes** : Approche métropolitaine ; Corridor logistique ; Section entre échanges ; Élargissement ancien.

**Décor** : Séparateur, glissières, clôture, panneaux et ouvrages de drainage suivent le profil et ses transitions.

**Ressources** : Récupération dans les véhicules ou installations accessibles ; pas de caisses disséminées sur chaque voie.

**Nuit** : Échanges ou aires éclairés seulement si leur installation est alimentée ; longues sections sombres cohérentes.

**Risque** : Interdire la disparition abrupte d’une voie et réserver les insertions avant les obstacles.

**Acceptation** : Suivre séparément chaque sens et chaque bretelle ; aucune liaison à niveau, demi-tour par terre-plein ou accès de parcelle.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange.

### Autoroute 2 × 4 voies

`road133-motorway-2x4` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 28 à 28 m ; ground. Flux bidirectional ; 4 / 4 voies de référence.

**Accès** : Quatre voies par sens sur corridor majeur, avec emprise nettement supérieure aux axes ruraux.

**Formes** : Couronne métropolitaine ; Nœud interrégional ; Approche de grand échange ; Tronc commun de deux axes.

**Décor** : Séparateur, glissières, clôture, panneaux et ouvrages de drainage suivent le profil et ses transitions.

**Ressources** : Récupération dans les véhicules ou installations accessibles ; pas de caisses disséminées sur chaque voie.

**Nuit** : Échanges ou aires éclairés seulement si leur installation est alimentée ; longues sections sombres cohérentes.

**Risque** : Forme rare et territorialisée ; pas une largeur tirée au hasard au milieu d’un village.

**Acceptation** : Suivre séparément chaque sens et chaque bretelle ; aucune liaison à niveau, demi-tour par terre-plein ou accès de parcelle.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange.

### Bretelle autoroutière

`road133-ramp` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 3.5 à 7 m ; ground. Flux one-way ; 1 / 0 voies de référence.

**Accès** : Une ou deux voies à sens unique déclarées ; séparation, courbe puis insertion progressive.

**Formes** : Bretelle de sortie ; Bretelle d’entrée ; Boucle lente ; Bretelle à deux voies (2 / 0 voies ; 7 m de chaussée).

**Décor** : Séparateur, glissières, clôture, panneaux et ouvrages de drainage suivent le profil et ses transitions.

**Ressources** : Récupération dans les véhicules ou installations accessibles ; pas de caisses disséminées sur chaque voie.

**Nuit** : Échanges ou aires éclairés seulement si leur installation est alimentée ; longues sections sombres cohérentes.

**Risque** : Pas de virage à angle droit directement sur la chaussée rapide ni de demi-tour implicite.

**Acceptation** : Suivre séparément chaque sens et chaque bretelle ; aucune liaison à niveau, demi-tour par terre-plein ou accès de parcelle.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange.


## Carrefours et échanges

### Carrefour en T

`road133-tee` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 18 à 40 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Trois branches réellement raccordées ; la branche secondaire rejoint une zone de visibilité libre.

**Formes** : T rural ; T de village ; T canalisé ; T de desserte industrielle.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Interrompre les lignes au bon endroit ; pas de quatrième sortie dessinée sans sol praticable.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Carrefours décalés

`road133-offset` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 40 à 100 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Deux T séparés par une section assez longue pour le véhicule de référence.

**Formes** : Décalage droit ; Décalage gauche ; Entrées de hameau ; Accès de ferme opposés.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Ne pas fusionner les deux carrefours en une tache d’asphalte avec croisements ambigus.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Carrefour à quatre branches

`road133-cross` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 22 à 50 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Quatre branches à niveau ; bords continus et aire commune libre d’objets.

**Formes** : Croix rurale ; Croix urbaine ; Carrefour à îlots ; Intersection de zone artisanale.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Éviter l’excès de branches et distinguer lampadaire, feu décoratif et feu réellement fonctionnel.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Bifurcation en Y

`road133-fork` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 20 à 55 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Trois branches ; îlot possible hors des trajectoires et panneaux sur les approches.

**Formes** : Fourche forestière ; Bifurcation de vallée ; Séparation de faubourg ; Choix de contournement.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Pas d’angle aigu imposant de traverser le terre-plein pour suivre le GPS.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Giratoire compact

`road133-roundabout-compact` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : diamètre extérieur de 24 à 34 m ; ground. Flux one-way ; 1 / 0 voies de référence.

**Accès** : Anneau à sens unique, îlot central et couronne franchissable si prévue pour le grand gabarit.

**Formes** : Village ; Entrée de bourg ; Petit parc d’activité ; Carrefour de faubourg.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Les entrées infléchissent les trajectoires ; aucune route ne coupe visuellement l’îlot.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Giratoire interurbain

`road133-roundabout-rural` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : diamètre extérieur de 36 à 56 m ; ground. Flux one-way ; 1 / 0 voies de référence.

**Accès** : Anneau et branches séparés ; îlots d’approche et visibilité latérale dégagée.

**Formes** : Quatre branches ; Trois branches ; Accès de zone industrielle ; Transition de contournement.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Panneaux hors du balayage des véhicules ; pas d’arbre sur l’anneau.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Grand giratoire urbain

`road133-roundabout-urban` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : diamètre extérieur de 45 à 70 m ; ground. Flux one-way ; 2 / 0 voies de référence.

**Accès** : Deux voies circulaires proposées, choix de sortie et rabattement cohérents.

**Formes** : Place périphérique ; Porte de ville ; Carrefour commercial ; Double desserte de boulevard.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Deux voies ne doublent pas mécaniquement la capacité ; piétons et cyclistes ont des parcours séparés.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Échangeur en losange

`road133-diamond` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 240 à 480 m ; grade-separated. Flux junction ; 0 / 0 voies de référence.

**Accès** : Quatre bretelles raccordent une route transversale au-dessus ou au-dessous de l’axe rapide.

**Formes** : Route au-dessus ; Route au-dessous ; Terminaisons en T ; Terminaisons giratoires.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Croisements éventuels seulement aux terminaisons sur la route secondaire, jamais sur l’autoroute.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Échangeur en trompette

`road133-trumpet` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 300 à 650 m ; grade-separated. Flux junction ; 0 / 0 voies de référence.

**Accès** : Raccord à trois branches, avec boucle et bretelles lisibles en altitude.

**Formes** : Terminaison rurale ; Liaison de vallée ; Accès de péage ; Jonction de contournement.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Ne pas imposer une croisée à niveau au tronc principal ni une sortie en sens interdit.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Échangeur à boucles

`road133-cloverleaf` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 400 à 800 m ; grade-separated. Flux junction ; 0 / 0 voies de référence.

**Accès** : Boucles et voies collectrices réservées avant les parcelles voisines.

**Formes** : Demi-trèfle ; Trèfle historique ; Boucles avec collectrices ; Boucle et bretelle directe.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Les entrecroisements demandent une vraie longueur de transition ; ne pas miniaturiser le trèfle.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.

### Échangeur directionnel

`road133-directional` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 500 à 1100 m ; grade-separated. Flux junction ; 0 / 0 voies de référence.

**Accès** : Bretelles directes en couches distinctes, rares et réservées aux grands axes.

**Formes** : Trois branches ; Quatre branches ; Superposition urbaine ; Nœud de fret.

**Décor** : Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.

**Ressources** : Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.

**Nuit** : Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.

**Risque** : Niveaux, piles et rampes doivent former une structure physiquement continue.

**Acceptation** : Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : arp, exchange, urban.


## Ponts et tunnels

### Petit pont rural

`road133-small-bridge` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 3.5 à 6 m ; grade-separated. Flux shared ; 1 / 0 voies de référence.

**Accès** : Tablier reliant deux berges avec culées et parapets ; croisement alterné si étroit.

**Formes** : Pont de pierre ; Pont de béton ; Petit ouvrage métallique ; Pont de ferme.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Aucune connexion GPS entre le lit inférieur et le tablier au milieu de l’ouvrage.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Pont routier de rivière

`road133-river-bridge` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 6 à 9 m ; grade-separated. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Tablier à deux sens, approches progressives et continuité de protection des bords.

**Formes** : Poutres de béton ; Arches ; Pont ancien élargi ; Tablier réparé.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Rivière et piles sont de vrais volumes ; un pilier ne se place pas sur le chemin sous ouvrage.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Viaduc routier

`road133-viaduct` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 14 à 28 m ; grade-separated. Flux bidirectional ; 2 / 2 voies de référence.

**Accès** : Travées, piles et chaussées continues au-dessus d’une vallée ou d’infrastructures.

**Formes** : Deux voies par sens ; Trois voies par sens (3 / 3 voies ; 21 m de chaussée) ; Tabliers séparés ; Courbe de vallée.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Le nombre de voies de la variante fixe la largeur ; aucune collision globale à toute altitude.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Pont à charpente métallique

`road133-steel-bridge` · **Projet de contenu**. Surface : tablier métallique.

**Géométrie** : chaussée utile cumulée de 3.5 à 7 m ; grade-separated. Flux shared ; 1 / 0 voies de référence.

**Accès** : Poutres, contreventements et gabarit intérieur ; réserver une approche avant le portail.

**Formes** : Treillis riveté ; Tablier mixte ; Pont industriel ; Remplacement provisoire.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : La silhouette de la charpente ne doit pas bloquer un véhicule annoncé compatible.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Passerelle piétonne

`road133-footbridge` · **Projet de contenu**. Surface : platelage bois.

**Géométrie** : chaussée utile cumulée de 1.5 à 3 m ; grade-separated. Flux pedestrian ; 0 / 0 voies de référence.

**Accès** : Relier deux chemins par escaliers ou rampes piétonnes explicitement présents.

**Formes** : Bois de campagne ; Acier urbain ; Passerelle de canal ; Passage de ravin.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Ne jamais connecter la voie automobile à la passerelle dans le graphe de véhicule.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Passage inférieur

`road133-underpass` · **Projet de contenu**. Surface : béton.

**Géométrie** : chaussée utile cumulée de 4 à 8 m ; below-ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Le passage inférieur conserve sa propre altitude et ses accès de drainage.

**Formes** : Route sous voie rapide ; Chemin sous remblai ; Passage de service ; Accès agricole busé.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Piles et culées ne se confondent pas avec une barrière couvrant tout le rectangle.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Tunnel routier bidirectionnel

`road133-short-tunnel` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 6 à 8 m ; below-ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Un tube à deux sens ; portails, parois et cheminement d’évacuation réservés avant le décor.

**Formes** : Traversée rocheuse ; Tunnel de col ; Tunnel court périurbain ; Ouvrage ancien élargi.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Nécessite visibilité et éclairage cohérents ; pas de forêt générée dans le volume creusé.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Tunnel à deux tubes

`road133-twin-tunnel` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : chaussée utile cumulée de 14 à 21 m ; below-ground. Flux bidirectional ; 2 / 2 voies de référence.

**Accès** : Un tube par sens ; voies maintenues depuis les portails et liaisons de secours identifiées.

**Formes** : Deux voies par tube ; Trois voies par tube (3 / 3 voies ; 21 m de chaussée) ; Tubes décalés ; Tunnel autoroutier long.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Les galeries de secours ne sont pas des raccourcis pour les véhicules.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Tranchée couverte

`road133-cut-cover` · **Projet de contenu**. Surface : béton.

**Géométrie** : chaussée utile cumulée de 6 à 14 m ; below-ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Route sous couverture avec ouvrages latéraux et surface supérieure distincte.

**Formes** : Couverture urbaine ; Passage de périphérie ; Écran de quartier ; Court tunnel d’accès.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : La parcelle au-dessus n’interagit pas à travers la dalle avec les objets du dessous.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Galerie de protection

`road133-rock-gallery` · **Projet de contenu**. Surface : béton.

**Géométrie** : chaussée utile cumulée de 5 à 7 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Couverture accolée au versant, ouvertures vers l’aval et débouchés dégagés.

**Formes** : Pare-blocs ; Galerie de falaise ; Secteur avalancheux ; Galerie semi-ouverte.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Protection visuelle sans effondrement simulé tant que cette mécanique n’existe pas.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.

### Gué aménagé

`road133-ford` · **Projet de contenu**. Surface : pierre ou pavés.

**Géométrie** : chaussée utile cumulée de 3 à 5 m ; ground. Flux shared ; 1 / 0 voies de référence.

**Accès** : Route traversant réellement un lit peu profond avec seuils et retour sur les berges.

**Formes** : Dalles basses ; Radier de béton ; Pierres maçonnées ; Déviation de pont.

**Décor** : Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.

**Ressources** : Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.

**Nuit** : Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.

**Risque** : Projet conditionné à une hydrologie jouable ; crue et profondeur ne sont pas de simples textures.

**Acceptation** : Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : tunnel, arp.


## Aires et abords

### Aire de repos

`road133-rest-area` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 70 à 160 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Entrée puis boucle de stationnement puis sortie ; sentiers séparés des manœuvres.

**Formes** : Aire boisée ; Belvédère ; Aire de plaine ; Aire de poids lourds.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Les réserves appartiennent aux coffres ou au local ; les tables ne produisent pas de nourriture.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Aire de services

`road133-service-area` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 120 à 260 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Pompes, stationnement, boutique et livraisons reliés sans traverser le sens rapide.

**Formes** : Petite station ; Grande aire ; Station fermée ; Aire avec motel.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Aucune pompe infinie ; alimentation et carburant viennent d’un état de lieu fini.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Ancienne barrière de péage

`road133-toll` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 80 à 220 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Élargissement progressif vers les cabines puis convergence vers l’axe.

**Formes** : Péage pleine voie ; Sortie à tickets ; Voie de service ; Barrière partiellement évacuée.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Ne pas laisser tous les passages physiquement fermés sans retour annoncé avant l’approche.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Centre d’entretien routier

`road133-maintenance` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 60 à 150 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Cour, atelier, matériaux, garage et portail de service ; accès depuis le réseau secondaire.

**Formes** : Petit dépôt ; District autoroutier ; Station hivernale ; Atelier départemental.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Engins décoratifs non pilotables tant que leur conduite n’est pas disponible.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Arrêt en retrait

`road133-bus-bay` · **Projet de contenu**. Surface : revêtement bitumineux.

**Géométrie** : emprise globale de 25 à 60 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Baie en retrait sur route compatible et chemin piéton vers les habitations.

**Formes** : Abri de village ; Arrêt rural ; Arrêt scolaire ; Ancienne halte de quartier.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Pas d’arrêt public posé sur une section courante autoroutière.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Refuge et aire de retournement

`road133-layby` · **Projet de contenu**. Surface : grave et gravier.

**Géométrie** : emprise globale de 15 à 45 m ; ground. Flux junction ; 0 / 0 voies de référence.

**Accès** : Élargissement latéral hors du flux, dimensionné selon le véhicule admis.

**Formes** : Refuge de piste ; Demi-tour forestier ; Renfoncement rocheux ; Accès de secours.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Ne pas masquer une absence de demi-tour par une téléportation du véhicule.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Desserte industrielle

`road133-industrial-road` · **Projet de contenu**. Surface : béton.

**Géométrie** : chaussée utile cumulée de 7 à 10 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Portails en retrait, giration, quais et bandes piétonnes raccordés aux parcelles.

**Formes** : Boucle d’entrepôts ; Cour d’usine ; Accès de carrière ; Desserte de silo.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Les remorques ne traversent ni clôtures ni rangées de conteneurs lors de leur virage.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

### Voirie portuaire

`road133-quay-road` · **Projet de contenu**. Surface : béton.

**Géométrie** : chaussée utile cumulée de 7 à 12 m ; ground. Flux bidirectional ; 1 / 1 voies de référence.

**Accès** : Séparer quai, voie lourde, stockage et circulation des équipes ; clôture traversée par un vrai portail.

**Formes** : Quai cargo ; Terminal de fret ; Port de pêche ; Desserte d’atelier naval.

**Décor** : Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.

**Ressources** : Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.

**Nuit** : Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.

**Risque** : Projet lié au port et à l’eau ; pas de ponton décoratif traité comme route terrestre.

**Acceptation** : Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.

**Portée** : Programme de conception non généré ; dépendances de géométrie, navigation, occupation et persistance à livrer avant activation. Références : exchange, arp.

