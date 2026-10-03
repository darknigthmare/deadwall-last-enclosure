# DEADWALL 1.16 — Carnets d’exploration

**Candidat local 1.16.0-rc.1. Jeu complet conservé, sans push GitHub ni déploiement Vercel.**

## Jouer

Ouvrir `DEADWALL_Standalone.html`. Il contient les images et scripts nécessaires. Pour exécuter les sources : Node.js 22.12 ou plus récent puis `npm start`.

Les routes centrales aux quatre bords de D-17 rejoignent la région. M ouvre la carte, F commande le véhicule, G transfère le sac au coffre, V ravitaille avec du carburant transporté, E maintenu fouille et PageUp/PageDown changent de niveau près d’un escalier. L commande la torche ; R conserve le rechargement actif existant. La carte tactile est disponible dans le tiroir ACTIONS.

## Douze lieux supplémentaires

Boulangerie, bibliothèque, jardinerie, clinique vétérinaire, laverie, caserne de pompiers, garde-meubles, exploitation maraîchère, bureau postal, gymnase, auberge et casse automobile rejoignent les 22 plans pilotes existants. Le total atteint 34 types, sans prétendre que les 500 conceptions du codex sont déjà des niveaux jouables.

La nouvelle génération de région conserve 8 192 mètres de côté. Sur la graine 17117 : 223 parcelles, 308 niveaux et 387 objets de récupération extérieurs. Les cours et réserves sont placées dans les emprises de service. Murs, objets, véhicules et récupération utilisent les mêmes coordonnées. Les nouvelles machines, les fours et les chenils sont des éléments de lieu ; ils ne deviennent pas des systèmes de production ou d’animaux nouveaux.

La construction et le siège restent dans D-17. Cette version enrichit la région d’exploration, elle n’étend pas les chantiers à ses 67,1 km² et ne redimensionne pas tout le bâti historique du refuge.

## Carnet et repère

Dans le dossier de carte : recherche par nom, filtres, pages de douze lieux, annotations manuelles À explorer / Visité / Fouillé / Danger. Une annotation n’élimine aucune menace, ne retire aucun stock et ne certifie pas la sécurité.

Choisir un repère parmi les lieux connus affiche un itinéraire indicatif par le graphe routier, une distance et une estimation de carburant pour l’aller. Ce n’est pas un pilote automatique. Les raccordements hors chaussée et les obstacles peuvent imposer des détours ; conserver une marge pour rentrer.

## Migration sans remplacement du monde

Sauvegarde **v15**. Les campagnes régionales créées en 1.15 conservent leur génération 1, leurs positions, leurs contenants et leurs prises ; le carnet et les corrections d’accès leur sont disponibles. Les douze nouveaux types et les cours enrichies sont destinés aux **nouvelles régions de génération 2**. Pour les découvrir immédiatement, démarrer une nouvelle campagne après avoir exporté la précédente.

Aucune conversion silencieuse de la région existante n’est appliquée. Le jeu 1.15 ne relit pas une sauvegarde v15 : garder l’export original. Le coffre ne peut plus être utilisé à travers un mur ou depuis un étage différent ; une descente de voiture doit aussi disposer d’un trajet libre.

## Codex compagnon

`DEADWALL_CODEX_500_LIEUX_1.16.zip` et `DEADWALL_CODEX_MONDE_1.16.html` sont livrés séparément. L’édition documentaire 1.1 conserve 500 fiches, 25 familles et 2 061 espaces, avec 34 liaisons pilotes (22 héritées et 12 nouvelles) et 466 conceptions à intégrer. Le codex n’apparaît pas dans le jeu public. La notice de liaison et les identifiants sont dans `docs/world-codex/INTEGRATION_1.16.md`.

## Vérification

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
```

Sous cmd.exe Windows : `set DEADWALL_SOAK=1` puis `npm run check`.

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts démarrent leurs propres serveurs. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de réutiliser des outils existants. Aucun outil de test n’est nécessaire pour jouer au HTML autonome.

Rapport : `reports/RAPPORT_1.16.html`. Preuves : `reports/1.16/05-final-node.log`, `05-final-browser.log`, `browser-places/results.json` et `geometry-first.json`. Les scénarios de navigateur sont préparés et le temps est piloté ; l’endurance synthétique est explicitement assistée. Aucun parcours humain exhaustif n’est revendiqué.

Safari/iPhone physique, Firefox, Electron empaqueté, longs trajets de toutes les graines, mégavilles sur plusieurs heures et fluidité sur le matériel du joueur restent à vérifier.
