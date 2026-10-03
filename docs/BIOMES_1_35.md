# Biomes et écologie — 1.35

La génération G6 utilise **12 milieux terrestres tempérés**, **9 essences**, **4 familles de roches**, **8 familles de microdécors** et **6 profils de contacts régionaux**. Les **62 plans visitables existants** sont réutilisés dans des pools de lieux compatibles avec les milieux. Il ne s’agit pas de 62 nouveaux intérieurs.

`src/core.js` contient toutes les données d’équilibrage dans `BiomeRules135`. `src/biomes135.js` est un module pur : il ne lit ni ne modifie le hasard du combat, la sauvegarde ou les stocks. `src/biomes-codex135.js` dérive **106 fiches** de ces données et des vrais plans régionaux. L’addendum autonome est produit par `node scripts/export-biomes135.cjs`.

## Contenu effectif

| Milieu | Sol hors route | Végétation dominante | Lieux privilégiés |
|---|---|---|---|
| Prairies ouvertes | Herbe | Chênes et bouleaux espacés | Fermes, maraîchage, habitat rural |
| Bocage et haies | Herbe | Chênes, hêtres, arbres fruitiers | Hameaux, services et ateliers de village |
| Forêt de feuillus | Sous-bois | Chênes, hêtres, bouleaux | Chalets, scieries, menuiseries, ruines |
| Forêt mixte | Sous-bois | Pins, feuillus, quelques sapins | Relais forestiers, scieries, abris |
| Massif de conifères | Sous-bois | Sapins et pins | Chalets, scieries, mines et abris |
| Bois des fonds humides | Boue | Saules, aulnes et peupliers | Pompage, maraîchage et locaux techniques |
| Landes humides et roselières | Boue | Aulnes épars, saules, roseaux | Pompage, cabanes et ruines |
| Landes sèches | Herbe | Pins et bouleaux espacés | Ruines rurales, carrières et relais |
| Collines calcaires | Gravier | Pins et chênes | Carrières, extraction et petites exploitations |
| Hauts plateaux rocheux | Gravier | Conifères très espacés | Mines, carrières et abris |
| Vergers et cultures abandonnés | Herbe | Arbres fruitiers | Maraîchage, fermes, jardineries et réserves alimentaires |
| Friches reconquises | Gravier | Bouleaux et peupliers pionniers | Ateliers, logistique, habitat et activités abandonnées |

Les mots « collines », « altitude » et « fonds humides » décrivent les indices écologiques et le rendu de plain-pied. Cette extension ne crée pas de montagne en volume, falaise, rivière navigable, noyade, neige profonde, froid létal, animaux ou faction humaine. Les arbres fruitiers restent des gisements de bois finis ; les denrées proviennent des vrais contenants des lieux.

## Continuité spatiale

Les trois champs de température relative, humidité et altitude écologique sont des bruits interpolés de plusieurs échelles. Une déformation du domaine évite de suivre les carrés du streaming. Les couleurs sont mélangées selon les poids de **tous** les profils climatiques : les jonctions de trois milieux ne coupent pas brutalement une palette. Les deux milieux les plus proches restent exposés pour les outils de lecture, mais ils ne sont pas seuls à définir la couleur.

Le même échantillon fournit les densités d’arbres, de roches et de microdécors. Le choix des essences mélange les distributions voisines, sans fabriquer un deuxième terrain indépendant. Les espèces d’arbres sont chêne, hêtre, bouleau, pin, sapin, saule, peuplier, aulne et arbre fruitier. Les roches sont calcaire, granite, schiste et amas de pierres.

La grille interne fournit des candidats décalés, pas des tuiles peintes : les positions sont secouées à l’intérieur de cellules, filtrées par des taches de densité puis écartées des emprises et des obstacles. La règle de priorité utilisée pour espacer les troncs regarde aussi les candidats des cellules voisines ; elle est identique de part et d’autre des limites d’un chunk. Elle garantit au moins 3,4 m entre les troncs acceptés, sans devoir garder tous les chunks en mémoire.

Les décorations herbe, roseaux, fleurs, feuilles, cailloux, branches, herbes sèches et gravats sont passables, sans ressource ni collision cachée. Les troncs et les blocs sont les gisements physiques. La canopée visuelle est séparée du rayon du tronc.

## Placement et budgets

Le générateur fournit au scatter une fonction `clear(x,y,pad)` qui refuse les chaussées, dessertes, réserves de parcelles et l’emprise de D-17. La marge écologique du refuge s’ajoute à son demi-côté de 64 m. Un arbre utilise sa canopée plus une marge pour ne pas couvrir les routes ; sa collision reste limitée au tronc.

Les candidats sont bornés par chunk de 256 m : au plus 1 100 pour les arbres, 96 pour les rochers, 120 pour les décors. La mise en grille utilise respectivement 33², 9² et 10² positions candidates ; les rejets diminuent ces nombres. Les caches restent gérés par `frontier-world.js`.

Chaque essence porte une plage finie de bois, de 7–14 unités pour un arbre fruitier à 13–24 pour un chêne. Les blocs contiennent 6–27 unités de pierre selon le type et la taille tirée. Les quantités, angles et variantes sont déterministes. Le champ `taken` existant soustrait les prélèvements ; une éviction de cache ou une reprise ne remplit jamais les réserves.

## Contacts régionaux

Les proportions changent avec les milieux : davantage de rampants en terres humides, de contacts mobiles en forêt et d’anciens ouvriers ou agents dans les friches. Aucun nouveau groupe surnaturel n’est créé. Les règles régionales restent distinctes des profils du siège de D-17.

| Contact régional | PV | Vitesse maximale | Dégâts | Intervalle |
|---|---:|---:|---:|---:|
| Errant de campagne | 65 | 1,10 m/s | 8 | 1,15 s |
| Infecté récent | 48 | 1,65 m/s | 7 | 1,00 s |
| Agent protégé | 65 | 0,85 m/s | 10 | 1,50 s |
| Rampant | 42 | 1,35 m/s | 6 | 0,95 s |
| Ouvrier infecté | 65 | 0,95 m/s | 9 | 1,35 s |
| Infecté mobile | 54 | 1,45 m/s | 7 | 1,10 s |

Les apparences reprennent les familles d’infectés existantes. Les capacités spéciales du combat local ne sont pas implicitement copiées : pas de nouvelle armure par pourcentage, de cri magique, de brèche instantanée ou de ressource offerte à la mort. La santé ne dépasse pas l’ancienne borne régionale de 65, ce qui conserve la compatibilité du registre des contacts.

## Contrat d’API

- `sample(seed, x, y)` retourne `id`, `name`, `primary`, `secondary`, `blend`, `weights`, `def`, `palette`, `surface`, les trois valeurs climatiques, `treeChance`, `rockChance` et `decorChance`.
- `buildingPool(id)` retourne les poids de gabarits connus ; `pickBuilding(seed,x,y,key)` effectue un tirage déterministe contextualisé.
- `pickTree`, `pickRock` et `enemyProfile` retournent les définitions effectives sélectionnées.
- `scatter(seed,cx,cy,{clear,home})` retourne les `trees`, `rocks` et `decor` d’un chunk. `clear=true` signifie libre. Les identifiants de ressources restent compatibles avec les registres `T…` et `R…`.
- `surface(seed,x,y)` expose le type de sol écologique. Les routes, parcelles et intérieurs conservent leur priorité dans le système de déplacement.

G1 à G5 continuent d’utiliser leurs générateurs antérieurs. Le catalogue ne force jamais une ancienne sauvegarde à changer de terrain. Une nouvelle campagne G6 est nécessaire pour ce nouveau monde.

## Validation

`tests/biomes135.test.cjs` vérifie les 12 profils, la couverture des 62 gabarits, la reproductibilité sans `Math.random`, la continuité des palettes aux coutures, la présence des 12 milieux sur un échantillonnage de la graine 17117, les candidats rejetés sur les emprises, l’espacement des arbres de chunks voisins, les stocks finis, les six profils et les 106 fiches dérivées.

Ces contrôles ne constituent ni une mesure de FPS navigateur, ni une garantie que chaque petit secteur contient tous les types. La distribution reste probabiliste et contrainte par les accès réels.
