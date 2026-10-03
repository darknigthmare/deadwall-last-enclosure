# DEADWALL 1.37.0 — Accès & interactions

## Lancer et reprendre

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. Le dossier `dist/` fournit aussi la version web avec ses assets. Les sources et les tests sont inclus. Aucune nouvelle campagne n’est nécessaire : les générations G1–G6, le plan de D-17 et les possessions sont conservés.

## Corrections livrées

- **Interface** : Échap, reprise et nouvelle campagne libèrent l’armurerie ; le placement se termine avant l’atelier ; un import ou départ refusé garde la campagne en cours. La colonne Situation/Carte respecte la largeur de ses panneaux entre 721 et 1100 px.
- **Commandes** : le zoom tactile et la molette changent l’échelle du domaine réellement affiché, sans déplacer le zoom local caché.
- **Déplacement** : les escaliers refusent les cloisons et les arrivées obstruées. Une reprise déjà bloquée sur un ancien palier est récupérée dans un périmètre limité, au même étage.
- **Véhicules** : le profil choisi détermine l’emprise avant l’achat. Le même gabarit sert aux chantiers, portières et à la remise en place d’un ancien véhicule coincé.
- **Combat** : recharge et travaux bloquent les actions incompatibles ; mêlée et compagnons touchent les contacts choisis, y compris les dépouilles réanimées, sans concentrer leurs impacts sur un voisin.
- **Travaux et énergie** : un groupe en cave attire les infectés du bon intérieur. La fouille interrompt un travail de barricade avant que deux tâches manuelles progressent ensemble.
- **Images** : deux nouveaux PNG alpha du survivant accroupi/allongé complètent mains nues, outils et armes. Les recharges debout conservent une vue zénithale ; le recul visible cesse avant la fin d’une longue cadence.

Les statistiques et coûts existants restent appliqués. Les corrections n’ajoutent ni nouveau stock, ni nouvelle monnaie, ni duplicata des systèmes historiques. Les anciens chemins de génération restent nécessaires pour reprendre les campagnes anciennes.

## Preuves et limites

Le rapport `reports/1.37.0/RAPPORT_CORRECTIONS_1.37.0.html` consigne le résultat final de `DEADWALL_SOAK=1 npm run check`, les captures et les cas reproduits. Les rapports spécialisés `UI_1_37`, `COMBAT_1_37`, `ENERGIE_1_37`, `MONDE_1_37`, `PERSISTANCE_1_37`, `VISUEL_1_37` et `COMMANDES_1_37` détaillent les fichiers et scénarios.

Les scénarios exécutent les scripts dans l’ordre HTML du jeu avec DOM simulé. Les captures utilisent les peintres et le chargeur d’images du jeu avec Canvas natif. Le CSS dans un navigateur interactif, le tactile matériel, l’audio et la fluidité GPU ne sont pas certifiés par cette passe. Les cas couverts ne constituent pas une garantie d’absence de défaut sur toutes les graines ou tous les appareils.

Les deux images sont dans `assets/art137/`, les prompts dans `assets/art137/PROMPTS.md` et les empreintes dans `assets/PROVENANCE_1_37.json`. Les 27 images de la 1.36 et les originaux du codex sont conservés. Aucun déploiement distant n’a été effectué.
