# Architecture technique

## Objectif de la version actuelle

Le moteur est un Canvas 2D/2.5D avec interface HTML/CSS et simulation JavaScript. Le joueur utilise soit l'application Windows Electron autonome, soit la PWA, soit le fichier HTML autonome. Aucun service réseau n'est requis pour une partie locale. Le développement web utilise un build Node.js sans dépendances externes ; fabriquer le paquet Windows exige les outils Electron verrouillés par le lockfile. Ce n'est pas un port 3D natif.

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

### Modules spécialisés

| Module | Responsabilité |
| --- | --- |
| `src/scenarios.js`, `src/scenario-ui.js` | Quatre départs à contreparties, choix et aperçu de leurs conditions initiales. |
| `src/squads.js`, `src/squad-ui.js` | Trois sections, ordres/ralliements et interface de commandement. |
| `src/battlefield.js`, `src/battlefield-ui.js` | Contacts par front, proximité du centre et débrief factuel. |
| `src/narrative.js` | Traces originales, chapitres et validation stricte du registre ; aucun gain au chargement. Chargé après core et avant save. |
| `src/narrative-ui.js` | Journal facultatif, relevés et choix affichés ; transactions uniquement dans Game. |
| `src/save.js` | Validation et migration transactionnelles de sauvegardes avant mutation du monde. |
| `src/tactics.js` | Portes, collisions et diagnostic topologique du périmètre. |
| `src/profile.js` | Records locaux, identités de campagne et historique borné, sans bonus permanent. |
| `src/world-content.js` | Six sites et 48 décors récupérables déterministes, RNG séparé des gisements historiques. |
| `src/art.js` | Catalogue de dix atlas/textures, découpe, matte décodée une fois et animation. |
| `src/ui.js`, `src/command-ui.js`, `src/content-ui.js`, `src/narrative-ui.js` | Paramètres/import, pause tactique, dossiers de terrain et récit. |
| `desktop/` | Protocole local, sandbox, profil persistant et QA de l'application Windows. |

`scripts/build.mjs` définit la liste publique explicite, copie les fichiers dans `dist` et intègre scripts/styles/images au standalone. Le serveur et le protocole PC refusent les fichiers de pilotage. `.vercelignore` réduit les fichiers envoyés au build distant ; ce n'est pas une règle d'autorisation HTTP. Le test de distribution reconstruit le jeu dans un dossier sans `node_modules` et compare build, cache PWA et protocole PC.

## Boucle de simulation

La boucle `requestAnimationFrame` limite le pas à 40 ms pour éviter les bonds de simulation et suspend les mises à jour quand le jeu est en pause. Le rendu reste actif. Un test qui appelle directement `update(dt)` avance bien la simulation même si la boucle automatique est en pause. L’ordre est :

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

Les seize types de décors des six sites sont passables et récupérables : ils ne constituent pas des murs ou un couvert physique. Leur ajout conserve les IDs des gisements historiques ; une ancienne construction superposée les épuise à la reprise. La graine reproduit la carte, pas un défi compétitif synchronisant tous les inputs.

## Champ de flux

Le champ est invalidé après les changements de structures, d'achèvement ou de modes de portes. Un Dijkstra pondéré calcule le coût de chaque cellule vers le centre. Chaque zombie lit ensuite le voisin de coût inférieur, avec une faible variation individuelle. Le Traqueur peut dévier vers un allié isolé visible, avec scans bornés et contrôle physique des accès.

Cette approche coûte davantage lors d’une construction, mais rend le déplacement de centaines de zombies très léger pendant les vagues.

Les alliés utilisent une recherche A* cardinale distincte : au plus six recherches de 8 192 expansions par mise à jour, cache de route invalidé avec le monde, délai de reprise 1,25 seconde et répartition des tentatives dans le groupe. Cela ne constitue pas un système d'évitement individuel des foules.

## Performance des hordes

- maximum de 720 zombies simultanés (`PERFORMANCE_LIMITS.zombies`) ;
- huit compteurs de contacts en attente et tampon d'apparition de 64 entrées ;
- grille spatiale de 160 unités pour les recherches de cibles ;
- maximum de 900 cadavres visuels, également retirés après 100 secondes ; la pression sauvegardée des remparts est une donnée distincte ;
- maximum de 950 particules et 85 sources lumineuses ;
- rendu seulement des entités dans la zone visible ;
- minimap rafraîchie à fréquence réduite ;
- métriques urbaines et interface mises à jour moins souvent que la simulation.

Le mode n'a pas de dernière vague scénarisée ; les nombres restent toutefois bornés par la représentation numérique et la validation des sauvegardes. Le plafond simultané transforme les grandes vagues en pression prolongée. Ces limites techniques ne certifient ni une cadence d'images sur tout matériel ni l'équilibrage d'une campagne extrême.

## Sauvegarde

La sauvegarde versionnée contient :

- difficulté, graine et condition de départ ;
- ressources ;
- joueur et chargeurs ;
- structures, intégrité, progression et pression des corps ;
- unités ;
- zombies actifs ;
- état des gisements ;
- directeur de vague ;
- cycle journalier et météo ;
- moral, points de ralliement et ordres des trois sections, statistiques et objectifs ;
- registre narratif et décisions uniques.

La version 2 conserve une copie de secours et accepte la migration v1. Les compteurs de horde, ordres, modes de portes, doctrines, crises et états de spécialistes sont additifs. Les routes temporaires sont recalculées. Le profil de records utilise ses propres clés et conserve dix campagnes récentes ; les meilleurs résultats anciens restent mémorisés. Les profils Windows et navigateur sont séparés : aucun profil voisin n'est lu automatiquement.

Une migration devra augmenter `SAVE_VERSION` et prévoir une fonction de transformation avant toute modification incompatible.

La reprise utilise l’identifiant temporaire réservé 0 pour le joueur, déjà représenté par cette sentinelle dans les cibles de soin : ouvrir une sauvegarde ne consomme plus un nouvel identifiant. Les compteurs dérivés épuisés sont refusés avant remplacement du monde. Les IDs de structures restent compatibles avec la grille `Int32Array` ; il ne s’agit pas d’un espace d’identifiants infini.

Les devis d’entretien sont recalculés depuis les structures vivantes et les stocks courants. La confirmation du démontage est transitoire : ni sauvegardée, ni conservée à un changement de sélection ou à l’ouverture d’une modale. Les coûts restent centralisés dans `MAINTENANCE_RULES`.

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

Ce port est une possibilité d'évolution, pas un composant livré. Signature éditeur, licences embarquées et limites de mise sur le marché : [DESKTOP.md](DESKTOP.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
