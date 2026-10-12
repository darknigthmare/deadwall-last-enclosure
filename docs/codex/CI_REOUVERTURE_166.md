# Passe 166 — Retour CI et réouverture des fiches


La revue Codex de la PR a exécuté les dépendances verrouillées sur Ubuntu. Les **12 nouveaux tests passent**, puis le nouveau parcours navigateur réussit ses **27 contrôles (9 par format)** sur 1440×900, 390×844 et 844×390 : activation réelle, conservation de la sauvegarde, reprise et deux scènes préparées par le vrai peintre. Les captures et le rapport ont été récupérés ; les deux scènes d'ensembles au format ordinateur ont été inspectées. Ce résultat distant complète, sans effacer, les blocages rencontrés localement.

Le même job termine également les parcours navigateur général (**171 contrôles**) et PWA (**30**), les dix tests d'inspection/surfaces avec raster, les **51 contrôles** de l'inspecteur et les **24 contrôles** des quantités. Il échoue ensuite sur le vieux test de réouverture des prescriptions. Il n'est donc pas globalement vert.

Le test défaillant comptait tous les éléments `details section` comme des pièces : l'inspecteur ajouté en 165 est lui aussi une section, explicitement marquée `data-codex-plan165`. La correction attend que les deux composants soient initialisés, vérifie séparément les noms des pièces dans l'ordre auteur, le nombre de meubles par pièce, l'unique aperçu et l'unique bloc de prescriptions, puis compare leur contenu exact après **trois réouvertures**. Aucune tolérance de doublon, suppression d'assertion ou modification de sauvegarde n'est ajoutée. Ce correctif concerne le banc navigateur, pas la génération du monde. Sa propre réexécution distante est consignée dans la PR.

Preuves initiales : run `38259075850`, artefact `11751712539`. Il contient aussi le rapport d'échec du test historique ; il ne doit pas être étiqueté comme un succès intégral.
