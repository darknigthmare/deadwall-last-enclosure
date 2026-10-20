# Puisage sur les berges — correction 201

Une rivière pouvait être réellement à portée du commandant sans être trouvée par l’action **Remplir le seau de service**. Le contrôleur cherchait uniquement les extrémités de 24 directions, espacées de 15 degrés. Une rive oblique à 2,19 m pouvait passer entre deux directions alors que la portée restait de 2,2 m.

Le défaut est reproduit sur le monde G8 de graine 17117, profil Régions naturelles, détail 13, écologie 1 et hydrologie 1. À `(21002.346637659346, 4420.794241197583)`, le sol est praticable, l’eau douce est à 2,19 m et un point intérieur de la rivière est accessible à 2,195 m par une ligne physique libre. Le devis et le début du puisage refusaient pourtant l’action. Ce point initial est préparé dans les tests ; aucun trajet naturellement joué ni participant humain n’est revendiqué.

Le contrôleur consulte maintenant les surfaces hydrologiques déjà indexées et la projection géométrique commune pour trouver une rive atteignable. Une très petite entrée numérique dans la surface évite l’ambiguïté d’un point exactement sur sa frontière ; cette nouvelle position doit elle aussi rester dans la portée inchangée. Les directions historiques restent un repli pour les fournisseurs sans surfaces et les autres approches dégagées.

Les règles existantes demeurent : sol sec praticable pour le commandant, eau douce, absence de tablier au point puisé, ligne physique libre et mains disponibles. Une source au-delà de 2,2 m, l’eau marine et une source derrière un mur restent refusées. Les mêmes vérifications s’appliquent pendant le travail. Un nouvel obstacle interrompt le puisage sans ajouter d’eau.

Le helper est partagé par le puisage à la berge et l’abreuvement à portée de l’accès de l’enclos. Le seau reste celui des secours incendie ; aucun deuxième stock, nouvelle ressource potable, changement de coût, durée ou sauvegarde n’est ajouté.

`tests/bank-water201.test.cjs` couvre la rivière oblique, un bassin fermé naturel, la portée, l’eau marine, une paroi, un tablier de pont et une obstruction pendant le travail. La pause suspend le remplissage ; la réussite ajoute uniquement le lot prévu au seau existant, sans modifier le sac ou le registre d’enclos. Les parois et le pont sont des préparations géométriques déclarées. Les tests de transactions et de soins déjà présents restent exécutés séparément du contrôle exhaustif de la livraison.
