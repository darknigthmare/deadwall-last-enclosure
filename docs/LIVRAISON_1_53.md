# DEADWALL 1.53 — Monde, cohérence et fluidité

## Changements jouables

Les manipulations des modules essentiels exigent un commandant disponible, à pied et hors recharge, poste manuel ou travail concurrent. Les boutons utilisent les mêmes consultations pures que les transactions ; une action refusée ne déplace ni contenu ni ressource. Les soins restent limités par les blessés réels et la capacité finie du kit.

Les transferts des caches locales respectent également ces occupations. Les interventions régionales évaluent les individus vivants réellement proches et observables, avec leur étage et les obstacles physiques. Un centroïde de horde à travers une façade ne bloque plus seul une opération ; un individu proche ne disparaît plus du contrôle parce que le centre du groupe est loin.

Le retrait d’un compagnon refuse les commandes après défaite, mort ou hors partie. La migration extérieure et ses événements continuent pendant une visite à l’étage ; les contacts et attaques restent dans leur domaine physique. Les sauvegardes v20 et les cartes G1–G7 sont conservées.

## Catalogue graphique

| Catalogue | Variantes fournies | Raccordements |
| --- | ---: | --- |
| Nature | 100 | Neuf essences × quatre, quatre roches × quatre, huit décors × quatre ; souches, grumes et arbres brûlés selon les propriétaires. |
| Objets du monde | 112 | Décors, ressources historiques, éclairages, modules essentiels, opérations, objets routiers et de cour ; deux variantes, quatre pour la ferraille. |
| Intérieurs | 66 | Trente-deux familles de meubles et distributeur × deux, locaux et régionaux. |
| Toits | 32 | Seize archétypes × deux, associés aux 62 lieux existants et aux bâtiments locaux. |
| Ruines | 8 | Maison, commerce, hangar et guérite × deux. |
| Sols | 16 motifs | Bois, carrelage, béton et caoutchouc × quatre ; échelle ancrée dans le lieu. |

Le total est de **318 silhouettes**, avec 16 motifs supplémentaires, dans **21 PNG et deux SVG**. Il décrit un catalogue d’apparences, pas autant de nouvelles fonctionnalités ou de bâtiments. La sélection repose sur l’identité, la seed et, pour les intérieurs, l’étage ; elle ne consomme pas le RNG de la campagne. Les rectangles mesurés incluent les silhouettes entières et excluent les voisins. Les sources rejetées et les générations corrigées sont documentées ; aucun PNG final n’a été détouré ou retouché par un script.

Les textures respectent les emprises, rotations et projections des propriétaires. Les ouvertures, fouilles, stocks finis, destruction, ombres, barres d’intégrité, portes et escaliers restent issus du jeu. L’orientation des étagères locales peut suivre leur axe physique. Les éclairages n’émettent que dans leur état actif. Les barricades décorent leurs faces projetées sans tourner la hauteur avec le sol.

Des réserves ne sont pas présentées comme du contenu jouable : les deux images de possessions seules ne remplacent pas un blessé vivant ; le couchage roulé ne représente pas un bivouac déployé ; les quatre restes minéraux sont disponibles au catalogue mais la file régionale retire toujours les roches épuisées. Les nœuds locaux retirés après récolte ne montrent pas automatiquement une nouvelle souche. Les aiguilles, feuilles et brindilles minuscules des tuiles conservent leur peinture procédurale. Les volumes de bâtiments, clôtures, routes, entrées et indicateurs d’action gardent les tracés physiques existants. Le repli historique reste utilisable si une nouvelle image manque.

## Optimisation

Le cache des emprises d’annexes évite de reconstruire leurs positions et boîtes à chaque microdéplacement. Il est invalidé par la création, construction, restauration, nouveau monde, seed ou génération ; les fondations réservent le même sol avant et après achèvement. La comparaison native porte sur 13 230 résultats piétons/véhicules identiques. Les gains de ce microprofil ne constituent pas des gains FPS.

Le cache graphique conserve des découpes adaptées au transform réel du Canvas, avec un budget estimé de **8 Mio RGBA et 384 entrées**. Identité d’image, rectangle et niveau de résolution distinguent les entrées. Opacité, orientation et effets restent lus au dessin. Les quatre atlas magenta d’acteurs passent par leur rendu original, sans rééchantillonnage intermédiaire qui révélerait un fragment isolé de l’atlas historique.

Le réglage Automatique peut diminuer la densité entre un et deux après une cadence durablement lente, puis remonter après une cadence stable prolongée. Pause, onglet caché et interruption longue ne constituent pas une preuve de lenteur. Élevée conserve une densité fixe plafonnée à deux ; Légère conserve un. Le Canvas garde sa taille CSS et les mêmes coordonnées de pointeur. Le pas de simulation et la campagne ne sont pas modifiés pour améliorer un score de performance.

Les images supplémentaires représentent environ **50 Mio de PNG**. Le registre comprend 91 actifs. Le téléchargement initial et la mémoire de décodage restent des coûts réels ; les budgets des caches ne décrivent pas la mémoire totale du navigateur. Une scène de 720 individus sur le GPU logiciel du cloud n’est pas une certification d’un PC ou téléphone physique, ni une garantie de 60 FPS. Les essais de prototypes et les mesures finales sont séparés dans les rapports.

## Vérification et distribution

Commande obligatoire : `DEADWALL_SOAK=1 npm run check`. Les régressions ciblées couvrent les transactions, contacts, étages, sauvegardes, options, variantes, marges alpha, propriétaires physiques, états actifs et repli historique. Le parcours `npm run test:world-art` exerce Chromium desktop/tactile et peut viser un web extrait avec `--root` ou un HTML autonome avec `--file` ; il distingue les préparations explicites d’une progression humaine.

Les parcours historiques couvrent le début, récolte, dépôt, construction payée, hordes, exploration, visibilité, onze âges et reprise. Consulter les reçus externes de la livraison pour les commandes effectivement terminées, leurs codes de sortie, nombres d’assertions, fichiers testés et mesures de cadence. Les galeries natives sont des preuves de peinture, pas des campagnes humaines.

Le build fournit web, PWA et HTML autonome ; les images SVG intégrées utilisent leur type MIME réel. Le cache PWA devient `deadwall-v1.53.0-world-variants`. Les trois archives de livraison doivent provenir d’un commit propre, être vérifiées puis extraites indépendamment. Un push accepté et un site publié sont deux faits distincts ; la publication Vercel est confirmée contre les SHA des fichiers publics exacts.

Restent à vérifier sur matériel cible : campagnes humaines de 6–10 heures, performance et audio sur appareils physiques, ouverture autonome `file://`, fabrication/exécution Windows et critères des boutiques. Les outils cloud Linux et les profils tactiles émulés ne certifient pas ces points.
