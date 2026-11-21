# Art230 — contrat de sources natives

Ce lot prépare 7 extérieurs de presets réellement définis dans `settlement-plans.js`. L’identité de chaque image est `native:<type>` ; son nom de fichier commence par ce type et ne porte aucun DW-ID.

## Autorité et provenance

Les dimensions, niveaux, accès et programmes hérités viennent des propriétaires runtime figés à `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Les plans complets ont été évalués avec un prototype synthétique G7, choisi sans miroir par le hash pur existant. Ce prototype n’est pas une instance de campagne ; aucune donnée sauvegardée n’est modifiée.

La fiche historique contradictoire est copiée, hashée et conservée sous `references/conflicting-codex/`. Son identifiant apparaît seulement comme `provenance.declaredCodexId`, avec le statut `contradictory_unresolved`. Elle n’est ni réaffectée ni utilisée pour prétendre reconstruire ce DW-ID. Une nouvelle proposition graphique ne résout pas cette anomalie.

Les parents génériques restent explicites : aucune salle spécialisée, deuxième entrée, annexe, stock, mécanisme ou niveau n’est inventé. Les pièces réelles sont consignées par niveau, ainsi que les objets extérieurs existants. Les images demandées ne comprennent que l’enveloppe fermée ; terrains, voitures et props séparés restent hors de cette image.

## Identités et systèmes conservés

`p.type`, `p.id`, `p.codex`, l’ordre des presets, les dimensions/niveaux, les versions de génération/détail et les programmes restent inchangés. Le DW-ID actuel influence encore les familles de détails Codex et les repères du Guide : ce contrat ne le traite pas comme une métadonnée inerte. Les hashes de placement/mirroir, les IDs Pxxxx, les contenants et prélèvements finis gardent leurs propriétaires actuels.

Les nouveaux identifiants `native:*` sont exclusivement ceux des sources artistiques. Aucun loader, moteur, rendu, sauvegarde, RNG, butin, dépendance ou test n’est changé. L’identité de Guide `seed157-<type>` demeure distincte et existante.

## Production et calibration

Le prompt préparé est exactement `common + subjects[type]` du draft fourni par root, sans correction silencieuse. La référence visuelle est l’atlas original du jeu, conservé dans ses octets natifs. Les chemins locaux peuvent différer si le SHA-256 de la référence est identique. Les appels effectivement exécutés et les sorties natives devront être conservés séparément ; aucune génération n’est revendiquée par ce dossier de préparation.

Les PNG futurs restent des sources à sélectionner et contrôler. Ne pas recadrer, redimensionner ou nettoyer leurs pixels par script. Conserver les sorties remplacées et les prompts exacts. La revue alpha, la silhouette entière et les entrées au sol ne certifient pas les mètres par pixel. Ancrages, profondeur, rotations, collisions, portes, variantes miroir et retrait de toiture nécessitent encore calibration avant intégration. Les contrôles d’images ne constituent pas un succès de `npm run check`.

## Comptage

Après production éventuelle des vingt types, compter séparément les 62 types natifs pourvus de propositions graphiques et les 42 correspondances directes/Codex vérifiées. Les vingt associations historiques contradictoires restent explicitement non résolues. Le rapport précédent conserve 49 finales ; l’historique exact Art221 reste incomplet. Aucun décompte de tous les programmes du Codex n’est revendiqué.
