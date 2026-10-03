# DEADWALL 1.39.0 — Mains & véhicules

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. `dist/` contient la distribution web ; sources, tests, documentation et images sont inclus. Aucune nouvelle campagne n’est nécessaire : les cartes, générations G1–G6, possessions et formats de sauvegarde sont conservés.

## Corrections

ACTION attend le rechargement pour récolter, déposer, construire et travailler sur une sortie. Le contrôle manuel d’un mirador conserve son tir propre et empêche les opérations personnelles simultanées d’arsenal, d’inventaire et de kits. Les commandes régionales de coffre, ravitaillement et embarquement suivent également les mains occupées. Le débarquement physique reste disponible.

Les modules tombés ne peuvent plus traverser le coin d’un bâtiment lors du ramassage. La sécurité régionale inclut les véritables corps réanimés et groupes sauvages visibles. La mort annule immédiatement l’intervention et la barricade avant le choix de relève ; les règles de paiement existantes restent appliquées. Le focus de l’établi reste sur une action disponible ou sur Fermer lorsque la situation change.

## Illustrations et limites d’échelle

Deux PNG individuels transparents complètent le bus et le camion. Le chargeur commun contient 49 images. Les 31 ajouts de 1.36–1.38 restent préservés. Les deux véhicules sont peints par le même contrôleur visuel dans D-17 et la région, avec leurs orientations et états de fouille, épave ou démontage existants. Profondeur, visibilité et barre de santé consultent le profil actif.

La région conserve les dimensions métriques : bus 10,4 × 2,55 m, camion 7,4 × 2,5 m. D-17 conserve la conversion compacte historique de la conduite locale : environ 99,48 × 24,39 unités pour le bus et 70,78 × 23,91 pour le camion. Une harmonisation métrique de tous les véhicules, personnages, bâtiments et accès reste un chantier distinct ; elle n’est pas annoncée ici.

## Preuves

Le rapport `reports/1.39.0/RAPPORT_CORRECTIONS_1.39.0.html` rassemble le contrôle complet avec endurance, les parcours récolte→dépôt→chantier→horde et véhicule→région→retour, les défauts reproduits et les comparaisons visuelles. Documents spécialisés : `INTERACTIONS`, `MONDE`, `COMBAT`, `LOGISTIQUE`, `INTERVENTIONS`, `UI` et `VISUEL` suffixés `_1_39.md`.

Les contrôles HTML utilisent un DOM simulé et les captures les vrais peintres sur Canvas natif. CSS dans un navigateur, tactile matériel, audio et FPS GPU ne sont pas certifiés. Aucun déploiement distant n’est inclus et aucune garantie d’absence de tout défaut n’est formulée.
