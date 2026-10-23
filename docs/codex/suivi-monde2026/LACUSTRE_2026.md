# Rives lacustres — T001 à T004

Cette passe produit 200 plans auteur inspectables : cinquante dispositions par base nautique, village de pêche, station limnologique et camping de rive. Elle ne place aucun nouveau lieu dans une campagne.

Chaque programme comporte six bâtiments de plain-pied, des pièces à usage déclaré, des ouvertures de 1,20 m, une circulation intérieure de 2 m et un réseau extérieur connecté. Les voies de service de 4,50 m sont inspectées à pied ; aucune aptitude automobile ou mise à l’eau n’est certifiée. Dix compositions et cinq emprises donnent cinquante géométries distinctes par programme.

| Programme | Locaux propres |
| --- | --- |
| Base nautique | Accueil et formation, vestiaires, hangar d’embarcations, réparation, secours et club-house |
| Village de pêche | Deux maisons familiales, halle de préparation, froid, atelier des filets, maison commune et provisions |
| Station limnologique | Accueil de recherche, préparation et froid d’échantillons, observation, archives de mesures, instrumentation, hébergement et retour de terrain |
| Camping de rive | Accueil et consignes, sanitaires et buanderie, deux chalets familiaux, salle commune et entretien |

Les parcelles mesurent de 200 × 242 m à 264 × 298 m. Les hauteurs et dimensions des bâtiments sont des compositions originales en mètres, pas les cotes d’un site réel. Le mobilier conserve les dimensions déclarées par le catalogue partagé ; aucun objet ne rétrécit pour rentrer dans une pièce.

## Terre et eau

Le sud de chaque plan réserve une bande de lac de 40 m. Cette bande est un volume fermé d’inspection : le disque piéton ne peut pas emprunter le sol générique du site pour marcher sur l’eau. Une promenade sèche et un arrêt de préparation restent à au moins 6 m de sa limite. Les bâtiments, façades, branches routières et retours se trouvent intégralement sur la rive sèche.

Le volume rectangulaire est une réservation de composition. Il ne fournit ni bathymétrie, ni raccord hydrologique au seed, ni simulation de berge ou de navigation. Les pontons, bateaux, rampes de mise à l’eau et baignades restent ouverts dans le suivi. La zone de préparation est explicitement à terre ; elle ne remplace pas un ponton réalisé.

## Fonctionnement et validation

Le générateur est `scripts/codex-lacustre2026.cjs`. Les locaux scientifiques et nautiques réutilisent des formes génériques adaptées à leur usage : rangements, postes de contrôle, ateliers et froid. Les équipements scientifiques spécialisés, embarcations et graphismes définitifs restent à produire. Les lieux de pêche n’engendrent aucun poisson ou stock alimentaire.

Les tests parcourent les 200 plans avec le même disque de 0,64 m que l’inspection, meubles compris : contrôle du réseau, des portes, des accès aux pièces et faces de service, conservation des plans, absence de hasard de campagne et interdiction physique de traverser la réservation lacustre. Des mutations négatives vérifient les routes obstruées, portes trop étroites, limites incohérentes et déclarations fictives de stock ou de service. Le code du cœur navigateur est aussi comparé à sa source Node.

Exécution ciblée du 23 octobre 2026 : 6 tests réussis, aucun échec, annulation ou test ignoré. Les 200 plans comptent ensemble 5 000 pièces d’usage et 18 100 meubles, sans pièce vide, demande refusée ou usage inconnu. Cette mesure porte sur les sources de cette passe ; le rapport d’intégration général doit être régénéré après compilation du registre.

La présence d’un plan inspectable ne valide pas son implantation dans le seed, ses contenants finis, rencontres, services, approvisionnements, animations ou sauvegarde de campagne. Ces étapes restent ouvertes dans le classeur.
