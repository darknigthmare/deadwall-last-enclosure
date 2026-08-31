# Prompt maître Codex — DEADWALL

Tu travailles sur **DEADWALL — La Dernière Enceinte**, propriété de Darknigthmare. Lis d’abord `README.md`, `docs/ORIGINAL_BRIEF.txt`, `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md` et `docs/BALANCING.md`. Inspecte ensuite l’ensemble du code avant toute modification.

## Mission permanente

Améliorer le jeu professionnellement sans supprimer, simplifier abusivement ou désynchroniser les systèmes existants. Chaque ajout doit renforcer la boucle :

```text
récolter → déposer → construire → automatiser → agrandir → fortifier → survivre → réparer/reconquérir
```

## Contraintes non négociables

1. Le gameplay montré au joueur doit être le gameplay réellement jouable.
2. Le début reste manuel et tactile ; l’automatisation arrive progressivement.
3. Le personnage reste contrôlable même lorsque la cité devient immense.
4. Les hordes gagnent surtout en nombre, fronts, pression et durée, pas en points de vie absurdes.
5. L’univers zombie reste sérieux, crédible et non fantastique.
6. La ville doit pouvoir comporter plusieurs enceintes concentriques.
7. La perte d’un mur ou quartier n’entraîne pas immédiatement la défaite ; seule la chute du centre de commandement termine la partie.
8. Les portes restent des points faibles tactiques attractifs pour le champ de flux.
9. Les cadavres doivent avoir une conséquence défensive réelle.
10. Toute croissance de la cité augmente également sa signature.
11. Les ressources, bâtiments, unités, énergie, population, moral, munitions et vagues restent interconnectés.
12. Aucun service payant, publicité, énergie mobile, microtransaction ou télémétrie intrusive.
13. Aucun asset externe non licencié. Les graphismes actuels combinent atlas/textures originaux OpenAI documentés et rendu procédural de secours ; préserver leur provenance et les notices des composants tiers.
14. La sauvegarde existante ne doit jamais être cassée silencieusement.
15. Le projet doit rester lançable sans installation complexe.

## Méthode obligatoire

Avant de coder :

1. reformuler l’objectif technique ;
2. identifier les systèmes touchés ;
3. détecter les risques de régression ;
4. choisir une solution compatible avec la sauvegarde ;
5. définir les tests à ajouter.

Après le codage :

```bash
npm run check
```

Corrige toutes les erreurs. Lance également le jeu localement et vérifie au minimum : menu, nouvelle partie, déplacement, récolte, dépôt, placement, chantier, vague, sauvegarde et reprise.

## Conventions

- JavaScript strict et lisible ;
- valeurs d’équilibrage dans `src/core.js` ;
- logique de simulation dans `src/game.js` ou dans de futurs modules clairement séparés ;
- aucune duplication de données ;
- fonctions courtes lorsque leur extraction améliore réellement la lisibilité ;
- commentaires uniquement pour expliquer une intention non évidente ;
- aucune valeur magique importante sans nom ou documentation ;
- conserver la compatibilité clavier AZERTY et QWERTY ;
- préserver les performances avec plusieurs centaines d’infectés.

## Critères de qualité d’un ajout

Un ajout n’est terminé que lorsqu’il possède :

- un rôle dans la boucle principale ;
- un coût et une contrepartie ;
- un retour visuel et sonore ;
- une interaction avec au moins deux systèmes existants ;
- un comportement sauvegardé si nécessaire ;
- un test automatique ;
- une documentation mise à jour ;
- aucune régression sur `npm run check`.

## Priorités de production

1. polish et lisibilité des combats à grande échelle ;
2. secteurs et portes contrôlables ;
3. équipes de nettoyage des cadavres ;
4. véhicules et routes logistiques ;
5. opérations de reconquête de quartiers ;
6. événements crédibles : panne, incendie, crue, siège prolongé ;
7. chaîne de quarantaine et infection ;
8. port 3D semi-réaliste conservant exactement les règles de simulation.

## Interdictions

- ne jamais remplacer la profondeur par un simple compteur incrémental ;
- ne jamais transformer les zombies en monstres colorés ou boss géants sans justification réaliste ;
- ne jamais faire disparaître les coûts logistiques des tourelles ;
- ne jamais rendre une unique couche de mur suffisante à toutes les vagues ;
- ne jamais supprimer une fonctionnalité existante pour livrer plus vite ;
- ne jamais déclarer une tâche terminée sans tests.
