# Roadmap de production

La version 1.0 incluse est une verticale complète et jouable. Les étapes suivantes concernent le passage d’un jeu Canvas autonome à une production commerciale 3D semi-réaliste.

## Phase 1 — Consolidation de la version actuelle

- profils graphiques pour les petites configurations ;
- écran de statistiques détaillées ;
- export/import manuel des sauvegardes ;
- nettoyage des corps assignable à des équipes ;
- portes ouvertes/fermées manuellement ;
- alarmes par secteur ;
- raccourcis de groupes de fusiliers ;
- davantage de scénarios de départ.

## Phase 2 — Simulation urbaine avancée

- routes logistiques visibles ;
- brouettes, chariots, camionnettes et camions ;
- travailleurs spécialisés ;
- incendies et propagation ;
- eau potable, canalisations et contamination ;
- quarantaine, morsures et tests ;
- quartiers nommés pouvant être évacués et fermés ;
- opérations de reconquête rue par rue ;
- avant-postes reliés à la cité.

## Phase 3 — Port 3D semi-réaliste

### Cible recommandée

Unreal Engine 5 pour la production principale, avec :

- caméra troisième personne et vue stratégique continue ;
- World Partition ;
- Mass Entity pour les foules ;
- Niagara pour poussière, pluie, fumée et impacts ;
- Navigation Invokers et coûts de zones pour les hordes ;
- DataTables reprenant `src/core.js` ;
- Instanced Static Mesh pour les remparts ;
- sauvegarde versionnée reprenant le schéma actuel ;
- Blueprints privilégiés, C++ uniquement pour les systèmes de foule et de sauvegarde nécessitant des performances supplémentaires.

### Verticale 3D initiale

- dépôt routier central ;
- personnage, récolte et portage ;
- dix bâtiments ;
- palissade traçable ;
- ouvriers ;
- fusiliers ;
- cent à cinq cents zombies ;
- brèche et repli ;
- sauvegarde ;
- cycle jour/nuit.

## Phase 4 — Mégacité et sièges

- remparts habitables ;
- voies ferrées internes ;
- casernes intégrées ;
- artillerie et dépôts de munitions ;
- milliers d’habitants simulés par niveaux de détail ;
- migrations visibles à plusieurs kilomètres ;
- sièges durant plusieurs jours ;
- plusieurs fronts commandés en coopération.

## Phase 5 — Modes

- campagne scénarisée ;
- Citadelle infinie ;
- simulation réaliste ;
- scénarios spécialisés ;
- coopération jusqu’à quatre joueurs ;
- défis hebdomadaires locaux ou serveur optionnel sans avantage payant.
