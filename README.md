# DEADWALL — La Dernière Enceinte

Jeu autonome de **survie, construction de cité et défense contre des hordes zombies infinies**. Le joueur commence comme récupérateur armé autour d’un dépôt abandonné, puis automatise la collecte, recrute des ouvriers et des fusiliers, développe des industries et ferme plusieurs enceintes concentriques.

Cette livraison est une version complète et jouable en **2D/2.5D top-down Canvas**, sans bibliothèque, compte, serveur distant ni asset externe. Elle sert aussi de verticale de référence pour un futur port 3D semi-réaliste.

## Lancer le jeu

### Méthode la plus simple

Ouvrir `index.html` dans un navigateur moderne.

### Windows

Double-cliquer sur `start_windows.bat`, puis ouvrir l’adresse indiquée :

```text
http://localhost:4173
```

### Linux / macOS

```bash
./start_linux.sh
```

### Node.js

```bash
npm start
```

Aucune installation `npm install` n’est nécessaire.

## Commandes

| Action | Commande |
|---|---|
| Déplacement | ZQSD, WASD ou flèches |
| Sprint | Maj gauche |
| Viser | Souris |
| Tirer | Clic gauche |
| Récolter, déposer, construire | Maintenir E |
| Coup de crosse | Espace |
| Recharger | R |
| Changer d’arme | 1, 2, 3 |
| Catalogue de construction | B |
| Poser un bâtiment | Clic gauche |
| Tracer une ligne de murs | Cliquer, tirer, relâcher |
| Tourner une structure | R en mode construction |
| Annuler / sélectionner une structure | Clic droit |
| Zoom | Molette |
| Pause | Échap |

## Systèmes jouables

- Personnage contrôlé directement avec santé, endurance, portage, armes, chargeurs et réanimation.
- Récolte physique de bois, ferraille, pierre, nourriture et carburant.
- Dépôt des ressources au centre de commandement ou dans les entrepôts.
- Ouvriers autonomes capables de récolter, transporter et construire.
- Fusiliers autonomes rassemblés autour d’un point de ralliement déplaçable.
- Vingt-deux structures avec coûts, chantier, intégrité, réparation, démolition et amélioration.
- Palissades, murs d’acier, remparts en béton, portes, pièges, miradors et tourelles.
- Tracé rapide de longues lignes de murs pour créer plusieurs enceintes concentriques.
- Population, logements, nourriture, moral, capacité de stockage et réseau électrique.
- Fermes, scieries, centres de recyclage, concasseurs, raffineries et manufactures de munitions.
- Cycle jour/nuit, éclairages alimentés, pluie et visibilité dégradée.
- Hordes infinies provenant de plusieurs fronts, avec cinq profils d’infectés.
- Champ de flux pondéré : les zombies privilégient les portes et points faibles, mais attaquent un mur lorsque le détour coûte trop cher.
- Accumulation de cadavres au pied des remparts, augmentant la pression et créant des possibilités de franchissement.
- Signature de la cité : population, bâtiments, production et consommation électrique attirent davantage d’infectés.
- Repli progressif : perdre un mur ou un quartier n’entraîne pas une défaite immédiate ; seule la chute du centre termine la partie.
- Sauvegarde automatique toutes les trente secondes et sauvegarde manuelle depuis la pause.
- Trois difficultés : Survivant, Standard et Brutal.
- Objectifs d’introduction, récompenses, paliers de cité et mode infini.
- Son généré procéduralement avec Web Audio, sans fichiers audio externes.

## Vérification du projet

```bash
npm test
npm run check
```

La suite couvre l’économie, les vagues, les paliers, le catalogue, la file de priorité du pathfinding, les références HTML, le démarrage complet, le déclenchement d’une horde, le rendu Canvas simulé et la sauvegarde/reprise.

## Structure

```text
index.html                  Interface et écrans
styles.css                 Direction visuelle et responsive
src/core.js                Données, équilibrage et fonctions pures
src/game.js                Simulation, IA, rendu, interface et sauvegarde
scripts/server.mjs         Serveur local sans dépendance
tests/                     Tests automatiques Node.js
docs/GAME_DESIGN.md        Règles de conception complètes
docs/ARCHITECTURE.md       Architecture technique
docs/BALANCING.md          Formules et valeurs d’équilibrage
docs/CODEX_MASTER_PROMPT.md Prompt maître de continuation
docs/ROADMAP.md            Passage vers une production 3D
docs/ORIGINAL_BRIEF.txt    Postulat initial conservé
```

## Sauvegarde

La sauvegarde utilise `localStorage` sous la clé `deadwall-save-v2` (avec migration et sauvegarde de secours depuis `deadwall-save-v1`). Elle contient la graine du monde, les gisements, le joueur, les unités, les structures, les zombies actifs, la vague, la météo, la progression et les statistiques.

## Principes à ne pas casser

1. Le gameplay réellement montré doit rester le gameplay réellement joué.
2. Le joueur doit sentir le passage du travail manuel à l’automatisation de masse.
3. La croissance des hordes repose d’abord sur le nombre, les fronts et la logistique, pas sur des sacs de points de vie.
4. Les murs successifs créent du temps et des possibilités de repli.
5. Chaque système de croissance de la cité augmente aussi sa signature et donc le danger.
6. Aucun achat payant, minuteur artificiel ou dépendance à un service externe.

## Crédit du projet

Conception et propriété du projet : **Darknigthmare**.
jeu complet Codex livré en août 2026.
