# DEADWALL 1.15 — Le monde avant la chute

**Candidat local 1.15.0-rc.1. Jeu complet conservé + extension d’exploration régionale. Aucun push ni déploiement.**

## Jouer

Ouvrir **DEADWALL_Standalone.html** sur un navigateur de bureau. Les scripts et images nécessaires sont inclus. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

Rejoindre l’une des quatre routes centrales au bord de D-17. Continuer à marcher ou à conduire franchit la jonction régionale. Les routes centrales de la région permettent le retour. Le bouton « Franchir la limite » fonctionne seulement près d’une jonction, pas depuis n’importe quel point.

**M** : carte. **F** : monter/descendre du break. **G** : sac vers coffre à proximité. **V** : carburant porté vers le réservoir. **E maintenu** : fouiller un contenant accessible. **Page précédente / Page suivante** (`PageUp` / `PageDown`) : changer de niveau près d’une cage d’escalier. **R** : recharger ; un second appui conserve le système actif existant. **L** : torche. Sur écran tactile, la carte régionale est aussi dans le tiroir **ACTIONS**.

## Ce que cette version étend

Le domaine régional mesure **8 192 × 8 192 mètres**, environ **67,1 km²**, avec secteurs détaillés de 256 m chargés à la demande. Il contient six agglomérations et 22 plans pilotes de lieux. La graine 17117 produit 211 parcelles et 293 niveaux au total ; les autres graines varient. Tous les plans de cette première passe sont des compositions simplifiées, pas des reproductions de cartes commerciales.

Maisons, étages, commerces, hôtels, scieries, garages, entrepôts, ruines, mines et abris possèdent une géométrie de pièces, murs, passages, mobilier et contenants. Un toit s’efface quand on entre dans son bâtiment. Les étages sont des plans superposés reliés par une commande près de l’escalier, pas une montée animée 3D. La végétation se regroupe selon des champs de densité ; les parcelles suivent les rues, les véhicules leurs places.

Le break, son coffre et son carburant sont ceux de la campagne. En région, le débit est de 0,004 unité par mètre réellement parcouru. Les stocks du refuge ne remplissent pas un réservoir à distance. Les prélèvements des contenants et les éliminations régionales sont conservés après chargement et déchargement du secteur. La carte n’est pas une téléportation.

**Périmètre explicite :** les chantiers et le siège restent dans le domaine historique de D-17. La région est une extension d’exploration ; toute sa surface n’est pas constructible. Les anciens modèles de bâtiments du refuge gardent leur échelle de jeu. Les gabarits métriques et intérieurs de cette version concernent les nouveaux lieux régionaux. Les systèmes de la cité continuent de fonctionner pendant l’absence du commandant.

## Sauvegarde v14

Exporter la campagne avant le transfert. Les formats v1 à v13 migrent sans région visitée, carburant ou véhicule gratuits. La v14 conserve la position régionale, les étages, le break, les prises et les découvertes. Le jeu 1.14 ne relit pas ce nouveau format : garder l’export d’origine.

## Codex externe de 500 lieux

Un **paquet compagnon séparé**, `DEADWALL_CODEX_500_LIEUX_COMPLET.zip`, accompagne cette livraison. Il contient 500 fiches Markdown, un catalogue JSON, un schéma, les sources de génération, un lecteur HTML et les guides. Il n’est pas affiché dans le jeu, et ses 500 conceptions ne sont pas présentées comme 500 niveaux jouables. Les 22 liaisons pilotes sont indiquées par leurs identifiants `DW-xxxx`.

L’archive de jeu conserve ici une notice d’intégration sous `docs/world-codex/`. Le compagnon peut être extrait à côté du projet, ou copié dans ce dossier pour une prochaine génération. Sa livraison et sa vérification sont indépendantes de celles du jeu.

## Vérifier

```sh
npm run check
# Endurance optionnelle incluse, Linux/macOS :
DEADWALL_SOAK=1 npm run check
# Sous cmd.exe : set DEADWALL_SOAK=1 puis npm run check
npm run test:world
```

Outils navigateur séparés :

```sh
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Les scripts de navigateur démarrent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de réutiliser des outils existants. Les preuves actuelles sont dans `reports/1.15/` et `reports/RAPPORT_1.15.html`. La logique d’endurance est assistée explicitement ; les scènes avancées du navigateur sont préparées et leur temps piloté, pas quatre joueurs humains.

Safari/iOS physique, Firefox, Electron empaqueté, longs trajets sur toutes les graines, mégavilles peuplées pendant plusieurs heures et fluidité sur le matériel du joueur ne sont pas certifiés. Le plafond de la horde locale reste inchangé. Aucun exécutable signé n’est livré.
