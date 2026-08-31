# Consolidation r12 — défauts reproductibles et lisibilité

Cette passe prolonge la version 1.0.0 r11 sans changer de moteur, de contenu, de difficulté ou d’assets. Les dix atlas/textures originaux existants restent utilisés ; aucune nouvelle génération d’image n’a été effectuée.

## Corrections

- Le premier objectif mesure uniquement les ressources déposées : suppression de l’oscillation causée par l’affichage provisoire de la récolte.
- Un dépôt plein ne masque plus un chantier ou une interaction de terrain à portée. Le volume annoncé correspond à ce qui peut être transféré ; le sac conserve le solde.
- Maintenir Échap ne referme plus immédiatement la pause ou une modale ouverte par la première pression.
- La reprise ne consomme plus un identifiant pour le joueur non sérialisé. Les compteurs d’ID épuisés, y compris ceux dérivés des entités, sont refusés avant mutation.
- Les positions de formation bloquées se rabattent sur le point de section si celui-ci reste praticable. Aucun mur ni porte verrouillée n’est franchi artificiellement. Le repère de ralliement respecte les mouvements réduits.
- Réparer et améliorer affichent leur coût et leur éventuel verrouillage. La réparation d’urgence affiche son devis courant.
- Le démontage exige deux actions distinctes. Son aperçu indique la récupération réellement stockable et les conséquences connues : enceinte, logement, énergie, capacité et excédents d’entrepôt. Changer de sélection, ouvrir une modale ou perdre la structure invalide la confirmation.

Les devis ne consomment ni ressources ni RNG et ne créent aucun champ de sauvegarde. Les valeurs économiques restent celles de r11 ; seule l’application du plafond après démontage d’un entrepôt est rendue immédiate et annoncée.

## Vérification et limites

Les tests ajoutés ciblent les reproductions, les coûts, les annulations, les stocks fractionnaires, les limites d’identifiants, les trajets physiques et les entrées répétées. La vérification native est renforcée pour ne plus considérer un Canvas opaque uni comme une preuve de rendu du jeu.

Le procès-verbal de livraison consigne séparément les commandes réellement passées, les résultats des parcours navigateur et Windows, le commit et le déploiement. Ce document n’annonce pas à lui seul un build, une archive ou une publication validés.

Les essais automatisés ne remplacent pas des campagnes humaines prolongées ou une matrice matérielle. L’application Windows reste non signée ; aucune boutique, certification commerciale, conduite de véhicules, coopération ou version 3D n’est livrée par cette passe.
