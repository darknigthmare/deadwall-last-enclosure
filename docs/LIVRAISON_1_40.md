# DEADWALL 1.40.0 — Parcours & ateliers

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. `dist/` contient la distribution web ; sources, tests, documentation et illustrations sont inclus. Les sauvegardes existantes se poursuivent sans nouvelle campagne. Coûts, statistiques, possessions, générations G1–G6 et formats de sauvegarde restent conservés.

## Corrections

La sortie locale du véhicule contrôle maintenant sa ligne physique, ce qui empêche de déposer le conducteur de l’autre côté d’une fenêtre barricadée. Elle garde une issue alternative libre lorsque celle-ci existe. Les interventions, barricades, préparations du commandant et opérations de fortification vérifient les mains disponibles. Le tir propre du mirador et sa libération volontaire restent fonctionnels.

Les préparations de bivouac et le démontage d’une halte attendent également les mains libres ; un pansement ne peut plus se préparer et payer deux médicaments tout en gardant le contrôle du mirador.

Les commandes matérielles d’éclairage attendent également la fin du rechargement, du poste manuel ou du travail engagé. L’interface annonce la même raison que le contrôleur. Éteindre une source réutilisable conserve son comportement ; le permis interne d’entretien de lanterne par le bivouac reste valable.

L’ancien soin régional tient compte des vrais relevés et membres de groupes sauvages visibles. Les dépôts personnels alimentent désormais le compteur exact et un observateur unique des premiers gestes, y compris via les boutons de l’inventaire et des fournitures. Les dépôts des ouvriers ne valident pas une action personnelle.

Le clavier conserve le focus après le choix de repères, les annotations et la sécurisation d’un district. Les boutons de sécurisation et construction annexe consultent le même devis que leur transaction, avec budget ou motif d’indisponibilité visible. Les conditions et coûts existants sont conservés.

## Illustrations

Le fourgon et le buggy reçoivent chacun un PNG individuel transparent, original et non retouché. Le buggy possède un moteur arrière et ses marques de démontage suivent cette position. Les mêmes sprites servent aux peintres locaux et régionaux, dans les orientations et états existants. Le chargeur commun contient 51 images ; les 33 ajouts individuels de 1.36–1.39 sont conservés.

La région conserve les profils métriques du fourgon (5,3 × 2,05 m) et du buggy (3,5 × 1,75 m). D-17 conserve les profils compacts historiques. L’harmonisation métrique globale avec personnages, bâtiments et ouvertures demeure distincte ; cette passe ne modifie pas le générateur de biomes.

## Vérification et limites

Validation finale : **2 301/2 301 tests réussis**, aucun échec, annulation ou test ignoré ; durée 659,5 secondes. `reports/1.40.0/check-full.log` décrit cette passe complète avec endurance. Deux parcours intégrés vérifient récolte→dépôt→chantier→horde et véhicule→région→retour, avec sauvegardes/reprises. Le rapport illustré `reports/1.40.0/RAPPORT_CORRECTIONS_1.40.0.html` rassemble les résultats exacts et les comparaisons de rendu. Documents spécialisés : `INTERACTIONS`, `COMBAT`, `FORTIFICATIONS`, `INTERVENTIONS`, `LOGISTIQUE`, `MONDE`, `UI` et `VISUEL` suffixés `_1_40.md`, plus le complément de survie.

Les contrôles HTML utilisent un DOM simulé ; les captures exécutent les vrais peintres sur Canvas natif. Le CSS dans un navigateur réel, le tactile matériel, l’audio et les FPS GPU ne sont pas certifiés. Aucun déploiement distant ni nouveau binaire natif n’est inclus. Le manifeste SHA-256 vérifie les fichiers de l’archive ; il ne garantit pas l’absence de tout défaut de jeu.
