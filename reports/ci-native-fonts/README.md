# Polices du Canvas natif en CI

Les étapes de tests natifs installent `fonts-dejavu-core`, puis préchargent
DejaVu Sans normal et gras sous l’alias `sans-serif` dans chaque processus
Node. La sonde conserve ses exigences de métriques finies et de vrais glyphes
visibles. Le renderer, le test Art159 original et les versions npm restent
identiques à la base `f3ba02a5b73a55120c02c21d5703902ea3e901d9`.

## Constat direct sur le runner

La première version de cette PR installait le paquet sans initialisation
native. Son [job fullcheck201](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44064499900/job/133974542288)
a confirmé que `fonts-dejavu-core 2.37-8build1` était déjà installé. APT a
réussi ; le précontrôle a ensuite échoué avec 83 erreurs, avant la commande
coûteuse. L’artefact natif vérifié donne :

| CSS sondé | Métriques finies | Glyphes latins visibles |
|---|---:|---:|
| `bold 11px sans-serif` | 82/82 | 0/82 |
| `bold 11px "DejaVu Sans"` | 82/82 | 82/82 |

Les neuf familles enregistrées étaient DejaVu Math TeX Gyre, DejaVu Sans,
DejaVu Sans Mono, DejaVu Serif, Lato, Liberation Mono, Liberation Sans,
Liberation Serif et Noto Color Emoji. La présence d’une famille ne prouve
pas sa résolution par le CSS générique. Le JSON ne prétend pas identifier
la police effectivement choisie ; `fc-match` ne fournit pas cette preuve.

Les [PR28](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44050503433/job/133926823507)
et [PR29](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44051304789/job/133929526350)
échouaient à l’assertion Art159 sur les noms de sites. Leurs anciens logs ne
journalisent ni le nom fautif ni la police résolue. La reproduction locale
et l’artefact plus récent ne permettent pas d’inventer ces détails historiques.

## Initialisation avant le premier Canvas

Dans un registre local contrôlé, charger Noto Color Emoji avant DejaVu Sans
normal et gras reproduit le défaut malgré la disponibilité de DejaVu.
Le mot « Roseraie » mesure 109,50 px sous `sans-serif`, avec un dessin vide ;
il mesure 54,11 px sous DejaVu Sans gras explicite. Art159 réussit alors
2 tests sur 3 et échoue à l’assertion historique.

L’API [Canvas 0.1.100](https://github.com/Brooooooklyn/canvas/blob/v0.1.100/src/global_fonts.rs)
expose `registerFromPath(path, alias)` et `setAlias(family, alias)`.
L’essai de `setAlias` ne conserve que le style normal de la famille. Enregistrer
les deux fichiers avec l’alias conserve le gras et produit le même raster
que DejaVu explicite. L’essai après un premier dessin ne corrige pas le
résultat déjà mis en cache ; l’ordre d’initialisation est donc nécessaire.

Le [bootstrap](../../scripts/ci-native-fonts-bootstrap.cjs) enregistre les
fichiers Ubuntu normal et gras sous leurs noms explicite et générique,
avant tout Canvas. Il conserve le chargement système et les autres familles.
Il ne change pas le CSS du jeu et échoue clairement si les fichiers sont
absents ou refusés. Il reste silencieux en cas de succès pour préserver
les journaux natifs. Le paquet Ubuntu est [disponible](https://packages.ubuntu.com/resolute/fonts-dejavu-core)
et sa [liste de fichiers](https://packages.ubuntu.com/resolute/all/fonts-dejavu-core/filelist)
contient les deux chemins utilisés.

L’[action partagée](../../.github/actions/setup-native-fonts/action.yml)
retourne une seule option canonique de préchargement. Elle est transmise par
`env.NODE_OPTIONS` à la sonde et aux seules étapes de tests natifs des deux
workflows. Selon la [documentation Node 24](https://github.com/nodejs/node/blob/v24.22.2/doc/api/cli.md),
`--require` s’exécute au démarrage et dans les workers et processus dérivés.
Les sous-commandes npm et les enfants des partitions héritent également de
l’environnement. Aucun `NODE_OPTIONS` n’est ajouté aux jobs navigateur ou
Windows, à `npm ci`, ni aux actions de téléversement. Les sorties de l’action
sont utilisées car [GitHub interdit de définir NODE_OPTIONS via GITHUB_ENV](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#setting-an-environment-variable).

## Exception de qualification bornée

La [politique commune](../../scripts/ci-native-node-policy.cjs) autorise
l’absence d’options, comme auparavant, ou uniquement la chaîne exacte
`--require="/chemin/canonique/du/checkout/scripts/ci-native-fonts-bootstrap.cjs"`.
Elle refuse les autres chemins, graphies, préchargements, options concaténées,
espaces ajoutés et filtres. Le fichier doit être ordinaire ; le chemin est
résolu depuis le module du checkout, sans entrée de chemin configurable.
Les contrôles de source propre et leurs empreintes complètes restent en place :
le bootstrap versionné est lié à la même tête que les tests.

Les deux gardes conservent `DEADWALL_SOAK=1` et le rejet des contextes de tests
imbriqués. La partition refuse désormais aussi les deux variables de filtres
que fullcheck201 refusait déjà. Les commandes, leur ordre, les planchers,
les reçus, les sept compteurs, le head exact et les deux `PIPESTATUS` sont
conservés. La commande littérale reste `DEADWALL_SOAK=1 npm run check`.

La [sonde](../../scripts/ci-native-fonts.mjs) n’enregistre aucune police
elle-même. Elle vérifie 82 caractères latins dans chacun des deux CSS, des
métriques finies, une largeur positive, des pixels visibles, des rasters
distincts et la différence avec le caractère manquant U+10FFFF. Elle ajoute
seulement la provenance du bootstrap au JSON ; aucun critère n’est assoupli.

## Vérifications ciblées

Les résultats, empreintes des neuf fichiers de code/configuration et sources
primaires sont dans [verification-v2.json](verification-v2.json).
Le [reçu de la première version](verification.json) reste conservé comme historique.

| Contrôle local, Node 24.22.1 / Canvas 0.1.100 | Résultat |
|---|---|
| Registre mixte, sans bootstrap | Sonde refusée : générique invisible, DejaVu explicite visible ; Art159 2/3 |
| Registre emoji seul, sans bootstrap | Sonde refusée, code 1 ; aucun succès vide |
| Registre mixte avec bootstrap | Sonde acceptée : 164/164 glyphes visibles, métriques finies |
| Registre système avec bootstrap | Sonde acceptée : 164/164 glyphes visibles |
| Enfant distinct héritant du preload | Normal et gras génériques identiques aux rasters explicites ; Art159 original 3/3, aucun skip |
| Gardes 186/201 et tests existants ciblés | 125/125 tests réussis, aucun skip |
| YAML, Bash, syntaxe Node, `git diff --check` | Réussis |
| Comparaison structurée des workflows à la base | Seules la préparation native et son option d’étape diffèrent |
| Renderer, Art159, anciens tests des gardes, package et verrou | Six fichiers identiques octet pour octet à la base |

Les registres isolés utilisent `DISABLE_SYSTEM_FONTS_LOAD=1` uniquement dans
les fixtures de diagnostic. Ils ne reproduisent pas l’ordre exact du runner.
Le bootstrap de production ne définit ni ne modifie cette variable.

Aucune installation système ou npm, ni suite exhaustive, n’a été lancée
localement. APT a été observé en succès sur la première version distante ;
la version avec bootstrap doit encore être exécutée par les workflows après
revue et publication. Ces contrôles ciblés ne constituent pas un succès de
CI complète. Aucun pack artistique n’est modifié.
