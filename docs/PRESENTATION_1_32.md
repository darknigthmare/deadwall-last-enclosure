# Présentation 1.32 — Le quartier général

## Intention

L’entrée dans DEADWALL présente un refuge à rejoindre, puis un dossier de départ. Le commandement prend l’apparence d’une table d’opérations : photographie de la salle, carte active, réserves et accès illustrés. Les coûts, conditions et ordres restent ceux des systèmes existants.

## Écran titre

- Une zone rassemble le titre, la promesse de survie et les commandes principales.
- Le dossier de départ conserve le vrai sélecteur de scénario et les trois difficultés. Quatre accroches accompagnent le dépôt, le convoi, la reconstruction et l’arrière-garde.
- Personnel/ravitaillement, graine et détails de sauvegarde sont consultables dans des volets natifs `details`. Leurs informations ne sont pas supprimées.
- Le champ de graine s’ouvre avant le retour de focus lors d’une réutilisation de carte ou d’une erreur de validation.
- Les radios de difficulté réelles déclenchent le recalcul du dossier. Le module historique se basait sur des IDs non présents dans le HTML.

Le bouton « Revoir l’introduction » du menu Pause appelle `campaignIntro132.replay()` ; la fin de relecture rend le focus à ce bouton et conserve la pause.

Le bouton Nouvelle partie reste le bouton original, avec sa confirmation de remplacement de campagne et l’introduction automatique gérée par `campaign-intro132.js`. Aucun second système de lancement ou de sauvegarde n’est ajouté.

## Commandement et équipement

Les six onglets conservent leurs handlers et leur navigation clavier. « Campagnes » désigne les records ; « Archives » dans Opérations désigne les chroniques, pour éviter la confusion. Trois accès illustrés relient la situation aux portes, aux sorties et au personnel. La carte visible demeure celle rendue par le système de commandement ; les images décoratives ne remplacent ni cette carte ni les données de la graine.

Les cinq domaines d’Opérations reçoivent une iconographie commune et un front de dossier illustré. Des filets nets, surfaces opaques, niveaux de titres et états disponibles/indisponibles remplacent les contours disparates. Les contenus et coûts demeurent visibles. Inventaire, pause, paramètres, manuel et instruments périphériques utilisent la même gamme acier/olive/laiton.

## Images et pictogrammes

Les images de cette version sont intégrées aux styles :

- `assets/intro-bastion132.webp` : écran titre, départ classique, accès défense ;
- `assets/intro-road132.webp` : convoi, sorties, dossiers d’exploration ;
- `assets/command-room132.webp` : commandement, pause et équipement.

Leur provenance et leurs prompts sont gérés avec les assets de la version. Les seize pictogrammes vectoriels de `presentation132.js` sont des tracés originaux écrits pour cette interface, sans bibliothèque externe. Ils sont décoratifs (`aria-hidden`, non focalisables) ; les noms accessibles restent textuels.

## Contrats et performances

`DeadwallPresentation132.install(game, document)` s’installe après les contrôleurs d’interface et `command-presentation129.js`, idéalement après l’introduction. Il déplace les nœuds existants du titre et les conserve, plutôt que de les reconstruire. Une seconde installation est refusée. La seule enveloppe concerne `scenarioUI.refresh`, pour synchroniser les changements programmatiques de scénario et le champ de graine.

Aucun `requestAnimationFrame`, timer, canvas supplémentaire ou observateur global n’est introduit. Les changements de scénario sont événementiels. Le lent mouvement du front de départ dure 22 secondes, sans boucle infinie. Les transitions sont coupées par le réglage du jeu et par la préférence système de mouvement réduit.

Le titre passe en une colonne sous 800 px ; le commandement conserve une barre d’onglets défilante puis son panneau central à défilement indépendant. Les réglages, informations et commandes restent accessibles au clavier. Les surfaces textuelles sont opaques ; un mode contraste élevé supplémentaire est prévu.

## Vérification ciblée

`node --test tests/presentation132.test.cjs` : sept scénarios automatisés vérifient l’identité des contrôles/handlers après déplacement, les quatre départs et la conservation des ressources, la réutilisation de graine et la validation, les radios réelles, les ordres/navigation du commandement, ainsi que la stabilité DOM/focus et le caractère décoratif des SVG et la relecture depuis Pause sans reprise accidentelle de simulation.

Ces tests emploient le DOM simulé du projet et ne constituent pas des captures de navigateur. La vérification visuelle en navigateur et la vérification globale de distribution sont consignées dans le rapport de livraison.
