# DEADWALL — audit commercial et correctifs stratégiques

Périmètre : simulation Canvas existante, identité zombie réaliste, construction concentrique, économie, population, défense, recherche, crises, sauvegardes additives v2 et livraison autonome. Cette note décrit des comportements inspectés et testés ; elle ne constitue pas une certification commerciale exhaustive ni une mesure de performance sur toutes les machines.

## Les cinq défauts stratégiques prioritaires

| Priorité | Défaut reproductible avant correction | Correction livrée | Vérification |
| --- | --- | --- | --- |
| P1 | Un ouvrier passe en retour dès la première fraction de ressource récoltée : son sac de 10 unités n'est jamais rempli. | Poursuite de la récolte jusqu'au sac plein ou au gisement épuisé ; conservation du type récolté et des cibles sauvegardées. | Un ouvrier immobile au gisement récolte exactement 10 unités en douze pas de 0,25 seconde. |
| P1 | Un dépôt presque plein efface toute la cargaison de l'ouvrier ; une manufacture pleine continue à dépenser de la ferraille. | Dépôt partiel conservant le reliquat porté, sélection de ressources non saturées, production et consommation proportionnelles à la capacité réellement disponible. | Stock à 499/500 et sac de 10 : une unité déposée, neuf conservées ; munitions à 500 : aucune ferraille consommée. |
| P1 | Les alliés n'ont pas de chemin vers les portes : déplacement direct puis glissement latéral, insuffisant pour plusieurs enceintes. | Recherche de chemin cardinale A* bornée, routes mémorisées par unité et invalidées par modification des structures ; les murs restent infranchissables. | Traversée réelle de deux enceintes à portes opposées ; fermeture d'une porte invalide la route sans téléportation. |
| P1 | La file de horde contient une chaîne par infecté et est intégralement sérialisée, même quand la population simultanée est plafonnée. | Compteurs par profil (huit depuis l'extension de contenu) et tampon de 64 apparitions maximum ; composition et nombre total conservés. | Vague 1000 : file et compteurs sérialisés en moins de 1 500 caractères ; composition exacte d'une vague entièrement consommée. |
| P1 | Les textes `choiceA`/`choiceB` des crises ne sont jamais proposés ; seuls des malus automatiques existent. | Deux décisions réelles avec coûts, conditions et conséquences ; délai sauvegardé de 45 secondes, réponse B gratuite par défaut, délestage temporaire réellement simulé. | Coûts exacts, refus sans ressources/logements, absence de double application, délai et rendement industriel testés. |

Un verrou supplémentaire interdit de tracer un mur avancé si la cité a perdu le palier requis après sélection de l'outil. L'amélioration d'un mur exige désormais un chantier terminé. Le bonus de nettoyage à distance lié au nombre d'ouvriers est supprimé : seule une lente érosion passive subsiste sans intervention locale.

Une seconde passe a reproduit un piège à intégrité négative restant opérationnel lorsqu'il tuait son dernier infecté avant son propre traitement de destruction. L'usure passe désormais par le traitement commun des dégâts : piège et infecté peuvent être détruits pendant le même pas, chacun une seule fois.

Le coût affiché du fusilier inclut les 10 ferrailles réellement débitées. Une doctrine verrouillée annonce son prochain palier au lieu de prétendre que toutes les recherches sont terminées. La bibliothèque reste consultable sans ressources ; chaque achat conserve ses conditions. La jauge d'alerte reconnaît les 15 secondes de reconnaissance et reste bornée entre 0 et 100 %. L'objectif d'électrification exige effectivement un générateur terminé et du carburant. L'objectif des douze segments annonce la préparation d'une enceinte ; un diagnostic topologique distinct vérifie maintenant la fermeture autour du centre.

## Décisions de crise

| Crise | A : intervention financée | B : réponse de secours, sans coût matériel préalable |
| --- | --- | --- |
| Noir électrique | 12 carburant et 8 ferraille : réseau stabilisé. | Rendement des industries électriques divisé par deux pendant 60 secondes. |
| Blessés aux portes | 6 médicaments et 12 nourriture : un ouvrier, moral +4 ; une place de logement nécessaire. | Accueil différé, aucun recrutement, moral −5. |
| Munitions humides | 8 carburant et 10 ferraille : réserve sauvée. | Perte de 18 munitions au maximum. |
| Fissure dans l'enceinte | 20 bois, 15 ferraille et 10 pierre : restauration de 20 % de l'intégrité maximale du mur concerné. | Déblaiement de 18 corps ; perte de 12 % d'intégrité maximale, sans destruction automatique du mur. |

Le chronomètre n'avance pas pendant la pause. Les décisions sont accessibles depuis le HUD actif ou la section ENCEINTE du poste en pause tactique, jamais derrière les autres modales. Une décision refusée ne consomme rien ; une décision acceptée ne peut être exécutée une seconde fois. Les effets encore actifs persistent au changement de vague.

## Compatibilité des sauvegardes

- Version maintenue à 2 : ajouts de champs, sans changement des bâtiments ou ressources existants.
- `pendingSpawns` contient les compteurs ; les anciennes listes `spawnQueue` restent reconnues et sont converties sans perdre de contacts.
- Les sauvegardes conservent la cargaison et les cibles de travail des unités ainsi que l'état de crise et son délai.
- Une ancienne crise sans état de décision est considérée déjà appliquée : aucune pénalité historique n'est répétée à la reprise.
- Les routes de navigation sont des données temporaires, recalculées après chargement ; elles ne gonflent pas la sauvegarde.

La validation transactionnelle, la récupération du backup, les erreurs de stockage et la conservation de l'état du commandant à terre font l'objet des tests de récupération dédiés. Ne pas considérer un simple JSON syntaxiquement valide comme une sauvegarde jouable.

Le retour au menu est refusé lorsqu'une partie vivante ne peut pas être sauvegardée : elle reste en mémoire, en pause et exportable depuis les paramètres. Cela évite que la fermeture PC depuis le menu contourne l'avertissement de sauvegarde et perde silencieusement les dernières actions. Une partie déjà perdue peut toujours revenir au menu ; la fermeture native conserve son choix explicite de quitter malgré une sauvegarde non confirmée.

## Économie, progression et limites constatées

La capacité de stockage est un plafond **par ressource**, pas une capacité totale partagée. Le centre initial offre 500 unités de chaque ressource : les coûts unitaires de tous les bâtiments et doctrines existants sont finançables. Les très longues lignes de murs restent atomiques : elles nécessitent un stockage suffisant ou plusieurs tracés. Ce choix est conservé, sans chantier gratuit ni suppression des coûts.

Les portes proposent trois modes réellement simulés et sauvegardés : automatique pour les alliés, ouverte pour tous, verrouillée pour les deux camps. Une fermeture occupée est refusée. Le champ de flux, les routes alliées et le diagnostic de périmètre suivent les changements. La fermeture structurelle ne garantit ni l'intégrité ni la résistance aux rampes de corps. Aucun nombre fictif d'anneaux n'est affiché. Voir [TACTICS.md](TACTICS.md).

Les six doctrines sont achetables une seule fois et produisent des effets mesurés sur collecte/construction, résistance des murs, dégâts des défenses, corps, énergie et annonce des vagues. Leur bibliothèque permet de choisir librement parmi les doctrines du palier atteint ; la recherche reste instantanée, sans branches exclusives ni chronomètre artificiel. Les descriptions n'annoncent plus de bonus de stockage ou de soins absents du moteur. Les trois difficultés modifient réellement la réserve initiale, la collecte, le temps calme, le nombre, la santé et les dégâts des infectés. Les scénarios automatisés valident ces règles, pas un équilibre de longue durée avec un panel de joueurs.

Les ouvriers ont cinq ordres collectifs : autonomie, récolte, chantiers, déblaiement et repli. Le nettoyage exige un trajet réel vers la face extérieure du mur ; un verrou peut le rendre inaccessible. Le budget A* est distribué équitablement dans le groupe et les cibles inaccessibles sont temporisées. Un chantier ne se solidifie plus autour d'un acteur vivant ; son constructeur sort physiquement de l'empreinte. Voir [WORKER_ORDERS.md](WORKER_ORDERS.md).

Les records locaux et les dix dernières campagnes sont persistants, avec copies de secours et gestion de quota. La graine reproduit le terrain et les gisements, pas une simulation de combat compétitive déterministe. Aucun bonus permanent ni synchronisation en ligne n'est ajouté. Voir [REPLAY_RECORDS.md](REPLAY_RECORDS.md).

Le plafond simultané d'infectés est maintenu ; la croissance des vagues reste surtout une croissance de nombre, de fronts et de durée, sans inflation illimitée des points de vie. Les tests de vague 1000 vérifient le stockage et la composition, **pas** la possibilité d'équilibrer ou de jouer effectivement mille vagues sur tout matériel.

Les véhicules illustrés ou les épaves récupérables sont des éléments du monde, pas un système de conduite : pas de véhicule pilotable, transport de groupe ou physique automobile livré par ce lot. Les routes alliées respectent les enceintes mais ne simulent pas l'évitement individuel des foules ; un itinéraire trop complexe peut dépasser le budget A* et sera retenté après délai. Un maximum de six recherches de 8 192 nœuds chacune est autorisé par mise à jour des unités ; les autres alliés attendent le tour suivant sans franchir les murs.

## Validation reproductible

- `node --test tests/core.test.cjs tests/strategic.test.cjs` : règles pures et scénarios stratégiques.
- `npm run check` : syntaxe, build autonome et ensemble des tests.
- `tests/strategic.test.cjs` couvre sacs, stockage, consommation, portes opposées, fermeture d'enceinte, grande file de horde, coûts et délais des crises, perte de palier.
- `tests/progression.test.cjs` couvre les trois difficultés, les six doctrines et leurs achats atomiques, les actions de recrutement/amélioration/réparation/démolition, les libellés de recherche, la jauge de reconnaissance, le carburant du tutoriel et la destruction des pièges.

Les essais navigateur, distribution PC, PWA réelle hors ligne, captures de performance et état de publication doivent être rapportés séparément avec leurs résultats réellement observés.

La suite `tests/browser-command.mjs` couvre le nouveau poste sur six formats, les onglets au clavier, le temps suspendu, les commandes, la reprise, les archives, les graines et le hors-ligne. Elle injecte une enceinte et des réserves pour exercer les mécanismes, sans prétendre jouer une campagne normalement.
