# Architecture technique

## Extension des âges — 1.50

`core.js` expose `CityContent150` (20 définitions, six évolutions de même emprise et quatre plans), `Infrastructure.SURFACES` et les recettes/formations dans les règles historiques. Les contrôleurs existants assurent les paiements, travaux, productions, soins, tirs et batteries. Une évolution reste instantanée et payée ; elle ne réinitialise pas la santé. Les registres de voirie/montages/formations acceptent les identifiants nouveaux avec contrôle strict ; les routes historiques à trois champs conservent leur état et leur avantage.

`city-catalogue150.js` dérive le catalogue des vraies règles. `city-catalogue-ui150.js` l'affiche dans Préparatifs et n'effectue aucune transaction. Le contenu caché ne déclenche pas de boucle de rendu supplémentaire. `d17-art150.js` associe 20 rectangles mesurés à quatre atlas originaux ; son dernier raccord intervient après les peintres historiques pour afficher les batteries du nouveau catalogue. Les cartes ne mémorisent pas les positions des ennemis ; la tour nouvelle utilise le service de visibilité physique existant.

## Objectif de la version actuelle

Le moteur est un Canvas 2D/2.5D avec interface HTML/CSS et simulation JavaScript. Le joueur utilise soit l'application Windows Electron autonome, soit la PWA, soit le fichier HTML autonome. Aucun service réseau n'est requis pour une partie locale. Le développement web utilise un build Node.js sans dépendances externes ; fabriquer le paquet Windows exige les outils Electron verrouillés par le lockfile. Ce n'est pas un port 3D natif.

## Fichiers principaux

### `src/core.js`

Module UMD chargé dans le navigateur et testable avec Node.js. Il contient :

- constantes du monde ;
- métadonnées des ressources ;
- difficultés ;
- paliers de cité ;
- catalogue des bâtiments ;
- profils ennemis ;
- armes ;
- objectifs ;
- fonctions d’économie ;
- formule des vagues ;
- générateur pseudo-aléatoire ;
- tas minimum pour le pathfinding.

Toute valeur d’équilibrage doit rester dans ce fichier lorsque cela est possible.

### `src/game.js`

Contient les objets de simulation et le contrôleur principal :

- `Building`, `ResourceNode`, `Unit`, `Zombie`, `Projectile`, `Particle` ;
- `AudioSystem` ;
- `WorldMap` et grille d’occupation ;
- `FlowField` ;
- `Game` ;
- entrée d’application et exposition `globalThis.DEADWALL`.

### Modules spécialisés

| Module | Responsabilité |
| --- | --- |
| `src/scenarios.js`, `src/scenario-ui.js` | Quatre départs à contreparties, choix et aperçu de leurs conditions initiales. |
| `src/squads.js`, `src/squad-ui.js` | Trois sections, ordres/ralliements et interface de commandement. |
| `src/battlefield.js`, `src/battlefield-ui.js` | Contacts par front, proximité du centre et débrief factuel. |
| `src/narrative.js` | Traces originales, chapitres et validation stricte du registre ; aucun gain au chargement. Chargé après core et avant save. |
| `src/narrative-ui.js` | Journal facultatif, relevés et choix affichés ; transactions uniquement dans Game. |
| `src/save.js` | Validation et migration transactionnelles de sauvegardes avant mutation du monde. |
| `src/tactics.js` | Portes, collisions et diagnostic topologique du périmètre. |
| `src/profile.js` | Records locaux, identités de campagne et historique borné, sans bonus permanent. |
| `src/world-content.js` | Six sites et 48 décors récupérables déterministes, RNG séparé des gisements historiques. |
| `src/art.js` | Catalogue de dix atlas/textures, découpe, matte décodée une fois et animation. |
| `src/ui.js`, `src/command-ui.js`, `src/content-ui.js`, `src/narrative-ui.js` | Paramètres/import, pause tactique, dossiers de terrain et récit. |
| `desktop/` | Protocole local, sandbox, profil persistant et QA de l'application Windows. |

`scripts/build.mjs` définit la liste publique explicite, copie les fichiers dans `dist` et intègre scripts/styles/images au standalone. Le serveur et le protocole PC refusent les fichiers de pilotage. `.vercelignore` réduit les fichiers envoyés au build distant ; ce n'est pas une règle d'autorisation HTTP. Le test de distribution reconstruit le jeu dans un dossier sans `node_modules` et compare build, cache PWA et protocole PC.

## Boucle de simulation

La boucle `requestAnimationFrame` limite le pas à 40 ms pour éviter les bonds de simulation et suspend les mises à jour quand le jeu est en pause. Le rendu reste actif. Un test qui appelle directement `update(dt)` avance bien la simulation même si la boucle automatique est en pause. L’ordre est :

1. temps, météo, entrées ;
2. directeur de vague ;
3. recalcul éventuel du champ de flux ;
4. index spatial des zombies ;
5. joueur ;
6. bâtiments ;
7. unités ;
8. zombies ;
9. projectiles ;
10. effets ;
11. économie ;
12. métriques de cité et objectifs ;
13. sauvegarde, HUD et minimap ;
14. caméra.

## Monde et occupation

- taille : 128 × 128 cellules ;
- cellule : 32 unités ;
- monde : 4096 × 4096 unités ;
- `Int32Array` d’occupation pour accéder rapidement à une structure ;
- gisements générés en grappes depuis une graine ;
- zone centrale dégagée et ressources de départ garanties.

Les seize types de décors des six sites sont passables et récupérables : ils ne constituent pas des murs ou un couvert physique. Leur ajout conserve les IDs des gisements historiques ; une ancienne construction superposée les épuise à la reprise. La graine reproduit la carte, pas un défi compétitif synchronisant tous les inputs.

## Champ de flux

Le champ est invalidé après les changements de structures, d'achèvement ou de modes de portes. Un Dijkstra pondéré calcule le coût de chaque cellule vers le centre. Chaque zombie lit ensuite le voisin de coût inférieur, avec une faible variation individuelle. Le Traqueur peut dévier vers un allié isolé visible, avec scans bornés et contrôle physique des accès.

Cette approche coûte davantage lors d’une construction, mais rend le déplacement de centaines de zombies très léger pendant les vagues.

Les alliés utilisent une recherche A* cardinale distincte : au plus six recherches de 8 192 expansions par mise à jour, cache de route invalidé avec le monde, délai de reprise 1,25 seconde et répartition des tentatives dans le groupe. Cela ne constitue pas un système d'évitement individuel des foules.

## Performance des hordes

- maximum de 720 zombies simultanés (`PERFORMANCE_LIMITS.zombies`) ;
- dix compteurs de contacts en attente et tampon d'apparition de 64 entrées ;
- grille spatiale de 160 unités pour les recherches de cibles ;
- maximum de 900 cadavres visuels, également retirés après 100 secondes ; la pression sauvegardée des remparts est une donnée distincte ;
- maximum de 950 particules et 85 sources lumineuses ;
- rendu seulement des entités dans la zone visible ;
- minimap rafraîchie à fréquence réduite ;
- métriques urbaines et interface mises à jour moins souvent que la simulation.

Le mode n'a pas de dernière vague scénarisée ; les nombres restent toutefois bornés par la représentation numérique et la validation des sauvegardes. Le plafond simultané transforme les grandes vagues en pression prolongée. Ces limites techniques ne certifient ni une cadence d'images sur tout matériel ni l'équilibrage d'une campagne extrême.

## Sauvegarde

La sauvegarde versionnée contient :

- difficulté, graine et condition de départ ;
- ressources ;
- joueur et chargeurs ;
- structures, intégrité, progression et pression des corps ;
- unités ;
- zombies actifs ;
- état des gisements ;
- directeur de vague ;
- cycle journalier et météo ;
- moral, points de ralliement et ordres des trois sections, statistiques et objectifs ;
- registre narratif et décisions uniques.

La version 2 conserve une copie de secours et accepte la migration v1. Les compteurs de horde, ordres, modes de portes, doctrines, crises et états de spécialistes sont additifs. Les routes temporaires sont recalculées. Le profil de records utilise ses propres clés et conserve dix campagnes récentes ; les meilleurs résultats anciens restent mémorisés. Les profils Windows et navigateur sont séparés : aucun profil voisin n'est lu automatiquement.

Une migration devra augmenter `SAVE_VERSION` et prévoir une fonction de transformation avant toute modification incompatible.

La reprise utilise l’identifiant temporaire réservé 0 pour le joueur, déjà représenté par cette sentinelle dans les cibles de soin : ouvrir une sauvegarde ne consomme plus un nouvel identifiant. Les compteurs dérivés épuisés sont refusés avant remplacement du monde. Les IDs de structures restent compatibles avec la grille `Int32Array` ; il ne s’agit pas d’un espace d’identifiants infini.

Les devis d’entretien sont recalculés depuis les structures vivantes et les stocks courants. La confirmation du démontage est transitoire : ni sauvegardée, ni conservée à un changement de sélection ou à l’ouverture d’une modale. Les coûts restent centralisés dans `MAINTENANCE_RULES`.

## Extension recommandée

Pour ajouter un bâtiment :

1. créer sa définition dans `BUILDINGS` ;
2. ajouter uniquement un traitement spécifique si ses propriétés génériques ne suffisent pas ;
3. écrire un test sur son coût, son palier et ses dépendances ;
4. vérifier la sauvegarde/reprise ;
5. vérifier son rendu à petite et grande échelle.

Pour ajouter un infecté :

1. créer le profil dans `ENEMIES` ;
2. ajouter son poids dans `wavePlan` ;
3. implémenter uniquement sa capacité distinctive dans `updateZombies` ;
4. préserver une faiblesse tactique claire ;
5. ne pas remplacer la difficulté de masse par des points de vie excessifs.

## Port 3D

La simulation peut être séparée du rendu et migrée vers Godot ou Unreal Engine. Les données de `core.js` doivent devenir des Resources/DataTables, tandis que les systèmes suivants restent conceptuellement identiques :

- grille d’occupation ;
- coûts de navigation pondérés ;
- directeur de vague ;
- signature ;
- économie ;
- pression des corps ;
- sauvegarde versionnée.

Ce port est une possibilité d'évolution, pas un composant livré. Signature éditeur, licences embarquées et limites de mise sur le marché : [DESKTOP.md](DESKTOP.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).


## Extension intégrée 1.26

`night-gear.js` est installé après les services essentiels et avant `exploration-125.js`. Il étend la validation et la sérialisation par `nightGear.version=1`, partage la ceinture de huit objets et expose ses sources lumineuses aux peintres existants. Le monde local utilise 32 unités par mètre ; la région utilise le mètre. Chaque équipement posé porte domaine, étage et intérieur. Les masques de nuit et la détection conservent leur autorité.

`actor-presentation.js`, après les extensions, observe les déplacements/actions déjà exécutés et fournit des objets visuels stables à `art.js`. Aucune donnée de simulation ou de sauvegarde n’est ajoutée pour les poses. Les rectangles source mesurés des deux atlas évitent de couper les armes et outils.

Le guide de terrain charge quatre modules de données `world-codex-{nature,habitat,activites,systemes}.js` puis `world-codex.js`. Le catalogue compagnon détaillé reste hors du runtime de jeu pour ne pas gonfler son chargement. Tous les fichiers de jeu sont présents dans le build, le serveur, le cache PWA et la version autonome.

## Opérations 1.27

Après les extensions 1.26, `expansion-kit.js` installe un registre commun. Les cinq modules `exploration-pack`, `survival-pack`, `fortification-pack`, `companions-pack` et `campaign-pack` déclarent leur validation, instantané, restauration, réinitialisation, aperçu et actions. `expansion-ui.js` se monte en dernier dans le panneau Dossiers du commandement, avec `expansion-ui.css` après les styles historiques.

Le format général reste v20 : le champ optionnel `expansions127={version:1,modules:{…}}` est additif. Tous les registres et le portage commun sont validés avant le remplacement du monde. Les registres absents migrent vers un état vide sans gains. Une graine ou un scénario invalide est rejeté avant toute réinitialisation des extensions. Les préparations de terrain inachevées sont transitoires et interrompues au chargement ; l’entraînement payé des compagnons conserve sa durée restante.

`expansions.canAct()` reprend l’autorisation du commandement et vérifie le personnage vivant. `expansions.busy(id)` coordonne les interventions, y compris les lampes et les services essentiels. Les colis essentiels, ballots et transports de campagne partagent un seul dos. Les coûts et plafonds sont centralisés dans cinq objets de règles de `core.js`.

Les décors locaux des packs passent dans la profondeur commune. Les camps régionaux se dessinent avec les appareils portables ; les missions présentent leur cible à l’accès réel. Les caissons de défense restent autonomes si le joueur tombe ou quitte D-17. Les réserves et identités restent bornées ; les caches de validation de mondes gardent au maximum trois graines.

L’interface ne crée aucune nouvelle boucle RAF. Elle réutilise `updateUI`, construit ses boutons selon des identifiants stables et ne consulte le modèle détaillé du hub que lorsqu’il est visible. La sélection des cartes Monde vivant est également rafraîchie seulement quand son panneau est visible.

Après profilage, une restauration sur la même graine et la même génération conserve le modèle géométrique régional de cette instance. Acteurs, butin et dégâts restent dans leurs registres restaurés ; la géométrie lit la destruction à travers le service courant. Changer de carte, de génération ou démarrer une nouvelle partie invalide ce modèle. Les caches internes de chunks et de plans gardent leurs plafonds.


## Consolidation 1.28

`frontier.position()` renvoie une copie de la pose, du domaine actif et du véhicule sans créer le monde régional ni normaliser son historique. Les systèmes qui ont besoin de coordonnées seulement utilisent cette lecture légère. `essentials.status()` fournit uniquement ceinture, portage et avancement ; le HUD réserve `overview()` au dossier effectivement visible, en tenant compte de ses ancêtres masqués. Les lectures de géométrie gardent `frontier.world()` / `overview()` ; aucune collision n’est supprimée.

Les interruptions liées à la mort sont traitées avant la mise à jour susceptible de réanimer le joueur. La mort régionale transmet sa position à l’équipement nocturne avant de désactiver le domaine. Le registre et les limites de sauvegarde restent inchangés. Les contrôles de positions d’étage utilisent la géométrie déterministe et des caches bornés.

Le peintre de Monde vivant réutilise les atlas des compagnons avec des objets visuels stables et un suivi de déplacement sans mutation de simulation. Les silhouettes cessent leurs cycles lors d’une pause, d’un arrêt, d’un changement de scène ou d’un saut de coordonnées. Voir `REGIONAL_PRESENTATION_1_28.md`.


## Terrain et équipement 1.29

La projection régionale de D-17 réutilise la vraie file de profondeur locale avec `view.homeProjection`. Les peintres des packs acceptent ce mode sans modifier le domaine de simulation. Le plan runtime de `exploration-125.js` fournit collisions, meubles, carte et projection ; `layoutRevision:2` sauvegarde les nouvelles variantes d’orientation. Une sauvegarde sans ce champ garde le plan historique.

`region-roadkit.drawNetwork` peint en passes communes les accotements, les chaussées puis les marquages des routes et accès. Cette présentation ne modifie pas les segments de collision. La minimap régionale utilise le monde et les découvertes de la graine courante.

`loadout129.js`, puis `loadout-ui129.js`, sont chargés après les packs et leur interface. Les quantités restent dans leur propriétaire originel : joueur, véhicule, dépôt ou registre de compagnons. Seules les positions de grille sont ajoutées à `loadout129.version=1`. L’interface respecte pause, priorités de modales, inertie et restitution de focus. Les masses et formats des piles sont définis dans `core.LoadoutRules`.

`command-presentation129.js` utilise les contrôleurs de commandement existants et déplace leurs nœuds DOM sans réinstaller leurs écouteurs. Le rafraîchissement des images et de la carte est limité à la rubrique visible. Les deux styles sont les derniers de la liste publique ; les illustrations d’inventaire sont distribuées et intégrées au standalone même si elles ne sont pas des atlas du moteur.

L’atlas `commander-rig129.png` sépare torses et jambes. Les rectangles et pivots mesurés sont dans `art.js`, le suivi de mouvement indépendant de la simulation dans `actor-presentation.js`. Les anciens atlas restent prioritaires pour les autres postures et actions. Les fichiers `assets/PROVENANCE_1_29.json` conservent le prompt et la méthode de génération des trois nouveaux assets.


## Entrée de campagne et présentation 1.32

`campaign-intro132.js` s’installe après les contrôleurs existants. Il enveloppe le démarrage de campagne et la gestion de focus pour afficher quatre tableaux sans avancer la simulation, puis rendre le terrain ou la pause volontaire. Le prologue existant `chronicles131` fournit toute la progression sauvegardée ; aucun deuxième registre de ressources ni nouvelle version générale de sauvegarde n’est ajouté. `presentation132.js` déplace les nœuds de contrôles existants dans une composition illustrée, conserve leurs écouteurs et ajoute des SVG décoratifs sans boucle de rendu dédiée. Les images WebP sont distribuées par le build, la PWA, le serveur et le standalone.

Le démarrage navigateur dans `game.js` désactive Nouvelle partie et Continuer pendant le chargement du document. La fin du chargement réactive les contrôles ; l’autostart éventuel est ensuite programmé pour laisser les installateurs DOMContentLoaded se terminer. Les environnements sans script de document conservent leur démarrage direct. Ce verrou de présentation ne modifie pas le format des sauvegardes.


## Routes et relève 1.33

Le plan local `layoutRevision:3` est déterministe par graine, partagé entre géométrie, peinture et projection. La nouvelle densité est appliquée à la création de campagne seulement. Les anciennes quantités sauvegardées ne sont pas recalculées. Les accès privés régionaux participent au dégagement des chunks ; les identifiants retirés restent des tombstones afin de conserver l’historique des prélèvements.

`road-profiles133.js` est un catalogue pur chargé avant `world-codex-activites.js` ; ses contrats et matrices de conception ne changent pas le générateur. `hero-actions133.js` observe les actions réellement exécutées et alimente les poses dans `art.js` sans registre sauvegardé.

`succession133.js` ajoute un registre strict `succession133.version=1` au format général v20. Il conserve les possessions au décès, le lieu et l’état du corps, puis remplace l’ancienne réanimation automatique du joueur par une sélection de relève. Les morts régionales capturent leurs coordonnées avant de désactiver le domaine. Les nettoyages de sortie et de seau disposent d’entrées internes dédiées, afin de terminer l’opération avant la sauvegarde du décès. La relève UI se monte après les autres modales et ne possède aucune quantité d’inventaire.


## Biomes et géographie — 1.35

`geography135.js` et `biomes135.js` fournissent des fonctions pures par graine. G6 est le nouveau générateur de campagne ; G1–G5 conservent leurs identités. `AtlasProjection.home(context)`, `gatesFor(context)` et les conversions contextualisées n’utilisent aucune ancre globale mutable. `frontier-world` expose son ancre et la même géométrie aux collisions, plans et carte.

`ground135.js` peint en coordonnées régionales et partage le même sol avec D-17. Ses caches sont bornés ; le petit décor est passable et distinct des troncs/rochers récoltables. `hud135.js` replace les contrôles existants dans des conteneurs bornés. La mesure de la zone libre est mise en cache, sans nouvel appel de layout à chaque flèche.

Le registre régional v2 accepte désormais génération6 dans la sauvegarde générale v20. Les ressources portent les identifiants historiques T/R/P et le registre de prélèvements existant. Le profil d’un contact G6 se retrouve par graine et identifiant.

## Consolidation et matières — 1.36

La mise à jour conserve la géométrie G1–G6, le plan local et les registres de sauvegarde. La reconnaissance distingue les villes G6 `T135_*` des tags historiques ; les dossiers G6 1.35 effectivement valides restent acceptés sans remappage de leurs ressources ou de leur progression. `fieldAtlas.mapView()` fournit les marqueurs légers aux peintres et au petit HUD. Le dossier complet reste réservé aux commandes de gestion.

`atlas-render.js` garde un raster routier par canvas destinataire. Sa clé tient compte du monde, de la vue, des dimensions, des calques et des dessertes découvertes. Les couches dynamiques sont rendues depuis leur état courant. Dans `exploration-125.js`, la révision locale 3 passe par le même RoadKit, en unités régionales converties depuis les unités locales ; les révisions 1 et 2 restent inchangées. Les caches de présentation ne sont pas sérialisés et n'altèrent aucune collision.

`assets136.js`, chargé avant `art.js`, décrit les 27 images individuelles, dont les neuf essences et quatre familles minérales G6, et les représentations vectorielles complémentaires. `DeadwallArt.ASSETS` reste le chargeur commun. Les rectangles alpha des sprites et les textures adoucies sont préparés au chargement ; les sols utilisent le cache borné de `ground135.js`. `arsenal134.visualEquipment()` fournit l'équipement tenu aux peintres sans parcourir les devis d'atelier ni sérialiser le registre. L'inventaire utilise l'identité exacte de l'objet, distincte de sa famille balistique historique.

Le HUD garde ses contrôleurs et nœuds existants. Les deux tiroirs tactiles partagent désormais un conteneur vertical ; les rappels de tiroir et de focus sont temporaires et attachés au même monde. Les mini-jeux restent non modaux : temps et menaces continuent. Leurs illustrations sont décoratives ; la manipulation et le diagnostic demeurent en HTML. Le bouton Arme suivante consulte les objets portés dans l'arsenal et garde un repli pour les compositions sans cette extension.

La reprise du rayon à pied est dérivée du constructeur du personnage avec l'identifiant 0, indépendamment d'une éventuelle empreinte de conduite déjà restaurée. L'interface de relève lit les devis et possessions du même arsenal, puis appelle son assemblage et son retrait ; aucun deuxième stock n'est créé. Les interventions revérifient leur support avant chaque effet et les lecteurs d'énergie excluent immédiatement un groupe invalide.

## Accès et interactions — 1.37

Les contrôleurs existants restent seuls propriétaires des stocks et actions. Les escaliers vérifient l’approche et l’arrivée par la géométrie partagée, avec récupération étroite des anciens paliers bloqués. Les gabarits des véhicules sont dérivés du profil pour la construction, les collisions et le service. Les attaques déjà ciblées transmettent une identité explicite ; les appels historiques sans identité conservent leur sélection spatiale.

`Game.zoomView(factor)` route boutons et molette vers l’échelle régionale lorsque le joueur est dehors, sinon vers la caméra locale. Les limites existantes de chaque domaine restent appliquées. L’armurerie lie son verrou modal à l’instance du monde et rend le focus au contrôleur approprié. Les deux PNG de `assets/art137/` sont chargés par le registre d’art commun et référencés dans les distributions. Voir les rapports spécialisés `*_1_37.md`.

## Passages et survie — 1.38

Les frontières locales dérivent leur seuil du rayon de conduite existant. Les portières et la destruction régionale partagent la recherche d’une position à pied ; la reprise d’une ancienne position dans une épave permet uniquement de quitter ce chevauchement. `districtBlocked` reçoit une emprise de véhicule optionnelle pour les collisions orientées. Générateurs, plans et IDs ne changent pas.

`Game.projectileOrigin` vérifie le petit segment entre tireur et bouche rendue. Lorsqu’un obstacle le coupe, le projectile commence au tireur pour que le résolveur normal applique l’impact ; le trajet libre conserve son origine historique. Les contrôleurs de ressources revérifient les mains occupées avant mutation. L’établi technique suit la priorité des modales au moment de `syncOverlayFocus`, même quand la simulation se suspend.

Le registre `ASSETS138` ajoute deux matières au chargeur commun sans altérer les 27 entrées `ASSETS` de 1.36. Des motifs Canvas de 256 pixels, mis en cache par image et contexte, habillent les types industriels existants. Les ombres régionales transforment un vecteur lumière monde vers le repère local. Ces éléments ne sont pas sérialisés et ne changent aucune empreinte. Voir `docs/*_1_38.md`.


## Mains et véhicules — 1.39

`Game.updatePlayer` bloque l’entrée commune des interactions E pendant une recharge, avant les propriétaires historiques qui interceptent `updateInteraction`. Les opérations matérielles lisent l’état `fieldcraft.context().mounted` du poste manuel existant. La sécurité des modules régionaux réutilise les contacts des groupes sauvages et de la succession ; le ramassage local réutilise la ligne physique de `nightGear`. La succession annule explicitement interventions et barricades avant la relève, sans nouveau propriétaire de stock.

`ASSETS139` ajoute deux PNG de véhicule au chargeur commun. Le peintre local réutilise `DeadwallFrontierArt.car` avec la conversion compacte historique du profil. Profondeur et visibilité dérivent de la représentation orientée ; la barre de santé utilise le maximum du profil. Aucune collision, dimension physique, position ni géographie sauvegardée n’est modifiée.


## Corrections de parcours 1.40

Les propriétaires existants revalident les opérations matérielles au mirador/rechargement ; nightGear partage une raison de manipulation avec son panneau, tout en conservant le permis privé de serviceLantern. Les sorties locales utilisent la ligne physique commune. chronicles131.recordDeposit reçoit uniquement les dépôts personnels effectivement acceptés ; les ouvriers restent exclus. worldEvolution expose les devis centraux de sécurisation/construction annexe utilisés également par les transactions et l’interface. ASSETS140 ajoute deux PNG individuels ; peintres locaux/régionaux139 communs et profils physiques inchangés. Guides et preuves : docs/*_1_40.md, reports/1.40.0/.


## Territoires et exploration — 1.41

Les nouvelles campagnes choisissent G7, champ accepté par le registre régional v2 dans la sauvegarde générale v20. Les générateurs G1–G6 restent disponibles avec leurs plans et réserves historiques. GeographyRules141 compose une nouvelle ancre par graine et de nouvelles rues sans mutable globale. WorldTownRules141 compose les services locaux dans les plans existants, et l’index privé de placement compare les mêmes obstacles exacts sans modifier les sorties. EcologyRules141 fournit neuf champs de communauté aux douze biomes existants ; le scatter G7 et les peintres lisent le même contexte de génération.

Le miroir G7 des plans transforme ensemble murs, pièces, ouvertures, meubles et escaliers en gardant les IDs/budgets. Les routes G7 se raccordent aux sorties du domaine local ; les tracés retournés sont copiés. Les tournées utilisent l’origine réelle, et la préparation par biome ne tire aucune nouvelle découverte. AtlasView cadre l’emprise réelle dès sa première ouverture, puis conserve les vues choisies au sein d’une même carte. ASSETS141 ajoute deux PNG individuels au chargeur commun, au build, à la PWA et au standalone ; l’art local G7 dérive les espèces depuis les coordonnées régionales, sans muter la simulation. Voir docs/*_1_41.md et reports/1.41.0/.


## Repli et préparatifs — 1.43

Le HUD utilise les nœuds existants `waveIntel` et `innerRingAlert` hors du dossier Situation. Les raccourcis ouvrent les mêmes contrôleurs de préparatifs, d’enceinte et de sections ; aucune simulation concurrente n’est créée.

Les sections conservent leur registre `squads` v1. Une référence optionnelle à une redoute de repli utilise le bâtiment existant et les chemins physiques des unités. Une redoute perdue entraîne le retour vers le centre. Les anciennes sections dépourvues de cette référence conservent leur repli historique.

L’état des objectifs ajoute `objectiveReady`, un booléen optionnel dans le format de sauvegarde v20. Il mémorise un objectif accompli dont la récompense ne tient pas encore au dépôt. La récompense entière est versée une seule fois dès que la capacité le permet ; aucune réserve parallèle n’est créée. L’absence du champ dans une ancienne sauvegarde signifie `false`.

## Plan de croissance D-17 — 1.45

`urban.planning()` dérive le prochain palier des bâtiments vivants et achevés, du pic historique et des fondations ordinaires déjà financées. Les points manquants utilisent le score construit actuel : après une perte, le pic conserve les connaissances mais ne remplace pas les constructions nécessaires pour franchir un nouveau seuil. Le potentiel additionne les scores entiers des chantiers à leur achèvement, y compris les chantiers suspendus ou physiquement bloqués ; ce total reste conditionnel et ne donne ni score, ni délai garanti, ni capacité anticipée.

Dans le dossier Préparatifs existant, les modèles de l’âge atteint et du prochain âge affichent les coûts du catalogue, les matériaux manquants au dépôt et les bâtiments prérequis réellement achevés. Les plans de terrain et le placement restent contrôlés par leurs systèmes existants. L’accès à la gestion des chantiers réutilise `citadel.open()` ; aucune construction ni affectation automatique n’est lancée. Le HUD d’éclairage lit `urban.lightingState()` sans inspecter les bâtiments quand ce dossier est fermé. Aucun champ de sauvegarde, seuil ou coût n’est ajouté.

## 1.46 — Contacts observés et contenu de terrain

`visibility146.js` installe un service non persisté après l’exploration et l’éclairage. Chaque dessin construit une frame synchrone : observateurs physiques et lumières indexés spatialement, portées en mètres depuis `VisibilityRules146`, projection D17 dynamique, rayons passant par les collisions locales/régionales et les mêmes étages/intérieurs. `canSeeLocal`/`canSeeRegional` ne mémorisent aucun ennemi ; `snapshot` fournit uniquement des compteurs. Les peintres des cartes effectives partagent une frame et filtrent les contacts physiques. La lecture ne consomme pas de RNG, ne transforme pas le monde et ne touche pas les stocks. Les sources réseau coop de présence ne répondent pas au contrat d’observateur vivant et sont exclues.

Les ajouts Survie/Exploration réutilisent camp, couverture, pansement, cargo, caches et tâches non persistées. Fortifications réutilise les réserves finies : plafonds dérivés des variantes cataloguées, sans agrandir les reliquats anciens. Compagnons encode les deux étapes payées dans `trained`, avec prérequis validés et effets conditionnés par les ordres physiques. Les deux contrats utilisent `definitions.cargo`, `unique` et `waveLimit` ; leurs compteurs absents d’une sauvegarde ancienne deviennent zéro, aucune récompense de migration. L’exclusivité de portage est vérifiée depuis cette définition. Les deux nouveaux ensembles `Dayworks.PLANS` utilisent les transactions normales et les empreintes de quatre fondations.

`fieldcraft.setup` conserve un layout enregistré courant au chargement ; le packing déterministe demeure au nouveau départ et pour les layouts anciens. Cela empêche le déplacement d’un décor après une construction légale hors du collider mais proche de sa réserve initiale. Voir `docs/LIVRAISON_1_46.md` pour coûts, portée QA et publication.

Le marqueur transitoire `fieldcraft.legacyLayout` est conservé à travers la préparation du wrapper régional avant validation puis capturé par le wrapper de terrain. Les chemins ancien brut, ancien déjà normalisé et vrai chargement utilisent le packing historique ; un layout courant conserve ses coordonnées. Le serveur public est contrôlé depuis la liste de scripts du HTML (octets et MIME), pour détecter un module oublié dans sa surface publique. Les descriptions des nouveaux contrats, variantes et exercices sont affichées même lorsque leur bouton est refusé ; la raison de refus reste distincte.

## 1.47 — Fronts, file bornée et appoints

`Siege.PROFILES` ajoute `pincer`/`flank`, seuils 10/13, avec `frontPattern`. `Dayworks.frontGroup(night, pattern)` résout les côtés cardinaux depuis le premier front enregistré et demeure l’unique propriétaire des groupes effectivement utilisés par `spawnZombie` et le briefing. `siege.assaultPattern()` lit seulement le profil de la vague courante déjà sauvegardé ; aucun tirage ou recalcul d’`adaptPlan` à la reprise. Les IDs historiques et le registre Siege v1 sont conservés.

`restoreSave` conserve séparément la copie d’une file validée de taille au plus `STRATEGY_RULES.spawnBatch` et les comptes normalisés. Une longue file héritée est compactée comme auparavant. Cette distinction garde les tirages déjà effectués, la RNG et le timer pour les sauvegardes courantes, sans nouveau champ du format général v20.

`FortificationPackRules.fieldSupply` définit deux recettes. Le job transitoire garde support exact/type, quantité, coût et point de départ ; le diagnostic est revalidé jusqu’au paiement atomique du sac, puis le fitting reçoit le lot, avec création payée si ce support compatible n’en a pas encore. Une réserve entièrement consommée peut être recréée sur le même support valide dans la borne du registre. Le chargement annule le job sans débit ; seules les réserves finies achevées sont persistées. Le plateau d’`expansion-ui` expose son temps de travail.

`Battlefield.observedSnapshot` filtre les secteurs via une frame `visibility146`, puis garde séparément le total vivant du directeur. `Coordination.tactical` dérive le calendrier et l’état des structures alliées sans mutation. `coordination-ui.refresh` refuse les ancêtres masqués avant lecture ; les accès Portes/Sections/Entretien réutilisent leurs contrôleurs. Voir guide147 pour coûts et portée des preuves.


## 1.48 — Ensembles, mécanismes et atelier

`Dayworks.PLANS` ajoute deux layouts avec les constructions existantes. Empreintes, coût, conditions de financement, rollback et progression restent ceux du contrôleur commun. `dayworks.workContext()` lit seulement les états transitoires d’outil/placement/aperçu ; les devis d’armurerie n’ont plus besoin de reconstruire l’overview détaillée pour chaque recette.

`FortificationPackRules.mechanisms` décrit deux montages. Le fitting existant peut porter un champ optionnel strict `mechanism` avec recette, charges, cooldown et entraves liées aux IDs vivants. Le job de fabrication reste transitoire, capture le support exact et paie le sac à la fin seulement. Le registre sauvegarde les effets actifs et rejette une réserve ou un support incompatibles avant mutation. Perdre le support supprime son montage et termine ses projections d’entrave, sans recréer de stock. Les contrôleurs de simulation, le travail de terrain et le plateau UI restent uniques.

Les nouveaux IDs `shielded` et `charger` sont ajoutés en fin de `ENEMIES`. Les compteurs absents des anciennes compositions deviennent zéro. Le projectile et les postes balistiques partagent une fonction pure pour la protection frontale ; pièges et mêlée conservent leur chemin de dégâts. La ruée du Fonceur utilise son angle fixé et des pas physiques bornés ; obstacles et stagger l’interrompent. Les nouveaux infectés conservent orientation, ralentissement, agitation et étape de ruée dans des champs optionnels stricts. Le plan sauvegardé ne se reprofilera pas au chargement. Les six profils régionaux et leur dérivation par graine restent historiques.

Le catalogue d’arsenal reçoit deux outils à `workBonuses/workWear/requires` et une carabine monocoup. La fabrication garde le registre existant et capture le même atelier opérationnel jusqu’à son paiement. Les bonus proviennent seulement de l’objet effectivement tenu et en état ; les quantités récupérées restent dans le propriétaire de barricades. Les identifiants sont vérifiés comme propriétés propres du catalogue. Les petites silhouettes SVG des outils et leur géométrie en main sont originales et passent par `assets136.js`, sans charger une nouvelle bibliothèque ou une boucle RAF. Voir guide148 et preuves actuelles pour résultats et limites.


## D-17, du refuge à la mégaville — 1.49

`urban.planning()` ajoute par modèle `minimumStorage` (le maximum des quantités d’un coût) et `storageShortfall` (ce maximum moins le stockage achevé courant, borné à zéro). L’interface expose le besoin de stockage sans paiement, nouveau stock ni nouveau champ de sauvegarde. Une perte de stockage ou un achèvement met à jour le diagnostic.

`d17-art149.js` est chargé après assets136 et avant art.js. Il fournit six images au chargeur commun (59 entrées) ; urban-art installe ses raccords après création du jeu. Dix-sept rectangles mesurés couvrent les centres, six hauteurs de logements, les familles industrielles, les services et les chantiers. Le choix du centre lit le palier déjà calculé ; les peintres ne consultent aucun snapshot de simulation. La texture de cour utilise un motif mis en cache par contexte. Éclairage, désactivation, profondeurs, emprises et fractions exactes de chantier restent ceux du moteur, avec repli si l’image manque.

Les nouvelles vérifications séparent les transactions réelles en G7, les parcours de début natifs et les colonies tardives explicitement préparées. Les durées de chantier isolé ne sont pas des temps de campagne humaine. Voir LIVRAISON_1_49.md et les reçus d’audit distincts.
