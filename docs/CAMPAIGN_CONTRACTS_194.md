# Opérations de campagne — extension 194

Le propriétaire reste `campaign-pack.js`, enregistré comme module `campaign` dans
`expansion-kit.js`. Les sept opérations historiques sont conservées. Huit opérations
supplémentaires utilisent les mêmes stocks, le même sac et le même dépôt : aucun
stock parallèle, minuteur de production ou rescapé gratuit n’est créé.

Les paramètres de jeu sont définis dans `CampaignPackRules.definitions` de
`src/core.js`. Le tableau décrit les différences de parcours ; les devis en jeu
restent la source des coûts et des durées.

| Opération | Accès et transport | Âge requis | Fin du délai |
| --- | --- | --- | --- |
| Reconnaissance des écarts | Trois accès agricoles ou ruraux ; carnet sans colis lourd | 2 | Quatrième changement de vague |
| Ravitaillement des fermes | Deux accès agricoles ; colis chargé au départ | 3 | Troisième changement |
| Carburant conditionné | Un accès technique ; bidons portés au retour | 4 | Deuxième changement |
| Sauvetage des archives | Deux accès publics ; dossier porté après le second | 4 | Quatrième changement |
| Réserve maraîchère | Un accès agricole ; réserve scellée portée au retour | 3 | Troisième changement |
| Extraction sanitaire | Deux accès médicaux ; rescapé pris en charge au second | 5 | Troisième changement |
| Matériaux de reconstruction | Deux accès techniques ; lot porté après le second | 6 | Quatrième changement |
| Permanence de défense | Deux vagues réellement repoussées ; centre jamais sous 80 % | 7 | Pas de délai supplémentaire |

Ces huit opérations n’autorisent qu’une tentative par campagne. Un abandon, un
transport perdu ou un délai dépassé consomme définitivement cette opportunité et
le budget initial. Les fournitures de chaque accès sont prélevées dans le sac à la
fin du travail. Une interruption conserve ces fournitures et n’engage pas une
nouvelle tentative. Révéler un lieu ne crée aucun accès : les devis utilisent les
POI réellement générés et déjà découverts, avec un point de service physiquement
libre. Un ancien monde contenant trop peu de lieux compatibles refuse le départ
avec son compte de lieux disponibles.

Le transport applique une vitesse et une fragilité propres au chargement. Les
dégâts réellement reçus, locaux ou régionaux, interrompent le travail et affectent
le colis immédiatement ; un soin dans la même frame n’efface pas cet impact. Les
coups absorbés par l’invulnérabilité ne débitent rien et le contrôle au tick ne
redébite pas les blessures déjà notifiées. Pour la permanence, une réparation
payée après passage sous le seuil ne restaure pas le contrat perdu.

Le dépôt doit pouvoir recevoir la récompense entière. L’extraction sanitaire
nécessite une place de logement et une arrivée libre, puis crée un vrai ouvrier
avec l’intégrité de transport conservée. Un refus laisse le chargement intact.
La livraison ne peut être validée qu’une fois, y compris après sauvegarde/reprise.
Les délais suivent les changements réels de vague ; les menus et pauses ne
fabriquent ni temps de terrain ni vague repoussée.

La normalisation accepte exactement les registres historiques à cinq clés,
ceux à sept clés et le catalogue actuel à quinze clés. Les nouvelles entrées
sont initialisées vides sans changer les ressources. Les ensembles mixtes,
compteurs uniques impossibles et sites incompatibles sont refusés avant mutation.
Les deux défenses n’ont pas d’entrée dans `usedSites`. Le travail interactif en
cours reste annulé lors d’une reprise ; l’étape, les frais engagés, les accès,
l’intégrité, le délai et l’historique persistent.

`tests/campaign-contracts194.test.cjs` charge le vrai ordre HTML et utilise une
scène avancée explicitement préparée : réserves déclarées, lieux générés révélés,
positions déplacées et menaces proches neutralisées via un registre valide.
Les paiements, travaux, chargements, livraisons, sauvegardes et contrôles sont ceux
du jeu. Les deux vagues de permanence sont de petits assauts préparés, terminés
par le vrai directeur ; ce test ne prétend pas valider deux hordes de taille
normale ou un parcours humain de six à dix heures.

`tests/expedition-hands194.test.cjs` couvre le refus de monter dans le véhicule
pendant un vrai rechargement ou pansement, sans effacer leur durée ou leurs
fournitures. La descente reste possible. Ces tests de moteur avec DOM simulé
ne constituent pas une mesure de fluidité graphique sur appareil physique.
