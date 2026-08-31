# Spécialistes de terrain — DEADWALL

Le secouriste et l’ingénieur sont des survivants physiques. Chacun occupe un logement, consomme la même ration quotidienne que les autres PNJ, peut être blessé et meurt définitivement. Ils ne sont ni des bonus globaux ni des résurrections automatiques. Les profils et les coûts sont centralisés dans `C.SURVIVORS` et `C.NPC_RULES`.

## Recrutement et équilibre

| Rôle | Conditions | Recrutement | Santé / vitesse | Soutien |
|---|---|---|---|---|
| Secouriste (`medic`) | Palier 2, clinique terminée, logement libre | 35 nourriture + 8 médicaments | 90 PV / 66 unités par seconde | 6 PV par seconde au contact, 0,025 médicament par PV réellement soigné |
| Ingénieur (`engineer`) | Palier 2, atelier terminé, logement libre | 35 nourriture + 35 ferraille | 105 PV / 62 unités par seconde | 14 PV de structure par seconde au contact, matériaux au prorata des PV réellement réparés |

Le recrutement vérifie toutes les conditions avant de prélever le coût entier. Il est autorisé pendant la partie et la pause volontaire du poste de commandement, jamais depuis les autres menus, une pause ordinaire ou une défaite. Les anciens ouvriers et fusiliers gardent leurs statistiques et coûts.

Chaque PV réparé coûte `1/45` ferraille, y compris sur le centre de commandement. Un mur en bois consomme en plus `12 / PV maximaux` bois par PV ; un mur en béton, `16 / PV maximaux` pierre. Ces proportions reprennent les matériaux de la réparation manuelle sans son arrondi par opération. Les fractions de stock sont conservées : le dernier reliquat produit uniquement la réparation qu’il peut payer, sans ressource négative, sursoin ni réparation gratuite. Un bâtiment détruit ou inachevé n’est jamais réparé par ce service.

## Comportement physique

Le secouriste cherche un allié vivant blessé dans un rayon de 800 unités. Il privilégie le pourcentage de santé le plus faible, puis la proximité ; il peut soigner le commandant, un autre survivant ou lui-même au même coût. Il ne relève pas le commandant à terre et ne ressuscite aucun PNJ. Le soin exige une distance maximale de 64 unités et un segment de contact libre de collision.

L’ingénieur cherche une structure endommagée dans le même rayon. La priorité de construction haute/normale/basse passe avant le pourcentage de santé et la proximité. Il doit rejoindre un point libre sur le périmètre de la structure, puis rester à moins de 48 unités de ce point avec un segment de contact dégagé. Il peut travailler sur la face accessible d’un rempart ; une autre enceinte fermée interdit l’intervention tant qu’aucun trajet ne la traverse.

Les deux rôles emploient la navigation alliée, les portes et le budget A* partagé de la simulation. Aucun déplacement instantané ni recherche de chemin indépendante n’est ajouté. Les tâches inaccessibles sont temporairement ignorées grâce au cache borné existant. La rotation des unités garantit que les dernières d’un groupe peuvent aussi rechercher leur trajet. Sans cible, la recherche est espacée de 0,6 seconde et les spécialistes rejoignent le ralliement.

Une menace à moins de 105 unités interrompt immédiatement le soutien et provoque une fuite vers le centre à 125 % de la vitesse habituelle. L’ordre global `retreat` s’applique aussi aux spécialistes : retour au centre, aucune intervention extérieure, aucune dépense de soutien. Les autres ordres économiques restent réservés aux ouvriers. Une éventuelle cargaison sauvegardée est déposée sans perdre les quantités que le stock ne peut pas accueillir.

La clinique conserve son système de soin de proximité préexistant, distinct de l’intervention mobile payante du secouriste.

## API, état et sauvegarde

`game.canRecruit(kind)` et `game.recruit(kind)` retournent un booléen pour les quatre profils déclarés. Les noms inconnus et les propriétés héritées d’objets ne sont pas des profils valides.

Le soutien réutilise les états `repair`, `idle`, `flee` et `return`. L’ingénieur emploie `targetBuilding`. Le secouriste emploie `targetUnit` : `-1` sans cible, `0` pour le commandant, identifiant positif pour un PNJ. La valeur `0` évite de dépendre de l’identifiant transitoire du commandant lors d’un chargement. Les cibles disparues ou mortes sont invalidées au prochain pas de simulation ; le chargement n’exécute aucune action de soutien.

`supportActive` est un booléen visuel éphémère : faux au début du pas, pendant la marche, la fuite et le repli ; vrai uniquement si des PV ont réellement été restaurés et leur coût payé ce pas. Il n’est pas sauvegardé. Les effets visuels doivent utiliser ce champ, pas seulement l’état `repair`, qui inclut le trajet vers la cible. Aucun nouveau projectile de soutien n’est créé.

## Validation

`tests/specialists.test.cjs` couvre le recrutement et ses refus atomiques, la pause tactique, logements/rations/mortalité, soins et réparations progressifs payants, stocks fractionnaires, absence de résurrection, priorité, disparition des cibles, portes fermées et trajets après ouverture, repli/fuite/ralliement, cadence de réflexion, budget de navigation partagé et roundtrip de sauvegarde.

Exécuter `node --test tests/specialists.test.cjs tests/workers.test.cjs tests/progression.test.cjs`, puis `npm run check`. Les tests de simulation ne remplacent pas la vérification navigateur des cartes de recrutement et des représentations visuelles.
