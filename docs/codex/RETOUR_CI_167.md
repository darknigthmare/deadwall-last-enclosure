# Reprise 167 — Résultats et correction des états d’affichage

Le commit 994f4ec a terminé 14 tests ciblés (aucun échec ni test ignoré), le build sans dépendances et la vérification du contrat public de 278 fichiers. Le diagnostic a parcouru les 3 000 fiches puis 2 951 plans d’étage des 2 374 recettes compatibles, sur la graine 17117.

Le registre relève 1 736 occurrences d’espaces non matérialisés à l’étage étudié, 1 424 occurrences d’extérieurs encore simplifiés dans la coque et 6 960 unités de mobilier sous les minima source. Ces nombres sont des écarts par recette et par étage, incluant les variantes héritées ; ce ne sont pas des architectures ou meubles uniques. Aucun stock nouveau n’apparaît dans les couches décoratives.

La première exécution navigateur a révélé une erreur réelle à l’ouverture des prescriptions : le rendu utilisait l’existence de `totals` pour décider qu’un rapport provenait d’un modèle inspecté. Les rapports source ont eux aussi des totaux, mais pas de liste `issues`. La lecture de `issues.slice` échouait alors et empêchait le montage de l’inspecteur.

Le correctif distingue explicitement les portées source, modèle inspecté et programme non pris en charge. Un bilan source n’est plus étiqueté comme inspecté ; le nombre de pièces du modèle est calculé à partir de ses attributions et pièces restantes. Les tests de rendu couvrent les trois états, la réouverture sans doublon et le rejet des rapports incomplets avant mutation du contenu.

Les rapports navigateur sont désormais archivés depuis leurs répertoires réellement horodatés. Les erreurs complètes et les chemins des champs de transaction sont affichés dans les journaux, sans exposer de sauvegarde complète. Une exécution échouée reste documentée comme telle ; les résultats corrigés sont consignés dans la PR après leur lecture.
