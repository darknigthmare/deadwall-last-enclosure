# DEADWALL — Les Routes du ravitaillement

**1.13.0-rc.1 — jeu complet local, non publié.**

Explorez D-17 le jour, rapportez vos ressources et protégez la cité la nuit. Cette passe ajoute des expéditions aux réserves finies, un analyste réellement détaché et un break pilotable avec carburant et coffre séparés.

## Jouer

Ouvrir **DEADWALL_Standalone.html** dans un navigateur de bureau. Le moteur, les images et les extensions sont intégrés ; aucun préparateur d'extension ni serveur n'est nécessaire. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

Dans **Carte & exploration → Expéditions**, choisissez parmi les lieux connus. Les renseignements ouvrent de nouvelles destinations ; les douze haltes se trouvent sur la carte D-17 existante, pas dans douze mondes séparés.

Construire le Bureau de chantier, le Bureau des expéditions et le Garage des sorties, puis payer la remise en service d'un break. Le réservoir commence vide. Remplir près du centre ou avec du carburant porté, puis préparer une sortie contre trois rations. **F** ou le bouton tactile permet de monter/descendre. Conduire avec les commandes habituelles. À pied sur place, maintenir **ACTION / E** pour relever et récupérer ; transférer le sac au coffre puis décharger au centre.

La voiture consomme du carburant selon la distance effectivement parcourue. Le troc diurne au centre échange des ferrailles contre une quantité limitée d'essence. Les matériaux des haltes et le coffre ne sont pas crédités à distance.

## Sauvegardes

Format **v12**. Exporter la campagne de l'ancien jeu puis importer le JSON depuis les paramètres. Les versions v1 à v11 migrent sans véhicule ou ressource supplémentaire. Le jeu 1.12 ne peut pas relire les nouvelles sauvegardes : conserver l'export d'origine.

## Vérifier et reconstruire

```sh
npm run check
# Endurance logique, Linux/macOS :
DEADWALL_SOAK=1 npm run check
# Sur Windows cmd.exe : set DEADWALL_SOAK=1 puis npm run check
```

Outils navigateur séparés du jeu :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts de test démarrent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` peuvent pointer vers une installation existante. Le jeu lui-même n'a pas besoin de ces outils pour jouer dans son fichier autonome. Aucun exécutable Electron signé n'est livré.

## Contenu conservé et limites

Les onze âges, 69 structures héritées, nuits noires, projecteurs, batteries, circuits, quartiers, convois autonomes, escortes, secours, voirie, déblaiement et récupération restent intégrés. Les deux nouveaux bâtiments portent le catalogue à 71 types. Les quatorze fichiers graphiques hérités sont inchangés ; les ajouts sont des peintres Canvas.

Le rapport courant est **reports/RAPPORT_1.13.html**, les règles sont dans **docs/EXPEDITIONS_1.13.md**, les résultats dans **reports/1.13/**. Les anciens tests et documents sont conservés ; les lourds rapports visuels des anciennes livraisons ne sont pas répétés dans le ZIP.

Les quatre profils de navigateur sont automatisés avec des scènes préparées et un pas de simulation piloté. Ils ne certifient pas Safari/iPhone physique, Firefox, Electron empaqueté ou l'équilibrage d'une campagne de plusieurs heures. Aucun voyage régional hors carte, remorquage, passager ou conduite réaliste automobile n'est prétendu.

Base complète 1.12, issue du dépôt darknigthmare/deadwall-last-enclosure au commit c1db812e2ddf81b3f9a9926362a7ba13b32dbb65. Aucun push GitHub ni déploiement Vercel n'a été effectué.
