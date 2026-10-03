# Correctifs de fonctionnement — armement et interventions 1.36

Cette passe conserve les 37 profils d'armement, les trois mini-jeux et les trois matériaux de barricades. Elle répare leurs interactions sans ajouter de nouvelle catégorie de jeu ni modifier leurs coûts.

## Défauts reproduits et corrections

- **Crosse et mains libres en région.** La commande Espace était relayée au module de succession quand aucune arme de mêlée n'était équipée. Cette ancienne fonction ne parcourait que les survivants morts puis relevés ; les infectés ordinaires et les groupes régionaux étaient ignorés. L'armurerie résout maintenant toutes les familles de contacts par le même filtre de portée, angle, obstacle et étage. Les dégâts historiques restent 36 avec une arme à feu en main, 18 à mains libres, et la frappe ne prélève aucune cartouche. Les armes de mêlée et outils conservent leurs propres coûts d'endurance, leur usure et leur nombre de cibles. La frappe locale de D-17 garde son chemin historique.
- **Générateurs partiellement cannibalisés.** La révision refusait déjà un groupe dont des pièces avaient été récupérées, mais le ravitaillement et le démarrage restaient possibles jusqu'au tick d'arrêt suivant. Les commandes partagent désormais un contrôle préalable : elles refusent le service et affichent la cause avant de retirer du carburant.
- **Support détruit pendant une intervention.** L'état du bâtiment était vérifié au début du mini-jeu, mais pas lors de chaque manipulation ou de la validation finale. Toute intervention régionale est maintenant interrompue dès que son support est détruit. Les consommables déjà engagés suivent la règle d'annulation existante ; aucun effet de réparation ou de distribution n'est attribué.
- **Sources d'énergie invalides.** Les lecteurs de sources lumineuses et de groupes actifs écartent immédiatement les installations détruites ou cannibalisées. Le carburant restant n'est ni téléporté ni remboursé automatiquement.
- **Lecture visuelle de l'équipement.** `arsenal134.visualEquipment()` fournit une copie légère de l'identité, de la catégorie, de l'état et de la cadence de l'objet tenu. Les peintres n'ont plus besoin d'appeler la vue complète des 37 devis pour connaître l'objet en main.

## Persistance et contrôles

Aucune nouvelle quantité, aucun bonus et aucune migration de stock. Les registres versionnés 1.34 restent compatibles. Les panneaux, verrouillages, coûts et transactions de barricades sont conservés.

`tests/gameplay-repair136.test.cjs` utilise le véritable ordre de scripts du HTML livré, sous DOM simulé, ainsi que des lieux et contacts G6 réellement générés. Les positions et la neutralisation des autres menaces sont des préparations de test, pas une campagne jouée manuellement. Les cas couvrent refus sans débit, destruction pendant la tentative, crosse, mains libres, cartouches, délai entre frappes, angle, obstacle, étage, pause et rechargement. La suite ciblée reprend également les tests existants d'armement, de migration, de mini-jeux et de barricades, dont construction et reprise à l'étage.

La validation visuelle CSS dans un navigateur et les performances sur le matériel du joueur ne sont pas déduites de ces tests de simulation.
