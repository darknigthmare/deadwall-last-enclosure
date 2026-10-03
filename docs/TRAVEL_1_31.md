# Voyages lointains — quatre boucles jouables 1.31

Les opérations de **Voyages lointains** se trouvent dans le commandement. Elles utilisent le sac existant, le réservoir du véhicule et les véritables épaves de la carte. Elles ne créent pas un deuxième inventaire.

| Boucle | Condition physique | Prix / contrepartie | Résultat |
| --- | --- | --- | --- |
| Préparer le départ | À pied, auprès du dépôt de D-17, 3 s | Chaque quantité est retirée du dépôt ; place disponible dans le sac | Trois profils : reconnaissance à pied, voyage motorisé, retour de secours. Les stocks déjà portés sont conservés ; seuls les manquants sont transférés. |
| Sauver le carburant | Auprès de son véhicule garé, au sol, accès libre, 5 s | Réservoir réel et place dans le sac | Jusqu’à 6 carburants déplacés du réservoir au sac. Aucun réservoir caché ni carburant offert. |
| Réviser le moteur | Véhicule motorisé vivant et garé, 9 s | 8 ferrailles + 1 carburant dans le sac ; travaux audibles en région | Consommation réduite de 20 % sur les 2 000 prochains mètres effectivement parcourus, puis taux normal. |
| Démonter une épave | Épave régionale accessible, à l’extérieur, coffre déjà vidé, 7 s par lot | 1 ferraille d’outillage consommable, bruit à 24 m, place dans le sac | Jusqu’à 6 pièces retirées d’une réserve mécanique finie de 8 à 16 pièces par épave. Capot ouvert et compartiment démonté visibles. |

Les voitures, utilitaires et motos peuvent fournir cette réserve mécanique. Les vélos et skates restent fouillables selon leur interaction historique, sans moteur fictif à démonter. L’ancienne réserve de coffre reste dans `frontier.taken` ; le démontage ne la recharge jamais. La dernière pièce peut consommer une pièce d’outillage : aucun rendement positif n’est alors annoncé.

Les profils sont des objectifs de chargement, pas des paquets gratuits. L’ordre des fournitures priorise médicaments/rations à pied, puis carburant/pièces en voyage motorisé. Une ressource absente du dépôt ne devient pas une dette. Un sac partiellement rempli ne dépasse jamais sa capacité et aucune charge existante n’est jetée.

## Coûts de déplacement

`fuelCost(metres, rate, vehicleId)` intègre les mètres révisés et normaux dans la même tranche. `fuelDistance(fuel, rate, vehicleId)` est son inverse pour limiter physiquement le déplacement lorsque le réservoir s’épuise. `consumeDistance(metres, vehicleId)` ne retire que la distance réellement parcourue après collisions. Les déplacements locaux convertissent les unités en mètres avec le contrat existant ; le domaine régional emploie directement les mètres. Une révision ne se transmet pas à un autre véhicule et disparaît si son support est détruit. Elle ne se cumule pas tant que son autonomie n’est pas épuisée.

Le GPS, le budget aller-retour et les tournées utilisent le tarif réel du modèle de véhicule et la distance révisée restante. La remise s’applique une seule fois sur la distance totale de la tournée, sans renouvellement à chaque étape. Le budget majore la distance de 25 %, calcule la consommation mixte sur ce total, puis ajoute la réserve réglée par le joueur. Vélo, skate et tournée à pied ne demandent aucun carburant. Les devis régionaux ne comprennent pas le trajet local à travers D-17. Le panneau des chemins du retour détaille en revanche les deux domaines avec leurs tarifs distincts ; les mètres révisés dépensés en région ne sont pas réutilisés dans D-17. Les minima des expéditions locales utilisent également le modèle actif. Les raccords hors route restent des indications et ne garantissent pas un passage libre.

## Interruptions et sauvegarde

Un mouvement, tir, rechargement, changement de domaine/niveau, dégât subi, véhicule éloigné/détruit ou action concurrente annule le travail avant tout paiement. Une pause ou une modale gèle l’avancement. Les tâches inachevées ne sont pas sauvegardées ; leur coût est prélevé uniquement à l’achèvement, après une nouvelle vérification.

L’état `expansions127.modules.exploration131` est additif : `{version:1,tuning:null|{id,remaining},wrecks:[{id,recovered}]}`. Maximum 512 épaves. Identifiants, montants entiers, réserve déterministe, coffre vidé, lieu découvert, véhicule lié et capacité sont validés avant de remplacer la campagne. Les nouvelles campagnes et les fichiers sans ce module partent vides. Les caches de mondes servant à la validation sont limités à trois graines/générations.

## Région étendue et équipements existants

Les lampes de `night-gear`, appareils de `essential-state` et bivouacs de `survival-pack` acceptent désormais les coordonnées jusqu’à la taille de leur génération : 8 192 m pour G1–G4, 24 576 m pour G5. Une lecture isolée sans contexte accepte la borne maximale ; la validation de sauvegarde applique ensuite la génération du fichier. Le terrain local reste limité à 4 096 unités. Le système local `exploration125.generation` conserve son contrat G4 et n’est pas renommé G5.

## Vérifications

- `tests/exploration131.test.cjs` : 16 scénarios, dont véritables déplacements local/régional, dernière fraction de mètre révisé, conservation des stocks, épuisement, reprise, annulation, import forgé et destruction.
- `tests/travel-domains131.test.cjs` : 3 scénarios, limites des trois systèmes, refus G4 et pose/reprise réelle d’un bivouac au-delà de 12 km.
- Régression commune exploration, nuits, essentiels et bivouacs : 70 tests avant ajout des trois tests de frontières ; aucune régression constatée.
- `scripts/capture-travel131.cjs` produit les peintres réels du moteur sous DOM simulé. Ces captures ne certifient ni navigateur, ni audio physique, ni FPS GPU.
