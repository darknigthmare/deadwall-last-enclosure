# Atlas, biomes et carnet — 1.41

La carte cadre désormais toute la région dès sa première lecture. Depuis D-17, la première ouverture montre la région entière ; depuis la région, le raccourci M garde le centrage autour du commandant. Région, D-17 et Joueur restent des cadrages explicites. Les gestes de carte ne déplacent aucun acteur et ne découvrent aucun lieu.

## Défauts reproduits

Sur la 1.40, graine 17117 / G6, la caméra neuve gardait son centre historique 4096 / 4096 et un zoom pour 8,192 km, alors que le monde fait 24,576 km. `regionSize()` changeait les limites de déplacement sans recadrer la caméra. Le premier `draw()` n’appelait pas `fit()` puisqu’aucune vue précédente n’existait. L’emprise visible allait de −1965 / 0 à 10157 / 8192 mètres ; D-17, à 9448 / 12490, était hors de cette première vue. La largeur extérieure est la marge du cadrage rectangulaire, pas une région jouable négative.

Le premier dessin et tout remplacement du monde recadrent maintenant son étendue complète et effacent les anciennes sélections et mesures. La nouvelle caméra se centre à 12288 / 12288 pour un monde de 24576 mètres. Une ouverture locale n’impose plus immédiatement un zoom du refuge après ce recadrage. Le centrage du GPS régional existant est conservé.

Le peintre schématique du refuge remplissait aussi un carré sombre opaque avant ses routes et ressources, recouvrant le vrai sol écologique déjà dessiné en dessous. Avec le calque terrain actif et un monde G6/G7, D-17 conserve ce sol commun. Le fond historique reste disponible pour les anciennes générations ou lorsque le calque des sols est masqué. Les empreintes, collisions, ressources et plans locaux ne changent pas.

Enfin, les noms ne vérifiaient que la position de leur centre. Une longue étiquette pouvait dépasser le canvas, et la priorité du nom D-17 pouvait recouvrir la règle ou le nord. Les rectangles de texte sont désormais bornés et ces instruments ont une réserve prioritaire.

## Lire les milieux et préparer l’exploration

Le dossier montre la graine courante, la génération, les dimensions du monde et les coordonnées réelles de D-17. Le pointeur et le centre du cadrage lisent `world.biomeAt()` : même champ écologique que la génération et la peinture. Cliquer un espace libre du terrain affiche son milieu, son éventuel sous-milieu G7 et sa transition dominante. Aucun lieu inconnu, stock ou trajet sûr n’est promis par cette lecture. Un repère de sélection reste visible sur le terrain.

Le calque facultatif « Noms des biomes » affiche quelques noms représentatifs à l’échelle régionale. Il utilise un cache de présentation par monde et cadrage, sans tracer un quadrillage. Les noms partagent la prévention des chevauchements avec ceux des villes et lieux. Le zoom détaillé conserve l’inspection ponctuelle plutôt qu’une étiquette par parcelle.

Le carnet propose « Compléter par biome » grâce au propriétaire `fieldAtlas` : seuls les lieux déjà confirmés dans cette campagne sont proposés. Ajouter les lieux connus remplit les places restantes de la tournée, jusqu’à six étapes, selon leurs accès routiers. Une tournée active, un carnet plein ou un commandant indisponible désactive cette préparation. Les indices approximatifs gardent leur localisation et leur activité supposées ; leur biome n’est pas révélé par les cartes du carnet. Les noms de milieux peuvent être recherchés pour les lieux confirmés.

Une tournée en voiture signale explicitement que le véhicule doit rejoindre le commandant s’il est resté dans D-17. Son carburant éloigné ne devient pas une réserve disponible dans l’estimation. Les distances et quantités restent celles du propriétaire de la tournée, sans deuxième registre. Un guidage G7 depuis D-17 indique également de rejoindre une sortie locale dégagée lorsque le chemin affiché commence au portail régional. Les obstacles de la cité ne deviennent pas un raccourci tracé sur la carte.

## Vérifications

`tests/map-ui141.test.cjs` couvre onze scénarios : premier cadrage, ouverture locale sans mutation, changement de graine, inspection réelle sans découvertes, bornes des étiquettes, cache des noms écologiques, préparation de tournée limitée aux confirmations, absence de propositions avant exploration conservation du sol sous le refuge distinction du segment régional depuis une sortie locale et affichage des portions de retour vérifiées dans D-17.

Avec les tests historiques `field-atlas136`, `atlas-cache136`, `navigation130` et `ui140`, le groupe final passe **35/35 tests**, sans échec, annulation, ignorance ni todo. Les anciens parcours de reconnaissance G6 utilisent le fixture explicite préparé par la racine ; leurs ressources et progressions restent exercées en G6. Un onzième parcours DOM, ajouté avec la note de retour, passe aussi **1/1**, sans test ignoré (`map-ui141-return-note.log`). Le dossier de provisions distingue les kilomètres régionaux et les portions locales, affiche la note du résolveur et rappelle qu’une construction ou un dégât peut modifier les passages. Les anciens textes G1–G6 restent conservés. Le contrôle complet du projet appartient à la vérification finale commune, après gel de tous les lots.

Les captures `reports/1.41.0/map141-before-*` emploient la 1.40 intacte. `map141-after-*` montre le monde G7 et `map141-after-g6-*` isole les corrections de carte sur un monde G6 conservé. Les JSON consignent les coordonnées, cadrages, générations et calques effectivement dessinés. Le script `scripts/capture-map141.cjs` emploie le vrai peintre Canvas sous l’ordre complet des scripts HTML, avec DOM simulé et Canvas natif.

Les commandes agent-browser, chromium, google-chrome et firefox sont absentes de l’environnement. Ces captures et contrôles de handlers ne certifient pas un rendu CSS en navigateur réel, le tactile matériel, l’audio ou les FPS GPU. Aucun nouveau HUD flottant n’est ajouté : provenance, inspection et préparation par biome restent dans les dossiers existants.
