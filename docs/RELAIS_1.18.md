# 1.18 — Règles et architecture

Le registre `fieldSupplies` version 1 contient la réserve de carburant de planification et au maximum seize couples `id / stock`. Les identifiants sont ceux des contenants régionaux existants. Les stocks ont les sept ressources reconnues, valeurs finies et positives, avec une somme au plus égale à 60. Le validateur confirme que le lieu est découvert, que le meuble est compatible et que le butin initial est entièrement prélevé.

Les trois générations de région, les 42 plans et les objets existants ne sont pas régénérés. Les fichiers de géométrie, de génération, de plans spécialisés et de routage sont comparés à la 1.17 dans le rapport. L’annotation visuelle du relais ne crée pas une collision superposée.

Les transferts n’ont pas de coût additionnel : ils déplacent la quantité minimale entre demande, source et capacité de destination. Le coffre, les relais et le sac ont des capacités globales ; le stockage de D-17 reste plafonné par ressource. Les actions de soins et travaux utilisent uniquement le sac, avec paiement à la fin.

Une action transitoire conserve position, niveau, santé initiale et temps actif. Elle est annulée sur mouvement, tir, rechargement, changement de contexte, dégâts ou conditions devenues invalides. Elle ne figure pas dans la sauvegarde ; son abandon à la reprise ne génère pas de remboursement puisqu’aucun matériau n’était encore dépensé. Un bruit de travail utilise la mécanique de perception existante pour réparation et aménagement.

Le budget de retour est une lecture du graphe de voirie : aller au repère éventuel, plus retour à une des quatre jonctions, multiplicateur 1,25, puis marge fixe de 0 à 8. Aucune ressource n’est retirée par consultation. Les raccordements ne certifient pas les obstacles et le trajet ne remplace pas la conduite. La livraison jusqu’au centre n’est pas ajoutée automatiquement.

Modules : `frontier-logistics.js` (registre et validation ; équilibrage centralisé dans `core.js`), `frontier-care.js` (transactions et travail), `frontier-care-ui.js` (panneau intégré à la carte). Les changements de `frontier.js` empêchent la fouille et les interactions concurrentes pendant une action. Les contrôles de stock et d’accessibilité sont renouvelés à chaque décision, pas uniquement lors de l’ouverture du menu.

Les tests utilisent des scènes préparées, des sauvegardes de fixture et un temps contrôlé. Un test de capacité initial supposait une taille de sac fixe ; la fixture a été corrigée pour utiliser la capacité effective du personnage, tout en conservant les assertions de somme et de saturation. Aucun comportement économique n’a été relâché pour ce test.
