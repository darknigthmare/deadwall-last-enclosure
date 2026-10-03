# Combat et armurerie — 1.39

Le contrôle manuel d’un mirador n’était pas reconnu comme une occupation des mains par l’armurerie. Dans le document HTML complet, le bouton de crosse pouvait infliger ses dégâts sans quitter le mirador. L’atelier pouvait aussi avancer un assemblage en gardant le contrôle du poste. Changement d’équipement, rangement et déploiement avaient la même autorisation incomplète.

`arsenal134.js` consulte maintenant le contrôle existant `fieldcraft.context().mounted` avant les gestes personnels et les transactions d’équipement. La crosse, le tir personnel, l’assemblage, l’entretien, les transferts du harnais, le déploiement et le service d’un poste attendent la sortie du contrôle manuel. Le vrai mirador garde son tir, sa cadence et sa réserve commune. Quitter son contrôle rend immédiatement les actions ordinaires disponibles.

Cette correction n’ajoute ni registre ni statistique. Elle conserve les chargeurs propres à chaque objet, les coûts payés après assemblage, l’usure, les masses, les générations de carte et la sauvegarde générale. Les postes déployés restent passables, selon leur contrat existant ; aucune collision de trépied n’est ajoutée.

## Reproductions et contrôles

Les scénarios de `tests/combat139.test.cjs` chargent tous les scripts dans l’ordre de `index.html`. Les miradors et cibles sont préparés sur des emplacements validés par la vraie géométrie. Les cartes d’atelier et la crosse utilisent les boutons réellement montés ; la progression de travail est pilotée pour isoler le coût de l’atelier des récoltes des ouvriers.

- Crosse refusée pendant le contrôle ; tir personnel et chargeur conservés ; tir manuel du mirador toujours disponible ; crosse rétablie après sortie ; sauvegarde et reprise.
- Atelier indisponible pendant le contrôle ; fabrication ensuite possible, pause respectée, une seule dépense et un seul objet vide au râtelier ; reprise.
- Équiper, ranger ou entretenir pendant le contrôle ne modifie ni possession ni état ; réparation ensuite financée au coût existant et identité conservée.
- Déploiement et reprise d’une défense refusés pendant le contrôle ; disponibles après sortie ; un seul exemplaire avant et après sauvegarde.

Preuve de référence : `reports/1.39.0/combat139-baseline138.tap` exécute les mêmes quatre scénarios contre la copie intacte 1.38 et échoue sur les quatre autorisations. `combat139-final.tap` passe les quatre scénarios corrigés. Les 74 contrôles groupés avec les scénarios historiques passent dans `combat139-targeted.tap` ; la vérification globale est exécutée par la passe de livraison.

Deux pistes ont été écartées : le bouton tactile FEU met déjà `mouseDown` à jour et interrompt correctement l’assemblage ; le transfert du matériel au décès annule déjà le travail d’arsenal par `takeForDeath`. Aucun correctif supplémentaire n’est appliqué à ces chemins. Les actions de présentation de `hero-actions133.js` sont conservées.

Ces contrôles utilisent le DOM simulé et la simulation réelle. Ils ne constituent pas une certification du CSS, du tactile matériel, de l’audio ou de la cadence GPU.
