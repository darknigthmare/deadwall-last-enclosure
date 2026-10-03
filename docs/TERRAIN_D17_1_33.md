# D-17 et terrain — 1.33

## Ce qui change réellement

Les nouvelles campagnes sauvegardent `exploration125.layoutRevision: 3`. La graine choisit indépendamment l’écartement des quatre collectrices, les parcelles occupées, la position des stations et des maisons, les cours, les accès, les épaves et les petits décors. Il ne s’agit plus de quatre rotations d’un plan identique. Le dépôt garde son ancrage de simulation et sa couture régionale : ses abords changent, pas l’origine des coordonnées de la colonie.

Les quatre branches principales rejoignent une desserte autour de la dalle centrale. Elles ne traversent plus le poste de commandement. Trois hameaux possèdent chacun deux rangées de trois bâtiments et une rue reliée à une collectrice. La septième maison historique, qui pouvait occuper la rue, n’est pas placée dans cette nouvelle génération. Quatre stations gardent une boutique ouverte, leurs meubles et leurs réserves finies. Le nombre de maisons à cour dépend des parcelles réellement disponibles. Les maisons dont l’emprise couperait une chaussée sont refusées.

La géométrie unique du plan sert toujours aux collisions, au coût de navigation, au rendu local, à sa projection depuis la région et aux cartes. Les routes de D-17 sont des voies de desserte à l’échelle du dépôt, pas des autoroutes miniatures. Les chemins de terre, les accès empierrés et les aires béton ont leur apparence et leur surface de déplacement. Les anciens plans restent lisibles.

## Densité et économie

`DeadwallCore.TerrainRules133` centralise la rétention initiale de 62 % des dépôts naturels ordinaires, l’espacement de 70 unités et la zone proche de 850 unités. Deux dépôts par type initial (bois, ferraille, pierre, nourriture, carburant) sont protégés de cette réduction. Les autres réserves sont espacées hors du noyau central, plutôt que déplacées en amas sur ses bords. Les stocks du dépôt, les coûts et les rendements de récolte ne changent pas.

Cette raréfaction concerne seulement les nouvelles campagnes en plan 3. Les dépôts non retenus restent dans le registre avec quantité nulle : ils ne réapparaissent pas au chargement et leur identifiant ne change pas. Les objets déjà récoltés sont pris en compte lors de la disposition des voisins, pour éviter qu’une recharge redistribue la végétation. Les quantités sauvegardées gardent l’autorité à la reprise.

Pour la graine 17117, les tests constatent une diminution d’environ 30 % du nombre total de ressources actives, en incluant les décors récupérables et réserves de stations qui ne sont pas raréfiés. Le réglage de 62 % concerne les dépôts ordinaires non protégés, pas toute la population d’objets. Ces mesures automatisées ne remplacent pas plusieurs campagnes humaines d’équilibrage.

## Routes dégagées et décors

Le placement local écarte troncs, feuillages, pierres et gisements des routes, chemins, rues des hameaux et entrées. Les arbres brûlés du catalogue de décors sont également concernés. Les accès des stations et l’emprise des habitations restent dégagés.

Dans la région, un index spatial couvre désormais la longueur complète de chaque accès privé, y compris la portion située hors de la réserve rectangulaire du bâtiment. Les arbres et rochers déjà tirés par le générateur sont filtrés après leur génération : aucun nombre aléatoire supplémentaire n’est consommé, aucun identifiant ni rendement historique n’est changé. Les éléments retirés restent dans `chunk.cleared` pour valider les prélèvements des sauvegardes antérieures. Le feuillage est aussi tenu en retrait des chaussées publiques. Le cache reste limité à 25 chunks.

Soixante-dix petits décors par plan ajoutent regards, grilles d’écoulement, fissures, papiers, touffes d’herbe, souches, bornes et bancs. Les bancs ont une emprise solide et un ordre de profondeur calés sur leurs pieds ; les marques au sol restent au sol. Ces éléments n’offrent aucune ressource et n’ajoutent pas de boucle de simulation. Les éléments hauts évitent également les rues et raccords des hameaux.

## Compatibilité et validation

Une sauvegarde sans révision garde le plan 1 ; une sauvegarde indiquant la révision 2 garde les quatre orientations historiques. Aucun changement automatique de géométrie bâtie n’est appliqué à ces campagnes. La révision 3 est validée avant le remplacement du monde ; une révision future inconnue est refusée. Le format général reste v20 et le champ de plan existant porte cette évolution.

Les tests couvrent 128 graines de routes et d’emprises, les raccordements, les ressources de démarrage, la récolte suivie d’une sauvegarde/reprise, les deux anciens plans, le refus transactionnel des révisions inconnues et les accès régionaux encombrés avant correction. Les tests régionaux G5 conservent la comparaison exacte des IDs et quantités, tout en reconnaissant les nouveaux éléments retirés des accès. Les captures éventuelles utilisent le vrai peintre Canvas avec un DOM simulé ; elles ne certifient pas le rendu navigateur, les FPS GPU ou une campagne humaine.
