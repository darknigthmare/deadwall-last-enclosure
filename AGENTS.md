# Consignes Codex — DEADWALL

Avant toute modification, lire dans cet ordre :

1. `docs/ORIGINAL_BRIEF.txt`
2. `docs/GAME_DESIGN.md`
3. `docs/ARCHITECTURE.md`
4. `docs/BALANCING.md`
5. `docs/CODEX_MASTER_PROMPT.md`

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
