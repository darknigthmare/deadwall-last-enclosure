# DEADWALL — Le monde avant la chute
## Contrat de génération et codex externe · édition 1.0

Ce dossier sert aux prochaines générations de contenu et aux développeurs. **Il n’est pas un codex à afficher dans le jeu.** Il contient 500 types de lieux, répartis en 25 familles. Une fiche décrit un programme, des relations, des gabarits, des règles de placement et des contrôles : elle n’affirme pas que toutes ses variantes sont déjà jouables.

**Couverture de la livraison 1.15 : 22 plans pilotes simplifiés sont reliés à ces fiches ; 478 fiches restent des conceptions.** Le fichier `CATALOGUE_500.json` distingue ces statuts, et le rapport du jeu qualifie les comportements effectivement testés. Un plan pilote de centre commercial n’est pas l’intégration de tout le programme commercial décrit ici.

## 1. Le changement recherché

Le joueur commence dans un refuge avec des réserves proches et compréhensibles. Il apprend où trouver nourriture, médicaments, pièces et matériaux. Les contenants proches s’épuisent réellement ; les prochaines tournées deviennent plus longues. La voiture accroît la distance utile, mais il faut financer le carburant, disposer d’un accès, charger le coffre et rentrer. La distance n’augmente pas magiquement la quantité d’objets dans un réfrigérateur.

Le monde doit sembler avoir eu une fonction avant l’effondrement. On ne place donc pas une « ressource ferraille » sur une grille régulière puis une image de voiture au-dessus. On crée une rue, une parcelle, un parking, une place, une voiture à sa taille et un contenant cohérent. De la même manière, une ruine est d’abord une construction avec un plan et une cause de destruction, pas un petit pictogramme de la taille du personnage.

La région du pilote 1.15 utilise un domaine métrique de 8 192 × 8 192 m, soit environ 67,1 km², découpé en secteurs de 256 m. **Le chantier et le siège historiques de D-17 restent dans leur domaine local ; la région est pour l’exploration.** Ne pas présenter cette architecture comme une mégaville constructible sur toute la surface. Étendre un jour les chantiers au domaine régional exigera une véritable extension des stocks, transports, commandes, perimeters, sauvegardes et simulations locales.

## 2. Hiérarchie obligatoire

`Région → biome/relief → réseau → quartier → parcelle → volumes → niveaux → pièces → zones d’usage → props → contenants`.

Chaque étage dépend de celui au-dessus de cette hiérarchie. Un parking dépend d’une parcelle desservie ; une réserve dépend d’un commerce ou d’une activité ; un meuble dépend d’une pièce ; son butin dépend du meuble et de la fonction du lieu. Il est interdit de corriger un problème de parcelle en déplaçant des objets à travers une chaussée, un mur ou une propriété voisine.

À l’échelle régionale, les routes principales relient les agglomérations. Les voies locales desservent des îlots, les ruelles arrière permettent les livraisons, les chemins forestiers mènent aux coupes et les pistes minières rejoignent les plateformes. Les routes doivent être définies une fois dans les coordonnées mondiales, puis découpées pour l’affichage : elles ne sont pas inventées indépendamment de chaque côté d’une frontière de secteur.

## 3. Gabarits, pas miniatures

Les dimensions du catalogue sont des **références de level design**, pas des normes réglementaires ou des mesures universelles. Utiliser notamment un personnage de référence d’environ 1,78 m, une voiture compacte de 4,6 × 1,85 m, un fourgon de 5,4 × 2,05 m et un lit de 2,05 × 1,60 m. Les tailles détaillées sont dans `PROPS_GABARITS.json`.

Conserver trois notions séparées : emprise au sol, volume visuel et espace d’usage. Le feuillage peut dépasser l’emprise d’un tronc ; la portière exige un dégagement qui ne devient pas nécessairement un obstacle permanent ; une tour projette un volume visuel mais son pied est un vrai collider. Rendu, collision, interaction et sauvegarde doivent partager la même transformation position/rotation/niveau.

Une voiture tournée utilise un rectangle orienté, pas le cercle du personnage agrandi. Les places de référence font 2,7 × 5,5 m et une allée de stationnement 6 m. Ce sont des choix de jeu. Le générateur agrandit la parcelle lorsque le parking ne rentre pas ; il ne rétrécit ni les voitures ni les allées.

## 4. Lire correctement les fourchettes

Les surfaces et répétitions des fiches sont des options de programme. **Il ne faut jamais additionner tous leurs maxima et prétendre que l’enveloppe minimale suffit.** Une petite supérette sélectionne un programme réduit ; un grand centre commercial exige une parcelle beaucoup plus vaste.

Le solveur calcule d’abord : surfaces des pièces choisies + murs/porteurs + circulations + escaliers/ascenseurs + dégagements + espaces extérieurs indispensables. Il vérifie ensuite chaque niveau et le stationnement. En cas d’insuffisance, il agrandit l’enveloppe dans sa fourchette, choisit une variante de programme explicitement plus petite ou refuse la parcelle. Il ne supprime jamais une sortie obligatoire pour gagner de la place.

Les quantités de props indiquent des possibilités par zone d’usage. Le nombre de voitures réellement présentes dépend de l’occupation du parking, pas du seul nombre maximal de places. Les très grands équipements restent des compositions de volumes et de pièces ; les remplacer par une seule caisse à butin contredit le catalogue.

## 5. Circulations et étages

Avant le mobilier, réserver les parcours publics, de service et de sortie. Un client va de l’entrée à la vente ; un livreur du quai à la réserve ; les habitants rejoignent leurs chambres depuis un palier, pas au travers de l’appartement voisin. La largeur utile tient compte des colliders et non seulement du vide visible entre textures.

Un escalier relie des niveaux déclarés du même volume, avec les mêmes coordonnées XY et une arrivée libre. Un sous-sol n’est autorisé que sur une parcelle et un bâtiment compatibles. Une cabine ou un abri léger ne reçoit pas un immense bunker par tirage aléatoire. Une mine nécessite une entrée, des galeries, des soutènements, des branches fermées explicites et une sortie ; un hôtel nécessite une réception, des couloirs, des chambres et des locaux de service.

Le pilote possède des changements de niveau par commande près d’une cage ; cela ne signifie pas qu’il simule une volée animée en 3D, des ascenseurs fonctionnels ou tous les étages imaginés dans les fiches. Les variantes au-delà des niveaux pris en charge doivent rester au statut conception tant que les systèmes correspondants ne sont pas développés.

## 6. Une irrégularité causale

Une forêt n’est ni un damier ni un nuage uniforme. Générer une couverture continue par sol, humidité et relief, puis des bosquets, lisières, clairières, sous-bois et traces de coupe. Réserver les routes, chemins et parcelles avant les troncs. La canopée peut se recouvrir ; les volumes physiques ne se superposent pas sans raison.

Dans un lotissement ou un verger, des alignements sont normaux. L’irrégularité vient des parcelles, du terrain, de l’âge, de l’entretien et d’accidents localisés. Les voitures stationnées suivent les places avec quelques degrés d’écart ; les meubles suivent les murs ; les pompes suivent l’îlot de distribution ; les machines fixes suivent la chaîne de travail. **« Naturel » ne signifie pas appliquer un angle libre à chaque objet.**

L’abandon ajoute une histoire : un magasin pillé depuis sa façade, un accident qui explique les véhicules arrêtés, une brèche dont les débris tombent à proximité, une végétation qui entre par les ouvertures. Ne pas répandre les mêmes gravats dans toutes les pièces, les mêmes bidons dans tous les bureaux et les mêmes voitures accidentées sur chaque route.

## 7. Ruines composées et visitables

Construire d’abord la version intacte. Choisir ensuite les éléments perdus : portion de façade, couverture, dalle, escalier ou cloison. Conserver la relation entre dégâts et matériaux. Un tas de tuiles doit provenir d’un toit, un morceau de dalle d’un plancher porté ; aucun débris ne doit flotter à un étage inexistant.

Le passage visitable se teste après destruction et décoration. Une ouverture peut donner une entrée alternative ; une dalle rompue peut condamner une partie du niveau. Le générateur ne doit ni dessiner un trou praticable mais garder un mur invisible, ni dessiner un mur intact et le laisser traversable. Les parcours volontairement impossibles doivent être identifiés comme tels, sans compteur de contenu faussement accessible.

## 8. Ressources finies et renseignements

Les cuisines et réserves alimentaires contiennent des aliments ; les soins et pharmacies des médicaments ; les ateliers des outils, pièces et ferrailles ; les cours et dépôts les matériaux lourds. Les pièces vides existent. Un objet technique n’est pas nécessairement un contenant pillable.

Attribuer un budget par fonction et remplir les contenants une seule fois. Enregistrer les prélèvements sous un identifiant stable incluant génération, parcelle, niveau, pièce et emplacement. L’éviction du cache, le changement de niveau, le retour au menu et la reprise ne doivent jamais relancer un tirage de butin. Une migration ne doit pas rendre à nouveau plein un site déjà visité.

Les renseignements peuvent désigner un voisin plausible : carnet d’un livreur vers un dépôt, inventaire de pharmacie vers un dispensaire, carte d’entretien vers une station technique. Ils ne téléportent pas le joueur et ne créditent pas son sac. La nouvelle destination n’est pas forcément plus riche : elle est encore disponible, plus spécialisée ou mieux documentée.

## 9. Contrat technique et génération future

Fixer une version de génération. Les identifiants du catalogue `DW-xxxx` ne changent pas lorsqu’on déplace une fiche dans l’index. Un identifiant d’instance ne doit pas dépendre d’une liste susceptible d’être retriée. Le pilote emploie des emplacements déterministes ; une modification de leur ordre requiert une migration des deltas, pas un changement silencieux du monde.

Séparer les graines de géographie, mobilier, contenu et événements des tirages de combat. Un rendu, une ouverture de carte ou une inspection ne consomme pas l’aléatoire d’une horde. Charger uniquement les secteurs proches ; conserver une donnée géographique légère à grande distance. Les plafonds de cache doivent être testés après de longues traversées, pas seulement au départ.

Pour passer une fiche à « intégrée » : ajouter son plan réel ; rendre son mobilier ; raccorder ses entrées, niveaux et ressources ; produire les tests et captures ; inscrire sa couverture exacte dans la matrice. Copier le nom d’une fiche dans une liste n’est pas une intégration.

## 10. Références de conception et limites

Le journal officiel de Project Zomboid « Cellar door-doid » distingue les sous-sols fixes et les variantes placées seulement dans des lieux compatibles. C’est une référence utile pour des noyaux verticaux cohérents, et non une autorisation de copier leurs plans ou leurs assets. La page officielle de The Last Stand: Aftermath décrit la recherche de ressources et de carburant pour poursuivre l’exploration : c’est le lien distance/ravitaillement retenu ici.

Références consultées le 23 septembre 2026 :
- The Indie Stone, *Cellar door-doid* : https://projectzomboid.com/blog/news/2023/10/cellar-door-doid/
- The Indie Stone, *42.20 The Big Glow Up* : https://projectzomboid.com/blog/news/2026/07/42-20-the-big-glow-up/
- Con Artist Games / Armor Games Studios, présentation Steam de *The Last Stand: Aftermath* : https://store.steampowered.com/app/1266840/The_Last_Stand_Aftermath/

Les noms, programmes et géométries de ce dossier sont des propositions originales pour DEADWALL. Aucun sprite, plan de ville ou fichier extrait de ces jeux n’est fourni. Les données ne constituent ni une certification de bâtiment réel ni une garantie d’équilibrage commercial.

## Livrables

`INDEX.md` : index par famille. `fiches/` : 500 fiches indépendantes. `CATALOGUE_500.json` : données structurées. `SCHEMA_CATALOGUE.json` : schéma de validation. `PROPS_GABARITS.json` : références de tailles et d’ancrages. `source/lieux.txt` et `source/generer_codex.py` : source éditable et génération reproductible. `01_CENTRE_COMMERCIAL_EXEMPLE.md` : exemple de composition détaillé. `02_PROMPT_DE_CONTINUATION.md` : consigne pour une prochaine implémentation. Le lecteur HTML est autonome et reste extérieur au jeu.


Édition 1.1 liée au jeu 1.16 : voir 03_INTEGRATION_1.16.md. La couverture actuelle est 34 plans pilotes dont 12 nouveaux, et 466 conceptions futures. Les mentions 1.15 antérieures décrivent le socle historique.


## Complément 1.18

Lire `05_RELAIS_1.18.md` avant toute évolution des stocks, du coffre, des soins ou des aménagements de contenants. La 1.18 ne crée aucun nouveau plan : les 42 liaisons pilotes et les anciennes générations sont conservées.
