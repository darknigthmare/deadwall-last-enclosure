# 203 — Produits bruts transportables entre enclos

Base immuable : `6c6fbb6cf563bea6c89ade99c65f18c438481532` (main 1.68), arbre `e050cdbb2448d75afdbecc3b77674f29f8e9917a`. Cette branche reprend aussi le correctif local 202 non publié. Elle ne modifie pas la branche `work` / PR #14 de géométrie. Les numéros 202–203 sont des repères de travail, pas une version commerciale.

## Boucle réellement implémentée

Dans le carnet joueur, `Dossiers → Sur le terrain → Opérations → Enclos & transformation` :

- À un enclos vivant, emballer **viande crue, peaux brutes ou cuir** déjà produits. Deux bois et une ferraille du sac sont engagés au départ ; quatre secondes de travail transfèrent au maximum six unités dans **un seul colis**. Les produits quittent le stock à la fin, pas au début. Une interruption garde les produits sur place et ne rembourse pas l'emballage.
- Porter ce colis au rez-de-chaussée régional, à pied, à 72 % de la vitesse de marche, sans sprint. Le porte-module existant est réservé : il ne se cumule pas avec un ballot, un matériel de mission, une cargaison de campagne ou un équipement vertical.
- Livrer à un autre enclos (ou au même), en trois secondes, dans la limite de la place du stock de destination. Le reliquat reste porté. Ni provisions de sac, ni réserve de D-17, ni rendement supplémentaire ne sont crédités.
- Poser le colis, puis le reprendre en deux secondes depuis un accès physique libre. Un seul colis porté **ou posé** est autorisé par campagne à ce stade ; pas de stockage illimité de caisses.
- Avant de rejoindre D-17, un étage ou le volant d'un véhicule, poser ou livrer le colis. Ces refus sont explicites. Le transport en coffre et le stockage des matières brutes dans D-17 restent distincts.

Le dessin procédural du colis appartient à la file de profondeur régionale et respecte la visibilité. Il ne modifie pas les stocks. Les libellés de progression des travaux d'enclos sont présentés en français, plutôt que par leurs identifiants internes.

## Quantités, fraîcheur et décès

Les lots gardent leur âge lors de l'emballage, au sol et lors de la livraison. Mélanger un lot entrant à un stock existant conserve l'âge le plus ancien, comme approximation conservatrice du système de lots communs existant. Un lot périmé disparaît : aucun recyclage implicite en nourriture ou matériaux. Le cuir ne périt pas. La pause ne vieillit pas les produits ; aucune horloge réelle hors ligne n'est utilisée.

Au décès régional, le colis est posé **au point du décès capturé par le moteur**, avant le retour sanitaire et avant la sauvegarde de succession. Les deux chemins de décès peuvent appeler le nettoyage sans dupliquer ni déplacer le même colis. Le nouveau survivant peut revenir le récupérer ; l'âge continue quand la simulation reprend. Un colis au sol empêche de construire un nouvel enclos sur son emplacement.

## Sauvegardes

Le champ `cargo203` est optionnel dans le module `husbandry191`. Son absence conserve exactement la représentation historique ; il n'est pas ajouté aux anciennes parties sans transport. Le registre porte la source, le type, la quantité, l'âge, l'état porté/au sol et la position du colis au sol. Les types, quantités, durées, propriétaires et champs supplémentaires sont validés.

Le validateur partagé des extensions refuse plusieurs chargements lourds simultanés. Les modules de missions, d'exploration et de services refusent également la prise en charge dans leurs actions réelles, pas uniquement au chargement d'une sauvegarde. Une sauvegarde avec un colis porté hors du rez-de-chaussée régional, en voiture ou par un personnage mort est refusée. Il s'agit d'intégrité de jeu, pas d'un système anti-triche.

## Provenance et qualification

Les 4 452 sources de la capsule GitHub de main et les 205 assets sont reconstitués puis vérifiés par leurs identifiants Git. L'arbre de départ reconstruit correspond exactement à `e050cdbb2448d75afdbecc3b77674f29f8e9917a`. Le build ne change pas les données compilées du Codex. Le correctif 202 est réappliqué à ses préimages exactes avant cette extension.

Les nouveaux tests distinguent les bancs unitaires (stocks/positions préparés) et le moteur natif : lapin généré, capture et transformation par les propriétaires existants, emballage payé, reprise et décès. Les préparations de fournitures ne sont pas une preuve de progression économique naturelle.

Le script navigateur utilise les vrais boutons ordinateur/tactiles du carnet, un animal généré et deux enclos construits. Les points régionaux et les matériaux sont des préparations explicitement déclarées ; le trajet entre les sites est un point de contrôle, pas une marche humaine certifiée. Le temps de production est avancé explicitement. Les sauvegardes/menu/rechargement/Continuer sont natives et comparées intégralement, sans ignorer les registres persistants.

Le navigateur local a été refusé avant navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`). Aucune capture locale ou réussite visuelle locale n'est revendiquée. Les résultats distants, leurs SHA et leurs limites doivent être lus sur le commit final de la PR. Les tests natifs locaux utilisent Node 22.16.0 ; les tests WebSocket locaux utilisent l'implémentation réelle embarquée dans le Playwright installé, via un adaptateur non distribué. Le workflow réinstalle les dépendances verrouillées avec `npm ci` : ces deux environnements ne sont pas confondus.

## Hors de cette passe

Le gibier sauvage 190 conserve sa conversion historique en provisions : seules les matières brutes déjà produites dans les enclos sont transportées ici. Pas de viande sauvage nouvellement inventée, de cage portable, de transfert d'animaux, de véhicule frigorifique, de vente, de vêtements, de tournée de PNJ ou de monde partagé autoritaire. Les migrations longues, la vie civile et les intérieurs libres restent ouverts. Les graines, biomes, routes et dimensions des bâtiments ne sont pas modifiés.
