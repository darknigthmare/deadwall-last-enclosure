# DEADWALL — Villes sans lune

**1.11.0-rc.1 — jeu complet local, non publié.**

Explorez et construisez pendant le jour. Préparez les projecteurs, les convois et les enceintes avant la nuit. Certaines vagues se déroulent dans le noir réel : seuls la torche et les éclairages opérationnels rendent le terrain visible. La progression s'étend du refuge à Mégaville III.

## Jouer

Ouvrir **DEADWALL_Standalone.html** dans un navigateur de bureau. Il contient le moteur, les styles, les atlas et toutes les extensions. Aucun préparateur d'extension ni serveur n'est nécessaire pour ce fichier. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

**L** : allumer/éteindre la torche. Le bouton tactile propose la même commande. Dans **Commandement → Terrain → Préparatifs**, consultez la progression urbaine et orientez les projecteurs. Les bâtiments futurs sont absents du catalogue jusqu'à l'âge atteint. Le score dépend des constructions achevées ; les logements n'ajoutent pas de personnes gratuitement.

Nuits noires aux vagues 4, 7, 10, puis tous les trois assauts. Le centre possède un éclairage de secours. Les projecteurs exigent une alimentation complète ; les portes fermées et les bâtiments interrompent les faisceaux. La cour solaire ne produit plus dès l'alerte : prévoir des générateurs pour la nuit.

## Sauvegardes

Format **v10**. Exporter la campagne de l'ancien jeu puis importer le JSON dans les paramètres. Les formats v1 à v9 migrent sans récompense. Une ancienne nuit en cours n'est pas obscurcie brutalement à l'import. Le jeu 1.10 ne peut pas relire une sauvegarde v10 : conserver l'original. Les parcours temporaires de carte restent temporaires, les anciens registres de campagne sont conservés.

## Vérifier

```sh
npm run check
# Avec endurance logique sous Linux/macOS :
DEADWALL_SOAK=1 npm run check
# Sous cmd.exe Windows : set DEADWALL_SOAK=1 puis npm run check
```

Outils navigateur séparés du jeu :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts démarrent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de choisir une installation existante. Le jeu web lui-même ne nécessite pas ces outils ni Electron. Aucun exécutable signé n'est livré.

## Contenu et preuves

Les 40 structures antérieures sont conservées, avec 26 nouvelles constructions et 11 âges. Les images héritées restent identiques ; les nouvelles architectures sont des dessins 2.5D, non des intérieurs 3D visitables. Les contenus jour/nuit, sorties, quartiers, secours, récupération, pistes, reconstruction et entretien restent intégrés.

Rapport courant : **reports/RAPPORT_1.11.html**. Règles détaillées : **docs/VILLES_SANS_LUNE_1.11.md**. Résultats bruts : **reports/1.11/**. L'archive complète ne répète pas les anciennes captures et rapports HTML lourds ; aucun système du jeu n'est retiré. Les tests et documents historiques sont conservés.

Les parcours avancés du navigateur utilisent des scènes préparées et un temps piloté, pas des joueurs humains. Safari/iOS physique, Firefox, Electron empaqueté et l'équilibrage des grandes villes sur plusieurs heures restent à valider. Le monde et le plafond simultané des hordes restent ceux du jeu d'origine.

Base : projet complet 1.10, issu du dépôt `darknigthmare/deadwall-last-enclosure` au commit `c1db812e2ddf81b3f9a9926362a7ba13b32dbb65`. Aucun push GitHub ni déploiement Vercel n'a été effectué.
