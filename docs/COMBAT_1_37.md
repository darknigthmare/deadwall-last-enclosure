# Combat et manipulation des défenses — 1.37

Cette passe corrige des actions concurrentes et l’attribution des impacts. Elle conserve les 37 profils, leurs statistiques, les coûts, les paliers et le format de sauvegarde de l’armurerie.

## Défauts reproduits et corrections

- **Crosse locale pendant une recharge** : la branche historique locale recevait la frappe avant que l’armurerie vérifie les mains occupées. Espace déclenchait donc une crosse avec un chargeur encore en cours de remplacement. Les verrous communs sont maintenant vérifiés avant de déléguer au coup local existant ; sa portée, ses dégâts et son recul restent ceux du moteur.
- **Frappe pendant un assemblage** : le même retour anticipé permettait de frapper à mains libres ou avec une arme à feu pendant le travail au dépôt. L’action est désormais refusée sans interrompre ni payer prématurément l’assemblage.
- **Manipulation d’un poste pendant une recharge** : pose, reprise, ravitaillement, réparation et déblaiement vérifient désormais aussi le rechargement du personnage. Un refus ne retire aucun objet ni consommable. Après la fin de la recharge, l’opération normale reste disponible.
- **Mêlée multicible dans une horde serrée** : deux contacts à moins de 0,4 m pouvaient recevoir tous deux le dommage sur le premier infecté trouvé. Dans la scène de reproduction, une planche infligeait 56 dégâts au premier et aucun au second, au lieu de 28 à chacun. L’arsenal transmet maintenant l’identifiant du contact déjà choisi à `worldEvolution.hitContact`. Le paramètre est facultatif : les collisions ponctuelles des projectiles gardent leur recherche habituelle.

## Vérification

`tests/combat137.test.cjs` ajoute quatre scénarios dans l’ordre des scripts du HTML livré. Les assemblages et retraits utilisent les transactions de l’armurerie ; les munitions du test des postes sont retirées du dépôt vers le sac. Les rechargements avancent par `Game.update`, et les entrées Espace passent par le gestionnaire réel. Le travail d’atelier est avancé directement par son service pour isoler les dépenses des récoltes autonomes simultanées.

Les tests vérifient la reprise d’une recharge sauvegardée, les cartouches exactes, l’unicité des objets, le coût final du travail, l’endurance et l’usure d’une frappe, et la persistance des deux blessures de horde. La scène de foule prépare deux positions accessibles sur une vraie route G6 dans un registre de horde créé par le jeu ; elle ne constitue pas un parcours humain jusqu’au groupe. Les coordonnées préparées sont validées par les collisions et le chargement normal.

Les journaux sont dans `reports/1.37.0/combat137-before.log`, `combat137-crowd-before.log` et `combat137-targeted.log`. La vérification globale de livraison reste à exécuter par le coordinateur. Cette passe n’évalue ni le rendu CSS du HUD ni l’équilibrage d’une campagne humaine complète.

## Compatibilité

Aucun champ sauvegardé n’est ajouté ou supprimé. Aucune graine, position de D-17, géométrie, quantité ou identité de monde n’est modifiée. Les statistiques du catalogue restent dans `src/core.js`, sans nouvelle table parallèle.
