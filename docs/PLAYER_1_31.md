# Commandant — préparations personnelles 1.31

Quatre boucles jouables complètent les bivouacs, pansements, repas et éclairages déjà présents. Les préparations s’ordonnent dans **Commandement → Opérations → Préparation du commandant**. Le personnage doit être physiquement à pied devant un dépôt accessible de D-17, dans un voisinage dégagé d’infectés. Un ordre ne téléporte aucun matériel. Il commence une intervention immobile ; les matériaux sont prélevés seulement après son achèvement en temps de jeu.

| Préparation | Coût / durée | Effet réel | Limite / contrepartie |
| --- | --- | --- | --- |
| Gilet de fortune | 18 ferraille, 3 nourriture / 10 s | Absorbe 30 % des dégâts reçus par le commandant, dans D-17 et en région | 45 dégâts absorbables au total ; course 15 % plus coûteuse en endurance ; 4 kg portés ; aucun effet sur les véhicules |
| Entretien de l’arme équipée | 4 ferraille, 1 carburant / 8 s | Huit prochains rechargements de cette arme 15 % plus courts | Une utilisation consommée au début du rechargement, même s’il est interrompu ; ne change ni dégâts, ni cadence, ni munitions ; le rechargement actif reste utilisable |
| Cartouchière personnelle | Transfert de 36 munitions au plus / 5 s | Réserve dédiée portée et dépensée lors des rechargements | Financement réel par le dépôt ; 36 unités maximum ; 20 g par unité + pochette de 250 g ; aucun transfert à distance |
| Boîte d’outils consommables | 10 ferraille, 6 bois / 9 s | +50 % de travail lorsque le commandant construit réellement au contact avec E | 30 secondes de travail supplémentaire, soit 60 s d’usage manuel ; coût initial du bâtiment conservé ; aucun bonus aux ouvriers, à la fouille ou au travail automatique |

La cartouchière corrige aussi une incohérence logistique : loin d’un dépôt accessible, le commandant recharge uniquement depuis sa réserve et son sac. Les défenses autonomes continuent de consommer leurs stocks habituels. Devant un dépôt, le rechargement peut également prendre les munitions de ce dépôt. Priorité : cartouchière, sac, puis dépôt accessible. Le bouton de retour des munitions respecte la place encore libre au dépôt et conserve le surplus sur le joueur.

Une armure entièrement épuisée n’absorbe plus rien et demande un remplacement payé. Les outils consommés ne sont pas remboursables. Refaire un entretien ou remplacer un gilet entamé applique le coût complet affiché. Les repas de bivouac gardent leur réserve d’endurance séparée ; ils ne rendent pas gratuite la charge du gilet.

Les pauses et menus suspendent les interventions. Un déplacement, un tir, une recharge, un changement d’arme ou une blessure les interrompt sans prélever les fournitures. Une reprise annule une préparation inachevée. Elle conserve exactement les munitions, la protection, les outils et usages d’entretien déjà obtenus.

## Contrat technique

`src/player-pack131.js` expose `game.playerOps131`. L’enregistrement `expansions127.modules.player131` reste additif et utilise le cycle transactionnel commun. Une ancienne sauvegarde reçoit un état vide ; aucun objet ou bonus gratuit n’est distribué. Les objets, clés, valeurs finies, limites et compteurs d’entretien entiers sont validés avant mutation du monde.

- `preview(kind)`, `begin(kind)`, `cancel()`, `step(dt)` gèrent les préparations.
- `reloadAvailable()` et `spendReload(amount)` partagent les propriétaires de stocks existants et la seule réserve dédiée ; le prélèvement est atomique.
- `absorbDamage(amount)` intervient après les gardes de mort, d’invulnérabilité et de véhicule, avant les dégâts réels.
- `constructionFactor(dt)` est appelé uniquement dans l’action manuelle de construction effectivement choisie par le moteur.
- `equipment()` retourne les objets réellement présents et leur masse, sans miroir de quantités dans l’inventaire.
- `overview()`, `actions()` et `busy()` alimentent le registre d’opérations existant.

Les lectures inactives du module n’engendrent pas le monde régional. Le chemin de simulation sans préparation en cours n’inspecte aucun catalogue de lieux. Les gardes spatiales régionales ne sont nécessaires que lorsque le joueur cherche à préparer du matériel ; cette opération reste réservée à D-17.

Les tests dédiés couvrent les coûts, limites, interruptions, pause de commandement, dégâts locaux/régionaux, endurance, recharge réelle, conservation des munitions, construction, reprise, validation transactionnelle, masses et conflits d’intervention. Les résultats intégrés et les limites de vérification sont consignés dans le rapport de livraison.
