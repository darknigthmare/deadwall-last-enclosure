# Architecture technique

## Objectif de la version actuelle

Livrer un jeu immédiatement jouable, autonome et modifiable par Codex, sans étape de compilation ni dépendance réseau. Le moteur est un Canvas 2D avec interface HTML/CSS et simulation JavaScript.

## Fichiers principaux

### `src/core.js`

Module UMD chargé dans le navigateur et testable avec Node.js. Il contient :

- constantes du monde ;
- métadonnées des ressources ;
- difficultés ;
- paliers de cité ;
- catalogue des bâtiments ;
- profils ennemis ;
- armes ;
- objectifs ;
- fonctions d’économie ;
- formule des vagues ;
- générateur pseudo-aléatoire ;
- tas minimum pour le pathfinding.

Toute valeur d’équilibrage doit rester dans ce fichier lorsque cela est possible.

### `src/game.js`

Contient les objets de simulation et le contrôleur principal :

- `Building`, `ResourceNode`, `Unit`, `Zombie`, `Projectile`, `Particle` ;
- `AudioSystem` ;
- `WorldMap` et grille d’occupation ;
- `FlowField` ;
- `Game` ;
- entrée d’application et exposition `globalThis.DEADWALL`.

## Boucle de simulation

La boucle `requestAnimationFrame` limite le pas à 40 ms pour éviter les bonds de simulation. L’ordre est :

1. temps, météo, entrées ;
2. directeur de vague ;
3. recalcul éventuel du champ de flux ;
4. index spatial des zombies ;
5. joueur ;
6. bâtiments ;
7. unités ;
8. zombies ;
9. projectiles ;
10. effets ;
11. économie ;
12. métriques de cité et objectifs ;
13. sauvegarde, HUD et minimap ;
14. caméra.

## Monde et occupation

- taille : 128 × 128 cellules ;
- cellule : 32 unités ;
- monde : 4096 × 4096 unités ;
- `Int32Array` d’occupation pour accéder rapidement à une structure ;
- gisements générés en grappes depuis une graine ;
- zone centrale dégagée et ressources de départ garanties.

## Champ de flux

Le champ est reconstruit uniquement après un changement de structure. Un Dijkstra pondéré calcule le coût de chaque cellule vers le centre. Chaque zombie lit ensuite le voisin de coût inférieur, avec une faible variation individuelle.

Cette approche coûte davantage lors d’une construction, mais rend le déplacement de centaines de zombies très léger pendant les vagues.

## Performance des hordes

- maximum de 650 zombies simultanés ;
- les contacts supplémentaires restent dans la file d’apparition ;
- grille spatiale de 160 unités pour les recherches de cibles ;
- maximum de 1 100 cadavres persistants ;
- rendu seulement des entités dans la zone visible ;
- minimap rafraîchie à fréquence réduite ;
- métriques urbaines et interface mises à jour moins souvent que la simulation.

Le nombre total par vague reste sans limite théorique ; le plafond simultané transforme les très grandes vagues en pression prolongée plutôt qu’en surcharge immédiate du navigateur.

## Sauvegarde

La sauvegarde versionnée contient :

- difficulté et graine ;
- ressources ;
- joueur et chargeurs ;
- structures, intégrité, progression et pression des corps ;
- unités ;
- zombies actifs ;
- état des gisements ;
- directeur de vague ;
- cycle journalier et météo ;
- moral, point de ralliement, statistiques et objectifs.

Une migration devra augmenter `SAVE_VERSION` et prévoir une fonction de transformation avant toute modification incompatible.

## Extension recommandée

Pour ajouter un bâtiment :

1. créer sa définition dans `BUILDINGS` ;
2. ajouter uniquement un traitement spécifique si ses propriétés génériques ne suffisent pas ;
3. écrire un test sur son coût, son palier et ses dépendances ;
4. vérifier la sauvegarde/reprise ;
5. vérifier son rendu à petite et grande échelle.

Pour ajouter un infecté :

1. créer le profil dans `ENEMIES` ;
2. ajouter son poids dans `wavePlan` ;
3. implémenter uniquement sa capacité distinctive dans `updateZombies` ;
4. préserver une faiblesse tactique claire ;
5. ne pas remplacer la difficulté de masse par des points de vie excessifs.

## Port 3D

La simulation peut être séparée du rendu et migrée vers Godot ou Unreal Engine. Les données de `core.js` doivent devenir des Resources/DataTables, tandis que les systèmes suivants restent conceptuellement identiques :

- grille d’occupation ;
- coûts de navigation pondérés ;
- directeur de vague ;
- signature ;
- économie ;
- pression des corps ;
- sauvegarde versionnée.
