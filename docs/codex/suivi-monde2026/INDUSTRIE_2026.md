# Plans industriels — T053 à T056

Cette continuation ajoute 200 compositions auteur : quatre activités, cinquante variantes chacune. Elles sont consultables dans le Guide et n’implantent aucune usine dans une partie.

| Type | Activité | Préparation → production → finition |
| --- | --- | --- |
| T053 | Agroalimentaire | Préparation et dosage → mélange et traitement thermique → emballage et froid |
| T054 | Mécanique | Débit et préparation → tournage, fraisage et métrologie → assemblage et contrôle |
| T055 | Textile | Préparation des fibres → tissage et contrôle → coupe et confection |
| T056 | Matériaux | Dosage des matières → mélange et formage → maturation et emballage |

Chaque site possède neuf bâtiments : accueil/administration, locaux du personnel, maintenance, réception des matières, préparation, production, finition, stockage/expédition et locaux techniques. Les pièces portent leurs fonctions réelles. Les couloirs, portes et faces de service sont contrôlés avec le même disque piéton que l’inspection.

## Variantes et dimensions

Dix dispositions combinées à cinq tailles produisent cinquante géométries distinctes par type. Les sites mesurent 320 à 416 m de large et 350 à 422 m de long. Les bâtiments restent de plain-pied. Les hauteurs, espacements et emprises sont des choix auteur originaux, pas des relevés d’usines existantes ni une conformité à une norme industrielle.

Une clôture conserve deux ouvertures réelles. Quatre traverses et les voies latérales forment une desserte reliée. Deux cours sont réservées au chargement ; deux zones de réserve sont protégées. Les équipements extérieurs sont des volumes fermés. Le réseau décrit un chemin piéton continu entre réception, préparation, production, finition et expédition ; le contrôle vérifie chacun de ses segments.

## Mobilier spécialisé

Quinze formes auteur représentent convoyeur, poste de dosage, mélangeur alimentaire, enceinte thermique, scie, tour, fraiseuse, poste d’assemblage, banc de contrôle, métier à tisser, poste de confection, table de coupe, malaxeur, presse et rayonnage de maturation. Dix-sept profils d’usage les associent aux locaux appropriés. Les objets restent à leur taille déclarée ; un placement impossible doit être refusé et comptabilisé.

Les machines sont arrêtées, vides et non raccordées. Ni ouverture du Guide, ni passage dans un local ne crée de ressource, recette, eau, énergie, contenu de stockage ou récompense. Les cours et voies ne certifient pas les girations des poids lourds, les charges admissibles ou la séparation industrielle des flux.

## Qualification et suivi

Le générateur est `scripts/codex-industrial2026.cjs`. Son cœur auteur a été récupéré à l’identique depuis le blob GitHub du bundle compilé après la maintenance du 22 octobre. Le wrapper Node et le mobilier ont été reconstruits puis soumis à une nouvelle qualification ; les résultats perdus ne sont pas réemployés comme journaux.

Le rapport courant est [inspection-restauration-20261022.json](inspection-restauration-20261022.json). Les sources, compteurs réellement exécutés et limites figurent dans [PUBLICATION.md](PUBLICATION.md). Les tâches dimensions, architecture, objets, sauvegarde et QA restent en cours : inspection géométrique et présence dans le monde de campagne sont des étapes distinctes. L’implantation dans les seeds, les interactions, les intrants finis, l’énergie, les sorties payées, les rencontres et la persistance restent à livrer.
