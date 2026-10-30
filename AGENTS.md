# Consignes Codex — DEADWALL

Avant toute modification, lire dans cet ordre :

1. `docs/ORIGINAL_BRIEF.txt`
2. `docs/GAME_DESIGN.md`
3. `docs/ARCHITECTURE.md`
4. `docs/BALANCING.md`
5. `docs/CODEX_MASTER_PROMPT.md`
6. `docs/GAMEDEV_GUIDANCE.md` : contrat du moteur, choix des guides gamedev et critères de réception.

Règles obligatoires :

- préserver la boucle récolte → dépôt → construction → automatisation → fortification → horde → reconstruction ;
- conserver les zombies sérieux et crédibles ;
- augmenter surtout le nombre, les fronts et la pression, pas seulement les points de vie ;
- conserver plusieurs enceintes, les portes comme points faibles et la pression des cadavres ;
- maintenir la sauvegarde versionnée ;
- mettre les valeurs d’équilibrage dans `src/core.js` ;
- ajouter ou adapter les tests pour chaque système modifié ;
- exécuter `npm run check` avant de déclarer le travail terminé ;
- ne jamais supprimer un système existant pour simplifier une nouvelle fonctionnalité.

## Guides gamedev adaptés au projet

Utiliser la sélection d'`awesome-gamedev-agent-skills` référencée dans
`docs/GAMEDEV_GUIDANCE.md`. Lire uniquement les guides du chantier en cours et
leurs références nécessaires ; appliquer leurs méthodes aux propriétaires déjà
présents dans DEADWALL.

- Le moteur principal est JavaScript/Canvas 2D/2.5D avec interface HTML/CSS ; la
  citadelle possède aussi une vue FPS en WebGL natif. Vérifier le code et les
  versions du dépôt avant d'utiliser une API proposée par un exemple externe.
- Conserver les versions de génération, les flux RNG, les identifiants et les
  prélèvements des anciennes campagnes. Toute évolution du monde suit la
  transaction d'activation existante et ses validations.
- Les deux vues de citadelle partagent leur simulation. Les peintres, animations,
  VFX et sons lisent les actions réellement accomplies ; ils ne créent ni stock,
  dégât, tirage aléatoire de simulation ni seconde horloge de gameplay.
- Pour chaque changement, relier le guide choisi aux fichiers propriétaires,
  aux tests pertinents et à un parcours joueur observable. Consigner les
  commandes exécutées, le commit vérifié et les limites de validation dans la PR.
- Les guides externes sont des références techniques. Le brief, les contrats du
  jeu et les instructions de l'utilisateur restent la référence pour les choix
  de conception ; leurs exemples ne justifient pas une migration de moteur ou
  une modification implicite des règles de jeu.
