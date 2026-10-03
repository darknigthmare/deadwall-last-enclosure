# DEADWALL 1.41 — Territoires et exploration

Extraire le ZIP complet et ouvrir `DEADWALL_Standalone.html`. La version web et les sources sont également incluses. Continuer reprend la génération de la sauvegarde ; Nouvelle partie crée un territoire G7. Aucune ancienne campagne n’est redistribuée au chargement.

## Monde cohérent par graine

G7 garde une région de 24,576 kilomètres de côté. D-17 prend une position déterministe propre à chaque graine, dans une zone centrale élargie ; plus de 5,5 kilomètres de terrain restent accessibles dans chacune des quatre directions sur l’échantillon contrôlé. Les quatre accès partagent la même projection que les collisions, plans, atlas et annexes. Les rues varient en orientation, décalage et longueur, avec un réseau raccordé aux agglomérations et aux quatre limites.

Les 34 agglomérations reçoivent un programme selon leur taille. Un hameau a logement, alimentation et entretien ; les villages ajoutent soins et lieu civique ; les bourgs et villes ajoutent école ou bibliothèque. Sur onze graines contrôlées, 374 agglomérations sur 374 possèdent leurs rôles requis ; les 62 programmes de bâtiments existants restent représentés. La présence d’un atelier ou commerce signifie un lieu visitable et ses réserves finies, sans économie marchande automatique. Les spécialisations naturelles lisent le biome réel après recul de la parcelle. Les nouvelles réservations protègent chaussées et dessertes contre les parcelles voisines.

## Nature et exploration

Les douze biomes de climat existants restent la base. Neuf communautés G7 y composent prairie, bosquet, futaie, clairière, pierrier, roselière, terre humide, rangs de verger et reprise de friche. Arbres, minéraux et petit décor suivent ces champs continus. Les essences se regroupent en voisinages ; un verger conserve des alignements agricoles. Les IDs et réserves sont déterministes et finis. Le guide ajoute neuf fiches dérivées, pour 115 entrées de biomes, essences, minéraux et communautés ; le nouveau compagnon 1.41 s’appuie sur ces règles réelles.

Les sols ont des détails et transitions continus, partagés avec D-17 ; la caméra ne tire pas de nouvel aléatoire. Les nouveaux roseaux et branche tombée sont des décors passables, sans stock caché ni collision invisible. Le chargeur commun contient 53 images, dont 37 images individuelles ajoutées depuis 1.36. Les espèces locales G7 utilisent les coordonnées régionales et les mêmes pools, sans modifier la quantité récoltable ni le rayon physique historique.

L’atlas cadrait auparavant sa première ouverture comme une région de 8 kilomètres ; il couvre maintenant l’emprise réelle. Les labels restent dans le canvas et n’écrasent plus la règle. Le carré sombre de D-17 est raccordé au fond du biome. Inspection et noms de milieux viennent de la graine courante. Le carnet peut préparer une tournée par biome parmi les lieux réellement repérés, avec accès et distances routières. L’origine d’un commandant régional à pied est sa position réelle, et les retours introuvables sont signalés.

## Préservation et preuves

Les empreintes historiques G1–G6 sont comparées à la 1.40 pour routes, parcelles, plans et contenus de chunks. Les anciens contenants et quantités ne sont pas recalculés. Les nouvelles variantes miroirs G7 partagent leurs plans entre dessin, murs, escaliers, mobilier, interventions et butin. Les tracés GPS sont des copies, ce qui empêche leur édition de modifier le graphe interne.

Les rapports spécialisés `MONDE_1_41.md`, `reports/1.41.0/BIOMES_1_41.md`, `EXPLORATION_1_41.md`, `ATLAS_EXPLORATION_1_41.md` et les preuves `reports/1.41.0/` détaillent les contrôles. `verification141.json` donne le résultat final de `DEADWALL_SOAK=1 npm run check` sur sources figées. Les parcours de récolte, dépôt, construction, vague, véhicule, frontières et reprise sont vérifiés sous l’ordre réel des scripts HTML, avec document simulé. Les captures utilisent les vrais peintres Canvas natifs.

Le rendu CSS et le tactile dans un navigateur réel, l’audio et les FPS GPU ne sont pas certifiés. Aucun déploiement ou nouveau binaire natif n’est livré. L’échelle compacte historique des véhicules locaux reste à harmoniser. Relief montagneux, hydrographie bloquante, neige et comportements de factions humaines ne sont pas ajoutés par ces communautés naturelles. Les contrôles sur un échantillon de graines ne prouvent pas toutes les graines possibles.
