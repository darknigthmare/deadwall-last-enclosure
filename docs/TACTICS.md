# Portes et périmètre défensif

Le module pur `src/tactics.js` expose `DeadwallTactics` dans le navigateur et via `module.exports` dans les tests Node. Il se charge après `core.js`, avant `game.js`. Aucun service externe, nouveau coût ou changement de version de sauvegarde n'est nécessaire.

## Trois modes de porte

| Mode | Commandant et survivants | Infectés ordinaires | Champ de flux |
| --- | --- | --- | --- |
| Automatique (`auto`) | Passage autorisé. | Doivent attaquer la porte. | Coût historique de porte, inférieur à un mur lourd. |
| Ouverte (`open`) | Passage autorisé. | Passage autorisé, sans attaquer la porte ouverte. | Coût du terrain libre. |
| Fermée (`closed`) | Passage verrouillé. | Doivent attaquer la porte. | Coût historique de porte. |

Une porte fermée **n'est pas invulnérable** : les infectés récents et rampants peuvent toujours exploiter un amas de corps suffisant, comme sur un mur ou une porte automatique. Le verrouillage échange la circulation des alliés contre le contrôle du passage ; il ne supprime pas le système de pression des corps.

Les portes ouvertes laissent également passer la ligne de vue utilisée pour les attaques au contact. Les modes automatique et fermé l'obstruent. Les autres règles des projectiles et tirs défensifs ne sont pas réécrites par ce lot.

`Game.setGateMode(mode, building = this.selectedBuilding)` retourne un booléen. Il refuse une structure absente du monde, détruite, inachevée, non porte ou un mode inconnu. Il respecte le garde des commandes explicites : aucune commande derrière la pause ordinaire, l'aide ou les paramètres ; le poste de commandement peut autoriser les décisions pendant sa pause tactique.

Fermer une porte ou refermer un passage ouvert en mode automatique est refusé si le commandant, un survivant ou un infecté vivant chevauche son emprise, rayon compris. La porte ne pousse, ne téléporte et n'écrase personne. Les acteurs morts ne bloquent pas la manœuvre. Ouvrir une porte ne nécessite pas de vider son passage.

Chaque changement accepté invalide les routes alliées et le champ de flux des hordes, puis demande une sauvegarde. L'ouvrier replanifie sa route ; il peut attendre si toutes les sorties sont verrouillées. Le champ de flux sera recalculé au prochain pas de simulation, y compris à la sortie d'une pause tactique.

La même protection s'applique à la fin d'un chantier : un mur ou une porte fermée ne se solidifie pas autour d'un acteur vivant. Son achèvement reste à 99,9 % jusqu'à libération de l'emprise, sans invalidation prématurée des routes ni déplacement forcé. Une porte automatique peut être terminée autour d'un allié qui peut déjà la traverser, mais attend si un infecté occupe le passage ; une porte ouverte ne crée aucune nouvelle barrière. Le travail manuel, celui des ouvriers et la progression passive passent par ce contrôle commun.

## Analyse réelle de la fermeture

`Game.getEnclosureStatus()` utilise une propagation cardinale depuis tous les bords de la carte de 128 × 128 cellules. Seuls les murs et les portes vivants et terminés constituent des barrières ; une porte ouverte est traversable. Les bâtiments civils, le score, la signature, les ressources et les chantiers ne ferment pas une enceinte.

`enclosed` est vrai uniquement si aucune cellule du centre de commandement n'est atteignable depuis l'extérieur. Une ligne de nombreux murs ne suffit donc pas. Une poche fermée éloignée du centre ne le protège pas. Une brèche traversable, une porte ouverte ou un chantier à la place d'un rempart peut rouvrir la connexion extérieure.

Le résultat est une **fermeture structurelle**, pas une garantie d'invulnérabilité : des ennemis peuvent déjà être à l'intérieur, une barrière peut tomber ou être franchie sur les corps. Deux murs se touchant par leurs coins ne constituent pas un passage cardinal ; supprimer uniquement le coin extérieur d'un carré ne crée pas nécessairement une brèche praticable.

Le résultat ne compte pas les anneaux disjoints ou concentriques. Une enceinte intérieure intacte peut continuer à protéger le centre malgré une porte extérieure ouverte. Le compteur `openGates` porte sur toutes les portes achevées de la carte, pas uniquement sur la dernière ligne autour du centre.

### Contrat du résultat

- `enclosed`, `hasCore`, `coreReachable` : état du centre.
- `gates`, `openGates` : portes achevées et vivantes, dont passages ouverts.
- `wallCount` : structures de mur ou de porte achevées et vivantes, pas nombre de cellules.
- `barrierCells` : cellules occupées par les barrières actives.
- `exteriorCells` : cellules libres atteintes depuis les bords.
- `interiorCells` : toutes les cellules libres non atteintes, y compris les poches sans centre.

Le résultat est immuable et mémorisé par identité du monde **et** `world.navigationVersion`. Le changement de porte, l'ajout, la destruction, l'amélioration ou l'achèvement d'une structure invalide ce résultat. Un chargement ou une nouvelle partie ne récupère pas un cache appartenant à l'ancien monde, même si les numéros de version coïncident.

La propagation visite chaque cellule au plus une fois ; sa file est un tableau typé limité à 16 384 entrées. Aucun parcours récursif ou recherche par infecté n'est ajouté.

## Sauvegarde et vérification

Le champ existant `gateMode` conserve les valeurs `auto`, `open` et `closed`. Une ancienne sauvegarde sans ce champ reprend en mode automatique ; pas de remise à zéro de la colonie. Les routes et le cache d'enceinte sont reconstruits, pas sérialisés.

`node --test tests/tactics.test.cjs` vérifie les trois modes, la rotation et les rayons d'occupation, la traversée réelle du joueur/des ouvriers/des infectés, les coûts de navigation et la ligne de vue, les rampes de corps, le cache, les brèches et les reprises de sauvegardes. Les essais visuels du panneau et du rendu des portes sont rapportés séparément par la validation d'interface.
