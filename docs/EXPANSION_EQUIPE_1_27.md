# Équipe de terrain — extension 1.27

Cinq fonctions s’ajoutent aux quatre accompagnateurs existants. Les nouveaux réglages sont dans **Opérations → Équipe de terrain**. Le bouton **Affecter l’équipe** ouvre directement les affectations du monde vivant. Aucune ressource ni spécialité n’est offerte à l’ouverture d’une ancienne partie.

| Fonction | Interaction réelle | Contrepartie |
| --- | --- | --- |
| Ordres de terrain | Suivre, tenir exactement la position, rejoindre le point où le commandant a demandé le regroupement | Fonctionne à pied en région G4 ; les obstacles et les chemins existants restent actifs |
| Discipline de tir | Malik tire librement, seulement à quatre mètres, ou garde le silence | Le silence préserve les munitions et la discrétion mais supprime son appui ; le tir conserve bruit et coût en munitions |
| Formations | Ligne rapprochée, file pour les passages, espacement extérieur | Les positions souhaitées se replient vers le commandant lorsqu’elles sont obstruées ; pas de traversée des murs |
| Entraînement | Une spécialité permanente par accompagnateur, 45 secondes actives au dépôt pendant le calme | 20 nourriture et 12 ferraille ; un seul entraînement à la fois, arrêt hors dépôt et pendant les pauses ; annulation sans remboursement |
| Sacoches de soutien | 8 munitions, 2 médicaments et 2 ferraille au maximum par compagnon ; recharge au dépôt et remise au commandant | Stocks réellement prélevés ; partage à moins de trois mètres par accès libre ; le reliquat reste dans la sacoche si le sac est plein |

Les valeurs sont exclusivement définies dans `DeadwallCore.CompanionPackRules`.

L’entraînement améliore la portée d’observation de Léa de 20 %, la cadence de soin de Samir et celle de réparation d’Inès de 25 %, et les dégâts par tir de Malik de 20 %. Les médicaments et la ferraille consommés par point réparé ou soigné ne changent pas. Les portées physiques, les contrôles de ligne de vue et la limite de deux accompagnateurs ne changent pas.

Les sacs des personnages retirés de l’équipe restent consignés à leur nom. Ils ne sont accessibles que lorsque le personnage est de nouveau affecté. Les nouvelles commandes ne déplacent pas les ouvriers, soldats ou spécialistes de D-17 : ces unités conservent leurs propres ordres.

## Raccords

- Les ordres de marche portent sur les accompagnateurs régionaux existants. Le dépôt sert à leur affectation, à leur entraînement et à leur ravitaillement ; les nouvelles opérations se font à pied.
- Les accompagnateurs conservent leurs positions lors d’une sauvegarde/reprise, même au-delà de 180 mètres du commandant. Les coordonnées sauvegardées restent bornées et vérifiées avant de restaurer le monde.
- Un changement d’étage rétablit le suivi. L’embarquement efface l’ancienne position et rétablit le suivi ; le débarquement utilise une position libre près du véhicule.
- Changer de formation ou d’ordre invalide le chemin en cours pour ne pas continuer vers un objectif périmé.
- Pause, menus et absence du commandant du dépôt ne font pas avancer l’entraînement.
- Pendant un travail chronométré des autres extensions, les compagnons suspendent leurs soins, réparations et tirs automatiques pour préserver les fournitures engagées.
- La sacoche ajoute une réserve portée par l’accompagnateur ; elle ne recharge automatiquement ni le joueur ni ses alliés. Il faut demander le partage, puis les soins et tirs existants consomment le sac du joueur normalement.

## Persistance et API

Le registre additif `expansions127.modules.companions.version=1` conserve ordre, formation, discipline, entraînement, spécialités, sacoches et positions. Le registre commun valide toutes les extensions avant toute mutation du monde. Les anciennes sauvegardes reçoivent l’état initial vide.

`g.companionsPack` expose les actions `setOrder`, `setFormation`, `setDiscipline`, `train`, `cancelTraining`, `fill`, `share`. Les points de raccord internes `control`, `resumePosition` et `record` sont lus par le moteur régional ; ils n’ajoutent aucun second simulateur de compagnons.

Les tests sont dans `tests/companions-pack.test.cjs`. Ils exercent les déplacements et tirs natifs, le transfert de ressources, l’entraînement, la pause, la vraie sauvegarde et les transitions d’étage et de véhicule. Ils ne certifient pas la fluidité d’un navigateur ou la facilité d’une longue campagne.
