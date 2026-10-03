# DEADWALL — Les chemins du jour

**1.9.0-rc.1 — jeu complet local, non publié.**

Le jour : explorer D-17, relever les découvertes, transporter les matériaux, construire et organiser les retours. La nuit : tenir les enceintes, leurs portes et leurs accès, sans oublier les convoyeurs, escortes et secours.

Ouvrez **DEADWALL_Standalone.html** pour jouer dans un navigateur de bureau, sans serveur ni téléchargement d'images. Le fichier contient le moteur, les extensions et les atlas d'origine. Pour travailler sur les sources, Node.js 22.12 ou plus récent puis `npm start`. `npm run check` reconstruit et vérifie le projet.

## La passe 1.9

La carte d'exploration (`M` ou le bouton de minicarte) regroupe les lieux connus et prépare quatre étapes. Elle se déplace, zoome et distingue les trajets calculés des distances à vol d'oiseau. Elle respecte les portes et remparts et ne révèle pas les positions ennemies. Les dix-huit découvertes existantes possèdent chacune leur silhouette Canvas ; aucun nouveau lieu ou véhicule pilotable n'est prétendu.

Les données de campagne restent en **v8**. Exporte ta campagne avant le transfert entre le site, un serveur local et le HTML autonome, puis importe le JSON depuis les paramètres. Le parcours de carte est temporaire et se vide à la reprise ; les progrès d'exploration ne sont pas perdus.

Les contenus précédents sont inclus : sorties, quartiers, convois, incendies, secours, découvertes diurnes, ensembles de chantiers, survivants, consignes défensives, pistes, reconstruction et entretien des remparts. Aucun préparateur d'extension n'est nécessaire.

## Vérifier

```sh
npm run check
# Endurance logique optionnelle, sous Linux/macOS :
DEADWALL_SOAK=1 npm run check
# Sous cmd.exe Windows : set DEADWALL_SOAK=1 puis npm run check
```

Les tests navigateur ont leurs outils séparés du jeu :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts lancent leur propre serveur local. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent d'utiliser une installation existante. Détails de cette livraison : `docs/RECON_1.9.md` et `reports/RECON_1.9.html`. Les anciens rapports restent l'historique de leurs versions, pas les résultats de ce candidat.

Les parcours du navigateur chargent le véritable jeu. Les scènes avancées et leur temps piloté sont signalés : ce ne sont pas des testeurs humains. Safari/iOS, Firefox, Electron empaqueté et les longues campagnes restent à valider. Le dépôt conserve les outils Electron, mais aucun exécutable signé n'est livré.

## Provenance

Base originale : `darknigthmare/deadwall-last-enclosure`, commit `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65`. Cette version prolonge le jeu complet 1.8 « Tenir les remparts », avec ses images intactes. Le manifeste vérifie les fichiers livrés. Aucun push GitHub ou déploiement Vercel n'a été effectué.
