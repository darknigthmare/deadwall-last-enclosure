# DEADWALL — Le Courant de la cité

**1.12.0-rc.1 — jeu complet local, non publié.**

Préparez le jour, conservez de l’énergie et choisissez les circuits à maintenir dans les nuits noires. Cette version ajoute trois batteries constructibles, leur charge physique et la gestion électrique de la cité, sans supprimer les mécaniques précédentes.

## Jouer

Ouvrez **DEADWALL_Standalone.html** dans un navigateur de bureau. Le moteur, les styles et les images sont intégrés ; aucun ancien préparateur d’extension ou serveur n’est nécessaire. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

Dans **Commandement → Terrain → Préparatifs**, retrouvez les réserves et circuits. Les batteries sont vides à la construction, chargées sur le surplus une fois la demande couverte, avec 90 % de rendement. AUTO comble tout déficit ; NUIT préserve la réserve au calme ; ISOLÉE ne charge ni ne décharge. Les consommateurs proposent Toujours, Jour, Nuit ou Coupé. La priorité lumineuse est facultative.

La torche reste sur **L**, la carte sur **M** et les interactions sur **ACTION / E**. Le jeu conserve les onze âges, les nuits noires, sorties, convois, quartiers, secours, récupération, pistes, reconstruction et entretien. Les trois nouvelles réserves portent le catalogue à 69 types. Le réseau reste global, sans câbles simulés.

## Sauvegardes

Format **v11**. Exportez la campagne depuis l’ancien jeu, puis importez le JSON dans les paramètres du nouveau. Les formats v1 à v10 migrent sans énergie offerte ni réglage de circuit imposé. Les nouvelles réserves sont enregistrées par bâtiment. Le jeu 1.11 ne relit pas une v11 : conservez l’export précédent.

## Vérifier

```sh
npm run check
# Endurance logique optionnelle sous Linux/macOS :
DEADWALL_SOAK=1 npm run check
# Sous cmd.exe Windows : set DEADWALL_SOAK=1 puis npm run check
```

Les tests navigateur ont leurs outils séparés du jeu :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts lancent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` sélectionnent une installation existante. Ces dépendances ne sont pas nécessaires pour ouvrir le jeu autonome. Aucun exécutable Electron signé n’est livré.

## Documentation et résultats

Règles : **docs/LE_COURANT_DE_LA_CITE_1.12.md**. Rapport courant : **reports/RAPPORT_1.12.html**. Données brutes : **reports/1.12/**. Les tests historiques et sources sont conservés ; les gros anciens rapports et captures ne sont pas réembarqués.

Les quatre nouveaux profils Chromium utilisent le vrai moteur et ses atlas, avec temps piloté et scènes avancées préparées. Ils ne représentent pas quatre joueurs humains. Safari/iOS physique, Firefox, Electron empaqueté, longues campagnes et fluidité sur le matériel du joueur restent à valider.

Base : jeu complet 1.11 issu du dépôt `darknigthmare/deadwall-last-enclosure` au commit `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65`. Les 14 fichiers d’assets sont intacts. Aucun push GitHub ni déploiement Vercel n’a été effectué.
