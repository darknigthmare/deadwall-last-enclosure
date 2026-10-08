# DEADWALL 1.53.1 — Monde, cohérence et fluidité

Le correctif 1.53.1 conserve les ralentissements et l'agitation des dix profils d'infectés lors d'une sauvegarde/reprise, ainsi que le prochain cri des Hurleurs. Les anciennes copies restent lisibles ; les coûts, dégâts et conditions des onze âges restent ceux de la campagne existante.

Cette passe corrige les manipulations de matériel au volant ou pendant une recharge, les menaces individuelles autour des interventions, les commandes de compagnons après une défaite et la migration extérieure lorsque le joueur monte à l’étage. Les boutons annoncent les disponibilités effectivement vérifiées par les actions.

Le monde reçoit **318 silhouettes et variantes**, plus **16 motifs de sols**, dans 21 atlas PNG originaux et deux SVG. Les arbres et roches suivent les espèces des douze biomes ; les meubles, toits, ruines, équipements, éclairages et objets des anciennes cartes utilisent leurs propriétaires physiques. Le catalogue distingue les modèles réellement raccordés des réserves graphiques. Les micrograins du sol restent procéduraux. Les PNG originaux et leurs provenances sont conservés.

Le mode graphique **Automatique** adapte la résolution à la cadence ; **Élevée** conserve une résolution fixe et **Légère** utilise une densité de un. La simulation, les coordonnées de jeu et les sauvegardes restent indépendantes de ces choix. Les collisions d’annexes et les découpes de sprites disposent de caches transitoires bornés ; les anciens atlas d’acteurs conservent leurs pixels.

La progression des onze âges garde l’objectif Standard de **6 à 10 heures**, à confirmer par des campagnes humaines complètes. Guide et limites : [docs/LIVRAISON_1_53.md](docs/LIVRAISON_1_53.md). Les mesures finales, contrôles, archives et vérifications HTTPS sont consignés séparément après exécution. Destination autorisée : https://deadwall-last-enclosure.vercel.app/.

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:world-art
```

## Historique conservé — 1.52

# DEADWALL 1.52.0 — D17, visibilité et animations

Cette passe corrige les animations lentes sur les écrans à haute fréquence, la priorité des gestes de récolte et le recul après changement d'arme. Le HUD régional et son dossier affichent uniquement les contacts actuellement observés. Les travaux payés réservent correctement les mains du commandant ; les infectés réanimés bloquent les opérations de terrain dangereuses et la défaite arrête leur progression.

Les services, la logistique, l'énergie et l'éclairage de D17 reçoivent 28 sprites originaux, avec leurs états physiques d'alimentation, charge et contrôle territorial. Les véhicules légers sont également complétés. Les cartes G1–G7, les fonctions des bâtiments et la progression diversifiée des onze âges sont conservées. La cible Standard reste **6 à 10 heures**, à confirmer par des campagnes humaines complètes.

Guide et limites de validation : [docs/LIVRAISON_1_52.md](docs/LIVRAISON_1_52.md). Les résultats de contrôle, archives et vérifications HTTPS sont consignés séparément après exécution. Destination autorisée : https://deadwall-last-enclosure.vercel.app/.

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:quality
```

## Historique conservé — 1.51

# DEADWALL 1.51.0 — Campagne, équilibrage et exploration

La progression vers les onze âges repose désormais sur une cité diversifiée, des capacités de ravitaillement opérationnelles, des habitants et des unités, des reconnaissances achevées, des sites effectivement récoltés et des hordes survécues. Répéter un bâtiment bon marché ne suffit plus à débloquer la mégaville. Les points physiques continuent à attirer les ennemis ; les connaissances acquises restent mémorisées après une perte.

L’objectif en Standard est **6 à 10 heures jusqu’au 11ᵉ âge**. Les simulations mesurent des bornes de cadence et les tests vérifient les conditions de progression ; une campagne humaine complète reste à chronométrer. Le premier Camp reste accessible avant la première horde. Les anciennes sauvegardes conservent leurs âges acquis.

Cette version corrige aussi la sortie de D17 à travers une défense, l’accès à certaines ressources selon la seed, la cohérence conduite/sauvegarde au bord du monde, les apparitions accumulées sous le plafond d’ennemis, la priorité des opérations payées et les mises à jour après une défaite. Guide : [docs/LIVRAISON_1_51.md](docs/LIVRAISON_1_51.md).

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:balance
```

Base cumulative : commit `69c3c35382e9f87ab0972fe025f87e9edf6d10dd` (1.50). Les preuves et archives historiques sont conservées. Destination autorisée : https://deadwall-last-enclosure.vercel.app/ ; les reçus de publication et de validation sont établis après exécution.

## Historique conservé — 1.50

# DEADWALL 1.50.0 — Onze âges, nouveaux choix

Les derniers âges de D-17 avaient beaucoup moins de nouveaux choix que le camp et l'avant-poste. Cette version ajoute 20 modèles de bâtiments, six chemins d'évolution, trois revêtements de route, quatre montages mécaniques à charges finies, quatre formations des compagnons et quatre cours de construction tardives. Chaque ajout utilise les ressources et les systèmes physiques du jeu.

Dans **Préparatifs → Catalogue des âges**, consultez les onze paliers, les coûts, les supports requis et les raisons d'un verrouillage. Quatre atlas originaux représentent les 20 nouveaux modèles. Guide : [docs/LIVRAISON_1_50.md](docs/LIVRAISON_1_50.md).

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:city
```

Base cumulative : commit `3a42ec0c20b536e6210273a3557cf63306d1ffb2` (1.49). Les vérifications de cette version et les distributions sont consignées après exécution ; les preuves historiques ci-dessous décrivent leurs propres versions. Destination demandée : https://deadwall-last-enclosure.vercel.app/ ; la fabrication locale ne constitue pas une publication distante.

## Historique conservé — 1.49

# DEADWALL 1.49.0 — D-17, du refuge à la mégaville

La croissance de D-17 comporte onze âges, jusqu’à Mégaville III à 1 850 points de constructions achevées. Le dossier Préparatifs explique désormais les capacités de stockage insuffisantes avant les gros chantiers. Les prix, seuils, collisions, ressources et sauvegardes restent ceux du jeu existant.

Six images originales complètent les centres, logements, industries, services, chantiers et cours de travail. Les sprites utilisent le chargeur d’art commun et les emprises physiques actuelles ; ils sont intégrés au web, à la PWA et au HTML autonome.

```sh
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:d17
```

Guide actuel : [docs/LIVRAISON_1_49.md](docs/LIVRAISON_1_49.md). Il détaille les onze seuils, le parcours contrôlé, les coûts et les mesures de temps. Les travaux seuls du parcours préparé prennent 13 min 23 s ; collecte, déplacements et combats sont exclus. La durée d’une campagne humaine complète reste à mesurer. Les résultats définitifs de vérification sont consignés séparément après exécution.

Base committée et poussée : `67bcb1f` (1.48). Les anciennes archives et leurs preuves sont conservées. Cette continuation ne constitue pas une attestation de publication Vercel.

## Historique conservé — 1.48

# DEADWALL 1.48.0 — Bastions & ateliers

Financez une avant-porte hérissée ou une redoute de maintenance, puis construisez leurs 17 ou 27 fondations ordinaires. Préparez sur un Hérisson deux montages mécaniques à six déclenchements depuis les matériaux du sac. Les nouveaux Porte-boucliers et Fonceurs ajoutent des faiblesses de position et de timing aux migrations de D-17, sans gonfler le total des vagues.

L’Armurerie propose un marteau d’assemblage, un arrache-clous de chantier et une carabine monocoup récupérée. Recettes, masses, délais et usure viennent du catalogue réel ; aucun chargeur n’est offert. Les outils de chantier occupés bloquent désormais le crafting, et les identifiants d’équipement hérités du prototype sont refusés avant mutation de sauvegarde.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:defenses
npm run test:preparations
npm run test:visibility
```

Guide courant : [docs/LIVRAISON_1_48.md](docs/LIVRAISON_1_48.md). Les parcours Campagne, Terrain, Tactiques, Assaut, cartes et Préparatifs restent exigés, puis navigateur/PWA/Standalone depuis les archives exactes. Résultats et empreintes sont consignés après exécution dans un rapport distinct ; les comptes ci-dessous restent historiques. Web/PWA, HTML autonome et Sources sont fabriqués avec manifests SHA-256 et provenance du checkout modifié.

Sauvegarde générale v20, générations G1–G7, visibilité physique et systèmes antérieurs conservés. Références 1.41–1.47 et anciens ZIP préservés. Destination Vercel : https://deadwall-last-enclosure.vercel.app/. Le jeton se crée sur https://vercel.com/account/tokens puis s’ajoute à `VERCEL_TOKEN` dans les secrets de l’environnement. Une configuration ou un staging préparé ne constitue pas une publication. Windows natif, appareils physiques, sessions humaines prolongées, signature et boutiques demandent encore leurs validations.

## Historique conservé — 1.47

# DEADWALL 1.47.0 — Fronts & ravitaillement

Préparez une tenaille ou un débordement latéral avec les mêmes effectifs et points de vie. Transportez les ingrédients dans le sac pour conditionner six cartouches ou compléter une cassette de réparation, avec du temps de travail sur un support physiquement accessible. Le briefing sépare les arrivées prévues des directions des contacts réellement observés.

Les Colonnes de rupture utilisent les Briseurs du catalogue réel. Continuer conserve l’ordre des prochains ennemis déjà tirés dans le buffer borné et leur timer. Sauvegarde générale v20, générations G1–G7 et contenu cumulatif conservés.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:preparations
npm run test:visibility
npm run test:campaign
npm run test:terrain
npm run test:tactics
npm run test:assault
npm run test:browser
npm run test:standalone
```

`npm run build` prépare le web/PWA et le HTML autonome. `npm run package:web` et `npm run package:source` créent les trois variantes avec manifests SHA-256. Guide : [docs/LIVRAISON_1_47.md](docs/LIVRAISON_1_47.md). Résultats courants, codes de sortie, captures et contrôles des archives extraites consignés séparément après exécution ; les preuves ci-dessous restent historiques.

Destination Vercel demandée : https://deadwall-last-enclosure.vercel.app/. L’authentification du projet existant et les accès réseau effectifs sont requis. La PWA fournit le support mobile ; le portable Windows et les appareils physiques demandent leurs essais propres. La préparation locale ne constitue pas une publication.

## Historique conservé — 1.46

# DEADWALL 1.46.0 — Veille & expéditions

Les cartes montrent désormais les infectés actuellement vus par le commandant, les unités alliées, les compagnons ou un poste opérationnel. La portée dépend de l’observateur ; murs, portes, étage, intérieurs et obscurité limitent la vue. Les lumières éclairent mais ne détectent personne seules. Un ennemi perdu de vue disparaît immédiatement, sans position mémorisée.

Treize ajouts jouables prolongent les systèmes existants : trois préparations de survie, deux opérations de ballot/cache, deux équipements de fortification, deux exercices de compagnons, deux contrats régionaux et deux ensembles de construction pour D-17. Ils demandent des ressources, du temps et des accès physiques. Le relais de veille et la cour de soins financent des fondations à construire ; les nouveaux contrats imposent une seule tentative et trois changements de vague pour revenir.

La reprise conserve les positions enregistrées des décors après une construction valide. Sauvegarde générale v20 et générations G1–G7 conservées ; aucun tirage de carte ni don de stock lors de la lecture des cartes ou de la migration.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:visibility
npm run test:campaign
npm run test:terrain
npm run test:tactics
npm run test:browser
npm run test:standalone
```

`npm run build` prépare le web/PWA et le HTML autonome. `npm run package:web` et `npm run package:source` créent les variantes avec manifests SHA-256. Guide actuel : [docs/LIVRAISON_1_46.md](docs/LIVRAISON_1_46.md). Les résultats courants, codes de sortie et contrôles des archives extraites sont consignés séparément après exécution ; les résultats 1.45 ci-dessous restent historiques.

Destination Vercel demandée : https://deadwall-last-enclosure.vercel.app/. Publier sur ce projet existant conserve l’origine utilisée par les sauvegardes du navigateur. La publication exige une authentification Vercel et des accès réseau effectifs ; une configuration préparée ne vaut pas publication. La PWA est le support mobile ; la fabrication et l’essai du portable Windows se font sur Windows.

## Historique conservé — 1.45

# DEADWALL 1.45.0 — Commandement & terrain

Préparez le prochain âge de D-17 depuis le score réellement construit, les chantiers financés et les coûts du catalogue. Le pic atteint conserve les connaissances ; il ne remplace pas les points des structures encore debout. Le potentiel des chantiers reste conditionnel à leur achèvement et à leur survie. Le bouton de gestion ouvre les chantiers existants, sans lancer de construction ou de dépense automatique.

Le repli des sections exige maintenant un accès physique à la redoute ou au centre, même à portée : une épave peut imposer un détour et une porte verrouillée peut bloquer le trajet. Les Traqueurs locaux abandonnent immédiatement une proie partie dans la région, tout en continuant de chasser les survivants encore présents dans D-17.

Les préparations de Survie reconnaissent les menaces physiques régionales, y compris une dépouille réanimée. Sac & Relais affiche la disponibilité et la raison du refus depuis le même diagnostic que le transfert réel. Stocks, quantités, coûts et format général v20 restent conservés. En paysage régional, le dock compact donne accès aux commandes du terrain en laissant une zone jouable ; les dimensions et limites mesurées figurent dans le guide.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
# Ouvrir l'adresse locale affichée, normalement http://127.0.0.1:4173
```

```sh
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:campaign
npm run test:terrain
npm run test:tactics
npm run test:browser
npm run test:standalone
```

Le parcours natif de campagne 1.45 passe **196/196 contrôles**, 49 sur chacun de quatre formats, avec récolte, dépôt, construction payée, progression urbaine, premier assaut et reprise. Le parcours tactique passe **34/34** avec fixtures explicitement déclarées sur desktop et portrait. Aucun de leurs collecteurs n'enregistre d'erreur navigateur ou réseau. Le compte final de la suite complète, ses durées et les contrôles depuis les archives extraites sont consignés dans un rapport de validation distinct ; aucun résultat historique n'est présenté comme preuve 1.45.

`npm run build` fabrique le HTML autonome. `npm run package:web` crée les variantes joueur web/PWA et autonome ; `npm run package:source` livre sources, tests, docs et codex séparément. Les fabrications exigent un dépôt Git avec un commit ; l'archive source exclut `.git`, mais reste utilisable pour démarrer, construire et tester le jeu. Les manifests déclarent le commit et l'état réel du checkout, y compris ses changements non committés.

Guide actuel : [docs/LIVRAISON_1_45.md](docs/LIVRAISON_1_45.md). Références et archives 1.41–1.44 conservées. Mobile via PWA HTTPS ; portable Windows à fabriquer et essayer sur Windows. Le contrôle autonome HTTP du cloud est distinct d'une ouverture `file://`. Appareils physiques, sessions humaines longues, signature et publication boutique restent à vérifier avant mise en vente.

## Historique conservé — 1.44

# DEADWALL 1.44.0 — Terrains & reconquête

Marchez sur les dessertes réellement goudronnées, trouvez l'escalier par sa direction et sa distance, puis préparez les soins et la logistique avant le siège. Les routes G4–G7 utilisent leur profil de sol existant ; les générations, la géométrie et les stocks restent conservés. Les boutons d'étage et les actions de bivouac partagent leur diagnostic réel ; une blessure interrompt le pansement et annonce la perte du soin restant.

La supervision de D-17 distingue les munitions disponibles de la consigne de réserve. La remise en chantier historique des ruines demande confirmation et utilise le placement normal au coût plein, puis le travail physique ordinaire. Le HUD expose présents, attente, fronts actifs et prochain échelon ; le commandement garde sa pause réelle. Le format général de sauvegarde reste v20.

En paysage, le rail d'alerte conserve ses trois accès pendant la lecture de Personnel et le défilement tactile reste stable. Le déplacement repris après fermeture du commandement reste maintenu ; un refus de Fin du jour affiche durablement sa raison.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
# Ouvrir l'adresse locale affichée, normalement http://127.0.0.1:4173
```

```sh
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:browser
npm run test:campaign
npm run test:tactics
npm run test:journey
npm run test:assault
npm run test:reconstruction
npm run test:standalone
```

La suite complète avec endurance réussit **2482/2482 tests**, sans échec, annulation, test ignoré ou restant à faire ; la syntaxe de **202 fichiers** est vérifiée et le build produit **209 fichiers publics**. La commande complète termine avec le code 0 en environ 23 minutes 20 secondes.

Les parcours natifs sur les sources 1.44 passent **148/148 contrôles** de campagne et **208/208** sur une autre graine, chacun sur quatre formats. Les scènes avancées explicitement construites comme fixtures passent **69/69** pour l'assaut, **16/16** pour la reconstruction et **34/34** pour le repli/récompense. Aucun de leurs collecteurs n'enregistre d'erreur navigateur ou réseau. Ces preuves portent sur les sources figées ; les contrôles des archives finales sont consignés dans un rapport distinct après fabrication. Les résultats de la 1.43 ci-dessous restent historiques.

`npm run build` génère le HTML autonome. `npm run package:web` fabrique les variantes joueur web/PWA et autonome ; `npm run package:source` conserve sources, tests, docs et codex séparément. Sur téléphone, utiliser la PWA HTTPS après une première visite connectée. Fabriquer et tester le portable Windows sur Windows. Le cloud bloque `file://` : `npm run test:standalone -- --transport http` contrôle les octets autonomes via un serveur local et ne certifie pas l'ouverture disque.

Guide actuel et périmètre : [docs/LIVRAISON_1_44.md](docs/LIVRAISON_1_44.md). Archives 1.41–1.43 préservées. Signature Windows, appareils physiques et démarches de mise en vente restent à finaliser avant publication commerciale.

## Historique conservé — 1.43

# DEADWALL 1.43.0 — Repli & préparatifs

Préparez les accès de D-17 avant la nuit, suivez les fronts depuis le terrain et repliez vos sections vers une redoute ou le centre. Les soldats marchent par les accès physiques et ripostent sans poursuivre ; murs et portes gardent leurs collisions. Le HUD expose les annonces de siège et l’alerte du centre, avec accès direct aux préparatifs, aux portes et aux sections.

Un objectif rempli conserve désormais sa récompense entière quand le dépôt est plein : il attend la place nécessaire, indique ce qui manque et ne verse rien deux fois. Le format de sauvegarde v20 et les cartes G1–G7 restent conservés ; les anciennes sauvegardes reprennent leurs possessions.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
# Ouvrir l’adresse locale affichée, normalement http://127.0.0.1:4173
```

`npm run build` produit le HTML autonome. `npm run package:web` fabrique les archives joueur PWA et autonome ; `npm run package:source` conserve sources, tests, docs et codex dans une archive séparée. Sur téléphone, ajouter le site HTTPS à l’écran d’accueil après une première visite connectée. La fabrication et les essais du portable Windows s’effectuent sur Windows ; le profil `%APPDATA%\DEADWALL` doit être préservé lors d’une mise à jour.

```sh
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:browser
npm run test:campaign
npm run test:tactics
npm run test:standalone
# Chromium déjà installé : CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:campaign
```

Le cloud administré bloque `file://` : `npm run test:standalone -- --transport http` contrôle les octets autonomes via un serveur local. Une ouverture directe depuis le disque reste à vérifier sur un navigateur de PC.

La suite complète avec endurance passe **2410/2410 tests**, aucun échec ou test ignoré, avec contrôle de syntaxe de 198 fichiers. La campagne 1.43 par commandes réelles passe 148 contrôles sur quatre formats Chromium, dont portrait et paysage tactiles, sans ressources ou temps injectés. Les scènes avancées de repli et de récompense passent 34 contrôles avec fixtures explicites. Ces résultats portent sur les sources figées ; les archives ont leurs manifests d'intégrité et leurs contrôles séparés. Ils ne certifient ni matériel mobile, ni Windows natif, ni campagne longue équilibrée.

Guide actuel et validation : [docs/LIVRAISON_1_43.md](docs/LIVRAISON_1_43.md). Les livrables 1.42 restent conservés séparément. Signature Windows, appareils physiques et démarches de mise en vente restent à finaliser avant publication commerciale.

## Historique conservé — 1.42

# DEADWALL 1.42.0 — Consolidation

Construisez et ravitaillez D-17, explorez une région de 24,576 km de côté et préparez plusieurs enceintes contre les hordes. Cette version reprend tout le contenu de la 1.41 : nouvelles campagnes G7, douze biomes, 34 agglomérations, ateliers, véhicules, équipes et progression. Les anciennes campagnes conservent leur génération et leurs possessions ; le format de sauvegarde reste v20.

La consolidation corrige l’installation du poste de commandement en navigateur réel, le bandeau des réserves et le suivi de l’objectif. Elle améliore les exports/imports de sauvegardes et accélère la construction des territoires sans changer leur contenu. Les parcours navigateur et PWA hors ligne disposent maintenant de contrôles reproductibles.

```sh
# Node.js 24 conseillé ; 22.12 minimum
npm ci
npm start
# Ouvrir l’adresse locale affichée, normalement http://127.0.0.1:4173
```

Pour jouer sans serveur, `npm run build` produit `DEADWALL_Standalone.html`. `npm run package:web` prépare les archives web/PWA et autonome avec leurs notices et empreintes. Sur téléphone, utiliser le site HTTPS puis l’ajouter à l’écran d’accueil ; une première ouverture en ligne est nécessaire pour remplir le cache hors ligne. La version mobile est celle du navigateur/PWA.

```sh
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:browser
npm run test:standalone
# Avec Chromium déjà installé : CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
node scripts/benchmark-generation.cjs /chemin/vers/une/copie/1.41
```

Sur Windows 10/11 x64, `npm run package:desktop` fabrique une archive portable, puis `npm run test:desktop -- --archive <archive.zip>` vérifie deux lancements du paquet extrait. Les outils et la CI sont fournis ; un exécutable Windows ne peut être validé depuis cet environnement Linux.

Guide de livraison et périmètre : [docs/LIVRAISON_1_42.md](docs/LIVRAISON_1_42.md). La signature Windows, les essais sur appareils physiques et les démarches de mise en vente restent à finaliser avant publication commerciale.

Dans le cloud administré, `file://` est bloqué. Le contrôle du HTML autonome utilise `npm run test:standalone -- --transport http` et distingue ce résultat de l’ouverture directe depuis le disque.

## Historique conservé — 1.41

# DEADWALL 1.41.0 — Territoires & exploration

Les nouvelles campagnes utilisent G7 : implantation variable de D-17, rues irrégulières, programmes locaux de logement et services, neuf communautés naturelles réparties dans les douze biomes existants, et plans intérieurs miroirs déterministes. Les générations G1–G6 conservent leurs cartes, contenants et prélèvements ; elles profitent du cadrage corrigé de l’atlas, des sols enrichis et des corrections de tournée.

La carte montre l’étendue réelle dès son premier affichage. Inspection du terrain et noms de biomes utilisent la même graine que le monde. Les tournées par biome ne proposent que des lieux déjà repérés. Deux sprites originaux de roseaux et branche tombée sont intégrés au terrain ; 53 images sont chargées par le registre commun.

Extraire puis ouvrir `DEADWALL_Standalone.html`. Guide : [docs/LIVRAISON_1_41.md](docs/LIVRAISON_1_41.md) ; validation finale et comparaisons : `reports/1.41.0/`. Pour découvrir les nouveaux territoires G7, créer une nouvelle campagne ; continuer une sauvegarde conserve sa génération. Les captures proviennent des vrais peintres Canvas ; le CSS et le tactile dans un navigateur réel restent à vérifier.

## Historique conservé — 1.40

# DEADWALL 1.40.0 — Parcours & ateliers

Version cumulative : sorties de véhicule à travers les barricades corrigées, ateliers et matériel cohérents avec les mains occupées, anciens soins et dépôts raccordés, clavier du carnet et devis d’annexes complétés. Deux sprites originaux transparents pour fourgon et buggy ; 51 images chargées. Coûts, statistiques, cartes et formats de sauvegarde conservés.

Validation finale avec endurance : **2 301/2 301 tests**, deux parcours intégrés réussis, aucun test ignoré.

Extraire puis ouvrir `DEADWALL_Standalone.html`. Guide : [docs/LIVRAISON_1_40.md](docs/LIVRAISON_1_40.md) ; rapport et preuves : `reports/1.40.0/`. Le CSS/tactile en navigateur réel ne sont pas certifiés par le DOM simulé et Canvas natif.

# DEADWALL 1.39.0 — Mains & véhicules

Extraire le ZIP complet puis ouvrir `DEADWALL_Standalone.html`. Les sauvegardes 1.38 se reprennent directement ; les anciennes générations conservent leur carte et leurs possessions.

Cette passe corrige les manipulations pendant une recharge ou le contrôle manuel d’un mirador, le ramassage à travers un bâtiment, les menaces oubliées autour des modules, l’annulation des travaux à la mort et le focus de l’établi lorsque ses actions deviennent indisponibles.

Deux sprites transparents complètent les bus et camions dans D-17 et la région. Profondeur, visibilité et indicateur de santé suivent le profil existant. Les 31 images ajoutées en 1.36–1.38 restent intégrées. Guide : [docs/LIVRAISON_1_39.md](docs/LIVRAISON_1_39.md) ; comparaisons et preuves : `reports/1.39.0/`.

Les captures Canvas natives et contrôles sous DOM simulé ne certifient pas le CSS dans un navigateur, le tactile matériel, l’audio ou les FPS GPU. L’échelle compacte historique des véhicules locaux reste décrite dans le guide.

## Historique conservé — 1.38

# DEADWALL 1.38.0 — Passages & survie

Extraire le ZIP complet puis ouvrir `DEADWALL_Standalone.html`. Les sauvegardes 1.37 se reprennent directement ; les anciennes générations gardent leur carte et leurs possessions.

Cette passe corrige les sorties de D-17 en gros véhicule, les portières et épaves, les collisions des annexes, les gestes concurrents pendant une recharge, les soins à travers les obstacles et les transitions de mini-jeux vers les menus. Les tirs arrêtent désormais leur trajet sur une barricade trop proche du canon. Les contrôleurs existants et leurs coûts restent la référence.

Deux textures individuelles complètent les toitures techniques et sols industriels. Les ombres régionales gardent une direction commune après rotation. Les 29 images ajoutées en 1.36–1.37 restent intégrées. Guide : [docs/LIVRAISON_1_38.md](docs/LIVRAISON_1_38.md) ; preuves et comparaisons : `reports/1.38.0/`.

Les contrôles automatisés et les captures Canvas natives ne certifient pas le CSS dans un navigateur, le tactile matériel, l’audio ou les FPS GPU.

## Historique conservé — 1.37

# DEADWALL 1.37.0 — Accès & interactions

Extraire le ZIP complet puis ouvrir `DEADWALL_Standalone.html`. Les sauvegardes 1.36 se reprennent directement ; les anciennes générations gardent leur carte et leurs possessions.

Cette passe corrige les accès aux escaliers, les emprises de gros véhicules, la continuité des modales, le zoom régional, le ciblage des attaques et plusieurs raccords entre travaux, énergie et interactions. Les détails et preuves sont dans [docs/LIVRAISON_1_37.md](docs/LIVRAISON_1_37.md) et `reports/1.37.0/`.

Deux sprites individuels complètent les poses accroupie et allongée du survivant. Les 27 images de la 1.36 restent intégrées. Les contrôles automatisés et les captures Canvas natives ne certifient pas le CSS dans un navigateur, le tactile matériel, l’audio ou les FPS GPU.

## Historique conservé — 1.36

# DEADWALL 1.36.0 — Réparations & matières

Extraire le ZIP complet puis ouvrir `DEADWALL_Standalone.html`. **Une campagne 1.35 G6 peut être continuée directement : aucune nouvelle partie n'est nécessaire pour ces corrections et illustrations.** Les générations G1–G5 gardent également leur carte et leurs possessions.

Cette version consolide les systèmes existants : HUD tactile et focus, commandes de mini-jeux, cycle des armes portées, reprise après conduite, atelier de relève, crosse et poings en région, état des groupes électrogènes, reconnaissance des villes G6 et dessin des intersections de D-17. Le coût CPU du dessin de la carte est réduit par des lectures légères et une couche routière mise en cache.

**27 PNG individuels** sont intégrés au terrain, à l'équipement, aux postes déployés et aux interventions : les neuf essences d'arbres et quatre familles minérales de G6, deux textures de sol, trois illustrations techniques, cinq armes/outils et quatre postes. Les autres équipements gardent des silhouettes SVG ou les atlas existants. Les outils réellement tenus sont représentés par des compositions vectorielles adaptées ; il ne s'agit pas de nouveaux cycles animés pour chaque arme.

Guide : [docs/LIVRAISON_1_36.md](docs/LIVRAISON_1_36.md). Résultats et captures : `reports/1.36.0/`. Le rapport final précise les vérifications réalisées ; ces corrections ne constituent pas une garantie d'absence de tout défaut. Les captures utilisent les vrais peintres Canvas sous DOM simulé. Rendu CSS dans un navigateur, tactile matériel, audio et FPS GPU restent non certifiés. Aucun nouveau déploiement distant n'est annoncé.

## Historique conservé — 1.35

# DEADWALL 1.35.0 — Terres vivantes

Extraire le ZIP puis ouvrir `DEADWALL_Standalone.html`. Pour découvrir la nouvelle géographie, créer une **nouvelle campagne**. Continuer une ancienne sauvegarde préserve son terrain et ses possessions.

## Monde G6

La région de 24,576 km de côté se développe autour d’un D-17 dont la position varie avec la graine. Trente-quatre agglomérations irrégulières et leurs dessertes partagent un réseau connecté, avec courbes, ramifications et boucles. Les 62 programmes de bâtiments existants sont implantés selon les milieux compatibles ; ce ne sont pas 62 modèles nouvellement dessinés.

Douze biomes jouables : prairies, bocage, forêt de feuillus, forêt mixte, conifères, bois humides, roselières, landes sèches, collines calcaires, hauts plateaux, vergers abandonnés et friches reconquises. Neuf essences, quatre familles de roches, huit familles de petit décor et six profils régionaux d’infectés sont répartis par la graine. Les sols utilisent des champs continus, des transitions et un détail ancré aux coordonnées du monde. La carte, le terrain et la projection du refuge partagent la même position.

La même graine et la même génération reproduisent le terrain. Champ vide : chaque nouvelle campagne reçoit une nouvelle graine. L’aperçu ne prépare que le prochain départ ; il ne fige plus silencieusement toutes les parties suivantes.

## HUD et cohérence

Les instruments sont répartis entre un bandeau, une colonne construction, les dossiers Situation/Carte, les interactions et le matériel. Les vrais boutons et leurs écouteurs sont conservés. Vague et horloge restent visibles ; les interventions respectent les modales. Les flèches de menace utilisent une zone libre mesurée en cache.

Une roche entièrement récoltée cesse de bloquer le joueur, les véhicules et les rayons, y compris après reprise. Les souches gardent une petite emprise visible. Les tournées, le retour, les missions, les annexes et les exclusions des hordes suivent désormais le vrai D-17.

## Documents et vérification

Guide : `docs/LIVRAISON_1_35.md`. Codex : `codex-3000/addendum-1.35/LIRE_BIOMES_1_35.html`. Les fiches sont dérivées des définitions jouables ; aucun relief 3D, rivière navigable ou nouvelle faction humaine n’est sous-entendu.

Le rapport final rassemble les résultats automatisés et des captures du moteur Canvas sous DOM simulé. Le rendu CSS dans un navigateur, le tactile, l’audio et les FPS GPU ne sont pas certifiés dans cet environnement. Aucun nouveau déploiement distant n’est inclus.

## Historique conservé

# DEADWALL 1.34.0 — Armement & ateliers

37 profils d’armement, trois mini-jeux techniques, barricades physiques et corrections de perspective/collision. Ouvrir `DEADWALL_Standalone.html` après extraction. Guide complet : [docs/LIVRAISON_1_34.md](docs/LIVRAISON_1_34.md).

Les anciennes sauvegardes sont migrées ; armes, chargeurs et dépouilles restent récupérables. Les 3 000 fiches historiques sont conservées, avec un nouvel addendum dédié à l’armement.

## Historique — 1.33

# DEADWALL 1.33.0 — Routes & Relève

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. Depuis les sources Git : `npm run build` génère cette version autonome ; `npm start` sert le jeu localement.

## D-17 et son terrain

Les nouvelles campagnes utilisent le plan local révision 3 : collectrices asymétriques, parcelles et accès varient avec la graine, au-delà de la rotation historique. La voie centrale contourne le dépôt. Collisions, projection régionale, carte et navigation réutilisent le même plan. Les sauvegardes précédentes gardent leur ancienne révision ; charger une campagne ne reconstruit pas ses quartiers.

Les gisements sont moins nombreux et plus espacés dans les nouvelles parties, avec une réserve de départ accessible. Sur les deux graines contrôlées, 10 gisements restent dans les 600 unités du dépôt, contre 60 à 62 auparavant. Les quantités déjà sauvegardées restent conservées. Huit familles de petits décors donnent des usages au terrain : avaloirs, regards, fissures, déchets, touffes, souches, bornes et bancs. Ils n’ajoutent pas de stocks récoltables.

L’exclusion de végétation inclut désormais les chaussées et les accès privés des bâtiments. Les anciens identifiants et prélèvements sont conservés lors du dégagement.

## Mort et relève

La mort du héros laisse une dépouille et un sac persistant au point réel du décès, y compris dans la région et à l’étage. Les ressources, chargeurs, armes, kits et équipements personnels transférés peuvent être repris sur place ; le reliquat reste au sol si le nouveau sac est plein. Les appareils portables gardent leur propre système de chute.

Le risque de réanimation est de **30 %**, avec un délai de **75 à 150 secondes de simulation**. Le tirage est sauvegardé : recharger ne le relance pas. Un corps relevé devient un ennemi attaquable ; le sac reste à sa position d’origine. La relève propose trois archétypes aux contreparties différentes. Elle suspend le temps pendant le choix et reprend au dépôt, sans offrir d’armes ou de munitions. L’armurerie permet de réquisitionner une arme vide avec la ferraille du dépôt. La destruction du centre garde la priorité sur la relève.

Les limites techniques, la migration et les règles de conservation sont détaillées dans `docs/SUCCESSION_1_33.md`.

## Animations et codex routier

Deux nouvelles planches originales contiennent **64 poses**, soit huit gestes de huit poses : hache, pioche, récupération, ramassage/dépôt, chantier, déblaiement, pansement et ouverture de réserve. Elles suivent les transactions et actions réellement exécutées ; le déplacement, le tir et les interruptions reprennent leur priorité. Les planches, les rectangles/pivots et les prompts sont inclus dans `assets/`.

Le codex ajoute **51 profils routiers et 204 variantes de forme** : sentiers, terre, pierre, campagne, départementales, rues, autoroutes 2×2/2×3/2×4, bretelles, échangeurs, giratoires, ponts, tunnels et abords. Trois profils décrivent le réseau actuel ; 48 sont des programmes de conception. Leur présence dans le guide ne signifie pas que des autoroutes ou tunnels fonctionnels sont déjà générés. Voir `docs/codex/ROUTES_1_33.md` et `codex-3000/addendum-1.33/LIRE_ROUTES.html`.

## Vérifications et publication

Résultats, rendus natifs et tests : `reports/1.33.0/`. Les captures emploient les vrais peintres Canvas sous DOM simulé. Le navigateur local demeure bloqué dans l’environnement : le rendu CSS interactif, le tactile et la fluidité GPU ne sont pas certifiés.

La publication distante reste bloquée par le refus d’écriture GitHub constaté en 1.32 et l’absence d’action de déploiement Vercel disponible. Aucun nouveau déploiement n’est annoncé. Le paquet contient les sources, le build et le jeu autonome ; un bundle Git local prépare la mise à jour quand l’accès sera rétabli.

## Historique conservé — 1.32

# DEADWALL 1.32.0 — Première transmission

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. Depuis les sources Git : `npm run build` pour générer ce fichier, ou `npm start` puis `http://127.0.0.1:4173/` (Node.js 22.12 ou plus récent).

## Arrivée à D-17

Les commandes Nouvelle partie et Continuer attendent la fin du chargement des modules. Chaque nouvelle campagne commence désormais par quatre tableaux illustrés : la route, le dépôt, la relève et les premières priorités. Le temps, les ennemis, la consommation et les commandes sont suspendus pendant cette introduction. Les boutons permettent d’avancer, revenir ou passer ; la touche Échap permet de passer. Le dernier tableau tient compte du scénario choisi. Ce sont des tableaux animés et des textes, sans doublage ni cinématique 3D.

Le suivi des trois premiers gestes s’active automatiquement : récolter personnellement, déposer son chargement, puis financer et achever une construction réelle. Passer l’introduction conserve ce suivi. Charger une sauvegarde ne relance pas le film. Les systèmes et sauvegardes v20 précédents sont conservés.

## Présentation

Écran titre organisé autour du dossier de départ ; détails de ravitaillement, graine et sauvegarde consultables à la demande. Commandement, pause, opérations, inventaire et HUD partagent une palette de terrain et des pictogrammes originaux. Trois nouvelles illustrations originales accompagnent l’arrivée et le poste de commandement. Les animations respectent le réglage de mouvement réduit. Prompts et provenance : `assets/PROVENANCE_1_32.json`.

## Vérification et publication

Résultats de cette passe : `reports/1.32.0/`. Le contrôle navigateur de la production a confirmé la version 1.0.0 et le départ immédiat sans introduction. L’ouverture locale est bloquée par la politique du navigateur ; le rendu CSS de la nouvelle version, le tactile et les FPS GPU ne sont donc pas certifiés. Les tests DOM/simulation sont distincts des observations visuelles.

La publication a été demandée mais l’intégration GitHub refuse les écritures avec HTTP 403 « Resource not accessible by integration ». L’action de déploiement Vercel est indisponible. Aucun nouveau commit distant ni nouveau déploiement n’est annoncé. Un commit et un bundle locaux sont préparés pour synchroniser le dépôt après rétablissement de l’accès. Voir `reports/1.32.0/DEPLOIEMENT.md`.

## Historique conservé — 1.31

# DEADWALL 1.31.0 — Horizons lointains

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. Autre lancement : `npm start`, puis `http://127.0.0.1:4173/` avec Node.js 22.12 ou plus récent.

## Nouveau territoire

Les nouvelles parties utilisent une région de **24,576 km de côté**, soit neuf fois la surface précédente. La région historique de 8,192 km reste en place avec ses lieux et identifiants. Une campagne G4 existante peut ouvrir les nouvelles routes depuis **Commandement → Terrain → Opérations → Région → Relais lointains**, au dépôt. Ce choix conserve les prélèvements et destructions antérieurs. Les anciennes générations restent rechargeables ; elles ne sont pas remplacées arbitrairement.

Les détails végétaux et plans intérieurs sont créés à la demande, avec caches limités. Le butin pris et les ennemis tués sont persistés séparément : quitter un secteur ne le réapprovisionne pas. Les routes utilisent un index spatial exact. Les mesures CPU et leurs limites figurent dans le rapport ; elles ne promettent pas une cadence GPU.

## Seize extensions jouables

| Domaine | Quatre ajouts |
| --- | --- |
| Défense D-17 | Consigne jour/alerte sur portes ; réfection financée et effectuée par ingénieurs ; outillage consommable de chantier ; arcs de tir de 90° |
| Exploration | Profils de chargement au dépôt ; siphonnage du vrai réservoir ; révision moteur limitée à 2 km ; démontage fini des épaves |
| Joueur | Gilet à protection finie et effort accru ; entretien pour huit rechargements ; cartouchière approvisionnée ; outils de construction manuelle consommables |
| Monde | Relais lointains à ravitailler ; certification des bâtiments dégagés ; réserves scellées finies ; relevés physiques des carrefours |

Ces ordres utilisent les mêmes ressources, positions, sacs et véhicules que le jeu existant. Les menus indiquent les coûts et conditions. Les opérations se préparent en pause puis s’exécutent réellement sur le terrain. Les anciens modules restent accessibles dans cinq domaines : D-17, Expéditions, Équipement, Région et Archives.

Le rechargement loin d’un dépôt prend uniquement les munitions réellement portées. Préparer son sac ou sa cartouchière devient nécessaire. L’équipement personnel affiche ses masses et réserves restantes dans l’inventaire.

## Chroniques et codex

Huit arcs contiennent 24 traces originales : archives de la base, route, enquêtes et récits de survivants. Le prologue facultatif suit trois gestes réels. Trois courtes liaisons illustrées par la carte active sont passables ; elles ne sont pas des cinématiques 3D. Deux décisions persistantes modifient les enquêtes suivantes. Les journaux audio sont présentés comme transcriptions ; aucune voix enregistrée n’est annoncée.

Le guide reçoit 100 fiches : 96 programmes modulaires de conception et quatre fiches sur les règles G5 utilisées. Les 24 profils de milieux et 72 lignes de probabilités distinguent le projet du disponible. **Quatre biomes sont effectivement employés par les nouveaux secteurs**. Les camps humains hostiles restent désactivés, avec probabilité effective nulle ; le jeu n’invente pas une IA de faction. Le compagnon historique de 3 000 fiches est conservé avec un addendum séparé et ses 1 051 originaux vérifiés par empreinte.

## Contrôles et livraison

Les sources, build `dist`, HTML autonome, tests, codex et documentation sont inclus. Les dix profils d’audit et la vérification finale `DEADWALL_SOAK=1 npm run check` sont consignés dans `reports/1.31.0/`. Les captures exécutent les vrais peintres Canvas sur des scènes préparées sous DOM simulé. Le lancement navigateur a été refusé dans l’environnement de vérification : rendu CSS interactif, tactile physique, audio et FPS GPU ne sont pas certifiés. Les audits par agents et tests automatisés ne sont pas dix campagnes humaines.

Les sauvegardes restent au format général v20 avec registres additifs validés avant remplacement du monde. Aucun exécutable signé ni déploiement distant n’est inclus. Les notes suivantes décrivent les versions précédentes ; les rapports lourds historiques ne sont pas répétés dans ce paquet.

## Historique conservé — 1.30

# DEADWALL 1.30.0 — GPS, plans & défense

Version complète : extraire l’archive puis ouvrir `DEADWALL_Standalone.html`. Autre lancement : `npm start`, puis `http://127.0.0.1:4173/` avec Node.js 22.12 ou plus récent.

## Corrections de cette livraison

- **Plans de rendu** : personnages, infectés, compagnons, véhicules, meubles, murs, rochers, végétation et matériel régional partagent leur ordre de profondeur. Les équipements respectent les intérieurs et les étages ; le matériel porté suit son porteur. Les lampes et modules locaux rejoignent le tri de D-17 et sa projection dans la région.
- **GPS hors de D-17** : position et graine actuelles, destination, trajet, distance, direction de retour au bastion, carte centrée sur le joueur. Les étages montrent leur plan et leurs escaliers ; le guidage extérieur rappelle de rejoindre le rez-de-chaussée. Les repères locaux ne sont plus peints à l’échelle erronée sur la région.
- **Jambes et visée** : nouvel atlas debout vu du dessus avec pivots mesurés, pieds courts et phase de repos neutre. Le cycle local ne redémarre plus à chaque interaction. Torse aligné immédiatement avec les tirs ; bassin progressif avec torsion bornée, recul et pas latéraux.
- **Prévention de départ** : avertissement près d’une sortie et lors du franchissement, fondé sur les postes et fusiliers réellement disponibles, munitions et pannes. Rappels au crépuscule et à l’assaut pendant l’absence. Le bastion continue de vivre et peut tomber ; l’avertissement ne bloque pas la sortie et ne garantit jamais la sécurité.
- **Commandes et pause** : sorties par les quatre flèches raccordées ; un mirador manuel est libéré lors du départ. Après perte de focus dans commandement, inventaire, aide ou paramètres, la fermeture conserve la pause jusqu’à votre reprise volontaire.

Quatre audits indépendants ont examiné les plans, la navigation, l’anatomie/les commandes et la défense/progression, puis relu les lots croisés. La vérification intégrée emploie `DEADWALL_SOAK=1 npm run check`. Rapports et captures : `reports/1.30.0/`.

Les sauvegardes v20 et tous les systèmes précédents sont conservés. La prévention de départ et l’animation restent dérivées de la simulation ; elles n’ajoutent aucun état persistant. L’atlas debout ne remplace pas les atlas des autres postures, de recharge et de travail, qui gardent leur perspective historique. Les cinq packs, le contenu nocturne et les 3 000 fiches du codex restent inclus.

Les captures emploient les véritables peintres Canvas et des scènes préparées sous DOM simulé. Le navigateur demeure bloqué dans cet environnement : CSS interactif, tactile physique, audio et FPS GPU ne sont pas certifiés. Le paquet contient le jeu HTML/PWA et ses sources, sans exécutable signé ni déploiement distant.

## Historique conservé — 1.29

# DEADWALL 1.29.0 — Terrain & équipement

Version complète : extraire l’archive puis ouvrir `DEADWALL_Standalone.html`. Autre lancement : `npm start`, puis `http://127.0.0.1:4173/` avec Node.js 22.12 ou plus récent.

## Corrections de cette livraison

- D-17 observé depuis la région emploie le vrai terrain local, ses constructions, stations, décors, infectés, camps et matériel déposé. Les cartes utilisent le plan de la campagne active.
- Nouvelle partie sans graine : nouveau tirage, y compris avec une horloge identique. « Tirer une graine » et l’aperçu fixent un nombre reproductible. « Rejouer cette carte » conserve volontairement la graine. La région est générée par graine ; D-17 conserve ses lieux structurants avec quatre orientations pour les nouvelles campagnes. Les anciennes sauvegardes conservent leur plan.
- Chaussées et accès de bâtiments dessinés en réseau commun : raccords ouverts, accotements cohérents et marquages interrompus aux carrefours.
- Résidents régionaux placés sur des positions libres, dont des abords extérieurs. Les hordes possèdent des contacts individuels dessinés et touchables aux mêmes coordonnées ; tirs dans les espaces libres possibles.
- Pelle : **K**. Postures : **C** accroupi/debout, **X** allongé/debout. Plus de double action sur X.
- Commandant debout : torse et jambes séparés, recul, déplacement latéral, torsion bornée et pivot progressif. Les animations de travail, recharge et autres postures sont conservées.
- Commandement : écran tactique illustré avec carte réelle, réserves, état de la cité, navigation et accès aux contrôles existants.
- Inventaire : **I**, personnage, armes disponibles, ceinture, portage lourd, sac, coffre et sacoches des compagnons. Grilles déplaçables et pivotables, quantités, poids et transferts physiques vers les vrais stocks.

Le format général de sauvegarde reste v20. Les registres de rangement, de plan local et de contacts régionaux sont additifs ; les anciens fichiers migrent sans cadeau de matériel. Les cinq packs d’opérations, équipements nocturnes et 3 000 fiches de conception sont conservés.

Vérification intégrée et rapports indépendants : `reports/1.29.0/`. Commande : `DEADWALL_SOAK=1 npm run check`. Le rapport HTML illustre les véritables rendus Canvas et précise les tests réalisés. Les captures sont des scènes préparées sous DOM simulé. Le lancement du navigateur étant bloqué dans cet environnement, le rendu CSS interactif, le tactile physique, l’audio et les FPS ne sont pas certifiés. Aucun exécutable Windows signé ou déploiement distant n’est inclus.

Les bâtiments et véhicules régionaux conservent leur rendu géométrique. La variété de D-17 n’est pas une génération libre de ses quartiers : ses orientations changent, ses repères structurants restent reconnaissables. Les bagages n’ajoutent pas d’armures ou de vêtements à statistiques fictives.

## Historique conservé — 1.28

# DEADWALL 1.28.0 — Terrain & cohérence

Version complète : ouvrir `DEADWALL_Standalone.html`, ou lancer `npm start` puis `http://127.0.0.1:4173/` avec Node.js 22.12 ou plus récent.

Cette reprise consolide les cinq packs d’Opérations, les nuits et leurs interfaces :

- Compagnons régionaux dessinés avec les atlas de leurs rôles, cycles arrêtés en pause, masquage sous les toits fermés et hors champ.
- Lampes déposées au lieu réel de la mise à terre, même à l’étage ; pose et récupération respectant aussi les murs des lieux G4.
- Interventions interrompues correctement par les commandes brèves, le rechargement ou la mise à terre suivie d’une réanimation immédiate.
- Caisson de défense respectant le contrôle manuel d’un mirador ; import refusant les positions d’étage hors du bâtiment indiqué.
- Focus clavier rendu après fermeture des opérations, actions indisponibles expliquées, annulation de prospection accessible.
- Position et résumé matériel consultés sans générer toute la région ; dossier masqué sans calcul de ses objectifs.

Les sauvegardes restent en v20. Les cinq extensions, leurs coûts, les équipements nocturnes, les 64 poses du commandant, les huit sprites d’opérations et les 3 000 fiches de conception sont conservés. Aucun nouveau pack ni nouvel atlas n’est annoncé dans cette passe de consolidation.

Résultats, quatre audits indépendants, revues croisées, mesures CPU et cinq captures : `reports/1.28.0/`. Lancer `DEADWALL_SOAK=1 npm run check` pour la vérification intégrée. Les captures emploient le moteur Canvas réel sous DOM simulé. La validation de navigateur, du tactile, de l’audio et des FPS reste non réalisée à cause du blocage de lancement déjà constaté dans cet environnement.

La première ouverture effective de la région conserve son coût de génération. Le dessin régional garde ses bâtiments et véhicules géométriques. Les atlas des compagnons sont partagés par rôle ; ils ne constituent pas quatre nouveaux personnages animés individuellement.

## Livraison 1.27 conservée

# DEADWALL 1.27.0 — Opérations

Version complète : ouvrir `DEADWALL_Standalone.html`, ou lancer `npm start` puis `http://127.0.0.1:4173/` avec Node.js 22.12 ou plus récent.

**OPÉRATIONS**, dans le HUD ou Commandement → Dossiers, regroupe cinq extensions. Chacune apporte cinq axes de jeu raccordés aux systèmes existants :

| Facette | Ajouts |
|---|---|
| Exploration et logistique | Relevés de gisements, caches remplies depuis le sac, itinéraires balisés, ballots de ressources, abandon et récupération physique |
| Survie | Bivouac et repos, repas au feu, pansement progressif, bâche contre la pluie, entretien de lanterne sur place |
| Fortifications et industrie | Caisson de munitions, cassette de réparation, filet de corps, débris récupérables, régulateur d’intrants |
| Compagnons | Ordres de déplacement, formations, discipline de tir, entraînement de spécialité, sacoches de soutien |
| Campagne | Patrouille, aide humanitaire, récupération industrielle, évacuation d’un blessé, engagement de défense |

Les actions indiquent leur coût et leurs conditions. Les interventions chronométrées reprennent sur le terrain ; leur avancement apparaît dans le HUD. Le ruban partagé réunit opérations, matériel et éclairage. Les menus conservent navigation clavier, pause et retour au jeu.

Les sauvegardes v20 reçoivent un registre optionnel `expansions127` version1. Une ancienne campagne commence avec les nouveaux registres vides, sans récompense offerte. Un seul colis lourd peut être porté ; tâches, ressources et récompenses sont contrôlées à l’exécution et à la reprise. Huit nouveaux sprites d’équipement illustrent les caches, ballots, piquets, couchages, bâches, caissons, cassettes et brancards. Les systèmes nocturnes, le monde étendu, les 64 poses du commandant et le catalogue de 3 000 fiches de la version précédente sont conservés. Le guide en jeu contient maintenant 64 modules, dont cinq consacrés aux opérations.

La prospection ajoutée concerne D-17 ; les sorties de campagne et les ordres des compagnons utilisent la région. Les bivouacs fonctionnent dans les deux domaines. Les défenses et ateliers concernent la cité. Les projets futurs du codex restent explicitement séparés du contenu jouable.

Vérification : `DEADWALL_SOAK=1 npm run check`. Les rapports, mesures et captures de cette livraison sont dans `reports/1.27.0/`. Les captures viennent des peintres Canvas réels sous DOM simulé. L’environnement n’a pas permis un lancement de navigateur natif ; ni cadence d’images navigateur ni équilibrage par des joueurs humains ne sont certifiés.

Documentation détaillée : `docs/EXPANSION_EXPLORATION_1_27.md`, `docs/EXPANSION_SURVIE_1_27.md`, `docs/EXPANSION_FORTIFICATIONS_1_27.md`, `docs/EXPANSION_EQUIPE_1_27.md`, `docs/EXPANSION_CAMPAGNE_1_27.md`, `docs/UI_1_27.md`.

## Version 1.26 conservée

# DEADWALL 1.26.0 — Nuits & territoires

Version complète : ouvrir `DEADWALL_Standalone.html`, ou lancer `npm start` puis `http://127.0.0.1:4173/` avec Node.js 22.12 ou plus récent.

- **Éclairage** : tiroir ÉCLAIRAGE, préparation au dépôt de D-17 ; bois embrasé, torche, feu de camp, fusée, bâton lumineux, lanterne, lampe de chantier et balise. Les équipements avancés demandent un module d’éclairage des services essentiels. Autonomie, pose, récupération, pluie, murs et étages sont pris en compte.
- **Exploration** : fouilles nocturnes, cours de service enrichies, lieux régionaux garantis, routes raccordées, compagnons avec soins/réparation/tirs payés par le sac.
- **Guide** : Commandement → Terrain → ATLAS & GUIDE. 59 modules consultables avec recherche et filtres ; disponibilité en jeu séparée des projets. Le catalogue compagnon de 3 000 fiches est inclus dans le dossier `codex-3000/`.
- **Commandant** : deux atlas transparents, 64 poses au total, huit états animés raccordés aux actions effectives. Les armes longues partagent une silhouette ; les limites sont détaillées dans `docs/ACTOR_ANIMATIONS_1.26.md`.
- **Corrections** : quatre audits indépendants gameplay, interface, monde et persistance, suivis d’une vérification d’intégration.

Les campagnes historiques conservent leur génération. Format général de sauvegarde v20, avec registre optionnel nocturne version1, validé à l’import. Les sauvegardes anciennes commencent sans équipement offert.

Vérification complète : `DEADWALL_SOAK=1 npm run check`. Rapports actuels et captures Canvas dans `reports/1.26.0/`. Ces captures montrent les peintres du moteur sous DOM simulé ; elles ne certifient pas une session de navigateur réelle. Documentation : `docs/NUITS_1_26.md`, `docs/COHERENCE_MONDE_1_26.md`, `docs/codex/README.md`.

## Notes de la version précédente (archive)

# DEADWALL 1.22 — Les services essentiels

Jeu complet, candidat local **1.22.0-rc.1**, construit depuis la 1.21. Aucun push GitHub ni déploiement Vercel. Les systèmes précédents restent présents.

## Jouer

Ouvrir **DEADWALL_Standalone.html**. Le moteur et les images sont intégrés. Pour développer : Node.js 22.12 ou plus récent, puis `npm start`.

Dans **Commandement → Terrain → Carte & exploration**, ouvrir **Les services essentiels**. Le tiroir tactile ACTIONS et le panneau repliable MATÉRIEL donnent le même accès. Le nouveau contenu se déroule dans les bâtiments régionaux existants ; aucune nouvelle campagne n’est requise.

## Douze récupérations

Trois objectifs par spécialité : éclairage, soins, renforcement, diversion. Le lieu reste inconnu jusqu’à sa découverte physique. Un meuble porte le repère technique dans son intérieur. Approcher ce meuble et lancer **Examiner** : quatre secondes de relevé, sans dépense. La note devient lisible.

La dépose du module exige le jour, des outils consommables dans le sac et un accès libre hors de portée immédiate des infectés. Les matériaux ne sont dépensés qu’à la fin. Bouger, tirer, subir des dégâts ou recharger interrompt le travail ; le progrès n’est pas conservé après chargement.

Un porte-module au dos et un râtelier dans le break sont distincts du sac ordinaire. Chaque emplacement accepte **un seul module technique**. Le portage au dos réduit la vitesse de 22 % et empêche le sprint. Charger/reprendre exige de rejoindre le véhicule à pied. À la mise à terre ou à la destruction du break, le module tombe au sol ; son repère et sa position sont sauvegardés.

La livraison exige la présence au dépôt de D-17. Chaque module ne se livre qu’une fois. Il fournit deux kits du lot récupéré ; la première livraison de sa famille ouvre sa recette. Les livraisons suivantes ne créent pas une nouvelle recette ni un bonus permanent.

## Préparer la nuit

Assembler au dépôt prend cinq secondes et consomme ses réserves. Équiper ou ranger ne transforme pas les stocks. La ceinture comporte huit emplacements ; les réserves acceptent 32 kits par famille.

| Kit | Recette | Usage |
|---|---|---|
| Lampe de secours | 5 ferrailles + 2 carburants | 60 secondes, rayon régional 10 m ; lumière occultée par les murs, également utilisable à D-17 |
| Trousse de relève | 6 médicaments + 2 rations | Jusqu’à 40 vie par personne, 120 au total ; au contact régional seul le commandant est soigné |
| Étai de brèche | 12 bois + 6 ferrailles | Jusqu’à 160 intégrité sur un mur/une porte endommagé à portée, sans dépasser son maximum ; D-17 uniquement |
| Avertisseur déporté | 8 ferrailles + 1 carburant | Signal de 38 m pendant 18 secondes, atténué par les obstacles ; région uniquement |

La lampe participe à la visibilité des défenses pendant les nuits noires. Elle n’alimente pas le réseau. Le signal sonore réutilise la perception des infectés et reste au point où il a été posé. Il ne garantit pas la fuite et n’attire pas magiquement toute la horde locale. Aucun nouveau doublage ou enregistrement sonore n’est annoncé.

## Compatibilité et limites

Sauvegarde **v19**, migration v1–v18 sans mission ou kit gratuit. Conserver l’export original : la 1.21 ne lit pas la v19. Les trois générations régionales sont conservées, avec leurs prélèvements, atlas et relais.

La construction et le siège restent dans D-17, projeté sur 128 × 128 m. Les 42 plans de bâtiments ne deviennent pas 500 cartes jouables. Cette extension ajoute des objectifs et des interactions à des lieux existants ; elle ne refait pas tous leurs graphismes, n’ajoute pas de PNJ sauvés, de coopération réseau ou de simulation structurelle globale.

## Vérifier

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Sous cmd.exe, utiliser `set DEADWALL_SOAK=1` avant `npm run check`. Les serveurs locaux sont lancés par les scripts de test. Les scènes avancées sont préparées et leur temps est piloté, pas jouées par quatre humains. Safari/iPhone physique, Firefox, Electron et campagnes de plusieurs heures ne sont pas certifiés.

Rapport : `reports/RAPPORT_1.22.html`. Audit : `docs/AUDIT_1.22.md`. Codex de 500 lieux : paquet compagnon externe, conservé avec un nouveau guide des services.
