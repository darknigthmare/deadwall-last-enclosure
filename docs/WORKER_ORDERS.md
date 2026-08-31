# Ordres ouvriers et déblaiement — DEADWALL

Les ordres globaux réaffectent les ouvriers vivants, jamais les fusiliers. Ils peuvent être donnés en jeu ou depuis le poste de commandement qui suspend volontairement la simulation. Une pause ordinaire, le manuel, les paramètres, le menu et la défaite n’autorisent pas ces commandes.

## Doctrine de travail

| Ordre | Première tâche | Repli de tâche |
|---|---|---|
| `auto` | Finir la tâche valide en cours ; sinon chantier par priorité puis distance | Collecte utile, puis attente près du centre |
| `harvest` | Collecter les ressources non saturées, remplir le sac puis déposer | Chantiers s’il n’existe aucun gisement utile disponible |
| `build` | Chantiers : haute priorité avant normale/basse, distance comme départage | Collecte tant qu’aucun chantier n’est disponible |
| `clear` | Atteindre le pied extérieur d’un rempart chargé et déblayer | Attendre ; aucune collecte ou construction opportuniste |
| `retreat` | Rejoindre le centre de commandement et y déposer le sac | Rester dans son rayon de repli ; aucun travail extérieur |

Changer d’ordre conserve toute cargaison. Un sac entamé est d’abord rapporté, sauf pendant un repli où le dépôt s’effectue uniquement au centre, jamais dans un entrepôt extérieur plus proche. Un dépôt accepte seulement la place disponible et l’ouvrier conserve exactement le reliquat. La saturation peut donc immobiliser de la main-d’œuvre jusqu’à consommation du stock.

Une menace à proximité déclenche toujours la fuite défensive existante avant l’ordre économique. Les morts sont retirés de l’équipe ; une structure détruite, un chantier achevé ou un gisement épuisé invalide sa tâche sans exception ni perte de cargaison.

Un constructeur présent dans l’empreinte d’un futur rempart rejoint d’abord un point libre adjacent à sa vitesse normale. La finition ne matérialise donc pas une collision autour de lui. Si aucun accès ne permet de sortir, le chantier reste différé plutôt que de téléporter ou emprisonner l’acteur.

## Déblaiement physique

La pression des corps est attachée au rempart ; son format de sauvegarde n’identifie pas un côté individuel. Le point de travail est donc défini de manière stable sur la face opposée au centre de commandement. Pour intervenir, l’ouvrier doit atteindre ce pied extérieur par une porte praticable ou une brèche. Aucun nettoyage à travers son propre rempart ni à travers une autre enceinte n’est possible.

L’approche utilise la navigation alliée existante et ses collisions. L’action exige également un court segment de contact dégagé jusqu’au point de travail. Le même contrôle de contact empêche récolte et construction de proximité de traverser un mur fermé.

Les règles sont centralisées dans `C.WORKER_RULES` :

- `cleanupPerSecond: 0.9` unité de pression par seconde et par ouvrier au contact ;
- `cleanupRange: 48` unités autour du point de travail extérieur ;
- `retreatRadius: 90` unités autour du centre pour l’équipe repliée ;
- `passiveDecayPerSecond: 0.012` unité de pression par seconde, indépendante du nombre d’ouvriers.

L’ordre Déblayer ne réduit rien instantanément. Les cadavres décoratifs proches sont retirés graduellement à mesure que des unités de pression sont déblayées. Une équipe affectée au nettoyage cesse de rapporter ses ressources et d’accélérer les chantiers : cette diversion de main-d’œuvre est son coût stratégique. Fermer les accès peut rendre une intervention impossible, même si le compteur de pression demeure visible.

Les remparts les plus chargés et prioritaires sont favorisés, pondérés par la distance. Une cible inaccessible est ignorée temporairement afin d’essayer d’autres tâches. Le cache par ouvrier est borné à 32 échecs ; il expire après le délai de reprise A* ou un changement de géométrie/porte. Tous les trajets utilisent le budget global existant de requêtes par mise à jour, sans recherche indépendante non bornée. L’ordre de passage des unités tourne entre les mises à jour : un groupe de nettoyeurs devant une enceinte fermée ne peut pas monopoliser indéfiniment les recherches au détriment des autres ouvriers ou des soldats.

## API et sauvegarde

`game.setWorkerOrder(order)` retourne un booléen. Les cinq valeurs autorisées sont validées et la méthode respecte `game.canIssueCommand()`. Elle remet les affectations/navigation en attente tout en conservant les sacs. L’ordre est persisté par la couche de sauvegarde ; une ancienne sauvegarde reprend en `auto`.

`game.getWorkerSummary()` retourne :

- `order`, `total`, `busy`, `idle` ;
- `gathering`, `building`, `returning`, `retreating` ;
- `assignedClear` pour les ouvriers affectés au déblaiement, trajet compris ;
- `clearing` pour ceux effectivement au contact d’un rempart encore chargé ;
- `carrying` pour les porteurs et `blocked` pour les trajets actuellement sans solution.

Les champs de portage, blocage et contact se recoupent : ils ne doivent pas être additionnés pour recalculer la population. Le repli utilise l’état persistant existant `flee`, le nettoyage `clear`, les autres ordres `idle`, `gather`, `build` et `return`. La cible de rempart est `targetBuilding`. Les caches de navigation/échecs sont éphémères et reconstruits après chargement ; le point de travail extérieur est recalculé depuis le centre et la géométrie du rempart.

## Validation

`tests/workers.test.cjs` couvre commandes autorisées/refusées, priorités et replis de tâche, nettoyage graduel local, vraie traversée d’une porte après ouverture, refus de travail à travers un mur, saturation et dépôt partiel, repli au centre, fuite, morts, cibles détruites, budget A* et sauvegarde/reprise sans nettoyage instantané.

Exécuter `node --test tests/workers.test.cjs`, puis `npm run check`. La vérification de l’interface de commandement et des retours visuels reste distincte des tests de simulation.

Validation locale du 31 août 2026 : les 15 scénarios ouvriers passent ; la suite combinée ouvriers/tactiques/stratégie/récupération passe 50 tests. `npm run check` a ensuite construit les 25 fichiers publics et le standalone, puis passé 120 tests sans échec ; le scénario d’endurance opt-in est explicitement ignoré par cette commande. Ces résultats ne revendiquent ni mesure de FPS ni nouvelle vérification navigateur de l’interface de commandement.
