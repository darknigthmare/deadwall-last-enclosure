# Régions lointaines — 1.31

Le domaine G5 mesure **24 576 × 24 576 mètres** : 603,98 km², soit neuf fois la surface du domaine historique. D-17 garde sa position (4096,4096). Les routes, parcelles et plans du carré historique [0,8192] sont conservés ; l’extension se trouve à l’est et au sud. Il n’y a ni déplacement gratuit ni téléportation vers un lieu choisi sur la carte.

Une nouvelle partie active G5 après la création de D-17. Une campagne G4 peut l’ouvrir volontairement depuis le dépôt, dans **Monde & relais → Étendre les relevés régionaux**. Ses anciens lieux, IDs, stocks prélevés, dégâts, étages et véhicules sont conservés. Les générations 1–3 conservent leur domaine historique. La taille est fournie par `world.size`, `world.bounds` et `DeadwallFrontierWorld.sizeForGeneration`; `RULES.size=8192` reste la référence historique.

## Terrain et détails

La structure légère globale contient les routes, parcelles, emprises de service et métadonnées de 512 nouveaux secteurs de 1024 m. Les centres de carrefours varient avec la graine, les voies secondaires sont espacées et les familles territoriales suivent un bruit continu. Le réseau est raccordé physiquement aux anciens axes est et sud. Les parcelles refusées ne sont pas forcées au travers d’une route ou d’une autre parcelle.

Les intérieurs sont créés à la demande (48 plans en cache LRU). Les arbres et rochers sont créés par chunks de 256 m (25 chunks en cache LRU). Une prélecture bornée à un chunk prépare les alentours et l’avant du véhicule. Les chunks historiques gardent leur tirage, leurs identifiants et leurs quantités. Seuls les arbres et rochers situés dans les deux nouveaux couloirs de raccordement sont retirés physiquement ; leurs références demeurent validables pour conserver les prélèvements antérieurs, sans remboursement ni nouveau butin. Les voies ajoutées emploient des identifiants distincts des rues historiques. La destruction, le butin et les poursuites restent dans les registres de sauvegarde indépendants ; évincer un chunk ne remplit aucun contenant et ne ressuscite aucun résident.

Les recherches de route proche utilisent une hiérarchie de boîtes englobantes, avec distances exactes aux segments. Les collisions, cônes de tir, gabarits des véhicules et seuils de quantité restent inchangés. Les groupes sauvages gardent leurs plafonds ; les détails des contacts ne sont actifs qu’à proximité. Les positions distantes n’impliquent aucun calcul détaillé de milliers de pièces en arrière-plan.

Pour la graine 17117 : 644 lieux historiques conservés, **1783 lieux au total**, 2432 segments routiers, 66 points alliés, 437 sites infestés et 636 lieux sans occupants résidents dans l’extension. 360 bâtiments lointains possèdent une réserve scellée. Ces nombres varient avec la graine ; les probabilités sont décrites et exécutées dans `world-spawns131.js`.

Un point allié représente un abri de ravitaillement, pas une colonie avec IA civile. Les camps humains hostiles restent désactivés dans le tirage livré. Les infectés résidents des lieux infestés sont ceux réellement simulés par Frontier ; les migrations sauvages peuvent toujours traverser un lieu dégagé.

## Quatre opérations jouables

| Boucle | Action physique et coût | Effet et limite |
|---|---|---|
| Relais fixes | À l’entrée d’un site allié ou certifié : 8 bois + 4 ferraille, 8 s | Réserve initialement vide de 120 unités. Dépôt et reprise conservatifs. Soins sur place : 2 vivres + 1 médicament du relais, 12 s pour 16 PV. |
| Reconquête des bâtiments | Éliminer tous les occupants de tous les niveaux, puis 3 ferraille + 1 vivre, 6 s à l’entrée | Certification persistante et possibilité d’aménager un relais. Aucune invulnérabilité ni disparition des migrations. |
| Réserves scellées | 4 ferraille, 8 s à l’entrée, puis rejoindre la caisse extérieure et maintenir E | Stock fini : 18 médicaments, 36 carburant, 72 munitions ou 48 ferraille selon l’usage du lieu. Collecte, sac et véhicule utilisent les systèmes existants. |
| Relevés des carrefours | Lire sur place le plan du secteur : 1 vivre + 1 ferraille, 5 s | Les lieux du secteur sont inscrits au carnet et deviennent sélectionnables pour le GPS. Ce relevé ne garantit pas la sûreté du trajet. |

Les opérations se font à pied, sur le bon plan, avec portée et ligne de vue, hors menace immédiate. Les mouvements, tirs, dégâts et changements de scène interrompent le travail ; une pause ne l’avance pas. Les fournitures ne sont débitées qu’au terme du travail valide. Les modules n’accordent pas de ressources lors d’une migration.

## Vérification

`tests/world131.test.cjs` couvre la préservation exacte du noyau G4, le réseau et ses accès, le cache avec éviction/reconstruction, les limites lointaines, les coordonnées d’étage, la migration volontaire, les quatre boucles, leurs coûts, l’interruption, la reprise et le refus transactionnel de registres falsifiés. Les recherches de proximité sont comparées à un oracle exhaustif sur les routes.

`profile-stream131.cjs` compare le générateur historique et le nouveau sur les mêmes dix chunks et 300 recherches. Les chiffres sont une mesure CPU Node sur une machine partagée ; ils ne sont pas une certification de FPS. Les captures de `capture-world131.cjs` utilisent les vrais peintres Canvas sur des états préparés, avec un DOM simulé : elles ne constituent pas un parcours interactif dans un navigateur.
