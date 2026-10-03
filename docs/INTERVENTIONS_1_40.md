# Interventions et ouvertures — opérateur de poste 1.40

## Défaut confirmé

Les contrôles de mains occupées des interventions techniques et des barricades omettaient le poste de tir manuel. Dans le vrai ordre de chargement HTML, un opérateur pouvait rester au contrôle d’un mirador et engager une révision de générateur à portée. Le bouton d’établi prélevait 6 ferrailles et conservait à la fois la session interactive et le contrôle du mirador. Le panneau Opérations présentait également la pose d’une barricade comme disponible depuis le poste.

La reproduction utilise deux emprises de construction admises par le monde et un point libre ayant un accès physique aux deux supports. Pour le groupe local de la graine 17117, le point `(1704, 1632)` dessert le générateur préparé et le mirador. La barricade emploie une vraie ouverture du plan local ; son mirador se situe sur la même face afin que le poste reste accessible après la fermeture.

## Raccord corrigé

`interventions134` consulte désormais `fieldcraft.context().mounted` lors de l’aperçu, avant toute dépense, puis dans sa vérification partagée des mains libres. Le service du groupe et la validité de la session utilisent cette même vérification. `barricades134.able()` lit le même propriétaire pour la pose, la réparation et le démontage, à l’aperçu et pendant le travail.

Le refus ne retire pas le poste au joueur. Celui-ci doit le rendre volontairement avant de travailler. La disponibilité du panneau est recalculée depuis ce modèle ; un bouton préparé avant la prise du poste ne peut plus contourner le contrôle au moment de son clic. Les raisons affichées mentionnent le poste de tir.

Aucune ressource supplémentaire, aucun coût ni statistique n’est introduit. Les réparations techniques paient au début de la tentative ; les barricades paient à l’achèvement. La pause volontaire continue de suspendre le travail de barricade, tandis que les diagnostics interactifs engagés respectent leurs interruptions existantes. Le nettoyage de décès ajouté en 1.39 reste actif.

## Preuves

`tests/interventions140.test.cjs` charge le document via `bootDocument134()` et actionne les vrais boutons montés de l’établi et des Opérations.

- Un bouton de révision disponible est préparé, puis le joueur prend effectivement le contrôle du mirador. Son clic doit refuser la session sans débit, compteur d’essais ni réparation et conserver le poste. Après libération volontaire, les quatre modules sont réglés par les boutons : 6 ferrailles engagées une fois, groupe de 350 à 550 PV, résultat et sac conservés à la reprise.
- Le panneau d’ouvertures doit refuser la pose sous contrôle manuel. Après libération, les planches coûtent une seule fois 6 bois et 1 ferraille et créent un renfort de 120 PV. Après 20 dégâts, réparation et démontage sont aussi indisponibles depuis le poste. La réparation après libération applique son plafond de santé et consomme exactement 2 bois et 1 ferraille. Le chargement conserve le renfort et les matériaux restants.

Le même fichier exécuté contre les sources immuables de la version 1.39 reproduit les deux échecs : `reports/1.40.0/interventions140-baseline139.tap`. Après correction, 47 contrôles ciblés réussissent sans échec ni saut. Ils incluent les nouveaux scénarios ainsi que crochetage, tableaux par étage, carburant, lumière, destruction des supports, menaces, occupants, interruptions, décès, reprise et interface : `reports/1.40.0/interventions140-targeted.tap`.

Ces vérifications exécutent le moteur et les handlers sous DOM simulé. Elles ne certifient pas la mise en page CSS d’un navigateur, le tactile matériel, l’audio ni les FPS GPU. Aucun besoin d’image supplémentaire n’a été identifié dans ce lot.

## Complément : préparation et démontage des haltes

Le raccord des mains occupées manquait également dans `survival-pack`. Le vrai panneau Opérations autorisait un pansement depuis un mirador effectivement contrôlé : après les cinq secondes de préparation, le sac passait de 4 à 2 médicaments et le soin était posé sans rendre le poste. La commande de démontage supprimait une halte réellement installée depuis ce même poste. Pendant une vraie recharge, l’aperçu du pansement restait disponible ; le refus arrivait seulement au tick suivant. Le démontage n’attendait pas non plus la recharge.

Un garde partagé lit maintenant le propriétaire `fieldcraft.context().mounted` et le temps de recharge du joueur. L’aperçu des six préparations et le démontage refusent immédiatement ces situations, avec leur raison affichée. La réévaluation existante de l’aperçu pendant la préparation applique aussi ce garde, avant l’effet et le paiement final. Les boutons préparés avant la prise du poste restent soumis au modèle au moment du clic ; le refus conserve le poste, le camp et les fournitures.

Les règles du bivouac, son démontage sans remboursement, le paiement à la fin, les bonus déjà acquis, les interruptions et les sauvegardes restent identiques. Un pansement correctement posé peut continuer son soin progressif pendant un contrôle de poste ultérieur. L’entretien itinérant garde son autorisation privée `authorizeService` : le raccord nocturne accepte seulement la transaction finalisée par le pack, remplit au plafond existant et prélève une seule fois 4 carburants et 2 ferrailles. Aucun garde général de manipulation n’a été ajouté à `serviceLantern`.

`tests/survival140.test.cjs` prépare des miradors sur des emprises admises, un accès libre commun au vrai dépôt et, quand nécessaire, un camp installé par le bouton réel. Il couvre le bouton de pansement devenu ancien, le panneau ouvert depuis le poste et son débit indu à l’achèvement, la recharge déclenchée par la commande du HTML, le démontage de la halte, la reprise après libération et l’entretien itinérant autorisé. Les soins, matériaux et équipements sont vérifiés à l’achèvement puis au chargement.

Le fichier actuel reproduit quatre échecs sur la version 1.39, tandis que le contrat d’entretien réussit : `reports/1.40.0/survival140-baseline139.tap`. La même reproduction avant la correction 1.40 est conservée dans `survival140-before.tap`. Après raccord, les cinq nouveaux scénarios et les régressions de survie et d’éclairage réussissent, soit **53/53 sans saut** dans `reports/1.40.0/survival140-targeted.tap`. Le diff des trois propriétaires de ce lot est archivé dans `reports/1.40.0/interventions140.diff`.
