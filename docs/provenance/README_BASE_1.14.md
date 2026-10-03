# DEADWALL — Au contact de la cité

**1.14.0-rc.1 — projet complet local, non publié.**

Cette version corrige les emprises des constructions et décors, ajoute une gestion locale des bâtiments, des réimplantations payantes, le contrôle manuel des miradors, un rechargement actif et un journal papier. Elle conserve les 71 types de structures, onze âges, sorties, automobile, renseignements, récupération, réseau électrique et nuits noires.

## Jouer

Ouvrir **DEADWALL_Standalone.html** dans un navigateur de bureau. Le moteur et les images sont intégrés. Aucun ancien préparateur d'extension n'est requis.

Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`. La distribution se reconstruit avec `npm run build`.

## Nouvelles commandes

**O** : préparer une orientation. **P** : préparer un déplacement sur la grille. **I** : gérer la structure proche, ou quitter son tir manuel. Un devis doit être confirmé avant de payer une réimplantation. Le centre et les postes territoriaux restent ancrés.

**R** : recharger ; un second appui dans la zone de la jauge accélère le chargement. Un échec ajoute du temps. Ne rien tenter garde le rechargement normal. **B** replie la construction sous une clef identifiable. Les réglages se trouvent près de Pause.

Les bâtiments sont solides : déposer, travailler et utiliser leurs services depuis une face extérieure accessible. Les portes et les routes doivent rester ouvertes aux équipes. Le break ne traverse plus les coins des emprises.

## Sauvegardes

Format **v13**. Exporter depuis l'ancien jeu, puis importer le fichier JSON dans les paramètres de cette version. Garder l'export original : la version 1.13 ne peut pas relire une v13. Les acteurs auparavant sous une construction sont replacés sur un accès libre lors de la migration, sans perdre leur sac.

## Contrôles reproductibles

```sh
npm run check
# Linux/macOS, endurance logique comprise :
DEADWALL_SOAK=1 npm run check
# Sous cmd.exe : set DEADWALL_SOAK=1 puis npm run check
```

Tests navigateur, outils indépendants du jeu :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts démarrent leur propre serveur local. Variables facultatives : `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM`. Le jeu autonome ne nécessite pas ces outils pour jouer. Aucun exécutable Electron signé n'est livré.

Détails : **docs/FIELDCRAFT_1.14.md**. Preuves courantes : **reports/RAPPORT_1.14.html** et **reports/1.14/**. Les premières itérations, erreurs de fixtures et corrections restent documentées. Les tests utilisent le vrai moteur, des scènes avancées préparées et du temps piloté ; ils ne sont pas quatre joueurs humains.

Base : jeu complet 1.13, issu du dépôt `darknigthmare/deadwall-last-enclosure` au commit `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65`. Aucun push GitHub ni déploiement Vercel n'a été effectué. Les gros rapports visuels antérieurs ne sont pas dupliqués, mais les systèmes et leurs tests sont conservés.
