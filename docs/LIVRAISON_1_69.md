# DEADWALL 1.69 — D-17 à échelle humaine

Les captures de la 1.68 montraient des maisons trop petites par rapport au commandant et des chantiers financés sur l’asphalte. Le défaut de placement est reproduit sur la seed 17117 : la maison en (34,10) et le Relais de service en (34,14) empiétaient réellement sur le collecteur. Une nouvelle pose à ces coordonnées est maintenant refusée avant paiement. Le contrôle compare les volumes complets, dans leur rotation, aux largeurs réelles des chaussées.

## Échelle commune

La grille de D-17 garde son contrat de 32 unités locales par mètre. Les 91 modèles du catalogue urbain ont des gabarits métriques explicites, sans changement de leurs effets, stocks ou coûts unitaires. Les supports verticaux conservent leurs dimensions déjà exprimées en mètres. Quelques repères :

| Élément | Emprise au sol |
| --- | --- |
| Centre de D-17 | 10 × 10 m |
| Maison construite ou maison du décor local | 10 × 8 m |
| Entrepôt | 12 × 10 m |
| Clinique | 10 × 8 m |
| Porte défensive | 4 × 1 m |
| Porte de maison | 1 m de large, 2,1 m de haut |
| Voiture particulière | Gabarit propre à sa catégorie |

Le toit, la façade, les ouvertures et les accessoires sont construits à partir de ces dimensions. Les textures et variantes de toit restent visuelles ; elles ne changent pas les collisions. Les étages gardent une hauteur cohérente, les armes et jauges restent raccordées à leur support, et un chantier montre son avancement. La sélection et la visibilité prennent en compte les parties hautes des bâtiments.

Le même propriétaire fournit les dimensions aux aperçus, aux fondations, à l’occupation des cellules, aux déplacements, aux ruines et à leur reconstruction. Les systèmes de véhicule, de tir et de passerelle utilisent aussi ces corps. Les ouvriers et le commandant démarrent devant la façade du centre agrandi.

## Parcelles et accès

Le quartier local révision 4 place des maisons, des stations, leurs ouvertures et des véhicules aux dimensions adaptées. Les chaussées, façades, débords de toit et accès sont réservés lors de sa génération. Un secteur de développement garde une surface utile pour les grands programmes de chantier. Les deux repères fixes qui fragmentaient ce secteur sont déplacés uniquement dans ce nouveau quartier, avec les mêmes identités et contenus.

Les 21 ensembles sont recomposés à partir des vrais bâtiments, avec des allées de service de 2 m. Le Camp conserve un périmètre fermé : ses 59 sections, bâtiments et porte sont effectivement financés. La halte donne sur l’allée intérieure. Les programmes ouverts restent ouverts sur leurs flancs ; une cour de services ne devient pas une forteresse gratuite.

Les constructions ordinaires respectent la chaussée et les voies payées, y compris celles encore en travaux. Murs, portes et pièges restent autorisés comme défenses de passage. Le devis, la confirmation et la reconstruction partagent les mêmes refus ; une consultation ne finance rien et ne réaffecte pas d’ouvrier. Voir [le contrat routier202](CITY_ROADS202.md).

## Sauvegardes et qualification

Le format général reste v20. Le champ additif `cityGeometry202:1` choisit les corps métriques du nouveau quartier. Son absence conserve les dimensions historiques ; une valeur inconnue est refusée avant de remplacer la partie chargée. Les révisions locales 1–3 ne sont pas régénérées et les bâtiments déjà financés ne sont ni déplacés ni supprimés au chargement. Pour utiliser le quartier métrique, commencer une nouvelle campagne.

Les supports verticaux des campagnes historiques conservent aussi leur contrat de placement sur les chaussées naturelles : imposer les nouvelles réservations à leur fondation de 24 × 24 m supprimait toute parcelle disponible dans l’ancien quartier. Les obstacles, les coûts et les routes financées restent contrôlés. Tous les supports des nouvelles campagnes respectent les réservations complètes.

Les tests 202 couvrent les corps tournés, les collisions, les chaussées, les ensembles, le paiement réel, le travail manuel, les accès et Continue. Les captures de comparaison utilisent Chromium sur ordinateur et deux formats mobiles ; les scènes avancées sont explicitement préparées. Une scène préparée ou un audit assisté ne prouve ni une campagne humaine complète de 6 à 10 heures ni les performances d’un téléphone physique. Les résultats de qualification et de publication doivent rester liés au commit réellement testé.
