# Retours d’action, audio et sac — 29 octobre 2026

Cette passe poursuit l’application des [guides gamedev](GAMEDEV_GUIDANCE.md)
depuis le commit `6101133835e5cf230fcbda7d1269779a497f4564`. Les disciplines
`game-feel`, `audio-design` et `game-ui-ux` sont adaptées aux propriétaires
existants du moteur.

## Défauts reproduits et comportement attendu

### Caméra pendant une interruption

Un impact donnait un nouveau décalage aléatoire à chaque dessin. Pendant Pause,
la perte de focus ou le masquage du document, le temps actif et l’amplitude
restaient figés mais le fond continuait de trembler. Nouvelle partie et
Continuer pouvaient aussi conserver un impact de la campagne remplacée.

Le rendu échantillonne maintenant une oscillation continue depuis le temps
actif existant. Deux dessins au même instant conservent le même décalage ;
reprendre le jeu laisse la décroissance historique ramener l’effet au repos.
La préférence de mouvements réduits supprime ce déplacement. Les changements
de campagne validés remettent l’effet transitoire à zéro ; une demande invalide
conserve le monde et son effet courants.

Les intensités des tirs, coups et destructions, la limite de déplacement de la
caméra et sa décroissance restent celles du jeu. L’effet agit sur le rendu,
sans déplacer le personnage ni modifier les collisions ou les tirs. Les
lecteurs d’éclairage gardent le même `frameShake`.

Propriétaire : `Game.render`, `startNew` et `restoreSave` dans `src/game.js`.
Régression : `tests/camera-feedback.test.cjs`.

### Reprise du périphérique audio

Un contexte audio suspendu ou interrompu pouvait accepter jusqu’à 48 sons,
tous programmés au même instant arrêté. Ils occupaient le budget des voix puis
repartaient ensemble au retour du périphérique.

`AudioSystem.voice` accepte une nouvelle demande seulement lorsque le contexte
est effectivement `running`. Un geste utilisateur peut toujours demander sa
reprise par `unlock` ; les demandes reçues avant la fin de cette reprise sont
abandonnées. Les nouveaux sons peuvent ensuite jouer et libérer leurs nœuds
normalement. Les transactions de gameplay restent indépendantes du son.

Propriétaire : `AudioSystem` dans `src/game.js`.
Régression : `tests/quality199-audio.test.cjs`, complétée par les contrats de
récupération existants.

### Maintien du raccourci du sac

Le premier appui sur I ouvrait l’équipement et mettait le jeu en pause, mais la
répétition envoyée par le système d’exploitation pouvait immédiatement fermer
la fenêtre et reprendre la partie. Le raccourci d’ouverture filtrait déjà les
répétitions ; son propriétaire de fermeture ne le faisait pas.

La fenêtre consomme les répétitions de I et d’Échap sans se fermer. Après avoir
relâché la touche, un nouvel appui peut fermer le sac. Le focus et l’état
antérieur de pause restent gérés par les mêmes contrôleurs, y compris depuis
le commandement et la carte.

Propriétaire : `src/loadout-ui129.js`.
Régression : `tests/loadout-keyboard.test.cjs` avec le document complet chargé
dans l’ordre livré.

## Vérification reproductible

Les tests natifs exercent les contrôleurs, leurs propriétaires et les refus.
Le nouveau parcours navigateur utilise la distribution construite, la vraie
répétition clavier, les commandes tactiles, les paramètres et un véritable
`AudioContext` Chromium :

```sh
npm run build
node --test --test-concurrency=1 tests/camera-feedback.test.cjs tests/quality199-audio.test.cjs tests/loadout-keyboard.test.cjs tests/loadout-cross129.test.cjs tests/undercovered200-input.test.cjs tests/recovery.test.cjs tests/actor-motion152.test.cjs
DEADWALL_QA_ROOT=dist node scripts/browser-feedback215.mjs
DEADWALL_SOAK=1 npm run check
```

Le parcours `browser-feedback215.mjs` rejoint le groupe `quality-regressions`
de la CI existante. Il compare les scripts distribués aux sources du checkout,
conserve les erreurs et captures, puis vérifie la stabilité des sources.

Deux préparations y sont explicites : un point de blessure appliqué par le
propriétaire réel avant Pause pour observer l’impact, et la suspension du
contexte audio avant 120 demandes diagnostiques de son. Aucun pas de simulation
n’est injecté. L’état `interrupted` est reproduit dans les tests natifs ; le
navigateur qualifie une vraie suspension `suspended`. Ces preuves ne remplacent
ni une écoute sur un périphérique physique, ni un téléphone réel, ni une mesure
de performances GPU ou une campagne humaine complète.

Les résultats exécutés et le commit effectivement qualifié sont consignés dans
la PR. Les audits du suivi G11 doivent être régénérés sur les sources modifiées
avant le contrôle intégré ; leurs empreintes ne sont pas réécrites à la main.

### Réception ciblée locale

Les trois lots natifs passent respectivement **21**, **31** et **34** tests,
soit **86 réussites**, sans échec ni test ignoré. Les nouvelles régressions
avaient été exécutées avant correction : six échecs caméra, deux échecs audio
et le cas de maintien de I depuis le terrain reproduisaient les défauts.

Le parcours Chromium final passe **13 contrôles sur ordinateur et 13 en tactile
émulé**, sans erreur de page, console ou réseau. Il vérifie les 228 empreintes
source avant/après et les octets des scripts distribués. Les 120 sons demandés
pendant la suspension n’allouent aucun nœud ; la reprise et les deux sons frais
libèrent leur budget normalement. Les huit images observées pendant Pause
gardent un décalage identique et la sauvegarde complète inchangée.

Cette réception locale utilise Chrome for Testing **156.0.8078.73**. La CI garde
son Chromium verrouillé par les dépendances du projet. Un premier essai est
conservé en échec : le délai de 15 secondes du nouveau script expirait pendant
la création du monde sur ordinateur, avant tout contrôle. Le parcours tactile
y passait déjà ses 13 contrôles. Le démarrage reprend maintenant le délai de
120 secondes utilisé par le parcours des menus ; les interactions suivantes
gardent leur délai de 15 secondes. Aucun résultat de cet essai incomplet n’est
compté dans les 26 réussites du passage final.
