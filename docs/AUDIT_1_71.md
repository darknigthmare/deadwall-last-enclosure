# Audit de la reprise 1.71

Ces contrôles portent sur le Codex auteur, ses parcours physiques et sa distribution. Les revues assistées et les scénarios Chromium ne constituent pas des sessions de testeurs humains ni une campagne complète.

| Constat reproduit | Correction et contrôle |
| --- | --- |
| Un étage pouvait dépasser la hauteur déclarée du bâtiment. | Les plafonds sont vérifiés contre la hauteur du bâtiment et du site, avec leur altitude réelle. Les niveaux adjacents, coursives et sous-sols ont des cas positifs et négatifs indépendants. |
| Le lien direct vers le centre d’une pièce pouvait couper le chambranle d’une porte décalée. | Le parcours franchit l’ouverture à sa hauteur, puis tourne dans la pièce. Un test sur deux étages conserve le refus de la diagonale, vérifie le trajet meublé aller-retour et préserve les liens directs des portes centrées. |
| Des bases de personnel n’avaient ni sanitaires, ni cuisine ou premiers soins selon leur usage. | Des pièces distinctes, leurs portes et leurs équipements sont ajoutés aux programmes concernés. Les WC et douches sont contrôlés sur les objets effectivement placés. |
| Une pièce « meublée » pouvait manquer de son lit ou de son four. | Le premier audit géométrique est conservé comme diagnostic. La réception des nouveaux logements exige aussi les équipements indispensables par usage ; ce contrôle ne peut être remplacé par un simple compteur de pièces meublées. |
| Le dessin des transports acceptait des identifiants vides, des voies de longueur nulle et des rampes incohérentes. | Ces entrées sont refusées. Les seize types civils et de transport conservent leurs largeurs, extrémités et altitudes ; les croisements superposés ne fusionnent pas. |
| Le service worker indiquait encore 1.70 et omettait le nouveau module de pictogrammes. | Le cache identifie 1.71 et précharge le module. Un contrôle vérifie désormais que tous les scripts et styles publics appartiennent au manifeste hors ligne de la version courante. |
| Le tableau manuel d’inspection comportait des totaux par type différents du rapport. | Le tableau courant est réconcilié avec les enregistrements exhaustifs par variante ; les valeurs du classeur viennent des mêmes sources vérifiées. |
| Certaines cotes du classeur affichaient des résidus flottants tels que `6.199999999999999 m`. | Les libellés métriques utilisent la virgule décimale et trois décimales au maximum. Les valeurs des sources et la géométrie physique restent inchangées. |
| La seed `628472550` bloquait « Nouvelle partie » sur la maison ruinée 461 : le placement de proximité fragmentait les espaces restants. | Si les recherches habituelles échouent, une disposition compacte est préparée séparément et appliquée seulement lorsque les 48 décors tiennent. Les mêmes emprises complètes, toitures, routes et marges sont vérifiées ; aucun objet ni stock n’est retiré. Les deux seeds CI en régression, les 48 emprises, la récolte, la sauvegarde/reprise et la reproduction déterministe sont testées. Trois cartes témoins conservent leurs empreintes antérieures. |

La qualification finale exige le rapport complet des 4 000 variantes avec les empreintes exactes des sources, les parcours Chromium sur la distribution reconstruite, les contrôles XML du classeur et la commande littérale `DEADWALL_SOAK=1 npm run check` sur le commit final. Une erreur ou un essai interrompu n’est pas transformé en résultat positif.

Les plans auteur, leurs pictogrammes et leurs réservations fermées restent distincts de l’implantation en campagne. Seed, budgets de butin, rencontres, services, graphismes définitifs et persistance de campagne gardent leurs étapes ouvertes dans le suivi. Les dimensions de composition ne sont pas présentées comme des relevés de bâtiments réels.
