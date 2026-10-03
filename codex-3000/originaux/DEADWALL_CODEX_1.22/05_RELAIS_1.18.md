# 1.18 — Relais de ravitaillement

Ce chapitre ajoute un contrat de fonctionnement aux lieux du codex. Il ne crée pas de nouveaux types de bâtiments et ne régénère pas les campagnes. Les **500 fiches, 42 plans pilotes et 458 conceptions non intégrées** restent distincts. Les générations régionales 1, 2 et 3 demeurent inchangées.

## 1. Ce qui se trouve où

La réserve de D-17, le sac du commandant, le coffre du break et chaque relais sont des inventaires différents. Un transfert déplace une quantité, sans créer une ressource, modifier son type ou créditer le dépôt à distance. L’origine, la destination, les capacités et le montant sont revérifiés au moment du transfert.

Le dépôt de D-17 exige que le commandant soit physiquement revenu près du centre, avec un accès extérieur praticable. Le coffre exige la présence du véhicule, le même niveau et une liaison libre. Un relais utilise le contrôle d’approche du contenant : distance au bord, étage et ligne d’accès. Le menu ne change aucune de ces règles.

Les quantités proposées sont 1, 5 et le maximum possible. Le reliquat reste à sa source lorsque la destination est saturée. Les capacités de 80 pour le coffre et 60 pour un relais sont des sommes de ressources, pas 80 ou 60 par type. La capacité du sac vient des règles du personnage : ne pas la coder en dur dans les scénarios QA.

## 2. Aménager plutôt que superposer

Un relais peut réutiliser une **caisse, une armoire ou un rayonnage existant**, découvert, accessible et entièrement vidé. L’objet conserve sa géométrie, ses collisions et son identifiant. Le pilote ajoute une marque et une jauge au même dessin, pas un second coffre superposé.

L’aménagement demande **6 bois et 4 ferrailles portés**, puis **5 secondes actives** pendant le jour. Le paiement intervient à l’achèvement, après une nouvelle validation. Le relais commence vide. La limite est de **16 relais** par campagne. Retirer un relais demande sa présence et un stock vide ; les matériaux de création ne sont pas remboursés et le contenant d’origine ne se remplit pas.

Les prises originelles restent dans `frontier.taken`. Le stock déposé est dans `fieldSupplies.caches`. Ces deux registres ne doivent jamais être confondus : déposer des conserves dans une étagère vidée ne recrée pas le butin procédural de cette étagère.

## 3. Inventaire et données

La sauvegarde du jeu passe à **v17**, avec le registre additionnel suivant :

```json
{
  "fieldSupplies": {
    "version": 1,
    "reserve": 2,
    "caches": [
      {
        "id": "P0000:0:1",
        "stock": {
          "wood": 0, "scrap": 0, "stone": 0, "food": 0,
          "ammo": 0, "medicine": 0, "fuel": 0
        }
      }
    ]
  }
}
```

L’identifiant ci-dessus n’est qu’un exemple de format : le validateur doit retrouver le véritable objet dans la graine et la génération de la campagne. Il refuse les doublons, les lieux absents, les objets non compatibles ou non vidés, les ressources inconnues, les nombres négatifs/non finis et les stocks au-delà de la capacité.

Les campagnes v1 à v16 reçoivent un registre vide, sans monnaie, carburant, médicament ou cache offerte. La migration ne modifie ni la disposition des lieux, ni les stocks des contenants, ni les objectifs des infectés sauvegardés. Conserver l’export original avant de migrer : un ancien jeu ne relit pas forcément la nouvelle version.

## 4. Opérations de terrain

Un **pansement** utilise **2 médicaments du sac**, prend **4 secondes**, et restitue au maximum **35 points de vie**, dans la limite de la santé maximale. Il ne soigne pas à pleine vie, ne ranime pas et ne prélève pas le stock distant de la cité. Il peut être fait de nuit si l’accès est sûr.

Une **réparation de terrain** demande **12 ferrailles du sac**, prend **6 secondes**, et rend au maximum **50 points d’intégrité** au break, dans la limite de 320. Elle exige le jour, le véhicule présent et le conducteur descendu. Un véhicule détruit n’est pas ressuscité et son carburant n’est pas rempli par la réparation.

Le travail est interdit en présence d’un infecté visible à moins de huit mètres. Les travaux d’aménagement et de réparation émettent le signal de bruit de travail existant ; ils ne génèrent pas de nouveaux échantillons audio. La prudence du joueur ne transforme pas ce chantier en opération silencieuse.

## 5. Une action complète ou aucune dépense

L’état transitoire suit `inactif → validation → travail → nouvelle validation → paiement et effet`. Bouger, tirer, recharger, subir des dégâts, perdre les conditions d’accès ou voir arriver une menace interrompt l’opération. Les ressources ne sont ni réservées ni retirées au départ : elles sont revérifiées juste avant la fin, et aucune dépense partielle ne doit survivre à un échec.

Le temps ne progresse pas lorsque le jeu est réellement en pause. Un départ depuis le panneau referme le commandement pour reprendre la simulation. Une sauvegarde effectuée pendant une action ne mémorise pas son progrès : la reprise annule cette action, sans dépense et sans effet différé. Ce choix évite les transactions incomplètes ; le joueur peut recommencer sur place.

## 6. Prévoir l’aller et le retour

Le carnet conserve le repère et l’itinéraire proposés auparavant. Le nouveau calcul ajoute le trajet vers une jonction de D-17, une marge de détour de **25 %** et une réserve fixe réglable de **0 à 8 unités**, initialement 2.

`budget = (distance aller + distance retour) × 0,004 × 1,25 + réserve fixe`

Sans repère, on estime le retour seul. Avec un repère, on estime l’aller vers ce lieu puis le retour jusqu’à une jonction routière. Le calcul ne couvre pas automatiquement la livraison finale au centre, ne conduit pas la voiture et ne facture pas de carburant. La connaissance du carburant dans le véhicule ne rend pas ce carburant accessible à distance : il faut encore rejoindre physiquement le break pour le remplir.

L’itinéraire repose sur la voirie et des raccordements géométriques. Il ne certifie ni les obstacles présents, ni les infectés, ni les détours hors route. Ne pas remplacer la marge par la promesse « vous rentrerez forcément ».

## 7. Contrat spatial pour les 500 fiches

Conserver un chemin entre les entrées, les réserves et le véhicule. Un meuble convertible doit être approchable sur son niveau réel, sans interagir à travers le plancher. Les armoires médicales ne sont pas converties automatiquement en services de soin : les médicaments doivent être récupérés, transportés et dépensés.

Les caches ne sont pas des bâtiments de production, des points de réapparition ou des zones invulnérables. Leur contenu ne croît pas avec le temps et leur création ne remet pas les ennemis à zéro. Dans ce pilote, elles ne subissent pas de pillage ou de destruction structurelle : documenter toute extension future avant de modifier cette règle.

## 8. Vérification avant extension

Conserver les tests de migration et les empreintes de toutes les générations précédentes. Vérifier conservation des sommes lors des transferts, capacités globales, accès derrière une cloison et depuis un autre étage, annulation à la dernière fraction de seconde, absence de paiement partiel, reprise de sauvegarde et cache d’un secteur déchargé.

Les tests de capacité doivent partir de la capacité réelle du personnage. Les tests de stock ne doivent pas confondre les livraisons simultanées d’ouvriers avec une création de ressources par le système régional. Préparer explicitement les infrastructures et les objets vidés dans les scènes de QA, sans présenter ces préparations comme des campagnes humaines.
