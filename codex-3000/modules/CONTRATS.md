# Contrats de composition — 1.26

Ce dossier complète les programmes de lieux du compagnon. Il n’est pas une nouvelle version du générateur de terrain. Un module a un identifiant permanent, une famille, un statut, une intention, une composition, des accès, des ressources, des risques, une règle nocturne, des variantes et des critères de contrôle. Les 59 modules sont partagés par le guide et les documents ; les fichiers JavaScript sont la source éditable.

## Les trois statuts

**Disponible en jeu** désigne une fonction observable du jeu livré. **Présent en partie** signifie qu’un plan ou un ensemble pilote existe, sans toutes les variantes et tous les systèmes du programme. **Projet de contenu** désigne une conception à implémenter. Copier un nom dans le catalogue ne fait jamais passer son statut à disponible.

Le guide démarre sur les contenus présents. Le joueur choisit explicitement « Présent et projets » pour les futurs milieux. Montagne, littoral, hydrographie, neige et factions humaines ne sont pas annoncés comme des régions déjà parcourables. Les camps hostiles sont des programmes spatiaux ; aucun comportement de combat humain n’est sous-entendu.

## 1. Ordre de résolution

1. Fixer la version de génération et le domaine de coordonnées.
2. Définir relief et limites réellement infranchissables.
3. Connecter axes régionaux et ouvrages de traversée.
4. Choisir la composition territoriale et les usages compatibles.
5. Réserver parcelles, voies de service, stationnement et dégagements.
6. Construire volumes, niveaux et circulations.
7. Placer pièces et zones d’usage.
8. Orienter mobilier et espaces d’interaction selon ces usages.
9. Affecter ressources, contenants et identifiants persistants.
10. Appliquer l’abandon et vérifier à nouveau les trajets.
11. Relier sources lumineuses, appareils, états et niveaux.
12. Tester le parcours complet avant d’accepter l’instance.

Aucune étape ne corrige une erreur antérieure en réduisant silencieusement la taille d’une voiture ou en déplaçant une réserve à travers une clôture. Une parcelle refusée est préférable à une sortie obstruée. Les plages métriques du compagnon sont des choix de jeu, pas des normes de bâtiment réel.

## 2. Interfaces entre modules

Chaque composition publie une entrée publique, un accès de service si son usage le demande et au moins un parcours de retour. Un passage volontairement unique est identifié comme tel dans ses risques. Une issue dessinée, une ouverture de collision et une connexion du graphe décrivent le même vide. Un accès ne devient pas carrossable parce qu’un véhicule a été posé de l’autre côté.

Les coutures utilisent les coordonnées du réseau parent. On ne tire pas une route indépendamment dans deux chunks voisins. Réserver d’abord un corridor large du maximum des gabarits acceptés, puis les colliders des bords. Les rayons des personnages, rotations des véhicules et dégagements des actions sont vérifiés séparément.

Une forêt utilise des troncs physiques et une canopée visuelle. Une maison peut avoir un toit débordant sans étendre son mur. Une rangée de voitures applique la transformation de chaque châssis ; le centre visuel d’une place ne vaut pas validation géométrique. Les fils, herbes, traces et marquages non bloquants ne reçoivent pas de collision par défaut.

## 3. Programme et capacité

La composition additionne les surfaces effectivement choisies : pièces, murs, circulations, niveaux, escaliers et locaux techniques. Elle ne combine pas toutes les répétitions maximales d’un programme dans sa parcelle minimale. Réduire une variante consiste à choisir un programme explicitement plus petit ; cela ne consiste pas à retirer la réserve, le couloir ou l’issue nécessaires au fonctionnement.

Un centre commercial exige espace public, arrière de boutique, réception et livraison. Une mine exige entrée, branches accessibles et zones interdites identifiées. Un camp exige couchage, stockage, passage et contrôle d’accès. Une métropole exige districts et hiérarchie de réseau avant sa densité de parcelles. Ces dépendances priment sur le nombre d’objets produits.

Les nouveaux programmes du compagnon sont des compositions dérivées. Ils citent leur fiche parent et un module territorial, puis ajoutent un état causé : évacuation, récupération antérieure, arrêt de service ou occupation future. Un dérivé n’est pas une architecture indépendante reconstruite manuellement ; son programme complet est l’union explicite de son parent et de ces prescriptions.

## 4. Budget de ressources et persistance

Une ressource appartient à un usage et à un contenant. Définir un budget du lieu avant de distribuer ses quantités. Les variantes d’abandon déplacent ou réduisent des réserves existantes ; elles n’ajoutent pas un second budget caché. Le doublement des contenants ne double pas la richesse totale. Les pièces vides ont une fonction de circulation ou de récit.

L’identifiant persistant comprend génération, lieu, niveau et objet. Une variante future ne remplace jamais sous le même identifiant une instance déjà fouillée. Les caches de géométrie peuvent être reconstruits ; les quantités prises ne sont pas recalculées. Ouvrir la carte, afficher une fiche, changer d’étage ou sortir de la zone ne consomme pas le générateur aléatoire du combat.

Garder séparés stocks de cité, charge du joueur, coffre, kits et dispositifs posés. Une action de soin régionale ne doit pas dépenser silencieusement des médicaments restés au dépôt. Une lumière éteinte ou épuisée ne redevient pas pleine lors d’une reprise.

## 5. Contrat nocturne

Une lumière porte une position, un domaine, un niveau, un type, un état et une source d’énergie. Les objets portés suivent le porteur ; les objets posés gardent leur position. L’énergie, le combustible, la durée, la récupération et le coût d’usage dépendent du système réellement livré, jamais d’une phrase de décor.

Séparer visibilité, chaleur, dégâts, bruit et propagation. Un feu peut uniquement fournir de la lumière si telle est sa fonction implémentée. Ni incendie ni immunité aux infectés ne s’ajoutent par implication. Les flammes se placent dans une zone d’usage dégagée ; les appareils électriques dans un contexte de maintenance ou d’occupation. Une ampoule décorative n’alimente pas un quartier.

Les objectifs lumineux sont entrées, tâches et retour. Préserver une variation entre zones sombres et actives. Le halo doit respecter la géométrie disponible et le niveau ; il ne se copie pas à travers un étage. Limiter le nombre de sources évaluées à la vue active et vérifier qu’un ajout n’écrase pas les silhouettes du joueur et des infectés.

## 6. Matrice d’acceptation

| Axe | Preuve minimale avant intégration |
|---|---|
| Implantation | Pas de recouvrement route/parcelle réservée ; limites et gabarits vérifiés |
| Accès | Trajet entrée–usage–contenant–sortie pour chaque niveau |
| Navigation | Joueur, allié et infecté cohérents devant le même solide |
| Véhicule | Accès et demi-tour selon profil, sans raccourci piéton implicite |
| Ressources | Conservation du budget et quantités finies avant/après reprise |
| Nuit | Source explicable, état unique, bonne position et bon étage |
| Rendu | Pied de profondeur correct, interaction identifiable, silhouette lisible |
| Sauvegarde | Anciens IDs préservés, refus transactionnel de données invalides |
| Performance | Travail borné dans le secteur visible ; cache et entités plafonnés |
| Présentation | Texte décrivant la portée réellement livrée, limites visibles |

Ces contrats demandent des tests du comportement, pas seulement la présence de champs. Les contrôles du catalogue prouvent les liens entre fiches et la qualité structurelle des données. Ils ne prouvent pas que 3 000 lieux existent dans le monde ni que leurs collisions ont été simulées.
