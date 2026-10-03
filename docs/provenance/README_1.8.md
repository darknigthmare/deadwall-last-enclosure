# DEADWALL — Tenir les remparts

**1.8.0-rc.1 — jeu complet assemblé, candidat local non publié.**

Explorez le secteur D-17 pendant le calme, rapportez vos matériaux, financez les chantiers et transformez le refuge en cité fortifiée. Les quartiers, convois, escortes, secours et ouvriers doivent conserver des accès. La nuit, les hordes mettent les portes, les munitions et les lignes de repli à l'épreuve. Seule la destruction du centre termine la partie.

## Jouer

Ouvrez **DEADWALL_Standalone.html** dans un navigateur de bureau. Le moteur, les styles et les dix atlas/textures sont intégrés : aucun serveur, aucun installateur d'extension et aucun téléchargement d'image ne sont nécessaires. Le fonctionnement hors ligne de ce fichier a été vérifié dans Chromium.

Pour travailler sur les sources, utilisez Node.js 22.12 ou plus récent :

```sh
npm start
```

Puis ouvrez l'adresse locale indiquée. `start_windows.bat` et `start_linux.sh` restent disponibles. Le jeu web et sa reconstruction n'exigent aucune dépendance npm externe. Les outils Electron ne sont nécessaires que pour préparer une application de bureau ; aucun exécutable Windows signé n'est livré ou certifié dans ce candidat.

## Contenus assemblés

Les correctifs initiaux et les six extensions sont inclus dans le moteur, pas fournis comme des modules à appliquer : sorties de ravitaillement, quartiers et fourgons, incendies et secours, journées d'exploration et ensembles de chantiers, survivants et consignes défensives, pistes et reconstruction. Le catalogue comprend 40 types de structures au total, dont le centre et les variantes de murs/portes.

La coordination héritée de la 1.7 apporte la recherche de construction par nom ou fonction, les filtres de technologie et de financement, les ordres secondaires repliables et les préparatifs de la cité. Le temps annoncé dans le choix de départ correspond enfin à la journée réellement lancée. Les erreurs d'état de sauvegarde et les indisponibilités du stockage ont des messages distincts.

## Nouveautés 1.8

Le dossier **Entretien des lignes** permet de diagnostiquer les accès ouverts dans les enceintes, de marquer les remparts menacés, de déblayer manuellement leurs amas avec **X / ACTION**, et de préparer un devis de réparation portant sur les murs choisis. Les coûts individuels historiques sont conservés ; ni les amas ni les incendies ne sont effacés par une réparation.

Les cartes et tracés représentent les obstacles de rempart, pas les itinéraires exacts des infectés. Les deux cadrages (cité et monde) ne révèlent aucun ennemi. Les commandes de déblaiement et repli des ouvriers utilisent les équipes déjà présentes. Détails : `docs/LINECARE_1.8.md`.

## Sauvegardes

Le format **v8** est conservé. Une copie issue de la 1.6 peut être importée depuis Paramètres. Exportez vos sauvegardes avant tout transfert : l'application en ligne, un serveur local et le fichier autonome n'utilisent pas nécessairement le même espace de stockage du navigateur. Le transfert se fait par un fichier JSON exporté puis confirmé à l'import. Les migrations historiques v1 à v7 restent présentes.

N'appliquez pas les anciens préparateurs d'extensions sur cette source : leurs empreintes ciblent le dépôt d'origine et ne décrivent plus ce projet consolidé.

## Vérifications reproductibles

```sh
npm run check
```

Cette commande vérifie la syntaxe, reconstruit la distribution et le fichier autonome, puis exécute la suite Node. Pour inclure l'endurance technique optionnelle :

```sh
# Linux/macOS
DEADWALL_SOAK=1 npm run check
```

Sous Windows : `set DEADWALL_SOAK=1` puis `npm run check`.

Les tests de navigateur ont une chaîne d'outils séparée afin de ne pas imposer Electron :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les trois scripts lancent leur propre serveur local sur un port libre. `DEADWALL_TEST_URL`, `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent d'utiliser un serveur ou une installation existante. Les captures et résultats sont écrits dans `reports/linecare-1.8/`.

## Portée de la QA

Voir `docs/LINECARE_1.8.md` et le rapport HTML livré. Les parcours Chromium chargent le vrai moteur, le vrai DOM et les atlas originaux. Leur pas de simulation est piloté ; les situations avancées utilisent des mises en place indiquées dans les tests. La suite Node conserve un DOM minimal pour ses tests logiques. L'endurance comporte une assistance synthétique explicitement comptabilisée : ce n'est pas une preuve d'équilibrage humain.

Safari/iOS, Firefox, Electron empaqueté, parties de plusieurs heures, tous les contrats et tous les chemins d'escorte n'ont pas été certifiés. Un mode infini et un projet complet ne signifient pas qu'une validation commerciale est terminée.

## Provenance

Base GitHub : `darknigthmare/deadwall-last-enclosure`, commit `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65` du 31 août 2026. Les fichiers du jeu et ses assets ont été récupérés dans l'archive de ce commit, puis complétés par le kit 1.6 et les modifications 1.7. Les notices artistiques et tierces du dépôt sont conservées. Les consignes du projet restent dans `AGENTS.md`.
