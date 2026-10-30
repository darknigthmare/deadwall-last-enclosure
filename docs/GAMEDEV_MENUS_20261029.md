# Application des guides gamedev : menus et continuité de la campagne

Cette passe poursuit le travail sur les commandes depuis le commit
`d9896060f762a6bf142e6e66df05ad021ddf5eeb`, qualifié séparément dans la PR 22.
Elle applique le guide [game-ui-ux][ui-guide] et sa référence
[layout-and-flow][ui-flow], figés à la même révision amont que le
[guide projet](GAMEDEV_GUIDANCE.md).
La correction de reprise issue de cette qualification applique aussi
[save-systems][save-guide] et sa référence [versioning-and-migration][save-migration] :
reconstruire les données dérivées avant d'interpréter les positions sauvegardées.

## Défauts reproduits

### Entrée maintenue traverse une fenêtre nouvellement ouverte

Dans Chromium, un premier appui sur Entrée ouvre Pause ou le sac et place le
focus sur Reprendre ou Fermer. La répétition de la même touche active alors ce
nouveau bouton : le jeu reprend sans second appui volontaire. Depuis Pause,
la même séquence ouvre puis referme les Paramètres.

La reproduction utilise le build de départ, des événements clavier natifs et
des clics de confiance, sans remplacement du gestionnaire produit. Les
empreintes de `game.js` et `loadout-ui129.js` distribués correspondent aux sources.
Le premier probe exerce Entrée ; le parcours de régression couvre aussi
l'Entrée du pavé numérique.

`Game.bindEvents` empêche maintenant l'activation native répétée des contrôles
discrets par Entrée et Entrée du pavé numérique. Un nouvel appui conserve son
activation normale. La saisie dans les champs, les flèches des curseurs, Tab,
Espace et les raccourcis du navigateur gardent leurs chemins existants.
Ce filtre porte sur l'activation native ; il ne remplace pas les gestionnaires
de touches spécialisés du tir maintenu ou des mini-jeux.

### Échap agit sur le terrain derrière les menus

Les wrappers de certains propriétaires consommaient Échap avant le menu actif :

| État conservé derrière le menu | Effet indésirable observé |
| --- | --- |
| Outils de voirie équipés | Les Paramètres restent ouverts et les outils sont rangés. |
| Placement de programme ou aperçu | Le projet est annulé derrière Paramètres ou Aide. |
| Construction ou ralliement sélectionné | Pause reste ouverte et la sélection disparaît, contrairement au bouton Reprendre. |
| Contrôle manuel d'un mirador ou réimplantation | Le poste ou le placement est abandonné derrière les menus. |
| Déplacement dans un escalier de citadelle | Le trajet est interrompu et l'acteur revient au départ au lieu de rester suspendu. |

Les propriétaires délèguent maintenant à la fenêtre au premier plan. Fermer
Paramètres rend Pause ; fermer Pause rend le terrain avec l'action conservée.
Échap peut ensuite annuler cette action selon ses règles normales. Les travaux
verticaux déjà financés conservent leur avancement et ne sont pas payés à nouveau.

L'annulation des aperçus dans le carnet reste volontairement disponible : un
devis de réimplantation, de programme ou de voirie **effectivement visible dans
sa propre page** peut consommer Échap sans fermer Commandement ni dépenser.
Un aperçu masqué par une autre fenêtre, un autre dossier ou un sous-onglet ne
possède pas cette entrée. Les contrats documentés dans
[Dayworks](DAYWORKS_1_4.md) et [Infrastructure](INFRASTRUCTURE_1_6.md) sont conservés.

## Propriétaires et vérifications

| Propriétaire | Modification | Régression |
| --- | --- | --- |
| `src/game.js` : entrées et `onEscape` de base | Répétition d'Entrée ; priorité de Pause sur la sélection de terrain | `tests/modal-input216.test.cjs` ; parcours Chromium |
| `src/game.js` : Dayworks et Infrastructure | Délégation aux menus ; annulation de l'aperçu propre visible | `tests/modal-input216.test.cjs` ; parcours Chromium voirie |
| `src/fieldcraft.js` | Conservation du poste manuel et de la réimplantation ; exception du devis visible | `tests/modal-operations216.test.cjs` ; tests Fieldcraft existants |
| `src/vertical-citadel175.js` | Suspension du trajet et du travail derrière les menus | `tests/modal-operations216.test.cjs` ; tests Citadel existants |
| `src/exploration-125.js` et `src/fieldcraft.js` | Dimensions métriques rétablies avant la récupération physique au chargement | `tests/save-metric-geometry216.test.cjs` ; parcours services et reprise |
| `scripts/browser-services208.mjs` | Origine physique des transitions et réadmission d'un passage devenu assez large | Archive native et contre-épreuve géométrique ; parcours services Chromium |

Les douze nouveaux cas utilisent l'ordre de scripts du HTML livré sous DOM
simulé. Avant correction, les dix cas d'entrées et les deux cas d'opérations
échouent aux assertions attendues. Les comparaisons DOM utilisent des
identifiants ou booléens afin de conserver des diagnostics bornés.

Les boutons d'annulation de programme et de voirie sont créés dynamiquement
par leurs pages. Les gardes les recherchent dans leur dialogue propriétaire,
`g.ui.commandModal`. Le contrat `tests/static.test.cjs` conserve sa vérification
des références directes aux éléments déclarés dans `index.html`.

Les fixtures avancées sont déclarées : bureau de chantier et bâtiments achevés
sur des positions admissibles, connaissances et ressources de citadelle
préparées. Les opérations, devis, déplacements, paiements et annulations passent
ensuite par leurs propriétaires réels. Ces fixtures ne représentent pas une
progression humaine jusqu'à la citadelle.

Le parcours existant `scripts/browser-feedback215.mjs`, déjà intégré au groupe
CI `quality-regressions`, conserve ses 26 contrôles et ajoute 22 contrôles sur
bureau : Entrée et Entrée du pavé numérique sur trois fenêtres, puis la priorité
d'Échap avec les outils de voirie. Chaque maintien exige un appui initial et
quatre répétitions de confiance, avec focus et simulation stables. La fixture
de voirie appelle seulement l'équipement existant, sans pas de simulation injecté.

### Guidage du parcours physique des services

La qualification a aussi révélé un défaut du pilote tactile de
`scripts/browser-services208.mjs`. Une transition anticipée validait la ligne
physique vers le point suivant, mais le guide suivant repartait du sommet
mathématique précédent. Il réutilisait ainsi une admission à 0,38 m qui ne
décrivait plus le départ réel du joueur.

Dans le [témoin CI](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/40905955279/job/123560631958),
le passage du segment 5 au segment 6 se faisait encore à 3,184 m de ce sommet.
La ligne réelle était libre à 0,32 m et refusée à 0,38 m. Après trois impulsions
physiques valides, l'ancien guide ne pouvait plus rejoindre sa ligne ; le joueur
restait libre, vivant et au terrain. Le profil bureau avait réussi ses 55
contrôles, tandis que le profil tactile s'arrêtait après 43 contrôles.

Le pilote transmet maintenant la pose validée par cette transition au guide
suivant et recalcule son admission à 0,38 m. La trace conserve aussi les points
préparés. Les commandes natives produisent le déplacement, avec les mêmes
contrôles de corps à 0,32 m, de relâchement, de portée et de paiement. Les requêtes
géométriques sur les quatre poses du témoin vérifient le départ réel et son guide
court ; le parcours Chromium complet qualifie ensuite le comportement observable.

#### Réadmettre un passage depuis la position réellement atteinte

Sur `6b27d0b`, le profil bureau réussit ses 55 contrôles, dont la reprise finale
stricte. Le tactile s'arrête après 43 contrôles à 318,85 secondes de simulation :
le personnage possède encore 70 points de vie, mais le noyau de D-17 est détruit.
L'[archive originale](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/40928472387/artifacts/12922342691)
conserve les 534 gestes observés, la cité initiale et l'état final. Son SHA-256
est `7cd2434e436069bb08f3c17db6796cfc0efa10f4c8ec98d347e332f786e7bdea` ;
les CRC de ses 27 membres ont été vérifiés.

Le segment 5 de 21,77 m garde une admission initiale refusée à 0,38 m pendant
107,209 secondes réelles. Il cumule 244 impulsions, dont 81 sans déplacement,
et 32 inversions consécutives. L'admission figée maintient ainsi les petits
gestes prudents même après le dégagement du coin initial. Le temps du monde
continue entre les commandes natives ; les vagues et les dégâts restent actifs.

Une lecture géométrique des 361 poses enregistrées sur les segments 5 et 6,
avec les propriétaires et paramètres de carte du rapport, confirme le défaut.
Dès le deuxième geste du segment 5, la pose réelle
`(14581.375878190927, 2632.0962985729793)` admet la ligne vers la même cible à
0,38 m, tandis que l'ancienne origine reste refusée. Le dégagement de 0,6 m est
également disponible. Cette sonde n'instancie pas de jeu, n'avance aucune
simulation et ne produit aucun déplacement natif.

Le pilote réévalue maintenant une admission refusée depuis la pose courante.
Quand la ligne vers la cible passe le même contrôle à 0,38 m, il conserve cette
pose comme nouvelle origine du guide et journalise les deux origines dans
`guideReadmissions`. L'origine et son admission évoluent ensemble. Les arrêts
d'arrivée, d'interruption ou de transition restent prioritaires ; le corps de
0,32 m, le dégagement de 0,6 m, les commandes et toutes les assertions restent
ceux du parcours existant. Les stocks, la santé et l'horloge ne sont pas modifiés
par le pilote.

La contre-épreuve sur les anciennes poses vérifie ce changement de décision.
Elle ne prédit pas la trajectoire future ni le temps de survie du camp : le
parcours Chromium du nouveau commit doit les qualifier effectivement.

### Dimensions des décors avant récupération des acteurs à la reprise

Sur la tête `3bb9b31`, le parcours bureau des services atteint les quatre supports
et valide leurs paiements. Le contrôle final de sauvegarde/reprise signale ensuite
une différence limitée à `zombies`, avec le même effectif de 18 et le même RNG.
L'[archive originale](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/40921207524/artifacts/12918282784)
ne contient pas les valeurs divergentes. Une première simulation native de
239,04 secondes ne reproduit pas cet écart ; elle ne qualifie pas le parcours
Chromium et n'en exclut pas le défaut.

Une reproduction distincte, sans avancer la simulation, établit une régression
d'ordre de restauration. Dans une campagne actuelle de graine 17117, le nœud de
ferraille 168 a un corps métrique de 147,2 × 59,2 unités locales. Un Errant placé
explicitement à `(3793.55, 1720.8)` est admis par les collisions actuelles. La
reprise le déplace pourtant à `y = 1712.0532935585268` : le module de terrain
évalue temporairement ce décor sans ses métadonnées métriques. La pile observée
relie ce déplacement à `recoverActor`, appelé par `setup` pendant la restauration.
Les dimensions finales ne sont rétablies qu'ensuite par l'exploration.

L'exploration partage maintenant une préparation limitée à `metric202`, `body202`
et `renderSize`. Le module de terrain l'appelle sur le nouveau monde avant son
`setup`, avec la révision issue des données validées. Le packing du nouveau
départ garde sa place et sa logique. Les positions et quantités enregistrées
restent autoritaires ; une vraie collision conserve son mécanisme de récupération.
Les anciennes révisions gardent leurs dimensions historiques. Aucun champ de
sauvegarde ni règle d'équilibrage n'est ajouté.

Le test ciblé protège la pose valide, le dégagement d'un vrai recouvrement et le
garde des révisions historiques. Le pilote des services conserve sa comparaison
stricte de tous les propriétaires. En cas d'écart, il ajoute au rapport les valeurs
attendues et restaurées des clés divergentes, avant de retirer son observateur.
Cette lecture ne modifie pas l'état du jeu. Le défaut déterministe et l'échec CI
initial restent deux preuves distinctes. Sur `6b27d0b`, les cinq reprises
effectivement atteintes sont strictement égales, dont la reprise finale du
profil bureau ; le RNG final `3035373242` est conservé. L'échec tactile décrit
plus haut intervient pendant la marche, avant sa dernière reprise.

Commandes ciblées :

```sh
npm run build
node --test --test-concurrency=1 tests/static.test.cjs tests/modal-input216.test.cjs tests/input-save-boundaries.test.cjs tests/ui-focus130.test.cjs tests/loadout-keyboard.test.cjs tests/undercovered200-input.test.cjs
node --test --test-concurrency=1 tests/modal-operations216.test.cjs tests/fieldcraft.test.cjs tests/vertical-citadel175.test.cjs
node --test --test-concurrency=1 tests/save-metric-geometry216.test.cjs
node scripts/browser-feedback215.mjs
node scripts/browser-services208.mjs
```

Les résultats exécutés, la révision finale et les preuves de la commande
intégrale `DEADWALL_SOAK=1 npm run check` sont consignés dans la PR. Les quatre
rapports du suivi du monde doivent être régénérés par leurs producteurs après
modification des sources ; leurs empreintes ne sont pas corrigées à la main.

Le DOM simulé ne reproduit pas les clics par défaut d'Entrée : le parcours
Chromium les vérifie séparément. Le profil tactile reste une émulation Chromium,
sans qualification de téléphone physique. Le format des sauvegardes, les
catalogues, les coûts et les générateurs ne changent pas dans cette passe.

[ui-guide]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/SKILL.md
[ui-flow]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/references/layout-and-flow.md
[save-guide]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/save-systems/SKILL.md
[save-migration]: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/save-systems/references/versioning-and-migration.md
