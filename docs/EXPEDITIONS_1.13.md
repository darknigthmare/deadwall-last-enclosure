# DEADWALL 1.13 — Les Routes du ravitaillement

Candidat local **1.13.0-rc.1**, basé sur le jeu complet 1.12. Aucun push GitHub ni déploiement Vercel. Les systèmes précédents sont conservés. Format de campagne **v12**.

## Périmètre

Cette passe ajoute douze destinations aux réserves finies **dans la carte D-17 existante**, une voiture pilotée manuellement et un poste de renseignement. Il ne s'agit pas de douze cartes séparées, d'un nouveau monde régional, d'un voyage instantané ou d'une reproduction de The Last Stand: Aftermath. Les trajets de retour, le carburant et les réserves sont les enjeux repris dans cette boucle propre à DEADWALL.

La ville continue de vivre pendant les sorties : ouvriers, énergie, temps du jour et progression vers l'alerte ne sont pas gelés. Ouvrir le commandement suspend la simulation comme les autres dossiers. Les départs et fouilles s'effectuent au calme ; au crépuscule, la voiture peut toujours revenir, mais les fouilles sont interrompues.

## Infrastructures

Deux constructions rejoignent le palier Camp fortifié, après un Bureau de chantier achevé. Elles sont absentes du catalogue avant ce palier.

| Bâtiment | Emprise | Coût | Fonction |
|---|---:|---|---|
| Bureau des expéditions | 3 × 2 | 50 bois, 65 ferrailles | Renseignement par un ouvrier existant ; une unité électrique |
| Garage des sorties | 3 × 3 | 65 bois, 80 ferrailles | Remise en service et réparation d'un break au centre |

Ces structures utilisent les chantiers, l'intégrité, le score et les incendies du moteur. Les 69 modèles précédents restent présents : **71 types de bâtiments**, toujours répartis sur les onze âges.

## Renseignement

Trois haltes sont connues au départ. Un ouvrier disponible peut être détaché au bureau : deux rations sont payées lors de l'affectation. Il dépose son éventuel sac précédent, se déplace vers le poste puis travaille à proximité. Chaque renseignement exige **45 secondes actives**, un bureau alimenté et **deux rations supplémentaires**. Le stock de renseignements est limité à 40.

Un même ouvrier ne peut pas être simultanément analyste, récupérateur, ouvrier de voirie, secouriste ou agent de quartier. Il reste dans la population existante et conserve ses besoins alimentaires. Danger, destruction du bureau, repli général ou nuit provoquent son retour physique. Une coupure électrique suspend le travail ; elle n'offre aucun renseignement.

Les premiers relevés de chaque expédition rapportent également **deux renseignements**, une seule fois. Approcher un lieu inconnu pendant le jour peut le repérer sans analyste. Consulter la carte ne révèle pas les coordonnées des neuf lieux encore inconnus dans l'interface.

| Destination | Seuil de renseignements | Réserve principale | Carburant supplémentaire |
|---|---:|---|---:|
| Station des Trois Bornes | Connue au départ | 22 carburants | — |
| Garage de la Roseraie | Connue au départ | 48 ferrailles | 8 |
| Relais du kilomètre 17 | Connue au départ | 48 rations | 8 |
| Archives de la voirie | 2 | 26 ferrailles | 6 |
| Dispensaire des Quatre Vents | 4 | 18 médicaments | 6 |
| Poste routier abandonné | 6 | 55 munitions | 7 |
| Base-vie du chantier | 8 | 65 bois | 10 |
| Pompes du canal | 10 | 32 carburants | — |
| Plateforme de tri | 12 | 75 ferrailles | 10 |
| Dépôt de matériaux | 14 | 80 pierres | 10 |
| Laboratoire vétérinaire | 16 | 24 médicaments | 8 |
| Terminal des anciens convois | 18 | 85 munitions | 12 |

Les réserves ne se renouvellent ni au matin ni au chargement. Les relevés demandent six secondes, dix pour les deux archives, en maintenant ACTION / E à pied. Après le relevé, le prélèvement s'effectue à trois ressources par seconde dans le vrai sac. Le carburant est prélevé en priorité. Un sac plein laisse le reste sur place. Les infectés proches et visibles interrompent la fouille ; aucune nouvelle armée ennemie n'est créée artificiellement par ces sites.

## Voiture et carburant

Le break coûte **40 bois et 90 ferrailles**, séparément du garage. Il apparaît près du centre seulement si une place accessible est disponible. Le réservoir et le coffre sont vides. Une seule voiture vivante est autorisée ; un véhicule détruit peut être remplacé en payant de nouveau.

- Réservoir : **24 unités de carburant**.
- Coffre : **80 ressources**, total partagé entre tous les matériaux.
- Intégrité : **320**.
- Consommation : **3 carburants pour 1 000 unités de distance réellement parcourue**.
- Réparation au centre : **15 ferrailles pour jusqu'à 80 points d'intégrité**.

`F` ou le bouton « Monter / Descendre » permet de prendre place, à proximité, hors danger immédiat. Les touches habituelles WASD/ZQSD/flèches et les commandes tactiles dirigent le véhicule. La conduite est une direction 2D avec accélération, pas une simulation de volant et de boîte de vitesses. Les pistes donnent leur bonus existant aux véhicules.

Les collisions sont échantillonnées par petits pas, avec une empreinte plus large que le commandant. Une porte verrouillée bloque le break. Les chantiers ne se terminent pas au travers d'une voiture et les nouveaux bâtiments ne peuvent pas être financés sur elle. Aucune consommation à l'arrêt ou lorsque le véhicule reste bloqué. Aucun tir ni chantier depuis la voiture, aucun bonus de dégâts par collision. Le break peut subir des dégâts et sa destruction fait perdre tout le coffre et l'essence. Les autres personnages ne montent pas comme passagers dans cette version.

Les phares éclairent devant le véhicule quand il est conduit avec du carburant. Ils utilisent le masque nocturne et ses obstacles existants. Les nuits noires, l'électricité de la cité et les batteries ne sont pas remplacées.

## Approvisionnement et troc

Remplir le réservoir transfère d'abord le carburant du sac, puis du coffre ; les réserves centrales ne sont accessibles que près du centre. Aucune essence ne se déplace à distance. En panne loin de la cité, il faut descendre et revenir avec du carburant porté. Il n'y a ni dépanneuse ni remorquage automatique.

Au centre, pendant le jour et avec le bureau construit, l'interface propose un troc : **5 carburants contre 20 ferrailles**, avec un stock de **30 carburants par journée**. Une quantité partielle est calculée si le dépôt ou le vendeur n'a pas la place ou le stock nécessaire. La reprise ne renouvelle pas cette offre. L'achat crédite le dépôt, pas directement le réservoir. Le négociant est représenté par cette interface de troc, pas un nouveau PNJ mobile. Aucun achat en argent réel.

## Départ et retour

La première destination d'une sortie se prépare au centre avec le break, un bureau achevé, **trois rations**, au moins deux carburants dans le réservoir et du temps de jour restant. Les deux carburants sont une condition minimale, pas une promesse d'atteindre tous les lieux. Le panneau affiche une estimation géométrique vers le lieu puis le centre ; les détours coûtent davantage et la ligne de carte n'est pas un trajet sûr calculé.

Une sortie peut changer de destination connue sans repayer les rations. Sur place, il faut descendre, relever et fouiller. Le bouton Sac → Coffre transfère réellement ce qui est porté ; un coffre plein conserve les excédents dans le sac.

Le déchargement s'effectue avec le véhicule et le commandant près du centre. Le stock est crédité alors, jamais pendant la route. Un dépôt plein laisse le reliquat dans le coffre. Lorsque le coffre est vide, la sortie est enregistrée comme rentrée ; ce compteur ne signifie pas que toutes les réserves d'un lieu ont été récupérées et n'accorde aucune récompense automatique.

Interrompre une sortie demande confirmation. Le véhicule, le butin et le carburant restent sur place, et les rations déjà engagées ne sont pas remboursées.

## Interface et sauvegardes

L'encart Expéditions est intégré à **Carte & exploration**. Les treize dossiers de terrain sont conservés sans ajouter d'onglet permanent. Les destinations sont sélectionnables sur la carte ou par une liste accessible au clavier. Un HUD distinct conserve les boutons voiture hors de la minicarte, masquée sur certains petits écrans.

Les sauvegardes v1 à v11 migrent vers v12 avec trois haltes connues, sans voiture, analyste, renseignements gagnés ou ressources supplémentaires. La v12 conserve la voiture, sa position, son carburant, son coffre, la conduite, l'analyste, la recherche en cours, les stocks locaux et le troc. L'ancien jeu 1.12 ne peut pas lire une v12 : garder l'export d'origine.

## QA et limites

La suite Node exécute le moteur avec un DOM minimal ; les parcours Chromium chargent le véritable moteur, les éléments d'interface et les atlas. Les quatre nouveaux profils sont conducteur-explorateur, renseignements-personnel, pannes-portes-nuit et tactile-migrations. Les infrastructures et stocks initiaux des scènes avancées sont préparés et identifiés. Le parcours conducteur effectue ensuite achat, préparation, conduite réelle, descente, relevé, fouille, chargement, retour et livraison avec les commandes ordinaires.

Les erreurs initiales de version et de compteur de catalogue ont été adaptées aux nouvelles versions. Une comparaison de sauvegarde exclut le cache dérivé wavePlan, que le moteur historique reconstruit au chargement. Le premier essai tactile a révélé un bouton voiture dans une minicarte cachée ; une fois déplacé, un conflit avec la torche interceptait les appuis. Leurs zones sont maintenant séparées, avec une vérification de la cible tactile réellement touchée. Les logs initiaux sont conservés.

Les tests avancés ont un temps de simulation piloté et ne sont pas des parties humaines. Les anciennes endurances utilisent une assistance synthétique signalée dans leurs journaux. Pas de validation Safari/iPhone physique, Firefox, Electron empaqueté, tous les trajets sur toutes les graines, ni campagne de mégaville de plusieurs heures. Les captures sont réelles mais ne constituent pas une revue artistique humaine exhaustive.
