# 203 — Reprise de la PR #15 : chaîne jouable et pose d’urgence

Base de cette reprise : `0e4c83da1adcd5e7dd0ad074c85798620a20edb3`, arbre `52ab3639c3859e35d2ce3f880e9784c8167e55e0`. La PR #14 n’est pas modifiée. Aucun changement de format de sauvegarde, de génération ou de rendement dans ce correctif.

## Blocage constaté dans le parcours navigateur

Le workflow produits échouait à la préparation du lapin : le scénario avait construit l’enclos et capturé un animal généré, mais n’avait ni fabriqué ni équipé de couteau. Le moteur refusait correctement la préparation. Ce refus n’est pas désactivé.

La préparation commune `prepareProductsTool203` utilise désormais les vrais propriétaires de l’armurerie : devis, paiement au dépôt, travail de fabrication, prise et équipement du couteau. Elle vérifie chaque ressource et réutilise un couteau déjà disponible sans duplication. Le temps de ce travail est explicitement avancé par le banc de test ; ce n’est pas une preuve de progression humaine. Les fournitures régionales du scénario restent une préparation déclarée, et aucun produit brut n’est injecté.

Un refus de bouton conserve désormais son devis, son équipement, sa tâche et une capture. Le parcours complète la séquence par une livraison démarrée puis interrompue via le bouton de pose, une reprise et une nouvelle livraison.

## Pose d’urgence du colis

Poser une charge n’est pas ramasser ou fabriquer. La menace proche, un rechargement, un équipement de terrain ou une autre intervention ne doivent pas retenir le colis sur le personnage. La pose ne nécessite donc plus une zone sécurisée et reste accessible pendant une livraison.

Le contrôle reste réservé à un commandant vivant, disposant des commandes, à pied au sol dans la région. Le menu général, la défaite, un étage, D-17 et la conduite ne peuvent pas déplacer le colis. La pose est immédiate aux coordonnées régionales courantes, sans paiement, sans transfert vers l’enclos et sans changement de quantité ou de fraîcheur.

Elle annule la tâche propre au module lorsqu’il y en a une. Aucun travail n’est achevé et aucun matériau précédemment engagé n’est remboursé. Les tâches d’autres propriétaires ne sont pas effacées. Une reprise du colis reste une action sûre, accessible, avec le porte-module libre et sa durée de deux secondes.

Les tests reproduisent six refus avant correction, puis contrôlent les cas d’urgence et les refus conservés. Un scénario du moteur vérifie aussi la distance réellement parcourue : 72 % de la marche normale avec le colis, pas de sprint ni de consommation d’endurance de sprint.

## Couverture de la suite dédiée

La sélection `tests/husbandry191*.test.cjs` ne désignait aucun fichier du dépôt. Elle est remplacée par les trois vrais fichiers `tests/audit191-*.test.cjs`, sans retirer leurs assertions. Un contrat exige désormais que chaque motif de fichiers de cette commande sélectionne au moins un fichier existant.

## Provenance et limites

Les 4 667 fichiers suivis de la tête de PR, assets compris, sont reconstitués et vérifiés par identifiant Git. L’arbre local de départ est exactement celui de la tête examinée. Les dépendances locales réutilisent une archive préexistante ; ce n’est pas une nouvelle installation `npm ci`. Les workflows distants réinstallent les versions verrouillées.

Les résultats précis de chaque révision et les reçus sont consignés dans la PR et le livrable. La navigation Chromium locale échoue par `ERR_BLOCKED_BY_ADMINISTRATOR` ; aucune qualification visuelle locale n’est revendiquée. Les contrôles de produits, la CI globale et Windows sont des preuves distinctes.

La boucle de transport préexistante est conservée : un colis de six unités maximum, viande/peaux/cuir des enclos, péremption, décès et déchargement partiel. Cages transportables, commerce, vêtements, PNJ livreurs, véhicules frigorifiques et entrepôt de matières brutes de D-17 restent hors de cette reprise.
