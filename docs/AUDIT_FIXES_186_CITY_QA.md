# Qualification 186 — site préparé de construction urbaine

La CI exhaustive sur `9e9ef280c72d35a46520bed75ed5f8324f10141f` a validé les six partitions natives et leur agrégation, ainsi que Windows et plusieurs groupes navigateur. Le groupe `city` a cependant refusé sa préparation avant le placement d'une conserverie électrique : un ouvrier se trouvait dans la marge de sécurité réservée au placement.

## Cause et correction

`prepareConstruction150` choisissait une parcelle libre des corps, sans reprendre la marge de dégagement du parcours navigateur. Le scénario devait alors éloigner les ouvriers par un ordre de récolte, alors qu'une position de récolte ou de repli valide peut rester près de cette parcelle.

La sélection des **sites préparés** utilise maintenant, pour les ouvriers, la marge déjà exigée par le contrôle de dégagement : 5 unités de protection et une cellule de 32 unités. Si cette réserve est occupée, elle recherche une autre parcelle réellement libre. Le commandant, dont la position de départ fait déjà partie de la fixture déclarée, conserve son contrôle de corps initial avant le placement au point de service extérieur ; il ne reçoit pas artificiellement la réserve des ouvriers.

Cette correction ne déplace, ne supprime et ne soigne aucun ouvrier. Elle ne change pas les règles de construction du jeu, la géographie, les ressources, les collisions ni les identifiants. Le parcours original conserve ses ordres réels, son attente de déplacement, sa vérification immédiatement avant le clic et son assertion de marge libre **au paiement effectif**. Aucun délai n'est simplement augmenté et aucun contrôle physique n'est supprimé.

## Preuves

Trois cas négatifs ont reproduit le défaut avant correction : une parcelle admise par le contrôle de corps seul reste interdite par la marge physique. Les cinq tests ajoutés vérifient trois modèles, le cas de la casemate protégeant réellement le dépôt, la conservation exacte des positions/santés/cargaisons des ouvriers, des bâtiments, ressources, gisements et RNG, ainsi que le maintien des contrôles de placement dans le parcours d'origine.

Le premier essai appliquait aussi la réserve des ouvriers à l'ancienne position du commandant ; le cas de la casemate protégée l'a correctement refusé. La correction finale réserve cette marge aux acteurs qui restent sur place. Les échecs intermédiaires ne sont pas annoncés comme réussis.

Le workflow ciblé Audit regressions rejoue maintenant aussi `npm run test:city` complet sur `dist`, sans mode smoke ni filtre de profil. La CI principale conserve le même groupe complet. Les résultats du nouveau commit sont nécessaires avant fusion ; les succès natifs de 9e9ef28 restent attachés à cette révision précédente.

Validation locale finale de ce correctif : **148/148 tests ciblés 183–186**, aucun échec, annulation ni test ignoré, dont les cinq cas de placement ci-dessus. Syntaxe : **351 fichiers**. Build complet : **346 fichiers publics**, empreinte PWA `d0f1e8cca98ada853e73f123f948f9444d69e15dca7bc926ebab0d63d82f6272` inchangée. Un premier appel combinant syntaxe et build a dépassé la durée de l'outil ; le build complet relancé est conservé dans un journal distinct avec code de sortie 0.
