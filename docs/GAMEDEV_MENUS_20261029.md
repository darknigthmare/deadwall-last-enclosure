# Application des guides gamedev : priorité des menus et validation clavier

Cette passe poursuit le travail sur les commandes depuis le commit
`d9896060f762a6bf142e6e66df05ad021ddf5eeb`, qualifié séparément dans la PR 22.
Elle applique le guide [game-ui-ux][ui-guide] et sa référence
[layout-and-flow][ui-flow], figés à la même révision amont que le
[guide projet](GAMEDEV_GUIDANCE.md).

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

Les douze nouveaux cas utilisent l'ordre de scripts du HTML livré sous DOM
simulé. Avant correction, les dix cas d'entrées et les deux cas d'opérations
échouent aux assertions attendues. Les comparaisons DOM utilisent des
identifiants ou booléens afin de conserver des diagnostics bornés.

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

Commandes ciblées :

```sh
node --test --test-concurrency=1 tests/modal-input216.test.cjs tests/input-save-boundaries.test.cjs tests/ui-focus130.test.cjs tests/loadout-keyboard.test.cjs tests/undercovered200-input.test.cjs
node --test --test-concurrency=1 tests/modal-operations216.test.cjs tests/fieldcraft.test.cjs tests/vertical-citadel175.test.cjs
npm run build
node scripts/browser-feedback215.mjs
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
