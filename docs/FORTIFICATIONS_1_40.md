# Manipulation des fortifications — 1.40

Le panneau Fortifications n’intégrait pas les verrous de mains utilisés par les extensions récentes. L’installation d’un caisson, la reprise de ses cartouches, le démarrage d’une réparation et le tri de débris restaient proposés pendant une recharge ou le contrôle manuel d’un mirador.

Une reproduction dans le document complet a montré le vrai bouton `expansionAction-fortification-ammo` disponible avec `mounted=6`. Son clic conservait le contrôle du poste, prélevait 24 munitions du dépôt (180 → 156) et installait les 24 cartouches du caisson sur ce même mirador.

L’autorisation `acting` de `fortification-pack.js` consulte maintenant le contrôle manuel existant et attend une recharge nulle. Tous les aperçus, boutons et méthodes de manipulation physique utilisent cette autorisation commune. Après libération, leur transaction reprend ses règles initiales. Les réserves restent dans leurs propriétaires existants ; aucune nouvelle quantité ni aucun remboursement n’est ajouté.

Le tir autonome des caissons, sa priorité après les munitions communes, les filets de corps, les industries régulées et leurs ordres continuent d’employer leurs chemins de simulation existants. Le tir manuel du mirador ne reçoit aucun changement. Le contrôle du poste ne peut déjà pas commencer pendant un travail actif ; la réparation et le tri gardent leur interruption existante par la recharge.

## Vérifications

`tests/fortification140.test.cjs` charge le document livré et ses vrais boutons. Les miradors et murs préparés passent par les placements et points de service de la géométrie réelle. Les débris proviennent de la destruction d’un mur voisin, tout en conservant un accès réel au mirador vivant. Une unité de munition est transférée physiquement dans le sac avant les scénarios de recharge.

Les huit scénarios croisent contrôle manuel/recharge et installation de caisson/reprise de cartouches/réparation/tri. Ils vérifient refus sans dépense ni tâche, fin de recharge avec sa vraie munition, libération, effet disponible ensuite, réserve finie et sauvegarde sans duplication. La réparation respecte la pause et ne dépasse pas la santé maximale.

- `reports/1.40.0/fortification140-baseline139.tap` : huit échecs sur les boutons restés disponibles dans la référence intacte.
- `fortification140-final.tap` : les huit scénarios corrigés passent.
- `fortification140-historic.tap` : les 21 contrôles historiques passent, couvrant réserves, tir autonome, industries, destruction et validation des sauvegardes.
- `fortification140.diff` : uniquement l’autorisation commune ; pas de changement de coûts, de statistiques ou de registre.

Les tests emploient un DOM simulé avec simulation réelle. Les étapes de travail sont isolées des récoltes des ouvriers pour mesurer les transactions personnelles. Aucun test global, build ou vérification de CSS, tactile matériel, audio et cadence GPU n’est exécuté dans ce lot ; la livraison assure sa propre passe intégrée.

## Parcours historique adapté après vérification intégrée

Le premier contrôle global a relevé l’ancien scénario `qa-saves128.test.cjs`, qui reprenait les cartouches d’un caisson tout en gardant le contrôle du mirador. Le test suit désormais la manipulation réelle : refus pendant le contrôle, libération, reprise des 24 cartouches, retour au poste puis tir manuel coûtant une cartouche. Le paiement du caisson est contrôlé par ressource, une seconde reprise est refusée, et sauvegarde/reprise conserve exactement les 23 cartouches communes restantes et le caisson vide. Aucun verrou de gameplay n’a été assoupli.

La recherche des appels dans les tests `qa*.cjs` ne trouve aucun autre parcours combinant contrôle manuel et manipulation de fortifications. Les appels examinés sont consignés dans `fortification140-qa-callers.txt`. Les 15 scénarios du fichier historique et des huit contrôles 1.40 passent dans `fortification140-legacyqa.tap`, avant le redémarrage de la passe globale par la livraison.
