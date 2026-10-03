# DEADWALL — Les équipes du jour

**1.10.0-rc.1 — jeu complet local, non publié.**

Explorez D-17, ramenez les matériaux, financez les chantiers et protégez plusieurs lignes de défense contre les hordes. Les anciens systèmes sont inclus : sorties, quartiers et fourgons, incendies et secours, exploration, escortes, pistes, reconstruction, entretien des remparts et carte interactive.

## Jouer

Ouvrez **DEADWALL_Standalone.html** dans un navigateur de bureau : le moteur, les styles et les images sont intégrés. Aucun ancien préparateur d’extension n’est requis. Pour les sources : Node.js 22.12 ou plus récent puis `npm start`, ou les lanceurs inclus. `npm run build` reconstruit le jeu autonome et `dist/`.

## Nouveautés 1.10

Après un relevé manuel, un ouvrier existant peut être affecté à un chargement et son retour, contre quatre rations. Bureau de chantier et entrepôt terminés requis ; deux places par entrepôt, quatre équipes maximum. Les ouvriers gardent leur sac de dix ressources, leurs trajets et leurs risques. Le dépôt plein conserve le reliquat ; le rappel ou le crépuscule ne téléportent personne. La commande se trouve dans **Carte & exploration**.

Quatre ensembles de vrais chantiers complètent les trois précédents : relais de retour, cour nourricière, cour des matériaux et entrée à tirs croisés. Leur financement est contrôlé globalement, mais leur construction reste à réaliser. Les schémas représentent leurs véritables emprises.

Voir `docs/SALVAGE_1.10.md` et `reports/1.10/RAPPORT_QA.html` pour les règles, coûts, preuves et limites.

## Sauvegardes : nouveau format v9

Les anciennes sauvegardes v1 à v8 migrent sans récompense ni équipe gratuite. **L’ancien jeu 1.9 ne sait pas relire une sauvegarde v9.** Exportez votre campagne avant de changer de distribution, puis importez le JSON depuis les paramètres. Le site, le serveur local et le fichier autonome ont potentiellement des stockages distincts.

## Vérifier les sources

```sh
npm run check
# Linux/macOS, endurance logique incluse :
DEADWALL_SOAK=1 npm run check
# Windows cmd : set DEADWALL_SOAK=1 puis npm run check
```

Outils de navigateur séparés du jeu :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Chaque script démarre son propre serveur. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent une installation existante. Aucun outil Electron n’est nécessaire pour jouer dans le navigateur ou reconstruire le HTML ; les outils de packaging PC sont conservés, sans exécutable signé livré.

Les tests Chromium chargent les vrais fichiers et le moteur. Leurs états avancés sont préparés et le temps est piloté ; ce ne sont pas des testeurs humains. Les anciens rapports restent l’historique des anciennes versions, pas une validation de la nouvelle. Safari/iOS, Firefox, Electron empaqueté et les campagnes prolongées restent à vérifier.

## Provenance

Base GitHub `darknigthmare/deadwall-last-enclosure`, commit `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65`, puis continuation du jeu complet 1.9. Les quatorze fichiers d’assets sont inchangés. Les sources et preuves sont incluses avec leurs empreintes. Aucun push GitHub ni déploiement Vercel n’a été réalisé.
